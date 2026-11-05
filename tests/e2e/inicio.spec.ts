import { expect, test } from "@playwright/test";

test("la portada de arranque carga con el lema", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /del llano a/i })).toBeVisible();
});
