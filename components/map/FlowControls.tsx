"use client";

import { useReactFlow, useStore } from "@xyflow/react";

/**
 * minZoom has to be low enough that fitView can actually fit. At 0.2 the media
 * map needed 0.108 to fit a 390px viewport, so fitView clamped and the diagram
 * ran 286px off the side of a phone with no way to zoom out.
 */
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 1.6;

export const FIT_VIEW_OPTIONS = {
  // fitView frames the nodes, and edge labels sit outside them — a label under
  // the lowest frame was cropped by the pane. The extra padding is the margin
  // the labels need.
  padding: 0.06,
  maxZoom: MAX_ZOOM,
  minZoom: MIN_ZOOM,
};

/**
 * The slider runs on a log scale, because zoom is multiplicative: 0.1 to 1.6
 * is four doublings, and on a linear track the media map's fit zoom (0.41)
 * sits at a fifth of the way along, cramming every useful level for a wide
 * graph into the first inch. On a log track a step of the same length is
 * always the same factor, which is what the wheel and the buttons already do.
 */
const toSlider = (zoom: number, min: number, max: number) =>
  Math.log(zoom / min) / Math.log(max / min);

const fromSlider = (position: number, min: number, max: number) =>
  min * Math.pow(max / min, position);

/** The same pill the nav, the reference and the export button are made of. */
const BUTTON =
  "flex h-7 w-7 items-center justify-center rounded-full text-fg-2 transition-colors duration-300 ease-fluid hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.94] disabled:pointer-events-none disabled:text-line-3";

/**
 * One pill: zoom out, the live level, zoom in, fit — in the same enclosure the
 * nav and the two panel buttons use, because they all sit on the same canvas.
 *
 * The readout is the point: on a graph this wide, knowing you are at 67 % is
 * what tells you whether panning or fitting is the faster way back.
 */
export function FlowControls({
  onFit,
  onZoom,
}: {
  /** Fired for the Fit button — the viewport is ours again. */
  onFit?: () => void;
  /** Fired for zoom in/out/slider — the viewport is the user's from here on. */
  onZoom?: () => void;
} = {}) {
  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow();
  const zoom = useStore((state) => state.transform[2]);
  const minZoom = useStore((state) => state.minZoom);
  const maxZoom = useStore((state) => state.maxZoom);

  return (
    <div className="bezel flex items-center gap-0.5 rounded-full bg-surface/85 p-1 backdrop-blur-xl">
      <button
        type="button"
        aria-label="Zoom out"
        disabled={zoom <= minZoom + 0.001}
        onClick={() => {
          onZoom?.();
          zoomOut({ duration: 180 });
        }}
        className={BUTTON}
      >
        <svg viewBox="0 0 12 12" aria-hidden className="h-2.5 w-2.5">
          <path d="M2 6h8" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>

      <div className="flex items-center px-2">
        <input
          type="range"
          aria-label="Zoom level"
          min={0}
          max={1}
          step={0.005}
          value={toSlider(zoom, minZoom, maxZoom)}
          // The readout beside it already says 41 %; the thumb's own position
          // is a fraction of a range nobody can see, so it is named instead.
          aria-valuetext={`${Math.round(zoom * 100)} %`}
          onChange={(event) => {
            onZoom?.();
            zoomTo(fromSlider(Number(event.target.value), minZoom, maxZoom));
          }}
          className="zoom-slider w-16"
        />
      </div>

      <output
        aria-live="off"
        title="Current zoom level"
        className="flex h-7 w-11 items-center justify-center font-mono text-[10.5px] tabular-nums text-fg-2"
      >
        {Math.round(zoom * 100)} %
      </output>

      <button
        type="button"
        aria-label="Zoom in"
        disabled={zoom >= maxZoom - 0.001}
        onClick={() => {
          onZoom?.();
          zoomIn({ duration: 180 });
        }}
        className={BUTTON}
      >
        <svg viewBox="0 0 12 12" aria-hidden className="h-2.5 w-2.5">
          <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>

      <span className="mx-0.5 h-4 w-px bg-line-2" aria-hidden />

      <button
        type="button"
        onClick={() => {
          onFit?.();
          fitView({ ...FIT_VIEW_OPTIONS, duration: 300 });
        }}
        className={`${BUTTON} w-auto px-3 text-[12px]`}
      >
        Fit
      </button>
    </div>
  );
}
