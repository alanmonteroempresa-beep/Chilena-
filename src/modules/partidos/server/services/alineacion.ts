/**
 * Alertas de la alineación (PRD §7.6 · pantalla 53). Servicio puro: sin base de datos ni Next.
 * Dos niveles:
 * - ROJO = no puede (no entra a la cédula, ni a la banca): otro equipo del torneo, suspendido, no registrado.
 * - ÁMBAR = ojo (puede jugar; el delegado decide): cuota pendiente, a una amarilla de la suspensión.
 */
import { DomainError } from "@/modules/core";
import { formatMXN } from "@/shared/lib/money";

export type AlertaAlineacion =
  | { tipo: "OTRO_EQUIPO"; equipo: string }
  | { tipo: "SUSPENDIDO"; motivo: string }
  | { tipo: "NO_REGISTRADO"; pendienteDeAprobar: boolean }
  | { tipo: "CUOTA_PENDIENTE"; montoCents: number; concepto: string }
  | { tipo: "AMARILLAS_AL_LIMITE"; acumuladas: number };

export type NivelAlerta = "ROJO" | "AMBAR";

export const NIVEL_ALERTA: Record<AlertaAlineacion["tipo"], NivelAlerta> = {
  OTRO_EQUIPO: "ROJO",
  SUSPENDIDO: "ROJO",
  NO_REGISTRADO: "ROJO",
  CUOTA_PENDIENTE: "AMBAR",
  AMARILLAS_AL_LIMITE: "AMBAR",
};

export const bloquea = (a: AlertaAlineacion) => NIVEL_ALERTA[a.tipo] === "ROJO";

export type JugadorParaAlinear = {
  userId: string;
  nombre: string;
  /** Su registro en ESTE torneo (null si no está en ninguna plantilla) */
  registro: { tournamentTeamId: string; equipo: string; aprobado: boolean } | null;
  /** Sanción activa que cumple en este partido */
  suspension?: { motivo: string } | null;
  cuotaPendiente?: { montoCents: number; concepto: string } | null;
  amarillasAcumuladas?: number;
};

export type RevisionJugador = {
  userId: string;
  nombre: string;
  alertas: AlertaAlineacion[];
  bloqueado: boolean;
};

export function revisarJugador(
  j: JugadorParaAlinear,
  ctx: { tournamentTeamId: string; umbralAmarillas: number },
): RevisionJugador {
  const alertas: AlertaAlineacion[] = [];
  if (j.registro && j.registro.tournamentTeamId !== ctx.tournamentTeamId) {
    alertas.push({ tipo: "OTRO_EQUIPO", equipo: j.registro.equipo });
  } else if (!j.registro || !j.registro.aprobado) {
    alertas.push({ tipo: "NO_REGISTRADO", pendienteDeAprobar: j.registro != null });
  }
  if (j.suspension) alertas.push({ tipo: "SUSPENDIDO", motivo: j.suspension.motivo });
  if (j.cuotaPendiente) alertas.push({ tipo: "CUOTA_PENDIENTE", ...j.cuotaPendiente });
  const acumuladas = j.amarillasAcumuladas ?? 0;
  if (ctx.umbralAmarillas > 1 && acumuladas === ctx.umbralAmarillas - 1)
    alertas.push({ tipo: "AMARILLAS_AL_LIMITE", acumuladas });
  return { userId: j.userId, nombre: j.nombre, alertas, bloqueado: alertas.some(bloquea) };
}

export function revisarAlineacion(
  jugadores: JugadorParaAlinear[],
  ctx: { tournamentTeamId: string; umbralAmarillas: number },
) {
  const porJugador = jugadores.map((j) => revisarJugador(j, ctx));
  return {
    porJugador,
    bloqueados: porJugador.filter((r) => r.bloqueado),
    puedeEnviar: porJugador.every((r) => !r.bloqueado),
  };
}

/** El servidor no guarda una alineación con alguien en rojo */
export function assertAlineacionValida(revision: ReturnType<typeof revisarAlineacion>): void {
  const [primero, ...resto] = revision.bloqueados;
  if (!primero) return;
  const alerta = primero.alertas.find(bloquea)!;
  const mas = resto.length ? ` (y ${resto.length} más)` : "";
  throw new DomainError(
    `${primero.nombre} no puede jugar: ${textoAlerta(alerta).titulo}${mas}.`,
    "ALINEACION_BLOQUEADA",
  );
}

/** Textos de la pantalla 53 */
export function textoAlerta(a: AlertaAlineacion): { titulo: string; detalle: string } {
  switch (a.tipo) {
    case "OTRO_EQUIPO":
      return {
        titulo: "registrado con otro equipo",
        detalle: `Ya está registrado en ${a.equipo} en este torneo.`,
      };
    case "SUSPENDIDO":
      return { titulo: "suspendido", detalle: `${a.motivo}. No puede jugar ni ir a la banca.` };
    case "NO_REGISTRADO":
      return {
        titulo: "no registrado en el torneo",
        detalle: a.pendienteDeAprobar
          ? "La liga aún no aprueba su inscripción."
          : "La liga lo puede registrar ahorita.",
      };
    case "CUOTA_PENDIENTE":
      return {
        titulo: "cuota pendiente",
        detalle: `Debe ${formatMXN(a.montoCents)} de ${a.concepto}. Puede jugar; tú decides.`,
      };
    case "AMARILLAS_AL_LIMITE":
      return {
        titulo: `lleva ${a.acumuladas} amarillas`,
        detalle: "Una más y se sienta un partido. Puede jugar; tú decides.",
      };
  }
}
