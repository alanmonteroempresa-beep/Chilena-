import "server-only";
import { equipoPorSlug } from "@/modules/equipos/server-api";
import { tablaDelTorneo, torneoVigenteDeLaLiga, torneoVigenteDelEquipo } from "@/modules/ligas/server-api";
import { goleoDelTorneo, partidosValidadosConGoles, ultimaJornadaValidada } from "@/modules/partidos/server-api";
import { nombreCorto, nombreDeArbitro, nombreVisible } from "@/shared/lib/personas";
import { loQueSigue } from "./queries";
import { autoPostsDeLaJornada, golazos, paraTi, siguiendo, type AutoPost, type EquipoJornada } from "./services/auto-posts";

export type VistaFeed = "para-ti" | "golazos" | "siguiendo";

const equipoDe = (t: {
  id: string;
  slug: string;
  nombre: string;
  siglas: string | null;
  colorPrimario: string | null;
  colorSecundario: string | null;
}): EquipoJornada => ({ ...t, corto: nombreCorto(t.nombre) });

/**
 * El feed automático de la última jornada validada (pantalla 10 · PRD §6.1): "se llenó solo con la
 * cédula". Para ti, Golazos y Siguiendo salen de los mismos auto-posts.
 */
export async function datosDelFeed(
  { userId, slugEquipo, slugLiga }: { userId: string; slugEquipo?: string; slugLiga?: string },
  vista: VistaFeed,
) {
  const equipo = slugEquipo ? await equipoPorSlug(slugEquipo) : null;
  const torneo =
    (equipo ? (await torneoVigenteDelEquipo(equipo.id))?.tournament : null) ??
    (slugLiga ? await torneoVigenteDeLaLiga(slugLiga) : null);
  if (!torneo) return null;
  const jornada = await ultimaJornadaValidada(torneo.id);
  if (jornada == null) return { torneo, jornada: null, posts: [] as AutoPost[], arbitros: [] as string[] };

  const [partidos, tabla, goleo, sigue] = await Promise.all([
    partidosValidadosConGoles(torneo.id, jornada),
    tablaDelTorneo(torneo.id),
    goleoDelTorneo(torneo.id, 200),
    vista === "siguiendo" ? loQueSigue(userId) : null,
  ]);
  const posts = autoPostsDeLaJornada({
    partidos: partidos.map((p) => ({
      id: p.id,
      jornada,
      cancha: p.field?.nombre ?? null,
      inicio: p.scheduledAt,
      validadoEn: p.validatedAt,
      local: equipoDe(p.homeTeam),
      visita: equipoDe(p.awayTeam),
      golesLocal: p.homeScore ?? 0,
      golesVisita: p.awayScore ?? 0,
      arbitro: p.referee ? nombreDeArbitro(p.referee) : null,
      goles: p.events
        .filter((e) => e.player && e.teamId)
        .map((e) => ({
          minuto: e.minute,
          // El autogol se anota con el equipo del jugador y suma al contrario (PRD §7.7)
          equipoId: e.type === "AUTOGOL" ? (e.teamId === p.homeTeam.id ? p.awayTeam.id : p.homeTeam.id) : e.teamId!,
          autogol: e.type === "AUTOGOL",
          jugadorId: e.player!.id,
          jugador: nombreVisible(e.player!),
          username: e.player!.username,
          tipoGol: e.tipoGol,
        })),
    })),
    liderAntesId: tabla.find((f) => f.posicionAnterior === 1)?.tournamentTeam.team.id,
    tabla: tabla.map((f) => ({ equipo: equipoDe(f.tournamentTeam.team), pts: f.pts, posicion: f.posicion })),
    goleo: goleo.slice(0, 3).map((g) => ({ nombre: nombreVisible(g.user), username: g.user.username, goles: g.goles })),
    rachas: goleo.map((g) => ({ jugadorId: g.userId, nombre: nombreVisible(g.user), username: g.user.username, racha: g.rachaGoles })),
  });

  const lista =
    vista === "golazos"
      ? golazos(posts)
      : vista === "siguiendo"
        ? siguiendo(posts, {
            equipos: new Set([...(sigue?.equipos.map((e) => e.id) ?? []), ...(equipo ? [equipo.id] : [])]),
            jugadores: new Set(sigue?.cracks.map((c) => c.id) ?? []),
          })
        : paraTi(posts, equipo?.id);
  const arbitros = [...new Set(partidos.map((p) => (p.referee ? nombreDeArbitro(p.referee) : null)).filter((a): a is string => a != null))];
  return { torneo, jornada, posts: lista, arbitros };
}
