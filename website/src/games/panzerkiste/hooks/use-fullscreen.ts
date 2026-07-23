/**
 * A small hook around the browser's Fullscreen API.
 *
 * @module
 * @remarks
 * Lets a chosen element fill the screen - handy on a phone, where the game then
 * uses the whole display without the browser chrome. Fullscreen for a plain
 * element is not offered everywhere (notably iOS Safari), so {@link supported}
 * says whether to show a button at all.
 */
"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

/** What the fullscreen hook exposes. */
export type Fullscreen = {
  /** Whether the browser allows an element to go fullscreen. */
  readonly supported: boolean;
  /** Whether the element is fullscreen right now. */
  readonly active: boolean;
  /** Enters fullscreen if it is not on, leaves it if it is. */
  readonly toggle: () => void;
};

/**
 * Tracks and toggles fullscreen for one element.
 *
 * @param ref - the element that should fill the screen
 * @returns whether fullscreen is supported and active, and a toggle
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>): Fullscreen {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Read support and the current state on the client only, so the prerendered
    // HTML (which never has a button) and the first client render agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only capability check
    setSupported(document.fullscreenEnabled);
    const onChange = () => setActive(document.fullscreenElement !== null);
    onChange();
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(() => {
    const element = ref.current;
    if (element === null) {
      return;
    }
    if (document.fullscreenElement === null) {
      void element.requestFullscreen().catch(() => {
        // A refused request (e.g. no user gesture) just leaves us windowed.
      });
    } else {
      void document.exitFullscreen().catch(() => {});
    }
  }, [ref]);

  return { supported, active, toggle };
}
