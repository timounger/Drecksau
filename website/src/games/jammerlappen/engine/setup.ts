/**
 * Dealing a fresh round.
 *
 * @module
 * @remarks
 * Three face down, three face up on top of them, three on the hand - in that
 * order, because that is the order the rulebook deals them and the order the
 * player will get to play them in.
 */
import { buildDeck, COPIES, TWO_PLAYER_COPIES, type Card } from "./cards";
import { createRandom, randomInt, shuffle } from "./random";
import {
  HAND_SIZE,
  MAX_PLAYERS,
  MIN_PLAYERS,
  TABLE_SLOTS,
  type JammerlappenGame,
  type Player,
} from "./state";

/** A seat at the table, before the cards are dealt. */
export type JammerlappenSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/**
 * Shuffles the deck and deals everybody in.
 *
 * @param seats - the players, in seating order
 * @param seed - the shuffle to use, so a round can be replayed exactly
 * @returns a round waiting for everybody to make their one swap
 * @remarks
 * A two-handed table gets the reduced deck the rulebook prescribes: no
 * Richtungswechsel, no Aussetzen, and three of each number instead of four.
 * That last one is not only about deck size - it is what turns every quartet
 * rule in the game into a triplet rule, which is why {@link
 * JammerlappenGame.copies} is carried in the state rather than worked out again
 * wherever it is needed.
 */
export function createGame(
  seats: readonly JammerlappenSeat[],
  seed: number,
): JammerlappenGame {
  const count = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, seats.length));
  const twoHanded = count === MIN_PLAYERS;
  const copies = twoHanded ? TWO_PLAYER_COPIES : COPIES;
  const random = createRandom(seed);
  const deck = shuffle(random, buildDeck(copies, !twoHanded));
  const players: Player[] = [];
  let at = 0;
  for (let seat = 0; seat < count; seat++) {
    const take = (many: number): Card[] => {
      const cards = deck.slice(at, at + many);
      at += many;
      return cards;
    };
    // Face down first, then the open row on top of it, then the hand - the
    // rulebook's order, and the reason slot 1 covers slot 1.
    const down = take(TABLE_SLOTS);
    const up = take(TABLE_SLOTS);
    players.push({
      name: seats[seat]?.name ?? `Spieler ${seat + 1}`,
      isBot: seats[seat]?.isBot ?? true,
      hand: take(HAND_SIZE),
      up,
      down,
      ready: false,
      place: null,
    });
  }
  // Nobody's feet can be measured through a screen, so the first round's
  // starter is drawn instead - which is what "die größten Füße" amounts to.
  const starter = randomInt(random, count);
  return {
    phase: "swap",
    players,
    active: starter,
    direction: 1,
    draw: deck.slice(at),
    pot: [],
    burned: 0,
    free: true,
    descending: false,
    copies,
    rng: random.state(),
    seed,
    log: [
      `Größte Füße, also Anwurf: ${players[starter].name}.`,
      "Jeder darf einmal eine Handkarte gegen eine offene Karte tauschen.",
    ],
  };
}

/**
 * The seats for a round against the computer.
 *
 * @param playerName - what the human seat is called
 * @param opponents - how many computer players join
 * @returns the seats, the human first
 */
export function soloSeats(
  playerName: string,
  opponents: number,
): readonly JammerlappenSeat[] {
  const names = ["Rosi", "Egon", "Trude", "Kalle", "Heidi"];
  return [
    { name: playerName, isBot: false },
    ...Array.from({ length: opponents }, (unused, at) => ({
      name: names[at % names.length],
      isBot: true,
    })),
  ];
}
