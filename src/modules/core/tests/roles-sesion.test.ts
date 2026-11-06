import { describe, expect, it } from "vitest";
import { hrefCentral, opcionActiva, opcionesDeRol, type Contexto } from "../server/services/roles-sesion";

// Selector de rol · pantallas 07 y 24 (PRD §3 y §5)
const portales = { color: "#0250B0", colorFranja: "#FFFFFF", siglas: "DP" };
const jugador: Contexto = { id: "jugador:dp", rol: "jugador", titulo: "Dep. Portales", extra: "#9", escudo: portales, slugEquipo: "dep-portales" };
const delegado: Contexto = { id: "delegado:dp", rol: "delegado", titulo: "Dep. Portales", escudo: portales, slugEquipo: "dep-portales" };
const liga: Contexto = { id: "liga:ldi", rol: "liga", titulo: "Liga Dominical Iztapalapa", escudo: portales, slugLiga: "dominical-iztapalapa" };

describe("opciones del selector de rol", () => {
  it("una por contexto, en el orden de los roles (jugador, delegado, árbitro, aficionado, liga)", () => {
    const o = opcionesDeRol(["liga", "delegado", "jugador"], [liga, delegado, jugador]);
    expect(o.map((x) => x.id)).toEqual(["jugador:dp", "delegado:dp", "liga:ldi"]);
  });

  it("con el rol pero sin equipo ni liga, sale una opción genérica para poder cambiar igual", () => {
    const o = opcionesDeRol(["jugador", "arbitro", "aficionado"], [jugador]);
    expect(o.map((x) => x.id)).toEqual(["jugador:dp", "arbitro:sin-contexto", "aficionado:sin-contexto"]);
    expect(o[1]).toMatchObject({ rol: "arbitro", titulo: "Sin liga", detalle: "Todavía no arbitras en una liga" });
  });

  it("no inventa roles: un contexto de un rol que la persona no tiene no sale", () => {
    expect(opcionesDeRol(["jugador"], [jugador, liga]).map((x) => x.rol)).toEqual(["jugador"]);
  });

  it("la activa es la del rol activo; si no aplica, la primera", () => {
    const o = opcionesDeRol(["jugador", "delegado"], [jugador, delegado]);
    expect(opcionActiva(o, "delegado")?.id).toBe("delegado:dp");
    expect(opcionActiva(o, "liga")?.id).toBe("jugador:dp");
    expect(opcionActiva([], "jugador")).toBeUndefined();
  });
});

describe("botón central por rol", () => {
  it("delegado → pase de lista de su equipo · liga → programar su jornada · los demás, su ruta fija", () => {
    expect(hrefCentral(delegado)).toBe("/equipo/dep-portales/pase-de-lista");
    expect(hrefCentral(liga)).toBe("/admin/dominical-iztapalapa/calendario");
    expect(hrefCentral(jugador)).toBeUndefined();
    expect(hrefCentral(undefined)).toBeUndefined();
  });
});
