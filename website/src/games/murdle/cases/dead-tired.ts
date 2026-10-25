/**
 * Case 20, "Dead Tired": a body in Logico's own office.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). The bold clue names the
 * weapon, not the place; the murderer is whoever had it.
 * The photographed pages print neither hint nor solution; the solver found the
 * only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const DEAD_TIRED: Case = {
  id: "dead-tired",
  number: 20,
  title: "Todmüde",
  story:
    "Nach der Lesereise schleppte sich Deductive Logico zurück in sein Büro. Es war klein, wirkte aber größer, weil er es so ordentlich hielt. Leider brachten vier Dinge sein Ordnungssystem durcheinander: die drei Leute, die auf ihn warteten, und die Leiche zwischen ihnen.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "bluski",
      name: "Kosmonaut Bluski",
      icon: "\u{1F468}‍\u{1F680}",
      description:
        "Ein ehemaliger sowjetischer Raumfahrer, dessen Blut rot fließt. Klar, das ist normal - aber bei ihm ist es patriotisch.",
      heightCm: 188,
      hand: "left",
      eyes: "darkBrown",
      hair: "black",
    },
    {
      id: "crimson",
      name: "Dr. Crimson",
      icon: "\u{1FA7A}",
      description:
        "Sie ist die klügste Ärztin, die sie je getroffen hat - sagt sie selbst, und wahrscheinlich hat sie recht. Ja, sie springt Fallschirm, aber wenn etwas schiefgeht, berechnet sie genau, wie sie fallen muss.",
      heightCm: 175,
      hand: "left",
      eyes: "green",
      hair: "red",
    },
    {
      id: "coffee",
      name: "General Coffee",
      icon: "☕",
      description:
        "Ein Espressokenner, der einmal einen Kaffee so stark gebrüht hat, dass er einen Mann umbrachte.",
      heightCm: 183,
      hand: "right",
      eyes: "darkBrown",
      hair: "bald",
    },
  ],
  locations: [
    {
      id: "main-office",
      name: "das Hauptbüro",
      icon: "\u{1FA91}",
      description:
        "Ein Schreibtisch, Regale voller Logikbücher und ein Fenster mit Blick auf eine Backsteinmauer.",
      indoors: true,
    },
    {
      id: "closet",
      name: "der Wandschrank",
      icon: "\u{1F6AA}",
      description:
        "Alle Kleider von Logico sind sorgfältig von A bis Z sortiert.",
      indoors: true,
    },
    {
      id: "waiting-room",
      name: "das Wartezimmer",
      icon: "\u{1F6CE}️",
      description:
        "Logico hat keine Empfangskraft, also gibt es nur eine Klingel und ein Schild: BITTE WARTEN.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "diploma",
      name: "ein Diplom des Deduction College",
      icon: "\u{1F4DC}",
      description:
        "Mit seinem schweren Eichenrahmen kann man richtig Schaden anrichten. Und da heißt es, ein Logikabschluss sei nutzlos.",
      weight: "heavy",
    },
    {
      id: "gloves",
      name: "Lederhandschuhe",
      icon: "\u{1F9E4}",
      description:
        "Hüte dich vor Leuten mit Lederhandschuhen. Sie haben schon eine Kuh getötet: Wer ist der Nächste?",
      weight: "light",
    },
    {
      id: "magnifier",
      name: "eine Lupe",
      icon: "\u{1F50D}",
      description:
        "Damit kann man Hinweise finden, das Kleingedruckte lesen oder ein kleines Feuer entfachen.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Kosmonaut Bluski hasste die Person, die eine Lupe mitgebracht hatte.",
      holds: (scene) => scene.holder("magnifier").id !== "bluski",
    },
    {
      text: "Eine Lupe wurde neben einem Fenster mit Blick auf eine Backsteinmauer entdeckt.",
      holds: (scene) =>
        scene.locationOf(scene.holder("magnifier").id).id === "main-office",
    },
    {
      text: "Dr. Crimson wurde hinter alphabetisch sortierten Jacken gesehen.",
      holds: (scene) => scene.locationOf("crimson").id === "closet",
    },
    {
      text: "Lederhandschuhe waren ganz sicher nicht im Wartezimmer.",
      holds: (scene) =>
        scene.locationOf(scene.holder("gloves").id).id !== "waiting-room",
    },
  ],
  body: {
    text: "Der Mord wurde mit einem Logikabschluss begangen.",
    weapon: "diploma",
  },
  solution: {
    bluski: { weapon: "diploma", location: "waiting-room" },
    crimson: { weapon: "gloves", location: "closet" },
    coffee: { weapon: "magnifier", location: "main-office" },
  },
  murderer: "bluski",
  hints: [
    {
      text: "Logico hängte sein Diplom des Deduction College gut sichtbar im Wartezimmer auf. Dafür brauchte er keine mysteriöse Notiz.",
      book: true,
      marks: [{ a: "diploma", b: "waiting-room", value: "check" }],
    },
    {
      text: "Alphabetisch sortierte Jacken hängen im Wandschrank: Dort war Dr. Crimson.",
    },
    {
      text: "Die Lupe lag am Fenster mit Blick auf die Backsteinmauer, also im Hauptbüro. Crimson hatte sie also nicht, und Bluski hasste ihren Besitzer: General Coffee hatte die Lupe und war im Hauptbüro.",
      marks: [
        { a: "magnifier", b: "main-office", value: "check" },
        { a: "coffee", b: "magnifier", value: "check" },
        { a: "coffee", b: "main-office", value: "check" },
      ],
    },
    {
      text: "Für Kosmonaut Bluski bleibt das Wartezimmer. Die Lederhandschuhe waren nicht dort, also hatte Dr. Crimson sie und Bluski das Diplom.",
      marks: [
        { a: "bluski", b: "waiting-room", value: "check" },
        { a: "bluski", b: "diploma", value: "check" },
      ],
    },
    {
      text: "Der Logikabschluss ist das Diplom des Deduction College: Kosmonaut Bluski erschlug das Opfer damit im Wartezimmer.",
      marks: [
        { a: "crimson", b: "gloves", value: "check" },
        { a: "crimson", b: "closet", value: "check" },
        { a: "gloves", b: "closet", value: "check" },
      ],
    },
  ],
};
