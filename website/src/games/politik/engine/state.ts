/**
 * The game state of "Das politische Talent" and the moves that change it.
 *
 * @module
 * @remarks
 * One plain, serialisable value: every party, the seats in parliament, the
 * running phase and the generator's cursor. Cards are stored as ids only, so a
 * saved game stays small and a snapshot travels cheaply.
 *
 * Randomness lives **in** the state ({@link PolitikGame.rng}), not outside it.
 * The game rolls dice from the first campaign to the last, and an online host
 * has to be able to hand a guest's move to {@link ../engine/moves.applyMove}
 * and get exactly one possible answer.
 */
import { candidateById, scandalById } from "./cards";
import type { Ability, Office, Theme } from "./cards";

/** Fewest and most players a game seats. */
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;

/**
 * How many seats each party starts with, by table size.
 *
 * @remarks
 * Always 60 seats on the board, however many parties share them - which is why
 * the majority is the same number in every game.
 */
export const START_SEATS: Readonly<Record<number, number>> = {
  3: 20,
  4: 15,
  5: 12,
  6: 10,
};

/** Seats a coalition needs to govern, and a vote needs to pass. */
export const MAJORITY_SEATS = 31;

/** Nobody may hold more than this many seats at once. */
export const MAX_SEATS = 26;

/** Most seats one duel can move, however big the difference is. */
export const MAX_DUEL_SEATS = 3;

/** A dice check succeeds from this result on. */
export const CHECK_TARGET = 4;

/** Caps of the bonus and malus chips on one candidate. */
export const MAX_BONUS = 3;
export const MAX_MALUS = 3;

/** Campaigns with a government formation and three Spielrunden each. */
export const CYCLES = 3;

/** Spielrunden between two campaigns. */
export const ROUNDS_PER_CYCLE = 3;

/** Candidates offered to choose from, at the start and on a swap. */
export const CANDIDATE_OFFER = 2;

/** Scandals that accompany a candidate until they resign. */
export const SCANDALS_PER_CANDIDATE = 2;

/** Opposition cards each player is dealt. */
export const OPPOSITION_PER_PLAYER = 2;

/** Election promises dealt per theme of a party's orientation. */
export const PROMISES_PER_THEME = 2;

/** Victory points for holding the most seats after the closing campaign. */
export const FINAL_SEATS_POINTS = 5;

/** Victory points each, if several parties share the most seats. */
export const FINAL_SEATS_POINTS_SHARED = 3;

/** The party colours, in the order seats are handed out. */
export const PARTY_COLORS: readonly string[] = [
  "rot",
  "schwarz",
  "blau",
  "gruen",
  "rosa",
  "gelb",
];

/** The ink each party colour is drawn with. */
export const PARTY_INK: Readonly<Record<string, string>> = {
  rot: "#dc2626",
  schwarz: "#3f3f46",
  blau: "#2563eb",
  gruen: "#16a34a",
  rosa: "#db2777",
  gelb: "#eab308",
};

/** German label of every party colour. */
export const PARTY_LABELS: Readonly<Record<string, string>> = {
  rot: "Rot",
  schwarz: "Schwarz",
  blau: "Blau",
  gruen: "Grün",
  rosa: "Rosa",
  gelb: "Gelb",
};

/** One scandal in front of a player, face down until somebody uncovers it. */
export type HeldScandal = {
  /** The card id, or 0 where a redacted snapshot hides it. */
  readonly cardId: number;
  readonly revealed: boolean;
};

/** One party at the table. */
export type Player = {
  readonly name: string;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
  /** The party colour, an entry of {@link PARTY_COLORS}. */
  readonly color: string;
  /** The orientation card's id. */
  readonly orientationId: number;
  /** The themes of the orientation card, for quick reading. */
  readonly themes: readonly Theme[];
  readonly seats: number;
  readonly points: number;
  /** The candidate's card id, or null after a resignation. */
  readonly candidateId: number | null;
  /** Bonus chips on the candidate, 0 to {@link MAX_BONUS}. */
  readonly bonus: number;
  /** Malus chips on the candidate, 0 to {@link MAX_MALUS}. */
  readonly malus: number;
  readonly scandals: readonly HeldScandal[];
  /** Election promises still in hand, as card ids. */
  readonly promises: readonly number[];
  /** Opposition cards in hand, as ids; 0 where a snapshot hides one. */
  readonly opposition: readonly number[];
  /** The government offices this party holds. */
  readonly offices: readonly Office[];
};

/** How far the game has got. */
export type PolitikPhase =
  /** Somebody has two candidates in front of them and picks one. */
  | "candidate"
  /** Duels against the left-hand neighbour, one after the other. */
  | "campaign"
  /** The strongest party has to put a coalition together. */
  | "coalition"
  /** A vote is going round the table. */
  | "ballot"
  /** A Spielrunde: everybody takes one action. */
  | "action"
  /** The closing campaign is played out and everything is counted. */
  | "gameOver";

/** Two candidates in front of one seat, waiting to be chosen between. */
export type CandidateOffer = {
  readonly seat: number;
  /** The two candidate ids; 0 for the other players' redacted view. */
  readonly cardIds: readonly number[];
  /** True when this is the swap action, where the old candidate may be kept. */
  readonly isSwap: boolean;
};

/** Who gets which office in a proposed government. */
export type OfficeAssignment = {
  readonly office: Office;
  readonly seat: number;
};

/** A government somebody has put on the table. */
export type Proposal = {
  /** The seat that proposed it. */
  readonly by: number;
  /** The seats that would be in government. */
  readonly members: readonly number[];
  readonly offices: readonly OfficeAssignment[];
};

/** What a running vote is about. */
export type BallotKind =
  /** Confirming a proposed coalition; every partner has to agree. */
  | "coalition"
  /** An election promise; a majority of seats passes it. */
  | "promise"
  /** Reshuffling the government mid-round; a majority of seats passes it. */
  | "governmentChange";

/** A vote going round the table. */
export type Ballot = {
  readonly kind: BallotKind;
  /** The seat that called the vote; it always counts as a yes. */
  readonly actor: number;
  /** The promise being voted on, for {@link BallotKind} `promise`. */
  readonly promiseId: number | null;
  /** The government being voted on, for the two proposal votes. */
  readonly proposal: Proposal | null;
  /** One entry per seat: true yes, false no, null not asked yet. */
  readonly votes: readonly (boolean | null)[];
};

/** What one campaign duel came to. */
export type DuelResult = {
  readonly attacker: number;
  readonly defender: number;
  readonly attackerDice: readonly number[];
  readonly defenderDice: readonly number[];
  readonly attackerTotal: number;
  readonly defenderTotal: number;
  /** Seats that changed hands, already capped at {@link MAX_DUEL_SEATS}. */
  readonly seats: number;
  /** The winning seat, or null for a draw. */
  readonly winner: number | null;
};

/** What a dice check came to, so the screen can show the roll. */
export type CheckResult = {
  readonly seat: number;
  readonly ability: Ability;
  readonly abilityPoints: number;
  readonly die: number;
  readonly total: number;
  readonly passed: boolean;
  /** What the player was trying to do, already in German. */
  readonly what: string;
};

/** How a vote ended, so the screen can show it before moving on. */
export type BallotResult = {
  readonly kind: BallotKind;
  readonly actor: number;
  readonly passed: boolean;
  /** Seats that voted yes, the caller included. */
  readonly yesSeats: number;
  /** What was voted on, already in German. */
  readonly what: string;
};

/** One action a player may take in a Spielrunde. */
export type PolitikAction =
  /** Draw two candidates and swap if you like; always succeeds. */
  | { readonly kind: "swapCandidate" }
  /** Play an opposition card; only without a government office. */
  | {
      readonly kind: "opposition";
      readonly cardId: number;
      readonly target?: number;
      readonly theme?: Theme;
    }
  /** Put an election promise to the vote. */
  | { readonly kind: "promise"; readonly cardId: number }
  /** Put a new government to the vote. */
  | {
      readonly kind: "governmentChange";
      readonly members: readonly number[];
      readonly offices: readonly OfficeAssignment[];
    }
  /** Manipulation check: a malus on a candidate of your choice. */
  | { readonly kind: "dirtyCampaign"; readonly target: number }
  /** Manipulation check: one seat changes party. */
  | { readonly kind: "poachSeat"; readonly target: number }
  /** Medien check: the current theme changes. */
  | { readonly kind: "changeTheme"; readonly theme: Theme }
  /** Medien check: uncover one scandal. */
  | {
      readonly kind: "revealScandal";
      readonly target: number;
      readonly scandalIndex: number;
    }
  /** Popularität check: cover one of your own scandals again. */
  | { readonly kind: "hideScandal"; readonly scandalIndex: number }
  /** Popularität check: a bonus on your own candidate. */
  | { readonly kind: "imageCampaign" };

/** A move a seat can make. */
export type PolitikMove =
  /** Pick one of the two offered candidates; -1 keeps the current one. */
  | { readonly kind: "chooseCandidate"; readonly index: number }
  /** Roll out the duel that is due. */
  | { readonly kind: "duel" }
  /** Put a coalition on the table. */
  | {
      readonly kind: "propose";
      readonly members: readonly number[];
      readonly offices: readonly OfficeAssignment[];
    }
  /** Answer the vote that is going round. */
  | { readonly kind: "vote"; readonly accept: boolean }
  /** Take this Spielrunde's one action. */
  | { readonly kind: "act"; readonly action: PolitikAction };

/** The whole game at one instant. */
export type PolitikGame = {
  readonly phase: PolitikPhase;
  readonly players: readonly Player[];
  /** 1 to {@link CYCLES} for the normal cycles, one more for the closing one. */
  readonly cycle: number;
  /** The Spielrunde inside the cycle, 1 to {@link ROUNDS_PER_CYCLE}. */
  readonly round: number;
  /** The seat that may act, whatever the phase means by that. */
  readonly turn: number;
  /** The seat that opened the current campaign or Spielrunde. */
  readonly firstSeat: number;
  /** The theme the campaign is fought on. */
  readonly theme: Theme;
  /** The remaining theme cards; the last entry is the next one turned up. */
  readonly themeDeck: readonly Theme[];
  /** Candidate cards still to be drawn; discards go to the back. */
  readonly candidateDeck: readonly number[];
  /** Scandal cards still to be drawn; discards go to the back. */
  readonly scandalDeck: readonly number[];
  /** The two candidates somebody is choosing between, or null. */
  readonly offer: CandidateOffer | null;
  /** Which duel of the campaign is due, counted from {@link firstSeat}. */
  readonly duel: number;
  /** The duel just played, for the screen; null before the first one. */
  readonly lastDuel: DuelResult | null;
  /** The dice check just made, for the screen. */
  readonly lastCheck: CheckResult | null;
  /** The vote just finished, for the screen. */
  readonly lastBallot: BallotResult | null;
  /** The vote going round right now, or null. */
  readonly ballot: Ballot | null;
  /** Seats that have already tried to form a government this cycle. */
  readonly attempted: readonly number[];
  /** Set by a Misstrauensvotum: no government points this Spielrunde. */
  readonly noGovernmentPoints: boolean;
  /** The seed the game was dealt from. */
  readonly seed: number;
  /** The generator's cursor - see the module remarks. */
  readonly rng: number;
  /** What happened, newest last - shown as the game log. */
  readonly log: readonly string[];
};

/**
 * The seats in parliament all told.
 *
 * @param game - the current game
 * @returns the sum of every party's seats
 */
export function totalSeats(game: PolitikGame): number {
  return game.players.reduce((sum, player) => sum + player.seats, 0);
}

/**
 * What the uncovered scandals cost a party.
 *
 * @param player - the party
 * @returns the campaign points its candidate loses
 * @remarks
 * Only uncovered scandals count. A covered one keeps its card id secret in a
 * redacted snapshot, and since it does not count either, nobody can work out
 * from the numbers what is lying there.
 */
export function scandalPenalty(player: Player): number {
  return player.scandals.reduce(
    (sum, held) =>
      held.revealed ? sum + (scandalById(held.cardId)?.penalty ?? 0) : sum,
    0,
  );
}

/**
 * How strong a party's candidate is in a duel right now.
 *
 * @param player - the party to weigh up
 * @returns the campaign points, with bonus, malus and uncovered scandals
 * @remarks
 * A party without a candidate goes into a duel with nothing but its dice -
 * which is exactly why losing one hurts.
 */
export function campaignStrength(player: Player): number {
  const base =
    player.candidateId === null
      ? 0
      : (candidateById(player.candidateId)?.campaignPoints ?? 0);
  return Math.max(
    0,
    base + player.bonus - player.malus - scandalPenalty(player),
  );
}

/**
 * How many points a candidate has in one ability.
 *
 * @param player - the party
 * @param ability - the ability to read
 * @returns the ability points, 0 without a candidate
 */
export function abilityPoints(player: Player, ability: Ability): number {
  return player.candidateId === null
    ? 0
    : (candidateById(player.candidateId)?.abilities[ability] ?? 0);
}

/**
 * How many dice a party rolls in the campaign.
 *
 * @param player - the party
 * @param theme - the theme currently turned up
 * @returns two dice if the theme is one of theirs, otherwise one
 */
export function diceCount(player: Player, theme: Theme): number {
  return player.themes.includes(theme) ? 2 : 1;
}

/**
 * The seat holding the Bundeskanzleramt.
 *
 * @param game - the current game
 * @returns the seat index, or null while nobody holds it
 */
export function chancellorSeat(game: PolitikGame): number | null {
  const index = game.players.findIndex((player) =>
    player.offices.includes("kanzleramt"),
  );
  return index < 0 ? null : index;
}

/**
 * Whether a party sits in government.
 *
 * @param player - the party
 * @returns true if it holds at least one office
 */
export function isInGovernment(player: Player): boolean {
  return player.offices.length > 0;
}

/**
 * The seats that hold at least one office.
 *
 * @param game - the current game
 * @returns the government seats, in seat order
 */
export function governmentSeats(game: PolitikGame): readonly number[] {
  return game.players
    .map((player, seat) => (isInGovernment(player) ? seat : -1))
    .filter((seat) => seat >= 0);
}

/**
 * The parties with the most seats.
 *
 * @param game - the current game
 * @returns every seat sharing the highest number of seats
 */
export function seatLeaders(game: PolitikGame): readonly number[] {
  const best = game.players.reduce(
    (most, player) => Math.max(most, player.seats),
    0,
  );
  return game.players
    .map((player, seat) => (player.seats === best ? seat : -1))
    .filter((seat) => seat >= 0);
}

/**
 * The parties with the most victory points - the winners once it is over.
 *
 * @param game - the current game
 * @returns every seat sharing the highest score
 */
export function leaders(game: PolitikGame): readonly number[] {
  const best = game.players.reduce(
    (most, player) => Math.max(most, player.points),
    0,
  );
  return game.players
    .map((player, seat) => (player.points === best ? seat : -1))
    .filter((seat) => seat >= 0);
}

/**
 * Which ability a dice-check action leans on.
 *
 * @param kind - the action
 * @returns the ability whose points are added, or null if it is no check
 */
export function abilityOf(kind: PolitikAction["kind"]): Ability | null {
  const table: Partial<Record<PolitikAction["kind"], Ability>> = {
    dirtyCampaign: "manipulation",
    poachSeat: "manipulation",
    changeTheme: "medien",
    revealScandal: "medien",
    hideScandal: "popularitaet",
    imageCampaign: "popularitaet",
  };
  return table[kind] ?? null;
}
