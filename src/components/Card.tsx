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

  const bandColorMap: Record<string, string> = {
    red: '#e74c3c',
    blue: '#3498db',
    green: '#2ecc71',
    white: '#ecf0f1',
    black: '#2c3e50',
    gold: '#f39c12',
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
      style={{
        '--band-color': bandColorMap[card.color] || '#1a1a2e',
      } as React.CSSProperties}
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
      {/* Colored Band with Points */}
      <div className="card-band">
        {card.points > 0 && <div className="card-points">{card.points}</div>}
      </div>

      {/* Card Content */}
      <div className="card-content"></div>

      {/* Cost Display */}
      <div className="card-cost">
        {costEntries.map(([color, count]) => (
          <div key={color} className={`cost-gem ${colorClasses[color] || ''}`}>
            <span className="cost-number">{count}</span>
          </div>
        ))}
      </div>

      {/* Card Level */}
      <div className="card-level-indicator">
        {card.level === 1 && 'I'}
        {card.level === 2 && 'II'}
        {card.level === 3 && 'III'}
      </div>

      {/* State Overlays */}
      {state === 'reserved' && <div className="card-overlay reserved-overlay">Reserved</div>}
      {state === 'purchased' && <div className="card-overlay purchased-overlay">Owned</div>}
    </div>
  );
};

export default Card;
