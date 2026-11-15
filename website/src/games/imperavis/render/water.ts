/**
 * The sea and the rivers: waves, colour by depth (turquoise along the
 * coasts, deep blue in open water), surf along the shore, ripples, glints of
 * the sun and the moon, a reflection of the sky, and the wakes of ships.
 *
 * @module
 * @remarks
 * The shore is read from a small texture made once from the world's height
 * map, so the surf follows exactly the line where land and water meet. The
 * waves run on the water clock, which keeps going in pause.
 */
import * as THREE from "three";
import type { World } from "@/games/imperavis/engine/types";
import type { SharedUniforms } from "./materials";

/** Lowest and highest ground height the sea map can hold. */
const MAP_LOW = -4;
const MAP_HIGH = 2;

/** Distance to land the sea map measures up to, tiles. */
const SHORE_REACH = 10;

/** Largest value of a byte channel. */
const BYTE = 255;

/** Channels of a texel (red, green, blue, alpha). */
const RGBA = 4;

/** Channel of the shore distance and of the unused blue. */
const GREEN = 1;
const BLUE = 2;
const ALPHA = 3;

/** Cost of a diagonal step in the distance sweep. */
const DIAGONAL = Math.SQRT2;

/** Colours of the water (sRGB), turned linear for the shader. */
const WATER_COLORS = {
  /** Over sand right at the coast. */
  shallow: 0x46c4b8,
  /** Coastal water a little out. */
  coast: 0x1f93a8,
  /** Open sea. */
  deep: 0x0e3f6a,
  /** Surf and wake. */
  foam: 0xf1f7f6,
  /** River water. */
  river: 0x4a9aa6,
} as const;

/** The wake quad, in ship lengths: ahead of the centre, behind it, to each side. */
const WAKE_FRONT = 0.7;
const WAKE_BACK = -3.9;
const WAKE_SIDE = 1.5;

/** Most ships with a wake. */
export const MAX_WAKES = 96;

/**
 * The waves, shared by the sea, the rivers and the wakes so that they move
 * together: a height and its slope at a world point.
 */
const WAVE_GLSL = /* glsl */ `
  uniform float uTime;
  uniform float uWaves;
  vec3 seaWave(vec2 p) {
    float a1 = p.x * 0.35 + uTime * 1.1;
    float a2 = p.y * 0.27 + uTime * 0.8;
    float a3 = (p.x + p.y) * 0.6 + uTime * 1.7;
    float h = (sin(a1) * 0.06 + sin(a2) * 0.06 + sin(a3) * 0.04) * uWaves;
    float dx = (cos(a1) * 0.35 * 0.06 + cos(a3) * 0.6 * 0.04) * uWaves;
    float dz = (cos(a2) * 0.27 * 0.06 + cos(a3) * 0.6 * 0.04) * uWaves;
    return vec3(h, dx, dz);
  }
`;

/** What a water material needs to know. */
export type WaterOptions = {
  /** River water: no sea map, a lighter colour, no surf. */
  readonly river: boolean;
  /** The sea map of the world, from {@link createSeaMap}. */
  readonly seaMap: THREE.Texture | null;
  /** Corners per side of the sea map (tiles + 1). */
  readonly mapSize: number;
};

/**
 * The sea map: the ground height under every tile corner (red) and how far
 * it is to land (green), for the depth colour and the surf.
 *
 * @param world - the world
 * @returns a texture of (n + 1) x (n + 1) texels, one per tile corner
 */
export function createSeaMap(world: World): THREE.DataTexture {
  const size = world.n + 1;
  const data = new Uint8Array(size * size * RGBA);
  const distance = new Float32Array(size * size).fill(SHORE_REACH);
  for (let i = 0; i < size * size; i += 1) {
    const height = world.heights[i];
    data[i * RGBA] = Math.round(
      THREE.MathUtils.clamp((height - MAP_LOW) / (MAP_HIGH - MAP_LOW), 0, 1) *
        BYTE,
    );
    if (height > 0) {
      distance[i] = 0;
    }
  }
  sweepDistance(distance, size);
  for (let i = 0; i < size * size; i += 1) {
    data[i * RGBA + GREEN] = Math.round(
      Math.min(1, distance[i] / SHORE_REACH) * BYTE,
    );
    data[i * RGBA + BLUE] = 0;
    data[i * RGBA + ALPHA] = BYTE;
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * The water material of the sea or of the rivers.
 *
 * @param uniforms - the shared values (time, waves, sun, sky, night)
 * @param options - sea or river, and the sea map
 * @returns the material; its `QUALITY` define is set by {@link setWaterQuality}
 */
export function createWaterMaterial(
  uniforms: SharedUniforms,
  options: WaterOptions,
): THREE.ShaderMaterial {
  const color = (hex: number) => ({ value: new THREE.Color(hex) });
  return new THREE.ShaderMaterial({
    transparent: true,
    fog: true,
    defines: { QUALITY: 0, RIVER: options.river ? 1 : 0 },
    uniforms: {
      // The fog values are cloned; the shared ones stay shared.
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uTime: uniforms.time,
      uWaves: uniforms.waves,
      uSun: uniforms.sun,
      uSunColor: uniforms.sunColor,
      uNight: uniforms.night,
      uHorizon: uniforms.horizon,
      uZenith: uniforms.zenith,
      uSeaMap: { value: options.seaMap },
      uMapSize: { value: options.mapSize },
      uMapLow: { value: MAP_LOW },
      uMapHigh: { value: MAP_HIGH },
      uShoreReach: { value: SHORE_REACH },
      uShallow: color(WATER_COLORS.shallow),
      uCoast: color(WATER_COLORS.coast),
      uDeep: color(WATER_COLORS.deep),
      uFoam: color(WATER_COLORS.foam),
      uRiver: color(WATER_COLORS.river),
    },
    vertexShader: /* glsl */ `
      ${WAVE_GLSL}
      varying vec3 vWorld;
      varying vec2 vSlope;
      #include <fog_pars_vertex>
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vec3 wave = seaWave(world.xz);
        world.y += wave.x;
        vSlope = wave.yz;
        vWorld = world.xyz;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uWaves;
      uniform vec3 uSun;
      uniform vec3 uSunColor;
      uniform float uNight;
      uniform vec3 uHorizon;
      uniform vec3 uZenith;
      uniform sampler2D uSeaMap;
      uniform float uMapSize;
      uniform float uMapLow;
      uniform float uMapHigh;
      uniform float uShoreReach;
      uniform vec3 uShallow;
      uniform vec3 uCoast;
      uniform vec3 uDeep;
      uniform vec3 uFoam;
      uniform vec3 uRiver;
      varying vec3 vWorld;
      varying vec2 vSlope;
      #include <fog_pars_fragment>

      // Depth over which the colour turns from turquoise to deep blue, tiles.
      const float DEPTH_SCALE = 2.6;
      // Width of the surf band in height below the waterline, tiles.
      const float SURF_DEPTH = 0.18;
      // Darkening of the water at deepest night.
      const float NIGHT_DIM = 0.16;
      // Sun glint: tightness and strength.
      const float SHININESS = 140.0;
      const float GLINT = 1.1;
      // Ripples: strength by quality.
      const float RIPPLE = 0.15;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      // Slope of small ripples moving in three directions.
      vec2 ripples(vec2 p, float t) {
        vec2 d1 = vec2(0.8, 0.6);
        vec2 d2 = vec2(-0.5, 0.86);
        vec2 d3 = vec2(0.17, -0.98);
        vec2 g = d1 * cos(dot(p, d1) * 2.3 + t * 1.9) * 0.6;
        g += d2 * cos(dot(p, d2) * 3.1 + t * 2.3) * 0.45;
        g += d3 * cos(dot(p, d3) * 4.7 - t * 2.9) * 0.3;
        #if QUALITY >= 2
          g += vec2(0.6, -0.8) * cos(dot(p, vec2(0.6, -0.8)) * 7.9 + t * 3.7) * 0.18;
        #endif
        return g;
      }

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorld);
        vec2 slope = vSlope;
        #if QUALITY >= 1
          slope += ripples(vWorld.xz, uTime) * RIPPLE * (0.6 + 0.4 * uWaves);
        #endif
        vec3 n = normalize(vec3(-slope.x, 1.0, -slope.y));
        float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 4.0);
        float foam = 0.0;
        float alpha;
        vec3 color;
        #if RIVER == 1
          color = uRiver;
          alpha = 0.85;
        #else
          vec4 sea = texture2D(uSeaMap, (vWorld.xz + 0.5) / uMapSize);
          float ground = mix(uMapLow, uMapHigh, sea.r);
          float depth = max(0.0, vWorld.y - ground);
          float shore = sea.g * uShoreReach;
          float deepness = 1.0 - exp(-depth / DEPTH_SCALE);
          float open = smoothstep(2.0, uShoreReach, shore);
          color = mix(uShallow, uCoast, smoothstep(0.0, 0.55, deepness));
          color = mix(color, uDeep, max(smoothstep(0.35, 1.0, deepness), open));
          alpha = mix(0.5, 0.94, max(deepness, open));
          // Surf: a band along the waterline that washes in and out.
          float band = 1.0 - smoothstep(0.0, SURF_DEPTH, depth);
          // Only near the shore is the surf worth its noise (cheap on low).
          float wash = 0.5 + 0.5 * sin(depth * 18.0 - uTime * 1.6);
          float grain = 0.5;
          #if QUALITY >= 1
            if (band > 0.0) {
              wash = 0.5 + 0.5 * sin(depth * 18.0 - uTime * 1.6 + noise(vWorld.xz * 0.7) * 6.0);
              grain = noise(vWorld.xz * 3.0 + vec2(uTime * 0.3, -uTime * 0.2));
            }
          #endif
          foam = band * smoothstep(0.35, 0.75, wash * 0.6 + grain * 0.6);
          foam = max(foam, smoothstep(0.04, 0.0, depth) * 0.85);
        #endif
        // Sky reflection on the finest level, a hint of it below.
        #if QUALITY >= 2
          vec3 reflected = reflect(-viewDir, n);
          vec3 sky = mix(uHorizon, uZenith, clamp(reflected.y * 1.4, 0.0, 1.0));
          color = mix(color, sky, fresnel * 0.75 * (1.0 - uNight * 0.8));
        #else
          color = mix(color, uHorizon, fresnel * 0.35 * (1.0 - uNight * 0.8));
        #endif
        color *= mix(1.0, NIGHT_DIM, uNight);
        color = mix(color, uFoam * mix(1.0, NIGHT_DIM, uNight), foam);
        alpha = max(alpha, foam) + fresnel * 0.1;
        // Glints of the sun (or of the moon at night).
        vec3 h = normalize(normalize(uSun) + viewDir);
        float spec = pow(max(dot(n, h), 0.0), SHININESS) * GLINT;
        #if QUALITY >= 2
          spec += pow(max(dot(n, h), 0.0), SHININESS * 6.0) * GLINT * 2.0 * (1.0 - uNight);
        #endif
        // Rough seas scatter the glints instead of mirroring the sun.
        color += uSunColor * spec * (1.0 - foam) / (0.4 + 0.6 * uWaves);
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
}

/**
 * The material of the foam behind and around sailing ships. Each instance
 * is one ship: its matrix places a quad around the hull, scaled by the
 * ship's length; red of the instance colour is how fast it sails.
 *
 * @param uniforms - the shared values
 * @returns the material
 */
export function createWakeMaterial(
  uniforms: SharedUniforms,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uTime: uniforms.time,
      uWaves: uniforms.waves,
      uNight: uniforms.night,
      uFoam: { value: new THREE.Color(WATER_COLORS.foam) },
    },
    vertexShader: /* glsl */ `
      ${WAVE_GLSL}
      varying vec2 vLocal;
      varying float vSpeed;
      #include <fog_pars_vertex>
      void main() {
        vLocal = position.xz;
        vSpeed = 0.0;
        #ifdef USE_INSTANCING_COLOR
          vSpeed = instanceColor.r;
        #endif
        vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
        world.y += seaWave(world.xz).x + 0.03;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uNight;
      uniform vec3 uFoam;
      varying vec2 vLocal;
      varying float vSpeed;
      #include <fog_pars_fragment>

      // Half angle of the V of the wake (tan of about 20 degrees).
      const float SPREAD = 0.36;
      // Half the beam of a ship, in ship lengths.
      const float BEAM = 0.17;
      // Length of the trail behind the stern, in ship lengths.
      const float TRAIL = 2.4;
      const float NIGHT_DIM = 0.3;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
        // Along: 0 at the stern, growing backwards; across: from the keel.
        float along = -0.5 - vLocal.x;
        float across = abs(vLocal.y);
        float behind = step(0.0, along);
        float grain = noise(vLocal * 9.0 + vec2(uTime * 1.5, 0.0));
        float fade = pow(max(0.0, 1.0 - along / TRAIL), 1.5);
        // The two arms of the V, widening and fading behind the ship.
        float arm = abs(across - BEAM - max(0.0, along) * SPREAD);
        float arms = (1.0 - smoothstep(0.03, 0.07 + along * 0.06, arm)) * behind * fade;
        // The churned trail right behind the stern.
        float trail = (1.0 - smoothstep(0.0, BEAM * (1.2 + along * 0.8), across)) *
          behind * pow(max(0.0, 1.0 - along / (TRAIL * 0.7)), 2.0);
        // Foam along the hull and a bow wave.
        float side = (1.0 - smoothstep(0.0, 0.05, abs(across - BEAM * 1.1))) *
          (1.0 - behind) * step(vLocal.x, 0.5) * (0.35 + 0.65 * smoothstep(-0.5, 0.5, vLocal.x));
        float bow = (1.0 - smoothstep(0.0, 0.12, length(vec2((vLocal.x - 0.5) * 1.5, across)))) ;
        float foam = max(max(arms * 0.55, trail * 0.7), max(side, bow)) *
          smoothstep(0.3, 0.75, grain + 0.2);
        float alpha = foam * vSpeed;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uFoam * mix(1.0, NIGHT_DIM, uNight), alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
}

/**
 * The quad a wake is drawn on: around the hull and far behind it, in ship
 * lengths, bow towards +x.
 *
 * @returns the geometry
 */
export function wakeGeometry(): THREE.BufferGeometry {
  const length = WAKE_FRONT - WAKE_BACK;
  const geometry = new THREE.PlaneGeometry(length, WAKE_SIDE * 2);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate((WAKE_FRONT + WAKE_BACK) / 2, 0, 0);
  return geometry;
}

/**
 * Sets how finely water is drawn: 0 colour and surf, 1 ripples, 2 the sky
 * in it.
 *
 * @param material - a material from {@link createWaterMaterial}
 * @param quality - the water level of the graphics profile
 */
export function setWaterQuality(
  material: THREE.ShaderMaterial,
  quality: number,
): void {
  if (material.defines.QUALITY !== quality) {
    material.defines.QUALITY = quality;
    material.needsUpdate = true;
  }
}

/**
 * Distance to land at every corner, by two chamfer sweeps.
 *
 * @param distance - 0 on land, the reach elsewhere; filled in place
 * @param size - corners per side
 */
function sweepDistance(distance: Float32Array, size: number): void {
  const at = (x: number, y: number) => y * size + x;
  const relax = (i: number, x: number, y: number, cost: number) => {
    if (x >= 0 && y >= 0 && x < size && y < size) {
      distance[i] = Math.min(distance[i], distance[at(x, y)] + cost);
    }
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = at(x, y);
      relax(i, x - 1, y, 1);
      relax(i, x, y - 1, 1);
      relax(i, x - 1, y - 1, DIAGONAL);
      relax(i, x + 1, y - 1, DIAGONAL);
    }
  }
  for (let y = size - 1; y >= 0; y -= 1) {
    for (let x = size - 1; x >= 0; x -= 1) {
      const i = at(x, y);
      relax(i, x + 1, y, 1);
      relax(i, x, y + 1, 1);
      relax(i, x + 1, y + 1, DIAGONAL);
      relax(i, x - 1, y + 1, DIAGONAL);
    }
  }
}
