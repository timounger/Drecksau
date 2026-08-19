/**
 * The rules of "Das politische Talent", as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const POLITIK_RULES: GameRules = {
  title: "Das politische Talent",
  players: "3 bis 6 Spieler",
  intro:
    "Wahlkampf, Koalitionen und Wahlversprechen. Wer am Ende die meisten Siegpunkte hat, gewinnt - Sitze allein reichen nicht.",
  sections: [
    {
      title: "Aufbau",
      body: [
        "Im Parlament liegen immer 60 Sitze, wie viele auch mitspielen. Deshalb ist die Mehrheit in jedem Spiel dieselbe Zahl: 31 Sitze.",
      ],
      table: [
        ["Spieler", "Startsitze je Partei", "Regierung-Karten"],
        ["3", "20", "Bundeskanzleramt, Finanzministerium"],
        ["4", "15", "+ Innenministerium"],
        ["5", "12", "+ Justizministerium"],
        ["6", "10", "wie bei 5"],
      ],
    },
    {
      title: "Was jede Partei bekommt",
      list: [
        "Eine Ausrichtung mit drei Themen (bei sechs Spielern vier). Sie bringt im Wahlkampf zwei statt einen Würfel, wenn das aktuelle Thema dazugehört - und Siegpunkte für Wahlversprechen dieser Themen.",
        "Zwei Wahlversprechen je Thema der Ausrichtung.",
        "Zwei verdeckte Opposition-Karten.",
        "Eine Kandidatin oder einen Kandidaten, gewählt aus zweien.",
        "Zwei verdeckte Skandale - sie begleiten diese Kandidatur bis zum Rücktritt.",
      ],
    },
    {
      title: "Ablauf",
      body: [
        "Drei Durchgänge aus Wahlkampf, Regierungsbildung und drei Spielrunden. Danach ein letzter Wahlkampf und die Schlusswertung.",
      ],
    },
    {
      title: "1. Wahlkampf",
      body: [
        "Reihum tritt jede Partei gegen die linke Nachbarpartei an; es beginnt, wer das Bundeskanzleramt hält. Beide werfen einen Würfel - zwei, wenn das aktuelle Thema zur eigenen Ausrichtung zählt - und addieren die Wahlkampfpunkte ihrer Kandidatur samt Bonus, Malus und aufgedeckten Skandalen.",
        "Wer höher liegt, gewinnt die Differenz als Sitze; die Verliererpartei verliert ebenso viele. Höchstens 3 Sitze je Duell, höchstens 26 Sitze je Partei, mindestens 0.",
      ],
    },
    {
      title: "2. Regierungsbildung",
      body: [
        "Die Partei mit den meisten Sitzen beginnt: Sie schlägt eine Koalition mit zusammen 31 oder mehr Sitzen vor und verteilt alle Regierung-Karten. Stimmen alle vorgeschlagenen Partner zu, steht die Regierung.",
        "Lehnt jemand ab, versucht es die nächststärkste Partei. Hat es jede Partei einmal versucht, wird der Durchgang ohne Regierung gespielt.",
        "Jede Regierung-Karte bringt am Ende jeder Spielrunde Siegpunkte: Bundeskanzleramt 3, Finanzministerium 2, Innenministerium 2, Justizministerium 1.",
      ],
    },
    {
      title: "3. Spielrunden",
      body: [
        "Drei Spielrunden. In jeder führt jede Partei genau eine Aktion aus, beginnend beim Bundeskanzleramt. Danach ist der Zug vorbei - egal, ob die Aktion gelungen ist.",
      ],
    },
    {
      title: "Aktionen, die immer gelingen",
      table: [
        ["Aktion", "Wirkung"],
        [
          "Kandidatur tauschen",
          "Zwei neue ziehen, eine behalten. Bonus, Malus und Skandale fallen weg, zwei neue Skandale kommen dazu. Wer keine Kandidatur hat, muss tauschen.",
        ],
        [
          "Opposition",
          "Eine Opposition-Karte ausspielen. Nur ohne Regierung-Karte. Die Karte ist danach aus dem Spiel.",
        ],
      ],
    },
    {
      title: "Aktionen mit Abstimmung",
      body: ["Nötig sind 31 Sitze dafür; die eigenen zählen mit."],
      table: [
        ["Aktion", "Wirkung"],
        [
          "Wahlversprechen einlösen",
          "Bei Mehrheit gibt es die Siegpunkte der Karte. Auch alle anderen, die dafür gestimmt haben und dieses Thema in ihrer Ausrichtung führen, bekommen sie.",
        ],
        [
          "Regierungswechsel",
          "Bei Mehrheit werden die Regierung-Karten neu verteilt.",
        ],
      ],
    },
    {
      title: "Aktionen mit Würfelprobe",
      body: [
        "Nötig sind Fähigkeitspunkte plus ein Würfel, zusammen 4 oder mehr.",
      ],
      table: [
        ["Aktion", "Fähigkeit", "Wirkung"],
        [
          "Dirty-Campaigning",
          "Manipulation",
          "+1 Malus auf eine Kandidatur (höchstens 3)",
        ],
        ["Sitz abwerben", "Manipulation", "Ein Sitz wechselt zu dir"],
        [
          "Thema ändern",
          "Medien",
          "Das aktuelle Thema wird ein beliebiges anderes",
        ],
        ["Skandal aufdecken", "Medien", "Ein Skandal wird aufgedeckt"],
        [
          "Skandal verdecken",
          "Popularität",
          "Ein eigener aufgedeckter Skandal wird verdeckt",
        ],
        [
          "Imagekampagne",
          "Popularität",
          "+1 Bonus auf die eigene Kandidatur (höchstens 3)",
        ],
      ],
    },
    {
      title: "Spielende",
      body: [
        "Nach dem letzten Wahlkampf bekommt die Partei mit den meisten Sitzen 5 Siegpunkte; teilen sich mehrere die Spitze, gibt es je 3. Die meisten Siegpunkte gewinnen.",
      ],
    },
  ],
};
