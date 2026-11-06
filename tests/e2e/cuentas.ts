import { existsSync, readFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";

// Cuentas de prueba (flag auth.demo_login). Las contraseñas viven en CUENTAS-DE-PRUEBA.md, que no se sube a
// GitHub: sin ese archivo (CI) los specs que las usan se saltan. Las crea scripts/cuentas-de-prueba.ts.
export const ARCHIVO_CUENTAS = "CUENTAS-DE-PRUEBA.md";
export const cuentas = new Map<string, { email: string; password: string }>();
if (existsSync(ARCHIVO_CUENTAS)) {
  for (const linea of readFileSync(ARCHIVO_CUENTAS, "utf8").split("\n")) {
    const r = linea.match(/^\| (\w+) \| (\S+@prueba\.chilena) \| `([^`]+)` \|/);
    if (r) cuentas.set(r[1], { email: r[2], password: r[3] });
  }
}

export async function abrirAcceso(page: Page) {
  await page.goto("/entrar");
  await page.getByRole("button", { name: "Entrar con cuenta de prueba" }).click();
}

/** Entra con la cuenta y espera su inicio */
export async function entrarCon(page: Page, clave: string) {
  const { email, password } = cuentas.get(clave)!;
  await abrirAcceso(page);
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/inicio$/);
}

export async function salir(page: Page) {
  await page.goto("/perfil");
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/entrar$/);
}
