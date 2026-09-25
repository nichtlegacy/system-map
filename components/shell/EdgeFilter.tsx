"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { EdgeFlavor } from "@/types/system-map";

/** What the canvas should do with one kind of wire right now. */
export type EdgeState = "lit" | "dim" | "plain";

type EdgeFocus = {
  /** The flavor being pointed at or held, whichever is more immediate. */
  focus: EdgeFlavor | null;
  /** The flavor a click is holding, if any. */
  pinned: EdgeFlavor | null;
  stateOf: (flavor: EdgeFlavor) => EdgeState;
  hover: (flavor: EdgeFlavor | null) => void;
  toggle: (flavor: EdgeFlavor) => void;
  clear: () => void;
};

/**
 * Which kind of wire the reader is interested in. The footer legend writes it,
 * the canvas reads it — the two sit on opposite sides of the shell, so a
 * context is the only thing they can share without every page wiring state by
 * hand.
 *
 * One flavor at a time, and two ways to say it: pointing at a legend entry
 * lights that flavor for as long as the pointer is there, clicking it holds
 * the state so you can let go and follow the line with your finger on the
 * screen. Everything else drops back rather than disappearing — a hidden wire
 * would take its label with it and leave the cards looking unconnected.
 */
const Context = createContext<EdgeFocus | null>(null);

export function EdgeFilterProvider({ children }: { children: ReactNode }) {
  const [pinned, setPinned] = useState<EdgeFlavor | null>(null);
  const [hovered, setHovered] = useState<EdgeFlavor | null>(null);

  const toggle = useCallback((flavor: EdgeFlavor) => {
    setPinned((current) => (current === flavor ? null : flavor));
  }, []);

  const clear = useCallback(() => {
    setPinned(null);
    setHovered(null);
  }, []);

  const value = useMemo<EdgeFocus>(() => {
    const focus = hovered ?? pinned;
    return {
      focus,
      pinned,
      stateOf: (flavor) =>
        focus === null ? "plain" : flavor === focus ? "lit" : "dim",
      hover: setHovered,
      toggle,
      clear,
    };
  }, [hovered, pinned, toggle, clear]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/**
 * Falls back to "nothing focused" so a canvas can also be rendered outside the
 * shell — the landing page's hero does exactly that.
 */
export function useEdgeFilter(): EdgeFocus {
  return (
    useContext(Context) ?? {
      focus: null,
      pinned: null,
      stateOf: () => "plain",
      hover: () => {},
      toggle: () => {},
      clear: () => {},
    }
  );
}
