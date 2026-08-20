/**
 * The Jammerlappen rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const JAMMER_RULES: GameRules = {
  title: "Jammerlappen",
  players: "2 bis 6 Spieler",
  intro:
    "Kartenspiel um 56 Karten. Werde alle deine Karten los - Hand, offen und verdeckt. Es gibt keinen Gewinner, sondern nur einen Jammerlappen: wer als Letzter noch auf seinen Karten sitzt.",
  sections: [
    {
      title: "Vorbereitung",
      body: [
        "Jeder bekommt drei verdeckte Karten, darauf drei offene und zuletzt drei Handkarten. Der Rest ist der Aufnahmestapel.",
        "Vor dem ersten Zug darf jeder einmal eine Handkarte gegen eine seiner offenen Karten tauschen. Die verdeckten bleiben unberührt - sie dürfen weder getauscht noch angesehen werden.",
      ],
    },
    {
      title: "Grundregel",
      body: [
        "Du musst immer eine gleichwertige oder höhere Karte legen als die vorherige. Aktionskarten darfst du immer legen, solange du an der Reihe bist.",
        "Wer nicht legen kann, nimmt den gesamten Pot auf die Hand. Danach beginnt der nächste Spieler von vorn mit einer Karte seiner Wahl.",
      ],
    },
    {
      title: "Die Reihenfolge deiner Karten",
      list: [
        "Zuerst die Handkarten. Solange du welche hältst, sind die Tischkarten gesperrt.",
        "Dann die offenen Karten. Jede gespielte offene Karte gibt die verdeckte darunter frei.",
        "Verdeckte Karten werden immer blind gespielt. Reicht die Karte nicht, nimmst du den Pot samt dieser Karte auf.",
        "Hast du keine Handkarten mehr und passt keine deiner offenen Karten, musst du trotzdem eine legen und sie zusammen mit dem Pot aufnehmen.",
      ],
    },
    {
      title: "Nachziehen",
      body: [
        "Solange der Aufnahmestapel Karten hat, hältst du nach jedem Ablegen wieder mindestens drei Handkarten. Wer mehr als drei hält, zieht nicht nach.",
        "Ist der Stapel leer, wird nur noch mit dem gespielt, was da ist - und erst dann kommen die Tischkarten überhaupt ins Spiel.",
      ],
    },
    {
      title: "Mehrere gleiche Karten",
      body: [
        "Gleiche Zahlenkarten darfst du zusammen ablegen - auf der Hand wie bei den offenen Karten. Handkarten und offene Karten dürfen dabei nicht gemischt werden.",
      ],
    },
    {
      title: "Die Aktionskarten",
      table: [
        ["Karte", "Wirkung"],
        [
          "Dein Problem!",
          "Die zuletzt gespielte Zahlenkarte gilt für den nächsten Spieler",
        ],
        ["Richtungswechsel!", "Die Spielrichtung dreht sich um"],
        ["Aussetzen!", "Der nächste Mitspieler wird übersprungen"],
        ["Weg damit!", "Der ganze Pot geht raus - du beginnst neu"],
        ["Neustart!", "Der nächste beginnt neu, der Pot bleibt aber liegen"],
      ],
      body: [
        "Zu zweit gilt: Richtungswechsel gibt dem Gegenspieler den Zug, Aussetzen gibt ihn dir zurück.",
        "Vier Aktionskarten hintereinander - egal welche - nehmen den ganzen Pot samt der vierten aus dem Spiel. Wer sie gelegt hat, beginnt neu.",
      ],
    },
    {
      title: "Die 5 - Runter geht's!",
      body: [
        "Die 5 ist keine Aktionskarte und darf nur gelegt werden, wenn sie passt. Danach wird abwärts gespielt: bis jemand den Pot aufnehmen muss oder Weg damit! bzw. Neustart! gelegt wird.",
        "Gleiche Karten bleiben erlaubt - auf eine 5 darf also auch eine weitere 5.",
      ],
    },
    {
      title: "Quartett und Zwischenschmeißen",
      body: [
        "Werden alle vier Karten einer Sorte hintereinander gelegt, geht der Pot aus dem Spiel und wer das Quartett vollgemacht hat, beginnt neu.",
        "Wer das Quartett einer gerade gelegten Karte vervollständigen kann, darf auch dazwischenschmeißen, obwohl er gar nicht an der Reihe ist - du musst nur schneller sein als der nächste Mitspieler. Die Übersprungenen waren einfach zu langsam.",
        "Aktionskarten kann man nicht zwischenschmeißen: von ihnen gibt es kein Quartett.",
      ],
    },
    {
      title: "Zu zweit",
      body: [
        "Alle Richtungswechsel- und Aussetzen-Karten sowie von jeder Zahlenkarte eine kommen aus dem Spiel. Quartett und Zwischenschmeißen gelten dann schon für Drillinge.",
      ],
    },
    {
      title: "Rundenende",
      body: [
        "Wer alle Karten los ist - die verdeckten eingeschlossen - hat es geschafft. Die übrigen spielen weiter, bis einer übrig bleibt: der Jammerlappen. Er mischt, teilt aus, sorgt für neue Getränke und beginnt die nächste Runde.",
      ],
    },
  ],
  note: "Die Anleitung nennt 44 Zahlen- und 12 Aktionskarten, sagt aber nicht, welche Zahlen es gibt und wie sich die zwölf Aktionskarten auf die fünf Sorten verteilen. Hier wird mit den Zahlen 1 bis 11 zu je vier Karten gespielt.",
};
