/**
 * Hält den Tongeber an den beiden Reglern.
 *
 * @module
 * @remarks
 * Eigener Haken, weil zwei Dinge zusammenkommen müssen, die sonst nichts
 * miteinander zu tun haben: die gespeicherten Lautstärken (React, über einen
 * externen Store) und der Tongeber (kein React, sondern Web Audio). Sobald
 * jemand einen Regler bewegt - auch in einem anderen Blatt desselben Spiels -
 * hört der Ton es hier und stellt sich um.
 */
"use client";

import { useEffect, useSyncExternalStore } from "react";
import { setLevels } from "@/games/uboot/audio/sounds";
import { musicVolume, soundVolume } from "@/games/uboot/settings/volume";

/**
 * Meldet die Regler beim Tongeber an.
 *
 * @returns die beiden Lautstärken, falls jemand sie anzeigen will
 */
export function useVolumes(): {
  readonly music: number;
  readonly sound: number;
} {
  const music = useSyncExternalStore(
    musicVolume.subscribe,
    musicVolume.getSnapshot,
    musicVolume.getServerSnapshot,
  );
  const sound = useSyncExternalStore(
    soundVolume.subscribe,
    soundVolume.getSnapshot,
    soundVolume.getServerSnapshot,
  );

  useEffect(() => {
    setLevels(music, sound);
  }, [music, sound]);

  return { music, sound };
}
