/**
 * Hitster settings: how many computers, how well they know their music, and
 * how many cards win.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { TARGETS, type Difficulty } from "@/games/hitster/engine/state";
import { DIFFICULTY_NAMES } from "@/games/hitster/i18n/texts";
import {
  COMPUTER_COUNTS,
  type HitsterSettings,
} from "@/games/hitster/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/games/hitster/settings/settings-store";
import { COLLECTION_TEXTS, STATS_TEXTS } from "@/i18n/collection-texts";

/** The look of a chosen and an unchosen option. */
const CHOSEN =
  "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-900 dark:bg-fuchsia-950/40 dark:text-fuchsia-100";
const UNCHOSEN = "border-zinc-300 dark:border-zinc-700";

/** What each difficulty means, in a line. */
const DIFFICULTY_HINTS: Readonly<Record<Difficulty, string>> = {
  easy: "Der Computer verschätzt sich oft um viele Jahre und kennt kaum einen Titel.",
  medium: "Der Computer liegt meist ein paar Jahre daneben.",
  hard: "Der Computer kennt fast jedes Jahr und viele Titel.",
};

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function HitsterSettingsView(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const change = (next: Partial<HitsterSettings>) =>
    updateSettings({ ...settings, ...next });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
      <header className="flex items-start gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">{COLLECTION_TEXTS.settings}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gilt nur in diesem Browser, ab dem nächsten Spiel.
          </p>
        </div>
        <Link
          href="/hitster"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {STATS_TEXTS.backToGame}
        </Link>
      </header>

      <Section title="Computer-Gegner" hint="Wie viele Computer mitspielen.">
        {COMPUTER_COUNTS.map((count) => (
          <Option
            key={count}
            chosen={settings.computers === count}
            onClick={() => change({ computers: count })}
            testId={`hit-computers-${String(count)}`}
          >
            {String(count)}
          </Option>
        ))}
      </Section>

      <Section title="Stärke" hint={DIFFICULTY_HINTS[settings.difficulty]}>
        {(["easy", "medium", "hard"] as const).map((difficulty) => (
          <Option
            key={difficulty}
            chosen={settings.difficulty === difficulty}
            onClick={() => change({ difficulty })}
            testId={`hit-difficulty-${difficulty}`}
          >
            {DIFFICULTY_NAMES[difficulty]}
          </Option>
        ))}
      </Section>

      <Section
        title="Ziel"
        hint="Wie viele Karten in der Zeitleiste gewinnen - in der Schachtel 10."
      >
        {TARGETS.map((target) => (
          <Option
            key={target}
            chosen={settings.target === target}
            onClick={() => change({ target })}
            testId={`hit-target-${String(target)}`}
          >
            {`${String(target)} Karten`}
          </Option>
        ))}
      </Section>
    </div>
  );
}

/** A titled group of options. */
function Section({
  title,
  hint,
  children,
}: {
  readonly title: string;
  readonly hint: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

/** One option button. */
function Option({
  chosen,
  onClick,
  testId,
  children,
}: {
  readonly chosen: boolean;
  readonly onClick: () => void;
  readonly testId: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={chosen}
      className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold ${chosen ? CHOSEN : UNCHOSEN}`}
    >
      {children}
    </button>
  );
}
