# Chilena — Notificaciones (beta)

> Beta: **in-app (campana) + push web de prueba**. Nada de WhatsApp API ni SMS. Todo se crea con `notify({ type, userIds, actorId, title, body, href, data })` del módulo `notificaciones`, que guarda en `Notification`, publica por Realtime Broadcast en `user:{id}` y, si aplica, manda push.

## 1. Reglas
- **Pocas y útiles.** En la beta, push solo para los tipos marcados ★. Lo demás va solo a la campana.
- Agrupar lo social: "El Brujo y 12 más reaccionaron a tu golazo" (ventana de 10 min).
- Horario silencioso de 23:00 a 07:00 para push (excepto si tu partido es en menos de 3 h).
- Los perfiles sin reclamar no reciben nada.
- iPhone: push solo si la app está instalada en la pantalla de inicio. La pantalla 43 guía la instalación después de reclamar el perfil.
- **Cómo funciona (beta):** "Activar avisos" (Perfil, campana e Instala la app) pide el permiso y guarda el celular en `push_subscriptions`. `notificar()` manda el push de los tipos ★ después de responder (`after`) con `web-push` y las llaves VAPID; las suscripciones muertas (404/410) se borran y `pushedAt` marca lo que llegó. "Mandarme uno de prueba" manda uno al momento. El service worker (`public/sw.js`) lo enseña y al tocarlo abre su liga. Flag `push.enabled`.
- Pestañas en la campana (pantalla 09): Todas · Partidos · Social · Liga.

## 2. Catálogo
| Tipo | Cuándo | A quién | Push |
|---|---|---|---|
| `PASE_DE_LISTA` | Delegado abre el pase de lista | Plantilla | ★ |
| `RECORDATORIO_PARTIDO` | 1 h antes ("Te toca jugar"; al árbitro "Te toca pitar") | Los que dijeron VOY y el árbitro | ★ |
| `PARTIDO_EN_VIVO` | Inicia un partido | Seguidores del equipo | |
| `RESULTADO_OFICIAL` | Partido validado | Plantillas | ★ |
| `CEDULA_POR_FIRMAR` | Árbitro envía | Delegados de ambos equipos | ★ |
| `CORRECCION_CEDULA` | Delegado señala / árbitro responde | Árbitro / delegado | ★ |
| `ASIGNACION_ARBITRO` | Liga asigna | Árbitro | ★ |
| `NO_HAY_JUEGO` / `PARTIDO_SUSPENDIDO` | Solicitud o confirmación | Liga / plantillas y árbitro | ★ |
| `SANCION` | Se aplica | Jugador y delegados | |
| `ALERTA_TARJETAS` | Llega a amarillas − 1 | Jugador | |
| `CUOTA` | Cuota nueva o vence mañana | Jugadores que deben | |
| `PAGO_REPORTADO` | Jugador o equipo dice "ya pagué" | Delegado / liga | |
| `CARTA_ACTUALIZADA` | Lunes, si cambió la media | Jugador | ★ (hoy sale al validar: solo campana hasta que exista el job del lunes) |
| `PORTADA` | Sale la portada y eres protagonista | Protagonista | |
| `VOTACION_ABIERTA` | MVP o golazo abiertos | Plantillas y seguidores | ★ (decisión de la beta: "Vota el MVP") |
| `QUINIELA` | Abre la quiniela de la jornada | Aficionados de la liga | |
| `INSIGNIA` | Ganaste una insignia | Jugador o aficionado | |
| `NUEVO_SEGUIDOR` · `REACCION` · `COMENTARIO` · `ETIQUETA` | Social | Dueño del contenido (agrupado) | |
| `INVITACION_EQUIPO` · `ALTA_EQUIPO` | Entrar a un equipo | Jugador / delegados | |
| `RETA` | Reta recibida o aceptada | Delegados | |
| `LIGA` | Avisos de la liga | Delegados de la liga | |

## 3. Jobs (Vercel Cron, plan Hobby: máximo 1 vez al día por job)
En Hobby, Vercel Cron corre **una vez al día** por job. Lo que necesita más frecuencia se hace con **Supabase `pg_cron` + `pg_net`** llamando a una ruta protegida (`/api/cron/*` con `CRON_SECRET`).

| Job | Frecuencia | Dónde | Hace |
|---|---|---|---|
| `trabajos` | Cada minuto | pg_cron | Procesa la cola: recalcular cartas, evaluar insignias, auto-posts |
| `recordatorios` | Cada minuto, dentro de `trabajos` | pg_cron | `RECORDATORIO_PARTIDO` 1 h antes (uno por persona y partido) |
| `votaciones` | Con la cola (`votacion.cerrar` a su hora); el job cierra las vencidas que se quedaran | pg_cron | Cierra votaciones vencidas, premia y publica |
| `lunes` | Lunes 06:00 | Vercel Cron | Fotos de cartas, delta, portada de la jornada, once ideal |
| `nocturno` | Diario 03:00 | Vercel Cron | Rareza de insignias, rachas, vencer publicaciones de la bolsa |
