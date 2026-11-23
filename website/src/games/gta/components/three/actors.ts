/**
 * Everything in the 3D city that moves: the traffic and the police, the
 * people, the cats and dogs, the helicopters and the aeroplanes, the train
 * and the air defence on the base.
 *
 * @module
 * @remarks
 * Read straight off the state every frame and nothing kept in between: a
 * car is drawn where the engine has it, pointing where the engine points it.
 * Only what is within reach of the camera's target is drawn at all - see
 * {@link Quality3d.reach} - and each sort of thing is one instanced draw
 * call, see ./batch.
 */
import * as THREE from "three";
import { outfit, paintOf } from "@/games/gta/components/render";
import { roofAt } from "@/games/gta/engine/city";
import { trainCars } from "@/games/gta/engine/train";
import {
  HELI_FALL,
  HELI_HEIGHT,
  LEAN_MOST,
  STRIDE,
  type Car,
  type ChopperKind,
  type GameState,
} from "@/games/gta/engine/types";
import {
  VEHICLES,
  floats,
  type VehicleBody,
} from "@/games/gta/engine/vehicles";
import { WEAPONS } from "@/games/gta/engine/weapons";
import { Batch } from "./batch";
import { HEIGHT_SCALE, WATER_LEVEL, hex, yawOf, type Bin } from "./kit";
import { createGlow, createSolid, type Uniforms3d } from "./materials";
import {
  ModelBuilder,
  ROTOR_HIGH,
  ackModel,
  animalModel,
  figureModel,
  heliModel,
  planeModel,
  riddenBody,
  riderModel,
  rotorModel,
  turretModel,
  vehicleModel,
  wagonModel,
} from "./models";
import { poolTexture } from "./city";
import type { Quality3d } from "./quality";

/** What moves, and how to bring it up to date. */
export type Actors3d = {
  /**
   * Puts everything near the target where the engine has it.
   *
   * @param state - the city
   * @param x - the camera's target, city x
   * @param z - the camera's target, city y
   * @param night - nought by day to one at night
   */
  readonly update: (
    state: GameState,
    x: number,
    z: number,
    night: number,
  ) => void;
  /** Frees the crowds. */
  readonly dispose: () => void;
};

/** What a person wears, as the four colours the figure material reads. */
type Dress = {
  readonly shirt: THREE.Color;
  readonly legs: THREE.Color;
  readonly skin: THREE.Color;
  readonly hair: THREE.Color;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- placing models: how
   high a rider sits, how far a beam reaches, how fast a stride swings */

/** Every sort of body there is, so each gets its crowd from the start. */
const BODIES = Object.keys(VEHICLES) as VehicleBody[];

/** What colour each helicopter is. */
const FLYER_PAINT: Readonly<Record<ChopperKind | "police", number>> = {
  army: 0x4b5320,
  rescue: 0xfacc15,
  plane: 0xe8eaed,
  police: 0xb6bcc2,
};

/** What the tank is painted: the 2D picture draws its own olive on it. */
const ARMY = new THREE.Color(0x4b5320);

/** What a burnt-out wreck is painted. */
const SOOT = new THREE.Color(0x262626);

/** The colours of a policeman. */
const COP_DRESS = {
  shirt: "#1d4ed8",
  trousers: "#0f172a",
  skin: "#e8b98d",
  hair: "#1e293b",
};

/**
 * Builds the crowds of everything that moves.
 *
 * @param scene - where they go
 * @param state - the city at the start, for how much room to make
 * @param uniforms - the shared values
 * @param quality - what this device can carry
 * @param bin - where everything made is kept for freeing
 * @returns the actors
 */
export function buildActors(
  scene: THREE.Object3D,
  state: GameState,
  uniforms: Uniforms3d,
  quality: Quality3d,
  bin: Bin,
): Actors3d {
  const paint = createSolid(uniforms, "paint", false, bin);
  const dressed = createSolid(uniforms, "figure", false, bin);
  const glow = createGlow(bin, 0);
  glow.map = poolTexture(bin);
  glow.color.setHex(0xfff2c8);
  const beamShape = new THREE.PlaneGeometry(1, 1);
  beamShape.rotateX(-Math.PI / 2);
  const crowds: Batch[] = [];
  const crowd = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    room: number,
    shadows = true,
    extras: Readonly<Record<string, number>> = {},
  ): Batch => {
    const made = new Batch(
      scene,
      geometry,
      material,
      room,
      shadows,
      bin,
      extras,
    );
    crowds.push(made);
    return made;
  };
  const cars = new Map<VehicleBody, Batch>();
  for (const body of BODIES) {
    const many = state.cars.filter((car) => car.body === body).length;
    cars.set(body, crowd(vehicleModel(body), paint, Math.min(many, 60) + 8));
  }
  const turrets = crowd(turretModel(), paint, 4);
  const riders = crowd(riderModel(), paint, 16);
  const beams = crowd(beamShape, glow, 64, false);
  const people = crowd(figureModel(), dressed, 220, true, {
    aShirt: 3,
    aLegs: 3,
    aSkin: 3,
    aHair: 3,
    aMotion: 4,
  });
  const packs = new THREE.BoxGeometry(4, 6, 4.4);
  packs.translate(-2.8, 7.5, 0);
  const jet = crowd(withTags(packs, 0x52525b), paint, 2);
  const cats = crowd(animalModel(false), paint, 16);
  const dogs = crowd(animalModel(true), paint, 16);
  const flyers = {
    army: crowd(heliModel("army"), paint, 2),
    rescue: crowd(heliModel("rescue"), paint, 6),
    police: crowd(heliModel("police"), paint, 2),
    plane: crowd(planeModel(), paint, 4),
  };
  const rotors = crowd(rotorModel(), paint, 10, false);
  const engines = crowd(wagonModel(true), paint, 2);
  const wagons = crowd(wagonModel(false), paint, 8);
  const acks = crowd(ackModel(), paint, Math.max(4, state.acks.length));

  const colours = new Map<string, THREE.Color>();
  const colourOf = (css: string): THREE.Color => {
    let made = colours.get(css);
    if (made === undefined) {
      made = new THREE.Color(hex(css));
      colours.set(css, made);
    }
    return made;
  };
  const flyerColours = {
    army: new THREE.Color(FLYER_PAINT.army),
    rescue: new THREE.Color(FLYER_PAINT.rescue),
    plane: new THREE.Color(FLYER_PAINT.plane),
    police: new THREE.Color(FLYER_PAINT.police),
  };
  const white = new THREE.Color(1, 1, 1);
  const olive = new THREE.Color(0x556b2f);
  const wreck = new THREE.Color(0x3f3f46);
  const turn = new THREE.Quaternion();
  const twist = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3(0, 0, 1);
  const pointing = (angle: number, roll = 0, pitch = 0): THREE.Quaternion => {
    euler.set(roll, yawOf(angle), pitch, "YXZ");
    return turn.setFromEuler(euler);
  };
  const lying = (angle: number): THREE.Quaternion => {
    turn.setFromAxisAngle(up, yawOf(angle));
    twist.setFromAxisAngle(side, -Math.PI / 2);
    return turn.multiply(twist);
  };
  const dress = (who: {
    shirt: string;
    trousers: string;
    skin: string;
    hair: string;
  }): Dress => ({
    shirt: colourOf(who.shirt),
    legs: colourOf(who.trousers),
    skin: colourOf(who.skin),
    hair: colourOf(who.hair),
  });
  const figure = (
    x: number,
    y: number,
    z: number,
    angle: number,
    look: Dress,
    walked: number,
    pace: number,
    hold: boolean,
    down: boolean,
    sitting: boolean,
  ): void => {
    const rotation = down ? lying(angle) : pointing(angle);
    const slot = people.push(
      x,
      down ? y + 1.6 : y,
      z,
      rotation,
      1,
      sitting ? 0.62 : 1,
      1,
      null,
    );
    people.extra("aShirt", slot, look.shirt.r, look.shirt.g, look.shirt.b);
    people.extra("aLegs", slot, look.legs.r, look.legs.g, look.legs.b);
    people.extra("aSkin", slot, look.skin.r, look.skin.g, look.skin.b);
    people.extra("aHair", slot, look.hair.r, look.hair.g, look.hair.b);
    const swing = down || sitting ? 0 : Math.min(0.85, 0.5 * pace);
    people.extra(
      "aMotion",
      slot,
      (walked / STRIDE) * Math.PI,
      swing,
      hold ? 1 : 0,
      0,
    );
  };

  const reach2 = quality.reach * quality.reach;
  // Who wears what never changes, so it is worked out once per person.
  const looks = new Map<number, Dress>();
  const cop = dress(COP_DRESS);
  const own = {
    plain: dress({
      shirt: "#4ade80",
      trousers: "#1e293b",
      skin: "#f2c9a0",
      hair: "#1c1917",
    }),
    striped: dress({
      shirt: "#f8fafc",
      trousers: "#eceae7",
      skin: "#f2c9a0",
      hair: "#1c1917",
    }),
    masked: dress({
      shirt: "#dc2626",
      trousers: "#b91c1c",
      skin: "#f2c9a0",
      hair: "#1c1917",
    }),
  };

  return {
    update: (state, x, z, night) => {
      for (const one of crowds) {
        one.begin();
      }
      const near = (at: { readonly x: number; readonly y: number }): boolean =>
        (at.x - x) * (at.x - x) + (at.y - z) * (at.y - z) < reach2;
      const mine = state.player.car;
      for (const car of state.cars) {
        if (car.id === mine || near(car)) {
          placeCar(car);
        }
      }
      for (const person of state.people) {
        if (near(person)) {
          const down = person.mood === "down" || person.mood === "floored";
          let look = looks.get(person.id);
          if (look === undefined) {
            look = dress(outfit(person));
            looks.set(person.id, look);
          }
          figure(
            person.x,
            0,
            person.y,
            person.heading,
            look,
            person.walked,
            person.pace,
            person.holds !== null,
            down,
            person.mood === "sitting",
          );
        }
      }
      for (const officer of state.cops) {
        if (near(officer)) {
          const down =
            officer.health <= 0 ||
            (officer.floorUntil !== null && state.time < officer.floorUntil);
          figure(
            officer.x,
            0,
            officer.y,
            officer.angle,
            cop,
            officer.walked,
            officer.pace,
            true,
            down,
            false,
          );
        }
      }
      placePlayer(state);
      for (const beast of state.animals) {
        if (near(beast)) {
          const coat =
            beast.kind === "cat" ? catCoat(beast.id) : dogCoat(beast.id);
          (beast.kind === "cat" ? cats : dogs).push(
            beast.x,
            0,
            beast.y,
            pointing(beast.heading),
            1,
            1,
            1,
            coat,
          );
        }
      }
      for (const machine of state.choppers) {
        if (near(machine) || state.player.chopper === machine.id) {
          const high = machine.height * HEIGHT_SCALE;
          flyers[machine.kind].push(
            machine.x,
            high,
            machine.y,
            pointing(machine.angle, machine.lean),
            1,
            1,
            1,
            flyerColours[machine.kind],
          );
          if (machine.kind !== "plane") {
            placeRotor(
              machine.x,
              high,
              machine.y,
              machine.angle,
              machine.lean,
              machine.spin,
            );
          }
        }
      }
      const heli = state.heli;
      if (heli !== null) {
        const gone =
          heli.fallAt === null ? 0 : (state.time - heli.fallAt) / HELI_FALL;
        const lift = Math.max(0, 1 - gone);
        const high = HELI_HEIGHT * lift * HEIGHT_SCALE;
        const angle = heli.angle + gone * 2.6;
        flyers.police.push(
          heli.x,
          high,
          heli.y,
          pointing(angle),
          1,
          1,
          1,
          flyerColours.police,
        );
        placeRotor(heli.x, high, heli.y, angle, 0, heli.spin);
        if (night > 0.15 && heli.fallAt === null) {
          beams.push(heli.x, 0.9, heli.y, pointing(0), 90, 1, 90, white);
        }
      }
      trainCars(state.train).forEach((wagon, order) => {
        if (near(wagon.at)) {
          (order === 0 ? engines : wagons).push(
            wagon.at.x,
            0,
            wagon.at.y,
            pointing(wagon.angle),
            1,
            1,
            1,
            white,
          );
        }
      });
      for (const site of state.acks) {
        if (near(site)) {
          acks.push(
            site.x,
            0,
            site.y,
            pointing(0),
            1,
            1,
            1,
            site.backAt === null ? olive : wreck,
          );
        }
      }
      beams.mesh.visible = night > 0.15;
      glow.opacity = Math.min(1, night * 1.2) * 0.8;
      for (const one of crowds) {
        one.end();
      }
    },
    dispose: () => {
      for (const one of crowds) {
        one.dispose();
      }
      beamShape.dispose();
    },
  };

  /** One vehicle, its rider or its turret, and its beams at night. */
  function placeCar(car: Car): void {
    const shape = VEHICLES[car.body];
    const roll = riddenBody(car.body) ? (car.lean / LEAN_MOST) * 0.45 : 0;
    const water = floats(car.body);
    const y = water
      ? WATER_LEVEL + 1.5 + Math.sin(car.x * 0.05 + car.id) * 0.4
      : 0;
    const colour =
      car.health <= 0
        ? SOOT
        : car.body === "tank"
          ? ARMY
          : colourOf(paintOf(car));
    cars
      .get(car.body)
      ?.push(car.x, y, car.y, pointing(car.angle, roll), 1, 1, 1, colour);
    if (car.body === "tank") {
      turrets.push(car.x, y, car.y, pointing(car.turret), 1, 1, 1, colour);
    }
    if (riddenBody(car.body) && car.driven) {
      const seat = car.body === "cycle" ? 8 : 7.6;
      riders.push(
        car.x,
        y + seat,
        car.y,
        pointing(car.angle, roll),
        1,
        1,
        1,
        white,
      );
    }
    if (car.driven && car.health > 0 && !water) {
      const ahead = shape.length / 2 + 30;
      beams.push(
        car.x + Math.cos(car.angle) * ahead,
        0.8,
        car.y + Math.sin(car.angle) * ahead,
        pointing(car.angle),
        74,
        1,
        Math.max(24, shape.width * 1.6),
        white,
      );
    }
  }

  /** The rotor of a helicopter, over its mast. */
  function placeRotor(
    x: number,
    y: number,
    z: number,
    angle: number,
    lean: number,
    spin: number,
  ): void {
    rotors.push(
      x,
      y + ROTOR_HIGH,
      z,
      pointing(angle + spin, lean),
      1,
      1,
      1,
      white,
    );
  }

  /** The player on foot, with his pack on if he is flying with it. */
  function placePlayer(state: GameState): void {
    const player = state.player;
    if (player.car === null && !player.flying) {
      const swim = player.swimming && player.height <= 0;
      if (!(swim && player.diving)) {
        const y = swim ? WATER_LEVEL - 8 : player.height * HEIGHT_SCALE;
        const down = state.time < player.floorUntil;
        const hold = WEAPONS[player.weapon].way !== "swing";
        figure(
          player.x,
          y,
          player.y,
          player.angle,
          player.striped ? own.striped : player.masked ? own.masked : own.plain,
          player.walked,
          player.pace,
          hold && !swim,
          down,
          false,
        );
        if (
          player.jetpack &&
          player.height > roofAt(state.cells, player.x, player.y)
        ) {
          jet.push(
            player.x,
            y,
            player.y,
            pointing(player.angle),
            1,
            1,
            1,
            white,
          );
        }
      }
    }
  }
}

/** A cat's coat, the same for the same cat. */
function catCoat(id: number): THREE.Color {
  return CAT_COATS[id % CAT_COATS.length] ?? CAT_COATS[0] ?? new THREE.Color();
}

/** A dog's coat. */
function dogCoat(id: number): THREE.Color {
  return DOG_COATS[id % DOG_COATS.length] ?? DOG_COATS[0] ?? new THREE.Color();
}

/** The coats cats come in. */
const CAT_COATS = [0xf97316, 0x44403c, 0xe7e5e4, 0x78716c, 0x1c1917].map(
  (coat) => new THREE.Color(coat),
);

/** And dogs. */
const DOG_COATS = [0x92400e, 0xd6d3d1, 0x1c1917, 0xb45309].map(
  (coat) => new THREE.Color(coat),
);

/**
 * Gives a plain three geometry the attributes the materials read.
 *
 * @param geometry - the shape, used up by this
 * @param colour - its colour
 * @returns a geometry made by the model builder
 */
function withTags(
  geometry: THREE.BufferGeometry,
  colour: number,
): THREE.BufferGeometry {
  return new ModelBuilder().add(geometry, { color: colour }).build();
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
