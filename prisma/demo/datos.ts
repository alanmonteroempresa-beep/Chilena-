// Liga demo del deck: Liga Dominical Iztapalapa · Apertura 2026 (docs/ROADMAP.md, Fase 0).
// Apodos, números y posiciones salen de docs/fuentes/Pelotazo_Pantallas.pptx (pantallas 03, 04, 12, 18, 32, 56)
// y de docs/diseno. Los nombres reales son inventados. Datos privados (celular, nacimiento) se dejan vacíos.

export type Posicion = "POR" | "DFC" | "LAT" | "MCD" | "MC" | "MCO" | "EXT" | "DC";
export type Zona = "NORTE" | "SUR" | "ORIENTE" | "PONIENTE" | "CENTRO";
export type ClaveEquipo = "DP" | "TL" | "RC" | "JT" | "AP" | "UD" | "SN" | "HI";

export type JugadorDemo = {
  numero: number;
  nombre: string;
  apellidos: string;
  sobrenombre?: string;
  posicion: Posicion;
  zurdo?: boolean;
};

export type EquipoDemo = {
  clave: ClaveEquipo;
  slug: string;
  nombre: string;
  /** Nombre corto para titulares y el rol: "Portales" */
  corto: string;
  colorPrimario: string;
  colorSecundario: string;
  zona: Zona;
  alcaldia: string;
  /** Número del delegado principal (también juega) */
  delegado: number;
  /** Número del capitán */
  capitan: number;
  /** Fuerza relativa para que los resultados se vean creíbles (0–1) */
  fuerza: number;
  /** Once y banca propios (si no, TITULARES y BANCA) */
  titulares?: readonly number[];
  banca?: readonly number[];
  jugadores: JugadorDemo[];
};

/** 4-4-2 habitual por número (portero, laterales, centrales, medios, delanteros) */
export const TITULARES = [1, 2, 3, 4, 13, 6, 8, 10, 7, 9, 11] as const;
/** Orden de la banca */
export const BANCA = [14, 5, 16, 15, 12] as const;

export const LIGA = {
  slug: "dominical-iztapalapa",
  nombre: "Liga Dominical Iztapalapa",
  siglas: "LDI",
  codigoAcceso: "TLAH-26",
  zona: "ORIENTE" as Zona,
  alcaldia: "Iztapalapa",
  descripcion: "Fútbol llanero los domingos en el Deportivo Cuitláhuac.",
};

export const SEDE = {
  slug: "deportivo-cuitlahuac",
  nombre: "Deportivo Cuitláhuac",
  direccion: "Iztapalapa, Ciudad de México",
  alcaldia: "Iztapalapa",
  zona: "ORIENTE" as Zona,
  canchas: ["Cancha 1", "Cancha 2", "Cancha 3"],
};

export const TORNEO = {
  slug: "apertura-2026",
  nombre: "Apertura 2026",
  numJornadas: 18,
  jornadasJugadas: 15,
  horarios: ["09:00", "11:00", "14:00", "16:00"],
  /** Cancha de cada horario (índice en SEDE.canchas), como el rol de la J16 en el panel de la liga */
  canchaPorHorario: [0, 1, 2, 0],
  duracionPartidoMin: 90,
  costoInscripcionCents: 250_000,
  costoArbitrajeCents: 65_000,
};

export const ORGANIZADOR = { nombre: "Antonio", apellidos: "Gutiérrez", sobrenombre: "Don Toño" };

export const ARBITROS = [
  { clave: "mendoza", nombre: "Jorge", apellidos: "Mendoza", temporadas: 6 },
  { clave: "pacheco", nombre: "Rubén", apellidos: "Pacheco", temporadas: 3 },
  { clave: "ortega", nombre: "Luis", apellidos: "Ortega", temporadas: 4 },
] as const;
export type ClaveArbitro = (typeof ARBITROS)[number]["clave"];
export const TARIFA_ARBITRO_CENTS = 40_000;

export const AFICIONADA = { nombre: "Guadalupe", apellidos: "Hernández", sobrenombre: "Doña Lupe" };

export const EQUIPOS: EquipoDemo[] = [
  {
    clave: "DP",
    slug: "dep-portales",
    nombre: "Dep. Portales",
    corto: "Portales",
    colorPrimario: "#0250B0",
    colorSecundario: "#FFFFFF",
    zona: "CENTRO",
    alcaldia: "Benito Juárez",
    delegado: 3,
    capitan: 3,
    fuerza: 0.9,
    jugadores: [
      { numero: 1, nombre: "Óscar", apellidos: "Méndez", sobrenombre: "El Gato", posicion: "POR" },
      { numero: 2, nombre: "Patricio", apellidos: "Nava", sobrenombre: "Pato", posicion: "LAT" },
      { numero: 3, nombre: "Guillermo", apellidos: "Salas", sobrenombre: "Memo", posicion: "DFC" },
      { numero: 4, nombre: "Ramón", apellidos: "Ortiz", sobrenombre: "La Roca", posicion: "DFC" },
      { numero: 5, nombre: "Rodrigo", apellidos: "Campos", sobrenombre: "El Cuervo", posicion: "DFC" },
      { numero: 6, nombre: "Daniel", apellidos: "Cruz", sobrenombre: "El Flaco", posicion: "MC" },
      { numero: 7, nombre: "Iván", apellidos: "Torres", sobrenombre: "La Pulga", posicion: "EXT" },
      { numero: 8, nombre: "Antonio", apellidos: "Juárez", sobrenombre: "Toñito", posicion: "MC" },
      { numero: 9, nombre: "Luis Ángel", apellidos: "Ramírez", sobrenombre: "El Chícharo", posicion: "DC" },
      { numero: 10, nombre: "Ernesto", apellidos: "Vega", sobrenombre: "El Brujo", posicion: "MCO" },
      { numero: 11, nombre: "Alberto", apellidos: "Rojas", sobrenombre: "Beto", posicion: "EXT" },
      { numero: 12, nombre: "Eduardo", apellidos: "Luna", sobrenombre: "Lalo", posicion: "POR" },
      {
        numero: 13,
        nombre: "Carlos",
        apellidos: "Aguilar",
        sobrenombre: "Charly",
        posicion: "LAT",
        zurdo: true,
      },
      { numero: 14, nombre: "Enrique", apellidos: "Morales", sobrenombre: "Kike", posicion: "DC" },
      { numero: 15, nombre: "Raúl", apellidos: "Bautista", sobrenombre: "Rambo", posicion: "MC" },
      { numero: 16, nombre: "Mario", apellidos: "Delgado", posicion: "MCD" },
    ],
  },
  {
    clave: "TL",
    slug: "tigres-del-llano",
    nombre: "Tigres del Llano",
    corto: "Tigres",
    colorPrimario: "#F28C1B",
    colorSecundario: "#050608",
    zona: "ORIENTE",
    alcaldia: "Iztapalapa",
    delegado: 6,
    capitan: 9,
    fuerza: 0.85,
    jugadores: [
      { numero: 1, nombre: "Julio", apellidos: "Sandoval", sobrenombre: "El Pulpo", posicion: "POR" },
      { numero: 2, nombre: "Rubén", apellidos: "Castillo", posicion: "LAT" },
      { numero: 3, nombre: "Héctor", apellidos: "Domínguez", sobrenombre: "El Toro", posicion: "DFC" },
      { numero: 4, nombre: "Gerardo", apellidos: "Cárdenas", posicion: "DFC" },
      { numero: 5, nombre: "Miguel Ángel", apellidos: "Soto", posicion: "DFC" },
      { numero: 6, nombre: "Alfonso", apellidos: "Ibarra", sobrenombre: "Poncho", posicion: "MCD" },
      { numero: 7, nombre: "Diego", apellidos: "Navarro", sobrenombre: "El Rayo", posicion: "EXT" },
      { numero: 8, nombre: "Fernando", apellidos: "Medina", posicion: "MC" },
      { numero: 9, nombre: "Arturo", apellidos: "Villalobos", sobrenombre: "El Tanque", posicion: "DC" },
      { numero: 10, nombre: "Jesús", apellidos: "Herrera", sobrenombre: "El Mago", posicion: "MCO" },
      { numero: 11, nombre: "Hugo", apellidos: "Salinas", posicion: "EXT", zurdo: true },
      { numero: 12, nombre: "Ignacio", apellidos: "Pérez", sobrenombre: "Nacho", posicion: "POR" },
      { numero: 13, nombre: "Sergio", apellidos: "Lara", posicion: "LAT" },
      { numero: 14, nombre: "Omar", apellidos: "Fuentes", posicion: "MC" },
      { numero: 15, nombre: "Jonathan", apellidos: "Ruiz", posicion: "DC" },
      { numero: 16, nombre: "Brayan", apellidos: "Ochoa", posicion: "MC" },
    ],
  },
  {
    clave: "RC",
    slug: "real-condesa",
    nombre: "Real Condesa",
    corto: "Condesa",
    colorPrimario: "#8A1C2B",
    colorSecundario: "#FFFFFF",
    zona: "CENTRO",
    alcaldia: "Cuauhtémoc",
    delegado: 4,
    capitan: 4,
    fuerza: 0.75,
    // El Güero (#5) es titular: en la cédula de la J15 lo amonestan al 58'
    titulares: [1, 2, 4, 5, 13, 6, 8, 10, 7, 9, 11],
    banca: [14, 3, 16, 15, 12],
    jugadores: [
      { numero: 1, nombre: "Francisco", apellidos: "Olvera", sobrenombre: "El Muro", posicion: "POR" },
      { numero: 2, nombre: "Marco Antonio", apellidos: "Gil", posicion: "LAT" },
      { numero: 3, nombre: "Ulises", apellidos: "Mora", posicion: "DFC" },
      { numero: 4, nombre: "Salvador", apellidos: "Ríos", sobrenombre: "Chava", posicion: "DFC" },
      { numero: 5, nombre: "Andrés", apellidos: "Quintero", sobrenombre: "El Güero", posicion: "DFC" },
      { numero: 6, nombre: "Emilio", apellidos: "Rangel", posicion: "MCD" },
      { numero: 7, nombre: "Josué", apellidos: "Becerra", posicion: "EXT" },
      { numero: 8, nombre: "Samuel", apellidos: "Ponce", posicion: "MC" },
      { numero: 9, nombre: "Gustavo", apellidos: "Treviño", sobrenombre: "El Pelón", posicion: "DC" },
      { numero: 10, nombre: "Rafael", apellidos: "Montes", sobrenombre: "El Profe", posicion: "MCO" },
      { numero: 11, nombre: "Kevin", apellidos: "Esquivel", posicion: "EXT" },
      { numero: 12, nombre: "Leonardo", apellidos: "Barrera", sobrenombre: "Leo", posicion: "POR" },
      { numero: 13, nombre: "Christian", apellidos: "Peña", posicion: "LAT", zurdo: true },
      { numero: 14, nombre: "Pablo", apellidos: "Arellano", posicion: "MC" },
      { numero: 15, nombre: "Abraham", apellidos: "Lozano", posicion: "DC" },
      { numero: 16, nombre: "Martín", apellidos: "Valdez", posicion: "MC" },
    ],
  },
  {
    clave: "JT",
    slug: "juventud-tepito",
    nombre: "Juventud Tepito",
    corto: "Tepito",
    colorPrimario: "#1E7B3A",
    colorSecundario: "#FFFFFF",
    zona: "CENTRO",
    alcaldia: "Cuauhtémoc",
    delegado: 6,
    capitan: 5,
    fuerza: 0.6,
    jugadores: [
      { numero: 1, nombre: "Germán", apellidos: "Espinoza", posicion: "POR" },
      { numero: 2, nombre: "Francisco", apellidos: "Tapia", sobrenombre: "Paco", posicion: "LAT" },
      { numero: 3, nombre: "Ricardo", apellidos: "Zamora", posicion: "DFC" },
      { numero: 4, nombre: "Alan", apellidos: "Robles", posicion: "DFC" },
      { numero: 5, nombre: "Noé", apellidos: "Cervantes", sobrenombre: "El Jefe", posicion: "DFC" },
      { numero: 6, nombre: "José", apellidos: "Lugo", sobrenombre: "Pepe", posicion: "MCD" },
      { numero: 7, nombre: "Jesús", apellidos: "Arriaga", sobrenombre: "Chuy el Rápido", posicion: "EXT" },
      { numero: 8, nombre: "Manuel", apellidos: "Ávila", posicion: "MC" },
      { numero: 9, nombre: "Saúl", apellidos: "Carrillo", sobrenombre: "El Tlacuache", posicion: "DC" },
      { numero: 10, nombre: "Erick", apellidos: "Galindo", posicion: "MCO" },
      { numero: 11, nombre: "Bruno", apellidos: "Mejía", posicion: "EXT" },
      { numero: 12, nombre: "Iker", apellidos: "Solís", posicion: "POR" },
      { numero: 13, nombre: "Joel", apellidos: "Pineda", posicion: "LAT" },
      { numero: 14, nombre: "Tomás", apellidos: "Cabrera", posicion: "MC" },
      { numero: 15, nombre: "Axel", apellidos: "Rosales", posicion: "DC" },
      { numero: 16, nombre: "Edgar", apellidos: "Montiel", posicion: "MC" },
    ],
  },
  {
    clave: "AP",
    slug: "atletico-pensil",
    nombre: "Atlético Pensil",
    corto: "Pensil",
    colorPrimario: "#F2C230",
    colorSecundario: "#07090C",
    zona: "PONIENTE",
    alcaldia: "Miguel Hidalgo",
    delegado: 8,
    capitan: 4,
    fuerza: 0.55,
    jugadores: [
      { numero: 1, nombre: "Moisés", apellidos: "Arteaga", posicion: "POR" },
      { numero: 2, nombre: "Cristóbal", apellidos: "Leyva", posicion: "LAT" },
      { numero: 3, nombre: "Efraín", apellidos: "Ocampo", posicion: "DFC" },
      { numero: 4, nombre: "Adrián", apellidos: "Varela", sobrenombre: "El Capi", posicion: "DFC" },
      { numero: 5, nombre: "Lorenzo", apellidos: "Bernal", posicion: "DFC" },
      { numero: 6, nombre: "Guillermo", apellidos: "Téllez", sobrenombre: "Memín", posicion: "MCD" },
      {
        numero: 7,
        nombre: "Mauricio",
        apellidos: "Salcedo",
        sobrenombre: "El Zurdo",
        posicion: "EXT",
        zurdo: true,
      },
      { numero: 8, nombre: "Octavio", apellidos: "Reyna", sobrenombre: "Tavo", posicion: "MC" },
      { numero: 9, nombre: "Alexis", apellidos: "Murillo", posicion: "DC" },
      { numero: 10, nombre: "Rodolfo", apellidos: "Ibáñez", posicion: "MCO" },
      { numero: 11, nombre: "Damián", apellidos: "Corona", posicion: "EXT" },
      { numero: 12, nombre: "Gael", apellidos: "Paredes", posicion: "POR" },
      { numero: 13, nombre: "Isaac", apellidos: "Robledo", posicion: "LAT" },
      { numero: 14, nombre: "Gilberto", apellidos: "Nájera", posicion: "MC" },
      { numero: 15, nombre: "Néstor", apellidos: "Ugalde", posicion: "DC" },
      { numero: 16, nombre: "Fabián", apellidos: "Quiroz", posicion: "MC" },
    ],
  },
  {
    clave: "UD",
    slug: "union-doctores",
    nombre: "Unión Doctores",
    corto: "Doctores",
    colorPrimario: "#FFFFFF",
    colorSecundario: "#C8102E",
    zona: "CENTRO",
    alcaldia: "Cuauhtémoc",
    delegado: 6,
    capitan: 3,
    fuerza: 0.45,
    jugadores: [
      { numero: 1, nombre: "Benjamín", apellidos: "Uribe", posicion: "POR" },
      { numero: 2, nombre: "Román", apellidos: "Pliego", posicion: "LAT" },
      { numero: 3, nombre: "Ismael", apellidos: "Garza", posicion: "DFC" },
      { numero: 4, nombre: "Óscar", apellidos: "Villa", posicion: "DFC" },
      { numero: 5, nombre: "Teodoro", apellidos: "Ruelas", posicion: "DFC" },
      { numero: 6, nombre: "Jaime", apellidos: "Orozco", sobrenombre: "El Doc", posicion: "MCD" },
      { numero: 7, nombre: "Ángel", apellidos: "Bustos", posicion: "EXT" },
      { numero: 8, nombre: "Nicolás", apellidos: "Estrada", posicion: "MC" },
      { numero: 9, nombre: "Héctor", apellidos: "Saldaña", sobrenombre: "El Cañonero", posicion: "DC" },
      { numero: 10, nombre: "Ezequiel", apellidos: "Rivas", posicion: "MCO" },
      { numero: 11, nombre: "Lucas", apellidos: "Montoya", posicion: "EXT" },
      { numero: 12, nombre: "Ernesto", apellidos: "Pardo", posicion: "POR" },
      { numero: 13, nombre: "Aldo", apellidos: "Cisneros", posicion: "LAT" },
      { numero: 14, nombre: "Valentín", apellidos: "Ayala", posicion: "MC" },
      { numero: 15, nombre: "Rogelio", apellidos: "Peralta", posicion: "DC" },
      { numero: 16, nombre: "Sebastián", apellidos: "Gallardo", posicion: "MC" },
    ],
  },
  {
    clave: "SN",
    slug: "sporting-narvarte",
    nombre: "Sporting Narvarte",
    corto: "Narvarte",
    colorPrimario: "#0AA2C0",
    colorSecundario: "#FFFFFF",
    zona: "CENTRO",
    alcaldia: "Benito Juárez",
    delegado: 6,
    capitan: 10,
    fuerza: 0.35,
    jugadores: [
      { numero: 1, nombre: "Eric", apellidos: "Hidalgo", posicion: "POR" },
      { numero: 2, nombre: "Gonzalo", apellidos: "Pizano", posicion: "LAT" },
      { numero: 3, nombre: "Ramiro", apellidos: "Escobar", posicion: "DFC" },
      { numero: 4, nombre: "Fausto", apellidos: "Leal", sobrenombre: "El Muralla", posicion: "DFC" },
      { numero: 5, nombre: "Óliver", apellidos: "Cano", posicion: "DFC" },
      { numero: 6, nombre: "Javier", apellidos: "Toledo", sobrenombre: "Javi", posicion: "MCD" },
      { numero: 7, nombre: "Simón", apellidos: "Camacho", posicion: "EXT" },
      { numero: 8, nombre: "Esteban", apellidos: "Prado", posicion: "MC" },
      { numero: 9, nombre: "Elías", apellidos: "Nieto", posicion: "DC" },
      { numero: 10, nombre: "Joaquín", apellidos: "Lira", sobrenombre: "El Fino", posicion: "MCO" },
      { numero: 11, nombre: "Rafael", apellidos: "Quezada", sobrenombre: "Rafa", posicion: "EXT" },
      { numero: 12, nombre: "Mateo", apellidos: "Aranda", posicion: "POR" },
      { numero: 13, nombre: "Iñaki", apellidos: "Garrido", posicion: "LAT" },
      { numero: 14, nombre: "Leonel", apellidos: "Benítez", posicion: "MC" },
      { numero: 15, nombre: "Kevin", apellidos: "Acosta", posicion: "DC" },
      { numero: 16, nombre: "Uriel", apellidos: "Rendón", posicion: "MC" },
    ],
  },
  {
    clave: "HI",
    slug: "halcones-iztapalapa",
    nombre: "Halcones Iztapalapa",
    corto: "Halcones",
    colorPrimario: "#5B3A20",
    colorSecundario: "#E8C46A",
    zona: "ORIENTE",
    alcaldia: "Iztapalapa",
    delegado: 6,
    capitan: 6,
    fuerza: 0.2,
    jugadores: [
      { numero: 1, nombre: "Raymundo", apellidos: "Cuevas", sobrenombre: "El Halcón", posicion: "POR" },
      { numero: 2, nombre: "Hernán", apellidos: "Vera", posicion: "LAT" },
      { numero: 3, nombre: "Eduardo", apellidos: "Mancilla", posicion: "DFC" },
      { numero: 4, nombre: "Fidel", apellidos: "Aguirre", posicion: "DFC" },
      { numero: 5, nombre: "Lázaro", apellidos: "Ocaña", posicion: "DFC" },
      { numero: 6, nombre: "Francisco", apellidos: "Ledesma", sobrenombre: "Don Pancho", posicion: "MCD" },
      { numero: 7, nombre: "Wilfrido", apellidos: "Castañeda", posicion: "EXT" },
      { numero: 8, nombre: "Jairo", apellidos: "Cortés", posicion: "MC" },
      { numero: 9, nombre: "Víctor", apellidos: "Benavides", sobrenombre: "El Gallo", posicion: "DC" },
      { numero: 10, nombre: "Adán", apellidos: "Salgado", posicion: "MCO" },
      { numero: 11, nombre: "Jonás", apellidos: "Pedraza", posicion: "EXT" },
      { numero: 12, nombre: "Alonso", apellidos: "Trejo", posicion: "POR" },
      { numero: 13, nombre: "Rigoberto", apellidos: "Sosa", posicion: "LAT" },
      { numero: 14, nombre: "Cirilo", apellidos: "Vargas", posicion: "MC" },
      { numero: 15, nombre: "Abel", apellidos: "Ramos", posicion: "DC" },
      { numero: 16, nombre: "Darío", apellidos: "Fierro", posicion: "MC" },
    ],
  },
];

/**
 * Récord al cerrar la J15 (G-E-P). Respeta lo que muestran las pantallas (Mi liga, 03, 18):
 * Portales 35 · Tigres 33 · Condesa 27 · Halcones cierra con 6. El resto se ajusta para que cuadre
 * (la tabla de la lámina 10 del deck no cuadra: suma 168 puntos en 56 partidos sin empates).
 */
export const RECORD_J15: Record<ClaveEquipo, { g: number; e: number; p: number }> = {
  DP: { g: 11, e: 2, p: 2 }, // 35
  TL: { g: 10, e: 3, p: 2 }, // 33
  RC: { g: 8, e: 3, p: 4 }, // 27
  JT: { g: 6, e: 4, p: 5 }, // 22
  AP: { g: 5, e: 4, p: 6 }, // 19
  UD: { g: 4, e: 3, p: 8 }, // 15
  SN: { g: 2, e: 4, p: 9 }, // 10
  HI: { g: 1, e: 3, p: 11 }, // 6
};

/**
 * Rol: 7 "fechas" (cada equipo juega una vez por fecha) que cubren los 28 cruces.
 * Vuelta 1 = J1–J7, vuelta 2 = J8–J14 (local y visita al revés), vuelta 3 = J15–J18.
 * Fijado para respetar el deck: J12 Portales–Narvarte, J14 Halcones–Portales, J15 Portales–Condesa y
 * Tigres–Narvarte, J16 Portales–Tigres · Tepito–Doctores · Condesa–Halcones · Narvarte–Pensil.
 */
type Cruce = [ClaveEquipo, ClaveEquipo];
const FECHA_A: Cruce[] = [
  ["DP", "HI"],
  ["TL", "JT"],
  ["RC", "SN"],
  ["AP", "UD"],
];
const FECHA_B: Cruce[] = [
  ["SN", "DP"],
  ["JT", "HI"],
  ["TL", "AP"],
  ["RC", "UD"],
];
const FECHA_C: Cruce[] = [
  ["DP", "JT"],
  ["RC", "AP"],
  ["TL", "UD"],
  ["SN", "HI"],
];
const FECHA_D: Cruce[] = [
  ["DP", "AP"],
  ["TL", "HI"],
  ["RC", "JT"],
  ["UD", "SN"],
];
const FECHA_E: Cruce[] = [
  ["UD", "DP"],
  ["TL", "RC"],
  ["JT", "SN"],
  ["AP", "HI"],
];
const FECHA_F: Cruce[] = [
  ["DP", "RC"],
  ["TL", "SN"],
  ["JT", "AP"],
  ["UD", "HI"],
];
const FECHA_G: Cruce[] = [
  ["DP", "TL"],
  ["JT", "UD"],
  ["RC", "HI"],
  ["SN", "AP"],
];

const voltear = (f: Cruce[]): Cruce[] => f.map(([a, b]) => [b, a]);

/** Cruces por jornada (índice 0 = J1). En la J15 y J16 el orden es el de los horarios del deck. */
export const ROL: Cruce[][] = [
  // Vuelta 1
  FECHA_A,
  FECHA_B,
  FECHA_C,
  FECHA_D,
  FECHA_E,
  FECHA_F,
  FECHA_G,
  // Vuelta 2 (al revés)
  voltear(FECHA_C),
  voltear(FECHA_E),
  voltear(FECHA_D),
  voltear(FECHA_F),
  voltear(FECHA_B), // J12: Portales–Narvarte (doblete del Chícharo)
  voltear(FECHA_G),
  voltear(FECHA_A), // J14: Halcones–Portales 1–2 (roja de La Roca)
  // Vuelta 3
  [
    ["JT", "AP"],
    ["TL", "SN"],
    ["DP", "RC"],
    ["UD", "HI"],
  ], // J15 = FECHA_F en orden de horario
  [
    ["JT", "UD"],
    ["DP", "TL"],
    ["RC", "HI"],
    ["SN", "AP"],
  ], // J16 = FECHA_G en orden de horario
  FECHA_C,
  FECHA_D,
];

/** Árbitro por horario en cada jornada jugada (rota) y los del deck en J15 y J16 */
export const ARBITROS_J15: (ClaveArbitro | null)[] = ["pacheco", "ortega", "mendoza", "mendoza"];
export const ARBITROS_J16: (ClaveArbitro | null)[] = ["pacheco", "mendoza", "ortega", null];
