/**
 * Noble component - displays a noble token in compressed format
 */

import React from 'react';
import type { Noble as NobleType } from '../types';
import './Noble.css';

interface NobleProps {
  noble: NobleType;
}

const Noble: React.FC<NobleProps> = ({ noble }) => {
  const colorClasses: Record<string, string> = {
    red: 'gem-red',
    blue: 'gem-blue',
    green: 'gem-green',
    white: 'gem-white',
    black: 'gem-black',
    gold: 'gem-gold',
  };

  const costEntries = Object.entries(noble.requirement)
    .filter(([, count]) => (count || 0) > 0)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0));

  return (
    <div className="noble">
      {/* Points (top right, larger relative) */}
      {noble.points > 0 && <div className="noble-points">{noble.points}</div>}

      {/* Noble Content */}
      <div className="noble-content"></div>

      {/* Cost Display (bottom left, stacked vertically, larger relative) */}
      <div className="noble-cost">
        {costEntries.map(([color, count]) => (
          <div key={color} className={`noble-cost-gem ${colorClasses[color] || ''}`}>
            <span className="cost-number">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Noble;
