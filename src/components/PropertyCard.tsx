'use client';

import type { BoardSpace, SpaceState, ColorGroup } from '@/types/game';
import { COLOR_HEX } from '@/lib/boardData';

interface Props {
  space: BoardSpace;
  spaceState: SpaceState;
  compact?: boolean;
}

const HOUSE_ICONS = ['', '🏠', '🏠🏠', '🏠🏠🏠', '🏠🏠🏠🏠', '🏨'];

export default function PropertyCard({ space, spaceState, compact = false }: Props) {
  const color = space.colorGroup ? COLOR_HEX[space.colorGroup as ColorGroup] : '#6b7280';
  const isRailroad = space.type === 'railroad';
  const isUtility = space.type === 'utility';
  const houses = spaceState.houses;

  if (compact) {
    return (
      <div
        className="relative rounded border border-gray-600 flex flex-col overflow-hidden shrink-0"
        style={{ width: 52, height: 72, backgroundColor: '#fefce8' }}
        title={`${space.name}${houses > 0 ? ` (${houses === 5 ? 'Hotel' : `${houses}H`})` : ''}`}
      >
        {/* Color band */}
        <div className="w-full shrink-0" style={{ height: 14, backgroundColor: color }} />
        {/* Name */}
        <div className="flex-1 flex flex-col items-center justify-center px-0.5 gap-0.5">
          <span className="text-[6px] font-bold text-center leading-tight text-gray-800 break-words">
            {isRailroad ? '🚂' : isUtility ? '⚙️' : ''} {space.name}
          </span>
          {space.price && (
            <span className="text-[6px] text-gray-500">${space.price}</span>
          )}
        </div>
        {/* Houses indicator */}
        {houses > 0 && (
          <div className="text-[7px] text-center pb-0.5 leading-none">
            {houses === 5 ? '🏨' : '🏠'.repeat(houses)}
          </div>
        )}
        {/* Mortgaged overlay */}
        {spaceState.isMortgaged && (
          <div className="absolute inset-0 bg-gray-500/70 flex items-center justify-center">
            <span className="text-[7px] text-white font-bold rotate-[-15deg]">MORT.</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative rounded-lg border border-gray-600 flex flex-col overflow-hidden shrink-0"
      style={{ width: 70, height: 95, backgroundColor: '#fefce8' }}
    >
      <div className="w-full shrink-0" style={{ height: 18, backgroundColor: color }} />
      <div className="flex-1 flex flex-col items-center justify-center px-1 gap-0.5">
        <span className="text-[7.5px] font-bold text-center leading-tight text-gray-800">
          {space.name}
        </span>
        {space.price && <span className="text-[7px] text-gray-500">${space.price}</span>}
      </div>
      {houses > 0 && (
        <div className="text-[9px] text-center pb-1 leading-none">{HOUSE_ICONS[houses]}</div>
      )}
      {spaceState.isMortgaged && (
        <div className="absolute inset-0 bg-gray-500/70 flex items-center justify-center">
          <span className="text-[9px] text-white font-bold rotate-[-15deg]">MORTGAGED</span>
        </div>
      )}
    </div>
  );
}
