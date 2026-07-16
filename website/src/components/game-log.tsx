/**
 * Scrolling list of what happened so far, newest entry last.
 *
 * @module
 */
"use client";

import { useEffect, useRef, type ReactElement } from "react";
import type { LogEntry } from "@/game/state";
import { UI_TEXTS } from "@/i18n/translations";

/** Props of {@link GameLog}. */
export type GameLogProps = {
  readonly entries: readonly LogEntry[];
};

/**
 * How close to the bottom counts as "following the newest entry", in pixels.
 *
 * @remarks
 * A small tolerance, because fractional scroll offsets rarely hit 0 exactly.
 */
const STICK_TO_BOTTOM_TOLERANCE_PX = 24;

/**
 * Renders the game log and keeps it scrolled to the newest entry.
 *
 * @param props - the entries to show
 * @returns the log element
 * @remarks
 * Only the list itself is ever scrolled. Using `scrollIntoView` here would
 * scroll every scrollable ancestor - including the window - so the page jumped
 * down to the log after every move.
 */
export function GameLog({ entries }: GameLogProps): ReactElement {
  const listRef = useRef<HTMLOListElement>(null);
  // Follow new entries by default, but stop as soon as the player scrolls up
  // to read - the opponents keep adding lines and would drag them back down.
  const isFollowing = useRef(true);

  useEffect(() => {
    const list = listRef.current;
    if (list !== null && isFollowing.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [entries]);

  const handleScroll = () => {
    const list = listRef.current;
    if (list !== null) {
      const distanceToBottom =
        list.scrollHeight - list.scrollTop - list.clientHeight;
      isFollowing.current = distanceToBottom <= STICK_TO_BOTTOM_TOLERANCE_PX;
    }
  };

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="mb-2 text-sm font-semibold">{UI_TEXTS.log}</h2>
      <ol
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 space-y-1 overflow-y-auto text-xs text-zinc-600 dark:text-zinc-300"
      >
        {entries.map((entry) => (
          <li key={entry.id} className="leading-snug">
            {entry.text}
          </li>
        ))}
      </ol>
    </section>
  );
}
