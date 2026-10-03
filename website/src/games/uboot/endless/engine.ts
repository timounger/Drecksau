/**
 * Ein Bild im Endlosmodus: schwimmen, schießen, einsammeln, tiefer kommen.
 *
 * @module
 * @remarks
 * **Kein Fenster, keine Ziellinie.** In der Kampagne schiebt ein Fenster das
 * Boot vor sich her und am Ende steht ein Tor; hier gibt es nur eine große
 * Karte, Gegner darauf und die Frage, wie weit man kommt. Eine Stufe ist
 * geschafft, wenn nichts mehr lebt - dann kommt die nächste, mit mehr und
 * zäheren Bewohnern.
 *
 * **Das Boot ist von Anfang an das beste, das es gibt.** Wer hier herkommt,
 * will nicht sparen, sondern wissen, wie lange er durchhält, und ein
 * Endlosmodus, in dem man erst eine Kampagne durchspielen muss, wäre kein
 * Endlosmodus, sondern ein Nachtisch.
 *
 * Der Schritt ist rein: Zustand rein, Zustand raus. Deshalb kann der Host ihn
 * für beide Boote rechnen und das Ergebnis verschicken, und deshalb sieht der
 * Gast genau das, was der Host sieht.
 */
import { bitten, mauled, swum } from "@/games/uboot/engine/beasts";
import {
  CELL,
  SUB_DISC,
  SUB_DISCS,
  SUB_HIGH,
  SUB_LONG,
  type Beast,
  type Vec,
} from "@/games/uboot/engine/types";
import {
  UPGRADES,
  gearFrom,
  type Gear,
  type WeaponKind,
} from "@/games/uboot/engine/upgrades";
import {
  DEEP_H,
  DEEP_W,
  DIVER_IDS,
  WATER_LINE,
  type DeepBlast,
  type DeepInput,
  type DeepShot,
  type DeepState,
  type Diver,
  type DiverId,
  type Drop,
  type DropKind,
} from "@/games/uboot/endless/types";
import {
  buildDeep,
  createDice,
  populate,
  solidAt,
  type DeepWorld,
} from "@/games/uboot/endless/world";

/**
 * Das Boot, mit dem hier gefahren wird: jede Bahn auf ihrer höchsten Stufe.
 *
 * @remarks
 * Aus der Tabelle gerechnet und nicht hingeschrieben - eine siebte Bahn fährt
 * hier von allein mit.
 */
export const DEEP_GEAR: Gear = gearFrom(
  Object.fromEntries(
    UPGRADES.map((track) => [track.id, track.steps.length]),
  ) as Parameters<typeof gearFrom>[0],
);

/** Wie sich das Boot bewegt. */
const SWIM = {
  /** Wie hart die Schraube zieht und wie schnell es damit höchstens wird. */
  thrust: 460,
  most: 210,
  /** Dasselbe für auf und ab. */
  lift: 420,
  mostUp: 180,
  /** Was das Wasser je Sekunde davon zurückholt. */
  drag: 2.8,
  /** Wie weit es aus dem Wasser schauen darf, in Pixeln. */
  poke: 14,
  /** Wie weit es von den Kanten der Karte wegbleibt. */
  edge: 18,
} as const;

/** Die Zahlen der Anzeige: Schub und Schraube. */
const SCREW = { time: 1, idle: 1.6, driven: 5 } as const;

/** Das längste Bild, das noch zählt, in Sekunden. */
const MAX_FRAME = 0.05;

/** Wie lange ein Treffer nachleuchtet - solange ist man unberührbar. */
const HURT_TIME = 1.3;

/** Wie weit ein Treffer zurückstößt, in Pixeln. */
const SHOVE = 26;

/** Wie lange ein Knall zu sehen ist, in Sekunden. */
const BLAST_LIFE = 0.55;

/** Luft: wie weit unter der Oberfläche sie noch nachläuft und wie schnell. */
const AIR = { reach: 40, refill: 7 } as const;

/** Was die Waffen können - dieselben Zahlen wie in der Kampagne. */
const ARMS: Readonly<
  Record<
    WeaponKind,
    {
      readonly speed: number;
      readonly reload: number;
      readonly life: number;
      readonly reach: number;
    }
  >
> = {
  harpoon: { speed: 620, reload: 0.42, life: 1.1, reach: 0 },
  torpedo: { speed: 520, reload: 0.62, life: 1.5, reach: 54 },
  mine: { speed: 0, reload: 1.6, life: 2.4, reach: 66 },
};

/** Was die Gegenstände bewirken und wie lange. */
const BOON = {
  /** Wie lange der Schild hält, das schnelle Nachladen und der Fächer. */
  shield: 8,
  rapid: 9,
  scatter: 9,
  /** Um wie viel schneller nachgeladen wird, solange es läuft. */
  rapidFactor: 2.4,
  /** Wie weit der Fächer aufgeht, in Bogenmaß, und aus wie vielen Schüssen. */
  spread: 0.26,
  fan: 3,
  /** Mit wie viel Hülle und wie viel Schild ein Geretteter wieder steht. */
  revived: 2,
  reviveShield: 4,
  /** Wie oft ein toter Gegner etwas fallen lässt, und wie lange es liegt. */
  chance: 0.22,
  life: 14,
  /** Und ab welcher Entfernung man es aufsammelt, in Pixeln. */
  grab: 26,
} as const;

/** Was allein fallen kann - und was zusätzlich, wenn jemand unten liegt. */
const SOLO_DROPS: readonly DropKind[] = ["shield", "rapid", "scatter"];
const COOP_DROPS: readonly DropKind[] = [...SOLO_DROPS, "revive"];

/** Wie lange die Pause zwischen zwei Stufen dauert, in Sekunden. */
export const STAGE_PAUSE = 2.6;

/**
 * Wie weit der Knall einer Waffe reicht.
 *
 * @param kind - die Waffe
 * @returns die Reichweite in Pixeln, oder null für eine ohne Knall
 */
export function deepReach(kind: WeaponKind): number {
  return ARMS[kind].reach;
}

/**
 * Ein frischer Lauf, auf der ersten Stufe.
 *
 * @param seed - die Saat, aus der alle Karten dieses Laufs wachsen
 * @param players - wie viele Boote mitfahren, eins oder zwei
 * @returns der Zustand vor dem ersten Zug
 */
export function startDeep(seed: number, players = 1): DeepState {
  const world = buildDeep(1, seed);
  const crew = DIVER_IDS.slice(0, Math.max(1, Math.min(2, players))).map(
    (id, at) => fresh(id, world.start, at),
  );
  return {
    stage: 1,
    seed,
    phase: "waiting",
    divers: crew,
    beasts: populate(world, 1),
    shots: [],
    blasts: [],
    drops: [],
    gone: [],
    kills: 0,
    time: 0,
    since: 0,
    nextId: 1,
  };
}

/**
 * Der Zustand auf der nächsten Stufe.
 *
 * @param state - der Lauf, wie er steht
 * @param world - die Karte der **neuen** Stufe
 * @returns der Zustand, mit allen Booten wieder auf den Beinen
 * @remarks
 * **Wer gestorben ist, ist wieder dabei.** Das ist die ganze Regel des Koop:
 * Ein Fehler kostet die Stufe, nicht den Abend. Vorbei ist es erst, wenn in
 * derselben Stufe beide untergehen - und das steht in {@link stepDeep}.
 */
export function advanceDeep(state: DeepState, world: DeepWorld): DeepState {
  return {
    ...state,
    stage: world.stage,
    phase: "waiting",
    divers: state.divers.map((one, at) => fresh(one.id, world.start, at)),
    beasts: populate(world, world.stage),
    shots: [],
    blasts: [],
    drops: [],
    gone: [],
    since: 0,
  };
}

/**
 * Bringt einen Lauf um ein Bild weiter.
 *
 * @param state - die Welt, wie sie steht
 * @param world - die Karte der jetzigen Stufe
 * @param inputs - was jedes Boot gerade will, nach seinem Platz
 * @param dt - wie lange das Bild gedauert hat, in Sekunden
 * @returns die nächste Welt
 */
export function stepDeep(
  state: DeepState,
  world: DeepWorld,
  inputs: Readonly<Partial<Record<DiverId, DeepInput>>>,
  dt: number,
): DeepState {
  const slice = Math.min(dt, MAX_FRAME);
  let result = state;

  if (state.phase === "waiting") {
    // **Losgefahren wird losgefahren.** Wer sich bewegt, hat angefangen.
    const off = state.divers.some((one) => moving(inputs[one.id]));
    result = off
      ? { ...state, phase: "diving", since: 0 }
      : { ...state, since: state.since + slice };
  } else if (state.phase === "diving") {
    result = dive(state, world, inputs, slice);
  } else {
    result = { ...state, since: state.since + slice };
  }

  return result;
}

/** Ein Bild, während wirklich getaucht wird. */
function dive(
  state: DeepState,
  world: DeepWorld,
  inputs: Readonly<Partial<Record<DiverId, DeepInput>>>,
  slice: number,
): DeepState {
  const time = state.time + slice;
  const gone = new Set(state.gone);
  const shots: DeepShot[] = [];
  const blasts: DeepBlast[] = [];
  let nextId = state.nextId;

  // Erst die Boote: schwimmen, laden, schießen.
  const steered = state.divers.map((one) => {
    const want = inputs[one.id] ?? null;
    const held = one.down ? one : swim(one, want, world, gone, slice);
    const armed = one.down
      ? { diver: held, made: [] as DeepShot[], id: nextId }
      : armoury(held, want, time, nextId);
    nextId = armed.id;
    shots.push(...armed.made);
    return armed.diver;
  });

  // Dann, was schon unterwegs ist.
  const flying = fly([...state.shots, ...shots], world, gone, slice);
  blasts.push(...flying.blasts);

  // Was die Schüsse von den Bewohnern übrig lassen.
  const prey = mauled(state.beasts, flying.shots, flying.blasts, deepReach);
  const alive = state.divers.filter((one) => !one.down);
  const chased = alive.length === 0 ? steered[0] : nearestTo(alive);
  const swarm = prey.beasts.map((one) =>
    swum(one, chased === undefined ? world.start : chased, slice),
  );

  // Wer getroffen hat, bekommt es gutgeschrieben; wer gestorben ist, lässt
  // vielleicht etwas da.
  const dice = createDice(Math.floor(time * CELL) + state.nextId);
  const down = steered.some((one) => one.down);
  const made: Drop[] = [];
  for (const at of prey.dead) {
    if (dice() < BOON.chance) {
      const kinds = down ? COOP_DROPS : SOLO_DROPS;
      const kind = kinds[Math.floor(dice() * kinds.length)] ?? "shield";
      made.push({ id: nextId, kind, x: at.x, y: at.y, age: 0 });
      nextId += 1;
    }
  }

  // Und was die Bewohner von den Booten übrig lassen.
  const bruised = steered.map((one) =>
    one.down ? one : damaged(one, swarm, time),
  );
  const picked = gather(bruised, [...state.drops, ...made], time, slice);

  const beasts = swarm;
  const divers = picked.divers;
  const allDown = divers.every((one) => one.down);
  const phase = allDown ? "over" : beasts.length === 0 ? "cleared" : "diving";

  return {
    ...state,
    phase,
    kills: state.kills + prey.dead.length,
    time,
    since: phase === "diving" ? state.since + slice : 0,
    divers,
    beasts,
    shots: flying.shots,
    blasts: [
      ...smoke([...state.blasts, ...blasts], slice),
      ...prey.dead.map((at) => bang(at, 0)),
      ...prey.pops.map((one) => bang(one.at, one.reach)),
      ...bruised
        .filter((one, at) => one.down && !state.divers[at]?.down)
        .map((one) => bang(one, SUB_LONG)),
    ],
    drops: picked.drops,
    gone: [...gone],
    nextId,
  };
}

/** Ein Boot, wie es anfängt. */
function fresh(id: DiverId, start: Vec, at: number): Diver {
  return {
    id,
    // Das zweite Boot liegt eine Bootslänge neben dem ersten.
    x: start.x + at * SUB_LONG,
    y: start.y + WATER_LINE - SWIM.poke,
    vx: 0,
    vy: 0,
    facing: 1,
    hull: DEEP_GEAR.hull,
    air: DEEP_GEAR.air,
    hurt: 0,
    wash: 0,
    spin: 0,
    loaded: 0,
    laid: 0,
    down: false,
    shieldUntil: 0,
    rapidUntil: 0,
    scatterUntil: 0,
  };
}

/** Ob dieses Boot gerade eine Fahrtaste hält. */
function moving(input: DeepInput | undefined): boolean {
  return (
    input !== undefined &&
    (input.forward || input.back || input.up || input.down)
  );
}

/**
 * Das Boot, einen Augenblick später.
 *
 * @remarks
 * **Links ist hier kein Rückwärtsgang.** In der Kampagne ist zurück eine
 * Bremse gegen das Fenster; hier gibt es kein Fenster, also ist links eine
 * Richtung wie jede andere - das Boot dreht sich um und fährt dorthin. Was es
 * dabei trifft, klärt {@link damaged}.
 */
function swim(
  diver: Diver,
  input: DeepInput | null,
  world: DeepWorld,
  gone: ReadonlySet<number>,
  dt: number,
): Diver {
  const wantX =
    (input?.forward === true ? 1 : 0) - (input?.back === true ? 1 : 0);
  const wantY = (input?.down === true ? 1 : 0) - (input?.up === true ? 1 : 0);
  const vx = paced(
    diver.vx + wantX * SWIM.thrust * DEEP_GEAR.push * dt,
    SWIM.most * DEEP_GEAR.push,
    dt,
  );
  const vy = paced(
    diver.vy + wantY * SWIM.lift * DEEP_GEAR.dive * dt,
    SWIM.mostUp * DEEP_GEAR.dive,
    dt,
  );
  const wash = Math.max(
    0,
    Math.min(
      1,
      diver.wash + (wantX !== 0 || wantY !== 0 ? dt : -dt) / SCREW.time,
    ),
  );
  const at = inside(diver.x + vx * dt, diver.y + vy * dt);
  // Fels stoppt, er schiebt nicht: Wer hineinfährt, bleibt davor stehen - was
  // es kostet, rechnet erst der Schaden.
  const free = clear(at.x, at.y, world, gone);
  const slidX = clear(at.x, diver.y, world, gone);
  const slidY = clear(diver.x, at.y, world, gone);
  const x = free || slidX ? at.x : diver.x;
  const y = free || slidY ? at.y : diver.y;
  const air = breathe(diver.air, y, dt);

  return {
    ...diver,
    x,
    y,
    vx: free || slidX ? vx : 0,
    vy: free || slidY ? vy : 0,
    facing: wantX !== 0 ? wantX : diver.facing,
    wash,
    spin: diver.spin + (SCREW.idle + SCREW.driven * wash) * dt,
    air,
    loaded: Math.max(0, diver.loaded - dt),
    laid: Math.max(0, diver.laid - dt),
    hurt: Math.max(0, diver.hurt - dt),
    down: air <= 0 ? true : diver.down,
  };
}

/** Eine Achse, nachdem das Wasser seinen Teil hatte. */
function paced(speed: number, most: number, dt: number): number {
  const slowed = speed - speed * SWIM.drag * dt;
  return Math.max(-most, Math.min(most, slowed));
}

/** Das Boot, in der Karte gehalten. */
function inside(x: number, y: number): Vec {
  return {
    x: Math.max(SWIM.edge, Math.min(DEEP_W - SWIM.edge, x)),
    y: Math.max(WATER_LINE - SWIM.poke, Math.min(DEEP_H - SWIM.edge, y)),
  };
}

/** Ob an dieser Stelle Platz für den Rumpf ist. */
function clear(
  x: number,
  y: number,
  world: DeepWorld,
  gone: ReadonlySet<number>,
): boolean {
  let room = true;
  for (const along of SUB_DISCS) {
    if (
      solidAt(world, gone, x + along, y) ||
      solidAt(world, gone, x + along, y - SUB_HIGH / 2) ||
      solidAt(world, gone, x + along, y + SUB_HIGH / 2)
    ) {
      room = false;
    }
  }
  return room;
}

/** Die Luft, wie sie steht: an der Oberfläche läuft sie nach. */
function breathe(air: number, y: number, dt: number): number {
  const gulping = y <= WATER_LINE + AIR.reach;
  const next = gulping ? air + AIR.refill * dt : air - dt;
  return Math.max(0, Math.min(DEEP_GEAR.air, next));
}

/** Was dieses Boot in diesem Bild abfeuert. */
function armoury(
  diver: Diver,
  input: DeepInput | null,
  time: number,
  nextId: number,
): { readonly diver: Diver; readonly made: DeepShot[]; readonly id: number } {
  const made: DeepShot[] = [];
  let id = nextId;
  let loaded = diver.loaded;
  let laid = diver.laid;

  if (input?.fire === true && diver.loaded <= 0 && DEEP_GEAR.gun !== null) {
    const arm = ARMS[DEEP_GEAR.gun];
    const rapid = time < diver.rapidUntil;
    for (const turn of angles(diver, input, time)) {
      made.push({
        id,
        kind: DEEP_GEAR.gun,
        x: diver.x + Math.cos(turn) * (SUB_LONG / 2),
        y: diver.y + Math.sin(turn) * (SUB_LONG / 2),
        vx: Math.cos(turn) * arm.speed,
        vy: Math.sin(turn) * arm.speed,
        age: 0,
        ownerId: diver.id,
      });
      id += 1;
    }
    loaded = rapid ? arm.reload / BOON.rapidFactor : arm.reload;
  }

  if (input?.drop === true && diver.laid <= 0 && DEEP_GEAR.mines) {
    made.push({
      id,
      kind: "mine",
      x: diver.x - diver.facing * (SUB_LONG / 2),
      y: diver.y,
      vx: 0,
      vy: 0,
      age: 0,
      ownerId: diver.id,
    });
    id += 1;
    laid = ARMS.mine.reload;
  }

  return { diver: { ...diver, loaded, laid }, made, id };
}

/**
 * Die Winkel, unter denen ein Schuss das Rohr verlässt.
 *
 * @remarks
 * Einer - oder drei, solange der Fächer läuft. Der Fächer zählt dabei als
 * **ein** Schuss, sonst wäre der Gegenstand nicht ein besserer Schuss, sondern
 * ein dreifach schnelleres Nachladen.
 */
function angles(
  diver: Diver,
  input: DeepInput,
  time: number,
): readonly number[] {
  const aim = input.aim;
  const straight =
    aim === null
      ? diver.facing < 0
        ? Math.PI
        : 0
      : Math.atan2(aim.y - diver.y, aim.x - diver.x);
  const fanning = time < diver.scatterUntil;
  const turns: number[] = [];

  if (fanning) {
    for (let shot = 0; shot < BOON.fan; shot += 1) {
      turns.push(straight + (shot - (BOON.fan - 1) / 2) * BOON.spread);
    }
  } else {
    turns.push(straight);
  }

  return turns;
}

/** Was in der Luft ist, einen Augenblick später. */
function fly(
  shots: readonly DeepShot[],
  world: DeepWorld,
  gone: Set<number>,
  dt: number,
): {
  readonly shots: readonly DeepShot[];
  readonly blasts: readonly DeepBlast[];
} {
  const left: DeepShot[] = [];
  const blasts: DeepBlast[] = [];

  for (const shot of shots) {
    const arm = ARMS[shot.kind];
    const moved = {
      ...shot,
      x: shot.x + shot.vx * dt,
      y: shot.y + shot.vy * dt,
      age: shot.age + dt,
    };
    const stuck = solidAt(world, gone, moved.x, moved.y);
    const old = moved.age >= arm.life;
    if (stuck && arm.reach > 0) {
      // Ein Torpedo macht eine Tür in den Fels - das ist hier unten der
      // einzige Weg durch eine Wand.
      gone.add(
        Math.floor(moved.y / CELL) * world.cols + Math.floor(moved.x / CELL),
      );
    }
    if (stuck || old) {
      if (arm.reach > 0) {
        blasts.push({ x: moved.x, y: moved.y, reach: arm.reach, age: 0 });
      }
    } else {
      left.push(moved);
    }
  }

  return { shots: left, blasts };
}

/**
 * Was ein Boot in diesem Bild einstecken muss.
 *
 * @remarks
 * **Fels hält auf, er tut nicht weh.** In der Kampagne ist eine Wand tödlich,
 * weil das Fenster einen hineindrückt; hier fährt man ganze Stufen an Wänden
 * entlang, und ein Treffer für jedes Streifen wäre kein Hindernis, sondern
 * eine Strafe fürs Umschauen. Wehtun können die Bewohner - und die sind der
 * Grund, warum man hier unten ist.
 */
function damaged(diver: Diver, beasts: readonly Beast[], time: number): Diver {
  const safe = diver.hurt > 0 || time < diver.shieldUntil;
  const hit = safe ? null : bitten(beasts, diver, SUB_DISCS, SUB_DISC);
  const hull = hit === null ? diver.hull : diver.hull - 1;

  return {
    ...diver,
    hull,
    hurt: hit === null ? diver.hurt : HURT_TIME,
    x: hit === null ? diver.x : diver.x + Math.sign(diver.x - hit.x) * SHOVE,
    y: hit === null ? diver.y : diver.y + Math.sign(diver.y - hit.y) * SHOVE,
    vx: hit === null ? diver.vx : 0,
    vy: hit === null ? diver.vy : 0,
    down: hull <= 0 ? true : diver.down,
  };
}

/** Wer was eingesammelt hat - und was liegen bleibt. */
function gather(
  divers: readonly Diver[],
  drops: readonly Drop[],
  time: number,
  dt: number,
): { readonly divers: readonly Diver[]; readonly drops: readonly Drop[] } {
  let crew = divers;
  const left: Drop[] = [];

  for (const drop of drops) {
    const aged = { ...drop, age: drop.age + dt };
    const taker = crew.find(
      (one) =>
        !one.down && Math.hypot(one.x - aged.x, one.y - aged.y) < BOON.grab,
    );
    if (taker !== undefined) {
      crew = applied(crew, taker.id, aged.kind, time);
    } else if (aged.age < BOON.life) {
      left.push(aged);
    }
  }

  return { divers: crew, drops: left };
}

/**
 * Die Mannschaft, nachdem jemand etwas aufgehoben hat.
 *
 * @remarks
 * Drei der vier wirken auf den, der sie nimmt. Der vierte wirkt auf den
 * anderen: Er holt den zurück, der unten liegt, und deshalb fällt er auch nur,
 * solange dort wirklich jemand liegt.
 */
function applied(
  divers: readonly Diver[],
  taker: DiverId,
  kind: DropKind,
  time: number,
): readonly Diver[] {
  return divers.map((one) => {
    let next = one;
    if (kind === "revive" && one.down) {
      next = {
        ...one,
        down: false,
        hull: BOON.revived,
        air: DEEP_GEAR.air,
        shieldUntil: time + BOON.reviveShield,
      };
    } else if (one.id === taker && kind === "shield") {
      next = { ...one, shieldUntil: time + BOON.shield };
    } else if (one.id === taker && kind === "rapid") {
      next = { ...one, rapidUntil: time + BOON.rapid };
    } else if (one.id === taker && kind === "scatter") {
      next = { ...one, scatterUntil: time + BOON.scatter };
    }
    return next;
  });
}

/** Das Boot, dem die Bewohner nachschwimmen: das erste, das noch fährt. */
function nearestTo(divers: readonly Diver[]): Diver | undefined {
  return divers[0];
}

/** Ein Knall an einer Stelle. */
function bang(at: Vec, reach: number): DeepBlast {
  return { x: at.x, y: at.y, reach, age: 0 };
}

/** Die Knalle, einen Augenblick später - verbrauchte fallen weg. */
function smoke(blasts: readonly DeepBlast[], dt: number): readonly DeepBlast[] {
  return blasts
    .map((one) => ({ ...one, age: one.age + dt }))
    .filter((one) => one.age < BLAST_LIFE);
}

/**
 * Ob ein Lauf noch läuft.
 *
 * @param state - die Welt
 * @returns true, solange noch jemand fährt
 */
export function deepRunning(state: DeepState): boolean {
  return state.phase === "waiting" || state.phase === "diving";
}

/**
 * Wie tief das Boot steht, von null an der Oberfläche bis eins ganz unten.
 *
 * @param y - die Tiefe in Weltpixeln
 * @returns der Anteil der Tiefe
 */
export function depthShare(y: number): number {
  return Math.max(0, Math.min(1, (y - WATER_LINE) / (DEEP_H - WATER_LINE)));
}
