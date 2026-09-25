import type { ReactNode } from "react";

import { AppFooter, type LegendItem } from "./AppFooter";
import { SiteHeader } from "./SiteHeader";
import { EdgeFilterProvider } from "./EdgeFilter";

/**
 * One frame for every page: the canvas as a plate, and the nav floating over
 * it exactly as it floats over the landing page — same pill, same distance
 * from the top edge, and the same background underneath, which here is the
 * canvas itself. No band behind it: a header bar would take a strip of map
 * away to say something the nav already says.
 *
 * The footer keeps its own plate, because the line key has to sit on something
 * quieter than a diagram to be read at a glance.
 *
 * Below `sm` the plates give up their corners and their inset: on a phone
 * every pixel of canvas matters more than the depth cue does.
 */
export function AppShell({
  footer,
  legend,
  children,
}: {
  footer?: ReactNode;
  legend?: LegendItem[];
  children: ReactNode;
}) {
  return (
    <EdgeFilterProvider>
      <main className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-canvas sm:p-1.5">
        {/*
          A sibling of the plate, not a child of it: the plate is inset by the
          frame's own padding and clips what overflows, so a header inside it
          would sit that much lower than the one on the landing page. Out here
          the nav's own margin is measured from the window, and the two pages
          agree.
        */}
        <div className="absolute inset-x-0 top-0 z-30">
          <SiteHeader />
        </div>

        <div className="core relative min-h-0 flex-1 overflow-hidden bg-canvas sm:rounded-[18px]">
          {children}
        </div>

        <div className="bezel shrink-0 bg-surface sm:mt-1.5 sm:rounded-[18px]">
          <AppFooter legend={legend}>{footer}</AppFooter>
        </div>
      </main>
    </EdgeFilterProvider>
  );
}
