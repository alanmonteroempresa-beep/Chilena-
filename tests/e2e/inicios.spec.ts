import { expect, test } from "@playwright/test";
import { ARCHIVO_CUENTAS, cuentas, entrarCon, salir } from "./cuentas";

// Bloque 2 del recorrido: el inicio de cada rol con los datos de la liga demo (pantallas 02, 03, 04, 05 y 18).
// Solo lectura: las acciones avisan "Llega pronto". Sin CUENTAS-DE-PRUEBA.md (CI) se salta.
test.skip(cuentas.size === 0, `Necesita ${ARCHIVO_CUENTAS} (npx tsx scripts/cuentas-de-prueba.ts)`);
test.describe.configure({ mode: "serial" });

test("jugador: te toca, sus números y el goleo (03)", async ({ page }) => {
  await entrarCon(page, "jugador");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: /Te toca/i })).toBeVisible();
  await expect(main.getByText(/ya confirmaron/)).toBeVisible();
  await expect(main.getByText("Goles", { exact: true })).toBeVisible();
  await expect(main.getByText(/Goleo · Apertura 2026/i)).toBeVisible();
  await expect(main.getByText(/El Chícharo · tú/)).toBeVisible();
  // Solo lectura: confirmar avisa que llega pronto y no cambia nada
  await main.getByRole("button", { name: /Ya confirmaste|Confirmo que voy/ }).click();
  await expect(page.getByText("Llega pronto")).toBeVisible();
  await salir(page);
});

test("delegado: pase de lista, cuotas, liga y plantilla (04)", async ({ page }) => {
  await entrarCon(page, "delegado");
  const main = page.getByRole("main");
  await expect(main.getByText(/\d+\/\d+ van/)).toBeVisible();
  await expect(main.getByText(/sin contestar/)).toBeVisible();
  await expect(main.getByText("Cuotas al corriente", { exact: true })).toBeVisible();
  await expect(main.getByText("A la liga", { exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Plantilla" })).toBeVisible();
  // Primero los que necesitan atención: el suspendido va arriba
  const primero = main.getByRole("listitem").filter({ hasText: /Suspendido|Cuota pendiente|Habilitado/ }).first();
  await expect(primero).toContainText("La Roca");
  await expect(primero).toContainText("Suspendido");
  await expect(main.getByRole("heading", { name: "Pagos a la liga" })).toBeVisible();
  await salir(page);
});

test("aficionada: lo que sigue, resultado oficial y tabla (05)", async ({ page }) => {
  await entrarCon(page, "aficionada");
  const main = page.getByRole("main");
  await expect(main.getByRole("list", { name: "Lo que sigues" })).toBeVisible();
  await expect(main.getByText(/Oficial · cédula/i)).toBeVisible();
  await expect(main.getByText(/Próximo de Portales/i)).toBeVisible();
  await expect(main.getByRole("heading", { name: /Tabla · LDI/i })).toBeVisible();
  await expect(main.getByRole("heading", { name: /Sigue a más cracks/i })).toBeVisible();
  await salir(page);
});

test("árbitro: sus partidos y el cobro (02)", async ({ page }) => {
  await entrarCon(page, "arbitro");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: /Mis partidos/i })).toBeVisible();
  await expect(main.getByText(/Cobro de arbitraje/i)).toBeVisible();
  await expect(main.getByRole("heading", { name: /Ya cerrados/i })).toBeVisible();
  await salir(page);
});

test("liga: hoy toca revisar, cobranza y la jornada (18)", async ({ page }) => {
  await entrarCon(page, "liga");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: /Hoy toca|Todo al/i })).toBeVisible();
  await expect(main.getByText(/Cobrado en/i)).toBeVisible();
  await expect(main.getByRole("progressbar")).toBeVisible();
  await expect(main.getByRole("heading", { name: /J\d+/ })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Equipos y pagos" })).toBeVisible();
  await salir(page);
});

test("sin equipo ni liga: estados vacíos, nunca una pantalla en blanco (§6.16)", async ({ page }) => {
  await entrarCon(page, "alan");
  await expect(page.getByRole("main").getByRole("heading", { name: /Sin equipo todavía/i })).toBeVisible();
  await salir(page);
});
