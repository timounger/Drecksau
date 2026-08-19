/**
 * The Skyjo rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const SKYJO_RULES: GameRules = {
  title: "Skyjo",
  players: "2 bis 8 Spieler",
  intro:
    "Wenig ist gut. Jede Karte, die am Rundenende noch vor dir liegt, zählt gegen dich. Sobald jemand die Punktgrenze reißt, ist Schluss - und wer die wenigsten Punkte hat, gewinnt.",
  sections: [
    {
      title: "Das Material",
      body: [
        "150 Karten mit Werten von -2 bis 12: fünfmal die -2, zehnmal die -1, fünfzehnmal die 0 und je zehnmal die 1 bis 12. Farben gibt es nicht - eine Karte ist nichts als ihr Wert.",
      ],
    },
    {
      title: "Aufbau",
      list: [
        "Jede und jeder bekommt 12 Karten verdeckt, ausgelegt als vier Spalten zu drei Reihen.",
        "Die nächste Karte kommt offen als Ablagestapel aus, der Rest ist der Nachziehstapel.",
        "Alle decken zwei ihrer Karten auf.",
        "Es beginnt, wer die höchste Summe seiner beiden offenen Karten zeigt.",
      ],
    },
    {
      title: "Ein Zug",
      body: ["Reihum genau eine der beiden Möglichkeiten:"],
      list: [
        "Die offene Karte vom Ablagestapel nehmen und gegen eine eigene tauschen - egal ob offen oder verdeckt. Die ersetzte Karte kommt offen auf den Ablagestapel.",
        "Verdeckt ziehen. Danach entweder die gezogene Karte gegen eine eigene tauschen, oder sie wegwerfen und stattdessen eine eigene verdeckte Karte aufdecken.",
      ],
    },
    {
      title: "Nach dem Tausch",
      body: [
        "Eine getauschte Karte liegt danach immer offen. Ist der Nachziehstapel leer, wird der Ablagestapel ohne seine oberste Karte neu gemischt.",
      ],
    },
    {
      title: "Die Spalten-Regel",
      body: [
        "Zeigt eine Spalte drei gleiche offene Karten, fliegt die ganze Spalte sofort aus dem Spiel und zählt nichts mehr.",
        "Das ist der Hebel des Spiels: Eine Spalte aus drei Zwölfen ist 36 Punkte wert, die auf einen Schlag verschwinden.",
      ],
    },
    {
      title: "Rundenende",
      body: [
        "Sobald jemand alle zwölf Karten offen hat, endet die Runde - alle anderen sind aber noch genau einmal dran. Danach werden alle verbliebenen Karten aufgedeckt und jede Auslage zusammengezählt.",
      ],
    },
    {
      title: "Die Strafe für den Beender",
      body: [
        "Wer die Runde beendet, geht eine Wette ein: Er muss allein die niedrigste Punktzahl haben. Ist jemand gleichauf oder darunter, zählt seine Punktzahl doppelt.",
        "Eine Punktzahl von 0 oder weniger wird allerdings nie verdoppelt - die Verdopplung ist eine Strafe und soll den Beender nicht belohnen.",
      ],
    },
    {
      title: "Spielende",
      body: [
        "Nach jeder Runde werden die Punkte addiert. Erreicht jemand 100 Punkte oder mehr, ist das Spiel vorbei. Es gewinnt, wer insgesamt die wenigsten Punkte hat.",
      ],
    },
  ],
};
