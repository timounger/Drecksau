/**
 * Binokel - playable against two computer opponents.
 *
 * @module
 * @remarks
 * Runs the whole round through the tested engine: bidding, taking the Dabb and
 * discarding, announcing trump, melding, trick play and scoring across rounds.
 * The presentational pieces are shared with the online board via
 * {@link ./binokel-parts}; this file drives them from the local game hook.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import type { Suit } from "@/games/binokel/engine/cards";
import { findMelds } from "@/games/binokel/engine/melds";
import { baseHandSize, nextBidValue } from "@/games/binokel/engine/moves";
import { useBinokelGame } from "@/games/binokel/hooks/use-binokel-game";
import {
  getBinokelSettingsSnapshot,
  getServerBinokelSettingsSnapshot,
  subscribeBinokelSettings,
} from "@/games/binokel/settings/binokel-settings-store";
import { BINOKEL_TEXTS } from "@/games/binokel/i18n/binokel-texts";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";
import {
  CardView,
  DeclarerChoice,
  DiscardHand,
  FannedHand,
  MeldsGrid,
  meldRange,
  OpponentSeat,
  RoundEndTable,
  Scoreboard,
  TrickArea,
  TrumpChoice,
  matchWinnerBanner,
  sortHand,
} from "./binokel-parts";

/**
 * Renders the Binokel game.
 *
 * @returns the Binokel element
 */
export function BinokelGame(): ReactElement {
  const game = useBinokelGame();
  const { state } = game;
  const settings = useSyncExternalStore(
    subscribeBinokelSettings,
    getBinokelSettingsSnapshot,
    getServerBinokelSettingsSnapshot,
  );
  // A full trick sits on the table until the player clicks to gather it.
  const trickPending =
    state.phase === "trick" &&
    state.currentTrick.length === state.players.length;
  // The melds stay on screen until the player taps to move on. The declarer
  // instead uses the Abgehen/Spielen choice in the melds panel.
  const meldingReview = state.phase === "melding" && state.declarerIndex !== 0;

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
            href="/binokel/online"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {BINOKEL_TEXTS.online}
          </Link>
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
        {state.players.slice(1).map((_, offset) => (
          <OpponentSeat
            key={state.players[offset + 1].id}
            state={state}
            index={offset + 1}
          />
        ))}
      </div>

      <CenterPanel game={game} />

      <section className="flex flex-col gap-2">
        <HumanHand game={game} suitOrder={settings.suitOrder} />
      </section>

      {/* When a trick is complete, a full-screen layer waits for a click (or a
          key) so the last card can be seen before the trick is gathered. */}
      {trickPending && (
        <button
          type="button"
          onClick={game.collect}
          aria-label={BINOKEL_TEXTS.continueTrick}
          className="fixed inset-0 z-40 flex cursor-pointer items-end justify-center pb-10"
        >
          <span className="rounded-full bg-zinc-900/90 px-5 py-2 text-sm font-medium text-white shadow-lg dark:bg-zinc-100/90 dark:text-zinc-900">
            {BINOKEL_TEXTS.trickComplete} - {BINOKEL_TEXTS.continueTrick}
          </span>
        </button>
      )}

      {/* The melds stay until the player taps anywhere to move to trick play. */}
      {meldingReview && (
        <button
          type="button"
          onClick={() => game.declare("normal")}
          aria-label={BINOKEL_TEXTS.toTricks}
          className="fixed inset-0 z-40 flex cursor-pointer items-end justify-center pb-10"
        >
          <span className="rounded-full bg-zinc-900/90 px-5 py-2 text-sm font-medium text-white shadow-lg dark:bg-zinc-100/90 dark:text-zinc-900">
            {BINOKEL_TEXTS.toTricks}
          </span>
        </button>
      )}
    </div>
  );
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
  const meld = meldRange(state.players[0].hand, state.withSevens);
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">{BINOKEL_TEXTS.bidding}</h2>
      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
        {BINOKEL_TEXTS.meldEstimate(meld.min, meld.max)}
      </p>
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
        <TrumpChoice onPick={game.pickTrump} />
      );
  } else {
    content = <></>;
  }
  return content;
}

/** Everyone's melds, then the declarer's choice into trick play. */
function MeldingPanel({
  game,
}: {
  game: ReturnType<typeof useBinokelGame>;
}): ReactElement {
  const { state } = game;
  const humanIsDeclarer = state.declarerIndex === 0;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">{BINOKEL_TEXTS.meldingTitle}</h2>
      <MeldsGrid state={state} />
      {humanIsDeclarer && (
        <DeclarerChoice onConcede={game.concede} onDeclare={game.declare} />
      )}
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
          {state.currentTrick.length === state.players.length
            ? BINOKEL_TEXTS.trickComplete
            : state.currentPlayerIndex === 0
              ? BINOKEL_TEXTS.yourTurn
              : BINOKEL_TEXTS.waiting(
                  state.players[state.currentPlayerIndex].name,
                )}
        </span>
      </div>
      <TrickArea state={state} />
    </div>
  );
}

/** The round result table plus the next-round button. */
function RoundEndPanel({
  game,
}: {
  game: ReturnType<typeof useBinokelGame>;
}): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">
        {BINOKEL_TEXTS.roundResultTitle}
      </h2>
      <RoundEndTable state={game.state} />
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

/** The winner banner. */
function MatchEndPanel({
  game,
}: {
  game: ReturnType<typeof useBinokelGame>;
}): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">
        {"\u{1F3C6}"} {matchWinnerBanner(game.state)}
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
  suitOrder,
}: {
  game: ReturnType<typeof useBinokelGame>;
  suitOrder: readonly Suit[];
}): ReactElement {
  const { state } = game;

  const base = baseHandSize(state);
  const isDiscard =
    state.phase === "exchange" &&
    state.declarerIndex === 0 &&
    state.trump === null &&
    state.players[0].hand.length > base;

  // Discarding is its own component so it starts fresh each round (a new Dabb).
  if (isDiscard) {
    return (
      <DiscardHand
        hand={state.players[0].hand}
        takenDabb={state.takenDabb}
        withSevens={state.withSevens}
        suitOrder={suitOrder}
        onConfirm={game.confirmDiscard}
      />
    );
  }

  const hand = sortHand(state.players[0].hand, suitOrder);
  const isPlay = state.phase === "trick" && state.currentPlayerIndex === 0;

  // While the melds are shown, mark the hand cards that make up a meld.
  const meldCardIds =
    state.phase === "melding"
      ? new Set(
          findMelds(state.players[0].hand, state.trump, state.withSevens)
            .melds.flatMap((meld) => meld.cards)
            .map((card) => card.id),
        )
      : null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">
        {BINOKEL_TEXTS.yourHand} ({hand.length})
      </h2>
      <FannedHand
        cards={hand}
        renderCard={(card) => {
          const playable = isPlay && game.legalCardIds.includes(card.id);
          return (
            <CardView
              card={card}
              dim={isPlay && !playable}
              highlight={meldCardIds?.has(card.id) ?? false}
              onClick={playable ? () => game.play(card.id) : undefined}
            />
          );
        }}
      />
    </div>
  );
}
