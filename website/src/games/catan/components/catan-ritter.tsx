/**
 * *Städte & Ritter*: the tableau, the barbarians, and the cards in hand.
 *
 * @module
 * @remarks
 * Three panels, because the expansion asks three questions a player looks at
 * every turn and the printed game has nowhere to put them:
 *
 * - **how far are my cities built**, which decides what I draw and what I win,
 * - **how close are the barbarians**, and would we hold them right now,
 * - **what have I got in hand**, since the cards are played and not kept.
 *
 * The tableau is the one that most wants to look like the printed one: three
 * columns, five steps each, the marker where you stand and the price of the
 * next step on the button. Everything on it is asked of the referee - the same
 * {@link canImprove} the rules run on decides whether a step can be taken - so
 * a button that is there is a step that will be allowed.
 */
"use client";

import type { ReactElement } from "react";
import { Button } from "@/games/catan/components/catan-actions";
import {
  BARBARIAN_STEPS,
  BENEFIT_LEVEL,
  KNIGHT_NAMES,
  LEVEL_NAMES,
  METRO_LEVEL,
  TOP_LEVEL,
  TRACKS,
  TRACK_GOODS,
  TRACK_NAMES,
  COMMODITY_NAMES,
  drawLimit,
  type Track,
} from "@/games/catan/engine/knights";
import {
  PROGRESS_NAMES,
  PROGRESS_TEXTS,
  isPointCard,
} from "@/games/catan/engine/progress";
import {
  barbarianFight,
  canImprove,
  improvePrice,
} from "@/games/catan/engine/ritter";
import { COLOUR_INK } from "@/games/catan/engine/setup";
import {
  playingRitter,
  type CatanGame,
  type CatanMove,
} from "@/games/catan/engine/state";
import { CATAN_TEXTS as T } from "@/games/catan/i18n/texts";

/**
 * The Fortschritt-Tableau: three tracks of five steps.
 *
 * @param props - the game, who is reading it and where moves go
 * @returns the panel, or null outside a game of Städte & Ritter
 */
export function CatanTableau({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement | null {
  return !playingRitter(game) ? null : (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">{T.tableau}</h2>
      <div className="grid grid-cols-3 gap-2" data-testid="ct-tableau">
        {TRACKS.map((track) => (
          <TrackColumn
            key={track}
            game={game}
            mySeat={mySeat}
            track={track}
            onMove={onMove}
          />
        ))}
      </div>
    </section>
  );
}

/** One of the three tracks, bottom step first. */
function TrackColumn({
  game,
  mySeat,
  track,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly track: Track;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement {
  const level = game.players[mySeat].tableau[track];
  const metro = game.metro[track];
  const can = canImprove(game, mySeat, track);
  return (
    <div className="flex flex-col gap-1" data-testid={`ct-track-${track}`}>
      <span className="text-xs font-bold">{TRACK_NAMES[track]}</span>
      <span className="text-[10px] opacity-70">
        {COMMODITY_NAMES[TRACK_GOODS[track]]}
      </span>
      <ol className="flex flex-col-reverse gap-0.5">
        {LEVEL_NAMES[track].map((name, index) => (
          <li
            key={name}
            className={`rounded px-1 py-0.5 text-[10px] ${
              index < level
                ? "bg-emerald-100 font-semibold dark:bg-emerald-900"
                : "opacity-60"
            }`}
          >
            {name}
            {/* The two steps that do more than raise the die: the benefit and
                the metropolis. Marked on the step rather than explained
                elsewhere, because that is where somebody is looking when they
                decide whether to pay for it. */}
            {index + 1 === BENEFIT_LEVEL && (
              <span title={T.benefitOf(track)}> ★</span>
            )}
            {index + 1 === METRO_LEVEL && <span title={T.metroHint}> ♛</span>}
          </li>
        ))}
      </ol>
      <span className="text-[10px] opacity-70">
        {level === 0 ? T.drawsNever : T.drawsAt(drawLimit(level))}
      </span>
      {metro !== null && (
        <span
          className="flex items-center gap-1 text-[10px] font-semibold"
          title={T.metroHint}
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full border border-black/40"
            style={{
              backgroundColor: COLOUR_INK[game.players[metro.seat].colour],
            }}
          />
          {T.metroHeld(game.players[metro.seat].name)}
        </span>
      )}
      {level < TOP_LEVEL && (
        <Button
          label={T.improveFor(improvePrice(game, mySeat, track))}
          testId={`ct-improve-${track}`}
          off={!can}
          onClick={() => onMove({ kind: "improve", track })}
        />
      )}
    </div>
  );
}

/**
 * The barbarian ship, and whether Catan would hold it today.
 *
 * @param props - the game
 * @returns the panel, or null outside a game of Städte & Ritter
 * @remarks
 * The two strengths are shown **before** the landing, not after, because that
 * is the whole decision the expansion asks every turn: is it worth a Getreide
 * to wake another knight? A number you only see once it is too late is not a
 * number anybody can act on.
 */
export function CatanBarbarians({
  game,
}: {
  readonly game: CatanGame;
}): ReactElement | null {
  const fight = barbarianFight(game);
  const safe = fight.defence >= fight.attack;
  return !playingRitter(game) ? null : (
    <section
      className="flex flex-col gap-1.5 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
      data-testid="ct-barbarians"
    >
      <h2 className="text-sm font-semibold">{T.barbarians}</h2>
      <div className="flex items-center gap-1">
        {Array.from({ length: BARBARIAN_STEPS }, (unused, step) => (
          <span
            key={step}
            className={`h-2 flex-1 rounded-full ${
              step < game.barbarian
                ? "bg-red-600"
                : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>
      <span className="text-xs tabular-nums">
        {T.barbarianOdds(fight.defence, fight.attack)}{" "}
        <span
          className={`ml-1.5 font-semibold ${
            safe
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-red-700 dark:text-red-300"
          }`}
        >
          {safe ? T.wouldHold : T.wouldFall}
        </span>
      </span>
      {!game.landed && (
        <span className="text-[10px] opacity-70">{T.robberPinned}</span>
      )}
    </section>
  );
}

/**
 * The Fortschrittskarten in hand.
 *
 * @param props - the game, who is reading it and where moves go
 * @returns the panel, or null outside a game of Städte & Ritter
 * @remarks
 * The two Siegpunkt cards are shown apart and without a button: they are laid
 * face up the moment they are drawn and are never played. Everything else is a
 * button, and it is disabled rather than hidden while it cannot be played -
 * a card you hold that has gone quiet needs explaining, and the tooltip is
 * where the explanation is.
 */
export function CatanProgress({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement | null {
  const held = game.players[mySeat].progress;
  const playable = game.phase === "trade";
  return !playingRitter(game) ? null : (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">{T.progressCards}</h2>
      {held.length === 0 ? (
        <span className="text-xs opacity-60">{T.noProgress}</span>
      ) : (
        <div className="flex flex-wrap gap-1.5" data-testid="ct-progress">
          {held.map((card, index) =>
            isPointCard(card) ? (
              <span
                key={`${card}-${index}`}
                title={PROGRESS_TEXTS[card]}
                className="rounded-lg bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-950 dark:bg-amber-900 dark:text-amber-100"
              >
                {PROGRESS_NAMES[card]}
              </span>
            ) : (
              <Button
                key={`${card}-${index}`}
                label={PROGRESS_NAMES[card]}
                testId={`ct-play-${card}`}
                off={!playable && card !== "alchemie"}
                onClick={() => onMove({ kind: "progress", card })}
              />
            ),
          )}
        </div>
      )}
      <KnightList game={game} mySeat={mySeat} />
    </section>
  );
}

/** What knights this seat has out, and whether they are awake. */
function KnightList({
  game,
  mySeat,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
}): ReactElement | null {
  const mine = game.garrison
    .map((knight, at) => (knight?.owner === mySeat ? { knight, at } : null))
    .filter((each) => each !== null);
  return mine.length === 0 ? null : (
    <div
      className="flex flex-wrap items-center gap-1.5"
      data-testid="ct-knights"
    >
      <span className="text-xs font-semibold opacity-70">{T.knights}</span>
      {mine.map(({ knight, at }) => (
        <span
          key={at}
          title={KNIGHT_NAMES[knight.level - 1]}
          className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
            knight.active
              ? "bg-emerald-200 text-emerald-950 dark:bg-emerald-800 dark:text-emerald-50"
              : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
          }`}
        >
          {"❰".repeat(knight.level)}{" "}
          {knight.active ? T.knightAwake : T.knightAsleep}
        </span>
      ))}
    </div>
  );
}
