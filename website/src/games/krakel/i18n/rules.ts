/**
 * The Krakel Orakel rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const KRAKEL_RULES: GameRules = {
  title: "Krakel Orakel",
  players: "2 bis 8 Spieler",
  intro:
    "Kooperativ: Es gibt keine Einzelwertung und keinen Gegner. Alle teilen sich eine Punktzahl und spielen gemeinsam gegen das Brett.",
  sections: [
    {
      title: "Ablauf",
      body: [
        "Eine Partie geht über drei Runden. Jede Runde hat drei Phasen: Malen, Ausschließen, Auflösung.",
      ],
    },
    {
      title: "1. Malen - 120 Sekunden, alle gleichzeitig",
      list: [
        "Jede Person bekommt heimlich ein eigenes Wort und eine eigene Tafel.",
        "Alle malen zeitgleich. Niemand sieht die Tafel der anderen.",
        "Gemalt werden darf nur auf den vorgedruckten Punkten der Tafel. Der Stift rastet auf den nächsten Punkt ein; abseits der Linien hebt er ab.",
        'Wer fertig ist, drückt „Fertig". Sind alle fertig, endet die Phase sofort.',
      ],
    },
    {
      title: "2. Ausschließen - reihum, 45 Sekunden pro Zug",
      list: [
        "Alle Tafeln liegen offen. Dazu erscheint eine Wortliste: alle gemalten Wörter plus vier, die niemand gemalt hat.",
        "Reihum streicht jeweils eine Person ein Wort, von dem sie glaubt, dass es niemand gemalt hat.",
        "Es gibt genau vier Züge pro Runde - einen je Zusatzwort.",
        "Ob der Zug richtig war, ist sofort sichtbar. Das ist Absicht: Die Gruppe soll aus dem Fehler für die nächsten Züge lernen.",
        "Läuft die Zeit ab, streicht die Uhr ein zufälliges Wort, damit die Runde nicht hängen bleibt.",
      ],
    },
    {
      title: "3. Auflösung",
      body: [
        "Jede Tafel zeigt ihr Wort. Danach beginnt die nächste Runde, oder das Spiel endet.",
      ],
    },
    {
      title: "Punkte",
      table: [
        ["Ereignis", "Punkte"],
        ["Ein Zusatzwort gestrichen (richtig)", "+3"],
        ["Ein gemaltes Wort gestrichen (falsch)", "-2"],
      ],
      body: [
        "Die Punkte sind ein gemeinsames Konto, kein Wert pro Person. Höchstpunktzahl: drei Runden mal vier Zusatzwörter mal drei Punkte, also 36.",
      ],
    },
    {
      title: "Abschlusswertung",
      table: [
        ["Anteil am Maximum", "Titel"],
        ["100 %", "Hellseher"],
        ["ab 80 %", "Orakel"],
        ["ab 50 %", "Gute Spürnasen"],
        ["ab 20 %", "Ahnungsvoll"],
        ["darunter", "Blindgänger"],
      ],
    },
    {
      title: "Schwierigkeit",
      body: [
        'Vor dem Spiel wird eine von zwei Wortlisten gewählt. Schwer heißt nicht „mehr Wörter", sondern „schwerer zu malen": Begriffe wie Langeweile oder Vergangenheit müssen über einen Umweg dargestellt werden, den die anderen lesen können.',
      ],
    },
    {
      title: "Warum es mit mehr Leuten schwerer wird",
      body: [
        "Pro Runde stehen Spielerzahl plus vier Wörter auf der Liste, davon immer genau vier Zusatzwörter. Zu zweit sind das sechs Wörter, zu acht zwölf - der Anteil der Zusatzwörter sinkt also mit der Gruppengröße.",
      ],
    },
  ],
};
