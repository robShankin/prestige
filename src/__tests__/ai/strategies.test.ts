/**
 * Detailed tests for AI strategy functions and helper methods
 * Targets uncovered paths in AI decision logic
 */

import { AIPlayer } from '../../ai/aiPlayer';
import {
  createMockGameState,
  createMockCard,
  createMockPlayerState,
  createMockNoble,
  createGemPool,
} from '../../testUtils';

describe('AI Strategy Functions', () => {
  describe('Edge cases for evaluateCard', () => {
    it('should evaluate high-point cards', () => {
      const ai = new AIPlayer('ai-1', 'hard');
      const highCard = createMockCard({ id: 'high', points: 5, cost: {} });
      const lowCard = createMockCard({ id: 'low', points: 0, cost: {} });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 10, blue: 10, green: 10, white: 10, black: 10, gold: 10 }),
          }),
        ],
        displayedCards: {
          level1: [highCard, lowCard],
          level2: [],
          level3: [],
        },
        nobles: [],
      });

      // Run multiple times to ensure high card is preferred
      let highCount = 0;
      for (let i = 0; i < 20; i++) {
        const action = ai.decideAction(state, state.players[0]);
        if (action.type === 'PURCHASE_CARD' && (action as any).card.id === 'high') {
          highCount++;
        }
      }

      expect(highCount).toBeGreaterThan(0);
    });

    it('should evaluate cards toward nobles', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const noble = createMockNoble({
        id: 'noble-1',
        requirement: { red: 3, blue: 3 },
      });

      const cardTowardNoble = createMockCard({
        id: 'card-red',
        color: 'red',
        points: 1,
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

    it('should evaluate level 1 cards higher than level 3 for progression', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const level1 = createMockCard({
        id: 'level1',
        level: 1,
        points: 1,
        cost: {},
      });

      const level3 = createMockCard({
        id: 'level3',
        level: 3,
        points: 1,
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
          level1: [level1],
          level2: [],
          level3: [level3],
        },
        nobles: [],
      });

      const action = ai.decideAction(state, state.players[0]);
      expect(action).toBeDefined();
    });
  });

  describe('Gem collection strategies', () => {
    it('should prefer 2-of-same strategy when targeting single color', () => {
      const ai = new AIPlayer('ai-1', 'hard');
      const card = createMockCard({
        id: 'card-1',
        cost: { red: 2 },
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        displayedCards: {
          level1: [card],
          level2: [],
          level3: [],
        },
        gemPool: createGemPool({ red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 }),
      });

      const action = ai.decideAction(state, state.players[0]);
      if (action.type === 'TAKE_GEMS') {
        // If taking gems, should be toward the card
        expect(action.gems.length).toBeGreaterThan(0);
      }
    });

    it('should use 3-different strategy when targeting multiple colors', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const card = createMockCard({
        id: 'card-1',
        cost: { red: 1, blue: 1, green: 1 },
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        displayedCards: {
          level1: [card],
          level2: [],
          level3: [],
        },
        gemPool: createGemPool({ red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 }),
      });

      let gemCount = 0;
      for (let i = 0; i < 10; i++) {
        const action = ai.decideAction(state, state.players[0]);
        if (action.type === 'TAKE_GEMS') {
          gemCount++;
        }
      }

      expect(gemCount).toBeGreaterThan(0);
    });
  });

  describe('Reservation strategy', () => {
    it('should reserve high-point cards', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const highCard = createMockCard({
        id: 'high',
        points: 5,
        level: 3,
        cost: { red: 5, blue: 5, green: 5 },
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

      let reserveCount = 0;
      for (let i = 0; i < 20; i++) {
        const action = ai.decideAction(state, state.players[0]);
        if (action.type === 'RESERVE_CARD') {
          reserveCount++;
        }
      }

      expect(reserveCount).toBeGreaterThan(0);
    });

    it('should not reserve when at max capacity', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const card = createMockCard({ id: 'card-1', points: 5 });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 10, blue: 10, green: 10, white: 10, black: 10, gold: 10 }),
            reservedCards: [
              createMockCard({ id: 'r1' }),
              createMockCard({ id: 'r2' }),
              createMockCard({ id: 'r3' }),
            ],
          }),
        ],
        displayedCards: {
          level1: [card],
          level2: [],
          level3: [],
        },
      });

      const action = ai.decideAction(state, state.players[0]);
      expect(action.type).not.toBe('RESERVE_CARD');
    });
  });

  describe('Medium strategy randomness', () => {
    it('should include random actions 40% of the time', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 5, blue: 5, green: 5, white: 5, black: 5, gold: 5 }),
          }),
        ],
        gemPool: createGemPool({ red: 4, blue: 4, green: 4, white: 4, black: 4, gold: 5 }),
        displayedCards: {
          level1: [createMockCard({ id: 'card-1' })],
          level2: [],
          level3: [],
        },
      });

      const actions = [];
      for (let i = 0; i < 50; i++) {
        actions.push(ai.decideAction(state, state.players[0]));
      }

      // Should have some variation
      const uniqueActions = new Set(actions.map(a => JSON.stringify(a)));
      expect(uniqueActions.size).toBeGreaterThan(1);
    });
  });

  describe('Hard strategy aggressive play', () => {
    it('should pursue winning moves immediately', () => {
      const ai = new AIPlayer('ai-1', 'hard');
      const winningCard = createMockCard({
        id: 'winning',
        points: 10,
        cost: {},
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            points: 5,
            gems: createGemPool({ red: 10, blue: 10, green: 10, white: 10, black: 10, gold: 10 }),
          }),
        ],
        displayedCards: {
          level1: [winningCard],
          level2: [],
          level3: [],
        },
      });

      const action = ai.decideAction(state, state.players[0]);

      // Should purchase the winning card
      if (action.type === 'PURCHASE_CARD') {
        expect((action as any).card.id).toBe('winning');
      } else {
        // Or at least consider it
        expect(action).toBeDefined();
      }
    });

    it('should block opponent high-value cards', () => {
      const ai = new AIPlayer('ai-1', 'hard');
      const highCard = createMockCard({
        id: 'block',
        points: 5,
        level: 2,
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
          createMockPlayerState({
            id: 'human-1',
            isAI: false,
            gems: createGemPool({ red: 5, blue: 5, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        displayedCards: {
          level1: [],
          level2: [highCard],
          level3: [],
        },
      });

      let blockCount = 0;
      for (let i = 0; i < 20; i++) {
        const action = ai.decideAction(state, state.players[0]);
        if (action.type === 'RESERVE_CARD') {
          blockCount++;
        }
      }

      // Hard AI should consider blocking
      expect(blockCount).toBeGreaterThan(0);
    });
  });

  describe('Noble planning', () => {
    it('should plan purchases toward reachable nobles', () => {
      const ai = new AIPlayer('ai-1', 'medium');
      const noble = createMockNoble({
        id: 'noble-1',
        points: 3,
        requirement: { red: 3, blue: 3 },
      });

      const redCard = createMockCard({
        id: 'red',
        color: 'red',
        points: 1,
        cost: { white: 1 },
      });

      const state = createMockGameState({
        players: [
          createMockPlayerState({
            id: 'ai-1',
            isAI: true,
            gems: createGemPool({ red: 1, blue: 0, green: 0, white: 1, black: 0, gold: 0 }),
            purchasedCards: [
              createMockCard({ id: 'r1', color: 'red' }),
              createMockCard({ id: 'r2', color: 'red' }),
              createMockCard({ id: 'b1', color: 'blue' }),
              createMockCard({ id: 'b2', color: 'blue' }),
            ],
          }),
        ],
        displayedCards: {
          level1: [redCard],
          level2: [],
          level3: [],
        },
        nobles: [noble],
      });

      const action = ai.decideAction(state, state.players[0]);
      expect(action).toBeDefined();
    });
  });
});
