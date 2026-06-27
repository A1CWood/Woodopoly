'use client';

import { useGameStore } from '@/lib/gameStore';
import { BOARD_SPACES } from '@/lib/boardData';
import type { Player } from '@/types/game';
import PlayerIconDisplay from './PlayerIcon';
import PropertyCard from './PropertyCard';
import MoneyPile from './MoneyPile';

interface Props {
  player: Player;
}

function GetOutOfJailCard({ count }: { count: number }) {
  return (
    <div
      className="rounded border-2 border-amber-400 flex flex-col items-center justify-center shrink-0 gap-0.5 bg-amber-50"
      style={{ width: 52, height: 72 }}
      title="Get Out of Jail Free"
    >
      <span className="text-lg">🍃</span>
      <span className="text-[6px] font-bold text-center leading-tight text-amber-800 px-0.5">
        GET OUT OF JAIL FREE
      </span>
      {count > 1 && (
        <span className="text-[8px] font-bold text-amber-600">×{count}</span>
      )}
    </div>
  );
}

export default function PlayerHand({ player }: Props) {
  const { spaceStates, currentPlayerIdx, players, phase } = useGameStore();
  const isActive = players[currentPlayerIdx]?.id === player.id && phase !== 'game_over';

  const ownedSpaces = BOARD_SPACES.filter((s) => player.propertyIds.includes(s.id));

  return (
    <div
      className={`
        flex items-center gap-3 rounded-xl px-3 py-2 border transition-all min-w-0 flex-1
        ${player.isBankrupt
          ? 'border-gray-700 bg-gray-950/50 opacity-40'
          : isActive
          ? 'border-yellow-400 bg-gray-800 shadow-lg shadow-yellow-900/30'
          : 'border-gray-700 bg-gray-900'
        }
      `}
    >
      {/* Avatar + money */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <PlayerIconDisplay icon={player.icon} color={player.color} size={36} />
        <span
          className="text-[10px] font-bold text-center truncate max-w-[52px]"
          style={{ color: player.color }}
        >
          {player.name}
        </span>
        <MoneyPile amount={player.money} compact />
        {player.inJail && (
          <span className="text-[9px] bg-red-900 text-red-200 px-1 py-0.5 rounded">JAILED</span>
        )}
        {player.isBankrupt && (
          <span className="text-[9px] bg-gray-800 text-gray-400 px-1 py-0.5 rounded">BANKRUPT</span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-gray-700 shrink-0" />

      {/* Cards */}
      <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0 py-0.5 pr-1">
        {player.getOutOfJailFreeCount > 0 && (
          <GetOutOfJailCard count={player.getOutOfJailFreeCount} />
        )}
        {ownedSpaces.length > 0 ? (
          ownedSpaces.map((space) => (
            <PropertyCard
              key={space.id}
              space={space}
              spaceState={spaceStates[space.id] ?? { ownerId: null, isMortgaged: false, houses: 0 }}
              compact
            />
          ))
        ) : (
          <span className="text-gray-600 text-xs italic self-center whitespace-nowrap">
            No properties yet
          </span>
        )}
      </div>

      {isActive && (
        <div className="shrink-0 w-1.5 self-stretch rounded-full bg-yellow-400" />
      )}
    </div>
  );
}
