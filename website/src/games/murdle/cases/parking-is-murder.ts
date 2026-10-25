/**
 * Case 83, "Parking Is Murder": a valet at Midnight Movie Studios.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from photos of the
 * book. Motives and statements, no body clue - the liar is the murderer.
 *
 * Two clues point to Exhibit D, the map of Midnight Movie Studios, which is
 * not among the photos. "The building directly to the west of the studio
 * tour check-in stand" is taken to be the security building, the only
 * building of the case; "the eastern parking lot" is Parking Lot B, the only
 * reading under which the case has the book's solution. Both clues say so in
 * their German text. Officer Copper is the only member of the Order on the
 * lot, so the baton is hers - the two clues about the Order carry that
 * predicate. The hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const PARKING_IS_MURDER: Case = {
  id: "parking-is-murder",
  number: 83,
  title: "Parken ist Mord",
  story:
    "Endlich wurde Deductive Logico in die Midnight Movie Studios eingeladen, wo er das Gelände besichtigen und bei den Dreharbeiten zu seinem Film zusehen durfte. Doch zuerst musste er ein Problem lösen, grauenvoller als alles, was ihm je begegnet war: einen Parkplatz finden. (Außerdem war ein Parkwächter ermordet worden.)",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "lavender",
      name: "Lord Lavender",
      icon: "🎼",
      description:
        "Ein konservatives Mitglied des britischen Oberhauses und zugleich der Musicalkomponist hinter Hits wie Jazz-College und Stücke der Angst.",
      heightCm: 175,
      hand: "right",
      eyes: "green",
      hair: "gray",
      sign: "virgo",
    },
    {
      id: "emerald",
      name: "Signor Emerald",
      icon: "\u{1F48E}",
      description:
        "Ein berühmter italienischer Juwelier. Signor Emerald hat die ganze Welt nach seltenen Edelsteinen bereist, die ihm ständig aus den Taschen fallen.",
      heightCm: 173,
      hand: "left",
      eyes: "lightBrown",
      hair: "black",
      sign: "sagittarius",
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
    {
      id: "pearl",
      name: "Pearl, AGE",
      icon: "\u{1F453}",
      description:
        "Cutterin (Amerikanische Gilde der Editoren) einiger der besten und einiger der erfolgreichsten Filme aller Zeiten - nur nie beides zugleich.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "aquarius",
    },
  ],
  locations: [
    {
      id: "lotA",
      name: "Parkplatz A",
      icon: "\u{1F170}️",
      description:
        "Der gute Parkplatz. Nah am Eingang. Hier parken die Bosse und die Stars.",
      indoors: false,
    },
    {
      id: "security",
      name: "das Sicherheitsgebäude",
      icon: "\u{1F4F9}",
      description:
        "Ein ausgefeilteres Sicherheitssystem als auf den meisten Militärstützpunkten.",
      indoors: true,
    },
    {
      id: "lotB",
      name: "Parkplatz B",
      icon: "\u{1F171}️",
      description:
        "Der schlechte Parkplatz. Weit weg vom Eingang. Hier kostet das Parken Geld.",
      indoors: false,
    },
    {
      id: "fountain",
      name: "der Brunnen",
      icon: "⛲",
      description:
        "Ein Brunnen, gespeist vom Wasserturm, zum Gedenken an alle Statisten, die am Set verletzt wurden.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "screenplay",
      name: "ein riesiges Drehbuch",
      icon: "\u{1F4D1}",
      description:
        "Es bereitet ein Franchise vor, hat also fünfzig Extraseiten, die unglaublich langweilig sind.",
      weight: "heavy",
      material: "Papier",
    },
    {
      id: "award",
      name: "ein Filmpreis",
      icon: "\u{1F3C6}",
      description:
        "Je öfter Logico diese Dinger sieht, desto weniger hält er von ihnen.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "cart",
      name: "ein Golfwagen",
      icon: "\u{1F6FA}",
      description:
        "Gut, um auf winzigen Reifen loszubrettern oder jemanden zu überfahren.",
      weight: "heavy",
      material: "Metall, Plastik und Gummi",
    },
    {
      id: "baton",
      name: "ein Schlagstock",
      icon: "\u{1F3CF}",
      description: "Ein großartiges Werkzeug, um Unschuldige zu misshandeln.",
      weight: "medium",
      material: "Metall",
    },
  ],
  motives: [
    { id: "secret", name: "ein Geheimnis schützen", icon: "\u{1F92B}" },
    { id: "hurry", name: "weil man es eilig hatte", icon: "\u{1F45F}" },
    {
      id: "spot",
      name: "einen besseren Parkplatz bekommen",
      icon: "\u{1F699}",
    },
    { id: "grave", name: "ein Grab ausrauben", icon: "\u{1F480}" },
  ],
  clues: [
    {
      text: "Polizistin Copper war Mitglied des Ordens.",
      holds: (scene) => scene.weaponOf("copper").id === "baton",
    },
    {
      text: "Wer ein Geheimnis schützen wollte, war nicht im Gebäude direkt westlich vom Check-in-Stand der Studiotour (laut Karte der Studios, Beweisstück D, ist das das Sicherheitsgebäude).",
      holds: (scene) =>
        scene.locationOf(scene.driven("secret").id).id !== "security",
    },
    {
      text: "Deductive Logico folgerte aus der Uhrzeit seines nächsten Termins, dass Signor Emerald es ganz bestimmt eilig hatte.",
      holds: (scene) => scene.motiveOf("emerald")?.id === "hurry",
    },
    {
      text: "Nur Mitglieder des Ordens durften auf dem Gelände Schlagstöcke tragen.",
      holds: (scene) => scene.weaponOf("copper").id === "baton",
    },
    {
      text: "Neben einem Gedenkbrunnen wurde eine Drehbuchseite gefunden, die eine Fortsetzung vorbereitet.",
      holds: (scene) =>
        scene.locationOf(scene.holder("screenplay").id).id === "fountain",
    },
    {
      text: "Pearl, AGE, wurde gesehen, wie sie auf dem östlichen Parkplatz herumlungerte (laut Karte der Studios, Beweisstück D, ist das Parkplatz B).",
      holds: (scene) => scene.locationOf("pearl").id === "lotB",
    },
    {
      text: "Wer einen besseren Parkplatz bekommen wollte, hatte eine mittelschwere Waffe.",
      holds: (scene) =>
        scene.weaponOf(scene.driven("spot").id).weight === "medium",
    },
  ],
  statements: [
    {
      by: "lavender",
      text: "Polizistin Copper war im Sicherheitsgebäude.",
      holds: (scene) => scene.locationOf("copper").id === "security",
    },
    {
      by: "emerald",
      text: "Lord Lavender fuhr einen Golfwagen.",
      holds: (scene) => scene.weaponOf("lavender").id === "cart",
    },
    {
      by: "copper",
      text: "Wer einen besseren Parkplatz bekommen wollte, war auf Parkplatz B.",
      holds: (scene) => scene.locationOf(scene.driven("spot").id).id === "lotB",
    },
    {
      by: "pearl",
      text: "Mir scheint, Polizistin Copper wollte ein Grab ausrauben.",
      holds: (scene) => scene.motiveOf("copper")?.id === "grave",
    },
  ],
  solution: {
    lavender: { weapon: "screenplay", location: "fountain", motive: "secret" },
    emerald: { weapon: "cart", location: "lotA", motive: "hurry" },
    copper: { weapon: "baton", location: "security", motive: "grave" },
    pearl: { weapon: "award", location: "lotB", motive: "spot" },
  },
  murderer: "emerald",
  hints: [
    {
      text: 'Irratino schickte noch eine SMS: "Das ist kein esoterisches Wissen, Logico. Ich habe nur auf einer Studio-Webcam gesehen, dass Lord Lavender neben einem Brunnen herumhing. Ich hoffe, es geht dir gut da draußen."',
      book: true,
      marks: [{ a: "lavender", b: "fountain", value: "check" }],
    },
    {
      text: "Copper ist im Orden, und nur der Orden trägt Schlagstöcke: Copper hat den Schlagstock. Emerald hatte es eilig, Pearl war auf Parkplatz B, das Drehbuch lag am Brunnen.",
      marks: [
        { a: "copper", b: "baton", value: "check" },
        { a: "screenplay", b: "fountain", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Lord Lavender, wäre Copper nicht im Sicherheitsgebäude. Laut Copper will Pearl (Parkplatz B) den besseren Parkplatz, hat also den Filmpreis; laut Emerald fährt Lavender den Golfwagen. Dann hat Emerald das Drehbuch am Brunnen, Copper ist auf Parkplatz A, Lavender im Sicherheitsgebäude. Laut Pearl will Copper ein Grab ausrauben - für Lavender bliebe das Geheimnis, aber nicht im Sicherheitsgebäude. Geht nicht.",
      marks: [
        { a: "copper", b: "security", value: "check" },
        { a: "emerald", b: "cart", value: "check" },
        { a: "pearl", b: "award", value: "check" },
        { a: "lavender", b: "screenplay", value: "check" },
        { a: "lavender", b: "secret", value: "check" },
        { a: "copper", b: "grave", value: "check" },
        { a: "security", b: "grave", value: "check" },
      ],
    },
    {
      text: "Lügt Copper, will Pearl nicht den besseren Parkplatz. Copper will laut Pearl ein Grab ausrauben, Emerald hat es eilig - also will Lavender den Parkplatz und hat eine mittelschwere Waffe. Laut Emerald fährt er aber den Golfwagen. Geht nicht.",
    },
    {
      text: "Lügt Pearl, ist Copper laut Lavender im Sicherheitsgebäude, Pearl will den Parkplatz (Filmpreis), Lavender hat den Golfwagen, Emerald das Drehbuch. Copper will kein Grab ausrauben, also ein Geheimnis schützen - aber nicht im Sicherheitsgebäude. Geht nicht.",
    },
    {
      text: "Also lügt Signor Emerald: Lavender hat keinen Golfwagen, also das Drehbuch am Brunnen, und will das Geheimnis schützen. Emerald fährt den Golfwagen auf Parkplatz A. Signor Emerald war es mit dem Golfwagen auf Parkplatz A, weil er es eilig hatte.",
      marks: [
        { a: "screenplay", b: "secret", value: "check" },
        { a: "fountain", b: "secret", value: "check" },
        { a: "emerald", b: "lotA", value: "check" },
        { a: "emerald", b: "hurry", value: "check" },
        { a: "cart", b: "lotA", value: "check" },
        { a: "cart", b: "hurry", value: "check" },
        { a: "lotA", b: "hurry", value: "check" },
        { a: "baton", b: "security", value: "check" },
        { a: "baton", b: "grave", value: "check" },
        { a: "pearl", b: "lotB", value: "check" },
        { a: "pearl", b: "spot", value: "check" },
        { a: "award", b: "lotB", value: "check" },
        { a: "award", b: "spot", value: "check" },
        { a: "lotB", b: "spot", value: "check" },
      ],
    },
  ],
};
