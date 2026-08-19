/**
 * The Kniffel rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const KNIFFEL_RULES: GameRules = {
  title: "Kniffel",
  players: "1 bis 6 Spieler",
  intro:
    "Der Würfelklassiker, die deutsche Fassung von Yahtzee. Fünf Würfel, drei Würfe, dreizehn Felder - jedes davon genau einmal. Wer am Ende die höchste Summe hat, gewinnt. Allein zu spielen ist ausdrücklich vorgesehen.",
  sections: [
    {
      title: "Ein Zug",
      body: [
        "Fünf Würfel, drei Würfe. Nach dem ersten und zweiten Wurf darfst du beliebig viele Würfel liegen lassen und den Rest erneut werfen.",
        "Danach muss das Ergebnis in ein noch freies Feld eingetragen werden - notfalls als Null. Nach dreizehn Runden ist der Block voll.",
      ],
    },
    {
      title: "Oberer Teil",
      body: [
        "Gezählt wird jeweils die Summe der Würfel dieser Zahl. Bei den Vierern zählen also nur die Vieren.",
      ],
      table: [
        ["Feld", "Ergibt"],
        ["Einser bis Sechser", "Summe aller Würfel dieser Zahl"],
      ],
    },
    {
      title: "Bonus",
      body: [
        "Wer im oberen Teil 63 Punkte oder mehr hat, bekommt 35 Punkte dazu. Dreiundsechzig ist genau dreimal jede Zahl - das ist der Maßstab, an dem man während des Spiels misst.",
      ],
    },
    {
      title: "Unterer Teil",
      table: [
        ["Feld", "Bedingung", "Ergibt"],
        ["Dreierpasch", "drei gleiche", "Summe aller fünf"],
        ["Viererpasch", "vier gleiche", "Summe aller fünf"],
        ["Full House", "drei gleiche + zwei gleiche", "25"],
        ["Kleine Straße", "vier in Folge", "30"],
        ["Große Straße", "fünf in Folge", "40"],
        ["Kniffel", "fünf gleiche", "50"],
        ["Chance", "beliebig", "Summe aller fünf"],
      ],
      body: [
        'Ein Kniffel zählt nicht als Full House - fünf gleiche sind nicht „drei und zwei". Der deutsche Block ist da streng.',
      ],
    },
    {
      title: "Spielende und Wertung",
      body: [
        "Sind alle Blöcke voll, zählt jede und jeder zusammen: oberer Teil, Bonus, unterer Teil. Die höchste Summe gewinnt.",
      ],
    },
    {
      title: "Was hier anders ist",
      list: [
        "Kein Kniffel-Bonus und keine Joker-Regel: Die amerikanische Yahtzee-Fassung gibt für jeden weiteren Kniffel 100 Punkte extra. Der klassische deutsche Block hat das nicht.",
        "Der erste Wurf passiert automatisch - er ist keine Entscheidung, sondern der Anfang des Zuges.",
        "Der Block zeigt, was ein Feld gerade brächte. Eine Null steht rot da, damit klar ist, dass Eintragen das Feld streicht.",
        "Die Würfel liegen aufsteigend sortiert. Nur fürs Auge - behaltene Würfel wandern beim Sortieren mit und bleiben behalten.",
      ],
    },
  ],
};
