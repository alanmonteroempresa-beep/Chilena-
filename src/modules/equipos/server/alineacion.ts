import "server-only";
import { amarillasAcumuladas, revisarAlineacion, type JugadorParaAlinear } from "@/modules/partidos";
import { sancionesActivas, tarjetasParaAcumulado } from "@/modules/partidos/server-api";
import { plantillasDeJugadores, torneoVigenteDelEquipo } from "@/modules/ligas/server-api";
import { nombreVisible } from "@/shared/lib/personas";
import { cuotaVigente, plantillaDelEquipo } from "./queries";

/**
 * Las alertas de cada jugador para la alineación de un partido (pantalla 53 · PRD §7.6): rojo si no
 * puede (otro equipo del torneo, suspendido, no registrado) y ámbar si ojo (cuota, a una amarilla).
 */
export async function revisionDeAlineacion(teamId: string, tournamentId: string | null) {
  const [plantilla, inscripcion, cuota] = await Promise.all([
    plantillaDelEquipo(teamId),
    torneoVigenteDelEquipo(teamId),
    cuotaVigente(teamId),
  ]);
  const ids = plantilla.map((m) => m.user.id);
  const torneoId = tournamentId ?? inscripcion?.tournament.id ?? null;
  const [plantillas, sanciones] = await Promise.all([
    plantillasDeJugadores(ids),
    torneoId ? sancionesActivas(torneoId, { userIds: ids }) : Promise.resolve([]),
  ]);
  const reglas = inscripcion?.tournament ?? { amarillasParaSuspension: 5, partidosPorRoja: 1 };
  const amarillas = new Map<string, number>();
  if (torneoId) {
    for (const id of ids) amarillas.set(id, amarillasAcumuladas(await tarjetasParaAcumulado(torneoId, id), reglas).get(id) ?? 0);
  }
  const jugadores: (JugadorParaAlinear & { numero: number | null; posicion: string | null; rol: string })[] = plantilla.map((m) => {
    const registro = plantillas.find((p) => p.userId === m.user.id && p.tournamentId === torneoId);
    const sancion = sanciones.find((s) => s.userId === m.user.id && s.type === "SUSPENSION_PARTIDOS");
    const pago = cuota?.payments.find((p) => p.userId === m.user.id);
    return {
      userId: m.user.id,
      nombre: nombreVisible(m.user),
      numero: m.numero,
      posicion: m.posicion,
      rol: m.role,
      registro: registro
        ? { tournamentTeamId: registro.tournamentTeamId, equipo: registro.tournamentTeam.team.nombre, aprobado: registro.status === "ACTIVO" }
        : null,
      suspension: sancion ? { motivo: sancion.motivo } : null,
      cuotaPendiente: pago?.status === "PENDIENTE" && cuota ? { montoCents: cuota.amountCents, concepto: cuota.concepto } : null,
      amarillasAcumuladas: amarillas.get(m.user.id) ?? 0,
    };
  });
  const revision = revisarAlineacion(jugadores, {
    tournamentTeamId: inscripcion?.id ?? "",
    umbralAmarillas: reglas.amarillasParaSuspension,
  });
  return { jugadores, revision };
}
