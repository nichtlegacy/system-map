"use client";

import { Map } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "./BrandMark";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/example", label: "Example" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none mt-6 flex justify-center px-4">
      <nav
        aria-label="Main"
        className="pointer-events-auto bezel flex w-max items-center gap-1 rounded-full bg-surface/85 p-1.5 backdrop-blur-xl"
      >
        <Link
          href="/"
          aria-label="System Map, home"
          className="flex items-center gap-2.5 rounded-full pl-1 pr-1 text-[14px] font-semibold tracking-[-0.014em] text-fg transition-colors duration-300 ease-fluid hover:text-fg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] sm:pr-3"
        >
          <span className="bezel flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas">
            <BrandMark className="h-[15px] w-[15px]" />
          </span>
          <span className="hidden sm:inline">System Map</span>
        </Link>

        <span className="mx-1 h-4 w-px bg-line-2" aria-hidden />

        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              aria-label={link.label}
              className={`flex h-8 items-center gap-2 rounded-full px-3 text-[13px] transition-colors duration-300 ease-fluid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] ${
                active ? "switch-thumb text-fg" : "text-fg-2 hover:bg-surface-2 hover:text-fg"
              }`}
            >
              {link.href === "/example" && <Map className="h-4 w-4" aria-hidden />}
              <span>{link.label}</span>
            </Link>
          );
        })}

        <span className="mx-1 h-4 w-px bg-line-2" aria-hidden />
        <ThemeToggle className="h-8 w-8 shrink-0 rounded-full text-fg-2 hover:bg-surface-2" />
      </nav>
    </div>
  );
}
