/**
 * The fighting: enemies walk the flow field and attack, towers aim and fire,
 * soldiers guard their barracks, shells fly, mines go off.
 *
 * @module
 * @remarks
 * Enemies and shells are pooled: a dead enemy goes into a pool and is the
 * next one to be spawned, so a big wave does not churn the garbage collector.
 * Towers find their targets through the spatial hash in `runtime.ts`.
 */
import {
  ENEMY_NAMES,
  LOG,
  STRUCTURE_NAMES,
} from "@/games/frost-fortress/i18n/texts";
import { canAfford, pay } from "./economy";
import {
  BOSS_SLAM,
  BOSS_SUMMON,
  damageScale,
  ENEMIES,
  hpScale,
} from "./enemies";
import { hqCentre, MAP_COLS, MAP_ROWS, TILE, terrainAt } from "./map";
import { enemyPace, hasResearch, sightFactor, weaponStats } from "./modifiers";
import { nextRandom, randomPick, randomRange } from "./random";
import { forEnemiesNear, runtimeOf } from "./runtime";
import {
  BARRACKS_SOLDIERS,
  INFIRMARY_HEAL,
  SOLDIER,
  SOLDIER_COST,
  SOLDIER_TRAIN_TIME,
  STRUCTURES,
} from "./structures";
import { removeStructure } from "./build";
import { pushMessage } from "./log";
import {
  Terrain,
  type Defender,
  type Enemy,
  type EnemyKind,
  type Game,
  type Projectile,
  type ProjectileKind,
  type ResourceId,
  type Structure,
} from "./types";

/** Target searches are spread over up to half as long again. */
const SCAN_JITTER = 0.5;

/** A target this far beyond reach (as a factor) is let go. */
const LOSE_SIGHT = 1.3;

/** How much closer a tower must seem to a tower hunter, world units. */
const TOWER_PREFERENCE_TILES = 4;
const TOWER_PREFERENCE = TILE * TOWER_PREFERENCE_TILES;

/** Crowds walk at a slant: vertical share of the lane offset. */
const LANE_TILT = 0.6;

/** Walking animation per world unit moved. */
const STRIDE = 0.25;

/** Distance of the muzzle from a tower's middle, in tiles. */
const MUZZLE_SHARE = 0.7;

/** Burning grows this much per flamethrower level. */
const BURN_STEP = 0.4;

/** A minefield checks this far around its middle, in tiles. */
const MINE_REACH = 1.5;

/** Angle between the posts of a barracks' soldiers, radians. */
const POST_SPREAD = 2.1;

/** Soldier damage grows this much per barracks level. */
const SOLDIER_DAMAGE_STEP = 0.25;

/** Share of a tile within which a structure is in the way. */
const BLOCKING_SHARE = 0.75;

/** A structure this close (world units) is in the way, not beside it. */
const BLOCKING_GAP = TILE * BLOCKING_SHARE;

/** Seconds between target searches of an enemy. */
const SCAN_INTERVAL = 0.45;

/** Least share of a hit that armour lets through. */
const ARMOR_FLOOR = 0.25;

/** How far a demolisher looks for a tower or wall, in tiles. */
const DEMOLISHER_SEEK = 5;

/** Pace on each terrain. */
const TERRAIN_PACE: Readonly<Record<Terrain, number>> = {
  [Terrain.Snow]: 1,
  [Terrain.DeepSnow]: 0.72,
  [Terrain.Ice]: 1.15,
  [Terrain.Rock]: 0.5,
  [Terrain.Forest]: 0.65,
  [Terrain.IronOre]: 1,
  [Terrain.StoneOre]: 1,
};

/** Shell speeds in world units per second. */
const SHELL_TILES = 9;
const SIEGE_SHELL_TILES = 6;
const BOSS_ROCK_TILES = 8;
const SHELL_SPEED = TILE * SHELL_TILES;
const SIEGE_SHELL_SPEED = TILE * SIEGE_SHELL_TILES;
const BOSS_ROCK_SPEED = TILE * BOSS_ROCK_TILES;

/** Lightning jumps this far between enemies, in tiles, losing this share. */
const CHAIN_REACH = 2.4;
const CHAIN_FALLOFF = 0.75;

/** Frost rounds slow to this pace for this long. */
const FROST_SLOW = 0.7;
const FROST_TIME = 1.5;

/** Splash damage at the very edge of the blast, as a share. */
const SPLASH_EDGE = 0.5;

/** What a raider takes from a building per hit. */
const STEAL_AMOUNT = 4;

/** What raiders steal. */
const STEALABLE: readonly ResourceId[] = ["wood", "food", "iron", "stone"];

/** Seconds between repeated warnings in the log. */
const WARN_EVERY = 20;

/** Pool size limits. */
const POOL_LIMIT = 400;

/** Loot grows this much per wave. */
const LOOT_GROWTH = 0.06;

/** A soldier's hit points grow per barracks level, and with the infirmary. */
const SOLDIER_HP_STEP = 0.2;

/** Training is faster near an infirmary. */
const INFIRMARY_TRAINING = 1.6;

/** Soldiers stand this far from their barracks' middle, in tiles. */
const POST_RADIUS = 1.8;

/** Soldiers chase a little beyond their guard radius, in tiles. */
const CHASE_EXTRA = 1.5;

/** Spread of a crowd, world units. */
const LANE_SPREAD = 11;

/** Mines trigger this close to the footprint's edge, world units. */
const MINE_MARGIN = 4;

/** Damage numbers smaller than this are not shown. */
const SHOWN_DAMAGE = 1;

/**
 * The middle of a structure, in world units.
 *
 * @param structure - the structure
 * @returns its centre
 */
export function centreOf(structure: Structure): { x: number; y: number } {
  const def = STRUCTURES[structure.kind];
  return {
    x: (structure.col + def.width / 2) * TILE,
    y: (structure.row + def.height / 2) * TILE,
  };
}

/**
 * Puts a new enemy on the field, taken from the pool if one is there.
 *
 * @param game - the game, changed
 * @param kind - which enemy
 * @param x - where, world units
 * @param y - where, world units
 * @returns the enemy
 */
export function spawnEnemy(
  game: Game,
  kind: EnemyKind,
  x: number,
  y: number,
): Enemy {
  const runtime = runtimeOf(game);
  const def = ENEMIES[kind];
  const wave = Math.max(1, game.wave.number);
  const hp = Math.round(def.hp * hpScale(kind, wave));
  const enemy: Enemy = runtime.enemyPool.pop() ?? ({} as Enemy);
  Object.assign(enemy, {
    id: game.nextId,
    kind,
    x,
    y,
    hp,
    maxHp: hp,
    armor: def.armor,
    speed: def.speed * TILE,
    damage: def.damage * damageScale(wave),
    range: def.range * TILE,
    interval: def.interval,
    cooldown: def.interval * nextRandom(game),
    target: 0,
    targetUnit: 0,
    scan: 0,
    angle: 0,
    slow: 0,
    slowFactor: 1,
    burn: 0,
    burnDps: 0,
    stun: 0,
    lane: randomRange(game, -LANE_SPREAD, LANE_SPREAD),
    special: 0,
    hitAgo: 99,
    stride: nextRandom(game) * Math.PI * 2,
    alive: true,
  });
  game.nextId += 1;
  game.enemies.push(enemy);
  return enemy;
}

/**
 * Hurts an enemy (armour applies) and kills it at zero.
 *
 * @param game - the game, changed
 * @param enemy - the enemy
 * @param amount - raw damage
 * @param pierce - true for damage that ignores armour (fire)
 */
export function damageEnemy(
  game: Game,
  enemy: Enemy,
  amount: number,
  pierce = false,
): void {
  if (enemy.alive) {
    const real = pierce
      ? amount
      : Math.max(amount * ARMOR_FLOOR, amount - enemy.armor);
    enemy.hp -= real;
    enemy.hitAgo = 0;
    if (real >= SHOWN_DAMAGE && !pierce) {
      game.events.push({
        type: "damage",
        x: enemy.x,
        y: enemy.y,
        amount: Math.round(real),
      });
    }
    if (hasResearch(game, "frostRounds") && !pierce) {
      enemy.slow = FROST_TIME;
      enemy.slowFactor = FROST_SLOW;
    }
    if (enemy.hp <= 0) {
      killEnemy(game, enemy, true);
    }
  }
}

/**
 * Hurts a structure and destroys it at zero.
 *
 * @param game - the game, changed
 * @param structure - the structure
 * @param amount - damage
 */
export function damageStructure(
  game: Game,
  structure: Structure,
  amount: number,
): void {
  const runtime = runtimeOf(game);
  if (runtime.byId.has(structure.id) && !game.over) {
    structure.hp -= amount;
    structure.hitAgo = 0;
    const centre = centreOf(structure);
    if (
      structure.kind === "hq" &&
      game.time - runtime.hqWarnedAt > WARN_EVERY
    ) {
      runtime.hqWarnedAt = game.time;
      pushMessage(game, LOG.hqHit, "bad");
      game.events.push({ type: "hqHit", ...centre });
    }
    if (structure.hp <= 0) {
      game.stats.lost += 1;
      // The fall of the headquarters gets its own line below.
      if (structure.kind !== "hq") {
        pushMessage(
          game,
          LOG.destroyed(STRUCTURE_NAMES[structure.kind]),
          "bad",
        );
      }
      game.events.push({
        type: "destroyed",
        ...centre,
        size: STRUCTURES[structure.kind].width,
      });
      removeStructure(game, structure);
      if (structure.kind === "hq") {
        game.over = true;
        pushMessage(game, LOG.gameOver, "bad");
        game.events.push({ type: "gameOver", ...centre });
      }
    }
  }
}

/**
 * Moves every enemy, lets it choose a target and attack.
 *
 * @param game - the game, changed
 * @param dt - seconds
 */
export function updateEnemies(game: Game, dt: number): void {
  const pace = enemyPace(game);
  const count = game.enemies.length;
  for (let index = 0; index < count; index += 1) {
    const enemy = game.enemies[index];
    if (enemy.alive) {
      updateEnemy(game, enemy, dt, pace);
    }
  }
}

/**
 * Lets every finished tower aim and shoot, and arms the minefields.
 *
 * @param game - the game, changed
 * @param dt - seconds
 */
export function updateTowers(game: Game, dt: number): void {
  const runtime = runtimeOf(game);
  for (const tower of game.structures) {
    const weapon = STRUCTURES[tower.kind].weapon;
    if (tower.built && weapon !== undefined) {
      tower.firing = Math.max(0, tower.firing - dt);
      tower.cooldown -= dt;
      if (tower.kind === "minefield") {
        mineCheck(game, tower);
      } else {
        aimAndFire(game, tower, runtime.distance);
      }
    }
  }
}

/**
 * Trains, heals and moves the barracks' soldiers.
 *
 * @param game - the game, changed
 * @param dt - seconds
 */
export function updateDefenders(game: Game, dt: number): void {
  const runtime = runtimeOf(game);
  for (const barracks of game.structures) {
    if (barracks.kind === "barracks" && barracks.built) {
      train(game, barracks, dt);
    }
  }
  for (const unit of [...game.defenders]) {
    const home = runtime.byId.get(unit.home);
    if (home !== undefined) {
      guard(game, unit, home, dt);
    }
  }
}

/**
 * Flies the shells and lets them burst.
 *
 * @param game - the game, changed
 * @param dt - seconds
 */
export function updateProjectiles(game: Game, dt: number): void {
  const runtime = runtimeOf(game);
  for (const shell of game.projectiles) {
    shell.t = Math.min(1, shell.t + shell.rate * dt);
    shell.x = shell.fromX + (shell.toX - shell.fromX) * shell.t;
    shell.y = shell.fromY + (shell.toY - shell.fromY) * shell.t;
    if (shell.t >= 1) {
      shell.alive = false;
      burst(game, shell);
    }
  }
  const flying = game.projectiles.filter((shell) => shell.alive);
  for (const shell of game.projectiles) {
    if (!shell.alive && runtime.projectilePool.length < POOL_LIMIT) {
      runtime.projectilePool.push(shell);
    }
  }
  game.projectiles = flying;
}

/**
 * Takes dead enemies off the field and into the pool.
 *
 * @param game - the game, changed
 */
export function sweepEnemies(game: Game): void {
  const runtime = runtimeOf(game);
  let write = 0;
  for (const enemy of game.enemies) {
    if (enemy.alive) {
      game.enemies[write] = enemy;
      write += 1;
    } else if (runtime.enemyPool.length < POOL_LIMIT) {
      runtime.enemyPool.push(enemy);
    }
  }
  game.enemies.length = write;
}

/**
 * Distance from a point to a structure's footprint.
 *
 * @param x - point, world units
 * @param y - point, world units
 * @param structure - the structure
 * @returns the gap in world units (0 inside)
 */
export function gapTo(x: number, y: number, structure: Structure): number {
  const def = STRUCTURES[structure.kind];
  const left = structure.col * TILE;
  const top = structure.row * TILE;
  const dx = Math.max(left - x, 0, x - (left + def.width * TILE));
  const dy = Math.max(top - y, 0, y - (top + def.height * TILE));
  return Math.hypot(dx, dy);
}

/** One enemy's moment. */
function updateEnemy(game: Game, enemy: Enemy, dt: number, pace: number): void {
  enemy.hitAgo += dt;
  if (enemy.burn > 0) {
    enemy.burn -= dt;
    damageEnemy(game, enemy, enemy.burnDps * dt, true);
  }
  enemy.slow = Math.max(0, enemy.slow - dt);
  enemy.cooldown -= dt;
  enemy.scan -= dt;
  if (enemy.stun > 0) {
    enemy.stun -= dt;
  } else if (enemy.alive) {
    if (enemy.kind === "boss") {
      bossPowers(game, enemy, dt);
    }
    checkTargets(game, enemy);
    if (enemy.scan <= 0) {
      enemy.scan = SCAN_INTERVAL * (1 + nextRandom(game) * SCAN_JITTER);
      acquire(game, enemy);
    }
    const engaged = attackIfInReach(game, enemy);
    // Riflemen fire on the move; they only stop for what blocks the way or
    // for soldiers. Siege guns, raiders and sappers stop to do their work.
    if (!engaged || !holdsGround(game, enemy)) {
      walk(game, enemy, dt, pace);
    }
  }
}

/** Whether an enemy that is fighting stays where it is. */
function holdsGround(game: Game, enemy: Enemy): boolean {
  const target =
    enemy.target === 0 ? undefined : runtimeOf(game).byId.get(enemy.target);
  const blocking =
    target !== undefined && gapTo(enemy.x, enemy.y, target) <= BLOCKING_GAP;
  const shooter =
    enemy.kind === "soldier" || enemy.kind === "heavy" || enemy.kind === "boss";
  return !shooter || enemy.targetUnit !== 0 || blocking;
}

/** Drops targets that are gone or out of reach. */
function checkTargets(game: Game, enemy: Enemy): void {
  const runtime = runtimeOf(game);
  if (enemy.target !== 0 && !runtime.byId.has(enemy.target)) {
    enemy.target = 0;
  }
  if (enemy.targetUnit !== 0) {
    const unit = game.defenders.find((entry) => entry.id === enemy.targetUnit);
    const far =
      unit === undefined ||
      Math.hypot(unit.x - enemy.x, unit.y - enemy.y) >
        enemy.range * LOSE_SIGHT + TILE;
    if (far) {
      enemy.targetUnit = 0;
    }
  }
}

/** Looks around for something to attack. */
function acquire(game: Game, enemy: Enemy): void {
  const def = ENEMIES[enemy.kind];
  const runtime = runtimeOf(game);
  const seek =
    enemy.kind === "demolisher" ? DEMOLISHER_SEEK * TILE : enemy.range + TILE;
  const reachTiles = Math.ceil(seek / TILE) + 1;
  const col = Math.floor(enemy.x / TILE);
  const row = Math.floor(enemy.y / TILE);
  let best: Structure | undefined;
  let bestScore = Infinity;
  const seen = new Set<number>();
  for (let r = row - reachTiles; r <= row + reachTiles; r += 1) {
    for (let c = col - reachTiles; c <= col + reachTiles; c += 1) {
      const inside = c >= 0 && r >= 0 && c < MAP_COLS && r < MAP_ROWS;
      const id = inside ? runtime.occupancy[r * MAP_COLS + c] : 0;
      if (id !== 0 && !seen.has(id)) {
        seen.add(id);
        const structure = runtime.byId.get(id);
        if (structure !== undefined && structure.kind !== "minefield") {
          const gap = gapTo(enemy.x, enemy.y, structure);
          const tower = STRUCTURES[structure.kind].group === "defense";
          const favoured = def.huntsTowers && tower ? 0 : TOWER_PREFERENCE;
          const score = gap + (def.huntsTowers ? favoured : 0);
          if (gap <= seek && score < bestScore) {
            bestScore = score;
            best = structure;
          }
        }
      }
    }
  }
  if (
    best !== undefined &&
    (enemy.kind !== "raider" || bestScore <= enemy.range)
  ) {
    enemy.target = best.id;
  }
  let nearest = enemy.range;
  for (const unit of game.defenders) {
    const gap = Math.hypot(unit.x - enemy.x, unit.y - enemy.y);
    if (
      gap < nearest &&
      (best === undefined || gap < gapTo(enemy.x, enemy.y, best))
    ) {
      nearest = gap;
      enemy.targetUnit = unit.id;
    }
  }
}

/** Attacks the current target if it is within reach; true if busy fighting. */
function attackIfInReach(game: Game, enemy: Enemy): boolean {
  const runtime = runtimeOf(game);
  const unit =
    enemy.targetUnit === 0
      ? undefined
      : game.defenders.find((entry) => entry.id === enemy.targetUnit);
  const structure =
    enemy.target === 0 ? undefined : runtime.byId.get(enemy.target);
  // The dark and the snow blind the attackers as much as the towers.
  const reach =
    enemy.range > TILE ? enemy.range * sightFactor(game) : enemy.range;
  let engaged = false;
  if (
    unit !== undefined &&
    Math.hypot(unit.x - enemy.x, unit.y - enemy.y) <= reach
  ) {
    engaged = true;
    enemy.angle = Math.atan2(unit.y - enemy.y, unit.x - enemy.x);
    if (enemy.cooldown <= 0) {
      enemy.cooldown = enemy.interval;
      strikeUnit(game, enemy, unit);
    }
  } else if (
    structure !== undefined &&
    gapTo(enemy.x, enemy.y, structure) <= reach
  ) {
    engaged = true;
    const centre = centreOf(structure);
    enemy.angle = Math.atan2(centre.y - enemy.y, centre.x - enemy.x);
    if (enemy.cooldown <= 0) {
      enemy.cooldown = enemy.interval;
      strikeStructure(game, enemy, structure);
    }
  }
  return engaged;
}

/** An enemy's attack on a soldier. */
function strikeUnit(game: Game, enemy: Enemy, unit: Defender): void {
  if (enemy.kind === "demolisher") {
    explode(game, enemy);
  } else {
    game.events.push({
      type:
        enemy.kind === "heavy" || enemy.kind === "boss" ? "heavyShot" : "rifle",
      x: enemy.x,
      y: enemy.y,
      tx: unit.x,
      ty: unit.y,
    });
    damageUnit(game, unit, enemy.damage);
  }
}

/** An enemy's attack on a structure. */
function strikeStructure(game: Game, enemy: Enemy, structure: Structure): void {
  const centre = centreOf(structure);
  switch (enemy.kind) {
    case "demolisher":
      explode(game, enemy);
      break;
    case "siege":
      launch(
        game,
        "siegeShell",
        enemy.x,
        enemy.y,
        centre.x,
        centre.y,
        enemy.damage,
        ENEMIES.siege.splash * TILE,
        true,
        SIEGE_SHELL_SPEED,
      );
      game.events.push({ type: "siegeFire", x: enemy.x, y: enemy.y });
      break;
    case "boss":
      launch(
        game,
        "bossRock",
        enemy.x,
        enemy.y,
        centre.x,
        centre.y,
        enemy.damage,
        ENEMIES.boss.splash * TILE,
        true,
        BOSS_ROCK_SPEED,
      );
      break;
    case "raider":
      damageStructure(game, structure, enemy.damage);
      steal(game, structure);
      game.events.push({ type: "hitStructure", x: centre.x, y: centre.y });
      break;
    default:
      game.events.push({
        type: enemy.kind === "heavy" ? "heavyShot" : "rifle",
        x: enemy.x,
        y: enemy.y,
        tx: centre.x + randomRange(game, -TILE / 2, TILE / 2),
        ty: centre.y + randomRange(game, -TILE / 2, TILE / 2),
      });
      damageStructure(game, structure, enemy.damage);
  }
}

/** A raider's hit on a building takes some of the stock. */
function steal(game: Game, structure: Structure): void {
  const runtime = runtimeOf(game);
  if (STRUCTURES[structure.kind].group !== "defense") {
    const what = randomPick(game, STEALABLE);
    game.res[what] = Math.max(0, game.res[what] - STEAL_AMOUNT);
    if (game.time - runtime.stealWarnedAt > WARN_EVERY) {
      runtime.stealWarnedAt = game.time;
      pushMessage(game, LOG.stolen, "bad");
    }
  }
}

/** A demolisher goes off. */
function explode(game: Game, enemy: Enemy): void {
  const radius = ENEMIES.demolisher.splash * TILE;
  hurtStructuresIn(game, enemy.x, enemy.y, radius, enemy.damage);
  hurtUnitsIn(game, enemy.x, enemy.y, radius, enemy.damage);
  game.events.push({
    type: "bigExplosion",
    x: enemy.x,
    y: enemy.y,
    size: radius,
  });
  killEnemy(game, enemy, false);
}

/** The boss's slam and summons. */
function bossPowers(game: Game, enemy: Enemy, dt: number): void {
  enemy.special += dt;
  const slamDue =
    Math.floor(enemy.special / BOSS_SLAM.interval) >
    Math.floor((enemy.special - dt) / BOSS_SLAM.interval);
  const summonDue =
    Math.floor(enemy.special / BOSS_SUMMON.interval) >
    Math.floor((enemy.special - dt) / BOSS_SUMMON.interval);
  if (slamDue) {
    const radius = BOSS_SLAM.radius * TILE;
    const damage = BOSS_SLAM.damage * damageScale(game.wave.number);
    hurtStructuresIn(game, enemy.x, enemy.y, radius, damage);
    hurtUnitsIn(game, enemy.x, enemy.y, radius, damage);
    game.events.push({ type: "slam", x: enemy.x, y: enemy.y, size: radius });
  }
  if (summonDue) {
    const count =
      1 + Math.floor(game.wave.number / BOSS_SUMMON.wavesPerSoldier);
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      spawnEnemy(
        game,
        "soldier",
        enemy.x + Math.cos(angle) * TILE,
        enemy.y + Math.sin(angle) * TILE,
      );
      game.events.push({
        type: "spawn",
        x: enemy.x + Math.cos(angle) * TILE,
        y: enemy.y + Math.sin(angle) * TILE,
      });
    }
  }
}

/** Walks one step along the flow field (or straight at a sought target). */
function walk(game: Game, enemy: Enemy, dt: number, pace: number): void {
  const runtime = runtimeOf(game);
  const col = Math.min(MAP_COLS - 1, Math.max(0, Math.floor(enemy.x / TILE)));
  const row = Math.min(MAP_ROWS - 1, Math.max(0, Math.floor(enemy.y / TILE)));
  const here = row * MAP_COLS + col;
  let goalX: number;
  let goalY: number;
  const sought =
    enemy.kind === "demolisher" && enemy.target !== 0
      ? runtime.byId.get(enemy.target)
      : undefined;
  const step = runtime.next[here];
  if (sought !== undefined) {
    const centre = centreOf(sought);
    goalX = centre.x;
    goalY = centre.y;
  } else if (step >= 0) {
    const blocker = runtime.occupancy[step];
    const structure = blocker === 0 ? undefined : runtime.byId.get(blocker);
    if (structure !== undefined && structure.kind !== "minefield") {
      enemy.target = structure.id;
    }
    const nc = step % MAP_COLS;
    goalX = nc * TILE + TILE / 2 + enemy.lane;
    goalY = ((step - nc) / MAP_COLS) * TILE + TILE / 2 + enemy.lane * LANE_TILT;
  } else {
    const centre = hqCentre();
    goalX = centre.col * TILE + TILE / 2;
    goalY = centre.row * TILE + TILE / 2;
    const hq = game.structures.find((entry) => entry.kind === "hq");
    if (hq !== undefined) {
      enemy.target = hq.id;
    }
  }
  const dx = goalX - enemy.x;
  const dy = goalY - enemy.y;
  const length = Math.hypot(dx, dy);
  const terrain = terrainAt(game.seed, col, row);
  const speed =
    enemy.speed *
    pace *
    TERRAIN_PACE[terrain] *
    (enemy.slow > 0 ? enemy.slowFactor : 1);
  if (length > 1) {
    const move = Math.min(length, speed * dt);
    enemy.x += (dx / length) * move;
    enemy.y += (dy / length) * move;
    enemy.angle = Math.atan2(dy, dx);
    enemy.stride += move * STRIDE;
  }
}

/** Turns a tower to its target and shoots when ready. */
function aimAndFire(
  game: Game,
  tower: Structure,
  distance: Float32Array,
): void {
  const weapon = STRUCTURES[tower.kind].weapon;
  const stats = weaponStats(game, tower);
  const centre = centreOf(tower);
  const reach = stats.range * TILE;
  const runtime = runtimeOf(game);
  let target =
    tower.target === 0 ? undefined : runtime.enemyById.get(tower.target);
  if (
    target === undefined ||
    !target.alive ||
    Math.hypot(target.x - centre.x, target.y - centre.y) > reach
  ) {
    target = pickTarget(
      game,
      centre.x,
      centre.y,
      reach,
      weapon?.targeting ?? "nearest",
      distance,
    );
    tower.target = target?.id ?? 0;
  }
  if (target !== undefined) {
    tower.aim = Math.atan2(target.y - centre.y, target.x - centre.x);
  }
  if (target !== undefined && tower.cooldown <= 0 && weapon !== undefined) {
    tower.cooldown = stats.interval;
    const ammo = weapon.ammo ?? {};
    if (canAfford(game.res, ammo)) {
      pay(game.res, ammo);
      fire(game, tower, target, stats.damage, reach, centre);
    }
  }
}

/** Finds the enemy a tower wants most. */
function pickTarget(
  game: Game,
  x: number,
  y: number,
  reach: number,
  targeting: string,
  distance: Float32Array,
): Enemy | undefined {
  let best: Enemy | undefined;
  let bestScore = Infinity;
  forEnemiesNear(game, x, y, reach, (enemy, distanceSq) => {
    let score = distanceSq;
    if (targeting === "first") {
      const col = Math.floor(enemy.x / TILE);
      const row = Math.floor(enemy.y / TILE);
      score = distance[row * MAP_COLS + col] ?? Infinity;
    } else if (targeting === "strongest") {
      score = -enemy.hp;
    }
    if (score < bestScore) {
      bestScore = score;
      best = enemy;
    }
  });
  return best;
}

/** One shot of a tower. */
function fire(
  game: Game,
  tower: Structure,
  target: Enemy,
  damage: number,
  reach: number,
  centre: { x: number; y: number },
): void {
  const weapon = STRUCTURES[tower.kind].weapon;
  const muzzle = TILE * MUZZLE_SHARE;
  const mx = centre.x + Math.cos(tower.aim) * muzzle;
  const my = centre.y + Math.sin(tower.aim) * muzzle;
  tower.firing = weapon?.interval ?? 0;
  switch (tower.kind) {
    case "machineGun":
    case "sniper":
      game.events.push({
        type: tower.kind === "sniper" ? "sniper" : "mg",
        x: mx,
        y: my,
        tx: target.x,
        ty: target.y,
      });
      damageEnemy(game, target, damage);
      break;
    case "cannon":
      launch(
        game,
        "shell",
        mx,
        my,
        target.x,
        target.y,
        damage,
        (weapon?.splash ?? 1) * TILE,
        false,
        SHELL_SPEED,
      );
      game.events.push({ type: "cannon", x: mx, y: my });
      break;
    case "tesla":
      lightning(game, tower, target, damage, mx, my);
      break;
    case "flamethrower":
      flame(game, tower, damage, reach, centre);
      break;
    default:
      break;
  }
}

/** A lightning that jumps from enemy to enemy. */
function lightning(
  game: Game,
  tower: Structure,
  first: Enemy,
  damage: number,
  x: number,
  y: number,
): void {
  const weapon = STRUCTURES.tesla.weapon;
  const points: number[] = [x, y];
  const hit = new Set<number>();
  let current: Enemy | undefined = first;
  let strength = damage;
  for (
    let jump = 0;
    jump < (weapon?.chain ?? 1) + tower.level - 1 && current !== undefined;
    jump += 1
  ) {
    const victim: Enemy = current;
    hit.add(victim.id);
    points.push(victim.x, victim.y);
    victim.stun = Math.max(victim.stun, weapon?.stun ?? 0);
    damageEnemy(game, victim, strength);
    strength *= CHAIN_FALLOFF;
    let next: Enemy | undefined;
    let nearest = Infinity;
    forEnemiesNear(
      game,
      victim.x,
      victim.y,
      CHAIN_REACH * TILE,
      (enemy, distanceSq) => {
        if (!hit.has(enemy.id) && distanceSq < nearest) {
          nearest = distanceSq;
          next = enemy;
        }
      },
    );
    current = next;
  }
  game.events.push({ type: "chain", points });
}

/** The flamethrower's cone. */
function flame(
  game: Game,
  tower: Structure,
  damage: number,
  reach: number,
  centre: { x: number; y: number },
): void {
  const weapon = STRUCTURES.flamethrower.weapon;
  const cone = weapon?.cone ?? 1;
  forEnemiesNear(game, centre.x, centre.y, reach, (enemy) => {
    const angle = Math.atan2(enemy.y - centre.y, enemy.x - centre.x);
    const off = Math.abs(
      Math.atan2(Math.sin(angle - tower.aim), Math.cos(angle - tower.aim)),
    );
    if (off <= cone) {
      damageEnemy(game, enemy, damage, true);
      enemy.burn = weapon?.burnTime ?? 0;
      enemy.burnDps =
        (weapon?.burnDps ?? 0) * (1 + (tower.level - 1) * BURN_STEP);
    }
  });
  game.events.push({
    type: "flame",
    x: centre.x,
    y: centre.y,
    angle: tower.aim,
    size: reach,
  });
}

/** A minefield goes off when an enemy steps on it. */
function mineCheck(game: Game, field: Structure): void {
  if (field.charges > 0 && field.cooldown <= 0) {
    const centre = centreOf(field);
    let triggered = false;
    forEnemiesNear(game, centre.x, centre.y, TILE * MINE_REACH, (enemy) => {
      triggered = triggered || gapTo(enemy.x, enemy.y, field) <= MINE_MARGIN;
    });
    if (triggered) {
      const stats = weaponStats(game, field);
      const radius = (STRUCTURES.minefield.weapon?.splash ?? 1) * TILE;
      field.charges -= 1;
      field.cooldown = stats.interval;
      hurtEnemiesIn(game, centre.x, centre.y, radius, stats.damage);
      game.events.push({
        type: "mine",
        x: centre.x,
        y: centre.y,
        size: radius,
      });
    }
  }
}

/** Starts a shell. */
function launch(
  game: Game,
  kind: ProjectileKind,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  damage: number,
  splash: number,
  hostile: boolean,
  speed: number,
): void {
  const runtime = runtimeOf(game);
  const shell: Projectile = runtime.projectilePool.pop() ?? ({} as Projectile);
  const length = Math.max(TILE, Math.hypot(toX - fromX, toY - fromY));
  Object.assign(shell, {
    kind,
    x: fromX,
    y: fromY,
    fromX,
    fromY,
    toX,
    toY,
    t: 0,
    rate: speed / length,
    damage,
    splash,
    hostile,
    alive: true,
  });
  game.projectiles.push(shell);
}

/** A shell lands. */
function burst(game: Game, shell: Projectile): void {
  if (shell.hostile) {
    hurtStructuresIn(game, shell.x, shell.y, shell.splash, shell.damage);
    hurtUnitsIn(game, shell.x, shell.y, shell.splash, shell.damage);
  } else {
    hurtEnemiesIn(game, shell.x, shell.y, shell.splash, shell.damage);
  }
  game.events.push({
    type: shell.kind === "shell" ? "explosion" : "bigExplosion",
    x: shell.x,
    y: shell.y,
    size: shell.splash,
  });
}

/** Splash damage on enemies, weaker towards the edge. */
function hurtEnemiesIn(
  game: Game,
  x: number,
  y: number,
  radius: number,
  damage: number,
): void {
  const victims: { enemy: Enemy; share: number }[] = [];
  forEnemiesNear(game, x, y, radius, (enemy, distanceSq) => {
    victims.push({
      enemy,
      share: 1 - (1 - SPLASH_EDGE) * (Math.sqrt(distanceSq) / radius),
    });
  });
  for (const victim of victims) {
    damageEnemy(game, victim.enemy, damage * victim.share);
  }
}

/** Splash damage on structures (minefields are hidden and spared). */
function hurtStructuresIn(
  game: Game,
  x: number,
  y: number,
  radius: number,
  damage: number,
): void {
  const victims = game.structures.filter(
    (structure) =>
      structure.kind !== "minefield" && gapTo(x, y, structure) <= radius,
  );
  for (const structure of victims) {
    damageStructure(game, structure, damage);
  }
}

/** Splash damage on soldiers. */
function hurtUnitsIn(
  game: Game,
  x: number,
  y: number,
  radius: number,
  damage: number,
): void {
  for (const unit of [...game.defenders]) {
    if (Math.hypot(unit.x - x, unit.y - y) <= radius) {
      damageUnit(game, unit, damage);
    }
  }
}

/** Hurts a soldier; at zero he is carried off. */
function damageUnit(game: Game, unit: Defender, amount: number): void {
  unit.hp -= amount;
  unit.hitAgo = 0;
  if (unit.hp <= 0) {
    game.defenders = game.defenders.filter((entry) => entry !== unit);
    game.events.push({ type: "death", x: unit.x, y: unit.y, size: 6 });
  }
}

/** An enemy dies: counted, and maybe some loot on the snow. */
function killEnemy(game: Game, enemy: Enemy, loot: boolean): void {
  const def = ENEMIES[enemy.kind];
  enemy.alive = false;
  game.stats.kills += 1;
  game.events.push({ type: "death", x: enemy.x, y: enemy.y, size: def.radius });
  if (enemy.kind === "boss") {
    game.stats.bosses += 1;
    pushMessage(game, LOG.bossDown, "good");
  }
  if (loot && nextRandom(game) < def.lootChance) {
    const growth = 1 + LOOT_GROWTH * game.wave.number;
    const gain: Partial<Record<ResourceId, number>> = {};
    for (const [id, amount] of Object.entries(def.loot)) {
      gain[id as ResourceId] = Math.round((amount ?? 0) * growth);
    }
    game.drops.push({
      id: game.nextId,
      x: enemy.x,
      y: enemy.y,
      loot: gain,
      age: 0,
      crate: false,
    });
    game.nextId += 1;
  }
}

/** A barracks trains soldiers up to its number. */
function train(game: Game, barracks: Structure, dt: number): void {
  const own = game.defenders.filter((unit) => unit.home === barracks.id).length;
  const wanted = BARRACKS_SOLDIERS + barracks.level - 1;
  if (own < wanted) {
    const centre = centreOf(barracks);
    const helped = nearInfirmary(game, centre.x, centre.y);
    barracks.cooldown -= dt * (helped ? INFIRMARY_TRAINING : 1);
    if (barracks.cooldown <= 0 && canAfford(game.res, SOLDIER_COST)) {
      pay(game.res, SOLDIER_COST);
      barracks.cooldown = SOLDIER_TRAIN_TIME;
      game.defenders.push({
        id: game.nextId,
        home: barracks.id,
        x: centre.x,
        y: centre.y + TILE,
        hp: soldierHp(barracks),
        cooldown: 0,
        target: 0,
        angle: 0,
        stride: 0,
        hitAgo: 99,
      });
      game.nextId += 1;
    }
  }
}

/** Allies one call brings, and the most there may be at once. */
const ALLY_GROUP = 5;
export const ALLY_LIMIT = 60;

/** How far allies range from the headquarters they guard, tiles. */
const ALLY_AURA = 10;

/**
 * Calls allied soldiers to the headquarters - free, up to a limit. They guard
 * it like a barracks' soldiers guard theirs.
 *
 * @param game - the game, changed
 * @returns how many came
 */
export function summonAllies(game: Game): number {
  const hq = game.structures.find((entry) => entry.kind === "hq");
  let added = 0;
  if (hq !== undefined && !game.over) {
    const centre = centreOf(hq);
    const own = game.defenders.filter((unit) => unit.home === hq.id).length;
    const count = Math.max(0, Math.min(ALLY_GROUP, ALLY_LIMIT - own));
    for (let index = 0; index < count; index += 1) {
      game.defenders.push({
        id: game.nextId,
        home: hq.id,
        x: centre.x + randomRange(game, -TILE, TILE),
        y: centre.y + TILE * 2 + randomRange(game, -TILE, TILE),
        hp: soldierHp(hq),
        cooldown: 0,
        target: 0,
        angle: 0,
        stride: 0,
        hitAgo: 99,
      });
      game.nextId += 1;
    }
    added = count;
    if (added > 0) {
      pushMessage(game, LOG.allies(added), "good");
    }
  }
  return added;
}

/**
 * Full hit points of a barracks' soldiers.
 *
 * @param barracks - their barracks
 * @returns the maximum
 */
export function soldierHp(barracks: Structure): number {
  return SOLDIER.hp * (1 + SOLDIER_HP_STEP * (barracks.level - 1));
}

/** Whether a finished infirmary reaches a point. */
function nearInfirmary(
  game: Game,
  x: number,
  y: number,
): Structure | undefined {
  return game.structures.find((structure) => {
    const centre = centreOf(structure);
    return (
      structure.kind === "infirmary" &&
      structure.built &&
      Math.hypot(centre.x - x, centre.y - y) <=
        (STRUCTURES.infirmary.aura ?? 0) * TILE
    );
  });
}

/** A soldier's moment: heal, find an enemy near home, shoot or walk. */
function guard(game: Game, unit: Defender, home: Structure, dt: number): void {
  const runtime = runtimeOf(game);
  const centre = centreOf(home);
  const aura =
    (home.kind === "hq" ? ALLY_AURA : (STRUCTURES.barracks.aura ?? 0)) * TILE;
  unit.cooldown -= dt;
  unit.hitAgo += dt;
  const infirmary = nearInfirmary(game, unit.x, unit.y);
  if (infirmary !== undefined) {
    unit.hp = Math.min(
      soldierHp(home),
      unit.hp + INFIRMARY_HEAL * infirmary.level * dt,
    );
  }
  let target =
    unit.target === 0 ? undefined : runtime.enemyById.get(unit.target);
  const tooFar =
    target !== undefined &&
    Math.hypot(target.x - centre.x, target.y - centre.y) >
      aura + CHASE_EXTRA * TILE;
  if (target === undefined || !target.alive || tooFar) {
    target = undefined;
    let nearest = Infinity;
    forEnemiesNear(game, centre.x, centre.y, aura, (enemy) => {
      const gap = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
      if (gap < nearest) {
        nearest = gap;
        target = enemy;
      }
    });
    unit.target = (target as Enemy | undefined)?.id ?? 0;
  }
  const reach = SOLDIER.range * TILE;
  let goalX: number;
  let goalY: number;
  if (target !== undefined) {
    goalX = target.x;
    goalY = target.y;
    unit.angle = Math.atan2(goalY - unit.y, goalX - unit.x);
  } else {
    const slot = game.defenders
      .filter((entry) => entry.home === home.id)
      .indexOf(unit);
    const angle = slot * POST_SPREAD;
    goalX = centre.x + Math.cos(angle) * POST_RADIUS * TILE;
    goalY = centre.y + Math.sin(angle) * POST_RADIUS * TILE;
  }
  const gap = Math.hypot(goalX - unit.x, goalY - unit.y);
  if (target !== undefined && gap <= reach) {
    if (unit.cooldown <= 0) {
      unit.cooldown = SOLDIER.interval;
      game.events.push({
        type: "defenderShot",
        x: unit.x,
        y: unit.y,
        tx: target.x,
        ty: target.y,
      });
      damageEnemy(
        game,
        target,
        SOLDIER.damage * (1 + SOLDIER_DAMAGE_STEP * (home.level - 1)),
      );
    }
  } else if (gap > 2) {
    const move = Math.min(gap, SOLDIER.speed * TILE * dt);
    unit.x += ((goalX - unit.x) / gap) * move;
    unit.y += ((goalY - unit.y) / gap) * move;
    unit.angle = Math.atan2(goalY - unit.y, goalX - unit.x);
    unit.stride += move * STRIDE;
  }
}

/**
 * The name of an enemy kind, for messages elsewhere.
 *
 * @param kind - the kind
 * @returns its German name
 */
export function enemyName(kind: EnemyKind): string {
  return ENEMY_NAMES[kind];
}
