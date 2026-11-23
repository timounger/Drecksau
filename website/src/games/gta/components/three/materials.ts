/**
 * The materials of the 3D city: bodywork that takes its paint per car,
 * windows that light up at night, figures dressed per person, a sea that
 * moves, and the cut through whatever stands between the camera and you.
 *
 * @module
 * @remarks
 * All of them are three's own Lambert and Phong materials with a few lines
 * spliced into their shaders, so light, shadow and fog come for free and
 * only what is particular to this city is written here.
 */
import * as THREE from "three";
import { CITY_SIZE } from "@/games/gta/engine/types";
import type { Bin } from "./kit";

/** Values every material reads, changed once a frame. */
export type Uniforms3d = {
  /** Nought by day, one in the dead of night. */
  readonly night: { value: number };
  /** Seconds, for the sea and the blue lamps. */
  readonly time: { value: number };
  /** Where the camera is. */
  readonly eye: { value: THREE.Vector3 };
  /** What must never be hidden: the player, at chest height. */
  readonly focus: { value: THREE.Vector3 };
  /** How wide the cut through a house in the way is, pixels. */
  readonly cut: { value: number };
  /** The floor of the whole city, for the surf along the shore. */
  readonly land: { value: THREE.Texture | null };
};

/** What sort of solid a material is for. */
export type SolidKind = "plain" | "paint" | "figure";

/**
 * Makes the shared values.
 *
 * @returns them, at noon with nobody to keep in sight
 */
export function createUniforms(): Uniforms3d {
  return {
    night: { value: 0 },
    time: { value: 0 },
    eye: { value: new THREE.Vector3() },
    focus: { value: new THREE.Vector3() },
    cut: { value: 0 },
    land: { value: null },
  };
}

/** Light of a lit window, linear and above one so it blooms. */
const WINDOW_LIGHT = "vec3(1.2, 0.86, 0.46)";

/** The hip and the shoulder of a figure, where legs and arms swing from. */
const HIP = "6.2";
const SHOULDER = "11.6";

/** What every vertex shader gets. */
const VERTEX_HEAD = /* glsl */ `
attribute vec4 tag;
varying float vGlow;
varying vec3 vCutWorld;
#define glow tag.x
#define paint tag.y
#define part tag.z
#define limb tag.w
#ifdef FIGURE
attribute vec3 aShirt;
attribute vec3 aLegs;
attribute vec3 aSkin;
attribute vec3 aHair;
attribute vec4 aMotion;
#endif
`;

/** The colour of a vertex: its own, the car's paint, or the person's. */
const VERTEX_COLOUR = /* glsl */ `
vColor = vec4(1.0);
#ifdef USE_COLOR
vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
vColor.rgb = mix(vColor.rgb, vColor.rgb * instanceColor.rgb, paint);
#endif
#ifdef FIGURE
if (part > 0.5 && part < 1.5) { vColor.rgb = aShirt; }
else if (part > 1.5 && part < 2.5) { vColor.rgb = aSkin; }
else if (part > 2.5 && part < 3.5) { vColor.rgb = aLegs; }
else if (part > 3.5 && part < 4.5) { vColor.rgb = aHair; }
#endif
vGlow = glow;
`;

/**
 * The stride: legs and arms swung about the hip and the shoulder.
 *
 * @remarks
 * `aMotion` is the phase of the step, how far the limbs swing, whether the
 * right arm holds something out, and a spare. The gun in the hand is part of
 * every figure and folded away to nothing when there is nothing held.
 */
const VERTEX_STRIDE = /* glsl */ `
#ifdef FIGURE
if (part > 4.5 && aMotion.z < 0.5) { transformed = vec3(0.0); }
if (abs(limb) > 0.5) {
  float side = sign(limb);
  bool leg = abs(limb) < 1.5;
  float pivot = leg ? ${HIP} : ${SHOULDER};
  float swing = sin(aMotion.x) * aMotion.y * side * (leg ? 1.0 : -0.8);
  if (!leg && side < 0.0 && aMotion.z > 0.5) { swing = 1.45; }
  float c = cos(swing);
  float s = sin(swing);
  float up = transformed.y - pivot;
  transformed.xy = vec2(transformed.x * c - up * s, transformed.x * s + up * c + pivot);
}
#endif
`;

/** Where a vertex ends up in the world, for the cut. */
const VERTEX_WORLD = /* glsl */ `
#ifdef CUT
vec4 cutAt = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
cutAt = instanceMatrix * cutAt;
#endif
vCutWorld = (modelMatrix * cutAt).xyz;
#endif
`;

/** What every fragment shader gets. */
const FRAGMENT_HEAD = /* glsl */ `
uniform float uNight;
uniform float uTime;
uniform vec3 uEye;
uniform vec3 uFocus;
uniform float uCut;
varying float vGlow;
varying vec3 vCutWorld;
float cityHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
`;

/**
 * The cut: whatever lies in a tube from the camera to the player is thinned
 * out to a screen of dots, so one sees through a house without it vanishing.
 */
const FRAGMENT_CUT = /* glsl */ `
#ifdef CUT
{
  vec3 seg = uFocus - uEye;
  float t = dot(vCutWorld - uEye, seg) / max(dot(seg, seg), 1.0);
  float off = distance(vCutWorld, uEye + seg * t);
  if (uCut > 0.0 && t > 0.0 && t < 0.97 && vCutWorld.y > 1.5 && off < uCut) {
    vec2 cell = mod(floor(gl_FragCoord.xy), 2.0);
    float keep = cell.x + cell.y * 2.0;
    float edge = smoothstep(0.62, 1.0, off / uCut);
    if (keep > edge * 3.0) { discard; }
  }
}
#endif
`;

/**
 * What glows: by night only up to one, by day as well from one to two, and
 * the two blue-and-red flashers at three and four.
 */
const FRAGMENT_GLOW = /* glsl */ `
#ifndef WALLS
{
  float nightGlow = clamp(vGlow, 0.0, 1.0) * uNight;
  float dayGlow = clamp(vGlow - 1.0, 0.0, 1.0);
  float flash = 0.0;
  if (vGlow > 2.5) {
    float beat = step(0.0, sin(uTime * 13.0));
    flash = vGlow < 3.5 ? beat : 1.0 - beat;
    nightGlow = 0.0;
    dayGlow = 0.0;
  }
  totalEmissiveRadiance += diffuseColor.rgb * (nightGlow * 1.6 + dayGlow * 1.4 + flash * 3.2);
}
#endif
`;

/**
 * A facade: the window picture's alpha is where the glass is, the glass
 * reflects a little sky, and at night some of it is lit - which windows, a
 * hash of the window and the house decides, so a street is never lit like a
 * chessboard.
 */
const FRAGMENT_FACADE_MAP = /* glsl */ `
float glass = 0.0;
#ifdef USE_MAP
vec4 facade = texture2D(map, vMapUv);
glass = 1.0 - facade.a;
diffuseColor.rgb *= facade.rgb;
#endif
`;

/** The glass colour, laid on after the wall's own colour. */
const FRAGMENT_FACADE_COLOUR = /* glsl */ `
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.11, 0.15, 0.2) + vec3(0.06, 0.09, 0.13) * (1.0 - uNight), glass);
`;

/** And the lit windows. */
const FRAGMENT_FACADE_LIGHT = /* glsl */ `
#ifdef USE_MAP
{
  float lit = step(0.52, cityHash(floor(vMapUv) + floor(vCutWorld.xz / 61.0)));
  totalEmissiveRadiance += ${WINDOW_LIGHT} * glass * lit * uNight;
}
#endif
`;

/**
 * The material of everything solid: houses, cars, trees, lamps, people.
 *
 * @param uniforms - the shared values
 * @param kind - plain, paint per instance, or a figure dressed per instance
 * @param cut - whether this is cut open where it hides the player
 * @param bin - where it is kept for freeing
 * @returns the material
 */
export function createSolid(
  uniforms: Uniforms3d,
  kind: SolidKind,
  cut: boolean,
  bin: Bin,
): THREE.MeshLambertMaterial {
  const material = bin.keep(
    new THREE.MeshLambertMaterial({ vertexColors: true }),
  );
  const defines: Record<string, string> = {};
  if (cut) {
    defines.CUT = "";
  }
  if (kind === "figure") {
    defines.FIGURE = "";
  }
  material.defines = defines;
  material.onBeforeCompile = (shader) => splice(shader, uniforms, false);
  material.customProgramCacheKey = () => `gta-solid-${kind}-${String(cut)}`;
  return material;
}

/**
 * The material of the walls of houses: their own colour, and windows.
 *
 * @param uniforms - the shared values
 * @param facade - the window picture, see {@link facadeTexture}
 * @param bin - where it is kept for freeing
 * @returns the material
 */
export function createWalls(
  uniforms: Uniforms3d,
  facade: THREE.Texture,
  bin: Bin,
): THREE.MeshLambertMaterial {
  const material = bin.keep(
    new THREE.MeshLambertMaterial({ vertexColors: true, map: facade }),
  );
  material.defines = { CUT: "", WALLS: "" };
  material.onBeforeCompile = (shader) => splice(shader, uniforms, true);
  material.customProgramCacheKey = () => "gta-walls";
  return material;
}

/**
 * Splices the city's lines into one of three's shaders.
 *
 * @param shader - what three is about to compile
 * @param uniforms - the shared values
 * @param walls - whether this is the facade material
 */
function splice(
  shader: THREE.WebGLProgramParametersWithUniforms,
  uniforms: Uniforms3d,
  walls: boolean,
): void {
  shader.uniforms.uNight = uniforms.night;
  shader.uniforms.uTime = uniforms.time;
  shader.uniforms.uEye = uniforms.eye;
  shader.uniforms.uFocus = uniforms.focus;
  shader.uniforms.uCut = uniforms.cut;
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", `#include <common>\n${VERTEX_HEAD}`)
    .replace("#include <color_vertex>", VERTEX_COLOUR)
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>\n${VERTEX_STRIDE}`,
    )
    .replace(
      "#include <project_vertex>",
      `#include <project_vertex>\n${VERTEX_WORLD}`,
    );
  let fragment = shader.fragmentShader
    .replace("#include <common>", `#include <common>\n${FRAGMENT_HEAD}`)
    .replace(
      "#include <clipping_planes_fragment>",
      `#include <clipping_planes_fragment>\n${FRAGMENT_CUT}`,
    )
    .replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>\n${FRAGMENT_GLOW}`,
    );
  if (walls) {
    fragment = fragment
      .replace("#include <map_fragment>", FRAGMENT_FACADE_MAP)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>\n${FRAGMENT_FACADE_COLOUR}`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>\n${FRAGMENT_FACADE_LIGHT}`,
      );
  }
  shader.fragmentShader = fragment;
}

/** Side of the window picture, texels. */
const FACADE_TEXELS = 64;

/**
 * The picture of one window and the wall round it.
 *
 * @param bin - where it is kept for freeing
 * @returns a texture to repeat over a wall: white wall with a slightly darker
 *   frame, and the glass transparent so the shader knows where it is
 */
export function facadeTexture(bin: Bin): THREE.Texture {
  const sheet = document.createElement("canvas");
  sheet.width = FACADE_TEXELS;
  sheet.height = FACADE_TEXELS;
  const paint = sheet.getContext("2d");
  if (paint !== null) {
    /* eslint-disable @typescript-eslint/no-magic-numbers -- drawing one
       window: where the frame and the pane sit in the square */
    paint.fillStyle = "#ffffff";
    paint.fillRect(0, 0, FACADE_TEXELS, FACADE_TEXELS);
    // A band between the storeys, a shade darker.
    paint.fillStyle = "#e4e0da";
    paint.fillRect(0, 0, FACADE_TEXELS, 6);
    paint.fillStyle = "#b9b4ad";
    paint.fillRect(12, 14, 40, 40);
    paint.clearRect(15, 17, 34, 34);
    // The bar across the middle of the pane.
    paint.fillStyle = "#b9b4ad";
    paint.fillRect(31, 17, 2, 34);
    // And the sill under it.
    paint.fillStyle = "#d8d3cc";
    paint.fillRect(10, 54, 44, 3);
    /* eslint-enable @typescript-eslint/no-magic-numbers */
  }
  const texture = bin.keep(new THREE.CanvasTexture(sheet));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * The sea: deep blue, moving, with surf along every shore.
 *
 * @param uniforms - the shared values
 * @param bin - where it is kept for freeing
 * @returns the material
 * @remarks
 * The ripples are noise, not geometry: the normal is bent by two layers of
 * it drifting against each other, which is what makes the sun and the moon
 * glitter on the water. The surf is read off the floor of the city - see
 * {@link Uniforms3d.land} - which is opaque on land and clear on water, so
 * wherever the two meet the water turns white.
 */
export function createSea(
  uniforms: Uniforms3d,
  bin: Bin,
): THREE.MeshPhongMaterial {
  const material = bin.keep(
    new THREE.MeshPhongMaterial({
      color: 0x1f5fb8,
      specular: 0x34465c,
      shininess: 28,
    }),
  );
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.time;
    shader.uniforms.uLand = uniforms.land;
    shader.uniforms.uSize = { value: CITY_SIZE };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vSea;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvSea = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vSea;
        uniform float uTime;
        uniform float uSize;
        uniform sampler2D uLand;
        float seaHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float seaNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(seaHash(i), seaHash(i + vec2(1.0, 0.0)), u.x),
                     mix(seaHash(i + vec2(0.0, 1.0)), seaHash(i + vec2(1.0, 1.0)), u.x), u.y);
        }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec2 at = vSea.xz;
        float wave = seaNoise(at / 46.0 + vec2(uTime * 0.21, uTime * 0.13))
          + seaNoise(at / 23.0 - vec2(uTime * 0.17, -uTime * 0.25)) * 0.5;
        diffuseColor.rgb *= 0.82 + wave * 0.22;
        vec2 onMap = vec2(at.x / uSize, 1.0 - at.y / uSize);
        float inside = step(0.0, onMap.x) * step(onMap.x, 1.0) * step(0.0, onMap.y) * step(onMap.y, 1.0);
        // The canvas is flipped onto the texture, north at the top.
        float shore = texture2D(uLand, onMap).a * inside;
        float surf = smoothstep(0.04, 0.5, shore) * (0.55 + 0.45 * sin(uTime * 1.7 + wave * 6.0));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.92, 0.96), clamp(surf, 0.0, 1.0) * 0.75);`,
      )
      .replace(
        "#include <normal_fragment_begin>",
        `#include <normal_fragment_begin>
        {
          float nx = seaNoise(vSea.xz / 19.0 + vec2(uTime * 0.6, 0.0)) - 0.5;
          float nz = seaNoise(vSea.xz / 17.0 + vec2(0.0, uTime * 0.5)) - 0.5;
          normal = normalize(normal + (viewMatrix * vec4(nx, 0.0, nz, 0.0)).xyz * 0.3);
        }`,
      );
  };
  material.customProgramCacheKey = () => "gta-sea";
  return material;
}

/**
 * A material for light itself: added onto what is behind it, never hiding
 * anything, untouched by fog and shadow.
 *
 * @param bin - where it is kept for freeing
 * @param opacity - how strong it is to begin with
 * @returns the material, white - instances bring their own colour
 */
export function createGlow(bin: Bin, opacity = 1): THREE.MeshBasicMaterial {
  return bin.keep(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
}
