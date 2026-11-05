# Módulo `plataforma`

**Carril:** Compartido

PWA, imágenes OG para compartir (1080×1920), reportar falla, analítica, errores, jobs (cola `jobs` + crons) y bitácora.

| | |
|---|---|
| **Tablas (dueño)** | jobs, bug_reports, audit_logs |
| **Pantallas** | 08a 404 · 21 Plantillas para compartir · 42 Reportar falla |
| **Emite** | — |
| **Escucha** | — |

## Reglas clave
- Vercel Hobby: crons 1 vez al día; lo frecuente va por pg_cron → /api/cron/*.
- Todo debe caber en planes gratis.

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/plataforma`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
