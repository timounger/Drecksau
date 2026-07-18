/**
 * Scrolling list of what happened so far, newest entry first (at the top).
 *
 * @module
 */
"use client";

import { useEffect, useRef, type ReactElement } from "react";
import type { LogEntry } from "@/games/drecksau/engine/state";
import { UI_TEXTS } from "@/games/drecksau/i18n/translations";

/** Props of {@link GameLog}. */
export type GameLogProps = {
  readonly entries: readonly LogEntry[];
};

/**
 * How close to the top counts as "following the newest entry", in pixels.
 *
 * @remarks
 * A small tolerance, because fractional scroll offsets rarely hit 0 exactly.
 */
const STICK_TO_TOP_TOLERANCE_PX = 24;

/**
 * Renders the game log with the newest entry on top.
 *
 * @param props - the entries to show
 * @returns the log element
 * @remarks
 * Newest first means the latest action is visible without scrolling. The list
 * follows new entries by keeping itself at the top, but stops as soon as the
 * player scrolls down to read older lines. Only the list itself is ever
 * scrolled - never the page.
 */
export function GameLog({ entries }: GameLogProps): ReactElement {
  const listRef = useRef<HTMLOListElement>(null);
  const isFollowing = useRef(true);

  useEffect(() => {
    const list = listRef.current;
    if (list !== null && isFollowing.current) {
      list.scrollTop = 0;
    }
  }, [entries]);

  const handleScroll = () => {
    const list = listRef.current;
    if (list !== null) {
      isFollowing.current = list.scrollTop <= STICK_TO_TOP_TOLERANCE_PX;
    }
  };

  // Newest first, without mutating the prop.
  const newestFirst = entries.slice().reverse();

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="mb-2 text-sm font-semibold">{UI_TEXTS.log}</h2>
      <ol
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 space-y-1 overflow-y-auto text-xs text-zinc-600 dark:text-zinc-300"
      >
        {newestFirst.map((entry) => (
          <li key={entry.id} className="leading-snug">
            {entry.text}
          </li>
        ))}
      </ol>
    </section>
  );
}
