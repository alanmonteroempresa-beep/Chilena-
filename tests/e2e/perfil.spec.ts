import { expect, test } from "@playwright/test";
import { ARCHIVO_CUENTAS, cuentas, entrarCon, salir } from "./cuentas";

// Bloque 3 del recorrido: perfil público (06), la carta (25) e insignias (14/28) de la liga demo.

test("el visitante ve el perfil público sin cuenta (06)", async ({ page }) => {
  await page.goto("/j/el-chicharo");
  await expect(page.getByText("Estás viendo Chilena como visitante")).toBeVisible();
  await expect(page.getByRole("heading", { name: /El Chícharo/i })).toBeVisible();
  await expect(page.getByRole("img", { name: /Carta de El Chícharo/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Secciones del perfil" })).toBeVisible();
});

test("un perfil que no existe da 404", async ({ page }) => {
  await page.goto("/j/no-existe-nadie");
  await expect(page.getByText(/no existe|no encontr|404/i).first()).toBeVisible();
});

test.describe("con cuenta", () => {
  test.skip(cuentas.size === 0, `Necesita ${ARCHIVO_CUENTAS} (npx tsx scripts/cuentas-de-prueba.ts)`);
  test.describe.configure({ mode: "serial" });

  test("la carta se voltea y el portero tiene otros atributos (25)", async ({ page }) => {
    await entrarCon(page, "jugador");
    await page.goto("/j/el-chicharo/carta");
    await expect(page.getByRole("heading", { name: "Mi carta" })).toBeVisible();
    await page.getByRole("button", { name: "Reverso", exact: true }).click();
    await expect(page.getByRole("button", { name: "Reverso", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Definición")).toBeVisible();

    await page.goto("/j/el-gato/carta");
    await expect(page.getByRole("heading", { name: /Carta de El Gato/i })).toBeVisible();
    await expect(page.getByText("vallas invictas", { exact: true })).toBeVisible();
    await salir(page);
  });

  test("insignias: ganadas con rareza y las que faltan con progreso (28)", async ({ page }) => {
    await entrarCon(page, "jugador");
    await page.goto("/j/el-chicharo/insignias");
    await expect(page.getByRole("link", { name: "Insignias" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Goles" })).toBeVisible();
    await expect(page.getByText(/Primer gol, ganada/)).toBeAttached();
    await expect(page.getByText(/la tiene|Sólo el/).first()).toBeVisible();
    await expect(page.getByText(/\d+ de \d+/).first()).toBeVisible();
    await salir(page);
  });

  test("desde mi perfil llego a mi perfil público", async ({ page }) => {
    await entrarCon(page, "jugador");
    await page.goto("/perfil");
    await page.getByRole("link", { name: "Mi perfil público" }).click();
    await expect(page).toHaveURL(/\/j\/el-chicharo$/);
    await page.getByRole("link", { name: "Stats" }).click();
    await expect(page.getByText("Carrera en Chilena")).toBeVisible();
    await salir(page);
  });
});
