/**
 * The German words of Murdle: buttons, labels, attributes and exhibits.
 *
 * @module
 */
import { REDACTED_HEIGHT } from "@/games/murdle/engine/types";
import type {
  Case,
  Difficulty,
  EyeColour,
  Series,
  HairColour,
  StarSign,
  Weight,
} from "@/games/murdle/engine/types";

/** Centimetres in a metre, for heights. */
const CM_PER_METRE = 100;

/** The words on the screen. */
export const MURDLE_TEXTS = {
  title: "Murdle",
  subtitle: "Wer? Womit? Wo? Warum? - Kriminalfälle zum Selberlösen",
  statistics: "Statistik",
  playOnline: "Gemeinsam online",
  chooseCase: "Wähle einen Fall",
  open: "Fall öffnen",
  resume: "Weiterlösen",
  solved: "Gelöst",
  toCases: "Zu den Fällen",
  previousCase: "Voriger Fall",
  nextCaseArrow: "Nächster Fall",
  suspects: "Verdächtige",
  weapons: "Waffen",
  locations: "Orte",
  motives: "Motive",
  clues: "Hinweise & Beweise",
  statements: "Aussagen",
  statementsNote:
    "Denk daran: Der Mörder lügt. Alle anderen sagen die Wahrheit.",
  exhibits: "Beweismittel",
  grid: "Deduktionsraster",
  gridHelp:
    "Tippe auf ein Feld: einmal für ein Kreuz, zweimal für einen Haken, dreimal wieder leer.",
  autoCross: "Haken streicht Zeile und Spalte automatisch aus",
  accusation: "Anklage",
  who: "Wer?",
  what: "Womit?",
  where: "Wo?",
  why: "Warum?",
  choose: "- wählen -",
  accuse: "Anklagen",
  wrong: "Falsch. Das passt nicht zu allen Hinweisen - prüfe deine Schlüsse.",
  wrongCount: (count: number) =>
    count === 1 ? "1 falsche Anklage" : `${String(count)} falsche Anklagen`,
  undo: "Rückgängig",
  restart: "Raster leeren",
  hint: "Tipp",
  hideHints: "Tipps ausblenden",
  applyHint: "Ausführen",
  hintHold:
    "Klicken: nächster Tipp. Eine Sekunde gedrückt halten: alle Tipps und das ganze Raster ausfüllen.",
  bookHint: "Hinweis aus dem Buch",
  reveal: "Lösung zeigen",
  hideSolution: "Lösung ausblenden",
  revealTitle: "Lösung zeigen?",
  revealText:
    "Dann gilt der Fall als nicht gelöst - auch wenn du danach richtig anklagst.",
  revealYes: "Ja, zeigen",
  revealNo: "Weiter ermitteln",
  solution: "Die Lösung",
  murderer: "Täter",
  solvedTitle: "Fall gelöst!",
  close: "Schließen",
  nextCase: "Nächster Fall",
  replay: "Nochmal lösen",
  clockTitle: "Zeit für diesen Fall",
  hintsUsed: (count: number) =>
    count === 1 ? "1 Tipp genutzt" : `${String(count)} Tipps genutzt`,
  height: "Größe",
  handLeft: "Linkshänder",
  handRight: "Rechtshänder",
  indoors: "drinnen",
  outdoors: "draußen",
  tutorial: "Übungsfall",
  search: "Fall suchen",
  clearSearch: "Suche leeren",
  hideSolved: "Gelöste ausblenden",
  series: "Reihe",
  difficulty: "Schwierigkeit",
  allCases: "Alle",
  noCases: "Keine Fälle gefunden.",
  print: "Drucken / PDF",
  printTitle:
    "Den Fall als Druckseite in einem neuen Tab öffnen - zum Ausdrucken oder als PDF speichern",
  printMetaTitle: (name: string) => `Murdle - ${name}`,
  printMetaDescription: "Ein Murdle-Fall als Druckseite, zum Lösen mit Stift.",
  printNotes: "Notizen",
} as const;

/** The names of the books. */
export const SERIES_NAMES: Readonly<Record<Series, string>> = {
  volume1: "Murdle: Band 1",
};

/** The names of the difficulties - the parts of the book. */
export const DIFFICULTY_NAMES: Readonly<Record<Difficulty, string>> = {
  tutorial: "Einführung",
  elementary: "Elementar",
  occult: "Okkultes Medium",
  hardBoiled: "Hartgesotten",
  impossible: "Unmöglich",
};

/** How many magnifying glasses the book prints beside a case's title. */
export const DIFFICULTY_GLASSES: Readonly<Record<Difficulty, number>> = {
  tutorial: 0,
  elementary: 1,
  occult: 2,
  hardBoiled: 3,
  impossible: 4,
};

/** Eye colours, as an attribute on a card. */
export const EYE_NAMES: Readonly<Record<EyeColour, string>> = {
  hazel: "haselnussbraune Augen",
  lightBrown: "hellbraune Augen",
  darkBrown: "dunkelbraune Augen",
  green: "grüne Augen",
  blue: "blaue Augen",
  gray: "graue Augen",
  black: "schwarze Augen",
  redacted: "Augenfarbe geschwärzt",
};

/** Hair colours, as an attribute on a card. */
export const HAIR_NAMES: Readonly<Record<HairColour, string>> = {
  lightBrown: "hellbraune Haare",
  darkBrown: "dunkelbraune Haare",
  blond: "blonde Haare",
  red: "rote Haare",
  black: "schwarze Haare",
  gray: "graue Haare",
  silver: "silberne Haare",
  blue: "blaue Haare",
  white: "weiße Haare",
  bald: "Glatze",
  redacted: "Haarfarbe geschwärzt",
};

/** Weights, as an attribute on a card. */
export const WEIGHT_NAMES: Readonly<Record<Weight, string>> = {
  light: "leicht",
  medium: "mittelschwer",
  heavy: "schwer",
};

/** One sign of Exhibit B. */
export type SignInfo = {
  readonly name: string;
  readonly symbol: string;
  readonly element: string;
  readonly dates: string;
};

/** Exhibit B, Inspector Irratino's astrological primer - in the book's order. */
export const SIGNS: Readonly<Record<StarSign, SignInfo>> = {
  aries: {
    name: "Widder",
    symbol: "♈",
    element: "Feuer",
    dates: "21. März - 19. April",
  },
  taurus: {
    name: "Stier",
    symbol: "♉",
    element: "Erde",
    dates: "20. April - 20. Mai",
  },
  gemini: {
    name: "Zwillinge",
    symbol: "♊",
    element: "Luft",
    dates: "21. Mai - 21. Juni",
  },
  cancer: {
    name: "Krebs",
    symbol: "♋",
    element: "Wasser",
    dates: "22. Juni - 22. Juli",
  },
  leo: {
    name: "Löwe",
    symbol: "♌",
    element: "Feuer",
    dates: "23. Juli - 22. August",
  },
  virgo: {
    name: "Jungfrau",
    symbol: "♍",
    element: "Erde",
    dates: "23. August - 22. September",
  },
  libra: {
    name: "Waage",
    symbol: "♎",
    element: "Luft",
    dates: "23. September - 22. Oktober",
  },
  scorpio: {
    name: "Skorpion",
    symbol: "♏",
    element: "Wasser",
    dates: "23. Oktober - 21. November",
  },
  sagittarius: {
    name: "Schütze",
    symbol: "♐",
    element: "Feuer",
    dates: "22. November - 21. Dezember",
  },
  capricorn: {
    name: "Steinbock",
    symbol: "♑",
    element: "Erde",
    dates: "22. Dezember - 19. Januar",
  },
  aquarius: {
    name: "Wassermann",
    symbol: "♒",
    element: "Luft",
    dates: "20. Januar - 18. Februar",
  },
  pisces: {
    name: "Fische",
    symbol: "♓",
    element: "Wasser",
    dates: "19. Februar - 20. März",
  },
};

/** One item of Exhibit A. */
export type KitItem = {
  readonly icon: string;
  readonly name: string;
  readonly text: string;
};

/** Exhibit A, the contents of Deductive Logico's detective kit. */
export const DETECTIVE_KIT: readonly KitItem[] = [
  {
    icon: "\u{1FAAA}",
    name: "Mitgliedsausweis und Anstecknadel",
    text: "Ausweis und Fedora-Nadel bestätigen Logicos Mitgliedschaft (Nr. 6KLM) im Detektivclub.",
  },
  {
    icon: "\u{1F48D}",
    name: "Geheimer Decoderring",
    text: "Ein mechanisches Gerät zum Lesen und Schreiben im Detektivcode: A wird zu Z, B zu Y und so weiter.",
  },
  {
    icon: "\u{1F50D}",
    name: "Lupe",
    text: "Damit findet Logico Hinweise und liest das Kleingedruckte. Gefertigt aus Kristall von Emerald Industries.",
  },
  {
    icon: "\u{1F4FC}",
    name: "Videokassette und Buch",
    text: "Ein Krimi auf Kassette von Midnight Movies und ein Roman von Dame Obsidian. Dazu ein Lesezeichen des Detektivclubs.",
  },
  {
    icon: "☕",
    name: "Tasse Kaffee",
    text: "Der perfekte Treibstoff für Krimis aus dem Lehnstuhl. Die Tasse gehörte einst General Coffee persönlich!",
  },
];

/** The names of the exhibits. */
export const EXHIBIT_NAMES = {
  detectiveKit:
    "Beweisstück A - Der Inhalt von Deductive Logicos Detektivkoffer",
  astrology: "Beweisstück B - Inspektor Irratinos astrologische Fibel",
} as const;

/**
 * A case's title as the list shows it, with its number in the book.
 *
 * @param kase - the case
 * @returns "36. Eine Kreuzfahrt zum Sterben", or the tutorial's title alone
 */
export function titleOf(kase: Case): string {
  return kase.number === null
    ? kase.title
    : `${String(kase.number)}. ${kase.title}`;
}

/**
 * A height as a card shows it.
 *
 * @param cm - the height in centimetres
 * @returns "1,65 m", or a note that the card blacks it out
 */
export function heightText(cm: number): string {
  return cm === REDACTED_HEIGHT
    ? "Größe geschwärzt"
    : `${(cm / CM_PER_METRE).toFixed(2).replace(".", ",")} m`;
}

/**
 * A name with its first letter capitalised, for the start of a sentence.
 *
 * @param text - "das Stadion"
 * @returns "Das Stadion"
 */
export function capitalised(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
