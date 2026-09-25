"use client";

import { useEffect, useRef, useState } from "react";

import { ExportPanel } from "./ExportPanel";

/** Bottom-right: the panel opens above the button and closes on any click outside. */
export function ExportButton() {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!wrapper.current?.contains(event.target as globalThis.Node)) {
        setOpen(false);
      }
    };

    // Capture phase: the flow pane stops mousedown from bubbling, so a
    // listener on the bubble phase never sees a click on the canvas.
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("touchstart", onPointerDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("touchstart", onPointerDown, true);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="flex flex-col items-end gap-3">
      {open && <ExportPanel onClose={() => setOpen(false)} />}

      <button
        type="button"
        aria-expanded={open}
        aria-label="Export image"
        title="Export image"
        onClick={() => setOpen((value) => !value)}
        className={`bezel flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ease-fluid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.94] ${
          open
            ? "bg-surface-2 text-fg"
            : "bg-surface text-fg-2 hover:bg-surface-2 hover:text-fg"
        }`}
      >
        <svg viewBox="0 0 14 14" aria-hidden className="h-3.5 w-3.5">
          <path
            d="M7 2v6.4M4.5 6l2.5 2.5L9.5 6M2.5 11.5h9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
