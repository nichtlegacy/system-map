import type { LucideIcon } from "lucide-react";

export type ServiceStatus =
  | "online"
  | "scheduled"
  | "idle"
  | "warning"
  | "offline";

export type NodeKind =
  | "service"
  | "cluster"
  | "primaryService"
  | "external"
  | "storage"
  | "infra"
  | "lane"
  | "stat"
  | "bars"
  | "artefact";

export type HandleSide = "top" | "right" | "bottom" | "left";

/**
 * One counted fact about a view: the number, then what it counts. Read out in
 * the header of a map and in the landing hero, from the same source.
 */
export type MetaStat = { value: string; label: string };

/** One label/value pair rendered in a node's metric row. */
export type Metric = {
  label: string;
  value: string;
};

/* -- Identity: hand-curated, changes rarely ---------------------------- */

export type ServiceIdentity = {
  name: string;
  category: string;
  description: string;
  host: string;
  /** Fallback glyph, used when the project has no published mark. */
  icon: LucideIcon;
  /** Path under /icons — the real logo, preferred when it exists. */
  logo?: string;
  /**
   * The same mark for the light theme, where one asset cannot serve both.
   * A vendor whose only mark is black (Apple, GitHub) disappears on the dark
   * canvas, and its white variant disappears on the light one — so `logo`
   * carries the dark-theme asset and this one the light-theme asset.
   */
  logoLight?: string;
  /** Satellite services drop the description and render at 120px. */
  compact?: boolean;
};

export type ExternalIdentity = Omit<ServiceIdentity, "host"> & {
  /** Replaces the default footer line, which reads "outside the host". */
  note?: string;
};

export type StorageIdentity = Omit<ServiceIdentity, "host"> & {
  path: string;
};

export type PrimaryIdentity = ServiceIdentity;

/**
 * One row of the table on the primary card. `group` becomes a column heading,
 * so the card renders whatever two groups the data happens to name.
 */
export type CardRow = {
  name: string;
  value: string;
  group: string;
};

/**
 * A labelled frame around a set of nodes.
 *
 *  - `network` — a shared network namespace
 *  - `cluster` — a stage of a pipeline, so an edge can attach to the group
 *  - `segment` — a routed network with its own address range
 */
export type GroupIdentity = {
  label: string;
  summary: string;
  width: number;
  height: number;
  variant: "network" | "cluster" | "segment";
};

export type HostIdentity = {
  name: string;
  role: string;
  icon: LucideIcon;
  width: number;
  height: number;
  /** Vendor mark under /public. Falls back to `icon` when the host has none. */
  mark?: string;
  /** The light-theme variant, for marks that only exist in one tone. */
  markLight?: string;
};

/* -- State: what a live source would provide -------------------------- */

export type ServiceState = {
  /**
   * A stage of a computation is not up or down, so status is optional. Every
   * card that represents a running service should still carry it.
   */
  status?: ServiceStatus;
  /** 2-4 values; rendered as one row, so keep labels short. */
  metrics: Metric[];
};

export type StorageState = ServiceState & {
  used: string;
  total: string;
  /** 0-1, drives the capacity bar. */
  fill: number;
};

/** Host facts carry a second line: the value, then what makes it up. */
export type HostStat = Metric & { detail?: string };

/** One listener on a host, and what answers on it. */
export type HostPort = {
  port: string;
  service: string;
};

export type HostState = {
  status: ServiceStatus;
  stats: HostStat[];
  /**
   * Open listeners. A list, not a stat — crammed into a value-and-detail pair
   * it reads as one long string, which is exactly what it is not.
   */
  ports?: HostPort[];
};

/* -- Node data (identity + state, merged) ------------------------------ */

export type ServiceNodeData = ServiceIdentity & ServiceState;
export type ExternalNodeData = ExternalIdentity & ServiceState;
export type StorageNodeData = StorageIdentity & StorageState;
export type PrimaryServiceState = ServiceState & {
  rows: CardRow[];
  /** Bottom-right of the card: version, live counts, whatever the card earns. */
  footer?: string;
};
export type PrimaryServiceNodeData = PrimaryIdentity & PrimaryServiceState;
export type InfraNodeData = HostIdentity & HostState;
export type GroupNodeData = GroupIdentity;
export type LaneNodeData = { label: string };

/* -- Computation node kinds -------------------------------------------- */

/**
 * A card whose body is one figure and the step that produced it. The other
 * maps carry configuration, which fits a metric row; a funnel carries one
 * number per stage and the delta from the last, and that is a different shape.
 */
export type StatIdentity = Omit<ServiceIdentity, "host"> & {
  /** The figure itself, already formatted — "790", "≈632", "+24". */
  figure: string;
  /** What the figure counts. Sits under it, never beside it. */
  unit: string;
  /** How this stage got from the last figure to this one. */
  delta?: string;
  /** One caveat the figure cannot carry on its own. */
  note?: string;
};

/**
 * One row of a ranked card: a name, the number a reader reads, and the number
 * the bar is drawn from. They can differ when the engine ranks terms by a
 * weight that means nothing to a visitor, so the
 * bar runs on `weight` and the text says `display`.
 */
export type BarRow = {
  label: string;
  /** Bar length, relative to the card's `scale`. */
  weight: number;
  /** The value as written. */
  display: string;
  /** Draws a ghost bar behind this one: the term's ceiling. */
  cap?: number;
  /** A term pinned at its cap is the point of the score card. */
  pinned?: boolean;
};

export type BarsIdentity = Omit<ServiceIdentity, "host"> & {
  rows: BarRow[];
  /** Bars are relative to this, never to the row maximum. */
  scale: number;
  /** Above the rows: what was queried against what was held. */
  eyebrow?: string;
  /** Below the rows, monospaced: the arithmetic the card claims. */
  footer?: string[];
  /**
   * Two lines for labels that are meaningful phrases rather than short names.
   */
  wrap?: boolean;
  /**
   * Rows without a bar. The explanation card is a list of four sentences the
   * engine wrote, and four bars of identical length beside them would be a
   * chart of nothing.
   */
  plain?: boolean;
  /** The 420px plate, for the one card a map is about. */
  primary?: boolean;
  height: number;
};

/**
 * Neither kind carries a `ServiceState`. A stage of a funnel is not up or
 * down, and a status dot on it would be the first thing on this map that means
 * nothing.
 */
export type StatNodeData = StatIdentity;
export type BarsNodeData = BarsIdentity;

/* -- Edges ------------------------------------------------------------- */

export type EdgeFlavor = "data" | "management" | "external";

export type FlowLink = {
  id: string;
  /** Stage in the pipeline, shown in the label and the legend. */
  stage?: number;
  source: string;
  target: string;
  sourceHandle: HandleSide;
  targetHandle: HandleSide;
  flavor: EdgeFlavor;
  label?: string;
  /** Overrides the perpendicular default when the geometry is tight. */
  labelSide?: "above" | "below" | "left" | "right";
  /** Fine nudge in flow pixels, for corridors too narrow for the midpoint. */
  labelNudge?: { x?: number; y?: number };
  /**
   * Overrides xyflow's default bend of 0.25. Two handles on the same side at
   * almost the same height produce an almost straight line; a higher value
   * gives that edge a sweep the eye can follow instead.
   */
  curvature?: number;
  bidirectional?: boolean;
};

/* -- Artefact node kind ------------------------------------------------ */

/**
 * A card whose body is the artefact itself.
 *
 * Use it when a map is about producing something visible — a report, a render,
 * a generated image. A metric row saying `800×480 · png` describes the output;
 * the output itself is the only thing that shows it.
 *
 * Deliberately small. The image box is one content width — 204 × 122 inside
 * the existing 232 × 200 plate — so no new card size enters the scale.
 *
 * One asset, not two. A picture of the output is the same picture in both
 * themes, and re-theming it would misstate what the system produced.
 */
export type ArtefactIdentity = Omit<ServiceIdentity, "host"> & {
  /** Path under `/public`. */
  src: string;
  /**
   * Written into the `img` so the browser reserves the right box before the
   * file lands, and so the aspect is a fact rather than a CSS guess.
   */
  intrinsic: { width: number; height: number };
};

export type ArtefactNodeData = ArtefactIdentity;
