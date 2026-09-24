/**
 * The light/dark switch, in the corner of every page.
 *
 * @module
 * @remarks
 * Mounted once in the root layout rather than added to each header. There are
 * some fifty screens - game tables, lobbies, settings, statistics - and about
 * as many headers, several of which a game wrote for itself. A switch that has
 * to be remembered in each of them is a switch that will be missing from the
 * next page somebody adds.
 *
 * Two buttons rather than one that toggles: a single button can only say "the
 * opposite of now", and one has to read the icon to work out which way round
 * it is. Here both are on screen and the one in use is marked, so there is
 * nothing to work out.
 *
 * And two rather than three. The third used to be "whatever the system says",
 * which is what everybody gets anyway until they touch the switch - see
 * ../lib/theme/theme-store. Nothing is stored until then, the device decides,
 * and the first click is what ends that.
 */
"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import type { Theme } from "@/lib/theme/theme-boot";
import {
  activeTheme,
  serverActiveTheme,
  setTheme,
  subscribeTheme,
} from "@/lib/theme/theme-store";

/** German labels of the switch. */
const T = {
  group: "Helligkeit",
  light: "Hell",
  dark: "Dunkel",
} as const;

/** The two settings, in the order they read: light, then dark. */
const CHOICES: readonly {
  readonly value: Theme;
  readonly label: string;
  readonly icon: ReactElement;
}[] = [
  { value: "light", label: T.light, icon: <SunIcon /> },
  { value: "dark", label: T.dark, icon: <MoonIcon /> },
];

/**
 * Renders the switch.
 *
 * @returns the control, pinned to the bottom right of the window
 * @remarks
 * Bottom right, because every header on this site is at the top and the games
 * put their own buttons there. Below the end-of-game overlay in the stacking
 * order, which takes no clicks anyway, so nothing is ever trapped behind it.
 */
export function ThemeToggle(): ReactElement {
  // Null until the browser has answered: the prerendered HTML knows neither
  // what was chosen nor what the device prefers, and a button lit in the
  // meantime is one lit at random. Nothing is marked for that moment, which
  // costs no room and claims nothing.
  const active = useSyncExternalStore(
    subscribeTheme,
    activeTheme,
    serverActiveTheme,
  );

  return (
    <div
      role="group"
      aria-label={T.group}
      data-testid="theme-toggle"
      className="fixed right-3 bottom-3 z-40 flex gap-0.5 rounded-full border border-zinc-300 bg-white/90 p-0.5 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90"
    >
      {CHOICES.map((choice) => (
        <button
          key={choice.value}
          type="button"
          title={choice.label}
          aria-label={choice.label}
          aria-pressed={choice.value === active}
          data-testid={`theme-${choice.value}`}
          onClick={() => setTheme(choice.value)}
          className={`cursor-pointer rounded-full p-1.5 ${
            choice.value === active
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {choice.icon}
        </button>
      ))}
    </div>
  );
}

/** The shared look of both icons. */
const ICON = {
  viewBox: "0 0 24 24",
  className: "h-4 w-4",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A sun. */
function SunIcon(): ReactElement {
  return (
    <svg {...ICON} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  );
}

/** A moon. */
function MoonIcon(): ReactElement {
  return (
    <svg {...ICON} aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  );
}
