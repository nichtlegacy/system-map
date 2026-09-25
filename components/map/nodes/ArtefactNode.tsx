"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";

import type { ArtefactNodeData } from "@/types/system-map";
import { Card, CardHead } from "./primitives";

/**
 * The thing itself, on the 232 × 200 plate every service card uses.
 *
 * Three sizes decide this card. The plate is 232 and its padding is 14 either
 * side, so the image box is **204** wide; at a 5:3 aspect,
 * that is **122** tall; and 12 (top) + 35 (head) + 12 (gap) + 124 (box and its
 * hairline) = 183, which fits 200 with the card's own bottom padding. No new
 * width, no new height, no new type size — the only new thing is that the body
 * is a picture instead of a paragraph.
 *
 * The box is square-cornered. `design.md`: a shape nested inside another with
 * less than 32px between them takes the outer radius minus the gap, and 8 − 14
 * is not a radius.
 *
 * `object-contain`, not `cover`. An output with another aspect letterboxes
 * rather than being cropped, so the card never shows less than was produced.
 */
function ArtefactNodeComponent({ data }: NodeProps<Node<ArtefactNodeData>>) {
  return (
    <Card height={200}>
      <CardHead icon={data.icon} name={data.name} category={data.category} />

      <div className="mt-3 overflow-hidden border border-line bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.src}
          alt={data.description}
          width={data.intrinsic.width}
          height={data.intrinsic.height}
          loading="lazy"
          decoding="async"
          className="block h-[122px] w-full object-contain"
        />
      </div>
    </Card>
  );
}

export const ArtefactNode = memo(ArtefactNodeComponent);
