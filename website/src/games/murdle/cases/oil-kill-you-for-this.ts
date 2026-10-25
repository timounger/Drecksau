/**
 * Case 21, "Oil Kill You for This": a body at the X of an old pirate map, on
 * an oil field.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). The message in the Next
 * Letter Code (each letter stands for the one after it) reads "The shortest
 * suspect was not by the ancient ruins"; here it is encoded again in German.
 * "Either ... or" is exclusive: with an inclusive reading the case has two
 * solutions. The bold clue names the weapon; the murderer is whoever had it. The photographed pages print neither hint nor solution;
 * the solver found the only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const OIL_KILL_YOU_FOR_THIS: Case = {
  id: "oil-kill-you-for-this",
  number: 21,
  title: "Ölles vorbei!",
  story:
    "Deductive Logico folgte der alten Piratenkarte: Sie führte ihn zu einem Ölfeld am Rand eines Ozeans. Als er beim X ankam, war Dame Obsidian schon da, ebenso zwei andere Leute - oder drei, wenn man die Leiche mitzählt.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "chalk",
      name: "Vorsitzender Chalk",
      icon: "\u{1F474}",
      description:
        "Er hat das Verlagsgeschäft vor Jahren durchschaut und nie zurückgeblickt. E-Books nannte er eine Modeerscheinung, und er besitzt noch immer ein Telefon mit Wählscheibe. Er ist eine Milliarde Dollar schwer.",
      heightCm: 175,
      hand: "right",
      eyes: "blue",
      hair: "white",
    },
    {
      id: "midnight",
      name: "Midnight III",
      icon: "\u{1F576}️",
      description:
        "Vielleicht der einzige Mensch, der Midnight Movies zu altem Glanz zurückführen kann.",
      heightCm: 173,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
    },
    {
      id: "obsidian",
      name: "Dame Obsidian",
      icon: "\u{1F452}",
      description:
        "Zurück von den Toten! Doch Logico erinnerte sich, wie ein Interviewer sie einmal fragte, woher sie die Ideen für all ihre perfekten erfundenen Morde habe - und sie zwei volle Minuten lang kicherte.",
      heightCm: 163,
      hand: "left",
      eyes: "green",
      hair: "black",
    },
  ],
  locations: [
    {
      id: "derrick",
      name: "ein Bohrturm",
      icon: "\u{1F3D7}️",
      description:
        "Mit diesem gewaltigen Bohrturm wird gerade eine weitere Quelle gebohrt.",
      indoors: false,
    },
    {
      id: "offices",
      name: "die Büros",
      icon: "\u{1F3E2}",
      description:
        "So stark klimatisiert, dass sie den Großteil der Energie verbrauchen, die das Feld liefert.",
      indoors: true,
    },
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "\u{1F5FF}",
      description:
        "Man sieht sie vom Rand der Felder aus, als Silhouette im Licht der untergehenden Sonne.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "crowbar",
      name: "ein Brecheisen",
      icon: "\u{1F6E0}️",
      description:
        "Ehrlich gesagt wird es inzwischen öfter für Verbrechen benutzt als für irgendetwas anderes.",
      weight: "medium",
    },
    {
      id: "rebar",
      name: "ein Stück Bewehrungsstahl",
      icon: "\u{1F4CF}",
      description:
        "Ein langes Stück Metall. Wenn das keine Waffe ist, dann gar nichts. Wird oft zusammen mit Zementpulver verwendet.",
      weight: "medium",
    },
    {
      id: "drum",
      name: "ein Ölfass",
      icon: "\u{1F6E2}️",
      description:
        "Eher eine Riesendose als ein Fass. Auf keinem Weinfest würde man daraus ausschenken.",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Niemand stellte je ein Ölfass auch nur in die Nähe der alten Ruinen. Das war Aberglaube.",
      holds: (scene) =>
        scene.locationOf(scene.holder("drum").id).id !== "ruins",
    },
    {
      text: "Entweder hatte Vorsitzender Chalk ein Ölfass dabei, oder ein Brecheisen war bei einem Bohrturm.",
      holds: (scene) =>
        (scene.weaponOf("chalk").id === "drum") !==
        (scene.locationOf(scene.holder("crowbar").id).id === "derrick"),
    },
    {
      text: "Ein Vertrauter gab Deductive Logico einen Zettel mit einer Nachricht in dem, was er den Nächster-Buchstabe-Code nannte: CHD JKDHMRSD ODQRNM VZQ MHBGS ADH CDM ZKSDM QTHMDM.",
      holds: (scene) => scene.at("ruins").id !== "obsidian",
    },
    {
      text: "Weder Midnight III noch Dame Obsidian waren je in den Büros gewesen.",
      holds: (scene) =>
        scene.locationOf("midnight").id !== "offices" &&
        scene.locationOf("obsidian").id !== "offices",
    },
  ],
  body: {
    text: "Neben dem Opfer fand man etwas Zementpulver.",
    weapon: "rebar",
  },
  solution: {
    chalk: { weapon: "drum", location: "offices" },
    midnight: { weapon: "crowbar", location: "ruins" },
    obsidian: { weapon: "rebar", location: "derrick" },
  },
  murderer: "obsidian",
  hints: [
    {
      text: 'In allen Rechtsunterlagen zu diesem Ort lag - seltsamerweise - eine hingekritzelte Notiz an Deductive Logico. Darauf stand: "Laut einer hellseherischen Vision kann man die Nachricht des Vertrauten lesen, wenn man jeden Buchstaben durch den nächsten im Alphabet ersetzt."',
      book: true,
    },
    {
      text: "Im Nächster-Buchstabe-Code steht jeder Buchstabe für den nächsten im Alphabet: C wird D, H wird I und so weiter. Die Nachricht lautet: DIE KLEINSTE PERSON WAR NICHT BEI DEN ALTEN RUINEN. Die Kleinste ist Dame Obsidian.",
    },
    {
      text: "Midnight III und Dame Obsidian waren nie in den Büros, also war Vorsitzender Chalk dort. Obsidian war nicht bei den Ruinen, sondern am Bohrturm, und Midnight III bei den alten Ruinen.",
      marks: [
        { a: "chalk", b: "offices", value: "check" },
        { a: "midnight", b: "ruins", value: "check" },
        { a: "obsidian", b: "derrick", value: "check" },
      ],
    },
    {
      text: "Kein Ölfass bei den Ruinen: Midnight III hatte es nicht. Hätte Chalk es auch nicht, hätte es Obsidian am Bohrturm - dann wäre dort kein Brecheisen, und keine Hälfte des Entweder-oder träfe zu. Also hatte Vorsitzender Chalk das Ölfass.",
      marks: [{ a: "chalk", b: "drum", value: "check" }],
    },
    {
      text: "Entweder-oder heißt: nicht beides. Am Bohrturm war also kein Brecheisen. Dame Obsidian hatte den Bewehrungsstahl, Midnight III das Brecheisen.",
      marks: [
        { a: "crowbar", b: "derrick", value: "cross" },
        { a: "midnight", b: "crowbar", value: "check" },
        { a: "obsidian", b: "rebar", value: "check" },
      ],
    },
    {
      text: "Zementpulver gehört zum Bewehrungsstahl: Dame Obsidian erschlug das Opfer damit am Bohrturm.",
      marks: [
        { a: "rebar", b: "derrick", value: "check" },
        { a: "drum", b: "offices", value: "check" },
        { a: "crowbar", b: "ruins", value: "check" },
      ],
    },
  ],
};
