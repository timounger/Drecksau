/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so a round trip leaves it alone - but what comes
 * back may be from an older build, hand-edited, or simply broken. This guard is
 * the one place that decides whether to trust it.
 *
 * It checks shape, not legality. A board where somebody has settlements on two
 * touching crossings is not this module's problem: the referee never produced
 * it, and no move will make it worse. What it does insist on is that the two
 * big boards are **exactly the right length**, because everything else indexes
 * them by number, and a short array reads as `undefined` for a whole crossing
 * rather than failing where the mistake happened.
 */
import { LARGE_HEXES, SMALL_HEXES, islandOf } from "./board";
import { RESOURCES, type CatanGame, type CatanPlayer, type Hand } from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = [
  "founding",
  "roll",
  "discard",
  "robber",
  "steal",
  "trade",
  "monopol",
  "erfindung",
  "gameOver",
];

/** The variants a stored game may claim to be playing. */
const VARIANT_NAMES: readonly string[] = ["raeuber", "ereignisse", "haefen"];

/** The landscapes a stored game may claim to have. */
const LANDS: readonly string[] = ["lehm", "holz", "wolle", "getreide", "erz", "wueste"];

/** The development cards a stored game may claim to hold. */
const CARDS: readonly string[] = [
  "ritter",
  "siegpunkt",
  "monopol",
  "strassenbau",
  "erfindung",
];

/**
 * Checks an unknown value really is a game of Catan.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isCatanGame(value: unknown): value is CatanGame {
  const game = value as CatanGame;
  const seats = Array.isArray(game?.players) ? game.players.length : 0;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    seats > 0 &&
    game.players.every(isPlayer) &&
    isSeat(game.active, seats) &&
    (game.stone === 1 || game.stone === 2) &&
    isLand(game.land) &&
    isChips(game.chips, game.land.length) &&
    isHarbours(game.harbours, game.land.length) &&
    isHex(game.robber, game.land.length) &&
    isTowns(game.towns, seats, game.land.length) &&
    isRoads(game.roads, seats, game.land.length) &&
    isCards(game.stack) &&
    isDice(game.dice) &&
    isFounding(game.founding, seats, game.land.length) &&
    isOffer(game.offer, seats) &&
    isSeats(game.owing, seats) &&
    isSeats(game.owed, seats) &&
    isEvents(game.events) &&
    (game.drawn === null || isEventCard(game.drawn)) &&
    (game.after === null || Number.isInteger(game.after)) &&
    Array.isArray(game.given) &&
    game.given.every((sort) => sort === null || RESOURCES.includes(sort as never)) &&
    isSeats(game.targets, seats) &&
    Number.isInteger(game.freeRoads) &&
    Number.isInteger(game.gifts) &&
    Number.isInteger(game.offers) &&
    Array.isArray(game.variants) &&
    game.variants.every((name) => VARIANT_NAMES.includes(name)) &&
    (game.harbourTile === null || isSeat(game.harbourTile, seats)) &&
    Number.isInteger(game.harbourBest) &&
    typeof game.playedDev === "boolean" &&
    (game.longest === null || isSeat(game.longest, seats)) &&
    Number.isInteger(game.longestLen) &&
    (game.army === null || isSeat(game.army, seats)) &&
    Number.isInteger(game.target) &&
    (game.winner === null || isSeat(game.winner, seats)) &&
    Number.isInteger(game.turn) &&
    Number.isFinite(game.seed) &&
    Array.isArray(game.log)
  );
}

/** Whether this is a player. */
function isPlayer(value: unknown): value is CatanPlayer {
  const player = value as CatanPlayer;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.bot === "boolean" &&
    typeof player.colour === "string" &&
    isHand(player.hand) &&
    Number.isInteger(player.cards) &&
    isCards(player.deck) &&
    isCards(player.fresh) &&
    Number.isInteger(player.knights) &&
    (player.damaged === null || Number.isInteger(player.damaged)) &&
    Number.isInteger(player.roads) &&
    Number.isInteger(player.settlements) &&
    Number.isInteger(player.cities)
  );
}

/** Whether this is a hand of resource cards. */
function isHand(value: unknown): value is Hand {
  const hand = value as Hand;
  return isObject(value) && RESOURCES.every((sort) => Number.isInteger(hand[sort]));
}

/** The events a stored game may name. */
const EVENT_KINDS: readonly string[] = [
  "schoenerTag",
  "raeuberueberfall",
  "seuche",
  "erdbeben",
  "guteNachbarschaft",
  "ritterturnier",
  "handelsvorteil",
  "ruhigeSee",
  "rueckzug",
  "nachbarschaftshilfe",
  "konflikt",
  "ertragreichesJahr",
  "jahreswechsel",
];

/** Whether this is one event card. */
function isEventCard(value: unknown): boolean {
  const card = value as { number?: unknown; kind?: unknown };
  return (
    isObject(value) &&
    (card.number === null || Number.isInteger(card.number)) &&
    EVENT_KINDS.includes(card.kind as string)
  );
}

/** Whether this is a draw pile of event cards. */
function isEvents(value: unknown): boolean {
  return Array.isArray(value) && value.every(isEventCard);
}

/** Whether this is a list of development cards. */
function isCards(value: unknown): boolean {
  return Array.isArray(value) && value.every((card) => CARDS.includes(card));
}

/** Whether this names a seat at this table. */
function isSeat(value: unknown, seats: number): boolean {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) < seats;
}

/** Whether this is a list of seats. */
function isSeats(value: unknown, seats: number): boolean {
  return Array.isArray(value) && value.every((seat) => isSeat(seat, seats));
}

/** Whether this names a landscape. */
function isHex(value: unknown, hexes: number): boolean {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) < hexes;
}

/**
 * Whether this is a full row of landscapes.
 *
 * @remarks
 * Two lengths are allowed and nothing between: the printed board's 19, and the
 * 30 of the 5-6 Personen Erweiterung. The length is what everything else reads
 * the board size off, so it has to be one of the two the code can build.
 */
function isLand(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    (value.length === SMALL_HEXES || value.length === LARGE_HEXES) &&
    value.every((land) => LANDS.includes(land))
  );
}

/** Whether this is the full row of number chips. */
function isChips(value: unknown, hexes: number): boolean {
  return (
    Array.isArray(value) &&
    value.length === hexes &&
    value.every((chip) => Number.isInteger(chip))
  );
}

/** Whether these are harbours on real paths. */
function isHarbours(value: unknown, hexes: number): boolean {
  const board = islandOf(hexes);
  return (
    Array.isArray(value) &&
    value.every((harbour) => {
      const dock = harbour as { path?: unknown; want?: unknown };
      return (
        isObject(harbour) &&
        Number.isInteger(dock.path) &&
        (dock.path as number) < board.paths.length &&
        (dock.want === null || RESOURCES.includes(dock.want as never))
      );
    })
  );
}

/** Whether this is the full row of crossings. */
function isTowns(value: unknown, seats: number, hexes: number): boolean {
  return (
    Array.isArray(value) &&
    value.length === islandOf(hexes).crossings.length &&
    value.every((town) => {
      const built = town as { owner?: unknown; city?: unknown };
      return (
        town === null ||
        (isObject(town) && isSeat(built.owner, seats) && typeof built.city === "boolean")
      );
    })
  );
}

/** Whether this is the full row of paths. */
function isRoads(value: unknown, seats: number, hexes: number): boolean {
  return (
    Array.isArray(value) &&
    value.length === islandOf(hexes).paths.length &&
    value.every((owner) => owner === null || isSeat(owner, seats))
  );
}

/** Whether this is a pair of dice or nothing. */
function isDice(value: unknown): boolean {
  return (
    value === null ||
    (Array.isArray(value) && value.length === 2 && value.every((die) => Number.isInteger(die)))
  );
}

/** Whether this is the founding phase's bookkeeping. */
function isFounding(value: unknown, seats: number, hexes: number): boolean {
  const founding = value as {
    order?: unknown;
    step?: unknown;
    placing?: unknown;
    lastTown?: unknown;
  };
  return (
    value === null ||
    (isObject(value) &&
      isSeats(founding.order, seats) &&
      Number.isInteger(founding.step) &&
      (founding.placing === "town" || founding.placing === "road") &&
      (founding.lastTown === null ||
        (Number.isInteger(founding.lastTown) &&
          (founding.lastTown as number) < islandOf(hexes).crossings.length)))
  );
}

/** Whether this is an offer on the table. */
function isOffer(value: unknown, seats: number): boolean {
  const offer = value as {
    from?: unknown;
    give?: unknown;
    want?: unknown;
    answers?: unknown;
  };
  return (
    value === null ||
    (isObject(value) &&
      isSeat(offer.from, seats) &&
      isHand(offer.give) &&
      isHand(offer.want) &&
      Array.isArray(offer.answers) &&
      offer.answers.length === seats &&
      offer.answers.every((answer) => answer === null || typeof answer === "boolean"))
  );
}

/** Whether this is an object at all. */
function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}
