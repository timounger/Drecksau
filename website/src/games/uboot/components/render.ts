/**
 * Drawing one frame of the dive: the water, what is in it, and the boat.
 *
 * @module
 * @remarks
 * The whole picture is redrawn every frame - there is no clever patching of
 * what changed, because at this size there is nothing to gain by it and a
 * great deal to lose in readability.
 *
 * Everything is drawn in the same grid the course is written in: course pixels
 * across, with the window's left edge at the left of the screen and the
 * water's surface {@link SURFACE} pixels down. Subtracting the window's
 * position is the only thing that turns one into the other, and it happens
 * once per thing drawn.
 */
import type { Course } from "@/games/uboot/engine/course";
import { solidAt } from "@/games/uboot/engine/engine";
import {
  CELL,
  MINE_R,
  ROWS,
  SUB_LONG,
  SURFACE,
  VIEW_H,
  VIEW_W,
  type Blast,
  type GameState,
  type Shot,
  type Vec,
} from "@/games/uboot/engine/types";
import { drawSub } from "@/games/uboot/components/sub";
import {
  drawBeast,
  glowBeast,
  shines,
} from "@/games/uboot/components/creatures";
import { BREEDS } from "@/games/uboot/engine/beasts";
import type { PadView } from "@/games/uboot/hooks/touch-controls";
import type { WeaponKind } from "@/games/uboot/engine/upgrades";

/** How wide the picture is drawn. */
export const CANVAS_W = VIEW_W;

/** And how high. */
export const CANVAS_H = VIEW_H;

/** Wie viele Nachkommastellen die Uhr im Bild zeigt. */
const CLOCK_DIGITS = 2;

/** Wie weit neben dem Bild noch gezeichnet wird, in Pixeln. */
const VIEW_EDGE = 80;

/** What the picture needs beyond the world itself. */
export type Scene = {
  /** Seconds since the dive ended - the age of the bang. */
  readonly since: number;
  /** Which course this is, counted from one. */
  readonly level: number;
  /** And how many there are. */
  readonly levels: number;
  /** Its name, for the corner of the picture. */
  readonly name: string;
  /** How dark this water is, from nought to one. */
  readonly dark: number;
  /** Das Steuerkreuz unter dem Daumen, wenn eines gebraucht wird. */
  readonly pad?: PadView | null;
  /**
   * Ob nur das Wasser gezeichnet wird, ohne Anzeigen darüber.
   *
   * @remarks
   * Für die Vorschau vor dem Tauchgang: Dort soll man das Gewässer sehen und
   * nicht die Luftanzeige eines Tauchgangs, der noch gar nicht läuft.
   */
  readonly bare?: boolean;
  /**
   * Wohin gezielt wird, in Bildpunkten - oder null.
   *
   * @remarks
   * In Bildpunkten und nicht in Kurspixeln, weil das hier der einzige Ort ist,
   * an dem der Zielpunkt wieder dorthin gehört, wo der Zeiger steht: aufs Glas.
   */
  readonly aim?: Vec | null;
};

/** The colours of the sea. */
const SEA = {
  sky: "#bfe4fb",
  skyLow: "#8fd0f0",
  foam: "#eaf8ff",
  top: "#1d7fb8",
  middle: "#0d4f7d",
  deep: "#04203a",
  rock: "#41525c",
  rockLit: "#61757f",
  rockDeep: "#25323a",
  /** Bruchfels: wärmer, heller - und mit Rissen, die man sieht. */
  brittle: "#6b5a46",
  brittleLit: "#9a8468",
  brittleDeep: "#4a3d2f",
  crack: "rgba(20,14,8,0.75)",
  weed: "#2f9a52",
  weedDark: "#1c6b39",
  mine: "#1a1f25",
  mineLit: "#3b444e",
  spark: "#ff5a3c",
  gate: "#ffd76a",
} as const;

/** Where the water changes colour, from the surface down. */
const DEPTHS = { middle: 0.45 } as const;

/** The shafts of daylight coming down through the water. */
const SHAFT = {
  /** How far apart they are and how fast they slide, in pixels a second. */
  apart: 320,
  pace: 9,
  /** How wide one is at the top, and where its two lower corners fall. */
  top: 46,
  spread: 180,
  foot: 60,
  fade: 0.07,
} as const;

/** The surface, seen from below. */
const WAVE = {
  /** How often the wavy line is sampled, in pixels. */
  step: 8,
  /** How long a wave is and how tall, plus the slow swell under it. */
  length: 34,
  tall: 3,
  swell: 3,
  swellTall: 2,
  /** How fast the whole thing runs past. */
  pace: 26,
  /** How far the band of foam reaches above and below the line. */
  up: 8,
  down: 6,
} as const;

/** How a square of rock is drawn. */
const ROCK = {
  /** How far it is drawn over its square, so neighbours grow together. */
  over: 2,
  /** How far its corners are pulled about. */
  jitter: 7,
  /** What the jitter is keyed on, so the same rock is always the same rock. */
  byCol: 31,
  byRow: 17,
  /** Half, for the middle of the top edge. */
  half: 0.5,
  /** How thick the lit top edge is, and below which depth rock goes dark. */
  lit: 3,
  darkBelow: 0.6,
  /** Die Risse im Bruchfels: wie viele, wie dick, wie weit vom Rand weg. */
  cracks: 3,
  crack: 2,
  inset: 0.18,
} as const;

/**
 * One number per corner of a rock, so no two are pulled about the same way.
 *
 * @remarks
 * They are only there to be different from each other; what they are does not
 * matter in the least.
 */
const CORNER = { a: 1, b: 2, c: 3, d: 4, e: 5 } as const;

/** How weed grows and how it leans. */
const WEED = {
  stalks: 3,
  first: 8,
  apart: 10,
  thick: 5,
  /** How far it leans and how quickly. */
  lean: 7,
  pace: 1.3,
  /** How near the seabed it gets its darker colour, in rows. */
  darkFrom: 3,
} as const;

/** A mine. */
const MINE = {
  spikes: 8,
  spike: 6,
  line: 3,
  /** How far it bobs. */
  bob: 2,
  /** The lamp on it: where it sits, how big and how it blinks. */
  lampX: 4,
  lampY: -4,
  lamp: 2.5,
  blink: 0.4,
  blinkSwing: 0.6,
  blinkPace: 3,
  /** Where the light on the shell comes from. */
  litX: -4,
  litY: -4,
  litR: 2,
} as const;

/** The way out. */
const GATE = {
  /** How wide the curtain of light is, either side of the line. */
  half: 20,
  middle: 0.5,
  line: 4,
  dash: 16,
  gap: 12,
  pace: 30,
} as const;

/** The bubbles the propeller leaves. */
/**
 * Die Strömung hinter der Schraube.
 *
 * @remarks
 * **Man sieht das Boot von der Seite, also auch den Strudel.** Von der Seite
 * ist ein Schraubenstrudel kein Kreis: Jedes Blatt zieht einen Wirbelfaden
 * hinter sich her, der sich um die Fahne windet - und eine Schraubenlinie, von
 * der Seite gesehen, ist eine Welle.
 *
 * Zwei solche Wellen sahen aus wie eine Schlange. Was daraus eine Strömung
 * macht, ist **die Menge und die Unschärfe**: ein Dutzend Fäden, jeder mit
 * eigener Weite, eigenem Takt und eigener Länge, jeder blass, und jeder
 * zweimal gezeichnet - einmal breit und fast durchsichtig als Dunst, einmal
 * dünn als Faden darin. Wo sich viele davon überlagern, wird das Wasser hell;
 * wo nicht, bleibt es Wasser.
 *
 * Blasen steigen auf, und ein Boot, das Luft verliert, hat ein Loch. Dieses
 * hier bleibt, wo es ist, und fällt zurück.
 */
const WAKE = {
  /** Wie weit hinter der Rumpfmitte die Schraube steht. */
  from: 10,
  /** Wie lang die Fahne bei vollem Schub ist. */
  long: 140,
  /** Wie weit sie an der Schraube ausschlägt und wie weit am Ende. */
  mouth: 3,
  widen: 15,
  /** Wie viele Fäden darin liegen. */
  strands: 13,
  /** Wie viele Windungen auf die Länge gehen und wie schnell sie laufen. */
  turns: 2.2,
  pace: 9,
  /** Wie verschieden die Fäden sind: in Weite, Takt, Tempo und Länge. */
  vary: 0.7,
  detune: 0.5,
  drift: 0.6,
  shortest: 0.45,
  /** Wie weit ihre Mittellinien auseinanderliegen. */
  apart: 0.55,
  /**
   * Wie sehr sich die Wendel nach hinten streckt.
   *
   * @remarks
   * Kleiner als eins: Der Strahl wird langsamer, je weiter er weg ist, also
   * liegen die Windungen hinten weiter auseinander als an der Schraube.
   */
  stretch: 0.82,
  /** Und wie unruhig sie dabei wird. */
  jitter: 6,
  /** In wie vielen Bändern eine Strähne ausblendet und wie fein jedes ist. */
  bands: 5,
  fine: 4,
  /** Der breite Dunst und der dünne Faden darin: Dicke und Klarheit. */
  haze: 7,
  mist: 0.07,
  line: 1.4,
  fade: 0.16,
} as const;

/** How the boat lies in the water. */
const BOAT = {
  /** The most the nose tips, in radians, and the speed that reaches it. */
  tiltMost: 0.25,
  tiltPer: 600,
  /** How often a hurt hull blinks, per second. */
  blinks: 12,
} as const;

/** How a course that has been got through is celebrated. */
const WIN = {
  /** How far the boat lifts afterwards, in pixels, and how fast. */
  lift: 46,
  rise: 30,
  /** And how far its nose comes up - it has earned it. */
  tilt: -0.18,
  /** The bubbles: how many, how fast they climb, how far they wander. */
  bubbles: 44,
  climb: 150,
  wander: 8,
  sway: 4,
  /** How long one lives, at the shortest and over that. */
  least: 1.2,
  spread: 1,
  /** How big they are and how solid. */
  small: 2,
  grow: 5,
  fade: 0.5,
  /** The flash of the moment itself, and how long it lasts in seconds. */
  flash: 0.35,
  flashFor: 0.5,
} as const;

/** The bang. */
const BLAST = {
  /** How quickly it opens out, and how big it gets. */
  pace: 2,
  from: 20,
  reach: 70,
  /** How much wreckage, how far it goes and how far it rises. */
  bits: 18,
  away: 60,
  lift: 30,
  bit: 2,
  bitGrow: 3,
  fade: 0.6,
  /** Where the fire goes from white to orange. */
  hot: 0.4,
  core: 2,
} as const;

/** Wie der Wächter gezeichnet wird. */
const KRAKEN = {
  /** Wie groß der Mantel ist und wie flach er liegt. */
  body: 34,
  squat: 0.78,
  /** Die Arme: wie viele, wie weit sie fächern und wie weit sie reichen. */
  arms: 8,
  fan: 1.15,
  reach: 86,
  sway: 18,
  pace: 2.2,
  thick: 7,
  thin: 2,
  /** Die Augen. */
  eyeX: 12,
  eyeY: 11,
  eye: 7,
  pupil: 3.4,
  look: 2,
  /** Wie weit sein Eigenleuchten reicht. */
  halo: 130,
  /** Der Balken über ihm. */
  barW: 84,
  barH: 7,
  barUp: 52,
  /** Die Mitte des Fächers, damit die Arme um ihn herum stehen. */
  middle: 0.5,
  /** Und die Tinte. */
  inkR: 10,
  inkPulse: 1.5,
  skin: "#6b3f7a",
  edge: "#2a1330",
  arm: "#59346a",
  hurt: "#ff9a6b",
  white: "#ffe9c9",
  blood: "#ff5a7a",
  ink: "#2b1140",
  inkThin: "rgba(43,17,64,0.5)",
} as const;

/** How a single bang is drawn. */
const BANG = {
  /** How long it is worth looking at - the engine keeps it exactly this long. */
  life: 0.55,
  /** How big it starts, as a share of its reach, and how bright. */
  from: 0.6,
  core: 0.95,
  mid: 0.7,
  /** The smallest bang there is, so a harpoon hit is still a flash. */
  least: 18,
} as const;

/** How loudly the sonar draws. */
const SONAR = { base: 0.16, sweep: 0.55 } as const;

/** The murk at the back of the window. */
const MURK = {
  /** How far into the picture it reaches, in pixels. */
  wide: 120,
  /** How dark it gets when nobody is being pushed, and when somebody is. */
  calm: 0.45,
  shoving: 0.75,
} as const;

/** The heads-up display, drawn into the picture so it survives full screen. */
const HUD = {
  pad: 14,
  barW: 260,
  barH: 10,
  barTop: 20,
  /** How thick the window's mark on the bar is, and how far it sticks out. */
  mark: 2,
  markOut: 4,
  /** How many metres one row of water stands for. */
  perRow: 10,
  text: "600 15px system-ui, sans-serif",
  small: "500 12px system-ui, sans-serif",
} as const;

/**
 * How dark the deep water is, and how far one sees in it.
 *
 * @remarks
 * The veil is a hole in the dark that the boat carries about with it. Without
 * a lamp the hole is small and the course arrives out of the black about two
 * seconds before it matters - which is why the dark waters are the ones a
 * player only reaches with points in hand, never the first three.
 */
const NIGHT = {
  /** How black it goes where nothing reaches. */
  veil: 0.985,
  /**
   * How far one sees with nothing at all, in pixels, and with the lamp.
   *
   * @remarks
   * **Ohne Licht ist es kaum mehr als das Boot selbst.** Wer in die finsteren
   * Gewässer fährt, ohne einen Scheinwerfer gekauft zu haben, soll das an der
   * ersten Wand merken und nicht erst am Ende des Kurses - und der
   * Scheinwerfer gibt genau die Sicht, die es vorher schon geschenkt gab.
   */
  bare: 50,
  lit: 130,
  /** How far past that it fades to full dark. */
  fade: 100,
  /** The lamp cone: how far ahead, how wide it opens, how bright. */
  reach: 430,
  spread: 0.42,
  glow: 0.3,
  /** How far the sonar paints outlines, and how fast its ring travels. */
  sonar: 540,
  ping: 260,
  ringWide: 70,
} as const;

/** How the things in the water are drawn. */
const AMMO = {
  /** The dropped mine, which is a small one of the ones it clears. */
  drop: 9,
  spike: 4,
  /** And how big the blinking fuse on a dropped mine is. */
  fuse: 3,
} as const;

/**
 * Die Harpune: ein dünner Speer mit Widerhaken und einer Leine dahinter.
 *
 * @remarks
 * **Sie muss auf den ersten Blick keine Waffe sein, sondern ein Speer.** Wer
 * den Torpedo gekauft hat und immer noch dasselbe graue Stäbchen fliegen
 * sieht, glaubt zu Recht, er schieße weiter mit der Harpune.
 */
const SPEAR = {
  /** Wie lang der Schaft ist und wie groß die Spitze. */
  shaft: 20,
  head: 7,
  /** Die Widerhaken: wie weit zurück sie sitzen und wie weit sie abstehen. */
  barb: 6,
  flare: 4,
  line: 2,
  /** Die Leine, die hinterherzieht. */
  rope: 30,
  ropeFade: 0.35,
} as const;

/** Und der Torpedo: dick, mit Leitwerk, Glutnase und Blasenfahne. */
const TORP = {
  /** Wie lang und wie dick der Körper ist. */
  long: 34,
  thick: 13,
  /** Das Leitwerk hinten: wie weit es vorsteht und wie weit es ausgreift. */
  fin: 7,
  flare: 9,
  /** Wo die Nase anfängt, als Anteil der Länge, und wie hell sie glüht. */
  nose: 0.3,
  glow: 4,
  /** Das Kennband auf dem Rücken. */
  band: 4,
  /** Die Blasen dahinter: wie viele, wie groß, wie weit auseinander. */
  bubbles: 4,
  bubble: 4,
  shrink: 0.7,
  first: 6,
  apart: 9,
  wobble: 2.5,
  pace: 14,
  fade: 0.5,
} as const;

/** The bars for air and hull, under the name of the water. */
const AIR = {
  /** How far under the name they start, and how big the bar is. */
  top: 22,
  wide: 150,
  high: 9,
  gap: 8,
  /** Where the colour turns, as a share of a full tank. */
  low: 0.35,
  panic: 0.15,
  cool: "#7fe3ff",
  warm: "#ffc861",
  hull: "#9fe6a8",
  /** One shield per hit, and where its shoulders sit. */
  pip: 12,
  notch: 0.33,
  pipGap: 5,
} as const;

/** What each weapon is called, for the corner of the picture. */
const ARMS_NAMES: Readonly<Record<WeaponKind, string>> = {
  harpoon: "Harpune",
  torpedo: "Torpedo",
  mine: "Seemine",
};

/** Wie das Zielkreuz aussieht, das dem Zeiger folgt. */
const MARK = {
  ring: 9,
  tick: 6,
  line: 1.5,
  fade: 0.8,
} as const;

/** Und wie eine angeschlagene Mine aussieht. */
const DENT = {
  /** Wie weit der Riss quer über die Kugel geht. */
  crack: 0.72,
  line: 2,
  /** Wie viel bleicher die Kugel mit jedem Stich wird. */
  pale: 0.18,
} as const;

/** Wie das Steuerkreuz aussieht. */
const PAD = {
  /** Wie weit der Ring geht und wo die Arme anfangen. */
  ring: 52,
  inner: 16,
  /** Der Knopf unter dem Daumen. */
  knob: 16,
  line: 3,
  fade: 0.5,
  /** Die vier Richtungen, als Einheitsvektoren. */
  arms: [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ],
} as const;

/** What the hash is built from - two numbers with nothing in common. */
const HASH = { turn: 12.9898, blow: 43758.5453 } as const;

/**
 * Draws one frame.
 *
 * @param ctx - the canvas to draw on
 * @param state - the world as it stands
 * @param course - the course being dived
 * @param scene - what the picture needs that the world does not hold
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  course: Course,
  scene: Scene,
): void {
  const left = state.window;

  water(ctx);
  shafts(ctx, state.time);
  surface(ctx, left, state.time);
  terrain(ctx, state, course, left, state.time);
  gate(ctx, course, left, state.time);
  critters(ctx, state, left);
  wake(ctx, state, left);
  flying(ctx, state, left);

  if (state.phase === "diving" || state.phase === "arrived") {
    boat(ctx, state, left, state.phase === "arrived" ? scene.since : 0);
  } else {
    blast(ctx, state, left, scene.since);
  }

  if (state.phase === "arrived") {
    cheer(ctx, scene.since);
  }

  bangs(ctx, state, left);
  // The dark goes over everything that is in the water and under everything
  // that is on the screen: the boat is in the water, the heads-up display is
  // on the glass.
  night(ctx, state, left, scene.dark);
  lamp(ctx, state, left, scene.dark);
  // Nach der Dunkelheit: Ein Gegner, den der Schleier verschluckt, ist kein
  // Kampf, sondern ein Ratespiel. Er leuchtet dafür selbst - in dieser Tiefe
  // tut das fast alles, was lebt.
  guard(ctx, state, left);
  // Was selbst leuchtet, leuchtet auch durch den Schleier - genau wie der
  // Wächter, und aus demselben Grund.
  beacons(ctx, state, left, scene.dark);
  sonar(ctx, state, course, left, scene.dark);
  murk(ctx, state);
  if (scene.bare !== true) {
    hud(ctx, state, course, scene);
  }
  // Über der Dunkelheit, wie alles, was man selbst bedient: Ein Zielkreuz, das
  // der Schleier verschluckt, zielt auf nichts.
  mark(ctx, scene.aim ?? null, state);
  cross(ctx, scene.pad ?? null);
}

/** The water itself, darker the deeper it goes. */
function water(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, SURFACE);
  sky.addColorStop(0, SEA.sky);
  sky.addColorStop(1, SEA.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, SURFACE);

  const sea = ctx.createLinearGradient(0, SURFACE, 0, VIEW_H);
  sea.addColorStop(0, SEA.top);
  sea.addColorStop(DEPTHS.middle, SEA.middle);
  sea.addColorStop(1, SEA.deep);
  ctx.fillStyle = sea;
  ctx.fillRect(0, SURFACE, VIEW_W, VIEW_H - SURFACE);
}

/**
 * Shafts of daylight coming down through the water.
 *
 * @remarks
 * They slide at their own pace rather than with the course, because light does
 * not belong to the ground - and because a picture in which everything moves
 * at one speed reads as a flat sheet being pulled past.
 */
function shafts(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = SHAFT.fade;
  ctx.fillStyle = SEA.foam;
  const slide = (time * SHAFT.pace) % SHAFT.apart;
  const many = VIEW_W / SHAFT.apart + 1;
  for (let beam = -1; beam < many; beam += 1) {
    const x = beam * SHAFT.apart + slide;
    ctx.beginPath();
    ctx.moveTo(x, SURFACE);
    ctx.lineTo(x + SHAFT.top, SURFACE);
    ctx.lineTo(x + SHAFT.spread, VIEW_H);
    ctx.lineTo(x + SHAFT.foot, VIEW_H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** The surface, seen from below: a running wave and a line of foam. */
function surface(
  ctx: CanvasRenderingContext2D,
  left: number,
  time: number,
): void {
  ctx.beginPath();
  ctx.moveTo(0, SURFACE + WAVE.down);
  for (let x = 0; x <= VIEW_W; x += WAVE.step) {
    const at = (x + left + time * WAVE.pace) / WAVE.length;
    const lift =
      Math.sin(at) * WAVE.tall + Math.sin(at / WAVE.swell) * WAVE.swellTall;
    ctx.lineTo(x, SURFACE + lift);
  }
  ctx.lineTo(VIEW_W, SURFACE - WAVE.up);
  ctx.lineTo(0, SURFACE - WAVE.up);
  ctx.closePath();
  ctx.fillStyle = SEA.foam;
  ctx.fill();
}

/** Everything the course is made of: rock, weed and mines. */
function terrain(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  course: Course,
  left: number,
  time: number,
): void {
  const from = Math.floor(left / CELL) - 1;
  const to = Math.ceil((left + VIEW_W) / CELL) + 1;

  for (let col = from; col <= to; col += 1) {
    for (let row = 0; row < ROWS; row += 1) {
      const x = col * CELL - left;
      const y = SURFACE + row * CELL;
      const here = solidAt(state.gone, course, col, row);
      switch (here) {
        case "#":
        case "B":
          rock(
            ctx,
            x,
            y,
            col,
            row,
            !solid(solidAt(state.gone, course, col, row - 1)),
            here === "B",
          );
          break;
        case "~":
          weed(ctx, x, y, col, row, time);
          break;
        case "M":
          mine(
            ctx,
            x + CELL / 2,
            y + CELL / 2,
            col,
            time,
            state.dents.get(row * course.cols + col) ?? 0,
          );
          break;
        default:
          break;
      }
    }
  }
}

/**
 * One square of rock.
 *
 * @remarks
 * Drawn a shade over its square so that neighbours grow together into one
 * mass, with the corners pulled about by the square's own number. Squares that
 * have water over them get a lit top edge, which is what turns a wall of grey
 * into a seabed with a light above it.
 *
 * **Bruchfels sieht anders aus, und zwar bevor man darauf schießt.** Er ist
 * wärmer, heller und hat Risse. Eine Wand, der man erst am Einschlag ansieht,
 * ob sie nachgibt, ist kein Rätsel, sondern eine verschwendete Mine.
 */
function rock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  open: boolean,
  weak: boolean,
): void {
  const jitter = (n: number) =>
    (scatter(col * ROCK.byCol + row * ROCK.byRow + n) - ROCK.half) *
    ROCK.jitter;
  const over = ROCK.over;
  const top = [
    { x: x - over + jitter(CORNER.a), y: y - over + jitter(CORNER.b) },
    { x: x + CELL / 2, y: y - over + jitter(CORNER.c) },
    {
      x: x + CELL + over + jitter(CORNER.d),
      y: y - over + jitter(CORNER.e),
    },
  ];

  ctx.beginPath();
  ctx.moveTo(top[0].x, top[0].y);
  ctx.lineTo(top[1].x, top[1].y);
  ctx.lineTo(top[2].x, top[2].y);
  ctx.lineTo(x + CELL + over, y + CELL + over);
  ctx.lineTo(x - over, y + CELL + over);
  ctx.closePath();
  const deep = row / ROWS > ROCK.darkBelow;
  ctx.fillStyle = weak
    ? deep
      ? SEA.brittleDeep
      : SEA.brittle
    : deep
      ? SEA.rockDeep
      : SEA.rock;
  ctx.fill();

  if (weak) {
    // Die Risse: immer dieselben für dasselbe Quadrat, sonst flackert die
    // ganze Wand.
    ctx.strokeStyle = SEA.crack;
    ctx.lineWidth = ROCK.crack;
    const in_ = CELL * ROCK.inset;
    for (let crack = 0; crack < ROCK.cracks; crack += 1) {
      const from = scatter(col * ROCK.byCol + row * ROCK.byRow + crack);
      const to = scatter(col * ROCK.byRow + row * ROCK.byCol + crack);
      ctx.beginPath();
      ctx.moveTo(x + in_ + from * (CELL - in_ * 2), y + in_);
      ctx.lineTo(x + in_ + to * (CELL - in_ * 2), y + CELL - in_);
      ctx.stroke();
    }
  }

  if (open) {
    ctx.strokeStyle = weak ? SEA.brittleLit : SEA.rockLit;
    ctx.lineWidth = ROCK.lit;
    ctx.beginPath();
    ctx.moveTo(top[0].x, top[0].y);
    ctx.lineTo(top[1].x, top[1].y);
    ctx.lineTo(top[2].x, top[2].y);
    ctx.stroke();
  }
}

/** A clump of weed, leaning with the water. */
function weed(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  time: number,
): void {
  ctx.strokeStyle = row > ROWS - WEED.darkFrom ? SEA.weedDark : SEA.weed;
  ctx.lineWidth = WEED.thick;
  ctx.lineCap = "round";
  for (let stalk = 0; stalk < WEED.stalks; stalk += 1) {
    const foot = x + WEED.first + stalk * WEED.apart;
    const lean = Math.sin(time * WEED.pace + col + stalk) * WEED.lean;
    ctx.beginPath();
    ctx.moveTo(foot, y + CELL);
    ctx.quadraticCurveTo(foot + lean, y + CELL / 2, foot + lean * 2, y);
    ctx.stroke();
  }
  ctx.lineCap = "butt";
}

/**
 * A mine: a ball of spikes with a light on it that will not stop blinking.
 *
 * @param dents - wie viele Harpunen schon drinstecken
 * @remarks
 * **Was schon getroffen wurde, sieht man.** Mit jedem Stich fehlt ein Dorn, die
 * Kugel wird bleicher und ein Riss läuft über sie. Sonst wäre die Harpune eine
 * Waffe, bei der man mitzählen muss, statt hinzusehen.
 */
function mine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  time: number,
  dents: number,
): void {
  const spikes = Math.max(1, MINE.spikes - dents);
  ctx.save();
  ctx.translate(x, y + Math.sin(time + col) * MINE.bob);

  ctx.strokeStyle = SEA.mineLit;
  ctx.lineWidth = MINE.line;
  for (let spike = 0; spike < spikes; spike += 1) {
    const turn = (spike * Math.PI * 2) / MINE.spikes;
    ctx.beginPath();
    ctx.moveTo(Math.cos(turn) * MINE_R, Math.sin(turn) * MINE_R);
    ctx.lineTo(
      Math.cos(turn) * (MINE_R + MINE.spike),
      Math.sin(turn) * (MINE_R + MINE.spike),
    );
    ctx.stroke();
  }

  const shell = ctx.createRadialGradient(
    MINE.litX,
    MINE.litY,
    MINE.litR,
    0,
    0,
    MINE_R,
  );
  shell.addColorStop(0, SEA.mineLit);
  shell.addColorStop(1, SEA.mine);
  ctx.beginPath();
  ctx.arc(0, 0, MINE_R, 0, Math.PI * 2);
  ctx.fillStyle = shell;
  ctx.fill();

  if (dents > 0) {
    ctx.globalAlpha = Math.min(1, dents * DENT.pale);
    ctx.fillStyle = SEA.foam;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = SEA.spark;
    ctx.lineWidth = DENT.line;
    ctx.beginPath();
    ctx.moveTo(-MINE_R * DENT.crack, -MINE_R / 2);
    ctx.lineTo(0, 0);
    ctx.lineTo(MINE_R * DENT.crack, MINE_R / 2);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(MINE.lampX, MINE.lampY, MINE.lamp, 0, Math.PI * 2);
  ctx.fillStyle = SEA.spark;
  ctx.globalAlpha =
    MINE.blink +
    MINE.blinkSwing * Math.abs(Math.sin(time * MINE.blinkPace + col));
  ctx.fill();
  ctx.restore();
}

/**
 * Alles, was lebt, an seiner Stelle.
 *
 * @remarks
 * Vor den Blasen und vor dem Boot: Ein Tier, das über dem eigenen Rumpf liegt,
 * sieht aus wie ein Fehler, auch wenn es rechnerisch dasselbe ist.
 */
function critters(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  left: number,
): void {
  for (const beast of state.beasts) {
    const x = beast.x - left;
    if (x > -VIEW_EDGE && x < VIEW_W + VIEW_EDGE) {
      drawBeast(ctx, beast, x, SURFACE + beast.y, state.time);
    }
  }
}

/** Und die, die auch im Schwarzen zu sehen sind, noch einmal darüber. */
function beacons(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  left: number,
  dark: number,
): void {
  if (dark > 0) {
    for (const beast of state.beasts) {
      const x = beast.x - left;
      const worth =
        shines(beast.kind) && x > -VIEW_EDGE && x < VIEW_W + VIEW_EDGE;
      if (worth) {
        glowBeast(ctx, beast, x, SURFACE + beast.y, dark);
        drawBeast(ctx, beast, x, SURFACE + beast.y, state.time);
      }
    }
  }
}

/** Ob in diesem Quadrat etwas steht, das ein Sonar meldet. */
function solid(cell: string): boolean {
  return cell === "#" || cell === "B" || cell === "M";
}

/** The way out: a curtain of light across the whole of the water. */
function gate(
  ctx: CanvasRenderingContext2D,
  course: Course,
  left: number,
  time: number,
): void {
  const x = course.goal - left;
  const seen = x > -CELL && x < VIEW_W + CELL;

  if (seen) {
    const glow = ctx.createLinearGradient(x - GATE.half, 0, x + GATE.half, 0);
    glow.addColorStop(0, "rgba(255,215,106,0)");
    glow.addColorStop(GATE.middle, "rgba(255,215,106,0.35)");
    glow.addColorStop(1, "rgba(255,215,106,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - GATE.half, SURFACE, GATE.half * 2, VIEW_H - SURFACE);

    ctx.strokeStyle = SEA.gate;
    ctx.lineWidth = GATE.line;
    ctx.setLineDash([GATE.dash, GATE.gap]);
    ctx.lineDashOffset = -time * GATE.pace;
    ctx.beginPath();
    ctx.moveTo(x, SURFACE);
    ctx.lineTo(x, VIEW_H);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/** The bubbles the propeller leaves behind. */
function wake(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  left: number,
): void {
  if (state.wash <= 0) {
    return;
  }
  const x = state.sub.x - left - SUB_LONG / 2 - WAKE.from;
  const y = SURFACE + state.sub.y;
  const long = WAKE.long * state.wash;
  ctx.strokeStyle = SEA.foam;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let strand = 0; strand < WAKE.strands; strand += 1) {
    const thread = {
      side: strand % 2 === 0 ? 1 : -1,
      // Jeder Faden hat seine eigenen drei Zahlen und behält sie - sonst
      // flackerte die ganze Strömung von Bild zu Bild.
      wide: WAKE_LOW + scatter(strand) * WAKE.vary,
      turns:
        WAKE.turns *
        (1 + (scatter(strand + WAKE.strands) - WAKE_MIDDLE) * WAKE.detune),
      pace:
        WAKE.pace *
        (1 + (scatter(strand + WAKE_TWICE) - WAKE_MIDDLE) * WAKE.drift),
      phase: scatter(strand + WAKE_THRICE) * Math.PI * 2,
      lift: (scatter(strand + WAKE_TWICE) - WAKE_MIDDLE) * 2 * WAKE.apart,
      long:
        long *
        (WAKE.shortest + scatter(strand + WAKE.strands) * (1 - WAKE.shortest)),
    };

    for (let band = 0; band < WAKE.bands; band += 1) {
      const at = band / WAKE.bands;
      // Quadratisch ausblenden: Direkt hinter der Schraube steht die Strömung,
      // und was sich auflöst, tut das zum Schluss schnell.
      const left_ = (1 - at) * (1 - at) * state.wash;
      const path = new Path2D();
      for (let fine = 0; fine <= WAKE.fine; fine += 1) {
        const along = at + fine / (WAKE.bands * WAKE.fine);
        const to = [
          x - along * thread.long,
          y + curl(along, thread, state.time, band * WAKE.fine + fine),
        ] as const;
        if (fine === 0) {
          path.moveTo(to[0], to[1]);
        } else {
          path.lineTo(to[0], to[1]);
        }
      }
      ctx.globalAlpha = WAKE.mist * left_;
      ctx.lineWidth = WAKE.haze * (1 - at * WAKE_HALF);
      ctx.stroke(path);
      ctx.globalAlpha = WAKE.fade * left_;
      ctx.lineWidth = WAKE.line;
      ctx.stroke(path);
    }
  }

  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
}

/** Wie ein einzelner Faden der Strömung liegt. */
type Thread = {
  readonly side: number;
  readonly wide: number;
  readonly turns: number;
  readonly pace: number;
  readonly phase: number;
  readonly lift: number;
  readonly long: number;
};

/**
 * Wie weit ein Wirbelfaden an dieser Stelle ausschlägt.
 *
 * @param at - wie weit hinten, von null bis eins
 * @param thread - der Faden mit seinen eigenen Zahlen
 * @param time - die Uhr des Tauchgangs, damit die Wendel läuft
 * @param step - das wievielte Stück, für das Zittern
 * @returns der Abstand zur Mittellinie, in Pixeln
 * @remarks
 * Versetzt, verstimmt, nach hinten gestreckt und zitternd - vier Gründe, warum
 * aus vielen Wellen eine Strömung wird und kein Zopf.
 */
function curl(at: number, thread: Thread, time: number, step: number): number {
  const wide = (WAKE.mouth + at * WAKE.widen) * thread.wide;
  const along = Math.pow(at, WAKE.stretch);
  const wave = Math.sin(
    along * thread.turns * Math.PI * 2 - time * thread.pace + thread.phase,
  );
  const shake = (scatter(step) - WAKE_MIDDLE) * WAKE.jitter * at;
  return thread.side * wide * wave + thread.lift * wide + shake;
}

/** Die Mitte von {@link scatter}, um daraus ein Vorzeichen zu machen. */
const WAKE_MIDDLE = 0.5;

/** Dieselbe Hälfte, wo es um eine Hälfte geht. */
const WAKE_HALF = 0.5;

/** Die schmalste Strähne, als Anteil der weitesten. */
const WAKE_LOW = 0.35;

/** Zwei und drei Längen Versatz, damit jeder Faden eigene Zahlen bekommt. */
const WAKE_TWICE = 26;
const WAKE_THRICE = 39;

/**
 * The boat, tipped the way it is going.
 *
 * @remarks
 * `won` is how long ago it got through, and it is what makes the end of a
 * course look like the end of one: the engine has stopped, so the lift, the
 * nose coming up and the propeller still turning all happen here.
 */
function boat(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  left: number,
  won: number,
): void {
  // Nose up when climbing, down when diving: enough to read, not enough to
  // look like a crash.
  const going = Math.max(
    -BOAT.tiltMost,
    Math.min(BOAT.tiltMost, state.sub.vy / BOAT.tiltPer),
  );
  const lift = Math.min(WIN.lift, won * WIN.rise);
  const tilt = won > 0 ? WIN.tilt : going;
  // A hull that has just been hit blinks, which is the only way anybody ever
  // knows that the next rock is free as well.
  const blink =
    state.hurt > 0 && Math.floor(state.hurt * BOAT.blinks) % 2 === 1;
  if (!blink) {
    drawSub(ctx, {
      x: state.sub.x - left,
      y: SURFACE + state.sub.y - lift,
      tilt,
      turns: state.spin,
      // Der Schub und nicht die Geschwindigkeit: Was man sieht, ist die Hand
      // am Hebel - und die ist beim Ankommen aus Freude ganz vorn.
      thrust: won > 0 ? 1 : state.wash,
    });
  }
}

/** What is left of it. */
function blast(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  left: number,
  since: number,
): void {
  const at = state.hit ?? { x: state.sub.x, y: state.sub.y };
  const x = at.x - left;
  const y = SURFACE + at.y;
  const grown = Math.min(1, since * BLAST.pace);
  const wide = BLAST.from + grown * BLAST.reach;

  const fire = ctx.createRadialGradient(x, y, BLAST.core, x, y, wide);
  fire.addColorStop(0, "rgba(255,255,230,0.95)");
  fire.addColorStop(BLAST.hot, "rgba(255,150,60,0.75)");
  fire.addColorStop(1, "rgba(255,90,60,0)");
  ctx.fillStyle = fire;
  ctx.beginPath();
  ctx.arc(x, y, wide, 0, Math.PI * 2);
  ctx.fill();

  // Wreckage and a column of air going up, which is what a hull looks like
  // when it stops being one.
  ctx.fillStyle = SEA.foam;
  for (let bit = 0; bit < BLAST.bits; bit += 1) {
    const turn = scatter(bit) * Math.PI * 2;
    const away = (BLAST.from + scatter(bit + BLAST.bits) * BLAST.away) * grown;
    ctx.globalAlpha = BLAST.fade * (1 - grown);
    ctx.beginPath();
    ctx.arc(
      x + Math.cos(turn) * away,
      y + Math.sin(turn) * away - grown * BLAST.lift,
      BLAST.bit + scatter(bit + BLAST.bit) * BLAST.bitGrow,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Everything that is on its way somewhere: harpoons, torpedoes, mines. */
function flying(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  left: number,
): void {
  for (const shot of state.shots) {
    const x = shot.x - left;
    const y = SURFACE + shot.y;
    // Gezielt wird in jede Richtung, also liegt auch das Geschoss in jeder
    // Richtung. Eine Harpune, die schräg nach oben fliegt und dabei waagrecht
    // gezeichnet wird, sieht nicht wie ein Fehler des Bildes aus, sondern wie
    // einer des Spielers - und das ist schlimmer.
    const turn = Math.atan2(shot.vy, shot.vx);
    switch (shot.kind) {
      case "harpoon":
        harpoon(ctx, x, y, turn);
        break;
      case "torpedo":
        torpedo(ctx, x, y, turn, state.time);
        break;
      default:
        dropped(ctx, x, y, shot);
    }
  }
}

/** A harpoon: a shaft with a head on it and nothing else. */
function harpoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  turn: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);

  // Die Leine, die hinter ihr herzieht.
  ctx.globalAlpha = SPEAR.ropeFade;
  ctx.strokeStyle = SEA.foam;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-SPEAR.shaft - SPEAR.rope, 0);
  ctx.lineTo(-SPEAR.shaft, 0);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Der Schaft.
  ctx.strokeStyle = SEA.foam;
  ctx.lineWidth = SPEAR.line;
  ctx.beginPath();
  ctx.moveTo(-SPEAR.shaft, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();

  // Die Widerhaken, nach hinten gelegt.
  ctx.beginPath();
  ctx.moveTo(-SPEAR.barb, -SPEAR.flare);
  ctx.lineTo(0, 0);
  ctx.lineTo(-SPEAR.barb, SPEAR.flare);
  ctx.stroke();

  // Und die Spitze.
  ctx.fillStyle = SEA.foam;
  ctx.beginPath();
  ctx.moveTo(SPEAR.head, 0);
  ctx.lineTo(0, -SPEAR.head / 2);
  ctx.lineTo(0, SPEAR.head / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** A torpedo, with the trail that says which way it is going. */
function torpedo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  turn: number,
  time: number,
): void {
  const half = TORP.long / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);

  // Die Blasenfahne: je weiter hinten, desto kleiner.
  ctx.globalAlpha = TORP.fade;
  ctx.fillStyle = SEA.foam;
  for (let bubble = 0; bubble < TORP.bubbles; bubble += 1) {
    const back = half + TORP.first + bubble * TORP.apart;
    const sway = Math.sin(time * TORP.pace + bubble) * TORP.wobble;
    ctx.beginPath();
    ctx.arc(-back, sway, TORP.bubble - bubble * TORP.shrink, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Das Leitwerk, das ihn von allem anderen im Wasser unterscheidet.
  ctx.fillStyle = SEA.rock;
  ctx.beginPath();
  ctx.moveTo(-half + TORP.fin, -TORP.thick / 2);
  ctx.lineTo(-half - TORP.fin, -TORP.flare);
  ctx.lineTo(-half - TORP.fin, TORP.flare);
  ctx.lineTo(-half + TORP.fin, TORP.thick / 2);
  ctx.closePath();
  ctx.fill();

  // Der Körper, oben beleuchtet.
  const body = ctx.createLinearGradient(0, -TORP.thick / 2, 0, TORP.thick / 2);
  body.addColorStop(0, SEA.rockLit);
  body.addColorStop(1, SEA.rockDeep);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, half, TORP.thick / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Das Kennband auf dem Rücken - nur innerhalb des Körpers.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = SEA.gate;
  ctx.fillRect(-TORP.band / 2, -TORP.thick, TORP.band, TORP.thick * 2);
  ctx.restore();

  // Die Nase: der Teil, der gleich hochgeht.
  ctx.fillStyle = SEA.spark;
  ctx.beginPath();
  ctx.ellipse(
    half - half * TORP.nose,
    0,
    half * TORP.nose,
    TORP.thick / 2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  const glow = ctx.createRadialGradient(half, 0, 0, half, 0, TORP.glow * 2);
  glow.addColorStop(0, "rgba(255,200,120,0.9)");
  glow.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(half, 0, TORP.glow * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A mine that has been dropped: the same thing that kills you, only yours. */
function dropped(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  shot: Shot,
): void {
  ctx.strokeStyle = SEA.mineLit;
  ctx.lineWidth = 2;
  for (let spike = 0; spike < MINE.spikes; spike += 1) {
    const turn = (spike * Math.PI * 2) / MINE.spikes;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(turn) * AMMO.drop, y + Math.sin(turn) * AMMO.drop);
    ctx.lineTo(
      x + Math.cos(turn) * (AMMO.drop + AMMO.spike),
      y + Math.sin(turn) * (AMMO.drop + AMMO.spike),
    );
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y, AMMO.drop, 0, Math.PI * 2);
  ctx.fillStyle = SEA.mine;
  ctx.fill();
  // The fuse, which is the only thing that matters about a dropped mine.
  ctx.beginPath();
  ctx.arc(x, y, AMMO.fuse, 0, Math.PI * 2);
  ctx.fillStyle = SEA.spark;
  ctx.globalAlpha = Math.abs(Math.sin(shot.age * MINE.blinkPace * 2));
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** The bangs that are still worth looking at. */
function bangs(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  left: number,
): void {
  for (const one of state.blasts) {
    boom(ctx, one, left);
  }
}

/** One of them. */
function boom(ctx: CanvasRenderingContext2D, one: Blast, left: number): void {
  const grown = Math.min(1, one.age / BANG.life);
  const wide = Math.max(BANG.least, one.reach) * (BANG.from + grown);
  const x = one.x - left;
  const y = SURFACE + one.y;
  const fire = ctx.createRadialGradient(x, y, 1, x, y, wide);
  fire.addColorStop(0, `rgba(255,255,235,${(1 - grown) * BANG.core})`);
  fire.addColorStop(BLAST.hot, `rgba(255,160,70,${(1 - grown) * BANG.mid})`);
  fire.addColorStop(1, "rgba(255,90,60,0)");
  ctx.fillStyle = fire;
  ctx.beginPath();
  ctx.arc(x, y, wide, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * The dark, with a hole in it where the boat is.
 *
 * @remarks
 * Drawn as one wash over the whole picture rather than per square: what a
 * player has is a radius, and a radius is exactly what a radial gradient is.
 */
function night(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  left: number,
  dark: number,
): void {
  if (dark > 0) {
    const x = state.sub.x - left;
    const y = SURFACE + state.sub.y;
    const see = state.gear.light > 0 ? NIGHT.lit : NIGHT.bare;
    const veil = ctx.createRadialGradient(x, y, see, x, y, see + NIGHT.fade);
    veil.addColorStop(0, "rgba(1,6,14,0)");
    // Ganz schwarz, nicht nur dunkelblau: In der tiefen Höhle soll außerhalb
    // des Lichts nichts mehr sein - alles, was man dort trotzdem sieht, ist
    // Sonar und damit bezahlt.
    veil.addColorStop(1, `rgba(0,0,0,${NIGHT.veil * dark})`);
    ctx.fillStyle = veil;
    ctx.fillRect(0, SURFACE, VIEW_W, VIEW_H - SURFACE);
  }
}

/** The lamp: a warm cone ahead, and only where it was paid for. */
function lamp(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  left: number,
  dark: number,
): void {
  if (state.gear.light > 0 && dark > 0) {
    const x = state.sub.x - left + SUB_LONG / 2;
    const y = SURFACE + state.sub.y;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, NIGHT.reach, -NIGHT.spread, NIGHT.spread);
    ctx.closePath();
    ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    const warm = ctx.createRadialGradient(x, y, 0, x, y, NIGHT.reach);
    warm.addColorStop(0, `rgba(255,236,170,${NIGHT.glow * dark})`);
    warm.addColorStop(1, "rgba(255,236,170,0)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, SURFACE, VIEW_W, VIEW_H - SURFACE);
    ctx.restore();
  }
}

/**
 * The sonar: what is out there, drawn as outlines over the dark.
 *
 * @remarks
 * Deliberately not a second lamp. It says **where** the rock is and nothing
 * about what it looks like, which is the difference between seeing and
 * knowing - and it is the only thing that makes the last two waters anything
 * other than guesswork.
 */
function sonar(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  course: Course,
  left: number,
  dark: number,
): void {
  if (state.gear.light > 1 && dark > 0) {
    const sx = state.sub.x - left;
    const sy = SURFACE + state.sub.y;
    const ring = (state.time * NIGHT.ping) % NIGHT.sonar;
    const from = Math.floor(left / CELL) - 1;
    const to = Math.ceil((left + VIEW_W) / CELL) + 1;
    ctx.lineWidth = 2;

    // **Was lebt, steht auch auf dem Sonar.** Ein Gerät, das Fels meldet und
    // den Anglerfisch verschweigt, wäre keine Auskunft, sondern eine Falle.
    for (const beast of state.beasts) {
      const x = beast.x - left;
      const y = SURFACE + beast.y;
      const away = Math.hypot(x - sx, y - sy);
      if (away <= NIGHT.sonar) {
        const swept = Math.max(0, 1 - Math.abs(away - ring) / NIGHT.ringWide);
        ctx.strokeStyle = `rgba(255,214,90,${(SONAR.base + SONAR.sweep * swept) * dark})`;
        ctx.beginPath();
        ctx.arc(x, y, BREEDS[beast.kind].size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    for (let col = from; col <= to; col += 1) {
      for (let row = 0; row < ROWS; row += 1) {
        const there = solidAt(state.gone, course, col, row);
        const x = col * CELL - left;
        const y = SURFACE + row * CELL;
        const away = Math.hypot(x + CELL / 2 - sx, y + CELL / 2 - sy);
        const worth = solid(there) && away <= NIGHT.sonar;
        if (worth) {
          // Brightest where the ring is passing, faint everywhere else: a
          // sweep that shows nothing between sweeps cannot be played with.
          const swept = Math.max(0, 1 - Math.abs(away - ring) / NIGHT.ringWide);
          const seen = (SONAR.base + SONAR.sweep * swept) * dark;
          // Gelb, und nicht die Farbe des Wassers: Was das Sonar zeigt,
          // ist kein Licht, sondern eine Auskunft - und die muss sich von
          // allem unterscheiden, was man wirklich sieht.
          ctx.strokeStyle = `rgba(255,214,90,${seen})`;
          if (there === "B") {
            // Bruchfels bekommt ein Kreuz: Das Sonar sagt sonst nur, dass dort
            // etwas ist - und hier ist genau wichtig, **was**.
            ctx.strokeRect(x, y, CELL, CELL);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + CELL, y + CELL);
            ctx.moveTo(x + CELL, y);
            ctx.lineTo(x, y + CELL);
            ctx.stroke();
          } else if (there === "M") {
            ctx.beginPath();
            ctx.arc(x + CELL / 2, y + CELL / 2, MINE_R, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
          }
        }
      }
    }
  }
}

/**
 * Die Feier, wenn ein Kurs geschafft ist.
 *
 * @remarks
 * Ein Schwall Blasen über das ganze Bild und ein kurzes goldenes Aufleuchten.
 * Auf dem Wasser statt im Blatt darüber, weil dort das Spiel stattgefunden hat
 * - was man feiert, ist der Tauchgang und nicht die Schaltfläche.
 */
function cheer(ctx: CanvasRenderingContext2D, since: number): void {
  ctx.fillStyle = SEA.foam;
  for (let one = 0; one < WIN.bubbles; one += 1) {
    const x = scatter(one) * VIEW_W;
    const life = WIN.least + scatter(one + CORNER.b) * WIN.spread;
    const age = (since + scatter(one + CORNER.c) * life) % life;
    ctx.globalAlpha = WIN.fade * (1 - age / life);
    ctx.beginPath();
    ctx.arc(
      x + Math.sin(age * WIN.sway + one) * WIN.wander,
      VIEW_H - age * WIN.climb,
      WIN.small + scatter(one + CORNER.d) * WIN.grow,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // And the flash of the moment itself, which is over almost before it starts.
  const flash = Math.max(0, 1 - since / WIN.flashFor);
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,224,150,${flash * WIN.flash})`;
    ctx.fillRect(0, SURFACE, VIEW_W, VIEW_H - SURFACE);
  }
}

/**
 * Der Wächter, und was er wirft.
 *
 * @remarks
 * Ein Kopffüßer: Mantel, zwei Augen, acht Arme, die sich bewegen. Gezeichnet
 * wie alles andere hier, damit er sich bewegt, blinkt, wenn er getroffen ist,
 * und am Ende in derselben Explosion verschwindet wie jede Mine.
 */
function guard(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  left: number,
): void {
  for (const one of state.inks) {
    blob(ctx, one.x - left, SURFACE + one.y, one.age);
  }

  const boss = state.boss;
  if (boss !== null && boss.hull > 0) {
    const x = boss.x - left;
    const y = SURFACE + boss.y;
    const hit = boss.hurt > 0;

    const glow = ctx.createRadialGradient(
      x,
      y,
      KRAKEN.body / 2,
      x,
      y,
      KRAKEN.halo,
    );
    glow.addColorStop(0, "rgba(150,80,190,0.45)");
    glow.addColorStop(1, "rgba(150,80,190,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, KRAKEN.halo, 0, Math.PI * 2);
    ctx.fill();

    // Die Arme zuerst, damit der Mantel darüber liegt.
    ctx.strokeStyle = hit ? KRAKEN.hurt : KRAKEN.arm;
    ctx.lineWidth = KRAKEN.thick;
    ctx.lineCap = "round";
    for (let arm = 0; arm < KRAKEN.arms; arm += 1) {
      const spread = (arm / (KRAKEN.arms - 1) - KRAKEN.middle) * KRAKEN.fan;
      const wave = Math.sin(state.time * KRAKEN.pace + arm) * KRAKEN.sway;
      ctx.beginPath();
      ctx.moveTo(x - KRAKEN.body / 2, y + spread * KRAKEN.body);
      ctx.quadraticCurveTo(
        x - KRAKEN.body,
        y + spread * KRAKEN.body + wave,
        x - KRAKEN.reach,
        y + spread * KRAKEN.reach + wave * 2,
      );
      ctx.stroke();
    }
    ctx.lineCap = "butt";

    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      KRAKEN.body,
      KRAKEN.body * KRAKEN.squat,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = hit ? KRAKEN.hurt : KRAKEN.skin;
    ctx.fill();
    ctx.strokeStyle = KRAKEN.edge;
    ctx.lineWidth = KRAKEN.thin;
    ctx.stroke();

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(
        x + KRAKEN.eyeX,
        y + side * KRAKEN.eyeY,
        KRAKEN.eye,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = KRAKEN.white;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        x + KRAKEN.eyeX + KRAKEN.look,
        y + side * KRAKEN.eyeY,
        KRAKEN.pupil,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = KRAKEN.edge;
      ctx.fill();
    }

    // Was von ihm übrig ist, über ihm - die einzige Zahl, die im Kampf zählt.
    const share = Math.max(0, boss.hull / boss.whole);
    const bar = KRAKEN.barW;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x - bar / 2, y - KRAKEN.barUp, bar, KRAKEN.barH);
    ctx.fillStyle = KRAKEN.blood;
    ctx.fillRect(x - bar / 2, y - KRAKEN.barUp, bar * share, KRAKEN.barH);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - bar / 2, y - KRAKEN.barUp, bar, KRAKEN.barH);
  }
}

/** Ein Klecks Tinte auf dem Weg. */
function blob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  age: number,
): void {
  const pulse = KRAKEN.inkR + Math.sin(age * KRAKEN.pace) * KRAKEN.inkPulse;
  ctx.beginPath();
  ctx.arc(x, y, pulse, 0, Math.PI * 2);
  ctx.fillStyle = KRAKEN.ink;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - KRAKEN.inkR, y, KRAKEN.inkR / 2, 0, Math.PI * 2);
  ctx.fillStyle = KRAKEN.inkThin;
  ctx.fill();
}

/**
 * The murk at the back of the window.
 *
 * @remarks
 * The rule that you cannot fall behind needs a face, or being shoved along
 * feels like the game taking the controls away. A wall of dark water that
 * thickens the moment it touches you is a reason.
 */
function murk(ctx: CanvasRenderingContext2D, state: GameState): void {
  const dark = ctx.createLinearGradient(0, 0, MURK.wide, 0);
  const most = state.shoved ? MURK.shoving : MURK.calm;
  dark.addColorStop(0, `rgba(2,10,20,${most})`);
  dark.addColorStop(1, "rgba(2,10,20,0)");
  ctx.fillStyle = dark;
  ctx.fillRect(0, SURFACE, MURK.wide, VIEW_H - SURFACE);
}

/** The few numbers worth having on the picture itself. */
function hud(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  course: Course,
  scene: Scene,
): void {
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = HUD.text;
  ctx.textBaseline = "top";
  ctx.fillText(
    `Kurs ${scene.level}/${scene.levels} - ${scene.name}`,
    HUD.pad,
    HUD.pad,
  );

  air(ctx, state);

  ctx.font = HUD.small;
  const depth = Math.round(state.sub.y / CELL) * HUD.perRow;
  // Hundertstel auf der Leinwand: Tausendstel wären eine Ziffer, die nur
  // flackert. Was am Ende zählt, steht auf dem Siegblatt - auf die
  // Millisekunde genau.
  const clock = state.time.toFixed(CLOCK_DIGITS).replace(".", ",");
  ctx.textAlign = "right";
  ctx.fillText(`${depth} m   ${clock} s`, VIEW_W - HUD.pad, HUD.pad);
  ctx.textAlign = "left";

  // How far along the course the boat is, under the numbers: the one thing a
  // player wants at a glance is whether this is nearly over.
  const x = VIEW_W - HUD.pad - HUD.barW;
  const y = HUD.pad + HUD.barTop;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(x, y, HUD.barW, HUD.barH);
  const share = Math.max(0, Math.min(1, state.sub.x / course.goal));
  ctx.fillStyle = SEA.gate;
  ctx.fillRect(x, y, HUD.barW * share, HUD.barH);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, HUD.barW, HUD.barH);

  // And where the window's back edge stands on that same bar: the thing that
  // is chasing you, drawn on the thing you are measuring yourself by.
  const edge = Math.max(0, Math.min(1, state.window / course.goal));
  ctx.fillStyle = "rgba(255,120,90,0.9)";
  ctx.fillRect(
    x + HUD.barW * edge - 1,
    y - HUD.mark,
    HUD.mark,
    HUD.barH + HUD.markOut,
  );
}

/**
 * The air, the hull and what is on board - the three things upgrades buy.
 *
 * @remarks
 * Top left under the name of the water, where the eye already is. The air bar
 * changes colour rather than blinking: a dive is quite tense enough without
 * the screen shouting, and the colour is readable out of the corner of an eye
 * that is busy with a rock.
 */
function air(ctx: CanvasRenderingContext2D, state: GameState): void {
  const left = HUD.pad;
  const top = HUD.pad + AIR.top;
  const share = Math.max(0, Math.min(1, state.air / state.gear.air));

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(left, top, AIR.wide, AIR.high);
  ctx.fillStyle =
    share < AIR.panic ? SEA.spark : share < AIR.low ? AIR.warm : AIR.cool;
  ctx.fillRect(left, top, AIR.wide * share, AIR.high);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, AIR.wide, AIR.high);

  ctx.font = HUD.small;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(
    `Luft ${Math.max(0, Math.ceil(state.air))} s`,
    left + AIR.wide + AIR.gap,
    top - 1,
  );

  // One shield per hit the hull has in it, hollow for the ones already taken.
  const pips = top + AIR.high + AIR.gap;
  for (let pip = 0; pip < state.gear.hull; pip += 1) {
    const x = left + pip * (AIR.pip + AIR.pipGap);
    ctx.beginPath();
    ctx.moveTo(x + AIR.pip / 2, pips);
    ctx.lineTo(x + AIR.pip, pips + AIR.pip * AIR.notch);
    ctx.lineTo(x + AIR.pip / 2, pips + AIR.pip);
    ctx.lineTo(x, pips + AIR.pip * AIR.notch);
    ctx.closePath();
    if (pip < state.hull) {
      ctx.fillStyle = AIR.hull;
      ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.stroke();
    }
  }

  const gun = state.gear.gun;
  if (gun !== null || state.gear.mines) {
    const x = left + state.gear.hull * (AIR.pip + AIR.pipGap) + AIR.gap;
    // Beide stehen nebeneinander, weil die Seemine nichts ersetzt - und jede
    // wird für sich grau, solange ihre eigene Uhr noch läuft.
    const name = gun === null ? "" : ARMS_NAMES[gun];
    ctx.fillStyle =
      state.loaded <= 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)";
    ctx.fillText(name, x, pips);
    if (state.gear.mines) {
      ctx.fillStyle =
        state.laid <= 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)";
      ctx.fillText(
        gun === null ? ARMS_NAMES.mine : `+ ${ARMS_NAMES.mine}`,
        x + ctx.measureText(`${name} `).width,
        pips,
      );
    }
  }
}

/**
 * Das Zielkreuz, dort wo der Zeiger steht.
 *
 * @param ctx - die Zeichenfläche
 * @param at - der Zielpunkt in Bildpunkten, oder null
 * @param state - die Welt, für die Frage, ob überhaupt etwas an Bord ist
 * @remarks
 * Nur mit Waffe: Ein Kreuz über einem Boot, das nichts abschießen kann, wäre
 * ein Versprechen, das niemand hält. Und über der Dunkelheit, wie das
 * Steuerkreuz - was man selbst bedient, darf nie im Schatten liegen.
 */
function mark(
  ctx: CanvasRenderingContext2D,
  at: Vec | null,
  state: GameState,
): void {
  if (at === null || (state.gear.gun === null && !state.gear.mines)) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = MARK.fade;
  ctx.strokeStyle = state.loaded <= 0 ? SEA.foam : SEA.mineLit;
  ctx.lineWidth = MARK.line;
  ctx.beginPath();
  ctx.arc(at.x, at.y, MARK.ring, 0, Math.PI * 2);
  ctx.stroke();
  for (const [dx, dy] of PAD.arms) {
    ctx.beginPath();
    ctx.moveTo(at.x + dx * MARK.ring, at.y + dy * MARK.ring);
    ctx.lineTo(
      at.x + dx * (MARK.ring + MARK.tick),
      at.y + dy * (MARK.ring + MARK.tick),
    );
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Das Steuerkreuz, dort wo der Daumen aufgesetzt hat.
 *
 * @param ctx - die Zeichenfläche
 * @param pad - wo es sitzt und wohin der Daumen zieht, oder null
 * @remarks
 * Über allem, auch über der Dunkelheit: Was man selbst bedient, darf nie im
 * Schatten liegen.
 */
function cross(ctx: CanvasRenderingContext2D, pad: PadView | null): void {
  if (pad === null) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = PAD.fade;
  ctx.strokeStyle = SEA.foam;
  ctx.lineWidth = PAD.line;

  // Der Ring, in dem es sich bewegt, und die vier Arme des Kreuzes.
  ctx.beginPath();
  ctx.arc(pad.baseX, pad.baseY, PAD.ring, 0, Math.PI * 2);
  ctx.stroke();
  for (const [dx, dy] of PAD.arms) {
    ctx.beginPath();
    ctx.moveTo(pad.baseX + dx * PAD.inner, pad.baseY + dy * PAD.inner);
    ctx.lineTo(pad.baseX + dx * PAD.ring, pad.baseY + dy * PAD.ring);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(pad.tipX, pad.tipY, PAD.knob, 0, Math.PI * 2);
  ctx.fillStyle = SEA.foam;
  ctx.fill();
  ctx.restore();
}

/**
 * A number between nought and one that is always the same for the same input.
 *
 * @remarks
 * The rocks have to look hand-made and the same rock has to look the same way
 * every frame, so there is no random here at all - only a hash of where a
 * thing is.
 */
function scatter(seed: number): number {
  const spun = Math.sin(seed * HASH.turn) * HASH.blow;
  return spun - Math.floor(spun);
}
