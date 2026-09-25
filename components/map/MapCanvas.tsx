"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore,
} from "@xyflow/react";

import type { Edge, Node } from "@xyflow/react";

import type { EdgeFlavor } from "@/types/system-map";
import { useEdgeFilter } from "@/components/shell/EdgeFilter";

import { ExportButton } from "./ExportButton";
import { edgeTypes, nodeTypes } from "./elementTypes";
import { FIT_VIEW_OPTIONS, FlowControls, MAX_ZOOM, MIN_ZOOM } from "./FlowControls";

/**
 * How much a wheel notch zooms. d3-zoom — which drives the canvas — reads a
 * ctrl-held wheel as a trackpad pinch and multiplies the delta by ten, so on a
 * real mouse a single notch was a factor of four: one click and the map was at
 * the zoom ceiling. A pinch sends deltas of a few pixels and a notch sends
 * 120, so the same 0.002 per pixel serves both: smooth under two fingers,
 * ~1.2x per notch under a wheel.
 */
const ZOOM_PER_PIXEL = 0.002;

/** Line- and page-mode wheels report steps, not pixels. */
const pixels = (event: WheelEvent) =>
  event.deltaMode === 1
    ? event.deltaY * 16
    : event.deltaMode === 2
      ? event.deltaY * window.innerHeight
      : event.deltaY;

/** Arrow keys pan; the shift key pans a screenful at a time. */
const PAN_STEP = 90;
const PAN_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [1, 0],
  ArrowRight: [-1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

function Flow({ nodes, edges, label }: MapProps) {
  const { fitView, getViewport, setViewport, zoomIn, zoomOut } = useReactFlow();
  const { focus, stateOf } = useEdgeFilter();
  const domNode = useStore((state) => state.domNode);

  /**
   * Focus keeps every wire in place and changes only how it reads: the chosen
   * flavor gets a heavier stroke and starts to drift, the rest drop back to a
   * ghost of themselves. The class does the whole edge group, arrowhead
   * included; `lit` and `muted` in the data tell the label to follow, since
   * labels are portalled out of that group and would otherwise sit at full
   * contrast over a faded line. Drift is switched off on a dimmed edge — an
   * animated dash still pulls the eye however faint it is.
   *
   * Weight is written into the style rather than left to a class, because the
   * flavor already sets stroke-width inline and inline wins. The dashes are
   * left alone: every flavor drifts on a keyframe cut for its own period, and
   * swapping the pattern under a running animation would snap it.
   */
  const shownEdges = useMemo(
    () =>
      edges.map((edge) => {
        const flavor = (edge.data as { flavor?: EdgeFlavor } | undefined)?.flavor;
        if (!flavor || focus === null) return edge;

        const state = stateOf(flavor);
        if (state === "plain") return edge;

        const lit = state === "lit";

        return {
          ...edge,
          className: `${edge.className ?? ""} edge-${lit ? "lit" : "muted"}`.trim(),
          animated: lit,
          style: lit ? { ...edge.style, strokeWidth: 2.2 } : edge.style,
          data: { ...edge.data, muted: state === "dim", lit },
        };
      }),
    [edges, focus, stateOf],
  );

  // True while the viewport is still the one we chose. Once someone has panned
  // or zoomed, a resize must leave their view alone: on a phone the URL bar
  // sliding away fires resize, and refitting there yanks the map out from
  // under the card they were reading.
  const pristine = useRef(true);

  // Keep the whole map in frame on smaller displays and window resizes. One
  // refit per frame — a drag-resize fires resize on every pixel.
  useEffect(() => {
    let frame = 0;
    const refit = () => {
      if (!pristine.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => fitView(FIT_VIEW_OPTIONS));
    };

    window.addEventListener("resize", refit);
    return () => {
      window.removeEventListener("resize", refit);
      cancelAnimationFrame(frame);
    };
  }, [fitView]);

  /**
   * The wheel zooms, with no modifier to hold. A map is a thing you look
   * closer at, and reaching for cmd every time to do it is a tax on the one
   * gesture people use most here; panning is what dragging is for.
   *
   * Held shift pans instead, which is what a trackpad's two fingers used to
   * do, and a pinch arrives as a ctrl-wheel and lands in the same code.
   *
   * All of it runs on the wrapper in the capture phase: d3 listens on the pane
   * below, and stopping the native event here is what keeps the two from
   * acting on the same notch.
   */
  useEffect(() => {
    if (!domNode) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const { x, y, zoom } = getViewport();

      if (event.shiftKey) {
        pristine.current = false;
        setViewport({
          x: x - (event.deltaX || event.deltaY),
          y: y - (event.deltaX ? event.deltaY : 0),
          zoom,
        });
        return;
      }

      const next = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, zoom * Math.pow(2, -pixels(event) * ZOOM_PER_PIXEL)),
      );
      if (next === zoom) return;

      // Keep whatever is under the pointer under the pointer.
      const rect = domNode.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const ratio = next / zoom;

      pristine.current = false;
      setViewport({ x: px - (px - x) * ratio, y: py - (py - y) * ratio, zoom: next });
    };

    domNode.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () =>
      domNode.removeEventListener("wheel", onWheel, { capture: true });
  }, [domNode, getViewport, setViewport]);

  // xyflow claims the canvas with role="application", which tells a screen
  // reader to hand every key over — so the canvas has to answer for them.
  // With nodes unfocusable it otherwise answered for none.
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "+" || event.key === "=") {
        zoomIn({ duration: 180 });
      } else if (event.key === "-") {
        zoomOut({ duration: 180 });
      } else if (event.key === "0") {
        pristine.current = true;
        fitView({ ...FIT_VIEW_OPTIONS, duration: 300 });
      } else {
        const step = PAN_KEYS[event.key];
        if (!step) return;

        const { x, y, zoom } = getViewport();
        const distance = PAN_STEP * (event.shiftKey ? 4 : 1);
        pristine.current = false;
        setViewport({ x: x + step[0] * distance, y: y + step[1] * distance, zoom });
      }

      event.preventDefault();
    },
    [fitView, getViewport, setViewport, zoomIn, zoomOut],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={shownEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      // xyflow puts role="application" on the pane, which tells a screen
      // reader to hand every key over to the canvas. Naming it is the least a
      // canvas can do; the reference tables carry the content as real markup.
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      // A pointer gesture is the user taking over the viewport; a programmatic
      // move (the Fit button, a keyboard fit) passes no event.
      onMoveStart={(event) => {
        if (event) pristine.current = false;
      }}
      fitView
      fitViewOptions={FIT_VIEW_OPTIONS}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
      className="[&_.react-flow__pane]:cursor-grab"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="var(--color-dots)"
      />
      <Panel position="bottom-left" className="!m-6">
        <FlowControls
          onFit={() => {
            pristine.current = true;
          }}
          onZoom={() => {
            pristine.current = false;
          }}
        />
      </Panel>

      <Panel position="bottom-right" className="!m-6">
        <ExportButton />
      </Panel>

      {/* Views with lookups too long for the canvas hang them here. */}
    </ReactFlow>
  );
}

export type MapProps = {
  nodes: Node[];
  edges: Edge[];
  /** Accessible name for the canvas. */
  label: string;
};

export function MapCanvas({ nodes, edges, label }: MapProps) {
  return (
    <div className="absolute inset-0">
      <ReactFlowProvider>
        <Flow nodes={nodes} edges={edges} label={label} />
      </ReactFlowProvider>
    </div>
  );
}
