# Prestige: A Strategic Card Game

**Prestige** is a single-player strategic card game inspired by Splendor, built with TypeScript and React.

## Overview

In Prestige, you compete against 1-3 AI opponents to reach 15 prestige points by collecting gems and purchasing cards. Each card provides permanent gem bonuses and prestige points. Nobles provide additional prestige when you satisfy their requirements.

## How to Play

### Objective
Be the first player to reach 15 prestige points.

### Your Turn
On your turn, choose ONE action:

1. **Take Gems**
   - Take 2 gems of the same color, OR
   - Take 3 gems of different colors
   - Cannot exceed 10 gems total
   - Gold gems can substitute for any color

2. **Reserve a Card**
   - Place a card face-down to buy later
   - Receive 1 gold gem
   - Cannot reserve more than 3 cards

3. **Purchase a Card**
   - Spend gems (colored + gold) to buy
   - Card provides permanent gem bonuses
   - Receive prestige points
   - Discard remaining gems if over 10 limit

4. **Claim a Noble** (automatic)
   - When you have enough gem bonuses, nobles are auto-claimed
   - Each noble gives 3 prestige points

5. **End Turn**
   - Pass your turn to the next player

### End Game
When any player reaches 15 points, the game enters final round. Each remaining player gets one final turn. Highest score wins!

## AI Difficulty Levels

- **Easy**: Random moves, good for learning
- **Medium**: Balanced strategy, competitive
- **Hard**: Advanced planning, challenging

## Quick Start

1. Install dependencies:
   ```
   npm install
   ```

2. Start development server:
   ```
   npm run dev
   ```

3. Open http://localhost:3000 and click "Start Game"

## Game Rules

### Gems
- **Colored Gems**: Red, Blue, Green, White, Black
  - Purchased cards provide permanent bonuses
  - Each player limited to 10 gems maximum

- **Gold Gems**
  - Can substitute for any color
  - Available from reserved cards (1 gold per reserve)
  - Limited pool of 5

### Cards
- **Level 1**: Worth 0-1 points, cost 2-4 gems (40 cards)
- **Level 2**: Worth 1-3 points, cost 5-7 gems (30 cards)
- **Level 3**: Worth 3-5 points, cost 7-10 gems (20 cards)

Each card provides a permanent gem bonus of one color.

### Nobles
- 10 nobles available, each worth 3 prestige points
- Claimed automatically when you have the required gem bonuses
- Example: Noble requiring 4 red + 5 blue gems claimed when you have those bonuses

### Turn Order
1. Current player chooses action
2. If current player is AI, it automatically decides
3. After player action, eligible nobles are auto-claimed
4. Turn passes to next player

## Development

### Available Scripts

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm test` - Run tests once
- `npm run test:watch` - Watch mode
- `npm run test:coverage` - Coverage report
- `npm run lint` - Lint check
- `npm run type-check` - TypeScript check

### Project Structure

```
src/
├── types/           # Game type definitions
├── game/            # Core game logic
│   ├── data/        # Card and noble definitions
│   ├── engine.ts    # Game state management
│   ├── rules.ts     # Validation logic
│   └── turnController.ts  # Turn orchestration
├── ai/              # AI player strategies
├── components/      # React UI components
└── __tests__/       # Test suites
```

### Test Coverage

Target: 70%+ overall coverage
- GameRules: 100%
- Engine: 90%+
- TurnController: 85%+
- AI: 80%+

Run tests:
```
npm test
```

## Game Design

### Balance Philosophy
- **Gem Economy**: Limited gems encourage strategic collection
- **Card Diversity**: Multiple paths to victory (points + nobles)
- **AI Depth**: Easy/Medium/Hard difficulties for progression
- **Turn Flow**: Fair endgame (all players get equal final turns)

### Architecture
Single-player immutable game state managed by reducer pattern. All actions validated through GameRules class. AI uses difficulty-based strategies. React UI dispatches actions and displays state reactively.

## Known Limitations

- Browser-only (no desktop build yet)
- No multiplayer (AI-only opponents)
- No save/load (games start fresh)
- No animations between turns (instant updates)

## Future Enhancements

- [ ] Undo/Replay system
- [ ] Persistent stats tracking
- [ ] Electron desktop build
- [ ] Online multiplayer
- [ ] Custom card set editor
- [ ] Tutorial/Story mode

## Contributing

To add new features:
1. Follow TypeScript strict mode (no any types)
2. Add tests with 70%+ coverage
3. Update CLAUDE.md architecture docs
4. Submit PR with clear description

## License

MIT
