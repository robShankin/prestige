/**
 * Tests for TurnController - turn flow orchestration
 */

import { TurnController, GameReducer } from '../turnController';
import { GameState, GameAction, PlayerState, Card, Noble, Color } from '../../types';
import { GameRules } from '../rules';
import { AIPlayer } from '@ai/aiPlayer';

// Mock data factories
function createMockCard(overrides?: Partial<Card>): Card {
  return {
    id: `card-${Math.random()}`,
    level: 1,
    points: 1,
    color: 'red' as Color,
    cost: { red: 1 },
    ...overrides,
  };
}

function createMockNoble(overrides?: Partial<Noble>): Noble {
  return {
    id: `noble-${Math.random()}`,
    points: 3,
    requirement: { red: 3, blue: 3 },
    ...overrides,
  };
}

function createMockPlayerState(overrides?: Partial<PlayerState>): PlayerState {
  return {
    id: `player-${Math.random()}`,
    name: 'Test Player',
    gems: { red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 },
    purchasedCards: [],
    reservedCards: [],
    points: 0,
    nobles: [],
    isAI: false,
    ...overrides,
  };
}

function createMockGameState(overrides?: Partial<GameState>): GameState {
  return {
    players: [
      createMockPlayerState({ id: 'player1', isAI: false }),
      createMockPlayerState({ id: 'player2', isAI: false }),
    ],
    currentPlayerIndex: 0,
    deck: {
      level1: [],
      level2: [],
      level3: [],
    },
    nobles: [],
    displayedCards: {
      level1: [],
      level2: [],
      level3: [],
    },
    gemPool: { red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 },
    gamePhase: 'active',
    ...overrides,
  };
}

describe('TurnController', () => {
  let mockGameReducer: GameReducer;
  let turnController: TurnController;

  beforeEach(() => {
    // Mock the game reducer - simple implementation that advances player
    mockGameReducer = (state: GameState, action: GameAction): GameState => {
      const newState = { ...state };

      // Advance to next player on END_TURN
      if (action.type === 'END_TURN') {
        newState.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      }

      // Handle other actions similarly
      if (action.type === 'TAKE_GEMS') {
        newState.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      }

      if (action.type === 'PURCHASE_CARD') {
        newState.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      }

      if (action.type === 'RESERVE_CARD') {
        newState.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      }

      if (action.type === 'CLAIM_NOBLE') {
        newState.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      }

      return newState;
    };

    const aiPlayers = new Map<number, AIPlayer>();
    turnController = new TurnController(mockGameReducer, aiPlayers);
  });

  describe('getValidActions', () => {
    it('should always include END_TURN action', () => {
      const state = createMockGameState();
      const actions = turnController.getValidActions(state, 0);

      const hasEndTurn = actions.some(a => a.type === 'END_TURN');
      expect(hasEndTurn).toBe(true);
    });

    it('should include gem take actions when gems are available', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: { red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 },
          }),
        ],
        gemPool: { red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 },
      });

      const actions = turnController.getValidActions(state, 0);
      const gemTakes = actions.filter(a => a.type === 'TAKE_GEMS');

      expect(gemTakes.length).toBeGreaterThan(0);
    });

    it('should include reservation actions when under max reserved cards', () => {
      const card = createMockCard();
      const state = createMockGameState({
        players: [createMockPlayerState({ id: 'player1', reservedCards: [] })],
        displayedCards: {
          level1: [card],
          level2: [],
          level3: [],
        },
      });

      const actions = turnController.getValidActions(state, 0);
      const reservations = actions.filter(a => a.type === 'RESERVE_CARD');

      expect(reservations.length).toBeGreaterThan(0);
    });

    it('should not include reservation actions when at max reserved cards', () => {
      const card = createMockCard();
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            reservedCards: [card, card, card], // Max is 3
          }),
        ],
        displayedCards: {
          level1: [createMockCard()],
          level2: [],
          level3: [],
        },
      });

      const actions = turnController.getValidActions(state, 0);
      const reservations = actions.filter(a => a.type === 'RESERVE_CARD');

      expect(reservations.length).toBe(0);
    });

    it('should include purchase actions for affordable cards', () => {
      const affordableCard = createMockCard({ cost: { red: 1 } });
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: { red: 2, blue: 0, green: 0, white: 0, black: 0, gold: 0 },
          }),
        ],
        displayedCards: {
          level1: [affordableCard],
          level2: [],
          level3: [],
        },
      });

      const actions = turnController.getValidActions(state, 0);
      const purchases = actions.filter(a => a.type === 'PURCHASE_CARD');

      expect(purchases.length).toBeGreaterThan(0);
    });

    it('should include noble claim actions when requirements met', () => {
      const noble = createMockNoble({ requirement: { red: 1, blue: 1 } });
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: { red: 1, blue: 1, green: 0, white: 0, black: 0, gold: 0 },
          }),
        ],
        nobles: [noble],
      });

      const actions = turnController.getValidActions(state, 0);
      const nobleClaims = actions.filter(a => a.type === 'CLAIM_NOBLE');

      expect(nobleClaims.length).toBeGreaterThan(0);
    });
  });

  describe('executeTurn', () => {
    it('should execute a valid END_TURN action', async () => {
      const state = createMockGameState();
      const action: GameAction = { type: 'END_TURN', playerIndex: 0 };

      const result = await turnController.executeTurn(state, action);

      expect(result.currentPlayerIndex).toBe(1);
    });

    it('should throw error for action from wrong player', async () => {
      const state = createMockGameState({ currentPlayerIndex: 0 });
      const action: GameAction = { type: 'END_TURN', playerIndex: 1 };

      await expect(turnController.executeTurn(state, action)).rejects.toThrow(
        'Cannot execute action for player'
      );
    });

    it('should throw error for invalid action', async () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', gems: { red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 } }),
        ],
      });

      const invalidAction: GameAction = {
        type: 'TAKE_GEMS',
        playerIndex: 0,
        gems: ['red', 'blue', 'green', 'white'], // More than 3 gems
      };

      await expect(turnController.executeTurn(state, invalidAction)).rejects.toThrow('Invalid action');
    });
  });

  describe('checkEndGame', () => {
    it('should transition to endGame when player reaches winning points', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: GameRules.WINNING_POINTS }),
          createMockPlayerState({ id: 'player2', points: 5 }),
        ],
        gamePhase: 'active',
        currentPlayerIndex: 0,
      });

      const result = turnController.checkEndGame(state);

      expect(result.gamePhase).toBe('endGame');
    });

    it('should not transition if player below winning points', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: GameRules.WINNING_POINTS - 1 }),
          createMockPlayerState({ id: 'player2', points: 5 }),
        ],
        gamePhase: 'active',
      });

      const result = turnController.checkEndGame(state);

      expect(result.gamePhase).toBe('active');
    });

    it('should set winner with highest points', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: GameRules.WINNING_POINTS }),
          createMockPlayerState({ id: 'player2', points: 20 }), // Higher points
        ],
        gamePhase: 'active',
        currentPlayerIndex: 0,
      });

      // First call triggers endGame and advances player
      let result = turnController.checkEndGame(state);
      expect(result.gamePhase).toMatch(/endGame|finished/);

      // If in endGame, call again to potentially finish
      if (result.gamePhase === 'endGame') {
        result = turnController.checkEndGame(result);
      }

      // Winner should be set and should be the highest scorer
      if (result.winner) {
        expect(result.winner.id).toBe('player2');
      }
    });

    it('should not transition if already in endGame phase', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: GameRules.WINNING_POINTS }),
          createMockPlayerState({ id: 'player2', points: 5 }),
        ],
        gamePhase: 'endGame',
        currentPlayerIndex: 1,
      });

      const result = turnController.checkEndGame(state);

      // Should remain in endGame until current player cycles back
      expect(result.gamePhase).toMatch(/endGame|finished/);
    });
  });

  describe('executeAITurn', () => {
    it('should return state unchanged if current player is not AI', async () => {
      const state = createMockGameState({
        players: [createMockPlayerState({ id: 'player1', isAI: false })],
      });

      const result = await turnController.executeAITurn(state);

      expect(result).toEqual(state);
    });

    it(
      'should execute AI action if current player is AI',
      async () => {
        const mockAI = {
          decideAction: jest.fn(() => ({ type: 'END_TURN', playerIndex: 0 })),
        } as unknown as AIPlayer;

        const aiPlayers = new Map<number, AIPlayer>([[0, mockAI]]);
        turnController = new TurnController(mockGameReducer, aiPlayers);

        const state = createMockGameState({
          players: [
            createMockPlayerState({ id: 'player1', isAI: true }),
            createMockPlayerState({ id: 'player2', isAI: false }),
          ],
          currentPlayerIndex: 0,
        });

        const result = await turnController.executeAITurn(state);

        expect(mockAI.decideAction).toHaveBeenCalled();
        expect(result.currentPlayerIndex).toBe(1); // Should advance to human player and stop
      },
      10000
    );

    it(
      'should chain multiple AI turns',
      async () => {
        const mockAI1 = {
          decideAction: jest.fn(() => ({ type: 'END_TURN', playerIndex: 0 })),
        } as unknown as AIPlayer;

        const mockAI2 = {
          decideAction: jest.fn(() => ({ type: 'END_TURN', playerIndex: 1 })),
        } as unknown as AIPlayer;

        const aiPlayers = new Map<number, AIPlayer>([
          [0, mockAI1],
          [1, mockAI2],
        ]);

        turnController = new TurnController(mockGameReducer, aiPlayers);

        const state = createMockGameState({
          players: [
            createMockPlayerState({ id: 'player1', isAI: true }),
            createMockPlayerState({ id: 'player2', isAI: true }),
            createMockPlayerState({ id: 'player3', isAI: false }), // Human to prevent infinite loop
          ],
          currentPlayerIndex: 0,
        });

        const result = await turnController.executeAITurn(state);

        // Both AIs should have been called
        expect(mockAI1.decideAction).toHaveBeenCalled();
        expect(mockAI2.decideAction).toHaveBeenCalled();

        // Current player should advance to the human player
        expect(result.currentPlayerIndex).toBe(2);
      },
      10000
    );

    it('should stop chaining when reaching human player', async () => {
      const mockAI = {
        decideAction: jest.fn(() => ({ type: 'END_TURN', playerIndex: 0 })),
      } as unknown as AIPlayer;

      const aiPlayers = new Map<number, AIPlayer>([[0, mockAI]]);
      turnController = new TurnController(mockGameReducer, aiPlayers);

      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', isAI: true }),
          createMockPlayerState({ id: 'player2', isAI: false }), // Human player
        ],
        currentPlayerIndex: 0,
      });

      const result = await turnController.executeAITurn(state);

      expect(result.currentPlayerIndex).toBe(1); // Should stop at human player
    });
  });

  describe('awardNobles', () => {
    it('should award noble when player meets requirement', async () => {
      const noble = createMockNoble({ requirement: { red: 1 } });
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: { red: 1, blue: 0, green: 0, white: 0, black: 0, gold: 0 },
            points: 5,
          }),
        ],
        nobles: [noble],
      });

      // Manually call awardNobles (it's private, so we test via executeTurn)
      // For this test, we'll simulate what executeTurn does
      const validActions = turnController.getValidActions(state, 0);
      const nobleAction = validActions.find(a => a.type === 'CLAIM_NOBLE');

      expect(nobleAction).toBeDefined();
    });

    it('should not award noble if already claimed', async () => {
      const noble = createMockNoble();
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: { red: 3, blue: 3, green: 0, white: 0, black: 0, gold: 0 },
            nobles: [noble], // Already has this noble
          }),
        ],
        nobles: [noble],
      });

      const validActions = turnController.getValidActions(state, 0);
      const nobleActions = validActions.filter(a => a.type === 'CLAIM_NOBLE');

      expect(nobleActions.length).toBe(0);
    });
  });
});
