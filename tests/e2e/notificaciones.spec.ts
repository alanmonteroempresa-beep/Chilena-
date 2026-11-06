import { expect, test } from "@playwright/test";
import { ARCHIVO_CUENTAS, cuentas, entrarCon, salir } from "./cuentas";
import { limpiarE2E } from "./db";

// Bloque C: la campana (pantalla 09 · docs/NOTIFICACIONES.md)
test.skip(cuentas.size === 0, `Necesita ${ARCHIVO_CUENTAS} (npx tsx scripts/cuentas-de-prueba.ts)`);
test.describe.configure({ mode: "serial" });
const inicio = new Date();
test.afterAll(() => limpiarE2E(inicio));

test("una reacción a tu gol te llega a la campana y se marca leída al abrirla", async ({ page }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una pasada");
  // Doña Lupe le echa 🏆 al gol del Chícharo (Golazos: el primero es su Panenka o la chilena del Brujo)
  await entrarCon(page, "aficionada");
  await page.goto("/inicio?vista=golazos");
  const tarjeta = page.getByRole("listitem").filter({ hasText: "El Chícharo anotó" }).first();
  const trofeo = tarjeta.getByRole("button", { name: /^Trofeo/ });
  await trofeo.click();
  await expect(trofeo).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(800);
  await salir(page);

  await entrarCon(page, "jugador");
  await expect(page.getByRole("link", { name: /Avisos/ })).toBeVisible();
  await page.goto("/notificaciones");
  const aviso = page.getByRole("link", { name: /Doña Lupe le echó 🏆 a tu gol/ });
  await expect(aviso).toBeVisible();
  await expect(aviso.getByLabel("Sin leer")).toBeVisible();
  await aviso.click();
  await expect(page).toHaveURL(/\/post\//);
  await page.goto("/notificaciones?tab=social");
  await expect(page.getByRole("link", { name: /Doña Lupe le echó 🏆 a tu gol/ }).getByLabel("Sin leer")).toHaveCount(0);
  await salir(page);

  // Doña Lupe quita su 🏆 (deja todo como estaba)
  await entrarCon(page, "aficionada");
  await page.goto("/inicio?vista=golazos");
  await page.getByRole("listitem").filter({ hasText: "El Chícharo anotó" }).first().getByRole("button", { name: /^Trofeo/ }).click();
  await page.waitForTimeout(800);
  await salir(page);
});

test("pestañas de la campana", async ({ page }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una pasada");
  await entrarCon(page, "jugador");
  await page.goto("/notificaciones?tab=liga");
  await expect(page.getByRole("navigation", { name: "Tipos de aviso" }).getByRole("link", { name: "Liga", exact: true })).toHaveAttribute("aria-current", "page");
  await salir(page);
});
