/**
 * Re-cuts the map stills the landing page shows, one file per map per theme.
 *
 * It drives the app's own export panel rather than calling the renderer
 * directly. That path is the one a visitor uses, so a poster can never be
 * produced by code the app itself does not run — if the export breaks, this
 * breaks with it instead of quietly writing a file from a second renderer
 * that has drifted.
 *
 * Usage, against a server you already have running:
 *
 *   node scripts/export-posters.mjs
 *   BASE=http://127.0.0.1:3100 node scripts/export-posters.mjs
 *   node scripts/export-posters.mjs example      # just the one map
 */

import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = new URL("../public/posters/", import.meta.url).pathname;

const README = new URL("../.github/images/", import.meta.url).pathname;

/**
 * The names are the ones app/page.tsx and README.md ask for. One file per
 * theme, so a light visitor gets a light map. The landing page lays its own
 * plate under the map, so its posters are transparent; GitHub has no plate,
 * so the README's copies carry the canvas colour of their theme.
 */
const POSTERS = [
  { view: "example", theme: "dark", file: "example-dark.png", out: OUT, solid: false },
  { view: "example", theme: "light", file: "example-light.png", out: OUT, solid: false },
  { view: "example", theme: "dark", file: "readme-dark.png", out: README, solid: true },
  { view: "example", theme: "light", file: "readme-light.png", out: README, solid: true },
];

const only = process.argv.slice(2);
const wanted = only.length
  ? POSTERS.filter((p) => only.includes(p.view))
  : POSTERS;

if (wanted.length === 0) {
  console.error(
    `No map called ${only.join(", ")}. Try: ${[...new Set(POSTERS.map((p) => p.view))].join(", ")}`,
  );
  process.exit(1);
}

const browser = await chromium.launch();

/**
 * Reduced motion, deliberately. The wires drift now, and html-to-image
 * snapshots whatever dash offset the animation happens to be at, so without
 * this the same map exports a slightly different file every run. Under reduce
 * the animation is off and every dash sits at its start.
 */
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  reducedMotion: "reduce",
  deviceScaleFactor: 1,
});

const downloads = join(tmpdir(), "system-map-posters");
await mkdir(downloads, { recursive: true });
for (const dir of new Set(wanted.map((p) => p.out))) await mkdir(dir, { recursive: true });

let failed = 0;

for (const { view, theme, file, out, solid } of wanted) {
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/${view}`, { waitUntil: "networkidle" });
    // Not just the canvas: the edges are what the export is for, and they
    // mount a beat after the cards do. Attached, not visible: a perfectly
    // horizontal wire has a zero-height bounding box, which Playwright reads
    // as invisible forever.
    await page.waitForSelector(".react-flow__edge", {
      state: "attached",
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "Export image" }).click();

    // Transparent, so the plate's own canvas and dot grid show through, and
    // the file does not carry a second background of its own.
    await page.getByRole("button", { name: theme === "dark" ? "Dark" : "Light", exact: true }).click();
    if (!solid) await page.getByRole("button", { name: "Transparent", exact: true }).click();
    // 2x. The example is ~2400 flow pixels wide, so this lands near 4800px
    // across — sharp in the landing plate and on a README at any zoom.
    await page.getByRole("button", { name: "2\u00d7", exact: true }).click();

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 60_000 }),
      page.getByRole("button", { name: /Save PNG/ }).click(),
    ]);

    await download.saveAs(join(out, file));
    console.log(`  ${file}  ${view} · ${theme}`);
  } catch (error) {
    failed++;
    console.error(`  FAILED ${file}: ${error.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
await rm(downloads, { recursive: true, force: true });

if (failed > 0) {
  console.error(`\n${failed} of ${wanted.length} did not export.`);
  process.exit(1);
}

console.log(`\n${wanted.length} written to public/posters/ and .github/images/.`);
