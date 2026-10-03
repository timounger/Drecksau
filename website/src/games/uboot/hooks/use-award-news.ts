/**
 * Was gerade frisch verdient wurde - für den Hinweis oben im Bild.
 *
 * @module
 * @remarks
 * **Aus dem Unterschied zweier Spielstände und nicht aus Rückrufen.** Eine
 * Auszeichnung wird nirgends "vergeben": Sie ergibt sich aus dem Profil, und
 * wer sie vergeben möchte, müsste an jede Stelle denken, die das Profil
 * anfasst - an das Vorbeifahren, an das Ziel, an die Werkstatt, an "alles
 * freischalten". Also wird hier nachgesehen, was seit eben dazugekommen ist;
 * damit ist jede Stelle abgedeckt, auch die nächste.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { AWARDS, isEarned, type Award } from "@/games/uboot/settings/awards";
import type { Profile } from "@/games/uboot/settings/profile";

/** Wie lange ein Hinweis stehen bleibt, in Millisekunden. */
export const AWARD_NEWS_MS = 4200;

/**
 * Wie viele Hinweise höchstens gleichzeitig stehen.
 *
 * @remarks
 * Drei. "Alles freischalten" verdient fünfzehn Auszeichnungen auf einmal, und
 * fünfzehn Zettel übereinander sind kein Hinweis mehr, sondern eine Wand.
 */
const MOST = 3;

/**
 * Welche Auszeichnungen gerade gemeldet werden wollen.
 *
 * @param profile - der Spieler, so wie er jetzt dasteht
 * @returns die frisch verdienten, in der Reihenfolge der Tafel
 */
export function useAwardNews(profile: Profile): readonly Award[] {
  const [fresh, setFresh] = useState<readonly Award[]>([]);
  // **Beim ersten Mal wird nur gemerkt, nicht gemeldet.** Sonst bekäme jeder,
  // der die Seite öffnet, seine halbe Tafel als Neuigkeit vorgesetzt.
  const knownRef = useRef<ReadonlySet<string> | null>(null);
  const key = AWARDS.filter((award) => isEarned(profile, award))
    .map((award) => award.id)
    .join(",");

  useEffect(() => {
    const now = new Set(key.length === 0 ? [] : key.split(","));
    const known = knownRef.current;
    knownRef.current = now;
    if (known !== null) {
      const added = AWARDS.filter(
        (award) => now.has(award.id) && !known.has(award.id),
      );
      if (added.length > 0) {
        setFresh((prev) => [...prev, ...added].slice(0, MOST));
      }
    }
  }, [key]);

  // Der älteste geht nach seiner Zeit, und der nächste rückt nach.
  useEffect(() => {
    if (fresh.length === 0) {
      return;
    }
    const timer = setTimeout(
      () => setFresh((prev) => prev.slice(1)),
      AWARD_NEWS_MS,
    );
    return () => clearTimeout(timer);
  }, [fresh]);

  return fresh;
}
