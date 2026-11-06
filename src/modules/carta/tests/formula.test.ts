import { describe, expect, it } from "vitest";
import {
  bonoDefensivo,
  calcularCarta,
  crack,
  grupoDePosicion,
  interpolar,
  nivelDeCarta,
  penales,
  respeto,
  TABLAS,
  type Ventana,
} from "../server/formula";

// docs/CARTA_E_INSIGNIAS.md §1
const ventana = (v: Partial<Ventana> = {}): Ventana => ({
  convocados: 15,
  jugados: 14,
  goles: 0,
  asistencias: 0,
  amarillas: 0,
  rojas: 0,
  mvps: 0,
  porcentajeVotos: 0,
  votosDeRivales: [],
  vallasInvictas: 0,
  golesRecibidos: 0,
  penalesAtajados: 0,
  ...v,
});

describe("interpolación de las tablas (§1.2 y §1.3)", () => {
  it("toma los puntos exactos y los intermedios en línea recta", () => {
    expect(interpolar(0, TABLAS.DEF)).toBe(45);
    expect(interpolar(0.25, TABLAS.DEF)).toBe(60);
    expect(interpolar(0.375, TABLAS.DEF)).toBe(65);
    expect(interpolar(1.25, TABLAS.DEF)).toBe(90);
    expect(interpolar(0.6, TABLAS.PAS)).toBeCloseTo(82.5);
    expect(interpolar(0.9, TABLAS.CON)).toBeCloseTo(88.5);
  });

  it("fuera de rango toma el extremo", () => {
    expect(interpolar(3, TABLAS.DEF)).toBe(95);
    expect(interpolar(-1, TABLAS.PAS)).toBe(45);
    expect(interpolar(2, TABLAS.VAL)).toBe(92);
  });

  it("SEG: menos goles recibidos es mejor", () => {
    expect(interpolar(0.2, TABLAS.SEG)).toBe(90);
    expect(interpolar(1.5, TABLAS.SEG)).toBe(75);
    expect(interpolar(6, TABLAS.SEG)).toBe(45);
  });
});

describe("atributos con regla propia", () => {
  it("CRK: 55 + 10 × MVP + 0.2 × % de votos, máximo 99", () => {
    expect(crack(0, 0)).toBe(55);
    expect(crack(2, 46)).toBeCloseTo(84.2);
    expect(crack(5, 80)).toBe(99);
  });

  it("RES: con menos de 5 votos de rivales es 70", () => {
    expect(respeto([5, 5, 5, 5])).toBe(70);
    expect(respeto([3, 3, 3, 3, 3])).toBe(68);
    expect(respeto([5, 5, 5, 5, 5, 5])).toBe(95);
    expect(respeto([1, 1, 1, 1, 1])).toBe(40);
  });

  it("PEN: 50 + 12 × atajados, máximo 95", () => {
    expect(penales(0)).toBe(50);
    expect(penales(2)).toBe(74);
    expect(penales(4)).toBe(95);
  });

  it("bono defensivo por vallas invictas por partido", () => {
    expect(bonoDefensivo(0.19)).toBe(0);
    expect(bonoDefensivo(0.2)).toBe(1);
    expect(bonoDefensivo(0.45)).toBe(2);
    expect(bonoDefensivo(0.6)).toBe(3);
    expect(bonoDefensivo(1)).toBe(3);
  });
});

describe("grupo de posición (§1.1)", () => {
  it("de la posición, luego la más jugada, luego MEDIO", () => {
    expect(grupoDePosicion("POR")).toBe("PORTERO");
    expect(grupoDePosicion("LAT")).toBe("DEFENSA");
    expect(grupoDePosicion("MCO")).toBe("MEDIO");
    expect(grupoDePosicion("EXT")).toBe("DELANTERO");
    expect(grupoDePosicion(null, "DC")).toBe("DELANTERO");
    expect(grupoDePosicion(null, null)).toBe("MEDIO");
  });
});

describe("niveles (§1.5)", () => {
  it("bronce < 67, plata 67–74, oro 75+, leyenda 78+ con 30 partidos (cortes por aprobar)", () => {
    expect(nivelDeCarta(66, 14)).toBe("bronce");
    expect(nivelDeCarta(67, 14)).toBe("plata");
    expect(nivelDeCarta(74, 14)).toBe("plata");
    expect(nivelDeCarta(75, 14)).toBe("oro");
    expect(nivelDeCarta(90, 29)).toBe("oro");
    expect(nivelDeCarta(78, 30)).toBe("leyenda");
    expect(nivelDeCarta(77, 30)).toBe("oro");
  });

  it("en construcción siempre es bronce", () => {
    expect(nivelDeCarta(null, 2)).toBe("bronce");
    expect(nivelDeCarta(90, 2)).toBe("bronce");
  });
});

describe("la carta completa", () => {
  it("delantero: el Chícharo de la semilla (19 goles y 7 asistencias en 14 de 15, 4 amarillas)", () => {
    const c = calcularCarta(ventana({ goles: 19, asistencias: 7, amarillas: 4 }), "DELANTERO", 14);
    expect(c.atributos.map((a) => [a.clave, a.valor])).toEqual([
      ["DEF", 92],
      ["PAS", 79],
      ["CON", 91],
      ["DIS", 79],
      ["CRK", 55],
      ["RES", 70],
    ]);
    // .35·92 + .15·79 + .15·91 + .10·79 + .15·55 + .10·70 = 80.85
    expect(c.media).toBe(81);
    expect(c.nivel).toBe("oro");
  });

  it("portero: otros atributos (VAL, SEG, PEN, CON, DIS, CRK)", () => {
    const c = calcularCarta(ventana({ jugados: 15, convocados: 15, vallasInvictas: 4, golesRecibidos: 9, penalesAtajados: 2 }), "PORTERO", 15);
    expect(c.atributos.map((a) => a.clave)).toEqual(["VAL", "SEG", "PEN", "CON", "DIS", "CRK"]);
    expect(c.atributos.find((a) => a.clave === "PEN")!.valor).toBe(74);
    expect(c.media).not.toBeNull();
  });

  it("al defensa se le suma el bono de vallas", () => {
    const sin = calcularCarta(ventana({ vallasInvictas: 0 }), "DEFENSA", 14);
    const con = calcularCarta(ventana({ vallasInvictas: 9 }), "DEFENSA", 14);
    expect(con.media! - sin.media!).toBe(3);
  });

  it("la media queda entre 40 y 99", () => {
    const peor = calcularCarta(ventana({ jugados: 1, convocados: 15, amarillas: 20, rojas: 5 }), "DEFENSA", 14);
    expect(peor.media).toBeGreaterThanOrEqual(40);
    const mejor = calcularCarta(
      ventana({ jugados: 15, convocados: 15, goles: 40, asistencias: 20, mvps: 10, porcentajeVotos: 90, votosDeRivales: [5, 5, 5, 5, 5] }),
      "DELANTERO",
      40,
    );
    expect(mejor.media).toBeLessThanOrEqual(99);
    expect(mejor.nivel).toBe("leyenda");
  });

  it("con menos de 3 partidos: en construcción, sin media y bronce", () => {
    const c = calcularCarta(ventana({ jugados: 1, convocados: 1, goles: 3 }), "MEDIO", 1);
    expect(c.enConstruccion).toBe(true);
    expect(c.media).toBeNull();
    expect(c.nivel).toBe("bronce");
  });
});
