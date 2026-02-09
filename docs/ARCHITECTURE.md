# Prestige Game Architecture

This document provides a comprehensive technical overview of the Prestige game architecture, data flow, module responsibilities, and design patterns.

## Data Flow

### Turn Execution Flow

```
User clicks action button (Card.tsx)
  ↓
Game component's handleAction() called
  ↓
turnController.executeTurn(gameState, action)
  ├─ Validates playerIndex === currentPlayerIndex
  ├─ Gets valid actions via getValidActions()
  ├─ Validates action matches a valid action
  ├─ Calls gameReducer(state, action)
  │   └─ Returns new state with action applied
  ├─ Calls awardNobles() to auto-claim eligible nobles
  ├─ Calls checkEndGame() to detect win condition
  ├─ If game still active:
  │   ├─ Is next player AI?
  │   │   ├─ YES: executeAITurn()
  │   │   │   ├─ Delays 500ms (UX: show thinking)
  │   │   │   ├─ Gets AIPlayer instance
  │   │   │   ├─ Calls aiPlayer.decideAction(state, playerState)
  │   │   │   ├─ Returns GameAction (validated)
  │   │   │   ├─ Apply via gameReducer again
  │   │   │   ├─ Award nobles
  │   │   │   ├─ Check end game
  │   │   │   └─ Loop if next player is also AI
  │   │   └─ NO: Return state (human player next)
  └─ Return final state
  ↓
Game component dispatch({ type: 'INIT_GAME', gameState: newState })
  ↓
React re-renders with new state
  ↓
UI displays updated board, scores, current player
```

### State Update Pattern

```typescript
// 1. Get current state from React reducer
const [gameState, dispatch] = useReducer(gameStateReducer, initialState);

// 2. User performs action
handleAction(action: GameAction) {
  // 3. TurnController processes action and returns new state
  const newState = await turnController.executeTurn(gameState, action);

  // 4. Dispatch state update (immutable)
  dispatch({ type: 'INIT_GAME', gameState: newState });

  // 5. React re-renders with new state
}
```

## Module Responsibilities

### src/types/index.ts
**Responsibility**: Central type definitions

Exports:
- `Color`: Gem color literal union
- `GemCost`: Gem requirement interface with optional colors
- `Card`: Game card interface (level, points, color, cost, id)
- `Noble`: Noble interface (id, points, requirement)
- `PlayerState`: Player data (gems, cards, nobles, points, name, isAI)
- `GameState`: Complete game state snapshot
- `GameAction`: Discriminated union of all possible actions

No implementation logic - pure type definitions.

### src/game/data/
**Responsibility**: Game content and constants

Files:
- `cards.ts`: LEVEL_1_CARDS, LEVEL_2_CARDS, LEVEL_3_CARDS (90 total cards)
- `nobles.ts`: NOBLES (10 nobles)
- `index.ts`: Re-exports + constants (GEMS_PER_PLAYER_COUNT, GOLD_GEMS)

No business logic - pure data definitions.

### src/game/engine.ts
**Responsibility**: Game state management and initialization

Key functions:
- `initializeGame(playerCount: number)`: Creates initial GameState
  - Creates player objects (1 human + 1-3 AI)
  - Shuffles and deals cards from each level
  - Selects random nobles (playerCount + 1)
  - Initializes gem pool based on player count
  - Returns ready-to-play GameState

- `gameReducer(state: GameState, action: GameAction)`: Pure reducer function
  - Switches on action.type
  - Delegates to handler function for each action type
  - Returns immutable new GameState
  - Exhaustive type checking with `never`

Handler functions:
- `handleTakeGems()`: Updates player and gem pool
- `handleReserveCard()`: Moves card to reserved, refills display, gives gold
- `handlePurchaseCard()`: Removes card, adds to purchased, updates points and gems
- `handleClaimNoble()`: Awards noble points and removes from pool
- `handleEndTurn()`: Auto-awards nobles, advances player index, checks phases

Utilities:
- `shuffleDeck<T>()`: Fisher-Yates shuffle
- `selectRandomNobles()`: Random selection helper
- `calculateGemsToSpend()`: Determines colored vs gold gem usage
- `subtractGems()`, `addGems()`: Safe gem arithmetic

**Invariants**:
- All updates return new state (no mutations)
- Gem pool and player gems always >= 0
- Player never exceeds MAX_GEMS_PER_PLAYER
- Cards only in one location (displayed, reserved, or purchased)

### src/game/rules.ts
**Responsibility**: Game validation and rule enforcement

Static methods (no state):
- `canTakeGems(playerGems, gemsToTake)`: Validates gem take legality
- `canAfford(playerGems, cost)`: Checks if player can afford gem cost (with gold)
- `canPurchaseCard(playerState, card)`: Wrapper checking affordability
- `canReserveCard(playerState)`: Checks not at 3 reserved cards
- `canClaimNoble(playerState, noble)`: Checks gem requirement
- `countGems(gems)`: Sums gem count
- `calculateGemDiscount(playerState, cost)`: Gets color bonuses from purchased cards
- `getEligibleNobles(state, playerIndex)`: All nobles player can claim
- `validateGemTake()`: Complete validation for gem take action
- `isGameOver(state)`: Any player has >= WINNING_POINTS

Constants:
- `MAX_GEMS_PER_PLAYER = 10`
- `MAX_RESERVED_CARDS = 3`
- `WINNING_POINTS = 15`

**Design**: All validation is deterministic and side-effect free. Used by both engine and TurnController to maintain game invariants.

### src/game/turnController.ts
**Responsibility**: Turn orchestration and game flow

Key class: `TurnController`

Public methods:
- `executeTurn(state, action)`: Main entry point for player turns
  - Validates action is legal
  - Applies via gameReducer
  - Awards nobles
  - Checks end game
  - If next player is AI, auto-execute their turn(s)
  - Returns final state

- `executeAITurn(state)`: Handle AI decision chain
  - Loops while current player is AI and game active
  - Gets AIPlayer instance
  - Delays 500ms (UX: show thinking)
  - Calls decideAction() to get GameAction
  - Applies and awards nobles
  - Checks end game
  - Continues if next player is also AI

- `checkEndGame(state)`: Game phase transitions
  - Detects when any player reaches WINNING_POINTS
  - Transitions to 'endGame' phase
  - Gives each remaining player one final turn
  - Sets winner and transitions to 'finished'

Private helper methods:
- `getValidActions(state, playerIndex)`: Returns all legal actions
  - Combines gem takes, reservations, purchases, noble claims, end turn
  - Used for action validation

- `getValidGemTakes()`: Generates all valid gem take actions
- `getValidReservations()`: Cards that can be reserved
- `getValidPurchases()`: Affordable cards in display and reserved
- `getValidNobleClaims()`: Nobles player can claim
- `isActionValid()`: Matches action against valid actions set
- `awardNobles()`: Auto-claims eligible nobles (called after each turn)
- `advanceToNextPlayer()`: Moves to next player index (circular)

**Design**: Separates validation (what's legal) from execution (applying state changes). Enables AI chaining with proper turn flow.

### src/ai/aiPlayer.ts
**Responsibility**: AI opponent strategies

Class: `AIPlayer`

Public method:
- `decideAction(gameState, playerState)`: Selects action based on difficulty
  - Routes to difficulty-specific strategy method
  - Always returns a valid GameAction

Private strategy methods:

**easyStrategy()**: Learning difficulty
- Returns random valid move with 30% purchase bias
- No lookahead
- Unpredictable but beatable

**mediumStrategy()**: Competitive difficulty
- 40% chance to pick random action (unpredictability)
- Prioritizes:
  1. Purchase cards leading to nobles
  2. Purchase high-value affordable cards
  3. Collect gems for next purchase
  4. Reserve high-value cards
  5. End turn
- Uses card evaluation and gem planning

**hardStrategy()**: Challenge difficulty
- No randomness (except card selection within tier)
- Prioritizes:
  1. Purchase cards completing noble requirements
  2. Purchase highest-point affordable cards
  3. Plan gem collection for expensive cards (2-3 turn lookahead)
  4. Reserve high-value or opponent-blocking cards
  5. Collect gems for gem-hungry cards
  6. End turn
- Predicts opponent needs for blocking strategy
- Evaluates cards on points + noble value + rarity

Helper methods (all private):
- `evaluateCard()`: Scores card 0-100 (points * 15 + noble bonus * 10 + rarity + color diversity)
- `findBestGemCollection()`: Determines optimal gem take from multiple target cards
- `shouldReserveCard()`: Decides if card worth reserving
- `getReachableNobles()`: Nobles within 0-2 colors
- `predictOpponentNeeds()`: Finds cards opponents might want
- `getReservableCards()`: Available cards under limit
- `getAffordableCards()`: Cards player can purchase
- `getValidGemMoves()`: All legal gem takes
- `canAffordWithGold()`: Checks affordability with gold threshold
- `countMissingColors()`: For noble requirement distance
- `meetsNobleRequirement()`: Checks if cards satisfy noble
- `cardMatchesRequirement()`: Blocking heuristic
- `countGemCost()`: Total gem cost of card
- `generateColorCombinations()`: Utility for color subsets

**Design**: Strategies share a pool of helper methods. Difficulty determines how much lookahead and randomness. Easy is highly stochastic, hard is deterministic with planning.

### src/components/
**Responsibility**: React UI

Files:
- **Game.tsx**: Root component
  - Initializes gameState via initializeGame()
  - Creates AI players and TurnController
  - Handles action execution via turnController.executeTurn()
  - Dispatches state updates
  - Renders GameBoard or GameOver based on phase
  - Shows loading/error states

- **GameBoard.tsx**: Main game display
  - Renders gem pool, displayed cards (3 levels), nobles
  - Renders player dashboards
  - Renders action buttons
  - Routes user actions to onAction callback

- **PlayerDashboard.tsx**: Player info
  - Shows gems, purchased cards, reserved cards
  - Shows score and nobles
  - Highlight current player

- **Card.tsx**: Clickable card component
  - Shows card level, points, cost, color bonus
  - Clickable to select for purchase/reserve

- **GemPool.tsx**: Gem availability display
  - Shows available gems of each color
  - May be clickable for gem take action

- **ActionButtons.tsx**: Action selection
  - Purchase button (for selected card)
  - Reserve button (for selected card)
  - Take gems button (for selected gems)
  - End turn button

- **GameOver.tsx**: End game screen
  - Displays winner
  - Shows final scores
  - Restart button

**Pattern**: Unidirectional data flow. State flows down as props. Events bubble up via callbacks to parent. All state logic in Game.tsx with TurnController.

## State Management Pattern

### React useReducer Pattern

```typescript
const [gameState, dispatch] = useReducer(gameStateReducer, initialState);

// Custom wrapper reducer:
function gameStateReducer(
  state: GameState | null,
  action: GameAction | { type: 'INIT_GAME'; gameState: GameState }
) {
  if ('gameState' in action) {
    return action.gameState;  // INIT_GAME
  }
  if (state === null) return null;
  return gameReducer(state, action as GameAction);  // Regular actions
}
```

### Action Execution Flow

```typescript
// User clicks purchase button
await handleAction({
  type: 'PURCHASE_CARD',
  playerIndex: 0,
  card: selectedCard
});

// Handler:
async function handleAction(action: GameAction) {
  const newState = await turnController.executeTurn(gameState, action);
  dispatch({ type: 'INIT_GAME', gameState: newState });
  // Re-render with new state
}
```

### Why This Pattern

1. **Immutability**: Each action creates new state, no accidental mutations
2. **Type Safety**: GameAction is discriminated union, TypeScript ensures correctness
3. **Testing**: Pure functions (reducer) easy to unit test
4. **Debugging**: Can log all actions for replay/undo
5. **Scalability**: Easy to add new action types
6. **Async Support**: useEffect handles AI decisions outside render

## Game Phase Transitions

```
[setup] (initial state)
  ├─ First player takes action
  └─ After first full round, advance to [active]
     ↓
[active] (normal gameplay)
  ├─ Any player reaches WINNING_POINTS
  └─ Transition to [endGame]
     ↓
[endGame] (final round)
  ├─ Each remaining player gets one turn
  ├─ All players complete final turn
  └─ Determine winner
     ↓
[finished] (game complete)
  ├─ Display winner
  └─ Offer restart
```

Note: Setup phase exists to ensure fair play (all players get first turn in setup before game starts).

## AI Integration

### AI Turn Execution

```
TurnController.executeAITurn(state)
  ├─ Check: Is next player AI?
  ├─ If YES:
  │   ├─ Get AIPlayer instance: aiPlayer = aiPlayersMap.get(playerIndex)
  │   ├─ Delay 500ms (UX: show "AI Thinking")
  │   ├─ Call: action = aiPlayer.decideAction(state, playerState)
  │   ├─ Apply: newState = gameReducer(state, action)
  │   ├─ Award: newState = awardNobles(newState, playerIndex)
  │   ├─ Check: newState = checkEndGame(newState)
  │   ├─ If game still active, loop to Check next player
  │   └─ Return newState
  └─ If NO: Return state (human player next)
```

### Difficulty Assignment

```typescript
// In Game.tsx initialization
for (let i = 1; i < totalPlayers; i++) {
  const difficulty =
    i === 1 ? 'hard' :        // First AI opponent: hard
    i === 2 ? 'medium' :      // Second: medium
    'easy';                   // Third: easy
  aiPlayers.set(i, new AIPlayer(`ai-${i}`, difficulty));
}
```

### Decision Process

1. **Get valid actions**: TurnController.getValidActions() provides all legal moves
2. **Evaluate**: AIPlayer.decideAction() selects best move using strategy
3. **Validate**: Action is guaranteed valid (only from valid actions set)
4. **Apply**: gameReducer applies action to state

No AI action goes unvalidated - GameRules enforced before execution.

## Component Hierarchy

```
<Game> (state management, AI orchestration)
  │
  ├─ gameState: GameState | null
  ├─ isLoading: boolean
  ├─ error: string | null
  │
  └─ Conditional Render:
     │
     ├─ if !gameState: Loading skeleton
     │
     ├─ if gameState.phase === 'finished': <GameOver>
     │   ├─ winner: PlayerState
     │   ├─ allPlayers: PlayerState[]
     │   └─ onRestart callback
     │
     └─ else: <GameBoard>
         │
         ├─ gameState: GameState (passed down)
         ├─ onAction: (GameAction) => void
         ├─ isLoading: boolean
         ├─ isCurrentPlayerAI: boolean
         │
         ├─ Gem Pool Section
         │   └─ <GemPool>
         │       └─ Displays available gems
         │
         ├─ Cards Section
         │   ├─ Level 1 Cards
         │   │   └─ <Card>[] (clickable)
         │   ├─ Level 2 Cards
         │   │   └─ <Card>[]
         │   └─ Level 3 Cards
         │       └─ <Card>[]
         │
         ├─ Nobles Section
         │   └─ Available Nobles (display only)
         │
         ├─ Players Section
         │   └─ <PlayerDashboard>[]
         │       ├─ Gems display
         │       ├─ Purchased cards
         │       ├─ Reserved cards
         │       ├─ Score
         │       └─ Nobles
         │
         └─ Actions Section
             └─ <ActionButtons>
                 ├─ Purchase button
                 ├─ Reserve button
                 ├─ Take gems button
                 └─ End turn button

Data flow: Top-down (state via props)
Event flow: Bottom-up (callbacks)
```

## Testing Strategy

### Unit Testing

**GameRules** (100% coverage target)
- Test each validation method with valid/invalid inputs
- Edge cases: gem limits, discount calculations, noble requirements
- Use mock GameState objects

**Engine** (90%+ coverage)
- Test each handler function (TAKE_GEMS, PURCHASE_CARD, etc.)
- Test state immutability
- Test shuffle and selection randomness

**TurnController** (85%+ coverage)
- Test action validation
- Test AI turn chaining
- Test phase transitions

**AIPlayer** (80%+ coverage)
- Test each strategy returns valid action
- Test helper methods (evaluation, planning)
- Test decision-making with fixed game states

### Integration Testing

- Full turn cycles (player action → AI response)
- Game over detection and final round
- Noble auto-awarding
- Gem economy balance

### Component Testing

- Render without crash
- Click buttons dispatch correct actions
- Display updates on state change

## Performance Considerations

### Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Take gems | O(1) | Constant gem colors |
| Purchase card | O(n) | n = all displayed + reserved cards |
| AI decision (easy) | O(n) | n = ~20 valid actions |
| AI decision (medium) | O(n²) | Evaluates multiple strategies |
| AI decision (hard) | O(n²) | Multi-turn lookahead |
| Component render | O(m) | m = cards displayed |

### Memory Usage

| Component | Size |
|-----------|------|
| Full GameState | ~2 MB |
| Card object (90 total) | ~200 bytes each |
| PlayerState (4 max) | ~500 bytes each |
| AI cache (if added) | ~1 MB |

### Browser Performance

Typical numbers:
- Game initialization: < 100ms
- Turn execution (human): < 50ms
- Turn execution (AI easy): 500-700ms (includes 500ms delay)
- Turn execution (AI hard): 800-1000ms (includes 500ms delay)
- Component re-render: 50-100ms
- Total game responsiveness: Good (AI delays visible to user)

### Optimization Opportunities

1. Memoize expensive evaluations in AI
2. Use Map for O(1) card/noble lookups if needed
3. Consider lazy evaluation of valid actions
4. Cache board state for quick resets (undo feature)
5. Web Worker for AI decisions (future, separate hard AI to worker thread)

## Error Handling

### Invalid Actions

```typescript
// TurnController prevents before reducer
if (!isActionValid(action, validActions)) {
  throw new Error(`Invalid action: ${action.type}`);
}
```

### Game Rule Violations

```typescript
// GameRules methods prevent in engine handlers
if (!GameRules.canAfford(playerGems, cost)) {
  throw new Error('Cannot afford this card');
}
```

### Unexpected States

```typescript
// Exhaustive type checking in reducer
default:
  const _exhaustive: never = action;
  return _exhaustive;  // Compile error if case missing
```

### AI Failures

```typescript
// Fallback if AI throws
try {
  const action = aiPlayer.decideAction(state, player);
} catch (e) {
  // Fallback to END_TURN
  return { type: 'END_TURN', playerIndex };
}
```

### React Errors

```typescript
// Error state in Game component
const [error, setError] = useState<string | null>(null);

try {
  const newState = await turnController.executeTurn(gameState, action);
  dispatch({ type: 'INIT_GAME', gameState: newState });
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}
```

Future: Add error boundary component for graceful error UI.

## Extensibility

### Adding New Action Type

1. Add to `GameAction` union in `src/types/index.ts`:
```typescript
export type GameAction =
  | { type: 'PURCHASE_CARD'; playerIndex: number; card: Card }
  | { type: 'MY_NEW_ACTION'; playerIndex: number; myData: string }
  | ...
```

2. Add handler in `src/game/engine.ts`:
```typescript
case 'MY_NEW_ACTION':
  return handleMyNewAction(state, action);

function handleMyNewAction(state, action) {
  return { ...state, /* update state */ };
}
```

3. Add validation in `src/game/rules.ts`:
```typescript
static canDoMyNewAction(playerState: PlayerState): boolean {
  return /* check condition */;
}
```

4. Add to valid actions in `src/game/turnController.ts`:
```typescript
if (GameRules.canDoMyNewAction(player)) {
  validActions.push({ type: 'MY_NEW_ACTION', playerIndex });
}
```

### Adding New AI Strategy

1. Add method to `AIPlayer` class:
```typescript
private legendStrategy(
  gameState: GameState,
  playerState: PlayerState,
  playerIndex: number
): GameAction {
  // Advanced planning logic
}
```

2. Call from `decideAction()`:
```typescript
if (this.difficulty === 'legend') {
  return this.legendStrategy(gameState, playerState, playerIndex);
}
```

3. Assign in Game.tsx:
```typescript
const difficulty =
  i === 1 ? 'hard' :
  i === 2 ? 'legend' :  // New!
  'medium';
```

## Debugging Guide

### Trace a Turn

1. Click action in UI → Game.handleAction()
2. Call turnController.executeTurn()
3. Check TurnController.isActionValid()
4. Apply gameReducer()
5. Call TurnController.awardNobles()
6. Call TurnController.checkEndGame()
7. If AI next, TurnController.executeAITurn()

Add console.log at each step to trace.

### Check Game Rules

- See `src/game/rules.ts` for all validations
- Constants: MAX_GEMS_PER_PLAYER (10), MAX_RESERVED_CARDS (3), WINNING_POINTS (15)
- Always use GameRules methods, never inline checks

### Profile AI Decision

```typescript
const start = performance.now();
const action = aiPlayer.decideAction(state, player);
const duration = performance.now() - start;
console.log(`AI decision took ${duration}ms`);
```

Hard difficulty should take 300-500ms (before 500ms delay).

### Test Type Safety

```bash
npm run type-check
```

Must pass with no errors before committing.

### Run Full Test Suite

```bash
npm test -- --coverage
```

Should show 70%+ coverage. Focus on GameRules (100%) and Engine (90%+).
