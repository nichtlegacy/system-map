"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";

import type { BarRow, BarsNodeData } from "@/types/system-map";
import { Card, CardHead, Label, NodeHandles } from "./primitives";

/**
 * A ranked card: label, value, and a bar the length of the value.
 *
 * Greyscale, always. The one accent on this site means "leaves the machine"
 * and nothing else, and a bar chart is the first thing that would take colour
 * back if it were allowed to — so the fill is `--color-line-3` and the ghost
 * behind it, where a term has a ceiling, is `--color-line`. The number is
 * written on every row regardless: the bar is a second reading of a value that
 * is already there, never the only one.
 *
 * One component, two jobs. The five profile cards are bars without caps; the
 * score card is bars with a cap on nearly every row plus a footer band, which
 * is what earns it the 420 x 364 slot instead of a third node kind.
 */
function Row({
  row,
  scale,
  wrap,
  plain,
}: {
  row: BarRow;
  scale: number;
  wrap?: boolean;
  plain?: boolean;
}) {
  const pct = (value: number) => `${Math.min(100, (value / scale) * 100)}%`;

  return (
    <div>
      <div className={`flex gap-3 ${wrap ? "items-start" : "items-baseline"}`}>
        <span
          className={`min-w-0 flex-1 text-[10.5px] leading-[14px] text-fg-2 ${
            wrap ? "line-clamp-2 h-[28px]" : "truncate"
          }`}
        >
          {row.label}
        </span>
        <span
          className={`shrink-0 font-mono text-[10.5px] tabular-nums ${
            row.pinned ? "text-fg" : "text-fg-2"
          }`}
        >
          {row.display}
        </span>
      </div>

      {!plain && (
      <div className="relative mt-1.5 h-[3px] w-full rounded-full bg-line">
        {/* The ceiling, where the term has one. Drawn first so the value sits
            on top of it and the gap between them is the headroom left. */}
        {row.cap !== undefined && (
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-full bg-line-2"
            style={{ width: pct(row.cap) }}
          />
        )}
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 rounded-full ${
            row.pinned ? "bg-fg-3" : "bg-line-3"
          }`}
          style={{ width: pct(row.weight) }}
        />
      </div>
      )}
    </div>
  );
}

function BarsNodeComponent({ data }: NodeProps<Node<BarsNodeData>>) {
  const rows = (
    <div className="flex flex-col gap-2.5">
      {data.rows.map((row) => (
        <Row
          key={row.label}
          row={row}
          scale={data.scale}
          wrap={data.wrap}
          plain={data.plain}
        />
      ))}
    </div>
  );

  if (!data.primary) {
    return (
      <Card height={data.height}>
        <CardHead
          icon={data.icon}
          logo={data.logo}
          name={data.name}
          category={data.category}
        />
        {data.eyebrow && (
          <div className="mt-3 font-mono text-[9.5px] text-fg-3">
            {data.eyebrow}
          </div>
        )}
        <div className="mt-3 border-t border-line pt-3">{rows}</div>
      </Card>
    );
  }

  // The one card the map is about, in the same 420 x 364 plate the other maps
  // give their primary service — same border, same surface, same radius.
  return (
    <div
      className="flex h-[364px] w-[420px] flex-col rounded-card border border-line bg-surface px-5 py-4 transition-colors duration-150 hover:border-line-2 hover:bg-surface-2"
      style={{ height: data.height }}
    >
      <NodeHandles />

      <div className="flex items-start justify-between gap-3">
        <span className="text-[19px] font-medium leading-[22px] tracking-[-0.01em] text-fg">
          {data.name}
        </span>
        {data.eyebrow && (
          <span className="shrink-0 font-mono text-[17px] leading-[22px] tabular-nums text-fg">
            {data.eyebrow}
          </span>
        )}
      </div>

      <div className="mt-2">
        <Label>{data.category}</Label>
      </div>

      <div className="mt-4 border-t border-line pt-3.5">{rows}</div>

      {data.footer && (
        <div className="mt-auto flex flex-col gap-1 border-t border-line pt-2.5 font-mono text-[10px] leading-[14px] text-fg-3">
          {data.footer.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export const BarsNode = memo(BarsNodeComponent);
