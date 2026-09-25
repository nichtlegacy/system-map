"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "theme";

/**
 * Sun and moon, drawn to the hairline weight of the rest of the chrome. Both
 * are always mounted and rotate past each other on a switch, so the button
 * shows the change rather than replacing its own contents.
 */
function Icons({ theme }: { theme: Theme }) {
  return (
    <span className="relative block h-3.5 w-3.5">
      <svg
        viewBox="0 0 14 14"
        aria-hidden
        className={`absolute inset-0 transition-all duration-500 ease-fluid ${
          theme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-75 opacity-0"
        }`}
      >
        <path
          d="M11.2 8.6A4.6 4.6 0 0 1 5.4 2.8 4.6 4.6 0 1 0 11.2 8.6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        viewBox="0 0 14 14"
        aria-hidden
        className={`absolute inset-0 transition-all duration-500 ease-fluid ${
          theme === "light"
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-75 opacity-0"
        }`}
      >
        <circle
          cx="7"
          cy="7"
          r="2.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
        />
        <path
          d="M7 1v1.4M7 11.6V13M1 7h1.4M11.6 7H13M2.8 2.8l1 1M10.2 10.2l1 1M11.2 2.8l-1 1M3.8 10.2l-1 1"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // The inline script in the layout already picked a theme; read it back so the
  // button starts on the right icon instead of flipping after hydration.
  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("theme-light")
        ? "light"
        : "dark",
    );
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");
    root.classList.add(`theme-${next}`);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "dark" ? "#0a0a0a" : "#ffffff");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // a blocked localStorage only costs the preference, not the switch
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      className={`flex items-center justify-center text-fg-3 transition-colors duration-300 ease-fluid hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.94] ${className}`}
    >
      <Icons theme={theme} />
    </button>
  );
}
