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
import type { FishAction, Ground } from "./fischer";
import {
  overrun,
  prisonerPoints,
  raiding,
  type Fort,
  type RaidCard,
} from "./barbaren";
import { goldPoints, type Rivers } from "./fluesse";
import {
  findPoints,
  finding,
  missionPoints,
  type Spice,
  type Boat,
  type Camp,
  type Cargo,
} from "./entdecker";
import {
  cloth,
  clothPoints,
  islandPoints,
  overrunByPirates,
} from "./seefahrer";
import {
  HAUL_POINT_CARDS,
  haulPoints,
  hauling,
  type Depot,
  type HaulCard,
  type Ware,
} from "./handel";
import { wagonPoints, type Caravan, type Trail, type Vote } from "./karawane";
import { isPointCard, type HeldCard, type Progress } from "./progress";

/** The five things the island produces. */
export type Resource = "lehm" | "holz" | "wolle" | "getreide" | "erz";

/**
 * A landscape: one of the five, the desert, or the lake.
 *
 * @remarks
 * The lake belongs to *Fischfang auf Catan* and takes the desert's place there.
 * Like the desert it grows nothing - but unlike it, it is a **fishing area**
 * and pays fish on any of four numbers, which is why it is a landscape of its
 * own rather than a desert with a note attached.
 */
export type Land =
  | Resource
  | "wueste"
  | "see"
  | "sumpf"
  | "wasserstelle"
  /** The castle knights are trained in. */
  | "burg"
  /** One of the three sites of Händler & Barbaren. */
  | "ziel"
  /** Open water, in Seefahrer. */
  | "meer"
  /** A Goldfluss, which pays a resource of the holder's own choosing. */
  | "gold"
  /**
   * A Fischfeld, in *Fische für Catan*.
   *
   * @remarks
   * Water, not a landscape: nothing is built at it and no number chip lies on
   * it. The die number printed on it belongs to {@link CatanGame.fish} and
   * calls a shoal onto the water rather than a resource into a hand.
   */
  | "fisch"
  /**
   * A Gewürzfeld, in *Gewürze für Catan*.
   *
   * @remarks
   * An island with a village on it. Land, but a strange sort: "du darfst erst
   * dann eine Straße an den Wegen oder eine Siedlung auf den Kreuzungen eines
   * Gewürzfelds bauen, wenn du eine Einheit auf dem Dorf des Felds abgesetzt
   * hast" - the village has to be befriended first.
   */
  | "gewuerz"
  /** Still face down, in Entdecker & Piraten. */
  | "unbekannt";

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

/**
 * Every kind of field there is.
 *
 * @remarks
 * A record of `Land` rather than a list, for the reason {@link PHASES} gives:
 * the type checker counts the entries, a reader of saved games cannot. The
 * hand-written copy in the loader was missing "fisch" and threw away every
 * saved game of *Fische für Catan*.
 */
const LAND_SET: Readonly<Record<Land, true>> = {
  lehm: true,
  holz: true,
  wolle: true,
  getreide: true,
  erz: true,
  wueste: true,
  see: true,
  sumpf: true,
  wasserstelle: true,
  burg: true,
  ziel: true,
  meer: true,
  gold: true,
  fisch: true,
  gewuerz: true,
  unbekannt: true,
};

/** The names of every kind of field, for anything that has to check one. */
export const LAND_KINDS: readonly Land[] = Object.keys(LAND_SET) as Land[];

/** What each landscape produces. */
export const YIELD: Readonly<Record<Land, Resource | null>> = {
  lehm: "lehm",
  holz: "holz",
  wolle: "wolle",
  getreide: "getreide",
  erz: "erz",
  wueste: null,
  see: null,
  // The marshes at the two river sources. Like the desert they grow nothing -
  // and they carry no number chip either, so they never come up at all.
  sumpf: null,
  wasserstelle: null,
  burg: null,
  ziel: null,
  meer: null,
  // A Goldfluss pays a resource, but which one is the holder's choice - so
  // there is nothing to look up here.
  gold: null,
  // A Fischfeld is water: its number calls a shoal, not a resource.
  fisch: null,
  // A Gewürzfeld pays spices, and those are not resource cards.
  gewuerz: null,
  // Face down: nobody knows yet, and nothing pays out.
  unbekannt: null,
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

/**
 * Which scenario of *Händler & Barbaren* is on the table.
 *
 * @remarks
 * A third axis beside {@link Mode} and {@link Variant}, and it is the one that
 * changes the **board**: the fishing scenario replaces the desert with a lake
 * and lays fishing grounds round the coast. One at a time - each brings its own
 * material and its own map.
 */
export type Scenario =
  | "keins"
  | "fischer"
  | "fluesse"
  | "karawane"
  | "barbaren"
  | "handel"
  /** *Seefahrer*, free game: an archipelago dealt at random. */
  | "neuewelt"
  /** *Entdecker & Piraten*, scenario 1: Land in Sicht. */
  | "entdecker"
  /** *Entdecker & Piraten*, scenario 2: Die Piratenlager. */
  | "piraten"
  /** *Entdecker & Piraten*, Szenario 3: Fische für Catan. */
  | "fische"
  /** *Entdecker & Piraten*, Szenario 4: Gewürze für Catan. */
  | "gewuerze"
  /** *Entdecker & Piraten*, Szenario 5: alle drei Missionen. */
  | "finale"
  /** *Seefahrer*, Szenario 1: Zu neuen Ufern. */
  | "ufer"
  /** *Seefahrer*, Szenario 2: Die vier Inseln. */
  | "inseln"
  /** *Seefahrer*, Szenario 3: Ozeanien. */
  | "ozeanien"
  /** *Seefahrer*, Szenario 4: Durch die Wüste. */
  | "wuestengurt"
  /** *Seefahrer*, Szenario 5: Der vergessene Stamm. */
  | "stamm"
  /** *Seefahrer*, Szenario 6: Stoffe für Catan. */
  | "stoffe"
  /** *Seefahrer*, Szenario 7: Die Pirateninseln. */
  | "pirateninseln"
  /** *Seefahrer*, Szenario 8: Die Catanischen Wunder. */
  | "wunder";

/** The scenarios, in the order the rulebook teaches them. */
export const SCENARIOS: readonly Scenario[] = [
  "keins",
  "fischer",
  "fluesse",
  "karawane",
  "barbaren",
  "handel",
  "neuewelt",
  "entdecker",
  "piraten",
  "fische",
  "gewuerze",
  "finale",
  "ufer",
  "inseln",
  "ozeanien",
  "wuestengurt",
  "stamm",
  "stoffe",
  "pirateninseln",
  "wunder",
];

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
  /**
   * *Entdecker & Piraten*: whether this is a Hafensiedlung.
   *
   * @remarks
   * Its own flag rather than a third value of {@link Town.city}, because it is
   * a different thing: a city doubles the yield, a Hafensiedlung does not -
   * "für eine Hafensiedlung gibt es weiterhin nur 1 Rohstoff" - and it is worth
   * two points where a city is worth two for a different reason.
   */
  readonly port?: boolean;
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
  /**
   * Fortschrittskarten held face down, plus the face-up victory points.
   *
   * @remarks
   * {@link HeldCard} rather than {@link Progress}: over the wire the cards of
   * everybody but their owner are backs, and a back is not a card. The referee
   * only ever works from the host's unredacted state, so it never meets one.
   */
  readonly progress: readonly HeldCard[];
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
  /**
   * *Die Flüsse von Catan*: gold coins.
   *
   * @remarks
   * Not a resource - "Gold zählt nicht als Rohstoff. Es darf daher beim
   * Versetzen des Räubers nicht gestohlen werden." It is traded, spent two at a
   * time for a resource from the bank, and it decides the two tiles.
   */
  readonly gold: number;
  /** Bridges still in the box - three for the whole game. */
  readonly bridgesLeft: number;
  /**
   * *Der Barbarenüberfall*: barbarians this seat has taken prisoner.
   *
   * @remarks
   * "Jeweils 2 Gefangene zählen 1 Siegpunkt." Kept as a count rather than as
   * pieces, because that is all the rulebook ever asks of them.
   */
  readonly prisoners: number;
  /** *Händler & Barbaren*: where the Trosswagen stands, as a crossing. */
  readonly wagon: number | null;
  /** Which step of the Wagen-Tableau, counted from zero. */
  readonly level: number;
  /** The load on board, if there is one. */
  readonly ware: Ware | null;
  /** How many loads have been delivered - each is a victory point. */
  readonly delivered: number;
  /** Movement points left in the drive that is running. */
  readonly moves: number;
  /** Whether the Getreide has already been spent on this drive. */
  readonly boosted: boolean;
  /** This scenario's cards, which are held rather than played at once. */
  readonly haul: readonly HaulCard[];
  /** *Seefahrer*: ships still in the box. */
  readonly shipsLeft: number;
  /** The islands this seat founded on, which are never foreign to them. */
  readonly homeIslands: readonly number[];
  /** Siegpunkt-Chips for first settlements on foreign islands. */
  readonly islandChips: number;
  /**
   * *Stoffe für Catan*: how many bales of cloth this seat has gathered.
   *
   * @remarks
   * "2 Stoffballen sind 1 Siegpunkt wert", so they are counted rather than
   * converted: an odd one is worth nothing until its partner arrives.
   */
  readonly bales: number;
  /** *Entdecker & Piraten*: ships still in the box. */
  readonly boatsLeft: number;
  /** Explorers still in the box. */
  readonly scoutsLeft: number;
  /** Harbour settlements still in the box. */
  readonly portsLeft: number;
  /** *Die Piratenlager*: units still in the box. */
  readonly unitsLeft: number;
  /**
   * *Fischfang auf Catan*: the fish tiles in front of this player.
   *
   * @remarks
   * Each entry is the number of fish on a tile. Face down at a table - "Fisch-
   * plättchen legst du immer verdeckt vor dir ab" - and not resources: they do
   * not count towards a seven and cannot be stolen or traded.
   */
  readonly fish: readonly number[];
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
  /**
   * A settlement first, then the road beside it.
   *
   * @remarks
   * *Entdecker & Piraten* adds a third: the founding settlement is followed by
   * a road **and** an Entdeckerschiff - "legt als Erstes eine Straße an ihre
   * Siedlung an und setzt dann ein Entdeckerschiff ... ein".
   */
  readonly placing: "town" | "road" | "boat";
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
  /**
   * *Der Handelstross*: the table is deciding where the next wagon goes.
   *
   * @remarks
   * Its own phase because it happens **between** two turns and asks everybody,
   * not just whoever is active: "beginnend mit der Person, die gerade an der
   * Reihe war ..., dürfen alle nacheinander im Uhrzeigersinn offen eine oder
   * mehrere Wolle- oder Getreidekarten auslegen". {@link CatanGame.vote} says
   * how far the round has got.
   */
  | "vote"
  /**
   * *Der Barbarenüberfall*: a knight bought this turn is waiting for its path.
   *
   * @remarks
   * "Kaufst du eine Entwicklungskarte, musst du sie sofort aufdecken und die
   * Anweisungen der Karte ausführen" - so the card is not held, it is answered,
   * and Ritterweihe and Starker Ritter both ask where.
   */
  | "posting"
  /** *Der Barbarenüberfall*: Verrat or Gefangen is moving barbarians. */
  | "barbarians"
  /**
   * *Der Barbarenüberfall*: the knights ride, at the end of the turn.
   *
   * @remarks
   * "Am Ende deines Zuges, also nach der Handels- und Bauphase, darfst du jeden
   * deiner Ritter bis zu 3 Wege weit bewegen." After the building, so it is a
   * phase of its own rather than another thing the trade phase allows.
   */
  | "knights"
  /**
   * *Händler & Barbaren*: the Trosswagen drives.
   *
   * @remarks
   * "Am Ende deines Zuges, also nach deiner Handels- und Bauphase, darfst du
   * deinen Trosswagen bewegen." Its own phase, because it is a run of decisions
   * - one step at a time, each with its own price - and not one move.
   */
  | "driving"
  /** *Händler & Barbaren*: a barbarian has to be put somewhere. */
  | "shifting"
  /**
   * *Seefahrer*: the Seeräuber is waiting for a sea field.
   *
   * @remarks
   * Its own phase because a seven offers a **choice** here: "würfelst du eine
   * '7', kannst du wählen, ob du entweder den Seeräuber versetzen willst oder
   * den Räuber."
   */
  | "pirate"
  /**
   * *Entdecker & Piraten*: the ships sail, at the end of the turn.
   *
   * @remarks
   * "Hast du deine Handels- und Bauphase abgeschlossen, beginnt deine
   * Bewegungsphase ... Handeln und Bauen ist während oder nach dieser Phase
   * nicht erlaubt." A phase of its own, and a one-way door.
   */
  | "sailing"
  /**
   * *Die Piratenlager*: a pirate ship has been driven off and yours goes down.
   *
   * @remarks
   * "Anschliessend setzt du dein eigenes Piratenschiff auf einem beliebigen
   * erlaubten Meerfeld ein. Jetzt ziehst du noch einen Rohstoff." Its own phase
   * because it interrupts the movement, and the drive-off is what earned it.
   */
  | "corsair"
  /**
   * *Seefahrer*: a Goldfluss has paid and everybody owed picks their sort.
   *
   * @remarks
   * "Die Rohstoffart dürfen sich alle selbst aussuchen" - so a gold river is a
   * queue of choices, one per seat with a building at it, exactly the way an
   * event card is answered.
   */
  | "goldPick"
  | "gameOver";

/**
 * Every phase there is.
 *
 * @remarks
 * Written as a record rather than a list, because a record of `Phase` is
 * **exhaustive**: a new phase that is not named here is a compile error. A
 * plain list is not, and that is exactly how the reader of a saved game came to
 * be missing eight of them at once - a session saved in any of those was
 * silently thrown away. See {@link isCatanGame}.
 */
const PHASE_SET: Readonly<Record<Phase, true>> = {
  founding: true,
  roll: true,
  discard: true,
  robber: true,
  steal: true,
  trade: true,
  monopol: true,
  erfindung: true,
  event: true,
  neutral: true,
  swap: true,
  displaced: true,
  progress: true,
  vote: true,
  posting: true,
  barbarians: true,
  knights: true,
  driving: true,
  shifting: true,
  pirate: true,
  sailing: true,
  corsair: true,
  goldPick: true,
  gameOver: true,
};

/** The names of every phase, for anything that has to check one. */
export const PHASES: readonly Phase[] = Object.keys(PHASE_SET) as Phase[];

/**
 * One of the five Catanian wonders.
 *
 * @remarks
 * "Legt die 5 Wunderplättchen Große Mauer, Große Brücke, Monument, Großes
 * Theater und Burg bereit."
 */
export type Wonder = "mauer" | "bruecke" | "monument" | "theater" | "burg";

/**
 * What lies as a gift on a coastline of *Der vergessene Stamm*.
 *
 * @remarks
 * "Legt 8 Siegpunkt-Chips auf die markierten Küstenlinien. Mischt die 6 Häfen
 * verdeckt und legt sie auf die markierten Plätze ... Nehmt die obersten 4
 * Karten vom gemischten Stapel mit den Entwicklungskarten und legt diese
 * verdeckt auf die markierten Plätze."
 */
export type Gift =
  | { readonly kind: "chip" }
  | { readonly kind: "card" }
  | { readonly kind: "harbour"; readonly want: Resource | null };

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
  /** Which scenario, if any - see {@link Scenario}. */
  readonly scenario: Scenario;
  /**
   * *Fischfang auf Catan*: the six fishing grounds round the coast.
   *
   * @remarks
   * Worked out once when the board is laid and carried with it, because they
   * are part of the map rather than of the rules - the same reason the harbours
   * are stored rather than recomputed.
   */
  readonly grounds: readonly Ground[];
  /**
   * *Fischfang auf Catan*: the face-down fish tiles still to be drawn.
   *
   * @remarks
   * Each entry is the number of fish on a tile; {@link OLD_SHOE} is the Alter
   * Schuh. "Gibt es keine verdeckten Fischplättchen mehr, dreht ihr die offen
   * liegenden Plättchen um, mischt sie und bildet damit den neuen Vorrat" - so
   * the spent pile is kept and shuffled back rather than lost.
   */
  readonly fishPile: readonly number[];
  readonly fishSpent: readonly number[];
  /** Who holds the Alter Schuh, and so needs a point more to win. */
  readonly shoe: number | null;
  /** *Die Flüsse von Catan*: where the water runs and what it touches. */
  readonly rivers: Rivers;
  /** The bridges built, by path, or null where there is none. */
  readonly bridges: readonly (number | null)[];
  /** Who holds *Reichster Cataner*, or null while nobody leads alone. */
  readonly richest: number | null;
  /** Everybody holding *Armer Cataner* - possibly all of them. */
  readonly poorest: readonly number[];
  /** How many resources this turn has already been bought with gold. */
  readonly goldBuys: number;
  /** *Der Handelstross*: the watering hole and the three arrows. */
  readonly trail: Trail;
  /** The wagons on the board, by path: which caravan, or null. */
  readonly wagons: readonly (number | null)[];
  /** The three caravans, each with its head and its wagons. */
  readonly caravans: readonly Caravan[];
  /** Wagons still in the supply. */
  readonly wagonsLeft: number;
  /** The voting round on the table, or null. */
  readonly vote: Vote | null;
  /**
   * Whether the active seat has built a settlement or a city this turn.
   *
   * @remarks
   * "Baust du in deinem Zug eine oder mehrere Siedlungen oder baust eine oder
   * mehrere Siedlungen zu einer Stadt aus, wird nach Beendigung deines Zuges
   * genau 1 Trosswagen eingesetzt." One wagon however much was built, so this
   * is a flag and not a count.
   */
  readonly built: boolean;
  /** *Der Barbarenüberfall*: the castle, the desert and the coast. */
  readonly fort: Fort;
  /** How many barbarians stand on each landscape. */
  readonly barbarians: readonly number[];
  /** Barbarians still beside the board. */
  readonly barbariansLeft: number;
  /** The knights on the paths: the seat that owns one, or null. */
  readonly guards: readonly (number | null)[];
  /** The knights that have already ridden this turn, by path. */
  readonly ridden: readonly number[];
  /** This scenario's own development deck, top card first. */
  readonly raidDeck: readonly RaidCard[];
  /** The cards already played, which are shuffled back when the deck runs out. */
  readonly raidUsed: readonly RaidCard[];
  /** The card being answered, if one is. */
  readonly raidCard: RaidCard | null;
  /** Where a knight bought this turn may go. */
  readonly posting: "castle" | "any" | null;
  /** How many barbarians a card still has to take, and then to put down. */
  readonly barbTake: number;
  readonly barbPut: number;
  /** Which orientation the colour die last cost everybody a knight on. */
  readonly lastLie: number | null;
  /** *Händler & Barbaren*: the three sites and their stacks. */
  readonly depots: readonly Depot[];
  /** The barbarians left over, by path. */
  readonly raiders: readonly boolean[];
  /** This scenario's own development deck, top card first. */
  readonly haulDeck: readonly HaulCard[];
  /** The cards played, shuffled back when the deck runs out. */
  readonly haulUsed: readonly HaulCard[];
  /**
   * Whether a barbarian being shifted may take a card with it.
   *
   * @remarks
   * A seven and the Ritter card both shift one and both draw; driving one off
   * with the wagon shifts one and explicitly does **not** - "darfst du, im
   * Gegensatz zum Fall einer gewürfelten '7', keine Rohstoffkarte ziehen".
   */
  readonly shiftDraws: boolean;
  /** Whether the acting seat still owes a second drive from Gute Reise. */
  readonly secondDrive: boolean;
  /** *Seefahrer*: the ships on the board, by path, or null. */
  readonly ships: readonly (number | null)[];
  /** The ships built this turn, which may not be moved again in it. */
  readonly freshShips: readonly number[];
  /** Whether a ship has already been moved this turn. */
  readonly shipMoved: boolean;
  /** Which sea field the Seeräuber sits on, or -1. */
  readonly pirate: number;
  /** How many free resources each seat still has to pick from a Goldfluss. */
  readonly goldOwed: readonly number[];
  /** *Entdecker & Piraten*: the ships on the water. */
  readonly boats: readonly Boat[];
  /** What lies under each face-down field, and the chip that comes with it. */
  readonly hidden: readonly Land[];
  readonly hiddenChips: readonly number[];
  /** The ship whose journey is running, by its place in {@link CatanGame.boats}. */
  readonly sailing: number | null;
  /** *Die Piratenlager*: the camps, by the field they sit on. */
  readonly camps: Readonly<Record<number, Camp>>;
  /**
   * The one pirate ship on the board, and whose it is.
   *
   * @remarks
   * "Es befindet sich somit immer nur ein Piratenschiff auf dem Spielfeld" -
   * placing yours takes the other one off, so there is never a list of them.
   */
  readonly pirateShip: { readonly owner: number; readonly hex: number } | null;
  /** The ships that have paid the pirate their tribute this turn. */
  readonly tributes: readonly number[];
  /** The ships that have already tried to drive the pirate off this turn. */
  readonly chased: readonly number[];
  /** How far along the mission track each seat has come. */
  readonly mission: readonly number[];
  /**
   * *Fische für Catan*: the die number of each Fischfeld, by field.
   *
   * @remarks
   * Kept apart from {@link CatanGame.chips} because it is not a chip: it is one
   * die of 1 to 6, it pays nobody when the two dice come up, and it is read
   * only by the roll that calls a shoal.
   */
  readonly fish: Readonly<Record<number, number>>;
  /** The fields a shoal is lying on. */
  readonly shoals: readonly number[];
  /** How many of the six shoals are still in the supply. */
  readonly shoalsLeft: number;
  /** Whether this turn's one try at calling a shoal has been used. */
  readonly cast: boolean;
  /** How far along the fish mission's track each seat has come. */
  readonly catches: readonly number[];
  /**
   * *Gewürze für Catan*: what each village is worth, by its field.
   *
   * @remarks
   * The advantage itself is not stored per seat: it follows from
   * {@link CatanGame.villages}, which says who has a unit standing where.
   */
  readonly spice: Readonly<Record<number, Spice>>;
  /** Which seats have set a unit down on each village. */
  readonly villages: Readonly<Record<number, readonly number[]>>;
  /** How many spice sacks are still lying on each village. */
  readonly sacks: Readonly<Record<number, number>>;
  /** How far along the spice mission's track each seat has come. */
  readonly spices: readonly number[];
  /** How many resources this seat has sold for gold in this turn. */
  readonly sold: number;
  /**
   * *Die Catanischen Wunder*: which wonder each seat is building, and how far.
   *
   * @remarks
   * "Wer zuerst mit dem Bau eines Wunders beginnt, kann frei unter allen fünf
   * Wundern auswählen. Wer erst später anfängt ..., muss mit den Wundern
   * vorliebnehmen, die noch übrig sind" - so a wonder belongs to one colour
   * from the moment it is claimed, and "nun musst du dieses Wunder auch bauen".
   */
  readonly wonders: readonly ({
    readonly kind: Wonder;
    readonly stage: number;
  } | null)[];
  /**
   * *Die Pirateninseln*: the pirate fortresses, by the crossing they stand on.
   *
   * @remarks
   * "Jede Piratenfestung besteht aus 3 gleichfarbigen Piratenfestungs-Chips,
   * auf die jeweils 1 Siedlung derselben Farbe gesetzt wird." The settlement is
   * there from the start and pays nothing while the chips are: "hat eine
   * Piratenfestung alle 3 Chips verloren, sind die Piraten vertrieben und die
   * Siedlung ist zurückerobert. Ab jetzt erhältst du die Erträge und den
   * Siegpunkt für diese Siedlung."
   */
  readonly forts: Readonly<
    Record<number, { readonly owner: number; readonly chips: number }>
  >;
  /** The crossing on the pirate islands each colour may build on. */
  readonly marks: readonly number[];
  /** Which sea paths carry a warship rather than an ordinary ship. */
  readonly warships: readonly number[];
  /** Where the pirate fleet stands on its round trip, as a step of the circuit. */
  readonly armada: number;
  /** Whether this turn's one attack on a fortress has been made. */
  readonly stormed: boolean;
  /**
   * *Stoffe für Catan*: the villages of the tribe, by the crossing they sit on.
   *
   * @remarks
   * "Auf die 4 kleinen Inseln legt ihr je 2 Zahlenchips, genau auf die Kreuzung
   * (jeder Zahlenchip stellt ein Dorf dar). Zu jedem der 8 Dörfer werden 5
   * Stoffballen gelegt." So a village is a number and a stock of cloth, and it
   * stands on a crossing rather than on a field.
   */
  readonly villagesOf: Readonly<
    Record<number, { readonly number: number; readonly bales: number }>
  >;
  /** Who has a trade relation with each village, by crossing. */
  readonly traders: Readonly<Record<number, readonly number[]>>;
  /** How many bales are left in the general supply. */
  readonly baleStock: number;
  /** The ships that belong to a closed trade line and may not be moved. */
  readonly lockedShips: readonly number[];
  /**
   * *Der vergessene Stamm*: the gifts lying on the coastlines, by sea path.
   *
   * @remarks
   * "Die Geschenke des fremden Volkes bestehen aus Siegpunkt-Chips,
   * Entwicklungskarten und den offen ausliegenden Häfen." A ship built or moved
   * onto such a path takes what lies there, and it is not replaced.
   *
   * Named `presents` because `gifts` is taken - by the resources an Erfindung
   * card still owes.
   */
  readonly presents: Readonly<Record<number, Gift>>;
  /**
   * The harbours taken as gifts and not yet put anywhere, by seat.
   *
   * @remarks
   * "Besitzt du keine Küstensiedlung, die für den Hafen in Frage kommt,
   * bewahrst du ihn auf, bis du eine Küstensiedlung baust, die noch keinen
   * Hafen hat."
   */
  readonly heldPorts: readonly (readonly (Resource | null)[])[];
  /**
   * Where the robber started, while it is still standing there.
   *
   * @remarks
   * "Hat er die Startwüste verlassen, darf er nicht mehr dorthin zurückgesetzt
   * werden" - so the field has to be remembered, not only the robber's place.
   */
  readonly robberHome: number | null;
  /**
   * The sea field the Catanischer Rat lies on, with its two harbours.
   *
   * @remarks
   * "Das Feld Catanischer Rat zählt als Meerfeld, daher dürfen keine Straßen an
   * seinen Meerwegen und keine Siedlungen an seinen Kreuzungen gebaut werden.
   * Ausgenommen sind die beiden Ecken und der Meerweg, die an der Startinsel
   * liegen." It is a sea field like any other, so those exceptions need no rule
   * of their own: a crossing beside the island is beside a landscape too.
   */
  readonly council: number | null;
  /**
   * What is waiting in each Hafensiedlung's basin, by crossing.
   *
   * @remarks
   * On the board and not with the player, because that is where it stands: "eine
   * Hafensiedlung besitzt ein Hafenbecken, in das 2 kleine Spielfiguren oder 1
   * große hineinpassen", and a ship pointing at it can load from it.
   */
  readonly docks: Readonly<Record<number, readonly Cargo[]>>;
  /**
   * The paths already rolled against in the drive that is running.
   *
   * @remarks
   * "Würfelst du eine andere Zahl, hast du den Barbaren nicht vertrieben und
   * musst entweder auf der Kreuzung stehen bleiben oder in eine andere Richtung
   * weiterziehen." One try, so a failed roll has to be remembered - otherwise
   * the try is free and repeats until it works.
   */
  readonly shoved: readonly number[];
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
  /**
   * The three Fortschrittskarten piles, top card first.
   *
   * @remarks
   * {@link HeldCard} for the same reason the players' cards are: what is still
   * in a pile is nobody's business, so over the wire the piles are backs. Only
   * the host draws from them, and it draws from the real ones.
   */
  readonly decks: Readonly<Record<Track, readonly HeldCard[]>>;
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

/**
 * Whether this is a game of *CATAN für Zwei*.
 *
 * @remarks
 * The two neutral colours alone are not the variant. *Entdecker & Piraten* has
 * them on the board as well and none of its rules: "die Figuren der nicht
 * gewählten Farben bleiben auf der Startinsel als **Hindernis** stehen" - they
 * stand in the way and do nothing else. No second roll, no Handelschips, no
 * free neutral piece each turn.
 */
export function playingTwo(game: CatanGame): boolean {
  return !finding(game) && game.players.some((player) => player.neutral);
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
  // The three of Händler & Barbaren are the same thing again: "decke diese
  // Karte erst auf, wenn du mit ihr die zum Sieg erforderliche Anzahl
  // Siegpunkte besitzt."
  const hauled = player.haul.filter((card) =>
    HAUL_POINT_CARDS.includes(card),
  ).length;
  return dev + cards + hauled;
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
  const built = finding(game)
    ? // Entdecker & Piraten counts its own buildings - see findPoints - and a
      // Hafensiedlung is worth two where a city is worth two for another
      // reason. Counting both would count every building twice.
      0
    : game.towns.reduce(
        (sum, town, at) =>
          // "Gilt sie als erobert und zählt keinen Siegpunkt mehr."
          town !== null &&
          town.owner === seat &&
          !overrun(game, at) &&
          // "Hat eine Piratenfestung alle 3 Chips verloren ... ab jetzt
          // erhältst du die Erträge und den Siegpunkt für diese Siedlung" - so
          // until then it counts nothing.
          !overrunByPirates(game, at)
            ? sum + (town.city ? 2 : 1)
            : sum,
        0,
      );
  const tiles =
    // "Den Räuber und die Längste Handelsroute gibt es in diesem Szenario
    // nicht."
    // "Die Längste Handelsroute entfällt in diesem Szenario, die Größte
    // Rittermacht könnt ihr jedoch weiterhin erlangen."
    (game.longest === seat && !hauling(game) && !cloth(game)
      ? TILE_POINTS
      : 0) +
    // The Größte Rittermacht is not in a game of Städte & Ritter at all -
    // "die Sondersiegpunkttafel Größte Rittermacht lasst ihr in der Schachtel".
    // "Den Räuber und die Sondersiegpunkttafel Größte Rittermacht benötigt ihr
    // nicht" - the barbarian scenario leaves it in the box too.
    (!playingRitter(game) && !raiding(game) && game.army === seat
      ? TILE_POINTS
      : 0) +
    // Stärkste Häfen, when Die Häfen von Catan is switched on. Held at null
    // otherwise, so this costs nothing in a printed game.
    (game.harbourTile === seat ? TILE_POINTS : 0);
  return (
    built +
    tiles +
    ritterPoints(game, seat) +
    // Reichster Cataner is one up, Armer Cataner two down.
    goldPoints(game, seat) +
    // One up for every settlement or city a caravan runs through.
    wagonPoints(game, seat) +
    // One up for every two barbarians taken prisoner.
    prisonerPoints(game, seat) +
    // One up for every delivered load, and one for the finished tableau.
    haulPoints(game, seat) +
    // One up for every foreign island settled first.
    islandPoints(game, seat) +
    // "2 Stoffballen sind 1 Siegpunkt wert."
    clothPoints(game, seat) +
    // Entdecker & Piraten counts its own buildings: a Hafensiedlung is two.
    findPoints(game, seat) +
    // And the mission track, with its own victory point tile on top.
    missionPoints(game, seat) +
    hiddenPoints(game.players[seat])
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
  | {
      /**
       * Trading with the bank or at a harbour.
       *
       * @remarks
       * Both sides may be a Handelsware in Städte & Ritter: "Die
       * Handelsmöglichkeiten aus CATAN - Das Spiel bleiben unverändert
       * erhalten. Sie gelten auch für die Handelswaren ... Ihr könnt in jede
       * Richtung tauschen: Handelswaren gegen Rohstoffe, Rohstoffe gegen
       * Handelswaren, Handelswaren gegen Handelswaren, Rohstoffe gegen
       * Rohstoffe."
       */
      readonly kind: "bank";
      readonly give: Resource | Commodity;
      readonly want: Resource | Commodity;
    }
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
  /**
   * *CATAN für Zwei*: a Handelschip action.
   *
   * @remarks
   * Two of them at an ordinary table, and a third where *Der Barbarenüberfall*
   * takes the robber out of the game: "da es keinen Räuber gibt, darf man mit 1
   * Handelschip ... einen Barbaren auf ein anderes Küstenfeld versetzen."
   */
  | {
      readonly kind: "chip";
      readonly action: "swap" | "robber" | "barbarian";
    }
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
  /**
   * *Fischfang auf Catan*: hand fish tiles in for one of the five actions.
   *
   * @remarks
   * `tiles` names them by their place in the hand rather than by value,
   * because a hand of three ones and the intent to spend two of them cannot be
   * said any other way.
   */
  | {
      readonly kind: "fish";
      readonly action: FishAction;
      readonly tiles: readonly number[];
    }
  /** *Fischfang auf Catan*: pass the Alter Schuh to somebody not behind you. */
  | { readonly kind: "shoe"; readonly seat: number }
  /** *Die Flüsse von Catan*: build a bridge on one of the seven sites. */
  | { readonly kind: "bridge"; readonly at: number }
  /** *Die Flüsse von Catan*: two gold for a resource, twice a turn. */
  | { readonly kind: "goldBuy"; readonly sort: Resource }
  /** *Die Flüsse von Catan*: resources to the bank for one gold. */
  | { readonly kind: "goldSell"; readonly sort: Resource }
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
  /**
   * *Der Handelstross*: laying wool and grain down as votes.
   *
   * @remarks
   * An empty hand is a pass, which the rulebook allows and the voting round
   * needs: "nur die Personen, die mindestens eine Karte ausgelegt haben,
   * verhandeln untereinander".
   */
  | { readonly kind: "lay"; readonly cards: Hand }
  /** *Der Handelstross*: putting all of one's votes on one position. */
  | { readonly kind: "vote"; readonly at: number }
  /** *Der Handelstross*: placing the wagon the table has decided on. */
  | { readonly kind: "wagon"; readonly at: number }
  /** *Der Barbarenüberfall*: where the knight a card just bought goes. */
  | { readonly kind: "post"; readonly at: number }
  /** *Der Barbarenüberfall*: which field a card takes a barbarian from or to. */
  | { readonly kind: "barb"; readonly at: number }
  /**
   * *Der Barbarenüberfall*: one knight rides.
   *
   * @remarks
   * `far` is the Getreide: "zahlst du 1 Getreide, darfst du 1 Ritter 2 Wege
   * weiter ziehen", and it is paid per knight, so it rides with the move.
   */
  | {
      readonly kind: "ride";
      readonly from: number;
      readonly to: number;
      readonly far?: boolean;
    }
  /** *Die Piratenlager*: build a unit in a harbour basin or a waiting ship. */
  | { readonly kind: "unit"; readonly at: number }
  /** *Die Piratenlager*: set the ship's units down on a camp. */
  | { readonly kind: "storm"; readonly at: number }
  /** *Die Piratenlager*: roll one ship against the pirate ship. */
  | { readonly kind: "hunt"; readonly boat: number }
  /** *Die Piratenlager*: put one's own pirate ship on a sea field. */
  | { readonly kind: "corsair"; readonly at: number }
  /** *Gewürze für Catan*: set a unit down on a village and load a sack. */
  | { readonly kind: "drop"; readonly at: number }
  /** *Gewürze für Catan*: a Gutes-Gold village buys one resource. */
  | { readonly kind: "sell"; readonly sort: Resource }
  /** *Die Pirateninseln*: attack the fortress of one's own colour. */
  | { readonly kind: "assault" }
  /** *Die Catanischen Wunder*: claim a wonder, or build its next stage. */
  | { readonly kind: "wonder"; readonly which: Wonder }
  /** *Fische für Catan*: roll one die for a shoal. */
  | { readonly kind: "cast" }
  /** *Fische für Catan*: take the shoal off that field and into a ship. */
  | { readonly kind: "catch"; readonly at: number }
  /** *Fische für Catan*: unload a shoal at a harbour of the Catanischer Rat. */
  | { readonly kind: "deliver"; readonly at: number }
  /** *Entdecker & Piraten*: build a ship beside a harbour settlement. */
  | { readonly kind: "boat"; readonly at: number }
  /** *Entdecker & Piraten*: take one of one's own ships off the board again. */
  | { readonly kind: "recall"; readonly boat: number }
  /**
   * *Entdecker & Piraten*: put one figure from a ship's hold back in the box.
   *
   * @remarks
   * "Ihr dürft jederzeit Spielfiguren aus einem eurer Schiffe entfernen und zum
   * Vorrat zurücklegen. Dies kann zum Beispiel sinnvoll sein, wenn ihr Platz
   * für eine wertvollere Figur schaffen wollt."
   */
  | { readonly kind: "unload"; readonly boat: number; readonly cargo: Cargo }
  /** *Entdecker & Piraten*: put an explorer into a harbour or a ship. */
  | { readonly kind: "scout"; readonly at: number }
  /** *Entdecker & Piraten*: grow a settlement into a harbour settlement. */
  | { readonly kind: "port"; readonly at: number }
  /** *Entdecker & Piraten*: pick the ship whose journey comes next. */
  | { readonly kind: "helm"; readonly boat: number }
  /** *Entdecker & Piraten*: sail the picked ship one sea path further. */
  | { readonly kind: "sail2"; readonly at: number }
  /** *Entdecker & Piraten*: one Wolle for two more movement points. */
  | { readonly kind: "wind" }
  /** *Entdecker & Piraten*: take an explorer aboard, or set one down. */
  | { readonly kind: "load"; readonly at: number }
  /** *Entdecker & Piraten*: found a settlement from an explorer ship. */
  | { readonly kind: "landfall"; readonly at: number }
  /** *Seefahrer*: build a ship on a water path. */
  | { readonly kind: "ship"; readonly at: number }
  /** *Seefahrer*: pick a front ship up and put it down again. */
  | { readonly kind: "sail"; readonly from: number; readonly to: number }
  /** *Seefahrer*: send the Seeräuber to a sea field. */
  | { readonly kind: "pirate"; readonly at: number }
  /** *Seefahrer*: which resource a Goldfluss pays this seat. */
  | { readonly kind: "gold"; readonly sort: Resource }
  /** *Händler & Barbaren*: the Trosswagen drives to a neighbouring crossing. */
  | { readonly kind: "drive"; readonly at: number }
  /** *Händler & Barbaren*: one Getreide for two more movement points. */
  | { readonly kind: "boost" }
  /** *Händler & Barbaren*: roll against the barbarian on this path. */
  | { readonly kind: "shove"; readonly at: number }
  /** *Händler & Barbaren*: put the lifted barbarian on this path. */
  | { readonly kind: "shift"; readonly at: number }
  /** *Händler & Barbaren*: take the next step of the Wagen-Tableau. */
  | { readonly kind: "tableau" }
  /** *Händler & Barbaren*: play one of the held cards. */
  | { readonly kind: "haulCard"; readonly card: HaulCard }
  /** *CATAN für Zwei*: the two cards going back after a Zwangshandel. */
  | { readonly kind: "giveBack"; readonly cards: Hand }
  | { readonly kind: "endTurn" };

/**
 * Every kind of move there is.
 *
 * @remarks
 * Written out as a record so the compiler counts along: a move added to
 * {@link CatanMove} and forgotten here is a type error rather than a move
 * that quietly stops working. And it does stop working - this is the list an
 * incoming move is checked against online, and it used to name the twenty moves
 * of the base game and none of the expansions. A guest playing Städte & Ritter,
 * Seefahrer or Entdecker & Piraten could roll, build and trade, and everything
 * their expansion added was turned away at the door.
 */
const MOVE_KIND_SET: Readonly<Record<CatanMove["kind"], true>> = {
  activate: true,
  answer: true,
  answerCard: true,
  assault: true,
  bank: true,
  barb: true,
  boat: true,
  boost: true,
  bridge: true,
  buy: true,
  cast: true,
  catch: true,
  chase: true,
  chip: true,
  choose: true,
  city: true,
  corsair: true,
  deal: true,
  deliver: true,
  discard: true,
  drive: true,
  drop: true,
  endTurn: true,
  event: true,
  fish: true,
  giveBack: true,
  gold: true,
  goldBuy: true,
  goldSell: true,
  haulCard: true,
  helm: true,
  hunt: true,
  improve: true,
  knight: true,
  knightIn: true,
  landfall: true,
  lay: true,
  load: true,
  march: true,
  neutral: true,
  offer: true,
  pirate: true,
  play: true,
  port: true,
  post: true,
  progress: true,
  recall: true,
  unload: true,
  repair: true,
  ride: true,
  road: true,
  rob: true,
  robber: true,
  roll: true,
  sail: true,
  sail2: true,
  scout: true,
  sell: true,
  shift: true,
  ship: true,
  shoe: true,
  shove: true,
  storm: true,
  tableau: true,
  town: true,
  unit: true,
  upgrade: true,
  vote: true,
  wagon: true,
  wall: true,
  wind: true,
  withdraw: true,
  wonder: true,
};

/** Every kind of move there is, as a list. */
export const MOVE_KINDS: readonly CatanMove["kind"][] = Object.keys(
  MOVE_KIND_SET,
) as CatanMove["kind"][];
