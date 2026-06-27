'use client';

import { useGameStore } from '@/lib/gameStore';

export default function CardPopup() {
  const { drawnCard, players, currentPlayerIdx, confirmCard } = useGameStore();

  if (!drawnCard) return null;

  const player = players[currentPlayerIdx];
  const isChance = drawnCard.deck === 'chance';

  const headerBg = isChance ? '#f97316' : '#eab308';
  const headerText = isChance ? 'CHANCE' : 'COMMUNITY CHEST';
  const symbol = isChance ? '?' : '📦';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width: 340, maxWidth: '90vw' }}
      >
        {/* Header */}
        <div
          className="flex flex-col items-center gap-2 py-4 px-6"
          style={{ backgroundColor: headerBg }}
        >
          <span className="text-5xl">{symbol}</span>
          <span className="text-white font-black text-lg tracking-widest">{headerText}</span>
          <span className="text-white/80 text-xs">{player?.name}</span>
        </div>

        {/* Card body */}
        <div className="bg-amber-50 px-6 py-6 flex flex-col items-center gap-4">
          <p className="text-gray-800 text-base text-center leading-relaxed font-medium">
            {drawnCard.text}
          </p>

          {/* Effect tag */}
          <div className="bg-gray-100 rounded-lg px-4 py-2 text-xs text-gray-600 text-center">
            {formatActionSummary(drawnCard.action)}
          </div>

          <button
            onClick={confirmCard}
            className="w-full mt-2 py-3 rounded-xl font-bold text-white text-base transition-colors"
            style={{ backgroundColor: headerBg }}
          >
            OK, got it!
          </button>
        </div>
      </div>
    </div>
  );
}

function formatActionSummary(action: { type: string; [key: string]: unknown }): string {
  switch (action.type) {
    case 'collect': return `Collect $${action.amount}`;
    case 'pay': return `Pay $${action.amount}`;
    case 'collect_from_each': return `Collect $${action.amount} from each player`;
    case 'pay_each': return `Pay $${action.amount} to each player`;
    case 'get_out_of_jail_free': return `Keep this Get Out of Jail Free card`;
    case 'go_to_jail': return `Go directly to Jail`;
    case 'go_back': return `Go back ${action.spaces} spaces`;
    case 'advance_to': return `Advance to board space ${action.position}`;
    case 'advance_to_nearest': return `Advance to nearest ${action.propertyType}`;
    case 'repairs': return `Pay $${action.houseAmount}/cabin and $${action.hotelAmount}/lodge`;
    default: return '';
  }
}
