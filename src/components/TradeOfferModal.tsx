'use client';

import { useGameStore } from '@/lib/gameStore';
import { BOARD_SPACES, COLOR_HEX } from '@/lib/boardData';
import type { ColorGroup } from '@/types/game';

function PropLabel({ spaceId }: { spaceId: number }) {
  const space = BOARD_SPACES[spaceId];
  const color = space.colorGroup ? COLOR_HEX[space.colorGroup as ColorGroup] : '#6b7280';
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-gray-200 bg-gray-700 rounded px-1.5 py-0.5">
      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
      {space.name}
    </span>
  );
}

function TradeSide({
  label,
  propIds,
  cash,
  jailCards,
}: {
  label: string;
  propIds: number[];
  cash: number;
  jailCards: number;
}) {
  const isEmpty = propIds.length === 0 && cash === 0 && jailCards === 0;
  return (
    <div className="flex-1 bg-gray-800 rounded-xl p-3 flex flex-col gap-2 min-w-0">
      <div className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">{label}</div>
      {isEmpty ? (
        <span className="text-gray-600 text-xs italic">Nothing</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {propIds.map((id) => <PropLabel key={id} spaceId={id} />)}
          {cash > 0 && (
            <span className="text-[10px] text-green-400 bg-gray-700 rounded px-1.5 py-0.5">
              ${cash.toLocaleString()} cash
            </span>
          )}
          {jailCards > 0 && (
            <span className="text-[10px] text-amber-400 bg-gray-700 rounded px-1.5 py-0.5">
              🍃×{jailCards}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function TradeOfferModal() {
  const {
    pendingTrade, players, currentPlayerIdx, phase,
    acceptTrade, declineTrade,
  } = useGameStore();

  const current = players[currentPlayerIdx];
  if (
    !pendingTrade ||
    !current ||
    pendingTrade.toPlayerId !== current.id ||
    phase !== 'pre_roll'
  ) return null;

  const fromPlayer = players.find((p) => p.id === pendingTrade.fromPlayerId);
  if (!fromPlayer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[440px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded-full border-2 border-white/60 shrink-0"
              style={{ backgroundColor: fromPlayer.color }}
            />
            <h2 className="text-white font-black text-base leading-tight">
              {fromPlayer.name} is offering a trade!
            </h2>
          </div>
        </div>

        {/* Trade details */}
        <div className="p-5 flex flex-col gap-4">
          <div className="flex gap-3 items-start">
            <TradeSide
              label={`${fromPlayer.name} offers`}
              propIds={pendingTrade.offer.propertyIds}
              cash={pendingTrade.offer.cash}
              jailCards={pendingTrade.offer.jailFreeCards}
            />
            <div className="flex items-center self-center text-gray-500 font-black text-lg shrink-0 pt-4">
              ⇄
            </div>
            <TradeSide
              label={`${fromPlayer.name} wants`}
              propIds={pendingTrade.request.propertyIds}
              cash={pendingTrade.request.cash}
              jailCards={pendingTrade.request.jailFreeCards}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={declineTrade}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
            >
              Decline
            </button>
            <button
              onClick={acceptTrade}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
            >
              Accept Trade ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
