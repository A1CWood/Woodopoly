'use client';

interface Props {
  type: 'chance' | 'community_chest';
}

export default function CardStack({ type }: Props) {
  const isChance = type === 'chance';
  const bg = isChance ? '#f97316' : '#eab308';
  const label = isChance ? 'CHANCE' : 'COMMUNITY CHEST';
  const symbol = isChance ? '?' : '📦';

  const layers = [3, 2, 1, 0];

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="relative" style={{ width: 44, height: 60 }}>
        {layers.map((offset) => (
          <div
            key={offset}
            className="absolute rounded border border-white/30"
            style={{
              width: 40,
              height: 56,
              backgroundColor: bg,
              bottom: offset * 2,
              left: offset * 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
              opacity: offset === 0 ? 1 : 0.7 - offset * 0.1,
            }}
          />
        ))}
        {/* Top card face */}
        <div
          className="absolute rounded border border-white/50 flex flex-col items-center justify-center gap-0.5"
          style={{ width: 40, height: 56, backgroundColor: bg, bottom: 6, left: 3 }}
        >
          <span className="text-white font-black" style={{ fontSize: 20 }}>{symbol}</span>
          <span className="text-white font-bold text-center leading-tight" style={{ fontSize: 5 }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
