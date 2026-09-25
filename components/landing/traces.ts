import { Archive, Cloud, Cpu, FileImage, Gauge, Workflow, type LucideIcon } from "lucide-react";

import { artefacts, external, primary, services, storage } from "@/data/example/topology";

export type TraceStep = {
  name: string;
  /** Who does this step, named as the cards name themselves. */
  who: string;
  /** A mark under /public, where the software publishes one. */
  logo?: string;
  /** The light-theme variant, for a mark that only exists in one tone. */
  logoLight?: string;
  /** Fallback glyph, for a step with no mark of its own. */
  icon?: LucideIcon;
  alt: string;
  /** What is handed to the next step. The last step hands on nothing. */
  handoff: string | null;
};

const named = (id: string) =>
  [...external, ...services, ...storage, ...artefacts, primary].find((card) => card.id === id)
    ?.name ?? id;

/**
 * The example map reduced to its spine: one request from the caller to the
 * rendered report. Card names come from the topology, so renaming a card
 * renames its step here too.
 */
export const exampleTrace: TraceStep[] = [
  { name: "Entry", who: named("client"), icon: Cloud, alt: "Client", handoff: "HTTPS" },
  { name: "Edge", who: named("api"), icon: Workflow, alt: "API", handoff: "job" },
  { name: "Work", who: named("worker"), icon: Cpu, alt: "Worker", handoff: "result" },
  { name: "Decide", who: named("orchestrator"), icon: Gauge, alt: "Orchestrator", handoff: "write" },
  { name: "Store", who: named("archive"), icon: Archive, alt: "Archive", handoff: "render" },
  { name: "Show", who: named("report"), icon: FileImage, alt: "Report", handoff: null },
];
