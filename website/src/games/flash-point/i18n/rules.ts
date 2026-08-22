/**
 * The rules page behind the "? Regeln" button.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** Flash Point, as the dialog shows it. */
export const FLASH_POINT_RULES: GameRules = {
  title: "Flash Point: Fire Rescue",
  players: "1 bis 6 Spieler - kooperativ",
  intro:
    "Ihr seid die Feuerwehr. Holt sieben Menschen aus dem brennenden Haus, " +
    "bevor drei von ihnen sterben oder das Gebäude einstürzt. Jeder Zug hat " +
    "vier Aktionspunkte - danach breitet sich das Feuer aus.",
  sections: [
    {
      title: "Ein Zug",
      list: [
        "Aktionen ausführen: 4 Aktionspunkte, in beliebiger Reihenfolge.",
        "Das Feuer breitet sich aus: es wird gewürfelt.",
        "Einsatzsymbole auffüllen: es müssen immer 3 auf dem Plan liegen.",
      ],
    },
    {
      title: "Was was kostet",
      table: [
        ["Aktion", "AP"],
        ["Auf ein Feld ohne Feuer gehen", "1"],
        ["Auf ein Feld mit Feuer gehen", "2"],
        ["Mit einem Opfer gehen (nie ins Feuer)", "2"],
        ["Tür öffnen oder schließen", "1"],
        ["Feuer zu Rauch, oder Rauch löschen", "1"],
        ["Wand einschlagen", "2"],
        ["Einsatzsymbol aufdecken", "0"],
      ],
    },
    {
      title: "Wenn das Feuer dran ist",
      list: [
        "Rauch auf Rauch wird Feuer.",
        "Rauch neben Feuer wird sofort Feuer.",
        "Rauch auf Feuer ist eine Explosion: in alle vier Richtungen.",
        "Eine Explosion beschädigt angrenzende Wände und zerstört angrenzende Türen.",
        "Trifft sie schon brennende Felder, läuft eine Druckwelle weiter, bis etwas sie aufhält.",
        "Danach: jeder Rauch neben Feuer wird Feuer, bis keiner mehr übrig ist.",
      ],
    },
    {
      title: "Gefahr",
      body: [
        "Wer im Feuer steht, wird zu Boden geworfen und kommt zum nächsten " +
          "Rettungswagen. Ein getragenes Opfer stirbt dabei. Opfer, die im Feuer " +
          "liegen, sterben ebenfalls.",
      ],
    },
    {
      title: "Ende",
      list: [
        "Sieg: 7 Opfer gerettet.",
        "Niederlage: 3 Opfer tot.",
        "Einsturz: alle 24 Schadenszähler verbraucht - sofort vorbei.",
      ],
    },
  ],
  note:
    "Flash Point: Fire Rescue von Kevin Lanzing - Regeln für Anfänger. " +
    "Der Grundriss ist nicht der aus der Schachtel, sondern ein eigener; " +
    "warum, steht in docs/games/flash-point/game-rules.md.",
};
