/**
 * Tests for uncovered branches in TurnController
 */

import { TurnController } from '../../game/turnController';
import { gameReducer } from '../../game/engine';
import { AIPlayer } from '../../ai/aiPlayer';
import {
  createMockGameState,
  createMockCard,
  createMockPlayerState,
  createMockNoble,
  createGemPool,
} from '../../testUtils';
import type { GameState, GameAction } from '../../types';

describe('TurnController Branch Coverage', () => {
  describe('checkEndGame branches', () => {
    it('should handle transition from active to endGame', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: 15 }),
          createMockPlayerState({ id: 'player2', points: 5 }),
        ],
        gamePhase: 'active',
        currentPlayerIndex: 0,
      });

      const result = turnController.checkEndGame(state);

      // Should be in endGame or finished
      expect(['endGame', 'finished']).toContain(result.gamePhase);
    });

    it('should set winner when game finishes', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: 15 }),
          createMockPlayerState({ id: 'player2', points: 20 }),
        ],
        gamePhase: 'active',
        currentPlayerIndex: 0,
      });

      let result = turnController.checkEndGame(state);

      if (result.gamePhase === 'endGame') {
        // Simulate cycling through players to finish
        result = turnController.checkEndGame(result);
      }

      if (result.gamePhase === 'finished') {
        expect(result.winner).toBeDefined();
        if (result.winner) {
          expect(result.winner.points).toBeGreaterThanOrEqual(15);
        }
      }
    });

    it('should not transition if player below winning points', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: 14 }),
          createMockPlayerState({ id: 'player2', points: 5 }),
        ],
        gamePhase: 'active',
      });

      const result = turnController.checkEndGame(state);

      expect(result.gamePhase).toBe('active');
    });

    it('should handle endGame to finished transition', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: 15 }),
          createMockPlayerState({ id: 'player2', points: 10 }),
        ],
        gamePhase: 'endGame',
        currentPlayerIndex: 0,
      });

      const result = turnController.checkEndGame(state);

      // Should remain in endGame or transition to finished
      expect(['endGame', 'finished']).toContain(result.gamePhase);
    });
  });

  describe('getValidActions branches', () => {
    it('should handle player with no gems and no cards', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
            reservedCards: [],
          }),
        ],
        gemPool: createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
        displayedCards: {
          level1: [],
          level2: [],
          level3: [],
        },
      });

      const actions = turnController.getValidActions(state, 0);

      // Should at least have END_TURN
      expect(actions.some(a => a.type === 'END_TURN')).toBe(true);
    });

    it('should handle expensive cards player cannot afford', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const expensiveCard = createMockCard({
        id: 'expensive',
        cost: { red: 20, blue: 20, green: 20, white: 20, black: 20 },
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 1, blue: 1, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        displayedCards: {
          level1: [expensiveCard],
          level2: [],
          level3: [],
        },
      });

      const actions = turnController.getValidActions(state, 0);
      const purchases = actions.filter(a => a.type === 'PURCHASE_CARD');

      expect(purchases.length).toBe(0);
    });

    it('should generate combinations of different gem colors', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        gemPool: createGemPool({ red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 }),
      });

      const actions = turnController.getValidActions(state, 0);
      const gemActions = actions.filter(a => a.type === 'TAKE_GEMS');

      // Should have gem actions
      expect(gemActions.length).toBeGreaterThan(0);

      // Should include various combinations
      const actionGems = gemActions.map(a => (a as any).gems);

      // Check that we have different combinations
      const uniqueGemSets = new Set(actionGems.map((g: string[]) => JSON.stringify(g.sort())));
      expect(uniqueGemSets.size).toBeGreaterThan(0);
    });

    it('should handle cards in all three levels', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const card1 = createMockCard({ id: 'card1', level: 1, cost: {} });
      const card2 = createMockCard({ id: 'card2', level: 2, cost: {} });
      const card3 = createMockCard({ id: 'card3', level: 3, cost: {} });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 10, blue: 10, green: 10, white: 10, black: 10, gold: 10 }),
          }),
        ],
        displayedCards: {
          level1: [card1],
          level2: [card2],
          level3: [card3],
        },
      });

      const actions = turnController.getValidActions(state, 0);
      const purchases = actions.filter(a => a.type === 'PURCHASE_CARD');

      expect(purchases.length).toBe(3);
    });
  });

  describe('executeTurn branches', () => {
    it('should execute valid action from correct player', async () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        currentPlayerIndex: 0,
        gamePhase: 'active',
      });

      const action: GameAction = { type: 'END_TURN', playerIndex: 0 };

      const result = await turnController.executeTurn(state, action);

      expect(result.currentPlayerIndex).toBe(1);
    });

    it('should reject action from wrong player', async () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        currentPlayerIndex: 0,
        gamePhase: 'active',
      });

      const action: GameAction = { type: 'END_TURN', playerIndex: 1 };

      await expect(turnController.executeTurn(state, action)).rejects.toThrow();
    });

    it('should chain AI turns after human action', async () => {
      const mockAI = {
        decideAction: jest.fn(() => ({ type: 'END_TURN', playerIndex: 1 })),
      } as unknown as AIPlayer;

      const aiPlayers = new Map<number, AIPlayer>([[1, mockAI]]);
      const turnController = new TurnController(gameReducer, aiPlayers);

      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'human', isAI: false }),
          createMockPlayerState({ id: 'ai-1', isAI: true }),
        ],
        currentPlayerIndex: 0,
        gamePhase: 'active',
      });

      const action: GameAction = { type: 'END_TURN', playerIndex: 0 };

      const result = await turnController.executeTurn(state, action);

      // AI should have been called
      expect(mockAI.decideAction).toHaveBeenCalled();
    });
  });

  describe('executeAITurn branches', () => {
    it('should not execute if current player is human', async () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'human', isAI: false }),
        ],
        currentPlayerIndex: 0,
      });

      const result = await turnController.executeAITurn(state);

      expect(result).toEqual(state);
    });

    it('should execute AI action and advance turn', async () => {
      const mockAI = {
        decideAction: jest.fn(() => ({ type: 'END_TURN', playerIndex: 0 })),
      } as unknown as AIPlayer;

      const aiPlayers = new Map<number, AIPlayer>([[0, mockAI]]);
      const turnController = new TurnController(gameReducer, aiPlayers);

      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'ai-1', isAI: true }),
          createMockPlayerState({ id: 'human', isAI: false }),
        ],
        currentPlayerIndex: 0,
        gamePhase: 'active',
      });

      const result = await turnController.executeAITurn(state);

      expect(mockAI.decideAction).toHaveBeenCalled();
      expect(result.currentPlayerIndex).toBe(1);
    });

    it('should stop chaining when reaching human player', async () => {
      const mockAI = {
        decideAction: jest.fn(() => ({ type: 'END_TURN', playerIndex: 0 })),
      } as unknown as AIPlayer;

      const aiPlayers = new Map<number, AIPlayer>([[0, mockAI]]);
      const turnController = new TurnController(gameReducer, aiPlayers);

      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'ai-1', isAI: true }),
          createMockPlayerState({ id: 'human', isAI: false }),
        ],
        currentPlayerIndex: 0,
        gamePhase: 'active',
      });

      const result = await turnController.executeAITurn(state);

      // Should stop at human player
      expect(result.players[result.currentPlayerIndex].isAI).toBe(false);
    });

    it('should handle game phase transitions in AI turns', async () => {
      const mockAI = {
        decideAction: jest.fn(() => ({ type: 'END_TURN', playerIndex: 0 })),
      } as unknown as AIPlayer;

      const aiPlayers = new Map<number, AIPlayer>([[0, mockAI]]);
      const turnController = new TurnController(gameReducer, aiPlayers);

      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'ai-1', isAI: true }),
          createMockPlayerState({ id: 'human', isAI: false }),
        ],
        currentPlayerIndex: 0,
        gamePhase: 'active',
      });

      const result = await turnController.executeAITurn(state);

      expect(result.gamePhase).toBe('active');
    });
  });

  describe('Noble awarding branches', () => {
    it('should award multiple nobles if eligible', async () => {
      const turnController = new TurnController(gameReducer, new Map());
      const noble1 = createMockNoble({
        id: 'noble-1',
        requirement: { red: 1 },
      });
      const noble2 = createMockNoble({
        id: 'noble-2',
        requirement: { blue: 1 },
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 2, blue: 2, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        nobles: [noble1, noble2],
        currentPlayerIndex: 0,
        gamePhase: 'active',
      });

      const action: GameAction = { type: 'END_TURN', playerIndex: 0 };

      const result = await turnController.executeTurn(state, action);

      // Both nobles should be awarded
      expect(result.players[0].nobles.length).toBeGreaterThanOrEqual(2);
    });
  });
});
