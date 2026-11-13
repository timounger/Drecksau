/**
 * The shared materials: buildings with windows that glow at night, terrain
 * that whitens in winter, foliage that turns with the seasons, and the sea.
 *
 * @module
 */
import * as THREE from "three";

/* eslint-disable @typescript-eslint/no-magic-numbers -- shader constants and colours */

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
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.72, 0.35) * vGlow * uNight * 1.6;",
      );
  };
  return material;
}

/**
 * The terrain material: vertex colours, snow on flat ground in winter.
 *
 * @param uniforms - the shared values
 * @returns the material
 */
export function createTerrainMaterial(
  uniforms: SharedUniforms,
): THREE.MeshLambertMaterial {
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSnow = uniforms.snow;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vUp;\nvarying float vHeight;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvUp = normal.y;\nvHeight = position.y;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uSnow;\nvarying float vUp;\nvarying float vHeight;",
      )
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\nfloat snowy = uSnow * smoothstep(0.15, 0.6, vHeight) * smoothstep(0.55, 0.85, vUp);\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 0.99), snowy * 0.9);",
      );
  };
  return material;
}

/**
 * The sea: gentle waves in the vertex shader, depth-tinted colour, sun
 * glints and fog.
 *
 * @param uniforms - the shared values
 * @returns the material
 */
export function createWaterMaterial(
  uniforms: SharedUniforms,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: uniforms.time,
        uWaves: uniforms.waves,
        uSun: uniforms.sun,
        uSunColor: uniforms.sunColor,
        uNight: uniforms.night,
      },
    ]),
    vertexShader: `
      uniform float uTime;
      uniform float uWaves;
      varying vec3 vWorld;
      varying vec3 vNormal2;
      #include <fog_pars_vertex>
      void main() {
        vec3 p = position;
        vec4 world = modelMatrix * vec4(p, 1.0);
        float a = sin(world.x * 0.35 + uTime * 1.1) * 0.5 + sin(world.z * 0.27 + uTime * 0.8) * 0.5;
        float b = sin((world.x + world.z) * 0.6 + uTime * 1.7);
        world.y += (a * 0.12 + b * 0.04) * uWaves;
        float dx = cos(world.x * 0.35 + uTime * 1.1) * 0.35 * 0.06 * uWaves + cos((world.x + world.z) * 0.6 + uTime * 1.7) * 0.6 * 0.04 * uWaves;
        float dz = cos(world.z * 0.27 + uTime * 0.8) * 0.27 * 0.06 * uWaves + cos((world.x + world.z) * 0.6 + uTime * 1.7) * 0.6 * 0.04 * uWaves;
        vNormal2 = normalize(vec3(-dx, 1.0, -dz));
        vWorld = world.xyz;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform vec3 uSun;
      uniform vec3 uSunColor;
      uniform float uNight;
      varying vec3 vWorld;
      varying vec3 vNormal2;
      #include <fog_pars_fragment>
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorld);
        vec3 n = normalize(vNormal2);
        float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
        vec3 deep = vec3(0.07, 0.26, 0.40);
        vec3 sky = vec3(0.55, 0.72, 0.85);
        vec3 color = mix(deep, sky, fresnel * 0.6);
        vec3 h = normalize(normalize(uSun) + viewDir);
        float spec = pow(max(dot(n, h), 0.0), 90.0) * 0.9;
        color += uSunColor * spec;
        color *= mix(1.0, 0.28, uNight);
        gl_FragColor = vec4(color, 0.78 + fresnel * 0.2);
        #include <fog_fragment>
      }
    `,
  });
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
