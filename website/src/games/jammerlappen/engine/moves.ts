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
 * Two things about this game shape the module. The first is that **a move may
 * come from a seat whose turn it is not**: Zwischenschmeißen lets anybody who
 * can finish the quartet of the card just laid get in before the next player.
 * So {@link applyMove} does not begin by checking whose turn it is - it asks
 * what the pot looks like, which is what decides it at a real table too.
 *
 * The second is that what a card has to beat is **not** simply the top of the
 * pot. Action cards lie on top without saying anything about height, so the
 * requirement is the last *number* card under them - which is the whole content
 * of "Dein Problem!", a card that does nothing except leave that number to the
 * next player. {@link topValue} is that rule, and everything asks it rather
 * than looking at the pot itself.
 */
import { cardName, TURNING_VALUE, type ActionKind, type Card } from "./cards";
import {
  ACTION_STREAK,
  HAND_SIZE,
  filled,
  freedSlots,
  isOut,
  stillIn,
  type JammerlappenGame,
  type JammerlappenMove,
  type Player,
} from "./state";

/** Where the cards of one lay came from. */
type Zone = "hand" | "up";

/** A lay, once the referee has worked out what it is. */
type Lay =
  | { readonly kind: "numbers"; readonly value: number }
  | { readonly kind: "action"; readonly action: ActionKind };

/** Cards lifted out of a hand or an open row, ready to go down. */
type Taken = { readonly zone: Zone; readonly cards: readonly Card[] };

/** What the pot did, and who plays next. */
type Outcome = {
  readonly game: JammerlappenGame;
  /**
   * Seats to move on - 0 leaves the turn where it is.
   *
   * @remarks
   * Zero is how "du beginnst von vorn mit einer Karte deiner Wahl" is said, and
   * two is Aussetzen. Both go through the same seat walk, which is why a table
   * down to two players needs no special case: skipping the only other player
   * hands the turn straight back, and turning the direction round between two
   * seats changes nothing at all.
   */
  readonly steps: number;
};

/**
 * Who the table is waiting for.
 *
 * @param game - the current game
 * @returns the seat holding things up, or null once the round is over
 * @remarks
 * Not always the player whose turn it is. Before the first card everybody owes
 * an answer to the swap, so the seat named is the first that has not given one.
 * The online layer asks this for one reason - whom to hurry along, and whom to
 * play for when they never answer.
 */
export function seatOnTurn(game: JammerlappenGame): number | null {
  let seat: number | null = null;
  if (game.phase === "swap") {
    const owing = game.players.findIndex((player) => !player.ready);
    seat = owing >= 0 ? owing : game.active;
  } else if (game.phase !== "gameOver") {
    seat = game.active;
  }
  return seat;
}

/**
 * The number the next card has to beat.
 *
 * @param game - the current game
 * @returns the number in force, or null when anything may be laid
 * @remarks
 * The last **number** card in the pot, not the last card. Action cards lie on
 * top of it without replacing it, which is exactly what "Dein Problem!" is
 * for - and why a pot of nothing but action cards leaves the next player as
 * free as an empty one.
 */
export function topValue(game: JammerlappenGame): number | null {
  let value: number | null = null;
  if (!game.free) {
    for (let at = game.pot.length - 1; at >= 0; at--) {
      const card = game.pot[at];
      if (card.kind === "number") {
        value = card.value;
        break;
      }
    }
  }
  return value;
}

/**
 * Whether a number may go down now.
 *
 * @param game - the current game
 * @param value - the number on the card
 * @returns true if it is high enough - or, after a 5, low enough
 * @remarks
 * Equal is always allowed, in both directions: "Auf eine 5 darf also auch eine
 * weitere 5 gelegt werden."
 */
export function canPlayValue(game: JammerlappenGame, value: number): boolean {
  const top = topValue(game);
  return top === null || (game.descending ? value <= top : value >= top);
}

/**
 * Whether this card may go down now.
 *
 * @param game - the current game
 * @param card - the card
 * @returns true if laying it would be legal
 * @remarks
 * "Aktionskarten dürfen immer gelegt werden" - so they never even ask.
 */
export function canPlayCard(game: JammerlappenGame, card: Card): boolean {
  return card.kind === "action"
    ? true
    : card.kind === "number" && canPlayValue(game, card.value);
}

/**
 * The run of equal numbers lying on top of the pot.
 *
 * @param game - the current game
 * @returns the number and how many of it are up there, or null for none
 * @remarks
 * Only an unbroken run counts: "alle vier Karten der gleichen Sorte
 * hintereinander gelegt". An action card thrown in between ends the run, and
 * the four sevens either side of it are not a quartet.
 */
export function topRun(
  game: JammerlappenGame,
): { readonly value: number; readonly length: number } | null {
  const top = game.pot[game.pot.length - 1];
  let run: { value: number; length: number } | null = null;
  if (top !== undefined && top.kind === "number") {
    let length = 0;
    for (let at = game.pot.length - 1; at >= 0; at--) {
      const card = game.pot[at];
      if (card.kind !== "number" || card.value !== top.value) {
        break;
      }
      length++;
    }
    run = { value: top.value, length };
  }
  return run;
}

/**
 * The cards this seat could throw in out of turn.
 *
 * @param game - the current game
 * @param seat - the seat asking
 * @returns the card ids that would finish the quartet, or null if it cannot
 * @remarks
 * The screen and the computer both ask this, so neither can be offered a
 * Zwischenschmeiß the referee would turn down. Action cards never appear here:
 * "Aktionskarten können nicht zwischengeschmissen werden, da es von keiner
 * Aktionskarte ein Quartett gibt."
 */
export function jumpInIds(
  game: JammerlappenGame,
  seat: number,
): readonly string[] | null {
  const player = game.players[seat];
  const run = topRun(game);
  let ids: readonly string[] | null = null;
  if (
    game.phase === "play" &&
    seat !== game.active &&
    player !== undefined &&
    player.place === null &&
    run !== null &&
    run.length < game.copies
  ) {
    const need = game.copies - run.length;
    const source = player.hand.length > 0 ? player.hand : filled(player.up);
    const matches = source.filter(
      (card) => card.kind === "number" && card.value === run.value,
    );
    ids =
      matches.length >= need
        ? matches.slice(0, need).map((card) => card.id)
        : null;
  }
  return ids;
}

/**
 * The open cards this seat may lay right now.
 *
 * @param game - the current game
 * @param player - the player
 * @returns the open cards that would be legal, empty while the hand is not
 * @remarks
 * Empty while any hand card is left, and deliberately: "Hältst du Karten auf
 * der Hand, darfst du deine Tischkarten nicht spielen!"
 */
export function playableUp(
  game: JammerlappenGame,
  player: Player,
): readonly Card[] {
  return player.hand.length > 0
    ? []
    : filled(player.up).filter((card) => canPlayCard(game, card));
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
  game: JammerlappenGame,
  seat: number,
  move: JammerlappenMove,
): JammerlappenGame | null {
  let next: JammerlappenGame | null = null;
  if (seat >= 0 && seat < game.players.length && game.phase !== "gameOver") {
    switch (move.kind) {
      case "swap":
        next = swapCard(game, seat, move.handId, move.upId);
        break;
      case "ready":
        next = markReady(game, seat);
        break;
      case "play":
        next = playCards(game, seat, move.cardIds);
        break;
      case "playDown":
        next = playDown(game, seat, move.slot);
        break;
      case "takePot":
        next = takePot(game, seat);
        break;
    }
  }
  return next;
}

// ------------------------------------------------------------ before the game

/**
 * Trades one hand card for one open card, once.
 *
 * @remarks
 * The covered cards are not part of it - "die verdeckten Karten dürfen jedoch
 * nicht getauscht oder betrachtet werden" - and the swap is what marks this
 * seat ready, because there is only ever one of them.
 */
function swapCard(
  game: JammerlappenGame,
  seat: number,
  handId: string,
  upId: string,
): JammerlappenGame | null {
  const player = game.players[seat];
  const fromHand = player.hand.find((card) => card.id === handId);
  const slot = player.up.findIndex((card) => card?.id === upId);
  const fromTable = slot < 0 ? null : player.up[slot];
  let next: JammerlappenGame | null = null;
  if (
    game.phase === "swap" &&
    !player.ready &&
    fromHand !== undefined &&
    fromTable !== null
  ) {
    const swapped = withPlayer(game, seat, {
      hand: [...player.hand.filter((card) => card.id !== handId), fromTable],
      up: player.up.map((card, at) => (at === slot ? fromHand : card)),
      ready: true,
    });
    next = openPlay(note(swapped, `${player.name}: getauscht.`));
  }
  return next;
}

/** Keeps what was dealt. */
function markReady(
  game: JammerlappenGame,
  seat: number,
): JammerlappenGame | null {
  const player = game.players[seat];
  return game.phase !== "swap" || player.ready
    ? null
    : openPlay(
        note(
          withPlayer(game, seat, { ready: true }),
          `${player.name}: nicht getauscht.`,
        ),
      );
}

/** Starts the round once the last swap has been answered. */
function openPlay(game: JammerlappenGame): JammerlappenGame {
  return game.players.every((player) => player.ready)
    ? note(
        { ...game, phase: "play" },
        `Es geht los - Anwurf: ${game.players[game.active].name}.`,
      )
    : game;
}

// -------------------------------------------------------------- laying cards

/**
 * Lays cards from the hand or from the open row.
 *
 * @remarks
 * Three moves at the table, one move here, told apart by who is asking:
 *
 * - the player on turn laying a legal card, or every copy of it at once,
 * - the player on turn who has run out of hand cards, has nothing open that
 *   fits and must lay one anyway - "und sie gemeinsam mit dem Pot auf die Hand
 *   nehmen",
 * - anybody else finishing the quartet of the card just laid.
 */
function playCards(
  game: JammerlappenGame,
  seat: number,
  cardIds: readonly string[],
): JammerlappenGame | null {
  const player = game.players[seat];
  const taken = takeFrom(player, cardIds);
  const lay = taken === null ? null : layOf(taken.cards);
  let next: JammerlappenGame | null = null;
  if (taken !== null && lay !== null && player.place === null) {
    const stripped = removeFrom(game, seat, taken.zone, cardIds);
    if (seat !== game.active) {
      next = throwIn(game, stripped, seat, taken, lay);
    } else if (game.phase !== "play") {
      next = null;
    } else if (legalLay(game, lay)) {
      next = resolve(
        note(
          topUp(pushPot(stripped, taken.cards), seat),
          layLine(player.name, taken.cards),
        ),
        seat,
        lay,
      );
    } else {
      next = forcedLay(game, stripped, seat, taken);
    }
  }
  return next;
}

/** Whether the player on turn may lay this. */
function legalLay(game: JammerlappenGame, lay: Lay): boolean {
  return lay.kind === "action" || canPlayValue(game, lay.value);
}

/**
 * Somebody who is not on turn finishing the quartet.
 *
 * @remarks
 * Nothing else gets through here. The cards have to be exactly the ones {@link
 * jumpInIds} would have named, so an out-of-turn move cannot be used to lay
 * whatever a client likes.
 */
function throwIn(
  game: JammerlappenGame,
  stripped: JammerlappenGame,
  seat: number,
  taken: Taken,
  lay: Lay,
): JammerlappenGame | null {
  const wanted = jumpInIds(game, seat);
  const same =
    wanted !== null &&
    wanted.length === taken.cards.length &&
    wanted.every((id) => taken.cards.some((card) => card.id === id));
  let next: JammerlappenGame | null = null;
  if (same && lay.kind === "numbers") {
    const name = game.players[seat].name;
    const thrown = topUp(
      pushPot({ ...stripped, active: seat }, taken.cards),
      seat,
    );
    next = resolve(
      note(thrown, `${name}: zwischengeschmissen - ${cardsLine(taken.cards)}`),
      seat,
      lay,
    );
  }
  return next;
}

/**
 * The open card nobody wants to lay, laid because the rules say it must be.
 *
 * @remarks
 * Only when there is genuinely no way out: the hand is empty and not one open
 * card fits. The card does not go on the pot - it goes onto its owner's hand
 * together with everything that was in it.
 */
function forcedLay(
  game: JammerlappenGame,
  stripped: JammerlappenGame,
  seat: number,
  taken: Taken,
): JammerlappenGame | null {
  const player = game.players[seat];
  const stuck =
    taken.zone === "up" &&
    taken.cards.length === 1 &&
    playableUp(game, player).length === 0;
  return stuck
    ? swallow(
        stripped,
        seat,
        taken.cards,
        `${player.name}: ${cardName(taken.cards[0])} gelegt, Pot dazu`,
      )
    : null;
}

/**
 * Turns over a covered card and takes what comes.
 *
 * @remarks
 * "Die verdeckten Karten müssen immer blind gespielt werden und dürfen vorher
 * nicht betrachtet werden." The move names a slot, never a card - there is no
 * way to ask for a particular one, because there is no way to know.
 */
function playDown(
  game: JammerlappenGame,
  seat: number,
  slot: number,
): JammerlappenGame | null {
  const player = game.players[seat];
  const card = player.down[slot] ?? null;
  let next: JammerlappenGame | null = null;
  if (
    game.phase === "play" &&
    game.active === seat &&
    player.hand.length === 0 &&
    freedSlots(player).includes(slot) &&
    card !== null
  ) {
    const turned = note(
      withPlayer(game, seat, {
        down: player.down.map((entry, at) => (at === slot ? null : entry)),
      }),
      `${player.name}: blind ${cardName(card)}`,
    );
    const lay = layOf([card]);
    next =
      lay !== null && legalLay(game, lay)
        ? resolve(topUp(pushPot(turned, [card]), seat), seat, lay)
        : swallow(turned, seat, [card], "Reicht nicht - Pot dazu.");
  }
  return next;
}

/**
 * Takes the pot on purpose.
 *
 * @remarks
 * Allowed while there are still hand cards, which is where the rulebook's own
 * tip sits: "Manchmal kann es sinnvoll sein, den Pot freiwillig aufzunehmen,
 * auch wenn du eigentlich eine Karte legen könntest." Once the hand is empty
 * the way through the table cards is the only way out - and there an open card
 * that does not fit brings the pot along by itself.
 */
function takePot(
  game: JammerlappenGame,
  seat: number,
): JammerlappenGame | null {
  const player = game.players[seat];
  return game.phase === "play" &&
    game.active === seat &&
    game.pot.length > 0 &&
    player.hand.length > 0
    ? swallow(game, seat, [], `${player.name}: Pot aufgenommen.`)
    : null;
}

/**
 * Puts the pot, and anything laid with it, onto one seat's hand.
 *
 * @remarks
 * The turn then moves on and the next player starts from nothing: "Wenn das
 * passiert, beginnt der nächste Spieler von vorn und legt eine Karte seiner
 * Wahl." A pot taken also ends the downward run the 5 started.
 */
function swallow(
  game: JammerlappenGame,
  seat: number,
  extra: readonly Card[],
  line: string,
): JammerlappenGame {
  const player = game.players[seat];
  const swallowed = withPlayer(
    { ...game, pot: [], free: true, descending: false },
    seat,
    { hand: [...player.hand, ...game.pot, ...extra] },
  );
  return note(handOn(topUp(swallowed, seat), seat, 1), line);
}

// ---------------------------------------------------------- what the pot does

/**
 * Works out what the pot has just become, and passes the turn on.
 *
 * @param game - the game with the cards already lying on the pot
 * @param seat - who laid them
 * @param lay - what was laid
 * @returns the game after the card has had its effect
 */
function resolve(
  game: JammerlappenGame,
  seat: number,
  lay: Lay,
): JammerlappenGame {
  const outcome = blowsUp(game)
    ? explode(game, seat)
    : effectOf(game, seat, lay);
  return handOn(settle(outcome.game, seat), seat, outcome.steps);
}

/**
 * Whether the pot has just destroyed itself.
 *
 * @remarks
 * Two ways, and they are the same idea twice: a full quartet of one number, or
 * four action cards on the trot. Both take the pot out of the game and leave
 * whoever finished it to start again.
 *
 * The action streak stays at four even at a two-handed table, where a quartet
 * is a triplet. The reduced deck takes one of each **number** out, which is
 * what makes a quartet a triplet; it says nothing about action cards, and there
 * is no sort of action card to count three of in the first place.
 */
function blowsUp(game: JammerlappenGame): boolean {
  const run = topRun(game);
  const tail = game.pot.slice(-ACTION_STREAK);
  return (
    (run !== null && run.length >= game.copies) ||
    (tail.length === ACTION_STREAK &&
      tail.every((card) => card.kind === "action"))
  );
}

/** The pot goes out of the game and whoever finished it starts again. */
function explode(game: JammerlappenGame, seat: number): Outcome {
  return {
    game: note(burn(game), `Pot raus - Anwurf: ${game.players[seat].name}.`),
    steps: 0,
  };
}

/** Sweeps the pot out of the game and clears everything it was holding. */
function burn(game: JammerlappenGame): JammerlappenGame {
  return {
    ...game,
    pot: [],
    burned: game.burned + game.pot.length,
    free: true,
    descending: false,
  };
}

/** What a plain lay - numbers, or one action card - does to the table. */
function effectOf(game: JammerlappenGame, seat: number, lay: Lay): Outcome {
  let outcome: Outcome;
  if (lay.kind === "numbers") {
    // The 5 turns the table round, and it stays turned until somebody takes
    // the pot or a Weg damit! / Neustart! wipes the slate.
    outcome = {
      game: {
        ...game,
        free: false,
        descending: game.descending || lay.value === TURNING_VALUE,
      },
      steps: 1,
    };
  } else {
    outcome = actionOf(game, seat, lay.action);
  }
  return outcome;
}

/** What each action card does. */
function actionOf(
  game: JammerlappenGame,
  seat: number,
  action: ActionKind,
): Outcome {
  const name = game.players[seat].name;
  const plain = { ...game, free: false };
  let outcome: Outcome;
  switch (action) {
    case "problem":
      // The card that does nothing - which is the point of it. The number
      // underneath still stands, and now it is somebody else's problem.
      outcome = { game: plain, steps: 1 };
      break;
    case "reverse":
      outcome = {
        game: { ...plain, direction: game.direction === 1 ? -1 : 1 },
        steps: 1,
      };
      break;
    case "skip":
      outcome = { game: plain, steps: 2 };
      break;
    case "burn":
      outcome = {
        game: note(burn(game), `Pot weg - Anwurf: ${name}.`),
        steps: 0,
      };
      break;
    case "restart":
      // The one clean slate that leaves the pot where it is: it goes on growing
      // underneath, and so does the quartet somebody may yet complete on it.
      outcome = {
        game: { ...game, free: true, descending: false },
        steps: 1,
      };
      break;
  }
  return outcome;
}

// --------------------------------------------------------------- book-keeping

/**
 * Notes a seat as home, if it has just got rid of everything.
 *
 * @remarks
 * "Gelingt es einem Spieler, alle seine Karten (inkl. der verdeckten Karten)
 * loszuwerden, hat er es geschafft und ist nicht der Jammerlappen!" So the
 * place is recorded and the seat is skipped from then on.
 */
function settle(game: JammerlappenGame, seat: number): JammerlappenGame {
  const player = game.players[seat];
  const home = game.players.filter((entry) => entry.place !== null).length;
  return player.place === null && isOut(player)
    ? note(
        withPlayer(game, seat, { place: home }),
        `${player.name}: alle Karten los!`,
      )
    : game;
}

/**
 * Passes the turn on, or ends the round.
 *
 * @param game - the game after the move
 * @param seat - who moved
 * @param steps - seats to move on; 0 leaves the turn where it is
 * @returns the game with the next player on turn
 * @remarks
 * The round ends the moment one player is left holding cards. That player is
 * the Jammerlappen, and there is nobody left for them to play against.
 */
function handOn(
  game: JammerlappenGame,
  seat: number,
  steps: number,
): JammerlappenGame {
  const left = stillIn(game);
  let next: JammerlappenGame;
  if (left.length <= 1) {
    next = note(
      { ...game, phase: "gameOver" },
      left.length === 1
        ? `Jammerlappen: ${game.players[left[0]].name}.`
        : "Runde vorbei.",
    );
  } else {
    // A player who has just gone out cannot start again, however the pot ended.
    const moves = steps === 0 && game.players[seat].place !== null ? 1 : steps;
    next = { ...game, active: walk(game, seat, moves) };
  }
  return next;
}

/**
 * Walks round the table, skipping whoever is already home.
 *
 * @remarks
 * The two rules for a table down to two players fall out of this and need no
 * case of their own: Aussetzen walks two seats and lands back on the player who
 * laid it - "ist man noch mal dran" - and Richtungswechsel walks one seat
 * either way to the same person - "ist jeweils der Gegenspieler an der Reihe".
 */
function walk(game: JammerlappenGame, from: number, steps: number): number {
  const count = game.players.length;
  let seat = from;
  for (let step = 0; step < steps; step++) {
    let guard = 0;
    do {
      seat = (seat + game.direction + count) % count;
      guard++;
    } while (game.players[seat].place !== null && guard <= count);
  }
  return seat;
}

/**
 * Tops a hand back up to three off the draw pile.
 *
 * @remarks
 * "Jedes Mal, wenn du eine Karte abgelegt hast, musst du eine neue Karte vom
 * Aufnahmestapel nehmen, um wieder 3 Handkarten zu halten" - and no further:
 * "Hält ein Spieler mehr als 3 Karten auf der Hand, muss er nicht vom
 * Aufnahmestapel ziehen."
 */
function topUp(game: JammerlappenGame, seat: number): JammerlappenGame {
  const player = game.players[seat];
  const want = Math.max(0, HAND_SIZE - player.hand.length);
  const taken = game.draw.slice(0, want);
  return taken.length === 0
    ? game
    : withPlayer({ ...game, draw: game.draw.slice(taken.length) }, seat, {
        hand: [...player.hand, ...taken],
      });
}

// -------------------------------------------------------------------- helpers

/** The named cards, all out of one zone, or null if they are not all there. */
function takeFrom(player: Player, ids: readonly string[]): Taken | null {
  const distinct = new Set(ids).size === ids.length && ids.length > 0;
  const open = filled(player.up);
  const fromHand = ids.map((id) => player.hand.find((card) => card.id === id));
  const fromUp = ids.map((id) => open.find((card) => card.id === id));
  let taken: Taken | null = null;
  if (distinct && fromHand.every((card) => card !== undefined)) {
    taken = { zone: "hand", cards: fromHand as Card[] };
  } else if (
    distinct &&
    player.hand.length === 0 &&
    fromUp.every((card) => card !== undefined)
  ) {
    // Open cards only once the hand is empty - the order the rules insist on.
    taken = { zone: "up", cards: fromUp as Card[] };
  }
  return taken;
}

/**
 * What a set of cards adds up to as one lay.
 *
 * @returns several copies of one number, or a single action card, else null
 * @remarks
 * "Hast du mehrere gleiche Karten auf der Hand, darfst du diese gleichzeitig
 * ablegen" - which is a rule about numbers. Action cards go down one at a time:
 * they are not a sort you can hold four of, and two at once would leave it open
 * whether the table turns round once or twice.
 */
function layOf(cards: readonly Card[]): Lay | null {
  const first = cards[0];
  let lay: Lay | null = null;
  if (first !== undefined && first.kind === "action") {
    lay = cards.length === 1 ? { kind: "action", action: first.action } : null;
  } else if (first !== undefined && first.kind === "number") {
    const value = first.value;
    lay = cards.every((card) => card.kind === "number" && card.value === value)
      ? { kind: "numbers", value }
      : null;
  }
  return lay;
}

/** A game with those cards gone from one seat's hand or open row. */
function removeFrom(
  game: JammerlappenGame,
  seat: number,
  zone: Zone,
  ids: readonly string[],
): JammerlappenGame {
  const player = game.players[seat];
  return zone === "hand"
    ? withPlayer(game, seat, {
        hand: player.hand.filter((card) => !ids.includes(card.id)),
      })
    : withPlayer(game, seat, {
        up: player.up.map((card) =>
          card !== null && ids.includes(card.id) ? null : card,
        ),
      });
}

/** A game with those cards lying on the pot. */
function pushPot(
  game: JammerlappenGame,
  cards: readonly Card[],
): JammerlappenGame {
  return { ...game, pot: [...game.pot, ...cards] };
}

/** A game with one player changed. */
function withPlayer(
  game: JammerlappenGame,
  seat: number,
  change: Partial<Player>,
): JammerlappenGame {
  return {
    ...game,
    players: game.players.map((player, at) =>
      at === seat ? { ...player, ...change } : player,
    ),
  };
}

/**
 * What the log says about a lay.
 *
 * @remarks
 * A name, a colon and what happened, rather than a sentence with a verb in it.
 * The seat you play yourself is called "Du" when it has no other name, and "Du
 * legt die 7" is not German - a line per move would print that wrongness thirty
 * times a round. The label form is right for every name there is.
 */
function layLine(name: string, cards: readonly Card[]): string {
  return `${name}: ${cardsLine(cards)}`;
}

/** One card, or several of the same, as the log names them. */
function cardsLine(cards: readonly Card[]): string {
  return cards.length === 1
    ? cardName(cards[0])
    : `${cards.length} mal ${cardName(cards[0])}`;
}

/**
 * Adds a line to the log.
 *
 * @remarks
 * Every move writes at least one, which is worth keeping that way. It is what
 * the screen shows, and it is also the only thing in the state that is
 * guaranteed to keep changing once the draw pile is empty - which is what the
 * computer players count their turns by so that a table of them cannot settle
 * into passing the same cards round for ever.
 */
function note(game: JammerlappenGame, line: string): JammerlappenGame {
  return { ...game, log: [...game.log, line] };
}
