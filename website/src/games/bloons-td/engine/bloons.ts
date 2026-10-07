/**
 * Die Ballons: was sie aushalten, was in ihnen steckt und was ihnen nichts tut.
 *
 * @module
 * @remarks
 * **Ein Ballon ist eine Hülle über einem anderen Ballon.** Wer eine Hülle
 * zersticht, bekommt nicht nichts, sondern das, was darunter war - deshalb ist
 * die ganze Tabelle eine Kette, und deshalb heißt die Zahl, die zählt, nicht
 * "Leben", sondern **RBE**: wie viele Treffer in einem Ballon stecken, wenn man
 * ihn samt allem darin zerlegt.
 *
 * Die zweite Hälfte der Tabelle sind die **Immunitäten**, und sie sind der
 * Grund, warum man mehr als einen Turm baut: Der schwarze Ballon lacht über
 * Sprengstoff, der weiße über Eis, und der bleierne über alles Spitze. Ein
 * Spielfeld voller Wurfpfeilaffen steht vor einem Bleiballon still.
 *
 * Danach kommen die **Zeppeline** (MOAB-Klasse), die man nicht einfrieren und
 * nicht zurückwehen kann. Ihre Hülle ist 55 % der des Vorbilds: Dort machen
 * die Türme pro Treffer deutlich mehr Schaden, hier nimmt fast alles eine
 * Schicht - mit den Zahlen des Vorbilds war der erste M.O.A.B. ein Sprung,
 * für den man auf einmal viel mehr Türme brauchte als eine Runde davor. der **goldene Ballon**, der nichts kostet, aber viel
 * bringt, und die **Bosse** - ein Boss, der durchkommt, beendet die Partie.
 */

/**
 * Was einem Ballon wehtun kann.
 *
 * @remarks
 * `energy` ist Magie, Laser und Plasma - daran prallt der lila Ballon ab.
 * `normal` ist alles, wogegen keine Sorte gefeit ist: Kugeln mit Stahlmantel,
 * Säure, schwere Stachelkugeln.
 */
export type Harm = "sharp" | "explosion" | "ice" | "glue" | "energy" | "normal";

/** Die Sorten, die es gibt - die Reihenfolge ist die ihrer Stärke. */
export type BloonKind =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "pink"
  | "black"
  | "white"
  | "purple"
  | "lead"
  | "zebra"
  | "rainbow"
  | "ceramic"
  | "golden"
  | "moab"
  | "ddt"
  | "bfb"
  | "zomg"
  | "bad"
  | "vortex"
  | "bloonarius"
  | "dreadbloon"
  | "lych"
  | "phayze"
  | "blastapopoulos";

/** Alles, was eine Sorte ausmacht. */
export type Breed = {
  /** Wie sie auf Deutsch heißt. */
  readonly name: string;
  /** Ihre Farbe und die Farbe ihres Randes. */
  readonly paint: string;
  readonly line: string;
  /** Wie schnell sie ist, als Vielfaches des Grundtempos. */
  readonly pace: number;
  /** Wie viele Treffer ihre eigene Hülle aushält. */
  readonly hull: number;
  /** Und was darunter zum Vorschein kommt. */
  readonly inside: readonly BloonKind[];
  /** Was ihr nichts tut. */
  readonly immune: readonly Harm[];
  /** Wie viele Treffer insgesamt in ihr stecken - zur Anzeige. */
  readonly rbe: number;
  /** Ein Satz für das Regelblatt. */
  readonly note: string;
  /** Wie groß sie ist, als Vielfaches eines gewöhnlichen Ballons. */
  readonly size: number;
  /**
   * Was für ein Ding das ist.
   *
   * @remarks
   * `bloon` ist ein Ballon, `blimp` ein Zeppelin, `boss` ein Boss. Zeppeline
   * und Bosse lassen sich nicht einfrieren und nicht zurückwehen; sie bekommen
   * einen Lebensbalken, weil man ihre Hülle sonst nicht schwinden sieht.
   */
  readonly class: "bloon" | "blimp" | "boss";
  /** Ob sie von Natur aus getarnt ist. */
  readonly camo: boolean;
  /** Ob sie sich gar nicht bremsen lässt - auch nicht von Klebstoff. */
  readonly steady: boolean;
  /** Ob eine Verstärkung ihre Hülle verdoppelt. */
  readonly fortifiable: boolean;
  /** Was sie beim Platzen zusätzlich einbringt. */
  readonly bonus: number;
  /** Ob sie Leben kostet, wenn sie durchkommt. */
  readonly costly: boolean;
};

/**
 * Was jede Sorte hat, solange in ihrer Zeile nichts anderes steht: ein
 * gewöhnlicher Ballon, nicht getarnt, ohne Prämie.
 */
const COMMON = {
  size: 1,
  class: "bloon",
  camo: false,
  steady: false,
  fortifiable: false,
  bonus: 0,
  costly: true,
} as const;

/**
 * Was ein Boss kostet, wenn er durchkommt: alles.
 *
 * @remarks
 * Im Vorbild ist die Partie verloren, sobald ein Boss das Ende erreicht. Eine
 * Zahl, die größer ist als jede Lebensanzeige, sagt genau das.
 */
export const ALL_LIVES = 1_000_000;

/** Wie schnell ein roter Ballon läuft, in Bildpunkten je Sekunde. */
export const BASE_PACE = 46;

/**
 * Jede Sorte, einmal beschrieben.
 *
 * @remarks
 * Die RBE-Zahlen sind die des Vorbilds und nicht geschätzt: Ein schwarzer
 * Ballon enthält zwei rosa (2 × 5) plus seine eigene Hülle, macht elf. Wer an
 * einer Zahl dreht, dreht damit an der Rechnung, die darüber steht.
 */
export const BLOONS: Readonly<Record<BloonKind, Breed>> = {
  red: {
    ...COMMON,
    name: "Rot",
    paint: "#e23b3b",
    line: "#8d1b1b",
    pace: 1,
    hull: 1,
    inside: [],
    immune: [],
    rbe: 1,
    note: "Der langsamste und einfachste. Ein Treffer, und er ist weg.",
  },
  blue: {
    ...COMMON,
    name: "Blau",
    paint: "#3b7ee2",
    line: "#1b3f8d",
    pace: 1.4,
    hull: 1,
    inside: ["red"],
    immune: [],
    rbe: 2,
    note: "Etwas schneller, und darunter steckt ein roter.",
  },
  green: {
    ...COMMON,
    name: "Grün",
    paint: "#3fae51",
    line: "#1d6b2a",
    pace: 1.8,
    hull: 1,
    inside: ["blue"],
    immune: [],
    rbe: 3,
    note: "Noch schneller. Drei Treffer, bis nichts mehr übrig ist.",
  },
  yellow: {
    ...COMMON,
    name: "Gelb",
    paint: "#e8c62f",
    line: "#8d7512",
    pace: 3.2,
    hull: 1,
    inside: ["green"],
    immune: [],
    rbe: 4,
    note: "Der erste, der schneller ist, als man zusieht.",
  },
  pink: {
    ...COMMON,
    name: "Rosa",
    paint: "#ef7bb6",
    line: "#9c3a6d",
    pace: 3.5,
    hull: 1,
    inside: ["yellow"],
    immune: [],
    rbe: 5,
    note: "Sehr schnell. Wer ihn durchlässt, merkt es sofort.",
  },
  black: {
    ...COMMON,
    name: "Schwarz",
    paint: "#2b2b33",
    line: "#000000",
    pace: 1.8,
    hull: 1,
    inside: ["pink", "pink"],
    immune: ["explosion"],
    rbe: 11,
    note: "Sprengstoff tut ihm nichts. Darunter stecken zwei rosa.",
  },
  white: {
    ...COMMON,
    name: "Weiß",
    paint: "#f2f4f8",
    line: "#9aa3b2",
    pace: 1.8,
    hull: 1,
    inside: ["pink", "pink"],
    immune: ["ice"],
    rbe: 11,
    note: "Eis tut ihm nichts. Darunter stecken zwei rosa.",
  },
  purple: {
    ...COMMON,
    name: "Lila",
    paint: "#9b5bd6",
    line: "#562b7d",
    pace: 3,
    hull: 1,
    inside: ["pink", "pink"],
    immune: ["energy"],
    rbe: 11,
    note: "Magie, Laser und Plasma tun ihm nichts - Zauberer und Super-Affe brauchen hier Hilfe.",
  },
  lead: {
    ...COMMON,
    fortifiable: true,
    name: "Blei",
    paint: "#6b7280",
    line: "#2f3540",
    pace: 1,
    hull: 1,
    inside: ["black", "black"],
    immune: ["sharp", "glue"],
    rbe: 23,
    note: "Spitzes prallt ab. Hier hilft nur der Bombenwerfer - oder gar nichts.",
  },
  zebra: {
    ...COMMON,
    name: "Zebra",
    paint: "#e8e8ea",
    line: "#1c1c22",
    pace: 1.8,
    hull: 1,
    inside: ["black", "white"],
    immune: ["explosion", "ice"],
    rbe: 23,
    note: "Nimmt von beiden Eltern die Immunität mit: weder Sprengstoff noch Eis.",
  },
  rainbow: {
    ...COMMON,
    name: "Regenbogen",
    paint: "#f0a63c",
    line: "#8a5a10",
    pace: 2.2,
    hull: 1,
    inside: ["zebra", "zebra"],
    immune: [],
    rbe: 47,
    note: "Nichts prallt an ihm ab - dafür steckt eine Menge darin.",
  },
  ceramic: {
    ...COMMON,
    fortifiable: true,
    name: "Keramik",
    paint: "#b06a3c",
    line: "#5e3016",
    pace: 2.5,
    hull: 10,
    inside: ["rainbow", "rainbow"],
    immune: [],
    rbe: 104,
    note: "Die Hülle allein hält zehn Treffer aus, und erst dann fängt es an.",
  },
  golden: {
    ...COMMON,
    name: "Gold",
    paint: "#f5c518",
    line: "#9a7400",
    pace: 4,
    hull: 300,
    inside: [],
    immune: [],
    rbe: 300,
    note: "Rast über die Karte und hält dreihundert Treffer aus. Kommt er durch, kostet er nichts - wer ihn erwischt, bekommt $300 extra.",
    bonus: 300,
    costly: false,
  },
  moab: {
    ...COMMON,
    name: "M.O.A.B.",
    paint: "#2f6fd6",
    line: "#163a7a",
    pace: 1,
    hull: 110,
    inside: ["ceramic", "ceramic", "ceramic", "ceramic"],
    immune: [],
    rbe: 526,
    note: "Der erste Zeppelin: hundertzehn Treffer Hülle, darin vier Keramik.",
    size: 2.2,
    class: "blimp",
    fortifiable: true,
  },
  ddt: {
    ...COMMON,
    name: "D.D.T.",
    paint: "#2b2f2b",
    line: "#5be35b",
    pace: 3.5,
    hull: 220,
    inside: ["ceramic", "ceramic", "ceramic", "ceramic"],
    immune: ["sharp", "explosion"],
    rbe: 636,
    note: "Getarnt, aus Blei und schwarz zugleich - und so schnell wie ein rosa Ballon. Darin vier Keramik.",
    size: 2,
    class: "blimp",
    camo: true,
    fortifiable: true,
  },
  bfb: {
    ...COMMON,
    name: "B.F.B.",
    paint: "#d63a2f",
    line: "#7a1a14",
    pace: 0.25,
    hull: 385,
    inside: ["moab", "moab", "moab", "moab"],
    immune: [],
    rbe: 2489,
    note: "Langsam und schwer: knapp vierhundert Treffer Hülle, darin vier M.O.A.B.",
    size: 2.7,
    class: "blimp",
    fortifiable: true,
  },
  zomg: {
    ...COMMON,
    name: "Z.O.M.G.",
    paint: "#2e3a2e",
    line: "#7fdc4a",
    pace: 0.18,
    hull: 2200,
    inside: ["bfb", "bfb", "bfb", "bfb"],
    immune: [],
    rbe: 12156,
    note: "Kriecht nur, aber zweitausendzweihundert Treffer Hülle und darin vier B.F.B.",
    size: 3.2,
    class: "blimp",
    fortifiable: true,
  },
  bad: {
    ...COMMON,
    name: "B.A.D.",
    paint: "#6b2fb3",
    line: "#2e0f57",
    pace: 0.18,
    hull: 17292,
    inside: ["zomg", "zomg", "ddt", "ddt", "ddt"],
    immune: [],
    rbe: 43512,
    note: "Der größte Zeppelin. Lässt sich nicht einmal bremsen, und darin stecken zwei Z.O.M.G. und drei D.D.T.",
    size: 3.8,
    class: "blimp",
    steady: true,
    fortifiable: true,
  },
  vortex: {
    ...COMMON,
    name: "Vortex",
    paint: "#7dd3fc",
    line: "#0e5a86",
    pace: 1.4,
    hull: 3000,
    inside: [],
    immune: [],
    rbe: ALL_LIVES,
    note: "Ein schneller Boss. Alle paar Sekunden reißt sein Wirbel die Türme in seiner Nähe aus dem Takt - sie schießen kurz gar nicht.",
    size: 3,
    class: "boss",
    steady: true,
    bonus: 500,
  },
  bloonarius: {
    ...COMMON,
    name: "Bloonarius",
    paint: "#7cc242",
    line: "#356b14",
    pace: 0.35,
    hull: 4000,
    inside: [],
    immune: [],
    rbe: ALL_LIVES,
    note: "Ein Boss aus Schleim, der ständig neue Ballons hinter sich ausspuckt.",
    size: 3.4,
    class: "boss",
    steady: true,
    bonus: 500,
  },
  dreadbloon: {
    ...COMMON,
    name: "Dreadbloon",
    paint: "#78716c",
    line: "#292524",
    pace: 0.3,
    hull: 5000,
    inside: [],
    immune: [],
    rbe: ALL_LIVES,
    note: "Ein Boss aus Stein. Er legt sich immer wieder einen Steinpanzer zu, und solange der hält, ist er gegen eine Schadensart gefeit.",
    size: 3.4,
    class: "boss",
    steady: true,
    bonus: 500,
  },
  lych: {
    ...COMMON,
    name: "Lych",
    paint: "#4c1d95",
    line: "#1e0a3c",
    pace: 0.4,
    hull: 4000,
    inside: [],
    immune: [],
    rbe: ALL_LIVES,
    note: "Ein Boss, der sich heilt - und noch mehr, wenn er einem Turm den Trank des Alchemisten stiehlt.",
    size: 3.2,
    class: "boss",
    steady: true,
    bonus: 500,
  },
  phayze: {
    ...COMMON,
    name: "Phayze",
    paint: "#d946ef",
    line: "#701a75",
    pace: 0.45,
    hull: 3500,
    inside: [],
    immune: [],
    rbe: ALL_LIVES,
    note: "Ein getarnter Boss, der immer wieder aus der Welt verschwindet: Solange er verschoben ist, trifft ihn nichts.",
    size: 3.2,
    class: "boss",
    camo: true,
    steady: true,
    bonus: 500,
  },
  blastapopoulos: {
    ...COMMON,
    name: "Blastapopoulos",
    paint: "#ea580c",
    line: "#7c2d12",
    pace: 0.3,
    hull: 6000,
    inside: [],
    immune: [],
    rbe: ALL_LIVES,
    note: "Ein glühender Boss, der Meteore auf die Türme wirft. Wen einer trifft, der schießt ein paar Sekunden lang nicht.",
    size: 3.6,
    class: "boss",
    steady: true,
    bonus: 500,
  },
};

/** In welcher Reihenfolge sie im Regelblatt stehen. */
export const BLOON_ORDER: readonly BloonKind[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "pink",
  "black",
  "white",
  "purple",
  "lead",
  "zebra",
  "rainbow",
  "ceramic",
  "golden",
  "moab",
  "ddt",
  "bfb",
  "zomg",
  "bad",
  "vortex",
  "bloonarius",
  "dreadbloon",
  "lych",
  "phayze",
  "blastapopoulos",
];

/**
 * Ob diese Sorte von dieser Waffe überhaupt etwas abbekommt.
 *
 * @param kind - die Sorte
 * @param harm - die Art des Treffers
 * @returns true, wenn es wehtut
 */
export function hurts(kind: BloonKind, harm: Harm): boolean {
  return !BLOONS[kind].immune.includes(harm);
}
