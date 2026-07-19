/**
 * The Binokel playing board for an online game - every seat is a human player.
 *
 * @module
 * @remarks
 * Rendered from the room the host publishes, with this player's own hand already
 * merged in. Unlike the local game (which is always player 0), the viewer can be
 * any seat, so everything is drawn from `mySeatIndex`. Only the seat that may act
 * in the current phase gets buttons; the chosen move is sent on and the host's
 * referee has the final say. The presentational pieces are shared with the local
 * game via {@link ./binokel-parts}.
 */
"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import type { Suit } from "@/games/binokel/engine/cards";
import { findMelds } from "@/games/binokel/engine/melds";
import { baseHandSize, nextBidValue } from "@/games/binokel/engine/moves";
import { legalPlays } from "@/games/binokel/engine/tricks";
import { actingIndex } from "@/games/binokel/engine/turn";
import type { GameState, GameType } from "@/games/binokel/engine/state";
import type { BinokelMove } from "@/games/binokel/multiplayer/adapter";
import type { RoomState, SeatId } from "@/online/adapter";
import type { ChatMessage } from "@/online/transport";
import { OnlineChat } from "@/online/online-chat";
import {
  getBinokelSettingsSnapshot,
  getServerBinokelSettingsSnapshot,
  subscribeBinokelSettings,
} from "@/games/binokel/settings/binokel-settings-store";
import {
  BINOKEL_ONLINE_TEXTS,
  BINOKEL_TEXTS,
} from "@/games/binokel/i18n/binokel-texts";
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

/** How often the auto-play countdown refreshes, in milliseconds. */
const COUNTDOWN_TICK_MS = 250;
/** Milliseconds in a second, for the countdown label. */
const MS_PER_SECOND = 1000;
/** At or below this, the countdown turns red to signal the takeover is near. */
const LOW_TIME_MS = 5000;

/** Props of {@link OnlineBoard}. */
export type OnlineBoardProps = {
  /** The room to render, this player's own hand already merged in. */
  readonly room: RoomState<GameState>;
  /** This player's seat id. */
  readonly seatId: SeatId;
  /** Sends a move - applied by the host if it is this player's turn. */
  readonly sendMove: (move: BinokelMove) => void;
  /** Chat lines so far, oldest first. */
  readonly messages: readonly ChatMessage[];
  /** Sends a chat line to everyone in the room. */
  readonly sendChat: (text: string) => void;
};

/**
 * Renders an online Binokel game and lets the seat on turn act.
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
  const suitOrder = useSyncExternalStore(
    subscribeBinokelSettings,
    getBinokelSettingsSnapshot,
    getServerBinokelSettingsSnapshot,
  ).suitOrder;
  const remainingMs = useAutoPlayCountdown(room);

  const mySeatIndex = room.seats.findIndex((seat) => seat.id === seatId);
  const me = game.players[mySeatIndex];
  // A mid-join snapshot may not carry the viewer's seat yet; guard the board.
  if (me === undefined || mySeatIndex < 0) {
    return <p className="p-4 text-sm">{BINOKEL_ONLINE_TEXTS.connecting}</p>;
  }

  const actor = actingIndex(game);
  const canAct = actor === mySeatIndex;
  const botSeatIds = room.botSeatIds ?? [];
  const actorIsBot =
    actor !== null && botSeatIds.includes(room.seats[actor]?.id);
  const actorName = actor === null ? "" : game.players[actor].name;

  const act = {
    bid: () => sendMove({ kind: "bid" }),
    pass: () => sendMove({ kind: "pass" }),
    discard: (cardIds: readonly string[]) =>
      sendMove({ kind: "discard", cardIds }),
    trump: (suit: Suit) => sendMove({ kind: "trump", suit }),
    declare: (gameType: GameType) =>
      sendMove({ kind: "declareGame", gameType }),
    concede: () => sendMove({ kind: "concede" }),
    play: (cardId: string) => sendMove({ kind: "playCard", cardId }),
    collect: () => sendMove({ kind: "collectTrick" }),
    nextRound: () => sendMove({ kind: "nextRound" }),
  };

  const others = room.seats
    .map((_, index) => index)
    .filter((index) => index !== mySeatIndex);

  return (
    <div className="flex flex-col gap-3">
      <Scoreboard state={game} />

      <TurnBanner
        canAct={canAct}
        actorName={actorName}
        actorIsBot={actorIsBot}
        remainingMs={remainingMs}
      />

      <div className="flex flex-wrap gap-3">
        {others.map((index) => (
          <OpponentSeat
            key={game.players[index].id}
            state={game}
            index={index}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <CenterPanel game={game} canAct={canAct} act={act} me={me} />
      </div>

      <MyHand
        game={game}
        me={me}
        canAct={canAct}
        act={act}
        suitOrder={suitOrder}
      />

      <OnlineChat
        messages={messages}
        ownSeatId={seatId}
        onSend={sendChat}
        texts={BINOKEL_ONLINE_TEXTS}
      />
    </div>
  );
}

/** The player actions the board dispatches, each an online move. */
type Act = {
  bid: () => void;
  pass: () => void;
  discard: (cardIds: readonly string[]) => void;
  trump: (suit: Suit) => void;
  declare: (gameType: GameType) => void;
  concede: () => void;
  play: (cardId: string) => void;
  collect: () => void;
  nextRound: () => void;
};

/** Props shared by the phase panels. */
type PanelProps = {
  readonly game: GameState;
  readonly canAct: boolean;
  readonly act: Act;
  readonly me: GameState["players"][number];
};

/** The phase-specific middle of the board. */
function CenterPanel({ game, canAct, act, me }: PanelProps): ReactElement {
  let content: ReactElement;
  switch (game.phase) {
    case "bidding":
      content = <BiddingPanel game={game} canAct={canAct} act={act} me={me} />;
      break;
    case "exchange":
      content = <ExchangePanel game={game} canAct={canAct} act={act} me={me} />;
      break;
    case "melding":
      content = <MeldingPanel game={game} canAct={canAct} act={act} me={me} />;
      break;
    case "trick":
      content = <TrickPanel game={game} canAct={canAct} act={act} me={me} />;
      break;
    case "roundEnd":
      content = <RoundEndPanel game={game} canAct={canAct} act={act} me={me} />;
      break;
    case "matchEnd":
      content = (
        <h2 className="text-lg font-bold">
          {"\u{1F3C6}"} {matchWinnerBanner(game)}
        </h2>
      );
      break;
    default:
      content = <></>;
  }
  return content;
}

/** Bidding: reizen or pass on your turn; the meld range for your hand. */
function BiddingPanel({ game, canAct, act, me }: PanelProps): ReactElement {
  const meld = meldRange(me.hand, game.withSevens);
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">{BINOKEL_TEXTS.bidding}</h2>
      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
        {BINOKEL_TEXTS.meldEstimate(meld.min, meld.max)}
      </p>
      {canAct ? (
        <div className="flex items-center gap-2">
          <span className="text-sm">{BINOKEL_TEXTS.yourBidTurn}</span>
          <button
            type="button"
            onClick={act.bid}
            className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {BINOKEL_TEXTS.reizen(nextBidValue(game))}
          </button>
          <button
            type="button"
            onClick={act.pass}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {BINOKEL_TEXTS.pass}
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {BINOKEL_TEXTS.waiting(game.players[game.currentPlayerIndex].name)}
        </p>
      )}
    </div>
  );
}

/** Exchange: the declarer discards then names trump; others wait. */
function ExchangePanel({ game, canAct, act, me }: PanelProps): ReactElement {
  const iAmDeclarer = game.declarerIndex !== null && canAct;
  if (!iAmDeclarer) {
    const declarer = game.declarerIndex;
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {BINOKEL_TEXTS.declarerWorking(
          declarer === null ? "" : game.players[declarer].name,
        )}
      </p>
    );
  }
  // The discard happens in the hand area; here we only prompt or offer trump.
  const base = baseHandSize(game);
  if (me.hand.length > base) {
    return (
      <p className="text-sm">
        {BINOKEL_TEXTS.discardPrompt(me.hand.length - base)}
      </p>
    );
  }
  if (game.trump === null) {
    return <TrumpChoice onPick={act.trump} />;
  }
  return <></>;
}

/** Melding: everyone's melds; the declarer chooses, others wait. */
function MeldingPanel({ game, canAct, act }: PanelProps): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">{BINOKEL_TEXTS.meldingTitle}</h2>
      <MeldsGrid state={game} />
      {canAct ? (
        <DeclarerChoice onConcede={act.concede} onDeclare={act.declare} />
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {game.declarerIndex === null
            ? ""
            : BINOKEL_TEXTS.waiting(game.players[game.declarerIndex].name)}
        </p>
      )}
    </div>
  );
}

/** Trick: the cards on the table; the winner gathers a full trick. */
function TrickPanel({ game, canAct, act }: PanelProps): ReactElement {
  const full = game.currentTrick.length === game.players.length;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{BINOKEL_TEXTS.trickTitle}</h2>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {full
            ? BINOKEL_TEXTS.trickComplete
            : canAct
              ? BINOKEL_TEXTS.yourTurn
              : BINOKEL_TEXTS.waiting(
                  game.players[game.currentPlayerIndex].name,
                )}
        </span>
      </div>
      <TrickArea state={game} />
      {full && canAct && (
        <button
          type="button"
          onClick={act.collect}
          className="cursor-pointer self-start rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {BINOKEL_TEXTS.continueTrick}
        </button>
      )}
    </div>
  );
}

/** Round end: the result table; the forehand deals the next round. */
function RoundEndPanel({ game, canAct, act }: PanelProps): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">
        {BINOKEL_TEXTS.roundResultTitle}
      </h2>
      <RoundEndTable state={game} />
      {canAct ? (
        <button
          type="button"
          onClick={act.nextRound}
          className="cursor-pointer self-start rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {BINOKEL_TEXTS.nextRound}
        </button>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {BINOKEL_TEXTS.waiting(
            game.players[(game.dealerIndex + 1) % game.players.length].name,
          )}
        </p>
      )}
    </div>
  );
}

/** Props of {@link MyHand}. */
type MyHandProps = PanelProps & {
  readonly suitOrder: readonly Suit[];
};

/** The viewer's own hand - the discard swap, or clickable trick cards. */
function MyHand({
  game,
  me,
  canAct,
  act,
  suitOrder,
}: MyHandProps): ReactElement {
  const base = baseHandSize(game);
  const isDiscard =
    game.phase === "exchange" &&
    canAct &&
    game.trump === null &&
    me.hand.length > base;

  if (isDiscard) {
    return (
      <DiscardHand
        hand={me.hand}
        takenDabb={game.takenDabb}
        withSevens={game.withSevens}
        suitOrder={suitOrder}
        onConfirm={act.discard}
      />
    );
  }

  const hand = sortHand(me.hand, suitOrder);
  const isPlay =
    game.phase === "trick" &&
    canAct &&
    game.currentTrick.length < game.players.length;
  const legalIds = isPlay
    ? new Set(
        legalPlays(me.hand, game.currentTrick, game.trump).map(
          (card) => card.id,
        ),
      )
    : null;

  // While the melds are shown, mark the hand cards that make up a meld.
  const meldCardIds =
    game.phase === "melding"
      ? new Set(
          findMelds(me.hand, game.trump, game.withSevens)
            .melds.flatMap((meld) => meld.cards)
            .map((card) => card.id),
        )
      : null;

  return (
    <div data-testid="my-hand" className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">
        {BINOKEL_TEXTS.yourHand} ({hand.length})
      </h2>
      <FannedHand
        cards={hand}
        renderCard={(card) => {
          const playable = legalIds?.has(card.id) ?? false;
          return (
            <CardView
              card={card}
              dim={isPlay && !playable}
              highlight={meldCardIds?.has(card.id) ?? false}
              onClick={playable ? () => act.play(card.id) : undefined}
            />
          );
        }}
      />
    </div>
  );
}

/** Props of {@link TurnBanner}. */
type TurnBannerProps = {
  readonly canAct: boolean;
  readonly actorName: string;
  readonly actorIsBot: boolean;
  readonly remainingMs: number | null;
};

/** A status line: whose turn it is, with the auto-play countdown if on. */
function TurnBanner({
  canAct,
  actorName,
  actorIsBot,
  remainingMs,
}: TurnBannerProps): ReactElement {
  let content: ReactElement;
  if (canAct) {
    content = (
      <span className="font-medium">{BINOKEL_ONLINE_TEXTS.yourTurnOnline}</span>
    );
  } else {
    content = (
      <span className="text-zinc-500 dark:text-zinc-400">
        {actorIsBot
          ? BINOKEL_ONLINE_TEXTS.computerPlaysFor(actorName)
          : BINOKEL_ONLINE_TEXTS.waitingForPlayer(actorName)}
      </span>
    );
  }
  return (
    <div className="flex min-h-11 items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white/60 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      {content}
      {remainingMs !== null && <AutoPlayCountdown remainingMs={remainingMs} />}
    </div>
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
      title={BINOKEL_ONLINE_TEXTS.autoPlay}
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

/**
 * Counts the auto-play timeout down for whoever is on turn.
 *
 * @param room - the current room
 * @returns the milliseconds left, or null when no auto-play runs now
 * @remarks
 * Restarts on every turn (a new version), matching when the host restarts its
 * own timer, so both sides expect the takeover at the same moment.
 */
function useAutoPlayCountdown(room: RoomState<GameState>): number | null {
  const autoPlayMs = room.autoPlayMs ?? null;
  const finished = room.phase === "finished";
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (autoPlayMs === null || autoPlayMs <= 0 || finished) {
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
  }, [room.version, autoPlayMs, finished]);

  return remainingMs;
}
