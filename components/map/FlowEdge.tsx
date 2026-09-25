"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  type EdgeProps,
} from "@xyflow/react";

import type { EdgeFlavor, FlowLink } from "@/types/system-map";

type Side = NonNullable<FlowLink["labelSide"]>;

/** What `toEdge` puts in `data` — read here instead of casting per field. */
type FlowEdgeData = {
  flavor?: EdgeFlavor;
  /** Set by the canvas when the footer legend has dimmed this flavor. */
  muted?: boolean;
  /** Set when the legend has this flavor lit. */
  lit?: boolean;
  labelSide?: Side;
  labelNudge?: { x?: number; y?: number };
};

/** Distance from stroke to label, in flow pixels. */
const GAP = 16;

const PLACEMENT: Record<Side, { anchor: string; dx: number; dy: number }> = {
  above: { anchor: "translate(-50%, -100%)", dx: 0, dy: -GAP },
  below: { anchor: "translate(-50%, 0)", dx: 0, dy: GAP },
  left: { anchor: "translate(-100%, -50%)", dx: -GAP, dy: 0 },
  right: { anchor: "translate(0, -50%)", dx: GAP, dy: 0 },
};

const DEFAULT_CURVATURE = 0.25;

/** xyflow's own control-point offset. */
const offset = (distance: number, curvature: number) =>
  distance >= 0 ? 0.5 * distance : curvature * 25 * Math.sqrt(-distance);

/**
 * Where xyflow puts a bezier control point for a handle on `pos`. Copied from
 * getControlWithCurvature so the tangent below describes the curve that is
 * actually drawn rather than an approximation of it.
 */
function control(
  pos: Position,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  c: number,
): [number, number] {
  switch (pos) {
    case Position.Left:
      return [x1 - offset(x1 - x2, c), y1];
    case Position.Right:
      return [x1 + offset(x2 - x1, c), y1];
    case Position.Top:
      return [x1, y1 - offset(y1 - y2, c)];
    default:
      return [x1, y1 + offset(y2 - y1, c)];
  }
}

/**
 * Default React Flow edges centre their label on the path, which cuts the
 * stroke in half. This one puts the label beside the line: above it when the
 * edge runs horizontally, next to it when it runs vertically.
 */
export function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style,
  markerEnd,
  markerStart,
  data,
}: EdgeProps) {
  const edge = data as FlowEdgeData | undefined;

  const curvature =
    (data as { curvature?: number } | undefined)?.curvature ??
    DEFAULT_CURVATURE;

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  });

  // Offset the label perpendicular to the curve's tangent at its midpoint, and
  // anchor the edge of the label that faces the stroke — that way the gap is
  // always the same, whatever the label's size or the edge's angle.
  //
  // The tangent has to come from the real control points. The first version
  // assumed the curve always bends horizontally, which is true of the media
  // map and false of every vertical wire on the network map: for a bottom-to-
  // top edge xyflow offsets its controls in y, not x, so the estimated tangent
  // pointed the wrong way and the derived side was a coin toss.
  const [c1x, c1y] = control(
    sourcePosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    curvature,
  );
  const [c2x, c2y] = control(
    targetPosition,
    targetX,
    targetY,
    sourceX,
    sourceY,
    curvature,
  );

  // B'(0.5) of the cubic through source, c1, c2, target.
  const tanX =
    0.75 * (c1x - sourceX) + 1.5 * (c2x - c1x) + 0.75 * (targetX - c2x);
  const tanY =
    0.75 * (c1y - sourceY) + 1.5 * (c2y - c1y) + 0.75 * (targetY - c2y);
  const length = Math.hypot(tanX, tanY) || 1;
  let nx = -tanY / length;
  let ny = tanX / length;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }

  const side =
    edge?.labelSide ??
    (Math.abs(nx) > Math.abs(ny) ? (nx < 0 ? "left" : "right") : "above");

  const { anchor, dx: ox, dy: oy } = PLACEMENT[side];
  const extra = edge?.labelNudge;
  const nudge = `${anchor} translate(${labelX + ox + (extra?.x ?? 0)}px, ${
    labelY + oy + (extra?.y ?? 0)
  }px)`;
  const external = edge?.flavor === "external";
  // The edge group is dimmed by CSS, but EdgeLabelRenderer portals the label
  // out of that group, so it has to be faded separately.
  const muted = edge?.muted === true;
  const lit = edge?.lit === true;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            data-edge-label={id}
            className={`pointer-events-none absolute whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.06em] transition-opacity duration-150 ${
              external ? "text-edge-label" : "text-fg-3"
            } ${muted ? "opacity-0" : "opacity-100"} ${
              lit && !external ? "text-fg-2" : ""
            }`}
            style={{ transform: nudge }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
