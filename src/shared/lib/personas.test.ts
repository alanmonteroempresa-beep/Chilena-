import { describe, expect, it } from "vitest";
import { inicialesDe, nombreCorto, nombreDeArbitro, nombreVisible } from "./personas";

describe("nombres en pantalla", () => {
  it("nombre corto de los 8 equipos de la liga demo", () => {
    expect(
      [
        "Dep. Portales",
        "Tigres del Llano",
        "Real Condesa",
        "Juventud Tepito",
        "Atlético Pensil",
        "Unión Doctores",
        "Sporting Narvarte",
        "Halcones Iztapalapa",
      ].map(nombreCorto),
    ).toEqual(["Portales", "Tigres", "Condesa", "Tepito", "Pensil", "Doctores", "Narvarte", "Halcones"]);
  });

  it("el apodo manda y las iniciales salen de las primeras dos palabras", () => {
    expect(nombreVisible({ sobrenombre: "El Chícharo", nombre: "Luis" })).toBe("El Chícharo");
    expect(nombreVisible({ sobrenombre: " ", nombre: "Jorge" })).toBe("Jorge");
    expect(inicialesDe("Doña Lupe")).toBe("DL");
    expect(inicialesDe("El Brujo")).toBe("BR");
    expect(inicialesDe("El Chícharo")).toBe("CH");
    expect(inicialesDe("Memo")).toBe("ME");
    expect(inicialesDe("Memo Salas")).toBe("MS");
    expect(inicialesDe("")).toBe("CH");
  });

  it("árbitros como en el rol de juegos", () => {
    expect(nombreDeArbitro({ nombre: "Jorge", apellidos: "Mendoza Ruiz" })).toBe("J. Mendoza");
    expect(nombreDeArbitro({ nombre: "Rubén", apellidos: null })).toBe("Rubén");
  });
});
