/**
 * GemPool component - displays available gems and handles gem selection
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { GemCost, Color } from '../types';
import { GameRules } from '../game/rules';
import './GemPool.css';

interface GemPoolProps {
  gemPool: GemCost & { gold: number };
  onSelectGems: (gems: string[]) => void;
  disabled: boolean;
}

const GemPool: React.FC<GemPoolProps> = ({ gemPool, onSelectGems, disabled }) => {
  const [selectedGems, setSelectedGems] = useState<string[]>([]);

  const colorClasses: Record<string, string> = {
    red: 'gem-red',
    blue: 'gem-blue',
    green: 'gem-green',
    white: 'gem-white',
    black: 'gem-black',
    gold: 'gem-gold',
  };

  const gems = ['red', 'blue', 'green', 'white', 'black', 'gold'] as const;

  // Check if selection is valid (2 of same or 3 different)
  const isValidSelection = useMemo(() => {
    if (selectedGems.length === 0) return false;

    const counts: Record<string, number> = {};
    selectedGems.forEach((gem) => {
      counts[gem] = (counts[gem] || 0) + 1;
    });

    const uniqueColors = Object.keys(counts).length;

    if (selectedGems.length === 2 && uniqueColors === 1) {
      // 2 of same color is valid
      return true;
    }

    if (selectedGems.length === 3 && uniqueColors === 3) {
      // 3 different colors is valid
      return true;
    }

    return false;
  }, [selectedGems]);

  const handleGemClick = useCallback(
    (color: string) => {
      if (disabled) return;

      const count = gemPool[color as Color] || 0;
      if (count === 0) return;

      const newSelected = [...selectedGems];
      const existingIndex = newSelected.indexOf(color);

      if (existingIndex >= 0) {
        // Remove gem
        newSelected.splice(existingIndex, 1);
      } else {
        // Add gem if not at max
        if (newSelected.length < 3) {
          newSelected.push(color);
        }
      }

      setSelectedGems(newSelected);
    },
    [selectedGems, gemPool, disabled]
  );

  const handleTakeGems = useCallback(() => {
    if (isValidSelection && !disabled) {
      onSelectGems(selectedGems);
      setSelectedGems([]);
    }
  }, [isValidSelection, selectedGems, onSelectGems, disabled]);

  const handleClear = useCallback(() => {
    setSelectedGems([]);
  }, []);

  return (
    <div className="gem-pool">
      <h3>Gem Pool</h3>
      <div className="gems-display">
        {gems.map((color) => {
          const count = gemPool[color] || 0;
          const isSelected = selectedGems.includes(color);
          const isAvailable = count > 0;

          return (
            <button
              key={color}
              className={`gem-token ${colorClasses[color] || ''} ${isSelected ? 'selected' : ''} ${
                !isAvailable || disabled ? 'disabled' : ''
              }`}
              onClick={() => handleGemClick(color)}
              disabled={!isAvailable || disabled}
              aria-label={`${color} gem (${count} available)`}
            >
              <div className="gem-count">{count}</div>
              {isSelected && <div className="selection-indicator"></div>}
            </button>
          );
        })}
      </div>

      {/* Selection Info */}
      <div className="selection-info">
        <p>Selected: {selectedGems.length}/3</p>
        {selectedGems.length > 0 && (
          <div className="selected-gems">
            {selectedGems.map((gem, idx) => (
              <span key={idx} className={`gem-tag ${colorClasses[gem] || ''}`}>
                {gem}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="gem-actions">
        <button
          className="btn btn-primary"
          onClick={handleTakeGems}
          disabled={!isValidSelection || disabled}
          aria-label="Take selected gems"
        >
          Take Gems
        </button>
        {selectedGems.length > 0 && (
          <button className="btn btn-secondary" onClick={handleClear} disabled={disabled}>
            Clear
          </button>
        )}
      </div>

      {/* Validation Messages */}
      {selectedGems.length > 0 && !isValidSelection && (
        <div className="validation-message">
          Select either 2 of the same color or 3 different colors
        </div>
      )}
    </div>
  );
};

export default GemPool;
