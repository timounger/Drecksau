/**
 * Case 77, "Logico Goes to a Hollywood Party": a producer who was not a good
 * host, because he was dead.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from photos of the
 * book. Motives and statements, no body clue - the liar is the murderer. The
 * scrambled note reads "The person with a rare vase wanted to finish their
 * movie"; here it is scrambled again in German, letter by letter within each
 * word. The "Ancient Song of Pitch" admits only Sagittarians, so its member
 * is Uncle Midnight - both clues carry that predicate. The hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const LOGICO_GOES_TO_A_HOLLYWOOD_PARTY: Case = {
  id: "logico-goes-to-a-hollywood-party",
  number: 77,
  title: "Logico geht auf eine Hollywood-Party",
  story:
    "Logicos erstes Treffen fand nicht in einer Produktionsfirma in Hollywood statt, sondern im Haus eines Produzenten in den Hollywood Hills. Der Produzent war kein guter Gastgeber, aber dafür konnte er nichts: Er war tot.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "midnight3",
      name: "Midnight III",
      icon: "\u{1F576}️",
      description:
        "Der Erbe von Midnight Movies, der das Studio wieder zum besten der Welt machen will. Im Moment darf er nur die Nominierten für den Filmpreis auswählen.",
      heightCm: 173,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "libra",
    },
    {
      id: "argyle",
      name: "Agent Argyle",
      icon: "\u{1F454}",
      description:
        "Anders als Agentin Ink hat Argyle kein Herz aus Gold. Oder überhaupt ein Herz.",
      heightCm: 193,
      hand: "right",
      eyes: "lightBrown",
      hair: "darkBrown",
      sign: "virgo",
    },
    {
      id: "steel",
      name: "Chefproduzentin Steel",
      icon: "\u{1F4BC}",
      description:
        "Die reichste, klügste und gemeinste Produzentin Hollywoods. Vorerst.",
      heightCm: 168,
      hand: "right",
      eyes: "gray",
      hair: "white",
      sign: "aries",
    },
    {
      id: "uncle",
      name: "Onkel Midnight",
      icon: "\u{1F973}",
      description:
        "Als sein Vater starb, kaufte er sich eine Wüstenvilla mit Pool und setzte sich zur Ruhe. Er war siebzehn.",
      heightCm: 173,
      hand: "left",
      eyes: "blue",
      hair: "darkBrown",
      sign: "sagittarius",
    },
  ],
  locations: [
    {
      id: "bar",
      name: "die Kellerbar",
      icon: "\u{1F378}",
      description:
        "Mit voll bestückter Bar, einem Flipperautomaten und einem ganzen Haufen Umzugskartons.",
      indoors: true,
    },
    {
      id: "balcony",
      name: "der Dachbalkon",
      icon: "\u{1F304}",
      description:
        "Hier kann man über die Hollywood Hills blicken und sich ach so selbstgefällig und mächtig fühlen.",
      indoors: false,
    },
    {
      id: "hall",
      name: "die große Halle",
      icon: "\u{1F5FF}",
      description:
        "Eine gewaltige Wendeltreppe windet sich um eine riesige Statue des Produzenten selbst.",
      indoors: true,
    },
    {
      id: "pool",
      name: "der Pool im Innenhof",
      icon: "\u{1F3CA}",
      description:
        "Ein perfekter Pool, um mit einem Drink herumzustehen und mit Namen um sich zu werfen.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "vase",
      name: "eine seltene Vase",
      icon: "\u{1F3FA}",
      description:
        "Keramikkunst aus einer uralten Hollywood-Epoche - den 1930ern.",
      weight: "heavy",
      material: "Keramik",
    },
    {
      id: "wire",
      name: "eine Klaviersaite",
      icon: "\u{1F3B9}",
      description:
        "Irgendwo da draußen fehlt einem Klavier eine Saite, und gleich ist ein Konzert ruiniert.",
      weight: "light",
      material: "Metall",
    },
    {
      id: "typewriter",
      name: "eine antike Schreibmaschine",
      icon: "⌨️",
      description: "Aus den 1970ern - in Hollywood ist das die frühe Neuzeit.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "screenplay",
      name: "ein riesiges Drehbuch",
      icon: "\u{1F4D1}",
      description:
        "Es bereitet ein Franchise vor, hat also fünfzig Extraseiten langweiliger Exposition.",
      weight: "heavy",
      material: "Papier",
    },
  ],
  motives: [
    { id: "finish", name: "den eigenen Film fertigstellen", icon: "\u{1F50C}" },
    { id: "party", name: "eine Party aufmischen", icon: "\u{1FAA9}" },
    { id: "deal", name: "ein Geschäft abschließen", icon: "\u{1F91D}" },
    { id: "cash", name: "für kaltes, hartes Bargeld", icon: "\u{1F4B0}" },
  ],
  clues: [
    {
      text: "Wer ein Geschäft abschließen wollte, war nicht auf dem Dachbalkon.",
      holds: (scene) =>
        scene.locationOf(scene.driven("deal").id).id !== "balcony",
    },
    {
      text: "Ein Mitglied des Uralten Gesangs der Tonhöhe war mit einem riesigen Drehbuch in der Kellerbar - und wollte außerdem die Party aufmischen.",
      holds: (scene) =>
        scene.at("bar").sign === "sagittarius" &&
        scene.weaponOf(scene.at("bar").id).id === "screenplay" &&
        scene.motiveOf(scene.at("bar").id)?.id === "party",
    },
    {
      text: "Jemand, der etwas zu viel getrunken hatte, gab Logico einen verwürfelten Zettel: EID SENROP MTI EDR ESELNTNE VESA OLLETW HINRE ILMF ETTNEFGLLEIRS.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("vase").id)?.id === "finish",
    },
    {
      text: "Nur ein Schütze konnte dem Uralten Gesang der Tonhöhe beitreten.",
      holds: (scene) => scene.at("bar").sign === "sagittarius",
    },
    {
      text: "An einer Waffe aus der frühen Neuzeit wurde ein dunkelbraunes Haar gefunden.",
      holds: (scene) => scene.holder("typewriter").hair === "darkBrown",
    },
    {
      text: "Wer am Pool im Innenhof war, war Linkshänder.",
      holds: (scene) => scene.at("pool").hand === "left",
    },
  ],
  statements: [
    {
      by: "midnight3",
      text: "Lassen Sie mich einspringen: Agent Argyle hatte eine antike Schreibmaschine dabei.",
      holds: (scene) => scene.weaponOf("argyle").id === "typewriter",
    },
    {
      by: "argyle",
      text: "Die Sache ist die: Eine antike Schreibmaschine war auf dem Dachbalkon.",
      holds: (scene) =>
        scene.locationOf(scene.holder("typewriter").id).id === "balcony",
    },
    {
      by: "steel",
      text: "Hören Sie, eine seltene Vase war in der großen Halle.",
      holds: (scene) => scene.locationOf(scene.holder("vase").id).id === "hall",
    },
    {
      by: "uncle",
      text: "Na hör mal, Midnight III war am Pool im Innenhof.",
      holds: (scene) => scene.locationOf("midnight3").id === "pool",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    midnight3: { weapon: "vase", location: "pool", motive: "finish" },
    argyle: { weapon: "typewriter", location: "balcony", motive: "cash" },
    steel: { weapon: "wire", location: "hall", motive: "deal" },
    uncle: { weapon: "screenplay", location: "bar", motive: "party" },
  },
  murderer: "steel",
  hints: [
    {
      text: 'Logico wählte Irratinos Nummer, und Irratino nahm beim ersten Klingeln ab: "Steel hatte die Klaviersaite!"',
      book: true,
      marks: [{ a: "steel", b: "wire", value: "check" }],
    },
    {
      text: "Der einzige Schütze ist Onkel Midnight - er ist das Mitglied des Uralten Gesangs: Kellerbar, riesiges Drehbuch, Party aufmischen.",
      marks: [
        { a: "uncle", b: "screenplay", value: "check" },
        { a: "uncle", b: "bar", value: "check" },
        { a: "uncle", b: "party", value: "check" },
        { a: "screenplay", b: "bar", value: "check" },
        { a: "screenplay", b: "party", value: "check" },
        { a: "bar", b: "party", value: "check" },
      ],
    },
    {
      text: "Wer am Pool war, ist Linkshänder: Midnight III oder Onkel Midnight. Der Onkel ist in der Bar, also war Midnight III am Pool. Damit sagt Onkel Midnight die Wahrheit.",
      marks: [{ a: "midnight3", b: "pool", value: "check" }],
    },
    {
      text: 'Der Zettel, Wort für Wort entwürfelt: "DIE PERSON MIT DER SELTENEN VASE WOLLTE IHREN FILM FERTIGSTELLEN." Die Schreibmaschine (frühe Neuzeit) hatte jemand mit dunkelbraunem Haar - also nicht Steel.',
      marks: [{ a: "vase", b: "finish", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Midnight III, hat Argyle die Schreibmaschine nicht; Steel auch nicht, also Midnight III selbst - laut Argyle wäre sie aber auf dem Dachbalkon, und Midnight III ist am Pool. Geht nicht.",
      marks: [
        { a: "argyle", b: "typewriter", value: "check" },
        { a: "argyle", b: "balcony", value: "check" },
        { a: "typewriter", b: "balcony", value: "check" },
      ],
    },
    {
      text: "Lügt Argyle, hat er laut Midnight III die Schreibmaschine, aber nicht auf dem Balkon - also ist er in der großen Halle. Laut Steel liegt dort die Vase. Geht nicht.",
    },
    {
      text: "Also lügt Chefproduzentin Steel: Argyle hat die Schreibmaschine auf dem Dachbalkon, Steel ist in der großen Halle ohne Vase, also mit der Klaviersaite. Midnight III hat die Vase und will seinen Film fertigstellen.",
      marks: [
        { a: "steel", b: "hall", value: "check" },
        { a: "wire", b: "hall", value: "check" },
        { a: "midnight3", b: "vase", value: "check" },
        { a: "midnight3", b: "finish", value: "check" },
      ],
    },
    {
      text: "Wer ein Geschäft abschließen will, war nicht auf dem Balkon - also Steel; Argyle will Bargeld. Steel war es mit der Klaviersaite in der großen Halle, um ein Geschäft abzuschließen.",
      marks: [
        { a: "argyle", b: "cash", value: "check" },
        { a: "steel", b: "deal", value: "check" },
        { a: "wire", b: "deal", value: "check" },
        { a: "hall", b: "deal", value: "check" },
        { a: "vase", b: "pool", value: "check" },
        { a: "pool", b: "finish", value: "check" },
        { a: "typewriter", b: "cash", value: "check" },
        { a: "balcony", b: "cash", value: "check" },
      ],
    },
  ],
};
