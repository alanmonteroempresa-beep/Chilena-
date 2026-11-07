/**
 * Máquina de estados del partido y su cédula (PRD §7.7 · docs/PERMISOS.md §4). Servicio puro.
 * Quién puede hacer cada acción lo deciden las reglas de authz; aquí solo si el partido lo permite.
 *
 *   PROGRAMADO ──enviar──▶ POR_FIRMAR ──2 firmas──▶ FINALIZADO ──liga──▶ VALIDADO
 *                 (2 firmas en el celular del árbitro: directo a FINALIZADO)
 *   POR_FIRMAR: un delegado señala → cédula EN_CORRECCION (en pausa) → el árbitro responde → ENVIADA
 */

export type EstadoDelPartido =
  | "PROGRAMADO"
  | "EN_JUEGO"
  | "POR_FIRMAR"
  | "FINALIZADO"
  | "VALIDADO"
  | "EN_DISPUTA"
  | "SUSPENDIDO"
  | "REPROGRAMADO"
  | "CANCELADO"
  | "DEFAULT";
export type EstadoDeLaCedula = "BORRADOR" | "ENVIADA" | "EN_CORRECCION" | "FIRMADA" | "VALIDADA";
export type Lado = "local" | "visita";

export type Estado = {
  partido: EstadoDelPartido;
  cedula: EstadoDeLaCedula | null;
  firmas: Record<Lado, boolean>;
};

export type Accion =
  | { tipo: "ENVIAR_CEDULA"; firmas: Record<Lado, boolean> }
  | { tipo: "FIRMAR"; lado: Lado }
  | { tipo: "PEDIR_CORRECCION"; lado: Lado }
  | { tipo: "RESPONDER_CORRECCION"; aceptada: boolean; quedanPendientes: number }
  | { tipo: "VALIDAR"; horasDesdeEnvio: number };

export type Transicion = { ok: true; estado: Estado } | { ok: false; motivo: string };

/** "Firmas pendientes: si después de 48 h un delegado no firma ni señala, la liga puede validar igual" */
export const HORAS_PARA_VALIDAR_SIN_FIRMAS = 48;

/** Si el árbitro no contesta una corrección en 48 h, la contesta la liga (PRD §7.7, POR APROBAR) */
export function laLigaPuedeContestar(pedidaEn: Date, ahora: Date): boolean {
  return ahora.getTime() - pedidaEn.getTime() >= HORAS_PARA_VALIDAR_SIN_FIRMAS * 3_600_000;
}

const SIN_FIRMAS: Record<Lado, boolean> = { local: false, visita: false };
const no = (motivo: string): Transicion => ({ ok: false, motivo });
const si = (estado: Estado): Transicion => ({ ok: true, estado });
const ambas = (f: Record<Lado, boolean>) => f.local && f.visita;

export function transicion(e: Estado, a: Accion): Transicion {
  switch (a.tipo) {
    case "ENVIAR_CEDULA": {
      if (e.partido !== "PROGRAMADO" && e.partido !== "EN_JUEGO") return no("Este partido ya tiene su cédula.");
      if (e.cedula && e.cedula !== "BORRADOR") return no("La cédula ya se mandó.");
      return ambas(a.firmas)
        ? si({ partido: "FINALIZADO", cedula: "FIRMADA", firmas: a.firmas })
        : si({ partido: "POR_FIRMAR", cedula: "ENVIADA", firmas: a.firmas });
    }
    case "FIRMAR": {
      if (e.partido !== "POR_FIRMAR") return no("Esta cédula ya no se firma.");
      if (e.cedula === "EN_CORRECCION") return no("La cédula está en pausa: espera a que el árbitro conteste la corrección.");
      if (e.cedula !== "ENVIADA") return no("Esta cédula ya no se firma.");
      if (e.firmas[a.lado]) return no("Tu equipo ya firmó.");
      const firmas = { ...e.firmas, [a.lado]: true };
      return ambas(firmas)
        ? si({ partido: "FINALIZADO", cedula: "FIRMADA", firmas })
        : si({ ...e, firmas });
    }
    case "PEDIR_CORRECCION": {
      if (e.partido !== "POR_FIRMAR" || (e.cedula !== "ENVIADA" && e.cedula !== "EN_CORRECCION"))
        return no("Esta cédula ya no se corrige aquí: habla con la liga.");
      if (e.firmas[a.lado]) return no("Tu equipo ya firmó: ya no se puede señalar.");
      return si({ ...e, cedula: "EN_CORRECCION" });
    }
    case "RESPONDER_CORRECCION": {
      if (e.partido !== "POR_FIRMAR" || e.cedula !== "EN_CORRECCION") return no("No hay correcciones por contestar.");
      // Si la cédula cambió, las firmas que ya había no valen: se vuelve a firmar (POR APROBAR)
      const firmas = a.aceptada ? SIN_FIRMAS : e.firmas;
      return si({ ...e, cedula: a.quedanPendientes > 0 ? "EN_CORRECCION" : "ENVIADA", firmas });
    }
    case "VALIDAR": {
      if (e.partido === "FINALIZADO" && e.cedula === "FIRMADA") return si({ ...e, partido: "VALIDADO", cedula: "VALIDADA" });
      if (e.partido === "POR_FIRMAR" && e.cedula === "EN_CORRECCION") return no("Hay una corrección sin contestar.");
      if (e.partido === "POR_FIRMAR" && e.cedula === "ENVIADA") {
        if (a.horasDesdeEnvio >= HORAS_PARA_VALIDAR_SIN_FIRMAS) return si({ ...e, partido: "VALIDADO", cedula: "VALIDADA" });
        return no(`Faltan firmas: se puede validar sin ellas ${HORAS_PARA_VALIDAR_SIN_FIRMAS} h después de enviada.`);
      }
      return no("Este partido no tiene una cédula para validar.");
    }
  }
}

/** Lado del equipo en el partido, o null si no juega */
export function ladoDe(teamId: string, p: { homeTeamId: string; awayTeamId: string }): Lado | null {
  return teamId === p.homeTeamId ? "local" : teamId === p.awayTeamId ? "visita" : null;
}
