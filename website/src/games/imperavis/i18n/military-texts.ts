/**
 * What IMPERAVIS says about shipyards, ships, fleets, barracks and land
 * units: names, descriptions, the labels of their windows and of the
 * military overview.
 *
 * @module
 */
import type {
  Formation,
  ShipKind,
  ShipRole,
  UnitCategory,
  UnitKind,
} from "@/games/imperavis/engine/types";
import type { UnitLock } from "@/games/imperavis/engine/troops";

/** Names of the unit kinds. */
export const UNIT_NAMES: Readonly<Record<UnitKind, string>> = {
  militia: "Miliz",
  line: "Linieninfanterie",
  grenadier: "Grenadiere",
  elite: "Eliteinfanterie",
  musketeer: "Musketenschützen",
  sharpshooter: "Scharfschützen",
  artillery: "Artillerie",
  cavalry: "Kavallerie",
  pioneer: "Pioniere",
  medic: "Sanitäter",
  scout: "Aufklärer",
};

/** One line on each unit kind. */
export const UNIT_INFO: Readonly<Record<UnitKind, string>> = {
  militia:
    "Günstig und schnell ausgebildet, aber schwach - für die erste Verteidigung.",
  line: "Die ausgewogene Standardtruppe für Angriff und Verteidigung.",
  grenadier:
    "Werfen Granaten: hoher Schaden, besonders gegen Gebäude, Türme und eingegrabene Gegner.",
  elite: "Viele Lebenspunkte, gute Panzerung, harte Schläge - teuer und spät.",
  musketeer: "Schießen auf mittlere Entfernung; im Nahkampf nur halb so stark.",
  sharpshooter:
    "Große Reichweite, hoher Einzelschaden, langsames Nachladen; im Nahkampf schwach.",
  artillery:
    "Flächenschaden um das Ziel, stark gegen Gebäude und Stellungen, langsam und braucht Schutz.",
  cavalry:
    "Sehr schnell für Vorstöße, aber gegen Stellungen (haltende Truppen, Türme, Kontore) schwach.",
  pioneer:
    "Reparieren eigene Gebäude im Umkreis im Feld - auch unter Beschuss.",
  medic: "Heilen verwundete eigene Einheiten in der Nähe.",
  scout:
    "Schnell, große Sichtweite; Einheiten bei ihnen sehen Feinde früher, und in ihrem Umkreis zeigen Minimap und Weltkarte feindliche Truppen und Schiffe.",
};

/** Names of the barracks' shelves. */
export const CATEGORY_NAMES: Readonly<Record<UnitCategory, string>> = {
  infantry: "Infanterie",
  ranged: "Fernkampf",
  heavy: "Schwere Infanterie",
  special: "Spezialisten",
};

/** Names of the formations. */
export const FORMATION_NAMES: Readonly<Record<Formation, string>> = {
  line: "Linie",
  block: "Block",
  loose: "Locker",
};

/** What each formation does. */
export const FORMATION_TIPS: Readonly<Record<Formation, string>> = {
  line: "Linie: nebeneinander; Fernkämpfer schießen 15 % stärker.",
  block: "Block: dicht beieinander; 15 % mehr Panzerung im Nahkampf.",
  loose: "Locker: weit verteilt; nur halber Flächenschaden der Artillerie.",
};

/** Names of the ship roles. */
export const ROLE_NAMES: Readonly<Record<ShipRole, string>> = {
  trade: "Handelsschiffe",
  war: "Kriegsschiffe",
  other: "Andere",
};

/** One line on each ship kind. */
export const SHIP_INFO: Readonly<Record<ShipKind, string>> = {
  cog: "Kleiner, früher Frachtsegler - günstig, aber wenig Laderaum.",
  hulk: "Schneller Segler mit mehr Laderaum für weite Routen.",
  galleon: "Großer, moderner Frachter mit sehr viel Laderaum, aber langsam.",
  steamer: "Dampfschiff: schnell bei jedem Wind und mit dem größten Laderaum.",
  warship: "Kleines, schnelles Kanonenboot - früh verfügbar, leicht bewaffnet.",
  frigate: "Schnelle, gut gepanzerte Fregatte mit starker Breitseite.",
  lineShip:
    "Schweres Linienschiff mit zwei Geschützdecks - langsam, aber vernichtend.",
  cruiser:
    "Gepanzerter Schlachtkreuzer mit Dampfantrieb und weittragenden Geschützen.",
  trader: "Der freie Händler.",
  pirate: "Ein Piratenschiff.",
};

/** Why a unit is not open yet. */
export const UNIT_LOCK_TEXTS: Readonly<Record<UnitLock, string>> = {
  tier: "Schicht fehlt",
  research: "Forschung fehlt",
  building: "Gebäude fehlt",
};

/** Every other label of the military windows. */
export const MIL = {
  // Shipyard
  yardTitle: "Werft",
  slip: "Auf der Helling",
  queue: "Warteschlange",
  queueEmpty: "Keine Aufträge - wähle unten ein Schiff.",
  orders: (count: number, most: number) => `${count} / ${most} Aufträge`,
  order: "In Auftrag geben",
  cancel: "Abbrechen",
  refund: (words: string) => `Abbrechen gibt zurück: ${words}`,
  workers: "Arbeitskräfte",
  noWorkers:
    "Keine Arbeitskräfte - die Werft braucht Arbeiter auf der Insel; ohne sie ruht der Bau.",
  noWorkersShort: "ruht, keine Arbeitskräfte",
  waiting: "Fertig - wartet auf freies Wasser vor der Werft",
  paused: "Angehalten",
  progress: (percent: number, seconds: number) =>
    `${percent} % - noch etwa ${seconds} s`,
  buildTime: "Bauzeit",
  cost: "Kosten",
  missing: "Fehlt",
  unlock: "Freischaltung",
  unlockTier: (tier: string) => `Ab Schicht ${tier}`,
  unlockResearch: (name: string) => `Forschung ${name}`,
  locked: "Gesperrt",
  stats: {
    speed: "Tempo",
    hold: "Laderaum",
    hp: "LP",
    armour: "Panzerung",
    guns: "Geschütze",
    damage: "Schaden",
    range: "Reichweite",
    reload: "Nachladen",
    troops: "Truppen",
    upkeep: "Unterhalt",
    crew: "Besatzung",
  },
  holdValue: (slots: number, size: number) => `${slots} x ${size}`,
  perSecond: (value: number) => `${value} Felder/s`,
  seconds: (value: number) => `${value} s`,
  percent: (value: number) => `${value} %`,
  noGuns: "keine",
  // Ship window
  task: "Aufgabe",
  position: "Position",
  owner: "Zugehörigkeit",
  fleet: "Flotte",
  noFleet: "keine",
  taskNames: {
    idle: "Wartet",
    move: "Fährt zum Ziel",
    route: "Fährt eine Handelsroute",
    land: "Bringt Truppen an Land",
    attack: "Greift an",
    patrol: "Patrouilliert",
    escort: "Eskortiert",
  },
  attackTarget: (name: string) => `Greift an: ${name}`,
  escortTarget: (name: string) => `Eskortiert: ${name}`,
  commands: "Befehle",
  move: "Bewegen",
  moveTip: "Ziel auf der Karte setzen (am Handy: tippen)",
  attack: "Angreifen",
  attackTip:
    "Rechtsklick auf ein feindliches Schiff oder Gebäude - oder hier ein Ziel in der Nähe wählen",
  attackNearest: (name: string) => `Angreifen: ${name}`,
  noTargets: "Kein Feind in der Nähe (nur im Krieg und gegen Piraten).",
  patrol: "Patrouillieren",
  patrolTip:
    "Wähle den zweiten Punkt auf der Karte; das Schiff fährt hin und her.",
  escort: "Eskortieren",
  escortTip: "Bleibt bei einem eigenen Schiff und verteidigt es.",
  stop: "Anhalten",
  fleetNew: "Flotte bilden",
  fleetTip:
    "Bildet aus den gewählten Schiffen eine Flotte, die gemeinsam fährt",
  fleetName: (index: number) => `Flotte ${index}`,
  fleetDisband: "Flotte auflösen",
  fleetSelect: "Flotte wählen",
  fleetMove: "Flotte bewegen",
  loadKontor: "Baustoffe für ein Kontor laden",
  loadKontorTip: (words: string) =>
    `Lädt ${words} aus dem Lager dieses Kontors`,
  loadKontorHave: "Die Baustoffe für ein Kontor sind an Bord.",
  loadKontorShort: (words: string) => `Im Lager fehlen: ${words}`,
  loadKontorRoom: "Kein Platz an Bord für die Baustoffe",
  load: "Waren laden",
  loadHint: "Laden und Entladen: Registerkarte „Ladung“.",
  dockHint: "Zum Laden und Entladen an einem eigenen Kontor anlegen.",
  unload: "Entladen",
  routeNew: "Route erstellen",
  routeNewTip: "Neue Handelsroute zwischen deinen Kontoren, mit diesem Schiff",
  routeStart: "Route starten",
  routeStop: "Route stoppen",
  // Barracks
  barracksTitle: "Kaserne",
  trainOne: "Ausbilden",
  trainFive: "5 ausbilden",
  pause: "Ausbildung anhalten",
  resume: "Ausbildung fortsetzen",
  trainQueue: "Ausbildungsschlange",
  trainEmpty: "Niemand in Ausbildung - wähle unten eine Einheit.",
  waitingDoor: "Fertig - wartet auf Platz vor der Kaserne",
  hereAndAll: (here: number, all: number) =>
    `Einheiten auf dieser Insel: ${here} (insgesamt ${all})`,
  unitStats: {
    attack: "Angriff",
    defence: "Verteidigung",
    hp: "LP",
    speed: "Tempo",
    range: "Reichweite",
    reload: "Nachladen",
    train: "Ausbildung",
    upkeep: "Unterhalt",
  },
  needsBuilding: (name: string) => `Braucht: ${name}`,
  // Units window
  formation: "Formation",
  hold: "Position halten",
  holdTip:
    "Eingraben: mehr Panzerung, Kavallerie hat es schwer; verfolgt niemanden",
  retreat: "Rückzug",
  retreatTip: "Zur nächsten eigenen Kaserne oder zum Kontor auf dieser Insel",
  patrolUnits: "Patrouille",
  patrolUnitsTip:
    "Wähle den zweiten Punkt auf der Karte; die Einheiten laufen hin und her.",
  attackUnitsTip:
    "Rechtsklick auf eine feindliche Einheit, ein Gebäude oder ein Schiff am Ufer",
  pickPatrol: "Patrouille: Zielpunkt wählen (Rechtsklick oder Esc bricht ab)",
  orderNames: {
    idle: "bereit",
    attack: "greift an",
    attackShip: "beschießt ein Schiff",
    patrol: "patrouilliert",
    hold: "hält Position",
    retreat: "zieht sich zurück",
  },
  byKind: "Nach Gattung",
  // Military overview
  military: "Militär",
  soldiers: "Einheiten",
  aboard: "an Bord",
  onLand: "an Land",
  groups: "Steuergruppen",
  noGroups: "Keine Steuergruppen (Strg plus Zahl speichert die Auswahl).",
  group: (key: number, count: number) => `Gruppe ${key}: ${count} Einheiten`,
  positions: "Positionen",
  training: "Ausbildung",
  shipOrders: "Werftaufträge",
  totalUpkeep: "Unterhalt Militär",
  capacities: "Kapazitäten",
  barracksSlots: (busy: number, free: number) =>
    `Kasernen: ${busy} Plätze belegt, ${free} frei`,
  yardSlots: (busy: number, free: number) =>
    `Werften: ${busy} Aufträge, ${free} frei`,
  troopRoom: (used: number, room: number) =>
    `Truppenplätze auf Schiffen: ${used} / ${room}`,
  fleets: "Flotten",
  noFleets: "Keine Flotten - wähle mehrere Schiffe und bilde eine Flotte.",
  warShips: "Kriegsschiffe",
  none: "keine",
  island: (name: string, count: number) => `${name}: ${count}`,
  focus: "Hinsehen",
  invested: "Wert des Militärs",
  investedValue: (gold: number) =>
    `${gold} Gold (Kosten aller Einheiten und Kriegsschiffe)`,
} as const;
