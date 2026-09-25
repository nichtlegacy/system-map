"use client";

import type { ReactNode } from "react";

import type { EdgeFlavor } from "@/types/system-map";
import { useEdgeFilter } from "./EdgeFilter";

export type LegendItem = {
  label: string;
  flavor: EdgeFlavor;
  /** How many wires of this kind the map draws. */
  count: number;
};

/** The three strokes the canvas draws, at legend size. */
/**
 * The key draws the wire it stands for: its colour, and its dashes scaled to
 * fit 18px so the character still reads — media and control the same short
 * stitch in two colours, external dots set wide. Solid tokens rather than the canvas
 * ones, which carry the alpha that lets them sit under the cards and would be
 * near invisible at this size.
 */
const KEY = {
  data: { stroke: "var(--color-media)", dash: "3.5 3.5" },
  management: { stroke: "var(--color-fg-2)", dash: "3 3" },
  external: { stroke: "var(--color-accent)", dash: "2 4" },
} as const;

function Sample({ flavor, state }: { flavor: EdgeFlavor; state: string }) {
  const { stroke, dash } = KEY[flavor];

  return (
    <svg
      viewBox="0 0 26 8"
      aria-hidden
      className={`h-2 w-[26px] shrink-0 overflow-visible transition-opacity duration-300 ease-fluid ${
        state === "dim" ? "opacity-30" : "opacity-100"
      }`}
    >
      <path
        d="M0 4h18"
        stroke={stroke}
        strokeWidth={state === "lit" ? 2 : 1.2}
        strokeDasharray={dash}
        className="transition-[stroke-width] duration-300 ease-fluid"
      />
      {/* the arrowhead, because that is what the canvas puts on the end */}
      <path
        d="M18 1.4 22.6 4 18 6.6Z"
        fill={stroke}
        className="transition-opacity duration-300 ease-fluid"
      />
    </svg>
  );
}

/**
 * The bottom rail: whatever the view wants to say on the left, the line key on
 * the right.
 *
 * The key is not a caption — it is how you read the map. Point at an entry, or
 * tab to it, and that kind of wire lights up while the rest of the diagram
 * steps back; take the pointer away and the map is whole again. Nothing to
 * click and nothing to undo: the highlight is a look, not a setting. Each
 * entry draws its own stroke and arrowhead exactly as the canvas draws them,
 * and says how many of them there are.
 */
export function AppFooter({
  children,
  legend = [],
}: {
  children?: ReactNode;
  legend?: LegendItem[];
}) {
  const { stateOf, hover } = useEdgeFilter();

  return (
    <footer className="flex h-11 shrink-0 items-center justify-between gap-6 px-3 sm:px-4">
      <div className="min-w-0 truncate">{children}</div>

      {legend.length > 0 && (
        <div
          className="flex shrink-0 items-center gap-1"
          onMouseLeave={() => hover(null)}
        >
          {legend.map((item) => {
            const state = stateOf(item.flavor);

            return (
              <span
                key={item.label}
                tabIndex={0}
                title={`${item.count} of them on this map`}
                onMouseEnter={() => hover(item.flavor)}
                onFocus={() => hover(item.flavor)}
                onBlur={() => hover(null)}
                className="flex h-8 cursor-default items-center gap-2.5 rounded-full px-2.5 transition-colors duration-300 ease-fluid hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Sample flavor={item.flavor} state={state} />
                <span
                  className={`text-[11.5px] transition-colors duration-300 ease-fluid ${
                    state === "dim" ? "text-fg-3" : "text-fg-2"
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`font-mono text-[10px] tabular-nums transition-colors duration-300 ease-fluid ${
                    state === "dim" ? "text-line-3" : "text-fg-3"
                  }`}
                >
                  {item.count}
                </span>
              </span>
            );
          })}

        </div>
      )}
    </footer>
  );
}
