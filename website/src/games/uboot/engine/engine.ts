/**
 * One frame of a dive: thrust, air, the window, the guns and what the hull
 * touches.
 *
 * @module
 * @remarks
 * A pure step - the same world, the same keys and the same slice of time
 * always give the same next world. Nothing here draws, reads the clock or
 * knows that a browser exists.
 *
 * **The window is the game.** It moves right at its own steady pace and the
 * boat may go where it likes inside it; what it may not do is fall out of the
 * back, so the water itself pushes anybody who tries. That turns a course into
 * a thing with a rhythm: you buy room by going faster than the window and you
 * spend it standing still in front of something you have to look at first.
 *
 * **What the upgrades change, they change here and nowhere else.** The engine
 * is handed a {@link Gear} - air, hull, gun, lamp, dive planes - and knows
 * nothing about experience points or what anything cost.
 */
import { cellAt, type Course } from "./course";
import {
  CELL,
  MINE_R,
  ROWS,
  isDecor,
  SUB_DISC,
  SUB_DISCS,
  SUB_HIGH,
  VIEW_W,
  type Blast,
  type Boss,
  type GameState,
  type Ink,
  type Input,
  type Shot,
  type Vec,
} from "./types";
import type { Gear, WeaponKind } from "./upgrades";
import { bitten, mauled, swum } from "./beasts";

/** How fast the window moves right, in pixels a second. */
const WINDOW_SPEED = 84;

/** How hard the propeller pushes, in pixels a second per second. */
const THRUST = 410;

/**
 * And the dive planes, the same way, before any upgrade.
 *
 * @remarks
 * A shade less than the propeller: a boat that climbs as readily as it swims
 * is a helicopter, and dodging downwards would stop being a decision.
 */
const LIFT = 300;

/**
 * How fast it can go relative to the water, ahead or back.
 *
 * @remarks
 * Deutlich schneller als das Fenster, und zwar schon ohne einen einzigen
 * gekauften Propeller: Ein Boot, das sich vom Rand nur mühsam löst, fühlt sich
 * nicht nach Tauchen an, sondern nach Gegenwind. Jede Stufe Antrieb hebt das
 * hier weiter an - der Grundwert ist der Boden, nicht die Decke.
 */
const MAX_VX = 170;

/** And up or down, before any upgrade. */
const MAX_VY = 150;

/**
 * How quickly the water takes the speed back out, per second.
 *
 * @remarks
 * This is the whole feel of the boat. Too little and it skates about like an
 * air hockey puck; too much and the keys may as well move it directly, which
 * is a boat with no weight at all. At this value letting go coasts about a
 * hull length - enough that lining up a gap is a thing you do early.
 */
const DRAG = 2.8;

/**
 * How much of the propeller's push is left when it turns the other way.
 *
 * @remarks
 * Three fifths, ahead of everything the workshop can sell: every step of the
 * engine makes both directions faster, and forwards stays the faster of the
 * two whatever is bought. Reverse is a brake and a second look, never a way of
 * beating the window.
 */
const ASTERN = 0.6;

/**
 * Wie lange der Schub braucht, um ganz zu stehen - und wieder zu fallen.
 *
 * @remarks
 * Eine Sekunde in beide Richtungen. Das ist die ganze Trägheit des Antriebs,
 * die man **sieht**: Die Schraube zieht an, der Wirbel wächst, und beim
 * Loslassen läuft beides aus. Mit der Trägheit des Bootes selbst
 * ({@link DRAG}) hat das nichts zu tun - die ist Physik, das hier ist das
 * Bild davon.
 */
const WASH_TIME = 1;

/** Wie schnell die Schraube im Leerlauf dreht, in Umdrehungen je Sekunde. */
const SCREW_IDLE = 1.6;

/** Und wie viel schneller bei vollem Schub. */
const SCREW_DRIVEN = 5;

/** Ab wo vorn das Fenster zulegt, und wie sehr. */
const CHASE = {
  /** Anteil der Fensterbreite, ab dem es schneller wird. */
  from: 0.55,
  /**
   * Und das Vielfache des Grundtempos am vorderen Rand.
   *
   * @remarks
   * Dreifach, also deutlich schneller als das Boot selbst je fährt. Das ist
   * Absicht: Wer sich ganz nach vorn schiebt, wird zügig wieder eingeholt und
   * steht dann in der Mitte, wo das Fenster wieder gemächlich läuft. Ein
   * Gummiband, kein Wettrennen - und der vordere Rand ist damit ein Ort, an
   * dem man kurz ist und nicht einer, an dem man wohnt.
   */
  most: 3,
} as const;

/** How near the edges of the window the boat may get, in pixels. */
const EDGE = 52;

/**
 * The longest frame that still counts, in seconds.
 *
 * @remarks
 * A tab that was in the background comes back with one enormous frame. Without
 * this the boat would be teleported through half the course and into whatever
 * was in it.
 */
const MAX_FRAME = 0.05;

/**
 * How long the hull is untouchable after a hit, in seconds.
 *
 * @remarks
 * Armour has to be armour and not a shorter fuse: without this, one rock takes
 * every hit a player owns in the third of a second it takes to get off it.
 */
const HURT_TIME = 1.3;

/** How far a hit knocks the boat back off what it hit, in pixels. */
const SHOVE = 26;

/** How long a bang is worth looking at, in seconds. */
const BLAST_LIFE = 0.55;

/** Wie die Oberfläche Luft gibt, wo sie das tut. */
const AIR = {
  /** Wie weit unter der Oberfläche das noch zählt, in Pixeln. */
  reach: 34,
  /** Und wie viele Sekunden Luft eine Sekunde Auftauchen bringt. */
  refill: 22,
} as const;

/** Wie weit vor dem Ziel die Arena anfängt, in Pixeln. */
const ARENA = 760;

/** Der Wächter in Zahlen. */
const GUARD = {
  /** Wie viel er aushält, in Harpunentreffern. */
  hull: 18,
  /** Wie groß er ist, und wie weit vor dem Ziel er wartet. */
  reach: 46,
  /** Und ab wo das Hineinfahren wehtut. */
  grip: 62,
  from: 150,
  /** Wie schnell er auf und ab zieht, in Pixeln je Sekunde. */
  swim: 66,
  /** Wie lange er zwischen zwei Würfen braucht, in Sekunden. */
  reload: 1.4,
  /** Wie schnell und wie groß das Geworfene ist, und wie lange es fliegt. */
  ink: 195,
  /** Wie viele Strahlen ein Wurf hat, und wie weit sie auseinandergehen. */
  fan: 3,
  spread: 0.3,
  /** Und wie viel schneller er wirft, sobald die Hälfte von ihm ab ist. */
  frenzy: 0.6,
  inkR: 10,
  inkLife: 6,
  /** Was eine Explosion in seiner Nähe abbeißt. */
  singed: 2,
  /** Wie lange er von einem Treffer aufleuchtet, und wie es aussieht. */
  hurt: 0.18,
  splash: 26,
} as const;

/** Was eine Waffe von ihm abbeißt. */
const BITE: Readonly<Record<WeaponKind, number>> = {
  harpoon: 1,
  torpedo: 3,
  mine: 3,
};

/** Wie weit vor dem Boot ein Schuss entsteht, in Pixeln. */
const MUZZLE = 40;

/** Wie groß die Wolke ist, die ein zerschossenes Tier hinterlässt. */
const SHRED = 22;

/** Wie weit der Knall einer Waffe reicht, oder null, wenn sie nur sticht. */
function reachOf(kind: WeaponKind): number {
  return ARMS[kind].reach;
}

/** Und was diese Knalle aus dem Fels geräumt haben. */
function swept(
  gone: ReadonlySet<number>,
  course: Course,
  pops: readonly { readonly at: Vec; readonly reach: number }[],
): ReadonlySet<number> {
  let next = gone;

  for (const one of pops) {
    next = cleared(next, course, one.at, one.reach);
  }

  return next;
}

/** Wie viele Harpunen eine Mine aushält. */
const MINE_HITS = 3;

/** Und wie groß der Knall ist, mit dem sie dann hochgeht. */
const POP = 30;

/** What each weapon does. */
const ARMS: Readonly<
  Record<
    WeaponKind,
    {
      /** How fast it leaves the boat, in pixels a second. */
      readonly speed: number;
      /** How long until the next one may go, in seconds. */
      readonly reload: number;
      /** How long it lives before it gives up, in seconds. */
      readonly life: number;
      /** How far its bang reaches, or nought for something that just hits. */
      readonly reach: number;
    }
  >
> = {
  // Fast, cheap, and it only ever solves one problem: the mine in front of you.
  harpoon: { speed: 430, reload: 0.4, life: 0.9, reach: 0 },
  // Langsamer als die Harpune und seltener, dafür nimmt er den Fels mit - ein
  // Torpedo macht eine Tür. Zu langsam darf er aber nicht sein: Auf einen
  // Gegner, der zieht, muss man sonst vorhalten, und das kann eine Maus nicht
  // erklären.
  torpedo: { speed: 330, reload: 1.1, life: 2.6, reach: 42 },
  // Gelegt statt geschossen: Sie bleibt, wo sie hingelegt wurde, und geht nach
  // ihrer Zeit hoch. Die einzige Waffe, die man nicht zielt, sondern platziert.
  mine: { speed: 0, reload: 1.6, life: 2.4, reach: 66 },
};

/**
 * Advances a dive by one frame.
 *
 * @param state - the world as it stands
 * @param course - the course being dived
 * @param input - what the player is asking for
 * @param dt - how long the frame took, in seconds
 * @returns the next world
 */
export function step(
  state: GameState,
  course: Course,
  input: Input,
  dt: number,
): GameState {
  let result = state;

  if (state.phase === "diving") {
    const slice = Math.min(dt, MAX_FRAME);
    // Wie schnell das Wasser hier nachläuft: Grundtempo mal Schwierigkeit.
    const pace = WINDOW_SPEED * course.pace;
    const window = windowAt(state.window, course, state.sub.x, pace, slice);
    const held = heldInside(
      swim(state.sub, input, state.gear, slice),
      window,
      pace,
    );

    // The guns first, so a shot fired this frame is already on its way when
    // the hull is asked what it is touching - otherwise the mine you just
    // killed still kills you.
    // Der Schub, wie er sich aufbaut, und die Schraube, die daran hängt.
    const wash = Math.max(
      0,
      Math.min(1, state.wash + (input.forward ? slice : -slice) / WASH_TIME),
    );
    const spin = state.spin + (SCREW_IDLE + SCREW_DRIVEN * wash) * slice;

    const armed = armoury(state, input, held, slice);
    const flying = fly(
      armed.shots,
      state.gone,
      state.dents,
      course,
      window,
      slice,
    );
    const blasts = smoke([...state.blasts, ...flying.blasts], slice);

    // Der Wächter: erscheint, wenn man ihm nahe kommt, und was auf ihn
    // zufliegt, trifft ihn auch.
    const met = meeting(state.boss, course, held.x);
    const struckBoss = strike(met, flying.shots, flying.blasts);
    const boss = drift(struckBoss.boss, slice);
    const inks = thrown(state.inks, boss, held, slice);

    // Und die Bewohner: erst einstecken, dann schwimmen. Wer in diesem Bild
    // stirbt, beißt in diesem Bild nicht mehr.
    const prey = mauled(state.beasts, struckBoss.shots, flying.blasts, reachOf);
    const swarm = prey.beasts.map((one) => swum(one, held, slice));

    const hurt = Math.max(0, state.hurt - slice);
    const rock =
      hurt > 0 ? null : touching(held.x, held.y, course, flying.gone);
    const splat = hurt > 0 || rock !== null ? null : splash(inks.inks, held);
    const grab =
      hurt > 0 || rock !== null || splat !== null
        ? null
        : grabbed(inks.boss, held);
    const nipped =
      hurt > 0 || rock !== null || splat !== null || grab !== null
        ? null
        : bitten(swarm, held, SUB_DISCS, SUB_DISC);
    const hit = rock ?? splat?.at ?? grab ?? nipped;
    const hull = hit === null ? state.hull : state.hull - 1;
    const air = breathe(state.air, state.gear, course, held.y, slice);

    result = {
      ...state,
      sub: hit === null ? held : bumped(held, hit),
      window,
      shoved: held.shoved,
      wash,
      spin,
      time: state.time + slice,
      hit: hit ?? state.hit,
      air,
      hull,
      hurt: hit === null ? hurt : HURT_TIME,
      shots: prey.shots,
      blasts: [
        ...blasts,
        ...struckBoss.blasts,
        // Jedes Tier, das in diesem Bild gestorben ist, hinterlässt eine
        // Wolke - sonst verschwände es einfach, und ein Treffer, den man
        // nicht sieht, ist keiner.
        ...prey.dead.map((at) => bang(at, SHRED)),
        // Und was auf einem Tier hochgegangen ist, geht dort auch wirklich
        // hoch: Ein Torpedo, der an einem Seeigel verpufft, wäre kein Torpedo.
        ...prey.pops.map((one) => bang(one.at, one.reach)),
        ...(hit === null ? [] : [bang(hit, 0)]),
      ],
      gone: swept(flying.gone, course, prey.pops),
      dents: flying.dents,
      beasts: swarm,
      boss: inks.boss,
      inks:
        splat === null
          ? inks.inks
          : inks.inks.filter((one) => one !== splat.ink),
      loaded: armed.loaded,
      laid: armed.laid,
      fired: armed.fired,
      phase: phaseAfter(held.x, course, hull, air, boss),
    };
  }

  return result;
}

/**
 * Whether a dive is still going.
 *
 * @param state - the world
 * @returns true while there is still something to do
 */
export function diving(state: GameState): boolean {
  return state.phase === "diving";
}

/**
 * How far along the course the boat is, from nought to one.
 *
 * @param state - the world
 * @param course - the course being dived
 * @returns the share of the way that is behind it
 */
export function progress(state: GameState, course: Course): number {
  const share = state.sub.x / Math.max(1, course.goal);
  return Math.max(0, Math.min(1, share));
}

/**
 * What is in a square, taking into account what has been blown out of it.
 *
 * @param gone - the squares that are no longer there
 * @param course - the course being dived
 * @param col - the column, counted from the start
 * @param row - the row, counted from the surface
 * @returns the square as it stands this dive
 * @remarks
 * The course itself is never touched. A torpedo changes **this dive**, and the
 * map is the same map next time.
 */
export function solidAt(
  gone: ReadonlySet<number>,
  course: Course,
  col: number,
  row: number,
): ReturnType<typeof cellAt> {
  const blown = gone.has(row * course.cols + col);
  return blown ? "." : cellAt(course, col, row);
}

/** The boat after a frame of engine, planes and water. */
function swim(
  sub: GameState["sub"],
  input: Input,
  gear: Gear,
  dt: number,
): GameState["sub"] {
  // **Ahead is always the faster way.** A propeller in reverse is a propeller
  // working against its own shape, and a boat that backs up as briskly as it
  // goes forward would turn the window into a thing one simply outruns
  // backwards. Astern is for waiting and for a last-moment correction, and it
  // is meant to feel like it.
  const push = input.forward ? 1 : input.back ? -ASTERN : 0;
  const rise = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const vx = held(
    sub.vx + push * THRUST * gear.push * dt,
    -MAX_VX * gear.push * ASTERN,
    MAX_VX * gear.push,
    dt,
  );
  const vy = paced(
    sub.vy + rise * LIFT * gear.dive * dt,
    MAX_VY * gear.dive,
    dt,
  );
  return { x: sub.x + vx * dt, y: sub.y + vy * dt, vx, vy };
}

/** One axis of speed after the water has had its share, held to its limit. */
function paced(speed: number, most: number, dt: number): number {
  return held(speed, -most, most, dt);
}

/** The same, where the two ends are not the same - forwards and backwards. */
function held(speed: number, least: number, most: number, dt: number): number {
  const slowed = speed - speed * DRAG * dt;
  return Math.max(least, Math.min(most, slowed));
}

/** Where the window's left edge is after this frame. */
function windowAt(
  window: number,
  course: Course,
  x: number,
  pace: number,
  dt: number,
): number {
  // It stops one screen short of the end: the way out has to be somewhere the
  // window cannot take from you, or the last few metres would be a race that
  // is already lost.
  //
  // Und vor dem Wächter hält es ganz an: Ein Kampf, bei dem der Ausschnitt
  // weiterwandert, ist kein Kampf, sondern eine Flucht mit Zuschauer.
  const last = Math.max(0, course.length - VIEW_W);
  const arena = course.boss ? Math.max(0, course.goal - ARENA) : last;
  return Math.min(last, arena, window + chasing(window, x, pace) * dt);
}

/**
 * Wie schnell das Fenster gerade läuft.
 *
 * @param window - wo sein hinterer Rand steht
 * @param x - wo das Boot steht
 * @returns das Tempo in Pixeln je Sekunde
 * @remarks
 * **Wer vorn fährt, zieht das Fenster mit.** Steht das Boot im vorderen
 * Drittel, legt das Wasser zu - bis auf gut das Doppelte am vorderen Rand.
 *
 * Das regelt sich von selbst: Das schnellere Fenster holt auf, damit ist das
 * Boot nicht mehr vorn, und es wird wieder langsamer. Wer sich Platz erfahren
 * hat, behält ihn also nicht geschenkt - und wer zügig taucht, wartet nicht
 * auf den eigenen Ausschnitt.
 */
function chasing(window: number, x: number, pace: number): number {
  const share = (x - window) / VIEW_W;
  const over = Math.max(0, share - CHASE.from) / (1 - CHASE.from);
  return pace * (1 + (CHASE.most - 1) * Math.min(1, over));
}

/** The boat held inside the window and inside the water. */
function heldInside(
  sub: GameState["sub"],
  window: number,
  pace: number,
): GameState["sub"] & { readonly shoved: boolean } {
  const back = window + EDGE;
  const front = window + VIEW_W - EDGE;
  const shoved = sub.x < back;
  const x = Math.max(back, Math.min(front, sub.x));
  const top = SUB_HIGH / 2;
  const floor = ROWS * CELL - SUB_HIGH / 2;
  const y = Math.max(top, Math.min(floor, sub.y));
  // **An edge takes the speed it is holding back, and no more.** Shoved along
  // at the back, the boat is going at the window's pace whatever its engine is
  // doing, so that is the speed it has - and one press of the throttle is
  // enough to pull away again. (Zeroing it here instead is a trap with no way
  // out: the engine would start from nothing every frame while the window kept
  // moving, and nobody who fell behind could ever catch up.) Held at the front
  // it is the other way round: the window's pace is as fast as it is going,
  // and nothing is stored up for the moment the window catches up.
  const carried = x > sub.x ? Math.max(sub.vx, pace) : sub.vx;
  const vx = x < sub.x ? Math.min(carried, pace) : carried;
  // Up and down there is a wall, not an edge: the speed is simply gone.
  const vy = y === sub.y ? sub.vy : 0;
  return { x, y, vx, vy, shoved };
}

/** The boat knocked back off whatever it just ran into. */
function bumped(
  sub: GameState["sub"] & { readonly shoved: boolean },
  hit: Vec,
): GameState["sub"] {
  const away = Math.hypot(sub.x - hit.x, sub.y - hit.y) || 1;
  return {
    x: sub.x + ((sub.x - hit.x) / away) * SHOVE,
    y: sub.y + ((sub.y - hit.y) / away) * SHOVE,
    vx: 0,
    vy: 0,
  };
}

/**
 * Das Rohr und die Minen: was in diesem Bild ins Wasser geht.
 *
 * @remarks
 * **Geschossen wird dorthin, wo man hinzeigt.** Ohne Zielpunkt geradeaus, denn
 * eine Tastatur hat keinen Mauszeiger - aber mit einem wird der Schuss
 * gerichtet, und damit ist die Waffe endlich etwas, das man führt, statt etwas,
 * das man nur auslöst.
 *
 * Gehalten statt getippt, weil eine Nachladezeit das Tempo einer Waffe
 * bestimmt und niemand dafür auf einer Taste trommeln sollte. Die Seemine hat
 * ihre eigene Uhr: Sie ersetzt das Rohr nicht, also blockiert sie es auch
 * nicht.
 */
function armoury(
  state: GameState,
  input: Input,
  sub: GameState["sub"],
  dt: number,
): {
  readonly shots: readonly Shot[];
  readonly loaded: number;
  readonly laid: number;
  readonly fired: number;
} {
  const gun = state.gear.gun;
  const loaded = Math.max(0, state.loaded - dt);
  const laid = Math.max(0, state.laid - dt);
  const shoots = gun !== null && input.fire && loaded <= 0;
  const lays = state.gear.mines && input.drop && laid <= 0;
  let shots = state.shots;
  let fired = state.fired;

  if (shoots && gun !== null) {
    const arm = ARMS[gun];
    // Die Richtung: auf den Zielpunkt, sonst nach vorn. Die Länge ist die
    // Geschwindigkeit der Waffe, die Fahrt des Bootes kommt oben drauf.
    const dx = input.aim === null ? 1 : input.aim.x - sub.x;
    const dy = input.aim === null ? 0 : input.aim.y - sub.y;
    const away = Math.hypot(dx, dy) || 1;
    shots = [
      ...shots,
      {
        id: fired,
        kind: gun,
        x: sub.x + (dx / away) * MUZZLE,
        y: sub.y + (dy / away) * MUZZLE,
        vx: (dx / away) * arm.speed + sub.vx,
        vy: (dy / away) * arm.speed,
        age: 0,
      },
    ];
    fired += 1;
  }

  if (lays) {
    // **Eine gelegte Mine bleibt liegen.** Sie treibt nicht, sie fliegt nicht -
    // sie ist ein Ort, den man sich aussucht, und geht dort nach ihrer Zeit
    // hoch. Deshalb steht sie in derselben Liste wie die Schüsse: Was sie
    // unterscheidet, ist nur, dass ihre Geschwindigkeit null ist.
    shots = [
      ...shots,
      {
        id: fired,
        kind: "mine",
        x: sub.x,
        y: sub.y,
        vx: 0,
        vy: 0,
        age: 0,
      },
    ];
    fired += 1;
  }

  return {
    shots,
    loaded: shoots && gun !== null ? ARMS[gun].reload : loaded,
    laid: lays ? ARMS.mine.reload : laid,
    fired,
  };
}

/** Everything in the water on its way somewhere, one frame on. */
function fly(
  shots: readonly Shot[],
  gone: ReadonlySet<number>,
  dents: ReadonlyMap<number, number>,
  course: Course,
  window: number,
  dt: number,
): {
  readonly shots: readonly Shot[];
  readonly blasts: readonly Blast[];
  readonly gone: ReadonlySet<number>;
  readonly dents: ReadonlyMap<number, number>;
} {
  const still: Shot[] = [];
  const blasts: Blast[] = [];
  let left = gone;
  let hurt = dents;

  for (const shot of shots) {
    const moved: Shot = {
      ...shot,
      x: shot.x + shot.vx * dt,
      y: shot.y + shot.vy * dt,
      age: shot.age + dt,
    };
    const arm = ARMS[moved.kind];
    const col = Math.floor(moved.x / CELL);
    const row = Math.floor(moved.y / CELL);
    const into = solidAt(left, course, col, row);
    const seen =
      moved.x > window - CELL &&
      moved.x < window + VIEW_W + CELL &&
      moved.y > 0 &&
      moved.y < ROWS * CELL;
    // Eine gelegte Mine steckt in nichts fest - sie liegt und wartet. Tang und
    // die Häuser sind Zierde: Da fliegt ein Schuss hindurch wie durch Wasser.
    const done = moved.kind !== "mine" && into !== "." && !isDecor(into);
    const old = moved.age >= arm.life;

    if (!done && !old && seen) {
      still.push(moved);
    } else if (arm.reach > 0) {
      // Was einen Knall hat, geht hoch, wo es stehengeblieben ist - am Fels,
      // an der Mine oder einfach, weil seine Zeit um war.
      blasts.push(bang(moved, arm.reach));
      left = cleared(left, course, moved, arm.reach);
    } else if (done && (into === "M" || into === "#" || into === "B")) {
      // **Die Harpune sticht, sie sprengt nicht.** Ein Fels nimmt sie einfach
      // auf; eine Mine merkt sich den Stich, und ein paar davon reichen.
      const hit = bite(hurt, left, course, col, row);
      left = hit.gone;
      hurt = hit.dents;
      if (hit.burst) {
        blasts.push(bang(moved, POP));
      }
    }
  }

  return { shots: still, blasts, gone: left, dents: hurt };
}

/**
 * Ein Harpunenstich in ein Feld.
 *
 * @remarks
 * Fels steckt das weg - dafür gibt es den Torpedo. Eine Mine hält
 * {@link MINE_HITS} Stiche aus und geht dann hoch, und zwar mit einem kleinen
 * Knall, damit man sieht, dass es der letzte war.
 */
function bite(
  dents: ReadonlyMap<number, number>,
  gone: ReadonlySet<number>,
  course: Course,
  col: number,
  row: number,
): {
  readonly gone: ReadonlySet<number>;
  readonly dents: ReadonlyMap<number, number>;
  readonly burst: boolean;
} {
  let out = { gone, dents, burst: false };

  if (solidAt(gone, course, col, row) === "M") {
    const at = row * course.cols + col;
    const now = (dents.get(at) ?? 0) + 1;
    const burst = now >= MINE_HITS;
    const next = new Map(dents);
    next.set(at, now);
    out = {
      gone: burst ? without(gone, course, col, row) : gone,
      dents: next,
      burst,
    };
  }

  return out;
}

/** A bang at a point. */
function bang(at: Vec, reach: number): Blast {
  return { x: at.x, y: at.y, reach, age: 0 };
}

/** Blasts one frame older, and the ones still worth drawing. */
function smoke(blasts: readonly Blast[], dt: number): readonly Blast[] {
  const still: Blast[] = [];
  for (const one of blasts) {
    if (one.age + dt < BLAST_LIFE) {
      still.push({ ...one, age: one.age + dt });
    }
  }
  return still;
}

/** The squares a bang takes out of the course. */
function cleared(
  gone: ReadonlySet<number>,
  course: Course,
  at: Vec,
  reach: number,
): ReadonlySet<number> {
  const next = new Set(gone);
  const from = Math.floor((at.x - reach) / CELL);
  const to = Math.floor((at.x + reach) / CELL);
  const high = Math.floor((at.y - reach) / CELL);
  const low = Math.floor((at.y + reach) / CELL);
  for (let col = from; col <= to; col += 1) {
    for (let row = high; row <= low; row += 1) {
      const mx = col * CELL + CELL / 2;
      const my = row * CELL + CELL / 2;
      const near = Math.hypot(at.x - mx, at.y - my) <= reach;
      const there = solidAt(next, course, col, row);
      // **Gewachsener Fels bleibt.** Weg geht nur, was als Bruchfels
      // geschrieben ist - und was ohnehin hochgehen wollte.
      if (near && (there === "B" || there === "M")) {
        next.add(row * course.cols + col);
      }
    }
  }
  return next;
}

/** The same, for a single square. */
function without(
  gone: ReadonlySet<number>,
  course: Course,
  col: number,
  row: number,
): ReadonlySet<number> {
  const next = new Set(gone);
  next.add(row * course.cols + col);
  return next;
}

/**
 * Ob man in den Wächter hineingefahren ist.
 *
 * @param boss - er, falls er schon da ist
 * @param sub - das Boot
 * @returns die Stelle, an der es wehtut, oder null
 * @remarks
 * **Sein Leib tut weh.** Ohne das wäre der sicherste Platz im ganzen Kampf
 * mitten in ihm drin: Dort trifft jede Harpune, und seine Tinte fliegt
 * vorbei, weil sie erst an seinem Rand entsteht. Ein Gegner, den man umarmen
 * kann, ist kein Gegner, sondern eine Zielscheibe.
 */
function grabbed(boss: Boss | null, sub: GameState["sub"]): Vec | null {
  const near =
    boss !== null &&
    boss.hull > 0 &&
    Math.hypot(sub.x - boss.x, sub.y - boss.y) < GUARD.grip;
  return near && boss !== null ? { x: boss.x, y: boss.y } : null;
}

/**
 * What the hull is touching, if anything.
 *
 * @remarks
 * Three discs down the middle of the boat against the squares they reach into,
 * which is only ever a handful of squares - a course is a grid precisely so
 * that nothing has to look at the whole of it.
 */
function touching(
  x: number,
  y: number,
  course: Course,
  gone: ReadonlySet<number>,
): Vec | null {
  let hit: Vec | null = null;

  for (const along of SUB_DISCS) {
    const cx = x + along;
    const from = Math.floor((cx - SUB_DISC) / CELL);
    const to = Math.floor((cx + SUB_DISC) / CELL);
    const high = Math.floor((y - SUB_DISC) / CELL);
    const low = Math.floor((y + SUB_DISC) / CELL);
    for (let col = from; col <= to && hit === null; col += 1) {
      for (let row = high; row <= low && hit === null; row += 1) {
        if (struck(cx, y, col, row, course, gone)) {
          hit = { x: cx, y };
        }
      }
    }
    if (hit !== null) {
      break;
    }
  }

  return hit;
}

/** Whether one disc has run into what is in one square. */
function struck(
  cx: number,
  cy: number,
  col: number,
  row: number,
  course: Course,
  gone: ReadonlySet<number>,
): boolean {
  let bad = false;

  switch (solidAt(gone, course, col, row)) {
    // Beide Sorten Fels fahren sich gleich an. Der Unterschied zeigt sich
    // erst, wenn etwas davor hochgeht.
    case "B":
    case "#": {
      // Nearest point of the square to the middle of the disc: the standard
      // circle against box, and the reason a rock corner does not catch.
      const nx = Math.max(col * CELL, Math.min(cx, (col + 1) * CELL));
      const ny = Math.max(row * CELL, Math.min(cy, (row + 1) * CELL));
      bad = Math.hypot(cx - nx, cy - ny) < SUB_DISC;
      break;
    }
    case "M": {
      const mx = col * CELL + CELL / 2;
      const my = row * CELL + CELL / 2;
      bad = Math.hypot(cx - mx, cy - my) < SUB_DISC + MINE_R;
      break;
    }
    default:
      bad = false;
  }

  return bad;
}

/** Whether the dive goes on, is over the line, or is over. */
function phaseAfter(
  x: number,
  course: Course,
  hull: number,
  air: number,
  boss: Boss | null,
): GameState["phase"] {
  let phase: GameState["phase"] = "diving";
  // Wo ein Wächter ist, ist er das Ziel: Die Linie dahinter zählt erst, wenn
  // er unten ist - sonst schwimmt man an ihm vorbei und hat "gewonnen".
  const guarded = course.boss && (boss === null || boss.hull > 0);

  if (hull <= 0) {
    phase = "wrecked";
  } else if (air <= 0) {
    phase = "drowned";
  } else if (boss !== null && boss.hull <= 0) {
    phase = "arrived";
  } else if (x >= course.goal && !guarded) {
    phase = "arrived";
  }

  return phase;
}

/**
 * Die Luft nach einer Sekunde Tauchen - oder Auftauchen.
 *
 * @remarks
 * Über den ersten Gewässern ist offenes Wasser: Wer die Oberfläche berührt,
 * füllt auf, und zwar schnell genug, dass es sich lohnt, und langsam genug,
 * dass es ein Umweg bleibt. Über einer Höhle ist Fels, und dann ist der Tank
 * schlicht das, was man dabeihat.
 */
function breathe(
  air: number,
  gear: Gear,
  course: Course,
  y: number,
  dt: number,
): number {
  const gulping = course.surfacing && y <= AIR.reach;
  const next = gulping ? air + AIR.refill * dt : air - dt;
  return Math.min(gear.air, next);
}

/** Der Wächter, sobald man nah genug heran ist. */
function meeting(boss: Boss | null, course: Course, x: number): Boss | null {
  const due = course.boss && boss === null && x > course.goal - ARENA;
  return due
    ? {
        x: course.goal - GUARD.from,
        y: (ROWS * CELL) / 2,
        vy: GUARD.swim,
        hull: GUARD.hull,
        whole: GUARD.hull,
        hurt: 0,
        loaded: GUARD.reload,
      }
    : boss;
}

/** Was von den eigenen Schüssen auf ihm einschlägt. */
function strike(
  boss: Boss | null,
  shots: readonly Shot[],
  booms: readonly Blast[],
): {
  readonly boss: Boss | null;
  readonly shots: readonly Shot[];
  readonly blasts: readonly Blast[];
} {
  const left: Shot[] = [];
  const blasts: Blast[] = [];
  let hull = boss?.hull ?? 0;
  let hurt = boss?.hurt ?? 0;

  for (const shot of shots) {
    const near =
      boss !== null &&
      boss.hull > 0 &&
      Math.hypot(shot.x - boss.x, shot.y - boss.y) < GUARD.reach;
    if (near) {
      hull -= BITE[shot.kind];
      hurt = GUARD.hurt;
      blasts.push(bang(shot, GUARD.splash));
    } else {
      left.push(shot);
    }
  }

  // **Was in seiner Nähe hochgeht, spürt er auch.** Sonst wäre eine Seemine,
  // die eine Armlänge neben ihm liegt, nur Dekoration, und ein Torpedo, der
  // eine Handbreit daneben in den Fels geht, ein Blindgänger.
  for (const boom of booms) {
    const near =
      boss !== null &&
      boss.hull > 0 &&
      Math.hypot(boom.x - boss.x, boom.y - boss.y) < GUARD.reach + boom.reach;
    if (near) {
      hull -= GUARD.singed;
      hurt = GUARD.hurt;
    }
  }

  return {
    boss: boss === null ? null : { ...boss, hull, hurt },
    shots: left,
    blasts,
  };
}

/** Wie er sich bewegt, und wann er wieder wirft. */
function drift(boss: Boss | null, dt: number): Boss | null {
  let next = boss;

  if (boss !== null && boss.hull > 0) {
    const top = GUARD.reach + CELL;
    const floor = ROWS * CELL - GUARD.reach - CELL;
    const y = boss.y + boss.vy * dt;
    const turned = y < top || y > floor;
    next = {
      ...boss,
      y: Math.max(top, Math.min(floor, y)),
      vy: turned ? -boss.vy : boss.vy,
      hurt: Math.max(0, boss.hurt - dt),
      loaded: Math.max(0, boss.loaded - dt),
    };
    // Geworfen wird in `thrown` - hier zählt nur die Uhr herunter.
  }

  return next;
}

/** Was er geworfen hat, eine Bewegung weiter - und ob etwas Neues dazukommt. */
function thrown(
  inks: readonly Ink[],
  boss: Boss | null,
  sub: GameState["sub"],
  dt: number,
): { readonly inks: readonly Ink[]; readonly boss: Boss | null } {
  const flying: Ink[] = [];
  for (const one of inks) {
    const moved: Ink = {
      ...one,
      x: one.x + one.vx * dt,
      y: one.y + one.vy * dt,
      age: one.age + dt,
    };
    if (moved.age < GUARD.inkLife && moved.x > 0) {
      flying.push(moved);
    }
  }

  let next = boss;
  if (boss !== null && boss.hull > 0 && boss.loaded <= 0) {
    const turn = Math.atan2(sub.y - boss.y, sub.x - boss.x);
    // **Er wirft einen Fächer.** Einem einzelnen Strahl weicht man mit einem
    // Tastendruck aus und schießt dabei weiter; durch drei muss man
    // hindurchsteuern, und das ist der Unterschied zwischen einem Gegner und
    // einer Zielscheibe, die zurückschießt.
    for (let one = 0; one < GUARD.fan; one += 1) {
      const lean = turn + (one - (GUARD.fan - 1) / 2) * GUARD.spread;
      flying.push({
        id: boss.hull * GUARD.hull + flying.length,
        x: boss.x,
        y: boss.y,
        vx: Math.cos(lean) * GUARD.ink,
        vy: Math.sin(lean) * GUARD.ink,
        age: 0,
      });
    }
    // Und angeschlagen wirft er schneller: Die zweite Hälfte des Kampfes ist
    // die schwerere, sonst wäre der Kampf nach dem ersten Treffer entschieden.
    const bled = boss.hull <= boss.whole / 2;
    next = { ...boss, loaded: GUARD.reload * (bled ? GUARD.frenzy : 1) };
  }

  return { inks: flying, boss: next };
}

/** Und ob einer davon das Boot erwischt hat. */
function splash(
  inks: readonly Ink[],
  sub: GameState["sub"],
): { readonly at: Vec; readonly ink: Ink } | null {
  let found: { readonly at: Vec; readonly ink: Ink } | null = null;

  for (const one of inks) {
    for (const along of SUB_DISCS) {
      const cx = sub.x + along;
      const close =
        Math.hypot(one.x - cx, one.y - sub.y) < SUB_DISC + GUARD.inkR;
      if (close && found === null) {
        found = { at: { x: cx, y: sub.y }, ink: one };
      }
    }
  }

  return found;
}
