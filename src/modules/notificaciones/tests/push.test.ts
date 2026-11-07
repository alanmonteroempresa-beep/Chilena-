import { describe, expect, it } from "vitest";
import { debeMandarPush, enHorarioSilencioso, esServicioDePush, hrefSeguro, vidaDelPush } from "../server/services/push";

// docs/NOTIFICACIONES.md §1 y §2 · CDMX = UTC−6
const cdmx = (hora: string) => new Date(`2026-11-08T${hora}:00-06:00`);

describe("push: pocas y útiles", () => {
  it("Te toca jugar, Ya es oficial y Vota el MVP sí llegan al celular", () => {
    for (const t of ["RECORDATORIO_PARTIDO", "RESULTADO_OFICIAL", "VOTACION_ABIERTA"]) expect(debeMandarPush(t, cdmx("12:00"))).toBe(true);
  });
  it("lo social, las insignias y la carta solo van a la campana", () => {
    for (const t of ["REACCION", "COMENTARIO", "NUEVO_SEGUIDOR", "INSIGNIA", "CARTA_ACTUALIZADA", "SANCION"])
      expect(debeMandarPush(t, cdmx("12:00"))).toBe(false);
  });
});

describe("horario silencioso 23:00–07:00", () => {
  it("de noche no hay push, salvo si tu partido es en menos de 3 h", () => {
    expect(enHorarioSilencioso(cdmx("22:59"))).toBe(false);
    expect(enHorarioSilencioso(cdmx("23:00"))).toBe(true);
    expect(enHorarioSilencioso(cdmx("06:59"))).toBe(true);
    expect(enHorarioSilencioso(cdmx("07:00"))).toBe(false);
    expect(debeMandarPush("RESULTADO_OFICIAL", cdmx("23:30"))).toBe(false);
    // Partido a las 8:00 del domingo: a las 6:30 sí suena; a las 4:30 todavía no
    expect(debeMandarPush("RECORDATORIO_PARTIDO", cdmx("06:30"), cdmx("08:00"))).toBe(true);
    expect(debeMandarPush("NO_HAY_JUEGO", cdmx("06:30"), cdmx("08:00"))).toBe(true);
    expect(debeMandarPush("PASE_DE_LISTA", cdmx("04:30"), cdmx("08:00"))).toBe(false);
  });
  it("el recordatorio no sirve después del partido: vive 1 h", () => {
    expect(vidaDelPush("RECORDATORIO_PARTIDO")).toBe(3600);
    expect(vidaDelPush("RESULTADO_OFICIAL")).toBe(6 * 3600);
  });
});

describe("a dónde lleva el aviso", () => {
  it("solo rutas de Chilena", () => {
    expect(hrefSeguro("/mi-liga/votaciones")).toBe("/mi-liga/votaciones");
    expect(hrefSeguro("https://otro.com")).toBe("/notificaciones");
    expect(hrefSeguro("//otro.com")).toBe("/notificaciones");
    expect(hrefSeguro(null)).toBe("/notificaciones");
  });
});

describe("solo servicios de push de verdad", () => {
  it("Chrome, Firefox, Safari y Edge sí; cualquier otra URL no", () => {
    expect(esServicioDePush("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(esServicioDePush("https://updates.push.services.mozilla.com/wpush/v2/abc")).toBe(true);
    expect(esServicioDePush("https://web.push.apple.com/abc")).toBe(true);
    expect(esServicioDePush("https://wns2-bl2p.notify.windows.com/w/?token=abc")).toBe(true);
    expect(esServicioDePush("https://chilena.vercel.app/api/cron/trabajos")).toBe(false);
    expect(esServicioDePush("http://fcm.googleapis.com/x")).toBe(false);
    expect(esServicioDePush("https://fcm.googleapis.com.evil.com/x")).toBe(false);
  });
});

describe("permiso para activar avisos (PERMISOS)", () => {
  it("una cuenta reclamada sí; sin reclamar o sin sesión, no", async () => {
    const { can, registerRule } = await import("@/modules/core");
    const { reglaCuentaReclamada } = await import("../server/reglas");
    registerRule("push.subscribe", reglaCuentaReclamada(async (u) => u === "lupe"));
    expect(await can("lupe", "push.subscribe")).toBe(true);
    expect(await can("sin-reclamar", "push.subscribe")).toBe(false);
    expect(await can(null, "push.subscribe")).toBe(false);
  });
});
