/**
 * Runs one visit to an Advent gate: the title card, the count-down, the
 * minigame, the result screen with "Nochmal" and "Zurück zur Karte", the
 * fades in and out - and the finale after the last gate.
 *
 * @module
 * @remarks
 * The screen steps a session sixty times a second while it is open and
 * draws it instead of the map; once {@link MiniSession.closed} turns true it
 * hands control back to the map. Esc (gamepad Back, the touch button
 * "Zurück") leaves from anywhere; a run left early counts as not won.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import { OBJECTS } from "@/games/weihnachtsmann/components/sprite-atlas";
import type { GateStyle } from "@/games/weihnachtsmann/engine/types";
import type { FigureId } from "@/games/weihnachtsmann/components/sprite-atlas";
import {
  MINI_H,
  MINI_W,
  type MiniDraw,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniStatus,
  type TextStyle,
} from "../types";
import {
  drawButton,
  drawFigure,
  drawObject,
  drawPanel,
  drawSky,
  drawSnowfall,
  inside,
  wrapText,
  type Box,
} from "./draw";
import { createEffects, type Effects } from "./effects";
import { createFinale, type Finale } from "./finale";
import { LEAVE_KEY } from "./input";
import { createRandom } from "./random";
import type { MiniSoundId } from "./sounds";

/** Where a visit stands. */
type Phase =
  "title" | "count" | "play" | "end" | "result" | "finale" | "leaving";

/** What the screen hands a session. */
export type SessionOptions = {
  /** Which gate, and how it looks, for the title card. */
  readonly style: GateStyle;
  /** Who walked in, standing before the gate on the title card. */
  readonly who: FigureId;
  /** Whether the gate was won before. */
  readonly done: boolean;
  /** How many gates were won before this visit. */
  readonly doneCount: number;
  /** How many gates there are. */
  readonly total: number;
  /** Seed for the first run; each further run takes the next. */
  readonly seed: number;
  /** Plays a shared sound or a recipe. */
  readonly sound: (sound: MiniSoundId | Recipe) => void;
  /** Called once when a run is won, so the gate can be marked and saved. */
  readonly onWin: () => void;
};

/** One visit to a gate. */
export type MiniSession = {
  /** The gate's minigame. */
  readonly game: MiniGame;
  /** Advances by one fixed step. */
  step(input: MiniInput, dt: number): void;
  /** Draws the visit onto the field. */
  draw(g: MiniDraw): void;
  /** Whether the visit is over and the map should come back. */
  closed(): boolean;
  /** Whether a run was won during this visit. */
  won(): boolean;
  /** Leaves at once, from any phase - the page's leave button, like Esc. */
  quit(): void;
};

/** Seconds of the fade at the start and at the end. */
const FADE = 0.35;

/** Seconds per count-down number, and how many numbers. */
const COUNT_STEP = 0.5;
const COUNT_FROM = 3;

/** Seconds "Los!" stays on screen once the run is going. */
const GO_SHOWN = 0.5;

/** Seconds between the end of a run and the result screen. */
const END_PAUSE = 0.9;

/** Size of the buttons, logical px. */
const BUTTON_W = 84;
const BUTTON_H = 20;
const BUTTON_GAP = 10;

/**
 * How far round a button a tap still counts, logical px - a fingertip is
 * wider than the button is high on a phone.
 */
const TAP_SLOP = 5;

/** Text sizes, logical px. */
const SIZE_SMALL = 6.5;
const SIZE_TEXT = 7.5;
const SIZE_GATE = 9;
const SIZE_TITLE = 14;
const SIZE_BIG = 18;
const SIZE_COUNT = 40;

/** Size of the Esc hint, and its distance from the corner, logical px. */
const SIZE_TINY = 5.5;
const CORNER = 4;

/** Middle of a gate's number plate below the picture's top, logical px. */
const PLATE_MIDDLE = 8.5;

/** Line height as a share of the letter size. */
const LINE = 1.35;

/** The title card's panel. */
const CARD: Box = { x: 108, y: 14, w: 200, h: 152 };

/** Padding inside the card, logical px. */
const CARD_PAD = 10;

/** Where the gate stands on the title card: middle and foot line. */
const CARD_GATE_X = 56;
const CARD_GATE_Y = 150;

/** How far before the gate the visitor stands, logical px. */
const WHO_DOWN = 20;

/** The result panel. */
const RESULT: Box = { x: 60, y: 34, w: 200, h: 112 };

/** Colours of the texts. */
const GOLD = "#ffe27a";
const CREAM = "#fff4dc";
const MUTED = "#c8b8d8";
const GREEN = "#9be39b";
const RED = "#ff8a8a";
const INK = "#2a1430";

/** The gate picture of each style, shut, for the title card. */
const CARD_GATES: Readonly<
  Record<
    GateStyle,
    "gateArchShut" | "gateHutShut" | "gateSnowWallShut" | "gateGiftBoxShut"
  >
> = {
  arch: "gateArchShut",
  hut: "gateHutShut",
  snowWall: "gateSnowWallShut",
  giftBox: "gateGiftBoxShut",
};

/** German texts of the host. */
const TEXTS = {
  gate: "Türchen",
  start: "Start",
  back: "Zurück",
  again: "Nochmal",
  toMap: "Zurück zur Karte",
  won: "Geschafft!",
  lost: "Nicht geschafft",
  go: "Los!",
  soon: "Kommt bald!",
  doneBefore: "Schon geschafft - spiel ruhig nochmal.",
  allDone: "Alle Türchen geschafft!",
  progress: "Türchen geschafft",
  esc: "Esc oder Knopf Zurück: zur Karte",
} as const;

/** Bigger bursts for a win. */
const WIN_BURSTS = 5;
const WIN_BURST_COUNT = 26;
const WIN_BURST_SPEED = 110;

/**
 * Opens a visit to a gate.
 *
 * @param game - the gate's minigame
 * @param options - the gate's state and the screen's services
 * @returns the session, on its title card
 */
export function createSession(
  game: MiniGame,
  options: SessionOptions,
): MiniSession {
  let phase: Phase = "title";
  let phaseTime = 0;
  let fadeIn = 0;
  let instance: MiniGameInstance | null = null;
  let runTime = 0;
  let status: MiniStatus = "running";
  let seed = options.seed;
  let wonHere = false;
  let wonBefore = options.done;
  let focus = 0;
  let finale: Finale | null = null;
  let finaleDue = false;
  let countShown = 0;
  const effects: Effects = createEffects(createRandom(options.seed));

  const titleButtons = (): Box[] => {
    const y = CARD.y + CARD.h - BUTTON_H - CARD_PAD;
    const left = CARD.x + CARD.w / 2 - BUTTON_W - BUTTON_GAP / 2;
    return game.ready
      ? [
          { x: left, y, w: BUTTON_W, h: BUTTON_H },
          { x: left + BUTTON_W + BUTTON_GAP, y, w: BUTTON_W, h: BUTTON_H },
        ]
      : [
          {
            x: CARD.x + CARD.w / 2 - BUTTON_W / 2,
            y,
            w: BUTTON_W,
            h: BUTTON_H,
          },
        ];
  };

  const resultButtons = (): Box[] => {
    const y = RESULT.y + RESULT.h - BUTTON_H - CARD_PAD;
    const left = RESULT.x + RESULT.w / 2 - BUTTON_W - BUTTON_GAP / 2;
    return [
      { x: left, y, w: BUTTON_W, h: BUTTON_H },
      { x: left + BUTTON_W + BUTTON_GAP, y, w: BUTTON_W, h: BUTTON_H },
    ];
  };

  const enter = (next: Phase): void => {
    phase = next;
    phaseTime = 0;
    focus = 0;
  };

  const startRun = (): void => {
    instance?.dispose?.();
    instance = game.create({ seed, sound: options.sound });
    seed += 1;
    runTime = 0;
    status = "running";
    countShown = 0;
    enter("count");
    options.sound("count");
  };

  const leave = (): void => {
    if (finaleDue && phase !== "finale") {
      finaleDue = false;
      finale = createFinale(createRandom(seed), options.sound);
      enter("finale");
    } else if (phase !== "leaving") {
      enter("leaving");
    }
  };

  /** Moves the focus with the arrows and presses with action or a tap. */
  const choose = (input: MiniInput, buttons: readonly Box[]): number | null => {
    let chosen: number | null = null;
    if (input.pressed.has("left") || input.pressed.has("up")) {
      focus = (focus + buttons.length - 1) % buttons.length;
      options.sound("click");
    }
    if (input.pressed.has("right") || input.pressed.has("down")) {
      focus = (focus + 1) % buttons.length;
      options.sound("click");
    }
    if (input.pressed.has("action")) {
      chosen = focus;
    }
    for (const tap of input.taps) {
      const hit = buttons.findIndex((box) =>
        inside(
          {
            x: box.x - TAP_SLOP,
            y: box.y - TAP_SLOP,
            w: box.w + TAP_SLOP * 2,
            h: box.h + TAP_SLOP * 2,
          },
          tap.x,
          tap.y,
        ),
      );
      if (hit >= 0) {
        chosen = hit;
      }
    }
    return chosen;
  };

  const stepTitle = (input: MiniInput): void => {
    const chosen = choose(input, titleButtons());
    if (chosen !== null) {
      options.sound("click");
      if (game.ready && chosen === 0) {
        startRun();
      } else {
        leave();
      }
    }
  };

  const stepCount = (): void => {
    const shown = Math.floor(phaseTime / COUNT_STEP);
    if (shown >= COUNT_FROM) {
      options.sound("go");
      enter("play");
    } else if (shown !== countShown) {
      countShown = shown;
      options.sound("count");
    }
  };

  const stepPlay = (input: MiniInput, dt: number): void => {
    if (instance !== null) {
      runTime += dt;
      status = instance.step(input, dt);
      if (status !== "running") {
        enter("end");
        if (status === "won") {
          options.sound("win");
          if (!wonHere && !wonBefore) {
            finaleDue = options.doneCount + 1 >= options.total;
          }
          wonHere = true;
          wonBefore = true;
          options.onWin();
          for (let k = 0; k < WIN_BURSTS; k += 1) {
            effects.burst(
              ((k + 1) * MINI_W) / (WIN_BURSTS + 1),
              MINI_H / 2 - (k % 2) * BUTTON_H,
              { count: WIN_BURST_COUNT, speed: WIN_BURST_SPEED },
            );
          }
        } else {
          options.sound("lose");
        }
      }
    }
  };

  const stepResult = (input: MiniInput): void => {
    const chosen = choose(input, resultButtons());
    if (chosen === 0) {
      options.sound("click");
      startRun();
    } else if (chosen === 1) {
      options.sound("click");
      leave();
    }
  };

  /** Esc or the leave button: out of the run, or out of the finale. */
  const quit = (): void => {
    if (phase === "finale" && finale !== null) {
      enter("leaving");
    } else if (phase !== "leaving") {
      leave();
    }
  };

  const step = (input: MiniInput, dt: number): void => {
    phaseTime += dt;
    fadeIn += dt;
    effects.update(dt);
    if (input.keysPressed.has(LEAVE_KEY)) {
      quit();
    } else {
      switch (phase) {
        case "title":
          stepTitle(input);
          break;
        case "count":
          // Presses during the count-down are not saved up for the run.
          stepCount();
          break;
        case "play":
          stepPlay(input, dt);
          break;
        case "end":
          runTime += dt;
          if (phaseTime >= END_PAUSE) {
            enter("result");
          }
          break;
        case "result":
          runTime += dt;
          stepResult(input);
          break;
        case "finale":
          if (finale !== null && finale.step(input, dt)) {
            enter("leaving");
          }
          break;
        case "leaving":
          break;
      }
    }
  };

  const draw = (g: MiniDraw): void => {
    // Under the result panel the run's own texts would shine through.
    const covered = phase === "result" || phase === "leaving";
    const run: MiniDraw = {
      ...g,
      time: runTime,
      text: covered ? () => undefined : g.text,
    };
    switch (phase) {
      case "title":
        drawTitle(g, game, options, wonBefore, titleButtons(), focus);
        break;
      case "finale":
        finale?.draw(g);
        break;
      default:
        instance?.draw(run);
        break;
    }
    if (phase === "count") {
      const left = COUNT_FROM - Math.floor(phaseTime / COUNT_STEP);
      drawBigText(g, String(left), phaseTime % COUNT_STEP);
    }
    if (phase === "play" && phaseTime < GO_SHOWN) {
      drawBigText(g, TEXTS.go, phaseTime);
    }
    if (
      phase === "result" ||
      (phase === "leaving" && finale === null && status !== "running")
    ) {
      drawResult(
        g,
        status === "won",
        instance?.summary?.() ?? "",
        options.doneCount + (wonHere && !options.done ? 1 : 0),
        options.total,
        resultButtons(),
        phase === "result" ? focus : -1,
      );
    }
    effects.draw(g);
    const dark =
      phase === "leaving"
        ? Math.min(1, phaseTime / FADE)
        : Math.max(0, 1 - fadeIn / FADE);
    if (dark > 0) {
      g.ctx.fillStyle = `rgba(6, 4, 12, ${String(dark)})`;
      g.ctx.fillRect(0, 0, MINI_W, MINI_H);
    }
  };

  return {
    game,
    step,
    draw,
    closed: () => phase === "leaving" && phaseTime >= FADE,
    won: () => wonHere,
    quit,
  };
}

/** The title card: the gate, its number and name, what to do, and buttons. */
function drawTitle(
  g: MiniDraw,
  game: MiniGame,
  options: SessionOptions,
  done: boolean,
  buttons: readonly Box[],
  focus: number,
): void {
  const ctx = g.ctx;
  drawSky(ctx, "#141c44", "#3a4a8a");
  ctx.fillStyle = "#eef3fa";
  ctx.fillRect(0, CARD_GATE_Y - 2, MINI_W, MINI_H - CARD_GATE_Y + 2);
  ctx.fillStyle = "#d2ddef";
  ctx.fillRect(0, CARD_GATE_Y - 2, MINI_W, 1);
  const gate = OBJECTS[CARD_GATES[options.style]];
  drawObject(
    ctx,
    g.art,
    CARD_GATES[options.style],
    CARD_GATE_X - gate[2] / 2,
    CARD_GATE_Y - gate[3],
  );
  // The plate's number in sharp letters, on the red board.
  g.text(
    String(game.number),
    CARD_GATE_X,
    CARD_GATE_Y - gate[3] + PLATE_MIDDLE,
    {
      size: SIZE_GATE,
      bold: true,
      align: "center",
      baseline: "middle",
      color: CREAM,
    },
  );
  drawFigure(
    ctx,
    g.art,
    options.who,
    CARD_GATE_X,
    CARD_GATE_Y + WHO_DOWN,
    "idle",
    "up",
    g.time,
  );
  drawSnowfall(ctx, g.time);
  drawPanel(ctx, CARD);
  const x = CARD.x + CARD_PAD;
  const width = CARD.w - CARD_PAD * 2;
  let y = CARD.y + CARD_PAD;
  g.text(`${TEXTS.gate} ${String(game.number)}`, x, y, {
    size: SIZE_GATE,
    bold: true,
    baseline: "top",
    color: GOLD,
  });
  y += SIZE_GATE * LINE;
  g.text(game.title, x, y, {
    size: SIZE_TITLE,
    bold: true,
    baseline: "top",
    color: CREAM,
  });
  y += SIZE_TITLE * LINE + 2;
  const lines = game.instructions.flatMap((line) =>
    wrapText(line, width, SIZE_TEXT),
  );
  for (const line of lines) {
    g.text(line, x, y, { size: SIZE_TEXT, baseline: "top", color: CREAM });
    y += SIZE_TEXT * LINE;
  }
  y += 2;
  for (const line of wrapText(game.controls, width, SIZE_SMALL)) {
    g.text(line, x, y, { size: SIZE_SMALL, baseline: "top", color: MUTED });
    y += SIZE_SMALL * LINE;
  }
  if (done) {
    g.text(TEXTS.doneBefore, x, y + 1, {
      size: SIZE_SMALL,
      bold: true,
      baseline: "top",
      color: GREEN,
    });
  }
  if (game.ready) {
    drawButton(g, buttons[0], TEXTS.start, focus === 0);
    drawButton(g, buttons[1], TEXTS.back, focus === 1);
  } else {
    g.text(TEXTS.soon, CARD.x + CARD.w / 2, buttons[0].y - SIZE_TEXT, {
      size: SIZE_TEXT,
      bold: true,
      align: "center",
      baseline: "bottom",
      color: GOLD,
    });
    drawButton(g, buttons[0], TEXTS.back, true);
  }
  g.text(TEXTS.esc, MINI_W - CORNER, MINI_H - CORNER, {
    size: SIZE_TINY,
    align: "right",
    baseline: "bottom",
    color: "#6a7aa0",
  });
}

/** The result over the frozen run: won or not, the summary and buttons. */
function drawResult(
  g: MiniDraw,
  won: boolean,
  summary: string,
  done: number,
  total: number,
  buttons: readonly Box[],
  focus: number,
): void {
  g.ctx.fillStyle = "rgba(10, 6, 20, 0.45)";
  g.ctx.fillRect(0, 0, MINI_W, MINI_H);
  drawPanel(g.ctx, RESULT);
  const cx = RESULT.x + RESULT.w / 2;
  let y = RESULT.y + CARD_PAD;
  g.text(won ? TEXTS.won : TEXTS.lost, cx, y, {
    size: SIZE_BIG,
    bold: true,
    align: "center",
    baseline: "top",
    color: won ? GOLD : RED,
    outline: INK,
  });
  y += SIZE_BIG * LINE;
  if (summary !== "") {
    for (const line of wrapText(summary, RESULT.w - CARD_PAD * 2, SIZE_TEXT)) {
      g.text(line, cx, y, {
        size: SIZE_TEXT,
        align: "center",
        baseline: "top",
        color: CREAM,
      });
      y += SIZE_TEXT * LINE;
    }
  }
  g.text(
    done >= total
      ? TEXTS.allDone
      : `${String(done)} / ${String(total)} ${TEXTS.progress}`,
    cx,
    y + 2,
    {
      size: SIZE_SMALL,
      bold: true,
      align: "center",
      baseline: "top",
      color: done >= total ? GOLD : MUTED,
    },
  );
  drawButton(g, buttons[0], TEXTS.again, focus === 0);
  drawButton(g, buttons[1], TEXTS.toMap, focus === 1);
}

/** A big number or word in the middle that pops in and fades. */
function drawBigText(g: MiniDraw, text: string, age: number): void {
  const t = Math.min(1, age / COUNT_STEP);
  const style: TextStyle = {
    size: SIZE_COUNT * (1 + (1 - t) * (1 / 2)),
    bold: true,
    align: "center",
    baseline: "middle",
    color: GOLD,
    outline: INK,
    alpha: 1 - t * t,
  };
  g.text(text, MINI_W / 2, MINI_H / 2, style);
}
