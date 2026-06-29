'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { BOARD_SPACES, COLOR_GROUPS, RAILROAD_IDS, UTILITY_IDS } from '@/lib/boardData';
import type { ColorGroup } from '@/types/game';
import { COLOR_HEX } from '@/lib/boardData';
import TradeWindow from './TradeWindow';

function DieFace({ value }: { value: number }) {
  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
  };
  return (
    <div className="w-11 h-11 bg-white rounded-lg border-2 border-gray-300 shadow">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {(dots[value] ?? []).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={10} fill="#1f2937" />
        ))}
      </svg>
    </div>
  );
}

function TradeButton({
  pendingTrade,
  fromMe,
  onOpen,
}: {
  pendingTrade: boolean;
  fromMe: boolean;
  onOpen: () => void;
}) {
  if (pendingTrade && fromMe) {
    return (
      <div className="text-[10px] text-yellow-600 text-center italic">
        Trade offer pending — waiting for response
      </div>
    );
  }
  return (
    <button
      onClick={onOpen}
      disabled={pendingTrade}
      className="bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
    >
      ⇄ Propose Trade
    </button>
  );
}

function BuildSection() {
  const { players, currentPlayerIdx, spaceStates, buyHouse, sellHouse, phase } = useGameStore();
  const [open, setOpen] = useState(false);

  if (phase === 'card' || phase === 'game_over') return null;

  const player = players[currentPlayerIdx];
  if (!player) return null;

  // Find color groups where player owns all properties
  const monopolies: number[][] = [];
  for (const [, ids] of Object.entries(COLOR_GROUPS)) {
    if (ids.every((id) => spaceStates[id]?.ownerId === player.id && !spaceStates[id].isMortgaged)) {
      monopolies.push(ids);
    }
  }
  if (monopolies.length === 0) return null;

  const allIds = monopolies.flat();

  const buildable = allIds.filter((id) => {
    const space = BOARD_SPACES[id];
    const h = spaceStates[id].houses;
    if (h >= 5) return false;
    const group = COLOR_GROUPS[space.colorGroup as ColorGroup];
    return h <= Math.min(...group.map((gid) => spaceStates[gid].houses)) && player.money >= (space.houseCost ?? 0);
  });

  const sellable = allIds.filter((id) => {
    const space = BOARD_SPACES[id];
    const h = spaceStates[id].houses;
    if (h === 0) return false;
    const group = COLOR_GROUPS[space.colorGroup as ColorGroup];
    return h >= Math.max(...group.map((gid) => spaceStates[gid].houses));
  });

  if (buildable.length === 0 && sellable.length === 0) return null;

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-700 text-sm font-bold text-gray-300 transition-colors"
      >
        <span>🏠 Build / Sell</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="bg-gray-900 p-2 flex flex-col gap-1.5">
          {buildable.map((id) => {
            const space = BOARD_SPACES[id];
            const h = spaceStates[id].houses;
            const color = COLOR_HEX[space.colorGroup as ColorGroup];
            return (
              <div key={id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[11px] text-gray-300 flex-1 truncate">{space.name}</span>
                <span className="text-[10px] text-gray-500">{h === 4 ? '4🏠→🏨' : `${h}🏠`}</span>
                <button
                  onClick={() => buyHouse(id)}
                  className="text-[10px] bg-green-700 hover:bg-green-600 text-white px-1.5 py-0.5 rounded font-bold"
                >
                  +${space.houseCost}
                </button>
              </div>
            );
          })}
          {sellable.map((id) => {
            const space = BOARD_SPACES[id];
            const h = spaceStates[id].houses;
            const color = COLOR_HEX[space.colorGroup as ColorGroup];
            const sellPrice = Math.floor((space.houseCost ?? 0) / 2);
            return (
              <div key={`sell-${id}`} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[11px] text-gray-300 flex-1 truncate">{space.name}</span>
                <span className="text-[10px] text-gray-500">{h === 5 ? '🏨' : '🏠'.repeat(h)}</span>
                <button
                  onClick={() => sellHouse(id)}
                  className="text-[10px] bg-red-800 hover:bg-red-700 text-white px-1.5 py-0.5 rounded font-bold"
                >
                  -${sellPrice}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ActionPanel() {
  const {
    players, currentPlayerIdx, phase, lastRoll, pendingPurchaseId,
    doublesStreak, pendingIncomeTax, pendingBankruptcy, spaceStates, pendingTrade,
    setupRolls, setupRollCurrentIdx, setupRollCandidateIds,
    rollForFirst, rollDice, buyProperty, declinePurchase, endTurn, resetGame,
    payJailFine, useGetOutOfJailFree,
    payIncomeTaxFlat, payIncomeTaxPercent, declareBankruptcy,
  } = useGameStore();

  const [tradeOpen, setTradeOpen] = useState(false);

  const current = players[currentPlayerIdx];
  if (!current) return null;

  const pendingSpace = pendingPurchaseId !== null ? BOARD_SPACES[pendingPurchaseId] : null;
  const canAfford = pendingSpace?.price ? current.money >= pendingSpace.price : false;
  const isDoublesTurn = doublesStreak > 0;

  // For the "Declare Bankruptcy" button: check if any assets remain
  const canStillRaiseMoney = pendingBankruptcy && current.propertyIds.some(
    (pid) => (spaceStates[pid]?.houses ?? 0) > 0 || !spaceStates[pid]?.isMortgaged
  );

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
      {/* Setup roll phase — determine who goes first */}
      {phase === 'setup_roll' && (() => {
        const rollingId = setupRollCandidateIds[setupRollCurrentIdx];
        const rollingPlayer = players.find((p) => p.id === rollingId);
        return (
          <div className="flex flex-col gap-3">
            <div className="text-center text-green-400 text-xs font-bold uppercase tracking-wider">
              Roll for First
            </div>
            <div className="flex flex-col gap-1">
              {setupRollCandidateIds.map((id, i) => {
                const p = players.find((pl) => pl.id === id)!;
                const rolled = setupRolls[id];
                const isCurrent = i === setupRollCurrentIdx;
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${isCurrent ? 'bg-gray-800' : ''}`}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-sm text-white flex-1">{p.name}</span>
                    {rolled !== undefined ? (
                      <span className="text-green-400 font-mono font-bold text-sm">{rolled}</span>
                    ) : isCurrent ? (
                      <span className="text-yellow-400 text-xs italic">rolling…</span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </div>
                );
              })}
            </div>
            {lastRoll && (
              <div className="flex items-center gap-2">
                <DieFace value={lastRoll[0]} />
                <DieFace value={lastRoll[1]} />
                <span className="text-gray-400 text-sm">= {lastRoll[0] + lastRoll[1]}</span>
              </div>
            )}
            {rollingPlayer && (
              <button
                onClick={rollForFirst}
                className="bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
              >
                {rollingPlayer.name}: Roll 🎲
              </button>
            )}
          </div>
        );
      })()}

      {/* Current player header (non-setup phases) */}
      {phase !== 'setup_roll' && current && (
      <div className="flex items-center gap-2.5">
        <div className="w-4 h-4 rounded-full border-2 border-white shrink-0" style={{ backgroundColor: current.color }} />
        <div>
          <div className="text-white font-bold text-sm">{current.name}</div>
          <div className="text-green-400 font-mono text-xs">${current.money.toLocaleString()}</div>
        </div>
        {current.inJail && (
          <span className="ml-auto text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded">IN JAIL</span>
        )}
      </div>
      )}

      {/* Dice display */}
      {phase !== 'setup_roll' && lastRoll && (
        <div className="flex items-center gap-2">
          <DieFace value={lastRoll[0]} />
          <DieFace value={lastRoll[1]} />
          <div className="flex flex-col">
            <span className="text-gray-400 text-sm">= {lastRoll[0] + lastRoll[1]}</span>
            {isDoublesTurn && (
              <span className="text-yellow-400 text-[10px] font-bold">Doubles! Roll again</span>
            )}
          </div>
        </div>
      )}

      {/* Jail options */}
      {phase === 'pre_roll' && current.inJail && (
        <div className="flex flex-col gap-2">
          <span className="text-orange-400 text-xs font-semibold">Jail options:</span>
          <div className="flex gap-2 flex-wrap">
            {current.money >= 50 && (
              <button
                onClick={payJailFine}
                className="flex-1 bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-2 px-2 rounded-lg text-xs transition-colors"
              >
                Pay $50 Bail
              </button>
            )}
            {current.getOutOfJailFreeCount > 0 && (
              <button
                onClick={useGetOutOfJailFree}
                className="flex-1 bg-amber-700 hover:bg-amber-600 text-white font-bold py-2 px-2 rounded-lg text-xs transition-colors"
              >
                Use 🍃 Card
              </button>
            )}
          </div>
          <button
            onClick={rollDice}
            className="bg-green-700 hover:bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
          >
            Roll for Doubles 🎲
          </button>
        </div>
      )}

      {/* Normal roll */}
      {phase === 'pre_roll' && !current.inJail && (
        <>
          <BuildSection />
          <TradeButton pendingTrade={!!pendingTrade} fromMe={pendingTrade?.fromPlayerId === current.id} onOpen={() => setTradeOpen(true)} />
          <button
            onClick={rollDice}
            className="bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
          >
            Roll Dice 🎲
          </button>
        </>
      )}

      {/* Card phase — handled by CardPopup overlay */}
      {phase === 'card' && (
        <div className="text-center text-gray-400 text-sm py-2">Drawing a card…</div>
      )}

      {/* Post-roll */}
      {phase === 'post_roll' && (
        <div className="flex flex-col gap-2">
          <BuildSection />

          {pendingBankruptcy ? (
            /* ── In-debt flow ── */
            <>
              <div className="bg-red-950 border border-red-800 rounded-lg p-3 flex flex-col gap-1">
                <div className="text-red-400 font-bold text-xs">⚠ In Debt — ${Math.abs(current.money)}</div>
                <div className="text-gray-400 text-[10px] leading-relaxed">
                  {canStillRaiseMoney
                    ? 'Hover your properties to mortgage them, or sell houses above to raise funds.'
                    : 'No assets remain. You must declare bankruptcy.'}
                </div>
              </div>
              <button
                onClick={declareBankruptcy}
                className="bg-red-900 hover:bg-red-800 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                Declare Bankruptcy
              </button>
            </>
          ) : (
            /* ── Normal post-roll flow ── */
            <>
              <TradeButton pendingTrade={!!pendingTrade} fromMe={pendingTrade?.fromPlayerId === current.id} onOpen={() => setTradeOpen(true)} />

              {/* Income Tax choice */}
              {pendingIncomeTax && (
                <div className="bg-gray-800 rounded-lg p-3 flex flex-col gap-2">
                  <div className="text-red-400 text-xs font-semibold">🌲 Income Tax</div>
                  <div className="text-gray-300 text-xs">Choose how to pay:</div>
                  <div className="flex gap-2">
                    <button
                      onClick={payIncomeTaxFlat}
                      className="flex-1 bg-red-900 hover:bg-red-800 text-white font-bold py-2 px-2 rounded-lg text-xs transition-colors"
                    >
                      Pay $200 flat
                    </button>
                    <button
                      onClick={payIncomeTaxPercent}
                      className="flex-1 bg-orange-900 hover:bg-orange-800 text-white font-bold py-2 px-2 rounded-lg text-xs transition-colors"
                    >
                      Pay 10%<br />
                      <span className="font-normal">(${Math.floor(current.money * 0.1)})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Property purchase */}
              {pendingSpace && !pendingIncomeTax && (
                <div className="bg-gray-800 rounded-lg p-3 flex flex-col gap-2">
                  <div className="text-white text-sm">
                    <span className="font-bold">{pendingSpace.name}</span>
                    <span className="text-gray-400"> is for sale!</span>
                  </div>
                  {pendingSpace.price && (
                    <div className="text-yellow-400 font-mono text-sm">Price: ${pendingSpace.price}</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={buyProperty}
                      disabled={!canAfford}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:text-gray-400 text-gray-900 font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      {canAfford ? 'Buy' : "Can't Afford"}
                    </button>
                    <button
                      onClick={declinePurchase}
                      className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}

              {!pendingIncomeTax && (
                <button
                  onClick={isDoublesTurn ? rollDice : endTurn}
                  className={`font-bold py-2.5 px-4 rounded-lg transition-colors text-white ${
                    isDoublesTurn
                      ? 'bg-yellow-600 hover:bg-yellow-500'
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {isDoublesTurn ? 'Roll Again! 🎲' : 'End Turn →'}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Game over */}
      {phase === 'game_over' && (
        <div className="flex flex-col gap-2 text-center">
          <div className="text-yellow-400 font-bold text-base">🏆 Game Over!</div>
          <button
            onClick={resetGame}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
          >
            Play Again
          </button>
        </div>
      )}

      <TradeWindow open={tradeOpen} onClose={() => setTradeOpen(false)} />
    </div>
  );
}
