/**
 * What Frost Fortress says: names, descriptions, the log and the buttons.
 *
 * @module
 */
import type { ResearchBranch } from "@/games/frost-fortress/engine/research";
import type {
  EnemyKind,
  MenuGroup,
  ResourceId,
  StructureKind,
} from "@/games/frost-fortress/engine/types";

/** Seconds in a minute, for the countdown. */
const MINUTE = 60;

/** Digits a seconds count is padded to. */
const SECOND_DIGITS = 2;

/** Names of the resources. */
export const RESOURCE_NAMES: Readonly<Record<ResourceId, string>> = {
  wood: "Holz",
  iron: "Eisen",
  stone: "Stein",
  energy: "Energie",
  food: "Nahrung",
  fuel: "Treibstoff",
};

/** Small symbols of the resources. */
export const RESOURCE_ICONS: Readonly<Record<ResourceId, string>> = {
  wood: "\u{1FAB5}",
  iron: "\u{2699}\u{FE0F}",
  stone: "\u{1FAA8}",
  energy: "\u{26A1}",
  food: "\u{1F356}",
  fuel: "\u{1F6E2}\u{FE0F}",
};

/** Names of the structures. */
export const STRUCTURE_NAMES: Readonly<Record<StructureKind, string>> = {
  hq: "Hauptquartier",
  warehouse: "Lagerhaus",
  barracks: "Kaserne",
  workshop: "Werkstatt",
  generator: "Generator",
  mine: "Mine",
  lumberCamp: "Holzfällerlager",
  lab: "Forschungszentrum",
  infirmary: "Krankenstation",
  machineGun: "MG-Turm",
  cannon: "Kanonenturm",
  sniper: "Scharfschützenturm",
  tesla: "Elektroturm",
  flamethrower: "Flammenwerfer",
  minefield: "Minenfeld",
  wall: "Verteidigungsmauer",
};

/** One line on what a structure does. */
export const STRUCTURE_INFO: Readonly<Record<StructureKind, string>> = {
  hq: "Herz der Festung. Erzeugt etwas von allem, lagert Vorräte und bestimmt, wie weit und wie hoch gebaut werden darf. Fällt es, ist das Spiel verloren.",
  warehouse: "Erhöht das Lager für jede Ressource.",
  barracks:
    "Bildet Soldaten aus (kostet Nahrung), die rund um die Kaserne Gegner abfangen.",
  workshop:
    "Macht aus Holz Treibstoff und repariert beschädigte Bauten in der Nähe von selbst.",
  generator: "Erzeugt Energie für Minen, Labor, Elektrotürme und Co.",
  mine: "Fördert Eisen und Stein - muss auf einem Erz- oder Steinvorkommen stehen.",
  lumberCamp:
    "Fällt Holz und jagt etwas Nahrung - je mehr Wald in der Nähe, desto mehr.",
  lab: "Erforscht neue Technologien. Mehr und bessere Labore forschen schneller.",
  infirmary:
    "Heilt Soldaten in der Nähe und lässt die Kaserne schneller ausbilden.",
  machineGun:
    "Schnelles Dauerfeuer auf einzelne Ziele. Günstig und zuverlässig.",
  cannon: "Langsame Granaten mit Flächenschaden - gut gegen Gruppen.",
  sniper:
    "Große Reichweite, großer Schaden, zielt immer auf den stärksten Gegner.",
  tesla:
    "Blitz springt auf mehrere Gegner und betäubt sie. Braucht Energie je Schuss.",
  flamethrower:
    "Kurze Reichweite, Flammenkegel, setzt Gegner in Brand. Verbraucht Treibstoff.",
  minefield:
    "Versteckte Minen explodieren unter Gegnern. Leere Minen lassen sich per Reparatur neu legen.",
  wall: "Hält Gegner auf und lenkt ihren Weg. Ziehen mit gedrückter Maus baut eine Reihe.",
};

/** Names of the enemies. */
export const ENEMY_NAMES: Readonly<Record<EnemyKind, string>> = {
  raider: "Plünderer",
  soldier: "Soldat",
  heavy: "Schwerer Soldat",
  demolisher: "Sprengkommando",
  siege: "Belagerungsfahrzeug",
  boss: "Frostkoloss",
};

/** What the enemies do. */
export const ENEMY_INFO: Readonly<Record<EnemyKind, string>> = {
  raider: "Schnell und schwach, stiehlt Vorräte aus Gebäuden.",
  soldier: "Schießt auf mittlere Entfernung auf alles in Reichweite.",
  heavy: "Gepanzert und zäh, trifft hart.",
  demolisher: "Rennt zu Türmen und Mauern und sprengt sich in die Luft.",
  siege: "Beschießt Türme aus großer Entfernung mit Granaten.",
  boss: "Riesig, gepanzert, erschüttert den Boden und ruft Verstärkung.",
};

/** Names of the build menu tabs. */
export const GROUP_NAMES: Readonly<Record<MenuGroup, string>> = {
  base: "Gebäude",
  production: "Produktion",
  defense: "Verteidigung",
};

/** Names and texts of the research projects. */
export const RESEARCH_TEXTS: Readonly<
  Record<string, { readonly name: string; readonly info: string }>
> = {
  ballistics: { name: "Ballistik", info: "Schaltet den Kanonenturm frei." },
  explosives: { name: "Sprengstoffe", info: "Schaltet Minenfelder frei." },
  optics: {
    name: "Zielfernrohre",
    info: "Schaltet den Scharfschützenturm frei.",
  },
  thermo: { name: "Thermochemie", info: "Schaltet den Flammenwerfer frei." },
  highVoltage: { name: "Hochspannung", info: "Schaltet den Elektroturm frei." },
  ammo1: { name: "Hartkernmunition", info: "Alle Türme +15 % Schaden." },
  ammo2: { name: "Uranmunition", info: "Alle Türme weitere +15 % Schaden." },
  rapid: {
    name: "Schnellladesystem",
    info: "Alle Türme feuern 20 % schneller.",
  },
  frostRounds: {
    name: "Frostgeschosse",
    info: "Treffer verlangsamen Gegner kurz um 30 %.",
  },
  armor1: {
    name: "Verstärkte Panzerung",
    info: "Türme, Mauern und Minenfelder +25 % Lebenspunkte.",
  },
  armor2: {
    name: "Verbundpanzerung",
    info: "Verteidigung weitere +25 % Lebenspunkte.",
  },
  fortress: {
    name: "Festungsbau",
    info: "Verteidigungsanlagen können eine Stufe höher ausgebaut werden.",
  },
  production: { name: "Effiziente Förderung", info: "Alle Produktion +25 %." },
  insulation: {
    name: "Isolierung",
    info: "Schneesturm und Kältewelle bremsen die Produktion viel weniger.",
  },
  machinery: {
    name: "Baumaschinen",
    info: "Bauen 50 % schneller und ein Bautrupp mehr.",
  },
  fieldRepair: {
    name: "Feldreparatur",
    info: "Reparaturen kosten weniger, Werkstätten reparieren schneller.",
  },
  outposts: { name: "Außenposten", info: "Baugebiet +5 Felder Radius." },
  floodlights: {
    name: "Flutlichter",
    info: "Nachts verlieren Türme kaum noch Reichweite.",
  },
  thermal: {
    name: "Wärmebildoptik",
    info: "Im Schneesturm verlieren Türme weniger Reichweite.",
  },
};

/** Names of the research branches. */
export const BRANCH_NAMES: Readonly<Record<ResearchBranch, string>> = {
  weapons: "Waffen",
  firepower: "Feuerkraft",
  armor: "Panzerung",
  economy: "Wirtschaft",
  sight: "Sicht",
};

/** Why something cannot be placed. */
export const PLACE_PROBLEMS = {
  outside: "Außerhalb der Karte",
  terrain: "Hier kann nicht gebaut werden (Fels, Wald oder Eis)",
  occupied: "Der Platz ist belegt",
  radius: "Außerhalb des Baugebiets - Hauptquartier ausbauen",
  deposit: "Eine Mine muss auf Erz oder Stein stehen",
  trees: "Zu wenig Wald in der Nähe",
  enemies: "Gegner zu nah",
  cost: "Nicht genug Ressourcen",
  locked: "Noch nicht freigeschaltet",
} as const;

/** Every label of the game screen. */
export const FROST_TEXTS = {
  title: "Frost Fortress",
  tagline: "Baue im ewigen Winter eine Festung, die jeder Welle standhält.",
  settings: "Einstellungen",
  statistics: "Statistik",
  fullscreen: "Vollbild",
  wave: (number: number) => `Welle ${number}`,
  noWaveYet: "Noch keine Welle",
  base: "Basis",
  power: "Energie",
  powerShort: (made: number, used: number) =>
    `+${made.toFixed(1)} / -${used.toFixed(1)}`,
  storage: (limit: number) => `Lager: ${limit}`,
  perSecond: (rate: number) => `${rate >= 0 ? "+" : ""}${rate.toFixed(1)}/s`,
  countdown: (seconds: number) =>
    `${Math.floor(seconds / MINUTE)}:${String(Math.floor(seconds % MINUTE)).padStart(SECOND_DIGITS, "0")}`,
  nextWave: "Nächste Welle",
  waveRunning: (left: number) => `Angriff läuft - ${left} Gegner`,
  callWave: "Welle jetzt rufen",
  callWaveHint: "Früher rufen bringt einen Bonus",
  bossWarning: "Boss!",
  speed: "Tempo",
  pause: "Pause",
  cheat: "Cheat-Modus",
  buildLevel: "Stufe:",
  cheatOn:
    "Cheat an: alles freigeschaltet, unendlich Ressourcen, keine Bauzeiten, Tempo 10x und 100x. Diese Partie zählt für keine Bestwerte.",
  cheatOff: "Cheat ausschalten",
  endless: "∞",
  research: "Forschung",
  researchNone: "Keine Forschung aktiv",
  researchAll: "Alles erforscht",
  researchNoLab: "Forschungszentrum bauen (ab HQ-Stufe 2)",
  researchOpen: "Forschungsbaum",
  researchTitle: "Forschungsbaum",
  researchStart: "Erforschen",
  researchRunning: "Läuft",
  researchDone: "Erforscht",
  researchCancel: "Abbrechen",
  researchNeeds: (names: string) => `Benötigt: ${names}`,
  close: "Schließen",
  day: "Tag",
  dusk: "Dämmerung",
  night: "Nacht",
  storm: "Schneesturm",
  clear: "Klar",
  sight: (percent: number) => `Sicht ${percent} %`,
  menu: "Menü",
  save: "Speichern",
  load: "Laden",
  newGame: "Neues Spiel",
  newGameConfirm:
    "Wirklich ein neues Spiel beginnen? Der aktuelle Stand geht verloren (außer er ist gespeichert).",
  saved: "Gespeichert",
  savedAt: (time: string) => `Spielstand vom ${time}`,
  noSave: "Kein gespeicherter Spielstand",
  loaded: "Spielstand geladen",
  autosave: "Automatisch gespeichert",
  build: "Bauen",
  locked: "Gesperrt",
  needsHq: (level: number) => `Ab HQ-Stufe ${level}`,
  needsResearch: (name: string) => `Forschung: ${name}`,
  level: (level: number) => `Stufe ${level}`,
  levelOf: (level: number, max: number) => `Stufe ${level} / ${max}`,
  hp: "Lebenspunkte",
  upgrade: "Ausbauen",
  upgradeMax: "Höchste Stufe",
  upgradeCapped: "Erst das Hauptquartier ausbauen",
  repair: "Reparieren",
  repairNothing: "Unbeschädigt",
  rearm: "Minen neu legen",
  repairAll: "Alles reparieren",
  repairing: "Wird repariert",
  demolish: "Abreißen",
  demolishConfirm: "Wirklich abreißen? Es gibt die Hälfte der Kosten zurück.",
  cancelBuild: "Bau abbrechen",
  move: "Verschieben",
  moveHint: "Neuen Platz wählen - Rechtsklick bricht ab",
  underConstruction: "Im Bau",
  waitingBuilder: "Wartet auf einen Bautrupp",
  upgrading: "Wird ausgebaut",
  builders: (busy: number, all: number) => `Bautrupps: ${busy} / ${all}`,
  damage: "Schaden",
  range: "Reichweite",
  rate: "Schüsse/s",
  charges: "Minen",
  soldiers: "Soldaten",
  produces: "Produziert",
  consumes: "Verbraucht",
  tiles: (count: number) => `${count.toFixed(1)} Felder`,
  expedition: "Erkundung aussenden",
  expeditionHint: "Ein Trupp sucht in der Wildnis nach Vorräten",
  expeditionAuto: "Automatisch erneut aussenden",
  expeditionAutoHint:
    "Sobald der Trupp zurück ist und Nahrung und Treibstoff reichen, zieht er wieder los.",
  expeditionWaiting: "(wartet auf Vorräte)",
  expeditionOut: (seconds: number) =>
    `Erkundung unterwegs - ${Math.ceil(seconds)} s`,
  nothingSelected: "Nichts ausgewählt",
  selectHint:
    "Links ein Gebäude wählen und auf die Karte setzen. Auf ein Gebäude klicken zeigt Infos, Ausbau und Reparatur.",
  controlsHint:
    "WASD/Pfeile: Karte bewegen · Mausrad: Zoom · Rechtsklick: abbrechen",
  touchHint: "Tippen: wählen/bauen · Ziehen: Karte · zwei Finger: Zoom",
  enemies: "Gegner",
  basePanel: "Bauen",
  infoPanel: "Info",
  offerTitle: "Händlerkarawane",
  offer: (give: string, get: string) => `Tausch: ${give} gegen ${get}`,
  accept: "Annehmen",
  decline: "Ablehnen",
  gameOverTitle: "Das Hauptquartier ist gefallen",
  gameOverText: (wave: number, kills: number) =>
    `Deine Festung hielt bis Welle ${wave}. ${kills} Gegner besiegt.`,
  gameOverNew: "Neue Festung bauen",
  gameOverLoad: "Spielstand laden",
  effects: {
    coldSnap: "Kältewelle",
    aurora: "Polarlicht",
    blackout: "Generatorausfall",
  },
  // Settings page
  settingsTitle: "Frost Fortress - Einstellungen",
  settingsSubtitle: "Wird in diesem Browser gespeichert und gilt ab sofort.",
  backToGame: "Zurück zum Spiel",
  speedTitle: "Spieltempo zu Beginn",
  speedHint:
    "Mit welchem Tempo ein Spiel startet. Im Spiel jederzeit umschaltbar.",
  soundTitle: "Ton",
  soundHint: "Schüsse, Explosionen, Bau- und Warnsignale.",
  soundOn: "An",
  soundOff: "Aus",
  edgeTitle: "Kanten-Scrollen",
  edgeHint:
    "Die Karte bewegt sich, wenn die Maus an den Rand des Spielfelds kommt.",
  modeTitle: "Spielmodus",
  modeHint:
    "Bei „Freies Bauen“ kommen keine Wellen und keine Überfälle von selbst. Gegner und verbündete Truppen ruft man rechts in der Leiste, eine ganze Welle unten mit „Welle jetzt rufen“.",
  modeWaves: "Wellen",
  modeFree: "Freies Bauen",
  freeBuildTitle: "Freies Bauen",
  freeBuildHint:
    "Gegner kommen nur, wenn du sie rufst - so stark wie in der aktuellen Welle.",
  freeBuildWaiting: "Freies Bauen",
  callAllies: "Verbündete rufen (+5)",
  rangeTitle: "Reichweite der Verteidigung",
  rangeHint:
    "Wie weit Türme schießen. Normal ist die kleinste Reichweite; höher stellen macht die Festung deutlich stärker. Minenfelder bleiben gleich.",
  rangeNormal: "Normal",
  rangeFactor: (factor: number) => `${String(factor).replace(".", ",")}x`,
  numbersTitle: "Schadenszahlen",
  numbersHint: "Zeigt über getroffenen Gegnern, wie viel Schaden ankam.",
  autosaveTitle: "Automatisch speichern",
  autosaveHint:
    "Speichert regelmäßig und nach jeder Welle, damit nach dem Neuladen weitergespielt werden kann.",
  on: "An",
  off: "Aus",
  // Statistics card
  statsTitle: "Festungs-Bilanz",
  statBestWave: "Höchste Welle",
  statKills: "Besiegte Gegner",
  statBosses: "Besiegte Bosse",
  statBuilt: "Gebaute Anlagen",
  statWaves: "Überstandene Wellen",
  statGames: "Gefallene Festungen",
} as const;

/** Messages of the log. */
export const LOG = {
  welcome:
    "Willkommen im ewigen Winter. Baue Holzfäller, Mine und Generator - die erste Welle kommt bald.",
  built: (name: string): string => `${name} fertiggestellt.`,
  summoned: (name: string, count: number): string =>
    `Gerufene Gegner rücken an: ${count}x ${name}.`,
  allies: (count: number): string =>
    `${count} verbündete Soldaten bewachen das Hauptquartier.`,
  upgraded: (name: string, level: number): string =>
    `${name} auf Stufe ${level} ausgebaut.`,
  destroyed: (name: string): string => `${name} wurde zerstört!`,
  waveStart: (wave: number): string => `Welle ${wave} greift an!`,
  bossWave: (wave: number): string =>
    `Welle ${wave}: Ein Frostkoloss nähert sich!`,
  waveClear: (wave: number): string =>
    `Welle ${wave} abgewehrt - Nachschub ist eingetroffen.`,
  bossDown: "Der Frostkoloss ist gefallen!",
  researchDone: (name: string): string => `Forschung abgeschlossen: ${name}.`,
  newEnemy: (name: string): string => `Neuer Gegnertyp gesichtet: ${name}.`,
  supplyDrop: "Ein Versorgungsabwurf ist gelandet - anklicken zum Einsammeln!",
  coldSnap: "Kältewelle! Die Produktion sinkt eine Weile.",
  oreVein: "Die Bergleute sind auf eine reiche Ader gestoßen.",
  trader: "Eine Händlerkarawane bietet einen Tausch an.",
  raid: "Ein Plündertrupp schleicht sich an!",
  aurora: "Polarlicht! Die Forschung kommt doppelt so schnell voran.",
  blackout: "Generatorausfall! Die Energieproduktion bricht ein.",
  survivors: "Überlebende haben die Festung erreicht und bringen Vorräte mit.",
  stormStart: "Ein Schneesturm zieht auf - die Sicht wird schlechter.",
  stormEnd: "Der Schneesturm legt sich.",
  nightFalls: "Die Nacht bricht herein. Türme sehen weniger weit.",
  expeditionBack: "Die Erkundung ist zurück und bringt Vorräte.",
  expeditionLost:
    "Die Erkundung geriet in einen Hinterhalt und kehrte mit leeren Händen zurück.",
  traded: "Tausch abgeschlossen.",
  stolen: "Plünderer stehlen Vorräte!",
  hqHit: "Das Hauptquartier wird angegriffen!",
  noPower: "Zu wenig Energie - Gebäude arbeiten langsamer.",
  gameOver: "Das Hauptquartier wurde zerstört.",
  early: (bonus: number): string =>
    `Welle früh gerufen: +${bonus} Holz und Eisen.`,
};
