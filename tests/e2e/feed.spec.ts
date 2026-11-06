import { expect, test } from "@playwright/test";
import { ARCHIVO_CUENTAS, cuentas, entrarCon, salir } from "./cuentas";

// Bloque 5 del recorrido: el feed automático de la J15 (pantalla 10 · PRD §6.1). Solo lectura.
test.skip(cuentas.size === 0, `Necesita ${ARCHIVO_CUENTAS} (npx tsx scripts/cuentas-de-prueba.ts)`);
test.describe.configure({ mode: "serial" });

test("Para ti: el inicio del jugador y abajo lo que dejó la J15", async ({ page }) => {
  await entrarCon(page, "jugador");
  const pestanas = page.getByRole("navigation", { name: "Inicio" });
  await expect(pestanas.getByRole("link", { name: "Para ti" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: /Te toca/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Lo que dejó la J15/i })).toBeVisible();
  await expect(page.getByText(/Se llenó solo con la cédula de la J15/)).toBeVisible();
  await expect(page.getByText("Crónica Chilena").first()).toBeVisible();
  await expect(page.getByText("Portales le ganó 3–2 a Condesa en la Cancha 3.")).toBeVisible();
  // Compartir por WhatsApp ya funciona y lleva al partido público
  const wa = page.getByRole("link", { name: "WhatsApp" }).first();
  await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=.*%2Fpartido%2F/);
  // Las reacciones ya son reales (bloque B: social.spec.ts las prueba)
  await expect(page.getByRole("button", { name: /^Fuego/ }).first()).toHaveAttribute("aria-pressed", /true|false/);
  await salir(page);
});

test("Golazos solo trae goles y Siguiendo lo de lo que sigue", async ({ page }) => {
  await entrarCon(page, "aficionada");
  await page.getByRole("navigation", { name: "Inicio" }).getByRole("link", { name: "Golazos" }).click();
  await expect(page).toHaveURL(/vista=golazos/);
  await expect(page.getByText(/El Brujo anotó de chilena al 87'/)).toBeVisible();
  await expect(page.getByText("Crónica Chilena")).toHaveCount(0);
  await page.getByRole("navigation", { name: "Inicio" }).getByRole("link", { name: "Siguiendo" }).click();
  await expect(page).toHaveURL(/vista=siguiendo/);
  await expect(page.getByText(/Se llenó solo con la cédula/)).toBeVisible();
  await expect(page.getByText(/Narvarte vs|vs Narvarte/).first()).toBeVisible();
  await salir(page);
});

test("el árbitro y la liga ven su operación, sin pestañas del feed", async ({ page }) => {
  await entrarCon(page, "arbitro");
  await expect(page.getByRole("heading", { name: /Mis partidos/i })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Inicio" })).toHaveCount(0);
  await salir(page);
});
