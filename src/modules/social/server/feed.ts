import "server-only";
import { equipoPorSlug } from "@/modules/equipos/server-api";
import { tablaDelTorneo, torneoVigenteDeLaLiga, torneoVigenteDelEquipo } from "@/modules/ligas/server-api";
import { goleoDelTorneo, partidosValidadosConGoles, ultimaJornadaValidada } from "@/modules/partidos/server-api";
import { nombreCorto, nombreDeArbitro, nombreVisible } from "@/shared/lib/personas";
import { hayPostsGuardados, loQueSigue, postsCronologicos, postsDeLaJornada } from "./queries";
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
async function feedCalculado(
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
  return { torneo, jornada, posts: lista as PostDelFeed[], arbitros, mas: null as MasDelFeed };
}

/** Un auto-post como lo pinta el feed, con su id de la base y sus conteos */
export type PostDelFeed = AutoPost & { reacciones?: number; comentarios?: number };
/** "Ver más": la jornada anterior (Para ti) o el cursor de lo cronológico */
export type MasDelFeed = { jornada: number } | { antes: string } | null;

const SEMANA = 7 * 86_400_000;

/**
 * El feed (pantalla 10 · PRD §6.1) desde los posts GUARDADOS (los publica la cola de `match.validated`).
 * Para ti va por jornada; Golazos y Siguiendo son cronológicos con cursor. Si el torneo todavía no tiene
 * posts guardados, los arma al leer con lo validado.
 */
export async function datosDelFeed(
  contexto: { userId: string; slugEquipo?: string; slugLiga?: string },
  vista: VistaFeed,
  pagina: { jornada?: number; antes?: string } = {},
) {
  const { userId, slugEquipo, slugLiga } = contexto;
  const equipo = slugEquipo ? await equipoPorSlug(slugEquipo) : null;
  const torneo =
    (equipo ? (await torneoVigenteDelEquipo(equipo.id))?.tournament : null) ??
    (slugLiga ? await torneoVigenteDeLaLiga(slugLiga) : null);
  if (!torneo) return null;
  if (!(await hayPostsGuardados(torneo.id))) return feedCalculado(contexto, vista);

  const aPost = (p: Awaited<ReturnType<typeof postsCronologicos>>[number]): PostDelFeed => ({
    ...(p.data as unknown as AutoPost),
    id: p.id,
    fecha: p.createdAt.getTime(),
    reacciones: p.reactionsCount,
    comentarios: p.commentsCount,
  });
  const ultima = await ultimaJornadaValidada(torneo.id);

  if (vista === "para-ti") {
    const jornada = pagina.jornada && ultima && pagina.jornada <= ultima ? pagina.jornada : ultima;
    if (jornada == null) return { torneo, jornada: null, posts: [], arbitros: [], mas: null as MasDelFeed };
    const filas = await postsDeLaJornada(torneo.id, jornada, jornada === ultima ? new Date(Date.now() - 2 * SEMANA) : null);
    const posts = paraTi(filas.map(aPost), equipo?.id) as PostDelFeed[];
    const arbitros = [
      ...new Set(posts.flatMap((p) => (p.tipo === "AUTO_RESULTADO" && p.arbitro ? [p.arbitro] : []))),
    ];
    return { torneo, jornada, posts, arbitros, mas: (jornada > 1 ? { jornada: jornada - 1 } : null) as MasDelFeed };
  }

  const sigue =
    vista === "siguiendo"
      ? await loQueSigue(userId).then((s) => ({
          equipos: [...new Set([...s.equipos.map((e) => e.id), ...(equipo ? [equipo.id] : [])])],
          jugadores: s.cracks.map((c) => c.id),
        }))
      : undefined;
  const antes = pagina.antes && !Number.isNaN(Date.parse(pagina.antes)) ? new Date(pagina.antes) : undefined;
  const filas = await postsCronologicos(torneo.id, { soloGoles: vista === "golazos", sigue }, antes);
  const posts = filas.map(aPost);
  const ultimo = filas.at(-1);
  return {
    torneo,
    jornada: ultima,
    posts: vista === "golazos" ? (golazos(posts) as PostDelFeed[]) : posts,
    arbitros: [],
    mas: (filas.length === 30 && ultimo ? { antes: ultimo.createdAt.toISOString() } : null) as MasDelFeed,
  };
}
