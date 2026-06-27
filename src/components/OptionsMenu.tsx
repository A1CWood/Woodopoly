'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/gameStore';

export default function OptionsMenu() {
  const [open, setOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const resetGame = useGameStore((s) => s.resetGame);
  const router = useRouter();

  const handleEndGame = () => {
    resetGame();
    router.push('/');
  };

  const handleOpen = () => {
    setOpen(true);
    setConfirmEnd(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed top-3 right-3 z-40 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-600 transition-colors shadow-lg"
        title="Options"
      >
        ⚙ Options
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-72 shadow-2xl flex flex-col gap-4">
            <h2 className="text-white font-black text-lg text-center tracking-wide">Options</h2>

            {!confirmEnd ? (
              <>
                <button
                  onClick={() => setConfirmEnd(true)}
                  className="bg-red-800 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  End Game
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Resume Game
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-300 text-sm text-center leading-relaxed">
                  Are you sure? All progress will be lost.
                </p>
                <button
                  onClick={handleEndGame}
                  className="bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Yes, End Game
                </button>
                <button
                  onClick={() => setConfirmEnd(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
