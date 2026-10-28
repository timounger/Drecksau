/**
 * Türchen 14 - Ein neues Kostüm: in the tailor's room the Weihnachtsmann
 * tries on caps, coats and boots until he looks exactly like the drawing
 * on the easel.
 *
 * @module
 * @remarks
 * Each part has {@link VARIANTS} choices. "Fertig!" with the right costume
 * scores and brings the next drawing; with a wrong one it costs
 * {@link PENALTY} seconds. Dress {@link GOAL} costumes before the clock runs
 * out.
 */
import {
  drawButton,
  drawGlow,
  drawHud,
  drawPanel,
  drawSprite,
  inside,
  loadSheet,
  type Box,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom, type Random } from "../kit/random";
import type {
  MiniDraw,
  MiniEnv,
  MiniGame,
  MiniGameInstance,
  MiniInput,
  MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Costumes to dress. */
const GOAL = 6;

/** Seconds on the clock. */
const TIME = 90;

/** Seconds a wrong "Fertig!" costs. */
const PENALTY = 5;

/** Choices per part. */
const VARIANTS = 4;

/** Parts a new drawing changes, for each costume in turn. */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- two parts for the first three, then all three
const CHANGES: readonly number[] = [2, 2, 2, 3, 3, 3];

/** Seconds the finished costume is admired before the next drawing. */
const ADMIRE = 1.1;

/** Seconds the mannequin twirls when a part changes. */
const TWIRL = 0.18;

/** Where the drawing's figure and the mannequin stand (top left), logical px. */
const MODEL = { x: 22, y: 47 } as const;
const MANNEQUIN = { x: 116, y: 68 } as const;

/** Middle of the mannequin, for bursts, logical px. */
const MANNEQUIN_MIDDLE = { x: 140, y: 110 } as const;

/** The rows on the right: left edge, width, height, and the arrow buttons' width. */
const ROW_X = 186;
const ROW_W = 128;
const ROW_H = 34;
const ARROW_W = 16;

/** Confetti of a finished costume. */
const CONFETTI = 30;

/** Shake on a wrong costume, logical px. */
const SHAKE = 3;

/** One part of the costume. */
type Part = {
  /** German name, as in "Die Mütze stimmt nicht". */
  readonly name: string;
  readonly article: string;
  /** Its four pictures and their German names. */
  readonly sprites: readonly SpriteName[];
  readonly labels: readonly string[];
  /** Middle of its row on the right, logical px. */
  readonly rowY: number;
};

/** The three parts, top to bottom. */
const PARTS: readonly Part[] = [
  {
    name: "Mütze",
    article: "Die",
    sprites: ["hat0", "hat1", "hat2", "hat3"],
    labels: [
      "Rot mit Bommel",
      "Grün mit Bommel",
      "Rot mit Stern",
      "Blau mit Bommel",
    ],
    rowY: 48,
  },
  {
    name: "Mantel",
    article: "Der",
    sprites: ["coat0", "coat1", "coat2", "coat3"],
    labels: [
      "Rot mit Gürtel",
      "Rot mit Knöpfen",
      "Grün mit Gürtel",
      "Blau mit Flocken",
    ],
    rowY: 88,
  },
  {
    name: "Stiefel",
    article: "Die",
    sprites: ["boots0", "boots1", "boots2", "boots3"],
    labels: ["Schwarz", "Braun", "Rot mit Fell", "Schwarz mit Schnalle"],
    rowY: 128,
  },
];

/** The "Fertig!" button. */
const DONE_BUTTON: Box = { x: 206, y: 154, w: 88, h: 18 };

/** Which variant of each part, top to bottom. */
type Costume = number[];

/** The minigame behind gate 14. */
export const GAME: MiniGame = {
  number: 14,
  id: "neues-kostuem",
  title: "Ein neues Kostüm",
  instructions: [
    "Der Weihnachtsmann braucht ein neues Kostüm! Auf der Staffelei siehst du, wie es aussehen soll.",
    "Wähle Mütze, Mantel und Stiefel so, dass er genau wie das Vorbild aussieht, und drück „Fertig!“.",
    `Schaffe ${String(GOAL)} Kostüme in ${String(TIME)} Sekunden. Falsch fertig kostet ${String(PENALTY)} Sekunden.`,
  ],
  controls:
    "Pfeile hoch / runter wählen das Teil, links / rechts wechseln es, Leertaste ist „Fertig!“ - oder alles antippen.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const wearing: Costume = PARTS.map(() => random.int(0, VARIANTS));
  let model: Costume = nextModel(random, wearing, CHANGES[0]);
  let dressed = 0;
  let row = 0;
  let left = TIME;
  let admire = 0;
  let twirl = 0;
  let mistakes = 0;
  let status: MiniStatus = "running";

  const change = (part: number, delta: number) => {
    row = part;
    wearing[part] = (wearing[part] + delta + VARIANTS) % VARIANTS;
    twirl = TWIRL;
    sound("click");
  };

  const finish = () => {
    const wrong = PARTS.findIndex(
      (_, index) => wearing[index] !== model[index],
    );
    if (wrong < 0) {
      dressed += 1;
      admire = ADMIRE;
      sound("coin");
      sound("pop");
      effects.burst(MANNEQUIN_MIDDLE.x, MANNEQUIN_MIDDLE.y, {
        count: CONFETTI,
        speed: 90,
      });
      effects.float("Passt perfekt!", MANNEQUIN_MIDDLE.x, MANNEQUIN.y);
    } else {
      mistakes += 1;
      left -= PENALTY;
      row = wrong;
      sound("miss");
      effects.shake(SHAKE);
      const part = PARTS[wrong];
      effects.float(
        `${part.article} ${part.name} stimmt nicht! -${String(PENALTY)} s`,
        MANNEQUIN_MIDDLE.x,
        MANNEQUIN.y,
        "#ff9a9a",
      );
    }
  };

  const listen = (input: MiniInput) => {
    if (input.pressed.has("up")) {
      row = (row + PARTS.length - 1) % PARTS.length;
      sound("tick");
    }
    if (input.pressed.has("down")) {
      row = (row + 1) % PARTS.length;
      sound("tick");
    }
    if (input.pressed.has("left")) {
      change(row, -1);
    }
    if (input.pressed.has("right")) {
      change(row, 1);
    }
    let done = input.pressed.has("action");
    for (const tap of input.taps) {
      PARTS.forEach((part, index) => {
        const box = rowBox(part);
        if (inside(arrowBox(part, -1), tap.x, tap.y)) {
          change(index, -1);
        } else if (inside(arrowBox(part, 1), tap.x, tap.y)) {
          change(index, 1);
        } else if (inside(box, tap.x, tap.y)) {
          row = index;
          sound("tick");
        }
      });
      done = done || inside(DONE_BUTTON, tap.x, tap.y);
    }
    if (done) {
      finish();
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        left -= dt;
        if (admire > 0) {
          admire -= dt;
          if (admire <= 0) {
            if (dressed >= GOAL) {
              status = "won";
            } else {
              model = nextModel(random, wearing, CHANGES[dressed]);
              sound("whoosh");
            }
          }
        } else {
          listen(input);
        }
        if (status === "running" && left <= 0) {
          left = 0;
          status = "lost";
        }
      }
      twirl = Math.max(0, twirl - dt);
      effects.update(dt);
      return status;
    },
    draw(g) {
      const shake = effects.offset();
      g.ctx.save();
      g.ctx.translate(shake.x, shake.y);
      drawRoom(g, sheet, { model, wearing, row, admire, twirl });
      g.ctx.restore();
      effects.draw(g);
      drawHud(g, {
        score: dressed,
        goal: GOAL,
        scoreLabel: "Kostüme",
        time: left,
      });
    },
    summary() {
      const slips =
        mistakes === 0
          ? "ohne einen Fehlversuch"
          : `mit ${String(mistakes)} Fehlversuch${mistakes === 1 ? "" : "en"}`;
      return `${String(dressed)} von ${String(GOAL)} Kostümen, ${slips}.`;
    },
  };
}

/**
 * The next drawing: differs from what he wears in a given number of parts.
 *
 * @param random - the run's random source
 * @param wearing - the current costume
 * @param changes - how many parts differ
 * @returns the new model
 */
function nextModel(random: Random, wearing: Costume, changes: number): Costume {
  const parts = random
    .shuffle(PARTS.map((_, index) => index))
    .slice(0, changes);
  return wearing.map((variant, index) =>
    parts.includes(index)
      ? (variant + random.int(1, VARIANTS)) % VARIANTS
      : variant,
  );
}

/** A row's whole box on the right. */
function rowBox(part: Part): Box {
  return { x: ROW_X, y: part.rowY - ROW_H / 2, w: ROW_W, h: ROW_H };
}

/** A row's arrow button: left (-1) or right (1). */
function arrowBox(part: Part, side: number): Box {
  const box = rowBox(part);
  return {
    x: side < 0 ? box.x + 2 : box.x + box.w - ARROW_W - 2,
    y: box.y + ARROW_W / 2 - 1,
    w: ARROW_W,
    h: ROW_H - ARROW_W + 2,
  };
}

/** What the room needs to know. */
type RoomState = {
  readonly model: Costume;
  readonly wearing: Costume;
  readonly row: number;
  readonly admire: number;
  readonly twirl: number;
};

/** Draws the dress-up Santa in a costume with its top left at a point. */
function drawSanta(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  costume: Costume,
  x: number,
  y: number,
): void {
  drawSprite(ctx, sheet, SPRITES.body, x, y);
  drawSprite(ctx, sheet, SPRITES[PARTS[2].sprites[costume[2]]], x, y);
  drawSprite(ctx, sheet, SPRITES[PARTS[1].sprites[costume[1]]], x, y);
  drawSprite(ctx, sheet, SPRITES.beard, x, y);
  drawSprite(ctx, sheet, SPRITES[PARTS[0].sprites[costume[0]]], x, y);
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** The room: easel with the model, the mannequin, the rows and the button. */
function drawRoom(g: MiniDraw, sheet: HTMLImageElement, s: RoomState): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  drawSprite(ctx, sheet, SPRITES.easel, 6, 22);
  drawSanta(ctx, sheet, s.model, MODEL.x, MODEL.y);
  g.text("Vorbild", 46, 164, {
    size: 7,
    bold: true,
    align: "center",
    baseline: "middle",
    color: "#ffe9a8",
    outline: "#2a1430",
  });
  // The mannequin on its podium; it twirls when a part changes and hops
  // when the costume is right.
  drawSprite(ctx, sheet, SPRITES.podium, 108, 155);
  if (s.admire > 0) {
    drawGlow(ctx, 140, 110, 50, "255, 230, 120", 0.35);
  }
  const hop = s.admire > 0 ? Math.abs(Math.sin(s.admire * 10)) * 5 : 0;
  const squeeze = 1 - Math.sin((s.twirl / TWIRL) * Math.PI) * 0.6;
  ctx.save();
  ctx.translate(140, 0);
  ctx.scale(squeeze, 1);
  ctx.translate(-140, 0);
  drawSanta(ctx, sheet, s.wearing, MANNEQUIN.x, MANNEQUIN.y - hop);
  ctx.restore();
  // The rows.
  PARTS.forEach((part, index) => {
    const box = rowBox(part);
    const focused = index === s.row;
    drawPanel(
      ctx,
      box,
      focused ? "rgba(70, 30, 50, 0.92)" : "rgba(28, 14, 34, 0.82)",
      focused ? "#ffe27a" : "#a87a18",
    );
    drawButton(g, arrowBox(part, -1), "<", focused);
    drawButton(g, arrowBox(part, 1), ">", focused);
    g.text(part.name, box.x + box.w / 2, box.y + 9, {
      size: 6,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#e8b830",
    });
    g.text(part.labels[s.wearing[index]], box.x + box.w / 2, box.y + 21, {
      size: 6,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#fff4dc",
    });
    // Dots: which of the four is chosen.
    for (let k = 0; k < VARIANTS; k += 1) {
      ctx.fillStyle =
        k === s.wearing[index] ? "#ffe27a" : "rgba(255, 255, 255, 0.25)";
      ctx.fillRect(box.x + box.w / 2 - 9 + k * 5, box.y + 28, 3, 2);
    }
  });
  drawButton(g, DONE_BUTTON, "Fertig!", true);
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
