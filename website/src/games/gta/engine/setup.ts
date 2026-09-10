/**
 * Filling the city: where everything stands when the game begins.
 *
 * @module
 * @remarks
 * The streets are always the same, but who is on them is not: cars, people and
 * jobs are drawn from the seed. That is the split the whole game rests on - a
 * city you can learn, and a day in it you cannot.
 */
import { districtAt, districtCentre, doorsOf, isOpen, isRoadAt } from "./city";
import { createCity } from "./city";
import { createRandom, nextInt, nextRandom, type RandomState } from "./random";
import {
  CAT_COUNT,
  CITY_SIZE,
  COPS_PER_CAR,
  DOG_LEASH,
  DOG_SHARE,
  JOB_SECONDS,
  PARKED_COUNT,
  PEOPLE_COUNT,
  PLAYER_HEALTH,
  TILE,
  TRAFFIC_COUNT,
  type Animal,
  type Car,
  type Cell,
  type District,
  type Districts,
  type GameState,
  type Job,
  type JobKind,
  type Person,
  type Pickup,
  type Vec,
} from "./types";
import { emptyBelt, type WeaponKind } from "./weapons";
import {
  CLUB_CROWD,
  CLUB_ROAM,
  MARKET_CROWD,
  MARKET_ROAM,
  SITTING_SHOP,
  SITTING_STREET,
  GANG_ARMS,
  GANG_CORNERS,
  GANG_CREW,
  GANG_ROAM,
  IN_THE_STREET,
  KINDS,
  type PersonKind,
} from "./people";
import { ON_THE_ROAD, TANKS, VEHICLES, type VehicleBody } from "./vehicles";

/** How much money the player starts with. */
const START_MONEY = 250;

/** How many paint colours cars come in. */
const CAR_COLOURS = 8;

/** How many shirt colours people come in. */
const PERSON_LOOKS = 6;

/** How many tries a spot is looked for before the search gives up. */
const PLACE_TRIES = 200;

/** How many ways a car can be parked: the four points of the compass. */
const HEADINGS = 4;

/** How many times a job looks for a destination worth driving to. */
const JOB_TRIES = 8;

/** The distance the pay is counted in. */
const PAY_STEP = 100;

/** How far the car you start beside stands from you, in pixels. */
const FIRST_CAR_AWAY = 30;

/** How much of the city the player may start in, as a share of its width. */
const START_SHARE = 0.25;

/** How far from the middle of town the player starts, in pixels. */
const START_RANGE = CITY_SIZE * START_SHARE;

/** The four quarters, for the takeover board. */
export const DISTRICTS: readonly District[] = [
  "grove",
  "ballas",
  "vagos",
  "beach",
];

/** What a job pays, before the distance is counted. */
const JOB_BASE_PAY = 150;

/** What every {@link PAY_STEP} pixels of the trip add to the pay. */
const JOB_PAY_PER_100 = 12;

/** The shortest a job may be, in pixels - a delivery next door is not a job. */
const JOB_MIN_DISTANCE = 600;

/**
 * A fresh game.
 *
 * @param seed - what the day is drawn from
 * @returns the city, filled and waiting
 */
export function createGame(seed: number): GameState {
  const cells = createCity();
  let rng = createRandom(seed);
  // Downtown rather than the edge of the map: a game that starts with the sea
  // filling half the screen starts by looking broken.
  const start = findSpot(cells, rng, "road", START_RANGE);
  rng = start.rng;
  const cars: Car[] = [];
  // A car of your own, right there. Every game of this sort starts by handing
  // you the keys to something, and hunting for the first car on foot is the
  // least interesting minute it could open with.
  const first = makeCar(rng, 0, "parked", {
    x: start.at.x + FIRST_CAR_AWAY,
    y: start.at.y,
  });
  rng = first.rng;
  cars.push(first.car);
  for (let at = 0; at < TRAFFIC_COUNT; at += 1) {
    const spot = findSpot(cells, rng, "road");
    rng = spot.rng;
    const pick = pickBody(rng);
    rng = pick.rng;
    const made = makeCar(rng, cars.length, "traffic", spot.at, pick.body);
    rng = made.rng;
    cars.push(made.car);
  }
  for (let at = 0; at < PARKED_COUNT; at += 1) {
    const spot = findSpot(cells, rng, "road");
    rng = spot.rng;
    const pick = pickBody(rng);
    rng = pick.rng;
    const made = makeCar(rng, cars.length, "parked", spot.at, pick.body);
    rng = made.rng;
    cars.push(made.car);
  }
  // A couple of tanks, standing about. Finding one should be an event, so they
  // are parked rather than driven and there are only ever a handful.
  for (let at = 0; at < TANKS; at += 1) {
    const spot = findSpot(cells, rng, "road");
    rng = spot.rng;
    const made = makeCar(rng, cars.length, "parked", spot.at, "tank");
    rng = made.rng;
    cars.push(made.car);
  }
  const people: Person[] = [];
  const animals: Animal[] = [];
  for (let at = 0; at < PEOPLE_COUNT; at += 1) {
    const spot = findSpot(cells, rng, "walk");
    rng = spot.rng;
    const made = makePerson(rng, at, spot.at);
    rng = made.rng;
    const person =
      made.person.mood === "sitting"
        ? againstWall(cells, made.person)
        : made.person;
    people.push(person);
    // Some of them have a dog on the end of a lead. Only the sorts who would.
    const draw = nextRandom(rng);
    rng = draw.state;
    if (KINDS[made.person.kind].walksDogs && draw.value < DOG_SHARE) {
      animals.push({
        id: animals.length,
        x: person.x + DOG_LEASH,
        y: person.y,
        heading: 0,
        turnAt: 0,
        walked: 0,
        kind: "dog",
        ownerId: made.person.id,
      });
    }
  }
  const gangs = makeGangs(cells, rng, people.length);
  rng = gangs.rng;
  people.push(...gangs.people);
  const outside = makeClubCrowd(rng, people.length);
  rng = outside.rng;
  people.push(...outside.people);
  const shoppers = makeMarketCrowd(cells, rng, people.length);
  rng = shoppers.rng;
  people.push(...shoppers.people);
  // And the cats, who belong to nobody.
  for (let at = 0; at < CAT_COUNT; at += 1) {
    const spot = findSpot(cells, rng, "walk");
    rng = spot.rng;
    const way = nextRandom(rng);
    rng = way.state;
    animals.push({
      id: animals.length,
      x: spot.at.x,
      y: spot.at.y,
      heading: way.value * Math.PI * 2,
      turnAt: 0,
      walked: 0,
      kind: "cat",
      ownerId: null,
    });
  }
  const pickups: Pickup[] = [];
  for (const sort of LYING_ABOUT) {
    for (let one = 0; one < sort.many; one += 1) {
      const spot = findSpot(cells, rng, "walk");
      rng = spot.rng;
      pickups.push({
        id: pickups.length,
        x: spot.at.x,
        y: spot.at.y,
        holds: sort.holds,
        backAt: null,
        again: sort.again,
      });
    }
  }
  const home = myHouse(start.at);
  const job = pickJob(cells, rng);
  return {
    phase: "playing",
    time: 0,
    rng: job.rng,
    cells,
    player: {
      x: start.at.x,
      y: start.at.y,
      angle: 0,
      heading: 0,
      walked: 0,
      health: PLAYER_HEALTH,
      money: START_MONEY,
      respect: 0,
      stars: 0,
      coolAt: 0,
      starAt: 0,
      floorUntil: 0,
      movedAt: 0,
      striped: false,
      heat: 0,
      car: null,
      safeUntil: 0,
      pinned: 0,
      rammedUntil: 0,
      crashUntil: 0,
      reloadAt: 0,
      punches: 0,
      // Only fists to begin with. Everything else is out there somewhere,
      // which is the whole reason to walk down a street you have no job on.
      weapon: "fist",
      ammo: emptyBelt(),
      armour: 0,
      hurtAt: 0,
      god: false,
    },
    cars,
    people,
    animals,
    cops: [],
    bullets: [],
    blasts: [],
    pickups,
    job: job.job,
    districts: emptyDistricts(),
    garage: home,
    garageAt: null,
    heli: null,
    feud: { mine: false, rival: false },
    patrolAt: 0,
    prison: null,
    charges: [],
    log: ["Los Santos. Klau dir was und fang an."],
  };
}

/**
 * What lies about the city, how much of it, and whether it comes back.
 *
 * @remarks
 * Counted out rather than drawn from a bag. Forty random finds meant a rocket
 * launcher on every third corner, and forty seconds after taking one there was
 * another in the same place: that is a dispenser, not a city. Now the everyday
 * things are a handful each and come back, and **the heavy ones lie in exactly
 * one place each and never return**. Finding the launcher is meant to be a
 * thing that happens to you once.
 */
const LYING_ABOUT: readonly {
  readonly holds: WeaponKind | "armour";
  readonly many: number;
  readonly again: boolean;
}[] = [
  { holds: "armour", many: 4, again: true },
  { holds: "knuckles", many: 2, again: true },
  { holds: "baton", many: 2, again: true },
  { holds: "knife", many: 2, again: true },
  { holds: "pistol", many: 3, again: true },
  { holds: "grenade", many: 2, again: false },
  { holds: "mg", many: 1, again: false },
  { holds: "flamer", many: 1, again: false },
  { holds: "rpg", many: 1, again: false },
  // One box of charges in the whole city, and it does not come back. It is the
  // answer to a tank, and an answer one can pick up twice a minute is not one.
  { holds: "remote", many: 1, again: false },
];

/** Nobody owns anything yet. */
export function emptyDistricts(): Districts {
  return {
    grove: { done: 0, owned: false },
    ballas: { done: 0, owned: false },
    vagos: { done: 0, owned: false },
    beach: { done: 0, owned: false },
  };
}

/**
 * A free spot of the sort asked for.
 *
 * @param cells - the city floor
 * @param rng - the generator
 * @param want - the kind of ground the spot has to be on
 * @param within - how far from the middle of town to look, in pixels
 * @returns the point and the generator afterwards
 * @remarks
 * Tries and gives up rather than looping for ever: if the draw keeps landing in
 * the sea, the middle of the city will do. A spawn in a wall would be worse
 * than a spawn in a boring place.
 */
export function findSpot(
  cells: readonly Cell[],
  rng: RandomState,
  want: "road" | "walk",
  within = CITY_SIZE,
): { at: Vec; rng: RandomState } {
  const middle = CITY_SIZE / 2;
  const from = Math.max(0, middle - within);
  const span = Math.min(CITY_SIZE, within * 2);
  let state = rng;
  for (let tries = 0; tries < PLACE_TRIES; tries += 1) {
    const drawX = nextInt(state, span);
    const drawY = nextInt(drawX.state, span);
    state = drawY.state;
    const at = { x: from + drawX.value, y: from + drawY.value };
    const road = isRoadAt(cells, at.x, at.y);
    if (want === "road" ? road : isOpen(cells, at.x, at.y) && !road) {
      return { at, rng: state };
    }
  }
  return { at: { x: middle, y: middle }, rng: state };
}

/** One car, pointed along the street it stands on. */
function makeCar(
  rng: RandomState,
  id: number,
  kind: Car["kind"],
  at: Vec,
  body: VehicleBody = "car",
): { car: Car; rng: RandomState } {
  const colour = nextInt(rng, CAR_COLOURS);
  const turn = nextInt(colour.state, HEADINGS);
  return {
    car: {
      id,
      kind,
      body,
      // Only a patrol car carries anybody the engine knows about; whoever is
      // at the wheel of the traffic is scenery, and scenery does not get out.
      crew: kind === "police" ? COPS_PER_CAR : 0,
      turret: 0,
      x: at.x,
      y: at.y,
      angle: (turn.value * Math.PI) / 2,
      speed: 0,
      colour: colour.value,
      health: VEHICLES[body].health,
      driven: false,
      turnAt: 0,
      fireAt: null,
    },
    rng: turn.state,
  };
}

/**
 * The door of the house that is the player's own.
 *
 * @param start - where the player begins
 * @returns the pavement outside its garage
 * @remarks
 * The nearest ordinary house to where the day starts, so that home is
 * somewhere one has walked past rather than a spot on the other side of town.
 * It is picked out of the same table the renderer paints the roofs from, so
 * the two can never disagree about which house it is.
 */
function myHouse(start: Vec): Vec {
  const doors = doorsOf("house");
  let best = doors[0] ?? start;
  let bestAway = Number.POSITIVE_INFINITY;
  for (const door of doors) {
    const away = far(door, start);
    if (away < bestAway) {
      best = door;
      bestAway = away;
    }
  }
  return best;
}

/** One body out of the mix that rolls in ordinary traffic. */
function pickBody(rng: RandomState): { body: VehicleBody; rng: RandomState } {
  const draw = nextInt(rng, ON_THE_ROAD.length);
  return { body: ON_THE_ROAD[draw.value] ?? "car", rng: draw.state };
}

/** One person, walking some way. */
function makePerson(
  rng: RandomState,
  id: number,
  at: Vec,
): { person: Person; rng: RandomState } {
  const look = nextInt(rng, PERSON_LOOKS);
  const way = nextRandom(look.state);
  const which = nextInt(way.state, IN_THE_STREET.length);
  const kind = IN_THE_STREET[which.value] ?? "plain";
  const arms = nextInt(which.state, GANG_ARMS.length);
  const rest = nextRandom(arms.state);
  // A few of the down-and-outs are not going anywhere. Where exactly they sit
  // down is settled afterwards, by whoever knows where the walls are - and
  // most of them sit outside a shop rather than here, which is why the share
  // out on the open street is the small one.
  const sits = KINDS[kind].sits && rest.value < SITTING_STREET;
  return {
    person: {
      id,
      x: at.x,
      y: at.y,
      heading: way.value * Math.PI * 2,
      turnAt: 0,
      mood: sits ? "sitting" : "walking",
      stillUntil: 0,
      scaredAt: 0,
      look: look.value,
      walked: 0,
      kind,
      // Only the gangs carry anything, and which of the three it is stays with
      // them: it is what they shoot with and what falls out of their hand.
      holds: KINDS[kind].armed ? (GANG_ARMS[arms.value] ?? "pistol") : null,
      health: KINDS[kind].health,
      reloadAt: 0,
      home: null,
    },
    rng: rest.state,
  };
}

/**
 * The night crowd, standing about outside every night club.
 *
 * @param rng - the generator
 * @param from - the id the first of them gets
 * @returns the women outside the clubs, and the generator afterwards
 */
function makeClubCrowd(
  rng: RandomState,
  from: number,
): { people: Person[]; rng: RandomState } {
  const people: Person[] = [];
  let state = rng;
  for (const door of doorsOf("club")) {
    for (let one = 0; one < CLUB_CROWD; one += 1) {
      const away = nextRandom(state);
      const turn = nextRandom(away.state);
      state = turn.state;
      const angle = turn.value * Math.PI * 2;
      const at = {
        x: door.x + Math.cos(angle) * away.value * CLUB_ROAM,
        y: door.y + Math.sin(angle) * away.value * CLUB_ROAM,
      };
      const made = makePerson(state, from + people.length, at);
      state = made.rng;
      people.push({
        ...made.person,
        kind: "night",
        health: KINDS.night.health,
        mood: "walking",
        home: door,
      });
    }
  }
  return { people, rng: state };
}

/**
 * The down-and-outs outside every supermarket.
 *
 * @param cells - the city floor
 * @param rng - the generator
 * @param from - the id the first of them gets
 * @returns the men outside the shops, and the generator afterwards
 * @remarks
 * The shop door is their corner: they are given it as a home, so the ones who
 * are walking drift about it and come back rather than wandering off across
 * town. The rest sit down, and those are put on the door line first so that
 * {@link againstWall} finds them the front of the shop and not the building
 * over the road.
 */
function makeMarketCrowd(
  cells: readonly Cell[],
  rng: RandomState,
  from: number,
): { people: Person[]; rng: RandomState } {
  const people: Person[] = [];
  let state = rng;
  for (const door of doorsOf("market")) {
    for (let one = 0; one < MARKET_CROWD; one += 1) {
      const away = nextRandom(state);
      const turn = nextRandom(away.state);
      const rest = nextRandom(turn.state);
      state = rest.state;
      const sits = rest.value < SITTING_SHOP;
      const angle = turn.value * Math.PI * 2;
      // Whoever is sitting down goes along the shop front; whoever is still on
      // his feet may be anywhere round the door.
      const at = sits
        ? { x: door.x + (turn.value - MIDDLE) * 2 * MARKET_ROAM, y: door.y }
        : {
            x: door.x + Math.cos(angle) * away.value * MARKET_ROAM,
            y: door.y + Math.sin(angle) * away.value * MARKET_ROAM,
          };
      const made = makePerson(state, from + people.length, at);
      state = made.rng;
      // The draw for the kind is thrown away here - this crowd is all of one
      // sort - so whether this one sits has to be asked again.
      const bum: Person = {
        ...made.person,
        kind: "bum",
        health: KINDS.bum.health,
        mood: sits ? "sitting" : "walking",
        home: door,
      };
      people.push(sits ? againstWall(cells, bum) : bum);
    }
  }
  return { people, rng: state };
}

/**
 * The gangs: a few corners each, with a crew standing about every one.
 *
 * @param cells - the city floor
 * @param rng - the generator
 * @param from - the id the first of them gets
 * @returns the members, and the generator afterwards
 */
function makeGangs(
  cells: readonly Cell[],
  rng: RandomState,
  from: number,
): { people: Person[]; rng: RandomState } {
  const people: Person[] = [];
  let state = rng;
  const sides: readonly PersonKind[] = ["mine", "rival"];
  for (const kind of sides) {
    for (let corner = 0; corner < GANG_CORNERS; corner += 1) {
      const spot = findSpot(cells, state, "walk");
      state = spot.rng;
      for (let man = 0; man < GANG_CREW; man += 1) {
        const away = nextRandom(state);
        const turn = nextRandom(away.state);
        state = turn.state;
        const angle = turn.value * Math.PI * 2;
        const at = {
          x: spot.at.x + Math.cos(angle) * away.value * GANG_ROAM,
          y: spot.at.y + Math.sin(angle) * away.value * GANG_ROAM,
        };
        const made = makePerson(state, from + people.length, at);
        const arms = nextInt(made.rng, GANG_ARMS.length);
        state = arms.state;
        people.push({
          ...made.person,
          kind,
          // Drawn again here: the man this started out as was a passer-by, and
          // a passer-by carries nothing.
          holds: GANG_ARMS[arms.value] ?? "pistol",
          health: KINDS[kind].health,
          mood: "walking",
          home: spot.at,
        });
      }
    }
  }
  return { people, rng: state };
}

/** The middle of a draw between nought and one, to spread either way from. */
const MIDDLE = 0.5;

/** How far to look for a wall to sit against, in pixels. */
const WALL_REACH = 44;

/** In what steps that search goes out. */
const WALL_STEP = 2;

/** How far from the wall they end up sitting. */
const WALL_GAP = 7;

/** The four ways a wall can lie from where somebody is standing. */
const WAYS: readonly number[] = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

/**
 * Sits somebody down against the nearest house wall, back to it.
 *
 * @param cells - the city floor
 * @param person - somebody who means to sit down
 * @returns the same person at the wall, or walking again if there is none
 * @remarks
 * The spot they were given is a free one, which is to say the middle of a
 * pavement - sitting there looks like collapsing there. So the four directions
 * are walked outwards until one of them runs into a building, and that is the
 * wall they lean on. A pavement with no wall within reach means this one gets
 * up and walks instead: better a walker than a man sitting in the open.
 *
 * They end up with their back to the wall, not their face: that is how one
 * sits against a wall, and it is also the only way the crossed legs land on
 * the open pavement instead of inside the brickwork.
 */
function againstWall(cells: readonly Cell[], person: Person): Person {
  let way = 0;
  let out = 0;
  for (const turn of WAYS) {
    for (let step = WALL_STEP; step <= WALL_REACH; step += WALL_STEP) {
      const wall = !isOpen(
        cells,
        person.x + Math.cos(turn) * step,
        person.y + Math.sin(turn) * step,
      );
      if (out === 0 && wall) {
        way = turn;
        out = step;
      }
    }
  }
  return out === 0
    ? { ...person, mood: "walking" }
    : {
        ...person,
        x: person.x + Math.cos(way) * (out - WALL_GAP),
        y: person.y + Math.sin(way) * (out - WALL_GAP),
        heading: way + Math.PI,
      };
}

/**
 * The next job on the board.
 *
 * @param cells - the city floor
 * @param rng - the generator
 * @returns the job and the generator afterwards
 */
export function pickJob(
  cells: readonly Cell[],
  rng: RandomState,
): { job: Job; rng: RandomState } {
  const kinds: readonly JobKind[] = ["courier", "taxi", "steal"];
  const drawKind = nextInt(rng, kinds.length);
  const from = findSpot(cells, drawKind.state, "road");
  let to = findSpot(cells, from.rng, "road");
  // A delivery to the next corner is not a delivery.
  for (
    let tries = 0;
    tries < JOB_TRIES && far(from.at, to.at) < JOB_MIN_DISTANCE;
    tries += 1
  ) {
    to = findSpot(cells, to.rng, "road");
  }
  const pay =
    JOB_BASE_PAY +
    Math.round((far(from.at, to.at) / PAY_STEP) * JOB_PAY_PER_100);
  return {
    job: {
      kind: kinds[drawKind.value],
      from: from.at,
      to: to.at,
      district: districtAt(to.at.x, to.at.y),
      loaded: false,
      until: null,
      pay,
    },
    rng: to.rng,
  };
}

/** How long a job may take once it is picked up. */
export function jobDeadline(time: number): number {
  return time + JOB_SECONDS;
}

/** How far apart two points are, in pixels. */
export function far(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Where the takeover marker of a district sits. */
export function districtMarker(district: District): Vec {
  const centre = districtCentre(district);
  return { x: centre.x + TILE / 2, y: centre.y + TILE / 2 };
}
