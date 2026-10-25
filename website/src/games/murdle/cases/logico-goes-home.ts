/**
 * Case 37, "Logico Goes Home": an uncle killed in Logico's home town.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. The solver
 * found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const LOGICO_GOES_HOME: Case = {
  id: "logico-goes-home",
  number: 37,
  title: "Logico kehrt heim",
  story:
    "Deductive Logico bekam einen Anruf von seiner Tante: Ein Onkel war gestorben, und sie mussten herausfinden, wie sie die ganzen Beerdigungskosten bezahlen sollten. Außerdem musste jemand seinen Mord aufklären. Also fuhr Deductive Logico zum ersten Mal seit Jahren nach Hause. Zum Glück kam Irratino auch mit.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
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
      sign: "taurus",
    },
    {
      id: "honey",
      name: "Bürgermeister Honey",
      icon: "\u{1F3A9}",
      description:
        "Das ist nicht derselbe Bürgermeister wie in Logicos erstem Fall: Das ist sein völlig unschuldiger eineiiger Zwilling.",
      heightCm: 183,
      hand: "left",
      eyes: "hazel",
      hair: "lightBrown",
      sign: "scorpio",
    },
    {
      id: "copper",
      name: "Polizistin Copper",
      icon: "\u{1F46E}‍♀️",
      description:
        "Das Beste daran, als Polizistin kriminell zu sein: Man spart sich den Mittelsmann und ermittelt gleich selbst nicht gegen die eigenen Verbrechen.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "aries",
    },
  ],
  locations: [
    {
      id: "chain-restaurant",
      name: "ein Kettenrestaurant",
      icon: "\u{1F354}",
      description:
        "Es hat aufgemacht, als sich das Familienlokal die Hypothek nicht mehr leisten konnte. Es gibt eine frittierte Zwiebel.",
      indoors: true,
    },
    {
      id: "secondhand-shop",
      name: "ein Secondhandladen",
      icon: "\u{1F455}",
      description:
        "Das meiste hier sieht aus wie aus dritter Hand, sogar die Motten.",
      indoors: true,
    },
    {
      id: "car-lot",
      name: "ein Gebrauchtwagenhändler",
      icon: "\u{1F697}",
      description:
        "Der Verkäufer sagt, die Autos explodieren nicht und werden verkauft wie gesehen.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "sword",
      name: "ein altes Schwert",
      icon: "\u{1F5E1}️",
      description:
        "Damit kämpften die Bösen in irgendeinem alten Krieg. Es ist völlig verrostet.",
      weight: "heavy",
    },
    {
      id: "axe",
      name: "eine Axt",
      icon: "\u{1FA93}",
      description: "Nicht ohne Grund ein Klassiker im Krimi.",
      weight: "medium",
    },
    {
      id: "magnifier",
      name: "eine Lupe",
      icon: "\u{1F50D}",
      description:
        "Damit kann man Hinweise finden oder richtig kleines Kleingedrucktes lesen.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Die verdächtige Person mit der Lupe wurde dabei gesehen, wie sie damit ihre Glatze untersuchte.",
      holds: (scene) => scene.holder("magnifier").hair === "bald",
    },
    {
      text: "Polizistin Copper hat nie einen Fuß in ein Kettenrestaurant gesetzt: Dort bekam sie keinen Rabatt.",
      holds: (scene) => scene.locationOf("copper").id !== "chain-restaurant",
    },
  ],
  statements: [
    {
      by: "mango",
      text: "Bürgermeister Honey hat keine Axt mitgebracht.",
      holds: (scene) => scene.weaponOf("honey").id !== "axe",
    },
    {
      by: "honey",
      text: "Ein altes Schwert war in einem Kettenrestaurant.",
      holds: (scene) =>
        scene.locationOf(scene.holder("sword").id).id === "chain-restaurant",
    },
    {
      by: "copper",
      text: "Ein altes Schwert war nicht beim Gebrauchtwagenhändler.",
      holds: (scene) =>
        scene.locationOf(scene.holder("sword").id).id !== "car-lot",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    mango: { weapon: "magnifier", location: "chain-restaurant" },
    honey: { weapon: "sword", location: "secondhand-shop" },
    copper: { weapon: "axe", location: "car-lot" },
  },
  murderer: "honey",
  hints: [
    {
      text: 'Inspektor Irratino warf Runen, schlug ihre Bedeutung in einem Buch nach, fand seine eigene Deutung dann doch schöner und verkündete: "Bürgermeister Honey hat ein altes Schwert mitgebracht."',
      book: true,
      marks: [{ a: "honey", b: "sword", value: "check" }],
    },
    {
      text: "Eine Glatze hat nur Pater Mango: Er hatte die Lupe.",
      marks: [{ a: "mango", b: "magnifier", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Pater Mango, hatte Bürgermeister Honey die Axt und Polizistin Copper das Schwert. Dann sagt Honey die Wahrheit: Das Schwert war im Kettenrestaurant - aber dort war Copper nie. Das geht nicht.",
      marks: [{ a: "copper", b: "axe", value: "check" }],
    },
    {
      text: "Also sagt Pater Mango die Wahrheit: Honey hatte das Schwert, Copper die Axt.",
    },
    {
      text: "Lügt Polizistin Copper, war das Schwert beim Gebrauchtwagenhändler. Honey sagt dann aber die Wahrheit, und das Schwert wäre im Kettenrestaurant. Das geht nicht.",
      marks: [{ a: "copper", b: "car-lot", value: "check" }],
    },
    {
      text: "Also lügt Bürgermeister Honey - er ist der Mörder. Copper sagt die Wahrheit: Honey war nicht beim Gebrauchtwagenhändler und, weil er lügt, auch nicht im Kettenrestaurant - er war im Secondhandladen.",
      marks: [{ a: "honey", b: "secondhand-shop", value: "check" }],
    },
    {
      text: "Copper war nicht im Kettenrestaurant, also beim Gebrauchtwagenhändler. Pater Mango war mit der Lupe im Kettenrestaurant. Honey tötete den Onkel mit dem alten Schwert im Secondhandladen.",
      marks: [
        { a: "mango", b: "chain-restaurant", value: "check" },
        { a: "magnifier", b: "chain-restaurant", value: "check" },
        { a: "sword", b: "secondhand-shop", value: "check" },
        { a: "axe", b: "car-lot", value: "check" },
      ],
    },
  ],
};
