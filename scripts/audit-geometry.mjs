/**
 * Checks a map's geometry without a browser.
 *
 * `audit-map.mjs` and `audit-labels.mjs` are the contract, and both need the
 * page rendered — they measure real DOM boxes at three viewport sizes. That
 * makes them the last check rather than the first, and by the time they run,
 * a wire that goes through a card has already been committed.
 *
 * This one runs against the data. It reads `topology.ts` directly, rebuilds
 * every edge's bezier with xyflow's own control-point formula — the same one
 * `FlowEdge.tsx` copies so its label normals describe the curve that is
 * actually drawn — and samples it against every card rectangle. It cannot see
 * a clipped label or a text overflow, so it does not replace either audit. It
 * catches the class of defect that is expensive to find later: a stroke
 * through a plate, two edges on one handle, a card outside its frame.
 *
 * Usage:
 *
 *   node scripts/audit-geometry.mjs example
 *   node scripts/audit-geometry.mjs example second-map
 */

import { registerHooks } from "node:module";
import { dirname, resolve } from "node:path";
import { statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

/**
 * The app resolves `@/…` and extensionless imports through the bundler. Node
 * does neither, so the hook does what tsconfig's paths and moduleResolution
 * would: rewrite `@/x` to the repo root and try `.ts` before giving up.
 */
registerHooks({
  resolve(specifier, context, next) {
    const base = specifier.startsWith("@/")
      ? resolve(root, specifier.slice(2))
      : specifier.startsWith(".") && context.parentURL?.endsWith(".ts")
        ? resolve(dirname(fileURLToPath(context.parentURL)), specifier)
        : null;
    if (base === null) return next(specifier, context);

    // `@/data/example/topology` from another view's topology needs the suffix
    // just as much as a relative import does.
    // `base` itself may be a directory — `@/data/example` is one — so only a
    // real file counts as a hit.
    const isFile = (path) => {
      try {
        return statSync(path).isFile();
      } catch {
        return false;
      }
    };
    for (const candidate of [base, `${base}.ts`, `${base}/index.ts`]) {
      if (isFile(candidate)) {
        return next(pathToFileURL(candidate).href, context);
      }
    }
    return next(pathToFileURL(base).href, context);
  },
});

/* -- geometry ---------------------------------------------------------- */

/**
 * Sizes come from the view's own `index.ts`, not from a guess.
 *
 * The first version of this script classified nodes by which fields they
 * carried, and got a multi-host map wrong: an `infra` host frame has `width`
 * and `height` but no `variant`, so it was measured as a 232 × 200 card and
 * every service inside it read as an overlap — hundreds of collisions, none
 * of them real. `flowNodes` already carries `initialWidth`/`initialHeight` — they
 * exist so xyflow's first `fitView` runs on known sizes — which makes it the
 * same geometry the browser lays out.
 */
const boxesFor = (flowNodes) => {
  const boxes = new Map();
  for (const node of flowNodes) {
    if (node.type === "lane") continue;
    if (node.initialWidth === undefined || node.initialHeight === undefined) {
      throw new Error(`${node.id} has no initial size; add one in index.ts`);
    }
    boxes.set(node.id, {
      x: node.position.x,
      y: node.position.y,
      w: node.initialWidth,
      h: node.initialHeight,
      /** A host frame's header band is 99px, a group frame's 40px. */
      header: node.type === "cluster" ? 40 : node.type === "infra" ? 99 : null,
    });
  }
  return boxes;
};

const handleAt = (box, side) => {
  switch (side) {
    case "left":
      return [box.x, box.y + box.h / 2];
    case "right":
      return [box.x + box.w, box.y + box.h / 2];
    case "top":
      return [box.x + box.w / 2, box.y];
    default:
      return [box.x + box.w / 2, box.y + box.h];
  }
};

/** xyflow's own control-point offset, as copied in FlowEdge.tsx. */
const offset = (distance, curvature) =>
  distance >= 0 ? 0.5 * distance : curvature * 25 * Math.sqrt(-distance);

const control = (side, x1, y1, x2, y2, c) => {
  switch (side) {
    case "left":
      return [x1 - offset(x1 - x2, c), y1];
    case "right":
      return [x1 + offset(x2 - x1, c), y1];
    case "top":
      return [x1, y1 - offset(y1 - y2, c)];
    default:
      return [x1, y1 + offset(y2 - y1, c)];
  }
};

const bezier = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

const inside = (box, [x, y], margin = 0) =>
  x > box.x + margin &&
  x < box.x + box.w - margin &&
  y > box.y + margin &&
  y < box.y + box.h - margin;

/* -- the checks -------------------------------------------------------- */

/**
 * `design.md` draws a line this script has to draw too: "an edge crossing an
 * unrelated card" is a failure, while what it forbids over a *frame* is a
 * label, not a stroke. A frame is a translucent grouping and a wire passing
 * through its empty air reads fine; a wire through a plate does not.
 *
 * So a card crossing fails and a frame crossing is reported. Both are measured
 * against the real box — an earlier version expanded every box by 6px and
 * turned a wire running 4px past a card into a crossing, which is a
 * tightness finding and belongs in the clearance table instead.
 */
const SAMPLES = 240;

async function auditView(view) {
  const topology = await import(`../data/${view}/topology.ts`);
  const { flowNodes } = await import(`../data/${view}/index.ts`);
  const { lanes, links } = topology;

  const boxes = boxesFor(flowNodes);
  const frames = [...boxes].filter(([, b]) => b.header !== null);
  const cards = [...boxes].filter(([, b]) => b.header === null);

  const problems = [];
  const note = (kind, detail) => problems.push({ kind, detail });

  /* 1. every card inside a frame stays inside it, clear of its header */
  for (const [frameId, fb] of frames) {
    for (const [cardId, cb] of cards) {
      const overlapsX = cb.x < fb.x + fb.w && cb.x + cb.w > fb.x;
      const overlapsY = cb.y < fb.y + fb.h && cb.y + cb.h > fb.y;
      if (!overlapsX || !overlapsY) continue;
      const contained =
        cb.x >= fb.x && cb.x + cb.w <= fb.x + fb.w &&
        cb.y >= fb.y && cb.y + cb.h <= fb.y + fb.h;
      if (!contained) {
        note("card-escapes-frame", `${cardId} straddles ${frameId}`);
      } else if (cb.y - fb.y < fb.header) {
        note(
          "card-in-header",
          `${cardId} sits ${cb.y - fb.y}px into ${frameId}, header is ${fb.header}`,
        );
      }
    }
  }

  /* 2. no two cards overlap. Frames are allowed to contain them. */
  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i + 1; j < cards.length; j += 1) {
      const [aId, a] = cards[i];
      const [bId, b] = cards[j];
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
        note("cards-overlap", `${aId} × ${bId}`);
      }
    }
  }

  /* 3. every handle is used once */
  const seats = new Map();
  for (const link of links) {
    for (const [id, side, dir] of [
      [link.source, link.sourceHandle, "out"],
      [link.target, link.targetHandle, "in"],
    ]) {
      const seat = `${id}.${side}.${dir}`;
      seats.set(seat, [...(seats.get(seat) ?? []), link.id]);
    }
  }
  /**
   * Several edges on one handle is legitimate — a gateway with three
   * downlinks is the usual case — so this is reported rather
   * than failed. What it actually costs is a label collision, and only the
   * browser audit can see that.
   */
  const shared = [...seats]
    .filter(([, ids]) => ids.length > 1)
    .map(([seat, ids]) => `${seat} ← ${ids.join(", ")}`);

  const all = [...boxes.keys()];

  /* 4. every endpoint exists */
  for (const link of links) {
    for (const id of [link.source, link.target]) {
      if (!boxes.has(id)) note("missing-node", `${link.id} → ${id}`);
    }
  }

  /* 5. no stroke through a plate it is not attached to */
  const clearances = [];
  const frameCrossings = [];
  for (const link of links) {
    const sb = boxes.get(link.source);
    const tb = boxes.get(link.target);
    if (!sb || !tb) continue;

    const from = handleAt(sb, link.sourceHandle);
    const to = handleAt(tb, link.targetHandle);
    const c = link.curvature ?? 0.25;
    const c1 = control(link.sourceHandle, ...from, ...to, c);
    const c2 = control(link.targetHandle, ...to, ...from, c);

    // Anything the wire is allowed to be inside: its own endpoints, and any
    // frame that contains an endpoint — a wire into a card inside a frame has
    // to cross that frame's border.
    const exempt = new Set([link.source, link.target]);
    for (const [frameId, fb] of frames) {
      for (const id of [link.source, link.target]) {
        const b = boxes.get(id);
        if (b && b.x >= fb.x && b.x + b.w <= fb.x + fb.w && b.y >= fb.y && b.y + b.h <= fb.y + fb.h) {
          exempt.add(frameId);
        }
      }
    }

    const crossed = new Set();
    let worst = { id: null, gap: Infinity };
    for (let i = 0; i <= SAMPLES; i += 1) {
      const point = bezier(from, c1, c2, to, i / SAMPLES);
      for (const id of all) {
        if (exempt.has(id)) continue;
        const box = boxes.get(id);
        if (inside(box, point)) crossed.add(id);
        // Report the tightest pass, so a wire that only just clears something
        // is visible before it stops clearing it.
        const dx = Math.max(box.x - point[0], point[0] - (box.x + box.w), 0);
        const dy = Math.max(box.y - point[1], point[1] - (box.y + box.h), 0);
        const gap = Math.hypot(dx, dy);
        if (gap < worst.gap) worst = { id, gap };
      }
    }
    for (const id of crossed) {
      const isFrame = boxes.get(id).header !== null;
      if (isFrame) frameCrossings.push(`${link.id} through ${id}`);
      else note("stroke-through-card", `${link.id} crosses ${id}`);
    }
    if (worst.id) clearances.push({ link: link.id, ...worst });
  }

  /* 6. extent, against the width the smallest viewport can fit */
  const xs = [...boxes.values()].flatMap((b) => [b.x, b.x + b.w]);
  const ys = [...boxes.values()].flatMap((b) => [b.y, b.y + b.h]);
  const laneYs = (lanes ?? []).map((lane) => lane.y);
  const extent = {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys, ...laneYs),
    y1: Math.max(...ys),
  };

  /* 7. an edge that leaves the node bounding box is an edge fitView clips */
  const arcs = [];
  for (const link of links) {
    const sb = boxes.get(link.source);
    const tb = boxes.get(link.target);
    if (!sb || !tb) continue;
    const from = handleAt(sb, link.sourceHandle);
    const to = handleAt(tb, link.targetHandle);
    const c = link.curvature ?? 0.25;
    const c1 = control(link.sourceHandle, ...from, ...to, c);
    const c2 = control(link.targetHandle, ...to, ...from, c);
    let over = 0;
    for (let i = 0; i <= SAMPLES; i += 1) {
      const [, y] = bezier(from, c1, c2, to, i / SAMPLES);
      over = Math.max(over, y - extent.y1, extent.y0 - y);
    }
    if (over > 1) arcs.push({ link: link.id, over: Math.round(over) });
  }

  return { view, cards, frames, links, problems, clearances, extent, arcs, shared, frameCrossings };
}

/* -- report ------------------------------------------------------------ */

const views = process.argv.slice(2);
if (!views.length) {
  console.error("usage: node scripts/audit-geometry.mjs <view> [view …]");
  process.exit(2);
}

let failed = 0;

for (const view of views) {
  const r = await auditView(view);
  const w = r.extent.x1 - r.extent.x0;
  const h = r.extent.y1 - r.extent.y0;

  console.log(
    `\n${view} — ${r.cards.length} cards · ${r.frames.length} frames · ` +
      `${r.links.length} flows · extent ${w} × ${h}`,
  );

  // 3 900 is the widest a 390px viewport can fit at minZoom 0.1.
  if (w > 3900) {
    console.log(`  ! ${w} flow px is wider than minZoom 0.1 can fit on a phone`);
    failed += 1;
  }

  /**
   * `fitView` frames the nodes, and `FIT_VIEW_OPTIONS.padding` is 0.06 — about
   * 75px on a canvas this tall. An arc 20px outside the bounds is fine; anything past the padding is an
   * arc the pane crops on first paint.
   */
  const budget = Math.round((r.extent.y1 - r.extent.y0) * 0.06);
  for (const arc of r.arcs) {
    const over = arc.over > budget;
    console.log(
      `  ${over ? "!" : " "} ${arc.link} runs ${arc.over}px outside the node ` +
        `bounds (padding covers ${budget})`,
    );
    if (over) failed += 1;
  }

  if (r.shared.length) {
    console.log(`  · several edges on one handle: ${r.shared.join(" | ")}`);
  }

  if (r.frameCrossings.length) {
    console.log(`  · stroke through a frame's air: ${r.frameCrossings.join(", ")}`);
  }

  const tightest = r.clearances.sort((a, b) => a.gap - b.gap).slice(0, 5);
  console.log("  tightest passes:");
  for (const entry of tightest) {
    console.log(
      `    ${entry.link.padEnd(14)} ${Math.round(entry.gap)
        .toString()
        .padStart(4)}px from ${entry.id}`,
    );
  }

  if (!r.problems.length) {
    console.log("  no geometry problems");
  } else {
    failed += r.problems.length;
    const byKind = new Map();
    for (const p of r.problems) byKind.set(p.kind, [...(byKind.get(p.kind) ?? []), p.detail]);
    for (const [kind, details] of byKind) {
      console.log(`  ✗ ${kind} (${details.length})`);
      for (const detail of details) console.log(`      ${detail}`);
    }
  }
}

process.exit(failed ? 1 : 0);
