/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so a round trip leaves it alone - but what comes
 * back may be from an older build, hand-edited, or simply broken. This guard is
 * the one place that decides whether to trust it.
 *
 * It checks shape, not legality. A game where somebody holds Schlossallee with
 * nine houses is not this module's problem: the referee never produced it, and
 * no move will make it worse. What it does insist on is that **every ownable
 * field is present**, because the referee indexes the board by position and a
 * missing Wasserwerk would read as `undefined` for the rest of the game.
 */
import { BOARD_SIZE, OWNABLE, isOwnable } from "./board";
import { CARDS } from "./cards";
import { NO_TOKEN, TOKEN_COUNT } from "./tokens";
import type {
  Auction,
  Debt,
  Drawn,
  Estate,
  MonopolyGame,
  MonopolyPlayer,
  Offer,
  Refusal,
} from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = [
  "tokens",
  "jail",
  "roll",
  "decide",
  "auction",
  "debt",
  "manage",
  "gameOver",
];

/** The decks a held pardon may have come from. */
const DECKS: readonly string[] = ["ereignis", "gemeinschaft"];

/** Why an auction may be running. */
const REASONS: readonly string[] = ["landed", "bankrupt"];

/**
 * Checks an unknown value really is a game of Monopoly.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isMonopolyGame(value: unknown): value is MonopolyGame {
  const game = value as MonopolyGame;
  const seats = Array.isArray(game?.players) ? game.players.length : 0;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    seats > 0 &&
    game.players.every((player) => isPlayer(player)) &&
    isSeat(game.active, seats) &&
    isEstates(game.estates, seats) &&
    isDice(game.dice) &&
    Number.isInteger(game.doubles) &&
    Number.isInteger(game.houses) &&
    Number.isInteger(game.hotels) &&
    isPile(game.ereignis) &&
    isPile(game.gemeinschaft) &&
    isDrawn(game.drawn, seats) &&
    isAuction(game.auction, seats) &&
    isDebt(game.debt, seats) &&
    isOffer(game.offer, seats) &&
    areRefusals(game.refused, seats) &&
    Number.isInteger(game.offersThisTurn) &&
    isFields(game.toAuction) &&
    Array.isArray(game.winners) &&
    game.winners.every((seat) => isSeat(seat, seats)) &&
    Number.isFinite(game.rng) &&
    Number.isFinite(game.seed) &&
    // Both came later than the first saved games, so a state without them is
    // still a state - the screen that loads it fills them in. Turning an older
    // save away would lose it.
    (game.pot === undefined || Number.isFinite(game.pot)) &&
    (game.parkingPot === undefined || typeof game.parkingPot === "boolean") &&
    (game.doubleGo === undefined || typeof game.doubleGo === "boolean") &&
    Array.isArray(game.log)
  );
}

/** Whether this is a player. */
function isPlayer(value: unknown): value is MonopolyPlayer {
  const player = value as MonopolyPlayer;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    Number.isInteger(player.token) &&
    player.token >= NO_TOKEN &&
    player.token < TOKEN_COUNT &&
    Number.isFinite(player.cash) &&
    isField(player.at) &&
    (player.jailTurns === null || Number.isInteger(player.jailTurns)) &&
    Array.isArray(player.pardons) &&
    player.pardons.every((deck) => DECKS.includes(deck)) &&
    typeof player.bankrupt === "boolean"
  );
}

/**
 * Whether the paperwork covers every field that can be owned.
 *
 * @remarks
 * All 28 of them, not merely some: the referee reads `estates[at]` for
 * positions it takes from the board module, and a game missing the Wasserwerk
 * would treat it as owned by seat `undefined` from then on.
 */
function isEstates(value: unknown, seats: number): boolean {
  const estates = value as Record<number, Estate>;
  return (
    isObject(value) &&
    OWNABLE.every((at) => {
      const estate = estates[at];
      return (
        isObject(estate) &&
        Number.isInteger(estate.owner) &&
        estate.owner >= -1 &&
        estate.owner < seats &&
        Number.isInteger(estate.houses) &&
        estate.houses >= 0 &&
        typeof estate.mortgaged === "boolean"
      );
    })
  );
}

/** Whether a card lying face up is one. */
function isDrawn(value: unknown, seats: number): value is Drawn | null {
  const drawn = value as Drawn;
  return (
    value === null ||
    (isObject(value) && isCard(drawn.card) && isSeat(drawn.who, seats))
  );
}

/** Whether a running auction makes sense. */
function isAuction(value: unknown, seats: number): value is Auction | null {
  const running = value as Auction;
  return (
    value === null ||
    (isObject(value) &&
      isField(running.at) &&
      isOwnable(running.at) &&
      Number.isFinite(running.bid) &&
      Number.isInteger(running.leader) &&
      running.leader >= -1 &&
      running.leader < seats &&
      isSeat(running.turn, seats) &&
      Array.isArray(running.out) &&
      running.out.every((seat) => isSeat(seat, seats)) &&
      REASONS.includes(running.reason))
  );
}

/** Whether an open debt makes sense. */
function isDebt(value: unknown, seats: number): value is Debt | null {
  const owing = value as Debt;
  return (
    value === null ||
    (isObject(value) &&
      isSeat(owing.who, seats) &&
      Number.isInteger(owing.to) &&
      owing.to >= -1 &&
      owing.to < seats &&
      Number.isFinite(owing.amount) &&
      typeof owing.reason === "string" &&
      Array.isArray(owing.share) &&
      owing.share.every((seat) => isSeat(seat, seats)))
  );
}

/** Whether a trade on the table makes sense. */
function isOffer(value: unknown, seats: number): value is Offer | null {
  const deal = value as Offer;
  return (
    value === null ||
    (isObject(value) &&
      isSeat(deal.from, seats) &&
      isSeat(deal.to, seats) &&
      isFields(deal.give) &&
      isFields(deal.want) &&
      Number.isFinite(deal.cash))
  );
}

/**
 * Whether the remembered refusals are refusals.
 *
 * @remarks
 * Missing passes. The field arrived after games were already being saved, and a
 * stored game without it is not broken - it is simply one in which nobody has
 * refused anything yet. Throwing such a game away over it would cost the player
 * their evening to spare them a repeated offer.
 */
function areRefusals(value: unknown, seats: number): boolean {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.every((entry) => {
        const no = entry as Refusal;
        return (
          isObject(entry) &&
          isSeat(no.from, seats) &&
          isSeat(no.to, seats) &&
          isField(no.field)
        );
      }))
  );
}

/** Whether this is a pile of card indexes. */
function isPile(value: unknown): boolean {
  return Array.isArray(value) && value.every(isCard);
}

/** Whether this is a card index. */
function isCard(value: unknown): boolean {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < CARDS.length
  );
}

/** Whether this is a list of board positions. */
function isFields(value: unknown): boolean {
  return Array.isArray(value) && value.every(isField);
}

/** Whether this is a board position. */
function isField(value: unknown): boolean {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < BOARD_SIZE
  );
}

/** Whether these are dice. */
function isDice(value: unknown): boolean {
  return Array.isArray(value) && value.every((die) => Number.isInteger(die));
}

/** Whether this is a seat number at this table. */
function isSeat(value: unknown, seats: number): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < seats
  );
}

/** Whether this is an object at all. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
