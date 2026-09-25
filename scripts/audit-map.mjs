// Geometry audit for the flow map. Finds the things the eye notices but a
// type-checker cannot: edges cutting through unrelated cards, edges lying on
// top of each other, labels colliding, cards whose inner rhythm differs.
//
//   node scripts/audit-map.mjs [url] [--shot out.png]
import { chromium } from "playwright";

const url = process.argv[2]?.startsWith("http")
  ? process.argv[2]
  : "http://127.0.0.1:3000/example";
const shotIdx = process.argv.indexOf("--shot");
const shot = shotIdx > -1 ? process.argv[shotIdx + 1] : null;
const vpIdx = process.argv.indexOf("--vp");
const [vw, vh] = vpIdx > -1 ? process.argv[vpIdx + 1].split("x").map(Number) : [2560, 1440];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector(".react-flow__node");
await page.waitForTimeout(1200);

const report = await page.evaluate(() => {
  const SAMPLES = 60;
  const MARGIN = 3;

  const zoom = Number(/scale\(([\d.]+)\)/.exec(document.querySelector(".react-flow__viewport").style.transform)?.[1] ?? 1);
  const nodes = [...document.querySelectorAll(".react-flow__node")];
  const hasType = (node, type) =>
    node.classList.contains(`react-flow__node-${type}`);
  const cards = nodes
    .filter((n) => !["infra", "cluster", "lane"].some((type) => hasType(n, type)))
    .map((n) => ({ id: n.dataset.id, r: n.getBoundingClientRect() }));

  const frames = nodes
    .filter((n) => ["infra", "cluster"].some((type) => hasType(n, type)))
    .map((n) => ({ id: n.dataset.id, r: n.getBoundingClientRect() }));

  const edges = [...document.querySelectorAll(".react-flow__edge")].map((g) => {
    const path = g.querySelector("path.react-flow__edge-path");
    const len = path.getTotalLength();
    const pts = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const p = path.getPointAtLength((len * i) / SAMPLES);
      const m = path.getScreenCTM();
      pts.push({ x: p.x * m.a + p.y * m.c + m.e, y: p.x * m.b + p.y * m.d + m.f });
    }
    const label = g.querySelector(".react-flow__edge-textwrapper, .react-flow__edge-text");
    return {
      id: g.dataset.testid?.replace("rf__edge-", "") ?? "?",
      source: g.getAttribute("aria-label") ?? "",
      pts,
      label: label ? label.getBoundingClientRect() : null,
    };
  });

  const hits = (r, p) =>
    p.x > r.left + MARGIN && p.x < r.right - MARGIN &&
    p.y > r.top + MARGIN && p.y < r.bottom - MARGIN;

  // 1) edges cutting through cards they do not connect
  const through = [];
  for (const e of edges) {
    const [, from, to] = /Edge from (\S+) to (\S+)/.exec(e.source) ?? [];
    for (const c of cards) {
      if (c.id === from || c.id === to) continue;
      const inside = e.pts.filter((p) => hits(c.r, p)).length;
      if (inside > 1) through.push(`${e.id} crosses ${c.id} (${inside}/${e.pts.length} pts)`);
    }
  }

  // 2) edge pairs that run on top of each other for a long stretch
  const overlapping = [];
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      let close = 0;
      for (const p of edges[i].pts) {
        const near = edges[j].pts.some(
          (q) => Math.abs(p.x - q.x) < 4 && Math.abs(p.y - q.y) < 4,
        );
        if (near) close++;
      }
      if (close > edges[i].pts.length * 0.35)
        overlapping.push(`${edges[i].id} ~ ${edges[j].id} (${close} pts)`);
    }
  }

  // 3) label collisions: over a card, over another label, or sitting on its
  //    own line instead of beside it
  const overlap = (a, b) =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const labelIssues = [];
  const labels = [...document.querySelectorAll("[data-edge-label]")].map((el) => ({
    id: el.dataset.edgeLabel,
    r: el.getBoundingClientRect(),
  }));
  // every frame's own header line is a no-go zone for edge labels
  const frameHeaders = [...document.querySelectorAll("[data-frame-header]")].map(
    (el) => ({
      id: el.closest(".react-flow__node").dataset.id,
      r: el.getBoundingClientRect(),
    }),
  );

  // A label may sit inside a frame, and it may clip the border of a frame its
  // own edge crosses. What it must not do is lie across a frame it has nothing
  // to do with — that is what reads as "label on top of the block".
  const areaShare = (l, f) => {
    const w = Math.min(l.right, f.right) - Math.max(l.left, f.left);
    const h = Math.min(l.bottom, f.bottom) - Math.max(l.top, f.top);
    if (w <= 0 || h <= 0) return 0;
    return (w * h) / Math.max(1, (l.right - l.left) * (l.bottom - l.top));
  };
  const straddles = (l, f) => {
    const share = areaShare(l, f);
    const inside =
      l.left >= f.left && l.right <= f.right && l.top >= f.top && l.bottom <= f.bottom;
    return share > 0.2 && !inside;
  };

  for (const l of labels) {
    for (const c of cards) if (overlap(l.r, c.r)) labelIssues.push(`${l.id} over card ${c.id}`);
    for (const f of frameHeaders)
      if (overlap(l.r, f.r)) labelIssues.push(`${l.id} over ${f.id} header`);
    const ends = /Edge from (\S+) to (\S+)/.exec(
      edges.find((e) => e.id === l.id)?.source ?? "",
    );
    for (const f of frames) {
      if (f.id === ends?.[1] || f.id === ends?.[2]) continue;
      if (straddles(l.r, f.r)) labelIssues.push(`${l.id} lies across ${f.id}`);
    }
    for (const o of labels)
      if (o.id > l.id && overlap(l.r, o.r)) labelIssues.push(`${l.id} over label ${o.id}`);
    const own = edges.find((e) => e.id === l.id);
    if (own) {
      const cx = (l.r.left + l.r.right) / 2;
      const cy = (l.r.top + l.r.bottom) / 2;
      const tol = 8 * zoom; // 8 flow px, whatever the current zoom
      const onLine = own.pts.some((p) => Math.abs(p.x - cx) < tol && Math.abs(p.y - cy) < tol);
      if (onLine) labelIssues.push(`${l.id} sits on its own line`);
    }
    // A label on somebody else's stroke reads exactly as badly as one on its
    // own. Where several edges leave a single handle this is the failure that
    // actually happens, and the checks above cannot see it.
    for (const other of edges) {
      if (other.id === l.id) continue;
      if (other.pts.some((p) => hits(l.r, p)))
        labelIssues.push(`${l.id} label struck by ${other.id}`);
    }
  }
  const unlabelled = edges.filter((e) => !labels.some((l) => l.id === e.id)).map((e) => e.id);

  // 4) card rhythm: distance from card bottom to the metric row, and to the
  //    description block — must be identical across cards of the same type
  const rhythm = {};
  for (const c of cards) {
    const el = document.querySelector(`[data-id="${c.id}"]`);
    const inner = el.firstElementChild;
    const metrics = inner.querySelector("[data-metrics]");
    const p = inner.querySelector("p");
    const key = `${Math.round(c.r.height / zoom)}px`;
    (rhythm[key] ??= []).push({
      id: c.id,
      gapBelowMetrics: metrics ? Math.round((c.r.bottom - metrics.getBoundingClientRect().bottom) / zoom) : null,
      metricTop: metrics ? Math.round((metrics.getBoundingClientRect().top - c.r.top) / zoom) : null,
      descHeight: p ? Math.round(p.getBoundingClientRect().height / zoom) : 0,
    });
  }

  // 5) cards outside their frame
  const escaping = [];
  for (const f of frames) {
    for (const c of cards) {
      const inX = c.r.left >= f.r.left && c.r.right <= f.r.right;
      const inY = c.r.top >= f.r.top && c.r.bottom <= f.r.bottom;
      const partly = overlap(c.r, f.r);
      if (partly && !(inX && inY)) escaping.push(`${c.id} sticks out of ${f.id}`);
    }
  }

  // Any text that does not fit its box, in either direction.
  //
  // The width test alone missed every card description on the map: a
  // `CardBody` is a fixed two-line block with the overflow hidden, so a
  // four-line sentence wraps inside it and reports the same scrollWidth as a
  // one-line one.
  const clipped = [...document.querySelectorAll(".react-flow__node *")]
    .filter((e) => {
      if (e.children.length > 0) return false;
      if (e.scrollWidth > e.clientWidth + 1) return true;
      // Only a box that actually clips can hide a line. `leading-none` makes
      // every headline figure report a scrollHeight a few pixels over its
      // client height, and none of them lose a pixel of ink for it.
      const { overflowY } = getComputedStyle(e);
      return overflowY !== "visible" && e.scrollHeight > e.clientHeight + 3;
    })
    .map((e) => {
      const card = e.closest(".react-flow__node");
      return `${card?.dataset.id}: "${e.textContent.trim()}"`;
    });

  // Nothing may sit in an infrastructure frame's header band.
  const infraIds = new Set(
    nodes.filter((n) => hasType(n, "infra")).map((n) => n.dataset.id),
  );
  const hostBands = frameHeaders.filter((f) => infraIds.has(f.id));
  const inHeader = hostBands.flatMap((band) =>
    [...cards, ...frames]
      .filter((n) => n.id !== band.id)
      .filter((n) => overlap(n.r, band.r))
      .map((n) => `${n.id} in ${band.id} header`),
  );

  const pane = document.querySelector(".react-flow").getBoundingClientRect();
  const bounds = [...cards, ...frames].reduce(
    (a, n) => ({
      l: Math.min(a.l, n.r.left), t: Math.min(a.t, n.r.top),
      r: Math.max(a.r, n.r.right), b: Math.max(a.b, n.r.bottom),
    }),
    { l: 1e9, t: 1e9, r: -1e9, b: -1e9 },
  );

  return {
    counts: { cards: cards.length, frames: frames.length, edges: edges.length },
    zoom: Number(/scale\(([\d.]+)\)/.exec(document.querySelector(".react-flow__viewport").style.transform)?.[1] ?? 0),
    fitsViewport: bounds.l >= pane.left && bounds.r <= pane.right && bounds.t >= pane.top && bounds.b <= pane.bottom,
    edgesThroughCards: through,
    edgesOverlapping: overlapping,
    labelIssues,
    unlabelled,
    escaping,
    inHeader,
    clipped,
    rhythm,
  };
});

if (shot) await page.screenshot({ path: shot, fullPage: false });
await browser.close();

const fmt = (title, list) =>
  list.length ? `\n${title} (${list.length}):\n  ${list.join("\n  ")}` : `\n${title}: clean`;

console.log(`zoom ${report.zoom} · ${report.counts.cards} cards · ${report.counts.edges} edges · fits: ${report.fitsViewport}`);
console.log(fmt("edges through cards", report.edgesThroughCards));
console.log(fmt("edges overlapping", report.edgesOverlapping));
console.log(fmt("label problems", report.labelIssues));
console.log(fmt("edges without a label", report.unlabelled));
console.log(fmt("cards escaping frames", report.escaping));
console.log(fmt("inside the host header band", report.inHeader));
console.log(fmt("clipped text", report.clipped));
for (const [h, cards] of Object.entries(report.rhythm)) {
  const gaps = [...new Set(cards.map((c) => c.gapBelowMetrics))];
  const tops = [...new Set(cards.map((c) => c.metricTop))];
  const lines = [...new Set(cards.map((c) => c.descHeight))];
  console.log(`\ncards ${h}: ${cards.length} · gap below metrics ${gaps.join("/")} · metric top ${tops.join("/")} · desc block ${lines.join("/")}px`);
}

const failures =
  report.edgesThroughCards.length +
  report.edgesOverlapping.length +
  report.labelIssues.length +
  report.unlabelled.length +
  report.escaping.length +
  report.inHeader.length +
  report.clipped.length +
  Number(!report.fitsViewport);
if (failures > 0) process.exitCode = 1;
