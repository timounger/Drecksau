/**
 * The German texts of "Das politische Talent".
 *
 * @module
 * @remarks
 * All user facing wording in one place, so a change of tone stays a change of
 * one file. The rules' own vocabulary is kept as it is printed - Wahlkampf,
 * Regierungsbildung, Spielrunde, Ausrichtung - because that is what a player
 * who knows the box will look for on screen.
 */
import type { PolitikAction } from "@/games/politik/engine/state";

/**
 * A number of seats with the right word after it.
 *
 * @param seats - how many seats
 * @returns e.g. "1 Sitz" or "3 Sitze"
 */
export function seatWord(seats: number): string {
  return `${seats} ${seats === 1 ? "Sitz" : "Sitze"}`;
}

/** Every label the screens use. */
export const POLITIK_TEXTS = {
  title: "Das politische Talent",
  tagline:
    "Kandidat:innen aufstellen, Wahlkampf führen, Koalitionen schmieden.",
  newGame: "Neues Spiel",
  playOnline: "Online spielen",
  settings: "Einstellungen",
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Spielverlauf",

  settingsTitle: "Das politische Talent - Einstellungen",
  settingsSubtitle: "Wie viele Parteien am Tisch sitzen.",
  playerCount: "Spielerzahl",
  playerCountHint:
    "Du und die Computergegner. Die Sitze werden so verteilt, dass immer 60 im Parlament liegen.",
  settingsNote:
    "Änderungen gelten ab dem nächsten Spiel - das laufende bleibt, wie es ist.",

  phaseCandidate: "Kandidat:innen aufstellen",
  phaseCampaign: "Wahlkampf",
  phaseCoalition: "Regierungsbildung",
  phaseBallot: "Abstimmung",
  phaseAction: "Spielrunde",
  phaseGameOver: "Spielende",

  cycleRound: (cycle: number, cycles: number) =>
    `Durchgang ${Math.min(cycle, cycles)} von ${cycles}`,
  finalCampaign: "Letzter Wahlkampf",
  roundOf: (round: number, rounds: number) =>
    `Spielrunde ${round} von ${rounds}`,
  currentTheme: "Aktuelles Thema",
  majorityHint: (needed: number) => `Mehrheit ab ${needed} Sitzen`,

  seats: "Sitze",
  points: "Siegpunkte",
  pointsShort: "SP",
  yourParty: "Deine Partei",
  youShort: "Du",
  orientation: "Ausrichtung",
  candidate: "Kandidat:in",
  noCandidate: "Keine Kandidat:in",
  campaignPoints: "Wahlkampfpunkte",
  abilitiesTitle: "Fähigkeitspunkte",
  bonusMalus: "Bonus / Malus",
  scandals: "Skandale",
  scandalHidden: "verdeckt",
  promises: "Wahlversprechen",
  oppositionCards: "Opposition",
  government: "Regierung",
  noGovernment: "keine Regierung",
  botTookOver: "Computer",

  chooseCandidate: "Wähle 1 Kandidat:in",
  chooseCandidateHint:
    "Fähigkeitspunkte erleichtern Aktionen, Wahlkampfpunkte entscheiden Duelle.",
  keepCandidate: "Aktuelle behalten",
  takeCandidate: "Aufstellen",

  duelTitle: (attacker: string, defender: string) =>
    `${attacker} gegen ${defender}`,
  duelHint: "Beide würfeln, die Differenz wandert als Sitze.",
  rollDice: "Würfeln",
  duelDraw: "Unentschieden",
  duelWon: (name: string, seats: number) =>
    `${name} gewinnt ${seatWord(seats)}`,
  twoDice: "2 Würfel (eigenes Thema)",
  oneDie: "1 Würfel",

  coalitionTitle: "Regierung bilden",
  coalitionHint: (needed: number) =>
    `Wähle Partner und verteile die Ämter. Zusammen braucht ihr ${needed} Sitze.`,
  coalitionSeats: (seats: number) => `${seatWord(seats)} zusammen`,
  proposeCoalition: "Koalition vorschlagen",
  waitingForCoalition: (name: string) => `${name} verhandelt …`,

  ballotFor: "Dafür",
  ballotAgainst: "Dagegen",
  ballotCoalition: (name: string) => `${name} schlägt diese Koalition vor:`,
  ballotPromise: (name: string) =>
    `${name} will dieses Wahlversprechen einlösen:`,
  ballotChange: (name: string) =>
    `${name} schlägt einen Regierungswechsel vor:`,
  ballotWaiting: (name: string) => `${name} stimmt ab …`,
  ballotPassed: (seats: number) => `Angenommen - ${seats} Sitze dafür`,
  ballotFailed: (seats: number) => `Abgelehnt - nur ${seats} Sitze dafür`,

  chooseAction: "Wähle 1 Aktion",
  chooseTarget: "Wähle ein Ziel",
  chooseTheme: "Wähle ein Thema",
  choosePromise: "Wähle ein Wahlversprechen",
  chooseCard: "Wähle eine Karte",
  cancel: "Abbrechen",
  waitingFor: (name: string) => `${name} ist am Zug …`,

  checkPassed: (what: string, total: number) => `${what} gelungen (${total})`,
  checkFailed: (what: string, total: number) => `${what} misslungen (${total})`,

  gameOverTitle: "Endstand",
  winner: (name: string) => `${name} gewinnt!`,
  winnerShared: (names: string) => `Gleichstand: ${names}`,
  playAgain: "Nochmal spielen",
} as const;

/** What each action is called on the action board. */
export const ACTION_LABELS: Readonly<Record<PolitikAction["kind"], string>> = {
  swapCandidate: "Kandidat:in tauschen",
  opposition: "Opposition",
  promise: "Wahlversprechen einlösen",
  governmentChange: "Regierungswechsel",
  dirtyCampaign: "Dirty-Campaigning",
  poachSeat: "Sitz abwerben",
  changeTheme: "Thema ändern",
  revealScandal: "Skandal aufdecken",
  hideScandal: "Skandal verdecken",
  imageCampaign: "Imagekampagne",
};

/** The one line under each action, as the action board prints it. */
export const ACTION_HINTS: Readonly<Record<PolitikAction["kind"], string>> = {
  swapCandidate:
    "Gelingt immer. Ziehe 2 neue Kandidat:innen und tausche bei Bedarf.",
  opposition: "Gelingt immer. Nur ohne Regierung-Karte.",
  promise: "Abstimmung. Bei Mehrheit gibt es die Siegpunkte der Karte.",
  governmentChange: "Abstimmung. Bei Mehrheit werden die Ämter neu verteilt.",
  dirtyCampaign: "Manipulation + 1 Würfel: Malus an 1 Kandidat:in.",
  poachSeat: "Manipulation + 1 Würfel: 1 Sitz wechselt zu dir.",
  changeTheme: "Medien + 1 Würfel: Das aktuelle Thema ändert sich.",
  revealScandal: "Medien + 1 Würfel: 1 Skandal wird aufgedeckt.",
  hideScandal: "Popularität + 1 Würfel: 1 eigener Skandal wird verdeckt.",
  imageCampaign: "Popularität + 1 Würfel: Bonus für deine Kandidat:in.",
};
