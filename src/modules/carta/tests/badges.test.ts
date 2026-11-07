import { describe, expect, it } from "vitest";
import { BADGES } from "../badges.catalog";
import {
  evaluarInsignia,
  evaluarInsignias,
  laMasCercana,
  rachaActual,
  rachaMaxima,
  rarezas,
  type HistorialJugador,
  type PartidoHistorial,
} from "../server/badges";

// docs/CARTA_E_INSIGNIAS.md §4 · pantallas 14 y 28
let fecha = 0;
const partido = (p: Partial<PartidoHistorial> = {}): PartidoHistorial => ({
  matchId: `m${++fecha}`,
  fecha,
  enAlineacion: true,
  jugo: true,
  posicion: "DC",
  goles: [],
  penalesAtajados: 0,
  golesEnContra: 1,
  suspendido: false,
  ...p,
});
const historial = (partidos: PartidoHistorial[], extra: Partial<HistorialJugador> = {}): HistorialJugador => ({
  partidos,
  esPortero: false,
  esPionero: false,
  ...extra,
});
const badge = (code: string) => BADGES.find((b) => b.code === code)!;

describe("insignias de goles", () => {
  it("primer gol y 50 goles con su progreso", () => {
    const h = historial([partido({ goles: ["JUGADA", "PENAL"] }), partido({ goles: ["CHILENA"] })]);
    expect(evaluarInsignia(badge("PRIMER_GOL"), h)).toEqual({ code: "PRIMER_GOL", veces: 1 });
    expect(evaluarInsignia(badge("GOLES_50"), h)).toEqual({ code: "GOLES_50", veces: 0, progreso: 3, meta: 50 });
  });

  it("doblete y hat-trick se repiten; el hat-trick también es doblete", () => {
    const h = historial([partido({ goles: ["JUGADA", "JUGADA", "CABEZA"] }), partido({ goles: ["JUGADA", "JUGADA"] })]);
    expect(evaluarInsignia(badge("DOBLETE"), h).veces).toBe(2);
    expect(evaluarInsignia(badge("HAT_TRICK"), h).veces).toBe(1);
  });

  it("de chilena y a lo Panenka cuentan cada gol de ese tipo", () => {
    const h = historial([partido({ goles: ["CHILENA", "PANENKA"] }), partido({ goles: ["CHILENA"] })]);
    expect(evaluarInsignia(badge("DE_CHILENA"), h).veces).toBe(2);
    expect(evaluarInsignia(badge("PANENKA"), h).veces).toBe(1);
  });

  it("solo cuentan los partidos que jugó", () => {
    const h = historial([partido({ jugo: false, goles: ["JUGADA"] })]);
    expect(evaluarInsignia(badge("PRIMER_GOL"), h).veces).toBe(0);
  });
});

describe("insignias de portero", () => {
  it("valla invicta: de portero y sin goles en contra", () => {
    const h = historial(
      [partido({ posicion: "POR", golesEnContra: 0 }), partido({ posicion: "POR", golesEnContra: 2 }), partido({ posicion: "DFC", golesEnContra: 0 })],
      { esPortero: true },
    );
    expect(evaluarInsignia(badge("VALLA_INVICTA"), h).veces).toBe(1);
  });

  it("al de campo le dice que se ponga guantes", () => {
    const h = historial([partido()]);
    expect(evaluarInsignia(badge("VALLA_INVICTA"), h)).toMatchObject({ veces: 0, pista: "Ponte guantes" });
    expect(evaluarInsignia(badge("PENAL_ATAJADO"), h)).toMatchObject({ veces: 0, pista: "Ponte guantes" });
    expect(evaluarInsignia(badge("PENAL_ATAJADO"), historial([partido({ penalesAtajados: 1 })])).veces).toBe(1);
  });
});

describe("domingos sin faltar (PRD §7.6)", () => {
  it("la racha máxima gana la insignia aunque hoy esté más corta", () => {
    const ps = [
      ...Array.from({ length: 5 }, () => partido()),
      partido({ enAlineacion: false, jugo: false }),
      partido(),
      partido(),
    ];
    expect(rachaMaxima(ps)).toBe(5);
    expect(rachaActual(ps)).toBe(2);
    const h = historial(ps);
    expect(evaluarInsignia(badge("DOMINGOS_5"), h).veces).toBe(1);
    expect(evaluarInsignia(badge("DOMINGOS_12"), h)).toMatchObject({ veces: 0, progreso: 2, meta: 12 });
  });

  it("la banca cuenta y la suspensión pausa", () => {
    const ps = [partido(), partido({ jugo: false }), partido({ enAlineacion: false, jugo: false, suspendido: true }), partido()];
    expect(rachaActual(ps)).toBe(3);
  });
});

describe("las que dependen del torneo y de las votaciones", () => {
  const torneo = { nombre: "Apertura 2026", cerrado: false, posicionGoleo: 1, jornada: 15, jornadas: 18, amarillas: 4, rojas: 0, jugados: 14, equipo: { pj: 15, pp: 2 } };

  it("pistas con datos reales", () => {
    const h = historial([partido()], { torneo });
    expect(evaluarInsignia(badge("GOLEADOR_TORNEO"), h)).toMatchObject({ veces: 0, pista: "Vas 1º · J15/18" });
    expect(evaluarInsignia(badge("FAIR_PLAY"), h)).toMatchObject({ veces: 0, pista: "4 🟨 este torneo" });
    expect(evaluarInsignia(badge("INVICTOS"), h)).toMatchObject({ veces: 0, pista: "Próximo torneo" });
    expect(evaluarInsignia(badge("MVP"), h)).toMatchObject({ veces: 0, pista: "Por votación" });
  });

  it("las votadas cuentan las votaciones ganadas (MVP ×2)", () => {
    const h = historial([partido()], { votadas: { MVP_PARTIDO: 2 } });
    expect(evaluarInsignia(badge("MVP"), h)).toMatchObject({ veces: 2 });
    expect(evaluarInsignia(badge("EL_MURO"), h)).toMatchObject({ veces: 0, pista: "Por votación" });
  });

  it("fair play sin tarjetas muestra su avance", () => {
    const h = historial([partido()], { torneo: { ...torneo, amarillas: 0, jugados: 5 } });
    expect(evaluarInsignia(badge("FAIR_PLAY"), h)).toMatchObject({ veces: 0, progreso: 5, meta: 8 });
  });

  it("pionero de la beta", () => {
    expect(evaluarInsignia(badge("PIONERO"), historial([], { esPionero: true })).veces).toBe(1);
  });
});

describe("colección", () => {
  it("las de aficionado no salen en el perfil del jugador", () => {
    const codes = evaluarInsignias(BADGES, historial([])).map((e) => e.code);
    expect(codes).not.toContain("PORRA_DE_HIERRO");
    expect(codes).toContain("PIONERO");
  });

  it("rareza en % de jugadores y la más cercana", () => {
    const r = rarezas([
      [{ code: "PRIMER_GOL", veces: 1 }],
      [{ code: "PRIMER_GOL", veces: 0 }],
      [{ code: "PRIMER_GOL", veces: 2 }],
      [{ code: "PRIMER_GOL", veces: 0 }],
    ]);
    expect(r.get("PRIMER_GOL")).toBe(50);
    expect(
      laMasCercana([
        { code: "GOLES_50", veces: 0, progreso: 47, meta: 50 },
        { code: "DOMINGOS_25", veces: 0, progreso: 19, meta: 25 },
        { code: "PRIMER_GOL", veces: 1 },
      ])?.code,
    ).toBe("GOLES_50");
  });
});
