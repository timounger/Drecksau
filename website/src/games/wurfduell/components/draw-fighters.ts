/**
 * Drawing the eight fighters: standing, aiming, throwing, flinching, knocked
 * out and cheering.
 *
 * @module
 * @remarks
 * Every fighter is drawn facing right with the feet on the origin, in canvas
 * units with up being negative; the caller mirrors the right-hand one. The
 * proportions follow the hit areas in the engine's arena module, so what is
 * drawn is what can be hit - a tomato that flies over a hat really missed.
 */
import {
  BODY_HEIGHT,
  BODY_WIDTH,
  HEAD_RADIUS,
} from "@/games/wurfduell/engine/arena";
import type { CharacterId, ItemId } from "@/games/wurfduell/engine/types";
import { drawItem } from "./draw-items";

/** What a fighter is doing. */
export type PoseKind = "idle" | "aim" | "throw" | "hit" | "ko" | "win";

/** A fighter's pose at one moment. */
export type Pose = {
  readonly kind: PoseKind;
  /** Seconds since the pose began. */
  readonly t: number;
  /** The aimed angle in degrees, for aiming and throwing. */
  readonly angle: number;
};

/** A splash that stuck to a fighter. */
export type Stain = {
  readonly color: string;
  /** On the face or on the body. */
  readonly onHead: boolean;
  /** Where on that part, -1 to 1 sideways. */
  readonly offset: number;
};

/** Everything needed to draw one fighter. */
export type FighterLook = {
  readonly character: CharacterId;
  /** Feet position, in canvas units. */
  readonly x: number;
  readonly y: number;
  /** +1 facing right, -1 facing left. */
  readonly facing: number;
  readonly size: number;
  readonly pose: Pose;
  /** Seconds since the page started, for breathing and blinking. */
  readonly clock: number;
  /** What is in the hand while aiming, if anything. */
  readonly held: ItemId | null;
  readonly stains: readonly Stain[];
};

/** Colours of one fighter. */
type Palette = {
  readonly skin: string;
  readonly torso: string;
  readonly sleeve: string;
  readonly legs: string;
  readonly shoes: string;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- the drawings: body
   proportions, angles and timings */

/** Each fighter's colours. */
const PALETTES: Readonly<Record<CharacterId, Palette>> = {
  koch: {
    skin: "#f2c9a0",
    torso: "#fbfbfb",
    sleeve: "#f1f1f1",
    legs: "#3a3a3a",
    shoes: "#222",
  },
  gaertnerin: {
    skin: "#e9b68c",
    torso: "#4f9a3a",
    sleeve: "#f4d35e",
    legs: "#3f7d2e",
    shoes: "#6b4423",
  },
  pirat: {
    skin: "#d9a074",
    torso: "#f2f2f2",
    sleeve: "#f2f2f2",
    legs: "#24262b",
    shoes: "#3a2414",
  },
  ritter: {
    skin: "#f0c8a0",
    torso: "#a5aeb8",
    sleeve: "#8f99a6",
    legs: "#7c8794",
    shoes: "#5f6872",
  },
  baeckerin: {
    skin: "#f5cfae",
    torso: "#f2a7b8",
    sleeve: "#f2a7b8",
    legs: "#d77f96",
    shoes: "#7a3b4b",
  },
  schneemann: {
    skin: "#f6faff",
    torso: "#f6faff",
    sleeve: "#6b4423",
    legs: "#f6faff",
    shoes: "#f6faff",
  },
  roboter: {
    skin: "#9aa4ae",
    torso: "#7c8794",
    sleeve: "#9aa4ae",
    legs: "#5f6872",
    shoes: "#3e454d",
  },
  dino: {
    skin: "#5fb04a",
    torso: "#5fb04a",
    sleeve: "#5fb04a",
    legs: "#4f9a3a",
    shoes: "#3f7d2e",
  },
};

/** Where the throwing shoulder sits. */
const SHOULDER_X = BODY_WIDTH / 2 - 6;
const SHOULDER_Y = -BODY_HEIGHT + 10;
/** Arm length. */
const ARM = 30;
/** How long the arm takes to swing through, in seconds. */
const SWING_SECONDS = 0.16;
/** How long a knockout takes to fall, in seconds. */
const FALL_SECONDS = 0.55;

/**
 * Draws one fighter.
 *
 * @param ctx - where to draw
 * @param look - who, where and in which pose
 */
export function drawFighter(
  ctx: CanvasRenderingContext2D,
  look: FighterLook,
): void {
  const { pose, clock } = look;
  const palette = PALETTES[look.character];
  ctx.save();
  ctx.translate(look.x, look.y);

  // Shadow first, unrotated, so it stays on the ground.
  ctx.fillStyle = "#00000033";
  ctx.beginPath();
  ctx.ellipse(0, 2, BODY_WIDTH * 0.7 * look.size, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(look.facing * look.size, look.size);
  let lift = Math.sin(clock * 2.2) * 1.2;
  let tilt = 0;
  if (pose.kind === "win") {
    lift = -Math.abs(Math.sin(pose.t * 6)) * 26;
  } else if (pose.kind === "hit") {
    const fade = Math.max(0, 1 - pose.t / 0.6);
    tilt = -0.28 * fade;
    lift = Math.sin(pose.t * 40) * 2 * fade;
  } else if (pose.kind === "ko") {
    tilt = -Math.min(1, pose.t / FALL_SECONDS) * (Math.PI / 2);
    lift = 0;
  }
  ctx.translate(0, lift);
  ctx.rotate(tilt);

  drawBack(ctx, look.character, palette);
  drawLegs(ctx, look.character, palette, pose);
  drawTorso(ctx, look.character, palette);
  drawOtherArm(ctx, look.character, palette, pose);
  drawStains(ctx, look.stains, false);
  drawHead(ctx, look.character, palette, pose, clock);
  drawStains(ctx, look.stains, true);
  drawThrowingArm(ctx, look, palette);
  if (pose.kind === "ko") {
    drawDizzy(ctx, pose.t);
  }
  ctx.restore();
}

/**
 * Where the throwing arm points, in canvas radians in the fighter's own frame.
 *
 * @param pose - the pose
 * @returns the arm's angle; 0 is straight ahead, positive turns downwards
 */
export function armAngle(pose: Pose): number {
  const aim = (pose.angle * Math.PI) / 180;
  const hang = Math.PI / 2 - 0.12;
  let angle = hang;
  switch (pose.kind) {
    case "aim":
      angle = Math.PI - aim;
      break;
    case "throw": {
      const swing = Math.min(1, pose.t / SWING_SECONDS);
      const back = Math.min(1, Math.max(0, (pose.t - 0.35) / 0.3));
      const forward = -aim - 0.25;
      angle = Math.PI - aim + (forward - (Math.PI - aim)) * easeOut(swing);
      angle += (hang - forward) * back;
      break;
    }
    case "win":
      angle = -Math.PI / 2 - 0.4 + Math.sin(pose.t * 12) * 0.25;
      break;
    case "ko":
      angle = Math.PI / 2 + 0.3;
      break;
    default:
      angle = hang;
  }
  return angle;
}

/** Things behind the body: the dino's tail. */
function drawBack(
  ctx: CanvasRenderingContext2D,
  character: CharacterId,
  palette: Palette,
): void {
  if (character === "dino") {
    ctx.fillStyle = palette.legs;
    ctx.beginPath();
    ctx.moveTo(-14, -20);
    ctx.quadraticCurveTo(-46, -10, -60, -4);
    ctx.quadraticCurveTo(-40, -2, -12, -40);
    ctx.closePath();
    ctx.fill();
  }
}

/** The legs, or what stands in for them. */
function drawLegs(
  ctx: CanvasRenderingContext2D,
  character: CharacterId,
  palette: Palette,
  pose: Pose,
): void {
  if (character === "schneemann") {
    snowBall(ctx, 0, -27, 28);
  } else {
    const step = pose.kind === "win" ? Math.sin(pose.t * 12) * 3 : 0;
    const width = character === "dino" ? 12 : 9;
    ctx.fillStyle = palette.legs;
    roundRect(ctx, -12 - step, -30, width, 28, 3);
    roundRect(ctx, 3 + step, -30, width, 28, 3);
    ctx.fillStyle = palette.shoes;
    roundRect(ctx, -14 - step, -6, width + 6, 7, 3);
    roundRect(ctx, 2 + step, -6, width + 6, 7, 3);
    if (character === "koch") {
      // Checked trousers.
      ctx.fillStyle = "#f5f5f5";
      for (let y = -28; y < -6; y += 6) {
        ctx.fillRect(-12, y, 3, 3);
        ctx.fillRect(-6, y + 3, 3, 3);
        ctx.fillRect(3, y, 3, 3);
        ctx.fillRect(9, y + 3, 3, 3);
      }
    }
  }
}

/** The body. */
function drawTorso(
  ctx: CanvasRenderingContext2D,
  character: CharacterId,
  palette: Palette,
): void {
  const top = -BODY_HEIGHT;
  const half = BODY_WIDTH / 2;
  switch (character) {
    case "schneemann":
      snowBall(ctx, 0, -64, 22);
      ctx.fillStyle = "#222";
      for (const y of [-74, -62, -50]) {
        dot(ctx, 3, y, 2.6);
      }
      ctx.fillStyle = "#c8342d";
      roundRect(ctx, -14, -84, 28, 7, 3);
      ctx.fillRect(4, -80, 7, 18);
      break;
    case "roboter":
      ctx.fillStyle = palette.torso;
      roundRect(ctx, -half + 2, top + 4, BODY_WIDTH - 4, 46, 5);
      ctx.fillStyle = "#3e454d";
      roundRect(ctx, -12, top + 14, 24, 18, 3);
      ctx.fillStyle = "#4ade80";
      dot(ctx, -5, top + 23, 3);
      ctx.fillStyle = "#facc15";
      dot(ctx, 5, top + 23, 3);
      break;
    case "dino":
      ctx.fillStyle = palette.torso;
      roundRect(ctx, -half, top + 2, BODY_WIDTH, 50, 18);
      ctx.fillStyle = "#e8f0b0";
      roundRect(ctx, -6, top + 12, 20, 36, 10);
      ctx.fillStyle = "#3f7d2e";
      for (let i = 0; i < 4; i++) {
        triangle(
          ctx,
          -half + 2,
          top + 10 + i * 11,
          -half - 8,
          top + 15 + i * 11,
          -half + 2,
          top + 20 + i * 11,
        );
      }
      break;
    default: {
      ctx.fillStyle = palette.torso;
      roundRect(ctx, -half + 3, top + 2, BODY_WIDTH - 6, 48, 9);
      drawOutfit(ctx, character, top, half);
    }
  }
}

/** Details on an ordinary torso. */
function drawOutfit(
  ctx: CanvasRenderingContext2D,
  character: CharacterId,
  top: number,
  half: number,
): void {
  switch (character) {
    case "koch":
      ctx.fillStyle = "#d1d5db";
      for (const y of [top + 14, top + 26]) {
        dot(ctx, -4, y, 2);
        dot(ctx, 6, y, 2);
      }
      ctx.fillStyle = "#dc2626";
      triangle(ctx, -8, top + 4, 10, top + 4, 1, top + 14);
      break;
    case "gaertnerin":
      ctx.fillStyle = "#f4d35e";
      ctx.fillRect(-half + 5, top + 2, BODY_WIDTH - 10, 12);
      ctx.fillStyle = "#3f7d2e";
      ctx.fillRect(-10, top + 2, 4, 14);
      ctx.fillRect(7, top + 2, 4, 14);
      ctx.fillStyle = "#6b4423";
      roundRect(ctx, -9, top + 26, 18, 12, 2);
      break;
    case "pirat":
      ctx.fillStyle = "#b3262d";
      for (let y = top + 6; y < top + 48; y += 9) {
        ctx.fillRect(-half + 3, y, BODY_WIDTH - 6, 4);
      }
      ctx.fillStyle = "#3a2414";
      ctx.fillRect(-half + 3, top + 38, BODY_WIDTH - 6, 6);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-3, top + 38, 6, 6);
      break;
    case "ritter":
      ctx.fillStyle = "#c8342d";
      ctx.beginPath();
      ctx.moveTo(-12, top + 10);
      ctx.lineTo(12, top + 10);
      ctx.lineTo(12, top + 30);
      ctx.lineTo(0, top + 40);
      ctx.lineTo(-12, top + 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-2, top + 13, 4, 20);
      ctx.fillRect(-8, top + 19, 16, 4);
      break;
    case "baeckerin":
      ctx.fillStyle = "#fffaf5";
      roundRect(ctx, -12, top + 12, 24, 38, 6);
      ctx.fillStyle = "#f2a7b8";
      dot(ctx, 0, top + 30, 3);
      break;
    default:
      break;
  }
}

/** The arm that does not throw. */
function drawOtherArm(
  ctx: CanvasRenderingContext2D,
  character: CharacterId,
  palette: Palette,
  pose: Pose,
): void {
  let angle = Math.PI / 2 + 0.12;
  if (pose.kind === "win") {
    angle = -Math.PI / 2 + 0.4 - Math.sin(pose.t * 12) * 0.25;
  } else if (pose.kind === "aim") {
    // Points at the target, the way one aims a throw.
    angle = (-(pose.angle * Math.PI) / 180) * 0.6;
  }
  limb(
    ctx,
    character,
    palette,
    -SHOULDER_X,
    SHOULDER_Y + 2,
    angle,
    character === "dino" ? 16 : ARM - 4,
  );
}

/** The throwing arm, with whatever it holds. */
function drawThrowingArm(
  ctx: CanvasRenderingContext2D,
  look: FighterLook,
  palette: Palette,
): void {
  const angle = armAngle(look.pose);
  const length = look.character === "dino" ? 18 : ARM;
  limb(ctx, look.character, palette, SHOULDER_X, SHOULDER_Y, angle, length);
  if (look.held !== null && look.pose.kind === "aim") {
    drawItem(
      ctx,
      look.held,
      SHOULDER_X + Math.cos(angle) * (length + 4),
      SHOULDER_Y + Math.sin(angle) * (length + 4),
      9,
      0,
    );
  }
}

/** One arm: a sleeve and a hand, or a twig for the snowman. */
function limb(
  ctx: CanvasRenderingContext2D,
  character: CharacterId,
  palette: Palette,
  x: number,
  y: number,
  angle: number,
  length: number,
): void {
  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;
  ctx.lineCap = "round";
  ctx.strokeStyle = palette.sleeve;
  ctx.lineWidth = character === "schneemann" ? 3 : 9;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  if (character === "schneemann") {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX + Math.cos(angle + 0.6) * 7,
      endY + Math.sin(angle + 0.6) * 7,
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX + Math.cos(angle - 0.6) * 7,
      endY + Math.sin(angle - 0.6) * 7,
    );
    ctx.stroke();
  } else {
    ctx.fillStyle = character === "ritter" ? "#8f99a6" : palette.skin;
    dot(ctx, endX, endY, 5.5);
  }
}

/** The head with its face and headgear. */
function drawHead(
  ctx: CanvasRenderingContext2D,
  character: CharacterId,
  palette: Palette,
  pose: Pose,
  clock: number,
): void {
  const cy = -(BODY_HEIGHT + HEAD_RADIUS * 0.85);
  const r = HEAD_RADIUS;
  switch (character) {
    case "schneemann":
      snowBall(ctx, 0, cy, r);
      face(ctx, 2, cy, pose, clock, "#222");
      ctx.fillStyle = "#f08a24";
      triangle(ctx, 6, cy + 1, 22, cy + 4, 6, cy + 6);
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(-r, cy - r + 2, r * 2, 4);
      ctx.fillRect(-r * 0.65, cy - r - 20, r * 1.3, 22);
      ctx.fillStyle = "#c8342d";
      ctx.fillRect(-r * 0.65, cy - r - 4, r * 1.3, 4);
      break;
    case "roboter":
      ctx.fillStyle = palette.skin;
      roundRect(ctx, -r, cy - r + 2, r * 2, r * 2 - 2, 6);
      ctx.strokeStyle = "#3e454d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, cy - r + 2);
      ctx.lineTo(0, cy - r - 12);
      ctx.stroke();
      ctx.fillStyle = Math.sin(clock * 4) > 0 ? "#ef4444" : "#fca5a5";
      dot(ctx, 0, cy - r - 13, 4);
      ctx.fillStyle = "#1f2937";
      roundRect(ctx, -r + 4, cy - 8, r * 2 - 8, 12, 4);
      robotEyes(ctx, cy, pose);
      ctx.fillStyle = "#3e454d";
      ctx.fillRect(-8, cy + 9, 16, 3);
      break;
    case "dino":
      ctx.fillStyle = palette.skin;
      roundRect(ctx, -r + 2, cy - r + 4, r * 2 + 6, r * 2 - 6, 14);
      roundRect(ctx, 4, cy - 2, r + 10, r - 2, 8);
      ctx.fillStyle = "#3f7d2e";
      dot(ctx, r + 8, cy + 2, 1.6);
      triangle(ctx, -r + 2, cy - 8, -r - 6, cy - 4, -r + 4, cy);
      face(ctx, 0, cy - 4, pose, clock, "#1f2937");
      break;
    case "ritter":
      ctx.fillStyle = "#a5aeb8";
      ctx.beginPath();
      ctx.arc(0, cy, r + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#5f6872";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#1f2937";
      roundRect(ctx, -2, cy - 6, r + 2, 6, 2);
      ctx.fillStyle = "#c8342d";
      ctx.beginPath();
      ctx.ellipse(-6, cy - r - 6, 7, 12, -0.5, 0, Math.PI * 2);
      ctx.fill();
      if (pose.kind === "ko") {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("x x", 2, cy - 1);
      }
      break;
    default:
      ctx.fillStyle = palette.skin;
      ctx.beginPath();
      ctx.arc(0, cy, r, 0, Math.PI * 2);
      ctx.fill();
      face(ctx, 2, cy, pose, clock, "#1f2937");
      drawHeadgear(ctx, character, cy, r);
  }
}

/** Hats, hair and beards. */
function drawHeadgear(
  ctx: CanvasRenderingContext2D,
  character: CharacterId,
  cy: number,
  r: number,
): void {
  switch (character) {
    case "koch":
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-r * 0.75, cy - r - 18, r * 1.5, 22);
      for (const x of [-9, 0, 9]) {
        dot(ctx, x, cy - r - 20, 10);
      }
      ctx.fillStyle = "#5a3a1e";
      ctx.beginPath();
      ctx.ellipse(10, cy + 7, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "gaertnerin":
      ctx.fillStyle = "#b45309";
      ctx.beginPath();
      ctx.arc(-r * 0.6, cy + 4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e8c66a";
      ctx.beginPath();
      ctx.ellipse(0, cy - r + 4, r + 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      roundRect(ctx, -r * 0.7, cy - r - 10, r * 1.4, 14, 6);
      ctx.fillStyle = "#4f9a3a";
      ctx.fillRect(-r * 0.7, cy - r - 1, r * 1.4, 4);
      break;
    case "pirat":
      ctx.fillStyle = "#1f2937";
      ctx.beginPath();
      ctx.moveTo(-r - 10, cy - r + 6);
      ctx.quadraticCurveTo(0, cy - r - 26, r + 10, cy - r + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      dot(ctx, 0, cy - r - 4, 3);
      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r, cy - 8);
      ctx.lineTo(r, cy + 2);
      ctx.stroke();
      ctx.fillStyle = "#1f2937";
      dot(ctx, 8, cy - 2, 5);
      ctx.fillStyle = "#3a2414";
      ctx.beginPath();
      ctx.arc(2, cy + 10, 10, 0, Math.PI);
      ctx.fill();
      break;
    case "baeckerin":
      ctx.fillStyle = "#fffaf5";
      ctx.beginPath();
      ctx.ellipse(-2, cy - r + 2, r + 6, 9, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f9a8b8";
      dot(ctx, 9, cy + 6, 4);
      break;
    default:
      break;
  }
}

/** Eyes and mouth, which change with the pose. */
function face(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  pose: Pose,
  clock: number,
  ink: string,
): void {
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  const eyes = [x + 2, x + 11];
  if (pose.kind === "ko") {
    for (const ex of eyes) {
      ctx.beginPath();
      ctx.moveTo(ex - 3, cy - 7);
      ctx.lineTo(ex + 3, cy - 1);
      ctx.moveTo(ex + 3, cy - 7);
      ctx.lineTo(ex - 3, cy - 1);
      ctx.stroke();
    }
  } else if (pose.kind === "hit") {
    for (const ex of eyes) {
      ctx.beginPath();
      ctx.moveTo(ex - 3, cy - 6);
      ctx.lineTo(ex + 2, cy - 4);
      ctx.lineTo(ex - 3, cy - 2);
      ctx.stroke();
    }
  } else if (pose.kind === "win") {
    for (const ex of eyes) {
      ctx.beginPath();
      ctx.arc(ex, cy - 3, 3, Math.PI, 0);
      ctx.stroke();
    }
  } else {
    const blink = clock % 4 < 0.12;
    for (const ex of eyes) {
      if (blink) {
        ctx.fillRect(ex - 2.5, cy - 4, 5, 1.5);
      } else {
        dot(ctx, ex + 1, cy - 4, 2.3);
      }
    }
  }
  ctx.beginPath();
  if (pose.kind === "hit" || pose.kind === "ko") {
    ctx.ellipse(x + 8, cy + 7, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (pose.kind === "win") {
    ctx.arc(x + 7, cy + 4, 6, 0, Math.PI);
    ctx.fill();
  } else {
    ctx.arc(x + 7, cy + 3, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
}

/** The robot's display eyes. */
function robotEyes(
  ctx: CanvasRenderingContext2D,
  cy: number,
  pose: Pose,
): void {
  ctx.fillStyle =
    pose.kind === "hit" || pose.kind === "ko" ? "#ef4444" : "#22d3ee";
  if (pose.kind === "ko") {
    ctx.font = "bold 10px monospace";
    ctx.fillText("X  X", -11, cy + 2);
  } else if (pose.kind === "win") {
    ctx.fillText("^  ^", -11, cy + 2);
  } else {
    ctx.fillRect(-8, cy - 5, 6, 6);
    ctx.fillRect(4, cy - 5, 6, 6);
  }
}

/** Splashes that stuck. */
function drawStains(
  ctx: CanvasRenderingContext2D,
  stains: readonly Stain[],
  onHead: boolean,
): void {
  for (const stain of stains) {
    if (stain.onHead === onHead) {
      const cx = onHead ? 6 + stain.offset * 8 : stain.offset * 12;
      const cy = onHead
        ? -(BODY_HEIGHT + HEAD_RADIUS * 0.85) + stain.offset * 5
        : -BODY_HEIGHT + 26 + stain.offset * 8;
      ctx.fillStyle = stain.color;
      blob(ctx, cx, cy, onHead ? 10 : 9, stain.offset);
      ctx.fillStyle = "#ffffff66";
      dot(ctx, cx - 3, cy - 3, 2);
    }
  }
}

/** Little stars circling a knocked-out head. */
function drawDizzy(ctx: CanvasRenderingContext2D, t: number): void {
  const cy = -(BODY_HEIGHT + HEAD_RADIUS * 0.85);
  for (let i = 0; i < 3; i++) {
    const a = t * 4 + (i / 3) * Math.PI * 2;
    ctx.fillStyle = "#facc15";
    star(ctx, Math.cos(a) * 24, cy - 26 + Math.sin(a) * 7, 5);
  }
}

/** A wobbly round splash. */
function blob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  seed: number,
): void {
  ctx.beginPath();
  const corners = 9;
  for (let i = 0; i <= corners; i++) {
    const a = (i / corners) * Math.PI * 2;
    const reach = r * (0.75 + 0.3 * Math.abs(Math.sin(i * 2.3 + seed * 5)));
    ctx.lineTo(x + Math.cos(a) * reach, y + Math.sin(a) * reach);
  }
  ctx.closePath();
  ctx.fill();
}

/** A five-pointed star. */
function star(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const reach = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * reach, y + Math.sin(a) * reach);
  }
  ctx.closePath();
  ctx.fill();
}

/** A snowball body part. */
function snowBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
): void {
  const gradient = ctx.createRadialGradient(
    x - r * 0.4,
    y - r * 0.4,
    r * 0.2,
    x,
    y,
    r,
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "#c9d8ea");
  ctx.fillStyle = gradient;
  dot(ctx, x, y, r);
}

/** A filled rounded rectangle. */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** A filled triangle. */
function triangle(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): void {
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();
}

/** A filled circle. */
function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Starts fast and settles. */
function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
