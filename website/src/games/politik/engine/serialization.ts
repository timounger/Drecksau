/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so it survives a round trip unchanged - but what
 * comes back may be from an older version, hand-edited or simply broken. This
 * guard is the one place that decides whether to trust it. Card ids are checked
 * for shape, not for existence: a redacted snapshot carries a 0 wherever a card
 * is none of the reader's business, and that has to pass.
 */
import { THEMES, type Office, type Theme } from "./cards";
import type {
  Ballot,
  CandidateOffer,
  HeldScandal,
  OfficeAssignment,
  Player,
  PolitikGame,
  Proposal,
} from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = [
  "candidate",
  "campaign",
  "coalition",
  "ballot",
  "action",
  "gameOver",
];

/** The offices a stored player may claim to hold. */
const OFFICES: readonly string[] = [
  "kanzleramt",
  "finanzen",
  "inneres",
  "justiz",
];

/** The kinds a stored vote may claim to be. */
const BALLOT_KINDS: readonly string[] = [
  "coalition",
  "promise",
  "governmentChange",
];

/**
 * Checks an unknown value really is a game of "Das politische Talent".
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isPolitikGame(value: unknown): value is PolitikGame {
  const game = value as PolitikGame;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    Array.isArray(game.players) &&
    game.players.length > 0 &&
    game.players.every(isPlayer) &&
    isIndex(game.turn, game.players.length) &&
    isIndex(game.firstSeat, game.players.length) &&
    isCount(game.cycle) &&
    isCount(game.round) &&
    isCount(game.duel) &&
    isTheme(game.theme) &&
    Array.isArray(game.themeDeck) &&
    game.themeDeck.every(isTheme) &&
    isIdList(game.candidateDeck) &&
    isIdList(game.scandalDeck) &&
    (game.offer === null || isOffer(game.offer)) &&
    (game.ballot === null || isBallot(game.ballot, game.players.length)) &&
    Array.isArray(game.attempted) &&
    game.attempted.every((seat) => isIndex(seat, game.players.length)) &&
    typeof game.noGovernmentPoints === "boolean" &&
    typeof game.seed === "number" &&
    typeof game.rng === "number" &&
    Array.isArray(game.log) &&
    game.log.every((line) => typeof line === "string")
  );
}

/** Checks one party. */
function isPlayer(value: unknown): value is Player {
  const player = value as Player;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    typeof player.color === "string" &&
    isCount(player.orientationId) &&
    Array.isArray(player.themes) &&
    player.themes.every(isTheme) &&
    isCount(player.seats) &&
    isCount(player.points) &&
    (player.candidateId === null || isId(player.candidateId)) &&
    isCount(player.bonus) &&
    isCount(player.malus) &&
    Array.isArray(player.scandals) &&
    player.scandals.every(isHeldScandal) &&
    isIdList(player.promises) &&
    isIdList(player.opposition) &&
    Array.isArray(player.offices) &&
    player.offices.every(isOffice)
  );
}

/** Checks one scandal lying in front of a party. */
function isHeldScandal(value: unknown): value is HeldScandal {
  const held = value as HeldScandal;
  return (
    isObject(value) && isId(held.cardId) && typeof held.revealed === "boolean"
  );
}

/** Checks the two candidates somebody is choosing between. */
function isOffer(value: unknown): value is CandidateOffer {
  const offer = value as CandidateOffer;
  return (
    isObject(value) &&
    isCount(offer.seat) &&
    isIdList(offer.cardIds) &&
    typeof offer.isSwap === "boolean"
  );
}

/** Checks a vote going round the table. */
function isBallot(value: unknown, seats: number): value is Ballot {
  const ballot = value as Ballot;
  return (
    isObject(value) &&
    BALLOT_KINDS.includes(ballot.kind) &&
    isIndex(ballot.actor, seats) &&
    (ballot.promiseId === null || isId(ballot.promiseId)) &&
    (ballot.proposal === null || isProposal(ballot.proposal, seats)) &&
    Array.isArray(ballot.votes) &&
    ballot.votes.length === seats &&
    ballot.votes.every((vote) => vote === null || typeof vote === "boolean")
  );
}

/** Checks a government somebody put on the table. */
function isProposal(value: unknown, seats: number): value is Proposal {
  const proposal = value as Proposal;
  return (
    isObject(value) &&
    isIndex(proposal.by, seats) &&
    Array.isArray(proposal.members) &&
    proposal.members.every((seat) => isIndex(seat, seats)) &&
    Array.isArray(proposal.offices) &&
    proposal.offices.every((entry) => isAssignment(entry, seats))
  );
}

/** Checks one office handed to one seat. */
function isAssignment(
  value: unknown,
  seats: number,
): value is OfficeAssignment {
  const entry = value as OfficeAssignment;
  return (
    isObject(value) && isOffice(entry.office) && isIndex(entry.seat, seats)
  );
}

/** Whether a value is one of the six themes. */
function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && THEMES.includes(value as Theme);
}

/** Whether a value is one of the four offices. */
function isOffice(value: unknown): value is Office {
  return typeof value === "string" && OFFICES.includes(value);
}

/** Whether a value is a card id, 0 included - that is the hidden placeholder. */
function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/** Whether a value is a list of card ids. */
function isIdList(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isId);
}

/** Whether a value is a seat index of a table that size. */
function isIndex(value: unknown, size: number): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < size
  );
}

/** Whether a value is a non-negative whole number. */
function isCount(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/** Whether a value is a non-null object. */
function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}
