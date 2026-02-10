/**
 * Turn flow orchestration and AI automation.
 *
 * Manages turn execution, action validation, AI chaining, noble awarding,
 * and game phase transitions. Bridges game engine and AI players.
 */

import type { GameState, GameAction, PlayerState, Color } from '../types';
import { GameRules } from './rules';
import { AIPlayer } from '../ai/aiPlayer';

/**
 * Type signature for game reducer function.
 * Defines contract between TurnController and game engine.
 */
export type GameReducer = (state: GameState, action: GameAction) => GameState;

/**
 * TurnController - Orchestrates game flow and turn execution.
 *
 * Responsibilities:
 * - Validate actions before execution
 * - Apply actions via gameReducer
 * - Auto-award eligible nobles after each turn
 * - Chain AI turns with delays (500ms for UX)
 * - Detect end game condition and manage final round
 * - Track game phases (setup → active → endGame → finished)
 */
export class TurnController {
  private gameReducer: GameReducer;
  private aiPlayers: Map<number, AIPlayer> = new Map();

  /**
   * Create a new TurnController.
   *
   * @param gameReducer - Pure reducer function from engine.ts
   * @param aiPlayers - Map of player index to AIPlayer instances
   */
  constructor(gameReducer: GameReducer, aiPlayers: Map<number, AIPlayer>) {
    this.gameReducer = gameReducer;
    this.aiPlayers = aiPlayers;
  }

  /**
   * Execute a player action and handle subsequent AI turns if needed.
   *
   * Main entry point for turn execution. Validates the action, applies it,
   * awards nobles, checks end game, and auto-executes AI turns if the
   * next player is controlled by AI.
   *
   * @param state - Current game state
   * @param action - Action to execute (must be current player's turn)
   * @returns Final game state after all turns complete (human + chained AI)
   * @throws Error if playerIndex doesn't match currentPlayerIndex or action is invalid
   *
   * @example
   * const newState = await turnController.executeTurn(gameState, {
   *   type: 'PURCHASE_CARD',
   *   playerIndex: 0,
   *   card: selectedCard
   * });
   */
  async executeTurn(state: GameState, action: GameAction): Promise<GameState> {
    const playerIndex = action.playerIndex;

    // Validate action is legal for current player
    if (playerIndex !== state.currentPlayerIndex) {
      throw new Error(
        `Cannot execute action for player ${playerIndex}. Current player is ${state.currentPlayerIndex}`
      );
    }

    const validActions = this.getValidActions(state, playerIndex);
    const isValidAction = this.isActionValid(state, action, validActions);

    if (!isValidAction) {
      throw new Error(`Invalid action: ${action.type} for player ${playerIndex}`);
    }

    // Apply the action (human turn: explicit END_TURN required)
    let newState = this.gameReducer(state, action);

    if (action.type !== 'END_TURN') {
      const player = newState.players[action.playerIndex];
      const excess = GameRules.countGems(player.gems) - GameRules.MAX_GEMS_PER_PLAYER;
      if (excess > 0) {
        newState = {
          ...newState,
          pendingDiscard: { playerIndex: action.playerIndex, count: excess },
        };
      }
    }

    if (action.type === 'END_TURN') {
      // Check end game condition
      newState = this.checkEndGame(newState);

      // If next player is AI, recursively execute AI turns
      if (newState.gamePhase !== 'finished') {
        newState = await this.executeAITurn(newState);
      }
    }

    return newState;
  }

  /**
   * Execute AI turns with automatic chaining.
   *
   * Loops executing AI turns until a human player is next or game finishes.
   * Each AI decision includes a 500ms delay for UX (showing "thinking").
   *
   * Used internally by executeTurn after a player action.
   *
   * @param state - Current game state (next player must be AI)
   * @returns Final game state after all chained AI turns complete
   *
   * @internal
   */
  async executeAITurn(state: GameState): Promise<GameState> {
    let currentState = state;

    // Keep executing AI turns while the current player is AI and game is active
    while (
      currentState.gamePhase === 'setup' ||
      currentState.gamePhase === 'active' ||
      currentState.gamePhase === 'endGame'
    ) {
      const currentPlayer = currentState.players[currentState.currentPlayerIndex];

      if (!currentPlayer.isAI) {
        // Human player's turn, stop AI chain
        break;
      }

      // If AI must discard, do it immediately
      if (
        currentState.pendingDiscard &&
        currentState.pendingDiscard.playerIndex === currentState.currentPlayerIndex
      ) {
        const discardAction = this.buildAIDiscardAction(
          currentState,
          currentState.currentPlayerIndex
        );
        currentState = this.applyActionAndEndTurn(currentState, discardAction);
        currentState = this.checkEndGame(currentState);
        if (currentState.gamePhase === 'finished') {
          break;
        }
        continue;
      }

      // Get AI player instance
      const aiPlayer = this.aiPlayers.get(currentState.currentPlayerIndex);
      if (!aiPlayer) {
        // No AI player configured, end turn
        currentState = this.advanceToNextPlayer(currentState);
        continue;
      }

      // Add delay for UX (shows AI thinking)
      await this.delay(500);

      // Get AI decision (with implicit timeout via game logic)
      let aiAction: GameAction;
      try {
        aiAction = aiPlayer.decideAction(currentState, currentPlayer);
      } catch (error) {
        // If AI errors, fall back to END_TURN
        console.warn('AI decision failed:', error);
        aiAction = { type: 'END_TURN', playerIndex: currentState.currentPlayerIndex };
      }

      const validActions = this.getValidActions(currentState, currentState.currentPlayerIndex);
      if (!this.isActionValid(currentState, aiAction, validActions)) {
        aiAction = { type: 'END_TURN', playerIndex: currentState.currentPlayerIndex };
      }

      // Apply action via gameReducer (one action per turn)
      currentState = this.applyActionAndEndTurn(currentState, aiAction);

      // Check end game condition
      currentState = this.checkEndGame(currentState);

      // If game is finished, break the loop
      if (currentState.gamePhase === 'finished') {
        break;
      }
    }

    return currentState;
  }

  /**
   * Check for game end conditions and handle end game phase.
   *
   * Manages state transitions:
   * - active → endGame when any player reaches WINNING_POINTS
   * - endGame → finished after final round completes
   *
   * During endGame phase, each remaining player gets exactly one final turn.
   *
   * @param state - Current game state
   * @returns Updated game state with gamePhase and winner set if needed
   */
  checkEndGame(state: GameState): GameState {
    // Check if any player has reached winning points
    const winnerCandidate = state.players.find(p => p.points >= GameRules.WINNING_POINTS);

    if (winnerCandidate && state.gamePhase === 'active') {
      // Transition to endGame phase
      let newState = { ...state, gamePhase: 'endGame' as const };

      // Remember who triggered the end game
      const triggerIndex = newState.currentPlayerIndex;

      // Give remaining players one final turn each (round-robin once)
      // All players except the one who triggered get one more turn
      let playersRemaining = newState.players.length - 1;

      while (playersRemaining > 0) {
        // Advance to next player
        newState = this.advanceToNextPlayer(newState) as typeof newState;

        // Skip the player who triggered end game if we circle back
        if (newState.currentPlayerIndex === triggerIndex) {
          break;
        }

        // If this is an AI player in endGame, they still get a turn but we don't auto-execute here
        // (that's handled by executeAITurn in the main game loop)
        playersRemaining--;
      }

      // After all players got final turn, game is finished
      if (newState.currentPlayerIndex === triggerIndex) {
        // Determine winner (highest points)
        const winner = newState.players.reduce((best, current) =>
          current.points > best.points ? current : best
        );

        return { ...newState, gamePhase: 'finished' as const, winner };
      }

      return newState;
    }

    // Check if we should transition from endGame to finished
    if (state.gamePhase === 'endGame') {
      const triggerIndex = state.players.findIndex(p => p.points >= GameRules.WINNING_POINTS);

      // If currentPlayerIndex cycles back to trigger player, game is finished
      if (state.currentPlayerIndex === triggerIndex) {
        // Determine winner (highest points)
        const winner = state.players.reduce((best, current) =>
          current.points > best.points ? current : best
        );

        return { ...state, gamePhase: 'finished' as const, winner };
      }
    }

    return state;
  }

  /**
   * Get all valid actions for a player.
   *
   * Computes complete set of legal moves the player can make.
   * Includes gem takes, card reservations, card purchases, noble claims, and end turn.
   *
   * @param state - Current game state
   * @param playerIndex - Index of the player
   * @returns Array of all valid GameActions player can perform
   */
  getValidActions(state: GameState, playerIndex: number): GameAction[] {
    const player = state.players[playerIndex];
    const validActions: GameAction[] = [];

    if (state.pendingDiscard) {
      if (state.pendingDiscard.playerIndex !== playerIndex) {
        return [];
      }
      return [{ type: 'DISCARD_GEMS', playerIndex, gems: [] }];
    }

    // Always include END_TURN
    validActions.push({ type: 'END_TURN', playerIndex });

    // Add gem taking actions
    const gemTakeActions = this.getValidGemTakes(state, playerIndex, player);
    validActions.push(...gemTakeActions);

    // Add card reservation actions
    const reservationActions = this.getValidReservations(state, playerIndex, player);
    validActions.push(...reservationActions);

    // Add card purchase actions
    const purchaseActions = this.getValidPurchases(state, playerIndex, player);
    validActions.push(...purchaseActions);

    // Add noble claiming actions
    const nobleActions = this.getValidNobleClaims(state, playerIndex, player);
    validActions.push(...nobleActions);

    return validActions;
  }

  /**
   * Get all valid gem-taking actions for a player
   */
  private getValidGemTakes(state: GameState, playerIndex: number, player: PlayerState): GameAction[] {
    const actions: GameAction[] = [];
    const colors: (keyof Omit<typeof state.gemPool, 'gold'>)[] = ['red', 'blue', 'green', 'white', 'black'];

    // Generate all possible combinations of gem takes (2 same or 3 different)
    const availableGems = colors.filter(color => (state.gemPool[color] || 0) > 0);

    // Two gem takes (same color) - only if 4+ in supply
    for (const gem of availableGems) {
      if ((state.gemPool[gem] || 0) >= 4) {
        const gems = [gem, gem];
        if (GameRules.validateGemTake(gems, state.gemPool, player.gems)) {
          actions.push({
            type: 'TAKE_GEMS',
            playerIndex,
            gems,
          });
        }
      }
    }

    if (availableGems.length >= 3) {
      // Three gem takes (different colors)
      for (let i = 0; i < availableGems.length; i++) {
        for (let j = i + 1; j < availableGems.length; j++) {
          for (let k = j + 1; k < availableGems.length; k++) {
            const gems = [availableGems[i], availableGems[j], availableGems[k]];
            if (GameRules.validateGemTake(gems, state.gemPool, player.gems)) {
              actions.push({
                type: 'TAKE_GEMS',
                playerIndex,
                gems,
              });
            }
          }
        }
      }
    } else if (availableGems.length === 2) {
      // When fewer than 3 colors are available, allow taking 2 different or 1
      const gems = [availableGems[0], availableGems[1]];
      if (GameRules.validateGemTake(gems, state.gemPool, player.gems)) {
        actions.push({
          type: 'TAKE_GEMS',
          playerIndex,
          gems,
        });
      }

      for (const gem of availableGems) {
        if (GameRules.validateGemTake([gem], state.gemPool, player.gems)) {
          actions.push({
            type: 'TAKE_GEMS',
            playerIndex,
            gems: [gem],
          });
        }
      }
    } else if (availableGems.length === 1) {
      const gem = availableGems[0];
      if (GameRules.validateGemTake([gem], state.gemPool, player.gems)) {
        actions.push({
          type: 'TAKE_GEMS',
          playerIndex,
          gems: [gem],
        });
      }
    }

    return actions;
  }

  /**
   * Get all valid card reservation actions for a player
   */
  private getValidReservations(state: GameState, playerIndex: number, player: PlayerState): GameAction[] {
    if (player.reservedCards.length >= GameRules.MAX_RESERVED_CARDS) {
      return [];
    }

    const actions: GameAction[] = [];
    const allCards = [
      ...state.displayedCards.level1,
      ...state.displayedCards.level2,
      ...state.displayedCards.level3,
    ];

    for (const card of allCards) {
      actions.push({
        type: 'RESERVE_CARD',
        playerIndex,
        card,
      });
    }

    return actions;
  }

  /**
   * Get all valid card purchase actions for a player
   */
  private getValidPurchases(state: GameState, playerIndex: number, player: PlayerState): GameAction[] {
    const actions: GameAction[] = [];

    // Displayed cards
    const displayedCards = [
      ...state.displayedCards.level1,
      ...state.displayedCards.level2,
      ...state.displayedCards.level3,
    ];

    for (const card of displayedCards) {
      if (GameRules.canPurchaseCard(player, card)) {
        actions.push({
          type: 'PURCHASE_CARD',
          playerIndex,
          card,
        });
      }
    }

    // Reserved cards
    for (const card of player.reservedCards) {
      if (GameRules.canPurchaseCard(player, card)) {
        actions.push({
          type: 'PURCHASE_CARD',
          playerIndex,
          card,
        });
      }
    }

    return actions;
  }

  /**
   * Get all valid noble claiming actions for a player
   */
  private getValidNobleClaims(state: GameState, playerIndex: number, player: PlayerState): GameAction[] {
    const actions: GameAction[] = [];

    for (const noble of state.nobles) {
      // Check if player already has this noble
      if (player.nobles.some(n => n.id === noble.id)) {
        continue;
      }

      // Check if player meets noble requirements
      if (GameRules.canAfford(player.gems, noble.requirement)) {
        actions.push({
          type: 'CLAIM_NOBLE',
          playerIndex,
          noble,
        });
      }
    }

    return actions;
  }

  /**
   * Award nobles to a player if they meet requirements
   * @param state Current game state
   * @param playerIndex Index of player to check for noble awards
   * @returns Updated game state with nobles awarded
   */
  private awardNobles(state: GameState, playerIndex: number): GameState {
    const player = state.players[playerIndex];
    let newState = state;

    // Find nobles this player is eligible for
    const eligibleNobles = state.nobles.filter(noble => {
      // Skip if player already has this noble
      if (player.nobles.some(n => n.id === noble.id)) {
        return false;
      }

      // Check if player meets requirements based on purchased cards
      return GameRules.canClaimNoble(player, noble);
    });

    // Award each eligible noble
    for (const noble of eligibleNobles) {
      const newPlayers = newState.players.map((p, idx) => {
        if (idx === playerIndex) {
          return {
            ...p,
            nobles: [...p.nobles, noble],
            points: p.points + noble.points,
          };
        }
        return p;
      });

      // Remove noble from available pool
      const newNobles = newState.nobles.filter(n => n.id !== noble.id);

      newState = {
        ...newState,
        players: newPlayers,
        nobles: newNobles,
      };
    }

    return newState;
  }

  /**
   * Apply a single action, then end the turn for that player.
   * Ensures "one action per turn" rule.
   */
  private applyActionAndEndTurn(state: GameState, action: GameAction): GameState {
    let newState = this.gameReducer(state, action);

    if (action.type === 'DISCARD_GEMS') {
      if (!newState.pendingDiscard) {
        newState = this.gameReducer(newState, { type: 'END_TURN', playerIndex: action.playerIndex });
      }
      return newState;
    }

    if (action.type !== 'END_TURN') {
      const player = newState.players[action.playerIndex];
      const excess = GameRules.countGems(player.gems) - GameRules.MAX_GEMS_PER_PLAYER;
      if (excess > 0) {
        return {
          ...newState,
          pendingDiscard: { playerIndex: action.playerIndex, count: excess },
        };
      }

      newState = this.gameReducer(newState, { type: 'END_TURN', playerIndex: action.playerIndex });
    }

    return newState;
  }

  /**
   * Advance to the next player's turn
   */
  private advanceToNextPlayer(state: GameState): GameState {
    const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
    return {
      ...state,
      currentPlayerIndex: nextIndex,
    };
  }

  /**
   * Check if an action matches any valid action
   */
  private isActionValidAgainstList(action: GameAction, validActions: GameAction[]): boolean {
    return validActions.some(validAction => {
      if (validAction.type !== action.type) return false;

      switch (action.type) {
        case 'END_TURN': {
          const vAction = validAction as typeof action;
          return vAction.playerIndex === action.playerIndex;
        }

        case 'TAKE_GEMS': {
          const vAction = validAction as typeof action;
          return (
            vAction.playerIndex === action.playerIndex &&
            JSON.stringify(vAction.gems.sort()) ===
            JSON.stringify(action.gems.sort())
          );
        }

        case 'DISCARD_GEMS': {
          const vAction = validAction as typeof action;
          return vAction.playerIndex === action.playerIndex;
        }

        case 'RESERVE_CARD': {
          const vAction = validAction as typeof action;
          return (
            vAction.playerIndex === action.playerIndex &&
            vAction.card.id === action.card.id
          );
        }

        case 'PURCHASE_CARD': {
          const vAction = validAction as typeof action;
          return (
            vAction.playerIndex === action.playerIndex &&
            vAction.card.id === action.card.id
          );
        }

        case 'CLAIM_NOBLE': {
          const vAction = validAction as typeof action;
          return (
            vAction.playerIndex === action.playerIndex &&
            vAction.noble.id === action.noble.id
          );
        }

        default:
          return false;
      }
    });
  }

  private isActionValid(state: GameState, action: GameAction, validActions: GameAction[]): boolean {
    if (state.pendingDiscard && action.type !== 'DISCARD_GEMS') {
      return false;
    }

    if (action.type === 'DISCARD_GEMS') {
      if (!state.pendingDiscard || state.pendingDiscard.playerIndex !== action.playerIndex) {
        return false;
      }
      if (action.gems.length !== state.pendingDiscard.count) {
        return false;
      }
      return true;
    }

    return this.isActionValidAgainstList(action, validActions);
  }

  private buildAIDiscardAction(state: GameState, playerIndex: number): GameAction {
    const player = state.players[playerIndex];
    const discardCount = state.pendingDiscard?.count || 0;
    const colors: Color[] = ['red', 'blue', 'green', 'white', 'black', 'gold'];

    const counts = colors.map(color => ({
      color,
      count: player.gems[color] || 0,
    }));

    counts.sort((a, b) => {
      if (a.color === 'gold') return 1;
      if (b.color === 'gold') return -1;
      return b.count - a.count;
    });

    const gemsToDiscard: string[] = [];
    let remaining = discardCount;

    for (const entry of counts) {
      if (remaining === 0) break;
      const take = Math.min(entry.count, remaining);
      for (let i = 0; i < take; i++) {
        gemsToDiscard.push(entry.color);
      }
      remaining -= take;
    }

    return { type: 'DISCARD_GEMS', playerIndex, gems: gemsToDiscard };
  }

  /**
   * Utility function to delay execution (for UI feedback)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
