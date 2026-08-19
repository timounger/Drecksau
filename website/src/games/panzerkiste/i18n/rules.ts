/**
 * The Panzerkiste rules, as shown in the game.
 *
 * @module
 * @remarks
 * More a manual than rules: this is not a board game with a rulebook but an
 * action game, and what a player needs looked up mid-round is the controls and
 * what the pickups do - not a definition of winning.
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const PANZERKISTE_RULES: GameRules = {
  title: "Panzerkiste",
  players: "Allein oder zu zweit im Koop-Online",
  intro:
    'Top-Down-Panzerspiel nach dem Vorbild von „Tanks!" aus Wii Play. Du steuerst einen Panzer über ein Feld voller Mauern und feindlicher Panzer - zerstöre alle Gegner, um das Level zu schaffen.',
  sections: [
    {
      title: "Steuerung",
      table: [
        ["Was", "Wie"],
        ["Bewegen", "W A S D oder Pfeiltasten"],
        ["Schießen", "Linksklick - das Rohr zielt auf den Mauszeiger"],
        ["Lenkrakete", "Linke Maustaste gedrückt halten"],
        ["Mine legen", "Leertaste"],
      ],
      body: ["Auf dem Handy gibt es dafür Knöpfe auf dem Bildschirm."],
    },
    {
      title: "Die drei Waffen",
      list: [
        "Schuss: prallt einmal an einer Mauer ab. Über die Bande zu treffen ist oft der einzige Weg.",
        "Lenkrakete: sucht sich selbst einen Gegner. Kann einer in gerader Linie getroffen werden, nimmt sie den. Auf den Koop-Partner zielt sie nie und fliegt auch über ihn hinweg.",
        "Mine: explodiert nach drei Sekunden - in der letzten Sekunde blinkt sie schnell - und reißt alles im Umkreis mit, auch dich. Ein Treffer durch einen Schuss zündet sie sofort.",
      ],
    },
    {
      title: "Leben",
      body: [
        "Drei Leben zum Start. Alle fünf Level gibt es ein Bonusleben dazu.",
      ],
    },
    {
      title: "Was Gegner fallen lassen",
      body: [
        "Ein zerstörter Panzer lässt gelegentlich etwas liegen. Einfach drüberfahren, dann wirkt es sofort.",
      ],
      table: [
        ["Fundstück", "Wirkung"],
        [
          "Schild (blau)",
          "Kurze Zeit unverwundbar. Ein Ring zeigt es an und blinkt zum Ende hin.",
        ],
        ["Schnellfeuer (orange)", "Deutlich kürzere Nachladezeit."],
        ["Streumunition (violett)", "Jeder Schuss geht als Fächer raus."],
        [
          "Wiederbeleben (grün)",
          "Nur online, und nur solange der Partner am Boden liegt: Er steht neben dir wieder auf.",
        ],
      ],
    },
    {
      title: "Die Endlos-Arena",
      body: [
        "Nach dem letzten Kampagnenlevel geht es in die Arena. Sie wird nie geräumt: Ist das Feld leer, kommt nach kurzer Pause die nächste Welle - jedes Mal mehr Panzer, und mit der Zeit auch schlimmere. Schluss ist erst, wenn die Leben alle sind.",
      ],
    },
    {
      title: "Die Gegner",
      body: [
        "Sie werden von Level zu Level unangenehmer: erst braun und grau, dann gelb mit Minen, türkis mit Raketen, grün als Bandenschütze, lila schnell mit doppelter Feuerrate, später unsichtbare.",
        "Der letzte und härteste ist der schwarze Panzer: schneller als jeder andere und mit schnellen Raketen im kurzen Takt. Deckung kauft gegen ihn deutlich weniger Zeit.",
      ],
    },
    {
      title: "Koop online",
      body: [
        'Zu zweit durch dieselben Missionen - entweder über „Mitspieler finden" oder über einen privaten Raumcode.',
      ],
    },
  ],
};
