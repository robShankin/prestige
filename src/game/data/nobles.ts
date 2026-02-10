import { Noble } from '@/types/index';

/**
 * Noble Cards (10 nobles)
 * High-value nobles worth 3 points each
 * Require combinations of gems from different colors
 */
export const NOBLES: Noble[] = [
  {
    id: 'N-01',
    points: 3,
    requirement: { red: 3, blue: 3, green: 3 }
  },
  {
    id: 'N-02',
    points: 3,
    requirement: { black: 3, blue: 3, white: 3 }
  },
  {
    id: 'N-03',
    points: 3,
    requirement: { black: 4, white: 4 }
  },
  {
    id: 'N-04',
    points: 3,
    requirement: { blue: 4, white: 4 }
  },
  {
    id: 'N-05',
    points: 3,
    requirement: { blue: 4, green: 4 }
  },
  {
    id: 'N-06',
    points: 3,
    requirement: { blue: 3, green: 3, white: 3 }
  },
  {
    id: 'N-07',
    points: 3,
    requirement: { red: 3, black: 3, white: 3 }
  },
  {
    id: 'N-08',
    points: 3,
    requirement: { red: 3, green: 3, black: 3 }
  },
  {
    id: 'N-09',
    points: 3,
    requirement: { red: 4, black: 4 }
  },
  {
    id: 'N-10',
    points: 3,
    requirement: { red: 4, green: 4 }
  },
];
