/**
 * Everything that moves: ships with billowing sails rocking on the waves,
 * each with its owner's flag and, when damaged, a bar of hit points; ox
 * carts on the roads, townsfolk strolling about, land units in their
 * owner's colours - each kind with its own gear, riders on horses, guns on
 * wheels, one instanced mesh per kind - and gulls over the harbours. Far
 * away carts, walkers and units are skipped.
 *
 * @module
 */
import * as THREE from "three";
import { TICK } from "@/games/imperavis/engine/time";
import { CART_SPEED, NO_ROAD } from "@/games/imperavis/engine/logistics-data";
import { groundHeight } from "@/games/imperavis/engine/terrain";
import { playerById, PIRATES } from "@/games/imperavis/engine/players";
import { SHIP, SHIPS } from "@/games/imperavis/engine/ships-data";
import {
  UNIT,
  UNITS,
  type UnitShape,
} from "@/games/imperavis/engine/units-data";
import type {
  Game,
  Ship,
  ShipKind,
  UnitKind,
} from "@/games/imperavis/engine/types";
import {
  cartModel,
  hullModel,
  sailModel,
  unitBodyModel,
  unitGearModel,
  walkerModel,
} from "./models";

/* eslint-disable @typescript-eslint/no-magic-numbers -- animation amplitudes, speeds and pool sizes */

/** Most carts drawn. */
const MAX_CARTS = 400;

/** Townsfolk walking about. */
const WALKERS = 90;

/** Most soldiers drawn. */
const MAX_SOLDIERS = 240;

/** The ways a unit is drawn. */
const SHAPES: readonly UnitShape[] = ["foot", "rider", "gun"];

/** Soldiers are drawn this much larger than townsfolk. */
const SOLDIER_SCALE = 1.7;

/** Most gulls drawn. */
const MAX_GULLS = 64;

/** Gulls per kontor. */
const GULLS = 4;

/** Tiles per second a walker strolls. */
const WALK_SPEED = 0.9;

/** Flag colours of the trader and the pirates. */
const TRADER_FLAG = 0xc9873f;
const PIRATE_FLAG = 0x111111;

/** Carts and walkers farther than this from the camera's target are not drawn. */
const UNIT_RANGE = 70;

/** One drawn ship. */
type ShipView = {
  group: THREE.Group;
  sails: THREE.Mesh;
  bar: THREE.Group;
  health: THREE.Mesh;
  x: number;
  z: number;
  heading: number;
};

/** A walker's state, owned by the view only. */
type Walker = { from: number; to: number; t: number; seed: number };

/** The moving things. */
export type UnitsLayer = {
  readonly group: THREE.Group;
  /**
   * Places everything for this frame.
   *
   * @param game - the game
   * @param alpha - share of a simulation step since the last one
   * @param time - seconds, for animation
   * @param dt - real seconds since the last frame
   * @param running - false while paused
   */
  update(
    game: Game,
    alpha: number,
    time: number,
    dt: number,
    running: boolean,
    focus: THREE.Vector2,
  ): void;
  /** Where a ship is drawn (smoothed). */
  shipPosition(id: number): THREE.Vector3 | null;
  dispose(): void;
};

/**
 * Creates the layer.
 *
 * @param material - the material of hulls, carts and people
 * @returns the layer
 */
export function createUnitsLayer(material: THREE.Material): UnitsLayer {
  const group = new THREE.Group();
  const hulls = new Map<ShipKind, THREE.BufferGeometry>();
  const sails = new Map<ShipKind, THREE.BufferGeometry>();
  for (const def of SHIPS) {
    hulls.set(def.kind, hullModel(def.kind));
    sails.set(def.kind, sailModel(def.kind));
  }
  const flagGeometry = new THREE.PlaneGeometry(0.55, 0.32);
  flagGeometry.translate(0.3, 0, 0);
  const flagMaterials = new Map<number, THREE.MeshLambertMaterial>();
  const flagMaterial = (color: number) => {
    let material = flagMaterials.get(color);
    if (material === undefined) {
      material = new THREE.MeshLambertMaterial({
        color,
        side: THREE.DoubleSide,
      });
      flagMaterials.set(color, material);
    }
    return material;
  };
  const barGeometry = new THREE.BoxGeometry(1.4, 0.12, 0.12);
  const barBack = new THREE.MeshBasicMaterial({ color: 0x3a1010 });
  const barFront = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
  const ships = new Map<number, ShipView>();
  const cartGeometry = cartModel();
  const carts = new THREE.InstancedMesh(cartGeometry, material, MAX_CARTS);
  carts.castShadow = true;
  carts.frustumCulled = false;
  carts.count = 0;
  group.add(carts);
  const walkerGeometry = walkerModel();
  const walkersMesh = new THREE.InstancedMesh(
    walkerGeometry,
    material,
    WALKERS,
  );
  walkersMesh.frustumCulled = false;
  walkersMesh.count = 0;
  group.add(walkersMesh);
  const walkers: Walker[] = [];
  // Units: a tinted coat per shape and untinted gear per kind, each an
  // instanced mesh; a unit's coat and gear share its matrix.
  const bodyGeometries = new Map<UnitShape, THREE.BufferGeometry>();
  const bodies = new Map<UnitShape, THREE.InstancedMesh>();
  for (const shape of SHAPES) {
    const geometry = unitBodyModel(shape);
    bodyGeometries.set(shape, geometry);
    bodies.set(
      shape,
      new THREE.InstancedMesh(geometry, material, MAX_SOLDIERS),
    );
  }
  const gearGeometries = new Map<UnitKind, THREE.BufferGeometry>();
  const gear = new Map<UnitKind, THREE.InstancedMesh>();
  for (const def of UNITS) {
    const geometry = unitGearModel(def.kind, def.shape);
    gearGeometries.set(def.kind, geometry);
    gear.set(
      def.kind,
      new THREE.InstancedMesh(geometry, material, MAX_SOLDIERS),
    );
  }
  const unitMeshes = [...bodies.values(), ...gear.values()];
  for (const mesh of unitMeshes) {
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.castShadow = true;
    group.add(mesh);
  }
  const counts = new Map<THREE.InstancedMesh, number>();
  const tint = new THREE.Color();
  const soldierViews = new Map<
    number,
    { x: number; z: number; heading: number }
  >();
  const gullGeometry = new THREE.BufferGeometry();
  gullGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -0.35, 0.08, 0, 0, 0, 0.05, 0, 0, -0.05, 0.35, 0.08, 0, 0, 0, -0.05, 0,
        0, 0.05,
      ],
      3,
    ),
  );
  gullGeometry.computeVertexNormals();
  const gullMaterial = new THREE.MeshBasicMaterial({
    color: 0xf4f4f0,
    side: THREE.DoubleSide,
  });
  const gulls = new THREE.InstancedMesh(gullGeometry, gullMaterial, MAX_GULLS);
  gulls.frustumCulled = false;
  gulls.count = 0;
  group.add(gulls);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  let roadTiles: number[] = [];
  let roadVersion = -1;

  return {
    group,
    update(game, alpha, time, dt, running, focus) {
      const world = game.world;
      const n = world.n;
      // Ships.
      const seen = new Set<number>();
      for (const ship of game.ships) {
        seen.add(ship.id);
        let view = ships.get(ship.id);
        if (view === undefined) {
          const owner = playerById(game, ship.owner);
          const color =
            owner?.color ??
            (ship.owner === PIRATES ? PIRATE_FLAG : TRADER_FLAG);
          view = makeShip(ship, hulls, sails, material);
          const flag = new THREE.Mesh(flagGeometry, flagMaterial(color));
          flag.position.set(-0.2, 2.9, 0);
          view.group.add(flag);
          view.bar = new THREE.Group();
          const back = new THREE.Mesh(barGeometry, barBack);
          view.health = new THREE.Mesh(barGeometry, barFront);
          view.health.position.z = 0.01;
          view.bar.add(back, view.health);
          view.bar.position.set(0, 3.5, 0);
          view.group.add(view.bar);
          ships.set(ship.id, view);
          group.add(view.group);
        }
        const blend = 1 - Math.exp(-8 * dt);
        view.x += (ship.x - view.x) * blend;
        view.z += (ship.y - view.z) * blend;
        let turn = ship.heading - view.heading;
        turn = Math.atan2(Math.sin(turn), Math.cos(turn));
        view.heading += turn * blend;
        const sailing = ship.path.length > 0;
        view.group.position.set(
          view.x,
          Math.sin(time * 1.3 + ship.id) * 0.06,
          view.z,
        );
        view.group.rotation.set(
          Math.sin(time * 0.9 + ship.id) * 0.05,
          -view.heading,
          Math.sin(time * 1.1 + ship.id * 2) * 0.04,
        );
        view.sails.scale.set(
          1,
          sailing ? 1 : 0.35,
          sailing ? 1 + Math.sin(time * 3 + ship.id) * 0.06 : 0.6,
        );
        const share = Math.max(0, Math.min(1, ship.hp / SHIP[ship.kind].hp));
        view.bar.visible = share < 0.999;
        view.health.scale.x = Math.max(0.01, share);
        view.health.position.x = -0.7 * (1 - share);
        // The bar faces the camera's turn well enough when kept level.
        view.bar.rotation.y = view.heading;
      }
      for (const [id, view] of ships) {
        if (!seen.has(id)) {
          group.remove(view.group);
          ships.delete(id);
        }
      }
      // Carts, a little ahead of the last step for smooth driving.
      const ahead = running ? CART_SPEED * TICK * alpha : 0;
      let count = 0;
      for (const cart of game.carts) {
        const at = cart.path[Math.floor(cart.pos)] ?? 0;
        const near =
          Math.hypot((at % n) - focus.x, Math.floor(at / n) - focus.y) <
          UNIT_RANGE;
        if (count < MAX_CARTS && cart.path.length > 1 && near) {
          const pos = Math.min(cart.path.length - 1.001, cart.pos + ahead);
          const index = Math.floor(pos);
          const frac = pos - index;
          const a = cart.path[index];
          const b = cart.path[Math.min(cart.path.length - 1, index + 1)];
          const ax = (a % n) + 0.5;
          const az = Math.floor(a / n) + 0.5;
          const bx = (b % n) + 0.5;
          const bz = Math.floor(b / n) + 0.5;
          const x = ax + (bx - ax) * frac;
          const z = az + (bz - az) * frac;
          euler.set(0, -Math.atan2(bz - az, bx - ax), 0);
          quaternion.setFromEuler(euler);
          position.set(x, groundHeight(world, x, z) + 0.05, z);
          matrix.compose(position, quaternion, scale);
          carts.setMatrixAt(count, matrix);
          count += 1;
        }
      }
      carts.count = count;
      carts.instanceMatrix.needsUpdate = true;
      // Walkers stroll from road tile to road tile.
      if (roadVersion !== game.version) {
        roadVersion = game.version;
        roadTiles = [];
        for (let i = 0; i < n * n; i += 1) {
          if (game.roads[i] !== NO_ROAD) {
            roadTiles.push(i);
          }
        }
        walkers.length = 0;
      }
      const people = Math.min(WALKERS, Math.floor(roadTiles.length / 3));
      while (walkers.length < people) {
        const start = roadTiles[Math.floor(Math.random() * roadTiles.length)];
        walkers.push({ from: start, to: start, t: 1, seed: Math.random() });
      }
      walkers.forEach((walker, index) => {
        if (running) {
          walker.t += dt * WALK_SPEED;
        }
        if (walker.t >= 1) {
          walker.from = walker.to;
          walker.to = nextRoad(game, walker.from, n);
          walker.t = 0;
        }
        const ax = (walker.from % n) + 0.3 + walker.seed * 0.4;
        const az = Math.floor(walker.from / n) + 0.3 + walker.seed * 0.4;
        const bx = (walker.to % n) + 0.3 + walker.seed * 0.4;
        const bz = Math.floor(walker.to / n) + 0.3 + walker.seed * 0.4;
        const x = ax + (bx - ax) * walker.t;
        const z = az + (bz - az) * walker.t;
        euler.set(0, -Math.atan2(bz - az, bx - ax), 0);
        quaternion.setFromEuler(euler);
        position.set(
          x,
          groundHeight(world, x, z) +
            0.05 +
            Math.abs(Math.sin(time * 9 + walker.seed * 10)) * 0.03,
          z,
        );
        matrix.compose(position, quaternion, scale);
        walkersMesh.setMatrixAt(index, matrix);
      });
      walkersMesh.count = walkers.length;
      walkersMesh.instanceMatrix.needsUpdate = true;
      // Soldiers on land, smoothed between the steps.
      let soldiers = 0;
      for (const mesh of unitMeshes) {
        counts.set(mesh, 0);
      }
      const blendSoldier = 1 - Math.exp(-10 * dt);
      const present = new Set<number>();
      for (const soldier of game.soldiers) {
        const near =
          Math.hypot(soldier.x - focus.x, soldier.y - focus.y) < UNIT_RANGE;
        if (soldier.ship < 0 && near && soldiers < MAX_SOLDIERS) {
          present.add(soldier.id);
          let view = soldierViews.get(soldier.id);
          if (view === undefined) {
            view = { x: soldier.x, z: soldier.y, heading: 0 };
            soldierViews.set(soldier.id, view);
          }
          const dx = soldier.x - view.x;
          const dz = soldier.y - view.z;
          if (Math.hypot(dx, dz) > 0.01) {
            view.heading = Math.atan2(dz, dx);
          }
          view.x += dx * blendSoldier;
          view.z += dz * blendSoldier;
          const moving = Math.hypot(dx, dz) > 0.02;
          euler.set(0, -view.heading + Math.PI / 2, 0);
          quaternion.setFromEuler(euler);
          position.set(
            view.x,
            groundHeight(world, view.x, view.z) +
              0.05 +
              (moving ? Math.abs(Math.sin(time * 10 + soldier.id)) * 0.04 : 0),
            view.z,
          );
          scale.set(SOLDIER_SCALE, SOLDIER_SCALE, SOLDIER_SCALE);
          matrix.compose(position, quaternion, scale);
          const body = bodies.get(
            UNIT[soldier.kind].shape,
          ) as THREE.InstancedMesh;
          const kit = gear.get(soldier.kind) as THREE.InstancedMesh;
          const bodyAt = counts.get(body) ?? 0;
          const kitAt = counts.get(kit) ?? 0;
          body.setMatrixAt(bodyAt, matrix);
          kit.setMatrixAt(kitAt, matrix);
          tint.setHex(playerById(game, soldier.owner)?.color ?? PIRATE_FLAG);
          body.setColorAt(bodyAt, tint);
          tint.setHex(0xffffff);
          kit.setColorAt(kitAt, tint);
          counts.set(body, bodyAt + 1);
          counts.set(kit, kitAt + 1);
          soldiers += 1;
        }
      }
      for (const id of [...soldierViews.keys()]) {
        if (!present.has(id)) {
          soldierViews.delete(id);
        }
      }
      scale.set(1, 1, 1);
      for (const mesh of unitMeshes) {
        mesh.count = counts.get(mesh) ?? 0;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor !== null) {
          mesh.instanceColor.needsUpdate = true;
        }
      }
      // Gulls circle over each kontor.
      let gull = 0;
      for (const building of game.buildings) {
        if (building.kind === "kontor") {
          for (let k = 0; k < GULLS && gull < MAX_GULLS; k += 1) {
            const angle = time * (0.4 + k * 0.07) + k * 1.7 + building.id;
            const radius = 3 + k * 1.2;
            const x = building.x + 1.5 + Math.cos(angle) * radius;
            const z = building.y + 1.5 + Math.sin(angle) * radius;
            const flap = Math.sin(time * 8 + k) * 0.4;
            euler.set(flap * 0.2, -angle, 0);
            quaternion.setFromEuler(euler);
            position.set(x, 5 + k * 0.6 + Math.sin(time + k) * 0.4, z);
            scale.set(1, 1 + flap, 1);
            matrix.compose(position, quaternion, scale);
            gulls.setMatrixAt(gull, matrix);
            gull += 1;
          }
        }
      }
      scale.set(1, 1, 1);
      gulls.count = gull;
      gulls.instanceMatrix.needsUpdate = true;
    },
    shipPosition(id) {
      const view = ships.get(id);
      return view === undefined ? null : new THREE.Vector3(view.x, 0, view.z);
    },
    dispose() {
      for (const geometry of [
        ...hulls.values(),
        ...sails.values(),
        cartGeometry,
        walkerGeometry,
        ...bodyGeometries.values(),
        ...gearGeometries.values(),
        gullGeometry,
        flagGeometry,
        barGeometry,
      ]) {
        geometry.dispose();
      }
      for (const flag of flagMaterials.values()) {
        flag.dispose();
      }
      barBack.dispose();
      barFront.dispose();
      gullMaterial.dispose();
      carts.dispose();
      walkersMesh.dispose();
      for (const mesh of unitMeshes) {
        mesh.dispose();
      }
      gulls.dispose();
    },
  };
}

/** Builds the drawn form of a ship. */
function makeShip(
  ship: Ship,
  hulls: Map<ShipKind, THREE.BufferGeometry>,
  sails: Map<ShipKind, THREE.BufferGeometry>,
  material: THREE.Material,
): ShipView {
  const group = new THREE.Group();
  const hull = new THREE.Mesh(hulls.get(ship.kind), material);
  hull.castShadow = true;
  const sail = new THREE.Mesh(sails.get(ship.kind), material);
  sail.castShadow = true;
  sail.position.y = 0.4;
  group.add(hull, sail);
  group.userData.ship = ship.id;
  return {
    group,
    sails: sail,
    bar: new THREE.Group(),
    health: new THREE.Mesh(),
    x: ship.x,
    z: ship.y,
    heading: ship.heading,
  };
}

/** A random neighbouring road tile, or the same tile when there is none. */
function nextRoad(game: Game, from: number, n: number): number {
  const options = [from + 1, from - 1, from + n, from - n].filter(
    (index) =>
      index >= 0 &&
      index < n * n &&
      game.roads[index] !== NO_ROAD &&
      Math.abs((index % n) - (from % n)) <= 1,
  );
  return options.length > 0
    ? options[Math.floor(Math.random() * options.length)]
    : from;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
