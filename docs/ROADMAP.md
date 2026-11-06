# Chilena — Roadmap de la beta

> **Fase 0 y 1 se hacen juntos.** Después hay **dos carriles en paralelo**: 🟣 **Operación** (equipos · ligas · partidos) y 🔵 **Social** (social · carta · votaciones · comunidad · notificaciones). El contrato entre carriles son los **eventos** de `docs/MODULOS.md` §2. El carril Social trabaja con **partidos validados de la semilla** mientras Operación construye la cédula real.
> Regla: nada se marca terminado sin `lint + typecheck + test` en verde y revisión en 390 px, oscuro y claro.

---

## Fase 0 — Cimientos (juntos)
Ya hecho (base técnica):
- [x] Next.js 16 + TS + Tailwind v4 + pnpm + ESLint/Prettier, `cacheComponents` activado
- [x] ESLint `no-restricted-imports`: los módulos solo se importan por `index.ts` / `server-api.ts`
- [x] Estructura `src/modules/*` con `index.ts`, `CLAUDE.md` por módulo, `shared/events/bus.ts` (contrato en `types.ts`) y cola de trabajos (`jobs` + `/api/cron/[job]`)
- [x] Tokens de `docs/DISENO.md` en `globals.css` (oscuro/claro, acento por rol con `data-role`, alto contraste), fuentes con `next/font`, tema Automático/Claro/Oscuro (next-themes)
- [x] shadcn/ui en `src/shared/ui` (button, card, dialog, sheet, tabs, input, textarea, label, avatar, badge, dropdown, skeleton, sonner)
- [x] Prisma 7 + adapter-pg (`src/shared/lib/db.ts`), cliente generado
- [x] Semilla de feature flags e insignias (`pnpm db:seed`)
- [x] Clientes de Supabase (servidor/navegador) y `src/proxy.ts` que refresca la sesión
- [x] `isEnabled()`, authz base (`can` / `assertCan`, niega por defecto), `publicUserSelect`, `logger`, `money`, `dates`
- [x] Manifest de la PWA, `vercel.json` con crons, CI en GitHub Actions, Vitest (17 tests) y Playwright (390 px oscuro/claro)

Falta:
- [x] Repo en GitHub y deploy en Vercel (`chilena.vercel.app`, proyecto `alan-montero/chilena`, rama de producción `main`) con variables en Production y Preview (`scripts/vercel-env.mjs`)
- [x] Proteger `main` en GitHub: PR obligatorio, CI `checks` en verde y al día con `main`, historia lineal, sin force push. **0 aprobaciones** mientras Alan sea el único colaborador: subir a 1 cuando entren los otros devs
- [x] Migración inicial + migración `extras` contra `chilena-dev` (`docs/SETUP.md` §4) — **dueño del schema**
- [x] Supabase `chilena-dev` montado con el CLI (`scripts/supabase-dev.mjs`): proyecto vinculado, `.env.local` completo (llaves, `DATABASE_URL`, `DIRECT_URL`, `CRON_SECRET`), extensiones `pg_trgm`, `unaccent`, `pg_cron` y `pg_net`, bucket público `avatars` (1 MB, webp y jpeg), liga demo cargada y la app conectada (`/api/cron/trabajos` lee la base)
- [x] Componentes de marca: Botón lima, ChipMarcador, CartaCrack (estática), Header con selector de rol, Barra inferior con botón central por rol (pantallas 03, 07b, 23, 24) → `src/shared/ui/`, vitrina en `/componentes` (fuera de producción)
- [x] Semilla demo (`SEED_DEMO=1`, `prisma/demo/`, probada en Postgres con `prisma dev` y cargada en `chilena-dev`): Liga Dominical Iztapalapa, Apertura 2026, 8 equipos (Dep. Portales, Tigres del Llano, Real Condesa, Juventud Tepito, Atlético Pensil, Unión Doctores, Sporting Narvarte, Halcones Iztapalapa), 16 jugadores por equipo con los apodos del deck (El Chícharo, El Brujo, El Gato, La Roca, La Pulga, Memo…), árbitros (J. Mendoza, R. Pacheco, L. Ortega), Deportivo Cuitláhuac con 3 canchas y **15 jornadas validadas** con eventos realistas
- [x] Auth: pantalla Entrar (01) con link mágico al correo y callback (`/auth/confirm`): crea el `User` y manda a Completa tu perfil o a su inicio. Google listo pero apagado (`auth.google`) hasta configurar Google Cloud
- [x] Cuentas de prueba para la beta interna (flag `auth.demo_login`, `scripts/cuentas-de-prueba.ts`): entrar con correo y contraseña, sin registro con contraseña; ligadas a los perfiles de la semilla (jugador, delegado, árbitro, liga, aficionada) y tres del equipo con todos los roles
- [ ] PWA completa: Serwist (service worker, página sin conexión) e íconos desde el logo (`public/brand/`)
- [ ] Sentry y PostHog conectados

### Recorrido navegable (solo lectura, con la liga demo)
Para revisar la app en `chilena.vercel.app` con las cuentas de prueba antes de construir las funciones. Un PR por bloque; sin publicar ni editar todavía.
- [x] 1. Esqueleto: header con selector de rol y barra inferior (Inicio · En vivo · central por rol · Mi liga · Perfil); el rol cambia el acento, el botón central y el inicio. Al entrar se va a `/inicio`. Rutas de la barra y del botón central con "Próximamente"
- [x] 2. Inicio de cada rol con sus datos: Jugador (03), Delegado (04), Aficionado (05), Árbitro (02) y Liga (18 resumen). Sin equipo o liga: estados vacíos (§6.16). Las acciones (confirmar, pagar, recordatorio, seguir…) avisan "Llega pronto"
- [x] 3. Perfil público y carta: perfil del jugador (06) en `/j/[username]` con pestañas Carta · Insignias · Golazos · Stats, carta frente y reverso volteable con portero y en construcción (25), insignias con rareza y progreso (14/28), y vista de visitante. Se calcula al leer con lo validado (todavía sin `player_cards` ni `user_badges`)
- [x] 4. Mi liga: hub (`/mi-liga`) con el rol de la jornada, la tabla y el goleo; `/mi-liga/tabla`, `/mi-liga/rol?j=` y `/mi-liga/goleo`; la página del partido (`/partido/[id]`, 32) en estado final (resumen y alineaciones de la cédula validada) y programado. Votaciones, rankings, quiniela y bolsa avisan "Llega pronto"
- [x] 5. Feed (10): pestañas Para ti · Golazos · Siguiendo en el inicio de jugador, delegado y aficionado; auto-posts de la última jornada validada (crónica con plantilla, resultado, gol con su tipo, tabla y rachas) armados al leer; WhatsApp comparte el partido público; reaccionar y comentar llegan pronto

**Prompt:**
```
Lee CLAUDE.md y docs/ROADMAP.md. La base técnica de la Fase 0 ya está hecha; termina lo que falta de la Fase 0
(excepto GitHub/Vercel, que hago yo). Empieza por los componentes de marca usando docs/diseno/ (03, 07b, 23, 24)
y después la semilla demo. No cambies prisma/schema.prisma sin preguntarme.
```

## Fase 1 — Core (juntos)
**PRD §3, §4 · pantallas 01, 01b, 06, 07, 11, 24, 40, 41, 42, 43**
- [ ] Entrar sin elegir rol; deducción de rol por link (`/i/[token]` del delegado → entra al equipo) o por perfil compartido
- [ ] **Reclamar perfil** (`/j/[username]/reclamar`): liga `authId`, migra reacciones anónimas, "No soy yo"
- [x] Perfil público `/j/[username]` con `publicUserSelect` (carta, stats, insignias, porra del muro); falta la pestaña Golazos
- [ ] **Visitante**: todo lo público, 🔥 anónimo, invitación a registrarse a la 3ª interacción
- [ ] Selector de rol y liga (hecho en el recorrido: `cambiarRol`, contextos de equipos y ligas); falta activar roles ("Crear mi equipo", "Registrar mi liga", "Soy árbitro")
- [ ] Completa tu perfil (progresivo, un paso por pantalla) y subida de avatar comprimido
- [ ] Ajustes: tema, privacidad, quitar etiquetas, cerrar sesión, borrar cuenta (ARCO)
- [ ] Botón "Reportar falla" (tabla `bug_reports`) y pantalla "Instala la app"
- [ ] Authz base (`can`, `assertCan`) con tests de PERMISOS §5

---

## 🟣 Carril Operación

### O1 — Equipos
**PRD §4.3, §7.11 · pantallas 04, 22b, 31, 36, 51, 52, 54**
- [ ] Crear equipo (siglas, colores, categoría, días, link al grupo de WhatsApp, datos de pago)
- [ ] Agregar jugadores: link/QR de invitación, buscar en Chilena o **dar de alta** (perfil sin reclamar) → link "Reclama tu perfil" para mandar por WhatsApp
- [ ] Gestión (pantalla 04): plantilla "primero los que necesitan atención", roles, números, bajas
- [ ] Perfil de equipo completo y vitrina
- [ ] Cuotas: crear, "Ya pagué", confirmar, recordar por WhatsApp; estado Habilitado / Cuota pendiente
- [ ] Emite `team.member_joined`

### O2 — Ligas y torneos
**PRD §7.1–7.5 · pantallas 16, 18, 37, 44, 45, 48, 49, Mi liga**
- [ ] Registrar liga con código de acceso; administradores y gestores; canchas y subcanchas
- [ ] Panel `/admin/[liga]` (Resumen, Calendario, Equipos y pagos, Árbitros, Sanciones, Cédulas, Moderación, Ajustes)
- [ ] Asistente de nuevo torneo (7 pasos)
- [ ] Inscripciones de equipos y plantillas, con la regla de un equipo por torneo
- [ ] **Generador del rol** (servicio puro con tests exhaustivos: round-robin, descansos, sin choques de cancha y horario) + edición arrastrando
- [ ] Árbitros: alta, asignación, aceptar / "no puedo"
- [ ] Perfil público de liga, hub **Mi liga** (tabla, rol, goleo y accesos a lo social)
- [ ] Estados vacíos de liga nueva

### O3 — Día de partido y cédula ⭐
**PRD §7.6–7.10 · pantallas 02, 08b, 19, 20, 32, 46, 47, 53, 55, 56**
- [x] Máquina de estados de `Match` (servicio puro, test de cada transición y de quién puede hacerla)
- [x] **Pase de lista por link sin cuenta** (`/p/[token]`) y desde la app; resumen para el delegado
- [x] Alineación con alertas (suspendido, cuota, no registrado, otro equipo)
- [ ] **Marcador desde la banda** (`LiveScoreUpdate`) + página del partido en vivo con Broadcast `match:{id}`
- [x] **Cédula del árbitro** modo "al terminar" (por defecto); tipo de gol; offline (borrador en el celular y `clientId`); alto contraste
- [ ] Cédula en vivo, cambios y penales fallados o atajados en la captura
- [x] Firmas de delegados (en el celular del árbitro o en el suyo), **correcciones** (señalar → aceptar o rechazar)
- [ ] Validar después de 48 h sin firma
- [ ] Captura desde papel por la liga (`PAPEL_LIGA`)
- [ ] **Validación** → `match.validated` → tabla (`StandingRow`), `PlayerTournamentStat`, carrera
- [ ] Sanciones automáticas y manuales, descuento por jornada, alerta "Aguas: llevas 4 amarillas"
- [ ] "No hay juego", suspensión y reprogramación; anticachirul (QR y marca en la cédula)

### O4 — Cierre de torneo y dinero de la liga
**PRD §7.11–7.13 · pantallas 18, 22b, 50**
- [ ] Liguilla (cruces desde la tabla), final y campeón → `tournament.finished`
- [ ] Cobros de la liga a equipos y pagos a árbitros ("Ya pagué / Confirmar"); "Cobrado en octubre"
- [ ] Moderación de la porra en el panel

---

## 🔵 Carril Social

### S1 — Red social núcleo ⭐
**PRD §6.1–6.3 · pantallas 05, 10, 33, 34, 35**
- [x] Feed `/inicio` con *Para ti · Golazos · Siguiendo*, paginado por jornada y por cursor ("Ver más"), con los posts guardados y las publicaciones de la gente
- [ ] Tarjetas de cada `PostType` (gol con tipo, resultado, crónica, once, MVP, tabla, insignia, racha, campeón, fichaje)
- [ ] Publicar texto ligado a partido o equipo, con etiquetas (fotos y videos "Próximamente")
- [ ] La porra: comentarios con respuestas, reacciones 🔥 ⚽ 🏆, reportar, ocultar y bloquear — comentarios (post y muro), reacciones y reportar hechos; faltan respuestas, ocultar (moderación) y bloquear
- [ ] Seguir personas, equipos y ligas — personas y equipos hechos; faltan ligas
- [ ] Búsqueda con trigram (jugadores, equipos, ligas y canchas)
- [ ] Compartir por WhatsApp con plantillas `next/og` 1080×1920 (resultado, golazo, carta, MVP, tabla, hat-trick)
- [ ] **Auto-posts** escuchando `match.validated` (prueba con los partidos de la semilla)

### S2 — Notificaciones
**`docs/NOTIFICACIONES.md` · pantallas 09, 43**
- [ ] `notify()`, campana con pestañas, agrupación, Broadcast `user:{id}` — `notificar()`, campana (Todas · Partidos · Social · Liga) y agrupación hechos; falta Broadcast
- [ ] Push web VAPID (pedir permiso después de reclamar o instalar, no al entrar), horario silencioso
- [ ] Preferencias por tipo
- [ ] Jobs con pg_cron (`trabajos`, `recordatorios`, `votaciones`) y Vercel Cron (`lunes`, `nocturno`)

### S3 — La Carta e insignias ⭐
**`docs/CARTA_E_INSIGNIAS.md` · pantallas 14, 25, 28, 29**
- [x] `formula.ts` puro con tests de cada tramo (campo, portero, bono de defensa, niveles, en construcción)
- [ ] Recalcular al validar + foto del lunes + delta "↑ +2" — recalcular al validar hecho (cola `carta.recalcular`, delta contra el cálculo anterior); falta la foto del lunes
- [ ] Carta (frente y reverso volteable, portero, en construcción, especiales) y "Comparar con…" (duelo) — hecha en el recorrido salvo especiales y el duelo
- [ ] Motor de insignias por `criteria`, progreso, rareza nocturna, colección con gris + progreso, auto-post `AUTO_INSIGNIA` — motor (`server/badges.ts`), progreso, rareza al leer y colección hechos; faltan `user_badges`, la rareza nocturna y el auto-post
- [ ] Plantilla para compartir la carta

### S4 — Votaciones, quiniela, rankings y portada ⭐
**PRD §6.5–6.9, §6.11 · pantallas 12, 13, 17, 26, 27**
- [ ] Votaciones (MVP, golazo, once por posición, atajada, El Muro) con cierre automático y premio
- [ ] Respeto (RES) de rivales después del partido
- [ ] Quiniela (+/–, 3 y 1 puntos, ranking por porra y liga, "lo que dice la porra")
- [ ] Rankings y pique: por posición y alcaldía, duelo, clásico, rachas, récords, humor opcional por liga
- [ ] **Portada de la jornada** y crónica con plantillas (CARTA §5), once ideal; la liga puede editarlas
- [ ] **Inicio según el día** (lunes, entre semana, sábado y domingo)
- [ ] Nivel de hincha (`FanStat`) e insignias de aficionado

### S5 — Comunidad y temporada
**PRD §6.12–6.14 · pantallas 15, 22, 30**
- [ ] Bolsa del llano (tipos, urgente, cerca de mí, vencimiento, contacto por WhatsApp)
- [ ] Retas entre equipos → partido `RETA` → historial de clásicos
- [ ] Cierre de temporada (5 historias + tarjeta final) al recibir `tournament.finished`

---

## Fase F — Beta lista (juntos)
- [ ] Recorrido completo con la liga demo: crear torneo → rol → pase de lista → cédula al final → firmas → corrección → validación → lunes (carta, portada, MVP) → liguilla → campeón → cierre de temporada
- [ ] Probar en un **Android de gama baja** y en iPhone instalado como app (push)
- [ ] Aviso de privacidad y términos publicados (revisados por un abogado)
- [ ] Tablero de PostHog con las métricas del PRD §11
- [ ] Insignia **Pionero** activa
- [ ] Grupo de WhatsApp con delegados y organizadores piloto para retroalimentación
