import { expect, test } from "@playwright/test";
import { expectAccessible, loginAndOpen } from "./helpers";

test("projects page offers filters and an honest empty state", async ({ page }) => {
  await loginAndOpen(page, "usuari@colomer-rifa.cat", "/projects", "Projectes");
  const type = page.getByRole("group", { name: "Tipus" });
  await type.getByRole("button", { name: "Render IA" }).click();
  await expect(type.getByRole("button", { name: "Render IA" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Encara no hi ha projectes.", { exact: false })).toBeVisible();
  await expectAccessible(page);
});

test("the vegetation library offers tag filters to admins", async ({ page }) => {
  await loginAndOpen(page, "admin@colomer-rifa.cat", "/admin/vegetation-library", "Biblioteca de vegetació");
  for (const name of ["Tipus de vegetació", "Tipus de projecte", "Clima", "Distància a càmera", "Estil"]) {
    await expect(page.getByRole("group", { name })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Afegir referència" })).toBeDisabled();
  await expectAccessible(page);
});

test("home and login pages are accessible", async ({ page }) => {
  await page.goto("/login");
  await expectAccessible(page);
  await loginAndOpen(page, "usuari@colomer-rifa.cat", "/", "Què vols fer avui?");
  await expectAccessible(page);
});
