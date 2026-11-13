/**
 * The minimap in the bottom right corner and the large world map: both
 * drawn from the world and the game with the 2D canvas - islands, owners,
 * buildings, harbours, ships and the patch the camera sees; the world map
 * adds names, trade routes and what each island holds. A click on either
 * moves the camera there.
 *
 * @module
 * @remarks
 * There is no fog of war in IMPERAVIS, so the whole world is known from the
 * start and both maps show all of it. The ground is painted once per world
 * and kept; only owners, buildings, ships and the camera are drawn anew.
 */
"use client";

import { useEffect, useRef, type ReactElement } from "react";
import { hostile } from "@/games/imperavis/engine/combat";
import { berthOf, kontorOf } from "@/games/imperavis/engine/ships";
import { scoutsOf } from "@/games/imperavis/engine/troops";
import { SCOUT_REVEAL } from "@/games/imperavis/engine/units-data";
import {
  HUMAN,
  PIRATES,
  playerById,
  TRADER,
} from "@/games/imperavis/engine/players";
import { Terrain, type Game, type World } from "@/games/imperavis/engine/types";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import { GOOD_NAMES, TEXTS as T } from "@/games/imperavis/i18n/texts";
import { CROPS } from "./hud-data";
import { Crest, GoodIcon, Icon } from "./icons";
import { Panel, Window } from "./ui";

/* eslint-disable @typescript-eslint/no-magic-numbers -- colours and sizes of the drawing */

/** Colours of the ground, by terrain. */
const GROUND: Readonly<Record<Terrain, readonly [number, number, number]>> = {
  [Terrain.DeepWater]: [22, 52, 74],
  [Terrain.Water]: [36, 82, 108],
  [Terrain.Beach]: [196, 176, 122],
  [Terrain.Meadow]: [104, 136, 70],
  [Terrain.Forest]: [58, 92, 48],
  [Terrain.Rock]: [126, 118, 104],
  [Terrain.Mountain]: [164, 158, 148],
  [Terrain.River]: [64, 118, 150],
};

/** Colours of the trade route lines (as in the 3D view). */
const ROUTE_COLORS = ["#fbbf24", "#60a5fa", "#f472b6", "#34d399", "#a78bfa"];

/** Pixels of drawing per CSS pixel, for a sharp map on every screen. */
const SHARPNESS = 2;

/** Width and height of the minimap, CSS px. */
const MINI_W = 230;
const MINI_H = 172;

/** The ground of a world, painted once. */
const grounds = new WeakMap<World, HTMLCanvasElement>();

/** The coast tiles of each island, found once. */
const coasts = new WeakMap<World, number[][]>();

/** What the camera sees, in tiles. */
type Area = readonly { readonly x: number; readonly y: number }[];

/** Props of {@link Minimap}. */
type MinimapProps = {
  readonly game: Game;
  readonly tick: number;
  readonly viewArea: () => Area;
  readonly onFocus: (x: number, y: number) => void;
  readonly onWorld: () => void;
  readonly worldOpen: boolean;
};

/**
 * The minimap with its button for the world map.
 *
 * @param props - the game, the camera and the actions
 * @returns the minimap
 */
export function Minimap({
  game,
  tick,
  viewArea,
  onFocus,
  onWorld,
  worldOpen,
}: MinimapProps): ReactElement {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (canvas !== null && context !== null && context !== undefined) {
      drawMap(
        context,
        game,
        viewArea(),
        MINI_W * SHARPNESS,
        MINI_H * SHARPNESS,
        false,
      );
    }
  }, [game, tick, viewArea]);
  return (
    <Panel className="p-1.5" testId="imp-minimap">
      <div className="relative">
        <canvas
          ref={ref}
          width={MINI_W * SHARPNESS}
          height={MINI_H * SHARPNESS}
          style={{ width: MINI_W, height: MINI_H }}
          className="imp-inset block cursor-crosshair"
          data-tip={`${HUD.minimap}\n${HUD.minimapTip}`}
          data-testid="imp-minimap-canvas"
          onClick={(event) => {
            const at = tileAt(game.world.n, event, MINI_W, MINI_H);
            onFocus(at.x, at.y);
          }}
        />
        <button
          type="button"
          className="imp-btn absolute top-1 right-1 h-7 w-7"
          aria-pressed={worldOpen}
          data-tip={`${HUD.worldMap}\n${HUD.worldMapTip}`}
          aria-label={HUD.worldMap}
          data-testid="imp-open-map"
          onClick={(event) => {
            onWorld();
            event.currentTarget.blur();
          }}
        >
          <Icon name="map" size={16} />
        </button>
      </div>
    </Panel>
  );
}

/** Props of {@link WorldMap}. */
type WorldMapProps = MinimapProps & { readonly onClose: () => void };

/**
 * The large world map in a window.
 *
 * @param props - the game, the camera and the actions
 * @returns the window
 */
export function WorldMap({
  game,
  tick,
  viewArea,
  onFocus,
  onClose,
}: WorldMapProps): ReactElement {
  const ref = useRef<HTMLCanvasElement>(null);
  const size = 1024;
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (canvas !== null && context !== null && context !== undefined) {
      drawMap(context, game, viewArea(), size, size, true);
    }
  }, [game, tick, viewArea]);
  const n = game.world.n;
  const owners = game.players.filter((player) =>
    game.islands.some((island) => island.owner === player.id),
  );
  return (
    <Window
      title={HUD.worldTitle}
      icon="globe"
      subtitle={HUD.worldHint}
      onClose={onClose}
      testId="imp-world-map"
      closeTestId="imp-world-close"
      className="h-full w-full"
    >
      <div className="flex min-h-0 flex-col gap-3 lg:h-full lg:flex-row">
        <div className="relative mx-auto aspect-square w-full max-w-full shrink-0 lg:mx-0 lg:h-full lg:w-auto">
          <canvas
            ref={ref}
            width={size}
            height={size}
            className="imp-inset block h-full w-full cursor-crosshair"
            data-testid="imp-world-canvas"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const at = tileAt(n, event, rect.width, rect.height);
              onFocus(at.x, at.y);
              onClose();
            }}
          />
          {game.world.islands.map((info) => (
            <div
              key={info.id}
              className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{
                left: `${(info.cx / n) * 100}%`,
                top: `${(info.cy / n) * 100}%`,
              }}
            >
              <span className="imp-display rounded bg-[rgb(20_16_13/0.72)] px-1 text-[11px] whitespace-nowrap text-[var(--imp-text)]">
                {info.name}
              </span>
              <span className="mt-0.5 flex gap-0.5 rounded bg-[rgb(20_16_13/0.6)] px-0.5">
                {(["stone", "clay", "ore"] as const)
                  .filter((kind) => info.deposits[kind] > 0)
                  .map((kind) => (
                    <GoodIcon key={kind} good={kind} size={12} />
                  ))}
                {CROPS.filter((crop) => info.fertile[crop]).map((crop) => (
                  <GoodIcon key={crop} good={crop} size={12} />
                ))}
              </span>
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-2 text-xs lg:w-56 lg:overflow-y-auto">
          <p className="imp-title text-[0.8rem]">{T.owner}</p>
          {owners.map((player) => (
            <div key={player.id} className="flex items-center gap-1.5">
              <Crest color={player.color} size={16} variant={player.id} />
              {player.id === HUMAN ? HUD.legendOwn : player.name}
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <Crest color={null} size={16} />
            {HUD.legendFree}
          </div>
          <div className="imp-rule my-1" />
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 bg-[#fbbf24]" />
            {HUD.legendRoute}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-white bg-[#e2c06e]" />
            {HUD.legendShip}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-4 border border-white" />
            {HUD.legendCamera}
          </div>
          <div className="imp-rule my-1" />
          <p className="imp-title text-[0.8rem]">{HUD.deposits}</p>
          {(["stone", "clay", "ore"] as const).map((good) => (
            <div key={good} className="flex items-center gap-1.5">
              <GoodIcon good={good} size={14} /> {GOOD_NAMES[good]}
            </div>
          ))}
          {CROPS.map((crop) => (
            <div key={crop} className="flex items-center gap-1.5">
              <GoodIcon good={crop} size={14} /> {HUD.fertility}:{" "}
              {GOOD_NAMES[crop]}
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}

/**
 * Draws one island alone, filling a square: its land, and its coast in the
 * owner's colour.
 *
 * @param context - where to draw
 * @param game - the game
 * @param island - the island id
 * @param color - the owner's colour, or null
 * @param size - edge of the square, px
 */
export function drawIsland(
  context: CanvasRenderingContext2D,
  game: Game,
  island: number,
  color: number | null,
  size: number,
): void {
  const world = game.world;
  const info = world.islands[island];
  const span = Math.max(info.maxX - info.minX, info.maxY - info.minY) + 3;
  const scale = size / span;
  const left = (info.minX + info.maxX) / 2 - span / 2;
  const top = (info.minY + info.maxY) / 2 - span / 2;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, size, size);
  context.imageSmoothingEnabled = false;
  context.setTransform(scale, 0, 0, scale, -left * scale, -top * scale);
  context.drawImage(groundOf(world), 0, 0);
  if (color !== null) {
    context.fillStyle = css(color);
    for (const index of coastOf(world)[island] ?? []) {
      context.fillRect(index % world.n, Math.floor(index / world.n), 1, 1);
    }
  }
  context.setTransform(1, 0, 0, 1, 0, 0);
}

/** Draws the whole world into a canvas of the given size. */
function drawMap(
  context: CanvasRenderingContext2D,
  game: Game,
  area: Area,
  width: number,
  height: number,
  large: boolean,
): void {
  const world = game.world;
  const n = world.n;
  const scale = Math.min(width, height) / n;
  const offsetX = (width - n * scale) / 2;
  const offsetY = (height - n * scale) / 2;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = "rgb(16 38 56)";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = false;
  context.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  context.drawImage(groundOf(world), 0, 0);
  // Owners: the coast of each settled island in its owner's colour.
  const coast = coastOf(world);
  for (const state of game.islands) {
    const owner = playerById(game, state.owner);
    if (owner !== null) {
      context.fillStyle = css(owner.color);
      for (const index of coast[state.id] ?? []) {
        context.fillRect(index % n, Math.floor(index / n), 1, 1);
      }
    }
  }
  // Buildings, a lighter shade of the owner; kontors as harbours.
  for (const building of game.buildings) {
    const owner = playerById(game, game.islands[building.island].owner);
    const color = owner === null ? 0xcccccc : owner.color;
    context.fillStyle =
      building.kind === "kontor" ? "#ffffff" : css(color, 0.9);
    context.fillRect(building.x, building.y, building.w, building.h);
    if (building.kind === "kontor") {
      context.fillStyle = css(color);
      context.fillRect(
        building.x + 0.6,
        building.y + 0.6,
        building.w - 1.2,
        building.h - 1.2,
      );
    }
  }
  if (large) {
    drawRoutes(context, game, scale);
  }
  // Ships.
  const radius = Math.max(1.2, (large ? 5 : 3.2) / scale);
  for (const ship of game.ships) {
    const owner = playerById(game, ship.owner);
    context.beginPath();
    context.arc(ship.x, ship.y, radius, 0, Math.PI * 2);
    context.fillStyle =
      ship.owner === PIRATES
        ? "#1a1a1a"
        : ship.owner === TRADER
          ? "#f2ead6"
          : css(owner?.color ?? 0xffffff);
    context.fill();
    context.lineWidth = Math.max(0.4, 1.4 / scale);
    context.strokeStyle = ship.owner === PIRATES ? "#e07a63" : "#ffffff";
    context.stroke();
  }
  drawScouted(context, game, radius, scale);
  // The camera's patch.
  if (area.length === 4) {
    context.beginPath();
    context.moveTo(area[0].x, area[0].y);
    for (const corner of area.slice(1)) {
      context.lineTo(corner.x, corner.y);
    }
    context.closePath();
    context.fillStyle = "rgb(255 255 255 / 0.1)";
    context.fill();
    context.lineWidth = Math.max(0.6, 2 / scale);
    context.strokeStyle = "rgb(255 246 224 / 0.95)";
    context.stroke();
  }
  context.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * What the human's scouts see: their circles, enemy troops inside them as
 * red dots and enemy ships inside them with a red warning ring. Without a
 * scout no enemy troop is shown.
 */
function drawScouted(
  context: CanvasRenderingContext2D,
  game: Game,
  radius: number,
  scale: number,
): void {
  const scouts = scoutsOf(game, HUMAN);
  const seen = (x: number, y: number) =>
    scouts.some((s) => Math.hypot(s.x - x, s.y - y) <= SCOUT_REVEAL);
  context.lineWidth = Math.max(0.4, 1.2 / scale);
  for (const scout of scouts) {
    context.beginPath();
    context.arc(scout.x, scout.y, SCOUT_REVEAL, 0, Math.PI * 2);
    context.strokeStyle = "rgb(255 246 224 / 0.35)";
    context.stroke();
  }
  context.fillStyle = "#ef4444";
  for (const soldier of game.soldiers) {
    if (
      soldier.ship < 0 &&
      hostile(game, HUMAN, soldier.owner) &&
      seen(soldier.x, soldier.y)
    ) {
      context.fillRect(
        soldier.x - radius / 2,
        soldier.y - radius / 2,
        radius,
        radius,
      );
    }
  }
  context.strokeStyle = "#ef4444";
  for (const ship of game.ships) {
    if (hostile(game, HUMAN, ship.owner) && seen(ship.x, ship.y)) {
      context.beginPath();
      context.arc(ship.x, ship.y, radius * 2, 0, Math.PI * 2);
      context.stroke();
    }
  }
}

/** The human's trade routes, harbour to harbour. */
function drawRoutes(
  context: CanvasRenderingContext2D,
  game: Game,
  scale: number,
): void {
  const n = game.world.n;
  game.routes
    .filter((route) => route.owner === HUMAN)
    .forEach((route, index) => {
      const points = route.stops
        .map((stop) => kontorOf(game, stop.island))
        .map((kontor) => (kontor === null ? -1 : berthOf(game, kontor)))
        .filter((berth) => berth >= 0)
        .map((berth) => [(berth % n) + 0.5, Math.floor(berth / n) + 0.5]);
      if (points.length > 1) {
        context.beginPath();
        context.moveTo(points[0][0], points[0][1]);
        for (const point of points.slice(1)) {
          context.lineTo(point[0], point[1]);
        }
        if (points.length > 2) {
          context.closePath();
        }
        context.setLineDash([6 / scale, 4 / scale]);
        context.lineWidth = 2.5 / scale;
        context.strokeStyle = route.active
          ? ROUTE_COLORS[index % ROUTE_COLORS.length]
          : "rgb(200 200 200 / 0.6)";
        context.stroke();
        context.setLineDash([]);
      }
    });
}

/** The ground of a world as an image, one pixel per tile. */
function groundOf(world: World): HTMLCanvasElement {
  let canvas = grounds.get(world);
  if (canvas === undefined) {
    const n = world.n;
    canvas = document.createElement("canvas");
    canvas.width = n;
    canvas.height = n;
    const context = canvas.getContext("2d");
    if (context !== null) {
      const image = context.createImageData(n, n);
      for (let i = 0; i < n * n; i += 1) {
        const color =
          GROUND[world.terrain[i] as Terrain] ?? GROUND[Terrain.DeepWater];
        image.data[i * 4] = color[0];
        image.data[i * 4 + 1] = color[1];
        image.data[i * 4 + 2] = color[2];
        image.data[i * 4 + 3] = 255;
      }
      context.putImageData(image, 0, 0);
    }
    grounds.set(world, canvas);
  }
  return canvas;
}

/** The land tiles of each island that touch the sea. */
function coastOf(world: World): number[][] {
  let list = coasts.get(world);
  if (list === undefined) {
    const n = world.n;
    list = world.islands.map(() => []);
    for (let y = 1; y < n - 1; y += 1) {
      for (let x = 1; x < n - 1; x += 1) {
        const index = y * n + x;
        const island = world.islandOf[index];
        if (
          island >= 0 &&
          (world.islandOf[index - 1] < 0 ||
            world.islandOf[index + 1] < 0 ||
            world.islandOf[index - n] < 0 ||
            world.islandOf[index + n] < 0)
        ) {
          list[island].push(index);
        }
      }
    }
    coasts.set(world, list);
  }
  return list;
}

/** A colour as CSS. */
function css(color: number, alpha = 1): string {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

/** The tile under a click on a map drawn into a box of the given size. */
function tileAt(
  n: number,
  event: { currentTarget: HTMLElement; clientX: number; clientY: number },
  width: number,
  height: number,
): { x: number; y: number } {
  const rect = event.currentTarget.getBoundingClientRect();
  // The box may be zoomed: measure in the drawn size.
  const fx = (event.clientX - rect.left) / rect.width;
  const fy = (event.clientY - rect.top) / rect.height;
  const side = Math.min(width, height);
  const x = ((fx * width - (width - side) / 2) / side) * n;
  const y = ((fy * height - (height - side) / 2) / side) * n;
  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y)),
  };
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
