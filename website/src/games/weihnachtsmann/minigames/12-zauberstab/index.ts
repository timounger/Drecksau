/**
 * Türchen 12 - Der Zauberstab: four crystals in an ice cave light up one
 * after the other; touch them in the same order with the magic wand - each
 * round the spell grows by one crystal.
 *
 * @module
 * @remarks
 * A Simon game. The spell starts {@link START_LENGTH} crystals long and
 * grows by one each round; casting it at {@link GOAL_LENGTH} wins. A wrong
 * crystal costs a heart and the same spell is shown again.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import type { FigureId } from "@/games/weihnachtsmann/components/sprite-atlas";
import {
  drawFigure,
  drawGlow,
  drawHud,
  drawSprite,
  drawSpriteCentred,
  loadSheet,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom, type Random } from "../kit/random";
import type {
  MiniButton,
  MiniDraw,
  MiniEnv,
  MiniGame,
  MiniGameInstance,
  MiniInput,
  MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Length of the first spell, and of the last one, which wins. */
const START_LENGTH = 3;
const GOAL_LENGTH = 8;

/** Hearts: wrong crystals the player may touch. */
const LIVES = 3;

/** Seconds a crystal glows while the spell is shown, first and last round. */
const SHOW_SLOW = 0.55;
const SHOW_FAST = 0.36;

/** Seconds of dark between two shown crystals. */
const SHOW_GAP = 0.16;

/** Seconds of "Pass auf!" before the spell is shown. */
const READY = 0.9;

/** Seconds of cheering after a spell, and of fright after a mistake. */
const CHEER = 1.1;
const FRIGHT = 1.3;

/** Seconds a touched crystal glows. */
const TOUCH_GLOW = 0.28;

/** How fast the wand turns to its crystal, per second. */
const WAND_EASE = 14;

/** The wand's pivot (where Jordi's magic holds it), logical px. */
const PIVOT = { x: 160, y: 104 } as const;

/** From the pivot to the middle of the wand, and to its star, logical px. */
const WAND_MIDDLE = 12;
const WAND_TIP = 30;

/** Taps this close to a crystal touch it, logical px. */
const TAP_REACH = 22;

/** Sparks of a touched crystal and of a finished spell. */
const TOUCH_SPARKS = 10;
const SPELL_SPARKS = 26;

/** Shake on a mistake, logical px. */
const SHAKE = 3;

/** One crystal: where it stands, its button, picture and tone. */
type Crystal = {
  readonly x: number;
  readonly y: number;
  readonly button: MiniButton;
  readonly dark: SpriteName;
  readonly lit: SpriteName;
  readonly rgb: string;
  /** Pitch of its tone, Hz. */
  readonly pitch: number;
};

/** The four crystals: up, right, down, left; their tones make a C major chord. */
const CRYSTALS: readonly Crystal[] = [
  {
    x: 160,
    y: 46,
    button: "up",
    dark: "crystalBlue",
    lit: "crystalBlueLit",
    rgb: "90, 180, 255",
    pitch: 523.3,
  },
  {
    x: 224,
    y: 98,
    button: "right",
    dark: "crystalGreen",
    lit: "crystalGreenLit",
    rgb: "90, 230, 130",
    pitch: 659.3,
  },
  {
    x: 160,
    y: 148,
    button: "down",
    dark: "crystalYellow",
    lit: "crystalYellowLit",
    rgb: "255, 220, 90",
    pitch: 784,
  },
  {
    x: 96,
    y: 98,
    button: "left",
    dark: "crystalRed",
    lit: "crystalRedLit",
    rgb: "255, 90, 110",
    pitch: 1046.5,
  },
];

/** Where the run stands. */
type Phase = "ready" | "show" | "input" | "cheer" | "fright";

/** The minigame behind gate 12. */
export const GAME: MiniGame = {
  number: 12,
  id: "zauberstab",
  title: "Der Zauberstab",
  instructions: [
    "Die Kristalle leuchten nacheinander auf - merk dir die Reihenfolge und tipp sie genauso nach.",
    "Jede Runde kommt ein Kristall dazu.",
    `Ein Spruch mit ${String(GOAL_LENGTH)} Kristallen gewinnt, beim dritten Fehler ist der Zauber verflogen.`,
  ],
  controls:
    "Pfeile oder W A S D für die vier Kristalle - oder den Kristall antippen.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const chimes = CRYSTALS.map((crystal) => chime(crystal.pitch));
  const glow = CRYSTALS.map(() => 0);
  const spell: number[] = firstSpell(random);
  let phase: Phase = "ready";
  let phaseTime = 0;
  let shown = -1;
  let typed = 0;
  let lives = LIVES;
  let best = 0;
  let wand = 0;
  let wandGoal = 0;
  let status: MiniStatus = "running";

  const enter = (next: Phase) => {
    phase = next;
    phaseTime = 0;
    shown = -1;
    typed = 0;
  };

  const light = (index: number, seconds: number) => {
    glow[index] = seconds;
    const crystal = CRYSTALS[index];
    wandGoal = Math.atan2(crystal.x - PIVOT.x, PIVOT.y - crystal.y);
    sound(chimes[index]);
  };

  const showStep = () => {
    const share = (spell.length - START_LENGTH) / (GOAL_LENGTH - START_LENGTH);
    const on = SHOW_SLOW + (SHOW_FAST - SHOW_SLOW) * share;
    const slot = Math.floor(phaseTime / (on + SHOW_GAP));
    if (slot >= spell.length) {
      enter("input");
    } else if (slot !== shown) {
      shown = slot;
      light(spell[slot], on);
    }
  };

  const touch = (index: number) => {
    const crystal = CRYSTALS[index];
    light(index, TOUCH_GLOW);
    if (index === spell[typed]) {
      typed += 1;
      effects.burst(crystal.x, crystal.y, {
        count: TOUCH_SPARKS,
        colors: [`rgb(${crystal.rgb})`, "#ffffff"],
        speed: 50,
      });
      if (typed === spell.length) {
        best = spell.length;
        sound("coin");
        effects.burst(PIVOT.x, PIVOT.y - WAND_TIP, { count: SPELL_SPARKS });
        effects.float(
          spell.length >= GOAL_LENGTH ? "Meisterzauber!" : "Hokuspokus!",
          PIVOT.x,
          PIVOT.y - WAND_TIP - SHAKE * 2,
        );
        enter("cheer");
      }
    } else {
      lives -= 1;
      sound("miss");
      effects.shake(SHAKE);
      effects.burst(crystal.x, crystal.y, {
        colors: ["#9a9ab8", "#5a5a7a", "#ffffff"],
        speed: 40,
      });
      effects.float("Falsch!", crystal.x, crystal.y - TAP_REACH, "#ff9a9a");
      enter("fright");
    }
  };

  const listen = (input: MiniInput) => {
    CRYSTALS.forEach((crystal, index) => {
      if (input.pressed.has(crystal.button) && phase === "input") {
        touch(index);
      }
    });
    for (const tap of input.taps) {
      const index = CRYSTALS.findIndex(
        (crystal) =>
          Math.hypot(tap.x - crystal.x, tap.y - crystal.y) < TAP_REACH,
      );
      if (index >= 0 && phase === "input") {
        touch(index);
      }
    }
  };

  const advance = () => {
    if (phase === "ready" && phaseTime >= READY) {
      enter("show");
    } else if (phase === "cheer" && phaseTime >= CHEER) {
      if (spell.length >= GOAL_LENGTH) {
        status = "won";
      } else {
        spell.push(random.int(0, CRYSTALS.length));
        enter("ready");
      }
    } else if (phase === "fright" && phaseTime >= FRIGHT) {
      if (lives <= 0) {
        status = "lost";
      } else {
        enter("ready");
      }
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        phaseTime += dt;
        if (phase === "show") {
          showStep();
        }
        listen(input);
        advance();
      }
      glow.forEach((left, index) => {
        glow[index] = Math.max(0, left - dt);
      });
      wand += (wandGoal - wand) * Math.min(1, WAND_EASE * dt);
      effects.update(dt);
      return status;
    },
    draw(g) {
      const shake = effects.offset();
      g.ctx.save();
      g.ctx.translate(shake.x, shake.y);
      drawCave(g, sheet, { glow, wand, phase, phaseTime });
      g.ctx.restore();
      effects.draw(g);
      drawHud(g, {
        score: spell.length,
        goal: GOAL_LENGTH,
        scoreLabel: "Spruchlänge",
        lives,
        maxLives: LIVES,
      });
      drawProgress(g, spell.length, phase === "input" ? typed : -1);
    },
    summary() {
      return best >= GOAL_LENGTH
        ? `Der Meisterzauber mit ${String(GOAL_LENGTH)} Kristallen hat geklappt!`
        : `Längster Zauberspruch: ${String(best)} von ${String(GOAL_LENGTH)} Kristallen.`;
    },
  };
}

/** The first spell: no crystal twice in a row, so it is easy to follow. */
function firstSpell(random: Random): number[] {
  const spell = [random.int(0, CRYSTALS.length)];
  while (spell.length < START_LENGTH) {
    const last = spell[spell.length - 1];
    spell.push((last + random.int(1, CRYSTALS.length)) % CRYSTALS.length);
  }
  return spell;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the sound: overtones,
   times in seconds, loudness shares */
/** A crystal's chime: a bright bell tone with a sparkle on top. */
function chime(pitch: number): Recipe {
  return {
    tones: [
      ["triangle", pitch, pitch, 0.38, 0, 0.7],
      ["sine", pitch * 2, pitch * 2, 0.3, 0, 0.25],
      ["sine", pitch * 3, pitch * 3, 0.16, 0.02, 0.1],
    ],
    noise: [[0.05, 0, 8000, 0.15]],
  };
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** What the cave needs to know. */
type CaveState = {
  readonly glow: readonly number[];
  readonly wand: number;
  readonly phase: Phase;
  readonly phaseTime: number;
};

/** What the speech line says in each phase. */
const CALLS: Readonly<Record<Phase, string>> = {
  ready: "Pass auf!",
  show: "Merk dir die Reihenfolge ...",
  input: "Du bist dran!",
  cheer: "Super!",
  fright: "Hoppla - noch mal von vorn!",
};

/** Who stands where in the cave: Jordi left, Trixi hovering on the right. */
const WATCHERS: readonly {
  readonly who: FigureId;
  readonly x: number;
  readonly y: number;
}[] = [
  { who: "jordi", x: 40, y: 168 },
  { who: "trixi", x: 282, y: 158 },
];

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** The cave, the crystals on their pedestals, the wand and the watchers. */
function drawCave(g: MiniDraw, sheet: HTMLImageElement, s: CaveState): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  const tipX = PIVOT.x + Math.sin(s.wand) * WAND_TIP;
  const tipY = PIVOT.y - Math.cos(s.wand) * WAND_TIP;
  CRYSTALS.forEach((crystal, index) => {
    const on = s.glow[index] > 0;
    const bob = Math.sin(g.time * 2 + index) * 1.5;
    const pedestal = SPRITES.pedestal;
    drawSprite(
      ctx,
      sheet,
      pedestal,
      crystal.x - pedestal[2] / 2,
      crystal.y + 11,
    );
    if (on) {
      drawGlow(ctx, crystal.x, crystal.y, 34, crystal.rgb, 0.55);
      ctx.strokeStyle = `rgba(${crystal.rgb}, 0.8)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(crystal.x, crystal.y + bob);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    const rect = SPRITES[on ? crystal.lit : crystal.dark];
    drawSpriteCentred(ctx, sheet, rect, crystal.x, crystal.y + bob);
  });
  // The wand floats in the middle of the circle.
  drawGlow(ctx, tipX, tipY, 12, "255, 230, 120", 0.45);
  drawSpriteCentred(
    ctx,
    sheet,
    SPRITES.wand,
    PIVOT.x + Math.sin(s.wand) * WAND_MIDDLE,
    PIVOT.y - Math.cos(s.wand) * WAND_MIDDLE + Math.sin(g.time * 3),
    1,
    s.wand,
  );
  const hop = s.phase === "cheer" ? Math.abs(Math.sin(s.phaseTime * 9)) * 6 : 0;
  const shiver = s.phase === "fright" ? Math.sin(s.phaseTime * 50) : 0;
  for (const watcher of WATCHERS) {
    const fly = watcher.who === "trixi";
    drawFigure(
      ctx,
      g.art,
      watcher.who,
      watcher.x + shiver,
      watcher.y - hop + (fly ? Math.sin(g.time * 3) * 2 : 0),
      fly ? "fly" : "idle",
      "down",
      g.time * (fly ? 6 : 2),
    );
  }
  g.text(CALLS[s.phase], 160, 22, {
    size: 7,
    bold: true,
    align: "center",
    baseline: "middle",
    color: s.phase === "input" ? "#9af0ff" : "#fff4dc",
    outline: "#1a1030",
  });
}

/** Dots under the circle: one per crystal of the spell, lit once touched. */
function drawProgress(g: MiniDraw, length: number, typed: number): void {
  const ctx = g.ctx;
  const gap = 7;
  const left = 160 - ((length - 1) * gap) / 2;
  for (let k = 0; k < length; k += 1) {
    ctx.fillStyle =
      typed > k
        ? "#9af0ff"
        : typed >= 0
          ? "rgba(255, 255, 255, 0.35)"
          : "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.arc(left + k * gap, 174, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
