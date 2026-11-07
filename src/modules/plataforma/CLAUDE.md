# Módulo `plataforma`

**Carril:** Compartido

PWA, imágenes OG para compartir (1080×1920), reportar falla, analítica, errores, jobs (cola `jobs` + crons) y bitácora.

| | |
|---|---|
| **Tablas (dueño)** | jobs, bug_reports, audit_logs |
| **Pantallas** | 08a 404 · 08b Sin conexión · 21 Plantillas para compartir · 42 Reportar falla · 43 Instala la app |
| **Emite** | — |
| **Escucha** | — |

## Reglas clave
- Vercel Hobby: crons 1 vez al día; lo frecuente va por pg_cron → /api/cron/*.
- Todo debe caber en planes gratis.
- **Reportar falla** (42): `components/reportar-falla.tsx` (botón flotante arriba de la barra; lo pone el cascarón con el flag `beta.bug_button`), `reportarFalla` guarda en `bug_reports` ("¿qué pasó?" al inicio del texto, la ruta sin lo que va después del "?" y el celular si los dejó), máximo 10 por hora; revisa el flag. Regla `bug.report` (`server/reglas.ts`).
- **Una sola vez** (`server/jobs.ts`): `apartarUnaVez(claves)` aparta claves únicas en `jobs` (tipo `una-vez`) para que dos corridas no hagan lo mismo; `soltarUnaVez(prefijo)` las suelta. Para leerlos: `node scripts/supabase-dev.mjs sql "select … from bug_reports"`.
- **PWA**: `src/app/manifest.ts` (íconos y atajos), `public/sw.js` escrito a mano (sin build): páginas siempre de la red y, sin señal, `/sin-conexion` (08b, estática, la guarda al instalarse); `/_next/static` y `/brand` del celular; push con `href`. No guarda páginas ni datos de nadie. `RegistrarServiceWorker` (en el layout raíz) lo registra solo en producción. Si cambias `sw.js`, sube `VERSION`. `/instalar` (43) detecta iPhone o Android y en Android instala directo si se puede.

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/plataforma`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
