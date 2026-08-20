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
 * The shape of the module comes from one idea: **a card landing in front of
 * somebody** is the only thing that ever happens, and everything else is what
 * that costs. {@link giveCard} is that moment, and it is reached from three
 * directions - the opening deal, a Hit, and a Dreimal forcing three cards on
 * somebody. All three end in the same place, which is why a Dreimal drawn during
 * the opening deal needs no special case of its own.
 *
 * What does need care is that two things **stop the table**: an action card has
 * to be pointed at somebody, and the three cards of a Dreimal are turned over
 * one at a time. Both interrupt whatever was going on, so {@link advance} runs
 * everything that needs no decision and stops at the first thing that does.
 */
import {
  FLIP_BONUS,
  FLIP_SEVEN,
  FLIP_THREE,
  cardName,
  type Card,
} from "./cards";
import { createRandom, shuffle } from "./random";
import {
  TARGET_SCORE,
  activeSeats,
  cardCount,
  hasNumber,
  isActive,
  roundValue,
  type Flip7Game,
  type Flip7Move,
  type Player,
} from "./state";

/** A backstop for the loop in {@link advance}; far above any real game. */
const STEP_LIMIT = 400;

/**
 * Who the table is waiting for.
 *
 * @param game - the current game
 * @returns the seat that has to act, or null once the game is over
 * @remarks
 * Often not the player whose turn it is. An action card is pointed by whoever
 * drew it, the three cards of a Dreimal are turned over by their victim, and
 * neither of those need be the seat on turn. The online layer asks this to know
 * whom to hurry along, and hurrying the wrong person would be worse than not
 * hurrying anybody.
 */
export function seatOnTurn(game: Flip7Game): number | null {
  let seat: number | null = null;
  if (game.stage === "gameOver") {
    seat = null;
  } else if (game.pending !== null) {
    seat = game.pending.by;
  } else if (game.forced !== null) {
    seat = game.forced.at;
  } else if (game.stage === "roundEnd") {
    // Whoever is about to deal gets to say when.
    seat = nextSeat(game, game.dealer);
  } else {
    seat = game.active;
  }
  return seat;
}

/**
 * The seats an action card in hand may be pointed at.
 *
 * @param game - the current game
 * @returns the seats it could legally hit
 * @remarks
 * "Action cards can be played on any active player including yourself. If you
 * are the only active player in the round, you must play the Action card on
 * yourself." The Zweite Chance is narrower: it is being handed on **because**
 * its owner already has one, so it may only go to an active player who has
 * none - and to nobody at all if there is no such person.
 */
export function targetsFor(game: Flip7Game): readonly number[] {
  const pending = game.pending;
  let seats: readonly number[] = [];
  if (pending !== null) {
    seats =
      pending.card.kind === "second"
        ? activeSeats(game).filter(
            (seat) => seat !== pending.by && game.players[seat].second === null,
          )
        : activeSeats(game);
  }
  return seats;
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
  game: Flip7Game,
  seat: number,
  move: Flip7Move,
): Flip7Game | null {
  let next: Flip7Game | null = null;
  if (seat >= 0 && seat < game.players.length && game.stage !== "gameOver") {
    switch (move.kind) {
      case "hit":
        next = hit(game, seat);
        break;
      case "stay":
        next = stay(game, seat);
        break;
      case "target":
        next = pointAt(game, seat, move.at);
        break;
      case "flip":
        next = flipOne(game, seat);
        break;
      case "next":
        next = nextRound(game, seat);
        break;
    }
  }
  return next;
}

/**
 * Takes one card, and lives with it.
 *
 * @remarks
 * One card, and then the next player. That is the reading of "the Dealer offers
 * each player **in turn** the option to Hit or Stay", and of the worked example
 * that ends "if they choose to Stay **next time**". It is also what makes an
 * Einfrieren worth holding: you get to use it between somebody else's draws.
 *
 * The turn is handed on straight away, before the card has finished resolving.
 * That is deliberate - drawing an action card does not buy you another go, and
 * pointing it is something you do after your turn is over.
 */
function hit(game: Flip7Game, seat: number): Flip7Game | null {
  const free =
    game.stage === "turn" &&
    game.pending === null &&
    game.forced === null &&
    game.active === seat &&
    isActive(game.players[seat]);
  return free ? advance(passTurn(deal(game, seat, false))) : null;
}

/**
 * Stops, and banks whatever is in front of them.
 *
 * @remarks
 * "You may Stay as long as you have a card in front of you." Which is not
 * pedantry: a player whose only card was a Zweite Chance they had to hand on has
 * nothing to bank, and has to take a card whether they like it or not.
 */
function stay(game: Flip7Game, seat: number): Flip7Game | null {
  const player = game.players[seat];
  const free =
    game.stage === "turn" &&
    game.pending === null &&
    game.forced === null &&
    game.active === seat &&
    isActive(player) &&
    cardCount(player) > 0;
  return free
    ? advance(
        passTurn(
          note(
            withPlayer(game, seat, { standing: "stayed" }),
            `${player.name}: Stopp mit ${roundValue(player, false)}.`,
          ),
        ),
      )
    : null;
}

/** Points an action card at somebody. */
function pointAt(game: Flip7Game, seat: number, at: number): Flip7Game | null {
  const pending = game.pending;
  return pending !== null &&
    pending.by === seat &&
    targetsFor(game).includes(at)
    ? advance(resolveAction({ ...game, pending: null }, pending.card, at))
    : null;
}

/** Turns over one of the three a Dreimal is making somebody take. */
function flipOne(game: Flip7Game, seat: number): Flip7Game | null {
  const forced = game.forced;
  return forced !== null && forced.at === seat && forced.left > 0
    ? advance(
        deal(
          { ...game, forced: { ...forced, left: forced.left - 1 } },
          seat,
          true,
        ),
      )
    : null;
}

/** Deals the next round. */
function nextRound(game: Flip7Game, seat: number): Flip7Game | null {
  return game.stage === "roundEnd" && seatOnTurn(game) === seat
    ? advance(openRound(game))
    : null;
}

// ----------------------------------------------------------- the one moment

/**
 * A card lands in front of somebody.
 *
 * @param game - the game
 * @param seat - who gets it
 * @param forced - true while a Dreimal is doing the dealing
 * @returns the game after the card has had its effect
 */
function deal(game: Flip7Game, seat: number, forced: boolean): Flip7Game {
  const drawn = draw(game);
  return drawn.card === null
    ? drawn.game
    : giveCard(drawn.game, seat, drawn.card, forced);
}

/**
 * What one card does to the player it lands in front of.
 *
 * @remarks
 * The `forced` flag changes exactly one thing, and it is a rule rather than a
 * convenience: an Einfrieren or Dreimal turned up in the middle of a Dreimal is
 * **held back** until the three are done. A Zweite Chance is not - the rulebook
 * lets that one be used at once, and it has to be, because the card it saves you
 * from may be the very next of the three.
 */
function giveCard(
  game: Flip7Game,
  seat: number,
  card: Card,
  forced: boolean,
): Flip7Game {
  const player = game.players[seat];
  let next: Flip7Game;
  if (card.kind === "number") {
    next = takeNumber(game, seat, card);
  } else if (card.kind === "plus" || card.kind === "times") {
    next = note(
      withPlayer(game, seat, { modifiers: [...player.modifiers, card] }),
      `${player.name}: ${cardName(card)}`,
    );
  } else if (card.kind === "second" && player.second === null) {
    next = note(
      withPlayer(game, seat, { second: card }),
      `${player.name}: Zweite Chance.`,
    );
  } else if (forced && game.forced !== null) {
    // Held back until the three are over - see the note on this function.
    next = {
      ...game,
      forced: { ...game.forced, deferred: [...game.forced.deferred, card] },
    };
  } else {
    next = offer(game, card, seat);
  }
  return next;
}

/**
 * Puts an action card on the table for its owner to point.
 *
 * @remarks
 * Two cases never reach a person, and both would be a click into nothing:
 * a Zweite Chance nobody may be given goes straight to the discard, and a card
 * with only one legal victim - which the rulebook makes sure of by saying "if
 * you are the only active player you must play it on yourself" - resolves
 * itself.
 */
function offer(game: Flip7Game, card: Card, by: number): Flip7Game {
  const asked: Flip7Game = { ...game, pending: { card, by } };
  const targets = targetsFor(asked);
  let next: Flip7Game;
  if (targets.length === 0) {
    next = note(
      { ...game, discard: [...game.discard, card] },
      `${cardName(card)} kann niemand bekommen und wird abgeworfen.`,
    );
  } else if (targets.length === 1) {
    next = resolveAction(game, card, targets[0]);
  } else {
    next = asked;
  }
  return next;
}

/**
 * A number card lands, and either fits or finishes somebody.
 *
 * @remarks
 * Three outcomes, in the order the rulebook puts them. A duplicate is the end of
 * your round, unless a Zweite Chance is lying there - and then **both** cards
 * go, so being saved leaves you no better off than before except still in.
 * Seven different numbers end the round for the whole table on the spot.
 */
function takeNumber(game: Flip7Game, seat: number, card: Card): Flip7Game {
  const player = game.players[seat];
  let next: Flip7Game;
  if (!hasNumber(player, card.value)) {
    const numbers = [...player.numbers, card];
    const laid = note(
      withPlayer(game, seat, { numbers }),
      `${player.name}: ${cardName(card)}`,
    );
    next =
      numbers.length >= FLIP_SEVEN
        ? endRound(
            note(
              { ...laid, flipped: seat },
              `Flip 7! ${player.name}: Runde vorbei, +${FLIP_BONUS} Punkte.`,
            ),
          )
        : laid;
  } else if (player.second !== null) {
    next = note(
      {
        ...withPlayer(game, seat, { second: null }),
        discard: [...game.discard, player.second, card],
      },
      `${player.name}: ${cardName(card)} doppelt - die Zweite Chance rettet.`,
    );
  } else {
    // The three of a Dreimal stop the moment their victim is out, and the cards
    // it was holding back are never played: "but only if the player hasn't
    // busted".
    next = note(
      {
        ...withPlayer(game, seat, {
          standing: "busted",
          numbers: [...player.numbers, card],
        }),
        discard: [...game.discard, ...(game.forced?.deferred ?? [])],
        forced: null,
      },
      `${player.name}: ${cardName(card)} doppelt - raus.`,
    );
  }
  return next;
}

/** What an action card does once it has been pointed at somebody. */
function resolveAction(game: Flip7Game, card: Card, at: number): Flip7Game {
  const victim = game.players[at];
  const cleared: Flip7Game = { ...game, pending: null };
  const spent: Flip7Game = {
    ...cleared,
    discard: [...cleared.discard, card],
  };
  let next: Flip7Game;
  if (card.kind === "freeze") {
    next = note(
      withPlayer(spent, at, { standing: "stayed" }),
      `${victim.name}: eingefroren mit ${roundValue(victim, false)}.`,
    );
  } else if (card.kind === "flip3") {
    // A Dreimal can come out of the cards a **previous** Dreimal held back, and
    // that previous one may still be holding more. The rulebook does not go
    // this deep; carrying the queue forward is the reading that keeps both the
    // order it does give ("resolved AFTER all three cards are drawn") and every
    // card in the deck.
    next = note(
      {
        ...spent,
        forced: {
          at,
          left: FLIP_THREE,
          deferred: game.forced?.deferred ?? [],
        },
      },
      `${victim.name}: dreimal ziehen.`,
    );
  } else {
    // A Zweite Chance handed on, because its owner already had one. It stays in
    // play, so it does not go to the discard.
    next = note(
      withPlayer(cleared, at, { second: card }),
      `${victim.name}: Zweite Chance dazu.`,
    );
  }
  return next;
}

// ------------------------------------------------------------ the machinery

/**
 * Runs everything that needs nobody's decision, and stops at the first that
 * does.
 *
 * @param game - the game, just after something happened
 * @returns the game at the next point where somebody has to act
 * @remarks
 * The opening deal lives in here rather than in the setup, because it can be
 * interrupted: an action card dealt as somebody's first card has to be pointed
 * at a seat before the next player gets theirs. So dealing is something the
 * referee does one card at a time, and this is what carries it along.
 */
function advance(game: Flip7Game): Flip7Game {
  let next = game;
  for (let step = 0; step < STEP_LIMIT; step++) {
    if (next.stage === "roundEnd" || next.stage === "gameOver") {
      break;
    }
    // A card already on the table waiting to be pointed comes first, always.
    // Handing over the next held-back card before this one has been dealt with
    // would drop it: there is only ever room for one card in the air.
    if (next.pending !== null) {
      break;
    }
    // A finished Dreimal hands over whatever it was holding back, one at a
    // time - and the loop comes back round to each one only once the last has
    // found a home.
    if (next.forced !== null && next.forced.left === 0) {
      const held = next.forced.deferred;
      next =
        held.length === 0
          ? { ...next, forced: null }
          : offer(
              {
                ...next,
                forced: { ...next.forced, deferred: held.slice(1) },
              },
              held[0],
              next.forced.at,
            );
      continue;
    }
    if (next.forced !== null) {
      break;
    }
    if (activeSeats(next).length === 0) {
      next = endRound(next);
      continue;
    }
    if (next.stage === "deal" && next.dealt < next.players.length) {
      const seat = (next.dealer + 1 + next.dealt) % next.players.length;
      const counted = { ...next, dealt: next.dealt + 1 };
      // A seat already out of the round - a Dreimal during the deal can do
      // that - gets nothing, but still counts as having been dealt to.
      next = isActive(next.players[seat])
        ? deal(counted, seat, false)
        : counted;
      continue;
    }
    if (next.stage === "deal") {
      next = { ...next, stage: "turn", active: next.dealer };
      continue;
    }
    // The turn may have been handed to somebody an action card has since put
    // out of the round.
    if (!isActive(next.players[next.active])) {
      const seat = firstActiveFrom(next, next.active);
      if (seat === null) {
        break;
      }
      next = { ...next, active: seat };
      continue;
    }
    break;
  }
  return next;
}

/** Hands the turn to the next seat still in the round. */
function passTurn(game: Flip7Game): Flip7Game {
  const seat = firstActiveFrom(game, game.active);
  return seat === null ? game : { ...game, active: seat };
}

/** The first seat still in, starting after this one. */
function firstActiveFrom(game: Flip7Game, from: number): number | null {
  const count = game.players.length;
  let found: number | null = null;
  for (let step = 1; step <= count && found === null; step++) {
    const seat = (from + step) % count;
    if (isActive(game.players[seat])) {
      found = seat;
    }
  }
  return found;
}

/** The seat after this one, whatever it is doing. */
function nextSeat(game: Flip7Game, from: number): number {
  return (from + 1) % game.players.length;
}

/**
 * Takes the top card, shuffling the discards back in if the deck has run out.
 *
 * @remarks
 * "When the deck runs out, shuffle all the discarded cards to form a new deck.
 * If you need to reshuffle mid-round, leave all cards in front of players where
 * they are." So the new deck is the discard pile and nothing else - whatever is
 * lying in front of somebody stays lying in front of them, busted or not.
 */
function draw(game: Flip7Game): { game: Flip7Game; card: Card | null } {
  let source = game;
  if (source.deck.length === 0 && source.discard.length > 0) {
    const random = createRandom(source.rng);
    source = note(
      {
        ...source,
        deck: shuffle(random, source.discard),
        discard: [],
        rng: random.state(),
      },
      "Der Stapel ist leer - die abgelegten Karten werden neu gemischt.",
    );
  }
  const card = source.deck[0] ?? null;
  return {
    game: card === null ? source : { ...source, deck: source.deck.slice(1) },
    card,
  };
}

// ------------------------------------------------------------------- rounds

/**
 * Adds the round up.
 *
 * @remarks
 * The cards stay where they are. Everybody has just been counting them, and
 * clearing the table before the score screen has been read would be taking the
 * evidence away - {@link openRound} sweeps them into the discard when the next
 * round is actually asked for.
 */
function endRound(game: Flip7Game): Flip7Game {
  const players = game.players.map((player, seat) => ({
    ...player,
    roundScore: roundValue(player, seat === game.flipped),
    score: player.score + roundValue(player, seat === game.flipped),
  }));
  const done = players.some((player) => player.score >= TARGET_SCORE);
  // A Flip 7 can land in the middle of a Dreimal, so the round may end with an
  // action card still in the air and more held back behind it. Those cards
  // never get played, but they still have to go somewhere: a deck that quietly
  // loses cards would go on working and slowly stop being the deck in the box.
  const stranded: Card[] = [
    ...(game.pending === null ? [] : [game.pending.card]),
    ...(game.forced?.deferred ?? []),
  ];
  return note(
    {
      ...game,
      players,
      pending: null,
      forced: null,
      discard: [...game.discard, ...stranded],
      stage: done ? "gameOver" : "roundEnd",
    },
    done
      ? `Jemand hat ${TARGET_SCORE} Punkte - das war die letzte Runde.`
      : "Runde vorbei.",
  );
}

/**
 * Deals a new round.
 *
 * @param game - a game whose last round has been added up
 * @returns the game with the opening card on its way round
 * @remarks
 * The dealer moves one seat on, which the rulebook describes as passing the deck
 * to the left. The cards of the last round go to the discard here rather than
 * back into the deck: "Do not shuffle them back into the deck." So do the Zweite
 * Chance cards, used or not, which the rulebook says twice.
 */
export function openRound(game: Flip7Game): Flip7Game {
  const dealer = nextSeat(game, game.dealer);
  const spent: Card[] = [];
  const players = game.players.map((player) => {
    spent.push(...player.numbers, ...player.modifiers);
    if (player.second !== null) {
      spent.push(player.second);
    }
    return {
      ...player,
      numbers: [],
      modifiers: [],
      second: null,
      standing: "in" as const,
    };
  });
  return note(
    {
      ...game,
      stage: "deal",
      dealer,
      active: dealer,
      dealt: 0,
      flipped: null,
      pending: null,
      forced: null,
      players,
      discard: [...game.discard, ...spent],
      round: game.round + 1,
    },
    `Runde ${game.round + 1} - Geber: ${game.players[dealer].name}.`,
  );
}

/** Starts the machinery off - used by the setup and by the online adapter. */
export function start(game: Flip7Game): Flip7Game {
  return advance(game);
}

// ------------------------------------------------------------------ helpers

/** A game with one player changed. */
function withPlayer(
  game: Flip7Game,
  seat: number,
  change: Partial<Player>,
): Flip7Game {
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
 * other name, and "Du zieht eine Karte" is not German - with a line per card
 * that wrongness would be on screen all game.
 */
function note(game: Flip7Game, line: string): Flip7Game {
  return { ...game, log: [...game.log, line] };
}

/**
 * Every move a seat could make right now.
 *
 * @param game - the current game
 * @param seat - the player asking
 * @returns the legal moves, so the screen and the computer see the same game
 */
export function legalMoves(
  game: Flip7Game,
  seat: number,
): readonly Flip7Move[] {
  const moves: Flip7Move[] = [];
  if (game.stage !== "gameOver") {
    if (game.pending !== null && game.pending.by === seat) {
      for (const at of targetsFor(game)) {
        moves.push({ kind: "target", at });
      }
    } else if (game.forced !== null && game.forced.at === seat) {
      moves.push({ kind: "flip" });
    } else if (game.stage === "roundEnd" && seatOnTurn(game) === seat) {
      moves.push({ kind: "next" });
    } else if (
      game.stage === "turn" &&
      game.pending === null &&
      game.forced === null &&
      game.active === seat &&
      isActive(game.players[seat])
    ) {
      moves.push({ kind: "hit" });
      if (cardCount(game.players[seat]) > 0) {
        moves.push({ kind: "stay" });
      }
    }
  }
  return moves;
}
