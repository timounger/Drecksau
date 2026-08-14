/**
 * The race track, the bets on the table and everybody's purse.
 *
 * @module
 * @remarks
 * The stacks are the picture. A camel that is being carried is drawn **above**
 * the one carrying it, and that is not decoration - it is the standing. Every
 * misjudged bet in this game comes from reading a heap as "those two are
 * level", so the heap has to look like what it is: a queue standing on top of
 * itself, the leader at the top.
 */
"use client";

import type { ReactElement } from "react";
import {
  CAMELS,
  CAMEL_INK,
  CAMEL_LABELS,
  TRACK_SPACES,
  standings,
  type Camel,
  type CamelUpGame,
} from "@/games/camel-up/engine/state";
import { CAMEL_TEXTS as T } from "@/games/camel-up/i18n/texts";

/** Props of {@link CamelUpTrack}. */
export type CamelUpTrackProps = {
  readonly game: CamelUpGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  /** Seats the computer took over after their player left. */
  readonly botSeats?: readonly number[];
};

/** Camels whose label needs dark text to be read on their own colour. */
const PALE: readonly Camel[] = ["gelb", "weiss"];

/**
 * Renders the track, the bets and the players.
 *
 * @param props - the race and who is reading it
 * @returns the board element
 */
export function CamelUpTrack({
  game,
  mySeat,
  botSeats = [],
}: CamelUpTrackProps): ReactElement {
  const order = standings(game.track);
  return (
    <section className="flex flex-col gap-4">
      <Track game={game} />
      <div className="grid gap-3 lg:grid-cols-2">
        <LegBets game={game} />
        <RaceBets game={game} order={order} />
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {game.players.map((player, seat) => (
          <li key={player.name + seat}>
            <PurseCard
              game={game}
              seat={seat}
              isMe={seat === mySeat}
              isBotSeat={botSeats.includes(seat)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The sixteen spaces, with whatever is standing on each of them. */
function Track({ game }: { readonly game: CamelUpGame }): ReactElement {
  const past = game.track.slice(TRACK_SPACES).flat();
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{T.trackTitle}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.trackHint}
        </p>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {game.track.slice(0, TRACK_SPACES).map((stack, space) => (
          <Space key={space} game={game} space={space} stack={stack} />
        ))}
        {/* Stuck to the right-hand edge: the track is wider than a phone and
            scrolls, and the one thing that must never scroll out of sight is
            the finish - it is where the winning camel ends up standing. */}
        <div
          data-testid="camel-finish"
          className="sticky right-0 flex min-w-12 shrink-0 flex-col justify-end rounded-lg border-2 border-dashed border-emerald-500 bg-emerald-50 p-1 dark:bg-emerald-950"
        >
          <span className="mb-1 flex flex-col-reverse gap-0.5">
            {past.map((camel) => (
              <CamelChip key={camel} camel={camel} />
            ))}
          </span>
          <span className="text-center text-[0.6rem] font-semibold text-emerald-700 dark:text-emerald-300">
            {T.finishLine}
          </span>
        </div>
      </div>
    </div>
  );
}

/** One space of the track: its number, any tile, and its stack. */
function Space({
  game,
  space,
  stack,
}: {
  readonly game: CamelUpGame;
  readonly space: number;
  readonly stack: readonly Camel[];
}): ReactElement {
  const tile = game.tiles.find((entry) => entry.space === space);
  return (
    <div
      data-testid={`camel-space-${space}`}
      className="flex min-w-12 shrink-0 flex-col justify-end rounded-lg border border-zinc-200 p-1 dark:border-zinc-800"
    >
      {/* Bottom of the stack at the bottom: the one on top is the one in front. */}
      <span className="mb-1 flex flex-col-reverse gap-0.5">
        {stack.map((camel) => (
          <CamelChip key={camel} camel={camel} />
        ))}
      </span>
      {tile !== undefined && (
        <span
          className={`mb-1 rounded px-1 text-center text-[0.6rem] font-bold ${
            tile.kind === "oasis"
              ? "bg-emerald-200 text-emerald-900"
              : "bg-amber-200 text-amber-900"
          }`}
          title={`${game.players[tile.seat].name}: ${tile.kind === "oasis" ? T.tileOasis : T.tileMirage}`}
        >
          {tile.kind === "oasis" ? "+1" : "-1"}
        </span>
      )}
      <span className="text-center text-[0.6rem] text-zinc-400">
        {space + 1}
      </span>
    </div>
  );
}

/** One camel, in its own colour. */
function CamelChip({ camel }: { readonly camel: Camel }): ReactElement {
  return (
    <span
      data-testid={`camel-${camel}`}
      className={`rounded px-1 py-0.5 text-center text-[0.65rem] font-bold ${
        PALE.includes(camel)
          ? "text-zinc-900 ring-1 ring-zinc-300"
          : "text-white"
      }`}
      style={{ backgroundColor: CAMEL_INK[camel] }}
    >
      {CAMEL_LABELS[camel]}
    </span>
  );
}

/** What is still to be had on each camel for this leg. */
function LegBets({ game }: { readonly game: CamelUpGame }): ReactElement {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
      <h2 className="text-sm font-semibold">{T.legBetsTitle}</h2>
      <ul className="flex flex-wrap gap-1.5">
        {CAMELS.map((camel) => {
          const stack = game.legBets[camel];
          return (
            <li key={camel} className="flex items-center gap-1 text-xs">
              <CamelChip camel={camel} />
              <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                {stack.length === 0 ? T.noCardsLeft : stack.join(" · ")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** How many cards are lying face down on each of the two piles. */
function RaceBets({
  game,
  order,
}: {
  readonly game: CamelUpGame;
  readonly order: readonly Camel[];
}): ReactElement {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
      <h2 className="text-sm font-semibold">{T.raceBetsTitle}</h2>
      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        {T.winnerPile(game.winnerBets.length)} ·{" "}
        {T.loserPile(game.loserBets.length)}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-1 text-xs">
        {order.map((camel, place) => (
          <span key={camel} className="flex items-center gap-1">
            <span className="text-zinc-400 tabular-nums">{place + 1}.</span>
            <CamelChip camel={camel} />
          </span>
        ))}
      </p>
    </div>
  );
}

/** One player: what they have and what they have committed. */
function PurseCard({
  game,
  seat,
  isMe,
  isBotSeat,
}: {
  readonly game: CamelUpGame;
  readonly seat: number;
  readonly isMe: boolean;
  readonly isBotSeat: boolean;
}): ReactElement {
  const player = game.players[seat];
  const onTurn = game.turn === seat && game.phase !== "gameOver";
  return (
    <article
      data-testid={`camel-player-${seat}`}
      className={`flex h-full flex-col gap-1 rounded-2xl border p-2.5 text-sm ${
        onTurn
          ? "border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <header className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-semibold">
          {player.name}
          {isMe && ` (${T.youShort})`}
        </span>
        {(player.isBot || isBotSeat) && (
          <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            {T.botBadge}
          </span>
        )}
        <span className="text-lg font-bold tabular-nums">{player.coins}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.coinsShort}
        </span>
      </header>
      {(isMe || player.legCards.length > 0) && (
        <ul className="flex flex-wrap gap-1">
          {player.legCards.map((card, index) => (
            <li
              key={`${card.camel}-${index}`}
              className="flex items-center gap-0.5"
            >
              <CamelChip camel={card.camel} />
              <span className="text-xs tabular-nums text-zinc-500">
                {card.value}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-auto text-xs text-zinc-500 dark:text-zinc-400">
        {player.tileAt === null
          ? T.tileInHand
          : T.tilePlaced(player.tileAt + 1)}{" "}
        · {T.raceCardsLeft(player.raceCards.length)}
      </p>
    </article>
  );
}
