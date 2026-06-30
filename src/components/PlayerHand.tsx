'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { BOARD_SPACES, COLOR_GROUPS } from '@/lib/boardData';
import type { Player, ColorGroup } from '@/types/game';
import PlayerIconDisplay from './PlayerIcon';
import PropertyCard from './PropertyCard';
import MoneyPile from './MoneyPile';
import PropertyInfoModal from './PropertyInfoModal';

interface Props {
  player: Player;
}

function GetOutOfJailCard({ count }: { count: number }) {
  return (
    <div
      className="rounded border-2 border-amber-400 flex flex-col items-center justify-center shrink-0 gap-0.5 bg-amber-50"
      style={{ width: 66, height: 92 }}
      title="Get Out of Jail Free"
    >
      <span className="text-xl">🍃</span>
      <span className="text-[7px] font-bold text-center leading-tight text-amber-800 px-0.5">
        GET OUT OF JAIL FREE
      </span>
      {count > 1 && (
        <span className="text-[9px] font-bold text-amber-600">×{count}</span>
      )}
    </div>
  );
}

export default function PlayerHand({ player }: Props) {
  const {
    spaceStates, currentPlayerIdx, players, phase,
    mortgageProperty, unmortgageProperty,
  } = useGameStore();
  const isActive = players[currentPlayerIdx]?.id === player.id && phase !== 'game_over';
  const canInteract = isActive && (phase === 'pre_roll' || phase === 'post_roll');

  const [infoSpaceId, setInfoSpaceId] = useState<number | null>(null);

  const ownedSpaces = BOARD_SPACES.filter((s) => player.propertyIds.includes(s.id));
  const infoSpace = infoSpaceId !== null ? BOARD_SPACES[infoSpaceId] : null;
  const infoSpaceState = infoSpaceId !== null ? spaceStates[infoSpaceId] : null;
  const infoOwner = infoSpaceState?.ownerId
    ? players.find((p) => p.id === infoSpaceState.ownerId) ?? null
    : null;

  return (
    <div
      className={`
        flex items-center gap-4 rounded-xl px-4 py-3 border transition-all min-w-0 w-[330px]
        ${player.isBankrupt
          ? 'border-gray-700 bg-gray-950/50 opacity-40'
          : isActive
          ? 'border-yellow-400 bg-gray-800 shadow-lg shadow-yellow-900/30'
          : 'border-gray-700 bg-gray-900'
        }
      `}
    >
      {/* Avatar + money */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <PlayerIconDisplay icon={player.icon} color={player.color} size={48} />
        <span
          className="text-xs font-bold text-center truncate max-w-[68px]"
          style={{ color: player.color }}
        >
          {player.name}
        </span>
        <MoneyPile amount={player.money} compact />
        {player.inJail && (
          <span className="text-[10px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded">JAILED</span>
        )}
        {player.isBankrupt && (
          <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">BANKRUPT</span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-gray-700 shrink-0" />

      {/* Cards */}
      <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0 py-0.5 pr-1">
        {player.getOutOfJailFreeCount > 0 && (
          <GetOutOfJailCard count={player.getOutOfJailFreeCount} />
        )}
        {ownedSpaces.length > 0 ? (
          ownedSpaces.map((space) => {
            const ss = spaceStates[space.id] ?? { ownerId: null, isMortgaged: false, houses: 0 };
            const price = space.price ?? 0;
            const mortgageValue = Math.floor(price / 2);
            const unmortgageCost = mortgageValue;

            // Can't mortgage if any property in the group has houses
            const hasHousesInGroup = space.colorGroup
              ? COLOR_GROUPS[space.colorGroup as ColorGroup].some(
                  (id) => (spaceStates[id]?.houses ?? 0) > 0
                )
              : false;

            const showOverlay = canInteract && mortgageValue > 0;

            return (
              <div key={space.id} className="relative group shrink-0">
                <PropertyCard space={space} spaceState={ss} compact />

                {/* Info button — available for any player's cards, any time */}
                <button
                  onClick={() => setInfoSpaceId(space.id)}
                  title="Property info"
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-gray-900/80 hover:bg-gray-700 text-white text-[9px] font-bold flex items-center justify-center z-30 leading-none"
                >
                  i
                </button>

                {showOverlay && (
                  <div className="absolute inset-0 rounded bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 pointer-events-none group-hover:pointer-events-auto z-20">
                    {!ss.isMortgaged ? (
                      <>
                        <span className="text-[7px] text-gray-300 leading-none">Mortgage</span>
                        <span className="text-[9px] text-green-400 font-bold leading-none">
                          +${mortgageValue}
                        </span>
                        {hasHousesInGroup ? (
                          <span className="text-[6px] text-yellow-400 text-center px-1 leading-tight">
                            Sell houses first
                          </span>
                        ) : (
                          <button
                            onClick={() => mortgageProperty(space.id)}
                            className="mt-0.5 bg-green-700 hover:bg-green-600 active:bg-green-800 text-white text-[7px] font-bold px-2 py-0.5 rounded"
                          >
                            Mortgage
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-[7px] text-gray-300 leading-none">Unmortgage</span>
                        <span className="text-[9px] text-yellow-400 font-bold leading-none">
                          −${unmortgageCost}
                        </span>
                        <button
                          onClick={() => unmortgageProperty(space.id)}
                          disabled={player.money < unmortgageCost}
                          className="mt-0.5 bg-yellow-700 hover:bg-yellow-600 active:bg-yellow-800 disabled:bg-gray-700 disabled:text-gray-500 text-white text-[7px] font-bold px-2 py-0.5 rounded"
                        >
                          Lift
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <span className="text-gray-600 text-xs italic self-center whitespace-nowrap">
            No properties yet
          </span>
        )}
      </div>

      {isActive && (
        <div className="shrink-0 w-1.5 self-stretch rounded-full bg-yellow-400" />
      )}

      {infoSpace && infoSpaceState && (
        <PropertyInfoModal
          space={infoSpace}
          spaceState={infoSpaceState}
          owner={infoOwner}
          onClose={() => setInfoSpaceId(null)}
        />
      )}
    </div>
  );
}
