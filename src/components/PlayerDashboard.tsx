/**
 * PlayerDashboard component - displays player information and resources
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import React from 'react';
import type { PlayerState, Noble as NobleType } from '../types';
import Card from './Card';
import NobleComponent from './Noble';
import './PlayerDashboard.css';

interface PlayerDashboardProps {
  playerState: PlayerState;
  isCurrent: boolean;
  reservedCards?: any[];
  purchasedCardCount?: number;
  nobles?: NobleType[];
  purchasableReservedIds?: string[];
  disableReservedPurchase?: boolean;
  onPurchaseReserved?: (card: any) => void;
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  playerState,
  isCurrent,
  reservedCards = [],
  purchasedCardCount = 0,
  nobles = [],
  purchasableReservedIds = [],
  disableReservedPurchase = false,
  onPurchaseReserved,
}) => {
  const colorClasses: Record<string, string> = {
    red: 'gem-red',
    blue: 'gem-blue',
    green: 'gem-green',
    white: 'gem-white',
    black: 'gem-black',
    gold: 'gem-gold',
  };

  const totalGems =
    (playerState.gems.red || 0) +
    (playerState.gems.blue || 0) +
    (playerState.gems.green || 0) +
    (playerState.gems.white || 0) +
    (playerState.gems.black || 0) +
    (playerState.gems.gold || 0);

  // Count gem bonuses from purchased cards
  const gemBonuses = {
    red: playerState.purchasedCards.filter((c) => c.color === 'red').length,
    blue: playerState.purchasedCards.filter((c) => c.color === 'blue').length,
    green: playerState.purchasedCards.filter((c) => c.color === 'green').length,
    white: playerState.purchasedCards.filter((c) => c.color === 'white').length,
    black: playerState.purchasedCards.filter((c) => c.color === 'black').length,
  };

  return (
    <div className={`player-dashboard ${isCurrent ? 'current-player' : ''}`}>
      <div className="player-header">
        <h3>{playerState.name}</h3>
        {playerState.isAI && (
          <span className="ai-badge">
            AI{playerState.aiDifficulty ? ` - ${playerState.aiDifficulty[0].toUpperCase()}${playerState.aiDifficulty.slice(1)}` : ''}
          </span>
        )}
      </div>

      {/* Points */}
      <div className="points-display">
        <div className="points-value">{playerState.points}</div>
        <div className="points-label">Points</div>
      </div>

      {/* Gems */}
      <div className="gems-section">
        <h4>Gems ({totalGems}/10)</h4>
        <div className="gems-grid">
          {(['red', 'blue', 'green', 'white', 'black', 'gold'] as const).map((color) => {
            const count = playerState.gems[color as 'red' | 'blue' | 'green' | 'white' | 'black' | 'gold'] || 0;
            const bonus = gemBonuses[color as 'red' | 'blue' | 'green' | 'white' | 'black'] || 0;
            return (
              <div key={color} className={`gem-display ${colorClasses[color] || ''}`}>
                <div className="gem-count">{count}</div>
                {bonus > 0 && <div className="gem-bonus">+{bonus}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reserved Cards */}
      {reservedCards.length > 0 && (
        <div className="reserved-section">
          <h4>Reserved ({reservedCards.length})</h4>
          <div className="reserved-cards">
            {reservedCards.map((card) => (
              <div
                key={card.id}
                className={`reserved-card-mini ${
                  isCurrent && purchasableReservedIds.includes(card.id) && !disableReservedPurchase
                    ? 'reserved-card-mini--purchasable'
                    : ''
                }`}
              >
                <div className="card-mini-points">{card.points}</div>
                <div className={`card-mini-color`}></div>
                <div
                  className={`reserved-card-preview ${
                    isCurrent && purchasableReservedIds.includes(card.id) && !disableReservedPurchase
                      ? 'can-purchase'
                      : ''
                  }`}
                >
                  <Card
                    card={card}
                    onClick={() => {
                      if (
                        isCurrent &&
                        purchasableReservedIds.includes(card.id) &&
                        !disableReservedPurchase &&
                        onPurchaseReserved
                      ) {
                        onPurchaseReserved(card);
                      }
                    }}
                    state="reserved"
                    isClickable={
                      isCurrent &&
                      purchasableReservedIds.includes(card.id) &&
                      !disableReservedPurchase &&
                      Boolean(onPurchaseReserved)
                    }
                    isAffordable={
                      isCurrent &&
                      purchasableReservedIds.includes(card.id) &&
                      !disableReservedPurchase
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchased Cards Count */}
      {purchasedCardCount > 0 && (
        <div className="purchased-section">
          <div className="purchased-count">{purchasedCardCount}</div>
          <div className="purchased-label">Purchased Cards</div>
        </div>
      )}

      {/* Nobles */}
      {nobles.length > 0 && (
        <div className="nobles-section">
          <h4>Nobles ({nobles.length})</h4>
          <div className="nobles-display">
            {nobles.map((noble) => (
              <NobleComponent key={noble.id} noble={noble} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDashboard;
