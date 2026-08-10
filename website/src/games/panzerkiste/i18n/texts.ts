/**
 * German user-facing texts for Panzerkiste.
 *
 * @module
 */

/** Static texts of the Panzerkiste screen. */
export const PANZERKISTE_TEXTS = {
  // Die eigene Statistik dieses Spiels
  missionStats: "Missionen",
  arena: (n: number) => `Endlos ${n}`,
  wave: (n: number) => `Welle ${n}`,
  toEndless: "Endlosmodus",
  bestWave: "Weiteste Welle",
  bestLevel: "Weitestes Level",
  levelsCleared: "Level geschafft",
  accuracy: "Treffer je Schuss",
  shots: "Treffer / Schüsse",
  averageLevel: "Schnitt pro Level",
  fastestLevel: "Schnellstes Level",

  title: "Panzerkiste",
  subtitle: "Zerstöre alle feindlichen Panzer, um zu gewinnen.",
  // Heads-up display
  level: (n: number) => `Level ${n}`,
  mission: (n: number) => `Mission ${n}`,
  missionComplete: "Mission abgeschlossen!",
  destroyedTotal: (n: number) => `Zerstörte Panzer: ${n}`,
  enemiesLeft: (n: number) => `Gegner: ${n}`,
  lives: (n: number) => `Leben: ${n}`,
  minesLeft: (n: number) => `Minen: ${n}`,
  // Controls
  controlsTitle: "Steuerung",
  moveKeys: "Bewegen: W A S D",
  shootKeys: "Schießen: Linksklick",
  mineKeys: "Mine legen: Leertaste",
  touchControls:
    "Handy: links fahren, rechts tippen = zielen + schießen, rechts gedrückt halten = Mine legen",
  // Buttons / overlays
  start: "Los geht's",
  startHint: "Klick auf das Feld, um zu starten.",
  levelCleared: "Level geschafft!",
  bonusLife: "+1 Bonusleben!",
  nextLevel: "Nächstes Level",
  congratulations: "Herzlichen Glückwunsch!",
  won: "Alle Panzer zerstört - du hast gewonnen!",
  lost: "Dein Panzer wurde getroffen.",
  playAgain: "Nochmal",
  restart: "Neustart",
  newGame: "Neues Spiel",
  newGameTitle: "Von vorne anfangen: Level 1 mit vollen Leben",
  // Sound volume slider (game sounds only, never the voice chat)
  volumeLabel: "Lautstärke",
  volumeTitle: "Lautstärke der Spielgeräusche (nicht des Sprachchats)",
  volumePercent: (n: number) => `${n} %`,
  volumeMuted: "Stumm",
  // Navigation
  online: "Online spielen",
  fullscreen: "Vollbild",
  fullscreenExit: "Vollbild verlassen",
  statistics: "Statistik",
  paused: "Pause - klick zum Weiterspielen.",
  // Level jump buttons above the field
  levelBack: "◀ Level zurück",
  levelForward: "Level vor ▶",
  levelBackTitle: "Ein Level zurück und direkt starten",
  levelForwardTitle: "Ein Level vor und direkt starten",
  // Bestenliste
  boardTitle: "Bestenliste",
  boardSubtitle: "Weiteste Wellen in der Endlos-Arena",
  boardEmpty: "Noch niemand eingetragen - deine Welle könnte die erste sein.",
  boardLoading: "Bestenliste wird geladen …",
  boardFailed: "Bestenliste nicht erreichbar.",
  boardYours: "Deine Arena",
  boardMadeIt: (place: number) =>
    `Platz ${place} - trag deinen Namen ein und du stehst auf der Liste.`,
  boardMissed: "Diesmal nicht unter den besten zehn. Die aktuelle Liste:",
  boardKept: (best: string) =>
    `Dein Rekord ${best} steht schon auf der Liste - diesmal kamst du nicht so weit. Jeder Name hat einen Platz, und das ist sein bester Lauf.`,
  boardPartial:
    "Nur Läufe ohne Levelsprung kommen in die Liste - hier wurde vorgespult.",
  boardEnter: "Eintragen",
  boardEntering: "Wird eingetragen …",
  boardEntered: "Eingetragen!",
  boardNamePlaceholder: "Dein Name",
  boardWave: (wave: number) => `Welle ${wave}`,
} as const;
