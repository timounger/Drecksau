/**
 * Türchen 24 - Sebastians Wunschzettel: a game of Mastermind on Santa's desk.
 * Sebastian wishes for four different toys in a certain order; guess them on
 * the wish list, and Santa marks every guess with stars and bells.
 *
 * @module
 * @remarks
 * The secret is {@link SLOTS} different toys out of {@link TOYS.length}. A gold
 * star is a right toy in the right place, a silver bell a right toy in the
 * wrong place. Find the wish within {@link TRIES} guesses before the clock
 * runs out.
 */
import {
  drawButton,
  drawFigure,
  drawGlow,
  drawHud,
  drawPanel,
  drawSprite,
  drawSpriteCentred,
  inside,
  loadSheet,
  wrapText,
  type Box,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom } from "../kit/random";
import {
  type MiniDraw,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** The toys to choose from, in the order of the buttons. */
const TOYS: readonly SpriteName[] = [
  "teddy",
  "train",
  "doll",
  "ball",
  "drum",
  "rocket",
];

/** German names of the toys, for the end. */
const TOY_NAMES: Readonly<Record<string, string>> = {
  teddy: "Teddy",
  train: "Eisenbahn",
  doll: "Puppe",
  ball: "Ball",
  drum: "Trommel",
  rocket: "Rakete",
};

/** Toys on the wish. */
const SLOTS = 4;

/** Guesses allowed. */
const TRIES = 8;

/** Seconds on the clock. */
const TIME = 90;

/** The rows on the list: top of the first and height of each, logical px. */
const ROW_TOP = 35;
const ROW_H = 17;

/** Left edge of the first slot and the step between slots, logical px. */
const SLOT_X = 30;
const SLOT_STEP = 21;

/** Left edge of the first hint and the step between hints, logical px. */
const HINT_X = 126;
const HINT_STEP = 10;

/** Toy buttons: left edge, top, size and step, logical px. */
const PAD_X = 184;
const PAD_Y = 90;
const PAD_SIZE = 26;
const PAD_STEP = 30;

/** Toy buttons per row. */
const PAD_COLUMNS = 3;

/** The buttons for deleting and checking. */
const DELETE_BOX: Box = { x: 184, y: 152, w: 40, h: 18 };
const CHECK_BOX: Box = { x: 230, y: 152, w: 40, h: 18 };

/** Cursor rows: two of toys, one of the two buttons. */
const CURSOR_ROWS = 3;

/** Seconds between two hints appearing after a guess. */
const HINT_DELAY = 0.18;

/** Seconds a toy pops when it is put down. */
const POP = 0.2;

/** How much bigger a popping toy is at first. */
const POP_SCALE = 0.5;

/** Santa: feet, logical px. */
const SANTA_X = 292;
const SANTA_Y = 100;

/** Santa's speech bubble. */
const BUBBLE: Box = { x: 176, y: 20, w: 92, h: 44 };

/** Letter size of the bubble, the legend and the header, logical px. */
const BUBBLE_SIZE = 6;
const LEGEND_SIZE = 5;
const HEADER_SIZE = 7;

/** Raw keys that put a toy down directly, one per toy. */
const DIGIT_KEYS = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6"];

/** Sparks of a found wish. */
const WIN_BURST = 40;

/** One guess on the list. */
type Guess = {
  readonly toys: readonly number[];
  readonly stars: number;
  readonly bells: number;
  /** Seconds since it was checked, for showing the hints one by one. */
  age: number;
};

/** The minigame behind gate 24. */
export const GAME: MiniGame = {
  number: 24,
  id: "wunschzettel-raetsel",
  title: "Sebastians Wunschzettel",
  instructions: [
    `Sebastian wünscht sich vier verschiedene Spielzeuge in einer festen Reihenfolge. Errate sie in ${String(TRIES)} Versuchen!`,
    "Goldener Stern: richtiges Spielzeug am richtigen Platz. Glocke: richtiges Spielzeug, aber an einem anderen Platz.",
  ],
  controls: "Antippen, dann Prüfen - oder Pfeile + Leertaste, Tasten 1-6.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const secret = random.shuffle(TOYS.map((_, index) => index)).slice(0, SLOTS);
  const guesses: Guess[] = [];
  const row: (number | null)[] = Array.from({ length: SLOTS }, () => null);
  const pops: number[] = row.map(() => 0);
  let cursorRow = 0;
  let cursorColumn = 0;
  let left = TIME;
  let message = "Was wünscht sich Sebastian? Vier verschiedene Spielzeuge!";
  let status: MiniStatus = "running";
  let ending: MiniStatus = "running";
  let endIn = 0;

  const put = (toy: number) => {
    const free = row.indexOf(null);
    if (row.includes(toy)) {
      sound("miss");
      message = "Jedes Spielzeug nur einmal!";
    } else if (free >= 0) {
      row[free] = toy;
      pops[free] = POP;
      sound("pop");
    }
  };

  const remove = (slot: number) => {
    if (slot >= 0 && row[slot] !== null) {
      row[slot] = null;
      sound("click");
    }
  };

  const check = () => {
    if (row.includes(null)) {
      sound("miss");
      message = "Erst alle vier Plätze füllen!";
    } else {
      const toys = row.map((toy) => toy ?? 0);
      const stars = toys.filter((toy, k) => secret[k] === toy).length;
      const bells = toys.filter((toy) => secret.includes(toy)).length - stars;
      guesses.push({ toys, stars, bells, age: 0 });
      row.fill(null);
      sound("whoosh");
      message = verdict(stars, bells);
      if (stars === SLOTS) {
        ending = "won";
        endIn = HINT_DELAY * SLOTS + POP;
      } else if (guesses.length >= TRIES) {
        ending = "lost";
        endIn = HINT_DELAY * SLOTS + POP;
      }
    }
  };

  const press = (input: MiniInput) => {
    if (input.pressed.has("left")) {
      cursorColumn -= 1;
    }
    if (input.pressed.has("right")) {
      cursorColumn += 1;
    }
    if (input.pressed.has("up")) {
      cursorRow = (cursorRow + CURSOR_ROWS - 1) % CURSOR_ROWS;
    }
    if (input.pressed.has("down")) {
      cursorRow = (cursorRow + 1) % CURSOR_ROWS;
    }
    const columns = cursorRow < 2 ? PAD_COLUMNS : 2;
    cursorColumn = (cursorColumn + columns) % columns;
    if (input.pressed.has("action")) {
      if (cursorRow < 2) {
        put(cursorRow * PAD_COLUMNS + cursorColumn);
      } else if (cursorColumn === 0) {
        remove(lastFilled(row));
      } else {
        check();
      }
    }
    if (input.pressed.has("alt")) {
      remove(lastFilled(row));
    }
    DIGIT_KEYS.forEach((key, toy) => {
      if (input.keysPressed.has(key)) {
        put(toy);
      }
    });
    for (const tap of input.taps) {
      const toy = TOYS.findIndex((_, k) => inside(padBox(k), tap.x, tap.y));
      const slot = row.findIndex((_, k) =>
        inside(slotBox(guesses.length, k), tap.x, tap.y),
      );
      if (toy >= 0) {
        cursorRow = Math.floor(toy / PAD_COLUMNS);
        cursorColumn = toy % PAD_COLUMNS;
        put(toy);
      } else if (slot >= 0) {
        remove(slot);
      } else if (inside(DELETE_BOX, tap.x, tap.y)) {
        remove(lastFilled(row));
      } else if (inside(CHECK_BOX, tap.x, tap.y)) {
        check();
      }
    }
  };

  const age = (dt: number) => {
    for (const guess of guesses) {
      const before = Math.floor(guess.age / HINT_DELAY);
      guess.age += dt;
      const shown = Math.floor(guess.age / HINT_DELAY);
      if (shown !== before && shown <= guess.stars + guess.bells) {
        sound(shown <= guess.stars ? "coin" : "tick");
      }
    }
    pops.forEach((pop, k) => {
      pops[k] = Math.max(0, pop - dt);
    });
  };

  return {
    step(input, dt) {
      if (status === "running") {
        age(dt);
        if (ending === "running") {
          left -= dt;
          press(input);
          if (left <= 0) {
            ending = "lost";
          }
        } else {
          endIn -= dt;
          if (endIn <= 0) {
            status = ending;
            message =
              ending === "won"
                ? "Hurra! Genau das wünscht sich Sebastian!"
                : "Schade! Er wünscht sich:";
            if (ending === "won") {
              effects.burst(SANTA_X, SANTA_Y - ROW_H, { count: WIN_BURST });
            }
          }
        }
      } else {
        age(dt);
      }
      effects.update(dt);
      return status;
    },
    draw(g) {
      drawScene(g, sheet, {
        guesses,
        row,
        pops,
        cursor: { row: cursorRow, column: cursorColumn },
        message,
        secret: status === "lost" ? secret : null,
        won: status === "won",
      });
      effects.draw(g);
      drawHud(g, {
        score: Math.min(guesses.length + (ending === "running" ? 1 : 0), TRIES),
        goal: TRIES,
        scoreLabel: "Versuch",
        time: left,
      });
    },
    summary() {
      const found = guesses.some((guess) => guess.stars === SLOTS);
      const names = secret.map((toy) => TOY_NAMES[TOYS[toy]]).join(", ");
      return found
        ? `Wunsch erraten im ${String(guesses.length)}. Versuch!`
        : `Gesucht war: ${names}.`;
    },
  };
}

/** What Santa says to a guess. */
function verdict(stars: number, bells: number): string {
  let text: string;
  if (stars === SLOTS) {
    text = "Ja! Das ist sein Wunschzettel!";
  } else if (stars + bells === SLOTS) {
    text = "Alle vier sind richtig - nur die Reihenfolge noch nicht!";
  } else if (stars + bells === 0) {
    text = "Hm, keins davon wünscht er sich.";
  } else {
    text = `${String(stars)} am richtigen Platz, ${String(bells)} am falschen Platz.`;
  }
  return text;
}

/** The last slot of the row with a toy in it, or -1. */
function lastFilled(row: readonly (number | null)[]): number {
  let last = -1;
  row.forEach((toy, k) => {
    if (toy !== null) {
      last = k;
    }
  });
  return last;
}

/** Where a toy button is. */
function padBox(toy: number): Box {
  return {
    x: PAD_X + (toy % PAD_COLUMNS) * PAD_STEP,
    y: PAD_Y + Math.floor(toy / PAD_COLUMNS) * PAD_STEP,
    w: PAD_SIZE,
    h: PAD_SIZE,
  };
}

/** Where a slot of a row on the list is. */
function slotBox(line: number, slot: number): Box {
  return {
    x: SLOT_X + slot * SLOT_STEP,
    y: ROW_TOP + line * ROW_H,
    w: SLOT_STEP - 2,
    h: ROW_H,
  };
}

/** What the scene needs to know. */
type SceneState = {
  readonly guesses: readonly Guess[];
  readonly row: readonly (number | null)[];
  readonly pops: readonly number[];
  readonly cursor: { readonly row: number; readonly column: number };
  readonly message: string;
  /** The wish, shown once the run is lost. */
  readonly secret: readonly number[] | null;
  readonly won: boolean;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** The desk, the list with all guesses, the toy buttons and Santa. */
function drawScene(g: MiniDraw, sheet: HTMLImageElement, s: SceneState): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  g.text("Sebastians Wunschzettel", 89, 27, {
    size: HEADER_SIZE,
    bold: true,
    align: "center",
    baseline: "middle",
    color: "#a8303a",
  });
  const current = s.guesses.length;
  for (let line = 0; line < TRIES; line += 1) {
    const top = ROW_TOP + line * ROW_H;
    g.text(String(line + 1), 17, top + ROW_H / 2, {
      size: 6,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#a88a6a",
    });
    const guess = s.guesses[line] as Guess | undefined;
    if (line === current && !s.won && s.secret === null) {
      ctx.fillStyle = "rgba(255, 216, 74, 0.28)";
      ctx.fillRect(26, top + 1, 156 - 26, ROW_H - 2);
    }
    for (let slot = 0; slot < SLOTS; slot += 1) {
      const x = SLOT_X + slot * SLOT_STEP;
      let toy: number | null = null;
      let pop = 0;
      if (guess !== undefined) {
        toy = guess.toys[slot];
      } else if (line === current) {
        toy = s.row[slot];
        pop = s.pops[slot] / POP;
      }
      if (toy === null) {
        drawSprite(ctx, sheet, SPRITES.slot, x, top + 1);
      } else {
        const hop =
          s.won && line === current - 1
            ? Math.abs(Math.sin(g.time * 8 + slot)) * 3
            : 0;
        drawSpriteCentred(
          ctx,
          sheet,
          SPRITES[TOYS[toy]],
          x + 8,
          top + 8 - hop,
          1 + pop * POP_SCALE,
        );
      }
    }
    if (guess !== undefined) {
      drawHints(g, sheet, guess, top);
    }
  }
  drawSprite(ctx, sheet, SPRITES.pencil, 278, 160);
  // The toy buttons, the delete and check buttons.
  TOYS.forEach((toy, k) => {
    const box = padBox(k);
    const focused =
      s.cursor.row * PAD_COLUMNS + s.cursor.column === k && s.cursor.row < 2;
    const used = s.row.includes(k);
    drawSprite(
      ctx,
      sheet,
      focused ? SPRITES.buttonOn : SPRITES.button,
      box.x,
      box.y,
    );
    ctx.globalAlpha = used ? 0.35 : 1;
    drawSpriteCentred(
      ctx,
      sheet,
      SPRITES[toy],
      box.x + 13,
      box.y + 13 + (focused ? Math.sin(g.time * 6) : 0),
    );
    ctx.globalAlpha = 1;
    g.text(String(k + 1), box.x + 3, box.y + 4, { size: 4, color: "#8a6a4a" });
  });
  drawButton(
    g,
    DELETE_BOX,
    "Löschen",
    s.cursor.row === 2 && s.cursor.column === 0,
  );
  drawButton(
    g,
    CHECK_BOX,
    "Prüfen",
    s.cursor.row === 2 && s.cursor.column === 1,
  );
  // Santa and what he says.
  drawGlow(ctx, SANTA_X, SANTA_Y - 12, 26, "255, 220, 150", 0.18);
  drawFigure(
    ctx,
    g.art,
    "santa",
    SANTA_X,
    SANTA_Y,
    s.won ? "walk" : "idle",
    "down",
    g.time * (s.won ? 8 : 1.5),
  );
  drawPanel(ctx, BUBBLE, "rgba(255, 250, 236, 0.95)", "#a87a48");
  ctx.fillStyle = "rgba(255, 250, 236, 0.95)";
  ctx.beginPath();
  ctx.moveTo(BUBBLE.x + BUBBLE.w - 1, BUBBLE.y + 30);
  ctx.lineTo(SANTA_X - 10, SANTA_Y - 28);
  ctx.lineTo(BUBBLE.x + BUBBLE.w - 1, BUBBLE.y + 38);
  ctx.fill();
  const lines = wrapText(s.message, BUBBLE.w - 8, BUBBLE_SIZE);
  lines.forEach((line, k) => {
    g.text(line, BUBBLE.x + 4, BUBBLE.y + 6 + k * 7.5, {
      size: BUBBLE_SIZE,
      baseline: "middle",
      color: "#4a2a1a",
    });
  });
  if (s.secret !== null) {
    s.secret.forEach((toy, k) => {
      drawSprite(
        ctx,
        sheet,
        SPRITES[TOYS[toy]],
        BUBBLE.x + 6 + k * 20,
        BUBBLE.y + 24,
      );
    });
  }
  // The legend.
  drawSprite(ctx, sheet, SPRITES.star, 178, 68);
  g.text("richtiger Platz", 186, 71, {
    size: LEGEND_SIZE,
    baseline: "middle",
    color: "#fff4c8",
  });
  drawSprite(ctx, sheet, SPRITES.bell, 178, 77);
  g.text("anderer Platz", 186, 80, {
    size: LEGEND_SIZE,
    baseline: "middle",
    color: "#e8f0ff",
  });
}

/** The hints of one guess: stars first, then bells, then empty dots. */
function drawHints(
  g: MiniDraw,
  sheet: HTMLImageElement,
  guess: Guess,
  top: number,
): void {
  const shown = Math.floor(guess.age / HINT_DELAY);
  for (let k = 0; k < SLOTS; k += 1) {
    let sprite: SpriteName = "dot";
    if (k < Math.min(shown, guess.stars)) {
      sprite = "star";
    } else if (
      k >= guess.stars &&
      k < Math.min(shown, guess.stars + guess.bells)
    ) {
      sprite = "bell";
    }
    drawSprite(g.ctx, sheet, SPRITES[sprite], HINT_X + k * HINT_STEP, top + 5);
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
