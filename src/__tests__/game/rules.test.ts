/**
 * Test suite for GameRules static methods
 * Target: 100% coverage of all validation and rule logic
 */

import { GameRules } from '../../game/rules';
import {
  createMockGameState,
  createMockCard,
  createMockPlayerState,
  createMockNoble,
  createGemPool,
} from '../../testUtils';

describe('GameRules', () => {
  describe('canTakeGems', () => {
    it('should allow taking 1 gem when player has room', () => {
      const gems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const gemsToTake = ['red'];

      expect(GameRules.canTakeGems(gems, gemsToTake)).toBe(true);
    });

    it('should allow taking 2 gems when player has room', () => {
      const gems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const gemsToTake = ['red', 'blue'];

      expect(GameRules.canTakeGems(gems, gemsToTake)).toBe(true);
    });

    it('should allow taking 3 gems when player has room', () => {
      const gems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const gemsToTake = ['red', 'blue', 'green'];

      expect(GameRules.canTakeGems(gems, gemsToTake)).toBe(true);
    });

    it('should not allow taking 4 gems', () => {
      const gems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const gemsToTake = ['red', 'blue', 'green', 'white'];

      expect(GameRules.canTakeGems(gems, gemsToTake)).toBe(false);
    });

    it('should not allow taking gems if it exceeds 10 gem limit', () => {
      const gems = createGemPool({ red: 8, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const gemsToTake = ['red', 'red', 'red'];

      expect(GameRules.canTakeGems(gems, gemsToTake)).toBe(false);
    });

    it('should not allow taking gems when player at 10 gems (edge case)', () => {
      const gems = createGemPool({ red: 10, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const gemsToTake = ['red'];

      expect(GameRules.canTakeGems(gems, gemsToTake)).toBe(false);
    });

    it('should allow taking 0 gems when player at 10 gems (edge case)', () => {
      const gems = createGemPool({ red: 10, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const gemsToTake: string[] = [];

      expect(GameRules.canTakeGems(gems, gemsToTake)).toBe(true);
    });

    it('should allow taking 3 gems when player has 7 gems', () => {
      const gems = createGemPool({ red: 3, blue: 2, green: 2, white: 0, black: 0, gold: 0 });
      const gemsToTake = ['red', 'blue', 'green'];

      expect(GameRules.canTakeGems(gems, gemsToTake)).toBe(true);
    });

    it('should not allow taking 3 gems when player has 8 gems', () => {
      const gems = createGemPool({ red: 3, blue: 2, green: 3, white: 0, black: 0, gold: 0 });
      const gemsToTake = ['red', 'blue', 'green'];

      expect(GameRules.canTakeGems(gems, gemsToTake)).toBe(false);
    });
  });

  describe('countGems', () => {
    it('should count all gems when all colors present', () => {
      const gems = createGemPool({ red: 5, blue: 5, green: 5, white: 5, black: 5, gold: 0 });

      expect(GameRules.countGems(gems)).toBe(25);
    });

    it('should count mixed gems correctly', () => {
      const gems = createGemPool({ red: 3, blue: 2, green: 0, white: 4, black: 1, gold: 5 });

      expect(GameRules.countGems(gems)).toBe(15);
    });

    it('should return 0 for empty gem pool', () => {
      const gems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });

      expect(GameRules.countGems(gems)).toBe(0);
    });

    it('should count only gold gems', () => {
      const gems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 5 });

      expect(GameRules.countGems(gems)).toBe(5);
    });

    it('should handle undefined gem properties', () => {
      const gems: any = { gold: 3 };

      expect(GameRules.countGems(gems)).toBe(3);
    });
  });

  describe('canAfford', () => {
    it('should allow purchase when exact gems available', () => {
      const playerGems = createGemPool({ red: 2, blue: 1, green: 0, white: 0, black: 0, gold: 0 });
      const cost = { red: 2, blue: 1 };

      expect(GameRules.canAfford(playerGems, cost)).toBe(true);
    });

    it('should allow purchase with color gems', () => {
      const playerGems = createGemPool({ red: 1, blue: 2, green: 0, white: 0, black: 0, gold: 0 });
      const cost = { red: 1, blue: 1 };

      expect(GameRules.canAfford(playerGems, cost)).toBe(true);
    });

    it('should allow purchase using gold substitution', () => {
      const playerGems = createGemPool({ red: 1, blue: 0, green: 0, white: 0, black: 0, gold: 1 });
      const cost = { red: 1, blue: 1 };

      expect(GameRules.canAfford(playerGems, cost)).toBe(true);
    });

    it('should not allow purchase without sufficient gems', () => {
      const playerGems = createGemPool({ red: 1, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const cost = { red: 2, blue: 1 };

      expect(GameRules.canAfford(playerGems, cost)).toBe(false);
    });

    it('should not allow purchase without sufficient gold', () => {
      const playerGems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 1 });
      const cost = { red: 2, blue: 1 };

      expect(GameRules.canAfford(playerGems, cost)).toBe(false);
    });

    it('should allow purchase requiring multiple colors and gold', () => {
      const playerGems = createGemPool({
        red: 2,
        blue: 1,
        green: 0,
        white: 1,
        black: 0,
        gold: 2,
      });
      const cost = { red: 2, blue: 1, green: 1, white: 1 };

      expect(GameRules.canAfford(playerGems, cost)).toBe(true);
    });

    it('should handle empty cost', () => {
      const playerGems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const cost = {};

      expect(GameRules.canAfford(playerGems, cost)).toBe(true);
    });

    it('should handle undefined gem properties', () => {
      const playerGems: any = { gold: 3 };
      const cost = { red: 1, blue: 1 };

      expect(GameRules.canAfford(playerGems, cost)).toBe(true);
    });
  });

  describe('canPurchaseCard', () => {
    it('should allow purchase when player can afford', () => {
      const player = createMockPlayerState({
        gems: createGemPool({ red: 2, blue: 1, green: 0, white: 0, black: 0, gold: 0 }),
      });
      const card = createMockCard({ cost: { red: 2, blue: 1 } });

      expect(GameRules.canPurchaseCard(player, card)).toBe(true);
    });

    it('should not allow purchase when player cannot afford', () => {
      const player = createMockPlayerState({
        gems: createGemPool({ red: 1, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
      });
      const card = createMockCard({ cost: { red: 2, blue: 1 } });

      expect(GameRules.canPurchaseCard(player, card)).toBe(false);
    });

    it('should allow purchase with gold gems', () => {
      const player = createMockPlayerState({
        gems: createGemPool({ red: 1, blue: 0, green: 0, white: 0, black: 0, gold: 1 }),
      });
      const card = createMockCard({ cost: { red: 1, blue: 1 } });

      expect(GameRules.canPurchaseCard(player, card)).toBe(true);
    });
  });

  describe('isGameOver', () => {
    it('should return true when player reaches 15 points', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: 15 }),
          createMockPlayerState({ id: 'player2', points: 10 }),
        ],
      });

      expect(GameRules.isGameOver(state)).toBe(true);
    });

    it('should return false when player has 14 points', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: 14 }),
          createMockPlayerState({ id: 'player2', points: 10 }),
        ],
      });

      expect(GameRules.isGameOver(state)).toBe(false);
    });

    it('should return true when player has 16 points', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: 16 }),
          createMockPlayerState({ id: 'player2', points: 10 }),
        ],
      });

      expect(GameRules.isGameOver(state)).toBe(true);
    });

    it('should return true if any player reaches winning points', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: 10 }),
          createMockPlayerState({ id: 'player2', points: 8 }),
          createMockPlayerState({ id: 'player3', points: 15 }),
        ],
      });

      expect(GameRules.isGameOver(state)).toBe(true);
    });

    it('should return false when no player reaches winning points', () => {
      const state = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', points: 10 }),
          createMockPlayerState({ id: 'player2', points: 12 }),
        ],
      });

      expect(GameRules.isGameOver(state)).toBe(false);
    });
  });

  describe('canReserveCard', () => {
    it('should allow reserve when less than 3 reserved', () => {
      const player = createMockPlayerState({
        reservedCards: [createMockCard(), createMockCard()],
      });

      expect(GameRules.canReserveCard(player)).toBe(true);
    });

    it('should not allow reserve when at max 3 reserved', () => {
      const player = createMockPlayerState({
        reservedCards: [createMockCard(), createMockCard(), createMockCard()],
      });

      expect(GameRules.canReserveCard(player)).toBe(false);
    });

    it('should allow reserve when 0 reserved', () => {
      const player = createMockPlayerState({ reservedCards: [] });

      expect(GameRules.canReserveCard(player)).toBe(true);
    });

    it('should allow reserve when exactly 2 reserved', () => {
      const player = createMockPlayerState({
        reservedCards: [createMockCard(), createMockCard()],
      });

      expect(GameRules.canReserveCard(player)).toBe(true);
    });
  });

  describe('canClaimNoble', () => {
    it('should allow claim when player meets requirement', () => {
      const player = createMockPlayerState({
        gems: createGemPool({ red: 3, blue: 3, green: 0, white: 0, black: 0, gold: 0 }),
      });
      const noble = createMockNoble({ requirement: { red: 3, blue: 3 } });

      expect(GameRules.canClaimNoble(player, noble)).toBe(true);
    });

    it('should not allow claim when gems insufficient', () => {
      const player = createMockPlayerState({
        gems: createGemPool({ red: 2, blue: 2, green: 0, white: 0, black: 0, gold: 0 }),
      });
      const noble = createMockNoble({ requirement: { red: 3, blue: 3 } });

      expect(GameRules.canClaimNoble(player, noble)).toBe(false);
    });

    it('should allow claim with gold gems', () => {
      const player = createMockPlayerState({
        gems: createGemPool({ red: 3, blue: 2, green: 0, white: 0, black: 0, gold: 1 }),
      });
      const noble = createMockNoble({ requirement: { red: 3, blue: 3 } });

      expect(GameRules.canClaimNoble(player, noble)).toBe(true);
    });
  });

  describe('calculateGemDiscount', () => {
    it('should return zero discount when no cards purchased', () => {
      const player = createMockPlayerState({ purchasedCards: [] });
      const cost = { red: 2, blue: 1 };

      const discount = GameRules.calculateGemDiscount(player);

      expect(discount.red).toBe(0);
      expect(discount.blue).toBe(0);
    });

    it('should return 1 red discount for 1 red card', () => {
      const redCard = createMockCard({ color: 'red' });
      const player = createMockPlayerState({ purchasedCards: [redCard] });
      const cost = { red: 2 };

      const discount = GameRules.calculateGemDiscount(player);

      expect(discount.red).toBe(1);
    });

    it('should return multiple discounts for multiple cards', () => {
      const redCard = createMockCard({ color: 'red' });
      const blueCard = createMockCard({ color: 'blue' });
      const greenCard = createMockCard({ color: 'green' });
      const player = createMockPlayerState({
        purchasedCards: [redCard, blueCard, greenCard],
      });
      const cost = { red: 2, blue: 2, green: 2 };

      const discount = GameRules.calculateGemDiscount(player);

      expect(discount.red).toBe(1);
      expect(discount.blue).toBe(1);
      expect(discount.green).toBe(1);
    });

    it('should stack discounts for duplicate colors', () => {
      const redCard1 = createMockCard({ id: 'red-1', color: 'red' });
      const redCard2 = createMockCard({ id: 'red-2', color: 'red' });
      const player = createMockPlayerState({
        purchasedCards: [redCard1, redCard2],
      });
      const cost = { red: 3 };

      const discount = GameRules.calculateGemDiscount(player);

      expect(discount.red).toBe(2);
    });

    it('should not discount for gold cards', () => {
      const goldCard = createMockCard({ color: 'gold' });
      const player = createMockPlayerState({ purchasedCards: [goldCard] });
      const cost: any = { gold: 2 };

      const discount = GameRules.calculateGemDiscount(player);

      expect((discount as any).gold || 0).toBe(0);
    });

    it('should return all colors with 0 discount', () => {
      const player = createMockPlayerState({ purchasedCards: [] });
      const cost = { red: 1, blue: 1 };

      const discount = GameRules.calculateGemDiscount(player);

      expect(discount.red).toBe(0);
      expect(discount.blue).toBe(0);
      expect(discount.green).toBe(0);
      expect(discount.white).toBe(0);
      expect(discount.black).toBe(0);
    });
  });

  describe('getEligibleNobles', () => {
    it('should return nobles player can claim', () => {
      const noble = createMockNoble({ id: 'noble-1', requirement: { red: 1 } });
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            gems: createGemPool({ red: 1, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        nobles: [noble],
      });

      const eligible = GameRules.getEligibleNobles(state, 0);

      expect(eligible.length).toBe(1);
      expect(eligible[0].id).toBe('noble-1');
    });

    it('should return empty array if none eligible', () => {
      const noble = createMockNoble({ id: 'noble-1', requirement: { red: 5 } });
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            gems: createGemPool({ red: 1, blue: 0, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        nobles: [noble],
      });

      const eligible = GameRules.getEligibleNobles(state, 0);

      expect(eligible.length).toBe(0);
    });

    it('should return multiple eligible nobles', () => {
      const noble1 = createMockNoble({ id: 'noble-1', requirement: { red: 1 } });
      const noble2 = createMockNoble({ id: 'noble-2', requirement: { blue: 1 } });
      const state = createMockGameState({
        players: [
          createMockPlayerState({
            gems: createGemPool({ red: 2, blue: 2, green: 0, white: 0, black: 0, gold: 0 }),
          }),
        ],
        nobles: [noble1, noble2],
      });

      const eligible = GameRules.getEligibleNobles(state, 0);

      expect(eligible.length).toBe(2);
    });

    it('should return empty for invalid player index', () => {
      const state = createMockGameState();

      const eligible = GameRules.getEligibleNobles(state, 999);

      expect(eligible.length).toBe(0);
    });
  });

  describe('validateGemTake', () => {
    it('should allow valid 2-same gem take', () => {
      const gems = ['red', 'red'];
      const poolGems = createGemPool({ red: 4, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const playerGems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });

      expect(GameRules.validateGemTake(gems, poolGems, playerGems)).toBe(true);
    });

    it('should allow valid 3-different gem take', () => {
      const gems = ['red', 'blue', 'green'];
      const poolGems = createGemPool({
        red: 4,
        blue: 4,
        green: 4,
        white: 0,
        black: 0,
        gold: 0,
      });
      const playerGems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });

      expect(GameRules.validateGemTake(gems, poolGems, playerGems)).toBe(true);
    });

    it('should allow 1 gem take when available', () => {
      const gems = ['red'];
      const poolGems = createGemPool({ red: 4, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const playerGems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });

      expect(GameRules.validateGemTake(gems, poolGems, playerGems)).toBe(true);
    });

    it('should not allow 4 gems', () => {
      const gems = ['red', 'blue', 'green', 'white'];
      const poolGems = createGemPool({
        red: 4,
        blue: 4,
        green: 4,
        white: 4,
        black: 0,
        gold: 0,
      });
      const playerGems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });

      expect(GameRules.validateGemTake(gems, poolGems, playerGems)).toBe(false);
    });

    it('should not allow take if insufficient in pool', () => {
      const gems = ['red', 'red'];
      const poolGems = createGemPool({ red: 1, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const playerGems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });

      expect(GameRules.validateGemTake(gems, poolGems, playerGems)).toBe(false);
    });

    it('should not allow take if player exceeds 10 gem limit', () => {
      const gems = ['red', 'red'];
      const poolGems = createGemPool({ red: 4, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const playerGems = createGemPool({ red: 9, blue: 0, green: 0, white: 0, black: 0, gold: 0 });

      expect(GameRules.validateGemTake(gems, poolGems, playerGems)).toBe(false);
    });

    it('should not allow empty gem take', () => {
      const gems: string[] = [];
      const poolGems = createGemPool({ red: 4, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const playerGems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });

      expect(GameRules.validateGemTake(gems, poolGems, playerGems)).toBe(false);
    });

    it('should validate with multiple of same color in pool', () => {
      const gems = ['red', 'red'];
      const poolGems = createGemPool({ red: 4, blue: 0, green: 0, white: 0, black: 0, gold: 0 });
      const playerGems = createGemPool({ red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 });

      expect(GameRules.validateGemTake(gems, poolGems, playerGems)).toBe(true);
    });
  });

  describe('Constants', () => {
    it('should have correct MAX_GEMS_PER_PLAYER', () => {
      expect(GameRules.MAX_GEMS_PER_PLAYER).toBe(10);
    });

    it('should have correct MAX_RESERVED_CARDS', () => {
      expect(GameRules.MAX_RESERVED_CARDS).toBe(3);
    });

    it('should have correct WINNING_POINTS', () => {
      expect(GameRules.WINNING_POINTS).toBe(15);
    });
  });
});
