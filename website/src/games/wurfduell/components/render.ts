/**
 * Painting one frame of the duel: sky, ground, both fighters, the thing in
 * the air, the aiming help, the mess and the life bars - through a camera.
 *
 * @module
 * @remarks
 * Stateless: everything that moves is handed in as a {@link Scene}, worked
 * out by the view hook, including where the camera is. The field is much wider
 * than the picture, so the world is drawn in a layer that the camera shifts,
 * lifts and zooms; sky, hills and clouds sit behind it with a little parallax,
 * and the life bars, the wind and the arrows towards fighters out of sight sit
 * on top, fixed to the screen.
 *
 * Inside the world layer a point at height `y` is drawn at `GROUND_Y - y`, so
 * the engine's "up is positive" turns into the canvas's "down is positive" in
 * one place.
 */
import {
  FIGHTER_X,
  HAND_AHEAD,
  HAND_HEIGHT,
  UNITS_PER_METRE,
  WIND_MAX_STEPS,
  facing,
} from "@/games/wurfduell/engine/arena";
import { characterById } from "@/games/wurfduell/engine/characters";
import type { Flight } from "@/games/wurfduell/engine/physics";
import { STEPS_PER_SECOND } from "@/games/wurfduell/engine/physics";
import type {
  DuelGame,
  ItemId,
  Statuses,
} from "@/games/wurfduell/engine/types";
import { drawFighter, type Pose, type Stain } from "./draw-fighters";
import { drawItem } from "./draw-items";
import { drawDecals, drawEffects, type Effects } from "./effects";

/** How wide the picture is, in canvas units. */
export const VIEW_WIDTH = 1000;

/** How tall the picture is on a wide screen and on an upright phone. */
export const VIEW_HEIGHT_WIDE = 600;
export const VIEW_HEIGHT_TALL = 900;

/** The ground line inside the world layer. */
export const GROUND_Y = 520;

/** How far above the picture's bottom edge the ground lies, unzoomed. */
const GROUND_MARGIN = 80;

/** Where the camera stands and how far it is zoomed. */
export type Camera = {
  /** The world x in the middle of the picture. */
  readonly x: number;
  /** How far the picture is raised to keep a high throw in sight. */
  readonly lift: number;
  /** 1 is close up; less shows more of the field. */
  readonly zoom: number;
};

/** One fighter as the frame shows it. */
export type SceneFighter = {
  readonly pose: Pose;
  readonly stains: readonly Stain[];
  /** Life points shown - lags behind the match while a throw is in the air. */
  readonly hp: number;
  /** Where the white trail behind the bar has got to. */
  readonly trail: number;
};

/** What the aiming help looks like. */
export type SceneAim = {
  readonly seat: number;
  /** The aimed angle, in degrees. */
  readonly angle: number;
  /** The start of the arc, as world x, y pairs; empty when none is shown. */
  readonly points: readonly number[];
  /** The strength while charging, or null before the press. */
  readonly power: number | null;
};

/** Everything one frame needs. */
export type Scene = {
  readonly game: DuelGame;
  /** Seconds since the view started. */
  readonly clock: number;
  readonly camera: Camera;
  /** The picture's height in canvas units (wide or upright). */
  readonly viewHeight: number;
  readonly fighters: readonly SceneFighter[];
  /** The flight in the air and how far along it is, in steps. */
  readonly flight: { readonly flight: Flight; readonly step: number } | null;
  readonly aim: SceneAim | null;
  /** What the aiming fighter holds. */
  readonly held: ItemId | null;
  /** The wind shown, in steps. */
  readonly wind: number;
  /** Whether the wind gauge is hidden (a flour cloud in the eyes). */
  readonly windHidden: boolean;
  /** Whose turn is marked with the arrow, if anybody's. */
  readonly marked: number | null;
  readonly effects: Effects;
  /** The fighters' names. */
  readonly names: readonly string[];
  /** How much larger the bars and names are drawn on a small screen. */
  readonly hudScale: number;
};

/** The most the wind gauge grows, so it never meets the life bars. */
const MAX_GAUGE_SCALE = 1.35;

/** Above this HUD scale the wind gauge no longer fits between the bars. */
const CROWDED_SCALE = 1.2;
/** How far it then moves down, before the HUD scale. */
const GAUGE_DROP = 62;

/** How wide a life bar is, in canvas units before the HUD scale. */
const BAR_WIDTH = 250;

/** How the far hills and the clouds move with the camera, 0 to 1. */
const HILL_PARALLAX = 0.35;
const CLOUD_PARALLAX = 0.6;

/** One look of the field per scenery. */
type Theme = {
  readonly skyTop: string;
  readonly skyBottom: string;
  readonly hills: string;
  readonly ground: string;
  readonly groundEdge: string;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- the painting: colours,
   positions and proportions */

/** Garden, town, farm and winter. */
const THEMES: readonly Theme[] = [
  {
    skyTop: "#5fb3ef",
    skyBottom: "#cdeafc",
    hills: "#8fcf6f",
    ground: "#6fb64a",
    groundEdge: "#4f8f33",
  },
  {
    skyTop: "#f7b267",
    skyBottom: "#fde4c4",
    hills: "#c08a6b",
    ground: "#a8a29e",
    groundEdge: "#78716c",
  },
  {
    skyTop: "#ef6f6c",
    skyBottom: "#fbd38d",
    hills: "#a0715a",
    ground: "#b98b52",
    groundEdge: "#8a6236",
  },
  {
    skyTop: "#9cc3e6",
    skyBottom: "#eef5fc",
    hills: "#dbe8f5",
    ground: "#f4f8fc",
    groundEdge: "#c3d4e6",
  },
];

/** Where the clouds sit, as x, height and size. */
const CLOUDS: readonly (readonly [number, number, number])[] = [
  [120, 90, 1],
  [430, 60, 1.3],
  [720, 110, 0.9],
  [940, 50, 1.1],
  [1300, 80, 1.2],
  [1650, 120, 0.8],
];

/** The width the clouds wrap around. */
const CLOUD_SPAN = 2000;

/** How fast one wind step drifts the clouds, in canvas units per second. */
const CLOUD_DRIFT = 9;

/** Where the wind flags stand on the field. */
const FLAG_X: readonly number[] = [700, 1200, 1700];

/** How often a distance sign stands, in world units. */
const SIGN_EVERY = 400;

/**
 * Where on the picture the ground is.
 *
 * @param viewHeight - the picture's height
 * @param zoom - the camera's zoom
 * @returns the canvas y of the ground with the camera not raised
 */
export function groundScreenY(viewHeight: number, zoom: number): number {
  return viewHeight - GROUND_MARGIN * Math.max(zoom, 0.5);
}

/**
 * Turns a point on the picture into a point on the field.
 *
 * @param camera - the camera
 * @param viewHeight - the picture's height
 * @param sx - the point, in canvas units
 * @param sy - the point, in canvas units
 * @returns the world position, height counted up from the ground
 */
export function screenToWorld(
  camera: Camera,
  viewHeight: number,
  sx: number,
  sy: number,
): { x: number; y: number } {
  const ground = groundScreenY(viewHeight, camera.zoom);
  return {
    x: (sx - VIEW_WIDTH / 2) / camera.zoom + camera.x,
    y: (ground + camera.lift * camera.zoom - sy) / camera.zoom,
  };
}

/**
 * How much of the field the picture shows sideways.
 *
 * @param camera - the camera
 * @returns the leftmost and rightmost world x in sight
 */
export function visibleRange(camera: Camera): {
  left: number;
  right: number;
} {
  const half = VIEW_WIDTH / 2 / camera.zoom;
  return { left: camera.x - half, right: camera.x + half };
}

/**
 * Paints a frame.
 *
 * @param ctx - the canvas, already scaled to canvas units
 * @param scene - what to show
 */
export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const theme = THEMES[scene.game.scenery % THEMES.length];
  const { camera, viewHeight } = scene;
  const ground = groundScreenY(viewHeight, camera.zoom);
  drawBackdrop(ctx, theme, scene, ground);

  ctx.save();
  ctx.translate(VIEW_WIDTH / 2, ground + camera.lift * camera.zoom);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -GROUND_Y);
  const range = visibleRange(camera);
  drawGround(ctx, theme, range.left, range.right);
  drawSigns(ctx, scene.wind, scene.clock);
  drawDecals(ctx, scene.effects);
  scene.fighters.forEach((fighter, seat) => {
    const character = scene.game.players[seat].character;
    if (character !== null) {
      drawFighter(ctx, {
        character,
        x: FIGHTER_X[seat],
        y: GROUND_Y,
        facing: facing(seat),
        size: characterById(character).size,
        pose: fighter.pose,
        clock: scene.clock + seat * 1.7,
        held: scene.aim?.seat === seat ? scene.held : null,
        stains: fighter.stains,
      });
    }
  });
  if (scene.aim !== null) {
    const thrower = scene.game.players[scene.aim.seat].character;
    drawAim(ctx, scene.aim, thrower === null ? 1 : characterById(thrower).size);
  }
  const top = GROUND_Y - (ground + camera.lift * camera.zoom) / camera.zoom;
  if (scene.flight !== null) {
    drawFlight(ctx, scene.flight.flight, scene.flight.step, top, camera.zoom);
  }
  if (scene.marked !== null) {
    drawMarker(ctx, scene.marked, scene.game, scene.clock);
  }
  drawEffects(ctx, scene.effects);
  ctx.restore();

  drawFighterArrows(ctx, scene, ground);
  drawHud(ctx, scene);
}

/** Sky, sun, far hills and clouds, behind the field with a little parallax. */
function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  scene: Scene,
  ground: number,
): void {
  const { camera, viewHeight } = scene;
  const sky = ctx.createLinearGradient(0, 0, 0, viewHeight);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_WIDTH, viewHeight);

  ctx.fillStyle = "#fff6c2";
  ctx.beginPath();
  ctx.arc(830, 90 + camera.lift * 0.1, 34, 0, Math.PI * 2);
  ctx.fill();

  const shift = camera.x * HILL_PARALLAX;
  const base = ground + camera.lift * camera.zoom * 0.5;
  const rise = Math.max(camera.zoom, 0.6);
  ctx.fillStyle = theme.hills;
  ctx.beginPath();
  ctx.moveTo(0, viewHeight);
  for (let x = 0; x <= VIEW_WIDTH; x += 25) {
    const u = x + shift;
    ctx.lineTo(
      x,
      base - (70 + Math.sin(u / 140 + scene.game.scenery) * 35) * rise,
    );
  }
  ctx.lineTo(VIEW_WIDTH, viewHeight);
  ctx.closePath();
  ctx.fill();

  if (scene.game.scenery === 1) {
    drawTown(ctx, base, shift, rise);
  }

  const drift = scene.clock * scene.wind * CLOUD_DRIFT;
  const cloudShift = camera.x * CLOUD_PARALLAX;
  ctx.fillStyle = "#ffffffd9";
  for (const [x, y, size] of CLOUDS) {
    const raw = x + drift * size - cloudShift;
    const cx = (((raw % CLOUD_SPAN) + CLOUD_SPAN) % CLOUD_SPAN) - 200;
    cloud(ctx, cx, y + camera.lift * 0.2, size);
  }
}

/** Rooftops behind the town, with a little parallax. */
function drawTown(
  ctx: CanvasRenderingContext2D,
  base: number,
  shift: number,
  rise: number,
): void {
  const span = 1250;
  for (let i = 0; i < 10; i++) {
    const raw = 30 + i * 125 - shift * 1.3;
    const x = (((raw % span) + span) % span) - 125;
    const h = (70 + ((i * 37) % 50)) * rise;
    ctx.fillStyle = "#b07a5c";
    ctx.fillRect(x, base - h, 70 * rise, h);
    ctx.beginPath();
    ctx.moveTo(x - 8, base - h);
    ctx.lineTo(x + 35 * rise, base - h - 30 * rise);
    ctx.lineTo(x + 78 * rise, base - h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(x + 18 * rise, base - 50 * rise, 12 * rise, 14 * rise);
  }
}

/** The ground, as far as the camera sees. */
function drawGround(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  left: number,
  right: number,
): void {
  const from = left - 100;
  const width = right - left + 200;
  ctx.fillStyle = theme.ground;
  ctx.fillRect(from, GROUND_Y, width, 3000);
  ctx.fillStyle = theme.groundEdge;
  ctx.fillRect(from, GROUND_Y, width, 5);
  ctx.fillStyle = "#00000014";
  const start = Math.floor(from / 37) * 37;
  for (let x = start; x < from + width; x += 37) {
    ctx.fillRect(x, GROUND_Y + 18 + Math.abs((x * 7) % 40), 14, 3);
  }
}

/** Distance signs every few metres and wind flags along the field. */
function drawSigns(
  ctx: CanvasRenderingContext2D,
  wind: number,
  clock: number,
): void {
  const startX = FIGHTER_X[0];
  for (let x = startX + SIGN_EVERY; x < FIGHTER_X[1]; x += SIGN_EVERY) {
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(x - 3, GROUND_Y - 46, 6, 46);
    ctx.fillStyle = "#fef3c7";
    ctx.strokeStyle = "#6b4423";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 26, GROUND_Y - 70, 52, 26, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#3f2a14";
    ctx.font = "800 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `${Math.round((x - startX) / UNITS_PER_METRE)} m`,
      x,
      GROUND_Y - 52,
    );
    ctx.textAlign = "start";
  }
  for (const x of FLAG_X) {
    drawFlag(ctx, x, wind, clock);
  }
}

/** A flag on a pole that shows the wind. */
function drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  wind: number,
  clock: number,
): void {
  const poleTop = GROUND_Y - 140;
  ctx.strokeStyle = "#4b5563";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, GROUND_Y);
  ctx.lineTo(x, poleTop);
  ctx.stroke();
  const length = 10 + (Math.abs(wind) / WIND_MAX_STEPS) * 40;
  const side = wind === 0 ? 0.25 : Math.sign(wind);
  const droop = wind === 0 ? 18 : 6 - Math.abs(wind);
  const flutter = Math.sin(clock * (4 + Math.abs(wind) * 2) + x) * 3;
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(x, poleTop);
  ctx.lineTo(x + side * length, poleTop + droop + flutter);
  ctx.lineTo(x, poleTop + 18);
  ctx.closePath();
  ctx.fill();
}

/**
 * The aiming help: an arrow in the aimed direction, the start of the arc while
 * charging, and the strength bar filling up.
 */
function drawAim(
  ctx: CanvasRenderingContext2D,
  aim: SceneAim,
  size: number,
): void {
  const direction = facing(aim.seat);
  const hx = FIGHTER_X[aim.seat] + direction * HAND_AHEAD;
  const hy = GROUND_Y - HAND_HEIGHT * size;
  const rad = (aim.angle * Math.PI) / 180;
  const dx = Math.cos(rad) * direction;
  const dy = -Math.sin(rad);
  const length = 95;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.moveTo(hx + dx * 18, hy + dy * 18);
  ctx.lineTo(hx + dx * length, hy + dy * length);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.strokeStyle = "rgba(31,41,55,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(hx + dx * (length + 16), hy + dy * (length + 16));
  ctx.lineTo(hx + dx * length - dy * 9, hy + dy * length + dx * 9);
  ctx.lineTo(hx + dx * length + dy * 9, hy + dy * length - dx * 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const pairs = aim.points.length / 2;
  for (let i = 0; i < pairs; i += 6) {
    const fade = 1 - i / Math.max(1, pairs);
    ctx.fillStyle = `rgba(255,255,255,${(0.35 + fade * 0.6).toFixed(2)})`;
    ctx.strokeStyle = "rgba(31,41,55,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(
      aim.points[i * 2],
      GROUND_Y - aim.points[i * 2 + 1],
      3.4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
  }

  if (aim.power !== null) {
    // The strength, as a bar beside the fighter that fills while held.
    const x = FIGHTER_X[aim.seat] - direction * 56 - 8;
    const barTop = GROUND_Y - 140;
    ctx.fillStyle = "#1f2937bb";
    ctx.beginPath();
    ctx.roundRect(x, barTop, 16, 120, 8);
    ctx.fill();
    const fill = 114 * aim.power;
    const gradient = ctx.createLinearGradient(0, barTop + 120, 0, barTop);
    gradient.addColorStop(0, "#22c55e");
    gradient.addColorStop(0.6, "#facc15");
    gradient.addColorStop(1, "#ef4444");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x + 3, barTop + 117 - fill, 10, Math.max(0, fill), 5);
    ctx.fill();
    ctx.font = "800 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffffcc";
    const label = `${Math.round(aim.power * 100)}%`;
    ctx.strokeText(label, x + 8, barTop - 6);
    ctx.fillStyle = "#1f2937";
    ctx.fillText(label, x + 8, barTop - 6);
    ctx.textAlign = "start";
  }
}

/** Everything in the air at this step. */
function drawFlight(
  ctx: CanvasRenderingContext2D,
  flight: Flight,
  step: number,
  top: number,
  zoom: number,
): void {
  for (const track of flight.tracks) {
    const local = step - track.startStep;
    const last = track.points.length / 2 - 1;
    if (
      local >= 0 &&
      local <= last &&
      !(track.end === "split" && local === last)
    ) {
      const x = track.points[local * 2];
      const y = GROUND_Y - track.points[local * 2 + 1];
      const spin = (local / STEPS_PER_SECOND) * track.item.spin * Math.PI * 2;
      const turn = Math.sign(track.points[last * 2] - track.points[0]) || 1;
      // A faint trail behind it.
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let k = Math.max(0, local - 18); k <= local; k++) {
        ctx.lineTo(track.points[k * 2], GROUND_Y - track.points[k * 2 + 1]);
      }
      ctx.stroke();
      if (y < top - track.item.radius) {
        offscreenMarker(ctx, x, top, zoom);
      } else {
        drawItem(ctx, track.item.id, x, y, track.item.radius, spin * turn);
      }
    }
  }
}

/** A small arrow at the top edge for something flying above the picture. */
function offscreenMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  zoom: number,
): void {
  const unit = 1 / zoom;
  ctx.fillStyle = "#1f2937cc";
  ctx.beginPath();
  ctx.moveTo(x, top + 4 * unit);
  ctx.lineTo(x - 9 * unit, top + 18 * unit);
  ctx.lineTo(x + 9 * unit, top + 18 * unit);
  ctx.closePath();
  ctx.fill();
}

/** The bouncing arrow over the fighter whose turn it is. */
function drawMarker(
  ctx: CanvasRenderingContext2D,
  seat: number,
  game: DuelGame,
  clock: number,
): void {
  const character = game.players[seat].character;
  const size = character === null ? 1 : characterById(character).size;
  const x = FIGHTER_X[seat];
  const y = GROUND_Y - 150 * size - Math.abs(Math.sin(clock * 4)) * 10;
  ctx.fillStyle = "#facc15";
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 14);
  ctx.lineTo(x - 11, y);
  ctx.lineTo(x + 11, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Arrows at the picture's edge towards fighters out of sight. */
function drawFighterArrows(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  ground: number,
): void {
  const range = visibleRange(scene.camera);
  const y = Math.min(
    scene.viewHeight - 50,
    Math.max(150, ground + scene.camera.lift * scene.camera.zoom - 70),
  );
  scene.game.players.forEach((player, seat) => {
    const x = FIGHTER_X[seat];
    const outLeft = x < range.left;
    if (player.character !== null && (outLeft || x > range.right)) {
      const edge = outLeft ? 16 : VIEW_WIDTH - 16;
      const dir = outLeft ? -1 : 1;
      const metres = Math.round(Math.abs(x - scene.camera.x) / UNITS_PER_METRE);
      ctx.save();
      ctx.translate(edge, y);
      ctx.scale(scene.hudScale, scene.hudScale);
      ctx.fillStyle = "#1f2937dd";
      ctx.beginPath();
      ctx.moveTo(dir * 2, 0);
      ctx.lineTo(-dir * 22, -16);
      ctx.lineTo(-dir * 22, 16);
      ctx.closePath();
      ctx.fill();
      ctx.font = "800 15px system-ui, sans-serif";
      ctx.textAlign = outLeft ? "left" : "right";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#ffffffdd";
      const label = `${scene.names[seat] ?? ""} ${metres} m`;
      ctx.strokeText(label, -dir * 28, 5);
      ctx.fillStyle = "#1f2937";
      ctx.fillText(label, -dir * 28, 5);
      ctx.restore();
    }
  });
  ctx.textAlign = "start";
}

/** Names, life bars, lingering effects and the wind gauge. */
function drawHud(ctx: CanvasRenderingContext2D, scene: Scene): void {
  scene.fighters.forEach((fighter, seat) => {
    const player = scene.game.players[seat];
    const right = seat === 1;
    ctx.save();
    ctx.translate(right ? VIEW_WIDTH : 0, 0);
    ctx.scale(scene.hudScale, scene.hudScale);
    const x = right ? -18 : 18;
    ctx.textAlign = right ? "right" : "left";
    ctx.font = "800 20px system-ui, sans-serif";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffffcc";
    const label = scene.names[seat] ?? "";
    ctx.strokeText(label, x, 30);
    ctx.fillStyle = "#1f2937";
    ctx.fillText(label, x, 30);
    if (player.maxHp > 0) {
      lifeBar(
        ctx,
        right ? x - BAR_WIDTH : x,
        40,
        fighter.hp,
        fighter.trail,
        player.maxHp,
      );
      const badges = statusBadges(player.status);
      if (badges !== "") {
        ctx.textAlign = right ? "right" : "left";
        ctx.font = "700 15px system-ui, sans-serif";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#ffffffcc";
        ctx.strokeText(badges, x, 84);
        ctx.fillStyle = "#1f2937";
        ctx.fillText(badges, x, 84);
      }
    }
    ctx.restore();
  });
  ctx.textAlign = "start";
  if (!scene.windHidden) {
    const gauge = Math.min(scene.hudScale, MAX_GAUGE_SCALE);
    ctx.save();
    // On a small screen the bars are wide, so the gauge moves below them.
    const below =
      scene.hudScale > CROWDED_SCALE ? GAUGE_DROP * scene.hudScale : 0;
    ctx.translate(VIEW_WIDTH / 2, below);
    ctx.scale(gauge, gauge);
    ctx.translate(-VIEW_WIDTH / 2, 0);
    drawWindGauge(ctx, scene.wind);
    ctx.restore();
  }
}

/** A life bar: green when full, through yellow to red, with a white trail. */
function lifeBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hp: number,
  trail: number,
  max: number,
): void {
  const height = 20;
  const share = Math.max(0, Math.min(1, hp / max));
  const trailShare = Math.max(share, Math.min(1, trail / max));
  ctx.fillStyle = "#1f2937cc";
  ctx.beginPath();
  ctx.roundRect(x - 3, y - 3, BAR_WIDTH + 6, height + 6, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffffdd";
  ctx.beginPath();
  ctx.roundRect(x, y, BAR_WIDTH * trailShare, height, 5);
  ctx.fill();
  ctx.fillStyle = `hsl(${Math.round(share * 120)}, 80%, 46%)`;
  ctx.beginPath();
  ctx.roundRect(x, y, BAR_WIDTH * share, height, 5);
  ctx.fill();
  ctx.fillStyle = "#ffffff44";
  ctx.fillRect(x + 2, y + 2, Math.max(0, BAR_WIDTH * share - 4), 5);
  ctx.font = "800 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#1f2937";
  const text = `${Math.max(0, Math.round(hp))} / ${max} LP`;
  ctx.strokeText(text, x + BAR_WIDTH / 2, y + 15);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, x + BAR_WIDTH / 2, y + 15);
}

/** The lingering effects on a fighter, as a short line of symbols. */
function statusBadges(status: Statuses): string {
  const parts: string[] = [];
  if (status.shield) {
    parts.push("\u{1F6E1}\u{FE0F} Schild");
  }
  if (status.burn > 0) {
    parts.push(`\u{1F525} ${status.burn}`);
  }
  if (status.frozen) {
    parts.push("\u{1F9CA} eingefroren");
  }
  if (status.shaky) {
    parts.push("\u{1F635} wackelig");
  }
  if (status.rooted) {
    parts.push("\u{1F33F} gefesselt");
  }
  if (status.blind) {
    parts.push("\u{2601}\u{FE0F} Mehl");
  }
  return parts.join("  ");
}

/** The wind in the top middle: its strength in chevrons. */
function drawWindGauge(ctx: CanvasRenderingContext2D, wind: number): void {
  const cx = VIEW_WIDTH / 2;
  ctx.fillStyle = "#1f2937aa";
  ctx.beginPath();
  ctx.roundRect(cx - 92, 10, 184, 46, 14);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(wind === 0 ? "Windstill" : `Wind ${Math.abs(wind)}`, cx, 28);
  const dir = Math.sign(wind);
  for (let i = 0; i < WIND_MAX_STEPS; i++) {
    const active = i < Math.abs(wind);
    ctx.fillStyle = active ? "#7dd3fc" : "#ffffff33";
    const x = cx + (dir >= 0 ? -40 + i * 20 : 40 - i * 20);
    const d = dir === 0 ? 1 : dir;
    ctx.beginPath();
    ctx.moveTo(x - 6 * d, 36);
    ctx.lineTo(x + 6 * d, 43);
    ctx.lineTo(x - 6 * d, 50);
    ctx.lineTo(x - 2 * d, 43);
    ctx.closePath();
    ctx.fill();
  }
  ctx.textAlign = "start";
}

/** A puffy cloud. */
function cloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  for (const [dx, dy, r] of [
    [0, 0, 22],
    [24, -10, 26],
    [50, 0, 20],
    [26, 8, 22],
  ]) {
    ctx.beginPath();
    ctx.arc(x + dx * size, y + dy * size, r * size, 0, Math.PI * 2);
    ctx.fill();
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
