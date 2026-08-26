/**
 * The computer opponent.
 *
 * @module
 * @remarks
 * Bohnanza asks the same question of every card that comes near you: **does
 * this fit, and what does it cost me if it does not?** Everything the machine
 * does is that one judgement, {@link placementValue}, applied in four places -
 * planting from the hand, choosing what to offer, answering somebody else's
 * offer, and planting what a trade brought in.
 *
 * It plays with the information a person at the table has. Fields are face up,
 * so it reads everybody's; hands are not, so it never looks at one - not even
 * its own opponents'. What it cannot see it does what a player does about:
 * offers a bean to whoever is visibly growing that bean, and finds out.
 *
 * One thing it deliberately does not do is haggle back. A computer that opened
 * proposals of its own on somebody else's turn would fill the table with them,
 * and a table where the machines talk to each other is not a table anybody
 * enjoys sitting at. It answers everything and proposes only on its own turn.
 */
import {
  beanName,
  coinsFor,
  maxCoins,
  toNextCoin,
  type Bean,
  type Card,
} from "./beans";
import { legalMoves } from "./moves";
import { createRandom, randomInt } from "./random";
import {
  canHarvest,
  fieldBean,
  plantableFields,
  tradeable,
  type BohnanzaGame,
  type BohnanzaMove,
  type Player,
} from "./state";

/** What a card is worth when it lands on a field that already grows it. */
const EXTEND_BASE = 3;

/** How much a Taler the card actually brings in is worth on top. */
const COIN_GAIN = 5;

/** What starting a new field with a card is worth. */
const EMPTY_VALUE = 1;

/** What a card that fits nowhere costs: somebody's field has to go. */
const FORCED_HARVEST = -5;

/** Cards of the same sort still in hand before a new field looks worth it. */
const SUPPORT_NEEDED = 1;

/** How much a Taler counts when choosing which field to give up. */
const COIN_WEIGHT = 10;

/** Extra weight for a field that has nothing more to gain by waiting. */
const RIPE_BONUS = 6;

/** How much better a trade must look before the machine says yes. */
const TRADE_MARGIN = 1;

/** Proposals the machine makes in one of its own turns. */
const OFFERS_PER_TURN = 4;

/**
 * How far into its own hand the machine looks for something to trade away.
 *
 * @remarks
 * Two, because those are the two cards Phase 1 will make it plant next turn.
 * Anything further back is not yet a problem, and offering it away would be
 * bargaining with a card it has not looked at properly.
 */
const FRONT_TO_OFFER = 2;

/** The shortest the computer ever pauses before acting, in milliseconds. */
const MIN_WAIT_MS = 700;

/** How much longer it may take, so two moves never look mechanical. */
const WAIT_SPREAD_MS = 240;

/** How many pauses it picks between. */
const WAIT_STEPS = 4;

/**
 * The move the computer makes for the seat it is asked about.
 *
 * @param game - the current game
 * @param seat - the seat to play
 * @returns a move, or null when there is nothing for that seat to do
 */
export function aiMove(game: BohnanzaGame, seat: number): BohnanzaMove | null {
  let move: BohnanzaMove | null = null;
  if (game.offer !== null && game.offer.to === seat) {
    move = answerOffer(game, seat);
  } else if (game.phase === "plant" && game.active === seat) {
    move = playPlantPhase(game, seat);
  } else if (game.phase === "trade" && game.active === seat) {
    move = playTradePhase(game, seat);
  } else if (game.phase === "settle") {
    move = playSettlePhase(game, seat);
  }
  // A move that has become impossible is worse than no move: fall back on
  // whatever the referee will actually take.
  return move === null ? (legalMoves(game, seat)[0] ?? null) : move;
}

/**
 * How long the computer thinks before it moves.
 *
 * @param game - the current game
 * @returns a pause in milliseconds
 */
export function botWaitMs(game: BohnanzaGame): number {
  const random = createRandom(game.rng + game.log.length);
  return MIN_WAIT_MS + randomInt(random, WAIT_STEPS) * WAIT_SPREAD_MS;
}

// -------------------------------------------------------------- the phases

/**
 * The first phase: the front card has to go somewhere.
 *
 * @remarks
 * The second card is where the judgement is. Laying it on a field that already
 * grows it is free progress; opening a **new** field for it costs the field,
 * and the machine only pays that when the hand behind the card says the field
 * will fill up - which is exactly the question a player asks looking at their
 * own five cards.
 */
function playPlantPhase(game: BohnanzaGame, seat: number): BohnanzaMove | null {
  const player = game.players[seat];
  const card = player.hand[0];
  let move: BohnanzaMove | null = null;
  const ripe = ripeField(player);
  if (card === undefined) {
    move = { kind: "done" };
  } else if (ripe !== null && game.planted === 0) {
    move = { kind: "harvest", field: ripe };
  } else if (plantableFields(player, card.bean).length === 0) {
    move = clearAField(player);
  } else if (game.planted === 0 || worthPlanting(player, card)) {
    move = { kind: "plant", field: bestField(player, card.bean) };
  } else {
    move = { kind: "done" };
  }
  return move;
}

/**
 * The second phase: offer what does not fit, then get on with it.
 *
 * @remarks
 * Who to offer it to is the only piece of reading the machine does of the other
 * players, and it is the reading anybody does: **the fields are face up**. A
 * Sojabohne goes to whoever is already growing Sojabohnen, or to whoever has a
 * bare field if nobody is. What it asks for in return is the sort its own best
 * field wants next.
 */
function playTradePhase(game: BohnanzaGame, seat: number): BohnanzaMove | null {
  const player = game.players[seat];
  // The face-up cards first, because they have to be planted this turn - then
  // the front of the hand, because that is next turn's problem and this is the
  // only chance to hand it to somebody who can use it.
  const spare = [
    ...game.revealed,
    ...player.hand.slice(0, FRONT_TO_OFFER),
  ].find((card) => placementValue(player, card.bean) < 0);
  // Asked in order of how much they look like wanting it, and one each: an
  // offer that has just been turned down is not improved by making it again.
  const buyers = spare === undefined ? [] : buyersFor(game, seat, spare.bean);
  const buyer = buyers[game.offers];
  return spare !== undefined &&
    buyer !== undefined &&
    game.offers < OFFERS_PER_TURN
    ? { kind: "offer", to: buyer, give: [spare.id], want: wishList(game, seat) }
    : { kind: "endTrade" };
}

/** The third phase: put down what the trading brought in. */
function playSettlePhase(
  game: BohnanzaGame,
  seat: number,
): BohnanzaMove | null {
  const player = game.players[seat];
  // Best first: a card that extends a field may push it over a threshold, and
  // a harvest forced by a later card would otherwise take that field away.
  const best = [...player.pending].sort(
    (left, right) =>
      placementValue(player, right.bean) - placementValue(player, left.bean),
  )[0];
  let move: BohnanzaMove | null = null;
  if (best !== undefined) {
    const fields = plantableFields(player, best.bean);
    move =
      fields.length === 0
        ? clearAField(player)
        : {
            kind: "settle",
            card: best.id,
            field: bestField(player, best.bean),
          };
  }
  return move;
}

/**
 * Yes or no to the proposal on the table.
 *
 * @remarks
 * Both sides are counted with the same yardstick, which is the honest way to do
 * it: what comes in is worth what it is worth on **my** fields, and what goes
 * out costs what it would have been worth on them. A gift is simply a trade
 * that costs nothing, and it is still refused when the bean it brings would
 * force a harvest.
 */
function answerOffer(game: BohnanzaGame, seat: number): BohnanzaMove | null {
  const offer = game.offer;
  let move: BohnanzaMove | null = null;
  if (offer !== null) {
    const player = game.players[seat];
    const incoming = offer.give;
    const outgoing = pickCards(game, seat, offer.want);
    const gain = incoming.reduce(
      (sum, card) => sum + placementValue(player, card.bean),
      0,
    );
    const cost = outgoing.reduce(
      (sum, card) => sum + placementValue(player, card.bean),
      0,
    );
    const possible = outgoing.length === offer.want.length;
    move = {
      kind: "answer",
      yes: possible && gain - cost >= TRADE_MARGIN,
      cards: outgoing.map((card) => card.id),
    };
  }
  return move;
}

// -------------------------------------------------------------- the judgement

/**
 * What one more card of this sort is worth to this player.
 *
 * @param player - whose fields
 * @param bean - the sort
 * @returns a value: above zero it helps, below zero it costs a field
 * @remarks
 * The one number the whole opponent is built on. Three cases, and they are the
 * three the rulebook creates: the sort is already growing somewhere (so the
 * card extends a row, and may be the one that reaches the next Taler), there is
 * bare earth (so it starts one), or neither - and then planting it means
 * harvesting something first, which is the only genuinely bad thing that can
 * happen to you in this game.
 */
function placementValue(player: Player, bean: Bean): number {
  const growing = player.fields.filter((field) => fieldBean(field) === bean);
  const bare = player.fields.some((field) => field.length === 0);
  let value: number;
  if (growing.length > 0) {
    const best = growing.reduce(
      (most, field) => Math.max(most, gainFrom(bean, field.length)),
      0,
    );
    value = EXTEND_BASE + best * COIN_GAIN;
  } else if (bare) {
    value = EMPTY_VALUE;
  } else {
    value = FORCED_HARVEST;
  }
  return value;
}

/**
 * A field that has nothing left to gain by waiting, if there is one.
 *
 * @remarks
 * The one harvest worth taking before anybody forces it. A row that has reached
 * the top of its Bohnometer earns nothing more however long it stands there,
 * and standing there is the only thing it costs - the field it is sitting on.
 */
function ripeField(player: Player): number | null {
  return player.fields.reduce<number | null>((found, field, at) => {
    const bean = fieldBean(field);
    const done =
      bean !== null &&
      coinsFor(bean, field.length) === maxCoins(bean) &&
      canHarvest(player, at);
    return found === null && done ? at : found;
  }, null);
}

/** The Taler one more card on a field of this size would bring in. */
function gainFrom(bean: Bean, count: number): number {
  return coinsFor(bean, count + 1) - coinsFor(bean, count);
}

/** Whether a second card from the hand is worth laying down. */
function worthPlanting(player: Player, card: Card): boolean {
  const growing = player.fields.some((field) => fieldBean(field) === card.bean);
  const support = player.hand.filter((held) => held.bean === card.bean).length;
  // Card 0 is the one being judged, so it counts itself out of the support.
  return growing || support > SUPPORT_NEEDED;
}

/**
 * Which field takes this card.
 *
 * @remarks
 * A field already growing the sort comes first, and among those the one closest
 * to its next Taler - a row of four Feuerbohnen wants the fifth more than a row
 * of one does. Bare earth is the fallback, and among bare fields any will do.
 */
function bestField(player: Player, bean: Bean): number {
  const fields = plantableFields(player, bean);
  return fields.reduce((best, at) => {
    const here = rowValue(player, at, bean);
    return here > rowValue(player, best, bean) ? at : best;
  }, fields[0]);
}

/** How much this particular field wants the card. */
function rowValue(player: Player, at: number, bean: Bean): number {
  const field = player.fields[at];
  const missing = toNextCoin(bean, field.length);
  return fieldBean(field) === bean
    ? EXTEND_BASE + gainFrom(bean, field.length) * COIN_GAIN - (missing ?? 0)
    : 0;
}

/**
 * Which field to give up when a card fits nowhere.
 *
 * @remarks
 * The most Taler first, and among equals the smallest field - a harvest that
 * pays two and throws away two cards is better than one that pays two and
 * throws away six. A field with nothing left to gain is preferred outright,
 * because waiting longer would have bought nothing anyway.
 */
function clearAField(player: Player): BohnanzaMove | null {
  const options = player.fields
    .map((field, at) => ({ field, at }))
    .filter((entry) => canHarvest(player, entry.at));
  const best = options.reduce<{ at: number; score: number } | null>(
    (found, entry) => {
      const bean = fieldBean(entry.field);
      const coins = bean === null ? 0 : coinsFor(bean, entry.field.length);
      const ripe = bean !== null && coins === maxCoins(bean);
      // How far this row still is from paying anything more. A field two cards
      // short of a Taler is worth keeping; one eight cards short is a field
      // being wasted, and it is the one to give up.
      const missing =
        bean === null ? 0 : (toNextCoin(bean, entry.field.length) ?? 0);
      const score =
        coins * COIN_WEIGHT -
        entry.field.length +
        (ripe ? RIPE_BONUS : 0) +
        missing;
      return found === null || score > found.score
        ? { at: entry.at, score }
        : found;
    },
    null,
  );
  return best === null ? null : { kind: "harvest", field: best.at };
}

// ------------------------------------------------------------- the trading

/**
 * Who might want this bean, keenest first.
 *
 * @remarks
 * Read off the table, not out of anybody's hand: somebody already growing the
 * sort wants another, and somebody with bare earth might. Nobody else is worth
 * asking, and an empty list is a perfectly good answer - the card just gets
 * planted instead.
 */
function buyersFor(
  game: BohnanzaGame,
  seat: number,
  bean: Bean,
): readonly number[] {
  return game.players
    .map((player, at) => ({
      at,
      value: at === seat ? FORCED_HARVEST : placementValue(player, bean),
    }))
    .filter((entry) => entry.value > 0)
    .sort((left, right) => right.value - left.value)
    .map((entry) => entry.at);
}

/**
 * The sort the machine asks for in return.
 *
 * @remarks
 * Whatever its own best field wants next, and nothing if no field wants
 * anything - which makes the offer a gift, and a gift is a perfectly good way
 * of getting rid of a bean you cannot use.
 */
function wishList(game: BohnanzaGame, seat: number): readonly Bean[] {
  const player = game.players[seat];
  const wanted = player.fields.reduce<{ bean: Bean; value: number } | null>(
    (found, field) => {
      const bean = fieldBean(field);
      const value = bean === null ? -1 : gainFrom(bean, field.length);
      return bean !== null && (found === null || value > found.value)
        ? { bean, value }
        : found;
    },
    null,
  );
  return wanted === null ? [] : [wanted.bean];
}

/**
 * The cards the machine would hand over for a wish list.
 *
 * @remarks
 * The cheapest ones it holds of each sort asked for - "cheapest" meaning the
 * one it would miss least, which for identical beans comes down to their place
 * in the hand. The front card is the one the next turn is about to force on it
 * anyway, so that is the one it lets go.
 */
function pickCards(
  game: BohnanzaGame,
  seat: number,
  want: readonly Bean[],
): readonly Card[] {
  const pool = [...tradeable(game, seat)];
  const picked: Card[] = [];
  for (const bean of want) {
    const at = pool.findIndex((card) => card.bean === bean);
    if (at >= 0) {
      picked.push(pool[at]);
      pool.splice(at, 1);
    }
  }
  return picked;
}

/**
 * What the machine would say about a bean, for the log and the screen.
 *
 * @param player - whose fields
 * @param bean - the sort
 * @returns a short German phrase, or null when there is nothing to say
 * @remarks
 * Exported because the trade panel shows it beside each seat: which of the
 * others could use the bean you are holding is public information, read off
 * face-up fields, and making a player count fields by eye to get at it would be
 * hiding the game rather than preserving it.
 */
export function interestIn(player: Player, bean: Bean): string | null {
  const growing = player.fields.some((field) => fieldBean(field) === bean);
  const bare = player.fields.some((field) => field.length === 0);
  let hint: string | null;
  if (growing) {
    hint = `baut ${beanName(bean)} an`;
  } else if (bare) {
    hint = "hat ein freies Feld";
  } else {
    hint = null;
  }
  return hint;
}
