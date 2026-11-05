-- =============================================================================
-- CHILENA — Extras que Prisma no expresa.
-- Aplicar como migración manual justo después de la inicial:
--   npx prisma migrate dev --create-only --name extras
--   (pegar este contenido en el migration.sql generado y correr migrate dev)
-- =============================================================================

-- Búsqueda tolerante a errores de dedo (Buscar · pantalla 33)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent', $1) $$;

CREATE INDEX IF NOT EXISTS users_search_trgm ON users USING gin (
  immutable_unaccent(lower(nombre || ' ' || coalesce(apellidos,'') || ' ' || coalesce(sobrenombre,'') || ' ' || username)) gin_trgm_ops
);
CREATE INDEX IF NOT EXISTS teams_search_trgm   ON teams   USING gin (immutable_unaccent(lower(nombre)) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leagues_search_trgm ON leagues USING gin (immutable_unaccent(lower(nombre)) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS venues_search_trgm  ON venues  USING gin (immutable_unaccent(lower(nombre || ' ' || direccion)) gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Integridad
-- ---------------------------------------------------------------------------
ALTER TABLE comments ADD CONSTRAINT comments_one_target CHECK (
  (("postId" IS NOT NULL)::int + ("wallUserId" IS NOT NULL)::int + ("wallTeamId" IS NOT NULL)::int) = 1
);
ALTER TABLE matches ADD CONSTRAINT matches_distinct_teams CHECK ("homeTeamId" <> "awayTeamId");
ALTER TABLE matches ADD CONSTRAINT matches_kind_tournament CHECK (
  ("kind" = 'TORNEO' AND "tournamentId" IS NOT NULL) OR ("kind" = 'RETA')
);
ALTER TABLE matches ADD CONSTRAINT matches_scores_non_negative CHECK (
  coalesce("homeScore",0) >= 0 AND coalesce("awayScore",0) >= 0
  AND "liveHomeScore" >= 0 AND "liveAwayScore" >= 0
);
ALTER TABLE challenges ADD CONSTRAINT challenges_distinct_teams CHECK ("fromTeamId" <> "toTeamId");
ALTER TABLE predictions ADD CONSTRAINT predictions_non_negative CHECK ("homeGoals" >= 0 AND "awayGoals" >= 0);
ALTER TABLE respect_votes ADD CONSTRAINT respect_votes_range CHECK (score BETWEEN 1 AND 5);
ALTER TABLE respect_votes ADD CONSTRAINT respect_votes_not_self CHECK ("voterId" <> "receiverId");
ALTER TABLE player_cards ADD CONSTRAINT player_cards_media_range CHECK (media IS NULL OR media BETWEEN 40 AND 99);
ALTER TABLE team_dues ADD CONSTRAINT team_dues_amount_positive CHECK ("amountCents" > 0);
ALTER TABLE league_charges ADD CONSTRAINT league_charges_amount_positive CHECK ("amountCents" > 0);
-- El cargo ligado a una sanción es su multa (PRD §7.8)
ALTER TABLE league_charges ADD CONSTRAINT league_charges_sanction_is_multa CHECK ("sanctionId" IS NULL OR "concept" = 'MULTA');
-- Orden del sorteo de la liga (PRD §7.13): 1, 2, 3…
ALTER TABLE standings ADD CONSTRAINT standings_orden_manual_positive CHECK ("ordenManual" IS NULL OR "ordenManual" > 0);
ALTER TABLE referee_payments ADD CONSTRAINT referee_payments_amount_positive CHECK ("amountCents" > 0);
ALTER TABLE user_follows ADD CONSTRAINT user_follows_not_self CHECK ("followerId" <> "followedId");
ALTER TABLE blocks ADD CONSTRAINT blocks_not_self CHECK ("blockerId" <> "blockedId");

-- ---------------------------------------------------------------------------
-- Seguridad (Supabase)
-- La app lee y escribe SOLO desde el servidor con Prisma (rol dueño de las
-- tablas → no aplica RLS). Activamos RLS sin políticas en TODAS las tablas para
-- que la anon key no pueda leer ni escribir nada vía la API REST de Supabase.
-- El tiempo real se hace con Realtime Broadcast desde el servidor.
-- ---------------------------------------------------------------------------
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
