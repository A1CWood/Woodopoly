'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/gameStore';
import Board from '@/components/Board';
import ActionPanel from '@/components/ActionPanel';
import GameLog from '@/components/GameLog';
import PlayerHand from '@/components/PlayerHand';
import CardPopup from '@/components/CardPopup';
import OptionsMenu from '@/components/OptionsMenu';
import TradeOfferModal from '@/components/TradeOfferModal';

const PANEL_W = 268;
const BOARD_PX = 620;

export default function GamePage() {
  const { gameStarted, players } = useGameStore();
  const router = useRouter();

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const dragOriginRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const boardInnerRef = useRef<HTMLDivElement>(null);
  const boardWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameStarted) router.replace('/');
  }, [gameStarted, router]);

  const applyTransform = useCallback(() => {
    if (!boardInnerRef.current) return;
    const { x, y } = panRef.current;
    const z = zoomRef.current;
    boardInnerRef.current.style.transform =
      `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${z})`;
  }, []);

  // Fit board in viewport on mount
  useEffect(() => {
    const availW = window.innerWidth - PANEL_W - 48;
    const availH = window.innerHeight - 48;
    const fitZoom = Math.min(availW / BOARD_PX, availH / BOARD_PX, 1);
    zoomRef.current = fitZoom;
    applyTransform();
  }, [applyTransform]);

  // Non-passive wheel listener (must be imperative to call preventDefault)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoomRef.current = Math.max(0.25, Math.min(4, zoomRef.current * factor));
      applyTransform();
    },
    [applyTransform]
  );

  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Global mouse listeners so drag continues even over UI panels
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      panRef.current.x = dragOriginRef.current.px + e.clientX - dragOriginRef.current.mx;
      panRef.current.y = dragOriginRef.current.py + e.clientY - dragOriginRef.current.my;
      applyTransform();
    };
    const onUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [applyTransform]);

  const onBoardMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragOriginRef.current = {
      mx: e.clientX,
      my: e.clientY,
      px: panRef.current.x,
      py: panRef.current.y,
    };
  };

  const resetView = () => {
    panRef.current = { x: 0, y: 0 };
    const availW = window.innerWidth - PANEL_W - 48;
    const availH = window.innerHeight - 48;
    zoomRef.current = Math.min(availW / BOARD_PX, availH / BOARD_PX, 1);
    applyTransform();
  };

  if (!gameStarted || players.length === 0) return null;

  const bottomPlayers = players.slice(0, 2);
  const topPlayers = players.slice(2);

  return (
    <div className="fixed inset-0 bg-gray-950 overflow-hidden">
      {/* Full-screen overlays */}
      <CardPopup />
      <TradeOfferModal />
      <OptionsMenu />

      {/* Pannable / zoomable board layer (z-0) */}
      <div
        ref={boardWrapRef}
        className="absolute inset-0 z-0"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onBoardMouseDown}
        onDoubleClick={resetView}
      >
        <div
          ref={boardInnerRef}
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            width: BOARD_PX,
            transform: 'translate(-50%, -50%) scale(1)',
            transformOrigin: 'center center',
          }}
        >
          <Board />
        </div>
      </div>

      {/* Player hands overlaid on board (z-10, pointer-events pass through gaps) */}
      {topPlayers.length > 0 && (
        <div
          className="absolute top-2 left-2 flex gap-2 flex-wrap z-10 pointer-events-none"
          style={{ maxWidth: `calc(100vw - ${PANEL_W + 16}px)` }}
        >
          {topPlayers.map((p) => (
            <div key={p.id} className="pointer-events-auto">
              <PlayerHand player={p} />
            </div>
          ))}
        </div>
      )}

      <div
        className="absolute bottom-8 left-2 flex gap-2 flex-wrap z-10 pointer-events-none"
        style={{ maxWidth: `calc(100vw - ${PANEL_W + 16}px)` }}
      >
        {bottomPlayers.map((p) => (
          <div key={p.id} className="pointer-events-auto">
            <PlayerHand player={p} />
          </div>
        ))}
      </div>

      {/* Right panel (z-20) */}
      <div
        className="absolute top-0 right-0 bottom-0 z-20 flex flex-col border-l border-gray-800 bg-gray-950"
        style={{ width: PANEL_W }}
      >
        <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto">
          <ActionPanel />
          <GameLog />
        </div>
      </div>

      {/* Zoom controls (above right panel left edge) */}
      <div
        className="absolute z-20 flex flex-col gap-1"
        style={{ bottom: 36, right: PANEL_W + 8 }}
      >
        <button
          onClick={() => {
            zoomRef.current = Math.min(4, zoomRef.current * 1.2);
            applyTransform();
          }}
          className="w-7 h-7 bg-gray-800/90 hover:bg-gray-700 text-white rounded text-base font-bold border border-gray-700 flex items-center justify-center leading-none"
        >
          +
        </button>
        <button
          onClick={resetView}
          className="w-7 h-7 bg-gray-800/90 hover:bg-gray-700 text-white rounded text-xs border border-gray-700 flex items-center justify-center"
          title="Reset view"
        >
          ⊙
        </button>
        <button
          onClick={() => {
            zoomRef.current = Math.max(0.25, zoomRef.current * (1 / 1.2));
            applyTransform();
          }}
          className="w-7 h-7 bg-gray-800/90 hover:bg-gray-700 text-white rounded text-base font-bold border border-gray-700 flex items-center justify-center leading-none"
        >
          −
        </button>
      </div>

      {/* Hint */}
      <div
        className="absolute bottom-2 text-gray-600 text-[9px] pointer-events-none select-none"
        style={{ right: PANEL_W + 8 }}
      >
        scroll · drag · double-click to reset
      </div>
    </div>
  );
}
