import type { TraceStep } from "./traces";

/**
 * The vendor's mark where one exists, its light-theme twin where one asset
 * cannot serve both canvases, and a line glyph where the software publishes
 * nothing — the same three cases `NodeIcon` handles on the cards.
 */
function StepMark({ step }: { step: TraceStep }) {
  if (step.logo && step.logoLight) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={step.logo} alt={step.alt} className="dark-only h-4 w-4" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={step.logoLight} alt="" aria-hidden className="light-only h-4 w-4" />
      </>
    );
  }
  if (step.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={step.logo} alt={step.alt} className="h-4 w-4" />;
  }
  const Icon = step.icon;
  return Icon ? (
    <Icon aria-label={step.alt} strokeWidth={1.5} className="h-4 w-4 text-fg-2" />
  ) : null;
}

/**
 * One map, flattened to the single path through it: the steps in order, the
 * handoff named on the wire between them.
 *
 * Numbered because it genuinely is a sequence — step five cannot happen before
 * step four. Wide on purpose, and it scrolls sideways rather than wrapping:
 * a path that wraps stops looking like a path.
 *
 * Three things make that scroll behave on a phone. It snaps to a step, so a
 * swipe lands on a station rather than between two; `overscroll-x-contain`
 * stops the swipe chaining into the page once the end is reached, which is
 * what made the whole document slide sideways under a finger; and the pitch
 * drops from 116px to 104 below `sm`, which is one more step on screen for
 * every trace.
 */
export function Spine({
  trace,
  label,
}: {
  trace: TraceStep[];
  /** Accessible name for the sequence. */
  label: string;
}) {
  const n = trace.length;

  return (
    <div className="-mx-6 snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-6 pb-2 sm:mx-0 sm:snap-none sm:px-0 lg:overflow-visible">
      <div
        className="relative pt-8 [--pitch:104px] sm:[--pitch:116px]"
        style={{ minWidth: `calc(${n} * var(--pitch))` }}
      >
        <div className="absolute inset-x-0 top-[50px] h-px bg-line-2" />

        {/* the handoff label sits beside the wire, tied to it by a tick */}
        {trace.slice(0, -1).map((step, i) => (
          <span
            key={step.name}
            style={{ left: `${((i + 1) / n) * 100}%` }}
            className="absolute top-6 -translate-x-1/2"
          >
            <span className="font-mono text-[11px] text-fg-2">
              {step.handoff}
            </span>
            <span
              aria-hidden
              className="absolute left-1/2 top-full h-[10px] w-px bg-line-2"
            />
          </span>
        ))}

        <ol
          aria-label={label}
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          {trace.map((step, i) => (
            <li
              key={step.name}
              className="group flex snap-start flex-col items-center px-2 text-center"
            >
              <span className="bezel flex h-9 w-9 items-center justify-center rounded-[11px] bg-canvas transition-colors duration-500 ease-fluid group-hover:bg-surface-2">
                <StepMark step={step} />
              </span>
              <span className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-[11px] tabular-nums text-line-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[13px] font-medium text-fg">
                  {step.name}
                </span>
              </span>
              <span className="mt-1 text-[11.5px] leading-[1.5] text-fg-3">
                {step.who}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
