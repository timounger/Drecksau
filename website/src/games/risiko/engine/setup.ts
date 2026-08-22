/**
 * Setting up each of the box's three games.
 *
 * @module
 * @remarks
 * The three openings are genuinely different games, not options on one:
 *
 * - **Grundspiel**: the cards deal the world out. Every player gets a share of
 *   the 42 territory cards and puts one or two units on each place they drew,
 *   so nobody chooses where they start and everybody starts everywhere.
 * - **Klassisches Risiko**: nobody is dealt anything. Players take turns
 *   claiming empty territories one at a time until the map is full, then take
 *   turns spending the rest of their starting units. That is two more phases
 *   before the first real turn, and it is where most of the strategy of the
 *   long game is decided.
 * - **Risiko für 2 Spieler**: as the basic game, but five armies are dealt in
 *   and three of them belong to nobody.
 */
import { NEUTRAL_NAMES, PLAYER_COLOURS } from "./armies";
import { TRUCE, buildDeck } from "./cards";
import { TERRITORIES } from "./map";
import { createRandom, shuffle, type Random } from "./random";
import { settle } from "./moves";
import {
  MAX_PLAYERS,
  MIN_CREW,
  MIN_PLAYERS,
  NEUTRAL_ARMIES,
  NEUTRAL_CARDS,
  NEUTRAL_BOOST,
  NEUTRAL_STASH,
  TWO_PLAYER_CARDS,
  incomeOf,
  startUnitsFor,
  targetFor,
  type RisikoGame,
  type RisikoPlayer,
  type Variant,
} from "./state";

/** A seat at the table, before anything is dealt. */
export type RisikoSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/** What the seat you play yourself is called when it has no other name. */
export const SELF_NAME = "Du";

/**
 * How deep the truce card is buried, by how many are playing.
 *
 * @remarks
 * The rulebook gives this as a **picture** and no numbers - a card stack with
 * three arrows on its side, "das Bild unten zeigt Ihnen, wo sie ungefähr
 * stecken sollte", the three-player mark highest and the five-player mark
 * lowest. So the ordering is the rulebook's and the depths are a reading.
 *
 * They were **measured, not guessed**. Played with the truce card taken out
 * entirely, somebody reaches the target after a median of 26 cards drawn with
 * three players, 25 with four and 28 with five - remarkably flat, because a
 * smaller table needs more territories each but has fewer players drawing. The
 * numbers below sit just above those medians, which makes reaching the target
 * the usual ending and leaves the card a real threat in the games that drag.
 * The rulebook frames it that way round too: the target is the win condition,
 * and the truce is the "ODER ...".
 */
const TRUCE_DEPTH: Readonly<Record<number, number>> = { 3: 28, 4: 30, 5: 32 };

/**
 * Deals a game.
 *
 * @param seats - the players, in turn order
 * @param variant - which of the box's three games
 * @param seed - the shuffle to use, so a game can be replayed exactly
 * @returns a game waiting on the first player
 */
export function createGame(
  seats: readonly RisikoSeat[],
  variant: Variant,
  seed: number,
): RisikoGame {
  const random = createRandom(seed);
  const wanted =
    variant === "zweispieler"
      ? MIN_PLAYERS
      : Math.min(MAX_PLAYERS, Math.max(MIN_CREW, seats.length));
  const humans: RisikoPlayer[] = Array.from(
    { length: wanted },
    (unused, seat) => ({
      name: seats[seat]?.name ?? PLAYER_COLOURS[seat].name,
      isBot: seats[seat]?.isBot ?? true,
      isNeutral: false,
      cards: [],
      alive: true,
    }),
  );
  const neutrals: RisikoPlayer[] =
    variant === "zweispieler"
      ? Array.from({ length: NEUTRAL_ARMIES }, (unused, at) => ({
          name: NEUTRAL_NAMES[at],
          isBot: true,
          isNeutral: true,
          cards: [],
          alive: true,
        }))
      : [];
  const players = [...humans, ...neutrals];
  const empty: RisikoGame = {
    variant,
    phase: "reinforce",
    players,
    active: 0,
    owner: Object.fromEntries(TERRITORIES.map((each) => [each.id, -1])),
    units: Object.fromEntries(TERRITORIES.map((each) => [each.id, 0])),
    toPlace: 0,
    pool: players.map(() => 0),
    conquered: false,
    advance: null,
    boosting: null,
    deck: [],
    discard: [],
    lastBattle: null,
    target: targetFor(variant, humans.length),
    winners: [],
    rng: random.state(),
    seed,
    log: [],
  };
  let dealt: RisikoGame;
  switch (variant) {
    case "klassisch":
      dealt = openClassic(empty, random);
      break;
    case "zweispieler":
      dealt = openTwoPlayer(empty, random);
      break;
    default:
      dealt = openBasic(empty, random);
  }
  return settle(dealt);
}

/**
 * The basic game: the cards decide where everybody starts.
 *
 * @remarks
 * "Bei jeder Karte mit 1 Stern stellen Sie 1 Einheit auf das entsprechende
 * Gebiet. Bei 2 Sternen stellen Sie 2 Einheiten." With four or five players two
 * cards are left over and go to the players who move last, which is the
 * rulebook's own way of paying for going late.
 */
function openBasic(game: RisikoGame, random: Random): RisikoGame {
  const count = game.players.length;
  const cards = shuffle(random, buildDeck());
  const hands = deal(cards, count);
  const board = place(game, hands);
  return {
    ...board,
    ...openFirst(board),
    deck: withTruce(shuffle(random, buildDeck()), count),
    log: [
      `Die Karten sind verteilt. ${count} Armeen stehen auf dem Spielplan.`,
      `Ziel: ${game.target} Gebiete.`,
    ],
  };
}

/** The classic game: nobody owns anything yet, and everybody has a pool. */
function openClassic(game: RisikoGame, random: Random): RisikoGame {
  const count = game.players.length;
  return {
    ...game,
    phase: "claim",
    active: 0,
    pool: game.players.map(() => startUnitsFor(count)),
    deck: shuffle(random, buildDeck()),
    log: [
      `Klassisches Risiko: je ${startUnitsFor(count)} Einheiten, und die Welt ist noch leer.`,
      "Reihum ein leeres Gebiet besetzen.",
    ],
  };
}

/**
 * The two-player game: five armies, three of which nobody plays.
 *
 * @remarks
 * The cards do the dealing here too - twelve each to the players, six to each
 * neutral army - and then the whole deck is gathered and reshuffled and **nine
 * cards are buried**, three under each neutral army, to be won by whoever
 * finishes that army off. That is why the draw pile starts at 33 rather than 42.
 */
function openTwoPlayer(game: RisikoGame, random: Random): RisikoGame {
  const cards = shuffle(random, buildDeck());
  const hands: string[][] = game.players.map(() => []);
  let at = 0;
  for (let seat = 0; seat < game.players.length; seat += 1) {
    const take = game.players[seat].isNeutral
      ? NEUTRAL_CARDS
      : TWO_PLAYER_CARDS;
    hands[seat] = cards.slice(at, at + take);
    at += take;
  }
  const board = place(game, hands);
  const pile = shuffle(random, buildDeck());
  const stashed = pile.slice(0, NEUTRAL_ARMIES * NEUTRAL_STASH);
  const players = board.players.map((player, seat) => {
    const which = seat - MIN_PLAYERS;
    return player.isNeutral
      ? {
          ...player,
          cards: stashed.slice(
            which * NEUTRAL_STASH,
            (which + 1) * NEUTRAL_STASH,
          ),
        }
      : player;
  });
  return {
    ...board,
    ...openFirst(board),
    players,
    // No truce card in this one: "Nehmen Sie die Waffenstillstandskarte aus dem
    // Spiel."
    deck: pile.slice(NEUTRAL_ARMIES * NEUTRAL_STASH),
    log: [
      "Zwei Spieler, drei neutrale Armeen.",
      `Ziel: ${game.target} Gebiete oder den Gegner besiegen.`,
    ],
  };
}

/**
 * Deals the whole deck out.
 *
 * @remarks
 * "In einer Runde mit 4 oder 5 Spielern bleiben 2 Karten übrig: Diese geben Sie
 * den beiden Spielern, die zuletzt am Zug sind." Dealing round-robin from the
 * top does exactly that on its own, which is why there is no special case here.
 */
function deal(cards: readonly string[], seats: number): readonly string[][] {
  const hands: string[][] = Array.from({ length: seats }, () => []);
  cards.forEach((card, at) => {
    hands[(seats - 1 - (at % seats) + seats) % seats].push(card);
  });
  return hands;
}

/** Puts a unit per star on every territory each hand names. */
function place(
  game: RisikoGame,
  hands: readonly (readonly string[])[],
): RisikoGame {
  const owner = { ...game.owner };
  const units = { ...game.units };
  hands.forEach((hand, seat) => {
    for (const card of hand) {
      owner[card] = seat;
      units[card] = TERRITORIES.find((each) => each.id === card)?.stars ?? 1;
    }
  });
  return { ...game, owner, units };
}

/** The phase and pending units the first turn opens with. */
function openFirst(game: RisikoGame): Pick<RisikoGame, "phase" | "toPlace"> {
  // Through the same rule every later turn uses, so an opening turn cannot
  // quietly be worth a different number from the second one.
  return game.variant === "zweispieler"
    ? { phase: "neutral", toPlace: NEUTRAL_BOOST }
    : { phase: "reinforce", toPlace: incomeOf(game, 0) };
}

/** Puts the truce card into the deck at this table's depth. */
function withTruce(deck: readonly string[], seats: number): readonly string[] {
  const depth = Math.min(
    deck.length,
    TRUCE_DEPTH[seats] ?? TRUCE_DEPTH[MAX_PLAYERS],
  );
  return [...deck.slice(0, depth), TRUCE, ...deck.slice(depth)];
}

/**
 * The seats for a game against the computer.
 *
 * @param playerName - what the human seat is called
 * @param opponents - how many computer players join
 * @returns the seats, the human first
 */
export function soloSeats(
  playerName: string,
  opponents: number,
): readonly RisikoSeat[] {
  return [
    { name: playerName, isBot: false },
    ...Array.from({ length: opponents }, (unused, at) => ({
      name: PLAYER_COLOURS[at + 1].name,
      isBot: true,
    })),
  ];
}
