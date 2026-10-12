/**
 * What each side may know: the game as the detectives see it, and where
 * Mister X can be hiding by everything they have seen.
 *
 * @module
 * @remarks
 * At the table Mister X writes behind a screen. Here the game holds his
 * position, so every screen a detective looks at and every move the computer
 * makes for the detectives goes through {@link viewFor} first: a copy in which
 * his position and the stations of his log are gone, unless he showed himself.
 * The computer's detectives work from {@link hidingPlaces} on that copy - the
 * same deduction a player makes from the travel log, and nothing more.
 */
import { neighbours, type Transport } from "./map";
import { transportsFor } from "./moves";
import {
  INTRO_MISTER_X_START,
  MISTER_X_STARTS,
  type ScotlandYardGame,
  type Ticket,
} from "./state";

/**
 * The game as one player may see it.
 *
 * @param game - the full game
 * @param player - who is looking; null for somebody watching
 * @returns the full game for Mister X's player or once it is over, the
 *   detectives' copy otherwise
 */
export function viewFor(
  game: ScotlandYardGame,
  player: number | null,
): ScotlandYardGame {
  return game.phase === "over" ||
    game.hidden ||
    (player !== null && player === game.misterX.controller)
    ? game
    : redact(game);
}

/**
 * The detectives' copy of a game.
 *
 * @param game - the full game
 * @returns a copy with Mister X's position and unseen log stations removed
 */
export function redact(game: ScotlandYardGame): ScotlandYardGame {
  return game.hidden
    ? game
    : {
        ...game,
        misterX: { ...game.misterX, position: shownPosition(game) },
        log: game.log.map((entry) =>
          entry.shown ? entry : { ...entry, station: null },
        ),
        hidden: true,
      };
}

/**
 * Where everybody can see Mister X standing right now.
 *
 * @param game - the game, full or redacted
 * @returns his station while it is in plain view, otherwise null
 * @remarks
 * In the standard game his piece goes on the board after a showing move and
 * comes off again with the next. In the introductory game he is in view all
 * along, from his start on, except after an unseen move.
 */
export function shownPosition(game: ScotlandYardGame): number | null {
  const last = game.log.at(-1);
  let position: number | null;
  if (last === undefined) {
    position = game.variant === "intro" ? INTRO_MISTER_X_START : null;
  } else {
    position = last.shown ? last.station : null;
  }
  return position;
}

/**
 * Where Mister X was last seen.
 *
 * @param game - the game, full or redacted
 * @returns the station and the number of the move he showed himself on, or
 *   null if he has not yet been seen
 */
export function lastSeen(
  game: ScotlandYardGame,
): { readonly station: number; readonly move: number } | null {
  let seen: { readonly station: number; readonly move: number } | null =
    game.variant === "intro"
      ? { station: INTRO_MISTER_X_START, move: 0 }
      : null;
  game.log.forEach((entry, index) => {
    if (entry.shown && entry.station !== null) {
      seen = { station: entry.station, move: index + 1 };
    }
  });
  return seen;
}

/**
 * Every station Mister X can be at, by what the detectives know.
 *
 * @param game - the game; only the parts a detective sees are read
 * @returns the possible stations, smallest first
 * @remarks
 * Starts from where he was last seen - or, before that, from every start
 * card - and follows each ticket of his log since: a taxi ticket to every
 * taxi stop one ride on, a black one by any line, the ferry included. A
 * station a detective stands on now is ruled out, since he would have been
 * caught there.
 */
export function hidingPlaces(game: ScotlandYardGame): readonly number[] {
  const seen = lastSeen(game);
  let places: Set<number> = new Set(
    seen === null ? MISTER_X_STARTS : [seen.station],
  );
  const from = seen === null ? 0 : seen.move;
  const lines = transportsFor(game);
  for (const entry of game.log.slice(from)) {
    const next = new Set<number>();
    const ways = waysFor(entry.ticket, lines);
    for (const station of places) {
      for (const transport of ways) {
        for (const to of neighbours(station, transport)) {
          next.add(to);
        }
      }
    }
    places = next;
  }
  const taken = new Set(game.detectives.map((piece) => piece.position));
  return [...places]
    .filter((station) => !taken.has(station))
    .toSorted((one, other) => one - other);
}

/**
 * The lines a log ticket may stand for.
 *
 * @param ticket - the ticket on the log, null where none can be seen
 * @param lines - the lines of the variant
 * @returns the transport it names, or every line for a black or unseen one
 */
function waysFor(
  ticket: Ticket | null,
  lines: readonly Transport[],
): readonly Transport[] {
  return ticket === null || ticket === "black"
    ? lines
    : lines.filter((line) => line === ticket);
}
