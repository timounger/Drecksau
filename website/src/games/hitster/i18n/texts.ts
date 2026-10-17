/**
 * The German words of Hitster's screens.
 *
 * @module
 */
import type { Difficulty } from "@/games/hitster/engine/state";

/** What each difficulty is called. */
export const DIFFICULTY_NAMES: Readonly<Record<Difficulty, string>> = {
  easy: "Leicht",
  medium: "Mittel",
  hard: "Schwer",
};

/** The fixed words of the screens. */
export const HITSTER_TEXTS = {
  title: "Hitster",
  tagline: "Hör den Song, schätz das Jahr - und bau deine Zeitleiste",
  newGame: "Neues Spiel",
  you: "Du",
  computer: "Computer",
  play: "▶ Abspielen",
  stop: "■ Stopp",
  replay: "↺ Nochmal",
  listening: "Läuft …",
  broken: "Song spielt nicht? Neuer Song (kostenlos)",
  yourTurn: "Du bist dran: Hör rein und leg die Karte in deine Zeitleiste.",
  theirTurn: (name: string) => `${name} legt die Karte …`,
  computerThinks: (name: string) => `${name} überlegt …`,
  pickSlot: "Tippe auf eine Lücke in deiner Zeitleiste.",
  title_: "Titel",
  artist: "Interpret",
  nameHint: "Optional: Titel und Interpret richtig = 1 Token",
  confirm: "Karte legen",
  skip: "Überspringen (1 Token)",
  buy: "Karte kaufen (3 Token)",
  challengeAsk: (name: string) =>
    `${name} hat gelegt. HITSTER! - Leg ein Token in eine Lücke, wenn du es besser weißt.`,
  challengeWait: (name: string) => `${name} überlegt, ob HITSTER …`,
  pass: "Passen",
  hitster: "HITSTER! (1 Token)",
  next: "Weiter",
  waitNext: (name: string) => `Warte auf ${name} …`,
  right: (name: string) => `${name} lag richtig!`,
  wrong: (name: string) => `${name} lag daneben.`,
  stolen: (name: string) => `${name} schnappt sich die Karte!`,
  named: (name: string) => `${name} hat Titel und Interpret erkannt.`,
  earned: "+1 Token",
  cards: (have: number, need: number) => `${have}/${need} Karten`,
  tokens: (count: number) => `${count} Token`,
  winner: (name: string) => `${name} hat gewonnen!`,
  won: "Gewonnen!",
  lost: "Verloren!",
  songNo: (turn: number) => `Song ${turn}`,
  mystery: "?",
  turnOf: (name: string) => `${name} ist dran`,
  yourTimeline: "Deine Zeitleiste",
  yourRight: "Du lagst richtig!",
  yourWrong: "Du lagst daneben.",
  yourNamed: "Du hast Titel und Interpret erkannt.",
  yourNext: "Karte umgedreht - weiter, wenn du so weit bist.",
  challengedBy: (name: string) => `HITSTER von ${name}`,
  history: "Spielverlauf",
  historyEmpty: "Noch kein Song gespielt.",
  historyRight: "richtig",
  historyWrong: "daneben",
  historyStolen: (name: string) => `${name} schnappt sie sich`,
  historyNamed: "Titel erkannt",
  historySkipped: (name: string, paid: boolean) =>
    paid
      ? `${name} überspringt einen Song (1 Token)`
      : `${name} holt einen neuen Song`,
  historyBought: (name: string) => `${name} kauft eine Karte (3 Token)`,
} as const;
