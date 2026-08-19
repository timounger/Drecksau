/**
 * The Binokel rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const BINOKEL_RULES: GameRules = {
  title: "Binokel",
  players: "3 bis 6 Spieler",
  intro:
    "Schwäbisches Stichspiel: Reizen, Melden, Stechen. Wer zuerst die vereinbarte Zielpunktzahl erreicht - standardmäßig 1000 -, gewinnt die Partie.",
  sections: [
    {
      title: "Die Karten",
      body: [
        "Doppeltes deutsches Blatt, jede Karte zweimal, in den Farben Eichel, Blatt, Herz und Schellen.",
        "Wichtig: Der Zehner ist die zweithöchste Karte, direkt unter dem Daus - nicht zwischen König und Neun.",
      ],
      table: [
        ["Rang", "Wert"],
        ["Daus (Ass)", "11"],
        ["Zehner", "10"],
        ["König", "4"],
        ["Ober", "3"],
        ["Unter", "2"],
        ["Sieben", "0"],
      ],
    },
    {
      title: "Am Tisch",
      body: [
        "Zu dritt bis zu sechst. Zu viert und zu sechst kann auch im Team gespielt werden - Kreuzbinokel, bei dem sich gegenübersitzt, wer zusammengehört.",
        "In den Einstellungen wählbar: mit oder ohne Siebener, mit oder ohne Dabb, die Zielpunktzahl der Partie sowie die Namen für Farben, Daus, Dix und das Reizen - je nachdem, wie es bei dir am Tisch heißt.",
      ],
    },
    {
      title: "Geben",
      body: ["So viele Karten je Person, dass der Rest genau den Dabb ergibt:"],
      table: [
        ["Spieler", "ohne Siebener (40)", "mit Siebenern (48)"],
        ["3", "je 12, Dabb 4", "je 15, Dabb 3"],
        ["4", "je 9, Dabb 4", "je 11, Dabb 4"],
        ["5", "je 7, Dabb 5", "je 9, Dabb 3"],
        ["6", "je 6, Dabb 4", "je 7, Dabb 6"],
      ],
    },
    {
      title: "Der Dabb",
      body: [
        "Er liegt verdeckt. Wer das Reizen gewinnt, ist Spielmacher, nimmt ihn auf und drückt danach genauso viele Karten wieder ab.",
        "Beim Aufnehmen liegt der Dabb offen: Alle sehen, was der Spielmacher bekommt. Das ist keine Nebensächlichkeit, sondern Information, mit der die Gegenpartei spielt.",
        "Ohne Dabb werden die Karten einfach gleichmäßig ausgeteilt; was nicht aufgeht, bleibt als kleiner Rest liegen.",
      ],
    },
    {
      title: "Reizen",
      body: [
        'Als Duell, nicht reihum. Die Vorhand - links vom Geber - hält zunächst den Reiz. Der nächste Spieler reizt gegen sie; beide gehen abwechselnd in Zehnerschritten hoch, bis einer „weg" sagt. Der Gewinner reizt gegen den nächsten.',
        "Der zuletzt Verbliebene ist Spielmacher und hat den Reizwert als Zielvorgabe. Das Mindestgebot ist 150; passen alle Herausforderer, spielt die Vorhand zum Mindestgebot.",
      ],
    },
    {
      title: "Melden",
      body: [
        "Meldepunkte zählen nur, wenn der meldende Spieler mindestens einen Stich macht. Zuerst meldet der Spielmacher, dann die Gegner.",
      ],
      table: [
        ["Meldung", "Punkte", "in Trumpf"],
        ["Dix (Trumpf-Sieben)", "10", "-"],
        ["Paar König + Ober einer Farbe", "20", "40"],
        ["Binokel (Blatt-Ober + Schellen-Unter)", "40", "-"],
        ["Vier Unter", "40", "-"],
        ["Vier Ober", "60", "-"],
        ["Vier Könige", "80", "-"],
        ["Vier Dausen", "100", "-"],
        ["Familie (Daus bis Unter einer Farbe)", "100", "150"],
        ["Rundgang (in jeder Farbe ein Paar)", "240", "-"],
        ["Doppelbinokel", "300", "-"],
        ["Acht Gleiche", "1000", "-"],
        ["Doppelte Familie", "1500", "-"],
      ],
    },
    {
      title: "Welche Karte in welcher Meldung zählt",
      list: [
        "Eine Familie verbraucht ihren König und Ober - dieselben Karten bilden kein zusätzliches Paar.",
        "Der Rundgang wird aus den nach den Familien übrigen Paaren gebildet und geht Einzelpaaren vor.",
        "Vier oder acht Gleiche, Binokel und Dix zählen unabhängig und dürfen Karten mitbenutzen.",
        '„Vier Gleiche" braucht vier verschiedene Farben desselben Rangs; die zweiten Exemplare zählen erst bei „Acht Gleiche".',
      ],
    },
    {
      title: "Stechen",
      body: [
        "Zum ersten Stich spielt die Vorhand aus - nicht der Spielmacher. Nur beim Durch kommt der Spielmacher selbst heraus.",
        "Es gelten vier Zwänge, in dieser Reihenfolge:",
      ],
      list: [
        "Farbzwang: Angespielte Farbe bedienen, wenn möglich.",
        "Stichzwang: Wer bedienen kann, muss den bisher höchsten Wert überbieten, wenn er eine höhere Karte derselben Farbe hat.",
        "Trumpfzwang: Wer die Farbe nicht bedienen kann, muss Trumpf spielen - und einen liegenden Trumpf überstechen, wenn möglich.",
        "Wer weder bedienen noch trumpfen kann, gibt eine beliebige Karte zu.",
      ],
    },
    {
      title: "Wer den Stich bekommt",
      body: [
        "Trumpf sticht jede andere Farbe. Bei zwei wertgleichen höchsten Karten gewinnt die zuerst gespielte. Der Stichgewinner spielt zum nächsten Stich aus.",
        "Der letzte Stich bringt zusätzlich 10 Punkte. Insgesamt liegen 250 Stichpunkte in einer Runde.",
      ],
    },
    {
      title: "Durch",
      body: [
        'Statt eines normalen Spiels darf der Spielmacher nach dem Melden „Durch" ansagen: Er nimmt sich vor, jeden einzelnen Stich zu machen. Dann kommt er auch selbst heraus.',
        "Gelingt es, gibt es 1000 Punkte. Geht ein einziger Stich an die Gegenseite, sind es 1000 Punkte Minus. Meldungen und Stichpunkte spielen dabei keine Rolle.",
      ],
    },
    {
      title: "Wertung einer Runde",
      body: [
        "Jede und jeder zählt Stichpunkte plus eigene Meldepunkte - Letztere nur bei mindestens einem Stich. Die Stichpunkte werden auf Zehner gerundet.",
        "Erreicht der Spielmacher seinen Reizwert, bekommen alle ihre Punkte gutgeschrieben. Geht er ab, wird ihm der doppelte Reizwert abgezogen und seine Meldungen verfallen; die Gegner werten normal.",
      ],
    },
    {
      title: "Gesamtpartie",
      body: [
        "Die Punkte werden über die Runden fortgeschrieben. Erreicht jemand durch ein gewonnenes - nicht abgegangenes - Spiel die vereinbarte Zielpunktzahl, ist die Partie zu Ende. Standard sind 1000 Punkte, einstellbar.",
        "Im Team zählt die Partie für beide gemeinsam.",
      ],
    },
  ],
};
