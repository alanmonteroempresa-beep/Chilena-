# Módulo `social`

**Carril:** 🔵 Social

Feed (Para ti · Golazos · Siguiendo), publicar, la porra, reacciones (también anónimas), seguir, etiquetas, auto-posts, plantillas de titulares, portada, búsqueda, moderación, reportes y bloqueos.

| | |
|---|---|
| **Tablas (dueño)** | posts, post_media, post_tags, reactions, anonymous_reactions, comments, user_follows, team_follows, league_follows, reports, blocks |
| **Pantallas** | 03/05/10 Feed · 06 Visitante · 17 Inicio según el día · 26 Portada · 33 Buscar · 34 Publicar · 35 La porra · 38 Perfil aficionado · 50 Moderación |
| **Emite** | post.created, comment.created |
| **Escucha** | match.validated (auto-posts), round.closed (portada y crónica), badge.awarded, poll.closed, tournament.finished |

## Reglas clave
- Feed (10) y pestañas del inicio: `services/auto-posts.ts` (puro) arma los auto-posts de la última jornada validada con `templates/titulares.ts` (CARTA §5); `server/feed.ts` los ordena para Para ti, Golazos y Siguiendo. Hoy se calculan al leer: con la cola de `match.validated` se guardarán en `posts` y entonces llegan reacciones y comentarios.
- Perfil público (06, `/j/[username]`) y pestaña Stats: `components/perfil/`, con los datos de `carta` (`datosDelJugador`). Lo ve el visitante (sin sesión): `src/proxy.ts` no lo protege y el layout le pone `CascaronVisitante`.
- Inicios del jugador (03) y del aficionado (05): `server/inicio.ts` junta datos de partidos, equipos y ligas por su `server-api`; `components/inicio/`. Solo lectura por ahora (`AccionPronto`).
- Textos automáticos solo con datos reales; picardía sobre el juego, nunca sobre personas (CARTA §5).
- `media.posts` apagado en la beta: fotos y videos como "Próximamente".
- Paginación por cursor.

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/social`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
