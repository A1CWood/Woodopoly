'use client';

import type { PlayerIcon, PlayerColor } from '@/types/game';
import { ICON_EMOJI } from '@/types/game';

interface Props {
  icon: PlayerIcon;
  color: PlayerColor;
  size?: number;
  showBackground?: boolean;
}

export default function PlayerIconDisplay({ icon, color, size = 32, showBackground = true }: Props) {
  const fontSize = Math.round(size * 0.55);

  return (
    <div
      className="flex items-center justify-center rounded-full border-2 border-white shadow-md shrink-0 select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: showBackground ? color : 'transparent',
        borderColor: color,
        fontSize,
        lineHeight: 1,
      }}
    >
      {ICON_EMOJI[icon]}
    </div>
  );
}

/** Tiny board-space token version */
export function BoardToken({ icon, color, size = 14 }: { icon: PlayerIcon; color: PlayerColor; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full border border-white/80 shadow shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: Math.round(size * 0.57), lineHeight: 1 }}
      title={icon}
    >
      {ICON_EMOJI[icon]}
    </div>
  );
}
