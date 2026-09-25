/**
 * Renders the social preview and the bitmap icons, for the app and the
 * project page alike.
 *
 *   site/og.png, app/opengraph-image.png   1200 × 630, the link preview
 *   site/apple-touch-icon.png, app/apple-icon.png   180 × 180
 *   site/icon-32.png                       32 × 32, for browsers without SVG icons
 *
 * The preview follows the sister projects' cards: the mark and name, a
 * two-line headline with the second line in the accent, one line of what it
 * is, a hairline, a mono spec line — and the real product bleeding off the
 * right edge. No version number: the card would go stale with every release.
 * Here the product is the example map's own export, so run
 * `npm run posters` first whenever the map changes.
 *
 *   node scripts/build-social.mjs
 */

import { copyFile, readFile } from "node:fs/promises";

import { chromium } from "playwright";

const root = new URL("../", import.meta.url).pathname;
const read64 = async (path) => (await readFile(root + path)).toString("base64");

const DOMAIN = (await readFile(root + "site/CNAME", "utf8")).trim();

const sans = await read64("site/fonts/Geist-Variable.woff2");
const mono = await read64("site/fonts/GeistMono-Variable.woff2");
const poster = await read64("public/posters/example-dark.png");

/** The brand mark: two inputs, one hub — the same drawing as app/icon.svg. */
const mark = (size) => `
  <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
    <path d="M8 9h12.2M8 23h12.2M17 9v14" stroke="#3d3d3d" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="6" cy="9" r="3.2" fill="#ededed"/>
    <circle cx="6" cy="23" r="3.2" fill="#ededed"/>
    <circle cx="24" cy="16" r="4" fill="#ff7a1a"/>
  </svg>`;

const fonts = `
  @font-face { font-family: G; src: url(data:font/woff2;base64,${sans}); font-weight: 100 900; }
  @font-face { font-family: GM; src: url(data:font/woff2;base64,${mono}); font-weight: 100 900; }
  * { margin: 0; box-sizing: border-box; }
  body { background: #0a0a0a; font-family: G, sans-serif; -webkit-font-smoothing: antialiased; }
`;

const og = `<!doctype html><style>${fonts}
  body { width: 1200px; height: 630px; overflow: hidden; position: relative; }
  .glow { position: absolute; inset: 0;
    background:
      radial-gradient(38% 60% at 88% 30%, rgba(96,165,250,.20), transparent 70%),
      radial-gradient(26% 40% at 100% 0%, rgba(255,122,26,.16), transparent 72%); }
  /* The map, from the processing frame to the rendered report, running off the
     right and bottom edges and fading in from the left. */
  .map { position: absolute; left: 520px; top: 96px; width: 1060px; height: 620px;
    background: url(data:image/png;base64,${poster}) no-repeat;
    background-size: auto 100%; background-position: 62% 0;
    -webkit-mask-image: linear-gradient(90deg, transparent 0 17%, #000 25%); }
  .copy { position: absolute; left: 78px; top: 72px; width: 640px; }
  .brand { display: flex; align-items: center; gap: 14px; color: #ededed; font-size: 27px; font-weight: 600; letter-spacing: -.02em; }
  .brand i { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 999px; background: #0a0a0a; box-shadow: inset 0 0 0 1px #2b2b2b, 0 0 28px rgba(255,122,26,.25); }
  h1 { margin-top: 92px; color: #f4f4f6; font-size: 68px; line-height: 1.04; font-weight: 620; letter-spacing: -.05em; }
  h1 span { color: #ff7a1a; }
  p { margin-top: 30px; color: #a1a1a1; font-size: 25px; letter-spacing: -.012em; }
  hr { margin-top: 44px; width: 560px; border: 0; border-top: 1px solid rgba(255,255,255,.12); }
  .spec { margin-top: 24px; font-family: GM, monospace; font-size: 17px; color: #6f6f6f; letter-spacing: .02em; }
</style>
<div class="glow"></div>
<div class="map"></div>
<div class="copy">
  <div class="brand"><i>${mark(26)}</i>System Map</div>
  <h1>Draw systems<br><span>people can follow.</span></h1>
  <p>Hand-placed system maps for React Flow and Next.js.</p>
  <hr>
  <div class="spec">${DOMAIN} &nbsp;·&nbsp; open source &nbsp;·&nbsp; MIT</div>
</div>`;

/** A touch icon is shown on a coloured tile, so it carries its own dark plate. */
const icon = (size) => `<!doctype html><style>${fonts}
  body { width: ${size}px; height: ${size}px; display: grid; place-items: center; background: #0a0a0a; }
</style>${mark(Math.round(size * 0.72))}`;

const browser = await chromium.launch();

async function render(html, width, height, out) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: root + out });
  await page.close();
  console.log(`  ${out}  ${width} × ${height}`);
}

await render(og, 1200, 630, "site/og.png");
await render(icon(180), 180, 180, "site/apple-touch-icon.png");
await render(icon(32), 32, 32, "site/icon-32.png");
await browser.close();

// Next.js picks these up by file name and writes the matching meta tags.
await copyFile(root + "site/og.png", root + "app/opengraph-image.png");
await copyFile(root + "site/apple-touch-icon.png", root + "app/apple-icon.png");
console.log("  app/opengraph-image.png, app/apple-icon.png  (copies)");
