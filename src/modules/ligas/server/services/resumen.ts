/**
 * Panel de la liga · Resumen (pantalla 18). Servicio puro: sin base de datos ni Next.
 * "Hoy toca revisar": solo lo que de verdad está pendiente, con datos reales (regla 9).
 */

export type PendienteLiga = {
  clave: "cedulas" | "reportes" | "sin-arbitro" | "pagos";
  cantidad: number;
  titulo: string;
  detalle: string;
};

type Partido = { local: string; visita: string };

/** "Condesa y Narvarte" · "Condesa, Narvarte y Pensil" */
export function enLista(nombres: string[]): string {
  const unicos = [...new Set(nombres)];
  if (unicos.length <= 1) return unicos[0] ?? "";
  return `${unicos.slice(0, -1).join(", ")} y ${unicos.at(-1)}`;
}

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

export function pendientesDeLaLiga(entrada: {
  /** Cédulas enviadas o firmadas que esperan la validación de la liga; `correccion` = alguien pidió corregir */
  cedulas: (Partido & { correccion: boolean })[];
  reportesAbiertos: number;
  /** Partidos de la jornada que viene sin árbitro asignado */
  sinArbitro: (Partido & { hora: string })[];
  /** Equipos con cargos vencidos sin pagar (o con "Ya pagué" sin confirmar) */
  equiposConPagosVencidos: string[];
}): PendienteLiga[] {
  const { cedulas, reportesAbiertos, sinArbitro, equiposConPagosVencidos } = entrada;
  const pendientes: PendienteLiga[] = [];
  if (cedulas.length) {
    const conCorreccion = cedulas.filter((c) => c.correccion);
    pendientes.push({
      clave: "cedulas",
      cantidad: cedulas.length,
      titulo: plural(cedulas.length, "Cédula por revisar", "Cédulas por revisar"),
      detalle: conCorreccion.length
        ? `${conCorreccion.length} con corrección pedida`
        : cedulas.map((c) => `${c.local} vs ${c.visita}`).join(" · "),
    });
  }
  if (reportesAbiertos > 0) {
    pendientes.push({
      clave: "reportes",
      cantidad: reportesAbiertos,
      titulo: plural(reportesAbiertos, "Comentario reportado", "Comentarios reportados"),
      detalle: "La porra se calentó",
    });
  }
  if (sinArbitro.length) {
    pendientes.push({
      clave: "sin-arbitro",
      cantidad: sinArbitro.length,
      titulo: plural(sinArbitro.length, "Partido sin árbitro", "Partidos sin árbitro"),
      detalle: sinArbitro.map((p) => `${p.local} vs ${p.visita} · ${p.hora}`).join(" · "),
    });
  }
  const equipos = [...new Set(equiposConPagosVencidos)];
  if (equipos.length) {
    pendientes.push({
      clave: "pagos",
      cantidad: equipos.length,
      titulo: plural(equipos.length, "Pago sin cubrir", "Pagos sin cubrir"),
      detalle: enLista(equipos),
    });
  }
  return pendientes;
}

export type CargoParaCobro = { amountCents: number; status: string; dueDate: Date | null };

/**
 * "Cobrado en octubre $18,400 de $21,000" (pantalla 18, PRD §7.11): cargos que vencen en el periodo.
 * Lo condonado no se espera ni se cobra; "Ya pagué" sin confirmar todavía no es cobrado.
 */
export function cobradoDelPeriodo(cargos: CargoParaCobro[], desde: Date, hasta: Date) {
  const delPeriodo = cargos.filter(
    (c) => c.dueDate && c.dueDate >= desde && c.dueDate < hasta && c.status !== "CONDONADO",
  );
  return {
    esperadoCents: delPeriodo.reduce((s, c) => s + c.amountCents, 0),
    cobradoCents: delPeriodo.filter((c) => c.status === "CONFIRMADO").reduce((s, c) => s + c.amountCents, 0),
  };
}

/** ¿Vencido? La fecha de vencimiento es un día (`@db.Date`): vence al terminar ese día en CDMX. */
export function estaVencido(c: { status: string; dueDate: Date | null }, hoyYmd: string): boolean {
  if (!c.dueDate || c.status === "CONFIRMADO" || c.status === "CONDONADO") return false;
  return c.dueDate.toISOString().slice(0, 10) < hoyYmd;
}
