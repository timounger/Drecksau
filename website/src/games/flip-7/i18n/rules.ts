/**
 * The Flip 7 rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const F7_RULES: GameRules = {
  title: "Flip 7",
  players: "3 bis 8 Spieler",
  intro:
    "Sammle Zahlenkarten, so lange du dich traust. Ziehst du eine Zahl zum zweiten Mal, ist deine Runde vorbei und du bekommst nichts. Wer zuerst 200 Punkte hat, gewinnt.",
  sections: [
    {
      title: "Der Witz am Deck",
      body: [
        "Von jeder Zahl liegen so viele Karten im Deck, wie sie wert ist: zwölf Zwölfen, eine Eins. Die Karte, die du am liebsten hättest, ist also genau die, die du am ehesten noch einmal ziehst.",
        "Die 0 ist eine Zahlenkarte ohne Punktwert - sie kann dich trotzdem rauswerfen und zählt für Flip 7 mit.",
      ],
    },
    {
      title: "Ein Zug",
      body: [
        "Reihum: eine Karte nehmen oder stoppen. Wer nimmt, bekommt genau eine - danach ist der Nächste dran.",
        "Wer stoppt, verlässt die Runde und sichert seine Punkte. Stoppen geht nur, wenn mindestens eine Karte vor dir liegt.",
      ],
    },
    {
      title: "Flip 7",
      body: [
        "Sieben verschiedene Zahlenkarten beenden die Runde sofort für alle - und bringen 15 Bonuspunkte. Aktions- und Modifikatorkarten zählen dafür nicht mit.",
      ],
    },
    {
      title: "Die Aktionskarten",
      table: [
        ["Karte", "Wirkung"],
        [
          "Einfrieren",
          "Wer sie bekommt, sichert seine Punkte und ist aus der Runde",
        ],
        ["Dreimal", "Wer sie bekommt, muss die nächsten drei Karten nehmen"],
        ["Zweite Chance", "Rettet dich einmal vor einer doppelten Zahl"],
      ],
      body: [
        "Du darfst sie auf jeden geben, der noch im Spiel ist - auch auf dich selbst. Bist du der Einzige, musst du sie auf dich selbst spielen.",
        "Beim Dreimal wird abgebrochen, sobald der Betroffene rausfliegt oder Flip 7 schafft. Ein dabei aufgedecktes Einfrieren oder Dreimal kommt erst danach dran.",
        "Eine zweite Zweite Chance gibst du weiter an jemanden, der noch keine hat.",
      ],
    },
    {
      title: "Die Modifikatoren",
      body: [
        "+2 bis +10 werden zur Summe deiner Zahlen addiert. x2 verdoppelt die Summe deiner Zahlen - erst verdoppeln, dann die Boni addieren.",
        "Auf Modifikatoren kann man nicht rausfliegen, und für Flip 7 zählen sie nicht.",
      ],
    },
    {
      title: "Wertung",
      table: [
        ["Schritt", "Was"],
        ["1", "Zahlenkarten addieren"],
        ["2", "Bei x2 verdoppeln"],
        ["3", "+2 bis +10 dazu"],
        ["4", "Bei Flip 7: +15"],
      ],
      body: ["Wer rausgeflogen ist, bekommt 0."],
    },
    {
      title: "Spielende",
      body: [
        "Am Ende der Runde, in der jemand 200 Punkte erreicht hat, gewinnt, wer die meisten Punkte hat.",
      ],
    },
  ],
  note: "Spiel von Eric Olsen, The Op 2025. Die Anleitung sagt nicht ganz eindeutig, wie viele Karten ein Zug bringt; hier ist es eine, dann ist der Nächste dran - so, wie es das Beispiel in der Anleitung beschreibt.",
};
