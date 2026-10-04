/**
 * Ein Bild einer Partie: laufen, schießen, platzen, zahlen.
 *
 * @module
 * @remarks
 * Rein: Zustand hinein, Zustand heraus. Die Schleife im Bildschirm ruft nur
 * {@link step} auf und zeichnet das Ergebnis - damit lässt sich jede Partie
 * nachrechnen, ohne sie zu sehen.
 *
 * Die Reihenfolge innerhalb eines Bildes ist Absicht: **erst laufen die
 * Ballons, dann schießen die Türme, dann fliegen die Geschosse.** Ein Turm
 * zielt damit auf das, was wirklich vor ihm liegt, und nicht auf die Stelle,
 * an der etwas vor einem Sechzigstel einer Sekunde war.
 */
import {
  BASE_PACE,
  BLOONS,
  hurts,
  type BloonKind,
} from "@/games/bloons-td/engine/bloons";
import {
  CELL,
  isGrass,
  lengthOf,
  middleOf,
  spotAt,
  trackOf,
  type Spot,
} from "@/games/bloons-td/engine/map";
import {
  TOWERS,
  type Monkey,
  type Picking,
  type TowerKind,
} from "@/games/bloons-td/engine/towers";
import {
  BITE,
  MOST,
  NO_TIERS,
  nextOf,
  refundOfTower,
  statsOf,
  type Path,
} from "@/games/bloons-td/engine/upgrades";
import { waveOf } from "@/games/bloons-td/engine/waves";
import {
  START,
  type Bloon,
  type Burst,
  type Game,
  type Shot,
  type Tower,
  type Waiting,
} from "@/games/bloons-td/engine/types";

/** Der Weg und seine Länge - für alle Partien derselbe. */
export const TRACK: readonly Spot[] = trackOf();
export const TRACK_LENGTH = lengthOf(TRACK);

/** Wohin ein frisch gebauter Turm schaut: zum Betrachter. */
export const WATCH = Math.PI / 2;

/**
 * Wie schnell ein Rohr schwenkt, in Bogenmaß je Sekunde, und wie lange ein
 * Rückstoß nachwirkt, in Sekunden.
 *
 * @remarks
 * Neun Bogenmaß sind gut fünfhundert Grad je Sekunde: schnell genug, dass
 * niemand auf den Turm wartet, langsam genug, dass man den Schwenk sieht.
 */
const SWING = { turn: 9, kick: 0.22 } as const;

/** Das längste Bild, das noch zählt, in Sekunden. */
const MAX_FRAME = 0.05;

/** Wie lange ein Platzer zu sehen ist. */
const BURST_LIFE = 0.35;

/** Wie groß ein Ballon ist, als Anteil einer Feldbreite. */
export const BLOON_SIZE = 0.3;

/** Was eine Runde einbringt: eine Grundzahl plus so viel je Runde. */
const PAYOUT = { base: 100, perRound: 6 } as const;

/**
 * Eine frische Partie.
 *
 * @returns der Zustand vor der ersten Runde
 */
export function createGame(): Game {
  return {
    phase: "ready",
    round: 0,
    money: START.money,
    lives: START.lives,
    towers: [],
    bloons: [],
    shots: [],
    bursts: [],
    waiting: [],
    clock: 0,
    popped: 0,
    leaked: 0,
    nextId: 1,
  };
}

/**
 * Ob an dieser Stelle ein Turm gebaut werden darf.
 *
 * @param game - die Partie
 * @param kind - welcher Turm
 * @param col - die Spalte
 * @param row - die Reihe
 * @returns true, wenn dort Wiese ist, nichts steht und das Geld reicht
 */
export function canBuild(
  game: Game,
  kind: TowerKind,
  col: number,
  row: number,
): boolean {
  const free = !game.towers.some((one) => one.col === col && one.row === row);
  return (
    isGrass(col, row) &&
    free &&
    game.money >= TOWERS[kind].cost &&
    game.phase !== "over"
  );
}

/**
 * Die Partie mit einem Turm mehr.
 *
 * @param game - die Partie
 * @param kind - welcher Turm
 * @param col - die Spalte
 * @param row - die Reihe
 * @returns die neue Partie, oder die alte, wenn dort nicht gebaut werden darf
 */
export function build(
  game: Game,
  kind: TowerKind,
  col: number,
  row: number,
): Game {
  const may = canBuild(game, kind, col, row);
  const tower: Tower = {
    id: game.nextId,
    kind,
    col,
    row,
    loaded: 0,
    // **Wer noch nichts gesehen hat, schaut den Spieler an.** Nach rechts zu
    // schauen wäre genauso willkürlich, sähe aber aus wie ein Fehler - und
    // der Eisaffe, der sich nie dreht, behält diese Richtung für immer.
    aim: WATCH,
    faced: WATCH,
    kick: 0,
    tiers: NO_TIERS,
    pops: 0,
  };
  return may
    ? {
        ...game,
        money: game.money - TOWERS[kind].cost,
        towers: [...game.towers, tower],
        nextId: game.nextId + 1,
      }
    : game;
}

/**
 * Die Partie ohne diesen Turm, dafür mit Geld dafür.
 *
 * @param game - die Partie
 * @param id - welcher Turm
 * @returns die neue Partie
 */
export function sell(game: Game, id: number): Game {
  const gone = game.towers.find((one) => one.id === id);
  return gone === undefined
    ? game
    : {
        ...game,
        money: game.money + refundOfTower(gone.kind, gone.tiers),
        towers: game.towers.filter((one) => one.id !== id),
      };
}

/**
 * Ob dieser Turm auf dieser Säule noch eine Stufe kaufen kann.
 *
 * @param game - die Partie
 * @param id - welcher Turm
 * @param path - welche Säule
 * @returns true, wenn es dort noch etwas gibt und das Geld reicht
 */
export function canUpgrade(game: Game, id: number, path: Path): boolean {
  const tower = game.towers.find((one) => one.id === id);
  const step =
    tower === undefined ? null : nextOf(tower.kind, path, tower.tiers);

  return (
    tower !== undefined &&
    step !== null &&
    tower.tiers[path] < MOST &&
    game.money >= step.cost &&
    game.phase !== "over"
  );
}

/**
 * Die Partie, in der dieser Turm eine Stufe weiter ist.
 *
 * @param game - die Partie
 * @param id - welcher Turm
 * @param path - welche Säule
 * @returns die neue Partie, oder die alte, wenn das nicht geht
 * @remarks
 * Gekauft wird **auch mitten in der Welle**. In der Vorlage ist das so, und es
 * ist der halbe Reiz: Wenn die Runde kippt, entscheidet, ob man rechtzeitig
 * nachlegt - nicht, ob man zwanzig Sekunden früher richtig geraten hat.
 */
export function upgrade(game: Game, id: number, path: Path): Game {
  const may = canUpgrade(game, id, path);
  const tower = game.towers.find((one) => one.id === id);
  const step =
    tower === undefined ? null : nextOf(tower.kind, path, tower.tiers);

  return may && tower !== undefined && step !== null
    ? {
        ...game,
        money: game.money - step.cost,
        towers: game.towers.map((one) =>
          one.id === id
            ? { ...one, tiers: { ...one.tiers, [path]: one.tiers[path] + 1 } }
            : one,
        ),
      }
    : game;
}

/**
 * Die nächste Welle losschicken.
 *
 * @param game - die Partie
 * @returns die neue Partie, oder die alte, wenn gerade schon eine läuft
 */
export function sendWave(game: Game): Game {
  const ready = game.phase === "ready";
  const round = game.round + 1;
  const waiting: Waiting[] = [];
  let id = game.nextId;

  for (const group of waveOf(round)) {
    for (let one = 0; one < group.count; one += 1) {
      waiting.push({ kind: group.kind, at: group.delay + one * group.gap });
      id += 1;
    }
  }

  return ready
    ? {
        ...game,
        phase: "running",
        round,
        clock: 0,
        waiting: waiting.sort((a, b) => a.at - b.at),
        nextId: id,
      }
    : game;
}

/**
 * Bringt eine Partie um ein Bild weiter.
 *
 * @param game - die Partie
 * @param dt - wie lange das Bild gedauert hat, in Sekunden
 * @returns die nächste Partie
 */
export function step(game: Game, dt: number): Game {
  const slice = Math.min(dt, MAX_FRAME);
  let next = game;

  if (game.phase === "running") {
    next = running(game, slice);
  }

  return next;
}

/** Ein Bild, während eine Welle läuft. */
function running(game: Game, slice: number): Game {
  const clock = game.clock + slice;
  const bursts: Burst[] = [];
  let money = game.money;
  let lives = game.lives;
  let popped = game.popped;
  let leaked = game.leaked;
  let nextId = game.nextId;

  // Wer dran ist, läuft los.
  const started = game.waiting.filter((one) => one.at <= clock);
  const waiting = game.waiting.filter((one) => one.at > clock);
  const fresh: Bloon[] = started.map((one) => ({
    id: nextId++,
    kind: one.kind,
    gone: 0,
    hull: BLOONS[one.kind].hull,
    slowed: 0,
    slowTo: 1,
    thawed: 0,
    thawTo: 1,
    soak: false,
    bite: 0,
  }));

  // Dann laufen alle - und wer hinten hinausläuft, kostet Leben.
  const walked: Bloon[] = [];
  for (const bloon of [...game.bloons, ...fresh]) {
    const breed = BLOONS[bloon.kind];
    // **Zwei Uhren, in dieser Reihenfolge**: Solange die erste läuft, steht er
    // oder kriecht; danach gilt noch der Nachlauf des Permafrosts.
    const slow =
      clock < bloon.slowed
        ? bloon.slowTo
        : clock < bloon.thawed
          ? bloon.thawTo
          : 1;
    const gone = bloon.gone + BASE_PACE * breed.pace * slow * slice;
    // Ätzender Klebstoff frisst, solange der Klebstoff hält.
    const bitten =
      bloon.bite > 0 && clock >= bloon.bite && clock < bloon.slowed;
    const hull = bitten ? bloon.hull - 1 : bloon.hull;
    const bite = bitten
      ? clock + (bloon.bite - (bloon.bite - BITE))
      : bloon.bite;
    if (gone >= TRACK_LENGTH) {
      lives -= breed.rbe;
      leaked += 1;
    } else {
      walked.push({ ...bloon, gone, hull, bite });
    }
  }

  // **Wer etwas zum Platzen bringt, bekommt es angeschrieben.** Die Zahl
  // steht später an seinem Turm, damit man zwei gleich aussehende Affen
  // auseinanderhalten kann.
  const credit = new Map<number, number>();

  // Die Türme zielen auf das, was am weitesten ist.
  const shots: Shot[] = [];
  const towers = game.towers.map((tower) => {
    const made = fire(tower, walked, clock, nextId, slice);
    nextId = made.nextId;
    shots.push(...made.shots);
    // Der Eisaffe schießt nicht, er friert - das passiert sofort.
    const frost = statsOf(tower.kind, tower.tiers);
    for (const hit of made.frozen) {
      const at = walked.findIndex((one) => one.id === hit);
      const bloon = walked[at];
      if (bloon !== undefined) {
        if (bloon.hull > 0 && bloon.hull - frost.damage <= 0) {
          score(credit, tower.id);
        }
        walked[at] = {
          ...bloon,
          hull: bloon.hull - frost.damage,
          slowed: clock + frost.slow,
          slowTo: frost.slowTo,
          // Permafrost: Nach dem Auftauen bleibt er so lange zäh, wie der
          // Frost gedauert hat.
          thawed: frost.afterTo < 1 ? clock + frost.slow * 2 : bloon.thawed,
          thawTo: frost.afterTo < 1 ? frost.afterTo : bloon.thawTo,
          soak: bloon.soak || frost.soak,
        };
      }
    }
    if (made.pulse !== null) {
      bursts.push(made.pulse);
    }
    return made.tower;
  });

  // Und was fliegt, trifft.
  const flown = fly([...game.shots, ...shots], walked, clock, slice, credit);
  bursts.push(...flown.bursts);

  // Wer durch ist, platzt - und hinterlässt, was in ihm steckte.
  const left: Bloon[] = [];
  for (const bloon of flown.bloons) {
    if (bloon.hull > 0) {
      left.push(bloon);
    } else {
      const breed = BLOONS[bloon.kind];
      money += 1;
      popped += 1;
      bursts.push(burst(bloon, breed.paint));
      for (const [at, kind] of breed.inside.entries()) {
        left.push(born(nextId++, kind, bloon, at));
      }
    }
  }

  const done = waiting.length === 0 && left.length === 0;
  const beaten = lives <= 0;

  // Erst jetzt stehen alle Treffer fest.
  const scored = towers.map((one) => {
    const got = credit.get(one.id) ?? 0;
    return got === 0 ? one : { ...one, pops: one.pops + got };
  });

  return {
    ...game,
    phase: beaten ? "over" : done ? "ready" : "running",
    clock,
    money:
      money +
      (done && !beaten ? PAYOUT.base + game.round * PAYOUT.perRound : 0),
    lives: Math.max(0, lives),
    towers: scored,
    bloons: beaten ? [] : left,
    shots: beaten ? [] : flown.shots,
    bursts: [...smoke(game.bursts, slice), ...bursts],
    waiting: beaten ? [] : waiting,
    popped,
    leaked,
    nextId,
  };
}

/** Ein Ballon, der aus einem größeren zum Vorschein kommt. */
function born(id: number, kind: BloonKind, from: Bloon, at: number): Bloon {
  return {
    id,
    kind,
    // Ein Stück auseinander, sonst liegen sie exakt übereinander und sehen aus
    // wie einer.
    gone: Math.max(0, from.gone - at * CELL * BLOON_SIZE),
    hull: BLOONS[kind].hull,
    // **Was innen steckte, kommt frisch heraus** - außer der Belag zieht
    // durch. Ohne das wäre "Glue Soak" eine Zeile ohne Wirkung, denn der
    // Klebstoff bliebe ohnehin an allem hängen, was aus dem Ballon kommt.
    slowed: from.soak ? from.slowed : 0,
    slowTo: from.soak ? from.slowTo : 1,
    thawed: from.soak ? from.thawed : 0,
    thawTo: from.soak ? from.thawTo : 1,
    soak: from.soak,
    bite: from.soak ? from.bite : 0,
  };
}

/** Ein Platzer an der Stelle eines Ballons. */
function burst(bloon: Bloon, paint: string): Burst {
  const at = spotAt(TRACK, bloon.gone);
  return {
    look: "pop",
    x: at.x,
    y: at.y,
    reach: CELL * BLOON_SIZE,
    age: 0,
    paint,
  };
}

/** Die Platzer, einen Augenblick später. */
function smoke(bursts: readonly Burst[], slice: number): readonly Burst[] {
  return bursts
    .map((one) => ({ ...one, age: one.age + slice }))
    .filter((one) => one.age < BURST_LIFE);
}

/** Was ein Turm in diesem Bild abfeuert. */
function fire(
  tower: Tower,
  bloons: readonly Bloon[],
  clock: number,
  nextId: number,
  slice: number,
): {
  readonly tower: Tower;
  readonly shots: readonly Shot[];
  readonly frozen: readonly number[];
  readonly pulse: Burst | null;
  readonly nextId: number;
} {
  const monkey = statsOf(tower.kind, tower.tiers);
  const at = middleOf(tower.col, tower.row);
  // **Der Eisaffe sucht sich niemanden.** Er wirft nichts, er lässt in seinem
  // Umkreis regelmäßig eine Frostwelle los - ob dabei jemand in der Nähe ist,
  // ändert daran nichts, nur daran, ob sie jemanden erwischt.
  const beats = monkey.shooting === "pulse";
  const target = beats
    ? null
    : leader(bloons, at, monkey.range, monkey.picks, clock);
  // **Nachgeladen wird in der Zeit, die das Bild gedauert hat.** Stand hier
  // eine feste Zahl, hing die Schussfolge an der Bildrate: Mit einem pauschalen
  // Zwanzigstel je Bild feuerte bei sechzig Bildern jeder Turm dreimal so oft,
  // wie in seiner Tabelle steht - und die Tabelle rechnet in Sekunden.
  const loaded = Math.max(0, tower.loaded - slice);
  const shoots = loaded <= 0 && (beats || target !== null);
  // Das Rohr schwenkt jedes Bild ein Stück weiter, ob geschossen wird oder
  // nicht - sonst steht es zwischen zwei Schüssen still und ruckt dann.
  const seen = target === null ? null : spotAt(TRACK, target.gone);
  const want =
    seen === null ? tower.faced : Math.atan2(seen.y - at.y, seen.x - at.x);
  const shots: Shot[] = [];
  const frozen: number[] = [];
  let pulse: Burst | null = null;
  let id = nextId;
  let aim = tower.aim;

  if (shoots) {
    if (beats) {
      pulse = {
        look: "frost",
        x: at.x,
        y: at.y,
        reach: monkey.range,
        age: 0,
        paint: monkey.paint,
      };
      // **Er friert nicht alles ein, sondern die vordersten so viele, wie er
      // fassen kann.** Ein Frost ohne Grenze wäre bei dreißig Ballons auf dem
      // Bild kein Turm mehr, sondern ein Schalter.
      const inside = bloons
        .filter((bloon) => {
          const spot = spotAt(TRACK, bloon.gone);
          const near = Math.hypot(spot.x - at.x, spot.y - at.y) <= monkey.range;
          return near && (monkey.cold || hurts(bloon.kind, monkey.harm));
        })
        .sort((a, b) => b.gone - a.gone)
        .slice(0, monkey.pierce);
      for (const bloon of inside) {
        frozen.push(bloon.id);
      }
    } else if (seen !== null) {
      aim = Math.atan2(seen.y - at.y, seen.x - at.x);
      const many = monkey.shooting === "ring" ? monkey.spokes : 1;
      for (let one = 0; one < many; one += 1) {
        const turn =
          monkey.shooting === "ring" ? (one / many) * Math.PI * 2 : aim;
        shots.push(thrown(id++, tower, monkey, at, turn));
      }
    }
  }

  return {
    tower: {
      ...tower,
      loaded: shoots ? monkey.reload : loaded,
      aim,
      faced: swung(tower.faced, want, slice),
      kick: shoots ? 1 : Math.max(0, tower.kick - slice / SWING.kick),
    },
    shots,
    frozen,
    pulse,
    nextId: id,
  };
}

/**
 * Das Rohr, einen Augenblick später geschwenkt.
 *
 * @param from - wohin es zeigt
 * @param to - wohin es zeigen soll
 * @param slice - wie lange das Bild gedauert hat
 * @returns die neue Richtung
 * @remarks
 * Über den kürzeren der beiden Wege: Von 350 auf 10 Grad sind es zwanzig Grad
 * nach rechts und nicht dreihundertvierzig nach links.
 */
function swung(from: number, to: number, slice: number): number {
  const full = Math.PI * 2;
  const gap = ((((to - from) % full) + full + Math.PI) % full) - Math.PI;
  const most = SWING.turn * slice;

  return Math.abs(gap) <= most ? to : from + Math.sign(gap) * most;
}

/** Ein Geschoss, wie es das Rohr verlässt. */
function thrown(
  id: number,
  tower: Tower,
  monkey: Monkey,
  at: Spot,
  turn: number,
): Shot {
  return {
    id,
    x: at.x,
    y: at.y,
    vx: Math.cos(turn) * monkey.speed,
    vy: Math.sin(turn) * monkey.speed,
    from: tower.kind,
    by: tower.id,
    harm: monkey.harm,
    damage: monkey.damage,
    pierce: monkey.pierce,
    age: 0,
    life: monkey.life,
    blast: monkey.blast,
    slow: monkey.slow,
    slowTo: monkey.slowTo,
    soak: monkey.soak,
    bite: monkey.bite,
    back: tower.kind === "boomerang" ? { x: at.x, y: at.y } : null,
    hit: [],
  };
}

/**
 * Der Ballon in Reichweite, der am weitesten ist.
 *
 * @param bloons - alle Ballons auf dem Weg
 * @param at - wo der Turm steht
 * @param range - wie weit er reicht
 * @param picks - ob ihm jeder recht ist oder nur ein ungebremster
 * @param clock - die Uhr der Runde, für genau diese Frage
 * @returns der Ballon oder null, wenn keiner passt
 * @remarks
 * **"fresh" kann leer ausgehen, und das ist die Absicht.** Ein
 * Klebstoffschütze, dessen Ziele alle schon kleben, schießt lieber gar nicht,
 * als einen zweiten Klecks auf denselben Ballon zu setzen - der verlängert
 * nichts, er stellt nur dieselbe Uhr noch einmal.
 */
function leader(
  bloons: readonly Bloon[],
  at: Spot,
  range: number,
  picks: Picking,
  clock: number,
): Bloon | null {
  let best: Bloon | null = null;

  for (const bloon of bloons) {
    const spot = spotAt(TRACK, bloon.gone);
    const near = Math.hypot(spot.x - at.x, spot.y - at.y) <= range;
    const may = picks === "front" || bloon.slowed <= clock;
    if (near && may && (best === null || bloon.gone > best.gone)) {
      best = bloon;
    }
  }

  return best;
}

/** Was fliegt, und was es dabei trifft. */
function fly(
  shots: readonly Shot[],
  bloons: Bloon[],
  clock: number,
  slice: number,
  credit: Map<number, number>,
): {
  readonly shots: readonly Shot[];
  readonly bloons: Bloon[];
  readonly bursts: readonly Burst[];
} {
  const left: Shot[] = [];
  const bursts: Burst[] = [];

  for (const shot of shots) {
    const moved = steered(shot, slice);
    let alive = moved;
    let spent = false;

    for (const [at, bloon] of bloons.entries()) {
      const spot = spotAt(TRACK, bloon.gone);
      const close =
        Math.hypot(spot.x - alive.x, spot.y - alive.y) <
        CELL * BLOON_SIZE + SHOT_SIZE;
      const fresh = !alive.hit.includes(bloon.id);
      const may = hurts(bloon.kind, alive.harm);
      if (!spent && close && fresh && may && bloon.hull > 0) {
        if (bloon.hull - alive.damage <= 0) {
          score(credit, alive.by);
        }
        bloons[at] = {
          ...bloon,
          hull: bloon.hull - alive.damage,
          slowed: alive.slow > 0 ? clock + alive.slow : bloon.slowed,
          slowTo: alive.slow > 0 ? alive.slowTo : bloon.slowTo,
          soak: bloon.soak || (alive.slow > 0 && alive.soak),
          // Ätzend: Die erste Schicht geht nach dem üblichen Abstand.
          bite:
            alive.bite > 0 && alive.slow > 0 ? clock + alive.bite : bloon.bite,
        };
        alive = {
          ...alive,
          pierce: alive.pierce - 1,
          hit: [...alive.hit, bloon.id],
        };
        if (alive.blast !== null) {
          bursts.push({
            look: "blast",
            x: alive.x,
            y: alive.y,
            reach: alive.blast,
            age: 0,
            paint: BLAST_PAINT,
          });
          blow(bloons, alive, credit);
          spent = true;
        }
      }
    }

    const done = spent || alive.pierce <= 0 || alive.age >= alive.life;
    if (!done) {
      left.push(alive);
    }
  }

  return { shots: left, bloons, bursts };
}

/** Wie groß ein Geschoss für Treffer zählt. */
const SHOT_SIZE = 5;

/** Die Farbe eines Knalls. */
const BLAST_PAINT = "#f59e0b";

/** Ein Geschoss, einen Augenblick später - der Bumerang kommt dabei zurück. */
function steered(shot: Shot, slice: number): Shot {
  const age = shot.age + slice;
  const back = shot.back;
  let vx = shot.vx;
  let vy = shot.vy;

  if (back !== null && age > shot.life / 2) {
    // Ab der Hälfte zieht es ihn heim, und unterwegs trifft er ein zweites Mal.
    const turn = Math.atan2(back.y - shot.y, back.x - shot.x);
    const pace = Math.hypot(vx, vy);
    vx = Math.cos(turn) * pace;
    vy = Math.sin(turn) * pace;
  }

  return {
    ...shot,
    x: shot.x + vx * slice,
    y: shot.y + vy * slice,
    vx,
    vy,
    age,
  };
}

/**
 * Der Knall einer Bombe.
 *
 * @param bloons - alle Ballons, die er erwischen könnte
 * @param shot - die Bombe, die gerade hochgeht
 * @remarks
 * **Er erfasst so viele, wie er fassen kann, und zwar die nächstgelegenen.**
 * Das ist dieselbe Zahl, die bei einem Pfeil sagt, durch wie viele Ballons er
 * geht; beim Bombenwerfer steht sie für den Knall, und seine erste Säule
 * erhöht sie. Ein Knall ohne Grenze bräuchte diese Säule nicht.
 */
function blow(bloons: Bloon[], shot: Shot, credit: Map<number, number>): void {
  const reach = shot.blast ?? 0;
  const inside: number[] = [];

  for (const [at, bloon] of bloons.entries()) {
    const spot = spotAt(TRACK, bloon.gone);
    const gap = Math.hypot(spot.x - shot.x, spot.y - shot.y);
    if (gap <= reach && hurts(bloon.kind, shot.harm) && bloon.hull > 0) {
      inside.push(at);
    }
  }

  const caught = inside
    .sort((a, b) => nearness(bloons, a, shot) - nearness(bloons, b, shot))
    .slice(0, shot.pierce);
  for (const at of caught) {
    const bloon = bloons[at];
    if (bloon !== undefined) {
      if (bloon.hull - shot.damage <= 0) {
        score(credit, shot.by);
      }
      bloons[at] = { ...bloon, hull: bloon.hull - shot.damage };
    }
  }
}

/** Einem Turm eine zerstochene Schicht anschreiben. */
function score(credit: Map<number, number>, by: number): void {
  credit.set(by, (credit.get(by) ?? 0) + 1);
}

/** Wie weit ein Ballon vom Einschlag weg ist. */
function nearness(bloons: Bloon[], at: number, shot: Shot): number {
  const bloon = bloons[at];
  const spot = bloon === undefined ? null : spotAt(TRACK, bloon.gone);

  return spot === null
    ? Infinity
    : Math.hypot(spot.x - shot.x, spot.y - shot.y);
}

/**
 * Was eine überstandene Runde einbringt.
 *
 * @param round - die wievielte Runde
 * @returns der Betrag, der am Ende der Runde ausgezahlt wird
 */
export function payoutOf(round: number): number {
  return PAYOUT.base + round * PAYOUT.perRound;
}
