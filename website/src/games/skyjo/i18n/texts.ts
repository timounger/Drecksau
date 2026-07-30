/**
 * German user-facing texts for Skyjo.
 *
 * @module
 */
import type { Difficulty } from "@/games/skyjo/engine/difficulty";
import { POINT_LIMIT } from "@/games/skyjo/engine/state";

/** What each difficulty is called in the interface. */
export const DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = {
  leicht: "Leicht",
  mittel: "Mittel",
  schwer: "Schwer",
};

/** Texts of the landing page and the game screens. */
export const SKYJO_TEXTS = {
  title: "Skyjo",
  subtitle:
    "Tausche deine Karten - wer am Ende die wenigsten Punkte hat, gewinnt.",
  playSolo: "Gegen Computer spielen",
  playOnline: "Online spielen",
  statistics: "Statistik",
  rulesTitle: "So wird gespielt",
  rules: [
    "Jede und jeder bekommt 12 Karten verdeckt in drei Reihen zu vier Spalten, davon werden zwei aufgedeckt.",
    "Im Zug tippst du auf den Ablagestapel, um die offene Karte zu nehmen - oder auf den Nachziehstapel.",
    "Die genommene Karte tauschst du gegen eine deiner Karten - die alte kommt offen auf den Ablagestapel.",
    "Eine gezogene Karte landet offen auf dem Ablagestapel. Du darfst sie auch liegen lassen und stattdessen eine eigene Karte aufdecken.",
    "Drei gleiche Karten in einer Spalte fliegen sofort raus und zählen nichts mehr.",
    "Wer zuerst alle 12 Karten offen hat, beendet die Runde - alle anderen sind noch genau einmal dran.",
    `Es zählt die Summe der eigenen Karten. Ab ${POINT_LIMIT} Punkten ist Schluss, die wenigsten Punkte gewinnen.`,
  ],
  penaltyNote:
    "Wer die Runde beendet, muss allein am niedrigsten sein - sonst zählen die eigenen Punkte doppelt.",

  // The table
  yourTurn: "Du bist dran",
  waitingFor: (name: string) => `${name} ist dran …`,
  openingHint: "Decke zwei deiner Karten auf.",
  chooseSource:
    "Tippe auf den Ablagestapel, um die offene Karte zu nehmen - oder auf den Nachziehstapel.",
  placeHint: "Tippe auf die Karte, die du ersetzen willst.",
  drawnHint:
    "Tippe auf eine deiner Karten, um zu tauschen - oder nochmal auf den Stapel, um die Karte liegen zu lassen.",
  flipHint: "Tippe auf eine verdeckte Karte, um sie aufzudecken.",
  deck: "Nachziehstapel",
  discard: "Ablagestapel",
  drawn: "Gezogen",
  empty: "leer",
  round: (n: number) => `Runde ${n}`,
  points: "Punkte",
  roundPoints: "Runde",
  lastRound: "Letzte Runde!",
  you: "Du",
  computer: "Computer",

  // Results
  roundOverTitle: "Runde vorbei",
  gameOverTitle: "Spiel vorbei",
  nextRound: "Nächste Runde",
  newGame: "Neues Spiel",
  winner: (name: string) => `${name} gewinnt!`,
  winnerTie: "Unentschieden!",
  doubled: "verdoppelt",
  waitHost: "Warte auf den Host …",

  // Setup and settings
  opponents: "Wie viele Gegner?",
  yourName: "Dein Name",
  start: "Spiel starten",
  log: "Verlauf",
  settings: "Einstellungen",
  settingsTitle: "Skyjo - Einstellungen",
  settingsSubtitle: "Tischgröße und Stärke der Computergegner.",
  backToGame: "Zum Spiel",
  playerCount: "Wie viele Spieler?",
  playerCountHint: "Du und die Computergegner zusammen.",
  difficulty: "Wie stark spielt der Computer?",
  difficultyHint: "Gilt für alle Computergegner am Tisch.",
  difficultyBlurb: {
    leicht:
      "greift offensichtlich gute Karten, achtet aber nicht auf Spalten und deckt lieber auf.",
    mittel: "spielt jeden Zug so gut, wie es die offenen Karten hergeben.",
    schwer:
      "spielt wie Mittel und überlegt zusätzlich, wann sich das Beenden der Runde lohnt.",
  } as Record<Difficulty, string>,
  settingsNote:
    "Änderungen gelten ab dem nächsten Spiel - Tisch und Gegner werden beim Austeilen festgelegt.",
} as const;
