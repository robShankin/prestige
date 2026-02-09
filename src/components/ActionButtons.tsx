/**
 * ActionButtons component - displays available actions as buttons
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback } from 'react';
import type { GameAction } from '../types';
import './ActionButtons.css';

interface ActionButtonsProps {
  validActions: GameAction[];
  onAction: (action: GameAction) => Promise<void>;
  disabled: boolean;
  isAITurn: boolean;
  disableNonEndActions: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  validActions,
  onAction,
  disabled,
  isAITurn,
  disableNonEndActions,
}) => {
  // Group actions by type
  const actionsByType = validActions.reduce(
    (acc, action) => {
      if (!acc[action.type]) {
        acc[action.type] = [];
      }
      acc[action.type].push(action);
      return acc;
    },
    {} as Record<string, GameAction[]>
  );

  const handleAction = useCallback(
    (action: GameAction) => {
      if (!disabled) {
        onAction(action);
      }
    },
    [disabled, onAction]
  );

  return (
    <div className="action-buttons">
      <h3>Actions</h3>

      {isAITurn ? (
        <div className="ai-thinking">
          <p>AI is deciding...</p>
        </div>
      ) : (
        <div className="button-grid">
          {/* Purchase Card Actions */}
          {actionsByType.PURCHASE_CARD && actionsByType.PURCHASE_CARD.length > 0 && (
            <div className="action-group">
              <div className="group-label">Purchase Cards</div>
              {actionsByType.PURCHASE_CARD.slice(0, 5).map((action, idx) => {
                const card = 'card' in action ? ((action as unknown) as any).card : null;
                const points = (card as any)?.points || 0;
                return (
                  <button
                    key={`purchase-${idx}`}
                    className="btn btn-purchase"
                    onClick={() => handleAction(action)}
                    disabled={disabled || disableNonEndActions}
                  >
                    Buy {points > 0 ? points + ' pts' : 'Card'}
                  </button>
                );
              })}
              {actionsByType.PURCHASE_CARD.length > 5 && (
                <div className="more-actions">+{actionsByType.PURCHASE_CARD.length - 5} more</div>
              )}
            </div>
          )}

          {/* End Turn / Undo moved to top bar */}
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
