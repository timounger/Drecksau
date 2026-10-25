/**
 * Case 95, "A Free Press Can Cost a Killing": the assistant editor of a
 * Hollywood trade paper.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from the photos of the
 * book. Motives and statements, no body clue - the liar is the murderer.
 * The author of the book about dirt (Gainsboro) is not one of the Anointed
 * Ones, and one of them was on the rooftop; both clues carry that one
 * predicate. The scrambled note reads "The suspect with a printer wanted to
 * stop the revolution"; here it is scrambled again in German, letter by
 * letter within each word. The first hint is the book's; the solver's only
 * solution is the one the book prints, and the other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const A_FREE_PRESS_CAN_COST_A_KILLING: Case = {
  id: "a-free-press-can-cost-a-killing",
  number: 95,
  title: "Die freie Presse kostet ein Mordsgeld",
  story:
    'Deductive Logico schmuggelte Inspektor Irratino aus dem Hausarrest nach Hollywood. Sie feierten in Logicos Wohnung und gingen dann zu einem Hollywood-Branchenblatt, einer Zeitung für die Industrie. "Midnight Movies steckt hinter einer weltweiten Verschwörung!" Als Erstes sagte die Chefredakteurin, sie bräuchten Beweise. Als Zweites, dass ihr Redaktionsassistent gerade getötet worden war.',
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "ivory",
      name: "Lektorin Ivory",
      icon: "\u{1F339}",
      description:
        "Wie sich zeigt, schadet es den Berufsaussichten im Liebesroman-Genre, eine Mörderin zu sein. Den Berufsaussichten bei einem Hollywood-Branchenblatt schadet es nicht.",
      heightCm: 168,
      hand: "left",
      eyes: "lightBrown",
      hair: "gray",
      sign: "scorpio",
    },
    {
      id: "gainsboro",
      name: "Bookie-Gewinner Gainsboro",
      icon: "\u{1F453}",
      description:
        "Gainsboros sechstausend Seiten langer Roman über Erde bezahlt keine Rechnungen. Also ist er auch Journalist. Das bezahlt auch keine Rechnungen.",
      heightCm: 183,
      hand: "left",
      eyes: "hazel",
      hair: "lightBrown",
      sign: "gemini",
    },
    {
      id: "blaxton",
      name: "Schreiberling Blaxton",
      icon: "✍️",
      description:
        "Schreiberling Blaxton würde nie als Journalist arbeiten. Er ist für ein großes Porträtinterview hier.",
      heightCm: 183,
      hand: "right",
      eyes: "lightBrown",
      hair: "bald",
      sign: "sagittarius",
    },
    {
      id: "champagne",
      name: "Genosse Champagne",
      icon: "\u{1F942}",
      description:
        "Genosse Champagne will sehen, ob er die Belegschaft gewerkschaftlich organisieren und auf den Weg zur Übernahme der Druckerpressen bringen kann.",
      heightCm: 180,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "capricorn",
    },
  ],
  locations: [
    {
      id: "bullpen",
      name: "der Großraum",
      icon: "\u{1F4C4}",
      description:
        "Hier pitchen alle Autoren ihre Geschichten und neue Slangwörter. Voller zerknüllter Ideen.",
      indoors: true,
    },
    {
      id: "press",
      name: "die Druckerpresse",
      icon: "⚙️",
      description: "Eine riesige Maschine aus Zahnrädern, Riemen und Walzen.",
      indoors: true,
    },
    {
      id: "balcony",
      name: "der Balkon",
      icon: "\u{1F3DB}️",
      description:
        "Nicht nach unten schauen! Das ist nicht nur beängstigend - es könnte dich auch jemand schubsen.",
      indoors: false,
    },
    {
      id: "rooftop",
      name: "das Dach",
      icon: "\u{1F3D9}️",
      description:
        "In den Siebzigern gab es hier oben einen Hubschrauberlandeplatz. Jetzt steht hier eine Plakatwand für ein Arthritis-Medikament.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "opener",
      name: "ein Brieföffner",
      icon: "\u{1F5E1}️",
      description:
        "Ein scharfes Messer für Leute, die ihre Briefe nicht einfach aufreißen.",
      weight: "light",
      material: "Metall",
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
      id: "bust",
      name: "eine Marmorbüste",
      icon: "\u{1F5FF}",
      description:
        "Die Büste eines berühmten Journalisten. Aber schlag ihn nicht nach - was du findest, wird dir nicht gefallen.",
      weight: "heavy",
      material: "Marmor",
    },
    {
      id: "printer",
      name: "ein Drucker",
      icon: "\u{1F5A8}️",
      description: "Wer über fünfzig ist, benutzt vermutlich so einen.",
      weight: "heavy",
      material: "Plastik und Technik",
    },
  ],
  motives: [
    { id: "power", name: "die Macht ergreifen", icon: "✊" },
    { id: "frustration", name: "aus Frust", icon: "\u{1F620}" },
    { id: "stop", name: "die Revolution aufhalten", icon: "\u{1F6AB}" },
    { id: "blackmail", name: "einer Erpressung entkommen", icon: "✉️" },
  ],
  clues: [
    {
      text: "Wer die Macht ergreifen wollte, war Linkshänder.",
      holds: (scene) => scene.driven("power").hand === "left",
    },
    {
      text: "Der Autor eines Buchs über Erde ist kein Mitglied der Gesalbten.",
      holds: (scene) => scene.at("rooftop").id !== "gainsboro",
    },
    {
      text: "Ein Brieföffner steckte zwischen einem Riemen und einem Zahnrad fest und machte ein knirschendes Geräusch.",
      holds: (scene) =>
        scene.locationOf(scene.holder("opener").id).id === "press",
    },
    {
      text: "Wer genauso groß ist wie Bookie-Gewinner Gainsboro, wurde mit einem Laptop gesehen.",
      holds: (scene) => scene.holder("laptop").id === "blaxton",
    },
    {
      text: "Ein Mitglied der Gesalbten war auf dem Dach.",
      holds: (scene) => scene.at("rooftop").id !== "gainsboro",
    },
    {
      text: "Ein Praktikant drückte Logico eine verwürfelte Notiz in die Hand: RWE NDE RECURKD TTHAE, OLTWEL IED LVNUIEOTRO HLAETNAUF.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("printer").id)?.id === "stop",
    },
    {
      text: "Wer aus Frust töten würde, dachte auf dem Balkon darüber nach.",
      holds: (scene) =>
        scene.locationOf(scene.driven("frustration").id).id === "balcony",
    },
    {
      text: "Wer einer Erpressung entkommen wollte, wurde drinnen gesehen.",
      holds: (scene) => scene.locationOf(scene.driven("blackmail").id).indoors,
    },
  ],
  statements: [
    {
      by: "ivory",
      text: "Nun, ich war an der Druckerpresse.",
      holds: (scene) => scene.locationOf("ivory").id === "press",
    },
    {
      by: "gainsboro",
      text: "Ich habe einen Bookie, also glauben Sie mir: Eine Marmorbüste war auf dem Balkon.",
      holds: (scene) =>
        scene.locationOf(scene.holder("bust").id).id === "balcony",
    },
    {
      by: "blaxton",
      text: "Bookie-Gewinner Gainsboro hatte einen Brieföffner dabei.",
      holds: (scene) => scene.weaponOf("gainsboro").id === "opener",
    },
    {
      by: "champagne",
      text: "Glauben Sie mir, einem Mann der Arbeit: Ich hatte eine Marmorbüste dabei.",
      holds: (scene) => scene.weaponOf("champagne").id === "bust",
    },
  ],
  solution: {
    ivory: { weapon: "printer", location: "rooftop", motive: "stop" },
    gainsboro: { weapon: "opener", location: "press", motive: "power" },
    blaxton: { weapon: "laptop", location: "bullpen", motive: "blackmail" },
    champagne: { weapon: "bust", location: "balcony", motive: "frustration" },
  },
  murderer: "ivory",
  hints: [
    {
      text: 'Logico wusste, dass Inspektor Irratino ihm telepathisch Informationen schickte, denn Irratino schrieb ihm zur Sicherheit auch eine Nachricht: "Hast du meine Botschaft empfangen? Genosse Champagne hatte die Marmorbüste!"',
      book: true,
      marks: [{ a: "champagne", b: "bust", value: "check" }],
    },
    {
      text: "Genauso groß wie Gainsboro (1,83 m) ist nur Schreiberling Blaxton: Er hatte den Laptop. Der Brieföffner steckte in der Druckerpresse - er war dort. Gainsboro gehört nicht zu den Gesalbten, war also nicht auf dem Dach.",
      marks: [
        { a: "blaxton", b: "laptop", value: "check" },
        { a: "opener", b: "press", value: "check" },
        { a: "gainsboro", b: "rooftop", value: "cross" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Sagt Blaxton die Wahrheit, war Gainsboro mit dem Brieföffner an der Druckerpresse - dann lügt Ivory. Lügt dagegen Blaxton, stimmen die anderen: Champagne hat die Büste auf dem Balkon (aus Frust), Ivory ist an der Druckerpresse mit dem Brieföffner, Gainsboro hat den Drucker (Revolution aufhalten).",
      marks: [
        { a: "gainsboro", b: "opener", value: "check" },
        { a: "gainsboro", b: "press", value: "check" },
        { a: "ivory", b: "printer", value: "check" },
        { a: "ivory", b: "stop", value: "check" },
        { a: "champagne", b: "balcony", value: "check" },
        { a: "champagne", b: "frustration", value: "check" },
        { a: "printer", b: "stop", value: "check" },
        { a: "balcony", b: "frustration", value: "check" },
      ],
    },
    {
      text: "Dann bleiben Gainsboro der Großraum und Blaxton das Dach - draußen. Die Macht will ein Linkshänder ergreifen, also Ivory, und Blaxton müsste einer Erpressung entkommen wollen, aber der war drinnen. Geht nicht. Also lügt Lektorin Ivory - sie ist die Mörderin.",
      marks: [
        { a: "blaxton", b: "bullpen", value: "check" },
        { a: "blaxton", b: "blackmail", value: "check" },
      ],
    },
    {
      text: "Gainsboro hat den Brieföffner an der Druckerpresse, Champagne die Büste auf dem Balkon (aus Frust), Ivory den Drucker - sie wollte die Revolution aufhalten. Wer der Erpressung entkam, war drinnen: Blaxton im Großraum. Ivory war auf dem Dach, und Gainsboro wollte die Macht ergreifen.",
      marks: [
        { a: "bullpen", b: "blackmail", value: "check" },
        { a: "ivory", b: "rooftop", value: "check" },
        { a: "gainsboro", b: "power", value: "check" },
        { a: "printer", b: "rooftop", value: "check" },
        { a: "rooftop", b: "stop", value: "check" },
        { a: "opener", b: "power", value: "check" },
        { a: "press", b: "power", value: "check" },
        { a: "laptop", b: "bullpen", value: "check" },
        { a: "laptop", b: "blackmail", value: "check" },
        { a: "bust", b: "balcony", value: "check" },
        { a: "bust", b: "frustration", value: "check" },
      ],
    },
  ],
};
