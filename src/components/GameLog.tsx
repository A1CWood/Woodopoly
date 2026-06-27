'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/gameStore';

export default function GameLog() {
  const log = useGameStore((s) => s.log);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 flex flex-col flex-1 min-h-0">
      <h2 className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-2 shrink-0">
        Game Log
      </h2>
      <div className="overflow-y-auto flex-1 flex flex-col gap-0.5 text-xs pr-1">
        {log.map((entry, i) => {
          const isTurnMarker = entry.startsWith('---');
          const isWin = entry.startsWith('🏆');
          return (
            <div
              key={i}
              className={`leading-snug ${
                isTurnMarker
                  ? 'text-yellow-400 font-semibold mt-1'
                  : isWin
                  ? 'text-green-400 font-bold'
                  : 'text-gray-400'
              }`}
            >
              {entry}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
