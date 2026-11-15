/**
 * The towns of the foreign peoples and pirate bands: each faction's places
 * merged into one mesh (they never change), small boats rocking and rowing
 * about in each harbour, and where their chimneys and fires smoke.
 *
 * @module
 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  factionLayout,
  type FactionSite,
} from "@/games/imperavis/engine/faction-layout";
import { areaHeight } from "@/games/imperavis/engine/terrain";
import type { Game } from "@/games/imperavis/engine/types";
import type { SmokeSource } from "./buildings-layer";
import { boatModel, chimneysOf, factionSiteModel } from "./faction-models";

/* eslint-disable @typescript-eslint/no-magic-numbers -- animation radii, speeds and offsets */

/** Small boats per harbour. */
const BOATS = 3;

/** How strongly a faction's chimney smokes. */
const SMOKE_STRENGTH = 0.7;

/** The drawn towns. */
export type FactionsLayer = {
  readonly group: THREE.Group;
  /** Per frame: the boats in the harbours. */
  animate(time: number): void;
  /** Where smoke rises. */
  smoke(): readonly SmokeSource[];
  dispose(): void;
};

/**
 * Creates the towns of a game's factions (none in older worlds).
 *
 * @param game - the game; its world and factions are fixed
 * @param material - the building material
 * @returns the layer
 */
export function createFactionsLayer(
  game: Game,
  material: THREE.Material,
): FactionsLayer {
  const world = game.world;
  const n = world.n;
  const group = new THREE.Group();
  const meshes: THREE.Mesh[] = [];
  const smoke: SmokeSource[] = [];
  const harbours: { x: number; z: number }[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (const home of world.factionHomes) {
    const parts: THREE.BufferGeometry[] = [];
    for (const site of factionLayout(world, home)) {
      const turn = -(site.rot * Math.PI) / 2;
      const [w, h] = site.rot % 2 === 0 ? [site.w, site.h] : [site.h, site.w];
      const centre = anchor(game, site);
      const geometry = factionSiteModel(
        home.culture,
        site.kind,
        w,
        h,
        site.variant,
      );
      geometry.rotateY(turn);
      geometry.translate(centre.x, centre.y, centre.z);
      parts.push(geometry);
      for (const [cx, cy, cz] of chimneysOf(home.culture, site.kind, w, h)) {
        const point = new THREE.Vector3(cx, cy, cz)
          .applyAxisAngle(up, turn)
          .add(centre);
        smoke.push({
          x: point.x,
          y: point.y,
          z: point.z,
          strength: SMOKE_STRENGTH,
        });
      }
    }
    if (parts.length > 0) {
      const merged = mergeGeometries(parts, false) as THREE.BufferGeometry;
      for (const part of parts) {
        part.dispose();
      }
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshes.push(mesh);
      group.add(mesh);
    }
    harbours.push({
      x: (home.berth % n) + 0.5,
      z: Math.floor(home.berth / n) + 0.5,
    });
  }
  const boatGeometry = boatModel();
  const boats = new THREE.InstancedMesh(
    boatGeometry,
    material,
    Math.max(1, harbours.length * BOATS),
  );
  boats.count = harbours.length * BOATS;
  boats.frustumCulled = false;
  group.add(boats);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const position = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);

  return {
    group,
    animate(time) {
      harbours.forEach((harbour, h) => {
        for (let k = 0; k < BOATS; k += 1) {
          // Each boat rows a slow circle off the quay, at its own pace.
          const phase = time * (0.05 + k * 0.02) + h * 1.7 + k * 2.1;
          const radius = 2 + k * 1.2;
          position.set(
            harbour.x + Math.cos(phase) * radius,
            Math.sin(time * 1.6 + k + h) * 0.04,
            harbour.z + Math.sin(phase) * radius,
          );
          euler.set(
            Math.sin(time * 1.2 + k) * 0.06,
            -phase - Math.PI / 2,
            Math.sin(time * 1.4 + h) * 0.05,
          );
          quaternion.setFromEuler(euler);
          matrix.compose(position, quaternion, one);
          boats.setMatrixAt(h * BOATS + k, matrix);
        }
      });
      boats.instanceMatrix.needsUpdate = true;
    },
    smoke() {
      return smoke;
    },
    dispose() {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
      }
      boats.dispose();
      boatGeometry.dispose();
    },
  };
}

/** The middle of a place on the ground, a little above it. */
function anchor(game: Game, site: FactionSite): THREE.Vector3 {
  return new THREE.Vector3(
    site.x + site.w / 2,
    areaHeight(game.world, site.x, site.y, site.w, site.h) + 0.05,
    site.y + site.h / 2,
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
