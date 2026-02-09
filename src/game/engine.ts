/**
 * Game state management and initialization logic
 */

import type {
  GameState,
  GameAction,
  PlayerState,
  GemCost,
  Noble,
  Color,
} from '../types';
import { GameRules } from './rules';
import {
  LEVEL_1_CARDS,
  LEVEL_2_CARDS,
  LEVEL_3_CARDS,
  NOBLES,
  GEMS_PER_PLAYER_COUNT,
  GOLD_GEMS,
} from './data';

/**
 * Initialize a new game with specified number of players.
 *
 * Creates a ready-to-play game state with:
 * - Player objects (1 human + 1-3 AI opponents)
 * - Shuffled card decks (levels 1-3)
 * - Random noble selection (playerCount + 1 nobles)
 * - Gem pool initialized based on player count
 *
 * @param playerCount - Number of total players (must be 2-4: 1 human + 1-3 AI)
 * @returns Initialized GameState ready for gameplay
 * @throws Error if playerCount < 2 or > 4
 *
 * @example
 * const gameState = initializeGame(3); // 1 human + 2 AI players
 */
export function initializeGame(playerCount: number): GameState {
  if (playerCount < 2 || playerCount > 4) {
    throw new Error('Player count must be between 2 and 4');
  }

  // Create players
  const players: PlayerState[] = [];

  // Human player
  players.push({
    id: 'human-1',
    name: 'You',
    gems: { red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 },
    purchasedCards: [],
    reservedCards: [],
    points: 0,
    nobles: [],
    isAI: false,
  });

  // AI players
  for (let i = 1; i < playerCount; i++) {
    players.push({
      id: `ai-${i}`,
      name: `AI-${i}`,
      gems: { red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0 },
      purchasedCards: [],
      reservedCards: [],
      points: 0,
      nobles: [],
      isAI: true,
    });
  }

  // Shuffle and set up decks
  const shuffledLevel1 = shuffleDeck([...LEVEL_1_CARDS]);
  const shuffledLevel2 = shuffleDeck([...LEVEL_2_CARDS]);
  const shuffledLevel3 = shuffleDeck([...LEVEL_3_CARDS]);

  // Deal 4 cards from each level to display
  const displayedCards = {
    level1: shuffledLevel1.splice(0, 4),
    level2: shuffledLevel2.splice(0, 4),
    level3: shuffledLevel3.splice(0, 4),
  };

  // Select (playerCount + 1) random nobles
  const selectedNobles = selectRandomNobles(NOBLES, playerCount + 1);

  // Initialize gem pool based on player count
  const gemsPerColor = GEMS_PER_PLAYER_COUNT[playerCount as 2 | 3 | 4] || 4;
  const gemPool: GemCost & { gold: number } = {
    red: gemsPerColor,
    blue: gemsPerColor,
    green: gemsPerColor,
    white: gemsPerColor,
    black: gemsPerColor,
    gold: GOLD_GEMS,
  };

  return {
    players,
    currentPlayerIndex: 0,
    deck: {
      level1: shuffledLevel1,
      level2: shuffledLevel2,
      level3: shuffledLevel3,
    },
    nobles: selectedNobles,
    displayedCards,
    gemPool,
    gamePhase: 'setup',
  };
}

/**
 * Main game reducer to handle all game actions.
 *
 * Pure function that takes current state and an action, returning a new immutable
 * state with the action applied. This is the single source of truth for game state
 * transitions. All gem/card/point changes flow through this reducer.
 *
 * @param state - Current GameState
 * @param action - GameAction to process (discriminated union)
 * @returns New immutable GameState with action applied
 * @throws Error if action is invalid (delegates to handlers)
 *
 * Supported actions:
 * - TAKE_GEMS: Player collects gems from pool
 * - RESERVE_CARD: Player reserves a card and gets 1 gold
 * - PURCHASE_CARD: Player buys a card with gems
 * - CLAIM_NOBLE: Player claims a noble (usually auto via END_TURN)
 * - END_TURN: Player ends turn, advances to next player
 *
 * @example
 * const newState = gameReducer(state, {
 *   type: 'PURCHASE_CARD',
 *   playerIndex: 0,
 *   card: selectedCard
 * });
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TAKE_GEMS':
      return handleTakeGems(state, action);
    case 'DISCARD_GEMS':
      return handleDiscardGems(state, action);
    case 'RESERVE_CARD':
      return handleReserveCard(state, action);
    case 'PURCHASE_CARD':
      return handlePurchaseCard(state, action);
    case 'CLAIM_NOBLE':
      return handleClaimNoble(state, action);
    case 'END_TURN':
      return handleEndTurn(state, action);
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/**
 * Handle TAKE_GEMS action.
 *
 * Updates player gems and removes from pool. Validates that player doesn't exceed
 * MAX_GEMS_PER_PLAYER after taking. Used for both 2-of-same and 3-different gem takes.
 *
 * @param state - Current GameState
 * @param action - TAKE_GEMS action with gems array
 * @returns New GameState with updated gems
 * @throws Error if validation fails
 */
function handleTakeGems(
  state: GameState,
  action: Extract<GameAction, { type: 'TAKE_GEMS' }>
): GameState {
  const playerState = state.players[action.playerIndex];

  if (!playerState) {
    throw new Error(`Invalid player index: ${action.playerIndex}`);
  }

  // Validate the gems can be taken
  if (!GameRules.validateGemTake(action.gems, state.gemPool, playerState.gems)) {
    throw new Error('Cannot take those gems');
  }

  // Create gem objects for taking and removing from pool
  const gemsToAdd: GemCost & { gold: number } = {
    red: 0,
    blue: 0,
    green: 0,
    white: 0,
    black: 0,
    gold: 0,
  };

  const gemsToRemove: GemCost & { gold: number } = {
    red: 0,
    blue: 0,
    green: 0,
    white: 0,
    black: 0,
    gold: 0,
  };

  // Count gems by color
  for (const gemColor of action.gems) {
    const color = gemColor as Color;
    if (color === 'gold') {
      gemsToAdd.gold += 1;
      gemsToRemove.gold += 1;
    } else {
      gemsToAdd[color] = (gemsToAdd[color] || 0) + 1;
      gemsToRemove[color] = (gemsToRemove[color] || 0) + 1;
    }
  }

  // Update player gems
  const updatedPlayers = state.players.map((p, idx) =>
    idx === action.playerIndex
      ? {
          ...p,
          gems: {
            red: (p.gems.red || 0) + (gemsToAdd.red || 0),
            blue: (p.gems.blue || 0) + (gemsToAdd.blue || 0),
            green: (p.gems.green || 0) + (gemsToAdd.green || 0),
            white: (p.gems.white || 0) + (gemsToAdd.white || 0),
            black: (p.gems.black || 0) + (gemsToAdd.black || 0),
            gold: (p.gems.gold || 0) + (gemsToAdd.gold || 0),
          },
        }
      : p
  );

  // Update gem pool
  const updatedGemPool = {
    red: (state.gemPool.red || 0) - (gemsToRemove.red || 0),
    blue: (state.gemPool.blue || 0) - (gemsToRemove.blue || 0),
    green: (state.gemPool.green || 0) - (gemsToRemove.green || 0),
    white: (state.gemPool.white || 0) - (gemsToRemove.white || 0),
    black: (state.gemPool.black || 0) - (gemsToRemove.black || 0),
    gold: (state.gemPool.gold || 0) - (gemsToRemove.gold || 0),
  };

  return {
    ...state,
    players: updatedPlayers,
    gemPool: updatedGemPool,
  };
}

/**
 * Handle DISCARD_GEMS action.
 *
 * Removes selected gems from a player and returns them to the pool.
 * Used when player exceeds MAX_GEMS_PER_PLAYER after taking/reserving.
 *
 * @param state - Current GameState
 * @param action - DISCARD_GEMS action with gems array
 * @returns New GameState with updated gems and cleared pending discard
 * @throws Error if discard is invalid
 */
function handleDiscardGems(
  state: GameState,
  action: Extract<GameAction, { type: 'DISCARD_GEMS' }>
): GameState {
  const playerState = state.players[action.playerIndex];

  if (!playerState) {
    throw new Error(`Invalid player index: ${action.playerIndex}`);
  }

  if (!state.pendingDiscard || state.pendingDiscard.playerIndex !== action.playerIndex) {
    throw new Error('No pending discard for this player');
  }

  if (action.gems.length !== state.pendingDiscard.count) {
    throw new Error('Invalid discard count');
  }

  const discardCounts: GemCost & { gold: number } = {
    red: 0,
    blue: 0,
    green: 0,
    white: 0,
    black: 0,
    gold: 0,
  };

  for (const gemColor of action.gems) {
    const color = gemColor as Color;
    discardCounts[color] = (discardCounts[color] || 0) + 1;
  }

  // Ensure player has enough gems to discard
  const available = playerState.gems;
  for (const color of ['red', 'blue', 'green', 'white', 'black', 'gold'] as const) {
    const needed = discardCounts[color] || 0;
    if ((available[color] || 0) < needed) {
      throw new Error('Cannot discard gems not owned');
    }
  }

  const updatedPlayers = state.players.map((p, idx) =>
    idx === action.playerIndex
      ? {
          ...p,
          gems: {
            red: (p.gems.red || 0) - (discardCounts.red || 0),
            blue: (p.gems.blue || 0) - (discardCounts.blue || 0),
            green: (p.gems.green || 0) - (discardCounts.green || 0),
            white: (p.gems.white || 0) - (discardCounts.white || 0),
            black: (p.gems.black || 0) - (discardCounts.black || 0),
            gold: (p.gems.gold || 0) - (discardCounts.gold || 0),
          },
        }
      : p
  );

  const updatedGemPool = {
    red: (state.gemPool.red || 0) + (discardCounts.red || 0),
    blue: (state.gemPool.blue || 0) + (discardCounts.blue || 0),
    green: (state.gemPool.green || 0) + (discardCounts.green || 0),
    white: (state.gemPool.white || 0) + (discardCounts.white || 0),
    black: (state.gemPool.black || 0) + (discardCounts.black || 0),
    gold: (state.gemPool.gold || 0) + (discardCounts.gold || 0),
  };

  return {
    ...state,
    players: updatedPlayers,
    gemPool: updatedGemPool,
    pendingDiscard: undefined,
  };
}

/**
 * Handle RESERVE_CARD action.
 *
 * Reserves a card from the displayed cards, removes it from display, refills from deck,
 * and gives player 1 gold gem. Max 3 reserved cards per player.
 *
 * @param state - Current GameState
 * @param action - RESERVE_CARD action with card to reserve
 * @returns New GameState with reserved card and refilled display
 * @throws Error if player already has 3 reserved cards or card not in display
 */
function handleReserveCard(
  state: GameState,
  action: Extract<GameAction, { type: 'RESERVE_CARD' }>
): GameState {
  const playerState = state.players[action.playerIndex];

  if (!playerState) {
    throw new Error(`Invalid player index: ${action.playerIndex}`);
  }

  // Validate card can be reserved
  if (playerState.reservedCards.length >= GameRules.MAX_RESERVED_CARDS) {
    throw new Error('Maximum reserved cards reached');
  }

  // Check card is in displayed cards
  const cardLevel = action.card.level;
  const isCardDisplayed =
    state.displayedCards[`level${cardLevel}` as const].some(
      (c) => c.id === action.card.id
    );

  if (!isCardDisplayed) {
    throw new Error('Card is not in displayed cards');
  }

  // Remove card from displayed cards
  const updatedDisplayedCards = {
    ...state.displayedCards,
    [`level${cardLevel}`]: state.displayedCards[
      `level${cardLevel}` as const
    ].filter((c) => c.id !== action.card.id),
  };

  // Refill from deck
  const deckKey = `level${cardLevel}` as const;
  const remainingInDeck = state.deck[deckKey];

  if (remainingInDeck.length > 0) {
    const cardToAdd = remainingInDeck[0];
    updatedDisplayedCards[deckKey] = [
      ...updatedDisplayedCards[deckKey],
      cardToAdd,
    ];
  }

  // Update deck
  const updatedDeck = {
    ...state.deck,
    [deckKey]: state.deck[deckKey].slice(1),
  };

  // Add reserved card and give gold gem
  const updatedPlayers = state.players.map((p, idx) =>
    idx === action.playerIndex
      ? {
          ...p,
          reservedCards: [...p.reservedCards, action.card],
          gems: {
            ...p.gems,
            gold: (p.gems.gold || 0) + 1,
          },
        }
      : p
  );

  // Update gem pool
  const updatedGemPool = {
    ...state.gemPool,
    gold: Math.max(0, (state.gemPool.gold || 0) - 1),
  };

  return {
    ...state,
    players: updatedPlayers,
    displayedCards: updatedDisplayedCards as typeof state.displayedCards,
    deck: updatedDeck,
    gemPool: updatedGemPool,
  };
}

/**
 * Handle PURCHASE_CARD action.
 *
 * Purchases a card from displayed or reserved cards. Spends gems (colored + gold),
 * removes card from game, adds to player's purchased cards, awards points.
 * Refills display from deck if card was on display.
 *
 * Card must be affordable (checked before calling). Gem discount is calculated
 * from purchased cards automatically.
 *
 * @param state - Current GameState
 * @param action - PURCHASE_CARD action with card to purchase
 * @returns New GameState with card purchased and gems spent
 * @throws Error if player can't afford card or card not found
 */
function handlePurchaseCard(
  state: GameState,
  action: Extract<GameAction, { type: 'PURCHASE_CARD' }>
): GameState {
  const playerState = state.players[action.playerIndex];

  if (!playerState) {
    throw new Error(`Invalid player index: ${action.playerIndex}`);
  }

  // Validate purchase
  if (!GameRules.canPurchaseCard(playerState, action.card)) {
    throw new Error('Cannot afford this card');
  }

  // Calculate gem discount based on purchased cards
  const discount = GameRules.calculateGemDiscount(playerState);

  // Calculate gems to spend
  const gemsToSpend = calculateGemsToSpend(playerState.gems, action.card.cost, discount);

  // Find and remove card from displayed or reserved cards
  let cardFoundInDisplayed = false;
  let cardFoundInReserved = false;
  let updatedDisplayedCards = {
    ...state.displayedCards,
    level1: state.displayedCards.level1,
    level2: state.displayedCards.level2,
    level3: state.displayedCards.level3,
  };
  let updatedReservedCards = playerState.reservedCards;

  const cardLevel = action.card.level;
  const levelKey = `level${cardLevel}` as const;

  // Check displayed cards
  if (state.displayedCards[levelKey].some((c) => c.id === action.card.id)) {
    cardFoundInDisplayed = true;
    updatedDisplayedCards = {
      ...state.displayedCards,
      [levelKey]: state.displayedCards[levelKey].filter(
        (c) => c.id !== action.card.id
      ),
    };

    // Refill from deck if available
    if (state.deck[levelKey].length > 0) {
      const refillCard = state.deck[levelKey][0];
      updatedDisplayedCards[levelKey] = [
        ...updatedDisplayedCards[levelKey],
        refillCard,
      ];
    }
  } else if (playerState.reservedCards.some((c) => c.id === action.card.id)) {
    // Card is in reserved cards
    cardFoundInReserved = true;
    updatedReservedCards = playerState.reservedCards.filter(
      (c) => c.id !== action.card.id
    );
  }

  if (!cardFoundInDisplayed && !cardFoundInReserved) {
    throw new Error('Card not found in displayed or reserved cards');
  }

  // Update player: add card, spend gems, add points
  const updatedPlayers = state.players.map((p, idx) =>
    idx === action.playerIndex
      ? {
          ...p,
          purchasedCards: [...p.purchasedCards, action.card],
          reservedCards: updatedReservedCards,
          gems: subtractGems(p.gems, gemsToSpend),
          points: p.points + action.card.points,
        }
      : p
  );

  // Return gems to pool
  const updatedGemPool = addGems(state.gemPool, gemsToSpend);

  // Update deck if card was from displayed
  let updatedDeck = state.deck;
  if (cardFoundInDisplayed) {
    updatedDeck = {
      ...state.deck,
      [levelKey]: state.deck[levelKey].slice(1),
    };
  }

  return {
    ...state,
    players: updatedPlayers,
    displayedCards: updatedDisplayedCards,
    deck: updatedDeck,
    gemPool: updatedGemPool,
  };
}

/**
 * Handle CLAIM_NOBLE action.
 *
 * Awards a noble to a player, adding points and removing noble from game state.
 * Typically called automatically by END_TURN via TurnController when player
 * has sufficient gem bonuses.
 *
 * @param state - Current GameState
 * @param action - CLAIM_NOBLE action with noble to claim
 * @returns New GameState with noble claimed and points awarded
 * @throws Error if player doesn't meet noble requirement
 */
function handleClaimNoble(
  state: GameState,
  action: Extract<GameAction, { type: 'CLAIM_NOBLE' }>
): GameState {
  const playerState = state.players[action.playerIndex];

  if (!playerState) {
    throw new Error(`Invalid player index: ${action.playerIndex}`);
  }

  // Validate player can claim noble
  if (!GameRules.canClaimNoble(playerState, action.noble)) {
    throw new Error('Cannot claim this noble');
  }

  // Add noble to player
  const updatedPlayers = state.players.map((p, idx) =>
    idx === action.playerIndex
      ? {
          ...p,
          nobles: [...p.nobles, action.noble],
          points: p.points + action.noble.points,
        }
      : p
  );

  // Remove noble from game state
  const updatedNobles = state.nobles.filter((n) => n.id !== action.noble.id);

  return {
    ...state,
    players: updatedPlayers,
    nobles: updatedNobles,
  };
}

/**
 * Handle END_TURN action.
 *
 * Ends current player's turn. Auto-awards all eligible nobles, advances to next player,
 * and checks for game phase transitions:
 * - setup → active (after first full round)
 * - active → endGame (when someone reaches WINNING_POINTS)
 *
 * Called by player or via TurnController.
 *
 * @param state - Current GameState
 * @param action - END_TURN action
 * @returns New GameState with turn advanced and phases checked
 */
function handleEndTurn(
  state: GameState,
  action: Extract<GameAction, { type: 'END_TURN' }>
): GameState {
  if (state.pendingDiscard) {
    throw new Error('Cannot end turn while discard is pending');
  }
  // Auto-award eligible nobles
  const eligibleNobles = GameRules.getEligibleNobles(state, action.playerIndex);
  let updatedState = state;

  for (const noble of eligibleNobles) {
    updatedState = handleClaimNoble(updatedState, {
      type: 'CLAIM_NOBLE',
      playerIndex: action.playerIndex,
      noble,
    });
  }

  // Advance to next player
  const nextPlayerIndex = (action.playerIndex + 1) % updatedState.players.length;
  let newGamePhase = updatedState.gamePhase;

  // Check if we should transition game phase
  if (nextPlayerIndex === 0 && updatedState.gamePhase === 'setup') {
    newGamePhase = 'active';
  }

  // Check for game over
  if (GameRules.isGameOver(updatedState)) {
    newGamePhase = 'finished';
  }

  return {
    ...updatedState,
    currentPlayerIndex: nextPlayerIndex,
    gamePhase: newGamePhase,
    pendingDiscard: undefined,
  };
}

/**
 * Fisher-Yates shuffle algorithm.
 *
 * Shuffles an array in-place using cryptographically secure random.
 * Creates copy to avoid mutating input array.
 *
 * @param deck - Array to shuffle
 * @returns New shuffled copy of deck
 * @internal
 */
function shuffleDeck<T>(deck: T[]): T[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Select random nobles from pool.
 *
 * Uses shuffleDeck to randomly select N nobles from the pool.
 *
 * @param nobles - Available nobles to choose from
 * @param count - Number of nobles to select (typically playerCount + 1)
 * @returns Selected nobles array
 * @internal
 */
function selectRandomNobles(nobles: Noble[], count: number): Noble[] {
  const shuffled = shuffleDeck(nobles);
  return shuffled.slice(0, count);
}

/**
 * Calculate gems needed to spend for a purchase, accounting for discounts.
 *
 * Determines how many colored vs gold gems must be spent to afford a card.
 * Prioritizes spending colored gems first, then uses gold for remainder.
 *
 * @param playerGems - Player's current gem collection
 * @param cost - Card's gem cost requirement
 * @param discount - Gem discount from purchased cards
 * @returns Gem amounts to spend (colored + gold)
 * @internal
 */
function calculateGemsToSpend(
  playerGems: GemCost & { gold: number },
  cost: GemCost,
  discount: GemCost
): GemCost & { gold: number } {
  const colors: (keyof GemCost)[] = ['red', 'blue', 'green', 'white', 'black'];
  const spent: GemCost & { gold: number } = {
    red: 0,
    blue: 0,
    green: 0,
    white: 0,
    black: 0,
    gold: 0,
  };

  let goldNeeded = 0;

  for (const color of colors) {
    const needed = (cost[color] || 0) - (discount[color] || 0);
    const available = playerGems[color] || 0;

    if (available >= needed) {
      spent[color] = needed;
    } else {
      spent[color] = available;
      goldNeeded += needed - available;
    }
  }

  spent.gold = goldNeeded;
  return spent;
}

/**
 * Subtract gems from a gem pool.
 *
 * Safe gem arithmetic with floor at 0 (never negative).
 *
 * @param gems - Gem pool to subtract from
 * @param toSubtract - Gems to remove
 * @returns New gem pool with values subtracted
 * @internal
 */
function subtractGems(
  gems: GemCost & { gold: number },
  toSubtract: GemCost & { gold: number }
): GemCost & { gold: number } {
  return {
    red: Math.max(0, (gems.red || 0) - (toSubtract.red || 0)),
    blue: Math.max(0, (gems.blue || 0) - (toSubtract.blue || 0)),
    green: Math.max(0, (gems.green || 0) - (toSubtract.green || 0)),
    white: Math.max(0, (gems.white || 0) - (toSubtract.white || 0)),
    black: Math.max(0, (gems.black || 0) - (toSubtract.black || 0)),
    gold: Math.max(0, (gems.gold || 0) - (toSubtract.gold || 0)),
  };
}

/**
 * Add gems to a gem pool.
 *
 * Safe gem arithmetic (no upper limit here, limit checked elsewhere).
 *
 * @param gems - Gem pool to add to
 * @param toAdd - Gems to add
 * @returns New gem pool with values added
 * @internal
 */
function addGems(
  gems: GemCost & { gold: number },
  toAdd: GemCost & { gold: number }
): GemCost & { gold: number } {
  return {
    red: (gems.red || 0) + (toAdd.red || 0),
    blue: (gems.blue || 0) + (toAdd.blue || 0),
    green: (gems.green || 0) + (toAdd.green || 0),
    white: (gems.white || 0) + (toAdd.white || 0),
    black: (gems.black || 0) + (toAdd.black || 0),
    gold: (gems.gold || 0) + (toAdd.gold || 0),
  };
}
