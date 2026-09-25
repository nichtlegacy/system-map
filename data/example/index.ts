import type { Edge, Node } from "@xyflow/react";

import type { FlowLink } from "@/types/system-map";

import { hostState, primaryState, serviceState, storageState } from "./state";
import { artefacts, bars, external, groups, hosts, lanes, links, primary, services, stats, storage } from "./topology";

const CARD = { width: 232, height: 200 } as const;

const laneNodes: Node[] = lanes.map(({ id, label, x, y }) => ({
  id,
  type: "lane",
  position: { x, y },
  data: { label },
  draggable: false,
  selectable: false,
}));

const groupNodes: Node[] = groups.map(({ id, position, ...data }) => ({
  id,
  type: "cluster",
  position,
  initialWidth: data.width,
  initialHeight: data.height,
  data,
  draggable: false,
  selectable: false,
  zIndex: -1,
}));

const hostNodes: Node[] = hosts.map(({ id, position, ...identity }) => ({
  id,
  type: "infra",
  position,
  initialWidth: identity.width,
  initialHeight: identity.height,
  data: { ...identity, ...hostState[id] },
  draggable: false,
  selectable: false,
  zIndex: -1,
}));

const externalNodes: Node[] = external.map(({ id, position, ...identity }) => ({
  id,
  type: "external",
  position,
  initialWidth: CARD.width,
  initialHeight: CARD.height,
  data: { ...identity, ...serviceState[id] },
}));

const serviceNodes: Node[] = services.map(({ id, position, ...identity }) => ({
  id,
  type: "service",
  position,
  initialWidth: CARD.width,
  initialHeight: CARD.height,
  data: { ...identity, ...serviceState[id] },
}));

const storageNodes: Node[] = storage.map(({ id, position, ...identity }) => ({
  id,
  type: "storage",
  position,
  initialWidth: CARD.width,
  initialHeight: CARD.height,
  data: { ...identity, ...storageState[id] },
}));

const statNodes: Node[] = stats.map(({ id, position, ...data }) => ({
  id,
  type: "stat",
  position,
  initialWidth: CARD.width,
  initialHeight: data.note ? 232 : 164,
  data,
}));

const barsNodes: Node[] = bars.map(({ id, position, ...data }) => ({
  id,
  type: "bars",
  position,
  initialWidth: CARD.width,
  initialHeight: data.height,
  data,
}));

const artefactNodes: Node[] = artefacts.map(({ id, position, ...data }) => ({
  id,
  type: "artefact",
  position,
  initialWidth: CARD.width,
  initialHeight: CARD.height,
  data,
}));

const { id: primaryId, position: primaryPosition, ...primaryIdentity } = primary;
const primaryNode: Node = {
  id: primaryId,
  type: "primaryService",
  position: primaryPosition,
  initialWidth: 420,
  initialHeight: 364,
  data: { ...primaryIdentity, ...primaryState },
};

export const flowNodes: Node[] = [
  ...groupNodes,
  ...hostNodes,
  ...laneNodes,
  ...externalNodes,
  ...serviceNodes,
  ...storageNodes,
  ...statNodes,
  ...barsNodes,
  ...artefactNodes,
  primaryNode,
];

const stroke = {
  data: "var(--color-edge-data)",
  management: "var(--color-edge-management)",
  external: "var(--color-edge-external)",
} as const;

const dash = { data: "5 5", management: "4 5", external: "3 8" } as const;

const toEdge = (link: FlowLink): Edge => ({
  id: link.id,
  source: link.source,
  target: link.target,
  type: "flow",
  data: {
    flavor: link.flavor,
    labelSide: link.labelSide,
    labelNudge: link.labelNudge,
    curvature: link.curvature,
  },
  sourceHandle: `s-${link.sourceHandle}`,
  targetHandle: `t-${link.targetHandle}`,
  className: `flavor-${link.flavor}`,
  animated: true,
  label: link.stage && link.label ? `${link.stage} · ${link.label}` : link.label,
  style: { stroke: stroke[link.flavor], strokeWidth: 1.2, strokeDasharray: dash[link.flavor] },
  markerEnd: {
    type: "arrowclosed" as const,
    width: 12,
    height: 12,
    color: stroke[link.flavor],
  },
});

export const flowEdges: Edge[] = links.map(toEdge);
