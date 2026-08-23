/**
 * What the player has, and what everybody else is showing.
 *
 * @module
 * @remarks
 * Two panels with two different jobs. Your own is the whole truth - every card
 * in your hand, every development card, and which of them you may still play
 * this turn. The standings are what is on the table: how many cards somebody
 * holds is public, *which* cards are not, and a Siegpunkt card is nobody's
 * business until it wins the game. So the standings count the points you can
 * see, and say so.
 */
"use client";

import type { ReactElement } from "react";
import { Button } from "@/games/catan/components/catan-actions";
import { ownHarbours } from "@/games/catan/engine/moves";
import { COLOUR_INK } from "@/games/catan/engine/setup";
import { harbourPoints } from "@/games/catan/engine/variants";
import {
  DEV_COST,
  RESOURCES,
  actingSeat,
  covers,
  hiddenPoints,
  playing,
  openPoints,
  pointsOf,
  type CatanGame,
  type CatanMove,
} from "@/games/catan/engine/state";
import {
  CARD_NAMES,
  CARD_TEXTS,
  CATAN_TEXTS as T,
  SORT_NAMES,
} from "@/games/catan/i18n/texts";

/** Your resources. */
export function CatanHand({
  game,
  mySeat,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
}): ReactElement {
  const hand = game.players[mySeat].hand;
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">{T.hand}</h2>
      <div className="flex flex-wrap gap-1.5" data-testid="ct-hand">
        {RESOURCES.map((sort) => (
          <span
            key={sort}
            data-testid={`ct-hand-${sort}`}
            className={`rounded-lg border px-2 py-1 text-xs font-semibold tabular-nums ${
              hand[sort] === 0
                ? "border-zinc-200 opacity-40 dark:border-zinc-800"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {SORT_NAMES[sort]} {hand[sort]}
          </span>
        ))}
      </div>
      <Harbours game={game} mySeat={mySeat} />
    </section>
  );
}

/** Which harbours you can use. */
function Harbours({
  game,
  mySeat,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
}): ReactElement {
  const docks = ownHarbours(game, mySeat);
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid="ct-harbours">
      <span className="text-xs font-semibold opacity-70">{T.harbours}</span>
      {docks.length === 0 ? (
        <span className="text-xs opacity-60">{T.noHarbours}</span>
      ) : (
        docks.map((want, index) => (
          <span
            key={index}
            className="rounded-lg bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900 dark:bg-sky-900 dark:text-sky-100"
          >
            {want === null ? T.harbourAny : T.harbourOf(SORT_NAMES[want])}
          </span>
        ))
      )}
    </div>
  );
}

/** Your development cards, and which of them may be played now. */
export function CatanCards({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement {
  const me = game.players[mySeat];
  const canPlay =
    actingSeat(game) === mySeat &&
    !game.playedDev &&
    (game.phase === "roll" || game.phase === "trade");
  const buyable = game.phase === "trade" && actingSeat(game) === mySeat;
  // Greyed rather than hidden, the same way the board only lights what you can
  // pay for: the cost stays visible as something to save towards.
  const affordable = covers(me.hand, DEV_COST) && game.stack.length > 0;
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">{T.cards}</h2>
      {me.deck.length === 0 && me.fresh.length === 0 && (
        <span className="text-xs opacity-60">{T.noCards}</span>
      )}
      <ul className="flex flex-col gap-1" data-testid="ct-devcards">
        {me.deck.map((card, index) => (
          <li
            key={`old-${index}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-zinc-300 px-2 py-1 dark:border-zinc-700"
          >
            <span className="flex flex-col">
              <span className="text-xs font-semibold">{CARD_NAMES[card]}</span>
              <span className="text-[10px] opacity-70">{CARD_TEXTS[card]}</span>
            </span>
            {card !== "siegpunkt" && canPlay && (
              <Button
                label={T.play}
                testId={`ct-play-${card}`}
                onClick={() => onMove({ kind: "play", card })}
              />
            )}
          </li>
        ))}
        {me.fresh.map((card, index) => (
          <li
            key={`new-${index}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-zinc-300 px-2 py-1 opacity-70 dark:border-zinc-700"
          >
            <span className="flex flex-col">
              <span className="text-xs font-semibold">{CARD_NAMES[card]}</span>
              <span className="text-[10px]">{T.freshCard}</span>
            </span>
          </li>
        ))}
      </ul>
      <span className="flex flex-wrap items-center gap-2">
        {buyable && (
          <Button
            label={T.buyCard}
            off={!affordable}
            testId="ct-buy"
            onClick={() => onMove({ kind: "buy" })}
          />
        )}
        <span className="text-[10px] opacity-60">{T.cardsLeft(game.stack.length)}</span>
      </span>
    </section>
  );
}

/** Everybody, and what they are showing. */
export function CatanStandings({
  game,
  mySeat,
}: {
  readonly game: CatanGame;
  readonly mySeat: number | null;
}): ReactElement {
  const over = game.phase === "gameOver";
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">{T.standings}</h2>
      <ul className="flex flex-col gap-1.5" data-testid="ct-standings">
        {game.players.map((player, seat) => (
          <li
            key={seat}
            data-testid={`ct-seat-${seat}`}
            className={`flex flex-col gap-0.5 rounded-lg px-2 py-1 ${
              seat === actingSeat(game) && !over
                ? "bg-zinc-100 dark:bg-zinc-800"
                : ""
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <span
                className="inline-block h-3.5 w-3.5 rounded-full border border-black/40"
                style={{ backgroundColor: COLOUR_INK[player.colour] }}
              />
              {player.name}
              {seat === mySeat && <span className="text-[10px] opacity-60">(du)</span>}
              <span className="ml-auto tabular-nums">
                {T.points(over ? pointsOf(game, seat) : openPoints(game, seat))}
              </span>
            </span>
            <span className="flex flex-wrap gap-x-2 text-[10px] opacity-70">
              <span>{T.handCount(player.cards)}</span>
              <span>{T.devCount(player.deck.length + player.fresh.length)}</span>
              <span>{T.knightCount(player.knights)}</span>
              {playing(game, "haefen") && (
                <span>{T.harbourPoints(harbourPoints(game, seat))}</span>
              )}
              {game.longest === seat && <span>{T.routeTile}</span>}
              {game.army === seat && <span>{T.armyTile}</span>}
              {game.harbourTile === seat && <span>{T.harbourTile}</span>}
              {seat === mySeat && hiddenPoints(player) > 0 && !over && (
                <span>+{hiddenPoints(player)} verdeckt</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {game.longest !== null && (
        <span className="text-[10px] opacity-60">
          {T.routeTile}: {T.routeLength(game.longestLen)}
        </span>
      )}
    </section>
  );
}
