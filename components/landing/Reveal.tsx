"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Enter-on-scroll, once. IntersectionObserver rather than a scroll listener so
 * nothing reflows while the page moves.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`motion-safe:transition-all motion-safe:duration-[900ms] motion-safe:ease-fluid ${
        shown
          ? "translate-y-0 opacity-100 blur-0"
          : "motion-safe:translate-y-16 motion-safe:opacity-0 motion-safe:blur"
      } ${className}`}
    >
      {children}
    </div>
  );
}
