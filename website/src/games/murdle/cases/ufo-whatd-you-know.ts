/**
 * Case 74, "UFO, What'd You Know?": a tourist at the UFO crash site of New
 * Aegis.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of
 * the book. The scrambled message reads "A Leo was in the crater"; here it
 * is scrambled again in German, letter by letter within each word. The
 * solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const UFO_WHATD_YOU_KNOW: Case = {
  id: "ufo-whatd-you-know",
  number: 74,
  title: "Ufo, wer hätt's gedacht?",
  story:
    "Deductive Logico fuhr zur örtlich berühmten UFO-Absturzstelle. Manche Touristen glaubten, es sei der echte Absturz eines echten UFOs gewesen. Andere hielten ihn für gefälscht. Und ein Tourist war keiner der beiden Meinungen - weil er tot war.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "celadon",
      name: "Ministerin Celadon",
      icon: "\u{1FA96}",
      description:
        "Die Verteidigungsministerin - und persönlich verantwortlich für eine Reihe weltweiter Krisen, von denen einige inzwischen nach ihr benannt sind.",
      heightCm: 168,
      hand: "left",
      eyes: "green",
      hair: "lightBrown",
      sign: "leo",
    },
    {
      id: "umber",
      name: "Soziologin Umber",
      icon: "\u{1F4CA}",
      description:
        "Als Vertreterin der harten Wissenschaften fragt sie ständig, ob man seine Vorannahmen hinterfragt und Adorno gelesen hat.",
      heightCm: 163,
      hand: "left",
      eyes: "blue",
      hair: "blond",
      sign: "leo",
    },
    {
      id: "onyx",
      name: "Kräuterkundige Onyx",
      icon: "\u{1F33F}",
      description:
        "In ihrem Gewächshaus zieht sie jede Pflanze, die man für die Koch-, Zauber- und Giftmischkunst braucht.",
      heightCm: 152,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "virgo",
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
      id: "crater",
      name: "der Krater",
      icon: "\u{1F6F8}",
      description:
        "In der Mitte liegt metallische Ausrüstung, die außerirdisch aussehen könnte (wenn man die Augen zusammenkneift).",
      indoors: false,
    },
    {
      id: "cave",
      name: "der Höhleneingang",
      icon: "\u{1F573}️",
      description:
        "Von drinnen scheinen ein schwaches Licht und ein pulsierendes Geräusch zu kommen.",
      indoors: false,
    },
    {
      id: "gift-shop",
      name: "der Souvenirladen",
      icon: "\u{1F6CD}️",
      description:
        "Hier gibt es eine kleine Plüsch-Alienpuppe, eine Ferienwohnung auf Timesharing-Basis oder ein Entführungsopfer-NFT.",
      indoors: true,
    },
    {
      id: "van",
      name: "der Regierungstransporter",
      icon: "\u{1F69A}",
      description:
        "Wenn es ein Schwindel ist - warum lungert dann ein weißer Regierungstransporter in der Nähe herum?",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "apparatus",
      name: "ein pseudowissenschaftlicher Apparat",
      icon: "⚛️",
      description:
        "Dieses Modell wurde aufgerüstet und misst jetzt zusätzlich zu deinen Blaxonen auch deine Parquonen.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "cauldron",
      name: "ein Kessel",
      icon: "\u{1FAD5}",
      description:
        "Wer ihn hochheben kann, kann jemanden damit erschlagen. Oder ihm einfach einen Schluck anbieten.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "wand",
      name: "ein Selenitstab",
      icon: "\u{1FA84}",
      description: "Zum Zaubern und zum Schädeleinschlagen.",
      weight: "medium",
      material: "Selenit",
    },
    {
      id: "watch",
      name: "eine hypnotische Taschenuhr",
      icon: "⏱️",
      description:
        "Wenn du tief in diese Uhr hineinschaust, kannst du die Uhrzeit ablesen.",
      weight: "light",
      material: "Metall",
    },
  ],
  motives: [
    {
      id: "experiment",
      name: "als wissenschaftliches Experiment",
      icon: "\u{1F52C}",
    },
    { id: "vibes", name: "weil die Schwingungen nicht stimmten", icon: "☮️" },
    { id: "cult", name: "auf Befehl einer Sekte", icon: "\u{1F9E5}" },
    { id: "ufo", name: "das UFO stehlen", icon: "\u{1F977}" },
  ],
  clues: [
    {
      text: "Ministerin Celadon war Mitglied im Orden von Teer und Feder.",
      holds: (scene) =>
        scene.weaponOf("celadon").id !== "wand" &&
        scene.locationOf("celadon").id !== "cave",
    },
    {
      text: "Wer auf Befehl einer Sekte töten wollte, war eine Jungfrau.",
      holds: (scene) => scene.driven("cult").sign === "virgo",
    },
    {
      text: "Ein Parquonen-Messgerät wurde neben einer Plüschpuppe gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("apparatus").id).id === "gift-shop",
    },
    {
      text: "Soziologin Umber hatte einen Kessel. (Sie ist nicht nur Soziologin, sondern auch Hexe.)",
      holds: (scene) => scene.weaponOf("umber").id === "cauldron",
    },
    {
      text: "Jemand hatte eine verwürfelte Nachricht im Gästebuch hinterlassen: NEI EÖWL WRA MI TAKERR.",
      holds: (scene) => scene.at("crater").sign === "leo",
    },
    {
      text: "Mitglieder des Ordens von Teer und Feder durften weder Selenit berühren noch in Höhleneingängen stehen.",
      holds: (scene) =>
        scene.weaponOf("celadon").material !== "Selenit" &&
        scene.locationOf("celadon").id !== "cave",
    },
    {
      text: "Wer töten würde, weil die Schwingungen nicht stimmten, hatte eine schwere Waffe.",
      holds: (scene) =>
        scene.weaponOf(scene.driven("vibes").id).weight === "heavy",
    },
    {
      text: "Wer das UFO stehlen wollte, war Linkshänder.",
      holds: (scene) => scene.driven("ufo").hand === "left",
    },
    {
      text: "Entweder hatte Dr. Seashell, Zahnarzt, einen Selenitstab mitgebracht, oder er war im Höhleneingang.",
      holds: (scene) =>
        (scene.weaponOf("seashell").id === "wand") !==
        (scene.locationOf("seashell").id === "cave"),
    },
    {
      text: "Kräuterkundige Onyx hatte einen pseudowissenschaftlichen Apparat mitgebracht.",
      holds: (scene) => scene.weaponOf("onyx").id === "apparatus",
    },
  ],
  body: {
    text: "Die Leiche des Touristen wurde in einem weißen Transporter gefunden.",
    location: "van",
  },
  solution: {
    celadon: { weapon: "watch", location: "crater", motive: "ufo" },
    umber: { weapon: "cauldron", location: "cave", motive: "vibes" },
    onyx: { weapon: "apparatus", location: "gift-shop", motive: "cult" },
    seashell: { weapon: "wand", location: "van", motive: "experiment" },
  },
  murderer: "seashell",
  hints: [
    {
      text: "Deductive Logico betrachtete die Wolken über ihnen, und anhand ihrer Formen konnte er feststellen, dass Dr. Seashell, Zahnarzt, doch einen Selenitstab gekauft hatte.",
      book: true,
      marks: [{ a: "seashell", b: "wand", value: "check" }],
    },
    {
      text: 'Die Nachricht, Wort für Wort entwürfelt: "EIN LÖWE WAR IM KRATER."',
    },
    {
      text: "Onyx hat den Apparat, Umber den Kessel. Celadon gehört zum Orden von Teer und Feder und darf kein Selenit berühren: Sie hatte die Taschenuhr, Seashell den Selenitstab.",
      marks: [
        { a: "umber", b: "cauldron", value: "check" },
        { a: "onyx", b: "apparatus", value: "check" },
        { a: "celadon", b: "watch", value: "check" },
      ],
    },
    {
      text: "Der Parquonen-Messer ist der Apparat, die Plüschpuppe gibt es im Souvenirladen: Dort war Onyx. Seashell hat den Selenitstab - das Entweder-oder sagt dann: Er war nicht im Höhleneingang. Celadon darf dort auch nicht stehen, also war Umber im Höhleneingang.",
      marks: [
        { a: "onyx", b: "gift-shop", value: "check" },
        { a: "apparatus", b: "gift-shop", value: "check" },
        { a: "umber", b: "cave", value: "check" },
      ],
    },
    {
      text: "Im Krater war ein Löwe: Celadon oder Umber - Umber ist in der Höhle, also Celadon. Seashell bleibt der Regierungstransporter.",
      marks: [
        { a: "celadon", b: "crater", value: "check" },
        { a: "seashell", b: "van", value: "check" },
      ],
    },
    {
      text: "Die Sekte befahl einer Jungfrau: Onyx. Die schlechten Schwingungen hatte jemand mit schwerer Waffe - jetzt nur noch Umber mit dem Kessel. Das UFO wollte ein Linkshänder stehlen: Celadon. Seashell bleibt das Experiment.",
      marks: [
        { a: "onyx", b: "cult", value: "check" },
        { a: "umber", b: "vibes", value: "check" },
        { a: "cauldron", b: "vibes", value: "check" },
        { a: "celadon", b: "ufo", value: "check" },
        { a: "seashell", b: "experiment", value: "check" },
      ],
    },
    {
      text: "Der weiße Transporter ist der Regierungstransporter: Dr. Seashell tötete dort mit dem Selenitstab, als wissenschaftliches Experiment.",
      marks: [
        { a: "wand", b: "experiment", value: "check" },
        { a: "watch", b: "crater", value: "check" },
        { a: "watch", b: "ufo", value: "check" },
        { a: "crater", b: "ufo", value: "check" },
        { a: "cauldron", b: "cave", value: "check" },
        { a: "cave", b: "vibes", value: "check" },
        { a: "apparatus", b: "cult", value: "check" },
        { a: "gift-shop", b: "cult", value: "check" },
        { a: "wand", b: "van", value: "check" },
        { a: "van", b: "experiment", value: "check" },
      ],
    },
  ],
};
