/**
 * The chosen theme, remembered and shared by every page.
 *
 * @module
 * @remarks
 * **Two settings and one absence.** Light and dark are what one can choose;
 * until somebody does, nothing is stored and the device decides - and keeps
 * deciding, so a phone that turns dark at dusk turns the page with it, without
 * a reload. The first click ends that and is kept from then on.
 *
 * That absence is why the choice is `Theme | null` rather than a third state
 * called "system": a state one has to pick in order to get what one already
 * has is a button that only ever means "undo".
 *
 * What reaches the stylesheet is only ever `light` or `dark`
 * ({@link THEME_ATTRIBUTE} on the root element), and while nothing is chosen
 * the attribute is absent, which hands the decision to the stylesheet's own
 * media query.
 */
"use client";

import { readStored, writeStored } from "@/lib/storage/local-store";
import {
  DARK_QUERY,
  THEME_ATTRIBUTE,
  THEME_KEY,
  THEME_VERSION,
  type Theme,
} from "@/lib/theme/theme-boot";

/** What the reader chose, or null while they have not. */
let preference: Theme | null = null;

/** Everyone currently drawing the switch. */
const listeners = new Set<() => void>();

/** Set once the stored choice has been read and the system is being watched. */
let started = false;

/**
 * The theme that is on screen, for `useSyncExternalStore`.
 *
 * @returns the chosen one, or the device's while nothing is chosen
 * @remarks
 * The **resolved** one rather than the choice, because that is what the switch
 * marks: a reader who has chosen nothing still sees one of the two, and the
 * one they see is the one to light up.
 */
export function activeTheme(): Theme {
  start();
  return preference ?? systemTheme();
}

/**
 * What the prerendered page shows.
 *
 * @returns nothing, because a server knows neither the choice nor the device
 * @remarks
 * Null rather than a guess. The HTML is built once for everybody; guessing
 * "light" here would light the wrong button on every dark phone for as long as
 * hydration takes. Nothing is marked until the browser has answered - see the
 * switch itself.
 */
export function serverActiveTheme(): Theme | null {
  return null;
}

/**
 * Subscribes to the chosen theme.
 *
 * @param listener - called whenever the choice changes
 * @returns the unsubscribe function
 */
export function subscribeTheme(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Sets the theme and remembers it.
 *
 * @param next - what the reader picked
 */
export function setTheme(next: Theme): void {
  preference = next;
  writeStored(THEME_KEY, THEME_VERSION, next);
  apply();
  for (const listener of listeners) {
    listener();
  }
}

/** Reads the stored choice once, and starts following the system. */
function start(): void {
  if (!started && typeof window !== "undefined") {
    started = true;
    preference = readStored(THEME_KEY, THEME_VERSION, isTheme);
    // Only while nothing is chosen: an explicit choice is a choice, and must
    // not be overruled by the phone deciding it is evening.
    window.matchMedia(DARK_QUERY).addEventListener("change", () => {
      if (preference === null) {
        apply();
        for (const listener of listeners) {
          listener();
        }
      }
    });
    apply();
  }
}

/**
 * Writes the resolved theme onto the root element.
 *
 * @remarks
 * The attribute is **removed** rather than set to "light" while nothing has
 * been chosen. That is what hands the decision back to the stylesheet's media
 * query - one place decides, and it is the same place that decides for a reader
 * who never ran any of this.
 */
function apply(): void {
  const root = document.documentElement;
  if (preference === null) {
    root.removeAttribute(THEME_ATTRIBUTE);
  } else {
    root.setAttribute(THEME_ATTRIBUTE, preference);
  }
}

/** What the system asks for right now. */
function systemTheme(): Theme {
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches
    ? "dark"
    : "light";
}

/**
 * Whether a stored value is one of the two settings.
 *
 * @param value - what came out of storage
 * @returns true for "light" and "dark"
 * @remarks
 * The old third value, `"system"`, falls through this and is read as "nothing
 * chosen" - which is exactly what it meant. Nobody who had it set notices the
 * difference, and the entry is overwritten the next time they touch the
 * switch.
 */
function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}
