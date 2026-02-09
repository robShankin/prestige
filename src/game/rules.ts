/**
 * Core Splendor game rules and validation.
 *
 * Static class containing all game rule logic. Used by engine, turnController, and AI
 * to validate actions and enforce game invariants. All methods are deterministic and
 * side-effect free.
 */

import type { GameState, Card, GemCost, PlayerState, Noble, Color } from '../types';

/**
 * GameRules - Static class for all game validation and rule enforcement.
 *
 * All methods are pure functions with no side effects. Used to validate player
 * actions before applying them to game state.
 */
export class GameRules {
  /** Maximum gems a player can hold at once (not counting gems on cards) */
  static MAX_GEMS_PER_PLAYER = 10;

  /** Maximum cards a player can reserve at once */
  static MAX_RESERVED_CARDS = 3;

  /** Points needed to reach victory (triggers end game) */
  static WINNING_POINTS = 15;

  /**
   * Check if a player can take the specified gems without exceeding limits.
   *
   * Validates:
   * - Takes 1-3 gems
   * - Player won't exceed MAX_GEMS_PER_PLAYER after taking
   *
   * @param playerGems - Player's current gem collection
   * @param gemsToTake - Array of gem colors/amounts to take
   * @returns True if take is legal, false otherwise
   */
  static canTakeGems(playerGems: GemCost & { gold: number }, gemsToTake: string[]): boolean {
    if (gemsToTake.length > 3) return false;

    const current = this.countGems(playerGems);
    const newTotal = current + gemsToTake.length;

    return newTotal <= this.MAX_GEMS_PER_PLAYER;
  }

  /**
   * Check if a player can purchase a specific card.
   *
   * @param playerState - Player to check
   * @param card - Card to purchase
   * @returns True if player can afford the card, false otherwise
   */
  static canPurchaseCard(playerState: PlayerState, card: Card): boolean {
    return this.canAfford(playerState.gems, card.cost);
  }

  /**
   * Check if a player can afford a gem cost with their current gems.
   *
   * Accounts for gem bonuses from purchased cards and uses gold for remainder.
   * Gold gems can substitute for any color.
   *
   * @param playerGems - Player's gem collection (includes gold)
   * @param cost - Gem cost requirement
   * @returns True if player has enough gems (colored + gold), false otherwise
   */
  static canAfford(playerGems: GemCost & { gold: number }, cost: GemCost): boolean {
    let goldNeeded = 0;

    const colors: (keyof GemCost)[] = ['red', 'blue', 'green', 'white', 'black'];

    for (const color of colors) {
      const needed = cost[color] || 0;
      const available = playerGems[color] || 0;

      if (available < needed) {
        goldNeeded += needed - available;
      }
    }

    return goldNeeded <= (playerGems.gold || 0);
  }

  /**
   * Count total number of gems in a collection.
   *
   * @param gems - Gem collection
   * @returns Total gems count (including gold)
   */
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

  /**
   * Check if game is over (someone reached WINNING_POINTS).
   *
   * Triggers transition to endGame phase. Does not check if in endGame phase.
   *
   * @param state - Current game state
   * @returns True if any player has >= WINNING_POINTS
   */
  static isGameOver(state: GameState): boolean {
    return state.players.some(p => p.points >= this.WINNING_POINTS);
  }

  /**
   * Check if a player can reserve a card.
   *
   * A player can reserve if they have < MAX_RESERVED_CARDS reserved.
   *
   * @param playerState - Player to check
   * @returns True if player can reserve more cards, false if at limit
   */
  static canReserveCard(playerState: PlayerState): boolean {
    return playerState.reservedCards.length < this.MAX_RESERVED_CARDS;
  }

  /**
   * Check if a player can claim a specific noble.
   *
   * Player can claim a noble if their gem bonuses meet the noble's requirement.
   * Uses canAfford internally (checks gem bonuses via playerGems).
   *
   * Note: In this game, gem bonuses come from playerState.gems which aggregates
   * colors of purchased cards.
   *
   * @param playerState - Player to check
   * @param noble - Noble to claim
   * @returns True if player meets gem requirements, false otherwise
   */
  static canClaimNoble(playerState: PlayerState, noble: Noble): boolean {
    return this.canAfford(playerState.gems, noble.requirement);
  }

  /**
   * Calculate gem discount from purchased cards.
   *
   * Each purchased card of a color provides a permanent 1-gem discount
   * for that color. Used when determining affordability.
   *
   * @param playerState - Player whose cards to count
   * @param cost - Card cost (included for future use, not currently used)
   * @returns Discount object with color counts from purchased cards
   */
  static calculateGemDiscount(playerState: PlayerState): GemCost {
    const discount: GemCost = {
      red: 0,
      blue: 0,
      green: 0,
      white: 0,
      black: 0,
    };

    for (const card of playerState.purchasedCards) {
      if (card.color !== 'gold') {
        discount[card.color] = (discount[card.color] || 0) + 1;
      }
    }

    return discount;
  }

  /**
   * Get all nobles that a player is eligible to claim.
   *
   * Checks which nobles in the game state the player can claim based on
   * their gem bonuses from purchased cards.
   *
   * @param state - Current game state
   * @param playerIndex - Index of player to check
   * @returns Array of claimable nobles (may be empty)
   */
  static getEligibleNobles(state: GameState, playerIndex: number): Noble[] {
    const playerState = state.players[playerIndex];

    if (!playerState) {
      return [];
    }

    return state.nobles.filter(noble => this.canClaimNoble(playerState, noble));
  }

  /**
   * Validate a gem take action.
   *
   * Complete validation ensuring:
   * - Gems array is 1-3 gems
   * - Pool has enough gems of each color
   * - Player has room to hold gems (won't exceed MAX_GEMS_PER_PLAYER)
   *
   * @param gems - Array of gem colors to take
   * @param poolGems - Available gems in pool
   * @param playerGems - Player's current gems
   * @returns True if take is completely valid, false otherwise
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
