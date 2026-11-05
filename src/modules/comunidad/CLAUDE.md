# Módulo `comunidad`

**Carril:** 🔵 Social

Bolsa del llano y retas entre equipos.

| | |
|---|---|
| **Tablas (dueño)** | board_posts, challenges |
| **Pantallas** | 15 Bolsa del llano · 30 Retas |
| **Emite** | — |
| **Escucha** | match.validated (cierra la reta como JUGADA) |

## Reglas clave
- El contacto siempre es por WhatsApp.
- Las retas suman al historial de clásicos, no a la tabla.

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/comunidad`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
