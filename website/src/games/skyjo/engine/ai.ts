/**
 * The computer player.
 *
 * @module
 * @remarks
 * Deliberately a plain, readable heuristic rather than a search. Skyjo is a game
 * of hidden cards, so a search would mostly be guessing anyway - and an opponent
 * whose reasoning can be written down in a paragraph is easier to tune and to
 * trust.
 *
 * What it weighs, in order:
 *
 * 1. **Finish a column.** Three equal cards leave the game and are worth far
 *    more than the card's face value suggests.
 * 2. **Swap out the worst card** it can see, if the offered card is clearly
 *    better.
 * 3. **Turn something up** when nothing else is worth doing - a face-down card
 *    is worth about {@link UNKNOWN_VALUE} on average.
 *
 * The computer only ever uses what the rules let a player see. Face-down values
 * are never read, not even its own.
 *
 * The three levels turn the same heuristic up and down rather than swapping in
 * different players: `leicht` is blind to the column rule and quick to turn
 * cards up, `mittel` weighs everything as described, `schwer` additionally
 * thinks about when it is worth ending the round.
 */
import { GRID_COLUMNS, columnIndexes } from "./cards";
import { DEFAULT_DIFFICULTY, type Difficulty } from "./difficulty";
import { legalMoves } from "./moves";
import {
  faceDownCount,
  layoutValue,
  topOf,
  visibleValue,
  type Player,
  type SkyjoGame,
  type SkyjoMove,
} from "./state";

/**
 * What a face-down card is assumed to be worth.
 *
 * @remarks
 * The deck averages a little over 5. Rounding down slightly makes the computer
 * a touch keener to turn cards up, which keeps a round moving.
 */
const UNKNOWN_VALUE = 5;

/** A card at or below this is worth keeping rather than swapping away. */
const GOOD_CARD = 4;

/** How the levels differ. */
type Style = {
  /** How much better a swap must be before it beats turning a card up. */
  readonly swapMargin: number;
  /** Whether completing a column is seen as worth anything extra. */
  readonly usesColumns: boolean;
  /** Whether it weighs up ending the round before turning its last card up. */
  readonly guardsEnding: boolean;
};

/** What each level does. */
const STYLES: Readonly<Record<Difficulty, Style>> = {
  // Careless: blind to columns, and it swaps only when the gain is glaring.
  leicht: { swapMargin: 6, usesColumns: false, guardsEnding: false },
  mittel: { swapMargin: 2, usesColumns: true, guardsEnding: false },
  // Keen: swaps on the slightest gain and picks its moment to end the round.
  schwer: { swapMargin: 1, usesColumns: true, guardsEnding: true },
};

/**
 * The move the computer makes for the seat on turn.
 *
 * @param game - the game, on some seat's turn
 * @param difficulty - how hard this opponent should play
 * @returns the chosen move, or null if there is nothing to do
 */
export function aiMove(
  game: SkyjoGame,
  difficulty: Difficulty = DEFAULT_DIFFICULTY,
): SkyjoMove | null {
  const style = STYLES[difficulty] ?? STYLES[DEFAULT_DIFFICULTY];
  const seat = game.turn;
  const moves = legalMoves(game, seat);
  let chosen: SkyjoMove | null = null;
  if (moves.length > 0) {
    if (game.phase === "roundOver") {
      chosen = { kind: "nextRound" };
    } else if (game.phase === "flip") {
      chosen = openingFlip(game, seat);
    } else if (game.drawn === null) {
      chosen = chooseSource(game, seat, style);
    } else {
      chosen = placeDrawn(game, seat, game.drawn, style);
    }
  }
  return chosen ?? moves[0] ?? null;
}

/**
 * Which two cards to turn up at the start.
 *
 * @remarks
 * Nothing is known yet, so it simply takes opposite corners - spreading them
 * across two columns keeps more column pairings possible later.
 */
function openingFlip(game: SkyjoGame, seat: number): SkyjoMove | null {
  const grid = game.players[seat].grid;
  const preferred = [0, grid.length - 1, 1, grid.length - 2];
  const index =
    preferred.find((at) => grid[at]?.state === "down") ??
    grid.findIndex((slot) => slot.state === "down");
  return index >= 0 ? { kind: "flip", index } : null;
}

/** Decides between the open discard card and a blind draw. */
function chooseSource(
  game: SkyjoGame,
  seat: number,
  style: Style,
): SkyjoMove | null {
  const offered = topOf(game.discard);
  let move: SkyjoMove | null = { kind: "draw" };
  if (offered !== null) {
    const best = bestPlacement(game.players[seat], offered, style);
    // Only take the open card when it really improves the layout.
    if (best !== null && best.gain > 0) {
      move = { kind: "takeDiscard", index: best.index };
    }
  }
  return move;
}

/** Decides what to do with a card just drawn from the deck. */
function placeDrawn(
  game: SkyjoGame,
  seat: number,
  card: number,
  style: Style,
): SkyjoMove | null {
  const player = game.players[seat];
  const best = bestPlacement(player, card, style);
  const flip = worstUnknown(player);
  const holdBack = flip !== null && endsTooEarly(game, seat, flip, style);
  let move: SkyjoMove | null = null;
  if (best !== null && best.gain > style.swapMargin) {
    move = { kind: "swapDrawn", index: best.index };
  } else if (flip !== null && !holdBack) {
    move = { kind: "discardDrawn", index: flip };
  } else if (best !== null) {
    // Either nothing worth turning up, or turning up would end the round at a
    // bad moment - so the card goes into the layout after all.
    move = { kind: "swapDrawn", index: best.index };
  } else if (flip !== null) {
    move = { kind: "discardDrawn", index: flip };
  }
  return move;
}

/**
 * Whether turning up this card would end the round at a bad moment.
 *
 * @param game - the current game
 * @param seat - the player about to turn a card up
 * @param index - the card they would turn up
 * @param style - the level, which decides whether this is considered at all
 * @returns true if the round would end while somebody else is showing less
 * @remarks
 * Only the hard level looks at this. Ending the round is a bet: whoever does it
 * must be lowest on their own, or their score doubles. With one card left to
 * turn, it is worth checking the bet first - the face-down card is taken at its
 * average, since its real value is unknown to the computer too.
 */
function endsTooEarly(
  game: SkyjoGame,
  seat: number,
  index: number,
  style: Style,
): boolean {
  const player = game.players[seat];
  const last =
    faceDownCount(player) === 1 && player.grid[index].state === "down";
  let risky = false;
  if (style.guardsEnding && last && game.endedBy === null) {
    const mine = layoutValue({
      ...player,
      grid: player.grid.map((slot) =>
        slot.state === "down" ? { ...slot, value: UNKNOWN_VALUE } : slot,
      ),
    });
    risky = game.players.some(
      (other, at) => at !== seat && visibleValue(other) <= mine,
    );
  }
  return risky;
}

/** What placing a card in a slot is worth, and where it is worth the most. */
function bestPlacement(
  player: Player,
  card: number,
  style: Style,
): { readonly index: number; readonly gain: number } | null {
  let best: { index: number; gain: number } | null = null;
  player.grid.forEach((slot, index) => {
    if (slot.state !== "gone") {
      const gain = placementGain(player, index, card, style);
      if (best === null || gain > best.gain) {
        best = { index, gain };
      }
    }
  });
  return best;
}

/**
 * How many points putting a card into a slot saves.
 *
 * @param player - the layout as it stands
 * @param index - the slot to fill
 * @param card - the card to put there
 * @returns the points saved; negative means it makes the layout worse
 */
function placementGain(
  player: Player,
  index: number,
  card: number,
  style: Style,
): number {
  const slot = player.grid[index];
  // A face-down card is worth its average, since nobody knows what it is.
  const replaced = slot.state === "down" ? UNKNOWN_VALUE : slot.value;
  const bonus = style.usesColumns ? columnBonus(player, index, card) : 0;
  return replaced - card + bonus;
}

/**
 * The extra worth of a card that completes a column.
 *
 * @returns the whole column's value, since all three cards leave the game
 */
function columnBonus(player: Player, index: number, card: number): number {
  const column = index % GRID_COLUMNS;
  const others = columnIndexes(column).filter((at) => at !== index);
  const slots = others.map((at) => player.grid[at]);
  const completes =
    slots.every((other) => other.state === "up" && other.value === card) &&
    player.grid[index].state !== "gone";
  return completes ? card * slots.length : 0;
}

/**
 * The face-down card worth turning up.
 *
 * @returns the slot to turn up, or null if none is left
 * @remarks
 * Prefers a column that already shows a good card: turning up next to a keeper
 * is where a matching pair would pay off most.
 */
function worstUnknown(player: Player): number | null {
  let best: number | null = null;
  let bestScore = -Infinity;
  player.grid.forEach((slot, index) => {
    if (slot.state === "down") {
      const score = flipAppeal(player, index);
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    }
  });
  return best;
}

/** How attractive turning up a particular face-down card is. */
function flipAppeal(player: Player, index: number): number {
  const column = index % GRID_COLUMNS;
  const others = columnIndexes(column)
    .filter((at) => at !== index)
    .map((at) => player.grid[at]);
  const shown = others.filter((slot) => slot.state === "up");
  const pair =
    shown.length === others.length &&
    shown.every((slot) => slot.value === shown[0].value);
  // A column already showing a matching pair could be cleared in one go.
  return pair ? Math.max(0, shown[0].value) : GOOD_CARD - shown.length;
}
