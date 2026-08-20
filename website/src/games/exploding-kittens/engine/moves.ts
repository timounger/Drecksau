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
 * The shape of the module comes from one card. **Nö!** may be played by anybody
 * at any time, so nothing a player lays takes effect the moment it is laid:
 * it goes on the table as a {@link Pending} action, a window opens, and only
 * when the window closes does anything happen. That is why laying a card and
 * carrying it out are two different functions here, with the whole
 * {@link openWindow} / {@link settleWindow} / {@link resolveAction} chain in
 * between - and why the cards leave their owner's hand **before** anyone knows
 * whether the action survives. The rulebook is explicit about that last part:
 * "Any cards that have been Noped are lost. Leave them in the Discard Pile."
 */
import {
  cardName,
  isNopeable,
  playsAlone,
  FUTURE_CARDS,
  type Card,
  type CardKind,
} from "./cards";
import { createRandom, randomInt, shuffle } from "./random";
import {
  ATTACK_TURNS,
  COMBO_NAME,
  COMBO_STEAL,
  isAlive,
  livingSeats,
  type Action,
  type ExplodingKittensGame,
  type ExplodingKittensMove,
  type Pending,
  type Player,
} from "./state";

/**
 * Who the table is waiting for.
 *
 * @param game - the current game
 * @returns the seat holding things up, or null once the game is over
 * @remarks
 * Very often **not** the player whose turn it is. While a Nö! window is open it
 * is whoever still has to answer it; while a Gefallen hangs it is its victim.
 * The online layer asks this for one reason - whom to hurry along, and whom to
 * play for when they never answer - and a player who cannot act right now
 * cannot be hurried.
 */
export function seatOnTurn(game: ExplodingKittensGame): number | null {
  let seat: number | null = null;
  if (game.phase === "nope") {
    const waiting = nopeCandidates(game);
    seat = waiting.length > 0 ? waiting[0] : game.active;
  } else if (game.phase === "favor") {
    seat = game.demand?.target ?? game.active;
  } else if (game.phase !== "gameOver") {
    seat = game.active;
  }
  return seat;
}

/**
 * Who may still answer the open window.
 *
 * @param game - the current game
 * @returns the seats that hold a Nö! and have not waved this round through
 * @remarks
 * Only the holders of a Nö!, which is a deliberate departure from the table -
 * see the note in `docs/games/exploding-kittens/game-rules.md`. Asking all four
 * other players about every single card, when there are five Nö!s in
 * fifty-six, would be four clicks into nothing per card played.
 *
 * Whoever laid the card on top is never asked. You do not nope your own; and
 * once somebody has noped you, it is **their** card on top and they are the one
 * who sits the round out.
 */
export function nopeCandidates(game: ExplodingKittensGame): readonly number[] {
  const pending = game.pending;
  return pending === null || game.phase !== "nope"
    ? []
    : livingSeats(game).filter(
        (seat) =>
          seat !== pending.lastBy &&
          !pending.passed.includes(seat) &&
          game.players[seat].hand.some((card) => card.kind === "nope"),
      );
}

/**
 * What a set of cards would be as a combo.
 *
 * @param cards - the cards picked out of a hand
 * @returns "steal" for a pair, "name" for a triple, null for anything else
 * @remarks
 * Any same-named pair, not only cat cards: "It now applies to ANY pair of cards
 * in the deck with the same title (a pair of Shuffle Cards, a pair of Attack
 * Cards, etc.)."
 */
export function comboOf(cards: readonly Card[]): "steal" | "name" | null {
  const first = cards[0];
  const same =
    first !== undefined && cards.every((card) => card.kind === first.kind);
  let combo: "steal" | "name" | null = null;
  if (same && cards.length === COMBO_STEAL) {
    combo = "steal";
  } else if (same && cards.length === COMBO_NAME) {
    combo = "name";
  }
  return combo;
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
  game: ExplodingKittensGame,
  seat: number,
  move: ExplodingKittensMove,
): ExplodingKittensGame | null {
  let next: ExplodingKittensGame | null = null;
  const ok =
    seat >= 0 &&
    seat < game.players.length &&
    game.phase !== "gameOver" &&
    isAlive(game.players[seat]);
  if (ok) {
    switch (move.kind) {
      case "play":
        next = playCard(game, seat, move.cardId, move.target);
        break;
      case "combo":
        next = playCombo(game, seat, move.cardIds, move.target, move.want);
        break;
      case "draw":
        next = drawCard(game, seat);
        break;
      case "nope":
        next = playNope(game, seat, move.cardId);
        break;
      case "letThrough":
        next = waveThrough(game, seat);
        break;
      case "give":
        next = giveCard(game, seat, move.cardId);
        break;
      case "insert":
        next = insertKitten(game, seat, move.at);
        break;
    }
  }
  return next;
}

// ------------------------------------------------------------- laying a card

/**
 * Lays one card on the discard pile and opens the window on it.
 *
 * @remarks
 * Four sorts never get here - see {@link playsAlone}. The rest all go through
 * the same door, because from the referee's point of view they are the same
 * move: a card leaves a hand, lands face up, and may or may not survive.
 */
function playCard(
  game: ExplodingKittensGame,
  seat: number,
  cardId: string,
  target: number | undefined,
): ExplodingKittensGame | null {
  const card = game.players[seat].hand.find((entry) => entry.id === cardId);
  let next: ExplodingKittensGame | null = null;
  if (
    game.phase === "play" &&
    game.active === seat &&
    card !== undefined &&
    card.kind !== "hidden" &&
    playsAlone(card.kind) &&
    targetFits(game, seat, card.kind, target)
  ) {
    const laid = discardFrom(game, seat, [card]);
    next = openWindow(
      note(laid, `${game.players[seat].name}: ${cardName(card)}`),
      { kind: "card", card, target },
      seat,
    );
  }
  return next;
}

/** Whether the named victim is a victim this card can actually have. */
function targetFits(
  game: ExplodingKittensGame,
  seat: number,
  kind: CardKind,
  target: number | undefined,
): boolean {
  let fits: boolean;
  if (kind !== "favor") {
    // Only the Gefallen picks somebody; the rest are aimed at the table.
    fits = target === undefined;
  } else {
    fits =
      target !== undefined &&
      target !== seat &&
      target >= 0 &&
      target < game.players.length &&
      isAlive(game.players[target]) &&
      game.players[target].hand.length > 0;
  }
  return fits;
}

/** Lays two or three of a sort and opens the window on the theft. */
function playCombo(
  game: ExplodingKittensGame,
  seat: number,
  cardIds: readonly string[],
  target: number,
  want: CardKind | undefined,
): ExplodingKittensGame | null {
  const player = game.players[seat];
  const distinct = new Set(cardIds).size === cardIds.length;
  const cards = cardIds
    .map((id) => player.hand.find((card) => card.id === id))
    .filter((card) => card !== undefined);
  const combo = cards.length === cardIds.length ? comboOf(cards) : null;
  let next: ExplodingKittensGame | null = null;
  if (
    game.phase === "play" &&
    game.active === seat &&
    distinct &&
    combo !== null &&
    // A pair takes at random and names nothing; a triple must name something.
    (combo === "steal") === (want === undefined) &&
    target !== seat &&
    target >= 0 &&
    target < game.players.length &&
    isAlive(game.players[target])
  ) {
    const laid = discardFrom(game, seat, cards);
    // An arrow rather than a preposition: "gegen Du" is not German, and the
    // seat you play yourself is called "Du" when it has no other name.
    const line =
      combo === "steal"
        ? `${player.name}: zwei gleiche -> ${game.players[target].name}`
        : `${player.name}: drei gleiche -> ${game.players[target].name}`;
    next = openWindow(
      note(laid, line),
      {
        kind: "combo",
        cards,
        target,
        want,
      },
      seat,
    );
  }
  return next;
}

// -------------------------------------------------------------- the window

/**
 * Puts an action on the table and lets anybody holding a Nö! answer it.
 *
 * @remarks
 * A kitten and an entschärfung never come through here - the rulebook puts them
 * out of reach - but they never get laid as a move either, so this is only ever
 * asked about things that are already nopeable.
 */
function openWindow(
  game: ExplodingKittensGame,
  action: Action,
  by: number,
): ExplodingKittensGame {
  const nopeable =
    action.kind === "combo" ||
    (action.card.kind !== "hidden" && isNopeable(action.card.kind));
  const pending: Pending = { action, by, nopes: 0, lastBy: by, passed: [] };
  const opened: ExplodingKittensGame = { ...game, phase: "nope", pending };
  return nopeable ? settleWindow(opened) : resolveAction(opened);
}

/** Somebody says no. */
function playNope(
  game: ExplodingKittensGame,
  seat: number,
  cardId: string,
): ExplodingKittensGame | null {
  const pending = game.pending;
  const card = game.players[seat].hand.find((entry) => entry.id === cardId);
  let next: ExplodingKittensGame | null = null;
  if (
    pending !== null &&
    game.phase === "nope" &&
    nopeCandidates(game).includes(seat) &&
    card !== undefined &&
    card.kind === "nope"
  ) {
    const laid = discardFrom(game, seat, [card]);
    // A fresh card on top is a fresh decision: everybody who waved the last one
    // through gets to answer this one.
    next = settleWindow(
      note(
        {
          ...laid,
          pending: {
            ...pending,
            nopes: pending.nopes + 1,
            lastBy: seat,
            passed: [],
          },
        },
        `${game.players[seat].name}: ${pending.nopes === 0 ? "Nö!" : "Doch!"}`,
      ),
    );
  }
  return next;
}

/** Somebody lets it stand. */
function waveThrough(
  game: ExplodingKittensGame,
  seat: number,
): ExplodingKittensGame | null {
  const pending = game.pending;
  return pending !== null &&
    game.phase === "nope" &&
    nopeCandidates(game).includes(seat)
    ? settleWindow({
        ...game,
        pending: { ...pending, passed: [...pending.passed, seat] },
      })
    : null;
}

/** Closes the window once nobody is left who could still answer it. */
function settleWindow(game: ExplodingKittensGame): ExplodingKittensGame {
  return nopeCandidates(game).length > 0 ? game : resolveAction(game);
}

/**
 * Carries the action out, or throws it away.
 *
 * @remarks
 * An odd number of Nö!s kills it, an even number means the last word was
 * "doch!" and it stands - "It's as if the card beneath a Nope never existed",
 * and a Nope on a Nope brings it back.
 */
function resolveAction(game: ExplodingKittensGame): ExplodingKittensGame {
  const pending = game.pending;
  let next: ExplodingKittensGame;
  if (pending === null) {
    next = game;
  } else if (pending.nopes % 2 === 1) {
    next = note(
      { ...game, phase: "play", pending: null },
      "Genöppt - nichts passiert.",
    );
  } else {
    const cleared: ExplodingKittensGame = {
      ...game,
      phase: "play",
      pending: null,
    };
    next =
      pending.action.kind === "card"
        ? doCard(cleared, pending.by, pending.action)
        : doCombo(cleared, pending.by, pending.action);
  }
  return next;
}

/** What one card does, once it has survived. */
function doCard(
  game: ExplodingKittensGame,
  by: number,
  action: Extract<Action, { kind: "card" }>,
): ExplodingKittensGame {
  const card = action.card;
  let next = game;
  if (card.kind === "attack") {
    next = handOver(game);
  } else if (card.kind === "skip") {
    next = endTurn(game);
  } else if (card.kind === "favor") {
    next = askFavor(game, by, action.target);
  } else if (card.kind === "shuffle") {
    const random = createRandom(game.rng);
    next = note(
      forgetPeeks({
        ...game,
        draw: shuffle(random, game.draw),
        rng: random.state(),
      }),
      "Der Nachziehstapel ist gemischt.",
    );
  } else if (card.kind === "future") {
    // The only card that hands somebody private knowledge, so it is written
    // into that seat alone and redacted away from everybody else.
    next = withPlayer(game, by, { peek: game.draw.slice(0, FUTURE_CARDS) });
  }
  return next;
}

/** A Gefallen: the victim now owes a card of their choosing. */
function askFavor(
  game: ExplodingKittensGame,
  by: number,
  target: number | undefined,
): ExplodingKittensGame {
  const victim = target === undefined ? null : game.players[target];
  // The victim may have spent their last card on a Nö! while this hung.
  return target === undefined || victim === null || victim.hand.length === 0
    ? note(game, "Nichts zu holen.")
    : {
        ...game,
        phase: "favor",
        demand: { by, target },
      };
}

/** The victim of a Gefallen hands one over. */
function giveCard(
  game: ExplodingKittensGame,
  seat: number,
  cardId: string,
): ExplodingKittensGame | null {
  const demand = game.demand;
  const card = game.players[seat].hand.find((entry) => entry.id === cardId);
  return demand !== null &&
    game.phase === "favor" &&
    demand.target === seat &&
    card !== undefined
    ? note(
        {
          ...move(game, seat, demand.by, [card]),
          phase: "play",
          demand: null,
        },
        `Karte: ${game.players[seat].name} -> ${game.players[demand.by].name}`,
      )
    : null;
}

/** What a combo takes, once it has survived. */
function doCombo(
  game: ExplodingKittensGame,
  by: number,
  action: Extract<Action, { kind: "combo" }>,
): ExplodingKittensGame {
  const victim = game.players[action.target];
  const want = action.want;
  let taken: Card | undefined;
  let next = game;
  if (victim.hand.length === 0) {
    taken = undefined;
  } else if (want === undefined) {
    // Two of a kind: blind, so the generator picks rather than the thief.
    const random = createRandom(game.rng);
    taken = victim.hand[randomInt(random, victim.hand.length)];
    next = { ...game, rng: random.state() };
  } else {
    // Three of a kind: named. "If they have it, you get to take it. If not,
    // you get nothing" - so a miss is a legal, and quite expensive, outcome.
    taken = victim.hand.find((card) => card.kind === want);
  }
  return taken === undefined
    ? note(next, "Nichts zu holen.")
    : note(
        move(next, action.target, by, [taken]),
        `Karte: ${victim.name} -> ${game.players[by].name}`,
      );
}

// ------------------------------------------------------------ ending a turn

/**
 * Draws the top card, and finds out what it is.
 *
 * @remarks
 * The one move in the game whose outcome is not a choice. A kitten either kills
 * or is defused, and which of the two it is has already been decided by what is
 * in the hand - see the note on the deliberate lack of a choice in
 * `docs/games/exploding-kittens/game-rules.md`.
 */
function drawCard(
  game: ExplodingKittensGame,
  seat: number,
): ExplodingKittensGame | null {
  const player = game.players[seat];
  const top = game.draw[0];
  let next: ExplodingKittensGame | null = null;
  if (game.phase === "play" && game.active === seat) {
    if (top === undefined) {
      // Cannot happen in a game the referee dealt - see the rules note - but a
      // state read back from storage need not be one of those.
      next = endTurn(note(game, "Der Nachziehstapel ist leer."));
    } else if (top.kind !== "kitten") {
      next = endTurn(
        note(
          forgetPeeks(
            withPlayer({ ...game, draw: game.draw.slice(1) }, seat, {
              hand: [...player.hand, top],
            }),
          ),
          `${player.name}: gezogen`,
        ),
      );
    } else {
      const defuse = player.hand.find((card) => card.kind === "defuse");
      const pulled = forgetPeeks({ ...game, draw: game.draw.slice(1) });
      next =
        defuse === undefined
          ? explode(pulled, seat, top)
          : note(
              {
                ...discardFrom(pulled, seat, [defuse]),
                phase: "insert",
                kitten: top,
              },
              `${player.name}: Kätzchen gezogen - entschärft!`,
            );
    }
  }
  return next;
}

/** The kitten goes back into the pile, at a place only its defuser knows. */
function insertKitten(
  game: ExplodingKittensGame,
  seat: number,
  at: number,
): ExplodingKittensGame | null {
  const kitten = game.kitten;
  const spot = Math.min(Math.max(0, Math.round(at)), game.draw.length);
  return kitten !== null &&
    game.phase === "insert" &&
    game.active === seat &&
    Number.isFinite(at)
    ? endTurn(
        note(
          {
            ...game,
            phase: "play",
            kitten: null,
            draw: [
              ...game.draw.slice(0, spot),
              kitten,
              ...game.draw.slice(spot),
            ],
          },
          `${game.players[seat].name}: Kätzchen versteckt`,
        ),
      )
    : null;
}

/**
 * Somebody blows up.
 *
 * @remarks
 * Their cards stay where they are, unreachable: "put the rest of your cards
 * face down in front of you". Nothing may target a dead seat, so leaving the
 * hand alone is both the cheapest and the most faithful thing to do with it.
 */
function explode(
  game: ExplodingKittensGame,
  seat: number,
  kitten: Card,
): ExplodingKittensGame {
  const gone = game.players.filter((player) => !isAlive(player)).length;
  const dead = note(
    {
      ...withPlayer(game, seat, { place: gone, peek: null }),
      discard: [...game.discard, kitten],
    },
    `${game.players[seat].name}: explodiert!`,
  );
  const alive = livingSeats(dead);
  return alive.length <= 1
    ? note(
        { ...dead, phase: "gameOver" },
        alive.length === 1
          ? `Überlebt und gewinnt: ${dead.players[alive[0]].name}`
          : "Alle sind raus.",
      )
    : {
        ...dead,
        active: nextLiving(dead, seat),
        turnsOwed: 1,
        underAttack: false,
      };
}

/**
 * Ends one of the turns the seat on turn owes.
 *
 * @remarks
 * One, not all of them. An Aussetzen "only ends 1 of the 2 turns" of an
 * Angriff, and so does drawing a card - which is what makes an Angriff worth
 * playing and two Aussetzen worth holding.
 */
function endTurn(game: ExplodingKittensGame): ExplodingKittensGame {
  const owed = game.turnsOwed - 1;
  return owed > 0
    ? { ...game, phase: "play", turnsOwed: owed }
    : {
        ...game,
        phase: "play",
        active: nextLiving(game, game.active),
        turnsOwed: 1,
        underAttack: false,
      };
}

/**
 * An Angriff: the whole obligation moves on, and grows by two.
 *
 * @remarks
 * This is the one place the rulebook argues with itself, and the reading here
 * is the only one that satisfies both the card and both of its own examples:
 *
 * - a player who was **not** under attack hands on two turns, as the card says;
 * - a player who **was** hands on everything they still owed, the turn they are
 *   in included, plus two - which gives the booklet's 4 and its 3.
 */
function handOver(game: ExplodingKittensGame): ExplodingKittensGame {
  const carry = game.underAttack ? game.turnsOwed : 0;
  const victim = nextLiving(game, game.active);
  const turns = carry + ATTACK_TURNS;
  return note(
    {
      ...game,
      phase: "play",
      active: victim,
      turnsOwed: turns,
      underAttack: true,
    },
    `${game.players[victim].name}: ${turns} Züge`,
  );
}

/** The next seat round the table that is still alive. */
function nextLiving(game: ExplodingKittensGame, from: number): number {
  const count = game.players.length;
  let seat = from;
  let guard = 0;
  do {
    seat = (seat + 1) % count;
    guard++;
  } while (!isAlive(game.players[seat]) && guard <= count);
  return seat;
}

// ------------------------------------------------------------------ helpers

/** A game with those cards gone from a hand and lying on the discard pile. */
function discardFrom(
  game: ExplodingKittensGame,
  seat: number,
  cards: readonly Card[],
): ExplodingKittensGame {
  const ids = cards.map((card) => card.id);
  return {
    ...withPlayer(game, seat, {
      hand: game.players[seat].hand.filter((card) => !ids.includes(card.id)),
    }),
    discard: [...game.discard, ...cards],
  };
}

/** A game with those cards moved from one hand to another. */
function move(
  game: ExplodingKittensGame,
  from: number,
  to: number,
  cards: readonly Card[],
): ExplodingKittensGame {
  const ids = cards.map((card) => card.id);
  const taken = withPlayer(game, from, {
    hand: game.players[from].hand.filter((card) => !ids.includes(card.id)),
  });
  return withPlayer(taken, to, {
    hand: [...taken.players[to].hand, ...cards],
  });
}

/**
 * Forgets what everybody thought they knew about the top of the pile.
 *
 * @remarks
 * Called by everything that moves the draw pile. A peek that is one card out of
 * date is worse than no peek: it would show a card that has already been drawn
 * and swear the next one is safe.
 */
function forgetPeeks(game: ExplodingKittensGame): ExplodingKittensGame {
  return {
    ...game,
    players: game.players.map((player) =>
      player.peek === null ? player : { ...player, peek: null },
    ),
  };
}

/** A game with one player changed. */
function withPlayer(
  game: ExplodingKittensGame,
  seat: number,
  change: Partial<Player>,
): ExplodingKittensGame {
  return {
    ...game,
    players: game.players.map((player, at) =>
      at === seat ? { ...player, ...change } : player,
    ),
  };
}

/**
 * Adds a line to the log.
 *
 * @remarks
 * The lines read as a name, a colon and what happened, rather than as sentences
 * with a verb in them. The seat you play yourself is called "Du" when it has no
 * other name, and "Du zieht eine Karte" is not German - with a line per move
 * that wrongness would be on screen all game. The label form is right for every
 * name there is.
 */
function note(game: ExplodingKittensGame, line: string): ExplodingKittensGame {
  return { ...game, log: [...game.log, line] };
}

/**
 * Whether this seat could lay this card on its own right now.
 *
 * @param game - the current game
 * @param seat - the seat asking
 * @param card - the card
 * @returns true if a plain play of it would be accepted
 * @remarks
 * The screen asks this so a card that can only ever be part of a combo does not
 * light up as if it could be laid by itself.
 */
export function canPlayAlone(
  game: ExplodingKittensGame,
  seat: number,
  card: Card,
): boolean {
  return (
    game.phase === "play" &&
    game.active === seat &&
    card.kind !== "hidden" &&
    playsAlone(card.kind)
  );
}
