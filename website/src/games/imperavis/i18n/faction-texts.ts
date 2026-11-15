/**
 * The words of the foreign peoples and pirate bands: their portraits in
 * words, the stages of a relation, moods, the window's sections and the
 * reasons a deal is turned down.
 *
 * @module
 */
import type { Stage } from "@/games/imperavis/engine/factions";
import type { Perk } from "@/games/imperavis/engine/factions-data";
import type {
  CultureId,
  FactionNoteKind,
  NationMood,
  PirateMood,
} from "@/games/imperavis/engine/types";

/** A line on each faction, for its window. */
export const CULTURE_TEXTS: Readonly<Record<CultureId, string>> = {
  qasirah:
    "Ein reiches, diplomatisches und traditionsbewusstes Sultanat. Es verkauft Gewürze, Seide und Parfüm, kauft Luxus- und Industriewaren, schätzt regelmäßigen Handel und verabscheut Piraterie auf seinen Routen.",
  shogunara:
    "Ein diszipliniertes, militärisch geordnetes Kaiserreich. Es legt Wert auf Zuverlässigkeit und langfristige Verträge, handelt Tee, Porzellan und Seide und schränkt den Handel ein, wenn man es enttäuscht.",
  valdoria:
    "Eine geschäftstüchtige Handelsrepublik mit dem größten Hafen weit und breit. Sie handelt Wein, Glas, Olivenöl und Luxusmöbel, kauft fast jeden Überschuss und belohnt hohe Umsätze.",
  skeld:
    "Ein raues, unabhängiges Seefahrervolk. Es handelt ehrlich und direkt mit Pelzen, Fisch, Wolle, Eisen und Seilen, baut robuste Schiffe und vergisst nie, wer ihm gegen Piraten half.",
  crows:
    "Die Piraten von Krähenfels hausen hinter dunklen Klippen und Kanonentürmen. Sie überfallen Handelsschiffe, nehmen Schutzgeld, betreiben einen Schwarzen Markt und vergeben in ihrer Taverne Aufträge.",
  blackreef:
    "Die Bruderschaft vom Schwarzriff ist kleiner als Krähenfels, aber nicht weniger gefährlich. Ihre Kapitäne jagen auf eigene Rechnung.",
};

/** Names of the stages of a relation. */
export const STAGE_NAMES: Readonly<Record<Stage, string>> = {
  hostile: "Feindselig",
  suspicious: "Misstrauisch",
  neutral: "Neutral",
  friendly: "Freundlich",
  allied: "Verbündet",
  trusted: "Vertrauensvoll",
};

/** Colours of the stages, as CSS. */
export const STAGE_COLORS: Readonly<Record<Stage, string>> = {
  hostile: "#ef4444",
  suspicious: "#f59e0b",
  neutral: "#d6d3d1",
  friendly: "#86efac",
  allied: "#4ade80",
  trusted: "#fde68a",
};

/** The bar colours of the stages, as classes. */
export const STAGE_BARS: Readonly<Record<Stage, string>> = {
  hostile: "bg-red-500",
  suspicious: "bg-amber-500",
  neutral: "bg-stone-300",
  friendly: "bg-green-300",
  allied: "bg-green-400",
  trusted: "bg-amber-200",
};

/** What a faction's mind is busy with, in words. */
export const MOOD_NAMES: Readonly<Record<NationMood | PirateMood, string>> = {
  idle: "Ruhig",
  producing: "Produziert",
  trading: "Handelt",
  negotiating: "Verhandelt",
  expanding: "Baut Schiffe",
  defending: "Verteidigt sich",
  recovering: "Erholt sich",
  patrolling: "Auf Patrouille",
  searching: "Sucht Beute",
  chasing: "Verfolgt ein Schiff",
  attacking: "Greift an",
  looting: "Plündert",
  returning: "Kehrt heim",
  repairing: "Repariert",
};

/** What each faction teaches, and what it does. */
export const PERK_TEXTS: Readonly<Record<NonNullable<Perk>, string>> = {
  perfumery:
    "Rezept der Parfümerie: ein neuer Betrieb macht aus Gewürzen und Glas Parfüm, das die oberen Schichten lieben.",
  lacquer:
    "Lackpanzerung: alle deine Schiffe bekommen 10 Prozentpunkte mehr Rüstung.",
  charter:
    "Handelsprivileg: 12 % bessere Preise in Valdoria und exklusive Lieferverträge mit 12 % besserem Preis.",
  knarr:
    "Bauplan der Skeld-Knarr: ein robuster, schwer gepanzerter Frachter für deine Werften.",
};

/**
 * The news of a faction's window; the first argument is who it concerns
 * ("Du" for the human), the line starts with it.
 */
export const NOTE_TEXTS: Readonly<
  Record<FactionNoteKind, (who: string, good: string, amount: number) => string>
> = {
  bought: (who, good, amount) => `${who}: ${amount} ${good} gekauft.`,
  sold: (who, good, amount) => `${who}: ${amount} ${good} verkauft.`,
  contract: (who, good, amount) =>
    `${who}: Liefervertrag über ${amount} ${good} geschlossen.`,
  contractCancelled: (who, good) =>
    `${who}: Liefervertrag über ${good} beendet.`,
  suspended: (who, good) => `${who}: Lieferung ${good} ausgesetzt.`,
  breach: (who, good) =>
    `${who}: Lieferung ${good} nicht erfüllt - Vertragsbruch.`,
  delivered: (who, good, amount) => `${who}: ${amount} ${good} geliefert.`,
  gift: (who, _good, amount) => `${who}: Geschenk von ${amount} Gold.`,
  demand: (who, _good, amount) =>
    amount > 0
      ? `${who}: Forderung erfüllt, ${amount} Gold gezahlt.`
      : `${who}: Forderung abgelehnt.`,
  support: (who) => `${who}: Kriegsschiffe laufen zur Hilfe aus.`,
  raid: (who, good, amount) =>
    amount > 0
      ? `${who || "Unser Schiff"}: Handelsschiff überfallen, ${amount} ${good} geraubt.`
      : `${who || "Unser Schiff"}: Handelsschiff überfallen, die Ladung blieb verschont.`,
  assault: (who, _good, amount) =>
    `${who}: ${amount} Piratenschiffe greifen das Kontor an.`,
  allyStrike: (who) =>
    `${who}: Verbündete Piraten greifen ein Kontor deines Kriegsgegners an.`,
  loot: (_who, _good, amount) => `Beute heimgebracht (${amount}).`,
  lostShip: () => "Ein eigenes Schiff ging verloren.",
  newShip: () => "Ein neues Schiff ist vom Stapel gelaufen.",
  protection: (who, _good, amount) =>
    `${who}: ${amount} Gold Schutzgeld gezahlt.`,
  protectionEnded: (who) => `${who}: Schutzvertrag beendet.`,
  market: (who, good, amount) =>
    `${who}: ${amount} ${good} auf dem Schwarzen Markt gekauft.`,
  unlock: (who) => `${who}: in die Kunst des Volkes eingeweiht.`,
  ceasefire: (who) => `${who}: Waffenstillstand.`,
  alliance: (who, _good, amount) =>
    amount > 0 ? `${who}: Bündnis geschlossen.` : `${who}: Bündnis beendet.`,
  war: (who) => `${who}: Feindschaft erklärt!`,
  aiTrade: (who, _good, amount) => `${who}: Handel für ${amount} Gold.`,
  treasure: (who, _good, amount) => `${who}: Schatz gehoben, ${amount} Gold.`,
  mutiny: () => "Meuterei! Ein neuer Kapitän führt die Bande.",
  trade: (who) => `${who}: Handelsbeziehungen aufgenommen.`,
};

/** Why a deal with a faction was turned down. */
export const FACTION_REFUSALS: Readonly<Record<string, string>> = {
  noTrade: "Erst Handelsbeziehungen aufnehmen.",
  atWar: "Ihr seid verfeindet.",
  storm: "Der Hafen ist nach dem Sturm geschlossen.",
  refuses: "Die Beziehung ist dafür zu schlecht.",
  already: "Besteht schon.",
  noShip: "Kein eigenes Schiff liegt im Hafen.",
  none: "Davon ist nichts zu haben.",
  notWanted: "Das wird hier nicht gekauft.",
  tooMany: "Höchstens zwei Verträge je Partner.",
  noContract: "Piraten schließen keine Lieferverträge.",
  noHelp: "Dieses Volk schickt keine Kriegsschiffe.",
  peaceful: "Im friedlichen Spiel nicht nötig.",
  busy: "Die Flotte ist noch unterwegs oder erholt sich.",
  noShips: "Es sind keine Kriegsschiffe da.",
  notAtWar: "Ihr seid nicht verfeindet.",
  tooSoon: "Zu früh - der Streit ist zu frisch.",
  noTreaty: "Es gibt keinen solchen Vertrag.",
  noPerk: "Hier gibt es nichts zu lernen.",
  closed: "Der Schwarze Markt hat gerade geschlossen.",
  noCargo: "Davon ist nichts an Bord.",
  noDemand: "Von Piraten fordert man kein Gold.",
  pirateWar:
    "Piraten kennen keinen Waffenstillstand - nur Schutzgeld hält sie fern, ein Bündnis beendet den Krieg.",
  allied: "Ihr seid verbündet - Schutzgeld ist nicht nötig.",
  notProven:
    "Die Piraten verbünden sich erst mit dir, wenn du andere Gegner schwer getroffen hast.",
  grudge:
    "Die Bande traut dir nicht: Ihre Meinung ist zu schlecht (versenkte Piratenschiffe wiegen schwer; Geschenke helfen).",
};

/** The window's words. */
export const FX = {
  peoples: "Völker und Piraten",
  overview: "Übersicht",
  harbourStop: (name: string): string => `${name} (Hafen, Handel)`,
  harbourStopHint:
    "Hafen eines Volkes oder der Piraten: Ausladen verkauft, Einladen kauft; die Grenze ist der Mindest- bzw. Höchstpreis je Einheit (0 = jeder Preis).",
  exotic: "Exotik (Waren fremder Völker)",
  noFactions:
    "Diese Welt stammt aus einer Zeit vor den fremden Völkern - hier gibt es keine.",
  tradeFirst:
    "Noch kein Handel - Handelsbeziehungen nimmst du in der Diplomatie auf.",
  tableHint:
    "Spalten: Bestand (davon zu haben), Preis je Einheit. Kaufen und Verkaufen gehen nur mit einem eigenen Schiff im Hafen; die Preise folgen Bestand und Bedarf.",
  surplus: "Kauft auch jeden anderen Überschuss, zu geringerem Preis.",
  harbourWindow: "Hafen",
  leader: "Herrscher",
  island: "Heimatinsel",
  relation: "Beziehung",
  mood: "Lage",
  strength: "Militärische Stärke",
  ships: "Schiffe",
  gold: "Schatz",
  traded: "Handel mit dir",
  offer: "Angebot",
  demand: "Nachfrage",
  price: "Preis",
  stock: "Bestand",
  buy: "Kaufen",
  sell: "Verkaufen",
  amount: "Menge",
  inHarbour: "Im Hafen",
  noShipHere:
    "Kein eigenes Schiff im Hafen - schicke eines her (Rechtsklick auf die Insel).",
  cargoOf: "Ladung",
  diplomacy: "Diplomatie",
  openTrade: "Handelsbeziehungen aufnehmen",
  gift: "Geschenk",
  contract: "Liefervertrag",
  contracts: "Lieferverträge",
  contractSell: "Du lieferst",
  contractBuy: "Sie liefern",
  contractEvery: "alle 10 Minuten",
  propose: "Vertrag schließen",
  cancel: "Kündigen",
  suspended: "ausgesetzt",
  deliveries: "Lieferungen",
  breaches: "Brüche",
  support: "Militärische Unterstützung anfragen",
  hunt: "Gemeinsam Piraten jagen",
  ceasefire: "Waffenstillstand anbieten",
  alliance: "Bündnisvertrag",
  cancelAlliance: "Bündnis kündigen",
  learn: "Ihre Kunst lernen",
  learned: "Gelernt",
  missions: "Aufträge",
  noMissions: "Gerade kein Auftrag.",
  deliver: "Abgeben",
  news: "Nachrichten",
  noNews: "Noch nichts geschehen.",
  piracy: "Piratenaktivität",
  knownFleet: "Bekannte Flotte",
  fleetHidden: "Nur grob bekannt - Nachrichten kaufen zeigt die ganze Flotte.",
  intel: "Nachrichten kaufen",
  protection: "Schutzgeld",
  protectionNone: "Kein Schutzvertrag",
  protectionUntil: (minutes: number): string =>
    `Geschützt, noch ${minutes} min`,
  protectionSign: (gold: string): string =>
    `Schutz für 30 min (${gold} Gold, alle 10 min)`,
  protectionEnd: "Schutz beenden",
  demanded: "Sie fordern Schutzgeld!",
  market: "Schwarzer Markt",
  marketClosed: "Geschlossen - die Schmuggler sind unterwegs.",
  marketUntil: (minutes: number): string => `Wechselt in ${minutes} min`,
  danger: "Gefahrenstufe",
  dangerLevels: ["Ruhig", "Wachsam", "Gefährlich", "Sehr gefährlich"] as const,
  tavern: "Taverne",
  treasureMaps: "Deine Schatzkarten",
  treasureAt: (x: number, y: number): string => `Schatz bei ${x}, ${y}`,
  ceasefireUntil: (minutes: number): string =>
    `Waffenstillstand, noch ${minutes} min`,
  supportUntil: (minutes: number): string =>
    `Kriegsschiffe helfen, noch ${minutes} min`,
  peaceful:
    "Friedliches Spiel: hier wird nicht überfallen, Handel und Markt bleiben.",
  islandHint: "Klick auf die Insel öffnet ihr Hafenfenster.",
  show: "Zeigen",
  lastNews: "Zuletzt",
  reasons: "Gründe",
  sellAll: "Alles",
  perkCost: (gold: string): string => `Kosten ${gold} Gold`,
  toDiplomacy: "Diplomatie",
  toDiplomacyTip:
    "Geschenke, Forderungen, Verträge, Bündnis und Schutzgeld stehen im Diplomatie-Fenster.",
  protectionInDiplomacy: "Schutzgeld zahlst und beendest du in der Diplomatie.",
  openHarbour: "Hafen öffnen",
  openHarbourTip:
    "Öffnet das Hafenfenster: Handel, Angebot und Nachfrage, Aufträge, bei Piraten Schwarzer Markt und Taverne.",
  toIsland: "Zur Insel",
  kindRival: "Rivale",
  kindNation: "Volk",
  kindPirates: "Piraten",
  filterAll: "Alle",
  filterRivals: "Rivalen",
  filterNations: "Völker",
  filterPirates: "Piraten",
  statusWar: "Krieg",
  statusPeace: "Frieden",
  statusTrade: "Handelsbeziehung",
  statusAlliance: "Bündnis",
  statusProtected: "Krieg - Schutzgeld bezahlt",
  statusPeaceful: "Friedliches Spiel",
  pirateWarHint:
    "Mit Piraten herrscht immer Krieg - es gibt keinen Waffenstillstand und keinen Frieden. Schutzgeld hält ihre Räuber fern, solange du zahlst; nur ein Bündnis beendet den Krieg.",
  pirateAllyHint:
    "Verbündet: Die Piraten überfallen dich nicht mehr und greifen deine Kriegsgegner an. Wer sie angreift, bricht das Bündnis.",
  allianceProgress: (
    sunk: number,
    needSunk: number,
    taken: number,
    needTaken: number,
  ): string =>
    `${sunk} von ${needSunk} Gegnerschiffen versenkt oder ${taken} von ${needTaken} Kontor eines Rivalen erobert bzw. zerstört`,
  allianceLocked:
    "Gesperrt: Die Piraten verbünden sich erst, wenn du andere Gegner schwer getroffen hast (Schiffe von Rivalen oder Völkern, nicht von Piraten).",
  allianceOpen: (least: number): string =>
    `Bedingung erfüllt - sie nehmen an, wenn ihre Meinung über dich mindestens ${least} ist (versenkte Piratenschiffe drücken sie).`,
  offerAlliance: "Bündnis anbieten",
  endAlliance: "Bündnis beenden",
  ceasefireNation: "Waffenstillstand anbieten",
  demandTip:
    "Sie zahlen aus ihrem eigenen Gold, wenn du stark genug bist - als Freund eher, als Feind seltener; sonst lehnen sie mit Grund ab.",
  harbourHint:
    "Handel, Angebot und Nachfrage, Aufträge und bei Piraten der Schwarze Markt stehen im Hafenfenster (Klick auf die Insel).",
  tradeTo: (name: string): string => `Hafen von ${name}`,
  atHarbour: (name: string): string => `Liegt im Hafen von ${name}`,
  islandOf: (name: string): string => `Heimat: ${name}`,
};
