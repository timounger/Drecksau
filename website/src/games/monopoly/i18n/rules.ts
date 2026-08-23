/**
 * The rules of Monopoly, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const MONOPOLY_RULES: GameRules = {
  title: "Monopoly",
  players: "2 bis 6 Spieler",
  intro:
    "Zieh um den Spielplan und kaufe so viele Grundstücke wie möglich. Je mehr du besitzt, desto mehr Miete kassierst du. Wer am Ende nicht pleite ist, hat gewonnen.",
  sections: [
    {
      title: "Ein Zug",
      list: [
        "Beide Würfel werfen",
        "So viele Felder im Uhrzeigersinn ziehen",
        "Tun, was das Feld sagt",
        "Bauen, handeln, Hypotheken - und Zug beenden",
      ],
    },
    {
      title: "Pasch",
      body: [
        "Nach einem Pasch würfelst du noch einmal und ziehst noch einmal.",
        "Drei Pasch hintereinander: sofort ins Gefängnis. Der dritte Zug wird nicht ausgeführt.",
      ],
    },
    {
      title: "Freie Grundstücke",
      body: [
        "Landest du auf einem Grundstück ohne Besitzer, musst du es kaufen - oder versteigern lassen. Beides steht so in der Anleitung; nicht kaufen und liegen lassen gibt es nicht.",
        "Die Versteigerung startet bei 10 € und geht in 1-€-Schritten. Bietet niemand, bleibt die Karte bei der Bank.",
      ],
    },
    {
      title: "Miete",
      body: [
        "Straßen: der Betrag auf der Besitzrechtkarte. Wem die ganze Farbgruppe gehört, bekommt für unbebaute Straßen die doppelte Miete.",
        "Bahnhöfe: 25 €, 50 €, 100 € oder 200 €, je nachdem wie viele der Besitzer hat.",
        "Versorgungswerke: der Würfelwurf mal 4, bei beiden Werken mal 10.",
        "Für Grundstücke mit Hypothek gibt es keine Miete.",
      ],
    },
    {
      title: "Verstärkung durch Gebäude",
      body: [
        "Sobald dir alle Straßen einer Farbe gehören, kannst du Häuser kaufen - auch wenn du nicht am Zug bist.",
        "Gleichmäßig bauen: Auf jeder Straße der Gruppe muss ein Haus stehen, bevor irgendwo ein zweites steht. Höchstens 4 Häuser, dann ein Hotel gegen Rückgabe der 4 Häuser.",
        "Die Bank hat 32 Häuser und 12 Hotels. Sind sie weg, sind sie weg.",
      ],
    },
    {
      title: "Geld auftreiben",
      body: [
        "Gebäude gehen zum halben Kaufpreis an die Bank zurück - ebenfalls gleichmäßig über die Farbgruppe.",
        "Eine Hypothek bringt den Hypothekenwert; das Auflösen kostet ihn plus 10 %. Beleihen geht nur, wenn auf der ganzen Farbgruppe kein Gebäude mehr steht.",
        "Reicht das alles nicht, bist du pleite und scheidest aus.",
      ],
    },
    {
      title: "Gefängnis",
      body: [
        "Drei Wege heraus: 50 € zahlen, eine Freikarte ausspielen, oder einen Pasch würfeln. Mit dem Pasch ziehst du sofort heraus, aber ohne weiteren Wurf.",
        "Nach dem dritten Fehlversuch zahlst du 50 € und ziehst mit dem letzten Wurf heraus.",
        "Im Gefängnis kassierst du weiter Miete, baust, beleihst und handelst ganz normal.",
      ],
    },
    {
      title: "Die Aktionsfelder",
      table: [
        ["Feld", "Was passiert"],
        ["LOS", "200 € - auch im Vorübergehen"],
        ["Ereignis / Gemeinschaft", "Oberste Karte ziehen und ausführen"],
        ["Einkommensteuer", "200 € an die Bank"],
        ["Zusatzsteuer", "100 € an die Bank"],
        ["Gehen Sie ins Gefängnis", "Sofort dorthin, ohne 200 € für LOS"],
        ["Frei Parken", "Gar nichts"],
        ["Nur zu Besuch", "Gar nichts"],
      ],
    },
    {
      title: "Frei Parken bringt nichts",
      body: [
        'Das ist keine Vergesslichkeit, sondern steht als Supertipp in der Anleitung: „Legen Sie niemals Geld in die Mitte des Spielplans: Sie erhalten keinen Bonus, wenn Sie auf Frei Parken landen!"',
        "Die anderen Supertipps: auf Hausregeln verzichten, immer versteigern lassen, sich untereinander kein Geld leihen und nicht auf Mietzahlungen verzichten. Alles vier hält diese Umsetzung ein.",
      ],
    },
    {
      title: "Handeln",
      body: [
        "Grundstücke lassen sich jederzeit an Mitspieler verkaufen oder tauschen, zu frei vereinbarten Preisen. Gebäude nicht - die müssen vorher an die Bank zurück, und zwar die der ganzen Farbgruppe.",
        "Ein Grundstück mit Hypothek darf mitgehen; der neue Besitzer zahlt der Bank sofort 10 % Zinsen vom Hypothekenwert.",
      ],
    },
  ],
  note: 'Monopoly von Hasbro, Ausgabe „Monopoly Klassik" (C1009). Der Spielplan ist der deutsche: Badstraße bis Schlossallee.',
};
