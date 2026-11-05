import { describe, expect, it } from "vitest";
import {
  aSlug,
  candidatosUsername,
  destinoTrasEntrar,
  errorDeSupabase,
  necesitaCompletarPerfil,
  nombreDesdeAuth,
  rutaSegura,
  usernameBase,
} from "../server/services/sesion";

// PRD §4.1 (Entrar) y §4.4 (perfil progresivo) · pantallas 01 y 40

describe("rutaSegura: solo rutas internas", () => {
  it("acepta rutas de Chilena con su query", () => {
    expect(rutaSegura("/i/abc123")).toBe("/i/abc123");
    expect(rutaSegura("/j/el-chicharo?ref=golazo")).toBe("/j/el-chicharo?ref=golazo");
  });

  it("rechaza redirecciones abiertas y rutas de auth", () => {
    for (const malo of [
      "https://otro.com",
      "//otro.com",
      "/\\otro.com",
      "javascript:alert(1)",
      "inicio",
      "/",
      "/entrar",
      "/entrar?next=/x",
      "/auth/confirm",
      "",
      null,
      undefined,
    ])
      expect(rutaSegura(malo)).toBeNull();
  });
});

describe("a dónde va después de entrar", () => {
  const nuevo = { nombre: "", sobrenombre: null };
  const completo = { nombre: "Luis Ángel", sobrenombre: "El Chícharo" };

  it("sin nombre o sin apodo → Completa tu perfil (40)", () => {
    expect(necesitaCompletarPerfil(nuevo)).toBe(true);
    expect(necesitaCompletarPerfil({ nombre: "Luis", sobrenombre: null })).toBe(true);
    expect(necesitaCompletarPerfil({ nombre: "  ", sobrenombre: "El Chícharo" })).toBe(true);
    expect(destinoTrasEntrar(nuevo)).toBe("/perfil/completar");
  });

  it("con nombre y apodo → su inicio, o a donde iba", () => {
    expect(necesitaCompletarPerfil(completo)).toBe(false);
    expect(destinoTrasEntrar(completo)).toBe("/inicio");
    expect(destinoTrasEntrar(completo, "/i/abc123")).toBe("/i/abc123");
    expect(destinoTrasEntrar(completo, "https://otro.com")).toBe("/inicio");
  });

  it("si le falta perfil, completa primero y luego sigue a donde iba", () => {
    expect(destinoTrasEntrar(nuevo, "/i/abc123")).toBe("/perfil/completar?next=%2Fi%2Fabc123");
  });
});

describe("username", () => {
  it("slug sin acentos ni símbolos, máximo 30", () => {
    expect(aSlug("El Chícharo")).toBe("el-chicharo");
    expect(aSlug("  Ñoño!! García  ")).toBe("nono-garcia");
    expect(aSlug("a".repeat(40))).toHaveLength(30);
  });

  it("del nombre de Google o del correo; si no alcanza, 'llanero'", () => {
    expect(usernameBase("Luis Ángel", "luis@correo.com")).toBe("luis-angel");
    expect(usernameBase("", "doña.lupe+chilena@gmail.com")).toBe("dona-lupe");
    expect(usernameBase(null, "yo@x.com")).toBe("llanero");
  });

  it("candidatos: base, numerados y al azar, sin repetir la base", () => {
    const c = candidatosUsername("lupe", () => 0.5);
    expect(c.slice(0, 3)).toEqual(["lupe", "lupe-2", "lupe-3"]);
    expect(c).toHaveLength(14);
    expect(c.at(-1)).toBe("lupe-5500");
  });
});

describe("nombre desde el proveedor", () => {
  it("Google: given_name y family_name", () => {
    expect(nombreDesdeAuth({ given_name: "Lupe", family_name: "Hernández" })).toEqual({
      nombre: "Lupe",
      apellidos: "Hernández",
    });
  });
  it("full_name se parte en nombre y apellidos; el link mágico no trae nada", () => {
    expect(nombreDesdeAuth({ full_name: "Guadalupe Hernández Ruiz" })).toEqual({
      nombre: "Guadalupe",
      apellidos: "Hernández Ruiz",
    });
    expect(nombreDesdeAuth({})).toEqual({ nombre: "", apellidos: null });
    expect(nombreDesdeAuth(null)).toEqual({ nombre: "", apellidos: null });
  });
});

describe("errores de Supabase → mensajes de la pantalla", () => {
  it("límite de correos, correo no invitado, link vencido y lo demás", () => {
    expect(errorDeSupabase({ code: "over_email_send_rate_limit" })).toBe("MUCHOS_INTENTOS");
    expect(errorDeSupabase({ status: 429 })).toBe("MUCHOS_INTENTOS");
    expect(errorDeSupabase({ code: "email_address_not_authorized" })).toBe("SIN_PERMISO_CORREO");
    expect(errorDeSupabase({ code: "email_address_invalid" })).toBe("CORREO_INVALIDO");
    expect(errorDeSupabase({ code: "otp_expired" })).toBe("LINK_VENCIDO");
    expect(errorDeSupabase({ code: "algo_raro" })).toBe("FALLA");
    expect(errorDeSupabase(null)).toBe("FALLA");
  });
});
