/**
 * The registry of the 26 Advent minigames, one per gate.
 *
 * @module
 * @remarks
 * Every gate has a folder `<nn>-<id>/` whose `index.ts` exports `GAME`.
 * Gates not built yet export a stand-in ("Kommt bald"), so this file never
 * changes when a minigame is added - only the folder does.
 */
import { GAME as GATE_01 } from "./01-geschenkeregen";
import { GAME as GATE_02 } from "./02-schneeballschlacht";
import { GAME as GATE_03 } from "./03-figuren-memory";
import { GAME as GATE_04 } from "./04-rudolfs-nachtflug";
import { GAME as GATE_05 } from "./05-spielzeugband";
import { GAME as GATE_06 } from "./06-grantelbarts-riff";
import { GAME as GATE_07 } from "./07-magische-perle";
import { GAME as GATE_08 } from "./08-rudolf-verschwunden";
import { GAME as GATE_09 } from "./09-gluecksbringer";
import { GAME as GATE_10 } from "./10-fliegender-teppich";
import { GAME as GATE_11 } from "./11-sternbilder";
import { GAME as GATE_12 } from "./12-zauberstab";
import { GAME as GATE_13 } from "./13-wachstumstrank";
import { GAME as GATE_14 } from "./14-neues-kostuem";
import { GAME as GATE_15 } from "./15-flugstunde";
import { GAME as GATE_16 } from "./16-troll-klopfen";
import { GAME as GATE_17 } from "./17-doppelgaenger";
import { GAME as GATE_18 } from "./18-zeitmaschine";
import { GAME as GATE_19 } from "./19-teddy-werkstatt";
import { GAME as GATE_20 } from "./20-weihnachtspost";
import { GAME as GATE_21 } from "./21-lichterkette";
import { GAME as GATE_22 } from "./22-flaschenpost";
import { GAME as GATE_23 } from "./23-schlittenrennen";
import { GAME as GATE_24 } from "./24-wunschzettel-raetsel";
import { GAME as GATE_25 } from "./25-laengste-nacht";
import { GAME as GATE_26 } from "./26-geheimnis";
import type { MiniGame } from "./types";

/** Every minigame, gate 1 first. */
export const MINIGAMES: readonly MiniGame[] = [
  GATE_01,
  GATE_02,
  GATE_03,
  GATE_04,
  GATE_05,
  GATE_06,
  GATE_07,
  GATE_08,
  GATE_09,
  GATE_10,
  GATE_11,
  GATE_12,
  GATE_13,
  GATE_14,
  GATE_15,
  GATE_16,
  GATE_17,
  GATE_18,
  GATE_19,
  GATE_20,
  GATE_21,
  GATE_22,
  GATE_23,
  GATE_24,
  GATE_25,
  GATE_26,
];

/**
 * The minigame behind a gate.
 *
 * @param number - the gate, 1 to 26
 * @returns its minigame (the first one for a number out of range)
 */
export function miniGame(number: number): MiniGame {
  return MINIGAMES.find((game) => game.number === number) ?? MINIGAMES[0];
}
