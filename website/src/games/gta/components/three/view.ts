/**
 * The 3D view of GTA: one WebGL canvas with the whole city in it, lit by the
 * hour, under the transparent canvas the heads-up display is painted on.
 *
 * @module
 * @remarks
 * Loaded on demand by the game hook, so three.js only reaches the browser
 * of somebody who actually looks at the city in 3D - the 2D view and every
 * other page stay as light as they were. It reads the game and never
 * changes it: the hook steps the engine and hands each new state in here,
 * exactly as it hands it to the 2D renderer.
 *
 * Built on IMPERAVIS's patterns - merged low-poly models with colours per
 * vertex, instanced crowds, a shadow camera that follows the view - and its
 * post-processing chain, which puts a glow round the lights at night.
 */
import * as THREE from "three";
import { createPost, type Post } from "@/games/imperavis/render/post";
import type { QualityProfile } from "@/games/imperavis/render/quality";
import { NIGHT_WEIGHT, hourLight } from "@/games/gta/components/render";
import type { GameState, Vec } from "@/games/gta/engine/types";
import { buildActors, type Actors3d } from "./actors";
import { FollowCamera } from "./camera";
import { buildCity, type City3d } from "./city";
import { buildEffects, type Effects3d } from "./effects";
import { buildGround, type Ground3d } from "./ground";
import { Bin } from "./kit";
import { createUniforms } from "./materials";
import { pickQuality, type Quality3d } from "./quality";

/** The 3D view, as the game hook sees it. */
export type ThreeView = {
  /**
   * Draws one frame.
   *
   * @param state - the city as it stands
   * @param zoom - the zoom of the settings
   * @param day - whether the clock runs and the night gets dark
   * @param dt - seconds since the last frame
   * @param steered - true while the caught mouse turns the camera
   */
  readonly render: (
    state: GameState,
    zoom: number,
    day: boolean,
    dt: number,
    steered: boolean,
  ) => void;
  /**
   * Which way the camera looks, as a heading in the city - what the keys and
   * the thumb stick are turned by, so that up is always straight ahead.
   *
   * @returns radians, nought east, a quarter turn south
   */
  readonly heading: () => number;
  /**
   * Turns the camera by hand.
   *
   * @param by - radians, positive clockwise seen from above
   */
  readonly turn: (by: number) => void;
  /**
   * The city point under a point of the picture, through the last frame's
   * camera.
   *
   * @param u - across, nought to one
   * @param v - down, nought to one
   * @param state - the city
   * @returns where to aim
   */
  readonly aim: (u: number, v: number, state: GameState) => Vec;
  /**
   * Where a point of the city lands in the picture.
   *
   * @param x - city x
   * @param y - city y
   * @param high - height above the road
   * @returns across and down, nought to one
   */
  readonly screenOf: (x: number, y: number, high: number) => Vec;
  /** What the last frame cost, for measuring. */
  readonly stats: () => ViewStats;
  /** Frees everything on the GPU and gives the WebGL context back. */
  readonly dispose: () => void;
};

/** What a frame cost. */
export type ViewStats = {
  readonly level: string;
  readonly calls: number;
  readonly triangles: number;
  readonly geometries: number;
  readonly textures: number;
  /** How long drawing a frame took on the CPU, smoothed, milliseconds. */
  readonly cpuMs: number;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- light: colours of
   the sky and the sun by the hour, strengths and the shadow box */

/** The sky and the light at noon. */
const DAY_SKY = new THREE.Color(0xa7cbe9);
const DAY_GROUND = new THREE.Color(0x6b6a5a);

/** And in the dead of night. */
const NIGHT_SKY = new THREE.Color(0x0b1328);
const NIGHT_GROUND = new THREE.Color(0x1a1f2c);

/** The light of the sky at night, brighter than the sky looks. */
const NIGHT_AIR = new THREE.Color(0x56679a);

/** How far ahead of the camera's target the shadows and sharp ground lie. */
const AHEAD = 1.2;

/** Where the haze starts and where it is solid, beyond the camera's own reach. */
const FOG_NEAR = 500;
const FOG_FAR = 1800;

/** The moon. */
const MOON_LIGHT = new THREE.Color(0xa9bcff);

/** Where the sun stands: south-east and high, so shadows fall away north. */
const SUN_FROM = new THREE.Vector3(0.45, 1, 0.55).normalize();

/** How far from its target the shadow camera stands. */
const SUN_AWAY = 1600;

/** How strong the sun and the sky are by day, and the moon by night. */
const SUN_DAY = 2.4;
const MOON = 0.55;
const SKY_DAY = 1.35;
const SKY_NIGHT = 0.95;

/** How quickly the measured cost of a frame follows the latest one. */
const COST_EASE = 0.05;

/** Weight of the hour's tint from which it is night for the lamps. */
const DUSK_FROM = 0.15;

/**
 * Makes the 3D view on a canvas.
 *
 * @param canvas - the WebGL canvas, laid out by CSS
 * @param state - the city at the start, for building it
 * @returns the view, or null where this browser cannot do WebGL
 */
export function createThreeView(
  canvas: HTMLCanvasElement,
  state: GameState,
): ThreeView | null {
  const quality = pickQuality();
  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality.antialias,
      powerPreference: "high-performance",
      alpha: false,
    });
  } catch {
    renderer = null;
  }
  return renderer === null ? null : makeView(renderer, canvas, state, quality);
}

/**
 * The view, once there is a renderer for it.
 *
 * @param renderer - the WebGL renderer on the canvas
 * @param canvas - the canvas
 * @param state - the city at the start
 * @param quality - what this device can carry
 * @returns the view
 */
function makeView(
  renderer: THREE.WebGLRenderer,
  canvas: HTMLCanvasElement,
  state: GameState,
  quality: Quality3d,
): ThreeView {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.info.autoReset = false;
  const bin = new Bin();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color();
  scene.fog = new THREE.Fog(0xffffff, 1000, 4000);
  const uniforms = createUniforms();
  const eye = new FollowCamera();

  const sky = new THREE.HemisphereLight(0xffffff, 0x444444, SKY_DAY);
  const sun = new THREE.DirectionalLight(0xffffff, SUN_DAY);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
  sun.shadow.camera.left = -quality.shadowReach;
  sun.shadow.camera.right = quality.shadowReach;
  sun.shadow.camera.top = quality.shadowReach;
  sun.shadow.camera.bottom = -quality.shadowReach;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = SUN_AWAY * 2.2;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.8;
  scene.add(sky, sun, sun.target);

  const ground: Ground3d = buildGround(state, uniforms, quality, bin);
  const city: City3d = buildCity(state, uniforms, quality, bin);
  scene.add(ground.group, city.group);
  const actors: Actors3d = buildActors(scene, state, uniforms, quality, bin);
  const effects: Effects3d = buildEffects(scene, uniforms, quality, bin);
  const post: Post = createPost(renderer, scene, eye.camera);
  post.setProfile(postProfile(quality));

  const tint = new THREE.Color();
  const size = { width: 0, height: 0, ratio: 0 };
  let started = false;
  let clock = 0;
  let disposed = false;
  let cost = 0;

  return {
    render: (now, zoom, day, dt, steered) => {
      if (disposed) {
        return;
      }
      const began = performance.now();
      const ratio = Math.min(window.devicePixelRatio || 1, quality.pixelRatio);
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      if (
        width !== size.width ||
        height !== size.height ||
        ratio !== size.ratio
      ) {
        size.width = width;
        size.height = height;
        size.ratio = ratio;
        renderer.setPixelRatio(ratio);
        renderer.setSize(width, height, false);
        post.setSize(width, height, ratio);
      }
      clock += dt;
      eye.update(now, zoom, dt, width / height, steered);
      // Ahead of the camera is where the picture is: the shadows and the
      // sharp ground are laid there, not round the player's feet.
      const aheadX = eye.target.x + Math.cos(eye.yaw) * eye.distance * AHEAD;
      const aheadZ = eye.target.z + Math.sin(eye.yaw) * eye.distance * AHEAD;
      const hour = hourLight(now.time);
      const weight = day ? hour.weight : 0;
      const night = Math.min(
        1,
        Math.max(0, (weight - DUSK_FROM) / (NIGHT_WEIGHT - DUSK_FROM)),
      );
      const share = weight / NIGHT_WEIGHT;
      tint.setRGB(
        hour.red / 255,
        hour.green / 255,
        hour.blue / 255,
        THREE.SRGBColorSpace,
      );
      // The sun goes the colour of the hour as it goes down, and at night
      // what is left of it is the moon: the navy of the tint, faint.
      sun.color
        .setRGB(1, 0.97, 0.92)
        .lerp(tint, Math.min(1, share * 1.6))
        .lerp(MOON_LIGHT, night);
      sun.intensity = SUN_DAY * (1 - night) + MOON * night;
      sky.color.copy(DAY_SKY).lerp(NIGHT_AIR, night);
      sky.groundColor.copy(DAY_GROUND).lerp(NIGHT_GROUND, night);
      sky.intensity = SKY_DAY * (1 - night) + SKY_NIGHT * night;
      const background = scene.background;
      if (background instanceof THREE.Color) {
        background
          .copy(DAY_SKY)
          .lerp(tint, Math.min(1, share * 1.2))
          .lerp(NIGHT_SKY, night);
        scene.fog?.color.copy(background);
      }
      // Looking along the street the camera sees far: the haze starts well
      // down the road and swallows the edge of what is drawn.
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.near = eye.distance * 3 + FOG_NEAR;
        scene.fog.far = eye.distance * 6 + FOG_FAR;
      }
      // The shadow box goes where the camera looks, snapped to its own
      // texels so the edges of the shadows do not crawl as one walks.
      const texel = (quality.shadowReach * 2) / quality.shadowSize;
      const middleX = Math.round(aheadX / texel) * texel;
      const middleZ = Math.round(aheadZ / texel) * texel;
      sun.target.position.set(middleX, 0, middleZ);
      sun.position.set(
        middleX + SUN_FROM.x * SUN_AWAY,
        SUN_FROM.y * SUN_AWAY,
        middleZ + SUN_FROM.z * SUN_AWAY,
      );
      sun.target.updateMatrixWorld();
      uniforms.night.value = night;
      uniforms.time.value = clock;
      uniforms.eye.value.copy(eye.camera.position);
      uniforms.focus.value.copy(eye.focus);
      uniforms.cut.value =
        now.player.car === null && !now.player.flying
          ? 30
          : now.player.flying
            ? 0
            : 46;
      ground.update(
        aheadX,
        aheadZ,
        eye.distance,
        started ? quality.paintsPerFrame : quality.tiles,
      );
      started = true;
      city.update(now, night);
      actors.update(now, eye.target.x, eye.target.z, night);
      effects.update(now, eye.target.x, eye.target.z);
      renderer.info.reset();
      post.render({ night, sun: 1 - night, flash: 0 });
      cost += (performance.now() - began - cost) * COST_EASE;
    },
    heading: () => eye.yaw,
    turn: (by) => eye.turn(by),
    aim: (u, v, now) => eye.aim(u, v, now),
    screenOf: (x, y, high) => eye.screenOf(x, y, high),
    stats: () => ({
      level: quality.level,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      cpuMs: cost,
    }),
    dispose: () => {
      if (!disposed) {
        disposed = true;
        actors.dispose();
        effects.dispose();
        post.dispose();
        bin.empty();
        scene.clear();
        renderer.renderLists.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      }
    },
  };
}

/**
 * What IMPERAVIS's post-processing is asked for: the glow at night where the
 * device can carry it, and nothing else.
 *
 * @param quality - this device's level
 * @returns the profile the chain reads
 */
function postProfile(quality: Quality3d): QualityProfile {
  return {
    pixelRatio: quality.pixelRatio,
    shadowSize: quality.shadowSize,
    shadowSoftness: 1,
    bloom: quality.bloom,
    occlusion: false,
    vegetation: 0,
    detail: 0,
    water: 0,
    ground: 0,
    wind: false,
  };
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
