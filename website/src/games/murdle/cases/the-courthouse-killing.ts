/**
 * Case 23, "The Courthouse Killing": a clerk killed on the day of Dame
 * Obsidian's trial.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). The jumbled message
 * reads "The suspect in the actual courtroom was right-handed"; here it is
 * jumbled again in German, letter by letter within each word. The photographed
 * pages print neither hint nor solution; the solver found the only one, and
 * the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_COURTHOUSE_KILLING: Case = {
  id: "the-courthouse-killing",
  number: 23,
  title: "Mord im Gerichtsgebäude",
  story:
    "Endlich war der Tag von Dame Obsidians Prozess gekommen, und Logico trug seinen besten Regenmantel zum Gericht. Er hoffte, Gerechtigkeit walten zu sehen. Stattdessen wurde er Zeuge eines Mordes. Hing der Tod dieses Gerichtsschreibers mit Dame Obsidian zusammen? Oder war es nur ein ganz alltäglicher Mord?",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "raspberry",
      name: "Trainer Raspberry",
      icon: "\u{1F3C8}",
      description:
        "Einer der besten Trainer diesseits des Mississippi - egal, auf welcher Seite man steht.",
      heightCm: 183,
      hand: "left",
      eyes: "blue",
      hair: "blond",
    },
    {
      id: "copper",
      name: "Polizistin Copper",
      icon: "\u{1F46E}‍♀️",
      description:
        "Seit sie diesen Kerl ermordet hat, ist Polizistin Copper in den Verwaltungsdienst abgeschoben: Dort überlässt man ihr die ganze Verwaltungsarbeit.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
    },
    {
      id: "mango",
      name: "Pater Mango",
      icon: "✝️",
      description:
        "Er hat ein Armutsgelübde abgelegt, fährt aber BMW. Er hat Gehorsam gelobt, hat aber fünfundzwanzig Angestellte. Und er hat Keuschheit gelobt - deshalb ist er im Urlaub.",
      heightCm: 178,
      hand: "left",
      eyes: "darkBrown",
      hair: "bald",
    },
  ],
  locations: [
    {
      id: "courtroom",
      name: "der eigentliche Gerichtssaal",
      icon: "\u{1F3DB}️",
      description: "Hier soll Dame Obsidians Prozess stattfinden.",
      indoors: true,
    },
    {
      id: "parking-lot",
      name: "der Parkplatz",
      icon: "\u{1F693}",
      description:
        "Mehr Streifenwagen, als Logico gesehen hat, seit er hinter dieser Polizeiparade festhing.",
      indoors: false,
    },
    {
      id: "chambers",
      name: "das Richterzimmer",
      icon: "\u{1F9E5}",
      description:
        "Ein schöner Schreibtisch, ein guter Blick aus dem Fenster und ein Schrank voller schwarzer Roben.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "stamp",
      name: "ein Notarstempel",
      icon: "\u{1F50F}",
      description:
        "Ein klassischer Notarstempel: Er stempelt alles, von Papieren bis zu Stirnen.",
      weight: "medium",
    },
    {
      id: "scales",
      name: "die Waage der Justitia",
      icon: "⚖️",
      description:
        "Justitia mag blind sein - aber nur, weil jemand sie mit dieser Waage k. o. geschlagen hat.",
      weight: "heavy",
    },
    {
      id: "paperwork",
      name: "ein riesiger Stapel Papierkram",
      icon: "\u{1F4DA}",
      description:
        "Ein Rätsel: Ein einzelnes Blatt Papier ist zu leicht zum Töten, ein großer Stapel aber nicht. Welches einzelne Blatt macht ihn also zur Waffe?",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Jemand mit zittriger Hand gab Logico eine Nachricht: EDI ENROPS MI INGTNHELIEEC ARHSSTCLIEAG AWR DÄRCHTIGNESH.",
      holds: (scene) => scene.at("courtroom").hand === "right",
    },
    {
      text: "Die Waage der Justitia war ganz sicher nicht auf dem Parkplatz: Da gehören die Autos hin.",
      holds: (scene) =>
        scene.locationOf(scene.holder("scales").id).id !== "parking-lot",
    },
    {
      text: "Seit Polizistin Copper einen Mord begangen hat, lässt man sie Notararbeit machen.",
      holds: (scene) => scene.weaponOf("copper").id === "stamp",
    },
    {
      text: "Pater Mango hatte einen riesigen Stapel Papierkram mitgebracht.",
      holds: (scene) => scene.weaponOf("mango").id === "paperwork",
    },
  ],
  body: {
    text: "Die Leiche wurde im Richterzimmer gefunden.",
    location: "chambers",
  },
  solution: {
    raspberry: { weapon: "scales", location: "chambers" },
    copper: { weapon: "stamp", location: "courtroom" },
    mango: { weapon: "paperwork", location: "parking-lot" },
  },
  murderer: "raspberry",
  hints: [
    {
      text: 'Eine mysteriöse Gestalt gab ein mysteriöses Paket ab. Nachdem der Sicherheitsdienst es gründlich untersucht hatte, übergab man es Deductive Logico. Darin lagen ein einzelnes Blatt Papierkram und eine Notiz: "Diese Seite habe ich auf dem Parkplatz gefunden."',
      book: true,
      marks: [{ a: "paperwork", b: "parking-lot", value: "check" }],
    },
    {
      text: 'Die Nachricht, Wort für Wort entwürfelt: "DIE PERSON IM EIGENTLICHEN GERICHTSSAAL WAR RECHTSHÄNDIG." Rechtshändig ist nur Polizistin Copper: Sie war im Gerichtssaal.',
      marks: [{ a: "copper", b: "courtroom", value: "check" }],
    },
    {
      text: "Copper hatte den Notarstempel, Pater Mango den Papierkram. Trainer Raspberry bleibt die Waage der Justitia.",
      marks: [
        { a: "copper", b: "stamp", value: "check" },
        { a: "mango", b: "paperwork", value: "check" },
        { a: "raspberry", b: "scales", value: "check" },
      ],
    },
    {
      text: "Die Waage war nicht auf dem Parkplatz, also war Trainer Raspberry im Richterzimmer und Pater Mango auf dem Parkplatz.",
      marks: [
        { a: "raspberry", b: "chambers", value: "check" },
        { a: "mango", b: "parking-lot", value: "check" },
        { a: "scales", b: "chambers", value: "check" },
      ],
    },
    {
      text: "Die Leiche lag im Richterzimmer: Trainer Raspberry erschlug den Gerichtsschreiber dort mit der Waage der Justitia.",
      marks: [{ a: "stamp", b: "courtroom", value: "check" }],
    },
  ],
};
