/**
 * Türchen 21 - Die Lichterkette: the fairy lights lie in pieces on the rug;
 * turn the cable pieces until the power runs from the plug to the tree.
 *
 * @module
 * @remarks
 * {@link BOARDS} boards, each a little bigger. A board is made from the
 * run's seed: a winding way from the plug's row on the left to the tree's
 * row on the right, laid with straight and bent pieces, the rest filled with
 * random pieces; then every piece is turned at random. Any way that brings
 * the power to the tree counts. Pieces with power light up.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import {
  drawGlow,
  drawHud,
  drawSprite,
  drawSpriteCentred,
  HUD_H,
  loadSheet,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom, type Random } from "../kit/random";
import {
  MINI_W,
  type MiniButton,
  type MiniDraw,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniPoint,
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Columns and rows of each board. */
const BOARDS: readonly { readonly cols: number; readonly rows: number }[] = [
  { cols: 4, rows: 3 },
  { cols: 5, rows: 3 },
  { cols: 5, rows: 4 },
  { cols: 6, rows: 4 },
];

/** Seconds on the clock for all boards together. */
const TIME = 90;

/** Size of a tile, logical px. */
const TILE = 26;

/** Middle of the boards, logical px. */
const BOARD_MIDDLE_X = 160;
const BOARD_MIDDLE_Y = 112;

/** Openings of a piece: one bit per side. */
const UP = 1;
const RIGHT = 2;
const DOWN = 4;
const LEFT = 8;

/** All four sides together. */
const ALL_SIDES = UP | RIGHT | DOWN | LEFT;

/** Bits to shift when turning a quarter clockwise, and back round. */
const SIDES = 4;

/** The plain pieces, turned 0, as openings. */
const STRAIGHT = UP | DOWN;
const BENT = UP | RIGHT;
const TEE = UP | RIGHT | DOWN;

/** Chances of the filler pieces off the way: straight, bent, rest tees. */
const FILL_STRAIGHT = 0.35;
const FILL_BENT = 0.4;

/** A way must be at least this many tiles longer than the board is wide. */
const DETOUR = 2;

/** Tries to find a winding way before a plain one is taken. */
const WAY_TRIES = 60;

/** Seconds a quarter turn takes on screen. */
const TURN_TIME = 0.12;

/** Seconds the tree shines before the next board. */
const SHINE = 1.6;

/** Seconds a new board takes to fade in. */
const FADE_IN = 0.3;

/** Sparks when the tree lights up. */
const TREE_BURST = 36;

/** Size of the HUD hint, logical px. */
const HINT_SIZE = 7;

/** How the tree sits next to its row: its cable is this far below its top. */
const TREE_CABLE = 61.5;

/** Gap between the board and the tree, logical px. */
const TREE_LEFT = 8;

/** How the socket sits left of the board, logical px. */
const SOCKET_GAP = 30;

/** The four sides with their step on the board. */
const STEPS: readonly { side: number; dx: number; dy: number }[] = [
  { side: UP, dx: 0, dy: -1 },
  { side: RIGHT, dx: 1, dy: 0 },
  { side: DOWN, dx: 0, dy: 1 },
  { side: LEFT, dx: -1, dy: 0 },
];

/* eslint-disable @typescript-eslint/no-magic-numbers -- the sounds: pitches
   in Hz, times in seconds, loudness shares */
/** A piece clicking round. */
const TURN_SOUND: Recipe = {
  tones: [["square", 700, 520, 0.04, 0, 0.25]],
  noise: [[0.03, 0, 3000, 0.25]],
};

/** The power humming into the tree. */
const LIGHTS_ON: Recipe = {
  tones: [
    ["sine", 523, 523, 0.12, 0, 0.5],
    ["sine", 659, 659, 0.12, 0.08, 0.5],
    ["sine", 784, 784, 0.12, 0.16, 0.5],
    ["triangle", 1047, 1047, 0.5, 0.24, 0.6],
    ["sine", 2093, 2093, 0.4, 0.24, 0.15],
  ],
  noise: [[0.25, 0, 6000, 0.15]],
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One board in play. */
type Board = {
  readonly cols: number;
  readonly rows: number;
  /** Openings of each piece as it lies now. */
  readonly pieces: number[];
  /** Row of the plug on the left and of the tree on the right. */
  readonly startRow: number;
  readonly endRow: number;
  /** Seconds left of each piece's turning on screen, and which way. */
  readonly turning: { left: number; dir: number }[];
};

/** The minigame behind gate 21. */
export const GAME: MiniGame = {
  number: 21,
  id: "lichterkette",
  title: "Die Lichterkette",
  instructions: [
    "Die Lichterkette ist ganz durcheinander - der Baum bleibt dunkel!",
    "Dreh die Kabelstücke, bis der Strom vom Stecker links bis zum Baum rechts fließt. Stücke mit Strom leuchten.",
    `Bring ${String(BOARDS.length)} Bäume zum Leuchten, bevor die ${String(TIME)} Sekunden um sind.`,
  ],
  controls:
    "Stück anklicken oder antippen dreht es - oder Pfeile wählen, Leertaste dreht (R andersherum).",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  let level = 0;
  let board = makeBoard(random, level);
  let powered = flood(board);
  let cursor = 0;
  let lastPointer: MiniPoint | null = null;
  let shineLeft = 0;
  let fadeLeft = FADE_IN;
  let turns = 0;
  let timeLeft = TIME;
  let status: MiniStatus = "running";

  const turn = (cell: number, dir: number) => {
    board.pieces[cell] = rotate(board.pieces[cell], dir);
    board.turning[cell] = { left: TURN_TIME, dir };
    turns += 1;
    sound(TURN_SOUND);
    const before = powered.size;
    powered = flood(board);
    if (powered.size > before) {
      sound("tick");
    }
    if (lit(board, powered)) {
      shineLeft = SHINE;
      sound(LIGHTS_ON);
      const tree = treeSpot(board);
      effects.burst(tree.x, tree.y - TREE_CABLE / 2, {
        count: TREE_BURST,
        speed: 90,
      });
      effects.float("Es leuchtet!", tree.x, tree.y - TREE_CABLE - TILE / 2);
    }
  };

  const listen = (input: MiniInput) => {
    const count = board.cols * board.rows;
    const moves: [MiniButton, number][] = [
      ["left", -1],
      ["right", 1],
      ["up", -board.cols],
      ["down", board.cols],
    ];
    for (const [button, delta] of moves) {
      if (input.pressed.has(button)) {
        cursor = (cursor + delta + count) % count;
      }
    }
    const pointer = input.pointer;
    const moved =
      pointer !== null &&
      (lastPointer === null ||
        pointer.x !== lastPointer.x ||
        pointer.y !== lastPointer.y);
    lastPointer = pointer;
    if (moved) {
      const hover = cellAt(board, pointer);
      cursor = hover >= 0 ? hover : cursor;
    }
    if (input.pressed.has("action")) {
      turn(cursor, 1);
    }
    if (input.pressed.has("alt")) {
      turn(cursor, -1);
    }
    for (const tap of input.taps) {
      const cell = cellAt(board, tap);
      if (cell >= 0 && shineLeft <= 0) {
        cursor = cell;
        turn(cell, 1);
      }
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        if (shineLeft > 0) {
          shineLeft -= dt;
          if (shineLeft <= 0) {
            level += 1;
            if (level >= BOARDS.length) {
              status = "won";
              level = BOARDS.length - 1;
              shineLeft = SHINE;
            } else {
              board = makeBoard(random, level);
              powered = flood(board);
              cursor = Math.min(cursor, board.cols * board.rows - 1);
              fadeLeft = FADE_IN;
              sound("whoosh");
            }
          }
        } else {
          timeLeft -= dt;
          listen(input);
          if (shineLeft <= 0 && timeLeft <= 0) {
            timeLeft = 0;
            status = "lost";
          }
        }
      }
      for (const spin of board.turning) {
        spin.left = Math.max(0, spin.left - dt);
      }
      fadeLeft = Math.max(0, fadeLeft - dt);
      effects.update(dt);
      return status;
    },
    draw(g) {
      drawSprite(g.ctx, sheet, SPRITES.backdrop, 0, 0);
      drawRoom(g, sheet, {
        board,
        powered,
        cursor: shineLeft > 0 ? -1 : cursor,
        shining: shineLeft > 0 || status === "won",
        fade: fadeLeft / FADE_IN,
      });
      effects.draw(g);
      drawHud(g, {
        score: Math.min(level + (lit(board, powered) ? 1 : 0), BOARDS.length),
        goal: BOARDS.length,
        scoreLabel: "Bäume",
        time: timeLeft,
      });
      g.text(
        `Gitter ${String(level + 1)} von ${String(BOARDS.length)}`,
        MINI_W / 2,
        HUD_H / 2,
        {
          size: HINT_SIZE,
          bold: true,
          align: "center",
          baseline: "middle",
          color: "#e8dcc8",
        },
      );
    },
    summary() {
      const done = Math.min(
        level + (lit(board, powered) ? 1 : 0),
        BOARDS.length,
      );
      return `${String(done)} von ${String(BOARDS.length)} Bäumen leuchten, ${String(turns)} Drehungen.`;
    },
  };
}

/**
 * Openings of a piece turned by quarters.
 *
 * @param mask - the openings
 * @param quarters - quarter turns, clockwise positive
 * @returns the openings after turning
 */
function rotate(mask: number, quarters: number): number {
  const k = ((quarters % SIDES) + SIDES) % SIDES;
  return ((mask << k) | (mask >> (SIDES - k))) & ALL_SIDES;
}

/** The side facing the other way. */
function opposite(side: number): number {
  return rotate(side, 2);
}

/**
 * A new board: a winding way from the plug to the tree, random pieces
 * around it, everything turned at random (but not already solved).
 *
 * @param random - the run's random source
 * @param level - which board, from 0
 * @returns the board
 */
function makeBoard(random: Random, level: number): Board {
  const { cols, rows } = BOARDS[level];
  const startRow = random.int(0, rows);
  const endRow = random.int(0, rows);
  const way = findWay(random, cols, rows, startRow, endRow);
  const pieces = Array.from({ length: cols * rows }, () => {
    const roll = random.next();
    let shape = TEE;
    if (roll < FILL_STRAIGHT) {
      shape = STRAIGHT;
    } else if (roll < FILL_STRAIGHT + FILL_BENT) {
      shape = BENT;
    }
    return shape;
  });
  way.forEach((cell, k) => {
    const into = k === 0 ? LEFT : sideTowards(cols, cell, way[k - 1]);
    const out =
      k === way.length - 1 ? RIGHT : sideTowards(cols, cell, way[k + 1]);
    pieces[cell] = into | out;
  });
  const board: Board = {
    cols,
    rows,
    pieces: pieces.map((mask) => rotate(mask, random.int(0, SIDES))),
    startRow,
    endRow,
    turning: pieces.map(() => ({ left: 0, dir: 1 })),
  };
  while (lit(board, flood(board))) {
    const cell = random.pick(way);
    board.pieces[cell] = rotate(board.pieces[cell], 1);
  }
  return board;
}

/**
 * A way of neighbouring cells from the left end of one row to the right end
 * of another, winding a little where it can.
 *
 * @param random - the run's random source
 * @param cols - columns of the board
 * @param rows - rows of the board
 * @param startRow - the plug's row
 * @param endRow - the tree's row
 * @returns the cells, plug side first
 */
function findWay(
  random: Random,
  cols: number,
  rows: number,
  startRow: number,
  endRow: number,
): number[] {
  const start = startRow * cols;
  const end = endRow * cols + cols - 1;
  let best: number[] = [];
  for (let k = 0; k < WAY_TRIES && best.length < cols + DETOUR; k += 1) {
    const way = walk(random, cols, rows, start, end);
    best = way.length > best.length ? way : best;
  }
  return best;
}

/** One random walk without crossing itself; backtracks when stuck. */
function walk(
  random: Random,
  cols: number,
  rows: number,
  start: number,
  end: number,
): number[] {
  const way = [start];
  const seen = new Set([start]);
  const tried = new Map<number, Set<number>>();
  while (way.length > 0 && way[way.length - 1] !== end) {
    const here = way[way.length - 1];
    const done = tried.get(here) ?? new Set<number>();
    tried.set(here, done);
    const options = random
      .shuffle(STEPS)
      .map((step) => ({
        x: (here % cols) + step.dx,
        y: Math.floor(here / cols) + step.dy,
      }))
      .filter((p) => p.x >= 0 && p.x < cols && p.y >= 0 && p.y < rows)
      .map((p) => p.y * cols + p.x)
      .filter((cell) => !seen.has(cell) && !done.has(cell));
    if (options.length === 0) {
      seen.delete(here);
      tried.delete(here);
      way.pop();
    } else {
      const next = options[0];
      done.add(next);
      seen.add(next);
      way.push(next);
    }
  }
  return way;
}

/** The side of a cell that faces a neighbouring cell. */
function sideTowards(cols: number, cell: number, other: number): number {
  const dx = (other % cols) - (cell % cols);
  const dy = Math.floor(other / cols) - Math.floor(cell / cols);
  return STEPS.find((step) => step.dx === dx && step.dy === dy)?.side ?? 0;
}

/**
 * The cells the power reaches from the plug.
 *
 * @param board - the board
 * @returns the cells with power
 */
function flood(board: Board): Set<number> {
  const start = board.startRow * board.cols;
  const reached = new Set<number>();
  if (board.pieces[start] & LEFT) {
    reached.add(start);
    const queue = [start];
    for (let k = 0; k < queue.length; k += 1) {
      const cell = queue[k];
      for (const step of STEPS) {
        const x = (cell % board.cols) + step.dx;
        const y = Math.floor(cell / board.cols) + step.dy;
        const next = y * board.cols + x;
        const inside = x >= 0 && x < board.cols && y >= 0 && y < board.rows;
        if (
          inside &&
          !reached.has(next) &&
          board.pieces[cell] & step.side &&
          board.pieces[next] & opposite(step.side)
        ) {
          reached.add(next);
          queue.push(next);
        }
      }
    }
  }
  return reached;
}

/** Whether the power reaches the tree. */
function lit(board: Board, powered: ReadonlySet<number>): boolean {
  const end = board.endRow * board.cols + board.cols - 1;
  return powered.has(end) && (board.pieces[end] & RIGHT) !== 0;
}

/** Top left of a board, logical px. */
function boardOrigin(board: Board): MiniPoint {
  return {
    x: BOARD_MIDDLE_X - (board.cols * TILE) / 2,
    y: BOARD_MIDDLE_Y - (board.rows * TILE) / 2,
  };
}

/** The cell under a point, or -1. */
function cellAt(board: Board, point: MiniPoint): number {
  const origin = boardOrigin(board);
  const x = Math.floor((point.x - origin.x) / TILE);
  const y = Math.floor((point.y - origin.y) / TILE);
  return x >= 0 && x < board.cols && y >= 0 && y < board.rows
    ? y * board.cols + x
    : -1;
}

/** Where the tree's cable meets the board's right edge, logical px. */
function treeSpot(board: Board): MiniPoint {
  const origin = boardOrigin(board);
  return {
    x: origin.x + board.cols * TILE + TREE_LEFT + SPRITES.treeLit[2] / 2,
    y: origin.y + board.endRow * TILE + TILE / 2,
  };
}

/** What the room needs to know. */
type RoomState = {
  readonly board: Board;
  readonly powered: ReadonlySet<number>;
  readonly cursor: number;
  readonly shining: boolean;
  /** 1 just after a new board appeared, down to 0. */
  readonly fade: number;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   animation, picked by eye */
/** The socket, the board with its pieces, the cursor and the tree. */
function drawRoom(g: MiniDraw, sheet: HTMLImageElement, s: RoomState): void {
  const ctx = g.ctx;
  const board = s.board;
  const origin = boardOrigin(board);
  const startY = origin.y + board.startRow * TILE + TILE / 2;
  const endY = origin.y + board.endRow * TILE + TILE / 2;
  const right = origin.x + board.cols * TILE;
  const tree = treeSpot(board);
  // The socket with the plug, and its cable to the board.
  const socket = SPRITES.socket;
  const socketX = origin.x - SOCKET_GAP;
  ctx.fillStyle = "#2e6a3a";
  ctx.fillRect(
    socketX + socket[2] - 1,
    startY - 1.5,
    origin.x - socketX - socket[2] + 1,
    3,
  );
  drawSprite(ctx, sheet, socket, socketX, startY - 10);
  drawGlow(
    ctx,
    socketX + 8,
    startY,
    10,
    "255, 230, 120",
    0.25 + Math.sin(g.time * 5) * 0.1,
  );
  // The cable from the board to the tree.
  ctx.fillStyle = "#2e6a3a";
  ctx.fillRect(right, endY - 1.5, TREE_LEFT + 2, 3);
  ctx.globalAlpha = 1 - s.fade;
  for (let cell = 0; cell < board.pieces.length; cell += 1) {
    const x = origin.x + (cell % board.cols) * TILE;
    const y = origin.y + Math.floor(cell / board.cols) * TILE;
    drawSprite(ctx, sheet, SPRITES.tile, x, y);
    const on = s.powered.has(cell);
    const name =
      `wire${String(board.pieces[cell])}${on ? "Lit" : ""}` as SpriteName;
    const spin = board.turning[cell];
    const angle =
      spin.left > 0 ? -(spin.left / TURN_TIME) * (Math.PI / 2) * spin.dir : 0;
    if (on) {
      drawGlow(
        ctx,
        x + TILE / 2,
        y + TILE / 2,
        16,
        "255, 230, 140",
        0.18 + Math.sin(g.time * 6 + cell) * 0.05,
      );
    }
    drawSpriteCentred(
      ctx,
      sheet,
      SPRITES[name],
      x + TILE / 2,
      y + TILE / 2,
      1,
      angle,
    );
  }
  ctx.globalAlpha = 1;
  if (s.cursor >= 0) {
    const frame = SPRITES.cursor;
    drawSprite(
      ctx,
      sheet,
      frame,
      origin.x + (s.cursor % board.cols) * TILE - 1,
      origin.y + Math.floor(s.cursor / board.cols) * TILE - 1,
    );
  }
  // The tree, dark until the power arrives.
  const sprite = s.shining ? SPRITES.treeLit : SPRITES.treeDark;
  if (s.shining) {
    drawGlow(
      ctx,
      tree.x,
      endY - 34,
      46,
      "255, 220, 120",
      0.35 + Math.sin(g.time * 7) * 0.1,
    );
  }
  drawSprite(ctx, sheet, sprite, right + TREE_LEFT, endY - TREE_CABLE);
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
