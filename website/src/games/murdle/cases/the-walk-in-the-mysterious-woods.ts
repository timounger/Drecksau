/**
 * Case 53, "The Walk in the Mysterious Woods": a woman in cultic robes, dead
 * in the woods off the lonely road.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The bold clue names the weapon - the rusted blade is the old sword;
 * the murderer is whoever had it. The photographed pages print neither hint
 * nor solution; the solver found the only one, and the hints are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const THE_WALK_IN_THE_MYSTERIOUS_WOODS: Case = {
  id: "the-walk-in-the-mysterious-woods",
  number: 53,
  title: "Ein Spaziergang im rätselhaften Wald",
  story:
    "Deductive Logico ging vom Institut fort, die einsame, verlassene Straße hinunter, bis er schließlich von der Straße abkam und in den Wald geriet. Dort fand er die Leiche einer Frau in seltsamen, kultischen Gewändern.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "cloud",
      name: "Kryptozoologe Cloud",
      icon: "☁️",
      description:
        "Er kennt jede Sichtung des Barghest, des Dobhar-chú und der Bestie von Bodmin Moor - und auch den Unterschied zwischen ihnen.",
      heightCm: 170,
      hand: "right",
      eyes: "gray",
      hair: "white",
      sign: "scorpio",
    },
    {
      id: "maroon",
      name: "Baron Maroon",
      icon: "👑",
      description:
        "Ein unglaublich hochmütiger und nachtragender Mann. Niemand will den Baron kränken. Zumindest niemand, der noch lebt ...",
      heightCm: 188,
      hand: "right",
      eyes: "hazel",
      hair: "red",
      sign: "scorpio",
    },
    {
      id: "pine",
      name: "Richterin Pine",
      icon: "👩‍⚖️",
      description:
        "Herrin des Gerichtssaals und von festem Glauben an die Gerechtigkeit beseelt - so, wie allein sie sie festlegt.",
      heightCm: 168,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "taurus",
    },
    {
      id: "umber",
      name: "Soziologin Umber",
      icon: "🧑‍🎓",
      description:
        "Als Vertreterin der harten Wissenschaften fordert sie alle auf, ihre Vorannahmen zu hinterfragen - und fragt, ob sie schon Durkheim gelesen haben.",
      heightCm: 163,
      hand: "left",
      eyes: "blue",
      hair: "blond",
      sign: "leo",
    },
  ],
  locations: [
    {
      id: "tree",
      name: "der knorrige Baum",
      icon: "🌳",
      description:
        "In unmöglichen Winkeln gebogen und verdreht. Er erinnert Logico an Irratinos Logik.",
      indoors: false,
    },
    {
      id: "cave",
      name: "die wandernde Höhle",
      icon: "🕳️",
      description:
        "Jedes Mal, wenn man diese Höhle findet, scheint sie an einer anderen Stelle zu sein.",
      indoors: true,
    },
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "🗿",
      description:
        "In ihrer Nähe werden einem die Beine weich, als würden sie im Boden versinken.",
      indoors: false,
    },
    {
      id: "hill",
      name: "der kleine Hügel",
      icon: "🌄",
      description:
        "Ein netter kleiner Hügel, um darauf zu sitzen und zu picknicken. Oder um den verlorenen Partner zu betrauern.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "candle",
      name: "eine schwere Kerze",
      icon: "🕯️",
      description: "Sie ist schwer, und doch erhellt sie den Raum.",
      weight: "heavy",
      material: "Wachs",
    },
    {
      id: "sword",
      name: "ein altes Schwert",
      icon: "🗡️",
      description:
        "Damit kämpften die Bösen in einem alten Krieg. Es ist völlig verrostet.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "log",
      name: "ein Holzscheit",
      icon: "🪵",
      description:
        "Ein großes, schweres Eichenscheit. Jemand hat den Baum getötet, damit der Baum jemanden töten kann.",
      weight: "heavy",
      material: "Holz",
    },
    {
      id: "axe",
      name: "eine Axt",
      icon: "🪓",
      description:
        "Mit dieser Axt könnte man einen Baum fällen. Wenn sie nur auch schlimme Erinnerungen herausschlagen könnte.",
      weight: "medium",
      material: "Holz und Metall",
    },
  ],
  motives: [
    { id: "bear", name: "einen Bären verscheuchen", icon: "🐻" },
    { id: "book", name: "ein wertvolles Buch stehlen", icon: "📕" },
    { id: "revolution", name: "für die Revolution", icon: "☭" },
    { id: "revenge", name: "Rache nehmen", icon: "⚔️" },
  ],
  clues: [
    {
      text: "Logico fand ein rotes Haar, das um das Holzscheit gewickelt war.",
      holds: (scene) => scene.holder("log").hair === "red",
    },
    {
      text: "Wer eine schwere Kerze trug, wollte ein wertvolles Buch stehlen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("candle").id)?.id === "book",
    },
    {
      text: "Wer Rache nehmen wollte, war Skorpion. (Typisch.)",
      holds: (scene) => scene.driven("revenge").sign === "scorpio",
    },
    {
      text: "Wer einen Bären verscheuchen wollte, musste Rechtshänder sein.",
      holds: (scene) => scene.driven("bear").hand === "right",
    },
    {
      text: "Wer ein Motiv hatte, für die Revolution zu töten, wurde drinnen beim Pläneschmieden gesehen.",
      holds: (scene) => scene.locationOf(scene.driven("revolution").id).indoors,
    },
    {
      text: "Analysten entdeckten auf der Kleidung von Soziologin Umber Spuren einer Waffe, die (zumindest teilweise) aus Metall war.",
      holds: (scene) =>
        scene.weaponOf("umber").material?.includes("Metall") === true,
    },
    {
      text: "Es sah aus, als wollte jemand einen seltsamen, verdrehten Baum fällen, denn an ihm lehnte eine Axt.",
      holds: (scene) => scene.locationOf(scene.holder("axe").id).id === "tree",
    },
    {
      text: "Wer an einem prächtigen Picknickplatz war, musste natürlich einen Bären verscheuchen.",
      holds: (scene) => scene.motiveOf(scene.at("hill").id)?.id === "bear",
    },
    {
      text: "Die zweitkleinste verdächtige Person war nie auf dem kleinen Hügel gewesen.",
      holds: (scene: Scene): boolean => scene.locationOf("pine").id !== "hill",
    },
  ],
  body: {
    text: "Neben der Kultistin wurde eine verrostete Klinge gefunden.",
    weapon: "sword",
  },
  solution: {
    cloud: { weapon: "axe", location: "tree", motive: "revenge" },
    maroon: { weapon: "log", location: "hill", motive: "bear" },
    pine: { weapon: "candle", location: "ruins", motive: "book" },
    umber: { weapon: "sword", location: "cave", motive: "revolution" },
  },
  murderer: "umber",
  hints: [
    {
      text: "Logico zog eine Karte aus Irratinos altem Mortarot-Deck und vermutete, sie bedeute, dass Baron Maroon auf einem netten kleinen Hügel gesehen worden war.",
      book: true,
      marks: [{ a: "maroon", b: "hill", value: "check" }],
    },
    {
      text: "Nur Baron Maroon hat rote Haare: Er hatte das Holzscheit. Die Revolution wurde drinnen geplant, und drinnen ist nur die wandernde Höhle.",
      marks: [
        { a: "maroon", b: "log", value: "check" },
        { a: "cave", b: "revolution", value: "check" },
      ],
    },
    {
      text: "Wer Rache wollte, war Skorpion - Cloud oder Maroon. Wer den Bären verscheuchen wollte, war auf dem Hügel und rechtshändig. Umber ist Linkshänderin, und die Zweitkleinste, Richterin Pine (1,68 m), war nie auf dem Hügel. Also teilen sich Cloud und Maroon Rache und Bär, Pine und Umber Buch und Revolution.",
      marks: [
        { a: "cloud", b: "revenge", value: "check" },
        { a: "hill", b: "bear", value: "check" },
        { a: "pine", b: "book", value: "check" },
        { a: "umber", b: "revolution", value: "check" },
      ],
    },
    {
      text: "Die Kerze gehörte jemandem, der das Buch stehlen wollte - also Pine oder Umber. Umber hatte eine Waffe aus Metall, die Kerze ist aus Wachs: Pine hatte die Kerze und wollte das Buch. Umber wollte die Revolution und war in der wandernden Höhle.",
      marks: [
        { a: "pine", b: "candle", value: "check" },
        { a: "candle", b: "book", value: "check" },
        { a: "umber", b: "cave", value: "check" },
      ],
    },
    {
      text: "Umbers Metallwaffe war das Schwert oder die Axt. Die Axt lehnte am knorrigen Baum, Umber war aber in der Höhle: Soziologin Umber hatte das alte Schwert - die verrostete Klinge neben der Leiche.",
      marks: [
        { a: "umber", b: "sword", value: "check" },
        { a: "sword", b: "cave", value: "check" },
        { a: "axe", b: "tree", value: "check" },
      ],
    },
    {
      text: "Cloud hatte also die Axt am knorrigen Baum und wollte Rache. Maroon war auf dem Hügel und wollte einen Bären verscheuchen, Pine war bei den alten Ruinen. Soziologin Umber war es, mit dem alten Schwert, in der wandernden Höhle, für die Revolution.",
      marks: [
        { a: "cloud", b: "axe", value: "check" },
        { a: "cloud", b: "tree", value: "check" },
        { a: "axe", b: "revenge", value: "check" },
        { a: "tree", b: "revenge", value: "check" },
        { a: "maroon", b: "bear", value: "check" },
        { a: "pine", b: "ruins", value: "check" },
        { a: "sword", b: "revolution", value: "check" },
        { a: "log", b: "hill", value: "check" },
        { a: "log", b: "bear", value: "check" },
        { a: "candle", b: "ruins", value: "check" },
        { a: "ruins", b: "book", value: "check" },
      ],
    },
  ],
};
