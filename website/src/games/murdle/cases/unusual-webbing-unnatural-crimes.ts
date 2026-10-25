/**
 * Case 55, "Unusual Webbing, Unnatural Crimes": a park ranger, dead in a
 * national park, just as Logico had dreamt.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The book prints Mayor Honey's hair as "brown"; it stays light brown as
 * in the other cases. The bold clue names the weapon - the webbing is the
 * spider's; the murderer is whoever had it. The photographed pages print
 * neither hint nor solution; the solver found the only one, and the hints are
 * our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const UNUSUAL_WEBBING_UNNATURAL_CRIMES: Case = {
  id: "unusual-webbing-unnatural-crimes",
  number: 55,
  title: "Spinnefeind im Nationalpark",
  story:
    "Deductive Logico zeltete allein in einem Nationalpark und träumte von alten Ruinen und von einem Parkranger, der ermordet wurde. Als er aufwachte, sah er, dass der Traum wahr geworden war.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "honey",
      name: "Bürgermeister Honey",
      icon: "🎩",
      description:
        "Er ist zur Klausur im Wald, um nach dem jüngsten Skandal (Mord) seine politischen Aussichten neu zu bewerten.",
      heightCm: 183,
      hand: "left",
      eyes: "hazel",
      hair: "lightBrown",
      sign: "scorpio",
    },
    {
      id: "applegreen",
      name: "Schulleiter Applegreen",
      icon: "👨‍🏫",
      description:
        "Ein strenger Schulleiter, was alles angeht - außer, mit einem Mord davonzukommen. Seine Hände sind immer voller Kreide.",
      heightCm: 180,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "libra",
    },
    {
      id: "raspberry",
      name: "Trainer Raspberry",
      icon: "🏈",
      description:
        "Einer der besten Trainer diesseits des Mississippi - egal, auf welcher Seite man steht.",
      heightCm: 183,
      hand: "left",
      eyes: "blue",
      hair: "blond",
      sign: "aries",
    },
    {
      id: "tuscany",
      name: "Rektorin Tuscany",
      icon: "🎓",
      description:
        "Als Leiterin des Deduction College hat sie deduziert, wie man das Spiel der akademischen Machtpolitik am besten spielt: Verbündete belohnen, Feinde bestrafen und keine Angst vor dem Töten haben.",
      heightCm: 165,
      hand: "left",
      eyes: "green",
      hair: "gray",
      sign: "libra",
    },
  ],
  locations: [
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "🗿",
      description:
        "Vielleicht sind sie eine Art Markierung, die Außerirdischen interessante Orte zeigt?",
      indoors: false,
    },
    {
      id: "spa",
      name: "das Thermalbad",
      icon: "♨️",
      description:
        "Die Leute reisen Hunderte Kilometer an, um in diesen heißen Quellen Fotos von sich zu machen.",
      indoors: true,
    },
    {
      id: "lake",
      name: "der Partysee",
      icon: "🌊",
      description:
        "In diesem See ertrinken bekanntlich Leute - und deshalb verstecken Leute bekanntlich auch Leichen in seinem eiskalten Wasser.",
      indoors: false,
    },
    {
      id: "gate",
      name: "das Eingangstor",
      icon: "⛩️",
      description:
        "Ein riesiges Tor, das mit einem Ort wirbt, an dem man von der modernen Welt abschalten kann - gegen Bezahlung.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "spider",
      name: "eine Giftspinne",
      icon: "🕷️",
      description:
        "Definitiv kein Unfall: Ihr ungewöhnliches Netz zeigt, dass diese Spinne nicht aus diesen Wäldern stammt.",
      weight: "light",
      material: "lebendiges Tier",
    },
    {
      id: "shears",
      name: "eine Gartenschere",
      icon: "✂️",
      description:
        "Rostig, schwer und gefährlich. Damit kann man eine Hecke stutzen - oder jemandem ein paar Lebensjahre.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "bow",
      name: "Pfeil und Bogen",
      icon: "🏹",
      description:
        "Sieh dir dieses Ding an: was für eine Schönheit! Sieh dir die Federn an den Pfeilen an, wie sie auf deinen Kopf zufliegen.",
      weight: "medium",
      material: "Keramik, Leinen und Federn",
    },
    {
      id: "ice-axe",
      name: "ein Eispickel",
      icon: "⛏️",
      description:
        "Damit könnte man eine Klippe erklimmen und die Schönheit der Natur bewundern. Oder jemanden umbringen.",
      weight: "heavy",
      material: "Metall und Holz",
    },
  ],
  motives: [
    { id: "rob", name: "das Opfer ausrauben", icon: "🥷" },
    { id: "scam", name: "für einen Immobilienbetrug", icon: "🏠" },
    { id: "see", name: "sehen, ob es geht", icon: "👁️" },
    { id: "blackmail", name: "einer Erpressung entkommen", icon: "✉️" },
  ],
  clues: [
    {
      text: "Logico hatte schon früher Giftspinnen als Waffe gesehen, aber immer nur bei einem Immobilienbetrug.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("spider").id)?.id === "scam",
    },
    {
      text: "Schulleiter Applegreen war nicht am Eingangstor.",
      holds: (scene) => scene.locationOf("applegreen").id !== "gate",
    },
    {
      text: "Die kleinste verdächtige Person hatte einen Eispickel.",
      holds: (scene) => scene.weaponOf("tuscany").id === "ice-axe",
    },
    {
      text: "Spuren einer Waffe aus einem lebendigen Tier wurden in den alten Ruinen gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("spider").id).id === "ruins",
    },
    {
      text: "Wer sehen wollte, ob es geht, hatte eine Waffe, die zumindest teilweise aus Keramik war.",
      holds: (scene) =>
        scene.weaponOf(scene.driven("see").id).material?.includes("Keramik") ===
        true,
    },
    {
      text: "Trainer Raspberry wurde beim Schwimmen in eiskaltem Wasser gesehen.",
      holds: (scene) => scene.locationOf("raspberry").id === "lake",
    },
    {
      text: "Die Gartenschere war rechtshändig.",
      holds: (scene) => scene.holder("shears").hand === "right",
    },
    {
      text: "Wer einer Erpressung entkommen wollte, wurde draußen gesehen.",
      holds: (scene) => !scene.locationOf(scene.driven("blackmail").id).indoors,
    },
  ],
  body: {
    text: "Neben dem Waldhüter wurde ein ungewöhnliches Spinnennetz gefunden.",
    weapon: "spider",
  },
  solution: {
    honey: { weapon: "spider", location: "ruins", motive: "scam" },
    applegreen: { weapon: "shears", location: "spa", motive: "rob" },
    raspberry: { weapon: "bow", location: "lake", motive: "see" },
    tuscany: { weapon: "ice-axe", location: "gate", motive: "blackmail" },
  },
  murderer: "honey",
  hints: [
    {
      text: 'Logico erinnerte sich an einen weiteren Teil seines Traums: "Ein Eispickel lag unter dem Tor." Er wünschte, er hätte stattdessen von Irratino geträumt.',
      book: true,
    },
    {
      text: "Die Kleinste ist Rektorin Tuscany (1,65 m): Sie hatte den Eispickel. Die Gartenschere war rechtshändig - der einzige Rechtshänder ist Schulleiter Applegreen.",
      marks: [
        { a: "tuscany", b: "ice-axe", value: "check" },
        { a: "applegreen", b: "shears", value: "check" },
      ],
    },
    {
      text: "Die Spinne (die Waffe aus einem lebendigen Tier) war in den alten Ruinen. Trainer Raspberry schwamm im eiskalten Partysee, hatte die Spinne also nicht - er hatte Pfeil und Bogen. Bürgermeister Honey hatte die Spinne und war in den Ruinen.",
      marks: [
        { a: "raspberry", b: "bow", value: "check" },
        { a: "raspberry", b: "lake", value: "check" },
        { a: "bow", b: "lake", value: "check" },
        { a: "honey", b: "ruins", value: "check" },
      ],
    },
    {
      text: "Mit der Spinne tötet man nur für einen Immobilienbetrug: Das war Honeys Motiv. Wer sehen wollte, ob es geht, hatte Keramik - Pfeil und Bogen, also Raspberry.",
      marks: [{ a: "honey", b: "scam", value: "check" }],
    },
    {
      text: "Applegreen war nicht am Eingangstor, also im Thermalbad; Tuscany war am Tor. Wer der Erpressung entkommen wollte, war draußen - das Thermalbad ist drinnen, also war es Tuscany. Applegreen wollte das Opfer ausrauben.",
      marks: [
        { a: "applegreen", b: "spa", value: "check" },
        { a: "tuscany", b: "gate", value: "check" },
        { a: "tuscany", b: "blackmail", value: "check" },
        { a: "applegreen", b: "rob", value: "check" },
      ],
    },
    {
      text: "Das Spinnennetz verrät die Tatwaffe: Bürgermeister Honey war es, mit der Giftspinne, in den alten Ruinen, für einen Immobilienbetrug.",
      marks: [
        { a: "honey", b: "spider", value: "check" },
        { a: "spider", b: "ruins", value: "check" },
        { a: "spider", b: "scam", value: "check" },
        { a: "ruins", b: "scam", value: "check" },
        { a: "shears", b: "spa", value: "check" },
        { a: "shears", b: "rob", value: "check" },
        { a: "spa", b: "rob", value: "check" },
        { a: "raspberry", b: "see", value: "check" },
        { a: "bow", b: "see", value: "check" },
        { a: "lake", b: "see", value: "check" },
        { a: "ice-axe", b: "gate", value: "check" },
        { a: "ice-axe", b: "blackmail", value: "check" },
        { a: "gate", b: "blackmail", value: "check" },
      ],
    },
  ],
};
