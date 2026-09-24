/**
 * Whether the browser has taken over from the prerendered HTML.
 *
 * @module
 * @remarks
 * Everything this app remembers lives in the browser, and the pages are static
 * files built without one. Most of that is read through a store with a server
 * snapshot, which is enough: the snapshot is what the HTML shows, and the real
 * value arrives with hydration.
 *
 * It is **not** enough wherever "nothing stored" is itself a real answer. An
 * empty name is somebody who has not set one; no games played is somebody who
 * has not played. Both look exactly like the server snapshot, so a page that
 * cannot tell them apart claims something it does not know yet.
 *
 * This is the missing bit: false while the page is still the one that arrived,
 * true from hydration on.
 */
"use client";

import { useSyncExternalStore } from "react";

/**
 * Reads that one bit.
 *
 * @returns false during the prerender and the hydration render, true after
 * @remarks
 * A store with nothing in it: the server says no, the browser says yes, and
 * React swaps the one for the other as it finishes hydrating - which is
 * exactly the moment the browser's own memory becomes readable.
 */
export function useReady(): boolean {
  return useSyncExternalStore(NEVER_CHANGES, IN_BROWSER, ON_SERVER);
}

/** There is nothing to subscribe to: hydration happens once. */
const NEVER_CHANGES = () => () => undefined;

/** What the browser says. */
const IN_BROWSER = (): boolean => true;

/** And what the prerender says. */
const ON_SERVER = (): boolean => false;
