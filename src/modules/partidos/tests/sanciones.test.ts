import { describe, expect, it } from "vitest";
import { DomainError } from "@/modules/core";
import {
  ajustarSancion,
  alertaPreventiva,
  amarillasAcumuladas,
  partidosCumplidos,
  puntosJuegoLimpio,
  sancionesAutomaticas,
  type PartidoParaSanciones,
  type TarjetaCedula,
} from "@/modules/partidos";

// PRD §7.8 · pantalla 47
const REGLAS = { partidosPorRoja: 1, amarillasParaSuspension: 5 };
const amarilla = (jugadorId = "guero", minuto?: number): TarjetaCedula => ({
  jugadorId,
  equipoId: "RC",
  tipo: "AMARILLA",
  minuto,
});
const roja = (jugadorId = "guero", minuto?: number): TarjetaCedula => ({
  jugadorId,
  equipoId: "RC",
  tipo: "ROJA",
  minuto,
});

/** Un partido por jornada, J1, J2…, con las tarjetas dadas */
function jornadas(...tarjetas: (TarjetaCedula[] | { fase?: string; status?: string; t: TarjetaCedula[] })[]) {
  return tarjetas.map((x, i): PartidoParaSanciones => {
    const { fase = "REGULAR", status = "VALIDADO", t } = Array.isArray(x) ? { t: x } : x;
    return { matchId: `m${i + 1}`, orden: i + 1, etiqueta: `J${i + 1}`, status, fase, tarjetas: t };
  });
}

describe("sanciones automáticas", () => {
  it("roja = partidosPorRoja, con su motivo", () => {
    const [s] = sancionesAutomaticas(jornadas([roja("la-roca", 71)]), REGLAS);
    expect(s).toMatchObject({
      jugadorId: "la-roca",
      matchId: "m1",
      origen: "ROJA",
      partidos: 1,
      motivo: "Roja directa al 71' en la J1",
    });
    expect(sancionesAutomaticas(jornadas([roja()]), { ...REGLAS, partidosPorRoja: 2 })[0].partidos).toBe(2);
  });

  it("5 amarillas = 1 partido y el acumulado vuelve a 0", () => {
    const partidos = jornadas(
      [amarilla()],
      [amarilla()],
      [amarilla()],
      [amarilla()],
      [amarilla()], // 5ª → suspensión
      [amarilla()], // vuelve a empezar: 1
    );
    const sanciones = sancionesAutomaticas(partidos, REGLAS);
    expect(sanciones).toHaveLength(1);
    expect(sanciones[0]).toMatchObject({
      matchId: "m5",
      origen: "AMARILLAS",
      partidos: 1,
      motivo: "5ª amarilla en la J5",
    });
    expect(amarillasAcumuladas(partidos, REGLAS).get("guero")).toBe(1);
  });

  it("la siguiente suspensión sale con 5 más", () => {
    const diez = jornadas(...Array.from({ length: 10 }, () => [amarilla()]));
    expect(sancionesAutomaticas(diez, REGLAS).map((s) => s.matchId)).toEqual(["m5", "m10"]);
    expect(amarillasAcumuladas(diez, REGLAS).get("guero")).toBe(0);
  });

  it("doble amarilla: vale como roja (1 partido) y esas 2 amarillas no suman", () => {
    const partidos = jornadas(
      [amarilla()],
      [amarilla()],
      [amarilla()],
      [amarilla()],
      [amarilla("guero", 30), amarilla("guero", 80), roja("guero", 80)],
    );
    const sanciones = sancionesAutomaticas(partidos, REGLAS);
    expect(sanciones).toEqual([
      expect.objectContaining({
        origen: "DOBLE_AMARILLA",
        partidos: 1,
        motivo: "Doble amarilla al 80' en la J5",
      }),
    ]);
    expect(amarillasAcumuladas(partidos, REGLAS).get("guero")).toBe(4);
  });

  it("una amarilla y después roja directa: la roja suspende y la amarilla sí suma", () => {
    const partidos = jornadas([amarilla("guero", 10), roja("guero", 60)]);
    expect(sancionesAutomaticas(partidos, REGLAS).map((s) => s.origen)).toEqual(["ROJA"]);
    expect(amarillasAcumuladas(partidos, REGLAS).get("guero")).toBe(1);
  });

  it("la liguilla reinicia el acumulado", () => {
    const partidos = jornadas([amarilla()], [amarilla()], [amarilla()], [amarilla()], {
      fase: "SEMIFINAL",
      t: [amarilla()],
    });
    expect(sancionesAutomaticas(partidos, REGLAS)).toEqual([]);
    expect(amarillasAcumuladas(partidos, REGLAS).get("guero")).toBe(1);
  });

  it("regla 2: una cédula sin validar no genera nada", () => {
    const partidos = jornadas({ status: "FINALIZADO", t: [roja(), amarilla("otro")] });
    expect(sancionesAutomaticas(partidos, REGLAS)).toEqual([]);
    expect(amarillasAcumuladas(partidos, REGLAS).size).toBe(0);
  });
});

describe("alerta preventiva (usa el acumulado)", () => {
  it("con 4 de 5 avisa; con menos, no", () => {
    expect(alertaPreventiva(4, 5)).toBe("Aguas: llevas 4 amarillas. Una más y te sientas un partido.");
    expect(alertaPreventiva(3, 5)).toBeNull();
    expect(alertaPreventiva(0, 5)).toBeNull();
    expect(alertaPreventiva(2, 3)).toBe("Aguas: llevas 2 amarillas. Una más y te sientas un partido.");
  });

  it("después de cumplir por 5, la 6ª no dispara la alerta", () => {
    const seis = jornadas(...Array.from({ length: 6 }, () => [amarilla()]));
    expect(alertaPreventiva(amarillasAcumuladas(seis, REGLAS).get("guero")!, 5)).toBeNull();
  });
});

describe("juego limpio", () => {
  it("amarilla 1, roja 3; la doble amarilla vale 3 (como roja)", () => {
    const puntos = puntosJuegoLimpio([
      amarilla("a"),
      { ...roja("b"), equipoId: "RC" },
      amarilla("c"),
      amarilla("c"),
      roja("c"),
      { ...amarilla("d"), equipoId: "DP" },
    ]);
    expect(puntos.get("RC")).toBe(1 + 3 + 3);
    expect(puntos.get("DP")).toBe(1);
  });

  it("amarilla y luego roja directa: 4", () => {
    expect(puntosJuegoLimpio([amarilla(), roja()]).get("RC")).toBe(4);
  });
});

describe("partidos cumplidos", () => {
  const delEquipo = [
    { orden: 14, status: "VALIDADO" },
    { orden: 15, status: "VALIDADO" },
    { orden: 16, status: "PROGRAMADO" },
  ];
  it("cuenta solo los partidos validados del equipo después de la sanción, hasta el total", () => {
    expect(partidosCumplidos({ orden: 14, partidos: 2 }, delEquipo)).toBe(1);
    expect(partidosCumplidos({ orden: 13, partidos: 1 }, delEquipo)).toBe(1);
    expect(partidosCumplidos({ orden: 15, partidos: 1 }, delEquipo)).toBe(0);
  });
  it("un domingo sin partido (descanso, suspendido) no descuenta", () => {
    const conPausa = [
      { orden: 2, status: "SUSPENDIDO" },
      { orden: 3, status: "VALIDADO" },
    ];
    expect(partidosCumplidos({ orden: 1, partidos: 2 }, conPausa)).toBe(1);
  });
});

describe("la liga ajusta la misma sanción", () => {
  const automatica = { partidos: 1, partidosCumplidos: 0, multaCents: null, status: "ACTIVA" as const };

  it("sube de 1 a 2 partidos y agrega multa, con bitácora antes → después", () => {
    const r = ajustarSancion(automatica, {
      partidos: 2,
      multaCents: 30_000,
      motivo: "APLICAR: 2 PARTIDOS",
    });
    expect(r.sancion).toEqual({ partidos: 2, partidosCumplidos: 0, multaCents: 30_000, status: "ACTIVA" });
    expect(r.bitacora).toEqual({
      action: "UPDATE",
      before: { partidos: 1, multaCents: null },
      after: { partidos: 2, multaCents: 30_000 },
      motivo: "APLICAR: 2 PARTIDOS",
    });
    expect(r.creaCargoDeMulta).toBe(true);
  });

  it("si la baja a lo que ya cumplió, queda CUMPLIDA", () => {
    const r = ajustarSancion(
      { ...automatica, partidos: 3, partidosCumplidos: 2 },
      { partidos: 2, motivo: "Apelación" },
    );
    expect(r.sancion.status).toBe("CUMPLIDA");
    expect(r.bitacora.after).toEqual({ partidos: 2, status: "CUMPLIDA" });
  });

  it("no puede quedar en menos de lo cumplido ni en 0 partidos", () => {
    const cumplio2 = { ...automatica, partidos: 3, partidosCumplidos: 2 };
    expect(() => ajustarSancion(cumplio2, { partidos: 1, motivo: "x" })).toThrow(/Ya cumplió 2 partidos/);
    expect(() => ajustarSancion(automatica, { partidos: 0, motivo: "x" })).toThrow(/anúlala/);
  });

  it("anular deja la sanción ANULADA; una anulada ya no se ajusta", () => {
    const r = ajustarSancion(automatica, { anular: true, motivo: "El árbitro se equivocó de jugador" });
    expect(r.sancion.status).toBe("ANULADA");
    expect(() => ajustarSancion(r.sancion, { partidos: 2, motivo: "x" })).toThrow(/anulada/);
  });

  it("pide motivo, pide un cambio real y valida la multa", () => {
    expect(() => ajustarSancion(automatica, { partidos: 2, motivo: "   " })).toThrow(DomainError);
    expect(() => ajustarSancion(automatica, { partidos: 1, motivo: "x" })).toThrow(/No cambió nada/);
    expect(() => ajustarSancion(automatica, { multaCents: 299.5, motivo: "x" })).toThrow(/centavos/);
  });

  it("una multa que ya tiene cargo se condona en el cargo, no en la sanción", () => {
    const conMulta = { ...automatica, multaCents: 30_000 };
    expect(() => ajustarSancion(conMulta, { multaCents: null, motivo: "x" })).toThrow(
      /condónala en el cargo/,
    );
    expect(ajustarSancion(conMulta, { partidos: 2, motivo: "x" }).creaCargoDeMulta).toBe(false);
  });
});
