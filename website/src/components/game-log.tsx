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
 * Renders the game log and keeps it scrolled to the newest entry.
 *
 * @param props - the entries to show
 * @returns the log element
 */
export function GameLog({ entries }: GameLogProps): ReactElement {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [entries]);

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="mb-2 text-sm font-semibold">{UI_TEXTS.log}</h2>
      <ol className="flex-1 space-y-1 overflow-y-auto text-xs text-zinc-600 dark:text-zinc-300">
        {entries.map((entry) => (
          <li key={entry.id} className="leading-snug">
            {entry.text}
          </li>
        ))}
        <div ref={bottomRef} />
      </ol>
    </section>
  );
}
