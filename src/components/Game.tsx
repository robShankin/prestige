/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Main Game component - renders the Prestige game UI.
 *
 * Root React component that manages:
 * - Game state via useReducer
 * - Game initialization and AI setup
 * - Action execution through TurnController
 * - Render logic (loading → game board → game over)
 */

import React, { useState, useReducer, useEffect } from 'react';
import type { GameState, GameAction } from '../types';
import { initializeGame, gameReducer } from '../game/engine';
import { TurnController } from '../game/turnController';
import { AIPlayer } from '../ai/aiPlayer';
import { GameSetup } from './GameSetup';
import GameBoard from './GameBoard';
import GameOver from './GameOver';
import './Game.css';
import { getRandomAiNames } from '../game/data/aiNames';

/**
 * Props for the Game component.
 *
 * @property numberOfOpponents - Number of AI opponents (1-3)
 */
interface GameProps {
  numberOfOpponents?: 1 | 2 | 3;
}

/**
 * Wrapper reducer to handle both game actions and initialization.
 *
 * Supports INIT_GAME action for setup and regular GameActions for gameplay.
 *
 * @param state - Current game state (null during init)
 * @param action - Either INIT_GAME or a GameAction
 * @returns New game state or null if not initialized
 *
 * @internal
 */
function gameStateReducer(state: GameState | null, action: GameAction | { type: 'INIT_GAME'; gameState: GameState }): GameState | null {
  if ('gameState' in action) {
    return action.gameState;
  }
  if (state === null) return null;
  return gameReducer(state, action as GameAction);
}

/**
 * Game component - Main entry point for the Splendor game.
 *
 * Manages game lifecycle:
 * - Initializes game and AI players on mount
 * - Handles user actions and updates state
 * - Displays loading state, game board, or game over screen
 * - Shows current player and game phase
 * - Handles errors gracefully
 *
 * @param props - GameProps with numberOfOpponents
 * @returns React component tree
 *
 * @example
 * <Game numberOfOpponents={2} />  // Game with 1 human + 2 AI
 */
export const Game: React.FC<GameProps> = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedOpponents, setSelectedOpponents] = useState<1 | 2 | 3 | null>(null);
  const [gameState, dispatch] = useReducer(gameStateReducer, null as GameState | null);
  const [isLoading, setIsLoading] = useState(false);
  const [turnController, setTurnController] = useState<TurnController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnStartState, setTurnStartState] = useState<GameState | null>(null);
  const [hasPendingAction, setHasPendingAction] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'menu' | 'new' | null>(null);

  const handleStartGame = (opponents: 1 | 2 | 3, difficulties: Array<'easy' | 'medium' | 'hard'>) => {
    setSelectedOpponents(opponents);
    setIsLoading(true);
    setError(null);

    const totalPlayers = opponents + 1;
    const newGameState = initializeGame(totalPlayers);
    const aiNames = getRandomAiNames(opponents);

    const updatedPlayers = newGameState.players.map((player, idx) => {
      if (idx === 0) return player;
      const difficulty = difficulties[idx - 1] || 'medium';
      return {
        ...player,
        name: aiNames[idx - 1] || `AI-${idx}`,
        aiDifficulty: difficulty,
      };
    });
    const patchedGameState = { ...newGameState, players: updatedPlayers };
    dispatch({ type: 'INIT_GAME', gameState: patchedGameState });
    setTurnStartState(patchedGameState);
    setHasPendingAction(false);

    // Setup AI players
    const aiPlayers = new Map<number, AIPlayer>();
    for (let i = 1; i < totalPlayers; i++) {
      const difficulty = difficulties[i - 1] || 'medium';
      aiPlayers.set(i, new AIPlayer(`ai-${i}`, difficulty));
    }

    setTurnController(new TurnController(gameReducer, aiPlayers));
    setIsLoading(false);
  };

  const handleRestart = () => {
    setSelectedOpponents(null);
    // Return to setup screen; game state will be re-initialized on start.
    setTurnController(null);
    setError(null);
    setIsLoading(false);
    setTurnStartState(null);
    setHasPendingAction(false);
  };

  const handleConfirmNavigation = (action: 'menu' | 'new') => {
    if (selectedOpponents !== null && gameState && gameState.gamePhase !== 'finished') {
      setConfirmAction(action);
      return;
    }
    handleRestart();
  };

  useEffect(() => {
    if (!gameState) return;
    setTurnStartState(gameState);
    setHasPendingAction(false);
  }, [gameState?.currentPlayerIndex]);

  const handleUndo = () => {
    if (!turnStartState) return;
    dispatch({ type: 'SET_STATE', gameState: turnStartState } as any);
    setHasPendingAction(false);
    setError(null);
  };

  const handleAction = async (action: GameAction) => {
    if (!gameState || !turnController || isLoading) return;

    if (
      gameState.pendingDiscard &&
      gameState.pendingDiscard.playerIndex === gameState.currentPlayerIndex &&
      action.type !== 'DISCARD_GEMS'
    ) {
      setError('You must discard down to 10 tokens before ending your turn.');
      return;
    }

    if (action.type === 'END_TURN' && !hasPendingAction) {
      setError('You must take an action before ending your turn.');
      return;
    }

    if (action.type !== 'END_TURN' && action.type !== 'DISCARD_GEMS' && hasPendingAction) {
      setError('You already took an action. Undo or end your turn.');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Execute the action through the turn controller
      const newState = await turnController.executeTurn(gameState, action);
      dispatch({ type: 'SET_STATE', gameState: newState } as any);
      if (action.type === 'END_TURN') {
        setHasPendingAction(false);
      } else {
        setHasPendingAction(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Action failed:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show setup screen if no opponents selected yet
  if (selectedOpponents === null) {
    return <GameSetup onStartGame={handleStartGame} />;
  }

  if (!gameState) {
    return (
      <div className="game-setup">
        <h1>Prestige</h1>
        <p>Initializing game...</p>
      </div>
    );
  }

  if (gameState.gamePhase === 'finished' && gameState.winner) {
    return (
      <div className="game-container">
        <GameOver winner={gameState.winner} allPlayers={gameState.players} onRestart={handleRestart} />
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isCurrentPlayerAI = currentPlayer.isAI;
  const isDiscarding = gameState.pendingDiscard?.playerIndex === gameState.currentPlayerIndex;

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="header-top">
          <h1>♔ Prestige</h1>
          <div className="header-buttons">
            <button className="btn-restart" onClick={() => handleConfirmNavigation('new')} title="Start a new game">
              🔄 New Game
            </button>
            <button className="btn-quit" onClick={() => handleConfirmNavigation('menu')} title="Return to setup">
              ✕ Menu
            </button>
          </div>
        </div>
        <div className="game-status">
          <p>
            Current Player: <strong>{currentPlayer.name}</strong>
            {isCurrentPlayerAI && <span className="ai-indicator"> (AI - Thinking...)</span>}
          </p>
          <p>Phase: <strong>{gameState.gamePhase}</strong></p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {confirmAction && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Return to Menu?</h3>
            <p>Your current game will be lost.</p>
            <div className="confirm-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setConfirmAction(null);
                  handleRestart();
                }}
              >
                Yes
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <GameBoard
        gameState={gameState}
        onAction={handleAction}
        isLoading={isLoading}
        isCurrentPlayerAI={isCurrentPlayerAI}
        hasPendingAction={hasPendingAction}
        onEndTurn={() => handleAction({ type: 'END_TURN', playerIndex: gameState.currentPlayerIndex })}
        onUndo={handleUndo}
        disableEndTurn={isLoading || isCurrentPlayerAI || isDiscarding || !hasPendingAction}
        disableUndo={isLoading || isCurrentPlayerAI || !hasPendingAction}
      />

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing turn...</p>
        </div>
      )}
    </div>
  );
};
