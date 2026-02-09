/**
 * Branch coverage tests for edge cases and conditional paths
 */

import { GameRules } from '../../game/rules';
import { TurnController } from '../../game/turnController';
import {
  createMockGameState,
  createMockCard,
  createMockPlayerState,
  createMockNoble,
  createGemPool,
} from '../../testUtils';
import type { GameState, GameAction } from '../../types';

describe('Branch Coverage Tests', () => {
  describe('GameRules edge cases', () => {
    it('should handle canAfford with exact gem match', () => {
      const playerGems = createGemPool({ red: 2, blue: 1, green: 0, white: 0, black: 0, gold: 0 });
      const cost = { red: 2, blue: 1 };

      expect(GameRules.canAfford(playerGems, cost)).toBe(true);
    });

    it('should handle canAfford with partial match needing gold', () => {
      const playerGems = createGemPool({
        red: 1,
        blue: 0,
        green: 0,
        white: 0,
        black: 0,
        gold: 3,
      });
      const cost = { red: 2, blue: 1 };

      expect(GameRules.canAfford(playerGems, cost)).toBe(true);
    });

    it('should handle canAfford with insufficient gold', () => {
      const playerGems = createGemPool({
        red: 1,
        blue: 0,
        green: 0,
        white: 0,
        black: 0,
        gold: 0,
      });
      const cost = { red: 2, blue: 1 };

      expect(GameRules.canAfford(playerGems, cost)).toBe(false);
    });

    it('should calculate discount with multiple same color cards', () => {
      const cards = [
        createMockCard({ id: 'red-1', color: 'red' }),
        createMockCard({ id: 'red-2', color: 'red' }),
        createMockCard({ id: 'red-3', color: 'red' }),
      ];
      const player = createMockPlayerState({ purchasedCards: cards });

      const discount = GameRules.calculateGemDiscount(player);
      expect(discount.red).toBe(3);
    });

    it('should return empty nobles for invalid player index', () => {
      const state = createMockGameState();
      const nobles = GameRules.getEligibleNobles(state, 999);

      expect(nobles).toEqual([]);
    });

    it('should validate gem take with exact pool match', () => {
      const gems = ['red', 'red'];
      const poolGems = createGemPool({ red: 2, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const playerGems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });

      expect(GameRules.validateGemTake(gems, poolGems, playerGems)).toBe(true);
    });

    it('should fail gem take with insufficient pool gems', () => {
      const gems = ['red', 'red', 'red'];
      const poolGems = createGemPool({ red: 2, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const playerGems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });

      expect(GameRules.validateGemTake(gems, poolGems, playerGems)).toBe(false);
    });
  });

  describe('TurnController valid actions', () => {
    let turnController: TurnController;
    let mockGameReducer: (state: GameState, action: GameAction) => GameState;

    beforeEach(() => {
      mockGameReducer = (state: GameState, action: GameAction): GameState => {
        if (action.type === 'END_TURN') {
          return {
            ...state,
            currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
          };
        }
        return state;
      };

      turnController = new TurnController(mockGameReducer, new Map());
    });

    it('should not include reservations when player at max reserved', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            reservedCards: [createMockCard(), createMockCard(), createMockCard()],
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

    it('should include affordable card purchases', () => {
      const card = createMockCard({ id: 'card-1', cost: { red: 1 } });
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 2, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        displayedCards: {
          level1: [card],
          level2: [],
          level3: [],
        },
      });

      const actions = turnController.getValidActions(state, 0);
      const purchases = actions.filter(a => a.type === 'PURCHASE_CARD');

      expect(purchases.length).toBeGreaterThan(0);
    });

    it('should not include unaffordable card purchases', () => {
      const card = createMockCard({ id: 'card-1', cost: { red: 10 } });
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 1, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        displayedCards: {
          level1: [card],
          level2: [],
          level3: [],
        },
      });

      const actions = turnController.getValidActions(state, 0);
      const purchases = actions.filter(a => a.type === 'PURCHASE_CARD');

      expect(purchases.length).toBe(0);
    });

    it('should include both displayed and reserved card purchases', () => {
      const displayedCard = createMockCard({ id: 'displayed-1', cost: {} });
      const reservedCard = createMockCard({ id: 'reserved-1', cost: {} });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 5, blue: 5, green: 5, white: 5, black: 5, gold: 5 }),
            reservedCards: [reservedCard],
          }),
        ],
        displayedCards: {
          level1: [displayedCard],
          level2: [],
          level3: [],
        },
      });

      const actions = turnController.getValidActions(state, 0);
      const purchases = actions.filter(a => a.type === 'PURCHASE_CARD');

      expect(purchases.length).toBe(2);
    });

    it('should not claim nobles player already has', () => {
      const noble = createMockNoble({ id: 'noble-1', requirement: { red: 1 } });
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 2, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
            nobles: [noble],
          }),
        ],
        nobles: [noble],
      });

      const actions = turnController.getValidActions(state, 0);
      const nobleClaims = actions.filter(a => a.type === 'CLAIM_NOBLE');

      expect(nobleClaims.length).toBe(0);
    });

    it('should only claim nobles player can afford', () => {
      const affordable = createMockNoble({
        id: 'noble-1',
        requirement: { red: 1 },
      });
      const unaffordable = createMockNoble({
        id: 'noble-2',
        requirement: { red: 5 },
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({ red: 2, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        nobles: [affordable, unaffordable],
      });

      const actions = turnController.getValidActions(state, 0);
      const nobleClaims = actions.filter(a => a.type === 'CLAIM_NOBLE');

      expect(nobleClaims.length).toBe(1);
      expect((nobleClaims[0] as any).noble.id).toBe('noble-1');
    });

    it('should handle player with no displayed cards', () => {
      const state = createMockGameState({
        players: [createMockPlayerState({ id: 'player1' })],
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

    it('should generate valid gem combinations with available gems', () => {
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

      expect(gemActions.length).toBeGreaterThan(0);
    });
  });

  describe('Complex player states', () => {
    it('should handle player with all gems at max', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({
              red: 10,
              blue: 0,
              green: 0,
              white: 0,
              black: 0,
              gold: 0,
            }),
          }),
        ],
      });

      const turnController = new TurnController(
        (s, a) => s,
        new Map()
      );

      const actions = turnController.getValidActions(state, 0);
      const gemActions = actions.filter(a => a.type === 'TAKE_GEMS');

      expect(gemActions.length).toBe(0);
    });

    it('should handle player with mixed gem holdings', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'player1',
            gems: createGemPool({
              red: 3,
              blue: 2,
              green: 1,
              white: 2,
              black: 1,
              gold: 0,
            }),
          }),
        ],
        gemPool: createGemPool({
          red: 4,
          blue: 4,
          green: 4,
          white: 4,
          black: 4,
          gold: 5,
        }),
      });

      const turnController = new TurnController(
        (s, a) => s,
        new Map()
      );

      const actions = turnController.getValidActions(state, 0);

      expect(actions.length).toBeGreaterThan(0);
    });
  });
});
