/**
 * Case 22, "They Bill You for Dying": a lawyer dead in his own law firm.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). The note in the Next
 * Letter Code (each letter stands for the one after it) reads "The suspect in
 * the associate's office had green eyes"; here it is encoded again in German.
 * The bold clue names the weapon; the murderer is whoever had it. The photographed pages print neither hint nor solution; the solver
 * found the only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THEY_BILL_YOU_FOR_DYING: Case = {
  id: "they-bill-you-for-dying",
  number: 22,
  title: "Abgerechnet wird zum Schluss",
  story:
    "Dame Obsidian hatte die teuerste Kanzlei der Welt beauftragt, Blackstone & Blackstone, und einer der beiden (Blackstone) bestellte Logico zur Vernehmung in sein Büro. Leider war Blackstone bei Logicos Ankunft unpässlich (sprich: tot).",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "obsidian",
      name: "Dame Obsidian",
      icon: "\u{1F452}",
      description:
        "Dame Obsidian hatte eine Armee von Anwälten. Daher stammt die Idee zu ihrem Buch Die Armee meiner Anwälte.",
      heightCm: 163,
      hand: "left",
      eyes: "green",
      hair: "black",
    },
    {
      id: "mauve",
      name: "Vizepräsidentin Mauve",
      icon: "\u{1F97D}",
      description:
        "Eine Vizepräsidentin von TekCo Futures. Wenn sie dich bittet, ihr Metaversum zu betreten: Geh schnell weg.",
      heightCm: 173,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
    },
    {
      id: "blackstone",
      name: "Blackstone, Esq.",
      icon: "\u{1F935}",
      description:
        "Der andere. Unglaublich begabt in der wichtigsten Fähigkeit eines Anwalts: sich bezahlen zu lassen.",
      heightCm: 183,
      hand: "right",
      eyes: "black",
      hair: "black",
    },
  ],
  locations: [
    {
      id: "lobby",
      name: "die Lobby",
      icon: "⛲",
      description:
        "Mit einem riesigen Springbrunnen, einem Empfangstresen aus Marmor und einer Empfangsdame, die jederzeit die Polizei rufen kann.",
      indoors: true,
    },
    {
      id: "associate-office",
      name: "das Büro eines Junioranwalts",
      icon: "\u{1F5C4}️",
      description:
        "Winzig, eng, vollgestopft, vielleicht ein Wandschrank. Besetzt von jemandem, der zu viel für zu wenig arbeitet.",
      indoors: true,
    },
    {
      id: "partner-office",
      name: "das Büro eines Partners",
      icon: "\u{1F5BC}️",
      description:
        "Mit Fotos des Partners mit jedem lebenden US-Präsidenten, sogar mit den ganz schlechten.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "bust",
      name: "eine Marmorbüste",
      icon: "\u{1F5FF}",
      description:
        "Die Büste eines berühmten Anwalts. Aber schlag ihn lieber nicht nach - was du findest, wird dir nicht gefallen.",
      weight: "heavy",
    },
    {
      id: "contracts",
      name: "verwirrende Verträge",
      icon: "\u{1F4C4}",
      description:
        "Juristendeutsch, so undurchdringlich, dass man davon ein Aneurysma bekommen kann.",
      weight: "light",
    },
    {
      id: "inkwell",
      name: "ein vergiftetes Tintenfass",
      icon: "\u{1F58B}️",
      description:
        "Wie er vergiftet wurde? Tja. Das steht schwarz auf weiß fest.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Anwälte machen sich oft Notizen im Nächster-Buchstabe-Code. Logico fand eine davon: CHD ODQRNM HL ATDQN CDR ITMHNQZMVZKSR GZSSD FQTDMD ZTFDM.",
      holds: (scene) => scene.at("associate-office").eyes === "green",
    },
    {
      text: "Die Person mit einem Metaversum war nie im Büro des Partners gewesen.",
      holds: (scene) => scene.locationOf("mauve").id !== "partner-office",
    },
    {
      text: "Die größte Person war in die Person verknallt, die ein vergiftetes Tintenfass mitgebracht hatte.",
      holds: (scene) => scene.holder("inkwell").id !== "blackstone",
    },
    {
      text: "Wer die verwirrenden Verträge hatte, war linkshändig.",
      holds: (scene) => scene.holder("contracts").hand === "left",
    },
  ],
  body: {
    text: "Neben dem Opfer fand man die Büste einer ... umstrittenen Persönlichkeit.",
    weapon: "bust",
  },
  solution: {
    obsidian: { weapon: "contracts", location: "associate-office" },
    mauve: { weapon: "inkwell", location: "lobby" },
    blackstone: { weapon: "bust", location: "partner-office" },
  },
  murderer: "blackstone",
  hints: [
    {
      text: 'Logico bekam eine SMS von einer unbekannten Nummer: "Unser Kristallmann sagt, die Marmorbüste war im Büro eines Partners - darauf wette ich zehn Millionen Dollar!" So war es. Zum Glück hatte Logico nicht gewettet.',
      book: true,
      marks: [{ a: "bust", b: "partner-office", value: "check" }],
    },
    {
      text: "Im Nächster-Buchstabe-Code steht jeder Buchstabe für den nächsten im Alphabet: C wird D, H wird I und so weiter. Die Notiz lautet: DIE PERSON IM BUERO DES JUNIORANWALTS HATTE GRUENE AUGEN. Grüne Augen hat nur Dame Obsidian.",
    },
    {
      text: "Das Metaversum gehört Vizepräsidentin Mauve. Sie war nie im Büro des Partners, also war sie in der Lobby, und Blackstone war im Büro des Partners.",
      marks: [{ a: "blackstone", b: "partner-office", value: "check" }],
    },
    {
      text: "Linkshändig ist nur Dame Obsidian: Sie hatte die verwirrenden Verträge. Der Größte, Blackstone, hatte nicht das Tintenfass, sondern die Marmorbüste. Mauve bleibt das vergiftete Tintenfass.",
      marks: [
        { a: "obsidian", b: "contracts", value: "check" },
        { a: "blackstone", b: "bust", value: "check" },
        { a: "mauve", b: "inkwell", value: "check" },
      ],
    },
    {
      text: "Neben der Leiche lag die Büste: Blackstone, Esq. erschlug seinen Kollegen damit im Büro des Partners.",
      marks: [
        { a: "obsidian", b: "associate-office", value: "check" },
        { a: "contracts", b: "associate-office", value: "check" },
        { a: "mauve", b: "lobby", value: "check" },
        { a: "inkwell", b: "lobby", value: "check" },
      ],
    },
  ],
};
