/**
 * The rules of Das Spiel, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const THE_GAME_RULES: GameRules = {
  title: "The Game",
  players: "1 bis 5 Spieler, gemeinsam",
  intro:
    "Vier Reihen, 98 Karten. Zwei Reihen laufen von 1 aufwärts, zwei von 100 abwärts. Ihr spielt alle zusammen gegen das Spiel und versucht, möglichst viele Karten loszuwerden - im Idealfall alle 98.",
  sections: [
    {
      title: "Die vier Reihen",
      body: [
        "Auf eine aufsteigende Reihe muss eine größere Zahl, auf eine absteigende eine kleinere. Wie groß der Sprung ist, ist egal - aber jede übersprungene Zahl ist eine Karte, die nie jemand mehr ablegen kann.",
        "Die Karten liegen übereinander, nicht nebeneinander. Sichtbar ist immer nur die oberste.",
      ],
    },
    {
      title: "Ein Zug",
      body: [
        "Wer dran ist, muss mindestens zwei Karten ablegen - auf beliebige Reihen, in beliebiger Reihenfolge, gern auch alle auf dieselbe. Mehr darf man immer.",
        "Danach zieht man wieder auf die volle Hand nach und der Nächste ist dran.",
      ],
    },
    {
      title: "Der Rückwärts-Trick",
      body: [
        "Die eine Ausnahme: Eine Karte, die genau 10 kleiner ist, darf auf eine aufsteigende Reihe. Eine, die genau 10 größer ist, auf eine absteigende.",
        "Auf einer aufsteigenden Reihe mit der 47 darfst du also die 37 legen. Das holt zehn Zahlen zurück und ist der stärkste Zug im Spiel. Beliebig oft pro Zug, auch auf verschiedenen Reihen.",
      ],
    },
    {
      title: "Reden - aber ohne Zahlen",
      body: [
        "Konkrete Zahlenwerte sind in jeder Form tabu. Weder fragen noch verraten.",
        'Alles andere ist erlaubt: „Bitte nicht auf diese Reihe legen" oder „Hier bitte nur einen ganz kleinen Sprung". Genau dafür gibt es hier die zwei Marker an jeder Reihe - die können keine Zahl verraten.',
      ],
    },
    {
      title: "Ende",
      body: [
        "Ist der Nachziehstapel leer, wird ohne Nachziehen weitergespielt - und es reicht dann eine Karte pro Zug. Wer keine Karten mehr hat, setzt aus.",
        "Das Spiel endet sofort, wenn jemand am Zug die geforderte Mindestanzahl nicht mehr ablegen kann.",
      ],
    },
    {
      title: "Wie gut wart ihr?",
      table: [
        ["Karten übrig", "Ergebnis"],
        ["0", "Das Spiel besiegt"],
        ["unter 10", "super"],
        ["10 bis 20", "gut"],
        ["mehr", "nochmal"],
      ],
    },
    {
      title: "Profivariante",
      body: [
        "Drei statt zwei Karten pro Zug. Wer es noch schwerer mag, nimmt zusätzlich eine Handkarte weniger.",
      ],
    },
  ],
  note: "The Game von Steffen Benndorf, Nürnberger-Spielkarten-Verlag - nominiert für das Spiel des Jahres 2015.",
};
