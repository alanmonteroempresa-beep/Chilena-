# Módulo `notificaciones`

**Carril:** Compartido

`notify()`, campana, push web (VAPID) y preferencias.

| | |
|---|---|
| **Tablas (dueño)** | notifications, push_subscriptions, notification_preferences |
| **Pantallas** | 09 Notificaciones · 43 Instala la app |
| **Emite** | — |
| **Escucha** | Casi todos los eventos (ver `docs/NOTIFICACIONES.md`) |

## Reglas clave
- Pocas y útiles: push solo para los tipos ★.
- Perfiles sin reclamar no reciben nada.
- Horario silencioso 23:00–07:00.

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/notificaciones`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
