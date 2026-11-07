import "server-only";

/**
 * Lo que `partidos` necesita de otros módulos que dependen de él. `ligas` es dueño de `tournament_rosters`
 * y ya importa `partidos`: en vez de leer su tabla (o crear un ciclo), `ligas` registra aquí su búsqueda
 * desde su `registerListeners()`, como las reglas de authz.
 */
export type Inscrito = { userId: string; teamId: string; tournamentTeamId: string; numero: number | null };
/** Sin `teamIds`: todos los del torneo */
type BuscarInscritos = (tournamentId: string, teamIds?: string[]) => Promise<Inscrito[]>;

let buscarInscritos: BuscarInscritos | null = null;

export function proveerInscritos(f: BuscarInscritos) {
  buscarInscritos = f;
}

/** Inscritos (activos o suspendidos) de los equipos en el torneo, por equipo, con su dorsal (regla 4) */
export async function inscritosDelPartido(tournamentId: string | null, teamIds: string[]) {
  const porEquipo: Record<string, string[]> = Object.fromEntries(teamIds.map((t) => [t, []]));
  const numeros = new Map<string, number | null>();
  if (!tournamentId) return { porEquipo, numeros };
  if (!buscarInscritos) throw new Error("ligas no registró quién está inscrito (asegurarListeners)");
  for (const i of await buscarInscritos(tournamentId, teamIds)) {
    porEquipo[i.teamId]?.push(i.userId);
    numeros.set(i.userId, i.numero);
  }
  return { porEquipo, numeros };
}

/** Todos los inscritos del torneo (recalcular estadísticas y sanciones) */
export async function inscritosDelTorneo(tournamentId: string) {
  if (!buscarInscritos) throw new Error("ligas no registró quién está inscrito (asegurarListeners)");
  return buscarInscritos(tournamentId);
}
