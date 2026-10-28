/**
 * Türchen 17 - Gugors Doppelgänger: a whole crowd of Gugors stands in the
 * snow, and one of them is not quite like the others - find him.
 *
 * @module
 * @remarks
 * {@link ROUNDS} rounds, each with more Gugors, less time and a smaller
 * difference: first one is turned away, later only his hat or coat has
 * another colour. A wrong pick or a round that runs out costs a heart;
 * the round then starts again with a new crowd.
 */
import {
  drawEffect,
  drawGlow,
  drawHud,
  drawSnowfall,
  drawSprite,
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

/** Rounds to win. */
const ROUNDS = 8;

/** Hearts: wrong picks or rounds run out. */
const LIVES = 3;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the rounds' crowd,
   columns, seconds and level, tuned by hand */
/** How many Gugors stand in each round. */
const CROWD: readonly number[] = [6, 8, 10, 12, 12, 15, 15, 18];

/** Columns of the crowd by its size. */
const COLUMNS: Readonly<Record<number, number>> = {
  6: 3,
  8: 4,
  10: 5,
  12: 4,
  15: 5,
  18: 6,
};

/** Seconds to find him in each round. */
const ROUND_TIME: readonly number[] = [12, 12, 11, 10, 10, 9, 9, 8];

/** How hard the difference is in each round: 0 easy, 2 fine. */
const LEVEL: readonly number[] = [0, 0, 1, 1, 1, 2, 2, 2];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The differences of each level. */
const VARIANTS: readonly (readonly Variant[])[] = [
  ["back", "side"],
  ["hatRed", "coatBlue", "scarf", "bobble"],
  ["hatGrey", "hatOlive", "coatTeal", "noBelt"],
];

/** What the odd Gugor grumbles when found. */
const GRUMBLES = ["Pfff.", "Na gut.", "Erwischt.", "Alles doof."] as const;

/** Seconds the crowd takes to pop up. */
const POP_IN = 0.45;

/** Seconds the found (or missed) Gugor is shown before the next round. */
const REVEAL = 1.1;

/** Seconds of cheering after the last round before the result. */
const OUTRO = 1;

/** Idle frames per second. */
const IDLE_RATE = 1.6;

/** Seconds a wrong Gugor shakes his head. */
const SHAKE_TIME = 0.5;

/** How far a tap may be from a Gugor's middle and still pick him, logical px. */
const PICK_X = 13;
const PICK_UP = 32;
const PICK_DOWN = 4;

/** Where a Gugor's middle is above his feet, logical px. */
const BODY = 14;

/** Sparks of a find. */
const FIND_BURST = 22;

/** Shake of a wrong pick, logical px. */
const SHAKE = 2.5;

/** Snowflakes in front of the clearing. */
const FLAKES = 24;

/** How far each Gugor may stand off his place, logical px. */
const JITTER_X = 3;
const JITTER_Y = 2;

/** One kind of Gugor on the sheet: its name without the frame number. */
type Variant =
  | "plain"
  | "back"
  | "side"
  | "hatRed"
  | "coatBlue"
  | "scarf"
  | "bobble"
  | "hatGrey"
  | "hatOlive"
  | "coatTeal"
  | "noBelt";

/** One Gugor of the crowd. */
type Gugor = {
  readonly x: number;
  readonly y: number;
  readonly variant: Variant;
  readonly mirror: boolean;
  /** Offset of his idle animation, so they do not all bob together. */
  readonly phase: number;
  /** Seconds left of shaking his head after a wrong pick. */
  shake: number;
};

/** Where the run stands. */
type Phase = "popIn" | "pick" | "reveal" | "outro";

/** The minigame behind gate 17. */
export const GAME: MiniGame = {
  number: 17,
  id: "doppelgaenger",
  title: "Gugors Doppelgänger",
  instructions: [
    "Gugor hat sich verdoppelt - und verdreifacht! Aber einer der Gugors sieht anders aus.",
    "Finde ihn, bevor die Zeit abläuft: andere Mütze, anderer Mantel, ein Schal ... oder er schaut weg.",
    `Schaffe ${String(ROUNDS)} Runden. Ein falscher Gugor oder eine abgelaufene Runde kostet ein Herz.`,
  ],
  controls:
    "Gugor anklicken oder antippen - oder mit den Pfeilen wählen und Leertaste.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  let round = 0;
  let found = 0;
  let lives = LIVES;
  let crowd: Gugor[] = [];
  let odd = 0;
  let cursor = 0;
  let lastPointer: MiniPoint | null = null;
  let phase: Phase = "popIn";
  let phaseTime = 0;
  let timeLeft = ROUND_TIME[0];
  let wasFound = false;
  let ending: MiniStatus = "running";
  let status: MiniStatus = "running";

  const deal = () => {
    const made = makeCrowd(random, round);
    crowd = made.crowd;
    odd = made.odd;
    cursor = Math.min(cursor, crowd.length - 1);
    timeLeft = ROUND_TIME[round];
    phase = "popIn";
    phaseTime = 0;
    sound("whoosh");
  };

  const reveal = (success: boolean) => {
    const gugor = crowd[odd];
    phase = "reveal";
    phaseTime = 0;
    wasFound = success;
    if (success) {
      found += 1;
      sound("coin");
      effects.burst(gugor.x, gugor.y - BODY, { count: FIND_BURST });
      effects.float("Gefunden!", gugor.x, gugor.y - PICK_UP);
    } else {
      lives -= 1;
      sound("miss");
      effects.float("Hier war er!", gugor.x, gugor.y - PICK_UP, "#ff9a9a");
    }
  };

  const pick = (index: number) => {
    if (index === odd) {
      reveal(true);
    } else {
      const gugor = crowd[index];
      gugor.shake = SHAKE_TIME;
      lives -= 1;
      sound("bump");
      effects.shake(SHAKE);
      effects.float("Nö!", gugor.x, gugor.y - PICK_UP, "#ff9a9a");
      if (lives <= 0) {
        reveal(false);
        lives = 0;
      }
    }
  };

  const choose = (input: MiniInput) => {
    const columns = COLUMNS[crowd.length];
    const count = crowd.length;
    const moves: [MiniButton, number][] = [
      ["left", -1],
      ["right", 1],
      ["up", -columns],
      ["down", columns],
    ];
    for (const [button, delta] of moves) {
      if (input.pressed.has(button)) {
        cursor = (cursor + delta + count) % count;
        sound("click");
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
      const hover = nearest(crowd, pointer);
      cursor = hover >= 0 ? hover : cursor;
    }
    if (input.pressed.has("action")) {
      pick(cursor);
    }
    for (const tap of input.taps) {
      const hit = nearest(crowd, tap);
      if (hit >= 0 && phase === "pick") {
        cursor = hit;
        pick(hit);
      }
    }
  };

  const advance = (input: MiniInput, dt: number) => {
    phaseTime += dt;
    switch (phase) {
      case "popIn":
        if (phaseTime >= POP_IN) {
          phase = "pick";
          phaseTime = 0;
        }
        break;
      case "pick":
        timeLeft -= dt;
        choose(input);
        if (phase === "pick" && timeLeft <= 0) {
          timeLeft = 0;
          reveal(false);
        }
        break;
      case "reveal":
        if (phaseTime >= REVEAL) {
          if (found >= ROUNDS) {
            phase = "outro";
            phaseTime = 0;
            ending = "won";
            sound("fanfare");
          } else if (lives <= 0) {
            phase = "outro";
            phaseTime = 0;
            ending = "lost";
          } else {
            round = wasFound ? round + 1 : round;
            deal();
          }
        }
        break;
      case "outro":
        if (phaseTime >= OUTRO) {
          status = ending;
        }
        break;
    }
  };

  deal();

  return {
    step(input, dt) {
      if (status === "running") {
        advance(input, dt);
      }
      for (const gugor of crowd) {
        gugor.shake = Math.max(0, gugor.shake - dt);
      }
      effects.update(dt);
      return status;
    },
    draw(g) {
      const offset = effects.offset();
      g.ctx.save();
      g.ctx.translate(offset.x, offset.y);
      drawSprite(g.ctx, sheet, SPRITES.backdrop, 0, 0);
      drawCrowd(g, sheet, {
        crowd,
        odd,
        cursor,
        phase,
        phaseTime,
        found: wasFound,
      });
      drawSnowfall(g.ctx, g.time, FLAKES);
      g.ctx.restore();
      effects.draw(g);
      drawTimeBar(g, phase === "pick" ? timeLeft / ROUND_TIME[round] : 0);
      drawHud(g, {
        score: found,
        goal: ROUNDS,
        scoreLabel: "Gefunden",
        time: timeLeft,
        lives,
        maxLives: LIVES,
      });
    },
    summary() {
      return `${String(found)} von ${String(ROUNDS)} Doppelgängern gefunden.`;
    },
  };
}

/**
 * A new crowd for a round: all plain but one.
 *
 * @param random - the run's random source
 * @param round - the round, from 0
 * @returns the crowd and which of them is the odd one
 */
function makeCrowd(
  random: Random,
  round: number,
): { crowd: Gugor[]; odd: number } {
  const count = CROWD[round];
  const columns = COLUMNS[count];
  const rows = count / columns;
  const odd = random.int(0, count);
  const variant = random.pick(VARIANTS[LEVEL[round]]);
  const layout = gridLayout(columns, rows);
  const crowd = Array.from({ length: count }, (_, index): Gugor => {
    const spot = layout(index);
    return {
      x: spot.x + random.range(-JITTER_X, JITTER_X),
      y: spot.y + random.range(-JITTER_Y, JITTER_Y),
      variant: index === odd ? variant : "plain",
      mirror: index === odd && variant === "side" && random.chance(1 / 2),
      phase: random.range(0, 2),
      shake: 0,
    };
  });
  return { crowd, odd };
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the crowd's layout
   on the snowfield, picked by eye */
/**
 * Where the Gugors of a grid stand.
 *
 * @param columns - Gugors per row
 * @param rows - rows
 * @returns the feet of the Gugor with a given index
 */
function gridLayout(
  columns: number,
  rows: number,
): (index: number) => MiniPoint {
  const gapX = columns <= 4 ? 58 : columns === 5 ? 50 : 44;
  const gapY = rows === 2 ? 54 : 44;
  const firstY = rows === 2 ? 102 : 84;
  return (index) => ({
    x: MINI_W / 2 + ((index % columns) - (columns - 1) / 2) * gapX,
    y: firstY + Math.floor(index / columns) * gapY,
  });
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * The Gugor under a point.
 *
 * @param crowd - the crowd
 * @param point - logical px
 * @returns his index, or -1 when the point hits nobody
 */
function nearest(crowd: readonly Gugor[], point: MiniPoint): number {
  let best = -1;
  let bestDistance = Infinity;
  crowd.forEach((gugor, index) => {
    const dx = Math.abs(point.x - gugor.x);
    const dy = point.y - gugor.y;
    const distance = dx + Math.abs(dy + BODY);
    if (
      dx < PICK_X &&
      dy > -PICK_UP &&
      dy < PICK_DOWN &&
      distance < bestDistance
    ) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

/** What the crowd needs to know. */
type CrowdState = {
  readonly crowd: readonly Gugor[];
  readonly odd: number;
  readonly cursor: number;
  readonly phase: Phase;
  readonly phaseTime: number;
  readonly found: boolean;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- figure offsets and
   animation, picked by eye */
/** The Gugors on their mounds, the cursor and the reveal. */
function drawCrowd(g: MiniDraw, sheet: HTMLImageElement, s: CrowdState): void {
  const ctx = g.ctx;
  const showing =
    s.phase !== "popIn" || s.phaseTime > POP_IN / 3 || s.crowd.length === 0;
  s.crowd.forEach((gugor) => {
    const mound = SPRITES.mound;
    drawSprite(ctx, sheet, mound, gugor.x - mound[2] / 2, gugor.y - 4);
  });
  s.crowd.forEach((gugor, index) => {
    const isOdd = index === s.odd;
    const revealing = s.phase === "reveal" || s.phase === "outro";
    if (isOdd && revealing) {
      const pulse = 0.35 + Math.sin(g.time * 10) * 0.12;
      drawGlow(
        ctx,
        gugor.x,
        gugor.y - BODY,
        22,
        s.found ? "255, 220, 90" : "255, 90, 90",
        pulse,
      );
    }
    if (showing) {
      const hop =
        isOdd && revealing && s.found
          ? Math.abs(Math.sin(s.phaseTime * 9)) * 6
          : 0;
      const wobble =
        gugor.shake > 0 ? Math.round(Math.sin(gugor.shake * 40) * 1.5) : 0;
      const frame = Math.floor(g.time * IDLE_RATE + gugor.phase) % 2;
      const rect = SPRITES[`${gugor.variant}${String(frame)}` as SpriteName];
      drawSprite(
        ctx,
        sheet,
        rect,
        gugor.x - 20 + wobble,
        gugor.y - 38 - hop,
        gugor.mirror,
      );
    }
    if (s.phase === "popIn") {
      const k = Math.min(2, Math.floor((s.phaseTime / POP_IN) * 3));
      drawEffect(
        ctx,
        g.art,
        (["poof0", "poof1", "poof2"] as const)[k],
        gugor.x,
        gugor.y - BODY,
      );
    }
  });
  const chosen = s.crowd[s.cursor];
  if (s.phase === "pick" && chosen !== undefined) {
    const frame = SPRITES.cursor;
    const bob = Math.round(Math.sin(g.time * 6)) / 2;
    drawSprite(
      ctx,
      sheet,
      frame,
      chosen.x - frame[2] / 2,
      chosen.y - BODY - frame[3] / 2 - 1 + bob,
    );
  }
  const oddOne = s.crowd[s.odd];
  if (
    (s.phase === "reveal" || s.phase === "outro") &&
    s.found &&
    oddOne !== undefined &&
    s.phaseTime > 0.35
  ) {
    g.text(
      GRUMBLES[s.odd % GRUMBLES.length],
      oddOne.x,
      oddOne.y - 40 - Math.abs(Math.sin(s.phaseTime * 9)) * 6,
      {
        size: 6,
        bold: true,
        align: "center",
        baseline: "middle",
        color: "#ffffff",
        outline: "#2a1430",
      },
    );
  }
}

/** A thin bar under the HUD that runs down with the round's time. */
function drawTimeBar(g: MiniDraw, share: number): void {
  const ctx = g.ctx;
  ctx.fillStyle = "rgba(20, 10, 26, 0.45)";
  ctx.fillRect(0, HUD_H + 0.5, MINI_W, 2);
  ctx.fillStyle = share > 0.3 ? "#7ae08a" : "#ff7a7a";
  ctx.fillRect(0, HUD_H + 0.5, MINI_W * Math.max(0, share), 2);
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
