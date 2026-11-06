import "server-only";
import { posicionesDelGoleo } from "@/modules/partidos";
import { goleoDelTorneo, jornadaQueViene, partidosDeLaJornada } from "@/modules/partidos/server-api";
import {
  equiposEnElTorneo,
  inscripcionVigentePorSlug,
  jornadasDelTorneo,
  tablaDelTorneo,
  torneoVigenteDeLaLiga,
} from "./queries";

/** De qué liga y torneo es el hub: la liga del contexto activo o la del equipo (jugador, delegado, aficionado) */
export type ContextoMiLiga = { slugLiga?: string; slugEquipo?: string };

export async function torneoDeMiLiga({ slugLiga, slugEquipo }: ContextoMiLiga) {
  const inscripcion = slugEquipo ? await inscripcionVigentePorSlug(slugEquipo) : null;
  const torneo = inscripcion?.tournament ?? (slugLiga ? await torneoVigenteDeLaLiga(slugLiga) : null);
  if (!torneo) return null;
  return { torneo, miEquipo: inscripcion?.tournament.id === torneo.id ? inscripcion.team : null };
}

/** Hub de Mi liga (pantalla Mi liga): el rol de la jornada, la tabla y el goleo con su adelanto */
export async function datosMiLiga(contexto: ContextoMiLiga) {
  const base = await torneoDeMiLiga(contexto);
  if (!base) return null;
  const { torneo, miEquipo } = base;
  const [siguiente, tabla, goleo] = await Promise.all([
    jornadaQueViene(torneo.id),
    tablaDelTorneo(torneo.id),
    goleoDelTorneo(torneo.id, 3),
  ]);
  const jornada = siguiente ?? torneo.numJornadas ?? null;
  const partidos = jornada != null ? await partidosDeLaJornada(torneo.id, jornada) : [];
  const elMio = miEquipo
    ? partidos.find((p) => p.homeTeam.id === miEquipo.id || p.awayTeam.id === miEquipo.id)
    : undefined;
  const equipos = await equiposEnElTorneo(torneo.id, goleo.map((g) => g.userId));
  const posicion = (teamId: string) => tabla.find((f) => f.tournamentTeam.team.id === teamId)?.posicion ?? null;
  return {
    torneo,
    miEquipo: miEquipo ? { ...miEquipo, posicion: posicion(miEquipo.id) } : null,
    jornada,
    // El partido de mi equipo, o el primero de la jornada
    destacado: elMio ?? partidos[0] ?? null,
    esDeMiEquipo: elMio != null,
    resto: partidos.filter((p) => p.id !== (elMio ?? partidos[0])?.id),
    posicion,
    tabla,
    goleo: goleo.map((g) => ({
      ...g,
      equipo: equipos.find((e) => e.userId === g.userId)?.tournamentTeam.team ?? null,
    })),
  };
}

/** Rol de juegos de una jornada (pantalla 45 en lectura): todas las jornadas y los partidos de la elegida */
export async function datosRolDeJuegos(contexto: ContextoMiLiga, jornadaPedida?: number) {
  const base = await torneoDeMiLiga(contexto);
  if (!base) return null;
  const [jornadas, siguiente] = await Promise.all([jornadasDelTorneo(base.torneo.id), jornadaQueViene(base.torneo.id)]);
  const existe = (n?: number) => n != null && jornadas.some((j) => j.numero === n);
  const jornada = existe(jornadaPedida) ? jornadaPedida! : (siguiente ?? jornadas.at(-1)?.numero ?? null);
  const partidos = jornada != null ? await partidosDeLaJornada(base.torneo.id, jornada) : [];
  return { ...base, jornadas, jornada, siguiente, partidos };
}

/** Goleo completo del torneo con el equipo de cada quien */
export async function datosGoleo(contexto: ContextoMiLiga) {
  const base = await torneoDeMiLiga(contexto);
  if (!base) return null;
  const goleo = await goleoDelTorneo(base.torneo.id, 50);
  const equipos = await equiposEnElTorneo(base.torneo.id, goleo.map((g) => g.userId));
  const posiciones = posicionesDelGoleo(goleo);
  return {
    ...base,
    goleo: goleo.map((g) => ({
      ...g,
      posicion: posiciones.get(g.userId) ?? 0,
      equipo: equipos.find((e) => e.userId === g.userId)?.tournamentTeam.team ?? null,
    })),
  };
}

/** Tabla completa con la zona de liguilla */
export async function datosTabla(contexto: ContextoMiLiga) {
  const base = await torneoDeMiLiga(contexto);
  if (!base) return null;
  const [tabla, siguiente] = await Promise.all([tablaDelTorneo(base.torneo.id), jornadaQueViene(base.torneo.id)]);
  return { ...base, tabla, jornadaCerrada: siguiente ? siguiente - 1 : base.torneo.numJornadas };
}
