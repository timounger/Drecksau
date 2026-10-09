/**
 * Which colour each seat plays in - with the player's own colour of choice.
 *
 * @module
 * @remarks
 * The player always sits in the first seat; what the settings change is only
 * the colour that seat is drawn in. The chosen colour and the first one simply
 * trade places, so whoever would have worn the chosen colour wears green
 * instead, and no two seats ever share a colour.
 *
 * Handed down through a context rather than a prop through every component:
 * the board, the standings and the pieces all ask the same question. Without a
 * provider - the online table - the colours are the printed ones.
 */
"use client";

import { createContext, useContext } from "react";
import { SEAT_COLOURS, type SeatColour } from "@/games/dog/i18n/texts";

/** The colours of the seats, in seat order. */
const SeatColoursContext = createContext<readonly SeatColour[]>(SEAT_COLOURS);

/** Hands the colours down to everything inside. */
export const SeatColoursProvider = SeatColoursContext.Provider;

/**
 * The colours of the seats, as the nearest provider has them.
 *
 * @returns one colour per seat, in seat order
 */
export function useSeatColours(): readonly SeatColour[] {
  return useContext(SeatColoursContext);
}

/**
 * The seat colours with the player's choice in the first seat.
 *
 * @param choice - the colour the player wants, as an index into
 *   {@link SEAT_COLOURS}
 * @returns the palette with that colour and the first one swapped
 */
export function coloursFor(choice: number): readonly SeatColour[] {
  const mine = SEAT_COLOURS[choice];
  const first = SEAT_COLOURS[0];
  return mine === undefined || first === undefined
    ? SEAT_COLOURS
    : SEAT_COLOURS.map((colour, at) => {
        let worn = colour;
        if (at === 0) {
          worn = mine;
        } else if (at === choice) {
          worn = first;
        }
        return worn;
      });
}
