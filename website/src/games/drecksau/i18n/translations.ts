/**
 * German user facing texts - card names, rule hints and log messages.
 *
 * @module
 */
import type { CardTheme } from "@/games/drecksau/assets/cards/themes";
import type { ActionCardType } from "@/games/drecksau/engine/cards";
import type { Difficulty } from "@/games/drecksau/engine/difficulty";

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
  extraMud: "Extra-Matsch",
  lipstick: "Lippenstift",
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
  extraMud:
    "Verteidigt automatisch: rettet eine eigene Drecksau vor Bauer und Regen.",
  lipstick:
    "Verteidigt automatisch: rettet eine eigene Schönsau vor Aus dem Staub.",
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
  extraMud: "\u{1F6E1}\u{FE0F}",
  lipstick: "\u{1F48B}",
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
  // Not really "blocked" - these are never actively played. The hint explains
  // why the card cannot be clicked to play.
  extraMud: "Wird automatisch eingesetzt, wenn du angegriffen wirst.",
  lipstick: "Wird automatisch eingesetzt, wenn du angegriffen wirst.",
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
  /** Big word on the end-of-game animation. */
  resultWon: "Gewonnen",
  resultLost: "Verloren",
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

/** Texts of the online multiplayer mode. */
export const ONLINE_TEXTS = {
  title: "Online spielen",
  subtitle: "Mit Freunden per Raumcode - alle brauchen nur den Link.",
  backToGame: "Zurück zum Spiel",
  yourName: "Dein Name",
  yourNamePlaceholder: "Spieler",
  createRoom: "Raum erstellen",
  joinRoom: "Raum beitreten",
  roomCode: "Raumcode",
  roomCodePlaceholder: "z. B. ABCD",
  connecting: "Verbinde ...",
  waitingForHost: "Warte auf den Gastgeber ...",
  lobbyTitle: "Lobby",
  shareHint: "Teile diesen Code oder Link, damit Freunde beitreten können:",
  copyCode: "Code kopieren",
  copyLink: "Link kopieren",
  copied: "Kopiert!",
  players: "Mitspieler",
  hostBadge: "Gastgeber",
  youBadge: "Du",
  startGame: "Spiel starten",
  needMorePlayers: "Mindestens 2 Mitspieler nötig.",
  onlyHostStarts: "Nur der Gastgeber kann das Spiel starten.",
  withExpansion: "Mit Erweiterung „Sauschön“",
  withDefense: "Mit „Drecksau total“ (Extra-Matsch & Lippenstift)",
  autoPlay: "Auto-Zug bei Untätigkeit",
  autoPlayHint:
    "Reagiert ein Spieler nicht rechtzeitig, übernimmt der Computer seinen Zug.",
  autoPlayOff: "Aus",
  autoPlaySeconds: (seconds: number) => `${seconds} Sekunden`,
  yourTurnOnline: "Du bist dran",
  waitingForPlayer: (name: string) => `${name} ist am Zug ...`,
  computerBadge: "Computer",
  computerPlaysFor: (name: string) => `Computer spielt für ${name} ...`,
  playerLeftTakeover: (name: string) =>
    `${name} hat das Spiel verlassen - der Computer übernimmt.`,
  leaveRoom: "Raum verlassen",
  newRound: "Neues Spiel",
  waitingForRematch: "Warte auf eine neue Runde vom Gastgeber ...",
  chatTitle: "Chat",
  chatPlaceholder: "Nachricht schreiben ...",
  chatSend: "Senden",
  chatEmpty: "Noch keine Nachrichten. Schreib etwas!",
  chatYou: "Du",
  chatNewest: "neu",
  errorConnect:
    "Verbindung fehlgeschlagen. Prüfe die Firebase-Einrichtung oder den Raumcode.",
  errorRoomNotFound:
    "Kein Raum mit diesem Code gefunden. Stimmt der Code, und läuft der Gastgeber noch?",
  hostLeftNotice:
    "Hinweis: Wenn der Gastgeber die Seite schließt, endet die Partie.",
} as const;

/** Texts of the settings page. */
export const SETTINGS_TEXTS = {
  title: "Einstellungen",
  subtitle: "Gilt nur in diesem Browser.",
  backToOverview: "Zurück zur Übersicht",
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
  defenseCards: "Extra-Matsch & Lippenstift („Drecksau total“)",
  defenseCardsHint:
    "Zwei Verteidigungskarten, die automatisch auslösen: Extra-Matsch rettet eine Drecksau vor Bauer und Regen, Lippenstift eine Schönsau vor Aus dem Staub. Lippenstift nur zusammen mit der Erweiterung.",
  cardTheme: "Kartendesign",
  cardThemeHint: "Wählt das Aussehen der Karten. Wirkt sofort.",
  difficulty: "Schwierigkeit",
  difficultyHint:
    "Wie stark die Computergegner spielen. Sie sehen nie deine Handkarten. Gilt ab dem nächsten Spiel.",
  playerCount: "Spieleranzahl",
  playerCountHint: "Du plus Computergegner. Gilt ab dem nächsten Spiel.",
  playerName: "Dein Name",
  playerNameHint:
    "Erscheint im Spielverlauf neben den Mitspielern. Leer lassen, dann heißt du einfach „Du“.",
  playerNamePlaceholder: "Du",
} as const;

/** Name of each card design, shown in the settings. */
export const CARD_THEME_LABELS: Readonly<Record<CardTheme, string>> = {
  modern: "Modern",
  klassisch: "Klassisch",
  benjamin: "Benjamin Blümchen",
};

/** Name of each difficulty level, shown in the settings. */
export const DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = {
  leicht: "Leicht",
  mittel: "Mittel",
  schwer: "Schwer",
};

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
  dustOffAttempt: (ownerName: string) =>
    `wirft Aus dem Staub auf die Schönsau von ${dativeName(ownerName)}.`,
  luckyBird: "Glücksvogel! Beide anderen Handkarten dürfen sofort raus.",
  extraMudScrub: "Extra-Matsch! Die Drecksau bleibt dreckig.",
  extraMudRain: (defended: number) =>
    defended === 1
      ? "Extra-Matsch! 1 Drecksau bleibt dreckig."
      : `Extra-Matsch! ${defended} Drecksäue bleiben dreckig.`,
  lipstickDefend: "Lippenstift! Die Schönsau bleibt schön.",
  discard: (cardName: string) => `legt ${cardName} ungenutzt ab.`,
  redraw: "ist blockiert und zieht 3 neue Karten.",
  reshuffle: "Der Ablagestapel wird neu gemischt.",
  win: (playerName: string) =>
    playerName === HUMAN_PLAYER_NAME
      ? "Du hast gewonnen!"
      : `${playerName} hat gewonnen!`,
} as const;
