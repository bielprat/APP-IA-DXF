import { expect, test } from "@playwright/test";
import { devLogin } from "./helpers";

test("anonymous visitors are sent to the login page", async ({ page }) => {
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fprojects/);
  await expect(page.getByRole("heading", { name: "Render AI · Modelatge 3D" })).toBeVisible();
});

test("accounts outside the company domain are rejected", async ({ page }) => {
  await devLogin(page, "intrus@gmail.com");
  await expect(page.getByText("Aquest compte no té accés.")).toContainText("@colomer-rifa.cat");
  await expect(page).toHaveURL(/\/login/);
});

test("a user sees the branded layout without admin entries", async ({ page }) => {
  await devLogin(page, "usuari@colomer-rifa.cat");
  await expect(page.getByRole("heading", { name: "Què vols fer avui?" })).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Navegació principal" });
  await expect(nav.getByRole("link", { name: "Inici" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Biblioteca de vegetació" })).toHaveCount(0);
  await expect(page.getByRole("img", { name: "Colomer-Rifà" })).toBeVisible();

  // Orange buttons must carry black text (WCAG AA).
  const cta = page.getByRole("link", { name: "Començar la millora" });
  await expect(cta).toHaveCSS("background-color", "rgb(237, 121, 2)");
  await expect(cta).toHaveCSS("color", "rgb(33, 33, 33)");

  await cta.click();
  await expect(page).toHaveURL(/\/render\/upload$/);
  await expect(nav.getByRole("link", { name: "Millora de renders" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Passos" }).getByRole("link", { name: /Pujar render/ })).toHaveAttribute(
    "aria-current",
    "step",
  );

  await page.goto("/admin/vegetation-library");
  await expect(page.getByRole("heading", { name: "Accés restringit" })).toBeVisible();
});

test("an admin sees the vegetation library", async ({ page }) => {
  await devLogin(page, "admin@colomer-rifa.cat", "/admin/vegetation-library");
  await expect(page).toHaveURL(/\/admin\/vegetation-library$/);
  await expect(page.getByRole("heading", { name: "Biblioteca de vegetació" })).toBeVisible();
  await expect(page.getByText("Administrador")).toBeVisible();
});

test("signing out returns to the login page", async ({ page }) => {
  await devLogin(page, "usuari@colomer-rifa.cat");
  // Wait for the post-login navigation to settle before signing out.
  await expect(page.getByRole("heading", { name: "Què vols fer avui?" })).toBeVisible();
  await page.getByRole("button", { name: "Tancar sessió" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

test("the layout has no horizontal scroll", async ({ page }) => {
  await devLogin(page, "usuari@colomer-rifa.cat");
  await expect(page.getByRole("heading", { name: "Què vols fer avui?" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
