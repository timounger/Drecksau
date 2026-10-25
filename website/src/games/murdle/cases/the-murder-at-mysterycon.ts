/**
 * Case 81, "The Murder at MysteryCon": the actor playing Deductive Logico.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from photos of the
 * book. Motives and statements, no body clue - the liar is the murderer.
 * Every suspect belongs to the Crude Order of Light or the Ancient Song of
 * Pitch; the Order turns away blue eyes, so Silverton, the only blue-eyed
 * suspect, is the Song's only member present - the three clues about the two
 * societies carry that predicate. The "locked car" is the parking lot. The
 * hints are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const THE_MURDER_AT_MYSTERYCON: Case = {
  id: "the-murder-at-mysterycon",
  number: 81,
  title: "Der Mord auf der MysteryCon",
  story:
    '"LO-GI-CO! LO-GI-CO!", skandierte die Menge. Aber der Schauspieler, der Deductive Logico spielte, wollte nicht herauskommen. Schließlich kam der echte Logico heraus und verkündete, dass der Schauspieler ermordet worden war. Die Menge tobte.',
  series: "volume1",
  difficulty: "impossible",
  suspects: [
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
    {
      id: "president",
      name: "Präsident Midnight",
      icon: "\u{1F3A9}",
      description:
        "Der Chef von Midnight Movies. Ihm liegen Kunst und Geschäft am Herzen, aber ganz sicher nicht in dieser Reihenfolge.",
      heightCm: 188,
      hand: "right",
      eyes: "black",
      hair: "black",
      sign: "capricorn",
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
      id: "pine",
      name: "Richterin Pine",
      icon: "\u{1F469}‍⚖️",
      description:
        "(Ehemalige) Herrin des Gerichtssaals und von festem Glauben an die Gerechtigkeit beseelt - so, wie allein sie sie festlegt.",
      heightCm: 168,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "taurus",
    },
  ],
  locations: [
    {
      id: "lot",
      name: "der Parkplatz",
      icon: "\u{1F17F}️",
      description:
        "Ein unglücklicher Besucher versucht, das Rätsel des verschlossenen Autos zu lösen: Seine Schlüssel sind drin, er aber nicht.",
      indoors: false,
    },
    {
      id: "floor",
      name: "die Messehalle",
      icon: "\u{1F465}",
      description:
        "Hier verkaufen all die unabhängigen Krimiautoren ihre Ware an Leute im Detektivkostüm.",
      indoors: true,
    },
    {
      id: "exhibit",
      name: "die Ausstellungshalle",
      icon: "\u{1F3AA}",
      description:
        "Hier kündigt Midnight Movies Murdle: Der Film an - sehr zum Ärger der Unabhängigen.",
      indoors: true,
    },
    {
      id: "food",
      name: "der Food Court",
      icon: "\u{1F354}",
      description:
        "Hier bekommt man das beste Essen zum Thema Krimi, etwa einen Spurenbeeren-Muffin.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "glass",
      name: "eine Lupe",
      icon: "\u{1F50D}",
      description:
        "Damit kann man einen Hinweis finden - oder sie zum Kostüm tragen.",
      weight: "medium",
      material: "Metall und Glas",
    },
    {
      id: "crowbar",
      name: "ein Brecheisen",
      icon: "\u{1FA9D}",
      description:
        "Ehrlich gesagt werden sie öfter für Verbrechen benutzt als für irgendetwas anderes.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "pipe",
      name: "eine explodierende Pfeife",
      icon: "\u{1F4A3}",
      description:
        "Rauchen tötet, besonders wenn man eine Pfeifenbombe raucht.",
      weight: "light",
      material: "eine Pfeife und eine Bombe",
    },
    {
      id: "hardback",
      name: "eine gebundene Filmausgabe",
      icon: "\u{1F4D6}",
      description:
        "Sie haben Murdle als gebundene Ausgabe mit Filmcover neu aufgelegt. Es ist furchtbar.",
      weight: "medium",
      material: "Papier",
    },
  ],
  motives: [
    { id: "promote", name: "einen Film bewerben", icon: "\u{1F4E2}" },
    { id: "footage", name: "gute Aufnahmen bekommen", icon: "\u{1F39E}️" },
    { id: "cash", name: "für kaltes, hartes Bargeld", icon: "\u{1F4B0}" },
    { id: "part", name: "eine Rolle stehlen", icon: "\u{1F977}" },
  ],
  clues: [
    {
      text: "Wer eine Rolle stehlen wollte, war bei einem verschlossenen Auto.",
      holds: (scene) => scene.locationOf(scene.driven("part").id).id === "lot",
    },
    {
      text: "Der Rohe Orden des Lichts nimmt keine Leute mit blauen Augen auf.",
      holds: songMemberHasCrowbar,
    },
    {
      text: "Wer in der Ausstellungshalle war, war Linkshänder.",
      holds: (scene) => scene.at("exhibit").hand === "left",
    },
    {
      text: "Regisseur Dusty hatte ein Motiv, für kaltes, hartes Bargeld zu töten.",
      holds: (scene) => scene.motiveOf("dusty")?.id === "cash",
    },
    {
      text: "Alle Verdächtigen waren Mitglieder entweder im Rohen Orden des Lichts oder im Uralten Gesang der Tonhöhe.",
      holds: songMemberHasCrowbar,
    },
    {
      text: "Lupen waren in der Messehalle verboten, weil sie zu klischeehaft sind.",
      holds: (scene) =>
        scene.locationOf(scene.holder("glass").id).id !== "floor",
    },
    {
      text: "Das einzige anwesende Mitglied des Uralten Gesangs der Tonhöhe hatte ein Brecheisen dabei.",
      holds: songMemberHasCrowbar,
    },
    {
      text: "Richterin Pine wollte nur einen Film bewerben.",
      holds: (scene) => scene.motiveOf("pine")?.id === "promote",
    },
    {
      text: "Wer gute Aufnahmen bekommen wollte, hatte eine mittelschwere Waffe.",
      holds: (scene) =>
        scene.weaponOf(scene.driven("footage").id).weight === "medium",
    },
  ],
  statements: [
    {
      by: "silverton",
      text: "Ich sag Ihnen, wie es ist: Eine Lupe war in der Ausstellungshalle.",
      holds: (scene) =>
        scene.locationOf(scene.holder("glass").id).id === "exhibit",
    },
    {
      by: "president",
      text: "Als Präsident kann ich Ihnen sagen: Legende Silverton war auf dem Parkplatz.",
      holds: (scene) => scene.locationOf("silverton").id === "lot",
    },
    {
      by: "dusty",
      text: "Ich bin sehr beschäftigt, aber Richterin Pine hatte eine explodierende Pfeife dabei.",
      holds: (scene) => scene.weaponOf("pine").id === "pipe",
    },
    {
      by: "pine",
      text: "Die Fakten sind klar: Ein Brecheisen war auf dem Parkplatz.",
      holds: (scene) =>
        scene.locationOf(scene.holder("crowbar").id).id === "lot",
    },
  ],
  solution: {
    silverton: { weapon: "crowbar", location: "lot", motive: "part" },
    president: { weapon: "glass", location: "food", motive: "footage" },
    dusty: { weapon: "hardback", location: "exhibit", motive: "cash" },
    pine: { weapon: "pipe", location: "floor", motive: "promote" },
  },
  murderer: "silverton",
  hints: [
    {
      text: 'Logico bekam eine SMS von Irratino aus dem Hausarrest: "Ich habe gerade in eine Kerzenflamme geschaut, und Präsident Midnight aß etwas mit einem lustigen Namen. Na ja, so lustig war er nicht. Aber er gab sich Mühe."',
      book: true,
    },
    {
      text: "Silverton hat als Einziger blaue Augen, also darf er nicht in den Orden - er gehört zum Uralten Gesang, als dessen einziges Mitglied. Er hat das Brecheisen.",
    },
    {
      text: "Der einzige Linkshänder ist Regisseur Dusty: Er war in der Ausstellungshalle. Dusty will Bargeld, Pine einen Film bewerben.",
      marks: [
        { a: "dusty", b: "exhibit", value: "check" },
        { a: "dusty", b: "cash", value: "check" },
        { a: "pine", b: "promote", value: "check" },
      ],
    },
    {
      text: "Präsident Midnight und Richterin Pine sagen dasselbe: Silverton (mit dem Brecheisen) war auf dem Parkplatz. Da nur einer lügt, stimmt das - Silverton will also eine Rolle stehlen, und Präsident Midnight will gute Aufnahmen, also hat er eine mittelschwere Waffe: Lupe oder gebundene Ausgabe.",
      marks: [
        { a: "silverton", b: "crowbar", value: "check" },
        { a: "silverton", b: "lot", value: "check" },
        { a: "crowbar", b: "lot", value: "check" },
        { a: "silverton", b: "part", value: "check" },
        { a: "president", b: "glass", value: "check" },
        { a: "president", b: "footage", value: "check" },
        { a: "glass", b: "footage", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Dusty, hat er laut Silverton die Lupe, und Pine hat keine Pfeife - also die gebundene Ausgabe. Dann bliebe Präsident Midnight die leichte Pfeife. Geht nicht.",
      marks: [{ a: "pine", b: "pipe", value: "check" }],
    },
    {
      text: "Also lügt Legende Silverton: Pine hat die Pfeife, Dusty hat nicht die Lupe, sondern die gebundene Ausgabe, und Präsident Midnight die Lupe. Lupen waren in der Messehalle verboten - Midnight war im Food Court, Pine in der Messehalle.",
      marks: [
        { a: "president", b: "food", value: "check" },
        { a: "pine", b: "floor", value: "check" },
        { a: "glass", b: "food", value: "check" },
      ],
    },
    {
      text: "Legende Silverton war es mit dem Brecheisen auf dem Parkplatz, um eine Rolle zu stehlen.",
      marks: [
        { a: "crowbar", b: "part", value: "check" },
        { a: "lot", b: "part", value: "check" },
        { a: "food", b: "footage", value: "check" },
        { a: "dusty", b: "hardback", value: "check" },
        { a: "hardback", b: "exhibit", value: "check" },
        { a: "hardback", b: "cash", value: "check" },
        { a: "exhibit", b: "cash", value: "check" },
        { a: "pipe", b: "floor", value: "check" },
        { a: "pipe", b: "promote", value: "check" },
        { a: "floor", b: "promote", value: "check" },
      ],
    },
  ],
};

/**
 * Whether the only member of the Ancient Song of Pitch had the crowbar: the
 * Crude Order of Light turns away blue eyes, and everyone is in one of the
 * two, so the blue-eyed suspect is that member.
 *
 * @param scene - one way it could have been
 * @returns whether the crowbar's holder has blue eyes
 */
function songMemberHasCrowbar(scene: Scene): boolean {
  return scene.holder("crowbar").eyes === "blue";
}
