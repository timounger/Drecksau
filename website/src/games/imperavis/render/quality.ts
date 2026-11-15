/**
 * What each graphics level draws: resolution, shadows, post effects, plants,
 * model detail, water and ground.
 *
 * @module
 * @remarks
 * The one place that turns "low, medium, high" into numbers. Low stays close
 * to how the game looked before the levels existed, so weak devices keep
 * their frame rate.
 */
import type { Quality } from "@/games/imperavis/settings/preferences";

/** The drawing budget of one graphics level. */
export type QualityProfile = {
  /** Highest device pixel ratio drawn. */
  readonly pixelRatio: number;
  /** Side of the sun's shadow map, texels. */
  readonly shadowSize: number;
  /** Blur radius of the shadow edges, texels (1 is hard). */
  readonly shadowSoftness: number;
  /** Bloom around lit windows, lanterns and fires at night. */
  readonly bloom: boolean;
  /** Ambient occlusion in screen space (GTAO). */
  readonly occlusion: boolean;
  /** Share of the small plants and stones drawn, 0 to 1. */
  readonly vegetation: number;
  /** Detail of the models: 0 simple, 1 with frames, trims and rigging. */
  readonly detail: number;
  /** Water: 0 colour by depth and foam, 1 ripples, 2 sky reflection. */
  readonly water: number;
  /** Ground: 0 flat tiles, 1 soft blending, smooth light and fine noise. */
  readonly ground: number;
  /** Plants and trees sway in the wind. */
  readonly wind: boolean;
};

/** The profiles by level. */
export const QUALITY_PROFILES: Readonly<Record<Quality, QualityProfile>> = {
  low: {
    pixelRatio: 1.5,
    shadowSize: 2048,
    shadowSoftness: 1,
    bloom: false,
    occlusion: false,
    vegetation: 0,
    detail: 0,
    water: 0,
    ground: 0,
    wind: false,
  },
  medium: {
    pixelRatio: 1.5,
    shadowSize: 2048,
    shadowSoftness: 2.5,
    bloom: true,
    occlusion: false,
    vegetation: 0.5,
    detail: 1,
    water: 1,
    ground: 1,
    wind: true,
  },
  high: {
    pixelRatio: 2,
    shadowSize: 4096,
    shadowSoftness: 3,
    bloom: true,
    occlusion: true,
    vegetation: 1,
    detail: 1,
    water: 2,
    ground: 1,
    wind: true,
  },
};
