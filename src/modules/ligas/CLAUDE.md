# Módulo `ligas`

**Carril:** 🟣 Operación

Ligas, administradores, canchas, torneos (asistente), generador del rol, inscripciones, árbitros (alta y asignación), cobros de la liga, pagos a árbitros, tabla y hub Mi liga.

| | |
|---|---|
| **Tablas (dueño)** | leagues, league_admins, venues, fields, league_venues, league_referees, tournaments, tournament_teams, tournament_rosters, tournament_referees, rounds, standings, league_charges, referee_payments |
| **Pantallas** | 16 Liga nueva · 18 Panel · 37 Perfil de liga · 44 Nuevo torneo · 45 Rol de juegos · 48 Árbitros · 49 Inscripciones · Mi liga |
| **Emite** | round.closed, tournament.finished |
| **Escucha** | match.validated (recalcula tabla) |

## Reglas clave
- Un jugador no puede estar en dos equipos del mismo torneo.
- El generador del rol es un servicio puro con tests exhaustivos.
- Panel en escritorio y celular.
- Tabla (PRD §7.13, `server/services/tabla.ts`): puntos → diferencia → goles a favor → entre ellos → juego limpio → sorteo de la liga.
- Multas (PRD §7.8, `server/services/cargos.ts`): la sanción con multa crea su cargo `MULTA` ligado por `sanctionId`; condonar se hace en el cargo.

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/ligas`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
