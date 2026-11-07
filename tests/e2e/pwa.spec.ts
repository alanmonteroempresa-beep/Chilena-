import { expect, test } from "@playwright/test";

// Bloque G: la app se instala (manifest, pantalla 43) y sin señal enseña la pantalla 08b.
// El service worker solo se registra en producción (pnpm build && pnpm start): aquí se revisan las piezas.
test("manifest con íconos y atajos", async ({ request }) => {
  const m = await (await request.get("/manifest.webmanifest")).json();
  expect(m).toMatchObject({ display: "standalone", start_url: "/inicio" });
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(sw.headers()["cache-control"]).toContain("no-store");
});

test("sin conexión (08b) sin sesión y con su Reintentar", async ({ page }) => {
  await page.goto("/sin-conexion");
  await expect(page.getByRole("heading", { name: /Se fue la señal/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
});

test("instala la app (43): la guía de Android en 3 toques", async ({ page }) => {
  await page.goto("/instalar");
  await expect(page.getByRole("heading", { name: "3 toques y listo" })).toBeVisible();
  await expect(page.getByText("Toca “Instalar app”")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ahorita no" })).toBeVisible();
});
