/**
 * The table: the twenty-five words, the clue, and who is still to be found.
 *
 * @module
 * @remarks
 * One component draws two completely different screens, and which one you get
 * turns on a single question: **may this seat see the key?** A spymaster's grid
 * is colour-coded from the first second and none of it can be clicked; an
 * operative's is twenty-five identical cards, and clicking one is the whole
 * game.
 *
 * That question is asked of the seat's **role**, never of whether the data
 * happens to be there. Online it would be enough to look at the data - the host
 * strips the owners off before sending - but offline the browser holds the
 * whole truth, and a screen that showed whatever it was given would hand the
 * player the key. So the role decides, and the same code is right in both
 * places.
 */
"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import {
  isCluePlayable,
  legalMoves,
  seatOnTurn,
} from "@/games/codenames/engine/moves";
import {
  GRID_SIDE,
  MAX_CLUE,
  TEAM_NAMES,
  agentsLeft,
  seesKey,
  type Card,
  type CodenamesGame,
  type CodenamesMove,
  type Owner,
  type Team,
} from "@/games/codenames/engine/state";
import { CN_TEXTS as T } from "@/games/codenames/i18n/texts";
import { ComputerBadge } from "@/online/computer-badge";

/** What each sort of card is painted in, face up. */
const FACE: Readonly<Record<string, string>> = {
  red: "border-rose-500 bg-rose-500 text-white",
  blue: "border-sky-600 bg-sky-600 text-white",
  bystander: "border-amber-300 bg-amber-100 text-amber-900",
  assassin: "border-zinc-900 bg-zinc-900 text-zinc-100",
};

/** The thin mark a spymaster sees on a word that is still face down. */
const HINT: Readonly<Record<string, string>> = {
  red: "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100",
  blue: "border-sky-600 bg-sky-50 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100",
  bystander:
    "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  assassin:
    "border-zinc-900 bg-zinc-800 text-zinc-100 dark:border-zinc-100 dark:bg-zinc-900",
};

/** Props of {@link CodenamesTable}. */
export type CodenamesTableProps = {
  readonly game: CodenamesGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: CodenamesMove) => void;
  /** The turn clock, shown beside whose turn it is. */
  readonly clock?: ReactNode;
};

/**
 * Renders the whole table.
 *
 * @param props - the game and who is reading it
 * @returns the table element
 */
export function CodenamesTable({
  game,
  mySeat,
  onMove,
  clock,
}: CodenamesTableProps): ReactElement {
  const me = mySeat === null ? null : game.seats[mySeat];
  const open = mySeat !== null && seesKey(game, mySeat);
  // Once it is over there is nothing left to keep back, and the key is the
  // first thing everybody wants to see.
  const showKey = open || game.phase === "gameOver";
  const moves = mySeat === null ? [] : legalMoves(game, mySeat);
  const canGuess = moves.some((move) => move.kind === "guess");

  return (
    <section className="flex flex-col gap-4">
      <Panel game={game} me={me} clock={clock} />

      {me !== null && mySeat !== null && (
        <Controls
          game={game}
          mySeat={mySeat}
          canStop={moves.some((move) => move.kind === "stop")}
          onMove={onMove}
        />
      )}

      <ul
        className="grid gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${GRID_SIDE}, minmax(0, 1fr))` }}
      >
        {game.board.map((card, at) => (
          <li key={card.word}>
            <Word
              card={card}
              at={at}
              showKey={showKey}
              open={canGuess && !card.revealed}
              onPick={() => onMove({ kind: "guess", at })}
            />
          </li>
        ))}
      </ul>

      <Seats game={game} mySeat={mySeat} />
    </section>
  );
}

/** Who is on turn, how many agents are left, and what the clue is. */
function Panel({
  game,
  me,
  clock,
}: {
  readonly game: CodenamesGame;
  readonly me: CodenamesGame["seats"][number] | null;
  readonly clock?: ReactNode;
}): ReactElement {
  const waiting = seatOnTurn(game);
  const mine = me !== null && me.team === game.turn;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">
          {game.phase === "gameOver"
            ? T.revealAll
            : game.phase === "clue"
              ? T.phaseClue
              : T.phaseGuess}
        </h2>
        {clock}
        <Score game={game} team="red" />
        <Score game={game} team="blue" />
      </div>

      {game.phase !== "gameOver" && (
        <p className="text-sm" data-testid="cn-status">
          {mine &&
          me?.role === (game.phase === "clue" ? "spymaster" : "operative")
            ? T.yourTurn
            : waiting === null
              ? T.teamTurn(TEAM_NAMES[game.turn])
              : T.waitingFor(game.seats[waiting].name)}
        </p>
      )}

      {game.clue !== null && (
        <p
          data-testid="cn-clue"
          className="text-lg font-bold tracking-wide uppercase"
        >
          {T.clueOn(game.clue.word, game.clue.count)}
          <span className="ml-2 text-xs font-normal tracking-normal normal-case text-zinc-500 dark:text-zinc-400">
            {game.clue.guessesLeft === null
              ? T.guessesUnlimited
              : T.guessesLeft(game.clue.guessesLeft)}
          </span>
        </p>
      )}

      {me !== null && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.youAre(
            TEAM_NAMES[me.team],
            me.role === "spymaster" ? T.spymaster : T.operative,
          )}
          {" · "}
          {me.role === "spymaster" ? T.keyShown : T.keyHidden}
        </p>
      )}
    </div>
  );
}

/** How many agents one side still has to find. */
function Score({
  game,
  team,
}: {
  readonly game: CodenamesGame;
  readonly team: Team;
}): ReactElement {
  return (
    <span
      data-testid={`cn-score-${team}`}
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
        team === "red" ? "bg-rose-500" : "bg-sky-600"
      } ${game.turn === team && game.phase !== "gameOver" ? "ring-2 ring-offset-1 ring-zinc-400 dark:ring-offset-zinc-900" : ""}`}
    >
      {T.agentsLeft(TEAM_NAMES[team], agentsLeft(game, team))}
    </span>
  );
}

/** The clue box for a spymaster, and the stop button for an operative. */
function Controls({
  game,
  mySeat,
  canStop,
  onMove,
}: {
  readonly game: CodenamesGame;
  readonly mySeat: number;
  readonly canStop: boolean;
  readonly onMove: (move: CodenamesMove) => void;
}): ReactElement | null {
  const me = game.seats[mySeat];
  const myClue =
    game.phase === "clue" && me.team === game.turn && me.role === "spymaster";
  let panel: ReactElement | null = null;
  if (myClue) {
    panel = <ClueBox game={game} onMove={onMove} />;
  } else if (canStop) {
    panel = (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          data-testid="cn-stop"
          onClick={() => onMove({ kind: "stop" })}
          className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.stop}
        </button>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.operativeHint}
        </span>
      </div>
    );
  }
  return panel;
}

/** One word and one number. */
function ClueBox({
  game,
  onMove,
}: {
  readonly game: CodenamesGame;
  readonly onMove: (move: CodenamesMove) => void;
}): ReactElement {
  const [word, setWord] = useState("");
  const [count, setCount] = useState(1);
  const clean = word.trim();
  const onBoard = game.board.some(
    (card) => !card.revealed && card.word.toLowerCase() === clean.toLowerCase(),
  );
  const ok = isCluePlayable(game, clean);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-indigo-400 bg-indigo-50/60 p-3 dark:border-indigo-500 dark:bg-indigo-950/30">
      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        {T.spymasterHint}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">{T.clueWord}</span>
          <input
            type="text"
            value={word}
            data-testid="cn-clue-word"
            onChange={(event) => setWord(event.target.value)}
            placeholder={T.cluePlaceholder}
            className="w-40 rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <div
          role="radiogroup"
          aria-label={T.clueCount}
          className="flex flex-wrap gap-1"
        >
          {Array.from({ length: MAX_CLUE + 1 }, (unused, n) => n).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={n === count}
              data-testid={`cn-count-${n}`}
              onClick={() => setCount(n)}
              className={`h-9 w-9 cursor-pointer rounded-lg border text-sm font-semibold tabular-nums ${
                n === count
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-zinc-300 bg-white hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              }`}
            >
              {n === 0 ? "\u{221E}" : n}
            </button>
          ))}
        </div>
        <button
          type="button"
          data-testid="cn-give-clue"
          disabled={!ok}
          onClick={() => {
            onMove({ kind: "clue", word: clean, count });
            setWord("");
          }}
          className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {T.giveClue}
        </button>
      </div>
      {clean.length > 0 && !ok && (
        <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
          {onBoard ? T.clueOnBoard : T.clueOneWord}
        </p>
      )}
    </div>
  );
}

/**
 * One of the twenty-five words.
 *
 * @remarks
 * A button only while it can be pressed. A spymaster's grid is deliberately
 * dead to the touch: they are not allowed to guess, and a card that lit up
 * under the cursor would be an invitation to do the one thing the game forbids.
 */
function Word({
  card,
  at,
  showKey,
  open,
  onPick,
}: {
  readonly card: Card;
  readonly at: number;
  readonly showKey: boolean;
  readonly open: boolean;
  readonly onPick: () => void;
}): ReactElement {
  const owner: Owner | null = card.owner;
  const paint = card.revealed
    ? (FACE[owner ?? "bystander"] ?? FACE.bystander)
    : showKey && owner !== null
      ? HINT[owner]
      : "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
  const look = `flex h-16 w-full items-center justify-center rounded-lg border-2 px-1 text-center text-[11px] leading-tight font-bold uppercase sm:h-20 sm:text-sm ${paint} ${
    card.revealed ? "opacity-80" : ""
  }`;
  return open ? (
    <button
      type="button"
      data-testid={`cn-word-${at}`}
      onClick={onPick}
      className={`${look} cursor-pointer hover:brightness-95`}
    >
      {card.word}
    </button>
  ) : (
    <span data-testid={`cn-word-${at}`} className={look}>
      {card.word}
    </span>
  );
}

/** Who is playing what. */
function Seats({
  game,
  mySeat,
}: {
  readonly game: CodenamesGame;
  readonly mySeat: number | null;
}): ReactElement {
  return (
    <ul className="flex flex-wrap gap-1.5 text-[11px]">
      {game.seats.map((seat, at) => (
        <li
          key={seat.name + at}
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${
            seat.team === "red"
              ? "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100"
              : "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100"
          } ${at === mySeat ? "ring-1 ring-zinc-400" : ""}`}
        >
          <span className="font-semibold">{seat.name}</span>
          <span className="opacity-70">
            {seat.role === "spymaster" ? T.spymaster : T.operative}
          </span>
          {seat.isBot && <ComputerBadge />}
        </li>
      ))}
    </ul>
  );
}
