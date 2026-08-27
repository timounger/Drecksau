/**
 * The table: everybody's fields, your own hand, and the one card that has to
 * go somewhere.
 *
 * @module
 * @remarks
 * Two things are on this screen at once, and they answer different questions.
 * **Everybody's fields** are face up and are what the whole game is read from -
 * who wants which bean, who is one card from a Taler, who is about to be forced
 * into a harvest. **Your own hand** is the private half, and its order is the
 * game: the front card is not a card you have, it is a card you owe.
 *
 * So the front card is marked and the rest are not sortable, not draggable, and
 * not reorderable by any gesture the screen offers. That is not a missing
 * feature - it is the rule, and a hand you could tidy would be a different
 * game.
 *
 * Harvesting sits on every field of your own row, in every phase, because the
 * rulebook puts it there: "Du darfst jederzeit im Spiel deine Bohnenfelder
 * abernten, auch wenn du nicht die aktive Person bist." A button that only
 * appeared on your turn would be a rule this table had quietly invented.
 */
"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import {
  BEAN_STYLE,
  DECK_SIZE,
  beanName,
  isFaceDown,
  type Card,
} from "@/games/bohnanza/engine/beans";
import {
  fieldWorth,
  legalMoves,
  mustHarvest,
  seatOnTurn,
} from "@/games/bohnanza/engine/moves";
import {
  EMPTY_LIMIT,
  SELF_NAME,
  canHarvest,
  fieldBean,
  type BohnanzaGame,
  type BohnanzaMove,
  type Phase,
} from "@/games/bohnanza/engine/state";
import { BZ_TEXTS as T } from "@/games/bohnanza/i18n/texts";
import { ComputerBadge } from "@/online/computer-badge";
import { seatsFromMine } from "@/online/seat-order";
import { BeanCard } from "./bean-card";
import { BohnanzaTrade } from "./bohnanza-trade";

/** Props of {@link BohnanzaTable}. */
export type BohnanzaTableProps = {
  readonly game: BohnanzaGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: BohnanzaMove) => void;
  /** The turn clock, shown beside whose turn it is. */
  readonly clock?: ReactNode;
  /** Seats the computer plays because their player left. */
  readonly botSeats?: readonly number[];
};

/** What each phase is called on screen. */
const PHASE_NAMES: Readonly<Record<Phase, string>> = {
  plant: T.phasePlant,
  trade: T.phaseTrade,
  settle: T.phaseSettle,
  gameOver: T.gameOverTitle,
};

/**
 * Renders the whole table.
 *
 * @param props - the game and who is reading it
 * @returns the table element
 */
export function BohnanzaTable({
  game,
  mySeat,
  onMove,
  clock,
  botSeats = [],
}: BohnanzaTableProps): ReactElement {
  const moves = mySeat === null ? [] : legalMoves(game, mySeat);
  const order = seatsFromMine(game.players.length, mySeat);
  const pending = mySeat === null ? [] : game.players[mySeat].pending;
  const [chosen, setChosen] = useState<string | null>(null);
  // The card Phase 3 is about to plant: whichever of the crosswise ones is
  // selected, and the first of them until somebody says otherwise.
  const settling =
    pending.find((card) => card.id === chosen) ?? pending[0] ?? null;

  return (
    <section className="flex flex-col gap-4">
      <Panel game={game} mySeat={mySeat} clock={clock} />
      {mySeat !== null && (
        <Guidance game={game} mySeat={mySeat} onMove={onMove} />
      )}
      {/* Your hand, then your own fields, and only then the trading and
          everybody else. Those two are what you act *from* and what you act
          *on*, and every phase of this game needs them side by side:

          - planting puts the front card on one of those fields,
          - trading asks what you are short of, which is what the fields say,
          - and harvesting is allowed "jederzeit im Spiel", so the buttons for
            it live on those fields in every phase - including while trading,
            which is exactly when somebody clears a field to make room.

          The trade panel used to sit between the two. Measured on an
          890-pixel window it ran to y=936 while your own row began at 952 - so
          the moment there was anything to decide, the fields it had to be
          decided against were off the bottom of the screen, and that is with
          the panel still empty. */}
      {mySeat !== null && (
        <MyHand
          game={game}
          mySeat={mySeat}
          settling={settling}
          onChoose={setChosen}
        />
      )}
      {mySeat !== null && (
        <SeatRow
          game={game}
          seat={mySeat}
          isMe
          isBotSeat={botSeats.includes(mySeat)}
          moves={moves}
          settling={settling}
          onMove={onMove}
        />
      )}
      <BohnanzaTrade game={game} mySeat={mySeat} onMove={onMove} />
      <ul className="flex flex-col gap-2">
        {order
          .filter((seat) => seat !== mySeat)
          .map((seat) => (
            <li key={game.players[seat].name + seat}>
              <SeatRow
                game={game}
                seat={seat}
                isMe={false}
                isBotSeat={botSeats.includes(seat)}
                moves={[]}
                settling={null}
                onMove={onMove}
              />
            </li>
          ))}
      </ul>
    </section>
  );
}

/**
 * The turn, the phase and the two piles.
 *
 * @remarks
 * Whose turn it is has to be said two different ways, and that is not fussiness
 * about grammar. The seat you play yourself is called "Du" when it has no other
 * name, and "Du ist dran" is not German - the line would be wrong on screen for
 * half of every game.
 */
function Panel({
  game,
  mySeat,
  clock,
}: {
  readonly game: BohnanzaGame;
  readonly mySeat: number | null;
  readonly clock?: ReactNode;
}): ReactElement {
  const waiting = seatOnTurn(game);
  let turn: string;
  if (waiting === null) {
    turn = "";
  } else if (waiting === mySeat) {
    turn = T.yourTurn;
  } else {
    turn = T.waitingFor(game.players[waiting].name);
  }
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{T.turn(game.turn)}</h2>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
          {PHASE_NAMES[game.phase]}
        </span>
        {clock}
        <span className="ml-auto text-sm">{turn}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{T.deckLeft(game.deck.length)}</span>
        <span>{T.discardLeft(game.discard.length)}</span>
        <span>{T.emptied(game.emptied, EMPTY_LIMIT)}</span>
        <span>{`${game.spent.length}/${DECK_SIZE} als Taler aus dem Spiel`}</span>
      </div>
      {game.revealed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium">{T.revealed}</span>
          {game.revealed.map((card) => (
            <BeanCard
              key={card.id}
              bean={card.bean}
              faceDown={isFaceDown(card)}
            />
          ))}
        </div>
      )}
      {game.ending && (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
          {T.lastRounds}
        </p>
      )}
    </div>
  );
}

/**
 * What the reader is supposed to do next, and the buttons that end a phase.
 *
 * @remarks
 * Every phase of this game ends either by itself or by somebody saying so, and
 * the two that need saying - "no second bean" and "no more trading" - are the
 * two buttons here. The sentence above them is worth its space: being told to
 * harvest before you can go on is not something a player who has just been
 * handed an unusable bean works out on their own.
 */
function Guidance({
  game,
  mySeat,
  onMove,
}: {
  readonly game: BohnanzaGame;
  readonly mySeat: number;
  readonly onMove: (move: BohnanzaMove) => void;
}): ReactElement | null {
  const mine = seatOnTurn(game) === mySeat;
  const moves = legalMoves(game, mySeat);
  const canStop = moves.some((move) => move.kind === "done");
  const canEndTrade = moves.some((move) => move.kind === "endTrade");
  let hint: string;
  if (!mine) {
    hint = T.waitHint;
  } else if (mustHarvest(game, mySeat)) {
    hint = T.mustHarvestHint;
  } else if (game.phase === "plant") {
    hint = game.planted === 0 ? T.phasePlantHint : T.phasePlantHint2;
  } else if (game.phase === "trade") {
    hint = T.phaseTradeHint;
  } else {
    hint = T.phaseSettleHint;
  }

  return game.phase === "gameOver" ? null : (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <p className="text-sm">{hint}</p>
      {canStop && (
        <button
          type="button"
          data-testid="bohnanza-done"
          onClick={() => onMove({ kind: "done" })}
          className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.donePlanting}
        </button>
      )}
      {canEndTrade && (
        <button
          type="button"
          data-testid="bohnanza-endtrade"
          onClick={() => onMove({ kind: "endTrade" })}
          className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          {T.endTrade}
        </button>
      )}
    </div>
  );
}

/** One player: their name, their Taler, their fields and what lies crosswise. */
function SeatRow({
  game,
  seat,
  isMe,
  isBotSeat,
  moves,
  settling,
  onMove,
}: {
  readonly game: BohnanzaGame;
  readonly seat: number;
  readonly isMe: boolean;
  readonly isBotSeat: boolean;
  /** The reader's own legal moves, so their fields know what they can do. */
  readonly moves: readonly BohnanzaMove[];
  /** The crosswise card waiting to be planted, on the reader's own row. */
  readonly settling: Card | null;
  readonly onMove: (move: BohnanzaMove) => void;
}): ReactElement {
  const player = game.players[seat];
  const onTurn = seatOnTurn(game) === seat;
  // In Phase 1 the card that has to go down is the front hand card; in Phase 3
  // it is whichever crosswise card is selected. Both land on a field, so both
  // are the same question to a field: will you take this one?
  const laying = game.phase === "plant" ? (player.hand[0] ?? null) : settling;

  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border p-3 ${
        onTurn
          ? "border-emerald-400 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-950/20"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">
          {player.name}
          {isMe && player.name !== SELF_NAME ? ` (${SELF_NAME})` : ""}
        </span>
        {seat === game.starter && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
            {T.starter}
          </span>
        )}
        {isBotSeat && <ComputerBadge />}
        <span className="ml-auto font-bold tabular-nums">
          {T.coins(player.coins)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {player.fields.map((field, at) => (
          <FieldView
            key={at}
            field={field}
            canPlant={
              isMe &&
              laying !== null &&
              moves.some(
                (move) =>
                  (move.kind === "plant" && move.field === at) ||
                  (move.kind === "settle" &&
                    move.field === at &&
                    move.card === laying.id),
              )
            }
            canReap={isMe && canHarvest(player, at)}
            blocked={isMe && field.length === 1 && !canHarvest(player, at)}
            onPlant={() =>
              onMove(
                game.phase === "plant"
                  ? { kind: "plant", field: at }
                  : { kind: "settle", card: laying?.id ?? "", field: at },
              )
            }
            onReap={() => onMove({ kind: "harvest", field: at })}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">
          {T.handCount(player.hand.length)}
        </span>
        {player.pending.length > 0 && (
          <>
            <span className="text-zinc-500 dark:text-zinc-400">
              {"\u{00B7}"} {T.crosswise}
            </span>
            {player.pending.map((card) => (
              <span
                key={card.id}
                className={
                  settling !== null && card.id === settling.id && isMe
                    ? "rounded-lg ring-2 ring-emerald-500"
                    : ""
                }
              >
                <BeanCard
                  bean={card.bean}
                  size="sm"
                  faceDown={isFaceDown(card)}
                />
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * One field.
 *
 * @remarks
 * The three numbers on it are the harvest decision, and they are the reason it
 * is a panel rather than a stack of card images: what it pays now, what it
 * could still pay, and how many cards away that is. A player who can see those
 * is playing Bohnanza; one who has to count a stack and remember a Bohnometer
 * is doing arithmetic.
 */
function FieldView({
  field,
  canPlant,
  canReap,
  blocked,
  onPlant,
  onReap,
}: {
  readonly field: readonly Card[];
  readonly canPlant: boolean;
  readonly canReap: boolean;
  /** Held back by the Bohnenschutzregel, which is worth saying out loud. */
  readonly blocked: boolean;
  readonly onPlant: () => void;
  readonly onReap: () => void;
}): ReactElement {
  const bean = fieldBean(field);
  const worth = bean === null ? null : fieldWorth(bean, field.length);

  return (
    <div
      className={`flex min-w-32 flex-col gap-1 rounded-xl border p-2 ${
        bean === null
          ? "border-dashed border-zinc-300 dark:border-zinc-700"
          : BEAN_STYLE[bean]
      }`}
    >
      {bean === null ? (
        <span className="text-[11px] text-zinc-400">{T.emptyField}</span>
      ) : (
        // A card and a count, the way a field on the table looks: the row is
        // all one sort, so one card standing for it says everything the stack
        // would - and the numbers beside it are what the harvest decision is.
        <div className="flex items-center gap-2">
          <BeanCard bean={bean} size="sm" />
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold">
              {field.length}x {beanName(bean)}
            </span>
            <span className="text-[11px] opacity-80">
              {T.coins(worth?.coins ?? 0)}
            </span>
            <span className="text-[11px] opacity-80">
              {worth?.toNext === null ? T.ripe : T.toNext(worth?.toNext ?? 0)}
            </span>
          </span>
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {canPlant && (
          <button
            type="button"
            data-testid="bohnanza-plant"
            onClick={onPlant}
            className="cursor-pointer rounded-lg bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {T.plantHere}
          </button>
        )}
        {canReap && (
          <button
            type="button"
            data-testid="bohnanza-harvest"
            onClick={onReap}
            className="cursor-pointer rounded-lg border border-current px-2 py-1 text-[11px] font-semibold hover:opacity-80"
          >
            {T.harvest}
          </button>
        )}
        {blocked && (
          <span
            title={T.harvestBlocked}
            className="text-[11px] opacity-70"
            aria-label={T.harvestBlocked}
          >
            {"\u{1F512}"}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The reader's own hand, front card first.
 *
 * @remarks
 * Drawn as a row in its fixed order, with the front card marked and everything
 * else plainly behind it. There is deliberately no way to move a card: the one
 * rule this whole game is built on is that you may not.
 *
 * The crosswise cards are pickable here rather than on the field row, because
 * choosing *which* of them to plant next is a decision about the cards and only
 * afterwards about the field.
 */
function MyHand({
  game,
  mySeat,
  settling,
  onChoose,
}: {
  readonly game: BohnanzaGame;
  readonly mySeat: number;
  readonly settling: Card | null;
  readonly onChoose: (id: string) => void;
}): ReactElement {
  const player = game.players[mySeat];
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">{T.yourHand}</h2>
      {player.hand.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.handEmpty}
        </p>
      ) : (
        <ol className="flex flex-wrap items-end gap-1.5">
          {player.hand.map((card, at) => (
            <li key={card.id} className="flex flex-col items-center gap-0.5">
              {/* The front card is marked, not the others dimmed. Fading the
                  rest would say "these matter less", and they do not - the
                  whole hand is what you plan the next few turns from. It is
                  only the order that makes the first one special. */}
              <span
                className={
                  at === 0 ? "rounded-lg ring-2 ring-emerald-500" : undefined
                }
              >
                <BeanCard bean={card.bean} faceDown={isFaceDown(card)} />
              </span>
              {at === 0 && (
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  {T.frontCard}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
      {player.pending.length > 1 && game.phase === "settle" && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium">{T.crosswise}</span>
          {player.pending.map((card) => (
            <button
              key={card.id}
              type="button"
              aria-pressed={settling?.id === card.id}
              onClick={() => onChoose(card.id)}
              className={`cursor-pointer rounded-lg ${
                settling?.id === card.id
                  ? "ring-2 ring-emerald-500"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <BeanCard
                bean={card.bean}
                size="sm"
                faceDown={isFaceDown(card)}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
