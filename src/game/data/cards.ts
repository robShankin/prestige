import { Card } from '@/types/index';

/**
 * Level 1 Cards (40 cards)
 * Low-value cards with 0-1 points and 2-4 gem costs
 */
export const LEVEL_1_CARDS: Card[] = [
  // Red bonus cards
  { id: 'L1-01', level: 1, points: 0, color: 'red', cost: { white: 2, black: 2 } },
  { id: 'L1-02', level: 1, points: 0, color: 'red', cost: { blue: 3 } },
  { id: 'L1-03', level: 1, points: 1, color: 'red', cost: { green: 3, white: 1 } },
  { id: 'L1-04', level: 1, points: 0, color: 'red', cost: { blue: 2, green: 2 } },
  { id: 'L1-05', level: 1, points: 1, color: 'red', cost: { white: 4 } },
  { id: 'L1-06', level: 1, points: 0, color: 'red', cost: { black: 3, white: 2 } },
  { id: 'L1-07', level: 1, points: 0, color: 'red', cost: { green: 2, blue: 1 } },
  { id: 'L1-08', level: 1, points: 1, color: 'red', cost: { black: 4 } },

  // Blue bonus cards
  { id: 'L1-09', level: 1, points: 0, color: 'blue', cost: { red: 2, green: 2 } },
  { id: 'L1-10', level: 1, points: 0, color: 'blue', cost: { white: 3 } },
  { id: 'L1-11', level: 1, points: 1, color: 'blue', cost: { black: 3, white: 1 } },
  { id: 'L1-12', level: 1, points: 0, color: 'blue', cost: { red: 3, black: 1 } },
  { id: 'L1-13', level: 1, points: 1, color: 'blue', cost: { green: 4 } },
  { id: 'L1-14', level: 1, points: 0, color: 'blue', cost: { white: 2, black: 2 } },
  { id: 'L1-15', level: 1, points: 0, color: 'blue', cost: { red: 1, green: 3 } },
  { id: 'L1-16', level: 1, points: 1, color: 'blue', cost: { white: 4 } },

  // Green bonus cards
  { id: 'L1-17', level: 1, points: 0, color: 'green', cost: { red: 3, blue: 1 } },
  { id: 'L1-18', level: 1, points: 0, color: 'green', cost: { black: 3 } },
  { id: 'L1-19', level: 1, points: 1, color: 'green', cost: { white: 3, black: 1 } },
  { id: 'L1-20', level: 1, points: 0, color: 'green', cost: { red: 2, white: 2 } },
  { id: 'L1-21', level: 1, points: 1, color: 'green', cost: { blue: 4 } },
  { id: 'L1-22', level: 1, points: 0, color: 'green', cost: { red: 3, white: 1 } },
  { id: 'L1-23', level: 1, points: 0, color: 'green', cost: { blue: 2, black: 2 } },
  { id: 'L1-24', level: 1, points: 1, color: 'green', cost: { red: 4 } },

  // White bonus cards
  { id: 'L1-25', level: 1, points: 0, color: 'white', cost: { red: 3, green: 1 } },
  { id: 'L1-26', level: 1, points: 0, color: 'white', cost: { black: 3 } },
  { id: 'L1-27', level: 1, points: 1, color: 'white', cost: { blue: 3, black: 1 } },
  { id: 'L1-28', level: 1, points: 0, color: 'white', cost: { red: 2, blue: 2 } },
  { id: 'L1-29', level: 1, points: 1, color: 'white', cost: { green: 4 } },
  { id: 'L1-30', level: 1, points: 0, color: 'white', cost: { blue: 3, green: 1 } },
  { id: 'L1-31', level: 1, points: 0, color: 'white', cost: { red: 2, black: 2 } },
  { id: 'L1-32', level: 1, points: 1, color: 'white', cost: { black: 4 } },

  // Black bonus cards
  { id: 'L1-33', level: 1, points: 0, color: 'black', cost: { red: 3, white: 1 } },
  { id: 'L1-34', level: 1, points: 0, color: 'black', cost: { green: 3 } },
  { id: 'L1-35', level: 1, points: 1, color: 'black', cost: { blue: 3, green: 1 } },
  { id: 'L1-36', level: 1, points: 0, color: 'black', cost: { red: 2, green: 2 } },
  { id: 'L1-37', level: 1, points: 1, color: 'black', cost: { white: 4 } },
  { id: 'L1-38', level: 1, points: 0, color: 'black', cost: { blue: 3, white: 1 } },
  { id: 'L1-39', level: 1, points: 0, color: 'black', cost: { green: 2, white: 2 } },
  { id: 'L1-40', level: 1, points: 1, color: 'black', cost: { blue: 4 } },
];

/**
 * Level 2 Cards (30 cards)
 * Mid-value cards with 1-3 points and 5-7 gem costs
 */
export const LEVEL_2_CARDS: Card[] = [
  // Red bonus cards
  { id: 'L2-01', level: 2, points: 1, color: 'red', cost: { white: 5, black: 3 } },
  { id: 'L2-02', level: 2, points: 2, color: 'red', cost: { blue: 5, green: 2 } },
  { id: 'L2-03', level: 2, points: 1, color: 'red', cost: { green: 6, black: 1 } },
  { id: 'L2-04', level: 2, points: 3, color: 'red', cost: { white: 6, black: 3 } },
  { id: 'L2-05', level: 2, points: 2, color: 'red', cost: { blue: 3, green: 4, black: 2 } },
  { id: 'L2-06', level: 2, points: 1, color: 'red', cost: { white: 4, blue: 3 } },

  // Blue bonus cards
  { id: 'L2-07', level: 2, points: 1, color: 'blue', cost: { red: 5, black: 3 } },
  { id: 'L2-08', level: 2, points: 2, color: 'blue', cost: { green: 5, white: 2 } },
  { id: 'L2-09', level: 2, points: 1, color: 'blue', cost: { white: 6, black: 1 } },
  { id: 'L2-10', level: 2, points: 3, color: 'blue', cost: { red: 6, black: 3 } },
  { id: 'L2-11', level: 2, points: 2, color: 'blue', cost: { red: 3, white: 4, black: 2 } },
  { id: 'L2-12', level: 2, points: 1, color: 'blue', cost: { green: 4, black: 3 } },

  // Green bonus cards
  { id: 'L2-13', level: 2, points: 1, color: 'green', cost: { red: 5, white: 3 } },
  { id: 'L2-14', level: 2, points: 2, color: 'green', cost: { blue: 5, black: 2 } },
  { id: 'L2-15', level: 2, points: 1, color: 'green', cost: { black: 6, white: 1 } },
  { id: 'L2-16', level: 2, points: 3, color: 'green', cost: { red: 6, white: 3 } },
  { id: 'L2-17', level: 2, points: 2, color: 'green', cost: { blue: 3, white: 4, red: 2 } },
  { id: 'L2-18', level: 2, points: 1, color: 'green', cost: { red: 4, blue: 3 } },

  // White bonus cards
  { id: 'L2-19', level: 2, points: 1, color: 'white', cost: { red: 5, green: 3 } },
  { id: 'L2-20', level: 2, points: 2, color: 'white', cost: { blue: 5, red: 2 } },
  { id: 'L2-21', level: 2, points: 1, color: 'white', cost: { red: 6, green: 1 } },
  { id: 'L2-22', level: 2, points: 3, color: 'white', cost: { blue: 6, green: 3 } },
  { id: 'L2-23', level: 2, points: 2, color: 'white', cost: { blue: 3, green: 4, red: 2 } },
  { id: 'L2-24', level: 2, points: 1, color: 'white', cost: { black: 4, green: 3 } },

  // Black bonus cards
  { id: 'L2-25', level: 2, points: 1, color: 'black', cost: { red: 5, green: 3 } },
  { id: 'L2-26', level: 2, points: 2, color: 'black', cost: { blue: 5, white: 2 } },
  { id: 'L2-27', level: 2, points: 1, color: 'black', cost: { white: 6, green: 1 } },
  { id: 'L2-28', level: 2, points: 3, color: 'black', cost: { red: 6, white: 3 } },
  { id: 'L2-29', level: 2, points: 2, color: 'black', cost: { blue: 3, white: 4, green: 2 } },
  { id: 'L2-30', level: 2, points: 1, color: 'black', cost: { blue: 4, green: 3 } },
];

/**
 * Level 3 Cards (20 cards)
 * High-value cards with 3-5 points and 7-10 gem costs
 */
export const LEVEL_3_CARDS: Card[] = [
  // Red bonus cards
  { id: 'L3-01', level: 3, points: 3, color: 'red', cost: { white: 7, black: 3 } },
  { id: 'L3-02', level: 3, points: 4, color: 'red', cost: { blue: 7, green: 2, black: 1 } },
  { id: 'L3-03', level: 3, points: 5, color: 'red', cost: { green: 6, black: 4, white: 2 } },
  { id: 'L3-04', level: 3, points: 4, color: 'red', cost: { white: 8, blue: 2 } },

  // Blue bonus cards
  { id: 'L3-05', level: 3, points: 3, color: 'blue', cost: { red: 7, black: 3 } },
  { id: 'L3-06', level: 3, points: 4, color: 'blue', cost: { green: 7, white: 2, black: 1 } },
  { id: 'L3-07', level: 3, points: 5, color: 'blue', cost: { white: 6, black: 4, red: 2 } },
  { id: 'L3-08', level: 3, points: 4, color: 'blue', cost: { red: 8, green: 2 } },

  // Green bonus cards
  { id: 'L3-09', level: 3, points: 3, color: 'green', cost: { red: 7, white: 3 } },
  { id: 'L3-10', level: 3, points: 4, color: 'green', cost: { blue: 7, black: 2, white: 1 } },
  { id: 'L3-11', level: 3, points: 5, color: 'green', cost: { black: 6, white: 4, red: 2 } },
  { id: 'L3-12', level: 3, points: 4, color: 'green', cost: { red: 8, black: 2 } },

  // White bonus cards
  { id: 'L3-13', level: 3, points: 3, color: 'white', cost: { red: 7, green: 3 } },
  { id: 'L3-14', level: 3, points: 4, color: 'white', cost: { blue: 7, red: 2, green: 1 } },
  { id: 'L3-15', level: 3, points: 5, color: 'white', cost: { red: 6, green: 4, blue: 2 } },
  { id: 'L3-16', level: 3, points: 4, color: 'white', cost: { blue: 8, green: 2 } },

  // Black bonus cards
  { id: 'L3-17', level: 3, points: 3, color: 'black', cost: { red: 7, green: 3 } },
  { id: 'L3-18', level: 3, points: 4, color: 'black', cost: { blue: 7, white: 2, green: 1 } },
  { id: 'L3-19', level: 3, points: 5, color: 'black', cost: { white: 6, green: 4, blue: 2 } },
  { id: 'L3-20', level: 3, points: 4, color: 'black', cost: { blue: 8, red: 2 } },
];
