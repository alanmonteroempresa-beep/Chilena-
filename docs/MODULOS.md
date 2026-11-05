# Chilena — Módulos, reparto de trabajo y flags

> El código se organiza **por módulos de tema** (no por rol). Los roles son "modos" que usan piezas de varios módulos. Así dos personas trabajan en paralelo con Claude Code sin pisarse.

## 1. Los módulos

| Módulo | Qué contiene | Tablas principales |
|---|---|---|
| **core** | Auth (Supabase), sesión, `User`, roles y selector de rol, reclamar perfil, perfil progresivo, ajustes, tema, **authz** y feature flags | users, user_roles, player_profiles, referee_profiles, feature_flags |
| **social** | Feed (Para ti · Golazos · Siguiendo), publicar, la porra (comentarios), reacciones (también anónimas), seguir, etiquetas, auto-posts, plantillas de titulares, portada, búsqueda, moderación, reportes y bloqueos | posts, post_tags, reactions, anonymous_reactions, comments, *_follows, reports, blocks |
| **carta** | La carta (fórmula y fotos semanales), insignias, rankings y pique, duelo, clásico, rachas, récords, cierre de temporada | player_cards, player_card_snapshots, badges, user_badges |
| **votaciones** | MVP, golazo, once ideal, atajada, El Muro, respeto (RES), quiniela y nivel de hincha | polls, poll_options, poll_votes, respect_votes, predictions, fan_stats |
| **equipos** | Equipos, miembros, invitación (link/QR), dar de alta perfiles sin reclamar, pase de lista (link sin cuenta), cuotas, vitrina | teams, team_members, team_dues, team_due_payments, attendance_links, match_attendances |
| **ligas** | Ligas, admins, canchas, torneos (asistente), generador del rol, inscripciones, árbitros (alta y asignación), cobros de la liga, pagos a árbitros, hub Mi liga, tabla | leagues, league_admins, venues, fields, tournaments, tournament_teams, tournament_rosters, rounds, league_charges, referee_payments, standings |
| **partidos** | Partido (máquina de estados), marcador desde la banda, alineación con alertas, **cédula** (en vivo / al final, offline), firmas y correcciones, validación, sanciones, estadísticas por torneo | matches, lineups, lineup_players, match_events, live_score_updates, match_reports, match_report_corrections, match_suspension_requests, sanctions, player_tournament_stats |
| **comunidad** | Bolsa del llano y retas entre equipos | board_posts, challenges |
| **notificaciones** | `notify()`, campana, push web (VAPID), preferencias | notifications, push_subscriptions, notification_preferences |
| **plataforma** | PWA (Serwist), imágenes OG para compartir, reportar falla, analítica (PostHog), errores (Sentry), jobs (cron) y bitácora | bug_reports, audit_logs, jobs |

## 2. Estructura de carpetas

```
src/
  app/                          rutas (delgadas: solo componen módulos)
    (public)/  j/[username]  equipo/[slug]  liga/[slug]  partido/[id]  p/[token]  i/[token]  entrar
    (app)/     inicio  en-vivo  mi-liga/*  perfil  publicar  buscar  notificaciones  ajustes  cuotas  retas
    (admin)/   admin/[liga]/*
    (arbitro)/ arbitro/*
    api/       og/*  cron/*  push/*
  modules/
    <modulo>/
      index.ts                  API PÚBLICA del módulo (lo único que otros importan)
      components/               UI del módulo
      server/
        actions.ts              Server Actions (validan con Zod → authz → servicio)
        services/               lógica de negocio pura (testeable sin Next)
        queries.ts              lecturas (selects explícitos)
      schemas.ts                Zod
      events.ts                 eventos que emite / escucha
      tests/
  shared/
    ui/                         shadcn + componentes de marca (Botón lima, ChipMarcador, CartaCrack…)
    lib/                        db.ts (Prisma), supabase/, dates.ts (America/Mexico_City), money.ts, logger.ts
    events/bus.ts               bus de eventos en proceso
```

### Reglas entre módulos
1. **Un módulo solo importa de otro a través de su `index.ts`.** Nunca `modules/partidos/server/services/...` desde `modules/carta`. ESLint lo bloquea (`no-restricted-imports`).
2. **Las reacciones en cadena van por eventos**, no por llamadas directas. Ejemplo:
   ```
   partidos   emite  match.validated
   ligas      escucha → recalcula tabla
   carta      escucha → recalcula cartas, evalúa insignias
   social     escucha → auto-posts (gol, resultado, crónica, racha)
   votaciones escucha → abre MVP y RES; califica quiniela
   notificaciones escucha → avisa a plantillas y seguidores
   ```
   En la beta el bus es **en proceso** y los consumidores pesados (cartas, insignias) se encolan en la tabla `jobs`, que procesa `/api/cron/trabajos` cada minuto (pg_cron). Así nadie espera al validar.
3. **Cada módulo es dueño de sus tablas.** Otro módulo puede leerlas solo con funciones de `queries.ts` exportadas en el `index.ts`.

### Eventos del dominio (beta)
`user.claimed` · `team.member_joined` · `attendance.responded` · `match.started` · `match.live_score_updated` · `match.report_submitted` · `match.report_signed` · `match.correction_requested` · `match.validated` · `round.closed` · `poll.closed` · `tournament.finished` · `post.created` · `comment.created` · `badge.awarded` · `card.recalculated`

## 3. Reparto entre dos programadores

| Dev "Social" | Dev "Operación" | Compartido |
|---|---|---|
| social · carta · votaciones · comunidad | equipos · ligas · partidos | core · notificaciones · plataforma |

- Ustedes eligen quién toma cada lado.
- **Contrato entre los dos:** los **eventos** de §2 y los tipos que exporta cada `index.ts`. Si los respetan, cada quien avanza sin esperar al otro (con datos semilla).
- **Dueño del schema:** una sola persona aprueba cambios a `prisma/schema.prisma`. El otro propone su cambio en un PR pequeño **antes** de usarlo. Nunca dos migraciones en paralelo.
- **Git:** `main` protegido · ramas `feat/<modulo>-<cosa>` · PR con revisión del otro · CI (lint, typecheck, test) obligatorio · *squash merge*.
- Los dos usan **el mismo `CLAUDE.md`** y abren Claude Code en la raíz del repo.

## 4. Feature flags (tabla `feature_flags`)

| Key | Beta | Qué controla |
|---|---|---|
| `media.avatar` | **on** | Foto de perfil |
| `media.posts` | off | Fotos y videos en publicaciones |
| `media.goal_video` | off | Video ligado al gol |
| `auth.whatsapp_otp` | off | Entrar con código por WhatsApp |
| `ai.texts` | off | Crónica y titulares con IA (si está off → plantillas) |
| `pro.futbol` | off | Sección Fútbol Pro |
| `social.quiniela` | on | Quiniela |
| `social.votaciones` | on | Votaciones |
| `comunidad.bolsa` | on | Bolsa del llano |
| `comunidad.retas` | on | Retas |
| `dinero.cuotas` | on | Cuotas del equipo ("Ya pagué") |
| `dinero.cobros_liga` | on | Cobros de la liga |
| `beta.bug_button` | on | Botón "Reportar falla" |
| `push.enabled` | on | Push web de prueba |

`isEnabled(key)` lee la tabla con caché de 60 s. En UI, un flag apagado oculta la función o la muestra como "Próximamente" según el diseño.

## 5. Analítica de la beta (PostHog)

Eventos mínimos para las métricas del PRD §11:
`profile_claimed` · `app_installed` · `push_enabled` · `attendance_link_opened` / `attendance_answered` · `post_reacted` · `comment_created` · `poll_voted` · `prediction_made` · `card_viewed` · `card_shared` · `template_shared` (con tipo) · `live_score_reported` · `report_submitted` · `report_signed` · `match_validated` · `bug_reported` · `monday_visit` (primera visita del lunes).
