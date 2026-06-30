'use client';

import { useRef } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { BOARD_SPACES, COLOR_GROUPS, COLOR_HEX } from '@/lib/boardData';
import type { ColorGroup } from '@/types/game';

export default function AuctionModal() {
  const {
    phase, pendingAuction, players, spaceStates, myPlayerId,
    placeBid, passBid, settleAuctionMortgage, settleAuctionSellHouse, settleAuctionBankruptcy,
  } = useGameStore();

  const bidInputRef = useRef<HTMLInputElement>(null);

  if (phase !== 'auction' || !pendingAuction) return null;

  const space = BOARD_SPACES[pendingAuction.spaceId];
  const color = space.colorGroup ? COLOR_HEX[space.colorGroup as ColorGroup] : '#6b7280';
  const highBidder = players.find((p) => p.id === pendingAuction.highBidderId);

  if (pendingAuction.settlingDebt && pendingAuction.winnerId) {
    const winner = players.find((p) => p.id === pendingAuction.winnerId);
    if (!winner) return null;
    const canAct = !myPlayerId || myPlayerId === winner.id;
    const shortfall = Math.abs(winner.money);

    const mortgageable = winner.propertyIds.filter((id) => {
      const ss = spaceStates[id];
      if (!ss || ss.isMortgaged) return false;
      const sp = BOARD_SPACES[id];
      if (sp.colorGroup) {
        const group = COLOR_GROUPS[sp.colorGroup as ColorGroup];
        if (group.some((gid) => (spaceStates[gid]?.houses ?? 0) > 0)) return false;
      }
      return (sp.price ?? 0) > 0;
    });

    const sellableHouses = winner.propertyIds.filter((id) => {
      const sp = BOARD_SPACES[id];
      if (!sp.colorGroup || sp.type !== 'property') return false;
      const h = spaceStates[id]?.houses ?? 0;
      if (h === 0) return false;
      const group = COLOR_GROUPS[sp.colorGroup as ColorGroup];
      const maxInGroup = Math.max(...group.map((gid) => spaceStates[gid].houses));
      return h >= maxInGroup;
    });

    const canRaiseMoney = mortgageable.length > 0 || sellableHouses.length > 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-gray-900 border border-red-800 rounded-2xl shadow-2xl w-[380px] max-w-[90vw] flex flex-col overflow-hidden">
          <div className="px-5 py-4 bg-red-950 border-b border-red-800">
            <h2 className="text-white font-black text-base">⚠ Cover the Winning Bid</h2>
            <p className="text-red-300 text-xs mt-1">
              {winner.name} won {space.name} for ${pendingAuction.currentBid} but is short ${shortfall}.
            </p>
          </div>
          <div className="p-4 flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
            {!canAct && (
              <div className="text-gray-500 text-xs italic text-center py-2">
                Waiting for {winner.name} to raise funds…
              </div>
            )}
            {canAct && mortgageable.map((id) => {
              const sp = BOARD_SPACES[id];
              const value = Math.floor((sp.price ?? 0) / 2);
              return (
                <button
                  key={id}
                  onClick={() => settleAuctionMortgage(id)}
                  className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 text-left"
                >
                  <span className="text-gray-200 text-xs truncate">{sp.name}</span>
                  <span className="text-green-400 text-xs font-bold shrink-0 ml-2">Mortgage +${value}</span>
                </button>
              );
            })}
            {canAct && sellableHouses.map((id) => {
              const sp = BOARD_SPACES[id];
              const h = spaceStates[id].houses;
              const sellPrice = Math.floor((sp.houseCost ?? 0) / 2);
              return (
                <button
                  key={`sell-${id}`}
                  onClick={() => settleAuctionSellHouse(id)}
                  className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 text-left"
                >
                  <span className="text-gray-200 text-xs truncate">{sp.name} ({h === 5 ? 'Hotel' : `${h}H`})</span>
                  <span className="text-yellow-400 text-xs font-bold shrink-0 ml-2">Sell house +${sellPrice}</span>
                </button>
              );
            })}
            {canAct && !canRaiseMoney && (
              <div className="text-gray-400 text-xs text-center py-2">No assets remain to raise funds.</div>
            )}
            {canAct && (
              <button
                onClick={settleAuctionBankruptcy}
                className="mt-1 bg-red-900 hover:bg-red-800 text-white font-bold py-2.5 rounded-lg text-sm"
              >
                Declare Bankruptcy
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const activeBidder = players.find((p) => p.id === pendingAuction.activeBidderId);
  const canAct = !!activeBidder && (!myPlayerId || myPlayerId === activeBidder.id);
  const minBid = pendingAuction.currentBid + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[360px] max-w-[90vw] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700" style={{ backgroundColor: color }}>
          <h2 className="text-white font-black text-base drop-shadow">🔨 Auction: {space.name}</h2>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
            <span className="text-gray-400 text-xs">Current bid</span>
            <span className="text-yellow-400 font-mono font-bold text-lg">
              ${pendingAuction.currentBid}
            </span>
          </div>
          <div className="text-gray-400 text-xs text-center">
            {highBidder ? `High bidder: ${highBidder.name}` : 'No bids yet'}
          </div>

          {activeBidder && (
            <div className="text-center text-sm">
              <span className="text-white font-bold">{activeBidder.name}</span>
              <span className="text-gray-400">&apos;s turn to bid</span>
            </div>
          )}

          {canAct ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  key={pendingAuction.activeBidderId}
                  ref={bidInputRef}
                  type="number"
                  min={minBid}
                  defaultValue={minBid}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                />
                <button
                  onClick={() => {
                    const amt = parseInt(bidInputRef.current?.value ?? '', 10);
                    if (Number.isFinite(amt)) placeBid(amt);
                  }}
                  className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-bold px-4 py-2 rounded-lg text-sm"
                >
                  Bid
                </button>
              </div>
              <button
                onClick={passBid}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg text-sm"
              >
                Pass
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-xs italic text-center py-1">
              Waiting for {activeBidder?.name ?? '…'} to act…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
