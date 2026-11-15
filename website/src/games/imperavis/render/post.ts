/**
 * Post-processing on the finer graphics levels: ambient occlusion in screen
 * space (GTAO) and bloom around what glows - lit windows, lanterns and fire.
 *
 * @module
 * @remarks
 * The scene is drawn into a multisampled half-float target with a depth
 * texture; GTAO reads that depth (normals come from the depth, so the scene
 * is not drawn a second time), bloom picks out only what is brighter than
 * daylight can make a surface, and the output pass tone-maps and encodes
 * sRGB just as a direct draw does. Without either effect the view draws
 * straight to the canvas and this costs nothing.
 */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import type { QualityProfile } from "./quality";

/** Samples of the multisampled scene target (antialiasing). */
const MSAA_SAMPLES = 4;

/** Bloom: strength at full night, blur radius, and the luminance it starts at. */
const BLOOM_STRENGTH = 0.85;
const BLOOM_RADIUS = 0.55;
const BLOOM_THRESHOLD = 1.05;

/** The threshold rises with the sunlight, so lit walls never bloom by day. */
const BLOOM_SUN_RAISE = 0.75;

/** A lightning flash lifts the threshold this much (no white-out). */
const BLOOM_FLASH_RAISE = 4;

/** Night share from which bloom shows on the medium level. */
const BLOOM_NIGHT_FROM = 0.35;
const BLOOM_NIGHT_FULL = 0.85;

/** By day on the high level, fire still blooms this much. */
const BLOOM_DAY = 0.45;

/** GTAO: reach in tiles, sample count, strength and fall-off. */
const AO_RADIUS = 1.1;
const AO_SAMPLES = 12;
const AO_STRENGTH = 0.85;
const AO_THICKNESS = 2.5;
const AO_FALLOFF = 0.6;

/** What lights the frame, for the bloom. */
export type PostLight = {
  /** 0 by day to 1 at night. */
  readonly night: number;
  /** Strength of the sun (0 at night). */
  readonly sun: number;
  /** Brightness of a lightning flash, 0 to 1. */
  readonly flash: number;
};

/** The post-processing chain. */
export type Post = {
  /** Takes on the effects of a graphics level. */
  setProfile(profile: QualityProfile): void;
  /** Sets the drawing size, CSS pixels, and the pixel ratio. */
  setSize(width: number, height: number, pixelRatio: number): void;
  /**
   * Draws the frame, with or without effects.
   *
   * @param light - what lights the frame
   */
  render(light: PostLight): void;
  dispose(): void;
};

/**
 * Creates the chain for a scene and its camera.
 *
 * @param renderer - the renderer
 * @param scene - the scene
 * @param camera - the camera
 * @returns the chain
 */
export function createPost(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): Post {
  let bloom = false;
  let occlusion = false;
  let chain: {
    composer: EffectComposer;
    targets: THREE.WebGLRenderTarget[];
    gtao: GTAOPass;
    glow: UnrealBloomPass;
    output: OutputPass;
  } | null = null;
  const size = { width: 1, height: 1, ratio: 1 };

  /** Builds the composer the first time an effect is wanted. */
  const ensure = () => {
    if (chain === null) {
      const target = new THREE.WebGLRenderTarget(
        size.width * size.ratio,
        size.height * size.ratio,
        {
          type: THREE.HalfFloatType,
          samples: MSAA_SAMPLES,
          depthTexture: new THREE.DepthTexture(1, 1),
        },
      );
      const composer = new EffectComposer(renderer, target);
      composer.setPixelRatio(size.ratio);
      composer.setSize(size.width, size.height);
      const gtao = new GTAOPass(
        scene,
        camera,
        size.width * size.ratio,
        size.height * size.ratio,
        { depthTexture: target.depthTexture ?? undefined },
      );
      gtao.updateGtaoMaterial({
        radius: AO_RADIUS,
        samples: AO_SAMPLES,
        thickness: AO_THICKNESS,
        distanceFallOff: AO_FALLOFF,
      });
      gtao.blendIntensity = AO_STRENGTH;
      // The denoiser indexes a vector with a variable, which the D3D shader
      // compiler warns about; pick the component with a mask instead.
      gtao.pdMaterial.fragmentShader =
        gtao.pdMaterial.fragmentShader.replaceAll(
          "noiseTexel[index % 4]",
          "dot(noiseTexel, vec4(equal(ivec4(index % 4), ivec4(0, 1, 2, 3))))",
        );
      gtao.pdMaterial.needsUpdate = true;
      const glow = new UnrealBloomPass(
        new THREE.Vector2(size.width, size.height),
        BLOOM_STRENGTH,
        BLOOM_RADIUS,
        BLOOM_THRESHOLD,
      );
      const output = new OutputPass();
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(gtao);
      composer.addPass(glow);
      composer.addPass(output);
      chain = {
        composer,
        targets: [composer.renderTarget1, composer.renderTarget2],
        gtao,
        glow,
        output,
      };
    }
    return chain;
  };

  /** Frees the composer and its targets. */
  const release = () => {
    if (chain !== null) {
      chain.gtao.dispose();
      chain.glow.dispose();
      chain.output.dispose();
      for (const target of chain.targets) {
        target.depthTexture?.dispose();
      }
      chain.composer.dispose();
      chain = null;
    }
  };

  return {
    setProfile(profile) {
      bloom = profile.bloom;
      occlusion = profile.occlusion;
      // A level without effects keeps no targets on the GPU.
      if (!bloom && !occlusion) {
        release();
      }
    },
    setSize(width, height, pixelRatio) {
      size.width = width;
      size.height = height;
      size.ratio = pixelRatio;
      if (chain !== null) {
        chain.composer.setPixelRatio(pixelRatio);
        chain.composer.setSize(width, height);
      }
    },
    render(light) {
      // Medium blooms only at night; high blooms fire by day as well.
      const nightShare = THREE.MathUtils.smoothstep(
        light.night,
        BLOOM_NIGHT_FROM,
        BLOOM_NIGHT_FULL,
      );
      const glowing = occlusion ? Math.max(BLOOM_DAY, nightShare) : nightShare;
      const glowOn = bloom && glowing > 0;
      if (glowOn || occlusion) {
        const { composer, gtao, glow } = ensure();
        gtao.enabled = occlusion;
        // The render pass draws into the buffer that is read first.
        const depth = composer.readBuffer.depthTexture;
        gtao.gtaoMaterial.uniforms.tDepth.value = depth;
        gtao.pdMaterial.uniforms.tDepth.value = depth;
        glow.enabled = glowOn;
        glow.strength = BLOOM_STRENGTH * glowing;
        glow.threshold =
          BLOOM_THRESHOLD +
          light.sun * BLOOM_SUN_RAISE +
          light.flash * BLOOM_FLASH_RAISE;
        composer.render();
      } else {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
      }
    },
    dispose: release,
  };
}
