import "server-only";
import { escudoNeutro, type Contexto } from "@/modules/core";
import { contextosEnLigas } from "./queries";

/** Opciones del selector de rol que vienen de ligas: liga (la administra) y árbitro (arbitra ahí) */
export async function contextosDeRolEnLigas(userId: string): Promise<Contexto[]> {
  const { administra, arbitra } = await contextosEnLigas(userId);
  return [
    ...administra.map(({ league }) => ({
      id: `liga:${league.id}`,
      rol: "liga" as const,
      titulo: league.nombre,
      tituloCorto: league.nombre.replace(/^Liga\s+/i, "").split(" ")[0],
      ligaCorta: league.siglas ?? undefined,
      detalle: league.tournaments[0]?.nombre,
      escudo: escudoNeutro("liga"),
      slugLiga: league.slug,
    })),
    ...arbitra.map(({ league }) => ({
      id: `arbitro:${league.id}`,
      rol: "arbitro" as const,
      titulo: league.nombre,
      tituloCorto: league.nombre.replace(/^Liga\s+/i, "").split(" ")[0],
      ligaCorta: league.siglas ?? undefined,
      detalle: "Tus partidos asignados",
      escudo: escudoNeutro("arbitro"),
      slugLiga: league.slug,
    })),
  ];
}
