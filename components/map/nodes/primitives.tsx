import { Handle, Position } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";

import type { Metric, ServiceStatus } from "@/types/system-map";

const SIDES = [
  ["top", Position.Top],
  ["right", Position.Right],
  ["bottom", Position.Bottom],
  ["left", Position.Left],
] as const;

/**
 * Every node exposes an invisible source + target handle on all four sides so
 * edges can be routed by hand for the cleanest possible picture.
 */
export function NodeHandles() {
  return (
    <>
      {SIDES.map(([side, position]) => (
        <span key={side}>
          <Handle
            id={`s-${side}`}
            type="source"
            position={position}
            className="!h-1 !w-1 !border-0 !bg-transparent"
            isConnectable={false}
          />
          <Handle
            id={`t-${side}`}
            type="target"
            position={position}
            className="!h-1 !w-1 !border-0 !bg-transparent"
            isConnectable={false}
          />
        </span>
      ))}
    </>
  );
}

export function NodeIcon({
  icon: Icon,
  logo,
  logoLight,
  name,
}: {
  icon: LucideIcon;
  logo?: string;
  logoLight?: string;
  name?: string;
}) {
  const mark = "mt-[1px] h-[15px] w-[15px] shrink-0 rounded-[3px] object-contain";

  if (logo) {
    // Two assets only where one cannot serve both themes: Apple and GitHub
    // publish a black mark and a white one, and either is invisible on the
    // wrong canvas. The theme classes come from globals.css.
    return logoLight ? (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" aria-hidden title={name} className={`dark-only ${mark}`} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoLight} alt="" aria-hidden title={name} className={`light-only ${mark}`} />
      </>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt="" aria-hidden title={name} className={mark} />
    );
  }

  return (
    <Icon
      strokeWidth={1.5}
      className="mt-[1px] h-[13px] w-[13px] shrink-0 text-fg-3"
    />
  );
}

/** Small-caps structural label — used for categories and lanes. */
export function Label({ children }: { children: string }) {
  return (
    <span className="text-[9.5px] font-medium uppercase tracking-[0.14em] text-fg-3">
      {children}
    </span>
  );
}

/** Colour is paired with the written state, never carrying it alone. */
export function Status({ status }: { status: ServiceStatus }) {
  const tone = {
    online: "bg-success",
    scheduled: "border border-fg-3",
    idle: "bg-line-3",
    warning: "bg-amber-500",
    offline: "bg-red-500",
  }[status];

  const label = {
    online: "Online",
    scheduled: "Scheduled",
    idle: "Idle",
    warning: "Warning",
    offline: "Offline",
  }[status];

  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <span className={`h-[5px] w-[5px] rounded-full ${tone}`} />
      <span className="text-[10px] text-fg-2">{label}</span>
    </span>
  );
}

/** Name, category and state — identical geometry in every card type. */
export function CardHead({
  icon,
  logo,
  logoLight,
  name,
  category,
  status,
  large,
  compact,
}: {
  icon: LucideIcon;
  logo?: string;
  logoLight?: string;
  name: string;
  category: string;
  status?: ServiceStatus;
  large?: boolean;
  /**
   * On a 116px card the status word costs the name ~50px, which is the
   * difference between "activitywatch-insights" fitting and being cut. It
   * moves down beside the category instead — the state stays written, because
   * colour never carries it alone.
   */
  compact?: boolean;
}) {
  return (
    <>
      <div className="flex h-[15px] items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <NodeIcon icon={icon} logo={logo} logoLight={logoLight} name={name} />
          <span
            className={`truncate font-medium leading-[15px] text-fg ${
              large ? "text-[17px]" : "text-[13px]"
            }`}
          >
            {name}
          </span>
        </div>
        {status && !compact && <Status status={status} />}
      </div>
      <div className="mt-2 flex h-[12px] items-center justify-between gap-2 pl-[21px]">
        {/* min-w-0 so a long category truncates instead of wrapping the row
            open — the block is a fixed 12px so every card below it lines up. */}
        <span className="min-w-0 truncate">
          <Label>{category}</Label>
        </span>
        {status && compact && <Status status={status} />}
      </div>
    </>
  );
}

/** Fixed two-line block, so every card below it starts at the same y. */
export function CardBody({ children }: { children: string }) {
  return (
    <p className="mt-3 h-[32px] overflow-hidden pl-[21px] text-[11.5px] leading-[16px] text-fg-2">
      {children}
    </p>
  );
}

/**
 * Label left, value right, one per row. Columns were the wrong shape here:
 * three 60px slots truncate anything longer than a short name, and short values
 * float in dead space. A row gets the full card width and always aligns.
 */
export function Metrics({ items, rows = 3 }: { items: Metric[]; rows?: number }) {
  const slots = [
    ...items.slice(0, rows),
    ...Array(Math.max(0, rows - items.length)).fill(null),
  ];

  return (
    <div
      data-metrics
      className="mt-3 flex flex-col gap-[5px] border-t border-line pt-2.5"
    >
      {slots.map((metric, i) => (
        <div
          key={metric?.label ?? `empty-${i}`}
          className="flex h-[13px] items-baseline justify-between gap-3"
        >
          {metric && (
            <>
              <span className="shrink-0 text-[9px] font-medium uppercase tracking-[0.1em] text-fg-3">
                {metric.label}
              </span>
              <span className="truncate font-mono text-[11px] leading-none tabular-nums text-fg">
                {metric.value}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function HostLine({ children }: { children: string }) {
  return (
    <div className="mt-auto truncate pt-2.5 font-mono text-[9.5px] text-fg-3">
      {children}
    </div>
  );
}

/** Shared shell: one border, one surface, one radius, one hover. */
export function Card({
  children,
  height,
  variant = "solid",
  width = 232,
}: {
  children: React.ReactNode;
  height: number;
  variant?: "solid" | "dashed" | "raised";
  width?: number;
}) {
  const skin = {
    solid: "border-line bg-surface hover:border-line-2 hover:bg-surface-2",
    // bg-canvas rather than no fill: identical on the canvas, but it keeps the
    // card from becoming a hole in an export with the background switched off.
    dashed: "border-dashed border-line-2 bg-canvas hover:border-line-3",
    raised: "border-line-2 bg-contrast hover:border-line-3",
  }[variant];

  return (
    <div
      className={`flex flex-col rounded-card border px-3.5 pb-3 pt-3 transition-colors duration-150 ${skin}`}
      style={{ width, height }}
    >
      <NodeHandles />
      {children}
    </div>
  );
}
