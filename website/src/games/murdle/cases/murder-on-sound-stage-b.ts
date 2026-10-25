/**
 * Case 86, "Murder on Sound Stage B": the actor playing Logico's landlord.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible). Motives and statements,
 * no body clue - the liar is the murderer. The scrambled note reads
 * "Cosmonaut Bluski had a fire extinguisher"; here it is scrambled again in
 * German, letter by letter within each word. The book's hint comes first; the
 * other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const MURDER_ON_SOUND_STAGE_B: Case = {
  id: "murder-on-sound-stage-b",
  number: 86,
  title: "Mord auf Tonbühne B",
  story:
    "Logico war verblüfft, als er das Set seines eigenen Büros betrat und alles perfekt nachgebaut fand - auch die Method Actors, die so tief in ihren Rollen steckten, dass einer von ihnen den Schauspieler ermordete, der den Vermieter spielte.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "bluski",
      name: "Kosmonaut Bluski",
      icon: "\u{1F468}‍\u{1F680}",
      description:
        "Nicht wirklich Kosmonaut Bluski, sondern ein Method Actor, der darauf besteht, so angesprochen zu werden.",
      heightCm: 188,
      hand: "left",
      eyes: "darkBrown",
      hair: "black",
      sign: "aries",
    },
    {
      id: "coffee",
      name: "General Coffee",
      icon: "☕",
      description:
        'Auch er ist nur ein Schauspieler in einer Rolle, aber er verlangt, dass man ihn "General" nennt - sonst kündigt er.',
      heightCm: 183,
      hand: "right",
      eyes: "darkBrown",
      hair: "bald",
      sign: "sagittarius",
    },
    {
      id: "aureolin",
      name: "Die unglaubliche Aureolin",
      icon: "\u{1FA84}",
      description:
        "Sie wurde in einen Haufen Szenen des Films eingebaut, als eine Art Logicos Sidekick.",
      heightCm: 168,
      hand: "left",
      eyes: "green",
      hair: "blond",
      sign: "aries",
    },
    {
      id: "crimson",
      name: "Dr. Crimson",
      icon: "\u{1FA7A}",
      description:
        "Ja, sie spielt eine Ärztin - aber sie ist auch eine echte Ärztin, die aufgehört hat, um Schauspielerin zu werden.",
      heightCm: 175,
      hand: "left",
      eyes: "green",
      hair: "red",
      sign: "aquarius",
    },
  ],
  locations: [
    {
      id: "closet",
      name: "der Schrank",
      icon: "\u{1F6AA}",
      description:
        "Logicos Requisitenkleidung ist nach Farbe sortiert statt alphabetisch!",
      indoors: true,
    },
    {
      id: "waiting-room",
      name: "das Wartezimmer",
      icon: "\u{1F6CE}️",
      description:
        "Hier steht eine fast identische Klingel wie bei Logico und ein Schild: BITTE WARTEN.",
      indoors: true,
    },
    {
      id: "main-office",
      name: "das Hauptbüro",
      icon: "\u{1FA91}",
      description:
        "Ein Schreibtisch, Regale voller Requisitenbücher und ein Blick auf den ... Himmel? Da sollten Backsteine sein!",
      indoors: true,
    },
    {
      id: "balcony",
      name: "der Balkon",
      icon: "\u{1FA9F}",
      description:
        "Logicos Feuertreppe, nur vor einem gemalten Himmel - und sie ist kein Ausgang. (Nur scheinbar draußen.)",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "extinguisher",
      name: "ein Feuerlöscher",
      icon: "\u{1F9EF}",
      description: "Damit löscht man ein Feuer - oder jemandem das Licht.",
      weight: "heavy",
      material: "Metall und Chemikalien",
    },
    {
      id: "herring",
      name: "ein Red Herring",
      icon: "\u{1F41F}",
      description: "Hält man ihn am Schwanz, kommt richtig Schwung dahinter.",
      weight: "medium",
      material: "Fisch",
    },
    {
      id: "fedora",
      name: "ein präparierter Fedora",
      icon: "\u{1F452}",
      description: "Was auch immer du tust: Setz ihn nicht auf.",
      weight: "medium",
      material: "geschwärzt",
    },
    {
      id: "poison",
      name: "ein Giftfläschchen",
      icon: "\u{1F9EA}",
      description:
        "Ein ganz gewöhnliches Fläschchen Gift. Unterschätze nie die Klassiker.",
      weight: "light",
      material: "Glas und Gift",
    },
  ],
  motives: [
    { id: "see", name: "sehen, ob es geht", icon: "\u{1F441}️" },
    { id: "jealousy", name: "aus Eifersucht", icon: "\u{1F49A}" },
    { id: "award", name: "einen Preis gewinnen", icon: "\u{1F3C6}" },
    { id: "lines", name: "mehr Text bekommen", icon: "\u{1F4DC}" },
  ],
  clues: [
    {
      text: "Wer einen Preis gewinnen wollte, wartete im Wartezimmer.",
      holds: (scene) =>
        scene.locationOf(scene.driven("award").id).id === "waiting-room",
    },
    {
      text: "Die Person mit Glatze wollte sehen, ob sie töten kann.",
      holds: (scene) => scene.motiveOf("coffee")?.id === "see",
    },
    {
      text: "Wer sehen wollte, ob es geht, war kein Mitglied des Wegs des Unheiligen Lichts.",
      holds: (scene) => scene.driven("see").eyes !== "green",
    },
    {
      text: "Alle Verdächtigen mit grünen Augen waren im Weg des Unheiligen Lichts.",
      holds: () => true,
    },
    {
      text: "Ein Wachmann drückte Logico einen verwürfelten Zettel in die Hand: KOOUATMSN ULSIKB TTEAH EINNE ECULEHRSERÖF.",
      holds: (scene) => scene.weaponOf("bluski").id === "extinguisher",
    },
    {
      text: "Die Kleidung im Schrank hatte jemand Rechtshändiges angefasst.",
      holds: (scene) => scene.at("closet").hand === "right",
    },
    {
      text: "Wer Logicos Sidekick spielte, wollte mehr Text bekommen.",
      holds: (scene) => scene.motiveOf("aureolin")?.id === "lines",
    },
    {
      text: "Wer einen präparierten Fedora hatte, würde aus Eifersucht töten.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("fedora").id)?.id === "jealousy",
    },
  ],
  statements: [
    {
      by: "bluski",
      text: "Der zweitkleinste Verdächtige war nicht im Schrank.",
      holds: (scene) => scene.locationOf("crimson").id !== "closet",
    },
    {
      by: "coffee",
      text: "Ach ... wer mehr Text bekommen wollte, war im Hauptbüro.",
      holds: (scene) =>
        scene.locationOf(scene.driven("lines").id).id === "main-office",
    },
    {
      by: "aureolin",
      text: "Eine rothaarige Person war auf dem Balkon.",
      holds: (scene) => scene.at("balcony").hair === "red",
    },
    {
      by: "crimson",
      text: "Als Ärztin sage ich Ihnen: Ein Red Herring war im Schrank.",
      holds: (scene) =>
        scene.locationOf(scene.holder("herring").id).id === "closet",
    },
  ],
  solution: {
    bluski: {
      weapon: "extinguisher",
      location: "waiting-room",
      motive: "award",
    },
    coffee: { weapon: "poison", location: "closet", motive: "see" },
    aureolin: { weapon: "herring", location: "main-office", motive: "lines" },
    crimson: { weapon: "fedora", location: "balcony", motive: "jealousy" },
  },
  murderer: "crimson",
  hints: [
    {
      text: 'Logico rief wieder bei Irratino an, und Irratino erzählte ihm, er habe geträumt, dass Logico anrufen würde - und im Traum habe Irratino ihm gesagt, General Coffee "wollte sehen, ob er es kann". Verstand Logico, was das hieß? Logico verstand.',
      book: true,
    },
    {
      text: 'Der Zettel, Wort für Wort entwürfelt: "KOSMONAUT BLUSKI HATTE EINEN FEUERLÖSCHER." Coffee hat eine Glatze und will sehen, ob es geht; er ist auch der einzige Rechtshänder, also war er im Schrank. Aureolin spielt den Sidekick und will mehr Text.',
      marks: [
        { a: "bluski", b: "extinguisher", value: "check" },
        { a: "coffee", b: "closet", value: "check" },
        { a: "aureolin", b: "lines", value: "check" },
      ],
    },
    {
      text: "Bluski und Crimson teilen sich Preis und Eifersucht. Wer den Fedora hat, ist eifersüchtig - Bluski hat den Feuerlöscher, also hat Crimson den Fedora und ist eifersüchtig. Bluski will den Preis und war im Wartezimmer.",
      marks: [
        { a: "bluski", b: "award", value: "check" },
        { a: "crimson", b: "jealousy", value: "check" },
        { a: "crimson", b: "fedora", value: "check" },
        { a: "bluski", b: "waiting-room", value: "check" },
        { a: "waiting-room", b: "award", value: "check" },
      ],
    },
    {
      text: "Aureolin und Crimson teilen sich Hauptbüro und Balkon. Coffees Aussage (Aureolin im Hauptbüro) und Aureolins Aussage (Crimson auf dem Balkon) sind also entweder beide wahr oder beide falsch. Zwei Lügner gibt es nicht: Beide stimmen. Bluskis Aussage stimmt auch, im Schrank ist ja Coffee.",
      marks: [
        { a: "aureolin", b: "main-office", value: "check" },
        { a: "crimson", b: "balcony", value: "check" },
      ],
    },
    {
      text: "Bleibt Crimsons Aussage: Würde auch sie stimmen, gäbe es keinen Lügner. Also lügt Dr. Crimson - sie ist die Mörderin. Der Red Herring war nicht im Schrank: Aureolin hat ihn im Hauptbüro, Coffee das Giftfläschchen. Crimson hatte den präparierten Fedora auf dem Balkon, aus Eifersucht.",
      marks: [
        { a: "coffee", b: "poison", value: "check" },
        { a: "aureolin", b: "herring", value: "check" },
        { a: "herring", b: "main-office", value: "check" },
        { a: "poison", b: "closet", value: "check" },
        { a: "fedora", b: "balcony", value: "check" },
        { a: "fedora", b: "jealousy", value: "check" },
        { a: "balcony", b: "jealousy", value: "check" },
        { a: "extinguisher", b: "waiting-room", value: "check" },
        { a: "extinguisher", b: "award", value: "check" },
        { a: "coffee", b: "see", value: "check" },
        { a: "poison", b: "see", value: "check" },
        { a: "closet", b: "see", value: "check" },
        { a: "herring", b: "lines", value: "check" },
        { a: "main-office", b: "lines", value: "check" },
      ],
    },
  ],
};
