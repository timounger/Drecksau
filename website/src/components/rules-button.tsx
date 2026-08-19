/**
 * The "? Regeln" button and the rules it opens.
 *
 * @module
 * @remarks
 * An overlay rather than a page, and that is not a style choice. Half these
 * games are played online, and a player who navigates to a rules page mid-game
 * leaves the room and has to join again - looking something up must never cost
 * you your seat. So the rules open **over** the table, which keeps running
 * behind them.
 *
 * Built on the browser's own `<dialog>`: Escape closes it, focus is held
 * inside it, and the page behind it cannot be tabbed into - none of which a
 * hand-rolled overlay gets right without a lot of care.
 */
"use client";

import { useCallback, useRef, type ReactElement } from "react";
import type { GameRules } from "./game-rules";

/** German labels of the button and the dialog. */
const TEXTS = {
  short: "?",
  long: "Regeln",
  title: (game: string) => `${game} - Spielregeln`,
  close: "Schließen",
  openLabel: "Spielregeln anzeigen",
} as const;

/**
 * A button that opens the game's rules over whatever is on screen.
 *
 * @param props - the rules to show
 * @returns the button, with the dialog it owns
 */
export function RulesButton({
  rules,
}: {
  readonly rules: GameRules;
}): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);

  const open = useCallback(() => dialog.current?.showModal(), []);
  const close = useCallback(() => dialog.current?.close(), []);

  // A click on the backdrop lands on the dialog element itself, never on the
  // panel inside it - so this closes on "clicked outside" without a second
  // element to catch it.
  const onBackdrop = useCallback((event: React.MouseEvent) => {
    if (event.target === dialog.current) {
      dialog.current?.close();
    }
  }, []);

  return (
    <>
      <button
        type="button"
        data-testid="rules-button"
        aria-label={TEXTS.openLabel}
        onClick={open}
        className="shrink-0 cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <span aria-hidden="true">{TEXTS.short}</span>
        {/* The word only where there is room. On a phone the header is already
            carrying the game's name and the way back. */}
        <span aria-hidden="true" className="ml-1 hidden sm:inline">
          {TEXTS.long}
        </span>
      </button>

      <dialog
        ref={dialog}
        data-testid="rules-dialog"
        onClick={onBackdrop}
        className="m-auto w-[min(46rem,92vw)] rounded-2xl bg-white p-0 text-zinc-900 backdrop:bg-black/50 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-start gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">{TEXTS.title(rules.title)}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {rules.players}
              </p>
            </div>
            <button
              type="button"
              data-testid="rules-close"
              onClick={close}
              className="shrink-0 cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {TEXTS.close}
            </button>
          </header>

          <div className="flex flex-col gap-4 overflow-y-auto p-4 text-sm">
            <p className="text-zinc-700 dark:text-zinc-200">{rules.intro}</p>
            {rules.sections.map((section) => (
              <Section key={section.title} section={section} />
            ))}
            {rules.note !== undefined && (
              // Quiet, and below everything: background, not a warning.
              <p className="border-t border-zinc-200 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                {rules.note}
              </p>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

/** One heading with whatever belongs under it. */
function Section({
  section,
}: {
  readonly section: GameRules["sections"][number];
}): ReactElement {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-bold">{section.title}</h3>
      {section.body?.map((line) => (
        <p key={line} className="text-zinc-700 dark:text-zinc-200">
          {line}
        </p>
      ))}
      {section.list !== undefined && (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-zinc-700 dark:text-zinc-200">
          {section.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {section.table !== undefined && (
        // Its own scroller: a wide table must never make the whole dialog
        // scroll sideways.
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <tbody>
              {section.table.map((row, index) => (
                // Keyed by place, not by content: a table row may repeat a
                // value - "Punkte" twice, or an empty cell - and content keys
                // would collide.
                <tr
                  key={index}
                  className={
                    index === 0
                      ? "border-b border-zinc-300 font-semibold dark:border-zinc-700"
                      : "border-b border-zinc-100 dark:border-zinc-800"
                  }
                >
                  {row.map((cell, column) => (
                    <td key={column} className="py-1 pr-4 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
