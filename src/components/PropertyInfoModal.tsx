'use client';

import type { BoardSpace, SpaceState, ColorGroup, Player } from '@/types/game';
import { COLOR_HEX } from '@/lib/boardData';

interface Props {
  space: BoardSpace;
  spaceState: SpaceState;
  owner: Player | null;
  onClose: () => void;
}

const RENT_LABELS = ['Rent', 'With 1 House', 'With 2 Houses', 'With 3 Houses', 'With 4 Houses', 'With Hotel'];

export default function PropertyInfoModal({ space, spaceState, owner, onClose }: Props) {
  const color = space.colorGroup ? COLOR_HEX[space.colorGroup as ColorGroup] : '#374151';
  const mortgageValue = space.price ? Math.floor(space.price / 2) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width: 300, maxWidth: '90vw', backgroundColor: '#fefce8' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3" style={{ backgroundColor: color }}>
          <div className="text-white font-black text-lg text-center tracking-wide drop-shadow">
            {space.name}
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3 text-gray-800">
          {space.type === 'property' && space.rent && (
            <div className="flex flex-col gap-1 text-sm">
              {RENT_LABELS.map((label, i) => (
                <div key={label} className="flex justify-between">
                  <span className={i === 0 ? 'font-bold' : ''}>{label}</span>
                  <span className="font-mono">${space.rent![i]}</span>
                </div>
              ))}
              <p className="text-[11px] text-gray-600 italic mt-1">
                If a player owns ALL the lots of any color group, rent is doubled on unimproved lots.
              </p>
              <div className="border-t border-gray-400 my-1" />
              <div className="flex justify-between">
                <span>Houses cost</span>
                <span className="font-mono">${space.houseCost} each</span>
              </div>
              <div className="flex justify-between">
                <span>Hotels cost</span>
                <span className="font-mono">${space.houseCost} + 4 houses</span>
              </div>
            </div>
          )}

          {space.type === 'railroad' && (
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between"><span>Rent if 1 R.R. owned</span><span className="font-mono">$25</span></div>
              <div className="flex justify-between"><span>If 2 R.R.&apos;s owned</span><span className="font-mono">$50</span></div>
              <div className="flex justify-between"><span>If 3 R.R.&apos;s owned</span><span className="font-mono">$100</span></div>
              <div className="flex justify-between"><span>If 4 R.R.&apos;s owned</span><span className="font-mono">$200</span></div>
            </div>
          )}

          {space.type === 'utility' && (
            <p className="text-sm leading-relaxed">
              If one Utility is owned, rent is 4 times the amount shown on the dice.
              If both Utilities are owned, rent is 10 times the amount shown on the dice.
            </p>
          )}

          {space.price !== undefined && (
            <div className="border-t border-gray-400 pt-2 flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="font-bold">Price</span>
                <span className="font-mono">${space.price}</span>
              </div>
              <div className="flex justify-between">
                <span>Mortgage Value</span>
                <span className="font-mono">${mortgageValue}</span>
              </div>
            </div>
          )}

          {/* Current ownership state */}
          {space.price !== undefined && (
            <div className="border-t border-gray-400 pt-2 flex flex-col gap-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Owner</span>
                <span>{owner ? owner.name : 'Unowned'}</span>
              </div>
              {space.type === 'property' && (
                <div className="flex justify-between">
                  <span>Built</span>
                  <span>{spaceState.houses === 0 ? 'None' : spaceState.houses === 5 ? 'Hotel' : `${spaceState.houses} House${spaceState.houses > 1 ? 's' : ''}`}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Mortgaged</span>
                <span>{spaceState.isMortgaged ? 'Yes' : 'No'}</span>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-1 py-2.5 rounded-xl font-bold text-white text-sm transition-colors"
            style={{ backgroundColor: color }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
