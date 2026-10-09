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
  type Harm,
} from "@/games/bloons-td/engine/bloons";
import { EVERY, skillOf } from "@/games/bloons-td/engine/bosses";
import {
  CELL,
  COLS,
  ROWS,
  isGrass,
  isWater,
  lengthOf,
  middleOf,
  spotAt,
  trackOf,
  type MapId,
  type Spot,
} from "@/games/bloons-td/engine/map";
import {
  DIFFICULTIES,
  priceOf,
  type Difficulty,
} from "@/games/bloons-td/engine/difficulty";
import {
  TOWERS,
  TOWER_ORDER,
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
import { BOSS_TIERS, waveOf } from "@/games/bloons-td/engine/waves";
import {
  type Bloon,
  type Burst,
  type Game,
  type Shot,
  type Target,
  type Tower,
  type Traits,
  type Waiting,
} from "@/games/bloons-td/engine/types";

/** Der Weg einer Karte, einmal abgelaufen, und seine Länge. */
export type Course = {
  readonly map: MapId;
  readonly track: readonly Spot[];
  readonly length: number;
};

/** Jeder Weg wird nur einmal abgelaufen. */
const COURSES = new Map<MapId, Course>();

/**
 * Der Weg einer Karte.
 *
 * @param map - welche Karte
 * @returns ihr Weg und seine Länge
 * @remarks
 * Der Weg hängt nur an der Karte, also wird er nur einmal abgelaufen und dann
 * aufgehoben - jedes Bild fragt danach, für jeden Ballon und jeden Turm.
 */
export function courseOf(map: MapId): Course {
  const known = COURSES.get(map);
  let course: Course;
  if (known === undefined) {
    const track = trackOf(map);
    course = { map, track, length: lengthOf(track) };
    COURSES.set(map, course);
  } else {
    course = known;
  }
  return course;
}

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

/** Wie lange ein Platzer zu sehen ist - und wie lange das Geld der Plantage. */
const BURST_LIFE = 0.35;
const CASH_LIFE = 1.4;

/** Wie groß ein Ballon ist, als Anteil einer Feldbreite. */
export const BLOON_SIZE = 0.3;

/** Was eine Runde einbringt: eine Grundzahl plus so viel je Runde. */
const PAYOUT = { base: 100, perRound: 6 } as const;

/**
 * Wie die Flieger fliegen, in Feldbreiten.
 *
 * @remarks
 * Der Hubschrauber bleibt so weit vor seinem Ziel stehen, wie `stop` sagt, und
 * schießt, sobald es näher als `shot` ist. Das Flugzeug kreist im Abstand
 * `orbit` um sein Feld.
 */
export const FLIGHT = { stop: 0.9, shot: 1.6, orbit: 1.5 } as const;

/**
 * Was der Trank des Alchemisten tut, solange er wirkt.
 *
 * @remarks
 * Kein eigener Turm, sondern ein Zuschlag auf einen anderen: schneller
 * nachladen, etwas weiter reichen, einen Ballon mehr je Geschoss.
 */
const BREW = { reload: 0.75, range: 1.1, pierce: 1 } as const;

/**
 * Wie zielsuchende Geschosse lenken.
 *
 * @remarks
 * `reach` ist, wie weit sie um sich schauen (in Feldbreiten), `turn`, wie
 * scharf sie dabei einlenken können (in Bogenmaß je Sekunde).
 */
const SEEK = { reach: 2.5, turn: 7 } as const;

/** Wie dicht die Nagelfabrik die Straße nach Plätzen absucht, in Feldbreiten. */
const DROP_STEP = 0.25;

/** Die kürzeste Flugzeit, damit niemand durch null teilt, in Sekunden. */
const MIN_FLIGHT = 0.001;

/** Alle wie viele Sekunden ein nachwachsender Ballon eine Schicht zurückbekommt. */
const REGROW = 2.5;

/**
 * Wie dick ein Schild ist: die Hälfte der Hülle, aber nie weniger als drei
 * Treffer - sonst wäre der Schild eines roten Ballons ein halber Treffer.
 */
const SHIELD = { share: 0.5, least: 3 } as const;

/** Wie weit die Ballons auseinanderliegen, die ein Boss ausspuckt, in Feldbreiten. */
const SPAWN_GAP = 0.4;

/** Wie groß der Einschlag eines Meteors aussieht, in Feldbreiten. */
const METEOR = 0.7;

/** Wie weit vor dem Ziel die Stachelkugel aufgesetzt wird, in Feldbreiten. */
const ROLL_AHEAD = 0.5;

/**
 * Eine frische Partie.
 *
 * @param map - auf welcher Karte
 * @param difficulty - wie schwer
 * @param boss - der Boss der Boss-Herausforderung, oder null
 * @returns der Zustand vor der ersten Runde
 */
export function createGame(
  map: MapId = "meadow",
  difficulty: Difficulty = "medium",
  boss: BloonKind | null = null,
): Game {
  return {
    phase: "ready",
    round: 0,
    money: DIFFICULTIES[difficulty].money,
    lives: DIFFICULTIES[difficulty].lives,
    towers: [],
    bloons: [],
    shots: [],
    bursts: [],
    waiting: [],
    clock: 0,
    popped: 0,
    leaked: 0,
    cheated: false,
    map,
    difficulty,
    freeplay: false,
    boss,
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
 * @returns true, wenn der Boden passt, nichts steht und das Geld reicht
 * @remarks
 * U-Boot und Boot stehen nur im Teich, alle anderen nur auf der Wiese.
 */
export function canBuild(
  game: Game,
  kind: TowerKind,
  col: number,
  row: number,
): boolean {
  const free = !game.towers.some((one) => one.col === col && one.row === row);
  const ground = TOWERS[kind].water
    ? isWater(game.map, col, row)
    : isGrass(game.map, col, row);
  return (
    ground &&
    free &&
    game.money >= priceOf(TOWERS[kind].cost, game.difficulty) &&
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
  const pad = middleOf(col, row);
  // Das Flugzeug startet schon auf seiner Bahn, sonst springt es beim ersten
  // Bild aus der Feldmitte hinaus.
  const start =
    TOWERS[kind].moves === "orbit"
      ? { x: pad.x + CELL * FLIGHT.orbit, y: pad.y }
      : pad;
  const tower: Tower = {
    id: game.nextId,
    kind,
    col,
    row,
    x: start.x,
    y: start.y,
    brew: 0,
    stunned: 0,
    loaded: 0,
    // **Wer noch nichts gesehen hat, schaut den Spieler an.** Nach rechts zu
    // schauen wäre genauso willkürlich, sähe aber aus wie ein Fehler - und
    // der Eisaffe, der sich nie dreht, behält diese Richtung für immer.
    aim: WATCH,
    faced: WATCH,
    kick: 0,
    tiers: NO_TIERS,
    pops: 0,
    target: "first",
  };
  return may
    ? {
        ...game,
        money: game.money - priceOf(TOWERS[kind].cost, game.difficulty),
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
        money: game.money + refundOf(game.difficulty, gone),
        towers: game.towers.filter((one) => one.id !== id),
      };
}

/**
 * Was ein Turm beim Verkauf einbringt, auf dieser Schwierigkeit.
 *
 * @param difficulty - die Schwierigkeit, für die Preise
 * @param tower - der Turm
 * @returns der Betrag, abgerundet
 */
export function refundOf(difficulty: Difficulty, tower: Tower): number {
  return Math.floor(
    refundOfTower(tower.kind, tower.tiers) * DIFFICULTIES[difficulty].price,
  );
}

/**
 * Welche Runde man überstehen muss, um zu gewinnen.
 *
 * @param game - die Partie
 * @returns die Zielrunde: die der Schwierigkeit, oder in der
 *   Boss-Herausforderung die der letzten Boss-Stufe
 */
export function goalOf(game: Game): number {
  const last = BOSS_TIERS[BOSS_TIERS.length - 1]?.round ?? 0;
  return game.boss === null ? DIFFICULTIES[game.difficulty].goal : last;
}

/**
 * Weiterspielen, nachdem das Ziel geschafft ist.
 *
 * @param game - die gewonnene Partie
 * @returns dieselbe Partie, bereit für die nächste Runde und ohne Ziel
 * @remarks
 * Wie im Vorbild der Freispiel-Modus: Es geht mit allem weiter, was steht,
 * und es kommt kein zweites "Gewonnen" - nur noch die Frage, wie lange es
 * hält.
 */
export function keepPlaying(game: Game): Game {
  return game.phase === "won"
    ? { ...game, phase: "ready", freeplay: true }
    : game;
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
    game.money >= priceOf(step.cost, game.difficulty) &&
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
        money: game.money - priceOf(step.cost, game.difficulty),
        towers: game.towers.map((one) =>
          one.id === id
            ? { ...one, tiers: { ...one.tiers, [path]: one.tiers[path] + 1 } }
            : one,
        ),
      }
    : game;
}

/**
 * Die Partie, in der dieser Turm auf jemand anderen zielt.
 *
 * @param game - die Partie
 * @param id - welcher Turm
 * @param target - auf wen er künftig zielt
 * @returns die neue Partie
 * @remarks
 * Kostet nichts und geht auch mitten in der Welle - wie im Vorbild.
 */
export function aimAt(game: Game, id: number, target: Target): Game {
  return {
    ...game,
    towers: game.towers.map((one) =>
      one.id === id ? { ...one, target } : one,
    ),
  };
}

/**
 * Ob es bei diesem Turm etwas einzustellen gibt.
 *
 * @param kind - welcher Turm
 * @returns true, wenn er sich ein Ziel sucht
 * @remarks
 * Wer nicht zielt, dem ist es gleich: Der Eisaffe pulsiert, der
 * Reißnagelwerfer und das Flugzeug werfen rundum, die Nagelfabrik streut, und
 * Plantage und Dorf schießen gar nicht.
 */
export function aims(kind: TowerKind): boolean {
  const shooting = TOWERS[kind].shooting;
  return (
    shooting === "single" ||
    shooting === "snipe" ||
    shooting === "lob" ||
    shooting === "roll"
  );
}

/**
 * Geschummelt: unendlich Geld.
 *
 * @param game - die Partie
 * @returns dieselbe Partie mit unendlich Geld - und nicht mehr für die Bestenliste
 */
export function rich(game: Game): Game {
  return game.phase === "over"
    ? game
    : { ...game, money: Infinity, cheated: true };
}

/**
 * Geschummelt: unendlich Leben.
 *
 * @param game - die Partie
 * @returns dieselbe Partie mit unendlich Leben - kein Ballon kostet mehr eines
 * @remarks
 * Unendlich minus alles ist unendlich: Die Rechnung der Runde bleibt, wie sie
 * ist, und verloren wird nie mehr.
 */
export function immortal(game: Game): Game {
  return game.phase === "over"
    ? game
    : { ...game, lives: Infinity, cheated: true };
}

/**
 * Geschummelt: Jedes freie Feld trägt den voll ausgebauten Turm, der dort am
 * meisten bringt.
 *
 * @param game - die Partie
 * @returns die neue Partie, oder die alte, wenn sie schon vorbei ist
 * @remarks
 * **Erst die Dörfer, dann der Rest.** Voll ausgebaute Affendörfer geben allen
 * Nachbarn Tarn-Erkennung und lassen sie jede Sorte treffen - damit ist jeder
 * Turm daneben ein Allesknacker. Also kommen zuerst so wenige Dörfer wie
 * möglich so aufs Feld, dass jedes freie Feld in Reichweite eines Dorfs
 * liegt. Jedes übrige Feld bekommt dann den Turm, der von dort aus den
 * meisten Schaden auf die Straße bringt ({@link worthAt}).
 *
 * Nie gebaut werden die Bananenplantage - bei geschenkten Türmen bringt sie
 * nichts - und der Alchemist, dessen Tränke Lych stiehlt. Die Türme kosten
 * nichts: Das Geld der Partie ist danach dasselbe wie vorher.
 */
export function stocked(game: Game): Game {
  let next: Game = { ...game, money: Infinity, cheated: true };

  for (const spot of villageSpots(next)) {
    next = maxed(next, "village", spot.col, spot.row);
  }
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const kind = bestAt(next, col, row);
      if (kind !== null) {
        next = maxed(next, kind, col, row);
      }
    }
  }

  return game.phase === "over" ? game : { ...next, money: game.money };
}

/**
 * Was der Schummelknopf für die freien Felder nie wählt - das Dorf kommt
 * vorher gezielt aufs Feld, Plantage und Alchemist gar nicht.
 */
const NEVER_CHEAT: readonly TowerKind[] = ["farm", "alchemist", "village"];

/** Die Stufen eines voll ausgebauten Turms. */
const MAXED = { one: MOST, two: MOST } as const;

/** Die Partie mit einem voll ausgebauten Turm mehr - wenn dort Platz ist. */
function maxed(game: Game, kind: TowerKind, col: number, row: number): Game {
  const built = build(game, kind, col, row);
  return built === game
    ? game
    : {
        ...built,
        towers: built.towers.map((tower, at) =>
          at === built.towers.length - 1 ? { ...tower, tiers: MAXED } : tower,
        ),
      };
}

/**
 * Wo die Dörfer hinkommen: gierig, immer dorthin, wo eines die meisten noch
 * nicht versorgten freien Felder erreicht - bis keines mehr übrig ist.
 */
function villageSpots(game: Game): readonly { col: number; row: number }[] {
  const reach = statsOf("village", MAXED).range;
  const free: { col: number; row: number }[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const taken = game.towers.some(
        (one) => one.col === col && one.row === row,
      );
      if (
        !taken &&
        (isGrass(game.map, col, row) || isWater(game.map, col, row))
      ) {
        free.push({ col, row });
      }
    }
  }

  const near = (
    a: { col: number; row: number },
    b: { col: number; row: number },
  ) => Math.hypot(a.col - b.col, a.row - b.row) * CELL <= reach;
  const chosen: { col: number; row: number }[] = [];
  let open = free;
  while (open.length > 0) {
    let best: { col: number; row: number } | null = null;
    let most = 0;
    for (const spot of free) {
      const used = chosen.some(
        (one) => one.col === spot.col && one.row === spot.row,
      );
      const count = open.filter((cell) => near(spot, cell)).length;
      if (!used && isGrass(game.map, spot.col, spot.row) && count > most) {
        best = spot;
        most = count;
      }
    }
    const pick = best;
    chosen.push(...(pick === null ? [] : [pick]));
    open =
      pick === null
        ? []
        : open.filter(
            (cell) =>
              !near(pick, cell) &&
              !(cell.col === pick.col && cell.row === pick.row),
          );
  }

  return chosen;
}

/** Der Turm, der auf diesem Feld am meisten bringt, oder null, wenn dort nichts geht. */
function bestAt(game: Game, col: number, row: number): TowerKind | null {
  const course = courseOf(game.map);
  let best: TowerKind | null = null;
  let most = 0;

  for (const kind of TOWER_ORDER) {
    if (!NEVER_CHEAT.includes(kind) && canBuild(game, kind, col, row)) {
      const worth = worthAt(kind, col, row, course);
      if (worth > most) {
        best = kind;
        most = worth;
      }
    }
  }

  return best;
}

/**
 * Wie viel ein voll ausgebauter Turm auf diesem Feld bringt - eine Schätzung.
 *
 * @remarks
 * Treffer je Sekunde mal Schaden, mal wie viel Straße er von dort erreicht.
 * Durchschlag zählt nur bis vier (so dicht stehen Ballons selten), ein Knall
 * dafür bis acht, ein Ring nur zu einem Viertel - die meisten seiner
 * Geschosse fliegen ins Gras. Wer die ganze Karte erreicht, zählt die ganze
 * Straße, ein Nagelhaufen landet ohnehin auf ihr.
 */
function worthAt(
  kind: TowerKind,
  col: number,
  row: number,
  course: Course,
): number {
  const monkey = statsOf(kind, MAXED);
  const at = middleOf(col, row);
  let road = 0;
  let all = 0;
  for (let gone = 0; gone < course.length; gone += CELL * DROP_STEP) {
    const spot = spotAt(course.track, gone);
    all += 1;
    if (Math.hypot(spot.x - at.x, spot.y - at.y) <= monkey.range) {
      road += 1;
    }
  }
  const global =
    monkey.shooting === "snipe" ||
    monkey.shooting === "lob" ||
    monkey.shooting === "drop";
  const reached = global ? all : road;
  const pierce =
    monkey.blast !== null
      ? Math.min(monkey.pierce, WORTH.blastPierce)
      : Math.min(monkey.pierce, WORTH.pierce);
  const spread =
    monkey.shooting === "ring" ? monkey.spokes * WORTH.ring : monkey.spokes;
  const rate = monkey.reload > 0 ? 1 / monkey.reload : 0;
  return rate * monkey.damage * pierce * spread * (reached / Math.max(all, 1));
}

/** Die Gewichte hinter {@link worthAt}. */
const WORTH = { pierce: 4, blastPierce: 8, ring: 0.25 } as const;

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

  for (const group of waveOf(round, game.boss)) {
    const traits: Traits = {
      camo: group.traits?.camo ?? false,
      regrow: group.traits?.regrow ?? false,
      fortified: group.traits?.fortified ?? false,
      shielded: group.traits?.shielded ?? false,
    };
    for (let one = 0; one < group.count; one += 1) {
      waiting.push({
        kind: group.kind,
        at: group.delay + one * group.gap,
        traits,
        scale: group.scale ?? 1,
      });
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
 * @remarks
 * Auch zwischen den Runden vergeht Zeit, aber nur für das, was man noch
 * sieht: Der letzte Knall einer Runde und das Geld der Plantagen sollen zu
 * Ende verblassen, statt mitten im Bild stehen zu bleiben.
 */
export function step(game: Game, dt: number): Game {
  const slice = Math.min(dt, MAX_FRAME);
  let next = game;

  if (game.phase === "running") {
    next = running(game, slice);
  } else if (game.bursts.length > 0) {
    next = { ...game, bursts: smoke(game.bursts, slice) };
  }

  return next;
}

/**
 * Die Werte eines Turms samt allem, was andere ihm geben.
 *
 * @param tower - der Turm
 * @param towers - alle Türme der Partie, er selbst eingeschlossen
 * @returns seine Werte mit Dorf und Trank
 * @remarks
 * {@link statsOf} kennt nur, was an diesem Turm gekauft wurde. Was ein
 * Affendorf in der Nähe oder ein Trank des Alchemisten dazugibt, hängt davon
 * ab, wer daneben steht - das weiß nur die Partie.
 */
export function powerOf(tower: Tower, towers: readonly Tower[]): Monkey {
  const at = towers.findIndex((one) => one.id === tower.id);
  const list = at < 0 ? [...towers, tower] : towers;
  const index = at < 0 ? list.length - 1 : at;
  return powersOf(list)[index] ?? statsOf(tower.kind, tower.tiers);
}

/**
 * Die Werte aller Türme samt Dorf und Trank, in derselben Reihenfolge.
 *
 * @remarks
 * **Mehrere Dörfer stapeln sich nicht**, wie im Vorbild: Es zählt das beste
 * von jedem - die weiteste Reichweite, das schnellste Nachladen, und wer
 * Tarnung sieht, sieht sie. Wer nicht schießt, bekommt nichts; einer Plantage
 * hilft es nicht, weiter zu reichen.
 */
function powersOf(towers: readonly Tower[]): readonly Monkey[] {
  const own = towers.map((one) => statsOf(one.kind, one.tiers));

  return towers.map((tower, at) => {
    const mine = own[at] ?? statsOf(tower.kind, tower.tiers);
    const here = middleOf(tower.col, tower.row);
    let range = 1;
    let reload = 1;
    let sees = false;
    let any = false;

    for (const [from, other] of towers.entries()) {
      const lend = own[from];
      const there = middleOf(other.col, other.row);
      const near =
        lend !== undefined &&
        other.id !== tower.id &&
        Math.hypot(there.x - here.x, there.y - here.y) <= lend.range;
      if (near) {
        range = Math.max(range, lend.auraRange);
        reload = Math.min(reload, lend.auraReload);
        sees = sees || lend.auraSees;
        any = any || lend.auraAny;
      }
    }

    const brewed = tower.brew > 0;
    return mine.shooting === "none"
      ? mine
      : {
          ...mine,
          range: mine.range * range * (brewed ? BREW.range : 1),
          reload: mine.reload * reload * (brewed ? BREW.reload : 1),
          pierce: mine.pierce + (brewed ? BREW.pierce : 0),
          sees: mine.sees || sees,
          harm: any ? "normal" : mine.harm,
        };
  });
}

/** Ein Bild, während eine Welle läuft. */
function running(game: Game, slice: number): Game {
  const course = courseOf(game.map);
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
  const fresh: Bloon[] = started.map((one) => spawned(nextId++, one, clock));

  // Dann laufen alle - und wer hinten hinausläuft, kostet Leben. Der goldene
  // kostet nichts, ein Boss alles.
  const walked: Bloon[] = [];
  for (const bloon of [...game.bloons, ...fresh]) {
    const breed = BLOONS[bloon.kind];
    const gone = bloon.gone + paceOf(bloon, clock) * slice;
    // Ätzender Klebstoff frisst, solange der Klebstoff hält.
    const bitten =
      bloon.bite > 0 && clock >= bloon.bite && clock < bloon.slowed;
    const eaten = bitten ? wound(bloon, 1) : bloon;
    const bite = bitten
      ? clock + (bloon.bite - (bloon.bite - BITE))
      : bloon.bite;
    if (gone >= course.length) {
      lives -= breed.costly ? breed.rbe : 0;
      leaked += 1;
    } else {
      walked.push(regrown({ ...eaten, gone, bite }, clock));
    }
  }

  // Die Bosse setzen ihre Fähigkeiten ein - bevor die Türme schießen, damit
  // ein gelähmter Turm in diesem Bild auch wirklich nicht schießt.
  const bossed = bossesAct(walked, game.towers, clock, nextId, course);
  nextId = bossed.nextId;
  walked.push(...bossed.spawned);
  bursts.push(...bossed.bursts);

  // **Wer etwas zum Platzen bringt, bekommt es angeschrieben.** Die Zahl
  // steht später an seinem Turm, damit man zwei gleich aussehende Affen
  // auseinanderhalten kann.
  const credit = new Map<number, number>();

  // Die Türme zielen auf das, was am weitesten ist - mit dem, was Dorf und
  // Trank ihnen in diesem Augenblick geben.
  const powers = powersOf(bossed.towers);
  const shots: Shot[] = [];
  const brewers: number[] = [];
  const fired = bossed.towers.map((tower, at) => {
    const power = powers[at] ?? statsOf(tower.kind, tower.tiers);
    const made = fire(tower, power, walked, clock, nextId, slice, course);
    nextId = made.nextId;
    shots.push(...made.shots);
    bursts.push(...made.bursts);
    // Der Eisaffe schießt nicht, er friert - das passiert sofort.
    for (const hit of made.frozen) {
      strike(walked, hit, power, clock, credit, tower.id);
    }
    // Und der Scharfschütze trifft im selben Augenblick, in dem er abdrückt.
    for (const hit of made.struck) {
      strike(walked, hit, power, clock, credit, tower.id);
    }
    if (made.brews) {
      brewers.push(at);
    }
    return made.tower;
  });
  const towers = brewed(fired, brewers, powers);

  // Und was fliegt, trifft.
  const flown = fly(
    [...game.shots, ...shots],
    walked,
    clock,
    slice,
    credit,
    course,
  );
  bursts.push(...flown.bursts);

  // Wer durch ist, platzt - und hinterlässt, was in ihm steckte.
  const left: Bloon[] = [];
  for (const bloon of flown.bloons) {
    if (bloon.hull > 0) {
      left.push(bloon);
    } else {
      const breed = BLOONS[bloon.kind];
      // Gold und Bosse bringen beim Platzen eine Prämie.
      money += 1 + breed.bonus;
      popped += 1;
      bursts.push(burst(bloon, breed.paint, course));
      for (const [at, kind] of breed.inside.entries()) {
        left.push(born(nextId++, kind, bloon, at, clock));
      }
    }
  }

  const done = waiting.length === 0 && left.length === 0;
  const beaten = lives <= 0;
  const paid = done && !beaten;
  // **Wer die Zielrunde übersteht, hat gewonnen** - und darf danach wählen, ob
  // er weiterspielt.
  const won = paid && !game.freeplay && game.round >= goalOf(game);

  // **Die Plantagen zahlen am Ende der Runde**, zusammen mit der Prämie - und
  // man sieht es an jeder einzelnen.
  let harvest = 0;
  if (paid) {
    for (const [at, tower] of towers.entries()) {
      const income = powers[at]?.income ?? 0;
      if (income > 0) {
        harvest += income;
        bursts.push(cash(tower));
      }
    }
  }

  // Erst jetzt stehen alle Treffer fest.
  const scored = towers.map((one) => {
    const got = credit.get(one.id) ?? 0;
    return got === 0 ? one : { ...one, pops: one.pops + got };
  });

  return {
    ...game,
    phase: beaten ? "over" : won ? "won" : done ? "ready" : "running",
    clock,
    money:
      money + (paid ? PAYOUT.base + game.round * PAYOUT.perRound + harvest : 0),
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

/**
 * Wie schnell ein Ballon gerade läuft, in Bildpunkten je Sekunde.
 *
 * @remarks
 * **Zwei Uhren, in dieser Reihenfolge**: Solange die erste läuft, steht er
 * oder kriecht; danach gilt noch der Nachlauf des Permafrosts.
 */
function paceOf(bloon: Bloon, clock: number): number {
  const slow =
    clock < bloon.slowed
      ? bloon.slowTo
      : clock < bloon.thawed
        ? bloon.thawTo
        : 1;
  return BASE_PACE * BLOONS[bloon.kind].pace * slow;
}

/**
 * Ein Treffer ohne Geschoss: Frost oder Scharfschuss.
 *
 * @param bloons - alle Ballons, werden an Ort und Stelle geändert
 * @param id - wen es trifft
 * @param power - die Werte des Turms, der trifft
 * @param clock - die Uhr der Runde
 * @param credit - das Konto der Türme
 * @param by - wer trifft
 */
function strike(
  bloons: Bloon[],
  id: number,
  power: Monkey,
  clock: number,
  credit: Map<number, number>,
  by: number,
): void {
  const at = bloons.findIndex((one) => one.id === id);
  const bloon = bloons[at];
  if (bloon !== undefined) {
    const hit = wound(bloon, power.damage);
    if (bloon.hull > 0 && hit.hull <= 0) {
      score(credit, by);
    }
    const hold = held(bloon, power.slow, power.slowTo, clock);
    const holds = hold.slowed !== bloon.slowed;
    // Permafrost: Nach dem Auftauen bleibt er so lange zäh, wie der Frost
    // gedauert hat - aber nur, wen der Frost auch gehalten hat.
    const perma = holds && power.afterTo < 1;
    bloons[at] = {
      ...hit,
      ...hold,
      thawed: perma ? clock + power.slow * 2 : bloon.thawed,
      thawTo: perma ? power.afterTo : bloon.thawTo,
      soak: bloon.soak || (holds && power.soak),
    };
  }
}

/**
 * Ein Ballon, wie er frisch aus dem Wartebereich auf den Weg kommt.
 *
 * @remarks
 * Hier landen die Zusatzeigenschaften: Verstärkt verdoppelt die Hülle von
 * Blei, Keramik und Zeppelinen, ein Schild kommt obendrauf, und ein Boss
 * stellt seine Uhr für die erste Fähigkeit.
 */
function spawned(id: number, one: Waiting, clock: number): Bloon {
  const breed = BLOONS[one.kind];
  const hull = hullOf(one.kind, one.traits.fortified, one.scale);
  return {
    id,
    kind: one.kind,
    gone: 0,
    hull,
    slowed: 0,
    slowTo: 1,
    thawed: 0,
    thawTo: 1,
    soak: false,
    bite: 0,
    full: hull,
    camo: one.traits.camo || breed.camo,
    regrow: one.traits.regrow,
    top: one.kind,
    regrowAt: clock + REGROW,
    fortified: one.traits.fortified,
    shield: one.traits.shielded
      ? Math.max(SHIELD.least, Math.ceil(hull * SHIELD.share))
      : 0,
    skill: clock + (EVERY[one.kind] ?? 0),
    phased: 0,
    ward: null,
  };
}

/** Wie viel die Hülle einer Sorte aushält - verstärkt und für Bosse gestreckt. */
function hullOf(kind: BloonKind, fortified: boolean, scale: number): number {
  const breed = BLOONS[kind];
  const doubled = fortified && breed.fortifiable ? 2 : 1;
  return Math.round(breed.hull * doubled * scale);
}

/**
 * Ein Ballon nach einem Treffer.
 *
 * @remarks
 * **Erst der Schild, dann die Hülle.** Was der Schild nicht mehr abfängt, geht
 * auf die Hülle - ein Treffer, der den Schild sprengt, ist nicht verloren.
 */
function wound(bloon: Bloon, damage: number): Bloon {
  const caught = Math.min(bloon.shield, damage);
  return {
    ...bloon,
    shield: bloon.shield - caught,
    hull: bloon.hull - (damage - caught),
  };
}

/**
 * Ob diese Schadensart diesen Ballon gerade überhaupt erreicht.
 *
 * @remarks
 * Drei Gründe, warum nicht: Die Sorte ist dagegen gefeit, der Steinpanzer des
 * Dreadbloon schützt gerade dagegen (nur, solange er hält), oder Phayze ist
 * gerade verschoben.
 */
function open(bloon: Bloon, harm: Harm, clock: number): boolean {
  const warded = bloon.ward === harm && bloon.shield > 0;
  return hurts(bloon.kind, harm) && !warded && bloon.phased <= clock;
}

/**
 * Wie lange und wie stark ein Ballon nach einem Treffer gebremst ist.
 *
 * @remarks
 * **Zeppeline und Bosse lassen sich nicht einfrieren**, nur bremsen - und die
 * ganz großen (B.A.D. und die Bosse) nicht einmal das. Ein Eisaffe, der eine
 * Z.O.M.G. anhält, wäre das Ende jeder Runde.
 */
function held(
  bloon: Bloon,
  slow: number,
  slowTo: number,
  clock: number,
): { readonly slowed: number; readonly slowTo: number } {
  const breed = BLOONS[bloon.kind];
  const frozen = slowTo === 0 && breed.class !== "bloon";
  const may = slow > 0 && !breed.steady && !frozen;
  return may
    ? { slowed: clock + slow, slowTo }
    : { slowed: bloon.slowed, slowTo: bloon.slowTo };
}

/** Wie weit ein Treffer diesen Ballon zurückwirft - Zeppeline und Bosse gar nicht. */
function pushOf(bloon: Bloon, push: number): number {
  return BLOONS[bloon.kind].class === "bloon" ? push : 0;
}

/**
 * Ein nachwachsender Ballon, einen Augenblick später.
 *
 * @remarks
 * Ist seine Uhr abgelaufen und ist er kleiner als beim Start, wird er zu der
 * Sorte, in der er steckte - mit frischer Hülle. Über die Sorte, mit der er
 * losgelaufen ist, wächst er nie hinaus.
 */
function regrown(bloon: Bloon, clock: number): Bloon {
  const due = bloon.regrow && clock >= bloon.regrowAt;
  const parent =
    due && bloon.kind !== bloon.top ? parentIn(bloon.top, bloon.kind) : null;
  let next = bloon;

  if (parent !== null) {
    const hull = hullOf(parent, bloon.fortified, 1);
    next = {
      ...bloon,
      kind: parent,
      hull,
      full: hull,
      regrowAt: clock + REGROW,
    };
  } else if (due) {
    next = { ...bloon, regrowAt: clock + REGROW };
  }

  return next;
}

/**
 * In welcher Sorte diese Sorte steckt, gesucht von oben nach unten.
 *
 * @param top - womit der Ballon losgelaufen ist
 * @param kind - was er jetzt ist
 * @returns die Sorte eine Schicht darüber, oder null
 * @remarks
 * Ein weißer Ballon kann aus einem Zebra stammen oder aus einem Regenbogen
 * darüber - welche es ist, entscheidet, womit er losgelaufen ist.
 */
function parentIn(top: BloonKind, kind: BloonKind): BloonKind | null {
  const queue: BloonKind[] = [top];
  const seen = new Set<BloonKind>();
  let found: BloonKind | null = null;

  while (queue.length > 0 && found === null) {
    const one = queue.shift() ?? top;
    seen.add(one);
    const inside = BLOONS[one].inside;
    if (inside.includes(kind)) {
      found = one;
    } else {
      queue.push(...inside.filter((child) => !seen.has(child)));
    }
  }

  return found;
}

/** Was die Bosse in diesem Bild anrichten. */
type Bossed = {
  readonly towers: readonly Tower[];
  readonly spawned: readonly Bloon[];
  readonly bursts: readonly Burst[];
  readonly nextId: number;
};

/**
 * Die Bosse, deren Uhr abgelaufen ist, setzen ihre Fähigkeit ein.
 *
 * @param bloons - alle Ballons, die Bosse darunter werden an Ort und Stelle geändert
 * @param towers - alle Türme
 * @param clock - die Uhr der Runde
 * @param nextId - die nächste freie Nummer
 * @returns die Türme danach, was ausgespuckt wurde und was man davon sieht
 */
function bossesAct(
  bloons: Bloon[],
  towers: readonly Tower[],
  clock: number,
  nextId: number,
  course: Course,
): Bossed {
  let next = [...towers];
  const spawnedNow: Bloon[] = [];
  const bursts: Burst[] = [];
  let id = nextId;

  for (const [at, bloon] of bloons.entries()) {
    const every = EVERY[bloon.kind];
    if (every !== undefined && clock >= bloon.skill) {
      const spot = spotAt(course.track, bloon.gone);
      const act = skillOf(bloon.kind, bloon.ward);
      let boss: Bloon = { ...bloon, skill: clock + every };

      switch (act.does) {
        case "stun":
          next = next.map((tower) =>
            Math.hypot(tower.x - spot.x, tower.y - spot.y) <= CELL * act.reach
              ? { ...tower, stunned: Math.max(tower.stunned, act.seconds) }
              : tower,
          );
          bursts.push(
            flash("stun", spot, CELL * act.reach, BLOONS[bloon.kind].paint),
          );
          break;
        case "meteor": {
          const hit = next[Math.floor(scatter(id + bloon.id) * next.length)];
          if (hit !== undefined) {
            next = next.map((tower) =>
              tower.id === hit.id
                ? { ...tower, stunned: Math.max(tower.stunned, act.seconds) }
                : tower,
            );
            bursts.push(flash("blast", hit, CELL * METEOR, BLAST_PAINT));
          }
          id += 1;
          break;
        }
        case "spawn":
          for (let one = 0; one < act.count; one += 1) {
            const child = born(id++, act.kind, boss, one + 1, clock);
            spawnedNow.push({
              ...child,
              gone: Math.max(0, boss.gone - (one + 1) * CELL * SPAWN_GAP),
            });
          }
          bursts.push(
            flash("pop", spot, CELL * BLOON_SIZE * 2, BLOONS[bloon.kind].paint),
          );
          break;
        case "heal": {
          // **Lych stiehlt Tränke**: Jeder Turm, der gerade einen hat, verliert
          // ihn - und Lych heilt sich dafür.
          const brewed = next.filter((tower) => tower.brew > 0).length;
          next = next.map((tower) =>
            tower.brew > 0 ? { ...tower, brew: 0 } : tower,
          );
          const gain = Math.round(
            boss.full * Math.min(act.most, act.share + act.perBrew * brewed),
          );
          boss = { ...boss, hull: Math.min(boss.full, boss.hull + gain) };
          bursts.push(flash("pop", spot, CELL * BLOON_SIZE * 2, HEAL_PAINT));
          break;
        }
        case "armor":
          boss = {
            ...boss,
            shield: Math.round(boss.full * act.share),
            ward: act.ward,
          };
          bursts.push(
            flash("pop", spot, CELL * BLOON_SIZE * 2, BLOONS[bloon.kind].line),
          );
          break;
        case "phase":
          boss = { ...boss, phased: clock + act.seconds };
          break;
        case "nothing":
          break;
      }
      bloons[at] = boss;
    }
  }

  return { towers: next, spawned: spawnedNow, bursts, nextId: id };
}

/** Die Farbe, in der Lych aufleuchtet, wenn er sich heilt. */
const HEAL_PAINT = "#4ade80";

/** Ein kurzer Knall an einer Stelle. */
function flash(
  look: Burst["look"],
  at: Spot,
  reach: number,
  paint: string,
): Burst {
  return {
    look,
    x: at.x,
    y: at.y,
    reach,
    age: 0,
    life: BURST_LIFE,
    paint,
    from: null,
  };
}

/**
 * Die Türme, nachdem die Alchemisten ihre Tränke verteilt haben.
 *
 * @param towers - alle Türme nach dem Schießen
 * @param brewers - wer in diesem Bild einen Trank verteilt
 * @param powers - ihre Werte, für Reichweite und Dauer
 * @returns die Türme mit frischem Trank
 * @remarks
 * **Ein Trank geht an den nächsten Nachbarn, der gerade keinen hat** - wie
 * beim Klebstoffschützen: Ein zweiter Trank auf denselben Turm verlängert nur
 * eine Uhr, die ohnehin läuft. Alchemisten geben sich selbst und einander
 * nichts.
 */
function brewed(
  towers: readonly Tower[],
  brewers: readonly number[],
  powers: readonly Monkey[],
): readonly Tower[] {
  const next = [...towers];

  for (const at of brewers) {
    const brewer = next[at];
    const power = powers[at];
    if (brewer !== undefined && power !== undefined) {
      const here = middleOf(brewer.col, brewer.row);
      let best = -1;
      let bestGap = Infinity;
      for (const [other, tower] of next.entries()) {
        const there = middleOf(tower.col, tower.row);
        const gap = Math.hypot(there.x - here.x, there.y - here.y);
        const may =
          tower.kind !== "alchemist" &&
          tower.brew <= 0 &&
          TOWERS[tower.kind].shooting !== "none" &&
          gap <= power.range;
        if (may && gap < bestGap) {
          best = other;
          bestGap = gap;
        }
      }
      const lucky = next[best];
      if (lucky !== undefined) {
        next[best] = { ...lucky, brew: power.brew };
      }
    }
  }

  return next;
}

/**
 * Ein Ballon, der aus einem größeren zum Vorschein kommt.
 *
 * @remarks
 * Tarnung, Nachwachsen und Verstärkung erbt er - aus einem verstärkten MOAB
 * kommen verstärkte Keramik, und aus einem D.D.T. getarnte, nachwachsende.
 * Den Schild erbt er nicht, der gehörte der äußeren Hülle. Und ein Ballon aus
 * einem Zeppelin wächst nie zu einem Zeppelin nach.
 */
function born(
  id: number,
  kind: BloonKind,
  from: Bloon,
  at: number,
  clock: number,
): Bloon {
  const hull = hullOf(kind, from.fortified, 1);
  return {
    id,
    kind,
    // Ein Stück auseinander, sonst liegen sie exakt übereinander und sehen aus
    // wie einer.
    gone: Math.max(0, from.gone - at * CELL * BLOON_SIZE),
    hull,
    full: hull,
    camo: from.camo,
    regrow: from.regrow || from.kind === "ddt",
    top: BLOONS[from.top].class === "bloon" ? from.top : kind,
    regrowAt: clock + REGROW,
    fortified: from.fortified,
    shield: 0,
    skill: 0,
    phased: 0,
    ward: null,
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
function burst(bloon: Bloon, paint: string, course: Course): Burst {
  const at = spotAt(course.track, bloon.gone);
  return {
    look: "pop",
    x: at.x,
    y: at.y,
    reach: CELL * BLOON_SIZE,
    age: 0,
    life: BURST_LIFE,
    paint,
    from: null,
  };
}

/** Das Geld, das über einer Plantage aufsteigt. */
function cash(tower: Tower): Burst {
  const at = middleOf(tower.col, tower.row);
  return {
    look: "cash",
    x: at.x,
    y: at.y,
    reach: CELL * CASH_RISE,
    age: 0,
    life: CASH_LIFE,
    paint: CASH_PAINT,
    from: null,
  };
}

/** Wie hoch das Geld über der Plantage aufsteigt, in Feldbreiten. */
const CASH_RISE = 0.6;

/** Die Farbe der Bananen. */
const CASH_PAINT = "#facc15";

/** Die Platzer, einen Augenblick später. */
function smoke(bursts: readonly Burst[], slice: number): readonly Burst[] {
  return bursts
    .map((one) => ({ ...one, age: one.age + slice }))
    .filter((one) => one.age < one.life);
}

/** Was ein Turm in diesem Bild tut. */
type Fired = {
  readonly tower: Tower;
  readonly shots: readonly Shot[];
  /** Wen er ohne Geschoss erwischt: Frost oder Scharfschuss. */
  readonly frozen: readonly number[];
  readonly struck: readonly number[];
  /** Frostwellen und Leuchtspuren. */
  readonly bursts: readonly Burst[];
  /** Ob er einem Nachbarn einen Trank gibt. */
  readonly brews: boolean;
  readonly nextId: number;
};

/** Was ein Turm in diesem Bild abfeuert. */
function fire(
  tower: Tower,
  monkey: Monkey,
  bloons: readonly Bloon[],
  clock: number,
  nextId: number,
  slice: number,
  course: Course,
): Fired {
  const pad = middleOf(tower.col, tower.row);
  // **Der Eisaffe sucht sich niemanden.** Er wirft nichts, er lässt in seinem
  // Umkreis regelmäßig eine Frostwelle los - ob dabei jemand in der Nähe ist,
  // ändert daran nichts, nur daran, ob sie jemanden erwischt. Dasselbe gilt
  // für alles, was ohnehin schießt (Flugzeug, Nagelfabrik).
  const beats = monkey.shooting === "pulse";
  // Wer betäubt ist, tut nichts - er sucht nicht einmal ein Ziel.
  const dazed = tower.stunned > 0;
  const idle = monkey.shooting === "none" || dazed;
  const target =
    beats || idle
      ? null
      : leader(
          bloons,
          pad,
          monkey.range,
          monkey.picks,
          clock,
          monkey.sees,
          tower.target,
          course,
        );
  const seen = target === null ? null : spotAt(course.track, target.gone);
  // Wer fliegt, fliegt zuerst - geschossen wird von dort, wo er dann ist.
  const where = dazed
    ? { x: tower.x, y: tower.y, heading: null }
    : flown(tower, monkey, pad, seen, slice);
  const at = { x: where.x, y: where.y };
  const close =
    seen !== null &&
    (monkey.moves !== "hover" ||
      Math.hypot(seen.x - at.x, seen.y - at.y) <= CELL * FLIGHT.shot);
  // **Nachgeladen wird in der Zeit, die das Bild gedauert hat.** Stand hier
  // eine feste Zahl, hing die Schussfolge an der Bildrate: Mit einem pauschalen
  // Zwanzigstel je Bild feuerte bei sechzig Bildern jeder Turm dreimal so oft,
  // wie in seiner Tabelle steht - und die Tabelle rechnet in Sekunden.
  const loaded = Math.max(0, tower.loaded - slice);
  const free = beats || monkey.always;
  const shoots = !idle && loaded <= 0 && (free || close);
  // Das Rohr schwenkt jedes Bild ein Stück weiter, ob geschossen wird oder
  // nicht - sonst steht es zwischen zwei Schüssen still und ruckt dann.
  const want =
    where.heading ??
    (seen === null ? tower.faced : Math.atan2(seen.y - at.y, seen.x - at.x));
  const shots: Shot[] = [];
  const frozen: number[] = [];
  const struck: number[] = [];
  const bursts: Burst[] = [];
  let id = nextId;
  let aim = tower.aim;

  if (shoots) {
    if (seen !== null) {
      aim = Math.atan2(seen.y - at.y, seen.x - at.x);
    }
    switch (monkey.shooting) {
      case "pulse":
        bursts.push({
          look: "frost",
          x: at.x,
          y: at.y,
          reach: monkey.range,
          age: 0,
          life: BURST_LIFE,
          paint: monkey.paint,
          from: null,
        });
        frozen.push(...frostOf(bloons, at, monkey, clock, course));
        break;
      case "snipe":
        if (
          target !== null &&
          seen !== null &&
          open(target, monkey.harm, clock)
        ) {
          struck.push(target.id);
        }
        if (seen !== null) {
          bursts.push({
            look: "tracer",
            x: seen.x,
            y: seen.y,
            reach: CELL * BLOON_SIZE,
            age: 0,
            life: BURST_LIFE,
            paint: monkey.paint,
            from: at,
          });
        }
        break;
      case "lob":
        if (target !== null) {
          shots.push(lobbed(id++, tower, monkey, at, target, clock, course));
        }
        break;
      case "drop":
        shots.push(dropped(id, tower, monkey, at, pad, course));
        id += 1;
        break;
      case "roll":
        if (target !== null) {
          shots.push(rolled(id++, tower, monkey, target, course));
        }
        break;
      case "ring":
        for (let one = 0; one < monkey.spokes; one += 1) {
          const turn = (one / monkey.spokes) * Math.PI * 2;
          shots.push(thrown(id++, tower, monkey, at, turn));
        }
        break;
      case "single":
        for (let one = 0; one < monkey.spokes; one += 1) {
          // Ein Fächer liegt mittig um die Zielrichtung.
          const turn = aim + (one - (monkey.spokes - 1) / 2) * monkey.fan;
          shots.push(thrown(id++, tower, monkey, at, turn));
        }
        break;
    }
  }

  return {
    tower: {
      ...tower,
      x: at.x,
      y: at.y,
      brew: Math.max(0, tower.brew - slice),
      stunned: Math.max(0, tower.stunned - slice),
      loaded: shoots ? monkey.reload : loaded,
      aim,
      faced: swung(tower.faced, want, slice),
      kick: shoots ? 1 : Math.max(0, tower.kick - slice / SWING.kick),
    },
    shots,
    frozen,
    struck,
    bursts,
    brews: shoots && monkey.brew > 0,
    nextId: id,
  };
}

/**
 * Wo ein Turm nach diesem Bild ist - und wohin er dabei fliegt.
 *
 * @remarks
 * Die meisten stehen. Der **Hubschrauber** fliegt dem vordersten Ballon im
 * Umkreis seines Landeplatzes hinterher und bleibt kurz vor ihm stehen; ohne
 * Ziel kehrt er heim. Das **Flugzeug** kreist im festen Abstand um sein Feld,
 * ob es etwas zu tun gibt oder nicht - und schaut dabei in Flugrichtung.
 */
function flown(
  tower: Tower,
  monkey: Monkey,
  pad: Spot,
  seen: Spot | null,
  slice: number,
): { readonly x: number; readonly y: number; readonly heading: number | null } {
  let x = tower.x;
  let y = tower.y;
  let heading: number | null = null;

  switch (monkey.moves) {
    case "hover": {
      const goal = seen ?? pad;
      const stop = seen === null ? 0 : CELL * FLIGHT.stop;
      const gap = Math.hypot(goal.x - x, goal.y - y);
      const go = Math.max(0, Math.min(gap - stop, monkey.fly * slice));
      if (gap > 0 && go > 0) {
        x += ((goal.x - x) / gap) * go;
        y += ((goal.y - y) / gap) * go;
      }
      break;
    }
    case "orbit": {
      const radius = CELL * FLIGHT.orbit;
      const turn =
        Math.atan2(y - pad.y, x - pad.x) + (monkey.fly / radius) * slice;
      x = pad.x + Math.cos(turn) * radius;
      y = pad.y + Math.sin(turn) * radius;
      heading = turn + Math.PI / 2;
      break;
    }
    case "stay":
      break;
  }

  return { x, y, heading };
}

/**
 * Wen eine Frostwelle erwischt.
 *
 * @remarks
 * **Er friert nicht alles ein, sondern die vordersten so viele, wie er
 * fassen kann.** Ein Frost ohne Grenze wäre bei dreißig Ballons auf dem Bild
 * kein Turm mehr, sondern ein Schalter.
 */
function frostOf(
  bloons: readonly Bloon[],
  at: Spot,
  monkey: Monkey,
  clock: number,
  course: Course,
): readonly number[] {
  return bloons
    .filter((bloon) => {
      const spot = spotAt(course.track, bloon.gone);
      const near = Math.hypot(spot.x - at.x, spot.y - at.y) <= monkey.range;
      const reached = monkey.cold || open(bloon, monkey.harm, clock);
      return near && reached && bloon.phased <= clock;
    })
    .sort((a, b) => b.gone - a.gone)
    .slice(0, monkey.pierce)
    .map((bloon) => bloon.id);
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
    seek: monkey.seek,
    push: monkey.push,
    road: null,
    land: null,
    hit: [],
  };
}

/**
 * Eine Mörsergranate.
 *
 * @remarks
 * **Gezielt wird dorthin, wo der Ballon sein wird**, nicht dorthin, wo er
 * ist: Die Granate ist so lange unterwegs, wie `life` sagt, und ein rosa
 * Ballon läuft in dieser Zeit fast drei Felder. Wer danach abbremst oder
 * zurückgeweht wird, entgeht ihr - wie im Vorbild.
 */
function lobbed(
  id: number,
  tower: Tower,
  monkey: Monkey,
  at: Spot,
  target: Bloon,
  clock: number,
  course: Course,
): Shot {
  const ahead = Math.min(
    course.length,
    target.gone + paceOf(target, clock) * monkey.life,
  );
  const land = spotAt(course.track, ahead);
  const flight = Math.max(monkey.life, MIN_FLIGHT);
  return {
    ...thrown(id, tower, monkey, at, 0),
    vx: (land.x - at.x) / flight,
    vy: (land.y - at.y) / flight,
    land: { x: land.x, y: land.y, at: flight },
  };
}

/**
 * Ein Nagelhaufen der Nagelfabrik.
 *
 * @remarks
 * Er landet auf einem Stück Straße in ihrer Reichweite - welchem, entscheidet
 * die Nummer des Geschosses, damit die Haufen sich verteilen und die Partie
 * trotzdem nachrechenbar bleibt. Liegt keine Straße in Reichweite, fällt er
 * neben die Fabrik.
 */
function dropped(
  id: number,
  tower: Tower,
  monkey: Monkey,
  at: Spot,
  pad: Spot,
  course: Course,
): Shot {
  const spots: Spot[] = [];
  for (let gone = 0; gone < course.length; gone += CELL * DROP_STEP) {
    const spot = spotAt(course.track, gone);
    if (Math.hypot(spot.x - pad.x, spot.y - pad.y) <= monkey.range) {
      spots.push(spot);
    }
  }
  const land = spots[Math.floor(scatter(id) * spots.length)] ?? pad;
  const flight = Math.max(
    Math.hypot(land.x - at.x, land.y - at.y) / Math.max(monkey.speed, 1),
    MIN_FLIGHT,
  );
  return {
    ...thrown(id, tower, monkey, at, 0),
    vx: (land.x - at.x) / flight,
    vy: (land.y - at.y) / flight,
    land: { x: land.x, y: land.y, at: flight },
  };
}

/**
 * Eine Stachelkugel, kurz vor dem Ziel auf die Straße gesetzt.
 *
 * @remarks
 * Sie rollt rückwärts, also den Ballons entgegen - wie eine Kugel, die man
 * einen Hang hinunterschickt, den sie heraufkommen. Ihr Tempo steht in `vx`,
 * denn eine Richtung braucht sie nicht: Die gibt ihr die Straße.
 */
function rolled(
  id: number,
  tower: Tower,
  monkey: Monkey,
  target: Bloon,
  course: Course,
): Shot {
  const road = Math.min(course.length, target.gone + CELL * ROLL_AHEAD);
  const at = spotAt(course.track, road);
  return {
    ...thrown(id, tower, monkey, at, 0),
    vx: monkey.speed,
    vy: 0,
    road,
  };
}

/**
 * Eine Zahl zwischen null und eins, die nur von der Nummer abhängt.
 *
 * @remarks
 * Kein echter Zufall, denn die Engine soll nachrechenbar bleiben - aber
 * verstreut genug, dass zwei Haufen hintereinander nicht auf derselben
 * Stelle landen.
 */
function scatter(id: number): number {
  const wave = Math.sin(id * SCATTER.a) * SCATTER.b;
  return wave - Math.floor(wave);
}

/** Die beiden Zahlen hinter {@link scatter}. */
const SCATTER = { a: 12.9898, b: 43758.5453 } as const;

/**
 * Der Ballon in Reichweite, der am weitesten ist.
 *
 * @param bloons - alle Ballons auf dem Weg
 * @param at - wo der Turm steht
 * @param range - wie weit er reicht
 * @param picks - ob ihm jeder recht ist oder nur ein ungebremster
 * @param clock - die Uhr der Runde, für genau diese Frage
 * @param sees - ob der Turm getarnte Ballons sieht
 * @param target - ob der erste, der letzte oder der stärkste gewählt wird
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
  sees: boolean,
  target: Target,
  course: Course,
): Bloon | null {
  let best: Bloon | null = null;

  for (const bloon of bloons) {
    const spot = spotAt(course.track, bloon.gone);
    const near = Math.hypot(spot.x - at.x, spot.y - at.y) <= range;
    const may = picks === "front" || bloon.slowed <= clock;
    // Getarnte sieht nur, wer Tarnung sieht; einen verschobenen Phayze keiner.
    const visible = (sees || !bloon.camo) && bloon.phased <= clock;
    if (
      near &&
      may &&
      visible &&
      (best === null || better(bloon, best, target))
    ) {
      best = bloon;
    }
  }

  return best;
}

/**
 * Ob ein Ballon nach dieser Zielwahl vor einem anderen kommt.
 *
 * @remarks
 * Beim stärksten zählt, wie viele Treffer in ihm stecken, und bei Gleichstand
 * der, der weiter ist - zwei gleiche Keramik sind gleich stark, aber die
 * vordere kommt zuerst durch.
 */
function better(bloon: Bloon, than: Bloon, target: Target): boolean {
  let result: boolean;
  switch (target) {
    case "last":
      result = bloon.gone < than.gone;
      break;
    case "strong": {
      const mine = BLOONS[bloon.kind].rbe;
      const theirs = BLOONS[than.kind].rbe;
      result = mine > theirs || (mine === theirs && bloon.gone > than.gone);
      break;
    }
    case "first":
      result = bloon.gone > than.gone;
      break;
  }
  return result;
}

/** Was fliegt, und was es dabei trifft. */
function fly(
  shots: readonly Shot[],
  bloons: Bloon[],
  clock: number,
  slice: number,
  credit: Map<number, number>,
  course: Course,
): {
  readonly shots: readonly Shot[];
  readonly bloons: Bloon[];
  readonly bursts: readonly Burst[];
} {
  const left: Shot[] = [];
  const bursts: Burst[] = [];

  for (const shot of shots) {
    const moved = steered(shot, slice, bloons, clock, course);
    let alive = moved;
    let spent = false;
    // Was im Bogen fliegt, fliegt über alles hinweg, bis es landet.
    const aloft = alive.land !== null && alive.age < alive.land.at;
    const shell = alive.land !== null && alive.blast !== null;

    if (shell && !aloft) {
      // Die Granate geht dort hoch, wo sie landet - ob dort jemand ist oder
      // nicht.
      bursts.push(blastAt(alive));
      blow(bloons, alive, credit, clock, course);
      spent = true;
    }

    for (const [at, bloon] of bloons.entries()) {
      const spot = spotAt(course.track, bloon.gone);
      // Ein Zeppelin ist größer als ein Ballon - und trifft man auch eher.
      const close =
        Math.hypot(spot.x - alive.x, spot.y - alive.y) <
        CELL * BLOON_SIZE * BLOONS[bloon.kind].size + SHOT_SIZE;
      const fresh = !alive.hit.includes(bloon.id);
      const may = open(bloon, alive.harm, clock);
      if (!spent && !aloft && close && fresh && may && bloon.hull > 0) {
        const hit = wound(bloon, alive.damage);
        if (hit.hull <= 0) {
          score(credit, alive.by);
        }
        bloons[at] = {
          ...hit,
          // Sturm und Rotorwind werfen ihn ein Stück zurück.
          gone: Math.max(0, bloon.gone - pushOf(bloon, alive.push)),
          ...held(bloon, alive.slow, alive.slowTo, clock),
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
          bursts.push(blastAt(alive));
          blow(bloons, alive, credit, clock, course);
          spent = true;
        }
      }
    }

    const rolledOut = alive.road !== null && alive.road <= 0;
    const done =
      spent || rolledOut || alive.pierce <= 0 || alive.age >= alive.life;
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

/** Ein Knall an der Stelle eines Geschosses. */
function blastAt(shot: Shot): Burst {
  return {
    look: "blast",
    x: shot.x,
    y: shot.y,
    reach: shot.blast ?? 0,
    age: 0,
    life: BURST_LIFE,
    paint: BLAST_PAINT,
    from: null,
  };
}

/**
 * Ein Geschoss, einen Augenblick später.
 *
 * @remarks
 * Fünf Arten zu fliegen, und jedes Geschoss hat höchstens eine davon: Der
 * Bumerang kommt zurück, die Stachelkugel folgt der Straße, Granate und
 * Nagelhaufen bleiben liegen, wo sie landen, und Zielsuchendes lenkt auf den
 * nächsten Ballon ein. Alles andere fliegt geradeaus.
 */
function steered(
  shot: Shot,
  slice: number,
  bloons: readonly Bloon[],
  clock: number,
  course: Course,
): Shot {
  const age = shot.age + slice;
  const back = shot.back;
  const land = shot.land;
  let vx = shot.vx;
  let vy = shot.vy;
  let next: Shot;

  if (shot.road !== null) {
    const road = shot.road - shot.vx * slice;
    const at = spotAt(course.track, Math.max(0, road));
    next = { ...shot, x: at.x, y: at.y, road, age };
  } else if (land !== null && age >= land.at) {
    next = { ...shot, x: land.x, y: land.y, vx: 0, vy: 0, age };
  } else {
    if (back !== null && age > shot.life / 2) {
      // Ab der Hälfte zieht es ihn heim, und unterwegs trifft er ein zweites
      // Mal.
      const turn = Math.atan2(back.y - shot.y, back.x - shot.x);
      const pace = Math.hypot(vx, vy);
      vx = Math.cos(turn) * pace;
      vy = Math.sin(turn) * pace;
    }
    if (shot.seek && land === null) {
      const bent = sought(shot, bloons, slice, clock, course);
      vx = bent.vx;
      vy = bent.vy;
    }
    next = {
      ...shot,
      x: shot.x + vx * slice,
      y: shot.y + vy * slice,
      vx,
      vy,
      age,
    };
  }

  return next;
}

/**
 * Wohin ein zielsuchendes Geschoss lenkt.
 *
 * @remarks
 * Auf den nächsten Ballon in Sichtweite, den es noch nicht getroffen hat -
 * aber nicht auf einen Schlag, sondern in einer Kurve. Ein Geschoss, das auf
 * der Stelle umdreht, sieht aus wie ein Fehler, auch wenn es trifft.
 */
function sought(
  shot: Shot,
  bloons: readonly Bloon[],
  slice: number,
  clock: number,
  course: Course,
): { readonly vx: number; readonly vy: number } {
  let best: Spot | null = null;
  let bestGap = CELL * SEEK.reach;

  for (const bloon of bloons) {
    if (
      bloon.hull > 0 &&
      !shot.hit.includes(bloon.id) &&
      open(bloon, shot.harm, clock)
    ) {
      const spot = spotAt(course.track, bloon.gone);
      const gap = Math.hypot(spot.x - shot.x, spot.y - shot.y);
      if (gap < bestGap) {
        best = spot;
        bestGap = gap;
      }
    }
  }

  const pace = Math.hypot(shot.vx, shot.vy);
  let heading = Math.atan2(shot.vy, shot.vx);
  if (best !== null) {
    const want = Math.atan2(best.y - shot.y, best.x - shot.x);
    heading = swungBy(heading, want, SEEK.turn * slice);
  }

  return { vx: Math.cos(heading) * pace, vy: Math.sin(heading) * pace };
}

/** Eine Richtung, um höchstens so viel zu einer anderen hin gedreht. */
function swungBy(from: number, to: number, most: number): number {
  const full = Math.PI * 2;
  const gap = ((((to - from) % full) + full + Math.PI) % full) - Math.PI;

  return Math.abs(gap) <= most ? to : from + Math.sign(gap) * most;
}

/**
 * Der Knall einer Bombe.
 *
 * @param bloons - alle Ballons, die er erwischen könnte
 * @param shot - die Bombe, die gerade hochgeht
 * @param credit - das Konto der Türme
 * @param clock - die Uhr der Runde, für die Betäubung
 * @remarks
 * **Er erfasst so viele, wie er fassen kann, und zwar die nächstgelegenen.**
 * Das ist dieselbe Zahl, die bei einem Pfeil sagt, durch wie viele Ballons er
 * geht; beim Bombenwerfer steht sie für den Knall, und seine erste Säule
 * erhöht sie. Ein Knall ohne Grenze bräuchte diese Säule nicht.
 */
function blow(
  bloons: Bloon[],
  shot: Shot,
  credit: Map<number, number>,
  clock: number,
  course: Course,
): void {
  const reach = shot.blast ?? 0;
  const inside: number[] = [];

  for (const [at, bloon] of bloons.entries()) {
    const spot = spotAt(course.track, bloon.gone);
    // Vom Rand gemessen und nicht von der Mitte: Ein Zeppelin, dessen Bug im
    // Knall steckt, steckt im Knall.
    const gap =
      Math.hypot(spot.x - shot.x, spot.y - shot.y) -
      CELL * BLOON_SIZE * (BLOONS[bloon.kind].size - 1);
    if (gap <= reach && open(bloon, shot.harm, clock) && bloon.hull > 0) {
      inside.push(at);
    }
  }

  const caught = inside
    .sort(
      (a, b) =>
        nearness(bloons, a, shot, course) - nearness(bloons, b, shot, course),
    )
    .slice(0, shot.pierce);
  for (const at of caught) {
    const bloon = bloons[at];
    if (bloon !== undefined) {
      const hit = wound(bloon, shot.damage);
      if (hit.hull <= 0) {
        score(credit, shot.by);
      }
      // Shell Shock: Wer im Knall steht, bleibt kurz stehen.
      bloons[at] = { ...hit, ...held(bloon, shot.slow, shot.slowTo, clock) };
    }
  }
}

/** Einem Turm eine zerstochene Schicht anschreiben. */
function score(credit: Map<number, number>, by: number): void {
  credit.set(by, (credit.get(by) ?? 0) + 1);
}

/** Wie weit ein Ballon vom Einschlag weg ist. */
function nearness(
  bloons: Bloon[],
  at: number,
  shot: Shot,
  course: Course,
): number {
  const bloon = bloons[at];
  const spot = bloon === undefined ? null : spotAt(course.track, bloon.gone);

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
