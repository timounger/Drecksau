/**
 * All buildings drawn with instancing: one instanced mesh per model (kind,
 * tier and stage, or building site), rebuilt only when buildings change,
 * plus the turning windmill sails and where chimneys and fires smoke.
 *
 * @module
 */
import * as THREE from "three";
import { BUILDING } from "@/games/imperavis/engine/buildings-data";
import { areaHeight } from "@/games/imperavis/engine/terrain";
import type { Building, Game } from "@/games/imperavis/engine/types";
import { buildingModel, millBladesModel, siteModel } from "./models";

/* eslint-disable @typescript-eslint/no-magic-numbers -- placement offsets of chimneys and sails */

/** Where smoke leaves each smoking kind, in model space. */
const CHIMNEYS: Partial<Record<string, readonly [number, number, number]>> = {
  tavern: [0.45, 1.8, -0.3],
  bakery: [0.45, 1.75, -0.4],
  malthouse: [-0.2, 2.75, -0.1],
  brewery: [-0.6, 1.75, -0.5],
  brickworks: [-0.35, 1.95, -0.35],
  charcoal: [-0.2, 0.6, -0.2],
  smelter: [-0.3, 2.65, -0.3],
  toolmaker: [-0.45, 1.85, -0.5],
  bathhouse: [0, 2.1, 0],
  glassworks: [-0.3, 2.6, -0.3],
  tobacconist: [0.35, 1.65, -0.6],
  house1: [0.4, 1.75, -0.2],
  house2: [-0.45, 2.5, 0.25],
};

/** Where a windmill's sails turn, in model space. */
const MILL_HUB: readonly [number, number, number] = [0, 1.55, 0.62];

/** A point smoke rises from. */
export type SmokeSource = { x: number; y: number; z: number; strength: number };

/** The instanced buildings. */
export type BuildingsLayer = {
  readonly group: THREE.Group;
  /** Rebuilds all instances after buildings changed. */
  rebuild(game: Game): void;
  /** Per frame: turning sails. */
  animate(time: number): void;
  /** Where smoke rises right now. */
  smoke(game: Game): SmokeSource[];
  /** World position of a building's centre on the ground. */
  anchor(game: Game, building: Building): THREE.Vector3;
  dispose(): void;
};

/**
 * Creates the building layer.
 *
 * @param material - the building material
 * @returns the layer
 */
export function createBuildingsLayer(material: THREE.Material): BuildingsLayer {
  const group = new THREE.Group();
  const geometries = new Map<string, THREE.BufferGeometry>();
  const meshes = new Map<string, THREE.InstancedMesh>();
  const blades = millBladesModel();
  let bladeMesh: THREE.InstancedMesh | null = null;
  let mills: { position: THREE.Vector3; rotation: number }[] = [];
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const one = new THREE.Vector3(1, 1, 1);

  const geometryFor = (key: string, make: () => THREE.BufferGeometry) => {
    let geometry = geometries.get(key);
    if (geometry === undefined) {
      geometry = make();
      geometries.set(key, geometry);
    }
    return geometry;
  };

  const anchor = (game: Game, building: Building) =>
    new THREE.Vector3(
      building.x + building.w / 2,
      areaHeight(game.world, building.x, building.y, building.w, building.h) +
        0.05,
      building.y + building.h / 2,
    );

  return {
    group,
    anchor,
    rebuild(game) {
      for (const mesh of meshes.values()) {
        group.remove(mesh);
        mesh.dispose();
      }
      meshes.clear();
      const byKey = new Map<
        string,
        { building: Building; geometry: THREE.BufferGeometry }[]
      >();
      mills = [];
      for (const building of game.buildings) {
        const def = BUILDING[building.kind];
        let key: string;
        let geometry: THREE.BufferGeometry;
        if (!building.complete) {
          key = `site:${def.w}x${def.h}`;
          geometry = geometryFor(key, () => siteModel(def.w, def.h));
        } else {
          const tier = building.house?.tier ?? 0;
          const level = building.level;
          key = `${building.kind}:${tier}:${level}`;
          geometry = geometryFor(key, () =>
            buildingModel(building.kind, tier, level),
          );
          if (building.kind === "mill") {
            mills.push({
              position: anchor(game, building),
              rotation: rotationOf(building),
            });
          }
        }
        const list = byKey.get(key) ?? [];
        list.push({ building, geometry });
        byKey.set(key, list);
      }
      for (const [key, list] of byKey) {
        const mesh = new THREE.InstancedMesh(
          list[0].geometry,
          material,
          list.length,
        );
        list.forEach(({ building }, index) => {
          quaternion.setFromAxisAngle(up, rotationOf(building));
          matrix.compose(anchor(game, building), quaternion, one);
          mesh.setMatrixAt(index, matrix);
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.computeBoundingSphere();
        meshes.set(key, mesh);
        group.add(mesh);
      }
      if (bladeMesh !== null) {
        group.remove(bladeMesh);
        bladeMesh.dispose();
        bladeMesh = null;
      }
      if (mills.length > 0) {
        bladeMesh = new THREE.InstancedMesh(blades, material, mills.length);
        bladeMesh.castShadow = true;
        group.add(bladeMesh);
      }
    },
    animate(time) {
      if (bladeMesh !== null) {
        const spin = new THREE.Matrix4();
        const turn = new THREE.Matrix4();
        mills.forEach((mill, index) => {
          turn.makeRotationY(mill.rotation);
          const hub = new THREE.Vector3(...MILL_HUB)
            .applyMatrix4(turn)
            .add(mill.position);
          spin.makeRotationZ(time * 1.2);
          matrix.copy(turn).multiply(spin);
          matrix.setPosition(hub);
          (bladeMesh as THREE.InstancedMesh).setMatrixAt(index, matrix);
        });
        bladeMesh.instanceMatrix.needsUpdate = true;
        bladeMesh.computeBoundingSphere();
      }
    },
    smoke(game) {
      const sources: SmokeSource[] = [];
      for (const building of game.buildings) {
        const def = BUILDING[building.kind];
        const tier = building.house?.tier ?? 0;
        const key =
          building.house !== null ? `house${Math.min(2, tier)}` : building.kind;
        const offset = CHIMNEYS[key];
        const active =
          building.complete &&
          (building.house !== null
            ? tier >= 1 && building.house.residents > 0
            : def.smoke && building.prod?.status === "working");
        const service =
          building.complete && def.smoke && building.prod === null;
        if (building.fire > 0) {
          // A burning building smokes thickly from its roof.
          const point = anchor(game, building);
          sources.push({
            x: point.x,
            y: point.y + 1.6,
            z: point.z,
            strength: 3,
          });
        } else if (offset !== undefined && (active || service)) {
          const turn = new THREE.Matrix4().makeRotationY(rotationOf(building));
          const point = new THREE.Vector3(...offset)
            .applyMatrix4(turn)
            .add(anchor(game, building));
          sources.push({
            x: point.x,
            y: point.y,
            z: point.z,
            strength: building.house !== null ? 0.35 : 1,
          });
        }
      }
      return sources;
    },
    dispose() {
      for (const mesh of meshes.values()) {
        mesh.dispose();
      }
      for (const geometry of geometries.values()) {
        geometry.dispose();
      }
      bladeMesh?.dispose();
      blades.dispose();
    },
  };
}

/**
 * The model's turn for a building's rotation.
 *
 * @param building - the building
 * @returns radians around the vertical axis
 */
export function rotationOf(building: Building): number {
  return (-building.rot * Math.PI) / 2;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
