/**
 * The German texts of Wurfduell.
 *
 * @module
 */
import type { Difficulty } from "@/games/wurfduell/engine/ai";

/** Every label the screens use. */
export const WURFDUELL_TEXTS = {
  title: "Wurfduell",
  tagline: "Zielen, Kraft laden, loslassen - wer zuerst k.o. ist, verliert.",
  online: "Online spielen",
  statistics: "Statistik",
  fullscreen: "Vollbild",
  fullscreenExit: "Vollbild beenden",
  soundOn: "Ton an",
  soundOff: "Ton aus",
  newMatch: "Neue Partie",

  settings: "Einstellungen",
  settingsTitle: "Wurfduell - Einstellungen",
  settingsSubtitle: "Gegner, Ton, Kamera und Zielhilfe.",
  backToGame: "Zurück zum Spiel",
  settingsNote:
    "Wird in diesem Browser gemerkt und gilt sofort, auch in einer laufenden Partie.",
  difficultyTitle: "Computer-Gegner",
  difficultyHint:
    "Wie gut der Computer zielt und den Wind liest - und wie gern er seine Fähigkeiten einsetzt.",
  soundTitle: "Ton",
  soundHint: "Wurf-, Treffer- und Jubelgeräusche.",
  cameraTitle: "Kamera",
  cameraHint:
    "Folgen: Die Kamera steht beim Werfer und fliegt dem Wurf hinterher. Übersicht: das ganze Feld auf einmal, dafür alles kleiner.",
  cameraModes: { follow: "Folgen", overview: "Übersicht" },
  aimDotsTitle: "Zielhilfe",
  aimDotsHint:
    "Punkte für den Anfang der Flugbahn beim Kraftladen (immer ohne Wind).",
  on: "An",
  off: "Aus",
  difficulty: "Computer:",
  difficulties: {
    leicht: "Leicht",
    mittel: "Mittel",
    schwer: "Schwer",
  } satisfies Record<Difficulty, string>,

  pickTitle: "Wähle deine Figur",
  pickConfirm: "Diese Figur nehmen",
  choosing: "wählt noch …",
  throws: "Wirft",
  abilities: "Fähigkeiten (je 1x)",
  lifePoints: (n: number) => `${n} LP`,

  you: "Du",
  computer: "Computer",
  yourTurn: "Du bist dran - zielen, gedrückt halten, loslassen!",
  turnOf: (name: string) => `${name} ist dran`,
  watching: "Der Wurf fliegt …",
  angle: (n: number) => `Winkel ${Math.round(n)}°`,
  holdToThrow: "Halten = Kraft laden",
  releaseToThrow: "Loslassen = werfen!",
  abilityArmed: (name: string) => `Mit diesem Wurf: ${name}`,
  abilitiesTitle: "Fähigkeiten",
  used: "verbraucht",
  resign: "Aufgeben",
  resignConfirm: "Wirklich aufgeben? Die Partie zählt als verloren.",
  autoThrow: "Zeit abgelaufen - automatischer schwacher Wurf.",

  headHit: "KOPFTREFFER!",
  faceHit: "MITTEN INS GESICHT!",
  shieldHit: "Schild!",
  burnPopup: (n: number) => `-${n} brennt!`,
  frozenPopup: "Eingefroren!",

  wonTitle: "Gewonnen!",
  lostTitle: "K.o.!",
  resignedTitle: "Aufgegeben",
  winnerIs: (name: string) => `${name} gewinnt!`,
  byKnockout: "durch K.o.",
  byResign: "durch Aufgabe",
  lifeLeft: (hp: number, max: number) => `${hp} / ${max} LP übrig`,
  scoreLabel: "Stand",
  score: (a: number, b: number) => `${a} : ${b}`,
  rematch: "Revanche",
  rematchWaiting: "Warte auf den Gegner …",
  rematchWanted: (name: string) => `${name} will eine Revanche!`,
  otherFighter: "Andere Figur",

  controlsPointer:
    "Maus/Finger: Pfeil zeigt zur Maus = Winkel. Gedrückt halten lädt die Kraft (pendelt hoch und runter), Loslassen wirft.",
  controlsKeys:
    "Tastatur: Pfeil hoch/runter = Winkel, Leertaste halten = Kraft laden, loslassen = werfen, 1-3 = Fähigkeit.",
  controlsHint:
    "Die Punkte beim Laden zeigen nur den Anfang der Bahn - ohne Wind.",

  duelStats: "Wurfduell-Zahlen",
  statThrows: "Würfe",
  statAccuracy: "Treffer-Quote",
  statHeadHits: "Kopftreffer",
  statMatches: "Siege / Partien",
  statFlawless: "Ohne Kratzer gewonnen",
  statFavourite: "Lieblingsfigur",
  statFavouriteAbility: "Liebste Fähigkeit",
  statAbilities: "Fähigkeiten eingesetzt",
} as const;
