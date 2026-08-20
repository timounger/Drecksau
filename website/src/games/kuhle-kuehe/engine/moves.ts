/**
 * The rules: which move is allowed, and what it does.
 *
 * @module
 * @remarks
 * Every function here is pure and {@link applyMove} is the one referee: it
 * returns the new game, or null when the move is not allowed right now. An
 * online host can hand a guest's move straight to it without checking anything
 * first, which is why nothing else in the game is allowed to change state.
 *
 * A turn is two halves and the phase says which: `draw` is "how do I get
 * cards", `play` is "what do I lay down". Two things interrupt that - a
 * Kuhhandel, where **everybody** answers, and an attack, where the target may
 * answer. Both are phases of their own rather than flags, so there is never a
 * moment where it is unclear who is being waited for.
 */
import {
  guardBreaker,
  isAttack,
  isGuard,
  cardName,
  type Action,
  type Card,
} from "./cards";
import { createRandom, shuffle, type Random } from "./random";
/** Breeds a cow may hold without a crossing card. */
const PURE_BREEDS = 1;

/** How many breeds each crossing card allows. */
const CROSS_BREEDS = { cross2: 2, cross3: 3 } as const;

import {
  HAND_LIMIT,
  HERD_MINIMUM,
  LONGEST_MINIMUM,
  MIN_COW,
  TRADE_SIZE,
  breedsOf,
  cowCards,
  herdSize,
  longestCow,
  type Cow,
  type KuhleKueheGame,
  type KuhleKueheMove,
  type Player,
} from "./state";

/**
 * Who the table is waiting for.
 *
 * @param game - the current game
 * @returns the seat holding things up, or null once the game is over
 * @remarks
 * Not always the player whose turn it is. During a Kuhhandel everybody owes two
 * cards, so the seat named is the first that still has not passed; while an
 * attack hangs, it is the target. The online layer asks this for one reason -
 * whom to hurry along, and whom to play for when they never answer - and a
 * player who cannot act right now cannot be hurried.
 */
export function seatOnTurn(game: KuhleKueheGame): number | null {
  let seat: number | null = null;
  if (game.phase === "defend" && game.pending !== null) {
    seat = game.pending.target;
  } else if (game.phase === "trade") {
    const owing = game.players.findIndex((player) => player.trade === null);
    seat = owing >= 0 ? owing : game.active;
  } else if (game.phase !== "gameOver") {
    seat = game.active;
  }
  return seat;
}

/**
 * Plays a move as the referee.
 *
 * @param game - the current game
 * @param seat - the player making the move
 * @param move - what they want to do
 * @returns the game after the move, or null if it was not allowed
 */
export function applyMove(
  game: KuhleKueheGame,
  seat: number,
  move: KuhleKueheMove,
): KuhleKueheGame | null {
  let next: KuhleKueheGame | null = null;
  if (seat >= 0 && seat < game.players.length && game.phase !== "gameOver") {
    switch (move.kind) {
      case "drawTwo":
        next = onTurn(game, seat, "draw") ? drawTwo(game) : null;
        break;
      case "takeDiscard":
        next = onTurn(game, seat, "draw")
          ? takeDiscard(game, move.cardId)
          : null;
        break;
      case "trade":
        next = onTurn(game, seat, "draw") ? openTrade(game) : null;
        break;
      case "pass":
        next =
          game.phase === "trade" ? passCards(game, seat, move.cardIds) : null;
        break;
      case "layCow":
        next = onTurn(game, seat, "play") ? layCow(game, move.cardIds) : null;
        break;
      case "layCalf":
        next = onTurn(game, seat, "play") ? layCalf(game, move.cardId) : null;
        break;
      case "action":
        next = onTurn(game, seat, "play") ? playAction(game, move) : null;
        break;
      case "defend":
        next = defend(game, seat, move.cardId);
        break;
      case "letThrough":
        next = letThrough(game, seat);
        break;
      case "endTurn":
        next = onTurn(game, seat, "play")
          ? endTurn(game, move.discardIds ?? [])
          : null;
        break;
    }
  }
  return next;
}

/** Whether this seat is the one acting, in the phase it claims. */
function onTurn(
  game: KuhleKueheGame,
  seat: number,
  phase: KuhleKueheGame["phase"],
): boolean {
  return game.phase === phase && game.active === seat;
}

// ---------------------------------------------------------------- phase one

/** Takes two off the deck, or what is left of it. */
function drawTwo(game: KuhleKueheGame): KuhleKueheGame {
  const drawn = game.draw.slice(0, 2);
  const rest = game.draw.slice(drawn.length);
  const withCards = handTo(game, game.active, (hand) => [...hand, ...drawn]);
  return note(
    {
      ...withCards,
      draw: rest,
      phase: "play",
      emptiedBy: emptiedBy(game, rest),
    },
    `${game.players[game.active].name} zieht ${drawn.length} Karten.`,
  );
}

/**
 * Takes one named cow part off the discard pile.
 *
 * @remarks
 * Cow parts only. "Es ist nicht erlaubt ein Kalb oder eine Aktionskarte vom
 * Ablagestapel zu nehmen" - so the pile is a place to fish out the Holstein
 * rear somebody threw away, not a second hand of action cards.
 */
function takeDiscard(
  game: KuhleKueheGame,
  cardId: string,
): KuhleKueheGame | null {
  const card = game.discard.find((entry) => entry.id === cardId);
  let next: KuhleKueheGame | null = null;
  if (card !== undefined && card.kind === "cow") {
    const taken = handTo(game, game.active, (hand) => [...hand, card]);
    next = note(
      {
        ...taken,
        discard: game.discard.filter((entry) => entry.id !== cardId),
        phase: "play",
      },
      `${game.players[game.active].name} nimmt ${cardName(card)} vom Ablagestapel.`,
    );
  }
  return next;
}

/**
 * Calls a Kuhhandel: everybody owes two cards to their left.
 *
 * @remarks
 * Not in the very last round - the rulebook forbids it, and for a good reason:
 * a trade on the final turn is a way to dump your rubbish on somebody who will
 * never get to play it.
 */
function openTrade(game: KuhleKueheGame): KuhleKueheGame | null {
  let next: KuhleKueheGame | null = null;
  if (game.emptiedBy === null) {
    const random = createRandom(game.rng);
    // Anybody short of two cards tops up first, so everyone can take part.
    const { players, draw } = topUpForTrade(game, random);
    next = note(
      {
        ...game,
        players,
        draw,
        phase: "trade",
        rng: random.state(),
        emptiedBy: emptiedBy(game, draw),
      },
      `${game.players[game.active].name} löst einen Kuhhandel aus.`,
    );
  }
  return next;
}

/** Deals anybody below two cards up to two, so the trade can happen. */
function topUpForTrade(
  game: KuhleKueheGame,
  random: Random,
): { players: readonly Player[]; draw: readonly Card[] } {
  let pile = [...game.draw];
  const players = game.players.map((player) => {
    const short = Math.max(0, TRADE_SIZE - player.hand.length);
    const taken = pile.slice(0, short);
    pile = pile.slice(taken.length);
    return { ...player, hand: [...player.hand, ...taken], trade: null };
  });
  // The generator is advanced so the cursor moves even when nobody topped up,
  // which keeps a replayed game in step with the one that was played.
  random.next();
  return { players, draw: pile };
}

/**
 * One seat names the two cards it passes left.
 *
 * @remarks
 * Held rather than moved: the cards only change hands once **everybody** has
 * named theirs, because a trade where the last player can see what they are
 * about to receive is not the same trade.
 */
function passCards(
  game: KuhleKueheGame,
  seat: number,
  cardIds: readonly string[],
): KuhleKueheGame | null {
  const player = game.players[seat];
  const owns = cardIds.every((id) =>
    player.hand.some((card) => card.id === id),
  );
  const distinct = new Set(cardIds).size === cardIds.length;
  let next: KuhleKueheGame | null = null;
  if (
    player.trade === null &&
    cardIds.length === TRADE_SIZE &&
    distinct &&
    owns
  ) {
    const players = game.players.map((entry, at) =>
      at === seat ? { ...entry, trade: [...cardIds] } : entry,
    );
    next = players.every((entry) => entry.trade !== null)
      ? settleTrade({ ...game, players })
      : { ...game, players };
  }
  return next;
}

/** Hands every bundle to the left neighbour at once. */
function settleTrade(game: KuhleKueheGame): KuhleKueheGame {
  const count = game.players.length;
  const given = game.players.map((player) =>
    (player.trade ?? []).flatMap((id) =>
      player.hand.filter((card) => card.id === id),
    ),
  );
  const players = game.players.map((player, seat) => {
    // Left round the table is the next seat up; everyone moves at once.
    const from = (seat - 1 + count) % count;
    const kept = player.hand.filter(
      (card) => !(player.trade ?? []).includes(card.id),
    );
    return { ...player, hand: [...kept, ...given[from]], trade: null };
  });
  return note(
    { ...game, players, phase: "play" },
    `Kuhhandel: alle geben ${TRADE_SIZE} Karten nach links.`,
  );
}

// ---------------------------------------------------------------- phase two

/**
 * Lays a new cow out of the named cards.
 *
 * @remarks
 * The cards may arrive in any order, so this sorts them into head, middles and
 * rear itself rather than trusting the caller. What it will not do is invent a
 * missing half: a cow without a head or without a rear is not a cow, and that
 * is the one line the rulebook prints in bold.
 */
function layCow(
  game: KuhleKueheGame,
  cardIds: readonly string[],
): KuhleKueheGame | null {
  const player = game.players[game.active];
  const cards = pick(player.hand, cardIds);
  let next: KuhleKueheGame | null = null;
  if (cards !== null && cards.length >= MIN_COW) {
    const parts = cards.filter((card) => card.kind === "cow");
    const heads = parts.filter((c) => c.kind === "cow" && c.part === "head");
    const rears = parts.filter((c) => c.kind === "cow" && c.part === "rear");
    const middles = parts.filter(
      (c) => c.kind === "cow" && c.part === "middle",
    );
    if (
      parts.length === cards.length &&
      heads.length === 1 &&
      rears.length === 1
    ) {
      const cow: Cow = {
        id: `cow-${heads[0].id}`,
        head: heads[0],
        middles,
        rear: rears[0],
        guard: null,
      };
      next = breedsAllowed(game, cow)
        ? note(
            award(
              {
                ...withPlayer(game, game.active, {
                  hand: player.hand.filter(
                    (card) => !cardIds.includes(card.id),
                  ),
                  herd: [...player.herd, cow],
                }),
                // The crossing card is spent on the cow it made possible.
                crossing: null,
              },
              game.active,
            ),
            `${player.name} legt eine Kuh aus ${cowCards(cow).length} Karten aus.`,
          )
        : null;
    }
  }
  return next;
}

/**
 * Whether this cow may be laid out at all.
 *
 * @remarks
 * One breed always. More only with a crossing card played first, and only for
 * as many breeds as that card allows - "eine nachträgliche Rassen-Kreuzung ist
 * im weiteren Spielverlauf nicht möglich", so the permission has to be spent on
 * the cow that is going down now.
 */
function breedsAllowed(game: KuhleKueheGame, cow: Cow): boolean {
  const breeds = breedsOf(cow).length;
  return breeds <= Math.max(PURE_BREEDS, game.crossing ?? PURE_BREEDS);
}

/**
 * Puts a calf down.
 *
 * @remarks
 * Only once a grown cow is already standing. A calf on an empty table would be
 * a free point and a free head towards the biggest-herd ribbon, which is what
 * the rulebook is heading off.
 */
function layCalf(game: KuhleKueheGame, cardId: string): KuhleKueheGame | null {
  const player = game.players[game.active];
  const card = player.hand.find((entry) => entry.id === cardId);
  let next: KuhleKueheGame | null = null;
  if (card !== undefined && card.kind === "calf" && player.herd.length > 0) {
    next = note(
      award(
        withPlayer(game, game.active, {
          hand: player.hand.filter((entry) => entry.id !== cardId),
          calves: [...player.calves, card],
        }),
        game.active,
      ),
      `${player.name} legt ein Kalb aus.`,
    );
  }
  return next;
}

/** Plays an action card, whatever it does. */
function playAction(
  game: KuhleKueheGame,
  move: Extract<KuhleKueheMove, { kind: "action" }>,
): KuhleKueheGame | null {
  const player = game.players[game.active];
  const card = player.hand.find((entry) => entry.id === move.cardId);
  let next: KuhleKueheGame | null = null;
  if (card !== undefined && card.kind === "action") {
    const spent = withPlayer(game, game.active, {
      hand: player.hand.filter((entry) => entry.id !== move.cardId),
    });
    next = resolveAction(spent, card, card.action, move);
  }
  return next;
}

/** Sends each action where it goes. */
function resolveAction(
  game: KuhleKueheGame,
  card: Card,
  action: Action,
  move: Extract<KuhleKueheMove, { kind: "action" }>,
): KuhleKueheGame | null {
  let next: KuhleKueheGame | null = null;
  if (action === "feed") {
    next = feed(game, card, move.cowId, move.middleId);
  } else if (action === "cross2" || action === "cross3") {
    next = discardTo(
      { ...game, crossing: CROSS_BREEDS[action] },
      card,
      `${game.players[game.active].name} spielt ${cardName(card)}.`,
    );
  } else if (isGuard(action)) {
    next = protect(game, card, action, move.cowId);
  } else if (isAttack(action)) {
    next = openAttack(game, card, move);
  } else if (action === "lasso") {
    next = lasso(game, card, move.target);
  } else {
    next = discardTo(
      game,
      card,
      `${game.players[game.active].name} ist noch einmal dran.`,
    );
  }
  return next;
}

/** Feed: spend the card, slot one middle into one of your own cows. */
function feed(
  game: KuhleKueheGame,
  card: Card,
  cowId: string | undefined,
  middleId: string | undefined,
): KuhleKueheGame | null {
  const player = game.players[game.active];
  const middle = player.hand.find((entry) => entry.id === middleId);
  const cow = player.herd.find((entry) => entry.id === cowId);
  let next: KuhleKueheGame | null = null;
  if (
    cow !== undefined &&
    middle !== undefined &&
    middle.kind === "cow" &&
    middle.part === "middle" &&
    fitsInto(cow, middle)
  ) {
    next = discardTo(
      award(
        withPlayer(game, game.active, {
          hand: player.hand.filter((entry) => entry.id !== middle.id),
          herd: player.herd.map((entry) =>
            entry.id === cow.id
              ? { ...entry, middles: [...entry.middles, middle] }
              : entry,
          ),
        }),
        game.active,
      ),
      card,
      `${player.name} füttert eine Kuh: ${cardName(middle)}.`,
    );
  }
  return next;
}

/**
 * Whether a middle may be slotted into a standing cow.
 *
 * @remarks
 * A joker fits anything. Otherwise it must be a breed the cow already is -
 * crossing is a thing you do while laying the cow out, never afterwards.
 */
function fitsInto(cow: Cow, middle: Card): boolean {
  const breeds = breedsOf(cow);
  return (
    middle.kind === "cow" &&
    (middle.breed === null || breeds.includes(middle.breed))
  );
}

/** Lays a Brandeisen or Stall on one of your own cows. */
function protect(
  game: KuhleKueheGame,
  card: Card,
  guard: Action,
  cowId: string | undefined,
): KuhleKueheGame | null {
  const player = game.players[game.active];
  const cow = player.herd.find((entry) => entry.id === cowId);
  const lying = cow?.guard;
  const onIt =
    lying !== null && lying !== undefined && lying.kind === "action"
      ? lying.action
      : null;
  let next: KuhleKueheGame | null = null;
  // Either the cow is bare, or this is the one card that lifts what is on it.
  if (cow !== undefined && (onIt === null || guardBreaker(onIt) === guard)) {
    next = note(
      {
        ...withPlayer(game, game.active, {
          herd: player.herd.map((entry) =>
            entry.id === cow.id ? { ...entry, guard: card } : entry,
          ),
        }),
        // The card it replaced goes to the pile - it is off the cow now.
        discard:
          lying === null || lying === undefined
            ? game.discard
            : [...game.discard, lying],
      },
      `${player.name} schützt eine Kuh mit ${cardName(card)}.`,
    );
  }
  return next;
}

/**
 * Puts an attack on the table and gives its target the chance to answer.
 *
 * @remarks
 * The card leaves the attacker's hand now, before anybody knows whether it will
 * land. That is how it works on the table too, and it matters: a Herdenhund
 * sends **both** cards to the discard pile, so the attack must already be out
 * of the hand to go with it.
 */
function openAttack(
  game: KuhleKueheGame,
  card: Card,
  move: Extract<KuhleKueheMove, { kind: "action" }>,
): KuhleKueheGame | null {
  const target = move.target;
  let next: KuhleKueheGame | null = null;
  if (
    target !== undefined &&
    target !== game.active &&
    target >= 0 &&
    target < game.players.length &&
    reachable(game, target, card, move.cowId)
  ) {
    next = note(
      {
        ...game,
        phase: "defend",
        pending: { by: game.active, target, card, cowId: move.cowId ?? null },
      },
      `${game.players[game.active].name} greift ${game.players[target].name} an: ${cardName(card)}.`,
    );
  }
  return next;
}

/** Whether the named target actually offers what this attack needs. */
function reachable(
  game: KuhleKueheGame,
  target: number,
  card: Card,
  cowId: string | undefined,
): boolean {
  const victim = game.players[target];
  let ok = false;
  if (card.kind === "action" && card.action === "calfNap") {
    ok = victim.calves.length > 0;
  } else {
    const cow = victim.herd.find((entry) => entry.id === cowId);
    // A guarded cow is simply not a target - the protection is permanent.
    ok =
      cow !== undefined &&
      cow.guard === null &&
      (card.kind !== "action" ||
        card.action === "rustler" ||
        cow.middles.length > 0);
  }
  return ok;
}

/** The dog: both cards go, nothing happens. */
function defend(
  game: KuhleKueheGame,
  seat: number,
  cardId: string,
): KuhleKueheGame | null {
  const pending = game.pending;
  let next: KuhleKueheGame | null = null;
  if (game.phase === "defend" && pending !== null && pending.target === seat) {
    const player = game.players[seat];
    const dog = player.hand.find((entry) => entry.id === cardId);
    if (dog !== undefined && dog.kind === "action" && dog.action === "dog") {
      next = note(
        {
          ...withPlayer(game, seat, {
            hand: player.hand.filter((entry) => entry.id !== cardId),
          }),
          phase: "play",
          pending: null,
          discard: [...game.discard, pending.card, dog],
        },
        `${player.name} wehrt den Angriff mit dem Herdenhund ab.`,
      );
    }
  }
  return next;
}

/** No dog, or no wish to spend one: the attack lands. */
function letThrough(game: KuhleKueheGame, seat: number): KuhleKueheGame | null {
  const pending = game.pending;
  return game.phase === "defend" && pending !== null && pending.target === seat
    ? land(game, pending)
    : null;
}

/** Carries out an attack that was not turned away. */
function land(
  game: KuhleKueheGame,
  pending: KuhleKueheGame["pending"],
): KuhleKueheGame {
  const attack = pending as NonNullable<KuhleKueheGame["pending"]>;
  const card = attack.card;
  const action = card.kind === "action" ? card.action : "shove";
  const victim = game.players[attack.target];
  let after: KuhleKueheGame;
  if (action === "calfNap") {
    const [taken, ...rest] = victim.calves;
    after = {
      ...withPlayer(game, attack.target, { calves: rest }),
      discard: [...game.discard, card, taken],
    };
  } else if (action === "rustler") {
    // The one attack that does not destroy: the cow changes hands whole.
    const cow = victim.herd.find((entry) => entry.id === attack.cowId);
    const thief = game.players[attack.by];
    const moved = withPlayer(
      withPlayer(game, attack.target, {
        herd: victim.herd.filter((entry) => entry.id !== attack.cowId),
      }),
      attack.by,
      { herd: cow === undefined ? thief.herd : [...thief.herd, cow] },
    );
    after = { ...moved, discard: [...game.discard, card] };
  } else {
    const cow = victim.herd.find((entry) => entry.id === attack.cowId);
    const taken =
      cow === undefined
        ? []
        : action === "shove"
          ? cow.middles
          : cow.middles.slice(0, 1);
    after = {
      ...withPlayer(game, attack.target, {
        herd: victim.herd.map((entry) =>
          entry.id === attack.cowId
            ? { ...entry, middles: entry.middles.slice(taken.length) }
            : entry,
        ),
      }),
      discard: [...game.discard, card, ...taken],
    };
  }
  return note(
    awardAll({ ...after, phase: "play", pending: null }),
    `${cardName(card)} trifft ${victim.name}.`,
  );
}

/** Lasso: one card out of somebody's hand, chosen blind. */
function lasso(
  game: KuhleKueheGame,
  card: Card,
  target: number | undefined,
): KuhleKueheGame | null {
  let next: KuhleKueheGame | null = null;
  if (
    target !== undefined &&
    target !== game.active &&
    target >= 0 &&
    target < game.players.length &&
    game.players[target].hand.length > 0
  ) {
    const random = createRandom(game.rng);
    const victim = game.players[target];
    // Blind, so the generator picks - the thief does not get to look first.
    const stolen = shuffle(random, victim.hand)[0];
    const moved = withPlayer(
      withPlayer(game, target, {
        hand: victim.hand.filter((entry) => entry.id !== stolen.id),
      }),
      game.active,
      { hand: [...game.players[game.active].hand, stolen] },
    );
    next = discardTo(
      { ...moved, rng: random.state() },
      card,
      `${game.players[game.active].name} zieht ${victim.name} eine Handkarte ab.`,
    );
  }
  return next;
}

// ------------------------------------------------------------- ending a turn

/**
 * Ends the turn, dropping whatever is over the hand limit.
 *
 * @remarks
 * The limit is checked here rather than being enforced card by card, because
 * the rulebook applies it at the **end** of a turn: you may hold ten cards
 * halfway through your own turn, as long as two of them are gone by the time
 * you say "Muh!".
 */
function endTurn(
  game: KuhleKueheGame,
  discardIds: readonly string[],
): KuhleKueheGame | null {
  const player = game.players[game.active];
  const kept = player.hand.filter((card) => !discardIds.includes(card.id));
  const dropped = player.hand.filter((card) => discardIds.includes(card.id));
  let next: KuhleKueheGame | null = null;
  if (kept.length <= HAND_LIMIT && dropped.length === discardIds.length) {
    const tidied = {
      ...withPlayer(game, game.active, { hand: kept }),
      discard: [...game.discard, ...dropped],
      crossing: null,
    };
    next = handOn(tidied);
  }
  return next;
}

/**
 * Passes the turn on, or ends the game.
 *
 * @remarks
 * The game stops when the turn would come back to whoever emptied the deck -
 * which is exactly "die anderen Spieler sind noch jeweils einmal am Zug",
 * without having to count turns.
 */
function handOn(game: KuhleKueheGame): KuhleKueheGame {
  const next = (game.active + 1) % game.players.length;
  return game.emptiedBy !== null && next === game.emptiedBy
    ? note({ ...game, phase: "gameOver" }, "Der Nachziehstapel ist leer.")
    : { ...game, active: next, phase: "draw" };
}

// -------------------------------------------------------------------- awards

/**
 * Hands the ribbons out again after a herd changed.
 *
 * @param game - the game
 * @param seat - the seat that just changed, for the first-cow ribbon
 * @returns the game with the ribbons where they belong
 */
function award(game: KuhleKueheGame, seat: number): KuhleKueheGame {
  const firstCow =
    game.awards.firstCow === null && game.players[seat].herd.length > 0
      ? seat
      : game.awards.firstCow;
  return awardAll({ ...game, awards: { ...game.awards, firstCow } });
}

/**
 * Re-checks the two travelling ribbons.
 *
 * @remarks
 * They only move on **more**, never on equal: "Der Spieler behält die
 * Auszeichnung, bis ein anderer Spieler eine größere Herde hat." So the holder
 * keeps it through a tie, which is why this cannot simply be derived from the
 * herds each time it is drawn.
 */
function awardAll(game: KuhleKueheGame): KuhleKueheGame {
  const biggest = bestSeat(
    game,
    herdSize,
    HERD_MINIMUM,
    game.awards.biggestHerd,
  );
  const longest = bestSeat(
    game,
    longestCow,
    LONGEST_MINIMUM,
    game.awards.longestCow,
  );
  return {
    ...game,
    awards: { ...game.awards, biggestHerd: biggest, longestCow: longest },
  };
}

/** Who leads on this measure, with the holder keeping it on a tie. */
function bestSeat(
  game: KuhleKueheGame,
  measure: (player: Player) => number,
  minimum: number,
  holder: number | null,
): number | null {
  const held = holder === null ? 0 : measure(game.players[holder]);
  let best = holder !== null && held >= minimum ? holder : null;
  let bestValue = best === null ? minimum - 1 : held;
  game.players.forEach((player, seat) => {
    const value = measure(player);
    if (value >= minimum && value > bestValue) {
      best = seat;
      bestValue = value;
    }
  });
  return best;
}

// ------------------------------------------------------------------- helpers

/** The named cards out of a hand, or null if any of them is not there. */
function pick(
  hand: readonly Card[],
  ids: readonly string[],
): readonly Card[] | null {
  const found = ids.map((id) => hand.find((card) => card.id === id));
  const distinct = new Set(ids).size === ids.length;
  return distinct && found.every((card) => card !== undefined)
    ? (found as Card[])
    : null;
}

/** A game with one player changed. */
function withPlayer(
  game: KuhleKueheGame,
  seat: number,
  change: Partial<Player>,
): KuhleKueheGame {
  return {
    ...game,
    players: game.players.map((player, at) =>
      at === seat ? { ...player, ...change } : player,
    ),
  };
}

/** A game with one player's hand rebuilt. */
function handTo(
  game: KuhleKueheGame,
  seat: number,
  change: (hand: readonly Card[]) => readonly Card[],
): KuhleKueheGame {
  return withPlayer(game, seat, { hand: change(game.players[seat].hand) });
}

/** Puts a spent card on the pile and writes the line. */
function discardTo(
  game: KuhleKueheGame,
  card: Card,
  line: string,
): KuhleKueheGame {
  return note({ ...game, discard: [...game.discard, card] }, line);
}

/** Who emptied the deck, once it is empty. */
function emptiedBy(game: KuhleKueheGame, rest: readonly Card[]): number | null {
  return game.emptiedBy ?? (rest.length === 0 ? game.active : null);
}

/** Adds a line to the log. */
function note(game: KuhleKueheGame, line: string): KuhleKueheGame {
  return { ...game, log: [...game.log, line] };
}

/**
 * Every move the seat could make right now.
 *
 * @param game - the current game
 * @param seat - the player asking
 * @returns the legal moves, so the screen and the computer see the same game
 * @remarks
 * Deliberately not exhaustive for `layCow`: the number of ways to pick a head,
 * a rear and any run of middles out of a hand grows fast, and neither the
 * screen nor the computer wants the list. Both build cows their own way and
 * hand the result back to {@link applyMove}, which is the only judge anyway.
 */
export function legalMoves(
  game: KuhleKueheGame,
  seat: number,
): readonly KuhleKueheMove[] {
  const moves: KuhleKueheMove[] = [];
  const player = game.players[seat];
  if (game.phase === "draw" && game.active === seat) {
    moves.push({ kind: "drawTwo" });
    for (const card of game.discard.filter((entry) => entry.kind === "cow")) {
      moves.push({ kind: "takeDiscard", cardId: card.id });
    }
    if (game.emptiedBy === null) {
      moves.push({ kind: "trade" });
    }
  } else if (game.phase === "trade" && player.trade === null) {
    // Only the shape is offered - which two cards is the player's business.
    moves.push({ kind: "pass", cardIds: [] });
  } else if (game.phase === "defend" && game.pending?.target === seat) {
    for (const card of player.hand) {
      if (card.kind === "action" && card.action === "dog") {
        moves.push({ kind: "defend", cardId: card.id });
      }
    }
    moves.push({ kind: "letThrough" });
  } else if (game.phase === "play" && game.active === seat) {
    for (const card of player.hand) {
      if (card.kind === "calf" && player.herd.length > 0) {
        moves.push({ kind: "layCalf", cardId: card.id });
      } else if (card.kind === "action") {
        moves.push({ kind: "action", cardId: card.id });
      }
    }
    moves.push({ kind: "endTurn" });
  }
  return moves;
}
