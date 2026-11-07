# Módulo `partidos`

**Carril:** 🟣 Operación

Máquina de estados del partido, marcador desde la banda, alineación con alertas, **cédula** (en vivo o al final, offline), firmas y correcciones, validación, sanciones y estadísticas por torneo.

| | |
|---|---|
| **Tablas (dueño)** | matches, lineups, lineup_players, match_events, live_score_updates, match_reports, match_report_corrections, match_suspension_requests, sanctions, player_tournament_stats |
| **Pantallas** | 02 Árbitro hoy · 08b Sin conexión · 19 Corrección · 29 Tipo de gol · 32 Partido · 46 Revisar cédulas · 47 Sanciones · 53 Alineación · 55 Asignaciones · 56 Cédula al final |
| **Emite** | match.started, match.live_score_updated, match.report_submitted, match.report_signed, match.correction_requested, match.correction_answered, match.validated |
| **Escucha** | — |

## Reglas clave
- La página del partido (32, `/partido/[id]`, pública): `components/pagina-partido.tsx` con `services/resumen-partido.ts` (puro). FINAL y OFICIAL solo si está VALIDADO; si no, "Cédula por validar". El autogol se muestra aparte hasta que la cédula defina a qué equipo se suma.
- Inicio del árbitro (02): `components/inicio-arbitro.tsx`. El cobro pendiente viene de `ligas` y lo pasa la página (así `partidos` no depende de `ligas`). Próximo partido y goleo: `server/services/proximo.ts` y `goleo.ts` (puros).
- Marcador oficial = cédula firmada (o papel) y validada; lo de la banda es NO OFICIAL.
- Cédula firmada inmutable; corrige solo la liga con AuditLog.
- Bitácora en la MISMA transacción (CLAUDE.md, Arquitectura): validar o corregir un resultado, cambiar eventos oficiales y crear o ajustar sanciones escriben su `AuditLog` en el mismo `db.$transaction` que el cambio.
- El delegado no suspende; el árbitro solo durante su partido.
- Cola offline con `clientId` idempotente.
- **Cédula al final** (56a/56b, PRD §7.7): `/arbitro/cedula/[matchId]` a pantalla completa (fuera del cascarón). `components/cedula/cedula-arbitro.tsx` guarda el borrador en el celular (`localStorage`) y lo manda con `enviarCedula` (una transacción: eventos, quién jugó, cédula, estado y bitácora). La página compone con `equipos` (`plantillasParaLaCedula`: rojos, alineación y delegados).
- **Firmas y correcciones** (19): el delegado revisa en `/equipo/[slug]/cedula/[matchId]` (`components/cedula/revisar-cedula.tsx`); el árbitro contesta en su cédula. Estados en `services/estado-partido.ts` (puro); reglas: `report.capture` y `report.respondCorrection` aquí (`server/reglas.ts`), `report.sign` y `report.requestCorrection` en `equipos` (sabe quién es delegado). Al aceptar una corrección se borran las firmas.
- Quién está inscrito lo dice `ligas` por un puerto (`server/puertos.ts`, `proveerInscritos` en su `registerListeners`): `partidos` no lee `tournament_rosters`.
- **Validación** (46, `/admin/[liga]/cedulas`, `components/liga/`): `validarCedula` y `validarListas` (regla `match.validate` de `ligas`). En la transacción: partido VALIDADO, sanciones automáticas y cumplidos con bitácora (`server/recalcular.ts`). Luego estadísticas (`services/estadisticas.ts`, puro) y `match.validated`; `after(procesarCola)` corre cartas, insignias y feed al momento. Todo se recalcula desde cero (idempotente): `node scripts/supabase-dev.mjs torneo seco` comprueba que cuadra.
- Sanciones automáticas al validar: `conciliarSanciones` (puro) compara lo que sale de las cédulas con TODAS las automáticas guardadas (también las anuladas: lo que la liga anuló no revive); crea las que faltan y anula las que sobran (validar fuera de orden o repetidas). `recalcularSanciones` toma el candado del torneo (`FOR UPDATE` en `tournaments`): las validaciones del mismo torneo van de una en una.
- Si fallan las estadísticas después de validar, igual se emite `match.validated` (el partido ya es oficial).
- `scripts/reiniciar-prueba.ts` regresa la J16 Portales vs Tigres de la liga demo (`dominical-iztapalapa`, torneo vigente) a "sin jugar" (lo usan los E2E). El pase de lista lo reinicia `equipos` (`reiniciarPaseDeLista`).
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
