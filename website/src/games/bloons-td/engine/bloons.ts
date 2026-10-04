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
 */

/** Was einem Ballon wehtun kann. */
export type Harm = "sharp" | "explosion" | "ice" | "glue";

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
  | "ceramic";

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
};

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
    name: "Lila",
    paint: "#9b5bd6",
    line: "#562b7d",
    pace: 3,
    hull: 1,
    inside: ["pink", "pink"],
    immune: [],
    rbe: 11,
    note: "Immun gegen Energie, Feuer und Plasma - davon hat hier noch niemand etwas.",
  },
  lead: {
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
