/**
 * Cargos de la liga al equipo (PRD §7.11). Servicio puro: sin base de datos ni Next.
 * Multas (PRD §7.8): la sanción con multa crea su cargo MULTA por el mismo monto, ligado por `sanctionId`.
 * Condonar se hace en el cargo, con bitácora. Dinero en centavos (regla 7); la app no cobra.
 */
import { DomainError } from "@/modules/core";

export type SancionConMulta = {
  id: string;
  tournamentId: string;
  tournamentTeamId: string | null;
  matchId: string | null;
  multaCents: number | null;
};

export type CargoDeMulta = {
  leagueId: string;
  tournamentId: string;
  tournamentTeamId: string;
  matchId: string | null;
  sanctionId: string;
  concept: "MULTA";
  descripcion: string;
  amountCents: number;
  dueDate: Date | null;
  status: "PENDIENTE";
  recordedById: string;
};

/** "Multa · roja de La Roca" */
export const descripcionMulta = (motivoCorto: string) => `Multa · ${motivoCorto}`;

export function cargoDeMulta(
  sancion: SancionConMulta,
  datos: { leagueId: string; recordedById: string; descripcion: string; dueDate?: Date | null },
): CargoDeMulta {
  if (sancion.multaCents == null) throw new DomainError("Esta sanción no trae multa.", "SANCION_SIN_MULTA");
  if (!Number.isInteger(sancion.multaCents) || sancion.multaCents <= 0)
    throw new DomainError("La multa va en centavos enteros y mayor a cero.", "MULTA_INVALIDA");
  if (!sancion.tournamentTeamId)
    throw new DomainError("La multa se le cobra a un equipo del torneo.", "MULTA_SIN_EQUIPO");
  return {
    leagueId: datos.leagueId,
    tournamentId: sancion.tournamentId,
    tournamentTeamId: sancion.tournamentTeamId,
    matchId: sancion.matchId,
    sanctionId: sancion.id,
    concept: "MULTA",
    descripcion: datos.descripcion,
    amountCents: sancion.multaCents,
    dueDate: datos.dueDate ?? null,
    status: "PENDIENTE",
    recordedById: datos.recordedById,
  };
}

export type EstadoCargo = "PENDIENTE" | "REPORTADO" | "CONFIRMADO" | "CONDONADO";

/** La liga perdona el cargo (multa u otro). Uno ya confirmado no se condona. */
export function condonarCargo(cargo: { status: EstadoCargo }, motivo: string) {
  const m = motivo.trim();
  if (!m) throw new DomainError("Escribe por qué se condona.", "CARGO_SIN_MOTIVO");
  if (cargo.status === "CONFIRMADO")
    throw new DomainError(
      "Este cargo ya está pagado y confirmado: no se puede condonar.",
      "CARGO_CONFIRMADO",
    );
  if (cargo.status === "CONDONADO") throw new DomainError("Este cargo ya está condonado.", "CARGO_CONDONADO");
  return {
    status: "CONDONADO" as const,
    bitacora: {
      action: "UPDATE" as const,
      before: { status: cargo.status },
      after: { status: "CONDONADO" as const },
      motivo: m,
    },
  };
}
