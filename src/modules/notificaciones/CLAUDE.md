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
- `notificar()` (`server/notificar.ts`) guarda en `notifications`: nunca a quien hizo la acción ni a perfiles sin reclamar; lo social (reacciones, seguidores) se agrupa en 10 min. Los listeners (`server/listeners.ts`) escuchan `post.reacted`, `comment.created`, `user.followed`, `badge.awarded` y `card.recalculated`, y los del día de partido: `attendance.link_opened` (pase de lista), `match.report_submitted` (cédula por firmar a los delegados que faltan), `match.report_signed` (al árbitro), `match.correction_requested` (al árbitro) `match.correction_answered` (al que señaló y, si cambió, al otro equipo para volver a firmar) y `match.validated` (RESULTADO_OFICIAL a los dos equipos, SANCION al que se sienta y ALERTA_TARJETAS al que quedó a una amarilla); `poll.opened` (VOTACION_ABIERTA: "Vota el MVP" a los dos equipos). Al MVP le llega el aviso de su insignia (`badge.awarded`). Un aviso puede traer su chip en `data.accion`.
- La campana (pantalla 09) en `/notificaciones`; `/n/[id]` marca leído y lleva a su `href`. El numerito sale en el header (`sinLeer`).
- **Push** (`server/push.ts`, `services/push.ts` puro): `notificar()` manda push de `TIPOS_PUSH` (★ + `VOTACION_ABIERTA`) fuera del horario silencioso (el recordatorio pasa siempre) con `after`; borra suscripciones muertas y marca `pushedAt`. `components/activar-avisos.tsx` ("Activar avisos", "Mandarme uno de prueba", "Apagar") lo componen Perfil, la campana e Instala la app (core y plataforma no dependen de este módulo). Regla `push.subscribe`.
- **"Te toca jugar"** (`server/recordatorios.ts`, `services/recordatorios.ts` puro): `mandarRecordatorios` corre cada minuto dentro de `/api/cron/trabajos`; 1 h antes a los que dijeron "Voy" (de `equipos`) y "Te toca pitar" al árbitro que aceptó. Cada persona se aparta su clave (partido + hora + persona) con `apartarUnaVez` de `plataforma` antes de avisarle: nunca dos. El reinicio del partido de prueba suelta las claves y borra los avisos (`olvidarRecordatorios`).
- Push: solo servicios conocidos (`esServicioDePush`), máximo 5 celulares por cuenta, flag `push.enabled` en la pantalla y en las acciones; de noche suena si el aviso trae `partidoEn` a menos de 3 h. "Salir" (core, `boton-salir.tsx`) desuscribe el celular con la API del navegador.
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
