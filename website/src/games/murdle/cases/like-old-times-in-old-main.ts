/**
 * Case 65, "Like Old Times in Old Main": the assistant librarian, killed in
 * the archives of Deduction College.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The membership clue and the rule for the members only count
 * together, so both carry what they say together: Philosopher Bone did not
 * kill as a scientific experiment. The scrambled note reads "A Virgo had the
 * old computer"; here it is scrambled again in German, letter by letter
 * within each word. The solver found the only solution, and the hints are
 * our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const LIKE_OLD_TIMES_IN_OLD_MAIN: Case = {
  id: "like-old-times-in-old-main",
  number: 65,
  title: "Wie in alten Zeiten im Alten Hauptgebäude",
  story:
    "Rektorin Tuscany führte Deductive Logico ins Archiv im Alten Hauptgebäude. Leider stellte er dort fest, dass auch der Hilfsbibliothekar getötet worden war. Vielleicht ging es diesmal um ihn. So oder so musste er erst ermitteln, bevor er recherchieren konnte.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "glaucous",
      name: "Dekan Glaucous",
      icon: "\u{1F454}",
      description:
        "Dekan irgendeines Fachbereichs am Deduction College. Was er so macht? Nun, unter anderem verwaltet er das Geld ...",
      heightCm: 168,
      hand: "right",
      eyes: "lightBrown",
      hair: "lightBrown",
      sign: "virgo",
    },
    {
      id: "bone",
      name: "Philosoph Bone",
      icon: "\u{1F978}",
      description:
        "Ein schneidiger, düsterer Philosoph. Er hat die ethische Theorie begründet, dass er für seine Taten nicht verantwortlich ist, aber für sie bezahlt werden sollte.",
      heightCm: 155,
      hand: "right",
      eyes: "lightBrown",
      hair: "bald",
      sign: "taurus",
    },
    {
      id: "ivory",
      name: "Lektorin Ivory",
      icon: "\u{1F339}",
      description:
        "Die größte Liebesroman-Lektorin aller Zeiten. Sie hat das Genre Enemies to Lovers erfunden und als Erste einen nackten Mann auf ein Buchcover gebracht.",
      heightCm: 168,
      hand: "left",
      eyes: "lightBrown",
      hair: "gray",
      sign: "scorpio",
    },
    {
      id: "cloud",
      name: "Kryptozoologe Cloud",
      icon: "☁️",
      description:
        "Er kennt jede Sichtung von Bigfoot, Yeti und Sasquatch - und auch den Unterschied zwischen ihnen.",
      heightCm: 170,
      hand: "right",
      eyes: "gray",
      hair: "white",
      sign: "scorpio",
    },
  ],
  locations: [
    {
      id: "office",
      name: "das Büro der Rektorin",
      icon: "\u{1F5BC}️",
      description:
        "Hinter dem Schreibtisch der Rektorin hängt ein Gemälde von Rektorin Tuscany.",
      indoors: true,
    },
    {
      id: "roof",
      name: "das Dach",
      icon: "\u{1F3E2}",
      description:
        "Von hier aus überblickt man den ganzen Campus und sieht sogar das Arboretum!",
      indoors: false,
    },
    {
      id: "lounge",
      name: "das Lehrerzimmer",
      icon: "\u{1F34E}",
      description: "Jede Menge Äpfel. Wirklich viel, viel zu viele Äpfel.",
      indoors: true,
    },
    {
      id: "steps",
      name: "die Eingangstreppe",
      icon: "\u{1FA9C}",
      description:
        "Diese Steinstufen stehen für den endlosen Aufstieg des menschlichen Wissens. (Oder so.)",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "bust",
      name: "eine Marmorbüste",
      icon: "\u{1F5FF}",
      description:
        "Die Büste eines berühmten Gelehrten. Aber schlag ihn lieber nicht nach - was du findest, wird dir nicht gefallen.",
      weight: "heavy",
      material: "Marmor",
    },
    {
      id: "computer",
      name: "ein alter Computer",
      icon: "\u{1F5A5}️",
      description:
        "Ein Monitor, ein riesiger Tower, eine schwere Tastatur mit klappernden Tasten, eine Kugelmaus - eine echte Antiquität!",
      weight: "heavy",
      material: "Plastik und Technik",
    },
    {
      id: "laptop",
      name: "ein Laptop",
      icon: "\u{1F4BB}",
      description:
        "Die Maschine, an der du arbeitest. Sie ist mit jeder Ablenkung verbunden, die je erfunden wurde.",
      weight: "medium",
      material: "Metall und Technik",
    },
    {
      id: "book",
      name: "ein schweres Buch",
      icon: "\u{1F4D6}",
      description: "Ein Nachschlagewerk über Menhire.",
      weight: "heavy",
      material: "Papier",
    },
  ],
  motives: [
    { id: "politics", name: "aus politischen Gründen", icon: "\u{1F5F3}️" },
    { id: "could", name: "weil man es konnte", icon: "\u{1F3D4}️" },
    {
      id: "science",
      name: "als wissenschaftliches Experiment",
      icon: "\u{1F52C}",
    },
    { id: "lady", name: "eine Dame beeindrucken", icon: "♀️" },
  ],
  clues: [
    {
      text: "Eine Waffe aus Papier wurde nicht auf dem Dach gefunden.",
      holds: (scene) => scene.locationOf(scene.holder("book").id).id !== "roof",
    },
    {
      text: "Wer zu viel über Bigfoot wusste, wollte eine Dame beeindrucken.",
      holds: (scene) => scene.motiveOf("cloud")?.id === "lady",
    },
    {
      text: "Philosoph Bone war Mitglied im Pfad der uralten Toten.",
      // Only counts together with the rule for the members below.
      holds: (scene) => scene.motiveOf("bone")?.id !== "science",
    },
    {
      text: "Wer die Marmorbüste hatte, wollte aus politischen Gründen töten.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("bust").id)?.id === "politics",
    },
    {
      text: "Wer auf dem Dach war, hatte graue Haare.",
      holds: (scene) => scene.at("roof").hair === "gray",
    },
    {
      text: "Auf der Waffe, die zum Teil aus Metall ist, fand man die Fingerabdrücke einer rechten Hand.",
      holds: (scene) => scene.holder("laptop").hand === "right",
    },
    {
      text: "Ein Nachschlagewerk wurde draußen gefunden.",
      holds: (scene) => !scene.locationOf(scene.holder("book").id).indoors,
    },
    {
      text: "Mitglieder des Pfads der uralten Toten wollten nie wissenschaftliche Experimente durchführen.",
      holds: (scene) => scene.motiveOf("bone")?.id !== "science",
    },
    {
      text: "Ein Student drückte Logico eine verwürfelte Notiz in die Hand: NEIE FRUJANUG TETAH NDE TANEL PUTMOCER.",
      holds: (scene) => scene.holder("computer").sign === "virgo",
    },
    {
      text: "Wer töten würde, weil er es konnte, war im Lehrerzimmer.",
      holds: (scene) =>
        scene.locationOf(scene.driven("could").id).id === "lounge",
    },
  ],
  body: {
    text: "Die Leiche des Hilfsbibliothekars lag unter einem Gemälde der Rektorin.",
    location: "office",
  },
  exhibits: ["astrology"],
  solution: {
    glaucous: { weapon: "computer", location: "office", motive: "science" },
    bone: { weapon: "laptop", location: "lounge", motive: "could" },
    ivory: { weapon: "bust", location: "roof", motive: "politics" },
    cloud: { weapon: "book", location: "steps", motive: "lady" },
  },
  murderer: "glaucous",
  hints: [
    {
      text: "Logico erinnerte sich, wo er das Nachschlagewerk gesehen hatte: auf der Eingangstreppe. Er erinnerte sich auch daran, wie sehr er Irratino vermisste.",
      book: true,
    },
    {
      text: 'Die Notiz, Wort für Wort entwürfelt: "EINE JUNGFRAU HATTE DEN ALTEN COMPUTER." Jungfrau ist nur Dekan Glaucous.',
      marks: [{ a: "glaucous", b: "computer", value: "check" }],
    },
    {
      text: "Graue Haare hat nur Lektorin Ivory: Sie war auf dem Dach. Das Nachschlagewerk lag draußen, aber nicht auf dem Dach - also auf der Eingangstreppe.",
      marks: [{ a: "ivory", b: "roof", value: "check" }],
    },
    {
      text: "Ivorys Waffe: nicht das Buch (Treppe), nicht der Computer (Glaucous) und nicht der Laptop, denn sie ist Linkshänderin. Sie hatte die Marmorbüste und wollte aus politischen Gründen töten.",
      marks: [{ a: "bust", b: "politics", value: "check" }],
    },
    {
      text: "Cloud kennt sich mit Bigfoot aus: Er wollte eine Dame beeindrucken. Bone ist Mitglied im Pfad der uralten Toten, also kein Experiment - er tötete, weil er es konnte, und war im Lehrerzimmer. Glaucous bleibt das wissenschaftliche Experiment.",
      marks: [
        { a: "cloud", b: "lady", value: "check" },
        { a: "bone", b: "lounge", value: "check" },
        { a: "bone", b: "could", value: "check" },
        { a: "lounge", b: "could", value: "check" },
        { a: "glaucous", b: "science", value: "check" },
      ],
    },
    {
      text: "Bone war im Lehrerzimmer, also nicht mit dem Buch auf der Treppe: Er hatte den Laptop, Cloud das Buch auf der Eingangstreppe. Glaucous bleibt das Büro der Rektorin, unter ihrem Gemälde - er ist der Mörder.",
      marks: [
        { a: "bone", b: "laptop", value: "check" },
        { a: "cloud", b: "book", value: "check" },
        { a: "cloud", b: "steps", value: "check" },
        { a: "laptop", b: "lounge", value: "check" },
        { a: "book", b: "steps", value: "check" },
        { a: "glaucous", b: "office", value: "check" },
        { a: "computer", b: "office", value: "check" },
        { a: "computer", b: "science", value: "check" },
        { a: "office", b: "science", value: "check" },
        { a: "laptop", b: "could", value: "check" },
        { a: "ivory", b: "bust", value: "check" },
        { a: "ivory", b: "politics", value: "check" },
        { a: "bust", b: "roof", value: "check" },
        { a: "roof", b: "politics", value: "check" },
        { a: "book", b: "lady", value: "check" },
        { a: "steps", b: "lady", value: "check" },
      ],
    },
  ],
};
