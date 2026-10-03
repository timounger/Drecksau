/**
 * The water, the boat and the moving window: what a dive is made of.
 *
 * @module
 * @remarks
 * Everything here is data. The world is one plain object that the engine maps
 * to the next one ({@link ./engine step}), so a dive can be replayed, drawn
 * twice or handed to a test without anything hidden in a closure.
 *
 * One set of measurements for the whole game: the grid a course is written on
 * lives here, and the renderer draws in exactly these pixels. A course square
 * is a course square in the map file, in the collision check and on the screen.
 */
import type { Gear, WeaponKind } from "./upgrades";

/**
 * What one square of a course can hold.
 *
 * @remarks
 * The characters are the ones a course is typed with - see
 * `docs/games/uboot/levels.md`. `.` is open water, `#` rock, `M` a mine, `~`
 * weed (pretty, harmless), `S` where the boat starts and `Z` the way out.
 */
import { LANDMARKS } from "./landmarks";

/**
 * Was in einem Quadrat sein kann.
 *
 * @remarks
 * **Zwei Sorten Fels.** `#` ist gewachsener Stein: Er hält, was auch immer man
 * dagegen schießt, und er ist der Grund und die Decke jeder Höhle. `B` ist
 * Bruchfels - dasselbe Hindernis, aber ein Torpedo oder eine Seemine macht
 * eine Tür hinein.
 *
 * Dass beides zusammen existiert, ist der ganze Sinn der Sache: Könnte man
 * überall durchsprengen, wäre jede Höhle nur noch eine Frage der Munition;
 * könnte man es nirgends, wäre der Torpedo eine Waffe gegen Fische.
 *
 * `~` ist Tang, und die Buchstaben der Landmarken stehen in
 * {@link ./landmarks}:
 * alles **Zierde**,
 * durch die man hindurchfährt
 * wie durch Wasser. Was man sieht, muss nicht wehtun - ein Kurs, in dem jedes
 * Ding ein Hindernis ist, ist eine Tabelle und kein Ort.
 */
export type Cell =
  | "."
  | "#"
  | "B"
  | "M"
  | "~"
  | "H"
  | "R"
  | "L"
  | "D"
  | "E"
  | "O"
  | "N"
  | "P"
  | "V"
  | "G"
  | "S"
  | "Z";

/**
 * Ob dieses Feld bloß Zierde ist - Wasser, durch das man fährt.
 *
 * @remarks
 * Tang und die Landmarken auf dem Grund. **An einer Stelle gesammelt**,
 * damit die nächste Landmarke eine Zeile kostet und nicht fünf: Sowohl der
 * Kurs als auch die Schüsse fragen hier nach.
 */
export function isDecor(cell: Cell): boolean {
  return cell === "~" || LANDMARKS.includes(cell);
}

/** A point in course pixels: x runs right, y runs down from the surface. */
export type Vec = {
  readonly x: number;
  readonly y: number;
};

/** How wide and high one square of a course is, in pixels. */
export const CELL = 36;

/**
 * How many squares deep the water is.
 *
 * @remarks
 * Fourteen, which is the height of the picture minus the strip of sky, and the
 * number every course map has to have rows of. Deep enough that diving is a
 * decision and not a twitch.
 */
export const ROWS = 14;

/** How far down the surface of the water sits in the picture, in pixels. */
export const SURFACE = 36;

/** How wide the picture is, and with it how much water one can see. */
export const VIEW_W = 960;

/** And how high, sky and all. */
export const VIEW_H = SURFACE + ROWS * CELL;

/** How long the boat is, in pixels. */
export const SUB_LONG = 76;

/** And how high, without the conning tower. */
export const SUB_HIGH = 34;

/** How far from the middle the outer two collision discs sit. */
const SUB_SPREAD = 24;

/**
 * Where along the hull the collision discs sit, from the middle.
 *
 * @remarks
 * A boat is a sausage, and a sausage is three circles. Rectangles would have
 * corners, and a corner catching on a rock the player can see daylight through
 * is the one thing that makes a dodging game feel unfair.
 */
export const SUB_DISCS: readonly number[] = [-SUB_SPREAD, 0, SUB_SPREAD];

/** How big each of those discs is. */
export const SUB_DISC = 15;

/** How big a mine is, in pixels - the ball, not the spikes. */
export const MINE_R = 13;

/** What one shot is, while it is on its way. */
export type Shot = {
  /** Its own number, so the renderer can tell two apart. */
  readonly id: number;
  readonly kind: WeaponKind;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  /** How long it has been going, in seconds. */
  readonly age: number;
};

/**
 * Der Wächter, der die letzte Fahrt bewacht.
 *
 * @remarks
 * Kein Hindernis mehr, sondern ein Gegenüber: Er bewegt sich, er wirft etwas,
 * und er geht erst weg, wenn man ihn dazu bringt. Deshalb steht hier alles,
 * was er tut, und nicht bloß, wo er ist.
 */
export type Boss = {
  readonly x: number;
  readonly y: number;
  /** Wie schnell er gerade steigt oder sinkt. */
  readonly vy: number;
  /** Was von ihm übrig ist. */
  readonly hull: number;
  /** Womit er angefangen hat - für den Balken über ihm. */
  readonly whole: number;
  /** Wie lange er von einem Treffer noch aufleuchtet, in Sekunden. */
  readonly hurt: number;
  /** Sekunden, bis er das nächste Mal wirft. */
  readonly loaded: number;
};

/**
 * Was im Wasser lebt.
 *
 * @remarks
 * Die Namen sind englisch wie der Rest des Codes; wie sie auf Deutsch heißen,
 * steht einmal in {@link ./beasts BREEDS} und wird von dort überall
 * hergenommen - von der Anzeige bis zur Enzyklopädie.
 */
export type BeastKind =
  "jelly" | "shoal" | "crab" | "urchin" | "eel" | "angler";

/**
 * Ein einzelnes Wesen, so wie es gerade im Wasser steht.
 *
 * @remarks
 * Es hat ein **Zuhause** und entfernt sich nie weit davon. Das ist kein
 * Realismus, sondern Verlässlichkeit: Ein Kurs, dessen Bewohner weglaufen, ist
 * beim zweiten Versuch ein anderer Kurs, und dann lernt man ihn nie.
 */
export type Beast = {
  readonly id: number;
  readonly kind: BeastKind;
  readonly x: number;
  readonly y: number;
  /** Woher es kam und wohin es immer zurückkehrt. */
  readonly homeX: number;
  readonly homeY: number;
  /** Wie schnell es sich gerade bewegt - fürs Zeichnen der Blickrichtung. */
  readonly vx: number;
  readonly vy: number;
  /** Seine eigene Uhr, in Sekunden: daraus kommt die ganze Bewegung. */
  readonly beat: number;
  /** Was es noch aushält, in Harpunentreffern. */
  readonly hull: number;
  /** Und wie lange es von einem Treffer noch aufleuchtet. */
  readonly hurt: number;
};

/** Was er wirft. */
export type Ink = {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  /** Wie lange es schon unterwegs ist, in Sekunden. */
  readonly age: number;
};

/** A bang, while it is still worth looking at. */
export type Blast = {
  readonly x: number;
  readonly y: number;
  /** How far it reaches, in pixels. */
  readonly reach: number;
  /** How long ago it went off, in seconds. */
  readonly age: number;
};

/** The boat, as far as the world is concerned. */
export type Sub = {
  /** Where the middle of the hull is, in course pixels. */
  readonly x: number;
  readonly y: number;
  /** How fast it is going, in pixels a second. */
  readonly vx: number;
  readonly vy: number;
};

/** How a dive can be going. */
export type Phase = "diving" | "wrecked" | "drowned" | "arrived";

/** One whole dive. */
export type GameState = {
  /** Which course is being dived, counted from zero. */
  readonly level: number;
  readonly phase: Phase;
  readonly sub: Sub;
  /**
   * The left edge of the window, in course pixels.
   *
   * @remarks
   * The window is the whole game: it moves right at its own pace and nobody
   * can stay behind it. What it really is, is a deadline you can see.
   */
  readonly window: number;
  /** Whether the window is pushing the boat along this very moment. */
  readonly shoved: boolean;
  /** How long this dive has been going, in seconds. */
  readonly time: number;
  /** Where it went wrong, for the bang - null while all is well. */
  readonly hit: Vec | null;
  /** The boat that was dived in: everything the upgrades add up to. */
  readonly gear: Gear;
  /** How much air is left, in seconds. */
  readonly air: number;
  /** How many hits the hull has left. Nought is not a boat any more. */
  readonly hull: number;
  /**
   * How long the hull is still glowing from the last hit, in seconds.
   *
   * @remarks
   * Nothing can touch the boat while this is running. Without it, one rock
   * would take every hit a player owns in the third of a second it takes to
   * get off it - which is not armour, it is a shorter fuse.
   */
  readonly hurt: number;
  /** What is in the water on its way somewhere. */
  readonly shots: readonly Shot[];
  /** And what has just gone off. */
  readonly blasts: readonly Blast[];
  /**
   * Wie oft auf ein Feld schon eingestochen wurde, nach seinem Platz im Kurs.
   *
   * @remarks
   * Eine Mine hält mehrere Harpunen aus. Was fehlt, bis sie hochgeht, steht
   * hier - und zwar nur für diesen Tauchgang, genau wie {@link gone}.
   */
  readonly dents: ReadonlyMap<number, number>;
  /**
   * Squares that have been blown out of the course, by their place in it.
   *
   * @remarks
   * The course itself stays exactly as it was written - a torpedo changes this
   * dive, not the map. Every question about what is solid goes through
   * {@link ./engine solidAt}, which asks both.
   */
  readonly gone: ReadonlySet<number>;
  /**
   * Wie weit der Schub schon steht, von null bis eins.
   *
   * @remarks
   * **Nicht die Geschwindigkeit, sondern die Hand am Hebel.** Wer vorwärts
   * drückt, baut diesen Wert in einer Sekunde auf; wer loslässt, in einer
   * Sekunde wieder ab. Daran hängt, wie schnell die Schraube dreht und wie
   * groß der Wirbel dahinter ist - ein Strudel, der im selben Moment da ist,
   * in dem man die Taste berührt, sieht aus wie ein Lichtschalter und nicht
   * wie Wasser.
   */
  readonly wash: number;
  /**
   * Wie weit die Schraube gedreht hat, in Umdrehungen.
   *
   * @remarks
   * Aufsummiert und nicht aus der Zeit gerechnet: Eine Drehung, deren
   * Geschwindigkeit sich ändert, springt sonst bei jeder Änderung - man
   * multipliziert dann eine wachsende Zeit mit einer neuen Zahl, und das Bild
   * macht einen Satz.
   */
  readonly spin: number;
  /** Alles, was in diesem Kurs lebt und noch nicht kaputt ist. */
  readonly beasts: readonly Beast[];
  /**
   * Auf welcher Schwierigkeit gefahren wird, von null an.
   *
   * @remarks
   * Steht im Weltzustand, damit am Ende feststeht, **wofür** der Erfolg zählt.
   * Die Engine rechnet nicht damit - was die Stufe bewirkt, steckt längst im
   * Kurs ({@link ../engine/course Course.pace} und seine Bewohner).
   */
  readonly grade: number;
  /** Der Wächter, sobald man ihm begegnet ist - sonst null. */
  readonly boss: Boss | null;
  /** Und was er geworfen hat. */
  readonly inks: readonly Ink[];
  /** How long until the next shot may be fired, in seconds. */
  readonly loaded: number;
  /** Und wie lange, bis die nächste Seemine gelegt werden kann. */
  readonly laid: number;
  /** The number the next shot gets. */
  readonly fired: number;
};

/** What the player is asking for this frame. */
export type Input = {
  /** W - up towards the light. */
  readonly up: boolean;
  /** S - down into the dark. */
  readonly down: boolean;
  /** A - back, against the window. */
  readonly back: boolean;
  /** D - ahead. */
  readonly forward: boolean;
  /** Linke Maustaste oder Leertaste: schießen, was im Rohr steckt. */
  readonly fire: boolean;
  /** Rechte Maustaste: eine Seemine legen, falls welche an Bord sind. */
  readonly drop: boolean;
  /**
   * Wohin geschossen wird, in Kurspixeln - oder null für geradeaus.
   *
   * @remarks
   * Die Welt und nicht der Bildschirm: Die Engine weiß nichts von Fenstern und
   * Leinwänden, und ein Zielpunkt, der beim Weiterlaufen des Fensters wandert,
   * wäre kein Zielpunkt.
   */
  readonly aim: Vec | null;
};

/** Nobody touching anything. */
export const NO_INPUT: Input = {
  up: false,
  down: false,
  back: false,
  forward: false,
  fire: false,
  drop: false,
  aim: null,
};
