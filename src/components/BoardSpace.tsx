'use client';

import type { CSSProperties } from 'react';
import type { BoardSpace, SpaceState, Player, ColorGroup } from '@/types/game';
import { COLOR_HEX } from '@/lib/boardData';
import { BoardToken } from './PlayerIcon';

type Side = 'bottom' | 'right' | 'top' | 'left' | 'corner';

interface Props {
  space: BoardSpace;
  spaceState: SpaceState;
  players: Player[];
  isHighlighted: boolean;
  side: Side;
  potAmount?: number;
  ownerColor?: string;
}

// ── Layout constants ──────────────────────────────────────────────────────────

const COLOR_BAND_POS: Record<Side, string> = {
  bottom: 'top-0 left-0 right-0 h-[20%]',
  top:    'bottom-0 left-0 right-0 h-[20%]',
  right:  'top-0 bottom-0 left-0 w-[20%]',
  left:   'top-0 bottom-0 right-0 w-[20%]',
  corner: 'hidden',
};

const TEXT_ROTATION: Record<Side, string> = {
  bottom: '',
  top:    'rotate-180',
  right:  '-rotate-90',
  left:   'rotate-90',
  corner: '',
};

// Padding pushes text away from the band (inner edge) and token (outer edge).
// Percentage-based padding in CSS is always relative to element WIDTH, so we
// use pixel values tuned to the ~53px inner cells and 70px corner cells.
const WITH_BAND_PAD: Record<Side, string> = {
  bottom: 'pt-[15px] pb-[17px] px-[3px]',
  top:    'pb-[15px] pt-[17px] px-[3px]',
  right:  'pl-[15px] pr-[17px] py-[3px]',
  left:   'pr-[15px] pl-[17px] py-[3px]',
  corner: 'p-[5px]',
};

const NO_BAND_PAD: Record<Side, string> = {
  bottom: 'pt-[4px] pb-[17px] px-[3px]',
  top:    'pb-[4px] pt-[17px] px-[3px]',
  right:  'pl-[4px] pr-[17px] py-[3px]',
  left:   'pr-[4px] pl-[17px] py-[3px]',
  corner: 'p-[5px]',
};

// Player tokens sit at the outer edge of each tile
const TOKEN_POS: Record<Side, string> = {
  bottom: 'absolute bottom-1 left-0 right-0 flex justify-center gap-px z-10',
  top:    'absolute top-1 left-0 right-0 flex justify-center gap-px z-10',
  right:  'absolute right-1 top-0 bottom-0 flex flex-col items-center justify-center gap-px z-10',
  left:   'absolute left-1 top-0 bottom-0 flex flex-col items-center justify-center gap-px z-10',
  corner: 'absolute bottom-2 right-2 flex gap-px flex-wrap justify-end z-10',
};

const BG: Record<string, string> = {
  go:              'bg-amber-100',
  go_to_jail:      'bg-red-50',
  jail:            'bg-amber-100',
  free_parking:    'bg-green-50',
  chance:          'bg-orange-50',
  community_chest: 'bg-yellow-50',
  tax:             'bg-red-50',
};

// Icon shown in the band area for non-colored tiles
const BAND_ICON: Partial<Record<string, string>> = {
  railroad:        '🚂',
  utility:         '⚙',
  chance:          '?',
  community_chest: '📦',
  tax:             '💰',
  // corners handled separately in text
  go:              '→',
  jail:            '⛓',
  free_parking:    'P',
  go_to_jail:      '⛓',
};

// ── Ownership tab ─────────────────────────────────────────────────────────────

function getTabStyle(side: Side): CSSProperties {
  const base: CSSProperties = { position: 'absolute', zIndex: 10 };
  switch (side) {
    case 'bottom': return { ...base, top: -6, left: '50%', transform: 'translateX(-50%)', width: 16, height: 6, borderRadius: '50% 50% 0 0 / 100% 100% 0 0' };
    case 'top':    return { ...base, bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 16, height: 6, borderRadius: '0 0 50% 50% / 0 0 100% 100%' };
    case 'right':  return { ...base, left: -6, top: '50%', transform: 'translateY(-50%)', width: 6, height: 16, borderRadius: '50% 0 0 50% / 50% 0 0 50%' };
    case 'left':   return { ...base, right: -6, top: '50%', transform: 'translateY(-50%)', width: 6, height: 16, borderRadius: '0 50% 50% 0 / 0 50% 50% 0' };
    default:       return { display: 'none' };
  }
}

// ── House / hotel indicators ──────────────────────────────────────────────────
// Green dot + black house SVG for each house; red dot + black hotel for hotel.

function HouseDot() {
  return (
    <div
      className="relative flex items-center justify-center rounded-full shrink-0"
      style={{ width: 7, height: 7, backgroundColor: '#16a34a' }}
    >
      <svg width="5" height="4" viewBox="0 0 10 9" aria-hidden>
        <polygon points="5,0 10,5 0,5" fill="black" />
        <rect x="2.5" y="5" width="5" height="4" fill="black" />
      </svg>
    </div>
  );
}

function HotelDot() {
  return (
    <div
      className="relative flex items-center justify-center rounded-full shrink-0"
      style={{ width: 8, height: 8, backgroundColor: '#dc2626' }}
    >
      <svg width="6" height="5" viewBox="0 0 14 10" aria-hidden>
        <polygon points="7,0 14,5 0,5" fill="black" />
        <rect x="1" y="5" width="12" height="5" fill="black" />
      </svg>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BoardSpace({ space, spaceState, players, isHighlighted, side, potAmount, ownerColor }: Props) {
  const colorStyle = space.colorGroup
    ? { backgroundColor: COLOR_HEX[space.colorGroup as ColorGroup] }
    : undefined;

  const bg = BG[space.type] ?? 'bg-amber-50';
  const houses = spaceState.houses;
  const isVertBand = side === 'right' || side === 'left';

  // Non-colored, non-corner tiles get an icon band at the same position as the color band
  const iconBandContent = !colorStyle && side !== 'corner' ? BAND_ICON[space.type] : undefined;
  const hasBand = !!colorStyle || !!iconBandContent;
  const textPad = hasBand ? WITH_BAND_PAD[side] : NO_BAND_PAD[side];

  return (
    // overflow: visible — allows the ownership tab semi-circle to protrude outward
    <div
      className={`relative w-full h-full border border-gray-600 ${bg} ${
        isHighlighted ? 'ring-2 ring-yellow-400 ring-inset' : ''
      }`}
    >
      {/* Ownership tab — semi-circle on inner edge pointing toward board center */}
      {ownerColor && side !== 'corner' && (
        <div
          style={{
            ...getTabStyle(side),
            backgroundColor: ownerColor,
            border: '1.5px solid rgba(255,255,255,0.5)',
          }}
        />
      )}

      {/* Color band — property tiles only, with house/hotel dots inside */}
      {colorStyle && (
        <div
          className={`absolute ${COLOR_BAND_POS[side]} flex items-center justify-center ${
            isVertBand ? 'flex-col gap-0.5' : 'flex-row gap-0.5'
          }`}
          style={colorStyle}
        >
          {houses === 5 && <HotelDot />}
          {houses > 0 && houses < 5 &&
            Array.from({ length: houses }).map((_, i) => <HouseDot key={i} />)
          }
        </div>
      )}

      {/* Icon band — non-colored non-corner tiles (railroads, utilities, chance, etc.) */}
      {iconBandContent && (
        <div
          className={`absolute ${COLOR_BAND_POS[side]} flex items-center justify-center bg-black/10`}
        >
          <span
            className="leading-none select-none font-bold text-gray-700"
            style={{ fontSize: space.type === 'community_chest' ? 8 : 9 }}
          >
            {iconBandContent}
          </span>
        </div>
      )}

      {/* Text content */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden ${TEXT_ROTATION[side]} ${textPad}`}
      >
        {/* For corner tiles, show the icon inside the text area (no band) */}
        {side === 'corner' && BAND_ICON[space.type] && (
          <span className="text-[10px] leading-none text-gray-500 mb-0.5 shrink-0 select-none">
            {BAND_ICON[space.type]}
          </span>
        )}

        {/* Space name */}
        <span
          className="font-bold text-center leading-tight text-gray-900 w-full shrink-0"
          style={{
            fontSize: 7,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {space.name}
        </span>

        {/* Secondary info */}
        {space.type === 'tax' && space.id === 4 && (
          <span className="leading-none shrink-0 mt-0.5" style={{ fontSize: 5, color: '#b91c1c', fontWeight: 600 }}>
            $200 or 10%
          </span>
        )}
        {space.price && (
          <span className="leading-none shrink-0 mt-0.5 text-gray-500" style={{ fontSize: 5.5 }}>
            ${space.price}
          </span>
        )}
        {space.type === 'tax' && space.id !== 4 && space.taxAmount && (
          <span className="leading-none shrink-0 mt-0.5" style={{ fontSize: 5.5, color: '#b91c1c' }}>
            ${space.taxAmount}
          </span>
        )}
        {space.type === 'free_parking' && potAmount !== undefined && potAmount > 0 && (
          <span className="leading-none shrink-0 mt-0.5 font-bold" style={{ fontSize: 5, color: '#15803d' }}>
            ${potAmount.toLocaleString()}
          </span>
        )}
      </div>

      {/* Player tokens — centered at the outer edge of the tile */}
      {players.length > 0 && (
        <div className={TOKEN_POS[side]}>
          {players.map((p) => (
            <BoardToken key={p.id} icon={p.icon} color={p.color} size={16} />
          ))}
        </div>
      )}
    </div>
  );
}
