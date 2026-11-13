/**
 * The 3D view of IMPERAVIS: scene, light, sky, day and night, seasons and
 * weather, the sea, trade route lines, busy roads, cannon fire, castaways,
 * and what the input means on the map - picking, hovering, selecting with a
 * box, building, drawing roads, tearing down, moving buildings and giving
 * orders to ships and soldiers.
 *
 * @module
 * @remarks
 * The view only reads the game. The raw mouse, touch and key events are
 * read in `input.ts`; what the player does on the map goes back through
 * callbacks, which turn it into commands. It is loaded on demand by the
 * IMPERAVIS page, so three.js never lands in another page's bundle.
 */
import * as THREE from "three";
import {
  BUILDING,
  WAREHOUSE_KINDS,
} from "@/games/imperavis/engine/buildings-data";
import { buildingAt } from "@/games/imperavis/engine/derived";
import { HUMAN } from "@/games/imperavis/engine/players";
import { berthOf, kontorOf } from "@/games/imperavis/engine/ships";
import { BUSY_ROAD } from "@/games/imperavis/engine/warehouse";
import { NO_ROAD } from "@/games/imperavis/engine/logistics-data";
import { linkKind } from "@/games/imperavis/engine/logistics";
import type { LinkKind } from "@/games/imperavis/engine/types";
import {
  checkPlacement,
  footprint,
  type PlacementIssue,
} from "@/games/imperavis/engine/placement";
import {
  pavePrice,
  planPave,
  planRoad,
  roadPrice,
} from "@/games/imperavis/engine/roads";
import {
  cornerHeight,
  groundHeight,
  inBounds,
  isSea,
} from "@/games/imperavis/engine/terrain";
import {
  dayFraction,
  seasonAt,
  seasonProgress,
  SEASONS,
} from "@/games/imperavis/engine/time";
import {
  Terrain,
  type BuildingKind,
  type Game,
  type GameEvent,
} from "@/games/imperavis/engine/types";
import { createBuildingsLayer } from "./buildings-layer";
import { CameraController, type CameraState } from "./camera";
import { createEffects } from "./effects";
import { createInput, type InputAction, type Modifiers } from "./input";
import { createLandscape } from "./landscape";
import {
  createBuildingMaterial,
  createTerrainMaterial,
  createUniforms,
  createWaterMaterial,
  foliageTint,
} from "./materials";
import { buildingModel, wreckModel } from "./models";
import { createUnitsLayer } from "./units";

/* eslint-disable @typescript-eslint/no-magic-numbers -- light, colour and input tuning */

/** What the pointer does on the map. */
export type Tool =
  | { readonly type: "select" }
  | {
      readonly type: "build";
      readonly kind: BuildingKind;
      readonly rot: number;
    }
  | { readonly type: "road" }
  /** Drag along plain roads to pave them. */
  | { readonly type: "pave" }
  | { readonly type: "demolish" }
  | {
      readonly type: "relocate";
      readonly id: number;
      readonly kind: BuildingKind;
      readonly rot: number;
    }
  | { readonly type: "sail"; readonly ship: number }
  /** Pick the far end of a patrol for ships or land units. */
  | {
      readonly type: "patrol";
      readonly ships: readonly number[];
      readonly soldiers: readonly number[];
    };

/** What lies under the pointer. */
export type Hit =
  | { readonly type: "building"; readonly id: number }
  | { readonly type: "ship"; readonly id: number }
  | { readonly type: "soldier"; readonly id: number }
  | { readonly type: "none" };

/** What is selected: one building or ship, or a group of own units. */
export type Pick =
  | { readonly type: "building"; readonly id: number }
  | { readonly type: "ship"; readonly id: number }
  | {
      readonly type: "units";
      readonly ships: readonly number[];
      readonly soldiers: readonly number[];
    }
  | { readonly type: "none" };

/** Where a right click points: the map point and what lies there. */
export type OrderTarget = {
  /** Map point in tiles (continuous). */
  readonly x: number;
  readonly y: number;
  readonly hit: Hit;
};

/** A hint under the pointer while a tool is active. */
export type Hint =
  | {
      readonly type: "placement";
      readonly issue: PlacementIssue | null;
      readonly noRoad: boolean;
    }
  | {
      readonly type: "road";
      /** True for the paving tool: tiles to pave, with the stone they take. */
      readonly pave: boolean;
      readonly tiles: number;
      readonly gold: number;
      readonly stone: number;
      readonly blocked: boolean;
    }
  | {
      readonly type: "demolish";
      readonly what: "building" | "road" | "nothing";
    }
  | { readonly type: "sail"; readonly water: boolean };

/** What the view tells the game. */
export type ViewCallbacks = {
  /**
   * A click with the select tool.
   *
   * @param hit - what was clicked
   * @param additive - Shift was held: add to the selection
   */
  readonly onPick: (hit: Hit, additive: boolean) => void;
  /**
   * A selection box was drawn.
   *
   * @param ships - own ships inside
   * @param soldiers - own soldiers on land inside
   * @param additive - Shift was held: add to the selection
   */
  readonly onBox: (
    ships: readonly number[],
    soldiers: readonly number[],
    additive: boolean,
  ) => void;
  /** A right click on the map with the select tool. */
  readonly onOrder: (target: OrderTarget) => void;
  /**
   * What lies under the mouse changed.
   *
   * @param hit - the new thing, or none
   * @param x - client pixels of the mouse
   * @param y - client pixels of the mouse
   */
  readonly onHover: (hit: Hit, x: number, y: number) => void;
  readonly onBuild: (
    kind: BuildingKind,
    x: number,
    y: number,
    rot: number,
  ) => void;
  readonly onRoad: (tiles: number[]) => void;
  /** Tiles of a drag with the paving tool. */
  readonly onPave: (tiles: number[]) => void;
  readonly onDemolish: (x: number, y: number) => void;
  readonly onRelocate: (id: number, x: number, y: number, rot: number) => void;
  readonly onSail: (ship: number, x: number, y: number) => void;
  /** The far end of a patrol was picked. */
  readonly onPatrol: (
    ships: readonly number[],
    soldiers: readonly number[],
    x: number,
    y: number,
  ) => void;
  readonly onHint: (hint: Hint | null) => void;
  readonly onCancel: () => void;
  /** A shortcut from the keys (or Shift + wheel to turn a building). */
  readonly onAction: (action: InputAction) => void;
};

/** Settings that change how the view draws. */
export type ViewOptions = {
  readonly shadows: boolean;
  readonly weather: boolean;
  /** Whether the screen edges move the camera. */
  readonly edgeScroll: boolean;
};

/** What drawing costs, measured over the last second. */
export type FrameStats = {
  /** CPU time per frame for updating the scene and issuing the draws, ms. */
  readonly frameMs: number;
  /** Triangles of the last frame. */
  readonly triangles: number;
  /** Draw calls of the last frame. */
  readonly calls: number;
};

/** The handle the game screen holds. */
export type View = {
  setTool(tool: Tool): void;
  setSelection(pick: Pick): void;
  setOptions(options: ViewOptions): void;
  /**
   * Holds the map still while the pause menu covers it.
   *
   * @param blocked - true while the menu is open
   */
  setInputBlocked(blocked: boolean): void;
  /** Glides the camera to a tile. */
  focus(x: number, y: number): void;
  /**
   * Marks where an order was given, for a moment.
   *
   * @param x - tiles
   * @param y - tiles
   */
  flash(x: number, y: number): void;
  /** Where the camera heads, for browser tests. */
  cameraState(): CameraState;
  /**
   * The patch of sea level the camera sees, for the minimap: the four
   * corners of the screen cast onto the water, in tiles, clockwise from the
   * top left. Corners that look at the sky are drawn in to a fixed reach.
   */
  viewArea(): readonly { readonly x: number; readonly y: number }[];
  /**
   * Draws one frame.
   *
   * @param game - the game
   * @param alpha - share of a step since the last simulation step
   * @param dt - real seconds since the last frame
   * @param gameDt - game seconds since the last frame (0 when paused)
   */
  frame(game: Game, alpha: number, dt: number, gameDt: number): void;
  /** Frames per second over the last second. */
  fps(): number;
  /**
   * What the last second of frames cost, for measuring: the CPU time of a
   * frame in ms (scene update and draw calls), and what the last frame drew.
   */
  stats(): FrameStats;
  /**
   * Where a map point appears in the window, for browser tests.
   *
   * @param x - tiles
   * @param y - tiles
   * @returns client pixels
   */
  project(x: number, y: number): { x: number; y: number };
  /**
   * What is around the camera, each 0 to 1, for the sound: darkness,
   * closeness, town, harbour, building sites and battle.
   */
  ambience(): {
    night: number;
    closeness: number;
    city: number;
    harbour: number;
    building: number;
    battle: number;
  };
  /**
   * Shows what happened in the last steps: cannon shots for now.
   *
   * @param events - the game's events since the last frame
   */
  effects(events: readonly GameEvent[]): void;
  dispose(): void;
};

/** Steps of the ground-picking ray march. */
const MARCH_STEP = 0.5;

/** Cannon balls in flight at most. */
const BALLS = 64;

/** Seconds a cannon ball flies. */
const BALL_FLIGHT = 0.45;

/** Seconds between two rebuilds of the busy-road overlay. */
const TRAFFIC_EVERY = 1;

/** Colours of the trade route lines, by route. */
const ROUTE_COLORS = [0xfbbf24, 0x60a5fa, 0xf472b6, 0x34d399, 0xa78bfa];

/** Colour of a producer's mark by how carts reach it: road, open land, not at all. */
const LINK_COLORS: Readonly<Record<LinkKind, number>> = {
  road: 0x4ade80,
  land: 0xfacc15,
  none: 0xef4444,
};

/** Most producer marks drawn. */
const MAX_LINK_MARKS = 600;

/** Radius of a producer mark and its height over the ground, tiles. */
const LINK_MARK_SIZE = 0.32;
const LINK_MARK_HEIGHT = 3.4;

/** Wheel travel that turns a building by one quarter (with Shift). */
const WHEEL_NOTCH = 50;

/** Furthest the ground-picking ray marches, tiles. */
const MARCH_REACH = 900;

/** Halvings that refine where the ray meets the ground. */
const MARCH_REFINE = 8;

/** Height above the ground up to which a ray counts as hitting a building. */
const BUILDING_PICK_HEIGHT = 2.4;

/** Height of the middle of a ship and of a soldier for picking, tiles. */
const SHIP_PICK_HEIGHT = 0.6;
const SOLDIER_PICK_HEIGHT = 0.4;

/** Radius of a ship and of a soldier for picking and rings, tiles. */
const SHIP_RADIUS = 1.4;
const SOLDIER_RADIUS = 0.45;

/** Fewest pixels a unit can be picked from, however small it looks. */
const PICK_MIN_PIXELS = 10;

/** A hovered unit stays hovered this much farther away (no flicker). */
const HOVER_KEEP = 1.35;

/** Seconds between two hover checks while nothing moves (units sail on). */
const HOVER_REFRESH = 0.2;

/** Camera movement below which the hover is not checked again. */
const CAMERA_STILL = 1e-4;

/** Most rings for selected or hovered units. */
const RINGS = 160;

/** Seconds an order marker shows. */
const ORDER_FLASH = 0.7;

/** Rings of the order marker grow from this to the full size. */
const ORDER_FLASH_FROM = 1.8;
const ORDER_FLASH_TO = 0.5;

/** Colours: selection, hover, order marker and the selection box. */
const SELECT_COLOR = 0xfde68a;
const HOVER_COLOR = 0xffffff;
const ORDER_COLOR = 0x86efac;
const BOX_BORDER = "1px solid rgb(226 192 110 / 0.95)";
const BOX_FILL = "rgb(226 192 110 / 0.12)";

/** Screen corners in device coordinates, clockwise from the top left. */
const CORNERS: readonly (readonly [number, number])[] = [
  [-1, 1],
  [1, 1],
  [1, -1],
  [-1, -1],
];

/** How far a corner looking at the sky reaches, in camera distances. */
const SKY_REACH = 4;

/** How far around the camera's target sounds are counted, tiles. */
const HEARING = 26;

/**
 * Creates the view on a canvas.
 *
 * @param canvas - the canvas
 * @param game - the game at start (for the world)
 * @param callbacks - what to call on input
 * @param options - drawing settings
 * @returns the view
 */
export function createView(
  canvas: HTMLCanvasElement,
  game: Game,
  callbacks: ViewCallbacks,
  options: ViewOptions,
): View {
  const world = game.world;
  const n = world.n;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const fog = new THREE.FogExp2(0x9cc9e8, 0.004);
  scene.fog = fog;
  const uniforms = createUniforms();
  const buildingMaterial = createBuildingMaterial(uniforms);
  const terrainMaterial = createTerrainMaterial(uniforms);
  const waterMaterial = createWaterMaterial(uniforms);
  const controller = new CameraController(1, n);
  const camera = controller.camera;
  const start = world.startShip;
  const home = world.islands[world.startIsland];
  controller.jump((start.x + home.cx) / 2, (start.y + home.cy) / 2, 55);

  // Light.
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x55603a, 1.1);
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);

  // Sea.
  const waterGeometry = new THREE.PlaneGeometry(n * 3, n * 3, 160, 160);
  waterGeometry.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.position.set(n / 2, 0, n / 2);
  water.renderOrder = 1;
  scene.add(water);

  const landscape = createLandscape(
    world,
    terrainMaterial,
    waterMaterial,
    uniforms,
  );
  const buildings = createBuildingsLayer(buildingMaterial);
  const units = createUnitsLayer(buildingMaterial);
  const effects = createEffects();
  scene.add(landscape.group, buildings.group, units.group, effects.group);

  // Overlays.
  const overlay = new THREE.Group();
  scene.add(overlay);
  const ghostMaterial = new THREE.MeshBasicMaterial({
    color: 0x4ade80,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const ghostCache = new Map<BuildingKind, THREE.BufferGeometry>();
  const ghost = new THREE.Mesh(new THREE.BufferGeometry(), ghostMaterial);
  ghost.visible = false;
  const padMaterial = new THREE.MeshBasicMaterial({
    color: 0x4ade80,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const pad = new THREE.Mesh(new THREE.BufferGeometry(), padMaterial);
  pad.visible = false;
  const roadPreview = new THREE.Mesh(new THREE.BufferGeometry(), padMaterial);
  roadPreview.visible = false;
  const ringMaterial = new THREE.LineBasicMaterial({
    color: 0xfde68a,
    transparent: true,
    opacity: 0.9,
  });
  const reachMaterial = new THREE.LineBasicMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.55,
  });
  const ring = new THREE.LineLoop(new THREE.BufferGeometry(), ringMaterial);
  ring.visible = false;
  const selectionRing = new THREE.LineLoop(
    new THREE.BufferGeometry(),
    ringMaterial,
  );
  selectionRing.visible = false;
  const reachRings = new THREE.Group();
  // The traffic light of every own producer while building or laying roads.
  const linkGeometry = new THREE.SphereGeometry(LINK_MARK_SIZE, 10, 8);
  const linkMaterial = new THREE.MeshBasicMaterial({
    depthTest: false,
    transparent: true,
  });
  const linkMarks = new THREE.InstancedMesh(
    linkGeometry,
    linkMaterial,
    MAX_LINK_MARKS,
  );
  linkMarks.count = 0;
  linkMarks.frustumCulled = false;
  linkMarks.renderOrder = 10;
  overlay.add(
    ghost,
    pad,
    roadPreview,
    ring,
    selectionRing,
    reachRings,
    linkMarks,
  );
  // Trade routes as lines between the harbours, busy roads in colour.
  const routeMaterial = new THREE.LineDashedMaterial({
    vertexColors: true,
    dashSize: 1.2,
    gapSize: 0.8,
    transparent: true,
    opacity: 0.9,
  });
  const routeLines = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    routeMaterial,
  );
  let routeKey = "";
  const busyMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  const busyRoads = new THREE.Mesh(new THREE.BufferGeometry(), busyMaterial);
  let trafficClock = TRAFFIC_EVERY;
  // Castaways of rescue missions.
  const wreckGeometry = wreckModel();
  const wrecks = new THREE.InstancedMesh(wreckGeometry, buildingMaterial, 8);
  wrecks.count = 0;
  wrecks.frustumCulled = false;
  // Cannon balls.
  const ballGeometry = new THREE.SphereGeometry(0.12, 6, 4);
  const ballMaterial = new THREE.MeshBasicMaterial({ color: 0x1f1f1f });
  const balls = new THREE.InstancedMesh(ballGeometry, ballMaterial, BALLS);
  balls.count = 0;
  balls.frustumCulled = false;
  const flights: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    t: number;
  }[] = [];
  const puffs: { x: number; y: number; z: number; t: number }[] = [];
  let battle = 0;
  overlay.add(routeLines, busyRoads, wrecks, balls);
  // Rings under selected units (gold) and the hovered one (white), the
  // outline of a hovered building and the marker of an order.
  const ringGeometry = new THREE.RingGeometry(0.82, 1, 40);
  ringGeometry.rotateX(-Math.PI / 2);
  const unitRingMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const unitRings = new THREE.InstancedMesh(
    ringGeometry,
    unitRingMaterial,
    RINGS,
  );
  unitRings.count = 0;
  unitRings.frustumCulled = false;
  unitRings.renderOrder = 2;
  const hoverMaterial = new THREE.LineBasicMaterial({
    color: HOVER_COLOR,
    transparent: true,
    opacity: 0.85,
  });
  const hoverOutline = new THREE.LineLoop(
    new THREE.BufferGeometry(),
    hoverMaterial,
  );
  hoverOutline.visible = false;
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: ORDER_COLOR,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const orderFlash = new THREE.Mesh(ringGeometry, flashMaterial);
  orderFlash.visible = false;
  let flashLeft = 0;
  overlay.add(unitRings, hoverOutline, orderFlash);

  let tool: Tool = { type: "select" };
  let selection: Pick = { type: "none" };
  let current = game;
  let builtVersion = -1;
  let hover: { x: number; y: number } | null = null;
  let hintKey = "";
  let roadStart: number | null = null;
  let roadTiles: number[] = [];
  let clock = 0;
  // Time of what lives in the game (gulls, rocking ships, walkers, mills,
  // wrecks): it stands still while the game is paused; the water does not.
  let liveClock = 0;
  let frames = 0;
  let frameCost = 0;
  let lastStats: FrameStats = {
    frameMs: 0,
    triangles: 0,
    calls: 0,
  };
  let fpsValue = 0;
  let fpsClock = 0;
  let lastShadows = !options.shadows;
  let drawOptions = options;

  // ---------------------------------------------------------------- input
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const projected = new THREE.Vector3();
  let pointerAt: { x: number; y: number } | null = null;
  let hoverHit: Hit = { type: "none" };
  let hoverDirty = true;
  let hoverClock = 0;
  let previewKey = "";
  let boxStart: { x: number; y: number } | null = null;
  let wheelTravel = 0;
  let blocked = false;
  const lastEye = new THREE.Vector3();
  const lastLook = new THREE.Quaternion();
  const boxElement = document.createElement("div");
  Object.assign(boxElement.style, {
    position: "absolute",
    display: "none",
    border: BOX_BORDER,
    background: BOX_FILL,
    pointerEvents: "none",
    zIndex: "5",
  });
  canvas.parentElement?.appendChild(boxElement);

  /** Height of the ground (0 at sea) anywhere, also off the map. */
  const heightAt = (x: number, z: number) =>
    x >= 0 && z >= 0 && x < n && z < n
      ? Math.max(0, groundHeight(world, x, z))
      : 0;

  /**
   * Casts the pointer's ray onto the map: where it meets the ground, and the
   * first building whose block it passes through on the way (from the
   * occupancy raster, so tall buildings are picked at their roofs).
   */
  const castRay = (
    clientX: number,
    clientY: number,
  ): { x: number; z: number; building: number } | null => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const origin = raycaster.ray.origin;
    const direction = raycaster.ray.direction;
    let hit: { x: number; z: number; building: number } | null = null;
    let building = -1;
    let previous = 0;
    for (let t = 0; t < MARCH_REACH && hit === null; t += MARCH_STEP) {
      const x = origin.x + direction.x * t;
      const y = origin.y + direction.y * t;
      const z = origin.z + direction.z * t;
      const ground = heightAt(x, z);
      if (building < 0 && x >= 0 && z >= 0 && x < n && z < n) {
        const id = current.occupancy[Math.floor(z) * n + Math.floor(x)] - 1;
        building = id >= 0 && y <= ground + BUILDING_PICK_HEIGHT ? id : -1;
      }
      if (y <= ground) {
        // Refine between the last two samples.
        let low = previous;
        let high = t;
        for (let k = 0; k < MARCH_REFINE; k += 1) {
          const mid = (low + high) / 2;
          const my = origin.y + direction.y * mid;
          if (
            my <=
            heightAt(origin.x + direction.x * mid, origin.z + direction.z * mid)
          ) {
            high = mid;
          } else {
            low = mid;
          }
        }
        hit = {
          x: origin.x + direction.x * high,
          z: origin.z + direction.z * high,
          building,
        };
      }
      previous = t;
    }
    return hit;
  };

  const tileAt = (clientX: number, clientY: number) => {
    const point = castRay(clientX, clientY);
    return point === null
      ? null
      : {
          x: Math.floor(point.x),
          y: Math.floor(point.z),
          px: point.x,
          pz: point.z,
        };
  };

  /** The top-left tile for a footprint centred under the pointer. */
  const anchorFor = (
    kind: BuildingKind,
    rot: number,
    px: number,
    pz: number,
  ) => {
    const { w, h } = footprint(kind, rot);
    return { x: Math.round(px - w / 2), y: Math.round(pz - h / 2) };
  };

  /** Where a map point appears on the screen, or null behind the camera. */
  const screenOf = (x: number, y: number, z: number) => {
    projected.set(x, y, z).project(camera);
    const rect = canvas.getBoundingClientRect();
    return projected.z > 1
      ? null
      : {
          x: rect.left + ((projected.x + 1) / 2) * rect.width,
          y: rect.top + ((1 - projected.y) / 2) * rect.height,
        };
  };

  /** Pixels a map length of 1 covers at a point. */
  const pixelsAt = (x: number, y: number, z: number) =>
    canvas.clientHeight /
    (2 *
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
      Math.max(1, camera.position.distanceTo(projected.set(x, y, z))));

  /** Where a ship is drawn, or null when it is not. */
  const shipPoint = (id: number) => {
    const at = units.shipPosition(id);
    return at === null ? null : { x: at.x, y: SHIP_PICK_HEIGHT, z: at.z };
  };

  /** Where a soldier on land stands. */
  const soldierPoint = (soldier: { x: number; y: number }) => ({
    x: soldier.x,
    y: heightAt(soldier.x, soldier.y) + SOLDIER_PICK_HEIGHT,
    z: soldier.y,
  });

  /**
   * What lies under the pointer: ships and soldiers by their place on the
   * screen (the one hovered keeps a wider reach, so it does not flicker),
   * then buildings by the ray.
   */
  const pickAt = (
    clientX: number,
    clientY: number,
    ray: { building: number } | null,
  ): Hit => {
    let best: Hit = { type: "none" };
    let bestDistance = Number.POSITIVE_INFINITY;
    const consider = (
      hit: Hit,
      point: { x: number; y: number; z: number } | null,
      radius: number,
    ) => {
      const screen =
        point === null ? null : screenOf(point.x, point.y, point.z);
      if (point !== null && screen !== null) {
        const reach =
          Math.max(
            PICK_MIN_PIXELS,
            radius * pixelsAt(point.x, point.y, point.z),
          ) * (sameHit(hit, hoverHit) ? HOVER_KEEP : 1);
        const distance = Math.hypot(screen.x - clientX, screen.y - clientY);
        if (distance < reach && distance < bestDistance) {
          best = hit;
          bestDistance = distance;
        }
      }
    };
    for (const ship of current.ships) {
      if (ship.kind !== "trader") {
        consider(
          { type: "ship", id: ship.id },
          shipPoint(ship.id),
          SHIP_RADIUS,
        );
      }
    }
    for (const soldier of current.soldiers) {
      if (soldier.ship < 0) {
        consider(
          { type: "soldier", id: soldier.id },
          soldierPoint(soldier),
          SOLDIER_RADIUS,
        );
      }
    }
    if (best.type === "none" && ray !== null && ray.building >= 0) {
      best = { type: "building", id: ray.building };
    }
    return best;
  };

  /** The own units whose places lie inside a screen rectangle. */
  const unitsInBox = (x0: number, y0: number, x1: number, y1: number) => {
    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    const top = Math.min(y0, y1);
    const bottom = Math.max(y0, y1);
    const within = (point: { x: number; y: number; z: number } | null) => {
      const screen =
        point === null ? null : screenOf(point.x, point.y, point.z);
      return (
        screen !== null &&
        screen.x >= left &&
        screen.x <= right &&
        screen.y >= top &&
        screen.y <= bottom
      );
    };
    return {
      ships: current.ships
        .filter((ship) => ship.owner === HUMAN && within(shipPoint(ship.id)))
        .map((ship) => ship.id),
      soldiers: current.soldiers
        .filter(
          (soldier) =>
            soldier.owner === HUMAN &&
            soldier.ship < 0 &&
            within(soldierPoint(soldier)),
        )
        .map((soldier) => soldier.id),
    };
  };

  /** A left click (or tap) on the map with the current tool. */
  const click = (clientX: number, clientY: number, modifiers: Modifiers) => {
    const ray = castRay(clientX, clientY);
    if (tool.type === "select") {
      callbacks.onPick(pickAt(clientX, clientY, ray), modifiers.shift);
    } else if (ray !== null) {
      const tx = Math.floor(ray.x);
      const ty = Math.floor(ray.z);
      switch (tool.type) {
        case "build": {
          const at = anchorFor(tool.kind, tool.rot, ray.x, ray.z);
          callbacks.onBuild(tool.kind, at.x, at.y, tool.rot);
          break;
        }
        case "relocate": {
          const at = anchorFor(tool.kind, tool.rot, ray.x, ray.z);
          callbacks.onRelocate(tool.id, at.x, at.y, tool.rot);
          break;
        }
        case "demolish":
          callbacks.onDemolish(tx, ty);
          break;
        case "sail":
          callbacks.onSail(tool.ship, tx, ty);
          break;
        case "patrol":
          callbacks.onPatrol(tool.ships, tool.soldiers, tx, ty);
          break;
        default:
          break;
      }
    }
  };

  /** Shows the selection box between two screen points. */
  const drawBox = (x0: number, y0: number, x1: number, y1: number) => {
    const base = boxElement.parentElement?.getBoundingClientRect();
    if (base !== undefined) {
      Object.assign(boxElement.style, {
        display: "block",
        left: `${Math.min(x0, x1) - base.left}px`,
        top: `${Math.min(y0, y1) - base.top}px`,
        width: `${Math.abs(x1 - x0)}px`,
        height: `${Math.abs(y1 - y0)}px`,
      });
    }
  };

  /** Ends a road or box drag without a result. */
  const endDrag = () => {
    roadStart = null;
    roadTiles = [];
    roadPreview.visible = false;
    boxStart = null;
    boxElement.style.display = "none";
  };

  const input = createInput(canvas, {
    hover(x, y) {
      pointerAt = { x, y };
      hoverDirty = true;
    },
    leave() {
      if (pointerAt !== null) {
        pointerAt = null;
        hoverDirty = true;
      }
    },
    press(x, y) {
      let takes = false;
      if (tool.type === "road" || tool.type === "pave") {
        const tile = tileAt(x, y);
        roadStart =
          tile !== null && inBounds(world, tile.x, tile.y)
            ? tile.y * n + tile.x
            : null;
        updateRoad(x, y);
        takes = true;
      }
      return takes;
    },
    drag(x, y, startX, startY) {
      if (roadStart !== null) {
        updateRoad(x, y);
      } else if (tool.type === "select") {
        boxStart = { x: startX, y: startY };
        drawBox(startX, startY, x, y);
      }
    },
    release(x, y, dragged, modifiers, touch) {
      if (roadStart !== null) {
        if (roadTiles.length > 0 && tool.type === "pave") {
          callbacks.onPave(roadTiles);
        } else if (roadTiles.length > 0) {
          callbacks.onRoad(roadTiles);
        }
      } else if (boxStart !== null) {
        const found = unitsInBox(boxStart.x, boxStart.y, x, y);
        callbacks.onBox(found.ships, found.soldiers, modifiers.shift);
      } else if (!dragged) {
        if (touch) {
          updateHover(x, y);
        }
        click(x, y, modifiers);
      }
      endDrag();
    },
    cancelDrag: endDrag,
    secondary(x, y) {
      if (tool.type !== "select") {
        callbacks.onCancel();
      } else {
        const ray = castRay(x, y);
        if (ray !== null) {
          callbacks.onOrder({ x: ray.x, y: ray.z, hit: pickAt(x, y, ray) });
        }
      }
    },
    pan(dx, dy) {
      controller.panPixels(dx, dy, canvas.clientHeight);
    },
    turn(dx, dy) {
      controller.turnPixels(dx, dy);
    },
    pinch(factor, angle) {
      controller.zoomBy(factor);
      controller.turnBy(angle);
    },
    wheel(delta, x, y, modifiers) {
      const placing = tool.type === "build" || tool.type === "relocate";
      if (placing && modifiers.shift) {
        wheelTravel += delta;
        if (Math.abs(wheelTravel) >= WHEEL_NOTCH) {
          callbacks.onAction({
            type: "rotate",
            step: wheelTravel > 0 ? 1 : -1,
          });
          wheelTravel = 0;
        }
      } else {
        controller.wheel(delta, modifiers.ctrl, castRay(x, y));
      }
    },
    action(action) {
      callbacks.onAction(action);
    },
  });
  input.setEdgeScroll(options.edgeScroll);

  // ---------------------------------------------------------------- overlays
  const setHint = (hint: Hint | null) => {
    const key = JSON.stringify(hint);
    if (key !== hintKey) {
      hintKey = key;
      callbacks.onHint(hint);
    }
  };

  /**
   * Looks at what lies under the mouse: the map point for the tools and the
   * thing for the hover outline and the tooltip.
   */
  const updateHover = (clientX: number, clientY: number) => {
    const ray = castRay(clientX, clientY);
    hover = ray === null ? null : { x: ray.x, y: ray.z };
    setHover(
      tool.type === "select" ? pickAt(clientX, clientY, ray) : { type: "none" },
      clientX,
      clientY,
    );
    // The preview only changes from one half tile to the next.
    const key =
      hover === null
        ? ""
        : `${Math.floor(hover.x * 2)},${Math.floor(hover.y * 2)}`;
    if (key !== previewKey) {
      previewKey = key;
      refreshPreview();
    }
  };

  /** Notes a new thing under the mouse and outlines a building. */
  const setHover = (hit: Hit, clientX: number, clientY: number) => {
    if (!sameHit(hit, hoverHit)) {
      hoverHit = hit;
      callbacks.onHover(hit, clientX, clientY);
      hoverOutline.visible = false;
      if (hit.type === "building") {
        const building = current.buildings.find((b) => b.id === hit.id);
        if (building !== undefined) {
          setRectangle(
            hoverOutline,
            building.x,
            building.y,
            building.w,
            building.h,
          );
          hoverOutline.visible = true;
        }
      }
    }
  };

  /** The mouse left the map: no preview, no outline, no tooltip. */
  const clearHover = () => {
    hover = null;
    previewKey = "";
    setHover({ type: "none" }, 0, 0);
    refreshPreview();
  };

  /** A frame of lines around a block of tiles, along the ground. */
  const setRectangle = (
    line: THREE.LineLoop,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    const points: number[] = [];
    const corners = [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ];
    corners.forEach(([cx, cy], k) => {
      const [nx, ny] = corners[(k + 1) % corners.length];
      const steps = Math.max(1, Math.round(Math.hypot(nx - cx, ny - cy)));
      for (let step = 0; step < steps; step += 1) {
        const px = cx + ((nx - cx) * step) / steps;
        const py = cy + ((ny - cy) * step) / steps;
        points.push(px, Math.max(0, cornerHeight(world, px, py)) + 0.2, py);
      }
    });
    line.geometry.dispose();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3),
    );
    line.geometry = geometry;
  };

  /** Rings under the selected units and the hovered one, each frame. */
  const placeRings = () => {
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    let count = 0;
    const ring = (
      point: { x: number; y: number; z: number } | null,
      radius: number,
      hex: number,
    ) => {
      if (point !== null && count < RINGS) {
        matrix.makeScale(radius, 1, radius);
        matrix.setPosition(point.x, point.y, point.z);
        unitRings.setMatrixAt(count, matrix);
        unitRings.setColorAt(count, color.setHex(hex));
        count += 1;
      }
    };
    const soldierById = new Map(current.soldiers.map((s) => [s.id, s]));
    const shipRing = (id: number, hex: number) => {
      const at = units.shipPosition(id);
      ring(at === null ? null : { x: at.x, y: 0.12, z: at.z }, 1.6, hex);
    };
    const soldierRing = (id: number, hex: number) => {
      const soldier = soldierById.get(id);
      ring(
        soldier === undefined || soldier.ship >= 0
          ? null
          : {
              x: soldier.x,
              y: heightAt(soldier.x, soldier.y) + 0.06,
              z: soldier.y,
            },
        SOLDIER_RADIUS + 0.1,
        hex,
      );
    };
    if (selection.type === "ship") {
      shipRing(selection.id, SELECT_COLOR);
    } else if (selection.type === "units") {
      selection.ships.forEach((id) => shipRing(id, SELECT_COLOR));
      selection.soldiers.forEach((id) => soldierRing(id, SELECT_COLOR));
    }
    if (hoverHit.type === "ship") {
      shipRing(hoverHit.id, HOVER_COLOR);
    } else if (hoverHit.type === "soldier") {
      soldierRing(hoverHit.id, HOVER_COLOR);
    }
    unitRings.count = count;
    unitRings.instanceMatrix.needsUpdate = true;
    if (unitRings.instanceColor !== null) {
      unitRings.instanceColor.needsUpdate = true;
    }
  };

  /** Lets the order marker shrink and fade. */
  const fadeFlash = (dt: number) => {
    flashLeft = Math.max(0, flashLeft - dt);
    const share = flashLeft / ORDER_FLASH;
    orderFlash.visible = flashLeft > 0;
    flashMaterial.opacity = share;
    const radius = ORDER_FLASH_TO + (ORDER_FLASH_FROM - ORDER_FLASH_TO) * share;
    orderFlash.scale.set(radius, 1, radius);
  };

  /**
   * Checks the hover again when the mouse or the camera moved, and now and
   * then for units that sail or walk under a resting mouse.
   */
  const followPointer = (dt: number) => {
    hoverClock += dt;
    const moved =
      camera.position.distanceToSquared(lastEye) > CAMERA_STILL ||
      camera.quaternion.angleTo(lastLook) > CAMERA_STILL;
    lastEye.copy(camera.position);
    lastLook.copy(camera.quaternion);
    if (pointerAt === null || blocked) {
      if (hoverDirty) {
        clearHover();
      }
    } else if (hoverDirty || moved || hoverClock >= HOVER_REFRESH) {
      updateHover(pointerAt.x, pointerAt.y);
      hoverClock = 0;
    }
    hoverDirty = false;
  };

  const refreshPreview = () => {
    ghost.visible = false;
    pad.visible = false;
    ring.visible = false;
    if (hover === null || tool.type === "select") {
      setHint(null);
    } else if (tool.type === "build" || tool.type === "relocate") {
      const kind = tool.kind;
      const at = anchorFor(kind, tool.rot, hover.x, hover.y);
      const check = checkPlacement(
        current,
        HUMAN,
        kind,
        at.x,
        at.y,
        tool.rot,
        tool.type === "relocate" ? tool.id : null,
      );
      const ok = check.issue === null;
      const color = ok ? (check.noRoad ? 0xfacc15 : 0x4ade80) : 0xef4444;
      ghostMaterial.color.setHex(color);
      padMaterial.color.setHex(color);
      let geometry = ghostCache.get(kind);
      if (geometry === undefined) {
        geometry = buildingModel(kind, 0);
        ghostCache.set(kind, geometry);
      }
      ghost.geometry = geometry;
      const cx = at.x + check.w / 2;
      const cz = at.y + check.h / 2;
      const floor = inBounds(world, at.x, at.y)
        ? Math.max(0, groundHeight(world, cx, cz))
        : 0;
      ghost.position.set(cx, floor + 0.05, cz);
      ghost.rotation.set(0, (-tool.rot * Math.PI) / 2, 0);
      ghost.visible = true;
      setPad(pad, at.x, at.y, check.w, check.h);
      const radius = Math.max(BUILDING[kind].radius, BUILDING[kind].influence);
      if (radius > 0) {
        setCircle(ring, cx, cz, radius);
        ring.visible = true;
      }
      setHint({ type: "placement", issue: check.issue, noRoad: check.noRoad });
    } else if (tool.type === "demolish") {
      const x = Math.floor(hover.x);
      const y = Math.floor(hover.y);
      const building = buildingAt(current, x, y);
      const road =
        inBounds(world, x, y) && current.roads[y * n + x] !== NO_ROAD;
      padMaterial.color.setHex(0xef4444);
      if (building !== null) {
        setPad(pad, building.x, building.y, building.w, building.h);
      } else if (road) {
        setPad(pad, x, y, 1, 1);
      }
      pad.visible = building !== null || road;
      setHint({
        type: "demolish",
        what: building !== null ? "building" : road ? "road" : "nothing",
      });
    } else if (tool.type === "sail" || tool.type === "patrol") {
      const x = Math.floor(hover.x);
      const y = Math.floor(hover.y);
      let water = !inBounds(world, x, y) || buildingAt(current, x, y) !== null;
      for (let dy = -3; dy <= 3 && !water; dy += 1) {
        for (let dx = -3; dx <= 3 && !water; dx += 1) {
          water =
            inBounds(world, x + dx, y + dy) &&
            isSea(world.terrain[(y + dy) * n + x + dx] as Terrain);
        }
      }
      setHint({ type: "sail", water });
    } else if (roadStart === null) {
      setHint({
        type: "road",
        pave: tool.type === "pave",
        tiles: 0,
        gold: 0,
        stone: 0,
        blocked: false,
      });
    }
  };

  const updateRoad = (clientX: number, clientY: number) => {
    const tile = tileAt(clientX, clientY);
    if (
      roadStart !== null &&
      tile !== null &&
      inBounds(world, tile.x, tile.y)
    ) {
      const paving = tool.type === "pave";
      const to = tile.y * n + tile.x;
      const path = paving
        ? planPave(current, HUMAN, roadStart, to)
        : planRoad(current, HUMAN, roadStart, to);
      roadTiles = path ?? [];
      const price = paving
        ? pavePrice(current, roadTiles)
        : { ...roadPrice(current, roadTiles), stone: 0 };
      const stock =
        current.islands[world.islandOf[roadStart]]?.stock.stone ?? 0;
      const affordable =
        current.players[HUMAN].gold >= price.gold && stock >= price.stone;
      padMaterial.color.setHex(
        path === null || !affordable ? 0xef4444 : paving ? 0xd4d4d8 : 0xfacc15,
      );
      roadPreview.geometry.dispose();
      roadPreview.geometry = tilesGeometry(
        path ?? [roadStart, tile.y * n + tile.x],
      );
      roadPreview.visible = true;
      setHint({
        type: "road",
        pave: paving,
        tiles: price.fresh.length,
        gold: price.gold,
        stone: price.stone,
        blocked: path === null,
      });
    }
  };

  const setPad = (
    mesh: THREE.Mesh,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    const tiles: number[] = [];
    for (let ty = y; ty < y + h; ty += 1) {
      for (let tx = x; tx < x + w; tx += 1) {
        if (inBounds(world, tx, ty)) {
          tiles.push(ty * n + tx);
        }
      }
    }
    mesh.geometry.dispose();
    mesh.geometry = tilesGeometry(tiles);
    mesh.visible = true;
  };

  const tilesGeometry = (tiles: readonly number[]) => {
    const positions: number[] = [];
    for (const index of tiles) {
      const x = index % n;
      const y = Math.floor(index / n);
      const h = (cx: number, cy: number) =>
        Math.max(0.02, cornerHeight(world, cx, cy)) + 0.08;
      positions.push(
        x,
        h(x, y),
        y,
        x,
        h(x, y + 1),
        y + 1,
        x + 1,
        h(x + 1, y),
        y,
        x + 1,
        h(x + 1, y),
        y,
        x,
        h(x, y + 1),
        y + 1,
        x + 1,
        h(x + 1, y + 1),
        y + 1,
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return geometry;
  };

  const setCircle = (
    line: THREE.LineLoop,
    cx: number,
    cz: number,
    radius: number,
  ) => {
    const points: number[] = [];
    const segments = 72;
    for (let k = 0; k < segments; k += 1) {
      const angle = (k / segments) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const z = cz + Math.sin(angle) * radius;
      const inside = x >= 0 && z >= 0 && x < n && z < n;
      points.push(
        x,
        (inside ? Math.max(0, groundHeight(world, x, z)) : 0) + 0.25,
        z,
      );
    }
    line.geometry.dispose();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3),
    );
    line.geometry = geometry;
  };

  /** Coloured marks over the own producers: road, open land, no way. */
  const refreshLinks = () => {
    const showing =
      tool.type === "build" ||
      tool.type === "road" ||
      tool.type === "pave" ||
      tool.type === "relocate";
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    let count = 0;
    for (const building of showing ? current.buildings : []) {
      if (
        building.prod !== null &&
        count < MAX_LINK_MARKS &&
        current.islands[building.island].owner === HUMAN
      ) {
        const cx = building.x + building.w / 2;
        const cz = building.y + building.h / 2;
        matrix.makeTranslation(
          cx,
          Math.max(0, groundHeight(world, cx, cz)) + LINK_MARK_HEIGHT,
          cz,
        );
        linkMarks.setMatrixAt(count, matrix);
        linkMarks.setColorAt(
          count,
          color.setHex(LINK_COLORS[linkKind(current, building)]),
        );
        count += 1;
      }
    }
    linkMarks.count = count;
    linkMarks.instanceMatrix.needsUpdate = true;
    if (linkMarks.instanceColor !== null) {
      linkMarks.instanceColor.needsUpdate = true;
    }
  };

  const refreshReach = () => {
    refreshLinks();
    for (const child of [...reachRings.children]) {
      reachRings.remove(child);
      (child as THREE.LineLoop).geometry.dispose();
    }
    const showing =
      tool.type === "build" && BUILDING[tool.kind].recipe !== null;
    if (showing) {
      for (const building of current.buildings) {
        if (WAREHOUSE_KINDS.includes(building.kind)) {
          const line = new THREE.LineLoop(
            new THREE.BufferGeometry(),
            reachMaterial,
          );
          setCircle(
            line,
            building.x + building.w / 2,
            building.y + building.h / 2,
            BUILDING[building.kind].radius,
          );
          reachRings.add(line);
        }
      }
    }
  };

  /** The circle around a selected building (units get rings each frame). */
  const refreshSelection = () => {
    selectionRing.visible = false;
    if (selection.type === "building") {
      const id = selection.id;
      const building = current.buildings.find((b) => b.id === id);
      if (building !== undefined) {
        const radius = BUILDING[building.kind].radius;
        setCircle(
          selectionRing,
          building.x + building.w / 2,
          building.y + building.h / 2,
          radius > 0 ? radius : Math.max(building.w, building.h) * 0.75,
        );
        selectionRing.visible = true;
      }
    }
  };

  // ---------------------------------------------------------------- frame
  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (
      canvas.width !== Math.floor(width * renderer.getPixelRatio()) ||
      canvas.height !== Math.floor(height * renderer.getPixelRatio())
    ) {
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    }
  };

  const sky = new THREE.Color();
  const dayColor = new THREE.Color(0x9cc9e8);
  const duskColor = new THREE.Color(0xe7a774);
  const nightColor = new THREE.Color(0x0c1322);
  const stormColor = new THREE.Color(0x5d6b78);

  const lightAndSky = (frameGame: Game, dt: number) => {
    const fraction = dayFraction(frameGame.time);
    const angle = (fraction - 0.25) * Math.PI * 2;
    const elevation = Math.sin(angle);
    const daylight = THREE.MathUtils.smoothstep(elevation, -0.12, 0.25);
    const night = 1 - daylight;
    const dusk = Math.max(0, 1 - Math.abs(elevation) * 4) * 0.9;
    const weather = frameGame.weather;
    const gloom =
      weather === "storm"
        ? 0.55
        : weather === "rain"
          ? 0.3
          : weather === "fog"
            ? 0.2
            : 0;
    sky
      .copy(dayColor)
      .lerp(duskColor, dusk)
      .lerp(nightColor, night)
      .lerp(stormColor, gloom * daylight);
    scene.background = sky;
    fog.color.copy(sky);
    const fogTarget =
      (weather === "fog"
        ? 0.022
        : weather === "storm"
          ? 0.011
          : weather === "rain"
            ? 0.0075
            : 0.0032) * (drawOptions.weather ? 1 : 0.6);
    fog.density += (fogTarget - fog.density) * Math.min(1, dt * 0.8);
    const direction = new THREE.Vector3(
      Math.cos(angle) * 0.75,
      Math.max(0.15, elevation),
      0.45,
    ).normalize();
    if (elevation < 0) {
      // The moon stands opposite.
      direction
        .set(-Math.cos(angle) * 0.6, Math.max(0.3, -elevation), -0.4)
        .normalize();
    }
    const flash = effects.flash;
    sun.color
      .setHex(elevation < 0 ? 0x8fa8d8 : 0xffffff)
      .lerp(duskColor, dusk * 0.6);
    sun.intensity = (elevation < 0 ? 0.35 : 2.6 * daylight) * (1 - gloom * 0.6);
    hemi.intensity = (0.35 + 0.85 * daylight) * (1 - gloom * 0.3) + flash * 2.5;
    hemi.color.setHex(0xcfe6ff).lerp(new THREE.Color(0x40507a), night);
    uniforms.night.value = night;
    uniforms.sun.value.copy(direction);
    uniforms.sunColor.value.copy(sun.color).multiplyScalar(daylight);
    uniforms.waves.value +=
      ((weather === "storm" ? 2.6 : weather === "rain" ? 1.4 : 1) -
        uniforms.waves.value) *
      Math.min(1, dt);
    const target = controller.target;
    const shadowSize = THREE.MathUtils.clamp(controller.distance * 0.9, 18, 80);
    sun.position.set(
      target.x + direction.x * 90,
      direction.y * 90,
      target.y + direction.z * 90,
    );
    sun.target.position.set(target.x, 0, target.y);
    const shadowCamera = sun.shadow.camera;
    shadowCamera.left = -shadowSize;
    shadowCamera.right = shadowSize;
    shadowCamera.top = shadowSize;
    shadowCamera.bottom = -shadowSize;
    shadowCamera.far = 220;
    shadowCamera.updateProjectionMatrix();
    // Seasons: snow and foliage.
    const season = seasonAt(frameGame.time);
    const progress = seasonProgress(frameGame.time);
    const index = SEASONS.indexOf(season);
    const snow =
      season === "winter"
        ? THREE.MathUtils.smoothstep(progress, 0, 0.25) *
          (1 - THREE.MathUtils.smoothstep(progress, 0.8, 1))
        : 0;
    uniforms.snow.value = snow;
    return {
      night,
      foliage: foliageTint(index, progress),
      rain: drawOptions.weather
        ? weather === "storm"
          ? 2
          : weather === "rain"
            ? 1
            : 0
        : 0,
    };
  };

  /** Dashed lines from harbour to harbour for each of the player's routes. */
  const refreshRoutes = (frameGame: Game) => {
    const stops = frameGame.routes
      .filter((route) => route.owner === HUMAN)
      .map((route) => route.stops.map((stop) => stop.island));
    const key = JSON.stringify(stops);
    if (key !== routeKey) {
      routeKey = key;
      const positions: number[] = [];
      const colors: number[] = [];
      const color = new THREE.Color();
      stops.forEach((list, index) => {
        color.setHex(ROUTE_COLORS[index % ROUTE_COLORS.length]);
        const points = list
          .map((island) => kontorOf(frameGame, island))
          .map((kontor) =>
            kontor === null ? null : berthOf(frameGame, kontor),
          )
          .filter((berth): berth is number => berth !== null && berth >= 0)
          .map((berth) => [(berth % n) + 0.5, Math.floor(berth / n) + 0.5]);
        points.forEach((point, k) => {
          const next = points[(k + 1) % points.length];
          if (
            points.length > 1 &&
            (k + 1 < points.length || points.length > 2)
          ) {
            positions.push(point[0], 0.5, point[1], next[0], 0.5, next[1]);
            colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
          }
        });
      });
      routeLines.geometry.dispose();
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3),
      );
      routeLines.geometry = geometry;
      routeLines.computeLineDistances();
    }
  };

  /** Colours road tiles by how many carts plan to use them. */
  const refreshTraffic = (frameGame: Game) => {
    const positions: number[] = [];
    const colors: number[] = [];
    const color = new THREE.Color();
    for (let i = 0; i < n * n; i += 1) {
      const load = frameGame.traffic[i];
      if (frameGame.roads[i] !== NO_ROAD && load >= BUSY_ROAD - 2) {
        const x = i % n;
        const y = Math.floor(i / n);
        const heat = Math.min(1, (load - (BUSY_ROAD - 2)) / BUSY_ROAD);
        color.setHex(0xfacc15).lerp(new THREE.Color(0xdc2626), heat);
        const h = (cx: number, cy: number) =>
          Math.max(0.02, cornerHeight(world, cx, cy)) + 0.09;
        positions.push(
          x + 0.2,
          h(x, y),
          y + 0.2,
          x + 0.2,
          h(x, y + 1),
          y + 0.8,
          x + 0.8,
          h(x + 1, y),
          y + 0.2,
          x + 0.8,
          h(x + 1, y),
          y + 0.2,
          x + 0.2,
          h(x, y + 1),
          y + 0.8,
          x + 0.8,
          h(x + 1, y + 1),
          y + 0.8,
        );
        for (let k = 0; k < 6; k += 1) {
          colors.push(color.r, color.g, color.b);
        }
      }
    }
    busyRoads.geometry.dispose();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    busyRoads.geometry = geometry;
  };

  /** Rafts of castaways waiting in rescue missions. */
  const refreshWrecks = (frameGame: Game, time: number) => {
    let count = 0;
    const matrix = new THREE.Matrix4();
    for (const mission of frameGame.missions) {
      const waiting =
        mission.kind === "rescue" &&
        mission.carrier < 0 &&
        (mission.state === "offered" || mission.state === "active");
      if (waiting && count < 8) {
        matrix.makeRotationY(time * 0.2 + mission.id);
        matrix.setPosition(
          mission.x,
          Math.sin(time * 1.4 + mission.id) * 0.05,
          mission.y,
        );
        wrecks.setMatrixAt(count, matrix);
        count += 1;
      }
    }
    wrecks.count = count;
    wrecks.instanceMatrix.needsUpdate = true;
  };

  /** Moves cannon balls along and lets them vanish where they hit. */
  const flyBalls = (dt: number) => {
    const matrix = new THREE.Matrix4();
    for (const flight of flights) {
      flight.t += dt / BALL_FLIGHT;
    }
    for (const done of flights.filter((f) => f.t >= 1)) {
      puffs.push({ x: done.x2, y: 0.6, z: done.y2, t: 0.6 });
      flights.splice(flights.indexOf(done), 1);
    }
    flights.forEach((flight, index) => {
      const x = flight.x1 + (flight.x2 - flight.x1) * flight.t;
      const z = flight.y1 + (flight.y2 - flight.y1) * flight.t;
      const arc = Math.sin(flight.t * Math.PI) * 1.6 + 0.8;
      matrix.makeTranslation(x, arc, z);
      balls.setMatrixAt(index, matrix);
    });
    balls.count = flights.length;
    balls.instanceMatrix.needsUpdate = true;
    for (const puff of puffs) {
      puff.t -= dt;
    }
    for (const gone of puffs.filter((p) => p.t <= 0)) {
      puffs.splice(puffs.indexOf(gone), 1);
    }
    battle = Math.max(0, battle - dt * 0.4);
  };

  /** How much of a kind of thing lies near the camera's target, 0 to 1. */
  const nearby = (frameGame: Game) => {
    const target = controller.target;
    let houses = 0;
    let sites = 0;
    let harbour = 0;
    for (const building of frameGame.buildings) {
      const distance = Math.hypot(building.x - target.x, building.y - target.y);
      if (distance < HEARING) {
        const weight = 1 - distance / HEARING;
        if (building.house !== null) {
          houses += weight * (building.house.residents / 10);
        } else if (!building.complete) {
          sites += weight;
        } else if (building.kind === "kontor" || building.kind === "shipyard") {
          harbour = Math.max(harbour, weight);
        }
      }
    }
    const ships = frameGame.ships.filter(
      (ship) => Math.hypot(ship.x - target.x, ship.y - target.y) < HEARING / 2,
    ).length;
    return {
      city: Math.min(1, houses / 12),
      building: Math.min(1, sites / 2),
      harbour: Math.min(1, harbour * (0.5 + ships * 0.25)),
    };
  };
  let around = { city: 0, building: 0, harbour: 0 };

  const view: View = {
    setTool(next) {
      tool = next;
      endDrag();
      wheelTravel = 0;
      hoverDirty = true;
      previewKey = "";
      refreshPreview();
      refreshReach();
    },
    setSelection(pick) {
      selection = pick;
      refreshSelection();
    },
    setOptions(next) {
      drawOptions = next;
      input.setEdgeScroll(next.edgeScroll);
    },
    setInputBlocked(next) {
      blocked = next;
      input.setBlocked(next);
      hoverDirty = true;
    },
    focus(x, y) {
      controller.focus(x, y);
    },
    flash(x, y) {
      orderFlash.position.set(x, heightAt(x, y) + 0.15, y);
      flashLeft = ORDER_FLASH;
    },
    cameraState() {
      return controller.state();
    },
    viewArea() {
      const reach = controller.distance * SKY_REACH;
      const target = controller.target;
      return CORNERS.map(([cx, cy]) => {
        ndc.set(cx, cy);
        raycaster.setFromCamera(ndc, camera);
        const { origin, direction } = raycaster.ray;
        const t =
          direction.y < 0 ? -origin.y / direction.y : Number.POSITIVE_INFINITY;
        let x = origin.x + direction.x * Math.min(t, reach * 2);
        let y = origin.z + direction.z * Math.min(t, reach * 2);
        const far = Math.hypot(x - target.x, y - target.y);
        if (far > reach) {
          x = target.x + ((x - target.x) / far) * reach;
          y = target.y + ((y - target.y) / far) * reach;
        }
        return { x, y };
      });
    },
    frame(frameGame, alpha, dt, gameDt) {
      const frameStart = performance.now();
      current = frameGame;
      resize();
      clock += dt;
      liveClock += gameDt > 0 ? dt : 0;
      uniforms.time.value = clock;
      if (builtVersion !== frameGame.version) {
        builtVersion = frameGame.version;
        landscape.rebuild(frameGame);
        buildings.rebuild(frameGame);
        refreshSelection();
        refreshReach();
        refreshPreview();
      }
      if (lastShadows !== drawOptions.shadows) {
        lastShadows = drawOptions.shadows;
        renderer.shadowMap.enabled = drawOptions.shadows;
        sun.castShadow = drawOptions.shadows;
        scene.traverse((object) => {
          const material = (object as THREE.Mesh).material as
            THREE.Material | undefined;
          if (material !== undefined) {
            material.needsUpdate = true;
          }
        });
      }
      const target = controller.target;
      const under = heightAt(target.x, target.y);
      controller.update(dt, input.motion(), heightAt);
      // The camera matrices are needed now for the hover ray.
      camera.updateMatrixWorld();
      followPointer(dt);
      const look = lightAndSky(frameGame, dt);
      const showBorder =
        tool.type === "build" ||
        tool.type === "road" ||
        tool.type === "pave" ||
        tool.type === "relocate";
      landscape.update(camera, target, showBorder, look.foliage);
      buildings.animate(liveClock);
      units.update(frameGame, alpha, liveClock, dt, gameDt > 0, target);
      refreshRoutes(frameGame);
      refreshWrecks(frameGame, liveClock);
      flyBalls(dt);
      trafficClock += dt;
      if (trafficClock >= TRAFFIC_EVERY) {
        trafficClock = 0;
        refreshTraffic(frameGame);
        around = nearby(frameGame);
      }
      effects.update(
        gameDt > 0 ? dt : 0,
        [
          ...buildings.smoke(frameGame),
          ...puffs.map((puff) => ({ ...puff, strength: 4 })),
        ],
        look.rain,
        new THREE.Vector3(target.x, Math.max(0, under), target.y),
        look.night,
      );
      placeRings();
      fadeFlash(dt);
      renderer.render(scene, camera);
      frames += 1;
      frameCost += performance.now() - frameStart;
      fpsClock += dt;
      if (fpsClock >= 1) {
        fpsValue = Math.round(frames / fpsClock);
        lastStats = {
          frameMs: frameCost / Math.max(1, frames),
          triangles: renderer.info.render.triangles,
          calls: renderer.info.render.calls,
        };
        frames = 0;
        frameCost = 0;
        fpsClock = 0;
      }
    },
    fps() {
      return fpsValue;
    },
    stats() {
      return lastStats;
    },
    project(x, y) {
      const inside = x >= 0 && y >= 0 && x < n && y < n;
      const point = new THREE.Vector3(
        x,
        inside ? Math.max(0, groundHeight(world, x, y)) : 0,
        y,
      ).project(camera);
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.left + ((point.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - point.y) / 2) * rect.height,
      };
    },
    ambience() {
      const closeness =
        1 - THREE.MathUtils.clamp((controller.distance - 10) / 80, 0, 1);
      return {
        night: uniforms.night.value,
        closeness,
        city: around.city * closeness,
        harbour: around.harbour * closeness,
        building: around.building * closeness,
        battle: Math.min(1, battle),
      };
    },
    effects(events) {
      const target = controller.target;
      for (const event of events) {
        if (event.type === "shot" && flights.length < BALLS) {
          flights.push({
            x1: event.x1,
            y1: event.y1,
            x2: event.x2,
            y2: event.y2,
            t: 0,
          });
          puffs.push({ x: event.x1, y: 0.9, z: event.y1, t: 0.4 });
          const distance = Math.hypot(event.x1 - target.x, event.y1 - target.y);
          battle += distance < HEARING * 2 ? 0.35 : 0.05;
        }
      }
    },
    dispose() {
      input.dispose();
      boxElement.remove();
      ringGeometry.dispose();
      hoverOutline.geometry.dispose();
      unitRings.dispose();
      landscape.dispose();
      buildings.dispose();
      units.dispose();
      effects.dispose();
      for (const geometry of ghostCache.values()) {
        geometry.dispose();
      }
      waterGeometry.dispose();
      routeLines.geometry.dispose();
      busyRoads.geometry.dispose();
      wreckGeometry.dispose();
      ballGeometry.dispose();
      wrecks.dispose();
      balls.dispose();
      linkGeometry.dispose();
      linkMarks.dispose();
      for (const material of [
        buildingMaterial,
        terrainMaterial,
        waterMaterial,
        ghostMaterial,
        padMaterial,
        ringMaterial,
        reachMaterial,
        unitRingMaterial,
        hoverMaterial,
        flashMaterial,
        routeMaterial,
        busyMaterial,
        ballMaterial,
        linkMaterial,
      ]) {
        material.dispose();
      }
      renderer.dispose();
    },
  };
  return view;
}
/**
 * Whether two hits name the same thing.
 *
 * @param a - one hit
 * @param b - the other
 * @returns true for the same kind and id, or both none
 */
function sameHit(a: Hit, b: Hit): boolean {
  return (
    a.type === b.type && (a.type === "none" || ("id" in b && a.id === b.id))
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
