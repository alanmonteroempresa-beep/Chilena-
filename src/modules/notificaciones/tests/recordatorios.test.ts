import { describe, expect, it } from "vitest";
import { claveDeRecordatorio, quienesRecordar, tocaRecordar } from "../server/services/recordatorios";

// "Te toca jugar" (docs/NOTIFICACIONES.md §2)
describe("recordatorio del partido", () => {
  it("a los que dijeron Voy y al árbitro solo si aceptó", () => {
    expect(quienesRecordar({ confirmados: ["chicharo", "brujo"], arbitro: { id: "mendoza", aceptado: true } })).toEqual({
      jugadores: ["chicharo", "brujo"],
      arbitro: "mendoza",
    });
    expect(quienesRecordar({ confirmados: ["chicharo"], arbitro: { id: "mendoza", aceptado: false } }).arbitro).toBeNull();
  });
  it("si el árbitro también dijo Voy, le llega una sola vez (como árbitro)", () => {
    expect(quienesRecordar({ confirmados: ["mendoza", "chicharo", "chicharo"], arbitro: { id: "mendoza", aceptado: true } })).toEqual({
      jugadores: ["chicharo"],
      arbitro: "mendoza",
    });
  });
  it("sale dentro de la hora antes, nunca tarde", () => {
    const inicio = new Date("2026-11-08T18:00:00Z");
    expect(tocaRecordar(inicio, new Date("2026-11-08T16:59:00Z"))).toBe(false);
    expect(tocaRecordar(inicio, new Date("2026-11-08T17:00:00Z"))).toBe(true);
    expect(tocaRecordar(inicio, new Date("2026-11-08T18:00:00Z"))).toBe(false);
  });
  it("una clave por persona, partido y hora: si lo reprograman, sale otro", () => {
    const a = claveDeRecordatorio("m1", new Date("2026-11-08T18:00:00Z"), "u1");
    expect(a).not.toBe(claveDeRecordatorio("m1", new Date("2026-11-08T20:00:00Z"), "u1"));
    expect(a).not.toBe(claveDeRecordatorio("m1", new Date("2026-11-08T18:00:00Z"), "u2"));
  });
});
