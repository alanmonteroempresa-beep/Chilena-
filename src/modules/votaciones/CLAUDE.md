# Módulo `votaciones`

**Carril:** 🔵 Social

MVP, golazo de la jornada, once ideal (por posición), atajada, El Muro, respeto (RES), quiniela y nivel de hincha.

| | |
|---|---|
| **Tablas (dueño)** | polls, poll_options, poll_votes, respect_votes, predictions, fan_stats |
| **Pantallas** | 12 Votaciones · 13 Quiniela |
| **Emite** | poll.closed |
| **Escucha** | match.validated (abre MVP y RES, califica quiniela), round.closed (golazo, once, atajada) |

## Reglas clave
- 1 voto por cuenta reclamada; nadie vota por sí mismo.
- RES solo lo votan rivales que jugaron.
- Quiniela: 3 puntos marcador exacto, 1 ganador; cierra 1 min antes.

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/votaciones`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
