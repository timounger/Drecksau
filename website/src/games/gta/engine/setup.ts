/**
 * Filling the city: where everything stands when the game begins.
 *
 * @module
 * @remarks
 * The streets are always the same, but who is on them is not: cars, people and
 * jobs are drawn from the seed. That is the split the whole game rests on - a
 * city you can learn, and a day in it you cannot.
 */
import {
  cellUnder,
  districtAt,
  districtCentre,
  doorsOf,
  fireBays,
  openStations,
  padsOf,
  plotsOf,
  roofAt,
  isOpen,
  isRoadAt,
} from "./city";
import { carParks, createCity, myHouses, openBay, stations } from "./city";
import { prisonAnchors, prisonPlot, villaCell, warderPosts } from "./city";
import { createRandom, nextInt, nextRandom, type RandomState } from "./random";
import { newTrain } from "./train";
import {
  ACK_HEALTH,
  ACK_SITES,
  BASE,
  FARMS,
  BASE_PAD,
  CAT_COUNT,
  CITY_SIZE,
  COP_HEALTH,
  GUARD_COUNT,
  CITY_TILES,
  COPS_PER_CAR,
  DOG_LEASH,
  DOG_SHARE,
  JOB_SECONDS,
  CAR_SEATS,
  PARKED_COUNT,
  PEOPLE_COUNT,
  PLAYER_HEALTH,
  TILE,
  TRAFFIC_COUNT,
  type Animal,
  type Cop,
  type Car,
  type Ack,
  type Cell,
  type Chopper,
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
import {
  AT_THE_KERB,
  DELOREANS,
  ON_THE_ROAD,
  TANKS,
  TRACTORS,
  VEHICLES,
  type VehicleBody,
} from "./vehicles";

/** How much money the player starts with. */
const START_MONEY = 250;

/** How many paint colours cars come in. */
const CAR_COLOURS = 8;

/** How many shirt colours people come in. */
const PERSON_LOOKS = 6;

/** How many tries a spot is looked for before the search gives up. */
const PLACE_TRIES = 400;

/** How many ways a car can be parked: the four points of the compass. */
const HEADINGS = 4;

/** How many times a job looks for a destination worth driving to. */
const JOB_TRIES = 8;

/** The distance the pay is counted in. */
const PAY_STEP = 100;

/**
 * The four launchers round the base, all of them whole.
 *
 * @returns one per corner of the wire, in city pixels
 */
export function newAcks(): readonly Ack[] {
  return ACK_SITES.map((site) => ({
    x: site.x * TILE,
    y: site.y * TILE,
    health: ACK_HEALTH,
    backAt: null,
  }));
}

/**
 * The helicopter, on its pad at the military base.
 *
 * @returns it, nose north and rotor still
 */
export function newChopper(): Chopper {
  return {
    id: 0,
    kind: "army",
    x: BASE_PAD.x * TILE,
    y: BASE_PAD.y * TILE,
    angle: -Math.PI / 2,
    height: 0,
    speed: 0,
    spin: 0,
  };
}

/**
 * Every machine there is: the olive one on the base, one yellow one per
 * hospital.
 *
 * @param cells - the city floor, which is what says how high a roof is
 * @returns the five of them, standing where they belong
 * @remarks
 * The rescue machines start **on the roof**, at the height the floor gives
 * that roof - not at nought with a building drawn round them. Which is also
 * how one gets to them: over the wall with a jetpack, or in another
 * helicopter.
 */
export function newChoppers(cells: readonly Cell[]): readonly Chopper[] {
  return [
    newChopper(),
    ...padsOf().map((pad, at) => ({
      id: at + 1,
      kind: "rescue" as const,
      x: pad.x,
      y: pad.y,
      angle: -Math.PI / 2,
      height: roofAt(cells, pad.x, pad.y),
      speed: 0,
      spin: 0,
    })),
  ];
}

/** How many guards stand in one row inside the wire. */
const GUARD_ROW = 5;

/** Where the tanks stand inside the base, in squares from its west fence. */
const TANK_ACROSS = 4;

/** And from its north fence. */
const TANK_DOWN = 4;

/** How far apart two of them are parked. */
const TANK_APART = 3;

/** Where the first guard stands, in squares from the west fence. */
const GUARD_ACROSS = 3;

/** And from the north fence. */
const GUARD_DOWN = 8;

/** How far apart two men in a row stand. */
const GUARD_APART = 3;

/** And how far apart the two rows are. */
const GUARD_ROWS = 4;

/** What they carry: the base is not patrolled with truncheons. */
const GUARD_ARMS: readonly WeaponKind[] = ["mg", "pistol", "mg"];

/** How many patrol cars stand at the kerb outside one police station. */
const STATION_CARS = 4;

/** And how many men walk about between them. */
const STATION_MEN = 4;

/**
 * The warders of every prison in the city.
 *
 * @param from - the first id to give out, so they follow the base guards
 * @returns six men a prison, standing at their posts
 * @remarks
 * Its own function because a save made before there were any has to be able to
 * ask for them - see `rebuild` in ../storage/saves. A prison with no warders
 * in it is a prison that opens its own gate.
 */
export function prisonGuards(from: number): Cop[] {
  const men: Cop[] = [];
  for (const anchor of prisonAnchors()) {
    const posts = warderPosts(prisonPlot(anchor.x, anchor.y));
    for (const [at, spot] of posts.entries()) {
      men.push({
        id: from + men.length,
        carId: -1,
        x: spot.x,
        y: spot.y,
        angle: Math.PI / 2,
        walked: 0,
        pace: 0,
        health: COP_HEALTH,
        holds: WARDER_ARMS[at % WARDER_ARMS.length] ?? "pistol",
        reloadAt: 0,
        readyAt: 0,
        post: (at * Math.PI * 2) / posts.length,
        guards: spot,
        burst: 0,
        stillUntil: null,
        floorUntil: null,
        boardAt: null,
      });
    }
  }
  return men;
}

/**
 * Whether a spot is somewhere no passer-by should be put down.
 *
 * @param at - the spot, in pixels
 * @returns true for the villa's grounds and for anybody's garage
 */
function privateGround(at: Vec, roll: number): boolean {
  if (myHouses().some((home) => far(at, home) < GARAGE_KEEP)) {
    return true;
  }
  const cell = villaCell(Math.floor(at.x / TILE), Math.floor(at.y / TILE));
  // Off the property altogether: nobody's business but the walker's. On the
  // garden, the yard or the house: never. On the footway down either side of
  // it: a few, because a pavement outside a house with nobody ever on it is a
  // street nobody lives in - but only a few, since a dozen squares of paving
  // hemmed in by a hedge and a road fill up and stay full.
  return cell === null ? false : cell !== "walk" || roll > VILLA_PASSERS;
}

/** How many spots are tried before a DeLorean settles for one. */
const YARD_TRIES = 8;

/** How many of the people who would start on the villa's footway do. */
const VILLA_PASSERS = 0.3;

/** What a warder carries: a yard is watched over open sights, not with a bat. */
const WARDER_ARMS: readonly WeaponKind[] = ["pistol", "mg"];

/** How far the car you start beside stands from you, in pixels. */
const FIRST_CAR_AWAY = 30;

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
  const plan = createCity();
  let rng = createRandom(seed);
  // Which houses are yours decides where the garages are, and a garage is a
  // hole in a house - so the floor everybody else is placed on already has it.
  const homes = myHouses();
  // On your own doorstep in Los Santos rather than in the middle of the map:
  // the middle of San Andreas is open water with a mountain beside it, and a
  // game that starts in a field starts by looking lost.
  const start = { at: roadNear(plan, homes[homes.length - 1]), rng };
  // The three garages, and the three bays of every fire station: both are
  // holes cut in a building, and both are cut once, here.
  const cells = openStations(
    homes.reduce((floor, home) => openBay(floor, home), plan),
  );
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
    const pick = pickBody(rng);
    rng = pick.rng;
    const spot = freeSpot(cells, rng, "road", cars, pick.body);
    rng = spot.rng;
    const made = makeCar(rng, cars.length, "traffic", spot.at, pick.body);
    rng = made.rng;
    const who = nextInt(rng, CAR_SEATS);
    rng = who.state;
    cars.push({ ...made.car, seats: who.value + 1 });
  }
  // At the kerb, not in the road. A hundred and sixty cars standing about on
  // the carriageway is what made the traffic look like a car park: the ones
  // that are parked belong on the pavement edge, and the road belongs to the
  // ones that are driving.
  for (let at = 0; at < PARKED_COUNT; at += 1) {
    const pick = pickParked(rng);
    rng = pick.rng;
    const spot = freeSpot(cells, rng, "walk", cars, pick.body);
    rng = spot.rng;
    // Not in somebody garage. The bay is hollowed out of the house before the
    // cars are placed, and a hollow in a house is a square of pavement as far
    // as anybody looking for a parking space is concerned - so three of them
    // used to be queued up the drive and through the door of your own house.
    // Not in somebody's garage, and not on the villa's own forecourt either:
    // what stands in your yard should be what you left there.
    const blocking =
      homes.some((home) => far(spot.at, home) < GARAGE_KEEP) ||
      privateGround(spot.at, 1);
    if (!blocking) {
      const made = makeCar(rng, cars.length, "parked", spot.at, pick.body);
      rng = made.rng;
      cars.push({ ...made.car, angle: alongKerb(cells, spot.at) });
    }
  }
  // The supermarket car parks: a few cars standing in the bays, nose to the
  // shop. A car park with nothing on it is a concrete yard.
  for (const bay of carParks()) {
    const roll = nextRandom(rng);
    rng = roll.state;
    if (roll.value < LOT_TAKEN) {
      const pick = pickParked(rng);
      rng = pick.rng;
      // The bays are a fixed grid, so this cannot be moved - but something
      // else may already have been dropped on it, and a bay with two cars in
      // it is worse than a bay with none.
      if (clearOf(bay.at, pick.body, cars)) {
        const made = makeCar(rng, cars.length, "parked", bay.at, pick.body);
        rng = made.rng;
        cars.push({ ...made.car, angle: bay.angle });
      }
    }
  }
  // A couple of tanks, standing about. Finding one should be an event, so they
  // are parked rather than driven and there are only ever a handful.
  // Three silver wedges, parked where somebody left them - but not on your own
  // forecourt. The yard beside the villa is paved and empty, so the search for
  // a parking space liked it: one of the three stood on it at the start of
  // every game, which is a car somebody left in your drive rather than
  // something to go and find. See {@link privateGround}.
  for (let at = 0; at < DELOREANS; at += 1) {
    let spot = freeSpot(cells, rng, "walk", cars, "dmc");
    rng = spot.rng;
    for (
      let again = 0;
      again < YARD_TRIES && privateGround(spot.at, 1);
      again += 1
    ) {
      spot = freeSpot(cells, rng, "walk", cars, "dmc");
      rng = spot.rng;
    }
    const made = makeCar(rng, cars.length, "parked", spot.at, "dmc");
    rng = made.rng;
    cars.push(made.car);
  }
  // The tanks, and the only ones there are: behind the wire out in the desert,
  // in a row on the concrete. Nothing else in San Andreas hands you one - the
  // police bring theirs at six stars, and that one has to be taken off them.
  for (let at = 0; at < TANKS; at += 1) {
    const spot = {
      x: (BASE.left + TANK_ACROSS + at * TANK_APART) * TILE,
      y: (BASE.top + TANK_DOWN) * TILE,
    };
    const made = makeCar(rng, cars.length, "parked", spot, "tank");
    rng = made.rng;
    cars.push(made.car);
  }
  // And the men who guard them. They belong to the place rather than to a car:
  // see walkCop in ./engine. Two rows across the yard, between the tanks and
  // the gate, so that walking in is walking into all of them.
  // One tractor to a farm, parked beside the barn door.
  for (let at = 0; at < TRACTORS; at += 1) {
    const farm = FARMS[at % FARMS.length];
    const spot = {
      x: farm === undefined ? CITY_SIZE / 2 : (farm.left - 1) * TILE,
      y: farm === undefined ? CITY_SIZE / 2 : (farm.bottom + 2) * TILE,
    };
    const made = makeCar(rng, cars.length, "parked", spot, "tractor");
    rng = made.rng;
    cars.push(made.car);
  }

  const guards: Cop[] = [];
  for (let at = 0; at < GUARD_COUNT; at += 1) {
    const across = at % GUARD_ROW;
    const down = Math.floor(at / GUARD_ROW);
    const spot = {
      x: (BASE.left + GUARD_ACROSS + across * GUARD_APART) * TILE,
      y: (BASE.top + GUARD_DOWN + down * GUARD_ROWS) * TILE,
    };
    guards.push({
      id: at,
      carId: -1,
      x: spot.x,
      y: spot.y,
      angle: Math.PI / 2,
      walked: 0,
      pace: 0,
      health: COP_HEALTH,
      holds: GUARD_ARMS[at % GUARD_ARMS.length] ?? "pistol",
      reloadAt: 0,
      readyAt: 0,
      post: (at * Math.PI * 2) / GUARD_COUNT,
      guards: spot,
      burst: 0,
      stillUntil: null,
      floorUntil: null,
      boardAt: null,
    });
  }

  // **The police stations, and what is outside one.** A building with POLIZEI
  // over the door and nothing in front of it is a sign on a wall; what says
  // police station from across the road is the row of patrol cars at the kerb
  // and the men standing about between them.
  //
  // The plan offers the pavement round each one and this takes the first
  // spots that are any good, cars first and then men - so a station on a
  // corner where two of its sides front a motorway simply puts everything
  // down the side that has a kerb. The men are **guards**, not a patrol: they
  // belong to the place rather than to a car, so they mill about outside their
  // own station and only leave it for somebody who has come to them with stars
  // on. See walkCop in ./engine.
  for (const shop of stations()) {
    let parked = 0;
    let posted = 0;
    for (const spot of shop.ring) {
      if (cellUnder(cells, spot.x, spot.y) !== "walk") {
        continue;
      }
      if (parked < STATION_CARS && clearOf(spot, "patrol", cars)) {
        const made = makeCar(rng, cars.length, "parked", spot, "patrol");
        rng = made.rng;
        cars.push({ ...made.car, angle: alongKerb(cells, spot) });
        parked += 1;
      } else if (posted < STATION_MEN) {
        guards.push({
          id: guards.length,
          carId: -1,
          x: spot.x,
          y: spot.y,
          angle: Math.atan2(shop.at.y - spot.y, shop.at.x - spot.x),
          walked: 0,
          pace: 0,
          health: COP_HEALTH,
          holds: "pistol",
          reloadAt: 0,
          readyAt: 0,
          post: (posted * Math.PI * 2) / STATION_MEN,
          guards: spot,
          burst: 0,
          stillUntil: null,
          floorUntil: null,
          boardAt: null,
        });
        posted += 1;
      }
    }
  }

  // **And three engines in every fire station.** They stand in the bays the
  // floor has just had cut out of the building - one to a bay, nose to the
  // street, which is how an engine waits. The only vehicles in this city that
  // live indoors.
  for (const plot of plotsOf("fire")) {
    for (const bay of fireBays(plot)) {
      // **Nose at the doorway**, not in the middle of the bay. In this view
      // anything standing inside a building climbs its front wall - the
      // further north it is, the higher up the picture it is drawn - so an
      // engine parked at the back of its bay had its ladder across the name
      // over the door. Pulled forward until the bumper is on the threshold it
      // sits where one expects it and the wall above it is still a wall.
      const at = {
        x: ((bay.left + bay.right) / 2) * TILE,
        y: bay.bottom * TILE - ENGINE_IN,
      };
      const made = makeCar(rng, cars.length, "parked", at, "firetruck");
      rng = made.rng;
      cars.push({ ...made.car, angle: Math.PI / 2 });
    }
  }

  // **And an ambulance outside every hospital.** One to a quarter, standing
  // at the kerb where the door is - which is the same spot one is let out of
  // after a death, so it is parked a square to the side of it rather than
  // across it. A hospital with nothing outside it is a sign over a door.
  for (const door of doorsOf("hospital")) {
    const beside = [
      { x: door.x + TILE, y: door.y },
      { x: door.x - TILE, y: door.y },
      { x: door.x, y: door.y + TILE },
      { x: door.x, y: door.y - TILE },
    ].find(
      (spot) =>
        cellUnder(cells, spot.x, spot.y) === "walk" &&
        clearOf(spot, "ambulance", cars),
    );
    if (beside !== undefined) {
      const made = makeCar(rng, cars.length, "parked", beside, "ambulance");
      rng = made.rng;
      cars.push({ ...made.car, angle: alongKerb(cells, beside) });
    }
  }

  // **And the six who hold the prison yard.** Guards like the ones on the
  // base: they belong to a place, they take no part in a chase across town,
  // and they are the only thing in the prison that shoots. Killing all six is
  // what opens the gate - see onThePrison in ./engine - so they are counted,
  // and so they have to be men one can actually reach.
  guards.push(...prisonGuards(guards.length));

  const people: Person[] = [];
  const animals: Animal[] = [];
  for (let at = 0; at < PEOPLE_COUNT; at += 1) {
    const spot = findSpot(cells, rng, "walk");
    rng = spot.rng;
    // **Nobody starts on the villa's ground.** Two things are pavement in
    // there and neither of them is anybody's business: the footway down either
    // side of the property, which is a dozen squares one does not want a
    // crowd standing on, and the **garage bay**, which is a square of walk cut
    // out of the middle of the house so that a car can be driven into it - and
    // which put a passer-by inside your own garage at the start of every game.
    // Whoever wanders in later is welcome; nobody is put there.
    const roll = nextRandom(rng);
    rng = roll.state;
    if (privateGround(spot.at, roll.value)) {
      continue;
    }
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
      // On the lead beside its owner - on the pavement side of him, if the
      // other side happens to be the harbour.
      const lead = isOpen(cells, person.x + DOG_LEASH, person.y)
        ? DOG_LEASH
        : -DOG_LEASH;
      animals.push({
        id: animals.length,
        x: person.x + lead,
        y: person.y,
        heading: 0,
        turnAt: 0,
        walked: 0,
        kind: "dog",
        ownerId: made.person.id,
      });
    }
  }
  const gangs = makeGangs(cells, rng, people.length, homes[0]);
  rng = gangs.rng;
  people.push(...gangs.people);
  const outside = makeClubCrowd(cells, rng, people.length);
  rng = outside.rng;
  people.push(...outside.people);
  const shoppers = makeMarketCrowd(cells, rng, people.length);
  rng = shoppers.rng;
  people.push(...shoppers.people);
  // And the ones who came to shop rather than to stand outside.
  const buying = makeShoppers(cells, rng, people.length);
  rng = buying.rng;
  people.push(...buying.people);
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
        worth: 0,
        backAt: null,
        again: sort.again,
      });
    }
  }
  const job = pickJob(cells, rng);
  return {
    phase: "playing",
    time: 0,
    rng: job.rng,
    cells,
    player: {
      x: start.at.x,
      y: start.at.y,
      boarding: null,
      angle: 0,
      heading: 0,
      walked: 0,
      pace: 0,
      health: PLAYER_HEALTH,
      money: START_MONEY,
      respect: 0,
      stars: 0,
      coolAt: 0,
      starAt: 0,
      floorUntil: 0,
      movedAt: 0,
      striped: false,
      masked: false,
      hooded: false,
      jetpack: false,
      thrust: false,
      spotted: null,
      aboard: false,
      flying: false,
      chopper: null,
      height: 0,
      loot: 0,
      heat: 0,
      car: null,
      safeUntil: 0,
      pinned: 0,
      rammedUntil: 0,
      crashUntil: 0,
      reloadAt: 0,
      gunAt: 0,
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
    cops: guards,
    bullets: [],
    blasts: [],
    pickups,
    job: job.job,
    districts: emptyDistricts(),
    garages: homes,
    train: newTrain(),
    choppers: newChoppers(cells),
    ackAt: 0,
    acks: newAcks(),
    marks: [],
    markAt: 0,
    garageAt: null,
    garageOpen: null,
    heli: null,
    feud: false,
    patrolAt: 0,
    heliAt: 0,
    bank: null,
    prison: null,
    jailbreak: null,
    mint: null,
    crew: [],
    riders: [],
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
    const here = cellUnder(cells, at.x, at.y);
    // A pavement, not merely somewhere one may stand: since the map became
    // mostly countryside, "open and not a road" would scatter the whole of
    // Los Santos over a desert.
    if (want === "road" ? here === "road" : here === "walk") {
      return { at, rng: state };
    }
  }
  return { at: dryLand(cells), rng: state };
}

/**
 * A spot of that sort of ground with no car standing on it already.
 *
 * @param cells - the city floor
 * @param rng - the generator
 * @param kind - the sort of ground wanted
 * @param cars - what has been placed so far
 * @param body - what is about to be placed
 * @returns the spot and the generator afterwards
 * @remarks
 * **Two hundred cars were thrown at the map and none of them looked.** Every
 * one was dropped on a random square of the right sort of ground, and the only
 * thing stopping two landing on the same one was that there are a lot of
 * squares - so every game opened with a handful of pairs standing inside each
 * other, which is the one thing about a parked car that cannot be explained
 * away.
 *
 * The runtime has {@link keepApart} for this, but it only moves **traffic**,
 * and only near the player: a parked car is the fixed thing that everything
 * else is pushed out of, so two parked inside each other stay there for ever.
 * The place to get it right is when they are put down.
 *
 * Measured as a **circle of half the length**, which is the biggest a vehicle
 * is in any direction. Exact boxes would be better and cannot be had here: the
 * angle a car ends up parked at is decided after this, by the kerb it is
 * standing on. A circle that always clears is worth more than a box that is
 * sometimes wrong.
 *
 * It gives up after {@link SPOT_TRIES} and takes the last spot it was offered.
 * A city that is full is a city that is full, and one overlap is better than a
 * loop that does not end.
 */
function freeSpot(
  cells: readonly Cell[],
  rng: RandomState,
  kind: "road" | "walk",
  cars: readonly Car[],
  body: VehicleBody,
): { at: Vec; rng: RandomState } {
  let spin = rng;
  let at: Vec = { x: 0, y: 0 };
  for (let tries = 0; tries < SPOT_TRIES; tries += 1) {
    const spot = findSpot(cells, spin, kind);
    spin = spot.rng;
    at = spot.at;
    if (clearOf(at, body, cars)) {
      break;
    }
  }
  return { at, rng: spin };
}

/** Whether a vehicle of this sort would stand clear of everything placed. */
function clearOf(at: Vec, body: VehicleBody, cars: readonly Car[]): boolean {
  const mine = VEHICLES[body].length / 2;
  return !cars.some(
    (car) => far(at, car) < mine + VEHICLES[car.body].length / 2,
  );
}

/** How far back from the threshold a fire engine stands, in pixels. */
const ENGINE_IN = 34;

/** How many spots are tried before one is taken anyway. */
const SPOT_TRIES = 12;

/**
 * Which way a car parked here should point.
 *
 * @param cells - the city floor
 * @param at - where it stands, in pixels
 * @returns the heading, in radians
 * @remarks
 * Along the kerb, which means along whichever road it is standing beside. A
 * row of parked cars all pointing whichever way the dice fell is the one thing
 * that says nobody parked them.
 */
function alongKerb(cells: readonly Cell[], at: Vec): number {
  const road = (x: number, y: number): boolean =>
    cellUnder(cells, x, y) === "road";
  const across = road(at.x + TILE, at.y) || road(at.x - TILE, at.y);
  return across ? 0 : Math.PI / 2;
}

/**
 * The nearest piece of tarmac to a point.
 *
 * @param cells - the city floor
 * @param at - where to start looking, or nothing at all
 * @returns the middle of the first road square found on a spiral outwards
 */
function roadNear(cells: readonly Cell[], at: Vec | undefined): Vec {
  const from = at ?? { x: CITY_SIZE / 2, y: CITY_SIZE / 2 };
  let found = from;
  let done = false;
  for (let ring = 1; ring < CITY_TILES && !done; ring += 1) {
    for (let step = 0; step < ring * WAYS_ROUND && !done; step += 1) {
      const turn = (step / (ring * WAYS_ROUND)) * Math.PI * 2;
      const spot = {
        x: from.x + Math.cos(turn) * ring * TILE,
        y: from.y + Math.sin(turn) * ring * TILE,
      };
      if (isRoadAt(cells, spot.x, spot.y)) {
        found = spot;
        done = true;
      }
    }
  }
  return found;
}

/**
 * Somewhere solid, for when the dice keep landing in the sea.
 *
 * @param cells - the city floor
 * @returns the first open square found on a spiral out of the middle
 * @remarks
 * The middle of the map used to be the answer, and on a city that filled its
 * square that was fine. Three islands in an ocean are a different map: the
 * middle of it is open water, and everything that gave up on the dice - a
 * hundred passers-by, a few cars - was put there to drown.
 */
function dryLand(cells: readonly Cell[]): Vec {
  const middle = CITY_SIZE / 2;
  let found = { x: middle, y: middle };
  let done = false;
  for (let ring = 1; ring < CITY_TILES && !done; ring += 1) {
    for (let step = 0; step < ring * WAYS_ROUND && !done; step += 1) {
      const turn = (step / (ring * WAYS_ROUND)) * Math.PI * 2;
      const at = {
        x: middle + Math.cos(turn) * ring * TILE,
        y: middle + Math.sin(turn) * ring * TILE,
      };
      if (isOpen(cells, at.x, at.y)) {
        found = at;
        done = true;
      }
    }
  }
  return found;
}

/** How many directions the search out of the middle tries per ring. */
const WAYS_ROUND = 8;

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
      slip: 0,
      want: (turn.value * Math.PI) / 2,
      colour: colour.value,
      health: VEHICLES[body].health,
      driven: false,
      turnAt: 0,
      haltAt: null,
      fireAt: null,
      shells: 0,
      hitched: null,
      braking: false,
      locked: false,
      wakeAt: 0,
      lean: 0,
      rolled: 0,
      seats: 0,
    },
    rng: turn.state,
  };
}

/** One body out of the mix that rolls in ordinary traffic. */
function pickBody(rng: RandomState): { body: VehicleBody; rng: RandomState } {
  const draw = nextInt(rng, ON_THE_ROAD.length);
  return { body: ON_THE_ROAD[draw.value] ?? "car", rng: draw.state };
}

/** One body out of the mix that stands at a kerb: no police among them. */
function pickParked(rng: RandomState): { body: VehicleBody; rng: RandomState } {
  const draw = nextInt(rng, AT_THE_KERB.length);
  return { body: AT_THE_KERB[draw.value] ?? "car", rng: draw.state };
}

/** One person, walking some way. */
export function makePerson(
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
      pace: 0,
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
 * The shoppers, crossing the car park of every supermarket.
 *
 * @param cells - the city floor
 * @param rng - the generator
 * @param from - the id the first of them gets
 * @returns the shoppers, and the generator afterwards
 * @remarks
 * Their home is the bay they parked in, so they drift back to it whenever they
 * wander off - which on a car park round a shop reads as exactly what it is
 * meant to: people walking from their cars to the door and back again.
 */
function makeShoppers(
  cells: readonly Cell[],
  rng: RandomState,
  from: number,
): { people: Person[]; rng: RandomState } {
  const people: Person[] = [];
  let state = rng;
  for (const bay of carParks()) {
    const roll = nextRandom(state);
    state = roll.state;
    if (roll.value < SHOPPERS && isOpen(cells, bay.at.x, bay.at.y)) {
      const made = makePerson(state, from + people.length, bay.at);
      state = made.rng;
      // Home is the bay they parked in, so they drift back to it after
      // wandering towards the door - which on a car park is a man walking to
      // the shop and back to his car.
      people.push({ ...made.person, mood: "walking", home: bay.at });
    }
  }
  return { people, rng: state };
}

/** How many of the bays have somebody walking about on them. */
const SHOPPERS = 0.35;

/** And how many have a car standing in them: a third, not a full house. */
const LOT_TAKEN = 0.33;

/** How much room round a garage door is kept clear of parked cars, in pixels. */
const GARAGE_KEEP = 150;

/**
 * The night crowd, standing about outside every night club.
 *
 * @param rng - the generator
 * @param from - the id the first of them gets
 * @returns the women outside the clubs, and the generator afterwards
 */
function makeClubCrowd(
  cells: readonly Cell[],
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
      const drift = {
        x: door.x + Math.cos(angle) * away.value * CLUB_ROAM,
        y: door.y + Math.sin(angle) * away.value * CLUB_ROAM,
      };
      // A club on the shore would otherwise put half its queue in the sea.
      const at = isOpen(cells, drift.x, drift.y) ? drift : door;
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
      const drift = sits
        ? { x: door.x + (turn.value - MIDDLE) * 2 * MARKET_ROAM, y: door.y }
        : {
            x: door.x + Math.cos(angle) * away.value * MARKET_ROAM,
            y: door.y + Math.sin(angle) * away.value * MARKET_ROAM,
          };
      const at = isOpen(cells, drift.x, drift.y) ? drift : door;
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
 * @param house - the player's own front door, which is one of your corners
 * @returns the members, and the generator afterwards
 */
function makeGangs(
  cells: readonly Cell[],
  rng: RandomState,
  from: number,
  house: Vec,
): { people: Person[]; rng: RandomState } {
  const people: Person[] = [];
  let state = rng;
  const sides: readonly PersonKind[] = ["mine", "rival"];
  for (const kind of sides) {
    for (let corner = 0; corner < GANG_CORNERS; corner += 1) {
      // Your own first corner is the pavement outside your own front door.
      // It is where one comes back to between jobs, so it is where the men
      // one might take along ought to be standing - and a crew of four that
      // has to be collected from the far side of town is a crew nobody takes.
      const atHome = kind === "mine" && corner === 0;
      const spot = atHome
        ? { at: house, rng: state }
        : findSpot(cells, state, "walk");
      state = spot.rng;
      for (let man = 0; man < GANG_CREW; man += 1) {
        const away = nextRandom(state);
        const turn = nextRandom(away.state);
        state = turn.state;
        const angle = turn.value * Math.PI * 2;
        const drift = {
          x: spot.at.x + Math.cos(angle) * away.value * GANG_ROAM,
          y: spot.at.y + Math.sin(angle) * away.value * GANG_ROAM,
        };
        // The corner is on the pavement, but a man scattered round it can land
        // in the house behind - and a gang member who starts inside a wall is
        // one nobody can ever collect.
        const at = isOpen(cells, drift.x, drift.y) ? drift : spot.at;
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
