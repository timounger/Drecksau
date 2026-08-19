/**
 * The header every game screen wears: its name, and the way back.
 *
 * @module
 * @remarks
 * Shared so one rule holds everywhere: **"Spielesammlung" always sits top
 * right, beside the game's name.** It is the way out of a game, and a way out
 * that moves around - third button in the second row on a phone, last in one
 * long row on a desktop - is one you have to hunt for every time.
 *
 * That is why it is not simply the last of the buttons. On a narrow screen the
 * row of tools drops below the title and the way back stays up beside the name;
 * once there is room for everything on one line, the whole header reads as it
 * always did.
 */
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";
import type { GameRules } from "./game-rules";
import { RulesButton } from "./rules-button";

/** Props of {@link GameHeader}. */
export type GameHeaderProps = {
  /** The game's name. */
  readonly title: string;
  /** The line under the name - a tagline, the round, whatever fits. */
  readonly subtitle?: ReactNode;
  /**
   * The game's own buttons, in the order they should read.
   *
   * @remarks
   * They may wrap freely among themselves; only the way back is pinned.
   */
  readonly children?: ReactNode;
  /**
   * The game's rules, if it has them written down.
   *
   * @remarks
   * Pinned beside the way back rather than left among the game's own buttons,
   * for the same reason the way back is: looking the rules up is something you
   * do in a hurry, mid-game, and a button that sits somewhere different in
   * every game is one you have to find first.
   */
  readonly rules?: GameRules;
};

/**
 * Renders a game screen's header.
 *
 * @param props - name, subtitle and the game's own buttons
 * @returns the header element
 */
export function GameHeader({
  title,
  subtitle,
  children,
  rules,
}: GameHeaderProps): ReactElement {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-start">
      {/* The name and the way back are one unbreakable row. From `lg` this
          wrapper dissolves (`contents`) and all three parts share the single
          header row, in the order the `order-*` classes give them. It must
          never be a wrapping flex container: a flex line breaks before it
          shrinks, so wrapping would drop the way back to a second row exactly
          when the header gets tight - which is when it is needed most. */}
      <div className="flex items-start gap-3 lg:contents">
        {/* `mr-auto` pushes the rest right; `min-w-0` lets a long name wrap
            inside itself rather than shove the way back off the line. */}
        <div className="mr-auto min-w-0">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle !== undefined && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
        {/* The full sentence only where there is room for it. On a phone the
            two extra words push the game's own subtitle into a second line, so
            there the destination alone has to do - the accessible name stays
            the long one either way. */}
        {rules !== undefined && <RulesButton rules={rules} />}
        <Link
          href="/"
          data-testid="collection-link"
          aria-label={COLLECTION_TEXTS.backToCollection}
          className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 lg:order-3 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span aria-hidden="true" className="sm:hidden">
            {COLLECTION_TEXTS.title}
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            {COLLECTION_TEXTS.backToCollection}
          </span>
        </Link>
      </div>

      {children !== undefined && (
        // Its own row under the title on a phone; from `lg` it slots between
        // the name and the way back. The buttons may wrap among themselves.
        <nav className="flex flex-wrap items-center justify-end gap-2 lg:order-2">
          {children}
        </nav>
      )}
    </header>
  );
}
