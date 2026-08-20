/**
 * The table: the piles, everybody's hand size, and your own cards.
 *
 * @module
 * @remarks
 * Everything is done by **selecting cards and then pressing what to do with
 * them**, which is one idea rather than four: one card selected is a play, two
 * of a sort is a theft, three is a demand. Where a move needs a victim, a row
 * of names appears and asking for one is the same gesture again.
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
  CARD_ICONS,
  CARD_INK,
  CARD_NAMES,
  CARD_SHORT,
  CARD_TEXTS,
  KINDS,
  isCat,
  type Card,
  type CardKind,
} from "@/games/exploding-kittens/engine/cards";
import {
  applyMove,
  comboOf,
  nopeCandidates,
} from "@/games/exploding-kittens/engine/moves";
import {
  SELF_NAME,
  isAlive,
  livingSeats,
  type ExplodingKittensGame,
  type ExplodingKittensMove,
  type Player,
} from "@/games/exploding-kittens/engine/state";
import { EK_TEXTS as T } from "@/games/exploding-kittens/i18n/texts";
import { ComputerBadge } from "@/online/computer-badge";
import { seatsFromMine } from "@/online/seat-order";

/** How many of the discard pile's cards are shown, newest last. */
const DISCARD_SHOWN = 6;

/** Percent, for showing the odds as one. */
const PERCENT = 100;

/** From here on, the odds of drawing a kitten are worth shouting about. */
const RISKY_PERCENT = 34;

/** Props of {@link ExplodingKittensTable}. */
export type ExplodingKittensTableProps = {
  readonly game: ExplodingKittensGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: ExplodingKittensMove) => void;
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
export function ExplodingKittensTable({
  game,
  mySeat,
  onMove,
  clock,
  botSeats = [],
}: ExplodingKittensTableProps): ReactElement {
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [target, setTarget] = useState<number | null>(null);
  const [want, setWant] = useState<CardKind | null>(null);
  const me = mySeat === null ? null : game.players[mySeat];

  /** Sends a move and forgets whatever was selected for it. */
  const send = (move: ExplodingKittensMove) => {
    setPicked([]);
    setTarget(null);
    setWant(null);
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

      {game.phase === "nope" && (
        <NopeBar game={game} mySeat={mySeat} onMove={send} />
      )}
      {game.phase === "favor" && (
        <FavorBar game={game} mySeat={mySeat} picked={picked} onMove={send} />
      )}
      {game.phase === "insert" && game.active === mySeat && (
        <InsertBar game={game} onMove={send} />
      )}
      {me?.peek != null && me.peek.length > 0 && <PeekBar peek={me.peek} />}

      <Piles game={game} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {order.map((seat) => (
          <SeatCard
            key={game.players[seat].name + seat}
            game={game}
            seat={seat}
            isMe={seat === mySeat}
            isBotSeat={botSeats.includes(seat)}
          />
        ))}
      </div>

      {me !== null && mySeat !== null && (
        <Hand
          game={game}
          me={me}
          mySeat={mySeat}
          picked={picked}
          target={target}
          want={want}
          onPick={toggle}
          onTarget={setTarget}
          onWant={setWant}
          onMove={send}
        />
      )}
    </section>
  );
}

/** The line that says what is being waited for, and how bad the odds are. */
function Panel({
  game,
  mySeat,
  clock,
}: {
  readonly game: ExplodingKittensGame;
  readonly mySeat: number | null;
  readonly clock?: ReactNode;
}): ReactElement {
  const waiting = seatWaitedFor(game);
  const heads: Readonly<Record<string, string>> = {
    play: T.phasePlay,
    nope: T.phaseNope,
    favor: T.phaseFavor,
    insert: T.phaseInsert,
    gameOver: T.gameOverTitle,
  };
  const hints: Readonly<Record<string, string>> = {
    play: T.phasePlayHint,
    nope: T.phaseNopeHint,
    favor: T.phaseFavor,
    insert: T.phaseInsertHint,
    gameOver: "",
  };
  const kittens = livingSeats(game).length - 1;
  const risk =
    game.draw.length === 0
      ? 0
      : Math.round((kittens / game.draw.length) * PERCENT);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{heads[game.phase]}</h2>
        {clock}
        {game.turnsOwed > 1 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300">
            {T.turnsOwed(game.turnsOwed)}
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {hints[game.phase]}
      </p>
      {/* Once it is over the panel says nothing about turns - the result is
          already standing right above it, and saying "Spiel vorbei" twice in
          two boxes reads like something has gone wrong. */}
      {game.phase !== "gameOver" && (
        <p className="text-sm" data-testid="ek-status">
          {mySeat !== null && waiting === mySeat
            ? T.yourTurn
            : T.waitingFor(game.players[waiting ?? game.active].name)}
        </p>
      )}
      <ul className="flex flex-wrap gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        <li>{T.drawPile(game.draw.length)}</li>
        <li>{T.discardPile(game.discard.length)}</li>
        <li>{T.kittensLeft(kittens)}</li>
        <li className={risk >= RISKY_PERCENT ? "font-semibold" : ""}>
          {T.risk(risk)}
        </li>
      </ul>
    </div>
  );
}

/** Who the table is waiting for, mirrored from the engine's own answer. */
function seatWaitedFor(game: ExplodingKittensGame): number | null {
  let seat: number | null = null;
  if (game.phase === "nope") {
    const waiting = nopeCandidates(game);
    seat = waiting.length > 0 ? waiting[0] : game.active;
  } else if (game.phase === "favor") {
    seat = game.demand?.target ?? game.active;
  } else if (game.phase !== "gameOver") {
    seat = game.active;
  }
  return seat;
}

/** The open window: what is on the table, and the one word that stops it. */
function NopeBar({
  game,
  mySeat,
  onMove,
}: {
  readonly game: ExplodingKittensGame;
  readonly mySeat: number | null;
  readonly onMove: (move: ExplodingKittensMove) => void;
}): ReactElement | null {
  const pending = game.pending;
  const mine =
    mySeat !== null && nopeCandidates(game).includes(mySeat)
      ? game.players[mySeat].hand.find((card) => card.kind === "nope")
      : undefined;
  if (pending === null) {
    return null;
  }
  const laid =
    pending.action.kind === "card"
      ? pending.action.card
      : pending.action.cards[0];
  const dead = pending.nopes % 2 === 1;
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 p-3 ${
        dead
          ? "border-zinc-400 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800"
          : "border-orange-400 bg-orange-50 dark:border-orange-500 dark:bg-orange-950/40"
      }`}
    >
      <span className="text-sm">
        <strong>{game.players[pending.by].name}</strong>
        {": "}
        {laid.kind === "hidden" ? "?" : CARD_NAMES[laid.kind]}
        {pending.nopes > 0 && ` · ${pending.nopes}× ${T.nope}`}
      </span>
      {mine !== undefined && (
        <>
          <Button
            testId="ek-nope"
            onClick={() => onMove({ kind: "nope", cardId: mine.id })}
          >
            {dead ? T.yup : T.nope}
          </Button>
          <Button
            testId="ek-through"
            tone="quiet"
            onClick={() => onMove({ kind: "letThrough" })}
          >
            {T.letThrough}
          </Button>
        </>
      )}
    </div>
  );
}

/** A Gefallen has landed: the victim picks what to part with. */
function FavorBar({
  game,
  mySeat,
  picked,
  onMove,
}: {
  readonly game: ExplodingKittensGame;
  readonly mySeat: number | null;
  readonly picked: readonly string[];
  readonly onMove: (move: ExplodingKittensMove) => void;
}): ReactElement | null {
  const demand = game.demand;
  if (demand === null) {
    return null;
  }
  const mine = demand.target === mySeat;
  const chosen = picked[0];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-teal-400 bg-teal-50 p-3 dark:border-teal-500 dark:bg-teal-950/40">
      <span className="text-sm">
        {mine
          ? T.giveHint(game.players[demand.by].name)
          : T.waitingFor(game.players[demand.target].name)}
      </span>
      {mine && (
        <Button
          testId="ek-give"
          disabled={chosen === undefined}
          onClick={() =>
            chosen === undefined
              ? undefined
              : onMove({ kind: "give", cardId: chosen })
          }
        >
          {T.give}
        </Button>
      )}
    </div>
  );
}

/**
 * Hiding a defused kitten.
 *
 * @remarks
 * A slider rather than a list of positions, because the pile can be forty cards
 * deep and the interesting choice is coarse anyway - right on top for the next
 * player, or far enough down that it becomes somebody else's problem.
 */
function InsertBar({
  game,
  onMove,
}: {
  readonly game: ExplodingKittensGame;
  readonly onMove: (move: ExplodingKittensMove) => void;
}): ReactElement {
  const [at, setAt] = useState(0);
  const depth = game.draw.length;
  const spot = Math.min(at, depth);
  return (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-rose-400 bg-rose-50 p-3 dark:border-rose-500 dark:bg-rose-950/40">
      <p className="text-sm font-medium">
        {CARD_ICONS.kitten} {T.phaseInsertHint}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="range"
          min={0}
          max={depth}
          value={spot}
          aria-label={T.phaseInsert}
          data-testid="ek-insert-at"
          onChange={(event) => setAt(Number(event.target.value))}
          className="w-48 cursor-pointer"
        />
        <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
          {T.insertAt(spot, depth)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button testId="ek-insert-top" tone="quiet" onClick={() => setAt(0)}>
          {T.insertTop}
        </Button>
        <Button
          testId="ek-insert-bottom"
          tone="quiet"
          onClick={() => setAt(depth)}
        >
          {T.insertBottom}
        </Button>
        <Button
          testId="ek-insert"
          onClick={() => onMove({ kind: "insert", at: spot })}
        >
          {T.insertDo}
        </Button>
      </div>
    </div>
  );
}

/** What a Blick in die Zukunft showed, for as long as it is still true. */
function PeekBar({ peek }: { readonly peek: readonly Card[] }): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-amber-400 bg-amber-50 p-3 dark:border-amber-500 dark:bg-amber-950/40">
      <div>
        <p className="text-sm font-semibold">{T.peekTitle}</p>
        <p className="text-[11px] text-amber-900 dark:text-amber-200">
          {T.peekHint}
        </p>
      </div>
      <ul className="flex gap-1.5">
        {peek.map((card, at) => (
          <li key={card.id + at} className="flex flex-col items-center">
            <CardFace card={card} small />
            <span className="text-[10px] text-zinc-500 tabular-nums">
              {at + 1}.
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The draw pile's depth and the top of the discard pile. */
function Piles({
  game,
}: {
  readonly game: ExplodingKittensGame;
}): ReactElement {
  const shown = game.discard.slice(-DISCARD_SHOWN);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col items-center">
        <span className="flex h-16 w-12 items-center justify-center rounded-lg border-2 border-zinc-400 bg-zinc-100 text-2xl dark:border-zinc-600 dark:bg-zinc-800">
          {"\u{1F0A0}"}
        </span>
        <span className="text-[10px] tabular-nums text-zinc-500">
          {game.draw.length}
        </span>
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-zinc-400">{T.discardPile(0)}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
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

/** One player: how many cards they hold, and whether they are still with us. */
function SeatCard({
  game,
  seat,
  isMe,
  isBotSeat,
}: {
  readonly game: ExplodingKittensGame;
  readonly seat: number;
  readonly isMe: boolean;
  readonly isBotSeat: boolean;
}): ReactElement {
  const player = game.players[seat];
  const dead = !isAlive(player);
  const onTurn = seat === game.active && game.phase !== "gameOver" && !dead;
  return (
    <article
      data-testid={`ek-seat-${seat}`}
      className={`flex flex-col gap-1 rounded-2xl border p-3 text-sm ${
        dead
          ? "border-zinc-200 bg-zinc-100 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
          : onTurn
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
      </header>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {dead ? (
          <span className="font-semibold text-rose-700 dark:text-rose-300">
            {CARD_ICONS.kitten} {T.dead} · {T.place((player.place ?? 0) + 1)}
          </span>
        ) : (
          `${T.hand}: ${T.handCount(player.hand.length)}`
        )}
      </p>
    </article>
  );
}

/** Your own cards, and the buttons for whatever you may do with them. */
function Hand({
  game,
  me,
  mySeat,
  picked,
  target,
  want,
  onPick,
  onTarget,
  onWant,
  onMove,
}: {
  readonly game: ExplodingKittensGame;
  readonly me: Player;
  readonly mySeat: number;
  readonly picked: readonly string[];
  readonly target: number | null;
  readonly want: CardKind | null;
  readonly onPick: (id: string) => void;
  readonly onTarget: (seat: number) => void;
  readonly onWant: (kind: CardKind) => void;
  readonly onMove: (move: ExplodingKittensMove) => void;
}): ReactElement {
  const allowed = (move: ExplodingKittensMove) =>
    applyMove(game, mySeat, move) !== null;
  const chosen = me.hand.filter((card) => picked.includes(card.id));
  const combo = comboOf(chosen);
  const first = chosen[0];

  const playMove: ExplodingKittensMove = {
    kind: "play",
    cardId: first?.id ?? "",
    ...(target === null ? {} : { target }),
  };
  const comboMove: ExplodingKittensMove = {
    kind: "combo",
    cardIds: picked,
    target: target ?? -1,
    ...(combo === "name" && want !== null ? { want } : {}),
  };
  const single = chosen.length === 1;
  const needsTarget =
    combo !== null || (single && first !== undefined && first.kind === "favor");
  const needsWant = combo === "name";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{T.yourHand}</h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.handCount(me.hand.length)}
        </span>
        {me.hand.some((card) => isCatCard(card)) && (
          <span className="text-[11px] text-zinc-400">{T.onlyCats}</span>
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
                open
                onClick={() => onPick(card.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {needsTarget && (
        <TargetPicker
          game={game}
          mySeat={mySeat}
          target={target}
          onTarget={onTarget}
        />
      )}
      {needsWant && <WantPicker want={want} onWant={onWant} />}

      <div className="flex flex-wrap items-center gap-2">
        {single && (
          <Button
            testId="ek-play"
            disabled={!allowed(playMove)}
            onClick={() => onMove(playMove)}
          >
            {T.play}
          </Button>
        )}
        {combo !== null && (
          <Button
            testId="ek-combo"
            disabled={!allowed(comboMove)}
            onClick={() => onMove(comboMove)}
          >
            {combo === "steal" ? T.comboSteal : T.comboName}
          </Button>
        )}
        <Button
          testId="ek-draw"
          tone={game.phase === "play" ? "danger" : "quiet"}
          disabled={!allowed({ kind: "draw" })}
          onClick={() => onMove({ kind: "draw" })}
        >
          {T.drawCard}
        </Button>
      </div>
    </div>
  );
}

/** Whether this card is one of the five that only work in pairs. */
function isCatCard(card: Card): boolean {
  return card.kind !== "hidden" && isCat(card.kind);
}

/** Who the selected cards are aimed at. */
function TargetPicker({
  game,
  mySeat,
  target,
  onTarget,
}: {
  readonly game: ExplodingKittensGame;
  readonly mySeat: number;
  readonly target: number | null;
  readonly onTarget: (seat: number) => void;
}): ReactElement {
  const others = livingSeats(game).filter((seat) => seat !== mySeat);
  return (
    <div
      role="radiogroup"
      aria-label={T.chooseTarget}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.chooseTarget}
      </span>
      {others.map((seat) => (
        <button
          key={seat}
          type="button"
          role="radio"
          aria-checked={seat === target}
          data-testid={`ek-target-${seat}`}
          onClick={() => onTarget(seat)}
          className={`cursor-pointer rounded-lg border px-3 py-1 text-sm font-medium ${
            seat === target
              ? "border-indigo-500 bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100"
              : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {game.players[seat].name} ({game.players[seat].hand.length})
        </button>
      ))}
    </div>
  );
}

/** Which card a three of a kind is asking for. */
function WantPicker({
  want,
  onWant,
}: {
  readonly want: CardKind | null;
  readonly onWant: (kind: CardKind) => void;
}): ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label={T.chooseWanted}
      className="flex flex-wrap items-center gap-1.5"
    >
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.chooseWanted}
      </span>
      {KINDS.filter((kind) => kind !== "kitten").map((kind) => (
        <button
          key={kind}
          type="button"
          role="radio"
          aria-checked={kind === want}
          data-testid={`ek-want-${kind}`}
          title={CARD_NAMES[kind]}
          onClick={() => onWant(kind)}
          className={`cursor-pointer rounded-lg border px-2 py-1 text-[11px] font-medium ${
            kind === want
              ? "border-indigo-500 bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100"
              : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {CARD_ICONS[kind]} {CARD_SHORT[kind]}
        </button>
      ))}
    </div>
  );
}

/**
 * One card, face up or face down.
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
    ? "h-12 w-10 text-[9px]"
    : "h-20 w-16 text-[10px] sm:h-24 sm:w-[4.5rem]";
  const look = `flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-0.5 text-center leading-tight font-semibold ${size} ${
    picked
      ? "border-indigo-500 bg-indigo-100 dark:bg-indigo-900/60"
      : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800"
  } ${dim ? "opacity-50" : ""} ${
    card.kind === "hidden" ? "" : CARD_INK[card.kind]
  }`;
  const face = (
    <>
      <span aria-hidden className={small ? "text-sm" : "text-xl"}>
        {card.kind === "hidden" ? "\u{1F0A0}" : CARD_ICONS[card.kind]}
      </span>
      <span className="hyphens-auto break-words">
        {card.kind === "hidden" ? "?" : CARD_SHORT[card.kind]}
      </span>
    </>
  );
  const title =
    card.kind === "hidden"
      ? "?"
      : `${CARD_NAMES[card.kind]} - ${CARD_TEXTS[card.kind]}`;

  return open ? (
    <button
      type="button"
      data-testid={`ek-card-${card.id}`}
      onClick={onClick}
      title={title}
      className={`${look} cursor-pointer hover:brightness-95`}
    >
      {face}
    </button>
  ) : (
    <span data-testid={`ek-card-${card.id}`} title={title} className={look}>
      {face}
    </span>
  );
}

/** A plain button, so the table's controls all look the same. */
function Button({
  children,
  onClick,
  disabled = false,
  testId,
  tone = "loud",
}: {
  readonly children: ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly testId: string;
  readonly tone?: "loud" | "quiet" | "danger";
}): ReactElement {
  const looks: Readonly<Record<string, string>> = {
    loud: "bg-indigo-600 text-white hover:bg-indigo-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    quiet:
      "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800",
  };
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${looks[tone]}`}
    >
      {children}
    </button>
  );
}
