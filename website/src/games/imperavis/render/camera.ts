/**
 * The CameraController: an orbiting perspective camera over the sea. It
 * glides towards a goal with a damping that does not depend on the frame
 * rate, pans by a speed per second that grows with the height, zooms
 * towards a point, turns and tilts within limits and stays above the
 * ground and over the map.
 *
 * @module
 * @remarks
 * The controller knows nothing of the mouse or the keys - `render/input.ts`
 * reads them and hands over pixels, wheel travel and a wish to move.
 */
import * as THREE from "three";

/** Closest and farthest zoom, in tiles from the target. */
export const MIN_DISTANCE = 7;
export const MAX_DISTANCE = 170;

/** Where a camera starts: distance, turn and angle. */
const START_DISTANCE = 60;
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- an eighth turn
const START_YAW = Math.PI / 4;
const START_PITCH = 0.95;

/** Flattest and steepest view angle, in radians above the horizon. */
const MIN_PITCH = 0.42;
const MAX_PITCH = 1.38;

/** Pan speed per second of keys and screen edges, as a share of the distance. */
const PAN_SPEED = 0.9;

/** Turn speed of the turning keys, radians per second. */
const KEY_TURN_SPEED = 1;

/** Wheel zoom factor per notch. */
const ZOOM_STEP = 1.12;

/** Pixels in a wheel notch (browsers report pixels). */
const WHEEL_NOTCH = 100;

/** How much faster the wheel zooms with Ctrl held. */
const FAST_ZOOM = 2.5;

/** Radians per pixel of a turning drag. */
const TURN_SPEED = 0.006;

/** How quickly the camera follows its goal, per second. */
const SMOOTHING = 12;

/** Height the camera keeps above the ground right below it, in tiles. */
const CLEARANCE = 1.5;

/** Field of view, near and far plane. */
const FOV = 45;
const NEAR = 0.5;
const FAR = 900;

/** A wish to move the camera this frame, each from -1 to 1. */
export type CameraMotion = {
  /** Sideways, positive to the right. */
  readonly right: number;
  /** Ahead, positive away from the viewer. */
  readonly forward: number;
  /** Turning, positive to the left. */
  readonly turn: number;
};

/** Where the camera is, for tests and the minimap. */
export type CameraState = {
  readonly x: number;
  readonly z: number;
  readonly distance: number;
  readonly yaw: number;
  readonly pitch: number;
};

/** A smoothed orbit camera. */
export class CameraController {
  /** The three.js camera. */
  readonly camera: THREE.PerspectiveCamera;

  /** Where the camera looks, in tiles (x, z). */
  readonly target = new THREE.Vector2();

  /** Distance from the target. */
  distance = START_DISTANCE;

  /** Turn around the vertical axis. */
  yaw = START_YAW;

  /** Angle above the horizon. */
  pitch = START_PITCH;

  /** Values the camera glides to. */
  private readonly goal = {
    x: 0,
    z: 0,
    distance: START_DISTANCE,
    yaw: START_YAW,
    pitch: START_PITCH,
  };

  /** Smoothed height of the ground under the target. */
  private floor = 0;

  /** The map's size, to keep the target on it. */
  private readonly size: number;

  /**
   * Creates the controller.
   *
   * @param aspect - width over height of the view
   * @param size - tiles per side of the map
   */
  constructor(aspect: number, size: number) {
    this.camera = new THREE.PerspectiveCamera(FOV, aspect, NEAR, FAR);
    this.size = size;
  }

  /**
   * Looks at a point at once.
   *
   * @param x - tiles
   * @param z - tiles
   * @param distance - how far, or keep the current
   */
  jump(x: number, z: number, distance?: number): void {
    this.goal.x = x;
    this.goal.z = z;
    this.target.set(x, z);
    if (distance !== undefined) {
      this.goal.distance = distance;
      this.distance = distance;
    }
  }

  /**
   * Glides to a point.
   *
   * @param x - tiles
   * @param z - tiles
   */
  focus(x: number, z: number): void {
    this.goal.x = THREE.MathUtils.clamp(x, 0, this.size);
    this.goal.z = THREE.MathUtils.clamp(z, 0, this.size);
  }

  /**
   * Moves the goal by screen pixels, as when dragging the map.
   *
   * @param dx - pixels right
   * @param dy - pixels down
   * @param height - view height in pixels
   */
  panPixels(dx: number, dy: number, height: number): void {
    const worldPerPixel =
      (this.distance *
        2 *
        Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) /
      Math.max(1, height);
    this.panBy(
      -dx * worldPerPixel,
      (dy * worldPerPixel) / Math.sin(this.pitch),
    );
  }

  /**
   * Zooms by wheel travel towards a point on the map.
   *
   * @param delta - wheel travel in pixels, positive is away
   * @param fast - whether to zoom faster (Ctrl held)
   * @param point - the map point under the pointer, or null for the middle
   */
  wheel(
    delta: number,
    fast: boolean,
    point: { readonly x: number; readonly z: number } | null,
  ): void {
    const notches = (delta / WHEEL_NOTCH) * (fast ? FAST_ZOOM : 1);
    this.zoomAt(Math.pow(ZOOM_STEP, notches), point);
  }

  /**
   * Zooms by a factor (above 1 is farther) around the middle of the view.
   *
   * @param factor - the factor
   */
  zoomBy(factor: number): void {
    this.zoomAt(factor, null);
  }

  /**
   * Zooms by a factor and slides the goal so that a map point stays where
   * it is on the screen.
   *
   * @param factor - above 1 is farther
   * @param point - the point to keep, or null for the middle
   */
  zoomAt(
    factor: number,
    point: { readonly x: number; readonly z: number } | null,
  ): void {
    const before = this.goal.distance;
    this.goal.distance = THREE.MathUtils.clamp(
      before * factor,
      MIN_DISTANCE,
      MAX_DISTANCE,
    );
    // Scaling the view about a point keeps that point in place.
    const scale = this.goal.distance / before;
    if (point !== null) {
      this.goal.x = THREE.MathUtils.clamp(
        point.x + (this.goal.x - point.x) * scale,
        0,
        this.size,
      );
      this.goal.z = THREE.MathUtils.clamp(
        point.z + (this.goal.z - point.z) * scale,
        0,
        this.size,
      );
    }
  }

  /**
   * Turns and tilts by pixels of a drag.
   *
   * @param dx - pixels right
   * @param dy - pixels down
   */
  turnPixels(dx: number, dy: number): void {
    this.goal.yaw -= dx * TURN_SPEED;
    this.goal.pitch = THREE.MathUtils.clamp(
      this.goal.pitch + dy * TURN_SPEED,
      MIN_PITCH,
      MAX_PITCH,
    );
  }

  /**
   * Turns by an angle.
   *
   * @param angle - radians
   */
  turnBy(angle: number): void {
    this.goal.yaw += angle;
  }

  /**
   * Advances the camera by a frame.
   *
   * @param dt - real seconds since the last frame
   * @param motion - what keys and screen edges ask for
   * @param heightAt - height of the ground (0 at sea) at a map point
   */
  update(
    dt: number,
    motion: CameraMotion,
    heightAt: (x: number, z: number) => number,
  ): void {
    const speed = this.distance * PAN_SPEED * dt;
    if (motion.right !== 0 || motion.forward !== 0) {
      this.panBy(motion.right * speed, motion.forward * speed);
    }
    this.goal.yaw += motion.turn * KEY_TURN_SPEED * dt;
    const blend = 1 - Math.exp(-SMOOTHING * dt);
    this.target.x += (this.goal.x - this.target.x) * blend;
    this.target.y += (this.goal.z - this.target.y) * blend;
    this.distance += (this.goal.distance - this.distance) * blend;
    this.yaw += (this.goal.yaw - this.yaw) * blend;
    this.pitch += (this.goal.pitch - this.pitch) * blend;
    this.floor +=
      (Math.max(0, heightAt(this.target.x, this.target.y)) - this.floor) *
      blend;
    const horizontal = Math.cos(this.pitch) * this.distance;
    const x = this.target.x + Math.sin(this.yaw) * horizontal;
    const z = this.target.y + Math.cos(this.yaw) * horizontal;
    // Never into a hill between the camera and what it looks at.
    const y = Math.max(
      this.floor + Math.sin(this.pitch) * this.distance,
      Math.max(0, heightAt(x, z)) + CLEARANCE,
    );
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target.x, this.floor, this.target.y);
  }

  /**
   * Where the camera is and where it is heading.
   *
   * @returns target, distance, turn and angle of the goal
   */
  state(): CameraState {
    return {
      x: this.goal.x,
      z: this.goal.z,
      distance: this.goal.distance,
      yaw: this.goal.yaw,
      pitch: this.goal.pitch,
    };
  }

  /** Moves the goal along the ground, relative to the view direction. */
  private panBy(right: number, forward: number): void {
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    this.goal.x = THREE.MathUtils.clamp(
      this.goal.x + right * cos - forward * sin,
      0,
      this.size,
    );
    this.goal.z = THREE.MathUtils.clamp(
      this.goal.z - right * sin - forward * cos,
      0,
      this.size,
    );
  }
}
