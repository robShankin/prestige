/**
 * Core Splendor game rules and validation
 */

import type { GameState, Card, GemCost, PlayerState, Noble, Color } from '../types';

export class GameRules {
  static MAX_GEMS_PER_PLAYER = 10;
  static MAX_RESERVED_CARDS = 3;
  static WINNING_POINTS = 15;

  static canTakeGems(playerGems: GemCost & { gold: number }, gemsToTake: string[]): boolean {
    if (gemsToTake.length > 3) return false;

    const current = this.countGems(playerGems);
    const newTotal = current + gemsToTake.length;

    return newTotal <= this.MAX_GEMS_PER_PLAYER;
  }

  static canPurchaseCard(playerState: PlayerState, card: Card): boolean {
    return this.canAfford(playerState.gems, card.cost);
  }

  static canAfford(playerGems: GemCost & { gold: number }, cost: GemCost): boolean {
    let spent = 0;
    let goldNeeded = 0;

    const colors: (keyof GemCost)[] = ['red', 'blue', 'green', 'white', 'black'];

    for (const color of colors) {
      const needed = cost[color] || 0;
      const available = playerGems[color] || 0;

      if (available >= needed) {
        spent += needed;
      } else {
        goldNeeded += needed - available;
        spent += available;
      }
    }

    return goldNeeded <= (playerGems.gold || 0);
  }

  static countGems(gems: GemCost & { gold: number }): number {
    return (
      (gems.red || 0) +
      (gems.blue || 0) +
      (gems.green || 0) +
      (gems.white || 0) +
      (gems.black || 0) +
      (gems.gold || 0)
    );
  }

  static isGameOver(state: GameState): boolean {
    return state.players.some(p => p.points >= this.WINNING_POINTS);
  }

  /**
   * Check if a player can reserve a card
   */
  static canReserveCard(playerState: PlayerState): boolean {
    return playerState.reservedCards.length < this.MAX_RESERVED_CARDS;
  }

  /**
   * Check if a player can claim a specific noble
   */
  static canClaimNoble(playerState: PlayerState, noble: Noble): boolean {
    return this.canAfford(playerState.gems, noble.requirement);
  }

  /**
   * Calculate gem discount from purchased cards
   * Each purchased card provides 1 gem of its color type
   */
  static calculateGemDiscount(playerState: PlayerState, cost: GemCost): GemCost {
    const discount: GemCost = {
      red: 0,
      blue: 0,
      green: 0,
      white: 0,
      black: 0,
    };

    const colors: Color[] = ['red', 'blue', 'green', 'white', 'black'];

    for (const card of playerState.purchasedCards) {
      if (card.color !== 'gold') {
        discount[card.color] = (discount[card.color] || 0) + 1;
      }
    }

    return discount;
  }

  /**
   * Get all nobles that a player is eligible to claim
   * Based on their gem collection matching noble requirements
   */
  static getEligibleNobles(state: GameState, playerIndex: number): Noble[] {
    const playerState = state.players[playerIndex];

    if (!playerState) {
      return [];
    }

    return state.nobles.filter(noble => this.canClaimNoble(playerState, noble));
  }

  /**
   * Validate a gem take action
   * Ensures gems exist in pool and player has room for them
   */
  static validateGemTake(
    gems: string[],
    poolGems: GemCost & { gold: number },
    playerGems: GemCost & { gold: number }
  ): boolean {
    if (gems.length === 0 || gems.length > 3) {
      return false;
    }

    // Check pool has enough gems
    const gemCounts: { [key: string]: number } = {};
    for (const gem of gems) {
      gemCounts[gem] = (gemCounts[gem] || 0) + 1;
    }

    for (const [gem, count] of Object.entries(gemCounts)) {
      const available = poolGems[gem as Color] || 0;
      if (available < count) {
        return false;
      }
    }

    // Check player can hold gems
    return this.canTakeGems(playerGems, gems);
  }
}
