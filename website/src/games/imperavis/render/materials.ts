/**
 * The shared materials: buildings with windows that glow at night, terrain
 * that whitens in winter and foliage that turns with the seasons (the water
 * is in `water.ts`).
 *
 * @module
 */
import * as THREE from "three";

/* eslint-disable @typescript-eslint/no-magic-numbers -- shader constants and colours */

/**
 * Light of a lit window at night, linear and above 1 so that only windows,
 * lanterns and fires reach the bloom threshold.
 */
const WINDOW_LIGHT = "vec3(2.4, 1.45, 0.55)";

/** Light of embers and fire, day and night (see {@link FIRE_DAY}). */
const FIRE_LIGHT = "vec3(3.2, 1.3, 0.3)";

/** Share of the fire's glow by day. */
const FIRE_DAY = "0.35";

/** Values every material reads, changed once per frame. */
export type SharedUniforms = {
  /** 0 by day, 1 at deepest night. */
  readonly night: { value: number };
  /** 0 to 1, how much snow lies. */
  readonly snow: { value: number };
  /** Seconds, for waves. */
  readonly time: { value: number };
  /** Wave height factor (storms raise it). */
  readonly waves: { value: number };
  /** Direction towards the sun. */
  readonly sun: { value: THREE.Vector3 };
  /** Colour of the sunlight. */
  readonly sunColor: { value: THREE.Color };
  /** Sky colour at the horizon (also the fog). */
  readonly horizon: { value: THREE.Color };
  /** Sky colour overhead, for reflections. */
  readonly zenith: { value: THREE.Color };
  /** Seconds of the living world: stands still while the game is paused. */
  readonly liveTime: { value: number };
  /** Strength of the wind on plants (storms raise it). */
  readonly gust: { value: number };
  /**
   * Worn ground per tile, from `landscape.ts`: red roads, green buildings.
   * Read with linear filtering, so the wear fades out softly.
   */
  readonly groundMask: { value: THREE.Texture | null };
  /** Tiles per side of the map, to read the ground mask. */
  readonly mapTiles: { value: number };
};

/**
 * Creates the shared uniform values.
 *
 * @returns them
 */
export function createUniforms(): SharedUniforms {
  return {
    night: { value: 0 },
    snow: { value: 0 },
    time: { value: 0 },
    waves: { value: 1 },
    sun: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
    sunColor: { value: new THREE.Color(1, 1, 1) },
    horizon: { value: new THREE.Color(1, 1, 1) },
    zenith: { value: new THREE.Color(1, 1, 1) },
    liveTime: { value: 0 },
    gust: { value: 1 },
    groundMask: { value: null },
    mapTiles: { value: 1 },
  };
}

/**
 * The material of buildings, ships and carts: vertex colours, and windows
 * (the `glow` attribute) that light up warm at night.
 *
 * @param uniforms - the shared values
 * @returns the material
 */
export function createBuildingMaterial(
  uniforms: SharedUniforms,
): THREE.MeshLambertMaterial {
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = uniforms.night;
    shader.uniforms.uSnow = uniforms.snow;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float glow;\nvarying float vGlow;\nvarying float vUp;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvGlow = glow;\nvUp = normal.y;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uNight;\nuniform float uSnow;\nvarying float vGlow;\nvarying float vUp;",
      )
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.97, 1.0), uSnow * smoothstep(0.6, 0.9, vUp) * 0.85);",
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += ${WINDOW_LIGHT} * clamp(vGlow, 0.0, 1.0) * uNight;
        totalEmissiveRadiance += ${FIRE_LIGHT} * clamp(vGlow - 1.0, 0.0, 1.0) * (${FIRE_DAY} + uNight);`,
      );
  };
  return material;
}

/**
 * Smooth value noise in GLSL, for fine variation of colours: `noise(p)`
 * returns 0 to 1.
 */
export const NOISE_GLSL = /* glsl */ `
  float hash2d(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash2d(i), hash2d(i + vec2(1.0, 0.0)), u.x),
               mix(hash2d(i + vec2(0.0, 1.0)), hash2d(i + vec2(1.0, 1.0)), u.x), u.y);
  }
`;

/** Colour of worn ground around roads and buildings (sRGB). */
const WORN_GROUND = 0x9a8058;

/**
 * The terrain material: vertex colours, snow on flat ground in winter; on
 * the finer ground level (`GROUND` 1) also a fine colour grain and worn
 * earth that fades out around roads and buildings.
 *
 * @param uniforms - the shared values
 * @returns the material; its ground level is set by {@link setGroundLevel}
 */
export function createTerrainMaterial(
  uniforms: SharedUniforms,
): THREE.MeshLambertMaterial {
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  material.defines = { GROUND: 0 };
  const worn = { value: new THREE.Color(WORN_GROUND) };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSnow = uniforms.snow;
    shader.uniforms.uGroundMask = uniforms.groundMask;
    shader.uniforms.uMapTiles = uniforms.mapTiles;
    shader.uniforms.uWorn = worn;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vUp;
        varying float vHeight;
        varying vec2 vGround;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vUp = normal.y;
        vHeight = position.y;
        vGround = (modelMatrix * vec4(position, 1.0)).xz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uSnow;
        uniform sampler2D uGroundMask;
        uniform float uMapTiles;
        uniform vec3 uWorn;
        varying float vUp;
        varying float vHeight;
        varying vec2 vGround;
        // Strength of the colour grain and of the worn earth.
        const float GRAIN = 0.16;
        const float WEAR = 0.8;
        ${NOISE_GLSL}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        #if GROUND == 1
          float grain = noise(vGround * 0.45) * 0.55 + noise(vGround * 2.3) * 0.45;
          diffuseColor.rgb *= 1.0 + (grain - 0.5) * GRAIN;
          vec4 mask = texture2D(uGroundMask, vGround / uMapTiles);
          float wear = smoothstep(0.25, 0.75, max(mask.r, mask.g * 0.85));
          wear *= smoothstep(0.02, 0.25, vHeight);
          diffuseColor.rgb = mix(diffuseColor.rgb, uWorn * (0.85 + grain * 0.3), wear * WEAR);
        #endif
        float snowy = uSnow * smoothstep(0.15, 0.6, vHeight) * smoothstep(0.55, 0.85, vUp);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 0.99), snowy * 0.9);`,
      );
  };
  return material;
}

/**
 * Sets the ground level of the terrain material: 0 plain tiles, 1 with
 * grain and worn earth.
 *
 * @param material - from {@link createTerrainMaterial}
 * @param level - the ground level of the graphics profile
 */
export function setGroundLevel(material: THREE.Material, level: number): void {
  if (material.defines?.GROUND !== level) {
    material.defines = { ...material.defines, GROUND: level };
    material.needsUpdate = true;
  }
}

/**
 * Foliage colour per season, blended by how far the season has gone.
 *
 * @param season - 0 spring, 1 summer, 2 autumn, 3 winter
 * @param progress - 0 to 1 into the season
 * @returns the tint (multiplied with the vertex colours)
 */
export function foliageTint(season: number, progress: number): THREE.Color {
  const tints = [
    new THREE.Color(1.05, 1.15, 0.95),
    new THREE.Color(1, 1, 1),
    new THREE.Color(1.55, 1.0, 0.45),
    new THREE.Color(1.15, 1.15, 1.2),
  ];
  const next = (season + 1) % tints.length;
  // Hold the season's colour, then turn in the last third.
  const blend = Math.max(0, (progress - 0.66) / 0.34);
  return tints[season].clone().lerp(tints[next], blend);
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
