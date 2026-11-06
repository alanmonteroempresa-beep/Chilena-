import { describe, expect, it } from "vitest";
import { cobradoDelPeriodo, enLista, estaVencido, pendientesDeLaLiga } from "../server/services/resumen";

// Pantalla 18 · PRD §7.11
describe("panel de la liga · hoy toca revisar", () => {
  it("solo muestra lo que está pendiente", () => {
    const p = pendientesDeLaLiga({
      cedulas: [],
      reportesAbiertos: 0,
      sinArbitro: [{ local: "Narvarte", visita: "Pensil", hora: "16:00" }],
      equiposConPagosVencidos: ["Real Condesa", "Sporting Narvarte", "Sporting Narvarte"],
    });
    expect(p.map((x) => x.clave)).toEqual(["sin-arbitro", "pagos"]);
    expect(p[0]).toMatchObject({ cantidad: 1, titulo: "Partido sin árbitro", detalle: "Narvarte vs Pensil · 16:00" });
    expect(p[1]).toMatchObject({ cantidad: 2, titulo: "Pagos sin cubrir", detalle: "Real Condesa y Sporting Narvarte" });
  });

  it("cédulas con corrección pedida", () => {
    const [c] = pendientesDeLaLiga({
      cedulas: [
        { local: "Portales", visita: "Condesa", correccion: true },
        { local: "Tepito", visita: "Doctores", correccion: false },
      ],
      reportesAbiertos: 3,
      sinArbitro: [],
      equiposConPagosVencidos: [],
    });
    expect(c).toMatchObject({ cantidad: 2, titulo: "Cédulas por revisar", detalle: "1 con corrección pedida" });
  });

  it("une nombres en español", () => {
    expect(enLista(["Condesa"])).toBe("Condesa");
    expect(enLista(["Condesa", "Narvarte", "Pensil"])).toBe("Condesa, Narvarte y Pensil");
  });

  it("cobrado del mes: sin condonados y sin 'Ya pagué' por confirmar", () => {
    const nov = (d: number) => new Date(Date.UTC(2026, 10, d));
    const r = cobradoDelPeriodo(
      [
        { amountCents: 65_000, status: "CONFIRMADO", dueDate: nov(7) },
        { amountCents: 65_000, status: "REPORTADO", dueDate: nov(7) },
        { amountCents: 30_000, status: "PENDIENTE", dueDate: nov(7) },
        { amountCents: 30_000, status: "CONDONADO", dueDate: nov(7) },
        { amountCents: 65_000, status: "CONFIRMADO", dueDate: new Date(Date.UTC(2026, 9, 31)) },
      ],
      nov(1),
      new Date(Date.UTC(2026, 11, 1)),
    );
    expect(r).toEqual({ esperadoCents: 160_000, cobradoCents: 65_000 });
  });

  it("vence al terminar el día", () => {
    const c = { status: "PENDIENTE", dueDate: new Date(Date.UTC(2026, 10, 7)) };
    expect(estaVencido(c, "2026-11-07")).toBe(false);
    expect(estaVencido(c, "2026-11-08")).toBe(true);
    expect(estaVencido({ ...c, status: "CONFIRMADO" }, "2026-12-01")).toBe(false);
  });
});
