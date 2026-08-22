/**
 * The chosen theme, remembered and shared by every page.
 *
 * @module
 * @remarks
 * Three states, not two: **hell**, **dunkel**, and **system**. A plain switch
 * can only ever mean "the opposite of now" and quietly throws away the answer
 * most people actually want - that the site does whatever their phone does at
 * dusk. System is therefore the state nobody has to choose, and the one you
 * can get back to.
 *
 * What reaches the stylesheet is only ever `light` or `dark`
 * ({@link THEME_ATTRIBUTE} on the root element): this module resolves "system"
 * and keeps resolving it, so a phone switching over at sunset switches the page
 * with it, without a reload.
 */
"use client";

import { readStored, writeStored } from "@/lib/storage/local-store";
import {
  DARK_QUERY,
  THEME_ATTRIBUTE,
  THEME_KEY,
  THEME_VERSION,
  type Theme,
  type ThemePreference,
} from "@/lib/theme/theme-boot";

/** What the reader wants, before the system is consulted. */
let preference: ThemePreference = "system";

/** Everyone currently drawing the switch. */
const listeners = new Set<() => void>();

/** Set once the stored choice has been read and the system is being watched. */
let started = false;

/**
 * The chosen preference, for `useSyncExternalStore`.
 *
 * @returns light, dark, or system
 */
export function themePreference(): ThemePreference {
  start();
  return preference;
}

/**
 * What the prerendered page shows.
 *
 * @returns system, because a server knows nothing about this reader
 */
export function serverThemePreference(): ThemePreference {
  return "system";
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
export function setThemePreference(next: ThemePreference): void {
  preference = next;
  writeStored(THEME_KEY, THEME_VERSION, next);
  apply();
  for (const listener of listeners) {
    listener();
  }
}

/**
 * The theme that is actually on screen.
 *
 * @returns light or dark, with "system" already resolved
 */
export function resolvedTheme(): Theme {
  return preference === "system" ? systemTheme() : preference;
}

/** Reads the stored choice once, and starts following the system. */
function start(): void {
  if (!started && typeof window !== "undefined") {
    started = true;
    preference = readStored(THEME_KEY, THEME_VERSION, isPreference) ?? "system";
    // Only while on "system": an explicit choice is a choice, and must not be
    // overruled by the phone deciding it is evening.
    window.matchMedia(DARK_QUERY).addEventListener("change", () => {
      if (preference === "system") {
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
 * The attribute is **removed** rather than set to "light" when the reader is on
 * "system". That is what hands the decision back to the stylesheet's media
 * query - one place decides, and it is the same place that decides for a reader
 * who never ran any of this.
 */
function apply(): void {
  const root = document.documentElement;
  if (preference === "system") {
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

/** Whether a stored value is one of the three states. */
function isPreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}
