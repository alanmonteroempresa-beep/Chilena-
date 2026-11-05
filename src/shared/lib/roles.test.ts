import { describe, expect, it } from "vitest";
import { ROLES, accionCentral, rolDesdeRoleType } from "./roles";

describe("accionCentral (PRD §5, pantalla 07b)", () => {
  it("Jugador y Aficionado publican", () => {
    expect(accionCentral("jugador")).toMatchObject({
      clave: "publicar",
      etiqueta: "Publicar",
      href: "/publicar",
    });
    expect(accionCentral("aficionado").clave).toBe("publicar");
  });

  it("Delegado pasa lista; la ruta depende del equipo", () => {
    expect(accionCentral("delegado")).toMatchObject({
      clave: "pase-de-lista",
      etiqueta: "Pase de lista",
      href: null,
    });
  });

  it("Árbitro captura la cédula de hoy", () => {
    expect(accionCentral("arbitro")).toMatchObject({ clave: "capturar", href: "/arbitro/hoy" });
  });

  it("Liga programa la jornada; la ruta depende de la liga", () => {
    expect(accionCentral("liga")).toMatchObject({
      clave: "programar-jornada",
      nombre: "Programar jornada",
      href: null,
    });
  });

  it("El visitante ve Publicar (la ruta pide entrar)", () => {
    expect(accionCentral("visitante").clave).toBe("publicar");
  });

  it("las etiquetas caben en la barra de 390 px (≤ 13 caracteres)", () => {
    for (const rol of [...ROLES, "visitante" as const]) {
      expect(accionCentral(rol).etiqueta.length).toBeLessThanOrEqual(13);
    }
  });
});

describe("rolDesdeRoleType", () => {
  it("mapea los roles del schema a data-role", () => {
    expect(rolDesdeRoleType("JUGADOR")).toBe("jugador");
    expect(rolDesdeRoleType("DELEGADO")).toBe("delegado");
    expect(rolDesdeRoleType("ARBITRO")).toBe("arbitro");
    expect(rolDesdeRoleType("AFICIONADO")).toBe("aficionado");
    expect(rolDesdeRoleType("LIGA")).toBe("liga");
  });

  it("SUPERADMIN no es un modo de la app", () => {
    expect(rolDesdeRoleType("SUPERADMIN")).toBeNull();
  });
});
