/**
 * Das Spielfeld, gezeichnet.
 *
 * @module
 * @remarks
 * Alles auf einer Leinwand und nichts im DOM: Zwanzig Ballons, dreißig
 * Geschosse und ein Dutzend Türme sind jedes Bild in Bewegung, und was sich
 * jedes Bild bewegt, gehört nicht in den Seitenbaum.
 *
 * Gezeichnet wird aus dem Zustand allein ({@link ../engine/types Game}) plus
 * dem, was nur der Bildschirm weiß: worauf der Zeiger liegt und was im Laden
 * ausgewählt ist. Die Engine erfährt davon nichts.
 */
import { BLOONS, type BloonKind } from "@/games/bloons-td/engine/bloons";
import {
  BLOON_SIZE,
  TRACK,
  WATCH,
  canBuild,
} from "@/games/bloons-td/engine/engine";
import {
  CELL,
  COLS,
  FIELD_H,
  FIELD_W,
  ROWS,
  cellAt,
  middleOf,
  spotAt,
} from "@/games/bloons-td/engine/map";
import { TOWERS, type TowerKind } from "@/games/bloons-td/engine/towers";
import { NO_TIERS, statsOf } from "@/games/bloons-td/engine/upgrades";
import type { Burst, Game, Shot, Tower } from "@/games/bloons-td/engine/types";

/** Die Farben des Feldes. */
const PAINT = {
  grass: "#4b8b3b",
  grassDark: "#3f7a32",
  road: "#c8a96a",
  roadEdge: "#a98a4f",
  start: "#e0c285",
  line: "rgba(0,0,0,0.12)",
  range: "rgba(255,255,255,0.18)",
  rangeLine: "rgba(255,255,255,0.65)",
  may: "rgba(74,222,128,0.35)",
  mayNot: "rgba(248,113,113,0.4)",
  shot: "#f8fafc",
  shotLine: "rgba(15,23,42,0.5)",
  glue: "#facc15",
  ice: "#bae6fd",
  picked: "#fde047",
  shade: "rgba(0,0,0,0.2)",
  shine: "rgba(255,255,255,0.45)",
  shell: "#f8e3c8",
  frost: "rgba(186,230,253,0.75)",
  frostLine: "#e0f6ff",
  flash: "#f59e0b",
  flashCore: "#fef3c7",
  sticky: "rgba(250,204,21,0.9)",
} as const;

/**
 * Die Farben der sechs Türme, nach den Bildern aus `game_instructions/BloonsTD`.
 *
 * @remarks
 * Vier von ihnen sind Affen, die dastehen und schießen; zwei sind Maschinen,
 * im Vorbild wie hier - der Reißnagelwerfer und der Bombenwerfer, der eine
 * Kanone ist und kein Affe. Auf einem Feld von vierundsechzig Bildpunkten
 * erkennt man sie an Fell, Ausrüstung und Haltung; sechs gleiche Scheiben in
 * sechs Tönen wären eine Aufstellung, die man selbst nicht wiedererkennt.
 */
const FUR = {
  brown: "#9a6a38",
  brownDark: "#6f4722",
  skin: "#f0cfa0",
  eyeWhite: "#fdfdfd",
  eye: "#1f2937",
  cap: "#f0a92f",
  capDark: "#c5821a",
  ice: "#9fd8f5",
  iceDark: "#4f9fcc",
  snow: "#f2fbff",
  glove: "#2f8fd0",
  pack: "#2b6b32",
  packDark: "#16401d",
  nozzle: "#dff07a",
  gun: "#7fae2a",
  glue: "#e9d23f",
  tack: "#f2609e",
  tackDark: "#c23c75",
  nail: "#3f4652",
  steel: "#c3ccd8",
  tube: "#3b4a7a",
  tubeDark: "#1b2342",
  tubeLight: "#6475ab",
  brass: "#c89b3c",
  brassDark: "#8a6621",
  brassLight: "#e8c877",
  wood: "#8a5a2b",
} as const;

/** Die Maße der Zeichnung, in Teilen einer Feldbreite. */
const LOOK = {
  /** Wie groß ein Turm überhaupt ist; alles Weitere ist ein Teil davon. */
  tower: 0.34,
  /** Wie dick ein Umriss ist. */
  edge: 1.5,
  half: 0.5,
  ring: 3,
  /** Ein Geschoss - und wie klein der Pfeil im Flug gegenüber dem in der Hand ist. */
  shot: 0.07,
  flyingDart: 0.75,
  /** Der Ballon: wie breit er im Verhältnis zur Höhe ist. */
  wide: 0.85,
  /** Sein Knoten unten und der Glanzpunkt oben. */
  knot: 0.18,
  knotLong: 1.25,
  shine: 0.3,
  shineWide: 0.2,
  shineHigh: 0.3,
  /** Die Streifen des Zebras und der Ring der Keramik. */
  stripeUp: 0.3,
  stripeDown: 0.25,
  stripeThick: 0.22,
  shell: 0.6,
  /** Der Reif oder der Klecks, der auf einem gebremsten Ballon liegt. */
  hold: 1.25,
  /** Wie lange ein Platzer zu sehen ist und wie klein er anfängt. */
  burstLife: 0.35,
  burstFrom: 0.4,
  line: 2,
} as const;

/**
 * Wie ein stehender Affe gebaut ist, in Teilen seiner eigenen Größe.
 *
 * @remarks
 * Die Zahlen sind eine Figur und keine Sammlung: Wer den Kopf größer macht,
 * muss die Ohren mitnehmen, sonst sitzen sie im Schädel. Deshalb stehen sie
 * zusammen und in der Reihenfolge, in der gezeichnet wird - von unten nach
 * oben.
 */
const APE = {
  shadowUp: 1.2,
  shadowWide: 0.75,
  shadowHigh: 0.2,
  /** Der Schwanz, der hinter ihm hervorkommt. */
  tailFrom: 0.5,
  tailOut: 1.05,
  tailUp: 0.15,
  tailThick: 0.13,
  /** Beine und Füße. */
  legApart: 0.26,
  legTop: 0.45,
  legHigh: 0.62,
  legWide: 0.24,
  footUp: 1.05,
  footWide: 0.25,
  footHigh: 0.15,
  /** Rumpf und Bauch. */
  bodyUp: 0.4,
  bodyWide: 0.46,
  bodyHigh: 0.56,
  bellyUp: 0.5,
  bellyWide: 0.28,
  bellyHigh: 0.34,
  /** Wie flach der Rumpf wird, wenn man ihn von der Seite sieht. */
  bodyFlat: 0.8,
  bellyShift: 0.22,
  /** Kopf und was auf ihm sitzt. */
  headUp: 0.72,
  headSize: 0.56,
  earOut: 0.62,
  earUp: 0.78,
  earSize: 0.21,
  earInner: 0.11,
  snoutOut: 0.3,
  snoutUp: 0.56,
  snoutWide: 0.4,
  snoutHigh: 0.27,
  nostrilApart: 0.1,
  nostrilUp: 0.58,
  nostril: 0.04,
  /**
   * Wo die Merkmale auf der Kugel sitzen, in Bogenmaß vom Gesicht aus.
   *
   * @remarks
   * Null ist die Schnauze, eine Viertel­drehung sind die Ohren, dazwischen die
   * Augen. Daraus rechnet {@link facet} für jede Blickrichtung aus, wo das
   * Merkmal landet und ob es noch vorn liegt.
   */
  eyeAz: 0.6,
  earAz: 1.5708,
  /** Wie weit ein Merkmal nach unten rutscht, wenn es auf den Betrachter zukommt. */
  depth: 0.1,
  /** Ab wann ein Auge hinter dem Kopf verschwindet. */
  eyeEdge: 0.12,
  /** Die Augen selbst. */
  eyeOut: 0.52,
  eyeUp: 0.9,
  eyeWhite: 0.12,
  eyeDark: 0.065,
  eyeFollow: 0.045,
  /** Arme und Hände, die sich zum Ziel drehen. */
  armUp: 0.2,
  armFrom: 0.34,
  shoulder: 0.28,
  armThick: 0.19,
  hand: 0.85,
  handSize: 0.15,
  /** Der Helm des Bumerangaffen. */
  capUp: 0.82,
  capSize: 0.6,
  capBrim: 0.14,
  /** Die Büschel des Eisaffen. */
  tuft: 0.15,
  tuftOut: 0.3,
  tuftUp: 1.22,
  /** Die Punkte am Fuß, einer je gekaufter Stufe. */
  pipDown: 1.45,
  pipSize: 0.11,
  pipGap: 0.3,
  /** Wie weit der Arm beim Wurf zurückzuckt. */
  jerk: 0.18,
  /** Der Schwanzansatz, gemessen vom Rumpf aus, und wie weit er hängt. */
  tailAt: 0.55,
  tailDrop: 0.55,
  /** Der Rucksack des Klebstoffschützen. */
  packUp: 0.4,
  packWide: 0.62,
  packHigh: 0.48,
  tankUp: 0.45,
  tankSize: 0.22,
} as const;

/**
 * Der Wurf des Wurfpfeilaffen, in drei Haltungen.
 *
 * @remarks
 * `reach` ist, wie weit die Hand vor (oder hinter) der Schulter steht,
 * gemessen in Richtung des Ziels; `lift`, wie hoch sie dabei ist. Dazwischen
 * wird gemischt - eine Haltung je Zeitpunkt, wie es eine Animationsspur täte:
 * **locker**, solange nichts ansteht, **ausgeholt**, kurz bevor er wirft, und
 * **gestreckt** im Augenblick des Wurfs. Der Ellbogen knickt dabei aus, solange
 * der Arm nicht gestreckt ist.
 */
const THROW = {
  idleReach: 0.3,
  idleLift: 0.4,
  cockReach: -0.55,
  cockLift: 1,
  outReach: 1.3,
  outLift: 0.25,
  /** Wie stark der Ellbogen ausknickt - gestreckt fast gar nicht. */
  bend: 0.34,
  bendOut: 0.08,
  /** Wo die Schulter sitzt: etwas seitlich der Mitte, quer zur Wurfrichtung. */
  shoulderUp: 0.15,
  shoulderSide: 0.45,
  /**
   * Wie stark die Tiefe gestaucht wird.
   *
   * @remarks
   * Die Karte liegt schräg unter dem Betrachter. Ein Arm, der nach hinten
   * zeigt, geht deshalb nicht um seine volle Länge nach oben, sondern um gut
   * die halbe - sonst reckt der Affe beim Zielen nach oben den Arm in den
   * Himmel, statt vom Betrachter weg zu zeigen.
   */
  squash: 0.5,
  /** Wie spät das Ausholen losgeht: hoch heißt, er holt erst kurz vorher aus. */
  wind: 3,
  /** Wie der Pfeil in der Hand liegt. */
  dartLong: 0.62,
  dartThick: 0.1,
  dartTip: 0.22,
  finLong: 0.16,
  finWide: 0.15,
} as const;

/** Und was er dabei in den Händen hält. */
const GEAR = {
  /** Der Bumerang. */
  boomSize: 0.3,
  boomThick: 0.14,
  boomBend: 1.15,
  /** Die Klebstoffpistole. */
  gunLong: 0.58,
  gunThick: 0.22,
  gripDown: 0.3,
  gripThick: 0.14,
  blob: 0.12,
} as const;

/**
 * Die Maße der Kanone, in Teilen der Turmgröße.
 *
 * @remarks
 * Nach dem Bild: ein Rohr, das zur Mündung hin **breiter** wird, hinten ein
 * runder Verschluss mit Messingring, darunter ein Messingfuß. Alles in der
 * gedrehten Ansicht gedacht, mit der Mündung bei +x.
 */
const GUN = {
  /** Der Fuß, auf dem sie steht - der dreht sich nicht mit. */
  footDown: 0.62,
  footWide: 0.66,
  footHigh: 0.34,
  footRim: 0.1,
  hub: 0.18,
  /** Das Rohr: hinten schmal, vorn weit. */
  back: 0.62,
  backHigh: 0.34,
  mouth: 0.95,
  mouthHigh: 0.5,
  /** Der Verschluss hinten und sein Messingring. */
  breech: 0.4,
  bandAt: 0.42,
  bandWide: 0.16,
  bandHigh: 0.42,
  /** Die Mündung: heller Rand, dunkles Loch. */
  rim: 0.14,
  bore: 0.36,
  boreWide: 0.09,
  /** Der Glanz auf dem Rohr. */
  shineThick: 0.1,
  shineFrom: 0.3,
  shineTo: 0.8,
  shineUp: 0.18,
  /** Wie weit sie beim Schuss zurückfährt. */
  recoil: 0.42,
  /** Das Mündungsfeuer: ab wann es zu sehen ist und wie weit es schlägt. */
  flashFrom: 0.72,
  flashLong: 0.9,
  flashHigh: 0.42,
  flashInner: 0.5,
} as const;

/** Die Maße des Reißnagelwerfers - der Einzige, der kein Affe ist. */
const TACK = {
  base: 0.78,
  hub: 0.3,
  bolt: 0.12,
  nailFrom: 0.6,
  nailLong: 0.55,
  nailThick: 0.14,
  headSize: 0.11,
  spokes: 8,
} as const;

/** Links und rechts - für Ohren, Augen, Beine und Arme. */
const SIDES: readonly number[] = [-1, 1];

/** Was der Bildschirm außer dem Zustand noch beisteuert. */
export type View = {
  /** Welches Feld der Zeiger gerade berührt, oder null. */
  readonly over: { readonly col: number; readonly row: number } | null;
  /** Was im Laden ausgewählt ist, oder null. */
  readonly picked: TowerKind | null;
  /** Und welcher Turm angetippt ist, oder null. */
  readonly chosen: number | null;
};

/** Was einen Ballon gerade festhält, wenn ihn etwas festhält. */
type Hold = "frozen" | "sticky" | null;

/** Wie breit und wie hoch die Leinwand ist. */
export const CANVAS_W = FIELD_W;
export const CANVAS_H = FIELD_H;

/**
 * Zeichnet ein Bild der Partie.
 *
 * @param ctx - die Zeichenfläche
 * @param game - die Partie
 * @param view - worauf der Zeiger liegt und was ausgewählt ist
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  game: Game,
  view: View,
): void {
  ground(ctx);
  reach(ctx, game, view);
  for (const tower of game.towers) {
    monkey(ctx, tower, view.chosen === tower.id);
  }
  for (const bloon of game.bloons) {
    const at = spotAt(TRACK, bloon.gone);
    // Ein Ballon, der steht, muss aussehen, als stehe er - sonst sieht der
    // Eisaffe aus wie ein Affe, der nichts tut.
    const hold: Hold =
      bloon.slowed > game.clock
        ? bloon.slowTo === 0
          ? "frozen"
          : "sticky"
        : bloon.thawed > game.clock
          ? "sticky"
          : null;
    balloon(ctx, bloon.kind, at.x, at.y, bloon.hull, hold);
  }
  for (const shot of game.shots) {
    flying(ctx, shot);
  }
  for (const burst of game.bursts) {
    flare(ctx, burst);
  }
  ghost(ctx, game, view);
}

/**
 * Ein Knall, solange man ihn sieht.
 *
 * @remarks
 * Drei Arten, drei Bilder: Ein **geplatzter Ballon** ist ein dünner Ring in
 * seiner Farbe. Ein **Bombenknall** ist eine Scheibe, die aufleuchtet und
 * verblasst. Eine **Frostwelle** ist beides plus Eiszacken am Rand - sie ist
 * der ganze Angriff des Eisaffen und nicht nur seine Begleitmusik, also muss
 * man sie auch sehen.
 */
function flare(ctx: CanvasRenderingContext2D, burst: Burst): void {
  const share = Math.min(1, burst.age / LOOK.burstLife);
  const left = 1 - share;
  const wide = burst.reach * (LOOK.burstFrom + share);

  if (burst.look === "pop") {
    ctx.strokeStyle = burst.paint;
    ctx.globalAlpha = left;
    ctx.lineWidth = LOOK.line;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, wide, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const frost = burst.look === "frost";
    ctx.globalAlpha = left * (frost ? BOOM.frostFill : BOOM.blastFill);
    ctx.fillStyle = frost ? PAINT.ice : burst.paint;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, wide, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = left;
    ctx.strokeStyle = frost ? PAINT.frostLine : burst.paint;
    ctx.lineWidth = LOOK.line + LOOK.line * left;
    ctx.stroke();

    // Zacken am Rand: Der Frost greift nach außen, der Knall schlägt heraus.
    ctx.lineWidth = LOOK.line;
    for (let spike = 0; spike < BOOM.spikes; spike += 1) {
      const turn = (spike / BOOM.spikes) * Math.PI * 2;
      const from = wide * BOOM.spikeFrom;
      const to = wide * (1 + BOOM.spikeOut * left);
      ctx.beginPath();
      ctx.moveTo(
        burst.x + Math.cos(turn) * from,
        burst.y + Math.sin(turn) * from,
      );
      ctx.lineTo(burst.x + Math.cos(turn) * to, burst.y + Math.sin(turn) * to);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}

/** Wie ein Knall aussieht. */
const BOOM = {
  blastFill: 0.45,
  frostFill: 0.5,
  spikes: 10,
  spikeFrom: 0.75,
  spikeOut: 0.22,
} as const;

/**
 * Ein Turm allein, als quadratisches Bild - für den Laden.
 *
 * @param ctx - die Zeichenfläche
 * @param kind - welcher Turm
 * @param box - wie breit und hoch das Bild ist, in Bildpunkten
 * @remarks
 * Derselbe Zeichner wie auf dem Feld, nur ohne Feld: Was man im Laden
 * anklickt, sieht damit genauso aus wie das, was danach auf der Wiese steht.
 * Ein zweites, gemaltes Ladenbild wäre ein zweites Bild, das man beim nächsten
 * Umbau vergisst.
 */
export function drawTower(
  ctx: CanvasRenderingContext2D,
  kind: TowerKind,
  box: number,
): void {
  ctx.save();
  ctx.scale(box / CELL, box / CELL);
  monkey(
    ctx,
    {
      id: 0,
      kind,
      col: 0,
      row: 0,
      loaded: 0,
      aim: WATCH,
      faced: WATCH,
      kick: 0,
      tiers: NO_TIERS,
      pops: 0,
    },
    false,
  );
  ctx.restore();
}

/** Wiese, Straße und das Startfeld. */
function ground(ctx: CanvasRenderingContext2D): void {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = cellAt(col, row);
      const x = col * CELL;
      const y = row * CELL;
      // Zwei Grüntöne im Schachbrett: Eine einfarbige Wiese sieht aus wie ein
      // fehlendes Bild, und man sieht die Felder nicht, auf die man baut.
      ctx.fillStyle =
        cell === "."
          ? (col + row) % 2 === 0
            ? PAINT.grass
            : PAINT.grassDark
          : cell === "S"
            ? PAINT.start
            : PAINT.road;
      ctx.fillRect(x, y, CELL, CELL);
      if (cell === ".") {
        ctx.strokeStyle = PAINT.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + LOOK.half, y + LOOK.half, CELL - 1, CELL - 1);
      }
    }
  }
}

/** Der Kreis, der zeigt, wie weit ein Turm reicht. */
function reach(ctx: CanvasRenderingContext2D, game: Game, view: View): void {
  const chosen = game.towers.find((one) => one.id === view.chosen);
  const at = chosen === undefined ? null : middleOf(chosen.col, chosen.row);

  if (chosen !== undefined && at !== null) {
    ctx.fillStyle = PAINT.range;
    ctx.beginPath();
    ctx.arc(
      at.x,
      at.y,
      statsOf(chosen.kind, chosen.tiers).range,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.strokeStyle = PAINT.rangeLine;
    ctx.lineWidth = LOOK.line;
    ctx.stroke();
  }
}

/**
 * Ein Turm auf seinem Feld.
 *
 * @remarks
 * **Der Affe steht, nur seine Arme drehen sich.** Eine ganze Figur, die sich
 * mitdreht, liegt beim Zielen nach links auf dem Rücken; dreht sich dagegen
 * nur, was zielt, bleibt er ein Affe, der dasteht und schießt - und seine
 * Augen gehen mit, damit man trotzdem sieht, wohin er schaut.
 */
function monkey(
  ctx: CanvasRenderingContext2D,
  tower: Tower,
  chosen: boolean,
): void {
  const at = middleOf(tower.col, tower.row);
  const size = CELL * LOOK.tower;

  // Ein Schatten auf der Wiese, damit er darauf steht und nicht darin.
  ctx.fillStyle = PAINT.shade;
  ctx.beginPath();
  ctx.ellipse(
    at.x,
    at.y + size * APE.shadowUp,
    size * APE.shadowWide,
    size * APE.shadowHigh,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // **Was man gekauft hat, muss man sehen.** Sonst steht auf dem Feld
  // zweimal derselbe Affe, und nur einer von beiden ist etwas wert.
  const steps = tower.tiers.one + tower.tiers.two;
  ctx.fillStyle = PAINT.picked;
  for (let pip = 0; pip < steps; pip += 1) {
    ctx.beginPath();
    ctx.arc(
      at.x + (pip - (steps - 1) / 2) * size * APE.pipGap,
      at.y + size * APE.pipDown,
      size * APE.pipSize,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.save();
  ctx.translate(at.x, at.y);
  if (tower.kind === "tack") {
    tackShooter(ctx, size);
  } else if (tower.kind === "bomb") {
    cannon(ctx, size, tower.faced, tower.kick);
  } else {
    const wait = statsOf(tower.kind, tower.tiers).reload;
    ape(ctx, size, tower.kind, {
      aim: tower.faced,
      kick: tower.kick,
      // Wie weit der nächste Wurf gediehen ist: null gleich nach dem letzten,
      // eins, wenn er wieder dran ist.
      ready: wait <= 0 ? 1 : 1 - Math.min(1, tower.loaded / wait),
    });
  }
  ctx.restore();

  if (chosen) {
    ctx.strokeStyle = PAINT.picked;
    ctx.lineWidth = LOOK.line;
    ctx.beginPath();
    ctx.ellipse(
      at.x,
      at.y + size * APE.shadowUp,
      size * APE.shadowWide + LOOK.ring,
      size * APE.shadowHigh + LOOK.ring,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
}

/** Das Fell, der Umriss und die nackte Haut einer Sorte. */
function coatOf(kind: TowerKind): Coat {
  return kind === "ice"
    ? { fur: FUR.ice, dark: FUR.iceDark, skin: FUR.snow, glove: FUR.glove }
    : { fur: FUR.brown, dark: FUR.brownDark, skin: FUR.skin, glove: FUR.skin };
}

/**
 * Fell, Umriss, nackte Haut - und das, was er an Händen und Füßen trägt.
 *
 * @remarks
 * Der Eisaffe trägt im Vorbild blaue Handschuhe und Stiefel; bei den anderen
 * ist `glove` einfach die Haut, dann fällt der Unterschied weg.
 */
type Coat = {
  readonly fur: string;
  readonly dark: string;
  readonly skin: string;
  readonly glove: string;
};

/**
 * Wie ein Affe gerade dasteht.
 *
 * @remarks
 * Drei Zahlen, und alle drei kommen aus dem Spielzustand: wohin er schaut, wie
 * frisch sein letzter Wurf ist und wie weit der nächste gediehen ist.
 */
type Pose = {
  readonly aim: number;
  readonly kick: number;
  readonly ready: number;
};

/**
 * Wo ein Merkmal auf dem runden Kopf landet.
 *
 * @param aim - wohin der Affe schaut
 * @param around - wo das Merkmal sitzt, in Bogenmaß vom Gesicht aus
 * @returns `x` seitlich (-1 links bis 1 rechts), `z` in die Tiefe (1 vorn)
 * @remarks
 * **Das ist der ganze Dreh-Trick.** Der Kopf ist eine Kugel, die Merkmale
 * sitzen darauf, und beim Drehen wandern sie herum: Was nach vorn zeigt,
 * steht in der Mitte, was zur Seite zeigt, am Rand, und was nach hinten
 * zeigt, liegt dahinter und wird zuerst gezeichnet. Damit sieht man denselben
 * Affen von vorn, von der Seite und von hinten, ohne drei Zeichnungen.
 */
function facet(aim: number, around: number): { x: number; z: number } {
  return { x: Math.cos(aim + around), z: Math.sin(aim + around) };
}

/** Zwischen zwei Zahlen mischen. */
function mix(from: number, to: number, share: number): number {
  return from + (to - from) * share;
}

/** Ein Affe, von hinten nach vorn gezeichnet. */
function ape(
  ctx: CanvasRenderingContext2D,
  size: number,
  kind: TowerKind,
  pose: Pose,
): void {
  const coat = coatOf(kind);
  const back = facet(pose.aim, Math.PI);

  // Der Schwanz sitzt hinten am Rumpf: Steht der Affe mit dem Rücken zu uns,
  // hängt er vor ihm, sonst dahinter.
  if (back.z < 0) {
    tail(ctx, size, back, coat.fur);
  }
  if (kind === "glue") {
    pack(ctx, size);
  }
  legs(ctx, size, pose, coat.fur, coat.glove);
  body(ctx, size, pose, coat);
  if (back.z >= 0) {
    tail(ctx, size, back, coat.fur);
  }

  headOf(ctx, size, kind, pose, coat);
  if (kind === "dart") {
    throwArm(ctx, size, pose, coat);
  } else if (kind === "ice") {
    spread(ctx, size, pose, coat);
  } else {
    arms(ctx, size, pose.aim, kind, coat.fur, coat.skin, pose.kick);
  }
}

/** Der Schwanz, der hinter ihm hervorkommt. */
function tail(
  ctx: CanvasRenderingContext2D,
  size: number,
  back: { readonly x: number; readonly z: number },
  fur: string,
): void {
  // **Auch der Schwanz dreht sich mit.** Zeigt er zum Betrachter oder von ihm
  // weg, ist von ihm kaum etwas zu sehen - er steht dann nicht quer im Bild,
  // sondern hängt hinunter.
  const out = back.x * size * APE.tailOut;
  const high =
    size * APE.bodyUp -
    size * APE.tailUp * Math.abs(back.x) +
    size * APE.tailDrop * Math.max(0, back.z);

  ctx.strokeStyle = fur;
  ctx.lineWidth = size * APE.tailThick;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(back.x * size * APE.tailAt, size * APE.bodyUp);
  ctx.quadraticCurveTo(out, size * APE.bodyUp, out, high);
  ctx.stroke();
  ctx.lineCap = "butt";
}

/**
 * Zwei Beine und zwei Füße.
 *
 * @remarks
 * Auch die Füße wandern beim Drehen: Von vorn stehen sie nebeneinander, von
 * der Seite hintereinander - dann deckt der nähere den ferneren fast ganz.
 */
function legs(
  ctx: CanvasRenderingContext2D,
  size: number,
  pose: Pose,
  fur: string,
  boot: string,
): void {
  for (const side of SIDES) {
    const at = facet(pose.aim, side * APE.earAz);
    ctx.fillStyle = fur;
    ctx.fillRect(
      at.x * size * APE.legApart - size * APE.legWide * LOOK.half,
      size * APE.legTop,
      size * APE.legWide,
      size * APE.legHigh,
    );
    ctx.fillStyle = boot;
    ctx.beginPath();
    ctx.ellipse(
      at.x * size * APE.legApart,
      size * APE.footUp + at.z * size * APE.depth,
      size * APE.footWide,
      size * APE.footHigh,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/** Der Rumpf - von der Seite schmaler als von vorn, und der Bauch nur vorn. */
function body(
  ctx: CanvasRenderingContext2D,
  size: number,
  pose: Pose,
  coat: Coat,
): void {
  const face = facet(pose.aim, 0);
  const wide = size * APE.bodyWide * mix(APE.bodyFlat, 1, Math.abs(face.z));

  ctx.fillStyle = coat.fur;
  ctx.strokeStyle = coat.dark;
  ctx.lineWidth = LOOK.edge;
  ctx.beginPath();
  ctx.ellipse(
    0,
    size * APE.bodyUp,
    wide,
    size * APE.bodyHigh,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.stroke();

  // Den helleren Bauch sieht nur, wer ihn von vorn sieht.
  if (face.z > 0) {
    ctx.globalAlpha = face.z;
    ctx.fillStyle = coat.skin;
    ctx.beginPath();
    ctx.ellipse(
      face.x * size * APE.bellyShift,
      size * APE.bellyUp,
      size * APE.bellyWide,
      size * APE.bellyHigh,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/**
 * Der Wurfarm.
 *
 * @remarks
 * **Ein Wurf in drei Haltungen, wie ihn eine Animationsspur hätte**: Solange
 * nichts ansteht, hängt der Arm locker; je näher der nächste Wurf rückt, desto
 * weiter holt er aus (und zwar spät - die dritte Potenz von `ready` lässt ihn
 * erst kurz vorher ausholen); im Augenblick des Wurfs ist der Arm gestreckt
 * und sinkt dann zurück. Zwei Knochen statt einem: Schulter, Ellbogen, Hand -
 * ein gerader Strich sieht aus wie ein Zeiger, nicht wie ein Arm.
 */
function throwArm(
  ctx: CanvasRenderingContext2D,
  size: number,
  pose: Pose,
  coat: Coat,
): void {
  const ahead = {
    x: Math.cos(pose.aim),
    y: Math.sin(pose.aim) * THROW.squash,
  };
  const across = {
    x: -Math.sin(pose.aim),
    y: Math.cos(pose.aim) * THROW.squash,
  };
  // Erst die Haltung bestimmen: Wurf, oder Ausholen?
  const wound = Math.pow(pose.ready, THROW.wind);
  const reach =
    pose.kick > 0
      ? mix(THROW.idleReach, THROW.outReach, pose.kick)
      : mix(THROW.idleReach, THROW.cockReach, wound);
  const lift =
    pose.kick > 0
      ? mix(THROW.idleLift, THROW.outLift, pose.kick)
      : mix(THROW.idleLift, THROW.cockLift, wound);
  const bend = mix(THROW.bend, THROW.bendOut, pose.kick);

  const shoulder = {
    x: across.x * size * THROW.shoulderSide,
    y: across.y * size * THROW.shoulderSide - size * THROW.shoulderUp,
  };
  const hand = {
    x: shoulder.x + ahead.x * size * reach,
    y: shoulder.y + ahead.y * size * reach - size * lift,
  };
  const elbow = {
    x: (shoulder.x + hand.x) * LOOK.half + across.x * size * bend,
    y: (shoulder.y + hand.y) * LOOK.half + across.y * size * bend,
  };

  ctx.strokeStyle = coat.fur;
  ctx.lineWidth = size * APE.armThick;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(shoulder.x, shoulder.y);
  ctx.lineTo(elbow.x, elbow.y);
  ctx.lineTo(hand.x, hand.y);
  ctx.stroke();
  ctx.lineCap = "butt";

  // Der Pfeil liegt in der Hand, bis er fliegt.
  if (pose.kick <= 0) {
    const turn = Math.atan2(hand.y - elbow.y, hand.x - elbow.x);
    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(turn);
    dart(ctx, size);
    ctx.restore();
  }

  ctx.fillStyle = coat.skin;
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, size * APE.handSize, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Wie der Eisaffe dasteht, in zwei Haltungen.
 *
 * @remarks
 * Zwischen **ruhig** (Arme halb gehoben zur Seite) und **Welle** (Arme hoch
 * und weit) wird mit `kick` gemischt - derselben Zahl, aus der beim
 * Wurfpfeilaffen der Wurf kommt.
 */
const ICE = {
  shoulder: 0.3,
  shoulderUp: 0.15,
  restOut: 0.72,
  restUp: 0.05,
  castOut: 0.95,
  castUp: 0.55,
  glove: 0.17,
} as const;

/** Ein Wurfpfeil, von der Hand aus nach vorn gezeichnet. */
function dart(ctx: CanvasRenderingContext2D, size: number): void {
  const back = -size * THROW.finLong;
  const tip = size * THROW.dartLong;

  ctx.fillStyle = FUR.wood;
  ctx.fillRect(
    back,
    -size * THROW.dartThick * LOOK.half,
    tip - back,
    size * THROW.dartThick,
  );
  ctx.fillStyle = FUR.steel;
  ctx.beginPath();
  ctx.moveTo(tip + size * THROW.dartTip, 0);
  ctx.lineTo(tip, -size * THROW.dartThick);
  ctx.lineTo(tip, size * THROW.dartThick);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAINT.shot;
  for (const side of SIDES) {
    ctx.beginPath();
    ctx.moveTo(back + size * THROW.finLong, 0);
    ctx.lineTo(back, side * size * THROW.finWide);
    ctx.lineTo(
      back + size * THROW.finLong * 2,
      side * size * THROW.finWide * LOOK.half,
    );
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Kopf, Ohren, Schnauze, Augen - und was die Sorte auf dem Kopf trägt.
 *
 * @remarks
 * Gezeichnet wird in der Reihenfolge der Tiefe: erst, was hinter der Kugel
 * liegt, dann die Kugel, dann, was davor liegt. Schaut der Affe weg, fällt
 * sein Gesicht damit von selbst weg - man sieht seinen Hinterkopf, und das
 * ist genau richtig.
 */
function headOf(
  ctx: CanvasRenderingContext2D,
  size: number,
  kind: TowerKind,
  pose: Pose,
  coat: Coat,
): void {
  const up = -size * APE.headUp;
  const face = facet(pose.aim, 0);

  for (const side of SIDES) {
    const at = facet(pose.aim, side * APE.earAz);
    if (at.z < 0) {
      ear(ctx, size, at, coat);
    }
  }
  if (face.z < 0) {
    snout(ctx, size, face, coat);
  }

  ctx.fillStyle = coat.fur;
  ctx.strokeStyle = coat.dark;
  ctx.lineWidth = LOOK.edge;
  ctx.beginPath();
  ctx.arc(0, up, size * APE.headSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  for (const side of SIDES) {
    const at = facet(pose.aim, side * APE.earAz);
    if (at.z >= 0) {
      ear(ctx, size, at, coat);
    }
  }
  if (face.z >= 0) {
    snout(ctx, size, face, coat);
  }

  // Die Augen verschwinden einzeln um den Kopf herum - erst das abgewandte.
  for (const side of SIDES) {
    const at = facet(pose.aim, side * APE.eyeAz);
    const show = Math.min(1, Math.max(0, at.z / APE.eyeEdge));
    if (show > 0) {
      ctx.globalAlpha = show;
      ctx.fillStyle = FUR.eyeWhite;
      ctx.beginPath();
      ctx.arc(
        at.x * size * APE.eyeOut,
        -size * APE.eyeUp + at.z * size * APE.depth,
        size * APE.eyeWhite,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = FUR.eye;
      ctx.beginPath();
      ctx.arc(
        at.x * size * APE.eyeOut + face.x * size * APE.eyeFollow,
        -size * APE.eyeUp +
          at.z * size * APE.depth +
          face.z * size * APE.eyeFollow,
        size * APE.eyeDark,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  if (kind === "boomerang") {
    ctx.fillStyle = FUR.cap;
    ctx.beginPath();
    ctx.arc(0, -size * APE.capUp, size * APE.capSize, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = FUR.capDark;
    ctx.fillRect(
      -size * APE.capSize,
      -size * APE.capUp,
      size * APE.capSize * 2,
      size * APE.capBrim,
    );
  }
  if (kind === "ice") {
    ctx.fillStyle = FUR.snow;
    for (const side of SIDES) {
      ctx.beginPath();
      ctx.arc(
        side * size * APE.tuftOut,
        -size * APE.tuftUp,
        size * APE.tuft,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(
      face.x * size * APE.tuft,
      -size * APE.tuftUp - size * APE.tuft,
      size * APE.tuft,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/** Ein Ohr, dort, wo die Drehung es hingestellt hat. */
function ear(
  ctx: CanvasRenderingContext2D,
  size: number,
  at: { readonly x: number; readonly z: number },
  coat: Coat,
): void {
  const y = -size * APE.earUp + at.z * size * APE.depth;

  ctx.fillStyle = coat.fur;
  ctx.strokeStyle = coat.dark;
  ctx.lineWidth = LOOK.edge;
  ctx.beginPath();
  ctx.arc(at.x * size * APE.earOut, y, size * APE.earSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (at.z >= 0) {
    ctx.fillStyle = coat.skin;
    ctx.beginPath();
    ctx.arc(at.x * size * APE.earOut, y, size * APE.earInner, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Die Schnauze samt Nasenlöchern - je weiter er wegschaut, desto weniger. */
function snout(
  ctx: CanvasRenderingContext2D,
  size: number,
  face: { readonly x: number; readonly z: number },
  coat: Coat,
): void {
  const x = face.x * size * APE.snoutOut;
  const y = -size * APE.snoutUp + face.z * size * APE.depth;

  ctx.fillStyle = coat.skin;
  ctx.beginPath();
  ctx.ellipse(
    x,
    y,
    size * APE.snoutWide,
    size * APE.snoutHigh,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  if (face.z > 0) {
    ctx.globalAlpha = face.z;
    ctx.fillStyle = coat.dark;
    for (const side of SIDES) {
      ctx.beginPath();
      ctx.arc(
        x + side * size * APE.nostrilApart,
        y,
        size * APE.nostril,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/** Der Rucksack hinter dem Rumpf. */
function pack(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = FUR.pack;
  ctx.strokeStyle = FUR.packDark;
  ctx.lineWidth = LOOK.edge;
  ctx.beginPath();
  ctx.ellipse(
    0,
    size * APE.packUp,
    size * APE.packWide,
    size * APE.packHigh,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = FUR.glue;
  ctx.beginPath();
  ctx.arc(0, size * APE.tankUp, size * APE.tankSize, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Die ausgebreiteten Arme des Eisaffen.
 *
 * @remarks
 * **Er hält nichts und wirft nichts.** Im Vorbild steht er mit ausgebreiteten
 * Armen da und lässt den Frost los; also zeigen seine Arme auch nirgendwohin,
 * sondern zur Seite - und im Augenblick der Welle reißt er sie hoch. Ein
 * Schneeball in der Hand wäre eine Ankündigung, die nie eingelöst wird.
 */
function spread(
  ctx: CanvasRenderingContext2D,
  size: number,
  pose: Pose,
  coat: Coat,
): void {
  const up = mix(ICE.restUp, ICE.castUp, pose.kick);
  const out = mix(ICE.restOut, ICE.castOut, pose.kick);

  ctx.strokeStyle = coat.fur;
  ctx.lineWidth = size * APE.armThick;
  ctx.lineCap = "round";
  for (const side of SIDES) {
    ctx.beginPath();
    ctx.moveTo(side * size * ICE.shoulder, size * ICE.shoulderUp);
    ctx.lineTo(side * size * out, -size * up);
    ctx.stroke();
  }
  ctx.lineCap = "butt";

  ctx.fillStyle = coat.glove;
  for (const side of SIDES) {
    ctx.beginPath();
    ctx.arc(side * size * out, -size * up, size * ICE.glove, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Zwei Arme, die zum Ziel zeigen, und was sie halten. */
function arms(
  ctx: CanvasRenderingContext2D,
  size: number,
  aim: number,
  kind: TowerKind,
  fur: string,
  skin: string,
  kick: number,
): void {
  ctx.save();
  ctx.translate(0, size * APE.armUp);
  ctx.rotate(aim);
  // Der Arm zuckt im Augenblick des Wurfs zurück und kommt wieder vor.
  ctx.translate(-size * APE.jerk * kick, 0);

  ctx.strokeStyle = fur;
  ctx.lineWidth = size * APE.armThick;
  ctx.lineCap = "round";
  for (const side of SIDES) {
    ctx.beginPath();
    ctx.moveTo(size * APE.armFrom, side * size * APE.shoulder);
    ctx.lineTo(size * APE.hand, side * size * APE.handSize);
    ctx.stroke();
  }
  ctx.lineCap = "butt";

  ctx.fillStyle = skin;
  for (const side of SIDES) {
    ctx.beginPath();
    ctx.arc(
      size * APE.hand,
      side * size * APE.handSize,
      size * APE.handSize,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  gear(ctx, size, kind);
  ctx.restore();
}

/**
 * Was in den Händen liegt.
 *
 * @remarks
 * Gezeichnet im gedrehten Bild, mit der Hand bei `APE.hand` und der
 * Schussrichtung nach rechts - so zeigt jede Waffe von selbst dorthin, wohin
 * der Affe zielt.
 */
function gear(
  ctx: CanvasRenderingContext2D,
  size: number,
  kind: TowerKind,
): void {
  const hand = size * APE.hand;

  if (kind === "boomerang") {
    ctx.strokeStyle = FUR.cap;
    ctx.lineWidth = size * GEAR.boomThick;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(hand, 0, size * GEAR.boomSize, -GEAR.boomBend, GEAR.boomBend);
    ctx.stroke();
    ctx.lineCap = "butt";
  }
  if (kind === "glue") {
    ctx.fillStyle = FUR.gun;
    ctx.strokeStyle = FUR.packDark;
    ctx.lineWidth = LOOK.edge;
    ctx.beginPath();
    ctx.rect(
      hand - size * GEAR.gunThick,
      -size * GEAR.gunThick * LOOK.half,
      size * GEAR.gunLong,
      size * GEAR.gunThick,
    );
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = FUR.gun;
    ctx.fillRect(
      hand - size * GEAR.gunThick,
      0,
      size * GEAR.gripThick,
      size * GEAR.gripDown,
    );
    ctx.fillStyle = FUR.nozzle;
    ctx.fillRect(
      hand - size * GEAR.gunThick + size * GEAR.gunLong,
      -size * GEAR.blob * LOOK.half,
      size * GEAR.blob,
      size * GEAR.blob,
    );
    ctx.fillStyle = FUR.glue;
    ctx.beginPath();
    ctx.arc(
      hand - size * GEAR.gunThick + size * GEAR.gunLong + size * GEAR.blob,
      0,
      size * GEAR.blob,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/**
 * Der Bombenwerfer: eine Kanone, kein Affe.
 *
 * @param ctx - die Zeichenfläche, schon auf die Feldmitte gesetzt
 * @param size - wie groß der Turm ist
 * @param faced - wohin das Rohr gerade zeigt
 * @param kick - wie frisch der letzte Schuss ist, 1 bis 0
 * @remarks
 * Gebaut wie im Bild: ein Rohr, das zur Mündung hin breiter wird, hinten ein
 * runder Verschluss mit Messingring, darunter der Messingfuß - und der Fuß
 * dreht sich **nicht** mit. Ein Geschütz, das sich samt Lafette um die eigene
 * Achse dreht, steht auf nichts.
 *
 * Die Bewegung kommt aus zwei Zahlen und keiner eigenen Uhr: `faced` schwenkt
 * im Takt der Engine, `kick` fällt nach jedem Schuss von eins auf null. Daraus
 * wird hier Rückstoß und Mündungsfeuer.
 */
function cannon(
  ctx: CanvasRenderingContext2D,
  size: number,
  faced: number,
  kick: number,
): void {
  // Der Fuß zuerst, denn das Rohr liegt darauf.
  ctx.fillStyle = FUR.brass;
  ctx.strokeStyle = FUR.brassDark;
  ctx.lineWidth = LOOK.edge;
  ctx.beginPath();
  ctx.ellipse(
    0,
    size * GUN.footDown,
    size * GUN.footWide,
    size * GUN.footHigh,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = FUR.brassLight;
  ctx.beginPath();
  ctx.ellipse(
    0,
    size * GUN.footDown - size * GUN.footRim,
    size * GUN.footWide - size * GUN.footRim,
    size * GUN.footHigh - size * GUN.footRim,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = FUR.brassDark;
  ctx.beginPath();
  ctx.arc(0, size * GUN.footDown, size * GUN.hub, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(faced);
  ctx.translate(-size * GUN.recoil * kick, 0);

  // Der Verschluss, dann das Rohr darüber: hinten schmal, vorn weit.
  ctx.fillStyle = FUR.tube;
  ctx.strokeStyle = FUR.tubeDark;
  ctx.lineWidth = LOOK.edge;
  ctx.beginPath();
  ctx.arc(-size * GUN.back, 0, size * GUN.breech, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-size * GUN.back, -size * GUN.backHigh);
  ctx.lineTo(size * GUN.mouth, -size * GUN.mouthHigh);
  ctx.lineTo(size * GUN.mouth, size * GUN.mouthHigh);
  ctx.lineTo(-size * GUN.back, size * GUN.backHigh);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Der Messingring über dem Verschluss.
  ctx.fillStyle = FUR.brass;
  ctx.strokeStyle = FUR.brassDark;
  ctx.beginPath();
  ctx.rect(
    -size * GUN.bandAt,
    -size * GUN.bandHigh,
    size * GUN.bandWide,
    size * GUN.bandHigh * 2,
  );
  ctx.fill();
  ctx.stroke();

  // Ein Glanz auf dem Rohr, damit es rund wirkt und nicht flach.
  ctx.strokeStyle = FUR.tubeLight;
  ctx.lineWidth = size * GUN.shineThick;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-size * GUN.shineFrom, -size * GUN.shineUp);
  ctx.lineTo(size * GUN.shineTo, -size * GUN.shineUp - size * GUN.shineThick);
  ctx.stroke();
  ctx.lineCap = "butt";

  // Die Mündung: heller Rand, dunkles Loch.
  ctx.fillStyle = FUR.tubeLight;
  ctx.beginPath();
  ctx.ellipse(
    size * GUN.mouth,
    0,
    size * GUN.rim,
    size * GUN.mouthHigh,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = FUR.tubeDark;
  ctx.beginPath();
  ctx.ellipse(
    size * GUN.mouth,
    0,
    size * GUN.boreWide,
    size * GUN.bore,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Und das Mündungsfeuer, solange der Schuss frisch ist.
  if (kick > GUN.flashFrom) {
    const share = (kick - GUN.flashFrom) / (1 - GUN.flashFrom);
    ctx.globalAlpha = share;
    ctx.fillStyle = PAINT.flash;
    ctx.beginPath();
    ctx.moveTo(size * (GUN.mouth + GUN.flashLong * share), 0);
    ctx.lineTo(size * GUN.mouth, -size * GUN.flashHigh);
    ctx.lineTo(size * GUN.mouth, size * GUN.flashHigh);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAINT.flashCore;
    ctx.beginPath();
    ctx.moveTo(size * (GUN.mouth + GUN.flashLong * share * GUN.flashInner), 0);
    ctx.lineTo(size * GUN.mouth, -size * GUN.flashHigh * GUN.flashInner);
    ctx.lineTo(size * GUN.mouth, size * GUN.flashHigh * GUN.flashInner);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/**
 * Der Reißnagelwerfer.
 *
 * @remarks
 * Kein Affe, sondern eine Maschine - im Vorbild genauso. Acht Nägel liegen
 * sternförmig auf einer rosa Scheibe, und genau so schießt er auch: einmal in
 * jede der acht Richtungen, ohne zu zielen.
 */
function tackShooter(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = FUR.tack;
  ctx.strokeStyle = FUR.tackDark;
  ctx.lineWidth = LOOK.edge;
  ctx.beginPath();
  ctx.arc(0, 0, size * TACK.base, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  for (let spoke = 0; spoke < TACK.spokes; spoke += 1) {
    ctx.save();
    ctx.rotate((spoke / TACK.spokes) * Math.PI * 2);
    ctx.fillStyle = FUR.nail;
    ctx.fillRect(
      size * TACK.nailFrom,
      -size * TACK.nailThick * LOOK.half,
      size * TACK.nailLong,
      size * TACK.nailThick,
    );
    ctx.fillStyle = FUR.steel;
    ctx.beginPath();
    ctx.arc(
      size * TACK.nailFrom + size * TACK.nailLong,
      0,
      size * TACK.headSize,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = FUR.nail;
  ctx.beginPath();
  ctx.arc(0, 0, size * TACK.hub, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = FUR.steel;
  ctx.beginPath();
  ctx.arc(0, 0, size * TACK.bolt, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Ein Ballon.
 *
 * @remarks
 * Die Sorten unterscheiden sich nicht nur in der Farbe: Zebra bekommt Streifen,
 * Blei einen Metallglanz, Keramik einen Ring, der zeigt, wie viel von der
 * Hülle noch da ist. Zwei Sorten, die sich nur in der Füllfarbe unterscheiden,
 * wären im Gewimmel nicht zu trennen.
 */
function balloon(
  ctx: CanvasRenderingContext2D,
  kind: BloonKind,
  x: number,
  y: number,
  hull: number,
  hold: Hold,
): void {
  const breed = BLOONS[kind];
  const size = CELL * BLOON_SIZE;

  ctx.fillStyle = breed.paint;
  ctx.beginPath();
  ctx.ellipse(x, y, size * LOOK.wide, size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = breed.line;
  ctx.lineWidth = LOOK.line - LOOK.half;
  ctx.stroke();

  if (kind === "zebra") {
    ctx.fillStyle = breed.line;
    ctx.fillRect(
      x - size * LOOK.wide,
      y - size * LOOK.stripeUp,
      size * LOOK.wide * 2,
      size * LOOK.stripeThick,
    );
    ctx.fillRect(
      x - size * LOOK.wide,
      y + size * LOOK.stripeDown,
      size * LOOK.wide * 2,
      size * LOOK.stripeThick,
    );
  }
  if (kind === "ceramic") {
    ctx.strokeStyle = PAINT.shell;
    ctx.lineWidth = LOOK.line;
    ctx.beginPath();
    ctx.arc(
      x,
      y,
      size * LOOK.shell,
      0,
      Math.PI * 2 * (hull / BLOONS.ceramic.hull),
    );
    ctx.stroke();
  }

  // Das Knötchen unten und ein Glanzpunkt - daran erkennt man einen Ballon.
  ctx.fillStyle = breed.line;
  ctx.beginPath();
  ctx.moveTo(x - size * LOOK.knot, y + size);
  ctx.lineTo(x + size * LOOK.knot, y + size);
  ctx.lineTo(x, y + size * LOOK.knotLong);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAINT.shine;
  ctx.beginPath();
  ctx.ellipse(
    x - size * LOOK.shine,
    y - size * LOOK.shine,
    size * LOOK.shineWide,
    size * LOOK.shineHigh,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  if (hold !== null) {
    ctx.strokeStyle = hold === "frozen" ? PAINT.frost : PAINT.sticky;
    ctx.lineWidth = LOOK.line;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      size * LOOK.hold * LOOK.wide,
      size * LOOK.hold,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
}

/**
 * Ein Geschoss.
 *
 * @remarks
 * Der Wurfpfeil fliegt als Pfeil und dreht sich dabei in seine Flugrichtung -
 * derselbe Pfeil, den der Affe vorher in der Hand hatte, nur kleiner. Eine
 * Kugel wäre dasselbe Geschoss wie beim Nagel und beim Klecks, und dann sieht
 * man auf dem Feld nicht, wer gerade trifft.
 */
function flying(ctx: CanvasRenderingContext2D, shot: Shot): void {
  if (shot.from === "dart") {
    ctx.save();
    ctx.translate(shot.x, shot.y);
    ctx.rotate(Math.atan2(shot.vy, shot.vx));
    ctx.scale(LOOK.flyingDart, LOOK.flyingDart);
    dart(ctx, CELL * LOOK.tower);
    ctx.restore();
  } else {
    ctx.fillStyle =
      shot.from === "glue"
        ? PAINT.glue
        : shot.from === "ice"
          ? PAINT.ice
          : PAINT.shot;
    ctx.strokeStyle = PAINT.shotLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, CELL * LOOK.shot, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

/** Der Umriss des Turms, den man gerade setzen will. */
function ghost(ctx: CanvasRenderingContext2D, game: Game, view: View): void {
  const over = view.over;
  const picked = view.picked;

  if (over !== null && picked !== null) {
    const at = middleOf(over.col, over.row);
    const may = canBuild(game, picked, over.col, over.row);
    ctx.fillStyle = may ? PAINT.may : PAINT.mayNot;
    ctx.fillRect(over.col * CELL, over.row * CELL, CELL, CELL);
    ctx.fillStyle = PAINT.range;
    ctx.beginPath();
    ctx.arc(at.x, at.y, TOWERS[picked].range, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PAINT.rangeLine;
    ctx.lineWidth = LOOK.line;
    ctx.stroke();
  }
}
