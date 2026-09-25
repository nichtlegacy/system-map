"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";

import type { CardRow, PrimaryServiceNodeData } from "@/types/system-map";
import { Label, NodeHandles, Status } from "./primitives";

/**
 * The hub of the map. It earns its weight through size, surface and a real
 * table — the values are the whole point of this card, so they get columns and
 * a shared right edge instead of one crammed line.
 */
function RowTable({ rows }: { rows: CardRow[] }) {
  return (
    <div className="flex flex-col gap-[3px]">
      {rows.map((row) => (
        <div
          key={row.name}
          className="flex items-baseline justify-between gap-3"
        >
          <span className="truncate text-[10.5px] text-fg-2">{row.name}</span>
          <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-fg">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PrimaryServiceNodeComponent({
  data,
}: NodeProps<Node<PrimaryServiceNodeData>>) {
  // Two columns, headed by whatever the data groups its rows under.
  const groups = [...new Set(data.rows.map((row) => row.group))].slice(0, 2);

  return (
    <div className="flex h-[364px] w-[420px] flex-col rounded-card border border-line bg-surface px-5 py-4 transition-colors duration-150 hover:border-line-2 hover:bg-surface-2">
      <NodeHandles />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {data.logo && (
            <img
              src={data.logo}
              alt=""
              aria-hidden
              className="h-[22px] w-[22px] rounded-[4px] object-contain"
            />
          )}
          <span className="text-[19px] font-medium leading-[22px] tracking-[-0.01em] text-fg">
            {data.name}
          </span>
        </div>
        {data.status && <Status status={data.status} />}
      </div>

      <div className="mt-2 pl-[32px]">
        <Label>{data.category}</Label>
      </div>

      {/* headline numbers */}
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-3.5">
        {data.metrics.map((metric) => (
          <div key={metric.label}>
            <div className="font-mono text-[17px] leading-none tabular-nums text-fg">
              {metric.value}
            </div>
            <div className="mt-2">
              <Label>{metric.label}</Label>
            </div>
          </div>
        ))}
      </div>

      {/* the table itself, as two aligned columns */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 border-t border-line pt-3.5">
        {groups.map((group) => (
          <div key={group}>
            <div className="mb-2">
              <Label>{group}</Label>
            </div>
            <RowTable rows={data.rows.filter((row) => row.group === group)} />
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-line pt-2.5 font-mono text-[9.5px] text-fg-3">
        <span>{data.host}</span>
        {data.footer && <span>{data.footer}</span>}
      </div>
    </div>
  );
}

export const PrimaryServiceNode = memo(PrimaryServiceNodeComponent);
