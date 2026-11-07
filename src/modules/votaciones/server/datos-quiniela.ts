import "server-only";
import { personasPorId } from "@/modules/core/server-api";
import { equipoDeCadaQuien, siguenAlEquipo } from "@/modules/equipos/server-api";
import { jornadaQueViene, partidosDeLaJornada } from "@/modules/partidos/server-api";
import { misPronosticos, pronosticosDelPartido, puntosDeLaQuiniela } from "./queries";
import { loQueDiceLaPorra, quinielaCerrada, rankingDeQuiniela } from "./services/quiniela";

/** Cuántos se ven en "Los que más le atinan" (más tú, si no sales) */
const TOP = 6;

/**
 * La quiniela de la jornada que viene (pantalla 13): el partido elegido (el de tu equipo o el que tocaste),
 * tu pronóstico, "Lo que dice la porra" y "Los que más le atinan" de tu porra o de toda la liga.
 */
export async function datosQuiniela({
  tournamentId,
  yo,
  miEquipo,
  partidoId,
  ranking,
  ahora,
}: {
  tournamentId: string;
  yo: string;
  miEquipo: { id: string; nombre: string } | null;
  partidoId?: string;
  ranking: "porra" | "liga";
  ahora: Date;
}) {
  const jornada = await jornadaQueViene(tournamentId);
  const partidos = jornada != null ? await partidosDeLaJornada(tournamentId, jornada) : [];
  const delMio = miEquipo ? partidos.find((p) => p.homeTeam.id === miEquipo.id || p.awayTeam.id === miEquipo.id) : undefined;
  const elegido =
    partidos.find((p) => p.id === partidoId) ?? delMio ?? partidos.find((p) => !quinielaCerrada(p, ahora)) ?? partidos[0] ?? null;

  const [mios, delPartido, puntos] = await Promise.all([
    misPronosticos(yo, partidos.map((p) => p.id)),
    elegido ? pronosticosDelPartido(elegido.id) : Promise.resolve([]),
    puntosDeLaQuiniela(tournamentId),
  ]);

  // La porra: los de mi equipo y los que lo siguen (y yo)
  const porra = ranking === "porra" && miEquipo != null;
  let filas = puntos;
  if (porra) {
    const ids = puntos.map((p) => p.userId);
    const [miembros, seguidores] = await Promise.all([equipoDeCadaQuien(ids), siguenAlEquipo(miEquipo.id, ids)]);
    const dePorra = new Set([...miembros.filter((m) => m.team.id === miEquipo.id).map((m) => m.userId), ...seguidores, yo]);
    filas = puntos.filter((p) => dePorra.has(p.userId));
  }
  const tabla = rankingDeQuiniela(filas);
  const yoEn = tabla.find((f) => f.userId === yo);
  const visibles = [...tabla.slice(0, TOP), ...(yoEn && yoEn.posicion > TOP ? [yoEn] : [])];
  const personas = new Map((await personasPorId(visibles.map((f) => f.userId))).map((p) => [p.id, p]));

  return {
    jornada,
    partidos: partidos.map((p) => ({ ...p, cerrada: quinielaCerrada(p, ahora), mio: mios.find((m) => m.matchId === p.id) ?? null })),
    elegido: elegido ? { ...elegido, cerrada: quinielaCerrada(elegido, ahora), mio: mios.find((m) => m.matchId === elegido.id) ?? null } : null,
    porra: loQueDiceLaPorra(delPartido.map((p) => ({ local: p.homeGoals, visita: p.awayGoals }))),
    ranking: {
      de: porra ? `Porra de ${miEquipo.nombre}` : "Toda la liga",
      puedePorra: miEquipo != null,
      filas: visibles.map((f) => ({ ...f, persona: personas.get(f.userId) ?? null })),
    },
  };
}
export type DatosQuiniela = Awaited<ReturnType<typeof datosQuiniela>>;
