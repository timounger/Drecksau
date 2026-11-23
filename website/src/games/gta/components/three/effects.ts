/**
 * What happens in the 3D city rather than what stands in it: shots and
 * rockets, explosions, fires and smoke, the things lying on the road to be
 * picked up, the charges, the rings one drives into, and the tyre marks.
 *
 * @module
 * @remarks
 * Light is drawn as light - added onto whatever is behind it, never hiding
 * it - so a muzzle flash, a fireball and a ring on the road all glow in the
 * dark without a single extra lamp in the scene. The one exception is the
 * newest explosion, which also lights up the street round it for as long as
 * it burns.
 */
import * as THREE from "three";
import { doorsOf } from "@/games/gta/engine/city";
import {
  BLAST_SECONDS,
  FIRE_STAGE,
  FUMES_STAGE,
  MARK_LIFE,
  type GameState,
} from "@/games/gta/engine/types";
import { BLAST_RADIUS } from "@/games/gta/engine/weapons";
import { Batch } from "./batch";
import { AIM_HEIGHT, yawOf, type Bin } from "./kit";
import { createGlow, createSolid, type Uniforms3d } from "./materials";
import { ModelBuilder, chargeModel, crateModel } from "./models";
import type { Quality3d } from "./quality";

/** What happens, and how to bring it up to date. */
export type Effects3d = {
  /**
   * Shows what is going on near the target.
   *
   * @param state - the city
   * @param x - the camera's target, city x
   * @param z - the camera's target, city y
   */
  readonly update: (state: GameState, x: number, z: number) => void;
  /** Frees the crowds. */
  readonly dispose: () => void;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- the sizes, colours
   and timing of flames, smoke, shots and rings */

/** The colours of the rings: job, delivery, guns, bank, mint, home. */
const RING = {
  pick: new THREE.Color(0xfacc15),
  drop: new THREE.Color(0x22c55e),
  guns: new THREE.Color(0xf59e0b),
  bank: new THREE.Color(0x38bdf8),
  mint: new THREE.Color(0xeab308),
  home: new THREE.Color(0x60a5fa),
};

/** Where the counters are - the city is fixed, so this is worked out once. */
const DOORS = {
  guns: doorsOf("guns"),
  bank: doorsOf("bank"),
  mint: doorsOf("mint"),
};

/**
 * Builds the crowds of what happens.
 *
 * @param scene - where they go
 * @param uniforms - the shared values
 * @param quality - what this device can carry
 * @param bin - where everything made is kept for freeing
 * @returns the effects
 */
export function buildEffects(
  scene: THREE.Object3D,
  uniforms: Uniforms3d,
  quality: Quality3d,
  bin: Bin,
): Effects3d {
  const plain = createSolid(uniforms, "paint", false, bin);
  const light = createGlow(bin, 0.9);
  const soft = createGlow(bin, 0.55);
  soft.vertexColors = true;
  const smoke = bin.keep(
    new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  const marks = bin.keep(
    new THREE.MeshBasicMaterial({
      color: 0x0c0a09,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
  );
  const crowds: Batch[] = [];
  const crowd = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    room: number,
    shadows = false,
  ): Batch => {
    const made = new Batch(scene, geometry, material, room, shadows, bin);
    crowds.push(made);
    return made;
  };
  const streaks = crowd(new THREE.BoxGeometry(1, 1, 1), light, 64);
  const balls = crowd(new THREE.IcosahedronGeometry(1, 1), light, 64);
  const lumps = crowd(
    tagged(new THREE.IcosahedronGeometry(1, 0), 0x3f3f46),
    plain,
    16,
    true,
  );
  const puffs = crowd(new THREE.IcosahedronGeometry(1, 1), smoke, 96);
  const flames = crowd(
    new THREE.ConeGeometry(1, 2.4, 7).translate(0, 1.2, 0),
    light,
    96,
  );
  const crates = crowd(crateModel(), plain, 32, true);
  const charges = crowd(chargeModel(), plain, 12, true);
  const ringShape = new THREE.RingGeometry(19, 23, 40);
  ringShape.rotateX(-Math.PI / 2);
  const rings = crowd(ringShape, light, 24);
  const beamShape = new THREE.CylinderGeometry(
    20,
    20,
    60,
    24,
    1,
    true,
  ).translate(0, 30, 0);
  fadeUp(beamShape);
  const beams = crowd(beamShape, soft, 24);
  const markShape = new THREE.PlaneGeometry(1, 1);
  markShape.rotateX(-Math.PI / 2);
  const tread = crowd(markShape, marks, 256);
  tread.mesh.renderOrder = 1;
  const flash = new THREE.PointLight(0xff9a3c, 0, 420, 1.4);
  scene.add(flash);

  const still = new THREE.Quaternion();
  const turn = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const tint = new THREE.Color();
  const yellow = new THREE.Color(0xffd34d).multiplyScalar(1.6);
  const orange = new THREE.Color(0xff7a1a).multiplyScalar(1.5);
  const grey = new THREE.Color(0x9ca3af);
  const black = new THREE.Color(0x292524);
  const cash = new THREE.Color(0x22c55e);
  const armour = new THREE.Color(0x38bdf8);
  const gun = new THREE.Color(0xfacc15);
  const reach2 = quality.reach * quality.reach;

  return {
    update: (state, x, z) => {
      for (const one of crowds) {
        one.begin();
      }
      const near = (px: number, py: number): boolean =>
        (px - x) * (px - x) + (py - z) * (py - z) < reach2;
      const now = state.time;
      for (const shot of state.bullets) {
        if (near(shot.x, shot.y)) {
          turn.setFromAxisAngle(up, yawOf(shot.angle));
          if (shot.shape === "shot") {
            streaks.push(
              shot.x,
              AIM_HEIGHT,
              shot.y,
              turn,
              12,
              0.9,
              0.9,
              yellow,
            );
          } else if (shot.shape === "flame") {
            const grow = 4 + Math.min(10, (shot.reach - shot.left) * 0.05);
            balls.push(
              shot.x,
              AIM_HEIGHT,
              shot.y,
              still,
              grow,
              grow,
              grow,
              orange,
            );
          } else {
            lumps.push(
              shot.x,
              AIM_HEIGHT,
              shot.y,
              turn,
              shot.shape === "rocket" ? 5 : 2.4,
              2.4,
              2.4,
              null,
            );
            if (shot.shape === "rocket") {
              streaks.push(
                shot.x - Math.cos(shot.angle) * 9,
                AIM_HEIGHT,
                shot.y - Math.sin(shot.angle) * 9,
                turn,
                10,
                2,
                2,
                orange,
              );
            }
          }
        }
      }
      let newest = -1;
      let lit = 0;
      for (const blast of state.blasts) {
        const part = (now - blast.at) / BLAST_SECONDS;
        if (part >= 0 && part < 1 && near(blast.x, blast.y)) {
          const size = 14 + part * BLAST_RADIUS * 0.75;
          tint.copy(orange).multiplyScalar(1 - part);
          balls.push(
            blast.x,
            size * 0.4,
            blast.y,
            still,
            size,
            size * 0.8,
            size,
            tint,
          );
          tint.copy(yellow).multiplyScalar((1 - part) * 0.8);
          balls.push(
            blast.x,
            size * 0.35,
            blast.y,
            still,
            size * 0.55,
            size * 0.5,
            size * 0.55,
            tint,
          );
          for (let puff = 0; puff < 3; puff += 1) {
            const away = size * 0.5;
            puffs.push(
              blast.x + Math.cos(puff * 2.1 + blast.id) * away,
              size * 0.6 + part * 30,
              blast.y + Math.sin(puff * 2.1 + blast.id) * away,
              still,
              size * 0.35,
              size * 0.35,
              size * 0.35,
              black,
            );
          }
          if (blast.at > newest) {
            newest = blast.at;
            lit = 1 - part;
            flash.position.set(blast.x, 40, blast.y);
          }
        }
      }
      flash.intensity = lit * 9000;
      for (const fire of state.fires) {
        if (near(fire.x, fire.y)) {
          const fade = Math.min(1, Math.max(0, fire.until - now));
          for (let lick = 0; lick < 3; lick += 1) {
            const beat =
              0.65 +
              Math.abs(Math.sin(now * 7 + fire.id * 1.7 + lick * 2.1)) * 0.45;
            const size = (6 - lick * 1.4) * beat * fade;
            tint.copy(lick === 0 ? orange : yellow).multiplyScalar(0.9);
            flames.push(
              fire.x + Math.cos(lick * 2.2 + fire.id) * 5,
              0,
              fire.y + Math.sin(lick * 2.2 + fire.id) * 5,
              still,
              size,
              size * (1.4 + lick * 0.2),
              size,
              tint,
            );
          }
        }
      }
      for (const car of state.cars) {
        if (car.fireAt !== null && near(car.x, car.y)) {
          const age = now - car.fireAt;
          const burning = age >= FIRE_STAGE;
          const thick = burning || age >= FUMES_STAGE;
          const count = burning ? 5 : thick ? 4 : 2;
          for (let puff = 0; puff < count; puff += 1) {
            const rise = ((now * 18 + puff * 13) % 60) + 12;
            const grow = 4 + rise * 0.18;
            puffs.push(
              car.x + Math.sin(puff * 2.3 + now) * 4,
              rise,
              car.y + Math.cos(puff * 1.7) * 4,
              still,
              grow,
              grow,
              grow,
              thick ? black : grey,
            );
          }
          if (burning) {
            for (let lick = 0; lick < 3; lick += 1) {
              const beat = 0.7 + Math.abs(Math.sin(now * 9 + lick * 2)) * 0.4;
              flames.push(
                car.x + Math.sin(lick * 2.1) * 6,
                8,
                car.y + Math.cos(lick * 2.1) * 4,
                still,
                6 * beat,
                9 * beat,
                6 * beat,
                lick === 1 ? yellow : orange,
              );
            }
          }
        }
      }
      for (const drop of state.pickups) {
        if (drop.backAt === null && near(drop.x, drop.y)) {
          turn.setFromAxisAngle(up, now * 1.6 + drop.id);
          const colour =
            drop.holds === "cash"
              ? cash
              : drop.holds === "armour"
                ? armour
                : gun;
          crates.push(
            drop.x,
            10 + Math.sin(now * 3 + drop.id) * 1.5,
            drop.y,
            turn,
            1,
            1,
            1,
            colour,
          );
          rings.push(drop.x, 0.7, drop.y, still, 0.6, 1, 0.6, colour);
        }
      }
      for (const charge of state.charges) {
        if (near(charge.x, charge.y)) {
          charges.push(charge.x, 0, charge.y, still, 1, 1, 1, null);
        }
      }
      const ring = (
        at: { readonly x: number; readonly y: number },
        colour: THREE.Color,
      ): void => {
        if (near(at.x, at.y)) {
          const beat = 1 + Math.sin(now * 3) * 0.05;
          rings.push(at.x, 0.8, at.y, still, beat, 1, beat, colour);
          beams.push(at.x, 0, at.y, still, beat, 1, beat, colour);
        }
      };
      const job = state.job;
      if (job !== null) {
        ring(
          job.loaded ? job.to : job.from,
          job.loaded ? RING.drop : RING.pick,
        );
      }
      for (const door of DOORS.guns) {
        ring(door, RING.guns);
      }
      for (const door of DOORS.bank) {
        ring(door, RING.bank);
      }
      for (const door of DOORS.mint) {
        ring(door, RING.mint);
      }
      for (const garage of state.garages) {
        ring(garage, RING.home);
      }
      for (const mark of state.marks) {
        if (near(mark.x, mark.y)) {
          const age = Math.max(0, 1 - (now - mark.at) / MARK_LIFE);
          turn.setFromAxisAngle(up, yawOf(mark.angle));
          tread.push(
            mark.x,
            0.35,
            mark.y,
            turn,
            7,
            1,
            (mark.tread === "track" ? 8 : 4.5) * age,
            null,
          );
        }
      }
      for (const one of crowds) {
        one.end();
      }
    },
    dispose: () => {
      for (const one of crowds) {
        one.dispose();
      }
      scene.remove(flash);
      flash.dispose();
    },
  };
}

/**
 * Darkens a beam towards its top, so it fades out into the air when added
 * onto the picture.
 *
 * @param geometry - the open cylinder of the beam
 */
function fadeUp(geometry: THREE.BufferGeometry): void {
  const at = geometry.getAttribute("position");
  const colours = new Float32Array(at.count * 3);
  const high = 60;
  for (let corner = 0; corner < at.count; corner += 1) {
    const left = Math.max(0, 1 - at.getY(corner) / high) * 0.6;
    colours.set([left, left, left], corner * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
}

/**
 * A plain three shape with the attributes the solid material reads.
 *
 * @param geometry - the shape, used up by this
 * @param colour - its colour
 * @returns the tagged geometry
 */
function tagged(
  geometry: THREE.BufferGeometry,
  colour: number,
): THREE.BufferGeometry {
  return new ModelBuilder().add(geometry, { color: colour }).build();
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
