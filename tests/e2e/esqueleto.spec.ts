import { expect, test } from "@playwright/test";
import { ARCHIVO_CUENTAS, cuentas, entrarCon, salir } from "./cuentas";

// Esqueleto de la app (PRD §5 · pantallas 07b, 23, 24): header con selector de rol y barra inferior.
// Usa la cuenta de delegado (Memo Salas, también jugador de Dep. Portales). Sin CUENTAS-DE-PRUEBA.md se salta.
test.skip(cuentas.size === 0, `Necesita ${ARCHIVO_CUENTAS} (npx tsx scripts/cuentas-de-prueba.ts)`);
test.describe.configure({ mode: "serial" });

test("cambiar de rol cambia el acento, el botón central y el inicio", async ({ page }) => {
  await entrarCon(page, "delegado");
  const selector = page.getByRole("button", { name: /^Estás como/ });
  const barra = page.getByRole("navigation", { name: "Principal" });

  await expect(selector).toHaveAccessibleName(/Estás como Delegado en Dep\. Portales/);
  await expect(page.locator("[data-role]").first()).toHaveAttribute("data-role", "delegado");
  await expect(barra.getByRole("link", { name: "Pase de lista" })).toHaveAttribute(
    "href",
    "/equipo/dep-portales/pase-de-lista",
  );

  await selector.click();
  await page.getByRole("dialog").getByRole("button", { name: /Jugador/ }).click();
  await expect(selector).toHaveAccessibleName(/Estás como Jugador en Dep\. Portales/);
  await expect(page).toHaveURL(/\/inicio$/);
  await expect(page.locator("[data-role]").first()).toHaveAttribute("data-role", "jugador");
  await expect(barra.getByRole("link", { name: "Publicar" })).toBeVisible();

  // De regreso a delegado (deja la cuenta como estaba)
  await selector.click();
  await page.getByRole("dialog").getByRole("button", { name: /Delegado/ }).click();
  await expect(selector).toHaveAccessibleName(/Estás como Delegado/);
  await expect(barra.getByRole("link", { name: "Pase de lista" })).toBeVisible();
});

test("la barra inferior navega y el header se queda", async ({ page }) => {
  await entrarCon(page, "delegado");
  const barra = page.getByRole("navigation", { name: "Principal" });
  for (const [nombre, ruta] of [
    ["En vivo", /\/en-vivo$/],
    ["Mi liga", /\/mi-liga$/],
    ["Perfil", /\/perfil$/],
    ["Inicio", /\/inicio$/],
  ] as const) {
    await barra.getByRole("link", { name: nombre }).click();
    await expect(page).toHaveURL(ruta);
    await expect(barra.getByRole("link", { name: nombre })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("button", { name: /^Estás como Delegado/ })).toBeVisible();
  }
  await salir(page);
});
