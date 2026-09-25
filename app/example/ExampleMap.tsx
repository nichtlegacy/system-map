"use client";

import { MapCanvas } from "@/components/map/MapCanvas";
import { flowEdges, flowNodes } from "@/data/example";
import { counts } from "@/data/example/counts";

export function ExampleMap() {
  return (
    <MapCanvas
      nodes={flowNodes}
      edges={flowEdges}
      label={`Fictional system diagram with ${counts.cards} cards and ${counts.flows} flows.`}
    />
  );
}
