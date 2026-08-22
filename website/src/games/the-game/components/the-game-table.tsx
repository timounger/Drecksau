/**
 * The table: four rows, your hand, and the two things you are allowed to say.
 *
 * @module
 * @remarks
 * **Two taps, and deliberately so.** Pick a card, then pick a row. Elsewhere in
 * this collection an unambiguous tap just happens, and here it could too - most
 * cards fit only one or two rows. But the whole decision in this game is
 * *where*, and the cost of each row only appears once a card is in hand: `+3`
 * on one, `+41` on another, `Rückwärts-Trick` on a third. Playing on the first
 * tap would take the card away before the one number worth looking at was on
 * screen.
 *
 * The rows are drawn as what they are - a stack with only its top card
 * showing - because that is the whole reason the game is hard: you can see
 * where a row **is** and never where it **has been**.
 *
 * The two markers under each row are the game's conversation, and they are the
 * only form of it that cannot break the rule. See {@link ./engine/state.Hint}.
 */
"use client";

import { useState, type ReactElement } from "react";
import { heightOf, topOf, type Pile } from "@/games/the-game/engine/cards";
import {
  canEndTurn,
  legalPlays,
  type Play,
} from "@/games/the-game/engine/moves";
import {
  hintKey,
  hintsOn,
  stillOwed,
  type Hint,
  type TheGame,
  type TheGameMove,
} from "@/games/the-game/engine/state";
import { THE_GAME_TEXTS as T } from "@/games/the-game/i18n/texts";

/** The two requests, in the order they read. */
const HINT_BUTTONS: readonly {
  readonly hint: Hint;
  readonly label: string;
  readonly title: string;
}[] = [
  { hint: "keep", label: T.hintKeep, title: T.hintKeepLong },
  { hint: "small", label: T.hintSmall, title: T.hintSmallLong },
];

/** The rows keep their own colour, so which way one runs is never in doubt. */
const UP_TINT = "bg-sky-50 dark:bg-sky-950/30";
const DOWN_TINT = "bg-amber-50 dark:bg-amber-950/30";

/** A jump up to this size is close enough to free. */
const CHEAP_JUMP = 5;

/** Up to this it is an ordinary jump; past it, numbers are being thrown away. */
const FAIR_JUMP = 20;

/** Props of {@link TheGameTable}. */
export type TheGameTableProps = {
  readonly game: TheGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: TheGameMove) => void;
};

/**
 * Renders the four rows, the hand and the markers.
 *
 * @param props - the game, who is reading it and where moves go
 * @returns the table element
 */
export function TheGameTable({
  game,
  mySeat,
  onMove,
}: TheGameTableProps): ReactElement {
  const [wanted, setWanted] = useState<number | null>(null);
  const hand = mySeat === null ? [] : game.players[mySeat].hand;
  // Derived rather than cleared in an effect: the card is gone the moment it is
  // played, and a selection pointing at a card nobody holds is not a state
  // worth having for one render.
  const picked = wanted !== null && hand.includes(wanted) ? wanted : null;
  const plays = mySeat === null ? [] : legalPlays(game, mySeat);

  const place = (pile: number) => {
    const play = plays.find(
      (each) => each.card === picked && each.pile === pile,
    );
    if (play !== undefined) {
      setWanted(null);
      onMove({ kind: "play", card: play.card, pile: play.pile });
    }
  };

  const ask = (pile: number, hint: Hint) => {
    const mine =
      mySeat === null ? undefined : game.hints[hintKey(mySeat, pile)];
    onMove({ kind: "hint", pile, hint: mine === hint ? null : hint });
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {game.piles.map((pile, at) => (
          <Row
            key={at}
            game={game}
            pile={pile}
            at={at}
            mySeat={mySeat}
            play={plays.find(
              (each) => each.card === picked && each.pile === at,
            )}
            dimmed={picked !== null}
            onPlace={place}
            onAsk={ask}
          />
        ))}
      </div>

      {mySeat !== null && (
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-sm font-semibold">{T.yourHand}</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {picked === null ? T.pickCard : T.pickPile(picked)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2" data-testid="tg-hand">
            {hand.length === 0 && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {T.emptyHand}
              </span>
            )}
            {hand.map((card) => (
              <HandCard
                key={card}
                card={card}
                picked={card === picked}
                playable={plays.some((each) => each.card === card)}
                onPick={() => setWanted(card === picked ? null : card)}
              />
            ))}
          </div>
          {/* Never ended for you, even with nothing left to play. Passing is
              the moment to put a marker on a row, and a turn that ended itself
              would take that away just when it is worth most. */}
          <div>
            <button
              type="button"
              disabled={!canEndTurn(game, mySeat)}
              onClick={() => onMove({ kind: "endTurn" })}
              data-testid="tg-end"
              className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {T.endTurn}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** One of the four rows. */
function Row({
  game,
  pile,
  at,
  mySeat,
  play,
  dimmed,
  onPlace,
  onAsk,
}: {
  readonly game: TheGame;
  readonly pile: Pile;
  readonly at: number;
  readonly mySeat: number | null;
  readonly play: Play | undefined;
  readonly dimmed: boolean;
  readonly onPlace: (pile: number) => void;
  readonly onAsk: (pile: number, hint: Hint) => void;
}): ReactElement {
  const up = pile.kind === "up";
  const open = play !== undefined;
  const asked = hintsOn(game, at);
  const mine = mySeat === null ? undefined : game.hints[hintKey(mySeat, at)];

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={!open}
        onClick={() => onPlace(at)}
        data-testid={`tg-pile-${at}`}
        className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-3 py-4 transition ${
          up ? UP_TINT : DOWN_TINT
        } ${
          open
            ? "cursor-pointer border-emerald-500 shadow-md"
            : dimmed
              ? "border-zinc-200 opacity-40 dark:border-zinc-800"
              : "border-zinc-200 dark:border-zinc-800"
        }`}
      >
        <span
          aria-hidden
          className={`text-xl leading-none font-black ${
            up
              ? "text-sky-600 dark:text-sky-300"
              : "text-amber-700 dark:text-amber-300"
          }`}
        >
          {up ? "\u{2191}" : "\u{2193}"}
        </span>
        <span
          data-testid={`tg-top-${at}`}
          className="text-4xl leading-none font-black tabular-nums"
        >
          {topOf(pile)}
        </span>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {heightOf(pile) === 0 ? T.rowEmpty : T.onIt(heightOf(pile))}
        </span>
        {/* Signed the way the number on the row actually moves. Measured as a
            jump both rows want the same thing - a small number - but a
            descending row showing 100 does not go "+97" when the 3 lands on
            it, it goes down to 3, and printing a plus there had it reading
            like a gain. */}
        {play !== undefined && (
          <span
            data-testid={`tg-step-${at}`}
            className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${jumpLook(play.step)}`}
          >
            {play.step < 0
              ? T.trick
              : up
                ? T.stepUp(play.step)
                : T.stepDown(play.step)}
          </span>
        )}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-1">
        {HINT_BUTTONS.map((button) => (
          <button
            key={button.hint}
            type="button"
            disabled={mySeat === null}
            onClick={() => onAsk(at, button.hint)}
            title={mine === button.hint ? T.hintOff : button.title}
            data-testid={`tg-hint-${at}-${button.hint}`}
            className={`cursor-pointer rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              mine === button.hint
                ? "border-rose-500 bg-rose-500 text-white"
                : "border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>

      {asked.length > 0 && (
        <p
          data-testid={`tg-asked-${at}`}
          className="text-center text-[11px] leading-tight text-rose-600 dark:text-rose-300"
        >
          {asked
            .map(
              (each) =>
                `${game.players[each.seat].name}: ${
                  each.hint === "keep" ? T.hintKeepLong : T.hintSmallLong
                }`,
            )
            .join(" \u{00B7} ")}
        </p>
      )}
    </div>
  );
}

/** One card in your hand. */
function HandCard({
  card,
  picked,
  playable,
  onPick,
}: {
  readonly card: number;
  readonly picked: boolean;
  readonly playable: boolean;
  readonly onPick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onPick}
      data-testid={`tg-card-${card}`}
      className={`min-w-12 cursor-pointer rounded-xl border-2 px-2 py-3 text-xl font-black tabular-nums transition ${
        picked
          ? "-translate-y-1 border-emerald-600 bg-emerald-600 text-white shadow-lg"
          : playable
            ? "border-zinc-300 bg-white text-zinc-900 hover:-translate-y-0.5 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
            : "border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600"
      }`}
    >
      {card}
    </button>
  );
}

/**
 * The line above the table: whose turn, what they still owe, what is left.
 *
 * @param props - the game and the seat reading it
 * @returns the status element
 */
export function TheGameStatus({
  game,
  mySeat,
}: {
  readonly game: TheGame;
  readonly mySeat: number | null;
}): ReactElement {
  const running = game.phase === "playing";
  const owed = stillOwed(game);
  const onTurn = game.players[game.active];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Nobody is on turn once it is over. Left as it was, the line went on
          asking a player for two more cards under the panel explaining that
          they could not lay them. */}
      <span data-testid="tg-turn" className="font-semibold">
        {!running
          ? T.overNow
          : game.active === mySeat
            ? T.yourTurn
            : T.waitingFor(onTurn.name)}
      </span>
      {running && (
        <span
          data-testid="tg-owed"
          className={
            owed > 0
              ? "font-semibold text-rose-600 dark:text-rose-300"
              : "text-emerald-700 dark:text-emerald-300"
          }
        >
          {owed > 0 ? T.owed(owed) : T.mayStop}
        </span>
      )}
      <span className="text-zinc-500 dark:text-zinc-400">
        {game.draw.length > 0 ? T.drawPile(game.draw.length) : T.drawEmpty}
      </span>
      {game.players.map((player, seat) =>
        seat === mySeat ? null : (
          <span
            key={seat}
            className="text-zinc-500 dark:text-zinc-400"
            data-testid={`tg-hand-${seat}`}
          >
            {T.handOf(player.name, player.hand.length)}
          </span>
        ),
      )}
    </div>
  );
}

/**
 * The colour a jump is shown in.
 *
 * @param step - how far the card carries the row
 * @returns the background class
 * @remarks
 * By **size**, not by sign. Both rows want the same thing and it is not a
 * direction, it is a small number: on a descending row the 3 landing on the 100
 * throws away as much as the 98 landing on the 1, and colouring by sign called
 * one of those good. The trick keeps its own colour because it is the only move
 * in the game that gives ground back.
 */
function jumpLook(step: number): string {
  let look: string;
  if (step < 0) {
    look = "bg-violet-600";
  } else if (step <= CHEAP_JUMP) {
    look = "bg-emerald-600";
  } else if (step <= FAIR_JUMP) {
    look = "bg-amber-600";
  } else {
    look = "bg-rose-600";
  }
  return look;
}
