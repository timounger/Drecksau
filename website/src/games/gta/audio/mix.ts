/**
 * What the city sounds like this instant: the mixing desk.
 *
 * @module
 * @remarks
 * **The whole of the ear is here, and none of the audio.** ./sounds owns the
 * elements and knows nothing about Los Santos; this module owns the question
 * "what would one hear from where the player is standing?" and answers it in
 * numbers. One side can be read without knowing what an `Audio` element does,
 * the other without knowing what a patrol boat is.
 *
 * **Two kinds of answer, because there are two kinds of noise.** A **loop** is
 * a state and is worked out fresh from the state every frame: an engine, a
 * rotor, a siren, a jet of fire. A **one-shot** is an event, and an event is
 * not in the state - what is in the state is its *result*, a round in the air
 * or a blast on the ground. So the ear remembers what was there last frame and
 * what is new is what happened: no engine ever has to tell anybody anything.
 *
 * **Distance is most of it.** A shot across the street is a different thing
 * from a shot at one's shoulder, and a siren getting louder is the game saying
 * "they have found you" without a word on the screen. Everything that happens
 * somewhere is scaled by how far away that somewhere is - see {@link heardAt}.
 */
import type { Bullet, GameState } from "@/games/gta/engine/types";
import { CHOP_SPEED } from "@/games/gta/engine/types";
import { WEAPONS } from "@/games/gta/engine/weapons";
import { VEHICLES, floats } from "@/games/gta/engine/vehicles";
import {
  LOOP_KINDS,
  OFF,
  type LoopKind,
  type Mix,
  type OneShot,
  type Sung,
} from "./sounds";

/** One noise that is to be played once, and how loud. */
export type Bang = {
  readonly sound: OneShot;
  /** Nought to one, from how far off it happened. */
  readonly gain: number;
};

/** What one hears this frame: what just happened, and what is going on. */
export type Heard = {
  readonly bangs: readonly Bang[];
  readonly mix: Mix;
};

/** Nothing at all: every loop off, nothing to play. */
export const SILENCE: Heard = {
  bangs: [],
  mix: Object.fromEntries(LOOP_KINDS.map((kind) => [kind, OFF])) as Mix,
};

/** The ear: it listens to the city, and it remembers the last frame. */
export type Ears = {
  /**
   * Listens once.
   *
   * @param state - the city as it is now
   * @returns what to play and how the loops should stand
   */
  hear(state: GameState): Heard;
  /** Forgets the last frame, for when a different city is put in front of it. */
  forget(): void;
};

/**
 * Builds an ear.
 *
 * @returns something to hand the state to, once a frame
 * @remarks
 * **It has to remember, and it remembers as little as it can**: which rounds
 * and which blasts were there last time, when each noise was last played, and
 * where the player's reload clock stood. Everything else is read out of the
 * state afresh.
 *
 * The ids of rounds are **not** counted upwards for ever - the engine hands
 * out one past the highest that is still in the air, so they start again from
 * one whenever the street is empty. A "highest seen" number would therefore
 * miss the first shot after every lull; a set of what was there does not.
 */
export function createEars(): Ears {
  let bullets = new Set<number>();
  let blasts = new Set<number>();
  let reloadAt = 0;
  let clock = 0;
  /** When each noise was last played, so a burst is not sixty noises. */
  const last = new Map<OneShot, number>();
  /** How long the flamethrower has been roaring for, in seconds. */
  let flameUntil = 0;
  /** And how long the machine gun goes on rattling for. */
  let gunUntil = 0;
  const forget = (): void => {
    bullets = new Set();
    blasts = new Set();
    reloadAt = 0;
    clock = 0;
    flameUntil = 0;
    gunUntil = 0;
    last.clear();
  };
  /** True if this noise may be played now, and books it if so. */
  const room = (sound: OneShot, now: number): boolean => {
    const before = last.get(sound);
    if (before !== undefined && now - before < GAPS[sound]) {
      return false;
    }
    last.set(sound, now);
    return true;
  };
  return {
    forget,
    hear(state: GameState): Heard {
      // **Only out in the street.** The jail, the bank and the printing works
      // are their own little worlds; the city stands still while one is in
      // them, and its traffic has no business in a cell.
      if (state.phase !== "playing") {
        forget();
        return SILENCE;
      }
      // A city that is younger than the last one is a different city - a new
      // game, or one that was loaded. Everything in the air belongs to the
      // other one.
      if (state.time < clock) {
        forget();
      }
      clock = state.time;
      const bangs: Bang[] = [];
      const seen = new Set<number>();
      let flaming = false;
      let rattling = false;
      for (const shot of state.bullets) {
        seen.add(shot.id);
        if (bullets.has(shot.id)) {
          continue;
        }
        if (shot.shape === "flame") {
          // Fire is not a shot but a jet: it keeps the loop alive rather than
          // playing anything, and one round means it is still roaring.
          flaming = flaming || shot.from === "player";
          continue;
        }
        if (shot.shape === "shot" && rapid(shot, state)) {
          // The machine gun is a burst, not a row of shots: it keeps its loop
          // alive the way fire does, and stops when the trigger is let go.
          rattling = true;
          continue;
        }
        const sound = shotOf(shot);
        if (sound !== null && room(sound, state.time)) {
          bangs.push({ sound, gain: heardAt(gapTo(state, shot), SHOT_FAR) });
        }
      }
      bullets = seen;
      const banged = new Set<number>();
      for (const blast of state.blasts) {
        banged.add(blast.id);
        if (blasts.has(blast.id) || !room("explosion", state.time)) {
          continue;
        }
        bangs.push({
          sound: "explosion",
          gain: heardAt(gapTo(state, blast), BLAST_FAR),
        });
      }
      blasts = banged;
      // **A swing leaves nothing in the air**, so there is nothing to spot the
      // way a round is spotted. What it does leave is a reload clock that has
      // moved: a fist that has just been swung cannot be swung again until
      // then. That, and a weapon one swings rather than fires, is a punch.
      if (
        state.player.reloadAt > reloadAt &&
        WEAPONS[state.player.weapon].way === "swing" &&
        room("hit", state.time)
      ) {
        bangs.push({ sound: "hit", gain: 1 });
      }
      reloadAt = state.player.reloadAt;
      if (flaming) {
        flameUntil = state.time + FLAME_TAIL;
      }
      if (rattling) {
        gunUntil = state.time + GUN_TAIL;
      }
      return {
        bangs: bangs.slice(0, BANGS_AT_ONCE),
        mix: mixOf(state, {
          flame: flameUntil > state.time,
          gun: gunUntil > state.time,
        }),
      };
    },
  };
}

/**
 * Which noise a round makes, for the ones that make one by themselves.
 *
 * @param shot - the round that has just appeared
 * @returns the noise, or null for something that makes none
 * @remarks
 * **The round does not know which gun it came out of.** A pistol and a machine
 * gun both put a `shot` in the air, and a rocket out of a launcher is the same
 * rocket as one out of a tank - which is right for the engine and no help at
 * all here. The machine gun is sorted out before this by {@link rapid},
 * because a burst is a loop rather than a row of noises; what is left over is
 * a pistol, which is what everybody else in this city carries. A thrown
 * grenade is silent until it goes off, which the blast takes care of.
 */
function shotOf(shot: Bullet): OneShot | null {
  if (shot.shape === "rocket") {
    return "rocket";
  }
  if (shot.shape === "grenade") {
    return null;
  }
  return "pistol";
}

/**
 * Whether a round came out of something that rattles.
 *
 * @param shot - the round that has just appeared
 * @param state - the city, for what the player is holding
 * @returns true for the player's machine gun, and for the tank's
 * @remarks
 * **Only the player's.** The gun one is holding is at one's ear and is a
 * sound one steers; the shots that come the other way are single reports from
 * somewhere over there, and a loop cannot be made quieter with distance
 * without turning the whole street into one rattle.
 */
function rapid(shot: Bullet, state: GameState): boolean {
  return (
    shot.from === "player" && (inTank(state) || state.player.weapon === "mg")
  );
}

/**
 * How the loops should stand.
 *
 * @param state - the city as it is now
 * @param firing - which of the weapons is going off this instant
 * @returns one level and rate per loop
 * @remarks
 * **What one sits in is loud, what comes closer gets louder.** The two are the
 * same question asked twice, and where both have an answer the louder one
 * wins: a police helicopter over one's head while one is flying oneself is
 * still one rotor as far as this game is concerned.
 */
function mixOf(
  state: GameState,
  firing: { readonly flame: boolean; readonly gun: boolean },
): Mix {
  const car = seatOf(state);
  const share =
    car === null
      ? 0
      : Math.min(1, Math.abs(car.speed) / Math.max(1, VEHICLES[car.body].top));
  const tank = car !== null && car.body === "tank";
  const afloat = car !== null && floats(car.body);
  // A bicycle has no engine, and a game that gives it one is a game nobody
  // believes.
  const driving = car !== null && !tank && !afloat && car.body !== "cycle";
  const chopper =
    state.player.flying && state.player.chopper !== null
      ? (state.choppers.find((one) => one.id === state.player.chopper) ?? null)
      : null;
  const flying = chopper === null ? 0 : Math.min(1, chopper.speed / CHOP_SPEED);
  const rotor = chopper !== null && chopper.kind !== "plane";
  const plane = chopper !== null && chopper.kind === "plane";
  // What is driving past out there, which one hears whether or not one is
  // driving oneself - see {@link passing}.
  const past = passing(state);
  return {
    siren: level(heardAt(nearestCall(state), SIREN_FAR, SIREN_NEAR)),
    // **The engine one is sitting in wins** - see {@link passing} for why.
    engine: driving ? engineAt(share) : (past.get("engine") ?? OFF),
    tankEngine: tank ? engineAt(share) : (past.get("tankEngine") ?? OFF),
    machineGun: firing.gun ? { level: 1, rate: 1 } : OFF,
    flame: firing.flame ? { level: 1, rate: 1 } : OFF,
    helicopter: level(
      Math.max(rotor ? 1 : 0, heardAt(nearestHeli(state), HELI_FAR, HELI_NEAR)),
      rotor ? ROTOR_REST + ROTOR_RANGE * flying : 1,
    ),
    airplane: plane ? level(JET_REST + JET_RANGE * flying) : OFF,
    // **In the water, and only while moving.** Floating makes no noise; what
    // one hears are the strokes. Diving counts: from under the surface one
    // hears oneself all the more.
    swimming:
      state.player.swimming && state.player.pace > 0
        ? {
            level: 1,
            rate:
              STROKE_REST +
              STROKE_RANGE * Math.min(1, state.player.pace / SWIM_TOP),
          }
        : OFF,
    boat: afloat
      ? {
          level: WAKE_REST + WAKE_RANGE * share,
          rate: 1 + WAKE_BEND * share,
        }
      : loudest(
          level(heardAt(nearestBoat(state), BOAT_FAR, BOAT_NEAR)),
          past.get("boat"),
        ),
  };
}

/**
 * What the traffic sounds like from where one is standing.
 *
 * @param state - the city as it is now
 * @returns the loudest passing vehicle per sort of engine, or nothing
 * @remarks
 * **A street with cars on it is not silent.** Standing on the pavement while
 * a car goes by is the commonest thing that happens in this game, and it used
 * to make no sound at all: the engine only ran for whatever one was sitting
 * in. Now every vehicle that is actually **moving** is a sound at a distance,
 * and the nearest one wins - one engine per sort, because two recordings of
 * the same engine playing over each other is one engine played badly, and
 * because there are two hundred cars in this city.
 *
 * **Moving**, which is the whole of the test besides distance: a parked car
 * is a parked car, and a city where every kerb hums is a city with a fault.
 * The bicycle is out for the same reason it is out when one rides it.
 *
 * **And it gives way to the one under oneself.** There is one element per
 * sort of engine, so a passing car and the car one is driving cannot both
 * have it: whoever wins decides the **pitch** as well as the volume, and an
 * engine whose note jumps every time somebody overtakes is a broken engine.
 * Sitting in one, one hears that one - which is also what it is like.
 */
function passing(state: GameState): Map<LoopKind, Sung> {
  const best = new Map<LoopKind, Sung>();
  for (const car of state.cars) {
    const speed = Math.abs(car.speed);
    if (
      car.id === state.player.car ||
      car.body === "cycle" ||
      car.health <= 0 ||
      speed < ROLLING
    ) {
      continue;
    }
    const gain = heardAt(
      gapTo(state, car),
      ENGINE_FAR,
      ENGINE_NEAR,
      ENGINE_FALL,
    );
    if (gain <= 0) {
      continue;
    }
    const kind: LoopKind = floats(car.body)
      ? "boat"
      : car.body === "tank"
        ? "tankEngine"
        : "engine";
    const share = Math.min(1, speed / Math.max(1, VEHICLES[car.body].top));
    const sung: Sung = {
      level: gain * (PAST_REST + PAST_RANGE * share),
      rate: ENGINE_PITCH_REST + ENGINE_PITCH_RANGE * share,
    };
    const before = best.get(kind);
    if (before === undefined || sung.level > before.level) {
      best.set(kind, sung);
    }
  }
  return best;
}

/** Whichever of the two is the louder, and OFF if neither is anything. */
function loudest(mine: Sung, theirs: Sung | undefined): Sung {
  if (theirs === undefined || theirs.level <= 0) {
    return mine;
  }
  return theirs.level > mine.level ? theirs : mine;
}

/** A loop at a level, off where that is nothing. */
function level(loud: number, rate = 1): Sung {
  return loud <= 0 ? OFF : { level: Math.min(1, loud), rate };
}

/** An engine, which is louder and higher the harder it is working. */
function engineAt(share: number): Sung {
  return {
    level: ENGINE_REST + ENGINE_RANGE * share,
    rate: ENGINE_PITCH_REST + ENGINE_PITCH_RANGE * share,
  };
}

/**
 * How loud something is at a given distance.
 *
 * @param gap - how far away it is, in city pixels
 * @param far - the distance at which it cannot be heard at all
 * @param near - inside this it is as loud as it gets
 * @param fall - how steeply it drops off; two is squared
 * @returns nought to one
 * @remarks
 * **Squared, not straight.** Sound falls off faster than a line, and a linear
 * fade reads as somebody turning a volume knob rather than as something coming
 * closer - which is the one thing these noises are for.
 *
 * **But not for everything squared.** A siren is a single thing one is
 * supposed to locate, and steep is right for it. Traffic is not a thing but a
 * place: what one wants is the street sounding like a street for as far as one
 * can see it, and squared meant a car three hundred pixels off - well inside
 * the picture - sat at fifteen per cent and might as well not have been there.
 * So engines fall off more gently; see {@link ENGINE_FALL}.
 */
export function heardAt(gap: number, far: number, near = 0, fall = 2): number {
  if (gap <= near) {
    return 1;
  }
  if (gap >= far) {
    return 0;
  }
  return Math.pow((far - gap) / (far - near), fall);
}

/**
 * How far off the nearest patrol car that has been sent out is.
 *
 * @param state - the city as it stands
 * @returns the distance, or a number past earshot when there is none
 * @remarks
 * **On a call**, which is not the same as "a police car": most patrol cars in
 * this city are rolling in ordinary traffic with their lights off, and they
 * are not chasing anybody. The ones the station sends out when the player has
 * stars are the ones with `kind: "police"` - the same test the lightbar uses
 * in ../components/render - and one the player has taken for himself is not on
 * a call at all.
 */
function nearestCall(state: GameState): number {
  let best = Number.POSITIVE_INFINITY;
  for (const car of state.cars) {
    if (car.kind === "police" && !car.driven && car.health > 0) {
      best = Math.min(best, gapTo(state, car));
    }
  }
  return best;
}

/** And the nearest police boat, which is a patrol car that floats. */
function nearestBoat(state: GameState): number {
  let best = Number.POSITIVE_INFINITY;
  for (const car of state.cars) {
    if (car.body === "patrolboat" && !car.driven && car.health > 0) {
      best = Math.min(best, gapTo(state, car));
    }
  }
  return best;
}

/** And the police helicopter, of which there is at most one. */
function nearestHeli(state: GameState): number {
  const heli = state.heli;
  return heli === null || heli.fallAt !== null
    ? Number.POSITIVE_INFINITY
    : gapTo(state, heli);
}

/** How far a thing is from the player, in city pixels. */
function gapTo(
  state: GameState,
  what: { readonly x: number; readonly y: number },
): number {
  return Math.hypot(what.x - state.player.x, what.y - state.player.y);
}

/** The car one is sitting in, or null on foot. */
function seatOf(state: GameState): GameState["cars"][number] | null {
  return state.player.car === null
    ? null
    : (state.cars.find((car) => car.id === state.player.car) ?? null);
}

/** Whether the thing one is sitting in is the tank. */
function inTank(state: GameState): boolean {
  return seatOf(state)?.body === "tank";
}

/** How many noises may start in one frame, however much is going on. */
const BANGS_AT_ONCE = 3;

/** How long one noise waits for the next of its kind, in seconds. */
const GAPS: Readonly<Record<OneShot, number>> = {
  carEnter: 0.2,
  hit: 0.12,
  pistol: 0.05,
  rocket: 0.08,
  explosion: 0.06,
};

/** How long the flamethrower goes on roaring after the last round, in seconds. */
const FLAME_TAIL = 0.2;

/**
 * And how long the machine gun goes on rattling.
 *
 * @remarks
 * **Just past one round.** Both machine guns in this game put a round out
 * every nine hundredths of a second, so anything shorter than that would let
 * the loop fall silent between two rounds of a burst. Anything much longer is
 * a gun that goes on firing after the trigger has been let go, which is the
 * whole thing this is here to avoid.
 */
const GUN_TAIL = 0.15;

/** Inside this a siren is as loud as it gets, in city pixels. */
const SIREN_NEAR = 180;

/** And past this it cannot be heard at all. */
const SIREN_FAR = 1500;

/** How far a shot carries. */
const SHOT_FAR = 900;

/** And a blast, which carries further. */
const BLAST_FAR = 1300;

/** How near a helicopter has to be to be as loud as it gets. */
const HELI_NEAR = 200;

/** And how far away before it is gone. */
const HELI_FAR = 1400;

/** The same two for a boat, which is heard over water and not much else. */
const BOAT_NEAR = 160;

/** And how far a boat carries. */
const BOAT_FAR = 1100;

/** How loud the engine one is sitting in is at a standstill. */
const ENGINE_REST = 0.55;

/** What is left for the speed to add. */
const ENGINE_RANGE = 0.45;

/** Below this a vehicle counts as standing rather than driving, in px/s. */
const ROLLING = 8;

/** Inside this a passing engine is as loud as it gets out here, in pixels. */
const ENGINE_NEAR = 120;

/** And past this one cannot hear it - about a screen and a half. */
const ENGINE_FAR = 1000;

/**
 * How steeply a passing engine falls off with distance.
 *
 * @remarks
 * Gentler than the squared fall everything else uses, because traffic is a
 * place rather than an event: the street should sound like a street for as
 * far as one can see it. Measured at 300 px, which is well inside the
 * picture: squared it came out at 15 %, like this at 55 %.
 */
const ENGINE_FALL = 1.3;

/** How loud a passing engine is at walking pace, right beside one. */
const PAST_REST = 0.45;

/** And what its speed adds to that. */
const PAST_RANGE = 0.55;

/** The same two for its pitch. */
const ENGINE_PITCH_REST = 0.8;

/** What the speed bends it by. */
const ENGINE_PITCH_RANGE = 0.7;

/** How fast a hovering rotor turns, and what full speed adds. */
const ROTOR_REST = 0.9;

/** What the speed adds to it. */
const ROTOR_RANGE = 0.3;

/** How loud an aeroplane is at its slowest, and what speed adds. */
const JET_REST = 0.5;

/** What the speed adds. */
const JET_RANGE = 0.5;

/** The same for a boat at idle. */
const WAKE_REST = 0.45;

/** What its speed adds. */
const WAKE_RANGE = 0.55;

/** And how far its pitch is bent - a hull, not a gearbox, so hardly at all. */
const WAKE_BEND = 0.2;

/** How fast the strokes go while barely moving. */
const STROKE_REST = 0.9;

/** And what swimming flat out adds to that. */
const STROKE_RANGE = 0.3;

/**
 * How fast one swims flat out, as a share of a walk.
 *
 * @remarks
 * **Not three, which is what a run is.** `Player.pace` is the speed measured
 * against walking, and swimming is slower than walking: measured in the
 * browser it comes out at 0,4 paddling and 1,2 with Shift held. Scaled
 * against a runner's three, those two both landed within a twentieth of each
 * other - the strokes sounded the same whether one was drifting along or
 * swimming for one's life. Against 1,2 they come out at exactly the range
 * this was meant to have.
 */
const SWIM_TOP = 1.2;
