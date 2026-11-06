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
- Inicio del árbitro (02): `components/inicio-arbitro.tsx`. El cobro pendiente viene de `ligas` y lo pasa la página (así `partidos` no depende de `ligas`). Próximo partido y goleo: `server/services/proximo.ts` y `goleo.ts` (puros).
- Marcador oficial = cédula firmada (o papel) y validada; lo de la banda es NO OFICIAL.
- Cédula firmada inmutable; corrige solo la liga con AuditLog.
- Bitácora en la MISMA transacción (CLAUDE.md, Arquitectura): validar o corregir un resultado, cambiar eventos oficiales y crear o ajustar sanciones escriben su `AuditLog` en el mismo `db.$transaction` que el cambio.
- El delegado no suspende; el árbitro solo durante su partido.
- Cola offline con `clientId` idempotente.
- Sanciones (PRD §7.8, `server/services/sanciones.ts`): automáticas desde la cédula validada; la liga ajusta la MISMA sanción con bitácora; 5 amarillas → suspensión y el acumulado vuelve a 0; doble amarilla = roja y no suma; la liguilla reinicia el acumulado.
- Alineación (PRD §7.6, `server/services/alineacion.ts`): rojo bloquea (otro equipo, suspendido, no registrado); ámbar avisa (cuota pendiente, a una amarilla).
- "Domingos sin faltar" (PRD §7.6, `server/services/asistencia.ts`): cuenta estar en la cédula, titular o banca; descansos y suspensiones pausan.

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/partidos`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
