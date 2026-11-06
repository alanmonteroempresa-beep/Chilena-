import { describe, expect, it } from "vitest";
import { can, registerRule } from "@/modules/core";
import { pedirCorreccionSchema, enviarCedulaSchema } from "../schemas";
import { reglaArbitroDelPartido } from "../server/reglas";
import {
  agregarTarjeta,
  aplicarCorreccion,
  lineaDeGoles,
  marcadorDeLaCedula,
  NOTA_DOBLE_AMARILLA,
  problemasDeLaCedula,
  quitarEvento,
  quitarJugador,
  textoDelEvento,
  type Cedula,
  type EventoCapturado,
} from "../server/services/cedula";
import { transicion, type Estado } from "../server/services/estado-partido";

// J16 de prueba: Portales (DP) vs Tigres (TL), pantallas 56a, 56b y 19
const ev = (id: string, tipo: EventoCapturado["tipo"], equipoId: string, jugadorId: string, minuto: number | null = null, extra: Partial<EventoCapturado> = {}): EventoCapturado => ({
  id,
  tipo,
  equipoId,
  jugadorId,
  minuto,
  tipoGol: null,
  nota: null,
  ...extra,
});
const ctx = {
  localId: "DP",
  visitaId: "TL",
  inscritos: { DP: ["gato", "chicharo", "brujo", "roca"], TL: ["poncho", "toro", "flaco"] },
  suspendidos: ["roca"],
  nombres: { chicharo: "El Chícharo", brujo: "El Brujo", roca: "La Roca", toro: "El Toro", flaco: "El Flaco" },
};
const base = (): Cedula => ({
  jugaron: { DP: ["gato", "chicharo", "brujo"], TL: ["poncho", "toro", "flaco"] },
  eventos: [ev("1", "GOL", "DP", "chicharo", 12, { tipoGol: "FUERA_DEL_AREA" }), ev("2", "GOL", "TL", "toro", 31), ev("3", "AUTOGOL", "TL", "flaco", 80)],
  observaciones: "",
});

describe("cédula al final (56a)", () => {
  it("el marcador sale de los eventos: el autogol del Flaco suma a Portales", () => {
    expect(marcadorDeLaCedula(base().eventos, "DP", "TL")).toEqual({ local: 2, visita: 1 });
    expect(lineaDeGoles(base().eventos, ctx.nombres)).toBe("El Chícharo 12' · El Toro 31' · autogol de El Flaco 80'");
  });

  it("una cédula bien llenada no tiene problemas", () => {
    expect(problemasDeLaCedula(base(), ctx)).toEqual([]);
  });

  it("el suspendido no juega y nadie juega con un equipo en el que no está registrado", () => {
    const c = base();
    c.jugaron.DP.push("roca", "toro");
    const p = problemasDeLaCedula(c, ctx);
    expect(p).toContain("La Roca está suspendido: no puede jugar.");
    expect(p).toContain("El Toro aparece dos veces.");
    expect(p).toContain("El Toro no está registrado con ese equipo en el torneo.");
  });

  it("los goles y tarjetas son de alguien que jugó; minuto opcional pero que cuadre", () => {
    const c = base();
    c.eventos.push(ev("4", "GOL", "DP", "gato", 140), ev("5", "AMARILLA", "TL", "nadie", null));
    c.jugaron.DP = c.jugaron.DP.filter((x) => x !== "chicharo");
    const p = problemasDeLaCedula(c, ctx);
    expect(p).toContain('El Chícharo tiene gol pero no está marcado en "Jugaron".');
    expect(p).toContain("El minuto 140 no cuadra.");
    expect(p).toContain('Un jugador tiene tarjeta pero no está marcado en "Jugaron".');
  });

  it("cada equipo necesita al menos uno que jugó", () => {
    expect(problemasDeLaCedula({ ...base(), jugaron: { DP: ["gato"], TL: [] } }, ctx)).toContain("Marca quién jugó de cada equipo.");
  });

  it("quitar a alguien de Jugaron se lleva sus goles", () => {
    const c = quitarJugador(base(), "DP", "chicharo");
    expect(c.jugaron.DP).toEqual(["gato", "brujo"]);
    expect(c.eventos.map((e) => e.id)).toEqual(["2", "3"]);
  });
});

describe("tarjetas (PRD §7.8)", () => {
  it("la segunda amarilla trae su roja; quitar una amarilla quita esa roja", () => {
    let r = agregarTarjeta([], ev("a1", "AMARILLA", "TL", "toro", 20), "x");
    expect(r.dobleAmarilla).toBe(false);
    r = agregarTarjeta(r.eventos, ev("a2", "AMARILLA", "TL", "toro", 60), "r1");
    expect(r.dobleAmarilla).toBe(true);
    expect(r.eventos.map((e) => e.tipo)).toEqual(["AMARILLA", "AMARILLA", "ROJA"]);
    expect(r.eventos[2]).toMatchObject({ id: "r1", minuto: 60, nota: NOTA_DOBLE_AMARILLA });
    expect(quitarEvento(r.eventos, "a2").map((e) => e.id)).toEqual(["a1"]);
  });

  it("al expulsado ya no se le saca otra tarjeta", () => {
    const r = agregarTarjeta([ev("r", "ROJA", "TL", "toro", 50)], ev("a", "AMARILLA", "TL", "toro", 70), "x");
    expect(r.rechazada).toBe(true);
    expect(r.eventos).toHaveLength(1);
  });

  it("dos rojas o tres amarillas no se pueden mandar", () => {
    const c = base();
    c.eventos.push(ev("r1", "ROJA", "TL", "toro"), ev("r2", "ROJA", "TL", "toro"));
    expect(problemasDeLaCedula(c, ctx)).toContain("El Toro tiene dos rojas.");
  });
});

describe("correcciones (pantalla 19)", () => {
  it("jugador equivocado: el gol del 12 fue del Brujo", () => {
    const es = aplicarCorreccion(base().eventos, { kind: "JUGADOR_EQUIVOCADO", eventoId: "1", propuesta: { jugadorId: "brujo", equipoId: "DP" } }, "n");
    expect(es[0]).toMatchObject({ id: "1", jugadorId: "brujo", minuto: 12, tipoGol: "FUERA_DEL_AREA" });
  });

  it("minuto y tipo de evento (el gol pasa a autogol y cambia el marcador)", () => {
    let es = aplicarCorreccion(base().eventos, { kind: "MINUTO", eventoId: "2", propuesta: { minuto: 35 } }, "n");
    expect(es[1].minuto).toBe(35);
    es = aplicarCorreccion(es, { kind: "TIPO_EVENTO", eventoId: "1", propuesta: { tipo: "AUTOGOL" } }, "n");
    expect(es[0]).toMatchObject({ tipo: "AUTOGOL", tipoGol: null });
    expect(marcadorDeLaCedula(es, "DP", "TL")).toEqual({ local: 1, visita: 2 });
  });

  it("falta un evento y sobra un evento", () => {
    let es = aplicarCorreccion(base().eventos, { kind: "FALTA_EVENTO", eventoId: null, propuesta: { tipo: "GOL", jugadorId: "brujo", equipoId: "DP", minuto: 87, tipoGol: "CHILENA" } }, "nuevo");
    expect(es.at(-1)).toMatchObject({ id: "nuevo", tipo: "GOL", jugadorId: "brujo", tipoGol: "CHILENA" });
    es = aplicarCorreccion(es, { kind: "SOBRA_EVENTO", eventoId: "3", propuesta: {} }, "n");
    expect(es.map((e) => e.id)).toEqual(["1", "2", "nuevo"]);
  });

  it("dice / debe decir", () => {
    expect(textoDelEvento(ev("x", "GOL", "DP", "brujo", 63), ctx.nombres)).toBe("Gol · El Brujo · 63'");
  });
});

describe("estados del partido (máquina de estados)", () => {
  const programado: Estado = { partido: "PROGRAMADO", cedula: null, firmas: { local: false, visita: false } };
  const enviar = (local = false, visita = false) => transicion(programado, { tipo: "ENVIAR_CEDULA", firmas: { local, visita } });
  const ok = (t: ReturnType<typeof transicion>) => {
    if (!t.ok) throw new Error(t.motivo);
    return t.estado;
  };

  it("enviar sin firmas → POR_FIRMAR; con las dos firmas en el celular del árbitro → FINALIZADO", () => {
    expect(ok(enviar())).toMatchObject({ partido: "POR_FIRMAR", cedula: "ENVIADA" });
    expect(ok(enviar(true, true))).toMatchObject({ partido: "FINALIZADO", cedula: "FIRMADA" });
    expect(transicion(ok(enviar()), { tipo: "ENVIAR_CEDULA", firmas: { local: false, visita: false } }).ok).toBe(false);
  });

  it("con la segunda firma queda FINALIZADO; nadie firma dos veces", () => {
    const una = ok(transicion(ok(enviar(true)), { tipo: "FIRMAR", lado: "visita" }));
    expect(una).toMatchObject({ partido: "FINALIZADO", cedula: "FIRMADA" });
    expect(transicion(ok(enviar(true)), { tipo: "FIRMAR", lado: "local" }).ok).toBe(false);
  });

  it("señalar pone la cédula en pausa: no se firma hasta que el árbitro conteste", () => {
    const pausa = ok(transicion(ok(enviar()), { tipo: "PEDIR_CORRECCION", lado: "visita" }));
    expect(pausa.cedula).toBe("EN_CORRECCION");
    expect(transicion(pausa, { tipo: "FIRMAR", lado: "local" }).ok).toBe(false);
    expect(ok(transicion(pausa, { tipo: "RESPONDER_CORRECCION", aceptada: false, quedanPendientes: 0 })).cedula).toBe("ENVIADA");
    expect(ok(transicion(pausa, { tipo: "RESPONDER_CORRECCION", aceptada: false, quedanPendientes: 1 })).cedula).toBe("EN_CORRECCION");
    // Una cédula ya firmada no se corrige aquí
    expect(transicion({ ...pausa, partido: "FINALIZADO" }, { tipo: "RESPONDER_CORRECCION", aceptada: true, quedanPendientes: 0 }).ok).toBe(false);
    expect(transicion(ok(enviar(true, true)), { tipo: "PEDIR_CORRECCION", lado: "visita" }).ok).toBe(false);
  });

  it("quien ya firmó no señala; si se acepta una corrección se vuelve a firmar", () => {
    const firmoLocal = ok(enviar(true));
    expect(transicion(firmoLocal, { tipo: "PEDIR_CORRECCION", lado: "local" }).ok).toBe(false);
    const pausa = ok(transicion(firmoLocal, { tipo: "PEDIR_CORRECCION", lado: "visita" }));
    expect(ok(transicion(pausa, { tipo: "RESPONDER_CORRECCION", aceptada: true, quedanPendientes: 0 })).firmas).toEqual({ local: false, visita: false });
  });

  it("la liga valida lo firmado; sin firmas, hasta 48 h después; nunca con una corrección pendiente", () => {
    const firmada = ok(enviar(true, true));
    expect(ok(transicion(firmada, { tipo: "VALIDAR", horasDesdeEnvio: 0 }))).toMatchObject({ partido: "VALIDADO", cedula: "VALIDADA" });
    expect(transicion(ok(enviar()), { tipo: "VALIDAR", horasDesdeEnvio: 47 }).ok).toBe(false);
    expect(transicion(ok(enviar()), { tipo: "VALIDAR", horasDesdeEnvio: 48 }).ok).toBe(true);
    const pausa = ok(transicion(ok(enviar()), { tipo: "PEDIR_CORRECCION", lado: "visita" }));
    expect(transicion(pausa, { tipo: "VALIDAR", horasDesdeEnvio: 100 }).ok).toBe(false);
    expect(transicion(programado, { tipo: "VALIDAR", horasDesdeEnvio: 100 }).ok).toBe(false);
  });
});

describe("permisos de la cédula (PERMISOS §4)", () => {
  const asignaciones: Record<string, { refereeId: string; refereeStatus: string }> = {
    j16: { refereeId: "mendoza", refereeStatus: "ACEPTADO" },
    j17: { refereeId: "mendoza", refereeStatus: "ASIGNADO" },
  };
  registerRule("report.capture", reglaArbitroDelPartido(async (m) => asignaciones[m] ?? null, { aceptado: true }));
  registerRule("report.respondCorrection", reglaArbitroDelPartido(async (m) => asignaciones[m] ?? null));
  it("solo el árbitro asignado y que aceptó ESE partido llena su cédula", async () => {
    expect(await can("mendoza", "report.capture", { matchId: "j16" })).toBe(true);
    expect(await can("pacheco", "report.capture", { matchId: "j16" })).toBe(false);
    expect(await can("mendoza", "report.capture", { matchId: "j17" })).toBe(false);
    expect(await can("mendoza", "report.capture", { matchId: "otro" })).toBe(false);
    expect(await can("mendoza", "report.capture")).toBe(false);
  });
  it("las correcciones las contesta el árbitro de esa cédula", async () => {
    expect(await can("mendoza", "report.respondCorrection", { matchId: "j17" })).toBe(true);
    expect(await can("pacheco", "report.respondCorrection", { matchId: "j16" })).toBe(false);
  });
});

describe("esquemas de la cédula", () => {
  const u = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  it("una firma por equipo y el trazo es un path simple", () => {
    const cedula = { matchId: u(1), clientId: u(2), jugaron: [{ teamId: u(3), userIds: [] }, { teamId: u(4), userIds: [] }], eventos: [], observaciones: "" };
    const firma = (teamId: string, trazo = "M1 2 L3 4 L5 6") => ({ teamId, firmanteId: u(9), trazo });
    expect(enviarCedulaSchema.safeParse({ ...cedula, firmas: [firma(u(3)), firma(u(4))] }).success).toBe(true);
    expect(enviarCedulaSchema.safeParse({ ...cedula, firmas: [firma(u(3)), firma(u(3))] }).success).toBe(false);
    expect(enviarCedulaSchema.safeParse({ ...cedula, firmas: [firma(u(3), "<script>")] }).success).toBe(false);
  });

  it("cada corrección trae lo que necesita", () => {
    const c = { matchId: u(1), teamId: u(2), comentario: "" };
    expect(pedirCorreccionSchema.safeParse({ ...c, kind: "MINUTO", eventoId: u(5), propuesta: { minuto: 63 } }).success).toBe(true);
    expect(pedirCorreccionSchema.safeParse({ ...c, kind: "MINUTO", eventoId: null, propuesta: { minuto: 63 } }).success).toBe(false);
    expect(pedirCorreccionSchema.safeParse({ ...c, kind: "FALTA_EVENTO", eventoId: null, propuesta: { tipo: "GOL" } }).success).toBe(false);
    expect(pedirCorreccionSchema.safeParse({ ...c, kind: "JUGADOR_EQUIVOCADO", eventoId: u(5), propuesta: { jugadorId: u(6), equipoId: u(2) } }).success).toBe(true);
  });
});
