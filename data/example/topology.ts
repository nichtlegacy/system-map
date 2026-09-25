import {
  Activity,
  Archive,
  BarChart3,
  Cloud,
  Cpu,
  Database,
  FileImage,
  Gauge,
  Server,
  Workflow,
} from "lucide-react";

import type {
  ArtefactIdentity,
  BarsIdentity,
  ExternalIdentity,
  FlowLink,
  GroupIdentity,
  HostIdentity,
  PrimaryIdentity,
  ServiceIdentity,
  StatIdentity,
  StorageIdentity,
} from "@/types/system-map";
import { asset } from "@/data/site";

type Placed<T> = T & { id: string; position: { x: number; y: number } };

export const lanes = [
  { id: "lane-entry", label: "1 · Entry", x: 0, y: 24 },
  { id: "lane-edge", label: "2 · Edge", x: 360, y: 24 },
  { id: "lane-process", label: "3 · Processing", x: 880, y: 24 },
  { id: "lane-core", label: "4 · Core", x: 1560, y: 24 },
  { id: "lane-store", label: "5 · Storage", x: 2120, y: 24 },
];

export const groups: Placed<GroupIdentity>[] = [
  {
    id: "group-processing",
    position: { x: 880, y: 80 },
    label: "Processing",
    summary: "worker · queue · health",
    width: 560,
    height: 680,
    variant: "cluster",
  },
];

export const hosts: Placed<HostIdentity>[] = [
  {
    id: "host-edge",
    position: { x: 360, y: 80 },
    name: "Edge host",
    role: "Public boundary",
    icon: Server,
    width: 440,
    height: 424,
  },
];

export const external: Placed<ExternalIdentity>[] = [
  {
    id: "client",
    position: { x: 0, y: 240 },
    name: "Example client",
    category: "External caller",
    description: "Sends one request into the fictional system.",
    note: "api.example.com",
    icon: Cloud,
  },
];

export const services: Placed<ServiceIdentity>[] = [
  {
    id: "api",
    position: { x: 464, y: 240 },
    name: "Request API",
    category: "Validation · routing",
    description: "Checks the payload and creates one durable job.",
    host: "192.0.2.10:443",
    icon: Workflow,
  },
  {
    id: "worker",
    position: { x: 920, y: 240 },
    name: "Worker",
    category: "Background process",
    description: "Claims a job, performs the work, and records its result.",
    host: "2001:db8::10",
    icon: Cpu,
  },
];

export const primary: Placed<PrimaryIdentity> = {
  id: "orchestrator",
  position: { x: 1560, y: 158 },
  name: "Orchestrator",
  category: "The system's decision point",
  description: "Moves accepted work through one explicit state transition.",
  host: "service · example",
  icon: Gauge,
};

export const storage: Placed<StorageIdentity>[] = [
  {
    id: "archive",
    position: { x: 2120, y: 240 },
    name: "Archive",
    category: "Object storage",
    description: "Keeps the completed output.",
    path: "s3://example-output",
    icon: Archive,
  },
];

export const stats: Placed<StatIdentity>[] = [
  {
    id: "accepted",
    position: { x: 920, y: 520 },
    name: "Accepted",
    category: "Current sample",
    description: "A derived count for the example.",
    figure: "24",
    unit: "jobs",
    delta: "+6 this hour",
    icon: Activity,
  },
];

export const bars: Placed<BarsIdentity>[] = [
  {
    id: "queue-health",
    position: { x: 1180, y: 520 },
    name: "Queue health",
    category: "Last 15 minutes",
    description: "A compact ranked reading.",
    icon: BarChart3,
    height: 184,
    scale: 100,
    rows: [
      { label: "Completed", weight: 84, display: "84%" },
      { label: "Waiting", weight: 12, display: "12%" },
      { label: "Failed", weight: 4, display: "4%" },
    ],
  },
];

export const artefacts: Placed<ArtefactIdentity>[] = [
  {
    id: "report",
    position: { x: 2120, y: 520 },
    name: "Daily report",
    category: "Rendered output",
    description: "A bar chart of the day's completed objects, one bar per two hours.",
    src: asset("/artefacts/example-report.svg"),
    intrinsic: { width: 800, height: 480 },
    icon: FileImage,
  },
];

export const links: FlowLink[] = [
  {
    id: "client-api",
    stage: 1,
    source: "client",
    target: "api",
    sourceHandle: "right",
    targetHandle: "left",
    flavor: "external",
    label: "HTTPS",
    // Into the gap before the edge host, not across its border.
    labelNudge: { x: -52 },
  },
  {
    id: "api-worker",
    stage: 2,
    source: "api",
    target: "worker",
    sourceHandle: "right",
    targetHandle: "left",
    flavor: "data",
    label: "job",
    // Inside the edge host, between the API and the frame's right border.
    labelNudge: { x: -60, y: -18 },
  },
  {
    id: "worker-orchestrator",
    stage: 3,
    source: "worker",
    target: "orchestrator",
    sourceHandle: "right",
    targetHandle: "left",
    flavor: "data",
    label: "result",
    labelNudge: { y: -18 },
  },
  {
    id: "worker-accepted",
    source: "worker",
    target: "accepted",
    sourceHandle: "bottom",
    targetHandle: "top",
    flavor: "management",
    label: "count",
    labelSide: "right",
  },
  {
    id: "health-orchestrator",
    source: "queue-health",
    target: "orchestrator",
    sourceHandle: "right",
    targetHandle: "bottom",
    flavor: "management",
    label: "health",
    labelSide: "below",
    labelNudge: { y: 16 },
  },
  {
    id: "orchestrator-archive",
    stage: 4,
    source: "orchestrator",
    target: "archive",
    sourceHandle: "right",
    targetHandle: "left",
    flavor: "data",
    label: "write",
  },
  {
    id: "archive-report",
    source: "archive",
    target: "report",
    sourceHandle: "bottom",
    targetHandle: "top",
    flavor: "data",
    label: "render",
    labelSide: "right",
  },
];
