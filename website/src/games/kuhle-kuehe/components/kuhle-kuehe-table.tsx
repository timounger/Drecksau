/**
 * The table: the piles, everybody's herd, and your own hand.
 *
 * @module
 * @remarks
 * A turn is two halves and the panel at the top always says which one you are
 * in, because the two allow completely different things and the cards in your
 * hand look identical either way.
 *
 * Everything is done by **selecting cards and then pressing what to do with
 * them**. That is one idea instead of four: a cow is the cards you picked, a
 * Kuhhandel is the two you picked, the hand limit is the ones you picked. The
 * alternative - drag a head here, a rear there - is a lot of aiming on a phone
 * for a game whose whole decision is *which* cards, not *where*.
 */
"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import {
  ACTION_NAMES,
  ACTION_TEXTS,
  BREED_NAMES,
  PART_NAMES,
  isAttack,
  isGuard,
  type Card,
} from "@/games/kuhle-kuehe/engine/cards";
import {
  HAND_LIMIT,
  TRADE_SIZE,
  breedsOf,
  cowCards,
  cowPoints,
  isPure,
  scoreOf,
  type Cow,
  type KuhleKueheGame,
  type KuhleKueheMove,
} from "@/games/kuhle-kuehe/engine/state";
import { KuhCard } from "./kuh-card";
import { KUHLE_TEXTS as T } from "@/games/kuhle-kuehe/i18n/texts";
import { ComputerBadge } from "@/online/computer-badge";
import { seatsFromMine } from "@/online/seat-order";

/** Props of {@link KuhleKueheTable}. */
export type KuhleKueheTableProps = {
  readonly game: KuhleKueheGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: KuhleKueheMove) => void;
  /** True while a computer player is being waited for. */
  readonly busy?: boolean;
  /** The turn clock, shown beside whose turn it is. */
  readonly clock?: ReactNode;
  /** Seats the computer plays because their player left. */
  readonly botSeats?: readonly number[];
};

/** An action card waiting for the player to say what it hits. */
type Aiming = { readonly card: Card; readonly cowId?: string };

/**
 * Renders the whole table.
 *
 * @param props - the game and who is reading it
 * @returns the table element
 */
export function KuhleKueheTable({
  game,
  mySeat,
  onMove,
  busy = false,
  clock,
  botSeats = [],
}: KuhleKueheTableProps): ReactElement {
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [aiming, setAiming] = useState<Aiming | null>(null);

  const mine = mySeat !== null && !busy && game.phase !== "gameOver";
  const me = mySeat === null ? null : game.players[mySeat];
  const myDraw = mine && game.phase === "draw" && game.active === mySeat;
  const myPlay = mine && game.phase === "play" && game.active === mySeat;
  const myTrade = mine && game.phase === "trade" && me?.trade === null;
  const myDefend =
    mine && game.phase === "defend" && game.pending?.target === mySeat;

  /** Sends a move and forgets whatever was selected for it. */
  const send = (move: KuhleKueheMove) => {
    setPicked([]);
    setAiming(null);
    onMove(move);
  };

  const toggle = (id: string) =>
    setPicked((was) =>
      was.includes(id) ? was.filter((entry) => entry !== id) : [...was, id],
    );

  const chosen = (me?.hand ?? []).filter((card) => picked.includes(card.id));
  const order = seatsFromMine(game.players.length, mySeat);

  return (
    <section className="flex flex-col gap-4">
      <Panel game={game} mySeat={mySeat} clock={clock} />

      {myDraw && <DrawChoices game={game} onMove={send} />}
      {myDefend && <DefendChoices game={game} me={me} onMove={send} />}

      <Piles
        game={game}
        pickable={myDraw}
        onTake={(id) => send({ kind: "takeDiscard", cardId: id })}
      />

      <div className="grid gap-3 xl:grid-cols-2">
        {order.map((seat) => (
          <HerdCard
            key={game.players[seat].name + seat}
            game={game}
            seat={seat}
            isMe={seat === mySeat}
            isBotSeat={botSeats.includes(seat)}
            aiming={aiming}
            onAim={(cowId) =>
              aiming === null
                ? undefined
                : fire(aiming, seat, cowId, send, setAiming)
            }
          />
        ))}
      </div>

      {me !== null && (
        <Hand
          me={me}
          game={game}
          picked={picked}
          chosen={chosen}
          onToggle={toggle}
          myPlay={myPlay}
          myTrade={myTrade === true}
          aiming={aiming}
          onAction={(card) => startAction(card, me, send, setAiming)}
          onMove={send}
        />
      )}
    </section>
  );
}

/**
 * Starts an action card off - immediately if it needs nothing, else aiming.
 *
 * @remarks
 * Which cards need a target is a property of the card, not of the screen, so
 * this asks the engine's own predicates rather than keeping a second list that
 * could drift out of step with the rules.
 */
function startAction(
  card: Card,
  me: KuhleKueheGame["players"][number],
  send: (move: KuhleKueheMove) => void,
  setAiming: (aim: Aiming | null) => void,
): void {
  if (card.kind !== "action") {
    return;
  }
  const needsTarget =
    isAttack(card.action) || isGuard(card.action) || card.action === "feed";
  if (card.action === "lasso") {
    setAiming({ card });
  } else if (needsTarget) {
    setAiming({ card });
  } else {
    send({ kind: "action", cardId: card.id });
  }
}

/** Carries an aimed action to wherever it was pointed. */
function fire(
  aiming: Aiming,
  seat: number,
  cowId: string | undefined,
  send: (move: KuhleKueheMove) => void,
  setAiming: (aim: Aiming | null) => void,
): void {
  const card = aiming.card;
  if (card.kind !== "action") {
    return;
  }
  if (card.action === "feed") {
    // Feed needs a second pick - which middle - so it stays aimed for now.
    setAiming({ card, cowId });
  } else {
    send({ kind: "action", cardId: card.id, target: seat, cowId });
  }
}

/** The line that says what is being waited for, and the ribbons. */
function Panel({
  game,
  mySeat,
  clock,
}: {
  readonly game: KuhleKueheGame;
  readonly mySeat: number | null;
  readonly clock?: ReactNode;
}): ReactElement {
  const heading =
    game.phase === "trade"
      ? T.phaseTrade
      : game.phase === "defend"
        ? T.phaseDefend
        : game.phase === "draw"
          ? T.phaseDraw
          : T.phasePlay;
  const hint =
    game.phase === "trade"
      ? T.phaseTradeHint
      : game.phase === "draw"
        ? T.phaseDrawHint
        : T.phasePlayHint;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{heading}</h2>
        {clock}
        {game.emptiedBy !== null && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300">
            {T.lastRound}
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      <p className="text-sm" data-testid="kuhle-status">
        {game.phase === "gameOver"
          ? T.gameOverTitle
          : mySeat !== null && seatWaitedFor(game) === mySeat
            ? T.yourTurn
            : T.waitingFor(
                game.players[seatWaitedFor(game) ?? game.active].name,
              )}
      </p>
      <Ribbons game={game} />
    </div>
  );
}

/** Who the table is waiting for, mirrored from the engine's own answer. */
function seatWaitedFor(game: KuhleKueheGame): number | null {
  let seat: number | null = null;
  if (game.phase === "defend" && game.pending !== null) {
    seat = game.pending.target;
  } else if (game.phase === "trade") {
    const owing = game.players.findIndex((player) => player.trade === null);
    seat = owing >= 0 ? owing : game.active;
  } else if (game.phase !== "gameOver") {
    seat = game.active;
  }
  return seat;
}

/** The three ribbons and who holds them. */
function Ribbons({ game }: { readonly game: KuhleKueheGame }): ReactElement {
  const rows: readonly [string, number | null][] = [
    [T.awardFirst, game.awards.firstCow],
    [T.awardBiggest, game.awards.biggestHerd],
    [T.awardLongest, game.awards.longestCow],
  ];
  return (
    <ul className="flex flex-wrap gap-2 text-[11px]">
      {rows.map(([label, seat]) => (
        <li
          key={label}
          className={`rounded-full px-2 py-0.5 ${
            seat === null
              ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
              : "bg-amber-100 font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
          }`}
        >
          {label}: {seat === null ? "-" : game.players[seat].name}
        </li>
      ))}
    </ul>
  );
}

/** Phase one: the three ways to get cards. */
function DrawChoices({
  game,
  onMove,
}: {
  readonly game: KuhleKueheGame;
  readonly onMove: (move: KuhleKueheMove) => void;
}): ReactElement {
  const canTrade = game.emptiedBy === null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-300 bg-indigo-50/60 p-3 dark:border-indigo-800 dark:bg-indigo-950/30">
      <Button testId="kuhle-draw" onClick={() => onMove({ kind: "drawTwo" })}>
        {T.drawTwo}
      </Button>
      <Button
        testId="kuhle-trade"
        disabled={!canTrade}
        onClick={() => onMove({ kind: "trade" })}
      >
        {T.callTrade}
      </Button>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {canTrade ? T.fromDiscard : T.tradeBlocked}
      </span>
    </div>
  );
}

/** An attack is in the air and it is aimed at you. */
function DefendChoices({
  game,
  me,
  onMove,
}: {
  readonly game: KuhleKueheGame;
  readonly me: KuhleKueheGame["players"][number] | null;
  readonly onMove: (move: KuhleKueheMove) => void;
}): ReactElement {
  const dog = (me?.hand ?? []).find(
    (card) => card.kind === "action" && card.action === "dog",
  );
  const attack = game.pending;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-red-300 bg-red-50/70 p-3 dark:border-red-800 dark:bg-red-950/30">
      <p className="text-sm font-medium">
        {attack === null || attack.card.kind !== "action"
          ? T.phaseDefend
          : T.attackedBy(
              game.players[attack.by].name,
              ACTION_NAMES[attack.card.action],
            )}
      </p>
      {dog !== undefined && (
        <Button
          testId="kuhle-defend"
          onClick={() => onMove({ kind: "defend", cardId: dog.id })}
        >
          {T.defend}
        </Button>
      )}
      <Button
        testId="kuhle-through"
        onClick={() => onMove({ kind: "letThrough" })}
      >
        {T.letThrough}
      </Button>
    </div>
  );
}

/** The deck and the discard pile. */
function Piles({
  game,
  pickable,
  onTake,
}: {
  readonly game: KuhleKueheGame;
  readonly pickable: boolean;
  readonly onTake: (cardId: string) => void;
}): ReactElement {
  const cows = game.discard.filter((card) => card.kind === "cow");
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.drawPile(game.draw.length)} · {T.discardPile}
      </p>
      {game.discard.length === 0 ? (
        <p className="text-sm text-zinc-400">{T.discardEmpty}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {game.discard.map((card, at) => (
            <li key={card.id + at}>
              <CardFace
                card={card}
                small
                open={pickable && card.kind === "cow"}
                onClick={() => onTake(card.id)}
              />
            </li>
          ))}
        </ul>
      )}
      {pickable && cows.length > 0 && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {T.fromDiscard}
        </p>
      )}
    </div>
  );
}

/** One player's herd, with its cows and calves. */
function HerdCard({
  game,
  seat,
  isMe,
  isBotSeat,
  aiming,
  onAim,
}: {
  readonly game: KuhleKueheGame;
  readonly seat: number;
  readonly isMe: boolean;
  readonly isBotSeat: boolean;
  readonly aiming: Aiming | null;
  readonly onAim: (cowId: string | undefined) => void;
}): ReactElement {
  const player = game.players[seat];
  const aimingHere = aiming !== null && aiming.card.kind === "action";
  const wantsOwn =
    aimingHere &&
    aiming.card.kind === "action" &&
    (isGuard(aiming.card.action) || aiming.card.action === "feed");
  const canAim = aimingHere && (wantsOwn ? isMe : !isMe);
  return (
    <article
      data-testid={`kuhle-herd-${seat}`}
      className={`flex flex-col gap-2 rounded-2xl border p-3 text-sm ${
        seat === game.active && game.phase !== "gameOver"
          ? "border-indigo-400 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <header className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate font-semibold">
          {player.name}
          {isMe && " (Du)"}
        </span>
        {isBotSeat && <ComputerBadge />}
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.handCount(player.hand.length)}
        </span>
        <span className="text-lg font-bold tabular-nums">
          {scoreOf(game, seat)}
        </span>
      </header>

      {player.herd.length === 0 && player.calves.length === 0 ? (
        <p className="text-xs text-zinc-400">{T.herdEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {player.herd.map((cow) => (
            <li key={cow.id}>
              <CowRow cow={cow} open={canAim} onClick={() => onAim(cow.id)} />
            </li>
          ))}
          {player.calves.length > 0 && (
            <li className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {T.calves}:
              </span>
              {player.calves.map((calf) => (
                <CardFace
                  key={calf.id}
                  card={calf}
                  small
                  open={
                    canAim &&
                    aiming?.card.kind === "action" &&
                    aiming.card.action === "calfNap"
                  }
                  onClick={() => onAim(undefined)}
                />
              ))}
            </li>
          )}
        </ul>
      )}
    </article>
  );
}

/** One cow, laid out head to rear. */
function CowRow({
  cow,
  open,
  onClick,
}: {
  readonly cow: Cow;
  readonly open: boolean;
  readonly onClick: () => void;
}): ReactElement {
  const pure = isPure(cow);
  return (
    <button
      type="button"
      data-testid={`kuhle-cow-${cow.id}`}
      disabled={!open}
      onClick={onClick}
      className={`flex w-full flex-wrap items-center gap-1 rounded-xl border p-1.5 text-left ${
        open
          ? "cursor-pointer border-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40"
          : "cursor-default border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {cowCards(cow).map((card, at) => (
        <CardFace key={card.id + at} card={card} small />
      ))}
      <span className="ml-auto flex items-center gap-1 text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
        {cow.guard !== null && (
          <span className="rounded-full bg-amber-200 px-1.5 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
            {T.guarded}
          </span>
        )}
        {pure ? T.pure : T.mixed} · {cowPoints(cow)}
      </span>
    </button>
  );
}

/** Your own cards, and what you may do with them. */
function Hand({
  me,
  game,
  picked,
  chosen,
  onToggle,
  myPlay,
  myTrade,
  aiming,
  onAction,
  onMove,
}: {
  readonly me: KuhleKueheGame["players"][number];
  readonly game: KuhleKueheGame;
  readonly picked: readonly string[];
  readonly chosen: readonly Card[];
  readonly onToggle: (id: string) => void;
  readonly myPlay: boolean;
  readonly myTrade: boolean;
  readonly aiming: Aiming | null;
  readonly onAction: (card: Card) => void;
  readonly onMove: (move: KuhleKueheMove) => void;
}): ReactElement {
  const heads = chosen.filter((c) => c.kind === "cow" && c.part === "head");
  const rears = chosen.filter((c) => c.kind === "cow" && c.part === "rear");
  const allCow = chosen.length > 0 && chosen.every((c) => c.kind === "cow");
  const canLay = myPlay && allCow && heads.length === 1 && rears.length === 1;
  const calf = chosen.length === 1 && chosen[0].kind === "calf";
  const over = me.hand.length - HAND_LIMIT;
  const feeding = aiming?.cowId !== undefined && aiming.card.kind === "action";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{T.yourHand}</h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.handCount(me.hand.length)}
        </span>
        {feeding && (
          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
            {T.chooseMiddle}
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
                open={myPlay || myTrade || feeding}
                onClick={() =>
                  feeding && aiming !== null
                    ? onMove({
                        kind: "action",
                        cardId: aiming.card.id,
                        cowId: aiming.cowId,
                        middleId: card.id,
                      })
                    : card.kind === "action" && myPlay && !feeding
                      ? onAction(card)
                      : onToggle(card.id)
                }
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {canLay && (
          <Button
            testId="kuhle-lay"
            onClick={() => onMove({ kind: "layCow", cardIds: picked })}
          >
            {T.layCow}
          </Button>
        )}
        {myPlay && calf && (
          <Button
            testId="kuhle-calf"
            onClick={() => onMove({ kind: "layCalf", cardId: chosen[0].id })}
          >
            {T.layCalf}
          </Button>
        )}
        {myTrade && (
          <Button
            testId="kuhle-pass"
            disabled={picked.length !== TRADE_SIZE}
            onClick={() => onMove({ kind: "pass", cardIds: picked })}
          >
            {T.passCards}
          </Button>
        )}
        {myPlay && (
          <Button
            testId="kuhle-end"
            disabled={over > 0 && picked.length !== over}
            onClick={() => onMove({ kind: "endTurn", discardIds: picked })}
          >
            {over > 0 ? `${T.endTurn} - ${over} ablegen` : T.endTurn}
          </Button>
        )}
        {game.crossing !== null && (
          <span className="text-xs text-indigo-700 dark:text-indigo-300">
            {game.crossing} Rassen erlaubt
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * One card, face up or face down.
 *
 * @remarks
 * The chrome and the drawing live in {@link KuhCard}; this only works out what
 * the card is called, so every place that shows a card gets the same tooltip
 * as the log gets a name.
 */
function CardFace({
  card,
  small = false,
  picked = false,
  open = false,
  onClick,
}: {
  readonly card: Card;
  readonly small?: boolean;
  readonly picked?: boolean;
  readonly open?: boolean;
  readonly onClick?: () => void;
}): ReactElement {
  return (
    <KuhCard
      card={card}
      size={small ? "sm" : "md"}
      picked={picked}
      open={open}
      onClick={onClick}
      title={labelOf(card)}
    />
  );
}

/** The short text printed on a card. */
function label(card: Card): string {
  let text: string;
  if (card.kind === "hidden") {
    text = "🂠";
  } else if (card.kind === "calf") {
    text = "Kalb";
  } else if (card.kind === "action") {
    text = ACTION_NAMES[card.action];
  } else {
    const breed = card.breed === null ? "Joker" : BREED_NAMES[card.breed];
    text = `${breed} ${PART_NAMES[card.part]}`;
  }
  return text;
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

/** What a card is called, for the tooltip. */
function labelOf(card: Card): string {
  return card.kind === "action" ? ACTION_TEXTS[card.action] : label(card);
}

/** Kept for the breed helper the herd view uses. */
export const cowBreeds = breedsOf;
export const cardTooltip = labelOf;
