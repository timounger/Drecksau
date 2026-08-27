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
import {
  METRO_POINTS,
  TRACKS,
  type Commodity,
  type Metropolis,
  type Goods,
  type Knight,
  type Tableau,
  type Track,
} from "./knights";
import { isPointCard, type Progress } from "./progress";

/** The five things the island produces. */
export type Resource = "lehm" | "holz" | "wolle" | "getreide" | "erz";

/** A landscape: one of the five, or the desert, which yields nothing. */
export type Land = Resource | "wueste";

/** Cards in hand, counted by sort. */
export type Hand = Readonly<Record<Resource, number>>;

/** The five sorts, in the order the rulebook lists them. */
export const RESOURCES: readonly Resource[] = [
  "lehm",
  "holz",
  "wolle",
  "getreide",
  "erz",
];

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
export const NO_CARDS: Hand = {
  lehm: 0,
  holz: 0,
  wolle: 0,
  getreide: 0,
  erz: 0,
};

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

/**
 * Which game is being played.
 *
 * @remarks
 * A **mode**, not a variant, and the difference matters. The variants of
 * *Händler & Barbaren* add to the printed game and combine freely; *Städte &
 * Ritter* replaces parts of it - the development cards, the two dice, the ten
 * points, the Größte Rittermacht, the second founding placement - so it is one
 * or the other for a whole game and there is nothing to combine.
 */
export type Mode = "klassisch" | "ritter";

/** The two games on offer, printed one first. */
export const MODES: readonly Mode[] = ["klassisch", "ritter"];

/** Whether this is a game of Städte & Ritter. */
export function playingRitter(game: CatanGame): boolean {
  return game.mode === "ritter";
}

/** The variants, in the order the rulebook introduces them. */
export const VARIANTS: readonly Variant[] = ["raeuber", "ereignisse", "haefen"];

/** Whether a variant is switched on. */
export function playing(game: CatanGame, variant: Variant): boolean {
  return game.variants.includes(variant);
}

/** The five kinds of Entwicklungskarte. */
export type DevKind =
  "ritter" | "siegpunkt" | "monopol" | "strassenbau" | "erfindung";

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
  /**
   * A colour nobody plays, for *CATAN für Zwei*.
   *
   * @remarks
   * "Die beiden Figurensätze, mit denen ihr nicht spielt, sind die Figuren von
   * zwei imaginären neutralen Personen." They are seats rather than a structure
   * of their own because that is exactly what they are on the board: a crossing
   * stores the seat that built on it, and a neutral settlement has to be able
   * to sit there and block it like any other.
   *
   * What they never do: take a turn, hold a card, collect an income, or win.
   * What they very much do: **hold the Längste Handelsroute**, which the
   * rulebook says outright - "in einer neutralen Farbe kann aber durchaus die
   * Längste Handelsroute entstehen".
   */
  readonly neutral: boolean;
  /**
   * Handelschips, the currency of *CATAN für Zwei*.
   *
   * @remarks
   * Zero on every other table. Five each at the start; spent on the two chip
   * actions and earned back by handing in a played knight or by founding on
   * the coast or the desert.
   */
  readonly chips: number;
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
  /**
   * *Städte & Ritter*: Handelswaren in hand.
   *
   * @remarks
   * A second hand rather than three more entries in the first, because the two
   * are counted separately everywhere the rules touch them: a harbour takes
   * four of **one** sort, and "jede der 3 Handelswaren zählt als eigene Sorte".
   * They do count together against the seven after a seven, which is the one
   * place the two hands are added up.
   */
  readonly goods: Goods;
  /** How many Handelswaren this player holds, kept for redaction like `cards`. */
  readonly goodsCount: number;
  /** How far each of the three city tracks is built, 0 to 5. */
  readonly tableau: Tableau;
  /** City walls standing, at most {@link MAX_WALLS}. */
  readonly walls: number;
  /** Fortschrittskarten held face down, plus the face-up victory points. */
  readonly progress: readonly Progress[];
  /**
   * Siegpunkt-Chips won by leading the defence against the barbarians.
   *
   * @remarks
   * Named apart from {@link CatanPlayer.chips}, which is the Handelschips of
   * *CATAN für Zwei* and buys actions. These are victory points and buy
   * nothing; two things called "chips" in one player would be a bug waiting to
   * be written.
   */
  readonly victoryChips: number;
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
  /**
   * *CATAN für Zwei*: a free piece has to go down in a neutral colour.
   *
   * @remarks
   * Its own phase because it is a **choice** and not a consequence - which of
   * the two colours, and where - and because the turn may not go on until it
   * has been made. {@link CatanGame.neutralBuild} says what is owed.
   */
  | "neutral"
  /**
   * *CATAN für Zwei*: two cards have been pulled and two have to go back.
   *
   * @remarks
   * Zwangshandel is two steps at a table too: "Du darfst 2 Karten aus der Hand
   * der anderen Person ziehen. Dafür musst du ihr 2 beliebige Karten
   * zurückgeben." The pull is blind and the return is a choice, so the choice
   * needs somewhere to wait.
   */
  | "swap"
  /** *Städte & Ritter*: a driven-off knight is waiting to be put somewhere. */
  | "displaced"
  /** *Städte & Ritter*: a Fortschrittskarte is waiting for its choice. */
  | "progress"
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
  /**
   * *CATAN für Zwei*: how many of the turn's two rolls are done.
   *
   * @remarks
   * "Bist du an der Reihe, würfelst du zweimal hintereinander." Always 0 or 1
   * on any other table, where the turn has one roll and moves on.
   */
  readonly rolls: number;
  /**
   * The first of the two rolls, so the second can be made to differ.
   *
   * @remarks
   * "Zeigt der zweite Würfelwurf das gleiche Ergebnis wie der erste, wird er
   * wiederholt." Rerolled inside the referee rather than handed back to the
   * player, because a repeat is not a result - it never happened.
   */
  readonly firstRoll: number | null;
  /**
   * *CATAN für Zwei*: a free neutral piece still to be placed.
   *
   * @remarks
   * "Baust du eine Straße oder Siedlung, baust du ebenfalls (kostenlos) 1
   * Straße bzw. Siedlung in einer beliebigen der beiden neutralen Farben." The
   * kind is what the rulebook owes; whether it can still be paid is worked out
   * when the choice is offered, because "kann bei beiden Farben keine Siedlung
   * gebaut werden, baust du stattdessen eine Straße".
   */
  readonly neutralBuild: "town" | "road" | null;
  /**
   * *CATAN für Zwei*: cards pulled by a Zwangshandel, waiting to be paid for.
   *
   * @remarks
   * They are already in the puller's hand - the pull is over - and this only
   * remembers **whom** the two cards going back are owed to.
   */
  readonly swapWith: number | null;
  /**
   * *CATAN für Zwei*: whether the turn's one knight-for-chips has been used.
   *
   * @remarks
   * "Bist du an der Reihe, darfst du **einmal** in deinem Zug einen deiner
   * bereits ausgespielten Ritter abgeben." Cleared by {@link nextTurn} like the
   * turn's other allowances.
   */
  readonly knightGiven: boolean;
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
  /** Which game this is - see {@link Mode}. */
  readonly mode: Mode;
  /**
   * *Städte & Ritter*: the knights standing on the 54 crossings.
   *
   * @remarks
   * Its own board rather than a field on {@link Town}, because a knight is not
   * a building: it stands on a **free** crossing, ignores the Abstandsregel
   * entirely, and blocks roads rather than earning anything. The two never
   * share a crossing, which the referee checks in both directions.
   */
  readonly garrison: readonly (Knight | null)[];
  /** The three Fortschrittskarten piles, top card first. */
  readonly decks: Readonly<Record<Track, readonly Progress[]>>;
  /** How far the barbarian ship has sailed, 0 to {@link BARBARIAN_STEPS}. */
  readonly barbarian: number;
  /**
   * Whether the barbarians have ever landed.
   *
   * @remarks
   * The robber is nailed to its stone peninsula until they do - "der Räuber
   * darf zu Beginn des Spiels so lange nicht versetzt werden, bis die Barbaren
   * zum ersten Mal Catan erreicht haben" - and that holds against knights and
   * Fortschrittskarten too, not just against a seven.
   */
  readonly landed: boolean;
  /** Each metropolis, or null while nobody has built that one. */
  readonly metro: Readonly<Record<Track, Metropolis | null>>;
  /** What the event die showed on the last roll. */
  readonly eventDie: "schiff" | Track | null;
  /** What the red die showed, which is what draws Fortschrittskarten. */
  readonly redDie: number | null;
  /** The landscape the Händler stands on, and who put it there. */
  readonly trader: number | null;
  readonly traderOwner: number | null;
  /** Seats still to draw a Fortschrittskarte from this roll. */
  readonly drawing: readonly number[];
  /** A card being played that is waiting for its choice. */
  readonly playing: Progress | null;
  /**
   * *Städte & Ritter*: a knight that has been driven off and must move.
   *
   * @remarks
   * "Die Person, deren Ritter vertrieben wurde, muss diesen auf eine freie
   * Kreuzung innerhalb derselben (eigenen) Handelsroute versetzen." Their
   * choice, not the attacker's - so the turn waits for them.
   */
  readonly displaced: number | null;
  /**
   * *Städte & Ritter*: the seat holding an unspent Baukran discount.
   *
   * @remarks
   * Null almost always. It is a seat rather than a flag because the card is
   * played by one person and cleared when **their** improvement uses it or
   * their turn ends - "nur in der Runde, in der du die Karte ausspielst".
   */
  readonly crane: number | null;
  /** The sort a Handelsflotte is trading 2:1 until the turn ends. */
  readonly fleet: Resource | Commodity | null;
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
export const TOWN_COST: Hand = {
  lehm: 1,
  holz: 1,
  wolle: 1,
  getreide: 1,
  erz: 0,
};

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
  return realSeats(game).length >= CREW_PLAYERS;
}

/** How many Handelschips each side starts *CATAN für Zwei* with. */
export const START_CHIPS = 5;

/** What a chip action costs while you are not ahead. */
export const CHIP_COST = 1;

/** What it costs while you are. */
export const CHIP_COST_AHEAD = 2;

/** Chips for handing in a played knight. */
export const CHIPS_PER_KNIGHT = 2;

/** Chips for founding at the coast, at the desert, and at both. */
export const CHIPS_COAST = 1;
export const CHIPS_DESERT = 2;

/**
 * The seats somebody actually plays.
 *
 * @param game - the game
 * @returns the seat indexes, in order
 * @remarks
 * Everything that counts *people* has to go through this rather than through
 * `players.length`: turn order, the shared Spielzug, who owes a discard, who
 * can win. The two neutral colours of *CATAN für Zwei* are seats on the board
 * and nothing else.
 */
export function realSeats(game: CatanGame): readonly number[] {
  return game.players
    .map((player, seat) => (player.neutral ? -1 : seat))
    .filter((seat) => seat >= 0);
}

/** Whether this is a game of *CATAN für Zwei*. */
export function playingTwo(game: CatanGame): boolean {
  return game.players.some((player) => player.neutral);
}

/**
 * The seat that plays after this one, skipping the neutral colours.
 *
 * @param game - the game
 * @param seat - the seat that has just finished
 * @returns the next seat somebody sits in
 */
export function seatAfter(game: CatanGame, seat: number): number {
  const order = realSeats(game);
  const at = order.indexOf(seat);
  return order[(at + 1) % order.length] ?? seat;
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

/**
 * What Städte & Ritter adds to the target.
 *
 * @remarks
 * "Wer zuerst 13 Siegpunkte erreicht, gewinnt das Spiel." Written as the
 * difference rather than as a fixed thirteen, and for the same reason Die Häfen
 * von Catan adds one: the extra points come from new sources - metropolises,
 * Siegpunkt-Chips, the Händler - so a deliberately short or long game keeps its
 * own length instead of being overruled.
 */
export const RITTER_EXTRA = 3;

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
  const dev = all.filter((card) => card === "siegpunkt").length;
  // Buchdruck and Verfassung. The rulebook has them laid **face up** the moment
  // they are drawn, so they are not really hidden - but they are counted here
  // because this is where "a card that is a point" is counted, and openPoints
  // subtracts the whole of it. Laying them face up is a thing the screen does.
  const cards = player.progress.filter(isPointCard).length;
  return dev + cards;
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
    (sum, town) =>
      town !== null && town.owner === seat ? sum + (town.city ? 2 : 1) : sum,
    0,
  );
  const tiles =
    (game.longest === seat ? TILE_POINTS : 0) +
    // The Größte Rittermacht is not in a game of Städte & Ritter at all -
    // "die Sondersiegpunkttafel Größte Rittermacht lasst ihr in der Schachtel".
    (!playingRitter(game) && game.army === seat ? TILE_POINTS : 0) +
    // Stärkste Häfen, when Die Häfen von Catan is switched on. Held at null
    // otherwise, so this costs nothing in a printed game.
    (game.harbourTile === seat ? TILE_POINTS : 0);
  return (
    built + tiles + ritterPoints(game, seat) + hiddenPoints(game.players[seat])
  );
}

/**
 * What Städte & Ritter adds to a seat's score.
 *
 * @param game - the game
 * @param seat - whose score
 * @returns nothing at all in the printed game
 * @remarks
 * Three sources, and each is worth saying out loud because none of them exists
 * in the base game:
 *
 * - a **metropolis** is two on top of the city it sits on, so a city with one
 *   is worth four,
 * - a **Siegpunkt-Chip** is one, handed out for leading the defence when the
 *   barbarians are beaten,
 * - the **Händler** is one, "solange er bei dir steht" - it moves when somebody
 *   plays the card again, and the point moves with it.
 *
 * The two Fortschritt point cards are counted by {@link hiddenPoints} instead,
 * with the development cards, because they are the same kind of thing.
 */
function ritterPoints(game: CatanGame, seat: number): number {
  let points = 0;
  if (playingRitter(game)) {
    for (const track of TRACKS) {
      if (game.metro[track]?.seat === seat) {
        points += METRO_POINTS;
      }
    }
    points += game.players[seat].victoryChips;
    if (game.traderOwner === seat) {
      points += TRADER_POINTS;
    }
  }
  return points;
}

/** What the Händler is worth to whoever last placed it. */
export const TRADER_POINTS = 1;

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
  /**
   * Laying cards down after a seven.
   *
   * @remarks
   * `goods` only ever carries anything in Städte & Ritter, where Handelswaren
   * count towards the limit and so have to be able to pay it. A hand of nine
   * Papier and no resources would otherwise owe four cards it could not give.
   */
  | { readonly kind: "discard"; readonly cards: Hand; readonly goods?: Goods }
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
  /**
   * *CATAN für Zwei*: the free piece in a neutral colour.
   *
   * @remarks
   * Carries the colour as well as the place, because the choice the rulebook
   * gives is "eine beliebige der beiden neutralen Farben" - which colour is
   * half the decision, and often the whole of it.
   */
  | { readonly kind: "neutral"; readonly seat: number; readonly at: number }
  /** *CATAN für Zwei*: a Handelschip action. */
  | { readonly kind: "chip"; readonly action: "swap" | "robber" }
  /** *CATAN für Zwei*: hand a played knight back in for two chips. */
  | { readonly kind: "knightIn" }
  /** *Städte & Ritter*: take the next step of one of the three city tracks. */
  | { readonly kind: "improve"; readonly track: Track }
  /** *Städte & Ritter*: put a city wall up. */
  | { readonly kind: "wall" }
  /** *Städte & Ritter*: put a knight on a crossing. */
  | { readonly kind: "knight"; readonly at: number }
  /** *Städte & Ritter*: give a knight its helmet, for one Getreide. */
  | { readonly kind: "activate"; readonly at: number }
  /** *Städte & Ritter*: raise a knight a strength. */
  | { readonly kind: "upgrade"; readonly at: number }
  /**
   * *Städte & Ritter*: send a knight somewhere.
   *
   * @remarks
   * One move for three things the rulebook lists apart - moving, driving a
   * weaker knight off, and answering a displacement - because on the board they
   * are the same gesture: this knight goes to that crossing. What differs is
   * what is standing there, which the referee can see for itself.
   */
  | { readonly kind: "march"; readonly from: number; readonly to: number }
  /** *Städte & Ritter*: chase the robber off with a knight. */
  | { readonly kind: "chase"; readonly at: number }
  /** *Städte & Ritter*: play a Fortschrittskarte. */
  | { readonly kind: "progress"; readonly card: Progress }
  /**
   * *Städte & Ritter*: the answer a Fortschrittskarte was waiting for.
   *
   * @remarks
   * One move for all of them, the way {@link CatanMove} already does it for the
   * event cards. Which of these fields matters is decided by
   * {@link CatanGame.playing} - the card on the table knows what it asked, and
   * a dozen near-identical move kinds would only spread that knowledge out.
   */
  | {
      readonly kind: "answerCard";
      readonly sort?: Resource;
      readonly good?: Commodity;
      readonly at?: number;
      readonly to?: number;
      readonly seat?: number;
      readonly track?: Track;
      readonly dice?: readonly [number, number];
      readonly cards?: Hand;
      readonly goods?: Goods;
      readonly card?: Progress;
    }
  /** *CATAN für Zwei*: the two cards going back after a Zwangshandel. */
  | { readonly kind: "giveBack"; readonly cards: Hand }
  | { readonly kind: "endTurn" };
