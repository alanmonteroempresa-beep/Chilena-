import { describe, expect, it } from "vitest";
import { rachaAsistencia, resultadoDelDomingo, type DomingoDelEquipo } from "@/modules/partidos";

// PRD §7.6, punto 4: "domingos sin faltar"
const d = (orden: number, extra: Partial<DomingoDelEquipo> = {}): DomingoDelEquipo => ({
  orden,
  status: "VALIDADO",
  enAlineacion: true,
  suspendido: false,
  ...extra,
});

describe("domingos sin faltar", () => {
  it("ir a la banca cuenta: lo que importa es estar en la alineación de la cédula", () => {
    expect(resultadoDelDomingo(d(1))).toBe("SUMA");
    expect(rachaAsistencia([d(1), d(2), d(3)])).toBe(3);
  });

  it("un partido validado sin él en la alineación corta la racha", () => {
    expect(resultadoDelDomingo(d(1, { enAlineacion: false }))).toBe("CORTA");
    expect(rachaAsistencia([d(1), d(2, { enAlineacion: false }), d(3), d(4)])).toBe(2);
  });

  it("descanso, 'No hay juego', suspendido o reprogramado: pausa (ni suma ni corta)", () => {
    for (const status of ["DESCANSO", "SUSPENDIDO", "REPROGRAMADO", "CANCELADO"])
      expect(resultadoDelDomingo(d(2, { status, enAlineacion: false }))).toBe("PAUSA");
    expect(rachaAsistencia([d(1), d(2, { status: "DESCANSO", enAlineacion: false }), d(3), d(4)])).toBe(3);
  });

  it("cumplir una suspensión es pausa", () => {
    expect(resultadoDelDomingo(d(2, { enAlineacion: false, suspendido: true }))).toBe("PAUSA");
    expect(rachaAsistencia([d(1), d(2, { enAlineacion: false, suspendido: true }), d(3)])).toBe(2);
  });

  it("regla 2: un partido sin validar todavía no cuenta", () => {
    expect(rachaAsistencia([d(1), d(2), d(3, { status: "POR_FIRMAR" })])).toBe(2);
  });

  it("el orden de la lista no importa: se cuenta desde el más reciente", () => {
    expect(rachaAsistencia([d(4), d(1, { enAlineacion: false }), d(3), d(2)])).toBe(3);
    expect(rachaAsistencia([])).toBe(0);
  });
});
