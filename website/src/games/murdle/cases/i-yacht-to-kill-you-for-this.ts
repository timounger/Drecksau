/**
 * Case 59, "I Yacht to Kill You for This": a sailor on Chairman Chalk's yacht,
 * just when the Chairman needs publicity for Logico's books.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The scrambled message reads "Editor Ivory wanted to steal a prized
 * book"; here it is scrambled again in German, letter by letter within each
 * word. The impenetrable legalese is the contracts, the rusty chain the
 * anchor's, the nuclear reactor stands in the engine room and the
 * award-winning food in the dining hall. The photographed pages print neither
 * hint nor solution; the solver found the only one, and the hints are our
 * own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const I_YACHT_TO_KILL_YOU_FOR_THIS: Case = {
  id: "i-yacht-to-kill-you-for-this",
  number: 59,
  title: "Jachtzeit",
  story:
    'Deductive Logico wurde wieder auf die Jacht eingeladen, um mit Vorsitzendem Chalk über seine Buchverkäufe zu sprechen. Die Bücher verkauften sich, aber nicht gut genug. "Wenn wir nur", sagte der Vorsitzende, "irgendwie für Aufmerksamkeit sorgen könnten. Oh! Einer meiner Matrosen wurde ermordet! Den Fall könnten Sie lösen!"',
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "gainsboro",
      name: "Bookie-Gewinner Gainsboro",
      icon: "👓",
      description:
        "Er hat den Bookington-Preis für seinen Roman gewonnen, und das erzählt er dir in den ersten zwei Minuten. Das Buch ist sechstausend Seiten lang und handelt von Erde.",
      heightCm: 183,
      hand: "left",
      eyes: "hazel",
      hair: "lightBrown",
      sign: "gemini",
    },
    {
      id: "chalk",
      name: "Vorsitzender Chalk",
      icon: "👴",
      description:
        'Er hat das Verlagsgeschäft vor Jahren durchschaut und nie zurückgeblickt. E-Books nannte er eine "Modeerscheinung", und er besitzt noch immer ein Telefon mit Wählscheibe. Er ist eine Milliarde Dollar schwer.',
      heightCm: 175,
      hand: "right",
      eyes: "blue",
      hair: "white",
      sign: "sagittarius",
    },
    {
      id: "ivory",
      name: "Lektorin Ivory",
      icon: "🌹",
      description:
        "Die größte Liebesroman-Lektorin aller Zeiten. Sie hat das Genre Enemies to Lovers erfunden und als Erste einen nackten Mann auf ein Buchcover gebracht.",
      heightCm: 168,
      hand: "left",
      eyes: "lightBrown",
      hair: "gray",
      sign: "scorpio",
    },
    {
      id: "ink",
      name: "Agentin Ink",
      icon: "🖋️",
      description:
        "Eine Agentin mit einem Herz aus Gold - und einem Sinn für Gold. Sie verkauft mehr Bücher als Amazon.",
      heightCm: 165,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "virgo",
    },
  ],
  locations: [
    {
      id: "engine-room",
      name: "der Maschinenraum",
      icon: "⚙️",
      description:
        "Das ist eine grüne Jacht: Sie fährt mit einem Atomreaktor. Wenn die Uranstäbe verbraucht sind, wirft man sie einfach ins Meer.",
      indoors: true,
    },
    {
      id: "deck",
      name: "das Deck",
      icon: "🛥️",
      description:
        "Blick hinaus aufs Meer - aber nicht zu weit, sonst schubst dich noch jemand.",
      indoors: false,
    },
    {
      id: "overboard",
      name: "über Bord",
      icon: "🌊",
      description:
        "Der offene Ozean. Heimat einiger der beliebtesten Ertrunkenen der Geschichte.",
      indoors: false,
    },
    {
      id: "dining-hall",
      name: "der Speisesaal",
      icon: "🍽️",
      description:
        "Hier kocht ein preisgekrönter Koch - weil er an Land nicht mehr arbeiten darf.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "pen",
      name: "ein Gedenkfüller",
      icon: "🖊️",
      description:
        "Zur Erinnerung an dieses besondere Ereignis ... was auch immer es war. Er verliert teure Tinte.",
      weight: "light",
      material: "Metall und Tinte",
    },
    {
      id: "contracts",
      name: "verwirrende Verträge",
      icon: "📄",
      description:
        "Juristendeutsch, so undurchdringlich, dass man davon ein Aneurysma bekommen könnte.",
      weight: "light",
      material: "Papier",
    },
    {
      id: "tote-bag",
      name: "eine Stofftasche",
      icon: "👜",
      description:
        "Bibliophile Mafiosi benutzen diese Leinentaschen für Auftragsmorde. Man kann auch Bücher darin tragen.",
      weight: "medium",
      material: "Segeltuch",
    },
    {
      id: "anchor",
      name: "ein antiker Anker",
      icon: "⚓",
      description:
        "Er ist mit Moos bedeckt, und die Kette ist rostig: Er sieht großartig aus.",
      weight: "heavy",
      material: "Metall",
    },
  ],
  motives: [
    { id: "cult", name: "auf Befehl einer Sekte", icon: "🛐" },
    { id: "book", name: "ein wertvolles Buch stehlen", icon: "📕" },
    { id: "comfort", name: "Logico trösten", icon: "🎩" },
    { id: "sales", name: "die Buchverkäufe ankurbeln", icon: "📈" },
  ],
  clues: [
    {
      text: "Auf dem Deck wurde undurchdringliches Juristendeutsch entdeckt.",
      holds: (scene) =>
        scene.locationOf(scene.holder("contracts").id).id === "deck",
    },
    {
      text: "Logico bekam eine Nachricht, die jemand mit offensichtlicher Seekrankheit geschrieben hatte: RONITKEL OYVRI TELWOL IEN LOVTSERWEL CHUB LENTEHS.",
      holds: (scene) => scene.motiveOf("ivory")?.id === "book",
    },
    {
      text: "Wer den Gedenkfüller hatte, wollte die Buchverkäufe ankurbeln.",
      holds: (scene) => scene.motiveOf(scene.holder("pen").id)?.id === "sales",
    },
    {
      text: "Neben einem Atomreaktor wurde eine rostige Kette gefunden. Ist das ein Sicherheitsrisiko?",
      holds: (scene) =>
        scene.locationOf(scene.holder("anchor").id).id === "engine-room",
    },
    {
      text: "Bookie-Gewinner Gainsboro wollte auf Befehl einer Sekte töten.",
      holds: (scene) => scene.motiveOf("gainsboro")?.id === "cult",
    },
    {
      text: "Vorsitzender Chalk wollte Logico nicht trösten.",
      holds: (scene) => scene.motiveOf("chalk")?.id !== "comfort",
    },
    {
      text: "Lektorin Ivory war nicht auf dem Deck gewesen.",
      holds: (scene) => scene.locationOf("ivory").id !== "deck",
    },
    {
      text: "Agentin Ink schwamm in einem weiten, gleichgültigen Ozean herum.",
      holds: (scene) => scene.locationOf("ink").id === "overboard",
    },
  ],
  body: {
    text: "Der Matrose wurde mit dem Gesicht nach unten in preisgekröntem Essen gefunden.",
    location: "dining-hall",
  },
  solution: {
    gainsboro: { weapon: "contracts", location: "deck", motive: "cult" },
    chalk: { weapon: "pen", location: "dining-hall", motive: "sales" },
    ivory: { weapon: "anchor", location: "engine-room", motive: "book" },
    ink: { weapon: "tote-bag", location: "overboard", motive: "comfort" },
  },
  murderer: "chalk",
  hints: [
    {
      text: 'Inspektor Irratino deutete eine Tarotkarte, die er gezogen hatte, und verkündete dann: "Lektorin Ivory wurde gesehen, wie sie neben einem Atomreaktor herumhing."',
      book: true,
    },
    {
      text: "Die Nachricht ist Wort für Wort verwürfelt. Richtig sortiert heißt sie: LEKTORIN IVORY WOLLTE EIN WERTVOLLES BUCH STEHLEN.",
      marks: [{ a: "ivory", b: "book", value: "check" }],
    },
    {
      text: "Gainsboro tötete auf Befehl einer Sekte, Ivory für das Buch. Chalk wollte Logico nicht trösten, also die Buchverkäufe ankurbeln - und Agentin Ink wollte Logico trösten. Den Gedenkfüller hatte, wer die Verkäufe ankurbeln wollte: Chalk.",
      marks: [
        { a: "gainsboro", b: "cult", value: "check" },
        { a: "chalk", b: "sales", value: "check" },
        { a: "ink", b: "comfort", value: "check" },
        { a: "chalk", b: "pen", value: "check" },
      ],
    },
    {
      text: "Ink schwamm im Ozean - über Bord. Die Verträge (das Juristendeutsch) lagen auf dem Deck: Chalk hatte den Füller, Ink war über Bord und Ivory nicht auf dem Deck. Gainsboro hatte die Verträge auf dem Deck.",
      marks: [
        { a: "ink", b: "overboard", value: "check" },
        { a: "contracts", b: "deck", value: "check" },
        { a: "gainsboro", b: "contracts", value: "check" },
        { a: "gainsboro", b: "deck", value: "check" },
      ],
    },
    {
      text: "Die rostige Kette des Ankers lag neben dem Atomreaktor im Maschinenraum. Chalk hatte den Füller, also war er nicht dort: Chalk war im Speisesaal, Ivory hatte den Anker im Maschinenraum. Ink blieb die Stofftasche.",
      marks: [
        { a: "anchor", b: "engine-room", value: "check" },
        { a: "chalk", b: "dining-hall", value: "check" },
        { a: "ivory", b: "anchor", value: "check" },
        { a: "ivory", b: "engine-room", value: "check" },
        { a: "ink", b: "tote-bag", value: "check" },
      ],
    },
    {
      text: "Das preisgekrönte Essen gibt es im Speisesaal: Vorsitzender Chalk war es, mit dem Gedenkfüller, im Speisesaal, um die Buchverkäufe anzukurbeln.",
      marks: [
        { a: "pen", b: "dining-hall", value: "check" },
        { a: "pen", b: "sales", value: "check" },
        { a: "dining-hall", b: "sales", value: "check" },
        { a: "contracts", b: "cult", value: "check" },
        { a: "deck", b: "cult", value: "check" },
        { a: "anchor", b: "book", value: "check" },
        { a: "engine-room", b: "book", value: "check" },
        { a: "tote-bag", b: "overboard", value: "check" },
        { a: "tote-bag", b: "comfort", value: "check" },
        { a: "overboard", b: "comfort", value: "check" },
      ],
    },
  ],
};
