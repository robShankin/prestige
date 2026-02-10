/**
 * GameBoard component - main game layout with nobles, cards, gem pool, and players
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo, useState, useEffect } from 'react';
import type { GameState, GameAction } from '../types';
import { TurnController } from '../game/turnController';
import Card from './Card';
import NobleComponent from './Noble';
import GemPool from './GemPool';
import PlayerDashboard from './PlayerDashboard';
import ActionButtons from './ActionButtons';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  onAction: (action: GameAction) => Promise<void>;
  isLoading: boolean;
  isCurrentPlayerAI: boolean;
  hasPendingAction: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onAction,
  isLoading,
  isCurrentPlayerAI,
  hasPendingAction,
}) => {
  const turnController = useMemo(() => new TurnController(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_state, _action) => _state,
    new Map()
  ), []);
  const [discardSelection, setDiscardSelection] = useState<string[]>([]);

  const validActions = useMemo(() => {
    if (isCurrentPlayerAI || isLoading) return [];
    return turnController.getValidActions(gameState, gameState.currentPlayerIndex);
  }, [gameState, isCurrentPlayerAI, isLoading, turnController]);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isCurrentPlayer = !currentPlayer.isAI;
  const pendingDiscard = gameState.pendingDiscard;
  const isDiscarding = Boolean(
    pendingDiscard &&
      pendingDiscard.playerIndex === gameState.currentPlayerIndex &&
      isCurrentPlayer
  );
  const disableActions = isLoading || isCurrentPlayerAI || isDiscarding;
  const disableNonEndActions = disableActions || hasPendingAction;

  useEffect(() => {
    setDiscardSelection([]);
  }, [pendingDiscard?.count, pendingDiscard?.playerIndex]);

  return (
    <div className="game-board">
      {/* Nobles Row */}
      <section className="nobles-section">
        <h2>Nobles</h2>
        <div className="nobles-grid">
          {gameState.nobles.map((noble) => (
            <NobleComponent key={noble.id} noble={noble} />
          ))}
        </div>
      </section>

      {/* Card Levels */}
      <section className="cards-section">
        {([3, 2, 1] as const).map((level) => (
          <div key={`level-${level}`} className="card-row">
            <div className="card-grid">
              {gameState.displayedCards[`level${level}` as const].map((card: any) => (
                <Card
                  key={(card as any).id}
                  card={card as any}
                  onClick={() => {
                    // Try purchase first, then reserve
                    const purchaseAction = validActions.find(
                      (a) => a.type === 'PURCHASE_CARD' && 'card' in a && (a as any).card.id === (card as any).id
                    );
                    const reserveAction = validActions.find(
                      (a) => a.type === 'RESERVE_CARD' && 'card' in a && (a as any).card.id === (card as any).id
                    );

                    if (purchaseAction && !disableNonEndActions) {
                      onAction(purchaseAction);
                    } else if (reserveAction && !disableNonEndActions && isCurrentPlayer) {
                      onAction(reserveAction);
                    }
                  }}
                  state="available"
                  isClickable={
                    !disableNonEndActions &&
                    isCurrentPlayer &&
                    validActions.some(
                      (a) =>
                        (a.type === 'PURCHASE_CARD' || a.type === 'RESERVE_CARD') &&
                        'card' in a &&
                        (a as any).card.id === (card as any).id
                    )
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Gem Pool and Actions */}
      <section className="actions-section">
        {isDiscarding && pendingDiscard && (
          <div className="discard-panel">
            <h3>Discard Tokens</h3>
            <p>You must discard {pendingDiscard.count} token(s) to end your turn.</p>
            <div className="discard-tokens">
              {(['red', 'blue', 'green', 'white', 'black', 'gold'] as const).map((color) => {
                const available = currentPlayer.gems[color] || 0;
                const selectedCount = discardSelection.filter(g => g === color).length;
                const canAdd = selectedCount < available && discardSelection.length < pendingDiscard.count;

                return (
                  <button
                    key={color}
                    className={`discard-token gem-${color}`}
                    onClick={() => {
                      if (!canAdd) return;
                      setDiscardSelection([...discardSelection, color]);
                    }}
                    disabled={!canAdd}
                    title={`${color} (${available})`}
                  >
                    {color.charAt(0).toUpperCase()} {available}
                  </button>
                );
              })}
            </div>
            {discardSelection.length > 0 && (
              <div className="discard-selection">
                {discardSelection.map((gem, idx) => (
                  <button
                    key={`${gem}-${idx}`}
                    className={`discard-chip gem-${gem}`}
                    onClick={() => {
                      const next = [...discardSelection];
                      next.splice(idx, 1);
                      setDiscardSelection(next);
                    }}
                    title="Click to remove"
                  >
                    {gem}
                  </button>
                ))}
              </div>
            )}
            <div className="discard-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!pendingDiscard) return;
                  onAction({
                    type: 'DISCARD_GEMS',
                    playerIndex: gameState.currentPlayerIndex,
                    gems: discardSelection,
                  });
                  setDiscardSelection([]);
                }}
                disabled={discardSelection.length !== pendingDiscard.count}
              >
                Discard
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setDiscardSelection([])}
                disabled={discardSelection.length === 0}
              >
                Clear
              </button>
            </div>
          </div>
        )}
        <div className="gem-pool-wrapper">
          <GemPool
            gemPool={gameState.gemPool}
            onSelectGems={(gems) => {
              const gemAction = validActions.find(
                (a) =>
                  a.type === 'TAKE_GEMS' &&
                  JSON.stringify(a.gems.sort()) === JSON.stringify(gems.sort())
              );
              if (gemAction) {
                onAction(gemAction);
              }
            }}
            disabled={disableNonEndActions}
          />
        </div>

        <ActionButtons
          validActions={validActions}
          onAction={onAction}
          disabled={disableActions}
          disableNonEndActions={disableNonEndActions}
          isAITurn={isCurrentPlayerAI}
        />
      </section>

      {/* Player Dashboards */}
      <section className="players-section">
        <h2>Players</h2>
        <div className="players-grid">
          {gameState.players.map((player, idx) => (
            <PlayerDashboard
              key={player.id}
              playerState={player}
              isCurrent={idx === gameState.currentPlayerIndex}
              reservedCards={player.reservedCards}
              purchasedCardCount={player.purchasedCards.length}
              nobles={player.nobles}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default GameBoard;
