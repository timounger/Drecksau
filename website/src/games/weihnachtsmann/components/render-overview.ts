/**
 * The view from the big telescope: the whole map small on a dark panel, with
 * everybody, the Advent gates, the doors of the buildings and the snow
 * jetskis marked - and,
 * when Gugor looks, the hidden things too, with the gift store's maze seen
 * from inside.
 *
 * @module
 * @remarks
 * The map is painted once per map into a little canvas, one pixel per cell,
 * and blown up without smoothing; the markers go on top every frame. Names
 * and hints come in sharp text in a second pass ({@link drawOverviewLabels}).
 */
import { isHole } from "@/games/weihnachtsmann/engine/cave";
import { PLACE_LABELS } from "@/games/weihnachtsmann/engine/east-data";
import { drawOverviewExtras, extraLabels } from "./render-extras";
import {
  gondolaPoint,
  gondolaShare,
} from "@/games/weihnachtsmann/engine/cablecar";
import {
  CABLE_TOP_CELL,
  STATIONS,
  TRACK_CORNERS,
} from "@/games/weihnachtsmann/engine/places-data";
import { trainCars } from "@/games/weihnachtsmann/engine/railway";
import { TILE } from "@/games/weihnachtsmann/engine/map";
import { SECRET_SPOT } from "@/games/weihnachtsmann/engine/map-data";
import { presentPoint } from "@/games/weihnachtsmann/engine/store";
import type {
  AreaId,
  CharacterId,
  GameMap,
  GameState,
  Terrain,
} from "@/games/weihnachtsmann/engine/types";
import { fishSpot } from "@/games/weihnachtsmann/engine/world";
import {
  CHARACTER_TEXTS,
  JETSKI_TEXTS,
  MAP_NAMES,
  PLACE_NAMES,
  TOWN_TEXTS,
} from "@/games/weihnachtsmann/i18n/texts";
import { snap, type Art } from "./sprites";

/** The colour of each kind of ground on the small map. */
const TERRAIN_COLORS: Readonly<Record<Terrain, string>> = {
  snow: "#e8eef8",
  path: "#c8b48c",
  ice: "#b4d8f0",
  water: "#3a6aa8",
  tree: "#2e6a4a",
  fence: "#8a5a34",
  rock: "#8a8aa0",
  drift: "#ffffff",
  thing: "#b89aa8",
  building: "#8a3a3a",
  floor: "#9a7a5a",
  wall: "#3a2a2a",
  gap: "#5a3a2a",
};

/** The colour of each character's mark. */
const CHARACTER_COLORS: Readonly<Record<CharacterId, string>> = {
  santa: "#e02a2a",
  balbo: "#ffffff",
  jordi: "#3ac04a",
  trixi: "#ff7ad0",
  gilfi: "#ffd84a",
  grantelbart: "#9a4ae0",
  gugor: "#7a9ac8",
  rudolf: "#a86a3a",
};

/** The jetskis' colours on the small map, by home. */
const JETSKI_COLORS: readonly string[] = [
  "#e8343a",
  "#ffc21e",
  "#1ec8b8",
  "#b04ae8",
];

/** Half the length of a jetski's mark, and how far below it its name sits, map px. */
const JETSKI_MARK = 2;
const JETSKI_LABEL = 2;

/** Room round the map inside the panel, and above it for the title. */
const MARGIN = 6;
const TITLE = 12;

/** The inset with the store's maze: width as a share of the panel. */
const INSET_SHARE = 0.3;

/** Text sizes, map px. */
const TITLE_FONT = 6;
const NAME_FONT = 4;

/** How fast the marks blink, per second. */
const BLINK = 4;

/** The small maps painted so far. */
const PAINTED = new WeakMap<GameMap, HTMLCanvasElement>();

/** Where the map lies on the panel: its corner and pixels per cell. */
type Layout = {
  readonly x: number;
  readonly y: number;
  readonly cell: number;
  /** The inset with the store's maze, when Gugor looks. */
  readonly inset: {
    readonly x: number;
    readonly y: number;
    readonly cell: number;
  } | null;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- sizes of the marks
   and flicker speeds on the panel, picked by eye */
/**
 * Draws the open view over the map onto the buffer, over everything.
 *
 * @param ctx - the buffer, in map px, view corner at 0, 0
 * @param state - the game
 * @param art - the sheets (unused marks come from shapes)
 */
export function drawOverview(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
): void {
  const overview = state.overview;
  if (overview !== null && art.buildings.complete) {
    const view = state.view;
    const outdoors = state.maps.outdoors;
    const layout = layoutOf(state);
    ctx.fillStyle = "rgba(10, 8, 24, 0.92)";
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      painted(outdoors),
      layout.x,
      layout.y,
      outdoors.cols * layout.cell,
      outdoors.rows * layout.cell,
    );
    ctx.strokeStyle = "#e8b830";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(
      layout.x - 0.5,
      layout.y - 0.5,
      outdoors.cols * layout.cell + 1,
      outdoors.rows * layout.cell + 1,
    );
    const blink = Math.floor(state.time * BLINK) % 2 === 0;
    drawGates(ctx, state, layout);
    drawDoors(ctx, state, layout);
    drawJetskis(ctx, state, layout);
    drawRailway(ctx, state, layout);
    drawOverviewExtras(ctx, state, layout.x, layout.y, layout.cell);
    if (overview.eagle) {
      drawHidden(ctx, state, layout, blink);
    }
    drawCharacters(ctx, state, layout, blink);
  }
}

/**
 * The title, the hint and the names on the open view, in sharp text.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param scale - canvas pixels per map px
 */
export function drawOverviewLabels(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
): void {
  const overview = state.overview;
  if (overview !== null) {
    const layout = layoutOf(state);
    ctx.save();
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.font = `bold ${String(Math.round(TITLE_FONT * scale))}px system-ui, sans-serif`;
    ctx.fillStyle = "#ffe9a8";
    ctx.fillText(
      state.chars[state.active].area === "summit"
        ? TOWN_TEXTS.overviewSummit
        : TOWN_TEXTS.overviewTitle,
      MARGIN * scale,
      (MARGIN / 2) * scale,
    );
    ctx.textAlign = "right";
    ctx.font = `${String(Math.round(NAME_FONT * scale))}px system-ui, sans-serif`;
    ctx.fillStyle = "#c8c0e0";
    ctx.fillText(
      overview.eagle ? TOWN_TEXTS.overviewEagle : TOWN_TEXTS.overviewHint,
      (state.view.w - MARGIN) * scale,
      (MARGIN / 2 + 1) * scale,
    );
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, scale * 0.8);
    ctx.strokeStyle = "#1a1220";
    ctx.font = `bold ${String(Math.round(NAME_FONT * scale))}px system-ui, sans-serif`;
    for (const door of state.maps.outdoors.doors) {
      if (door.to !== "outdoors" && !isHole(door)) {
        const x = layout.x + (door.tx + door.w / 2) * layout.cell;
        const y = layout.y + (door.ty + 1) * layout.cell + 1;
        ctx.fillStyle = "#ffe9a8";
        ctx.strokeText(MAP_NAMES[door.to], x * scale, y * scale);
        ctx.fillText(MAP_NAMES[door.to], x * scale, y * scale);
      }
    }
    ctx.fillStyle = "#bfe6ff";
    for (const place of PLACE_LABELS) {
      const x = layout.x + (place.tx + 1 / 2) * layout.cell;
      const y = layout.y + (place.ty + 1 / 2) * layout.cell;
      ctx.strokeText(PLACE_NAMES[place.name], x * scale, y * scale);
      ctx.fillText(PLACE_NAMES[place.name], x * scale, y * scale);
    }
    for (const place of extraLabels()) {
      const x = layout.x + (place.x + 1 / 2) * layout.cell;
      const y = layout.y + (place.y + 1 / 2) * layout.cell;
      ctx.strokeText(place.name, x * scale, y * scale);
      ctx.fillText(place.name, x * scale, y * scale);
    }
    ctx.fillStyle = "#ffffff";
    for (const jet of state.world.jetskis) {
      const x = layout.x + (jet.x / TILE) * layout.cell;
      const y = layout.y + (jet.y / TILE) * layout.cell + JETSKI_LABEL;
      ctx.strokeText(JETSKI_TEXTS.name, x * scale, y * scale);
      ctx.fillText(JETSKI_TEXTS.name, x * scale, y * scale);
    }
    const steered = state.chars[state.active];
    const at = markOf(state, steered.area, steered.x, steered.y, layout);
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "#ffffff";
    const name = `${CHARACTER_TEXTS[steered.id].name} (${TOWN_TEXTS.overviewYou})`;
    ctx.strokeText(name, at.x * scale, (at.y - 3) * scale);
    ctx.fillText(name, at.x * scale, (at.y - 3) * scale);
    const inset = layout.inset;
    if (inset !== null) {
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#ffe9a8";
      const store = state.maps.giftStore;
      const label = TOWN_TEXTS.overviewStore;
      ctx.strokeText(
        label,
        (inset.x + (store.cols * inset.cell) / 2) * scale,
        (inset.y - 1) * scale,
      );
      ctx.fillText(
        label,
        (inset.x + (store.cols * inset.cell) / 2) * scale,
        (inset.y - 1) * scale,
      );
    }
    ctx.restore();
  }
}

/** Where the map and the inset lie for the view's size right now. */
function layoutOf(state: GameState): Layout {
  const view = state.view;
  const map = state.maps.outdoors;
  const eagle = state.overview?.eagle === true;
  const room = eagle ? view.w * (1 - INSET_SHARE) : view.w;
  const cell = Math.min(
    (room - MARGIN * 2) / map.cols,
    (view.h - TITLE - MARGIN) / map.rows,
  );
  const x = eagle ? MARGIN : Math.round((view.w - map.cols * cell) / 2);
  let inset: Layout["inset"] = null;
  if (eagle) {
    const store = state.maps.giftStore;
    const left = MARGIN * 2 + map.cols * cell;
    const insetCell = Math.min(
      (view.w - left - MARGIN) / store.cols,
      (view.h - TITLE - MARGIN * 2) / store.rows,
    );
    inset = { x: left, y: TITLE + MARGIN, cell: insetCell };
  }
  return { x, y: TITLE, cell, inset };
}

/** The small picture of a map, one pixel per cell, painted once. */
function painted(map: GameMap): HTMLCanvasElement {
  let canvas = PAINTED.get(map);
  if (canvas === undefined) {
    canvas = document.createElement("canvas");
    canvas.width = map.cols;
    canvas.height = map.rows;
    const ctx = canvas.getContext("2d");
    if (ctx !== null) {
      for (let ty = 0; ty < map.rows; ty += 1) {
        for (let tx = 0; tx < map.cols; tx += 1) {
          const cell = ty * map.cols + tx;
          const small = map.small[cell];
          let color = TERRAIN_COLORS[map.terrain[cell]];
          if (small === "lamp") {
            color = "#ffd84a";
          } else if (small === "parcels" || small === "parcelGap") {
            color = small === "parcels" ? "#c85a3a" : "#7a4a2a";
          }
          ctx.fillStyle = color;
          ctx.fillRect(tx, ty, 1, 1);
        }
      }
    }
    PAINTED.set(map, canvas);
  }
  return canvas;
}

/** The Advent gates: gold when won. */
function drawGates(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  layout: Layout,
): void {
  for (const gate of state.maps.outdoors.gates) {
    ctx.fillStyle = state.gatesDone.has(gate.number) ? "#ffd84a" : "#c04a3a";
    ctx.fillRect(
      snap(layout.x + gate.tx * layout.cell),
      snap(layout.y + gate.ty * layout.cell),
      Math.max(1, layout.cell * 3),
      Math.max(1, layout.cell),
    );
  }
}

/** Every jetski as a little hull in its colour, where it stands now. */
function drawJetskis(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  layout: Layout,
): void {
  for (const jet of state.world.jetskis) {
    const x = layout.x + (jet.x / TILE) * layout.cell;
    const y = layout.y + (jet.y / TILE) * layout.cell;
    ctx.fillStyle = "#1a1220";
    ctx.fillRect(
      snap(x - JETSKI_MARK - 0.5),
      snap(y - 1.5),
      JETSKI_MARK * 2 + 1,
      2.5,
    );
    ctx.fillStyle = JETSKI_COLORS[jet.home % JETSKI_COLORS.length];
    ctx.fillRect(snap(x - JETSKI_MARK), snap(y - 1), JETSKI_MARK * 2, 1.5);
  }
}

/**
 * The railway's loop as a thin line with its stations, the train as a red
 * bar, the balloon and the gondola as little marks.
 */
function drawRailway(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  layout: Layout,
): void {
  const at = (x: number, y: number) => ({
    x: layout.x + x * layout.cell,
    y: layout.y + y * layout.cell,
  });
  ctx.strokeStyle = "#5a4a5a";
  ctx.lineWidth = Math.max(0.5, layout.cell * 0.5);
  ctx.beginPath();
  TRACK_CORNERS.forEach(([cx, cy], index) => {
    const point = at(cx + 1 / 2, cy + 1 / 2);
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  for (const station of STATIONS) {
    const point = at(station.x + 1 / 2, station.y + 1 / 2);
    ctx.fillRect(snap(point.x - 1), snap(point.y - 1), 2, 2);
  }
  ctx.fillStyle = "#e8343a";
  for (const car of trainCars(state)) {
    const point = at(car.x / TILE, car.y / TILE);
    ctx.fillRect(snap(point.x - 1), snap(point.y - 1), 2, 2);
  }
  const balloon = state.world.places.balloon;
  const high = at(balloon.x / TILE, balloon.y / TILE);
  ctx.fillStyle = "#ffc21e";
  ctx.beginPath();
  ctx.arc(high.x, high.y - 1.5, 1.6, 0, Math.PI * 2);
  ctx.fill();
  const cable = gondolaPoint(gondolaShare(state));
  const low = gondolaPoint(0);
  const top = gondolaPoint(1);
  ctx.strokeStyle = "#3a3442";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(
    at(low.x / TILE, low.y / TILE).x,
    at(low.x / TILE, low.y / TILE).y,
  );
  ctx.lineTo(
    at(top.x / TILE, top.y / TILE).x,
    at(top.x / TILE, top.y / TILE).y,
  );
  ctx.stroke();
  const gondola = at(cable.x / TILE, cable.y / TILE);
  ctx.fillStyle = "#d8343a";
  ctx.fillRect(snap(gondola.x - 1), snap(gondola.y - 1), 2, 2);
}

/** A warm dot at every door one can go in by. */
function drawDoors(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  layout: Layout,
): void {
  ctx.fillStyle = "#ffe9a8";
  for (const door of state.maps.outdoors.doors.filter(
    (candidate) => !isHole(candidate),
  )) {
    ctx.fillRect(
      snap(layout.x + door.tx * layout.cell),
      snap(layout.y + door.ty * layout.cell),
      Math.max(1, door.w * layout.cell),
      Math.max(1, layout.cell),
    );
  }
}

/** What only Gugor spots: the present (outside on the store, inside in the maze), the fox's secret, the fish. */
function drawHidden(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  layout: Layout,
  blink: boolean,
): void {
  const inset = layout.inset;
  if (inset !== null) {
    const store = state.maps.giftStore;
    ctx.drawImage(
      painted(store),
      inset.x,
      inset.y,
      store.cols * inset.cell,
      store.rows * inset.cell,
    );
    ctx.strokeStyle = "#e8b830";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(
      inset.x - 0.5,
      inset.y - 0.5,
      store.cols * inset.cell + 1,
      store.rows * inset.cell + 1,
    );
    const gift = presentPoint(state);
    if (gift !== null) {
      ring(
        ctx,
        inset.x + (gift.x / TILE) * inset.cell,
        inset.y + (gift.y / TILE) * inset.cell,
        blink ? 3 : 2,
        "#ffd84a",
      );
      const door = state.maps.outdoors.doors.find(
        (candidate) => candidate.to === "giftStore",
      );
      if (door !== undefined) {
        ring(
          ctx,
          layout.x + (door.tx + 1) * layout.cell,
          layout.y + door.ty * layout.cell,
          blink ? 3 : 2,
          "#ffd84a",
        );
      }
    }
    for (const char of state.chars) {
      if (char.area === "giftStore") {
        dot(
          ctx,
          inset.x + (char.x / TILE) * inset.cell,
          inset.y + (char.y / TILE) * inset.cell,
          CHARACTER_COLORS[char.id],
        );
      }
    }
  }
  ring(
    ctx,
    layout.x + (SECRET_SPOT[0] + 1 / 2) * layout.cell,
    layout.y + (SECRET_SPOT[1] + 1 / 2) * layout.cell,
    2,
    "#ff8a3a",
  );
  const fish = fishSpot(state);
  if (fish !== null) {
    ring(
      ctx,
      layout.x + (fish.x / TILE) * layout.cell,
      layout.y + (fish.y / TILE) * layout.cell,
      2,
      "#6ad0ff",
    );
  }
}

/** Everybody as a coloured dot; who is inside sits at the door of the house. */
function drawCharacters(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  layout: Layout,
  blink: boolean,
): void {
  state.chars.forEach((char, index) => {
    const at = markOf(state, char.area, char.x, char.y, layout);
    // Several inside one house stand side by side at its door.
    const shift = char.area === "outdoors" ? 0 : (index % 4) - 1.5;
    dot(ctx, at.x + shift * 2, at.y, CHARACTER_COLORS[char.id]);
    if (index === state.active && blink) {
      ring(ctx, at.x, at.y, 3.5, "#ffffff");
    }
  });
  const ride = state.sleigh;
  if (ride !== null) {
    ring(
      ctx,
      layout.x + (ride.x / TILE) * layout.cell,
      layout.y + (ride.y / TILE) * layout.cell,
      2.5,
      "#e02a2a",
    );
  }
}

/** Where somebody's mark goes: where they stand outside, or their house's door. */
function markOf(
  state: GameState,
  area: AreaId,
  x: number,
  y: number,
  layout: Layout,
): { x: number; y: number } {
  let tx = x / TILE;
  let ty = y / TILE;
  if (area === "summit") {
    // Up on the summit: at the top of the mountain.
    tx = CABLE_TOP_CELL.x;
    ty = CABLE_TOP_CELL.y;
  } else if (area !== "outdoors") {
    const door = state.maps.outdoors.doors.find(
      (candidate) => candidate.to === area,
    );
    tx = door === undefined ? tx : door.tx + door.w / 2;
    ty = door === undefined ? ty : door.ty + 1;
  }
  return { x: layout.x + tx * layout.cell, y: layout.y + ty * layout.cell };
}

/** A small round mark with a dark rim. */
function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void {
  ctx.fillStyle = "#1a1220";
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

/** A thin ring round a point. */
function ring(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
