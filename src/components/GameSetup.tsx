/**
 * GameSetup component - Initial game configuration screen
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import './GameSetup.css';

interface GameSetupProps {
  onStartGame: (numberOfOpponents: 1 | 2 | 3, difficulties: Array<'easy' | 'medium' | 'hard'>) => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const [selectedOpponents, setSelectedOpponents] = useState<1 | 2 | 3>(2);
  const [difficulties, setDifficulties] = useState<Array<'easy' | 'medium' | 'hard'>>(['hard', 'medium']);

  const ensureDifficultyCount = (count: 1 | 2 | 3) => {
    const defaults: Array<'easy' | 'medium' | 'hard'> = ['hard', 'medium', 'easy'];
    setDifficulties((prev) => {
      const next = [...prev];
      while (next.length < count) {
        next.push(defaults[next.length] || 'medium');
      }
      return next.slice(0, count);
    });
  };

  const randomizeDifficulties = (count: number) => {
    const choices: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
    const next = Array.from({ length: count }, () => choices[Math.floor(Math.random() * choices.length)]);
    setDifficulties(next);
  };

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
                onClick={() => {
                  setSelectedOpponents(num);
                  ensureDifficultyCount(num);
                }}
              >
                <div className="opponent-count">{num}</div>
                <div className="opponent-label">Opponent{num !== 1 ? 's' : ''}</div>
                <div className="difficulty-hint">
                  {num === 1 && '1 AI'}
                  {num === 2 && '2 AIs'}
                  {num === 3 && '3 AIs'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="setup-section">
          <h2>AI Difficulty</h2>
          <p>Choose difficulty for each AI player (or randomize all):</p>

          <div className="difficulty-controls">
            {Array.from({ length: selectedOpponents }).map((_, idx) => (
              <div key={`ai-diff-${idx}`} className="difficulty-row">
                <span className="difficulty-label">AI {idx + 1}</span>
                <select
                  className="difficulty-select"
                  value={difficulties[idx] || 'medium'}
                  onChange={(e) => {
                    const value = e.target.value as 'easy' | 'medium' | 'hard';
                    setDifficulties((prev) => {
                      const next = [...prev];
                      next[idx] = value;
                      return next;
                    });
                  }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            ))}
            <button
              className="randomize-btn"
              onClick={() => randomizeDifficulties(selectedOpponents)}
            >
              Randomize All Difficulties
            </button>
          </div>
        </div>

        <div className="setup-section info">
          <h3>How to Play</h3>
          <ul>
            <li><strong>Goal:</strong> Reach 15 prestige points</li>
            <li><strong>Take Gems:</strong> Collect 3 different colors or 2 same-color (if 4+ available)</li>
            <li><strong>Buy Cards:</strong> Spend gems to purchase cards for points</li>
            <li><strong>Claim Nobles:</strong> Automatically awarded when you have gem bonuses</li>
            <li><strong>Max Gems:</strong> You must discard down to 10 at end of turn</li>
          </ul>
        </div>

        <button className="start-btn" onClick={() => onStartGame(selectedOpponents, difficulties)}>
          Start Game
        </button>
      </div>
    </div>
  );
};
