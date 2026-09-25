"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";

import type { GroupNodeData } from "@/types/system-map";
import { NodeHandles } from "./primitives";

/**
 * A labelled frame around related nodes. Edges attach to the frame instead of
 * every card inside it, which is what keeps a ~30 node map readable.
 */
function GroupNodeComponent({ data }: NodeProps<Node<GroupNodeData>>) {
  // A dashed orange frame means a shared network namespace. A segment is a
  // routed network of its own, so it gets a solid frame one step brighter than
  // a pipeline stage — present, but not competing with the cards inside it.
  const border = {
    network: "border-dashed border-frame-network",
    cluster: "border-line-2",
    segment: "border-line-3",
  }[data.variant];

  return (
    <div
      className={`rounded-frame border ${border}`}
      style={{ width: data.width, height: data.height }}
    >
      <NodeHandles />
      <div
        data-frame-header
        className="flex items-baseline justify-between gap-4 px-4 py-3"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-fg-2">
          {data.label}
        </span>
        <span className="font-mono text-[9.5px] text-fg-3">{data.summary}</span>
      </div>
    </div>
  );
}

export const GroupNode = memo(GroupNodeComponent);
