/**
 * The main menu: a new game with map size, AI rivals and peace (and the
 * seed while the cheat mode is on), continue the automatic save, load a
 * slot, settings and statistics.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";
import { seedFromText } from "@/games/imperavis/engine/random";
import { DEFAULT_AI, MAX_AI } from "@/games/imperavis/engine/players";
import type { GameSettings, MapSize } from "@/games/imperavis/engine/types";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import { SIZE_NAMES, TEXTS as T } from "@/games/imperavis/i18n/texts";
import { TUTORIAL } from "@/games/imperavis/i18n/tutorial-texts";
import type { SavedGame } from "@/games/imperavis/storage/save-store";
import { Crest, Icon } from "./icons";
import { Btn } from "./ui";
import "./imperavis.css";

/** Seeds drawn by the dice button stay below this. */
const SEED_RANGE = 1000000;

/**
 * The seed of a new game: the typed one while it can be seen, else a fresh
 * random one, so every game without the cheat gets a world of its own.
 *
 * @param typed - whether the typed seed counts
 * @param text - what was typed
 * @returns the seed
 */
function seedOf(typed: boolean, text: string): number {
  return typed
    ? seedFromText(text === "" ? "1" : text)
    : Math.floor(Math.random() * SEED_RANGE);
}

/** Props of {@link MainMenu}. */
type MainMenuProps = {
  readonly hasAutosave: boolean;
  readonly slots: readonly (SavedGame | null)[];
  /** Stored games that cannot be loaded (0 is the automatic save). */
  readonly unreadable: readonly number[];
  /** The seed can be seen and typed only while the cheat mode is on. */
  readonly showSeed: boolean;
  readonly onNew: (seed: number, size: MapSize, settings: GameSettings) => void;
  readonly onContinue: () => void;
  readonly onLoad: (slot: number) => void;
};

/**
 * Renders the main menu.
 *
 * @param props - what there is to load, and the actions
 * @returns the menu
 */
export function MainMenu({
  hasAutosave,
  slots,
  unreadable,
  showSeed,
  onNew,
  onContinue,
  onLoad,
}: MainMenuProps): ReactElement {
  const [seed, setSeed] = useState(() =>
    String(Math.floor(Math.random() * SEED_RANGE)),
  );
  const [size, setSize] = useState<MapSize>("medium");
  const [rivals, setRivals] = useState(DEFAULT_AI);
  const [peaceful, setPeaceful] = useState(false);
  const [guided, setGuided] = useState(true);
  const [showLoad, setShowLoad] = useState(false);
  return (
    <div
      data-theme="dark"
      className="imp-root relative overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_50%_0%,#2c4a5e_0%,#14222d_55%,#0c141b_100%)] p-3 sm:p-6"
      data-testid="imp-menu"
    >
      <div className="mx-auto mb-4 flex max-w-3xl flex-col items-center gap-1 text-center">
        <Crest color={0xd6a21e} size={52} />
        <p className="imp-title text-3xl tracking-[0.2em] sm:text-4xl">
          {T.title}
        </p>
        <p className="imp-muted text-sm">{HUD.menuSubtitle}</p>
        <div className="imp-rule mt-1 w-64 max-w-full" />
      </div>
      <div className="mx-auto grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        <section className="imp-panel imp-open p-4">
          <h2 className="imp-title mb-1 flex items-center gap-2 text-lg">
            <Icon name="ship" size={20} /> {T.newGame}
          </h2>
          <p className="imp-muted mb-3 text-xs">{HUD.newGameHint}</p>
          {showSeed && (
            <>
              <label
                className="imp-muted mb-1 block text-sm"
                htmlFor="imp-seed"
              >
                {T.seed}
              </label>
              <div className="mb-1 flex gap-2">
                <input
                  id="imp-seed"
                  data-testid="imp-seed"
                  value={seed}
                  onChange={(event) => setSeed(event.target.value)}
                  className="imp-input w-full px-3 py-1.5 text-sm"
                />
                <Btn
                  onClick={() =>
                    setSeed(String(Math.floor(Math.random() * SEED_RANGE)))
                  }
                >
                  {T.randomSeed}
                </Btn>
              </div>
              <p className="imp-muted mb-3 text-xs">{T.seedHint}</p>
            </>
          )}
          <p className="imp-muted mb-1 text-sm">{T.mapSize}</p>
          <div className="mb-4 flex gap-2">
            {(["small", "medium", "large"] as const).map((value) => (
              <Btn
                key={value}
                active={size === value}
                onClick={() => setSize(value)}
                testId={`imp-size-${value}`}
              >
                {SIZE_NAMES[value]}
              </Btn>
            ))}
          </div>
          <p className="imp-muted mb-1 text-sm">{T.rivals}</p>
          <div className="mb-1 flex gap-2">
            {Array.from({ length: MAX_AI + 1 }, (_, count) => (
              <Btn
                key={count}
                active={rivals === count}
                onClick={() => setRivals(count)}
                testId={`imp-rivals-${count}`}
              >
                {count}
              </Btn>
            ))}
          </div>
          <p className="imp-muted mb-3 text-xs">{T.rivalsHint}</p>
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={peaceful}
              onChange={(event) => setPeaceful(event.target.checked)}
              data-testid="imp-peaceful"
              className="accent-[#b38c4c]"
            />
            <span>
              {T.peaceful}
              <span className="imp-muted block text-xs">{T.peacefulHint}</span>
            </span>
          </label>
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={guided}
              onChange={(event) => setGuided(event.target.checked)}
              data-testid="imp-guided"
              className="accent-[#b38c4c]"
            />
            <span>
              {TUTORIAL.menuOption}
              <span className="imp-muted block text-xs">
                {TUTORIAL.menuHint}
              </span>
            </span>
          </label>
          <button
            type="button"
            data-testid="imp-start"
            onClick={() =>
              onNew(seedOf(showSeed, seed), size, {
                aiCount: rivals,
                peaceful,
                guided,
              })
            }
            className="imp-btn imp-btn-primary imp-display w-full py-2.5 text-base font-semibold"
          >
            {T.start}
          </button>
        </section>
        <section className="imp-panel imp-open flex flex-col gap-2 p-4">
          <h2 className="imp-title mb-1 flex items-center gap-2 text-lg">
            <Icon name="scroll" size={20} /> {HUD.savedGames}
          </h2>
          <button
            type="button"
            data-testid="imp-continue"
            disabled={!hasAutosave}
            onClick={onContinue}
            className="imp-btn imp-display justify-start px-4 py-2.5 text-left font-semibold"
          >
            {T.continueGame}
          </button>
          <button
            type="button"
            data-testid="imp-load"
            disabled={slots.every((slot) => slot === null)}
            onClick={() => setShowLoad((open) => !open)}
            className="imp-btn imp-display justify-start px-4 py-2.5 text-left font-semibold"
          >
            {T.load}
          </button>
          {showLoad && (
            <div className="flex flex-col gap-1 pl-2">
              {slots.map((slot, index) => (
                <Btn
                  key={index}
                  disabled={slot === null}
                  onClick={() => onLoad(index + 1)}
                  testId={`imp-load-${index + 1}`}
                >
                  {T.slot(index + 1)}:{" "}
                  {slot === null
                    ? unreadable.includes(index + 1)
                      ? T.unreadableSave
                      : T.emptySlot
                    : T.savedAt(new Date(slot.savedAt).toLocaleString("de-DE"))}
                </Btn>
              ))}
            </div>
          )}
          {unreadable.length > 0 && (
            <p className="text-xs text-[var(--imp-warn)]">{T.unreadableHint}</p>
          )}
          <Link
            href="/imperavis/einstellungen"
            className="imp-btn imp-display justify-start px-4 py-2.5 font-semibold"
          >
            {T.settings}
          </Link>
          <Link
            href="/imperavis/statistik"
            className="imp-btn imp-display justify-start px-4 py-2.5 font-semibold"
          >
            {T.statistics}
          </Link>
        </section>
      </div>
    </div>
  );
}
