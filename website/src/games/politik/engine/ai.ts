/**
 * The computer parties: what they do when it is their turn.
 *
 * @module
 * @remarks
 * Deliberately a plain, deterministic function of the game state - no timers,
 * no randomness of its own. The dice are the game's; the decision is not. That
 * makes a computer turn reproducible, and it lets the online host play a
 * dropped-out seat without any client noticing a difference.
 *
 * The computer plays a solid, self-interested game rather than a perfect one:
 * it grabs offices, campaigns on its own themes, votes for what pays it and
 * against what pays somebody who is already ahead.
 */
import {
  candidateById,
  officesFor,
  oppositionById,
  promiseById,
  type Theme,
} from "./cards";
import { availableActions, isProposalLegal } from "./moves";
import {
  MAJORITY_SEATS,
  MAX_BONUS,
  abilityPoints,
  campaignStrength,
  isInGovernment,
  type OfficeAssignment,
  type PolitikAction,
  type PolitikGame,
  type PolitikMove,
} from "./state";

/** How much a concentrated ability counts next to a campaign point. */
const ABILITY_WEIGHT = 0.8;

/** From this many ability points on, a check is worth trying. */
const CHECK_WORTH_IT = 2;

/** A candidate this weak is worth swapping away as an action. */
const WEAK_CANDIDATE = 3;

/**
 * The move the computer makes for the seat on turn.
 *
 * @param game - the current game
 * @returns the move, or null if there is nothing to do
 */
export function aiMove(game: PolitikGame): PolitikMove | null {
  const seat = game.turn;
  let move: PolitikMove | null = null;
  switch (game.phase) {
    case "candidate":
      move = { kind: "chooseCandidate", index: pickCandidate(game, seat) };
      break;
    case "campaign":
      move = { kind: "duel" };
      break;
    case "coalition":
      move = buildCoalition(game, seat);
      break;
    case "ballot":
      move = { kind: "vote", accept: decideVote(game, seat) };
      break;
    case "action":
      move = pickAction(game, seat);
      break;
    case "gameOver":
      move = null;
      break;
  }
  return move;
}

/* ------------------------------------------------------------------ *
 * Choosing a candidate                                                *
 * ------------------------------------------------------------------ */

/** Which of the two offered candidates to take, or -1 to keep the current. */
function pickCandidate(game: PolitikGame, seat: number): number {
  const offer = game.offer;
  let choice = 0;
  if (offer !== null) {
    const values = offer.cardIds.map((id) => candidateValue(id));
    const best = values[0] >= (values[1] ?? 0) ? 0 : 1;
    const own =
      offer.isSwap && game.players[seat].candidateId !== null
        ? candidateValue(game.players[seat].candidateId)
        : -1;
    choice = own > values[best] ? -1 : best;
  }
  return choice;
}

/** What a candidate is worth: campaign points, plus their strongest talent. */
function candidateValue(id: number | null): number {
  const card = id === null ? null : candidateById(id);
  return card === null
    ? 0
    : card.campaignPoints +
        ABILITY_WEIGHT *
          Math.max(
            card.abilities.manipulation,
            card.abilities.medien,
            card.abilities.popularitaet,
          );
}

/* ------------------------------------------------------------------ *
 * Forming a government                                                *
 * ------------------------------------------------------------------ */

/**
 * Puts a coalition together: as few partners as possible, offices for all.
 *
 * @remarks
 * The biggest partners are taken first, so the majority is reached with the
 * fewest people - and everyone at the table gets an office, because a computer
 * partner that is offered nothing votes the coalition down.
 */
function buildCoalition(game: PolitikGame, seat: number): PolitikMove | null {
  const others = game.players
    .map((player, at) => ({ at, seats: player.seats }))
    .filter((entry) => entry.at !== seat)
    .sort((left, right) => right.seats - left.seats);

  const members = [seat];
  let seats = game.players[seat].seats;
  for (const partner of others) {
    if (seats < MAJORITY_SEATS) {
      members.push(partner.at);
      seats += partner.seats;
    }
  }
  const offices = shareOffices(game, seat, members);
  return isProposalLegal(game, members, offices, true)
    ? { kind: "propose", members, offices }
    : null;
}

/**
 * Hands the offices out: the Bundeskanzleramt to oneself, one to each partner.
 *
 * @remarks
 * The offices come best-paid first, so the leader keeps the chancellery and
 * anything left over after every partner has been served.
 */
function shareOffices(
  game: PolitikGame,
  seat: number,
  members: readonly number[],
): readonly OfficeAssignment[] {
  const inPlay = officesFor(game.players.length);
  const partners = members.filter((member) => member !== seat);
  return inPlay.map((entry, index) => ({
    office: entry.office,
    // Index 0 is the chancellery and stays here; the next offices go round the
    // partners, and once they all have one the rest comes back to the leader.
    seat: index > 0 && index <= partners.length ? partners[index - 1] : seat,
  }));
}

/* ------------------------------------------------------------------ *
 * Voting                                                              *
 * ------------------------------------------------------------------ */

/** How the computer votes on whatever is going round. */
function decideVote(game: PolitikGame, seat: number): boolean {
  const ballot = game.ballot;
  let accept = false;
  if (ballot !== null) {
    switch (ballot.kind) {
      case "coalition":
        accept = acceptsCoalition(game, seat);
        break;
      case "promise":
        accept = acceptsPromise(game, seat);
        break;
      case "governmentChange":
        accept = acceptsGovernmentChange(game, seat);
        break;
    }
  }
  return accept;
}

/**
 * A coalition is worth joining if it comes with an office.
 *
 * @remarks
 * With one exception: once nearly everybody has tried and failed, the last
 * offer on the table beats no government at all, so it is taken even empty
 * handed.
 */
function acceptsCoalition(game: PolitikGame, seat: number): boolean {
  const offices = game.ballot?.proposal?.offices ?? [];
  const lastChance =
    game.attempted.length >= game.players.length - CHECK_WORTH_IT;
  return offices.some((entry) => entry.seat === seat) || lastChance;
}

/**
 * A promise is voted for when it pays - or when it costs nothing.
 *
 * @remarks
 * Sharing the theme means sharing the victory points, so that is an easy yes.
 * Otherwise it only helps the other party, and there is no reason to hand
 * points to somebody who is already ahead.
 */
function acceptsPromise(game: PolitikGame, seat: number): boolean {
  const ballot = game.ballot;
  const card = promiseById(ballot?.promiseId ?? 0);
  const me = game.players[seat];
  const actor = ballot === null ? null : game.players[ballot.actor];
  return (
    card !== null &&
    actor !== null &&
    (me.themes.includes(card.theme) ||
      (isInGovernment(me) &&
        isInGovernment(actor) &&
        actor.points <= me.points))
  );
}

/** A reshuffle is voted for when it puts this party into government. */
function acceptsGovernmentChange(game: PolitikGame, seat: number): boolean {
  const offices = game.ballot?.proposal?.offices ?? [];
  const mine = offices.filter((entry) => entry.seat === seat).length;
  return mine > game.players[seat].offices.length;
}

/* ------------------------------------------------------------------ *
 * The Spielrunde action                                               *
 * ------------------------------------------------------------------ */

/**
 * Picks this Spielrunde's action.
 *
 * @remarks
 * Worked through in order of what usually pays most: cashing a promise in
 * beats a dice check, a dice check beats a swap. What has no target to aim at
 * is skipped by {@link availableActions} before it is ever considered.
 */
function pickAction(game: PolitikGame, seat: number): PolitikMove | null {
  const kinds = availableActions(game, seat);
  const me = game.players[seat];
  const rival = strongestRival(game, seat);
  const action =
    firstOf([
      () => (kinds.includes("promise") ? bestPromise(game, seat) : null),
      () =>
        kinds.includes("opposition") ? playableOpposition(game, seat) : null,
      () =>
        kinds.includes("hideScandal") &&
        abilityPoints(me, "popularitaet") >= CHECK_WORTH_IT
          ? hideOwnScandal(game, seat)
          : null,
      () =>
        kinds.includes("poachSeat") &&
        abilityPoints(me, "manipulation") >= CHECK_WORTH_IT
          ? { kind: "poachSeat" as const, target: rival }
          : null,
      () =>
        kinds.includes("dirtyCampaign") &&
        abilityPoints(me, "manipulation") >= CHECK_WORTH_IT
          ? { kind: "dirtyCampaign" as const, target: rival }
          : null,
      () =>
        kinds.includes("revealScandal") &&
        abilityPoints(me, "medien") >= CHECK_WORTH_IT
          ? uncoverScandal(game, seat, rival)
          : null,
      () =>
        kinds.includes("changeTheme") &&
        abilityPoints(me, "medien") >= CHECK_WORTH_IT &&
        !me.themes.includes(game.theme)
          ? { kind: "changeTheme" as const, theme: me.themes[0] }
          : null,
      () =>
        kinds.includes("imageCampaign") &&
        abilityPoints(me, "popularitaet") >= CHECK_WORTH_IT &&
        me.bonus < MAX_BONUS
          ? { kind: "imageCampaign" as const }
          : null,
      () =>
        kinds.includes("swapCandidate") &&
        campaignStrength(me) <= WEAK_CANDIDATE
          ? { kind: "swapCandidate" as const }
          : null,
      () =>
        kinds.includes("poachSeat")
          ? { kind: "poachSeat" as const, target: rival }
          : null,
      () => (kinds.length > 0 ? ({ kind: kinds[0] } as PolitikAction) : null),
    ]) ?? null;
  return action === null ? null : { kind: "act", action };
}

/** The first of a list of candidate actions that yields something. */
function firstOf(
  options: readonly (() => PolitikAction | null)[],
): PolitikAction | null {
  let found: PolitikAction | null = null;
  for (const option of options) {
    if (found === null) {
      found = option();
    }
  }
  return found;
}

/**
 * The best promise to put to the vote, if it stands a chance.
 *
 * @remarks
 * Counted as likely support: everybody who campaigns on the same theme, since
 * they score too and vote accordingly. Below a majority the card is kept - a
 * promise voted down stays in hand, but the turn is spent either way.
 */
function bestPromise(game: PolitikGame, seat: number): PolitikAction | null {
  const me = game.players[seat];
  const ranked = me.promises
    .map((id) => promiseById(id))
    .filter((card) => card !== null)
    .sort((left, right) => right.points - left.points);
  let chosen: PolitikAction | null = null;
  for (const card of ranked) {
    const support = game.players.reduce(
      (sum, player, at) =>
        at === seat || player.themes.includes(card.theme)
          ? sum + player.seats
          : sum,
      0,
    );
    if (chosen === null && support >= MAJORITY_SEATS) {
      chosen = { kind: "promise", cardId: card.id };
    }
  }
  return chosen;
}

/** The first opposition card that can be aimed somewhere sensible. */
function playableOpposition(
  game: PolitikGame,
  seat: number,
): PolitikAction | null {
  const rival = strongestRival(game, seat);
  const government = game.players.findIndex((player) => isInGovernment(player));
  const cards = game.players[seat].opposition;
  let chosen: PolitikAction | null = null;
  for (const cardId of cards) {
    if (chosen === null) {
      const aimed = aimOpposition(game, seat, cardId, rival, government);
      chosen = aimed;
    }
  }
  return chosen;
}

/** Works out where one opposition card should point, or null if nowhere. */
function aimOpposition(
  game: PolitikGame,
  seat: number,
  cardId: number,
  rival: number,
  government: number,
): PolitikAction | null {
  const card = oppositionById(cardId);
  const me = game.players[seat];
  const wanted: Theme = me.themes[0];
  const base = { kind: "opposition" as const, cardId };
  let aimed: PolitikAction | null = null;
  if (card !== null) {
    switch (card.targeting) {
      case "none":
        aimed = base;
        break;
      case "player":
        aimed = rival === seat ? null : { ...base, target: rival };
        break;
      case "governmentMember":
        aimed = government < 0 ? null : { ...base, target: government };
        break;
      case "theme":
        aimed = wanted === game.theme ? null : { ...base, theme: wanted };
        break;
    }
  }
  return aimed;
}

/** The party most worth hitting: most seats, then most points. */
function strongestRival(game: PolitikGame, seat: number): number {
  let best = seat;
  game.players.forEach((player, at) => {
    const better =
      best === seat ||
      player.seats > game.players[best].seats ||
      (player.seats === game.players[best].seats &&
        player.points > game.players[best].points);
    if (at !== seat && better) {
      best = at;
    }
  });
  return best;
}

/** Uncovers the juiciest still-covered scandal of a rival, or of anyone. */
function uncoverScandal(
  game: PolitikGame,
  seat: number,
  rival: number,
): PolitikAction | null {
  const order = [rival, ...game.players.keys()];
  let chosen: PolitikAction | null = null;
  for (const target of order) {
    const index = game.players[target].scandals.findIndex(
      (held) => !held.revealed,
    );
    if (chosen === null && target !== seat && index >= 0) {
      chosen = { kind: "revealScandal", target, scandalIndex: index };
    }
  }
  return chosen;
}

/** Covers up this party's own worst uncovered scandal. */
function hideOwnScandal(game: PolitikGame, seat: number): PolitikAction | null {
  const index = game.players[seat].scandals.findIndex((held) => held.revealed);
  return index < 0 ? null : { kind: "hideScandal", scandalIndex: index };
}
