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

  // 5 · Result: a mock version is generated, clearly labelled, with QC that does not claim success.
  // The first job of a fresh database also installs the queue schema, so allow some time.
  await expect(page).toHaveURL(/\/render\/result\/[a-z0-9]+$/, { timeout: 30_000 });
  const versions = page.getByRole("group", { name: "Versions" });
  await expect(versions.getByRole("button", { name: /^V1/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Resultat de prova (mock)")).toBeVisible();
  await expect(page.getByText("No s'ha pogut verificar tot")).toBeVisible();
  await expect(page.getByRole("slider", { name: "Posició del comparador" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Què vols corregir?" }).getByRole("button")).toHaveCount(12);
  await expect(page.getByRole("link", { name: "Descarregar" })).toHaveAttribute("href", /download=/);
  await expectAccessible(page);

  // Correction from V1 → V2.
  await page.getByRole("button", { name: "Vidres massa foscos", exact: true }).click();
  await page.getByRole("button", { name: "Fer una correcció" }).click();
  await expect(versions.getByRole("button", { name: /^V2/ })).toBeVisible({ timeout: 30_000 });
  await expect(versions.getByRole("button", { name: /^V2/ })).toContainText("correcció de V1");

  // Back to the original (no AI) → V3, then approve it.
  await page.getByRole("button", { name: "Tornar a l'original" }).click();
  await expect(versions.getByRole("button", { name: /^V3/ })).toContainText("original", { timeout: 30_000 });
  await expect(page.getByText("Resultat de prova (mock)")).toBeHidden();
  await page.getByRole("button", { name: "Aprovar" }).click();
  await expect(page.getByRole("button", { name: "Aprovada", exact: true })).toBeDisabled();
  await expect(versions.getByRole("button", { name: /^V3 · aprovada/ })).toBeVisible();
});

test("uploaded images and choices survive a reload", async ({ page }) => {
  await loginAndOpen(page, "usuari@colomer-rifa.cat", "/render/upload", "Colomer-Rifà Render AI");
  await page.locator('input[type="file"]').first().setInputFiles([imageFile("render.png")]);
  await expect(page.getByRole("group", { name: "Rol de render.png" })).toBeVisible();
  await page.goto("/render/improve");
  await page.getByRole("button", { name: /^Vidres/ }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: /^Vidres/ })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/render/upload");
  await expect(page.getByRole("img", { name: "Vista prèvia de render.png" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
});

test("files that are not real images are rejected by the server", async ({ page }) => {
  await loginAndOpen(page, "usuari@colomer-rifa.cat", "/render/upload", "Colomer-Rifà Render AI");
  await page.locator('input[type="file"]').first().setInputFiles([{ name: "fals.png", mimeType: "image/png", buffer: Buffer.from("not really a png") }]);
  await expect(page.getByRole("alert").filter({ hasText: "no és una imatge vàlida" })).toBeVisible();
});

test("assets of other users are not accessible", async ({ page, browser }) => {
  await loginAndOpen(page, "usuari@colomer-rifa.cat", "/render/upload", "Colomer-Rifà Render AI");
  await page.locator('input[type="file"]').first().setInputFiles([imageFile("privat.png")]);
  const src = await page.getByRole("img", { name: "Vista prèvia de privat.png" }).getAttribute("src");
  expect((await page.request.get(src!)).status()).toBe(200);

  const other = await browser.newPage();
  await loginAndOpen(other, "altre@colomer-rifa.cat", "/", "Què vols fer avui?");
  expect((await other.request.get(src!)).status()).toBe(404);
  await other.close();
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

test("protected logo regions are restored and reported in the quality control", async ({ page }) => {
  await loginAndOpen(page, "usuari@colomer-rifa.cat", "/render/upload", "Colomer-Rifà Render AI");
  await page.locator('input[type="file"]').first().setInputFiles([imageFile("logo.png")]);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/render\/generate$/);

  const image = page.getByRole("img", { name: "Imatge base: logo.png" });
  const box = (await image.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByText("1 · Logo o rètol 1")).toBeVisible();

  await page.getByRole("button", { name: "Generar" }).click();
  await expect(page.getByText("S'han restaurat els píxels originals de 1 de 1 zones: Logo o rètol 1.")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("1 zones protegides marcades")).toBeVisible();
});
