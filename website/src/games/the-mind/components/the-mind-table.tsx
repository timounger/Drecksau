/**
 * The table: the pile, everybody's hand size, and your own cards.
 *
 * @module
 * @remarks
 * The screen has to say exactly two things and no more: what is on the pile,
 * and what you hold. Everything else is the game - and the game is what nobody
 * is allowed to tell you.
 *
 * So the other seats show a **count** and nothing else, there is no "who is
 * next", no timer, no hint. The one thing they do show is a raised hand for the
 * shuriken, because that is the one signal the rules actually permit.
 */
"use client";

import type { ReactElement, ReactNode } from "react";
import {
  cardsLeft,
  shurikenAgreed,
  topCard,
  UNKNOWN_CARD,
  type MindGame,
  type MindMove,
} from "@/games/the-mind/engine/state";
import { ComputerBadge } from "@/online/computer-badge";
import { MIND_TEXTS as T } from "@/games/the-mind/i18n/texts";

/** Props of {@link MindTable}. */
export type MindTableProps = {
  readonly game: MindGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: MindMove) => void;
  /** Seats the computer took over after their player left. */
  readonly botSeats?: readonly number[];
};

/**
 * Renders the whole table.
 *
 * @param props - the game and who is reading it
 * @returns the table element
 */
export function MindTable({
  game,
  mySeat,
  onMove,
  botSeats = [],
}: MindTableProps): ReactElement {
  const me = mySeat === null ? null : game.players[mySeat];
  const waiting = game.players.filter(
    (player) => player.hand.length > 0 && !player.wantsShuriken,
  ).length;

  return (
    <section className="flex flex-col gap-4">
      <Status game={game} />

      {game.lastMistake !== null && game.phase === "playing" && (
        <Banner tone="bad">
          <strong>{T.mistakeTitle}</strong>{" "}
          {T.mistakeLine(
            game.lastMistake.played,
            game.lastMistake.lost.join(", "),
          )}{" "}
          {T.lifeLost}
        </Banner>
      )}

      <Pile game={game} />

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {game.players.map((player, seat) => (
          <li
            key={player.name + seat}
            data-testid={`mind-seat-${seat}`}
            className={`flex items-center gap-2 rounded-2xl border p-3 text-sm ${
              seat === mySeat
                ? "border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <span className="min-w-0 flex-1 truncate font-semibold">
              {player.name}
              {botSeats.includes(seat) && <ComputerBadge />}
            </span>
            {player.wantsShuriken && (
              <span
                title={T.handsUp}
                className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900"
              >
                ✋ {T.handsUp}
              </span>
            )}
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {player.hand.length === 0
                ? T.done
                : T.cardsInHand(player.hand.length)}
            </span>
          </li>
        ))}
      </ul>

      {me !== null && (
        <MyHand
          game={game}
          me={me}
          waiting={waiting}
          onMove={onMove}
          ready={shurikenAgreed(game)}
        />
      )}
    </section>
  );
}

/** Level, lives, shuriken and how much is still out there. */
function Status({ game }: { readonly game: MindGame }): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="font-semibold">{T.level(game.level, game.levels)}</span>
      <span data-testid="mind-lives" className="text-lg" title={T.lives}>
        {"❤️".repeat(game.lives) || "—"}
      </span>
      <span
        data-testid="mind-shurikens"
        className="text-lg"
        title={T.shurikens}
      >
        {"⭐".repeat(game.shurikens) || "—"}
      </span>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        {T.cardsLeft(cardsLeft(game))}
      </span>
    </div>
  );
}

/** What has been played, and what was lost along the way. */
function Pile({ game }: { readonly game: MindGame }): ReactElement {
  const top = topCard(game);
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {top === 0 ? T.pileEmpty : T.pileTop}
      </span>
      <span
        data-testid="mind-top"
        className="rounded-2xl bg-zinc-900 px-8 py-4 text-5xl font-bold tabular-nums text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        {top === 0 ? "—" : top}
      </span>
      {game.pile.length > 1 && (
        <p className="text-xs tabular-nums text-zinc-400">
          {game.pile.slice(0, -1).join(" · ")}
        </p>
      )}
      {game.lost.length > 0 && (
        <p className="text-xs tabular-nums text-red-600 line-through dark:text-red-400">
          {game.lost.join(" · ")}
        </p>
      )}
    </div>
  );
}

/** Your own cards, and the two things you may do with them. */
function MyHand({
  game,
  me,
  waiting,
  ready,
  onMove,
}: {
  readonly game: MindGame;
  readonly me: MindGame["players"][number];
  readonly waiting: number;
  readonly ready: boolean;
  readonly onMove: (move: MindMove) => void;
}): ReactElement {
  const playable = game.phase === "playing" && me.hand.length > 0;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">{T.yourHand}</h2>
      {me.hand.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {T.handEmpty}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {me.hand.map((card, index) => (
            // Keyed by place as well as value: a hand still waiting for its
            // private copy is all placeholders, and those are not unique.
            <li key={`${index}-${card}`}>
              <span
                data-testid={
                  card === UNKNOWN_CARD
                    ? "mind-card-hidden"
                    : `mind-card-${card}`
                }
                className={`block rounded-xl border px-4 py-3 text-2xl font-bold tabular-nums ${
                  card === UNKNOWN_CARD
                    ? "border-dashed border-zinc-300 text-zinc-300 dark:border-zinc-700 dark:text-zinc-600"
                    : index === 0
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100"
                      : "border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                {card === UNKNOWN_CARD ? T.cardUnknown : card}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="mind-play"
          disabled={!playable}
          onClick={() => onMove({ kind: "play" })}
          className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {playable && me.hand[0] !== UNKNOWN_CARD
            ? T.playCard(me.hand[0])
            : T.playLowest}
        </button>
        <button
          type="button"
          data-testid="mind-shuriken"
          disabled={!playable || game.shurikens === 0}
          onClick={() => onMove({ kind: "shuriken" })}
          className="cursor-pointer rounded-lg border border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {game.shurikens === 0
            ? T.shurikenNone
            : me.wantsShuriken
              ? T.shurikenWithdraw
              : T.shurikenAsk}
        </button>
        {me.wantsShuriken && !ready && (
          <span className="self-center text-xs text-zinc-500 dark:text-zinc-400">
            {T.shurikenWaiting(waiting)}
          </span>
        )}
      </div>
    </div>
  );
}

/** A coloured note across the table. */
function Banner({
  children,
  tone,
}: {
  readonly children: ReactNode;
  readonly tone: "bad";
}): ReactElement {
  return (
    <p
      data-testid="mind-mistake"
      className={`rounded-xl px-4 py-2 text-sm ${
        tone === "bad"
          ? "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200"
          : ""
      }`}
    >
      {children}
    </p>
  );
}
