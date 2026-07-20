/**
 * A React hook for the live "how many are online" count.
 *
 * @module
 * @remarks
 * Signs the player in, marks them present (so they count too), and subscribes to
 * the total for the game. Meant for the online entry screen; it stays mounted
 * from there through the lobby and the game, so the player keeps counting as long
 * as they are online.
 */
"use client";

import { useEffect, useState } from "react";
import { database, signIn } from "./firebase-app";
import { trackPresence, watchOnlineCount } from "./presence";

/**
 * The number of players currently on a game's online screens.
 *
 * @param gameId - which game to count
 * @returns the count, or null while still connecting
 */
export function useOnlineCount(gameId: string): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let stopWatch: (() => void) | null = null;
    let stopPresence: (() => void) | null = null;

    void signIn()
      .then((uid) => {
        if (cancelled) {
          return;
        }
        const db = database();
        stopPresence = trackPresence(db, gameId, uid);
        stopWatch = watchOnlineCount(db, gameId, (next) => {
          if (!cancelled) {
            setCount(next);
          }
        });
      })
      .catch(() => {
        // Offline or misconfigured Firebase: just show nothing, no crash.
      });

    return () => {
      cancelled = true;
      stopWatch?.();
      stopPresence?.();
    };
  }, [gameId]);

  return count;
}
