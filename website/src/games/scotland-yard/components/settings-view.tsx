/**
 * Scotland Yard settings: your side, the table size, the variant and the
 * fugitive's name for a game against the computer.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import {
  BOBBIES,
  MIN_DETECTIVES,
  MISTER_X_NAMES,
  introPieces,
  type Role,
  type Variant,
} from "@/games/scotland-yard/engine/state";
import {
  ROLE_NAMES,
  VARIANT_HINTS,
  VARIANT_NAMES,
} from "@/games/scotland-yard/i18n/texts";
import {
  PLAYER_COUNTS,
  type ScotlandYardSettings,
} from "@/games/scotland-yard/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/games/scotland-yard/settings/settings-store";
import { COLLECTION_TEXTS, STATS_TEXTS } from "@/i18n/collection-texts";

/** The look of a chosen and an unchosen option. */
const CHOSEN =
  "border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100";
const UNCHOSEN = "border-zinc-300 dark:border-zinc-700";

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function ScotlandYardSettingsView(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const change = (next: Partial<ScotlandYardSettings>) =>
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
          href="/scotland-yard"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {STATS_TEXTS.backToGame}
        </Link>
      </header>

      <Section
        title="Deine Seite"
        hint="Die andere Seite spielt der Computer. Als Detektive ziehst du alle Figuren deiner Seite."
      >
        {(["detectives", "misterX"] as const satisfies readonly Role[]).map(
          (role) => (
            <Option
              key={role}
              chosen={settings.role === role}
              onClick={() => change({ role })}
              testId={`sy-role-${role}`}
            >
              {role === "misterX" ? settings.misterXName : ROLE_NAMES[role]}
            </Option>
          ),
        )}
      </Section>

      <Section title="Spieler am Tisch" hint={pieceHint(settings)}>
        {PLAYER_COUNTS.map((count) => (
          <Option
            key={count}
            chosen={settings.players === count}
            onClick={() => change({ players: count })}
            testId={`sy-players-${String(count)}`}
          >
            {String(count)}
          </Option>
        ))}
      </Section>

      <Section title="Variante" hint={VARIANT_HINTS[settings.variant]}>
        {(["standard", "intro"] as const satisfies readonly Variant[]).map(
          (variant) => (
            <Option
              key={variant}
              chosen={settings.variant === variant}
              onClick={() => change({ variant })}
              testId={`sy-variant-${variant}`}
            >
              {VARIANT_NAMES[variant]}
            </Option>
          ),
        )}
      </Section>

      <Section
        title="Der Flüchtige heißt"
        hint="Nur der Name - die Regeln sind dieselben."
      >
        {MISTER_X_NAMES.map((name) => (
          <Option
            key={name}
            chosen={settings.misterXName === name}
            onClick={() => change({ misterXName: name })}
            testId={`sy-name-${name}`}
          >
            {name}
          </Option>
        ))}
      </Section>

      <Section
        title="Hilfe für Detektive"
        hint="Markiert auf dem Plan jede Station, auf der Mister X nach seinen Tickets stehen kann."
      >
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.showHidingPlaces}
            onChange={(event) =>
              change({ showHidingPlaces: event.target.checked })
            }
            data-testid="sy-hiding"
            className="h-4 w-4 accent-sky-600"
          />
          Mögliche Verstecke zeigen
        </label>
      </Section>
    </div>
  );
}

/** What a table of this size plays with, in words. */
function pieceHint(settings: ScotlandYardSettings): string {
  const players = settings.players;
  let line: string;
  if (settings.variant === "intro") {
    line = `Die Detektive ziehen ${String(introPieces(players))} Figuren, ohne Bobbys.`;
  } else {
    const detectives = Math.max(players - 1, MIN_DETECTIVES);
    const bobbies = BOBBIES[players] ?? 0;
    line = `Mister X gegen ${String(detectives)} Detektive${
      bobbies > 0
        ? ` und ${String(bobbies)} Bobby${bobbies > 1 ? "s" : ""}`
        : ""
    }.`;
  }
  return line;
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
