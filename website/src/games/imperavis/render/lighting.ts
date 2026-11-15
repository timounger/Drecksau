/**
 * Light and sky: the sun and the moon, the sky's hemisphere light, warm and
 * cool tints by time of day and season, weather gloom, distance fog and a
 * shadow camera that covers what the camera sees.
 *
 * @module
 */
import * as THREE from "three";
import {
  dayFraction,
  seasonAt,
  seasonProgress,
  SEASONS,
} from "@/games/imperavis/engine/time";
import type { Game, Season } from "@/games/imperavis/engine/types";
import { foliageTint, type SharedUniforms } from "./materials";
import type { QualityProfile } from "./quality";

/* eslint-disable @typescript-eslint/no-magic-numbers -- colours of the sky and light by season, and light tuning */

/** Sky colours of a season at noon: at the horizon and overhead. */
const SKY_HORIZON: Readonly<Record<Season, number>> = {
  spring: 0xa3cfee,
  summer: 0x93c6ec,
  autumn: 0xb1c7d9,
  winter: 0xc3d3e2,
};
const SKY_ZENITH: Readonly<Record<Season, number>> = {
  spring: 0x5f9ed8,
  summer: 0x4b8fd6,
  autumn: 0x7097bd,
  winter: 0x8eaacb,
};

/** Colour of the noon sun by season: warm in summer, cool in winter. */
const SUN_NOON: Readonly<Record<Season, number>> = {
  spring: 0xfff5e4,
  summer: 0xfff0d2,
  autumn: 0xffe2bd,
  winter: 0xe8eeff,
};

/** Light bounced off the ground by season (green, brown, snow). */
const GROUND_BOUNCE: Readonly<Record<Season, number>> = {
  spring: 0x5c7240,
  summer: 0x5d6236,
  autumn: 0x6d5634,
  winter: 0x9ba4ae,
};

/** Fixed colours: low sun, dusk sky, night sky, moon and storm. */
const LOW_SUN = 0xffa45c;
const DUSK_HORIZON = 0xeaa676;
const DUSK_ZENITH = 0x7a7fae;
const NIGHT_HORIZON = 0x0f1828;
const NIGHT_ZENITH = 0x060a14;
const MOON = 0x8fa8d8;
const STORM = 0x5d6b78;
const HEMI_DAY = 0xd3e7ff;
const HEMI_DUSK = 0xffc9a0;
const HEMI_NIGHT = 0x5a6c9c;

/** Light strengths. */
const SUN_STRENGTH = 2.7;
const MOON_STRENGTH = 0.75;
const HEMI_BASE = 0.62;
const HEMI_DAYLIGHT = 0.6;
const FLASH_LIGHT = 2.5;

/** The moon's glints on the water are faint. */
const MOON_GLINT = 0.015;

/** Fog density by weather, at the reference camera distance. */
const FOG_CLEAR = 0.0034;
const FOG_RAIN = 0.0075;
const FOG_STORM = 0.011;
const FOG_THICK = 0.022;
const FOG_BLIZZARD = 0.016;

/** Fog is thinned when the camera goes farther out than this, so the land the minimap frames stays in sight. */
const FOG_DISTANCE = 55;

/** How strongly the fog thins with distance (1 is in proportion). */
const FOG_THINNING = 0.85;

/** Fog drawn without the weather effects, as a share. */
const FOG_PLAIN = 0.6;

/** The shadow map covers the view out to this many camera distances... */
const SHADOW_REACH = 1.6;

/** ...but at least and at most this far from the target, tiles. */
const SHADOW_MIN = 22;
const SHADOW_MAX = 150;

/** Heights the shadow volume spans above sea level, and room behind it. */
const SHADOW_TOP = 14;
const SHADOW_DEPTH_PAD = 40;

/** Distance of the shadow camera from the plane through the centre. */
const SHADOW_EYE = 240;

/** The shadow box grows in steps of this many tiles (no texel crawl while zooming). */
const SHADOW_STEP = 4;

/** Gloom of the light by weather. */
const WEATHER_GLOOM: Readonly<Record<Game["weather"], number>> = {
  clear: 0,
  rain: 0.3,
  storm: 0.55,
  fog: 0.2,
};

/** Fog density by weather. */
const FOG_DENSITY: Readonly<Record<Game["weather"], number>> = {
  clear: FOG_CLEAR,
  rain: FOG_RAIN,
  storm: FOG_STORM,
  fog: FOG_THICK,
};

/** Wave height by weather. */
const WAVES: Readonly<Record<Game["weather"], number>> = {
  clear: 1,
  rain: 1.4,
  storm: 2.6,
  fog: 0.8,
};

/** Wind on plants and trees by weather. */
const GUSTS: Readonly<Record<Game["weather"], number>> = {
  clear: 1,
  rain: 1.6,
  storm: 3,
  fog: 0.5,
};

/** Screen corners in device coordinates. */
const CORNERS: readonly (readonly [number, number])[] = [
  [-1, 1],
  [1, 1],
  [1, -1],
  [-1, -1],
];

/** What the frame looks like, for the other layers. */
export type FrameLook = {
  /** 0 by day, 1 at deepest night. */
  readonly night: number;
  /** Tint of the foliage. */
  readonly foliage: THREE.Color;
  /** 0 no rain, 1 rain, 2 storm. */
  readonly rain: number;
};

/** What the light needs to know each frame. */
export type LightingInput = {
  readonly game: Game;
  /** Real seconds since the last frame. */
  readonly dt: number;
  /** A blizzard is raging. */
  readonly blizzard: boolean;
  /** Brightness of a lightning flash, 0 to 1. */
  readonly flash: number;
  /** Whether rain, storm and thick fog are drawn. */
  readonly weatherShown: boolean;
  /** Where the camera looks, tiles. */
  readonly target: THREE.Vector2;
  /** Height of the ground under the target. */
  readonly floor: number;
  /** Distance of the camera from the target. */
  readonly distance: number;
  readonly camera: THREE.PerspectiveCamera;
};

/** The lights and the sky. */
export type Lighting = {
  readonly sun: THREE.DirectionalLight;
  /**
   * Sets light, sky, fog and the shadow box for a frame.
   *
   * @param input - the frame
   * @returns how the frame looks
   */
  update(input: LightingInput): FrameLook;
  /** Takes on the shadow resolution and softness of a graphics level. */
  setProfile(profile: QualityProfile): void;
  /** Turns the sun's shadows on or off. */
  setShadows(on: boolean): void;
};

/**
 * Creates the lights and puts them into the scene.
 *
 * @param scene - the scene; gets the lights, the background and the fog
 * @param uniforms - the shared values the materials read
 * @returns the lighting
 */
export function createLighting(
  scene: THREE.Scene,
  uniforms: SharedUniforms,
): Lighting {
  const hemi = new THREE.HemisphereLight(HEMI_DAY, GROUND_BOUNCE.summer, 1);
  const sun = new THREE.DirectionalLight(0xffffff, SUN_STRENGTH);
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  scene.add(hemi, sun, sun.target);
  const fog = new THREE.FogExp2(SKY_HORIZON.summer, FOG_CLEAR);
  scene.fog = fog;
  const background = new THREE.Color();
  scene.background = background;
  let mapSize = 0;
  // Scratch values, reused every frame.
  const scratch = {
    a: new THREE.Color(),
    b: new THREE.Color(),
    c: new THREE.Color(),
    direction: new THREE.Vector3(),
    ray: new THREE.Vector3(),
    point: new THREE.Vector3(),
    basis: new THREE.Matrix4(),
    inverse: new THREE.Matrix4(),
    origin: new THREE.Vector3(),
    up: new THREE.Vector3(0, 1, 0),
  };

  /** The colour of a season table, blended into the next season late on. */
  const seasonal = (
    table: Readonly<Record<Season, number>>,
    season: Season,
    progress: number,
    into: THREE.Color,
  ) => {
    const next = SEASONS[(SEASONS.indexOf(season) + 1) % SEASONS.length];
    return into
      .setHex(table[season])
      .lerp(scratch.c.setHex(table[next]), seasonBlend(progress));
  };

  /** Fits the orthographic shadow camera around what the camera sees. */
  const fitShadow = (input: LightingInput, direction: THREE.Vector3) => {
    const { camera, target, distance, floor } = input;
    const reach = THREE.MathUtils.clamp(
      distance * SHADOW_REACH,
      SHADOW_MIN,
      SHADOW_MAX,
    );
    scratch.basis.lookAt(direction, scratch.origin, scratch.up);
    scratch.inverse.copy(scratch.basis).invert();
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;
    const take = (x: number, y: number, z: number) => {
      scratch.point.set(x, y, z).applyMatrix4(scratch.inverse);
      minX = Math.min(minX, scratch.point.x);
      maxX = Math.max(maxX, scratch.point.x);
      minY = Math.min(minY, scratch.point.y);
      maxY = Math.max(maxY, scratch.point.y);
      minZ = Math.min(minZ, scratch.point.z);
      maxZ = Math.max(maxZ, scratch.point.z);
    };
    for (const [cx, cy] of [...CORNERS, [0, 0] as const]) {
      scratch.ray
        .set(cx, cy, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize();
      const t =
        scratch.ray.y < 0
          ? (floor - camera.position.y) / scratch.ray.y
          : Number.POSITIVE_INFINITY;
      let x = camera.position.x + scratch.ray.x * Math.min(t, reach * 2);
      let z = camera.position.z + scratch.ray.z * Math.min(t, reach * 2);
      const far = Math.hypot(x - target.x, z - target.y);
      if (far > reach) {
        x = target.x + ((x - target.x) / far) * reach;
        z = target.y + ((z - target.y) / far) * reach;
      }
      take(x, 0, z);
      take(x, SHADOW_TOP, z);
    }
    const half =
      Math.ceil(Math.max(maxX - minX, maxY - minY) / 2 / SHADOW_STEP) *
      SHADOW_STEP;
    // Snap the centre to whole shadow texels so edges do not crawl.
    const texel = (half * 2) / Math.max(1, mapSize);
    const centreX = Math.round((minX + maxX) / 2 / texel) * texel;
    const centreY = Math.round((minY + maxY) / 2 / texel) * texel;
    scratch.point.set(centreX, centreY, 0).applyMatrix4(scratch.basis);
    sun.target.position.copy(scratch.point);
    sun.position.copy(scratch.point).addScaledVector(direction, SHADOW_EYE);
    const shadowCamera = sun.shadow.camera;
    shadowCamera.left = -half;
    shadowCamera.right = half;
    shadowCamera.top = half;
    shadowCamera.bottom = -half;
    shadowCamera.near = SHADOW_EYE - maxZ - SHADOW_DEPTH_PAD;
    shadowCamera.far = SHADOW_EYE - minZ + SHADOW_DEPTH_PAD;
    shadowCamera.updateProjectionMatrix();
  };

  return {
    sun,
    update(input) {
      const { game, dt, blizzard, flash } = input;
      const fraction = dayFraction(game.time);
      const angle = (fraction - 0.25) * Math.PI * 2;
      const elevation = Math.sin(angle);
      const daylight = THREE.MathUtils.smoothstep(elevation, -0.12, 0.25);
      const night = 1 - daylight;
      const dusk = Math.max(0, 1 - Math.abs(elevation) * 4) * 0.9;
      const weather = game.weather;
      const gloom = blizzard ? 0.45 : WEATHER_GLOOM[weather];
      const season = seasonAt(game.time);
      const progress = seasonProgress(game.time);
      // The sky: horizon (background and fog) and overhead (reflections).
      const horizon = seasonal(SKY_HORIZON, season, progress, scratch.a)
        .lerp(scratch.c.setHex(DUSK_HORIZON), dusk)
        .lerp(scratch.c.setHex(NIGHT_HORIZON), night)
        .lerp(scratch.c.setHex(STORM), gloom * daylight);
      background.copy(horizon);
      fog.color.copy(horizon);
      uniforms.horizon.value.copy(horizon);
      seasonal(SKY_ZENITH, season, progress, scratch.b)
        .lerp(scratch.c.setHex(DUSK_ZENITH), dusk)
        .lerp(scratch.c.setHex(NIGHT_ZENITH), night)
        .lerp(scratch.c.setHex(STORM), gloom * daylight);
      uniforms.zenith.value.copy(scratch.b);
      // Fog: thicker in bad weather, thinner the farther out the camera is.
      const thinning = Math.pow(
        Math.max(1, input.distance / FOG_DISTANCE),
        FOG_THINNING,
      );
      const fogTarget =
        ((blizzard ? FOG_BLIZZARD : FOG_DENSITY[weather]) *
          (input.weatherShown ? 1 : FOG_PLAIN)) /
        thinning;
      fog.density += (fogTarget - fog.density) * Math.min(1, dt * 0.8);
      // Sun by day, the moon opposite by night.
      const direction = scratch.direction
        .set(Math.cos(angle) * 0.75, Math.max(0.15, elevation), 0.45)
        .normalize();
      if (elevation < 0) {
        direction
          .set(-Math.cos(angle) * 0.6, Math.max(0.3, -elevation), -0.4)
          .normalize();
      }
      const low = THREE.MathUtils.clamp(1 - elevation * 2.5, 0, 1);
      if (elevation < 0) {
        sun.color.setHex(MOON);
      } else {
        seasonal(SUN_NOON, season, progress, sun.color).lerp(
          scratch.c.setHex(LOW_SUN),
          low * 0.75,
        );
      }
      sun.intensity =
        (elevation < 0 ? MOON_STRENGTH : SUN_STRENGTH * daylight) *
        (1 - gloom * 0.6);
      hemi.intensity =
        (HEMI_BASE + HEMI_DAYLIGHT * daylight) * (1 - gloom * 0.3) +
        flash * FLASH_LIGHT;
      hemi.color
        .setHex(HEMI_DAY)
        .lerp(scratch.c.setHex(HEMI_DUSK), dusk * 0.7)
        .lerp(scratch.c.setHex(HEMI_NIGHT), night);
      seasonal(
        GROUND_BOUNCE,
        season,
        progress,
        hemi.groundColor,
      ).multiplyScalar(1 - night * 0.6);
      uniforms.night.value = night;
      uniforms.sun.value.copy(direction);
      // Glints on the water: the sun's colour, or the faint moon.
      uniforms.sunColor.value
        .copy(sun.color)
        .multiplyScalar(elevation < 0 ? MOON_GLINT : daylight)
        .multiplyScalar(1 - gloom * 0.7);
      uniforms.waves.value +=
        (WAVES[weather] - uniforms.waves.value) * Math.min(1, dt);
      uniforms.gust.value +=
        (GUSTS[weather] - uniforms.gust.value) * Math.min(1, dt * 0.5);
      fitShadow(input, direction);
      // Seasons: snow and foliage; a blizzard snows the land in any season.
      const snow =
        season === "winter"
          ? THREE.MathUtils.smoothstep(progress, 0, 0.25) *
            (1 - THREE.MathUtils.smoothstep(progress, 0.8, 1))
          : 0;
      uniforms.snow.value = blizzard ? 1 : snow;
      return {
        night,
        foliage: foliageTint(SEASONS.indexOf(season), progress),
        rain:
          input.weatherShown && !blizzard
            ? weather === "storm"
              ? 2
              : weather === "rain"
                ? 1
                : 0
            : 0,
      };
    },
    setProfile(profile) {
      if (profile.shadowSize !== mapSize) {
        mapSize = profile.shadowSize;
        sun.shadow.mapSize.set(mapSize, mapSize);
        // The map is made again at the new size on the next frame.
        sun.shadow.map?.dispose();
        sun.shadow.map = null;
      }
      sun.shadow.radius = profile.shadowSoftness;
    },
    setShadows(on) {
      sun.castShadow = on;
    },
  };
}

/**
 * How far a season has turned into the next: it holds its colours, then
 * turns in the last third, as the foliage does.
 *
 * @param progress - 0 to 1 into the season
 * @returns 0 to 1
 */
function seasonBlend(progress: number): number {
  return Math.max(0, (progress - 0.66) / 0.34);
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
