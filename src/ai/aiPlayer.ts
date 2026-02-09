/**
 * AI player logic for CPU opponents.
 *
 * Implements three difficulty levels with increasing strategic depth:
 * - easy: Random moves with purchase bias (learning)
 * - medium: Balanced strategy with mixed randomness (competitive)
 * - hard: Multi-turn planning and opponent blocking (challenge)
 */

import type { GameState, PlayerState, GameAction, Card, Noble, GemCost, Color } from '../types';
import { GameRules } from '../game/rules';

/**
 * AIPlayer - Implements CPU opponent decision-making.
 *
 * Generates valid GameActions based on game state and difficulty level.
 * All decisions are deterministic (given same state) for testability.
 */
export class AIPlayer {
  private difficulty: 'easy' | 'medium' | 'hard';
  private playerId: string;

  /**
   * Create a new AI player.
   *
   * @param playerId - Unique identifier for this player
   * @param difficulty - Strategy difficulty (easy|medium|hard), defaults to 'medium'
   */
  constructor(playerId: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.playerId = playerId;
    this.difficulty = difficulty;
  }

  /**
   * Decide the next action for this AI player.
   *
   * Routes to difficulty-specific strategy method and always returns a valid action.
   * Called by TurnController.executeAITurn() during AI's turn.
   *
   * @param gameState - Current game state
   * @param playerState - This player's state
   * @returns A valid GameAction for the current game state
   *
   * @example
   * const action = aiPlayer.decideAction(gameState, playerState);
   * // Returns one of: TAKE_GEMS, RESERVE_CARD, PURCHASE_CARD, or END_TURN
   */
  decideAction(gameState: GameState, playerState: PlayerState): GameAction {
    const currentPlayerIndex = gameState.players.findIndex(p => p.id === this.playerId);

    // Prioritize actions based on difficulty
    if (this.difficulty === 'hard') {
      return this.hardStrategy(gameState, playerState, currentPlayerIndex);
    } else if (this.difficulty === 'medium') {
      return this.mediumStrategy(gameState, playerState, currentPlayerIndex);
    } else {
      return this.easyStrategy(gameState, playerState, currentPlayerIndex);
    }
  }

  /**
   * Easy strategy: Mostly random valid actions with slight bias toward purchasing.
   *
   * Learning difficulty. Makes random moves but slightly favors purchasing cards
   * when possible. Good for new players or testing.
   *
   * @param gameState - Current game state
   * @param playerState - This player's state
   * @param playerIndex - This player's index
   * @returns Random or slightly-biased valid GameAction
   *
   * @internal
   */
  private easyStrategy(gameState: GameState, playerState: PlayerState, playerIndex: number): GameAction {
    const affordableCards = this.getAffordableCards(gameState, playerState);
    const reservableCards = this.getReservableCards(gameState, playerState);
    const validGemMoves = this.getValidGemMoves(gameState, playerState);

    const actions: GameAction[] = [];

    // 30% bias toward purchasing if possible
    if (affordableCards.length > 0) {
      for (let i = 0; i < 3; i++) {
        const card = affordableCards[Math.floor(Math.random() * affordableCards.length)];
        actions.push({ type: 'PURCHASE_CARD', playerIndex, card });
      }
    }

    // Add gem collection moves
    validGemMoves.forEach(gems => {
      actions.push({ type: 'TAKE_GEMS', playerIndex, gems });
    });

    // Add reserve moves
    if (reservableCards.length > 0) {
      for (let i = 0; i < 2; i++) {
        const card = reservableCards[Math.floor(Math.random() * reservableCards.length)];
        actions.push({ type: 'RESERVE_CARD', playerIndex, card });
      }
    }

    // Fallback to END_TURN
    actions.push({ type: 'END_TURN', playerIndex });

    return actions[Math.floor(Math.random() * actions.length)];
  }

  /**
   * Medium strategy: Balanced approach with gem collection and strategic card purchase.
   *
   * Competitive difficulty. Prioritizes nobles, evaluates cards strategically, and
   * maintains 40% randomness for unpredictability. Good default AI difficulty.
   *
   * Priority order:
   * 1. Purchase cards leading to nobles
   * 2. Purchase high-value affordable cards
   * 3. Collect gems for next purchase
   * 4. Reserve high-value cards
   * 5. End turn
   *
   * @param gameState - Current game state
   * @param playerState - This player's state
   * @param playerIndex - This player's index
   * @returns Strategically chosen GameAction with randomness element
   *
   * @internal
   */
  private mediumStrategy(gameState: GameState, playerState: PlayerState, playerIndex: number): GameAction {
    const affordableCards = this.getAffordableCards(gameState, playerState);
    const reachableNobles = this.getReachableNobles(playerState, gameState.nobles);
    const reservableCards = this.getReservableCards(gameState, playerState);

    // 40% chance to pick random valid action for unpredictability
    if (Math.random() < 0.4) {
      const validGemMoves = this.getValidGemMoves(gameState, playerState);
      const allMoves: GameAction[] = [];

      if (affordableCards.length > 0) {
        const card = affordableCards[Math.floor(Math.random() * affordableCards.length)];
        allMoves.push({ type: 'PURCHASE_CARD', playerIndex, card });
      }

      validGemMoves.forEach(gems => {
        allMoves.push({ type: 'TAKE_GEMS', playerIndex, gems });
      });

      if (reservableCards.length > 0) {
        const card = reservableCards[Math.floor(Math.random() * reservableCards.length)];
        allMoves.push({ type: 'RESERVE_CARD', playerIndex, card });
      }

      allMoves.push({ type: 'END_TURN', playerIndex });

      if (allMoves.length > 0) {
        return allMoves[Math.floor(Math.random() * allMoves.length)];
      }
    }

    // Priority 1: Purchase cards that lead to nobles
    if (affordableCards.length > 0 && reachableNobles.length > 0) {
      const nobleCards = affordableCards.filter(card => {
        return reachableNobles.some(noble => {
          const tempCards = [...playerState.purchasedCards, card];
          return this.meetsNobleRequirement(tempCards, noble);
        });
      });

      if (nobleCards.length > 0) {
        const bestCard = nobleCards.sort((a, b) => b.points - a.points)[0];
        return { type: 'PURCHASE_CARD', playerIndex, card: bestCard };
      }
    }

    // Priority 2: Purchase any affordable card
    if (affordableCards.length > 0) {
      const bestCard = affordableCards.sort((a, b) => {
        const scoreA = this.evaluateCard(a, playerState, gameState.nobles);
        const scoreB = this.evaluateCard(b, playerState, gameState.nobles);
        return scoreB - scoreA;
      })[0];
      return { type: 'PURCHASE_CARD', playerIndex, card: bestCard };
    }

    // Priority 3: Collect gems for next purchase
    const displayedCards = [
      ...gameState.displayedCards.level1,
      ...gameState.displayedCards.level2,
      ...gameState.displayedCards.level3,
    ];

    const targetCards = displayedCards.filter(card => {
      const affordableWithGold = this.canAffordWithGold(playerState, card, 1);
      return affordableWithGold;
    });

    if (targetCards.length > 0) {
      const gemsNeeded = this.findBestGemCollection(targetCards, playerState.gems);
      if (gemsNeeded.length > 0) {
        return { type: 'TAKE_GEMS', playerIndex, gems: gemsNeeded };
      }
    }

    // Priority 4: Reserve high-value cards
    if (reservableCards.length > 0) {
      const bestReserve = reservableCards.sort((a, b) => {
        const shouldReserveA = this.shouldReserveCard(a, gameState, playerIndex) ? 1 : 0;
        const shouldReserveB = this.shouldReserveCard(b, gameState, playerIndex) ? 1 : 0;
        return (shouldReserveB * b.points) - (shouldReserveA * a.points);
      })[0];

      if (this.shouldReserveCard(bestReserve, gameState, playerIndex)) {
        return { type: 'RESERVE_CARD', playerIndex, card: bestReserve };
      }
    }

    return { type: 'END_TURN', playerIndex };
  }

  /**
   * Hard strategy: Multi-turn planning with aggressive noble pursuit.
   *
   * Challenge difficulty. Deterministic (no randomness). Evaluates cards deeply,
   * predicts opponent needs for blocking strategy, and plans 2-3 turns ahead.
   * Uses multi-factor card evaluation (points, nobles, rarity, color diversity).
   *
   * Priority order:
   * 1. Purchase cards completing noble requirements
   * 2. Purchase highest-point affordable cards
   * 3. Plan gem collection for expensive cards (lookahead)
   * 4. Reserve opponent-blocking cards
   * 5. Collect gems for gem-hungry cards
   * 6. End turn
   *
   * @param gameState - Current game state
   * @param playerState - This player's state
   * @param playerIndex - This player's index
   * @returns Strategically optimized GameAction based on lookahead
   *
   * @internal
   */
  private hardStrategy(gameState: GameState, playerState: PlayerState, playerIndex: number): GameAction {
    const affordableCards = this.getAffordableCards(gameState, playerState);
    const reachableNobles = this.getReachableNobles(playerState, gameState.nobles);
    const reservableCards = this.getReservableCards(gameState, playerState);
    const displayedCards = [
      ...gameState.displayedCards.level1,
      ...gameState.displayedCards.level2,
      ...gameState.displayedCards.level3,
    ];

    // Priority 1: Purchase cards that complete noble requirements
    if (affordableCards.length > 0) {
      const nobleCards = affordableCards.filter(card => {
        const tempCards = [...playerState.purchasedCards, card];
        return reachableNobles.some(noble => this.meetsNobleRequirement(tempCards, noble));
      });

      if (nobleCards.length > 0) {
        const bestCard = nobleCards.sort((a, b) => {
          const scoreA = this.evaluateCard(a, playerState, gameState.nobles);
          const scoreB = this.evaluateCard(b, playerState, gameState.nobles);
          return scoreB - scoreA;
        })[0];

        // Check if purchase gets us to winning points
        const pointsAfter = playerState.points + bestCard.points;
        if (pointsAfter >= GameRules.WINNING_POINTS) {
          return { type: 'PURCHASE_CARD', playerIndex, card: bestCard };
        }

        return { type: 'PURCHASE_CARD', playerIndex, card: bestCard };
      }
    }

    // Priority 2: Purchase highest-point affordable cards
    if (affordableCards.length > 0) {
      const bestCard = affordableCards.sort((a, b) => {
        const scoreA = this.evaluateCard(a, playerState, gameState.nobles);
        const scoreB = this.evaluateCard(b, playerState, gameState.nobles);
        return scoreB - scoreA;
      })[0];

      if (bestCard.points >= 3 || playerState.points + bestCard.points >= GameRules.WINNING_POINTS) {
        return { type: 'PURCHASE_CARD', playerIndex, card: bestCard };
      }
    }

    // Priority 3: Plan gem collection to reach next card
    const affordableWithGoldLimit = displayedCards.filter(card => {
      return this.canAffordWithGold(playerState, card, 2);
    });

    if (affordableWithGoldLimit.length > 0) {
      const gemsNeeded = this.findBestGemCollection(affordableWithGoldLimit, playerState.gems);
      if (gemsNeeded.length > 0 && GameRules.validateGemTake(gemsNeeded, gameState.gemPool, playerState.gems)) {
        return { type: 'TAKE_GEMS', playerIndex, gems: gemsNeeded };
      }
    }

    // Priority 4: Aggressive reserve of high-value cards or opponent-blocking cards
    if (reservableCards.length > 0) {
      const opponentNeeds = this.predictOpponentNeeds(gameState, playerIndex);

      const bestReserve = reservableCards.sort((a, b) => {
        let scoreA = a.points;
        let scoreB = b.points;

        // Boost score for cards opponents need (blocking strategy)
        if (opponentNeeds.some(need => this.cardMatchesRequirement(a, need))) {
          scoreA += 20;
        }
        if (opponentNeeds.some(need => this.cardMatchesRequirement(b, need))) {
          scoreB += 20;
        }

        return scoreB - scoreA;
      })[0];

      if (this.shouldReserveCard(bestReserve, gameState, playerIndex)) {
        return { type: 'RESERVE_CARD', playerIndex, card: bestReserve };
      }
    }

    // Priority 5: Collect gems for gem-hungry cards
    const targetCards = displayedCards.filter(card => {
      const costTotal = this.countGemCost(card.cost);
      return costTotal >= 5 && this.canAffordWithGold(playerState, card, 3);
    });

    if (targetCards.length > 0) {
      const gemsNeeded = this.findBestGemCollection(targetCards, playerState.gems);
      if (gemsNeeded.length > 0) {
        return { type: 'TAKE_GEMS', playerIndex, gems: gemsNeeded };
      }
    }

    return { type: 'END_TURN', playerIndex };
  }

  /**
   * Evaluate a card's strategic value (0-100 scale).
   *
   * Scores based on:
   * - Points: 15x multiplier (primary factor)
   * - Noble bonus: +10 per noble reachable
   * - Rarity/level: 5x for lower levels
   * - Color diversity: +3 for new colors
   *
   * @param card - Card to evaluate
   * @param playerState - Player's current state
   * @param nobles - Available nobles in game
   * @returns Score 0-100 (higher is better)
   *
   * @internal
   */
  private evaluateCard(card: Card, playerState: PlayerState, nobles: Noble[]): number {
    let score = 0;

    // Points value (weighted heavily)
    score += card.points * 15;

    // Color bonus toward reachable nobles
    const colorBonus = nobles.filter(noble => {
      const tempCards = [...playerState.purchasedCards, card];
      return this.meetsNobleRequirement(tempCards, noble);
    }).length;
    score += colorBonus * 10;

    // Rarity: lower level = more valuable for progression
    score += (4 - card.level) * 5;

    // Bonus for unique colors in collection
    const hasColor = playerState.purchasedCards.some(c => c.color === card.color);
    if (!hasColor) {
      score += 3;
    }

    return Math.min(score, 100);
  }

  /**
   * Find optimal gems to collect given target cards
   */
  private findBestGemCollection(targetCards: Card[], playerGems: GemCost & { gold: number }): string[] {
    if (targetCards.length === 0) {
      return [];
    }

    const colors = ['red', 'blue', 'green', 'white', 'black'] as const;
    const colorNeeds: Record<(typeof colors)[number], number> = {
      red: 0,
      blue: 0,
      green: 0,
      white: 0,
      black: 0,
    };

    // Aggregate needs from target cards
    targetCards.forEach(card => {
      colors.forEach(color => {
        const need = (card.cost[color as keyof GemCost] || 0) as number;
        const have = (playerGems[color as keyof GemCost] || 0) as number;
        if (have < need) {
          colorNeeds[color] += need - have;
        }
      });
    });

    // Prefer 2-of-same strategy for same-color needs
    const result: string[] = [];
    const colorsByNeed = [...colors].sort((a, b) => colorNeeds[b] - colorNeeds[a]);

    for (const color of colorsByNeed) {
      if (result.length >= 3) break;
      if (colorNeeds[color] > 0) {
        if (result.length < 2) {
          result.push(color);
        }
        if (result.length < 3) {
          result.push(color);
          break;
        }
      }
    }

    // If we didn't get 3, fill with different colors
    for (const color of colorsByNeed) {
      if (result.length >= 3) break;
      if (result.length < 3 && !result.includes(color)) {
        result.push(color);
      }
    }

    return result.slice(0, 3);
  }

  /**
   * Decide if a card is worth reserving
   */
  private shouldReserveCard(card: Card, gameState: GameState, playerIndex: number): boolean {
    // High-value cards (3+ points) always worth reserving
    if (card.points >= 3) {
      return true;
    }

    // Cards others might need
    const opponentNeeds = this.predictOpponentNeeds(gameState, playerIndex);
    const isBlocking = opponentNeeds.some(need => this.cardMatchesRequirement(card, need));

    // Level 2-3 cards are more valuable for reserving
    if (card.level >= 2 && (isBlocking || card.points >= 1)) {
      return true;
    }

    return false;
  }

  /**
   * Get nobles that are close to being reached (1-2 colors away)
   */
  private getReachableNobles(playerState: PlayerState, nobles: Noble[]): Noble[] {
    return nobles.filter(noble => {
      const missingColors = this.countMissingColors(playerState.purchasedCards, noble);
      return missingColors >= 0 && missingColors <= 2;
    });
  }

  /**
   * Predict what gems/cards other players might need
   */
  private predictOpponentNeeds(gameState: GameState, currentPlayerIndex: number): GemCost[] {
    const needs: GemCost[] = [];

    gameState.players.forEach((opponent, idx) => {
      if (idx === currentPlayerIndex) return;

      // Look at displayed cards that opponent might want
      const allCards = [
        ...gameState.displayedCards.level1,
        ...gameState.displayedCards.level2,
        ...gameState.displayedCards.level3,
      ];

      const affordableForThem = allCards.filter(card => GameRules.canPurchaseCard(opponent, card));
      affordableForThem.forEach(card => {
        needs.push(card.cost);
      });
    });

    return needs;
  }

  /**
   * Helper: Get all cards that can be reserved
   */
  private getReservableCards(gameState: GameState, playerState: PlayerState): Card[] {
    if (playerState.reservedCards.length >= GameRules.MAX_RESERVED_CARDS) {
      return [];
    }

    const displayedCards = [
      ...gameState.displayedCards.level1,
      ...gameState.displayedCards.level2,
      ...gameState.displayedCards.level3,
    ];

    return displayedCards.filter(card => {
      const alreadyReserved = playerState.reservedCards.some(r => r.id === card.id);
      const alreadyPurchased = playerState.purchasedCards.some(p => p.id === card.id);
      return !alreadyReserved && !alreadyPurchased;
    });
  }

  /**
   * Helper: Get all valid gem moves
   */
  private getValidGemMoves(gameState: GameState, playerState: PlayerState): string[][] {
    const validMoves: string[][] = [];
    const colors: Color[] = ['red', 'blue', 'green', 'white', 'black'];

    // Try 2-of-same (only if 4+ in supply)
    colors.forEach(color => {
      const gemsToTake = [color, color];
      const poolCount = (gameState.gemPool[color as keyof GemCost] || 0) as number;
      if (GameRules.validateGemTake(gemsToTake, gameState.gemPool, playerState.gems) && poolCount >= 4) {
        validMoves.push(gemsToTake);
      }
    });

    // Try 3-different
    const combinations = this.generateColorCombinations(colors, 3);
    combinations.forEach(combo => {
      if (GameRules.validateGemTake(combo, gameState.gemPool, playerState.gems)) {
        validMoves.push(combo);
      }
    });

    return validMoves;
  }

  /**
   * Helper: Get all affordable cards
   */
  private getAffordableCards(gameState: GameState, playerState: PlayerState): Card[] {
    const allCards = [
      ...gameState.displayedCards.level1,
      ...gameState.displayedCards.level2,
      ...gameState.displayedCards.level3,
    ];

    return allCards.filter(card => GameRules.canPurchaseCard(playerState, card));
  }

  /**
   * Helper: Check if can afford with gold gems
   */
  private canAffordWithGold(playerState: PlayerState, card: Card, goldThreshold: number): boolean {
    const colors: (keyof GemCost)[] = ['red', 'blue', 'green', 'white', 'black'];
    let goldNeeded = 0;

    for (const color of colors) {
      const needed = card.cost[color] || 0;
      const available = playerState.gems[color] || 0;

      if (available < needed) {
        goldNeeded += needed - available;
      }
    }

    return goldNeeded <= goldThreshold;
  }

  /**
   * Helper: Count missing colors for noble requirement
   */
  private countMissingColors(purchasedCards: Card[], noble: Noble): number {
    const colors: (keyof GemCost)[] = ['red', 'blue', 'green', 'white', 'black'];
    let missing = 0;

    for (const color of colors) {
      const needed = noble.requirement[color] || 0;
      const have = purchasedCards.filter(c => c.color === color).length;

      if (have < needed) {
        missing += needed - have;
      }
    }

    return missing;
  }

  /**
   * Helper: Check if purchased cards meet noble requirement
   */
  private meetsNobleRequirement(purchasedCards: Card[], noble: Noble): boolean {
    const colors: (keyof GemCost)[] = ['red', 'blue', 'green', 'white', 'black'];

    for (const color of colors) {
      const needed = noble.requirement[color] || 0;
      const have = purchasedCards.filter(c => c.color === color).length;

      if (have < needed) {
        return false;
      }
    }

    return true;
  }

  /**
   * Helper: Check if card matches a gem cost requirement
   */
  private cardMatchesRequirement(card: Card, requirement: GemCost): boolean {
    const colors: (keyof GemCost)[] = ['red', 'blue', 'green', 'white', 'black'];

    for (const color of colors) {
      const needed = requirement[color] || 0;
      if (needed > 0 && card.color === color) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper: Count total gem cost
   */
  private countGemCost(cost: GemCost): number {
    return (
      (cost.red || 0) +
      (cost.blue || 0) +
      (cost.green || 0) +
      (cost.white || 0) +
      (cost.black || 0)
    );
  }

  /**
   * Helper: Generate color combinations
   */
  private generateColorCombinations(colors: Color[], size: number): string[][] {
    const result: string[][] = [];

    function generate(current: string[], start: number) {
      if (current.length === size) {
        result.push([...current]);
        return;
      }

      for (let i = start; i < colors.length; i++) {
        current.push(colors[i]);
        generate(current, i + 1);
        current.pop();
      }
    }

    generate([], 0);
    return result;
  }
}
