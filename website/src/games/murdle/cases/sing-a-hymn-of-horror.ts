/**
 * Case 57, "Sing a Hymn of Horror": a parishioner, killed in Father Mango's
 * chapel while he claimed sanctuary there.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The gunpowder is the flintlock's, the church fliers lie in the
 * vestibule. The photographed pages print neither hint nor solution; the
 * solver found the only one, and the hints are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const SING_A_HYMN_OF_HORROR: Case = {
  id: "sing-a-hymn-of-horror",
  number: 57,
  title: "Ein Choral des Grauens",
  story:
    "Pater Mango beanspruchte Kirchenasyl in seiner Kapelle und schloss die Türen. Doch fast sofort wurde ein Gemeindemitglied ermordet. Da öffnete er die Türen wieder und sagte, Logico solle herausfinden, wer es war - damit er den anderen Mörder hinauswerfen könne.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "mango",
      name: "Pater Mango",
      icon: "✝️",
      description:
        "Er hat ein Armutsgelübde abgelegt, fährt aber BMW. Er hat Gehorsam gelobt, hat aber fünfundzwanzig Angestellte. Geschworen, nicht zu morden, hat er allerdings nicht - und gemordet hat er auch.",
      heightCm: 178,
      hand: "left",
      eyes: "darkBrown",
      hair: "bald",
      sign: "taurus",
    },
    {
      id: "azure",
      name: "Bischöfin Azure",
      icon: "⛪",
      description:
        "Eine Bischöfin der Kirche. Man weiß, dass sie für ihre Freunde und für ihre Feinde betet. Natürlich bittet sie dabei um verschiedene Dinge ...",
      heightCm: 163,
      hand: "right",
      eyes: "lightBrown",
      hair: "darkBrown",
      sign: "gemini",
    },
    {
      id: "verdigris",
      name: "Diakonin Verdigris",
      icon: "👓",
      description:
        "Eine Diakonin der Kirche. Sie verwaltet die Spenden der Gemeinde und manchmal auch deren Geheimnisse.",
      heightCm: 160,
      hand: "left",
      eyes: "blue",
      hair: "gray",
      sign: "leo",
    },
    {
      id: "brownstone",
      name: "Bruder Brownstone",
      icon: "📿",
      description:
        "Ein Mönch, der sein Leben der Kirche gewidmet hat - genauer gesagt dem Geldverdienen für sie.",
      heightCm: 163,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "capricorn",
    },
  ],
  locations: [
    {
      id: "choir-loft",
      name: "die Chorempore",
      icon: "🎶",
      description:
        "Gerade singt dort niemand, es ist still. Aber während der Gottesdienste sollte man die Orgel hören!",
      indoors: true,
    },
    {
      id: "steps",
      name: "die Eingangstreppe",
      icon: "🪜",
      description:
        "Ziemlich mühsam, sie hinauf- und hinunterzusteigen, aber sie trägt zur Atmosphäre bei.",
      indoors: false,
    },
    {
      id: "graveyard",
      name: "der Friedhof",
      icon: "🪦",
      description:
        "Ein kleiner Friedhof neben der Kirche. Die meisten Gräber sind alt, aber eines ist vielleicht neuer ...",
      indoors: false,
    },
    {
      id: "vestibule",
      name: "der Vorraum",
      icon: "🚪",
      description:
        "Ein Eingangsraum mit vielen Türen und einem Tisch voller Flugblätter für Gemeindeveranstaltungen.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "flintlock",
      name: "eine antike Steinschlosspistole",
      icon: "🔫",
      description:
        "Sie schießt eine Kugel ganze 1,20 Meter weit und bedeckt dich mit Schießpulver.",
      weight: "medium",
      material: "Holz und Metall",
    },
    {
      id: "wine",
      name: "eine Flasche Wein",
      icon: "🍷",
      description: "Vorsicht vor Flecken, denn das Rot geht nicht mehr raus.",
      weight: "medium",
      material: "Glas",
    },
    {
      id: "relic",
      name: "eine heilige Reliquie",
      icon: "🦴",
      description:
        "Das Abbild eines liebenden Gottes mit einem wunderschönen Antlitz.",
      weight: "medium",
      material: "Knochen",
    },
    {
      id: "yarn",
      name: "Wolle",
      icon: "🧶",
      description:
        "Wenn man merkt, dass man eine Masche verloren hat, könnte man manchmal einfach jemanden erwürgen.",
      weight: "light",
      material: "Wolle",
    },
  ],
  motives: [
    {
      id: "parents",
      name: "weil man wie die eigenen Eltern wurde",
      icon: "👪",
    },
    { id: "ghost", name: "ein Geist hat es befohlen", icon: "👻" },
    { id: "practice", name: "zur Übung", icon: "🎯" },
    { id: "religion", name: "aus religiösen Gründen", icon: "🙏" },
  ],
  clues: [
    {
      text: "Wer eine Flasche Wein hatte, war Linkshänder.",
      holds: (scene) => scene.holder("wine").hand === "left",
    },
    {
      text: "Auf den Flugblättern der Gemeinde wurde Schießpulver gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("flintlock").id).id === "vestibule",
    },
    {
      text: "Wer aus religiösen Gründen töten wollte, war nicht auf dem Friedhof.",
      holds: (scene) =>
        scene.locationOf(scene.driven("religion").id).id !== "graveyard",
    },
    {
      text: "Pater Mango war draußen, als der Mord geschah.",
      holds: (scene) => !scene.locationOf("mango").indoors,
    },
    {
      text: "Eine Waffe aus Knochen hatte die Person mitgebracht, die zur Übung töten wollte.",
      holds: (scene) =>
        scene.weaponOf(scene.driven("practice").id).material === "Knochen",
    },
    {
      text: "Ein Zwilling stand auf der Eingangstreppe.",
      holds: (scene) => scene.at("steps").sign === "gemini",
    },
    {
      text: "Wer töten würde, weil er wie die eigenen Eltern wurde, hatte blaue Augen. (Genau wie die Eltern!)",
      holds: (scene) => scene.driven("parents").eyes === "blue",
    },
    {
      text: "Die verdächtige Person, die genauso groß ist wie Bischöfin Azure, wurde mit Wolle gesehen.",
      holds: (scene: Scene): boolean => {
        const holder = scene.holder("yarn");
        return (
          holder.id !== "azure" &&
          holder.heightCm === scene.suspect("azure").heightCm
        );
      },
    },
  ],
  body: {
    text: "Die Leiche des Gemeindemitglieds wurde auf der Chorempore gefunden.",
    location: "choir-loft",
  },
  solution: {
    mango: { weapon: "wine", location: "graveyard", motive: "ghost" },
    azure: { weapon: "relic", location: "steps", motive: "practice" },
    verdigris: {
      weapon: "flintlock",
      location: "vestibule",
      motive: "parents",
    },
    brownstone: { weapon: "yarn", location: "choir-loft", motive: "religion" },
  },
  murderer: "brownstone",
  hints: [
    {
      text: "Logico versuchte, Irratinos Anleitung zur Astralprojektion zu befolgen, vergaß aber einen entscheidenden Schritt. Statt nach Belieben durch die Astralebene zu reisen, steckte er im Vorraum der Kirche fest. Immerhin bemerkte er dort Schmauchspuren!",
      book: true,
    },
    {
      text: "Der einzige Zwilling ist Bischöfin Azure: Sie stand auf der Eingangstreppe. Genauso groß wie sie (1,63 m) ist Bruder Brownstone - er hatte die Wolle. Blaue Augen hat nur Diakonin Verdigris: Sie wurde wie ihre Eltern.",
      marks: [
        { a: "azure", b: "steps", value: "check" },
        { a: "brownstone", b: "yarn", value: "check" },
        { a: "verdigris", b: "parents", value: "check" },
      ],
    },
    {
      text: "Pater Mango war draußen, und die Treppe ist besetzt: Er war auf dem Friedhof. Das Schießpulver auf den Flugblättern verrät die Pistole im Vorraum. Mango war auf dem Friedhof, Brownstone hatte die Wolle, Azure stand auf der Treppe: Verdigris hatte die Pistole im Vorraum.",
      marks: [
        { a: "mango", b: "graveyard", value: "check" },
        { a: "verdigris", b: "vestibule", value: "check" },
      ],
    },
    {
      text: "Für Brownstone bleibt die Chorempore, wo die Leiche lag.",
      marks: [{ a: "brownstone", b: "choir-loft", value: "check" }],
    },
    {
      text: "Den Wein hatte ein Linkshänder - Azure ist Rechtshänderin, also hatte Mango den Wein und Azure die Reliquie aus Knochen. Wer die Knochenwaffe hatte, tötete zur Übung: Azure.",
      marks: [
        { a: "mango", b: "wine", value: "check" },
        { a: "azure", b: "relic", value: "check" },
        { a: "azure", b: "practice", value: "check" },
      ],
    },
    {
      text: "Wer aus religiösen Gründen töten wollte, war nicht auf dem Friedhof, also nicht Mango: Brownstone tötete aus religiösen Gründen, Mango hat es ein Geist befohlen. Bruder Brownstone war es, mit der Wolle, auf der Chorempore, aus religiösen Gründen.",
      marks: [
        { a: "mango", b: "ghost", value: "check" },
        { a: "brownstone", b: "religion", value: "check" },
        { a: "graveyard", b: "ghost", value: "check" },
        { a: "yarn", b: "choir-loft", value: "check" },
        { a: "yarn", b: "religion", value: "check" },
        { a: "choir-loft", b: "religion", value: "check" },
        { a: "wine", b: "graveyard", value: "check" },
        { a: "wine", b: "ghost", value: "check" },
        { a: "relic", b: "steps", value: "check" },
        { a: "relic", b: "practice", value: "check" },
        { a: "steps", b: "practice", value: "check" },
        { a: "verdigris", b: "flintlock", value: "check" },
        { a: "flintlock", b: "vestibule", value: "check" },
        { a: "flintlock", b: "parents", value: "check" },
        { a: "vestibule", b: "parents", value: "check" },
      ],
    },
  ],
};
