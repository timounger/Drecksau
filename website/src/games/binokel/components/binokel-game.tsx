/**
 * Binokel - playable against two computer opponents.
 *
 * @module
 * @remarks
 * Runs the whole round through the tested engine: bidding, taking the Dabb and
 * discarding, announcing trump, melding, trick play and scoring across rounds.
 * The card artwork is swappable by file name.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactElement } from "react";
import { RANK_STRENGTH, SUITS, type Card } from "@/games/binokel/engine/cards";
import { findMelds } from "@/games/binokel/engine/melds";
import { baseHandSize, nextBidValue } from "@/games/binokel/engine/moves";
import { roundResult } from "@/games/binokel/engine/scoring";
import type { BinokelPlayer, GameState } from "@/games/binokel/engine/state";
import {
  CARD_ASPECT,
  CARD_BACK,
  CARD_IMAGES,
} from "@/games/binokel/assets/card-images";
import { useBinokelGame } from "@/games/binokel/hooks/use-binokel-game";
import {
  BINOKEL_TEXTS,
  RANK_LABELS,
  SUIT_LABELS,
  meldLabel,
} from "@/games/binokel/i18n/binokel-texts";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/** How many face-down cards to show for an opponent. */
const OPPONENT_BACKS_SHOWN = 8;

/**
 * Renders the Binokel game.
 *
 * @returns the Binokel element
 */
export function BinokelGame(): ReactElement {
  const game = useBinokelGame();
  const { state } = game;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{BINOKEL_TEXTS.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {BINOKEL_TEXTS.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => game.newMatch()}
            className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {BINOKEL_TEXTS.newMatch}
          </button>
          <Link
            href="/binokel/statistik"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {BINOKEL_TEXTS.statistics}
          </Link>
          <Link
            href="/binokel/einstellungen"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {BINOKEL_TEXTS.settings}
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {COLLECTION_TEXTS.title}
          </Link>
        </div>
      </header>

      <Scoreboard state={state} />

      <div className="flex flex-wrap gap-3">
        {[state.players[1], state.players[2]].map((player, offset) => (
          <OpponentSeat
            key={player.id}
            state={state}
            player={player}
            index={offset + 1}
          />
        ))}
      </div>

      <CenterPanel game={game} />

      <section className="flex flex-col gap-2">
        <HumanHand game={game} />
      </section>
    </div>
  );
}

/** The cumulative scores and the round's key facts. */
function Scoreboard({ state }: { state: GameState }): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white/60 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      {state.players.map((player) => (
        <span key={player.id} className="flex items-center gap-1">
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
function OpponentSeat({
  state,
  player,
  index,
}: {
  state: GameState;
  player: BinokelPlayer;
  index: number;
}): ReactElement {
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
        <span className="font-semibold">{player.name}</span>
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

/** The phase-specific middle of the screen. */
function CenterPanel({
  game,
}: {
  game: ReturnType<typeof useBinokelGame>;
}): ReactElement {
  const { state } = game;
  let content: ReactElement;

  switch (state.phase) {
    case "bidding":
      content = <BiddingPanel game={game} />;
      break;
    case "exchange":
      content = <ExchangePanel game={game} />;
      break;
    case "melding":
      content = <MeldingPanel game={game} />;
      break;
    case "trick":
      content = <TrickPanel game={game} />;
      break;
    case "roundEnd":
      content = <RoundEndPanel game={game} />;
      break;
    case "matchEnd":
      content = <MatchEndPanel game={game} />;
      break;
    default:
      content = <></>;
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      {content}
    </div>
  );
}

/** Bidding controls. */
function BiddingPanel({
  game,
}: {
  game: ReturnType<typeof useBinokelGame>;
}): ReactElement {
  const { state } = game;
  const humanTurn = state.currentPlayerIndex === 0 && state.players[0].bidding;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">{BINOKEL_TEXTS.bidding}</h2>
      {humanTurn ? (
        <div className="flex items-center gap-2">
          <span className="text-sm">{BINOKEL_TEXTS.yourBidTurn}</span>
          <button
            type="button"
            onClick={game.bid}
            className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {BINOKEL_TEXTS.reizen(nextBidValue(state))}
          </button>
          <button
            type="button"
            onClick={game.pass}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {BINOKEL_TEXTS.pass}
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {BINOKEL_TEXTS.waiting(state.players[state.currentPlayerIndex].name)}
        </p>
      )}
    </div>
  );
}

/** Discarding then choosing trump, or waiting for the AI declarer. */
function ExchangePanel({
  game,
}: {
  game: ReturnType<typeof useBinokelGame>;
}): ReactElement {
  const { state } = game;
  const declarer = state.declarerIndex;
  let content: ReactElement;

  if (declarer !== 0) {
    content = (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {BINOKEL_TEXTS.declarerWorking(
          declarer === null ? "" : state.players[declarer].name,
        )}
      </p>
    );
  } else if (state.trump === null) {
    // The hand size tells discard from trump-choice.
    const base = baseHandSize(state);
    content =
      state.players[0].hand.length > base ? (
        <p className="text-sm">
          {BINOKEL_TEXTS.discardPrompt(state.players[0].hand.length - base)}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">
            {BINOKEL_TEXTS.chooseTrumpTitle}
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUITS.map((suit) => (
              <button
                key={suit}
                type="button"
                onClick={() => game.pickTrump(suit)}
                className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {SUIT_LABELS[suit]}
              </button>
            ))}
          </div>
        </div>
      );
  } else {
    content = <></>;
  }
  return content;
}

/** Everyone's melds, then a button into trick play. */
function MeldingPanel({
  game,
}: {
  game: ReturnType<typeof useBinokelGame>;
}): ReactElement {
  const { state } = game;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">{BINOKEL_TEXTS.meldingTitle}</h2>
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
                <ul className="text-xs text-zinc-500 dark:text-zinc-400">
                  {found.melds.map((meld, i) => (
                    <li key={i}>
                      {meldLabel(meld)} ({meld.points})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={game.beginTrickPlay}
        className="cursor-pointer self-start rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        {BINOKEL_TEXTS.toTricks}
      </button>
    </div>
  );
}

/** The current trick and whose turn it is. */
function TrickPanel({
  game,
}: {
  game: ReturnType<typeof useBinokelGame>;
}): ReactElement {
  const { state } = game;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{BINOKEL_TEXTS.trickTitle}</h2>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {state.currentPlayerIndex === 0
            ? BINOKEL_TEXTS.yourTurn
            : BINOKEL_TEXTS.waiting(
                state.players[state.currentPlayerIndex].name,
              )}
        </span>
      </div>
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
    </div>
  );
}

/** The round result table. */
function RoundEndPanel({
  game,
}: {
  game: ReturnType<typeof useBinokelGame>;
}): ReactElement {
  const { state } = game;
  const result = roundResult(state);
  const declarer =
    state.declarerIndex === null ? null : state.players[state.declarerIndex];
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">
        {BINOKEL_TEXTS.roundResultTitle}
      </h2>
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
      <button
        type="button"
        onClick={game.nextRound}
        className="cursor-pointer self-start rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        {BINOKEL_TEXTS.nextRound}
      </button>
    </div>
  );
}

/** Signs a number for display. */
function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/** The winner banner. */
function MatchEndPanel({
  game,
}: {
  game: ReturnType<typeof useBinokelGame>;
}): ReactElement {
  const { state } = game;
  const winner = state.players.find((p) => p.id === state.matchWinnerId);
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">
        {"\u{1F3C6}"}{" "}
        {winner !== undefined && BINOKEL_TEXTS.winner(winner.name)}
      </h2>
      <button
        type="button"
        onClick={() => game.newMatch()}
        className="cursor-pointer self-start rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        {BINOKEL_TEXTS.newMatch}
      </button>
    </div>
  );
}

/** The human's hand - clickable during a trick or while discarding. */
function HumanHand({
  game,
}: {
  game: ReturnType<typeof useBinokelGame>;
}): ReactElement {
  const { state } = game;
  const [selected, setSelected] = useState<string[]>([]);

  const base = baseHandSize(state);
  const isDiscard =
    state.phase === "exchange" &&
    state.declarerIndex === 0 &&
    state.trump === null &&
    state.players[0].hand.length > base;
  const need = state.players[0].hand.length - base;

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : current.length < need
          ? [...current, id]
          : current,
    );

  // While discarding, the picked-up Dabb sits on top, the rest of the hand
  // below; a click on any card marks it to be pushed away.
  if (isDiscard) {
    const dabbIds = new Set(state.takenDabb.map((card) => card.id));
    const own = state.players[0].hand;
    const dabbCards = sortHand(own.filter((card) => dabbIds.has(card.id)));
    const handCards = sortHand(own.filter((card) => !dabbIds.has(card.id)));
    const pickable = (card: Card): ReactElement => (
      <CardView
        key={card.id}
        card={card}
        selected={selected.includes(card.id)}
        onClick={() => toggle(card.id)}
      />
    );

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{BINOKEL_TEXTS.dabb}</h3>
          <div className="flex flex-wrap gap-2">{dabbCards.map(pickable)}</div>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{BINOKEL_TEXTS.yourHand}</h3>
          <div className="flex flex-wrap gap-2">{handCards.map(pickable)}</div>
        </div>
        <button
          type="button"
          disabled={selected.length !== need}
          onClick={() => {
            game.confirmDiscard(selected);
            setSelected([]);
          }}
          className="cursor-pointer self-start rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {BINOKEL_TEXTS.confirmDiscard} ({selected.length}/{need})
        </button>
      </div>
    );
  }

  const hand = sortHand(state.players[0].hand);
  const isPlay = state.phase === "trick" && state.currentPlayerIndex === 0;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">
        {BINOKEL_TEXTS.yourHand} ({hand.length})
      </h2>
      <div className="flex flex-wrap gap-2">
        {hand.map((card) => {
          const playable = isPlay && game.legalCardIds.includes(card.id);
          return (
            <CardView
              key={card.id}
              card={card}
              dim={isPlay && !playable}
              onClick={playable ? () => game.play(card.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Props of {@link CardView}. */
type CardViewProps = {
  readonly card: Card;
  readonly onClick?: () => void;
  readonly selected?: boolean;
  readonly dim?: boolean;
};

/** One card, drawn from its artwork; optionally clickable. */
function CardView({
  card,
  onClick,
  selected,
  dim,
}: CardViewProps): ReactElement {
  const image = (
    <span
      className={[
        "relative block w-16 overflow-hidden rounded-lg border shadow-sm",
        selected
          ? "-translate-y-2 border-emerald-500 ring-2 ring-emerald-400"
          : "border-zinc-200 dark:border-zinc-700",
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
function Badge({ children }: { children: string }): ReactElement {
  return (
    <span className="rounded-full bg-amber-200 px-1.5 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-200">
      {children}
    </span>
  );
}

/** Sorts a hand by suit, then by trick strength high to low. */
function sortHand(hand: readonly Card[]): Card[] {
  return [...hand].sort(
    (a, b) =>
      SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit) ||
      RANK_STRENGTH[b.rank] - RANK_STRENGTH[a.rank],
  );
}
