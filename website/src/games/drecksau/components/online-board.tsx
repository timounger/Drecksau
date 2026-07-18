/**
 * The playing board for an online game - every seat is a human player.
 *
 * @module
 * @remarks
 * Rendered from the room the host publishes, with this player's own hand
 * already merged in. Targeting (which card is picked, which pigs it may hit) is
 * local to the client; the chosen move is sent on, and the host's referee has
 * the final say. Only the seat whose turn it is can act.
 */
"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import {
  EFFECT_DURATIONS_MS,
  ActionEffectOverlay,
  type CardEffect,
} from "@/games/drecksau/components/action-effect-overlay";
import {
  isBlocked,
  isCardPlayable,
  isCardUsableNow,
  legalTargets,
  needsTarget,
} from "@/games/drecksau/engine/moves";
import type { ActionCardType } from "@/games/drecksau/engine/cards";
import type { GameState, Move, PigId } from "@/games/drecksau/engine/state";
import type { RoomState, SeatId } from "@/games/drecksau/multiplayer/room";
import type { ChatMessage } from "@/games/drecksau/multiplayer/transport";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/drecksau/settings/settings-store";
import {
  CARD_NAMES,
  ONLINE_TEXTS,
  UI_TEXTS,
} from "@/games/drecksau/i18n/translations";
import { GameLog } from "./game-log";
import { GameResultOverlay, type GameOutcome } from "./game-result-overlay";
import { HandCardView } from "./hand-card-view";
import { OnlineChat } from "@/online/online-chat";
import { PlayerBoard } from "./player-board";

/** How often the auto-play countdown refreshes, in milliseconds. */
const COUNTDOWN_TICK_MS = 250;
/** Milliseconds in a second, for the countdown label. */
const MS_PER_SECOND = 1000;
/** At or below this, the countdown turns red to signal the takeover is near. */
const LOW_TIME_MS = 5000;

/** Props of {@link OnlineBoard}. */
export type OnlineBoardProps = {
  /** The room to render, this player's own hand already merged in. */
  readonly room: RoomState;
  /** This player's seat id. */
  readonly seatId: SeatId;
  /** Sends a move - applied by the host if it is this player's turn. */
  readonly sendMove: (move: Move) => void;
  /** Chat lines so far, oldest first. */
  readonly messages: readonly ChatMessage[];
  /** Sends a chat line to everyone in the room. */
  readonly sendChat: (text: string) => void;
};

/**
 * Renders an online game and lets the player on turn act.
 *
 * @param props - the room, the viewer's seat and the move sink
 * @returns the board element
 */
export function OnlineBoard({
  room,
  seatId,
  sendMove,
  messages,
  sendChat,
}: OnlineBoardProps): ReactElement {
  const game = room.game as GameState;
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [effect, setEffect] = useState<CardEffect | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  // The id of the last play we already animated. Starts at the stamp present
  // when the board mounts, so a play from before we joined is not replayed.
  const lastShownEffectId = useRef(room.lastEffect?.id ?? null);

  const autoPlayMs = room.autoPlayMs ?? null;

  const theme = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  ).cardTheme;

  const mySeatIndex = room.seats.findIndex((seat) => seat.id === seatId);
  const me = game.players[mySeatIndex];
  const actorIndex = game.currentPlayerIndex;
  const isMyTurn = mySeatIndex === actorIndex && game.winnerId === null;
  // A selection only counts while it is this player's turn; deriving it avoids
  // an effect just to clear a stale pick when the turn moves on.
  const activeSelectionId = isMyTurn ? selectedCardId : null;

  // Animate whenever the host stamps a newly played card - own move or not.
  // The id only changes on a real play, so discards and hand swaps show nothing.
  useEffect(() => {
    const latest = room.lastEffect;
    if (latest !== undefined && latest.id !== lastShownEffectId.current) {
      lastShownEffectId.current = latest.id;
      // The host only ever stamps a real card type; the wire type is a string.
      setEffect({ type: latest.type as ActionCardType, id: latest.id });
    }
  }, [room.lastEffect]);

  // Take the effect off screen once it has played.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (effect !== null) {
      timer = setTimeout(
        () => setEffect(null),
        EFFECT_DURATIONS_MS[effect.type],
      );
    }
    return () => clearTimeout(timer);
  }, [effect]);

  // Count the auto-play timeout down for whoever is on turn. It restarts on
  // every turn (a new version), matching when the host restarts its own timer.
  useEffect(() => {
    if (autoPlayMs === null || autoPlayMs <= 0 || game.winnerId !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no countdown to show
      setRemainingMs(null);
      return;
    }
    const deadline = Date.now() + autoPlayMs;
    setRemainingMs(autoPlayMs);
    const timer = setInterval(() => {
      const left = deadline - Date.now();
      setRemainingMs(left > 0 ? left : 0);
      if (left <= 0) {
        clearInterval(timer);
      }
    }, COUNTDOWN_TICK_MS);
    return () => clearInterval(timer);
  }, [room.version, autoPlayMs, game.winnerId]);

  // A card the viewer owns is missing from a redacted view only if something is
  // very wrong; guard so a mid-join snapshot cannot crash the board.
  if (me === undefined || mySeatIndex < 0) {
    return <p className="p-4 text-sm">{ONLINE_TEXTS.connecting}</p>;
  }

  // Every client, mover included, animates from the host's published stamp, so
  // playing only sends the move; the animation follows from the next snapshot.
  const doPlay = (move: Move) => {
    sendMove(move);
    setSelectedCardId(null);
  };

  const selectCard = (cardId: string) => {
    if (isMyTurn) {
      const card = me.hand.find((candidate) => candidate.id === cardId);
      if (card !== undefined) {
        if (needsTarget(card.type)) {
          setSelectedCardId(cardId);
        } else {
          doPlay({ kind: "playCard", cardId });
        }
      }
    }
  };

  const playAtPig = (pigId: PigId) => {
    if (isMyTurn && selectedCardId !== null) {
      doPlay({ kind: "playCard", cardId: selectedCardId, targetPigId: pigId });
    }
  };

  const discard = (cardId: string) => {
    if (isMyTurn) {
      doPlay({ kind: "discardCard", cardId });
    }
  };

  const redraw = () => {
    if (isMyTurn) {
      doPlay({ kind: "redrawHand" });
    }
  };

  const selectedCard =
    activeSelectionId === null
      ? null
      : (me.hand.find((card) => card.id === activeSelectionId) ?? null);
  const targetPigIds =
    isMyTurn && selectedCard !== null
      ? legalTargets(game, me.id, selectedCard.type)
      : [];
  const isMyBlocked = isMyTurn && isBlocked(game, me.id);
  const others = room.seats
    .map((seat, index) => ({ seat, index }))
    .filter((entry) => entry.index !== mySeatIndex);
  const outcome: GameOutcome | null =
    game.winnerId === null ? null : game.winnerId === me.id ? "won" : "lost";
  // Countdown badge for the player on turn, shown only while auto-play is on.
  const autoPlayBadge =
    remainingMs === null ? null : (
      <AutoPlayCountdown remainingMs={remainingMs} />
    );
  const botSeatIds = room.botSeatIds ?? [];
  const isBotIndex = (index: number) =>
    botSeatIds.includes(room.seats[index]?.id);
  const actorIsBot = isBotIndex(actorIndex);

  // A seat the computer took over is always labelled; otherwise the on-turn
  // player may show the auto-play countdown.
  const badgeFor = (index: number) =>
    isBotIndex(index) ? (
      <ComputerBadge />
    ) : index === actorIndex ? (
      autoPlayBadge
    ) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <ActionEffectOverlay effect={effect} />
      <GameResultOverlay outcome={outcome} />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-3">
          {others.map(({ index }) => (
            <PlayerBoard
              key={game.players[index].id}
              player={game.players[index]}
              isActive={index === actorIndex}
              isSelf={false}
              targetPigIds={targetPigIds}
              showBeautyCount={game.hasExpansion}
              theme={theme}
              headerBadge={badgeFor(index)}
              onSelectPig={playAtPig}
            />
          ))}

          <PlayerBoard
            player={me}
            isActive={isMyTurn}
            isSelf={true}
            targetPigIds={targetPigIds}
            showBeautyCount={game.hasExpansion}
            theme={theme}
            headerBadge={mySeatIndex === actorIndex ? autoPlayBadge : undefined}
            onSelectPig={playAtPig}
          />

          <OnlineTurnBanner
            game={game}
            actorName={game.players[actorIndex].name}
            actorIsBot={actorIsBot}
            isMyTurn={isMyTurn}
            didIWin={game.winnerId === me.id}
            winnerName={winnerName(game)}
            selectedCardName={
              selectedCard === null ? null : CARD_NAMES[selectedCard.type]
            }
            onCancel={() => setSelectedCardId(null)}
          />

          <section>
            <h2 className="mb-2 text-sm font-semibold">{UI_TEXTS.yourHand}</h2>
            <div data-testid="hand-row" className="flex gap-2">
              {me.hand.map((card) => {
                const usableNow = isCardUsableNow(game, card.id);
                return (
                  <HandCardView
                    key={card.id}
                    card={card}
                    theme={theme}
                    isPlayable={
                      usableNow && isCardPlayable(game, me.id, card.type)
                    }
                    canDiscard={usableNow}
                    isSelected={card.id === activeSelectionId}
                    isDisabled={!isMyTurn}
                    onSelect={selectCard}
                    onDiscard={discard}
                  />
                );
              })}
            </div>

            {isMyBlocked && (
              <button
                type="button"
                onClick={redraw}
                className="mt-2 cursor-pointer rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
              >
                {UI_TEXTS.redrawHand}
              </button>
            )}
          </section>

          {/* Chat sits right under the hand, newest line on top. */}
          <OnlineChat
            messages={messages}
            ownSeatId={seatId}
            onSend={sendChat}
            texts={ONLINE_TEXTS}
          />
        </div>

        <aside className="flex min-h-0 flex-col gap-3 lg:max-h-[calc(100vh-8rem)]">
          <div className="flex gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="rounded-lg border border-zinc-200 px-2 py-1 dark:border-zinc-800">
              {UI_TEXTS.drawPile}: {game.drawPile.length}
            </span>
            <span className="rounded-lg border border-zinc-200 px-2 py-1 dark:border-zinc-800">
              {UI_TEXTS.discardPile}: {game.discardPile.length}
            </span>
          </div>
          <GameLog entries={game.log} />
        </aside>
      </div>
    </div>
  );
}

/** Props of {@link OnlineTurnBanner}. */
type OnlineTurnBannerProps = {
  readonly game: GameState;
  readonly actorName: string;
  /** True when the player on turn has been taken over by the computer. */
  readonly actorIsBot: boolean;
  readonly isMyTurn: boolean;
  readonly didIWin: boolean;
  readonly winnerName: string | null;
  readonly selectedCardName: string | null;
  readonly onCancel: () => void;
};

/** Status line: whose turn it is, what to do next, or who won. */
function OnlineTurnBanner({
  game,
  actorName,
  actorIsBot,
  isMyTurn,
  didIWin,
  winnerName,
  selectedCardName,
  onCancel,
}: OnlineTurnBannerProps): ReactElement {
  const pendingCount = isMyTurn ? game.pendingCardIds.length : 0;
  let content: ReactElement;

  if (winnerName !== null) {
    content = (
      <span className="font-semibold">
        {"\u{1F389}"}{" "}
        {didIWin ? UI_TEXTS.youWon : UI_TEXTS.playerWon(winnerName)}
      </span>
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
    content = (
      <span className="font-medium">
        {"\u{1F426}"} {UI_TEXTS.luckyBirdPending(pendingCount)}
      </span>
    );
  } else if (isMyTurn) {
    content = (
      <span className="font-medium">{ONLINE_TEXTS.yourTurnOnline}</span>
    );
  } else {
    content = (
      <span className="text-zinc-500 dark:text-zinc-400">
        {actorIsBot
          ? ONLINE_TEXTS.computerPlaysFor(actorName)
          : ONLINE_TEXTS.waitingForPlayer(actorName)}
      </span>
    );
  }

  return (
    <div className="flex min-h-11 items-center rounded-2xl border border-zinc-200 bg-white/60 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      {content}
    </div>
  );
}

/** The winner's name, or null while nobody has won. */
function winnerName(game: GameState): string | null {
  const winner =
    game.winnerId === null
      ? null
      : game.players.find((player) => player.id === game.winnerId);
  return winner?.name ?? null;
}

/** A pill marking a seat the computer took over after the player left. */
function ComputerBadge(): ReactElement {
  return (
    <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
      {"\u{1F916}"} {ONLINE_TEXTS.computerBadge}
    </span>
  );
}

/** A small pill showing the seconds left before the computer takes over. */
function AutoPlayCountdown({
  remainingMs,
}: {
  remainingMs: number;
}): ReactElement {
  const seconds = Math.ceil(remainingMs / MS_PER_SECOND);
  const isLow = remainingMs <= LOW_TIME_MS;
  return (
    <span
      title={ONLINE_TEXTS.autoPlay}
      className={[
        "rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        isLow
          ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
      ].join(" ")}
    >
      {"\u{23F1}\u{FE0F}"} {seconds}s
    </span>
  );
}
