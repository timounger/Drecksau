/**
 * The order the seats are shown in: the reader's own first.
 *
 * @module
 * @remarks
 * Offline you are seat 0 and this changes nothing. Online the seats are handed
 * out in whatever order people happened to join, so without it your own sheet,
 * block or hand turns up somewhere different in every room - and in a game
 * where you spend the whole time looking at one of them, that is the wrong
 * thing to have to search for.
 */

/**
 * The seats in display order, starting with the reader's own.
 *
 * @param count - how many players are at the table
 * @param mySeat - the seat the reader plays, or null while only watching
 * @returns the seat numbers in the order they should be shown
 * @remarks
 * Rotated, not sorted. Your own comes first because it is the one you act on,
 * and the others keep their turn order behind it, so who plays after whom still
 * reads straight down the list. A watcher gets the table's own order.
 */
export function seatsFromMine(
  count: number,
  mySeat: number | null,
): readonly number[] {
  const first = mySeat ?? 0;
  return Array.from(
    { length: count },
    (unused, index) => (first + index) % count,
  );
}
