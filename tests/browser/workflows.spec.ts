import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
async function navigate(page: Page, label: string) {
  const menu = page.getByRole("button", { name: "Open navigation" });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: label, exact: true })
    .click();
}
async function switchRole(page: Page, role: string) {
  const menu = page.getByRole("button", { name: "Open navigation" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: /Switch role, current role/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: new RegExp(role) })
    .click();
}

test("plan, replenish, cook, report an issue, log waste, compare vendors and export", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: /Today Mon/ }).click();
  await expect(
    page.getByRole("heading", { name: "Today’s prep list" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Tomorrow Tue/ }).click();
  await page.getByRole("button", { name: "View influencing factors" }).click();
  await expect(page.getByRole("dialog")).toContainText("Expected demand");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Review meal plan" }).click();
  const portions = page.getByLabel("Chicken Rice planned portions");
  await page.getByRole("button", { name: "Increase Chicken Rice" }).click();
  await expect(portions).toHaveValue("171");
  await portions.fill("-1");
  await expect(
    page.getByRole("button", { name: "Review plan" }),
  ).toBeDisabled();
  await portions.fill("180");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.reload();
  await navigate(page, "Demand forecast");
  await expect(portions).toHaveValue("180");
  await page.getByRole("button", { name: "Review plan" }).click();
  await page.getByRole("button", { name: "Confirm plan" }).click();
  await page.getByRole("button", { name: "Check inventory" }).click();
  await page
    .getByRole("button", { name: "Replenish Chicken", exact: true })
    .click();
  await page
    .getByLabel("Source", { exact: true })
    .selectOption("Vendor transfer · Kolej Kitchen");
  await page.getByLabel("Quantity (kg)").fill("12");
  await page.getByRole("button", { name: "Review request" }).click();
  await page.getByRole("button", { name: "Confirm request" }).click();
  await expect(page.getByText("Pending", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Receive stock" }).click();
  await expect(page.getByText("Received", { exact: true })).toBeVisible();
  await switchRole(page, "Kitchen Staff");
  await page.getByRole("button", { name: "16 Nov 2026" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Tomorrow/ })
    .click();
  await expect(page.getByLabel("Service date")).toHaveValue("2026-11-17");
  await page.getByRole("button", { name: "Apply date" }).click();
  const chicken = page.locator("section.card").filter({
    has: page.getByRole("heading", { name: "Chicken Rice", exact: true }),
  });
  await chicken.getByRole("button", { name: "Start batch" }).click();
  await page.getByLabel("Batch size (portions)").fill("20");
  await page.getByRole("button", { name: "Start cooking" }).click();
  await chicken.getByRole("button", { name: "Complete batch" }).click();
  await expect(chicken).toContainText("160 remaining");
  await chicken.getByRole("button", { name: "Report issue" }).click();
  await page.getByLabel("Issue", { exact: true }).selectOption("Service delay");
  await page.getByRole("button", { name: "Send issue" }).click();
  await navigate(page, "Waste log");
  await page.getByLabel("Staff profile").selectOption("Daniel Tan");
  await page.getByLabel("Quantity (portions)").fill("4");
  await page.getByRole("button", { name: "Review entry" }).click();
  await page.getByRole("button", { name: "Edit entry" }).click();
  await page.getByLabel("Quantity (portions)").fill("3");
  await page.getByRole("button", { name: "Review entry" }).click();
  await page.getByRole("button", { name: "Submit entry" }).click();
  await expect(page.getByText("1 recorded · 1.14 kg total")).toBeVisible();
  await page.getByRole("button", { name: "Spoiled ingredients" }).click();
  await page.getByLabel("Quantity (kg)").fill("0.5");
  await page.getByRole("button", { name: "Review entry" }).click();
  await page.getByRole("button", { name: "Submit entry" }).click();
  await expect(page.getByText("2 recorded · 1.64 kg total")).toBeVisible();
  await page.getByRole("button", { name: "Undo entry" }).first().click();
  await switchRole(page, "Vendor Manager");
  await expect(page.getByText("Chicken Rice · Service delay")).toBeVisible();
  await switchRole(page, "Campus Administrator");
  await page.getByLabel("Reporting period").selectOption("1");
  await page
    .getByLabel("Vendor", { exact: true })
    .selectOption("Seri Rasa Café");
  await page
    .getByRole("button", { name: "Seri Rasa Café", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("1.14 kg");
  await expect(page.getByRole("dialog")).toContainText("RM 12.60");
  await page.keyboard.press("Escape");
  await navigate(page, "Reports");
  await page
    .getByLabel("Vendor", { exact: true })
    .selectOption("Seri Rasa Café");
  await page.getByLabel("Reporting period").selectOption("1");
  await page.getByLabel("Include daily waste breakdown").check();
  await page.getByRole("button", { name: "Preview report" }).click();
  await expect(page.locator(".print-report")).toContainText(
    "1.14 kg · RM 12.60",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("canteeniq-report-2026-11-17.csv");
  expect(await fs.readFile((await download.path())!, "utf8")).toContain(
    "1.140",
  );
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-report")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download CSV" })).toBeHidden();
  await page.emulateMedia({ media: "screen" });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Waste analytics", exact: true }),
  ).toBeVisible();
  await navigate(page, "Demo controls");
  await page.getByRole("button", { name: /Reset demo data/ }).click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Operations overview" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
for (const [name, width, height] of [
  ["desktop", 1440, 960],
  ["tablet", 820, 1180],
  ["mobile", 390, 844],
] as const) {
  test(name + " layout and role navigation", async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("heading", { name: "Operations overview" }),
    ).toBeVisible();
    const fits = () =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    expect(await fits()).toBe(true);
    await page.screenshot({
      path: info.outputPath(name + ".png"),
      fullPage: true,
    });
    await navigate(page, "Inventory");
    expect(await fits()).toBe(true);
    await switchRole(page, "Kitchen Staff");
    await expect(
      page.getByRole("heading", { name: "Kitchen board" }),
    ).toBeVisible();
    expect(await fits()).toBe(true);
    await navigate(page, "Waste log");
    expect(await fits()).toBe(true);
    await switchRole(page, "Campus Administrator");
    await navigate(page, "Reports");
    await page.getByRole("button", { name: "Preview report" }).click();
    expect(await fits()).toBe(true);
  });
}
