# Chilena — La Carta, rankings e insignias

> El corazón del engagement. Todo aquí se calcula **solo con partidos `VALIDADO`** y con funciones puras en `src/modules/carta/server/formula.ts`, con tests de cada tramo.

## 1. La carta

| Elemento | Regla |
|---|---|
| **Frente** | Media · posición · foto · escudo del equipo actual · alcaldía · GOL · PJ · AST **del torneo actual** |
| **Reverso** | 6 atributos (0–99) según el grupo de posición |
| **Perfil** | Las estadísticas de **carrera** (todas las ligas) van en el perfil, no en la carta |
| **Ventana** | Los atributos usan los **últimos 20 partidos validados** (cualquier torneo o liga). Pesa la forma reciente |
| **En construcción** | Con menos de **3 partidos validados**: carta Bronce, media oculta, "1 de 3" |
| **Recalcular** | Al validar cada partido (en cola) y la **foto semanal** del lunes 06:00 (`PlayerCardSnapshot`) |
| **Delta** | `media actual − media de la foto del lunes anterior` → "↑ +2 esta jornada" |
| **Rango** | La media siempre queda entre 40 y 99 (CHECK en la base) |

### 1.1 Grupo de posición
Sale de `PlayerProfile.posicionPrincipal`: POR → PORTERO · DFC/LAT → DEFENSA · MCD/MC/MCO → MEDIO · EXT/DC → DELANTERO. Si no la tiene, se usa la posición que más ha jugado según las alineaciones; si no hay datos, MEDIO.

### 1.2 Atributos de jugador de campo
Interpolación lineal entre los puntos de cada tabla (fuera de rango se toma el extremo).

| Atributo | Dato base | Puntos (dato → atributo) |
|---|---|---|
| **DEF** Definición | goles / partido | 0 → 45 · 0.25 → 60 · 0.5 → 70 · 1.0 → 85 · 1.5 → 95 |
| **PAS** Pase | asistencias / partido | 0 → 45 · 0.2 → 62 · 0.4 → 75 · 0.8 → 90 |
| **CON** Constancia | % de convocatorias en que fue y jugó | 0% → 40 · 50% → 65 · 80% → 82 · 100% → 95 |
| **DIS** Disciplina | tarjetas en la ventana (la doble amarilla cuenta como 1 roja y 0 amarillas, PRD §7.8) | 95 − 4 × amarillas − 12 × rojas (mín. 40) |
| **CRK** Crack | MVP ganados + % de votos promedio | 55 + 10 × MVP + 0.2 × %votos (máx. 99) |
| **RES** Respeto | promedio de `RespectVote` (1–5), **solo de rivales** | 1 → 40 · 3 → 68 · 5 → 95 · con menos de 5 votos = 70 |

### 1.3 Atributos de portero
| Atributo | Dato base | Puntos |
|---|---|---|
| **VAL** Vallas | vallas invictas / partido | 0 → 45 · 0.2 → 65 · 0.4 → 80 · 0.6 → 92 |
| **SEG** Seguridad | goles recibidos / partido (menos es mejor) | 4 → 45 · 3 → 55 · 2 → 68 · 1 → 82 · 0.5 → 90 |
| **PEN** Penales | penales atajados en la ventana | 50 + 12 × atajados (máx. 95) |
| **CON**, **DIS**, **CRK** | igual que en campo | |

> No existe dato de "atajadas" (nadie las captura). "Atajada de la jornada" es **solo votación**.

### 1.4 Media por posición (pesos)
| Grupo | DEF | PAS | CON | DIS | CRK | RES |
|---|---|---|---|---|---|---|
| DELANTERO | .35 | .15 | .15 | .10 | .15 | .10 |
| MEDIO | .15 | .30 | .20 | .10 | .15 | .10 |
| DEFENSA | .05 | .15 | .30 | .20 | .15 | .15 |

| Grupo | VAL | SEG | PEN | CON | DIS | CRK |
|---|---|---|---|---|---|---|
| PORTERO | .25 | .25 | .10 | .15 | .10 | .15 |

**Bono defensivo:** a los DEFENSA se les suma a la media hasta +3, según las vallas invictas de su equipo en los partidos que jugó (0.2/partido → +1, 0.4 → +2, 0.6 → +3).

`media = clamp(round(Σ peso × atributo) + bono, 40, 99)`

### 1.5 Niveles
| Nivel | Regla | Color |
|---|---|---|
| Bronce | media < 65 (o en construcción) | bronce |
| Plata | 65–74 | plata (#C6D0DD) |
| Oro | 75+ | oro (#E8C46A) |
| **Leyenda del Barrio** | 85+ **y** 30+ partidos validados | negro + lima |

**Cartas especiales** (marco temporal de una semana o para siempre):
- **Once de la Jornada** (semana): ganó su posición en la votación.
- **Goleador del torneo** y **Campeón** (para siempre en su colección).
- **Pionero:** marco especial para los usuarios de la beta.

> Estos números son el **punto de partida**. En la beta se ajustan con datos reales. Por eso las constantes viven en un solo archivo (`formula.ts`) con tests.

## 2. Rankings y pique

| Ranking | Cálculo | Dónde |
|---|---|---|
| Top por posición y alcaldía/zona | `PlayerCard.media` filtrada por grupo de posición + zona/alcaldía del jugador | Mi liga → Rankings |
| Goleo | `PlayerTournamentStat.goles` | Mi liga → Goleo |
| **Duelo** | Dos cartas lado a lado; gana cada atributo el mayor | Botón "Comparar con…" en la carta |
| **El clásico** | Todos los partidos validados entre dos equipos (torneo + retas): G-E-P, último resultado, goleador histórico | Perfil de equipo y Rankings |
| **Rachas** | `rachaGoles`, `rachaAsistencia` ("domingos sin faltar": fue a la cédula, titular o banca; descansos y suspensiones pausan, PRD §7.6) y racha de resultados del equipo (`StandingRow.racha`) | Rankings, auto-post `AUTO_RACHA` |
| **Récords** | Gol más rápido (minuto), goleada más grande, valla menos vencida, más goles en un partido | Rankings del torneo |
| Humor (opcional por liga) | Más tarjeteado, más "NO VOY", etc. | Solo si `League.rankingsConHumor` |

## 3. Votaciones
| Votación | Quién vota | Cuándo cierra | Premio |
|---|---|---|---|
| MVP del partido | Jugadores de ambos equipos y aficionados (1 voto por persona) | Domingo 22:00 o 24 h después del partido | +1 MVP (CRK), insignia MVP, auto-post |
| Golazo de la jornada | Todos | Lunes 22:00 | Insignia, auto-post |
| Once de la jornada (por posición) | Todos | Lunes 22:00 | Carta especial de la semana |
| Atajada de la jornada | Todos | Lunes 22:00 | Insignia |
| El Muro | Solo compañeros del equipo | Fin del torneo | Insignia El Muro |
| Respeto (RES) | **Solo rivales**, 1–5 a cada jugador contrario que jugó | 48 h después del partido | Alimenta RES |

Anti-trampa básico: 1 voto por cuenta; solo cuentas reclamadas votan; no se vota por uno mismo; en RES no votan compañeros.

## 4. Catálogo de insignias (beta)

`criteria` en `Badge` (JSON) lo evalúa `src/modules/carta/server/badges.ts`. **Rareza** = % de jugadores activos que la tienen (se recalcula cada noche).

| Código | Nombre | Categoría | Criterio | Repetible |
|---|---|---|---|---|
| PRIMER_GOL | Primer gol | GOLES | `{type:"goals_total", gte:1}` | no |
| DOBLETE | Doblete | GOLES | `{type:"goals_in_match", gte:2}` | sí |
| HAT_TRICK | Hat-trick | GOLES | `{type:"goals_in_match", gte:3}` | sí |
| GOLEADOR_TORNEO | Goleador del torneo | GOLES | 1º del goleo al cerrar el torneo | sí |
| GOLES_50 | 50 goles | GOLES | `{type:"goals_total", gte:50}` | no |
| DE_CHILENA | De Chilena | ESPECIAL | `{type:"goal_type", value:"CHILENA"}` | sí |
| PANENKA | A lo Panenka | ESPECIAL | `{type:"goal_type", value:"PANENKA"}` | sí |
| VALLA_INVICTA | Valla invicta | PORTERO | portero, partido con 0 goles recibidos | sí |
| PENAL_ATAJADO | Penal atajado | PORTERO | evento PENAL_ATAJADO | sí |
| EL_MURO | El Muro | VOTADAS | gana la votación El Muro | sí |
| DOMINGOS_5 / _12 / _25 | 5 · 12 · 25 domingos sin faltar | CONSTANCIA | `{type:"attendance_streak", gte:N}` (muestra progreso) | no |
| PARTIDOS_100 | 100 partidos | CONSTANCIA | `{type:"matches_total", gte:100}` | no |
| MVP | MVP del partido | VOTADAS | gana MVP | sí |
| GOLAZO_JORNADA | Golazo de la jornada | VOTADAS | gana la votación | sí |
| ONCE_JORNADA | Once de la jornada | VOTADAS | gana su posición | sí |
| ATAJADA_JORNADA | Atajada de la jornada | VOTADAS | gana la votación | sí |
| CAMPEON | Campeón | EQUIPO | en la plantilla campeona | sí |
| SUBCAMPEON | Subcampeón | EQUIPO | en la plantilla subcampeona | sí |
| INVICTOS | Invictos | EQUIPO | equipo sin derrotas en la fase regular | sí |
| FAIR_PLAY | Fair play | FAIR_PLAY | torneo completo (8+ partidos) sin tarjetas | sí |
| PORRA_DE_HIERRO | Porra de Hierro | AFICIONADO | porra (comentario, reacción o voto) en 10 partidos de un mismo equipo | no |
| PROFETA | Profeta | AFICIONADO | top 3 de la quiniela de su liga al cerrar el torneo | sí |
| REPORTERO_BANDA | Reportero de la banda | AFICIONADO | 5 marcadores desde la banda que coincidieron con el oficial | no |
| PIONERO | Pionero | ESPECIAL | cuenta reclamada durante la beta | no |

Las no ganadas se muestran en gris con su progreso (`UserBadge.progreso / meta`) cuando aplica.

## 5. Plantillas de texto (beta, sin IA)

`src/modules/social/server/templates/` guarda los bancos de titulares por situación. Se elige uno al azar sin repetir en la misma liga durante 4 semanas.

| Situación | Ejemplos |
|---|---|
| Goleada (diferencia ≥ 3) | "¡{GANADOR} NO TUVO PIEDAD!" · "¡BAILE EN {CANCHA}!" |
| Gol agónico (≥ 85') | "¡SUFRIÓ, PERO CUMPLIÓ!" · "¡AL 87', CUANDO NADIE CREÍA!" |
| Remontada | "¡LA VOLTEARON!" · "¡DE MENOS A MÁS!" |
| Empate | "¡NADIE SE QUISO IR CON LAS MANOS VACÍAS!" |
| Gol de chilena | "¡{JUGADOR} SE AVENTÓ DE CHILENA!" |
| Líder pierde | "¡LOS BAJARON DE LA NUBE!" |
| Hat-trick | "¡LA PELOTA SE LA LLEVA {JUGADOR}!" |

Reglas: solo datos reales; la picardía es sobre el juego, nunca sobre una persona (físico, edad, vida). La liga puede editar o borrar cualquier texto automático.
