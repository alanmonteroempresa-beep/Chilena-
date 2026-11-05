# Chilena — Sistema de diseño

> Referencia visual: pantallas 01–56 de Claude Design, exportadas en `docs/diseno/`. **Si existe una pantalla, se respeta.** Este documento define los tokens para implementarlas en Tailwind v4 (`src/app/globals.css`).

## 1. Marca
- **Logo:** jugador de chilena en azul con balón lima, wordmark "chilena" en minúsculas. Siempre como imagen (`public/brand/`), nunca redibujado ni escrito con una fuente.
- **Lema:** *Del llano a tu celular.*
- **Principio:** la marca es amigable (minúsculas, como el logo); **los momentos gritan** (MAYÚSCULAS condensadas e inclinadas: GOLAZO, ¡CAMPEONES!, TE TOCA EL DOMINGO). La navegación diaria, los formularios y el panel de liga van tranquilos.
- **Inspiración:** portadas de diarios deportivos mexicanos (foto a sangre, titular gigante, chips de marcador). Se toma el lenguaje, **nunca** una cabecera ni marca real.

## 2. Tipografía (Google Fonts, con `next/font`)
| Uso | Fuente | Estilo |
|---|---|---|
| Titulares de momento | **Big Shoulders** (en Google Fonts ya no se llama "Display"; no trae itálica: el navegador la inclina) | 900, inclinada, MAYÚSCULAS, tracking −1% · clase `.titular-momento` |
| Etiquetas, chips, números, marcadores, carta | **Barlow Condensed** | 600–800, números tabulares · clase `.etiqueta` |
| Texto, comentarios, menús, formularios | **Barlow** | 400–600 |

Mínimo 16 px en texto normal; la cédula del árbitro usa 18 px o más.

## 3. Color
### 3.1 Marca y semánticos
| Token | Hex | Uso |
|---|---|---|
| `--brand-blue` | `#0250B0` | Elite Blue: institucional, rol Jugador en claro |
| `--brand-lime` | `#D0FF41` | Volt Lime: **acción principal** (botones) y momentos de gol. El texto encima siempre es oscuro (`#07090C`) |
| `--brand-silver` | `#C6D0DD` | Silver Cloud: bordes, divisores, rol Liga en oscuro |
| `--warning` | `#FFB020` | Amarillas, pendientes, alertas ("Aguas") |
| `--danger` | rojo (validar AA en cada modo) | Rojas, suspendido, EN VIVO (punto pulsante) |
| `--whatsapp` | `#25D366` | **Solo** botones de WhatsApp |
| `--gold` | `#E8C46A` | Carta Oro, trofeos |

### 3.2 Superficies por modo
| Token | Oscuro | Claro |
|---|---|---|
| `--bg` | `#07090C` | `#F4F7FA` |
| `--surface` | `#11151B` | `#FFFFFF` |
| `--surface-2` | `#262B33` | `#E3E8EE` |
| `--border` | `#262B33` | `#E3E8EE` |
| `--text` | `#F4F7FA` | `#07090C` |
| `--text-muted` | gris azulado claro | gris azulado oscuro |

**Regla:** en modo claro la lima **nunca** es texto sobre blanco; solo relleno de botones y chips.
**Tema:** Automático (sigue al celular), Claro u Oscuro, en Ajustes. Clase `dark` en `<html>`; se guarda en una cookie para evitar parpadeo.

### 3.3 Acento por rol (lámina 23)
| Rol | Oscuro (texto y aros) | Claro (texto y aros) | Fondo de tarjeta |
|---|---|---|---|
| Jugador | `#5B9BFF` | `#0250B0` | `#0250B0` |
| Delegado | `#B38CFF` | `#6B2FD6` | `#6B2FD6` |
| Árbitro | `#3FE0D0` | `#08716D` | `#08716D` |
| Aficionado | `#FF7AD9` | `#B8228F` | `#B8228F` |
| Liga | `#C6D0DD` | `#5B6675` | `#262B33` |
| Visitante | sin acento | sin acento | — |

Se aplica **solo** en: el ítem activo del menú y de la barra inferior, la etiqueta del rol en el selector, un degradado de 14% detrás del header de inicio, la tarjeta principal del inicio, un aro de 2 px en el avatar y una línea de 2 px arriba de la app. Implementación: `data-role="jugador"` en `<body>` → `--role-accent`, `--role-card`.

### 3.4 Alto contraste (árbitro)
Fondo negro puro, texto blanco, botones de evento enormes con color semántico (gol lima, amarilla ámbar, roja rojo), sin degradados. Interruptor en la pantalla de cédula.

## 4. Componentes base
- **Botón principal:** lima, texto oscuro, mayúsculas en Barlow Condensed 700, alto ≥ 48 px.
- **Chip de marcador:** escudos (siglas en un cuadro con el color del equipo) + "3–2" + estado: `EN VIVO · 88'` (rojo con punto) · `FINAL` · `NO OFICIAL · desde la banda` (plata) · `OFICIAL · cédula`.
- **Carta de crack:** proporción 2:3, media grande arriba a la izquierda, posición debajo, foto recortada, nombre en Big Shoulders y 3 stats abajo. Bordes por nivel (bronce, plata, oro, leyenda).
- **Tarjeta de golazo:** foto o fondo de jugada, etiqueta del tipo de gol ("DE CHILENA"), minuto, marcador, reacciones 🔥 ⚽ 🏆 💬 y botón WhatsApp.
- **Reacciones:** 🔥 Fuego · ⚽ Golazo · 🏆 Trofeo.
- **Barra inferior:** 5 botones, el central es un círculo lima.
- **Estados vacíos:** ilustración + titular de momento + 1 acción.
- **Skeletons** en lugar de spinners; optimistic UI en reacciones, seguir y votar.
- Áreas táctiles ≥ 44 px.

## 5. Plantillas para compartir
1080×1920 (historia y estado), generadas con `next/og` (`/api/og/[plantilla]/[id]`). Siempre en modo oscuro de marca, con el logo de Chilena y el nombre de la liga. Tipos: resultado, carta, golazo, MVP, posición en la tabla, hat-trick, portada, campeón y cierre de temporada.

## 6. Inventario de pantallas → ruta → módulo
Personas en `/j/[username]` (cualquier rol, como el deck). Panel de liga en `/admin/[liga]`.

| # | Pantalla | Ruta | Módulo |
|---|---|---|---|
| 01 | Inicio / entrar | `/entrar` | core |
| 01b | Invitación del delegado | `/i/[token]` | equipos |
| 02 | Árbitro: partidos de hoy + cédula | `/arbitro/hoy` | partidos |
| 03 | Home del jugador | `/inicio` | social |
| 04 | Gestión de equipo (delegado) | `/equipo/[slug]/gestion` | equipos |
| 05 | Feed del aficionado | `/inicio` | social |
| 06 | Visitante (perfil público) | `/j/[username]` | social |
| 07 / 07b | Perfil y menú, barra inferior | `/perfil` | core |
| 08a / 08b | 404 y sin conexión | `not-found` / offline | plataforma |
| 09 | Notificaciones | `/notificaciones` | notificaciones |
| 10 | Feed automático | `/inicio` | social |
| 11 | Reclama tu perfil | `/j/[username]/reclamar` | core |
| 12 | Votaciones | `/mi-liga/votaciones` | votaciones |
| 13 | Quiniela | `/mi-liga/quiniela` | votaciones |
| 14 / 28 | Insignias (perfil y colección) | `/j/[username]/insignias` | carta |
| 15 | Bolsa del llano | `/mi-liga/bolsa` | comunidad |
| 16 | Estados vacíos | (varias) | — |
| 17 | Inicio según el día | `/inicio` | social |
| 18 | Panel de la liga | `/admin/[liga]` | ligas |
| 19 | Corrección de cédula (delegado) | `/equipo/[slug]/cedula/[matchId]` | partidos |
| 20 | Pase de lista por link | `/p/[token]` | equipos |
| 21 | Plantillas para compartir | `/api/og/*` | plataforma |
| 22 | Cierre de temporada | `/temporada/[tournamentId]` | carta |
| 22b | Trofeo / vitrina | `/equipo/[slug]` | equipos |
| 23 / 24 | Colores por rol / cambio de rol | (sistema) | core |
| MI LIGA | Hub | `/mi-liga` | ligas |
| 25 | La carta (detalle) | `/j/[username]/carta` | carta |
| 26 | La portada de la jornada | `/liga/[slug]/portada/[round]` | social |
| 27 | Rankings y pique | `/mi-liga/rankings` | carta |
| 29 | Tipo de gol (componente) | — | partidos |
| 30 | Reta entre equipos | `/retas` | comunidad |
| 31 / 54 | Cuotas (jugador / delegado) | `/cuotas` · `/equipo/[slug]/cuotas` | equipos |
| 32 | Partido (en vivo / final) | `/partido/[id]` | partidos |
| 33 | Buscar | `/buscar` | social |
| 34 | Publicar | `/publicar` | social |
| 35 | La porra (hilo) | `/post/[id]` | social |
| 36 | Perfil de equipo | `/equipo/[slug]` | equipos |
| 37 | Perfil de liga | `/liga/[slug]` | ligas |
| 38 / 39 | Perfil de aficionado / árbitro | `/j/[username]` | social |
| 40 | Completa tu perfil | `/perfil/completar` | core |
| 41 | Ajustes | `/ajustes` | core |
| 42 | Reportar falla (beta) | global | plataforma |
| 43 | Instala la app | `/instalar` | plataforma |
| 44 | Nuevo torneo | `/admin/[liga]/torneos/nuevo` | ligas |
| 45 | Rol de juegos | `/admin/[liga]/calendario` | ligas |
| 46 | Revisar cédulas | `/admin/[liga]/cedulas` | partidos |
| 47 | Sanciones | `/admin/[liga]/sanciones` | partidos |
| 48 | Asignar árbitros | `/admin/[liga]/arbitros` | ligas |
| 49 | Inscripciones | `/admin/[liga]/inscripciones` | ligas |
| 50 | Moderación | `/admin/[liga]/moderacion` | social |
| 51 | Crear equipo | `/equipo/nuevo` | equipos |
| 52 | Agregar jugadores | `/equipo/[slug]/jugadores` | equipos |
| 53 | Alineación | `/equipo/[slug]/alineacion/[matchId]` | partidos |
| 55 | Mis asignaciones (árbitro) | `/arbitro/asignaciones` | partidos |
| 56 | Cédula al final del partido | `/arbitro/cedula/[matchId]` | partidos |

## 7. Cómo exportar los diseños para Claude Code
En Claude Design, exporta cada pantalla como PNG (celular y escritorio) con el nombre `NN-nombre-celular.png` / `NN-nombre-escritorio.png` (ej. `03-jugador-celular.png`) y ponlas en `docs/diseno/`. Si Claude Design permite exportar HTML, guárdalo en `docs/diseno/html/`: es la mejor referencia para que Claude Code copie medidas y espaciados.
