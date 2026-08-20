/**
 * The table: the pot, everybody's rows, and your own cards.
 *
 * @module
 * @remarks
 * Everything is done by **selecting cards and then pressing what to do with
 * them**. One idea instead of four: a lay is the cards you picked, the swap is
 * the two you picked. The alternative - dragging a card onto the pot - is a lot
 * of aiming on a phone for a game whose only decision is *which* card.
 *
 * Which selection is allowed is not worked out here. The screen builds the move
 * and asks {@link applyMove} whether it would be accepted, so a button is lit
 * exactly when the referee would say yes. It costs one throwaway game state per
 * render, and it buys the one thing worth having: the screen cannot disagree
 * with the rules, because it is asking the rules.
 */
"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import {
  ACTION_INK,
  ACTION_NAMES,
  ACTION_SHORT,
  ACTION_TEXTS,
  type Card,
} from "@/games/jammerlappen/engine/cards";
import {
  applyMove,
  jumpInIds,
  playableUp,
  topRun,
  topValue,
} from "@/games/jammerlappen/engine/moves";
import {
  SELF_NAME,
  cardsLeft,
  filled,
  freedSlots,
  type JammerlappenGame,
  type JammerlappenMove,
  type Player,
} from "@/games/jammerlappen/engine/state";
import { JAMMER_TEXTS as T } from "@/games/jammerlappen/i18n/texts";
import { ComputerBadge } from "@/online/computer-badge";
import { seatsFromMine } from "@/online/seat-order";

/** How many of the pot's cards are shown, newest last. */
const POT_SHOWN = 8;

/** Props of {@link JammerlappenTable}. */
export type JammerlappenTableProps = {
  readonly game: JammerlappenGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: JammerlappenMove) => void;
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
export function JammerlappenTable({
  game,
  mySeat,
  onMove,
  clock,
  botSeats = [],
}: JammerlappenTableProps): ReactElement {
  const [picked, setPicked] = useState<readonly string[]>([]);
  const me = mySeat === null ? null : game.players[mySeat];

  /** Sends a move and forgets whatever was selected for it. */
  const send = (move: JammerlappenMove) => {
    setPicked([]);
    onMove(move);
  };

  const toggle = (id: string) =>
    setPicked((was) =>
      was.includes(id) ? was.filter((entry) => entry !== id) : [...was, id],
    );

  const order = seatsFromMine(game.players.length, mySeat);

  return (
    <section className="flex flex-col gap-4">
      <Panel game={game} mySeat={mySeat} clock={clock} />
      {mySeat !== null && <JumpIn game={game} seat={mySeat} onMove={send} />}
      <Pot game={game} />

      <div className="grid gap-3 lg:grid-cols-2">
        {order.map((seat) => (
          <SeatCard
            key={game.players[seat].name + seat}
            game={game}
            seat={seat}
            isMe={seat === mySeat}
            isBotSeat={botSeats.includes(seat)}
            picked={picked}
            onPick={toggle}
            onPlayDown={(slot) => send({ kind: "playDown", slot })}
          />
        ))}
      </div>

      {me !== null && mySeat !== null && (
        <MyCards
          game={game}
          me={me}
          mySeat={mySeat}
          picked={picked}
          onPick={toggle}
          onMove={send}
        />
      )}
    </section>
  );
}

/** The line that says what is being waited for, and what has to be beaten. */
function Panel({
  game,
  mySeat,
  clock,
}: {
  readonly game: JammerlappenGame;
  readonly mySeat: number | null;
  readonly clock?: ReactNode;
}): ReactElement {
  const waiting = seatWaitedFor(game);
  const top = topValue(game);
  let demand: string;
  if (game.phase === "swap") {
    demand = T.phaseSwapHint;
  } else if (top === null) {
    demand = T.anythingGoes;
  } else if (game.descending) {
    demand = T.needsAtMost(top);
  } else {
    demand = T.needsAtLeast(top);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">
          {game.phase === "swap" ? T.phaseSwap : T.phasePlay}
        </h2>
        {clock}
        {game.descending && (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            {T.descending}
          </span>
        )}
        {game.draw.length === 0 && game.phase !== "swap" && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
            {T.drawEmpty}
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">{demand}</p>

      <p className="text-sm" data-testid="jammer-status">
        {game.phase === "gameOver"
          ? T.gameOverTitle
          : mySeat !== null && waiting === mySeat
            ? T.yourTurn
            : T.waitingFor(game.players[waiting ?? game.active].name)}
      </p>

      <ul className="flex flex-wrap gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        <li>{T.drawPile(game.draw.length)}</li>
        <li>{T.potSize(game.pot.length)}</li>
        <li>{game.direction === 1 ? T.clockwise : T.counterClockwise}</li>
        {game.burned > 0 && <li>{T.burned(game.burned)}</li>}
      </ul>
    </div>
  );
}

/** Who the table is waiting for, mirrored from the engine's own answer. */
function seatWaitedFor(game: JammerlappenGame): number | null {
  let seat: number | null = null;
  if (game.phase === "swap") {
    const owing = game.players.findIndex((player) => !player.ready);
    seat = owing >= 0 ? owing : game.active;
  } else if (game.phase !== "gameOver") {
    seat = game.active;
  }
  return seat;
}

/**
 * The one button that appears when it is not your turn.
 *
 * @remarks
 * Deliberately loud and deliberately fleeting. It is a race - the next player
 * may be about to lay a card and take the chance with them - so it says what it
 * is for in one word and asks for one press.
 */
function JumpIn({
  game,
  seat,
  onMove,
}: {
  readonly game: JammerlappenGame;
  readonly seat: number;
  readonly onMove: (move: JammerlappenMove) => void;
}): ReactElement | null {
  const ids = jumpInIds(game, seat);
  const run = topRun(game);
  return ids === null || run === null ? null : (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-amber-400 bg-amber-50 p-3 dark:border-amber-500 dark:bg-amber-950/40">
      <button
        type="button"
        data-testid="jammer-jump"
        onClick={() => onMove({ kind: "play", cardIds: ids })}
        className="cursor-pointer rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600"
      >
        {T.jumpIn}
      </button>
      <span className="text-xs text-amber-900 dark:text-amber-200">
        {T.jumpInHint(run.value)}
      </span>
    </div>
  );
}

/** The pot, newest card on the right. */
function Pot({ game }: { readonly game: JammerlappenGame }): ReactElement {
  const shown = game.pot.slice(-POT_SHOWN);
  const hidden = game.pot.length - shown.length;
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      {game.pot.length === 0 ? (
        <p className="text-sm text-zinc-400">{T.potEmpty}</p>
      ) : (
        <ul className="flex flex-wrap items-center gap-1.5">
          {hidden > 0 && <li className="text-xs text-zinc-400">+{hidden} …</li>}
          {shown.map((card, at) => (
            <li key={card.id + at}>
              <CardFace card={card} small dim={at < shown.length - 1} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One player's three rows: how many in hand, what is open, what is covered. */
function SeatCard({
  game,
  seat,
  isMe,
  isBotSeat,
  picked,
  onPick,
  onPlayDown,
}: {
  readonly game: JammerlappenGame;
  readonly seat: number;
  readonly isMe: boolean;
  readonly isBotSeat: boolean;
  readonly picked: readonly string[];
  readonly onPick: (id: string) => void;
  readonly onPlayDown: (slot: number) => void;
}): ReactElement {
  const player = game.players[seat];
  const isOnTurn = seat === game.active && game.phase === "play";
  // Own open cards are pickable while swapping, and once the hand is empty.
  const canPickUp =
    isMe &&
    (game.phase === "swap"
      ? !player.ready
      : game.phase === "play" && player.hand.length === 0);
  const blind = isMe && game.phase === "play" ? freedSlots(player) : [];
  const canTurnOver = blind.length > 0 && game.active === seat;

  return (
    <article
      data-testid={`jammer-seat-${seat}`}
      className={`flex flex-col gap-2 rounded-2xl border p-3 text-sm ${
        isOnTurn
          ? "border-indigo-400 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <header className="flex flex-wrap items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate font-semibold">
          {player.name}
          {/* Offline the seat is already called "Du" - saying so twice reads
              like a bug. Online it is your own name and the marker earns its
              place. */}
          {isMe && player.name !== SELF_NAME && " (Du)"}
        </span>
        {isBotSeat && <ComputerBadge />}
        {player.place === null ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.cardsLeft(cardsLeft(player))}
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
            {T.place(player.place + 1)} · {T.out}
          </span>
        )}
      </header>

      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {T.hand}: {T.handCount(player.hand.length)}
        {game.phase === "swap" && player.ready && ` · ${T.swapDone}`}
      </p>

      <Row label={T.openCards}>
        {player.up.map((card, slot) => (
          <Slot key={`up-${slot}`}>
            {card !== null && (
              <CardFace
                card={card}
                small
                picked={picked.includes(card.id)}
                open={canPickUp}
                onClick={() => onPick(card.id)}
              />
            )}
          </Slot>
        ))}
      </Row>

      <Row label={T.hiddenCards}>
        {player.down.map((card, slot) => (
          <Slot key={`down-${slot}`}>
            {card !== null && (
              <CardBack
                open={canTurnOver && blind.includes(slot)}
                onClick={() => onPlayDown(slot)}
              />
            )}
          </Slot>
        ))}
      </Row>
    </article>
  );
}

/** One labelled row of three slots. */
function Row({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[10px] text-zinc-400 uppercase">
        {label}
      </span>
      <ul className="flex gap-1.5">{children}</ul>
    </div>
  );
}

/** One slot of a table row - a card, or the gap where one used to be. */
function Slot({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <li className="flex h-11 w-9 items-center justify-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
      {children}
    </li>
  );
}

/** Your own hand, and the buttons for whatever you may do with it. */
function MyCards({
  game,
  me,
  mySeat,
  picked,
  onPick,
  onMove,
}: {
  readonly game: JammerlappenGame;
  readonly me: Player;
  readonly mySeat: number;
  readonly picked: readonly string[];
  readonly onPick: (id: string) => void;
  readonly onMove: (move: JammerlappenMove) => void;
}): ReactElement {
  const swapping = game.phase === "swap" && !me.ready;
  const allowed = (move: JammerlappenMove) =>
    applyMove(game, mySeat, move) !== null;

  const handPicked = picked.filter((id) =>
    me.hand.some((card) => card.id === id),
  );
  const upPicked = picked.filter((id) =>
    filled(me.up).some((card) => card.id === id),
  );
  const swapMove: JammerlappenMove = {
    kind: "swap",
    handId: handPicked[0] ?? "",
    upId: upPicked[0] ?? "",
  };
  const layMove: JammerlappenMove = { kind: "play", cardIds: picked };
  const potMove: JammerlappenMove = { kind: "takePot" };
  const forced =
    game.phase === "play" &&
    game.active === mySeat &&
    me.hand.length === 0 &&
    filled(me.up).length > 0 &&
    playableUp(game, me).length === 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{T.yourHand}</h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.handCount(me.hand.length)}
        </span>
        {forced && (
          <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
            {T.forcedHint}
          </span>
        )}
      </div>

      {me.hand.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {T.handEmpty}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {me.hand.map((card) => (
            <li key={card.id}>
              <CardFace
                card={card}
                picked={picked.includes(card.id)}
                open={swapping || game.phase === "play"}
                onClick={() => onPick(card.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {swapping ? (
          <>
            <Button
              testId="jammer-swap"
              disabled={!allowed(swapMove)}
              onClick={() => onMove(swapMove)}
            >
              {T.swapDo}
            </Button>
            <Button
              testId="jammer-keep"
              onClick={() => onMove({ kind: "ready" })}
            >
              {T.swapKeep}
            </Button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {T.swapPickHand}
            </span>
          </>
        ) : (
          <>
            <Button
              testId="jammer-play"
              disabled={picked.length === 0 || !allowed(layMove)}
              onClick={() => onMove(layMove)}
            >
              {T.playCount(picked.length)}
            </Button>
            <Button
              testId="jammer-take"
              disabled={!allowed(potMove)}
              onClick={() => onMove(potMove)}
            >
              {T.takePot}
            </Button>
            {me.hand.length === 0 && freedSlots(me).length > 0 && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {T.blindHint}
              </span>
            )}
          </>
        )}
        {game.phase === "swap" && me.ready && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.swapWaiting}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * One card, face up.
 *
 * @remarks
 * A button only while it can be pressed - a card nobody may touch right now is
 * a `span`, so a tap on a phone does not light something up that leads nowhere.
 */
function CardFace({
  card,
  small = false,
  picked = false,
  open = false,
  dim = false,
  onClick,
}: {
  readonly card: Card;
  readonly small?: boolean;
  readonly picked?: boolean;
  readonly open?: boolean;
  readonly dim?: boolean;
  readonly onClick?: () => void;
}): ReactElement {
  const size = small
    ? "h-10 w-8 text-[10px]"
    : "h-16 w-12 text-[11px] sm:h-20 sm:w-14";
  const look = `flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-0.5 text-center leading-none font-semibold ${size} ${
    picked
      ? "border-indigo-500 bg-indigo-100 dark:bg-indigo-900/60"
      : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800"
  } ${dim ? "opacity-50" : ""}`;
  const style =
    card.kind === "action" ? { color: ACTION_INK[card.action] } : undefined;
  const face =
    card.kind === "number" ? (
      <span className={small ? "text-base" : "text-2xl"}>{card.value}</span>
    ) : (
      <span className="break-words hyphens-auto">{label(card)}</span>
    );

  return open ? (
    <button
      type="button"
      data-testid={`jammer-card-${card.id}`}
      onClick={onClick}
      title={tooltip(card)}
      className={`${look} cursor-pointer hover:brightness-95`}
      style={style}
    >
      {face}
    </button>
  ) : (
    <span
      data-testid={`jammer-card-${card.id}`}
      title={tooltip(card)}
      className={look}
      style={style}
    >
      {face}
    </span>
  );
}

/** A covered card - pressable only when it may be turned over. */
function CardBack({
  open,
  onClick,
}: {
  readonly open: boolean;
  readonly onClick: () => void;
}): ReactElement {
  const look =
    "flex h-10 w-8 items-center justify-center rounded-lg border-2 text-base";
  return open ? (
    <button
      type="button"
      onClick={onClick}
      title={T.blindHint}
      className={`${look} cursor-pointer border-indigo-400 bg-indigo-100 hover:brightness-95 dark:bg-indigo-900/60`}
    >
      🂠
    </button>
  ) : (
    <span
      className={`${look} border-zinc-300 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800`}
    >
      🂠
    </span>
  );
}

/** The short text printed on a card. */
function label(card: Card): string {
  let text: string;
  if (card.kind === "hidden") {
    text = "🂠";
  } else if (card.kind === "action") {
    text = ACTION_SHORT[card.action];
  } else {
    text = String(card.value);
  }
  return text;
}

/** What a card does, for the tooltip. */
function tooltip(card: Card): string {
  return card.kind === "action"
    ? `${ACTION_NAMES[card.action]} - ${ACTION_TEXTS[card.action]}`
    : label(card);
}

/** A plain button, so the table's controls all look the same. */
function Button({
  children,
  onClick,
  disabled = false,
  testId,
}: {
  readonly children: ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly testId: string;
}): ReactElement {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
