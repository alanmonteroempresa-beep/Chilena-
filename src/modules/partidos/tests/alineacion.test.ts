import { describe, expect, it } from "vitest";
import { DomainError } from "@/modules/core";
import {
  assertAlineacionValida,
  revisarAlineacion,
  revisarJugador,
  textoAlerta,
  type JugadorParaAlinear,
} from "@/modules/partidos";

// PRD §7.6 · pantalla 53: ROJO = no puede · ÁMBAR = ojo
const CTX = { tournamentTeamId: "tt-portales", umbralAmarillas: 5 };
const registrado = { tournamentTeamId: "tt-portales", equipo: "Portales", aprobado: true };
const jugador = (nombre: string, extra: Partial<JugadorParaAlinear> = {}): JugadorParaAlinear => ({
  userId: nombre.toLowerCase().replace(/\s+/g, "-"),
  nombre,
  registro: registrado,
  ...extra,
});

describe("alertas de la alineación: rojo bloquea", () => {
  it("registrado con otro equipo del torneo (regla 4)", () => {
    const r = revisarJugador(
      jugador("El Toro", { registro: { tournamentTeamId: "tt-tigres", equipo: "Tigres", aprobado: true } }),
      CTX,
    );
    expect(r.bloqueado).toBe(true);
    expect(textoAlerta(r.alertas[0]).detalle).toBe("Ya está registrado en Tigres en este torneo.");
  });

  it("suspendido: no juega ni va a la banca", () => {
    const r = revisarJugador(
      jugador("La Roca", { suspension: { motivo: "Roja directa al 71' en la J14" } }),
      CTX,
    );
    expect(r.bloqueado).toBe(true);
    expect(textoAlerta(r.alertas[0])).toEqual({
      titulo: "suspendido",
      detalle: "Roja directa al 71' en la J14. No puede jugar ni ir a la banca.",
    });
  });

  it("no registrado en el torneo, o con la inscripción sin aprobar", () => {
    const sinRegistro = revisarJugador(jugador("Charly", { registro: null }), CTX);
    const sinAprobar = revisarJugador(
      jugador("Charly", { registro: { ...registrado, aprobado: false } }),
      CTX,
    );
    expect([sinRegistro.bloqueado, sinAprobar.bloqueado]).toEqual([true, true]);
    expect(textoAlerta(sinAprobar.alertas[0]).detalle).toBe("La liga aún no aprueba su inscripción.");
  });
});

describe("alertas de la alineación: ámbar avisa", () => {
  it("cuota pendiente: puede jugar, el delegado decide", () => {
    const r = revisarJugador(
      jugador("Kike", { cuotaPendiente: { montoCents: 65_000, concepto: "octubre" } }),
      CTX,
    );
    expect(r.bloqueado).toBe(false);
    expect(textoAlerta(r.alertas[0]).detalle).toBe("Debe $650 de octubre. Puede jugar; tú decides.");
  });

  it("a una amarilla de la suspensión", () => {
    expect(revisarJugador(jugador("El Chícharo", { amarillasAcumuladas: 4 }), CTX)).toMatchObject({
      bloqueado: false,
      alertas: [{ tipo: "AMARILLAS_AL_LIMITE", acumuladas: 4 }],
    });
    expect(revisarJugador(jugador("El Chícharo", { amarillasAcumuladas: 3 }), CTX).alertas).toEqual([]);
  });
});

describe("el servidor no guarda una alineación con alguien en rojo", () => {
  it("con un bloqueado no se puede enviar", () => {
    const revision = revisarAlineacion(
      [
        jugador("El Gato"),
        jugador("Kike", { cuotaPendiente: { montoCents: 65_000, concepto: "octubre" } }),
        jugador("La Roca", { suspension: { motivo: "Roja directa en la J14" } }),
      ],
      CTX,
    );
    expect(revision.puedeEnviar).toBe(false);
    expect(revision.bloqueados.map((b) => b.nombre)).toEqual(["La Roca"]);
    expect(() => assertAlineacionValida(revision)).toThrow(DomainError);
    expect(() => assertAlineacionValida(revision)).toThrow("La Roca no puede jugar: suspendido.");
  });

  it("solo con avisos ámbar, sí", () => {
    const revision = revisarAlineacion(
      [jugador("El Gato"), jugador("Kike", { cuotaPendiente: { montoCents: 65_000, concepto: "octubre" } })],
      CTX,
    );
    expect(revision.puedeEnviar).toBe(true);
    expect(() => assertAlineacionValida(revision)).not.toThrow();
  });
});
