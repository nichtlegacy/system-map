/**
 * Cuts the detail shots the GitHub Pages site shows, straight from the app.
 *
 * Each shot is one element on the example map — a card, the export panel —
 * captured at twice the pixel density so it stays sharp in the site's feature
 * tiles. The files are committed under site/screenshots/, so the Pages runner
 * needs no browser; run this again after changing the example.
 *
 * Usage, against a server you already have running:
 *
 *   node scripts/site-images.mjs
 *   BASE=http://127.0.0.1:3100 node scripts/site-images.mjs
 */

import { mkdir } from "node:fs/promises";

import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = new URL("../site/screenshots/", import.meta.url).pathname;

/** Node id on the example map → file name. */
const CARDS = {
  orchestrator: "card-primary.png",
  api: "card-service.png",
  "queue-health": "card-bars.png",
  report: "card-artefact.png",
};

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
// 2560 wide lands the example near zoom 1, so a card is drawn at its own size
// and the 2x density doubles real detail instead of upscaling.
const context = await browser.newContext({
  viewport: { width: 2560, height: 1440 },
  deviceScaleFactor: 2,
  reducedMotion: "reduce",
});
await context.addInitScript(() => localStorage.setItem("theme", "dark"));

const page = await context.newPage();
await page.goto(`${BASE}/example`, { waitUntil: "networkidle" });
await page.waitForSelector(".react-flow__edge", { state: "attached" });
await page.waitForTimeout(800);

for (const [id, file] of Object.entries(CARDS)) {
  await page.locator(`.react-flow__node[data-id="${id}"]`).screenshot({
    path: OUT + file,
    omitBackground: true,
  });
  console.log(`  ${file}  ${id}`);
}

await page.getByRole("button", { name: "Export image" }).click();
const panel = page
  .locator("div.bezel", { has: page.getByRole("heading", { name: "Export image" }) })
  .last();
await panel.waitFor();
// Let the panel's entrance transition finish.
await page.waitForTimeout(700);
await panel.screenshot({ path: OUT + "export-panel.png", omitBackground: true });
console.log("  export-panel.png");

await browser.close();
