import { expect, test } from "@playwright/test";

test("l'accueil s'affiche en français", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Wi-Fi");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

test("le diagnostic joint le serveur Next.js sans erreur de rendu", async ({
  page,
}) => {
  await page.goto("/socle");
  await expect(page.getByTestId("server-status")).toBeVisible();
});
