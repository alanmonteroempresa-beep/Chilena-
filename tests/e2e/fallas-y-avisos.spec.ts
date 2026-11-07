import { expect, test } from "@playwright/test";
import { ARCHIVO_CUENTAS, cuentas, entrarCon, salir } from "./cuentas";
import { limpiarE2E, MARCA } from "./db";

// Beta: "Reportar falla" (pantalla 42) desde cualquier pantalla y "Activar avisos" en Perfil.
// El push de verdad se probó con Chrome y `pnpm build && pnpm start` (en desarrollo no hay service worker).
test.skip(cuentas.size === 0, `Necesita ${ARCHIVO_CUENTAS} (npx tsx scripts/cuentas-de-prueba.ts)`);
test.afterAll(() => limpiarE2E());

test("reportar una falla desde Mi liga y ver el gracias", async ({ page }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una pasada (escribe en la base)");
  await entrarCon(page, "aficionada");
  await page.goto("/mi-liga/quiniela");
  await page.getByRole("button", { name: "Reportar falla" }).click();
  await expect(page.getByRole("heading", { name: "Reportar falla" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar" })).toBeDisabled();
  await page.getByRole("button", { name: "Un dato está mal" }).click();
  await page.getByPlaceholder(/En la tabla/).fill(`${MARCA} el ranking no me cuadra`);
  await expect(page.getByText("/mi-liga/quiniela")).toBeVisible();
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByRole("heading", { name: "¡Gracias, pionero!" })).toBeVisible();
  await expect(page.getByText(/Reporte #\d+ recibido/)).toBeVisible();
  await page.getByRole("button", { name: "Seguir" }).click();
  await expect(page.getByRole("heading", { name: "¡Gracias, pionero!" })).toBeHidden();
  await salir(page);
});

test("Perfil invita a activar los avisos al celular", async ({ page }) => {
  await entrarCon(page, "jugador");
  await page.goto("/perfil");
  await expect(page.getByRole("region", { name: "Avisos al celular" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Instala la app" })).toBeVisible();
  await salir(page);
});
