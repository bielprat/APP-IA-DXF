import { expect, test } from "@playwright/test";
import { expectAccessible, imageFile, loginAndOpen } from "./helpers";

test("projects page lists the user's projects and filters them", async ({ page }) => {
  const email = `projectes-${test.info().project.name}@colomer-rifa.cat`;
  await loginAndOpen(page, email, "/render/upload", "Colomer-Rifà Render AI");
  await page.locator('input[type="file"]').first().setInputFiles([imageFile("Façana sud.png")]);
  await expect(page.getByRole("group", { name: "Rol de Façana sud.png" })).toBeVisible();

  await page.goto("/projects");
  await expect(page.getByRole("link", { name: "Façana sud" }).first()).toBeVisible();
  const type = page.getByRole("group", { name: "Tipus" });
  await type.getByRole("button", { name: "Model DXF 3D" }).click();
  await expect(type.getByRole("button", { name: "Model DXF 3D" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Cap projecte coincideix amb els filtres.")).toBeVisible();
  await expectAccessible(page);

  const other = await page.context().browser()!.newPage();
  await loginAndOpen(other, "altre-projectes@colomer-rifa.cat", "/projects", "Projectes");
  await expect(other.getByRole("link", { name: "Façana sud" })).toHaveCount(0);
  await other.close();
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
