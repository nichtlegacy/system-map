"use client";

import { useEffect, useState } from "react";

import { Segmented } from "@/components/shell/Segmented";
import {
  exportMap,
  exportSize,
  type ExportFormat,
  type ExportOptions,
} from "./exportImage";

/** The dot grid, at the two values the canvas itself uses. */
const DOTS = { dark: "#232323", light: "#dcdcdc" };

/**
 * A proportional stand-in for the file: the real aspect ratio, the canvas
 * colour you picked, and a transparent chequer when there is no background.
 *
 * Two switches and a pixel count made you imagine the result. This shows it,
 * which is the whole reason the panel exists before the download rather than
 * after it.
 */
function Preview({
  options,
  width,
  height,
}: {
  options: ExportOptions;
  width: number;
  height: number;
}) {
  const canvas = options.dark ? "#0a0a0a" : "#ffffff";
  const dots = options.dark ? DOTS.dark : DOTS.light;
  const ratio = width && height ? `${width} / ${height}` : "16 / 9";

  return (
    <div
      className="core relative overflow-hidden rounded-[8px]"
      style={{ aspectRatio: ratio }}
    >
      {/* transparency, in the one place a chequer is information */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--color-surface-2)",
          backgroundImage:
            "linear-gradient(45deg, var(--color-contrast) 25%, transparent 25% 75%, var(--color-contrast) 75%), linear-gradient(45deg, var(--color-contrast) 25%, transparent 25% 75%, var(--color-contrast) 75%)",
          backgroundSize: "10px 10px",
          backgroundPosition: "0 0, 5px 5px",
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-500 ease-fluid motion-reduce:transition-none"
        style={{
          opacity: options.background ? 1 : 0,
          backgroundColor: canvas,
          backgroundImage: `radial-gradient(${dots} 1px, transparent 1px)`,
          backgroundSize: "12px 12px",
        }}
      />

      <span className="absolute inset-x-0 bottom-1.5 text-center font-mono text-[9.5px] tabular-nums text-fg-3">
        {width && height
          ? `${width * options.scale} × ${height * options.scale}`
          : "nothing to export yet"}
      </span>
    </div>
  );
}

export function ExportPanel({ onClose }: { onClose: () => void }) {
  const [options, setOptions] = useState<ExportOptions>({
    background: true,
    dark: true,
    scale: 2,
  });
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { width, height } = exportSize();
  const set = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) =>
    setOptions((previous) => ({ ...previous, [key]: value }));

  const run = async (format: ExportFormat) => {
    setBusy(format);
    setStatus(null);
    try {
      setStatus(await exportMap(options, format));
      setFailed(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The export failed.");
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const secondary =
    "h-7 flex-1 rounded-full text-[11px] text-fg-2 transition-colors duration-300 ease-fluid hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:pointer-events-none disabled:text-line-3";

  return (
    <div
      className={`bezel w-[272px] origin-bottom-right rounded-[16px] bg-surface p-1.5 transition-[opacity,translate,scale] duration-300 ease-fluid motion-reduce:transition-none ${
        shown
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-1.5 scale-[0.98] opacity-0"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1">
        <h2 className="text-[12px] font-medium tracking-[-0.01em] text-fg">
          Export image
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close export options"
          className="rounded-full px-1.5 py-0.5 font-mono text-[10px] text-fg-3 transition-colors duration-300 ease-fluid hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          esc
        </button>
      </div>

      <div className="rounded-[11px] bg-canvas p-2 shadow-[inset_0_0_0_1px_var(--color-bezel-2)]">
        <Preview options={options} width={width} height={height} />

        <div className="mt-2 space-y-1.5">
          <Segmented
            label="Canvas"
            active={options.dark ? "dark" : "light"}
            onChange={(id) => set("dark", id === "dark")}
            items={[
              { id: "dark", label: "Dark" },
              { id: "light", label: "Light" },
            ]}
            className="w-full [&>button]:flex-1 [&>button]:justify-center"
          />
          <Segmented
            label="Background"
            active={options.background ? "solid" : "none"}
            onChange={(id) => set("background", id === "solid")}
            items={[
              { id: "solid", label: "Filled" },
              { id: "none", label: "Transparent" },
            ]}
            className="w-full [&>button]:flex-1 [&>button]:justify-center"
          />
          <Segmented
            label="Scale"
            active={String(options.scale) as "1" | "2" | "3"}
            onChange={(id) => set("scale", Number(id) as ExportOptions["scale"])}
            items={[
              { id: "1", label: "1×" },
              { id: "2", label: "2×" },
              { id: "3", label: "3×" },
            ]}
            className="w-full [&>button]:flex-1 [&>button]:justify-center"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={busy !== null}
        onClick={() => run("png")}
        className="group mt-1.5 flex h-9 w-full items-center justify-between rounded-full bg-fg pl-4 pr-1 text-[12px] font-medium text-canvas transition-[background-color,scale] duration-300 ease-fluid hover:bg-fg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:pointer-events-none disabled:bg-line-2"
      >
        {busy === "png" ? "Saving…" : "Save PNG"}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas/10 transition-transform duration-300 ease-fluid group-hover:translate-y-[1px]">
          <svg viewBox="0 0 14 14" aria-hidden className="h-3.5 w-3.5">
            <path
              d="M7 2.5v6M4.4 6l2.6 2.6L9.6 6M2.8 11.5h8.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      <div className="mt-1 flex gap-1">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("svg")}
          className={secondary}
        >
          {busy === "svg" ? "Saving…" : "SVG"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("clipboard")}
          className={secondary}
        >
          {busy === "clipboard" ? "Copying…" : "Copy"}
        </button>
      </div>

      {status && (
        <p
          role="status"
          className={`px-2 pb-1 pt-2 text-[10.5px] leading-[1.5] ${
            failed ? "text-accent" : "text-fg-3"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}
