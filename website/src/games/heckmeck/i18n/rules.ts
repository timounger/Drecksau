/**
 * The Heckmeck rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const HECKMECK_RULES: GameRules = {
  title: "Heckmeck am Bratwurmeck",
  players: "2 bis 7 Spieler",
  intro:
    "Würfelspiel von Reiner Knizia. Wer am Ende die meisten Würmer hat, gewinnt - nicht die meisten Chips.",
  sections: [
    {
      title: "Material",
      list: [
        "16 Chips mit den Zahlen 21 bis 36, offen auf dem Grill: 21-24 tragen 1 Wurm, 25-28 zwei, 29-32 drei, 33-36 vier.",
        "8 Würfel mit den Seiten 1, 2, 3, 4, 5 und Wurm.",
      ],
      body: [
        "Der Wurm zählt beim Addieren 5. Aber ohne mindestens einen Wurm unter den beiseitegelegten Würfeln zählt der ganze Wurf gar nichts.",
      ],
    },
    {
      title: "Ein Zug",
      list: [
        "Alle acht Würfel werfen.",
        "Einen Wert wählen und alle Würfel dieses Werts beiseitelegen. Jeder Wert darf pro Zug nur einmal beiseitegelegt werden - das ist der Haken, an dem das ganze Spiel hängt.",
        "Aufhören oder die übrigen Würfel erneut werfen.",
      ],
      body: [
        "Aufhören darf nur, wer mindestens einen Wurm beiseitegelegt hat.",
      ],
    },
    {
      title: "Beim Aufhören",
      body: [
        "Es zählt die Summe aller beiseitegelegten Würfel. Damit darfst du entweder",
      ],
      list: [
        "den Chip mit genau dieser Zahl vom Grill nehmen - oder den nächstniedrigeren, der noch da liegt,",
        "oder den obersten Chip eines Mitspielers klauen, wenn dessen Zahl exakt der Summe entspricht.",
      ],
    },
    {
      title: "Sich verspekulieren",
      body: ["Der Zug ist verloren, wenn"],
      list: [
        "nach einem Wurf kein Wert mehr übrig ist, der noch nicht beiseiteliegt,",
        "oder der letzte Würfel beiseiteliegt und die Summe für keinen Chip reicht - oder der Wurm fehlt.",
      ],
    },
    {
      title: "Was das kostet",
      body: [
        "Der eigene oberste Chip kommt zurück auf den Grill. Und der höchste Chip auf dem Grill wird umgedreht und ist aus dem Spiel.",
        "Das Zweite ist es, was wehtut - und zwar allen: Verspekulieren verkürzt das Spiel, und die fetten Chips gehen zuerst.",
      ],
    },
    {
      title: "Spielende",
      body: [
        "Sobald der Grill leer ist, ist Schluss. Jede und jeder zählt die Würmer auf den eigenen Chips.",
      ],
    },
  ],
  note: 'Der Name ist ein Wortspiel: „Heckmeck" heißt Aufregung um nichts, und das „Bratwurmeck" ist das Bratwurst-Eck mit einem Wurm darin. Reiner Knizia hat das Spiel 2005 bei Zoch herausgebracht.',
};
