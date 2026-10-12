/**
 * The rules page behind the "? Regeln" button.
 *
 * @module
 * @remarks
 * The short version of docs/games/scotland-yard/game-rules.md - what somebody
 * in the middle of a chase needs to look up.
 */
import type { GameRules } from "@/components/game-rules";

/** Scotland Yard, as the dialog shows it. */
export const SCOTLAND_YARD_RULES: GameRules = {
  title: "Scotland Yard",
  players:
    "2 bis 6 Spieler - Mister X gegen die Detektive, bis 4 Spieler mit Bobbys",
  intro:
    "Mister X flieht kreuz und quer durch London, mit Taxi, Bus und " +
    "Underground. Die Detektive sehen nur, womit er fährt - nicht wohin. " +
    "Zieht ein Detektiv oder ein Bobby auf seine Station, ist er gefasst. " +
    "Hält er 22 Runden durch, hat er gewonnen.",
  sections: [
    {
      title: "Eine Runde",
      list: [
        "Zuerst zieht Mister X - verdeckt: Die Detektive sehen nur sein Ticket.",
        "Dann ziehen die Detektive und Bobbys, einer nach dem anderen.",
        "Wer ziehen kann, muss ziehen. Wer nicht kann, setzt aus.",
        "Auf jeder Station steht höchstens eine Figur - nur Mister X darf ein Detektiv einholen.",
      ],
    },
    {
      title: "Fahren",
      body: [
        "Jede Station zeigt, welche Verkehrsmittel dort halten. Mit einem " +
          "Ticket fährt man entlang einer Linie bis zur nächsten Haltestelle " +
          "desselben Verkehrsmittels.",
      ],
      table: [
        ["Ticket", "Linie", "Reichweite"],
        ["Taxi", "gelb", "kurz, hält überall"],
        ["Bus", "türkis", "mittel"],
        ["Underground", "rot", "weit, wenige Stationen"],
        ["Black-Ticket", "jede, auch die Fähre", "nur Mister X"],
      ],
    },
    {
      title: "Tickets",
      list: [
        "Jeder Detektiv hat 11 Taxi-, 8 Bus- und 4 Underground-Tickets und darf nicht tauschen.",
        "Bobbys brauchen keine Tickets.",
        "Benutzte Tickets der Detektive gehen in den Vorrat, aus dem Mister X fährt.",
        "Mister X hat 5 Black-Tickets und 2 Doppelzüge - höchstens ein Doppelzug pro Runde.",
      ],
    },
    {
      title: "Mister X taucht auf",
      body: [
        "Nach seinem 3., 8., 13., 18. und 24. Zug zeigt sich Mister X auf " +
          "seiner Station - beim nächsten Zug ist er wieder verschwunden.",
      ],
    },
    {
      title: "Bobbys",
      table: [
        ["Spieler", "Detektive", "Bobbys"],
        ["2", "2 (ein Spieler)", "2"],
        ["3", "2", "2"],
        ["4", "3", "1"],
        ["5", "4", "-"],
        ["6", "5", "-"],
      ],
    },
    {
      title: "Ende",
      list: [
        "Die Detektive gewinnen, wenn eine ihrer Figuren auf Mister X' Station zieht - oder wenn er keine freie Station mehr hat.",
        "Mister X gewinnt, wenn er nach der 22. Runde noch frei ist - oder wenn kein Detektiv und kein Bobby mehr ziehen kann.",
      ],
    },
    {
      title: "Einsteigerspiel",
      body: [
        "13 Runden, ohne Underground und ohne Tickets. Mister X startet auf " +
          "82 und ist sichtbar, nur beim 3., 8. und 13. Zug - und einmal mit " +
          "seinem Black-Ticket - taucht er ab. Die Detektive starten auf 41, " +
          "46, 124 und mit vier Detektiven auch auf 142. Ein Doppelzug.",
      ],
    },
  ],
  note:
    "Hier ziehen die Detektive in fester Reihenfolge statt in beliebiger - " +
    "so ist online immer klar, wer am Zug ist.",
};
