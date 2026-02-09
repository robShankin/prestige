/**
 * GameBoard component - main game layout with nobles, cards, gem pool, and players
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo } from 'react';
import type { GameState, GameAction } from '../types';
import { TurnController } from '../game/turnController';
import Card from './Card';
import GemPool from './GemPool';
import PlayerDashboard from './PlayerDashboard';
import ActionButtons from './ActionButtons';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  onAction: (action: GameAction) => Promise<void>;
  isLoading: boolean;
  isCurrentPlayerAI: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onAction, isLoading, isCurrentPlayerAI }) => {
  const turnController = useMemo(() => new TurnController(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_state, _action) => _state,
    new Map()
  ), []);

  const validActions = useMemo(() => {
    if (isCurrentPlayerAI || isLoading) return [];
    return turnController.getValidActions(gameState, gameState.currentPlayerIndex);
  }, [gameState, isCurrentPlayerAI, isLoading, turnController]);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isCurrentPlayer = !currentPlayer.isAI;

  return (
    <div className="game-board">
      {/* Nobles Row */}
      <section className="nobles-section">
        <h2>Nobles</h2>
        <div className="nobles-grid">
          {gameState.nobles.map((noble) => (
            <div key={noble.id} className="noble-card">
              <div className="noble-points">{noble.points}</div>
              <div className="noble-requirement">
                {Object.entries(noble.requirement)
                  .filter(([, count]) => (count || 0) > 0)
                  .map(([color, count]) => (
                    <div key={color} className={`gem-req gem-${color}`}>
                      {count || 0}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Card Levels */}
      <section className="cards-section">
        {([3, 2, 1] as const).map((level) => (
          <div key={`level-${level}`} className="card-level">
            <h3>Level {level}</h3>
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

                    if (purchaseAction) {
                      onAction(purchaseAction);
                    } else if (reserveAction && !isLoading && isCurrentPlayer) {
                      onAction(reserveAction);
                    }
                  }}
                  state="available"
                  isClickable={
                    !isLoading &&
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
            disabled={isLoading || isCurrentPlayerAI}
          />
        </div>

        <ActionButtons
          validActions={validActions}
          onAction={onAction}
          disabled={isLoading || isCurrentPlayerAI}
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
