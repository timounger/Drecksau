/**
 * A live count of how many players are on a game's online screen.
 *
 * @module
 * @remarks
 * Each client marks itself present under `rooms/{gameId}-__presence/{uid}` and
 * clears the mark automatically when the tab drops off the network. Counting the
 * children gives "how many are online right now". The node lives under `rooms/`
 * on purpose: the database's security rules grant read/write there per room key,
 * and the double-underscore key can never collide with a real four-letter room
 * code, so no rule change is needed to add this.
 */
import {
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
  type Database,
} from "firebase/database";

/** The presence node for one game - its children are the present players. */
function presencePath(gameId: string): string {
  return `rooms/${gameId}-__presence`;
}

/**
 * Marks this player present until the tab closes.
 *
 * @param database - the Realtime Database handle
 * @param gameId - which game's online screen the player is on
 * @param uid - this player's anonymous id
 * @returns a cleanup that clears the mark and cancels the disconnect handler
 */
export function trackPresence(
  database: Database,
  gameId: string,
  uid: string,
): () => void {
  const meRef = ref(database, `${presencePath(gameId)}/${uid}`);
  // Clear the mark both on an orderly leave and on a dropped connection.
  void onDisconnect(meRef).remove();
  void set(meRef, true);
  return () => {
    void onDisconnect(meRef).cancel();
    void remove(meRef);
  };
}

/**
 * Subscribes to how many players are currently online for a game.
 *
 * @param database - the Realtime Database handle
 * @param gameId - which game to count
 * @param onCount - called with the current count whenever it changes
 * @returns an unsubscribe function
 */
export function watchOnlineCount(
  database: Database,
  gameId: string,
  onCount: (count: number) => void,
): () => void {
  return onValue(ref(database, presencePath(gameId)), (snapshot) => {
    const value = snapshot.val();
    const count =
      value !== null && typeof value === "object"
        ? Object.keys(value as Record<string, unknown>).length
        : 0;
    onCount(count);
  });
}
