/**
 * The rules page behind the "? Regeln" button.
 *
 * @module
 * @remarks
 * The short version of docs/games/sky-team/game-rules.md - what somebody
 * mid-landing needs to look up, and nothing they do not.
 */
import type { GameRules } from "@/components/game-rules";

/** Sky Team, as the dialog shows it. */
export const SKY_TEAM_RULES: GameRules = {
  title: "Sky Team",
  players: "Genau 2 Spieler - kooperativ",
  intro:
    "Ihr fliegt zu zweit ein Passagierflugzeug und landet es in sieben Runden. " +
    "Jede:r würfelt vier Würfel verdeckt und setzt sie abwechselnd ins Cockpit. " +
    "Absprechen dürft ihr euch nur vor dem Würfeln - danach wird geschwiegen.",
  sections: [
    {
      title: "Eine Runde",
      list: [
        "Absprechen, dann je 4 Würfel verdeckt werfen. Ab jetzt: still.",
        "Abwechselnd je 1 Würfel auf ein freies Feld eurer Farbe legen.",
        "Sind alle 8 Würfel gelegt: 1000 Fuß sinken, Würfel zurück.",
      ],
    },
    {
      title: "Pflichtfelder",
      body: [
        "Ruder und Triebwerke müssen jede Runde von beiden belegt werden. " +
          "Fehlt am Rundenende einer davon, ist die Partie verloren.",
      ],
    },
    {
      title: "Was die Felder tun",
      table: [
        ["Feld", "Wer", "Zahlen", "Wirkung"],
        ["Ruder", "beide", "beliebig", "Differenz kippt das Flugzeug"],
        ["Triebwerke", "beide", "beliebig", "Summe = Geschwindigkeit"],
        [
          "Fahrwerk",
          "Pilotin",
          "1/2, 3/4, 5/6",
          "Luftwiderstand, beliebige Reihenfolge",
        ],
        [
          "Landeklappen",
          "Co-Pilot",
          "1/2, 2/3, 4/5, 5/6",
          "der Reihe nach, von oben",
        ],
        [
          "Bremsen",
          "Pilotin",
          "2, dann 4, dann 6",
          "Bremskraft für die Landung",
        ],
        ["Funk", "beide", "beliebig", "räumt ein Flugzeug im Anflug weg"],
        [
          "Konzentration",
          "beide",
          "beliebig",
          "eine Tasse Kaffee, höchstens 3",
        ],
      ],
    },
    {
      title: "Geschwindigkeit",
      list: [
        "Höchstens so viel wie der blaue Marker: kein Feld weiter.",
        "Zwischen den Markern: 1 Feld weiter.",
        "Mehr als der orange Marker: 2 Felder weiter.",
        "Fahrwerk schiebt den blauen Marker, Landeklappen den orangen - beides ist Luftwiderstand.",
      ],
    },
    {
      title: "So verliert ihr sofort",
      list: [
        "Das Ruder erreicht ein rotes ✕ - ihr geratet ins Trudeln.",
        "Ihr müsst weiterfliegen, obwohl auf eurer Position noch ein Flugzeug steht.",
        "Ihr müsst weiterfliegen, obwohl ihr schon über dem Flughafen seid.",
        "Die Höhe ist aufgebraucht, aber ihr seid noch nicht am Flughafen.",
      ],
    },
    {
      title: "So gewinnt ihr",
      list: [
        "Kein Flugzeug mehr auf der Entfernungsleiste.",
        "Alle Fahrwerksteile und alle Landeklappen ausgefahren.",
        "Das Ruder genau waagerecht.",
        "Die Geschwindigkeit nicht größer als eure Bremskraft.",
      ],
    },
  ],
  note:
    "Sky Team von Luc Rémond, KOSMOS - Spiel des Jahres 2024. Umgesetzt ist das " +
    "erste Szenario, Montreal.",
};
