/**
 * Türchen 9 - Der Glücksbringer: Gugor's cap game at the Christmas market;
 * the lucky clover hides under one of three caps, the caps are shuffled,
 * faster every round - which one is it?
 *
 * @module
 * @remarks
 * Five rounds; {@link GOAL} right guesses win. The second wrong guess ends
 * the run, as four out of five can no longer be reached then. Every swap
 * moves two caps along arcs, one in front of the other, so the clover can
 * always be followed by eye.
 */
import type { SpriteRect } from "@/games/weihnachtsmann/components/sprite-atlas";
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import {
  drawFigure,
  drawGlow,
  drawHud,
  drawSprite,
  drawSpriteCentred,
  inside,
  loadSheet,
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
import { SHEET_SRC, SPRITES } from "./sprites";

/** Rounds in a run. */
const ROUNDS = 5;

/** Right guesses that win. */
const GOAL = 4;

/** Wrong guesses allowed before the run is lost, plus one. */
const LIVES = ROUNDS - GOAL + 1;

/** Swaps per round, and the seconds one swap takes, round by round. */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the difficulty curve
const SWAPS: readonly number[] = [4, 5, 6, 7, 9];
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the difficulty curve
const SWAP_TIME: readonly number[] = [0.6, 0.5, 0.42, 0.36, 0.3];

/** Where the three caps stand: their middles and where their rims sit. */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the cap places on the counter
const SLOTS: readonly number[] = [92, 160, 228];
const CAP_FEET = 150;

/** Seconds the clover shows, the caps take to come down, and a lift. */
const SHOW_TIME = 1.5;
const DROP_TIME = 0.45;
const LIFT_TIME = 0.35;

/** Seconds the result of a guess stays before the next round. */
const REVEAL_TIME = 1.5;

/** How high a lifted cap floats, logical px. */
const LIFT_HEIGHT = 30;

/** How far a swapping cap swings to the front or back, logical px. */
const SWING = 9;

/** Half the width of a cap's hit box, and its height, logical px. */
const CAP_HALF = 18;
const CAP_TALL = 40;

/** Where the clover lies above the rim line, logical px. */
const CLOVER_LIFT = 8;

/** Where Gugor stands behind the counter, and the counter's top edge. */
const GUGOR_X = 160;
const GUGOR_FEET = 126;
const COUNTER_TOP = 120;

/** Sparks of a right guess. */
const RIGHT_BURST = 26;

/** Shake on a wrong guess, logical px. */
const SHAKE = 2;

/** A soft swish of cloth for every swap. */
const SWISH: Recipe = {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- seconds, Hz, loudness
  noise: [[0.12, 0, 1400, 0.35]],
};

/** What is going on in a round. */
type Phase = "show" | "drop" | "shuffle" | "choose" | "reveal";

/** One swap: two places that trade their caps. */
type Swap = { readonly a: number; readonly b: number };

/** The minigame behind gate 9. */
export const GAME: MiniGame = {
  number: 9,
  id: "gluecksbringer",
  title: "Der Glücksbringer",
  instructions: [
    "Gugor versteckt das Glückskleeblatt unter einer von drei Mützen und mischt - jede Runde schneller.",
    `Behalte es im Auge und zeig auf die richtige Mütze: ${String(GOAL)} von ${String(ROUNDS)} Runden musst du richtig raten.`,
  ],
  controls:
    "Mütze anklicken oder antippen - oder Pfeile links / rechts und Leertaste.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  /** Which cap stands at each place; cap 0 hides the clover. */
  const capAt: number[] = [0, 1, 2];
  let round = 0;
  let phase: Phase = "show";
  let phaseTime = 0;
  let swaps: Swap[] = [];
  let swapIndex = 0;
  let cursor = 1;
  let chosen = -1;
  let right = 0;
  let wrong = 0;
  let status: MiniStatus = "running";

  const clover = () => capAt.indexOf(0);

  const plan = () => {
    swaps = Array.from({ length: SWAPS[round] }, () => {
      const a = random.int(0, SLOTS.length);
      const b = (a + random.int(1, SLOTS.length)) % SLOTS.length;
      return { a, b };
    });
    swapIndex = 0;
  };

  const begin = (next: Phase) => {
    phase = next;
    phaseTime = 0;
  };

  const guess = (place: number) => {
    chosen = place;
    begin("reveal");
    if (place === clover()) {
      right += 1;
      sound("coin");
      effects.burst(SLOTS[place], CAP_FEET - CLOVER_LIFT, {
        count: RIGHT_BURST,
      });
      effects.float(
        "Richtig!",
        SLOTS[place],
        CAP_FEET - CAP_TALL - LIFT_HEIGHT,
      );
    } else {
      wrong += 1;
      sound("miss");
      effects.shake(SHAKE);
      effects.float(
        "Leider nicht!",
        SLOTS[place],
        CAP_FEET - CAP_TALL - LIFT_HEIGHT,
        "#ff9a9a",
      );
    }
  };

  const choose = (input: MiniInput) => {
    if (input.pressed.has("left")) {
      cursor = Math.max(0, cursor - 1);
      sound("click");
    }
    if (input.pressed.has("right")) {
      cursor = Math.min(SLOTS.length - 1, cursor + 1);
      sound("click");
    }
    const box = (place: number) => ({
      x: SLOTS[place] - CAP_HALF,
      y: CAP_FEET - CAP_TALL,
      w: CAP_HALF * 2,
      h: CAP_TALL,
    });
    const p = input.pointer;
    if (p !== null) {
      const over = SLOTS.findIndex((_, place) => inside(box(place), p.x, p.y));
      if (over >= 0) {
        cursor = over;
      }
    }
    const tap = input.taps.find((point) =>
      SLOTS.some((_, place) => inside(box(place), point.x, point.y)),
    );
    if (tap !== undefined) {
      guess(SLOTS.findIndex((_, place) => inside(box(place), tap.x, tap.y)));
    } else if (input.pressed.has("action")) {
      guess(cursor);
    }
  };

  const advance = (input: MiniInput, dt: number) => {
    phaseTime += dt;
    switch (phase) {
      case "show":
        if (phaseTime >= SHOW_TIME) {
          begin("drop");
          sound("pop");
        }
        break;
      case "drop":
        if (phaseTime >= DROP_TIME) {
          plan();
          begin("shuffle");
          sound(SWISH);
        }
        break;
      case "shuffle":
        if (phaseTime >= SWAP_TIME[round]) {
          const swap = swaps[swapIndex];
          [capAt[swap.a], capAt[swap.b]] = [capAt[swap.b], capAt[swap.a]];
          swapIndex += 1;
          phaseTime -= SWAP_TIME[round];
          if (swapIndex >= swaps.length) {
            begin("choose");
            sound("tick");
          } else {
            sound(SWISH);
          }
        }
        break;
      case "choose":
        choose(input);
        break;
      default:
        if (phaseTime >= REVEAL_TIME + LIFT_TIME) {
          round += 1;
          if (right >= GOAL) {
            status = "won";
          } else if (wrong >= LIVES || round >= ROUNDS) {
            status = "lost";
          } else {
            chosen = -1;
            begin("show");
            sound("whoosh");
          }
        }
    }
  };

  /** Where each cap is drawn now: middle, rim line and lift. */
  const capPlaces = () => {
    const places = SLOTS.map((x) => ({ x, feet: CAP_FEET, lift: 0 }));
    const lifted = (amount: number) => amount * LIFT_HEIGHT;
    if (phase === "show") {
      places[clover()].lift = lifted(Math.min(1, phaseTime / LIFT_TIME));
    } else if (phase === "drop") {
      places[clover()].lift = lifted(1 - Math.min(1, phaseTime / DROP_TIME));
    } else if (phase === "shuffle" && swapIndex < swaps.length) {
      const swap = swaps[swapIndex];
      const t = Math.min(1, phaseTime / SWAP_TIME[round]);
      const ease = (1 - Math.cos(t * Math.PI)) / 2;
      const arc = Math.sin(t * Math.PI) * SWING;
      places[swap.a].x = SLOTS[swap.a] + (SLOTS[swap.b] - SLOTS[swap.a]) * ease;
      places[swap.a].feet = CAP_FEET + arc;
      places[swap.b].x = SLOTS[swap.b] + (SLOTS[swap.a] - SLOTS[swap.b]) * ease;
      places[swap.b].feet = CAP_FEET - arc;
    } else if (phase === "reveal" && chosen >= 0) {
      const up = lifted(Math.min(1, phaseTime / LIFT_TIME));
      places[chosen].lift = up;
      if (chosen !== clover()) {
        places[clover()].lift = lifted(
          Math.max(0, Math.min(1, (phaseTime - LIFT_TIME) / LIFT_TIME)),
        );
      }
    }
    return places;
  };

  return {
    step(input, dt) {
      if (status === "running") {
        advance(input, dt);
      }
      effects.update(dt);
      return status;
    },
    draw(g) {
      const shake = effects.offset();
      g.ctx.save();
      g.ctx.translate(shake.x, shake.y);
      drawScene(g, sheet, {
        places: capPlaces(),
        clover: clover(),
        cursor: phase === "choose" ? cursor : -1,
        mixing: phase === "shuffle",
      });
      effects.draw(g);
      g.ctx.restore();
      drawHud(g, {
        score: right,
        goal: GOAL,
        scoreLabel: "Richtig",
        lives: LIVES - wrong,
        maxLives: LIVES,
      });
      drawCaption(g, Math.min(round + 1, ROUNDS), phase);
    },
    summary() {
      return `${String(right)} von ${String(Math.min(round, ROUNDS))} Runden richtig geraten.`;
    },
  };
}

/** What the scene needs to know. */
type SceneState = {
  readonly places: readonly {
    readonly x: number;
    readonly feet: number;
    readonly lift: number;
  }[];
  /** The place of the cap with the clover. */
  readonly clover: number;
  /** The place the arrow points at, or -1. */
  readonly cursor: number;
  readonly mixing: boolean;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   motions, picked by eye */
/** The stall, Gugor behind the counter, the caps, clover and arrow. */
function drawScene(g: MiniDraw, sheet: HTMLImageElement, s: SceneState): void {
  const ctx = g.ctx;
  const back = SPRITES.backdrop;
  drawSprite(ctx, sheet, back, 0, 0);
  g.text("Gugors Glücksspiel", 160, 68, {
    size: 9,
    bold: true,
    align: "center",
    baseline: "middle",
    color: "#7a3a1a",
  });
  const busy = s.mixing ? g.time * 14 : g.time * 1.5;
  drawFigure(
    ctx,
    g.art,
    "gugor",
    GUGOR_X,
    GUGOR_FEET + (s.mixing ? Math.sin(g.time * 20) : 0),
    s.mixing ? "walk" : "idle",
    "down",
    busy,
  );
  // The counter again, over Gugor's legs.
  const counter: SpriteRect = [
    back[0],
    back[1] + COUNTER_TOP,
    back[2],
    back[3] - COUNTER_TOP,
  ];
  drawSprite(ctx, sheet, counter, 0, COUNTER_TOP);
  const order = s.places
    .map((place, index) => ({ place, index }))
    .sort((a, b) => a.place.feet - b.place.feet);
  for (const { place } of order) {
    const shadow = SPRITES.shadow;
    drawSprite(ctx, sheet, shadow, place.x - shadow[2] / 2, CAP_FEET - 4);
  }
  const under = s.places[s.clover];
  if (under.lift > 2) {
    drawGlow(ctx, under.x, under.feet - CLOVER_LIFT, 16, "255, 220, 90", 0.45);
    const rect = SPRITES.clover;
    drawSprite(
      ctx,
      sheet,
      rect,
      under.x - rect[2] / 2,
      under.feet - CLOVER_LIFT - rect[3] / 2 + Math.sin(g.time * 5),
    );
  }
  for (const { place } of order) {
    const rect = SPRITES.cap;
    drawSprite(
      ctx,
      sheet,
      rect,
      place.x - rect[2] / 2,
      place.feet - rect[3] + 3 - place.lift,
    );
  }
  if (s.cursor >= 0) {
    // Below the cap, pointing up, so it never hides Gugor's face.
    const bob = Math.abs(Math.sin(g.time * 5)) * 2;
    const place = s.places[s.cursor];
    drawGlow(ctx, place.x, CAP_FEET - 14, 24, "255, 230, 120", 0.22);
    drawSpriteCentred(
      ctx,
      sheet,
      SPRITES.arrow,
      place.x,
      CAP_FEET + 10 + bob,
      1,
      Math.PI,
    );
  }
}

/** The line under the HUD: which round, and what to do. */
function drawCaption(g: MiniDraw, round: number, phase: Phase): void {
  const hints: Record<Phase, string> = {
    show: "Hier ist das Kleeblatt!",
    drop: "Gut aufpassen ...",
    shuffle: "Gugor mischt ...",
    choose: "Unter welcher Mütze ist es?",
    reveal: "",
  };
  g.text(`Runde ${String(round)} / ${String(ROUNDS)}`, 314, 7, {
    size: 7,
    bold: true,
    align: "right",
    baseline: "middle",
    color: "#ffe9a8",
    outline: "#2a1430",
  });
  if (hints[phase] !== "") {
    g.text(hints[phase], 160, 172, {
      size: 8,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#fff8e0",
      outline: "#4a1a10",
    });
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
