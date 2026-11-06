import "server-only";
import { perfilPublico } from "@/modules/core/server-api";
import { equipoDeCadaQuien } from "@/modules/equipos/server-api";
import {
  filaDeLaTabla,
  jugadoresDelTorneo,
  plantillasDeJugadores,
  torneoVigenteDelEquipo,
} from "@/modules/ligas/server-api";
import { posicionesDelGoleo } from "@/modules/partidos";
import { estadisticasDelJugador, goleoDelTorneo, historialDePlantillas, jornadaQueViene } from "@/modules/partidos/server-api";
import { evaluarInsignias, laMasCercana, rarezas, type CriterioInsignia, type HistorialJugador } from "./badges";
import { calcularCarta, grupoDePosicion } from "./formula";
import { catalogoDeInsignias } from "./queries";
import { armarHistoriales, posicionMasJugada, ventanaDe } from "./services/historial";

async function historiales(userIds: string[]) {
  const plantillas = (await plantillasDeJugadores(userIds)).map((p) => ({
    userId: p.userId,
    tournamentId: p.tournamentId,
    teamId: p.tournamentTeam.teamId,
  }));
  return armarHistoriales(plantillas, await historialDePlantillas(plantillas));
}

/**
 * Todo lo del jugador para su perfil, su carta y sus insignias (pantallas 06, 14, 25 y 28).
 * Se calcula al leer con lo VALIDADO (regla 2); cuando exista la cola de `match.validated`, esto mismo
 * llenará `player_cards` y `user_badges`.
 */
export async function datosDelJugador(username: string, { conRareza = false } = {}) {
  const persona = await perfilPublico(username);
  if (!persona) return null;
  const [[miembro], catalogo, mios] = await Promise.all([
    equipoDeCadaQuien([persona.id]),
    catalogoDeInsignias(),
    historiales([persona.id]),
  ]);
  const historial = mios.get(persona.id) ?? [];
  const inscripcion = miembro ? await torneoVigenteDelEquipo(miembro.team.id) : null;
  const torneo = inscripcion?.tournament ?? null;
  const [stats, goleo, fila, jornadaSiguiente] = await Promise.all([
    torneo ? estadisticasDelJugador(torneo.id, persona.id) : null,
    torneo ? goleoDelTorneo(torneo.id, 200) : [],
    inscripcion ? filaDeLaTabla(inscripcion.id) : null,
    torneo ? jornadaQueViene(torneo.id) : null,
  ]);

  const posicion = persona.playerProfile?.posicionPrincipal ?? miembro?.posicion ?? null;
  const grupo = grupoDePosicion(posicion, posicionMasJugada(historial));
  const partidosValidados = historial.filter((p) => p.jugo).length;
  const ventana = ventanaDe(historial);
  const carta = calcularCarta(ventana, grupo, partidosValidados);
  const posicionGoleo = posicionesDelGoleo(goleo).get(persona.id);

  const esJugador = historial.length > 0 || miembro != null;
  const insignias = catalogo.map((b) => ({ ...b, criteria: b.criteria as CriterioInsignia }));
  const h: HistorialJugador = {
    partidos: historial,
    esPortero: grupo === "PORTERO",
    esPionero: persona.isPionero || persona.claimedAt != null,
    torneo: torneo
      ? {
          nombre: torneo.nombre,
          cerrado: false,
          posicionGoleo,
          jornada: jornadaSiguiente ? jornadaSiguiente - 1 : undefined,
          jornadas: torneo.numJornadas ?? undefined,
          amarillas: stats?.amarillas ?? 0,
          rojas: stats?.rojas ?? 0,
          jugados: stats?.partidos ?? 0,
          equipo: fila ? { pj: fila.pj, pp: fila.pp } : undefined,
        }
      : undefined,
  };
  const estados = esJugador ? evaluarInsignias(insignias, h) : [];

  // Rareza: % de los jugadores del torneo que la tienen (solo en la colección, pantalla 28)
  let rareza = new Map<string, number>();
  if (conRareza && torneo) {
    const ids = await jugadoresDelTorneo(torneo.id);
    const todos = await historiales(ids);
    rareza = rarezas(
      ids.map((id) =>
        evaluarInsignias(insignias, { partidos: todos.get(id) ?? [], esPortero: false, esPionero: false }),
      ),
    );
  }

  return {
    persona,
    equipo: miembro ? { ...miembro.team, dorsal: miembro.numero } : null,
    torneo: torneo ? { nombre: torneo.nombre, liga: torneo.league } : null,
    esJugador,
    posicion,
    carta,
    ventana,
    stats,
    posicionGoleo,
    insignias: insignias
      .filter((b) => b.categoria !== "AFICIONADO")
      .map((b) => ({ ...b, estado: estados.find((e) => e.code === b.code)!, rareza: rareza.get(b.code) })),
    masCercana: laMasCercana(estados),
  };
}

export type DatosDelJugador = NonNullable<Awaited<ReturnType<typeof datosDelJugador>>>;

const POSICION: Record<string, string> = {
  POR: "Portero",
  DFC: "Defensa central",
  LAT: "Lateral",
  MCD: "Contención",
  MC: "Medio",
  MCO: "Media punta",
  EXT: "Extremo",
  DC: "Delantero",
};

/** Lo que va en el encabezado del perfil (pantallas 06 y 28): "Delantero · #9 · Dep. Portales" */
export function encabezadoDe(d: DatosDelJugador) {
  const ganadas = d.insignias.filter((i) => i.estado.veces > 0).length;
  return {
    username: d.persona.username,
    nombre: d.persona.sobrenombre?.trim() || d.persona.nombre,
    detalle:
      [d.posicion ? POSICION[d.posicion] : null, d.equipo?.dorsal != null ? `#${d.equipo.dorsal}` : null, d.equipo?.nombre]
        .filter(Boolean)
        .join(" · ") || (d.persona.alcaldia ?? "En Chilena"),
    insignias: d.esJugador ? { ganadas, total: d.insignias.length } : undefined,
  };
}
