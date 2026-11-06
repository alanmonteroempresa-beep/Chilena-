import { expect, test } from "@playwright/test";
import { abrirAcceso, ARCHIVO_CUENTAS, cuentas } from "./cuentas";

// Entrar con cuenta de prueba (flag auth.demo_login). Sin CUENTAS-DE-PRUEBA.md (CI) se salta.
test.skip(cuentas.size === 0, `Necesita ${ARCHIVO_CUENTAS} (npx tsx scripts/cuentas-de-prueba.ts)`);
test.describe.configure({ mode: "serial" });

test("la cuenta de jugador entra como El Chícharo y llega a su inicio", async ({ page }) => {
  const { email, password } = cuentas.get("jugador")!;
  await abrirAcceso(page);
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await expect(page.getByRole("banner").getByText("Dep. Portales")).toBeVisible();
  await page.goto("/perfil");
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
  // La semilla no le pone apodo al árbitro: su inicio le muestra la tarjeta de Completa tu perfil
  arbitro: {
    persona: /Entraste como Jorge \(@jorge-mendoza\)/,
    rol: "Árbitro",
    ruta: /\/inicio$/,
  },
  liga: { persona: /Entraste como Don Toño \(@don-tono\)/, rol: "Liga", ruta: /\/inicio$/ },
  aficionada: { persona: /Entraste como Doña Lupe \(@dona-lupe\)/, rol: "Aficionado", ruta: /\/inicio$/ },
};

test("las 8 cuentas entran como su persona y con su rol", async ({ page }, info) => {
  test.skip(info.project.name !== "celular-oscuro", "Una sola pasada");
  test.setTimeout(150_000); // 8 inicios de sesión seguidos
  for (const [clave, esperado] of Object.entries(ESPERADO)) {
    const { email, password } = cuentas.get(clave)!;
    await abrirAcceso(page);
    await page.getByLabel("Correo", { exact: true }).fill(email);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page, clave).toHaveURL(esperado.ruta);
    await page.goto("/perfil");
    await expect(page.getByText(esperado.persona), clave).toBeVisible();
    await expect(page.locator("[data-role]").filter({ hasText: esperado.rol }).first(), clave).toBeVisible();
    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/entrar$/);
  }
});
