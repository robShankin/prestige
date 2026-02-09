# 🚀 Next Session Runbook - Prestige Game

**Last Updated**: 2026-02-09
**Status**: Production Ready ✅

---

## Quick Start (5 minutes)

```bash
cd /Users/robert.shankin/codingRepo/gameLikeSplendor

# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run verification checks
npm run type-check    # Should show 0 errors
npm run lint          # Should show 0 errors
npm test              # Should show 229/229 passing

# 3. Start dev server
npm run dev
# Navigate to http://localhost:3000
```

---

## Project Status at Handoff

### ✅ Completed
- **Core Game Logic**: Fully implemented, immutable state management
- **AI System**: 3 difficulty levels (easy/medium/hard) with planning algorithms
- **React UI**: 7 components with responsive design, dark theme
- **Test Suite**: 229 tests, 79.10% coverage (exceeds 70% target)
- **Documentation**: Complete (4 guides + JSDoc on all public APIs)
- **Code Quality**: 0 TypeScript errors, 0 ESLint errors

### Quality Metrics
| Metric | Result | Target |
|--------|--------|--------|
| Tests Passing | 229/229 ✅ | 100% |
| Coverage | 79.10% ✅ | 70% |
| TypeScript Errors | 0 ✅ | 0 |
| ESLint Errors | 0 ✅ | 0 |
| GameRules Coverage | 100% ✅ | 100% |

### Git Status
```
Branch: main
Status: working tree clean
All code committed and ready
```

---

## Project Structure

```
src/
├── types/                    # TypeScript definitions
├── game/
│   ├── data/                # 90 cards, 10 nobles
│   ├── engine.ts            # State management (580 lines)
│   ├── rules.ts             # Game validation (210 lines)
│   └── turnController.ts    # Turn flow orchestration (340 lines)
├── ai/
│   └── aiPlayer.ts          # AI strategies (580 lines)
├── components/              # 7 React components
│   ├── Game.tsx
│   ├── GameBoard.tsx
│   ├── Card.tsx
│   ├── PlayerDashboard.tsx
│   ├── GemPool.tsx
│   ├── ActionButtons.tsx
│   ├── GameOver.tsx
│   └── ErrorBoundary.tsx
└── __tests__/               # 229 tests (10 test files)
```

---

## Available Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Testing
npm test                 # Run all 229 tests once
npm run test:watch      # Re-run tests on file changes
npm run test:coverage   # Generate coverage report

# Quality
npm run type-check      # TypeScript type checking
npm run lint            # ESLint code style

# Production
npm run build           # Create production bundle
```

---

## Key Architecture Patterns

### 1. Immutable State Management
```typescript
// Game state never mutated, reducer returns new state
const newState = gameReducer(currentState, action);
```

### 2. Type-Safe Actions
```typescript
// Discriminated union ensures type safety
type GameAction =
  | { type: 'TAKE_GEMS'; gems: string[] }
  | { type: 'PURCHASE_CARD'; card: Card }
  | { type: 'RESERVE_CARD'; card: Card }
  // ... etc
```

### 3. AI Chaining
```typescript
// AI turns execute automatically in sequence
await turnController.executeTurn(state, action);
// If next player is AI, it decides automatically
```

### 4. Game Rules Validation
```typescript
// All actions validated before applying
if (!GameRules.canAfford(playerGems, cost)) {
  throw new Error('Cannot afford card');
}
```

---

## Critical Files to Know

### Engine & State Management
- **`src/game/engine.ts`** - `initializeGame()`, `gameReducer()`
- **`src/game/rules.ts`** - All validation logic
- **`src/game/turnController.ts`** - Turn execution + AI chaining

### AI System
- **`src/ai/aiPlayer.ts`** - Three strategy implementations
  - `easyStrategy()` - Random moves
  - `mediumStrategy()` - Balanced play
  - `hardStrategy()` - Multi-turn planning

### React Integration
- **`src/components/Game.tsx`** - Root component, state management
- **`src/index.tsx`** - Entry point (uses relative imports)

### Tests (for examples)
- **`src/__tests__/game/engine.test.ts`** - How state works
- **`src/__tests__/game/rules.test.ts`** - Validation examples
- **`src/__tests__/ai/aiPlayer.test.ts`** - AI behavior

---

## Common Development Tasks

### Running a Single Test
```bash
npm test -- GameRules           # Tests matching filename
npm test -- --testNamePattern="canAfford"  # Specific test
```

### Debugging
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests in watch mode
npm run test:watch

# Check types during development
npm run type-check
```

### Adding a New Feature
1. Write test first: `src/__tests__/game/myFeature.test.ts`
2. Implement: `src/game/myFeature.ts`
3. Update types if needed: `src/types/index.ts`
4. Run: `npm test` to verify
5. Check: `npm run type-check && npm run lint`

### Modifying Game Rules
- Edit: `src/game/rules.ts`
- Test: `src/__tests__/game/rules.test.ts`
- Run: `npm test -- rules.test.ts`

### Tweaking AI
- Edit: `src/ai/aiPlayer.ts`
- Test: `src/__tests__/ai/aiPlayer.test.ts`
- Strategies to modify:
  - `easyStrategy()` - Change move selection
  - `mediumStrategy()` - Adjust heuristics
  - `hardStrategy()` - Modify lookahead logic

---

## Important Notes

### Path Aliases
- ⚠️ TypeScript supports `@components/`, `@game/`, etc.
- But `src/index.tsx` uses **relative imports** for webpack
- If you add new imports to index.tsx, use relative paths:
  ```typescript
  import { Component } from './components/Component';
  ```

### Testing Before Commits
```bash
# Run this before pushing
npm run type-check
npm run lint
npm test

# All should pass with 0 errors
```

### Dev Server Issues
- If "port 3000 already in use":
  ```bash
  pkill -9 node
  npm run dev
  ```

### Dependency Notes
- Uses `--legacy-peer-deps` flag due to TypeScript/react-scripts version
- This is safe - all dependencies are compatible
- Always install with: `npm install --legacy-peer-deps`

---

## Documentation Reference

### For Users/Game Masters
- **README.md** - Game rules, how to play, quick start

### For Developers
- **CLAUDE.md** - Architecture, design decisions, code patterns
- **docs/ARCHITECTURE.md** - Deep technical reference

### Implementation Guides
- **BALANCE_TESTING.md** - How to run game balance simulations
- **ANALYTICS_IMPLEMENTATION.md** - Analytics system API

### In Code
- **200+ JSDoc comments** on all public functions
- **229 tests** showing usage examples

---

## Extending the Project

### Add a New AI Strategy
1. Add method to `AIPlayer` class in `src/ai/aiPlayer.ts`
2. Call from `decideAction()` based on difficulty level
3. Write tests in `src/__tests__/ai/aiPlayer.test.ts`
4. Test: `npm test -- aiPlayer.test.ts`

### Add a New Game Mechanic
1. Define types in `src/types/index.ts`
2. Add validation to `src/game/rules.ts`
3. Implement reducer case in `src/game/engine.ts`
4. Write tests before implementation
5. Verify: `npm test && npm run type-check`

### Fix a Bug
1. Write test that demonstrates the bug
2. Fix the bug
3. Verify test passes
4. Run full suite: `npm test`

---

## Performance & Quality Baseline

### Current Performance
- **Dev build**: ~5 seconds
- **Test suite**: ~5 seconds (229 tests)
- **Type check**: <1 second
- **AI decisions**: <1 second per move
- **Code coverage**: 79.10%

### Target Quality
- Keep test coverage ≥ 70%
- Maintain 0 TypeScript errors
- Maintain 0 ESLint errors
- All tests should pass

### Memory Profile
- ~2MB for full game state + UI
- No memory leaks with proper React hooks

---

## Troubleshooting

### "Cannot find module '@components/Game'"
- ✅ Already fixed in src/index.tsx
- Make sure using relative imports in index.tsx
- Other files can use alias paths

### "Test timeout"
- Add `jest.setTimeout(10000);` at top of test file
- Or increase timeout in jest.config.js

### "Port 3000 already in use"
```bash
pkill -9 node
npm run dev
```

### "Module not found errors"
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

---

## Next Developer Handoff Checklist

- [x] All code committed to git
- [x] All tests passing (229/229)
- [x] TypeScript strict mode enabled
- [x] ESLint configured and passing
- [x] Documentation complete
- [x] Memory file updated
- [x] Runbook written (this file!)
- [x] Dev server tested and working
- [x] Game is fully playable

---

## Questions?

Refer to these in order:
1. **CLAUDE.md** - Architecture & design
2. **docs/ARCHITECTURE.md** - Technical details
3. **Test files** - Usage examples
4. **JSDoc comments** - Function-level docs
5. **README.md** - Game rules

---

**You're ready to go! 🚀**

The project is in excellent shape for the next developer to pick up, extend, and maintain.
