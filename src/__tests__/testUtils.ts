/**
 * Test utilities and factory functions for creating mock game objects
 */

import type { GameState, PlayerState, Card, Noble, GemCost, Color } from '../types';

/**
 * Create a mock Card with optional overrides
 */
export function createMockCard(overrides?: Partial<Card>): Card {
  const id = overrides?.id || `card-${Math.random().toString(36).substr(2, 9)}`;
  return {
    id,
    level: 1,
    points: 1,
    color: 'red' as Color,
    cost: { red: 1 },
    ...overrides,
  };
}

/**
 * Create a mock Noble with optional overrides
 */
export function createMockNoble(overrides?: Partial<Noble>): Noble {
  const id = overrides?.id || `noble-${Math.random().toString(36).substr(2, 9)}`;
  return {
    id,
    points: 3,
    requirement: { red: 3, blue: 3 },
    ...overrides,
  };
}

/**
 * Create a mock PlayerState with optional overrides
 */
export function createMockPlayerState(overrides?: Partial<PlayerState>): PlayerState {
  const id = overrides?.id || `player-${Math.random().toString(36).substr(2, 9)}`;
  return {
    id,
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

/**
 * Create a mock GameState with optional overrides
 */
export function createMockGameState(overrides?: Partial<GameState>): GameState {
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
    gamePhase: 'setup',
    ...overrides,
  };
}

/**
 * Helper to create gem costs with defaults
 */
export function createGemCost(overrides?: Partial<GemCost>): GemCost {
  return {
    red: 0,
    blue: 0,
    green: 0,
    white: 0,
    black: 0,
    ...overrides,
  };
}

/**
 * Helper to create gem pools (includes gold)
 */
export function createGemPool(
  overrides?: Partial<GemCost & { gold: number }>
): GemCost & { gold: number } {
  return {
    red: 0,
    blue: 0,
    green: 0,
    white: 0,
    black: 0,
    gold: 0,
    ...overrides,
  };
}
