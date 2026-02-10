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

type AIProfile = {
  focusColors: Color[];
  reservePointsMin: number;
  randomMoveChance: number;
  nobleMissingMax: number;
  goldAffordThreshold: number;
};

/**
 * AIPlayer - Implements CPU opponent decision-making.
 *
 * Generates valid GameActions based on game state and difficulty level.
 * All decisions are deterministic (given same state) for testability.
 */
export class AIPlayer {
  private difficulty: 'easy' | 'medium' | 'hard';
  private playerId: string;
  private profile: AIProfile;

  /**
   * Create a new AI player.
   *
   * @param playerId - Unique identifier for this player
   * @param difficulty - Strategy difficulty (easy|medium|hard), defaults to 'medium'
   */
  constructor(
    playerId: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    profile: AIProfile = AIPlayer.createProfile(difficulty)
  ) {
    this.playerId = playerId;
    this.difficulty = difficulty;
    this.profile = profile;
  }

  static createProfile(difficulty: 'easy' | 'medium' | 'hard'): AIProfile {
    const colors: Color[] = ['red', 'blue', 'green', 'white', 'black'];
    const shuffled = [...colors].sort(() => Math.random() - 0.5);
    const focusColors = shuffled.slice(0, 2);

    if (difficulty === 'easy') {
      return {
        focusColors,
        reservePointsMin: 3,
        randomMoveChance: 0.7,
        nobleMissingMax: 2,
        goldAffordThreshold: 1,
      };
    }

    if (difficulty === 'hard') {
      return {
        focusColors,
        reservePointsMin: Math.random() < 0.5 ? 3 : 2,
        randomMoveChance: 0.05,
        nobleMissingMax: 1,
        goldAffordThreshold: Math.random() < 0.5 ? 1 : 2,
      };
    }

    return {
      focusColors,
      reservePointsMin: Math.random() < 0.4 ? 2 : 3,
      randomMoveChance: 0.25,
      nobleMissingMax: Math.random() < 0.5 ? 1 : 2,
      goldAffordThreshold: Math.random() < 0.5 ? 1 : 2,
    };
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
    const isOpeningTurn = this.isOpeningTurn(playerState);

    // Sometimes buy a card if affordable
    if (affordableCards.length > 0 && Math.random() < 0.35) {
      const card = affordableCards[Math.floor(Math.random() * affordableCards.length)];
      return { type: 'PURCHASE_CARD', playerIndex, card };
    }

    // Prefer taking gems (inexperienced players tend to gather first)
    if (validGemMoves.length > 0) {
      const gems = this.pickRandomGemMove(validGemMoves);
      if (gems.length > 0) {
        return { type: 'TAKE_GEMS', playerIndex, gems };
      }
    }

    // Occasionally reserve later in the game
    if (!isOpeningTurn && reservableCards.length > 0 && Math.random() < 0.25) {
      const card = reservableCards[Math.floor(Math.random() * reservableCards.length)];
      return { type: 'RESERVE_CARD', playerIndex, card };
    }

    // Fallback: buy if possible, otherwise end turn
    if (affordableCards.length > 0) {
      const card = affordableCards[Math.floor(Math.random() * affordableCards.length)];
      return { type: 'PURCHASE_CARD', playerIndex, card };
    }

    return { type: 'END_TURN', playerIndex };
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
    const isOpeningTurn = this.isOpeningTurn(playerState);

    // Chance to pick random valid action for unpredictability
    if (Math.random() < this.profile.randomMoveChance) {
      const validGemMoves = this.getValidGemMoves(gameState, playerState);
      const allMoves: GameAction[] = [];

      if (affordableCards.length > 0) {
        const card = affordableCards[Math.floor(Math.random() * affordableCards.length)];
        allMoves.push({ type: 'PURCHASE_CARD', playerIndex, card });
      }

      validGemMoves.forEach(gems => {
        allMoves.push({ type: 'TAKE_GEMS', playerIndex, gems });
      });

      if (reservableCards.length > 0 && !isOpeningTurn) {
        const card = reservableCards[Math.floor(Math.random() * reservableCards.length)];
        allMoves.push({ type: 'RESERVE_CARD', playerIndex, card });
      }

      allMoves.push({ type: 'END_TURN', playerIndex });

      if (allMoves.length > 0) {
        return allMoves[Math.floor(Math.random() * allMoves.length)];
      }
    }

    const displayedCards = [
      ...gameState.displayedCards.level1,
      ...gameState.displayedCards.level2,
      ...gameState.displayedCards.level3,
    ];

    // Priority 1: Purchase cards that lead to nobles
    if (affordableCards.length > 0 && reachableNobles.length > 0) {
      const nobleCards = affordableCards.filter(card => {
        return reachableNobles.some(noble => {
          const tempCards = [...playerState.purchasedCards, card];
          return this.meetsNobleRequirement(tempCards, noble);
        });
      });

      if (nobleCards.length > 0) {
        const bestCard = nobleCards.sort((a, b) => {
          const scoreA = this.scoreCard(a, playerState, gameState.nobles, 'medium');
          const scoreB = this.scoreCard(b, playerState, gameState.nobles, 'medium');
          return scoreB - scoreA;
        })[0];
        return { type: 'PURCHASE_CARD', playerIndex, card: bestCard };
      }
    }

    // Priority 2: Purchase best affordable card
    if (affordableCards.length > 0) {
      const bestCard = affordableCards.sort((a, b) => {
        const scoreA = this.scoreCard(a, playerState, gameState.nobles, 'medium');
        const scoreB = this.scoreCard(b, playerState, gameState.nobles, 'medium');
        return scoreB - scoreA;
      })[0];
      return { type: 'PURCHASE_CARD', playerIndex, card: bestCard };
    }

    // Priority 3: Collect gems toward top targets
    const targetCards = this.selectTargetCards(displayedCards, playerState, gameState.nobles, 'medium', 2);
    const gemsNeeded = this.chooseBestGemMove(gameState, playerState, targetCards, 'medium');
    if (gemsNeeded.length > 0) {
      return { type: 'TAKE_GEMS', playerIndex, gems: gemsNeeded };
    }

    // Priority 4: Reserve high-value or blocking cards
    if (!isOpeningTurn && reservableCards.length > 0) {
      const opponentNeeds = this.predictOpponentNeeds(gameState, playerIndex);
      const bestReserve = reservableCards.sort((a, b) => {
        let scoreA = this.scoreCard(a, playerState, gameState.nobles, 'medium');
        let scoreB = this.scoreCard(b, playerState, gameState.nobles, 'medium');

        if (opponentNeeds.some(need => this.cardMatchesRequirement(a, need))) {
          scoreA += 8;
        }
        if (opponentNeeds.some(need => this.cardMatchesRequirement(b, need))) {
          scoreB += 8;
        }

        const deficitA = this.getCardDeficit(playerState, a).missingAfterGold;
        const deficitB = this.getCardDeficit(playerState, b).missingAfterGold;
        scoreA += Math.max(0, 3 - deficitA) * 2;
        scoreB += Math.max(0, 3 - deficitB) * 2;

        return scoreB - scoreA;
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
    const isOpeningTurn = this.isOpeningTurn(playerState);

    // Priority 1: Purchase cards that complete noble requirements or win the game
    if (affordableCards.length > 0) {
      const nobleCards = affordableCards.filter(card => {
        const tempCards = [...playerState.purchasedCards, card];
        return reachableNobles.some(noble => this.meetsNobleRequirement(tempCards, noble));
      });

      if (nobleCards.length > 0) {
        const bestCard = nobleCards.sort((a, b) => {
          const scoreA = this.scoreCard(a, playerState, gameState.nobles, 'hard');
          const scoreB = this.scoreCard(b, playerState, gameState.nobles, 'hard');
          return scoreB - scoreA;
        })[0];

        if (playerState.points + bestCard.points >= GameRules.WINNING_POINTS) {
          return { type: 'PURCHASE_CARD', playerIndex, card: bestCard };
        }

        return { type: 'PURCHASE_CARD', playerIndex, card: bestCard };
      }
    }

    // Priority 2: Purchase best affordable card
    if (affordableCards.length > 0) {
      const bestCard = affordableCards.sort((a, b) => {
        const scoreA = this.scoreCard(a, playerState, gameState.nobles, 'hard');
        const scoreB = this.scoreCard(b, playerState, gameState.nobles, 'hard');
        return scoreB - scoreA;
      })[0];

      return { type: 'PURCHASE_CARD', playerIndex, card: bestCard };
    }

    // Priority 3: Choose gems that move toward top targets
    const targetCards = this.selectTargetCards(displayedCards, playerState, gameState.nobles, 'hard', 3);
    const gemsNeeded = this.chooseBestGemMove(gameState, playerState, targetCards, 'hard');
    if (gemsNeeded.length > 0 && GameRules.validateGemTake(gemsNeeded, gameState.gemPool, playerState.gems)) {
      return { type: 'TAKE_GEMS', playerIndex, gems: gemsNeeded };
    }

    // Priority 4: Reserve high-value or blocking cards
    if (!isOpeningTurn && reservableCards.length > 0) {
      const opponentNeeds = this.predictOpponentNeeds(gameState, playerIndex);

      const bestReserve = reservableCards.sort((a, b) => {
        let scoreA = this.scoreCard(a, playerState, gameState.nobles, 'hard');
        let scoreB = this.scoreCard(b, playerState, gameState.nobles, 'hard');

        if (opponentNeeds.some(need => this.cardMatchesRequirement(a, need))) {
          scoreA += 15;
        }
        if (opponentNeeds.some(need => this.cardMatchesRequirement(b, need))) {
          scoreB += 15;
        }

        const deficitA = this.getCardDeficit(playerState, a).missingAfterGold;
        const deficitB = this.getCardDeficit(playerState, b).missingAfterGold;
        scoreA += Math.max(0, 4 - deficitA) * 3;
        scoreB += Math.max(0, 4 - deficitB) * 3;

        return scoreB - scoreA;
      })[0];

      const bestDeficit = this.getCardDeficit(playerState, bestReserve).missingAfterGold;
      if (this.shouldReserveCard(bestReserve, gameState, playerIndex) || bestDeficit <= 2) {
        return { type: 'RESERVE_CARD', playerIndex, card: bestReserve };
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

    if (this.profile.focusColors.includes(card.color)) {
      score += 6;
    }

    return Math.min(score, 100);
  }

  private scoreCard(card: Card, playerState: PlayerState, nobles: Noble[], mode: 'medium' | 'hard'): number {
    const baseScore = this.evaluateCard(card, playerState, nobles);
    const totalCost = this.countGemCost(card.cost);
    const deficit = this.getCardDeficit(playerState, card).missingAfterGold;
    const earlyGame = playerState.points < 6;

    if (mode === 'medium') {
      let score = baseScore;
      score += Math.max(0, 6 - totalCost) * 2;
      score += Math.max(0, 3 - deficit) * 3;
      if (earlyGame && card.level === 1) {
        score += 4;
      }
      return score;
    }

    let score = baseScore;
    score += Math.max(0, 7 - totalCost) * 3;
    score += Math.max(0, 4 - deficit) * 5;
    if (earlyGame && card.level === 1) {
      score += 8;
    }
    if (card.points >= 3) {
      score += 6;
    }
    return score;
  }

  private getCardDeficit(playerState: PlayerState, card: Card): { missingAfterGold: number; totalMissing: number } {
    return this.getCardDeficitWithGems(card, playerState.gems);
  }

  private getCardDeficitWithGems(
    card: Card,
    gems: GemCost & { gold: number }
  ): { missingAfterGold: number; totalMissing: number } {
    const colors: (keyof GemCost)[] = ['red', 'blue', 'green', 'white', 'black'];
    let totalMissing = 0;

    for (const color of colors) {
      const needed = card.cost[color] || 0;
      const available = gems[color] || 0;
      if (available < needed) {
        totalMissing += needed - available;
      }
    }

    const missingAfterGold = Math.max(0, totalMissing - (gems.gold || 0));
    return { missingAfterGold, totalMissing };
  }

  private selectTargetCards(
    cards: Card[],
    playerState: PlayerState,
    nobles: Noble[],
    mode: 'medium' | 'hard',
    count: number
  ): Card[] {
    return cards
      .map(card => ({
        card,
        score: this.scoreCard(card, playerState, nobles, mode),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(({ card }) => card);
  }

  private chooseBestGemMove(
    gameState: GameState,
    playerState: PlayerState,
    targetCards: Card[],
    mode: 'medium' | 'hard'
  ): string[] {
    const validMoves = this.getValidGemMoves(gameState, playerState);
    if (validMoves.length === 0) {
      return [];
    }

    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    validMoves.forEach(move => {
      const simulatedGems: GemCost & { gold: number } = {
        ...playerState.gems,
      };

      move.forEach(color => {
        const gemColor = color as keyof GemCost;
        simulatedGems[gemColor] = (simulatedGems[gemColor] || 0) + 1;
      });

      let score = 0;
      targetCards.forEach(card => {
        const deficit = this.getCardDeficitWithGems(card, simulatedGems).missingAfterGold;
        const cardScore = this.scoreCard(card, playerState, gameState.nobles, mode);
        score += cardScore - deficit * (mode === 'hard' ? 6 : 4);
      });

      const focusHits = move.filter(color => this.profile.focusColors.includes(color as Color)).length;
      score += focusHits * (mode === 'hard' ? 3 : 2);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    });

    return bestMove;
  }

  private pickRandomGemMove(validMoves: string[][]): string[] {
    if (validMoves.length === 0) {
      return [];
    }

    const weightedMoves: string[][] = [];
    validMoves.forEach(move => {
      const focusHits = move.filter(color => this.profile.focusColors.includes(color as Color)).length;
      const weight = 1 + focusHits;
      for (let i = 0; i < weight; i += 1) {
        weightedMoves.push(move);
      }
    });

    return weightedMoves[Math.floor(Math.random() * weightedMoves.length)];
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
    const colorsByNeed = [...colors].sort((a, b) => {
      const needDelta = colorNeeds[b] - colorNeeds[a];
      if (needDelta !== 0) return needDelta;
      const aFocus = this.profile.focusColors.includes(a as Color) ? 1 : 0;
      const bFocus = this.profile.focusColors.includes(b as Color) ? 1 : 0;
      return bFocus - aFocus;
    });

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
    const playerState = gameState.players[playerIndex];
    const isOpeningTurn = this.isOpeningTurn(playerState);

    // High-value cards (points threshold varies by profile) always worth reserving
    if (card.points >= this.profile.reservePointsMin) {
      return true;
    }

    // Cards others might need
    const opponentNeeds = this.predictOpponentNeeds(gameState, playerIndex);
    const isBlocking = opponentNeeds.some(need => this.cardMatchesRequirement(card, need));

    // Level 2-3 cards are more valuable for reserving
    if (card.level >= 2 && (isBlocking || card.points >= 1)) {
      return true;
    }

    if (isOpeningTurn && !isBlocking) {
      return false;
    }

    return false;
  }

  /**
   * Helper: Detect opening turn (no gems and no purchased cards yet)
   */
  private isOpeningTurn(playerState: PlayerState): boolean {
    const totalGems =
      (playerState.gems.red || 0) +
      (playerState.gems.blue || 0) +
      (playerState.gems.green || 0) +
      (playerState.gems.white || 0) +
      (playerState.gems.black || 0) +
      (playerState.gems.gold || 0);
    return totalGems === 0 && playerState.purchasedCards.length === 0;
  }

  /**
   * Get nobles that are close to being reached (1-2 colors away)
   */
  private getReachableNobles(playerState: PlayerState, nobles: Noble[]): Noble[] {
    return nobles.filter(noble => {
      const missingColors = this.countMissingColors(playerState.purchasedCards, noble);
      return missingColors >= 0 && missingColors <= this.profile.nobleMissingMax;
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
    const discount = GameRules.calculateGemDiscount(playerState);

    for (const color of colors) {
      const needed = Math.max(0, (card.cost[color] || 0) - (discount[color] || 0));
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
