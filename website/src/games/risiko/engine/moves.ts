/**
 * The referee: the only thing in the game that changes a game.
 *
 * @module
 * @remarks
 * One entry point, {@link applyMove}, and it returns `null` for anything it will
 * not allow. Every screen and the online layer go through it, so a client that
 * asks for something impossible is simply not answered.
 *
 * Three rules of this edition are easy to get wrong and are worth naming here,
 * because all three differ from the Risk most people remember:
 *
 * 1. **Attackers move.** "Nehmen Sie die Einheiten, mit denen Sie angreifen
 *    möchten, und ziehen Sie sie über die Grenze." They leave the attacking
 *    territory for the duration of the action; survivors either occupy what they
 *    took or walk back. That is why {@link resolveAttack} takes them off the
 *    source first and puts them somewhere afterwards, rather than counting
 *    losses in place.
 * 2. **One action is one roll.** Not a fight to the death: dice are compared
 *    once and the action is over. Attacking again is a new decision, which is
 *    the whole tension of the phase.
 * 3. **Reinforcements are a flat three plus a table**, not territories divided
 *    by three. Eleven territories are worth nothing over ten; the twelfth is
 *    worth a unit a turn forever.
 *
 * Every line the referee writes to the log names the player and then a colon.
 * That is not a style choice: the seat you play yourself is called "Du", and a
 * sentence built as "`${name} verstärkt`" comes out as "Du verstärkt". German
 * conjugates, and the colon form is the one shape that fits a name and a
 * pronoun equally.
 */
import { TRUCE, buildDeck, isTradable, unitsForCards } from "./cards";
import { borders, neighboursOf, territoryOf } from "./map";
import { createRandom, randomInt, shuffle, type Random } from "./random";
import {
  DIE_SIDES,
  MAX_ATTACKERS,
  MAX_DEFENDERS,
  NEUTRAL_BOOST,
  TOTAL_TERRITORIES,
  countHeld,
  heldBy,
  incomeOf,
  livingPlayers,
  unitsOf,
  type Battle,
  type RisikoGame,
  type RisikoMove,
} from "./state";

/** One attack that could be made. */
export type AttackOption = {
  readonly from: string;
  readonly to: string;
  /** The most units this attack could send. */
  readonly max: number;
};

/**
 * Applies a move, or refuses it.
 *
 * @param game - the game as it stands
 * @param seat - the seat asking to move
 * @param move - what they want to do
 * @returns the new game, or null if the move is not allowed now
 */
export function applyMove(
  game: RisikoGame,
  seat: number,
  move: RisikoMove,
): RisikoGame | null {
  const seated =
    Number.isInteger(seat) && seat >= 0 && seat < game.players.length;
  let next: RisikoGame | null = null;
  if (game.phase !== "gameOver" && seated && seat === game.active) {
    switch (move.kind) {
      case "claim":
        next = doClaim(game, seat, move.to);
        break;
      case "place":
        next = doPlace(game, seat, move.to, move.count);
        break;
      case "boost":
        next = doBoost(game, seat, move.to, move.count);
        break;
      case "trade":
        next = doTrade(game, seat, move.cards);
        break;
      case "attack":
        next = doAttack(game, seat, move.from, move.to, move.units);
        break;
      case "advance":
        next = doAdvance(game, seat, move.count);
        break;
      case "done":
        next = doneAttacking(game);
        break;
      case "fortify":
        next = doFortify(game, seat, move.from, move.to, move.count);
        break;
      case "endTurn":
        next = endTurn(game, seat);
        break;
      default:
        next = null;
    }
  }
  return next;
}

/**
 * The seat the table is waiting for.
 *
 * @param game - the game
 * @returns the seat on turn, or null once the game is over
 */
export function seatOnTurn(game: RisikoGame): number | null {
  return game.phase === "gameOver" ? null : game.active;
}

/**
 * Every attack the seat on turn could make.
 *
 * @param game - the game
 * @param seat - the seat asking
 * @returns each pair of territories and the most units that could cross
 */
export function legalAttacks(
  game: RisikoGame,
  seat: number,
): readonly AttackOption[] {
  const options: AttackOption[] = [];
  if (
    game.phase === "attack" &&
    seat === game.active &&
    game.advance === null
  ) {
    for (const from of heldBy(game, seat)) {
      const spare = game.units[from] - 1;
      if (spare > 0) {
        for (const to of neighboursOf(from)) {
          if (game.owner[to] !== seat) {
            options.push({ from, to, max: Math.min(MAX_ATTACKERS, spare) });
          }
        }
      }
    }
  }
  return options;
}

/**
 * Where units could be moved from one territory, at the end of a turn.
 *
 * @param game - the game
 * @param from - the territory they would leave
 * @param seat - the seat asking
 * @returns every own territory reachable through own territory
 * @remarks
 * "Verbunden heißt hier: Sie ziehen durch eine Kette von Gebieten, die Sie
 * kontrollieren." So this is a walk over the seat's own territories, not a step
 * to a neighbour - a chain across a whole continent is one move.
 */
export function fortifyTargets(
  game: RisikoGame,
  seat: number,
  from: string,
): readonly string[] {
  const reached = new Set<string>();
  if (game.owner[from] === seat) {
    const queue = [from];
    reached.add(from);
    while (queue.length > 0) {
      for (const next of neighboursOf(queue.pop() ?? "")) {
        if (game.owner[next] === seat && !reached.has(next)) {
          reached.add(next);
          queue.push(next);
        }
      }
    }
    reached.delete(from);
  }
  return [...reached];
}

/** Takes an empty territory during the classic game's opening. */
function doClaim(
  game: RisikoGame,
  seat: number,
  to: string,
): RisikoGame | null {
  const free = game.phase === "claim" && game.owner[to] === -1;
  let next: RisikoGame | null = null;
  if (free && territoryOf(to) !== null && game.pool[seat] > 0) {
    const placed = {
      ...game,
      owner: { ...game.owner, [to]: seat },
      units: { ...game.units, [to]: 1 },
      pool: game.pool.map((left, at) => (at === seat ? left - 1 : left)),
    };
    const done = Object.values(placed.owner).every((who) => who >= 0);
    next = note(
      done
        ? { ...placed, phase: "deploy", active: firstSeat(placed) }
        : { ...placed, active: nextSeat(placed, seat) },
      `${game.players[seat].name}: ${nameOf(to)} besetzt.`,
    );
  }
  return next;
}

/** Puts new units down, during the opening or at the start of a turn. */
function doPlace(
  game: RisikoGame,
  seat: number,
  to: string,
  count: number,
): RisikoGame | null {
  const mine = game.owner[to] === seat;
  let next: RisikoGame | null = null;
  if (game.phase === "deploy" && mine && count === 1 && game.pool[seat] > 0) {
    const placed = {
      ...game,
      units: { ...game.units, [to]: game.units[to] + 1 },
      pool: game.pool.map((left, at) => (at === seat ? left - 1 : left)),
    };
    const spent = placed.pool.every((left) => left === 0);
    next = spent
      ? openTurn({ ...placed, active: firstSeat(placed) })
      : { ...placed, active: nextWithPool(placed, seat) };
  } else if (
    game.phase === "reinforce" &&
    mine &&
    Number.isInteger(count) &&
    count > 0 &&
    count <= game.toPlace
  ) {
    const placed = {
      ...game,
      units: { ...game.units, [to]: game.units[to] + count },
      toPlace: game.toPlace - count,
    };
    next =
      placed.toPlace === 0
        ? note(
            { ...placed, phase: "attack" },
            `${game.players[seat].name}: Verstärkung gestellt.`,
          )
        : placed;
  }
  return next;
}

/**
 * Reinforces a neutral army before a turn of the two-player game.
 *
 * @remarks
 * "Verstärken Sie irgendeine neutrale Armee um 3 Einheiten... Allerdings dürfen
 * sie nicht auf den Gebieten einer anderen neutralen Armee landen." All three go
 * to one army; which of its territories, and in what split, is free. The army
 * chosen by the first unit is remembered in {@link RisikoGame.boosting}, which
 * is the only thing that stops the second unit going somewhere else.
 */
function doBoost(
  game: RisikoGame,
  seat: number,
  to: string,
  count: number,
): RisikoGame | null {
  const owner = game.owner[to];
  const neutral = owner >= 0 && game.players[owner]?.isNeutral === true;
  const sameArmy = game.boosting === null || game.boosting === owner;
  let next: RisikoGame | null = null;
  if (
    game.phase === "neutral" &&
    neutral &&
    sameArmy &&
    Number.isInteger(count) &&
    count > 0 &&
    count <= game.toPlace
  ) {
    const placed: RisikoGame = {
      ...game,
      units: { ...game.units, [to]: game.units[to] + count },
      toPlace: game.toPlace - count,
      boosting: owner,
    };
    next =
      placed.toPlace === 0
        ? note(
            openReinforce({ ...placed, boosting: null }, seat),
            `${game.players[seat].name}: ${game.players[owner].name} verstärkt.`,
          )
        : placed;
  }
  return next;
}

/** Hands cards in for units. */
function doTrade(
  game: RisikoGame,
  seat: number,
  cards: readonly string[],
): RisikoGame | null {
  const hand = game.players[seat].cards;
  const held = cards.every((card) => hand.includes(card));
  let next: RisikoGame | null = null;
  if (game.phase === "reinforce" && held && isTradable(cards)) {
    const gained = unitsForCards(cards);
    next = note(
      {
        ...game,
        players: game.players.map((player, at) =>
          at === seat
            ? {
                ...player,
                cards: player.cards.filter((card) => !cards.includes(card)),
              }
            : player,
        ),
        discard: [...game.discard, ...cards],
        toPlace: game.toPlace + gained,
      },
      `${game.players[seat].name}: ${cards.length} Karten gegen ${gained} Einheiten getauscht.`,
    );
  }
  return next;
}

/** One conquest action: one roll, and whatever it costs. */
function doAttack(
  game: RisikoGame,
  seat: number,
  from: string,
  to: string,
  units: number,
): RisikoGame | null {
  const spare = (game.units[from] ?? 0) - 1;
  const legal =
    game.phase === "attack" &&
    game.advance === null &&
    game.owner[from] === seat &&
    game.owner[to] !== seat &&
    game.owner[to] >= 0 &&
    borders(from, to) &&
    Number.isInteger(units) &&
    units >= 1 &&
    units <= Math.min(MAX_ATTACKERS, spare);
  return legal ? resolveAttack(game, seat, from, to, units) : null;
}

/**
 * Rolls one conquest action and puts the pieces where they end up.
 *
 * @remarks
 * The order here is the rulebook's, and it matters. The attacking units leave
 * their territory **before** the dice, which is why a failed attack costs the
 * source those losses and then puts the survivors back, rather than deducting
 * from a number that never moved. It comes to the same arithmetic and to a very
 * different piece of code, and the rulebook's version is the one that stays
 * right when the source is left holding exactly one unit.
 */
function resolveAttack(
  game: RisikoGame,
  seat: number,
  from: string,
  to: string,
  attackers: number,
): RisikoGame {
  const random = createRandom(game.rng);
  const defenders = Math.min(MAX_DEFENDERS, game.units[to]);
  const black = roll(random, attackers);
  const red = roll(random, defenders);
  let attackerLost = 0;
  let defenderLost = 0;
  for (let pair = 0; pair < Math.min(black.length, red.length); pair += 1) {
    if (black[pair] > red[pair]) {
      defenderLost += 1;
    } else {
      attackerLost += 1;
    }
  }
  const survivors = attackers - attackerLost;
  const left = game.units[to] - defenderLost;
  const taken = left === 0;
  const battle: Battle = {
    from,
    to,
    attack: black,
    defence: red,
    attackerLost,
    defenderLost,
    taken,
  };
  const loser = game.owner[to];
  const after: RisikoGame = {
    ...game,
    units: {
      ...game.units,
      // The attackers are gone from the source either way; survivors either
      // stay where they took, or walk back.
      [from]: game.units[from] - attackers + (taken ? 0 : survivors),
      [to]: taken ? survivors : left,
    },
    owner: taken ? { ...game.owner, [to]: seat } : game.owner,
    conquered: game.conquered || taken,
    advance:
      taken && game.units[from] - attackers > 1
        ? { from, to, max: game.units[from] - attackers - 1 }
        : null,
    lastBattle: battle,
    rng: random.state(),
  };
  return settle(
    taken ? checkBeaten(after, seat, loser) : after,
    note(after, battleLine(game, seat, battle)).log,
  );
}

/** Pulls more units into a territory just taken. */
function doAdvance(
  game: RisikoGame,
  seat: number,
  count: number,
): RisikoGame | null {
  const pending = game.advance;
  let next: RisikoGame | null = null;
  if (
    pending !== null &&
    game.owner[pending.to] === seat &&
    Number.isInteger(count) &&
    count >= 0 &&
    count <= pending.max
  ) {
    next = {
      ...game,
      units: {
        ...game.units,
        [pending.from]: game.units[pending.from] - count,
        [pending.to]: game.units[pending.to] + count,
      },
      advance: null,
    };
  }
  return next;
}

/** Stops attacking. */
function doneAttacking(game: RisikoGame): RisikoGame | null {
  return game.phase === "attack" && game.advance === null
    ? { ...game, phase: "fortify" }
    : null;
}

/** The one move of the turn. */
function doFortify(
  game: RisikoGame,
  seat: number,
  from: string,
  to: string,
  count: number,
): RisikoGame | null {
  const reachable = fortifyTargets(game, seat, from).includes(to);
  let next: RisikoGame | null = null;
  if (
    game.phase === "fortify" &&
    reachable &&
    Number.isInteger(count) &&
    count > 0 &&
    count <= game.units[from] - 1
  ) {
    next = endTurn(
      note(
        {
          ...game,
          units: {
            ...game.units,
            [from]: game.units[from] - count,
            [to]: game.units[to] + count,
          },
        },
        `${game.players[seat].name}: ${count} von ${nameOf(from)} nach ${nameOf(to)} gezogen.`,
      ),
      seat,
    );
  }
  return next;
}

/**
 * Ends the turn: a card if anything was taken, then the win check, then on.
 *
 * @remarks
 * The card comes first because in the basic game it can end the game outright -
 * the truce card is in that pile - and a player who reaches the target and
 * *then* draws the truce has still won on the target. Drawing first and asking
 * afterwards is the only order that gets both of those right.
 */
function endTurn(game: RisikoGame, seat: number): RisikoGame | null {
  let next: RisikoGame | null = null;
  if (game.phase === "attack" || game.phase === "fortify") {
    if (game.advance === null) {
      const drawn = game.conquered ? drawCard(game, seat) : game;
      next = settle(drawn, drawn.log);
      if (next.phase !== "gameOver") {
        next = openTurnFor(next, nextSeat(next, seat));
      }
    }
  }
  return next;
}

/** Draws the top card, reshuffling the discard if the pile has run out. */
function drawCard(game: RisikoGame, seat: number): RisikoGame {
  const random = createRandom(game.rng);
  const pile = game.deck.length > 0 ? game.deck : shuffle(random, game.discard);
  const spent = game.deck.length > 0 ? game.discard : [];
  let next: RisikoGame = { ...game, rng: random.state() };
  if (pile.length > 0) {
    const [card, ...rest] = pile;
    next =
      card === TRUCE
        ? note(
            { ...next, deck: rest, discard: spent, phase: "gameOver" },
            "Die Waffenstillstandskarte ist gezogen. Das Spiel ist sofort zu Ende.",
          )
        : {
            ...next,
            deck: rest,
            discard: spent,
            players: next.players.map((player, at) =>
              at === seat
                ? { ...player, cards: [...player.cards, card] }
                : player,
            ),
          };
  }
  return next;
}

/**
 * Takes a beaten player's cards, and notices when they are out.
 *
 * @remarks
 * "Sollten Sie Karten haben, übergeben Sie diese dem Spieler, der Sie gerade
 * besiegt hat." That holds for a neutral army too, whose three stashed cards
 * were put there at setup for exactly this moment.
 */
function checkBeaten(
  game: RisikoGame,
  winner: number,
  loser: number,
): RisikoGame {
  let next = game;
  if (loser >= 0 && countHeld(game, loser) === 0) {
    const spoils = game.players[loser].cards;
    next = note(
      {
        ...game,
        players: game.players.map((player, at) => {
          let updated = player;
          if (at === loser) {
            updated = { ...player, alive: false, cards: [] };
          } else if (at === winner) {
            updated = { ...player, cards: [...player.cards, ...spoils] };
          }
          return updated;
        }),
      },
      `${game.players[loser].name}: besiegt.${
        spoils.length > 0
          ? ` ${spoils.length} Karten wechseln den Besitzer.`
          : ""
      }`,
    );
  }
  return next;
}

/**
 * Decides whether the game has just been won.
 *
 * @param game - the game, right after something changed
 * @param log - the log to carry over, so a battle line is not lost
 * @returns the game, with its phase and winners settled
 */
export function settle(
  game: RisikoGame,
  log: readonly string[] = game.log,
): RisikoGame {
  const alive = livingPlayers(game);
  let next: RisikoGame = { ...game, log };
  if (game.phase === "gameOver") {
    // The truce card got here first: most territories wins.
    next = { ...next, winners: mostGround(next) };
  } else if (alive.length === 1) {
    next = note(
      { ...next, phase: "gameOver", winners: alive },
      `${game.players[alive[0]].name}: alle anderen besiegt!`,
    );
  } else if (
    game.target > 0 &&
    alive.some((seat) => countHeld(game, seat) >= game.target)
  ) {
    const won = alive.filter((seat) => countHeld(game, seat) >= game.target);
    next = note(
      { ...next, phase: "gameOver", winners: won },
      `${won.map((seat) => game.players[seat].name).join(" und ")}: Ziel erreicht!`,
    );
  } else if (
    game.target === 0 &&
    alive.some((seat) => countHeld(game, seat) === TOTAL_TERRITORIES)
  ) {
    const won = alive.filter(
      (seat) => countHeld(game, seat) === TOTAL_TERRITORIES,
    );
    next = note(
      { ...next, phase: "gameOver", winners: won },
      `${game.players[won[0]].name}: die ganze Welt!`,
    );
  }
  return next;
}

/**
 * Who has won when the truce card ends it.
 *
 * @remarks
 * "Der Spieler mit den meisten Gebieten hat gewonnen. Bei einem Unentschieden
 * gewinnt der Spieler, der die meisten Einheiten auf dem Spielplan hat. Steht es
 * dabei immer noch unentschieden, haben beide Spieler gewonnen." A draw the
 * rules allow, so it stays a draw here.
 */
function mostGround(game: RisikoGame): readonly number[] {
  const alive = livingPlayers(game);
  const best = Math.max(...alive.map((seat) => countHeld(game, seat)));
  const onGround = alive.filter((seat) => countHeld(game, seat) === best);
  const mostUnits = Math.max(...onGround.map((seat) => unitsOf(game, seat)));
  return onGround.filter((seat) => unitsOf(game, seat) === mostUnits);
}

/** Starts the first turn after the classic game's opening. */
function openTurn(game: RisikoGame): RisikoGame {
  return openTurnFor(game, game.active);
}

/** Starts one seat's turn, in whatever phase this variant opens with. */
function openTurnFor(game: RisikoGame, seat: number): RisikoGame {
  const fresh: RisikoGame = {
    ...game,
    active: seat,
    conquered: false,
    advance: null,
    lastBattle: null,
    boosting: null,
  };
  return game.variant === "zweispieler"
    ? { ...fresh, phase: "neutral", toPlace: NEUTRAL_BOOST }
    : openReinforce(fresh, seat);
}

/** Moves a turn into its reinforcement phase. */
function openReinforce(game: RisikoGame, seat: number): RisikoGame {
  return { ...game, phase: "reinforce", toPlace: incomeOf(game, seat) };
}

/** The next living seat somebody plays. */
function nextSeat(game: RisikoGame, from: number): number {
  const count = game.players.length;
  let at = from;
  let found = from;
  let steps = 0;
  while (steps < count && found === from) {
    steps += 1;
    at = (at + 1) % count;
    if (game.players[at].alive && !game.players[at].isNeutral) {
      found = at;
    }
  }
  return found;
}

/** The next seat that still has starting units to put down. */
function nextWithPool(game: RisikoGame, from: number): number {
  const count = game.players.length;
  let at = from;
  let found = from;
  let steps = 0;
  while (steps < count && found === from) {
    steps += 1;
    at = (at + 1) % count;
    if (game.pool[at] > 0 && !game.players[at].isNeutral) {
      found = at;
    }
  }
  return found;
}

/** The first living seat somebody plays. */
function firstSeat(game: RisikoGame): number {
  return livingPlayers(game)[0] ?? 0;
}

/** Rolls a handful of dice, highest first. */
function roll(random: Random, count: number): readonly number[] {
  return Array.from(
    { length: count },
    () => randomInt(random, DIE_SIDES) + 1,
  ).sort((left, right) => right - left);
}

/** What one attack reads as in the log. */
function battleLine(game: RisikoGame, seat: number, battle: Battle): string {
  const who = game.players[seat].name;
  const where = `${nameOf(battle.from)} greift ${nameOf(battle.to)} an`;
  const dice = `${battle.attack.join("/")} gegen ${battle.defence.join("/")}`;
  const cost = `${battle.attackerLost}:${battle.defenderLost}`;
  return `${who}: ${where} (${dice}), Verluste ${cost}.${
    battle.taken ? " Erobert!" : ""
  }`;
}

/** A territory's printed name. */
function nameOf(id: string): string {
  return territoryOf(id)?.name ?? id;
}

/** Adds a line to the log. */
function note(game: RisikoGame, line: string): RisikoGame {
  return { ...game, log: [...game.log, line] };
}

/** The full deck, for the setup module. */
export { buildDeck };
