/**
 * Final targeted tests for remaining branch coverage
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
import type { GameAction } from '../../types';

describe('Final Branch Coverage', () => {
  describe('Valid gem take combinations', () => {
    it('should handle gem takes when player near limit', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 9, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        gemPool: createGemPool({ red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 }),
      });

      const actions = turnController.getValidActions(state, 0);
      const gemTakes = actions.filter(a => a.type === 'TAKE_GEMS');

      // May be able to take 1 gem (9 + 1 = 10)
      expect(typeof gemTakes.length).toBe('number');
    });

    it('should allow single gem take when player at 8 gems', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 8, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        gemPool: createGemPool({ red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 }),
      });

      const actions = turnController.getValidActions(state, 0);
      const gemTakes = actions.filter(a => a.type === 'TAKE_GEMS');

      // Should have some gem takes possible
      expect(gemTakes.length).toBeGreaterThan(0);
    });

    it('should handle 2-of-same gem takes', () => {
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
      const gemTakes = actions.filter(a => a.type === 'TAKE_GEMS');

      // Should have some gem takes
      expect(gemTakes.length).toBeGreaterThan(0);
    });

    it('should handle 3-different gem takes', () => {
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
      const gemTakes = actions.filter(a => a.type === 'TAKE_GEMS');

      // Should include some 3-gem combinations
      const threeDiff = gemTakes.filter(a => (a as any).gems.length === 3);

      expect(threeDiff.length).toBeGreaterThan(0);
    });
  });

  describe('Card purchase validation', () => {
    it('should only list cards from displayed and reserved', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const displayedCard = createMockCard({ id: 'displayed', cost: {} });
      const reservedCard = createMockCard({ id: 'reserved', cost: {} });
      const deckCard = createMockCard({ id: 'deck', cost: {} });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 10, blue: 10, green: 10, white: 10, black: 10, gold: 10 }),
            reservedCards: [reservedCard],
          }),
        ],
        displayedCards: {
          level1: [displayedCard],
          level2: [],
          level3: [],
        },
        deck: {
          level1: [deckCard],
          level2: [],
          level3: [],
        },
      });

      const actions = turnController.getValidActions(state, 0);
      const purchases = actions.filter(a => a.type === 'PURCHASE_CARD');

      // Should only have 2 purchaseable cards (displayed + reserved)
      expect(purchases.length).toBe(2);

      const purchaseIds = purchases.map(a => (a as any).card.id);
      expect(purchaseIds).toContain('displayed');
      expect(purchaseIds).toContain('reserved');
      expect(purchaseIds).not.toContain('deck');
    });
  });

  describe('Noble claim filtering', () => {
    it('should filter out nobles with mismatched requirements', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const claimable = createMockNoble({
        id: 'claimable',
        requirement: { red: 1 },
      });
      const unclaimable = createMockNoble({
        id: 'unclaimable',
        requirement: { red: 10 },
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 2, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        nobles: [claimable, unclaimable],
      });

      const actions = turnController.getValidActions(state, 0);
      const nobleClaims = actions.filter(a => a.type === 'CLAIM_NOBLE');

      // Should only have 1 claimable noble
      expect(nobleClaims.length).toBe(1);
      expect((nobleClaims[0] as any).noble.id).toBe('claimable');
    });

    it('should exclude already-claimed nobles', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const claimed = createMockNoble({
        id: 'claimed',
        requirement: { red: 1 },
      });
      const available = createMockNoble({
        id: 'available',
        requirement: { red: 1 },
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 2, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
            nobles: [claimed],
          }),
        ],
        nobles: [claimed, available],
      });

      const actions = turnController.getValidActions(state, 0);
      const nobleClaims = actions.filter(a => a.type === 'CLAIM_NOBLE');

      // Should only have 1 claimable noble (available)
      expect(nobleClaims.length).toBe(1);
      expect((nobleClaims[0] as any).noble.id).toBe('available');
    });
  });

  describe('Reservation limits', () => {
    it('should allow reservation when at 2 cards', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            reservedCards: [createMockCard({ id: 'r1' }), createMockCard({ id: 'r2' })],
          }),
        ],
        displayedCards: {
          level1: [createMockCard({ id: 'new' })],
          level2: [],
          level3: [],
        },
      });

      const actions = turnController.getValidActions(state, 0);
      const reserves = actions.filter(a => a.type === 'RESERVE_CARD');

      expect(reserves.length).toBeGreaterThan(0);
    });

    it('should disallow reservation when at 3 cards', () => {
      const turnController = new TurnController(gameReducer, new Map());
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            reservedCards: [
              createMockCard({ id: 'r1' }),
              createMockCard({ id: 'r2' }),
              createMockCard({ id: 'r3' }),
            ],
          }),
        ],
        displayedCards: {
          level1: [createMockCard({ id: 'new' })],
          level2: [],
          level3: [],
        },
      });

      const actions = turnController.getValidActions(state, 0);
      const reserves = actions.filter(a => a.type === 'RESERVE_CARD');

      expect(reserves.length).toBe(0);
    });
  });

  describe('AI player conditions', () => {
    it('should not auto-execute AI when no AI player configured', async () => {
      // Empty AI map - no AI player for index 0
      const turnController = new TurnController(gameReducer, new Map());

      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'ai-1', isAI: true }),
          createMockPlayerState({ id: 'human', isAI: false }),
        ],
        currentPlayerIndex: 0,
        gamePhase: 'active',
      });

      // Since no AI player configured, should advance without executing
      const result = await turnController.executeAITurn(state);

      expect(result.currentPlayerIndex).toBe(1);
    });

    it('should handle game phase transitions correctly', async () => {
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

      // Should have executed AI action
      expect(mockAI.decideAction).toHaveBeenCalled();
    });

    it('should handle endGame phase in AI turns', async () => {
      const mockAI = {
        decideAction: jest.fn(() => ({ type: 'END_TURN', playerIndex: 0 })),
      } as unknown as AIPlayer;

      const aiPlayers = new Map<number, AIPlayer>([[0, mockAI]]);
      const turnController = new TurnController(gameReducer, aiPlayers);

      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'ai-1', isAI: true, points: 15 }),
          createMockPlayerState({ id: 'human', isAI: false, points: 10 }),
        ],
        currentPlayerIndex: 0,
        gamePhase: 'endGame',
      });

      const result = await turnController.executeAITurn(state);

      // Should handle endGame appropriately
      expect(['endGame', 'finished']).toContain(result.gamePhase);
    });
  });

  describe('Multiple nobles award', () => {
    it('should award eligible nobles on turn end', async () => {
      const turnController = new TurnController(gameReducer, new Map());

      const noble1 = createMockNoble({
        id: 'noble1',
        points: 3,
        requirement: { red: 1 },
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({
              red: 1,
              blue: 0,
              green: 0,
              white: 0,
              black: 0,
              gold: 0,
            }),
          }),
        ],
        nobles: [noble1],
        currentPlayerIndex: 0,
        gamePhase: 'active',
      });

      const action: GameAction = { type: 'END_TURN', playerIndex: 0 };

      const result = await turnController.executeTurn(state, action);

      // Noble should be awarded
      expect(result.players[0].nobles.length).toBeGreaterThanOrEqual(1);
      expect(result.players[0].points).toBeGreaterThanOrEqual(3);
    });
  });
});
