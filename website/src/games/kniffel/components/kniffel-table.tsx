/**
 * The table: the dice, the throws left, and everybody's block.
 *
 * @module
 * @remarks
 * The block is the game, so it shows what a free box **would** score with the
 * dice as they lie - not to make the choice for you, but because that is what
 * a player does anyway: run a finger down the column and compare. What it will
 * not hide is a nought: a box that scores nothing says so, and says that
 * writing there crosses it out.
 */
"use client";

import type { ReactElement } from "react";
import { legalMoves } from "@/games/kniffel/engine/moves";
import {
  BONUS_TARGET,
  CATEGORY_LABELS,
  LOWER,
  UPPER,
  bonusOf,
  lowerSum,
  scoreOf,
  sheetTotal,
  upperSum,
  type Category,
  type KniffelGame,
  type KniffelMove,
} from "@/games/kniffel/engine/state";
import { KNIFFEL_TEXTS as T } from "@/games/kniffel/i18n/texts";

/** Props of {@link KniffelTable}. */
export type KniffelTableProps = {
  readonly game: KniffelGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: KniffelMove) => void;
};

/**
 * Renders the dice and every block.
 *
 * @param props - the game and who is reading it
 * @returns the table element
 */
export function KniffelTable({
  game,
  mySeat,
  onMove,
}: KniffelTableProps): ReactElement {
  const mine =
    mySeat !== null && mySeat === game.active && game.phase === "turn";
  const moves = mine && mySeat !== null ? legalMoves(game, mySeat) : [];
  const canRoll = moves.some((move) => move.kind === "roll");

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold">
          {mine ? T.yourTurn : T.waitingFor(game.players[game.active].name)}
          <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
            {T.rollsLeft(game.rollsLeft)}
          </span>
        </p>

        <ul className="flex flex-wrap gap-2">
          {game.dice.map((die, index) => (
            <li key={index}>
              <Die
                die={die}
                held={game.held[index]}
                open={mine && game.rollsLeft > 0}
                onClick={() => onMove({ kind: "hold", index })}
              />
            </li>
          ))}
        </ul>

        {mine && (
          <div className="flex flex-wrap items-center gap-3">
            {canRoll && (
              <button
                type="button"
                data-testid="kniffel-roll"
                onClick={() => onMove({ kind: "roll" })}
                className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {T.roll}
              </button>
            )}
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {game.rollsLeft > 0 ? T.holdHint : T.enterHint}
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {game.players.map((player, seat) => (
          <Block
            key={player.name + seat}
            game={game}
            seat={seat}
            isMe={seat === mySeat}
            open={mine && seat === mySeat}
            onMove={onMove}
          />
        ))}
      </div>
    </section>
  );
}

/** One die, held or loose. */
function Die({
  die,
  held,
  open,
  onClick,
}: {
  readonly die: number;
  readonly held: boolean;
  readonly open: boolean;
  readonly onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      data-testid={`kniffel-die-${die}`}
      disabled={!open}
      onClick={onClick}
      title={held ? T.held : undefined}
      className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 text-2xl font-bold tabular-nums ${
        held
          ? "border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100"
          : "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-600"
      } ${open ? "cursor-pointer hover:brightness-95" : "cursor-default"}`}
    >
      {die}
    </button>
  );
}

/** One player's score block. */
function Block({
  game,
  seat,
  isMe,
  open,
  onMove,
}: {
  readonly game: KniffelGame;
  readonly seat: number;
  readonly isMe: boolean;
  readonly open: boolean;
  readonly onMove: (move: KniffelMove) => void;
}): ReactElement {
  const player = game.players[seat];
  return (
    <article
      data-testid={`kniffel-block-${seat}`}
      className={`flex flex-col gap-1 rounded-2xl border p-3 text-sm ${
        seat === game.active && game.phase === "turn"
          ? "border-indigo-400 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <header className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate font-semibold">
          {player.name}
          {isMe && " (Du)"}
          {player.isBot && " \u{1F916}"}
        </span>
        <span className="text-lg font-bold tabular-nums">
          {sheetTotal(player.sheet)}
        </span>
      </header>

      <p className="text-[0.65rem] font-semibold text-zinc-500 dark:text-zinc-400">
        {T.upper}
      </p>
      {UPPER.map((category) => (
        <Line
          key={category}
          game={game}
          seat={seat}
          category={category}
          open={open}
          onMove={onMove}
        />
      ))}
      <p className="flex justify-between border-t border-zinc-200 pt-1 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <span>
          {T.sum} · {T.bonus(BONUS_TARGET)}
        </span>
        <span className="tabular-nums">
          {upperSum(player.sheet)} + {bonusOf(player.sheet)}
        </span>
      </p>

      <p className="mt-1 text-[0.65rem] font-semibold text-zinc-500 dark:text-zinc-400">
        {T.lower}
      </p>
      {LOWER.map((category) => (
        <Line
          key={category}
          game={game}
          seat={seat}
          category={category}
          open={open}
          onMove={onMove}
        />
      ))}
      <p className="flex justify-between border-t border-zinc-200 pt-1 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <span>{T.sum}</span>
        <span className="tabular-nums">{lowerSum(player.sheet)}</span>
      </p>
    </article>
  );
}

/** One line of a block: the box, and what is or could be in it. */
function Line({
  game,
  seat,
  category,
  open,
  onMove,
}: {
  readonly game: KniffelGame;
  readonly seat: number;
  readonly category: Category;
  readonly open: boolean;
  readonly onMove: (move: KniffelMove) => void;
}): ReactElement {
  const written = game.players[seat].sheet[category];
  const offer = scoreOf(game.dice, category);
  const free = written === null;
  const clickable = open && free;
  // A nought is not a score, it is a box given up - on paper you draw a line
  // through it, and a block that only showed "0" would hide the difference
  // between a box that scored nothing and one that was sacrificed.
  const struck = written === 0;
  return (
    <button
      type="button"
      data-testid={`kniffel-box-${seat}-${category}`}
      disabled={!clickable}
      onClick={() => onMove({ kind: "enter", category })}
      title={clickable && offer === 0 ? T.zeroWarning : undefined}
      className={`flex items-center justify-between rounded px-2 py-0.5 text-left ${
        clickable
          ? "cursor-pointer bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50"
          : "cursor-default"
      }`}
    >
      <span
        className={
          struck
            ? "text-zinc-400 line-through decoration-red-500 decoration-2 dark:text-zinc-500"
            : free
              ? ""
              : "text-zinc-500 dark:text-zinc-400"
        }
      >
        {CATEGORY_LABELS[category]}
      </span>
      {free ? (
        <span
          className={`tabular-nums ${
            clickable && offer > 0
              ? "font-bold text-indigo-700 dark:text-indigo-200"
              : clickable
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-400"
          }`}
        >
          {clickable ? offer : T.free}
        </span>
      ) : (
        <span
          className={`font-semibold tabular-nums ${
            struck
              ? "text-zinc-400 line-through decoration-red-500 decoration-2 dark:text-zinc-500"
              : ""
          }`}
        >
          {written}
        </span>
      )}
    </button>
  );
}
