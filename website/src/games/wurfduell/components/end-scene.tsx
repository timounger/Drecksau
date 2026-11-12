/**
 * The last picture of a match: the winner cheering, the loser flat on the
 * ground.
 *
 * @module
 * @remarks
 * Both fighters side by side and large, drawn with the very same functions as
 * on the field. The winner hops with both arms up under a rain of confetti;
 * the loser lies knocked out, covered in whatever was thrown at them, with
 * stars and little birds going round their head.
 */
"use client";

import { useEffect, useRef, type ReactElement } from "react";
import { characterById, ITEMS } from "@/games/wurfduell/engine/characters";
import type { CharacterId } from "@/games/wurfduell/engine/types";
import { drawFighter } from "./draw-fighters";
import { drawItem } from "./draw-items";

/** Props of {@link EndScene}. */
export type EndSceneProps = {
  readonly winner: CharacterId;
  readonly loser: CharacterId;
  /** Whether it ended by a knockout rather than by giving up. */
  readonly knockout: boolean;
};

/** Logical size of the picture. */
const WIDTH = 640;
const HEIGHT = 300;

/** Where the ground is, and how large the fighters are drawn. */
const GROUND = 250;
const SCALE = 1.35;

/** How many pieces of confetti fall. */
const CONFETTI = 46;

/** Sharpest the picture is drawn. */
const MAX_DOTS = 3;

/** Milliseconds in a second. */
const MS_PER_SECOND = 1000;

/** How long after the start the loser has fully fallen, in seconds. */
const FALLEN = 5;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the picture */
/** The confetti colours. */
const COLOURS: readonly string[] = [
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

/**
 * Renders the end scene.
 *
 * @param props - who won and who lost
 * @returns the animated canvas
 */
export function EndScene({
  winner,
  loser,
  knockout,
}: EndSceneProps): ReactElement {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d") ?? null;
    let frame = 0;
    if (canvas !== null && ctx !== null) {
      const dots = Math.min(
        MAX_DOTS,
        Math.max(1, window.devicePixelRatio || 1),
      );
      canvas.width = WIDTH * dots;
      canvas.height = HEIGHT * dots;
      const origin = performance.now();
      const tick = (time: number) => {
        const t = (time - origin) / MS_PER_SECOND;
        ctx.setTransform(dots, 0, 0, dots, 0, 0);
        paint(ctx, t, winner, loser, knockout);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(frame);
  }, [winner, loser, knockout]);

  return (
    <canvas
      ref={ref}
      width={WIDTH}
      height={HEIGHT}
      data-testid="wd-end-scene"
      aria-hidden="true"
      className="block w-full rounded-xl"
    />
  );
}

/** One frame of the scene. */
function paint(
  ctx: CanvasRenderingContext2D,
  t: number,
  winner: CharacterId,
  loser: CharacterId,
  knockout: boolean,
): void {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#fde68a");
  sky.addColorStop(1, "#fff7ed");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  // Rays behind the winner.
  ctx.save();
  ctx.translate(190, 150);
  ctx.rotate(t * 0.2);
  ctx.fillStyle = "#fcd34d66";
  for (let i = 0; i < 12; i++) {
    ctx.rotate((Math.PI * 2) / 12);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(400, -40);
    ctx.lineTo(400, 40);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = "#86c35a";
  ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
  ctx.fillStyle = "#5f9a3d";
  ctx.fillRect(0, GROUND, WIDTH, 4);

  const thrown = characterById(winner).item;
  const splash = ITEMS[thrown].color;

  // The loser, flat on the ground, pelted.
  ctx.save();
  ctx.translate(380, GROUND);
  ctx.scale(SCALE, SCALE);
  drawFighter(ctx, {
    character: loser,
    x: 0,
    y: 0,
    facing: -1,
    size: characterById(loser).size,
    pose: knockout
      ? { kind: "ko", t: FALLEN + t, angle: 0 }
      : { kind: "hit", t: 0.1, angle: 0 },
    clock: t,
    held: null,
    stains: [
      { color: splash, onHead: true, offset: 0.2 },
      { color: splash, onHead: false, offset: -0.4 },
      { color: splash, onHead: false, offset: 0.6 },
    ],
  });
  ctx.restore();
  for (const [dx, dy, r, turn] of [
    [-30, -2, 11, 0.4],
    [60, -30, 10, 2.1],
    [175, -2, 9, 4],
  ]) {
    drawItem(ctx, thrown, 380 + dx, GROUND + dy - r, r, turn);
  }
  drawBirds(ctx, 380 + 120, GROUND - 48, t);

  // The winner, hopping with both arms up.
  ctx.save();
  ctx.translate(190, GROUND);
  ctx.scale(SCALE, SCALE);
  drawFighter(ctx, {
    character: winner,
    x: 0,
    y: 0,
    facing: 1,
    size: characterById(winner).size,
    pose: { kind: "win", t, angle: 0 },
    clock: t,
    held: null,
    stains: [],
  });
  ctx.restore();

  drawConfetti(ctx, t);
}

/** Little birds circling a dazed head. */
function drawBirds(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
): void {
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const a = t * 2.2 + (i / 3) * Math.PI * 2;
    const bx = x + Math.cos(a) * 34;
    const by = y + Math.sin(a) * 10;
    const flap = Math.sin(t * 14 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(bx - 7, by - 2 - flap);
    ctx.quadraticCurveTo(bx - 3, by - 5, bx, by);
    ctx.quadraticCurveTo(bx + 3, by - 5, bx + 7, by - 2 - flap);
    ctx.stroke();
  }
}

/** Confetti raining over the whole picture. */
function drawConfetti(ctx: CanvasRenderingContext2D, t: number): void {
  for (let i = 0; i < CONFETTI; i++) {
    const speed = 50 + ((i * 37) % 60);
    const x = ((i * 97) % WIDTH) + Math.sin(t * 2 + i) * 14;
    const y =
      ((((t * speed + i * 53) % (HEIGHT + 40)) + HEIGHT + 40) % (HEIGHT + 40)) -
      20;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 3 + i);
    ctx.fillStyle = COLOURS[i % COLOURS.length];
    ctx.fillRect(-4, -2, 8, 4);
    ctx.restore();
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
