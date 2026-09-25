import Link from "next/link";

import { Arrow, HeroMap } from "@/components/landing/HeroMap";
import { Reveal } from "@/components/landing/Reveal";
import { Spine } from "@/components/landing/Spine";
import { exampleTrace } from "@/components/landing/traces";
import { TaglineReveal } from "@/components/landing/TaglineReveal";
import { BrandMark } from "@/components/shell/BrandMark";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { counts } from "@/data/example/counts";
import { asset, REPO } from "@/data/site";

/** What the example map answers, in the form of the question you arrive with. */
const QUESTIONS = [
  {
    ask: "Where does a request come in?",
    proof: "One external caller and one public boundary, on the edge host",
  },
  {
    ask: "What decides what happens next?",
    proof: `${counts.primary}, the one primary card on the map`,
  },
  {
    ask: "Where does the result end up?",
    proof: "Object storage, and a report you can see on the card itself",
  },
];

/** What the starter gives a map of your own. */
const FEATURES = [
  {
    ask: "Typed data, split in two",
    proof: "Identity and position in one file, values that change in another",
  },
  {
    ask: "Hand-placed, then measured",
    proof: "Three audits catch wires through cards, clipped text and crowded labels",
  },
  {
    ask: "Export in either theme",
    proof: "The whole canvas as PNG or SVG, at 1×, 2× or 3×, dark or light",
  },
];

/** The four files a map is made of, in the order you edit them. */
const FILES = [
  {
    path: "topology.ts",
    how: "Who is on the map and where: cards, frames, lanes and the wires between them.",
    figure: `${counts.cards} cards · ${counts.flows} flows`,
  },
  {
    path: "state.ts",
    how: "The values that change: status, latency, queue depth, capacity.",
    figure: "kept apart from identity",
  },
  {
    path: "index.ts",
    how: "Turns both into React Flow nodes and edges. Sizes live here, once.",
    figure: "no layout engine",
  },
  {
    path: "counts.ts",
    how: "Every number the page and legend print, derived from the topology.",
    figure: "never typed by hand",
  },
];

/** The card vocabulary, as the README table names it. */
const KINDS = [
  ["service", "A normal running service"],
  ["primaryService", "The main decision point"],
  ["external", "Something outside the boundary"],
  ["storage", "A path or capacity-bearing store"],
  ["artefact", "The output itself, as a picture"],
  ["infra", "A host frame with listeners and facts"],
  ["cluster", "A labelled frame around related cards"],
  ["lane", "A reading-order label"],
  ["stat", "One derived figure"],
  ["bars", "Ranked values with visible numbers"],
] as const;

function Heading({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="max-w-[620px]">
      <h2 className="text-[22px] font-medium tracking-[-0.02em] text-fg sm:text-[26px]">
        {title}
      </h2>
      {lead && (
        <p className="mt-2.5 text-pretty text-[13.5px] leading-[1.65] text-fg-2">{lead}</p>
      )}
    </div>
  );
}

function ListCard({
  title,
  meta,
  items,
  action,
}: {
  title: string;
  meta: string;
  items: { ask: string; proof: string }[];
  action: { href: string; label: string; external?: boolean };
}) {
  const actionClass =
    "group mt-5 flex h-8 w-max max-w-full items-center gap-2 rounded-full bg-fg pl-3.5 pr-1 text-[12px] font-medium text-canvas transition-colors duration-300 ease-fluid hover:bg-fg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]";
  const actionBody = (
    <>
      <span className="truncate">{action.label}</span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-canvas/15 transition-transform duration-300 ease-fluid group-hover:translate-x-[1px]">
        <Arrow />
      </span>
    </>
  );

  return (
    <article className="bezel flex h-full min-w-0 flex-col rounded-[20px] bg-surface p-1.5">
      <div className="flex min-w-0 items-center gap-2.5 px-2.5 py-2">
        <h3 className="truncate text-[12.5px] font-medium tracking-[-0.01em] text-fg">{title}</h3>
        <span className="ml-auto hidden shrink-0 font-mono text-[10.5px] tabular-nums text-fg-3 sm:inline">
          {meta}
        </span>
      </div>

      <div className="core flex min-w-0 flex-1 flex-col rounded-[15px] bg-canvas p-4">
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.ask} className="py-3 first:pt-0 last:pb-0">
              <p className="text-[13.5px] font-medium text-fg">{item.ask}</p>
              <p className="mt-1 text-pretty text-[12px] leading-[1.55] text-fg-3">{item.proof}</p>
            </li>
          ))}
        </ul>

        {action.external ? (
          <a href={action.href} className={actionClass}>
            {actionBody}
          </a>
        ) : (
          <Link href={action.href} className={actionClass}>
            {actionBody}
          </Link>
        )}
      </div>
    </article>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-50 focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-canvas"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main">
        {/* Hero ---------------------------------------------------------- */}
        <section className="mx-auto max-w-[1160px] px-6 pb-20 pt-14 sm:pt-16">
          <p className="hero-rise font-mono text-[11px] text-fg-3">React Flow · Next.js · TypeScript</p>
          <h1 className="hero-rise mt-5 max-w-[760px] text-balance text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-heading [animation-delay:60ms] sm:text-[52px]">
            Draw systems people can follow.
          </h1>
          <p className="hero-rise mt-5 max-w-[580px] text-pretty text-[14.5px] leading-[1.65] text-fg-2 [animation-delay:120ms]">
            A starter for hand-placed system maps: typed data, cards that say what they are, wires
            that say what they carry, and the whole canvas exported as PNG or SVG in either theme.
          </p>

          <div className="hero-rise mt-8 flex flex-wrap gap-2 [animation-delay:180ms]">
            <Link
              href="/example"
              className="group flex h-9 items-center gap-2 rounded-full bg-fg pl-4 pr-1.5 text-[13px] font-medium text-canvas transition-colors duration-300 ease-fluid hover:bg-fg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
            >
              Open the example
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-canvas/15 transition-transform duration-300 ease-fluid group-hover:translate-x-[1px]">
                <Arrow />
              </span>
            </Link>
            <a
              href={REPO}
              className="bezel flex h-9 items-center rounded-full bg-surface px-4 text-[13px] text-fg-2 transition-colors duration-300 ease-fluid hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
            >
              View on GitHub
            </a>
          </div>

          <HeroMap
            title="Example · one request, end to end"
            meta={`${counts.cards} cards · ${counts.flows} flows · fictional`}
            href="/example"
            poster={{
              dark: asset("/posters/example-dark.png"),
              light: asset("/posters/example-light.png"),
              alt: "The example map: a client outside the system, a request API inside an edge host frame, a processing frame with a worker and two readings, one primary orchestrator card, and object storage with the rendered report beneath it.",
            }}
          />
        </section>

        {/* Questions ----------------------------------------------------- */}
        <section className="mx-auto max-w-[1160px] px-6 py-16">
          <Heading
            title="A map answers questions"
            lead="Not a dashboard and not a diagram tool. A map is drawn once, by hand, so that the next person can find their way through a system without asking you."
          />

          <div className="mt-9 grid gap-4 md:grid-cols-2">
            <Reveal>
              <ListCard
                title="What the example answers"
                meta={`${counts.cards} cards · ${counts.flows} flows`}
                items={QUESTIONS}
                action={{ href: "/example", label: "Open the example map" }}
              />
            </Reveal>
            <Reveal delay={80}>
              <ListCard
                title="What the starter gives yours"
                meta={`${KINDS.length} card kinds · 3 wires`}
                items={FEATURES}
                action={{ href: REPO, label: "Read the README", external: true }}
              />
            </Reveal>
          </div>
        </section>

        {/* Spine --------------------------------------------------------- */}
        <section className="mx-auto max-w-[1160px] px-6 py-16">
          <Heading
            title="Every map has a spine"
            lead="Every graph reduces to one path. This is the example's, with the handoff named on the wire between the steps."
          />

          <Reveal className="mt-9">
            <h3 className="text-[13px] text-fg-2">A request, from the caller to a report</h3>
            <div className="mt-2">
              <Spine trace={exampleTrace} label="The example path" />
            </div>
          </Reveal>

          <p className="mt-8 font-mono text-[11px] text-fg-3 lg:hidden">
            The trace scrolls sideways on its own
          </p>
        </section>

        {/* Tagline ------------------------------------------------------- */}
        <section className="mx-auto max-w-[1160px] px-6 py-24">
          <TaglineReveal text="A system you cannot explain is a system you cannot fix. So draw it, wire by wire, from what is actually running." />
        </section>

        {/* Files --------------------------------------------------------- */}
        <section className="mx-auto max-w-[1160px] px-6 py-16">
          <Heading
            title="Four files make a map"
            lead="Copy data/example/ and app/example/, then edit these. The renderer never imports your data, so a second map costs a folder and a route."
          />

          <div className="bezel mt-9 rounded-[20px] bg-surface p-1.5">
            <ol className="core divide-y divide-line rounded-[15px] bg-canvas">
              {FILES.map((file) => (
                <li
                  key={file.path}
                  className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 px-4 py-4"
                >
                  <h3 className="w-full font-mono text-[13px] text-fg sm:w-[220px]">
                    data/example/{file.path}
                  </h3>
                  <p className="min-w-0 flex-1 text-pretty text-[12.5px] leading-[1.6] text-fg-2">
                    {file.how}
                  </p>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-fg-3">
                    {file.figure}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Vocabulary ---------------------------------------------------- */}
        <section className="mx-auto max-w-[1160px] px-6 pb-20 pt-16">
          <Heading
            title={`${KINDS.length} kinds of card`}
            lead="Each one is a React component with a fixed size, so layouts stay on a grid and the audits know what they are measuring."
          />

          <Reveal className="mt-9">
            <div className="bezel rounded-[20px] bg-surface p-1.5">
              <ul className="core grid gap-px overflow-hidden rounded-[15px] bg-line sm:grid-cols-2 lg:grid-cols-5">
                {KINDS.map(([kind, use]) => (
                  <li key={kind} className="min-w-0 bg-canvas px-4 py-4">
                    <p className="truncate font-mono text-[12px] text-fg">{kind}</p>
                    <p className="mt-1.5 text-pretty text-[12px] leading-[1.5] text-fg-3">{use}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-center">
            <p className="max-w-md text-pretty text-[13.5px] leading-[1.65] text-fg-2">
              Node.js 22 or newer. No database, no runtime data source, no account — the example is
              the whole contract. Drawing with a coding agent? Add the{" "}
              <a
                href="https://github.com/existential-birds/beagle/tree/main/plugins/beagle-react/skills/react-flow"
                className="text-fg underline decoration-line-3 underline-offset-4 transition-colors duration-300 ease-fluid hover:decoration-fg"
              >
                react-flow skill
              </a>
              .
            </p>
            <pre className="bezel overflow-x-auto rounded-[20px] bg-surface p-5 font-mono text-[12.5px] leading-7 text-fg-2">
              <code>{`npm ci\nnpm run dev\n# http://localhost:3000/example\n\n# optional, for coding agents\nnpx skills add existential-birds/beagle --skill react-flow`}</code>
            </pre>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-[1160px] px-6 pb-8">
        <div className="bezel flex flex-wrap items-center justify-between gap-x-8 gap-y-2 rounded-3xl bg-surface p-2 sm:rounded-full">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-full pl-1 pr-3 text-[15px] font-semibold tracking-[-0.015em] text-fg transition-colors duration-300 ease-fluid hover:text-fg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
          >
            <span className="bezel flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas">
              <BrandMark className="h-4 w-4" />
            </span>
            System Map
          </Link>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-1">
            {[
              { href: "/example", label: "Example" },
              { href: REPO, label: "GitHub" },
              { href: `${REPO}/blob/main/LICENSE`, label: "MIT License" },
            ].map((link) => {
              const className =
                "flex h-9 items-center rounded-full px-3.5 text-[14px] text-fg-2 transition-colors duration-300 ease-fluid hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]";
              // Internal routes go through Link, which adds the base path.
              return link.href.startsWith("/") ? (
                <Link key={link.label} href={link.href} className={className}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} className={className}>
                  {link.label}
                </a>
              );
            })}
          </nav>
        </div>
      </footer>
    </div>
  );
}
