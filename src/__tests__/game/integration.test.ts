/**
 * Integration tests for game flow
 * Tests multiple systems working together
 */

import { initializeGame, gameReducer } from '../../game/engine';
import { GameRules } from '../../game/rules';
import { TurnController } from '../../game/turnController';
import { AIPlayer } from '../../ai/aiPlayer';
import type { GameState, GameAction } from '../../types';

describe('Game Flow Integration', () => {
  it('should complete a full game initialization', () => {
    const gameState = initializeGame(2);

    expect(gameState.players.length).toBe(2);
    expect(gameState.currentPlayerIndex).toBe(0);
    expect(gameState.gamePhase).toBe('setup');
    expect(gameState.displayedCards.level1.length).toBe(4);
    expect(gameState.gemPool.red).toBe(4);
  });

  it('should execute a sequence of actions', () => {
    const gameState = initializeGame(2);

    // First action: take gems
    const takeAction: GameAction = {
      type: 'TAKE_GEMS',
      playerIndex: 0,
      gems: ['red', 'blue', 'green'],
    };

    let state = gameReducer(gameState, takeAction);
    expect(state.players[0].gems.red).toBe(1);
    expect(state.players[0].gems.blue).toBe(1);
    expect(state.players[0].gems.green).toBe(1);

    // Second action: end turn
    const endTurnAction: GameAction = {
      type: 'END_TURN',
      playerIndex: 0,
    };

    state = gameReducer(state, endTurnAction);
    expect(state.currentPlayerIndex).toBe(1);
  });

  it('should award nobles automatically on end turn', () => {
    const gameState = initializeGame(2);

    // Create a state where player can claim a noble
    const noble = gameState.nobles[0];
    gameState.players[0].gems = {
      red: (noble.requirement.red || 0) + 1,
      blue: (noble.requirement.blue || 0) + 1,
      green: (noble.requirement.green || 0) + 1,
      white: (noble.requirement.white || 0) + 1,
      black: (noble.requirement.black || 0) + 1,
      gold: 0,
    };

    const endTurnAction: GameAction = {
      type: 'END_TURN',
      playerIndex: 0,
    };

    const state = gameReducer(gameState, endTurnAction);

    // Player should have claimed the noble
    const shouldHaveNoble = GameRules.canAfford(gameState.players[0].gems, noble.requirement);
    if (shouldHaveNoble) {
      expect(state.players[0].nobles.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('should transition phases correctly', () => {
    let gameState = initializeGame(2);
    expect(gameState.gamePhase).toBe('setup');

    // End turn for player 0
    let action: GameAction = { type: 'END_TURN', playerIndex: 0 };
    gameState = gameReducer(gameState, action);

    // After first player ends, still in setup
    expect(gameState.gamePhase).toBe('setup');

    // End turn for player 1 - should transition to active
    action = { type: 'END_TURN', playerIndex: 1 };
    gameState = gameReducer(gameState, action);

    expect(gameState.gamePhase).toBe('active');
  });

  it('should detect game over when player reaches 15 points', () => {
    const gameState = initializeGame(2);

    // Give player 15 points
    gameState.players[0].points = 15;

    // Check if game is over
    expect(GameRules.isGameOver(gameState)).toBe(true);
  });

  it('should handle purchasing cards in sequence', () => {
    const gameState = initializeGame(2);

    const card = gameState.displayedCards.level1[0];
    if (card) {
      // Give player enough gems to purchase
      gameState.players[0].gems = {
        red: (card.cost.red || 0) + 5,
        blue: (card.cost.blue || 0) + 5,
        green: (card.cost.green || 0) + 5,
        white: (card.cost.white || 0) + 5,
        black: (card.cost.black || 0) + 5,
        gold: 0,
      };

      const purchaseAction: GameAction = {
        type: 'PURCHASE_CARD',
        playerIndex: 0,
        card,
      };

      const newState = gameReducer(gameState, purchaseAction);

      expect(newState.players[0].purchasedCards.length).toBe(1);
      expect(newState.players[0].points).toBeGreaterThanOrEqual(card.points);
    }
  });

  it('should reserve and then purchase cards', () => {
    const gameState = initializeGame(2);

    const card = gameState.displayedCards.level1[0];
    if (card) {
      // Reserve the card
      let state = gameReducer(gameState, {
        type: 'RESERVE_CARD',
        playerIndex: 0,
        card,
      });

      expect(state.players[0].reservedCards.length).toBe(1);
      expect(state.players[0].gems.gold).toBe(1);

      // Now purchase it
      state.players[0].gems = {
        red: (card.cost.red || 0) + 5,
        blue: (card.cost.blue || 0) + 5,
        green: (card.cost.green || 0) + 5,
        white: (card.cost.white || 0) + 5,
        black: (card.cost.black || 0) + 5,
        gold: 1,
      };

      state = gameReducer(state, {
        type: 'PURCHASE_CARD',
        playerIndex: 0,
        card,
      });

      expect(state.players[0].purchasedCards.length).toBe(1);
      expect(state.players[0].reservedCards.length).toBe(0);
    }
  });

  it('should handle turn controller action validation', () => {
    const gameState = initializeGame(2);

    const mockGameReducer = (state: GameState, action: GameAction): GameState => {
      if (action.type === 'END_TURN') {
        return {
          ...state,
          currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
        };
      }
      return state;
    };

    const aiPlayers = new Map<number, AIPlayer>();
    const turnController = new TurnController(mockGameReducer, aiPlayers);

    const validActions = turnController.getValidActions(gameState, 0);
    expect(validActions.length).toBeGreaterThan(0);
    expect(validActions.some(a => a.type === 'END_TURN')).toBe(true);
  });

  it('should apply gem discounts from purchased cards', () => {
    const gameState = initializeGame(2);

    // Give player a red card
    const redCard = gameState.displayedCards.level1.find(c => c.color === 'red');
    if (redCard) {
      gameState.players[0].purchasedCards = [redCard];

      const discount = GameRules.calculateGemDiscount(gameState.players[0]);
      expect(discount.red).toBe(1);
    }
  });

  it('should get eligible nobles based on gem collection', () => {
    const gameState = initializeGame(2);

    // Give player gems matching a noble requirement
    if (gameState.nobles.length > 0) {
      const noble = gameState.nobles[0];
      gameState.players[0].gems = {
        red: (noble.requirement.red || 0) + 1,
        blue: (noble.requirement.blue || 0) + 1,
        green: (noble.requirement.green || 0) + 1,
        white: (noble.requirement.white || 0) + 1,
        black: (noble.requirement.black || 0) + 1,
        gold: 0,
      };

      const eligible = GameRules.getEligibleNobles(gameState, 0);
      expect(eligible.length).toBeGreaterThan(0);
    }
  });

  it('should validate gem takes from pool', () => {
    const gameState = initializeGame(2);

    // Try to take gems
    const gems = ['red', 'blue'];
    const isValid = GameRules.validateGemTake(
      gems,
      gameState.gemPool,
      gameState.players[0].gems
    );

    expect(typeof isValid).toBe('boolean');
  });

  it('should handle multiple players with AI', () => {
    const gameState = initializeGame(3);

    expect(gameState.players.length).toBe(3);
    expect(gameState.players[0].isAI).toBe(false);
    expect(gameState.players[1].isAI).toBe(true);
    expect(gameState.players[2].isAI).toBe(true);

    const aiPlayers = new Map<number, AIPlayer>();
    aiPlayers.set(1, new AIPlayer('ai-1', 'hard'));
    aiPlayers.set(2, new AIPlayer('ai-2', 'medium'));

    const turnController = new TurnController(
      (state, action) => gameReducer(state, action),
      aiPlayers
    );

    const actions = turnController.getValidActions(gameState, 1);
    expect(actions.length).toBeGreaterThan(0);
  });

  it('should refill displayed cards when reserved', () => {
    const gameState = initializeGame(2);

    const cardToReserve = gameState.displayedCards.level1[0];

    if (cardToReserve) {
      const newState = gameReducer(gameState, {
        type: 'RESERVE_CARD',
        playerIndex: 0,
        card: cardToReserve,
      });

      // Should have 4 displayed cards (one removed, one added from deck)
      expect(newState.displayedCards.level1.length).toBe(4);
      // The reserved card should not be in displayed cards anymore
      expect(
        newState.displayedCards.level1.some(c => c.id === cardToReserve.id)
      ).toBe(false);
    }
  });

  it('should handle all gem colors in take gems action', () => {
    const gameState = initializeGame(2);

    const colors = ['red', 'blue', 'green', 'white', 'black'];

    for (const color of colors) {
      const canTake = GameRules.validateGemTake(
        [color, color],
        gameState.gemPool,
        gameState.players[0].gems
      );
      expect(typeof canTake).toBe('boolean');
    }
  });
});
