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
} from "@/components/action-effect-overlay";
import {
  isBlocked,
  isCardPlayable,
  isCardUsableNow,
  legalTargets,
  needsTarget,
} from "@/game/moves";
import type { GameState, Move, PigId } from "@/game/state";
import type { RoomState, SeatId } from "@/multiplayer/room";
import type { ChatMessage } from "@/multiplayer/transport";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/lib/settings/settings-store";
import { CARD_NAMES, ONLINE_TEXTS, UI_TEXTS } from "@/i18n/translations";
import { GameLog } from "./game-log";
import { GameResultOverlay, type GameOutcome } from "./game-result-overlay";
import { HandCardView } from "./hand-card-view";
import { OnlineChat } from "./online-chat";
import { PlayerBoard } from "./player-board";

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
  // The id of the last play we already animated. Starts at the stamp present
  // when the board mounts, so a play from before we joined is not replayed.
  const lastShownEffectId = useRef(room.lastEffect?.id ?? null);

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
      setEffect({ type: latest.type, id: latest.id });
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
            onSelectPig={playAtPig}
          />

          <OnlineTurnBanner
            game={game}
            actorName={game.players[actorIndex].name}
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
        {ONLINE_TEXTS.waitingForPlayer(actorName)}
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
