/**
 * React context that carries the chosen Binokel {@link BinokelNaming} down to
 * the presentational parts, so every suit/rank/meld label reads the same names.
 *
 * @module
 * @remarks
 * The game and the online board build the naming from the stored settings and
 * wrap their tree in {@link BinokelNamingProvider}; the parts read it with
 * {@link useBinokelNaming}. Outside a provider the default names are used.
 */
import { createContext, useContext } from "react";
import { defaultNaming, type BinokelNaming } from "@/games/binokel/i18n/naming";

/** Carries the chosen names; defaults to the first name of each. */
const BinokelNamingContext = createContext<BinokelNaming>(defaultNaming());

/** Provides the chosen names to everything below it. */
export const BinokelNamingProvider = BinokelNamingContext.Provider;

/** Reads the chosen names for suits, the ace and the trump seven. */
export function useBinokelNaming(): BinokelNaming {
  return useContext(BinokelNamingContext);
}
