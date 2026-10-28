/**
 * Türchen 16 - Troll-Klopfen: Grantelbart and Gugor keep popping out of nine
 * snow holes; boop them back with the squeaky hammer - but spare the elves.
 *
 * @module
 * @remarks
 * Boop {@link GOAL} trolls before the clock runs out. Every elf booped
 * costs a heart; with none left the run is lost. Later on, more figures pop
 * up at once and duck away sooner.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import type { FigureId } from "@/games/weihnachtsmann/components/sprite-atlas";
import {
  drawFigure,
  drawHud,
  drawSprite,
  drawSpriteCentred,
  loadSheet,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom } from "../kit/random";
import type {
  MiniDraw,
  MiniEnv,
  MiniGame,
  MiniGameInstance,
  MiniInput,
  MiniPoint,
  MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES } from "./sprites";

/** Trolls to boop. */
const GOAL = 25;

/** Seconds on the clock. */
const TIME = 45;

/** Hearts: elves that may be booped by mistake. */
const LIVES = 3;

/** Holes per row (and rows). */
const COLUMNS = 3;

/** Seconds between two pop-ups, at the start and at the end. */
const POP_SLOW = 0.85;
const POP_FAST = 0.5;

/** Seconds a figure stays up, at the start and at the end. */
const STAY_LONG = 1.0;
const STAY_SHORT = 0.65;

/** Most figures up at once, at the start and at the end. */
const CROWD_START = 2;
const CROWD_END = 4;

/** Seconds to rise or duck. */
const RISE = 0.14;

/** Seconds a booped troll sees stars before it ducks. */
const DIZZY = 0.35;

/** Chance a pop-up is an elf. */
const ELF_CHANCE = 0.3;

/** A figure must be up this far to be booped. */
const BOOPABLE = 0.4;

/** How far a figure rises out of its hole, logical px. */
const RISE_HEIGHT = 36;

/** Where a risen figure's feet are, below the hole's middle, logical px. */
const FEET_DROP = 4;

/** The hole hides everything below this line, below its middle, logical px. */
const HOLE_LIP = 3;

/** A tap counts for a hole within this distance sideways, and this far above and below its middle, logical px. */
const TAP_HALF = 26;
const TAP_ABOVE = 36;
const TAP_BELOW = 10;

/** Seconds the hammer is down after a boop, and between two boops. */
const SWING = 0.14;
const COOLDOWN = 0.12;

/** The hammer's tilt when raised and when down, radians. */
const RAISED = -0.5;
const DOWN = 0.5;

/** Where the face is above the feet, for the bump star, logical px. */
const FACE = 26;

/** Sparks of a boop. */
const BOOP_SPARKS = 12;

/** Shake when an elf is booped, logical px. */
const SHAKE = 3;

/** Where the hammer is drawn from the point it aims at, logical px. */
const HAMMER_OFFSET = { x: 6, y: -24 } as const;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the sound: pitches in
   Hz, times in seconds, loudness shares */
/** The squeaky hammer on a troll's head. */
const SQUEAK: Recipe = {
  tones: [
    ["square", 900, 1500, 0.07, 0, 0.3],
    ["square", 1500, 1100, 0.08, 0.07, 0.25],
    ["sine", 180, 90, 0.12, 0, 0.8],
  ],
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The trolls and the elves. */
const TROLLS: readonly FigureId[] = ["grantelbart", "gugor"];
const ELVES: readonly FigureId[] = ["gilfi", "jordi", "trixi"];

/** What a booped troll grumbles. */
const GRUMBLES: readonly string[] = ["Grmpf!", "Autsch!", "Pah!", "Na toll."];

/** The rows' and the columns' middles, logical px (as painted on the backdrop). */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the holes on the backdrop
const ROWS_Y: readonly number[] = [70, 112, 154];
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the holes on the backdrop
const COLUMNS_X: readonly number[] = [80, 160, 240];

/** The holes' middles, row by row, logical px. */
const HOLES: readonly MiniPoint[] = ROWS_Y.flatMap((y) =>
  COLUMNS_X.map((x) => ({ x, y })),
);

/** Somebody popping up out of a hole. */
type Popper = {
  readonly hole: number;
  readonly who: FigureId;
  readonly elf: boolean;
  /** Seconds since it began to rise. */
  age: number;
  readonly stay: number;
  /** Seconds since it was booped, or -1. */
  booped: number;
};

/** The minigame behind gate 16. */
export const GAME: MiniGame = {
  number: 16,
  id: "troll-klopfen",
  title: "Troll-Klopfen",
  instructions: [
    "Grantelbart und Gugor tauchen immer wieder aus den Schneelöchern auf.",
    `Stups sie mit dem Quietschhammer zurück - ${String(GOAL)} Trolle in ${String(TIME)} Sekunden!`,
    "Die Elfen in Rot - Gilfi, Jordi und Trixi - nicht hauen: Jeder Elf kostet ein Herz.",
  ],
  controls:
    "Loch anklicken oder antippen - oder Zifferntasten 1-9, oder Pfeile + Leertaste.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const poppers: Popper[] = [];
  let hits = 0;
  let lives = LIVES;
  let left = TIME;
  let popIn = 1 / 2;
  let cursor = Math.floor(HOLES.length / 2);
  let hammer: MiniPoint = HOLES[cursor];
  let swing = 0;
  let cooldown = 0;
  let status: MiniStatus = "running";

  const share = () => 1 - left / TIME;

  const popUp = () => {
    const crowd = Math.round(CROWD_START + (CROWD_END - CROWD_START) * share());
    const free = HOLES.map((_, index) => index).filter(
      (index) => !poppers.some((popper) => popper.hole === index),
    );
    if (free.length > 0 && poppers.length < crowd) {
      const elf = random.chance(ELF_CHANCE);
      poppers.push({
        hole: random.pick(free),
        who: random.pick(elf ? ELVES : TROLLS),
        elf,
        age: 0,
        stay: STAY_LONG + (STAY_SHORT - STAY_LONG) * share(),
        booped: -1,
      });
    }
    popIn = POP_SLOW + (POP_FAST - POP_SLOW) * share();
  };

  const boop = (hole: number) => {
    const at = HOLES[hole];
    cursor = hole;
    hammer = at;
    swing = SWING;
    cooldown = COOLDOWN;
    const target = poppers.find(
      (popper) =>
        popper.hole === hole && popper.booped < 0 && risen(popper) > BOOPABLE,
    );
    if (target === undefined) {
      sound("bump");
      effects.burst(at.x, at.y, {
        colors: ["#ffffff", "#d2ddef"],
        speed: 30,
        count: 6,
      });
    } else {
      target.booped = 0;
      const face = feetOf(target) - FACE;
      if (target.elf) {
        lives -= 1;
        sound("miss");
        effects.shake(SHAKE);
        effects.float(
          "Aua! Ich bin ein Elf!",
          at.x,
          face - FACE / 2,
          "#ff9a9a",
        );
      } else {
        hits += 1;
        sound(SQUEAK);
        effects.burst(at.x, face, {
          count: BOOP_SPARKS,
          colors: ["#ffe27a", "#ffffff", "#ff5a6a"],
        });
        effects.float(random.pick(GRUMBLES), at.x, face - FACE / 2);
      }
    }
  };

  const listen = (input: MiniInput) => {
    const before = cursor;
    if (input.pressed.has("left") && cursor % COLUMNS > 0) {
      cursor -= 1;
    }
    if (input.pressed.has("right") && cursor % COLUMNS < COLUMNS - 1) {
      cursor += 1;
    }
    if (input.pressed.has("up") && cursor >= COLUMNS) {
      cursor -= COLUMNS;
    }
    if (input.pressed.has("down") && cursor < HOLES.length - COLUMNS) {
      cursor += COLUMNS;
    }
    if (cursor !== before) {
      hammer = HOLES[cursor];
      sound("tick");
    }
    let wanted = input.pressed.has("action") ? cursor : -1;
    for (const code of input.keysPressed) {
      const digit = /^(?:Digit|Numpad)([1-9])$/.exec(code);
      if (digit !== null) {
        wanted = Number(digit[1]) - 1;
      }
    }
    for (const tap of input.taps) {
      const hole = holeAt(tap);
      if (hole >= 0) {
        wanted = hole;
      }
    }
    if (input.pointer !== null && wanted < 0 && swing <= 0) {
      const hole = holeAt(input.pointer);
      hammer = input.pointer;
      if (hole >= 0) {
        cursor = hole;
      }
    }
    if (wanted >= 0 && cooldown <= 0) {
      boop(wanted);
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        left -= dt;
        popIn -= dt;
        swing -= dt;
        cooldown -= dt;
        if (popIn <= 0) {
          popUp();
        }
        listen(input);
        for (const popper of poppers) {
          popper.age += dt;
          if (popper.booped >= 0) {
            popper.booped += dt;
          }
        }
        removeWhere(
          poppers,
          (popper) =>
            popper.age > popper.stay + RISE * 2 || popper.booped > DIZZY + RISE,
        );
        if (hits >= GOAL) {
          status = "won";
        } else if (lives <= 0 || left <= 0) {
          status = "lost";
        }
      }
      effects.update(dt);
      return status;
    },
    draw(g) {
      const shake = effects.offset();
      g.ctx.save();
      g.ctx.translate(shake.x, shake.y);
      drawMeadow(g, sheet, poppers, cursor);
      drawSpriteCentred(
        g.ctx,
        sheet,
        swing > 0 ? SPRITES.hammerSquash : SPRITES.hammer,
        hammer.x + HAMMER_OFFSET.x,
        hammer.y + HAMMER_OFFSET.y,
        1,
        swing > 0 ? DOWN : RAISED,
      );
      g.ctx.restore();
      effects.draw(g);
      drawHud(g, {
        score: hits,
        goal: GOAL,
        scoreLabel: "Trolle",
        time: left,
        lives,
        maxLives: LIVES,
      });
    },
    summary() {
      return `${String(hits)} von ${String(GOAL)} Trollen zurückgestupst.`;
    },
  };
}

/** The hole a point is on, or -1. */
function holeAt(point: MiniPoint): number {
  return HOLES.findIndex(
    (hole) =>
      Math.abs(point.x - hole.x) < TAP_HALF &&
      point.y > hole.y - TAP_ABOVE &&
      point.y < hole.y + TAP_BELOW,
  );
}

/**
 * How far a figure is up, 0 (hidden) to 1 (up); a booped troll ducks after
 * seeing stars.
 */
function risen(popper: Popper): number {
  let up = Math.min(1, popper.age / RISE);
  if (popper.booped > DIZZY) {
    up = Math.max(0, 1 - (popper.booped - DIZZY) / RISE);
  } else if (popper.booped < 0 && popper.age > popper.stay + RISE) {
    up = Math.max(0, 1 - (popper.age - popper.stay - RISE) / RISE);
  }
  return up;
}

/** Where a figure's feet are now, logical px from the top. */
function feetOf(popper: Popper): number {
  return HOLES[popper.hole].y + FEET_DROP + (1 - risen(popper)) * RISE_HEIGHT;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** The meadow, the holes with their figures and lips, and the number signs. */
function drawMeadow(
  g: MiniDraw,
  sheet: HTMLImageElement,
  poppers: readonly Popper[],
  cursor: number,
): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  HOLES.forEach((hole, index) => {
    if (index === cursor) {
      ctx.strokeStyle = `rgba(255, 226, 122, ${String(0.6 + 0.3 * Math.sin(g.time * 8))})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(hole.x, hole.y, 28, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    const popper = poppers.find((candidate) => candidate.hole === index);
    if (popper !== undefined) {
      const feet = feetOf(popper);
      ctx.save();
      ctx.beginPath();
      ctx.rect(hole.x - 30, 0, 60, hole.y + HOLE_LIP);
      ctx.clip();
      const dizzy = popper.booped >= 0;
      const wobble = dizzy ? Math.sin(popper.booped * 50) * 1.5 : 0;
      drawFigure(
        ctx,
        g.art,
        popper.who,
        hole.x + wobble,
        feet,
        "idle",
        "down",
        g.time * 2,
      );
      if (dizzy && !popper.elf) {
        drawSpriteCentred(
          ctx,
          sheet,
          SPRITES.bump,
          hole.x + Math.cos(g.time * 12) * 6,
          feet - FACE - 6 + Math.sin(g.time * 12) * 2,
        );
      }
      ctx.restore();
    }
    const lip = SPRITES.lip;
    drawSprite(ctx, sheet, lip, hole.x - lip[2] / 2, hole.y - 8);
    const sign = SPRITES.sign;
    drawSprite(ctx, sheet, sign, hole.x + 22, hole.y + 4);
    g.text(String(index + 1), hole.x + 26.5, hole.y + 8.5, {
      size: 6,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#fff4dc",
    });
  });
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Removes the entries of a list that pass a test, in place. */
function removeWhere<T>(list: T[], gone: (item: T) => boolean): void {
  const keep = list.filter((item) => !gone(item));
  list.splice(0, list.length, ...keep);
}
