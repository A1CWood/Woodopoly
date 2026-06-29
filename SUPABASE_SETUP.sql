-- Run this once in your Supabase dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.game_rooms (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT    UNIQUE NOT NULL,
  host_player_id TEXT  NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'lobby',
  player_configs JSONB NOT NULL DEFAULT '[]'::jsonb,
  game_state   JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Allow anonymous read/write (no user accounts needed)
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access" ON public.game_rooms
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Realtime so clients receive live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
