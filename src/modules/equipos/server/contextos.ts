import "server-only";
import type { Contexto } from "@/modules/core";
import { contextosEnEquipos, equiposQueSigue } from "./queries";

const escudoDe = (t: { siglas: string | null; colorPrimario: string | null; colorSecundario: string | null }) => ({
  siglas: t.siglas ?? undefined,
  color: t.colorPrimario ?? "#0250B0",
  colorFranja: t.colorSecundario ?? "#FFFFFF",
});

/**
 * Opciones del selector de rol que vienen de equipos (pantallas 07 y 24):
 * jugador (si trae dorsal), delegado (principal o auxiliar) y aficionado (equipos que sigue).
 */
export async function contextosDeRolEnEquipos(userId: string): Promise<Contexto[]> {
  const [miembros, sigue] = await Promise.all([contextosEnEquipos(userId), equiposQueSigue(userId)]);
  const contextos: Contexto[] = [];
  for (const m of miembros) {
    const torneo = m.team.registrations[0]?.tournament;
    const base = {
      titulo: m.team.nombre,
      ligaCorta: torneo?.league.siglas ?? undefined,
      detalle: torneo ? `${torneo.league.nombre} · ${torneo.nombre}` : undefined,
      escudo: escudoDe(m.team),
      slugEquipo: m.team.slug,
      slugLiga: torneo?.league.slug,
    };
    if (m.numero != null || m.role === "JUGADOR" || m.role === "CAPITAN") {
      contextos.push({ id: `jugador:${m.team.id}`, rol: "jugador", extra: m.numero ? `#${m.numero}` : undefined, ...base });
    }
    if (m.role === "DELEGADO_PRINCIPAL" || m.role === "DELEGADO_AUXILIAR") {
      contextos.push({ id: `delegado:${m.team.id}`, rol: "delegado", ...base });
    }
  }
  if (sigue.length) {
    const primero = sigue[0].team;
    contextos.push({
      id: `aficionado:${primero.id}`,
      rol: "aficionado",
      titulo: `Porra de ${primero.nombre}`,
      detalle: sigue.length === 1 ? "Sigues a 1 equipo" : `Sigues a ${sigue.length} equipos`,
      escudo: escudoDe(primero),
      slugEquipo: primero.slug,
    });
  }
  return contextos;
}
