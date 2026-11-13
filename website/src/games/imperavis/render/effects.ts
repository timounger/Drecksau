/**
 * Weather and smoke: a pooled particle system for chimney smoke, falling
 * rain around the camera, and lightning flashes in storms.
 *
 * @module
 */
import * as THREE from "three";
import type { SmokeSource } from "./buildings-layer";

/* eslint-disable @typescript-eslint/no-magic-numbers -- particle counts, lifetimes and speeds */

/** Smoke puffs in the pool. */
const SMOKE = 600;

/** Seconds a puff lives. */
const SMOKE_LIFE = 4.5;

/** Puffs per second per full-strength chimney. */
const SMOKE_RATE = 2.2;

/** Rain streaks around the camera. */
const RAIN = 1400;

/** Half the side of the box the rain falls in. */
const RAIN_BOX = 30;

/** The particle effects. */
export type Effects = {
  readonly group: THREE.Group;
  /**
   * Advances smoke and rain.
   *
   * @param dt - game-speed seconds since the last frame (0 while paused)
   * @param sources - chimneys smoking now
   * @param rain - 0 none, 1 rain, 2 storm
   * @param center - around where rain falls
   * @param night - 0 day to 1 night
   */
  update(
    dt: number,
    sources: readonly SmokeSource[],
    rain: number,
    center: THREE.Vector3,
    night: number,
  ): void;
  /** Brightness of a lightning flash now, 0 to 1. */
  readonly flash: number;
  dispose(): void;
};

/**
 * Creates the effects.
 *
 * @returns them
 */
export function createEffects(): Effects {
  const group = new THREE.Group();
  // A soft round puff drawn once on a canvas.
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 30);
  gradient.addColorStop(0, "rgba(255,255,255,0.9)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  const smokePositions = new Float32Array(SMOKE * 3);
  const smokeAlpha = new Float32Array(SMOKE);
  const smokeAge = new Float32Array(SMOKE).fill(SMOKE_LIFE);
  const smokeDrift = new Float32Array(SMOKE * 2);
  const smokeGeometry = new THREE.BufferGeometry();
  smokeGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(smokePositions, 3),
  );
  smokeGeometry.setAttribute("alpha", new THREE.BufferAttribute(smokeAlpha, 1));
  const smokeMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uMap: { value: texture }, uNight: { value: 0 } },
    vertexShader: `
      attribute float alpha;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (1.0 + (1.0 - alpha) * 2.5) * 260.0 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uNight;
      varying float vAlpha;
      void main() {
        vec4 t = texture2D(uMap, gl_PointCoord);
        vec3 c = mix(vec3(0.78, 0.78, 0.76), vec3(0.25, 0.26, 0.3), uNight);
        gl_FragColor = vec4(c, t.a * vAlpha * 0.55);
      }
    `,
  });
  const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
  smoke.frustumCulled = false;
  group.add(smoke);
  let nextPuff = 0;
  let owed = 0;

  const rainPositions = new Float32Array(RAIN * 6);
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(rainPositions, 3),
  );
  const rainMaterial = new THREE.LineBasicMaterial({
    color: 0xaec4d6,
    transparent: true,
    opacity: 0.45,
  });
  const rain = new THREE.LineSegments(rainGeometry, rainMaterial);
  rain.frustumCulled = false;
  group.add(rain);
  const drops = new Float32Array(RAIN * 3);
  for (let i = 0; i < RAIN; i += 1) {
    drops[i * 3] = (Math.random() * 2 - 1) * RAIN_BOX;
    drops[i * 3 + 1] = Math.random() * RAIN_BOX;
    drops[i * 3 + 2] = (Math.random() * 2 - 1) * RAIN_BOX;
  }
  let flash = 0;

  return {
    group,
    get flash() {
      return flash;
    },
    update(dt, sources, rainLevel, center, night) {
      smokeMaterial.uniforms.uNight.value = night;
      // Emit puffs.
      owed +=
        dt *
        SMOKE_RATE *
        sources.reduce((sum, source) => sum + source.strength, 0);
      const step = sources.length > 0 ? Math.max(1, Math.floor(owed)) : 0;
      for (let k = 0; k < step && owed >= 1; k += 1) {
        const source = sources[Math.floor(Math.random() * sources.length)];
        const i = nextPuff;
        nextPuff = (nextPuff + 1) % SMOKE;
        smokePositions[i * 3] = source.x;
        smokePositions[i * 3 + 1] = source.y;
        smokePositions[i * 3 + 2] = source.z;
        smokeDrift[i * 2] = 0.15 + Math.random() * 0.2;
        smokeDrift[i * 2 + 1] = (Math.random() - 0.5) * 0.2;
        smokeAge[i] = 0;
        owed -= 1;
      }
      for (let i = 0; i < SMOKE; i += 1) {
        if (smokeAge[i] < SMOKE_LIFE) {
          smokeAge[i] += dt;
          smokePositions[i * 3] += smokeDrift[i * 2] * dt;
          smokePositions[i * 3 + 1] += 0.55 * dt;
          smokePositions[i * 3 + 2] += smokeDrift[i * 2 + 1] * dt;
          smokeAlpha[i] = Math.max(0, 1 - smokeAge[i] / SMOKE_LIFE);
        } else {
          smokeAlpha[i] = 0;
        }
      }
      smokeGeometry.attributes.position.needsUpdate = true;
      smokeGeometry.attributes.alpha.needsUpdate = true;
      // Rain falls in a box that follows the camera target.
      rain.visible = rainLevel > 0;
      if (rain.visible) {
        // Standing still while paused (dt is 0 then).
        const fall = (rainLevel > 1 ? 34 : 22) * dt;
        const slant = rainLevel > 1 ? 0.5 : 0.15;
        const shown = rainLevel > 1 ? RAIN : RAIN * 0.6;
        for (let i = 0; i < RAIN; i += 1) {
          drops[i * 3 + 1] -= fall;
          drops[i * 3] += fall * slant * 0.3;
          if (drops[i * 3 + 1] < 0) {
            drops[i * 3 + 1] += RAIN_BOX;
            drops[i * 3] = (Math.random() * 2 - 1) * RAIN_BOX;
          }
          const visible = i < shown;
          const x = center.x + drops[i * 3];
          const y = center.y + drops[i * 3 + 1];
          const z = center.z + drops[i * 3 + 2];
          rainPositions[i * 6] = x;
          rainPositions[i * 6 + 1] = visible ? y : -100;
          rainPositions[i * 6 + 2] = z;
          rainPositions[i * 6 + 3] = x + slant * 0.4;
          rainPositions[i * 6 + 4] = visible ? y + 0.8 : -100;
          rainPositions[i * 6 + 5] = z;
        }
        rainGeometry.attributes.position.needsUpdate = true;
      }
      // Lightning now and then in a storm; none while paused.
      flash = dt > 0 ? Math.max(0, flash - dt * 4) : 0;
      if (rainLevel > 1 && Math.random() < dt * 0.12) {
        flash = 1;
      }
    },
    dispose() {
      smokeGeometry.dispose();
      smokeMaterial.dispose();
      rainGeometry.dispose();
      rainMaterial.dispose();
      texture.dispose();
    },
  };
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
