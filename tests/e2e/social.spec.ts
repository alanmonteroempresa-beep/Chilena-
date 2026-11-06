import { expect, test } from "@playwright/test";
import { ARCHIVO_CUENTAS, cuentas, entrarCon, salir } from "./cuentas";
import { limpiarE2E, MARCA } from "./db";

// Bloque B: reaccionar, comentar en la porra, seguir y publicar texto (PRD §6.1–6.3)
test.skip(cuentas.size === 0, `Necesita ${ARCHIVO_CUENTAS} (npx tsx scripts/cuentas-de-prueba.ts)`);
test.describe.configure({ mode: "serial" });
test.afterAll(limpiarE2E);

test("echar 🔥 se queda al recargar y se quita tocando otra vez", async ({ page }) => {
  await entrarCon(page, "aficionada");
  const fuego = page.getByRole("button", { name: /^Fuego/ }).first();
  await expect(fuego).toHaveAttribute("aria-pressed", "false");
  await fuego.click();
  await expect(fuego).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: /^Fuego/ }).first()).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^Fuego/ }).first().click();
  await expect(page.getByRole("button", { name: /^Fuego/ }).first()).toHaveAttribute("aria-pressed", "false");
  // Esperar a que se guarde antes de recargar
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByRole("button", { name: /^Fuego/ }).first()).toHaveAttribute("aria-pressed", "false");
  await salir(page);
});

test("la porra de una publicación", async ({ page }) => {
  await entrarCon(page, "jugador");
  await page.getByRole("link", { name: /^La porra/ }).first().click();
  await expect(page).toHaveURL(/\/post\//);
  const texto = `${MARCA} ¡Grande compadre! Esa no la para nadie`;
  await page.getByLabel("Échale porra").fill(texto);
  await page.getByRole("button", { name: "Publicar en la porra" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: texto })).toBeVisible({ timeout: 10000 });
  await expect(page.getByLabel("Échale porra")).toHaveValue("");
  await salir(page);
});

test("publicar texto y verlo hasta arriba de Para ti", async ({ page }) => {
  await entrarCon(page, "aficionada");
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Publicar" }).click();
  await expect(page).toHaveURL(/\/publicar$/);
  const texto = `${MARCA} ¿Vas el domingo? Ahí estaré con la porra`;
  await page.getByLabel("¿Qué pasó en la cancha?").fill(texto);
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page).toHaveURL(/\/inicio\?publicado=/);
  await expect(page.getByText(texto)).toBeVisible();
  await salir(page);
});

test("seguir a un crack desde el perfil y dejar de seguirlo", async ({ page }) => {
  await entrarCon(page, "delegado");
  await page.goto("/j/el-tanque");
  const boton = page.getByRole("button", { name: /^(Seguir|Siguiendo)$/ }).first();
  const antes = await boton.getAttribute("aria-pressed");
  await boton.click();
  await expect(boton).toHaveAttribute("aria-pressed", antes === "true" ? "false" : "true");
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByRole("button", { name: /^(Seguir|Siguiendo)$/ }).first()).toHaveAttribute("aria-pressed", antes === "true" ? "false" : "true");
  // Lo deja como estaba
  await page.getByRole("button", { name: /^(Seguir|Siguiendo)$/ }).first().click();
  await expect(page.getByRole("button", { name: /^(Seguir|Siguiendo)$/ }).first()).toHaveAttribute("aria-pressed", antes ?? "false");
  await page.waitForTimeout(800);
  await salir(page);
});

test("el visitante ve la porra pero no puede comentar", async ({ page }) => {
  await page.goto("/j/el-chicharo");
  await expect(page.getByText("Entra para echarle porra.")).toBeVisible();
});
