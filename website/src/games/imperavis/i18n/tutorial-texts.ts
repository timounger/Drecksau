/**
 * The words of the guided start: each task with its line, why it matters
 * and when the buildings it releases come free, and the labels of the task
 * window, the settle button and the messages.
 *
 * @module
 */
import {
  releaseStep,
  TUTORIAL_STEPS,
} from "@/games/imperavis/engine/tutorial-data";
import type {
  BuildingKind,
  TutorialStepId,
} from "@/games/imperavis/engine/types";

/** What the screen says about one task. */
export type TutorialStepText = {
  /** The task, short. */
  readonly title: string;
  /** What to do, one sentence. */
  readonly text: string;
  /** Why it matters, shown with the recommended building. */
  readonly why: string;
  /** When the buildings of the next task come free: after this one. */
  readonly after: string;
  /** What the count of the progress counts, or "" for none. */
  readonly unit: string;
};

/** The tasks. */
export const TUTORIAL_STEP_TEXTS: Readonly<
  Record<TutorialStepId, TutorialStepText>
> = {
  explore: {
    title: "Finde eine Insel",
    text: "Fahre mit deinem Schiff dicht an die Küste einer freien Insel: Schiff anklicken, dann Rechtsklick auf den Strand (am Handy: Ziel setzen).",
    why: "Dein Schiff trägt Gold, Bretter und Werkzeug für das erste Kontor - zuerst muss es an einer Küste liegen.",
    after: "Nach dem Erreichen einer Küste",
    unit: "",
  },
  settle: {
    title: "Besiedle die Insel",
    text: "Tippe auf „Insel besiedeln“ - oder setze das Kontor selbst über das Baumenü (Hafen) an die Küste nahe dem Schiff.",
    why: "Das Kontor macht die Insel zu deiner, lagert die Fracht des Schiffs und schickt Karren aus.",
    after: "Nach der Gründung des Kontors",
    unit: "",
  },
  wood: {
    title: "Errichte einen Holzfäller",
    text: "Setze einen Holzfäller an den Wald nahe dem Kontor.",
    why: "Holz ist der erste Rohstoff - daraus werden die Bretter für fast alle weiteren Bauten.",
    after: "Nach dem Bau des Holzfällers",
    unit: "",
  },
  road: {
    title: "Empfehlung: Straße zum Kontor",
    text: "Verbinde den Holzfäller mit einer Straße zum Kontor (Taste T). Ohne Straße holen die Karren das Holz auch übers Gelände - nur langsamer; nach kurzer Zeit geht es dann auch so weiter.",
    why: "Auf der Straße fahren Karren gut doppelt so schnell wie übers Gelände, durch Wald und über Fels noch mehr - mehr Waren kommen pünktlich im Lager an.",
    after:
      "Nach dem Straßenanschluss (oder der ersten Lieferung übers Gelände)",
    unit: "",
  },
  planks: {
    title: "Errichte ein Sägewerk",
    text: "Das Sägewerk macht aus Holz Bretter. Eine Straße zum Lager beschleunigt seine Karren.",
    why: "Bretter brauchst du für Häuser und fast jedes Gebäude - der Vorrat des Schiffs reicht nicht lange.",
    after: "Nach dem Bau des Sägewerks",
    unit: "",
  },
  houses: {
    title: "Baue Wohnhäuser",
    text: "Setze ein paar Wohnhäuser nahe dem Kontor; die ersten Bauern ziehen ein.",
    why: "Bewohner arbeiten in deinen Betrieben und zahlen Steuern.",
    after: "Nach den ersten Wohnhäusern",
    unit: "Häuser",
  },
  fish: {
    title: "Errichte eine Fischerei",
    text: "Die Fischerei steht an der Küste und fängt Fisch, die Nahrung deiner Bauern. Mit Straße kommt der Fisch schneller ins Lager.",
    why: "Bauern wollen Fisch - nur versorgte Häuser füllen sich.",
    after: "Nach dem Bau der Fischerei",
    unit: "",
  },
  centre: {
    title: "Marktplatz und Kapelle",
    text: "Baue einen Marktplatz und eine Kapelle so, dass ihre Reichweite deine Häuser erfasst.",
    why: "Waren erreichen die Häuser nur über den Markt, und Bauern wollen Markt und Kapelle in der Nähe.",
    after: "Nach Marktplatz und Kapelle",
    unit: "Gebäude",
  },
  grow: {
    title: "Lass die Siedlung wachsen",
    text: "Baue weitere Häuser in Reichweite von Markt und Kapelle und halte den Fisch am Laufen.",
    why: "Mit genug Einwohnern werden Schäferei und Weberei frei.",
    after: "Nach dem Wachstum der Siedlung",
    unit: "Einwohner",
  },
  cloth: {
    title: "Erste Kette: Wolle zu Stoff",
    text: "Die Schäferei liefert Wolle, die Weberei macht daraus Stoff. Eine Straße zum Lager hält die Kette flott.",
    why: "Deine Arbeiter wollen Stoff - ohne ihn bleiben sie unzufrieden.",
    after: "Nach Schäferei und Weberei",
    unit: "Gebäude",
  },
  workers: {
    title: "Aufstieg zu den Arbeitern",
    text: "Volle, gut versorgte Bauernhäuser steigen von selbst zu Arbeitern auf - gegen ein paar Bretter aus dem Lager.",
    why: "Arbeiter zahlen mehr Steuern und arbeiten in den Betrieben der nächsten Ketten.",
    after: "Nach den ersten Arbeitern",
    unit: "",
  },
  tavern: {
    title: "Ein Wirtshaus für die Arbeiter",
    text: "Arbeiter wollen ein Wirtshaus in der Nähe. Es wird mit wachsender Einwohnerzahl frei und kostet Ziegel - das Schiff hat einige mitgebracht.",
    why: "Damit ist die Einführung geschafft, danach steht dir das ganze Baumenü nach den normalen Regeln offen.",
    after: "Nach der Einführung",
    unit: "",
  },
};

/** The labels around the guided start. */
export const TUTORIAL = {
  menuOption: "Geführter Einstieg",
  menuHint:
    "Führt Schritt für Schritt von Schiff und erster Insel bis zur zweiten Schicht und gibt das Baumenü nach und nach frei. Jederzeit abschaltbar.",
  window: "Aufgabe",
  windowTip: "Die aktuelle Aufgabe der Einführung",
  step: (index: number, count: number) => `Schritt ${index} von ${count}`,
  progress: (done: number, total: number, unit: string) =>
    unit === "" ? `${done}/${total}` : `${done}/${total} ${unit}`,
  show: "Zeigen",
  showTip: "Öffnet die passende Kategorie im Baumenü",
  toIsland: "Zur Insel",
  toIslandTip:
    "Fährt die Kamera zu einer guten freien Insel und wählt dein Schiff",
  toShip: "Zum Schiff",
  toShipTip: "Wählt dein Schiff und fährt die Kamera hin",
  end: "Einführung beenden",
  endTip:
    "Beendet die Einführung für diese Partie - danach gelten nur noch die normalen Freischaltungen",
  endConfirm:
    "Einführung wirklich beenden? Das gilt für diese Partie endgültig, alle Gebäude folgen dann den normalen Regeln.",
  endYes: "Ja, beenden",
  endNo: "Weiter mit Einführung",
  collapse: "Aufgabe einklappen",
  expand: "Aufgabe aufklappen",
  recommended: "Empfohlen",
  recommendedTip: "Von der Einführung empfohlen",
  recommendedLine: (name: string, why: string) => `Empfohlen: ${name} - ${why}`,
  categoryTip: "Hier liegt das empfohlene Gebäude",
  categoryLocked: "Die Einführung gibt diese Kategorie später frei",
  findIslandFirst:
    "Finde zuerst mit deinem Schiff eine Insel - das Kontor wird an der Küste nahe dem Schiff gesetzt.",
  settle: "Insel besiedeln",
  settleTip: (island: string) =>
    `Gründet ein Kontor auf ${island} am nächsten freien Küstenplatz beim Schiff`,
  settleGold: "Nicht genug Gold für ein Kontor",
  settleCargo: (missing: string) =>
    `Das Schiff braucht noch ${missing} an Bord - am eigenen Kontor lädt „Baustoffe für ein Kontor laden“ sie ein`,
  settleNoSite: "Kein freier Küstenplatz für ein Kontor in Reichweite",
  settleOffer: (island: string) => `${island} liegt vor dem Bug`,
  done: (title: string) => `Aufgabe erledigt: ${title}`,
  released: (names: string) => `Neu im Baumenü: ${names}`,
  finished:
    "Einführung abgeschlossen - alle Gebäude stehen dir jetzt nach den normalen Regeln offen.",
  ended:
    "Einführung beendet - alle Gebäude folgen jetzt den normalen Freischaltungen.",
} as const;

/**
 * When the guided start releases a building, in words.
 *
 * @param kind - the building
 * @returns the line of its locked tile, as "after this task"
 */
export function tutorialLockText(kind: BuildingKind): string {
  const before = TUTORIAL_STEPS[Math.max(0, releaseStep(kind) - 1)];
  return TUTORIAL_STEP_TEXTS[before.id].after;
}
