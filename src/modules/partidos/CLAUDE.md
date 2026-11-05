# Módulo `partidos`

**Carril:** 🟣 Operación

Máquina de estados del partido, marcador desde la banda, alineación con alertas, **cédula** (en vivo o al final, offline), firmas y correcciones, validación, sanciones y estadísticas por torneo.

| | |
|---|---|
| **Tablas (dueño)** | matches, lineups, lineup_players, match_events, live_score_updates, match_reports, match_report_corrections, match_suspension_requests, sanctions, player_tournament_stats |
| **Pantallas** | 02 Árbitro hoy · 08b Sin conexión · 19 Corrección · 29 Tipo de gol · 32 Partido · 46 Revisar cédulas · 47 Sanciones · 53 Alineación · 55 Asignaciones · 56 Cédula al final |
| **Emite** | match.started, match.live_score_updated, match.report_submitted, match.report_signed, match.correction_requested, match.validated |
| **Escucha** | — |

## Reglas clave
- Marcador oficial = cédula firmada (o papel) y validada; lo de la banda es NO OFICIAL.
- Cédula firmada inmutable; corrige solo la liga con AuditLog.
- El delegado no suspende; el árbitro solo durante su partido.
- Cola offline con `clientId` idempotente.

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/partidos`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
