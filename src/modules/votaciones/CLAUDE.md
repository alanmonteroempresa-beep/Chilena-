# Módulo `votaciones`

**Carril:** 🔵 Social

MVP, golazo de la jornada, once ideal (por posición), atajada, El Muro, respeto (RES), quiniela y nivel de hincha.

| | |
|---|---|
| **Tablas (dueño)** | polls, poll_options, poll_votes, respect_votes, predictions, fan_stats |
| **Pantallas** | 12 Votaciones · 13 Quiniela |
| **Emite** | poll.opened, poll.closed |
| **Escucha** | match.validated (abre MVP y RES, califica quiniela), round.closed (golazo, once, atajada) |

## Reglas clave
- 1 voto por cuenta reclamada; nadie vota por sí mismo.
- RES solo lo votan rivales que jugaron.
- Quiniela: 3 puntos marcador exacto, 1 ganador; cierra 1 min antes.
- **MVP** (pantalla 12, `/mi-liga/votaciones`, `components/pagina-votaciones.tsx`): `match.validated` → `abrirMvp` (`server/mvp.ts`) con los que jugaron (`participacionDelPartido` de `partidos`) y su renglón de la cédula; programa `votacion.cerrar` en la cola para `closesAt` y emite `poll.opened` (aviso a los dos equipos). `cerrarVotacion` elige al ganador (`services/mvp.ts`, puro) y emite `poll.closed`: `carta` recalcula CRK y la insignia MVP (lee `votosParaLasCartas`). El job `votaciones` cierra las vencidas que se quedaran.
- **Quiniela** (pantalla 13, `/mi-liga/quiniela`, `components/pagina-quiniela.tsx`): `pronosticar` (se cambia hasta 1 min antes), `calificarQuiniela` al validar; ranking de la porra (jugadores y seguidores del equipo, de `equipos`) o de la liga.
- Reglas `poll.vote` y `prediction.create` (`server/reglas.ts`): cuenta reclamada; nadie vota por sí mismo. Reglas POR APROBAR en PRD §6.7 y §6.8.
- El reinicio del partido de prueba borra su votación del MVP y su quiniela (`reiniciarVotacionesDelPartido`).

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/votaciones`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
