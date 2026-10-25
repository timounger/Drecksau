/**
 * Case 24, "Will the Foreman Please Die?": the jury foreman killed at Dame
 * Obsidian's trial.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). One clue needs Exhibit
 * A: the Detective Code of the decoder ring (A to Z, B to Y and so on); the
 * message reads "Judge Pine was sitting on her bench" and is encoded again in
 * German. The photo of the gallery's and the bench's cards is blurred where it
 * says indoors or outdoors; both are in the courtroom, so indoors. The bold
 * clue names the weapon; the murderer is whoever had it. The
 * photographed pages print neither hint nor solution; the solver found the
 * only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const WILL_THE_FOREMAN_PLEASE_DIE: Case = {
  id: "will-the-foreman-please-die",
  number: 24,
  title: "Der Obmann möge sterben",
  story:
    "Endlich war es Zeit für den Prozess des Jahrhunderts, und Dame Obsidian lieferte eine wunderbare Vorstellung ab. Doch gerade als sich die Geschworenen zur Beratung zurückziehen wollten, wurde ihr Obmann getötet. Natürlich hielten alle Dame Obsidian für die Täterin. War sie es?",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "pine",
      name: "Richterin Pine",
      icon: "\u{1F469}‍⚖️",
      description:
        "Herrin des Gerichtssaals und von festem Glauben an die Gerechtigkeit beseelt - so, wie allein sie sie festlegt.",
      heightCm: 168,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
    },
    {
      id: "copper",
      name: "Polizistin Copper",
      icon: "\u{1F46E}‍♀️",
      description:
        "Das Beste daran, eine kriminelle Polizistin zu sein: Man spart sich den Mittelsmann und ermittelt einfach nicht gegen die eigenen Verbrechen.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
    },
    {
      id: "obsidian",
      name: "Dame Obsidian",
      icon: "\u{1F452}",
      description:
        "Dame Obsidian wirkte während des ganzen Prozesses sehr würdevoll, und ihre Buchverkäufe schossen in die Höhe.",
      heightCm: 163,
      hand: "left",
      eyes: "green",
      hair: "black",
    },
  ],
  locations: [
    {
      id: "gallery",
      name: "die Zuschauerränge",
      icon: "\u{1F4BA}",
      description:
        "Hier sitzen alle Angehörigen neben den Fans von True-Crime-Podcasts.",
      indoors: true,
    },
    {
      id: "bench",
      name: "die Richterbank",
      icon: "\u{1FA91}",
      description:
        "Man weiß, dass die Richterin das Sagen hat, weil sie am höchsten sitzt.",
      indoors: true,
    },
    {
      id: "jury-box",
      name: "die Geschworenenbank",
      icon: "\u{1F465}",
      description:
        "Im Grunde ist der ganze Prozess nur eine Vorstellung für ein Publikum von zwölf Leuten.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "baton",
      name: "ein Schlagstock",
      icon: "\u{1F3CF}",
      description:
        "Ein großartiges Werkzeug, um unschuldige Menschen zu misshandeln.",
      weight: "medium",
    },
    {
      id: "gavel",
      name: "ein Richterhammer",
      icon: "\u{1F528}",
      description:
        "Seien wir ehrlich: Es hat einen Grund, dass man der Richterin einen großen Hammer gibt. (Einschüchterung.)",
      weight: "medium",
    },
    {
      id: "flag",
      name: "eine Fahne",
      icon: "\u{1F6A9}",
      description:
        "Fahnen haben eine lange und ehrwürdige Geschichte als Mittel der Gewalt.",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Ein Richterhammer war nirgendwo in der Nähe der True-Crime-Fans.",
      holds: (scene) =>
        scene.locationOf(scene.holder("gavel").id).id !== "gallery",
    },
    {
      text: "Deductive Logico erhielt vom Detektivclub eine Nachricht im Detektivcode: IRXSGVIRM KRMV HZHH ZFU RSIVI IRXSGVIYZMP. (Siehe Beweisstück A.)",
      holds: (scene) => scene.locationOf("pine").id === "bench",
    },
    {
      text: 'Dame Obsidian hatte einen Schlagstock hereingeschmuggelt, "zur Selbstverteidigung" - eine zweifelhafte Begründung.',
      holds: (scene) => scene.weaponOf("obsidian").id === "baton",
    },
    {
      text: "Entweder hatte Polizistin Copper einen Richterhammer dabei, oder Richterin Pine war auf den Zuschauerrängen.",
      holds: (scene) =>
        (scene.weaponOf("copper").id === "gavel") !==
        (scene.locationOf("pine").id === "gallery"),
    },
  ],
  body: {
    text: "Wie schon so oft wurde für diesen Mord eine Fahne benutzt.",
    weapon: "flag",
  },
  exhibits: ["detectiveKit"],
  solution: {
    pine: { weapon: "flag", location: "bench" },
    copper: { weapon: "gavel", location: "jury-box" },
    obsidian: { weapon: "baton", location: "gallery" },
  },
  murderer: "pine",
  hints: [
    {
      text: '"Also gut", sagte Polizistin Copper, "welcher Witzbold hat mir diesen Klebezettel auf den Rücken geklebt, auf dem steht, dass ich laut Tierkreis den Richterhammer hatte?!"',
      book: true,
      marks: [{ a: "copper", b: "gavel", value: "check" }],
    },
    {
      text: "Mit dem Decoderring (Beweisstück A) wird A zu Z, B zu Y und so weiter. Die Nachricht lautet: RICHTERIN PINE SASS AUF IHRER RICHTERBANK.",
      marks: [{ a: "pine", b: "bench", value: "check" }],
    },
    {
      text: "Pine war also nicht auf den Zuschauerrängen, und das Entweder-oder verlangt: Polizistin Copper hatte den Richterhammer. Dame Obsidian hatte den Schlagstock, Richterin Pine bleibt die Fahne.",
      marks: [
        { a: "pine", b: "flag", value: "check" },
        { a: "obsidian", b: "baton", value: "check" },
      ],
    },
    {
      text: "Der Richterhammer war nicht bei den True-Crime-Fans auf den Zuschauerrängen: Copper war auf der Geschworenenbank, Dame Obsidian auf den Zuschauerrängen.",
      marks: [
        { a: "copper", b: "jury-box", value: "check" },
        { a: "obsidian", b: "gallery", value: "check" },
        { a: "gavel", b: "jury-box", value: "check" },
      ],
    },
    {
      text: "Die Fahne war die Tatwaffe: Richterin Pine tötete den Obmann mit ihr an der Richterbank. Dame Obsidian war es diesmal nicht.",
      marks: [
        { a: "flag", b: "bench", value: "check" },
        { a: "baton", b: "gallery", value: "check" },
      ],
    },
  ],
};
