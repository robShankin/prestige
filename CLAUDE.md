# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Splendor Game** is a TypeScript/React web application implementing a single-player Splendor card game with 1-3 AI opponents. The project uses TypeScript for type safety, Jest for testing, and React for the user interface.

## Directory Structure

```
src/
├── types/          # TypeScript type definitions (GameState, PlayerState, Card, etc.)
├── game/           # Core game logic (rules, state management, game flow)
├── ai/             # AI player implementation with difficulty levels
├── components/     # React UI components
└── __tests__/      # Jest test files (colocated with implementation)
public/            # Static HTML and assets
```

## Common Commands

### Development
- `npm install` - Install dependencies
- `npm run dev` - Start dev server at http://localhost:3000
- `npm run build` - Build for production

### Testing & Quality
- `npm test` - Run jest test suite once
- `npm run test:watch` - Run tests in watch mode (re-run on changes)
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - Run ESLint to check code style
- `npm run type-check` - Run TypeScript compiler without emitting code (catches type errors)

### Testing Single Files
- `npm test -- GameRules` - Run tests matching a filename pattern
- `npm test -- --testPathPattern=game` - Run tests in a specific directory
- `npm test -- --coverage --coveragePathIgnorePatterns=__tests__` - Run coverage for specific files

## Architecture & Design

### Game Logic Layer (`src/game/`)
- **engine.ts**: Game state management and initialization
  - `initializeGame()`: Sets up a new game with specified player count
  - `gameReducer()`: Immutable state reducer for all game actions
  - Handles: gem collection, card purchase, reservation, noble claiming
  - Utilities: `shuffleDeck()`, `calculateGemsToSpend()`, gem arithmetic functions

- **rules.ts**: Contains `GameRules` class with static validation methods
  - `canTakeGems()`, `canAfford()`, `canPurchaseCard()`, `canReserveCard()`
  - `calculateGemDiscount()`: Computes gem bonuses from purchased cards
  - `getEligibleNobles()`: Identifies nobles player can claim
  - `isGameOver()`: Checks win condition
  - Constants: `MAX_GEMS_PER_PLAYER` (10), `MAX_RESERVED_CARDS` (3), `WINNING_POINTS` (15)

- **turnController.ts**: Turn orchestration and game flow
  - `executeTurn()`: Processes player actions with validation
  - `executeAITurn()`: Auto-chains AI turns with 500ms delay
  - `checkEndGame()`: Manages endGame phase and final round
  - Validates actions against game rules before execution

- **data/**: Game content (cards, nobles, gem pools)
  - LEVEL_1_CARDS, LEVEL_2_CARDS, LEVEL_3_CARDS: Pre-defined card sets
  - NOBLES: Noble definitions with gem requirements
  - GEMS_PER_PLAYER_COUNT, GOLD_GEMS: Resource constants

Game state is immutable and passed as a single `GameState` object. Actions are dispatched as `GameAction` union types for easy tracking and undo/replay capability.

### AI System (`src/ai/`)
- **aiPlayer.ts**: `AIPlayer` class with three difficulty levels
  - `decideAction()`: Main entry point called each turn
  - **easy**: Random moves with 30% purchase bias (learning difficulty)
  - **medium**: Balanced strategy with 40% randomness (competitive)
  - **hard**: Multi-turn planning with noble pursuit (challenging)
  - Helper methods: card evaluation, gem planning, opponent prediction
  - Strategy methods: `easyStrategy()`, `mediumStrategy()`, `hardStrategy()`

### Type System (`src/types/`)
- **index.ts**: Central type definitions exported as module
  - `Color`: Gem colors (red, blue, green, white, black, gold)
  - `GemCost`: Object with optional color properties (used for both card costs and gem pools)
  - `Card`: Game card with level, points, color bonus, and gem cost
  - `PlayerState`: Tracks player resources, cards, nobles, and points
  - `GameState`: Complete game state snapshot with phase tracking
  - `GameAction`: Discriminated union for type-safe action dispatching

### UI Components (`src/components/`)
- **Game.tsx**: Root component managing game initialization and state
  - Accepts `numberOfOpponents` (1-3) as prop
  - Initializes TurnController with AI players
  - Handles action execution and error states
  - Renders game board and game over screen
  - `useReducer` pattern with custom gameStateReducer

- **GameBoard.tsx**: Main game display
- **PlayerDashboard.tsx**: Player stats and resources
- **Card.tsx**, **GemPool.tsx**, **ActionButtons.tsx**: UI subcomponents
- **GameOver.tsx**: End game screen with winner display

### Testing Strategy
- Tests live in `src/__tests__/` directory (can be colocated in `__tests__` subdirectories within feature folders)
- Use `.test.ts` or `.spec.ts` suffixes
- Test game rules and AI logic thoroughly; component tests focus on behavior not implementation
- Coverage targets:
  - Overall: 70% across branches, functions, lines, statements
  - GameRules: 100% (critical game logic)
  - Engine: 90%+ (state management)
  - TurnController: 85%+ (turn orchestration)
  - AI: 80%+ (strategy logic)

## Game Engine Flow

```
User Action (UI Button Click)
  ↓
Game Component Dispatch
  ↓
TurnController.executeTurn(gameState, action)
  ├─ Validates action against current player
  ├─ Calls gameReducer(state, action)
  ├─ Awards eligible nobles
  ├─ Checks end game condition
  └─ If next player is AI, call executeAITurn()
      ├─ 500ms delay (UX: show thinking)
      ├─ AIPlayer.decideAction() → GameAction
      ├─ Apply via gameReducer
      ├─ Award nobles
      ├─ Check end game
      └─ Repeat if next player is AI
  ↓
New GameState
  ↓
UI Re-renders (new state)
```

## State Management Pattern

Uses React `useReducer` with custom dispatcher:

```typescript
const [gameState, dispatch] = useReducer(gameStateReducer, initialGameState);

// To execute an action:
const newState = await turnController.executeTurn(gameState, action);
dispatch({ type: 'INIT_GAME', gameState: newState });
```

Benefits:
- Single source of truth (gameState in React)
- Immutable updates (gameReducer returns new state)
- Type-safe actions (discriminated union)
- Async support (async/await for AI with delays)
- Full action history for potential undo/replay

## Component Hierarchy

```
Game (root, state + dispatch)
├── GameBoard (main game view)
│   ├── Card (clickable, selectable)
│   ├── GemPool (selectable)
│   ├── ActionButtons (purchase/reserve/take gems)
│   └── PlayerDashboard[] (multiple)
│       ├── Gems display
│       ├── Purchased cards
│       ├── Reserved cards
│       └── Score display
└── GameOver (modal view, winner display)
```

Data flows down, events bubble up via callbacks.

## Code Patterns

### Type-Safe Game Actions
Instead of using string-based actions, always use the `GameAction` discriminated union:

```typescript
const action: GameAction = { type: 'PURCHASE_CARD', playerIndex: 0, card: myCard };
// TypeScript ensures card is provided only for PURCHASE_CARD actions
```

### Gem Cost Calculations
Use `GemCost & { gold: number }` for gem pools. Access properties safely:

```typescript
const red = playerGems.red || 0;  // Default to 0 if undefined
```

### AI Strategy Hierarchy

Each difficulty level implements a strategy as a separate method. Extend by adding new methods:

```typescript
// Easy: ~30% purchase bias, mostly random
private easyStrategy(gameState, playerState, playerIndex): GameAction
  → Collects random valid moves with purchase weighting

// Medium: 40% randomness with goal pursuit
private mediumStrategy(gameState, playerState, playerIndex): GameAction
  → Prioritizes nobles, affordability, card evaluation
  → Mixes strategy with unpredictability

// Hard: Multi-turn planning, blocking strategy
private hardStrategy(gameState, playerState, playerIndex): GameAction
  → Aggressive noble pursuit with card evaluation
  → Reserves opponent-blocking cards
  → Plans gem collection for expensive cards

// To add new difficulty:
private legendStrategy(gameState, playerState, playerIndex): GameAction {
  // Advanced Monte Carlo or minimax logic here
}
```

All strategies share helper methods for card evaluation, gem planning, and opponent prediction.

## Setup & Installation

1. Run `npm install` to install all dependencies
2. Run `npm run type-check` to verify TypeScript configuration
3. Run `npm run dev` to start the development server
4. Run `npm test` to verify the test suite works

## Key Implementation Notes

- **Immutability**: Keep `GameState` immutable; create new objects for state updates
- **Type Safety**: Leverage TypeScript's strict mode; avoid `any` types
- **Testing**: Game rules should be 100% covered; test edge cases for gem arithmetic
- **AI Extensibility**: New difficulty levels should be added as new strategy methods in `AIPlayer`
- **Path Aliases**: Use `@/`, `@game/`, `@components/`, `@ai/`, `@types/` for clean imports

## Future Implementation Priorities

1. **Game State Engine**: Reducer or state management for action dispatching
2. **Card Deck Generator**: Initialize and shuffle card decks (levels 1-3)
3. **Noble Management**: Automatically award nobles when player requirements are met
4. **Turn Flow Controller**: Manage game phases (setup → active → endGame → finished)
5. **UI Board**: Display cards, gem pools, player scores, and action buttons
6. **AI Training**: Profile AI strategies and tune difficulty parameters

## Debugging Tips

- Use `npm run test:watch` during development to catch type and logic errors immediately
- Run `npm run type-check` before committing to catch TypeScript errors
- Check `GameRules` methods when debugging gem/card logic
- Add debug logging in `AIPlayer.decideAction()` to trace AI decision-making
