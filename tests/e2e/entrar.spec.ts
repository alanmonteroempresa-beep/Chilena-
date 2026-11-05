import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";

// F-001 Entrar · pantalla 01 (PRD §4.1): link mágico al correo, Google apagado por flag, y destino tras entrar.

test("entrar: pide el correo, valida con el mismo esquema y Google dice Próximamente", async ({ page }) => {
  await page.goto("/entrar");
  await expect(page.getByRole("heading", { name: /Del llano a tu celular/i })).toBeVisible();

  await page.getByLabel("Tu correo").fill("chicharo@");
  await page.getByRole("button", { name: "Mandar link a mi correo" }).click();
  // (Next agrega su propio role="alert" para anunciar rutas: se filtra por texto)
  await expect(
    page.getByRole("alert").filter({ hasText: "Ese correo no se ve bien. Revísalo." }),
  ).toBeVisible();

  const google = page.getByRole("button", { name: /Continuar con Google/ });
  await expect(google).toBeDisabled();
  await expect(google).toContainText("Próximamente");
});

test("sin sesión, las rutas privadas mandan a entrar y regresan a donde iba", async ({ page }) => {
  await page.goto("/inicio");
  await expect(page).toHaveURL(/\/entrar\?next=%2Finicio$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/entrar$/);
});

test("un link vencido regresa a entrar con aviso", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=no-sirve&type=email&next=%2Finicio");
  await expect(page).toHaveURL(/\/entrar\?error=LINK_VENCIDO/);
  await expect(page.getByRole("alert").filter({ hasText: "Ese link ya se usó o ya venció" })).toBeVisible();
});

// Flujo completo con la cuenta de prueba de chilena-dev (scripts/probar-entrar.mjs). Sin .env.local (CI), se salta.
test.describe("con la cuenta de prueba", () => {
  test.skip(!existsSync(".env.local"), "Necesita .env.local de chilena-dev");
  test.describe.configure({ mode: "serial" });
  const script = (...args: string[]) =>
    execFileSync("node", ["scripts/probar-entrar.mjs", ...args], { encoding: "utf8" }).trim();

  test.beforeAll(() => script("borrar"));
  test.afterAll(() => script("borrar"));

  test("la primera vez crea su User y va a Completa tu perfil; con nombre y apodo, a su inicio", async ({
    page,
    baseURL,
  }) => {
    await page.goto(script("link", "prueba-entrar@example.com", baseURL!));
    await expect(page).toHaveURL(/\/perfil\/completar/);
    await expect(page.getByText(/Entraste como crack \(@prueba-entrar\)/)).toBeVisible();

    // Con sesión, entrar ya no tiene caso: decide /auth/confirm
    await page.goto("/entrar");
    await expect(page).toHaveURL(/\/perfil\/completar$/);

    script("perfil", "Prueba", "El Probador");
    await page.goto("/");
    await expect(page).toHaveURL(/\/inicio$/);
    await expect(page.getByText(/Entraste como El Probador/)).toBeVisible();

    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/entrar$/);
  });
});
