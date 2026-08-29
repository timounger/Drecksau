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
  canShiftBarbarian,
  discardCount,
  neutralSpots,
  seatOnTurn,
} from "@/games/catan/engine/moves";
import { raiding } from "@/games/catan/engine/barbaren";
import {
  atFort,
  corsairs,
  fortOf,
  warshipsOf,
} from "@/games/catan/engine/seefahrer";
import {
  SWAP_CARDS,
  canHandKnightIn,
  chipCost,
  neutralSeats,
} from "@/games/catan/engine/two";
import {
  COMMODITIES,
  COMMODITY_NAMES,
  KNIGHT_NAMES,
} from "@/games/catan/engine/knights";
import {
  PROGRESS_NAMES,
  PROGRESS_TEXTS,
  isPointCard,
  isRealCard,
  type Progress,
} from "@/games/catan/engine/progress";
import {
  ACTIVATE_COST,
  KNIGHT_COST,
  WALL_COST,
  canChase,
  canUpgrade,
  canWall,
  knightReady,
  marchSpots,
} from "@/games/catan/engine/ritter";
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
  covers,
  handSize,
  playingRitter,
  playingTwo,
  realSeats,
  sharesTurns,
  withCard,
  type CatanGame,
  type CatanMove,
  type Hand,
  type Resource,
} from "@/games/catan/engine/state";
import {
  BOAT_COST,
  canCast,
  chaseRolls,
  chasers,
  goldSales,
  movesLeft,
} from "@/games/catan/engine/entdecker";
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
  const asking =
    game.phase === "monopol" ? T.pickMonopol : T.pickGift(game.gifts);
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="ct-name-sort"
    >
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
      <div
        className="flex flex-wrap items-center gap-2"
        data-testid="ct-event-sort"
      >
        <span className="text-sm font-semibold">
          {own ? T.pickOwnCard : T.pickFreeCard}
        </span>
        {RESOURCES.map((sort) => (
          <Button
            key={sort}
            label={
              own ? `${SORT_NAMES[sort]} (${hand[sort]})` : SORT_NAMES[sort]
            }
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
      <div
        className="flex flex-wrap items-center gap-2"
        data-testid="ct-event-victim"
      >
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

/**
 * *CATAN für Zwei*: which neutral colour the free piece goes in.
 *
 * @remarks
 * The colour is picked here and the **place** on the board, in that order, and
 * not the other way round. A neutral settlement may go on any free crossing the
 * distance rule allows - the same set of crossings for both colours - so a tap
 * alone could never say which colour was meant.
 *
 * It is also the more interesting half of the decision: the neutral colours can
 * take the Längste Handelsroute, so feeding one of them is a way of taking it
 * off the other player.
 */
function NeutralPick({
  game,
  chosen,
  onChoose,
}: {
  readonly game: CatanGame;
  readonly chosen: number | null;
  readonly onChoose?: (seat: number) => void;
}): ReactElement {
  const kind = game.neutralBuild === "road" ? T.neutralRoad : T.neutralTown;
  const colours = neutralSeats(game).filter((seat) =>
    neutralSpots(game, game.neutralBuild ?? "town").some(
      (spot) => spot.seat === seat,
    ),
  );
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="ct-neutral">
      <span className="text-sm font-semibold">{T.neutralHint(kind)}</span>
      {colours.map((seat) => (
        <button
          key={seat}
          type="button"
          data-testid={`ct-neutral-${seat}`}
          onClick={() => onChoose?.(seat)}
          className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold ${
            seat === chosen
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          <span
            className="inline-block h-3 w-3 rounded-full border border-black/30"
            style={{ backgroundColor: COLOUR_INK[game.players[seat].colour] }}
          />
          {game.players[seat].name}
        </button>
      ))}
    </div>
  );
}

/**
 * *CATAN für Zwei*: the two Handelschip actions.
 *
 * @remarks
 * Shown with their price, because the price is the rule people forget: one chip
 * while you are level or behind and **two** while you are ahead. A button that
 * quietly costs double is worse than one that says so.
 */
function ChipActions({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement | null {
  const price = chipCost(game, mySeat);
  const held = game.players[mySeat].chips;
  return !playingTwo(game) ? null : (
    <span
      className="flex flex-wrap items-center gap-1.5"
      data-testid="ct-chips"
    >
      <span className="text-xs font-semibold">{T.chipsHeld(held)}</span>
      <Button
        label={T.chipSwap(price)}
        testId="ct-chip-swap"
        off={held < price}
        onClick={() => onMove({ kind: "chip", action: "swap" })}
      />
      {raiding(game) ? (
        <Button
          label={T.chipBarbarian(price)}
          testId="ct-chip-barbarian"
          off={held < price || !canShiftBarbarian(game)}
          onClick={() => onMove({ kind: "chip", action: "barbarian" })}
        />
      ) : (
        <Button
          label={T.chipRobber(price)}
          testId="ct-chip-robber"
          off={held < price}
          onClick={() => onMove({ kind: "chip", action: "robber" })}
        />
      )}
      {canHandKnightIn(game, mySeat) && (
        <Button
          label={T.knightIn}
          testId="ct-knight-in"
          onClick={() => onMove({ kind: "knightIn" })}
        />
      )}
    </span>
  );
}

/**
 * *CATAN für Zwei*: choosing the two cards a Zwangshandel hands back.
 *
 * @remarks
 * The same picker the discard after a seven uses, for the same reason - it is
 * the same decision, only smaller.
 */
function GivingBack({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement {
  const [picked, setPicked] = useState<Hand>(NO_CARDS);
  const owed = Math.min(SWAP_CARDS, handSize(game.players[mySeat].hand));
  return (
    <div className="flex flex-col gap-2" data-testid="ct-giveback">
      <span className="text-sm font-semibold">{T.giveBackHint(owed)}</span>
      <CardPicker
        hand={game.players[mySeat].hand}
        limit={game.players[mySeat].hand}
        onChange={setPicked}
        testId="ct-giveback-pick"
      />
      <Button
        label={T.giveBack}
        strong
        testId="ct-giveback-send"
        off={handSize(picked) !== owed}
        onClick={() => onMove({ kind: "giveBack", cards: picked })}
      />
    </div>
  );
}

/**
 * *Städte & Ritter*: the things you do with knights and walls.
 *
 * @remarks
 * Beside the board rather than on it, because each of these is about a knight
 * you already have: waking it, raising it, sending it somewhere. Only the
 * **placing** of a new knight is a tap on the board, since that is the one that
 * is really about a crossing.
 */
function RitterActions({
  game,
  mySeat,
  onMove,
  marching,
  onMarch,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
  readonly marching: number | null;
  readonly onMarch?: (at: number | null) => void;
}): ReactElement | null {
  const mine = game.garrison
    .map((knight, at) => (knight?.owner === mySeat ? at : -1))
    .filter((at) => at >= 0);
  const hand = game.players[mySeat].hand;
  return !playingRitter(game) ? null : (
    <span
      className="flex flex-wrap items-center gap-1.5"
      data-testid="ct-ritter"
    >
      {canWall(game, mySeat) && (
        <Button
          label={T.buildWall}
          testId="ct-wall"
          off={!covers(hand, WALL_COST)}
          onClick={() => onMove({ kind: "wall" })}
        />
      )}
      {mine.map((at) => (
        <KnightButtons
          key={at}
          game={game}
          mySeat={mySeat}
          at={at}
          picked={marching === at}
          onMove={onMove}
          onMarch={onMarch}
        />
      ))}
    </span>
  );
}

/** What can be done with one knight, right now. */
function KnightButtons({
  game,
  mySeat,
  at,
  picked,
  onMove,
  onMarch,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly at: number;
  readonly picked: boolean;
  readonly onMove: (move: CatanMove) => void;
  readonly onMarch?: (at: number | null) => void;
}): ReactElement | null {
  const knight = game.garrison[at];
  const hand = game.players[mySeat].hand;
  const ready = knightReady(game, at);
  return knight === null ? null : (
    <span
      data-testid={`ct-knight-actions-${at}`}
      className={`flex items-center gap-1 rounded-lg border px-1.5 py-0.5 ${
        picked
          ? "border-zinc-900 dark:border-zinc-100"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <span
        className="text-[10px] font-bold"
        title={KNIGHT_NAMES[knight.level - 1]}
      >
        {"❰".repeat(knight.level)}
      </span>
      {!knight.active && covers(hand, ACTIVATE_COST) && (
        <Button
          label={T.wakeKnight}
          testId={`ct-activate-${at}`}
          onClick={() => onMove({ kind: "activate", at })}
        />
      )}
      {canUpgrade(game, mySeat, at) && covers(hand, KNIGHT_COST) && (
        <Button
          label={T.raiseKnight}
          testId={`ct-upgrade-${at}`}
          onClick={() => onMove({ kind: "upgrade", at })}
        />
      )}
      {canChase(game, at) && (
        <Button
          label={T.chaseRobber}
          testId={`ct-chase-${at}`}
          onClick={() => onMove({ kind: "chase", at })}
        />
      )}
      {ready && marchSpots(game, at).length > 0 && (
        <Button
          label={picked ? T.marchCancel : T.marchKnight}
          testId={`ct-march-${at}`}
          onClick={() => onMarch?.(picked ? null : at)}
        />
      )}
    </span>
  );
}

/**
 * *Städte & Ritter*: what a Fortschrittskarte is waiting to be told.
 *
 * @remarks
 * One panel for sixteen cards, the way the referee has one phase for them. What
 * it shows is decided by {@link CatanGame.playing} - the card on the table
 * knows what it asked - and the cards whose answer is a **place** say so and
 * leave the tapping to the board.
 */
function CardAsking({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement | null {
  const card = game.playing;
  const others = realSeats(game).filter((at) => at !== mySeat);
  return card === null ? null : (
    <div className="flex flex-col gap-2" data-testid="ct-asking">
      <span className="text-sm font-semibold">
        {PROGRESS_NAMES[card]}: {PROGRESS_TEXTS[card]}
      </span>
      {card === "rohstoffmonopol" && (
        <span className="flex flex-wrap gap-1.5">
          {RESOURCES.map((sort) => (
            <Button
              key={sort}
              label={SORT_NAMES[sort]}
              testId={`ct-ask-${sort}`}
              onClick={() => onMove({ kind: "answerCard", sort })}
            />
          ))}
        </span>
      )}
      {(card === "warenmonopol" || card === "handelsflotte") && (
        <span className="flex flex-wrap gap-1.5">
          {COMMODITIES.map((good) => (
            <Button
              key={good}
              label={COMMODITY_NAMES[good]}
              testId={`ct-ask-${good}`}
              onClick={() => onMove({ kind: "answerCard", good })}
            />
          ))}
          {card === "handelsflotte" &&
            RESOURCES.map((sort) => (
              <Button
                key={sort}
                label={SORT_NAMES[sort]}
                testId={`ct-ask-${sort}`}
                onClick={() => onMove({ kind: "answerCard", sort })}
              />
            ))}
        </span>
      )}
      {card === "spionage" && (
        <span className="flex flex-wrap gap-1.5">
          {/* Online the real cards travel down the private channel of whoever
              plays the card - see CatanHand.spied - so these are the cards
              themselves and can be picked. The face-down fallback stays for the
              moment before that message has arrived: a back is shown as a back
              rather than as a card that was never there. */}
          {others.flatMap((at) =>
            game.players[at].progress
              .filter((each) => !isPointCard(each))
              .map((each, index) =>
                isRealCard(each) ? (
                  <Button
                    key={`${at}-${each}-${index}`}
                    label={`${game.players[at].name}: ${PROGRESS_NAMES[each]}`}
                    testId={`ct-ask-spy-${at}`}
                    onClick={() =>
                      onMove({ kind: "answerCard", seat: at, card: each })
                    }
                  />
                ) : (
                  <span
                    key={`${at}-back-${index}`}
                    className="rounded-lg border border-dashed border-zinc-400 px-2 py-1 text-xs opacity-60 dark:border-zinc-600"
                  >
                    {game.players[at].name}: {T.faceDownCard}
                  </span>
                ),
              ),
          )}
        </span>
      )}
      {card === "verrat" && (
        <span className="flex flex-wrap gap-1.5">
          {game.garrison
            .map((knight, at) => ({ knight, at }))
            .filter(({ knight }) => knight !== null && knight.owner !== mySeat)
            .map(({ knight, at }) => (
              <Button
                key={at}
                label={`${game.players[knight?.owner ?? 0].name}: ${"❰".repeat(knight?.level ?? 1)}`}
                testId={`ct-ask-verrat-${at}`}
                onClick={() =>
                  onMove({ kind: "answerCard", at, seat: knight?.owner })
                }
              />
            ))}
        </span>
      )}
      {ASKS_FOR_PLACE.includes(card) && (
        <span className="text-xs opacity-70">{T.tapTheBoard}</span>
      )}
    </div>
  );
}

/**
 * The cards whose answer is a place on the board rather than a button.
 *
 * @remarks
 * Listed rather than worked out, because the list is short and the alternative
 * - inferring it from what the card does - would be a second copy of the rules.
 */
const ASKS_FOR_PLACE: readonly Progress[] = [
  "haendler",
  "medizin",
  "schmiedekunst",
  "diplomatie",
  "intrige",
  "erfindung",
];

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
  neutralColour = null,
  onNeutralColour,
  marching = null,
  onMarch,
  riding = null,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
  /** *CATAN für Zwei*: which neutral colour the free piece goes in. */
  readonly neutralColour?: number | null;
  readonly onNeutralColour?: (seat: number) => void;
  /** *Städte & Ritter*: the crossing of the knight picked to be marched. */
  readonly marching?: number | null;
  /** *Der Barbarenüberfall*: the knight picked to ride, if one is. */
  readonly riding?: number | null;
  readonly onMarch?: (at: number | null) => void;
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
    game.phase !== "event" &&
    game.phase !== "neutral" &&
    game.phase !== "swap" &&
    game.phase !== "displaced" &&
    game.phase !== "posting" &&
    game.phase !== "barbarians" &&
    game.phase !== "knights" &&
    game.phase !== "driving" &&
    game.phase !== "shifting" &&
    game.phase !== "sailing" &&
    game.phase !== "corsair" &&
    game.phase !== "pirate" &&
    game.phase !== "goldPick" &&
    game.phase !== "progress";

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
            label={
              game.events.length > 0 || game.drawn !== null
                ? T.drawCard
                : T.roll
            }
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
        {(game.phase === "roll" || game.phase === "trade") && mine && (
          <ChipActions game={game} mySeat={mySeat} onMove={onMove} />
        )}
        {game.phase === "trade" && mine && (
          <RitterActions
            game={game}
            mySeat={mySeat}
            onMove={onMove}
            marching={marching}
            onMarch={onMarch}
          />
        )}
        {game.phase === "displaced" && mine && (
          <span className="text-sm font-semibold" data-testid="ct-hint">
            {T.retreatHint}
          </span>
        )}
        {game.phase === "corsair" && mine && (
          <span className="text-sm font-semibold" data-testid="ct-hint">
            {T.corsairHint}
          </span>
        )}
        {mine &&
          game.phase === "trade" &&
          game.sold < goldSales(game, mySeat) &&
          RESOURCES.filter((sort) => game.players[mySeat].hand[sort] > 0).map(
            (sort) => (
              <Button
                key={`sell-${sort}`}
                label={T.sellSpice(SORT_NAMES[sort])}
                testId={`ct-sell-${sort}`}
                onClick={() => onMove({ kind: "sell", sort })}
              />
            ),
          )}
        {mine &&
          game.phase === "trade" &&
          game.players[mySeat].boatsLeft === 0 &&
          covers(game.players[mySeat].hand, BOAT_COST) &&
          game.boats.map((boat, which) =>
            boat.owner !== mySeat ? null : (
              <Button
                key={`recall-${which}`}
                label={T.recallBoat(boat.hold.length > 0)}
                testId={`ct-recall-${which}`}
                onClick={() => onMove({ kind: "recall", boat: which })}
              />
            ),
          )}
        {mine &&
          (game.phase === "trade" || game.phase === "sailing") &&
          game.boats.flatMap((boat, which) =>
            boat.owner !== mySeat
              ? []
              : [...new Set(boat.hold)].map((cargo) => (
                  <Button
                    key={`unload-${which}-${cargo}`}
                    label={T.unloadCargo(T.cargoName(cargo))}
                    testId={`ct-unload-${which}-${cargo}`}
                    onClick={() =>
                      onMove({ kind: "unload", boat: which, cargo })
                    }
                  />
                )),
          )}
        {mine &&
          game.phase === "trade" &&
          corsairs(game) &&
          !game.stormed &&
          atFort(game, mySeat) &&
          fortOf(game, mySeat) !== null && (
            <Button
              label={T.assaultFort(warshipsOf(game, mySeat))}
              testId="ct-assault"
              onClick={() => onMove({ kind: "assault" })}
            />
          )}
        {canCast(game) && mine && (
          <Button
            label={T.castFish}
            testId="ct-cast"
            onClick={() => onMove({ kind: "cast" })}
          />
        )}
        {game.phase === "sailing" &&
          mine &&
          chasers(game, mySeat).map((which) => (
            <Button
              key={`hunt-${which}`}
              label={T.huntPirate(
                [...chaseRolls(game, mySeat)]
                  .sort((one, other) => one - other)
                  .join(", "),
              )}
              testId={`ct-hunt-${which}`}
              onClick={() => onMove({ kind: "hunt", boat: which })}
            />
          ))}
        {game.phase === "sailing" && mine && (
          <>
            <span className="text-sm font-semibold" data-testid="ct-hint">
              {game.sailing === null
                ? T.findHelm
                : T.findSail(movesLeft(game, game.boats[game.sailing]))}
            </span>
            {game.sailing !== null && (
              <Button
                label={T.findWind}
                testId="ct-wind"
                off={
                  game.boats[game.sailing].boosted ||
                  game.players[mySeat].hand.wolle === 0
                }
                onClick={() => onMove({ kind: "wind" })}
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
        {game.phase === "pirate" && mine && (
          <span className="text-sm font-semibold" data-testid="ct-hint">
            {T.pirateHint}
          </span>
        )}
        {game.phase === "goldPick" && mine && (
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="ct-gold-pick"
          >
            <span className="text-sm font-semibold" data-testid="ct-hint">
              {T.goldPickHint}
            </span>
            {RESOURCES.map((sort: Resource) => (
              <Button
                key={sort}
                label={SORT_NAMES[sort]}
                testId={`ct-goldsort-${sort}`}
                onClick={() => onMove({ kind: "gold", sort })}
              />
            ))}
          </div>
        )}
        {game.phase === "driving" && mine && (
          <>
            <span className="text-sm font-semibold" data-testid="ct-hint">
              {T.driveHint}
            </span>
            <Button
              label={T.endTurn}
              strong
              testId="ct-end"
              onClick={() => onMove({ kind: "endTurn" })}
            />
          </>
        )}
        {game.phase === "shifting" && mine && (
          <span className="text-sm font-semibold" data-testid="ct-hint">
            {T.shiftHint}
          </span>
        )}
        {game.phase === "posting" && mine && (
          <span className="text-sm font-semibold" data-testid="ct-hint">
            {game.posting === "castle" ? T.postCastle : T.postAnywhere}
          </span>
        )}
        {game.phase === "barbarians" && mine && (
          <span className="text-sm font-semibold" data-testid="ct-hint">
            {game.barbTake > 0
              ? T.barbTake(game.barbTake)
              : T.barbPut(game.barbPut)}
          </span>
        )}
        {game.phase === "knights" && mine && (
          <>
            <span className="text-sm font-semibold" data-testid="ct-hint">
              {riding === null ? T.rideHint : T.rideTo}
            </span>
            <Button
              label={T.endTurn}
              strong
              testId="ct-end"
              onClick={() => onMove({ kind: "endTurn" })}
            />
          </>
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
          <span
            className="flex items-center gap-1.5 text-sm"
            data-testid="ct-waiting"
          >
            <span
              className="inline-block h-3 w-3 rounded-full border border-black/30"
              style={{ backgroundColor: COLOUR_INK[waiting.colour] }}
            />
            {T.eventWaiting(waiting.name)}
          </span>
        )}
        {!mine && waiting !== null && game.phase === "discard" && (
          <span
            className="flex items-center gap-1.5 text-sm"
            data-testid="ct-waiting"
          >
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
      {game.phase === "trade" &&
        mine &&
        game.players[mySeat].damaged !== null && (
          <span className="text-xs opacity-70" data-testid="ct-repair-hint">
            {T.repairHint}
          </span>
        )}
      {game.phase === "neutral" && mine && (
        <NeutralPick
          game={game}
          chosen={neutralColour}
          onChoose={onNeutralColour}
        />
      )}
      {game.phase === "swap" && mine && (
        <GivingBack game={game} mySeat={mySeat} onMove={onMove} />
      )}
      {game.phase === "progress" && mine && (
        <CardAsking game={game} mySeat={mySeat} onMove={onMove} />
      )}
      {game.phase === "steal" && mine && (
        <Stealing game={game} onMove={onMove} />
      )}
      {(game.phase === "monopol" || game.phase === "erfindung") && mine && (
        <Naming game={game} onMove={onMove} />
      )}
    </section>
  );
}
