import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { ARCHIVO_CUENTAS, cuentas, entrarCon, salir } from "./cuentas";
import { limpiarE2E, MARCA } from "./db";

// Bloque D2: cédula al final, firmas y correcciones (PRD §7.7 · pantallas 02, 19, 56a y 56b) con el
// partido de prueba J16 Portales vs Tigres; bloque E: la liga valida; bloque F: quiniela y MVP (pantallas 12
// y 13). Al terminar lo regresa a "sin jugar".
test.skip(cuentas.size === 0, `Necesita ${ARCHIVO_CUENTAS} (npx tsx scripts/cuentas-de-prueba.ts)`);
test.describe.configure({ mode: "serial" });
const inicio = new Date();
const reiniciar = (...extra: string[]) => execFileSync("npx", ["tsx", "scripts/reiniciar-prueba.ts", ...extra], { stdio: "inherit" });
// --todo: el partido vuelve a tener hora por delante (la quiniela cierra 1 minuto antes)
test.beforeAll(() => reiniciar("--todo"));
test.afterAll(() => {
  reiniciar();
  limpiarE2E(inicio);
});

let cedula = "";

async function abrirCedula(page: Page) {
  if (!cedula) {
    await page.goto("/arbitro/hoy");
    const tarjeta = page.locator("a", { hasText: "Portales" }).filter({ hasText: "Tigres" }).first();
    const href = await tarjeta.getAttribute("href");
    cedula = `/arbitro/cedula/${href!.split("/").pop()}`;
  }
  await page.goto(cedula);
}

async function llenarCedula(page: Page) {
  await expect(page.getByRole("heading", { name: "¿Quién jugó?" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /La Roca/ })).toBeDisabled();
  for (const n of ["El Gato", "Memo", "El Chícharo", "El Brujo"]) await page.getByRole("checkbox", { name: new RegExp(n) }).check();
  await page.getByRole("button", { name: "Siguiente · Goles" }).click();
  await expect(page.getByText("Marca quién jugó de Tigres.")).toBeVisible();
  await page.getByRole("radio", { name: /Tigres/ }).click();
  for (const n of ["El Pulpo", "Poncho", "El Tanque"]) await page.getByRole("checkbox", { name: new RegExp(n) }).check();
  await page.getByRole("button", { name: "Siguiente · Goles" }).click();

  // Goles: Chícharo de Panenka al 63 y El Tanque
  await page.getByRole("button", { name: /^#9 El Chícharo$/ }).click();
  await page.getByRole("button", { name: "Panenka" }).click();
  await page.getByLabel("Minuto").fill("63");
  await page.getByRole("button", { name: "Agregar" }).click();
  await page.getByRole("radio", { name: /Tigres/ }).click();
  await page.getByRole("button", { name: /^#9 El Tanque$/ }).click();
  await page.getByRole("button", { name: "Agregar" }).click();
  await expect(page.getByLabel("Portales 1, Tigres 1")).toBeVisible();
  await page.getByRole("button", { name: "Siguiente · Tarjetas" }).click();

  // Tarjeta: amarilla a Poncho
  await page.getByRole("radio", { name: /Tigres/ }).click();
  await page.getByRole("button", { name: /^#6 Poncho$/ }).click();
  await page.getByRole("button", { name: "Falta" }).click();
  await page.getByRole("button", { name: "Agregar" }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();

  await page.getByRole("button", { name: "Sin incidentes" }).click();
  await page.getByRole("button", { name: "Ver resumen" }).click();
  await expect(page.getByText("El Chícharo 63' · El Tanque")).toBeVisible();
}

test("el árbitro manda la cédula; Tigres señala, el árbitro acepta y firman los dos", async ({ page }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una pasada (cambia datos)");
  test.setTimeout(300_000);
  // Bloque F: antes del partido, Doña Lupe pone su quiniela (pantalla 13)
  await entrarCon(page, "aficionada");
  await page.goto("/mi-liga/quiniela");
  await expect(page.getByRole("heading", { name: "¿Cuánto queda?" })).toBeVisible();
  await page.getByRole("button", { name: "1-1", exact: true }).click();
  await page.getByRole("button", { name: "Mandar mi pronóstico · 1-1" }).click();
  await expect(page.getByRole("button", { name: "Ya mandaste tu 1-1" })).toBeVisible();
  await expect(page.getByText(/Lo que dice la porra · 1 pronóstico/)).toBeVisible();
  await salir(page);

  await entrarCon(page, "arbitro");
  await abrirCedula(page);
  await llenarCedula(page);
  await page.getByRole("button", { name: "Enviar ya · firman en su celular" }).click();
  await expect(page.getByText("Les llegó a los delegados para firmar en su celular.")).toBeVisible({ timeout: 20_000 });
  await salir(page);

  // Poncho (Tigres) revisa: el gol del Chícharo fue al 64
  await entrarCon(page, "delegado2");
  await page.getByRole("link", { name: "Revisar" }).click();
  await expect(page.getByRole("heading", { name: "Revisa antes de firmar" })).toBeVisible();
  await page.getByRole("listitem").filter({ hasText: "El Chícharo" }).getByRole("button", { name: "Señalar" }).click();
  await page.getByRole("button", { name: "Minuto", exact: true }).click();
  await page.getByLabel("Minuto").fill("64");
  await page.getByLabel("Comentario para el árbitro").fill(`${MARCA} fue al 64, profe`);
  await page.getByRole("button", { name: "Mandar corrección al árbitro" }).click();
  await expect(page.getByText("Cédula en pausa").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /En pausa/ })).toBeDisabled();
  await salir(page);

  // El árbitro acepta
  await entrarCon(page, "arbitro");
  await abrirCedula(page);
  await expect(page.getByText("Te piden corregir", { exact: true })).toBeVisible();
  await expect(page.getByText("Gol · El Chícharo · 64'")).toBeVisible();
  await page.getByRole("button", { name: "Aceptar" }).click();
  await expect(page.getByText("Les llegó a los delegados para firmar en su celular.")).toBeVisible();
  await salir(page);

  // Firman Memo y Poncho desde su celular
  for (const clave of ["delegado", "delegado2"]) {
    await entrarCon(page, clave);
    await page.getByRole("link", { name: "Revisar" }).click();
    await expect(page.getByText("64'", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Firmar sin cambios" }).click();
    await expect(page.getByText(clave === "delegado" ? "Ya firmaste ✓. Falta el otro equipo." : "Firmaron los dos. Ahora la valida la liga.")).toBeVisible();
    await salir(page);
  }

  await entrarCon(page, "arbitro");
  await abrirCedula(page);
  await expect(page.getByText("Firmaron los dos. Ya la tiene la liga para validar.")).toBeVisible();
  await salir(page);

  // Bloque E: la liga valida (pantalla 46) y ya cuenta
  const matchId = cedula.split("/").pop()!;
  await entrarCon(page, "liga");
  await page.goto("/inicio");
  await page.getByRole("link", { name: /Cédula.* por revisar/ }).click();
  await expect(page.getByRole("heading", { name: "Revisar cédulas" })).toBeVisible();
  await page.goto(`/admin/dominical-iztapalapa/cedulas?partido=${matchId}`);
  await expect(page.getByLabel("Detalle de la cédula").getByText("Gol · El Chícharo · 64'", { exact: false }).or(page.getByLabel("Detalle de la cédula").getByText("#9 El Chícharo")).first()).toBeVisible();
  await page.getByRole("button", { name: "Validar resultado" }).click();
  await expect(page.getByText(/Validado\. Ya cuenta para la tabla/)).toBeVisible({ timeout: 30_000 });
  await page.goto(`/partido/${matchId}`);
  await expect(page.getByText(/oficial/i).first()).toBeVisible();
  await salir(page);

  // Al Chícharo le llega que ya es oficial y que vote el MVP; vota por El Tanque (por él mismo no puede)
  await entrarCon(page, "jugador");
  await page.goto("/notificaciones?tab=partidos");
  await expect(page.getByRole("link", { name: /Ya es oficial: Portales 1–1 Tigres/ })).toBeVisible();
  await page.goto("/notificaciones");
  await expect(page.getByRole("link", { name: /Vota el MVP de Portales 1–1 Tigres/ })).toBeVisible();
  await page.goto("/mi-liga/votaciones");
  await expect(page.getByRole("heading", { name: "¿Quién se la rifó?" })).toBeVisible();
  const mvp = page.locator("section", { hasText: "MVP del partido" }).filter({ hasText: "Portales 1-1 Tigres" });
  await expect(mvp.getByRole("button", { name: "Votar por El Chícharo" })).toHaveCount(0);
  await mvp.getByRole("button", { name: "Votar por El Tanque" }).click();
  await expect(mvp.getByText("Tu voto")).toBeVisible();
  await salir(page);

  // La quiniela ya se calificó: 1-1 exacto = 3 puntos
  await entrarCon(page, "aficionada");
  await page.goto("/mi-liga/quiniela?ranking=liga");
  await expect(page.getByRole("listitem").filter({ hasText: "· tú" })).toContainText("3pts");
  await salir(page);
});

test("con las dos firmas en el celular del árbitro queda firmada al enviar", async ({ page }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una pasada (cambia datos)");
  test.setTimeout(120_000);
  reiniciar();
  await entrarCon(page, "arbitro");
  await abrirCedula(page);
  await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("chilena:cedula:")).forEach((k) => localStorage.removeItem(k)));
  await page.reload();
  await llenarCedula(page);
  await page.getByRole("button", { name: "Pedir firmas" }).click();
  for (const quien of ["Memo", "Poncho"]) {
    await expect(page.getByRole("heading", { name: new RegExp(quien) })).toBeVisible();
    const firma = page.getByRole("img", { name: "Firma aquí con el dedo" });
    const caja = (await firma.boundingBox())!;
    await page.mouse.move(caja.x + 30, caja.y + 60);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(caja.x + 30 + i * 20, caja.y + 60 + (i % 2 ? -25 : 25));
    await page.mouse.up();
    await page.getByRole("button", { name: "De acuerdo · Firmar" }).click();
  }
  await expect(page.getByRole("heading", { name: "Cédula lista" })).toBeVisible();
  await expect(page.getByText("✓ 2 firmas")).toBeVisible();
  await page.getByRole("button", { name: "Enviar cédula" }).click();
  await expect(page.getByText("Firmaron los dos. Ya la tiene la liga para validar.")).toBeVisible({ timeout: 20_000 });
  await salir(page);
});

test("sin señal la cédula se queda en el celular y se manda sola al volver", async ({ page, context }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una pasada (cambia datos)");
  test.setTimeout(120_000);
  reiniciar();
  await entrarCon(page, "arbitro");
  await abrirCedula(page);
  await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("chilena:cedula:")).forEach((k) => localStorage.removeItem(k)));
  await page.reload();
  await llenarCedula(page);
  await context.setOffline(true);
  await expect(page.getByText("Sin señal · todo se guarda en el celular")).toBeVisible();
  await page.getByRole("button", { name: "Enviar ya · firman en su celular" }).click();
  await expect(page.getByText(/se queda guardada y se manda sola/).first()).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText("Les llegó a los delegados para firmar en su celular.")).toBeVisible({ timeout: 30_000 });
  await salir(page);
});

test("la cédula es solo del árbitro de ese partido", async ({ page }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una pasada");
  await entrarCon(page, "jugador");
  await page.goto(cedula || "/arbitro/cedula/00000000-0000-4000-8000-000000000000");
  await expect(page.getByText(/no existe|404|No encontramos/i).first()).toBeVisible();
  await salir(page);
});
