/**
 * How the disasters look: flood water over the drowned tiles, parched
 * fields in a drought, snow over the roads and thick snowfall in a
 * blizzard, a dark swarm of locusts over the farms, the tsunami's wave
 * running at the coast - and in build mode the danger zones that a
 * protection building would guard.
 *
 * @module
 * @remarks
 * Only reads the game. The tile overlays are rebuilt when the disasters
 * or the buildings change, never per frame; the swarm and the snow are
 * fixed particle pools moved in the frame.
 */
import * as THREE from "three";
import { BUILDING } from "@/games/imperavis/engine/buildings-data";
import {
  blizzardRages,
  dangerTiles,
  sideStep,
} from "@/games/imperavis/engine/disasters";
import { PROTECTION } from "@/games/imperavis/engine/disasters-data";
import { NO_ROAD } from "@/games/imperavis/engine/logistics-data";
import { HUMAN } from "@/games/imperavis/engine/players";
import { cornerHeight, groundHeight } from "@/games/imperavis/engine/terrain";
import type {
  BuildingKind,
  Disaster,
  Game,
} from "@/games/imperavis/engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- colours, heights, particle counts and speeds of the look */

/** Locusts in the swarm. */
const SWARM = 1800;

/** Snowflakes around the camera. */
const SNOW = 2600;

/** Half the side of the box the snow falls in. */
const SNOW_BOX = 34;

/** The wave starts this far out from the coast, tiles... */
const WAVE_OUT = 34;

/** ...is seen this long before it breaks, seconds... */
const WAVE_SHOWN = 14;

/** ...and runs on over the shore this long after, seconds. */
const WAVE_AFTER = 4;

/** The disasters' look. */
export type DisastersLayer = {
  readonly group: THREE.Group;
  /**
   * Brings the look up to date.
   *
   * @param game - the game
   * @param clock - the view's clock, seconds (stands while paused)
   * @param dt - seconds since the last frame, 0 while paused
   * @param centre - around where the snow falls
   * @param building - the kind being placed, or null
   */
  update(
    game: Game,
    clock: number,
    dt: number,
    centre: THREE.Vector3,
    building: BuildingKind | null,
  ): void;
  /** Whether a blizzard is drawn, for the sky and the snow on the ground. */
  readonly snowing: boolean;
  dispose(): void;
};

/**
 * Creates the layer.
 *
 * @param game - the game, for its world
 * @returns it
 */
export function createDisastersLayer(game: Game): DisastersLayer {
  const world = game.world;
  const n = world.n;
  const group = new THREE.Group();
  const tileMaterial = (color: number, opacity: number) =>
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexColors: false,
    });
  const floodMaterial = tileMaterial(0x2a6ea6, 0.8);
  const flood = new THREE.Mesh(new THREE.BufferGeometry(), floodMaterial);
  flood.renderOrder = 4;
  const droughtMaterial = tileMaterial(0xb58a3e, 0.55);
  const drought = new THREE.Mesh(new THREE.BufferGeometry(), droughtMaterial);
  drought.renderOrder = 3;
  const snowRoadMaterial = tileMaterial(0xf1f4fa, 0.85);
  const snowRoads = new THREE.Mesh(
    new THREE.BufferGeometry(),
    snowRoadMaterial,
  );
  snowRoads.renderOrder = 3;
  const zoneMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const zones = new THREE.Mesh(new THREE.BufferGeometry(), zoneMaterial);
  zones.renderOrder = 5;
  group.add(flood, drought, snowRoads, zones);

  // The locust swarm: dark specks circling a few spots over the farms.
  const swarmPositions = new Float32Array(SWARM * 3);
  const swarmGeometry = new THREE.BufferGeometry();
  swarmGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(swarmPositions, 3),
  );
  const swarmMaterial = new THREE.PointsMaterial({
    color: 0x2f2a14,
    size: 0.24,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const swarm = new THREE.Points(swarmGeometry, swarmMaterial);
  swarm.frustumCulled = false;
  swarm.visible = false;
  const seeds = new Float32Array(SWARM * 4);
  for (let i = 0; i < SWARM; i += 1) {
    seeds[i * 4] = Math.random();
    seeds[i * 4 + 1] = Math.random() * Math.PI * 2;
    seeds[i * 4 + 2] = 0.4 + Math.random() * 0.9;
    seeds[i * 4 + 3] = Math.random();
  }

  // Snow around the camera.
  const snowPositions = new Float32Array(SNOW * 3);
  const flakes = new Float32Array(SNOW * 3);
  for (let i = 0; i < SNOW; i += 1) {
    flakes[i * 3] = (Math.random() * 2 - 1) * SNOW_BOX;
    flakes[i * 3 + 1] = Math.random() * SNOW_BOX;
    flakes[i * 3 + 2] = (Math.random() * 2 - 1) * SNOW_BOX;
  }
  const snowGeometry = new THREE.BufferGeometry();
  snowGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(snowPositions, 3),
  );
  const snowMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.22,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const snow = new THREE.Points(snowGeometry, snowMaterial);
  snow.frustumCulled = false;
  snow.visible = false;

  // The wave: a long rolling crest with foam on top.
  const waveGeometry = new THREE.CylinderGeometry(
    1,
    1,
    1,
    10,
    1,
    false,
    0,
    Math.PI,
  );
  waveGeometry.rotateZ(Math.PI / 2);
  const waveMaterial = new THREE.MeshLambertMaterial({
    color: 0x2f6f93,
    transparent: true,
    opacity: 0.92,
  });
  const foamMaterial = new THREE.MeshBasicMaterial({
    color: 0xeaf4f8,
    transparent: true,
    opacity: 0.85,
  });
  const wave = new THREE.Group();
  const crest = new THREE.Mesh(waveGeometry, waveMaterial);
  const foam = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.12, 0.5),
    foamMaterial,
  );
  wave.add(crest, foam);
  wave.visible = false;
  group.add(swarm, snow, wave);

  let floodKey = "";
  let droughtKey = "";
  let roadKey = "";
  let zoneKey = "";
  let snowing = false;

  /** The flood water over every drowned tile. */
  const refreshFlood = (frameGame: Game) => {
    const floods = frameGame.hazards.disasters.filter(
      (d) => d.kind === "flood" && d.struck,
    );
    const key = floods.map((d) => `${d.id}:${d.tiles.length}`).join(",");
    if (key !== floodKey) {
      floodKey = key;
      flood.geometry.dispose();
      flood.geometry = tileQuads(
        game,
        floods.flatMap((d) => d.tiles),
        0.14,
      );
    }
  };

  /** Parched ground over the land of every island in a drought. */
  const refreshDrought = (frameGame: Game) => {
    const droughts = frameGame.hazards.disasters.filter(
      (d) => d.kind === "drought" && d.struck,
    );
    const key = `${droughts.map((d) => d.id).join(",")}@${frameGame.version}`;
    if (key !== droughtKey) {
      droughtKey = key;
      const tiles: number[] = [];
      const watered = frameGame.coverage.irrigation;
      for (const d of droughts) {
        const info = world.islands[d.island];
        for (let y = info.minY; y <= info.maxY; y += 1) {
          for (let x = info.minX; x <= info.maxX; x += 1) {
            const i = y * n + x;
            if (
              world.islandOf[i] === d.island &&
              watered?.[i] !== 1 &&
              frameGame.roads[i] === NO_ROAD
            ) {
              tiles.push(i);
            }
          }
        }
      }
      drought.geometry.dispose();
      drought.geometry = tileQuads(game, tiles, 0.04);
    }
  };

  /** Snow on every road while a blizzard rages. */
  const refreshRoads = (frameGame: Game) => {
    const key = snowing ? `snow@${frameGame.version}` : "";
    if (key !== roadKey) {
      roadKey = key;
      const tiles: number[] = [];
      if (snowing) {
        for (let i = 0; i < n * n; i += 1) {
          if (frameGame.roads[i] !== NO_ROAD) {
            tiles.push(i);
          }
        }
      }
      snowRoads.geometry.dispose();
      snowRoads.geometry = tileQuads(game, tiles, 0.13);
    }
  };

  /**
   * In build mode for a protection building: the human's endangered tiles,
   * green where that kind already guards them, red where nothing does.
   */
  const refreshZones = (frameGame: Game, kind: BuildingKind | null) => {
    const against = kind === null ? undefined : PROTECTION[kind];
    const key =
      against === undefined || kind === null
        ? ""
        : `${kind}@${frameGame.version}`;
    if (key !== zoneKey) {
      zoneKey = key;
      zones.geometry.dispose();
      zones.geometry = new THREE.BufferGeometry();
      if (against !== undefined && kind !== null) {
        const guard = frameGame.coverage[kind];
        const tiles: number[] = [];
        const colours: number[] = [];
        for (const island of frameGame.islands) {
          if (island.owner === HUMAN) {
            for (const threat of against) {
              for (const tile of dangerTiles(frameGame, island.id, threat)) {
                tiles.push(tile);
                colours.push(guard?.[tile] === 1 ? 0x4ade80 : 0xef4444);
              }
            }
          }
        }
        zones.geometry = tileQuads(game, tiles, 0.16, colours);
      }
    }
  };

  /** The swarm over the farms of every island the locusts plague. */
  const moveSwarm = (frameGame: Game, clock: number) => {
    const spots: THREE.Vector3[] = [];
    for (const d of frameGame.hazards.disasters) {
      if (d.kind === "locusts" && d.struck) {
        const farms = frameGame.buildings.filter(
          (b) =>
            b.island === d.island &&
            BUILDING[b.kind].recipe?.seasonal === "crop",
        );
        const info = world.islands[d.island];
        const centres =
          farms.length > 0
            ? farms.map((b) => [b.x + b.w / 2, b.y + b.h / 2])
            : [[info.cx, info.cy]];
        for (const [x, y] of centres) {
          spots.push(
            new THREE.Vector3(x, Math.max(0, groundHeight(world, x, y)), y),
          );
        }
      }
    }
    swarm.visible = spots.length > 0;
    if (swarm.visible) {
      for (let i = 0; i < SWARM; i += 1) {
        const spot = spots[Math.floor(seeds[i * 4] * spots.length)];
        const angle = seeds[i * 4 + 1] + clock * seeds[i * 4 + 2] * 1.6;
        const radius = 1.2 + seeds[i * 4 + 3] * 2.6;
        swarmPositions[i * 3] = spot.x + Math.cos(angle) * radius;
        swarmPositions[i * 3 + 1] =
          spot.y + 0.9 + Math.sin(angle * 1.7 + i) * 0.45 + seeds[i * 4 + 3];
        swarmPositions[i * 3 + 2] =
          spot.z + Math.sin(angle * 1.3) * radius * 0.8;
      }
      swarmGeometry.attributes.position.needsUpdate = true;
    }
  };

  /** Thick snowfall in a box around the camera. */
  const moveSnow = (dt: number, centre: THREE.Vector3) => {
    snow.visible = snowing;
    if (snowing) {
      for (let i = 0; i < SNOW; i += 1) {
        flakes[i * 3 + 1] -= 3.2 * dt;
        flakes[i * 3] += 1.6 * dt;
        if (flakes[i * 3 + 1] < 0) {
          flakes[i * 3 + 1] += SNOW_BOX;
          flakes[i * 3] = (Math.random() * 2 - 1) * SNOW_BOX;
        }
        if (flakes[i * 3] > SNOW_BOX) {
          flakes[i * 3] -= SNOW_BOX * 2;
        }
        snowPositions[i * 3] = centre.x + flakes[i * 3];
        snowPositions[i * 3 + 1] = centre.y + flakes[i * 3 + 1];
        snowPositions[i * 3 + 2] = centre.z + flakes[i * 3 + 2];
      }
      snowGeometry.attributes.position.needsUpdate = true;
    }
  };

  /** The wave of the tsunami coming at the coast, nearest to breaking first. */
  const moveWave = (frameGame: Game) => {
    const coming = frameGame.hazards.disasters.find(
      (d) =>
        d.kind === "tsunami" &&
        frameGame.time >= d.strikes - WAVE_SHOWN &&
        frameGame.time <= d.strikes + WAVE_AFTER,
    );
    wave.visible = coming !== undefined;
    if (coming !== undefined) {
      placeWave(frameGame, coming);
    }
  };

  /** Sets the wave between the open sea and the shore of its side. */
  const placeWave = (frameGame: Game, d: Disaster) => {
    const info = world.islands[d.island];
    const [sx, sy] = sideStep(d.side);
    // Half the island's width across the side, and its reach towards it.
    const across =
      sx === 0 ? (info.maxX - info.minX) / 2 : (info.maxY - info.minY) / 2;
    const reach =
      sx > 0
        ? info.maxX - info.cx
        : sx < 0
          ? info.cx - info.minX
          : sy > 0
            ? info.maxY - info.cy
            : info.cy - info.minY;
    const t = (frameGame.time - (d.strikes - WAVE_SHOWN)) / WAVE_SHOWN;
    const distance = reach + WAVE_OUT * (1 - t) - (t > 1 ? (t - 1) * 8 : 0);
    const x = info.cx + sx * distance;
    const z = info.cy + sy * distance;
    const height = 0.6 + Math.min(1, t) * 1.9;
    const fade =
      t > 1 ? Math.max(0, 1 - (t - 1) * (WAVE_SHOWN / WAVE_AFTER)) : 1;
    wave.position.set(x, 0, z);
    wave.rotation.set(0, sx !== 0 ? Math.PI / 2 : 0, 0);
    // The crest faces the island: turn it so its round side leads.
    wave.rotateY(sx > 0 || sy > 0 ? Math.PI : 0);
    crest.scale.set(across * 2 + 8, height, height * 2.2);
    foam.scale.set(across * 2 + 8, 1.5, height * 2);
    foam.position.set(0, height - 0.05, 0);
    waveMaterial.opacity = 0.92 * fade;
    foamMaterial.opacity = 0.85 * fade;
  };

  return {
    group,
    get snowing() {
      return snowing;
    },
    update(frameGame, clock, dt, centre, building) {
      snowing = blizzardRages(frameGame);
      refreshFlood(frameGame);
      refreshDrought(frameGame);
      refreshRoads(frameGame);
      refreshZones(frameGame, building);
      floodMaterial.opacity = 0.74 + Math.sin(clock * 1.4) * 0.08;
      moveSwarm(frameGame, clock);
      moveSnow(dt, centre);
      moveWave(frameGame);
    },
    dispose() {
      for (const mesh of [flood, drought, snowRoads, zones]) {
        mesh.geometry.dispose();
      }
      for (const material of [
        floodMaterial,
        droughtMaterial,
        snowRoadMaterial,
        zoneMaterial,
        swarmMaterial,
        snowMaterial,
        waveMaterial,
        foamMaterial,
      ]) {
        material.dispose();
      }
      swarmGeometry.dispose();
      snowGeometry.dispose();
      waveGeometry.dispose();
      foam.geometry.dispose();
    },
  };
}

/**
 * Flat quads over tiles, following the ground, lifted a little.
 *
 * @param game - the game, for its world
 * @param tiles - tile indices
 * @param lift - height over the ground (water level at least)
 * @param colours - one colour per tile for vertex colours, or none
 * @returns the geometry
 */
function tileQuads(
  game: Game,
  tiles: readonly number[],
  lift: number,
  colours?: readonly number[],
): THREE.BufferGeometry {
  const world = game.world;
  const n = world.n;
  const positions = new Float32Array(tiles.length * 18);
  const colourData =
    colours === undefined ? null : new Float32Array(tiles.length * 18);
  const colour = new THREE.Color();
  const h = (x: number, y: number) =>
    Math.max(0.02, cornerHeight(world, x, y)) + lift;
  tiles.forEach((tile, k) => {
    const x = tile % n;
    const y = Math.floor(tile / n);
    const corners = [
      [x, y],
      [x, y + 1],
      [x + 1, y],
      [x + 1, y],
      [x, y + 1],
      [x + 1, y + 1],
    ];
    corners.forEach(([cx, cy], c) => {
      positions[k * 18 + c * 3] = cx;
      positions[k * 18 + c * 3 + 1] = h(cx, cy);
      positions[k * 18 + c * 3 + 2] = cy;
    });
    if (colourData !== null && colours !== undefined) {
      colour.setHex(colours[k]);
      for (let c = 0; c < 6; c += 1) {
        colourData[k * 18 + c * 3] = colour.r;
        colourData[k * 18 + c * 3 + 1] = colour.g;
        colourData[k * 18 + c * 3 + 2] = colour.b;
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  if (colourData !== null) {
    geometry.setAttribute("color", new THREE.BufferAttribute(colourData, 3));
  }
  return geometry;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
