/**
 * Case 87, "The Water Tower Bar & Kill": a bartender at the Water Tower Bar &
 * Grill.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible). Motives and statements,
 * no body clue - the liar is the murderer. The title's pun (Grill / Kill)
 * becomes Grill / Grab in German. The book's hint comes first; the other
 * hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_WATER_TOWER_BAR_AND_KILL: Case = {
  id: "the-water-tower-bar-and-kill",
  number: 87,
  title: "Wasserturm Bar & Grab",
  story:
    "Deductive Logico hatte Hunger bekommen und ging in die Wasserturm Bar & Grill, um eine Kleinigkeit zu essen. Das Essen war schlecht. Aber während er dort war, geschah ein Mord, also hatte er wenigstens etwas zu tun. Ein Barkeeper war getötet worden.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "marengo",
      name: "Statistin Marengo",
      icon: "\u{1F464}",
      description:
        "An sie wirst du dich nie erinnern - deshalb ist sie eine gute Statistin und eine großartige Mörderin.",
      heightCm: 165,
      hand: "left",
      eyes: "lightBrown",
      hair: "darkBrown",
      sign: "gemini",
    },
    {
      id: "midnight",
      name: "Midnight III",
      icon: "\u{1F576}️",
      description:
        "Besessen davon, Drehorte für Murdle: Der Film zu finden - so, glaubt er, bringt er Midnight Movies wieder an die Spitze.",
      heightCm: 173,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "libra",
    },
    {
      id: "dusty",
      name: "Regisseur Dusty",
      icon: "\u{1F3AC}",
      description:
        "Ein echter Filmemacher. Ihm geht es nur darum, seinen Film zu drehen. Koste es, was es wolle.",
      heightCm: 178,
      hand: "left",
      eyes: "hazel",
      hair: "bald",
      sign: "pisces",
    },
    {
      id: "argyle",
      name: "Agent Argyle",
      icon: "\u{1F454}",
      description:
        "Anders als Agent Ink hat Argyle kein Herz aus Gold. Eigentlich überhaupt kein Herz.",
      heightCm: 193,
      hand: "right",
      eyes: "lightBrown",
      hair: "darkBrown",
      sign: "virgo",
    },
  ],
  locations: [
    {
      id: "bar",
      name: "die Bar",
      icon: "\u{1F379}",
      description: "Die Drinks werden mit echtem Wasserturm-Wasser verdünnt.",
      indoors: true,
    },
    {
      id: "back-porch",
      name: "die hintere Veranda",
      icon: "⛱️",
      description:
        "Mit tollem Blick auf den Wasserturm und auf alle Promis, die vielleicht vorbeikommen.",
      indoors: false,
    },
    {
      id: "grill",
      name: "der Grill",
      icon: "\u{1F356}",
      description:
        "Die Steaks werden bei Zimmertemperatur gegrillt, um Geld zu sparen.",
      indoors: true,
    },
    {
      id: "bathrooms",
      name: "die Toiletten",
      icon: "\u{1F6BD}",
      description: "Mit dem echten Wasser aus dem Wasserturm.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "fork",
      name: "eine Gabel",
      icon: "\u{1F374}",
      description: "Viel grausiger als ein Messer, wenn man darüber nachdenkt.",
      weight: "light",
      material: "Metall",
    },
    {
      id: "wine",
      name: "eine Flasche Wein",
      icon: "\u{1F377}",
      description: "Vorsicht vor Flecken - Rotwein geht nicht mehr raus.",
      weight: "medium",
      material: "Glas und Alkohol",
    },
    {
      id: "dvd",
      name: "eine DVD-Box",
      icon: "\u{1F4C0}",
      description: "Eine luxuriöse Box, gedacht als Erbstück.",
      weight: "medium",
      material: "Holz",
    },
    {
      id: "rose",
      name: "eine künstliche Rose",
      icon: "\u{1F339}",
      description:
        "Der Plastikstiel ist stabil genug, um jemanden zu erdrosseln.",
      weight: "light",
      material: "Plastik",
    },
  ],
  motives: [
    {
      id: "bad-movie",
      name: "aus einem schlechten Film rauskommen",
      icon: "\u{1F44E}",
    },
    { id: "award", name: "einen Preis gewinnen", icon: "\u{1F3C6}" },
    { id: "hollywood", name: "Hollywood übernehmen", icon: "\u{1F3AC}" },
    { id: "industry", name: "in die Branche einsteigen", icon: "\u{1F513}" },
  ],
  clues: [
    {
      text: "Die Metallwaffe spiegelte die hellbraunen Augen der Person, die sie hatte.",
      holds: (scene) => scene.holder("fork").eyes === "lightBrown",
    },
    {
      text: "Wer aus einem schlechten Film rauskommen wollte, grübelte darüber mit Blick auf den Wasserturm.",
      holds: (scene) =>
        scene.locationOf(scene.driven("bad-movie").id).id === "back-porch",
    },
    {
      text: "Wer die Flasche Wein hatte, wollte nicht in die Branche einsteigen. Diese Person hatte stattdessen Wein!",
      holds: (scene) =>
        scene.motiveOf(scene.holder("wine").id)?.id !== "industry",
    },
    {
      text: "Wer einen Preis gewinnen wollte, war rechtshändig.",
      holds: (scene) => scene.driven("award").hand === "right",
    },
    {
      text: "Regisseur Dusty wurde bei den Toiletten herumlungernd gesehen.",
      holds: (scene) => scene.locationOf("dusty").id === "bathrooms",
    },
    {
      text: "Ein Blütenblatt einer künstlichen Rose lag neben einem verdünnten Cocktail. Es sah sehr filmreif aus.",
      holds: (scene) => scene.locationOf(scene.holder("rose").id).id === "bar",
    },
    {
      text: "Midnight III hatte eine DVD-Box dabei. (Zur Recherche? Oder für einen Mord?)",
      holds: (scene) => scene.weaponOf("midnight").id === "dvd",
    },
  ],
  statements: [
    {
      by: "marengo",
      text: "Ooh! Ich hatte eine Gabel dabei.",
      holds: (scene) => scene.weaponOf("marengo").id === "fork",
    },
    {
      by: "midnight",
      text: "Also, eine Flasche Wein war nicht auf der hinteren Veranda.",
      holds: (scene) =>
        scene.locationOf(scene.holder("wine").id).id !== "back-porch",
    },
    {
      by: "dusty",
      text: "Agent Argyle war auch nicht auf der hinteren Veranda.",
      holds: (scene) => scene.locationOf("argyle").id !== "back-porch",
    },
    {
      by: "argyle",
      text: "Midnight III war nicht in der Bar.",
      holds: (scene) => scene.locationOf("midnight").id !== "bar",
    },
  ],
  solution: {
    marengo: { weapon: "rose", location: "bar", motive: "industry" },
    midnight: { weapon: "dvd", location: "back-porch", motive: "bad-movie" },
    dusty: { weapon: "wine", location: "bathrooms", motive: "hollywood" },
    argyle: { weapon: "fork", location: "grill", motive: "award" },
  },
  murderer: "marengo",
  hints: [
    {
      text: "Inspektor Irratino befragte ein Zeichen, das er in den Sternen gesehen hatte, und schickte Deductive Logico seine Erklärung per Direktnachricht: Statistin Marengo war neben einem verdünnten Cocktail.",
      book: true,
    },
    {
      text: "Agent Argyle ist der einzige Rechtshänder: Er will den Preis. Midnight III hat die DVD-Box. Dusty war bei den Toiletten, die Rose aber in der Bar - Dusty hat also nicht die Rose, und die Gabel auch nicht (er hat haselnussbraune Augen). Dusty hat den Wein. Marengo und Argyle teilen sich Gabel und Rose.",
      marks: [
        { a: "argyle", b: "award", value: "check" },
        { a: "midnight", b: "dvd", value: "check" },
        { a: "dusty", b: "bathrooms", value: "check" },
        { a: "rose", b: "bar", value: "check" },
        { a: "dusty", b: "wine", value: "check" },
        { a: "marengo", b: "rose", value: "check" },
        { a: "argyle", b: "fork", value: "check" },
      ],
    },
    {
      text: "Probiere: Hat Marengo die Gabel, hat Argyle die Rose in der Bar. Dann stimmen alle vier Aussagen - Marengos Gabel, Midnight III (der Wein ist bei Dusty auf den Toiletten), Dusty (Argyle will den Preis, auf der Veranda ist aber, wer aus dem Film raus will) und Argyle (in der Bar ist er selbst). Ohne Lügner geht es nicht: Argyle hat die Gabel, Marengo die Rose.",
      marks: [
        { a: "marengo", b: "bar", value: "check" },
        { a: "midnight", b: "back-porch", value: "check" },
        { a: "midnight", b: "bad-movie", value: "check" },
        { a: "fork", b: "award", value: "check" },
        { a: "wine", b: "bathrooms", value: "check" },
        { a: "back-porch", b: "bad-movie", value: "check" },
      ],
    },
    {
      text: "Statistin Marengo lügt also - sie ist die Mörderin, mit der künstlichen Rose in der Bar. Argyle will den Preis, nicht aus dem Film raus, also war er nicht auf der Veranda, sondern am Grill. Midnight III war auf der Veranda und wollte aus dem schlechten Film raus.",
      marks: [
        { a: "argyle", b: "grill", value: "check" },
        { a: "grill", b: "award", value: "check" },
      ],
    },
    {
      text: "Dusty hat den Wein und will deshalb nicht in die Branche einsteigen: Er will Hollywood übernehmen. Marengo wollte in die Branche einsteigen.",
      marks: [
        { a: "dusty", b: "hollywood", value: "check" },
        { a: "wine", b: "hollywood", value: "check" },
        { a: "marengo", b: "industry", value: "check" },
        { a: "rose", b: "industry", value: "check" },
        { a: "bar", b: "industry", value: "check" },
        { a: "dvd", b: "back-porch", value: "check" },
        { a: "dvd", b: "bad-movie", value: "check" },
        { a: "bathrooms", b: "hollywood", value: "check" },
        { a: "fork", b: "grill", value: "check" },
      ],
    },
  ],
};
