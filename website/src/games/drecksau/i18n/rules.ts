/**
 * The Drecksau rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const DRECKSAU_RULES: GameRules = {
  title: "Drecksau",
  players: "2 bis 4 Spieler",
  intro:
    "Kartenspiel von Frank Bebenroth. Wer zuerst nur noch Drecksäue und kein sauberes Schwein mehr vor sich liegen hat, gewinnt sofort.",
  sections: [
    {
      title: "Aufbau",
      list: [
        "Schweine je Spieler: zu zweit fünf, zu dritt vier, zu viert drei. Alle starten sauber.",
        "Jede und jeder zieht drei Handkarten.",
      ],
    },
    {
      title: "Ein Zug",
      body: ["Reihum genau eine der folgenden Möglichkeiten:"],
      list: [
        "Eine Karte ausspielen,",
        "eine Karte ungenutzt ablegen,",
        "oder - wenn keine der drei Handkarten spielbar ist - alle offen zeigen, ablegen und drei neue ziehen.",
      ],
    },
    {
      title: "Nach dem Zug",
      body: [
        "Es wird auf drei Handkarten nachgezogen. Ist der Nachziehstapel leer, wird der Ablagestapel gemischt und dient als neuer Nachziehstapel.",
      ],
    },
    {
      title: "Die Karten",
      table: [
        ["Karte", "Ziel", "Wirkung"],
        ["Matsch", "eigenes sauberes Schwein", "wird zur Drecksau"],
        [
          "Regen",
          "kein Ziel",
          "alle Drecksäue ohne Stall werden sauber - auch die eigenen",
        ],
        [
          "Stall",
          "eigenes Schwein",
          "schützt vor Regen, aber nicht vor dem Bauern",
        ],
        [
          "Blitz",
          "Stall eines Mitspielers",
          "der Stall brennt ab; Stall, Blitzableiter und Bauer-ärgere-dich kommen weg",
        ],
        [
          "Blitzableiter",
          "eigener Stall",
          "dieser Stall kann nie mehr abbrennen",
        ],
        [
          "Bauer schrubbt die Sau",
          "fremde Drecksau",
          "wird sauber; wirkt auch im Stall",
        ],
        [
          "Bauer-ärgere-dich",
          "eigener Stall mit einer Drecksau darin",
          "verhindert jedes Schrubben an diesem Schwein",
        ],
      ],
    },
    {
      title: "Die glücklichste Drecksau",
      body: [
        "Stall, Blitzableiter und Bauer-ärgere-dich an einer Drecksau ergeben ein Schwein, das für den Rest des Spiels unangreifbar ist.",
        "Und ein Schwein im Stall darf beschmutzt werden - das ist eine Kernstrategie: Stall an ein sauberes Schwein, später Matsch, und die Drecksau ist sofort regensicher.",
      ],
    },
    {
      title: "Erweiterungen",
      body: [
        'In den Einstellungen lassen sich „Sauschön" (Schönsäue und Schönheitssalon) und die Zusatzkarten „Extra-Matsch" und „Lippenstift" zuschalten. Ihre Regeln stehen in der jeweiligen Beschreibung dort.',
      ],
    },
  ],
};
