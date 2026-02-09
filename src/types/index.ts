/**
 * Core game types for Splendor
 */

export type Color = 'red' | 'blue' | 'green' | 'white' | 'black' | 'gold';

export interface GemCost {
  red?: number;
  blue?: number;
  green?: number;
  white?: number;
  black?: number;
}

export interface Card {
  id: string;
  level: 1 | 2 | 3;
  points: number;
  color: Color; // Gem bonus provided
  cost: GemCost;
}

export interface Noble {
  id: string;
  points: number;
  requirement: GemCost;
}

export interface PlayerState {
  id: string;
  name: string;
  gems: GemCost & { gold: number };
  purchasedCards: Card[];
  reservedCards: Card[];
  points: number;
  nobles: Noble[];
  isAI: boolean;
}

export interface GameState {
  players: PlayerState[];
  currentPlayerIndex: number;
  deck: {
    level1: Card[];
    level2: Card[];
    level3: Card[];
  };
  nobles: Noble[];
  displayedCards: {
    level1: Card[];
    level2: Card[];
    level3: Card[];
  };
  gemPool: GemCost & { gold: number };
  gamePhase: 'setup' | 'active' | 'endGame' | 'finished';
  winner?: PlayerState;
}

export type GameAction =
  | { type: 'TAKE_GEMS'; playerIndex: number; gems: string[] }
  | { type: 'RESERVE_CARD'; playerIndex: number; card: Card }
  | { type: 'PURCHASE_CARD'; playerIndex: number; card: Card }
  | { type: 'END_TURN'; playerIndex: number }
  | { type: 'CLAIM_NOBLE'; playerIndex: number; noble: Noble };
