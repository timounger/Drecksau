/**
 * Case 2, "And Then There Was Another One": an old man killed on a secluded
 * island.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). The book prints its hint
 * and its solution. One clue needs Exhibit A: the magnifying glass is made with
 * crystal from Emerald Industries.
 */
import type { Case } from "../engine/types";

/** The case. */
export const AND_THEN_THERE_WAS_ANOTHER_ONE: Case = {
  id: "and-then-there-was-another-one",
  number: 2,
  title: "Und dann war da noch einer",
  story:
    "Deductive Logico war begeistert, als er hörte, dass auf einer abgelegenen Insel ein alter Mann getötet worden war. Natürlich war das schlimm - aber Logico wollte schon immer einen dieser Inselmorde lösen, und das war seine große Chance.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "emerald",
      name: "Signor Emerald",
      icon: "\u{1F48E}",
      description:
        "Ein berühmter italienischer Juwelier. Signor Emerald hat die ganze Welt nach seltenen Edelsteinen bereist, die ihm ständig aus den Taschen fallen.",
      heightCm: 173,
      hand: "left",
      eyes: "lightBrown",
      hair: "black",
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
    {
      id: "saffron",
      name: "Miss Saffron",
      icon: "\u{1F380}",
      description:
        "Hinreißend und charmant, aber vielleicht nicht die Hellste. Oder sie will, dass du das denkst. Oder sie will, dass du denkst, dass sie will, dass du das denkst.",
      heightCm: 157,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
    },
  ],
  locations: [
    {
      id: "cliffs",
      name: "die Klippen",
      icon: "\u{1F3D4}️",
      description:
        "Ein tiefer Sturz - aber vielleicht fangen die zackigen Felsen dich ja auf.",
      indoors: false,
    },
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "\u{1F5FF}",
      description:
        "Ein paar alte Steinsäulen mit seltsamen eingemeißelten Zeichen.",
      indoors: false,
    },
    {
      id: "docks",
      name: "das Dock",
      icon: "⚓",
      description:
        "Alte, morsche Stege, die schon bessere Tage gesehen haben. Vorsicht, Haie!",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "bear-trap",
      name: "eine Bärenfalle",
      icon: "\u{1FAA4}",
      description:
        "Wer das zu grausam für einen Menschen findet, sollte mal an die Bären denken!",
      weight: "heavy",
    },
    {
      id: "brick",
      name: "ein gewöhnlicher Ziegelstein",
      icon: "\u{1F9F1}",
      description:
        "Einfach ein ganz normaler, gewöhnlicher Ziegelstein. Nichts Besonderes. Nur ein Ziegelstein.",
      weight: "medium",
    },
    {
      id: "harpoon",
      name: "eine Harpune",
      icon: "\u{1F531}",
      description:
        "Damit könnte man einen Fisch töten. Oder, ehrlich gesagt, so ziemlich alles.",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Wer einen gewöhnlichen Ziegelstein mitgebracht hatte, gehörte zu Pater Mangos Gemeinde.",
      holds: (scene) => scene.holder("brick").id !== "mango",
    },
    {
      text: "Miss Saffron hatte eine Bärenfalle in der Handtasche.",
      holds: (scene) => scene.weaponOf("saffron").id === "bear-trap",
    },
    {
      text: "Die Person, deren Familienunternehmen Logicos Lupe hergestellt hat, war auf den Klippen. (Siehe Beweisstück A.)",
      holds: (scene) => scene.locationOf("emerald").id === "cliffs",
    },
    {
      text: "Die alten Ruinen schienen die haselnussbraunen Augen der Person, die daneben stand, zu hypnotisieren.",
      holds: (scene) => scene.at("ruins").eyes === "hazel",
    },
  ],
  body: {
    text: "Als Logico eintraf, hatten Haie bereits an der Leiche des alten Mannes geknabbert.",
    location: "docks",
  },
  exhibits: ["detectiveKit"],
  solution: {
    emerald: { weapon: "brick", location: "cliffs" },
    mango: { weapon: "harpoon", location: "docks" },
    saffron: { weapon: "bear-trap", location: "ruins" },
  },
  murderer: "mango",
  hints: [
    {
      text: 'Logico fand eine Flaschenpost. Darin lag ein Brief, an ihn adressiert! Er lautete: "Logico, die Sterne sind eindeutig: Ein ausgerissenes Büschel Bärenfell lag bei den alten Ruinen."',
      book: true,
    },
    {
      text: "Miss Saffron hatte die Bärenfalle.",
      marks: [{ a: "saffron", b: "bear-trap", value: "check" }],
    },
    {
      text: "Die Lupe ist aus Kristall von Emerald Industries (Beweisstück A): Signor Emerald war auf den Klippen.",
      marks: [{ a: "emerald", b: "cliffs", value: "check" }],
    },
    {
      text: "Haselnussbraune Augen hat nur Miss Saffron - sie stand bei den Ruinen. Für Pater Mango bleibt das Dock.",
      marks: [
        { a: "saffron", b: "ruins", value: "check" },
        { a: "mango", b: "docks", value: "check" },
      ],
    },
    {
      text: "Wer den Ziegelstein hatte, gehört zu Pater Mangos Gemeinde - war also nicht Mango selbst. Signor Emerald hatte den Ziegelstein, Pater Mango die Harpune.",
      marks: [
        { a: "mango", b: "brick", value: "cross" },
        { a: "emerald", b: "brick", value: "check" },
        { a: "mango", b: "harpoon", value: "check" },
      ],
    },
    {
      text: "Haie gibt es am Dock. Dort war Pater Mango, mit der Harpune.",
      marks: [
        { a: "brick", b: "cliffs", value: "check" },
        { a: "harpoon", b: "docks", value: "check" },
        { a: "bear-trap", b: "ruins", value: "check" },
      ],
    },
  ],
  outro:
    'Erst stritt Pater Mango alles ab. Dann fluchte er. Dann verfluchte er Logico. Schließlich gab er sich geschlagen: "Wie konntest du das einem so heiligen Mann Gottes antun?"',
};
