import Link from "next/link";
import { Map } from "lucide-react";

/**
 * The hero is the map, mounted in the same plate the app frames it with.
 *
 * An image, not a live canvas. A graph 2400px wide fitted into this plate
 * lands near half size, where a live canvas turns cards into grey blocks and
 * wires fall under a pixel. The export the app itself produces is sharp at any
 * size, and there is one per theme: a light visitor gets a light map.
 *
 * `npm run posters` re-cuts both files from the running app.
 */
export function HeroMap({
  title,
  meta,
  href,
  poster,
}: {
  title: string;
  /** Short mono summary in the plate's header, e.g. "8 cards · 7 flows". */
  meta: string;
  href: string;
  poster: { dark: string; light: string; alt: string };
}) {
  return (
    <div className="bezel hero-rise mt-12 rounded-[24px] bg-surface p-1.5 [animation-delay:240ms]">
      <div className="flex h-11 items-center justify-between gap-3 px-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <Map className="h-4 w-4 shrink-0 text-fg-3" aria-hidden />
          <span className="truncate text-[12.5px] font-medium tracking-[-0.01em] text-fg">
            {title}
          </span>
        </span>

        <span className="hidden font-mono text-[10.5px] text-fg-3 sm:inline">{meta}</span>
      </div>

      <div className="core relative aspect-[16/9] overflow-hidden rounded-[18px] bg-canvas sm:aspect-[12/5]">
        {/* the canvas grid, so the plate is never an empty hole */}
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(var(--color-dots)_1px,transparent_1px)] [background-size:24px_24px]"
        />

        {(["dark", "light"] as const).map((theme) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={theme}
            src={poster[theme]}
            alt={theme === "dark" ? poster.alt : ""}
            aria-hidden={theme === "light" ? true : undefined}
            className={`${theme}-only absolute inset-0 h-full w-full object-contain p-2 sm:p-4`}
          />
        ))}

        <Link
          href={href}
          aria-label="Open the example map"
          className="group absolute inset-0 z-10 flex items-end justify-end p-3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        >
          <span className="bezel flex h-8 items-center gap-2 rounded-full bg-surface/90 pl-3 pr-1 text-[11.5px] text-fg-2 backdrop-blur-sm transition-colors duration-300 ease-fluid group-hover:text-fg">
            Open the map
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 transition-transform duration-300 ease-fluid group-hover:translate-x-[1px]">
              <Arrow />
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}

export function Arrow() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className="h-3.5 w-3.5">
      <path
        d="M3 7h8M7.6 3.6 11 7l-3.4 3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
