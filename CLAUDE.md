# CLAUDE.md — Chilena

@AGENTS.md

> **Next.js 16 cambió mucho:** antes de escribir código de Next, lee la guía en `node_modules/next/dist/docs/` (ver AGENTS.md). Este proyecto tiene `cacheComponents` activado.

## Estado del proyecto
La **base técnica de la Fase 0 ya está hecha** (Next 16 + Tailwind v4 + shadcn, Prisma 7 generado, clientes de Supabase, `proxy.ts`, tokens de diseño oscuro/claro con acento por rol, fuentes, módulos con su `CLAUDE.md`, bus de eventos, cola de trabajos, cron, flags, semilla de flags e insignias, tests y CI). Lo que falta de la Fase 0 está marcado en `docs/ROADMAP.md`.

## Qué es
**Chilena es la red social del fútbol llanero (CDMX).** Lema: *Del llano a tu celular.* Por detrás tiene gestión de ligas (rol, cédula, tabla, sanciones, cuotas), y **esa operación genera sola el contenido social**: cada gol, resultado o campeonato validado se vuelve publicación, carta actualizada, insignia o portada.

**Prioridad #1: que la gente quiera vivir ahí.** Ante cualquier duda, gana lo que dé ganas de abrir la app, comentar, votar, picarse con el rival y compartir a WhatsApp, y lo que sea más fácil en un celular barato, en la banda, con una mano.

Estamos en **BETA gratuita**: la app se construye completa, pero con funciones apagadas por flags (ver "Beta" abajo).

## Lee esto antes de tocar un área
| Documento | Para qué |
|---|---|
| `docs/PRD.md` | **Fuente de verdad funcional**: roles, reglas, motor social, operación, cédula, mapa F-xxx del Excel |
| `docs/CARTA_E_INSIGNIAS.md` | Fórmula de la carta, rankings, votaciones, catálogo de insignias, plantillas de titulares |
| `docs/MODULOS.md` | Módulos, reglas entre módulos, eventos, reparto entre los dos devs, feature flags, analítica |
| `docs/PERMISOS.md` | Quién puede hacer qué y quién ve qué dato |
| `docs/NOTIFICACIONES.md` | Catálogo, push y jobs |
| `docs/DISENO.md` | Tokens (oscuro y claro), tipografía, colores por rol, componentes e **inventario de pantallas → ruta → módulo** |
| `docs/diseno/` | Pantallas exportadas de Claude Design. **Si existe una pantalla, respétala** |
| `docs/diseno/referencias/` | Logo y paleta de Chilena |
| `docs/fuentes/` | Originales: `Estimaciones.xlsx` (Interacciones, Perfiles, Menús) y `Pelotazo_Pantallas.pptx` (pantallas 01–24, antes del rebrand: donde diga Pelotazo, es Chilena) |
| `docs/ROADMAP.md` | Fases de la beta. Trabaja **una fase a la vez** |
| `docs/SETUP.md` | Cómo están montados Supabase, Vercel y GitHub |
| `prisma/schema.prisma` | Modelo de datos (64 tablas, validado en Postgres 16). Tiene **un dueño**: no lo cambies sin avisar |
| `prisma/sql/001_extras.sql` | CHECKs, índices de búsqueda y RLS |

Si algo no está en el PRD, **pregunta o propón el cambio en el PRD antes de implementarlo**. No inventes reglas de negocio.

## Stack
- **Next.js 16** (App Router, Server Components, Server Actions, Turbopack) + **React 19** + **TypeScript** estricto
- **Tailwind CSS v4** + **shadcn/ui** + `lucide-react`
- **Prisma 7** (generator `prisma-client` → `src/generated/prisma`, `@prisma/adapter-pg`, `prisma.config.ts`)
- **Supabase**: Postgres, Auth (**Google + link mágico al correo** en la beta), Storage (solo bucket `avatars`), Realtime **Broadcast**, `pg_cron` + `pg_net`
- `@supabase/ssr` · **Zod** · `react-hook-form` · **TanStack Query** (feed infinito, en vivo)
- **PWA**: Serwist + `web-push` (VAPID)
- `next/og` para las plantillas 1080×1920 que se comparten
- **Vitest** + **Playwright** · Sentry · PostHog (planes gratis)
- Deploy: **Vercel Hobby** (`*.vercel.app`) · GitHub
- Fechas: `date-fns` + `date-fns-tz`; zona de negocio **America/Mexico_City**, guardado en UTC

> Antes de instalar o usar una API, **verifica la versión actual y su documentación**. No asumas APIs de memoria. En Next 16 el middleware es `proxy.ts`. Prisma 7 no lleva `url` en `schema.prisma`.

## Beta: qué está prendido y qué no
| Apagado (flag off) | Prendido |
|---|---|
| Fotos y videos en publicaciones · video del gol · login por WhatsApp · IA en textos · Fútbol Pro · chat interno (no existe) · pagos en la app · categoría infantil | Foto de perfil · feed y auto-posts · carta · insignias · votaciones · quiniela · rankings · portada (con plantillas) · bolsa · retas · cuotas y cobros ("Ya pagué / Confirmar") · push de prueba · botón "Reportar falla" |

- Todo flag se consulta con `isEnabled("media.posts")` (tabla `feature_flags`). Un flag apagado oculta la función o la muestra como "Próximamente".
- **Contactar a alguien = abrir WhatsApp** (`https://wa.me/52…?text=…`). No hay mensajes internos.
- **Todo debe caber en los planes gratis** de Supabase y Vercel: sin servicios de pago, sin crons de alta frecuencia en Vercel (usa `pg_cron`), y la foto de perfil se comprime en el cliente (máx. 512 px, WebP, ~100 KB).

## Arquitectura
- **Módulos por tema** en `src/modules/<modulo>/` (core, social, carta, votaciones, equipos, ligas, partidos, comunidad, notificaciones, plataforma). Las rutas en `src/app/` son delgadas y solo componen módulos. **Un módulo solo importa a otro por su `index.ts`.** Ver `docs/MODULOS.md`.
- **Reacciones en cadena por eventos** (`shared/events/bus.ts`): `match.validated` → tabla, cartas, insignias, auto-posts, votaciones y notificaciones. Lo pesado va a la cola de trabajos (`/api/cron/trabajos` vía pg_cron).
- **Base de datos solo desde el servidor con Prisma.** El cliente usa Supabase solo para Auth, subir el avatar (URL firmada desde el servidor) y escuchar Broadcast. RLS activo sin políticas.
- **Mutaciones = Server Actions**: Zod → `assertCan()` → servicio de dominio → eventos → `revalidateTag`.
- **Servicios puros y testeables** (sin Next) para: fórmula de la carta, generador del rol, máquina de estados del partido, cálculo de tabla, sanciones, quiniela, rareza de insignias y plantillas de titulares.
- **Perfiles sin reclamar:** `User.authId = null`. Al reclamar se liga `authId`; nunca se duplica la persona.
- **Contadores denormalizados** en la misma transacción. **Bitácora** (`AuditLog`) en cambios a resultados, eventos oficiales, sanciones y dinero.
- **Bitácora en la MISMA transacción que el cambio:** toda acción que escribe `AuditLog` (sorteo, sanción, resultado, dinero) lo hace dentro del mismo `db.$transaction` que el cambio. Si falla una de las dos, no se guarda ninguna: nunca hay un cambio sin bitácora ni una bitácora sin cambio.

## Reglas que nunca se rompen (cada una con test)
1. **Marcador oficial = cédula firmada (o capturada por la liga desde papel) y validada.** Lo de la banda es `LiveScoreUpdate` con chip "NO OFICIAL".
2. **Solo `VALIDADO` cuenta** para tabla, goleo, carta, insignias, sanciones y quiniela.
3. **Cédula firmada = inmutable**; después solo corrige la liga, con motivo y bitácora.
4. **Un jugador no puede estar en dos equipos del mismo torneo.**
5. **El delegado no suspende partidos**; solo solicita "No hay juego".
6. **RES solo lo votan rivales**; nadie vota por sí mismo.
7. **Dinero en centavos (Int), MXN. La app nunca procesa pagos.**
8. **Datos privados** (celular, emergencia, fecha de nacimiento, tallas, datos de pago) nunca llegan a lo público. Usa `publicUserSelect`.
9. **Textos automáticos solo con datos reales.** Picardía sobre el juego, nunca sobre el físico, la edad o la vida de alguien.
10. **Moderación:** carrilla sí; insultos, amenazas y discriminación se reportan y la liga los oculta.

## Diseño (resumen; detalle en `docs/DISENO.md`)
- **Mobile first** (390 px) y PWA instalable; el panel de liga también en escritorio. **Modo oscuro y claro** (Automático por defecto).
- Fuentes: **Big Shoulders** (antes "Big Shoulders Display"; titulares de momento, inclinada, MAYÚSCULAS) · **Barlow Condensed** (chips, números, carta) · **Barlow** (texto).
- Marca: Elite Blue `#0250B0`, **Volt Lime `#D0FF41` = acción principal** (texto oscuro encima, nunca lima como texto sobre blanco) y Silver Cloud `#C6D0DD`.
- **Acento por rol, sutil:** Jugador azul · Delegado morado · Árbitro turquesa · Aficionado magenta · Liga plata. Solo en el menú activo, la etiqueta del rol, el degradado del header, la tarjeta principal, el aro del avatar y la línea superior.
- Barra inferior: **Inicio · En vivo · [central por rol: Publicar / Pase de lista / Capturar] · Mi liga · Perfil**.
- Los momentos gritan; la navegación va tranquila. Skeletons, optimistic UI, áreas táctiles ≥ 44 px. **Prueba en un Android de gama baja.**
- Textos en **español de México**, cercanos y futboleros ("¿Vas el domingo?", "Aguas: llevas 4 amarillas", "Se fue la señal en la cancha"). Usa los textos de las pantallas del deck tal cual.

## Convenciones
- Código, archivos y funciones en inglés; términos de dominio que ya están en el schema (jornada, cédula, liguilla, delegado, porra) en español.
- Referencia la función del Excel o la pantalla: `// F-030 Alineación · pantalla 53`.
- Server Components por defecto; `"use client"` solo donde hay interacción.
- El mismo esquema Zod valida en el cliente y en la Server Action.
- Paginación por **cursor**, nunca por offset.
- Errores de dominio tipados → toasts amables.
- Sin `console.log`; usa `shared/lib/logger.ts`.

## Comandos de Claude Code (en `.claude/`)
- `/siguiente operacion` o `/siguiente social` → toma la siguiente tarea de tu carril en el ROADMAP.
- `/pantalla 25` → implementa una pantalla del diseño.
- `/revisar` → checks + agentes `revisor-reglas` y `revisor-ui` antes del PR.
- MCP en `.mcp.json`: **Playwright** (ver la app en el navegador) y **Supabase** en solo lectura (requiere `SUPABASE_PROJECT_REF` y `SUPABASE_ACCESS_TOKEN` en tu terminal).
- `prisma/schema.prisma` y las migraciones **piden permiso** antes de tocarse (solo el dueño del schema).

## Dónde va cada cosa
- `src/modules/<modulo>/`: todo lo del módulo (lee su `CLAUDE.md`). API pública en `index.ts` y `server-api.ts`.
- `src/shared/ui/`: componentes shadcn (`pnpm dlx shadcn@latest add <componente>` ya está configurado para esta carpeta) y componentes de marca.
- `src/shared/lib/`: `db.ts` (Prisma), `supabase/`, `dates.ts`, `money.ts`, `logger.ts`.
- `src/shared/events/`: `bus.ts` (`on`, `emit`) y `types.ts` (el contrato de eventos).
- Clases de diseño: `.titular-momento` (GOLAZO, ¡CAMPEONES!), `.etiqueta` (chips y números); colores `bg-brand-lime`, `text-role`, `bg-role-card`, `bg-surface`, `text-warning`, `text-danger`, `bg-whatsapp`.

## Comandos
```bash
pnpm dev
pnpm lint && pnpm typecheck && pnpm test     # obligatorio antes de dar algo por terminado
pnpm test:e2e                                # Playwright en 390 px, oscuro y claro
pnpm db:migrate                              # solo el dueño del schema
pnpm db:generate
pnpm db:seed                                 # flags e insignias
pnpm db:seed:demo                            # + liga demo (Liga Dominical Iztapalapa)
```

## Forma de trabajar
1. Toma la **siguiente tarea de la fase actual** en `docs/ROADMAP.md`, dentro de **tu módulo**.
2. Lee las secciones del PRD y las pantallas de `docs/diseno/` que menciona. Si hay ambigüedad, pregunta.
3. Propón un plan corto (archivos y pasos) y luego implementa.
4. Tests de las reglas de negocio y de authz que toques; un E2E del flujo principal de la fase.
5. Lint, typecheck y tests en verde. Revisa la UI a 390 px en **oscuro y claro**.
6. Marca la casilla en el ROADMAP. Si cambió una regla, actualiza el PRD en el mismo PR.
7. Rama `feat/<modulo>-<cosa>`, commits pequeños en español (`feat(carta): fórmula de portero`), PR revisado por el otro dev.

## Variables de entorno
Ver `.env.example`. **Nunca** expongas al cliente `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, `VAPID_PRIVATE_KEY` ni `CRON_SECRET`.
