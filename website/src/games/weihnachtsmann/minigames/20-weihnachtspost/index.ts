/**
 * Türchen 20 - Weihnachtspost auf Abwegen: Balbo carries letters through a
 * snowy maze to the mailbox of the letter's colour, while the wind piles up
 * snow drifts that block the way.
 *
 * @module
 * @remarks
 * The maze is made from the run's seed: a perfect maze with some extra gaps
 * knocked through, so there is always more than one way. One letter lies
 * somewhere at a time; picking it up is walking over it. Every few seconds
 * one drift melts and another one blows up elsewhere (with a warning swirl),
 * but never so that a part of the maze is cut off.
 */
import {
  drawFigure,
  drawGlow,
  drawHud,
  drawSprite,
  HUD_H,
  loadSheet,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom, type Random } from "../kit/random";
import {
  MINI_W,
  type MiniDraw,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Letters to deliver. */
const GOAL = 5;

/** Seconds on the clock. */
const TIME = 90;

/** Tiles across and down; cells of the maze sit on odd tiles. */
const COLS = 19;
const ROWS = 9;

/** Size of a tile, logical px. */
const TILE = 16;

/** Top left of the maze, logical px. */
const ORIGIN_X = 8;
const ORIGIN_Y = 26;

/** Share of the inner walls between cells knocked through for extra ways. */
const EXTRA_GAPS = 0.3;

/** Drifts lying in the maze at once. */
const DRIFTS = 4;

/** Seconds between two drifts moving, and the warning before one forms. */
const DRIFT_EVERY = 6;
const DRIFT_WARN = 1.5;

/** Seconds a new drift takes to grow to full size. */
const DRIFT_GROW = 0.4;

/** New drifts and letters keep this many steps away from Balbo. */
const DRIFT_KEEP_AWAY = 3;
const LETTER_KEEP_AWAY = 8;

/** Balbo's speed, tiles per second. */
const SPEED = 6.5;

/** Seconds before the next letter appears. */
const LETTER_DELAY = 0.5;

/** Seconds a mailbox's flag stays up after a delivery. */
const FLAG_TIME = 1.2;

/** Seconds of cheering after the last letter before the result. */
const OUTRO = 1.2;

/** Where Balbo's feet stand inside his tile, from its top, logical px. */
const FEET = 10;

/** Walk frames per tile walked. */
const STRIDE = 2;

/** Sparks of a delivery and of a drift appearing. */
const DELIVER_BURST = 20;
const DRIFT_BURST = 10;

/** How many looks the wall blocks have on the sheet. */
const WALL_LOOKS = 3;

/** Size of the hint in the HUD, logical px. */
const HINT_SIZE = 7;

/** The four colours: sprite name and German adjective for the HUD. */
const COLOURS = [
  { name: "Red", adjective: "roten", css: "#ff7a7a" },
  { name: "Blue", adjective: "blauen", css: "#8ab8ff" },
  { name: "Green", adjective: "grünen", css: "#7ae08a" },
  { name: "Yellow", adjective: "gelben", css: "#ffd84a" },
] as const;

/** The four directions: tile offset and how Balbo is drawn. */
const DIRECTIONS = [
  { dx: 1, dy: 0, facing: "side", mirror: false },
  { dx: -1, dy: 0, facing: "side", mirror: true },
  { dx: 0, dy: -1, facing: "up", mirror: false },
  { dx: 0, dy: 1, facing: "down", mirror: false },
] as const;

/** The directions by index in {@link DIRECTIONS}. */
const RIGHT = 0;
const LEFT = 1;
const UP = 2;
const DOWN = 3;

/** The row Balbo starts on, in the middle column. */
const START_ROW = 5;

/** One mailbox in a corner of the maze. */
type Mailbox = {
  readonly tile: number;
  readonly colour: number;
  flag: number;
};

/** A drift forming: where, and seconds of warning left. */
type Pending = { readonly tile: number; left: number };

/** The minigame behind gate 20. */
export const GAME: MiniGame = {
  number: 20,
  id: "weihnachtspost",
  title: "Weihnachtspost auf Abwegen",
  instructions: [
    "Der Wind hat die Weihnachtspost verweht! Hilf Balbo, die Briefe auszutragen.",
    "Lauf über einen Brief, um ihn aufzuheben, und bring ihn zum Briefkasten mit derselben Farbe.",
    `Schneewehen versperren immer wieder Wege. Bring ${String(GOAL)} Briefe in ${String(TIME)} Sekunden ans Ziel.`,
  ],
  controls: "Pfeile oder W A S D - oder auf ein Feld tippen, Balbo läuft hin.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const open = makeMaze(random);
  const corners = [
    index(1, 1),
    index(COLS - 2, 1),
    index(1, ROWS - 2),
    index(COLS - 2, ROWS - 2),
  ];
  const mailboxes: Mailbox[] = random
    .shuffle(COLOURS.map((colour, k) => k))
    .map((colour, k) => ({ tile: corners[k], colour, flag: 0 }));
  const start = index((COLS - 1) / 2, START_ROW);
  const drifts = new Map<number, number>();
  const wallLook = open.map(() => random.int(0, WALL_LOOKS));
  let pending: Pending | null = null;
  let driftIn = DRIFT_EVERY;
  let at = start;
  let from = start;
  let move = 1;
  let heading = DOWN;
  let walked = 0;
  let path: number[] = [];
  let letter: { tile: number; colour: number } | null = null;
  let carrying = -1;
  let lastColour = -1;
  let letterIn = LETTER_DELAY;
  let delivered = 0;
  let wrongAt = -1;
  let timeLeft = TIME;
  let outroLeft = -1;
  let status: MiniStatus = "running";

  const blocked = (tile: number) => !open[tile] || drifts.has(tile);

  const isMailbox = (tile: number) => mailboxes.some((m) => m.tile === tile);

  const placeDrift = (exclude: number) => {
    const near = distances(open, drifts, at);
    const candidates = open
      .map((free, tile) => tile)
      .filter(
        (tile) =>
          open[tile] &&
          !drifts.has(tile) &&
          tile !== exclude &&
          !isMailbox(tile) &&
          tile !== start &&
          tile !== letter?.tile &&
          (near[tile] ?? 0) > DRIFT_KEEP_AWAY &&
          isCorridor(open, tile),
      );
    const order = random.shuffle(candidates);
    return (
      order.find((tile) => {
        const test = new Map(drifts);
        test.delete(exclude);
        test.set(tile, 1);
        return connected(open, test);
      }) ?? -1
    );
  };

  const spawnLetter = () => {
    const near = distances(open, drifts, at);
    const cells = open
      .map((free, tile) => tile)
      .filter(
        (tile) =>
          isCell(tile) &&
          !isMailbox(tile) &&
          !drifts.has(tile) &&
          tile !== pending?.tile &&
          near[tile] !== undefined,
      );
    const far = cells.filter((tile) => near[tile] >= LETTER_KEEP_AWAY);
    const tile = random.pick(far.length > 0 ? far : cells);
    let colour = random.int(0, COLOURS.length);
    colour = colour === lastColour ? (colour + 1) % COLOURS.length : colour;
    lastColour = colour;
    letter = { tile, colour };
    sound("tick");
  };

  const arrive = () => {
    walked += 1;
    if (letter !== null && letter.tile === at && carrying < 0) {
      carrying = letter.colour;
      letter = null;
      sound("pop");
      const p = tileCentre(at);
      effects.float("Brief!", p.x, p.y - TILE, COLOURS[carrying].css);
    }
    const box = mailboxes.find((m) => m.tile === at);
    if (box !== undefined && carrying >= 0) {
      const p = tileCentre(at);
      if (box.colour === carrying) {
        delivered += 1;
        carrying = -1;
        box.flag = FLAG_TIME;
        letterIn = LETTER_DELAY;
        sound("coin");
        effects.burst(p.x, p.y - TILE, { count: DELIVER_BURST });
        effects.float("Zugestellt!", p.x, p.y - TILE * 2);
        if (delivered >= GOAL) {
          outroLeft = OUTRO;
          sound("fanfare");
        }
      } else if (wrongAt !== at) {
        sound("miss");
        effects.float("Falsche Farbe!", p.x, p.y - TILE * 2, "#ff9a9a");
      }
    }
    wrongAt = box === undefined ? -1 : at;
  };

  const tryStep = (direction: number) => {
    const d = DIRECTIONS[direction];
    const next = index(col(at) + d.dx, row(at) + d.dy);
    const free = inGrid(col(at) + d.dx, row(at) + d.dy) && !blocked(next);
    if (free) {
      from = at;
      at = next;
      move = 0;
      heading = direction;
    }
    return free;
  };

  const wanted = (input: MiniInput) => {
    const x = input.axisX;
    const y = input.axisY;
    const horizontal = x > 0 ? RIGHT : LEFT;
    const vertical = y < 0 ? UP : DOWN;
    const choices: number[] = [];
    if (Math.abs(x) >= Math.abs(y)) {
      choices.push(
        ...(x === 0 ? [] : [horizontal]),
        ...(y === 0 ? [] : [vertical]),
      );
    } else {
      choices.push(vertical, ...(x === 0 ? [] : [horizontal]));
    }
    return choices;
  };

  const walk = (input: MiniInput, dt: number) => {
    if (input.taps.length > 0) {
      const tap = input.taps[input.taps.length - 1];
      path = route(open, drifts, at, tileAt(tap.x, tap.y, blocked));
    }
    const keys = wanted(input);
    if (keys.length > 0) {
      path = [];
    }
    if (move < 1) {
      move = Math.min(1, move + SPEED * dt);
      if (move >= 1) {
        arrive();
      }
    }
    if (move >= 1) {
      if (keys.length > 0) {
        // Try the wanted ways first; keep going straight round a corner.
        const done = keys.some((direction) => tryStep(direction));
        if (!done) {
          tryStep(heading);
        }
      } else if (path.length > 0) {
        const goal = path[path.length - 1];
        if (blocked(path[0])) {
          path = route(open, drifts, at, goal);
        }
        const next = path.shift();
        const direction = DIRECTIONS.findIndex(
          (d) =>
            next !== undefined &&
            index(col(at) + d.dx, row(at) + d.dy) === next,
        );
        if (direction >= 0) {
          tryStep(direction);
        }
      }
    }
  };

  const weather = (dt: number) => {
    driftIn -= dt;
    if (driftIn <= 0 && pending === null) {
      driftIn = DRIFT_EVERY;
      const oldest = drifts.keys().next().value;
      const tile = placeDrift(oldest ?? -1);
      if (tile >= 0) {
        pending = { tile, left: DRIFT_WARN };
        if (oldest !== undefined) {
          drifts.delete(oldest);
          const p = tileCentre(oldest);
          effects.burst(p.x, p.y, {
            count: DRIFT_BURST,
            colors: ["#ffffff", "#d2ddef"],
            speed: 30,
          });
          sound("whoosh");
        }
      }
    }
    if (pending !== null) {
      pending.left -= dt;
      if (pending.left <= 0) {
        const tile = pending.tile;
        const free = tile !== at && tile !== from && tile !== letter?.tile;
        const test = new Map(drifts);
        test.set(tile, 1);
        if (free && connected(open, test)) {
          drifts.set(tile, 0);
          sound("bump");
          const p = tileCentre(tile);
          effects.burst(p.x, p.y, {
            count: DRIFT_BURST,
            colors: ["#ffffff", "#d2ddef"],
            speed: 40,
          });
        }
        pending = null;
      }
    }
    for (const [tile, grow] of drifts) {
      drifts.set(tile, Math.min(1, grow + dt / DRIFT_GROW));
    }
  };

  for (let k = 0; k < DRIFTS; k += 1) {
    const tile = placeDrift(-1);
    if (tile >= 0) {
      drifts.set(tile, 1);
    }
  }

  return {
    step(input, dt) {
      if (status === "running") {
        if (outroLeft >= 0) {
          outroLeft -= dt;
          status = outroLeft <= 0 ? "won" : status;
        } else {
          timeLeft -= dt;
          walk(input, dt);
          weather(dt);
          if (letter === null && carrying < 0) {
            letterIn -= dt;
            if (letterIn <= 0) {
              spawnLetter();
            }
          }
          if (timeLeft <= 0) {
            timeLeft = 0;
            status = "lost";
          }
        }
      }
      for (const box of mailboxes) {
        box.flag = Math.max(0, box.flag - dt);
      }
      effects.update(dt);
      return status;
    },
    draw(g) {
      const a = tileCentre(from);
      const b = tileCentre(at);
      drawMaze(g, sheet, {
        open,
        wallLook,
        drifts,
        pending,
        mailboxes,
        letter,
        carrying,
        balbo: {
          x: a.x + (b.x - a.x) * move,
          y: a.y + (b.y - a.y) * move,
          heading,
          moving: move < 1,
          frame: (walked + move) * STRIDE,
        },
      });
      effects.draw(g);
      drawHud(g, {
        score: delivered,
        goal: GOAL,
        scoreLabel: "Briefe",
        time: timeLeft,
      });
      const hint =
        carrying >= 0
          ? `Zum ${COLOURS[carrying].adjective} Briefkasten!`
          : "Hol den Brief!";
      g.text(hint, MINI_W / 2, HUD_H / 2, {
        size: HINT_SIZE,
        bold: true,
        align: "center",
        baseline: "middle",
        color: carrying >= 0 ? COLOURS[carrying].css : "#e8dcc8",
      });
    },
    summary() {
      return `${String(delivered)} von ${String(GOAL)} Briefen zugestellt.`;
    },
  };
}

/** The tile at a column and row. */
function index(x: number, y: number): number {
  return y * COLS + x;
}

/** The column of a tile. */
function col(tile: number): number {
  return tile % COLS;
}

/** The row of a tile. */
function row(tile: number): number {
  return Math.floor(tile / COLS);
}

/** Whether a column and row lie on the grid. */
function inGrid(x: number, y: number): boolean {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS;
}

/** Whether a tile is a cell of the maze (odd column and row). */
function isCell(tile: number): boolean {
  return col(tile) % 2 === 1 && row(tile) % 2 === 1;
}

/** Whether an open tile is a plain corridor: open on exactly two opposite sides. */
function isCorridor(open: readonly boolean[], tile: number): boolean {
  const x = col(tile);
  const y = row(tile);
  const free = (dx: number, dy: number) =>
    inGrid(x + dx, y + dy) && open[index(x + dx, y + dy)];
  const across = free(1, 0) && free(-1, 0) && !free(0, 1) && !free(0, -1);
  const along = free(0, 1) && free(0, -1) && !free(1, 0) && !free(-1, 0);
  return across || along;
}

/**
 * A maze: a perfect maze dug from cell to cell, then some extra gaps.
 *
 * @param random - the run's random source
 * @returns for every tile whether it can be walked on
 */
function makeMaze(random: Random): boolean[] {
  const open = Array.from({ length: COLS * ROWS }, () => false);
  const startCell = index(1, 1);
  open[startCell] = true;
  const stack = [startCell];
  while (stack.length > 0) {
    const tile = stack[stack.length - 1];
    const options = DIRECTIONS.map((d) => ({
      x: col(tile) + d.dx * 2,
      y: row(tile) + d.dy * 2,
      d,
    })).filter(
      (o) =>
        o.x > 0 &&
        o.x < COLS - 1 &&
        o.y > 0 &&
        o.y < ROWS - 1 &&
        !open[index(o.x, o.y)],
    );
    if (options.length === 0) {
      stack.pop();
    } else {
      const o = random.pick(options);
      open[index(o.x - o.d.dx, o.y - o.d.dy)] = true;
      open[index(o.x, o.y)] = true;
      stack.push(index(o.x, o.y));
    }
  }
  for (let y = 1; y < ROWS - 1; y += 1) {
    for (let x = 1; x < COLS - 1; x += 1) {
      const between = (x % 2 === 0) !== (y % 2 === 0);
      if (between && !open[index(x, y)] && random.chance(EXTRA_GAPS)) {
        open[index(x, y)] = true;
      }
    }
  }
  return open;
}

/**
 * Steps from a tile to every tile that can be reached.
 *
 * @param open - which tiles can be walked on
 * @param drifts - tiles blocked by snow
 * @param from - the start
 * @returns steps by tile; unreachable tiles stay undefined
 */
function distances(
  open: readonly boolean[],
  drifts: ReadonlyMap<number, number>,
  from: number,
): number[] {
  const steps: number[] = [];
  steps[from] = 0;
  const queue = [from];
  for (let k = 0; k < queue.length; k += 1) {
    const tile = queue[k];
    for (const d of DIRECTIONS) {
      const x = col(tile) + d.dx;
      const y = row(tile) + d.dy;
      const next = index(x, y);
      if (
        inGrid(x, y) &&
        open[next] &&
        !drifts.has(next) &&
        steps[next] === undefined
      ) {
        steps[next] = steps[tile] + 1;
        queue.push(next);
      }
    }
  }
  return steps;
}

/** Whether every open tile without snow can still be reached from every other. */
function connected(
  open: readonly boolean[],
  drifts: ReadonlyMap<number, number>,
): boolean {
  const free = open
    .map((walkable, tile) => tile)
    .filter((tile) => open[tile] && !drifts.has(tile));
  const steps = distances(open, drifts, free[0]);
  return free.every((tile) => steps[tile] !== undefined);
}

/**
 * The shortest way from one tile to another.
 *
 * @param open - which tiles can be walked on
 * @param drifts - tiles blocked by snow
 * @param from - the start
 * @param to - the goal, or -1
 * @returns the tiles to walk, without the start; empty when there is no way
 */
function route(
  open: readonly boolean[],
  drifts: ReadonlyMap<number, number>,
  from: number,
  to: number,
): number[] {
  const steps = to >= 0 ? distances(open, drifts, to) : [];
  const way: number[] = [];
  let tile = from;
  while (steps[tile] !== undefined && steps[tile] > 0) {
    const here = tile;
    const next = DIRECTIONS.map((d) => ({
      x: col(here) + d.dx,
      y: row(here) + d.dy,
    }))
      .filter((p) => inGrid(p.x, p.y))
      .map((p) => index(p.x, p.y))
      .find((n) => steps[n] === steps[here] - 1);
    if (next === undefined) {
      break;
    }
    way.push(next);
    tile = next;
  }
  return way;
}

/**
 * The open tile under a tap; a tap on the top of a wall or mailbox counts
 * for the tile below it.
 *
 * @param x - logical px
 * @param y - logical px
 * @param blocked - whether a tile cannot be walked on
 * @returns the tile, or -1
 */
function tileAt(
  x: number,
  y: number,
  blocked: (tile: number) => boolean,
): number {
  const tx = Math.floor((x - ORIGIN_X) / TILE);
  const ty = Math.floor((y - ORIGIN_Y) / TILE);
  let tile = -1;
  if (inGrid(tx, ty) && !blocked(index(tx, ty))) {
    tile = index(tx, ty);
  } else if (inGrid(tx, ty + 1) && !blocked(index(tx, ty + 1))) {
    tile = index(tx, ty + 1);
  }
  return tile;
}

/** Middle of a tile, logical px. */
function tileCentre(tile: number): { x: number; y: number } {
  return {
    x: ORIGIN_X + col(tile) * TILE + TILE / 2,
    y: ORIGIN_Y + row(tile) * TILE + TILE / 2,
  };
}

/** What the maze needs to know. */
type MazeState = {
  readonly open: readonly boolean[];
  readonly wallLook: readonly number[];
  readonly drifts: ReadonlyMap<number, number>;
  readonly pending: Pending | null;
  readonly mailboxes: readonly Mailbox[];
  readonly letter: { tile: number; colour: number } | null;
  readonly carrying: number;
  readonly balbo: {
    readonly x: number;
    readonly y: number;
    readonly heading: number;
    readonly moving: boolean;
    readonly frame: number;
  };
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- sprite offsets and
   animation, picked by eye */
/** The yard, then everything standing in it from the back to the front. */
function drawMaze(g: MiniDraw, sheet: HTMLImageElement, s: MazeState): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  const pieces: { y: number; draw: () => void }[] = [];
  s.open.forEach((free, tile) => {
    const left = ORIGIN_X + col(tile) * TILE;
    const top = ORIGIN_Y + row(tile) * TILE;
    if (!free) {
      pieces.push({
        y: top + TILE,
        draw: () => {
          drawSprite(
            ctx,
            sheet,
            SPRITES[`wall${String(s.wallLook[tile])}` as SpriteName],
            left,
            top - 6,
          );
        },
      });
    }
  });
  for (const [tile, grow] of s.drifts) {
    const p = tileCentre(tile);
    pieces.push({
      y: p.y + 6,
      draw: () => {
        drawSprite(
          ctx,
          sheet,
          grow < 1 ? SPRITES.driftSmall : SPRITES.drift,
          p.x - 8,
          p.y - 9,
        );
      },
    });
  }
  if (s.pending !== null) {
    const p = tileCentre(s.pending.tile);
    const frame = Math.floor(g.time * 12) % 3;
    pieces.push({
      y: p.y + 7,
      draw: () => {
        drawSprite(
          ctx,
          sheet,
          SPRITES[`swirl${String(frame)}` as SpriteName],
          p.x - 8,
          p.y - 9,
        );
      },
    });
  }
  for (const box of s.mailboxes) {
    const p = tileCentre(box.tile);
    const colour = COLOURS[box.colour];
    if (s.carrying === box.colour) {
      drawGlow(
        ctx,
        p.x,
        p.y - 4,
        18,
        "255, 236, 140",
        0.35 + Math.sin(g.time * 8) * 0.15,
      );
    }
    pieces.push({
      y: p.y + 4,
      draw: () => {
        drawSprite(
          ctx,
          sheet,
          SPRITES[`mailbox${colour.name}` as SpriteName],
          p.x - 8,
          p.y - 19,
        );
        if (box.flag > 0) {
          ctx.fillStyle = "#ffe27a";
          ctx.fillRect(p.x + 6, p.y - 22, 3, 3);
        }
      },
    });
  }
  if (s.letter !== null) {
    const p = tileCentre(s.letter.tile);
    const colour = COLOURS[s.letter.colour];
    drawGlow(
      ctx,
      p.x,
      p.y,
      12,
      "255, 250, 210",
      0.4 + Math.sin(g.time * 6) * 0.15,
    );
    const bob = Math.round(Math.sin(g.time * 4) * 1.5);
    pieces.push({
      y: p.y + 3,
      draw: () => {
        drawSprite(
          ctx,
          sheet,
          SPRITES[`letter${colour.name}` as SpriteName],
          p.x - 5.5,
          p.y - 5 + bob,
        );
      },
    });
  }
  const balbo = s.balbo;
  const feet = balbo.y - TILE / 2 + FEET;
  pieces.push({
    y: feet,
    draw: () => {
      const d = DIRECTIONS[balbo.heading];
      ctx.fillStyle = "rgba(70, 90, 140, 0.3)";
      ctx.beginPath();
      ctx.ellipse(balbo.x, feet, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      drawFigure(
        ctx,
        g.art,
        "balbo",
        balbo.x,
        feet,
        balbo.moving ? "walk" : "idle",
        d.facing,
        balbo.moving ? balbo.frame : g.time * 1.6,
        d.mirror,
      );
      if (s.carrying >= 0) {
        const colour = COLOURS[s.carrying];
        drawSprite(
          ctx,
          sheet,
          SPRITES[`letter${colour.name}` as SpriteName],
          balbo.x - 5.5,
          feet - 40 + Math.round(Math.sin(g.time * 6)),
        );
      }
    },
  });
  pieces.sort((a, b) => a.y - b.y);
  for (const piece of pieces) {
    piece.draw();
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
