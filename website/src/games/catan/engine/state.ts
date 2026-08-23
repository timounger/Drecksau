/**
 * What a game of Catan is made of.
 *
 * @remarks
 * Everything here is plain JSON: numbers, strings, arrays, and objects with
 * fixed keys. The board is addressed by index throughout - crossing 0 to 53,
 * path 0 to 71, landscape 0 to 18 - so the two big boards are arrays with a
 * hole for every empty spot rather than maps with numeric keys, which do not
 * survive a round trip through storage or the wire unchanged.
 *
 * @module
 */
import type { EventCard } from "./events";

/** The five things the island produces. */
export type Resource = "lehm" | "holz" | "wolle" | "getreide" | "erz";

/** A landscape: one of the five, or the desert, which yields nothing. */
export type Land = Resource | "wueste";

/** Cards in hand, counted by sort. */
export type Hand = Readonly<Record<Resource, number>>;

/** The five sorts, in the order the rulebook lists them. */
export const RESOURCES: readonly Resource[] = ["lehm", "holz", "wolle", "getreide", "erz"];

/** What each landscape produces. */
export const YIELD: Readonly<Record<Land, Resource | null>> = {
  lehm: "lehm",
  holz: "holz",
  wolle: "wolle",
  getreide: "getreide",
  erz: "erz",
  wueste: null,
};

/** An empty hand. */
export const NO_CARDS: Hand = { lehm: 0, holz: 0, wolle: 0, getreide: 0, erz: 0 };

/**
 * The variants of *Händler & Barbaren* that need no new board.
 *
 * @remarks
 * The rulebook is explicit that these four combine freely - "alle Varianten
 * sind sowohl untereinander als auch mit den Szenarien dieser Erweiterung, mit
 * Seefahrer und teilweise auch mit Städte & Ritter und Entdecker & Piraten
 * kombinierbar" - so they are a **set**, not a choice. Everything that reads
 * them asks "is this one switched on", never "which one are we playing".
 */
export type Variant = "raeuber" | "ereignisse" | "haefen";

/** The variants, in the order the rulebook introduces them. */
export const VARIANTS: readonly Variant[] = ["raeuber", "ereignisse", "haefen"];

/** Whether a variant is switched on. */
export function playing(game: CatanGame, variant: Variant): boolean {
  return game.variants.includes(variant);
}

/** The five kinds of Entwicklungskarte. */
export type DevKind = "ritter" | "siegpunkt" | "monopol" | "strassenbau" | "erfindung";

/** How the development deck is stocked - 25 cards. */
export const DEV_DECK: Readonly<Record<DevKind, number>> = {
  ritter: 14,
  siegpunkt: 5,
  monopol: 2,
  strassenbau: 2,
  erfindung: 2,
};

/**
 * What the 5-6 Personen Erweiterung adds to the deck - nine cards.
 *
 * @remarks
 * "9 Entwicklungskarten: 1 x Monopol, 1 x Straßenbau, 1 x Erfindung,
 * 6 x Ritter." Which makes 34 in all, twenty of them knights - the extra
 * players need extra knights more than they need extra anything else.
 */
export const CREW_DEV: Readonly<Record<DevKind, number>> = {
  ritter: 6,
  siegpunkt: 0,
  monopol: 1,
  strassenbau: 1,
  erfindung: 1,
};

/**
 * A harbour.
 *
 * @remarks
 * `want` names the single resource a 2:1 harbour takes; `null` is the generic
 * 3:1 one. There are four of those and one for each resource.
 */
export type Harbour = {
  readonly path: number;
  readonly want: Resource | null;
};

/** A settlement or a city on a crossing. */
export type Town = {
  readonly owner: number;
  readonly city: boolean;
};

/** What one player owns and holds. */
export type CatanPlayer = {
  readonly name: string;
  readonly bot: boolean;
  /** Which of the four figure colours they play. */
  readonly colour: string;
  readonly hand: Hand;
  /**
   * How many resource cards this player holds.
   *
   * @remarks
   * The same number as {@link handSize} of the hand, kept as a field because it
   * has to survive redaction: at a table everyone can *count* an opponent's
   * cards and nobody can read them, and a hand blanked for the wire would
   * otherwise lose the count along with the sorts. The referee recomputes it
   * after every move, so it cannot drift.
   */
  readonly cards: number;
  /** Development cards that may be played. */
  readonly deck: readonly DevKind[];
  /** Bought this turn, and so not yet playable. */
  readonly fresh: readonly DevKind[];
  /** Knights turned face up, which is what the Rittermacht counts. */
  readonly knights: number;
  /**
   * A road turned sideways by an Erdbeben, waiting to be repaired.
   *
   * @remarks
   * Only *Ereignisse auf Catan* produces these. Until it is repaired its owner
   * may build no new roads, and it is no use as the connection a settlement
   * needs - but it still counts toward the Längste Handelsroute, which the
   * card says outright.
   */
  readonly damaged: number | null;
  /** Pieces still in the box. */
  readonly roads: number;
  readonly settlements: number;
  readonly cities: number;
};

/** An offer on the table during the trading phase. */
export type Offer = {
  /** Always the player whose turn it is - only they may offer. */
  readonly from: number;
  readonly give: Hand;
  readonly want: Hand;
  /** One answer per seat: `true` accepted, `false` declined, `null` thinking. */
  readonly answers: readonly (boolean | null)[];
};

/** Where the founding phase has got to. */
export type Founding = {
  /** Every seat in turn: once clockwise, then once back again. */
  readonly order: readonly number[];
  readonly step: number;
  /** A settlement first, then the road beside it. */
  readonly placing: "town" | "road";
  /** The crossing just built on, which the road has to touch. */
  readonly lastTown: number | null;
};

/**
 * Where a turn has got to.
 *
 * @remarks
 * `roll` and `trade` are the rulebook's two phases. The rest are the moments
 * inside them that need somebody to answer something before play can go on:
 * a seven has been rolled and hands are over the limit (`discard`), the robber
 * is being moved (`robber`), there is more than one player to rob (`steal`),
 * a Monopol or Erfindung card is waiting for its choice.
 */
export type Phase =
  | "founding"
  | "roll"
  | "discard"
  | "robber"
  | "steal"
  | "trade"
  | "monopol"
  | "erfindung"
  /** An event card is on the table and somebody has to answer it. */
  | "event"
  | "gameOver";

/** A whole game. */
export type CatanGame = {
  /** The generator cursor, carried along so a game is reproducible. */
  readonly seed: number;
  readonly players: readonly CatanPlayer[];
  /** The 19 landscapes, in reading order. */
  readonly land: readonly Land[];
  /** The number on each landscape; 0 on the desert. */
  readonly chips: readonly number[];
  readonly harbours: readonly Harbour[];
  /** Which landscape the robber stands on. */
  readonly robber: number;
  /** 54 crossings; `null` where nothing is built. */
  readonly towns: readonly (Town | null)[];
  /** 72 paths; the seat that owns the road, or `null`. */
  readonly roads: readonly (number | null)[];
  /** Development cards not yet bought. */
  readonly stack: readonly DevKind[];
  /** The *Ereignisse auf Catan* draw pile, top card first. */
  readonly events: readonly EventCard[];
  /** The card face up on the table, if this variant is being played. */
  readonly drawn: EventCard | null;
  /** Seats that still owe an answer to the card. */
  readonly owed: readonly number[];
  /**
   * What each seat is passing to their left neighbour.
   *
   * @remarks
   * Gute Nachbarschaft happens at once around the table. Answered one seat at a
   * time it would let somebody pass on a card they had just been handed, so the
   * choices are collected here and all move together when the last one is in.
   */
  readonly given: readonly (Resource | null)[];
  /** The number the landscapes pay out on once the card has been answered. */
  readonly after: number | null;
  readonly active: number;
  /**
   * Which half of the Spielzug this is - 1 or 2.
   *
   * @remarks
   * Always 1 on a three- or four-handed table, which has only one half. See
   * {@link actingSeat}.
   */
  readonly stone: number;
  readonly phase: Phase;
  readonly dice: readonly [number, number] | null;
  readonly founding: Founding | null;
  readonly offer: Offer | null;
  /** Seats that still owe a discard after a seven. */
  readonly owing: readonly number[];
  /** Who the robber could take a card from, once it has been moved. */
  readonly targets: readonly number[];
  /** Roads still free to build from a Straßenbau card. */
  readonly freeRoads: number;
  /** Resources still to take from an Erfindung card. */
  readonly gifts: number;
  /** One development card per turn, and this says it has been used. */
  readonly playedDev: boolean;
  /** Offers made this turn, which {@link OFFER_LIMIT} bounds. */
  readonly offers: number;
  /** Who holds the Längste Handelsroute, and how long it is. */
  readonly longest: number | null;
  readonly longestLen: number;
  /** Who holds the Größte Rittermacht. */
  readonly army: number | null;
  /** Which variants are switched on. */
  readonly variants: readonly Variant[];
  /** Who holds *Stärkste Häfen*, and with how many harbour points. */
  readonly harbourTile: number | null;
  readonly harbourBest: number;
  /** Points needed to win - ten in the printed game. */
  readonly target: number;
  readonly winner: number | null;
  readonly turn: number;
  readonly log: readonly string[];
};

/** What a road costs. */
export const ROAD_COST: Hand = { ...NO_CARDS, lehm: 1, holz: 1 };

/** What a settlement costs. */
export const TOWN_COST: Hand = { lehm: 1, holz: 1, wolle: 1, getreide: 1, erz: 0 };

/** What upgrading a settlement to a city costs. */
export const CITY_COST: Hand = { ...NO_CARDS, getreide: 2, erz: 3 };

/** What a development card costs. */
export const DEV_COST: Hand = { ...NO_CARDS, wolle: 1, getreide: 1, erz: 1 };

/** What putting an earthquake-damaged road back up costs. */
export const REPAIR_COST: Hand = { ...NO_CARDS, holz: 1, lehm: 1 };

/** From this many players on, two people share every Spielzug. */
export const CREW_PLAYERS = 5;

/**
 * How many seats to the left of Stein 1 that Stein 2 sits.
 *
 * @remarks
 * "Wer 3 Plätze links von Person A sitzt, nimmt sich den Aufsteller Stein 2."
 * Both stones then pass one seat left after every Spielzug, so the gap never
 * changes and Stein 2 is always derivable rather than stored.
 */
export const STONE_GAP = 3;

/** Whether this table shares its turns between two stones. */
export function sharesTurns(game: CatanGame): boolean {
  return game.players.length >= CREW_PLAYERS;
}

/** Who holds Stein 2 - three seats to the left of Stein 1. */
export function secondSeat(game: CatanGame): number {
  return (game.active + STONE_GAP) % game.players.length;
}

/**
 * Whose Spielzug half this is.
 *
 * @remarks
 * `active` names whoever holds **Stein 1** for the whole Spielzug, including
 * the half in which Stein 2 is acting - that is what keeps the rotation simple.
 * Anything that means "the player doing something right now" has to ask this
 * instead, which on a three- or four-handed table is the same seat.
 */
export function actingSeat(game: CatanGame): number {
  return game.stone === 2 && sharesTurns(game) ? secondSeat(game) : game.active;
}

/** How many pieces of each kind a colour comes with. */
export const STOCK = { roads: 15, settlements: 5, cities: 4 } as const;

/**
 * How many offers one turn may carry.
 *
 * @remarks
 * The rulebook puts no number on haggling - "so lange und so oft, wie es deine
 * Rohstoffkarten zulassen" - and at a table it needs none, because a table gets
 * bored. A turn that is a loop of offers cannot be allowed to run forever here,
 * so there is a ceiling. Ten is far past what anybody types and short enough to
 * end a turn that has stopped going anywhere.
 */
export const OFFER_LIMIT = 10;

/** Above this many cards, a seven costs you half of them. */
export const HAND_LIMIT = 7;

/** Roads needed before the Längste Handelsroute is awarded at all. */
export const ROUTE_MIN = 5;

/** Knights needed before the Größte Rittermacht is awarded at all. */
export const ARMY_MIN = 3;

/** What each of the two special tiles is worth. */
export const TILE_POINTS = 2;

/** The rulebook's own finish line. */
export const WIN_POINTS = 10;

/** How many cards a hand holds. */
export function handSize(hand: Hand): number {
  return RESOURCES.reduce((sum, sort) => sum + hand[sort], 0);
}

/** A hand plus another. */
export function plus(hand: Hand, other: Hand): Hand {
  return {
    lehm: hand.lehm + other.lehm,
    holz: hand.holz + other.holz,
    wolle: hand.wolle + other.wolle,
    getreide: hand.getreide + other.getreide,
    erz: hand.erz + other.erz,
  };
}

/** A hand minus another. */
export function minus(hand: Hand, other: Hand): Hand {
  return {
    lehm: hand.lehm - other.lehm,
    holz: hand.holz - other.holz,
    wolle: hand.wolle - other.wolle,
    getreide: hand.getreide - other.getreide,
    erz: hand.erz - other.erz,
  };
}

/** A hand with one card more. */
export function withCard(hand: Hand, sort: Resource, count = 1): Hand {
  return { ...hand, [sort]: hand[sort] + count };
}

/** Whether a hand covers a cost. */
export function covers(hand: Hand, cost: Hand): boolean {
  return RESOURCES.every((sort) => hand[sort] >= cost[sort]);
}

/** A hand spelled out card by card, which is what random theft needs. */
export function spread(hand: Hand): readonly Resource[] {
  const cards: Resource[] = [];
  RESOURCES.forEach((sort) => {
    for (let i = 0; i < hand[sort]; i += 1) {
      cards.push(sort);
    }
  });
  return cards;
}

/** How many victory point cards a player is sitting on. */
export function hiddenPoints(player: CatanPlayer): number {
  const all = [...player.deck, ...player.fresh];
  return all.filter((card) => card === "siegpunkt").length;
}

/**
 * What a player is worth.
 *
 * @remarks
 * Settlements one, cities two, each special tile two, and every Siegpunkt card
 * one. The cards are held face down until the moment they win the game, so
 * anything shown to the other players has to leave {@link hiddenPoints} out.
 */
export function pointsOf(game: CatanGame, seat: number): number {
  const built = game.towns.reduce(
    (sum, town) => (town !== null && town.owner === seat ? sum + (town.city ? 2 : 1) : sum),
    0,
  );
  const tiles =
    (game.longest === seat ? TILE_POINTS : 0) +
    (game.army === seat ? TILE_POINTS : 0) +
    // Stärkste Häfen, when Die Häfen von Catan is switched on. Held at null
    // otherwise, so this costs nothing in a printed game.
    (game.harbourTile === seat ? TILE_POINTS : 0);
  return built + tiles + hiddenPoints(game.players[seat]);
}

/** What the other players can see a player is worth. */
export function openPoints(game: CatanGame, seat: number): number {
  return pointsOf(game, seat) - hiddenPoints(game.players[seat]);
}

/**
 * Everything a player can do.
 *
 * @remarks
 * `town` and `road` build in the founding phase and in the building phase
 * alike - the piece is the same, only the rules that let you place it differ,
 * and the referee already knows which phase it is in. `choose` likewise serves
 * both cards that ask for a resource: Monopol takes every card of that sort off
 * the table, Erfindung takes one out of the supply, and again the phase says
 * which.
 */
export type CatanMove =
  | { readonly kind: "town"; readonly at: number }
  | { readonly kind: "road"; readonly at: number }
  | { readonly kind: "city"; readonly at: number }
  | { readonly kind: "roll" }
  | { readonly kind: "discard"; readonly cards: Hand }
  | { readonly kind: "robber"; readonly at: number }
  | { readonly kind: "rob"; readonly seat: number }
  | { readonly kind: "buy" }
  | { readonly kind: "play"; readonly card: DevKind }
  | { readonly kind: "choose"; readonly sort: Resource }
  | { readonly kind: "bank"; readonly give: Resource; readonly want: Resource }
  | { readonly kind: "offer"; readonly give: Hand; readonly want: Hand }
  | { readonly kind: "answer"; readonly yes: boolean }
  | { readonly kind: "deal"; readonly seat: number }
  | { readonly kind: "withdraw" }
  /** Answering the event card: a resource, a road, or somebody at the table. */
  | {
      readonly kind: "event";
      readonly sort?: Resource;
      readonly at?: number;
      readonly seat?: number;
    }
  /** Putting an Erdbeben road back up: 1 Holz + 1 Lehm. */
  | { readonly kind: "repair" }
  | { readonly kind: "endTurn" };
