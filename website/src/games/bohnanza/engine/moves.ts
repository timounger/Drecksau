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
 * Three things shape the module, and all three come from the rulebook rather
 * than from convenience:
 *
 * 1. **A card is never destroyed.** Harvesting turns some cards onto their
 *    Taler side and puts the rest on the discard; both piles are kept, so the
 *    104 can always be counted. That is not tidiness - the game ends when the
 *    draw pile has run out three times, and it only ever runs out because
 *    Taler cards have quietly left the circle.
 * 2. **Harvesting is not a phase.** "Du darfst jederzeit im Spiel deine
 *    Bohnenfelder abernten, auch wenn du nicht die aktive Person bist." So
 *    {@link applyMove} takes a harvest from anybody at any moment, and the
 *    phases never get a say in it.
 * 3. **The end is carried, not taken.** Drawing the last card for the third
 *    time sets a flag; where the game actually stops depends on which phase
 *    that happened in, which is what {@link BohnanzaGame.ending} is for.
 */
import {
  beanName,
  coinsFor,
  maxCoins,
  toNextCoin,
  type Bean,
  type Card,
} from "./beans";
import { createRandom, shuffle } from "./random";
import {
  DRAW_PER_TURN,
  EMPTY_LIMIT,
  MAX_PLANTS,
  OFFER_LIMIT,
  REVEAL_COUNT,
  canHarvest,
  fieldBean,
  plantableFields,
  settlers,
  tradeable,
  type BohnanzaGame,
  type BohnanzaMove,
  type Offer,
  type Player,
} from "./state";

/**
 * Who the table is waiting for.
 *
 * @param game - the current game
 * @returns the seat that has to act, or null once the game is over
 * @remarks
 * Often not the active player. A proposal on the table is answered by the seat
 * it was made to, whoever that is, and Phase 3 is worked through by everybody
 * holding crosswise cards - the active player first, then round to the left.
 * The online layer asks this to know whom to hurry along, and hurrying the
 * wrong person would be worse than hurrying nobody.
 */
export function seatOnTurn(game: BohnanzaGame): number | null {
  let seat: number | null;
  if (game.phase === "gameOver") {
    seat = null;
  } else if (game.offer !== null) {
    seat = game.offer.to;
  } else if (game.phase === "settle") {
    seat = settlers(game)[0] ?? game.active;
  } else {
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
  game: BohnanzaGame,
  seat: number,
  move: BohnanzaMove,
): BohnanzaGame | null {
  let next: BohnanzaGame | null = null;
  if (seat >= 0 && seat < game.players.length && game.phase !== "gameOver") {
    switch (move.kind) {
      case "plant":
        next = plantFromHand(game, seat, move.field);
        break;
      case "done":
        next = stopPlanting(game, seat);
        break;
      case "harvest":
        next = harvest(game, seat, move.field);
        break;
      case "offer":
        next = propose(game, seat, move.to, move.give, move.want);
        break;
      case "answer":
        next = answer(game, seat, move.yes, move.cards);
        break;
      case "withdraw":
        next = withdraw(game, seat);
        break;
      case "endTrade":
        next = endTrade(game, seat);
        break;
      case "settle":
        next = plantPending(game, seat, move.card, move.field);
        break;
    }
  }
  return next;
}

// ------------------------------------------------------------------ phase 1

/**
 * Plants the front hand card.
 *
 * @remarks
 * "Du musst die vorderste Bohnenkarte, also die ganz sichtbare Karte, aus
 * deiner Hand auf einem deiner Felder anbauen. Danach darfst du eine weitere
 * Bohnenkarte, die nun ganz sichtbare Karte, auf einem deiner Felder anbauen.
 * Eine dritte Bohne darfst du nicht anbauen."
 *
 * The second card is a choice and the first is not, but both are the same move:
 * which of the two it is only decides whether {@link stopPlanting} is also
 * legal, and the phase ends by itself once there is nothing left to decide.
 */
function plantFromHand(
  game: BohnanzaGame,
  seat: number,
  field: number,
): BohnanzaGame | null {
  const player = game.players[seat];
  const card = player.hand[0];
  const allowed =
    game.phase === "plant" &&
    game.active === seat &&
    game.planted < MAX_PLANTS &&
    card !== undefined &&
    plantableFields(player, card.bean).includes(field);
  let next: BohnanzaGame | null = null;
  if (allowed) {
    const planted = note(
      {
        ...withPlayer(game, seat, {
          hand: player.hand.slice(1),
          fields: sown(player.fields, field, card),
        }),
        planted: game.planted + 1,
      },
      `${player.name}: ${beanName(card.bean)} angebaut.`,
    );
    // Nothing to decide any more: two is the ceiling, and an empty hand has
    // nothing left to offer either way.
    next =
      planted.planted >= MAX_PLANTS || planted.players[seat].hand.length === 0
        ? openTrade(planted)
        : planted;
  }
  return next;
}

/** Ends the planting phase after the one card that had to be planted. */
function stopPlanting(game: BohnanzaGame, seat: number): BohnanzaGame | null {
  const allowed =
    game.phase === "plant" &&
    game.active === seat &&
    (game.planted > 0 || game.players[seat].hand.length === 0);
  return allowed ? openTrade(game) : null;
}

// ------------------------------------------------------------------ phase 2

/**
 * Turns the two cards up and opens the trading.
 *
 * @remarks
 * "Ziehe die obersten zwei Karten vom Nachziehstapel und lege sie für alle
 * sichtbar aufgedeckt daneben. Die aufgedeckten Karten gehören dir." This is
 * the one place the third exhaustion of the draw pile is allowed to happen
 * without stopping the game on the spot - see {@link finishTurn}.
 */
function openTrade(game: BohnanzaGame): BohnanzaGame {
  let next: BohnanzaGame = { ...game, phase: "trade", revealed: [] };
  for (let card = 0; card < REVEAL_COUNT; card++) {
    const drawn = draw(next);
    next =
      drawn.card === null
        ? drawn.game
        : { ...drawn.game, revealed: [...drawn.game.revealed, drawn.card] };
  }
  const shown = next.revealed.map((card) => beanName(card.bean)).join(", ");
  return note(
    next,
    next.revealed.length === 0
      ? `${name(next, next.active)}: nichts mehr aufzudecken.`
      : `${name(next, next.active)}: ${shown} aufgedeckt.`,
  );
}

/**
 * Puts a proposal on the table.
 *
 * @remarks
 * Two rules are enforced here and nowhere else. "Nur du als aktive Person
 * darfst mit anderen handeln. Deine Mitspielenden dürfen untereinander nicht
 * handeln" - so the active player is on one side of every proposal, either as
 * the one offering or as the one being asked. And what may go into it is what
 * {@link tradeable} says: hand cards from anybody, the two face-up cards from
 * the active player, and never anything lying crosswise or on a field.
 */
function propose(
  game: BohnanzaGame,
  seat: number,
  to: number,
  give: readonly string[],
  want: readonly Bean[],
): BohnanzaGame | null {
  const offered = tradeable(game, seat).filter((card) =>
    give.includes(card.id),
  );
  const allowed =
    game.phase === "trade" &&
    game.offer === null &&
    game.offers < OFFER_LIMIT &&
    to >= 0 &&
    to < game.players.length &&
    to !== seat &&
    (seat === game.active || to === game.active) &&
    give.length > 0 &&
    new Set(give).size === give.length &&
    offered.length === give.length;
  return allowed
    ? note(
        {
          ...game,
          offers: game.offers + 1,
          offer: { from: seat, to, give: offered, want },
        },
        `${name(game, seat)} ${TO_ARROW} ${name(game, to)}: ${describe(offered)} ${
          want.length === 0
            ? "als Geschenk."
            : `für ${want.map(beanName).join(" + ")}.`
        }`,
      )
    : null;
}

/**
 * Says yes or no to the proposal on the table.
 *
 * @param game - the current game
 * @param seat - the seat the proposal was made to
 * @param yes - whether they take it
 * @param cards - which of their cards they hand over, if they take it
 * @returns the game after the answer, or null if it was not theirs to give
 * @remarks
 * "Beide beteiligten Personen müssen dem Handel zustimmen" - and that holds
 * for a gift too, which is why an empty wish list goes through exactly the same
 * door as everything else.
 *
 * Which cards go back is the answering seat's choice, not the proposer's. Cards
 * of one sort are interchangeable, but where they sit in a hand is not: giving
 * away the front one changes what you are forced to plant next turn, and that
 * is a decision worth having.
 */
function answer(
  game: BohnanzaGame,
  seat: number,
  yes: boolean,
  cards: readonly string[] | undefined,
): BohnanzaGame | null {
  const offer = game.offer;
  let next: BohnanzaGame | null = null;
  if (offer !== null && offer.to === seat) {
    if (!yes) {
      next = note({ ...game, offer: null }, `${name(game, seat)}: abgelehnt.`);
    } else {
      const back = cards ?? frontMost(game, seat, offer.want);
      next = settleTrade(game, offer, back);
    }
  }
  return next;
}

/**
 * The cards a plain "yes" hands over: the earliest of each wanted sort.
 *
 * @remarks
 * Only a default. It is the reading that makes a trade do something rather than
 * nothing - the front of the hand is what the next turn is about to force on
 * you - and anybody who wants a different card says so instead of pressing yes.
 */
function frontMost(
  game: BohnanzaGame,
  seat: number,
  want: readonly Bean[],
): readonly string[] {
  const pool = [...tradeable(game, seat)];
  const picked: string[] = [];
  for (const bean of want) {
    const at = pool.findIndex((card) => card.bean === bean);
    if (at >= 0) {
      picked.push(pool[at].id);
      pool.splice(at, 1);
    }
  }
  return picked;
}

/**
 * Carries out an accepted trade.
 *
 * @remarks
 * "Bohnenkarten, die du nach einem Handel erhältst, legst du zunächst quer
 * neben deinen Feldern ab. Auf die Hand nehmen darfst du sie nicht." Both sides
 * of the trade land in {@link Player.pending}, and Phase 3 is what gets them
 * into the ground.
 */
function settleTrade(
  game: BohnanzaGame,
  offer: Offer,
  back: readonly string[],
): BohnanzaGame | null {
  const wanted = offer.give.map((card) => card.id);
  // Re-read from the pool rather than trusting the offer: it has been lying on
  // the table while other things happened, and a card that has left its owner's
  // hand since must not be handed over a second time.
  const mine = tradeable(game, offer.from).filter((card) =>
    wanted.includes(card.id),
  );
  const theirs = tradeable(game, offer.to).filter((card) =>
    back.includes(card.id),
  );
  const asked = [...offer.want].sort();
  const brought = theirs.map((card) => card.bean).sort();
  const valid =
    mine.length === offer.give.length &&
    theirs.length === back.length &&
    new Set(back).size === back.length &&
    asked.length === brought.length &&
    asked.every((bean, at) => bean === brought[at]);
  let next: BohnanzaGame | null = null;
  if (valid) {
    const stripped = handOver(
      handOver(game, offer.from, mine),
      offer.to,
      theirs,
    );
    next = note(
      {
        ...withPending(
          withPending(stripped, offer.to, mine),
          offer.from,
          theirs,
        ),
        offer: null,
      },
      `${name(game, offer.to)}: Handel angenommen.`,
    );
  }
  return next;
}

/** Takes the named cards out of a seat's hand and off the face-up pair. */
function handOver(
  game: BohnanzaGame,
  seat: number,
  cards: readonly Card[],
): BohnanzaGame {
  const ids = cards.map((card) => card.id);
  return {
    ...withPlayer(game, seat, {
      hand: game.players[seat].hand.filter((card) => !ids.includes(card.id)),
    }),
    revealed: game.revealed.filter((card) => !ids.includes(card.id)),
  };
}

/** Lays cards crosswise beside a seat's fields. */
function withPending(
  game: BohnanzaGame,
  seat: number,
  cards: readonly Card[],
): BohnanzaGame {
  return withPlayer(game, seat, {
    pending: [...game.players[seat].pending, ...cards],
  });
}

/** Takes back a proposal nobody has answered. */
function withdraw(game: BohnanzaGame, seat: number): BohnanzaGame | null {
  return game.offer !== null && game.offer.from === seat
    ? note(
        { ...game, offer: null },
        `${name(game, seat)}: Angebot zurückgezogen.`,
      )
    : null;
}

/**
 * Ends the trading and moves everything left over into Phase 3.
 *
 * @remarks
 * "Als aktive Person musst du auch die aufgedeckten Karten anbauen, falls du
 * nicht mit ihnen gehandelt hast." Whatever is still lying face up joins the
 * crosswise pile, and from there it is planted like anything else - which is
 * why Phase 3 needs to know about only one kind of card and not two.
 */
function endTrade(game: BohnanzaGame, seat: number): BohnanzaGame | null {
  return game.phase === "trade" && game.active === seat && game.offer === null
    ? advance({
        ...withPending(game, seat, game.revealed),
        revealed: [],
        phase: "settle",
      })
    : null;
}

// ------------------------------------------------------------------ phase 3

/** Plants one of the cards lying crosswise. */
function plantPending(
  game: BohnanzaGame,
  seat: number,
  cardId: string,
  field: number,
): BohnanzaGame | null {
  const player = game.players[seat];
  const card = player.pending.find((held) => held.id === cardId);
  const allowed =
    game.phase === "settle" &&
    seatOnTurn(game) === seat &&
    card !== undefined &&
    plantableFields(player, card.bean).includes(field);
  return allowed && card !== undefined
    ? advance(
        note(
          withPlayer(game, seat, {
            pending: player.pending.filter((held) => held.id !== cardId),
            fields: sown(player.fields, field, card),
          }),
          `${player.name}: ${beanName(card.bean)} angebaut.`,
        ),
      )
    : null;
}

// ------------------------------------------------------------- the harvest

/**
 * Harvests one field.
 *
 * @param game - the current game
 * @param seat - whose field
 * @param field - which one
 * @returns the game after the harvest, or null if it was not allowed
 * @remarks
 * Legal in every phase and for every seat, because the rulebook says so: "Du
 * darfst jederzeit im Spiel deine Bohnenfelder abernten, auch wenn du nicht die
 * aktive Person bist." The only thing that ever forbids it is the
 * Bohnenschutzregel, which {@link canHarvest} holds.
 *
 * Which cards become Taler does not matter - they are all the same sort - so
 * the first ones go, and the rest are discarded face up. Both piles are kept:
 * the discard is what the next reshuffle is made of, and the Taler cards are
 * the reason there is a last reshuffle at all.
 */
function harvest(
  game: BohnanzaGame,
  seat: number,
  field: number,
): BohnanzaGame | null {
  const player = game.players[seat];
  let next: BohnanzaGame | null = null;
  if (game.phase !== "gameOver" && canHarvest(player, field)) {
    const cards = player.fields[field];
    const bean = cards[0].bean;
    const coins = coinsFor(bean, cards.length);
    next = note(
      {
        ...withPlayer(game, seat, {
          coins: player.coins + coins,
          fields: player.fields.map((old, at) => (at === field ? [] : old)),
        }),
        spent: [...game.spent, ...cards.slice(0, coins)],
        discard: [...game.discard, ...cards.slice(coins)],
      },
      `${player.name}: ${cards.length}x ${beanName(bean)} geerntet - ${
        coins === 1 ? "1 Taler" : `${coins} Taler`
      }.`,
    );
  }
  return next;
}

// ------------------------------------------------------------- the machinery

/**
 * Runs everything that needs nobody's decision.
 *
 * @param game - the game, just after something happened
 * @returns the game at the next point where somebody has to act
 * @remarks
 * There are only two such moments in Bohnanza, and both are somebody running
 * out of something: a Phase 1 with an empty hand ("Hast du zu Beginn der 1.
 * Phase keine Karten auf der Hand, gehst du gleich zur 2. Phase ueber"), and a
 * Phase 3 with nothing left lying crosswise.
 */
function advance(game: BohnanzaGame): BohnanzaGame {
  let next = game;
  if (next.phase === "plant" && next.players[next.active].hand.length === 0) {
    next = openTrade(next);
  }
  if (next.phase === "settle" && settlers(next).length === 0) {
    next = finishTurn(next);
  }
  return next;
}

/**
 * The fourth phase, and the moment the game may stop.
 *
 * @remarks
 * "Ziehe als aktive Person nacheinander drei Karten vom Nachziehstapel. Stecke
 * sie, ohne die Reihenfolge zu ändern, hinter deine letzte Handkarte."
 *
 * If the third exhaustion happened back in Phase 2, there is nothing to draw:
 * the game has been finishing since then, and Phases 2 and 3 were the last
 * thing it owed anybody.
 */
function finishTurn(game: BohnanzaGame): BohnanzaGame {
  let next = game;
  if (!next.ending) {
    for (let card = 0; card < DRAW_PER_TURN; card++) {
      const drawn = draw(next);
      next =
        drawn.card === null
          ? drawn.game
          : withPlayer(drawn.game, drawn.game.active, {
              hand: [...drawn.game.players[drawn.game.active].hand, drawn.card],
            });
    }
  }
  return next.ending ? endGame(next) : openTurn(next);
}

/** Hands the turn to the player on the left. */
function openTurn(game: BohnanzaGame): BohnanzaGame {
  const active = (game.active + 1) % game.players.length;
  return advance({
    ...game,
    active,
    phase: "plant",
    planted: 0,
    offers: 0,
    offer: null,
    revealed: [],
    turn: game.turn + 1,
  });
}

/**
 * Everybody harvests, and the Taler are counted.
 *
 * @remarks
 * "Jede Person erntet noch ihre Bohnenfelder und erhält gegebenenfalls dafür
 * Bohnentaler. Die Karten auf der Hand zählen nicht mehr." The
 * Bohnenschutzregel is not consulted: it governs a harvest somebody chooses,
 * and this one nobody chooses.
 */
function endGame(game: BohnanzaGame): BohnanzaGame {
  const spent: Card[] = [];
  const discard: Card[] = [];
  const players = game.players.map((player) => {
    let coins = player.coins;
    for (const field of player.fields) {
      const bean = fieldBean(field);
      const paid = bean === null ? 0 : coinsFor(bean, field.length);
      coins += paid;
      spent.push(...field.slice(0, paid));
      discard.push(...field.slice(paid));
    }
    return { ...player, coins, fields: player.fields.map(() => []) };
  });
  return note(
    {
      ...game,
      players,
      spent: [...game.spent, ...spent],
      discard: [...game.discard, ...discard],
      revealed: [],
      offer: null,
      phase: "gameOver",
    },
    "Alle ernten ihre Felder ab - das Spiel ist vorbei.",
  );
}

/**
 * Takes the top card, and counts the pile running out.
 *
 * @param game - the game
 * @returns the game and the card, or null when there is nothing left at all
 * @remarks
 * "Ziehst du die letzte Karte vom Nachziehstapel, dann mische die Karten des
 * Ablagestapels" - so the pile runs out at the moment its last card is taken,
 * not when somebody reaches for a card that is not there. The third time that
 * happens the discard is **not** shuffled back, and the game starts finishing.
 */
function draw(game: BohnanzaGame): {
  readonly game: BohnanzaGame;
  readonly card: Card | null;
} {
  const card = game.deck[0] ?? null;
  let next = game;
  if (card !== null) {
    next = { ...next, deck: next.deck.slice(1) };
    if (next.deck.length === 0) {
      const emptied = next.emptied + 1;
      next =
        emptied >= EMPTY_LIMIT
          ? note(
              { ...next, emptied, ending: true },
              "Der Nachziehstapel ist zum dritten Mal leer - das Spiel endet.",
            )
          : reshuffle({ ...next, emptied });
    }
  }
  return { game: next, card };
}

/**
 * Makes a new draw pile out of the discard.
 *
 * @remarks
 * A discard with nothing in it ends the game as surely as the third exhaustion
 * does. It cannot happen in a game that has been played properly - Taler cards
 * leave slowly enough - but a table that cannot draw and cannot be told to stop
 * would sit there for ever, and that is the one outcome worth ruling out.
 */
function reshuffle(game: BohnanzaGame): BohnanzaGame {
  const random = createRandom(game.rng);
  return game.discard.length === 0
    ? note(
        { ...game, ending: true },
        "Es sind keine Karten mehr da - das Spiel endet.",
      )
    : note(
        {
          ...game,
          deck: shuffle(random, game.discard),
          discard: [],
          rng: random.state(),
        },
        "Der Ablagestapel wird gemischt und ist der neue Nachziehstapel.",
      );
}

/** Starts the machinery off - used by the setup and by the online adapter. */
export function start(game: BohnanzaGame): BohnanzaGame {
  return advance(game);
}

// ------------------------------------------------------------------ helpers

/** The fields with one card added to one of them. */
function sown(
  fields: readonly (readonly Card[])[],
  field: number,
  card: Card,
): readonly (readonly Card[])[] {
  return fields.map((old, at) => (at === field ? [...old, card] : old));
}

/** A game with one player changed. */
function withPlayer(
  game: BohnanzaGame,
  seat: number,
  change: Partial<Player>,
): BohnanzaGame {
  return {
    ...game,
    players: game.players.map((player, at) =>
      at === seat ? { ...player, ...change } : player,
    ),
  };
}

/** What a seat is called. */
function name(game: BohnanzaGame, seat: number): string {
  return game.players[seat]?.name ?? "";
}

/**
 * What separates the two names of a trade line in the log.
 *
 * @remarks
 * An arrow rather than a preposition, and the reason is the seat called "Du".
 * German wants a dative there - "bietet dir" - and a line built from a name
 * cannot know that the name it was handed is a pronoun. An arrow is true of
 * every name at the table.
 */
const TO_ARROW = "\u{2192}";

/** A handful of cards written out as sorts, for the log. */
function describe(cards: readonly Card[]): string {
  return cards.map((card) => beanName(card.bean)).join(" + ");
}

/**
 * Adds a line to the log.
 *
 * @remarks
 * A name, a colon, and what happened - never a sentence with a verb in it. The
 * seat you play yourself is called "Du" when it has no other name, and "Du baut
 * an" is not German. With a line per card that wrongness would be on screen all
 * game, so the lines are labels: "Du: Feuerbohne angebaut."
 */
function note(game: BohnanzaGame, line: string): BohnanzaGame {
  return { ...game, log: [...game.log, line] };
}

/**
 * Every move a seat could make right now.
 *
 * @param game - the current game
 * @param seat - the player asking
 * @returns the legal moves, so the screen and the computer see the same game
 * @remarks
 * Proposals are left out on purpose. Every subset of a hand crossed with every
 * wish list is not a list anybody wants enumerated, and neither the screen nor
 * the computer builds one that way - they build one offer and ask the referee.
 * Everything else in this game is a short list, and that is what comes back.
 */
export function legalMoves(
  game: BohnanzaGame,
  seat: number,
): readonly BohnanzaMove[] {
  const moves: BohnanzaMove[] = [];
  const player = game.players[seat];
  if (game.phase !== "gameOver") {
    // Harvesting answers to no phase and to no turn order.
    player.fields.forEach((unused, field) => {
      if (canHarvest(player, field)) {
        moves.push({ kind: "harvest", field });
      }
    });
    if (game.offer !== null && game.offer.to === seat) {
      moves.push({ kind: "answer", yes: true });
      moves.push({ kind: "answer", yes: false });
    } else if (game.offer !== null && game.offer.from === seat) {
      moves.push({ kind: "withdraw" });
    } else if (game.phase === "plant" && game.active === seat) {
      const card = player.hand[0];
      if (card !== undefined && game.planted < MAX_PLANTS) {
        for (const field of plantableFields(player, card.bean)) {
          moves.push({ kind: "plant", field });
        }
      }
      if (game.planted > 0 || player.hand.length === 0) {
        moves.push({ kind: "done" });
      }
    } else if (game.phase === "trade" && game.active === seat) {
      moves.push({ kind: "endTrade" });
    } else if (game.phase === "settle" && seatOnTurn(game) === seat) {
      for (const card of player.pending) {
        for (const field of plantableFields(player, card.bean)) {
          moves.push({ kind: "settle", card: card.id, field });
        }
      }
    }
  }
  return moves;
}

/**
 * Whether this seat has to harvest before it can go on.
 *
 * @param game - the current game
 * @param seat - the player asking
 * @returns true when a card is waiting that fits none of their fields
 * @remarks
 * "Musst du eine Bohnensorte anbauen, hast aber kein Feld dafür zur Verfügung,
 * musst du zuerst ein Feld abernten." Worth naming, because it is the one
 * moment where the screen has to explain why the only thing on offer is a
 * harvest - and because a player who has just been handed a bean they cannot
 * use deserves to be told that rather than left to work it out.
 */
export function mustHarvest(game: BohnanzaGame, seat: number): boolean {
  const moves = legalMoves(game, seat);
  return (
    seatOnTurn(game) === seat &&
    moves.length > 0 &&
    moves.every((move) => move.kind === "harvest")
  );
}

/**
 * What a field would be worth, and what it still wants.
 *
 * @param bean - the sort growing there
 * @param count - how many cards are on it
 * @returns the Taler now, the Taler still reachable, and the cards to the next
 * @remarks
 * The three numbers a player actually weighs when deciding whether to harvest,
 * in one place so the screen and the computer weigh the same ones.
 */
export function fieldWorth(
  bean: Bean,
  count: number,
): {
  readonly coins: number;
  readonly best: number;
  readonly toNext: number | null;
} {
  return {
    coins: coinsFor(bean, count),
    best: maxCoins(bean),
    toNext: toNextCoin(bean, count),
  };
}
