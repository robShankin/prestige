/**
 * Card component - displays a single Splendor card
 */

import React from 'react';
import type { Card as CardType } from '../types';
import './Card.css';

interface CardProps {
  card: CardType;
  onClick: () => void;
  state?: 'available' | 'reserved' | 'purchased';
  isClickable?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, state = 'available', isClickable = false }) => {
  const colorClasses: Record<string, string> = {
    red: 'gem-red',
    blue: 'gem-blue',
    green: 'gem-green',
    white: 'gem-white',
    black: 'gem-black',
    gold: 'gem-gold',
  };

  const costEntries = Object.entries(card.cost)
    .filter(([, count]) => (count || 0) > 0)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0));

  return (
    <div
      className={`card card-level-${card.level} card-${state} ${isClickable ? 'card-clickable' : ''}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Points */}
      {card.points > 0 && <div className="card-points">{card.points}</div>}

      {/* Card Content */}
      <div className="card-content">
        {/* Gem Color Bonus */}
        <div className={`gem-bonus-bar ${colorClasses[card.color] || ''}`}></div>

        {/* Cost Display */}
        <div className="card-cost">
          {costEntries.map(([color, count]) => (
            <div key={color} className={`cost-gem ${colorClasses[color] || ''}`}>
              <span className="cost-number">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* State Overlays */}
      {state === 'reserved' && <div className="card-overlay reserved-overlay">Reserved</div>}
      {state === 'purchased' && <div className="card-overlay purchased-overlay">Owned</div>}
    </div>
  );
};

export default Card;
