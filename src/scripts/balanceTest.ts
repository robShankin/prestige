/**
 * Balance testing script - simulates hundreds of games to analyze game balance
 * Run with: npm run test:balance
 */

import { initializeGame, gameReducer } from '../game/engine';
import { GameAnalytics } from '../game/analytics';
import { AIPlayer } from '../ai/aiPlayer';
import type { GameState, GameAction, Card, Noble } from '../types';

/**
 * Run a single game with all AI players
 */
async function playGame(
  playerCount: number,
  difficulties: Array<'easy' | 'medium' | 'hard'>
): Promise<{
  finalState: GameState;
  turnCount: number;
  cardsPurchasedByPlayer: Map<number, Card[]>;
  noblesByPlayer: Map<number, Noble[]>;
  playerDifficulties: Map<number, 'easy' | 'medium' | 'hard' | 'human'>;
}> {
  if (difficulties.length !== playerCount) {
    throw new Error(`Expected ${playerCount} difficulties, got ${difficulties.length}`);
  }

  // Initialize game - will create 1 human + (playerCount-1) AI
  let gameState = initializeGame(playerCount);

  // Override human player to be AI with first difficulty
  const allDifficulties: Array<'easy' | 'medium' | 'hard' | 'human'> = [
    difficulties[0] as 'easy' | 'medium' | 'hard',
    ...difficulties.slice(1),
  ];

  const aiPlayers = new Map<number, AIPlayer>();
  for (let i = 0; i < playerCount; i++) {
    aiPlayers.set(i, new AIPlayer(gameState.players[i].id, difficulties[i]));
  }

  let turnCount = 0;
  const maxTurns = 100; // Safety limit to prevent infinite loops

  // Track cards purchased and nobles claimed by player
  const cardsPurchasedByPlayer = new Map<number, Card[]>();
  const noblesByPlayer = new Map<number, Noble[]>();

  for (let i = 0; i < playerCount; i++) {
    cardsPurchasedByPlayer.set(i, []);
    noblesByPlayer.set(i, []);
  }

  // Play game until someone wins
  while (gameState.gamePhase !== 'finished' && turnCount < maxTurns) {
    turnCount++;

    const currentPlayerIndex = gameState.currentPlayerIndex;
    const currentPlayer = gameState.players[currentPlayerIndex];
    const aiPlayer = aiPlayers.get(currentPlayerIndex);

    if (!aiPlayer) {
      break; // No AI player configured, stop game
    }

    // Get AI decision
    let action = aiPlayer.decideAction(gameState, currentPlayer);

    // Validate action before applying - if invalid, fallback to END_TURN
    try {
      // Try to apply the action
      const testState = gameReducer(gameState, action);
      gameState = testState;

      // Track card purchases and noble claims
      if (action.type === 'PURCHASE_CARD') {
        const cards = cardsPurchasedByPlayer.get(currentPlayerIndex) || [];
        cards.push(action.card);
        cardsPurchasedByPlayer.set(currentPlayerIndex, cards);
      }

      if (action.type === 'CLAIM_NOBLE') {
        const nobles = noblesByPlayer.get(currentPlayerIndex) || [];
        nobles.push(action.noble);
        noblesByPlayer.set(currentPlayerIndex, nobles);
      }
    } catch (e) {
      // Action failed, fallback to END_TURN
      action = { type: 'END_TURN', playerIndex: currentPlayerIndex };
      try {
        gameState = gameReducer(gameState, action);
      } catch (endTurnError) {
        // Even END_TURN failed, break to prevent infinite loop
        break;
      }
    }

    // Advance turn if not already an END_TURN (auto-award nobles and check end game)
    if (action.type !== 'END_TURN') {
      try {
        gameState = gameReducer(gameState, {
          type: 'END_TURN',
          playerIndex: currentPlayerIndex,
        });
      } catch (e) {
        // Failed to end turn, skip
        break;
      }
    }
  }

  // Ensure winner is set if game is finished
  if (gameState.gamePhase === 'finished' && !gameState.winner) {
    const winner = gameState.players.reduce((best, current) =>
      current.points > best.points ? current : best
    );
    gameState = { ...gameState, winner };
  }

  return {
    finalState: gameState,
    turnCount,
    cardsPurchasedByPlayer,
    noblesByPlayer,
    playerDifficulties: new Map(allDifficulties.map((d, i) => [i, d])),
  };
}

/**
 * Run multiple games with the same configuration
 */
async function runSimulation(
  playerCount: number,
  difficulties: Array<'easy' | 'medium' | 'hard'>,
  gameCount: number,
  label: string
): Promise<void> {
  console.log(`\nRunning ${gameCount} games: ${label}`);
  console.log(`Configuration: ${playerCount} players - ${difficulties.join(', ')}`);

  const analytics = new GameAnalytics();

  for (let i = 0; i < gameCount; i++) {
    try {
      const { finalState, turnCount, cardsPurchasedByPlayer, noblesByPlayer, playerDifficulties } =
        await playGame(playerCount, difficulties);

      if (finalState.winner) {
        analytics.recordGame(finalState, turnCount, cardsPurchasedByPlayer, noblesByPlayer, playerDifficulties);
      }

      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\rProgress: ${i + 1}/${gameCount}`);
      }
    } catch (e) {
      console.error(`\nError in game ${i + 1}:`, e);
    }
  }

  console.log(`\nProgress: ${gameCount}/${gameCount} ✓`);

  // Print results
  const report = analytics.generateReport();
  printReport(label, report);
}

/**
 * Format and print analytics report
 */
function printReport(label: string, report: ReturnType<GameAnalytics['generateReport']>): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Game Balance Report: ${label}`);
  console.log(`${'='.repeat(60)}`);

  console.log(`\nTotal games simulated: ${report.totalGames}`);
  console.log(`Average game length: ${report.avgTurnsToWin.toFixed(1)} turns`);

  console.log(`\nWin Rates by Difficulty:`);
  Object.entries(report.playerWinRates)
    .sort((a, b) => b[1] - a[1])
    .forEach(([difficulty, rate]) => {
      console.log(`  ${difficulty}: ${rate.toFixed(1)}%`);
    });

  console.log(`\nAverage Scores by Difficulty:`);
  report.avgScores
    .sort((a, b) => b.avgPoints - a.avgPoints)
    .forEach((score) => {
      console.log(
        `  ${score.difficulty}: ${score.avgPoints.toFixed(1)} pts (${score.winRate.toFixed(1)}% win rate)`
      );
    });

  console.log(`\nTop 5 Most Used Cards:`);
  report.topCards.slice(0, 5).forEach((card, idx) => {
    console.log(`  ${idx + 1}. L${card.level}-${card.id}: ${card.percentage.toFixed(1)}% (${card.purchases} purchases)`);
  });

  console.log(`\nBottom 5 Least Used Cards:`);
  report.bottomCards.forEach((card, idx) => {
    console.log(`  ${idx + 1}. L${card.level}-${card.id}: ${card.percentage.toFixed(1)}% (${card.purchases} purchases)`);
  });

  console.log(`\nTop 5 Most Claimed Nobles:`);
  report.topNobles.slice(0, 5).forEach((noble, idx) => {
    console.log(`  ${idx + 1}. N-${noble.id}: ${noble.percentage.toFixed(1)}% (${noble.claims} claims)`);
  });

  console.log(`\nBottom 5 Least Claimed Nobles:`);
  report.bottomNobles.forEach((noble, idx) => {
    console.log(`  ${idx + 1}. N-${noble.id}: ${noble.percentage.toFixed(1)}% (${noble.claims} claims)`);
  });

  // Check balance metrics
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Balance Analysis:`);
  console.log(`${'='.repeat(60)}`);

  const easyWinRate = report.playerWinRates['easy'] || 0;
  const mediumWinRate = report.playerWinRates['medium'] || 0;
  const hardWinRate = report.playerWinRates['hard'] || 0;

  console.log(`Easy AI win rate: ${easyWinRate.toFixed(1)}% (target: 10-20%)`);
  if (easyWinRate > 20) {
    console.log(`  ⚠ Easy AI winning too much - may need difficulty increase`);
  } else if (easyWinRate < 10 && easyWinRate > 0) {
    console.log(`  ✓ Easy AI win rate acceptable`);
  }

  console.log(`Medium AI win rate: ${mediumWinRate.toFixed(1)}% (target: 40-50%)`);
  if (mediumWinRate > 60) {
    console.log(`  ⚠ Medium AI winning too much`);
  } else if (mediumWinRate < 30) {
    console.log(`  ⚠ Medium AI winning too little`);
  } else {
    console.log(`  ✓ Medium AI win rate acceptable`);
  }

  console.log(`Hard AI win rate: ${hardWinRate.toFixed(1)}% (target: 70-80%)`);
  if (hardWinRate < 70) {
    console.log(`  ⚠ Hard AI winning too little - may need improvement`);
  } else {
    console.log(`  ✓ Hard AI win rate strong`);
  }

  console.log(`Average game length: ${report.avgTurnsToWin.toFixed(1)} turns (target: 15-25)`);
  if (report.avgTurnsToWin < 15) {
    console.log(`  ⚠ Games ending too quickly`);
  } else if (report.avgTurnsToWin > 25) {
    console.log(`  ⚠ Games taking too long`);
  } else {
    console.log(`  ✓ Game length acceptable`);
  }

  // Check card distribution
  const topCardUsage = report.topCards[0]?.percentage || 0;
  console.log(`\nCard usage distribution:`);
  console.log(`  Most used card: ${topCardUsage.toFixed(1)}% (target: <30%)`);
  if (topCardUsage > 30) {
    console.log(`  ⚠ Card distribution imbalanced - one card dominates`);
  } else {
    console.log(`  ✓ Card distribution well-balanced`);
  }

  // Check noble distribution
  const topNobleUsage = report.topNobles[0]?.percentage || 0;
  console.log(`\nNoble distribution:`);
  console.log(`  Most claimed noble: ${topNobleUsage.toFixed(1)}% (target: <40%)`);
  if (topNobleUsage > 40) {
    console.log(`  ⚠ Noble distribution imbalanced`);
  } else {
    console.log(`  ✓ Noble distribution well-balanced`);
  }

  console.log();
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log(`Starting Splendor Game Balance Testing Suite`);
  console.log(`============================================\n`);

  try {
    // Test 1: Easy vs Medium vs Hard (3 players)
    await runSimulation(3, ['easy', 'medium', 'hard'], 30, '3-player (easy vs medium vs hard)');

    // Test 2: Easy vs Easy (2 players)
    await runSimulation(2, ['easy', 'easy'], 20, '2-player (easy vs easy)');

    // Test 3: Hard vs Hard (2 players)
    await runSimulation(2, ['hard', 'hard'], 20, '2-player (hard vs hard)');

    // Test 4: Medium vs Medium (2 players)
    await runSimulation(2, ['medium', 'medium'], 20, '2-player (medium vs medium)');

    // Test 5: Mixed difficulty 4-player
    await runSimulation(4, ['easy', 'medium', 'hard', 'medium'], 20, '4-player (mixed difficulties)');

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Balance Testing Complete!`);
    console.log(`${'='.repeat(60)}`);
  } catch (e) {
    console.error('Fatal error during balance testing:', e);
    process.exit(1);
  }
}

// Run the main function
main().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
