/**
 * Game data exports and constants
 */

export { LEVEL_1_CARDS, LEVEL_2_CARDS, LEVEL_3_CARDS } from './cards';
export { NOBLES } from './nobles';

/**
 * Gem distribution by player count
 * Determines how many gems are available in the gem pool at game start
 */
export const GEMS_PER_PLAYER_COUNT = {
  2: 4,
  3: 5,
  4: 7,
} as const;

/**
 * Number of gold gems (wildcards) available in the game
 */
export const GOLD_GEMS = 5;
