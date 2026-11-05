import { describe, expect, it } from "vitest";
import { DomainError } from "@/modules/core";
import { cargoDeMulta, condonarCargo, descripcionMulta } from "@/modules/ligas";

// PRD §7.8 (multas) y §7.11 (dinero sin pasarela)
const SANCION = {
  id: "s1",
  tournamentId: "t1",
  tournamentTeamId: "tt-portales",
  matchId: "m14",
  multaCents: 30_000,
};
const DATOS = { leagueId: "l1", recordedById: "don-tono", descripcion: descripcionMulta("roja de La Roca") };

describe("multa → cargo a la liga", () => {
  it("crea un cargo MULTA por el mismo monto, ligado a la sanción", () => {
    expect(cargoDeMulta(SANCION, DATOS)).toMatchObject({
      concept: "MULTA",
      amountCents: 30_000,
      sanctionId: "s1",
      tournamentTeamId: "tt-portales",
      matchId: "m14",
      status: "PENDIENTE",
      descripcion: "Multa · roja de La Roca",
    });
  });

  it("regla 7: sin multa, con centavos no enteros o sin equipo no hay cargo", () => {
    expect(() => cargoDeMulta({ ...SANCION, multaCents: null }, DATOS)).toThrow(DomainError);
    expect(() => cargoDeMulta({ ...SANCION, multaCents: 300.5 }, DATOS)).toThrow(/centavos/);
    expect(() => cargoDeMulta({ ...SANCION, multaCents: 0 }, DATOS)).toThrow(/centavos/);
    expect(() => cargoDeMulta({ ...SANCION, tournamentTeamId: null }, DATOS)).toThrow(/equipo/);
  });
});

describe("condonar un cargo", () => {
  it("pendiente o reportado → CONDONADO, con bitácora", () => {
    expect(condonarCargo({ status: "PENDIENTE" }, "  Primera vez  ")).toEqual({
      status: "CONDONADO",
      bitacora: {
        action: "UPDATE",
        before: { status: "PENDIENTE" },
        after: { status: "CONDONADO" },
        motivo: "Primera vez",
      },
    });
    expect(condonarCargo({ status: "REPORTADO" }, "Acuerdo con el delegado").status).toBe("CONDONADO");
  });

  it("no se condona uno confirmado, uno ya condonado ni sin motivo", () => {
    expect(() => condonarCargo({ status: "CONFIRMADO" }, "x")).toThrow(/confirmado/);
    expect(() => condonarCargo({ status: "CONDONADO" }, "x")).toThrow(/condonado/);
    expect(() => condonarCargo({ status: "PENDIENTE" }, "  ")).toThrow(/por qué/);
  });
});
