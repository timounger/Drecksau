/**
 * Case 75, "Revenge in the Cave": the hideout of the last three murderers,
 * and who Mister Shadow really was.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of
 * the book. The book blurs the globe's weight and material; the first word
 * has five letters (light or heavy), so it is taken as heavy here, without a
 * material - no clue asks for either. The scrambled note reads "Whoever
 * wanted to kill for money held a globe in their hand"; here it is scrambled
 * again in German, letter by letter within each word. The solver found the
 * only solution, and the hints are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const REVENGE_IN_THE_CAVE: Case = {
  id: "revenge-in-the-cave",
  number: 75,
  title: "Rache in der Höhle",
  story:
    "Deductive Logico schlich durch die Tunnel der geheimnisvollen Höhle. Plötzlich hörte er einen Schrei - also hörte er auf zu schleichen und fing an zu rennen. Er fand keine Leiche. Er fand etwas anderes: eine Art unterirdische Werkstatt und das geheime Versteck der letzten drei Mörder. Was war das für ein Ort, und wer war Mister Shadow wirklich?",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "shadow",
      name: "Mister Shadow",
      icon: "\u{1F575}️",
      description:
        "Eine Silhouette im Schatten. Er bewegt sich wie der Wind und sieht aus wie die Nacht.",
      heightCm: 188,
      hand: "left",
      eyes: "green",
      hair: "darkBrown",
      sign: "aquarius",
    },
    {
      id: "honey",
      name: "Bürgermeister Honey",
      icon: "\u{1F3A9}",
      description:
        "Er weiß, wo die Leichen vergraben sind - und sorgt dafür, dass sie immer für ihn stimmen.",
      heightCm: 183,
      hand: "left",
      eyes: "hazel",
      hair: "lightBrown",
      sign: "scorpio",
    },
    {
      id: "blackstone",
      name: "Blackstone, Esq.",
      icon: "⚖️",
      description:
        "Unglaublich begabt in der wichtigsten Fähigkeit eines Anwalts: sich bezahlen zu lassen.",
      heightCm: 183,
      hand: "right",
      eyes: "black",
      hair: "black",
      sign: "scorpio",
    },
    {
      id: "seashell",
      name: "Dr. Seashell, Zahnarzt",
      icon: "\u{1F9B7}",
      description:
        "Er ist Hobbyphysiker mit einer neuen Theorie des Universums - und nebenbei praktizierender Zahnarzt.",
      heightCm: 170,
      hand: "right",
      eyes: "green",
      hair: "gray",
      sign: "pisces",
    },
  ],
  locations: [
    {
      id: "machine",
      name: "eine große Maschine",
      icon: "⚙️",
      description:
        "Es sieht so aus, als würde diese Maschine die sogenannten alten Ruinen herstellen!",
      indoors: true,
    },
    {
      id: "new-ruins",
      name: "die neuen Ruinen",
      icon: "\u{1F3DB}️",
      description:
        "Genau wie die alten Ruinen, nur neu und unversehrt - und mit dem Stempel SdW an der Seite.",
      indoors: true,
    },
    {
      id: "table",
      name: "ein Tisch",
      icon: "\u{1F5FA}️",
      description:
        "Der Tisch ist mit Karten der Ruinenstandorte bedeckt, dazu gefälschte historische Dokumente.",
      indoors: true,
    },
    {
      id: "dead-end",
      name: "eine Sackgasse",
      icon: "\u{1F6AB}",
      description:
        "Ein langer Tunnel, der zu einer Steinwand führt und sonst nirgendwohin.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "bone",
      name: "ein riesiger Knochen",
      icon: "\u{1F9B4}",
      description:
        "Von einem wie großen Tier kann so ein Knochen stammen? Und wie groß muss der Hund sein, der ihn frisst?!",
      weight: "heavy",
      material: "Knochen",
    },
    {
      id: "magnet",
      name: "ein riesiger Magnet",
      icon: "\u{1F9F2}",
      description: "Halte ihn von Zahnfüllungen fern.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "rock",
      name: "ein Stein",
      icon: "\u{1FAA8}",
      description:
        "Ein ganz normaler Stein. Aber seltsamerweise nicht aus dieser Wüste. Und angeschlagen.",
      weight: "medium",
      material: "Mineralien",
    },
    {
      id: "globe",
      name: "ein Globus",
      icon: "\u{1F30D}",
      description:
        "Um die Weltherrschaft zu planen oder Getränke aufzubewahren.",
      weight: "heavy",
    },
  ],
  motives: [
    { id: "money", name: "für Geld", icon: "\u{1F4B0}" },
    { id: "occult", name: "das Okkulte fördern", icon: "\u{1F52E}" },
    { id: "war", name: "helfen, einen Krieg zu gewinnen", icon: "\u{1F4A3}" },
    { id: "town", name: "die Stadt bekannt machen", icon: "\u{1F4E3}" },
  ],
  clues: [
    {
      text: "Wer am Tisch stand, war Rechtshänder.",
      holds: (scene) => scene.at("table").hand === "right",
    },
    {
      text: "Ein Mitglied des Ritus der Flammenden Erde wollte die Stadt bekannt machen.",
      holds: (scene) => scene.driven("town").sign === "scorpio",
    },
    {
      text: "Wer für Geld töten wollte, war nicht in einer Sackgasse.",
      holds: (scene) =>
        scene.locationOf(scene.driven("money").id).id !== "dead-end",
    },
    {
      text: "Mister Shadow schwang immer wieder seine Waffe, und an den Funken, wenn sie etwas traf, erkannte Logico, dass sie aus Metall war.",
      holds: (scene) => scene.weaponOf("shadow").material === "Metall",
    },
    {
      text: "Wer helfen wollte, einen Krieg zu gewinnen, versprühte echte Fische-Schwingungen.",
      holds: (scene) => scene.driven("war").sign === "pisces",
    },
    {
      text: "Um dem Ritus der Flammenden Erde beizutreten, muss man Skorpion sein.",
      holds: (scene: Scene): boolean =>
        scene.driven("town").sign === "scorpio" &&
        scene.holder("globe").sign === "scorpio",
    },
    {
      text: "Ein riesiger Knochen lag neben einem Stempel mit der Aufschrift SdW. Wofür das wohl steht?",
      holds: (scene) =>
        scene.locationOf(scene.holder("bone").id).id === "new-ruins",
    },
    {
      text: "Entweder hatte Bürgermeister Honey einen Globus mitgebracht, oder ein Globus war bei einer großen Maschine.",
      holds: (scene) =>
        (scene.weaponOf("honey").id === "globe") !==
        (scene.locationOf(scene.holder("globe").id).id === "machine"),
    },
    {
      text: "Ein Mitglied des Ritus der Flammenden Erde hatte den Globus.",
      holds: (scene) => scene.holder("globe").sign === "scorpio",
    },
    {
      text: "Eine verwürfelte Notiz war an die Höhlenwand gekritzelt: REW ÜFR DGLE ÖETNT ELWLOT LITEH EENIN LSGBUO NI EDR NDAH.",
      holds: (scene) => scene.weaponOf(scene.driven("money").id).id === "globe",
    },
  ],
  body: {
    text: "Die Person mit dem riesigen Magneten war eindeutig verantwortlich.",
    weapon: "magnet",
  },
  solution: {
    shadow: { weapon: "magnet", location: "dead-end", motive: "occult" },
    honey: { weapon: "bone", location: "new-ruins", motive: "town" },
    blackstone: { weapon: "globe", location: "machine", motive: "money" },
    seashell: { weapon: "rock", location: "table", motive: "war" },
  },
  murderer: "shadow",
  hints: [
    {
      text: "Logico sah noch einmal hin und erkannte, dass die verdächtige Person, die genauso groß war wie Blackstone, Esq., einen riesigen Knochen hatte.",
      book: true,
    },
    {
      text: 'Die Notiz, Wort für Wort entwürfelt: "WER FÜR GELD TÖTEN WOLLTE, HIELT EINEN GLOBUS IN DER HAND."',
      marks: [{ a: "globe", b: "money", value: "check" }],
    },
    {
      text: "Mitglieder des Ritus sind Skorpione: Honey und Blackstone. Einer von ihnen hatte den Globus und wollte damit für Geld töten; die Stadt bekannt machen wollte ebenfalls ein Skorpion - also der andere. Den Krieg wollte der einzige Fisch gewinnen, Dr. Seashell. Mister Shadow bleibt das Okkulte.",
      marks: [{ a: "shadow", b: "occult", value: "check" }],
    },
    {
      text: "Shadows Waffe war aus Metall - Knochen und Stein sind es nicht, und den Globus hat ein Skorpion: Shadow hatte den Magneten.",
      marks: [{ a: "shadow", b: "magnet", value: "check" }],
    },
    {
      text: "Hätte Honey den Globus, wäre er laut Entweder-oder nicht bei der Maschine, als Geldmörder nicht in der Sackgasse und als Linkshänder nicht am Tisch - also bei den neuen Ruinen. Dort liegt aber der Knochen (der SdW-Stempel). Also hatte Blackstone den Globus, und der war bei der großen Maschine. Honey wollte die Stadt bekannt machen.",
      marks: [
        { a: "honey", b: "new-ruins", value: "check" },
        { a: "globe", b: "machine", value: "check" },
        { a: "blackstone", b: "globe", value: "check" },
        { a: "blackstone", b: "machine", value: "check" },
        { a: "honey", b: "town", value: "check" },
      ],
    },
    {
      text: "Am Tisch stand ein Rechtshänder: Seashell (Blackstone ist bei der Maschine). Der Knochen lag bei den neuen Ruinen - Honey hatte ihn, und Seashell den Stein. Shadow bleibt die Sackgasse.",
      marks: [
        { a: "seashell", b: "table", value: "check" },
        { a: "honey", b: "bone", value: "check" },
        { a: "seashell", b: "rock", value: "check" },
        { a: "bone", b: "new-ruins", value: "check" },
        { a: "shadow", b: "dead-end", value: "check" },
      ],
    },
    {
      text: "Der Magnet überführt ihn: Mister Shadow tötete in der Sackgasse, um das Okkulte zu fördern.",
      marks: [
        { a: "magnet", b: "dead-end", value: "check" },
        { a: "magnet", b: "occult", value: "check" },
        { a: "dead-end", b: "occult", value: "check" },
        { a: "bone", b: "town", value: "check" },
        { a: "new-ruins", b: "town", value: "check" },
        { a: "blackstone", b: "money", value: "check" },
        { a: "machine", b: "money", value: "check" },
        { a: "seashell", b: "war", value: "check" },
        { a: "rock", b: "table", value: "check" },
        { a: "rock", b: "war", value: "check" },
        { a: "table", b: "war", value: "check" },
      ],
    },
  ],
};
