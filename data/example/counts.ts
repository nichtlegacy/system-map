import type { EdgeFlavor } from "@/types/system-map";

import { artefacts, bars, external, links, primary, services, stats, storage } from "./topology";

const byFlavor = links.reduce(
  (counts, link) => ({ ...counts, [link.flavor]: counts[link.flavor] + 1 }),
  { data: 0, management: 0, external: 0 } as Record<EdgeFlavor, number>,
);

export const counts = {
  cards:
    artefacts.length + bars.length + external.length + services.length + stats.length + storage.length + 1,
  flows: links.length,
  byFlavor,
  primary: primary.name,
} as const;
