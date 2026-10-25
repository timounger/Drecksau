/**
 * Case 68, "Houston, We Have a Body": a murder on the moon that the
 * government covered up.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of
 * the book. The story mentions Exhibit C, the labyrinth on the ancient
 * ruins, but no clue needs it and the photos do not show it, so it is not
 * modelled. The scrambled records read "Cosmonaut Bluski had brought to the
 * moon the skull of a great revolutionary hero"; here they are scrambled
 * again in German, letter by letter within each word. The solver found the
 * only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const HOUSTON_WE_HAVE_A_BODY: Case = {
  id: "houston-we-have-a-body",
  number: 68,
  title: "Houston, wir haben eine Leiche",
  story:
    "Als Logico die Buchstaben im Labyrinth auf den alten Ruinen neu ordnete (siehe Beweisstück C), ergaben sie LUNAR ONE I. Er hackte sich in eine Regierungsdatenbank über die neu gebaute Mondbasis und erfuhr zwei unglaubliche Dinge: Man hatte auf dem Mond alte Ruinen entdeckt - und man vertuschte einen Mord auf dem Mond.",
  series: "volume1",
  difficulty: "hardBoiled",
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
      sign: "aries",
    },
    {
      id: "slate",
      name: "Kapitänin Slate",
      icon: "\u{1F469}‍\u{1F680}",
      description:
        "Eine echte Astronautin. Die erste Frau, die die dunkle Seite des Mondes umrundet hat - und die erste, die verdächtigt wurde, ihren Kopiloten ermordet zu haben.",
      heightCm: 165,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "aquarius",
    },
    {
      id: "bluski",
      name: "Kosmonaut Bluski",
      icon: "\u{1F468}‍\u{1F680}",
      description:
        "Ein ehemaliger sowjetischer Raumfahrer, dessen Blut rot fließt. Klar, das ist normal - aber bei ihm ist es patriotisch.",
      heightCm: 188,
      hand: "left",
      eyes: "darkBrown",
      hair: "black",
      sign: "aries",
    },
    {
      id: "coffee",
      name: "General Coffee",
      icon: "☕",
      description:
        "Ein Espressokenner, der ohne Kaffee niemals der Kriegsverbrecher geworden wäre, der er heute ist.",
      heightCm: 183,
      hand: "right",
      eyes: "darkBrown",
      hair: "bald",
      sign: "sagittarius",
    },
  ],
  locations: [
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "\u{1F3DB}️",
      description:
        "Im Weltraum sind sie perfekt erhalten. Aber wie kommen sie dort hinauf? Und warum?",
      indoors: false,
    },
    {
      id: "rover",
      name: "der Mondrover",
      icon: "\u{1F699}",
      description:
        "Ein toller Buggy zum Herumcruisen - vielleicht trifft man ein paar Mondschönheiten oder Mondkumpels.",
      indoors: false,
    },
    {
      id: "base",
      name: "die Mondbasis",
      icon: "\u{1F3E0}",
      description:
        "Dein Zuhause fern der Heimatwelt. Genieße es, dich in der geringen Schwerkraft superstark zu fühlen.",
      indoors: true,
    },
    {
      id: "lander",
      name: "die Mondlandefähre",
      icon: "\u{1F680}",
      description:
        "Das gute Stück kann mit seinen Raumdüsen zurück zum Raumschiff in der Umlaufbahn fliegen.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "air-tank",
      name: "eine Sauerstoffflasche",
      icon: "\u{1F9EF}",
      description: "Damit kann man atmen - oder jemanden am Atmen hindern.",
      weight: "heavy",
      material: "Metall und Luft",
    },
    {
      id: "battery",
      name: "eine große Batterie",
      icon: "\u{1F50B}",
      description:
        "Sie versorgt deine Weltraumwerkzeuge mit zehntausend Volt - oder tötet!",
      weight: "heavy",
      material: "Metall und Technik",
    },
    {
      id: "skull",
      name: "ein menschlicher Schädel",
      icon: "\u{1F480}",
      description:
        '"Ach, armer Yorick, ich kannte ihn. Und jetzt schwinge ich seinen Schädel gegen Leute."',
      weight: "medium",
      material: "Knochen",
    },
    {
      id: "moon-rock",
      name: "ein Mondgestein",
      icon: "\u{1FAA8}",
      description:
        "Wenn man keine andere Waffe findet - ein Stein liegt immer in der Nähe.",
      weight: "medium",
      material: "Gestein",
    },
  ],
  motives: [
    { id: "revenge", name: "sich rächen", icon: "⚔️" },
    {
      id: "experiment",
      name: "als wissenschaftliches Experiment",
      icon: "\u{1F52C}",
    },
    { id: "politics", name: "aus politischen Gründen", icon: "\u{1F5F3}️" },
    { id: "madness", name: "aus Weltraumwahnsinn", icon: "\u{1F92A}" },
  ],
  clues: [
    {
      text: "Laut den Regierungsakten würde die Person mit der Sauerstoffflasche aus Weltraumwahnsinn töten - und den gibt es wirklich.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("air-tank").id)?.id === "madness",
    },
    {
      text: "Ein Widder trug nachweislich das Mondgestein bei sich.",
      holds: (scene) => scene.holder("moon-rock").sign === "aries",
    },
    {
      text: "Ein Schütze wiederum besaß die große Batterie.",
      holds: (scene) => scene.holder("battery").sign === "sagittarius",
    },
    {
      text: "Die Person, die genauso groß ist wie General Coffee, und die Person, die eine Sauerstoffflasche mitgebracht hatte, waren im Weltraumcamp in derselben Clique.",
      holds: (scene) => scene.holder("air-tank").id !== "raspberry",
    },
    {
      text: "In der Mondbasis eingesperrt zu sein, weckte in dieser Person den Wunsch nach Rache.",
      holds: (scene) => scene.motiveOf(scene.at("base").id)?.id === "revenge",
    },
    {
      text: "Die Überreste eines menschlichen Kopfes wurden draußen gesehen.",
      holds: (scene) => !scene.locationOf(scene.holder("skull").id).indoors,
    },
    {
      text: "Die Person, die als wissenschaftliches Experiment töten wollte, fuhr den Mondrover.",
      holds: (scene) =>
        scene.locationOf(scene.driven("experiment").id).id === "rover",
    },
    {
      text: "Aus geheimen, verwürfelten Akten: OAUOKTMSN LSIBKU TTAEH END CEHLÄDS ESNEI SOSENRG DEHITLRUEEVSONNOL ZMU MDON HRGATEBC.",
      holds: (scene) => scene.weaponOf("bluski").id === "skull",
    },
    {
      text: "Wer die alten Ruinen besuchte, war Rechtshänder.",
      holds: (scene) => scene.at("ruins").hand === "right",
    },
  ],
  body: {
    text: "Der Mord geschah unter einer Raumdüse.",
    location: "lander",
  },
  solution: {
    raspberry: { weapon: "moon-rock", location: "base", motive: "revenge" },
    slate: { weapon: "air-tank", location: "lander", motive: "madness" },
    bluski: { weapon: "skull", location: "rover", motive: "experiment" },
    coffee: { weapon: "battery", location: "ruins", motive: "politics" },
  },
  murderer: "slate",
  hints: [
    {
      text: "Mit etwas einfacher Numerologie, die er von Irratino gelernt hatte, konnte Deductive Logico errechnen, dass Kapitänin Slate neben ein paar Raumdüsen war.",
      book: true,
    },
    {
      text: 'Die verwürfelten Akten, Wort für Wort entwürfelt: "KOSMONAUT BLUSKI HATTE DEN SCHÄDEL EINES GROSSEN REVOLUTIONSHELDEN ZUM MOND GEBRACHT." Bluski hatte also den Schädel.',
      marks: [{ a: "bluski", b: "skull", value: "check" }],
    },
    {
      text: "Der einzige Schütze ist General Coffee: Er hatte die große Batterie. Das Mondgestein hatte ein Widder - Bluski hat den Schädel, also Trainer Raspberry. Kapitänin Slate bleibt die Sauerstoffflasche, und wer sie hatte, wollte aus Weltraumwahnsinn töten.",
      marks: [
        { a: "coffee", b: "battery", value: "check" },
        { a: "raspberry", b: "moon-rock", value: "check" },
        { a: "slate", b: "air-tank", value: "check" },
        { a: "slate", b: "madness", value: "check" },
        { a: "air-tank", b: "madness", value: "check" },
      ],
    },
    {
      text: "Rechtshänder ist nur General Coffee: Er war bei den alten Ruinen. Der Schädel war draußen, also nicht in der Mondbasis - Bluski war dort nicht.",
      marks: [{ a: "coffee", b: "ruins", value: "check" }],
    },
    {
      text: "Wer in der Mondbasis war, wollte sich rächen - Slate (Weltraumwahnsinn) war es also nicht. Damit war Trainer Raspberry in der Mondbasis und wollte sich rächen.",
      marks: [
        { a: "base", b: "revenge", value: "check" },
        { a: "raspberry", b: "base", value: "check" },
        { a: "raspberry", b: "revenge", value: "check" },
      ],
    },
    {
      text: "Wer als Experiment töten wollte, saß im Mondrover - das kann Slate nicht sein. Also war Bluski im Rover und wollte experimentieren, Slate war bei der Mondlandefähre, und Coffee bleiben die politischen Gründe.",
      marks: [
        { a: "rover", b: "experiment", value: "check" },
        { a: "slate", b: "lander", value: "check" },
      ],
    },
    {
      text: "Die Raumdüsen gehören zur Mondlandefähre: Kapitänin Slate tötete dort mit der Sauerstoffflasche, aus Weltraumwahnsinn.",
      marks: [
        { a: "air-tank", b: "lander", value: "check" },
        { a: "lander", b: "madness", value: "check" },
        { a: "moon-rock", b: "base", value: "check" },
        { a: "moon-rock", b: "revenge", value: "check" },
        { a: "bluski", b: "rover", value: "check" },
        { a: "bluski", b: "experiment", value: "check" },
        { a: "skull", b: "rover", value: "check" },
        { a: "skull", b: "experiment", value: "check" },
        { a: "coffee", b: "politics", value: "check" },
        { a: "battery", b: "ruins", value: "check" },
        { a: "battery", b: "politics", value: "check" },
        { a: "ruins", b: "politics", value: "check" },
      ],
    },
  ],
};
