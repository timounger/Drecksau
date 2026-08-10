/**
 * Dealing a game of "Das politische Talent".
 *
 * @module
 * @remarks
 * Follows the preparation from the rule book in order: orientation cards, the
 * matching election promises, the opposition cards, the first two candidates
 * and the theme that is turned up. Scandals are only drawn once a candidate has
 * actually been chosen - they accompany that candidate, not the party.
 */
import {
  OPPOSITION_CARDS,
  PROMISES,
  CANDIDATES,
  SCANDALS,
  THEMES,
  orientationsFor,
  type Theme,
} from "./cards";
import { createRandom, shuffle } from "./random";
import {
  CANDIDATE_OFFER,
  OPPOSITION_PER_PLAYER,
  PARTY_COLORS,
  PROMISES_PER_THEME,
  START_SEATS,
  type PolitikGame,
  type Player,
} from "./state";

/** A seat to deal in. */
export type PolitikSeat = {
  readonly name: string;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
};

/** The smallest table the seat table knows, as the fallback for a bad count. */
const MIN_SUPPORTED = 3;

/** The computer players' names, in the order they join. */
const BOT_NAMES: readonly string[] = [
  "Berta",
  "Cornelius",
  "Dorothea",
  "Egon",
  "Franziska",
];

/**
 * Deals a fresh game.
 *
 * @param seats - the parties, in turn order (three to six)
 * @param seed - the seed the whole game's randomness runs from
 * @returns a game waiting for the first player to pick a candidate
 */
export function createGame(
  seats: readonly PolitikSeat[],
  seed: number,
): PolitikGame {
  const random = createRandom(seed);
  const count = seats.length;
  const orientations = shuffle(random, orientationsFor(count)).slice(0, count);
  const promisePool = shuffle(random, PROMISES);
  const opposition = shuffle(
    random,
    OPPOSITION_CARDS.map((card) => card.id),
  );
  const candidateDeck = shuffle(
    random,
    CANDIDATES.map((card) => card.id),
  );
  const scandalDeck = shuffle(
    random,
    SCANDALS.map((card) => card.id),
  );
  const themeDeck = shuffle(random, THEMES);
  const startSeats = START_SEATS[count] ?? START_SEATS[MIN_SUPPORTED];

  const taken = new Set<number>();
  const players: Player[] = seats.map((seat, index) => ({
    name: seat.name,
    isBot: seat.isBot,
    color: PARTY_COLORS[index],
    orientationId: orientations[index].id,
    themes: orientations[index].themes,
    seats: startSeats,
    points: 0,
    candidateId: null,
    bonus: 0,
    malus: 0,
    scandals: [],
    promises: dealPromises(promisePool, orientations[index].themes, taken),
    opposition: opposition.slice(
      index * OPPOSITION_PER_PLAYER,
      (index + 1) * OPPOSITION_PER_PLAYER,
    ),
    offices: [],
  }));

  // Nobody holds the Bundeskanzleramt yet, so the rules have the first player
  // rolled for - here: drawn from the same generator everything else runs on.
  const firstSeat = Math.floor(random.next() * count);
  const theme = themeDeck[themeDeck.length - 1];

  return {
    phase: "candidate",
    players,
    cycle: 1,
    round: 1,
    turn: firstSeat,
    firstSeat,
    theme,
    themeDeck: themeDeck.slice(0, -1),
    candidateDeck: candidateDeck.slice(CANDIDATE_OFFER),
    scandalDeck,
    offer: {
      seat: firstSeat,
      cardIds: candidateDeck.slice(0, CANDIDATE_OFFER),
      isSwap: false,
    },
    duel: 0,
    lastDuel: null,
    lastCheck: null,
    lastBallot: null,
    ballot: null,
    attempted: [],
    noGovernmentPoints: false,
    seed,
    rng: random.state(),
    log: ["Die Parteien stellen ihre Kandidat:innen auf."],
  };
}

/**
 * Builds the seats for a game against the computer.
 *
 * @param playerName - what the human seat is called
 * @param opponents - how many computer parties join
 * @returns the seats, the human first
 */
export function soloSeats(
  playerName: string,
  opponents: number,
): readonly PolitikSeat[] {
  const seats: PolitikSeat[] = [{ name: playerName, isBot: false }];
  for (let index = 0; index < opponents; index++) {
    seats.push({ name: BOT_NAMES[index % BOT_NAMES.length], isBot: true });
  }
  return seats;
}

/**
 * Takes two promises per theme out of the shared, shuffled pool.
 *
 * @remarks
 * The pool is walked in its shuffled order and every card handed out is struck
 * off, so no promise is dealt twice however many parties share a theme.
 */
function dealPromises(
  pool: readonly { readonly id: number; readonly theme: Theme }[],
  themes: readonly Theme[],
  taken: Set<number>,
): readonly number[] {
  const hand: number[] = [];
  for (const theme of themes) {
    let left = PROMISES_PER_THEME;
    for (const card of pool) {
      if (left > 0 && card.theme === theme && !taken.has(card.id)) {
        taken.add(card.id);
        hand.push(card.id);
        left -= 1;
      }
    }
  }
  return hand;
}
