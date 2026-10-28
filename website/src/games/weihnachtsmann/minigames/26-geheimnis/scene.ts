/**
 * Drawing Türchen 26: the dark workshop with its lights and cones, the
 * guards and Gilfi, the keys, the HUD and the secret behind the golden door.
 *
 * @module
 */
import {
  drawFigure,
  drawGlow,
  drawHud,
  drawPanel,
  drawSprite,
  drawSpriteCentred,
  wrapText,
  type FigurePose,
} from "../kit/draw";
import type { Effects } from "../kit/effects";
import type { Facing } from "@/games/weihnachtsmann/components/sprite-atlas";
import { MINI_H, MINI_W, type MiniDraw } from "../types";
import { ROWS, TILE, rayLength, type GuardSpec } from "./level";
import { SPRITES, type SpriteName } from "./sprites";

/** What the run is doing. */
export type Phase = "intro" | "play" | "caught" | "secret";

/** Anything that looks with a cone of light. */
export type Watcher = {
  x: number;
  y: number;
  /** Where the light points, radians. */
  angle: number;
  readonly range: number;
  readonly half: number;
  /** The warning, 0 to 1; at 1 Gilfi is caught. */
  alert: number;
};

/** A guard on its round. */
export type Guard = Watcher & {
  readonly spec: GuardSpec;
  /** Which corner of the round it walks to. */
  leg: number;
  /** Where it faces, before looking round, radians. */
  facing: number;
  /** How far it looks off to the side right now, radians. */
  look: number;
  /** Seconds left looking round at a corner. */
  pause: number;
  /** Seconds left staring at a creak, and where it came from. */
  heard: number;
  heardAt: { readonly x: number; readonly y: number } | null;
  stride: number;
};

/** Gilfi. */
export type Player = {
  x: number;
  y: number;
  stride: number;
  facing: Facing;
  mirror: boolean;
  moving: boolean;
  sneaking: boolean;
  hidden: boolean;
};

/** Everything the picture shows. */
export type RunView = {
  readonly player: Player;
  readonly guards: readonly Guard[];
  readonly lantern: Watcher;
  readonly keys: readonly {
    readonly x: number;
    readonly y: number;
    readonly taken: boolean;
  }[];
  readonly piles: readonly { readonly x: number; readonly y: number }[];
  readonly noises: readonly {
    readonly x: number;
    readonly y: number;
    readonly age: number;
  }[];
  readonly camera: { readonly x: number; readonly y: number };
  readonly phase: Phase;
  readonly phaseTime: number;
  readonly keysTaken: number;
  readonly keysTotal: number;
  readonly left: number;
  readonly lives: number;
  readonly maxLives: number;
  readonly secretLength: number;
};

/** Rays per cone of light. */
const RAYS = 18;

/** Seconds the door takes to swing open before the secret room shows. */
const DOOR_OPENS = 1.2;

/** Seconds the secret room takes to fade in. */
const ROOM_FADE = 0.8;

/** Tiles drawn across and down (one more than fits, for the edges). */
const TILES_ACROSS = MINI_W / TILE + 2;
const TILES_DOWN = Math.ceil(MINI_H / TILE) + 2;

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout,
   colours, light sizes and timings, picked by eye */
/**
 * Draws the whole run: the workshop or, at the end, the secret room; the
 * effects; the HUD.
 *
 * @param g - what to draw with
 * @param sheet - the minigame's sheet
 * @param effects - sparks and floating texts of the run
 * @param v - what to show
 */
export function drawRun(
  g: MiniDraw,
  sheet: HTMLImageElement,
  effects: Effects,
  v: RunView,
): void {
  const ctx = g.ctx;
  const showRoom = v.phase === "secret" && v.phaseTime >= DOOR_OPENS;
  if (!showRoom || v.phaseTime < DOOR_OPENS + ROOM_FADE) {
    const shake = effects.offset();
    ctx.save();
    ctx.translate(
      Math.round((shake.x - v.camera.x) * 2) / 2,
      Math.round((shake.y - v.camera.y) * 2) / 2,
    );
    drawWorld(g, sheet, v);
    ctx.restore();
    drawMarks(g, v);
  }
  if (showRoom) {
    drawSecret(g, sheet, v);
  }
  effects.draw(g);
  if (v.phase !== "secret") {
    drawPointers(g, sheet, v);
    drawHud(g, {
      score: v.keysTaken,
      goal: v.keysTotal,
      scoreLabel: "Schlüssel",
      time: v.left,
      lives: v.lives,
      maxLives: v.maxLives,
    });
  }
  if (v.phase === "intro") {
    drawPanel(ctx, { x: 40, y: 146, w: 240, h: 26 });
    const text =
      "Hol die drei goldenen Schlüssel und schleich dann zur goldenen Tür!";
    wrapText(text, 228, 7).forEach((line, k) => {
      g.text(line, MINI_W / 2, 154 + k * 9, {
        size: 7,
        bold: true,
        align: "center",
        baseline: "middle",
        color: "#ffe9a8",
      });
    });
  }
  if (v.phase === "caught") {
    ctx.fillStyle = `rgba(200, 30, 40, ${String(Math.max(0, 0.35 - v.phaseTime * 0.3))})`;
    ctx.fillRect(0, 0, MINI_W, MINI_H);
  }
}

/** The workshop in world coordinates: tiles, things, people, darkness, lights. */
function drawWorld(g: MiniDraw, sheet: HTMLImageElement, v: RunView): void {
  const ctx = g.ctx;
  const tx0 = Math.max(0, Math.floor(v.camera.x / TILE));
  const ty0 = Math.max(0, Math.floor(v.camera.y / TILE));
  for (let ty = ty0; ty < Math.min(ROWS.length, ty0 + TILES_DOWN); ty += 1) {
    for (
      let tx = tx0;
      tx < Math.min(ROWS[0].length, tx0 + TILES_ACROSS);
      tx += 1
    ) {
      drawSprite(ctx, sheet, SPRITES[tileSprite(tx, ty)], tx * TILE, ty * TILE);
    }
  }
  const opening = v.phase === "secret";
  if (opening) {
    drawGlow(
      ctx,
      18 * TILE,
      TILE * 1.4,
      40 + v.phaseTime * 60,
      "255, 236, 160",
      0.8,
    );
  }
  drawSprite(
    ctx,
    sheet,
    opening ? SPRITES.doorOpen : SPRITES.doorShut,
    17 * TILE,
    0,
  );
  // Things that stand, sorted by where their feet are.
  const standing: { y: number; draw: () => void }[] = [];
  for (const pile of v.piles) {
    standing.push({
      y: pile.y + TILE / 2,
      draw: () => {
        drawSprite(
          ctx,
          sheet,
          SPRITES.giftPile,
          pile.x - TILE / 2,
          pile.y + TILE / 2 - 20,
        );
      },
    });
  }
  standing.push({
    y: v.lantern.y + TILE / 2,
    draw: () => {
      drawSprite(
        ctx,
        sheet,
        SPRITES.lanternPost,
        v.lantern.x - 8,
        v.lantern.y + TILE / 2 - 24,
      );
    },
  });
  for (const guard of v.guards) {
    standing.push({ y: guard.y, draw: () => drawGuard(g, sheet, guard) });
  }
  standing.push({
    y: v.player.y + (v.player.hidden ? -6 : 0),
    draw: () => drawPlayer(g, v.player),
  });
  standing.sort((a, b) => a.y - b.y);
  for (const thing of standing) {
    thing.draw();
  }
  drawDark(g, v);
  for (const watcher of [...v.guards, v.lantern]) {
    drawCone(ctx, watcher);
  }
  for (const key of v.keys) {
    if (!key.taken) {
      const bob = Math.sin(g.time * 3 + key.x) * 1.5;
      drawGlow(
        ctx,
        key.x,
        key.y + bob,
        14,
        "255, 216, 74",
        0.5 + Math.sin(g.time * 5) * 0.15,
      );
      drawSpriteCentred(ctx, sheet, SPRITES.key, key.x, key.y + bob);
    }
  }
  if (!opening) {
    const allKeys = v.keysTaken >= v.keysTotal;
    drawGlow(
      ctx,
      18 * TILE,
      TILE * 1.4,
      allKeys ? 34 : 24,
      "255, 216, 74",
      allKeys ? 0.5 + Math.sin(g.time * 4) * 0.2 : 0.25,
    );
  }
  for (const noise of v.noises) {
    ctx.strokeStyle = `rgba(255, 176, 122, ${String(1 - noise.age / 0.8)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(noise.x, noise.y - 4, 6 + noise.age * 60, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Which picture a tile gets: walls show their face where floor lies in front. */
function tileSprite(tx: number, ty: number): SpriteName {
  const tile = ROWS[ty][tx];
  const below = ROWS[ty + 1]?.[tx] ?? "#";
  const hash = (tx * 7 + ty * 13) % 3;
  let sprite: SpriteName;
  switch (tile) {
    case "#":
    case "D":
      sprite =
        below === "#" || below === "D"
          ? "wallTop"
          : (["wallFace0", "wallFace1", "wallFace2"] as const)[
              (tx * 5 + ty) % 7 === 0 ? 1 : (tx * 3) % 11 === 0 ? 2 : 0
            ];
      break;
    case "B":
      sprite = (["bench0", "bench1", "bench2"] as const)[hash];
      break;
    case "S":
      sprite = "shelf";
      break;
    case "C":
      sprite = "crate";
      break;
    case "n":
      sprite = "creak";
      break;
    case "r": {
      const above = ROWS[ty - 1][tx];
      sprite = above !== "r" || below !== "r" ? "rugEdge" : "rug";
      break;
    }
    default:
      sprite = (["floor0", "floor1", "floor2"] as const)[hash];
  }
  return sprite;
}

/** A guard walking its round, the lantern in the hand. */
function drawGuard(g: MiniDraw, sheet: HTMLImageElement, guard: Guard): void {
  const ctx = g.ctx;
  const dx = Math.cos(guard.facing);
  const dy = Math.sin(guard.facing);
  let facing: Facing = dy < 0 ? "up" : "down";
  if (Math.abs(dx) > Math.abs(dy)) {
    facing = "side";
  }
  const walking = guard.pause <= 0 && guard.heard <= 0;
  const pose: FigurePose = walking ? "walk" : "idle";
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y - 1, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const lantern = () => {
    if (guard.spec.lantern) {
      drawGlow(
        ctx,
        guard.x + dx * 8,
        guard.y - 10 + dy * 4,
        14,
        "255, 220, 120",
        0.5,
      );
      drawSpriteCentred(
        ctx,
        sheet,
        SPRITES.handLantern,
        guard.x + dx * 8,
        guard.y - 10 + dy * 4,
      );
    }
  };
  if (facing === "up") {
    lantern();
  }
  drawFigure(
    ctx,
    g.art,
    guard.spec.who,
    guard.x,
    guard.y,
    pose,
    facing,
    walking ? guard.stride : g.time * 2,
    dx < 0,
  );
  if (facing !== "up") {
    lantern();
  }
}

/** Gilfi: see-through while hiding in a pile of presents. */
function drawPlayer(g: MiniDraw, p: Player): void {
  const ctx = g.ctx;
  ctx.globalAlpha = p.hidden ? 0.45 : 1;
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 1, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  drawFigure(
    ctx,
    g.art,
    "gilfi",
    p.x,
    p.y,
    p.moving ? "walk" : "idle",
    p.facing,
    p.moving ? p.stride : g.time * 2,
    p.mirror,
  );
  ctx.globalAlpha = 1;
}

/** Night: everything dark but round the lights; two layers for a soft edge. */
function drawDark(g: MiniDraw, v: RunView): void {
  const ctx = g.ctx;
  const lights: { x: number; y: number; r: number }[] = [
    { x: v.player.x, y: v.player.y - 8, r: 38 },
    { x: v.lantern.x, y: v.lantern.y, r: 20 },
    { x: 18 * TILE, y: TILE * 1.6, r: 24 },
  ];
  for (const guard of v.guards) {
    if (guard.spec.lantern) {
      lights.push({ x: guard.x, y: guard.y - 8, r: 26 });
    }
  }
  for (const [alpha, grow] of [
    [0.42, 1],
    [0.3, 0.7],
  ] as const) {
    ctx.fillStyle = `rgba(6, 8, 30, ${String(alpha)})`;
    ctx.beginPath();
    ctx.rect(v.camera.x - 4, v.camera.y - 4, MINI_W + 8, MINI_H + 8);
    for (const light of lights) {
      ctx.moveTo(light.x + light.r * grow, light.y);
      ctx.arc(light.x, light.y, light.r * grow, 0, Math.PI * 2);
    }
    ctx.fill("evenodd");
  }
}

/** A cone of light, stopped by walls and furniture; redder as the warning fills. */
function drawCone(ctx: CanvasRenderingContext2D, w: Watcher): void {
  const red = Math.round(255);
  const green = Math.round(220 - w.alert * 170);
  const blue = Math.round(120 - w.alert * 80);
  ctx.fillStyle = `rgba(${String(red)}, ${String(green)}, ${String(blue)}, ${String(0.2 + w.alert * 0.2)})`;
  ctx.beginPath();
  ctx.moveTo(w.x, w.y);
  for (let k = 0; k <= RAYS; k += 1) {
    const angle = w.angle - w.half + (2 * w.half * k) / RAYS;
    const d = rayLength(w.x, w.y, angle, w.range);
    ctx.lineTo(w.x + Math.cos(angle) * d, w.y + Math.sin(angle) * d);
  }
  ctx.closePath();
  ctx.fill();
}

/** Question and exclamation marks over watchers whose warning is filling, and "versteckt". */
function drawMarks(g: MiniDraw, v: RunView): void {
  const marks = [...v.guards, v.lantern];
  for (const w of marks) {
    if (w.alert > 0) {
      const lift = w === v.lantern ? 22 : 34;
      g.text(
        w.alert >= 1 ? "!" : "?",
        w.x - v.camera.x,
        w.y - v.camera.y - lift,
        {
          size: 8 + w.alert * 4,
          bold: true,
          align: "center",
          baseline: "middle",
          color: w.alert > 0.6 ? "#ff6a6a" : "#ffe27a",
          outline: "#2a1430",
        },
      );
    }
  }
  const p = v.player;
  if (p.hidden) {
    g.text("versteckt", p.x - v.camera.x, p.y - v.camera.y - 30, {
      size: 5,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#9ae8a0",
      outline: "#1a2a1a",
    });
  } else if (p.sneaking && p.moving) {
    g.text("schleicht", p.x - v.camera.x, p.y - v.camera.y - 30, {
      size: 5,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#c8d4ff",
      outline: "#1a1a2a",
    });
  }
}

/** Little golden arrows at the edge pointing to keys (or the door) out of sight. */
function drawPointers(g: MiniDraw, sheet: HTMLImageElement, v: RunView): void {
  const ctx = g.ctx;
  const targets =
    v.keysTaken >= v.keysTotal
      ? [{ x: 18 * TILE, y: TILE * 2 }]
      : v.keys.filter((k) => !k.taken);
  for (const t of targets) {
    const sx = t.x - v.camera.x;
    const sy = t.y - v.camera.y;
    const offscreen = sx < 0 || sx > MINI_W || sy < 16 || sy > MINI_H;
    if (offscreen) {
      const cx = Math.max(10, Math.min(MINI_W - 10, sx));
      const cy = Math.max(24, Math.min(MINI_H - 10, sy));
      const angle = Math.atan2(sy - cy, sx - cx);
      const pulse = 1 + Math.sin(g.time * 6) * 0.15;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "#ffd84a";
      ctx.strokeStyle = "#5a3a10";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-3, -4);
      ctx.lineTo(-3, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      if (v.keysTaken < v.keysTotal) {
        drawSpriteCentred(
          ctx,
          sheet,
          SPRITES.key,
          cx - Math.cos(angle) * 9,
          cy - Math.sin(angle) * 9,
          0.7,
        );
      }
    }
  }
}

/** Behind the golden door: the room with the golden book, Santa, and the secret. */
function drawSecret(g: MiniDraw, sheet: HTMLImageElement, v: RunView): void {
  const ctx = g.ctx;
  const t = v.phaseTime - DOOR_OPENS;
  ctx.globalAlpha = Math.min(1, t / ROOM_FADE);
  drawSprite(ctx, sheet, SPRITES.secretRoom, 0, 0);
  drawGlow(ctx, 160, 42, 50 + Math.sin(g.time * 3) * 6, "255, 250, 220", 0.5);
  for (let k = 0; k < 10; k += 1) {
    const a = g.time * 0.6 + (k * Math.PI) / 5;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(
      160 + Math.cos(a) * (36 + (k % 3) * 8),
      42 + Math.sin(a) * (20 + (k % 2) * 6),
      1,
      1,
    );
  }
  const walkIn = Math.min(1, t / 1.5);
  drawFigure(
    ctx,
    g.art,
    "santa",
    112,
    152,
    walkIn < 1 ? "walk" : "idle",
    "down",
    g.time * (walkIn < 1 ? 8 : 2),
  );
  drawFigure(
    ctx,
    g.art,
    "gilfi",
    70 + walkIn * 140,
    156,
    walkIn < 1 ? "walk" : "idle",
    walkIn < 1 ? "side" : "down",
    g.time * 8,
  );
  ctx.globalAlpha = 1;
  const lines = [
    {
      at: 0.6,
      y: 12,
      text: "Das Geheimnis des Weihnachtsmanns:",
      size: 8,
      color: "#7a2a10",
    },
    {
      at: 1.5,
      y: 23,
      text: "Im goldenen Buch steht jeder Wunsch der Welt -",
      size: 7,
      color: "#5a2a10",
    },
    {
      at: 2.4,
      y: 33,
      text: "und jede Freude, die man schenkt, kommt doppelt zurück.",
      size: 7,
      color: "#5a2a10",
    },
    { at: 3.4, y: 170, text: "Frohe Weihnachten!", size: 10, color: "#c8283a" },
  ];
  lines.forEach((line) => {
    if (t >= line.at) {
      g.text(line.text, MINI_W / 2, line.y, {
        size: line.size,
        bold: true,
        align: "center",
        baseline: "middle",
        color: line.color,
        outline: "#fff4d0",
        alpha: Math.min(1, (t - line.at) * 2),
      });
    }
  });
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
