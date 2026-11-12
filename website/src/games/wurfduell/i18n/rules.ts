/**
 * The Wurfduell rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";
import {
  ABILITIES,
  CHARACTERS,
  ITEMS,
} from "@/games/wurfduell/engine/characters";
import { BURN_DAMAGE, BURN_TURNS } from "@/games/wurfduell/engine/game";

/** What the rules button opens. */
export const WURFDUELL_RULES: GameRules = {
  title: "Wurfduell",
  players: "2 Spieler - gegen den Computer oder online",
  intro:
    "Zwei Figuren stehen sich gegenüber und bewerfen sich abwechselnd. Ausweichen gibt es nicht - es zählt nur, wer besser zielt. Wessen Lebensbalken zuerst leer ist, der ist k.o.",
  sections: [
    {
      title: "Ein Wurf",
      body: [
        "Ein gestrichelter Pfeil an der Hand deiner Figur zeigt zur Maus - das ist der Winkel. Drücke und halte: Der Kraftbalken neben deiner Figur füllt sich bis 100 % und pendelt dann wieder herunter. Lass im richtigen Moment los, dann fliegt der Wurf mit genau dieser Kraft.",
        "Am Handy genauso: Tippen setzt die Richtung, Finger liegen lassen lädt, Loslassen wirft. Der rote Knopf unter dem Feld funktioniert ebenso (halten und loslassen).",
        "Tastatur: Pfeil hoch und runter stellen den Winkel, die Leertaste gedrückt halten lädt, Loslassen wirft. Die Tasten 1 bis 3 wählen eine Fähigkeit.",
        "Beim Laden zeigen Punkte den Anfang der Flugbahn - ohne Wind. Den Rest muss man schätzen.",
      ],
    },
    {
      title: "Entfernung, Kamera und Wind",
      body: [
        "Die beiden stehen 20 Meter auseinander - so weit, dass man den Gegner beim Zielen nicht sieht. Ein Pfeil am Bildrand zeigt, wo er steht und wie weit es ist. Die Kamera fliegt dem Wurf hinterher, zeigt den Treffer und schwenkt dann zum nächsten Werfer. In den Einstellungen gibt es stattdessen die Übersicht über das ganze Feld.",
        "Vor jedem Wurf weht der Wind neu, von windstill bis Stärke 5 in eine der beiden Richtungen. Er steht oben im Bild; Fahnen entlang der Strecke und die Wolken zeigen ihn auch. Auf die lange Strecke trägt er weit - er entscheidet oft über Treffer oder daneben.",
      ],
    },
    {
      title: "Lebenspunkte und Treffer",
      body: [
        "Jede Figur hat einen Lebensbalken, je nach Figur 85 bis 120 Lebenspunkte (LP). Ein Körpertreffer kostet so viel, wie der Gegenstand Schaden macht, ein Kopftreffer die Hälfte mehr.",
        "Wessen Balken leer ist, der ist k.o. und hat verloren. Aufgeben zählt ebenfalls als Niederlage.",
      ],
    },
    {
      title: "Fähigkeiten",
      body: [
        "Jede Figur wirft immer ihren eigenen Gegenstand und hat dazu drei Fähigkeiten, jede einmal pro Partie. Eine Fähigkeit wird vor dem Wurf angetippt und gilt für genau diesen Wurf - der Zug endet also immer mit einem Wurf. Pro Wurf geht höchstens eine Fähigkeit.",
        `Heilungen wirken vor dem Wurf. Scharfe Soße brennt ${BURN_TURNS} Züge lang je ${BURN_DAMAGE} LP, jeweils zu Beginn des gegnerischen Zugs. Schild, Eisblock, Brüllen, Rankenfalle und Mehlwolke wirken genau einmal, dann sind sie vorbei.`,
      ],
    },
    {
      title: "Die Figuren",
      table: [
        ["Figur", "Wirft", "LP", "Eigenheit"],
        ...CHARACTERS.map((character) => [
          character.name,
          `${ITEMS[character.item].name} (${ITEMS[character.item].damage})`,
          String(character.maxHp),
          character.quirk,
        ]),
      ],
    },
    {
      title: "Alle Fähigkeiten",
      table: [
        ["Figur", "Fähigkeit", "Wirkung"],
        ...CHARACTERS.flatMap((character) =>
          character.abilities.map((id) => [
            character.name,
            ABILITIES[id].name,
            ABILITIES[id].description,
          ]),
        ),
      ],
    },
    {
      title: "Online",
      body: [
        "Online wird abwechselnd geworfen; beide sehen jeden Wurf fliegen und jede Fähigkeit wirken. Wer 25 Sekunden lang nicht wirft, bekommt einen automatischen, schwachen Wurf ohne Fähigkeit. Wer die Verbindung verliert, wird nach kurzer Wartezeit vom Computer vertreten - mit eben diesen schwachen Würfen.",
        "Nach dem K.o. können beide eine Revanche verlangen; der Stand wird mitgezählt, und wer anfängt, wechselt.",
      ],
    },
  ],
};
