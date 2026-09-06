/**
 * The screen you play GTA on: the canvas, the heads-up display, the overlays.
 *
 * @module
 */
"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { useGtaGame, type Heads } from "@/games/gta/hooks/use-gta-game";
import { GTA_RULES } from "@/games/gta/i18n/rules";
import { GTA_TEXTS as T } from "@/games/gta/i18n/texts";
import { MAX_STARS } from "@/games/gta/engine/types";
import { VIEW_HEIGHT, VIEW_WIDTH } from "@/games/gta/components/projection";
import { DISTRICTS } from "@/games/gta/engine/setup";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/** The look of a link in the header. */
const LINK =
  "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * Renders the game.
 *
 * @returns the screen
 */
export function GtaScreen(): ReactElement {
  const {
    heads,
    attach,
    onPointer,
    onFire,
    turbo,
    toggleTurbo,
    god,
    toggleGod,
    restart,
    carryOn,
  } = useGtaGame();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={T.title} subtitle={T.tagline} rules={GTA_RULES}>
        <button
          type="button"
          data-testid="gta-new"
          onClick={restart}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.newGame}
        </button>
        <button
          type="button"
          data-testid="gta-turbo"
          aria-pressed={turbo}
          onClick={(event) => {
            toggleTurbo();
            // Off the button again, or Enter would toggle instead of getting
            // the player out of the car.
            event.currentTarget.blur();
          }}
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
            turbo
              ? "border-amber-500 bg-amber-100 font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
              : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {T.turbo}
        </button>
        <button
          type="button"
          data-testid="gta-god"
          aria-pressed={god}
          onClick={(event) => {
            toggleGod();
            event.currentTarget.blur();
          }}
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
            god
              ? "border-pink-500 bg-pink-100 font-semibold text-pink-900 dark:bg-pink-900/40 dark:text-pink-100"
              : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {T.god}
        </button>
        <Link href="/gta/einstellungen" className={LINK}>
          {COLLECTION_TEXTS.settings}
        </Link>
        <Link href="/gta/statistik" className={LINK}>
          {COLLECTION_TEXTS.statistics}
        </Link>
      </GameHeader>

      <HeadsUp heads={heads} />

      <div className="relative overflow-hidden rounded-2xl border border-zinc-300 dark:border-zinc-700">
        <canvas
          ref={attach}
          width={VIEW_WIDTH}
          height={VIEW_HEIGHT}
          data-testid="gta-canvas"
          onPointerMove={onPointer}
          onPointerDown={(event) => {
            onPointer(event);
            onFire(true);
          }}
          onPointerUp={() => onFire(false)}
          onPointerLeave={() => onFire(false)}
          onContextMenu={(event) => event.preventDefault()}
          className="block w-full cursor-crosshair bg-zinc-900"
          style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
        />
        {heads.phase !== "playing" && (
          <Overlay heads={heads} onCarryOn={carryOn} onRestart={restart} />
        )}
      </div>

      <div data-testid="gta-quarters" className="flex flex-wrap gap-2 text-xs">
        {heads.quarters.map((quarter) => (
          <span
            key={quarter.name}
            className={`rounded-lg border px-2 py-1 ${
              quarter.owned
                ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {quarter.name}{" "}
            {quarter.owned ? T.ownedMark : `${quarter.done}/${quarter.needed}`}
          </span>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
          <h2 className="mb-1 text-sm font-semibold">{T.controls}</h2>
          <ul className="flex flex-col gap-0.5 text-zinc-600 dark:text-zinc-400">
            <li>
              <b>W A S D</b> oder Pfeiltasten: zu Fuß in alle vier Richtungen,
              im Auto Gas, Bremse und Lenkung
            </li>
            <li>
              <b>Maus</b>: zu Fuß schaust du dorthin - <b>Klick</b> schießt
            </li>
            <li>
              <b>Mausrad</b>: Waffe wechseln. Zu Beginn nur die Faust - alles
              andere liegt in der Stadt herum
            </li>
            <li>
              <b>E</b> oder <b>Enter</b>: ein- und aussteigen
            </li>
            <li>Gelber Ring: abholen. Grüner Ring: abliefern.</li>
            <li>Blauer Ring: Lackiererei - Fahndung weg, kostet Geld.</li>
            <li>
              <b>Shift</b> halten oder der Knopf <b>{T.turbo}</b> oben: zu Fuß
              zehnfach, im Auto dreifach
            </li>
          </ul>
        </section>
        <section className="rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
          <h2 className="mb-1 text-sm font-semibold">{T.log}</h2>
          <ul data-testid="gta-log" className="flex flex-col gap-0.5">
            {heads.log.map((line, at) => (
              <li
                key={`${at}-${line}`}
                className="text-zinc-600 dark:text-zinc-400"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** Money, respect, stars, health, and what the job wants. */
function HeadsUp({ heads }: { readonly heads: Heads }): ReactElement {
  return (
    <div
      data-testid="gta-heads"
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Money, health and the weapon are drawn in the corner of the picture
          itself - see drawStatus. What is left here is what does not fit in a
          corner: the search, the seat, the job and the quarters. */}
      <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
        {T.respect(heads.respect)}
      </span>
      <span className="flex items-center gap-1">
        <span className="text-zinc-500 dark:text-zinc-400">{T.wanted}</span>
        <span data-testid="gta-stars" className="tracking-tight">
          {Array.from({ length: MAX_STARS }, (unused, at) =>
            at < heads.stars ? "★" : "☆",
          ).join("")}
        </span>
      </span>
      <span className="text-zinc-500 dark:text-zinc-400">
        {heads.inCar ? T.driving : T.onFoot}
      </span>
      <span className="ml-auto flex items-center gap-2">
        <span data-testid="gta-job" className="font-semibold">
          {heads.jobText === "" ? T.noJob : heads.jobText}
        </span>
        {heads.jobLeft !== null && (
          <span className="tabular-nums text-amber-700 dark:text-amber-300">
            {T.jobLeft(heads.jobLeft)}
          </span>
        )}
        <span className="text-zinc-500 dark:text-zinc-400">
          {T.districts(heads.owned, DISTRICTS.length)}
        </span>
      </span>
    </div>
  );
}

/** What is shown over the city when the day ends one way or the other. */
function Overlay({
  heads,
  onCarryOn,
  onRestart,
}: {
  readonly heads: Heads;
  readonly onCarryOn: () => void;
  readonly onRestart: () => void;
}): ReactElement {
  const won = heads.phase === "won";
  const title = won ? T.won : heads.phase === "busted" ? T.busted : T.wasted;
  const text = won
    ? T.wonText
    : heads.phase === "busted"
      ? T.bustedText
      : T.wastedText;
  return (
    <div
      data-testid="gta-overlay"
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center text-white"
    >
      <h2 className="text-3xl font-black tracking-wide">{title}</h2>
      <p className="max-w-md text-sm">{text}</p>
      <button
        type="button"
        data-testid="gta-carry-on"
        onClick={won ? onRestart : onCarryOn}
        className="cursor-pointer rounded-lg bg-white px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
      >
        {won ? T.newGame : T.carryOn}
      </button>
    </div>
  );
}
