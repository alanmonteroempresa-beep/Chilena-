import { expect, test } from "@playwright/test";
import { ARCHIVO_CUENTAS, cuentas, entrarCon, salir } from "./cuentas";

// Bloque 4 del recorrido: Mi liga (hub, tabla, rol de juegos, goleo) y la página del partido (32).

test("Mi liga pide sesión", async ({ page }) => {
  await page.goto("/mi-liga/rol");
  await expect(page).toHaveURL(/\/entrar\?next=/);
});

test("un partido que no existe da 404", async ({ page }) => {
  await page.goto("/partido/no-es-un-id");
  await expect(page.getByText(/404|no existe|no encontr/i).first()).toBeVisible();
});

test.describe("con cuenta", () => {
  test.skip(cuentas.size === 0, `Necesita ${ARCHIVO_CUENTAS} (npx tsx scripts/cuentas-de-prueba.ts)`);
  test.describe.configure({ mode: "serial" });

  test("hub: rol de la jornada, tabla, goleo y lo que llega pronto", async ({ page }) => {
    await entrarCon(page, "jugador");
    await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Mi liga" }).click();
    await expect(page).toHaveURL(/\/mi-liga$/);
    await expect(page.getByRole("heading", { name: "Mi liga" })).toBeVisible();
    await expect(page.getByText(/Tu equipo: Dep\. Portales/)).toBeVisible();
    await expect(page.getByText(/Rol de juegos · J\d+/i)).toBeVisible();
    await expect(page.getByText(/Líder · tú/i)).toBeVisible();
    await page.getByRole("button", { name: /Votaciones/ }).click();
    await expect(page.getByText("Votaciones llega pronto")).toBeVisible();
    await page.getByRole("link", { name: /Tabla · J\d+/ }).click();
    await expect(page.getByRole("table")).toContainText("Dep. Portales");
    await salir(page);
  });

  test("rol por jornada → partido final con resumen y alineaciones", async ({ page }) => {
    await entrarCon(page, "jugador");
    await page.goto("/mi-liga/rol?j=15");
    await expect(page.getByRole("link", { name: "J15" })).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: /Portales 3–2 Condesa/ }).click();
    await expect(page).toHaveURL(/\/partido\//);
    await expect(page.getByText(/Oficial · cédula de/i)).toBeVisible();
    await expect(page.getByText(/eventos en la cédula/i)).toBeVisible();
    await expect(page.getByText("A lo Panenka")).toBeVisible();
    await page.getByRole("tab", { name: "Alineaciones" }).click();
    await expect(page.getByText(/Cédula firmada por/)).toBeVisible();
    await expect(page.getByText(/Entra #\d+ .+ por #\d+/)).toBeVisible();
    await salir(page);
  });

  test("goleo y Mi liga sin liga", async ({ page }) => {
    await entrarCon(page, "jugador");
    await page.goto("/mi-liga/goleo");
    await expect(page.getByRole("link", { name: /El Chícharo · tú/ })).toBeVisible();
    await salir(page);
    await entrarCon(page, "alan");
    await page.goto("/mi-liga");
    await expect(page.getByText("Únete a tu liga")).toBeVisible();
    await salir(page);
  });
});
