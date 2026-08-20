/**
 * The computer opponent.
 *
 * @module
 * @remarks
 * Its whole plan is the one the game rewards: **build**. A pure-bred cow pays
 * two a card, so the machine lays the longest single-breed animal its hand
 * allows, feeds what it can, and only then looks for somebody to bother.
 *
 * It plays one move at a time and is asked again, exactly like a person - so
 * the same function serves the game against the computer and a seat online
 * whose player has gone.
 */
import { isAttack, type Action, type Breed, type Card } from "./cards";
import { createRandom, shuffle } from "./random";
import { legalMoves } from "./moves";
import {
  HAND_LIMIT,
  TRADE_SIZE,
  breedsOf,
  cowCards,
  type Cow,
  type KuhleKueheGame,
  type KuhleKueheMove,
  type Player,
} from "./state";

/** Below this many cards in hand it would rather draw than trade. */
const COMFORTABLE_HAND = 4;

/** The shortest the computer ever pauses before acting, in milliseconds. */
const MIN_WAIT_MS = 400;

/** How much longer it may take, so two moves never look mechanical. */
const WAIT_SPREAD_MS = 120;

/** How many pauses it picks between. */
const WAIT_STEPS = 4;

/** Rough worth of a card to the computer, least useful first. */
const WORTH = { middle: 0, calf: 1, action: 2, end: 3, hidden: 0 } as const;

/**
 * The move the computer makes for the seat it is asked about.
 *
 * @param game - the current game
 * @param seat - the seat to play
 * @returns a move, or null when there is nothing to do
 */
export function aiMove(
  game: KuhleKueheGame,
  seat: number,
): KuhleKueheMove | null {
  let move: KuhleKueheMove | null = null;
  if (game.phase === "trade") {
    move = tradeAway(game, seat);
  } else if (game.phase === "defend") {
    move = block(game, seat);
  } else if (game.phase === "draw") {
    move = fetchCards(game, seat);
  } else if (game.phase === "play") {
    move = build(game, seat);
  }
  return move;
}

/** Phase one: fish a wanted part out of the pile, else take two blind. */
function fetchCards(game: KuhleKueheGame, seat: number): KuhleKueheMove {
  const wanted = game.discard.find(
    (card) => card.kind === "cow" && worthTaking(game.players[seat], card),
  );
  return wanted === undefined
    ? { kind: "drawTwo" }
    : { kind: "takeDiscard", cardId: wanted.id };
}

/**
 * Whether a card off the pile is worth a whole turn's fetch.
 *
 * @remarks
 * Only when it finishes a cow **this turn** - that is, the hand already holds
 * the other end. Everything else is worse than drawing, because the deck gives
 * two cards and the pile gives one; taking a middle "for later" pays half price
 * for a card that cannot be laid on its own.
 *
 * It also keeps the game finite. The pile is fed by every attack and every
 * hand-limit discard, so a player who fishes from it whenever something looks
 * vaguely useful never draws, the deck never empties, and the game has no way
 * of ending.
 */
function worthTaking(player: Player, card: Card): boolean {
  let useful = false;
  if (card.kind === "cow" && card.part !== "middle") {
    const other = card.part === "head" ? "rear" : "head";
    useful = player.hand.some(
      (entry) =>
        entry.kind === "cow" &&
        entry.part === other &&
        (card.breed === null ||
          entry.breed === null ||
          entry.breed === card.breed),
    );
  }
  return useful;
}

/** Phase two: lay a cow, feed it, use what is useful, then say Muh. */
function build(game: KuhleKueheGame, seat: number): KuhleKueheMove {
  const player = game.players[seat];
  return (
    bestCow(player) ??
    feedMove(player) ??
    calfMove(game, seat) ??
    guardMove(player) ??
    attackMove(game, seat) ??
    finish(player)
  );
}

/**
 * The longest cow this hand can lay, of a single breed.
 *
 * @remarks
 * Single breed only, and deliberately: crossing costs a card and drops the cow
 * from two points a card to one. The computer would rather wait for the right
 * rear than pay to bodge one together.
 */
function bestCow(player: Player): KuhleKueheMove | null {
  const parts = player.hand.filter((card) => card.kind === "cow");
  let best: readonly string[] | null = null;
  for (const breed of breedsInHand(parts)) {
    const fits = (card: Card) =>
      card.kind === "cow" && (card.breed === breed || card.breed === null);
    const head = parts.find(
      (card) => card.kind === "cow" && card.part === "head" && fits(card),
    );
    const rear = parts.find(
      (card) => card.kind === "cow" && card.part === "rear" && fits(card),
    );
    if (head !== undefined && rear !== undefined) {
      const middles = parts.filter(
        (card) => card.kind === "cow" && card.part === "middle" && fits(card),
      );
      const ids = [head.id, ...middles.map((card) => card.id), rear.id];
      if (best === null || ids.length > best.length) {
        best = ids;
      }
    }
  }
  return best === null ? null : { kind: "layCow", cardIds: best };
}

/** The breeds worth trying, jokers standing in for any of them. */
function breedsInHand(parts: readonly Card[]): readonly (Breed | null)[] {
  const seen = new Set<Breed>();
  for (const card of parts) {
    if (card.kind === "cow" && card.breed !== null) {
      seen.add(card.breed);
    }
  }
  return seen.size === 0 ? [null] : [...seen];
}

/** Spend a feed card if a middle in hand fits a cow already standing. */
function feedMove(player: Player): KuhleKueheMove | null {
  const feed = player.hand.find(
    (card) => card.kind === "action" && card.action === "feed",
  );
  let move: KuhleKueheMove | null = null;
  if (feed !== undefined) {
    for (const cow of player.herd) {
      const breeds = breedsOf(cow);
      const middle = player.hand.find(
        (card) =>
          card.kind === "cow" &&
          card.part === "middle" &&
          (card.breed === null || breeds.includes(card.breed)),
      );
      if (middle !== undefined) {
        move = {
          kind: "action",
          cardId: feed.id,
          cowId: cow.id,
          middleId: middle.id,
        };
        break;
      }
    }
  }
  return move;
}

/** Put a calf down once there is a cow to keep it company. */
function calfMove(game: KuhleKueheGame, seat: number): KuhleKueheMove | null {
  const calf = legalMoves(game, seat).find((move) => move.kind === "layCalf");
  return calf ?? null;
}

/** Nail a protection to the best cow there is. */
function guardMove(player: Player): KuhleKueheMove | null {
  const guard = player.hand.find(
    (card) =>
      card.kind === "action" &&
      (card.action === "brand" || card.action === "barn"),
  );
  const prize = [...player.herd]
    .filter((cow) => cow.guard === null)
    .sort((a, b) => cowCards(b).length - cowCards(a).length)[0];
  return guard === undefined || prize === undefined
    ? null
    : { kind: "action", cardId: guard.id, cowId: prize.id };
}

/** Take a swing at whoever is doing best. */
function attackMove(game: KuhleKueheGame, seat: number): KuhleKueheMove | null {
  const card = game.players[seat].hand.find(
    (entry) => entry.kind === "action" && isAttack(entry.action),
  );
  let move: KuhleKueheMove | null = null;
  if (card !== undefined && card.kind === "action") {
    const prey = bestTarget(game, seat, card.action);
    if (prey !== null) {
      move = {
        kind: "action",
        cardId: card.id,
        target: prey.seat,
        cowId: prey.cowId,
      };
    }
  }
  return move;
}

/** The fattest thing this attack can actually reach. */
function bestTarget(
  game: KuhleKueheGame,
  seat: number,
  action: Action,
): { seat: number; cowId: string | undefined } | null {
  let bestSeat = -1;
  let bestCowId: string | undefined = undefined;
  let bestWorth = 0;
  for (let at = 0; at < game.players.length; at++) {
    const player = game.players[at];
    if (at === seat) {
      continue;
    }
    if (action === "calfNap") {
      if (player.calves.length > 0 && bestWorth < 1) {
        bestSeat = at;
        bestCowId = undefined;
        bestWorth = 1;
      }
      continue;
    }
    for (const cow of player.herd) {
      const reachable =
        cow.guard === null && (action === "rustler" || cow.middles.length > 0);
      const worthIt = cowCards(cow).length;
      if (reachable && worthIt > bestWorth) {
        bestSeat = at;
        bestCowId = cow.id;
        bestWorth = worthIt;
      }
    }
  }
  return bestSeat < 0 ? null : { seat: bestSeat, cowId: bestCowId };
}

/** Say Muh, dropping whatever is over the limit. */
function finish(player: Player): KuhleKueheMove {
  const over = player.hand.length - HAND_LIMIT;
  const junk =
    over <= 0 ? [] : [...player.hand].sort(byUselessness).slice(0, over);
  return { kind: "endTurn", discardIds: junk.map((card) => card.id) };
}

/** Least useful first - middles without a cow, then whatever is spare. */
function byUselessness(left: Card, right: Card): number {
  return worth(left) - worth(right);
}

/** A rough sense of what a card is good for. */
function worth(card: Card): number {
  let value: number;
  if (card.kind === "action") {
    value = WORTH.action;
  } else if (card.kind === "calf") {
    value = WORTH.calf;
  } else if (card.kind === "cow") {
    value = card.part === "middle" ? WORTH.middle : WORTH.end;
  } else {
    // A face-down card never reaches the computer - it only plays its own hand.
    value = WORTH.hidden;
  }
  return value;
}

/** Answering a Kuhhandel: hand over the two least useful cards. */
function tradeAway(game: KuhleKueheGame, seat: number): KuhleKueheMove | null {
  const player = game.players[seat];
  const junk = [...player.hand].sort(byUselessness).slice(0, TRADE_SIZE);
  return player.trade === null && player.hand.length >= TRADE_SIZE
    ? { kind: "pass", cardIds: junk.map((card) => card.id) }
    : null;
}

/**
 * Answering an attack: spend the dog on anything that would really hurt.
 *
 * @remarks
 * A dog is one card and the attacks are not equal. Losing a whole cow or a long
 * run of middles is worth it; a Mistgabel taking one middle off a short cow is
 * not, and the dog is better kept for the Viehdieb that comes later.
 */
function block(game: KuhleKueheGame, seat: number): KuhleKueheMove {
  const pending = game.pending;
  const dog = game.players[seat].hand.find(
    (card) => card.kind === "action" && card.action === "dog",
  );
  let move: KuhleKueheMove = { kind: "letThrough" };
  if (dog !== undefined && pending !== null && pending.card.kind === "action") {
    const cow = game.players[seat].herd.find(
      (entry) => entry.id === pending.cowId,
    );
    if (worthDefending(pending.card.action, cow)) {
      move = { kind: "defend", cardId: dog.id };
    }
  }
  return move;
}

/** Whether this attack is bad enough to spend the dog on. */
function worthDefending(action: Action, cow: Cow | undefined): boolean {
  const size = cow === undefined ? 0 : cowCards(cow).length;
  return (
    action === "rustler" ||
    (action === "shove" && size > COMFORTABLE_HAND) ||
    size >= HAND_LIMIT
  );
}

/**
 * How long the computer waits before acting, in milliseconds.
 *
 * @param game - the game
 * @returns the pause, so a watcher can follow what happened
 */
export function botWaitMs(game: KuhleKueheGame): number {
  const random = createRandom(game.rng);
  const steps = Array.from({ length: WAIT_STEPS }, (unused, at) => at);
  return MIN_WAIT_MS + shuffle(random, steps)[0] * WAIT_SPREAD_MS;
}
