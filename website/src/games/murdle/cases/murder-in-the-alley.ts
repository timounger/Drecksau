/**
 * Case 6, "Murder in the Alley": a dark figure killed in a dark alley.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary), from the photos of the
 * book. One clue is a message in Detective Code (Exhibit A, the decoder ring:
 * A is Z, B is Y and so on). The book's message reads "General Coffee did not
 * have the crowbar"; here it is the German sentence, encoded the same way.
 * The solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const MURDER_IN_THE_ALLEY: Case = {
  id: "murder-in-the-alley",
  number: 6,
  title: "Mord in der Gasse",
  story:
    "Auf dem Heimweg wurde Deductive Logico in einer dunklen Gasse von einer dunklen Gestalt aufgehalten. Sie sagte, Dame Obsidian sei schuldig: Sie habe einer halbwegs unschuldigen Zauberin den Mord angehängt (siehe Fall 1: Mord in Hollywood). Bevor die dunkle Gestalt mehr sagen konnte, wurde sie ermordet.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "coffee",
      name: "General Coffee",
      icon: "☕",
      description:
        "Ein Espresso-Kenner, der einmal seine Männer in den Dschungel schickte, um dort für eine einzige Bohne zu sterben.",
      heightCm: 183,
      hand: "right",
      eyes: "darkBrown",
      hair: "bald",
    },
    {
      id: "bluski",
      name: "Kosmonaut Bluski",
      icon: "\u{1F680}",
      description:
        "Ein ehemaliger sowjetischer Raumfahrer, in dessen Adern rotes Blut fließt. Klar, das ist normal - aber bei ihm ist es Patriotismus.",
      heightCm: 188,
      hand: "left",
      eyes: "darkBrown",
      hair: "black",
    },
    {
      id: "midnight",
      name: "Midnight III",
      icon: "\u{1F576}️",
      description:
        "Er findet, das Studio sollte sich wieder auf Krimis konzentrieren, um zu altem Glanz zurückzufinden.",
      heightCm: 173,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
    },
  ],
  locations: [
    {
      id: "fence",
      name: "der Metallzaun",
      icon: "⛓️",
      description: "Dein typischer Maschendrahtzaun. Was willst du mehr?",
      indoors: false,
    },
    {
      id: "dumpster",
      name: "der Müllcontainer",
      icon: "\u{1F5D1}️",
      description:
        "Er riecht nicht gut. Nein, wirklich nicht. Um ehrlich zu sein, stinkt er fürchterlich.",
      indoors: false,
    },
    {
      id: "graffiti",
      name: "das ablenkende Graffiti",
      icon: "\u{1F409}",
      description:
        "Das Wandbild eines Drachen auf einem Motorrad ruiniert die ganze Noir-Stimmung.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "piano-wire",
      name: "eine Klaviersaite",
      icon: "\u{1F3B9}",
      description:
        "Irgendwo da draußen fehlt einem Klavier eine Saite, und gleich ruiniert das ein Konzert.",
      weight: "light",
    },
    {
      id: "crowbar",
      name: "ein Brecheisen",
      icon: "\u{1F527}",
      description:
        "Ehrlich gesagt wird es öfter für Verbrechen benutzt als für sonst irgendetwas.",
      weight: "medium",
    },
    {
      id: "dart",
      name: "ein Giftpfeil",
      icon: "\u{1F3AF}",
      description: "Ein Stich mit diesem Pfeil, und du bist tot.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Midnight III hatte das bekannte Maschendrahtmuster ins Gesicht gedrückt.",
      holds: (scene) => scene.locationOf("midnight").id === "fence",
    },
    {
      text: "Kosmonaut Bluski packte immer wie für den Weltraum: Er hatte eine leichte Waffe.",
      holds: (scene) => scene.weaponOf("bluski").weight === "light",
    },
    {
      text: "Der Detektivclub schickte Logico eine Nachricht im Detektivcode: TVMVIZO XLUUVV SZGGV MRXSG WZH YIVXSVRHVM. (Siehe Beweisstück A.)",
      holds: (scene) => scene.holder("crowbar").id !== "coffee",
    },
    {
      text: "Kosmonaut Bluski hatte keine Klaviersaite dabei: Er war völlig unmusikalisch.",
      holds: (scene) => scene.holder("piano-wire").id !== "bluski",
    },
    {
      text: "Entweder ein Brecheisen oder ein Giftpfeil war beim ablenkenden Graffiti.",
      holds: (scene) =>
        ["crowbar", "dart"].includes(
          scene.weaponOf(scene.at("graffiti").id).id,
        ),
    },
  ],
  body: {
    text: "Um die Leiche herum roch es fürchterlich - selbst für eine Leiche!",
    location: "dumpster",
  },
  exhibits: ["detectiveKit"],
  solution: {
    coffee: { weapon: "piano-wire", location: "dumpster" },
    bluski: { weapon: "dart", location: "graffiti" },
    midnight: { weapon: "crowbar", location: "fence" },
  },
  murderer: "coffee",
  hints: [
    {
      text: "Diesmal brauchte Logico keine gespenstische Botschaft - er sah mit eigenen Augen, dass Kosmonaut Bluski direkt neben dem großartigen Drachen-Graffiti stand.",
      book: true,
      marks: [{ a: "bluski", b: "graffiti", value: "check" }],
    },
    {
      text: "Das Maschendrahtmuster stammt vom Metallzaun: Dort war Midnight III.",
      marks: [{ a: "midnight", b: "fence", value: "check" }],
    },
    {
      text: "Mit dem Decoderring aus Beweisstück A (Z wird zu A, Y zu B und so weiter) lautet die Nachricht: GENERAL COFFEE HATTE NICHT DAS BRECHEISEN.",
      marks: [{ a: "coffee", b: "crowbar", value: "cross" }],
    },
    {
      text: "Kosmonaut Bluski hatte eine leichte Waffe, aber keine Klaviersaite - also den Giftpfeil. General Coffee hatte kein Brecheisen, also die Klaviersaite. Midnight III bleibt das Brecheisen.",
      marks: [
        { a: "bluski", b: "dart", value: "check" },
        { a: "coffee", b: "piano-wire", value: "check" },
        { a: "midnight", b: "crowbar", value: "check" },
      ],
    },
    {
      text: "Beim Graffiti war das Brecheisen oder der Giftpfeil. Das Brecheisen war bei Midnight III am Zaun - also war Bluski mit dem Giftpfeil beim Graffiti und General Coffee am Müllcontainer.",
      marks: [
        { a: "dart", b: "graffiti", value: "check" },
        { a: "coffee", b: "dumpster", value: "check" },
      ],
    },
    {
      text: "Fürchterlich stinkt der Müllcontainer - dort war General Coffee, mit der Klaviersaite.",
      marks: [
        { a: "piano-wire", b: "dumpster", value: "check" },
        { a: "crowbar", b: "fence", value: "check" },
      ],
    },
  ],
};
