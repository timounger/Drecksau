/**
 * The table: the cards on it, the other players around it, and your own hand.
 *
 * @module
 * @remarks
 * One card is one button. Picking cards up and putting them down is the whole
 * game, so the hand is the control - there is no second list to tick things off
 * in. Cards of the same rank are what a set is made of, so choosing one dims
 * everything that could no longer go with it: the rule is shown rather than
 * explained.
 */
"use client";

import type { ReactElement } from "react";
import {
  sortHand,
  type Card,
  type Rank,
  type Suit,
} from "@/games/arschloch/engine/cards";
import {
  isOut,
  type ArschlochGame,
  type Title,
} from "@/games/arschloch/engine/state";
import {
  ARSCHLOCH_TEXTS as T,
  TITLE_NAMES,
} from "@/games/arschloch/i18n/texts";

/** What each suit is drawn with. */
const SUIT_PIPS: Readonly<Record<Suit, string>> = {
  kreuz: "♣",
  pik: "♠",
  herz: "♥",
  karo: "♦",
};

/** Which suits are printed in red. */
const RED_SUITS: readonly Suit[] = ["herz", "karo"];

/** What each rank shows on the card. */
const RANK_PIPS: Readonly<Record<Rank, string>> = {
  sieben: "7",
  acht: "8",
  neun: "9",
  bube: "B",
  dame: "D",
  koenig: "K",
  zehn: "10",
  ass: "A",
};

/** The colour a title is shown in, worst to best. */
const TITLE_TONES: Readonly<Record<Title, string>> = {
  praesident: "bg-emerald-600 text-white",
  vize: "bg-emerald-500/80 text-white",
  buerger: "bg-zinc-400 text-white",
  vizearsch: "bg-amber-600 text-white",
  arschloch: "bg-rose-700 text-white",
};

/**
 * One playing card.
 *
 * @param props - the card, whether it is picked, and what a tap does
 * @returns the card element
 */
export function PlayingCard({
  card,
  picked,
  dimmed,
  onClick,
}: {
  readonly card: Card;
  readonly picked?: boolean;
  readonly dimmed?: boolean;
  readonly onClick?: () => void;
}): ReactElement {
  const red = RED_SUITS.includes(card.suit);
  const still = onClick === undefined;
  return (
    <button
      type="button"
      disabled={still}
      onClick={onClick}
      data-testid={`ar-card-${card.id}`}
      data-picked={picked === true ? "1" : "0"}
      className={`flex h-16 w-11 shrink-0 flex-col items-center justify-between rounded-lg border-2 bg-white px-1 py-1 shadow-sm transition-transform dark:bg-zinc-100 ${
        picked === true
          ? "-translate-y-2 border-indigo-500"
          : "border-zinc-300 dark:border-zinc-400"
      } ${dimmed === true ? "opacity-35" : ""} ${
        still ? "cursor-default" : "cursor-pointer hover:-translate-y-1"
      }`}
    >
      <span
        className={`self-start text-sm leading-none font-bold ${red ? "text-rose-600" : "text-zinc-900"}`}
      >
        {RANK_PIPS[card.rank]}
      </span>
      <span
        className={`text-lg leading-none ${red ? "text-rose-600" : "text-zinc-900"}`}
      >
        {SUIT_PIPS[card.suit]}
      </span>
      <span
        className={`self-end text-sm leading-none font-bold ${red ? "text-rose-600" : "text-zinc-900"}`}
      >
        {RANK_PIPS[card.rank]}
      </span>
    </button>
  );
}

/**
 * The cards lying on the table.
 *
 * @param props - the game
 * @returns the pile element
 */
export function TablePile({
  game,
}: {
  readonly game: ArschlochGame;
}): ReactElement {
  return (
    <div
      data-testid="ar-pile"
      className="flex min-h-20 flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700"
    >
      {game.pile.length === 0 ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.emptyTable}
        </span>
      ) : (
        game.pile.map((card) => <PlayingCard key={card.id} card={card} />)
      )}
    </div>
  );
}

/**
 * The other players: what they hold, what they are called, where they stand.
 *
 * @param props - the game and the seat the reader plays
 * @returns the row of seats
 */
export function Seats({
  game,
  mySeat,
}: {
  readonly game: ArschlochGame;
  readonly mySeat: number;
}): ReactElement {
  return (
    <div className="flex flex-wrap justify-center gap-2" data-testid="ar-seats">
      {game.players.map((player, seat) => {
        const done = isOut(game, seat);
        const onTurn = game.active === seat && game.phase === "playing";
        return (
          <div
            key={player.name}
            data-testid={`ar-seat-${seat}`}
            className={`flex min-w-28 flex-col gap-0.5 rounded-xl border px-2 py-1.5 text-xs ${
              onTurn
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="font-semibold">
                {seat === mySeat ? "Du" : player.name}
              </span>
              {player.title !== null && (
                <span
                  className={`rounded px-1 text-[10px] ${TITLE_TONES[player.title]}`}
                >
                  {TITLE_NAMES[player.title]}
                </span>
              )}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {done
                ? `${T.out} (Platz ${game.out.indexOf(seat) + 1})`
                : player.passed
                  ? `${T.cards(player.hand.length)} - ${T.passed}`
                  : T.cards(player.hand.length)}
            </span>
            <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
              {T.scores}: {player.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Your own hand, sorted, with the cards you have picked lifted out.
 *
 * @param props - the cards, what is picked, and what a tap does
 * @returns the hand element
 */
export function Hand({
  cards,
  picked,
  dimmed,
  onPick,
}: {
  readonly cards: readonly Card[];
  readonly picked: readonly string[];
  /** The cards that cannot be part of a play right now. */
  readonly dimmed: ReadonlySet<string>;
  readonly onPick: (id: string) => void;
}): ReactElement {
  return (
    <div
      className="flex flex-wrap justify-center gap-1.5"
      data-testid="ar-hand"
    >
      {sortHand(cards).map((card) => (
        <PlayingCard
          key={card.id}
          card={card}
          picked={picked.includes(card.id)}
          dimmed={dimmed.has(card.id)}
          onClick={() => onPick(card.id)}
        />
      ))}
    </div>
  );
}
