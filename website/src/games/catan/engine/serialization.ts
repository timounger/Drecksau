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
import { COMMODITIES, NO_GOODS, NO_TABLEAU, type Knight } from "./knights";
import { PROGRESS_NAMES_LIST, TRACK_LIST, buildDecks } from "./progress";
import {
  RESOURCES,
  type CatanGame,
  type CatanPlayer,
  type Hand,
} from "./state";

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
  // "event" was missing here, which quietly threw away any session saved while
  // an Ereigniskarte was on the table - a real phase the referee can sit in.
  "event",
  "neutral",
  "swap",
  "displaced",
  "progress",
  "gameOver",
];

/** The variants a stored game may claim to be playing. */
const VARIANT_NAMES: readonly string[] = ["raeuber", "ereignisse", "haefen"];

/** The landscapes a stored game may claim to have. */
const LANDS: readonly string[] = [
  "lehm",
  "holz",
  "wolle",
  "getreide",
  "erz",
  "wueste",
];

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
    game.given.every(
      (sort) => sort === null || RESOURCES.includes(sort as never),
    ) &&
    isSeats(game.targets, seats) &&
    Number.isInteger(game.freeRoads) &&
    Number.isInteger(game.gifts) &&
    Number.isInteger(game.offers) &&
    Array.isArray(game.variants) &&
    game.variants.every((name) => VARIANT_NAMES.includes(name)) &&
    (game.harbourTile === null || isSeat(game.harbourTile, seats)) &&
    Number.isInteger(game.harbourBest) &&
    typeof game.playedDev === "boolean" &&
    (game.rolls === undefined || Number.isInteger(game.rolls)) &&
    (game.firstRoll === undefined ||
      game.firstRoll === null ||
      Number.isInteger(game.firstRoll)) &&
    (game.neutralBuild === undefined ||
      game.neutralBuild === null ||
      game.neutralBuild === "town" ||
      game.neutralBuild === "road") &&
    (game.swapWith === undefined ||
      game.swapWith === null ||
      Number.isInteger(game.swapWith)) &&
    (game.knightGiven === undefined || typeof game.knightGiven === "boolean") &&
    // Städte & Ritter. All optional, so a game stored before it existed still
    // loads; reviveCatanGame is what fills them in afterwards.
    (game.mode === undefined ||
      game.mode === "klassisch" ||
      game.mode === "ritter") &&
    (game.garrison === undefined ||
      isGarrison(game.garrison, seats, game.towns)) &&
    (game.decks === undefined || isDecks(game.decks)) &&
    (game.barbarian === undefined || Number.isInteger(game.barbarian)) &&
    (game.landed === undefined || typeof game.landed === "boolean") &&
    (game.metro === undefined || isMetro(game.metro, seats)) &&
    (game.trader === undefined ||
      game.trader === null ||
      isHex(game.trader, game.land.length)) &&
    (game.traderOwner === undefined ||
      game.traderOwner === null ||
      isSeat(game.traderOwner, seats)) &&
    (game.playing === undefined ||
      game.playing === null ||
      PROGRESS_NAMES_LIST.includes(game.playing)) &&
    (game.displaced === undefined ||
      game.displaced === null ||
      Number.isInteger(game.displaced)) &&
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
    // Optional, and staying optional: a game stored before CATAN für Zwei
    // existed has neither, and is a perfectly good three-handed game without
    // them. Read everywhere through the player, which defaults them.
    (player.neutral === undefined || typeof player.neutral === "boolean") &&
    (player.chips === undefined || Number.isInteger(player.chips)) &&
    (player.goods === undefined || isGoods(player.goods)) &&
    (player.tableau === undefined || isTableau(player.tableau)) &&
    (player.walls === undefined || Number.isInteger(player.walls)) &&
    (player.victoryChips === undefined ||
      Number.isInteger(player.victoryChips)) &&
    (player.progress === undefined ||
      (Array.isArray(player.progress) &&
        player.progress.every((card) =>
          PROGRESS_NAMES_LIST.includes(card as string),
        ))) &&
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

/** Whether this is a set of Handelswaren. */
function isGoods(value: unknown): boolean {
  const goods = value as Record<string, unknown>;
  return (
    isObject(value) &&
    COMMODITIES.every((sort) => Number.isInteger(goods[sort]))
  );
}

/** Whether this is a Fortschritt-Tableau. */
function isTableau(value: unknown): boolean {
  const tableau = value as Record<string, unknown>;
  return (
    isObject(value) &&
    TRACK_LIST.every((track) => Number.isInteger(tableau[track]))
  );
}

/** Whether this is a board of knights the right length. */
function isGarrison(value: unknown, seats: number, towns: unknown): boolean {
  const wanted = Array.isArray(towns) ? towns.length : -1;
  return (
    Array.isArray(value) &&
    value.length === wanted &&
    value.every(
      (knight) =>
        knight === null ||
        (isObject(knight) &&
          isSeat((knight as Knight).owner, seats) &&
          Number.isInteger((knight as Knight).level) &&
          typeof (knight as Knight).active === "boolean" &&
          typeof (knight as Knight).fresh === "boolean" &&
          typeof (knight as Knight).spent === "boolean"),
    )
  );
}

/** Whether these are the three Fortschritt piles. */
function isDecks(value: unknown): boolean {
  const decks = value as Record<string, unknown>;
  return (
    isObject(value) &&
    TRACK_LIST.every(
      (track) =>
        Array.isArray(decks[track]) &&
        (decks[track] as unknown[]).every((card) =>
          PROGRESS_NAMES_LIST.includes(card as string),
        ),
    )
  );
}

/** Whether these are the three metropolises. */
function isMetro(value: unknown, seats: number): boolean {
  const metro = value as Record<string, unknown>;
  return (
    isObject(value) &&
    TRACK_LIST.every((track) => {
      const one = metro[track] as { seat?: unknown; at?: unknown } | null;
      return (
        one === null ||
        (isObject(one) && isSeat(one.seat, seats) && Number.isInteger(one.at))
      );
    })
  );
}

/** Whether this is a hand of resource cards. */
function isHand(value: unknown): value is Hand {
  const hand = value as Hand;
  return (
    isObject(value) && RESOURCES.every((sort) => Number.isInteger(hand[sort]))
  );
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
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < seats
  );
}

/** Whether this is a list of seats. */
function isSeats(value: unknown, seats: number): boolean {
  return Array.isArray(value) && value.every((seat) => isSeat(seat, seats));
}

/** Whether this names a landscape. */
function isHex(value: unknown, hexes: number): boolean {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < hexes
  );
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
        (isObject(town) &&
          isSeat(built.owner, seats) &&
          typeof built.city === "boolean")
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
    (Array.isArray(value) &&
      value.length === 2 &&
      value.every((die) => Number.isInteger(die)))
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
      offer.answers.every(
        (answer) => answer === null || typeof answer === "boolean",
      ))
  );
}

/** Whether this is an object at all. */
function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}

/**
 * Fills in what a game stored before *CATAN für Zwei* has never heard of.
 *
 * @param game - a game that has passed {@link isCatanGame}
 * @returns the same game with every field the referee expects
 * @remarks
 * The guard accepts those fields missing on purpose - an old three-handed save
 * is a perfectly good game and throwing it away would cost somebody their
 * evening over a variant they were not playing. But the referee does arithmetic
 * on `rolls`, so "missing" has to become "zero" **once**, here, rather than at
 * every place that reads it.
 */
export function reviveCatanGame(game: CatanGame): CatanGame {
  return {
    ...game,
    rolls: game.rolls ?? 0,
    firstRoll: game.firstRoll ?? null,
    neutralBuild: game.neutralBuild ?? null,
    swapWith: game.swapWith ?? null,
    knightGiven: game.knightGiven ?? false,
    mode: game.mode ?? "klassisch",
    garrison: game.garrison ?? game.towns.map(() => null),
    decks: game.decks ?? buildDecks(),
    barbarian: game.barbarian ?? 0,
    landed: game.landed ?? false,
    metro: game.metro ?? { wissenschaft: null, handel: null, politik: null },
    eventDie: game.eventDie ?? null,
    redDie: game.redDie ?? null,
    trader: game.trader ?? null,
    traderOwner: game.traderOwner ?? null,
    drawing: game.drawing ?? [],
    playing: game.playing ?? null,
    displaced: game.displaced ?? null,
    crane: game.crane ?? null,
    fleet: game.fleet ?? null,
    players: game.players.map((player) => ({
      ...player,
      neutral: player.neutral ?? false,
      chips: player.chips ?? 0,
      goods: player.goods ?? NO_GOODS,
      goodsCount: player.goodsCount ?? 0,
      tableau: player.tableau ?? NO_TABLEAU,
      walls: player.walls ?? 0,
      progress: player.progress ?? [],
      victoryChips: player.victoryChips ?? 0,
    })),
  };
}
