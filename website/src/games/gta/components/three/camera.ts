/**
 * The camera of the 3D city: behind the player and a little above him, turned
 * the way he goes - and the mouse put back on the city through it.
 *
 * @module
 * @remarks
 * **Third person.** The camera stands behind whoever the player is - on foot,
 * behind the wheel or at the stick of a helicopter - and turns with him, so
 * that straight ahead on the screen is always straight ahead for him. Behind
 * a wheel it swings round after the car; on foot the mouse turns it once it
 * has been caught by a click (see ../../hooks/use-gta-game), and without a
 * caught mouse - a phone, or a mouse not yet caught - it follows somebody who
 * walks forward and leaves somebody who steps sideways alone, or a step to
 * the side would turn into walking in circles.
 *
 * The zoom of the settings is how far behind it stands. Driving fast pulls it
 * back; climbing with the jetpack or a helicopter takes it up with you.
 */
import * as THREE from "three";
import { VIEW_HEIGHT, VIEW_WIDTH } from "@/games/gta/components/projection";
import {
  HELI_HEIGHT,
  HELI_LOOK,
  type GameState,
  type Vec,
} from "@/games/gta/engine/types";
import { AIM_HEIGHT, HEIGHT_SCALE } from "./kit";

/* eslint-disable @typescript-eslint/no-magic-numbers -- camera tuning: the
   lens, the tilt, how fast it follows and how far it pulls back */

/** The lens, degrees from the bottom of the picture to the top. */
const FOV = 55;

/**
 * How steeply the camera looks down at the player, from the horizon: on foot
 * a little more, so a wall beside him does not fill the picture, and behind a
 * wheel a little less, so one sees down the road.
 */
const PITCH_FOOT = THREE.MathUtils.degToRad(30);
const PITCH_RIDE = THREE.MathUtils.degToRad(21);

/** How far behind somebody on foot the camera stands at zoom one, pixels. */
const FOOT_BACK = 230;

/** How much further back it stands behind a vehicle. */
const RIDE_BACK = 1.75;

/** How far ahead of the player it looks, on foot and in a vehicle. */
const LOOK_FOOT = 40;
const LOOK_RIDE = 90;

/** How high over the player's middle it looks, as a share of the aim height. */
const LOOK_UP = 1.8;

/** How quickly the camera catches up with the player, per second. */
const FOLLOW = 14;

/** And how quickly it settles on a new distance. */
const SETTLE = 2.2;

/** How quickly it swings round behind a vehicle, per second. */
const SWING = 3.2;

/** How quickly it swings round behind somebody walking forward. */
const WALK_SWING = 1.6;

/** Walking within this angle of the view counts as walking forward. */
const FORWARD_CONE = THREE.MathUtils.degToRad(65);

/** How far he has to move in a frame to count as walking, pixels. */
const MOVED = 0.05;

/** How far it pulls back at full speed, as a share of its distance. */
const PULL_BACK = 0.3;

/** The speed it pulls back fully at, pixels a second. */
const FAST = 520;

/** How close the mouse has to pass the police helicopter to aim at it. */
const HELI_AIM = 38;

/** Where a ray over the horizon is put down instead, pixels ahead. */
const SKY_AIM = 900;

/** Nought turned to the north, which is where the camera starts looking. */
const NORTH = -Math.PI / 2;

/**
 * The shortest turn from one heading to another.
 *
 * @param from - the heading now
 * @param to - the heading wanted
 * @returns radians, between minus and plus half a turn
 */
function turnBetween(from: number, to: number): number {
  const full = Math.PI * 2;
  return ((((to - from + Math.PI) % full) + full) % full) - Math.PI;
}

/** The camera, and how to put a screen point back on the city through it. */
export class FollowCamera {
  /** The camera itself. */
  readonly camera = new THREE.PerspectiveCamera(
    FOV,
    VIEW_WIDTH / VIEW_HEIGHT,
    2,
    8000,
  );
  /** What it looks at. */
  readonly target = new THREE.Vector3();
  /** Where the player is, at chest height. */
  readonly focus = new THREE.Vector3();
  /** How far it stands from what it looks at. */
  distance = 0;
  /**
   * Which way it looks, as a heading in the city: nought east, a quarter
   * turn south - the same angles the engine gives cars and people.
   */
  yaw = NORTH;
  /** How steeply it looks down right now, easing between foot and wheel. */
  private pitch = PITCH_FOOT;
  /** Whether it has been put anywhere yet. */
  private placed = false;
  /** Where the player stood last frame, to tell walking from standing. */
  private readonly last = new THREE.Vector2();
  /** Scratch objects for the mouse. */
  private readonly ray = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly floor = new THREE.Plane(
    new THREE.Vector3(0, 1, 0),
    -AIM_HEIGHT,
  );
  private readonly hit = new THREE.Vector3();
  private readonly wanted = new THREE.Vector3();
  private readonly heli = new THREE.Vector3();

  /**
   * Turns the camera by hand - the caught mouse.
   *
   * @param by - radians, positive clockwise seen from above
   */
  turn(by: number): void {
    this.yaw = turnBetween(0, this.yaw + by);
  }

  /**
   * Moves the camera on by one frame.
   *
   * @param state - the city
   * @param zoom - the zoom of the settings
   * @param dt - seconds since the last frame
   * @param aspect - width over height of the picture
   * @param steered - true while the caught mouse turns the camera on foot
   */
  update(
    state: GameState,
    zoom: number,
    dt: number,
    aspect: number,
    steered: boolean,
  ): void {
    const player = state.player;
    const car =
      player.car === null
        ? undefined
        : state.cars.find((one) => one.id === player.car);
    const flown =
      player.chopper === null
        ? undefined
        : state.choppers.find((one) => one.id === player.chopper);
    const riding = flown !== undefined || car !== undefined;
    const x = flown?.x ?? car?.x ?? player.x;
    const z = flown?.y ?? car?.y ?? player.y;
    const high = (flown?.height ?? player.height) * HEIGHT_SCALE;
    const speed = Math.abs(flown?.speed ?? car?.speed ?? 0);
    const nose = flown?.angle ?? car?.angle ?? player.heading;
    if (!this.placed) {
      this.yaw = riding ? nose : player.angle;
    } else if (riding) {
      this.yaw += turnBetween(this.yaw, nose) * (1 - Math.exp(-dt * SWING));
    } else if (!steered) {
      // Only somebody walking forward pulls the camera round after him.
      const walked = Math.hypot(x - this.last.x, z - this.last.y) > MOVED;
      const off = turnBetween(this.yaw, nose);
      if (walked && Math.abs(off) < FORWARD_CONE) {
        this.yaw += off * (1 - Math.exp(-dt * WALK_SWING));
      }
    }
    this.yaw = turnBetween(0, this.yaw);
    this.last.set(x, z);
    const forwardX = Math.cos(this.yaw);
    const forwardZ = Math.sin(this.yaw);
    const ahead = riding ? LOOK_RIDE : LOOK_FOOT;
    this.focus.set(x, high + AIM_HEIGHT, z);
    this.wanted.set(
      x + forwardX * ahead,
      high + AIM_HEIGHT * LOOK_UP,
      z + forwardZ * ahead,
    );
    const pull =
      1 +
      Math.min(1, speed / FAST) * PULL_BACK +
      (flown === undefined ? 0 : 0.2);
    const far =
      (FOOT_BACK / zoom) * (riding ? RIDE_BACK : 1) * pull + high * 0.25;
    const steep = riding ? PITCH_RIDE : PITCH_FOOT;
    if (!this.placed) {
      this.target.copy(this.wanted);
      this.distance = far;
      this.pitch = steep;
      this.placed = true;
    } else {
      const settle = 1 - Math.exp(-dt * SETTLE);
      this.target.lerp(this.wanted, 1 - Math.exp(-dt * FOLLOW));
      this.distance += (far - this.distance) * settle;
      this.pitch += (steep - this.pitch) * settle;
    }
    const level = Math.cos(this.pitch) * this.distance;
    this.camera.aspect = aspect;
    this.camera.position.set(
      this.target.x - forwardX * level,
      this.target.y + Math.sin(this.pitch) * this.distance,
      this.target.z - forwardZ * level,
    );
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  /**
   * Where a point of the city lands in the picture - the other way round
   * from {@link aim}, for the scripts that check the aim.
   *
   * @param x - city x
   * @param y - city y
   * @param high - height above the road, 3D pixels
   * @returns across and down the picture, nought to one
   */
  screenOf(x: number, y: number, high: number): Vec {
    this.hit.set(x, high, y).project(this.camera);
    return { x: (this.hit.x + 1) / 2, y: (1 - this.hit.y) / 2 };
  }

  /**
   * The city point under a point of the picture.
   *
   * @param u - across the picture, nought at the left to one at the right
   * @param v - down the picture, nought at the top to one at the bottom
   * @param state - the city, for the player and the police helicopter
   * @returns where the engine should aim
   * @remarks
   * Put on the plane shots fly in, so the round goes through the crosshair.
   * A ray that never comes down - over the horizon, which a camera behind
   * the player can see - is laid flat and put down far ahead, so the shot
   * still goes the way the mouse points.
   *
   * **The one thing that is aimed at in the air** is the police helicopter:
   * the engine tests a hit on it at a spot on the road north of it, which is
   * where the 2D view draws it. A mouse laid on the machine in 3D is turned
   * into exactly that spot, so the same shot hits in both views.
   */
  aim(u: number, v: number, state: GameState): Vec {
    this.pointer.set(u * 2 - 1, -(v * 2 - 1));
    this.ray.setFromCamera(this.pointer, this.camera);
    const way = this.ray.ray.direction;
    const flat = Math.hypot(way.x, way.z);
    let aimed: Vec =
      flat === 0
        ? { x: state.player.x, y: state.player.y }
        : {
            x: state.player.x + (way.x / flat) * SKY_AIM,
            y: state.player.y + (way.z / flat) * SKY_AIM,
          };
    const heli = state.heli;
    const onFloor = this.ray.ray.intersectPlane(this.floor, this.hit) !== null;
    if (heli !== null && heli.fallAt === null) {
      this.heli.set(heli.x, HELI_HEIGHT * HEIGHT_SCALE + 8, heli.y);
      if (this.ray.ray.distanceToPoint(this.heli) < HELI_AIM) {
        aimed = { x: heli.x, y: heli.y - HELI_LOOK };
      } else if (onFloor) {
        aimed = { x: this.hit.x, y: this.hit.z };
      }
    } else if (onFloor) {
      aimed = { x: this.hit.x, y: this.hit.z };
    }
    return aimed;
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
