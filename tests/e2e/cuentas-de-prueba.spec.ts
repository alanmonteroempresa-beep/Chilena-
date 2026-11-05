import { existsSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Entrar con cuenta de prueba (flag auth.demo_login). Lee las contraseñas de CUENTAS-DE-PRUEBA.md, que no se
// sube a GitHub: sin ese archivo (CI) se salta. Las cuentas las crea scripts/cuentas-de-prueba.ts.
const ARCHIVO = "CUENTAS-DE-PRUEBA.md";
const cuentas = new Map<string, { email: string; password: string }>();
if (existsSync(ARCHIVO)) {
  for (const linea of readFileSync(ARCHIVO, "utf8").split("\n")) {
    const r = linea.match(/^\| (\w+) \| (\S+@prueba\.chilena) \| `([^`]+)` \|/);
    if (r) cuentas.set(r[1], { email: r[2], password: r[3] });
  }
}

test.skip(cuentas.size === 0, `Necesita ${ARCHIVO} (npx tsx scripts/cuentas-de-prueba.ts)`);
test.describe.configure({ mode: "serial" });

async function abrirAcceso(page: Page) {
  await page.goto("/entrar");
  await page.getByRole("button", { name: "Entrar con cuenta de prueba" }).click();
}

test("la cuenta de jugador entra como El Chícharo y llega a su inicio", async ({ page }) => {
  const { email, password } = cuentas.get("jugador")!;
  await abrirAcceso(page);
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await expect(page.getByText(/Entraste como El Chícharo \(@el-chicharo\)/)).toBeVisible();
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/entrar$/);
});

test("contraseña equivocada o correo de fuera: no entra", async ({ page }) => {
  await abrirAcceso(page);
  await page.getByLabel("Correo", { exact: true }).fill(cuentas.get("jugador")!.email);
  await page.getByLabel("Contraseña").fill("no-es-la-contrasena");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Correo o contraseña incorrectos." })).toBeVisible();

  await page.getByLabel("Correo", { exact: true }).fill("alguien@gmail.com");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Las cuentas de prueba terminan en @prueba.chilena." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/entrar$/);
});

// Cada cuenta entra como su persona y con su rol (una pasada, solo en oscuro, para no gastar intentos)
const ESPERADO: Record<string, { persona: RegExp; rol: string; ruta: RegExp }> = {
  alan: { persona: /Entraste como Alan \(@alan\)/, rol: "Jugador", ruta: /\/inicio$/ },
  hermano1: { persona: /Entraste como Hermano 1 \(@hermano1\)/, rol: "Jugador", ruta: /\/inicio$/ },
  hermano2: { persona: /Entraste como Hermano 2 \(@hermano2\)/, rol: "Jugador", ruta: /\/inicio$/ },
  jugador: { persona: /Entraste como El Chícharo/, rol: "Jugador", ruta: /\/inicio$/ },
  delegado: { persona: /Entraste como Memo \(@memo-salas\)/, rol: "Delegado", ruta: /\/inicio$/ },
  // La semilla no le pone apodo al árbitro: la regla del PRD §4.4 lo manda a Completa tu perfil
  arbitro: {
    persona: /Entraste como Jorge \(@jorge-mendoza\)/,
    rol: "Árbitro",
    ruta: /\/perfil\/completar$/,
  },
  liga: { persona: /Entraste como Don Toño \(@don-tono\)/, rol: "Liga", ruta: /\/inicio$/ },
  aficionada: { persona: /Entraste como Doña Lupe \(@dona-lupe\)/, rol: "Aficionado", ruta: /\/inicio$/ },
};

test("las 8 cuentas entran como su persona y con su rol", async ({ page }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una sola pasada");
  for (const [clave, esperado] of Object.entries(ESPERADO)) {
    const { email, password } = cuentas.get(clave)!;
    await abrirAcceso(page);
    await page.getByLabel("Correo", { exact: true }).fill(email);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page, clave).toHaveURL(esperado.ruta);
    await expect(page.getByText(esperado.persona), clave).toBeVisible();
    await expect(page.locator("[data-role]").filter({ hasText: esperado.rol }).first(), clave).toBeVisible();
    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/entrar$/);
  }
});
