/**
 * Die Kartenübersicht: Level, Karten, Medaillen und die drei Schwierigkeiten.
 *
 * @module
 * @remarks
 * Wie im Vorbild der erste Bildschirm: oben, wie weit man ist und welcher Affe
 * als Nächstes kommt, darunter die Karten - jede mit ihrem Bild, wie schwer
 * sie ist und welche Medaillen man auf ihr schon hat. Ein Klick auf eine
 * Karte klappt die drei Schwierigkeiten auf, ein Klick auf eine davon fängt
 * an.
 */
"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { drawMap } from "@/games/bloons-td/components/render";
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  type Difficulty,
} from "@/games/bloons-td/engine/difficulty";
import { MAPS, MAP_ORDER, type MapId } from "@/games/bloons-td/engine/map";
import { BLOONS, type BloonKind } from "@/games/bloons-td/engine/bloons";
import { BOSS_TIERS } from "@/games/bloons-td/engine/waves";
import {
  UNLOCK,
  isUnlocked,
  xpFor,
  type Progress,
} from "@/games/bloons-td/engine/progress";
import { TOWERS, TOWER_ORDER } from "@/games/bloons-td/engine/towers";
import { BLOONS_TEXTS } from "@/games/bloons-td/i18n/texts";

/** Die Medaillen der drei Schwierigkeiten: Bronze, Silber, Gold. */
const MEDALS: Readonly<Record<Difficulty, string>> = {
  easy: "\u{1F949}",
  medium: "\u{1F948}",
  hard: "\u{1F947}",
};

/** Wie die Karten nach ihrer Schwierigkeit eingefärbt sind. */
const LEVEL_STYLE = {
  beginner: "bg-emerald-600",
  intermediate: "bg-sky-600",
  advanced: "bg-amber-600",
  expert: "bg-red-600",
} as const;

/** Hundert, für Prozent. */
const PERCENT = 100;

/** Wie groß das Kartenbild gezeichnet wird, in Bildpunkten. */
const PREVIEW = 200;

/** Props of {@link MapMenu}. */
export type MapMenuProps = {
  readonly progress: Progress;
  readonly level: number;
  readonly onStart: (
    map: MapId,
    difficulty: Difficulty,
    boss: BloonKind | null,
  ) => void;
  /** Den Fortschritt löschen. */
  readonly onReset: () => void;
};

/**
 * Die Übersicht.
 *
 * @param props - der Fortschritt und was beim Start passiert
 * @returns die Kartenübersicht
 */
export function MapMenu({
  progress,
  level,
  onStart,
  onReset,
}: MapMenuProps): ReactElement {
  const [open, setOpen] = useState<MapId | null>(null);
  const [asking, setAsking] = useState(false);
  const fresh = progress.xp === 0 && Object.keys(progress.medals).length === 0;
  const have = TOWER_ORDER.filter((kind) => isUnlocked(kind, level)).length;
  const next = TOWER_ORDER.find((kind) => !isUnlocked(kind, level)) ?? null;
  const from = xpFor(level);
  const to = xpFor(level + 1);
  const share = next === null ? 1 : (progress.xp - from) / (to - from);

  return (
    <div className="flex flex-col gap-4" data-testid="btd-menu">
      {/* Wie weit man ist: Level, Erfahrung bis zum nächsten, und was dann
          kommt. */}
      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold" data-testid="btd-level">
            {BLOONS_TEXTS.level(level)}
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {BLOONS_TEXTS.unlockedCount(have, TOWER_ORDER.length)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-amber-500"
            style={{ width: `${Math.round(Math.min(1, share) * PERCENT)}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {next === null
            ? BLOONS_TEXTS.xpMax
            : `${BLOONS_TEXTS.xpProgress(progress.xp - from, to - from)} · ${BLOONS_TEXTS.nextUnlock(TOWERS[next].name, UNLOCK[next])}`}
        </p>
        {/* **Zurücksetzen fragt nach**: Es löscht Level, Freischaltungen und
            alle Medaillen, und das lässt sich nicht rückgängig machen. */}
        {!fresh && !asking && (
          <button
            type="button"
            data-testid="btd-reset"
            onClick={() => setAsking(true)}
            className="self-start cursor-pointer text-xs text-zinc-500 underline hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
          >
            {BLOONS_TEXTS.reset}
          </button>
        )}
        {asking && (
          <div
            role="alertdialog"
            aria-labelledby="btd-reset-question"
            className="flex flex-wrap items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-2 text-sm dark:border-red-800 dark:bg-red-950/40"
          >
            <span id="btd-reset-question" className="flex-1">
              {BLOONS_TEXTS.resetQuestion}
            </span>
            <button
              type="button"
              data-testid="btd-reset-yes"
              onClick={() => {
                onReset();
                setAsking(false);
              }}
              className="cursor-pointer rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500"
            >
              {BLOONS_TEXTS.resetYes}
            </button>
            <button
              type="button"
              data-testid="btd-reset-no"
              autoFocus
              onClick={() => setAsking(false)}
              className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {BLOONS_TEXTS.resetNo}
            </button>
          </div>
        )}
      </section>

      <h2 className="text-sm font-semibold">{BLOONS_TEXTS.mapsTitle}</h2>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1 lg:grid-cols-4">
        {MAP_ORDER.map((map) => (
          <MapCard
            key={map}
            map={map}
            medals={progress.medals[map] ?? []}
            open={open === map}
            onOpen={() => setOpen(open === map ? null : map)}
            onStart={(difficulty, boss) => onStart(map, difficulty, boss)}
          />
        ))}
      </div>
    </div>
  );
}

/** Props of {@link MapCard}. */
type MapCardProps = {
  readonly map: MapId;
  readonly medals: readonly Difficulty[];
  readonly open: boolean;
  readonly onOpen: () => void;
  readonly onStart: (difficulty: Difficulty, boss: BloonKind | null) => void;
};

/**
 * Die Bosse der Boss-Herausforderung, in der Reihenfolge des Vorbilds.
 *
 * @remarks
 * Gespielt wird auf Mittel. Die Ballons sind dieselben wie im normalen Spiel,
 * dazu kommt der gewählte Boss in den Runden 40, 60, 80, 100 und 120.
 */
const BOSSES: readonly BloonKind[] = [
  "bloonarius",
  "lych",
  "vortex",
  "dreadbloon",
  "phayze",
  "blastapopoulos",
];

/** Eine Karte in der Übersicht, mit ihren Schwierigkeiten, wenn sie offen ist. */
function MapCard({
  map,
  medals,
  open,
  onOpen,
  onStart,
}: MapCardProps): ReactElement {
  const info = MAPS[map];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        data-testid={`btd-map-${map}`}
        aria-expanded={open}
        onClick={onOpen}
        className="flex cursor-pointer flex-col text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
      >
        <div className="relative">
          <MapPreview map={map} />
          <span
            className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${LEVEL_STYLE[info.level]}`}
          >
            {BLOONS_TEXTS.mapLevels[info.level]}
          </span>
          {/* Die Medaillen: eine je geschaffter Schwierigkeit, die anderen
              als blasser Platzhalter, damit man sieht, was noch fehlt. */}
          <span className="absolute top-2 right-2 flex gap-0.5 rounded-full bg-white/80 px-1.5 py-0.5 text-sm dark:bg-zinc-900/80">
            {DIFFICULTY_ORDER.map((difficulty) => (
              <span
                key={difficulty}
                title={BLOONS_TEXTS.medal(DIFFICULTIES[difficulty].name)}
                className={
                  medals.includes(difficulty) ? "" : "opacity-25 grayscale"
                }
              >
                {MEDALS[difficulty]}
              </span>
            ))}
          </span>
        </div>
        <span className="px-3 pt-2 text-sm font-bold">{info.name}</span>
        <span className="px-3 pb-3 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
          {info.note}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-1.5 border-t border-zinc-200 p-3 dark:border-zinc-800">
          {DIFFICULTY_ORDER.map((difficulty) => {
            const setting = DIFFICULTIES[difficulty];
            return (
              <button
                key={difficulty}
                type="button"
                data-testid={`btd-start-${map}-${difficulty}`}
                onClick={() => onStart(difficulty, null)}
                className="flex cursor-pointer flex-col rounded-lg border border-zinc-300 px-3 py-1.5 text-left hover:bg-emerald-50 dark:border-zinc-700 dark:hover:bg-emerald-950/40"
              >
                <span className="flex items-center justify-between text-sm font-semibold">
                  {setting.name}
                  <span>
                    {medals.includes(difficulty) ? MEDALS[difficulty] : ""}
                  </span>
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {BLOONS_TEXTS.difficultyInfo(
                    setting.lives,
                    setting.goal,
                    setting.price,
                  )}
                </span>
              </button>
            );
          })}
          {/* **Bosse haben ihren eigenen Modus**, wie im Vorbild: Im normalen
              Spiel kommt keiner. */}
          <span className="pt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {BLOONS_TEXTS.bossChallenge}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {BLOONS_TEXTS.bossChallengeInfo(
              BOSS_TIERS.map((tier) => tier.round),
            )}
          </span>
          <div className="grid grid-cols-2 gap-1">
            {BOSSES.map((boss) => (
              <button
                key={boss}
                type="button"
                data-testid={`btd-boss-${map}-${boss}`}
                onClick={() => onStart("medium", boss)}
                className="cursor-pointer rounded-lg border border-zinc-300 px-2 py-1 text-xs font-semibold hover:bg-red-50 dark:border-zinc-700 dark:hover:bg-red-950/40"
              >
                {BLOONS[boss].name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Das Bild einer Karte, mit demselben Zeichner wie im Spiel. */
function MapPreview({ map }: { readonly map: MapId }): ReactElement {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (canvas !== null && ctx !== null) {
      const dots = window.devicePixelRatio;
      canvas.width = PREVIEW * dots;
      canvas.height = PREVIEW * dots;
      ctx.setTransform(dots, 0, 0, dots, 0, 0);
      drawMap(ctx, map, PREVIEW);
    }
  }, [map]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="block aspect-square w-full"
    />
  );
}
