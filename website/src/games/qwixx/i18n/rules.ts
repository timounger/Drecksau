/**
 * The Qwixx rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const QWIXX_RULES: GameRules = {
  title: "Qwixx",
  players: "2 bis 5 Spieler",
  intro:
    "Würfelspiel von Steffen Benndorf. Jede und jeder kreuzt auf dem eigenen Zettel Zahlen an - wer am Ende die meisten Punkte hat, gewinnt.",
  sections: [
    {
      title: "Der Zettel",
      body: [
        "Vier Reihen mit je elf Zahlen: Rot und Gelb laufen von 2 nach 12, Grün und Blau von 12 nach 2. Dazu vier Kästchen für Fehlwürfe.",
      ],
    },
    {
      title: "Die eine Regel, die alles bestimmt",
      body: [
        "In einer Reihe wird nur von links nach rechts angekreuzt. Jede Zahl, die du überspringst, ist für den Rest des Spiels weg.",
        "Die 9 zu nehmen, wenn die Reihe bei der 4 steht, kostet dich nicht die 9 - es kostet dich die 5, 6, 7 und 8.",
      ],
    },
    {
      title: "Ablauf eines Zuges",
      body: [
        "Wer am Zug ist, würfelt alle sechs Würfel: zwei weiße und vier farbige. Dann kommen zwei Schritte, und sie gehören verschiedenen Leuten.",
      ],
      list: [
        "Weiße Würfel - alle dürfen: Jede und jeder darf die Summe der beiden weißen Würfel in einer beliebigen Reihe ankreuzen. Oder auch nicht.",
        "Farbwürfel - nur wer am Zug ist: Er darf zusätzlich einen weißen mit einem farbigen Würfel kombinieren und die Summe in der Reihe dieser Farbe ankreuzen.",
      ],
    },
    {
      title: "Fehlwurf",
      body: [
        "Wer am Zug ist und in keinem der beiden Schritte etwas angekreuzt hat, muss einen Fehlwurf eintragen. Die Mitspieler trifft das nie - für sie ist Verzichten gratis.",
      ],
    },
    {
      title: "Reihen schließen",
      body: [
        "Die letzte Zahl einer Reihe (12 bei Rot und Gelb, 2 bei Grün und Blau) darf nur ankreuzen, wer in dieser Reihe schon mindestens fünf Kreuze hat.",
        "Wer sie nimmt, schließt die Reihe: Der Farbwürfel kommt vom Tisch, niemand kann diese Farbe mehr nutzen. Das Schloss zählt als zusätzliches Kreuz.",
      ],
    },
    {
      title: "Spielende",
      list: [
        "Zwei Reihen sind geschlossen, oder",
        "jemand trägt seinen vierten Fehlwurf ein.",
      ],
    },
    {
      title: "Wertung",
      body: [
        "Je Reihe zählen die Kreuze - das Schloss mitgezählt - als Dreieckszahl. Jeder Fehlwurf zählt -5.",
        "Dass die Punkte so steil wachsen, ist der Grund, sich auf wenige Reihen zu konzentrieren statt überall ein bisschen anzukreuzen: doppelt so viele Kreuze sind viermal so viele Punkte.",
      ],
      table: [
        ["Kreuze", "1", "2", "3", "4", "5", "6", "7", "8"],
        ["Punkte", "1", "3", "6", "10", "15", "21", "28", "36"],
        ["Kreuze", "9", "10", "11", "12", "", "", "", ""],
        ["Punkte", "45", "55", "66", "78", "", "", "", ""],
      ],
    },
  ],
  note: "Qwixx war 2013 für das Spiel des Jahres nominiert; gewonnen hat Hanabi.",
};
