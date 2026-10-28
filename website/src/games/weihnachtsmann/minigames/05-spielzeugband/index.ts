/**
 * Türchen 5 - Das Spielzeugband: toys come along the workshop belt; send
 * each into its sack - teddies left, trains in the middle, balls right.
 *
 * @module
 * @remarks
 * The toy at the front of the belt is the one sorted next (it glows). A toy
 * in the wrong sack or one that drops off the belt's end into the scrap
 * crate costs a heart. Sort {@link GOAL} toys right to win.
 */
import {
  drawFigure,
  drawGlow,
  drawHud,
  drawSprite,
  drawSpriteCentred,
  inside,
  loadSheet,
  type Box,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom } from "../kit/random";
import {
  type MiniButton,
  type MiniDraw,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Toys to sort right. */
const GOAL = 20;

/** Hearts. */
const LIVES = 3;

/** Belt speed, logical px per second, at the start and at the end. */
const BELT_SLOW = 36;
const BELT_FAST = 62;

/** Seconds between two toys, at the start and at the end. */
const NEXT_SLOW = 2.1;
const NEXT_FAST = 1.05;

/** Where the toys stand on the belt (their bottom), logical px. */
const BELT_Y = 90;

/** Where the belt ends and toys drop into the crate, logical px. */
const BELT_END = 262;

/** Seconds a sorted toy flies, and how high its arc goes. */
const FLY = 0.45;
const ARC = 30;

/** Seconds a dropped toy takes to fall into the crate. */
const DROP = 0.35;

/** Where toys land in a sack, logical px from the top. */
const SACK_MOUTH = 134;

/** Top of the sacks, logical px. */
const SACK_TOP = 128;

/** Floating texts start this far above where it happened, logical px. */
const TEXT_LIFT = 5;

/** Shake on a mistake, logical px. */
const SHAKE = 3;

/** The toys there are, each with its sack. */
const KINDS = ["teddy", "train", "ball"] as const;

/** One toy kind. */
type Kind = (typeof KINDS)[number];

/** A sack: where it stands, its picture, its toy and its key. */
type Sack = {
  readonly x: number;
  readonly sprite: SpriteName;
  readonly kind: Kind;
  readonly button: MiniButton;
  readonly label: string;
};

/** The three sacks. */
const SACKS: readonly Sack[] = [
  {
    x: 80,
    sprite: "sackRed",
    kind: "teddy",
    button: "left",
    label: "← Teddys",
  },
  {
    x: 160,
    sprite: "sackBlue",
    kind: "train",
    button: "down",
    label: "↓ Eisenbahnen",
  },
  {
    x: 240,
    sprite: "sackGreen",
    kind: "ball",
    button: "right",
    label: "→ Bälle",
  },
];

/** A toy on its way. */
type Toy = {
  readonly kind: Kind;
  x: number;
  y: number;
  /** On the belt, flying into a sack, or dropping into the crate. */
  state: "belt" | "fly" | "drop";
  /** Seconds in the current state. */
  age: number;
  /** The sack it flies to, or -1. */
  sack: number;
  readonly fromX: number;
  fromY: number;
};

/** The minigame behind gate 5. */
export const GAME: MiniGame = {
  number: 5,
  id: "spielzeugband",
  title: "Das Spielzeugband",
  instructions: [
    "Die Spielzeugmaschine läuft heiß! Schick jedes Spielzeug in den richtigen Sack:",
    "Teddys nach links, Eisenbahnen in die Mitte, Bälle nach rechts.",
    `Sortier ${String(GOAL)} richtig. Falscher Sack oder vom Band gefallen kostet ein Herz.`,
  ],
  controls:
    "Pfeile links / runter / rechts - oder auf den Sack klicken oder tippen.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const toys: Toy[] = [];
  let sorted = 0;
  let lives = LIVES;
  let nextIn = 1 / 2;
  let scroll = 0;
  let clock = 0;
  let last: Kind | null = null;
  let status: MiniStatus = "running";

  const share = () => Math.min(1, sorted / GOAL);
  const speed = () => BELT_SLOW + (BELT_FAST - BELT_SLOW) * share();

  const front = () =>
    toys
      .filter((toy) => toy.state === "belt")
      .reduce<Toy | null>(
        (best, toy) => (best === null || toy.x > best.x ? toy : best),
        null,
      );

  const mistake = (x: number, y: number, text: string) => {
    lives -= 1;
    sound("miss");
    effects.shake(SHAKE);
    effects.float(text, x, y, "#ff9a9a");
  };

  const send = (sack: number) => {
    const toy = front();
    if (toy !== null) {
      toy.state = "fly";
      toy.age = 0;
      toy.sack = sack;
      toy.fromY = toy.y;
      sound("whoosh");
    }
  };

  const choose = (input: MiniInput) => {
    SACKS.forEach((sack, index) => {
      if (input.pressed.has(sack.button)) {
        send(index);
      }
    });
    for (const tap of input.taps) {
      const hit = SACKS.findIndex((sack) =>
        inside(sackBox(sack), tap.x, tap.y),
      );
      if (hit >= 0) {
        send(hit);
      }
    }
  };

  const land = (toy: Toy) => {
    const sack = SACKS[toy.sack];
    if (sack.kind === toy.kind) {
      sorted += 1;
      sound("pop");
      effects.burst(sack.x, SACK_MOUTH);
      effects.float("+1", sack.x, SACK_TOP - TEXT_LIFT);
    } else {
      mistake(sack.x, SACK_TOP - TEXT_LIFT, "Falscher Sack!");
    }
  };

  const spawn = () => {
    // Never three of a kind in a row, so it stays lively.
    let kind = random.pick(KINDS);
    if (kind === last) {
      kind = random.pick(KINDS);
    }
    last = kind;
    toys.push({
      kind,
      x: -10,
      y: BELT_Y,
      state: "belt",
      age: 0,
      sack: -1,
      fromX: 0,
      fromY: BELT_Y,
    });
    nextIn = NEXT_SLOW + (NEXT_FAST - NEXT_SLOW) * share();
  };

  return {
    step(input, dt) {
      clock += dt;
      if (status === "running") {
        scroll += speed() * dt;
        nextIn -= dt;
        if (nextIn <= 0) {
          spawn();
        }
        choose(input);
        for (const toy of toys) {
          toy.age += dt;
          if (toy.state === "belt") {
            toy.x += speed() * dt;
            if (toy.x >= BELT_END) {
              toy.state = "drop";
              toy.age = 0;
            }
          } else if (toy.state === "fly" && toy.age >= FLY) {
            land(toy);
          } else if (toy.state === "drop" && toy.age >= DROP) {
            mistake(BELT_END, BELT_Y - TEXT_LIFT * 2, "Verpasst!");
          }
        }
        toys.splice(
          0,
          toys.length,
          ...toys.filter(
            (toy) =>
              !(toy.state === "fly" && toy.age >= FLY) &&
              !(toy.state === "drop" && toy.age >= DROP),
          ),
        );
        if (sorted >= GOAL) {
          status = "won";
        } else if (lives <= 0) {
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
      drawWorkshop(g, sheet, toys, front(), scroll, clock);
      g.ctx.restore();
      effects.draw(g);
      drawHud(g, {
        score: sorted,
        goal: GOAL,
        scoreLabel: "Sortiert",
        lives,
        maxLives: LIVES,
      });
    },
    summary() {
      return `${String(sorted)} von ${String(GOAL)} Spielzeugen richtig sortiert.`;
    },
  };
}

/** Where a sack can be clicked. */
function sackBox(sack: Sack): Box {
  const rect = SPRITES[sack.sprite];
  return { x: sack.x - rect[2] / 2, y: SACK_TOP, w: rect[2], h: rect[3] };
}

/** Where a toy is drawn now: on the belt, in the air, or falling. */
function toyPlace(toy: Toy): { x: number; y: number } {
  let place = { x: toy.x, y: toy.y };
  if (toy.state === "fly") {
    const t = Math.min(1, toy.age / FLY);
    const to = SACKS[toy.sack];
    place = {
      x: toy.x + (to.x - toy.x) * t,
      y: toy.fromY + (SACK_MOUTH - toy.fromY) * t - Math.sin(t * Math.PI) * ARC,
    };
  } else if (toy.state === "drop") {
    const t = Math.min(1, toy.age / DROP);
    place = { x: BELT_END + (t * ARC) / 2, y: BELT_Y + t * t * ARC };
  }
  return place;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** The workshop, the belt, the sacks, the crate, Gilfi and the toys. */
function drawWorkshop(
  g: MiniDraw,
  sheet: HTMLImageElement,
  toys: readonly Toy[],
  next: Toy | null,
  scroll: number,
  clock: number,
): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  // The machine's chute on the left, the belt, the crate at its end.
  ctx.fillStyle = "#5a5468";
  ctx.fillRect(0, 56, 14, 36);
  ctx.fillStyle = "#3a3440";
  ctx.fillRect(0, 60, 10, 26);
  const belt = Math.floor(scroll / 4) % 2 === 0 ? SPRITES.belt0 : SPRITES.belt1;
  for (let x = 0; x < BELT_END; x += belt[2]) {
    drawSprite(ctx, sheet, belt, x, BELT_Y - 1);
  }
  drawSprite(ctx, sheet, SPRITES.crate, BELT_END + 4, BELT_Y + 10);
  for (const sack of SACKS) {
    const rect = SPRITES[sack.sprite];
    drawSprite(ctx, sheet, rect, sack.x - rect[2] / 2, SACK_TOP);
    drawSpriteCentred(ctx, sheet, SPRITES[sack.kind], sack.x, SACK_TOP + 25);
    g.text(sack.label, sack.x, SACK_TOP + rect[3] + 6, {
      size: 6,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#fff4dc",
      outline: "#2a1430",
    });
  }
  drawFigure(ctx, g.art, "gilfi", 300, 170, "idle", "down", clock * 1.2);
  for (const toy of toys) {
    const place = toyPlace(toy);
    const rect = SPRITES[toy.kind];
    if (toy === next) {
      drawGlow(
        ctx,
        place.x,
        place.y - rect[3] / 2,
        16,
        "255, 220, 90",
        0.45 + Math.sin(clock * 8) * 0.1,
      );
    }
    const spin =
      toy.state === "fly"
        ? toy.age * 10
        : toy.state === "drop"
          ? toy.age * 6
          : 0;
    drawSpriteCentred(
      ctx,
      sheet,
      rect,
      place.x,
      place.y - rect[3] / 2,
      1,
      spin,
    );
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
