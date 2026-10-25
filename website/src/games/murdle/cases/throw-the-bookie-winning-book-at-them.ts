/**
 * Case 18, "Throw the (Bookie-Winning) Book at Them!": the president of the
 * Bookington Society killed at the awards.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). Logico himself is a
 * suspect. The scrambled message reads "Silverton the Legend was suspicious
 * of the person who brought a heavy book"; here it is scrambled again in
 * German, letter by letter within each word. The sample prints neither hint
 * nor solution; the solver found the only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THROW_THE_BOOKIE_WINNING_BOOK_AT_THEM: Case = {
  id: "throw-the-bookie-winning-book-at-them",
  number: 18,
  title: "Wirf ihnen das (Bookie-gekrönte) Buch an den Kopf!",
  story:
    "In jenem Jahr wurde Deductive Logico bei der 138. Bookington-Preisverleihung für eine der renommiertesten Auszeichnungen nominiert: Bestes Debüt-Mordrätselbuch nach einer wahren Geschichte. Leider wurde gleich nach der Bekanntgabe des Gewinners der Präsident der Bookington-Gesellschaft getötet. Aber wer war's? Und wer hat den Bookie gewonnen?",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "bone",
      name: "Philosoph Bone",
      icon: "\u{1F978}",
      description:
        "Ein schneidiger, düsterer Philosoph, der die ethische Theorie begründet hat, dass er für seine Taten nicht verantwortlich ist - aber dafür bezahlt werden sollte.",
      heightCm: 155,
      hand: "right",
      eyes: "lightBrown",
      hair: "bald",
    },
    {
      id: "logico",
      name: "Deductive Logico",
      icon: "\u{1F575}\u{FE0F}",
      description:
        "Diesmal war er endlich beim eigentlichen Mord dabei - und das macht ihn zum Verdächtigen.",
      heightCm: 183,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
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
    },
  ],
  locations: [
    {
      id: "stage",
      name: "die Bühne",
      icon: "\u{1F3AD}",
      description:
        "Hier nimmt man seinen Preis am Rednerpult entgegen, unter dem ohrenbetäubenden Applaus Dutzender klatschender Hände.",
      indoors: true,
    },
    {
      id: "nominee-table",
      name: "ein Nominiertentisch",
      icon: "\u{1FA91}",
      description:
        "Mehrere Nominierte sitzen hier zusammen (der Dramatik wegen).",
      indoors: true,
    },
    {
      id: "backstage",
      name: "der Backstage-Bereich",
      icon: "\u{1F39B}\u{FE0F}",
      description:
        "Praktikanten und Assistenten kämpfen mit Seilen, Hebeln und Mischpulten.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "bookie",
      name: "ein Bookie",
      icon: "\u{1F3C6}",
      description:
        "Der Kosename des renommiertesten Preises der Verlagswelt. Das falsche Gold blättert schon ab.",
      weight: "medium",
    },
    {
      id: "heavy-book",
      name: "ein schweres Buch",
      icon: "\u{1F4D7}",
      description: "Gainsboros sechstausend Seiten starkes Buch über Erde.",
      weight: "heavy",
    },
    {
      id: "fountain-pen",
      name: "ein Füllfederhalter",
      icon: "\u{1F58B}\u{FE0F}",
      description:
        "Damit kann man Schecks unterschreiben oder Hälse erstechen. Leider kleckst er.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Philosoph Bone hasste die Person, die den Bookie gewonnen hatte.",
      holds: (scene) => scene.holder("bookie").id !== "bone",
    },
    {
      text: "Ein aufgeregter Fan drückte Deductive Logico einen Zettel in die Hand, auf den sie einen verwürfelten Hinweis gekritzelt hatte: EGDLEEN RETSIVOLN RSMEUATIST EDR PNRSEO MTI DME NEHSRCEW BCUH.",
      holds: (scene) => scene.holder("heavy-book").id !== "silverton",
    },
    {
      text: "Wer am Nominiertentisch saß, hatte eine mittelschwere Waffe.",
      holds: (scene) =>
        scene.weaponOf(scene.at("nominee-table").id).weight === "medium",
    },
    {
      text: "Entweder hatte Legende Silverton ein schweres Buch mitgebracht, oder Legende Silverton stand hinter einem Rednerpult.",
      holds: (scene) =>
        scene.weaponOf("silverton").id === "heavy-book" ||
        scene.locationOf("silverton").id === "stage",
    },
  ],
  body: {
    text: "Die Leiche des Opfers lag zusammengesunken über einem Mischpult.",
    location: "backstage",
  },
  solution: {
    bone: { weapon: "heavy-book", location: "backstage" },
    logico: { weapon: "bookie", location: "nominee-table" },
    silverton: { weapon: "fountain-pen", location: "stage" },
  },
  murderer: "bone",
  hints: [
    {
      text: 'Ein Sprecher machte eine Durchsage: "Ich habe soeben diese Nachricht erhalten: Wir sollen Ihnen ausrichten, dass die Buchstaben in den Wörtern dieser Notiz vertauscht sind und dass Legende Silverton einen Füllfederhalter mitgebracht hat. Eine seltsame Nachricht, aber so steht es hier."',
      book: true,
      marks: [{ a: "silverton", b: "fountain-pen", value: "check" }],
    },
    {
      text: 'Entwürfelt heißt die Nachricht: "LEGENDE SILVERTON MISSTRAUTE DER PERSON MIT DEM SCHWEREN BUCH". Silverton hatte das schwere Buch also nicht.',
      marks: [{ a: "silverton", b: "heavy-book", value: "cross" }],
    },
    {
      text: "Dann stand Legende Silverton hinter einem Rednerpult - und das steht auf der Bühne.",
      marks: [{ a: "silverton", b: "stage", value: "check" }],
    },
    {
      text: "Mittelschwer ist nur der Bookie: Wer am Nominiertentisch saß, hatte ihn. Silverton war auf der Bühne, Bone hatte den Bookie nicht - also saß Deductive Logico mit dem Bookie am Tisch.",
      marks: [
        { a: "bookie", b: "nominee-table", value: "check" },
        { a: "logico", b: "bookie", value: "check" },
      ],
    },
    {
      text: "Philosoph Bone bleibt der Backstage-Bereich. Silverton hatte nicht das schwere Buch, also den Füllfederhalter; Bone hatte das schwere Buch.",
      marks: [
        { a: "bone", b: "backstage", value: "check" },
        { a: "bone", b: "heavy-book", value: "check" },
      ],
    },
    {
      text: "Das Mischpult steht im Backstage-Bereich - dort war Philosoph Bone, mit dem schweren Buch.",
      marks: [
        { a: "heavy-book", b: "backstage", value: "check" },
        { a: "logico", b: "nominee-table", value: "check" },
        { a: "fountain-pen", b: "stage", value: "check" },
      ],
    },
  ],
};
