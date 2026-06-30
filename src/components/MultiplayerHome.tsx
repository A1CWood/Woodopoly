'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLobbyStore } from '@/lib/lobbyStore';
import { PLAYER_COLORS, PLAYER_ICONS, ICON_EMOJI } from '@/types/game';
import type { PlayerColor, PlayerIcon } from '@/types/game';
import GameSetup from './GameSetup';

const COLOR_LABELS: Record<PlayerColor, string> = {
  '#EF4444': 'Red',
  '#3B82F6': 'Blue',
  '#22C55E': 'Green',
  '#EAB308': 'Yellow',
  '#A855F7': 'Purple',
  '#F97316': 'Orange',
};

type View = 'choice' | 'host-setup' | 'join-setup' | 'waiting' | 'local';

function PlayerSetupFields({
  name, setName,
  color, setColor,
  icon, setIcon,
}: {
  name: string; setName: (v: string) => void;
  color: PlayerColor; setColor: (v: PlayerColor) => void;
  icon: PlayerIcon; setIcon: (v: PlayerIcon) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Your Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
        />
      </div>

      <div>
        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PLAYER_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              title={COLOR_LABELS[c]}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                color === c ? 'border-white scale-110 shadow-lg' : 'border-gray-600 hover:border-gray-300'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Token</label>
        <div className="flex gap-2 flex-wrap">
          {PLAYER_ICONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              title={ic}
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-base transition-all ${
                icon === ic
                  ? 'border-white scale-110 bg-gray-600'
                  : 'border-gray-600 hover:border-gray-400 bg-gray-700'
              }`}
            >
              {ICON_EMOJI[ic]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-base shadow"
          style={{ backgroundColor: color }}
        >
          {ICON_EMOJI[icon]}
        </div>
        <span className="text-gray-400 text-xs">{name || 'Your'} token preview</span>
      </div>
    </div>
  );
}

export default function MultiplayerHome() {
  const router = useRouter();
  const {
    init, createRoom, joinRoom, startGame, leaveRoom,
    lobbyStatus, lobbyPlayers, roomCode, isHost, gameReady, error, myPlayerId,
  } = useLobbyStore();

  const [view, setView] = useState<View>('choice');
  const [name, setName] = useState('');
  const [color, setColor] = useState<PlayerColor>(PLAYER_COLORS[0]);
  const [icon, setIcon] = useState<PlayerIcon>(PLAYER_ICONS[0]);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Read localStorage + check for existing room on mount
  useEffect(() => { init(); }, [init]);

  // Navigate when game is ready
  useEffect(() => {
    if (gameReady) router.push('/game');
  }, [gameReady, router]);

  // Jump to waiting room if we reconnected to an existing lobby
  useEffect(() => {
    if (lobbyStatus === 'waiting') setView('waiting');
  }, [lobbyStatus]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createRoom({ name: name.trim(), color, icon });
    // setView('waiting') handled by lobbyStatus effect
  };

  const handleJoin = async () => {
    if (!name.trim() || joinCode.trim().length < 4) return;
    await joinRoom(joinCode.trim(), { name: name.trim(), color, icon });
  };

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Choice ─────────────────────────────────────────────────────────────────
  if (view === 'choice') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-green-400 tracking-widest">WOODOPOLY</h1>
            <p className="text-gray-500 text-sm mt-1">The Board Game</p>
          </div>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setView('host-setup')}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl text-lg transition-colors"
            >
              Host a Game
            </button>
            <button
              onClick={() => setView('join-setup')}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl text-lg transition-colors"
            >
              Join a Game
            </button>
            <button
              onClick={() => setView('local')}
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl text-lg transition-colors"
            >
              Local Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Local Game (single device, no host/remote) ───────────────────────────
  if (view === 'local') {
    return <GameSetup onBack={() => setView('choice')} />;
  }

  // ── Host Setup ─────────────────────────────────────────────────────────────
  if (view === 'host-setup') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('choice')} className="text-gray-500 hover:text-gray-300 text-xl leading-none">←</button>
            <h2 className="text-xl font-bold text-white">Host a Game</h2>
          </div>

          <PlayerSetupFields
            name={name} setName={setName}
            color={color} setColor={setColor}
            icon={icon} setIcon={setIcon}
          />

          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={!name.trim() || lobbyStatus === 'creating'}
            className="mt-6 w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {lobbyStatus === 'creating' ? 'Creating room…' : 'Create Room →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Join Setup ─────────────────────────────────────────────────────────────
  if (view === 'join-setup') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl overflow-y-auto max-h-screen">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('choice')} className="text-gray-500 hover:text-gray-300 text-xl leading-none">←</button>
            <h2 className="text-xl font-bold text-white">Join a Game</h2>
          </div>

          <div className="mb-6">
            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Room Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
              placeholder="XXXX"
              maxLength={4}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-3 text-white text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:border-green-500"
            />
          </div>

          <PlayerSetupFields
            name={name} setName={setName}
            color={color} setColor={setColor}
            icon={icon} setIcon={setIcon}
          />

          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

          <button
            onClick={handleJoin}
            disabled={!name.trim() || joinCode.trim().length < 4 || lobbyStatus === 'joining'}
            className="mt-6 w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {lobbyStatus === 'joining' ? 'Joining…' : 'Join Room →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Waiting Room ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        {/* Room code */}
        <div className="text-center mb-8">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-black text-green-400 tracking-[0.25em] font-mono">{roomCode}</span>
            <button
              onClick={copyCode}
              className="text-gray-500 hover:text-gray-200 text-xl transition-colors"
              title="Copy code"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          <p className="text-gray-600 text-xs mt-2">Share this code with friends</p>
        </div>

        {/* Player list */}
        <div className="mb-6">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
            Players ({lobbyPlayers.length} / 6)
          </p>
          <div className="flex flex-col gap-2">
            {lobbyPlayers.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  p.id === myPlayerId ? 'bg-gray-700 border border-gray-500' : 'bg-gray-800'
                }`}
              >
                <div
                  className="w-9 h-9 rounded-full border-2 border-gray-500 flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {ICON_EMOJI[p.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold truncate">
                    {p.name}
                    {p.id === myPlayerId && (
                      <span className="text-gray-400 text-xs font-normal ml-1">(you)</span>
                    )}
                  </div>
                  {p.isHost && <div className="text-yellow-400 text-xs">Host</div>}
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Connected" />
              </div>
            ))}

            {/* Empty slot hints */}
            {lobbyPlayers.length < 2 && Array.from({ length: 2 - lobbyPlayers.length }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 bg-gray-800/40 rounded-xl px-3 py-2.5 border border-dashed border-gray-700"
              >
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-600 flex-shrink-0" />
                <span className="text-gray-600 text-sm italic">Waiting for player…</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isHost ? (
          <button
            onClick={() => startGame()}
            disabled={lobbyPlayers.length < 2}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition-colors mb-3"
          >
            {lobbyPlayers.length < 2 ? 'Waiting for more players…' : `Start Game (${lobbyPlayers.length} players) →`}
          </button>
        ) : (
          <div className="text-center text-gray-500 text-sm py-3 mb-3">
            Waiting for the host to start the game…
          </div>
        )}

        <button
          onClick={() => leaveRoom()}
          className="w-full bg-transparent hover:bg-red-950 border border-gray-700 hover:border-red-900 text-gray-500 hover:text-red-400 font-bold py-2 rounded-xl transition-colors text-sm"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
