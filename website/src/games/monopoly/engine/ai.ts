/**
 * The computer players.
 *
 * @module
 * @remarks
 * Monopoly is not won by rolling well. It is won by three decisions repeated
 * forty times, and this bot makes all three:
 *
 * 1. **Buy nearly everything, early.** A property nobody owns is the only kind
 *    that is cheap, and every one bought is one the others cannot complete a
 *    group with. The only reason to decline is being unable to survive the next
 *    rent, so the rule is a cash floor rather than a valuation.
 * 2. **Pay real money for what completes a set.** A third orange street is not
 *    worth its printed price, it is worth what the group earns - so at auction
 *    it will pay well over the odds for one, and next to nothing for a street
 *    that only makes somebody else's set harder to find. And it names that
 *    price in one bid rather than creeping towards it - see {@link inAuction}.
 * 3. **Build to three houses.** The rent table's big jump is from two houses to
 *    three, and the second big one is at four. A player with cash sitting idle
 *    is a player being out-earned.
 *
 * And it **buys the street it is one short of**. That was left out at first, on
 * the grounds that judging what somebody else would take is a negotiation. It
 * turned out not to be optional: measured over five games, two players finished
 * in about 180 turns and four players **never finished at all** - everybody
 * ended up with hundreds of thousands of euros, because with four players the
 * board splits so finely that nobody completes a colour group, nobody builds,
 * and the two hundred a lap comes in faster than any rent goes out. Monopoly
 * without trading is not a slower Monopoly, it is a different game that does not
 * end. See {@link proposeTrade}.
 */
import { GROUPS, OWNABLE, fieldAt, fieldsIn, type GroupId } from "./board";
import { canBuild, canMortgage, canSell, nextBid, redemptionOf } from "./moves";
import {
  BAIL,
  estateAt,
  freeTokens,
  holdsGroup,
  ownedBy,
  raisable,
  stillIn,
  worthOf,
  type MonopolyGame,
  type MonopolyMove,
} from "./state";

/** Cash kept back after buying, so the next rent does not end the game. */
const RESERVE = 120;

/** Cash kept back before putting up a building. */
const BUILD_RESERVE = 180;

/** Cash above which it is worth paying a mortgage back. */
const RICH = 600;

/** Houses per street it builds to before starting the next group. */
const BUILD_TO = 3;

/** Scales a rent into the same range as a field count, for the build order. */
const RENT_SCALE = 100;

/** What a property that completes a group is worth, as a multiple of price. */
const SET_MULTIPLE = 2.2;

/** What one that blocks somebody else's group is worth. */
const BLOCK_MULTIPLE = 1.4;

/** What an ordinary one is worth. */
const PLAIN_MULTIPLE = 0.9;

/** Above this share of the board owned, jail is a good place to be. */
const LATE_GAME = 0.6;

/** How much better an offer has to be before a bot takes it. */
const TRADE_MARGIN = 1.25;

/** How long the computer appears to think. */
const THINK_MS = 650;

/** Faster for the many small steps of building and selling. */
const QUICK_MS = 220;

/**
 * The computer's next move for one seat.
 *
 * @param game - the game
 * @param seat - the seat the computer is playing
 * @returns the move, or null if there is nothing it may do
 * @remarks
 * One step at a time - roll, buy, build, build, end - because a Monopoly turn
 * is a sequence of small decisions and watching them happen one after another
 * is the only way anybody can follow what an opponent did.
 */
export function aiMove(game: MonopolyGame, seat: number): MonopolyMove | null {
  let move: MonopolyMove | null = null;
  if (game.drawn !== null && game.drawn.who === seat) {
    move = { kind: "takeCard" };
  } else if (game.offer !== null && game.offer.to === seat) {
    move = judgeOffer(game, seat);
  } else if (game.auction !== null && game.auction.turn === seat) {
    move = inAuction(game, seat);
  } else if (game.debt !== null && game.debt.who === seat) {
    move = inDebt(game, seat);
  } else if (seat === game.active) {
    move = onTurn(game, seat);
  }
  return move;
}

/**
 * How long to wait before the computer moves.
 *
 * @param game - the game
 * @returns a pause in milliseconds
 */
export function botWaitMs(game: MonopolyGame): number {
  const brisk =
    game.phase === "manage" ||
    game.phase === "debt" ||
    game.phase === "auction" ||
    game.phase === "tokens";
  return brisk ? QUICK_MS : THINK_MS;
}

/** The ordinary run of a turn. */
function onTurn(game: MonopolyGame, seat: number): MonopolyMove | null {
  let move: MonopolyMove | null = null;
  switch (game.phase) {
    case "tokens":
      move = pickingToken(game);
      break;
    case "jail":
      move = leavingJail(game, seat);
      break;
    case "roll":
      move = { kind: "roll" };
      break;
    case "decide":
      move = worthBuying(game, seat) ? { kind: "buy" } : { kind: "decline" };
      break;
    case "manage":
      move =
        managing(game, seat) ??
        proposeTrade(game, seat) ??
        ({ kind: "endTurn" } as MonopolyMove);
      break;
    default:
      move = null;
  }
  return move;
}

/**
 * Which playing piece to take.
 *
 * @remarks
 * The last one still in the box. Not the first: a person picking before the
 * computers should get the piece they wanted, and taking from the back leaves
 * the front of the row alone for whoever is still choosing.
 */
function pickingToken(game: MonopolyGame): MonopolyMove | null {
  const free = freeTokens(game);
  return free.length === 0
    ? null
    : { kind: "pickToken", token: free[free.length - 1] };
}

/**
 * Getting out of jail, or staying put.
 *
 * @remarks
 * Early on, jail is a cage: there are properties to buy and every turn inside is
 * one somebody else spends buying them. Late on it is the safest square on the
 * board - nothing can charge you rent while you sit there - so once most of the
 * board is owned it stops paying and starts rolling for the double.
 */
function leavingJail(game: MonopolyGame, seat: number): MonopolyMove {
  const owned = OWNABLE.filter((at) => estateAt(game, at).owner >= 0).length;
  const late = owned / OWNABLE.length >= LATE_GAME;
  let move: MonopolyMove;
  if (game.players[seat].pardons.length > 0) {
    move = { kind: "usePardon" };
  } else if (!late && game.players[seat].cash >= BAIL + RESERVE) {
    move = { kind: "payBail" };
  } else {
    move = { kind: "roll" };
  }
  return move;
}

/** Whether to take the field the token is standing on. */
function worthBuying(game: MonopolyGame, seat: number): boolean {
  const at = game.players[seat].at;
  const price = fieldAt(at).price ?? 0;
  const spare = game.players[seat].cash - price;
  return spare >= 0 && (spare >= RESERVE || completes(game, seat, at));
}

/** Whether taking this field would finish a colour group. */
function completes(game: MonopolyGame, seat: number, at: number): boolean {
  const group = fieldAt(at).group;
  return (
    group !== undefined &&
    fieldsIn(group).every(
      (each) => each === at || estateAt(game, each).owner === seat,
    )
  );
}

/**
 * What one field is worth to this seat, in money.
 *
 * @remarks
 * Three prices for the same field, and the spread is the whole of Monopoly's
 * economics: the street that finishes your set is worth more than twice its
 * printed price, the one that stops somebody else finishing theirs is worth
 * about half again, and everything else is worth slightly less than the bank
 * charges - because the bank's price is what you would pay by landing on it,
 * and an auction has no such obligation.
 */
function valueOf(game: MonopolyGame, seat: number, at: number): number {
  const price = fieldAt(at).price ?? 0;
  let multiple = PLAIN_MULTIPLE;
  if (completes(game, seat, at)) {
    multiple = SET_MULTIPLE;
  } else if (wouldBlock(game, seat, at)) {
    multiple = BLOCK_MULTIPLE;
  }
  return Math.floor(price * multiple);
}

/** Whether this field is the last one somebody else needs. */
function wouldBlock(game: MonopolyGame, seat: number, at: number): boolean {
  const group = fieldAt(at).group;
  let blocks = false;
  if (group !== undefined) {
    for (const other of stillIn(game)) {
      const theirs = fieldsIn(group).filter(
        (each) => estateAt(game, each).owner === other,
      ).length;
      blocks =
        blocks || (other !== seat && theirs === fieldsIn(group).length - 1);
    }
  }
  return blocks;
}

/**
 * Raising or dropping out.
 *
 * @remarks
 * **It bids what the lot is worth to it, once.** The obvious rule - raise by the
 * smallest legal step - is the one an auction theorist would pick and it is
 * unplayable here: the smallest legal step is one euro, so two computers
 * ratchet from ten to three hundred in two hundred and ninety separate moves,
 * and a person watching has to sit through every one of them.
 *
 * Naming its price outright costs it something. Creeping, a bidder pays one
 * euro more than the runner-up; bidding its ceiling, it pays its ceiling. But
 * the ceiling is already a **conservative** number - nine tenths of the printed
 * price for an ordinary lot - and a bid you have decided on is how people
 * actually bid once they know what a thing is worth to them.
 *
 * What it buys is that an auction between computers is over in one bid and one
 * pass each.
 */
function inAuction(game: MonopolyGame, seat: number): MonopolyMove {
  const running = game.auction;
  const least = nextBid(game);
  const ceiling =
    running === null
      ? 0
      : Math.min(valueOf(game, seat, running.at), game.players[seat].cash);
  return least <= ceiling ? { kind: "bid", amount: ceiling } : { kind: "pass" };
}

/**
 * Raising money, settling, or giving up.
 *
 * @remarks
 * Buildings and mortgages, cheapest property first - and the order is not
 * arbitrary: a mortgage can be undone and a sold house cannot, so the house goes
 * only when there is nothing left to mortgage. Which is the opposite of what the
 * cheapest-first ordering would give on its own, hence the two passes.
 */
function inDebt(game: MonopolyGame, seat: number): MonopolyMove {
  const owing = game.debt;
  let move: MonopolyMove;
  if (owing === null) {
    move = { kind: "endTurn" };
  } else if (game.players[seat].cash >= owing.amount) {
    move = { kind: "settle" };
  } else if (raisable(game, seat) < owing.amount) {
    move = { kind: "resign" };
  } else {
    move = raiseSomething(game, seat) ?? { kind: "resign" };
  }
  return move;
}

/** Mortgages first, then sells buildings - cheapest property first in each. */
function raiseSomething(game: MonopolyGame, seat: number): MonopolyMove | null {
  const mine = [...ownedBy(game, seat)].sort(
    (left, right) => (fieldAt(left).price ?? 0) - (fieldAt(right).price ?? 0),
  );
  const spare = mine.find((at) => canMortgage(game, seat, at));
  const built = mine.find((at) => canSell(game, seat, at));
  let move: MonopolyMove | null = null;
  if (spare !== undefined) {
    move = { kind: "mortgage", at: spare };
  } else if (built !== undefined) {
    move = { kind: "sell", at: built };
  }
  return move;
}

/**
 * What to do with money before ending the turn.
 *
 * @remarks
 * Building comes before lifting mortgages, and by a long way: a third house on
 * an orange street multiplies its rent by about fourteen, while paying off a
 * mortgage buys back a rent of twelve. The mortgage only gets paid once there is
 * money doing nothing.
 */
function managing(game: MonopolyGame, seat: number): MonopolyMove | null {
  const buildable = whereToBuild(game, seat);
  const mortgaged = ownedBy(game, seat).find(
    (at) =>
      estateAt(game, at).mortgaged &&
      game.players[seat].cash >= redemptionOf(at) + RICH,
  );
  let move: MonopolyMove | null = null;
  if (buildable !== null) {
    move = { kind: "build", at: buildable };
  } else if (mortgaged !== undefined) {
    move = { kind: "redeem", at: mortgaged };
  }
  return move;
}

/**
 * Where the next building goes, if one goes anywhere.
 *
 * @remarks
 * To three houses across a whole group before starting the fourth, because that
 * is where the rent table's biggest step is - and then on to hotels only when
 * the money is genuinely spare.
 */
function whereToBuild(game: MonopolyGame, seat: number): number | null {
  const mine = GROUPS.map((group) => group.id).filter((group) =>
    holdsGroup(game, seat, group),
  );
  const wanted = mine
    .flatMap((group) => fieldsIn(group as GroupId))
    .filter((at) => canBuild(game, seat, at))
    .filter(
      (at) =>
        game.players[seat].cash >= (fieldAt(at).houseCost ?? 0) + BUILD_RESERVE,
    )
    .sort((left, right) => rank(game, left) - rank(game, right));
  return wanted[0] ?? null;
}

/** What to build next: low houses first, and richer streets before poorer. */
function rank(game: MonopolyGame, at: number): number {
  const houses = estateAt(game, at).houses;
  const stage = houses >= BUILD_TO ? 1 : 0;
  return (
    stage * OWNABLE.length - (fieldAt(at).rent?.[BUILD_TO] ?? 0) / RENT_SCALE
  );
}

/**
 * Whether an offer is worth taking.
 *
 * @remarks
 * Values both halves the same way it values an auction lot, and asks for a
 * clear margin - a quarter - rather than a bare majority. A bot that took every
 * marginally positive trade would be a bot anybody could take apart one small
 * favour at a time.
 */
function judgeOffer(game: MonopolyGame, seat: number): MonopolyMove {
  const deal = game.offer;
  let move: MonopolyMove = { kind: "reject" };
  if (deal !== null) {
    const receives =
      deal.give.reduce((sum, at) => sum + valueOf(game, seat, at), 0) +
      Math.max(0, deal.cash);
    const gives =
      deal.want.reduce((sum, at) => sum + valueOf(game, seat, at), 0) +
      Math.max(0, -deal.cash);
    const affordable = deal.cash >= 0 || game.players[seat].cash >= -deal.cash;
    if (affordable && receives >= gives * TRADE_MARGIN) {
      move = { kind: "accept" };
    }
  }
  return move;
}

/**
 * Buys the one street that would finish a colour group, if it can.
 *
 * @remarks
 * One offer a turn, and only ever the same shape: **cash for the street I am
 * one short of.** No swaps, no packages, no haggling - a bot that negotiates
 * badly is worse than one that does not negotiate, and this one shape is the
 * only trade in Monopoly that is obviously worth making.
 *
 * The price offered is what the *other* player would value it at, plus the
 * margin they insist on, so an offer that gets made is an offer that gets
 * taken. That comes to about one and three quarter times the printed price -
 * which sounds outrageous and is not: a finished colour group is worth several
 * times what its last street costs, and the seller knows exactly why it is
 * being asked for.
 */
function proposeTrade(game: MonopolyGame, seat: number): MonopolyMove | null {
  let move: MonopolyMove | null = null;
  if (game.offersThisTurn === 0) {
    for (const group of GROUPS) {
      const inside = fieldsIn(group.id);
      const missing = inside.filter((at) => estateAt(game, at).owner !== seat);
      const wanted = missing[0];
      const holder = wanted === undefined ? -1 : estateAt(game, wanted).owner;
      if (
        move === null &&
        missing.length === 1 &&
        holder >= 0 &&
        holder !== seat &&
        !game.players[holder].bankrupt &&
        estateAt(game, wanted).houses === 0
      ) {
        const ask = Math.ceil(valueOf(game, holder, wanted) * TRADE_MARGIN) + 1;
        if (game.players[seat].cash - ask >= BUILD_RESERVE) {
          move = {
            kind: "offer",
            to: holder,
            give: [],
            want: [wanted],
            cash: ask,
          };
        }
      }
    }
  }
  return move;
}

/**
 * How well one seat is doing, for the standings.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns cash plus everything they hold
 */
export function standingOf(game: MonopolyGame, seat: number): number {
  return worthOf(game, seat);
}
