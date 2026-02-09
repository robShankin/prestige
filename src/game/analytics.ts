/**
 * Analytics system for tracking and analyzing game metrics
 */

import type { GameState, Card, Noble, PlayerState } from '../types';

export interface GameMetrics {
  winnerId: string;
  winnerName: string;
  winnerDifficulty?: 'easy' | 'medium' | 'hard';
  turnCount: number;
  finalScores: Array<{ playerId: string; playerName: string; points: number; difficulty?: string }>;
  cardsPurchased: Array<{
    cardId: string;
    cardLevel: number;
    cardPoints: number;
    purchasedBy: string;
  }>;
  noblesClaimed: Array<{
    nobleId: string;
    noblePoints: number;
    claimedBy: string;
  }>;
  averageGemsPerTurn: number;
  gameConfiguration: {
    playerCount: number;
    difficulties: Array<'easy' | 'medium' | 'hard' | 'human'>;
  };
}

export interface AnalyticsReport {
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
  bottomCards: Array<{
    id: string;
    level: number;
    purchases: number;
    percentage: number;
  }>;
  bottomNobles: Array<{
    id: string;
    claims: number;
    percentage: number;
  }>;
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

export class GameAnalytics {
  private games: GameMetrics[] = [];

  /**
   * Record a completed game
   */
  recordGame(
    finalState: GameState,
    turnCount: number,
    cardsPurchasedByPlayer: Map<number, Card[]>,
    noblesByPlayer: Map<number, Noble[]>,
    playerDifficulties: Map<number, 'easy' | 'medium' | 'hard' | 'human'>
  ): void {
    if (!finalState.winner) {
      console.warn('Cannot record game without winner');
      return;
    }

    const cardsPurchased: GameMetrics['cardsPurchased'] = [];
    const noblesClaimed: GameMetrics['noblesClaimed'] = [];

    // Collect cards purchased
    cardsPurchasedByPlayer.forEach((cards, playerIndex) => {
      const player = finalState.players[playerIndex];
      if (player) {
        cards.forEach((card) => {
          cardsPurchased.push({
            cardId: card.id,
            cardLevel: card.level,
            cardPoints: card.points,
            purchasedBy: player.id,
          });
        });
      }
    });

    // Collect nobles claimed
    noblesByPlayer.forEach((nobles, playerIndex) => {
      const player = finalState.players[playerIndex];
      if (player) {
        nobles.forEach((noble) => {
          noblesClaimed.push({
            nobleId: noble.id,
            noblePoints: noble.points,
            claimedBy: player.id,
          });
        });
      }
    });

    // Calculate average gems per turn
    let totalGemsCollected = 0;
    finalState.players.forEach((player) => {
      totalGemsCollected += this.countPlayerGems(player);
    });
    const avgGemsPerTurn = totalGemsCollected / Math.max(turnCount, 1);

    // Get difficulties for each player
    const difficulties: Array<'easy' | 'medium' | 'hard' | 'human'> = [];
    for (let i = 0; i < finalState.players.length; i++) {
      difficulties.push(playerDifficulties.get(i) || 'human');
    }

    // Determine winner difficulty
    const winnerIndex = finalState.players.findIndex((p) => p.id === finalState.winner!.id);
    const winnerDifficulty = winnerIndex >= 0 ? playerDifficulties.get(winnerIndex) : undefined;

    const metric: GameMetrics = {
      winnerId: finalState.winner.id,
      winnerName: finalState.winner.name,
      winnerDifficulty: winnerDifficulty as 'easy' | 'medium' | 'hard' | undefined,
      turnCount,
      finalScores: finalState.players.map((p, idx) => ({
        playerId: p.id,
        playerName: p.name,
        points: p.points,
        difficulty: difficulties[idx],
      })),
      cardsPurchased,
      noblesClaimed,
      averageGemsPerTurn: avgGemsPerTurn,
      gameConfiguration: {
        playerCount: finalState.players.length,
        difficulties,
      },
    };

    this.games.push(metric);
  }

  /**
   * Get win rates by difficulty or player
   */
  getWinRates(
    difficulty?: 'easy' | 'medium' | 'hard'
  ): { [key: string]: number } {
    const winRates: { [key: string]: number } = {};
    let gamesCount = 0;

    if (difficulty) {
      // Filter games where the winner has the specified difficulty
      const filteredGames = this.games.filter((g) => g.winnerDifficulty === difficulty);
      gamesCount = filteredGames.length;

      const totalGames = this.games.filter((g) =>
        g.gameConfiguration.difficulties.includes(difficulty)
      ).length;

      if (totalGames > 0) {
        winRates[difficulty] = (gamesCount / totalGames) * 100;
      }
    } else {
      // Win rates by player name or difficulty
      const wins: { [key: string]: number } = {};
      const totals: { [key: string]: number } = {};

      this.games.forEach((game) => {
        const key = game.winnerDifficulty || 'human';
        wins[key] = (wins[key] || 0) + 1;

        game.gameConfiguration.difficulties.forEach((diff) => {
          totals[diff] = (totals[diff] || 0) + 1;
        });
      });

      Object.keys(wins).forEach((key) => {
        winRates[key] = (wins[key] / (totals[key] || 1)) * 100;
      });
    }

    return winRates;
  }

  /**
   * Get average game length in turns
   */
  getAverageGameLength(): number {
    if (this.games.length === 0) return 0;
    const sum = this.games.reduce((acc, g) => acc + g.turnCount, 0);
    return sum / this.games.length;
  }

  /**
   * Get average points across all games
   */
  getAveragePlayerPoints(): number {
    if (this.games.length === 0) return 0;

    let totalPoints = 0;
    let playerCount = 0;

    this.games.forEach((game) => {
      game.finalScores.forEach((score) => {
        totalPoints += score.points;
        playerCount += 1;
      });
    });

    return playerCount > 0 ? totalPoints / playerCount : 0;
  }

  /**
   * Get card usage statistics
   */
  getCardUsageStats(): {
    [cardId: string]: { purchases: number; percentage: number; level: number };
  } {
    const stats: { [cardId: string]: { purchases: number; percentage: number; level: number } } = {};
    const totalCards = this.games.reduce((sum, g) => sum + g.cardsPurchased.length, 0);

    this.games.forEach((game) => {
      game.cardsPurchased.forEach((card) => {
        if (!stats[card.cardId]) {
          stats[card.cardId] = { purchases: 0, percentage: 0, level: card.cardLevel };
        }
        stats[card.cardId].purchases += 1;
      });
    });

    Object.keys(stats).forEach((cardId) => {
      stats[cardId].percentage = (stats[cardId].purchases / Math.max(totalCards, 1)) * 100;
    });

    return stats;
  }

  /**
   * Get noble claim statistics
   */
  getNobleClaimStats(): {
    [nobleId: string]: { claims: number; percentage: number };
  } {
    const stats: { [nobleId: string]: { claims: number; percentage: number } } = {};
    const totalNobles = this.games.reduce((sum, g) => sum + g.noblesClaimed.length, 0);

    this.games.forEach((game) => {
      game.noblesClaimed.forEach((noble) => {
        if (!stats[noble.nobleId]) {
          stats[noble.nobleId] = { claims: 0, percentage: 0 };
        }
        stats[noble.nobleId].claims += 1;
      });
    });

    Object.keys(stats).forEach((nobleId) => {
      stats[nobleId].percentage = (stats[nobleId].claims / Math.max(totalNobles, 1)) * 100;
    });

    return stats;
  }

  /**
   * Generate a comprehensive analytics report
   */
  generateReport(): AnalyticsReport {
    const cardUsage = this.getCardUsageStats();
    const nobleUsage = this.getNobleClaimStats();
    const winRates = this.getWinRates();

    // Sort cards by usage
    const sortedCards = Object.entries(cardUsage)
      .sort(([, a], [, b]) => b.purchases - a.purchases);

    const topCards = sortedCards.slice(0, 10).map(([id, stats]) => ({
      id,
      level: stats.level,
      purchases: stats.purchases,
      percentage: stats.percentage,
    }));

    const bottomCards = sortedCards.slice(-5).reverse().map(([id, stats]) => ({
      id,
      level: stats.level,
      purchases: stats.purchases,
      percentage: stats.percentage,
    }));

    // Sort nobles by usage
    const sortedNobles = Object.entries(nobleUsage)
      .sort(([, a], [, b]) => b.claims - a.claims);

    const topNobles = sortedNobles.slice(0, 10).map(([id, stats]) => ({
      id,
      claims: stats.claims,
      percentage: stats.percentage,
    }));

    const bottomNobles = sortedNobles.slice(-5).reverse().map(([id, stats]) => ({
      id,
      claims: stats.claims,
      percentage: stats.percentage,
    }));

    // Calculate average scores by difficulty
    const scoresByDifficulty: { [diff: string]: { total: number; count: number; wins: number } } = {};

    this.games.forEach((game) => {
      game.finalScores.forEach((score) => {
        const diff = score.difficulty || 'human';
        if (!scoresByDifficulty[diff]) {
          scoresByDifficulty[diff] = { total: 0, count: 0, wins: 0 };
        }
        scoresByDifficulty[diff].total += score.points;
        scoresByDifficulty[diff].count += 1;

        if (game.winnerId === score.playerId) {
          scoresByDifficulty[diff].wins += 1;
        }
      });
    });

    const avgScores = Object.entries(scoresByDifficulty).map(([diff, stats]) => ({
      difficulty: diff,
      avgPoints: stats.total / Math.max(stats.count, 1),
      winRate: (stats.wins / Math.max(stats.count, 1)) * 100,
    }));

    // Build game configuration breakdown
    const configMap: { [config: string]: { games: number; winRates: { [p: string]: number } } } = {};

    this.games.forEach((game) => {
      const configKey = `${game.gameConfiguration.playerCount}p-${game.gameConfiguration.difficulties
        .slice(0, -1)
        .join(',')}`;

      if (!configMap[configKey]) {
        configMap[configKey] = { games: 0, winRates: {} };
      }

      configMap[configKey].games += 1;

      const winnerKey = game.winnerDifficulty || 'human';
      configMap[configKey].winRates[winnerKey] = (configMap[configKey].winRates[winnerKey] || 0) + 1;
    });

    const gameConfigurations: AnalyticsReport['gameConfigurations'] = {};
    Object.entries(configMap).forEach(([config, data]) => {
      const winRateObj: { [p: string]: number } = {};
      Object.entries(data.winRates).forEach(([player, wins]) => {
        winRateObj[player] = (wins / data.games) * 100;
      });

      gameConfigurations[config] = {
        games: data.games,
        avgLength: this.games
          .filter((g) => {
            const gConfig = `${g.gameConfiguration.playerCount}p-${g.gameConfiguration.difficulties
              .slice(0, -1)
              .join(',')}`;
            return gConfig === config;
          })
          .reduce((sum, g) => sum + g.turnCount, 0) /
          data.games,
        winRates: winRateObj,
      };
    });

    return {
      totalGames: this.games.length,
      avgGameLength: this.getAverageGameLength(),
      avgTurnsToWin: this.games.length > 0
        ? this.games.reduce((sum, g) => sum + g.turnCount, 0) / this.games.length
        : 0,
      playerWinRates: winRates,
      topCards,
      topNobles,
      bottomCards,
      bottomNobles,
      avgScores,
      gameConfigurations,
    };
  }

  /**
   * Get raw games data
   */
  getGames(): GameMetrics[] {
    return [...this.games];
  }

  /**
   * Reset analytics
   */
  reset(): void {
    this.games = [];
  }

  /**
   * Helper to count gems on a player (excluding gold)
   */
  private countPlayerGems(player: PlayerState): number {
    return (
      (player.gems.red || 0) +
      (player.gems.blue || 0) +
      (player.gems.green || 0) +
      (player.gems.white || 0) +
      (player.gems.black || 0)
    );
  }
}
