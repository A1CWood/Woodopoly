'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/gameStore';
import { PLAYER_COLORS, PLAYER_ICONS, ICON_EMOJI, type PlayerColor, type PlayerIcon } from '@/types/game';

const DEFAULT_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6'];

const COLOR_LABELS: Record<PlayerColor, string> = {
  '#EF4444': 'Red',
  '#3B82F6': 'Blue',
  '#22C55E': 'Green',
  '#EAB308': 'Yellow',
  '#A855F7': 'Purple',
  '#F97316': 'Orange',
};

export default function GameSetup() {
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState<string[]>([...DEFAULT_NAMES]);
  const [colors, setColors] = useState<PlayerColor[]>([...PLAYER_COLORS]);
  const [icons, setIcons] = useState<PlayerIcon[]>([...PLAYER_ICONS]);

  const startGame = useGameStore((s) => s.startGame);
  const router = useRouter();

  const handleStart = () => {
    const setups = Array.from({ length: playerCount }, (_, i) => ({
      name: names[i].trim() || DEFAULT_NAMES[i],
      color: colors[i],
      icon: icons[i],
    }));
    startGame(setups);
    router.push('/game');
  };

  const setColor = (playerIdx: number, color: PlayerColor) => {
    setColors((prev) => {
      const next = [...prev];
      const swapIdx = next.indexOf(color);
      if (swapIdx !== -1 && swapIdx !== playerIdx) next[swapIdx] = next[playerIdx];
      next[playerIdx] = color;
      return next;
    });
  };

  const setIcon = (playerIdx: number, icon: PlayerIcon) => {
    setIcons((prev) => {
      const next = [...prev];
      const swapIdx = next.indexOf(icon);
      if (swapIdx !== -1 && swapIdx !== playerIdx) next[swapIdx] = next[playerIdx];
      next[playerIdx] = icon;
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-green-400 tracking-widest">WOODOPOLY</h1>
          <p className="text-gray-500 text-sm mt-1">The Board Game</p>
        </div>

        {/* Player count */}
        <div className="mb-6">
          <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
            Number of Players
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                  playerCount === n
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Player rows */}
        <div className="flex flex-col gap-4 mb-8">
          {Array.from({ length: playerCount }, (_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-3 flex flex-col gap-2">
              {/* Name */}
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: colors[i] }}
                />
                <input
                  type="text"
                  value={names[i]}
                  onChange={(e) => {
                    const next = [...names];
                    next[i] = e.target.value;
                    setNames(next);
                  }}
                  placeholder={DEFAULT_NAMES[i]}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Color picker */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs w-10">Color</span>
                <div className="flex gap-1.5 flex-wrap">
                  {PLAYER_COLORS.map((c) => {
                    const usedByOther = colors.indexOf(c) !== i && colors.slice(0, playerCount).includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => setColor(i, c)}
                        title={COLOR_LABELS[c]}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          colors[i] === c
                            ? 'border-white scale-110 shadow-lg'
                            : usedByOther
                            ? 'border-gray-700 opacity-25 cursor-not-allowed'
                            : 'border-gray-600 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Icon picker */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs w-10">Token</span>
                <div className="flex gap-1.5 flex-wrap">
                  {PLAYER_ICONS.map((ic) => {
                    const usedByOther = icons.indexOf(ic) !== i && icons.slice(0, playerCount).includes(ic);
                    return (
                      <button
                        key={ic}
                        onClick={() => setIcon(i, ic)}
                        title={ic}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-base transition-all ${
                          icons[i] === ic
                            ? 'border-white scale-110 shadow-lg bg-gray-600'
                            : usedByOther
                            ? 'border-gray-700 opacity-25 cursor-not-allowed bg-gray-800'
                            : 'border-gray-600 hover:border-gray-400 bg-gray-700'
                        }`}
                      >
                        {ICON_EMOJI[ic]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-2 pt-1">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-sm shadow"
                  style={{ backgroundColor: colors[i] }}
                >
                  {ICON_EMOJI[icons[i]]}
                </div>
                <span className="text-gray-400 text-xs">
                  {names[i] || DEFAULT_NAMES[i]}'s token preview
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold py-3 rounded-xl text-lg transition-colors"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
