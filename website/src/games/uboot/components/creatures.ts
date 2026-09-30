/**
 * Wie die Bewohner des Wassers aussehen.
 *
 * @module
 * @remarks
 * Ein eigenes Modul neben {@link ./render}, weil hier nichts vom Spiel steht,
 * sondern nur Striche: sechs Tiere, jedes ein paar Dutzend Zeilen Pfad. Der
 * Rest des Zeichners kennt davon nur {@link drawBeast} und muss nie wissen,
 * wie viele Beine eine Krabbe hat.
 *
 * **Jedes Maß ist ein Anteil seiner Größe**, und alle Anteile stehen oben in
 * einer Tabelle statt unten im Pfad. Ein Tier, das zu dick geraten ist, wird
 * damit an einer Stelle korrigiert und nicht an sieben.
 *
 * Gezeichnet, nicht geklebt - wie alles hier. Ein Bild müsste geladen werden,
 * skalieren und zum Rest passen; ein Pfad tut das von sich aus, und er kann
 * zappeln, ohne dass jemand eine zweite Datei malt.
 */
import { BREEDS } from "@/games/uboot/engine/beasts";
import type { Beast, BeastKind } from "@/games/uboot/engine/types";

/** Die Farben der Bewohner. */
const SKIN = {
  fish: "#cfe6f2",
  fishBack: "#5f8ca6",
  jelly: "rgba(255,150,214,0.75)",
  jellyEdge: "rgba(255,210,240,0.9)",
  jellyGlow: "rgba(255,120,200,",
  urchin: "#241f33",
  urchinSpike: "#6f52b5",
  crab: "#d4553a",
  crabDark: "#8f2f1c",
  crabEye: "#f7f7f7",
  eel: "#49775e",
  eelBack: "#24493a",
  angler: "#243442",
  anglerBelly: "#3d5668",
  tooth: "#f2f4f0",
  lure: "#ffe9a3",
  lureGlow: "rgba(255,233,163,",
  eye: "#0d1218",
  flash: "#ffffff",
} as const;

/** Wie ein Fischschwarm gebaut ist. */
const SHOAL = {
  /** Wie groß ein einzelner Fisch ist und wie weit sie zappeln. */
  long: 7,
  thick: 4,
  tail: 5,
  bob: 3,
  pace: 5,
} as const;

/** Wo die einzelnen Fische im Schwarm stehen, in Vielfachen seiner Größe. */
const SPOT = {
  out: 0.8,
  half: 0.5,
  in: 0.3,
  low: 0.4,
  deep: 0.6,
} as const;

/** Dieselben Plätze, als Liste. */
const SCHOOL: readonly (readonly [number, number])[] = [
  [-SPOT.out, -SPOT.half],
  [0, -SPOT.out],
  [SPOT.out, -SPOT.in],
  [-SPOT.half, SPOT.low],
  [SPOT.in, SPOT.deep],
  [1, SPOT.half],
];

/** Die Qualle. */
const JELLY = {
  /** Wie tief die Glocke ist und wie viele Zipfel ihr Rand hat. */
  bell: 0.95,
  frills: 5,
  dip: 0.18,
  /** Wie stark sie atmet. */
  breathe: 0.2,
  /** Die Fäden: wie viele, wie lang, wie weit sie schwingen. */
  strings: 5,
  spread: 1.4,
  trail: 2.2,
  sway: 0.5,
  bend: 0.3,
  middle: 0.6,
  pace: 2.4,
  /** Und wie weit ihr Schein reicht. */
  halo: 2.6,
  shine: 0.35,
} as const;

/** Der Seeigel. */
const URCHIN = { spikes: 14, spike: 0.75, line: 2, core: 0.65 } as const;

/** Die Krabbe. */
const CRAB = {
  /** Panzerbreite und -höhe, als Vielfaches ihrer Größe. */
  wide: 1.15,
  high: 0.72,
  /** Die Beine: wie viele je Seite, wie lang, wie weit auseinander. */
  legs: 3,
  leg: 0.85,
  short: 0.6,
  apart: 0.42,
  /** Die Scheren: wie groß, wie weit vorn, wo sie am Panzer sitzen. */
  claw: 0.4,
  squat: 0.7,
  reach: 1.1,
  shoulder: 0.6,
  tilt: 0.5,
  /** Und die Augen auf ihren Stielen. */
  eye: 0.16,
  stalk: 0.5,
  stalkX: 0.6,
  stalkY: 0.5,
  rootX: 0.3,
  rootY: 0.4,
  line: 2,
  pace: 6,
  wave: 0.12,
} as const;

/** Der Aal. */
const EEL = {
  /** Wie lang er ist und wie dick an der dicksten Stelle. */
  long: 2.6,
  thick: 0.55,
  /** Seine Welle: wie viele Glieder, wie hoch, wie schnell. */
  links: 9,
  wave: 0.5,
  pace: 9,
  turns: 2.2,
  /** Der dunkle Rückenstrich und der Kopf. */
  spine: 0.4,
  head: 0.8,
  eye: 0.12,
  eyeX: 0.3,
  eyeY: 0.3,
} as const;

/** Und der Anglerfisch. */
const ANGLER = {
  /** Körper und Schwanz. */
  wide: 1.15,
  high: 0.95,
  tail: 0.8,
  waist: 0.8,
  fluke: 0.8,
  /** Das Maul: wie weit es aufsteht und wie viele Zähne darin stehen. */
  gape: 0.55,
  lip: 0.1,
  teeth: 5,
  tooth: 0.16,
  firstTooth: 0.15,
  jaw: 0.8,
  /** Das Auge. */
  eye: 0.14,
  eyeX: 0.2,
  eyeY: 0.35,
  pupilX: 0.18,
  pupil: 0.55,
  /** Die Rute: wie weit nach vorn, wie hoch, und wie groß das Licht daran. */
  rod: 1.5,
  lift: 1.4,
  crown: 0.9,
  arch: 0.6,
  curl: 1.3,
  lure: 0.26,
  halo: 2.2,
  shine: 0.5,
  line: 2,
  pace: 3,
  bob: 0.08,
} as const;

/** Wie stark ein getroffenes Tier aufleuchtet. */
const SMART = { fade: 3, white: 0.65 } as const;

/**
 * Zeichnet ein Wesen an seine Stelle im Bild.
 *
 * @param ctx - die Zeichenfläche
 * @param beast - das Wesen
 * @param x - wo es im Bild steht, waagrecht
 * @param y - und senkrecht
 * @param time - die Uhr des Tauchgangs, fürs Zappeln
 * @remarks
 * Wer nach links schwimmt, wird gespiegelt - ein Tier, das rückwärts durchs
 * Wasser schaut, ist das Erste, was auffällt, und das Letzte, was man erklären
 * kann.
 */
export function drawBeast(
  ctx: CanvasRenderingContext2D,
  beast: Beast,
  x: number,
  y: number,
  time: number,
): void {
  const size = BREEDS[beast.kind].size;
  const own = time + beast.beat;
  ctx.save();
  ctx.translate(x, y);
  if (beast.vx < 0) {
    ctx.scale(-1, 1);
  }

  switch (beast.kind) {
    case "shoal":
      shoal(ctx, size, own);
      break;
    case "jelly":
      jelly(ctx, size, own);
      break;
    case "urchin":
      urchin(ctx, size);
      break;
    case "crab":
      crab(ctx, size, own);
      break;
    case "eel":
      eel(ctx, size, own);
      break;
    default:
      angler(ctx, size, own);
  }

  if (beast.hurt > 0) {
    ctx.globalAlpha = Math.min(1, beast.hurt * SMART.fade) * SMART.white;
    ctx.fillStyle = SKIN.flash;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/**
 * Der Schein, den manche von ihnen auch im Schwarzen abgeben.
 *
 * @param ctx - die Zeichenfläche
 * @param beast - das Wesen
 * @param x - wo es im Bild steht, waagrecht
 * @param y - und senkrecht
 * @param dark - wie dunkel es hier ist, von null bis eins
 * @remarks
 * Wird **über** dem Schleier gezeichnet und nur für die, die leuchten. Das ist
 * kein Entgegenkommen, sondern die Regel der Tiefe: Was man dort unten sieht,
 * leuchtet selbst - und wer eine Qualle kommen sieht, muss nicht raten.
 */
export function glowBeast(
  ctx: CanvasRenderingContext2D,
  beast: Beast,
  x: number,
  y: number,
  dark: number,
): void {
  const size = BREEDS[beast.kind].size;
  const jellied = beast.kind === "jelly";
  const far = size * (jellied ? JELLY.halo : ANGLER.halo);
  const lit = jellied ? JELLY.shine : ANGLER.shine;
  const hue = jellied ? SKIN.jellyGlow : SKIN.lureGlow;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, far);
  glow.addColorStop(0, `${hue}${lit * dark})`);
  glow.addColorStop(1, `${hue}0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, far, 0, Math.PI * 2);
  ctx.fill();
}

/** Ob diese Art im Dunkeln von selbst zu sehen ist. */
export function shines(kind: BeastKind): boolean {
  return BREEDS[kind].glows;
}

/** Ein Schwarm: viele kleine Leiber, die sich wie einer bewegen. */
function shoal(
  ctx: CanvasRenderingContext2D,
  size: number,
  time: number,
): void {
  SCHOOL.forEach(([ax, ay], fish) => {
    const x = ax * size;
    const y = ay * size + Math.sin(time * SHOAL.pace + fish) * SHOAL.bob;
    ctx.fillStyle = fish % 2 === 0 ? SKIN.fish : SKIN.fishBack;
    ctx.beginPath();
    ctx.ellipse(x, y, SHOAL.long, SHOAL.thick, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - SHOAL.long, y);
    ctx.lineTo(x - SHOAL.long - SHOAL.tail, y - SHOAL.thick);
    ctx.lineTo(x - SHOAL.long - SHOAL.tail, y + SHOAL.thick);
    ctx.closePath();
    ctx.fill();
  });
}

/** Eine Qualle: eine Glocke, die atmet, und Fäden, die nachziehen. */
function jelly(
  ctx: CanvasRenderingContext2D,
  size: number,
  time: number,
): void {
  const pulse = 1 + Math.sin(time * JELLY.pace) * JELLY.sway * JELLY.breathe;

  ctx.strokeStyle = SKIN.jellyEdge;
  ctx.lineWidth = 2;
  for (let string = 0; string < JELLY.strings; string += 1) {
    const at =
      (string / (JELLY.strings - 1) - JELLY.sway) * size * JELLY.spread;
    const end = at + Math.sin(time * JELLY.pace + string) * size * JELLY.sway;
    ctx.beginPath();
    ctx.moveTo(at, 0);
    ctx.quadraticCurveTo(
      at + end * JELLY.bend,
      size * JELLY.trail * JELLY.middle,
      end,
      size * JELLY.trail,
    );
    ctx.stroke();
  }

  ctx.fillStyle = SKIN.jelly;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * pulse, size * JELLY.bell * pulse, 0, Math.PI, 0);
  // Der gezipfelte Rand: das, was eine Glocke von einer Halbkugel trennt.
  for (let frill = 0; frill <= JELLY.frills; frill += 1) {
    const span = (frill / JELLY.frills) * 2 - 1;
    ctx.lineTo(-span * size * pulse, frill % 2 === 0 ? size * JELLY.dip : 0);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = SKIN.jellyEdge;
  ctx.stroke();
}

/** Ein Seeigel: ein Ball, der nichts tut - außer im Weg zu sein. */
function urchin(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.strokeStyle = SKIN.urchinSpike;
  ctx.lineWidth = URCHIN.line;
  for (let spike = 0; spike < URCHIN.spikes; spike += 1) {
    const turn = (spike / URCHIN.spikes) * Math.PI * 2;
    const from = size * URCHIN.core;
    const to = size * (1 + URCHIN.spike);
    ctx.beginPath();
    ctx.moveTo(Math.cos(turn) * from, Math.sin(turn) * from);
    ctx.lineTo(Math.cos(turn) * to, Math.sin(turn) * to);
    ctx.stroke();
  }
  ctx.fillStyle = SKIN.urchin;
  ctx.beginPath();
  ctx.arc(0, 0, size * URCHIN.core, 0, Math.PI * 2);
  ctx.fill();
}

/** Eine Krabbe: Panzer, Scheren, Beine - und zwei Augen auf Stielen. */
function crab(ctx: CanvasRenderingContext2D, size: number, time: number): void {
  const step = Math.sin(time * CRAB.pace) * size * CRAB.wave;

  ctx.strokeStyle = SKIN.crabDark;
  ctx.lineWidth = CRAB.line;
  for (let leg = 0; leg < CRAB.legs; leg += 1) {
    const at = (leg - 1) * size * CRAB.apart;
    const kick = leg % 2 === 0 ? step : -step;
    for (const side of SIDES) {
      ctx.beginPath();
      ctx.moveTo(at, 0);
      ctx.lineTo(at + kick, size * CRAB.leg * (side > 0 ? 1 : CRAB.short));
      ctx.stroke();
    }
  }

  // Die Scheren vorn, offen wie immer.
  for (const side of SIDES) {
    const x = size * CRAB.reach;
    const y = side * size * CRAB.claw;
    ctx.beginPath();
    ctx.moveTo(size * CRAB.high * CRAB.shoulder, y * CRAB.tilt);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = SKIN.crabDark;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      size * CRAB.claw,
      size * CRAB.claw * CRAB.squat,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.fillStyle = SKIN.crab;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * CRAB.wide, size * CRAB.high, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const side of SIDES) {
    const x = size * CRAB.stalk * CRAB.stalkX;
    const y = side * size * CRAB.stalk * CRAB.stalkY;
    ctx.strokeStyle = SKIN.crabDark;
    ctx.beginPath();
    ctx.moveTo(x * CRAB.rootX, y * CRAB.rootY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = SKIN.crabEye;
    ctx.beginPath();
    ctx.arc(x, y, size * CRAB.eye, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Oben und unten, für alles, was ein Tier zweimal hat. */
const SIDES: readonly number[] = [-1, 1];

/** Ein Aal: eine Welle mit Kopf. */
function eel(ctx: CanvasRenderingContext2D, size: number, time: number): void {
  const long = size * EEL.long;
  const thick = size * EEL.thick;

  ctx.strokeStyle = SKIN.eel;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let link = 0; link <= EEL.links; link += 1) {
    const along = link / EEL.links;
    const x = long / 2 - along * long;
    const y =
      Math.sin(time * EEL.pace + along * EEL.turns * Math.PI) *
      size *
      EEL.wave *
      along;
    if (link === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.lineWidth = thick;
  ctx.stroke();
  ctx.strokeStyle = SKIN.eelBack;
  ctx.lineWidth = thick * EEL.spine;
  ctx.stroke();
  ctx.lineCap = "butt";

  ctx.fillStyle = SKIN.eel;
  ctx.beginPath();
  ctx.ellipse(long / 2, 0, thick, thick * EEL.head, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SKIN.eye;
  ctx.beginPath();
  ctx.arc(
    long / 2 + thick * EEL.eyeX,
    -thick * EEL.eyeY,
    size * EEL.eye,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

/** Ein Anglerfisch: viel Maul, wenig Entgegenkommen, und ein Licht davor. */
function angler(
  ctx: CanvasRenderingContext2D,
  size: number,
  time: number,
): void {
  const wide = size * ANGLER.wide;
  const high = size * ANGLER.high;
  const bob = Math.sin(time * ANGLER.pace) * size * ANGLER.bob;

  ctx.fillStyle = SKIN.anglerBelly;
  ctx.beginPath();
  ctx.moveTo(-wide * ANGLER.waist, 0);
  ctx.lineTo(-wide - size * ANGLER.tail, -high * ANGLER.fluke);
  ctx.lineTo(-wide - size * ANGLER.tail, high * ANGLER.fluke);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SKIN.angler;
  ctx.beginPath();
  ctx.ellipse(0, 0, wide, high, 0, 0, Math.PI * 2);
  ctx.fill();

  // Das Maul: ein Keil aus dem Körper heraus, mit Zähnen darin.
  ctx.fillStyle = SKIN.anglerBelly;
  ctx.beginPath();
  ctx.moveTo(wide * ANGLER.lip, -high * ANGLER.gape);
  ctx.lineTo(wide, 0);
  ctx.lineTo(wide * ANGLER.lip, high * ANGLER.gape);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SKIN.tooth;
  for (let tooth = 0; tooth < ANGLER.teeth; tooth += 1) {
    const along = tooth / (ANGLER.teeth - 1);
    const x = wide * ANGLER.firstTooth + along * wide * ANGLER.jaw;
    const y = high * ANGLER.gape * (1 - along);
    for (const side of SIDES) {
      ctx.beginPath();
      ctx.moveTo(x, side * y);
      ctx.lineTo(x + size * ANGLER.tooth, side * y);
      ctx.lineTo(x, side * (y - size * ANGLER.tooth));
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.fillStyle = SKIN.tooth;
  ctx.beginPath();
  ctx.arc(
    -wide * ANGLER.eyeX,
    -high * ANGLER.eyeY,
    size * ANGLER.eye,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = SKIN.eye;
  ctx.beginPath();
  ctx.arc(
    -wide * ANGLER.pupilX,
    -high * ANGLER.eyeY,
    size * ANGLER.eye * ANGLER.pupil,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Und die Rute mit dem Köder - das Einzige, was man von ihm sieht, solange
  // man ihn nicht sehen soll.
  const tipX = size * ANGLER.rod;
  const tipY = -size * ANGLER.lift + bob;
  ctx.strokeStyle = SKIN.anglerBelly;
  ctx.lineWidth = ANGLER.line;
  ctx.beginPath();
  ctx.moveTo(-wide * ANGLER.eyeX, -high * ANGLER.crown);
  ctx.quadraticCurveTo(wide * ANGLER.arch, tipY * ANGLER.curl, tipX, tipY);
  ctx.stroke();
  ctx.fillStyle = SKIN.lure;
  ctx.beginPath();
  ctx.arc(tipX, tipY, size * ANGLER.lure, 0, Math.PI * 2);
  ctx.fill();
}
