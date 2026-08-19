/**
 * The Mind rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const MIND_RULES: GameRules = {
  title: "The Mind",
  players: "2 bis 4 Spieler",
  intro:
    "Kartenspiel von Wolfgang Warsch. Ihr legt gemeinsam die Zahlen 1 bis 100 in aufsteigender Reihenfolge ab - und dürft dabei kein Wort miteinander reden. Gewonnen oder verloren wird zusammen.",
  sections: [
    {
      title: "Es gibt keine Züge",
      body: [
        'Niemand ist „dran". Jede und jeder legt, wann er glaubt, die niedrigste Karte zu haben. Das Einzige, worauf man sich stützen kann, ist, wie lange die anderen still sind.',
      ],
    },
    {
      title: "Ablauf",
      list: [
        "In Level 1 bekommt jede und jeder eine Karte, in Level 2 zwei, und so weiter.",
        "Alle Karten müssen aufsteigend in die Tischmitte gelegt werden.",
        "Kommt jemand mit einer kleineren Karte zu spät, kostet das ein Leben - und alle noch niedrigeren Karten kommen offen weg.",
        "Ist ein Level geschafft, wird das nächste ausgeteilt.",
      ],
    },
    {
      title: "Wie viele Level und Leben",
      table: [
        ["Spieler", "Level", "Leben"],
        ["2", "12", "2"],
        ["3", "10", "3"],
        ["4", "8", "4"],
      ],
    },
    {
      title: "Wurfsterne",
      body: [
        "Ein Wurfstern wird nur einstimmig geworfen: Alle müssen die Hand heben. Dann legt jede und jeder die kleinste Handkarte offen ab.",
        "Das ist keine Abkürzung, sondern Information - danach weiß man, wie eng es wirklich war.",
      ],
    },
    {
      title: "Nicht erlaubt",
      body: [
        "Reden, Zeichen geben, Absprachen über Zahlen. Erlaubt ist einzig die erhobene Hand für einen Wurfstern.",
      ],
    },
    {
      title: "Spielende",
      body: [
        "Sind alle Leben weg, ist das Spiel verloren. Kommt ihr durch das letzte Level, habt ihr gemeinsam gewonnen.",
      ],
    },
    {
      title: "Warum es nur online geht",
      body: [
        "The Mind lebt davon, das Zögern der anderen zu lesen. Ein Computerpartner müsste dafür entweder alle Hände kennen - dann ist es kein Spiel mehr - oder eine ausgedachte Zahl von Sekunden warten. Deshalb wird hier ausschließlich mit echten Mitspielern gespielt.",
      ],
    },
  ],
  note: "The Mind war 2018 für das Spiel des Jahres nominiert; gewonnen hat Azul.",
};
