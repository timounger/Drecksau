/**
 * The table: everybody's row of cards, and the one question.
 *
 * @module
 * @remarks
 * The whole screen exists to answer "another card, or stop?", so the two things
 * that answer it sit together and everything else arranges itself around them:
 * the row of numbers you already have, and how likely the next card is one of
 * them.
 *
 * That percentage is shown on purpose. It is not a hint - it is arithmetic that
 * anybody at a real table can do, because the deck holds as many copies of a
 * number as the number is worth and every card taken is lying face up. Making
 * people count face-up cards to get at a number the game is entirely about would
 * be hiding the game, not preserving it.
 */
"use client";

import type { ReactElement, ReactNode } from "react";
import { deadlyNumbers, nearlyThere, riskFor } from "@/games/flip-7/engine/ai";
import {
  CARD_ICONS,
  CARD_INK,
  CARD_NAMES,
  CARD_TEXTS,
  FLIP_SEVEN,
  cardFace,
  cardName,
  type Card,
} from "@/games/flip-7/engine/cards";
import {
  legalMoves,
  seatOnTurn,
  targetsFor,
} from "@/games/flip-7/engine/moves";
import {
  SELF_NAME,
  TARGET_SCORE,
  isActive,
  roundValue,
  type Flip7Game,
  type Flip7Move,
  type Player,
} from "@/games/flip-7/engine/state";
import { F7_TEXTS as T } from "@/games/flip-7/i18n/texts";
import { ComputerBadge } from "@/online/computer-badge";
import { seatsFromMine } from "@/online/seat-order";

/** Percent, for showing the odds as one. */
const PERCENT = 100;

/** From here on, taking another card is worth thinking about. */
const RISKY_PERCENT = 35;

/** Props of {@link Flip7Table}. */
export type Flip7TableProps = {
  readonly game: Flip7Game;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: Flip7Move) => void;
  /** The turn clock, shown beside whose turn it is. */
  readonly clock?: ReactNode;
  /** Seats the computer plays because their player left. */
  readonly botSeats?: readonly number[];
};

/**
 * Renders the whole table.
 *
 * @param props - the game and who is reading it
 * @returns the table element
 */
export function Flip7Table({
  game,
  mySeat,
  onMove,
  clock,
  botSeats = [],
}: Flip7TableProps): ReactElement {
  const moves = mySeat === null ? [] : legalMoves(game, mySeat);
  const order = seatsFromMine(game.players.length, mySeat);

  return (
    <section className="flex flex-col gap-4">
      <Panel game={game} mySeat={mySeat} clock={clock} />
      {mySeat !== null && (
        <Controls game={game} mySeat={mySeat} moves={moves} onMove={onMove} />
      )}
      <ul className="flex flex-col gap-2">
        {order.map((seat) => (
          <li key={game.players[seat].name + seat}>
            <Row
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

/** The round, the piles and who is being waited for. */
function Panel({
  game,
  mySeat,
  clock,
}: {
  readonly game: Flip7Game;
  readonly mySeat: number | null;
  readonly clock?: ReactNode;
}): ReactElement {
  const waiting = seatOnTurn(game);
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{T.round(game.round)}</h2>
        {clock}
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {T.dealer}: {game.players[game.dealer].name}
        </span>
      </div>
      {game.stage !== "gameOver" && (
        <p className="text-sm" data-testid="flip7-status">
          {mySeat !== null && waiting === mySeat
            ? T.yourTurn
            : T.waitingFor(game.players[waiting ?? game.active].name)}
        </p>
      )}
      <ul className="flex flex-wrap gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        <li>{T.deckLeft(game.deck.length)}</li>
        <li>{T.discardLeft(game.discard.length)}</li>
        <li>{T.target(TARGET_SCORE)}</li>
      </ul>
    </div>
  );
}

/**
 * The buttons.
 *
 * @remarks
 * Three quite different things share one box, and only ever one at a time: an
 * action card that has to be pointed at somebody, the three cards a Dreimal is
 * forcing on you, and the ordinary choice. They share a box because they answer
 * the same question - what happens next - and looking for them in three places
 * would be worse than reading one.
 */
function Controls({
  game,
  mySeat,
  moves,
  onMove,
}: {
  readonly game: Flip7Game;
  readonly mySeat: number;
  readonly moves: readonly Flip7Move[];
  readonly onMove: (move: Flip7Move) => void;
}): ReactElement | null {
  const me = game.players[mySeat];
  const pointing = game.pending !== null && game.pending.by === mySeat;
  const flipping = game.forced !== null && game.forced.at === mySeat;
  const canHit = moves.some((move) => move.kind === "hit");
  const canNext = moves.some((move) => move.kind === "next");
  let panel: ReactElement | null = null;

  if (pointing && game.pending !== null) {
    panel = (
      <Box tone="warn">
        <p className="w-full text-sm font-medium">
          {T.pointHint(cardName(game.pending.card))}
        </p>
        <span className="text-xs text-zinc-600 dark:text-zinc-300">
          {T.pointAt}
        </span>
        {targetsFor(game).map((at) => (
          <Button
            key={at}
            testId={`flip7-target-${at}`}
            tone={at === mySeat ? "quiet" : "loud"}
            onClick={() => onMove({ kind: "target", at })}
          >
            {game.players[at].name}
            {at === mySeat ? " (du)" : ""}
          </Button>
        ))}
      </Box>
    );
  } else if (flipping && game.forced !== null) {
    panel = (
      <Box tone="danger">
        <Button
          testId="flip7-flip"
          tone="danger"
          onClick={() => onMove({ kind: "flip" })}
        >
          {T.flip(game.forced.left)}
        </Button>
        <Risk game={game} seat={mySeat} />
      </Box>
    );
  } else if (canNext) {
    panel = (
      <Box tone="quiet">
        <Button testId="flip7-next" onClick={() => onMove({ kind: "next" })}>
          {T.nextRound}
        </Button>
      </Box>
    );
  } else if (canHit) {
    const staying = moves.some((move) => move.kind === "stay");
    panel = (
      <Box tone="loud">
        <Button
          testId="flip7-hit"
          tone="danger"
          onClick={() => onMove({ kind: "hit" })}
        >
          {T.hit}
        </Button>
        <Button
          testId="flip7-stay"
          tone="quiet"
          disabled={!staying}
          onClick={() => onMove({ kind: "stay" })}
        >
          {T.stayValue(roundValue(me, false))}
        </Button>
        <Risk game={game} seat={mySeat} />
        {!staying && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.cannotStay}
          </span>
        )}
      </Box>
    );
  }
  return panel;
}

/** How dangerous the next card is, and what would do it. */
function Risk({
  game,
  seat,
}: {
  readonly game: Flip7Game;
  readonly seat: number;
}): ReactElement {
  const percent = Math.round(riskFor(game, seat) * PERCENT);
  const deadly = deadlyNumbers(game, seat);
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs">
      <span
        className={
          percent >= RISKY_PERCENT
            ? "font-semibold text-rose-700 dark:text-rose-300"
            : "text-zinc-600 dark:text-zinc-300"
        }
      >
        {percent === 0 ? T.riskSafe : T.risk(percent)}
      </span>
      {deadly.length > 0 && (
        <span className="text-zinc-500 dark:text-zinc-400">
          {T.deadly} {deadly.join(", ")}
        </span>
      )}
      {nearlyThere(game, seat) && (
        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
          {T.oneAway}
        </span>
      )}
    </span>
  );
}

/** One player's row: what they have, and what it is worth. */
function Row({
  game,
  seat,
  isMe,
  isBotSeat,
}: {
  readonly game: Flip7Game;
  readonly seat: number;
  readonly isMe: boolean;
  readonly isBotSeat: boolean;
}): ReactElement {
  const player = game.players[seat];
  const onTurn = seat === (seatOnTurn(game) ?? -1) && game.stage !== "gameOver";
  const done = game.stage === "roundEnd" || game.stage === "gameOver";
  return (
    <article
      data-testid={`flip7-row-${seat}`}
      className={`flex flex-col gap-1.5 rounded-2xl border p-3 ${
        player.standing === "busted"
          ? "border-rose-300 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/30"
          : onTurn
            ? "border-indigo-400 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30"
            : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <header className="flex flex-wrap items-baseline gap-2 text-sm">
        <span className="min-w-0 flex-1 truncate font-semibold">
          {player.name}
          {/* Offline the seat is already called "Du" - saying so twice reads
              like a bug. Online it is your own name and the marker earns its
              place. */}
          {isMe && player.name !== SELF_NAME && " (Du)"}
        </span>
        {isBotSeat && <ComputerBadge />}
        {!done && <Standing player={player} />}
        {done && player.roundScore > 0 && (
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {T.roundPoints(player.roundScore)}
          </span>
        )}
        <span className="text-base font-bold tabular-nums">{player.score}</span>
      </header>
      <div className="flex flex-wrap items-center gap-1">
        {player.numbers.map((card, at) => (
          <Face key={card.id + at} card={card} />
        ))}
        {player.modifiers.map((card) => (
          <Face key={card.id} card={card} />
        ))}
        {player.second !== null && <Face card={player.second} />}
        {player.numbers.length === 0 &&
          player.modifiers.length === 0 &&
          player.second === null && (
            <span className="text-xs text-zinc-400">-</span>
          )}
        <span className="ml-auto text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
          {player.numbers.length}/{FLIP_SEVEN} · {roundValue(player, false)}
        </span>
      </div>
    </article>
  );
}

/** Whether this player is still deciding. */
function Standing({ player }: { readonly player: Player }): ReactElement {
  const looks: Readonly<Record<string, string>> = {
    in: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
    stayed: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
    busted: "bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100",
  };
  const words: Readonly<Record<string, string>> = {
    in: T.stillIn,
    stayed: T.stayed,
    busted: T.busted,
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${looks[player.standing]}`}
    >
      {isActive(player) ? words.in : words[player.standing]}
    </span>
  );
}

/** One card, face up - they are all face up in this game. */
function Face({ card }: { readonly card: Card }): ReactElement {
  const number = card.kind === "number";
  return (
    <span
      data-testid={`flip7-card-${card.id}`}
      title={`${CARD_NAMES[card.kind]} - ${CARD_TEXTS[card.kind]}`}
      className={`flex h-11 items-center justify-center rounded-lg border-2 border-zinc-300 bg-white text-center leading-none font-bold dark:border-zinc-600 dark:bg-zinc-800 ${
        number ? "w-9 text-lg tabular-nums" : "w-auto px-1.5 text-[10px]"
      }`}
      style={{ color: CARD_INK[card.kind] }}
    >
      {number ? cardFace(card) : `${CARD_ICONS[card.kind]} ${cardFace(card)}`}
    </span>
  );
}

/** The box the buttons sit in. */
function Box({
  children,
  tone,
}: {
  readonly children: ReactNode;
  readonly tone: "loud" | "warn" | "danger" | "quiet";
}): ReactElement {
  const looks: Readonly<Record<string, string>> = {
    loud: "border-indigo-400 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/30",
    warn: "border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/40",
    danger:
      "border-rose-400 bg-rose-50 dark:border-rose-500 dark:bg-rose-950/40",
    quiet: "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
  };
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-2xl border-2 p-3 ${looks[tone]}`}
    >
      {children}
    </div>
  );
}

/** A plain button, so the table's controls all look the same. */
function Button({
  children,
  onClick,
  disabled = false,
  testId,
  tone = "loud",
}: {
  readonly children: ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly testId: string;
  readonly tone?: "loud" | "quiet" | "danger";
}): ReactElement {
  const looks: Readonly<Record<string, string>> = {
    loud: "bg-indigo-600 text-white hover:bg-indigo-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    quiet:
      "border border-zinc-300 bg-white hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800",
  };
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${looks[tone]}`}
    >
      {children}
    </button>
  );
}
