/**
 * The whole game at one instant, and who is winning it.
 *
 * @module
 * @remarks
 * Plain data, no methods: the state goes to storage and over the wire, and the
 * referee in `moves.ts` is the only thing that changes it.
 *
 * Four fields carry the awkward parts of the rulebook, and each of them is a
 * thing that **interrupts** whatever else was happening:
 *
 * - {@link MonopolyGame.auction} is a property going under the hammer, which
 *   every player takes part in whoever's turn it is.
 * - {@link MonopolyGame.debt} is somebody who owes more than they hold, and who
 *   may do nothing else until they have raised it or gone bankrupt.
 * - {@link MonopolyGame.offer} is a trade waiting to be accepted or refused.
 * - {@link MonopolyGame.drawn} is a card lying face up, waiting to be read.
 *
 * All four are separate fields rather than phases the turn overwrites, for the
 * same reason: each has to be put back afterwards.
 */
import { BOARD_SIZE, GROUPS, fieldAt, fieldsIn, isOwnable } from "./board";
import type { DeckId } from "./cards";
import { NO_TOKEN, TOKEN_COUNT, tokenOf, type Token } from "./tokens";

/** Where the turn is. */
export type Phase =
  /** Before anything else: everybody takes a playing piece. */
  | "tokens"
  /** In jail: pay, play a card, or roll for a double. */
  | "jail"
  /** Roll the dice. */
  | "roll"
  /** Landed on something unowned: buy it, or send it to auction. */
  | "decide"
  /** A property is under the hammer. */
  | "auction"
  /** Somebody owes more than they hold. */
  | "debt"
  /** Free actions - build, mortgage, trade - and then the turn ends. */
  | "manage"
  | "gameOver";

/** A player. */
export type MonopolyPlayer = {
  readonly name: string;
  readonly isBot: boolean;
  /**
   * Which of the eight pieces they play, or -1 before they have picked.
   *
   * @remarks
   * "Jeder Spieler nimmt sich eine Spielfigur und stellt sie auf LOS." A piece
   * is the thing people call each other by across a table - the dog, the ship -
   * so it is chosen rather than handed out, and it is the same choice online as
   * against the computer because it is a phase of the game rather than a
   * setting beside it.
   */
  readonly token: number;
  readonly cash: number;
  /** Where the token stands, 0 to 39. */
  readonly at: number;
  /** How many turns spent in jail, or null while at liberty. */
  readonly jailTurns: number | null;
  /** Which decks the held Get-Out-Of-Jail cards came from. */
  readonly pardons: readonly DeckId[];
  /** True once they are out of the game. */
  readonly bankrupt: boolean;
};

/** One ownable field's paperwork. */
export type Estate = {
  /** The seat that holds the deed, or -1 for the bank. */
  readonly owner: number;
  /** Houses standing on it: 0 to 4, and {@link HOTEL} for a hotel. */
  readonly houses: number;
  readonly mortgaged: boolean;
};

/** A property under the hammer. */
export type Auction = {
  /** Which field is being sold. */
  readonly at: number;
  /** The highest bid so far, or 0 before anybody has bid. */
  readonly bid: number;
  /** Who made it, or -1 if nobody has. */
  readonly leader: number;
  /** Whose turn it is to bid or pass. */
  readonly turn: number;
  /** Who has dropped out. */
  readonly out: readonly number[];
  /**
   * Why the sale is happening.
   *
   * @remarks
   * "landed" is somebody declining to buy; "bankrupt" is the estate of somebody
   * who owed the bank, which the rulebook auctions off one field at a time. The
   * difference matters only for what the log says.
   */
  readonly reason: "landed" | "bankrupt";
};

/** Somebody who owes more than they hold. */
export type Debt = {
  readonly who: number;
  /** The seat owed, or -1 for the bank. */
  readonly to: number;
  readonly amount: number;
  /** What the debt was for, for the log. */
  readonly reason: string;
  /**
   * Seats to split the amount between, instead of paying `to`.
   *
   * @remarks
   * For the one card that pays everybody at once. Without it, "zahle jedem
   * Mitspieler 50 €" would be three or four separate debts at the same time,
   * and a debt is a thing that stops the game - three of them would stop it
   * three ways.
   */
  readonly share: readonly number[];
  /**
   * Steps still to walk once it is paid, or 0.
   *
   * @remarks
   * For one case, and it is a real one: on the third failed attempt to roll out
   * of jail the rulebook says "kaufen Sie sich mit 50 € frei und ziehen Sie mit
   * Ihrem letzten Wurf heraus". Somebody who cannot find the fifty has to raise
   * it first - and then still has a throw waiting for them. Without this the
   * throw was simply lost.
   */
  readonly walk: number;
};

/** A trade waiting for an answer. */
export type Offer = {
  readonly from: number;
  readonly to: number;
  /** Fields the offerer hands over. */
  readonly give: readonly number[];
  /** Fields they want back. */
  readonly want: readonly number[];
  /** Cash from the offerer to the other, negative the other way. */
  readonly cash: number;
};

/**
 * A deed somebody has already refused to part with.
 *
 * @remarks
 * Only the computer players read these. A person may ask as often as they like
 * - re-asking with more money is half of what haggling *is*, and the referee
 * has no business forbidding it. A bot has no better second offer in it, so
 * without a memory it would put the identical deal on the table every single
 * turn until the game ended.
 */
export type Refusal = {
  /** Who asked. */
  readonly from: number;
  /** Who said no. */
  readonly to: number;
  /** The field they would not sell. */
  readonly field: number;
};

/** A card lying face up. */
export type Drawn = {
  readonly card: number;
  readonly who: number;
};

/** A move a seat can make. */
export type MonopolyMove =
  /** Throw both dice. */
  | { readonly kind: "roll" }
  /** In jail: buy your way out before rolling. */
  | { readonly kind: "payBail" }
  /** In jail: spend a Get-Out-Of-Jail card. */
  | { readonly kind: "usePardon" }
  /** Buy the field you are standing on. */
  | { readonly kind: "buy" }
  /** Decline it, which sends it to auction. */
  | { readonly kind: "decline" }
  /** Raise the bidding. */
  | { readonly kind: "bid"; readonly amount: number }
  /** Drop out of the bidding. */
  | { readonly kind: "pass" }
  /** Read the card that is lying face up. */
  | { readonly kind: "takeCard" }
  /** Put a house or a hotel on a street. */
  | { readonly kind: "build"; readonly at: number }
  /** Sell one back to the bank at half price. */
  | { readonly kind: "sell"; readonly at: number }
  /** Take the bank's loan against a field. */
  | { readonly kind: "mortgage"; readonly at: number }
  /** Pay it back, with the ten per cent. */
  | { readonly kind: "redeem"; readonly at: number }
  /** Put a trade to somebody. */
  | {
      readonly kind: "offer";
      readonly to: number;
      readonly give: readonly number[];
      readonly want: readonly number[];
      readonly cash: number;
    }
  /** Take a playing piece, before the game starts. */
  | { readonly kind: "pickToken"; readonly token: number }
  /** Take the trade on the table. */
  | { readonly kind: "accept" }
  /** Refuse it, or withdraw your own. */
  | { readonly kind: "reject" }
  /** Hand over what is owed, now that it can be paid. */
  | { readonly kind: "settle" }
  /** Give up. */
  | { readonly kind: "resign" }
  /** Stop, and let the next player roll. */
  | { readonly kind: "endTurn" };

/** The whole game. */
export type MonopolyGame = {
  readonly phase: Phase;
  readonly players: readonly MonopolyPlayer[];
  /** Whose turn it is. */
  readonly active: number;
  /** Every ownable field's paperwork, by board position. */
  readonly estates: Readonly<Record<number, Estate>>;
  /** The two dice as they lie, or an empty list before the first throw. */
  readonly dice: readonly number[];
  /** How many doubles in a row this turn. */
  readonly doubles: number;
  /** Houses still in the bank's box. */
  readonly houses: number;
  /** Hotels still in the bank's box. */
  readonly hotels: number;
  /** The Ereignis pile, top first; drawn cards go under it. */
  readonly ereignis: readonly number[];
  /** The Gemeinschaft pile, top first. */
  readonly gemeinschaft: readonly number[];
  readonly drawn: Drawn | null;
  readonly auction: Auction | null;
  readonly debt: Debt | null;
  readonly offer: Offer | null;
  /**
   * How many trades have been put on the table this turn.
   *
   * @remarks
   * The rulebook puts no limit on haggling and neither does the referee. This
   * is here for the computer players, which need a reason to stop: a bot that
   * re-proposes the deal it was just refused proposes it forever.
   */
  readonly offersThisTurn: number;
  /**
   * Trades already turned down, so a bot does not ask twice.
   *
   * @remarks
   * Optional, and staying optional: a game saved before this existed has none,
   * and it should carry on rather than be thrown away for a field that only
   * makes the opponents less annoying. Read it through {@link wasRefused},
   * which treats "missing" and "nobody has refused anything" as the same thing,
   * because they are.
   */
  readonly refused?: readonly Refusal[];
  /**
   * Fields still to go under the hammer.
   *
   * @remarks
   * A bankrupt estate that fell to the bank: "Ihre Grundstücke werden sofort
   * einzeln versteigert." One at a time, so the rest wait here.
   */
  readonly toAuction: readonly number[];
  readonly winners: readonly number[];
  readonly rng: number;
  readonly seed: number;
  readonly log: readonly string[];
};

/** Fewest players the box seats. */
export const MIN_PLAYERS = 2;

/** Most players the box seats. */
export const MAX_PLAYERS = 6;

/** What everybody starts with. */
export const START_CASH = 1500;

/** What passing LOS pays. */
export const SALARY = 200;

/** What buying your way out of jail costs. */
export const BAIL = 50;

/** How many turns you may sit in jail before paying up. */
export const JAIL_TURNS = 3;

/** How many houses a street holds before it wants a hotel. */
export const MAX_HOUSES = 4;

/** What {@link Estate.houses} says when a hotel is standing there. */
export const HOTEL = 5;

/** Houses in the box. */
export const HOUSE_SUPPLY = 32;

/** Hotels in the box. */
export const HOTEL_SUPPLY = 12;

/** What a bid opens at. */
export const OPENING_BID = 10;

/** The smallest raise. */
export const BID_STEP = 1;

/** Doubles in a row that send you to jail. */
export const DOUBLES_TO_JAIL = 3;

/** Faces on a die. */
export const DIE_FACES = 6;

/** Dice thrown. */
export const DICE_COUNT = 2;

/** What lifting a mortgage costs on top, as a fraction. */
export const MORTGAGE_INTEREST = 0.1;

/** What the bank pays back for a building, as a fraction of its price. */
export const SELL_BACK = 0.5;

/**
 * One field's paperwork.
 *
 * @param game - the game
 * @param at - the board position
 * @returns the estate, or a bank-owned blank for a field nobody can own
 */
export function estateAt(game: MonopolyGame, at: number): Estate {
  return game.estates[at] ?? { owner: -1, houses: 0, mortgaged: false };
}

/**
 * Everything one seat owns.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns their fields, in board order
 */
export function ownedBy(game: MonopolyGame, seat: number): readonly number[] {
  return Object.keys(game.estates)
    .map((key) => Number(key))
    .filter((at) => game.estates[at].owner === seat)
    .sort((left, right) => left - right);
}

/**
 * Whether one seat holds every street of a colour group.
 *
 * @param game - the game
 * @param seat - the seat
 * @param group - the group's id
 * @returns true if the whole set is theirs
 * @remarks
 * Mortgaged streets count. "Für die anderen (unbelasteten) Straßen derselben
 * Gruppe gilt aber die höhere Miete, wenn Ihnen die komplette Farbgruppe
 * gehört" - so a mortgage takes one street's rent away and leaves the set
 * intact.
 */
export function holdsGroup(
  game: MonopolyGame,
  seat: number,
  group: string,
): boolean {
  const inside = fieldsIn(group as never);
  return (
    inside.length > 0 && inside.every((at) => estateAt(game, at).owner === seat)
  );
}

/**
 * The colour groups one seat holds completely.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns the group ids
 */
export function groupsHeld(
  game: MonopolyGame,
  seat: number,
): readonly string[] {
  return GROUPS.filter((group) => holdsGroup(game, seat, group.id)).map(
    (group) => group.id,
  );
}

/**
 * How many of a kind one seat owns.
 *
 * @param game - the game
 * @param seat - the seat
 * @param kind - "station" or "utility"
 * @returns the count, mortgaged ones included
 */
export function countKind(
  game: MonopolyGame,
  seat: number,
  kind: string,
): number {
  return ownedBy(game, seat).filter((at) => fieldAt(at).kind === kind).length;
}

/**
 * How many buildings one seat has standing.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns houses and hotels, counted apart
 */
export function buildingsOf(
  game: MonopolyGame,
  seat: number,
): { readonly houses: number; readonly hotels: number } {
  let houses = 0;
  let hotels = 0;
  for (const at of ownedBy(game, seat)) {
    const on = estateAt(game, at).houses;
    if (on === HOTEL) {
      hotels += 1;
    } else {
      houses += on;
    }
  }
  return { houses, hotels };
}

/**
 * What one seat could raise if they sold and mortgaged everything.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns their cash plus what the bank would pay for the rest
 * @remarks
 * This is the number that decides bankruptcy, and it is a decision the rules
 * make for you rather than one a player gets to argue about: "Wenn Sie immer
 * noch Schulden haben, sind Sie pleite." Trading a way out is a real
 * possibility at a table and is not counted here - a debt has to be settled
 * before anything else happens, and a trade needs somebody else to agree.
 */
export function raisable(game: MonopolyGame, seat: number): number {
  let total = game.players[seat].cash;
  for (const at of ownedBy(game, seat)) {
    const estate = estateAt(game, at);
    const field = fieldAt(at);
    const buildings = estate.houses === HOTEL ? MAX_HOUSES + 1 : estate.houses;
    total += buildings * (field.houseCost ?? 0) * SELL_BACK;
    if (!estate.mortgaged) {
      total += field.mortgage ?? 0;
    }
  }
  return Math.floor(total);
}

/**
 * What one seat is worth, for the standings.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns cash, plus what the bank paid for their land and buildings
 * @remarks
 * The rulebook has no score - "wer am Ende des Spiels nicht pleite ist, hat
 * gewonnen" - so this is not one. It is what the table can see anyway, put in
 * one number so a player can tell whether they are winning.
 */
export function worthOf(game: MonopolyGame, seat: number): number {
  let total = game.players[seat].cash;
  for (const at of ownedBy(game, seat)) {
    const estate = estateAt(game, at);
    const field = fieldAt(at);
    total += estate.mortgaged ? (field.mortgage ?? 0) : (field.price ?? 0);
    const buildings = estate.houses === HOTEL ? MAX_HOUSES + 1 : estate.houses;
    total += buildings * (field.houseCost ?? 0);
  }
  return total;
}

/**
 * Which pieces nobody has taken yet.
 *
 * @param game - the game
 * @returns the free piece numbers, in box order
 */
export function freeTokens(game: MonopolyGame): readonly number[] {
  const taken = new Set(game.players.map((player) => player.token));
  return Array.from({ length: TOKEN_COUNT }, (unused, at) => at).filter(
    (at) => !taken.has(at),
  );
}

/**
 * The piece one seat plays.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns their piece, falling back to the seat's own number while the table
 *   is still choosing
 */
export function tokenFor(game: MonopolyGame, seat: number): Token {
  const chosen = game.players[seat]?.token ?? NO_TOKEN;
  return tokenOf(chosen === NO_TOKEN ? seat : chosen);
}

/**
 * The seats still in the game.
 *
 * @param game - the game
 * @returns the seat indexes
 */
export function stillIn(game: MonopolyGame): readonly number[] {
  return game.players
    .map((player, seat) => (player.bankrupt ? -1 : seat))
    .filter((seat) => seat >= 0);
}

/**
 * Whether this exact request has already been turned down.
 *
 * @param game - the game
 * @param from - who would be asking
 * @param to - who would be asked
 * @param field - the deed being asked for
 * @returns true if that seat has already said no to that seat about that deed
 * @remarks
 * A refusal holds for the rest of the game. It could be given a memory that
 * fades, and then the asking would come back - which is the thing it is there
 * to stop. Somebody who changes their mind can offer the deed themselves; the
 * panel beside the board has always been able to do that.
 */
export function wasRefused(
  game: MonopolyGame,
  from: number,
  to: number,
  field: number,
): boolean {
  return (game.refused ?? []).some(
    (no) => no.from === from && no.to === to && no.field === field,
  );
}

/**
 * The refusals a rejected offer adds.
 *
 * @param game - the game whose offer has just been turned down
 * @param offer - the offer that was refused
 * @returns the list to store, with nothing recorded twice
 * @remarks
 * One entry per deed asked for. Cash asked for records nothing: money is not a
 * thing somebody refuses to part with, it is a price, and a bot that offered
 * more next time would be haggling rather than pestering.
 */
export function withRefusal(
  game: MonopolyGame,
  offer: Offer,
): readonly Refusal[] {
  const kept = [...(game.refused ?? [])];
  for (const field of offer.want) {
    if (!wasRefused(game, offer.from, offer.to, field)) {
      kept.push({ from: offer.from, to: offer.to, field });
    }
  }
  return kept;
}

/**
 * A blank board, before anybody owns anything.
 *
 * @returns every ownable field, unowned and unbuilt
 */
export function blankEstates(): Readonly<Record<number, Estate>> {
  return Object.fromEntries(
    Array.from({ length: BOARD_SIZE }, (unused, at) => at)
      .filter(isOwnable)
      .map((at) => [at, { owner: -1, houses: 0, mortgaged: false }]),
  );
}
