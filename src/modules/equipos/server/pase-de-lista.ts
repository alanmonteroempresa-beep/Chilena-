import "server-only";
import { cuandoTeToca, horarioCorto } from "@/modules/partidos";
import { partidoDelDia, proximoPartidoDelEquipo } from "@/modules/partidos/server-api";
import { nombreCorto, nombreVisible } from "@/shared/lib/personas";
import { alineacionDe, equipoPorSlug, linkDePaseDeLista, linkPorToken, plantillaDelEquipo, respuestasDelPaseDeLista } from "./queries";
import { respuestaDe, resumenPaseDeLista, type Respuesta } from "./services/plantilla";

type Partido = NonNullable<Awaited<ReturnType<typeof partidoDelDia>>>;

async function plantillaConRespuestas(teamId: string, matchId: string) {
  const [plantilla, respuestas] = await Promise.all([plantillaDelEquipo(teamId), respuestasDelPaseDeLista(matchId, teamId)]);
  const jugadores = plantilla.map((m) => {
    const r = respuestas.find((x) => x.userId === m.user.id);
    return {
      id: m.user.id,
      nombre: nombreVisible(m.user),
      numero: m.numero,
      respuesta: respuestaDe(r?.status) as Respuesta,
      nota: r?.nota ?? null,
    };
  });
  return { jugadores, resumen: resumenPaseDeLista(jugadores.map((j) => j.respuesta)) };
}

const describir = (p: Pick<Partido, "homeTeam" | "awayTeam" | "scheduledAt" | "field" | "round">, teamId: string, ahora: Date) => {
  const rival = p.homeTeam.id === teamId ? p.awayTeam : p.homeTeam;
  return {
    rival: nombreCorto(rival.nombre),
    rivalCompleto: rival.nombre,
    jornada: p.round?.numero ?? null,
    horario: p.scheduledAt ? horarioCorto(p.scheduledAt, p.field?.nombre) : "",
    cuando: p.scheduledAt ? cuandoTeToca(ahora, p.scheduledAt) : "",
    local: p.homeTeam,
    visita: p.awayTeam,
  };
};

/** El pase de lista del delegado para el próximo partido (pantallas 04 y 20) */
export async function datosPaseDeLista(slugEquipo: string, ahora: Date) {
  const equipo = await equipoPorSlug(slugEquipo);
  if (!equipo) return null;
  const proximo = await proximoPartidoDelEquipo(equipo.id, ahora);
  if (!proximo) return { equipo, partido: null } as const;
  const [{ jugadores, resumen }, link, alineacion] = await Promise.all([
    plantillaConRespuestas(equipo.id, proximo.id),
    linkDePaseDeLista(proximo.id, equipo.id),
    alineacionDe(proximo.id, equipo.id),
  ]);
  return {
    equipo,
    partido: { id: proximo.id, status: proximo.status, ...describir(proximo, equipo.id, ahora) },
    jugadores,
    resumen,
    linkAbierto: Boolean(link),
    alineacion: alineacion ? { titulares: alineacion.players.filter((x) => x.titular).length, total: alineacion.players.length } : null,
  } as const;
}

/** El link de WhatsApp (pantalla 20): sin cuenta, eligiendo su nombre */
export async function datosLink(token: string, ahora: Date) {
  const link = await linkPorToken(token);
  if (!link) return null;
  const p = await partidoDelDia(link.matchId);
  if (!p) return null;
  const { jugadores, resumen } = await plantillaConRespuestas(link.teamId, link.matchId);
  const miEquipo = p.homeTeam.id === link.teamId ? p.homeTeam : p.awayTeam;
  return {
    token,
    vencido: link.expiresAt < ahora || !["PROGRAMADO", "EN_JUEGO"].includes(p.status),
    equipo: miEquipo,
    partido: describir(p, link.teamId, ahora),
    jugadores,
    resumen,
  };
}
