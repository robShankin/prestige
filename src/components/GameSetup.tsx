/**
 * GameSetup component - Initial game configuration screen
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import './GameSetup.css';

interface GameSetupProps {
  onStartGame: (numberOfOpponents: 1 | 2 | 3) => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const [selectedOpponents, setSelectedOpponents] = useState<1 | 2 | 3>(2);

  return (
    <div className="game-setup">
      <div className="setup-container">
        <h1>♔ Prestige</h1>
        <p className="subtitle">A Strategic Card Game</p>

        <div className="setup-section">
          <h2>Choose Your Challenge</h2>
          <p>Select how many AI opponents you want to face:</p>

          <div className="opponent-buttons">
            {([1, 2, 3] as const).map((num) => (
              <button
                key={num}
                className={`opponent-btn ${selectedOpponents === num ? 'selected' : ''}`}
                onClick={() => setSelectedOpponents(num)}
              >
                <div className="opponent-count">{num}</div>
                <div className="opponent-label">Opponent{num !== 1 ? 's' : ''}</div>
                <div className="difficulty-hint">
                  {num === 1 && '1 x Hard'}
                  {num === 2 && '1 x Hard, 1 x Medium'}
                  {num === 3 && '1 x Hard, 1 x Medium, 1 x Easy'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="setup-section info">
          <h3>How to Play</h3>
          <ul>
            <li><strong>Goal:</strong> Reach 15 prestige points</li>
            <li><strong>Take Gems:</strong> Collect 2 same-color or 3 different colors</li>
            <li><strong>Buy Cards:</strong> Spend gems to purchase cards for points</li>
            <li><strong>Claim Nobles:</strong> Automatically awarded when you have gem bonuses</li>
            <li><strong>Max Gems:</strong> You can hold up to 10 gems at once</li>
          </ul>
        </div>

        <button className="start-btn" onClick={() => onStartGame(selectedOpponents)}>
          Start Game
        </button>
      </div>
    </div>
  );
};
