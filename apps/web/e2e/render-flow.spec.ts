import { expect, test } from "@playwright/test";
import { expectAccessible, imageFile, loginAndOpen } from "./helpers";

test("the render flow can be completed from upload to result", async ({ page }) => {
  await loginAndOpen(page, "usuari@colomer-rifa.cat", "/render/upload", "Colomer-Rifà Render AI");
  const next = page.getByRole("button", { name: "Continuar" });
  await expect(next).toBeDisabled();
  await expectAccessible(page);

  // 1 · Upload: the first image becomes the base image.
  await page.locator('input[type="file"]').first().setInputFiles([imageFile("render.png"), imageFile("perspectiva.jpg")]);
  const baseRoles = page.getByRole("group", { name: "Rol de render.png" });
  await expect(baseRoles.getByRole("button", { name: "Imatge base" })).toHaveAttribute("aria-pressed", "true");
  const otherRoles = page.getByRole("group", { name: "Rol de perspectiva.jpg" });
  await otherRoles.getByRole("button", { name: "Altra perspectiva" }).click();
  await expect(otherRoles.getByRole("button", { name: "Altra perspectiva" })).toHaveAttribute("aria-pressed", "true");
  await expectAccessible(page);
  await next.click();

  // 2 · Improve: photorealism is preselected.
  await expect(page).toHaveURL(/\/render\/improve$/);
  await expect(page.getByRole("button", { name: /^Fotorealisme general/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^Vegetació/ }).click();
  await page.getByRole("button", { name: /^Il·luminació/ }).click();
  await expect(page.getByText("3 seleccions")).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  // 3 · Details: only the chosen categories get a tab.
  await expect(page).toHaveURL(/\/render\/details$/);
  const tabs = page.getByRole("tablist", { name: "Categories triades" });
  await expect(tabs.getByRole("tab")).toHaveText(["Vegetació", "Il·luminació"]);
  const keep = page.getByRole("button", { name: "Mantenir original", exact: true });
  const trees = page.getByRole("button", { name: "Arbres", exact: true });
  await keep.click();
  await expect(page.getByRole("button", { name: "Millorar existent", exact: true })).toHaveAttribute("aria-pressed", "false");
  await trees.click();
  await expect(keep).toHaveAttribute("aria-pressed", "false");
  await expect(trees).toHaveAttribute("aria-pressed", "true");
  await expectAccessible(page);
  await tabs.getByRole("tab", { name: "Il·luminació" }).click();
  await page.getByRole("button", { name: "16:00 h", exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  // 4 · Fidelity and generate.
  await expect(page).toHaveURL(/\/render\/generate$/);
  await expect(page.getByRole("button", { name: /^Màxima fidelitat/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Il·luminació · 16:00 h")).toBeVisible();
  await expect(page.getByRole("button", { name: "Altra perspectiva", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Altres indicacions — opcional").fill("Vegetació de ribera al fons.");
  await expectAccessible(page);
  await page.getByRole("button", { name: "Generar" }).click();

  // 5 · Result: honest placeholder, comparator and the 12 quick corrections.
  await expect(page).toHaveURL(/\/render\/result\/draft$/);
  await expect(page.getByText("La generació encara no està connectada")).toBeVisible();
  await expect(page.getByRole("slider", { name: "Posició del comparador" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Què vols corregir?" }).getByRole("button")).toHaveCount(12);
  await expect(page.getByRole("button", { name: "Descarregar" })).toBeDisabled();
  await expectAccessible(page);
});

test("choices survive a reload but client images do not", async ({ page }) => {
  await loginAndOpen(page, "usuari@colomer-rifa.cat", "/render/improve", "Què vols millorar?");
  await page.getByRole("button", { name: /^Vidres/ }).click();
  await expect(page.getByRole("button", { name: /^Vidres/ })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: /^Vidres/ })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/render/upload");
  await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
});

test("unsupported files are rejected with a clear message", async ({ page }) => {
  await loginAndOpen(page, "usuari@colomer-rifa.cat", "/render/upload", "Colomer-Rifà Render AI");
  await page.locator('input[type="file"]').first().setInputFiles([{ name: "plànol.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") }]);
  await expect(page.getByRole("alert").filter({ hasText: "no és un format acceptat" })).toBeVisible();
});

test("maximum fidelity explains which choices will not be applied", async ({ page }) => {
  await loginAndOpen(page, "usuari@colomer-rifa.cat", "/render/upload", "Colomer-Rifà Render AI");
  await page.locator('input[type="file"]').first().setInputFiles([imageFile("render.png")]);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: /^Vegetació/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/render\/details$/);
  await page.getByRole("button", { name: "Mediterrània", exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/render\/generate$/);
  await expect(page.getByText("«Mediterrània» no s'aplica amb Màxima fidelitat perquè pot alterar la composició.")).toBeVisible();
  await page.getByRole("button", { name: /^Creatiu controlat/ }).click();
  await expect(page.getByText("Algunes opcions no s'aplicaran")).toBeHidden();
  await expect(page.getByText(/You are editing/)).toHaveCount(0);
});
