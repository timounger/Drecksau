/**
 * The DiplomacyManager: how players stand with each other and why, their
 * reputation, treaties (trade agreement, non-aggression pact, alliance),
 * war and peace, gifts, demands and trades of goods for gold or goods.
 *
 * @module
 * @remarks
 * Relations are kept per pair and remember what happened, fading over time.
 * What an AI player thinks of someone - its opinion - adds its character,
 * the treaties, neighbourhood, common enemies and the other's reputation.
 * An AI answers every proposal at once by opinion, character and situation,
 * and always says why. Proposals of an AI to the human wait as offers.
 */
import { strengthOf as combatStrength } from "./combat";
import { earn, spend } from "./economy";
import { GOOD } from "./goods";
import { HUMAN, islandsOf, playerById } from "./players";
import { populationOf } from "./population";
import { TICK } from "./time";
import { addStock, capacityOf } from "./warehouse";
import type {
  Deal,
  DiplomacyAction,
  DiplomacyAnswer,
  Game,
  GoodId,
  Modifier,
  Personality,
  Player,
  Relation,
  RelationReason,
  Treaty,
} from "./types";

/** Seconds between two diplomacy rounds (fading, treaty income, offers). */
export const DIPLOMACY_EVERY = 10;

/** Steps per round. */
const ROUND_STEPS = Math.round(DIPLOMACY_EVERY / TICK);

/** Memories keep this share per round. */
const MEMORY_KEEP = 0.98;

/** Reputation keeps this share per round. */
const REPUTATION_KEEP = 0.995;

/** Memories smaller than this are forgotten. */
const FORGET = 0.5;

/** No single memory weighs more than this. */
const MEMORY_CAP = 40;

/** Opinion and relation run from minus to plus this. */
export const RELATION_LIMIT = 100;

/** Opinion an AI loses when soldiers of another land on its island... */
const TRESPASS_LANDING = 12;

/** ...and per soldier landed. */
const TRESPASS_PER_SOLDIER = 1;

/** Opinion lost each round while such soldiers stay on its land. */
const TRESPASS_STAY = 1;

/** Share of that anger an ally or a pact partner feels. */
const TRESPASS_FRIEND_SHARE = 0.5;

/**
 * At or below this opinion an AI answers soldiers on its land with war;
 * the warlike are quickest to it.
 */
const TRESPASS_WAR: Readonly<Record<Personality, number>> = {
  trader: -60,
  expansionist: -50,
  warlike: -35,
};

/** How each character starts out towards others. */
export const PERSONALITY_BASE: Readonly<Record<Personality, number>> = {
  trader: 10,
  expansionist: 0,
  warlike: -15,
};

/** What a standing treaty or a war adds to the relation. */
const STANDING: Readonly<Record<Treaty | "war", number>> = {
  trade: 8,
  pact: 10,
  alliance: 15,
  war: -40,
};

/** Islands closer than this are neighbours who quarrel over borders. */
const BORDER_RANGE = 35;

/** Each pair of neighbouring islands costs this much... */
const BORDER_EACH = -6;

/** ...up to this. */
const BORDER_MOST = -18;

/** Free islands this close to both players are fought over... */
const RIVAL_RANGE = 45;

/** ...each costs this much... */
const RIVAL_EACH = -3;

/** ...up to this. */
const RIVAL_MOST = -12;

/** An ally joins the attacker's war unless it likes the attacked this much. */
const CALL_TO_ARMS = 20;

/** Fighting the same enemy brings players together. */
const SHARED_ENEMY = 12;

/** The other's reputation counts this share in an opinion. */
const REPUTATION_SHARE = 0.5;

/** Least opinion for a trade agreement, by character. */
export const TRADE_OPINION: Readonly<Record<Personality, number>> = {
  trader: -10,
  expansionist: 0,
  warlike: 15,
};

/** Least opinion for a non-aggression pact... */
const PACT_OPINION = 25;

/** ...a warlike player wants much more. */
const WARLIKE_PACT_OPINION = 45;

/** Least opinion for an alliance. */
const ALLIANCE_OPINION = 50;

/** A war must have lasted this long before peace is considered, seconds. */
const WAR_MIN = 240;

/** After this long anyone is weary of war, seconds. */
const WAR_LONG = 900;

/** Peace is taken when the proposer is at least this strong in comparison. */
const PEACE_STRENGTH: Readonly<Record<Personality, number>> = {
  trader: 0.6,
  expansionist: 0.8,
  warlike: 1.1,
};

/** A demand is met when the proposer is this many times stronger. */
const FEAR: Readonly<Record<Personality, number>> = {
  trader: 1.5,
  expansionist: 1.8,
  warlike: 2.5,
};

/** What an AI wants on top in a trade, by character (1 = even). */
const TRADE_MARGIN: Readonly<Record<Personality, number>> = {
  trader: 1,
  expansionist: 1.1,
  warlike: 1.2,
};

/** Each point of opinion makes a trade this much cheaper for the proposer. */
const OPINION_DISCOUNT = 0.002;

/** Goods the AI lacks are worth this much more to it... */
const NEED_FACTOR = 1.4;

/** ...goods it has plenty of this much less. */
const PLENTY_FACTOR = 0.6;

/** A store this full counts as plenty. */
const PLENTY_SHARE = 0.6;

/** Supply below this counts as lacking. */
const LACKING = 0.6;

/** Memories each action leaves. */
const MEMORY: Readonly<Record<string, number>> = {
  demandMet: -15,
  refused: -5,
  peace: 10,
  declaredWar: -25,
  brokenPact: -20,
  trade: 3,
};

/** Reputation each action costs or brings. */
const REPUTATION: Readonly<Record<string, number>> = {
  declaredWar: -10,
  brokenPact: -12,
  gift: 2,
};

/** A gift is worth this many gold per point of relation... */
const GIFT_GOLD_PER_POINT = 40;

/** ...but brings at most this much. */
const GIFT_MOST = 25;

/** Gold per minute a trade agreement brings per this many partner residents... */
const TRADE_INCOME_RESIDENTS = 20;

/** ...and at most this much per minute. */
const TRADE_INCOME_MOST = 30;

/** Seconds in a minute. */
const MINUTE = 60;

/** An offer to the human stands this long, seconds. */
export const OFFER_SECONDS = 120;

/** Log entries kept. */
const LOG_SIZE = 60;

/** The outcome of a proposal. */
export type Verdict = {
  readonly accepted: boolean;
  readonly answer: DiplomacyAnswer;
};

/**
 * Relations for every pair of players, at peace and without treaties.
 *
 * @param players - how many players there are
 * @returns the relations
 */
export function createRelations(players: number): Relation[] {
  const relations: Relation[] = [];
  for (let a = 0; a < players; a += 1) {
    for (let b = a + 1; b < players; b += 1) {
      relations.push({
        a,
        b,
        war: false,
        trade: false,
        pact: false,
        alliance: false,
        since: 0,
        memory: [],
      });
    }
  }
  return relations;
}

/**
 * The relation between two players.
 *
 * @param game - the game
 * @param a - one player id
 * @param b - the other
 * @returns the relation, or null for the same player or a non-player
 */
export function relationOf(game: Game, a: number, b: number): Relation | null {
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return (
    game.diplomacy.relations.find((r) => r.a === low && r.b === high) ?? null
  );
}

/**
 * Whether two players are at war.
 *
 * @param game - the game
 * @param a - one player
 * @param b - the other
 * @returns true at war
 */
export function atWar(game: Game, a: number, b: number): boolean {
  return relationOf(game, a, b)?.war === true;
}

/**
 * Adds a memory between two players.
 *
 * @param game - the game
 * @param a - one player (others are ignored)
 * @param b - the other
 * @param reason - why
 * @param value - how much, positive is good
 */
export function remember(
  game: Game,
  a: number,
  b: number,
  reason: RelationReason,
  value: number,
): void {
  const relation = relationOf(game, a, b);
  if (relation !== null) {
    addModifier(relation.memory, reason, value);
  }
}

/**
 * The sum of a player's reputation.
 *
 * @param player - the player
 * @returns the reputation, about -100 to 100
 */
export function reputationOf(player: Player): number {
  return clamp(player.reputation.reduce((sum, m) => sum + m.value, 0));
}

/**
 * Changes a player's reputation.
 *
 * @param player - the player
 * @param reason - why
 * @param value - how much
 */
export function changeReputation(
  player: Player,
  reason: RelationReason,
  value: number,
): void {
  addModifier(player.reputation, reason, value);
}

/**
 * What one player thinks of another, with every reason.
 *
 * @param game - the game
 * @param of - whose opinion
 * @param about - about whom
 * @returns the reasons; their sum is the opinion
 */
export function opinionReasons(
  game: Game,
  of: number,
  about: number,
): Modifier[] {
  const relation = relationOf(game, of, about);
  const self = playerById(game, of);
  const other = playerById(game, about);
  const reasons: Modifier[] = [];
  if (relation !== null && self !== null && other !== null) {
    if (self.ai !== null) {
      reasons.push({
        reason: "personality",
        value: PERSONALITY_BASE[self.ai.personality],
      });
    }
    const reputation = reputationOf(other) * REPUTATION_SHARE;
    if (Math.round(reputation) !== 0) {
      reasons.push({ reason: "reputation", value: reputation });
    }
    const standing: [boolean, RelationReason, number][] = [
      [relation.trade, "tradeAgreement", STANDING.trade],
      [relation.pact, "pact", STANDING.pact],
      [relation.alliance, "alliance", STANDING.alliance],
      [relation.war, "war", STANDING.war],
    ];
    for (const [active, reason, value] of standing) {
      if (active) {
        reasons.push({ reason, value });
      }
    }
    const border = borderTension(game, of, about);
    if (border !== 0) {
      reasons.push({ reason: "border", value: border });
    }
    const rivalry = islandRivalry(game, of, about);
    if (rivalry !== 0) {
      reasons.push({ reason: "rivalry", value: rivalry });
    }
    if (sharedEnemy(game, of, about)) {
      reasons.push({ reason: "sharedEnemy", value: SHARED_ENEMY });
    }
    for (const memory of relation.memory) {
      reasons.push({ ...memory });
    }
  }
  return reasons;
}

/**
 * What one player thinks of another.
 *
 * @param game - the game
 * @param of - whose opinion
 * @param about - about whom
 * @returns -100 to 100
 */
export function opinionOf(game: Game, of: number, about: number): number {
  return clamp(
    opinionReasons(game, of, about).reduce((sum, m) => sum + m.value, 0),
  );
}

/**
 * Proposes something to an AI player, or does what needs nobody's consent.
 * The AI answers at once; what is agreed is carried out.
 *
 * @param game - the game
 * @param from - who proposes
 * @param to - to whom
 * @param action - what
 * @param island - the proposer's island goods come from or go to, or -1
 * @returns the answer
 */
export function propose(
  game: Game,
  from: number,
  to: number,
  action: DiplomacyAction,
  island: number,
): Verdict {
  const verdict = decide(game, from, to, action, island);
  if (verdict.accepted) {
    carryOut(game, from, to, action, island, -1);
  } else if (action.type === "demand") {
    remember(game, from, to, "refused", MEMORY.refused);
  }
  log(game, from, to, action, verdict);
  return verdict;
}

/**
 * An AI makes a proposal to the human, who answers later; what needs no
 * consent (war, a gift, ending a treaty) happens at once.
 *
 * @param game - the game
 * @param from - the AI
 * @param action - what
 */
export function offerToHuman(
  game: Game,
  from: number,
  action: DiplomacyAction,
): void {
  const unilateral =
    action.type === "war" || action.type === "gift" || action.type === "cancel";
  const pending = game.diplomacy.offers.some(
    (offer) => offer.from === from && offer.action.type === action.type,
  );
  if (unilateral) {
    propose(game, from, HUMAN, action, -1);
  } else if (!pending) {
    const id = game.nextId;
    game.nextId += 1;
    game.diplomacy.offers.push({
      id,
      from,
      to: HUMAN,
      action,
      expires: game.time + OFFER_SECONDS,
    });
    game.events.push({ type: "offer", offer: id, from });
  }
}

/**
 * The human answers an offer.
 *
 * @param game - the game
 * @param id - the offer
 * @param accept - yes or no
 * @param island - the human's island goods come from or go to
 * @returns null when answered, else why not
 */
export function answerOffer(
  game: Game,
  id: number,
  accept: boolean,
  island: number,
): string | null {
  const offer = game.diplomacy.offers.find((o) => o.id === id);
  let reason: string | null = null;
  if (offer === undefined) {
    reason = "missing";
  } else {
    const check = feasible(game, offer.from, offer.to, offer.action, island);
    if (accept && check !== null) {
      reason = `dip:${check}`;
    } else {
      game.diplomacy.offers = game.diplomacy.offers.filter((o) => o !== offer);
      const verdict: Verdict = {
        accepted: accept,
        answer: accept ? "accepted" : "relationLow",
      };
      if (accept) {
        carryOut(game, offer.from, offer.to, offer.action, -1, island);
      } else {
        remember(game, offer.from, offer.to, "refused", MEMORY.refused);
      }
      log(game, offer.to, offer.from, offer.action, verdict);
    }
  }
  return reason;
}

/**
 * One diplomacy round: memories fade, treaties pay, offers run out.
 *
 * @param game - the game
 */
export function stepDiplomacy(game: Game): void {
  if (game.tick % ROUND_STEPS === 0) {
    for (const relation of game.diplomacy.relations) {
      fade(relation.memory, MEMORY_KEEP);
      if (relation.trade && !relation.war) {
        tradeIncome(game, relation.a, relation.b);
        tradeIncome(game, relation.b, relation.a);
      }
    }
    for (const player of game.players) {
      fade(player.reputation, REPUTATION_KEEP);
    }
    const expired = game.diplomacy.offers.filter((o) => o.expires <= game.time);
    for (const offer of expired) {
      remember(game, offer.from, offer.to, "refused", MEMORY.refused);
    }
    game.diplomacy.offers = game.diplomacy.offers.filter(
      (o) => o.expires > game.time,
    );
    stayingTroops(game);
  }
}

/**
 * Soldiers of one player landed on an island of an AI it is not at war
 * with: the AI likes it less, and when its opinion falls far enough it
 * declares war (never in a peaceful game).
 *
 * @param game - the game
 * @param intruder - whose soldiers
 * @param owner - whose island
 * @param landed - soldiers that just landed, or 0 for those staying on
 */
export function trespass(
  game: Game,
  intruder: number,
  owner: number,
  landed: number,
): void {
  const relation = relationOf(game, owner, intruder);
  const host = playerById(game, owner);
  if (
    relation !== null &&
    host?.ai != null &&
    host.alive &&
    !relation.war &&
    intruder !== owner
  ) {
    const anger =
      landed > 0
        ? TRESPASS_LANDING + TRESPASS_PER_SOLDIER * landed
        : TRESPASS_STAY;
    const share =
      relation.alliance || relation.pact ? TRESPASS_FRIEND_SHARE : 1;
    remember(game, owner, intruder, "trespass", -anger * share);
    const war =
      !game.settings.peaceful &&
      opinionOf(game, owner, intruder) <= TRESPASS_WAR[host.ai.personality];
    if (landed > 0 || war) {
      game.events.push({ type: "trespass", owner, intruder, war });
    }
    if (war) {
      declareWar(game, owner, intruder, true);
    }
  }
}

/** Every round, soldiers still standing on a peaceful AI's land anger it. */
function stayingTroops(game: Game): void {
  const pairs = new Set<string>();
  for (const soldier of game.soldiers) {
    const owner = game.islands[soldier.island]?.owner ?? -1;
    if (soldier.ship < 0 && owner >= 0 && owner !== soldier.owner) {
      const key = `${soldier.owner}:${owner}`;
      if (!pairs.has(key)) {
        pairs.add(key);
        trespass(game, soldier.owner, owner, 0);
      }
    }
  }
}

/**
 * How much a deal is worth to the one who would get it.
 *
 * @param game - the game
 * @param player - the receiver
 * @param deal - what is handed over
 * @returns its worth in gold
 */
export function dealWorth(game: Game, player: number, deal: Deal): number {
  let worth = deal.gold;
  if (deal.good !== null && deal.amount > 0) {
    worth +=
      deal.amount * GOOD[deal.good].value * needFactor(game, player, deal.good);
  }
  return worth;
}

/**
 * The island of a player that holds the most of a good.
 *
 * @param game - the game
 * @param player - the player
 * @param good - the good, or null for the island with most room
 * @returns the island id, or -1
 */
export function richestIsland(
  game: Game,
  player: number,
  good: GoodId | null,
): number {
  let best = -1;
  let most = -1;
  for (const id of islandsOf(game, player)) {
    const amount =
      good === null ? capacityOf(game, id) : game.islands[id].stock[good];
    if (amount > most) {
      most = amount;
      best = id;
    }
  }
  return best;
}

/** Whether a proposal can be carried out at all; null if it can. */
function feasible(
  game: Game,
  from: number,
  to: number,
  action: DiplomacyAction,
  island: number,
): DiplomacyAnswer | null {
  const relation = relationOf(game, from, to);
  const giver = playerById(game, from);
  const taker = playerById(game, to);
  let answer: DiplomacyAnswer | null = null;
  if (relation === null || giver === null || taker === null || !taker.alive) {
    answer = "gone";
  } else {
    switch (action.type) {
      case "propose":
        answer = relation[action.treaty]
          ? "already"
          : relation.war
            ? "atWar"
            : action.treaty === "alliance" && !relation.pact
              ? "needPact"
              : null;
        break;
      case "cancel":
        answer = relation[action.treaty] ? null : "noTreaty";
        break;
      case "war":
        answer = game.settings.peaceful
          ? "peaceful"
          : relation.war
            ? "already"
            : relation.pact
              ? "pactActive"
              : null;
        break;
      case "peace":
        answer = relation.war ? null : "notAtWar";
        break;
      case "gift":
        answer = canHand(game, from, action.give, island);
        break;
      case "demand":
        answer = relation.war ? "atWar" : canHand(game, to, action.take, -1);
        break;
      default:
        answer = relation.war
          ? "atWar"
          : (canHand(game, from, action.give, island) ??
            canHand(game, to, action.take, -1));
    }
  }
  return answer;
}

/** Whether a player can hand a deal over; null if so. */
function canHand(
  game: Game,
  player: number,
  deal: Deal,
  island: number,
): DiplomacyAnswer | null {
  const owner = playerById(game, player);
  const from =
    island >= 0 && game.islands[island]?.owner === player
      ? island
      : richestIsland(game, player, deal.good);
  let answer: DiplomacyAnswer | null = null;
  if (owner === null || owner.gold < deal.gold) {
    answer = "noGold";
  } else if (
    deal.good !== null &&
    deal.amount > 0 &&
    (from < 0 || game.islands[from].stock[deal.good] < deal.amount)
  ) {
    answer = "noGoods";
  }
  return answer;
}

/** The AI's answer to a proposal, by opinion, character and situation. */
function decide(
  game: Game,
  from: number,
  to: number,
  action: DiplomacyAction,
  island: number,
): Verdict {
  const problem = feasible(game, from, to, action, island);
  const decider = playerById(game, to);
  const personality = decider?.ai?.personality ?? "trader";
  const opinion = opinionOf(game, to, from);
  let accepted = false;
  let answer: DiplomacyAnswer;
  if (problem !== null) {
    answer = problem;
  } else if (
    decider === null ||
    decider.ai === null ||
    action.type === "war" ||
    action.type === "gift" ||
    action.type === "cancel"
  ) {
    // Needs nobody's consent, or the human will answer as an offer.
    accepted = true;
    answer = "accepted";
  } else {
    switch (action.type) {
      case "propose": {
        const need =
          action.treaty === "trade"
            ? TRADE_OPINION[personality]
            : action.treaty === "pact"
              ? personality === "warlike"
                ? WARLIKE_PACT_OPINION
                : PACT_OPINION
              : ALLIANCE_OPINION;
        accepted = opinion >= need;
        answer = accepted
          ? "friendship"
          : action.treaty === "pact" && personality === "warlike"
            ? "warlike"
            : "relationLow";
        break;
      }
      case "peace": {
        const relation = relationOf(game, from, to) as Relation;
        const length = game.time - relation.since;
        const ratio =
          combatStrength(game, from) / Math.max(1, combatStrength(game, to));
        // A conquest made is a war goal reached.
        const won = relation.memory.some((m) => m.reason === "conquest");
        accepted =
          length >= WAR_MIN &&
          (ratio >= PEACE_STRENGTH[personality] || length >= WAR_LONG || won);
        answer = accepted ? "warWeary" : "confident";
        break;
      }
      case "demand": {
        const ratio =
          combatStrength(game, from) / Math.max(1, combatStrength(game, to));
        accepted = ratio >= FEAR[personality];
        answer = accepted ? "fear" : "notAfraid";
        break;
      }
      default: {
        const gets = dealWorth(game, to, action.give);
        const gives = dealWorth(game, to, action.take);
        const margin = TRADE_MARGIN[personality] - opinion * OPINION_DISCOUNT;
        accepted = gets >= gives * margin;
        answer = accepted ? "fair" : "notWorth";
      }
    }
  }
  return { accepted, answer };
}

/** Does what was agreed. */
function carryOut(
  game: Game,
  from: number,
  to: number,
  action: DiplomacyAction,
  fromIsland: number,
  toIsland: number,
): void {
  const relation = relationOf(game, from, to) as Relation;
  const proposer = playerById(game, from) as Player;
  switch (action.type) {
    case "propose":
      relation[action.treaty] = true;
      if (action.treaty === "alliance") {
        relation.pact = true;
      }
      game.events.push({
        type: "treaty",
        a: from,
        b: to,
        treaty: action.treaty,
        signed: true,
      });
      break;
    case "cancel":
      relation[action.treaty] = false;
      if (action.treaty === "pact") {
        relation.alliance = false;
        changeReputation(proposer, "brokenPact", REPUTATION.brokenPact);
        remember(game, from, to, "brokenPact", MEMORY.brokenPact);
      }
      game.events.push({
        type: "treaty",
        a: from,
        b: to,
        treaty: action.treaty,
        signed: false,
      });
      break;
    case "war":
      declareWar(game, from, to, true);
      break;
    case "peace":
      relation.war = false;
      relation.since = game.time;
      remember(game, from, to, "peace", MEMORY.peace);
      game.events.push({ type: "peace", a: from, b: to });
      break;
    case "gift": {
      const worth = dealWorth(game, to, action.give);
      hand(game, from, to, action.give, fromIsland, toIsland);
      remember(
        game,
        from,
        to,
        "gift",
        Math.min(GIFT_MOST, worth / GIFT_GOLD_PER_POINT),
      );
      changeReputation(proposer, "gift", REPUTATION.gift);
      break;
    }
    case "demand":
      hand(game, to, from, action.take, toIsland, fromIsland);
      remember(game, from, to, "demand", MEMORY.demandMet);
      break;
    default:
      hand(game, from, to, action.give, fromIsland, toIsland);
      hand(game, to, from, action.take, toIsland, fromIsland);
      remember(game, from, to, "trade", MEMORY.trade);
  }
}

/** War between two players; allies of the attacked join in. */
function declareWar(
  game: Game,
  from: number,
  to: number,
  first: boolean,
): void {
  const relation = relationOf(game, from, to);
  const attacker = playerById(game, from);
  if (relation !== null && attacker !== null && !relation.war) {
    relation.war = true;
    relation.trade = false;
    relation.pact = false;
    relation.alliance = false;
    relation.since = game.time;
    remember(game, from, to, "declaredWar", MEMORY.declaredWar);
    if (first) {
      changeReputation(attacker, "declaredWar", REPUTATION.declaredWar);
    }
    game.events.push({ type: "war", a: from, b: to, called: !first });
    if (first) {
      for (const ally of game.players) {
        const bond = relationOf(game, ally.id, to);
        const withAttacker = relationOf(game, ally.id, from);
        const withDefender = relationOf(game, ally.id, to);
        if (ally.id === from || ally.id === to || !ally.alive) {
          // Neither side calls itself.
        } else if (bond?.alliance === true && withAttacker?.pact !== true) {
          // The attacked calls its allies.
          declareWar(game, ally.id, from, false);
        } else if (
          withAttacker?.alliance === true &&
          withDefender?.pact !== true &&
          ally.ai !== null &&
          opinionOf(game, ally.id, to) < CALL_TO_ARMS
        ) {
          // The attacker's allies follow unless they like the attacked.
          declareWar(game, ally.id, to, false);
        }
      }
    }
  }
}

/** Hands gold and goods from one player to another. */
function hand(
  game: Game,
  from: number,
  to: number,
  deal: Deal,
  fromIsland: number,
  toIsland: number,
): void {
  const giver = playerById(game, from);
  const taker = playerById(game, to);
  if (giver !== null && taker !== null) {
    if (deal.gold > 0) {
      spend(giver, deal.gold, "payments");
      earn(taker, deal.gold, "rewards");
    }
    if (deal.good !== null && deal.amount > 0) {
      const source =
        fromIsland >= 0 && game.islands[fromIsland]?.owner === from
          ? fromIsland
          : richestIsland(game, from, deal.good);
      const target =
        toIsland >= 0 && game.islands[toIsland]?.owner === to
          ? toIsland
          : richestIsland(game, to, null);
      if (source >= 0) {
        const amount = Math.min(
          deal.amount,
          game.islands[source].stock[deal.good],
        );
        game.islands[source].stock[deal.good] -= amount;
        if (target >= 0) {
          addStock(game, target, deal.good, amount);
        }
        giver.stats.traded += amount;
        taker.stats.traded += amount;
      }
    }
  }
}

/** A trade agreement pays the player by the partner's people. */
function tradeIncome(game: Game, player: number, partner: number): void {
  const owner = playerById(game, player);
  if (owner !== null) {
    const perMinute = Math.min(
      TRADE_INCOME_MOST,
      populationOf(game, partner) / TRADE_INCOME_RESIDENTS,
    );
    earn(owner, (perMinute * DIPLOMACY_EVERY) / MINUTE, "rewards");
  }
}

/** How much a player wants a good: more if lacking, less if plentiful. */
function needFactor(game: Game, player: number, good: GoodId): number {
  const island = richestIsland(game, player, good);
  let factor = 1;
  if (island >= 0) {
    const state = game.islands[island];
    const capacity = Math.max(1, capacityOf(game, island));
    const lacking = state.supply[good] > 0 && state.supply[good] < LACKING;
    factor = lacking
      ? NEED_FACTOR
      : state.stock[good] > capacity * PLENTY_SHARE
        ? PLENTY_FACTOR
        : 1;
  }
  return factor;
}

/** Neighbouring islands make for quarrels. */
function borderTension(game: Game, a: number, b: number): number {
  let sum = 0;
  for (const mine of islandsOf(game, a)) {
    for (const theirs of islandsOf(game, b)) {
      const p = game.world.islands[mine];
      const q = game.world.islands[theirs];
      if (Math.hypot(p.cx - q.cx, p.cy - q.cy) < BORDER_RANGE) {
        sum += BORDER_EACH;
      }
    }
  }
  return Math.max(BORDER_MOST, sum);
}

/** Free islands both players could settle next make rivals of them. */
function islandRivalry(game: Game, a: number, b: number): number {
  const near = (player: number, x: number, y: number) =>
    islandsOf(game, player).some((id) => {
      const info = game.world.islands[id];
      return Math.hypot(info.cx - x, info.cy - y) < RIVAL_RANGE;
    });
  let sum = 0;
  for (const state of game.islands) {
    const info = game.world.islands[state.id];
    if (
      state.owner < 0 &&
      near(a, info.cx, info.cy) &&
      near(b, info.cx, info.cy)
    ) {
      sum += RIVAL_EACH;
    }
  }
  return Math.max(RIVAL_MOST, sum);
}

/** Whether two players fight the same third one. */
function sharedEnemy(game: Game, a: number, b: number): boolean {
  return game.players.some(
    (third) =>
      third.id !== a &&
      third.id !== b &&
      atWar(game, a, third.id) &&
      atWar(game, b, third.id),
  );
}

/** Adds to a list of reasons, merging the same reason. */
function addModifier(
  list: Modifier[],
  reason: RelationReason,
  value: number,
): void {
  const entry = list.find((m) => m.reason === reason);
  if (entry === undefined) {
    list.push({
      reason,
      value: Math.max(-MEMORY_CAP, Math.min(MEMORY_CAP, value)),
    });
  } else {
    entry.value = Math.max(
      -MEMORY_CAP,
      Math.min(MEMORY_CAP, entry.value + value),
    );
  }
}

/** Lets memories fade and forgets the faint ones. */
function fade(list: Modifier[], keep: number): void {
  for (const entry of list) {
    entry.value *= keep;
  }
  const faint = list.filter((entry) => Math.abs(entry.value) < FORGET);
  for (const entry of faint) {
    list.splice(list.indexOf(entry), 1);
  }
}

/** Keeps a value within the relation's limits. */
function clamp(value: number): number {
  return Math.max(-RELATION_LIMIT, Math.min(RELATION_LIMIT, value));
}

/** Notes an answered proposal and tells the screen. */
function log(
  game: Game,
  from: number,
  to: number,
  action: DiplomacyAction,
  verdict: Verdict,
): void {
  game.diplomacy.log.push({
    time: game.time,
    from,
    to,
    action,
    accepted: verdict.accepted,
    answer: verdict.answer,
  });
  if (game.diplomacy.log.length > LOG_SIZE) {
    game.diplomacy.log.shift();
  }
  game.events.push({
    type: "answer",
    from,
    to,
    accepted: verdict.accepted,
    answer: verdict.answer,
  });
}
