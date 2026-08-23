/**
 * Everything a turn needs that is not on the board.
 *
 * @module
 * @remarks
 * The board takes every move that has a *place* - build here, rob there. What
 * is left are the moves that have none: throwing the dice, ending the turn,
 * naming a resource, choosing whom to rob, and laying cards down after a seven.
 * Those live here, in one bar under the island, and only the ones the current
 * moment allows are ever drawn - an empty bar means the board is waiting for a
 * tap.
 */
"use client";

import { useState, type ReactElement } from "react";
import {
  discardCount,
  seatOnTurn,
} from "@/games/catan/engine/moves";
import {
  EVENT_ASK,
  EVENT_NAMES,
  EVENT_TEXTS,
  anybodyHolding,
  fromOwnHand,
  poorerThan,
} from "@/games/catan/engine/events";
import { COLOUR_INK } from "@/games/catan/engine/setup";
import {
  NO_CARDS,
  RESOURCES,
  handSize,
  sharesTurns,
  withCard,
  type CatanGame,
  type CatanMove,
  type Hand,
  type Resource,
} from "@/games/catan/engine/state";
import { CATAN_TEXTS as T, SORT_NAMES } from "@/games/catan/i18n/texts";

/** A button in the bar. */
export function Button({
  label,
  onClick,
  testId,
  strong = false,
  off = false,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly testId?: string;
  readonly strong?: boolean;
  readonly off?: boolean;
}): ReactElement {
  const look = strong
    ? "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
    : "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={off}
      onClick={onClick}
      className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${look}`}
    >
      {label}
    </button>
  );
}

/** A row of counters, one per resource. */
export function CardPicker({
  hand,
  limit,
  onChange,
  testId,
}: {
  readonly hand: Hand;
  /** The most that may be taken of each sort. */
  readonly limit: Hand;
  readonly onChange: (hand: Hand) => void;
  readonly testId: string;
}): ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5" data-testid={testId}>
      {RESOURCES.map((sort) => (
        <span
          key={sort}
          className="flex items-center gap-1 rounded-lg border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-700"
        >
          <button
            type="button"
            aria-label={`${SORT_NAMES[sort]} weniger`}
            data-testid={`${testId}-${sort}-less`}
            disabled={hand[sort] === 0}
            onClick={() => onChange(withCard(hand, sort, -1))}
            className="cursor-pointer px-1 font-bold disabled:opacity-30"
          >
            -
          </button>
          <span className="tabular-nums">
            {SORT_NAMES[sort]} {hand[sort]}
          </span>
          <button
            type="button"
            aria-label={`${SORT_NAMES[sort]} mehr`}
            data-testid={`${testId}-${sort}-more`}
            disabled={hand[sort] >= limit[sort]}
            onClick={() => onChange(withCard(hand, sort))}
            className="cursor-pointer px-1 font-bold disabled:opacity-30"
          >
            +
          </button>
        </span>
      ))}
    </div>
  );
}

/** Laying half a hand down after a seven. */
function Discarding({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement {
  const owed = discardCount(game, mySeat);
  const [picked, setPicked] = useState<Hand>(NO_CARDS);
  const chosen = handSize(picked);
  return (
    <div className="flex flex-col gap-1.5" data-testid="ct-discard">
      <span className="text-sm font-semibold">{T.discardHead(owed)}</span>
      <span className="text-xs opacity-70">{T.discardHint}</span>
      <CardPicker
        hand={picked}
        limit={game.players[mySeat].hand}
        onChange={(next) => setPicked(handSize(next) > owed ? picked : next)}
        testId="ct-discard-pick"
      />
      <span>
        <Button
          label={T.discardDo(chosen)}
          off={chosen !== owed}
          strong
          testId="ct-discard-do"
          onClick={() => {
            onMove({ kind: "discard", cards: picked });
            setPicked(NO_CARDS);
          }}
        />
      </span>
    </div>
  );
}

/** Choosing whom the robber takes a card from. */
function Stealing({
  game,
  onMove,
}: {
  readonly game: CatanGame;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="ct-steal">
      <span className="text-sm font-semibold">{T.pickVictim}</span>
      {game.targets.map((seat) => (
        <Button
          key={seat}
          label={`${game.players[seat].name} (${T.handCount(game.players[seat].cards)})`}
          testId={`ct-steal-${seat}`}
          onClick={() => onMove({ kind: "rob", seat })}
        />
      ))}
    </div>
  );
}

/** Naming a resource for Monopol or Erfindung. */
function Naming({
  game,
  onMove,
}: {
  readonly game: CatanGame;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement {
  const asking = game.phase === "monopol" ? T.pickMonopol : T.pickGift(game.gifts);
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="ct-name-sort">
      <span className="text-sm font-semibold">{asking}</span>
      {RESOURCES.map((sort: Resource) => (
        <Button
          key={sort}
          label={SORT_NAMES[sort]}
          testId={`ct-sort-${sort}`}
          onClick={() => onMove({ kind: "choose", sort })}
        />
      ))}
    </div>
  );
}

/** The event card lying face up, if this game is played with them. */
function Card({ game }: { readonly game: CatanGame }): ReactElement | null {
  const card = game.drawn;
  return card === null ? null : (
    <span className="flex flex-col" data-testid="ct-event-card">
      <span className="text-sm font-bold">
        {EVENT_NAMES[card.kind]}
        {card.number === null ? "" : ` (${card.number})`}
      </span>
      <span className="text-[10px] opacity-70">{EVENT_TEXTS[card.kind]}</span>
    </span>
  );
}

/** Answering the card. */
function Answering({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement | null {
  const kind = game.drawn?.kind;
  const ask = kind === undefined ? null : EVENT_ASK[kind];
  const hand = game.players[mySeat].hand;
  const [gift, setGift] = useState<Resource | null>(null);
  let body: ReactElement | null = null;

  if (kind !== undefined && ask === "sort") {
    const own = fromOwnHand(kind);
    body = (
      <div className="flex flex-wrap items-center gap-2" data-testid="ct-event-sort">
        <span className="text-sm font-semibold">{own ? T.pickOwnCard : T.pickFreeCard}</span>
        {RESOURCES.map((sort) => (
          <Button
            key={sort}
            label={own ? `${SORT_NAMES[sort]} (${hand[sort]})` : SORT_NAMES[sort]}
            off={own && hand[sort] === 0}
            testId={`ct-event-${sort}`}
            onClick={() => onMove({ kind: "event", sort })}
          />
        ))}
      </div>
    );
  } else if (ask === "road") {
    body = (
      <span className="text-sm font-semibold" data-testid="ct-event-road">
        {T.pickBreakRoad}
      </span>
    );
  } else if (ask === "victim") {
    body = (
      <div className="flex flex-wrap items-center gap-2" data-testid="ct-event-victim">
        <span className="text-sm font-semibold">{T.pickDrawFrom}</span>
        {anybodyHolding(game, mySeat).map((seat) => (
          <Button
            key={seat}
            label={`${game.players[seat].name} (${T.handCount(game.players[seat].cards)})`}
            testId={`ct-event-victim-${seat}`}
            onClick={() => onMove({ kind: "event", seat })}
          />
        ))}
      </div>
    );
  } else if (ask === "gift") {
    body = (
      <div className="flex flex-col gap-1.5" data-testid="ct-event-gift">
        <span className="text-sm font-semibold">{T.pickOwnCard}</span>
        <span className="flex flex-wrap gap-1.5">
          {RESOURCES.map((sort) => (
            <Button
              key={sort}
              label={`${SORT_NAMES[sort]} (${hand[sort]})`}
              off={hand[sort] === 0}
              strong={gift === sort}
              testId={`ct-event-gift-${sort}`}
              onClick={() => setGift(sort)}
            />
          ))}
        </span>
        <span className="text-sm font-semibold">{T.pickGiftTo}</span>
        <span className="flex flex-wrap gap-1.5">
          {poorerThan(game, mySeat).map((seat) => (
            <Button
              key={seat}
              label={game.players[seat].name}
              off={gift === null}
              testId={`ct-event-to-${seat}`}
              onClick={() => {
                if (gift !== null) {
                  onMove({ kind: "event", sort: gift, seat });
                  setGift(null);
                }
              }}
            />
          ))}
        </span>
      </div>
    );
  }
  return body;
}

/** What the dice last said. */
function Dice({ game }: { readonly game: CatanGame }): ReactElement | null {
  const dice = game.dice;
  return dice === null ? null : (
    <span
      data-testid="ct-dice"
      className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-bold tabular-nums dark:bg-zinc-700"
    >
      {T.rolled(dice[0] + dice[1], dice[0], dice[1])}
    </span>
  );
}

/**
 * The bar under the board.
 *
 * @param props - the game, which seat is looking, and where moves go
 * @returns the controls this moment needs, or nothing when there are none
 */
export function CatanActions({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement | null {
  const turn = seatOnTurn(game);
  const mine = turn === mySeat;
  const waiting = turn === null ? null : game.players[turn];
  // At the very start of somebody else's turn there is no roll to show and
  // nothing to do, and an empty white strip under the board reads as broken.
  const empty =
    !mine &&
    game.dice === null &&
    game.drawn === null &&
    game.phase !== "discard" &&
    game.phase !== "event";

  return empty ? null : (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <Dice game={game} />
        <Card game={game} />
        {sharesTurns(game) && game.phase !== "gameOver" && (
          <span
            data-testid="ct-stone"
            className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950"
          >
            {game.stone === 1 ? T.stoneOne : T.stoneTwo}
          </span>
        )}
        {game.phase === "founding" && mine && (
          <span className="text-sm font-semibold" data-testid="ct-hint">
            {game.founding?.placing === "town" ? T.placeTown : T.placeRoad}
          </span>
        )}
        {game.phase === "roll" && mine && (
          <Button
            label={game.events.length > 0 || game.drawn !== null ? T.drawCard : T.roll}
            strong
            testId="ct-roll"
            onClick={() => onMove({ kind: "roll" })}
          />
        )}
        {game.phase === "robber" && mine && (
          <span className="text-sm font-semibold" data-testid="ct-hint">
            {T.pickRobber}
          </span>
        )}
        {game.phase === "trade" && mine && (
          <>
            <span className="text-xs opacity-70" data-testid="ct-hint">
              {game.freeRoads > 0
                ? T.freeRoads(game.freeRoads)
                : game.stone === 2
                  ? T.stoneTwoHint
                  : T.buildHint}
            </span>
            {game.players[mySeat].damaged !== null && (
              <Button
                label={T.repair}
                testId="ct-repair"
                onClick={() => onMove({ kind: "repair" })}
              />
            )}
            <Button
              label={T.endTurn}
              strong
              testId="ct-end"
              onClick={() => onMove({ kind: "endTurn" })}
            />
          </>
        )}
        {/* Only the discard queue, because a seven hands the move to somebody
            who is not the player whose turn it is - which the header above does
            not say and cannot. Everything else it already says. */}
        {!mine && waiting !== null && game.phase === "event" && (
          <span className="flex items-center gap-1.5 text-sm" data-testid="ct-waiting">
            <span
              className="inline-block h-3 w-3 rounded-full border border-black/30"
              style={{ backgroundColor: COLOUR_INK[waiting.colour] }}
            />
            {T.eventWaiting(waiting.name)}
          </span>
        )}
        {!mine && waiting !== null && game.phase === "discard" && (
          <span className="flex items-center gap-1.5 text-sm" data-testid="ct-waiting">
            <span
              className="inline-block h-3 w-3 rounded-full border border-black/30"
              style={{ backgroundColor: COLOUR_INK[waiting.colour] }}
            />
            {T.discardWaiting(waiting.name)}
          </span>
        )}
      </div>
      {game.phase === "discard" && mine && (
        <Discarding game={game} mySeat={mySeat} onMove={onMove} />
      )}
      {game.phase === "event" && mine && (
        <Answering game={game} mySeat={mySeat} onMove={onMove} />
      )}
      {game.phase === "trade" && mine && game.players[mySeat].damaged !== null && (
        <span className="text-xs opacity-70" data-testid="ct-repair-hint">
          {T.repairHint}
        </span>
      )}
      {game.phase === "steal" && mine && <Stealing game={game} onMove={onMove} />}
      {(game.phase === "monopol" || game.phase === "erfindung") && mine && (
        <Naming game={game} onMove={onMove} />
      )}
    </section>
  );
}
