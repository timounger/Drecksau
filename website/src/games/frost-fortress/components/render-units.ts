/**
 * Everything that moves: the six enemy types, the barracks' soldiers, shells
 * in flight and the loot on the snow.
 *
 * @module
 * @remarks
 * Figures are small top-down sprites drawn from shapes, turned to where they
 * walk or aim. Zoomed far out they shrink to a coloured dot - nobody can see a
 * rifle at that size, and two hundred of them still draw quickly.
 */
import { ENEMIES } from "@/games/frost-fortress/engine/enemies";
import type {
  Defender,
  Drop,
  Enemy,
  Projectile,
} from "@/games/frost-fortress/engine/types";
import { bar } from "./render-structures";

/** Below this zoom figures are drawn as dots. */
const DOT_ZOOM = 0.45;

/** Dot colour per enemy type. */
const DOT_COLORS: Readonly<Record<Enemy["kind"], string>> = {
  raider: "#a16207",
  soldier: "#b91c1c",
  heavy: "#3f3f46",
  demolisher: "#ea580c",
  siege: "#7f1d1d",
  boss: "#0ea5e9",
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- the drawings:
   proportions and colours of every figure */

/**
 * Paints one enemy (world transform set).
 *
 * @param ctx - the canvas
 * @param enemy - the enemy
 * @param zoom - the camera zoom
 * @param clock - real seconds, for animation
 */
export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  zoom: number,
  clock: number,
): void {
  const radius = ENEMIES[enemy.kind].radius;
  if (zoom < DOT_ZOOM && enemy.kind !== "boss" && enemy.kind !== "siege") {
    ctx.fillStyle = DOT_COLORS[enemy.kind];
    ctx.fillRect(enemy.x - 3, enemy.y - 3, 6, 6);
  } else {
    ctx.fillStyle = "rgba(30,45,70,0.25)";
    ctx.beginPath();
    ctx.ellipse(
      enemy.x + 3,
      enemy.y + 4,
      radius,
      radius * 0.6,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);
    const step = Math.sin(enemy.stride) * 0.5;
    switch (enemy.kind) {
      case "raider":
        raider(ctx, step);
        break;
      case "soldier":
        soldier(ctx, step, "#7f1d1d", "#991b1b");
        break;
      case "heavy":
        heavy(ctx, step);
        break;
      case "demolisher":
        demolisher(ctx, step, clock);
        break;
      case "siege":
        siege(ctx, enemy.cooldown);
        break;
      case "boss":
        boss(ctx, step, clock);
        break;
    }
    ctx.restore();
    if (enemy.hitAgo < 0.08) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    if (enemy.slow > 0) {
      ctx.strokeStyle = "rgba(147,197,253,0.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, radius + 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (enemy.stun > 0) {
      ctx.strokeStyle = "rgba(186,230,253,0.95)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let index = 0; index < 4; index += 1) {
        const angle = clock * 20 + index * 1.6;
        ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(
          enemy.x + Math.cos(angle) * (radius + 4),
          enemy.y + Math.sin(angle) * (radius + 4),
        );
      }
      ctx.stroke();
    }
    if (enemy.burn > 0) {
      ctx.fillStyle =
        Math.random() > 0.5 ? "rgba(251,146,60,0.85)" : "rgba(253,224,71,0.85)";
      ctx.beginPath();
      ctx.arc(
        enemy.x + (Math.random() - 0.5) * radius,
        enemy.y - radius * 0.5,
        2 + Math.random() * 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  if (enemy.hp < enemy.maxHp) {
    const width = Math.max(14, radius * 2);
    bar(
      ctx,
      enemy.x - width / 2,
      enemy.y - radius - 7,
      width,
      enemy.hp / enemy.maxHp,
      enemy.kind === "boss" ? "#a855f7" : "#ef4444",
    );
  }
}

/**
 * Paints one of the barracks' soldiers.
 *
 * @param ctx - the canvas
 * @param unit - the soldier
 * @param share - share of hit points left
 * @param zoom - the camera zoom
 */
export function drawDefender(
  ctx: CanvasRenderingContext2D,
  unit: Defender,
  share: number,
  zoom: number,
): void {
  if (zoom < DOT_ZOOM) {
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(unit.x - 3, unit.y - 3, 6, 6);
  } else {
    ctx.fillStyle = "rgba(30,45,70,0.25)";
    ctx.beginPath();
    ctx.ellipse(unit.x + 3, unit.y + 4, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(unit.x, unit.y);
    ctx.rotate(unit.angle);
    soldier(ctx, Math.sin(unit.stride) * 0.5, "#1d4ed8", "#1e3a8a");
    ctx.restore();
  }
  if (share < 1) {
    bar(ctx, unit.x - 8, unit.y - 14, 16, share, "#22c55e");
  }
}

/**
 * Paints a shell in flight, high in the middle of its arc.
 *
 * @param ctx - the canvas
 * @param shell - the shell
 */
export function drawProjectile(
  ctx: CanvasRenderingContext2D,
  shell: Projectile,
): void {
  const length = Math.hypot(shell.toX - shell.fromX, shell.toY - shell.fromY);
  const lift = Math.sin(shell.t * Math.PI) * Math.min(80, length * 0.3);
  const size =
    shell.kind === "shell" ? 3.5 : shell.kind === "bossRock" ? 6 : 4.5;
  ctx.fillStyle = "rgba(30,45,70,0.3)";
  ctx.beginPath();
  ctx.ellipse(shell.x, shell.y, size, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shell.kind === "bossRock" ? "#bae6fd" : "#1f2937";
  ctx.beginPath();
  ctx.arc(shell.x, shell.y - lift, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shell.hostile
    ? "rgba(248,113,113,0.8)"
    : "rgba(253,224,71,0.8)";
  ctx.beginPath();
  ctx.arc(shell.x - 1, shell.y - lift - 1, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Paints loot or a supply crate.
 *
 * @param ctx - the canvas
 * @param drop - the drop
 * @param clock - real seconds, for the bobbing
 */
export function drawDrop(
  ctx: CanvasRenderingContext2D,
  drop: Drop,
  clock: number,
): void {
  const bob = Math.sin(clock * 3 + drop.id) * 2;
  if (drop.crate) {
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(drop.x - 9, drop.y - 22 + bob);
    ctx.lineTo(drop.x, drop.y - 8 + bob);
    ctx.lineTo(drop.x + 9, drop.y - 22 + bob);
    ctx.stroke();
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(drop.x, drop.y - 24 + bob, 10, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#b45309";
    ctx.fillRect(drop.x - 8, drop.y - 8 + bob, 16, 13);
    ctx.strokeStyle = "#78350f";
    ctx.strokeRect(drop.x - 8, drop.y - 8 + bob, 16, 13);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(drop.x - 2, drop.y - 8 + bob, 4, 13);
    const pulse = 0.4 + 0.3 * Math.sin(clock * 5);
    ctx.strokeStyle = `rgba(250,204,21,${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, 18 + pulse * 6, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(30,45,70,0.25)";
    ctx.beginPath();
    ctx.ellipse(drop.x + 2, drop.y + 4, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#92400e";
    ctx.beginPath();
    ctx.arc(drop.x, drop.y + bob * 0.5, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(drop.x - 1, drop.y - 4 + bob * 0.5, 2, 2);
    if (Math.sin(clock * 6 + drop.id) > 0.6) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(drop.x + 3, drop.y - 6 + bob * 0.5, 2, 2);
    }
  }
}

/** A raider in a fur coat with a club. */
function raider(ctx: CanvasRenderingContext2D, step: number): void {
  ctx.fillStyle = "#3f2a1a";
  ctx.fillRect(-4 + step * 4, -5, 5, 3);
  ctx.fillRect(-4 - step * 4, 2, 5, 3);
  ctx.fillStyle = "#a16207";
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d6b48a";
  ctx.beginPath();
  ctx.arc(1, 0, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5c3d1e";
  ctx.fillRect(3, 4, 7, 2.2);
}

/** A rifleman; the colours tell friend from foe. */
function soldier(
  ctx: CanvasRenderingContext2D,
  step: number,
  coat: string,
  helmet: string,
): void {
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(-5 + step * 4, -5, 5, 3);
  ctx.fillRect(-5 - step * 4, 2, 5, 3);
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.fillRect(2, 2, 11, 2);
  ctx.fillStyle = helmet;
  ctx.beginPath();
  ctx.arc(0.5, 0, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(-1, -2, 2.5, 1.5);
}

/** A heavy soldier: plates and a big gun. */
function heavy(ctx: CanvasRenderingContext2D, step: number): void {
  ctx.fillStyle = "#18181b";
  ctx.fillRect(-7 + step * 4, -8, 7, 4);
  ctx.fillRect(-7 - step * 4, 4, 7, 4);
  ctx.fillStyle = "#3f3f46";
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#52525b";
  ctx.fillRect(-4, -11, 8, 5);
  ctx.fillRect(-4, 6, 8, 5);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(3, 3, 15, 4);
  ctx.fillStyle = "#7f1d1d";
  ctx.beginPath();
  ctx.arc(1, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fca5a5";
  ctx.fillRect(3, -1.5, 2, 3);
}

/** A sapper with a backpack bomb and a blinking light. */
function demolisher(
  ctx: CanvasRenderingContext2D,
  step: number,
  clock: number,
): void {
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(-5 + step * 4, -5, 5, 3);
  ctx.fillRect(-5 - step * 4, 2, 5, 3);
  ctx.fillStyle = "#ea580c";
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#292524";
  ctx.fillRect(-8, -4, 5, 8);
  ctx.fillStyle = Math.sin(clock * 12) > 0 ? "#ef4444" : "#450a0a";
  ctx.fillRect(-7, -1, 2.5, 2.5);
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(1, 0, 3.4, 0, Math.PI * 2);
  ctx.fill();
}

/** A tracked siege gun. */
function siege(ctx: CanvasRenderingContext2D, cooldown: number): void {
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(-16, -14, 32, 6);
  ctx.fillRect(-16, 8, 32, 6);
  ctx.fillStyle = "#44403c";
  for (let tread = -14; tread < 16; tread += 5) {
    ctx.fillRect(tread, -13, 2, 4);
    ctx.fillRect(tread, 9, 2, 4);
  }
  ctx.fillStyle = "#7f1d1d";
  ctx.fillRect(-14, -9, 28, 18);
  ctx.fillStyle = "rgba(250,252,255,0.75)";
  ctx.fillRect(-14, -9, 28, 3);
  const recoil = cooldown > 3.6 ? 4 : 0;
  ctx.fillStyle = "#0c0a09";
  ctx.fillRect(2 - recoil, -2.5, 26, 5);
  ctx.fillStyle = "#991b1b";
  ctx.beginPath();
  ctx.arc(-2, 0, 7, 0, Math.PI * 2);
  ctx.fill();
}

/** The frost colossus: a walking armoured giant with a glowing core. */
function boss(
  ctx: CanvasRenderingContext2D,
  step: number,
  clock: number,
): void {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-14 + step * 8, -20, 14, 9);
  ctx.fillRect(-14 - step * 8, 11, 14, 9);
  ctx.fillStyle = "#1e3a5f";
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#334155";
  ctx.beginPath();
  ctx.arc(4, -18, 8, 0, Math.PI * 2);
  ctx.arc(4, 18, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#93c5fd";
  ctx.beginPath();
  ctx.moveTo(10, -16);
  ctx.lineTo(22, -12);
  ctx.lineTo(12, -8);
  ctx.closePath();
  ctx.moveTo(10, 16);
  ctx.lineTo(22, 12);
  ctx.lineTo(12, 8);
  ctx.closePath();
  ctx.fill();
  const pulse = 0.6 + 0.4 * Math.sin(clock * 4);
  const core = ctx.createRadialGradient(2, 0, 1, 2, 0, 12);
  core.addColorStop(0, `rgba(224,242,254,${pulse})`);
  core.addColorStop(0.5, `rgba(56,189,248,${pulse * 0.8})`);
  core.addColorStop(1, "rgba(14,165,233,0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(2, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e0f2fe";
  ctx.beginPath();
  ctx.moveTo(-10, -10);
  ctx.lineTo(-6, -18);
  ctx.lineTo(-2, -10);
  ctx.closePath();
  ctx.moveTo(-10, 10);
  ctx.lineTo(-6, 18);
  ctx.lineTo(-2, 10);
  ctx.closePath();
  ctx.fill();
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
