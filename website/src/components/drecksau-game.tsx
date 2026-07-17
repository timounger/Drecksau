/**
 * The playable game: opponents, own board, hand and log.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { isCardPlayable } from "@/game/moves";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/game/setup";
import { currentPlayer, playerById } from "@/game/state";
import { useDrecksauGame } from "@/hooks/use-drecksau-game";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/lib/settings/settings-store";
import { CARD_NAMES, UI_TEXTS } from "@/i18n/translations";
import { ActionEffectOverlay } from "./action-effect-overlay";
import { GameLog } from "./game-log";
import { HandCardView } from "./hand-card-view";
import { PlayerBoard } from "./player-board";

/** Table sizes the player can choose from, derived from the engine limits. */
const PLAYER_COUNTS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (unused, index) => MIN_PLAYERS + index,
);

/** Default table size of the first game. */
const DEFAULT_PLAYER_COUNT = 3;

/**
 * Renders a complete game of Drecksau against computer opponents.
 *
 * @returns the game element
 */
export function DrecksauGame(): ReactElement {
  const game = useDrecksauGame(DEFAULT_PLAYER_COUNT);
  const { state } = game;

  // The card design is a live visual setting - switching it redraws at once.
  const theme = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  ).cardTheme;

  const human = state.players[0];
  const opponents = state.players.slice(1);
  const actor = currentPlayer(state);
  const winner =
    state.winnerId === null ? null : playerById(state, state.winnerId);

  // The table size comes from the running game, so a restored game keeps its
  // own player count instead of the last thing that was picked here.
  const handleNewGame = (count: number) => game.startGame(count);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <ActionEffectOverlay effect={game.effect} />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{UI_TEXTS.appTitle}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {/* The expansion adds a second way to win, so the goal changes. */}
            {state.hasExpansion ? UI_TEXTS.taglineExpansion : UI_TEXTS.tagline}
          </p>
        </div>

        {/* Unlike the card rows, these controls may wrap - otherwise they push
            the page wider than a phone screen. */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label
            htmlFor="player-count"
            className="text-xs text-zinc-500 dark:text-zinc-400"
          >
            {UI_TEXTS.playerCount}
          </label>
          <select
            id="player-count"
            value={game.playerCount}
            onChange={(event) => handleNewGame(Number(event.target.value))}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {PLAYER_COUNTS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => handleNewGame(game.playerCount)}
            className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {UI_TEXTS.newGame}
          </button>
          <Link
            href="/statistik"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {UI_TEXTS.statistics}
          </Link>
          <Link
            href="/einstellungen"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {UI_TEXTS.settings}
          </Link>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-3">
          {opponents.map((opponent) => (
            <PlayerBoard
              key={opponent.id}
              player={opponent}
              isActive={opponent.id === actor.id}
              targetPigIds={game.targetPigIds}
              showBeautyCount={state.hasExpansion}
              theme={theme}
              onSelectPig={game.playAtPig}
            />
          ))}

          <PlayerBoard
            player={human}
            isActive={human.id === actor.id}
            targetPigIds={game.targetPigIds}
            showBeautyCount={state.hasExpansion}
            theme={theme}
            onSelectPig={game.playAtPig}
          />

          <TurnBanner
            winnerName={winner?.name ?? null}
            didHumanWin={winner?.isHuman ?? false}
            isHumanTurn={game.isHumanTurn}
            actorName={actor.name}
            selectedCardName={selectedCardName(game)}
            pendingCount={game.isHumanTurn ? state.pendingCardIds.length : 0}
            onCancel={game.clearSelection}
            onPlayAgain={() => handleNewGame(game.playerCount)}
          />

          <section>
            <h2 className="mb-2 text-sm font-semibold">{UI_TEXTS.yourHand}</h2>
            {/* Never wraps: the hand belongs on one line. Too narrow a window
                shrinks the cards instead - see HandCardView. */}
            <div data-testid="hand-row" className="flex gap-2">
              {human.hand.map((card) => (
                <HandCardView
                  key={card.id}
                  card={card}
                  theme={theme}
                  isPlayable={isCardPlayable(state, human.id, card.type)}
                  isSelected={card.id === game.selectedCardId}
                  isDisabled={!game.isHumanTurn}
                  onSelect={game.selectCard}
                  onDiscard={game.discard}
                />
              ))}
            </div>

            {game.isHumanBlocked && (
              <button
                type="button"
                onClick={game.redraw}
                className="mt-2 cursor-pointer rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
              >
                {UI_TEXTS.redrawHand}
              </button>
            )}
          </section>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 lg:max-h-[calc(100vh-8rem)]">
          <div className="flex gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="rounded-lg border border-zinc-200 px-2 py-1 dark:border-zinc-800">
              {UI_TEXTS.drawPile}: {state.drawPile.length}
            </span>
            <span className="rounded-lg border border-zinc-200 px-2 py-1 dark:border-zinc-800">
              {UI_TEXTS.discardPile}: {state.discardPile.length}
            </span>
          </div>
          <GameLog entries={state.log} />
        </aside>
      </div>
    </div>
  );
}

/** Props of {@link TurnBanner}. */
type TurnBannerProps = {
  readonly winnerName: string | null;
  /** True if the winner is the human - checked by identity, not by name. */
  readonly didHumanWin: boolean;
  readonly isHumanTurn: boolean;
  readonly actorName: string;
  readonly selectedCardName: string | null;
  /** Cards the Glücksvogel still expects from the player; 0 for a normal turn. */
  readonly pendingCount: number;
  readonly onCancel: () => void;
  readonly onPlayAgain: () => void;
};

/** Status line: whose turn it is, what to do next, or who won. */
function TurnBanner({
  winnerName,
  didHumanWin,
  isHumanTurn,
  actorName,
  selectedCardName,
  pendingCount,
  onCancel,
  onPlayAgain,
}: TurnBannerProps): ReactElement {
  let content: ReactElement;

  if (winnerName !== null) {
    content = (
      <div className="flex items-center gap-3">
        <span className="font-semibold">
          {"\u{1F389}"}{" "}
          {/* Addressed directly, whatever the player calls themselves. */}
          {didHumanWin ? UI_TEXTS.youWon : UI_TEXTS.playerWon(winnerName)}
        </span>
        <button
          type="button"
          onClick={onPlayAgain}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {UI_TEXTS.playAgain}
        </button>
      </div>
    );
  } else if (selectedCardName !== null) {
    content = (
      <div className="flex items-center gap-3">
        <span>
          {selectedCardName}: {UI_TEXTS.chooseTarget}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {UI_TEXTS.cancel}
        </button>
      </div>
    );
  } else if (pendingCount > 0) {
    // A Glücksvogel turn is unusual: the hand is short and the turn does not
    // pass. Say what is expected, and that discarding is a way out too - the
    // card may well have no legal target.
    content = (
      <span className="font-medium">
        {"\u{1F426}"} {UI_TEXTS.luckyBirdPending(pendingCount)}
      </span>
    );
  } else if (isHumanTurn) {
    content = <span className="font-medium">{UI_TEXTS.yourTurn}</span>;
  } else {
    content = (
      <span className="text-zinc-500 dark:text-zinc-400">
        {actorName} {UI_TEXTS.opponentTurn} {"…"}
      </span>
    );
  }

  return (
    <div className="flex min-h-11 items-center rounded-2xl border border-zinc-200 bg-white/60 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      {content}
    </div>
  );
}

/** German name of the card the player is currently aiming with. */
function selectedCardName(
  game: ReturnType<typeof useDrecksauGame>,
): string | null {
  const card = game.state.players[0].hand.find(
    (candidate) => candidate.id === game.selectedCardId,
  );
  return card === undefined ? null : CARD_NAMES[card.type];
}
