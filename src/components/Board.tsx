'use client';

import { useGameStore } from '@/lib/gameStore';
import { BOARD_SPACES } from '@/lib/boardData';
import BoardSpace from './BoardSpace';
import CardStack from './CardStack';

type Side = 'bottom' | 'right' | 'top' | 'left' | 'corner';

function getGridPos(idx: number): { row: number; col: number } {
  if (idx === 0) return { row: 11, col: 1 };
  if (idx >= 1 && idx <= 9) return { row: 11, col: idx + 1 };
  if (idx === 10) return { row: 11, col: 11 };
  if (idx >= 11 && idx <= 19) return { row: 11 - (idx - 10), col: 11 };
  if (idx === 20) return { row: 1, col: 11 };
  if (idx >= 21 && idx <= 29) return { row: 1, col: 31 - idx };
  if (idx === 30) return { row: 1, col: 1 };
  if (idx >= 31 && idx <= 39) return { row: idx - 29, col: 1 };
  return { row: 1, col: 1 };
}

function getSide(idx: number): Side {
  if ([0, 10, 20, 30].includes(idx)) return 'corner';
  if (idx >= 1 && idx <= 9) return 'bottom';
  if (idx >= 11 && idx <= 19) return 'right';
  if (idx >= 21 && idx <= 29) return 'top';
  return 'left';
}

export default function Board() {
  const { spaceStates, players, pendingPurchaseId, freeParkingPot } = useGameStore();

  if (!spaceStates.length) return null;

  return (
    <div
      className="border-2 border-gray-800 shadow-2xl"
      style={{
        display: 'grid',
        gridTemplateColumns: '70px repeat(9, 1fr) 70px',
        gridTemplateRows: '70px repeat(9, 1fr) 70px',
        width: '100%',
        maxWidth: '620px',
        aspectRatio: '1 / 1',
        backgroundColor: '#166534',
      }}
    >
      {/* Board center */}
      <div
        style={{ gridColumn: '2 / 11', gridRow: '2 / 11' }}
        className="flex flex-col items-center justify-between py-6 px-4 select-none overflow-hidden"
      >
        {/* Card stacks */}
        <div className="flex justify-between w-full">
          <CardStack type="community_chest" />
          <CardStack type="chance" />
        </div>

        {/* Title */}
        <div
          className="text-green-200 font-black text-center leading-none"
          style={{ transform: 'rotate(-30deg)' }}
        >
          <div className="text-3xl tracking-widest drop-shadow-lg">WOODOPOLY</div>
          <div className="text-xs tracking-widest mt-1 font-normal opacity-60">THE BOARD GAME</div>
        </div>

        {/* Pot display in center */}
        {freeParkingPot > 0 && (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-green-300 font-bold opacity-80">Free Parking Pot</span>
            <span className="text-green-200 font-black text-lg">${freeParkingPot.toLocaleString()}</span>
          </div>
        )}
        {freeParkingPot === 0 && <div />}
      </div>

      {/* All 40 spaces */}
      {BOARD_SPACES.map((space) => {
        const pos = getGridPos(space.id);
        const playersHere = players.filter((p) => p.position === space.id && !p.isBankrupt);
        const ownerColor = spaceStates[space.id].ownerId
          ? players.find((p) => p.id === spaceStates[space.id].ownerId)?.color
          : undefined;
        return (
          <div key={space.id} style={{ gridRow: pos.row, gridColumn: pos.col }}>
            <BoardSpace
              space={space}
              spaceState={spaceStates[space.id]}
              players={playersHere}
              isHighlighted={pendingPurchaseId === space.id}
              side={getSide(space.id)}
              potAmount={space.id === 20 ? freeParkingPot : undefined}
              ownerColor={ownerColor}
            />
          </div>
        );
      })}
    </div>
  );
}
