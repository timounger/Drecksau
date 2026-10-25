/**
 * Case 89, "The Post-Production Process": the assistant editor.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible). Motives and statements,
 * no body clue - the liar is the murderer. The German title keeps a double
 * meaning: a "Prozess" is a process and a trial. The book's hint comes first;
 * the other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_POST_PRODUCTION_PROCESS: Case = {
  id: "the-post-production-process",
  number: 89,
  title: "Der Postproduktionsprozess",
  story:
    "Logico war schockiert, als er feststellte, dass die Arbeit erst richtig anfing, nachdem der ganze Film abgedreht war. Sie mussten noch schneiden, vertonen, abmischen, die Farben korrigieren - und den Mord an der Schnittassistentin aufklären.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "abalone",
      name: "A-Promi Abalone",
      icon: "\u{1F31F}",
      description:
        "Wer auf der A-Liste steht, den hält ein gelegentlicher Mord nicht davon ab, einen Film fertigzustellen.",
      heightCm: 168,
      hand: "right",
      eyes: "hazel",
      hair: "red",
      sign: "libra",
    },
    {
      id: "lavender",
      name: "Lord Lavender",
      icon: "\u{1F3BC}",
      description:
        "Ein konservatives Mitglied des britischen Oberhauses und zugleich Musicalkomponist mit jeder Menge Hits - auch wenn keiner an Hunde heranreicht.",
      heightCm: 175,
      hand: "right",
      eyes: "green",
      hair: "gray",
      sign: "virgo",
    },
    {
      id: "dusty",
      name: "Regisseur Dusty",
      icon: "\u{1F3AC}",
      description:
        "Ein echter Filmemacher. Er will ein Meisterwerk schaffen. Dafür muss er vielleicht einen Mord begehen.",
      heightCm: 178,
      hand: "left",
      eyes: "hazel",
      hair: "bald",
      sign: "pisces",
    },
    {
      id: "pearl",
      name: "Pearl, AGE",
      icon: "\u{1F453}",
      description:
        "Die Cutterin einiger der besten und einiger der erfolgreichsten Filme aller Zeiten - nur nie beides zugleich.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "aquarius",
    },
  ],
  locations: [
    {
      id: "water-tower",
      name: "der Wasserturm",
      icon: "\u{1F5FC}",
      description: "Berühmt und leer, wie die Köpfe der Stars.",
      indoors: false,
    },
    {
      id: "scoring-stage",
      name: "die Filmmusikbühne",
      icon: "\u{1F3BB}",
      description:
        "Hier wird die Musik zu den Filmen aufgenommen. Meist sitzt hier ein Orchester oder ein DJ.",
      indoors: true,
    },
    {
      id: "post-lab",
      name: "das Postproduktionslabor",
      icon: "\u{1F39E}️",
      description:
        "Hier werden die Filme vor ihren unfähigen Regisseuren gerettet.",
      indoors: true,
    },
    {
      id: "bar-grill",
      name: "die Wasserturm Bar & Grill",
      icon: "\u{1F354}",
      description:
        "Ein Themenrestaurant, das Drinks in Gläsern in Form des Turms serviert.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "film",
      name: "ein Filmstreifen",
      icon: "\u{1F39E}️",
      description:
        "Ironischerweise zeigt dieser Filmstreifen einen Mann, der erdrosselt wird.",
      weight: "light",
      material: "Plastik",
    },
    {
      id: "blowfish",
      name: "ein giftiger Kugelfisch",
      icon: "\u{1F421}",
      description:
        "Sorgfältig zubereitet, kann man ihn gefahrlos essen. Noch sorgfältiger zubereitet, kann er töten.",
      weight: "medium",
      material: "Fisch",
    },
    {
      id: "golf-cart",
      name: "ein Golfwagen",
      icon: "\u{1F6FA}",
      description:
        "Um übers Studiogelände zu fahren. Oder um jemanden zu überfahren.",
      weight: "heavy",
      material: "Metall, Plastik und Gummi",
    },
    {
      id: "microphone",
      name: "ein Synchronmikrofon",
      icon: "\u{1F399}️",
      description:
        "Zum Nachsynchronisieren. Und um Leuten eins über den Schädel zu ziehen.",
      weight: "medium",
      material: "Metall",
    },
  ],
  motives: [
    { id: "face", name: "das Gesicht wahren", icon: "\u{1F642}" },
    { id: "political", name: "aus politischen Gründen", icon: "\u{1F5F3}️" },
    { id: "father", name: "den eigenen Vater rächen", icon: "\u{1F468}" },
    {
      id: "bad-movie",
      name: "aus einem schlechten Film rauskommen",
      icon: "\u{1F44E}",
    },
  ],
  clues: [
    {
      text: "Wer aus einem schlechten Film rauskommen wollte, war nicht in der Wasserturm Bar & Grill.",
      holds: (scene) =>
        scene.locationOf(scene.driven("bad-movie").id).id !== "bar-grill",
    },
    {
      text: "Wer einen Filmstreifen hatte, wollte den eigenen Vater rächen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("film").id)?.id === "father",
    },
    {
      text: "Der größte Verdächtige wurde im Postproduktionslabor gesehen.",
      holds: (scene) => scene.locationOf("dusty").id === "post-lab",
    },
    {
      text: "Wer einen giftigen Kugelfisch hatte, wollte das Gesicht wahren.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("blowfish").id)?.id === "face",
    },
    {
      text: "Lord Lavender hatte einen Golfwagen dabei.",
      holds: (scene) => scene.weaponOf("lavender").id === "golf-cart",
    },
  ],
  statements: [
    {
      by: "abalone",
      text: "Reden Sie mit meinem Agenten, aber unter uns: Ein Filmstreifen war im Wasserturm.",
      holds: (scene) =>
        scene.locationOf(scene.holder("film").id).id === "water-tower",
    },
    {
      by: "lavender",
      text: "Wer das Gesicht wahren wollte, war im Wasserturm.",
      holds: (scene) =>
        scene.locationOf(scene.driven("face").id).id === "water-tower",
    },
    {
      by: "dusty",
      text: "Ich habe zu tun, aber: Pearl, AGE, hatte ein Motiv, aus politischen Gründen zu töten.",
      holds: (scene) => scene.motiveOf("pearl")?.id === "political",
    },
    {
      by: "pearl",
      text: "Mir scheint aufgefallen zu sein, dass A-Promi Abalone einen Filmstreifen dabeihatte.",
      holds: (scene) => scene.weaponOf("abalone").id === "film",
    },
  ],
  solution: {
    abalone: { weapon: "film", location: "water-tower", motive: "father" },
    lavender: {
      weapon: "golf-cart",
      location: "scoring-stage",
      motive: "bad-movie",
    },
    dusty: { weapon: "blowfish", location: "post-lab", motive: "face" },
    pearl: { weapon: "microphone", location: "bar-grill", motive: "political" },
  },
  murderer: "lavender",
  hints: [
    {
      text: 'Logicos Hände zitterten, als er Irratino anrief, aber er landete auf der Mailbox. "Tut mir leid, ich bin gerade nicht am Telefon - aber falls hier Deductive Logico spricht: Das Marot sagt, ein Filmstreifen war im Wasserturm."',
      book: true,
    },
    {
      text: "Dusty ist der Größte und war im Postproduktionslabor. Lavender hat den Golfwagen - also weder Filmstreifen (Vater rächen) noch Kugelfisch (Gesicht wahren).",
      marks: [
        { a: "dusty", b: "post-lab", value: "check" },
        { a: "lavender", b: "golf-cart", value: "check" },
        { a: "film", b: "father", value: "check" },
        { a: "blowfish", b: "face", value: "check" },
      ],
    },
    {
      text: "Abalone und Lavender können nicht beide recht haben: Dann wären Filmstreifen und Gesichtwahren im Wasserturm, also bei derselben Person - der Filmstreifen gehört aber zum Rächen. Einer der beiden lügt, also sagen Dusty und Pearl die Wahrheit.",
      marks: [{ a: "abalone", b: "film", value: "check" }],
    },
    {
      text: "Pearl will aus politischen Gründen töten, Abalone hat den Filmstreifen und will ihren Vater rächen. Lavender bleibt nur: aus dem schlechten Film rauskommen. Den Kugelfisch (Gesicht wahren) hat nicht Pearl, sondern Dusty; Pearl hat das Synchronmikrofon.",
      marks: [
        { a: "abalone", b: "father", value: "check" },
        { a: "pearl", b: "political", value: "check" },
        { a: "lavender", b: "bad-movie", value: "check" },
        { a: "dusty", b: "blowfish", value: "check" },
        { a: "dusty", b: "face", value: "check" },
        { a: "pearl", b: "microphone", value: "check" },
      ],
    },
    {
      text: "Wer das Gesicht wahren will, ist Dusty im Labor, nicht im Wasserturm: Lord Lavender lügt - er ist der Mörder. Abalone sagt die Wahrheit und war mit dem Filmstreifen im Wasserturm. Lavender will aus dem Film raus und war nicht in der Bar & Grill, sondern auf der Filmmusikbühne. Pearl war in der Bar & Grill.",
      marks: [
        { a: "lavender", b: "scoring-stage", value: "check" },
        { a: "scoring-stage", b: "bad-movie", value: "check" },
        { a: "pearl", b: "bar-grill", value: "check" },
        { a: "abalone", b: "water-tower", value: "check" },
        { a: "film", b: "water-tower", value: "check" },
        { a: "water-tower", b: "father", value: "check" },
        { a: "golf-cart", b: "scoring-stage", value: "check" },
        { a: "golf-cart", b: "bad-movie", value: "check" },
        { a: "blowfish", b: "post-lab", value: "check" },
        { a: "post-lab", b: "face", value: "check" },
        { a: "microphone", b: "bar-grill", value: "check" },
        { a: "microphone", b: "political", value: "check" },
        { a: "bar-grill", b: "political", value: "check" },
      ],
    },
  ],
};
