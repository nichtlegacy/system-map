import { toBlob, toSvg } from "html-to-image";

export type ExportFormat = "png" | "svg" | "clipboard";

export type ExportOptions = {
  background: boolean;
  dark: boolean;
  scale: 1 | 2 | 3;
};

/** Breathing room around the graph, in flow pixels. */
const PAD = 56;

/**
 * The graph's extent in flow coordinates, measured off the DOM and divided by
 * the current viewport transform. React Flow's own getNodesBounds missed the
 * width of outermost cards in wide graphs.
 */
function graphBounds() {
  const viewport = document.querySelector<HTMLElement>(".react-flow__viewport");
  const pane = document.querySelector<HTMLElement>(".react-flow");
  if (!viewport || !pane) return null;

  const matrix = new DOMMatrixReadOnly(getComputedStyle(viewport).transform);
  const zoom = matrix.a;
  const origin = pane.getBoundingClientRect();

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  for (const node of viewport.querySelectorAll(".react-flow__node")) {
    const rect = node.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) continue;
    const x = (rect.left - origin.left - matrix.e) / zoom;
    const y = (rect.top - origin.top - matrix.f) / zoom;
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x + rect.width / zoom);
    bottom = Math.max(bottom, y + rect.height / zoom);
  }

  if (left === Infinity) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** What the file will be, before the scale multiplier. */
export function exportSize() {
  const bounds = graphBounds();
  if (!bounds) return { bounds: null, width: 0, height: 0 };
  return {
    bounds,
    width: Math.ceil(bounds.width) + PAD * 2,
    height: Math.ceil(bounds.height) + PAD * 2,
  };
}

/**
 * Renders from an off-screen clone rather than the live canvas. Two reasons:
 * the page must not flash into the other theme while a file is being written,
 * and a freshly inserted clone has no colour transition running, so the theme
 * it is born with is the theme that gets captured. Mutating the live viewport
 * did both wrong: the page went light for a second and html-to-image read
 * half-transitioned colours off the real cards.
 */
async function render<F extends "blob" | "svg">(
  options: ExportOptions,
  format: F,
): Promise<F extends "svg" ? string : Blob | null> {
  const source = document.querySelector<HTMLElement>(".react-flow__viewport");
  if (!source) throw new Error("The canvas is not mounted.");

  const { width, height, bounds } = exportSize();
  if (!bounds) throw new Error("The canvas has nothing to export yet.");

  const light = !options.dark;
  const background = light ? "#ffffff" : "#0a0a0a";

  // The offset lives on a wrapper, never on the captured node: html-to-image
  // copies the captured node's cssText, so an off-screen `left` on it would
  // push the whole diagram out of the frame and leave a flat colour.
  const holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  Object.assign(holder.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    zIndex: "-1",
    opacity: "0",
    pointerEvents: "none",
  });

  // The stage carries the react-flow class on purpose. xyflow scopes rules
  // under it, and one of them is `overflow: visible` on the per-edge <svg>.
  // Outside that scope the svgs fall back to the UA default of hidden, which
  // clips every path to its untouched 300x150 box: cards and labels export,
  // every line vanishes. The inline background below still wins over the
  // class, so a transparent export stays transparent.
  const stage = document.createElement("div");
  stage.className = `react-flow ${light ? "theme-light" : "theme-dark"} export-capture`;
  Object.assign(stage.style, {
    position: "relative",
    width: `${width}px`,
    height: `${height}px`,
    overflow: "hidden",
    backgroundColor: options.background ? background : "transparent",
  });

  const clone = source.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    width: `${width}px`,
    height: `${height}px`,
    transform: `translate(${PAD - bounds.x}px, ${PAD - bounds.y}px) scale(1)`,
    transformOrigin: "0 0",
  });

  stage.append(clone);
  holder.append(stage);
  document.body.append(holder);

  // Let the clone lay out and resolve its colours before they are read.
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );

  const config = {
    width,
    height,
    pixelRatio: options.scale,
    backgroundColor: options.background ? background : undefined,
  };

  try {
    const result =
      format === "svg"
        ? await toSvg(stage, config)
        : await toBlob(stage, config);
    return result as F extends "svg" ? string : Blob | null;
  } finally {
    holder.remove();
  }
}

function save(href: string, name: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  link.click();
}

/**
 * Named after the route so exports from different maps stay distinct. The last
 * path segment, not the first: under a base path such as `/demo/example/` the
 * first one names the deployment, not the map.
 */
export const fileName = (extension: string) => {
  const view = window.location.pathname.split("/").filter(Boolean).at(-1) ?? "map";
  return `system-map-${view}-${new Date().toISOString().slice(0, 10)}.${extension}`;
};

export async function exportMap(options: ExportOptions, format: ExportFormat) {
  if (format === "svg") {
    save(await render(options, "svg"), fileName("svg"));
    return "Saved as SVG.";
  }

  const blob = await render(options, "blob");
  if (!blob) throw new Error("The canvas produced no image.");

  if (format === "png") {
    const url = URL.createObjectURL(blob);
    save(url, fileName("png"));
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "Saved as PNG.";
  }

  if (!window.isSecureContext || typeof ClipboardItem === "undefined") {
    throw new Error(
      "Copying needs HTTPS or localhost. Download the PNG instead.",
    );
  }

  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  } catch {
    throw new Error(
      "The browser blocked the clipboard. Download the PNG instead.",
    );
  }
  return "Copied to the clipboard.";
}
