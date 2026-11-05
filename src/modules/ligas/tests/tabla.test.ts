import { describe, expect, it } from "vitest";
import { calcularTabla, type PartidoTabla } from "@/modules/ligas";

// PRD §7.13: puntos → diferencia → goles a favor → entre ellos → juego limpio → sorteo
const REGLAS = { puntosVictoria: 3, puntosEmpate: 1 };
const equipos = (...ids: string[]) => ids.map((id) => ({ id, nombre: `Equipo ${id}` }));

function partidos(...lista: [string, string, number, number, Partial<PartidoTabla>?][]): PartidoTabla[] {
  return lista.map(([localId, visitanteId, golesLocal, golesVisitante, extra], i) => ({
    localId,
    visitanteId,
    golesLocal,
    golesVisitante,
    status: "VALIDADO",
    orden: i + 1,
    ...extra,
  }));
}

const orden = (tabla: ReturnType<typeof calcularTabla>) => tabla.map((f) => f.equipoId);
const fila = (tabla: ReturnType<typeof calcularTabla>, id: string) => tabla.find((f) => f.equipoId === id)!;

describe("tabla: puntos y regla 2", () => {
  it("usa los puntos del torneo y solo los partidos VALIDADOS de la fase regular", () => {
    const tabla = calcularTabla({
      equipos: equipos("A", "B"),
      reglas: { puntosVictoria: 2, puntosEmpate: 1 },
      partidos: partidos(
        ["A", "B", 2, 0],
        ["B", "A", 1, 1],
        ["A", "B", 0, 5, { status: "FINALIZADO" }], // sin validar
        ["A", "B", 0, 3, { fase: "SEMIFINAL" }], // liguilla
        ["A", "B", 0, 0, { golesLocal: null, golesVisitante: null }],
      ),
    });
    expect(fila(tabla, "A")).toMatchObject({
      pj: 2,
      pg: 1,
      pe: 1,
      pp: 0,
      gf: 3,
      gc: 1,
      dg: 2,
      pts: 3,
      posicion: 1,
    });
    expect(fila(tabla, "B")).toMatchObject({ pj: 2, pts: 1, posicion: 2 });
  });

  it("sin empates en puntos no hay desempate", () => {
    const tabla = calcularTabla({
      equipos: equipos("A", "B"),
      reglas: REGLAS,
      partidos: partidos(["A", "B", 1, 0]),
    });
    expect(tabla.map((f) => f.desempate)).toEqual([null, null]);
  });

  it("racha: los últimos 5, del más viejo al más reciente", () => {
    const tabla = calcularTabla({
      equipos: equipos("A", "B"),
      reglas: REGLAS,
      partidos: partidos(
        ["A", "B", 0, 1],
        ["A", "B", 1, 0],
        ["A", "B", 1, 1],
        ["B", "A", 0, 2],
        ["A", "B", 0, 3],
        ["A", "B", 2, 0],
      ),
    });
    expect(fila(tabla, "A").racha).toBe("GEGPG");
    expect(fila(tabla, "B").racha).toBe("PEPGP");
  });
});

describe("tabla: desempate", () => {
  it("1. diferencia de goles", () => {
    const tabla = calcularTabla({
      equipos: equipos("A", "B", "C", "D"),
      reglas: REGLAS,
      partidos: partidos(["A", "C", 3, 0], ["B", "D", 1, 0]),
    });
    expect(orden(tabla).slice(0, 2)).toEqual(["A", "B"]);
    expect(fila(tabla, "A").desempate).toBe("DIFERENCIA");
  });

  it("2. goles a favor", () => {
    const tabla = calcularTabla({
      equipos: equipos("A", "B", "C", "D"),
      reglas: REGLAS,
      partidos: partidos(["A", "C", 3, 1], ["B", "D", 2, 0]),
    });
    expect(orden(tabla).slice(0, 2)).toEqual(["A", "B"]);
    expect(fila(tabla, "B").desempate).toBe("GOLES_A_FAVOR");
  });

  it("3. resultado entre ellos, después de diferencia y goles", () => {
    // A y B: 3 pts, DG 0, GF 1. B le ganó a A. D sube por diferencia.
    const tabla = calcularTabla({
      equipos: equipos("A", "B", "C", "D"),
      reglas: REGLAS,
      partidos: partidos(["A", "B", 0, 1], ["A", "C", 1, 0], ["D", "B", 1, 0]),
    });
    expect(orden(tabla)).toEqual(["D", "B", "A", "C"]);
    expect(fila(tabla, "D").desempate).toBe("DIFERENCIA");
    expect(fila(tabla, "B").desempate).toBe("ENTRE_ELLOS");
  });

  it("3b. entre ellos se vuelve a aplicar solo a los que siguen empatados", () => {
    // A, B y C: 6 pts, DG +2, GF 6. Entre los tres: B y C (+1) arriba de A (-2); entre B y C, B ganó 2–0.
    const tabla = calcularTabla({
      equipos: equipos("A", "B", "C", "Z"),
      reglas: REGLAS,
      partidos: partidos(
        ["B", "C", 2, 0],
        ["A", "B", 1, 0],
        ["C", "A", 3, 0],
        ["A", "Z", 5, 1],
        ["B", "Z", 4, 3],
        ["C", "Z", 3, 2],
      ),
    });
    for (const id of ["A", "B", "C"]) expect(fila(tabla, id)).toMatchObject({ pts: 6, dg: 2, gf: 6 });
    expect(orden(tabla)).toEqual(["B", "C", "A", "Z"]);
    expect(tabla.slice(0, 3).every((f) => f.desempate === "ENTRE_ELLOS" && !f.empateSinResolver)).toBe(true);
  });

  it("4. juego limpio: menos puntos de tarjetas", () => {
    const tabla = calcularTabla({
      equipos: equipos("A", "B", "Z"),
      reglas: REGLAS,
      partidos: partidos(
        ["A", "Z", 1, 0, { juegoLimpio: { local: 5, visitante: 0 } }],
        ["B", "Z", 1, 0, { juegoLimpio: { local: 2, visitante: 1 } }],
      ),
    });
    expect(orden(tabla).slice(0, 2)).toEqual(["B", "A"]);
    expect(fila(tabla, "B")).toMatchObject({ juegoLimpio: 2, desempate: "JUEGO_LIMPIO" });
    expect(fila(tabla, "Z").juegoLimpio).toBe(1);
  });

  it("5. sorteo de la liga; sin sorteo, el empate queda sin resolver", () => {
    const empatados = partidos(["A", "Z", 1, 0], ["B", "Z", 1, 0]);
    const sinSorteo = calcularTabla({ equipos: equipos("B", "A", "Z"), reglas: REGLAS, partidos: empatados });
    expect(orden(sinSorteo).slice(0, 2)).toEqual(["A", "B"]); // provisional, por nombre
    expect(sinSorteo.slice(0, 2).every((f) => f.empateSinResolver)).toBe(true);
    expect(fila(sinSorteo, "Z").empateSinResolver).toBe(false);

    const conSorteo = calcularTabla({
      equipos: equipos("A", "B", "Z"),
      reglas: REGLAS,
      partidos: empatados,
      sorteo: ["B", "A"],
    });
    expect(orden(conSorteo).slice(0, 2)).toEqual(["B", "A"]);
    expect(fila(conSorteo, "B")).toMatchObject({ desempate: "SORTEO", empateSinResolver: false });
  });

  it("el orden de los criterios es el de la Liga MX: la diferencia gana al resultado entre ellos", () => {
    // B le ganó a A, pero A tiene mejor diferencia: A arriba
    const tabla = calcularTabla({
      equipos: equipos("A", "B", "C", "D"),
      reglas: REGLAS,
      partidos: partidos(["A", "B", 0, 1], ["A", "C", 5, 0], ["D", "B", 1, 0]),
    });
    expect(orden(tabla).indexOf("A")).toBeLessThan(orden(tabla).indexOf("B"));
  });
});
