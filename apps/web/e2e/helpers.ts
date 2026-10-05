import { expect, type Page } from "@playwright/test";

export async function devLogin(page: Page, email: string, path = "/") {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Correu").fill(email);
  await page.getByRole("button", { name: "Entrar en local" }).click();
}
