/**
 * Case 32, "The Case of the Lab with Legal Issues": a mad scientist's
 * assistant killed in his laboratory.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium). The murderer lies,
 * everyone else tells the truth; there is no body clue - the liar is the
 * murderer. "Beneath a sign that says OFF" means the giant lever. The
 * photographed pages print neither hint nor solution; the solver found the
 * only one, and the hints are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const THE_CASE_OF_THE_LAB_WITH_LEGAL_ISSUES: Case = {
  id: "the-case-of-the-lab-with-legal-issues",
  number: 32,
  title: "Der Fall des Labors mit Rechtsproblemen",
  story:
    "Als Nächstes schickte das Ermittlungsinstitut Deductive Logico in das Labor eines waschechten verrückten Wissenschaftlers. Genauer gesagt war der Wissenschaftler nicht verrückt, sondern rasend vor Wut: Sein Assistent war getötet worden, und seine Forschung lag auf Eis.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "mauve",
      name: "Vizepräsidentin Mauve",
      icon: "\u{1F97D}",
      description:
        "Eine Vizepräsidentin von TekCo Futures. Wenn sie dich bittet, ihr Metaversum zu betreten: Nichts wie weg!",
      heightCm: 173,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "taurus",
    },
    {
      id: "applegreen",
      name: "Schulleiter Applegreen",
      icon: "\u{1F468}‍\u{1F3EB}",
      description:
        "Ein strenger Schulleiter, was alles angeht - außer damit, mit einem Mord davonzukommen. Seine Hände sind immer voller Kreide.",
      heightCm: 180,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "libra",
    },
    {
      id: "slate",
      name: "Kapitänin Slate",
      icon: "\u{1F469}‍\u{1F680}",
      description:
        "Eine echte Astronautin. Die erste Frau, die die dunkle Seite des Mondes umrundet hat - und die erste, die verdächtigt wurde, ihren Kopiloten ermordet zu haben.",
      heightCm: 165,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "aquarius",
    },
  ],
  locations: [
    {
      id: "rooftop",
      name: "das Dach",
      icon: "⚡",
      description: "Ein riesiger Blitzableiter hängt an Millionen loser Kabel.",
      indoors: false,
    },
    {
      id: "lever",
      name: "der riesige Hebel",
      icon: "\u{1F39A}️",
      description:
        'Jedes Labor eines verrückten Wissenschaftlers hat einen riesigen Hebel, den man von "AUS" auf "AN" umlegen kann.',
      indoors: true,
    },
    {
      id: "operating-table",
      name: "der Operationstisch",
      icon: "\u{1FA7B}",
      description:
        "Mit den Lederriemen kann man hier einen Menschen festschnallen - oder ein Monster.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "brain",
      name: "ein Gehirn im Glas",
      icon: "\u{1F9E0}",
      description: "Das Schlimmste daran: Es suppt überall heraus.",
      weight: "heavy",
    },
    {
      id: "magnet",
      name: "ein riesiger Magnet",
      icon: "\u{1F9F2}",
      description:
        "Halte ihn von deinen Zahnfüllungen fern. Er erzeugt ein starkes elektromagnetisches Feld.",
      weight: "medium",
    },
    {
      id: "ladle",
      name: "eine Suppenkelle",
      icon: "\u{1F944}",
      description:
        "Auch ein verrückter Wissenschaftler liebt Suppe. Vor allem Tomatencremesuppe.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: 'Die kleinste verdächtige Person wurde gesehen, wie sie unter einem Schild mit der Aufschrift "AUS" herumhing.',
      holds: (scene: Scene): boolean => {
        const shortest = Math.min(
          ...["mauve", "applegreen", "slate"].map(
            (id) => scene.suspect(id).heightCm,
          ),
        );
        return scene.at("lever").heightCm === shortest;
      },
    },
    {
      text: "Vizepräsidentin Mauve kam nie in die Nähe des Operationstischs.",
      holds: (scene) => scene.locationOf("mauve").id !== "operating-table",
    },
  ],
  statements: [
    {
      by: "mauve",
      text: "Kapitänin Slate hat einen riesigen Magneten mitgebracht.",
      holds: (scene) => scene.weaponOf("slate").id === "magnet",
    },
    {
      by: "applegreen",
      text: "Ein Gehirn im Glas war nicht auf dem Dach.",
      holds: (scene) =>
        scene.locationOf(scene.holder("brain").id).id !== "rooftop",
    },
    {
      by: "slate",
      text: "Das ist so klar wie der Mond: Schulleiter Applegreen hat ein Gehirn im Glas mitgebracht.",
      holds: (scene) => scene.weaponOf("applegreen").id === "brain",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    mauve: { weapon: "magnet", location: "rooftop" },
    applegreen: { weapon: "brain", location: "operating-table" },
    slate: { weapon: "ladle", location: "lever" },
  },
  murderer: "mauve",
  hints: [
    {
      text: 'Deductive Logico rief Inspektor Irratino hinzu. Der hatte achtundvierzig Stunden gefastet und offenbarte dem sehr ungeduldigen Logico dann, was er in seiner Hungervision gesehen hatte: "Ein Tropfen ekliger Schleim klebte an einem Lederriemen."',
      book: true,
    },
    {
      text: 'Die Kleinste ist Kapitänin Slate (1,65 m). Das Schild "AUS" hängt am riesigen Hebel - dort war sie.',
    },
    {
      text: "Mauve war nicht am Operationstisch, also auf dem Dach. Schulleiter Applegreen war am Operationstisch.",
      marks: [
        { a: "mauve", b: "rooftop", value: "check" },
        { a: "applegreen", b: "operating-table", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Schulleiter Applegreen, war das Gehirn auf dem Dach, also bei Mauve. Dann stimmt auch Slates Aussage nicht, Applegreen habe es gehabt. Zwei Lügner gibt es nicht.",
      marks: [{ a: "applegreen", b: "brain", value: "check" }],
    },
    {
      text: "Lügt Kapitänin Slate, hatte Applegreen das Gehirn nicht. Applegreen sagt die Wahrheit: Auch Mauve auf dem Dach hatte es nicht. Und laut Mauve hatte Slate den Magneten. Dann hätte niemand das Gehirn. Das geht nicht.",
      marks: [{ a: "mauve", b: "magnet", value: "check" }],
    },
    {
      text: "Also lügt Vizepräsidentin Mauve: Slate hatte nicht den Magneten. Applegreen hatte das Gehirn, Slate die Suppenkelle - und Mauve ist die Mörderin, mit dem riesigen Magneten auf dem Dach.",
      marks: [
        { a: "slate", b: "ladle", value: "check" },
        { a: "magnet", b: "rooftop", value: "check" },
        { a: "brain", b: "operating-table", value: "check" },
        { a: "slate", b: "lever", value: "check" },
        { a: "ladle", b: "lever", value: "check" },
      ],
    },
  ],
};
