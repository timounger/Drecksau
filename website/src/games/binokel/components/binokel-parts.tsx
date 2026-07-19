/**
 * Shared Binokel board pieces, used by both the local game and the online board.
 *
 * @module
 * @remarks
 * Everything here is presentational and free of any "who am I" perspective, so
 * the same scoreboard, opponents, melds, trick area and cards render whether the
 * viewer is player 0 (local game) or any seat (online). The two drivers supply
 * their own action buttons around these pieces.
 */
"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  RANK_STRENGTH,
  SUITS,
  type Card,
  type Suit,
} from "@/games/binokel/engine/cards";
import { findMelds } from "@/games/binokel/engine/melds";
import { roundResult } from "@/games/binokel/engine/scoring";
import {
  teamOf,
  type GameState,
  type GameType,
} from "@/games/binokel/engine/state";
import {
  CARD_ASPECT,
  CARD_BACK,
  CARD_IMAGES,
} from "@/games/binokel/assets/card-images";
import { SUIT_IMAGES } from "@/games/binokel/assets/suit-images";
import {
  BINOKEL_TEXTS,
  RANK_LABELS,
  SUIT_LABELS,
  meldLabel,
} from "@/games/binokel/i18n/binokel-texts";

/** How many face-down cards to show for an opponent. */
const OPPONENT_BACKS_SHOWN = 8;

/**
 * The meld a hand would score for the weakest and strongest trump choice.
 *
 * @param hand - the cards to score
 * @param withSevens - whether the 48-card deck is in play
 * @returns the lowest and highest meld total across the four possible trumps
 * @remarks
 * Trump is not chosen yet during bidding and discarding, so the exact meld is
 * unknown - only this range is. Several melds (a Familie, the Dix) are worth
 * more in trump, so the total differs by which suit becomes trump.
 */
export function meldRange(
  hand: readonly Card[],
  withSevens: boolean,
): { min: number; max: number } {
  const totals = SUITS.map((suit) => findMelds(hand, suit, withSevens).total);
  return { min: Math.min(...totals), max: Math.max(...totals) };
}

/** Sorts a hand by the chosen suit order, then by trick strength high to low. */
export function sortHand(
  hand: readonly Card[],
  suitOrder: readonly Suit[],
): Card[] {
  return [...hand].sort(
    (a, b) =>
      suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit) ||
      RANK_STRENGTH[b.rank] - RANK_STRENGTH[a.rank],
  );
}

/** Signs a number for display. */
export function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/** The cumulative scores and the round's key facts. */
export function Scoreboard({ state }: { state: GameState }): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white/60 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      {state.players.map((player, index) => (
        <span key={player.id} className="flex items-center gap-1">
          {state.teams && <TeamBadge team={teamOf(state, index)} />}
          <span className="font-semibold">{player.name}</span>
          <span className="tabular-nums">{player.score}</span>
          {state.declarerIndex !== null &&
            state.players[state.declarerIndex].id === player.id && (
              <Badge>{"★"}</Badge>
            )}
        </span>
      ))}
      <span className="ml-auto text-zinc-500 dark:text-zinc-400">
        {BINOKEL_TEXTS.target(state.targetScore)}
        {state.trump !== null && (
          <>
            {" · "}
            {BINOKEL_TEXTS.trump}: {SUIT_LABELS[state.trump]}
          </>
        )}
      </span>
    </div>
  );
}

/** An opponent's seat: name, score, backs and bidding/meld status. */
export function OpponentSeat({
  state,
  index,
}: {
  state: GameState;
  index: number;
}): ReactElement {
  const player = state.players[index];
  const active = state.currentPlayerIndex === index;
  return (
    <section
      className={[
        "flex flex-1 flex-col gap-2 rounded-2xl border p-3",
        active
          ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
          : "border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/40",
      ].join(" ")}
    >
      <header className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 font-semibold">
          {state.teams && <TeamBadge team={teamOf(state, index)} />}
          {player.name}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {player.hand.length} {BINOKEL_TEXTS.cardsLeft}
          {biddingStatus(state, index)}
        </span>
      </header>
      <div className="flex gap-1">
        {player.hand.slice(0, OPPONENT_BACKS_SHOWN).map((card) => (
          <MiniBack key={card.id} />
        ))}
      </div>
      {state.phase !== "bidding" && player.meldPoints > 0 && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {BINOKEL_TEXTS.meldPoints}: {player.meldPoints}
        </span>
      )}
    </section>
  );
}

/** " · Gebot" or " · weg" during bidding. */
function biddingStatus(state: GameState, index: number): string {
  const player = state.players[index];
  let text = "";
  if (state.phase === "bidding") {
    if (!player.bidding) {
      text = ` · ${BINOKEL_TEXTS.passed}`;
    } else if (player.bid !== null) {
      text = ` · ${player.bid}`;
    }
  }
  return text;
}

/** Every player's melds, laid out in a grid. */
export function MeldsGrid({ state }: { state: GameState }): ReactElement {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {state.players.map((player) => {
        const found = findMelds(player.hand, state.trump, state.withSevens);
        return (
          <div
            key={player.id}
            className="rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-800"
          >
            <div className="flex justify-between font-semibold">
              <span>{player.name}</span>
              <span className="tabular-nums">{found.total}</span>
            </div>
            {found.melds.length === 0 ? (
              <span className="text-xs text-zinc-400">
                {BINOKEL_TEXTS.noMelds}
              </span>
            ) : (
              <ul className="mt-1 flex flex-col gap-1.5">
                {found.melds.map((meld, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {meldLabel(meld)} ({meld.points})
                    </span>
                    <div className="flex flex-wrap gap-0.5">
                      {meld.cards.map((card) => (
                        <MeldCard key={card.id} card={card} />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** The current trick on the table, each card tagged with who played it. */
export function TrickArea({ state }: { state: GameState }): ReactElement {
  return (
    <div className="flex min-h-24 gap-3">
      {state.currentTrick.length === 0 ? (
        <span className="text-sm text-zinc-400">—</span>
      ) : (
        state.currentTrick.map((played) => (
          <div
            key={played.card.id}
            className="flex flex-col items-center gap-1"
          >
            <CardView card={played.card} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {state.players[played.playerIndex].name}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

/** The round result table: tricks, meld, round delta and running score. */
export function RoundEndTable({ state }: { state: GameState }): ReactElement {
  const result = roundResult(state);
  const declarer =
    state.declarerIndex === null ? null : state.players[state.declarerIndex];
  return (
    <>
      {declarer !== null && (
        <p className="text-sm">
          {result.declarerMadeBid
            ? BINOKEL_TEXTS.declarerMade(declarer.name)
            : BINOKEL_TEXTS.declarerOff(declarer.name)}
        </p>
      )}
      <table className="text-sm">
        <thead className="text-left text-xs text-zinc-500 dark:text-zinc-400">
          <tr>
            <th className="pr-4">&nbsp;</th>
            <th className="pr-4">{BINOKEL_TEXTS.colTricks}</th>
            <th className="pr-4">{BINOKEL_TEXTS.colMeld}</th>
            <th className="pr-4">{BINOKEL_TEXTS.colDelta}</th>
            <th>{BINOKEL_TEXTS.colScore}</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {state.players.map((player, index) => (
            <tr key={player.id}>
              <td className="pr-4 font-semibold">{player.name}</td>
              <td className="pr-4">{result.perPlayer[index].trickPoints}</td>
              <td className="pr-4">{result.perPlayer[index].meldPoints}</td>
              <td className="pr-4">{signed(result.perPlayer[index].delta)}</td>
              <td>{player.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/**
 * The winner line for a finished match.
 *
 * @param state - a state at the match's end
 * @returns the banner text, or an empty string if there is no winner yet
 */
export function matchWinnerBanner(state: GameState): string {
  const winnerIndex = state.players.findIndex(
    (p) => p.id === state.matchWinnerId,
  );
  const winner = state.players[winnerIndex];
  let banner = "";
  if (winner !== undefined) {
    if (state.teams) {
      const team = teamOf(state, winnerIndex);
      const names = state.players
        .filter((_, index) => teamOf(state, index) === team)
        .map((player) => player.name)
        .join(" + ");
      banner = BINOKEL_TEXTS.teamWinner(names);
    } else {
      banner = BINOKEL_TEXTS.winner(winner.name);
    }
  }
  return banner;
}

/** Width of a hand card (Tailwind w-16), for the fan overlap maths. */
const CARD_WIDTH_PX = 64;

/** The smallest fraction of a card that may still show before the hand wraps. */
const MIN_VISIBLE_DIVISOR = 5;

/** A card must keep at least this much width visible, else the hand wraps. */
const MIN_VISIBLE_PX = CARD_WIDTH_PX / MIN_VISIBLE_DIVISOR;

/**
 * How much of each card shows when there is room to spare.
 *
 * @remarks
 * Even with plenty of width the cards still overlap this far into a held fan,
 * rather than lying flat and spread out on the table. So a hand looks the same -
 * held, overlapping - in every phase: bidding, melding and trick play alike.
 */
const FAN_STEP_PX = 42;

/** One row of the fanned hand: where it starts and the overlap step. */
type FanRow = {
  readonly start: number;
  readonly count: number;
  /** Pixels from one card's left edge to the next - the card's visible width. */
  readonly step: number;
};

/**
 * Lays cards into rows that overlap only as much as the width needs.
 *
 * @param count - how many cards are in hand
 * @param width - the available width in pixels
 * @returns the rows to render, each with its overlap step
 * @remarks
 * The cards always overlap into a held fan (at most {@link FAN_STEP_PX} of each
 * showing), so a hand looks held rather than laid flat, whatever the phase. On a
 * narrow screen they tuck closer, but never so far that less than a fifth of a
 * card shows - beyond that the hand breaks onto another row, cards spread evenly.
 */
function fanRows(count: number, width: number): FanRow[] {
  if (count === 0) {
    return [];
  }
  // Before the width is measured, keep one plain row (no overlap).
  if (width <= CARD_WIDTH_PX) {
    return [{ start: 0, count, step: CARD_WIDTH_PX }];
  }
  // Most cards that still show at least MIN_VISIBLE_PX of each in one row.
  const maxPerRow = Math.max(
    1,
    Math.floor(1 + (width - CARD_WIDTH_PX) / MIN_VISIBLE_PX),
  );
  const rowCount = Math.ceil(count / maxPerRow);
  const rows: FanRow[] = [];
  let start = 0;
  for (let row = 0; row < rowCount; row++) {
    // Spread the remaining cards evenly over the remaining rows.
    const n = Math.ceil((count - start) / (rowCount - row));
    const step =
      n <= 1
        ? CARD_WIDTH_PX
        : Math.min(FAN_STEP_PX, (width - CARD_WIDTH_PX) / (n - 1));
    rows.push({ start, count: n, step });
    start += n;
  }
  return rows;
}

/**
 * A hand shown as an overlapping fan that adapts to the available width.
 *
 * @param props - the cards and how to render each one
 * @returns the fanned hand element
 */
export function FannedHand({
  cards,
  renderCard,
}: {
  cards: readonly Card[];
  renderCard: (card: Card) => ReactElement;
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (element === null) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const rows = fanRows(cards.length, width);
  return (
    <div ref={ref} className="w-full">
      {rows.map((row) => (
        <div key={row.start} className={row.start === 0 ? "flex" : "mt-1 flex"}>
          {cards.slice(row.start, row.start + row.count).map((card, index) => (
            <div
              key={card.id}
              // Later cards sit on top; hovering lifts one clear of its neighbours.
              className="transition-transform hover:z-20 hover:-translate-y-2"
              style={{ marginLeft: index === 0 ? 0 : row.step - CARD_WIDTH_PX }}
            >
              {renderCard(card)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * The discard (drücken) step: the top row is pushed away, the bottom row kept.
 *
 * @param props - the full hand, the picked-up Dabb and the confirm handler
 * @returns the discard element
 * @remarks
 * Tapping a card marks it; tapping a card in the *other* row then swaps the two
 * between the rows and clears the mark. So you drag cards you want to keep out
 * of the top row and push unwanted ones up, then confirm. The top row always
 * holds exactly the Dabb's worth of cards, which are the ones discarded.
 */
export function DiscardHand({
  hand,
  takenDabb,
  withSevens,
  suitOrder,
  onConfirm,
}: {
  hand: readonly Card[];
  takenDabb: readonly Card[];
  withSevens: boolean;
  suitOrder: readonly Suit[];
  onConfirm: (cardIds: readonly string[]) => void;
}): ReactElement {
  const [discardIds, setDiscardIds] = useState<ReadonlySet<string>>(
    () => new Set(takenDabb.map((card) => card.id)),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const click = (cardId: string) => {
    if (selectedId === null || selectedId === cardId) {
      // First tap marks; tapping the marked card again clears it.
      setSelectedId(selectedId === cardId ? null : cardId);
    } else if (discardIds.has(selectedId) !== discardIds.has(cardId)) {
      // The two cards are in different rows - swap them and clear the mark.
      setDiscardIds((prev) => {
        const next = new Set(prev);
        if (prev.has(selectedId)) {
          next.delete(selectedId);
          next.add(cardId);
        } else {
          next.delete(cardId);
          next.add(selectedId);
        }
        return next;
      });
      setSelectedId(null);
    } else {
      // Same row - just move the mark to the new card.
      setSelectedId(cardId);
    }
  };

  const top = sortHand(
    hand.filter((card) => discardIds.has(card.id)),
    suitOrder,
  );
  const bottom = sortHand(
    hand.filter((card) => !discardIds.has(card.id)),
    suitOrder,
  );
  // The meld counts from the cards you keep (the bottom row), so it updates as
  // you swap; trump is still open, hence the range.
  const meld = meldRange(bottom, withSevens);
  const pickable = (card: Card): ReactElement => (
    <CardView
      key={card.id}
      card={card}
      selected={selectedId === card.id}
      onClick={() => click(card.id)}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {BINOKEL_TEXTS.swapHint}
      </p>
      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
        {BINOKEL_TEXTS.meldEstimate(meld.min, meld.max)}
      </p>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{BINOKEL_TEXTS.dabb}</h3>
        <div className="flex flex-wrap gap-2">{top.map(pickable)}</div>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{BINOKEL_TEXTS.yourHand}</h3>
        <div className="flex flex-wrap gap-2">{bottom.map(pickable)}</div>
      </div>
      <button
        type="button"
        onClick={() => onConfirm([...discardIds])}
        className="cursor-pointer self-start rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        {BINOKEL_TEXTS.confirmDiscard}
      </button>
    </div>
  );
}

/** Props of {@link CardView}. */
type CardViewProps = {
  readonly card: Card;
  readonly onClick?: () => void;
  readonly selected?: boolean;
  readonly dim?: boolean;
  /** Marks a card that is part of a meld (highlighted while melding). */
  readonly highlight?: boolean;
};

/** One card, drawn from its artwork; optionally clickable. */
export function CardView({
  card,
  onClick,
  selected,
  dim,
  highlight,
}: CardViewProps): ReactElement {
  const frame = selected
    ? "-translate-y-2 border-emerald-500 ring-2 ring-emerald-400"
    : highlight
      ? "border-amber-400 ring-2 ring-amber-400"
      : "border-zinc-200 dark:border-zinc-700";
  const image = (
    <span
      className={[
        "relative block w-16 overflow-hidden rounded-lg border shadow-sm",
        frame,
        dim ? "opacity-40" : "",
      ].join(" ")}
      style={{ aspectRatio: CARD_ASPECT }}
    >
      <Image
        src={CARD_IMAGES[card.suit][card.rank]}
        alt={`${RANK_LABELS[card.rank]} ${SUIT_LABELS[card.suit]}`}
        fill
        sizes="64px"
        className="object-contain"
      />
    </span>
  );

  return onClick === undefined ? (
    image
  ) : (
    <button type="button" onClick={onClick} className="cursor-pointer">
      {image}
    </button>
  );
}

/** A small face-up card, for showing the cards that make up a meld. */
function MeldCard({ card }: { card: Card }): ReactElement {
  return (
    <span
      className="relative block w-9 overflow-hidden rounded border border-zinc-200 dark:border-zinc-700"
      style={{ aspectRatio: CARD_ASPECT }}
    >
      <Image
        src={CARD_IMAGES[card.suit][card.rank]}
        alt={`${RANK_LABELS[card.rank]} ${SUIT_LABELS[card.suit]}`}
        fill
        sizes="36px"
        className="object-contain"
      />
    </span>
  );
}

/** A small face-down card, for opponents' hands. */
function MiniBack(): ReactElement {
  return (
    <span
      className="relative block w-8 overflow-hidden rounded border border-zinc-200 dark:border-zinc-700"
      style={{ aspectRatio: CARD_ASPECT }}
    >
      <Image
        src={CARD_BACK}
        alt=""
        fill
        sizes="32px"
        className="object-contain"
      />
    </span>
  );
}

/** A small pill label. */
export function Badge({ children }: { children: string }): ReactElement {
  return (
    <span className="rounded-full bg-amber-200 px-1.5 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-200">
      {children}
    </span>
  );
}

/** The four trump buttons the declarer picks from. */
export function TrumpChoice({
  onPick,
}: {
  onPick: (suit: Suit) => void;
}): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">
        {BINOKEL_TEXTS.chooseTrumpTitle}
      </h2>
      <div className="flex flex-wrap gap-2">
        {SUITS.map((suit) => (
          <button
            key={suit}
            type="button"
            onClick={() => onPick(suit)}
            aria-label={SUIT_LABELS[suit]}
            className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-zinc-300 p-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <span className="relative block h-14 w-14 overflow-hidden rounded-md">
              <Image
                src={SUIT_IMAGES[suit]}
                alt=""
                fill
                sizes="56px"
                className="object-contain"
              />
            </span>
            <span className="text-xs font-medium">{SUIT_LABELS[suit]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** The declarer's Abgehen/Spielen then Normal/Durch choice. */
export function DeclarerChoice({
  onConcede,
  onDeclare,
}: {
  onConcede: () => void;
  onDeclare: (gameType: GameType) => void;
}): ReactElement {
  // The declarer first chooses Abgehen/Spielen, then Durch/Normal.
  const [choosingType, setChoosingType] = useState(false);
  return choosingType ? (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onDeclare("normal")}
          className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {BINOKEL_TEXTS.playNormal}
        </button>
        <button
          type="button"
          onClick={() => onDeclare("durch")}
          className="cursor-pointer rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
        >
          {BINOKEL_TEXTS.playDurch}
        </button>
      </div>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {BINOKEL_TEXTS.durchHint}
      </span>
    </div>
  ) : (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onConcede}
        className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {BINOKEL_TEXTS.concede}
      </button>
      <button
        type="button"
        onClick={() => setChoosingType(true)}
        className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        {BINOKEL_TEXTS.playOn}
      </button>
    </div>
  );
}

/** A small coloured team label (A/B), so partners are easy to spot. */
function TeamBadge({ team }: { team: number }): ReactElement {
  const isFirst = team === 0;
  return (
    <span
      className={`rounded-full px-1.5 text-xs font-semibold ${
        isFirst
          ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
          : "bg-sky-200 text-sky-800 dark:bg-sky-900 dark:text-sky-200"
      }`}
    >
      {isFirst ? "A" : "B"}
    </span>
  );
}
