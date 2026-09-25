"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Each word turns on as it crosses a band in the middle of the viewport, in
 * reading order. One observer for the whole line, no scroll listener.
 */
export function TaglineReveal({ text }: { text: string }) {
  const words = text.split(" ");
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const [lit, setLit] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => Number((entry.target as HTMLElement).dataset.word));

        if (hit.length > 0) {
          setLit((prev) => [...new Set([...prev, ...hit])]);
        }
      },
      { rootMargin: "-42% 0px -42% 0px" },
    );

    refs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <p className="max-w-[1000px] text-balance text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          data-word={i}
          ref={(node) => {
            refs.current[i] = node;
          }}
          className={`transition-colors duration-700 ease-fluid ${
            lit.includes(i) ? "text-fg" : "text-fg/30"
          }`}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
