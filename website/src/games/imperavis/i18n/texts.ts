/**
 * What IMPERAVIS says: names of goods, buildings, tiers, ships, seasons and
 * weather, the reasons something cannot be done, and every label of the
 * screens.
 *
 * @module
 */
import {
  FOUND_RANGE,
  KONTOR_KIT,
  type PlacementIssue,
} from "@/games/imperavis/engine/placement";
import { YARD_ORDERS } from "@/games/imperavis/engine/ships-data";
import { DRILL_ORDERS } from "@/games/imperavis/engine/units-data";
import type {
  BuildingCategory,
  DiplomacyAnswer,
  IncidentKind,
  MissionKind,
  MissionState,
  Personality,
  RelationReason,
  ResearchId,
  Treaty,
  BuildingKind,
  GoodCategory,
  GoodId,
  HouseState,
  MapSize,
  ProducerStatus,
  Season,
  ShipKind,
  WeatherKind,
} from "@/games/imperavis/engine/types";

/** Seconds in a minute, for times shown. */
const SECONDS_PER_MINUTE = 60;

/** Names of the goods. */
export const GOOD_NAMES: Readonly<Record<GoodId, string>> = {
  wood: "Holz",
  planks: "Bretter",
  stone: "Steinquader",
  clay: "Lehm",
  bricks: "Ziegel",
  ore: "Erz",
  coal: "Kohle",
  iron: "Eisen",
  tools: "Werkzeug",
  fish: "Fisch",
  grain: "Getreide",
  flour: "Mehl",
  bread: "Brot",
  wool: "Wolle",
  cloth: "Stoff",
  clothing: "Kleidung",
  malt: "Malz",
  beer: "Bier",
  grapes: "Trauben",
  wine: "Wein",
  quartz: "Quarzsand",
  glass: "Glas",
  instruments: "Instrumente",
  tobacco: "Tabak",
  cigars: "Tabakwaren",
  pearls: "Perlen",
  jewelry: "Schmuck",
  weapons: "Musketen",
  cannons: "Kanonen",
  engines: "Dampfmaschinen",
};

/** A small symbol per good. */
export const GOOD_ICONS: Readonly<Record<GoodId, string>> = {
  wood: "\u{1FAB5}",
  planks: "\u{1F9F1}",
  stone: "\u{1FAA8}",
  clay: "\u{1F7EB}",
  bricks: "\u{1F9F1}",
  ore: "\u{26CF}\u{FE0F}",
  coal: "\u{26AB}",
  iron: "\u{1F529}",
  tools: "\u{1F6E0}\u{FE0F}",
  fish: "\u{1F41F}",
  grain: "\u{1F33E}",
  flour: "\u{1F9C2}",
  bread: "\u{1F35E}",
  wool: "\u{1F411}",
  cloth: "\u{1F9F6}",
  clothing: "\u{1F457}",
  malt: "\u{1F33E}",
  beer: "\u{1F37A}",
  grapes: "\u{1F347}",
  wine: "\u{1F377}",
  quartz: "\u{1F3D6}\u{FE0F}",
  glass: "\u{1FA9F}",
  instruments: "\u{1F52D}",
  tobacco: "\u{1F343}",
  cigars: "\u{1F6AC}",
  pearls: "\u{1F9AA}",
  jewelry: "\u{1F48D}",
  weapons: "\u{2694}\u{FE0F}",
  cannons: "\u{1F4A3}",
  engines: "\u{2699}\u{FE0F}",
};

/** Names of the good categories. */
export const GOOD_CATEGORY_NAMES: Readonly<Record<GoodCategory, string>> = {
  raw: "Rohstoff",
  material: "Baustoff",
  intermediate: "Zwischenprodukt",
  food: "Bedarfsgut",
  luxury: "Luxusgut",
};

/** Names of the buildings. */
export const BUILDING_NAMES: Readonly<Record<BuildingKind, string>> = {
  kontor: "Handelskontor",
  warehouse: "Lagerhaus",
  house: "Wohnhaus",
  market: "Marktplatz",
  chapel: "Kapelle",
  tavern: "Wirtshaus",
  school: "Schule",
  bathhouse: "Badehaus",
  woodcutter: "Holzfäller",
  sawmill: "Sägewerk",
  fishery: "Fischerhütte",
  sheepFarm: "Schäferei",
  grainFarm: "Getreidehof",
  vineyard: "Weingut",
  mill: "Mühle",
  bakery: "Bäckerei",
  malthouse: "Mälzerei",
  brewery: "Brauerei",
  weaver: "Weberei",
  tailor: "Schneiderei",
  claypit: "Lehmgrube",
  brickworks: "Ziegelei",
  quarry: "Steinbruch",
  oreMine: "Erzmine",
  charcoal: "Köhlerei",
  smelter: "Schmelzhütte",
  toolmaker: "Werkzeugschmiede",
  winery: "Kelterei",
  shipyard: "Werft",
  watchtower: "Wachturm",
  barracks: "Kaserne",
  battery: "Küstenbatterie",
  fireStation: "Feuerwache",
  doctor: "Medikus",
  scholarHouse: "Gelehrtenhaus",
  university: "Universität",
  theatre: "Theater",
  sandPit: "Quarzgrube",
  glassworks: "Glashütte",
  instrumentMaker: "Feinmechanik",
  tobaccoFarm: "Tabakplantage",
  tobacconist: "Tabakdreherei",
  pearlDiver: "Perlentaucher",
  goldsmith: "Goldschmied",
  gunsmith: "Büchsenmacherei",
  foundry: "Geschützgießerei",
  engineWorks: "Maschinenbau",
  decorTree: "Baum",
  flowerBed: "Blumenbeet",
  lantern: "Laterne",
  plaza: "Gepflasterter Platz",
  park: "Park",
  fountain: "Brunnen",
  statue: "Statue",
};

/** One line on what a building does. */
export const BUILDING_INFO: Readonly<Record<BuildingKind, string>> = {
  kontor:
    "Gründet eine Insel, lagert Waren, empfängt Schiffe und den Händler und erweitert das Baugebiet weit. Muss an die Küste; ein Schiff in der Nähe bezahlt die Baustoffe. Je Insel ein Kontor - das Baugebiet wächst mit Lagerhäusern und Marktplätzen.",
  warehouse:
    "Mehr Lagerplatz und Karren; holt Waren von Betrieben in seiner Reichweite und erweitert das Baugebiet.",
  house:
    "Hier wohnen die Bürger. Steigt auf, wenn alle Bedürfnisse erfüllt sind.",
  market:
    "Versorgt Häuser in Reichweite mit Waren und erweitert das Baugebiet.",
  chapel: "Glaube für Bauern und alle höheren Schichten.",
  tavern: "Geselligkeit - Bedürfnis ab den Arbeitern.",
  school: "Bildung - Bedürfnis ab den Handwerkern.",
  bathhouse: "Gesundheit und Ansehen - Bedürfnis der Kaufleute.",
  woodcutter: "Fällt Holz im Wald ringsum.",
  sawmill: "Macht aus Holz Bretter.",
  fishery: "Fängt Fisch an der Küste.",
  sheepFarm: "Schafe geben Wolle.",
  grainFarm: "Baut Getreide an - nur auf fruchtbaren Inseln.",
  vineyard: "Baut Trauben an - nur wo Wein gedeiht.",
  mill: "Mahlt Getreide zu Mehl.",
  bakery: "Backt Brot aus Mehl.",
  malthouse: "Macht Malz aus Getreide.",
  brewery: "Braut Bier aus Malz.",
  weaver: "Webt Stoff aus Wolle.",
  tailor: "Näht Kleidung aus Stoff.",
  claypit: "Gräbt Lehm - muss an einem Lehmvorkommen stehen.",
  brickworks: "Brennt Ziegel aus Lehm.",
  quarry: "Bricht Steinquader - muss an einem Steinvorkommen stehen.",
  oreMine: "Fördert Erz - muss an einem Erzvorkommen stehen.",
  charcoal: "Köhlt Holz zu Kohle.",
  smelter: "Schmilzt Erz mit Kohle zu Eisen.",
  toolmaker: "Schmiedet Werkzeug aus Eisen.",
  winery: "Keltert Wein aus Trauben - das Luxusgut der Kaufleute.",
  shipyard: "Baut Schiffe. Muss an die Küste.",
  watchtower:
    "Schießt auf feindliche Schiffe und Soldaten in Reichweite. Nur im Krieg und gegen Piraten.",
  barracks:
    "Bildet Soldaten aus. Sie verteidigen die Insel, steigen in deine Schiffe und landen an feindlichen Inseln, um das Kontor zu stürmen.",
  battery:
    "Schwere Kanonen an der Küste: große Reichweite, viel Schaden, dicke Mauern.",
  fireStation:
    "Löscht Brände in Reichweite nach wenigen Sekunden. Ohne Feuerwache brennt ein Gebäude lange und schwer.",
  doctor:
    "Schützt Häuser in Reichweite vor Seuchen; Bedürfnis der Ingenieure und höher.",
  scholarHouse:
    "Gelehrte sammeln Forschungspunkte. Wähle im Fenster Forschung, was sie erforschen.",
  university:
    "Viele Forschungspunkte; Bedürfnis der gehobenen Schicht und höher.",
  theatre: "Kultur - Bedürfnis der wohlhabenden Bürger.",
  sandPit: "Gräbt Quarzsand am Strand - muss an die Küste.",
  glassworks: "Schmilzt Quarzsand mit Kohle zu Glas.",
  instrumentMaker: "Baut aus Glas und Eisen feine Instrumente.",
  tobaccoFarm: "Baut Tabak an - nur wo Tabak gedeiht.",
  tobacconist: "Dreht Tabak zu Tabakwaren.",
  pearlDiver: "Taucht nach Perlen - an der Küste mit offenem Wasser.",
  goldsmith: "Fertigt Schmuck aus Perlen und Werkzeug.",
  gunsmith:
    "Fertigt Musketen aus Eisen und Holz - für Musketenschützen, Grenadiere und andere Truppen.",
  foundry:
    "Gießt Kanonen aus Eisen und Kohle - für Linienschiffe, Schlachtkreuzer und die Artillerie.",
  engineWorks:
    "Baut Dampfmaschinen aus Eisen und Instrumenten - für Dampfschiffe und Schlachtkreuzer.",
  decorTree:
    "Ein Baum am Weg. Häuser in Reichweite sind etwas zufriedener (+2 Punkte).",
  flowerBed: "Bunte Beete vor der Tür: +2 Punkte Zufriedenheit in Reichweite.",
  lantern: "Licht auf der Gasse: +2 Punkte Zufriedenheit in Reichweite.",
  plaza: "Ein Platz zum Verweilen: +3 Punkte Zufriedenheit in Reichweite.",
  park: "Wiese, Bäume und Bänke: +5 Punkte Zufriedenheit in Reichweite.",
  fountain:
    "Frisches Wasser und Ansehen: +5 Punkte Zufriedenheit in Reichweite.",
  statue:
    "Ein Denkmal für die Stadt: +6 Punkte Zufriedenheit in Reichweite. Verschiedene Zierden zählen zusammen, höchstens +15.",
};

/** Names of the build-menu shelves. */
export const CATEGORY_NAMES: Readonly<Record<BuildingCategory, string>> = {
  logistics: "Lager",
  housing: "Wohnen",
  public: "Öffentlich",
  raw: "Rohstoffe",
  farm: "Höfe",
  craft: "Handwerk",
  harbour: "Hafen",
  defence: "Verteidigung",
  decor: "Dekoration",
};

/** Names of the population tiers (plural). */
export const TIER_NAMES: readonly string[] = [
  "Bauern",
  "Arbeiter",
  "Handwerker",
  "Kaufleute",
  "Ingenieure",
  "Gehobene Schicht",
  "Wohlhabende Bürger",
];

/** Names of the ship kinds. */
export const SHIP_NAMES: Readonly<Record<ShipKind, string>> = {
  cog: "Schoner",
  hulk: "Klipper",
  galleon: "Frachtschiff",
  steamer: "Dampfschiff",
  warship: "Kanonenboot",
  frigate: "Fregatte",
  lineShip: "Linienschiff",
  cruiser: "Schlachtkreuzer",
  trader: "Freier Händler",
  pirate: "Piratenschiff",
};

/** Names of the fields of research. */
export const RESEARCH_NAMES: Readonly<Record<ResearchId, string>> = {
  crops: "Fruchtwechsel",
  glass: "Glasmacherkunst",
  fortification: "Festungsbau",
  guilds: "Zunftwesen",
  shipbuilding: "Schiffbaukunst",
  engineering: "Ingenieurwesen",
  optics: "Optik",
  tobacco: "Tabakanbau",
  society: "Gehobene Gesellschaft",
  jewelry: "Goldschmiedekunst",
  wealth: "Wohlstand",
  gunnery: "Geschützguss",
  steam: "Dampfkraft",
  tactics: "Kriegskunst",
};

/** Names of the AI characters. */
export const PERSONALITY_NAMES: Readonly<Record<Personality, string>> = {
  trader: "Händler",
  expansionist: "Expansionist",
  warlike: "Kriegerisch",
};

/** Names of the treaties. */
export const TREATY_NAMES: Readonly<Record<Treaty, string>> = {
  trade: "Handelsabkommen",
  pact: "Nichtangriffspakt",
  alliance: "Bündnis",
};

/** Why a relation or a reputation is what it is. */
export const REASON_NAMES: Readonly<Record<RelationReason, string>> = {
  personality: "Charakter",
  reputation: "Dein Ruf",
  gift: "Geschenke",
  demand: "Erfüllte Forderungen",
  refused: "Abgelehnte Vorschläge",
  trade: "Geschäfte",
  mission: "Erfüllte Aufträge",
  failedMission: "Gescheiterte Aufträge",
  attacked: "Angriffe",
  war: "Krieg",
  peace: "Friedensschluss",
  brokenPact: "Gebrochener Pakt",
  border: "Nachbarschaft",
  sharedEnemy: "Gemeinsamer Feind",
  tradeAgreement: "Handelsabkommen",
  pact: "Nichtangriffspakt",
  alliance: "Bündnis",
  declaredWar: "Kriegserklärung",
  rivalry: "Streit um freie Inseln",
  incident: "Zwischenfälle",
  conquest: "Eroberte Inseln",
  trespass: "Truppen auf ihrem Land",
};

/** Why a proposal was taken or turned down. */
export const ANSWER_TEXTS: Readonly<Record<DiplomacyAnswer, string>> = {
  accepted: "Angenommen.",
  friendship: "Angenommen - die Beziehung ist gut genug.",
  fear: "Angenommen - aus Furcht vor deiner Flotte.",
  fair: "Angenommen - ein faires Geschäft.",
  warWeary: "Angenommen - des Krieges müde.",
  relationLow: "Abgelehnt - die Beziehung ist zu schlecht.",
  notWorth: "Abgelehnt - das Angebot ist zu wenig wert.",
  noGoods: "Abgelehnt - die Waren sind nicht vorhanden.",
  noGold: "Abgelehnt - nicht genug Gold.",
  atWar: "Abgelehnt - ihr seid im Krieg.",
  pactActive: "Nicht möglich - erst den Nichtangriffspakt kündigen.",
  peaceful: "Nicht möglich - friedliches Spiel.",
  confident: "Abgelehnt - sie fühlen sich überlegen.",
  notAfraid: "Abgelehnt - sie fürchten dich nicht.",
  already: "Besteht schon.",
  needPact: "Abgelehnt - ein Bündnis braucht erst einen Nichtangriffspakt.",
  notAtWar: "Nicht nötig - ihr seid nicht im Krieg.",
  warlike: "Abgelehnt - ihr Charakter ist kriegerisch.",
  noTreaty: "Es gibt keinen solchen Vertrag.",
  gone: "Diese Partei ist nicht mehr im Spiel.",
};

/** Names of the mission kinds. */
export const MISSION_KIND_NAMES: Readonly<Record<MissionKind, string>> = {
  delivery: "Lieferung",
  settle: "Besiedlung",
  production: "Produktionsziel",
  trade: "Handelsauftrag",
  economy: "Wirtschaftsziel",
  diplomacy: "Diplomatie",
  rescue: "Rettung",
  build: "Bauauftrag",
};

/** Names of the states of a mission. */
export const MISSION_STATE_NAMES: Readonly<Record<MissionState, string>> = {
  offered: "Angeboten",
  active: "Läuft",
  done: "Erfüllt",
  failed: "Gescheitert",
  expired: "Verfallen",
  lost: "Verloren",
};

/** Names of the chance events. */
export const INCIDENT_NAMES: Readonly<Record<IncidentKind, string>> = {
  fire: "Feuer",
  plague: "Seuche",
  storm: "Sturm auf See",
  pirates: "Piraten",
  goodHarvest: "Gute Ernte",
  badHarvest: "Missernte",
};

/** Names of the seasons. */
export const SEASON_NAMES: Readonly<Record<Season, string>> = {
  spring: "Frühling",
  summer: "Sommer",
  autumn: "Herbst",
  winter: "Winter",
};

/** Names of the weathers. */
export const WEATHER_NAMES: Readonly<Record<WeatherKind, string>> = {
  clear: "Klar",
  rain: "Regen",
  fog: "Nebel",
  storm: "Sturm",
};

/** Symbols of the weathers. */
export const WEATHER_ICONS: Readonly<Record<WeatherKind, string>> = {
  clear: "\u{2600}\u{FE0F}",
  rain: "\u{1F327}\u{FE0F}",
  fog: "\u{1F32B}\u{FE0F}",
  storm: "\u{26C8}\u{FE0F}",
};

/** Names of the map sizes. */
export const SIZE_NAMES: Readonly<Record<MapSize, string>> = {
  small: "Klein",
  medium: "Mittel",
  large: "Groß",
};

/**
 * What a kontor on a new island needs aboard, in words.
 *
 * @returns e.g. "10 Bretter und 4 Werkzeug"
 */
export function kitWords(): string {
  const parts = Object.entries(KONTOR_KIT).map(
    ([good, amount]) => `${amount as number} ${GOOD_NAMES[good as GoodId]}`,
  );
  return parts.length > 1
    ? `${parts.slice(0, -1).join(", ")} und ${parts[parts.length - 1]}`
    : (parts[0] ?? "");
}

/** Why a building may not stand somewhere. */
export const ISSUE_TEXTS: Readonly<Record<PlacementIssue, string>> = {
  outside: "Außerhalb der Karte",
  water: "Nur auf Land einer Insel",
  terrain: "Hier ist kein Baugrund (Berg oder Fluss)",
  slope: "Zu steil",
  occupied: "Platz ist belegt",
  territory:
    "Außerhalb deines Baugebiets - erweitere es mit einem Lagerhaus oder Marktplatz am Rand",
  coast: "Muss direkt an der Küste stehen",
  forest: "Zu wenig Wald in der Nähe",
  deposit: "Kein passendes Vorkommen in der Nähe",
  fertility: "Diese Insel ist dafür nicht fruchtbar",
  fishing: "Zu wenig offenes Wasser zum Fischen",
  locked: "Noch nicht freigeschaltet",
  tutorial: "Die Einführung gibt das erst später frei",
  gold: "Nicht genug Gold",
  materials: "Nicht genug Baustoffe im Lager dieser Insel",
  noShip: `Kein eigenes Schiff in ${FOUND_RANGE} Feldern Nähe - ein Schiff mit ${kitWords()} an Bord muss dort liegen`,
  shipCargo: `Das Schiff braucht ${kitWords()} an Bord (am eigenen Kontor: „Baustoffe für ein Kontor laden“)`,
  notOwned: "Zuerst ein Handelskontor auf dieser Insel gründen",
  kontorExists:
    "Diese Insel hat schon ein Kontor - erweitere das Baugebiet mit Lagerhäusern",
  foreign: "Diese Insel gehört einer anderen Partei",
};

/** Reasons a command was refused, by code. */
export const REFUSAL_TEXTS: Readonly<Record<string, string>> = {
  ...ISSUE_TEXTS,
  nothing: "Hier ist nichts abzureißen",
  kontorLast: "Erst alle anderen Gebäude der Insel abreißen",
  fixed: "Das Kontor lässt sich nicht verschieben",
  missing: "Nicht mehr vorhanden",
  noPath: "Dorthin findet das Schiff keinen Weg",
  pave: "Zum Pflastern fehlen Gold oder Steinquader auf dieser Insel",
  notDocked: "Das Schiff liegt nicht an einem Kontor",
  notShore:
    "Das Schiff liegt vor keiner Küste - fahre es dicht an die Insel, auf der deine Truppen stehen",
  busy: `Die Werft nimmt höchstens ${YARD_ORDERS} Aufträge an`,
  tier: "Dafür muss eine höhere Schicht erreicht sein",
  noGuns: "Nur Kriegsschiffe können das",
  fleetFull: "Eine Flotte hat höchstens zwölf Schiffe",
  noRetreat: "Auf dieser Insel gibt es keine eigene Kaserne und kein Kontor",
  "unit:tier": "Dafür muss eine höhere Schicht erreicht sein",
  "unit:research": "Dafür fehlt noch Forschung",
  "unit:building": "Dafür fehlt noch ein Gebäude",
  noYard: "Die Werft ist noch nicht fertig",
  foreign: "Das gehört einer anderen Partei",
  maxLevel: "Schon auf der höchsten Stufe",
  notComplete: "Erst fertig bauen",
  research: "Dafür fehlt noch Forschung",
  researchLocked: "Erst die nötige Forschung abschließen",
  tooManyMissions: "Es laufen schon drei Aufträge",
  queueFull: `Die Kaserne nimmt höchstens ${DRILL_ORDERS} Einheiten auf einmal an`,
  noSoldiers: "Keine Soldaten bereit",
  noRoom: "Kein Platz mehr an Bord",
  notWalkable: "Soldaten laufen nur über Land",
  otherIsland: "Soldaten laufen nur auf der Insel, auf der sie stehen",
  noWay: "Dorthin finden die Soldaten keinen Weg",
  notHostile: "Landen nur auf eigenen Inseln oder bei Feinden im Krieg",
  unknown: "Unbekannter Befehl",
  burning: "Erst muss das Feuer aus sein",
  whole: "Das Gebäude ist unbeschädigt",
};

/** What a producer is doing. */
export const STATUS_TEXTS: Readonly<Record<ProducerStatus, string>> = {
  building: "Im Bau",
  working: "Arbeitet",
  noInput: "Wartet auf Rohstoffe",
  full: "Eigenes Lager voll - pausiert, bis ein Karren abholt",
  noWorkers: "Keine Arbeitskräfte",
  noResource: "Standort ungeeignet (Wald, Vorkommen oder Fruchtbarkeit fehlt)",
  noRoad: "Kein Transportweg - kein Karren erreicht den Betrieb",
  paused: "Angehalten",
};

/** Why a house does not rise. */
export const BLOCKED_TEXTS: Readonly<Record<HouseState["blocked"], string>> = {
  none: "",
  needs: "Steigt auf, wenn alle Bedürfnisse zu mindestens 75 % erfüllt sind.",
  full: "Steigt auf, sobald das Haus voll bewohnt ist.",
  materials: "Bedürfnisse erfüllt - es fehlen Baustoffe für den Aufstieg.",
  locked: "Die höchste Schicht ist erreicht.",
  research: "Bedürfnisse erfüllt - die nächste Schicht braucht noch Forschung.",
};

/** Every other label. */
export const TEXTS = {
  title: "IMPERAVIS",
  tagline: "Inseln besiedeln, Waren erzeugen, Städte wachsen lassen.",
  newGame: "Neues Spiel",
  continueGame: "Fortsetzen",
  load: "Laden",
  save: "Speichern",
  settings: "Einstellungen",
  statistics: "Statistik",
  seed: "Startwert der Welt",
  seedHint: "Gleicher Startwert, gleiche Inselwelt.",
  randomSeed: "Zufall",
  mapSize: "Kartengröße",
  start: "Los geht's",
  back: "Zurück",
  slot: (index: number) => `Spielstand ${index}`,
  emptySlot: "leer",
  savedAt: (date: string) => `gespeichert ${date}`,
  saved: "Gespeichert",
  loaded: "Geladen",
  autosaved: "Automatisch gespeichert",
  loading: "Die Inselwelt entsteht ...",
  noWebgl: "Dieses Gerät kann die 3D-Ansicht nicht darstellen (WebGL fehlt).",
  menu: "Menü",
  resume: "Weiterspielen",
  mainMenu: "Hauptmenü",
  fullscreen: "Vollbild",
  cheat: "Cheat-Modus",
  cheatOn:
    "Cheat einschalten: unendlich Gold und Waren, alles erforscht und ohne Voraussetzung baubar, Häuser auf der höchsten Schicht, Startwert der Welt wählbar",
  cheatOff: "Cheat ausschalten",
  endless: "\u{221E}",
  pause: "Pause",
  speed: "Tempo",
  gold: "Gold",
  perMinute: "/Min",
  population: "Einwohner",
  day: (day: number, year: number) => `Tag ${day}, Jahr ${year}`,
  build: "Bauen",
  road: "Straße",
  demolish: "Abreißen",
  cancel: "Abbrechen",
  rotate: "Drehen (R)",
  fps: "Bilder/s",
  hintRoad: (tiles: number, gold: number) =>
    `Straße: ${tiles} neue Felder, ${gold} Gold - ziehen und loslassen`,
  hintRoadStart: "Straße: Maus drücken, ziehen, loslassen",
  hintRoadBlocked: "Hier lässt sich keine Straße bauen",
  hintPave: (tiles: number, gold: number, stone: number) =>
    `Pflastern: ${tiles} Felder, ${gold} Gold, ${stone} Steinquader - ziehen und loslassen`,
  hintPaveStart: "Pflastern: über eine Straße ziehen und loslassen",
  hintPaveBlocked: "Pflastern geht nur entlang deiner Straßen",
  hintOk: "Hier kann gebaut werden",
  hintDemolish: {
    building: "Gebäude abreißen (die Hälfte der Baustoffe kommt zurück)",
    road: "Straße entfernen",
    nothing: "Nichts zum Abreißen",
  },
  hintSail: (water: boolean) =>
    water
      ? "Ziel setzen"
      : "Ziel muss auf dem Wasser oder an einem Kontor liegen",
  costs: "Kosten",
  upkeep: "Unterhalt",
  workers: "Arbeitskräfte",
  buildTime: "Bauzeit",
  unlockAt: (count: number, tier: string) => `Ab ${count} ${tier}`,
  seconds: (value: number) => `${Math.round(value)} s`,
  status: "Zustand",
  efficiency: "Auslastung",
  input: "Vorrat",
  output: "Erzeugt",
  produced: "Insgesamt erzeugt",
  pauseBuilding: "Anhalten",
  resumeBuilding: "Fortsetzen",
  move: "Versetzen",
  residents: "Bewohner",
  tier: "Schicht",
  satisfaction: "Zufriedenheit",
  needs: "Bedürfnisse",
  needCovered: "in Reichweite",
  needMissing: "fehlt",
  island: "Insel",
  stock: "Lager",
  capacity: "Platz je Ware",
  noSelection: "Wähle ein Gebäude oder ein Schiff - oder baue etwas.",
  constructing: (percent: number) => `Im Bau: ${percent} %`,
  ship: "Schiff",
  cargo: "Ladung",
  emptyCargo: "leer",
  sailTo: "Ziel setzen",
  docked: (island: string) => `Liegt am Kontor von ${island}`,
  atSea: "Auf See",
  stuck: "Kein Weg gefunden",
  loadTen: "+10",
  unloadTen: "-10",
  unloadAll: "Alles entladen",
  route: "Handelsroute",
  noRoute: "Keine (frei steuern)",
  buildShip: (name: string) => `${name} bauen`,
  yardBusy: (name: string, percent: number) => `${name} im Bau: ${percent} %`,
  // Panels
  panels: "Übersichten",
  finance: "Finanzen",
  people: "Bevölkerung",
  warehouses: "Lager",
  islands: "Inseln",
  ships: "Schiffe",
  routes: "Handelsrouten",
  trade: "Handel",
  close: "Schließen",
  income: "Einnahmen",
  expenses: "Ausgaben",
  taxes: "Steuern",
  sales: "Verkäufe an Händler",
  upkeepBuildings: "Unterhalt Gebäude",
  upkeepShips: "Unterhalt Schiffe und Soldaten",
  purchases: "Einkäufe beim Händler",
  construction: "Bauen",
  balance: "Bilanz",
  lastMinute: "Letzte Minute",
  thisMinute: "Laufende Minute",
  history: "Goldverlauf (letzte 30 Minuten)",
  taxLevel: "Steuersatz",
  taxNames: ["Niedrig (+ Zufriedenheit)", "Normal", "Hoch (- Zufriedenheit)"],
  tierRow: "Schicht",
  houses: "Häuser",
  workplaces: "Arbeitsplätze besetzt",
  supply: "Versorgung",
  owned: "Besiedelt",
  free: "Frei",
  fertility: "Fruchtbar für",
  deposits: "Vorkommen",
  area: "Fläche",
  forest: "Wald",
  coast: "Küste",
  goTo: "Hinsehen",
  none: "nichts",
  depositNames: { stone: "Stein", clay: "Lehm", ore: "Erz" },
  sizeNames: { small: "klein", medium: "mittel", large: "groß" },
  noShips: "Noch keine Schiffe.",
  noRoutes:
    "Noch keine Handelsrouten. Eine Route verbindet zwei oder mehr deiner Kontore.",
  newRoute: "Neue Route",
  routeName: (index: number) => `Route ${index}`,
  stop: "Halt",
  addStop: "Halt hinzufügen",
  removeStop: "Halt entfernen",
  addAction: "Ware hinzufügen",
  loadMode: "laden",
  unloadMode: "entladen",
  amount: "Menge",
  limitLoad: "im Lager lassen",
  limitUnload: "Lager höchstens",
  active: "Aktiv",
  deleteRoute: "Route löschen",
  assignShip: "Schiff zuweisen",
  trips: (count: number) => `${count} Rundfahrten`,
  blockedNames: {
    noKontor: "Ein Halt hat kein Kontor mehr",
    noPath: "Kein Seeweg gefunden",
    noShip: "Kein Schiff zugewiesen",
  },
  routeOk: "Läuft",
  needTwoKontors:
    "Für eine Route braucht es Kontore auf mindestens zwei Inseln.",
  prices: "Preise des freien Händlers",
  traderBuys: "Händler zahlt",
  traderSells: "Händler verlangt",
  sellAbove: "Verkaufen über",
  buyBelow: "Kaufen unter",
  off: "aus",
  on: "an",
  traderNext: (seconds: number) => `Nächster Besuch in etwa ${seconds} s`,
  traderHere: "Der Händler ist unterwegs.",
  traderLast: (island: string, sold: number, bought: number) =>
    `Zuletzt in ${island}: ${sold} Gold eingenommen, ${bought} Gold ausgegeben.`,
  traderHint:
    "Der freie Händler besucht nur Kontore mit Kauf- oder Verkaufsaufträgen.",
  // Settings
  settingsTitle: "IMPERAVIS - Einstellungen",
  settingsSubtitle: "Ton, Grafik und Speichern.",
  backToGame: "Zum Spiel",
  soundTitle: "Ton",
  soundHint: "Meer, Vögel, Bauen, Münzen und Meldungen.",
  shadowsTitle: "Schatten",
  shadowsHint: "Schöner, kostet auf schwachen Geräten Bildrate.",
  weatherTitle: "Wettereffekte",
  weatherHint:
    "Regen, Sturm und dichter Nebel in der Ansicht. Das Wetter wirkt auf die Wirtschaft auch ohne.",
  autosaveTitle: "Automatisch speichern",
  autosaveHint: "Alle zwei Minuten und beim Verlassen der Seite.",
  speedTitle: "Starttempo",
  speedHint: "Mit diesem Tempo beginnt ein Spiel.",
  edgeTitle: "Kamera am Bildschirmrand",
  edgeHint:
    "Steht die Maus am Rand der Spielfläche, wandert die Karte mit - nicht über Fenstern und nur, solange das Spiel im Vordergrund ist.",
  // Statistics
  statsTitle: "IMPERAVIS",
  statPeak: "Höchste Einwohnerzahl",
  statTier: "Höchste Schicht",
  statFounded: "Gegründete Inseln",
  statBuilt: "Gebaute Gebäude",
  statShips: "Gebaute Schiffe",
  statTraded: "Gehandelte Waren",
  // Events
  eventFounded: (island: string) => `${island} gegründet`,
  eventUnlocked: (name: string) => `Neu freigeschaltet: ${name}`,
  eventUpgraded: (tier: string) => `Ein Haus ist aufgestiegen: ${tier}`,
  eventShortage: (good: string, island: string) =>
    `Mangel an ${good} auf ${island}`,
  eventShip: "Ein neues Schiff ist vom Stapel gelaufen",
  eventTrader: (island: string, sold: number, bought: number) =>
    `Händler in ${island}: +${sold} / -${bought} Gold`,
  eventDebt: "Die Kasse ist leer - Unterhalt läuft weiter ins Minus",
  eventSeason: (season: string) => `Es wird ${season}`,
  eventDocked: (island: string) => `Schiff liegt in ${island} an`,
  startHint:
    "Wähle das Handelskontor und setze es an die Küste nahe deinem Schiff.",
  keys: "Tasten",
  // Events of the new systems
  pirates: "Piraten",
  eventRivalFounded: (who: string, island: string) =>
    `${who} hat ${island} besiedelt`,
  eventDowngraded: (tier: string) =>
    `Ein schlecht versorgtes Haus ist abgestiegen: ${tier}`,
  eventLevelUp: (name: string) => `${name} ausgebaut`,
  eventSunk: (ship: string) => `Dein Schiff (${ship}) ist gesunken`,
  eventDestroyed: (name: string) => `${name} wurde zerstört`,
  eventCaptured: (island: string, who: string) =>
    `${island} wurde erobert - neuer Besitzer: ${who}`,
  eventPlundered: (island: string) => `Piraten haben ${island} geplündert`,
  eventIncident: (kind: string, island: string) =>
    island === "" ? kind : `${kind}: ${island}`,
  eventFireOut: (name: string) => `Feuer gelöscht: ${name}`,
  eventWar: (a: string, b: string) => `Krieg: ${a} gegen ${b}`,
  eventPeace: (a: string, b: string) => `Frieden zwischen ${a} und ${b}`,
  eventTreaty: (treaty: string, who: string, signed: boolean) =>
    signed
      ? `${treaty} mit ${who} geschlossen`
      : `${treaty} mit ${who} beendet`,
  eventOffer: (who: string) => `${who} macht dir ein Angebot (Diplomatie)`,
  eventMission: (kind: string, state: string) =>
    state === "offered"
      ? `Neuer Auftrag: ${kind}`
      : state === "done"
        ? `Auftrag erfüllt: ${kind}`
        : state === "failed"
          ? `Auftrag gescheitert: ${kind}`
          : state === "lost"
            ? `Auftrag verloren: ${kind} - jemand war schneller`
            : `Auftrag verfallen: ${kind}`,
  eventResearched: (name: string) => `Erforscht: ${name}`,
  // New game
  rivals: "KI-Gegner",
  rivalsHint:
    "Rivalen mit eigenem Charakter: Händler, Kriegerisch, Expansionist.",
  peaceful: "Friedliches Spiel",
  peacefulHint: "Keine Kriege und keine Piraten.",
  unreadableSave: "nicht ladbar (andere Version)",
  unreadableHint:
    "Ein gespeichertes Spiel stammt aus einer anderen Version und kann nicht geladen werden.",
  // Ledger
  rewards: "Aufträge, Verträge, Geschenke",
  payments: "Zahlungen und Reparaturen",
  // Overviews
  diplomacy: "Diplomatie",
  missions: "Aufträge",
  research: "Forschung",
  // Diplomacy
  noRivals: "In diesem Spiel gibt es keine KI-Gegner.",
  opinion: "Meinung über dich",
  yourReputation: "Dein Ruf",
  personality: "Charakter",
  strength: "Stärke",
  yourStrength: "deine",
  islandsOf: (count: number) => `${count} Inseln`,
  residentsOf: (count: number) => `${count} Einwohner`,
  atWar: "Krieg",
  atPeace: "Frieden",
  proposeTreaty: (name: string) => `${name} vorschlagen`,
  cancelTreaty: (name: string) => `${name} kündigen`,
  declareWar: "Krieg erklären",
  offerPeace: "Frieden anbieten",
  giftGold: (gold: number) => `${gold} Gold schenken`,
  demandGold: (gold: number) => `${gold} Gold fordern`,
  goodsDeal: "Warenhandel",
  youGive: "Du gibst",
  youGet: "Du verlangst",
  goldLabel: "Gold",
  giftGoods: "Waren schenken",
  proposeTrade: "Handel vorschlagen",
  dealFrom: (island: string) => `Waren von und nach: ${island}`,
  offersToYou: "Angebote an dich",
  accept: "Annehmen",
  decline: "Ablehnen",
  expiresIn: (seconds: number) => `noch ${Math.max(0, seconds)} s`,
  historyLog: "Verlauf",
  wantsTreaty: (name: string) => `schlägt ${name} vor`,
  wantsPeace: "bietet Frieden an",
  wantsTribute: (what: string) => `fordert ${what}`,
  wantsTrade: (give: string, take: string) => `bietet ${give} für ${take}`,
  peacefulGame: "Friedliches Spiel: Kriege sind abgeschaltet.",
  actionNames: {
    propose: "Vertrag",
    cancel: "Kündigung",
    war: "Kriegserklärung",
    peace: "Frieden",
    gift: "Geschenk",
    demand: "Forderung",
    trade: "Handel",
  },
  // Missions
  offeredMissions: "Angebote",
  activeMissions: "Laufende Aufträge",
  endedMissions: "Abgeschlossen",
  noMissions: "Gerade keine Aufträge - neue kommen alle paar Minuten.",
  crown: "Die Krone",
  from: (who: string) => `Auftraggeber: ${who}`,
  reward: "Belohnung",
  timeLeft: (seconds: number) =>
    `${Math.floor(seconds / SECONDS_PER_MINUTE)}:${String(Math.floor(seconds % SECONDS_PER_MINUTE)).padStart(2, "0")} übrig`,
  timeLimit: (seconds: number) =>
    `Zeit: ${Math.round(seconds / SECONDS_PER_MINUTE)} Min`,
  difficulty: (level: number) => `Schwierigkeit ${"★".repeat(level)}`,
  abandon: "Aufgeben",
  deliverNow: (island: string) => `Aus ${island} liefern`,
  relationGain: (value: number) => `+${value} Beziehung`,
  reputationGain: (value: number) => `+${value} Ruf`,
  // Research
  researchRate: (points: number) =>
    `${points.toFixed(1)} Forschungspunkte je Minute`,
  noScholars:
    "Ohne Gelehrtenhaus gibt es keine Forschungspunkte (frei ab 60 Handwerkern).",
  studying: "In Arbeit",
  startResearch: "Erforschen",
  stopResearch: "Anhalten",
  researched: "Erforscht",
  needsFirst: (names: string) => `Braucht zuerst: ${names}`,
  opens: "Schaltet frei",
  opensTier: (tier: string) => `Schicht ${tier}`,
  bonus: (percent: number, what: string) => `+${percent} % ${what}`,
  bonusCrop: "auf Höfen",
  bonusCraft: "im Handwerk",
  fieldCost: (cost: number) => `${cost} Punkte`,
  points: (have: number, cost: number) =>
    `${Math.floor(have)} / ${cost} Punkte`,
  // Info panel additions
  hitPoints: "Lebenspunkte",
  stage: "Ausbaustufe",
  stageName: (level: number) => `Stufe ${level + 1}`,
  levelUp: "Ausbauen (Stufe 2)",
  levelEffect:
    "Stufe 2: Betriebe 50 % schneller, Lager 50 % mehr Platz und ein Karren mehr; 50 % mehr Unterhalt.",
  burning: "Brennt!",
  owner: "Besitzer",
  foreignBuilding: (who: string) => `Gehört ${who}.`,
  repairing: (gold: number) => `Wird im Hafen repariert (${gold} Gold je LP)`,
  repairingYard: (gold: number) =>
    `Wird an der Werft repariert, schneller als im Hafen (${gold} Gold je LP)`,
  repairHint:
    "Beschädigte Schiffe werden vor einer eigenen Werft (am schnellsten) oder an einem eigenen Kontor repariert.",
  guns: (damage: number, range: number, reload: number) =>
    `Kanonen: ${damage} Schaden, Reichweite ${range}, alle ${reload} s`,
  armour: (percent: number) => `Rüstung ${percent} %`,
  warHint:
    "Kriegsschiffe greifen Feinde in Reichweite selbst an. Vor einem feindlichen Kontor beschießen sie es - bei 0 LP wird es erobert.",
  plague: "Seuche!",
  goodHarvest: "Gute Ernte",
  badHarvest: "Missernte",
  traffic: (carts: number) => `Verkehr: ${carts} Karren`,
  priority: "Vorrang",
  priorityNames: ["niedrig", "normal", "hoch"],
  atWarWith: (names: string) => `Krieg mit ${names}`,
  // Troops
  soldiersHere: (here: number, all: number) =>
    `Soldaten auf dieser Insel: ${here} (insgesamt ${all})`,
  training: (queue: number, percent: number) =>
    `In Ausbildung: ${queue} - der nächste zu ${percent} %`,
  train: (count: number) =>
    count === 1 ? "1 Soldat ausbilden" : `${count} Soldaten ausbilden`,
  soldierFacts: (
    gold: number,
    tools: number,
    upkeep: number,
    hp: number,
    damage: number,
  ) =>
    `Je Soldat ${gold} Gold und ${tools} Werkzeug, ${upkeep} Gold Unterhalt pro Minute, ${hp} LP, ${damage} Schaden je Schlag.`,
  troops: "Soldaten an Bord",
  embark: (count: number) =>
    count > 0
      ? `${count} Soldaten einschiffen`
      : "Keine Soldaten an dieser Küste",
  embarkHint:
    "Zum Einschiffen das Schiff dicht an die Küste der Insel fahren, auf der deine Truppen stehen - ein Kontor ist nicht nötig. Oder Truppen wählen und mit rechts auf das Schiff klicken.",
  landHome: (island: string) => `Absetzen: ${island}`,
  landAttack: (island: string) => `Angriff: ${island}`,
  landFree: "frei",
  landRivalWarning: (who: string) =>
    `Diese Insel gehört ${who}. Truppen auf seinem Land verärgern ihn, solange sie dort stehen - im Extremfall erklärt er dir den Krieg.`,
  landing: (island: string) => `Unterwegs zur Landung: ${island}`,
  eventLanded: (who: string, island: string) =>
    `${who} landet Soldaten auf ${island}`,
  missionRivals: "Konkurrenz",
  dayOf: (day: number) => `Tag ${day}`,
  missionWonBy: (who: string) => `${who} war schneller`,
} as const;
