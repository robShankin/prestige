/**
 * Main Game component - renders the Splendor game UI
 */

import React, { useState, useReducer, useEffect } from 'react';
import type { GameState, GameAction } from '../types';
import { initializeGame, gameReducer } from '../game/engine';
import { TurnController } from '../game/turnController';
import { AIPlayer } from '../ai/aiPlayer';
import GameBoard from './GameBoard';
import GameOver from './GameOver';
import './Game.css';

interface GameProps {
  numberOfOpponents: 1 | 2 | 3;
}

// Wrapper reducer to handle initialization
function gameStateReducer(state: GameState | null, action: GameAction | { type: 'INIT_GAME'; gameState: GameState }): GameState | null {
  if ('gameState' in action) {
    return action.gameState;
  }
  if (state === null) return null;
  return gameReducer(state, action as GameAction);
}

export const Game: React.FC<GameProps> = ({ numberOfOpponents }) => {
  const totalPlayers = numberOfOpponents + 1;
  const [gameState, dispatch] = useReducer(gameStateReducer, null as GameState | null);
  const [isLoading, setIsLoading] = useState(false);
  const [turnController, setTurnController] = useState<TurnController | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize game on mount or when numberOfOpponents changes
  useEffect(() => {
    const newGameState = initializeGame(totalPlayers);
    dispatch({ type: 'INIT_GAME', gameState: newGameState });

    // Setup AI players
    const aiPlayers = new Map<number, AIPlayer>();
    for (let i = 1; i < totalPlayers; i++) {
      const difficulty = i === 1 ? 'hard' : i === 2 ? 'medium' : 'easy';
      aiPlayers.set(i, new AIPlayer(`ai-${i}`, difficulty));
    }

    setTurnController(new TurnController(gameReducer, aiPlayers));
  }, [totalPlayers]);

  const handleAction = async (action: GameAction) => {
    if (!gameState || !turnController || isLoading) return;

    try {
      setError(null);
      setIsLoading(true);

      // Execute the action through the turn controller
      const newState = await turnController.executeTurn(gameState, action);
      dispatch({ type: 'SET_STATE' as any, gameState: newState });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Action failed:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    const newGameState = initializeGame(totalPlayers);
    dispatch({ type: 'INIT_GAME', gameState: newGameState });
    setError(null);
  };

  if (!gameState) {
    return (
      <div className="game-setup">
        <h1>Splendor</h1>
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

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>Splendor</h1>
        <div className="game-status">
          <p>
            Current Player: <strong>{currentPlayer.name}</strong>
            {isCurrentPlayerAI && <span className="ai-indicator"> (AI - Thinking...)</span>}
          </p>
          <p>Phase: <strong>{gameState.gamePhase}</strong></p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <GameBoard
        gameState={gameState}
        onAction={handleAction}
        isLoading={isLoading}
        isCurrentPlayerAI={isCurrentPlayerAI}
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
