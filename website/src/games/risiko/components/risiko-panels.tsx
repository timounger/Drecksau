/**
 * The two things beside the map: your cards, and how everyone stands.
 *
 * @module
 * @remarks
 * The standings are the score, and in this edition the score is **territories**,
 * not points - both win conditions count them and the truce card is decided on
 * them. So they are a list of bars rather than a table of numbers: how close
 * somebody is to the target is the only question anybody is asking, and a bar
 * answers it without arithmetic.
 *
 * The cards are the other half. This edition prices them in stars off a table,
 * which means the hand is a small optimisation problem every turn - and one
 * that is much easier to see than to do in your head. So picking cards shows
 * the running star total and what it would buy, and the button says the number
 * rather than the word.
 */
"use client";

import type { ReactElement } from "react";
import { armyOf } from "@/games/risiko/engine/armies";
import {
  MAX_TRADE_STARS,
  isTradable,
  starsIn,
  starsOf,
  unitsForCards,
} from "@/games/risiko/engine/cards";
import { continentOf, territoryOf } from "@/games/risiko/engine/map";
import { SELF_NAME } from "@/games/risiko/engine/setup";
import {
  TOTAL_TERRITORIES,
  continentsHeld,
  countHeld,
  unitsOf,
  type RisikoGame,
} from "@/games/risiko/engine/state";
import { RISIKO_TEXTS as T } from "@/games/risiko/i18n/texts";

/** A full bar, as a percentage. */
const FULL = 100;

/** Props of {@link RisikoStandings}. */
export type RisikoStandingsProps = {
  readonly game: RisikoGame;
  readonly mySeat: number | null;
};

/**
 * Renders who holds how much of the world.
 *
 * @param props - the game and who is reading it
 * @returns the standings element
 */
export function RisikoStandings({
  game,
  mySeat,
}: RisikoStandingsProps): ReactElement {
  const goal = game.target > 0 ? game.target : TOTAL_TERRITORIES;
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-sm font-semibold">{T.standings}</h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {game.target > 0 ? T.targetIs(game.target) : T.targetWorld}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {game.players.map((player, seat) => {
          const held = countHeld(game, seat);
          const army = armyOf(seat);
          const continents = continentsHeld(game, seat)
            .map((id) => continentOf(id)?.name ?? id)
            .join(", ");
          return (
            <li
              key={seat}
              data-testid={`rk-stand-${seat}`}
              className={`flex flex-col gap-0.5 rounded-lg px-2 py-1 ${
                seat === game.active && game.phase !== "gameOver"
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 rounded-full border border-black/30"
                  style={{ background: army.colour }}
                />
                <span
                  className={`font-semibold ${player.alive ? "" : "line-through opacity-50"}`}
                >
                  {seat === mySeat && player.name !== SELF_NAME
                    ? `${player.name} (du)`
                    : player.name}
                </span>
                {player.isNeutral && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {T.neutral}
                  </span>
                )}
                <span className="ml-auto whitespace-nowrap tabular-nums">
                  {T.held(held)}
                </span>
                <span className="text-xs whitespace-nowrap text-zinc-500 tabular-nums dark:text-zinc-400">
                  {T.unitsOnBoard(unitsOf(game, seat))}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  /* A hairline, because the white army's bar is white: on the
                     light panel it was a bar you could not see at all. */
                  className="h-full rounded-full border border-black/15"
                  style={{
                    width: `${Math.min(FULL, (held / goal) * FULL)}%`,
                    background: army.colour,
                  }}
                />
              </div>
              {continents !== "" && (
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  {T.yourContinents(continents)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Props of {@link RisikoCards}. */
export type RisikoCardsProps = {
  readonly game: RisikoGame;
  readonly mySeat: number;
  /** Which cards are ticked, held by the screen so a trade survives a redraw. */
  readonly picked: readonly string[];
  readonly onPick: (card: string) => void;
  readonly onTrade: (cards: readonly string[]) => void;
};

/**
 * Renders your hand and what it would buy.
 *
 * @param props - the game, your seat and the current selection
 * @returns the cards element
 */
export function RisikoCards({
  game,
  mySeat,
  picked,
  onPick,
  onTrade,
}: RisikoCardsProps): ReactElement {
  const hand = game.players[mySeat]?.cards ?? [];
  const stars = starsIn(picked);
  const worth = unitsForCards(picked);
  const canTrade = game.phase === "reinforce" && isTradable(picked);

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-sm font-semibold">{T.cardsTitle}</h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.cardsCount(hand.length)} {"\u{00B7}"}{" "}
          {T.deckLeft(game.deck.length)}
        </span>
      </div>

      {hand.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.cardsNone}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {hand.map((card) => {
            const on = picked.includes(card);
            return (
              <button
                key={card}
                type="button"
                onClick={() => onPick(card)}
                data-testid={`rk-card-${card}`}
                className={`cursor-pointer rounded-lg border px-2 py-1 text-left text-xs ${
                  on
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40"
                    : "border-zinc-300 dark:border-zinc-700"
                }`}
              >
                <span className="block font-semibold">
                  {territoryOf(card)?.name ?? card}
                </span>
                <span
                  aria-hidden
                  className="text-amber-600 dark:text-amber-300"
                >
                  {"\u{2605}".repeat(starsOf(card))}
                </span>
                <span className="sr-only">{T.stars(starsOf(card))}</span>
              </button>
            );
          })}
        </div>
      )}

      {picked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm tabular-nums">
            {T.stars(stars)}
            {stars > MAX_TRADE_STARS ? "" : ` \u{2192} ${worth}`}
          </span>
          <button
            type="button"
            disabled={!canTrade}
            onClick={() => onTrade(picked)}
            data-testid="rk-trade"
            className="cursor-pointer rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {T.tradeFor(worth)}
          </button>
          {!canTrade && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {game.phase === "reinforce" ? T.tradeNothing : T.tradeHint}
            </span>
          )}
        </div>
      )}
      {picked.length === 0 && hand.length > 0 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.tradeHint}
        </p>
      )}
    </section>
  );
}

/** Props of {@link RisikoBattle}. */
export type RisikoBattleProps = {
  readonly game: RisikoGame;
  readonly mySeat: number | null;
};

/**
 * Renders the dice of the last attack.
 *
 * @param props - the game and who is reading it
 * @returns the panel, or null when nothing has been rolled
 * @remarks
 * Shown as the dice themselves rather than as a sentence, because that is what
 * everybody at a table looks at: which black beat which red. The pairing is the
 * whole rule, so the pairs are drawn as pairs.
 */
export function RisikoBattle({
  game,
  mySeat,
}: RisikoBattleProps): ReactElement | null {
  const battle = game.lastBattle;
  return battle === null ? null : (
    <section
      data-testid="rk-battle"
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <span className="font-semibold">{T.battle}</span>
      <span>
        {territoryOf(battle.from)?.name} {"\u{2192}"}{" "}
        {territoryOf(battle.to)?.name}
      </span>
      <span className="flex items-center gap-1">
        {battle.attack.map((die, at) => (
          <Die key={`a${at}`} value={die} dark />
        ))}
        <span className="px-1 text-xs text-zinc-500">gegen</span>
        {battle.defence.map((die, at) => (
          <Die key={`d${at}`} value={die} dark={false} />
        ))}
      </span>
      <span className="text-zinc-600 dark:text-zinc-300">
        {mySeat === game.active
          ? T.battleCost(battle.attackerLost, battle.defenderLost)
          : T.battleCost(battle.defenderLost, battle.attackerLost)}
      </span>
      <span
        className={
          battle.taken
            ? "font-semibold text-emerald-700 dark:text-emerald-300"
            : "text-zinc-500 dark:text-zinc-400"
        }
      >
        {battle.taken ? T.battleTaken : T.battleHeld}
      </span>
    </section>
  );
}

/** One die, in the colour the rulebook gives it. */
function Die({
  value,
  dark,
}: {
  readonly value: number;
  readonly dark: boolean;
}): ReactElement {
  return (
    <span
      aria-hidden
      className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs font-bold tabular-nums ${
        dark
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-red-700 bg-red-600 text-white"
      }`}
    >
      {value}
    </span>
  );
}
