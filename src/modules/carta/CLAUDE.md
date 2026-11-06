# Módulo `carta`

**Carril:** 🔵 Social

La carta (fórmula, fotos semanales, delta), insignias (motor por `criteria`, progreso, rareza), rankings y pique (duelo, clásico, rachas, récords) y cierre de temporada.

| | |
|---|---|
| **Tablas (dueño)** | player_cards, player_card_snapshots, badges, user_badges |
| **Pantallas** | 14/28 Insignias · 22 Cierre de temporada · 25 La carta · 27 Rankings y pique |
| **Emite** | card.recalculated, badge.awarded |
| **Escucha** | match.validated (encola recálculo), poll.closed (MVP, El Muro), tournament.finished |

## Reglas clave
- Toda la fórmula en `server/formula.ts` como funciones puras con tests de cada tramo (`docs/CARTA_E_INSIGNIAS.md`).
- Solo partidos VALIDADO cuentan.
- DIS usa `conteoDeTarjetas` de `partidos`: la doble amarilla es 1 roja y 0 amarillas (PRD §7.8).
- Media entre 40 y 99; en construcción hasta 3 partidos.
- Por ahora la carta y las insignias se calculan al leer (`server/jugador.ts`): `services/historial.ts` arma el historial validado con lo que dan `ligas` (plantillas) y `partidos` (partidos, alineaciones, eventos, suspensiones). Cuando exista la cola de `match.validated`, lo mismo llenará `player_cards` y `user_badges`.
- Insignias (`server/badges.ts`): las de votaciones y de cierre de torneo quedan con pista hasta que existan esos datos. Rareza = % de los jugadores del torneo que la tienen.
- Sin votaciones todavía: CRK y RES toman su valor base (55 y 70). RES solo de rivales (regla 6) cuando lleguen los votos.

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/carta`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
