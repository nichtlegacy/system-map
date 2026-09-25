// Three checks `audit-map.mjs` does not make. Each one found a real defect the
// first time it ran, and each one lived in /tmp for a map or two before it
// earned a place here.
//
//   node scripts/audit-labels.mjs [url] [--vp 2560x1440]
//
// 1) A strict label sweep. The geometry audit samples 60 points per edge and
//    asks whether a label's box contains one. That is the right question and
//    the wrong resolution: a label can clear every sample and still sit two
//    pixels off a stroke. This one samples 120 and enforces a real gap.
//
//    The gap is defined in FLOW pixels, because that is where FlowEdge places
//    it — GAP = 16 in the component. So the screen-space margin has to be
//    scaled by the current zoom. An unscaled 12px margin at zoom 0.64 is
//    19 flow pixels, which is wider than the gap the component leaves, and
//    every label on the map reports as a collision. That false-positive run
//    cost an hour before the multiply went in.
//
// 2) An overflow probe. `scrollHeight > clientHeight` on every element that
//    actually clips. Finds a card too short for its content and a paragraph
//    cut mid-word — both invisible to a type-checker and easy to miss by eye
//    at map zoom.
//
// 1c) A label too close to a plate it is not printed on. audit-map.mjs checks
//    for an overlap and nothing closer; a label 2px off a card passes that and
//    still reads as printed on it.
//
// 2b) Ink that keeps rendering past a card's own border. A stat plate is a
//    fixed-height node that does not clip, so a note two lines too long is not
//    truncated — it just carries on over the canvas. This slipped past every
//    other check the first time it happened: the geometry was right, the node
//    measured its declared height, and nothing was cut off.
//
// 3) The nav pill. It has outgrown its row once already, at five maps. The
//    only way to know is to measure it at the widths people actually use.

import { chromium } from "playwright";

const url = process.argv[2]?.startsWith("http")
  ? process.argv[2]
  : "http://127.0.0.1:3000/example";
const vpIdx = process.argv.indexOf("--vp");
const [vw, vh] =
  vpIdx > -1 ? process.argv[vpIdx + 1].split("x").map(Number) : [2560, 1440];

/** Flow pixels between a stroke and any label that is not its own. */
const GAP = 12;
/** Points sampled along each edge path. */
const SAMPLES = 120;
/** The widths the header has to survive. */
const NAV_WIDTHS = [390, 600, 640, 700, 768, 860, 1024, 1440];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector(".react-flow__node");
await page.waitForTimeout(1200);

const report = await page.evaluate(
  ({ GAP, SAMPLES }) => {
    const viewport = document.querySelector(".react-flow__viewport");
    const zoom = Number(
      /scale\(([\d.]+)\)/.exec(viewport.style.transform)?.[1] ?? 1,
    );

    // -- 1) labels against strokes, and against each other ---------------
    const labels = [...document.querySelectorAll("[data-edge-label]")].map(
      (el) => ({ id: el.dataset.edgeLabel, r: el.getBoundingClientRect() }),
    );

    const edges = [...document.querySelectorAll(".react-flow__edge")].map((g) => {
      const path = g.querySelector("path.react-flow__edge-path");
      const len = path.getTotalLength();
      const m = path.getScreenCTM();
      const pts = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const p = path.getPointAtLength((len * i) / SAMPLES);
        pts.push({
          x: p.x * m.a + p.y * m.c + m.e,
          y: p.x * m.b + p.y * m.d + m.f,
        });
      }
      return {
        id: g.dataset.testid?.replace("rf__edge-", "") ?? "?",
        pts,
      };
    });

    // The gap lives in flow pixels; the boxes are in screen pixels.
    const margin = GAP * zoom;
    const near = (r, p) =>
      p.x > r.left - margin &&
      p.x < r.right + margin &&
      p.y > r.top - margin &&
      p.y < r.bottom + margin;

    const tooClose = [];
    for (const label of labels) {
      for (const edge of edges) {
        const hits = edge.pts.filter((p) => near(label.r, p)).length;
        if (hits === 0) continue;
        tooClose.push(
          `${label.id} label is within ${GAP}px of ${
            edge.id === label.id ? "its own stroke" : edge.id
          } (${hits}/${edge.pts.length} pts)`,
        );
      }
    }

    const overlap = (a, b) =>
      a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const labelPairs = [];
    for (const a of labels)
      for (const b of labels)
        if (b.id > a.id && overlap(a.r, b.r))
          labelPairs.push(`${a.id} overlaps label ${b.id}`);

    // -- 2) anything whose content does not fit its box ------------------
    const overflowing = [];
    for (const node of document.querySelectorAll(".react-flow__node")) {
      for (const el of node.querySelectorAll("*")) {
        const { overflowY, overflowX } = getComputedStyle(el);
        const clipsY = overflowY !== "visible";
        const clipsX = overflowX !== "visible";
        if (clipsY && el.scrollHeight > el.clientHeight + 1)
          overflowing.push(
            `${node.dataset.id}: ${el.scrollHeight - el.clientHeight}px too tall — "${el.textContent.trim().slice(0, 48)}"`,
          );
        else if (clipsX && el.scrollWidth > el.clientWidth + 1)
          overflowing.push(
            `${node.dataset.id}: ${el.scrollWidth - el.clientWidth}px too wide — "${el.textContent.trim().slice(0, 48)}"`,
          );
      }
    }

    // -- 1c) a label too close to a plate it is not printed on ----------
    //
    // `audit-map.mjs` checks whether a label *overlaps* a card. It does not
    // check how close it comes, and a label two pixels off a plate passes
    // that test while reading as printed on it. Labels 2px inside a
    // frame's border were spotted by eye long before any check complained.
    //
    // The floor is the same 12 flow px the stroke margin uses: a label should
    // be at least as far from a plate it has nothing to do with as it is from
    // the wire it belongs to.
    const nearPlate = [];
    const plates = [...document.querySelectorAll(".react-flow__node")]
      .filter((n) => !n.className.includes("lane"))
      .map((n) => ({ id: n.dataset.id, r: n.getBoundingClientRect() }));
    for (const l of labels) {
      for (const plate of plates) {
        const dx = Math.max(plate.r.left - l.r.right, l.r.left - plate.r.right, 0);
        const dy = Math.max(plate.r.top - l.r.bottom, l.r.top - plate.r.bottom, 0);
        if (dx === 0 && dy === 0) continue; // an overlap is audit-map's finding
        const d = Math.hypot(dx, dy) / zoom;
        if (d < GAP) {
          nearPlate.push(`${l.id} is ${Math.round(d)}px from ${plate.id}`);
        }
      }
    }

    // -- 2a) a frame header wider than its two lines --------------------
    //
    // A frame's header is a label and a summary side by side in about 120px
    // each. It does not clip, so a summary one item too long simply takes a
    // third line and pushes the header band down over the first card inside
    // it. The fix is to stop listing what the cards already print.
    const wideHeaders = [];
    for (const header of document.querySelectorAll("[data-frame-header]")) {
      // Cluster frames only. An `infra` host frame's header is a 99px stats
      // block with ports and capacities in it, and counting its lines against
      // two would report every host.
      if (!header.closest(".react-flow__node")?.className.includes("cluster")) {
        continue;
      }
      for (const part of header.children) {
        const lines = Math.round(part.getBoundingClientRect().height / zoom / 13);
        if (lines > 2) {
          const id = header.closest(".react-flow__node")?.dataset.id;
          wideHeaders.push(`${id}: ${lines} lines — "${part.textContent.trim()}"`);
        }
      }
    }

    // -- 2b) ink that keeps rendering past the card's own border ---------
    //
    // The probe above only sees a box that *clips*. A card is a fixed-height
    // node with `overflow: visible`, so content too long for the plate is not
    // truncated — it carries on below the border, over the canvas, looking
    // like a caption nobody wrote. Neither audit could see it: the geometry is
    // right, the node measures its declared height, and nothing is cut off.
    //
    // Every map renders 2–3px past its border from the border and shadow
    // rounding themselves, so the threshold is 4.
    const spilling = [];
    for (const node of document.querySelectorAll(".react-flow__node")) {
      const box = node.getBoundingClientRect();
      let lowest = box.top;
      for (const el of node.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.height && r.width) lowest = Math.max(lowest, r.bottom);
      }
      const spill = Math.round((lowest - box.bottom) / zoom);
      if (spill > 3) {
        spilling.push(`${node.dataset.id}: ink reaches ${spill}px past its border`);
      }
    }

    return {
      zoom,
      labels: labels.length,
      edges: edges.length,
      tooClose,
      nearPlate,
      labelPairs,
      overflowing,
      wideHeaders,
      spilling,
    };
  },
  { GAP, SAMPLES },
);

// -- 3) the nav pill, at every width that has ever mattered --------------
const navIssues = [];
for (const width of NAV_WIDTHS) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(250);
  const box = await page.locator('nav[aria-label="Main"]').boundingBox();
  if (!box) {
    navIssues.push(`${width}px: no nav found`);
    continue;
  }
  const right = box.x + box.width;
  if (box.x < 0 || right > width)
    navIssues.push(
      `${width}px: nav runs ${Math.round(box.x)} → ${Math.round(right)}`,
    );
}

await browser.close();

const fmt = (title, list) =>
  list.length ? `\n${title} (${list.length}):\n  ${list.join("\n  ")}` : `\n${title}: clean`;

console.log(
  `zoom ${report.zoom} · ${report.labels} labels · ${report.edges} edges · margin ${GAP} flow px`,
);
console.log(fmt("labels too close to a stroke", report.tooClose));
console.log(fmt(`labels within ${GAP}px of a plate`, report.nearPlate));
console.log(fmt("labels overlapping each other", report.labelPairs));
console.log(fmt("content overflowing its box", report.overflowing));
console.log(fmt("frame headers over two lines", report.wideHeaders));
console.log(fmt("ink past the card border", report.spilling));
console.log(fmt(`nav pill at ${NAV_WIDTHS.join("/")}`, navIssues));

const failures =
  report.tooClose.length +
  report.nearPlate.length +
  report.labelPairs.length +
  report.overflowing.length +
  report.wideHeaders.length +
  report.spilling.length +
  navIssues.length;
if (failures > 0) process.exitCode = 1;
