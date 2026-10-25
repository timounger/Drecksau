/**
 * Case 98, "Stage Fright": Inspector Irratino, killed again - on the locked
 * sound stage.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from the photos of the
 * book. Motives and statements, no body clue - the liar is the murderer.
 * Only people with blue eyes may join the Ancient Blood of Beasts, and a
 * member had the knife and a member wanted a promotion: the three clues
 * share those predicates. The scribbled note reads "The person with a piece
 * of rebar did not want to win an award"; here it is scrambled again in
 * German, letter by letter within each word. The first hint is the book's;
 * the solver's only solution is the one the book prints, and the other
 * hints are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const STAGE_FRIGHT: Case = {
  id: "stage-fright",
  number: 98,
  title: "Lampenfieber",
  story:
    'Dame Obsidian führte sie zu der geheimnisvollen Tonbühne am Westrand des Studios. Vor der verschlossenen Tür stritten Pearl, AGE, und Midnight III über das Ende von Murdle: Der Film. Doch als Dame Obsidian den Schlüssel hochhielt, wirkten beide schockiert. "Seit Jahren war niemand mehr in der verschlossenen Tonbühne", sagte Pearl. "Vielleicht wird es Zeit", erwiderte Midnight III. "Sehen wir nach, was Dad so treibt." Dame Obsidian schloss die Tür auf, und alle schlichen hinein. Doch kaum umgab sie die Dunkelheit, hörten sie einen Schrei. Jemand hatte Irratino getötet! Schon wieder!',
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "pearl",
      name: "Pearl, AGE",
      icon: "\u{1F453}",
      description:
        "Die Cutterin einiger der besten und erfolgreichsten Filme aller Zeiten - nur nie beides zugleich.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "aquarius",
    },
    {
      id: "copper",
      name: "Polizistin Copper",
      icon: "\u{1F46E}‍♀️",
      description:
        "Die einzige nicht ermordete Wachfrau auf dem Gelände von Midnight Movies.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "aries",
    },
    {
      id: "obsidian",
      name: "Dame Obsidian",
      icon: "\u{1F452}",
      description:
        "Klar, sie hat jede Menge Leute ermordet. Aber sonst wird auch niemand fürs Töten bestraft - warum also ausgerechnet sie?",
      heightCm: 163,
      hand: "left",
      eyes: "green",
      hair: "black",
      sign: "leo",
    },
    {
      id: "midnight-iii",
      name: "Midnight III",
      icon: "\u{1F576}️",
      description:
        "Er glaubt, dass Murdle: Der Film dem Studio seinen alten Glanz zurückgeben wird.",
      heightCm: 173,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "libra",
    },
  ],
  locations: [
    {
      id: "tarp",
      name: "eine Plane",
      icon: "❓",
      description: "Sie verhüllt etwas Riesiges mitten in der Lagerhalle.",
      indoors: true,
    },
    {
      id: "tank",
      name: "ein großer Tank",
      icon: "\u{1F3ED}",
      description: "Hier lagert das Öl, bis es raffiniert wird.",
      indoors: true,
    },
    {
      id: "machine",
      name: "eine große Maschine",
      icon: "⚙️",
      description:
        "Irgendeine Raffinerieanlage oder ein Trenntank - oder vielleicht etwas ganz anderes?",
      indoors: true,
    },
    {
      id: "pumpjack",
      name: "eine Pferdekopfpumpe",
      icon: "\u{1F3D7}️",
      description:
        "Sie arbeitet auf Hochtouren und pumpt Öl unter dem Studio hervor.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "drum",
      name: "ein Ölfass",
      icon: "\u{1F6E2}️",
      description:
        "Eigentlich eher ein Kanister als ein Fass: Ein Ölfass-Solo hat noch keine Band gespielt.",
      weight: "heavy",
      material: "Metall und Öl",
    },
    {
      id: "knife",
      name: "ein Messer",
      icon: "\u{1F52A}",
      description:
        "Damit kann man vieles tun, zum Beispiel Gemüse schneiden. Oder morden.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "rebar",
      name: "ein Stück Bewehrungsstahl",
      icon: "\u{1F529}",
      description:
        "Ein langes Stück Metall. Wenn das keine Waffe ist, dann gar nichts. Findet sich oft bei Zement.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "shovel",
      name: "eine Schaufel",
      icon: "\u{1FA8F}",
      description:
        "Das Großartige am Morden mit einer Schaufel: Man kann damit auch ein Loch graben, um die Leiche zu verstecken.",
      weight: "medium",
      material: "Metall und Holz",
    },
  ],
  motives: [
    { id: "promotion", name: "befördert werden", icon: "\u{1F4C8}" },
    { id: "studio", name: "ein Studio übernehmen", icon: "\u{1F3AC}" },
    { id: "secret", name: "ein Geheimnis schützen", icon: "\u{1F92B}" },
    { id: "win-award", name: "einen Preis gewinnen", icon: "\u{1F3C6}" },
  ],
  clues: [
    {
      text: "Polizistin Copper hatte ein Ölfass dabei.",
      holds: (scene) => scene.weaponOf("copper").id === "drum",
    },
    {
      text: "Ein Mitglied des Uralten Bluts der Bestien hatte das Messer.",
      holds: (scene) => scene.holder("knife").eyes === "blue",
    },
    {
      text: "Irratino hielt eine hingekritzelte Notiz in der Hand: RWE SDA ÜCTKS HWRAHTNSSUEBEGL TETHA, TLLEOW EKNENI RPIES NIGWNENE.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("rebar").id)?.id !== "win-award",
    },
    {
      text: "Midnight III wurde gesehen, wie er eine geheimnisvolle Plane untersuchte.",
      holds: (scene) => scene.locationOf("midnight-iii").id === "tarp",
    },
    {
      text: "Ein Mitglied des Uralten Bluts der Bestien wollte befördert werden.",
      holds: (scene) => scene.driven("promotion").eyes === "blue",
    },
    {
      text: "Wer die Schaufel hatte, war neben der Pferdekopfpumpe.",
      holds: (scene) =>
        scene.locationOf(scene.holder("shovel").id).id === "pumpjack",
    },
    {
      text: "Nur Menschen mit blauen Augen dürfen dem Uralten Blut der Bestien beitreten.",
      holds: (scene) => bloodFits(scene),
    },
    {
      text: "Pearl, AGE, wollte ein Geheimnis schützen.",
      holds: (scene) => scene.motiveOf("pearl")?.id === "secret",
    },
  ],
  statements: [
    {
      by: "pearl",
      text: "Mir scheint, Polizistin Copper war bei einer großen Maschine.",
      holds: (scene) => scene.locationOf("copper").id === "machine",
    },
    {
      by: "copper",
      text: "Ich war nicht bei der Plane.",
      holds: (scene) => scene.locationOf("copper").id !== "tarp",
    },
    {
      by: "obsidian",
      text: "Midnight III war nicht bei einer großen Maschine.",
      holds: (scene) => scene.locationOf("midnight-iii").id !== "machine",
    },
    {
      by: "midnight-iii",
      text: "Ein Stück Bewehrungsstahl war nicht bei einer großen Maschine.",
      holds: (scene) =>
        scene.locationOf(scene.holder("rebar").id).id !== "machine",
    },
  ],
  solution: {
    pearl: { weapon: "knife", location: "machine", motive: "secret" },
    copper: { weapon: "drum", location: "tank", motive: "promotion" },
    obsidian: { weapon: "shovel", location: "pumpjack", motive: "win-award" },
    "midnight-iii": { weapon: "rebar", location: "tarp", motive: "studio" },
  },
  murderer: "pearl",
  hints: [
    {
      text: 'Inspektor Irratino zwinkerte Logico zu und reichte ihm noch eine Notiz. Dann stellte er sich wieder tot. Auf der Notiz stand: "Der Mörder hat mich erstochen!"',
      book: true,
    },
    {
      text: "Copper hatte das Ölfass, Midnight III war bei der Plane. Ins Uralte Blut der Bestien kommen nur Blauäugige - Pearl und Copper. Das Messer hatte ein Mitglied, und Copper hat das Fass: Pearl hatte das Messer. Befördert werden wollte ein Mitglied, und Pearl will ein Geheimnis schützen: Copper wollte befördert werden.",
      marks: [
        { a: "copper", b: "drum", value: "check" },
        { a: "midnight-iii", b: "tarp", value: "check" },
        { a: "pearl", b: "knife", value: "check" },
        { a: "pearl", b: "secret", value: "check" },
        { a: "copper", b: "promotion", value: "check" },
      ],
    },
    {
      text: "Die Schaufel war bei der Pferdekopfpumpe - nicht Midnight III (Plane), also Dame Obsidian. Midnight III bleibt der Bewehrungsstahl.",
      marks: [
        { a: "obsidian", b: "shovel", value: "check" },
        { a: "obsidian", b: "pumpjack", value: "check" },
        { a: "shovel", b: "pumpjack", value: "check" },
        { a: "midnight-iii", b: "rebar", value: "check" },
      ],
    },
    {
      text: 'Die Notiz, Wort für Wort entwürfelt: "WER DAS STÜCK BEWEHRUNGSSTAHL HATTE, WOLLTE KEINEN PREIS GEWINNEN." Also will Midnight III ein Studio übernehmen und Obsidian einen Preis gewinnen.',
      marks: [
        { a: "obsidian", b: "win-award", value: "check" },
        { a: "midnight-iii", b: "studio", value: "check" },
        { a: "rebar", b: "studio", value: "check" },
      ],
    },
    {
      text: "Copper war nicht bei der Plane, Midnight III nicht bei der Maschine, und der Stahl (bei Midnight III, an der Plane) nicht bei der Maschine: Copper, Obsidian und Midnight III sagen die Wahrheit. Also lügt Pearl, AGE - sie ist die Mörderin. Copper war nicht bei der Maschine, sondern beim Tank, und Pearl mit dem Messer bei der großen Maschine.",
      marks: [
        { a: "pearl", b: "machine", value: "check" },
        { a: "copper", b: "tank", value: "check" },
        { a: "knife", b: "machine", value: "check" },
        { a: "knife", b: "secret", value: "check" },
        { a: "machine", b: "secret", value: "check" },
        { a: "drum", b: "tank", value: "check" },
        { a: "drum", b: "promotion", value: "check" },
        { a: "tank", b: "promotion", value: "check" },
        { a: "shovel", b: "win-award", value: "check" },
        { a: "pumpjack", b: "win-award", value: "check" },
        { a: "rebar", b: "tarp", value: "check" },
        { a: "tarp", b: "studio", value: "check" },
      ],
    },
  ],
};

/**
 * Whether the Ancient Blood of Beasts fits: its members - whoever had the
 * knife and whoever wanted a promotion - all have blue eyes.
 *
 * @param scene - one way it could have been
 * @returns whether both members have blue eyes
 */
function bloodFits(scene: Scene): boolean {
  return (
    scene.holder("knife").eyes === "blue" &&
    scene.driven("promotion").eyes === "blue"
  );
}
