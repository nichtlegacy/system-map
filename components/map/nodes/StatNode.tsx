"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";

import type { StatNodeData } from "@/types/system-map";
import { Card, CardHead, Label } from "./primitives";

/**
 * One stage of the funnel: the figure it left behind, and the step that got it
 * there.
 *
 * The other maps put numbers in a metric row, which is right for three
 * configuration values and wrong for one headline count — a `11px` value in a
 * row of three reads as a setting, and these are the whole content of the
 * card. The figure takes the `19px` mono size the primary cards already use
 * for their headline numbers, so no new size enters the scale.
 */
function StatNodeComponent({ data }: NodeProps<Node<StatNodeData>>) {
  return (
    <Card height={data.note ? 232 : 164}>
      <CardHead
        icon={data.icon}
        logo={data.logo}
        name={data.name}
        category={data.category}
      />

      <div className="mt-4 pl-[21px]">
        <div className="font-mono text-[19px] leading-none tabular-nums text-fg">
          {data.figure}
        </div>
        <div className="mt-2">
          <Label>{data.unit}</Label>
        </div>
      </div>

      {data.delta && (
        <div className="mt-3 border-t border-line pt-2.5 font-mono text-[10.5px] leading-[15px] text-fg-2">
          {data.delta}
        </div>
      )}

      {data.note && (
        <p className="mt-auto pt-2.5 text-[10.5px] leading-[15px] text-fg-3">
          {data.note}
        </p>
      )}
    </Card>
  );
}

export const StatNode = memo(StatNodeComponent);
