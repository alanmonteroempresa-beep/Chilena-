import { expect, test } from "@playwright/test";

// Fase 0 · componentes de marca: header con selector de rol y barra inferior por rol (pantallas 07b, 23, 24)
test("cambiar de rol cambia el matiz y el botón central de la barra", async ({ page }) => {
  await page.goto("/componentes");
  const barra = page.getByRole("navigation", { name: "Principal" });

  await expect(page.locator("body")).toHaveAttribute("data-role", "jugador");
  await expect(barra.getByRole("link", { name: "Publicar" })).toBeVisible();

  await page.getByRole("button", { name: /Estás como Jugador/ }).click();
  await page.getByRole("button", { name: /Delegado · Los Compas FC/ }).click();

  await expect(page.locator("body")).toHaveAttribute("data-role", "delegado");
  await expect(barra.getByRole("link", { name: "Pase de lista" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Estás como Delegado en Los Compas FC/ })).toBeVisible();
});

test("la carta en construcción no muestra media", async ({ page }) => {
  await page.goto("/componentes");
  await expect(page.getByRole("img", { name: "Carta de Neto, MC, en construcción" })).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Carta de El Chícharo, DC, media 87, nivel oro/ }).first(),
  ).toBeVisible();
});
