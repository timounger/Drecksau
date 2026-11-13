/**
 * The words of the IMPERAVIS screen around the map: the resource bar, the
 * island overview, the object window, the build menu, the administration,
 * the minimap and the world map, the notifications and the tooltips.
 *
 * @module
 */
import type { TransportState } from "@/games/imperavis/engine/logistics";
import type { LinkKind } from "@/games/imperavis/engine/types";

/** The labels of the screen. */
export const HUD = {
  // Top bar
  player: "Du",
  level: "Entwicklung",
  levelNone: "Siedlung ohne Bürger",
  noIsland: "Noch keine Insel",
  treasury: "Kontostand",
  incomeLine: (gold: string) => `Einnahmen: +${gold}/Min`,
  expenseLine: (gold: string) => `Ausgaben: -${gold}/Min`,
  balanceLine: (gold: string) => `Bilanz der letzten Minute: ${gold}`,
  trendUp: "Steigend",
  trendDown: "Fallend",
  trendFlat: "Gleichbleibend",
  goldTip: "Gold - Kontostand",
  goldCheat: "Cheat-Modus: unendlich Gold",
  population: "Bevölkerung",
  populationTip: "Einwohner aller deiner Inseln - Klick öffnet die Übersicht",
  moreGoods: "Alle Waren",
  moreGoodsTip: "Ausklappbares Warenfenster mit allen Waren dieser Insel",
  stockLine: (have: number, room: number) => `Bestand: ${have} von ${room}`,
  madeLine: (value: string) => `Produktion: +${value}/Min`,
  usedLine: (value: string) => `Verbrauch: -${value}/Min`,
  netLine: (value: string) => `Saldo: ${value}/Min`,
  satisfaction: "Zufriedenheit",
  satisfactionTip: (value: number) =>
    `Durchschnittliche Zufriedenheit deiner Bewohner: ${value} %`,
  noResidents: "Noch keine Bewohner",
  speedTitle: "Spielgeschwindigkeit",
  speedTip: (value: number, cheatOnly: boolean) =>
    value === 0
      ? "Pause (Leertaste)"
      : cheatOnly
        ? `${value}-fache Geschwindigkeit (nur im Cheat-Modus)`
        : `${value}-fache Geschwindigkeit (Plus/Minus wechseln das Tempo)`,
  dateTip: "Datum und Jahreszeit",
  weatherTip: "Wetter - wirkt auf Höfe und Fischerei",
  researchTip: (name: string) => `Forschung in Arbeit: ${name}`,
  warTip: "Du bist im Krieg",
  fpsTip: "Bilder je Sekunde",
  // Island panel
  islandOverview: "Inselübersicht",
  collapse: "Einklappen",
  expand: "Inselübersicht aufklappen",
  residents: "Einwohner",
  islandBalance: "Bilanz der Insel",
  islandBalanceTip:
    "Steuern der Häuser dieser Insel minus Unterhalt ihrer Gebäude, je Minute",
  buildings: "Gebäude",
  storage: "Lagerkapazität",
  storageTip: "Platz je Ware in allen Lagern dieser Insel",
  buildArea: "Freie Baufläche",
  buildAreaTip: "Freie, bebaubare Felder in deinem Baugebiet",
  tiles: (count: number) => `${count} Felder`,
  fertility: "Fruchtbarkeit",
  deposits: "Rohstoffvorkommen",
  capacity: "Produktionskapazität",
  capacityTip: "Betriebe und ihre durchschnittliche Auslastung",
  capacityValue: (count: number, share: number) =>
    `${count} Betriebe, ${share} % ausgelastet`,
  supply: "Versorgungslage",
  supplyTip: "Wie gut die Wünsche der Bewohner gedeckt sind",
  supplyNone: "Kein Bedarf",
  harbour: "Hafenstatus",
  harbourValue: (level: number, ships: number, yard: boolean) =>
    `Kontor Stufe ${level + 1}, ${ships} Schiffe am Kai${yard ? ", Werft" : ""}`,
  noKontor: "Kein Kontor",
  allIslands: "Alle Inseln",
  allIslandsTip: "Globale Inselübersicht: alle Inseln der Welt",
  goToIsland: "Kamera zur Insel",
  free: "Unbesiedelt",
  yours: "Deine Insel",
  owner: "Besitzer",
  production: "Warenproduktion",
  noProduction: "Keine Produktion",
  economy: "Wirtschaft",
  economyGood: "Gut versorgt",
  economyMixed: "Teils versorgt",
  economyPoor: "Mangel",
  economyNone: "Keine Bewohner",
  chooseIsland: "Diese Insel anzeigen",
  // Object window
  tabOverview: "Übersicht",
  tabProduction: "Produktion",
  tabStock: "Lagerbestand",
  tabWorkers: "Arbeitskräfte",
  tabResidents: "Bewohner",
  tabFinance: "Finanzen",
  tabExtensions: "Erweiterungen",
  tabLogistics: "Logistik",
  link: "Anbindung",
  linkNames: {
    road: "Straße",
    land: "Gelände",
    none: "Kein Weg",
  } as Readonly<Record<LinkKind, string>>,
  linkTips: {
    road: "Grün: Karren erreichen den Betrieb ganz über Straßen.",
    land: "Gelb: Karren fahren (teils) übers Gelände - langsamer. Eine Straße zum Lager beschleunigt den Transport.",
    none: "Rot: Kein Karren erreicht den Betrieb (außer Reichweite eines Lagers oder kein begehbarer Weg). Er produziert nur, bis sein eigenes Lager voll ist.",
  } as Readonly<Record<LinkKind, string>>,
  currentOutput: "Aktuelle Produktion",
  localStock: "Lokaler Bestand",
  transport: "Transport",
  transportStates: {
    noWay: "Kein Transportweg",
    full: "Puffer voll - wartet auf Karren",
    underway: "Karren unterwegs",
    waiting: "Wartet auf Karren",
    idle: "Nichts abzuholen",
  } as Readonly<Record<TransportState, string>>,
  storeDistance: "Entfernung zum Lager",
  storeDistanceValue: (tiles: number, seconds: number) =>
    `${tiles} Felder, ${seconds.toLocaleString("de-DE")} s je Fahrt`,
  cartSpeed: "Transporttempo",
  cartSpeedValue: (tiles: number, share: number) =>
    `${tiles.toLocaleString("de-DE")} Felder/s (${share} % des Straßentempos)`,
  roadAccess: "Straße am Gebäude",
  yes: "ja",
  no: "nein",
  servedBy: (store: string) => `Lager: ${store}`,
  tabCargo: "Ladung",
  tabRoute: "Route",
  tabTroops: "Truppen",
  buildCost: "Baukosten",
  upkeep: "Unterhalt",
  output: "Produktionsleistung",
  employed: "Beschäftigte",
  utilisation: "Auslastung",
  supplyStatus: "Versorgung",
  inputs: "Benötigte Rohstoffe",
  products: "Produkt",
  duration: "Dauer je Durchgang",
  speed: "Geschwindigkeit",
  storeRoom: "Lager im Betrieb",
  storeRoomValue: (input: number, output: number) =>
    `je Rohstoff ${input}, Produkt ${output}`,
  perCycle: (amount: number, seconds: number) => `${amount} je ${seconds} s`,
  perMinute: (value: string) => `${value}/Min`,
  active: "Produktion läuft",
  stopped: "Produktion angehalten",
  start: "Produktion fortsetzen",
  stop: "Produktion stoppen",
  priority: "Vorrang beim Abholen",
  priorityOn: "Vorrang an",
  priorityOff: "Vorrang aus",
  priorityTip:
    "Mit Vorrang schicken die Lager ihre Karren zuerst zu diesem Betrieb - zum Bringen der Rohstoffe und zum Abholen der Waren.",
  noWorkersNeeded: "Braucht keine Arbeitskräfte.",
  workersOf: (count: number, tier: string) => `${count} ${tier}`,
  staffed: "Besetzt",
  scholars: "Forschung",
  scholarsValue: (points: number) =>
    `${points} Punkte je Minute bei voller Besetzung`,
  upkeepNow: "Unterhalt jetzt",
  upkeepPaused: "Angehalten: halber Unterhalt",
  refund: "Rückgabe beim Abriss",
  taxes: "Steuern dieses Hauses",
  levelTitle: "Ausbaustufe",
  levelMax: "Höchste Stufe erreicht.",
  levelNotHere: "Dieses Gebäude hat keine weitere Ausbaustufe.",
  upgrade: "Verbessern",
  upgradeTip: (cost: string) => `Auf Stufe 2 ausbauen - ${cost}`,
  repair: "Reparieren",
  repairTip: (gold: number) =>
    `Sofort reparieren für ${gold} Gold (sonst langsam von selbst, wenn kein Kampf ist)`,
  repairWhole: "Unbeschädigt",
  move: "Versetzen",
  moveTip: "Gebäude kostenlos versetzen",
  demolish: "Abreißen",
  demolishTip: "Abreißen - die Hälfte der Baustoffe kommt zurück",
  close: "Schließen",
  ready: "In Betrieb",
  beauty: "Verschönerung",
  beautyValue: (points: number) => `+${points} Punkte Zufriedenheit`,
  beautyNone: "keine Zierde in Reichweite",
  decorEffect: (points: number, radius: number) =>
    `+${points} Punkte Zufriedenheit für Häuser im Umkreis von ${radius} Feldern`,
  housesInReach: (count: number) => `${count} Häuser in Reichweite`,
  shipType: "Schiffstyp",
  shipStatus: "Zustand",
  hold: "Laderaum",
  holdValue: (used: number, room: number) => `${used} von ${room}`,
  routeNone: "Keine Route",
  crew: "Mannschaft",
  shipUpkeep: "Unterhalt",
  foreign: "Fremd",
  // Build menu
  buildMenu: "Baumenü",
  hideBar: "Leiste einklappen",
  showBar: "Baumenü aufklappen",
  search: "Suchen ...",
  searchLabel: "Gebäude suchen",
  noMatch: "Kein Gebäude passt zur Suche.",
  locked: "Gesperrt",
  unlockNeeds: "Voraussetzung",
  unlockResidents: (count: number, tier: string) =>
    `${count} ${tier} oder höher`,
  unlockResearch: (name: string) => `Forschung: ${name}`,
  materials: "Rohstoffe",
  size: (w: number, h: number) => `${w} x ${h} Felder`,
  reach: (radius: number) => `Reichweite ${radius}`,
  roadTool: "Straße",
  roadTip:
    "Straße bauen (T): Maus drücken, ziehen und loslassen. Betriebe arbeiten auch ohne Straße, aber Karren fahren auf der Straße gut doppelt so schnell wie übers Gelände.",
  paveTool: "Pflastern",
  paveTip: (gold: number, stone: number) =>
    `Straße pflastern (Umschalt + T): über eine bestehende Straße ziehen und loslassen. Je Feld ${gold} Gold und ${stone} Steinquader aus dem Lager der Insel. Karren fahren dort noch 50 % schneller.`,
  paveKey: "Umschalt + T",
  demolishTool: "Abriss",
  demolishToolTip:
    "Abreißen (X oder Entf) - die Hälfte der Baustoffe kommt zurück",
  admin: "Verwaltung",
  adminTip:
    "Verwaltung: Finanzen, Bevölkerung, Produktion, Lager, Inseln, Schiffe, Routen, Handel, Diplomatie, Aufträge, Forschung",
  worldMap: "Weltkarte",
  worldMapTip: "Große Weltkarte öffnen",
  // Build mode
  buildMode: "Baumodus",
  available: "Vorhanden",
  canBuild: "Kann gebaut werden",
  limited: "Ohne Straße: Transport langsamer",
  cannotBuild: "Hier nicht möglich",
  pointHint: "Zeige auf die Karte - die Vorschau prüft den Bauplatz.",
  rotate: "Drehen",
  rotation: (degrees: number) => `Ausrichtung ${degrees}°`,
  shipTip: (name: string, kind: string, cargo: string, route: string) =>
    `${name}
Typ: ${kind}
Ladung: ${cargo}
Route: ${route}`,
  rotateTip: "Drehen: R oder Umschalt + Mausrad",
  cancel: "Abbrechen",
  cancelTip: "Abbrechen: Rechtsklick oder Esc",
  controls:
    "Links: platzieren (bleibt aktiv) - Rechts/Esc: abbrechen - R oder Umschalt + Mausrad: drehen - Mausrad: zoomen",
  keysHelp:
    "Maus: links wählen, links ziehen Auswahlrechteck, rechts Befehl, Mitte ziehen verschieben, rechts ziehen drehen, Rad zoomen (Strg schneller). Tasten: WASD/Pfeile bewegen, Q/E drehen, B Baumenü, R drehen, T Straße, Umschalt + T Pflastern, X Abriss, Tab nächste Einheit, 1-9 Gruppe (Strg + Zahl speichert), Plus/Minus Tempo, Leertaste Pause, Esc abbrechen.",
  controlsTouch: "Tippen: platzieren - Drehen und Abbrechen über die Knöpfe",
  roadMode: "Straßenbau",
  paveMode: "Pflastern",
  demolishMode: "Abriss",
  relocateMode: "Versetzen",
  sailMode: "Ziel setzen",
  patrolMode: "Patrouille: zweiten Punkt wählen",
  // Units and orders
  unitsTitle: "Auswahl",
  unitsLine: (ships: number, soldiers: number) =>
    [
      ships > 0 ? `${ships} ${ships === 1 ? "Schiff" : "Schiffe"}` : "",
      soldiers > 0
        ? `${soldiers} ${soldiers === 1 ? "Soldat" : "Soldaten"}`
        : "",
    ]
      .filter((part) => part !== "")
      .join(", "),
  unitsHint:
    "Rechtsklick auf Wasser: die Schiffe fahren hin. Auf ein Kontor: anlegen. Auf ein feindliches Schiff im Krieg: angreifen. Auf Land ihrer Insel: die Soldaten marschieren. Umschalt + Klick ergänzt die Auswahl, Strg + Zahl speichert sie als Gruppe.",
  soldier: "Soldat",
  soldierTip: "Soldat",
  noGuns: "Keines der gewählten Schiffe hat Kanonen",
  groupSaved: (slot: number, count: number) =>
    `Gruppe ${slot} gespeichert (${count} ${count === 1 ? "Einheit" : "Einheiten"})`,
  groupEmpty: "Erst Schiffe oder Soldaten wählen, dann Strg + Zahl",
  groupMissing: (slot: number) => `Gruppe ${slot} ist leer`,
  noUnits: "Keine eigenen Schiffe oder Soldaten",
  tipOwner: (name: string) => `Besitzer: ${name}`,
  tipState: (percent: number) => `Zustand: ${percent} %`,
  tipBuilding: (percent: number) => `Im Bau: ${percent} %`,
  tipSoldiers: (count: number) => `${count} Soldaten an Bord`,
  // Admin window
  adminTitle: "Verwaltung",
  productionTab: "Produktion",
  productionHint:
    "Alle deine Betriebe nach Ware: Menge je Minute, Verbrauch und Engpässe.",
  good: "Ware",
  made: "Erzeugt",
  used: "Verbraucht",
  net: "Saldo",
  plants: "Betriebe",
  bottleneck: "Engpass",
  bottlenecks: "Engpässe",
  noBottlenecks: "Keine Engpässe - alle Betriebe arbeiten.",
  transportBottlenecks: "Transport",
  noTransportBottlenecks:
    "Alle Betriebe hängen an Straßen - die Karren fahren mit vollem Tempo.",
  transportLine: (overLand: number, cutOff: number, waiting: number) =>
    [
      overLand > 0 ? `${overLand} übers Gelände (langsam)` : "",
      cutOff > 0 ? `${cutOff} ohne Weg` : "",
      `${waiting} warten auf Karren`,
    ]
      .filter((part) => part !== "")
      .join(", "),
  noPlants: "Noch keine Betriebe.",
  allIslandsOption: "Alle Inseln",
  stalled: (count: number, total: number) => `${count} von ${total} stehen`,
  // Minimap and world map
  minimap: "Minimap",
  minimapTip: "Minimap - Klick fährt die Kamera dorthin",
  worldTitle: "Weltkarte",
  worldHint:
    "Alle Inseln mit Besitz, Rohstoffen, Handelsrouten und Schiffen. Ein Klick fährt die Kamera dorthin.",
  legendOwn: "Deine Inseln",
  legendFree: "Unbesiedelt",
  legendRoute: "Handelsroute",
  legendShip: "Schiff",
  legendCamera: "Kamera",
  // Notifications
  confirm: "Bestätigen",
  look: "Hinsehen",
  storageFull: (good: string, island: string) =>
    `Lager voll: ${good} auf ${island}`,
  routeBlocked: (route: string, why: string) =>
    `Route blockiert: ${route} - ${why}`,
  populationGrew: (count: number) =>
    `Bevölkerung gewachsen: ${count} Einwohner`,
  unhappy: (percent: number) => `Einwohner unzufrieden (${percent} %)`,
  productionStopped: (name: string, why: string) =>
    `Produktion eingestellt: ${name} - ${why}`,
  kontorAttacked: (island: string) => `Kontor auf ${island} wird angegriffen!`,
  trespassAngry: (who: string) =>
    `${who} ist verärgert: Deine Truppen stehen auf seinem Land.`,
  trespassWar: (who: string) =>
    `${who} erklärt dir den Krieg - wegen deiner Truppen auf seinem Land!`,
  attackedBy: (who: string, island: string) =>
    `${who} greift ${island} an - Soldaten gelandet!`,
  // Main menu
  menuSubtitle: "Inseln, Handel und Gewerbe im Industriezeitalter",
  savedGames: "Spielstände",
  newGameHint: "Eine neue Inselwelt mit Rivalen, Handel und Forschung.",
} as const;
