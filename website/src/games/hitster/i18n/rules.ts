/**
 * The rules page behind the "? Regeln" button.
 *
 * @module
 * @remarks
 * The short version of docs/games/hitster/game-rules.md.
 */
import type { GameRules } from "@/components/game-rules";

/** Hitster, as the dialog shows it. */
export const HITSTER_RULES: GameRules = {
  title: "Hitster",
  players: "2 bis 8 Spieler - gegen den Computer oder online",
  intro:
    "Ein Song läuft. Wann kam er raus? Leg die Karte an die richtige Stelle " +
    "deiner Zeitleiste - davor, dahinter oder dazwischen. Wer zuerst 10 " +
    "Karten richtig liegen hat, gewinnt.",
  sections: [
    {
      title: "Ein Zug",
      list: [
        "Jede:r startet mit einer Karte, Jahr sichtbar. Wer die älteste hat, beginnt.",
        "Der Song läuft. Du legst die Karte in eine Lücke deiner Zeitleiste.",
        "Die Karte wird umgedreht: Passt das Jahr, bleibt sie liegen - sonst fliegt sie raus.",
        "Gleiches Jahr wie eine Nachbarkarte? Dann darf sie davor oder dahinter liegen.",
      ],
    },
    {
      title: "Token",
      list: [
        "Jede:r startet mit 2 Token, höchstens 5.",
        "Titel und Interpret richtig genannt: +1 Token - auch wenn die Karte falsch liegt.",
        "Überspringen: 1 Token für einen neuen Song.",
        "Karte kaufen: 3 Token für eine Karte, die direkt richtig in die Zeitleiste kommt.",
      ],
    },
    {
      title: "HITSTER!",
      body: [
        "Hat jemand gelegt, dürfen die anderen der Reihe nach ein Token in eine " +
          "andere Lücke seiner Zeitleiste legen. Lag die Person falsch und dein " +
          "Token richtig, bekommst du die Karte. Das Token ist in jedem Fall weg. " +
          "Zwei Token dürfen nicht in derselben Lücke liegen.",
      ],
    },
    {
      title: "Ende",
      body: [
        "Wer zuerst 10 Karten in der Zeitleiste hat, gewinnt. In den " +
          "Einstellungen lässt sich das Ziel auch auf 5 oder 15 Karten stellen.",
      ],
    },
  ],
  note:
    "Statt QR-Codes und App laufen die Songs hier als YouTube-Videos - " +
    "abgedeckt, damit niemand Titel oder Jahr sieht.",
};
