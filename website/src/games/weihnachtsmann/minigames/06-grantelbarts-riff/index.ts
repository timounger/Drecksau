/**
 * Türchen 6 - Grantelbarts Riff: notes fall down four lanes; hit each just
 * as it crosses the line, and Grantelbart's guitar roars.
 *
 * @module
 * @remarks
 * The song is a steady beat with a note chart made from the run's seed:
 * single notes, a few quick pairs later on. Hit at least {@link NEEDED} of
 * the notes to win. A wrong press only breaks the combo.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import {
  drawEffect,
  drawFigure,
  drawGlow,
  drawHud,
  drawSprite,
  drawSpriteCentred,
  loadSheet,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom, type Random } from "../kit/random";
import {
  MINI_H,
  type MiniButton,
  type MiniDraw,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Share of the notes to hit. */
const NEEDED = 0.6;

/** Seconds in a minute. */
const SECONDS_PER_MINUTE = 60;

/** Beats per minute, and seconds per beat. */
const BPM = 84;
const BEAT = SECONDS_PER_MINUTE / BPM;

/** Beats of the song with notes, and empty beats before the first note. */
const SONG_BEATS = 64;
const LEAD_BEATS = 4;

/** Beats per bar. */
const BAR = 4;

/** Chance of a note on a beat, in the first half and in the second. */
const NOTE_EARLY = 0.6;
const NOTE_LATE = 0.75;

/** Chance of a quick extra note half a beat later, in the second half. */
const EIGHTH = 0.1;

/** Seconds a note is early or late and still counts: good, and perfect. */
const GOOD = 0.22;
const PERFECT = 0.08;

/** How fast notes fall, logical px per second. */
const FALL = 80;

/** The line where notes are hit, and the top of the lanes, logical px. */
const LINE_Y = 152;
const LANE_TOP = 16;

/** Middle of the first lane and the gap between lanes, logical px. */
const LANE_X = 190;
const LANE_GAP = 32;

/** Taps left of this belong to no lane, logical px. */
const LANES_LEFT = LANE_X - LANE_GAP / 2;

/** Seconds of quiet after the last note before the result. */
const OUTRO = 1.2;

/** How long a lane flashes after a press, seconds. */
const FLASH = 0.12;

/** Combo from which Grantelbart cheers, and how often. */
const CHEER_EVERY = 10;

/** Floating notes over Grantelbart: how many, and how long each lives. */
const NOTE_LIFE = 1.4;

/** For showing a share as percent. */
const PERCENT = 100;

/** Where Grantelbart's guitar is, for rising notes and cheers, logical px. */
const GUITAR = { x: 76, y: 108 } as const;

/** How far rising notes spread, and how fast they rise, logical px. */
const NOTE_SPREAD = 6;
const NOTE_RISE = 24;

/** Where the cheer appears, above Grantelbart, logical px. */
const CHEER_Y = 70;

/** Floating judgements start this far above the line, logical px. */
const JUDGE_LIFT = 12;

/** Sizes of the judgement and cheer texts, logical px. */
const JUDGE_SIZE = 6;
const MISS_SIZE = 5;
const CHEER_SIZE = 7;

/** Sparks of a perfect and of a good hit. */
const SPARKS_PERFECT = 16;
const SPARKS_GOOD = 8;

/** The lanes: button, keys and the gem's picture. */
const LANES: readonly {
  readonly button: MiniButton;
  readonly key: string;
  readonly gem: SpriteName;
  readonly target: SpriteName;
  readonly rgb: string;
  readonly root: number;
}[] = [
  {
    button: "left",
    key: "KeyD",
    gem: "gemLeft",
    target: "targetLeft",
    rgb: "232, 58, 90",
    root: 82.4,
  },
  {
    button: "down",
    key: "KeyF",
    gem: "gemDown",
    target: "targetDown",
    rgb: "74, 168, 255",
    root: 98,
  },
  {
    button: "up",
    key: "KeyJ",
    gem: "gemUp",
    target: "targetUp",
    rgb: "90, 224, 122",
    root: 110,
  },
  {
    button: "right",
    key: "KeyK",
    gem: "gemRight",
    target: "targetRight",
    rgb: "255, 204, 58",
    root: 123.5,
  },
];

/** Arrows shown under the lanes. */
const ARROWS = ["←", "↓", "↑", "→"] as const;

/** One note of the chart. */
type Note = {
  /** Seconds from the start when it should be hit. */
  readonly time: number;
  readonly lane: number;
  /** Not yet, hit, or missed. */
  state: "open" | "hit" | "missed";
};

/** A little music note rising from the guitar. */
type Rising = { x: number; y: number; age: number; readonly kind: number };

/** The minigame behind gate 6. */
export const GAME: MiniGame = {
  number: 6,
  id: "grantelbarts-riff",
  title: "Grantelbarts Riff",
  instructions: [
    "Grantelbart will rocken - aber nur, wenn du die Noten triffst!",
    "Die Noten fallen in vier Spuren. Drück die passende Taste genau dann, wenn eine Note die Linie erreicht.",
    `Triff mindestens ${String(Math.round(NEEDED * PERCENT))} Prozent der Noten.`,
  ],
  controls: "Pfeile ← ↓ ↑ → oder D F J K - oder die Spur antippen.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const notes = chart(random);
  const chords = LANES.map((lane) => powerChord(lane.root));
  const flashes = LANES.map(() => 0);
  const rising: Rising[] = [];
  const end = (notes[notes.length - 1]?.time ?? 0) + OUTRO;
  let time = -BEAT;
  let hits = 0;
  let combo = 0;
  let best = 0;
  let beatShown = -1;
  let status: MiniStatus = "running";
  const needed = Math.ceil(notes.length * NEEDED);

  const press = (lane: number) => {
    flashes[lane] = FLASH;
    const note = notes
      .filter(
        (candidate) => candidate.lane === lane && candidate.state === "open",
      )
      .reduce<Note | null>(
        (closest, candidate) =>
          closest === null ||
          Math.abs(candidate.time - time) < Math.abs(closest.time - time)
            ? candidate
            : closest,
        null,
      );
    const x = LANE_X + lane * LANE_GAP;
    if (note !== null && Math.abs(note.time - time) < GOOD) {
      note.state = "hit";
      hits += 1;
      combo += 1;
      best = Math.max(best, combo);
      sound(chords[lane]);
      const perfect = Math.abs(note.time - time) < PERFECT;
      effects.burst(x, LINE_Y, {
        colors: [`rgb(${LANES[lane].rgb})`, "#ffffff"],
        count: perfect ? SPARKS_PERFECT : SPARKS_GOOD,
      });
      effects.float(
        perfect ? "Perfekt!" : "Gut!",
        x,
        LINE_Y - JUDGE_LIFT,
        perfect ? "#ffe27a" : "#e8f0ff",
        JUDGE_SIZE,
      );
      rising.push({
        x: GUITAR.x + random.range(-NOTE_SPREAD, NOTE_SPREAD),
        y: GUITAR.y,
        age: 0,
        kind: random.int(0, 2),
      });
      if (combo % CHEER_EVERY === 0) {
        effects.float(
          `${String(combo)}er Serie - LAUTER!`,
          GUITAR.x,
          CHEER_Y,
          "#ff9ad0",
          CHEER_SIZE,
        );
      }
    } else {
      combo = 0;
      effects.float("Daneben", x, LINE_Y - JUDGE_LIFT, "#ff8a8a", MISS_SIZE);
    }
  };

  const listen = (input: MiniInput) => {
    LANES.forEach((lane, index) => {
      if (input.pressed.has(lane.button) || input.keysPressed.has(lane.key)) {
        press(index);
      }
    });
    for (const tap of input.taps) {
      if (tap.x > LANES_LEFT) {
        press(
          Math.max(
            0,
            Math.min(
              LANES.length - 1,
              Math.floor((tap.x - LANES_LEFT) / LANE_GAP),
            ),
          ),
        );
      }
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        time += dt;
        const beat = Math.floor(time / BEAT);
        if (beat !== beatShown && beat >= 0) {
          beatShown = beat;
          sound(beat % 2 === 0 ? KICK : "tick");
        }
        listen(input);
        for (const note of notes) {
          if (note.state === "open" && time - note.time > GOOD) {
            note.state = "missed";
            combo = 0;
          }
        }
        if (time >= end) {
          status = hits >= needed ? "won" : "lost";
        }
      }
      flashes.forEach((left, index) => {
        flashes[index] = Math.max(0, left - dt);
      });
      for (const note of rising) {
        note.age += dt;
        note.y -= dt * NOTE_RISE;
      }
      rising.splice(
        0,
        rising.length,
        ...rising.filter((note) => note.age < NOTE_LIFE),
      );
      effects.update(dt);
      return status;
    },
    draw(g) {
      drawStage(g, sheet, { notes, time, flashes, rising, combo });
      effects.draw(g);
      drawHud(g, { score: hits, goal: needed, scoreLabel: "Treffer" });
    },
    summary() {
      return `${String(hits)} von ${String(notes.length)} Noten getroffen, beste Serie ${String(best)}.`;
    },
  };
}

/** The note chart: single notes on the beats, a few quick pairs later. */
function chart(random: Random): Note[] {
  const notes: Note[] = [];
  let lane = random.int(0, LANES.length);
  for (let beat = 0; beat < SONG_BEATS; beat += 1) {
    const late = beat >= SONG_BEATS / 2;
    // Every bar starts with a note, so the beat is easy to find.
    if (beat % BAR === 0 || random.chance(late ? NOTE_LATE : NOTE_EARLY)) {
      lane = (lane + random.int(1, LANES.length)) % LANES.length;
      notes.push({ time: (beat + LEAD_BEATS) * BEAT, lane, state: "open" });
      if (late && beat % BAR !== BAR - 1 && random.chance(EIGHTH)) {
        lane = (lane + random.int(1, LANES.length)) % LANES.length;
        notes.push({
          time: (beat + LEAD_BEATS + 1 / 2) * BEAT,
          lane,
          state: "open",
        });
      }
    }
  }
  return notes;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the sounds: pitches
   in Hz, times in seconds, loudness shares */
/** The kick drum on every other beat. */
const KICK: Recipe = { tones: [["sine", 140, 45, 0.14, 0, 0.9]] };

/** A short growling power chord on a root note. */
function powerChord(root: number): Recipe {
  return {
    drive: true,
    tones: [
      ["sawtooth", root, root, 0.22, 0, 0.6],
      ["sawtooth", root * 1.5, root * 1.5, 0.22, 0, 0.45],
      ["square", root * 2, root * 2, 0.18, 0, 0.25],
    ],
  };
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** What the stage needs to know. */
type StageState = {
  readonly notes: readonly Note[];
  readonly time: number;
  readonly flashes: readonly number[];
  readonly rising: readonly Rising[];
  readonly combo: number;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** The stage, Grantelbart rocking, the lanes and the notes. */
function drawStage(g: MiniDraw, sheet: HTMLImageElement, s: StageState): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  // A spotlight that pulses on the beat.
  const pulse = 1 - ((s.time / BEAT) % 1);
  drawGlow(
    ctx,
    76,
    130,
    46 + pulse * 6,
    "255, 210, 160",
    0.18 + Math.min(s.combo, 20) / 100,
  );
  const bob = Math.round(pulse * 2) / 2;
  drawFigure(ctx, g.art, "grantelbart", 76, 152 - bob, "idle", "down", 0);
  const guitar = SPRITES.guitar;
  drawSpriteCentred(ctx, sheet, guitar, 80, 140 - bob, 1, -0.35 + pulse * 0.08);
  for (const note of s.rising) {
    ctx.globalAlpha = Math.max(0, 1 - note.age / NOTE_LIFE);
    drawEffect(
      ctx,
      g.art,
      note.kind === 0 ? "note0" : "note1",
      note.x + Math.sin(note.age * 6) * 3,
      note.y,
    );
    ctx.globalAlpha = 1;
  }
  // The lanes.
  ctx.fillStyle = "rgba(10, 4, 16, 0.6)";
  ctx.fillRect(
    LANES_LEFT - 2,
    LANE_TOP,
    LANE_GAP * LANES.length + 4,
    MINI_H - LANE_TOP,
  );
  LANES.forEach((lane, index) => {
    const x = LANE_X + index * LANE_GAP;
    if (s.flashes[index] > 0) {
      ctx.fillStyle = `rgba(${lane.rgb}, ${String(0.35 * (s.flashes[index] / FLASH))})`;
      ctx.fillRect(
        x - LANE_GAP / 2 + 1,
        LANE_TOP,
        LANE_GAP - 2,
        LINE_Y - LANE_TOP + 8,
      );
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    ctx.fillRect(x - 1 / 2, LANE_TOP, 1, MINI_H - LANE_TOP);
    const target = SPRITES[lane.target];
    drawSprite(ctx, sheet, target, x - target[2] / 2, LINE_Y - target[3] / 2);
    g.text(ARROWS[index], x, LINE_Y + 15, {
      size: 8,
      bold: true,
      align: "center",
      baseline: "middle",
      color: `rgb(${lane.rgb})`,
    });
  });
  ctx.fillStyle = "rgba(255, 240, 220, 0.5)";
  ctx.fillRect(LANES_LEFT, LINE_Y, LANE_GAP * LANES.length, 1 / 2);
  for (const note of s.notes) {
    const y = LINE_Y - (note.time - s.time) * FALL;
    if (note.state === "open" && y > LANE_TOP - 6 && y < MINI_H + 6) {
      const gem = SPRITES[LANES[note.lane].gem];
      drawSprite(
        ctx,
        sheet,
        gem,
        LANE_X + note.lane * LANE_GAP - gem[2] / 2,
        y - gem[3] / 2,
      );
    }
  }
  if (s.combo >= 3) {
    g.text(`Serie ${String(s.combo)}`, 76, 34, {
      size: 8,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#ffe27a",
      outline: "#2a1430",
    });
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
