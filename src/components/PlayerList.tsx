'use client';

import { useGameStore } from '@/lib/gameStore';
import { BOARD_SPACES } from '@/lib/boardData';
import { COLOR_HEX } from '@/lib/boardData';
import type { ColorGroup } from '@/types/game';

export default function PlayerList() {
  const { players, currentPlayerIdx, spaceStates, phase } = useGameStore();

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
      <h2 className="text-gray-300 text-xs font-bold uppercase tracking-wider">Players</h2>
      {players.map((player, idx) => {
        const isCurrent = idx === currentPlayerIdx && phase !== 'game_over';
        const ownedSpaces = BOARD_SPACES.filter((s) =>
          spaceStates.length > 0 && spaceStates[s.id]?.ownerId === player.id
        );

        return (
          <div
            key={player.id}
            className={`rounded-lg p-2.5 border transition-colors ${
              isCurrent
                ? 'border-yellow-500 bg-gray-800'
                : player.isBankrupt
                ? 'border-gray-700 bg-gray-950 opacity-50'
                : 'border-gray-700 bg-gray-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-white shrink-0"
                style={{ backgroundColor: player.color }}
              />
              <span className="text-white text-sm font-semibold truncate">{player.name}</span>
              {isCurrent && (
                <span className="ml-auto text-yellow-400 text-xs shrink-0">▶ turn</span>
              )}
              {player.isBankrupt && (
                <span className="ml-auto text-red-400 text-xs shrink-0">bankrupt</span>
              )}
              {player.inJail && (
                <span className="ml-auto text-orange-400 text-xs shrink-0">jailed</span>
              )}
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-green-400 font-mono text-xs">
                ${player.money.toLocaleString()}
              </span>
              <span className="text-gray-500 text-xs">
                {BOARD_SPACES[player.position]?.name ?? ''}
              </span>
            </div>

            {/* Owned properties as colored dots */}
            {ownedSpaces.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {ownedSpaces.map((s) => (
                  <div
                    key={s.id}
                    className="w-2.5 h-2.5 rounded-sm border border-gray-600"
                    style={{
                      backgroundColor: s.colorGroup
                        ? COLOR_HEX[s.colorGroup as ColorGroup]
                        : '#6b7280',
                    }}
                    title={s.name}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
