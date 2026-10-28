/**
 * The stand-in for a gate whose minigame is not built yet: "Kommt bald".
 *
 * @module
 * @remarks
 * The host shows its title card with the planned idea and no Start button;
 * it can never be won, so the gate stays shut. Replace the folder's
 * `index.ts` with the real game to fill the gate.
 */
import { MINI_H, MINI_W, type MiniGame } from "../types";
import { drawSky, drawSnowfall } from "./draw";

/** What the stand-in says. */
const SOON = "Kommt bald";

/** Size of its text, logical px. */
const SOON_SIZE = 16;

/**
 * A stand-in minigame.
 *
 * @param number - the gate
 * @param id - the planned folder id
 * @param title - the planned German name
 * @param idea - one German line about what it will be
 * @returns a minigame that only says "Kommt bald"
 */
export function placeholder(
  number: number,
  id: string,
  title: string,
  idea: string,
): MiniGame {
  return {
    number,
    id,
    title,
    instructions: [idea, "Dieses Türchen wird gerade noch gebaut."],
    controls: SOON,
    ready: false,
    create: () => ({
      step: () => "running",
      draw: (g) => {
        drawSky(g.ctx, "#1a2450", "#3a4a8a");
        drawSnowfall(g.ctx, g.time);
        g.text(SOON, MINI_W / 2, MINI_H / 2, {
          size: SOON_SIZE,
          bold: true,
          align: "center",
          baseline: "middle",
          color: "#ffe9a8",
        });
      },
    }),
  };
}
