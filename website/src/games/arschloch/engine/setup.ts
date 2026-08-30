/**
 * Dealing a table and a round.
 *
 * @module
 * @remarks
 * "Die Kartenanzahl muss ein Vielfaches der Spieleranzahl sein" - a Skat pack
 * divides evenly among four and among nobody else at this table, so for three,
 * five and six the two weakest cards stay in the box. Which two is written
 * down rather than picked at random: a player who counts the Siebenen should
 * find the same two missing every time.
 */
import { DECK_SIZE, createDeck, sortHand, type Card } from "./cards";
import { createRandom, randomInt } from "./random";
import {
  MIN_PLAYERS,
  titleFor,
  type ArschlochGame,
  type ArschlochPlayer,
} from "./state";

/** A seat as the table hands it in. */
export type ArschlochSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/** The cards that stay in the box when the pack does not divide evenly. */
const SET_ASIDE: readonly string[] = ["karo-sieben", "herz-sieben"];

/**
 * The pack this many players are dealt from.
 *
 * @param seats - how many are playing
 * @returns the cards in play, all thirty-two or the thirty that divide
 */
export function packFor(seats: number): readonly Card[] {
  const full = createDeck();
  return DECK_SIZE % seats === 0
    ? full
    : full.filter((card) => !SET_ASIDE.includes(card.id));
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
  const pack = [...packFor(game.players.length)];
  for (let at = pack.length - 1; at > 0; at -= 1) {
    const other = randomInt(random, at + 1);
    [pack[at], pack[other]] = [pack[other], pack[at]];
  }
  const each = pack.length / game.players.length;
  const players = game.players.map((player, seat) => ({
    ...player,
    hand: sortHand(pack.slice(seat * each, seat * each + each)),
    passed: false,
  }));
  const arsch = players.findIndex((player) => player.title === "arschloch");
  return {
    ...game,
    players,
    active: arsch >= 0 ? arsch : startsFirstRound(players),
    pile: [],
    lead: null,
    out: [],
    owed: [],
    rng: random.state(),
    log: [
      ...game.log,
      `Runde ${game.round}: je ${each} Karten${
        pack.length === DECK_SIZE ? "" : " (zwei Siebenen bleiben im Karton)"
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
  return dealRound(empty);
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
