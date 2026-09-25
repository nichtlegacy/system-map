import { FlowEdge } from "./FlowEdge";
import { ArtefactNode } from "./nodes/ArtefactNode";
import { BarsNode } from "./nodes/BarsNode";
import { ExternalNode } from "./nodes/ExternalNode";
import { GroupNode } from "./nodes/GroupNode";
import { InfraNode } from "./nodes/InfraNode";
import { LaneNode } from "./nodes/LaneNode";
import { PrimaryServiceNode } from "./nodes/PrimaryServiceNode";
import { ServiceNode } from "./nodes/ServiceNode";
import { StatNode } from "./nodes/StatNode";
import { StorageNode } from "./nodes/StorageNode";

/**
 * The card and wire vocabulary, in one place: the interactive canvas and the
 * landing hero's read-only one draw from the same registry, so a card can
 * never look like one thing on the map and another on the front page.
 */
export const nodeTypes = {
  service: ServiceNode,
  primaryService: PrimaryServiceNode,
  external: ExternalNode,
  storage: StorageNode,
  infra: InfraNode,
  cluster: GroupNode,
  lane: LaneNode,
  // Computation nodes carry one figure per stage or ranked rows.
  stat: StatNode,
  bars: BarsNode,
  // A card whose body is the output itself: a report, a render, an image.
  artefact: ArtefactNode,
};

export const edgeTypes = { flow: FlowEdge };
