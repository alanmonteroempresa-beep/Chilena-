# Chilena — Especificación de producto (PRD)

> Versión 2.0 · Noviembre 2026 · Beta
> Fuentes: `Estimaciones.xlsx` (Interacciones, Perfiles, Menús), deck de pantallas `Pelotazo_Pantallas.pptx` (01–24), pantallas nuevas 25–56 de Claude Design y las decisiones de producto de noviembre 2026.
> **Fuente de verdad funcional.** Si el código contradice este documento, se corrige el código o se actualiza aquí primero.

---

## 1. Visión

**Chilena es la red social del fútbol llanero.** Es donde el jugador de barrio presume su carta y sus goles, donde su equipo tiene vitrina y porra, y donde la familia y los cuates lo siguen cada domingo. Por detrás resuelve la operación de las ligas (rol, cédula, tabla, sanciones, cuotas), y **esa operación genera sola el contenido social**: nadie tiene que publicar para que su gol aparezca en el feed.

**El objetivo número uno: que la gente quiera vivir ahí.** Que se registre, regrese cada lunes a ver su carta, comente, vote, se pique con el rival y comparta a WhatsApp.

Para decidir cualquier cosa, en este orden:
1. **¿Engancha?** ¿Da ganas de abrir, comentar, votar o compartir?
2. **¿Es facilísimo?** Un señor de 45 años en la banda, con una torta en la mano, lo tiene que poder hacer.
3. **¿Resuelve la operación?** La operación es el motor que alimenta lo social.

**Lema:** *Del llano a tu celular.*

---

## 2. La beta

Es una **beta para conocer cómo funciona la app, detectar fallas y mejorar** antes del lanzamiento oficial. Se construye **la app completa**, pero con estas restricciones:

| Tema | En la beta | Después |
|---|---|---|
| Costo | **Todo gratis**: Vercel Hobby (`*.vercel.app`) y Supabase Free | Planes de pago y dominio propio |
| Entrar | **Google o link mágico al correo** | Código por WhatsApp (como en la pantalla 01) |
| Imágenes | **Solo foto de perfil** (comprimida, ~100 KB) | Fotos y videos en publicaciones, video ligado al gol |
| Notificaciones | In-app + **push web de prueba** | WhatsApp Business API |
| Titulares, crónica y portada | **Plantillas** de frases pícaras llenadas con datos | IA |
| Mensajes | **Sin chat interno**: los botones abren WhatsApp | Se evalúa con datos de la beta |
| Dinero | **La app no mueve dinero**: solo control de "Ya pagué / Confirmar" | Pagos en la app |
| Categoría infantil | **Fuera** (obligaciones legales con menores) | Con flujo de tutor |
| Fútbol Pro (Liga MX) | **Oculto** | Sección propia |
| Ligas piloto | Abierto (se arranca con datos de prueba) | — |
| Datos | **Se conservan** al lanzar oficial (los pioneros conservan todo) | — |

Todo lo que se apaga en la beta se controla con **interruptores** (`FeatureFlag`, ver `docs/MODULOS.md` §4), para prenderlo sin reprogramar.

---

## 3. Roles

| Rol | Quién es | Color de acento |
|---|---|---|
| **Aficionado** | Cualquiera con cuenta. Todos son aficionados por defecto | Magenta |
| **Jugador** | Juega en uno o más equipos | Azul eléctrico |
| **Delegado** | Administra un equipo | Morado |
| **Árbitro** | Pita y captura la cédula | Turquesa |
| **Liga** | Dueño, administrador o gestor de una liga | Plata |
| **Visitante** | Sin cuenta, llegó por un link | Neutro |
| *Superadmin* | Equipo Chilena (interno, no visible) | — |

- **Una persona = una cuenta con varios roles.** Se cambia de rol y de liga con el selector del header (pantallas 07 y 24). Ejemplo: El Chícharo es Jugador en Dep. Portales y Delegado en Los Compas FC.
- El color del rol **solo** se usa en: el menú activo, la etiqueta del rol, un degradado de 14% en el header, la tarjeta principal del inicio, el aro del avatar y una línea de 2 px arriba. Los botones de acción **siempre** son lima (ver `docs/DISENO.md`).
- **Permisos por relación, no por modo:** "¿es delegado de *este* equipo?". El modo activo solo cambia lo que se ve (`docs/PERMISOS.md`).

### Niveles internos
- **Liga:** Dueño · Administrador · Gestor.
- **Equipo:** Delegado principal · Delegado auxiliar · Capitán · Jugador.

---

## 4. Cuentas y perfiles

### 4.1 Entrar (pantallas 01 y 01b)
- **No se elige rol al entrar.** El rol se deduce:
  - Si llegó por el **link de su delegado** → entra directo a su equipo como jugador, con su número.
  - Si llegó por un **golazo o perfil compartido** → entra a seguir a ese crack.
  - Si no → feed de su zona como aficionado.
- Roles adicionales se activan después: "Crear mi equipo", "Registrar mi liga", "Soy árbitro".
- Beta: Google o link mágico al correo. El campo de celular se pide en el perfil (no para entrar).

### 4.2 Visitante (pantalla 06)
- Ve **todo lo público** (perfiles, partidos, tablas, porra) y **puede echar 🔥** sin cuenta (`AnonymousReaction`).
- La invitación a crear cuenta aparece **hasta la 3ª interacción** ("Ya le echaste 3 🔥. Crea tu cuenta gratis para que se queden").
- Al registrarse, sus reacciones anónimas se migran a su cuenta.

### 4.3 Reclama tu perfil (pantalla 11) — el gancho de registro
- El delegado o la liga **da de alta** a sus jugadores con nombre, apodo y número. Así se crea un `User` **sin reclamar** (`authId = null`).
- El árbitro captura sus goles y la carta se va llenando **antes de que el jugador se registre**.
- El jugador recibe un link: *"Chícharo, ya llevas 19 goles. Tu perfil ya te estaba esperando."* → **"ES MÍO, RECLAMAR PERFIL"** → entra y el perfil queda ligado a su cuenta.
- "No soy yo" → avisa al delegado.
- Un perfil sin reclamar se ve y se sigue igual ("214 personas ya te siguen sin que tú supieras").

### 4.4 Perfil progresivo (pantalla 40)
**Registro en 30 segundos**: nombre, apodo y foto. Todo lo demás se pide después con incentivo: *"Tu perfil va al 40% · complétalo y tu carta sube de nivel"*. Un paso por pantalla. El delegado o la liga pueden pedir lo que les falte cuando lo necesiten.

### 4.5 Datos por rol (de la hoja "Perfiles" del Excel)
| Dato (Excel) | En Chilena | Quién lo ve |
|---|---|---|
| Nombre | Nombre + apellidos (opcional) | Público |
| Sobrenombre | Apodo, grande en el perfil y la carta | Público |
| Edad | **Fecha de nacimiento** (la edad se calcula) | Liga y delegado |
| Celular | Celular | Equipo y liga (configurable) |
| e-mail | Correo de la cuenta | Privado |
| Sexo | Sexo (para categorías femenil, varonil y mixta) | Liga |
| Colonia de vivienda | **Alcaldía** (no la colonia, por privacidad) | Público |
| Posición(es) | Posiciones + principal (POR, DFC, LAT, MCD, MC, MCO, EXT, DC) | Público |
| Foto | Foto de perfil (la única imagen de la beta) | Público |
| INE | **Fuera de la beta.** El anticachirul es la credencial QR (§7.10) | — |
| Pie hábil, # de pie, talla de pantalón | Pie hábil, calzado, pantalón y playera | Pie: público · tallas: delegado |
| # de emergencia | Contacto de emergencia (nombre y teléfono) | Delegado y liga |
| Área de interés | Zona (Norte, Sur, Oriente, Poniente, Centro) | Público |
| Facebook, Instagram | Links | Público |
| Equipos jugados | Rango (1–10, 10–20, 20–30, +30) | Público |
| Superficie favorita | Pasto natural, sintético, concreto, tierra o duela | Público |
| Tipo de fútbol / categoría | Tipos y categorías de interés | Público |
| Árbitro: pie hábil, # de pie | **Se quitan**; solo tallas para el uniforme | Liga |
| Liga: edad, sobrenombre, # emergencia | Se separan: la **persona** que administra tiene su perfil; la **liga** es una entidad (nombre, siglas, zona, canchas, categorías, contacto) | — |
| "Buscar…", "Registrar canchas", "Agregar administrador" | No son datos: son funciones del menú (§5) | — |

---

## 5. Navegación

**Celular — barra inferior (pantalla 07b):**
`Inicio · En vivo · [botón central según rol] · Mi liga · Perfil`

| Rol | Botón central |
|---|---|
| Jugador y Aficionado | **Publicar** |
| Delegado | **Pase de lista** |
| Árbitro | **Capturar** |
| Liga | *(usa el panel; el botón central abre "Programar jornada")* |

**Escritorio — sidebar:** Inicio · En vivo · Mi liga · Perfil. La Liga tiene además su **panel** (`admin`): Resumen, Calendario, Equipos y pagos, Árbitros, Sanciones, Cédulas, Moderación y Ajustes (pantalla 18).

**Header:** logo, chip del rol activo (con su color), **búsqueda**, **campana** y avatar.

| Sección | Contiene |
|---|---|
| **Inicio** | Pestañas *Para ti · Golazos · Siguiendo*. El inicio cambia según el día de la semana (pantalla 17, §6.11) |
| **En vivo** | Partidos de hoy y en vivo, con marcador desde la banda |
| **Mi liga** (hub) | Selector de liga y torneo → Tabla · Rol de juegos · Goleo · Rankings y pique · Votaciones · Quiniela · Bolsa del llano |
| **Perfil** | Carta, insignias, vitrina, trayectoria y muro. Desde aquí: cambiar de rol y liga, unirme a otra liga (código, QR o buscador), ajustes, ayuda e invitar amigos |

### 5.1 Los menús del Excel, en Chilena
Los `.`, `*` y `**` del Excel son niveles (tema → subtema → sub-subtema). Así quedan:

**Jugador**
- Notificaciones → campana
- Agenda de partidos → Inicio (tarjeta "Te toca el domingo") y En vivo
- Equipos → Perfil del equipo
  - Mensajes → botón al grupo de WhatsApp del equipo
  - Estadísticas → Mi liga / Goleo, y la carta
  - Mis evaluaciones → Perfil (privado)
  - Calendario del torneo → Mi liga / Rol de juegos
- Mi perfil → Perfil
  - Datos personales → Completar perfil y Ajustes
  - Mi trayectoria · Insignias · Comentarios → pestañas del perfil (el muro es la "porra")
- Seguir jugador → botón Seguir en cualquier perfil
- Buscar equipo (Zona · Categoría · Por día · Contactar delegado · Registro con equipo) → Búsqueda y Bolsa del llano
- Modificar perfil → Delegado / Árbitro → activar otro rol en la misma cuenta

**Delegado**
- Notificaciones, Agenda, Mi perfil y Seguir jugador → igual que el jugador
- Equipos → Gestión del equipo (pantalla 04)
  - Mensajes → WhatsApp
  - Estadísticas · Calendario del torneo → Mi liga
  - Evaluación de jugadores → después de cada partido (privado)
  - Pago de arbitraje → "Por pagar a la liga"
- Buscar jugadores → Contactar jugador (WhatsApp) · Registrar jugador (dar de alta)
- Buscar torneo → Zona · Categoría · Por día · Contactar liga · Registro con liga (código de liga)
- Modificar perfil → Jugador / Árbitro / Administrador de liga

**Aficionado**
- Notificaciones · Agenda de partidos
- Seguidos → Calendario de juegos (Inicio y En vivo de lo que sigo)
- Jugadores → Buscar · Seguir
- Equipos → Buscar equipo
- Mi perfil → Datos personales

**Liga**
- Notificaciones
- Administra torneo
  - Elegir jornada → y en esa jornada:
    - Editar resultados · Editar goleo · Editar sancionados
  - Estadísticas (de la jornada)
  - Pago de arbitrajes
  - Registros
    - Jugadores · Equipos · Árbitros · Canchas
- Envía mensajes → Avisos de la liga (notificación a delegados)
  - Elige torneo · Publica estadísticas (post automático de tabla y goleo)
- Genera nuevo torneo (asistente, pantalla 44)
  - Fecha de inicio · # de jornadas · Categoría · Día de la semana · Horarios · Costo de inscripción · Costo de arbitraje · Invitar árbitros · Invitar equipos · Generar calendario
- Mi perfil → Datos personales · Registrar administrador · Registrar gestor
- Modificar perfil → Jugador / Árbitro / Delegado

**Árbitro**
- Notificaciones · Agenda de partidos
- Partidos asignados
  - Confirmación (aceptar o "no puedo")
  - Cédulas
    - Equipos
      - Jugadores · Goles · Tarjetas
  - Enviar
- Mi perfil → Datos personales

**Visitante:** Buscar torneo · Buscar equipo · Buscar práctica (Bolsa / retas) · Buscar cancha.
**Plataforma:** "Registrarme o ingresar como" → entrar (el rol se deduce) · Buscar (torneo, cancha) · Quiénes somos · Últimas publicaciones (feed público).

---

## 6. Motor social (prioridad #1)

### 6.1 Feed (pantallas 05, 10)
- Pestañas: **Para ti** (algoritmo: lo que sigo + mi liga + mi zona + engagement reciente), **Golazos** (solo goles, portadas y MVP) y **Siguiendo** (cronológico).
- Se llena **solo** con lo que captura el árbitro y valida la liga ("Todo esto salió de la cédula de J. Mendoza").
- **Publicaciones automáticas** (`Post.type = AUTO_*`):
  - **Gol**, con tipo de gol ("DE CHILENA") → en el perfil del goleador.
  - **Resultado final** con goleadores.
  - **Crónica** (plantilla en la beta): titular + 2–3 líneas ("SUFRIÓ, PERO CUMPLIÓ").
  - **Once ideal de la jornada.**
  - **MVP** del partido.
  - **Tabla** ("Subimos al 2º").
  - **Insignia** ganada.
  - **Racha** ("4 partidos anotando").
  - **Campeón** (trofeo).
  - **Fichaje** ("La Pulga se va a Tigres del Llano").
  - **Nuevo torneo.**
  - **Cierre de temporada.**
- Reacciones: 🔥 Fuego · ⚽ Golazo · 🏆 Trofeo, más 💬 comentarios.
- Cada tarjeta trae su botón **WhatsApp** para compartir.

### 6.2 Publicar (pantalla 34)
- Texto (fotos y videos marcados "Próximamente" en la beta).
- Se puede **ligar a un partido o equipo** ("desde la banda · Portales vs Tigres") y **etiquetar** jugadores.
- Solo contenido de fútbol.

### 6.3 La porra (pantalla 35)
- Comentarios con respuestas en publicaciones y en el **muro** de jugadores y equipos.
- Reportar u ocultar.
- **Reglas del pique** (§8.9): carrilla sí; insultos, amenazas y discriminación no.

### 6.4 La Carta (pantallas 03, 06, 25)
Cada jugador tiene su **carta de crack** tipo FIFA: media, posición, foto, escudo y alcaldía.
- Al frente: GOL · PJ · AST.
- Al voltear: 6 atributos (distintos para el portero).
- Niveles: Bronce, Plata, Oro y Leyenda del Barrio, más cartas especiales.
- Se recalcula **cada lunes** ("↑ +2 esta jornada").
- Jugador nuevo: **"carta en construcción"** hasta su 3er partido.
- Fórmula completa en **`docs/CARTA_E_INSIGNIAS.md`**.

### 6.5 Rankings y pique (pantalla 27, dentro de Mi liga)
- **Rankings por zona y alcaldía:** "Mejores porteros de Iztapalapa", "Top 10 goleadores de la zona Oriente".
- **Duelo:** dos cartas lado a lado, atributo por atributo.
- **El clásico:** historial entre dos equipos (G-E-P, último resultado, goleador histórico del clásico).
- **Rachas** de la semana, la mejor y la peor.
- **Récords** del torneo: gol más rápido, goleada más grande, valla menos vencida.
- **Rankings con humor** ("El más tarjeteado"): **opcionales por liga** (`League.rankingsConHumor`, apagado por defecto).

### 6.6 Insignias (pantallas 14, 28)
**Para todos**, no solo para los que anotan. Coleccionables, con **rareza visible** ("solo el 3% la tiene") y progreso en las que faltan ("12 de 15 domingos"). El catálogo está en `docs/CARTA_E_INSIGNIAS.md` §4, incluidas **DE CHILENA** y **PIONERO**.

### 6.7 Votaciones (pantalla 12)
Votan **compañeros y aficionados**, con un toque por voto. Cierran a una hora fija (por ejemplo, domingo 22:00).
- **MVP del partido.**
- **Golazo de la jornada** (los 3 más reaccionados).
- **Once ideal** (posición por posición).
- **Atajada de la jornada.**
- **El Muro** (interna: votan solo los compañeros del portero).
- **Respeto (RES):** después del partido, **solo los rivales** califican el juego limpio de cada jugador del 1 al 5 (alimenta la carta).

### 6.8 Quiniela (pantalla 13)
**Sin dinero, puro orgullo.** Pronóstico de marcador con botones +/–. Da **3 puntos** si atinas al marcador y **1** si atinas a quién gana. Hay ranking por porra o equipo y por liga, y "Lo que dice la porra" (% de pronósticos). Cierra 1 minuto antes del partido.

### 6.9 La Portada (pantalla 26)
Cada lunes, por liga: **portada estilo tabloide** con el héroe de la jornada, titular pícaro, marcador grande y franja de resultados, en formato 1080×1920 para estados e historias. Sale **destacada arriba del feed del lunes**. En la beta, el titular sale de un **banco de plantillas** según el resultado (goleada, remontada, gol agónico, empate, etc.).

### 6.10 Plantillas para compartir (pantalla 21)
Resultado · Carta de crack · Golazo · MVP · "Subimos al 2º" · Hat-trick · Portada · Campeón. Se generan como imagen (OG dinámica, 1080×1920) y se comparten con un toque a WhatsApp o Instagram. Son el **motor de crecimiento gratis**.

### 6.11 Inicio según el día (pantalla 17)
| Día | El inicio muestra |
|---|---|
| Lunes | "ASÍ QUEDÓ LA J15", resultado de tu equipo, **vota el MVP**, tu portada, tu carta actualizada |
| Martes a jueves | "¿VAS EL DOMINGO?", quiniela, rankings, duelos |
| Sábado | "Calentamiento": el clásico de mañana, clima, quién va, la porra |
| Domingo | **EN VIVO**: tu partido, personas viendo, la porra ahorita |

### 6.12 Cierre de temporada (pantalla 22) y vitrina (22b)
- Al terminar el torneo, cada jugador recibe **"Tu Apertura 2026"**: 5 pantallas tipo historia (goles, partidos, tu mejor gol, tu compa de cancha —"los Brujichas"— y la tarjeta final para compartir).
- El campeón recibe un **trofeo** que se queda para siempre en el perfil del equipo y de cada jugador de la plantilla.

### 6.13 Bolsa del llano (pantalla 15)
- Tipos: **Busco jugador** (con "HOY · URGENTE"), **Busco equipo**, **Jugador libre**, **Falta 1 para la reta** y **Fichajes**.
- Filtro "Cerca de mí".
- **El contacto siempre es por WhatsApp.**
- Las publicaciones vencen solas.

### 6.14 Retas entre equipos (pantalla 30)
- Un delegado reta a otro equipo a un amistoso: día, cancha y "¿quién paga la cancha?".
- Al aceptarse se crea un partido `RETA`, que suma al **historial de clásicos** entre ambos (no a la tabla).

### 6.15 Nivel de hincha (pantalla 38)
El aficionado sube de nivel por equipo según participa: porra, marcadores reportados y votos. Ejemplo: "Porra de Hierro de Portales".

### 6.16 Estados vacíos (pantalla 16)
- Nunca una pantalla vacía y triste:
  - Liga nueva: "Tu liga ya tiene casa · ahora, a rodar el balón" (4 pasos).
  - Jugador sin goles: "Tu primer gol se va a ver así".
  - Aficionado que no sigue a nadie: sugerencias.

---

## 7. Operación de ligas

### 7.1 Liga
- Registrar la liga: el que la registra queda como Dueño. La liga recibe un **código de acceso** (ej. `TLAH-26`) para que los delegados se unan.
- Administradores y gestores.
- Canchas: sede y subcanchas.
- Configuración: aprobación de jugadores y rankings con humor.

### 7.2 Torneo (pantalla 44)
Asistente de 7 pasos:
1. Datos (nombre, categoría, tipo de fútbol, rama).
2. Calendario (fecha de inicio, # de jornadas, día, horarios, canchas).
3. Formato (liga, liga + liguilla, copa; ida o ida y vuelta).
4. Costos (inscripción y arbitraje).
5. Reglas (puntos; rojas: 1 partido; 5 amarillas: 1 partido; mínimo y máximo de jugadores).
6. Invitar equipos y árbitros (link, código o QR).
7. Generar rol.

Estados: `BORRADOR → INSCRIPCIONES_ABIERTAS → EN_CURSO → LIGUILLA → FINALIZADO`.

### 7.3 Rol de juegos (pantalla 45)
- Generación automática round-robin (método del círculo; descansos si son impares) asignando cancha y horario **sin choques**.
- Editable arrastrando, con aviso de choque.
- "Programar jornada" → publicar horarios (notificación).

### 7.4 Inscripciones (pantalla 49)
- Los equipos piden entrar y la liga aprueba.
- Los jugadores se registran en la plantilla del torneo; la liga los aprueba si lo configuró.
- **Regla:** un jugador **no puede estar en dos equipos del mismo torneo** ("Ya está registrado en Tigres en este torneo").

### 7.5 Árbitros (pantallas 48, 55)
- Alta en la liga (invitación o solicitud).
- La liga asigna el árbitro de cada partido y el árbitro **acepta o dice "no puedo"**.
- "Cobro de arbitraje hoy: $800 · se paga al cerrar cédula" (solo control).

### 7.6 Día de partido
1. **Pase de lista** (pantallas 04, 20):
   - El delegado manda el link al grupo de WhatsApp.
   - Cada jugador contesta **VOY / NO VOY sin cuenta y sin descargar nada** (`AttendanceLink`, eligiendo su nombre).
   - El delegado ve "11 de 16 ya contestaron que van" y manda recordatorio.
2. **Alineación** (pantalla 53):
   - Se arma con los confirmados, con alertas: **suspendido**, **cuota pendiente**, **no registrado en el torneo** o **registrado con otro equipo**.
   - Las alertas no bloquean; el delegado decide y la liga revisa. *(Pendiente: la pantalla 53 dice que el suspendido sí se bloquea → §13.6.)*
3. **Marcador en vivo desde la banda** (pantalla 32):
   - Aficionados y delegados lo actualizan ("¿Cambió el marcador?") y lo narran ("87' El Brujo, de chilena").
   - Es **NO OFICIAL** y se muestra con su chip.

### 7.7 La cédula (pantallas 02, 08b, 19, 46, 56)
**Captura del árbitro** en su celular. **El árbitro elige: en vivo o al terminar el partido.** El modo por defecto es **"llenar al terminar"**, como la cédula de papel:
- Elige equipo → marca quién jugó → goles (jugador, **tipo de gol** y minuto opcional), autogoles, penales fallados o atajados → tarjetas → cambios (opcional) → observaciones.
- **Funciona sin señal:** se guarda en el celular y se sube solo (cola local con `clientId`).
- Tiene modo **alto contraste**.

**Firma y corrección:**
1. El árbitro envía (`POR_FIRMAR`).
2. Cada delegado **revisa antes de firmar**. Si algo está mal, lo **señala**: jugador equivocado, minuto, tipo de evento, falta o sobra un evento, con comentario. La cédula queda **en pausa**.
3. El árbitro **acepta o rechaza** cada corrección.
4. Con ambas firmas → `FINALIZADO`. Las firmas pueden hacerse en el celular del árbitro, en la cancha, o en el de cada delegado después.
5. La **liga valida** (`VALIDADO`). Solo un partido validado cuenta para la tabla, el goleo, la carta, las insignias, las sanciones y la quiniela.

**Sin árbitro con celular:** la liga captura desde la cédula de papel (`ReportSource = PAPEL_LIGA`) y valida directo.

**Firmas pendientes:** si después de 48 h un delegado no firma ni señala, la liga puede validar igual.

### 7.8 Sanciones (pantalla 47)
- **Automáticas:** roja = 1 partido; 5 amarillas acumuladas = 1 partido (configurable).
- **Manuales:** partidos, multa, expulsión del torneo, pérdida del partido.
- Los partidos cumplidos se descuentan al validar cada jornada.
- **Alerta preventiva al jugador:** "Aguas: llevas 4 amarillas. Una más y te sientas un partido."
- *Pendiente de decidir:* cómo se ajusta una automática (§13.2), cuándo se reinician las amarillas (§13.3) y cómo se cobra una multa (§13.4).

### 7.9 "No hay juego", suspensión y reprogramación
- El **delegado no suspende**: avisa "No hay juego" y **la liga confirma**.
- El árbitro suspende **durante** su partido.
- La liga suspende o reprograma en cualquier momento.

### 7.10 Anticachirul
- Cada jugador tiene una **credencial con QR** (`User.qrToken`) y foto validada por la liga.
- La puede escanear el delegado rival o la liga.
- El árbitro puede marcar "posible cachirul" en la cédula → notifica a la liga.

### 7.11 Dinero (sin pasarela)
| Flujo | Cómo funciona |
|---|---|
| **Cuota del equipo** (delegado ↔ jugadores, pantallas 31, 54) | El delegado crea "Cuota de octubre $650". El jugador ve los datos de pago del delegado y toca **"YA PAGUÉ"** (queda *En revisión*); el delegado **confirma**. En la plantilla: Habilitado · Cuota pendiente |
| **Equipo → Liga** (inscripción, arbitraje y multas) | Cargo de la liga → "Por pagar a la liga" del delegado → "Ya pagué" → la liga confirma. Panel: "Cobrado en octubre $18,400 de $21,000" |
| **Liga → Árbitro** | Control de lo que se le debe y se le pagó por partido |

### 7.12 Moderación (pantalla 50)
Los **reportes de la porra** llegan al panel de la liga dueña del contenido. Acciones: Ocultar · Mantener · Avisar al usuario. El superadmin es respaldo.

### 7.13 Liguilla y campeón
- Al terminar la fase regular se proponen los cruces desde la tabla (editable). *(El desempate de la tabla está pendiente → §13.1.)*
- Semifinal y final generan posts especiales.
- Al cerrar el torneo: campeón, trofeo en la vitrina, insignias y **cierre de temporada** para todos.

---

## 8. Reglas que nunca se rompen (cada una con test)

1. **Marcador oficial = cédula firmada o capturada por la liga, y validada.** Lo de la banda y de los delegados es `LiveScoreUpdate`, siempre con etiqueta "no oficial".
2. **Solo `VALIDADO` cuenta** para tabla, goleo, carta, insignias, sanciones y quiniela.
3. **Cédula firmada = inmutable.** Después de la firma, solo la liga corrige, con motivo y `AuditLog`.
4. **Un jugador no puede estar en dos equipos del mismo torneo.**
5. **El delegado no suspende partidos**, solo solicita.
6. **RES (respeto) solo lo votan rivales**, y nadie vota por sí mismo ni por sus compañeros en RES.
7. **Dinero en centavos (Int), MXN.** La app nunca procesa pagos en la beta.
8. **Datos privados** (celular, emergencia, fecha de nacimiento, tallas, datos de pago) nunca llegan a componentes públicos: se usan selects explícitos (`publicUserSelect`).
9. **Reglas del pique:** no se filtran groserías ligeras; insultos, amenazas, discriminación y burlas sobre físico, edad o vida personal se reportan y se ocultan.
10. **Plantillas e IA solo usan datos reales** de la cédula; nunca inventan jugadas ni se burlan de una persona.
11. **Etiquetas:** quien sale etiquetado puede quitarse la etiqueta u ocultar el post de su perfil.
12. **Un perfil sin reclamar no recibe notificaciones** (no tiene cuenta) y su dueño puede reclamarlo una sola vez; si lo reclama otra persona por error, "No soy yo" lo revierte vía la liga.

---

## 9. Mapa de funciones del Excel (F-xxx)

Las 97 funciones de la hoja "Interacciones", con ID para rastrearlas en el código (`// F-030`). Son 98 IDs porque "Alta árbitro" la inician la liga (F-067) y el árbitro (F-069).

Leyenda de "Afecta": E = Equipo, J = Jugador, D = Delegado, A = Aficionado, L = Liga, Ár = Árbitro, V = Visitante, R = Redes sociales/compartir, S = Sistema.

### Aficionado
| ID | Función | Afecta | Implementación |
|---|---|---|---|
| F-001 | Registro aficionado (Excel: "Registro fan") | S | Entrar (Google/correo en la beta); rol Aficionado por defecto |
| F-002 | Seguir jugador | J | Seguir → notificación al jugador (si ya reclamó su perfil) |
| F-003 | Seguir equipo | E, D | Follow de equipo |
| F-004 | Comentario a jugador | J | Comentario en el muro del jugador (la porra) |
| F-005 | Comentario a equipo | E, J, D | Comentario en el muro del equipo (la porra) |

### Jugador
| ID | Función | Afecta | Implementación |
|---|---|---|---|
| F-006 | Registro jugador | S | Reclamar perfil o completar perfil de jugador (progresivo) |
| F-007 | Registro a equipo | E, D, A | Entrar por link/QR del delegado o solicitar unirse |
| F-008 | Seguir jugador | — | Follow |
| F-009 | Perfil | — | Perfil: carta, insignias, trayectoria, vitrina, muro |
| F-010 | Check in | E, D, A | Presente en cancha (delegado/capitán; QR opcional) |
| F-011 | No llego | E, D, A | Pase de lista: NO VOY (app o link sin cuenta) |
| F-012 | Estoy lastimado | E, D, A | Pase de lista: lesionado |
| F-013 | Baja del equipo | E, D, A | Salir del equipo |
| F-014 | Mensaje equipo | E, D, A | Botón al grupo de WhatsApp del equipo (sin chat interno) |
| F-015 | Publica en RRSS | D, A, R | Publicar + compartir plantilla a WhatsApp/Instagram |
| F-016 | Alta jugador | E, D, A | Aceptar invitación / reclamar perfil dado de alta |
| F-017 | Etiquetado | — | Etiquetar en publicaciones |
| F-018 | Confirmación asistencia | E, D, A | Pase de lista: VOY (app o link sin cuenta) |
| F-019 | Buscar equipo | D | Búsqueda + Bolsa del llano (contacto por WhatsApp) |
| F-020 | Notifica marcador | E, D | Marcador en vivo desde la banda (no oficial) |

### Delegado
| ID | Función | Afecta | Implementación |
|---|---|---|---|
| F-021 | Registro delegado | S | Se activa al crear un equipo |
| F-022 | Evaluación jugador | J | Evaluación privada después del partido (no afecta la carta) |
| F-023 | Registro jugador | J, L | Dar de alta jugador (perfil sin reclamar) y registrarlo en el torneo |
| F-024 | Perfil | — | Perfil |
| F-025 | Registro equipo | E, J, L | Crear equipo e inscribirlo a un torneo con el código de la liga |
| F-026 | Seguir jugador | J | Follow |
| F-027 | Check in | E | Pase de lista en cancha (presente) |
| F-028 | Baja equipo | E, J, L | Dar de baja al equipo de un torneo (solicitud a la liga) |
| F-029 | Publica en RRSS | R | Publicar como equipo |
| F-030 | Alineación | E, J, A, L, Ár | Alineación con alertas (suspendido, cuota, no registrado, otro equipo) |
| F-031 | Mensaje equipo | E, J | Botón al grupo de WhatsApp del equipo |
| F-032 | No hay juego | E, J, A | "No hay juego": solicitud que la liga confirma |
| F-033 | Marcador partido | E, J, A, L | Marcador desde la banda + revisión/firma de cédula |
| F-034 | Goles | E, J, A, L | Señalar goles en la revisión de cédula (corrección) |
| F-035 | Suspensión de partido | E, J, A | = F-032 (solicitud), ver §7.9 |
| F-036 | Buscar jugador | J | Búsqueda + Bolsa (jugador libre); contacto por WhatsApp |
| F-037 | Buscar liga | L | Búsqueda de ligas + unirse con código |
| F-038 | Notifica marcador | A, L, Ár | Marcador desde la banda |
| F-039 | Notificar horario partido | E, J, A | Recordatorio del pase de lista al grupo |

### Liga
| ID | Función | Afecta | Implementación |
|---|---|---|---|
| F-040 | Registro administrador | S | Agregar administrador / gestor |
| F-041 | Suspensión partido | E, J, D, A, Ár | Suspender o reprogramar |
| F-042 | Registrar liga | S | Crear liga |
| F-043 | Nuevo torneo | E, J, D, S | Asistente de torneo |
| F-044 | Adeudo arbitraje | D | Cargo de arbitraje al equipo ("Ya pagué / Confirmar") |
| F-045 | Registro cancha | S | Alta de cancha |
| F-046 | Horarios próxima jornada | E, J, D, A | Publicar jornada |
| F-047 | Calendario torneo | E, J, D, A | Generar y publicar calendario |
| F-048 | Registros abiertos | D, S | Abrir inscripciones y notificar |
| F-049 | Asigna árbitro | Ár | Asignación |
| F-050 | Resultados de jornada | E, J, D, A | Validar jornada → auto-posts de resultados, crónica, portada |
| F-051 | Publicación de estadísticas | E, J, D, A | Auto-post de tabla y goleo + once ideal |
| F-052 | Alta equipo | E, D | Aprobar la inscripción |
| F-053 | Baja equipo | E, J, D, A | Dar de baja al equipo del torneo |
| F-054 | Alta jugador | E, J, D, A | Aprobar el registro del jugador |
| F-055 | Baja jugador | E, J, D, A | Dar de baja al jugador del torneo |
| F-056 | Suspensión jugador | E, J, D, A, Ár | Sanción (automática o manual) + alerta preventiva |
| F-057 | Inicio liguilla | E, J, D, A, R | Cruces de liguilla + post especial |
| F-058 | Equipo campeón | E, J, D, A, R | Cerrar torneo → trofeo, vitrina, insignias, cierre de temporada |
| F-059 | Semifinales | E, J, D, A, R | Fase |
| F-060 | Final | E, J, D, A, R | Fase |
| F-061 | Buscar equipos | D | Explorar e invitar |
| F-062 | Buscar árbitros | Ár | Explorar e invitar |
| F-063 | Buscar cancha | S | Explorar canchas |
| F-064 | Próximo torneo | E, J, D, A, R, S | Post de nuevo torneo + plantilla para compartir |
| F-065 | Valida marcador | E, J, D, A | Validar resultado (después de firmas) |
| F-066 | Registro árbitro | S | Alta de árbitro en la liga |
| F-067 | Alta árbitro | Ár | Aprobar la solicitud del árbitro |

### Árbitro
| ID | Función | Afecta | Implementación |
|---|---|---|---|
| F-068 | Aceptación asignación | L | Aceptar / "No puedo" |
| F-069 | Alta árbitro | L | Solicitud de alta a una liga |
| F-070 | Alineación | E, J, D, A, L | Marcar quién jugó en la cédula |
| F-071 | Tarjetas | E, J, D, A, L | Evento |
| F-072 | Penal | E, J, D, A, L | Evento |
| F-073 | Gol | E, J, D, A, L | Gol con tipo de gol y minuto opcional |
| F-074 | Cambio | E, J, D, A, L | Evento |
| F-075 | Fin del partido | E, J, D, A, L | Evento |
| F-076 | Inicio de partido | E, J, D, A, L | Evento |
| F-077 | Resultado partido | E, J, D, A, L | Cerrar marcador de la cédula |
| F-078 | Cédula partido | L | Enviar cédula → firmas de delegados |
| F-079 | Cachirul | E, D, L | Marcar posible cachirul (credencial QR) |
| F-080 | Jugador lesión grave | E, D, L | Lesión grave → aviso a liga y delegado (contacto de emergencia visible) |
| F-081 | Suspensión partido | E, J, D, A, L | Suspender en cancha |
| F-082 | Buscar liga | L | Explorar ligas |
| F-083 | Notifica marcador | E, J, D, L | Marcador en vivo (si captura en vivo) |

### Sistema
| ID | Función | Afecta | Implementación |
|---|---|---|---|
| F-084 | Publicar resultados | E, J, D, A | Auto-posts al validar |
| F-085 | Evaluación jugadores | D | Pide al delegado evaluar (privado) |
| F-086 | Jugadores evaluados | J | Notifica al jugador (privado) |
| F-087 | Jugador no registrado | E, J, D, L, Ár | Validación de alineación |
| F-088 | Jugador registrado con otro equipo | E, J, D, L, Ár | Validación de alineación |
| F-089 | Jugador sancionado | E, J, D, L, Ár | Validación de alineación |
| F-090 | Confirmar asistencia jugadores | E, J, D | Pase de lista automático + link para WhatsApp |
| F-091 | Jugador confirma asistencia | E, D, A, L | Avisa al delegado |
| F-092 | Resultados 1era división | E, J, D, A, Ár | Fútbol Pro (Liga MX) — oculto en la beta; si se refiere a 1ra división de la liga, es la tabla de esa división |

### Visitante
| ID | Función | Afecta | Implementación |
|---|---|---|---|
| F-093 | Buscar cancha | S | Explorar público |
| F-094 | Buscar liga | L | Explorar público |
| F-095 | Buscar partido | S | Explorar público |
| F-096 | Buscar jugador | J, S | Explorar público (solo perfil público) |
| F-097 | Buscar árbitro | Ár, S | Explorar público |
| F-098 | Buscar transmisión partido | — | Partidos con link de transmisión (Partido en vivo) |

---

---

## 10. Privacidad y legal (México)

- **Aviso de privacidad y términos** visibles al entrar, con consentimiento registrado. **Obligatorios antes de abrir la beta a gente real** (que los revise un abogado).
- Derechos ARCO: en Ajustes, descargar mis datos y borrar mi cuenta.
- Celular, contacto de emergencia, fecha de nacimiento, tallas y datos de pago: **nunca públicos**.
- Perfiles sin reclamar: solo muestran apodo, número, posición y estadísticas; nunca el celular que haya capturado el delegado.
- Sin menores en la beta (no existe la categoría infantil).
- Reportar y bloquear disponible en todo contenido de personas.

---

## 11. Métricas de éxito de la beta

| Métrica | Meta |
|---|---|
| Jugadores dados de alta que **reclaman su perfil** | ≥ 60% |
| Usuarios que **regresan el lunes** (resultados, carta, portada) | ≥ 40% |
| Usuarios que **comentan, votan o pronostican** cada semana | ≥ 30% |
| Respuestas al **pase de lista** por link | ≥ 70% de la plantilla |
| Cédulas **validadas en menos de 48 h** | ≥ 80% |
| Fallas reportadas resueltas por semana | Tendencia a la baja |

Se miden con PostHog (eventos en `docs/MODULOS.md` §5).

---

## 12. Después de la beta (backlog)

- Fotos y videos en publicaciones; video ligado al gol; video como prueba en correcciones; foto de la cédula de papel.
- Entrar con código por WhatsApp; notificaciones por WhatsApp Business API.
- IA para crónicas, titulares y portada.
- Fútbol Pro (Liga MX).
- Categoría infantil con tutor.
- Chat interno (si la beta lo pide).
- Pagos dentro de la app; planes (jugador pro, liga pro); patrocinios locales.
- Dominio propio (migrar desde `*.vercel.app` con redirección).

---

## 13. Decisiones pendientes (propuestas)

> **Estado: por decidir.** Salieron al armar la liga demo y en la revisión de la Fase 0. Cada una trae opciones, una recomendación y lo que cambia en el código. Cuando se decida, se pasa la regla a su sección (§7.x), se borra de aquí y se agrega el test. Mientras tanto, el código marca estas reglas como **provisionales** y nadie las debe copiar como definitivas.

### 13.1 Desempate de la tabla
**Hoy:** el PRD solo fija los puntos (3 por ganar, 1 por empatar, configurables en el torneo). No dice qué pasa si dos equipos empatan en puntos, y eso define la posición, "Subimos al 2º" y los cruces de liguilla (§7.13).

| Opción | Orden |
|---|---|
| **A** (estilo Liga MX) | Puntos → diferencia de goles → goles a favor → resultado entre ellos → juego limpio → sorteo de la liga |
| **B** (estilo europeo) | Puntos → resultado entre ellos → diferencia de goles → goles a favor → juego limpio → sorteo |
| **C** | Configurable por torneo en el paso 5 del asistente (§7.2), con A por defecto |

- *Resultado entre ellos:* puntos (y luego diferencia) solo en los partidos entre los empatados.
- *Juego limpio:* menos puntos de tarjetas en el torneo: amarilla 1, roja 3.
- *Sorteo:* lo marca la liga a mano, con motivo y bitácora.
- Solo cuentan partidos **VALIDADOS** (regla 2).

**Recomendación: A fija en la beta.** Es la que el llanero conoce por la Liga MX y se explica en una línea. C se puede dejar para después de la beta.
**Si se aprueba:** el servicio puro de tabla de `ligas` implementa A con un test por criterio. La semilla demo ya ordena por los tres primeros (sin empates en puntos) y pasaría a usar ese servicio.

### 13.2 Una sanción automática que la liga ajusta
**Hoy:** la roja genera 1 partido automático (§7.8) y la liga puede poner sanciones manuales. El panel de la liga (deck, lámina 18) muestra "Desde la cédula J14 · #4 La Roca · roja directa al 71' · APLICAR: 2 PARTIDOS". No está definido si eso **reemplaza** al partido automático o **se suma**.

| Opción | Cómo queda |
|---|---|
| **A** Ajustar la misma | La roja crea su sanción automática (1 partido). La liga la sube, la baja o la anula **en la misma sanción**, con motivo y bitácora (antes → después). Una sanción por hecho |
| **B** Sumar | La automática se queda (1) y la liga crea otra manual (+1). El total es la suma de las dos |

**Recomendación: A.** El delegado y el jugador ven una sola cosa ("2 partidos · roja en J14"), el cumplimiento se descuenta de un solo contador y el historial queda en la bitácora.
**Si se aprueba:** no cambia el schema; `Sanction.automatica` significa "nació de la cédula", aunque la liga la haya ajustado. La semilla pasa La Roca a una sanción automática ajustada de 1 a 2 partidos, con su bitácora `UPDATE`.

### 13.3 Amarillas acumuladas
**Hoy:** "5 amarillas acumuladas = 1 partido (configurable)" y la alerta "Aguas: llevas 4". Falta definir:

1. **¿Se reinicia el conteo?** Recomendación: al llegar a 5 se crea la suspensión y el acumulado vuelve a 0 (la siguiente sale con 5 más).
2. **Doble amarilla en un partido:** recomendación: se captura como expulsión (`ROJA`) y vale 1 partido como roja; esas 2 amarillas **no** suman al acumulado.
3. **Liguilla:** recomendación: el acumulado vuelve a 0 al empezar la liguilla. Las suspensiones pendientes sí se cumplen.

**Si se aprueba:** servicio puro de sanciones con test de cada caso. La alerta preventiva usa el acumulado y no el total del torneo.

### 13.4 Multas
**Hoy:** la multa es una sanción manual (§7.8) y un cobro de la liga al equipo (§7.11). El deck la muestra en "Por pagar a la liga" ("Multa · roja de La Roca · $300"), pero no hay nada que ligue las dos cosas.

**Recomendación:**
- Una sanción puede llevar partidos **y** multa a la vez (`partidos` y `multaCents` ya existen).
- Si trae multa, se crea su cargo `LeagueCharge` tipo `MULTA` por el mismo monto, en centavos (regla 7).
- La sanción y el cargo quedan ligados, así se ve en la pantalla 47 y en el "Por pagar a la liga" del delegado.
- Condonar la multa se hace en el cargo (`CONDONADO`), con bitácora.

**Si se aprueba:** necesita un campo `sanctionId` en `LeagueCharge` → **lo decide el dueño del schema**. Hoy la semilla solo crea el cargo.

### 13.5 "Domingos sin faltar" (racha de asistencia)
**Hoy:** las insignias `DOMINGOS_5/12/25` usan `attendance_streak` y la carta guarda `rachaAsistencia`, pero no está definido qué cuenta como "ir". CON (constancia, `docs/CARTA_E_INSIGNIAS.md`) usa "fue y jugó".

| Opción | Cuenta como domingo |
|---|---|
| **A** Jugó | Aparece en la cédula y entró a la cancha (`jugo`) |
| **B** Fue | Aparece en la alineación de la cédula, aunque se quedara en la banca |
| **C** Dijo que iba | Contestó VOY en el pase de lista |

**Recomendación: B.** Lo que se premia es presentarse, y el que va a la banca cada domingo también es constancia. CON sigue midiendo "fue y jugó", que es otra cosa.
- **Pausa en lugar de corte:** los domingos sin partido de su equipo (descanso, "No hay juego", partido suspendido o reprogramado) ni suman ni cortan.
- **Suspensión:** recomendación: también es pausa (la sanción ya castiga); la alternativa es que corte.

**Si se aprueba:** `rachaAsistencia` y el progreso de las insignias usan B. Hoy la semilla usa A y está marcada como provisional.

### 13.6 ¿Qué alertas de la alineación bloquean?
**Hoy:** §7.6 dice que las alertas no bloquean, pero la pantalla 53 dice "ROJO = NO PUEDE · lo bloquea la liga".

**Recomendación: dos niveles.**
- **Bloquean** (no pueden entrar a la cédula):
  - Registrado con otro equipo del torneo: rompe la regla 4.
  - Suspendido con sanción activa.
  - No registrado en el torneo: la liga lo puede registrar en ese momento.
- **Solo avisan:** cuota pendiente con el equipo, que es asunto interno del equipo.
- En el pase de lista el suspendido **sí aparece**, con su nota (así cuadra "11 de 16"), pero no se puede alinear.

**Si se aprueba:** se corrige §7.6. La alineación (O3) valida en el servidor con `assertCan()` y deja la lista de bloqueos en `Lineup.alerts`.

