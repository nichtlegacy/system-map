"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";

import type { LaneNodeData } from "@/types/system-map";
import { Label } from "./primitives";

function LaneNodeComponent({ data }: NodeProps<Node<LaneNodeData>>) {
  return (
    <div className="whitespace-nowrap">
      <Label>{data.label}</Label>
    </div>
  );
}

export const LaneNode = memo(LaneNodeComponent);
