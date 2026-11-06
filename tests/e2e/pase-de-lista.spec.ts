import { expect, test } from "@playwright/test";
import { ARCHIVO_CUENTAS, cuentas, entrarCon, salir } from "./cuentas";
import { limpiarE2E } from "./db";

// Bloque D1: pase de lista (app y link de WhatsApp) y alineación (PRD §7.6 · pantallas 03, 04, 20, 53)
test.skip(cuentas.size === 0, `Necesita ${ARCHIVO_CUENTAS} (npx tsx scripts/cuentas-de-prueba.ts)`);
test.describe.configure({ mode: "serial" });
const inicio = new Date();
test.afterAll(() => limpiarE2E(inicio));

test("el jugador contesta NO VOY y luego VOY desde su inicio", async ({ page }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una pasada (cambia datos)");
  await entrarCon(page, "jugador");
  const noVoy = page.getByRole("button", { name: "No voy", exact: true });
  await noVoy.click();
  await expect(noVoy).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByRole("button", { name: "No voy", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Confirmo que voy/ }).click();
  await expect(page.getByRole("button", { name: /Ya confirmaste/ })).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(800);
  await salir(page);
});

test("el delegado manda el pase de lista y alguien sin cuenta contesta desde el link", async ({ page, context }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una pasada (cambia datos)");
  await entrarCon(page, "delegado");
  await page.goto("/equipo/dep-portales/pase-de-lista");
  await expect(page.getByRole("heading", { name: "Pase de lista" })).toBeVisible();
  const [whatsapp] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: /Mandar al grupo de WhatsApp/ }).click()]);
  await whatsapp.waitForURL(/wa\.me|whatsapp/, { timeout: 15000 }).catch(() => {});
  const texto = decodeURIComponent(new URL(whatsapp.url()).searchParams.get("text") ?? "");
  const link = texto.match(/\/p\/[A-Za-z0-9_-]+/)?.[0];
  expect(link, texto).toBeTruthy();
  await whatsapp.close();
  await salir(page);

  // Sin sesión, desde el link: elige su nombre y contesta
  await page.goto(link!);
  await expect(page.getByRole("heading", { name: /¿Vas/ })).toBeVisible();
  await page.getByRole("button", { name: /El Brujo/ }).click();
  await page.getByRole("button", { name: /Voy/ }).first().click();
  await expect(page.getByText("¡Ahí nos vemos!")).toBeVisible();
});

test("la alineación no deja meter al suspendido", async ({ page }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una pasada (cambia datos)");
  await entrarCon(page, "delegado");
  await page.goto("/equipo/dep-portales/alineacion");
  await expect(page.getByRole("heading", { name: "Alineación" })).toBeVisible();
  const roca = page.getByRole("group", { name: "Lugar de La Roca" });
  await expect(roca.getByRole("button", { name: "Titular" })).toBeDisabled();
  await expect(roca.locator("..").getByText(/suspendido/i).first()).toBeVisible();
  await salir(page);
});

test("el pase de lista es solo del delegado de ese equipo", async ({ page }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una pasada");
  await entrarCon(page, "jugador");
  await page.goto("/equipo/dep-portales/pase-de-lista");
  await expect(page.getByText(/404|no existe|no encontr/i).first()).toBeVisible();
  await salir(page);
});
