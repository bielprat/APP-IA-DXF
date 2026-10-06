import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function devLogin(page: Page, email: string, path = "/") {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Correu").fill(email);
  await page.getByRole("button", { name: "Entrar en local" }).click();
}

/** Logs in and waits until the destination page has rendered. */
export async function loginAndOpen(page: Page, email: string, path: string, heading: string | RegExp) {
  await devLogin(page, email, path);
  // Generous timeout: the first request to each page compiles it in `next dev`.
  await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible({ timeout: 30_000 });
}

/** WCAG 2.1 A/AA checks with axe-core. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`);
  expect(summary).toEqual([]);
}

// Real 64×48 PNG: passes server-side validation and is big enough for the mock overlay.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAfklEQVRoge2SwQ0AQRCC7L8K3vemwCvDTNaEAsAYPk+TugELsL4iu5B3Sd2ABVhfkV3Iu6RuwAKsr8gu5F1SN2AB1ldkF/IuqRuwAOsrsgt5l9QNWID1FdmFvEvqBizA+orsQt4ldQMWYH1FdiHvkroBC7C+IruQd0ndgMcDfk3q6VrydBBJAAAAAElFTkSuQmCC", "base64");

export function imageFile(name: string) {
  return { name, mimeType: name.endsWith(".png") ? "image/png" : "image/jpeg", buffer: PNG };
}

export function documentFile(name: string) {
  return { name, mimeType: "application/octet-stream", buffer: Buffer.from("fake document for upload checks") };
}

