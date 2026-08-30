/**
 * Everything this game says on screen.
 *
 * @module
 * @remarks
 * German, in one place, so a wording is changed once rather than in six
 * components - and so the code around it stays English.
 */
import type { Title } from "@/games/arschloch/engine/state";

/** What the five titles are called. */
export const TITLE_NAMES: Readonly<Record<Title, string>> = {
  praesident: "Präsident",
  vize: "Vizepräsident",
  buerger: "Bürger",
  vizearsch: "Vizearschloch",
  arschloch: "Arschloch",
};

/** Every line the screens show. */
export const ARSCHLOCH_TEXTS = {
  title: "Arschloch",
  tagline: "Karten loswerden - der Letzte ist es.",
  newGame: "Neues Spiel",
  online: "Online spielen",
  settings: "Einstellungen",
  stats: "Statistik",
  back: "Zurück zur Spielesammlung",

  yourTurn: "Du bist dran",
  waitingFor: (name: string): string => `${name} ist dran`,
  round: (round: number, rounds: number): string =>
    `Runde ${round} von ${rounds}`,
  emptyTable: "Der Tisch ist frei - du spielst aus.",
  onTable: (count: number, rank: string): string =>
    count === 1 ? `Auf dem Tisch: ${rank}` : `Auf dem Tisch: ${count}x ${rank}`,
  play: "Legen",
  playCount: (count: number): string =>
    count === 1 ? "1 Karte legen" : `${count} Karten legen`,
  pass: "Passen",
  passed: "hat gepasst",
  out: "ist raus",
  cards: (count: number): string =>
    count === 1 ? "1 Karte" : `${count} Karten`,

  giveTitle: "Kartentausch",
  giveHint: (count: number, name: string): string =>
    count === 1
      ? `Du gibst ${name} eine Karte deiner Wahl zurück.`
      : `Du gibst ${name} ${count} Karten deiner Wahl zurück.`,
  giveButton: "Zurückgeben",
  tookFrom: (from: string, to: string, count: number): string =>
    `${to} nimmt ${count === 1 ? "die beste Karte" : `die ${count} besten Karten`} von ${from}.`,

  roundOver: "Runde vorbei",
  nextRound: "Nächste Runde",
  scores: "Punkte",
  titleOf: (title: Title | null): string =>
    title === null ? "-" : TITLE_NAMES[title],
  gameOver: "Spiel vorbei",
  wonBy: (names: string): string => `Gewonnen: ${names}`,
  drawBetween: (names: string): string => `Gleichstand: ${names}`,

  players: "Spieler",
  playersHint:
    "Zu dritt, zu fünft und zu sechst bleiben zwei Siebenen im Karton - sonst ginge das Blatt nicht auf.",
  roundsLabel: "Runden",
  roundsHint:
    "So viele Runden werden gespielt, danach gewinnt, wer die meisten Punkte hat. Pro Runde gibt es einen Punkt für jeden, den man hinter sich lässt.",
  log: "Spielverlauf",
} as const;
