# Game Balance Testing & Analytics

This document describes the balance testing and analytics system for the Splendor game.

## Overview

The balance testing framework allows you to simulate hundreds of games with different AI difficulty combinations to analyze game metrics and identify balance issues.

## Files

### 1. `src/game/analytics.ts`
Core analytics system that tracks and aggregates game metrics.

**Key Components:**
- `GameMetrics`: Interface for tracking individual game results
  - Winner and final scores
  - Cards purchased and nobles claimed by each player
  - Average gems collected per turn
  - Game configuration (player count, difficulties)

- `GameAnalytics` Class: Main analytics engine
  - `recordGame()`: Record a completed game with all metrics
  - `getWinRates()`: Get win percentage by difficulty
  - `getAverageGameLength()`: Average number of turns per game
  - `getCardUsageStats()`: Track which cards are purchased most/least
  - `getNobleClaimStats()`: Track which nobles are claimed most/least
  - `generateReport()`: Comprehensive analytics report

### 2. `src/scripts/balanceTest.ts`
Automated simulation script that plays games and collects analytics.

**Features:**
- Runs multiple game configurations with different player counts and difficulties
- Tracks detailed game metrics during play
- Generates formatted balance reports
- Validates game balance against target metrics

## Running Balance Tests

```bash
npm run test:balance
```

This command will:
1. Simulate games with various difficulty combinations:
   - 30 games: 3-player (easy vs medium vs hard)
   - 20 games: 2-player (easy vs easy)
   - 20 games: 2-player (hard vs hard)
   - 20 games: 2-player (medium vs medium)
   - 20 games: 4-player (mixed difficulties)

2. Generate detailed balance reports for each configuration

3. Print warnings for metrics outside target ranges

## Interpreting Reports

Each report includes:

### Win Rates by Difficulty
- **Target for Easy**: 10-20% (should lose to medium/hard)
- **Target for Medium**: 40-50% (should be competitive)
- **Target for Hard**: 70-80% (should win most games)

### Game Length
- **Target**: 15-25 turns per game
- Too short (< 15): Cards might be too easy to afford, gem pool too large
- Too long (> 25): Cards might be too expensive, gem pool too small

### Card Distribution
- **Most used card**: Should be < 30% (avoid dominant cards)
- **Well-balanced**: Cards evenly distributed across purchases

### Noble Distribution
- **Most claimed noble**: Should be < 40% (avoid dominant nobles)
- **Well-balanced**: Nobles evenly distributed across claims

## Balance Tuning Guide

### If Easy AI Wins Too Much
- Easy AI is winning > 25% when facing Medium/Hard
- **Solution**: Increase easy difficulty by:
  - Reducing bias toward high-point cards
  - Decreasing gem collection efficiency
  - Making gem selection more random

### If Medium AI Wins Too Little
- Medium AI is winning < 35% when mixed with other difficulties
- **Solution**: Improve medium difficulty by:
  - Better card evaluation logic
  - More aggressive noble pursuit
  - Improved opponent blocking strategies

### If Hard AI Wins Too Little
- Hard AI is winning < 60% when mixed with other difficulties
- **Solution**: Enhance hard difficulty by:
  - More aggressive multi-turn planning
  - Better prediction of opponent moves
  - Smarter reserve/blocking strategies
  - Priority on highest-value cards

### If Games Are Too Short
- Average < 15 turns
- **Solution**:
  - Increase card costs (more gems needed)
  - Reduce gems per player in GEMS_PER_PLAYER_COUNT
  - Increase noble requirements
  - Reduce starting gem pool

### If Games Are Too Long
- Average > 25 turns
- **Solution**:
  - Decrease card costs (easier to purchase)
  - Increase gems per player
  - Reduce noble requirements
  - Increase gem pool or discount cards

### If Cards Are Imbalanced
- One card purchased > 30% of the time
- **Solution**:
  - Increase cost of over-purchased cards
  - Decrease cost of under-purchased cards
  - Adjust point values
  - Adjust gem bonus colors

## Metrics Tracked

### Per-Game Metrics
```
{
  winnerId: string
  winnerName: string
  winnerDifficulty: 'easy' | 'medium' | 'hard'
  turnCount: number
  finalScores: { playerId, playerName, points, difficulty }[]
  cardsPurchased: { cardId, cardLevel, cardPoints, purchasedBy }[]
  noblesClaimed: { nobleId, noblePoints, claimedBy }[]
  averageGemsPerTurn: number
  gameConfiguration: { playerCount, difficulties[] }
}
```

### Aggregated Report Metrics
- Total games simulated
- Average game length
- Average turns to win
- Win rates by difficulty
- Top/bottom cards by purchase rate
- Top/bottom nobles by claim rate
- Average scores by difficulty
- Game configuration breakdown

## Example Balance Test Output

```
Running 30 games: 3-player (easy vs medium vs hard)
Configuration: 3 players - easy, medium, hard

Total games simulated: 14
Average game length: 77.9 turns

Win Rates by Difficulty:
  easy: 78.6%
  medium: 21.4%

Top 5 Most Used Cards:
  1. L1-L1-23: 3.9% (11 purchases)
  2. L1-L1-07: 3.5% (10 purchases)
  ...

Balance Analysis:
Easy AI win rate: 78.6% (target: 10-20%)
  ⚠ Easy AI winning too much - may need difficulty increase
```

## Adjusting Test Parameters

Edit `/src/scripts/balanceTest.ts` to change:

```typescript
// Modify game counts per configuration
await runSimulation(3, ['easy', 'medium', 'hard'], 100, '3-player...');

// Modify game configurations tested
await runSimulation(2, ['custom', 'mix'], 50, 'Custom test');

// Adjust maximum turns per game
const maxTurns = 100; // in playGame() function
```

## Automation

The balance test is designed to be:
- **Fully autonomous**: No human intervention needed during simulation
- **Deterministic**: Same seed would produce same results (currently uses Math.random())
- **Fast**: Each game takes ~0.5-2 seconds depending on length
- **Repeatable**: Can run multiple times to verify consistency

## Common Issues

### Hard vs Hard Games Not Completing
- Hard AI strategy may have infinite loops or strategy conflicts
- Both hard players try to block each other, creating stalemate
- **Solution**: Add max turn limit (default 100) to prevent infinite games

### High False Negative Rates
- AI action validation fails, causing fallback to END_TURN
- **Solution**: Ensure `getValidGemMoves()` in AIPlayer properly validates moves

### Missing Noble Claims
- AI completing games without claiming available nobles
- **Solution**: Verify `getEligibleNobles()` is called at turn end

### Uneven Distribution
- Some game configurations have 0 completed games
- Usually indicates AI strategy issues or game state bugs
- Run with smaller batches to debug individual games

## Future Enhancements

1. **Seeded Random**: Add seed parameter for reproducible results
2. **Concurrent Games**: Run multiple simulations in parallel
3. **Game Replay**: Save game logs for debugging failed runs
4. **Parameter Tuning**: Automated parameter adjustment based on results
5. **Web Dashboard**: Real-time visualization of balance metrics
6. **AI Profiling**: Track decision times and strategy choices
7. **Human vs AI**: Compare human strategies against AI

## Contributing

When making AI or game rule changes:
1. Run `npm run test:balance` before and after
2. Document any balance changes in this file
3. Ensure target metrics are maintained
4. Test with at least 30 games per configuration

## References

- Game Rules: `src/game/rules.ts`
- AI Implementation: `src/ai/aiPlayer.ts`
- Game Engine: `src/game/engine.ts`
- Card Data: `src/game/data/cards.ts`
- Noble Data: `src/game/data/nobles.ts`
