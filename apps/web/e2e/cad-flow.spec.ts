import { expect, test } from "@playwright/test";
import { documentFile, expectAccessible, imageFile, loginAndOpen } from "./helpers";

test("the CAD flow can be completed from sources to the generated model", async ({ page }) => {
  await loginAndOpen(page, "usuari@colomer-rifa.cat", "/cad/upload", "Modelatge 3D per a CAD");
  await expect(page.getByRole("button", { name: /^Model aproximat des d'imatges/ })).toHaveAttribute("aria-pressed", "true");
  await expectAccessible(page);

  // 1 · Sources: warn when there are no plans or dimensions.
  await page.locator('input[type="file"]').first().setInputFiles([imageFile("facana.jpg")]);
  await expect(page.getByText("Sense plànols ni cotes", { exact: true })).toBeVisible();
  await page.getByRole("group", { name: "Tipus de «facana.jpg»" }).getByRole("button", { name: "Alçat" }).click();
  await expect(page.getByText("Sense plànols ni cotes", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: /^Model precís des de plànols/ }).click();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  // 2 · Elements.
  await expect(page).toHaveURL(/\/cad\/elements$/);
  await expect(page.getByText("4 elements")).toBeVisible();
  await page.getByRole("button", { name: /^Detalls exteriors/ }).click();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  // 3 · Parameters: plans mode reads dimensions from the plans; details must be chosen.
  await expect(page).toHaveURL(/\/cad\/parameters$/);
  const next = page.getByRole("button", { name: "Continuar" });
  await expect(next).toBeDisabled();
  const tabs = page.getByRole("tablist", { name: "Paràmetres del modelatge" });
  await expect(tabs.getByRole("tab")).toHaveCount(7);
  await tabs.getByRole("tab", { name: "Alçades" }).click();
  await expect(page.getByRole("group", { name: "Alçada de planta" }).getByRole("button", { name: "Segons les cotes dels plànols" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await tabs.getByRole("tab", { name: /Detalls exteriors/ }).click();
  await page.getByRole("button", { name: "Baranes i parapets", exact: true }).click();
  await expect(next).toBeEnabled();
  await expectAccessible(page);
  await next.click();

  // 4 · Format and generate.
  await expect(page).toHaveURL(/\/cad\/generate$/);
  await expect(page.getByRole("button", { name: /^DXF 3D editable/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^DWG 3D/ }).click();
  await expect(page.getByText("El DWG només es lliura si es pot convertir i verificar.", { exact: false })).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Generar model" }).click();

  // 5 · Result: layers can be toggled; origins are labelled.
  await expect(page).toHaveURL(/\/cad\/result\/draft$/);
  await expect(page.getByText("4 de 4 capes visibles")).toBeVisible();
  await page.getByRole("button", { name: /^Coberta \(CR_COBERTA\)/ }).click();
  await expect(page.getByText("3 de 4 capes visibles")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Cota del plànol" }).first()).toBeVisible();
  await expect(page.getByText("facana-3d.dxf")).toBeVisible();
  await expect(page.getByRole("button", { name: "Descarregar DXF" })).toBeDisabled();
  await expectAccessible(page);
});

test("the review mode produces a report and no file", async ({ page }) => {
  await loginAndOpen(page, "usuari@colomer-rifa.cat", "/cad/upload", "Modelatge 3D per a CAD");
  await page.getByRole("button", { name: /^Revisar la documentació/ }).click();
  await page.locator('input[type="file"]').first().setInputFiles([documentFile("planta-baixa.pdf")]);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/cad\/elements$/);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/cad\/parameters$/);
  await expect(page.getByText("no cal triar com es dibuixa", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/cad\/generate$/);
  await page.getByRole("button", { name: "Revisar la documentació" }).click();
  await expect(page.getByRole("heading", { name: "Contradiccions" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Descarregar DXF" })).toHaveCount(0);
});
