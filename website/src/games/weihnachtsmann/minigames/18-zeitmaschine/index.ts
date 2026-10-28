/**
 * Türchen 18 - Jordis Zeitmaschine: the time machine has scrambled its
 * Christmas picture into a sliding puzzle; slide the eight tiles back in
 * order before the clock runs out.
 *
 * @module
 * @remarks
 * A 3 x 3 board with one gap. The board is scrambled by {@link SCRAMBLE}
 * random legal slides from the solved picture, so it can always be solved.
 * The machine's screen shows the picture as it should be, and every tile
 * carries a small number for those who prefer counting.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import { OBJECTS } from "@/games/weihnachtsmann/components/sprite-atlas";
import {
  drawFigure,
  drawGlow,
  drawHud,
  drawSprite,
  HUD_H,
  inside,
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

/** Tiles per side. */
const SIDE = 3;

/** Cells on the board; the last one is the gap when solved. */
const CELLS = SIDE * SIDE;

/** The gap's tile number. */
const GAP = CELLS - 1;

/** Seconds on the clock. */
const TIME = 90;

/** Random slides from the solved picture. */
const SCRAMBLE = 16;

/** The scramble is repeated until the tiles are at least this far off in sum. */
const MIN_DISORDER = 8;

/** Size of one tile, logical px. */
const TILE = 44;

/** Top left of the board, logical px. */
const BOARD_X = 170;
const BOARD_Y = 30;

/** Seconds a slide takes on screen. */
const SLIDE = 0.09;

/** Seconds of celebration after solving before the result. */
const OUTRO = 1.6;

/** Seconds the gap's own tile takes to fade in when solved. */
const FADE_IN = 0.5;

/** Sparks when the picture is complete. */
const DONE_BURST = 40;

/** Sparks when a tile lands on its own place. */
const PLACE_BURST = 6;

/** Size of the move count and of the "solved" text, logical px. */
const MOVES_SIZE = 7;
const TITLE_SIZE = 10;

/** One step on the board for each arrow: the gap moves the other way. */
const ARROWS: readonly { button: MiniButton; dx: number; dy: number }[] = [
  { button: "left", dx: -1, dy: 0 },
  { button: "right", dx: 1, dy: 0 },
  { button: "up", dx: 0, dy: -1 },
  { button: "down", dx: 0, dy: 1 },
];

/* eslint-disable @typescript-eslint/no-magic-numbers -- the sounds: pitches
   in Hz, times in seconds, loudness shares */
/** A wooden tile sliding into place. */
const SLIDE_SOUND: Recipe = {
  tones: [["triangle", 240, 180, 0.07, 0, 0.5]],
  noise: [[0.06, 0, 1400, 0.35]],
};

/** The time machine whirring up. */
const WHIRR: Recipe = {
  tones: [
    ["sawtooth", 110, 440, 0.8, 0, 0.18],
    ["sine", 220, 880, 0.8, 0, 0.3],
    ["triangle", 1047, 1047, 0.4, 0.8, 0.5],
    ["triangle", 1319, 1319, 0.5, 0.9, 0.4],
  ],
  noise: [[0.8, 0, 3000, 0.2]],
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** A tile's slide on screen: where it came from, logical px offset. */
type Slide = { dx: number; dy: number; left: number };

/** The minigame behind gate 18. */
export const GAME: MiniGame = {
  number: 18,
  id: "zeitmaschine",
  title: "Jordis Zeitmaschine",
  instructions: [
    "Jordis Zeitmaschine hat das Weihnachtsbild durcheinandergewirbelt!",
    "Schieb die Teile in die Lücke, bis das Bild wieder stimmt - wie auf dem Bildschirm der Maschine. Die Zahlen helfen: 1 bis 8 der Reihe nach.",
    `Du hast ${String(TIME)} Sekunden.`,
  ],
  controls:
    "Pfeile schieben ein Teil in die Lücke - oder ein Teil anklicken oder antippen.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const board = scramble(random);
  const slides: Slide[] = Array.from({ length: CELLS }, () => ({
    dx: 0,
    dy: 0,
    left: 0,
  }));
  let timeLeft = TIME;
  let moves = 0;
  let solvedAt = -1;
  let clock = 0;
  let hover: MiniPoint | null = null;
  let status: MiniStatus = "running";

  /** Slides the tile at a cell next to the gap into it. */
  const slideFrom = (cell: number) => {
    const gap = board.indexOf(GAP);
    const tile = board[cell];
    board[gap] = tile;
    board[cell] = GAP;
    slides[tile] = {
      dx: ((cell % SIDE) - (gap % SIDE)) * TILE,
      dy: (Math.floor(cell / SIDE) - Math.floor(gap / SIDE)) * TILE,
      left: SLIDE,
    };
    moves += 1;
    sound(SLIDE_SOUND);
    if (tile === gap) {
      const { x, y } = cellCentre(gap);
      effects.burst(x, y, { count: PLACE_BURST, speed: 40 });
      sound("tick");
    }
  };

  /** Slides the row or column between a tapped cell and the gap. */
  const pushTowardsGap = (cell: number) => {
    const gap = board.indexOf(GAP);
    const sameRow = Math.floor(cell / SIDE) === Math.floor(gap / SIDE);
    const sameColumn = cell % SIDE === gap % SIDE;
    if (cell !== gap && (sameRow || sameColumn)) {
      const step = sameRow ? 1 : SIDE;
      const towards = cell > gap ? step : -step;
      let at = gap;
      while (at !== cell) {
        at += towards;
        slideFrom(at);
      }
    } else {
      sound("bump");
    }
  };

  const listen = (input: MiniInput) => {
    for (const arrow of ARROWS) {
      if (input.pressed.has(arrow.button)) {
        const gap = board.indexOf(GAP);
        const gx = (gap % SIDE) - arrow.dx;
        const gy = Math.floor(gap / SIDE) - arrow.dy;
        if (gx >= 0 && gx < SIDE && gy >= 0 && gy < SIDE) {
          slideFrom(gy * SIDE + gx);
        } else {
          sound("bump");
        }
      }
    }
    for (const tap of input.taps) {
      const cell = cellAt(tap.x, tap.y);
      if (cell >= 0) {
        pushTowardsGap(cell);
      }
    }
  };

  return {
    step(input, dt) {
      clock += dt;
      if (status === "running") {
        if (solvedAt < 0) {
          timeLeft -= dt;
          hover = input.pointer;
          listen(input);
          if (board.every((tile, cell) => tile === cell)) {
            solvedAt = clock;
            sound(WHIRR);
            effects.burst(BOARD_X + (TILE * SIDE) / 2, BOARD_Y + TILE * 2, {
              count: DONE_BURST,
              speed: 110,
            });
            effects.float(
              "Bild gerettet!",
              BOARD_X + (TILE * SIDE) / 2,
              BOARD_Y + (TILE * SIDE) / 2,
              "#ffe27a",
              TITLE_SIZE,
            );
          } else if (timeLeft <= 0) {
            timeLeft = 0;
            status = "lost";
          }
        } else if (clock - solvedAt >= OUTRO) {
          status = "won";
        }
      }
      for (const slide of slides) {
        slide.left = Math.max(0, slide.left - dt);
      }
      effects.update(dt);
      return status;
    },
    draw(g) {
      drawWorkshop(g, sheet, solvedAt < 0 ? 0 : clock - solvedAt);
      drawBoard(g, sheet, board, slides, solvedAt < 0 ? 0 : clock - solvedAt);
      if (solvedAt < 0 && hover !== null) {
        drawHover(g, sheet, board, cellAt(hover.x, hover.y));
      }
      effects.draw(g);
      drawHud(g, {
        score: board.filter((tile, cell) => tile === cell && tile !== GAP)
          .length,
        goal: GAP,
        scoreLabel: "Teile richtig",
        time: timeLeft,
      });
      g.text(`Züge: ${String(moves)}`, MINI_W / 2, HUD_H / 2, {
        size: MOVES_SIZE,
        bold: true,
        align: "center",
        baseline: "middle",
        color: "#e8dcc8",
      });
    },
    summary() {
      const right = board.filter(
        (tile, cell) => tile === cell && tile !== GAP,
      ).length;
      return solvedAt >= 0
        ? `Bild gerettet in ${String(moves)} Zügen.`
        : `${String(right)} von ${String(GAP)} Teilen am richtigen Platz.`;
    },
  };
}

/**
 * A board scrambled by random slides from the solved picture.
 *
 * @param random - the run's random source
 * @returns tile numbers by cell; {@link GAP} marks the gap
 */
function scramble(random: Random): number[] {
  let board: number[] = [];
  do {
    board = Array.from({ length: CELLS }, (_, cell) => cell);
    let gap = GAP;
    let last = -1;
    for (let k = 0; k < SCRAMBLE; k += 1) {
      const options = neighbours(gap).filter((cell) => cell !== last);
      const next = random.pick(options);
      board[gap] = board[next];
      board[next] = GAP;
      last = gap;
      gap = next;
    }
  } while (disorder(board) < MIN_DISORDER);
  return board;
}

/** The cells next to a cell. */
function neighbours(cell: number): number[] {
  const x = cell % SIDE;
  const y = Math.floor(cell / SIDE);
  const out: number[] = [];
  if (x > 0) {
    out.push(cell - 1);
  }
  if (x < SIDE - 1) {
    out.push(cell + 1);
  }
  if (y > 0) {
    out.push(cell - SIDE);
  }
  if (y < SIDE - 1) {
    out.push(cell + SIDE);
  }
  return out;
}

/** How far all tiles are from their places, in steps. */
function disorder(board: readonly number[]): number {
  return board.reduce(
    (sum, tile, cell) =>
      tile === GAP
        ? sum
        : sum +
          Math.abs((tile % SIDE) - (cell % SIDE)) +
          Math.abs(Math.floor(tile / SIDE) - Math.floor(cell / SIDE)),
    0,
  );
}

/** The cell under a point, or -1. */
function cellAt(x: number, y: number): number {
  const box = { x: BOARD_X, y: BOARD_Y, w: TILE * SIDE, h: TILE * SIDE };
  return inside(box, x, y)
    ? Math.floor((y - BOARD_Y) / TILE) * SIDE + Math.floor((x - BOARD_X) / TILE)
    : -1;
}

/** Middle of a cell, logical px. */
function cellCentre(cell: number): { x: number; y: number } {
  return {
    x: BOARD_X + (cell % SIDE) * TILE + TILE / 2,
    y: BOARD_Y + Math.floor(cell / SIDE) * TILE + TILE / 2,
  };
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   animation, picked by eye */
/** The workshop, the humming time machine with its screen, and Jordi. */
function drawWorkshop(
  g: MiniDraw,
  sheet: HTMLImageElement,
  since: number,
): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  const fast = since > 0 ? 6 : 1;
  // Bubbling fluid in the two tubes.
  for (const [k, x] of [
    [0, 31],
    [1, 101],
  ] as const) {
    const frame = Math.floor(g.time * 4 * fast + k) % 3;
    drawSprite(
      ctx,
      sheet,
      SPRITES[`tube${String(frame)}` as SpriteName],
      x,
      28,
    );
    drawGlow(ctx, x + 4, 40, 12, "90, 240, 176", 0.25);
  }
  // Two gears turning on the cabinet's side.
  const turn = Math.floor(g.time * 6 * fast) % 4;
  const big = OBJECTS[`gearBig${String(turn)}` as "gearBig0"];
  const small = OBJECTS[`gearSmall${String(3 - turn)}` as "gearSmall0"];
  drawSprite(ctx, g.art.world, big, 18, 118);
  drawSprite(ctx, g.art.world, small, 33, 128);
  // Dial needles.
  ctx.strokeStyle = "#c8303a";
  ctx.lineWidth = 1;
  for (const [x, y, speed] of [
    [30, 75, 1.3],
    [30, 100, -0.7],
    [116, 131, 2.1],
  ] as const) {
    const angle = g.time * speed * fast;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * 6, y + Math.sin(angle) * 6);
    ctx.stroke();
  }
  // The screen with the picture as it should be.
  const flicker = 0.85 + Math.sin(g.time * 13) * 0.05;
  ctx.globalAlpha = flicker;
  drawSprite(ctx, sheet, SPRITES.preview, 57, 65);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(106, 240, 192, 0.12)";
  for (let y = 66; y < 111; y += 2) {
    ctx.fillRect(58, y + (Math.floor(g.time * 20) % 2) / 2, 44, 0.5);
  }
  if (since > 0) {
    drawGlow(ctx, 70, 85, 70, "140, 255, 210", Math.max(0, 0.6 - since / 3));
  }
  // Jordi watches; he hops when the picture is back.
  const hop = since > 0 ? Math.abs(Math.sin(since * 8)) * 5 : 0;
  ctx.fillStyle = "rgba(20, 10, 20, 0.35)";
  ctx.beginPath();
  ctx.ellipse(147, 166, 8, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  drawFigure(ctx, g.art, "jordi", 147, 166 - hop, "idle", "down", g.time * 1.5);
}

/** The frame, the tiles (sliding where they move) and the gap. */
function drawBoard(
  g: MiniDraw,
  sheet: HTMLImageElement,
  board: readonly number[],
  slides: readonly Slide[],
  since: number,
): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.frame, BOARD_X - 5, BOARD_Y - 5);
  board.forEach((tile, cell) => {
    const x = BOARD_X + (cell % SIDE) * TILE;
    const y = BOARD_Y + Math.floor(cell / SIDE) * TILE;
    if (tile === GAP) {
      drawSprite(ctx, sheet, SPRITES.hole, x, y);
    }
  });
  board.forEach((tile, cell) => {
    const x = BOARD_X + (cell % SIDE) * TILE;
    const y = BOARD_Y + Math.floor(cell / SIDE) * TILE;
    const slide = slides[tile];
    const share = slide.left / SLIDE;
    if (tile === GAP) {
      if (since > 0) {
        ctx.globalAlpha = Math.min(1, since / FADE_IN);
        drawSprite(ctx, sheet, SPRITES.tile8, x, y);
        ctx.globalAlpha = 1;
      }
    } else {
      const tx = x + slide.dx * share;
      const ty = y + slide.dy * share;
      drawSprite(
        ctx,
        sheet,
        SPRITES[`tile${String(tile)}` as SpriteName],
        tx,
        ty,
      );
      if (since <= 0) {
        const right = tile === cell;
        g.text(String(tile + 1), tx + 4, ty + 5, {
          size: 6,
          bold: true,
          align: "center",
          baseline: "middle",
          color: right ? "#ffe27a" : "#ffffff",
          outline: "#2a1430",
        });
      }
    }
  });
  if (since > 0) {
    const sweep = (since * 1.4) % 2;
    drawGlow(
      ctx,
      BOARD_X + sweep * TILE * SIDE,
      BOARD_Y + TILE * 1.5,
      40,
      "255, 240, 200",
      Math.max(0, 0.4 - since / 6),
    );
  }
}

/** The frame round a tile under the pointer that would slide when tapped. */
function drawHover(
  g: MiniDraw,
  sheet: HTMLImageElement,
  board: readonly number[],
  cell: number,
): void {
  const gap = board.indexOf(GAP);
  const movable =
    cell >= 0 &&
    cell !== gap &&
    (cell % SIDE === gap % SIDE ||
      Math.floor(cell / SIDE) === Math.floor(gap / SIDE));
  if (movable) {
    const { x, y } = cellCentre(cell);
    const frame = SPRITES.cursor;
    drawSprite(g.ctx, sheet, frame, x - frame[2] / 2, y - frame[3] / 2);
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
