/**
 * German user-facing texts for Panzerkiste.
 *
 * @module
 */

/** Static texts of the Panzerkiste screen. */
export const PANZERKISTE_TEXTS = {
  title: "Panzerkiste",
  subtitle: "Zerstöre alle feindlichen Panzer, um zu gewinnen.",
  // Heads-up display
  level: (n: number) => `Level ${n}`,
  enemiesLeft: (n: number) => `Gegner: ${n}`,
  lives: (n: number) => `Leben: ${n}`,
  minesLeft: (n: number) => `Minen: ${n}`,
  // Controls
  controlsTitle: "Steuerung",
  moveKeys: "Bewegen: W A S D",
  shootKeys: "Schießen: Linksklick",
  mineKeys: "Mine legen: Leertaste",
  // Buttons / overlays
  start: "Los geht's",
  startHint: "Klick auf das Feld, um zu starten.",
  levelCleared: "Level geschafft!",
  nextLevel: "Nächstes Level",
  won: "Alle Panzer zerstört - du hast gewonnen!",
  lost: "Dein Panzer wurde getroffen.",
  playAgain: "Nochmal",
  restart: "Neustart",
  // Navigation
  statistics: "Statistik",
  paused: "Pause - klick zum Weiterspielen.",
  // Level jump buttons above the field
  levelBack: "◀ Level zurück",
  levelForward: "Level vor ▶",
  levelBackTitle: "Ein Level zurück und direkt starten",
  levelForwardTitle: "Ein Level vor und direkt starten",
} as const;
