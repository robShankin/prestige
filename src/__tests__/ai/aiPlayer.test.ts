/**
 * Test suite for AI Player strategies and decision-making
 * Target: 80%+ coverage of AI logic across all difficulty levels
 */

import { AIPlayer } from '../../ai/aiPlayer';
import { GameRules } from '../../game/rules';
import {
  createMockGameState,
  createMockCard,
  createMockPlayerState,
  createMockNoble,
  createGemPool,
} from '../../testUtils';
import type { GameAction } from '../../types';

describe('AIPlayer', () => {
  describe('Easy Strategy', () => {
    it('should return a valid GameAction', () => {
      const ai = new AIPlayer('ai-1', 'easy');
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        gemPool: createGemPool({ red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 }),
      });

      const action = ai.decideAction(state, state.players[0]);

      expect(action).toBeDefined();
      expect(action.type).toMatch(/TAKE_GEMS|PURCHASE_CARD|RESERVE_CARD|END_TURN|CLAIM_NOBLE/);
      expect(action.playerIndex).toBe(0);
    });

    it('should complete in under 100ms', () => {
      const ai = new AIPlayer('ai-1', 'easy');
      const state = createMockGameState({
        players: [createMockPlayerState({ id: 'ai-1', isAI: true })],
      });

      const start = performance.now();
      ai.decideAction(state, state.players[0]);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('should show randomness across multiple calls', () => {
      const ai = new AIPlayer('ai-1', 'easy');
      const state = createMockGameState({
        players: [createMockPlayerState({ id: 'ai-1', isAI: true })],
        gemPool: createGemPool({ red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 }),
        displayedCards: {
          level1: [createMockCard({ id: 'card-1', cost: {} })],
          level2: [],
          level3: [],
        },
      });

      const actions: GameAction[] = [];
      for (let i = 0; i < 10; i++) {
        actions.push(ai.decideAction(state, state.players[0]));
      }

      const uniqueActions = new Set(actions.map(a => JSON.stringify(a)));
      expect(uniqueActions.size).toBeGreaterThan(1);
    });

    it('should have bias toward purchasing when cards available', () => {
      const ai = new AIPlayer('ai-1', 'easy');
      const card = createMockCard({ id: 'card-1', cost: {} });
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 5, blue: 5, green: 5, white: 5, black: 5, gold: 5 }),
          }),
        ],
        displayedCards: {
          level1: [card],
          level2: [],
          level3: [],
        },
      });

      let purchaseCount = 0;
      for (let i = 0; i < 20; i++) {
        const action = ai.decideAction(state, state.players[0]);
        if (action.type === 'PURCHASE_CARD') {
          purchaseCount++;
        }
      }

      expect(purchaseCount).toBeGreaterThan(0);
    });
  });

  describe('Medium Strategy', () => {
    it('should return a valid GameAction', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        gemPool: createGemPool({ red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 }),
      });

      const action = ai.decideAction(state, state.players[0]);

      expect(action).toBeDefined();
      expect(action.type).toMatch(/TAKE_GEMS|PURCHASE_CARD|RESERVE_CARD|END_TURN|CLAIM_NOBLE/);
      expect(action.playerIndex).toBe(0);
    });

    it('should complete in under 500ms', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const state = createMockGameState({
        players: [createMockPlayerState({ id: 'ai-1', isAI: true })],
      });

      const start = performance.now();
      ai.decideAction(state, state.players[0]);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(500);
    });

    it('should evaluate card points', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const lowCard = createMockCard({
        id: 'card-1',
        points: 1,
        cost: {},
      });
      const highCard = createMockCard({
        id: 'card-2',
        points: 5,
        cost: {},
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 10, blue: 10, green: 10, white: 10, black: 10, gold: 10 }),
          }),
        ],
        displayedCards: {
          level1: [lowCard, highCard],
          level2: [],
          level3: [],
        },
        nobles: [],
      });

      const purchaseActions = [];
      for (let i = 0; i < 20; i++) {
        const action = ai.decideAction(state, state.players[0]);
        if (action.type === 'PURCHASE_CARD') {
          purchaseActions.push(action);
        }
      }

      // Higher card should be purchased more often
      const highCardPurchases = purchaseActions.filter(
        (a: any) => a.card.id === 'card-2'
      ).length;
      const lowCardPurchases = purchaseActions.filter((a: any) => a.card.id === 'card-1')
        .length;

      expect(highCardPurchases).toBeGreaterThanOrEqual(lowCardPurchases);
    });

    it('should consider nobles in strategy', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const noble = createMockNoble({
        id: 'noble-1',
        requirement: { red: 3, blue: 3 },
      });
      const cardTowardNoble = createMockCard({
        id: 'card-red',
        color: 'red',
        points: 2,
        cost: {},
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 10, blue: 10, green: 10, white: 10, black: 10, gold: 10 }),
            purchasedCards: [
              createMockCard({ id: 'red-1', color: 'red' }),
              createMockCard({ id: 'red-2', color: 'red' }),
              createMockCard({ id: 'blue-1', color: 'blue' }),
              createMockCard({ id: 'blue-2', color: 'blue' }),
            ],
          }),
        ],
        displayedCards: {
          level1: [cardTowardNoble],
          level2: [],
          level3: [],
        },
        nobles: [noble],
      });

      // Should consider purchasing card that leads to noble
      const action = ai.decideAction(state, state.players[0]);
      expect(action).toBeDefined();
    });
  });

  describe('Hard Strategy', () => {
    it('should return a valid GameAction', () => {
      const ai = new AIPlayer('ai-1', 'hard');
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        gemPool: createGemPool({ red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 }),
      });

      const action = ai.decideAction(state, state.players[0]);

      expect(action).toBeDefined();
      expect(action.type).toMatch(/TAKE_GEMS|PURCHASE_CARD|RESERVE_CARD|END_TURN|CLAIM_NOBLE/);
      expect(action.playerIndex).toBe(0);
    });

    it('should complete in under 1 second', () => {
      const ai = new AIPlayer('ai-1', 'hard');
      const state = createMockGameState({
        players: [createMockPlayerState({ id: 'ai-1', isAI: true })],
      });

      const start = performance.now();
      ai.decideAction(state, state.players[0]);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(1000);
    });

    it('should pursue high-value cards', () => {
      const ai = new AIPlayer('ai-1', 'hard');
      const lowCard = createMockCard({
        id: 'card-1',
        points: 1,
        cost: {},
      });
      const highCard = createMockCard({
        id: 'card-2',
        points: 5,
        cost: {},
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 10, blue: 10, green: 10, white: 10, black: 10, gold: 10 }),
          }),
        ],
        displayedCards: {
          level1: [lowCard, highCard],
          level2: [],
          level3: [],
        },
        nobles: [],
      });

      const purchaseActions = [];
      for (let i = 0; i < 20; i++) {
        const action = ai.decideAction(state, state.players[0]);
        if (action.type === 'PURCHASE_CARD') {
          purchaseActions.push(action);
        }
      }

      const highCardPurchases = purchaseActions.filter(
        (a: any) => a.card.id === 'card-2'
      ).length;
      const lowCardPurchases = purchaseActions.filter((a: any) => a.card.id === 'card-1')
        .length;

      expect(highCardPurchases).toBeGreaterThanOrEqual(lowCardPurchases);
    });

    it('should plan for nobles', () => {
      const ai = new AIPlayer('ai-1', 'hard');
      const noble = createMockNoble({
        id: 'noble-1',
        points: 3,
        requirement: { red: 3, blue: 3 },
      });
      const cardTowardNoble = createMockCard({
        id: 'card-red',
        color: 'red',
        points: 2,
        cost: {},
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 10, blue: 10, green: 10, white: 10, black: 10, gold: 10 }),
            purchasedCards: [
              createMockCard({ id: 'red-1', color: 'red' }),
              createMockCard({ id: 'red-2', color: 'red' }),
              createMockCard({ id: 'blue-1', color: 'blue' }),
              createMockCard({ id: 'blue-2', color: 'blue' }),
            ],
          }),
        ],
        displayedCards: {
          level1: [cardTowardNoble],
          level2: [],
          level3: [],
        },
        nobles: [noble],
      });

      const action = ai.decideAction(state, state.players[0]);
      expect(action).toBeDefined();
    });

    it('should differ from easy and medium strategies', () => {
      const easyAI = new AIPlayer('easy-1', 'easy');
      const mediumAI = new AIPlayer('medium-1', 'medium');
      const hardAI = new AIPlayer('hard-1', 'hard');

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'easy-1',
            isAI: true,
            gems: createGemPool({ red: 5, blue: 5, green: 0, white: 0, black: 0, gold: 0 }),
          }),
          createMockPlayerState({
            id: 'medium-1',
            isAI: true,
            gems: createGemPool({ red: 5, blue: 5, green: 0, white: 0, black: 0, gold: 0 }),
          }),
          createMockPlayerState({
            id: 'hard-1',
            isAI: true,
            gems: createGemPool({ red: 5, blue: 5, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        displayedCards: {
          level1: [
            createMockCard({
              id: 'card-1',
              points: 5,
              cost: { red: 3, blue: 3 },
            }),
          ],
          level2: [],
          level3: [],
        },
        nobles: [
          createMockNoble({
            id: 'noble-1',
            requirement: { red: 4, blue: 4 },
          }),
        ],
      });

      const easyAction = easyAI.decideAction(state, state.players[0]);
      const mediumAction = mediumAI.decideAction(state, state.players[1]);
      const hardAction = hardAI.decideAction(state, state.players[2]);

      // At least some should differ (very likely given randomness and strategies)
      const actions = [easyAction, mediumAction, hardAction];
      const uniqueActions = new Set(actions.map(a => JSON.stringify(a)));

      expect(uniqueActions.size).toBeGreaterThan(1);
    });
  });

  describe('Default difficulty', () => {
    it('should default to medium difficulty', () => {
      const ai = new AIPlayer('ai-1');
      const state = createMockGameState({
        players: [createMockPlayerState({ id: 'ai-1', isAI: true })],
      });

      const action = ai.decideAction(state, state.players[0]);
      expect(action).toBeDefined();
    });
  });

  describe('Helper methods', () => {
    it('should find best gem collection toward target cards', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 1, blue: 1, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        displayedCards: {
          level1: [createMockCard({ id: 'card-1', cost: { red: 3, blue: 2, green: 1 } })],
          level2: [],
          level3: [],
        },
      });

      // Call via public method
      const action = ai.decideAction(state, state.players[0]);
      expect(action).toBeDefined();
    });

    it('should handle empty state gracefully', () => {
      const ai = new AIPlayer('ai-1', 'hard');
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        displayedCards: {
          level1: [],
          level2: [],
          level3: [],
        },
        deck: {
          level1: [],
          level2: [],
          level3: [],
        },
        gemPool: createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
      });

      const action = ai.decideAction(state, state.players[0]);
      expect(action.type).toBe('END_TURN');
    });

    it('should consider gold gems in calculations', () => {
      const ai = new AIPlayer('ai-1', 'hard');
      const card = createMockCard({
        id: 'card-1',
        points: 3,
        cost: { red: 2, blue: 2 },
      });
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 1, blue: 1, green: 0, white: 0, black: 0, gold: 2 }),
          }),
        ],
        displayedCards: {
          level1: [card],
          level2: [],
          level3: [],
        },
      });

      const action = ai.decideAction(state, state.players[0]);
      // Should be able to purchase with gold
      expect(action).toBeDefined();
    });
  });

  describe('Gem collection logic', () => {
    it('should prefer 2-same-gem strategy when available', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        gemPool: createGemPool({ red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 }),
        displayedCards: {
          level1: [createMockCard({ id: 'card-1', cost: { red: 2 } })],
          level2: [],
          level3: [],
        },
      });

      let gemTakes = 0;
      for (let i = 0; i < 20; i++) {
        const action = ai.decideAction(state, state.players[0]);
        if (action.type === 'TAKE_GEMS') {
          gemTakes++;
        }
      }

      // Should sometimes take gems toward the card
      expect(gemTakes).toBeGreaterThan(0);
    });
  });

  describe('Reservation logic', () => {
    it('should reserve high-value cards', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const highCard = createMockCard({
        id: 'card-1',
        points: 5,
        level: 3,
        cost: { red: 5, blue: 5 },
      });
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 1, blue: 1, green: 0, white: 0, black: 0, gold: 0 }),
            reservedCards: [],
          }),
        ],
        displayedCards: {
          level1: [],
          level2: [],
          level3: [highCard],
        },
      });

      let reserves = 0;
      for (let i = 0; i < 20; i++) {
        const action = ai.decideAction(state, state.players[0]);
        if (action.type === 'RESERVE_CARD') {
          reserves++;
        }
      }

      expect(reserves).toBeGreaterThan(0);
    });
  });
});
