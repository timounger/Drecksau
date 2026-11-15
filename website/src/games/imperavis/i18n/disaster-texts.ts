/**
 * The words of the natural disasters and of the choice of events and
 * peoples: warnings, blows and ends in the news, the protection in the
 * building window, and the new-game menu.
 *
 * @module
 */
import type { DisasterKind, EventOption } from "@/games/imperavis/engine/types";

/** The warning a disaster sends ahead. */
export const DISASTER_WARNINGS: Readonly<
  Record<DisasterKind, (island: string, seconds: number) => string>
> = {
  flood: (island, seconds) =>
    `Hochwasser droht auf ${island}: In ${seconds} s treten die Wasser über die Ufer. Deiche halten es ab, Pumpstationen legen das Land schnell trocken.`,
  drought: (island, seconds) =>
    `Dürre droht auf ${island}: In ${seconds} s verdorren die Felder. Bewässerung rettet die Ernte, ein Brunnen hilft zum Teil.`,
  locusts: (island, seconds) =>
    `Ein Heuschreckenschwarm zieht auf ${island} zu (${seconds} s). Vorräte und Höfe auf anderen Inseln helfen über die Zeit.`,
  tsunami: (island, seconds) =>
    `Das Meer zieht sich vor ${island} zurück - in ${seconds} s trifft eine Flutwelle die Küste! Hafenmauern und Deiche schützen.`,
  blizzard: (_, seconds) =>
    `Ein Schneesturm zieht auf (${seconds} s): Straßen werden zuschneien, Schiffe langsamer, die Häuser brauchen Holz oder Kohle zum Heizen.`,
};

/** The news when a disaster strikes. */
export const DISASTER_STRIKES: Readonly<
  Record<DisasterKind, (island: string) => string>
> = {
  flood: (island) =>
    `Überschwemmung auf ${island}! Betriebe im Wasser stehen still, Karren kommen nicht durch.`,
  drought: (island) =>
    `Dürre auf ${island}: Höfe und Plantagen ohne Wasser tragen nur noch ein Drittel.`,
  locusts: (island) =>
    `Heuschrecken über ${island}! Felder kahlgefressen, Getreide und Brot im Lager angefressen.`,
  tsunami: (island) =>
    `Die Flutwelle trifft ${island}! Schwere Schäden an der Küste - die Gebäude jetzt reparieren.`,
  blizzard: () =>
    "Schneesturm! Straßen verschneit, Schiffe langsamer, Häuser verbrennen Holz und Kohle.",
};

/** The news when a disaster is over. */
export const DISASTER_OVER: Readonly<
  Record<DisasterKind, (island: string) => string>
> = {
  flood: (island) => `Das Wasser auf ${island} ist abgelaufen.`,
  drought: (island) => `Die Dürre auf ${island} ist vorbei.`,
  locusts: (island) =>
    `Der Schwarm hat ${island} verlassen - die kahlen Felder wachsen nach.`,
  tsunami: (island) => `Die See vor ${island} hat sich beruhigt.`,
  blizzard: () => "Der Schneesturm hat sich gelegt.",
};

/** The events a new game can switch off, as named in the menu. */
export const EVENT_OPTION_NAMES: Readonly<Record<EventOption, string>> = {
  fire: "Feuer",
  plague: "Seuche",
  storm: "Sturm auf See",
  badHarvest: "Missernte",
  goodHarvest: "Gute Ernte",
  pirateRaids: "Piratenüberfälle",
  factionEvents: "Ereignisse der Völker und Piraten",
  flood: "Überschwemmung",
  drought: "Dürre",
  locusts: "Heuschreckenplage",
  tsunami: "Tsunami",
  blizzard: "Schneesturm",
};

/** One line on each event for the menu. */
export const EVENT_OPTION_HINTS: Readonly<Record<EventOption, string>> = {
  fire: "Brände in Gebäuden; die Feuerwache löscht.",
  plague: "Bewohner sterben ohne Medikus.",
  storm: "Sturmwetter beschädigt Schiffe auf See; aus ist es nur Regen.",
  badHarvest: "Felder tragen eine Weile weniger.",
  goodHarvest: "Felder tragen eine Weile mehr.",
  pirateRaids: "Piraten greifen Schiffe und Kontore an.",
  factionEvents:
    "Hungersnot, Epidemie, Karawane, Schatzkarte, Meuterei und mehr bei Völkern und Piraten.",
  flood: "Fluss- und Küstenland läuft voll; Deich und Pumpstation schützen.",
  drought: "Im Sommer verdorren die Felder; Bewässerung schützt.",
  locusts: "Ein Schwarm frisst Höfe kahl; Vorräte und andere Inseln helfen.",
  tsunami:
    "Selten: eine Welle trifft eine Küste; Hafenmauer und Deich schützen.",
  blizzard:
    "Im Winter: Straßen und Schiffe langsam, Häuser brauchen Brennholz.",
};

/** Texts of the menu, the pause menu and the windows. */
export const DISASTER_TEXTS = {
  eventsTitle: "Ereignisse und Katastrophen",
  eventsHint:
    "Was in diesem Spiel geschehen kann. Katastrophen kommen frühestens nach 20 Minuten und nie während des geführten Einstiegs.",
  eventsGroup: "Ereignisse",
  disastersGroup: "Katastrophen",
  all: "Alle",
  none: "Keine",
  peacefulRaids: "Im friedlichen Spiel gibt es keine Piratenüberfälle.",
  noPiratesRaids: "Ohne Piraten gibt es keine Überfälle.",
  peoplesTitle: "Völker",
  peoplesHint:
    "Abgewählte Völker bekommen keine Insel. Deine Inseln bleiben gleich viele.",
  pirates: "Piraten",
  piratesHint:
    "Krähenfels, auf großer Karte auch das Schwarzriff. Ohne Piraten: keine Überfälle, kein Schwarzer Markt, keine Taverne.",
  chosen: (count: number, all: number) => `${count} von ${all}`,
  pauseTitle: "In diesem Spiel",
  pauseEvents: "Ereignisse",
  pausePeoples: "Völker",
  pauseNone: "keine",
  pauseRaidsPeaceful: "Piratenüberfälle: aus (friedliches Spiel)",
  threats: "Gefahren",
  threatGuarded: (guards: string) => `geschützt durch ${guards}`,
  threatPartly: (guards: string) => `zum Teil geschützt durch ${guards}`,
  threatOpen: "ungeschützt",
  threatStock: "nur Vorräte und andere Inseln helfen",
  threatFuel: "braucht im Schneesturm Holz oder Kohle",
  guards: (count: number) =>
    count === 1
      ? "Schützt 1 gefährdetes Gebäude in Reichweite."
      : `Schützt ${count} gefährdete Gebäude in Reichweite.`,
  previewGuards: (count: number) =>
    count === 1 ? "schützt hier 1 Gebäude" : `schützt hier ${count} Gebäude`,
  raging: (name: string, seconds: number) => `${name}: noch ${seconds} s`,
  coming: (name: string, seconds: number) => `${name} in ${seconds} s`,
  fuel: (percent: number) => `Brennmaterial im Schneesturm: ${percent} %`,
} as const;
