# Módulo `core`

**Carril:** Compartido

Auth (Supabase), sesión, personas (`User`), roles y selector de rol, reclamar perfil, perfil progresivo, ajustes, tema, **authz** y feature flags.

| | |
|---|---|
| **Tablas (dueño)** | users, user_roles, player_profiles, referee_profiles, feature_flags |
| **Pantallas** | 01 Entrar · 07 Perfil y menú · 11 Reclama tu perfil · 24 Cambio de rol · 40 Completa tu perfil · 41 Ajustes |
| **Emite** | user.claimed |
| **Escucha** | — |

## Reglas clave
- Permisos por relación, no por rol activo (`docs/PERMISOS.md`).
- Perfil sin reclamar = `authId` null. Reclamar liga `authId` y migra reacciones anónimas.
- Nunca serialices datos privados: usa `publicUserSelect`.
- Entrar (pantalla 01): link mágico al correo; Google con el flag `auth.google`. `/auth/confirm` (`server/entrada.ts`) abre la sesión, crea el `User` la primera vez y manda a Completa tu perfil (sin nombre o apodo) o a su inicio (`server/services/sesion.ts`). `src/proxy.ts` protege `/inicio` y `/perfil`.
- Cuentas de prueba (flag `auth.demo_login`): solo entrar, nunca registrar con contraseña; exige `@prueba.chilena` y `app_metadata.cuenta_de_prueba` (lo pone `scripts/cuentas-de-prueba.ts`).
- `createSupabaseServerClient()` llama `connection()`: con `cacheComponents` + `partialPrefetching`, auth-js usa `Date.now()` y no puede correr al prerenderizar.

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/core`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
