/**
 * The standing city in 3D: houses with windows and roofs, signs over the
 * doors that have one, trees, street lamps, traffic lights and fences.
 *
 * @module
 * @remarks
 * Built once, because the city never changes - `createCity` takes no seed.
 * The houses are read off the floor rather than off the 2D picture: every
 * square the engine calls a building is one, as tall as {@link roofAt} says,
 * which is the height a man with a jetpack lands on. Neighbouring squares of
 * the same building are merged into boxes, and the boxes into one geometry
 * per district of the map, so the whole skyline is a few dozen draw calls
 * and the parts behind the camera are not drawn at all.
 */
import * as THREE from "three";
import {
  buildingAt,
  cellUnder,
  lightAt,
  lightColour,
  prisonUnder,
  roofAt,
} from "@/games/gta/engine/city";
import {
  BASE_HUTS,
  CITY_SIZE,
  CITY_TILES,
  FARMS,
  BLOCK_TILES,
  TILE,
  type GameState,
  type Island,
} from "@/games/gta/engine/types";
import { treeAt } from "@/games/gta/components/render";
import { Bin, HEIGHT_SCALE, dice, hex, yawOf } from "./kit";
import {
  createGlow,
  createSolid,
  createWalls,
  facadeTexture,
  type Uniforms3d,
} from "./materials";
import {
  LAMP_HIGH,
  LAMP_REACH,
  ModelBuilder,
  SIGNAL_HIGH,
  crownTints,
  lampModel,
  signalModel,
  treeModel,
} from "./models";
import type { Quality3d } from "./quality";

/** The standing city, and what in it changes from frame to frame. */
export type City3d = {
  /** Everything, ready to go into the scene. */
  readonly group: THREE.Group;
  /**
   * Brings the traffic lights and the lamps up to date.
   *
   * @param state - the city, for the clock
   * @param night - nought by day to one at night
   */
  readonly update: (state: GameState, night: number) => void;
};

/** One box of a building, in squares, and what it looks like. */
type Block3d = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  /** How tall, in 3D pixels. */
  readonly high: number;
  readonly wall: number;
  readonly roof: number;
  /** What is written over the door, or empty. */
  readonly name: string;
  /** The colour of the sign. */
  readonly sign: string;
  /** Which building this box belongs to. */
  readonly owner: number;
  /** Whether it has windows at all - a barn has none. */
  readonly windows: boolean;
};

/** What one building square belongs to. */
type Owner = {
  readonly key: string;
  readonly wall: number;
  readonly roof: number;
  readonly name: string;
  readonly sign: string;
  readonly windows: boolean;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- the city's furniture:
   sizes, spacings and colours of walls, roofs, lamps and wires, in pixels */

/** How many squares a district of the map is across, for culling. */
const REGION_TILES = BLOCK_TILES * 4;

/** One window and the wall round it: how wide and how tall. */
const WINDOW_WIDE = 22;
const STOREY = 26;

/** The barns, and the sheds of the military base. */
const BARN = { wall: 0x8b2f24, roof: 0x4a2a22 };
const HUT = { wall: 0x556b2f, roof: 0x5f7333 };

/**
 * Builds the standing city.
 *
 * @param state - the city, for its floor
 * @param uniforms - the shared values
 * @param quality - what this device can carry
 * @param bin - where everything made is kept for freeing
 * @returns the city and how to keep it moving
 */
export function buildCity(
  state: GameState,
  uniforms: Uniforms3d,
  quality: Quality3d,
  bin: Bin,
): City3d {
  const group = new THREE.Group();
  const solid = createSolid(uniforms, "plain", true, bin);
  const tinted = createSolid(uniforms, "paint", true, bin);
  const walls = createWalls(uniforms, facadeTexture(bin), bin);
  const blocks = buildingBoxes(state);
  addBuildings(group, blocks, walls, solid, bin);
  addSigns(group, blocks, bin);
  addTrees(group, state, tinted, quality, bin);
  const lamps = addLamps(group, state, solid, quality, bin);
  const signals = addSignals(group, state, solid, bin);
  addFences(group, state, solid, bin);
  return {
    group,
    update: (now, night) => {
      lamps.material.opacity = night * 0.42;
      lamps.mesh.visible = night > 0.03;
      signals(now);
    },
  };
}

/**
 * Every building square, merged into boxes.
 *
 * @param state - the city floor
 * @returns the boxes, each in one piece of one building
 */
function buildingBoxes(state: GameState): readonly Block3d[] {
  const owners: Owner[] = [];
  const index = new Map<string, number>();
  const grid = new Int32Array(CITY_TILES * CITY_TILES).fill(-1);
  const highs = new Float32Array(CITY_TILES * CITY_TILES);
  for (let row = 0; row < CITY_TILES; row += 1) {
    for (let col = 0; col < CITY_TILES; col += 1) {
      const x = (col + 0.5) * TILE;
      const y = (row + 0.5) * TILE;
      if (cellUnder(state.cells, x, y) === "building") {
        const owner = ownerOf(col, row);
        let at = index.get(owner.key);
        if (at === undefined) {
          at = owners.length;
          owners.push(owner);
          index.set(owner.key, at);
        }
        grid[row * CITY_TILES + col] = at;
        highs[row * CITY_TILES + col] =
          roofAt(state.cells, x, y) * HEIGHT_SCALE;
      }
    }
  }
  const taken = new Uint8Array(CITY_TILES * CITY_TILES);
  const same = (col: number, row: number, id: number, high: number): boolean =>
    col < CITY_TILES &&
    row < CITY_TILES &&
    taken[row * CITY_TILES + col] === 0 &&
    grid[row * CITY_TILES + col] === id &&
    highs[row * CITY_TILES + col] === high;
  const boxes: Block3d[] = [];
  for (let row = 0; row < CITY_TILES; row += 1) {
    for (let col = 0; col < CITY_TILES; col += 1) {
      const id = grid[row * CITY_TILES + col] ?? -1;
      const owner = owners[id];
      if (
        id >= 0 &&
        owner !== undefined &&
        taken[row * CITY_TILES + col] === 0
      ) {
        const high = highs[row * CITY_TILES + col] ?? 0;
        let right = col + 1;
        while (same(right, row, id, high)) {
          right += 1;
        }
        let bottom = row + 1;
        let fits = true;
        while (fits) {
          for (let across = col; across < right && fits; across += 1) {
            fits = same(across, bottom, id, high);
          }
          if (fits) {
            bottom += 1;
          }
        }
        for (let down = row; down < bottom; down += 1) {
          for (let across = col; across < right; across += 1) {
            taken[down * CITY_TILES + across] = 1;
          }
        }
        boxes.push({
          left: col,
          top: row,
          right,
          bottom,
          high,
          wall: owner.wall,
          roof: owner.roof,
          name: owner.name,
          sign: owner.sign,
          owner: id,
          windows: owner.windows,
        });
      }
    }
  }
  return boxes;
}

/**
 * Which building a square belongs to, and its colours.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns its owner
 */
function ownerOf(col: number, row: number): Owner {
  const farm = FARMS.findIndex((box) => inside(box, col, row));
  const hut = BASE_HUTS.findIndex((box) => inside(box, col, row));
  let owner: Owner;
  if (farm >= 0) {
    owner = {
      key: `farm${String(farm)}`,
      ...BARN,
      name: "",
      sign: "",
      windows: false,
    };
  } else if (hut >= 0) {
    owner = {
      key: `hut${String(hut)}`,
      ...HUT,
      name: "",
      sign: "",
      windows: false,
    };
  } else {
    const gaol = prisonUnder(col, row);
    const blockX = gaol?.x ?? Math.floor(col / BLOCK_TILES);
    const blockY = gaol?.y ?? Math.floor(row / BLOCK_TILES);
    const sort = buildingAt(blockX, blockY);
    owner = {
      key: `b${String(blockX)}:${String(blockY)}`,
      wall: hex(sort.wall),
      roof: hex(sort.roof),
      name: sort.name,
      sign: sort.sign,
      windows: true,
    };
  }
  return owner;
}

/** Whether a square is inside a box of squares, edges included. */
function inside(box: Island, col: number, row: number): boolean {
  return (
    col >= box.left && col <= box.right && row >= box.top && row <= box.bottom
  );
}

/** The arrays one district's walls are written into. */
type WallSheet = {
  readonly position: number[];
  readonly normal: number[];
  readonly uv: number[];
  readonly color: number[];
};

/**
 * Puts the boxes up: walls with windows, roofs with a parapet and the odd
 * thing standing on them, one geometry per district.
 */
function addBuildings(
  group: THREE.Group,
  boxes: readonly Block3d[],
  walls: THREE.Material,
  solid: THREE.Material,
  bin: Bin,
): void {
  const sheets = new Map<number, { wall: WallSheet; rest: ModelBuilder }>();
  const tint = new THREE.Color();
  for (const box of boxes) {
    const region =
      Math.floor(box.top / REGION_TILES) * CITY_TILES +
      Math.floor(box.left / REGION_TILES);
    let sheet = sheets.get(region);
    if (sheet === undefined) {
      sheet = {
        wall: { position: [], normal: [], uv: [], color: [] },
        rest: new ModelBuilder(),
      };
      sheets.set(region, sheet);
    }
    const left = box.left * TILE;
    const top = box.top * TILE;
    const right = box.right * TILE;
    const bottom = box.bottom * TILE;
    const wide = right - left;
    const deep = bottom - top;
    // Each piece of a long building a slightly different shade, so a row of
    // houses reads as houses and not as one long shed.
    const shade = 0.9 + dice(box.left * 3 + box.owner, box.top * 7) * 0.18;
    tint.setHex(box.wall).multiplyScalar(shade);
    const wallHex = tint.getHex();
    if (box.windows) {
      facade(sheet.wall, left, bottom, right, bottom, box.high, tint, 0, 1);
      facade(sheet.wall, right, top, left, top, box.high, tint, 0, -1);
      facade(sheet.wall, right, bottom, right, top, box.high, tint, 1, 0);
      facade(sheet.wall, left, top, left, bottom, box.high, tint, -1, 0);
    } else {
      sheet.rest.box(wide, box.high, deep, left + wide / 2, 0, top + deep / 2, {
        color: wallHex,
      });
    }
    const middleX = left + wide / 2;
    const middleZ = top + deep / 2;
    const make = sheet.rest;
    make.box(wide + 0.6, 3, deep + 0.6, middleX, 0, middleZ, {
      color: 0x3f3f46,
    });
    make.box(wide - 0.4, 0.8, deep - 0.4, middleX, box.high - 0.6, middleZ, {
      color: box.roof,
    });
    if (box.windows) {
      const lip = {
        color: new THREE.Color(wallHex).multiplyScalar(0.8).getHex(),
      };
      make.box(wide + 1, 3, 1.6, middleX, box.high, top + 0.3, lip);
      make.box(wide + 1, 3, 1.6, middleX, box.high, bottom - 0.3, lip);
      make.box(1.6, 3, deep, left + 0.3, box.high, middleZ, lip);
      make.box(1.6, 3, deep, right - 0.3, box.high, middleZ, lip);
      roofTop(make, box, left, top, wide, deep);
    }
  }
  for (const sheet of sheets.values()) {
    const geometry = bin.keep(new THREE.BufferGeometry());
    const count = sheet.wall.position.length / 3;
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(sheet.wall.position, 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(sheet.wall.normal, 3),
    );
    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(sheet.wall.uv, 2),
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(sheet.wall.color, 3),
    );
    geometry.setAttribute(
      "tag",
      new THREE.Float32BufferAttribute(new Float32Array(count * 4), 4),
    );
    geometry.computeBoundingSphere();
    if (count > 0) {
      const front = new THREE.Mesh(geometry, walls);
      front.castShadow = true;
      front.receiveShadow = true;
      group.add(front);
    }
    const rest = new THREE.Mesh(bin.keep(sheet.rest.build()), solid);
    rest.castShadow = true;
    rest.receiveShadow = true;
    group.add(rest);
  }
}

/**
 * One wall of windows, as two triangles.
 *
 * @param sheet - where it goes
 * @param x0 - where it starts, x
 * @param z0 - where it starts, z
 * @param x1 - where it ends, x
 * @param z1 - where it ends, z
 * @param high - how tall
 * @param tint - its colour
 * @param nx - which way it faces, x
 * @param nz - which way it faces, z
 * @remarks
 * Wound so its front faces outward, with the window picture laid on in city
 * pixels - so a window is the same size on every house and a storey is a
 * storey whichever house it is in.
 */
function facade(
  sheet: WallSheet,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  high: number,
  tint: THREE.Color,
  nx: number,
  nz: number,
): void {
  const long = Math.hypot(x1 - x0, z1 - z0);
  const across = Math.max(1, Math.round(long / WINDOW_WIDE));
  const up = high / STOREY;
  const corners = [
    [x0, 0, z0, 0, 0],
    [x1, 0, z1, across, 0],
    [x1, high, z1, across, up],
    [x0, 0, z0, 0, 0],
    [x1, high, z1, across, up],
    [x0, high, z0, 0, up],
  ];
  for (const [x, y, z, u, v] of corners) {
    sheet.position.push(x ?? 0, y ?? 0, z ?? 0);
    sheet.normal.push(nx, 0, nz);
    sheet.uv.push(u ?? 0, v ?? 0);
    sheet.color.push(tint.r, tint.g, tint.b);
  }
}

/** What stands on a flat roof: air conditioning, a water tank, a mast. */
function roofTop(
  make: ModelBuilder,
  box: Block3d,
  left: number,
  top: number,
  wide: number,
  deep: number,
): void {
  const roll = dice(box.left + box.owner * 0.37, box.top);
  const machines = Math.floor(roll * 3);
  for (let at = 0; at < machines; at += 1) {
    const x = left + wide * (0.2 + dice(at, box.left) * 0.6);
    const z = top + deep * (0.2 + dice(box.top, at) * 0.6);
    make.box(7, 4, 6, x, box.high, z, { color: 0x9ca3af });
    make.box(5, 0.6, 4, x, box.high + 4, z, { color: 0x52525b });
  }
  if (box.high > 110 && roll > 0.4) {
    const x = left + wide * 0.7;
    const z = top + deep * 0.3;
    make.cyl(4.5, 4.5, 9, x, box.high + 3, z, { color: 0x78716c }, 8);
    for (const leg of [-3, 3]) {
      make.box(0.8, 3, 0.8, x + leg, box.high, z, { color: 0x44403c });
    }
  }
  if (box.high > 130 && roll > 0.7) {
    make.cyl(0.5, 0.8, 30, left + wide * 0.3, box.high, top + deep * 0.6, {
      color: 0x52525b,
    });
    make.box(
      1.2,
      1.2,
      1.2,
      left + wide * 0.3,
      box.high + 30,
      top + deep * 0.6,
      {
        color: 0xef4444,
        glow: 1.8,
      },
    );
  }
}

/**
 * The signs over the doors: the name of the building on its own colour, on
 * the wall that faces the camera.
 */
function addSigns(
  group: THREE.Group,
  boxes: readonly Block3d[],
  bin: Bin,
): void {
  const biggest = new Map<number, Block3d>();
  for (const box of boxes) {
    const best = biggest.get(box.owner);
    const area = (box.right - box.left) * (box.bottom - box.top);
    if (
      box.name !== "" &&
      (best === undefined ||
        area > (best.right - best.left) * (best.bottom - best.top))
    ) {
      biggest.set(box.owner, box);
    }
  }
  const pictures = new Map<string, THREE.MeshBasicMaterial>();
  for (const box of biggest.values()) {
    const key = `${box.name}|${box.sign}`;
    let material = pictures.get(key);
    if (material === undefined) {
      material = bin.keep(
        new THREE.MeshBasicMaterial({
          map: signTexture(box.name, box.sign, bin),
        }),
      );
      pictures.set(key, material);
    }
    const wide = Math.min(
      (box.right - box.left) * TILE * 0.8,
      box.name.length * 9 + 18,
    );
    const plate = bin.keep(new THREE.PlaneGeometry(wide, 14));
    const sign = new THREE.Mesh(plate, material);
    sign.position.set(
      ((box.left + box.right) / 2) * TILE,
      Math.min(box.high - 10, 44),
      box.bottom * TILE + 0.8,
    );
    group.add(sign);
  }
}

/** The picture of one sign. */
function signTexture(name: string, colour: string, bin: Bin): THREE.Texture {
  const sheet = document.createElement("canvas");
  sheet.width = 256;
  sheet.height = 48;
  const paint = sheet.getContext("2d");
  if (paint !== null) {
    paint.fillStyle = colour === "" ? "#1f2937" : colour;
    paint.fillRect(0, 0, sheet.width, sheet.height);
    paint.strokeStyle = "rgba(255,255,255,0.7)";
    paint.lineWidth = 3;
    paint.strokeRect(2, 2, sheet.width - 4, sheet.height - 4);
    paint.fillStyle = "#ffffff";
    paint.font = "bold 30px system-ui, sans-serif";
    paint.textAlign = "center";
    paint.textBaseline = "middle";
    paint.fillText(
      name.toUpperCase(),
      sheet.width / 2,
      sheet.height / 2 + 1,
      sheet.width - 16,
    );
  }
  const texture = bin.keep(new THREE.CanvasTexture(sheet));
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * The trees: the woods where the 2D picture has them, and a few in every
 * park.
 */
function addTrees(
  group: THREE.Group,
  state: GameState,
  material: THREE.Material,
  quality: Quality3d,
  bin: Bin,
): void {
  const tints = crownTints();
  const shapes = [bin.keep(treeModel(true)), bin.keep(treeModel(false))];
  const regions = new Map<
    number,
    { x: number; z: number; size: number; kind: number }[]
  >();
  for (let row = 0; row < CITY_TILES; row += 1) {
    for (let col = 0; col < CITY_TILES; col += 1) {
      const wood = treeAt(state.cells, col, row);
      const park =
        wood === null &&
        cellUnder(state.cells, (col + 0.5) * TILE, (row + 0.5) * TILE) ===
          "park" &&
        dice(col, row) > 0.55;
      const keep = dice(col + 3, row + 1) < quality.trees;
      if ((wood !== null || park) && keep) {
        const region =
          Math.floor(row / REGION_TILES) * CITY_TILES +
          Math.floor(col / REGION_TILES);
        const list = regions.get(region) ?? [];
        list.push(
          wood === null
            ? {
                x: (col + 0.2 + dice(col, row + 5) * 0.6) * TILE,
                z: (row + 0.2 + dice(col + 9, row) * 0.6) * TILE,
                size: 10 + dice(row, col) * 6,
                kind: 0,
              }
            : {
                x: wood.x,
                z: wood.y,
                size: wood.wide * 1.25,
                kind: dice(col, row + 2) > 0.5 ? 1 : 0,
              },
        );
        regions.set(region, list);
      }
    }
  }
  const matrix = new THREE.Matrix4();
  const turn = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  for (const list of regions.values()) {
    shapes.forEach((shape, kind) => {
      const mine = list.filter((tree) => tree.kind === kind);
      if (mine.length > 0) {
        const mesh = new THREE.InstancedMesh(shape, material, mine.length);
        mine.forEach((tree, at) => {
          turn.setFromAxisAngle(up, dice(tree.x, tree.z) * Math.PI * 2);
          const tall = tree.size * (0.9 + dice(tree.z, tree.x) * 0.35);
          matrix.compose(
            new THREE.Vector3(tree.x, 0, tree.z),
            turn,
            new THREE.Vector3(tree.size, tall, tree.size),
          );
          mesh.setMatrixAt(at, matrix);
          mesh.setColorAt(
            at,
            tints[Math.floor(dice(tree.x, at) * tints.length)] ??
              new THREE.Color(),
          );
        });
        mesh.computeBoundingSphere();
        mesh.castShadow = quality.smallShadows;
        mesh.receiveShadow = true;
        bin.keep(mesh);
        group.add(mesh);
      }
    });
  }
}

/** The lamps' pools of light, which only show at night. */
type Pools = {
  readonly mesh: THREE.InstancedMesh;
  readonly material: THREE.MeshBasicMaterial;
};

/**
 * Street lamps along every pavement that runs beside a road, and the pool
 * of light each one throws on the road at night.
 *
 * @returns the pools, whose strength follows the clock
 */
function addLamps(
  group: THREE.Group,
  state: GameState,
  material: THREE.Material,
  quality: Quality3d,
  bin: Bin,
): Pools {
  const lamp = bin.keep(lampModel());
  const spots: { x: number; z: number; angle: number }[] = [];
  const ways = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  for (let row = 0; row < CITY_TILES; row += 1) {
    for (let col = 0; col < CITY_TILES; col += 1) {
      const centreX = (col + 0.5) * TILE;
      const centreY = (row + 0.5) * TILE;
      if (
        cellUnder(state.cells, centreX, centreY) === "walk" &&
        (col * 3 + row * 5) % 4 === 0
      ) {
        const way = ways.find(
          (step) =>
            cellUnder(
              state.cells,
              centreX + step.x * TILE,
              centreY + step.y * TILE,
            ) === "road",
        );
        if (way !== undefined) {
          spots.push({
            x: centreX + way.x * TILE * 0.38,
            z: centreY + way.y * TILE * 0.38,
            angle: Math.atan2(way.y, way.x),
          });
        }
      }
    }
  }
  const regions = new Map<number, typeof spots>();
  for (const spot of spots) {
    const region =
      Math.floor(spot.z / TILE / REGION_TILES) * CITY_TILES +
      Math.floor(spot.x / TILE / REGION_TILES);
    const list = regions.get(region) ?? [];
    list.push(spot);
    regions.set(region, list);
  }
  const matrix = new THREE.Matrix4();
  const turn = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const one = new THREE.Vector3(1, 1, 1);
  const place = new THREE.Vector3();
  for (const list of regions.values()) {
    const mesh = new THREE.InstancedMesh(lamp, material, list.length);
    list.forEach((spot, at) => {
      turn.setFromAxisAngle(up, yawOf(spot.angle));
      matrix.compose(place.set(spot.x, 0, spot.z), turn, one);
      mesh.setMatrixAt(at, matrix);
    });
    mesh.computeBoundingSphere();
    mesh.castShadow = quality.smallShadows;
    bin.keep(mesh);
    group.add(mesh);
  }
  const glow = createGlow(bin, 0);
  glow.map = poolTexture(bin);
  glow.color.setHex(0xffc27a);
  const disc = bin.keep(new THREE.PlaneGeometry(1, 1));
  disc.rotateX(-Math.PI / 2);
  const pools = new THREE.InstancedMesh(disc, glow, Math.max(1, spots.length));
  const flat = new THREE.Quaternion();
  const size = new THREE.Vector3(LAMP_HIGH * 1.7, 1, LAMP_HIGH * 1.7);
  spots.forEach((spot, at) => {
    matrix.compose(
      place.set(
        spot.x + Math.cos(spot.angle) * LAMP_REACH,
        0.6,
        spot.z + Math.sin(spot.angle) * LAMP_REACH,
      ),
      flat,
      size,
    );
    pools.setMatrixAt(at, matrix);
  });
  pools.count = spots.length;
  pools.computeBoundingSphere();
  pools.renderOrder = 2;
  bin.keep(pools);
  group.add(pools);
  return { mesh: pools, material: glow };
}

/** Side of the soft round light picture, texels. */
const POOL_TEXELS = 64;

/**
 * A soft round spot of light, white in the middle and nothing at the edge.
 *
 * @param bin - where it is kept for freeing
 * @returns the texture
 */
export function poolTexture(bin: Bin): THREE.Texture {
  const sheet = document.createElement("canvas");
  sheet.width = POOL_TEXELS;
  sheet.height = POOL_TEXELS;
  const paint = sheet.getContext("2d");
  if (paint !== null) {
    const half = POOL_TEXELS / 2;
    const light = paint.createRadialGradient(half, half, 0, half, half, half);
    light.addColorStop(0, "#ffffff");
    light.addColorStop(0.45, "#7a7a7a");
    light.addColorStop(1, "#000000");
    paint.fillStyle = light;
    paint.fillRect(0, 0, POOL_TEXELS, POOL_TEXELS);
  }
  const texture = bin.keep(new THREE.CanvasTexture(sheet));
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * The traffic lights, where the 2D picture puts them: on the kerb to the
 * right of every approach to a junction of two big roads.
 *
 * @returns what to call each frame to switch their colours
 */
function addSignals(
  group: THREE.Group,
  state: GameState,
  material: THREE.Material,
  bin: Bin,
): (state: GameState) => void {
  const posts: { x: number; z: number; angle: number; upright: boolean }[] = [];
  const ways = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ];
  for (let row = 0; row < CITY_TILES; row += 1) {
    for (let col = 0; col < CITY_TILES; col += 1) {
      if (
        cellUnder(state.cells, (col + 0.5) * TILE, (row + 0.5) * TILE) ===
          "road" &&
        !lightAt(col, row)
      ) {
        for (const way of ways) {
          const kerb =
            cellUnder(
              state.cells,
              (col - way.y + 0.5) * TILE,
              (row + way.x + 0.5) * TILE,
            ) !== "road";
          if (lightAt(col + way.x, row + way.y) && kerb) {
            const angle = Math.atan2(way.y, way.x);
            const middleX = (col + 0.5 + way.x * 0.42) * TILE;
            const middleZ = (row + 0.5 + way.y * 0.42) * TILE;
            posts.push({
              x: middleX - Math.sin(angle) * (TILE / 2 + 3),
              z: middleZ + Math.cos(angle) * (TILE / 2 + 3),
              angle,
              upright: way.y !== 0,
            });
          }
        }
      }
    }
  }
  const count = Math.max(1, posts.length);
  const pole = new THREE.InstancedMesh(
    bin.keep(signalModel()),
    material,
    count,
  );
  const bulbShape = bin.keep(new THREE.BoxGeometry(1.2, 2.4, 2.4));
  const bulbs = new THREE.InstancedMesh(
    bulbShape,
    bin.keep(new THREE.MeshBasicMaterial({ color: 0xffffff })),
    count,
  );
  const matrix = new THREE.Matrix4();
  const turn = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const one = new THREE.Vector3(1, 1, 1);
  const place = new THREE.Vector3();
  posts.forEach((post, at) => {
    turn.setFromAxisAngle(up, yawOf(post.angle));
    matrix.compose(place.set(post.x, 0, post.z), turn, one);
    pole.setMatrixAt(at, matrix);
    matrix.compose(
      place.set(
        post.x - Math.cos(post.angle) * 1.8,
        SIGNAL_HIGH,
        post.z - Math.sin(post.angle) * 1.8,
      ),
      turn,
      one,
    );
    bulbs.setMatrixAt(at, matrix);
    bulbs.setColorAt(at, new THREE.Color(0x22c55e));
  });
  pole.count = posts.length;
  bulbs.count = posts.length;
  pole.computeBoundingSphere();
  bulbs.computeBoundingSphere();
  pole.castShadow = true;
  bin.keep(pole);
  bin.keep(bulbs);
  group.add(pole, bulbs);
  const colours = {
    green: new THREE.Color(0x22c55e).multiplyScalar(1.6),
    amber: new THREE.Color(0xf59e0b).multiplyScalar(1.6),
    red: new THREE.Color(0xef4444).multiplyScalar(1.6),
  };
  let shown = "";
  return (now) => {
    const along = lightColour(now.time, false);
    const across = lightColour(now.time, true);
    const key = `${along}${across}`;
    if (key !== shown && bulbs.instanceColor !== null) {
      shown = key;
      posts.forEach((post, at) => {
        bulbs.setColorAt(at, colours[post.upright ? across : along]);
      });
      bulbs.instanceColor.needsUpdate = true;
    }
  };
}

/**
 * The wire round the airfield, the base and the prisons: a post on every
 * square and two rails to the next one.
 */
function addFences(
  group: THREE.Group,
  state: GameState,
  material: THREE.Material,
  bin: Bin,
): void {
  const make = new ModelBuilder();
  const wire = { color: 0x9ca3af };
  const post = { color: 0x57534e };
  const fence = (col: number, row: number): boolean =>
    cellUnder(state.cells, (col + 0.5) * TILE, (row + 0.5) * TILE) === "fence";
  for (let row = 0; row < CITY_TILES; row += 1) {
    for (let col = 0; col < CITY_TILES; col += 1) {
      if (fence(col, row)) {
        const x = (col + 0.5) * TILE;
        const z = (row + 0.5) * TILE;
        make.box(1.6, 20, 1.6, x, 0, z, post);
        if (fence(col + 1, row)) {
          for (const high of [4, 11, 18]) {
            make.box(TILE, 0.7, 0.4, x + TILE / 2, high, z, wire);
          }
        }
        if (fence(col, row + 1)) {
          for (const high of [4, 11, 18]) {
            make.box(0.4, 0.7, TILE, x, high, z + TILE / 2, wire);
          }
        }
      }
    }
  }
  const mesh = new THREE.Mesh(bin.keep(make.build()), material);
  mesh.receiveShadow = true;
  group.add(mesh);
}

/** The middle of the city, for whoever needs somewhere to look at first. */
export const CITY_MIDDLE = CITY_SIZE / 2;
/* eslint-enable @typescript-eslint/no-magic-numbers */
