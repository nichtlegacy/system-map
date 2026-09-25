"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type SegmentedItem<T extends string> = {
  id: T;
  label: string;
  /** Drawn before the label, at the same size everywhere the view is named. */
  icon?: ReactNode;
  /** Second line inside the segment, for a control that names a consequence. */
  hint?: string;
};

/**
 * One track, one thumb, one selection — the same control the header switcher
 * uses, generalised for the panels.
 *
 * The thumb is measured rather than fractioned: these labels are as long as
 * the things they name ("api.example.com" beside "jobs"), so equal
 * columns would either clip the long one or strand the short one in whitespace.
 * Measuring lets each segment be its own width and the thumb still land on it
 * exactly.
 */
export function Segmented<T extends string>({
  items,
  active,
  onChange,
  label,
  tabs = false,
  size = "sm",
  wrap = false,
  className = "",
}: {
  items: SegmentedItem<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Accessible name for the group. */
  label: string;
  /** Render as a tablist rather than a set of toggles. */
  tabs?: boolean;
  /** `md` for a control that carries a page, `sm` for one inside a panel. */
  size?: "sm" | "md";
  /**
   * Let the track wrap onto more than one row when the viewport is narrow.
   *
   * Left on one row, a long track pushes the page sideways and the last
   * options have to be swiped for — off the edge of the document, not inside
   * the control. A
   * selector that hides its options is not a selector, so on small screens it
   * wraps and every option is on screen at once.
   */
  wrap?: boolean;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<
    { left: number; top: number; width: number; height: number } | null
  >(null);

  useLayoutEffect(() => {
    const measure = () => {
      const element = track.current?.querySelector<HTMLElement>(
        `[data-segment="${active}"]`,
      );
      if (element) {
        // Four numbers rather than two: once the track can wrap, the selected
        // segment moves down as well as across and `inset-y-1` would stretch
        // the thumb over every row.
        setThumb({
          left: element.offsetLeft,
          top: element.offsetTop,
          width: element.offsetWidth,
          height: element.offsetHeight,
        });
      }
    };

    measure();

    // Fonts land after first paint and change every label's width.
    const observer = new ResizeObserver(measure);
    if (track.current) observer.observe(track.current);
    return () => observer.disconnect();
  }, [active, items]);

  return (
    <div
      ref={track}
      role={tabs ? "tablist" : "group"}
      aria-label={label}
      className={`well switch-track relative flex items-stretch p-1 ${
        wrap
          ? "w-full flex-wrap gap-y-1 rounded-3xl sm:w-max sm:flex-nowrap sm:gap-y-0 sm:rounded-full"
          : "rounded-full"
      } ${className}`}
    >
      {thumb && (
        <span
          aria-hidden
          style={{
            left: thumb.left,
            top: thumb.top,
            width: thumb.width,
            height: thumb.height,
          }}
          className="switch-thumb absolute rounded-full transition-[left,top,width,height] duration-500 ease-fluid"
        />
      )}

      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            data-segment={item.id}
            role={tabs ? "tab" : undefined}
            aria-selected={tabs ? isActive : undefined}
            aria-pressed={tabs ? undefined : isActive}
            onClick={() => onChange(item.id)}
            className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full transition-colors duration-300 ease-fluid focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent active:scale-[0.98] ${
              isActive ? "text-fg" : "text-fg-3 hover:text-fg-2"
            } ${
              size === "md" ? "h-8 px-3.5 text-[12.5px]" : "h-6 px-2.5 text-[11px]"
            }`}
          >
            {item.icon}
            {item.label}
            {item.hint && (
              <span className="font-mono text-[9.5px] text-line-3">
                {item.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
