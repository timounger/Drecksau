/**
 * Case 54, "And Then There Was Another One Again": the new caretaker of the
 * ruins on the secluded island of case 2.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The bold clue names the weapon; the murderer is whoever had it. The
 * photographed pages print neither hint nor solution; the solver found the
 * only one, and the hints are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const AND_THEN_THERE_WAS_ANOTHER_ONE_AGAIN: Case = {
  id: "and-then-there-was-another-one-again",
  number: 54,
  title: "Und dann war da schon wieder noch einer",
  story:
    "Deductive Logico kehrte auf die abgelegene Insel zurück, um die alten Ruinen dort zu erforschen. Doch als er ankam, war der neue Verwalter ermordet worden. Das schien kein sicherer Job zu sein.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "mauve",
      name: "Vizepräsidentin Mauve",
      icon: "🥽",
      description:
        "Eine Vizepräsidentin von TekCo Futures. Wenn sie dich bittet, ihr Metaversum zu betreten: Schrei, so laut du kannst.",
      heightCm: 173,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "taurus",
    },
    {
      id: "navy",
      name: "Admiral Navy",
      icon: "🎖️",
      description:
        "Übrigens war sein Großvater der erstgeborene Sohn eines Admiral Navy - und dessen Großvater auch!",
      heightCm: 175,
      hand: "right",
      eyes: "blue",
      hair: "lightBrown",
      sign: "cancer",
    },
    {
      id: "ink",
      name: "Agentin Ink",
      icon: "🖋️",
      description:
        "Eine Agentin mit einem Herz aus Gold - und einem Sinn für Gold. Sie weiß, wie man einen Mordsgewinn macht.",
      heightCm: 165,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "virgo",
    },
    {
      id: "rose",
      name: "Großmeister Rose",
      icon: "♟️",
      description:
        "Ein Schachgroßmeister, der immer schon seinen nächsten Zug plant. Zum Beispiel, wie er aufhört, in einem Mordfall verdächtig zu sein. (2. ... Ke7??)",
      heightCm: 170,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "scorpio",
    },
  ],
  locations: [
    {
      id: "docks",
      name: "das Dock",
      icon: "⚓",
      description:
        "Ein altes, morsches Dock, das schon bessere Tage gesehen hat. Vorsicht vor den Haien!",
      indoors: false,
    },
    {
      id: "grove",
      name: "der Spukhain",
      icon: "🌲",
      description:
        "Ein Hain an einer Ecke der Insel. Besucher berichten, sie hätten Stimmen flüstern hören.",
      indoors: false,
    },
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "🗿",
      description: "Neue Hypothese: Es ist uralte Installationskunst.",
      indoors: false,
    },
    {
      id: "cliffs",
      name: "die Klippen",
      icon: "🏔️",
      description:
        "Es geht tief hinunter, aber das Gute ist: Die zackigen Felsen fangen deinen Sturz ab.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "brick",
      name: "ein gewöhnlicher Ziegelstein",
      icon: "🧱",
      description:
        "Einfach ein ganz normaler, gewöhnlicher Ziegelstein. Nichts Besonderes. Nur ein Ziegelstein.",
      weight: "medium",
      material: "Ziegel",
    },
    {
      id: "axe",
      name: "eine Axt",
      icon: "🪓",
      description:
        "Mit dieser Axt könnte man einen Baum fällen. Oder einen Menschen!",
      weight: "medium",
      material: "Holz und Metall",
    },
    {
      id: "oar",
      name: "ein Ruder",
      icon: "🛶",
      description:
        "Damit könnte man ein Boot paddeln, aber Vorsicht vor Splittern.",
      weight: "heavy",
      material: "Holz",
    },
    {
      id: "bear-trap",
      name: "eine Bärenfalle",
      icon: "🪤",
      description:
        "Wer das für einen Menschen zu grausam findet, sollte mal überlegen, wie es den Bären geht!",
      weight: "heavy",
      material: "Metall",
    },
  ],
  motives: [
    { id: "father", name: "den Vater rächen", icon: "☕" },
    { id: "map", name: "eine Schatzkarte stehlen", icon: "🗺️" },
    { id: "lady", name: "eine Dame beeindrucken", icon: "♀️" },
    { id: "madness", name: "aus Wahnsinn", icon: "🤪" },
  ],
  clues: [
    {
      text: "Wer die Bärenfalle hatte, wollte keine Schatzkarte stehlen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("bear-trap").id)?.id !== "map",
    },
    {
      text: "Wer eine Dame beeindrucken wollte, hatte eine Waffe, die zumindest teilweise aus Metall war.",
      holds: (scene) => madeOf(scene, scene.driven("lady").id, "Metall"),
    },
    {
      text: "Nur wer aus Wahnsinn töten würde, nähme einen gewöhnlichen Ziegelstein.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("brick").id)?.id === "madness",
    },
    {
      text: "Vizepräsidentin Mauve wurde beim Studieren von etwas gesehen, das Installationskunst sein könnte.",
      holds: (scene) => scene.locationOf("mauve").id === "ruins",
    },
    {
      text: "Eine Jungfrau hatte das Ruder. Jungfrauen haben eben gern das Ruder in der Hand.",
      holds: (scene) => scene.holder("oar").sign === "virgo",
    },
    {
      text: "Die größte verdächtige Person hatte eine Waffe, die (zumindest teilweise) aus Holz war.",
      holds: (scene) => madeOf(scene, "navy", "Holz"),
    },
    {
      text: "Wer eine Dame beeindrucken wollte, war auf den Klippen.",
      holds: (scene) =>
        scene.locationOf(scene.driven("lady").id).id === "cliffs",
    },
    {
      text: "Die zweitgrößte verdächtige Person hatte eine Waffe, die (zumindest teilweise) aus Metall war.",
      holds: (scene) => madeOf(scene, "mauve", "Metall"),
    },
    {
      text: "Wer im Spukhain war, war Linkshänder.",
      holds: (scene) => scene.at("grove").hand === "left",
    },
  ],
  body: {
    text: "Der Verwalter wurde mit einer Axt getötet.",
    weapon: "axe",
  },
  solution: {
    mauve: { weapon: "bear-trap", location: "ruins", motive: "father" },
    navy: { weapon: "axe", location: "cliffs", motive: "lady" },
    ink: { weapon: "oar", location: "docks", motive: "map" },
    rose: { weapon: "brick", location: "grove", motive: "madness" },
  },
  murderer: "navy",
  hints: [
    {
      text: "Logico sah zu den Sternen auf und versuchte sich vorzustellen, was sie bedeuten könnten. Vielleicht, dass Mauve eine Bärenfalle hatte? Irratino hätte es gewusst.",
      book: true,
      marks: [{ a: "mauve", b: "bear-trap", value: "check" }],
    },
    {
      text: "Die einzige Jungfrau ist Agentin Ink: Sie hatte das Ruder. Der Größte ist Admiral Navy (1,75 m) mit einer Waffe aus Holz - das Ruder hat Ink, also hatte Navy die Axt.",
      marks: [
        { a: "ink", b: "oar", value: "check" },
        { a: "navy", b: "axe", value: "check" },
      ],
    },
    {
      text: "Die Zweitgrößte ist Vizepräsidentin Mauve (1,73 m) mit einer Waffe aus Metall - die Axt hat Navy, also hatte Mauve die Bärenfalle. Für Großmeister Rose bleibt der Ziegelstein, und den nimmt nur, wer aus Wahnsinn tötet.",
      marks: [
        { a: "rose", b: "brick", value: "check" },
        { a: "rose", b: "madness", value: "check" },
        { a: "brick", b: "madness", value: "check" },
      ],
    },
    {
      text: "Wer eine Dame beeindrucken wollte, hatte Metall (Navy oder Mauve) und war auf den Klippen. Mauve studierte die Installationskunst in den alten Ruinen - also wollte Navy die Dame beeindrucken und war auf den Klippen.",
      marks: [
        { a: "navy", b: "cliffs", value: "check" },
        { a: "navy", b: "lady", value: "check" },
        { a: "cliffs", b: "lady", value: "check" },
        { a: "mauve", b: "ruins", value: "check" },
      ],
    },
    {
      text: "Mauve mit der Bärenfalle wollte keine Schatzkarte stehlen, also den Vater rächen; Ink wollte die Schatzkarte. Im Spukhain war ein Linkshänder - Rose. Ink war am Dock.",
      marks: [
        { a: "mauve", b: "father", value: "check" },
        { a: "ink", b: "map", value: "check" },
        { a: "bear-trap", b: "father", value: "check" },
        { a: "rose", b: "grove", value: "check" },
        { a: "ink", b: "docks", value: "check" },
      ],
    },
    {
      text: "Die Axt war die Tatwaffe: Admiral Navy war es, mit der Axt, auf den Klippen, um eine Dame zu beeindrucken.",
      marks: [
        { a: "axe", b: "cliffs", value: "check" },
        { a: "axe", b: "lady", value: "check" },
        { a: "bear-trap", b: "ruins", value: "check" },
        { a: "ruins", b: "father", value: "check" },
        { a: "oar", b: "docks", value: "check" },
        { a: "oar", b: "map", value: "check" },
        { a: "docks", b: "map", value: "check" },
        { a: "brick", b: "grove", value: "check" },
        { a: "grove", b: "madness", value: "check" },
      ],
    },
  ],
};

/** Whether a suspect's weapon is made, at least in part, of a material. */
function madeOf(scene: Scene, suspect: string, material: string): boolean {
  return scene.weaponOf(suspect).material?.includes(material) === true;
}
