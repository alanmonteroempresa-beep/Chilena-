// Catálogo de insignias de la beta (docs/CARTA_E_INSIGNIAS.md §4). La semilla lo carga en `badges`.
export type BadgeSeed = {
  code: string;
  categoria: "GOLES" | "PORTERO" | "CONSTANCIA" | "VOTADAS" | "EQUIPO" | "FAIR_PLAY" | "AFICIONADO" | "ESPECIAL";
  nombre: string;
  descripcion: string;
  icon: string;
  repetible: boolean;
  criteria: Record<string, string | number | boolean>;
};

export const BADGES: BadgeSeed[] = [
  { code: "PRIMER_GOL", categoria: "GOLES", nombre: "Primer gol", descripcion: "Tu primer gol en Chilena", icon: "⚽", repetible: false, criteria: { type: "goals_total", gte: 1 } },
  { code: "DOBLETE", categoria: "GOLES", nombre: "Doblete", descripcion: "2 goles en un partido", icon: "✌️", repetible: true, criteria: { type: "goals_in_match", gte: 2 } },
  { code: "HAT_TRICK", categoria: "GOLES", nombre: "Hat-trick", descripcion: "3 goles en un partido", icon: "🎩", repetible: true, criteria: { type: "goals_in_match", gte: 3 } },
  { code: "GOLEADOR_TORNEO", categoria: "GOLES", nombre: "Goleador del torneo", descripcion: "1º del goleo al cerrar el torneo", icon: "👟", repetible: true, criteria: { type: "top_scorer" } },
  { code: "GOLES_50", categoria: "GOLES", nombre: "50 goles", descripcion: "50 goles validados", icon: "💯", repetible: false, criteria: { type: "goals_total", gte: 50 } },
  { code: "DE_CHILENA", categoria: "ESPECIAL", nombre: "De Chilena", descripcion: "Gol de chilena", icon: "🤸", repetible: true, criteria: { type: "goal_type", value: "CHILENA" } },
  { code: "PANENKA", categoria: "ESPECIAL", nombre: "A lo Panenka", descripcion: "Penal picado a lo Panenka", icon: "🪶", repetible: true, criteria: { type: "goal_type", value: "PANENKA" } },
  { code: "VALLA_INVICTA", categoria: "PORTERO", nombre: "Valla invicta", descripcion: "Partido sin recibir gol", icon: "🛡️", repetible: true, criteria: { type: "clean_sheet" } },
  { code: "PENAL_ATAJADO", categoria: "PORTERO", nombre: "Penal atajado", descripcion: "Le atajaste un penal", icon: "🧤", repetible: true, criteria: { type: "event", value: "PENAL_ATAJADO" } },
  { code: "EL_MURO", categoria: "VOTADAS", nombre: "El Muro", descripcion: "Votado por tus compañeros", icon: "🧱", repetible: true, criteria: { type: "poll_win", poll: "EL_MURO" } },
  { code: "DOMINGOS_5", categoria: "CONSTANCIA", nombre: "5 domingos sin faltar", descripcion: "Racha de asistencia", icon: "📅", repetible: false, criteria: { type: "attendance_streak", gte: 5 } },
  { code: "DOMINGOS_12", categoria: "CONSTANCIA", nombre: "12 domingos sin faltar", descripcion: "Racha de asistencia", icon: "📅", repetible: false, criteria: { type: "attendance_streak", gte: 12 } },
  { code: "DOMINGOS_25", categoria: "CONSTANCIA", nombre: "25 domingos sin faltar", descripcion: "Racha de asistencia", icon: "📅", repetible: false, criteria: { type: "attendance_streak", gte: 25 } },
  { code: "PARTIDOS_100", categoria: "CONSTANCIA", nombre: "100 partidos", descripcion: "100 partidos validados", icon: "🏟️", repetible: false, criteria: { type: "matches_total", gte: 100 } },
  { code: "MVP", categoria: "VOTADAS", nombre: "MVP del partido", descripcion: "Votado el mejor del partido", icon: "⭐", repetible: true, criteria: { type: "poll_win", poll: "MVP_PARTIDO" } },
  { code: "GOLAZO_JORNADA", categoria: "VOTADAS", nombre: "Golazo de la jornada", descripcion: "Tu gol fue el más votado", icon: "🚀", repetible: true, criteria: { type: "poll_win", poll: "GOLAZO_JORNADA" } },
  { code: "ONCE_JORNADA", categoria: "VOTADAS", nombre: "Once de la jornada", descripcion: "Elegido en el once ideal", icon: "🔟", repetible: true, criteria: { type: "poll_win", poll: "ONCE_JORNADA" } },
  { code: "ATAJADA_JORNADA", categoria: "VOTADAS", nombre: "Atajada de la jornada", descripcion: "Tu atajada fue la más votada", icon: "🧤", repetible: true, criteria: { type: "poll_win", poll: "ATAJADA_JORNADA" } },
  { code: "CAMPEON", categoria: "EQUIPO", nombre: "Campeón", descripcion: "En la plantilla campeona", icon: "🏆", repetible: true, criteria: { type: "champion" } },
  { code: "SUBCAMPEON", categoria: "EQUIPO", nombre: "Subcampeón", descripcion: "En la plantilla subcampeona", icon: "🥈", repetible: true, criteria: { type: "runner_up" } },
  { code: "INVICTOS", categoria: "EQUIPO", nombre: "Invictos", descripcion: "Fase regular sin derrotas", icon: "🔥", repetible: true, criteria: { type: "unbeaten_regular" } },
  { code: "FAIR_PLAY", categoria: "FAIR_PLAY", nombre: "Fair play", descripcion: "Torneo completo (8+ partidos) sin tarjetas", icon: "🤝", repetible: true, criteria: { type: "no_cards_tournament", minMatches: 8 } },
  { code: "PORRA_DE_HIERRO", categoria: "AFICIONADO", nombre: "Porra de Hierro", descripcion: "Porra en 10 partidos de un mismo equipo", icon: "📣", repetible: false, criteria: { type: "fan_porra", gte: 10 } },
  { code: "PROFETA", categoria: "AFICIONADO", nombre: "Profeta", descripcion: "Top 3 de la quiniela de tu liga", icon: "🔮", repetible: true, criteria: { type: "quiniela_top", top: 3 } },
  { code: "REPORTERO_BANDA", categoria: "AFICIONADO", nombre: "Reportero de la banda", descripcion: "5 marcadores desde la banda que coincidieron con el oficial", icon: "📻", repetible: false, criteria: { type: "live_score_accurate", gte: 5 } },
  { code: "PIONERO", categoria: "ESPECIAL", nombre: "Pionero", descripcion: "Le entraste a la beta de Chilena", icon: "🚩", repetible: false, criteria: { type: "beta_pioneer" } },
];
