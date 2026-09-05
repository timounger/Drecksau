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
  settingsTitle: "Arschloch - Einstellungen",

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

  dropHint: (count: number): string =>
    count === 1
      ? "Du hast eine Karte zu viel bekommen - lege eine ab."
      : `Du hast ${count} Karten zu viel bekommen - lege ${count} ab.`,
  dropButton: "Ablegen",
  wishHint: (count: number, name: string): string =>
    count === 1
      ? `Wünsch dir eine Karte aus der Hand von ${name}.`
      : `Wünsch dir ${count} Karten aus der Hand von ${name}.`,
  wishProtected: "Was dreimal oder öfter da ist, bleibt beim Besitzer.",
  wishButton: "Wünschen",
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
    "Alle 32 Karten werden verteilt. Geht das Blatt nicht auf, bekommt der mittlere Spieler die übrigen Karten und legt genauso viele wieder ab.",
  roundsLabel: "Runden",
  roundsHint:
    "So viele Runden werden gespielt, danach gewinnt, wer die meisten Punkte hat. Pro Runde gibt es einen Punkt für jeden, den man hinter sich lässt.",
  log: "Spielverlauf",
} as const;
