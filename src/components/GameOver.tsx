/**
 * GameOver component - displays final game results and leaderboard
 */

import React from 'react';
import type { PlayerState } from '../types';
import './GameOver.css';

interface GameOverProps {
  winner: PlayerState;
  allPlayers: PlayerState[];
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ winner, allPlayers, onRestart }) => {
  // Sort players by points for leaderboard
  const leaderboard = [...allPlayers].sort((a, b) => b.points - a.points);

  return (
    <div className="game-over-container">
      <div className="game-over-modal">
        <h1 className="game-over-title">Game Over</h1>

        {/* Winner Section */}
        <div className="winner-section">
          <div className="winner-badge">Victory!</div>
          <h2 className="winner-name">{winner.name}</h2>
          <div className="winner-points">{winner.points} Points</div>
          {winner.isAI && <p className="ai-winner-text">The AI has defeated you!</p>}
        </div>

        {/* Leaderboard */}
        <div className="leaderboard">
          <h3>Final Standings</h3>
          <div className="leaderboard-table">
            <div className="leaderboard-header">
              <div className="rank-col">Rank</div>
              <div className="name-col">Player</div>
              <div className="points-col">Points</div>
            </div>
            {leaderboard.map((player, idx) => (
              <div key={player.id} className={`leaderboard-row ${idx === 0 ? 'winner' : ''}`}>
                <div className="rank-col">
                  <span className="rank-badge">#{idx + 1}</span>
                </div>
                <div className="name-col">
                  <span className="player-name">{player.name}</span>
                  {player.isAI && <span className="ai-tag">AI</span>}
                </div>
                <div className="points-col">
                  <span className="points-value">{player.points}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Stats */}
        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Cards Purchased</span>
            <span className="stat-value">{winner.purchasedCards.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Nobles Claimed</span>
            <span className="stat-value">{winner.nobles.length}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="game-over-actions">
          <button className="btn btn-primary btn-large" onClick={onRestart}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
