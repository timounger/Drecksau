/**
 * The chosen look of the start page, remembered between visits.
 *
 * @module
 * @remarks
 * Built like the theme store next door, and for the same reason: the value is
 * written onto the root element, the stylesheet reads it from there, and this
 * module is only what the settings dialog talks to.
 *
 * The one difference is that there is no "system" to fall back to. A look has
 * no equivalent of a phone that decides at dusk, so an absent choice simply
 * means {@link DEFAULT_LOOK}.
 */
"use client";

import { readStored, writeStored } from "@/lib/storage/local-store";
import {
  DEFAULT_LOOK,
  LOOK_ATTRIBUTE,
  LOOK_KEY,
  LOOK_VERSION,
  type CollectionLook,
} from "@/lib/look/look-boot";

/** What the reader chose, once it has been read. */
let look: CollectionLook = DEFAULT_LOOK;

/** Everyone currently drawing the setting. */
const listeners = new Set<() => void>();

/** Set once the stored choice has been read. */
let started = false;

/**
 * The look in force, for `useSyncExternalStore`.
 *
 * @returns the chosen look, or the default while nothing is chosen
 */
export function collectionLook(): CollectionLook {
  start();
  return look;
}

/**
 * What the prerendered page knows about it.
 *
 * @returns nothing, because the choice is in a browser this render has not met
 * @remarks
 * Null rather than the default: the dialog marks the one in force, and marking
 * the default for a reader who picked something else - for as long as
 * hydration takes - is marking the wrong one. Nothing is marked until the
 * browser has answered. The page itself does not wait for any of this; the
 * boot script has set the attribute long before.
 */
export function serverCollectionLook(): CollectionLook | null {
  return null;
}

/**
 * Subscribes to the chosen look.
 *
 * @param listener - called whenever the choice changes
 * @returns the unsubscribe function
 */
export function subscribeLook(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Sets the look and remembers it.
 *
 * @param next - what the reader picked
 */
export function setCollectionLook(next: CollectionLook): void {
  look = next;
  writeStored(LOOK_KEY, LOOK_VERSION, next);
  apply();
  for (const listener of listeners) {
    listener();
  }
}

/** Reads the stored choice once. */
function start(): void {
  if (!started && typeof window !== "undefined") {
    started = true;
    look = readStored(LOOK_KEY, LOOK_VERSION, isLook) ?? DEFAULT_LOOK;
  }
}

/**
 * Writes the look onto the root element.
 *
 * @remarks
 * The attribute is **removed** for the default rather than set to its name -
 * the same trick the theme uses. One place decides what "nothing chosen" looks
 * like, and it is the stylesheet.
 */
function apply(): void {
  const root = document.documentElement;
  if (look === DEFAULT_LOOK) {
    root.removeAttribute(LOOK_ATTRIBUTE);
  } else {
    root.setAttribute(LOOK_ATTRIBUTE, look);
  }
}

/** Whether a stored value is one of the three looks. */
function isLook(value: unknown): value is CollectionLook {
  return value === "showcase" || value === "dashboard" || value === "plain";
}
