/**
 * German user facing texts - card names, rule hints and log messages.
 *
 * @module
 */
import type { ActionCardType } from "@/game/cards";

/** Short name of each card, as printed on the physical card. */
export const CARD_NAMES: Readonly<Record<ActionCardType, string>> = {
  mud: "Matsch",
  rain: "Regen",
  barn: "Stall",
  lightning: "Blitz",
  lightningRod: "Blitzableiter",
  farmerScrubs: "Bauer schrubbt die Sau",
  barnDoor: "Bauer-ärgere-dich",
  beauty: "Schönsau",
  dustOff: "Aus dem Staub",
  luckyBird: "Glücksvogel",
};

/** What each card does, shown on the card in the hand. */
export const CARD_DESCRIPTIONS: Readonly<Record<ActionCardType, string>> = {
  mud: "Macht ein eigenes sauberes Schwein zur Drecksau.",
  rain: "Alle Drecksäue ohne Stall werden sauber - auch die eigenen.",
  barn: "Schützt ein eigenes Schwein vor Regen.",
  lightning: "Fackelt den Stall eines Mitspielers ab.",
  lightningRod: "Macht einen eigenen Stall unzerstörbar.",
  farmerScrubs: "Schrubbt eine fremde Drecksau sauber - auch im Stall.",
  barnDoor: "Vernagelt einen eigenen Stall mit Drecksau gegen den Bauern.",
  beauty: "Auf ein beliebiges Schwein legen - es wird sauschön.",
  dustOff: "Entfernt eine beliebige Schönsau wieder.",
  luckyBird: "Spiel deine beiden anderen Handkarten sofort aus.",
};

/** Emoji shown on each card - keeps the board readable without artwork. */
export const CARD_ICONS: Readonly<Record<ActionCardType, string>> = {
  mud: "\u{1FAA3}",
  rain: "\u{1F327}\u{FE0F}",
  barn: "\u{1F3E0}",
  lightning: "\u{26A1}",
  lightningRod: "\u{1F517}",
  farmerScrubs: "\u{1F9FD}",
  barnDoor: "\u{1F528}",
  beauty: "\u{1F484}",
  dustOff: "\u{1F4A8}",
  luckyBird: "\u{1F426}",
};

/** Why a card cannot be played right now - shown as a hint on the card. */
export const CARD_BLOCKED_HINTS: Readonly<Record<ActionCardType, string>> = {
  mud: "Du hast kein sauberes Schwein mehr.",
  rain: "",
  barn: "Alle deine Schweine haben schon einen Stall.",
  lightning: "Kein Mitspieler hat einen ungeschützten Stall.",
  lightningRod: "Du hast keinen Stall ohne Blitzableiter.",
  farmerScrubs: "Keine erreichbare fremde Drecksau.",
  barnDoor: "Du hast keinen Stall mit einer Drecksau darin.",
  beauty: "Kein Schwein frei für eine Schönsau.",
  dustOff: "Es liegt keine Schönsau aus.",
  luckyBird: "",
};

/** Static texts of the user interface. */
export const UI_TEXTS = {
  appTitle: "Drecksau",
  tagline: "Wer zuerst nur noch Drecksäue hat, gewinnt.",
  taglineExpansion:
    "Wer zuerst nur noch Drecksäue oder nur noch Schönsäue hat, gewinnt.",
  yourTurn: "Du bist dran",
  opponentTurn: "ist am Zug",
  yourHand: "Deine Handkarten",
  yourPigs: "Deine Schweine",
  drawPile: "Nachziehstapel",
  discardPile: "Ablagestapel",
  log: "Spielverlauf",
  newGame: "Neues Spiel",
  playAgain: "Nochmal spielen",
  youWon: "Du hast gewonnen!",
  playerWon: (playerName: string) => `${playerName} hat gewonnen!`,
  chooseTarget: "Ziel wählen",
  cancel: "Abbrechen",
  discard: "Ablegen",
  redrawHand: "Blockiert - 3 neue Karten ziehen",
  redrawHint: "Keine deiner Karten ist spielbar.",
  luckyBirdPending: (remaining: number) =>
    remaining === 1
      ? "Glücksvogel: noch 1 Karte ausspielen oder ablegen - danach ziehst du 3 neue."
      : `Glücksvogel: noch ${remaining} Karten ausspielen oder ablegen - danach ziehst du 3 neue.`,
  cleanPig: "Sauberschwein",
  dirtyPig: "Drecksau",
  beautyPig: "Schönsau",
  barnLabel: "Stall",
  rodLabel: "Blitzableiter",
  doorLabel: "vernagelt",
  playerCount: "Mitspieler",
  rulesLink: "Spielregeln",
  cardsLeft: "Karten",
  statistics: "Statistik",
  settings: "Einstellungen",
} as const;

/** Texts of the settings page. */
export const SETTINGS_TEXTS = {
  title: "Einstellungen",
  subtitle: "Gilt nur in diesem Browser.",
  backToGame: "Zurück zum Spiel",
  animations: "Animationen",
  animationsHint:
    "Kurze Effekte, wenn eine Karte gespielt wird - z. B. Regen über den Bildschirm.",
  reducedMotionNotice:
    "Dein System ist auf „Bewegung reduzieren“ gestellt. Deshalb sind Animationen hier standardmäßig aus - du kannst sie aber jederzeit einschalten.",
  on: "An",
  off: "Aus",
  expansion: "Erweiterung „Sauschön“",
  expansionHint:
    "Bringt Schönsau, Aus dem Staub und Glücksvogel ins Spiel. Du gewinnst dann entweder mit lauter Drecksäuen oder mit lauter Schönsäuen. Jeder hat dann 3 Schweine.",
  expansionNotice: "Gilt ab dem nächsten Spiel.",
  playerName: "Dein Name",
  playerNameHint:
    "Erscheint im Spielverlauf neben den Mitspielern. Leer lassen, dann heißt du einfach „Du“.",
  playerNamePlaceholder: "Du",
} as const;

/** Texts of the statistics page. */
export const STATS_TEXTS = {
  title: "Statistik",
  subtitle: "Wird nur in deinem Browser gespeichert.",
  backToGame: "Zurück zum Spiel",
  startedGames: "Spiele begonnen",
  finishedGames: "Abgeschlossen",
  abandonedGames: "Abgebrochen oder laufend",
  wins: "Gewonnen",
  losses: "Verloren",
  winRate: "Siegquote",
  totalPlayTime: "Gesamte Spielzeit",
  averagePlayTime: "Schnitt pro Spiel",
  fastestWin: "Schnellster Sieg",
  lastPlayed: "Zuletzt gespielt",
  nothingYet: "Noch nichts gespielt.",
  reset: "Statistik zurücksetzen",
  resetConfirm:
    "Wirklich alles zurücksetzen? Das laufende Spiel geht dabei verloren.",
  resetDone: "Zurückgesetzt.",
  noValue: "-",
} as const;

/**
 * Name of the human player.
 *
 * @remarks
 * Lives here because the log has to inflect it - see {@link dativeName}.
 */
export const HUMAN_PLAYER_NAME = "Du";

/**
 * Builds the log line for a played or discarded card.
 *
 * @param playerName - who acted
 * @param text - what happened, already phrased
 * @returns the finished log line
 */
export function logLine(playerName: string, text: string): string {
  return `${playerName}: ${text}`;
}

/**
 * Dative form of a player name, for phrases like "der Stall von ...".
 *
 * @param playerName - the player to name
 * @returns "dir" for the human player, the plain name for the opponents
 * @example
 * ```ts
 * `Der Stall von ${dativeName("Du")} brennt ab.` // "... von dir brennt ab."
 * ```
 */
export function dativeName(playerName: string): string {
  return playerName === HUMAN_PLAYER_NAME ? "dir" : playerName;
}

/** Log phrasings for the effects of each card. */
export const LOG_TEXTS = {
  mud: "Matsch! Ein Schwein ist jetzt eine Drecksau.",
  rain: (cleaned: number) => {
    let text: string;
    switch (cleaned) {
      case 0:
        text = "Regen! Aber es war keine Drecksau im Freien.";
        break;
      case 1:
        text = "Regen! 1 Drecksau wurde sauber.";
        break;
      default:
        text = `Regen! ${cleaned} Drecksäue wurden sauber.`;
    }
    return text;
  },
  barn: "baut einen Stall.",
  lightning: (victimName: string) =>
    `Blitz! Der Stall von ${dativeName(victimName)} brennt ab.`,
  lightningRod: "montiert einen Blitzableiter.",
  farmerScrubs: (victimName: string) =>
    `Der Bauer schrubbt eine Drecksau von ${dativeName(victimName)}.`,
  barnDoor: "vernagelt die Stalltür.",
  beauty: (ownerName: string) =>
    `Schönsau! Ein Schwein von ${dativeName(ownerName)} ist jetzt sauschön.`,
  dustOff: (ownerName: string, wasDirty: boolean) =>
    `Aus dem Staub! Die Schönsau von ${dativeName(ownerName)} ist weg - darunter ${
      wasDirty ? "steckte eine Drecksau" : "steckte ein Sauberschwein"
    }.`,
  luckyBird: "Glücksvogel! Beide anderen Handkarten dürfen sofort raus.",
  discard: (cardName: string) => `legt ${cardName} ungenutzt ab.`,
  redraw: "ist blockiert und zieht 3 neue Karten.",
  reshuffle: "Der Ablagestapel wird neu gemischt.",
  win: (playerName: string) => `${playerName} hat gewonnen!`,
} as const;
