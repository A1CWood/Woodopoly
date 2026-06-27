'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { BOARD_SPACES, COLOR_GROUPS, COLOR_HEX } from '@/lib/boardData';
import type { ColorGroup } from '@/types/game';

function isTradeable(spaceId: number, spaceStates: { houses: number }[]): boolean {
  const space = BOARD_SPACES[spaceId];
  if (!space.colorGroup) return true;
  const group = COLOR_GROUPS[space.colorGroup as ColorGroup];
  return !group.some((id) => (spaceStates[id]?.houses ?? 0) > 0);
}

function PropCard({
  spaceId,
  selected,
  onClick,
}: {
  spaceId: number;
  selected: boolean;
  onClick: () => void;
}) {
  const space = BOARD_SPACES[spaceId];
  const color = space.colorGroup ? COLOR_HEX[space.colorGroup as ColorGroup] : '#6b7280';
  return (
    <button
      onClick={onClick}
      title={space.name}
      className={`relative rounded border-2 flex flex-col overflow-hidden shrink-0 transition-all ${
        selected
          ? 'border-yellow-400 shadow-md shadow-yellow-400/40'
          : 'border-gray-600 hover:border-gray-400'
      }`}
      style={{ width: 52, height: 72, backgroundColor: '#fefce8' }}
    >
      <div className="w-full shrink-0" style={{ height: 14, backgroundColor: color }} />
      <div className="flex-1 flex flex-col items-center justify-center px-0.5 gap-0.5">
        <span className="text-[5.5px] font-bold text-center leading-tight text-gray-800 break-words">
          {space.name}
        </span>
        {space.price && (
          <span className="text-[5px] text-gray-500">${space.price}</span>
        )}
      </div>
      {selected && (
        <div
          className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-yellow-400 rounded-full flex items-center justify-center"
          aria-hidden
        >
          <span style={{ fontSize: 8, color: '#111', fontWeight: 900, lineHeight: 1 }}>✓</span>
        </div>
      )}
    </button>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TradeWindow({ open, onClose }: Props) {
  const { players, currentPlayerIdx, spaceStates, proposeTrade } = useGameStore();
  const me = players[currentPlayerIdx];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [offerPropIds, setOfferPropIds] = useState<number[]>([]);
  const [offerCash, setOfferCash] = useState('0');
  const [offerJail, setOfferJail] = useState(0);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [reqPropIds, setReqPropIds] = useState<number[]>([]);
  const [reqCash, setReqCash] = useState('0');
  const [reqJail, setReqJail] = useState(0);

  if (!open || !me) return null;

  const target = players.find((p) => p.id === targetId) ?? null;
  const others = players.filter((p) => p.id !== me.id && !p.isBankrupt);

  const myTradeable = me.propertyIds.filter((id) => isTradeable(id, spaceStates));
  const targetTradeable = target ? target.propertyIds.filter((id) => isTradeable(id, spaceStates)) : [];
  const myLockedCount = me.propertyIds.length - myTradeable.length;

  const offerCashNum = Math.min(Math.max(0, parseInt(offerCash) || 0), me.money);
  const reqCashNum   = target ? Math.min(Math.max(0, parseInt(reqCash) || 0), target.money) : 0;

  const toggle = (id: number, arr: number[], set: (a: number[]) => void) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const handleClose = () => {
    setStep(1); setOfferPropIds([]); setOfferCash('0'); setOfferJail(0);
    setTargetId(null); setReqPropIds([]); setReqCash('0'); setReqJail(0);
    onClose();
  };

  const handleSelectTarget = (pid: string) => {
    setTargetId(pid);
    setReqPropIds([]);
    setReqCash('0');
    setReqJail(0);
    setStep(3);
  };

  const handlePropose = () => {
    if (!targetId) return;
    proposeTrade({
      fromPlayerId: me.id,
      toPlayerId: targetId,
      offer:   { propertyIds: offerPropIds, cash: offerCashNum, jailFreeCards: offerJail },
      request: { propertyIds: reqPropIds,   cash: reqCashNum,   jailFreeCards: reqJail },
    });
    handleClose();
  };

  const hasOffer   = offerPropIds.length > 0 || offerCashNum > 0 || offerJail > 0;
  const canPropose = !!targetId && (hasOffer || reqPropIds.length > 0 || reqCashNum > 0 || reqJail > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 500, maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700 shrink-0">
          <h2 className="text-white font-black text-base tracking-wide">
            {step === 1 ? 'Trade — Your Offer' :
             step === 2 ? 'Trade — Select Partner' :
             `Trade — What You Want from ${target?.name ?? ''}`}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-200 text-xl font-bold leading-none w-7 h-7 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* ── Step 1: Your offer ── */}
          {step === 1 && (
            <>
              <section>
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Properties
                </h3>
                {myTradeable.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {myTradeable.map((id) => (
                      <PropCard
                        key={id}
                        spaceId={id}
                        selected={offerPropIds.includes(id)}
                        onClick={() => toggle(id, offerPropIds, setOfferPropIds)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm italic">No tradeable properties</p>
                )}
                {myLockedCount > 0 && (
                  <p className="text-yellow-700 text-[10px] mt-1.5 leading-snug">
                    {myLockedCount} propert{myLockedCount === 1 ? 'y is' : 'ies are'} locked
                    (color group has houses — sell houses first to trade them)
                  </p>
                )}
              </section>

              <section>
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Cash to offer
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min={0}
                    max={me.money}
                    value={offerCash}
                    onChange={(e) => setOfferCash(e.target.value)}
                    className="w-28 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm text-right focus:outline-none focus:border-yellow-500"
                  />
                  <span className="text-gray-600 text-xs">of ${me.money.toLocaleString()}</span>
                </div>
              </section>

              {me.getOutOfJailFreeCount > 0 && (
                <section>
                  <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    Get Out of Jail Free cards
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setOfferJail(Math.max(0, offerJail - 1))}
                      className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold"
                    >−</button>
                    <span className="text-white font-bold w-4 text-center">{offerJail}</span>
                    <button
                      onClick={() => setOfferJail(Math.min(me.getOutOfJailFreeCount, offerJail + 1))}
                      disabled={offerJail >= me.getOutOfJailFreeCount}
                      className="w-6 h-6 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded font-bold"
                    >+</button>
                    <span className="text-amber-500 text-xs">🍃 ×{me.getOutOfJailFreeCount} available</span>
                  </div>
                </section>
              )}
            </>
          )}

          {/* ── Step 2: Select partner ── */}
          {step === 2 && (
            <div className="flex flex-col gap-2">
              {others.length === 0 && (
                <p className="text-gray-600 text-sm italic">No other active players to trade with.</p>
              )}
              {others.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectTarget(p.id)}
                  className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl p-3 transition-colors text-left"
                >
                  <div
                    className="w-9 h-9 rounded-full border-2 border-white/70 shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <div>
                    <div className="text-white font-bold text-sm">{p.name}</div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      ${p.money.toLocaleString()} cash
                      {' · '}{p.propertyIds.length} propert{p.propertyIds.length === 1 ? 'y' : 'ies'}
                      {p.getOutOfJailFreeCount > 0 && ` · 🍃×${p.getOutOfJailFreeCount}`}
                    </div>
                  </div>
                  <span className="ml-auto text-gray-500 text-lg">›</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Step 3: What you want from target ── */}
          {step === 3 && target && (
            <>
              {/* Offer summary chip row */}
              <section className="bg-gray-800/70 border border-gray-700 rounded-xl p-3">
                <h3 className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                  Your offer
                </h3>
                <div className="flex flex-wrap gap-1 items-center">
                  {offerPropIds.map((id) => (
                    <span
                      key={id}
                      className="text-[10px] text-gray-200 bg-gray-700 rounded px-1.5 py-0.5"
                    >
                      {BOARD_SPACES[id].name}
                    </span>
                  ))}
                  {offerCashNum > 0 && (
                    <span className="text-[10px] text-green-400 bg-gray-700 rounded px-1.5 py-0.5">
                      ${offerCashNum.toLocaleString()} cash
                    </span>
                  )}
                  {offerJail > 0 && (
                    <span className="text-[10px] text-amber-400 bg-gray-700 rounded px-1.5 py-0.5">
                      🍃×{offerJail}
                    </span>
                  )}
                  {!hasOffer && (
                    <span className="text-gray-600 text-xs italic">Nothing</span>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  {target.name}'s Properties
                </h3>
                {targetTradeable.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {targetTradeable.map((id) => (
                      <PropCard
                        key={id}
                        spaceId={id}
                        selected={reqPropIds.includes(id)}
                        onClick={() => toggle(id, reqPropIds, setReqPropIds)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm italic">No tradeable properties</p>
                )}
              </section>

              <section>
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Cash from {target.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min={0}
                    max={target.money}
                    value={reqCash}
                    onChange={(e) => setReqCash(e.target.value)}
                    className="w-28 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm text-right focus:outline-none focus:border-yellow-500"
                  />
                  <span className="text-gray-600 text-xs">of ${target.money.toLocaleString()}</span>
                </div>
              </section>

              {target.getOutOfJailFreeCount > 0 && (
                <section>
                  <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    GOOJF cards from {target.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setReqJail(Math.max(0, reqJail - 1))}
                      className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold"
                    >−</button>
                    <span className="text-white font-bold w-4 text-center">{reqJail}</span>
                    <button
                      onClick={() => setReqJail(Math.min(target.getOutOfJailFreeCount, reqJail + 1))}
                      disabled={reqJail >= target.getOutOfJailFreeCount}
                      className="w-6 h-6 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded font-bold"
                    >+</button>
                    <span className="text-amber-500 text-xs">🍃 ×{target.getOutOfJailFreeCount} available</span>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-700 shrink-0">
          {step === 1 && (
            <>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-2 px-5 rounded-lg text-sm transition-colors"
              >
                Next — Select Partner →
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                ← Back
              </button>
              <span className="text-gray-600 text-xs">Click a player to continue</span>
            </>
          )}
          {step === 3 && (
            <>
              <button
                onClick={() => setStep(2)}
                className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handlePropose}
                disabled={!canPropose}
                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2 px-5 rounded-lg text-sm transition-colors"
              >
                Propose Trade
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
