/**
 * Dealing a table and a round.
 *
 * @module
 * @remarks
 * The whole pack is dealt, all thirty-two of it. Only at four does it divide
 * evenly; everywhere else there are cards over, and they go to **the middle
 * seat** - the Buerger, the one the round before put in the middle - who then
 * puts as many away again before play starts. Two cards looked at and the two
 * worst gone: a small consolation for the seat that won nothing and lost
 * nothing.
 */
import { createDeck, sortHand, type Card } from "./cards";
import { createRandom, randomInt } from "./random";
import {
  MIN_PLAYERS,
  givesTo,
  owesCards,
  seatWith,
  titleFor,
  wishableIds,
  type ArschlochGame,
  type ArschlochPlayer,
  type Handover,
  type Title,
} from "./state";

/** A seat as the table hands it in. */
export type ArschlochSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/**
 * The pack a round is dealt from.
 *
 * @returns all thirty-two cards
 * @remarks
 * Kept as a function because the referee counts against it - see `beatable` -
 * and because it once returned something smaller. What is dealt unevenly is
 * dealt anyway: {@link dealRound} hands the leftovers to the middle seat.
 */
export function packFor(): readonly Card[] {
  return createDeck();
}

/**
 * The seat that is dealt the leftovers of an uneven pack.
 *
 * @param players - the seats, with the titles of the round before
 * @returns the middle seat
 * @remarks
 * The Buerger, and if the table has two of them the first. In the very first
 * round nobody holds a title yet, and then the middle chair does: it is a seat
 * everybody can point at, which is what "the middle player" means before there
 * is a ranking.
 */
export function middleSeat(players: readonly ArschlochPlayer[]): number {
  const buerger = players.findIndex((player) => player.title === "buerger");
  return buerger >= 0 ? buerger : Math.floor(players.length / 2);
}

/**
 * Shuffles and deals a fresh round into an existing table.
 *
 * @param game - the game, with the titles of the round before
 * @returns the game with everybody holding cards again
 * @remarks
 * The Arschloch leads the first trick of every round after the first: "Das
 * Arschloch beginnt die naechste Runde." In the very first round nobody has a
 * title yet, and then the lowest card in the pack decides - whoever holds it
 * starts, which is a rule a table can check rather than a seat the program
 * picked.
 */
export function dealRound(game: ArschlochGame): ArschlochGame {
  const random = createRandom(game.rng);
  const pack = [...packFor()];
  for (let at = pack.length - 1; at > 0; at -= 1) {
    const other = randomInt(random, at + 1);
    [pack[at], pack[other]] = [pack[other], pack[at]];
  }
  const each = Math.floor(pack.length / game.players.length);
  const over = pack.length - each * game.players.length;
  const middle = middleSeat(game.players);
  const players = game.players.map((player, seat) => ({
    ...player,
    hand: sortHand([
      ...pack.slice(seat * each, seat * each + each),
      // The cards that do not divide, all to one seat.
      ...(seat === middle ? pack.slice(pack.length - over) : []),
    ]),
    passed: false,
  }));
  const arsch = players.findIndex((player) => player.title === "arschloch");
  return {
    ...game,
    players,
    active: arsch >= 0 ? arsch : startsFirstRound(players),
    pile: [],
    seen: [],
    lead: null,
    out: [],
    owed: [],
    rng: random.state(),
    log: [
      ...game.log,
      `Runde ${game.round}: je ${each} Karten${
        over === 0
          ? ""
          : ` (${players[middle].name} bekommt ${over} übrige und legt ${over} ab)`
      }.`,
    ],
  };
}

/**
 * Who starts the very first round.
 *
 * @param players - the seats, already holding their cards
 * @returns the seat holding the weakest card in the pack
 * @remarks
 * The lowest card of all, and with it the seat that would otherwise have the
 * least to say. Every later round is opened by the Arschloch instead.
 */
function startsFirstRound(players: readonly ArschlochPlayer[]): number {
  let best = 0;
  let lowest = Number.POSITIVE_INFINITY;
  players.forEach((player, seat) => {
    const first = player.hand[0];
    const rank = first === undefined ? Number.POSITIVE_INFINITY : rankOf(first);
    if (rank < lowest) {
      lowest = rank;
      best = seat;
    }
  });
  return best;
}

/** A card as one number, so two hands can be compared card for card. */
function rankOf(card: Card): number {
  return createDeck().findIndex((each) => each.id === card.id);
}

/**
 * A fresh game.
 *
 * @param seats - who is playing
 * @param seed - what the shuffle starts from
 * @param rounds - how many rounds the game runs for
 * @returns the game, dealt and waiting for the first card
 */
export function createGame(
  seats: readonly ArschlochSeat[],
  seed: number,
  rounds: number,
): ArschlochGame {
  const players: ArschlochPlayer[] = seats.map((seat) => ({
    name: seat.name,
    isBot: seat.isBot,
    hand: [],
    title: null,
    score: 0,
    passed: false,
  }));
  const empty: ArschlochGame = {
    phase: "playing",
    players,
    active: 0,
    pile: [],
    seen: [],
    lead: null,
    out: [],
    round: 1,
    rounds,
    owed: [],
    winners: [],
    rng: seed,
    seed,
    log: [],
  };
  return openRound(empty);
}

/** The titles that owe cards, worst first. */
const LOW_TITLES: readonly Title[] = ["arschloch", "vizearsch"];

/**
 * Works out what has to happen before the cards are played.
 *
 * @param game - a freshly dealt round
 * @returns the game waiting for the first of those steps, or playing at once
 * @remarks
 * Three kinds of step, in the order a table would do them: the middle seat puts
 * the leftovers of the deal away, then the Praesident wishes two cards out of
 * the loser hand and hands two back, then the Vizepraesident does the same with
 * one. The first round has no titles yet, so there only the leftovers happen.
 */
export function openRound(before: ArschlochGame): ArschlochGame {
  const game = dealRound(before);
  const owed: Handover[] = [...dropStep(game)];
  for (const title of LOW_TITLES) {
    owed.push(...wishSteps(game, title));
  }
  return { ...game, owed, phase: owed.length > 0 ? "passing" : "playing" };
}

/** The leftovers of an uneven deal, if there are any. */
function dropStep(game: ArschlochGame): readonly Handover[] {
  const seats = game.players.length;
  const each = Math.floor(packFor().length / seats);
  const middle = game.players.findIndex((player) => player.hand.length > each);
  return middle < 0
    ? []
    : [
        {
          kind: "drop",
          from: middle,
          to: middle,
          count: game.players[middle].hand.length - each,
        },
      ];
}

/**
 * The wish and the handover one title owes the other.
 *
 * @remarks
 * Nothing is owed when the loser holds nothing that may be wished for - three
 * of a rank are safe, and a hand that is nothing but such sets cannot be asked
 * for anything. The handover falls away with it: what goes back is the price of
 * what came, and nothing came.
 */
function wishSteps(game: ArschlochGame, title: Title): readonly Handover[] {
  const loser = seatWith(game, title);
  const winnerTitle = givesTo(title);
  const winner = winnerTitle === null ? null : seatWith(game, winnerTitle);
  const wanted = owesCards(title);
  const may = loser === null ? 0 : wishableIds(game, loser).length;
  const count = Math.min(wanted, may);
  return loser === null || winner === null || count === 0
    ? []
    : [
        { kind: "wish", from: winner, to: loser, count },
        { kind: "give", from: winner, to: loser, count },
      ];
}

/**
 * Seats for a game against the computer.
 *
 * @param human - what the player is called
 * @param bots - how many computer players sit down
 * @returns the seats, the human first
 */
export function soloSeats(
  human: string,
  bots: number,
): readonly ArschlochSeat[] {
  const names = ["Bea", "Cem", "Dana", "Erik", "Finn"];
  return [
    { name: human, isBot: false },
    ...Array.from(
      { length: Math.max(bots, MIN_PLAYERS - 1) },
      (unused, at) => ({
        name: names[at % names.length],
        isBot: true,
      }),
    ).slice(0, bots),
  ];
}

/** The title a place carries, re-exported so the referee reads it from here. */
export { titleFor };
