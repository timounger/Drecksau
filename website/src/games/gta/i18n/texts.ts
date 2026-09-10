/**
 * Everything GTA says on screen.
 *
 * @module
 */

/** The four quarters of town, by name. */
export const DISTRICT_NAMES: Readonly<Record<string, string>> = {
  grove: "Grove Street",
  ballas: "Idlewood",
  vagos: "East Beach",
  beach: "Santa Maria",
};

/** Every line the screen shows. */
export const GTA_TEXTS = {
  title: "GTA",
  tagline: "Los Santos von schräg oben: fahren, liefern, abhauen.",
  newGame: "Neues Spiel",
  turbo: "Turbo (Cheat)",
  god: "Unsterblich (Cheat)",
  settingsTitle: "GTA - Einstellungen",
  backToGame: "Zurück zum Spiel",
  zoomLabel: "Wie nah die Kamera steht",
  zoomHint:
    "Je näher, desto größer sind Figur, Autos und Häuser - und desto weniger Straße siehst du kommen. Die Geschwindigkeiten bleiben gleich.",
  zoomBlocks: (blocks: number): string =>
    `${String(blocks).replace(".", ",")} Blöcke breit`,
  money: (amount: number): string => `${amount} €`,
  respect: (amount: number): string => `Respekt ${amount}`,
  health: (amount: number): string => `${amount} %`,
  wanted: "Fahndung",
  onFoot: "zu Fuß",
  driving: "am Steuer",
  districts: (owned: number, all: number): string => `Viertel ${owned}/${all}`,
  ownedMark: "übernommen",
  jobLeft: (seconds: number): string => `noch ${seconds} s`,
  noJob: "Kein Auftrag",
  busted: "Verhaftet",
  bustedText:
    "Die Streife hatte dich. Jetzt hast du die Wahl: die Strafe absitzen und die Kaution zahlen - oder ausbrechen.",
  serve: "Strafe absitzen",
  breakOut: "Ausbrechen",
  escapeTitle: "Ausbruch",
  escapeTask: "Auftrag",
  escapeCaught: (left: number): string => `${left} Versuche übrig`,
  escapeMates: (count: number): string =>
    count === 1
      ? "1 Mitgefangener folgt dir"
      : `${count} Mitgefangene folgen dir`,
  wasted: "Krankenhaus",
  wastedText:
    "Das war zu viel. Die Rechnung ist bezahlt, und du stehst wieder auf der Straße.",
  won: "Los Santos gehört dir",
  wonText:
    "Alle vier Viertel übernommen. Mehr Respekt geht in dieser Stadt nicht.",
  carryOn: "Weiter",
  fullscreen: "Vollbild",
  fullscreenExit: "Vollbild verlassen",
  controls: "Steuerung",
  log: "Was passiert ist",
} as const;
