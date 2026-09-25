/**
 * Nothing on this site may scroll sideways on a phone.
 *
 * A map scrolls sideways on purpose — that is what a canvas is for, and the
 * spine trace is the same bargain in miniature. The *document* must not.
 * A page that slides under a thumb makes every vertical scroll feel broken,
 * and the cause is always one element that refused to shrink: a `w-max` track,
 * a grid item without `min-w-0`, a `whitespace-nowrap` string in a flex row.
 *
 * So this reports `documentElement.scrollWidth` against the viewport, and when
 * they differ it names the elements responsible — skipping anything inside an
 * ancestor that clips, because a wide child of an `overflow-x-auto` scroller
 * is contained and not the problem.
 *
 * Usage:
 *
 *   node scripts/audit-mobile.mjs http://127.0.0.1:3000
 *   node scripts/audit-mobile.mjs http://127.0.0.1:3000 /example
 */

import { chromium } from "playwright";

const base = process.argv[2]?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";
const paths = process.argv.slice(3);

/**
 * 320 is the narrowest phone still in use, 390 the iPhone the rest of this
 * project is measured at, 430 the largest, and 768 the tablet edge where the
 * layout is still in its stacked form.
 */
const WIDTHS = [320, 360, 390, 430, 768];

const routes = paths.length
  ? paths
  : ["/", "/example"];

const browser = await chromium.launch();
let failures = 0;

for (const route of routes) {
  const found = [];

  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);

    const result = await page.evaluate((w) => {
      const culprits = [];
      for (const el of document.querySelectorAll("body *")) {
        const box = el.getBoundingClientRect();
        if (!box.width) continue;

        // A wide child of a scroller is contained, not a culprit.
        let clipped = false;
        for (let a = el.parentElement; a; a = a.parentElement) {
          if (getComputedStyle(a).overflowX !== "visible") {
            clipped = true;
            break;
          }
        }
        if (clipped) continue;

        if (box.right > w + 0.5 || box.left < -0.5) {
          culprits.push(
            `${el.tagName.toLowerCase()} w${Math.round(box.width)} → ${Math.round(box.right)}` +
              `  ${(el.className?.toString?.() ?? "").slice(0, 52)}`,
          );
        }
      }
      return {
        scrollWidth: document.documentElement.scrollWidth,
        culprits: culprits.slice(0, 4),
      };
    }, width);

    if (result.scrollWidth > width) {
      found.push({ width, ...result });
    }
    await page.close();
  }

  if (found.length === 0) {
    console.log(`${route.padEnd(18)} no sideways scroll at ${WIDTHS.join("/")}`);
    continue;
  }

  failures += found.length;
  console.log(`${route}`);
  for (const f of found) {
    console.log(`  ✗ ${f.width}px scrolls to ${f.scrollWidth}`);
    for (const c of f.culprits) console.log(`      ${c}`);
  }
}

await browser.close();
process.exit(failures ? 1 : 0);
