/**
 * The rules of "Das politische Talent": which move is allowed, and what it does.
 *
 * @module
 * @remarks
 * Every function here is pure. {@link applyMove} is the one referee: it returns
 * the new game or null when the move is not allowed right now, so an online
 * host can hand a guest's move straight to it without checking anything first.
 *
 * The dice are rolled from the cursor stored in the game
 * ({@link PolitikGame.rng}), and the new cursor is written back with the same
 * move. A move therefore has exactly one possible outcome - which is what lets
 * a client verify the host instead of having to take its word.
 */
import {
  THEME_LABELS,
  candidateById,
  officeCard,
  officesFor,
  oppositionById,
  promiseById,
  scandalById,
  type OppositionCard,
  type Theme,
} from "./cards";
import { createRandom, type Random } from "./random";
import {
  CANDIDATE_OFFER,
  CHECK_TARGET,
  CYCLES,
  MAJORITY_SEATS,
  MAX_BONUS,
  MAX_DUEL_SEATS,
  MAX_MALUS,
  MAX_SEATS,
  ROUNDS_PER_CYCLE,
  SCANDALS_PER_CANDIDATE,
  FINAL_SEATS_POINTS,
  FINAL_SEATS_POINTS_SHARED,
  abilityOf,
  abilityPoints,
  campaignStrength,
  chancellorSeat,
  diceCount,
  governmentSeats,
  isInGovernment,
  seatLeaders,
  type Ballot,
  type OfficeAssignment,
  type Player,
  type PolitikAction,
  type PolitikGame,
  type PolitikMove,
  type Proposal,
} from "./state";

/** The action kinds, in the order the action board lists them. */
export const ACTION_KINDS: readonly PolitikAction["kind"][] = [
  "swapCandidate",
  "opposition",
  "promise",
  "governmentChange",
  "dirtyCampaign",
  "poachSeat",
  "changeTheme",
  "revealScandal",
  "hideScandal",
  "imageCampaign",
];

/**
 * Whose turn it is.
 *
 * @param game - the current game
 * @returns the seat that may act, or null once the game is over
 * @remarks
 * There is always exactly one, whatever the phase means by "act": choosing a
 * candidate, rolling a duel, proposing a coalition, casting the next vote or
 * taking the Spielrunde's action. The turn-based online layer needs that.
 */
export function seatOnTurn(game: PolitikGame): number | null {
  return game.phase === "gameOver" ? null : game.turn;
}

/**
 * The action kinds a seat could take right now.
 *
 * @param game - the current game
 * @param seat - the party asking
 * @returns the kinds that have a legal target, empty outside their turn
 * @remarks
 * The screen greys out what is missing its target - there is no point offering
 * "Skandal verdecken" to somebody with nothing uncovered - and the computer
 * player picks from the same list, so both see the same game.
 */
export function availableActions(
  game: PolitikGame,
  seat: number,
): readonly PolitikAction["kind"][] {
  let kinds: PolitikAction["kind"][] = [];
  if (game.phase === "action" && seat === game.turn) {
    const player = game.players[seat];
    if (player.candidateId === null) {
      // Without a candidate the rules leave exactly one thing to do.
      kinds = ["swapCandidate"];
    } else {
      kinds = ACTION_KINDS.filter((kind) => hasTarget(game, seat, kind));
    }
  }
  return kinds;
}

/**
 * Plays a move as the referee.
 *
 * @param game - the current game
 * @param seat - the party making the move
 * @param move - what they want to do
 * @returns the game after the move, or null if it was not allowed
 */
export function applyMove(
  game: PolitikGame,
  seat: number,
  move: PolitikMove,
): PolitikGame | null {
  let next: PolitikGame | null = null;
  if (seat === game.turn && seat >= 0 && seat < game.players.length) {
    switch (move.kind) {
      case "chooseCandidate":
        next = chooseCandidate(game, seat, move.index);
        break;
      case "duel":
        next = game.phase === "campaign" ? playDuel(game) : null;
        break;
      case "propose":
        next = propose(game, seat, move.members, move.offices);
        break;
      case "vote":
        next = castVote(game, seat, move.accept);
        break;
      case "act":
        next = game.phase === "action" ? act(game, seat, move.action) : null;
        break;
    }
  }
  return next;
}

/**
 * The proposals that would be a legal government.
 *
 * @param game - the current game
 * @param members - the seats that would govern
 * @param offices - who gets which office
 * @param needMajority - true while forming a government after a campaign
 * @returns true if the proposal could be put on the table
 * @remarks
 * Exported because the screen has to grey out the "propose" button on exactly
 * the same grounds the referee would refuse it on.
 */
export function isProposalLegal(
  game: PolitikGame,
  members: readonly number[],
  offices: readonly OfficeAssignment[],
  needMajority: boolean,
): boolean {
  const inPlay = officesFor(game.players.length).map((entry) => entry.office);
  const seats = members.reduce(
    (sum, member) => sum + (game.players[member]?.seats ?? 0),
    0,
  );
  const unique = new Set(members);
  return (
    members.length > 0 &&
    unique.size === members.length &&
    members.every((member) => member >= 0 && member < game.players.length) &&
    offices.length === inPlay.length &&
    inPlay.every((office) =>
      offices.some((entry) => entry.office === office),
    ) &&
    offices.every((entry) => members.includes(entry.seat)) &&
    (!needMajority || seats >= MAJORITY_SEATS)
  );
}

/**
 * Whether a party may play a given opposition card the way it was aimed.
 *
 * @param game - the current game
 * @param seat - the party playing it
 * @param action - the opposition action as it would be played
 * @returns true if the card is in hand, playable and properly aimed
 */
export function isOppositionLegal(
  game: PolitikGame,
  seat: number,
  action: Extract<PolitikAction, { kind: "opposition" }>,
): boolean {
  const player = game.players[seat];
  const card = oppositionById(action.cardId);
  let legal = false;
  if (
    card !== null &&
    player.opposition.includes(action.cardId) &&
    !isInGovernment(player)
  ) {
    switch (card.targeting) {
      case "none":
        legal = true;
        break;
      case "player":
        legal =
          action.target !== undefined &&
          action.target >= 0 &&
          action.target < game.players.length;
        break;
      case "governmentMember":
        legal =
          action.target !== undefined &&
          governmentSeats(game).includes(action.target);
        break;
      case "theme":
        legal = action.theme !== undefined && action.theme !== game.theme;
        break;
    }
  }
  return legal;
}

/* ------------------------------------------------------------------ *
 * Choosing a candidate                                                *
 * ------------------------------------------------------------------ */

/** Takes one of the offered candidates, or keeps the current one on a swap. */
function chooseCandidate(
  game: PolitikGame,
  seat: number,
  index: number,
): PolitikGame | null {
  const offer = game.offer;
  let next: PolitikGame | null = null;
  if (game.phase === "candidate" && offer !== null && offer.seat === seat) {
    const keeps = index === -1;
    const takes = index >= 0 && index < offer.cardIds.length;
    if (keeps && offer.isSwap && game.players[seat].candidateId !== null) {
      next = afterCandidate(
        {
          ...game,
          candidateDeck: [...game.candidateDeck, ...offer.cardIds],
          offer: null,
          log: [
            ...game.log,
            `${game.players[seat].name} bleibt bei der eigenen Kandidat:in.`,
          ],
        },
        seat,
        offer.isSwap,
      );
    } else if (takes) {
      next = afterCandidate(
        takeCandidate(game, offer, seat, index),
        seat,
        offer.isSwap,
      );
    }
  }
  return next;
}

/** Puts the chosen candidate in front of the party and deals fresh scandals. */
function takeCandidate(
  game: PolitikGame,
  offer: NonNullable<PolitikGame["offer"]>,
  seat: number,
  index: number,
): PolitikGame {
  const player = game.players[seat];
  const chosen = offer.cardIds[index];
  const returned = offer.cardIds.filter((id) => id !== chosen);
  const oldCards = player.candidateId === null ? [] : [player.candidateId];
  const drawn = game.scandalDeck.slice(0, SCANDALS_PER_CANDIDATE);
  const oldScandals = player.scandals.map((held) => held.cardId);
  const name = candidateById(chosen)?.name ?? "";
  return {
    ...game,
    players: withPlayer(game.players, seat, {
      candidateId: chosen,
      bonus: 0,
      malus: 0,
      scandals: drawn.map((cardId) => ({ cardId, revealed: false })),
    }),
    candidateDeck: [...game.candidateDeck, ...returned, ...oldCards],
    scandalDeck: [
      ...game.scandalDeck.slice(SCANDALS_PER_CANDIDATE),
      ...oldScandals,
    ],
    offer: null,
    log: [...game.log, `${player.name} stellt ${name} auf.`],
  };
}

/**
 * Carries on after a candidate is settled.
 *
 * @remarks
 * Two very different situations end here, and the offer says which: during the
 * preparation it travels round the table until every party has somebody, and
 * then the first campaign begins. A swap offer was this Spielrunde's action, so
 * the turn is simply over.
 */
function afterCandidate(
  game: PolitikGame,
  seat: number,
  wasSwap: boolean,
): PolitikGame {
  let next: PolitikGame;
  if (wasSwap) {
    next = endTurn(game, seat);
  } else {
    const waiting = nextWithoutCandidate(game, seat);
    next =
      waiting === null
        ? startCampaign(game)
        : {
            ...game,
            turn: waiting,
            offer: dealOffer(game, waiting, false),
            candidateDeck: game.candidateDeck.slice(CANDIDATE_OFFER),
          };
  }
  return next;
}

/** The next party round the table that has nobody standing yet. */
function nextWithoutCandidate(game: PolitikGame, seat: number): number | null {
  const count = game.players.length;
  let found: number | null = null;
  for (let step = 1; step <= count && found === null; step++) {
    const candidateSeat = (seat + step) % count;
    if (game.players[candidateSeat].candidateId === null) {
      found = candidateSeat;
    }
  }
  return found;
}

/** Lays two candidates out in front of a seat. */
function dealOffer(
  game: PolitikGame,
  seat: number,
  isSwap: boolean,
): PolitikGame["offer"] {
  return {
    seat,
    cardIds: game.candidateDeck.slice(0, CANDIDATE_OFFER),
    isSwap,
  };
}

/* ------------------------------------------------------------------ *
 * Wahlkampf                                                           *
 * ------------------------------------------------------------------ */

/** Opens a campaign: the Bundeskanzleramt starts, else whoever started last. */
function startCampaign(game: PolitikGame): PolitikGame {
  const first = chancellorSeat(game) ?? game.firstSeat;
  return {
    ...game,
    phase: "campaign",
    firstSeat: first,
    turn: first,
    duel: 0,
    lastDuel: null,
    lastCheck: null,
    lastBallot: null,
    log: [
      ...game.log,
      `Wahlkampf - aktuelles Thema: ${THEME_LABELS[game.theme]}.`,
    ],
  };
}

/**
 * Rolls out the duel that is due.
 *
 * @remarks
 * Each party takes on the neighbour to its left. The difference in seats
 * changes hands, capped at three however lopsided the roll was, and neither
 * party may end up over the ceiling or under zero - what would go beyond
 * simply lapses, as the rules put it.
 */
function playDuel(game: PolitikGame): PolitikGame {
  const count = game.players.length;
  const attacker = game.turn;
  const defender = (attacker + 1) % count;
  const random = createRandom(game.rng);
  const attackerDice = rollDice(random, game.players[attacker], game.theme);
  const defenderDice = rollDice(random, game.players[defender], game.theme);
  const attackerTotal =
    campaignStrength(game.players[attacker]) + sum(attackerDice);
  const defenderTotal =
    campaignStrength(game.players[defender]) + sum(defenderDice);
  const gap = Math.min(MAX_DUEL_SEATS, Math.abs(attackerTotal - defenderTotal));
  const winner =
    attackerTotal === defenderTotal
      ? null
      : attackerTotal > defenderTotal
        ? attacker
        : defender;
  const loser =
    winner === null ? null : winner === attacker ? defender : attacker;

  const moved =
    winner === null || loser === null
      ? game.players
      : moveSeats(game.players, winner, loser, gap);
  const result = {
    attacker,
    defender,
    attackerDice,
    defenderDice,
    attackerTotal,
    defenderTotal,
    seats: winner === null ? 0 : gap,
    winner,
  };
  const played: PolitikGame = {
    ...game,
    players: moved,
    lastDuel: result,
    rng: random.state(),
    log: [...game.log, duelLine(game, result)],
  };
  return game.duel + 1 >= count
    ? endCampaign(played)
    : { ...played, duel: played.duel + 1, turn: (attacker + 1) % count };
}

/** Moves seats from the loser to the winner, respecting both limits. */
function moveSeats(
  players: readonly Player[],
  winner: number,
  loser: number,
  gap: number,
): readonly Player[] {
  const gained = Math.min(gap, MAX_SEATS - players[winner].seats);
  const lost = Math.min(gap, players[loser].seats);
  return withPlayer(
    withPlayer(players, winner, {
      seats: players[winner].seats + Math.max(0, gained),
    }),
    loser,
    { seats: players[loser].seats - lost },
  );
}

/** Rolls a party's campaign dice - two if the theme is one of theirs. */
function rollDice(
  random: Random,
  player: Player,
  theme: Theme,
): readonly number[] {
  const dice: number[] = [];
  for (let index = 0; index < diceCount(player, theme); index++) {
    dice.push(random.roll());
  }
  return dice;
}

/** The log line one duel leaves behind. */
function duelLine(game: PolitikGame, result: DuelLike): string {
  const attacker = game.players[result.attacker].name;
  const defender = game.players[result.defender].name;
  const score = `${result.attackerTotal}:${result.defenderTotal}`;
  const seats = `${result.seats} ${result.seats === 1 ? "Sitz" : "Sitze"}`;
  return result.winner === null
    ? `${attacker} gegen ${defender} - unentschieden (${score}).`
    : `${attacker} gegen ${defender} ${score} - ${game.players[result.winner].name} gewinnt ${seats}.`;
}

/** Just enough of a duel result for the log line. */
type DuelLike = NonNullable<PolitikGame["lastDuel"]>;

/**
 * Closes a campaign: a new theme comes up, then the government is formed.
 *
 * @remarks
 * After the closing campaign there is nothing left to form - everything is
 * counted instead.
 */
function endCampaign(game: PolitikGame): PolitikGame {
  const turned = turnTheme(game);
  return turned.cycle > CYCLES ? finish(turned) : startCoalition(turned);
}

/** Turns the next theme up and puts the old one under the pile. */
function turnTheme(game: PolitikGame): PolitikGame {
  const deck = [...game.themeDeck];
  const next = deck.pop() ?? game.theme;
  return {
    ...game,
    theme: next,
    themeDeck: [game.theme, ...deck],
  };
}

/* ------------------------------------------------------------------ *
 * Regierungsbildung                                                   *
 * ------------------------------------------------------------------ */

/** Hands the negotiations to whoever has the most seats. */
function startCoalition(game: PolitikGame): PolitikGame {
  const cleared = {
    ...game,
    players: game.players.map((player) => ({ ...player, offices: [] })),
    attempted: [],
  };
  return openNegotiation(cleared);
}

/**
 * Gives the next party a go at forming a government.
 *
 * @remarks
 * The strongest party starts; if its coalition is voted down, the next
 * strongest tries. Once everyone has tried, the round is played without a
 * government at all - nobody scores office points, and the turn order stays as
 * it was. The rule book does not say what happens when the talks fail, so this
 * is the house rule: no government is a result too.
 */
function openNegotiation(game: PolitikGame): PolitikGame {
  const leader = strongestUntried(game);
  return leader === null
    ? startRound(
        {
          ...game,
          log: [
            ...game.log,
            "Keine Regierung kommt zustande - die Runde wird ohne gespielt.",
          ],
        },
        1,
      )
    : {
        ...game,
        phase: "coalition",
        turn: leader,
        log: [
          ...game.log,
          `${game.players[leader].name} beginnt die Regierungsverhandlungen.`,
        ],
      };
}

/** The party with the most seats that has not tried to form a government. */
function strongestUntried(game: PolitikGame): number | null {
  const count = game.players.length;
  let best: number | null = null;
  for (let step = 0; step < count; step++) {
    // Walking from the seat that opened lets a tie go to whoever sits earlier.
    const seat = (game.firstSeat + step) % count;
    const better =
      best === null || game.players[seat].seats > game.players[best].seats;
    if (!game.attempted.includes(seat) && better) {
      best = seat;
    }
  }
  return best;
}

/** Puts a coalition on the table, and calls the vote on it. */
function propose(
  game: PolitikGame,
  seat: number,
  members: readonly number[],
  offices: readonly OfficeAssignment[],
): PolitikGame | null {
  let next: PolitikGame | null = null;
  if (
    game.phase === "coalition" &&
    members.includes(seat) &&
    isProposalLegal(game, members, offices, true)
  ) {
    const proposal: Proposal = { by: seat, members, offices };
    const alone = members.length === 1;
    next = alone
      ? startRound(installGovernment(game, proposal), 1)
      : openBallot(game, {
          kind: "coalition",
          actor: seat,
          promiseId: null,
          proposal,
          votes: game.players.map(() => null),
        });
  }
  return next;
}

/** Writes a proposal's offices onto the parties. */
function installGovernment(game: PolitikGame, proposal: Proposal): PolitikGame {
  const names = proposal.offices
    .map(
      (entry) =>
        `${officeCard(entry.office).title}: ${game.players[entry.seat].name}`,
    )
    .join(", ");
  return {
    ...game,
    players: game.players.map((player, seat) => ({
      ...player,
      offices: proposal.offices
        .filter((entry) => entry.seat === seat)
        .map((entry) => entry.office),
    })),
    log: [...game.log, `Neue Regierung - ${names}.`],
  };
}

/* ------------------------------------------------------------------ *
 * Abstimmungen                                                        *
 * ------------------------------------------------------------------ */

/** Starts a vote and puts the first voter on turn. */
function openBallot(game: PolitikGame, ballot: Ballot): PolitikGame {
  const voter = nextVoter(game, ballot);
  return voter === null
    ? resolveBallot(game, ballot)
    : { ...game, phase: "ballot", ballot, turn: voter, lastBallot: null };
}

/** Records one vote and moves on, or settles the matter. */
function castVote(
  game: PolitikGame,
  seat: number,
  accept: boolean,
): PolitikGame | null {
  const ballot = game.ballot;
  let next: PolitikGame | null = null;
  if (
    game.phase === "ballot" &&
    ballot !== null &&
    mayVote(game, ballot, seat)
  ) {
    const votes = ballot.votes.map((vote, at) => (at === seat ? accept : vote));
    const updated: Ballot = { ...ballot, votes };
    const voter = nextVoter(game, updated);
    next =
      voter === null
        ? resolveBallot(game, updated)
        : { ...game, ballot: updated, turn: voter };
  }
  return next;
}

/** Whether a seat still owes this vote an answer. */
function mayVote(game: PolitikGame, ballot: Ballot, seat: number): boolean {
  return (
    ballot.votes[seat] === null &&
    seat !== ballot.actor &&
    (ballot.kind !== "coalition" ||
      ballot.proposal?.members.includes(seat) === true)
  );
}

/** The next seat that has to answer, going round from the caller. */
function nextVoter(game: PolitikGame, ballot: Ballot): number | null {
  const count = game.players.length;
  let found: number | null = null;
  for (let step = 1; step < count && found === null; step++) {
    const seat = (ballot.actor + step) % count;
    if (mayVote(game, ballot, seat)) {
      found = seat;
    }
  }
  return found;
}

/** Counts the votes and carries out what they decided. */
function resolveBallot(game: PolitikGame, ballot: Ballot): PolitikGame {
  const yesSeats = game.players.reduce(
    (sum, player, seat) =>
      seat === ballot.actor || ballot.votes[seat] === true
        ? sum + player.seats
        : sum,
    0,
  );
  let next: PolitikGame;
  switch (ballot.kind) {
    case "coalition":
      next = resolveCoalition(game, ballot);
      break;
    case "promise":
      next = resolvePromise(game, ballot, yesSeats);
      break;
    case "governmentChange":
      next = resolveGovernmentChange(game, ballot, yesSeats);
      break;
  }
  return { ...next, ballot: null };
}

/** A coalition needs every proposed partner to agree - it is a contract. */
function resolveCoalition(game: PolitikGame, ballot: Ballot): PolitikGame {
  const proposal = ballot.proposal as Proposal;
  const passed = proposal.members.every(
    (member) => member === ballot.actor || ballot.votes[member] === true,
  );
  const noted = {
    ...game,
    lastBallot: {
      kind: ballot.kind,
      actor: ballot.actor,
      passed,
      yesSeats: proposal.members.reduce(
        (sum, member) => sum + game.players[member].seats,
        0,
      ),
      what: "Koalition",
    },
  };
  return passed
    ? startRound(installGovernment(noted, proposal), 1)
    : openNegotiation({
        ...noted,
        attempted: [...noted.attempted, ballot.actor],
        log: [
          ...noted.log,
          `Die Koalition von ${game.players[ballot.actor].name} kommt nicht zustande.`,
        ],
      });
}

/**
 * Settles a promise vote.
 *
 * @remarks
 * The party that played it scores the card. So does everybody who voted for it
 * and campaigns on that theme - that is what the orientation card promises, and
 * it is the reason a promise vote is worth thinking about rather than blocking
 * out of habit.
 */
function resolvePromise(
  game: PolitikGame,
  ballot: Ballot,
  yesSeats: number,
): PolitikGame {
  const card = promiseById(ballot.promiseId ?? 0);
  const passed = yesSeats >= MAJORITY_SEATS && card !== null;
  let next: PolitikGame = game;
  if (passed && card !== null) {
    const players = game.players.map((player, seat) => {
      const supports = seat === ballot.actor || ballot.votes[seat] === true;
      const shares = player.themes.includes(card.theme);
      const scores = seat === ballot.actor || (supports && shares);
      return {
        ...player,
        points: player.points + (scores ? card.points : 0),
        promises:
          seat === ballot.actor
            ? player.promises.filter((id) => id !== card.id)
            : player.promises,
      };
    });
    next = {
      ...game,
      players,
      log: [
        ...game.log,
        `"${card.title}" wird beschlossen (${yesSeats} Sitze dafür).`,
      ],
    };
  } else {
    next = {
      ...game,
      log: [
        ...game.log,
        `"${card?.title ?? "Wahlversprechen"}" findet keine Mehrheit (${yesSeats} Sitze).`,
      ],
    };
  }
  return endTurn(
    {
      ...next,
      lastBallot: {
        kind: ballot.kind,
        actor: ballot.actor,
        passed,
        yesSeats,
        what: card?.title ?? "Wahlversprechen",
      },
    },
    ballot.actor,
  );
}

/** Settles a Regierungswechsel: a majority of seats reshuffles the offices. */
function resolveGovernmentChange(
  game: PolitikGame,
  ballot: Ballot,
  yesSeats: number,
): PolitikGame {
  const proposal = ballot.proposal as Proposal;
  const passed = yesSeats >= MAJORITY_SEATS;
  const changed = passed ? installGovernment(game, proposal) : game;
  return endTurn(
    {
      ...changed,
      lastBallot: {
        kind: ballot.kind,
        actor: ballot.actor,
        passed,
        yesSeats,
        what: "Regierungswechsel",
      },
      log: passed
        ? changed.log
        : [
            ...changed.log,
            `Der Regierungswechsel findet keine Mehrheit (${yesSeats} Sitze).`,
          ],
    },
    ballot.actor,
  );
}

/* ------------------------------------------------------------------ *
 * Spielrunden                                                         *
 * ------------------------------------------------------------------ */

/** Opens a Spielrunde; the Bundeskanzleramt starts it. */
function startRound(game: PolitikGame, round: number): PolitikGame {
  const first = chancellorSeat(game) ?? game.firstSeat;
  return {
    ...game,
    phase: "action",
    round,
    firstSeat: first,
    turn: first,
    offer: null,
    ballot: null,
    noGovernmentPoints: false,
    log: [...game.log, `Spielrunde ${round} von ${ROUNDS_PER_CYCLE}.`],
  };
}

/** Takes a party's one action of the Spielrunde. */
function act(
  game: PolitikGame,
  seat: number,
  action: PolitikAction,
): PolitikGame | null {
  let next: PolitikGame | null = null;
  const kinds = availableActions(game, seat);
  if (kinds.includes(action.kind)) {
    switch (action.kind) {
      case "swapCandidate":
        next = {
          ...game,
          phase: "candidate",
          offer: dealOffer(game, seat, true),
          candidateDeck: game.candidateDeck.slice(CANDIDATE_OFFER),
          lastCheck: null,
        };
        break;
      case "opposition":
        next = playOpposition(game, seat, action);
        break;
      case "promise":
        next = putPromise(game, seat, action.cardId);
        break;
      case "governmentChange":
        next = isProposalLegal(game, action.members, action.offices, false)
          ? openBallot(game, {
              kind: "governmentChange",
              actor: seat,
              promiseId: null,
              proposal: {
                by: seat,
                members: action.members,
                offices: action.offices,
              },
              votes: game.players.map(() => null),
            })
          : null;
        break;
      default:
        next = runCheck(game, seat, action);
        break;
    }
  }
  return next;
}

/** Puts an election promise to the table. */
function putPromise(
  game: PolitikGame,
  seat: number,
  cardId: number,
): PolitikGame | null {
  const card = promiseById(cardId);
  let next: PolitikGame | null = null;
  if (card !== null && game.players[seat].promises.includes(cardId)) {
    next = openBallot(
      {
        ...game,
        lastCheck: null,
        log: [
          ...game.log,
          `${game.players[seat].name} stellt "${card.title}" zur Abstimmung.`,
        ],
      },
      {
        kind: "promise",
        actor: seat,
        promiseId: cardId,
        proposal: null,
        votes: game.players.map(() => null),
      },
    );
  }
  return next;
}

/**
 * Rolls a dice check and carries out the action if it passes.
 *
 * @remarks
 * Ability points plus one die, four or more succeeds. The turn ends either
 * way - "egal, ob erfolgreich oder nicht", as the rule book puts it.
 */
function runCheck(
  game: PolitikGame,
  seat: number,
  action: PolitikAction,
): PolitikGame | null {
  const ability = abilityOf(action.kind);
  let next: PolitikGame | null = null;
  if (ability !== null) {
    const random = createRandom(game.rng);
    const points = abilityPoints(game.players[seat], ability);
    const die = random.roll();
    const total = points + die;
    const passed = total >= CHECK_TARGET;
    const rolled: PolitikGame = {
      ...game,
      rng: random.state(),
      lastCheck: {
        seat,
        ability,
        abilityPoints: points,
        die,
        total,
        passed,
        what: checkLabel(action),
      },
      log: [
        ...game.log,
        `${game.players[seat].name}: ${checkLabel(action)} - ${points} + ${die} = ${total}, ${passed ? "gelungen" : "misslungen"}.`,
      ],
    };
    next = endTurn(passed ? applyCheck(rolled, seat, action) : rolled, seat);
  }
  return next;
}

/** What a dice-check action is called, for the log and the screen. */
function checkLabel(action: PolitikAction): string {
  const labels: Partial<Record<PolitikAction["kind"], string>> = {
    dirtyCampaign: "Dirty-Campaigning",
    poachSeat: "Sitz abwerben",
    changeTheme: "Thema ändern",
    revealScandal: "Skandal aufdecken",
    hideScandal: "Skandal verdecken",
    imageCampaign: "Imagekampagne",
  };
  return labels[action.kind] ?? action.kind;
}

/** Carries out a dice-check action that passed. */
function applyCheck(
  game: PolitikGame,
  seat: number,
  action: PolitikAction,
): PolitikGame {
  let next: PolitikGame = game;
  switch (action.kind) {
    case "dirtyCampaign":
      next = addMalus(game, action.target, 1);
      break;
    case "poachSeat":
      next = poach(game, seat, action.target, 1);
      break;
    case "changeTheme":
      next = setTheme(game, action.theme);
      break;
    case "revealScandal":
      next = revealScandal(game, action.target, action.scandalIndex);
      break;
    case "hideScandal":
      next = hideScandal(game, seat, action.scandalIndex);
      break;
    case "imageCampaign":
      next = addBonus(game, seat, 1);
      break;
  }
  return next;
}

/* ------------------------------------------------------------------ *
 * Opposition                                                          *
 * ------------------------------------------------------------------ */

/** Plays an opposition card; the effect is immediate and the card is gone. */
function playOpposition(
  game: PolitikGame,
  seat: number,
  action: Extract<PolitikAction, { kind: "opposition" }>,
): PolitikGame | null {
  const card = oppositionById(action.cardId);
  let next: PolitikGame | null = null;
  if (card !== null && isOppositionLegal(game, seat, action)) {
    const spent: PolitikGame = {
      ...game,
      players: withPlayer(game.players, seat, {
        opposition: game.players[seat].opposition.filter(
          (id) => id !== action.cardId,
        ),
      }),
      lastCheck: null,
      log: [
        ...game.log,
        `${game.players[seat].name} spielt "${card.title}": ${card.text}`,
      ],
    };
    next = endTurn(oppositionEffect(spent, seat, card, action), seat);
  }
  return next;
}

/** Carries out one opposition card's effect. */
function oppositionEffect(
  game: PolitikGame,
  seat: number,
  card: OppositionCard,
  action: Extract<PolitikAction, { kind: "opposition" }>,
): PolitikGame {
  const target = action.target ?? seat;
  let next: PolitikGame = game;
  switch (card.effect) {
    case "noGovernmentPoints":
      next = { ...game, noGovernmentPoints: true };
      break;
    case "drainPoints":
      next = addPoints(game, target, -card.amount);
      break;
    case "revealScandal":
      next = revealScandal(game, target, firstCovered(game, target));
      break;
    case "revealGovernmentScandals":
      next = governmentSeats(game).reduce(
        (state, member) =>
          revealScandal(state, member, firstCovered(state, member)),
        game,
      );
      break;
    case "seatsFromLeader":
      next = poach(game, seat, biggestOther(game, seat), card.amount);
      break;
    case "seatsFromTarget":
      next = poach(game, seat, target, card.amount);
      break;
    case "malusOnTarget":
      next = addMalus(game, target, card.amount);
      break;
    case "bonusOnSelf":
      next = addBonus(game, seat, card.amount);
      break;
    case "changeTheme":
      next = action.theme === undefined ? game : setTheme(game, action.theme);
      break;
    case "forceResign":
      next = resign(game, target);
      break;
    case "pointsForOpposition":
      next = game.players.reduce(
        (state, player, at) =>
          isInGovernment(player) ? state : addPoints(state, at, card.amount),
        game,
      );
      break;
    case "pointsPerSeats":
      next = addPoints(
        game,
        seat,
        Math.floor(game.players[seat].seats / card.amount),
      );
      break;
  }
  return next;
}

/** The biggest party other than the one asking; itself if it is alone on top. */
function biggestOther(game: PolitikGame, seat: number): number {
  const others = seatLeaders(game).filter((leader) => leader !== seat);
  return others.length > 0 ? others[0] : seat;
}

/** The index of a party's first still-covered scandal, or -1. */
function firstCovered(game: PolitikGame, seat: number): number {
  return game.players[seat].scandals.findIndex((held) => !held.revealed);
}

/* ------------------------------------------------------------------ *
 * The individual effects                                              *
 * ------------------------------------------------------------------ */

/** Adds (or takes away) victory points; nobody drops below zero. */
function addPoints(
  game: PolitikGame,
  seat: number,
  amount: number,
): PolitikGame {
  return {
    ...game,
    players: withPlayer(game.players, seat, {
      points: Math.max(0, game.players[seat].points + amount),
    }),
  };
}

/** Puts malus chips on a candidate, up to the cap. */
function addMalus(
  game: PolitikGame,
  seat: number,
  amount: number,
): PolitikGame {
  return {
    ...game,
    players: withPlayer(game.players, seat, {
      malus: Math.min(MAX_MALUS, game.players[seat].malus + amount),
    }),
  };
}

/** Puts bonus chips on a candidate, up to the cap. */
function addBonus(
  game: PolitikGame,
  seat: number,
  amount: number,
): PolitikGame {
  return {
    ...game,
    players: withPlayer(game.players, seat, {
      bonus: Math.min(MAX_BONUS, game.players[seat].bonus + amount),
    }),
  };
}

/** Takes seats off one party and gives them to another. */
function poach(
  game: PolitikGame,
  seat: number,
  target: number,
  amount: number,
): PolitikGame {
  return target === seat
    ? game
    : { ...game, players: moveSeats(game.players, seat, target, amount) };
}

/** Turns the current theme into another one; the old goes under the pile. */
function setTheme(game: PolitikGame, theme: Theme | undefined): PolitikGame {
  return theme === undefined || theme === game.theme
    ? game
    : {
        ...game,
        theme,
        themeDeck: [game.theme, ...game.themeDeck.filter((it) => it !== theme)],
      };
}

/** Uncovers one scandal in front of a party. */
function revealScandal(
  game: PolitikGame,
  seat: number,
  index: number,
): PolitikGame {
  const player = game.players[seat];
  const held = player.scandals[index];
  return held === undefined || held.revealed
    ? game
    : {
        ...game,
        players: withPlayer(game.players, seat, {
          scandals: player.scandals.map((entry, at) =>
            at === index ? { ...entry, revealed: true } : entry,
          ),
        }),
        log: [
          ...game.log,
          `Skandal bei ${player.name}: ${scandalById(held.cardId)?.title ?? ""}.`,
        ],
      };
}

/** Covers one of a party's own scandals again. */
function hideScandal(
  game: PolitikGame,
  seat: number,
  index: number,
): PolitikGame {
  const player = game.players[seat];
  const held = player.scandals[index];
  return held === undefined || !held.revealed
    ? game
    : {
        ...game,
        players: withPlayer(game.players, seat, {
          scandals: player.scandals.map((entry, at) =>
            at === index ? { ...entry, revealed: false } : entry,
          ),
        }),
      };
}

/** Makes a candidate resign; chips and scandals go back on their piles. */
function resign(game: PolitikGame, seat: number): PolitikGame {
  const player = game.players[seat];
  return player.candidateId === null
    ? game
    : {
        ...game,
        players: withPlayer(game.players, seat, {
          candidateId: null,
          bonus: 0,
          malus: 0,
          scandals: [],
        }),
        candidateDeck: [...game.candidateDeck, player.candidateId],
        scandalDeck: [
          ...game.scandalDeck,
          ...player.scandals.map((held) => held.cardId),
        ],
        log: [...game.log, `Die Kandidat:in von ${player.name} tritt zurück.`],
      };
}

/* ------------------------------------------------------------------ *
 * Ending a turn, a round and the game                                 *
 * ------------------------------------------------------------------ */

/** Hands the turn to the left-hand neighbour, or closes the Spielrunde. */
function endTurn(game: PolitikGame, seat: number): PolitikGame {
  const count = game.players.length;
  const next = (seat + 1) % count;
  return next === game.firstSeat
    ? endRound(game)
    : { ...game, phase: "action", offer: null, turn: next };
}

/**
 * Closes a Spielrunde: the government scores, then the next round or campaign.
 *
 * @remarks
 * The rule book makes the Bundeskanzleramt responsible for remembering the
 * office points, and lets the government forfeit them if it forgets. Nothing
 * is forgotten here, so they are simply paid - a Misstrauensvotum is the one
 * thing that stops them.
 */
function endRound(game: PolitikGame): PolitikGame {
  const paid = game.noGovernmentPoints ? game : payOffices(game);
  const noted: PolitikGame = {
    ...paid,
    noGovernmentPoints: false,
    log: game.noGovernmentPoints
      ? [...paid.log, "Misstrauensvotum - die Regierung erhält keine Punkte."]
      : paid.log,
  };
  return noted.round < ROUNDS_PER_CYCLE
    ? startRound(noted, noted.round + 1)
    : startCampaign({ ...noted, cycle: noted.cycle + 1 });
}

/** Pays every office holder what the card is worth. */
function payOffices(game: PolitikGame): PolitikGame {
  return {
    ...game,
    players: game.players.map((player) => ({
      ...player,
      points:
        player.points +
        player.offices.reduce(
          (sum, office) => sum + officeCard(office).points,
          0,
        ),
    })),
  };
}

/**
 * Counts everything up after the closing campaign.
 *
 * @remarks
 * The biggest party scores five, or three each if several share the lead.
 */
function finish(game: PolitikGame): PolitikGame {
  const leadingSeats = seatLeaders(game);
  const award =
    leadingSeats.length === 1 ? FINAL_SEATS_POINTS : FINAL_SEATS_POINTS_SHARED;
  const players = game.players.map((player, seat) => ({
    ...player,
    points: player.points + (leadingSeats.includes(seat) ? award : 0),
  }));
  const names = leadingSeats.map((seat) => game.players[seat].name).join(", ");
  return {
    ...game,
    phase: "gameOver",
    players,
    offer: null,
    ballot: null,
    log: [
      ...game.log,
      `Die meisten Sitze: ${names} - ${award} Siegpunkte.`,
      "Das Spiel ist zu Ende.",
    ],
  };
}

/* ------------------------------------------------------------------ *
 * Small helpers                                                       *
 * ------------------------------------------------------------------ */

/** Whether an action kind has anything to aim at right now. */
function hasTarget(
  game: PolitikGame,
  seat: number,
  kind: PolitikAction["kind"],
): boolean {
  const player = game.players[seat];
  const others = game.players.filter((unused, at) => at !== seat);
  let possible: boolean;
  switch (kind) {
    case "swapCandidate":
    case "changeTheme":
    case "governmentChange":
      possible = true;
      break;
    case "opposition":
      possible = !isInGovernment(player) && player.opposition.length > 0;
      break;
    case "promise":
      possible = player.promises.length > 0;
      break;
    case "dirtyCampaign":
      possible = others.some(
        (other) => other.candidateId !== null && other.malus < MAX_MALUS,
      );
      break;
    case "poachSeat":
      possible = others.some((other) => other.seats > 0);
      break;
    case "revealScandal":
      possible = game.players.some((other) =>
        other.scandals.some((held) => !held.revealed),
      );
      break;
    case "hideScandal":
      possible = player.scandals.some((held) => held.revealed);
      break;
    case "imageCampaign":
      possible = player.bonus < MAX_BONUS;
      break;
  }
  return possible;
}

/** The sum of a handful of dice. */
function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** A player list with one player changed. */
function withPlayer(
  players: readonly Player[],
  index: number,
  change: Partial<Player>,
): readonly Player[] {
  return players.map((player, at) =>
    at === index ? { ...player, ...change } : player,
  );
}
