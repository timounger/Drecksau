/**
 * Case 51, "The Grave Death at the Graveyard": the parson who was to speak at
 * Irratino's funeral.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled). Four suspects, and the
 * first case with motives. The sample prints neither hint nor solution; the
 * solver found the only one, and the hints are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const THE_GRAVE_DEATH_AT_THE_GRAVEYARD: Case = {
  id: "the-grave-death-at-the-graveyard",
  number: 51,
  title: "Todernst auf dem Friedhof",
  story:
    "Deductive Logico konnte nicht glauben, dass Irratino wirklich tot war. Aber er hatte ihn sterben sehen, er hatte gesehen, wie er begraben wurde - es war nicht zu leugnen. Er war tot. Und, wie sich herausstellte, auch der Pfarrer, der bei seiner Beerdigung sprechen sollte.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "azure",
      name: "Astrologin Azure",
      icon: "\u{1F52E}",
      description:
        "Eine Sterndeuterin voller Staunen und Fragen nach der genauen Zeit und dem genauen Ort deiner Geburt.",
      heightCm: 168,
      hand: "right",
      eyes: "hazel",
      hair: "lightBrown",
      sign: "cancer",
    },
    {
      id: "grey",
      name: "Earl Grey",
      icon: "\u{1F9D0}",
      description:
        "Er stammt aus einer langen Reihe von Earl Greys. Ja, wie der Tee. Nein, er gibt keine Autogramme. Aber einen Beutel schenkt er dir, wenn du fragst.",
      heightCm: 175,
      hand: "right",
      eyes: "lightBrown",
      hair: "white",
      sign: "capricorn",
    },
    {
      id: "tangerine",
      name: "Mx. Tangerine",
      icon: "\u{1F9E2}",
      description:
        "Der Beweis, dass auch nicht-binäre Menschen Mörder sein können: Totengräber:in, Sargträger:in und verdächtig.",
      heightCm: 165,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "pisces",
    },
    {
      id: "cloud",
      name: "Kryptozoologe Cloud",
      icon: "☁️",
      description:
        "Er kennt jede Sichtung des Jersey Devil, des Mothman und des Boggy-Creek-Monsters - und auch den Unterschied zwischen ihnen.",
      heightCm: 170,
      hand: "right",
      eyes: "gray",
      hair: "white",
      sign: "scorpio",
    },
  ],
  locations: [
    {
      id: "shack",
      name: "die seltsame Hütte",
      icon: "\u{1F6D6}",
      description:
        "Eine Holzhütte in der Ecke des Friedhofs, bei der man einfach weiß, dass sie ein Geheimnis birgt.",
      indoors: true,
    },
    {
      id: "gift-shop",
      name: "der Souvenirladen",
      icon: "\u{1F381}",
      description:
        "Hier gibt es kleine Grabsteine zum Mitnehmen oder ein Plüschtier des Maskottchens, Mr. Skull.",
      indoors: false,
    },
    {
      id: "mausoleum",
      name: "das riesige Mausoleum",
      icon: "\u{1F53A}",
      description:
        "Die reichen Mitglieder einer einzigen Familie bekommen dieses pyramidenförmige Grabmal.",
      indoors: true,
    },
    {
      id: "gate",
      name: "das Eingangstor",
      icon: "⛩️",
      description:
        "Ein riesiges schmiedeeisernes Tor mit genau der richtigen Menge Rost für eine unheilvolle Stimmung.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "cauldron",
      name: "ein Kessel",
      icon: "\u{1FAD5}",
      description:
        "Wer ihn hochheben kann, kann jemanden damit erschlagen. Oder ihm einfach einen Schluck anbieten.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "ghost-detector",
      name: "ein Geisterdetektor",
      icon: "\u{1F4DF}",
      description:
        "Geister findet er nicht besonders gut, aber Leute einen Stromschlag versetzen kann er ziemlich gut.",
      weight: "medium",
      material: "Metall und Technik",
    },
    {
      id: "broom",
      name: "ein Besen",
      icon: "\u{1F9F9}",
      description:
        "Angeblich fliegen Hexen darauf, aber Logico hat damit immer nur gefegt.",
      weight: "medium",
      material: "Holz und Stroh",
    },
    {
      id: "skeleton-arm",
      name: "ein Skelettarm",
      icon: "\u{1F9B4}",
      description:
        "Den Tod eines Menschen herbeiführen - mit den Knochen eines Menschen, der schon tot ist.",
      weight: "medium",
      material: "Knochen",
    },
  ],
  motives: [
    { id: "rob", name: "das Opfer ausrauben", icon: "\u{1F977}" },
    { id: "see", name: "sehen, ob es geht", icon: "\u{1F441}️" },
    { id: "affair", name: "eine Affäre vertuschen", icon: "\u{1F491}" },
    { id: "body", name: "eine Leiche stehlen", icon: "\u{1F480}" },
  ],
  clues: [
    {
      text: "Astrologin Azure hatte keinen Besen dabei.",
      holds: (scene) => scene.weaponOf("azure").id !== "broom",
    },
    {
      text: "Earl Grey würde weder töten, um zu sehen, ob es geht, noch um eine Affäre zu vertuschen.",
      holds: (scene: Scene): boolean => {
        const motive = scene.motiveOf("grey")?.id;
        return motive !== "see" && motive !== "affair";
      },
    },
    {
      text: "Ein Geisterdetektor wurde zwischen schmiedeeisernen Gitterstäben eingeklemmt entdeckt.",
      holds: (scene) =>
        scene.locationOf(scene.holder("ghost-detector").id).id === "gate",
    },
    {
      text: "Logico fand eine einzelne Besenborste neben einem Plüschskelett.",
      holds: (scene) =>
        scene.locationOf(scene.holder("broom").id).id === "gift-shop",
    },
    {
      text: "Wer mit einem Skelettarm herumfuchtelte, wollte verzweifelt eine Affäre vertuschen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("skeleton-arm").id)?.id === "affair",
    },
    {
      text: "Mx. Tangerine wollte schon immer eine Leiche stehlen. Vielleicht war heute die Nacht?",
      holds: (scene) => scene.motiveOf("tangerine")?.id === "body",
    },
    {
      text: "Wer den Kessel herumschleppte, wollte den Pfarrer ausrauben.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("cauldron").id)?.id === "rob",
    },
    {
      text: "Kryptozoologe Cloud wurde beim Herumschnüffeln in der seltsamen Hütte gesehen.",
      holds: (scene) => scene.locationOf("cloud").id === "shack",
    },
  ],
  body: {
    text: "Die Leiche wurde in einer riesigen Pyramide gefunden.",
    location: "mausoleum",
  },
  solution: {
    azure: { weapon: "ghost-detector", location: "gate", motive: "see" },
    grey: { weapon: "cauldron", location: "mausoleum", motive: "rob" },
    tangerine: { weapon: "broom", location: "gift-shop", motive: "body" },
    cloud: { weapon: "skeleton-arm", location: "shack", motive: "affair" },
  },
  murderer: "grey",
  hints: [
    {
      text: 'Logico überlegte, was Irratino tun würde. Also überlegte er, was Irratino sagen würde, und das Erste, was ihm einfiel, war: "Wer eine Leiche stehlen wollte, hatte einen Besen."',
      book: true,
      marks: [{ a: "broom", b: "body", value: "check" }],
    },
    {
      text: "Der Geisterdetektor steckte im schmiedeeisernen Eingangstor. Und das Plüschskelett ist Mr. Skull aus dem Souvenirladen: Dort lag der Besen.",
      marks: [
        { a: "ghost-detector", b: "gate", value: "check" },
        { a: "broom", b: "gift-shop", value: "check" },
      ],
    },
    {
      text: "Kryptozoologe Cloud war in der seltsamen Hütte.",
      marks: [{ a: "cloud", b: "shack", value: "check" }],
    },
    {
      text: "Earl Grey wollte weder sehen, ob es geht, noch eine Affäre vertuschen - und eine Leiche stehlen wollte Mx. Tangerine. Also wollte Earl Grey das Opfer ausrauben. Und wer ausrauben wollte, schleppte den Kessel.",
      marks: [
        { a: "grey", b: "rob", value: "check" },
        { a: "cauldron", b: "rob", value: "check" },
      ],
    },
    {
      text: "Der Kessel war weder am Tor (Geisterdetektor) noch im Souvenirladen (Besen), und in der Hütte war Cloud. Earl Grey war also im Mausoleum - der Pyramide, in der die Leiche lag.",
      marks: [{ a: "grey", b: "mausoleum", value: "check" }],
    },
    {
      text: "In der Hütte lag damit der Skelettarm: Cloud hatte ihn und wollte eine Affäre vertuschen. Astrologin Azure hatte keinen Besen, also den Geisterdetektor am Tor - sie wollte sehen, ob es geht. Mx. Tangerine hatte den Besen im Souvenirladen.",
      marks: [
        { a: "cloud", b: "skeleton-arm", value: "check" },
        { a: "cloud", b: "affair", value: "check" },
        { a: "skeleton-arm", b: "shack", value: "check" },
        { a: "skeleton-arm", b: "affair", value: "check" },
        { a: "shack", b: "affair", value: "check" },
        { a: "azure", b: "ghost-detector", value: "check" },
        { a: "tangerine", b: "broom", value: "check" },
        { a: "tangerine", b: "gift-shop", value: "check" },
        { a: "azure", b: "gate", value: "check" },
        { a: "azure", b: "see", value: "check" },
        { a: "ghost-detector", b: "see", value: "check" },
        { a: "gate", b: "see", value: "check" },
        { a: "grey", b: "cauldron", value: "check" },
        { a: "cauldron", b: "mausoleum", value: "check" },
        { a: "mausoleum", b: "rob", value: "check" },
        { a: "tangerine", b: "body", value: "check" },
        { a: "gift-shop", b: "body", value: "check" },
      ],
    },
  ],
};
