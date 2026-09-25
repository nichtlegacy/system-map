"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";

import type { HostPort, InfraNodeData } from "@/types/system-map";
import { Label, NodeHandles, NodeIcon, Status } from "./primitives";

/**
 * What is open on a public host is the first thing anyone wants to know about
 * it, so the listeners get their own strip rather than a corner of a stat.
 * One chip per port, the number in mono because it came off the machine and
 * the service beside it in prose because it did not.
 */
function Ports({ ports }: { ports: HostPort[] }) {
  return (
    <div className="flex items-center gap-3">
      <Label>Listening</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {ports.map((entry) => (
          <span
            key={entry.port}
            className="flex items-baseline gap-1.5 rounded-[5px] border border-line bg-surface px-1.5 py-[3px]"
          >
            <span className="font-mono text-[10px] tabular-nums text-fg">
              {entry.port}
            </span>
            <span className="text-[9.5px] text-fg-3">{entry.service}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Ambient frame grouping everything that runs on one host. Purely visual: not
 * a React Flow parent node, so child positions stay absolute and easy to
 * hand-tune. Handles are exposed so an edge can attach to the whole host
 * rather than fanning out to every card inside it.
 */
function InfraNodeComponent({ data }: NodeProps<Node<InfraNodeData>>) {
  return (
    <div
      className="rounded-frame border border-line"
      style={{ width: data.width, height: data.height }}
    >
      <NodeHandles />
      <div
        data-frame-header
        className="flex items-start justify-between gap-6 border-b border-line px-6 py-4"
      >
        {/* Identity, and directly under it whatever this host listens on. The
            ports belong to the name, so they sit in its column rather than in
            a full-width row of their own — which keeps the band compact. */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            {/* Use a supplied mark when one exists, otherwise the Lucide glyph. */}
            {data.mark ? (
              data.markLight ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.mark} alt="" className="dark-only h-[19px] w-auto shrink-0" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.markLight} alt="" className="light-only h-[19px] w-auto shrink-0" />
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.mark} alt="" className="h-[19px] w-auto shrink-0" />
              )
            ) : (
              <NodeIcon icon={data.icon} name={data.name} />
            )}
            <span className="text-[12px] font-medium uppercase tracking-[0.22em] text-fg">
              {data.name}
            </span>
            <Status status={data.status} />
            <span className="font-mono text-[10px] text-fg-3">{data.role}</span>
          </div>

          {data.ports && data.ports.length > 0 && <Ports ports={data.ports} />}
        </div>

        <div className="flex shrink-0 items-start gap-7">
          {data.stats.map((stat) => (
            <div key={stat.label} className="text-right">
              <Label>{stat.label}</Label>
              <div className="mt-1.5 font-mono text-[11.5px] tabular-nums text-fg">
                {stat.value}
              </div>
              {stat.detail && (
                <div className="mt-1 font-mono text-[9.5px] text-fg-3">
                  {stat.detail}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const InfraNode = memo(InfraNodeComponent);
