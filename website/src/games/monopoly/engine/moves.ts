/**
 * The referee: the only thing in the game that changes a game.
 *
 * @module
 * @remarks
 * One entry point, {@link applyMove}, and it returns `null` for anything it will
 * not allow. Every screen and the online layer go through it, so a client that
 * asks for something impossible is simply not answered.
 *
 * Monopoly is mostly bookkeeping, and the bookkeeping is where it goes wrong. So
 * **all money moves through one function**, {@link pay}, and that function is
 * the only place that knows what to do when somebody cannot afford something:
 * it opens a debt, and a debt stops the game until it is settled or somebody is
 * out. Nothing else in this file subtracts from a balance.
 *
 * Four things interrupt a turn and each is a field on the state rather than a
 * phase that overwrites one: a card lying face up, a property under the hammer,
 * a debt, and a trade waiting for an answer. Each has to be put back afterwards,
 * and a phase cannot put anything back.
 *
 * Every line the referee writes to the log names the player and then a colon.
 * The seat you play yourself is called "Du", and German conjugates: a sentence
 * built as "`${name} zahlt`" comes out as "Du zahlt".
 */
import {
  BOARD_SIZE,
  GO_AT,
  JAIL_AT,
  STATION_RENT,
  UTILITY_FACTOR,
  fieldAt,
  fieldsIn,
  isOwnable,
  nextStation,
  nextUtility,
  stepsTo,
} from "./board";
import { cardAt, deckOf, isPardon, type DeckId, type Effect } from "./cards";
import { NO_TOKEN, tokenOf } from "./tokens";
import { createRandom, randomInt } from "./random";
import {
  BAIL,
  BID_STEP,
  DICE_COUNT,
  DIE_FACES,
  DOUBLES_TO_JAIL,
  HOTEL,
  JAIL_TURNS,
  MAX_HOUSES,
  MORTGAGE_INTEREST,
  OPENING_BID,
  SALARY,
  SELL_BACK,
  estateAt,
  freeTokens,
  holdsGroup,
  ownedBy,
  raisable,
  stillIn,
  withRefusal,
  type MonopolyGame,
  type MonopolyMove,
} from "./state";

/** The bank, wherever a seat number is expected. */
const BANK = -1;

/**
 * Applies a move, or refuses it.
 *
 * @param game - the game as it stands
 * @param seat - the seat asking to move
 * @param move - what they want to do
 * @returns the new game, or null if the move is not allowed now
 */
export function applyMove(
  game: MonopolyGame,
  seat: number,
  move: MonopolyMove,
): MonopolyGame | null {
  const seated =
    Number.isInteger(seat) &&
    seat >= 0 &&
    seat < game.players.length &&
    !game.players[seat].bankrupt;
  let next: MonopolyGame | null = null;
  if (game.phase !== "gameOver" && seated) {
    next = route(game, seat, move);
  }
  return next;
}

/** Sends a move to whatever is entitled to answer it right now. */
function route(
  game: MonopolyGame,
  seat: number,
  move: MonopolyMove,
): MonopolyGame | null {
  let next: MonopolyGame | null = null;
  if (game.drawn !== null) {
    // A card is face up. Nothing else happens until it has been read.
    next =
      move.kind === "takeCard" && seat === game.drawn.who
        ? readCard(game)
        : null;
  } else if (game.offer !== null && seat === game.offer.to) {
    next = answerOffer(game, seat, move);
  } else if (game.phase === "auction") {
    next = bidding(game, seat, move);
  } else if (game.phase === "debt") {
    next = clearingDebt(game, seat, move);
  } else {
    next = ordinary(game, seat, move);
  }
  return next;
}

/** The moves of a turn, plus the ones anybody may make at any time. */
function ordinary(
  game: MonopolyGame,
  seat: number,
  move: MonopolyMove,
): MonopolyGame | null {
  const mine = seat === game.active;
  let next: MonopolyGame | null = null;
  switch (move.kind) {
    case "pickToken":
      next =
        mine && game.phase === "tokens"
          ? takeToken(game, seat, move.token)
          : null;
      break;
    case "roll":
      next =
        mine && (game.phase === "roll" || game.phase === "jail")
          ? throwDice(game, seat)
          : null;
      break;
    case "payBail":
      next = mine && game.phase === "jail" ? buyOut(game, seat) : null;
      break;
    case "usePardon":
      next = mine && game.phase === "jail" ? spendPardon(game, seat) : null;
      break;
    case "buy":
      next = mine && game.phase === "decide" ? buyIt(game, seat) : null;
      break;
    case "decline":
      next =
        mine && game.phase === "decide"
          ? openAuction(game, game.players[seat].at, "landed")
          : null;
      break;
    case "build":
      next = build(game, seat, move.at);
      break;
    case "sell":
      next = sellBuilding(game, seat, move.at);
      break;
    case "mortgage":
      next = mortgage(game, seat, move.at);
      break;
    case "redeem":
      next = redeem(game, seat, move.at);
      break;
    case "offer":
      next = putOffer(game, seat, move.to, move.give, move.want, move.cash);
      break;
    case "reject":
      // Withdrawing your own offer.
      next =
        game.offer !== null && game.offer.from === seat
          ? { ...game, offer: null }
          : null;
      break;
    case "endTurn":
      next = mine && game.phase === "manage" ? endTurn(game, seat) : null;
      break;
    case "resign":
      next = mine ? goBankrupt(game, seat, BANK) : null;
      break;
    default:
      next = null;
  }
  return next;
}

/**
 * The seat the table is waiting for.
 *
 * @param game - the game
 * @returns the seat that has to move, or null once the game is over
 * @remarks
 * Not always the seat whose turn it is: during an auction it is whoever has to
 * bid, during a debt it is whoever owes, and while a trade is on the table it is
 * whoever has to answer it. All three can be somebody else entirely, which is
 * the whole reason this is a function rather than a field.
 */
export function seatOnTurn(game: MonopolyGame): number | null {
  let seat: number | null = null;
  if (game.phase !== "gameOver") {
    if (game.drawn !== null) {
      seat = game.drawn.who;
    } else if (game.offer !== null) {
      seat = game.offer.to;
    } else if (game.auction !== null) {
      seat = game.auction.turn;
    } else if (game.debt !== null) {
      seat = game.debt.who;
    } else {
      seat = game.active;
    }
  }
  return seat;
}

/* ---------------------------------------------------------------- pieces */

/**
 * Takes one of the eight playing pieces.
 *
 * @remarks
 * The rulebook's very first setup step, and a phase rather than a setting
 * because that is the only shape that works in both places: against the
 * computer and in a room of six people, everybody chooses in turn out of what
 * is left. Once the last seat has one, the first player throws.
 */
function takeToken(
  game: MonopolyGame,
  seat: number,
  token: number,
): MonopolyGame | null {
  const free = freeTokens(game).includes(token);
  let next: MonopolyGame | null = null;
  if (free && game.players[seat].token === NO_TOKEN) {
    const taken = note(
      {
        ...game,
        players: withPlayer(game, seat, { token }),
      },
      `${name(game, seat)}: nimmt ${tokenOf(token).name}.`,
    );
    const waiting = taken.players.findIndex(
      (player) => player.token === NO_TOKEN && !player.bankrupt,
    );
    next =
      waiting < 0
        ? note(
            { ...taken, phase: "roll", active: stillIn(taken)[0] ?? 0 },
            "Alle Figuren stehen auf LOS. Los geht's!",
          )
        : { ...taken, active: waiting };
  }
  return next;
}

/* ------------------------------------------------------------------ dice */

/** Throws both dice and does whatever they say. */
function throwDice(game: MonopolyGame, seat: number): MonopolyGame | null {
  const random = createRandom(game.rng);
  const dice = Array.from(
    { length: DICE_COUNT },
    () => randomInt(random, DIE_FACES) + 1,
  );
  const double = dice[0] === dice[1];
  const rolled: MonopolyGame = {
    ...game,
    dice,
    rng: random.state(),
    doubles: double ? game.doubles + 1 : 0,
  };
  let next: MonopolyGame;
  if (game.phase === "jail") {
    next = outOfJail(rolled, seat, double);
  } else if (double && rolled.doubles >= DOUBLES_TO_JAIL) {
    next = toJail(
      note(rolled, `${name(game, seat)}: dritter Pasch - ab ins Gefängnis.`),
      seat,
    );
  } else {
    next = walk(
      note(rolled, `${name(game, seat)}: würfelt ${dice.join(" und ")}.`),
      seat,
      dice[0] + dice[1],
    );
  }
  return next;
}

/**
 * What a roll does to somebody sitting in jail.
 *
 * @remarks
 * "Würfeln Sie im nächsten Zug einen Pasch. Dann sind Sie sofort frei! Mit
 * diesem Würfelwurf ziehen Sie direkt aus dem Gefängnis heraus. Ihr Zug ist
 * beendet." So a double gets you out and moves you, and does **not** earn
 * another throw. On the third failure you pay and move anyway.
 */
function outOfJail(
  game: MonopolyGame,
  seat: number,
  double: boolean,
): MonopolyGame {
  const steps = game.dice[0] + game.dice[1];
  const tries = (game.players[seat].jailTurns ?? 0) + 1;
  let next: MonopolyGame;
  if (double) {
    next = walk(
      note(
        free(game, seat),
        `${name(game, seat)}: Pasch - frei und ${steps} Felder weiter.`,
      ),
      seat,
      steps,
    );
    // A double out of jail does not buy another throw.
    next = { ...next, doubles: 0 };
  } else if (tries >= JAIL_TURNS) {
    const paid = pay(
      note(
        { ...game, players: withPlayer(game, seat, { jailTurns: tries }) },
        `${name(game, seat)}: dritter Fehlversuch - ${BAIL} € Kaution fällig.`,
      ),
      seat,
      BANK,
      BAIL,
      "Kaution",
    );
    next =
      paid.debt === null
        ? { ...walk(free(paid, seat), seat, steps), doubles: 0 }
        : { ...paid, debt: { ...paid.debt, walk: steps } };
  } else {
    next = note(
      {
        ...game,
        players: withPlayer(game, seat, { jailTurns: tries }),
        phase: "manage",
        doubles: 0,
      },
      `${name(game, seat)}: kein Pasch, bleibt sitzen.`,
    );
  }
  return next;
}

/** Buys your way out before rolling. */
function buyOut(game: MonopolyGame, seat: number): MonopolyGame | null {
  const paid = pay(game, seat, BANK, BAIL, "Kaution");
  return paid.debt === null
    ? note(
        { ...free(paid, seat), phase: "roll" },
        `${name(game, seat)}: ${BAIL} € Kaution gezahlt.`,
      )
    : paid;
}

/**
 * Spends a Get-Out-Of-Jail card.
 *
 * @remarks
 * Not called `usePardon`: ESLint reads any function whose name starts with
 * "use" as a React hook and refuses to see it called from anything that is not
 * a component. The move is still `usePardon`, because that is what the player
 * does.
 */
function spendPardon(game: MonopolyGame, seat: number): MonopolyGame | null {
  const held = game.players[seat].pardons;
  let next: MonopolyGame | null = null;
  if (held.length > 0) {
    const [used, ...rest] = held;
    next = note(
      {
        ...putBack(free(game, seat), used),
        players: withPlayer(game, seat, { pardons: rest }),
        phase: "roll",
      },
      `${name(game, seat)}: spielt die Freikarte aus.`,
    );
  }
  return next;
}

/** Lets somebody out of jail without moving them. */
function free(game: MonopolyGame, seat: number): MonopolyGame {
  return { ...game, players: withPlayer(game, seat, { jailTurns: null }) };
}

/** Puts a used pardon card back under its deck. */
function putBack(game: MonopolyGame, deck: DeckId): MonopolyGame {
  const index = deckOf(deck).find(isPardon);
  const pile = deck === "ereignis" ? game.ereignis : game.gemeinschaft;
  const restored = index === undefined ? pile : [...pile, index];
  return deck === "ereignis"
    ? { ...game, ereignis: restored }
    : { ...game, gemeinschaft: restored };
}

/** Sends somebody to jail, without the salary. */
function toJail(game: MonopolyGame, seat: number): MonopolyGame {
  return {
    ...game,
    players: withPlayer(game, seat, { at: JAIL_AT, jailTurns: 0 }),
    phase: "manage",
    doubles: 0,
  };
}

/* ---------------------------------------------------------------- moving */

/** Walks a token forwards, paying the salary on the way past LOS. */
function walk(game: MonopolyGame, seat: number, steps: number): MonopolyGame {
  const from = game.players[seat].at;
  const to = (from + steps) % BOARD_SIZE;
  return land(game, seat, to, from + steps >= BOARD_SIZE);
}

/** Puts a token on a field and does what the field says. */
function land(
  game: MonopolyGame,
  seat: number,
  to: number,
  salary: boolean,
): MonopolyGame {
  const moved: MonopolyGame = {
    ...game,
    players: withPlayer(game, seat, { at: to }),
  };
  const paid = salary
    ? note(
        credit(moved, seat, SALARY),
        `${name(game, seat)}: über LOS, ${SALARY} € Gehalt.`,
      )
    : moved;
  return resolve(paid, seat);
}

/** What the field the token stands on does. */
function resolve(game: MonopolyGame, seat: number): MonopolyGame {
  const at = game.players[seat].at;
  const field = fieldAt(at);
  let next: MonopolyGame;
  switch (field.kind) {
    case "street":
    case "station":
    case "utility":
      next = onProperty(game, seat, at);
      break;
    case "tax":
      next = pay(
        note(game, `${name(game, seat)}: ${field.name}, ${field.tax} €.`),
        seat,
        BANK,
        field.tax ?? 0,
        field.name,
      );
      break;
    case "chance":
      next = draw(game, seat, "ereignis");
      break;
    case "chest":
      next = draw(game, seat, "gemeinschaft");
      break;
    case "goToJail":
      next = toJail(note(game, `${name(game, seat)}: ab ins Gefängnis.`), seat);
      break;
    default:
      next = settled(game);
  }
  return next;
}

/** Landing on something ownable. */
function onProperty(
  game: MonopolyGame,
  seat: number,
  at: number,
): MonopolyGame {
  const estate = estateAt(game, at);
  let next: MonopolyGame;
  if (estate.owner === BANK) {
    next = { ...game, phase: "decide" };
  } else if (estate.owner === seat || estate.mortgaged) {
    next = settled(game);
  } else {
    const due = rentOn(game, at, game.dice[0] + game.dice[1]);
    next = pay(
      note(
        game,
        `${name(game, seat)}: Miete ${due} € an ${name(game, estate.owner)} für ${fieldAt(at).name}.`,
      ),
      seat,
      estate.owner,
      due,
      `Miete ${fieldAt(at).name}`,
    );
  }
  return next;
}

/**
 * What one field charges right now.
 *
 * @param game - the game
 * @param at - the field
 * @param roll - the dice, which only the utilities care about
 * @returns the rent, or 0 for a field nobody owns
 * @remarks
 * The three kinds of property charge in three completely different ways, and
 * the doubling for a whole colour group applies **only to a bare street**: once
 * a house is on it, the printed rent for that many houses is the rent.
 */
export function rentOn(game: MonopolyGame, at: number, roll: number): number {
  const estate = estateAt(game, at);
  const field = fieldAt(at);
  let due = 0;
  if (estate.owner !== BANK && !estate.mortgaged) {
    switch (field.kind) {
      case "street": {
        const rents = field.rent ?? [];
        const whole = holdsGroup(game, estate.owner, field.group ?? "");
        due =
          estate.houses > 0
            ? rents[estate.houses]
            : rents[0] * (whole ? DICE_COUNT : 1);
        break;
      }
      case "station":
        due = STATION_RENT[countOwned(game, estate.owner, "station")] ?? 0;
        break;
      case "utility":
        due =
          roll *
          (UTILITY_FACTOR[countOwned(game, estate.owner, "utility")] ?? 0);
        break;
      default:
        due = 0;
    }
  }
  return due;
}

/** How many stations or utilities one seat holds. */
function countOwned(game: MonopolyGame, seat: number, kind: string): number {
  return ownedBy(game, seat).filter((at) => fieldAt(at).kind === kind).length;
}

/* ----------------------------------------------------------------- cards */

/** Turns the top card of a deck face up. */
function draw(game: MonopolyGame, seat: number, deck: DeckId): MonopolyGame {
  const pile = deck === "ereignis" ? game.ereignis : game.gemeinschaft;
  let next: MonopolyGame = game;
  if (pile.length > 0) {
    next = { ...game, drawn: { card: pile[0], who: seat } };
  }
  return next;
}

/**
 * Carries out the card that is lying face up.
 *
 * @remarks
 * "Danach legen Sie die Karte unter den Stapel zurück" - so the deck is a ring
 * and never runs out. The one exception is a Get-Out-Of-Jail card, which its
 * finder keeps until it is used.
 */
function readCard(game: MonopolyGame): MonopolyGame {
  const held = game.drawn;
  let next: MonopolyGame = game;
  if (held !== null) {
    const card = cardAt(held.card);
    const seat = held.who;
    const deck: DeckId = card?.deck ?? "ereignis";
    const pile = deck === "ereignis" ? game.ereignis : game.gemeinschaft;
    const rest = pile.filter((index) => index !== held.card);
    const rotated =
      card?.effect.kind === "pardon" ? rest : [...rest, held.card];
    const base: MonopolyGame = {
      ...game,
      drawn: null,
      ereignis: deck === "ereignis" ? rotated : game.ereignis,
      gemeinschaft: deck === "gemeinschaft" ? rotated : game.gemeinschaft,
    };
    next =
      card === null
        ? settled(base)
        : carryOut(
            note(base, `${name(game, seat)}: „${card.text}"`),
            seat,
            card.effect,
            deck,
          );
  }
  return next;
}

/** Does what one card says. */
function carryOut(
  game: MonopolyGame,
  seat: number,
  effect: Effect,
  deck: DeckId,
): MonopolyGame {
  const here = game.players[seat].at;
  let next: MonopolyGame;
  switch (effect.kind) {
    case "goTo":
      next = land(
        game,
        seat,
        effect.at,
        effect.salary && stepsTo(here, effect.at) > 0 && effect.at <= here,
      );
      break;
    case "toStation":
      next = landOnRail(game, seat, nextStation(here));
      break;
    case "toUtility":
      next = landOnWorks(game, seat, nextUtility(here));
      break;
    case "back":
      next = land(
        game,
        seat,
        (here - effect.steps + BOARD_SIZE) % BOARD_SIZE,
        false,
      );
      break;
    case "toJail":
      next = toJail(game, seat);
      break;
    case "pardon":
      next = settled({
        ...game,
        players: withPlayer(game, seat, {
          pardons: [...game.players[seat].pardons, deck],
        }),
      });
      break;
    case "bank":
      next =
        effect.amount >= 0
          ? settled(credit(game, seat, effect.amount))
          : pay(game, seat, BANK, -effect.amount, "Ereignis");
      break;
    case "each":
      next = payEach(game, seat, effect.amount);
      break;
    case "repairs":
      next = repairs(game, seat, effect.perHouse, effect.perHotel);
      break;
    default:
      next = settled(game);
  }
  return next;
}

/**
 * The card that sends you to the next station at double rent.
 *
 * @remarks
 * Double, and only for this card: "Zahle dem Besitzer die doppelte Miete." The
 * ordinary station rent already depends on how many its owner holds, so this
 * doubles whatever that came to.
 */
function landOnRail(
  game: MonopolyGame,
  seat: number,
  at: number,
): MonopolyGame {
  const moved = passing(game, seat, at);
  const estate = estateAt(moved, at);
  let next: MonopolyGame;
  if (estate.owner === BANK) {
    next = { ...moved, phase: "decide" };
  } else if (estate.owner === seat || estate.mortgaged) {
    next = settled(moved);
  } else {
    const due = rentOn(moved, at, 0) * DICE_COUNT;
    next = pay(
      moved,
      seat,
      estate.owner,
      due,
      `doppelte Miete ${fieldAt(at).name}`,
    );
  }
  return next;
}

/**
 * The card that sends you to the next utility at ten times the roll.
 *
 * @remarks
 * "Würfle und zahle dem Besitzer das Zehnfache" - ten, whether the owner holds
 * one works or both, which is the one place the printed multiplier is
 * overridden.
 */
function landOnWorks(
  game: MonopolyGame,
  seat: number,
  at: number,
): MonopolyGame {
  const random = createRandom(game.rng);
  const dice = Array.from(
    { length: DICE_COUNT },
    () => randomInt(random, DIE_FACES) + 1,
  );
  const moved = passing({ ...game, dice, rng: random.state() }, seat, at);
  const estate = estateAt(moved, at);
  const tenfold = 10;
  let next: MonopolyGame;
  if (estate.owner === BANK) {
    next = { ...moved, phase: "decide" };
  } else if (estate.owner === seat || estate.mortgaged) {
    next = settled(moved);
  } else {
    next = pay(
      moved,
      seat,
      estate.owner,
      (dice[0] + dice[1]) * tenfold,
      `Werk ${fieldAt(at).name}`,
    );
  }
  return next;
}

/** Moves a token to a field, paying the salary if LOS was passed. */
function passing(game: MonopolyGame, seat: number, to: number): MonopolyGame {
  const from = game.players[seat].at;
  const moved: MonopolyGame = {
    ...game,
    players: withPlayer(game, seat, { at: to }),
  };
  return to < from || (to === GO_AT && from !== GO_AT)
    ? note(
        credit(moved, seat, SALARY),
        `${name(game, seat)}: über LOS, ${SALARY} €.`,
      )
    : moved;
}

/**
 * A card that pays every other player, or collects from each.
 *
 * @remarks
 * Collecting is the awkward direction: a player who cannot pay ten euros would
 * have to be asked what to sell, and asking three of them in the middle of one
 * card would stall the table. So the bank does it for them - buildings back at
 * half price, then mortgages, cheapest first - and only somebody who still
 * cannot pay goes bankrupt. Recorded as a deviation in the game's spec.
 */
function payEach(
  game: MonopolyGame,
  seat: number,
  amount: number,
): MonopolyGame {
  const others = stillIn(game).filter((other) => other !== seat);
  let next = game;
  if (amount < 0) {
    next = pay(game, seat, BANK, -amount * others.length, "an alle", others);
  } else {
    for (const other of others) {
      const squeezed = squeeze(next, other, amount);
      next =
        squeezed.players[other].cash >= amount
          ? credit(debit(squeezed, other, amount), seat, amount)
          : goBankrupt(squeezed, other, seat);
    }
    next = settled(next);
  }
  return next;
}

/** A card that charges by the building. */
function repairs(
  game: MonopolyGame,
  seat: number,
  perHouse: number,
  perHotel: number,
): MonopolyGame {
  let houses = 0;
  let hotels = 0;
  for (const at of ownedBy(game, seat)) {
    const on = estateAt(game, at).houses;
    if (on === HOTEL) {
      hotels += 1;
    } else {
      houses += on;
    }
  }
  const due = houses * perHouse + hotels * perHotel;
  return due > 0 ? pay(game, seat, BANK, due, "Reparaturen") : settled(game);
}

/* ----------------------------------------------------------------- money */

/**
 * Moves money, and opens a debt when there is not enough.
 *
 * @param game - the game
 * @param from - who pays
 * @param to - who is paid, or -1 for the bank
 * @param amount - how much
 * @param reason - what for, for the log
 * @param share - seats to split it between, instead of paying `to`
 * @returns the game, either paid up or owing
 * @remarks
 * **The only place a balance goes down.** Everything else that costs money -
 * rent, tax, bail, a house, a bid - comes through here, so there is exactly one
 * answer to "what happens when you cannot afford it", and it is the rulebook's:
 * you owe it, and you may do nothing but raise it or go under.
 */
function pay(
  game: MonopolyGame,
  from: number,
  to: number,
  amount: number,
  reason: string,
  share: readonly number[] = [],
): MonopolyGame {
  let next: MonopolyGame;
  if (amount <= 0) {
    next = settled(game);
  } else if (game.players[from].cash >= amount) {
    next = settled(hand(game, from, to, amount, share));
  } else {
    next = {
      ...game,
      phase: "debt",
      debt: { who: from, to, amount, reason, share, walk: 0 },
    };
  }
  return next;
}

/** Hands money over, with enough in hand. */
function hand(
  game: MonopolyGame,
  from: number,
  to: number,
  amount: number,
  share: readonly number[],
): MonopolyGame {
  let next = debit(game, from, amount);
  if (share.length > 0) {
    const each = Math.floor(amount / share.length);
    for (const other of share) {
      next = credit(next, other, each);
    }
  } else if (to !== BANK) {
    next = credit(next, to, amount);
  }
  return next;
}

/** Adds money to a balance. */
function credit(
  game: MonopolyGame,
  seat: number,
  amount: number,
): MonopolyGame {
  return {
    ...game,
    players: withPlayer(game, seat, {
      cash: game.players[seat].cash + amount,
    }),
  };
}

/** Takes money off a balance. */
function debit(game: MonopolyGame, seat: number, amount: number): MonopolyGame {
  return credit(game, seat, -amount);
}

/**
 * Raises money for somebody who is not in a position to be asked.
 *
 * @remarks
 * Buildings first, evenly, then mortgages, cheapest first - which is the order
 * a player would use anyway, because a mortgage is reversible and a sold house
 * is not.
 */
function squeeze(
  game: MonopolyGame,
  seat: number,
  wanted: number,
): MonopolyGame {
  let next = game;
  let guard = 0;
  const limit = 200;
  while (next.players[seat].cash < wanted && guard < limit) {
    guard += 1;
    const sold = sellSomething(next, seat);
    if (sold === null) {
      guard = limit;
    } else {
      next = sold;
    }
  }
  return next;
}

/** Sells or mortgages one thing, or nothing if there is nothing left. */
function sellSomething(game: MonopolyGame, seat: number): MonopolyGame | null {
  const mine = ownedBy(game, seat);
  const built = mine
    .filter((at) => canSell(game, seat, at))
    .sort((left, right) => value(left) - value(right));
  const free = mine
    .filter((at) => canMortgage(game, seat, at))
    .sort((left, right) => value(left) - value(right));
  let next: MonopolyGame | null = null;
  if (built.length > 0) {
    next = sellBuilding(game, seat, built[0]);
  } else if (free.length > 0) {
    next = mortgage(game, seat, free[0]);
  }
  return next;
}

/** What the bank paid for a field, for ordering what to give up first. */
function value(at: number): number {
  return fieldAt(at).price ?? 0;
}

/* ------------------------------------------------------------ properties */

/** Buys the field the token stands on. */
function buyIt(game: MonopolyGame, seat: number): MonopolyGame | null {
  const at = game.players[seat].at;
  const price = fieldAt(at).price ?? 0;
  let next: MonopolyGame | null = null;
  if (estateAt(game, at).owner === BANK && game.players[seat].cash >= price) {
    next = settled(
      note(
        transfer(debit(game, seat, price), at, seat),
        `${name(game, seat)}: kauft ${fieldAt(at).name} für ${price} €.`,
      ),
    );
  }
  return next;
}

/** Puts a field into somebody's hands. */
function transfer(game: MonopolyGame, at: number, owner: number): MonopolyGame {
  return {
    ...game,
    estates: { ...game.estates, [at]: { ...estateAt(game, at), owner } },
  };
}

/** Whether a street may take another building right now. */
export function canBuild(
  game: MonopolyGame,
  seat: number,
  at: number,
): boolean {
  const field = fieldAt(at);
  const estate = estateAt(game, at);
  const group = field.group ?? "";
  const inside = fieldsIn(group as never);
  const lowest = Math.min(...inside.map((each) => estateAt(game, each).houses));
  return (
    field.kind === "street" &&
    estate.owner === seat &&
    holdsGroup(game, seat, group) &&
    inside.every((each) => !estateAt(game, each).mortgaged) &&
    estate.houses < HOTEL &&
    estate.houses === lowest &&
    game.players[seat].cash >= (field.houseCost ?? 0) &&
    (estate.houses < MAX_HOUSES ? game.houses > 0 : game.hotels > 0)
  );
}

/** Puts a house or a hotel on a street. */
function build(
  game: MonopolyGame,
  seat: number,
  at: number,
): MonopolyGame | null {
  const field = fieldAt(at);
  const estate = estateAt(game, at);
  let next: MonopolyGame | null = null;
  if (open(game) && canBuild(game, seat, at)) {
    const toHotel = estate.houses === MAX_HOUSES;
    next = note(
      {
        ...debit(game, seat, field.houseCost ?? 0),
        estates: {
          ...game.estates,
          [at]: { ...estate, houses: estate.houses + 1 },
        },
        // A hotel hands its four houses back to the box.
        houses: toHotel ? game.houses + MAX_HOUSES : game.houses - 1,
        hotels: toHotel ? game.hotels - 1 : game.hotels,
      },
      `${name(game, seat)}: baut ${toHotel ? "ein Hotel" : "ein Haus"} auf ${field.name}.`,
    );
  }
  return next;
}

/** Whether a building may come off this street right now. */
export function canSell(game: MonopolyGame, seat: number, at: number): boolean {
  const estate = estateAt(game, at);
  const inside = fieldsIn((fieldAt(at).group ?? "") as never);
  const highest = Math.max(
    ...inside.map((each) => estateAt(game, each).houses),
    0,
  );
  return (
    estate.owner === seat &&
    estate.houses > 0 &&
    estate.houses === highest &&
    // Trading a hotel back needs four houses to put in its place.
    (estate.houses !== HOTEL || game.houses >= MAX_HOUSES)
  );
}

/** Sells one building back to the bank at half price. */
function sellBuilding(
  game: MonopolyGame,
  seat: number,
  at: number,
): MonopolyGame | null {
  const field = fieldAt(at);
  const estate = estateAt(game, at);
  let next: MonopolyGame | null = null;
  if (canSell(game, seat, at)) {
    const wasHotel = estate.houses === HOTEL;
    const back = Math.floor((field.houseCost ?? 0) * SELL_BACK);
    next = note(
      {
        ...credit(game, seat, back),
        estates: {
          ...game.estates,
          [at]: {
            ...estate,
            houses: wasHotel ? MAX_HOUSES : estate.houses - 1,
          },
        },
        houses: wasHotel ? game.houses - MAX_HOUSES : game.houses + 1,
        hotels: wasHotel ? game.hotels + 1 : game.hotels,
      },
      `${name(game, seat)}: verkauft ${wasHotel ? "das Hotel" : "ein Haus"} auf ${field.name} für ${back} €.`,
    );
  }
  return next;
}

/** Whether a field may be mortgaged right now. */
export function canMortgage(
  game: MonopolyGame,
  seat: number,
  at: number,
): boolean {
  const inside = fieldsIn((fieldAt(at).group ?? "") as never);
  const estate = estateAt(game, at);
  return (
    estate.owner === seat &&
    !estate.mortgaged &&
    inside.every((each) => estateAt(game, each).houses === 0)
  );
}

/** Takes the bank's loan against a field. */
function mortgage(
  game: MonopolyGame,
  seat: number,
  at: number,
): MonopolyGame | null {
  const loan = fieldAt(at).mortgage ?? 0;
  let next: MonopolyGame | null = null;
  if (canMortgage(game, seat, at)) {
    next = note(
      {
        ...credit(game, seat, loan),
        estates: {
          ...game.estates,
          [at]: { ...estateAt(game, at), mortgaged: true },
        },
      },
      `${name(game, seat)}: Hypothek auf ${fieldAt(at).name}, ${loan} €.`,
    );
  }
  return next;
}

/** What lifting a mortgage costs: the loan and ten per cent. */
export function redemptionOf(at: number): number {
  return Math.ceil((fieldAt(at).mortgage ?? 0) * (1 + MORTGAGE_INTEREST));
}

/** Pays a mortgage back. */
function redeem(
  game: MonopolyGame,
  seat: number,
  at: number,
): MonopolyGame | null {
  const estate = estateAt(game, at);
  const due = redemptionOf(at);
  let next: MonopolyGame | null = null;
  if (
    open(game) &&
    estate.owner === seat &&
    estate.mortgaged &&
    game.players[seat].cash >= due
  ) {
    next = note(
      {
        ...debit(game, seat, due),
        estates: { ...game.estates, [at]: { ...estate, mortgaged: false } },
      },
      `${name(game, seat)}: löst die Hypothek auf ${fieldAt(at).name} für ${due} €.`,
    );
  }
  return next;
}

/* -------------------------------------------------------------- auctions */

/**
 * Puts a property under the hammer.
 *
 * @remarks
 * The rulebook has everybody shouting at once - "wobei die Reihenfolge der
 * Spieler nicht beachtet werden muss". Over a network that is not a rule, it is
 * a race, so bidding here goes round the table: raise or drop out, and the last
 * one left buys. Recorded as a deviation in the game's spec.
 */
function openAuction(
  game: MonopolyGame,
  at: number,
  reason: "landed" | "bankrupt",
): MonopolyGame {
  const bidders = stillIn(game);
  let next: MonopolyGame;
  if (bidders.length === 0 || !isOwnable(at)) {
    next = settled(game);
  } else {
    next = note(
      {
        ...game,
        phase: "auction",
        auction: {
          at,
          bid: 0,
          leader: BANK,
          turn: bidders[0],
          out: [],
          reason,
        },
      },
      `${fieldAt(at).name} wird versteigert. Startgebot ${OPENING_BID} €.`,
    );
  }
  return next;
}

/** What the next bid has to be at least. */
export function nextBid(game: MonopolyGame): number {
  const running = game.auction;
  return running === null
    ? OPENING_BID
    : Math.max(OPENING_BID, running.bid + BID_STEP);
}

/** Raising, or dropping out. */
function bidding(
  game: MonopolyGame,
  seat: number,
  move: MonopolyMove,
): MonopolyGame | null {
  const running = game.auction;
  let next: MonopolyGame | null = null;
  if (running !== null && running.turn === seat) {
    if (move.kind === "bid") {
      const least = nextBid(game);
      next =
        Number.isInteger(move.amount) &&
        move.amount >= least &&
        move.amount <= game.players[seat].cash
          ? stepAuction({
              ...game,
              auction: { ...running, bid: move.amount, leader: seat },
            })
          : null;
    } else if (move.kind === "pass") {
      next = stepAuction({
        ...game,
        auction: { ...running, out: [...running.out, seat] },
      });
    }
  }
  return next;
}

/** Moves the bidding on, and closes it when only one is left. */
function stepAuction(game: MonopolyGame): MonopolyGame {
  const running = game.auction;
  let next: MonopolyGame = game;
  if (running !== null) {
    const left = stillIn(game).filter((seat) => !running.out.includes(seat));
    if (left.length <= 1 && running.leader !== BANK) {
      next = closeAuction(game, running.leader);
    } else if (left.length === 0) {
      next = closeAuction(game, BANK);
    } else {
      next = {
        ...game,
        auction: { ...running, turn: after(left, running.turn) },
      };
    }
  }
  return next;
}

/**
 * Hands the property over and gets on with whatever was interrupted.
 *
 * @remarks
 * **An auction has to say where the game goes next, and there are two answers.**
 * One that started because somebody declined to buy hands the turn back to them
 * to finish. One that started because somebody went bankrupt to the bank is
 * happening *after* a turn ended, so it hands on to the next player. Getting
 * this wrong leaves the phase saying "auction" with no auction running, and the
 * game simply stops - which is exactly what it did.
 */
function closeAuction(game: MonopolyGame, winner: number): MonopolyGame {
  const running = game.auction;
  let next: MonopolyGame = { ...game, auction: null };
  if (running !== null) {
    next =
      winner === BANK
        ? note(
            next,
            `${fieldAt(running.at).name}: kein Gebot, bleibt bei der Bank.`,
          )
        : note(
            transfer(debit(next, winner, running.bid), running.at, winner),
            `${name(game, winner)}: ersteigert ${fieldAt(running.at).name} für ${running.bid} €.`,
          );
    const [head, ...rest] = next.toAuction;
    next =
      head === undefined
        ? afterTheHammer(next, running.reason)
        : openAuction({ ...next, toAuction: rest }, head, running.reason);
  }
  return next;
}

/** Where the game goes once the last lot is sold. */
function afterTheHammer(
  game: MonopolyGame,
  reason: "landed" | "bankrupt",
): MonopolyGame {
  return reason === "bankrupt"
    ? beginNextTurn(game)
    : { ...game, phase: "manage" };
}

/** Starts the next living player's turn. */
function beginNextTurn(game: MonopolyGame): MonopolyGame {
  const to = nextSeat(game, game.active);
  return {
    ...game,
    active: to,
    doubles: 0,
    offersThisTurn: 0,
    phase: game.players[to].jailTurns === null ? "roll" : "jail",
  };
}

/** The seat after this one, among those still bidding. */
function after(among: readonly number[], from: number): number {
  const at = among.indexOf(from);
  return among[(at + 1) % among.length];
}

/* ----------------------------------------------------------------- debts */

/** What somebody in debt may do: raise money, settle, or give up. */
function clearingDebt(
  game: MonopolyGame,
  seat: number,
  move: MonopolyMove,
): MonopolyGame | null {
  const owing = game.debt;
  let next: MonopolyGame | null = null;
  if (owing !== null && owing.who === seat) {
    switch (move.kind) {
      case "sell":
        next = sellBuilding(game, seat, move.at);
        break;
      case "mortgage":
        next = mortgage(game, seat, move.at);
        break;
      case "settle":
        next =
          game.players[seat].cash >= owing.amount ? settleUp(game, seat) : null;
        break;
      case "resign":
        next = goBankrupt(game, seat, owing.to);
        break;
      default:
        next = null;
    }
  }
  return next;
}

/** Hands over what was owed, and finishes anything the debt interrupted. */
function settleUp(game: MonopolyGame, seat: number): MonopolyGame {
  const owing = game.debt;
  let next: MonopolyGame = game;
  if (owing !== null) {
    const paid = note(
      {
        ...hand(game, seat, owing.to, owing.amount, owing.share),
        debt: null,
      },
      `${name(game, seat)}: zahlt ${owing.amount} € (${owing.reason}).`,
    );
    next =
      owing.walk > 0
        ? { ...walk(free(paid, seat), seat, owing.walk), doubles: 0 }
        : settled(paid);
  }
  return next;
}

/**
 * Somebody is out.
 *
 * @remarks
 * The two directions are genuinely different rules. To a **player**: everything
 * goes across, mortgages and all, and the new owner is charged the ten per cent
 * the rulebook makes them pay on each. To the **bank**: the deeds go back, the
 * mortgages are wiped, and every field is auctioned one at a time.
 */
function goBankrupt(
  game: MonopolyGame,
  seat: number,
  creditor: number,
): MonopolyGame {
  const mine = ownedBy(game, seat);
  // Buildings always go back to the box at half price first.
  let next = game;
  for (const at of mine) {
    const estate = estateAt(next, at);
    const count = estate.houses === HOTEL ? MAX_HOUSES + 1 : estate.houses;
    if (count > 0) {
      next = {
        ...credit(
          next,
          seat,
          Math.floor(count * (fieldAt(at).houseCost ?? 0) * SELL_BACK),
        ),
        estates: { ...next.estates, [at]: { ...estate, houses: 0 } },
        houses: next.houses + (estate.houses === HOTEL ? 0 : estate.houses),
        hotels: next.hotels + (estate.houses === HOTEL ? 1 : 0),
      };
    }
  }
  next =
    creditor === BANK
      ? toTheBank(next, seat, mine)
      : toAPlayer(next, seat, creditor, mine);
  const out = endGameIfOver(
    note(
      {
        ...next,
        players: withPlayer(next, seat, {
          bankrupt: true,
          cash: 0,
          pardons: [],
        }),
        debt: null,
      },
      `${name(game, seat)}: pleite und raus.`,
    ),
  );
  return out.phase === "gameOver" ? out : afterBankruptcy(out, seat);
}

/**
 * Where the game goes once somebody is out.
 *
 * @remarks
 * Three ways, and it went nowhere at all until each of them was written down.
 * An estate that fell to the bank goes under the hammer first, one lot at a
 * time. Otherwise, if it was the bankrupt player's own turn it is over; and if
 * it was not - somebody who could not pay a birthday card, say - the player
 * whose turn it is simply carries on.
 */
function afterBankruptcy(game: MonopolyGame, seat: number): MonopolyGame {
  const [head, ...rest] = game.toAuction;
  let next: MonopolyGame;
  if (head !== undefined) {
    next = openAuction({ ...game, toAuction: rest }, head, "bankrupt");
  } else if (seat === game.active) {
    next = beginNextTurn(game);
  } else {
    next = { ...game, phase: "manage" };
  }
  return next;
}

/** Everything goes to the player who was owed. */
function toAPlayer(
  game: MonopolyGame,
  seat: number,
  creditor: number,
  mine: readonly number[],
): MonopolyGame {
  let next = credit(game, creditor, game.players[seat].cash);
  next = {
    ...next,
    players: withPlayer(next, creditor, {
      pardons: [
        ...next.players[creditor].pardons,
        ...next.players[seat].pardons,
      ],
    }),
  };
  for (const at of mine) {
    next = transfer(next, at, creditor);
    if (estateAt(next, at).mortgaged) {
      // "Die Hypothek aufrechterhalten (d.h. der Bank sofort 10 % Zinsen
      // vom Hypothekenwert zahlen)."
      const interest = Math.ceil(
        (fieldAt(at).mortgage ?? 0) * MORTGAGE_INTEREST,
      );
      next = debit(next, creditor, interest);
    }
  }
  return next;
}

/** Everything goes back to the bank, and then under the hammer. */
function toTheBank(
  game: MonopolyGame,
  seat: number,
  mine: readonly number[],
): MonopolyGame {
  let next = game;
  for (const at of mine) {
    next = {
      ...next,
      estates: {
        ...next.estates,
        [at]: { owner: BANK, houses: 0, mortgaged: false },
      },
    };
  }
  // Pardons go back under their decks.
  for (const deck of game.players[seat].pardons) {
    next = putBack(next, deck);
  }
  return { ...next, toAuction: [...next.toAuction, ...mine] };
}

/* ---------------------------------------------------------------- trades */

/** Puts a trade on the table. */
function putOffer(
  game: MonopolyGame,
  seat: number,
  to: number,
  give: readonly number[],
  want: readonly number[],
  cash: number,
): MonopolyGame | null {
  const target = Number.isInteger(to) && to >= 0 && to < game.players.length;
  let next: MonopolyGame | null = null;
  if (
    open(game) &&
    game.offer === null &&
    target &&
    to !== seat &&
    !game.players[to].bankrupt &&
    tradable(game, seat, give) &&
    tradable(game, to, want) &&
    give.length + want.length + (cash === 0 ? 0 : 1) > 0 &&
    Number.isInteger(cash) &&
    affordable(game, seat, to, cash)
  ) {
    next = note(
      {
        ...game,
        offer: { from: seat, to, give, want, cash },
        offersThisTurn: game.offersThisTurn + 1,
      },
      `${name(game, seat)}: macht ${name(game, to)} ein Angebot.`,
    );
  }
  return next;
}

/**
 * Whether these fields could change hands.
 *
 * @remarks
 * "Vor dem Verkauf oder Tausch einer Straße müssen Sie alle Gebäude der
 * Farbgruppe an die Bank zurückverkaufen." So the whole colour group has to be
 * bare, not merely the street being traded.
 */
function tradable(
  game: MonopolyGame,
  owner: number,
  fields: readonly number[],
): boolean {
  return fields.every((at) => {
    const inside = fieldsIn((fieldAt(at).group ?? "") as never);
    return (
      estateAt(game, at).owner === owner &&
      inside.every((each) => estateAt(game, each).houses === 0)
    );
  });
}

/** Whether both sides could actually pay what the offer says. */
function affordable(
  game: MonopolyGame,
  from: number,
  to: number,
  cash: number,
): boolean {
  return cash >= 0
    ? game.players[from].cash >= cash
    : game.players[to].cash >= -cash;
}

/** Taking or refusing a trade. */
function answerOffer(
  game: MonopolyGame,
  seat: number,
  move: MonopolyMove,
): MonopolyGame | null {
  const deal = game.offer;
  let next: MonopolyGame | null = null;
  if (deal !== null && deal.to === seat) {
    if (move.kind === "reject") {
      // Remembered, so a bot does not put the same deal back on the table next
      // turn and every turn after that. A person is not stopped from re-asking:
      // only the computer reads this.
      next = note(
        { ...game, offer: null, refused: withRefusal(game, deal) },
        `${name(game, seat)}: lehnt ab.`,
      );
    } else if (move.kind === "accept") {
      next = closeOffer(game, deal);
    }
  }
  return next;
}

/** Carries a trade out. */
function closeOffer(
  game: MonopolyGame,
  deal: MonopolyGame["offer"],
): MonopolyGame | null {
  let next: MonopolyGame | null = null;
  if (
    deal !== null &&
    tradable(game, deal.from, deal.give) &&
    tradable(game, deal.to, deal.want) &&
    affordable(game, deal.from, deal.to, deal.cash)
  ) {
    let moved: MonopolyGame = { ...game, offer: null };
    for (const at of deal.give) {
      moved = onMortgageTransfer(transfer(moved, at, deal.to), at, deal.to);
    }
    for (const at of deal.want) {
      moved = onMortgageTransfer(transfer(moved, at, deal.from), at, deal.from);
    }
    moved =
      deal.cash >= 0
        ? credit(debit(moved, deal.from, deal.cash), deal.to, deal.cash)
        : credit(debit(moved, deal.to, -deal.cash), deal.from, -deal.cash);
    next = note(
      moved,
      `${name(game, deal.to)}: nimmt das Angebot von ${name(game, deal.from)} an.`,
    );
  }
  return next;
}

/** The ten per cent the rulebook charges on a mortgaged field changing hands. */
function onMortgageTransfer(
  game: MonopolyGame,
  at: number,
  owner: number,
): MonopolyGame {
  return estateAt(game, at).mortgaged
    ? debit(
        game,
        owner,
        Math.ceil((fieldAt(at).mortgage ?? 0) * MORTGAGE_INTEREST),
      )
    : game;
}

/* ------------------------------------------------------------------ turn */

/** Whether the ordinary free actions are open right now. */
function open(game: MonopolyGame): boolean {
  return (
    game.phase !== "gameOver" &&
    game.phase !== "auction" &&
    game.phase !== "debt" &&
    game.drawn === null
  );
}

/**
 * Where a turn goes once whatever just happened is finished with.
 *
 * @remarks
 * The test is **whether anything is actually open**, not what the phase says.
 * Written the other way round - "leave it alone if the phase is auction or
 * debt" - the phase outlived the thing it named twice over: once when an
 * auction was won and once when a debt was settled, and both times the game
 * stopped dead with a phase pointing at nothing. A phase that can lie is a
 * phase that will.
 */
function settled(game: MonopolyGame): MonopolyGame {
  const busy =
    game.debt !== null || game.auction !== null || game.drawn !== null;
  return game.phase === "gameOver" || busy
    ? game
    : { ...game, phase: "manage" };
}

/** Stops the turn, or throws again on a double. */
function endTurn(game: MonopolyGame, seat: number): MonopolyGame | null {
  const again =
    game.doubles > 0 &&
    game.doubles < DOUBLES_TO_JAIL &&
    game.players[seat].jailTurns === null;
  let next: MonopolyGame;
  if (again) {
    next = note(
      { ...game, phase: "roll" },
      `${name(game, seat)}: Pasch - noch einmal.`,
    );
  } else {
    next = beginNextTurn(game);
  }
  return endGameIfOver(next);
}

/** The next seat still in the game. */
function nextSeat(game: MonopolyGame, from: number): number {
  const count = game.players.length;
  let at = from;
  let found = from;
  let steps = 0;
  while (steps < count && found === from) {
    steps += 1;
    at = (at + 1) % count;
    if (!game.players[at].bankrupt) {
      found = at;
    }
  }
  return found;
}

/** Calls the game once one player is left. */
function endGameIfOver(game: MonopolyGame): MonopolyGame {
  const left = stillIn(game);
  return left.length <= 1
    ? note(
        {
          ...game,
          phase: "gameOver",
          winners: left,
          debt: null,
          auction: null,
        },
        left.length === 1
          ? `${name(game, left[0])}: gewinnt!`
          : "Alle sind pleite.",
      )
    : game;
}

/* --------------------------------------------------------------- helpers */

/** Whether a seat is in a position to act at all. */
export function isDebtor(game: MonopolyGame, seat: number): boolean {
  return game.debt !== null && game.debt.who === seat;
}

/** What one seat still has to find. */
export function shortfall(game: MonopolyGame): number {
  const owing = game.debt;
  return owing === null
    ? 0
    : Math.max(0, owing.amount - game.players[owing.who].cash);
}

/** Whether the debtor could still raise it. */
export function canStillPay(game: MonopolyGame): boolean {
  const owing = game.debt;
  return owing === null || raisable(game, owing.who) >= owing.amount;
}

/** A player's name. */
function name(game: MonopolyGame, seat: number): string {
  return seat === BANK ? "die Bank" : (game.players[seat]?.name ?? "?");
}

/** Puts a player back into the table. */
function withPlayer(
  game: MonopolyGame,
  seat: number,
  patch: Partial<MonopolyGame["players"][number]>,
): MonopolyGame["players"] {
  return game.players.map((player, at) =>
    at === seat ? { ...player, ...patch } : player,
  );
}

/** Adds a line to the log. */
function note(game: MonopolyGame, line: string): MonopolyGame {
  return { ...game, log: [...game.log, line] };
}
