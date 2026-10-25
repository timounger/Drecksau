/**
 * Case 78, "Plenty of Kills in the Sea": the sushi chef of a restaurant on a
 * pier.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from photos of the
 * book. Motives and statements, no body clue - the liar is the murderer. The
 * two scrambled notes read "The suspect at the bar had silver hair" and
 * "Secretary Celadon did not want to kill out of frustration"; here they are
 * scrambled again in German, letter by letter within each word. The hints are
 * our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const PLENTY_OF_KILLS_IN_THE_SEA: Case = {
  id: "plenty-of-kills-in-the-sea",
  number: 78,
  title: "Es gibt noch viele Morde im Meer",
  story:
    "Logicos nächstes Treffen fand in einem Sushi-Restaurant am Strand statt, das auf einen Pier gebaut war. Etwas roch nach Fisch, und außerdem war etwas faul. Bald fand er heraus, was: Der Sushikoch war ermordet worden.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "charcoal",
      name: "Boss Charcoal",
      icon: "\u{1F9D4}",
      description:
        "Ein Mafiaboss aus der guten alten Zeit, als ein Mafiaboss aus der guten alten Zeit noch etwas bedeutete.",
      heightCm: 180,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "taurus",
    },
    {
      id: "celadon",
      name: "Ministerin Celadon",
      icon: "\u{1FA96}",
      description:
        "Die Verteidigungsministerin - und persönlich verantwortlich für eine Reihe von Klimakatastrophen, von denen einige inzwischen nach ihr benannt sind.",
      heightCm: 168,
      hand: "left",
      eyes: "green",
      hair: "lightBrown",
      sign: "leo",
    },
    {
      id: "rose",
      name: "Großmeister Rose",
      icon: "♟️",
      description:
        "Ein Schachgroßmeister, der immer schon seinen nächsten Zug plant. Zum Beispiel, wie er in seiner nächsten Partie schummelt. (3. Dxe5#)",
      heightCm: 170,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "scorpio",
    },
    {
      id: "silverton",
      name: "Legende Silverton",
      icon: "\u{1F31F}",
      description:
        "Ein gefeierter Schauspieler des Goldenen Zeitalters, inzwischen in seinen goldenen Jahren.",
      heightCm: 193,
      hand: "right",
      eyes: "blue",
      hair: "silver",
      sign: "leo",
    },
  ],
  locations: [
    {
      id: "bar",
      name: "die Bar",
      icon: "\u{1F379}",
      description:
        "Der billigste Cocktail kostet 150 Dollar und wird in einem Fingerhut serviert.",
      indoors: true,
    },
    {
      id: "valet",
      name: "der Parkservice",
      icon: "\u{1F697}",
      description:
        "Hier lässt man seinen Oldtimer bei einem Kerl, dem man nicht einmal Trinkgeld gibt.",
      indoors: false,
    },
    {
      id: "booth",
      name: "die Eckloge",
      icon: "\u{1F6CB}️",
      description:
        "Immer reserviert für einen Promi, der vor drei Jahren ein einziges Mal da war.",
      indoors: true,
    },
    {
      id: "dumpster",
      name: "ein Tisch neben dem Müllcontainer",
      icon: "\u{1F5D1}️",
      description: "Hier setzen sie die Has-Beens und die Laufkundschaft hin.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "award",
      name: "ein Filmpreis",
      icon: "\u{1F3C6}",
      description: "Wieder derselbe angesehene Preis.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "herring",
      name: "ein Red Herring",
      icon: "\u{1F41F}",
      description:
        "Wenn man ihn am Schwanz packt, bekommt man richtig Schwung dahinter.",
      weight: "medium",
      material: "Fisch",
    },
    {
      id: "plate",
      name: "ein edler Teller",
      icon: "\u{1F37D}️",
      description: "Dieser Teller ist mehr wert als dein Kopf.",
      weight: "medium",
      material: "Keramik",
    },
    {
      id: "chopsticks",
      name: "Essstäbchen",
      icon: "\u{1F962}",
      description: "Zwei Waffen zum Preis von einer.",
      weight: "light",
      material: "Holz",
    },
  ],
  motives: [
    { id: "diversion", name: "für ein Ablenkungsmanöver", icon: "\u{1F449}" },
    { id: "frustration", name: "aus Frust", icon: "\u{1F620}" },
    { id: "inherit", name: "ein Vermögen erben", icon: "\u{1F4B0}" },
    { id: "tough", name: "beweisen, wie hart man ist", icon: "\u{1F4AA}" },
  ],
  clues: [
    {
      text: "Der Barkeeper gab Logico einen verwürfelten Zettel: REW NA EDR ABR RAW HTETA RSNSEIBEL AAHR.",
      holds: (scene) => scene.at("bar").hair === "silver",
    },
    {
      text: "Wo sie die Has-Beens hinsetzen, wurde ein Filmpreis gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("award").id).id === "dumpster",
    },
    {
      text: "Als Mafiaboss der alten Schule wollte Boss Charcoal immer beweisen, wie hart er ist.",
      holds: (scene) => scene.motiveOf("charcoal")?.id === "tough",
    },
    {
      text: "Wer beim Parkservice war, hatte dunkelbraunes Haar.",
      holds: (scene) => scene.at("valet").hair === "darkBrown",
    },
    {
      text: "Logico wurde ein verwürfelter Regierungsbericht zugesteckt: MNIRITSENI EACDNOL WOLETL IHCNT ASU SFRUT ONERMD.",
      holds: (scene) => scene.motiveOf("celadon")?.id !== "frustration",
    },
    {
      text: "Der Stier hatte einen Red Herring dabei. Typisch Stier.",
      holds: (scene) => scene.holder("herring").sign === "taurus",
    },
    {
      text: "Wer eine Waffe hatte, die mehr wert ist als dein Kopf, wollte ein Vermögen erben.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("plate").id)?.id === "inherit",
    },
  ],
  statements: [
    {
      by: "charcoal",
      text: "Schau her: Die Essstäbchen waren beim Parkservice.",
      holds: (scene) =>
        scene.locationOf(scene.holder("chopsticks").id).id === "valet",
    },
    {
      by: "celadon",
      text: "Ich war nicht in der Eckloge.",
      holds: (scene) => scene.locationOf("celadon").id !== "booth",
    },
    {
      by: "rose",
      text: "Vernachlässigen Sie Ihre Theorie nicht: Ministerin Celadon hatte einen Filmpreis dabei.",
      holds: (scene) => scene.weaponOf("celadon").id === "award",
    },
    {
      by: "silverton",
      text: "Boss Charcoal hatte keinen edlen Teller dabei.",
      holds: (scene) => scene.weaponOf("charcoal").id !== "plate",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    charcoal: { weapon: "herring", location: "booth", motive: "tough" },
    celadon: { weapon: "award", location: "dumpster", motive: "diversion" },
    rose: { weapon: "plate", location: "valet", motive: "inherit" },
    silverton: {
      weapon: "chopsticks",
      location: "bar",
      motive: "frustration",
    },
  },
  murderer: "charcoal",
  hints: [
    {
      text: '"Ich habe mir die Sterne über uns angesehen, Logico. Und sie sagen mir, dass der Schachspieler in der Nähe eines Oldtimers war." Vielleicht sollte ich nicht ständig anrufen, dachte Logico, aber es war schwer, der Versuchung zu widerstehen.',
      book: true,
    },
    {
      text: 'Die Zettel, Wort für Wort entwürfelt: "WER AN DER BAR WAR HATTE SILBERNES HAAR" - also Legende Silverton - und "MINISTERIN CELADON WOLLTE NICHT AUS FRUST MORDEN".',
      marks: [
        { a: "silverton", b: "bar", value: "check" },
        { a: "silverton", b: "frustration", value: "check" },
        { a: "bar", b: "frustration", value: "check" },
      ],
    },
    {
      text: "Dunkelbraunes Haar hat nur Großmeister Rose: Er war beim Parkservice. Der einzige Stier ist Boss Charcoal - er hat den Red Herring. Silverton sagt also die Wahrheit.",
      marks: [
        { a: "rose", b: "valet", value: "check" },
        { a: "charcoal", b: "herring", value: "check" },
      ],
    },
    {
      text: "Charcoal und Celadon teilen sich die Eckloge und den Tisch am Müllcontainer, wo der Filmpreis lag. Lügt Celadon, säße Charcoal am Müllcontainer mit dem Preis - er hat aber den Red Herring. Also stimmt Celadons Aussage: Sie sitzt am Müllcontainer mit dem Filmpreis, Charcoal in der Eckloge.",
      marks: [
        { a: "charcoal", b: "booth", value: "check" },
        { a: "celadon", b: "award", value: "check" },
        { a: "celadon", b: "dumpster", value: "check" },
        { a: "award", b: "dumpster", value: "check" },
      ],
    },
    {
      text: "Damit stimmt auch Roses Aussage. Celadon, Rose und Silverton sagen die Wahrheit - also lügt Boss Charcoal: Die Essstäbchen waren nicht beim Parkservice. Rose hat den Teller und will erben, Silverton die Essstäbchen.",
      marks: [
        { a: "silverton", b: "chopsticks", value: "check" },
        { a: "rose", b: "plate", value: "check" },
      ],
    },
    {
      text: "Charcoal will beweisen, wie hart er ist; Celadon nicht aus Frust, also für ein Ablenkungsmanöver, und Silverton aus Frust. Boss Charcoal war es mit dem Red Herring in der Eckloge, um zu beweisen, wie hart er ist.",
      marks: [
        { a: "charcoal", b: "tough", value: "check" },
        { a: "celadon", b: "diversion", value: "check" },
        { a: "herring", b: "booth", value: "check" },
        { a: "herring", b: "tough", value: "check" },
        { a: "booth", b: "tough", value: "check" },
        { a: "award", b: "diversion", value: "check" },
        { a: "dumpster", b: "diversion", value: "check" },
        { a: "rose", b: "inherit", value: "check" },
        { a: "plate", b: "valet", value: "check" },
        { a: "plate", b: "inherit", value: "check" },
        { a: "valet", b: "inherit", value: "check" },
        { a: "chopsticks", b: "bar", value: "check" },
        { a: "chopsticks", b: "frustration", value: "check" },
      ],
    },
  ],
};
