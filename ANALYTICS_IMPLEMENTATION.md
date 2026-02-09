# Analytics System Implementation Guide

## Overview

The analytics system provides comprehensive game metrics collection and analysis for the Splendor game. This document describes the implementation details, API usage, and how to extend the system.

## Architecture

```
┌─────────────────────────────────────────┐
│  GameAnalytics (src/game/analytics.ts)  │
├─────────────────────────────────────────┤
│ - Tracks individual game metrics        │
│ - Aggregates statistics                 │
│ - Generates comprehensive reports       │
└─────────────────────────────────────────┘
         ↑                       ↓
    Used by              Provides data to
         ↑                       ↓
┌─────────────────────────────────────────┐
│  Balance Test (src/scripts/balanceTest)  │
├─────────────────────────────────────────┤
│ - Simulates games                       │
│ - Collects metrics                      │
│ - Prints formatted reports              │
│ - Validates balance targets             │
└─────────────────────────────────────────┘
```

## Core Components

### GameMetrics Interface
Represents a single completed game's metrics:

```typescript
interface GameMetrics {
  winnerId: string;                    // Player ID of winner
  winnerName: string;                  // Display name
  winnerDifficulty?: 'easy' | 'medium' | 'hard';
  turnCount: number;                   // Total turns played
  finalScores: Array<{
    playerId: string;
    playerName: string;
    points: number;
    difficulty?: string;
  }>;
  cardsPurchased: Array<{
    cardId: string;
    cardLevel: 1 | 2 | 3;
    cardPoints: number;
    purchasedBy: string;               // Player ID
  }>;
  noblesClaimed: Array<{
    nobleId: string;
    noblePoints: number;
    claimedBy: string;                 // Player ID
  }>;
  averageGemsPerTurn: number;          // Gems collected per turn
  gameConfiguration: {
    playerCount: number;
    difficulties: Array<'easy' | 'medium' | 'hard' | 'human'>;
  };
}
```

### GameAnalytics Class

#### recordGame(finalState, turnCount, cardsPurchasedByPlayer, noblesByPlayer, playerDifficulties)

Records a completed game's metrics.

```typescript
const analytics = new GameAnalytics();

// After game finishes, collect metrics
const cardsPurchased = new Map<number, Card[]>();
const noblesClaimed = new Map<number, Noble[]>();
const difficulties = new Map<number, 'easy' | 'medium' | 'hard'>();

// Track purchases and claims during gameplay
// ... (see balanceTest.ts for full implementation)

// Record when game is finished
analytics.recordGame(
  finalGameState,
  turnCount,
  cardsPurchased,
  noblesClaimed,
  difficulties
);
```

#### getWinRates(difficulty?: string): { [key: string]: number }

Gets win percentages by difficulty.

```typescript
// Get all win rates
const rates = analytics.getWinRates();
// { easy: 30%, medium: 45%, hard: 75% }

// Get win rate for specific difficulty
const easyRate = analytics.getWinRates('easy');
// { easy: 30% }
```

#### getAverageGameLength(): number

Gets average number of turns per game.

```typescript
const avgTurns = analytics.getAverageGameLength();
// 18.5
```

#### getAveragePlayerPoints(): number

Gets average final score across all games and players.

```typescript
const avgPoints = analytics.getAveragePlayerPoints();
// 11.2
```

#### getCardUsageStats(): { [cardId: string]: { purchases: number; percentage: number; level: number } }

Gets which cards are most/least purchased.

```typescript
const stats = analytics.getCardUsageStats();
// {
//   'L1-L1-23': { purchases: 45, percentage: 3.2%, level: 1 },
//   'L2-L2-15': { purchases: 2, percentage: 0.14%, level: 2 },
//   ...
// }
```

#### getNobleClaimStats(): { [nobleId: string]: { claims: number; percentage: number } }

Gets which nobles are most/least claimed.

```typescript
const stats = analytics.getNobleClaimStats();
// {
//   'N-05': { claims: 42, percentage: 35% },
//   'N-02': { claims: 8, percentage: 6.7% },
//   ...
// }
```

#### generateReport(): AnalyticsReport

Generates comprehensive analytics report.

```typescript
const report = analytics.generateReport();

console.log(`Total games: ${report.totalGames}`);
console.log(`Avg length: ${report.avgGameLength} turns`);
console.log(`Win rates:`, report.playerWinRates);
console.log(`Top cards:`, report.topCards);
console.log(`Top nobles:`, report.topNobles);
console.log(`Avg scores:`, report.avgScores);
console.log(`Game configs:`, report.gameConfigurations);
```

#### AnalyticsReport Interface

```typescript
interface AnalyticsReport {
  totalGames: number;
  avgGameLength: number;
  avgTurnsToWin: number;
  playerWinRates: { [playerIdentifier: string]: number };

  topCards: Array<{
    id: string;
    level: number;
    purchases: number;
    percentage: number;
  }>;

  topNobles: Array<{
    id: string;
    claims: number;
    percentage: number;
  }>;

  bottomCards: Array<{ /* same as topCards */ }>;
  bottomNobles: Array<{ /* same as topNobles */ }>;

  avgScores: Array<{
    difficulty: string;
    avgPoints: number;
    winRate: number;
  }>;

  gameConfigurations: {
    [config: string]: {
      games: number;
      avgLength: number;
      winRates: { [player: string]: number };
    };
  };
}
```

#### reset(): void

Clears all recorded games.

```typescript
analytics.reset();
```

#### getGames(): GameMetrics[]

Returns raw game metrics data.

```typescript
const games = analytics.getGames();
games.forEach(game => {
  console.log(`${game.winnerName} won in ${game.turnCount} turns`);
});
```

## Usage Example

### Basic Usage

```typescript
import { GameAnalytics } from './game/analytics';
import { initializeGame, gameReducer } from './game/engine';
import { AIPlayer } from './ai/aiPlayer';

// Create analytics instance
const analytics = new GameAnalytics();

// Play some games
for (let i = 0; i < 100; i++) {
  let gameState = initializeGame(3);
  const aiPlayers = new Map([
    [0, new AIPlayer('ai-1', 'easy')],
    [1, new AIPlayer('ai-2', 'medium')],
    [2, new AIPlayer('ai-3', 'hard')],
  ]);

  const cardsPurchased = new Map<number, Card[]>();
  const noblesClaimed = new Map<number, Noble[]>();
  let turnCount = 0;

  // Play game loop
  while (gameState.gamePhase !== 'finished' && turnCount < 100) {
    turnCount++;
    const player = gameState.players[gameState.currentPlayerIndex];
    const action = aiPlayers.get(gameState.currentPlayerIndex)
      ?.decideAction(gameState, player);

    // Apply action, track cards/nobles
    gameState = gameReducer(gameState, action);
  }

  // Record game
  analytics.recordGame(
    gameState,
    turnCount,
    cardsPurchased,
    noblesClaimed,
    new Map([
      [0, 'easy'],
      [1, 'medium'],
      [2, 'hard'],
    ])
  );
}

// Get report
const report = analytics.generateReport();
console.log(report);
```

### Integration with Game UI

```typescript
// In React component
import { useCallback } from 'react';
import { GameAnalytics } from '@game/analytics';

const GameComponent = () => {
  const analyticsRef = useRef(new GameAnalytics());

  const handleGameEnd = useCallback((finalState: GameState) => {
    analyticsRef.current.recordGame(
      finalState,
      turnCount,
      cardsPurchased,
      nobles,
      playerDifficulties
    );

    // Show statistics
    const report = analyticsRef.current.generateReport();
    showReport(report);
  }, []);

  return <div>{/* Game UI */}</div>;
};
```

## Data Flow in Balance Test

1. **Initialization**
   - Create `GameAnalytics` instance
   - Create `AIPlayer` instances with difficulties
   - Initialize game state

2. **Game Loop**
   - AI decides action
   - Action applied via `gameReducer`
   - Cards purchased and nobles claimed tracked
   - Turn count incremented

3. **Game End**
   - Determine winner (highest score)
   - Call `recordGame()` with all metrics

4. **Report Generation**
   - Call `generateReport()` after all games
   - Format and print results
   - Validate against balance targets

## Performance Characteristics

| Operation | Time Complexity | Space Complexity |
|-----------|-----------------|------------------|
| recordGame | O(1) | O(n) where n = cards/nobles per game |
| getWinRates | O(g*p) | O(d) where d = difficulties |
| getAverageGameLength | O(g) | O(1) |
| getCardUsageStats | O(c) | O(c) where c = unique cards |
| getNobleClaimStats | O(n) | O(n) where n = unique nobles |
| generateReport | O(g*(c+n)) | O(c+n) |

Where `g` = total games recorded

## Testing Analytics

```bash
# Run balance test (produces analytics reports)
npm run test:balance

# Type checking
npm run type-check

# Run Jest tests
npm test
```

## Extending Analytics

### Adding New Metrics

1. Update `GameMetrics` interface
2. Collect data in `recordGame()`
3. Add aggregation method (e.g., `getMyMetric()`)
4. Update report generation in `generateReport()`

### Adding New Analysis

```typescript
// In analytics.ts
public getCardsByDifficulty() {
  const byDifficulty: {[diff: string]: CardStats[]} = {};

  this.games.forEach(game => {
    game.cardsPurchased.forEach(card => {
      const buyer = game.finalScores.find(s => s.playerId === card.purchasedBy);
      const diff = buyer?.difficulty || 'unknown';

      if (!byDifficulty[diff]) {
        byDifficulty[diff] = [];
      }
      // Track card stats by difficulty...
    });
  });

  return byDifficulty;
}
```

## Debugging

### Check Recorded Games

```typescript
const games = analytics.getGames();
console.table(games.map(g => ({
  winner: g.winnerName,
  turns: g.turnCount,
  difficulty: g.winnerDifficulty,
})));
```

### Verify Metrics Collection

```typescript
const report = analytics.generateReport();
console.log(`Games recorded: ${report.totalGames}`);
console.log(`Avg game length: ${report.avgGameLength}`);
console.log(`Cards tracked: ${report.topCards.length}`);
console.log(`Nobles tracked: ${report.topNobles.length}`);
```

## References

- **Main Implementation**: `src/game/analytics.ts`
- **Test Script**: `src/scripts/balanceTest.ts`
- **Game Engine**: `src/game/engine.ts`
- **AI System**: `src/ai/aiPlayer.ts`
- **Types**: `src/types/index.ts`
