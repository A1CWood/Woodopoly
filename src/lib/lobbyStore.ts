'use client';

import { create } from 'zustand';
import { supabase } from './supabase';
import { useGameStore, setSyncingFromRemote, serializeGameState } from './gameStore';
import type { PlayerColor, PlayerIcon } from '@/types/game';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface LobbyPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  icon: PlayerIcon;
  isHost: boolean;
}

type LobbyStatus = 'idle' | 'creating' | 'joining' | 'waiting' | 'error';

interface LobbyStore {
  myPlayerId: string;
  roomId: string | null;
  roomCode: string | null;
  isHost: boolean;
  lobbyPlayers: LobbyPlayer[];
  lobbyStatus: LobbyStatus;
  gameReady: boolean;
  error: string | null;
  _channel: RealtimeChannel | null;

  init: () => Promise<void>;
  createRoom: (cfg: { name: string; color: PlayerColor; icon: PlayerIcon }) => Promise<void>;
  joinRoom: (code: string, cfg: { name: string; color: PlayerColor; icon: PlayerIcon }) => Promise<void>;
  startGame: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  _subscribeToRoom: (roomId: string) => void;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('woodopoly-player-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('woodopoly-player-id', id);
  }
  return id;
}

export const useLobbyStore = create<LobbyStore>((set, get) => ({
  myPlayerId: '',
  roomId: null,
  roomCode: null,
  isHost: false,
  lobbyPlayers: [],
  lobbyStatus: 'idle',
  gameReady: false,
  error: null,
  _channel: null,

  init: async () => {
    const myPlayerId = getOrCreatePlayerId();
    if (!myPlayerId) return;
    set({ myPlayerId });

    const storedRoomId = localStorage.getItem('woodopoly-room-id');
    if (!storedRoomId) return;

    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', storedRoomId)
      .single();

    if (error || !data) {
      localStorage.removeItem('woodopoly-room-id');
      return;
    }

    const configs: LobbyPlayer[] = data.player_configs ?? [];
    if (!configs.some((p) => p.id === myPlayerId)) {
      localStorage.removeItem('woodopoly-room-id');
      return;
    }

    const isHost = data.host_player_id === myPlayerId;
    const gameAlreadyStarted = data.status === 'playing';

    set({
      roomId: storedRoomId,
      roomCode: data.code,
      isHost,
      lobbyPlayers: configs,
      lobbyStatus: 'waiting',
      gameReady: gameAlreadyStarted,
    });

    useGameStore.getState().setRoomInfo(storedRoomId, myPlayerId);

    if (gameAlreadyStarted && data.game_state) {
      setSyncingFromRemote(true);
      useGameStore.getState().syncFromRemote(data.game_state);
      setSyncingFromRemote(false);
    }

    get()._subscribeToRoom(storedRoomId);
  },

  createRoom: async ({ name, color, icon }) => {
    const { myPlayerId } = get();
    if (!myPlayerId) return;
    set({ lobbyStatus: 'creating', error: null });

    const me: LobbyPlayer = { id: myPlayerId, name, color, icon, isHost: true };

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const { data, error } = await supabase
        .from('game_rooms')
        .insert({ code, host_player_id: myPlayerId, status: 'lobby', player_configs: [me] })
        .select()
        .single();

      if (!error && data) {
        const roomId: string = data.id;
        localStorage.setItem('woodopoly-room-id', roomId);
        set({ roomId, roomCode: code, isHost: true, lobbyPlayers: [me], lobbyStatus: 'waiting' });
        useGameStore.getState().setRoomInfo(roomId, myPlayerId);
        get()._subscribeToRoom(roomId);
        return;
      }

      if (error && !error.message.includes('duplicate')) {
        set({ lobbyStatus: 'error', error: error.message });
        return;
      }
    }

    set({ lobbyStatus: 'error', error: 'Could not generate a unique room code. Please try again.' });
  },

  joinRoom: async (code, { name, color, icon }) => {
    const { myPlayerId } = get();
    if (!myPlayerId) return;
    set({ lobbyStatus: 'joining', error: null });

    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('status', 'lobby')
      .single();

    if (error || !data) {
      set({ lobbyStatus: 'error', error: 'Room not found or the game has already started.' });
      return;
    }

    const existing: LobbyPlayer[] = data.player_configs ?? [];
    const alreadyIn = existing.find((p) => p.id === myPlayerId);

    let updated: LobbyPlayer[];
    if (alreadyIn) {
      updated = existing.map((p) => (p.id === myPlayerId ? { ...p, name, color, icon } : p));
    } else {
      if (existing.length >= 6) {
        set({ lobbyStatus: 'error', error: 'This room is full (maximum 6 players).' });
        return;
      }
      updated = [...existing, { id: myPlayerId, name, color, icon, isHost: false }];
    }

    const { error: updateErr } = await supabase
      .from('game_rooms')
      .update({ player_configs: updated })
      .eq('id', data.id);

    if (updateErr) {
      set({ lobbyStatus: 'error', error: updateErr.message });
      return;
    }

    localStorage.setItem('woodopoly-room-id', data.id);
    set({ roomId: data.id, roomCode: data.code, isHost: false, lobbyPlayers: updated, lobbyStatus: 'waiting' });
    useGameStore.getState().setRoomInfo(data.id, myPlayerId);
    get()._subscribeToRoom(data.id);
  },

  startGame: async () => {
    const { roomId, myPlayerId, lobbyPlayers, isHost } = get();
    if (!roomId || !isHost || lobbyPlayers.length < 2) return;

    const setups = lobbyPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      icon: p.icon,
    }));

    // Suppress auto-push; we'll write game_state + status in one atomic call.
    // gameStore.startGame() resets the whole store (including roomId/myPlayerId)
    // back to blank, so they must be restored before any further local action —
    // otherwise the host loses turn-gating and stops syncing to Supabase.
    setSyncingFromRemote(true);
    useGameStore.getState().startGame(setups);
    useGameStore.getState().setRoomInfo(roomId, myPlayerId);
    setSyncingFromRemote(false);

    const gameState = serializeGameState(useGameStore.getState());

    const { error } = await supabase
      .from('game_rooms')
      .update({ status: 'playing', game_state: gameState })
      .eq('id', roomId);

    if (error) {
      console.error('[lobbyStore] startGame failed:', error);
      return;
    }

    set({ gameReady: true });
  },

  leaveRoom: async () => {
    const { roomId, myPlayerId, lobbyPlayers, isHost, _channel } = get();

    if (_channel) await supabase.removeChannel(_channel);

    if (roomId) {
      if (isHost) {
        await supabase.from('game_rooms').delete().eq('id', roomId);
      } else {
        const updated = lobbyPlayers.filter((p) => p.id !== myPlayerId);
        await supabase.from('game_rooms').update({ player_configs: updated }).eq('id', roomId);
      }
    }

    localStorage.removeItem('woodopoly-room-id');
    useGameStore.getState().resetGame();

    set({
      roomId: null,
      roomCode: null,
      isHost: false,
      lobbyPlayers: [],
      lobbyStatus: 'idle',
      gameReady: false,
      error: null,
      _channel: null,
    });
  },

  _subscribeToRoom: (roomId) => {
    const { _channel: existing } = get();
    if (existing) supabase.removeChannel(existing);

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = payload.new as {
            status: string;
            player_configs: LobbyPlayer[];
            game_state: ReturnType<typeof serializeGameState> | null;
          };

          set({ lobbyPlayers: room.player_configs });

          if (room.status === 'playing' && room.game_state) {
            setSyncingFromRemote(true);
            useGameStore.getState().syncFromRemote(room.game_state);
            setSyncingFromRemote(false);
            set({ gameReady: true });
          }
        }
      )
      .subscribe();

    set({ _channel: channel });
  },
}));
