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
  disableEndTurn: boolean;
  canUndo: boolean;
  onUndo: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  validActions,
  onAction,
  disabled,
  isAITurn,
  disableNonEndActions,
  disableEndTurn,
  canUndo,
  onUndo,
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

          {/* Reserve Card Actions */}
          {actionsByType.RESERVE_CARD && actionsByType.RESERVE_CARD.length > 0 && (
            <div className="action-group">
              <div className="group-label">Reserve Cards</div>
              {actionsByType.RESERVE_CARD.slice(0, 5).map((action, idx) => {
                const card = 'card' in action ? ((action as unknown) as any).card : null;
                return (
                  <button
                    key={`reserve-${idx}`}
                    className="btn btn-reserve"
                    onClick={() => handleAction(action)}
                    disabled={disabled || disableNonEndActions}
                  >
                    Reserve {card?.level || '?'}
                  </button>
                );
              })}
              {actionsByType.RESERVE_CARD.length > 5 && (
                <div className="more-actions">+{actionsByType.RESERVE_CARD.length - 5} more</div>
              )}
            </div>
          )}

          {/* End Turn Action */}
          {actionsByType.END_TURN && (
            <div className="action-group">
              <button
                className="btn btn-primary btn-large"
                onClick={() => handleAction(actionsByType.END_TURN[0])}
                disabled={disabled || disableEndTurn}
              >
                End Turn
              </button>
              {canUndo && (
                <button
                  className="btn btn-secondary"
                  onClick={onUndo}
                  disabled={disabled}
                >
                  Undo
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
