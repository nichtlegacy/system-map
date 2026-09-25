"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";

import type { StorageNodeData } from "@/types/system-map";
import { Card, CardHead, HostLine, Metrics } from "./primitives";

function StorageNodeComponent({ data }: NodeProps<Node<StorageNodeData>>) {
  return (
    <Card height={200}>
      <CardHead
        icon={data.icon}
        logo={data.logo}
        name={data.name}
        category={data.category}
      />

      {/* Occupies the same 32px slot as a description, so the metric row of a
          storage card lines up with every other card. */}
      <div className="mt-3 h-[32px] pl-[21px]">
        {data.fill > 0 ? (
          <>
            <div className="font-mono text-[10px] tabular-nums text-fg-2">
              {data.used}
              <span className="text-fg-3"> / {data.total}</span>
            </div>
            <div className="mt-2 h-[2px] w-full overflow-hidden bg-line-2">
              <div
                className="h-full bg-fg-3"
                style={{ width: `${Math.round(data.fill * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <div className="font-mono text-[10px] text-fg-3">directory</div>
        )}
      </div>

      <Metrics items={data.metrics} />
      <HostLine>{data.path}</HostLine>
    </Card>
  );
}

export const StorageNode = memo(StorageNodeComponent);
