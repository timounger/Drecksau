/**
 * Settings page: switches for how the app behaves.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import {
  MAX_PLAYER_NAME_LENGTH,
  prefersReducedMotion,
} from "@/lib/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/lib/settings/settings-store";
import { CARD_THEMES } from "@/assets/cards/themes";
import { CARD_THEME_LABELS, SETTINGS_TEXTS } from "@/i18n/translations";

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function SettingsView(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{SETTINGS_TEXTS.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {SETTINGS_TEXTS.subtitle}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {SETTINGS_TEXTS.backToGame}
        </Link>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <label className="flex cursor-pointer flex-col gap-1">
          <span className="font-semibold">{SETTINGS_TEXTS.cardTheme}</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {SETTINGS_TEXTS.cardThemeHint}
          </span>
          <select
            data-testid="select-card-theme"
            value={settings.cardTheme}
            onChange={(event) =>
              updateSettings({
                ...settings,
                cardTheme: event.target.value as (typeof CARD_THEMES)[number],
              })
            }
            className="mt-1 w-56 cursor-pointer rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {CARD_THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {CARD_THEME_LABELS[theme]}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <label className="flex cursor-text flex-col gap-1">
          <span className="font-semibold">{SETTINGS_TEXTS.playerName}</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {SETTINGS_TEXTS.playerNameHint}
          </span>
          <input
            type="text"
            data-testid="input-player-name"
            value={settings.playerName}
            maxLength={MAX_PLAYER_NAME_LENGTH}
            placeholder={SETTINGS_TEXTS.playerNamePlaceholder}
            onChange={(event) =>
              updateSettings({ ...settings, playerName: event.target.value })
            }
            className="mt-1 w-56 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <p className="mt-3 rounded-lg bg-zinc-100 p-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {SETTINGS_TEXTS.expansionNotice}
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <Toggle
          name="expansion"
          label={SETTINGS_TEXTS.expansion}
          hint={SETTINGS_TEXTS.expansionHint}
          checked={settings.isExpansionEnabled}
          onChange={(checked) =>
            updateSettings({ ...settings, isExpansionEnabled: checked })
          }
        />
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Toggle
            name="defense"
            label={SETTINGS_TEXTS.defenseCards}
            hint={SETTINGS_TEXTS.defenseCardsHint}
            checked={settings.areDefenseCardsEnabled}
            onChange={(checked) =>
              updateSettings({ ...settings, areDefenseCardsEnabled: checked })
            }
          />
        </div>
        <p className="mt-3 rounded-lg bg-zinc-100 p-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {SETTINGS_TEXTS.expansionNotice}
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <Toggle
          name="animations"
          label={SETTINGS_TEXTS.animations}
          hint={SETTINGS_TEXTS.animationsHint}
          checked={settings.areAnimationsEnabled}
          onChange={(checked) =>
            updateSettings({ ...settings, areAnimationsEnabled: checked })
          }
        />

        {/* Only shown to people the default actually differs for. */}
        {prefersReducedMotion() && (
          <p className="mt-3 rounded-lg bg-zinc-100 p-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {SETTINGS_TEXTS.reducedMotionNotice}
          </p>
        )}
      </section>
    </div>
  );
}

/** Props of {@link Toggle}. */
type ToggleProps = {
  /** Used for the test hook - not shown. */
  readonly name: string;
  readonly label: string;
  readonly hint: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
};

/** One labelled switch with an explanation. */
function Toggle({
  name,
  label,
  hint,
  checked,
  onChange,
}: ToggleProps): ReactElement {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="font-semibold">{label}</span>
        <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
          {hint}
        </span>
      </span>
      <input
        type="checkbox"
        data-testid={`toggle-${name}`}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-emerald-500"
      />
    </label>
  );
}
