/**
 * Case 47, "The Mystery of the Mysterious Island": a captain killed on the
 * island the ship crashed on.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. The jumbled
 * note reads "A Scorpio was in the dead woods"; here it is jumbled again in
 * German, letter by letter within each word. The solver found the only
 * solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_MYSTERY_OF_THE_MYSTERIOUS_ISLAND: Case = {
  id: "the-mystery-of-the-mysterious-island",
  number: 47,
  title: "Das Geheimnis der geheimnisvollen Insel",
  story:
    "Das Schiff war auf einer Insel voller Geheimnisse gestrandet: Warum brannte der Leuchtturm nicht? Wozu überhaupt einen Leuchtturm, wenn man ihn nicht anzündet? Wer hat da gerade geschrien? Und wer hat den Kapitän getötet?",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "tangerine",
      name: "Mx. Tangerine",
      icon: "\u{1F9E2}",
      description:
        "Der Beweis, dass auch nicht-binäre Menschen Mörder sein können: Matros:in, Köch:in und verdächtig.",
      heightCm: 165,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "pisces",
    },
    {
      id: "maroon",
      name: "Baron Maroon",
      icon: "\u{1F451}",
      description:
        "Ein unglaublich hochmütiger und nachtragender Mann. Niemand will den Baron kränken. Zumindest niemand, der noch lebt ...",
      heightCm: 188,
      hand: "right",
      eyes: "hazel",
      hair: "red",
      sign: "scorpio",
    },
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
  ],
  locations: [
    {
      id: "dead-woods",
      name: "der tote Wald",
      icon: "\u{1F940}",
      description:
        "Alle Bäume sind tot. Und trotzdem lebt etwas in diesem Wald.",
      indoors: false,
    },
    {
      id: "lighthouse",
      name: "der Leuchtturm auf der Klippe",
      icon: "\u{1F5FC}",
      description:
        "Sie fanden heraus, warum die Flamme nicht brannte: Der Leuchtturmwärter war schon lange tot.",
      indoors: true,
    },
    {
      id: "ruined-church",
      name: "die verfallene Kirche",
      icon: "⛪",
      description: "Das Dach ist eingestürzt, und die Kirche ist verdorben.",
      indoors: true,
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
      id: "blowfish",
      name: "ein verdorbener giftiger Kugelfisch",
      icon: "\u{1F421}",
      description:
        "Er ist jetzt verdorben, also sind sogar die ungiftigen Teile giftig.",
      weight: "medium",
    },
    {
      id: "shovel",
      name: "eine Schaufel",
      icon: "\u{1FA8F}",
      description:
        "Ein Mehrzweckwerkzeug: Töte jemanden und begrabe ihn mit derselben Schaufel!",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Die Waffe beim Leuchtturm auf der Klippe war nicht verrostet.",
      holds: (scene) =>
        scene.weaponOf(scene.at("lighthouse").id).id !== "sword",
    },
    {
      text: "Ein vertrauenswürdiger Informant gab Logico eine Nachricht mit zittriger Handschrift: NEI ROKPSNIO RAW MI TENTO DLWA.",
      holds: (scene) => scene.at("dead-woods").sign === "scorpio",
    },
  ],
  statements: [
    {
      by: "tangerine",
      text: "Also, wenn Sie mich fragen: Astrologin Azure hat eine Schaufel mitgebracht.",
      holds: (scene) => scene.weaponOf("azure").id === "shovel",
    },
    {
      by: "maroon",
      text: "Ein giftiger Kugelfisch war in der verfallenen Kirche.",
      holds: (scene) =>
        scene.locationOf(scene.holder("blowfish").id).id === "ruined-church",
    },
    {
      by: "azure",
      text: "Seht in die Sterne! Sie sagen, Mx. Tangerine hat einen giftigen Kugelfisch mitgebracht.",
      holds: (scene) => scene.weaponOf("tangerine").id === "blowfish",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    tangerine: { weapon: "blowfish", location: "lighthouse" },
    maroon: { weapon: "sword", location: "dead-woods" },
    azure: { weapon: "shovel", location: "ruined-church" },
  },
  murderer: "maroon",
  hints: [
    {
      text: 'Inspektor Irratino deutete ein Zeichen, das er in den Sternen gesehen hatte, und verkündete dann: "Astrologin Azure war neben einem eingestürzten Dach."',
      book: true,
    },
    {
      text: 'Die Nachricht, Wort für Wort entwürfelt: "EIN SKORPION WAR IM TOTEN WALD." Skorpion ist nur Baron Maroon: Er war im toten Wald.',
      marks: [{ a: "maroon", b: "dead-woods", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Mx. Tangerine, sagen Maroon und Azure die Wahrheit: Tangerine hatte den Kugelfisch in der Kirche. Azure wäre im Leuchtturm, ohne Schaufel - also mit dem verrosteten Schwert. Das geht nicht.",
      marks: [
        { a: "tangerine", b: "blowfish", value: "check" },
        { a: "azure", b: "ruined-church", value: "check" },
        { a: "azure", b: "shovel", value: "check" },
      ],
    },
    {
      text: "Also sagt Tangerine die Wahrheit: Astrologin Azure hatte die Schaufel.",
    },
    {
      text: "Lügt Azure, hatte Tangerine nicht den Kugelfisch, also das Schwert, und Maroon den Kugelfisch. Maroon sagt dann die Wahrheit: Der Kugelfisch war in der Kirche - aber Maroon war im toten Wald. Das geht nicht.",
      marks: [{ a: "maroon", b: "sword", value: "check" }],
    },
    {
      text: "Also lügt Baron Maroon - er ist der Mörder. Azure sagt die Wahrheit: Tangerine hatte den Kugelfisch, Maroon bleibt das alte Schwert.",
    },
    {
      text: "Der Kugelfisch war nicht in der Kirche, also war Tangerine im Leuchtturm und Azure in der Kirche. Baron Maroon tötete den Kapitän mit dem alten Schwert im toten Wald.",
      marks: [
        { a: "tangerine", b: "lighthouse", value: "check" },
        { a: "blowfish", b: "lighthouse", value: "check" },
        { a: "sword", b: "dead-woods", value: "check" },
        { a: "shovel", b: "ruined-church", value: "check" },
      ],
    },
  ],
};
