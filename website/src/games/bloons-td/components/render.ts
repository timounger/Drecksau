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
  SEE_THROUGH,
  drawBar,
  drawBlimp,
  drawBoss,
  drawDizzy,
  drawMarks,
  drawShield,
} from "@/games/bloons-td/components/blimps";
import {
  drawAce,
  drawBananas,
  drawBoat,
  drawFarm,
  drawHeli,
  drawMortar,
  drawPad,
  drawSpikeFactory,
  drawSub,
  drawVillage,
  star,
  type MachinePose,
} from "@/games/bloons-td/components/machines";
import {
  BLOON_SIZE,
  courseOf,
  WATCH,
  canBuild,
  powerOf,
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
  type MapId,
  type Spot,
} from "@/games/bloons-td/engine/map";
import { TOWERS, type TowerKind } from "@/games/bloons-td/engine/towers";
import { NO_TIERS, statsOf } from "@/games/bloons-td/engine/upgrades";
import type {
  Bloon,
  Burst,
  Game,
  Shot,
  Tower,
} from "@/games/bloons-td/engine/types";

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
  cannonball: "#1f2937",
  cannonballShine: "rgba(255,255,255,0.55)",
  fireEdge: "#dc2626",
  fireCore: "#fde047",
  fireFlash: "#ffffff",
  water: "#3b82c4",
  waterDark: "#2f6fae",
  waterLine: "rgba(255,255,255,0.35)",
  tracer: "#fde68a",
  laser: "#f43f5e",
  laserCore: "#ffe4e6",
  magic: "#a855f7",
  magicCore: "#f5d0fe",
  flame: "#f97316",
  flameCore: "#fde047",
  potion: "#84cc16",
  potionDark: "#3f6212",
  glassRim: "#e2e8f0",
  thorn: "#4d7c0f",
  shuriken: "#9ca3af",
  shurikenDark: "#374151",
  rocket: "#6b7280",
  shadowAir: "rgba(0,0,0,0.25)",
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
  camo: "#4d6b3a",
  camoDark: "#2f4422",
  olive: "#5b6b4a",
  iron: "#374151",
  ironDark: "#111827",
  purple: "#6d28d9",
  purpleDark: "#4c1d95",
  star: "#fde047",
  hero: "#2563eb",
  cape: "#dc2626",
  capeDark: "#991b1b",
  black: "#111827",
  band: "#dc2626",
  coat: "#f1f5f9",
  brassGlass: "#a5f3fc",
  leaf: "#4d7c0f",
  leafLight: "#84cc16",
  orange: "#ea580c",
  hardHat: "#facc15",
  hardHatDark: "#ca8a04",
  stone: "#57534e",
  stoneLight: "#a8a29e",
  orb: "#c084fc",
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

/** Was die Affen auf dem Kopf tragen, in Teilen ihrer Größe. */
const HAT = {
  /** Hut mit breiter Krempe: Scharfschütze. */
  brimUp: 0.98,
  brimWide: 0.78,
  brimHigh: 0.2,
  crown: 0.46,
  /** Helme: Pfeilschuss, Pionier, Stachelexperte. */
  helmUp: 0.9,
  helm: 0.6,
  helmBrim: 0.12,
  helmLip: 0.1,
  spike: 0.22,
  /** Der spitze Hut des Zauberers. */
  coneBase: 1.02,
  coneWide: 0.6,
  coneUp: 2.05,
  coneTip: 0.18,
  starAt: 1.45,
  star: 0.1,
  /** Das Stirnband des Ninjas. */
  bandUp: 1.02,
  bandHigh: 0.17,
  bandWide: 0.58,
  tail: 0.35,
  tailDrop: 0.18,
  /** Die Schutzbrille des Alchemisten. */
  gogglesUp: 1.12,
  goggles: 0.15,
  gogglesApart: 0.22,
  /** Die Blätterkrone des Druiden. */
  leaves: 5,
  leafFrom: -2.6,
  leafTo: -0.55,
  leafOut: 0.52,
  leafLong: 0.2,
  leafWide: 0.1,
} as const;

/** Der Umhang des Super-Affen. */
const CAPE = {
  top: 0.05,
  bottom: 1.1,
  topWide: 0.42,
  bottomWide: 0.7,
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
  /** Das Gewehr des Scharfschützen. */
  rifleBack: 0.45,
  rifleLong: 1.05,
  rifle: 0.08,
  stock: 0.2,
  stockLong: 0.32,
  scopeAt: 0.1,
  scopeLong: 0.3,
  scope: 0.1,
  /** Die Pfeilschuss-Kanone: ein Kasten mit drei Läufen. */
  boxBack: 0.25,
  boxLong: 0.55,
  box: 0.42,
  barrels: 3,
  barrelLong: 0.6,
  barrelGap: 0.11,
  barrel: 0.06,
  /** Der Zauberstab. */
  wandLong: 0.5,
  wand: 0.08,
  orb: 0.15,
  glow: 0.28,
  /** Der Wurfstern. */
  starAt: 0.25,
  starSize: 0.24,
  starPoints: 4,
  /** Der Trank. */
  flaskAt: 0.25,
  flask: 0.2,
  neck: 0.08,
  neckLong: 0.18,
  /** Der Stab des Druiden. */
  staffBack: 0.35,
  staffLong: 0.75,
  staff: 0.09,
  staffLeaf: 0.16,
  /** Die Nagelpistole. */
  nailBack: 0.1,
  nailLong: 0.5,
  nailHigh: 0.26,
  nozzle: 0.1,
  /** Die Stachelkugel in der Hand. */
  ballAt: 0.3,
  ball: 0.26,
  ballSpikes: 8,
  ballSpike: 0.12,
} as const;

/** Die neuen Geschosse, in Teilen einer Feldbreite. */
const MISSILE = {
  /** Ein kleiner Pfeil für U-Boot, Boot, Flieger, Super-Affe und Pfeilschuss. */
  smallDart: 0.5,
  /** Der Laserstrahl. */
  laser: 0.28,
  laserThick: 0.05,
  /** Die Granate des Mörsers: wie hoch ihr Bogen ist und wie sehr sie dabei wächst. */
  shell: 0.08,
  arc: 0.9,
  grow: 0.7,
  /** Die Magiekugel des Zauberers. */
  orb: 0.07,
  orbGlow: 0.14,
  /** Der Wurfstern und wie schnell er sich dreht (Umdrehungen je Sekunde). */
  shuriken: 0.1,
  spin: 4,
  /** Der Trank des Alchemisten. */
  flask: 0.07,
  neck: 0.03,
  /** Der Dorn des Druiden. */
  thorn: 0.12,
  thornWide: 0.035,
  /** Der Nagelhaufen: im Flug klein, am Boden groß, und wann er zu verblassen anfängt. */
  pile: 0.13,
  pileFlying: 0.08,
  fade: 0.85,
  /** Die Stachelkugel. */
  ball: 0.13,
  ballSpikes: 10,
  ballSpike: 0.06,
  /** Die Rakete. */
  rocket: 0.12,
  rocketWide: 0.04,
  rocketFlame: 0.08,
} as const;

/** Die Leuchtspur, das Bananengeld und das Kräuseln auf dem Teich. */
const TRAIL = {
  tracer: 2,
  impact: 0.5,
  cashRise: 1,
  cashSize: 0.18,
  ripples: 2,
  rippleWide: 0.18,
  rippleAt: 0.3,
  /** Wie hoch über dem Boden ein Flieger schwebt, in Teilen der Turmgröße. */
  airLift: 0.9,
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
  /** Der Nagel im Flug: Schaft, Spitze und Kopf, in Teilen einer Feldbreite. */
  flyingLong: 0.22,
  flyingThick: 0.04,
  flyingTip: 0.07,
  flyingHead: 0.05,
} as const;

/** Der Bumerang im Flug, in Teilen einer Feldbreite. */
const BOOMERANG = {
  /** Wie lang ein Arm ist und wie dick. */
  arm: 0.16,
  thick: 0.06,
  /** Der halbe Winkel zwischen den Armen. */
  bend: 0.95,
  /** Umdrehungen pro Sekunde. */
  spin: 3,
} as const;

/** Die Kanonenkugel: Größe in Teilen einer Feldbreite, Glanzpunkt in Teilen der Kugel. */
const CANNONBALL = {
  size: 0.1,
  shineAt: 0.35,
  shine: 0.3,
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
  ground(ctx, game.map);
  reach(ctx, game, view);
  for (const tower of game.towers) {
    monkey(ctx, tower, view.chosen === tower.id, game.clock);
  }
  // Die großen zuerst, damit kleine Ballons neben einem Zeppelin nicht unter
  // ihm verschwinden.
  const bySize = [...game.bloons].sort(
    (a, b) => BLOONS[b.kind].size - BLOONS[a.kind].size,
  );
  for (const bloon of bySize) {
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
    sprite(ctx, bloon, hold, game.clock, courseOf(game.map).track);
  }
  for (const shot of game.shots) {
    flying(ctx, shot);
  }
  // **Wer fliegt, fliegt über allem** - auch über den Ballons, die er jagt.
  for (const tower of game.towers) {
    if (aloft(tower.kind)) {
      flyer(ctx, tower, game.clock);
    }
  }
  for (const burst of game.bursts) {
    flare(ctx, burst);
  }
  ghost(ctx, game, view);
}

/**
 * Ein Ballon, Zeppelin oder Boss, dort wo er gerade ist.
 *
 * @remarks
 * Getarnte sind halb durchsichtig und tragen Tarnflecken, ein verschobener
 * Phayze ist fast unsichtbar. Zeppeline fliegen mit dem Bug in Wegrichtung;
 * Zeppeline und Bosse tragen einen Lebensbalken, Bosse dazu ihren Namen.
 */
function sprite(
  ctx: CanvasRenderingContext2D,
  bloon: Bloon,
  hold: Hold,
  clock: number,
  track: readonly Spot[],
): void {
  const breed = BLOONS[bloon.kind];
  const at = spotAt(track, bloon.gone);
  const ahead = spotAt(track, bloon.gone + 1);
  const size = CELL * BLOON_SIZE * breed.size;
  const phased = bloon.phased > clock;

  ctx.save();
  ctx.globalAlpha = phased
    ? SEE_THROUGH.phased
    : bloon.camo
      ? SEE_THROUGH.camo
      : 1;
  switch (breed.class) {
    case "bloon":
      balloon(ctx, bloon.kind, at.x, at.y, bloon.hull / bloon.full, hold);
      ctx.translate(at.x, at.y);
      drawMarks(ctx, size, {
        camo: bloon.camo,
        regrow: bloon.regrow,
        fortified: bloon.fortified,
        shield: bloon.shield > 0,
      });
      break;
    case "blimp":
      ctx.translate(at.x, at.y);
      drawBlimp(
        ctx,
        size,
        Math.atan2(ahead.y - at.y, ahead.x - at.x),
        breed.paint,
        breed.line,
      );
      drawMarks(ctx, size, {
        camo: bloon.camo,
        regrow: false,
        fortified: bloon.fortified,
        shield: false,
      });
      if (bloon.shield > 0) {
        drawShield(ctx, size * LOOK.hold);
      }
      break;
    case "boss":
      ctx.translate(at.x, at.y);
      drawBoss(ctx, bloon.kind, size, breed.paint, breed.line, clock);
      if (bloon.shield > 0) {
        drawShield(ctx, size * LOOK.hold);
      }
      break;
  }
  ctx.globalAlpha = 1;
  if (breed.class !== "bloon") {
    drawBar(
      ctx,
      size,
      bloon.hull / bloon.full,
      bloon.shield / bloon.full,
      breed.class === "boss" ? breed.name : null,
    );
  }
  ctx.restore();
}

/** Ob ein Turm fliegt und deshalb über den Ballons gezeichnet wird. */
function aloft(kind: TowerKind): boolean {
  return TOWERS[kind].moves !== "stay";
}

/**
 * Ein Flieger dort, wo er gerade ist - samt Schatten auf dem Boden.
 *
 * @remarks
 * Der Schatten liegt unter ihm, der Flieger selbst ein Stück darüber. Ohne
 * Schatten sieht ein Hubschrauber über der Straße aus, als stünde er darauf.
 */
function flyer(
  ctx: CanvasRenderingContext2D,
  tower: Tower,
  clock: number,
): void {
  const size = CELL * LOOK.tower;
  const pose: MachinePose = { faced: tower.faced, kick: tower.kick, clock };

  ctx.fillStyle = PAINT.shadowAir;
  ctx.beginPath();
  ctx.ellipse(
    tower.x,
    tower.y + size * TRAIL.airLift,
    size * APE.shadowWide,
    size * APE.shadowHigh * 2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.save();
  ctx.translate(tower.x, tower.y);
  if (tower.kind === "heli") {
    drawHeli(ctx, size, pose);
  } else {
    drawAce(ctx, size, pose);
  }
  if (tower.stunned > 0) {
    drawDizzy(ctx, size, clock);
  }
  ctx.restore();
}

/**
 * Ein Knall, solange man ihn sieht.
 *
 * @remarks
 * Jede Art hat ihr Bild: Ein **geplatzter Ballon** ist ein dünner Ring in
 * seiner Farbe. Ein **Bombenknall** ist ein Feuerball mit Flammenzungen. Eine
 * **Frostwelle** ist eine helle Scheibe mit Eiszacken am Rand - sie ist
 * der ganze Angriff des Eisaffen und nicht nur seine Begleitmusik, also muss
 * man sie auch sehen.
 */
function flare(ctx: CanvasRenderingContext2D, burst: Burst): void {
  const share = Math.min(1, burst.age / burst.life);
  const left = 1 - share;
  const wide = burst.reach * (LOOK.burstFrom + share);

  switch (burst.look) {
    case "pop":
      ctx.strokeStyle = burst.paint;
      ctx.globalAlpha = left;
      ctx.lineWidth = LOOK.line;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, wide, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "blast":
      fireball(ctx, burst, wide, left);
      break;
    case "frost":
      frostWave(ctx, burst, wide, left);
      break;
    case "tracer":
      tracer(ctx, burst, left);
      break;
    case "stun":
      stunWave(ctx, burst, wide, left);
      break;
    case "cash":
      ctx.globalAlpha = left;
      drawBananas(
        ctx,
        burst.x,
        burst.y - burst.reach * TRAIL.cashRise * share,
        CELL * TRAIL.cashSize,
      );
      break;
  }

  ctx.globalAlpha = 1;
}

/**
 * Die Leuchtspur eines Scharfschusses.
 *
 * @remarks
 * Der Schuss selbst ist sofort da - zu sehen ist nur, was er hinterlässt: ein
 * heller Strich vom Gewehr zum Ziel, der schnell verblasst, und ein Aufblitzen
 * dort, wo er traf.
 */
function tracer(
  ctx: CanvasRenderingContext2D,
  burst: Burst,
  left: number,
): void {
  const from = burst.from ?? { x: burst.x, y: burst.y };
  ctx.globalAlpha = left;
  ctx.strokeStyle = PAINT.tracer;
  ctx.lineWidth = TRAIL.tracer;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(burst.x, burst.y);
  ctx.stroke();
  ctx.fillStyle = PAINT.fireFlash;
  ctx.beginPath();
  ctx.arc(burst.x, burst.y, burst.reach * TRAIL.impact * left, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Der Wirbel des Vortex: ein Ring, der nach außen läuft, mit Wirbelbögen
 * darin - so weit, wie er Türme lähmt.
 */
function stunWave(
  ctx: CanvasRenderingContext2D,
  burst: Burst,
  wide: number,
  left: number,
): void {
  ctx.globalAlpha = left;
  ctx.strokeStyle = burst.paint;
  ctx.lineWidth = LOOK.line * 2;
  ctx.beginPath();
  ctx.arc(burst.x, burst.y, wide, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = LOOK.line;
  for (let swirl = 0; swirl < BOOM.spikes; swirl += 2) {
    const turn = (swirl / BOOM.spikes) * Math.PI * 2 + left * Math.PI;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, wide * BOOM.spikeFrom, turn, turn + LOOK.half);
    ctx.stroke();
  }
}

/** Die Frostwelle des Eisaffen: eine helle Scheibe mit Eiszacken am Rand. */
function frostWave(
  ctx: CanvasRenderingContext2D,
  burst: Burst,
  wide: number,
  left: number,
): void {
  ctx.globalAlpha = left * BOOM.frostFill;
  ctx.fillStyle = PAINT.ice;
  ctx.beginPath();
  ctx.arc(burst.x, burst.y, wide, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = left;
  ctx.strokeStyle = PAINT.frostLine;
  ctx.lineWidth = LOOK.line + LOOK.line * left;
  ctx.stroke();

  // Zacken am Rand: Der Frost greift nach außen.
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

/** Wie ein Knall aussieht. */
const BOOM = {
  frostFill: 0.5,
  spikes: 10,
  spikeFrom: 0.75,
  spikeOut: 0.22,
  /** Der Feuerball: Glut und heller Kern, als Teil des ganzen Balls. */
  glow: 0.72,
  core: 0.42,
  /** Wie lange am Anfang ein weißer Blitz aufleuchtet, als Teil des Knalls. */
  flash: 0.3,
  /** Die Flammenzungen: wie viele und wie weit sie über den Ball hinausschlagen. */
  flames: 12,
  flameOut: 0.45,
  flameWide: 0.18,
} as const;

/**
 * Der Knall einer Kanonenkugel.
 *
 * @remarks
 * Ein Feuerball in drei Schichten - rot außen, orange, gelber Kern - mit
 * Flammenzungen am Rand und einem kurzen weißen Blitz im ersten Moment. Eine
 * einzelne blasse Scheibe sieht man im Gewimmel kaum, und die Kanone soll man
 * hören können, ohne Ton.
 */
function fireball(
  ctx: CanvasRenderingContext2D,
  burst: Burst,
  wide: number,
  left: number,
): void {
  const { x, y } = burst;

  ctx.globalAlpha = left;
  ctx.fillStyle = PAINT.fireEdge;
  ctx.beginPath();
  for (let flame = 0; flame < BOOM.flames; flame += 1) {
    const turn = (flame / BOOM.flames) * Math.PI * 2;
    const out = wide * (1 + BOOM.flameOut * left);
    ctx.moveTo(
      x + Math.cos(turn - BOOM.flameWide) * wide,
      y + Math.sin(turn - BOOM.flameWide) * wide,
    );
    ctx.lineTo(x + Math.cos(turn) * out, y + Math.sin(turn) * out);
    ctx.lineTo(
      x + Math.cos(turn + BOOM.flameWide) * wide,
      y + Math.sin(turn + BOOM.flameWide) * wide,
    );
  }
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, wide, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = burst.paint;
  ctx.beginPath();
  ctx.arc(x, y, wide * BOOM.glow, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAINT.fireCore;
  ctx.beginPath();
  ctx.arc(x, y, wide * BOOM.core * left, 0, Math.PI * 2);
  ctx.fill();

  const share = 1 - left;
  if (share < BOOM.flash) {
    ctx.globalAlpha = 1 - share / BOOM.flash;
    ctx.fillStyle = PAINT.fireFlash;
    ctx.beginPath();
    ctx.arc(x, y, wide * BOOM.core, 0, Math.PI * 2);
    ctx.fill();
  }
}

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
      x: CELL / 2,
      y: CELL / 2,
      brew: 0,
      stunned: 0,
      loaded: 0,
      aim: WATCH,
      faced: WATCH,
      kick: 0,
      tiers: NO_TIERS,
      pops: 0,
      target: "first",
    },
    false,
    0,
  );
  // Im Laden steht der Flieger auf seinem Platz - sonst sähe man nur den Platz.
  if (aloft(kind)) {
    const size = CELL * LOOK.tower;
    const pose: MachinePose = { faced: 0, kick: 0, clock: 0 };
    ctx.save();
    ctx.translate(CELL / 2, CELL / 2);
    if (kind === "heli") {
      drawHeli(ctx, size, pose);
    } else {
      drawAce(ctx, size, pose);
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Eine Karte allein, als quadratisches Bild - für die Kartenübersicht.
 *
 * @param ctx - die Zeichenfläche
 * @param map - welche Karte
 * @param box - wie breit und hoch das Bild ist, in Bildpunkten
 * @remarks
 * Derselbe Zeichner wie im Spiel, nur kleiner: Was man in der Übersicht
 * wählt, sieht genauso aus wie das, worauf man danach baut.
 */
export function drawMap(
  ctx: CanvasRenderingContext2D,
  map: MapId,
  box: number,
): void {
  ctx.save();
  ctx.scale(box / FIELD_W, box / FIELD_H);
  ground(ctx, map);
  ctx.restore();
}

/** Wiese, Straße und das Startfeld. */
function ground(ctx: CanvasRenderingContext2D, map: MapId): void {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = cellAt(map, col, row);
      const x = col * CELL;
      const y = row * CELL;
      // Zwei Grüntöne im Schachbrett: Eine einfarbige Wiese sieht aus wie ein
      // fehlendes Bild, und man sieht die Felder nicht, auf die man baut.
      ctx.fillStyle = groundPaint(cell, col, row);
      ctx.fillRect(x, y, CELL, CELL);
      if (cell === ".") {
        ctx.strokeStyle = PAINT.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + LOOK.half, y + LOOK.half, CELL - 1, CELL - 1);
      }
      if (cell === "~") {
        ripples(ctx, x, y);
      }
    }
  }
}

/** Welche Farbe ein Feld hat. */
function groundPaint(cell: string, col: number, row: number): string {
  let paint: string;
  switch (cell) {
    case "S":
      paint = PAINT.start;
      break;
    case "=":
      paint = PAINT.road;
      break;
    case "~":
      paint = (col + row) % 2 === 0 ? PAINT.water : PAINT.waterDark;
      break;
    default:
      // Zwei Grüntöne im Schachbrett: Eine einfarbige Wiese sieht aus wie ein
      // fehlendes Bild, und man sieht die Felder nicht, auf die man baut.
      paint = (col + row) % 2 === 0 ? PAINT.grass : PAINT.grassDark;
  }
  return paint;
}

/** Zwei helle Wellen auf einem Wasserfeld, damit es nicht wie blaue Wiese aussieht. */
function ripples(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = PAINT.waterLine;
  ctx.lineWidth = LOOK.line;
  for (let wave = 0; wave < TRAIL.ripples; wave += 1) {
    const cx = x + CELL * (TRAIL.rippleAt + wave * (1 - TRAIL.rippleAt * 2));
    const cy = y + CELL * (TRAIL.rippleAt + wave * (1 - TRAIL.rippleAt * 2));
    ctx.beginPath();
    ctx.arc(
      cx,
      cy,
      CELL * TRAIL.rippleWide,
      Math.PI * LOOK.half * LOOK.half,
      Math.PI * (1 - LOOK.half * LOOK.half),
    );
    ctx.stroke();
  }
}

/** Der Kreis, der zeigt, wie weit ein Turm reicht. */
function reach(ctx: CanvasRenderingContext2D, game: Game, view: View): void {
  const chosen = game.towers.find((one) => one.id === view.chosen);
  const at = chosen === undefined ? null : middleOf(chosen.col, chosen.row);

  if (chosen !== undefined && at !== null) {
    ctx.fillStyle = PAINT.range;
    ctx.beginPath();
    // Mit allem, was Dorf und Trank gerade dazugeben.
    ctx.arc(at.x, at.y, powerOf(chosen, game.towers).range, 0, Math.PI * 2);
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
  clock: number,
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
  standing(ctx, size, tower, clock);
  // **Wer betäubt ist, dem kreisen Sterne über dem Kopf** - sonst sieht ein
  // Turm, der wegen Vortex nicht schießt, aus wie ein Fehler.
  if (tower.stunned > 0 && !aloft(tower.kind)) {
    drawDizzy(ctx, size, clock);
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

/**
 * Was auf dem Feld eines Turms steht.
 *
 * @remarks
 * Maschinen und Gebäude haben ihren eigenen Zeichner, alle anderen sind Affen
 * mit Kostüm. Flieger lassen nur ihren Landeplatz zurück - sie selbst kommen
 * später, über den Ballons.
 */
function standing(
  ctx: CanvasRenderingContext2D,
  size: number,
  tower: Tower,
  clock: number,
): void {
  const pose: MachinePose = { faced: tower.faced, kick: tower.kick, clock };

  switch (tower.kind) {
    case "tack":
      tackShooter(ctx, size);
      break;
    case "bomb":
      cannon(ctx, size, tower.faced, tower.kick);
      break;
    case "sub":
      drawSub(ctx, size, pose);
      break;
    case "boat":
      drawBoat(ctx, size, pose);
      break;
    case "heli":
      drawPad(ctx, size, false);
      break;
    case "ace":
      drawPad(ctx, size, true);
      break;
    case "mortar":
      drawMortar(ctx, size, pose);
      break;
    case "farm":
      drawFarm(ctx, size);
      break;
    case "village":
      drawVillage(ctx, size);
      break;
    case "spikeFactory":
      drawSpikeFactory(ctx, size, pose);
      break;
    default: {
      const wait = statsOf(tower.kind, tower.tiers).reload;
      ape(ctx, size, tower.kind, {
        aim: tower.faced,
        kick: tower.kick,
        // Wie weit der nächste Wurf gediehen ist: null gleich nach dem letzten,
        // eins, wenn er wieder dran ist.
        ready: wait <= 0 ? 1 : 1 - Math.min(1, tower.loaded / wait),
      });
    }
  }
}

/**
 * Fell, Kostüm und Hände einer Sorte.
 *
 * @remarks
 * Die meisten sind braune Affen in einem anderen Anzug - der Kopf bleibt
 * Affe, nur der Rumpf trägt die Farbe der Rolle. Ein lila Kopf beim Zauberer
 * wäre ein anderes Tier.
 */
const COATS: Partial<Record<TowerKind, Partial<Coat>>> = {
  ice: { fur: FUR.ice, dark: FUR.iceDark, skin: FUR.snow, glove: FUR.glove },
  sniper: { suit: FUR.camo, glove: FUR.camoDark },
  dartling: { suit: FUR.olive, glove: FUR.iron },
  wizard: { suit: FUR.purple },
  super: { suit: FUR.hero, glove: FUR.cape },
  ninja: { suit: FUR.black, glove: FUR.black },
  alchemist: { suit: FUR.coat },
  druid: { suit: FUR.leaf },
  engineer: { suit: FUR.orange, glove: FUR.iron },
  spiker: { suit: FUR.stone, glove: FUR.iron },
};

/** Das Fell, der Umriss und die nackte Haut einer Sorte. */
function coatOf(kind: TowerKind): Coat {
  const plain = {
    fur: FUR.brown,
    dark: FUR.brownDark,
    skin: FUR.skin,
    glove: FUR.skin,
  };
  const own = { ...plain, ...COATS[kind] };
  return { ...own, suit: COATS[kind]?.suit ?? own.fur };
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
  /** Was der Rumpf trägt - beim gewöhnlichen Affen einfach das Fell. */
  readonly suit: string;
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
  // Der Umhang hängt hinter ihm - außer er dreht uns den Rücken zu.
  if (kind === "super" && back.z < 0) {
    cape(ctx, size);
  }
  legs(ctx, size, pose, coat.fur, coat.glove);
  body(ctx, size, pose, coat);
  if (back.z >= 0) {
    tail(ctx, size, back, coat.fur);
  }
  if (kind === "super" && back.z >= 0) {
    cape(ctx, size);
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

  ctx.fillStyle = coat.suit;
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

  hat(ctx, size, kind, pose);
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

/**
 * Was die neuen Affen auf dem Kopf tragen.
 *
 * @remarks
 * Auf vierundsechzig Bildpunkten erkennt man einen Affen zuerst am Kopf: Hut,
 * Helm, Stirnband, Brille oder Blätter sagen, wer er ist, bevor man sieht,
 * was er in der Hand hält.
 */
function hat(
  ctx: CanvasRenderingContext2D,
  size: number,
  kind: TowerKind,
  pose: Pose,
): void {
  switch (kind) {
    case "sniper":
      ctx.fillStyle = FUR.camo;
      ctx.strokeStyle = FUR.camoDark;
      ctx.lineWidth = LOOK.edge;
      ctx.beginPath();
      ctx.ellipse(
        0,
        -size * HAT.brimUp,
        size * HAT.brimWide,
        size * HAT.brimHigh,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -size * HAT.brimUp, size * HAT.crown, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      break;
    case "dartling":
      helmet(ctx, size, FUR.iron, FUR.ironDark);
      break;
    case "engineer":
      helmet(ctx, size, FUR.hardHat, FUR.hardHatDark);
      break;
    case "spiker":
      helmet(ctx, size, FUR.stone, FUR.iron);
      ctx.fillStyle = FUR.stoneLight;
      ctx.beginPath();
      ctx.moveTo(
        -size * HAT.spike * LOOK.half,
        -size * (HAT.helmUp + HAT.helm) + 1,
      );
      ctx.lineTo(0, -size * (HAT.helmUp + HAT.helm + HAT.spike));
      ctx.lineTo(
        size * HAT.spike * LOOK.half,
        -size * (HAT.helmUp + HAT.helm) + 1,
      );
      ctx.closePath();
      ctx.fill();
      break;
    case "wizard":
      ctx.fillStyle = FUR.purple;
      ctx.strokeStyle = FUR.purpleDark;
      ctx.lineWidth = LOOK.edge;
      ctx.beginPath();
      ctx.moveTo(-size * HAT.coneWide, -size * HAT.coneBase);
      ctx.lineTo(size * HAT.coneTip, -size * HAT.coneUp);
      ctx.lineTo(size * HAT.coneWide, -size * HAT.coneBase);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = FUR.star;
      ctx.beginPath();
      ctx.arc(0, -size * HAT.starAt, size * HAT.star, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "ninja": {
      ctx.fillStyle = FUR.band;
      ctx.fillRect(
        -size * HAT.bandWide,
        -size * HAT.bandUp,
        size * HAT.bandWide * 2,
        size * HAT.bandHigh,
      );
      // Die Enden des Knotens hängen hinten herunter, also auf der Seite, die
      // vom Gesicht abgewandt ist.
      const back = facet(pose.aim, Math.PI);
      ctx.strokeStyle = FUR.band;
      ctx.lineWidth = size * HAT.bandHigh * LOOK.half;
      ctx.lineCap = "round";
      for (const side of SIDES) {
        ctx.beginPath();
        ctx.moveTo(back.x * size * HAT.bandWide, -size * HAT.bandUp);
        ctx.lineTo(
          back.x * size * (HAT.bandWide + HAT.tail),
          -size * HAT.bandUp + size * HAT.tailDrop * (1 + side * LOOK.half),
        );
        ctx.stroke();
      }
      ctx.lineCap = "butt";
      break;
    }
    case "alchemist":
      for (const side of SIDES) {
        ctx.fillStyle = FUR.brass;
        ctx.beginPath();
        ctx.arc(
          side * size * HAT.gogglesApart,
          -size * HAT.gogglesUp,
          size * HAT.goggles,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.fillStyle = FUR.brassGlass;
        ctx.beginPath();
        ctx.arc(
          side * size * HAT.gogglesApart,
          -size * HAT.gogglesUp,
          size * HAT.goggles * LOOK.half,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    case "druid":
      ctx.fillStyle = FUR.leafLight;
      ctx.strokeStyle = FUR.leaf;
      ctx.lineWidth = 1;
      for (let leaf = 0; leaf < HAT.leaves; leaf += 1) {
        const turn = mix(HAT.leafFrom, HAT.leafTo, leaf / (HAT.leaves - 1));
        ctx.beginPath();
        ctx.ellipse(
          Math.cos(turn) * size * HAT.leafOut,
          -size * APE.headUp + Math.sin(turn) * size * HAT.leafOut,
          size * HAT.leafLong,
          size * HAT.leafWide,
          turn,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.stroke();
      }
      break;
    default:
      break;
  }
}

/** Ein Helm mit Schirm. */
function helmet(
  ctx: CanvasRenderingContext2D,
  size: number,
  paint: string,
  dark: string,
): void {
  ctx.fillStyle = paint;
  ctx.strokeStyle = dark;
  ctx.lineWidth = LOOK.edge;
  ctx.beginPath();
  ctx.arc(0, -size * HAT.helmUp, size * HAT.helm, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = dark;
  ctx.fillRect(
    -size * (HAT.helm + HAT.helmLip),
    -size * HAT.helmUp,
    size * (HAT.helm + HAT.helmLip) * 2,
    size * HAT.helmBrim,
  );
}

/** Der rote Umhang des Super-Affen. */
function cape(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = FUR.cape;
  ctx.strokeStyle = FUR.capeDark;
  ctx.lineWidth = LOOK.edge;
  ctx.beginPath();
  ctx.moveTo(-size * CAPE.topWide, size * CAPE.top);
  ctx.lineTo(size * CAPE.topWide, size * CAPE.top);
  ctx.lineTo(size * CAPE.bottomWide, size * CAPE.bottom);
  ctx.lineTo(-size * CAPE.bottomWide, size * CAPE.bottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
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
  moreGear(ctx, size, kind, hand);
}

/**
 * Was die neuen Affen in den Händen halten, im selben gedrehten Bild.
 *
 * @remarks
 * Jede Waffe zeigt nach rechts, also dorthin, wohin der Affe zielt: das
 * Gewehr mit Zielfernrohr, die Kanone mit drei Läufen, der Zauberstab mit
 * leuchtender Kugel, der Wurfstern, der Trank, der Stab mit Blättern, die
 * Nagelpistole und die Stachelkugel. Der Super-Affe hält nichts - er braucht
 * nichts.
 */
function moreGear(
  ctx: CanvasRenderingContext2D,
  size: number,
  kind: TowerKind,
  hand: number,
): void {
  switch (kind) {
    case "sniper":
      ctx.fillStyle = FUR.wood;
      ctx.fillRect(
        hand - size * GEAR.rifleBack - size * GEAR.stockLong,
        -size * GEAR.stock * LOOK.half,
        size * GEAR.stockLong,
        size * GEAR.stock,
      );
      ctx.fillStyle = FUR.iron;
      ctx.fillRect(
        hand - size * GEAR.rifleBack,
        -size * GEAR.rifle * LOOK.half,
        size * (GEAR.rifleBack + GEAR.rifleLong),
        size * GEAR.rifle,
      );
      ctx.fillStyle = FUR.ironDark;
      ctx.fillRect(
        hand - size * GEAR.scopeAt,
        -size * GEAR.scope * LOOK.half,
        size * GEAR.scopeLong,
        size * GEAR.scope,
      );
      break;
    case "dartling":
      ctx.fillStyle = FUR.iron;
      for (let barrel = 0; barrel < GEAR.barrels; barrel += 1) {
        const y = (barrel - (GEAR.barrels - 1) / 2) * size * GEAR.barrelGap;
        ctx.fillRect(
          hand + size * GEAR.boxLong - size * GEAR.boxBack,
          y - size * GEAR.barrel * LOOK.half,
          size * GEAR.barrelLong,
          size * GEAR.barrel,
        );
      }
      ctx.fillStyle = FUR.olive;
      ctx.strokeStyle = FUR.camoDark;
      ctx.lineWidth = LOOK.edge;
      ctx.beginPath();
      ctx.rect(
        hand - size * GEAR.boxBack,
        -size * GEAR.box * LOOK.half,
        size * GEAR.boxLong,
        size * GEAR.box,
      );
      ctx.fill();
      ctx.stroke();
      break;
    case "wizard":
      ctx.fillStyle = FUR.wood;
      ctx.fillRect(
        hand,
        -size * GEAR.wand * LOOK.half,
        size * GEAR.wandLong,
        size * GEAR.wand,
      );
      ctx.fillStyle = PAINT.magic;
      ctx.globalAlpha = LOOK.half;
      ctx.beginPath();
      ctx.arc(hand + size * GEAR.wandLong, 0, size * GEAR.glow, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = FUR.orb;
      ctx.beginPath();
      ctx.arc(hand + size * GEAR.wandLong, 0, size * GEAR.orb, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "ninja":
      shurikenAt(ctx, hand + size * GEAR.starAt, 0, size * GEAR.starSize, 0);
      break;
    case "alchemist":
      flask(ctx, hand + size * GEAR.flaskAt, 0, size * GEAR.flask, 0);
      break;
    case "druid":
      ctx.fillStyle = FUR.wood;
      ctx.fillRect(
        hand - size * GEAR.staffBack,
        -size * GEAR.staff * LOOK.half,
        size * (GEAR.staffBack + GEAR.staffLong),
        size * GEAR.staff,
      );
      ctx.fillStyle = FUR.leafLight;
      for (const side of SIDES) {
        ctx.beginPath();
        ctx.ellipse(
          hand + size * GEAR.staffLong,
          side * size * GEAR.staffLeaf * LOOK.half,
          size * GEAR.staffLeaf,
          size * GEAR.staffLeaf * LOOK.half,
          side * LOOK.half,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    case "engineer":
      ctx.fillStyle = FUR.orange;
      ctx.strokeStyle = FUR.iron;
      ctx.lineWidth = LOOK.edge;
      ctx.beginPath();
      ctx.rect(
        hand - size * GEAR.nailBack,
        -size * GEAR.nailHigh * LOOK.half,
        size * GEAR.nailLong,
        size * GEAR.nailHigh,
      );
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = FUR.steel;
      ctx.fillRect(
        hand - size * GEAR.nailBack + size * GEAR.nailLong,
        -size * GEAR.nozzle * LOOK.half,
        size * GEAR.nozzle,
        size * GEAR.nozzle,
      );
      break;
    case "spiker":
      spikeBall(
        ctx,
        hand + size * GEAR.ballAt,
        0,
        size * GEAR.ball,
        size * GEAR.ballSpike,
        GEAR.ballSpikes,
        0,
      );
      break;
    default:
      break;
  }
}

/** Ein Wurfstern mit vier Spitzen. */
function shurikenAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  turn: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.fillStyle = PAINT.shuriken;
  ctx.strokeStyle = PAINT.shurikenDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let tip = 0; tip < GEAR.starPoints * 2; tip += 1) {
    const angle = (tip / (GEAR.starPoints * 2)) * Math.PI * 2;
    const out = tip % 2 === 0 ? size : size * LOOK.half * LOOK.half;
    if (tip === 0) {
      ctx.moveTo(Math.cos(angle) * out, Math.sin(angle) * out);
    } else {
      ctx.lineTo(Math.cos(angle) * out, Math.sin(angle) * out);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAINT.shurikenDark;
  ctx.beginPath();
  ctx.arc(0, 0, size * LOOK.half * LOOK.half * LOOK.half, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Eine runde Trankflasche mit Hals, grün gefüllt. */
function flask(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  turn: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.fillStyle = PAINT.glassRim;
  ctx.fillRect(
    ((-size * GEAR.neck) / GEAR.flask) * LOOK.half,
    -size - (size * GEAR.neckLong) / GEAR.flask,
    (size * GEAR.neck) / GEAR.flask,
    (size * GEAR.neckLong) / GEAR.flask + size * LOOK.half,
  );
  ctx.fillStyle = PAINT.potion;
  ctx.strokeStyle = PAINT.potionDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAINT.shine;
  ctx.beginPath();
  ctx.arc(
    -size * LOOK.shine,
    -size * LOOK.shine,
    size * LOOK.shine,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}

/** Eine Kugel mit Stacheln ringsum. */
function spikeBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  spike: number,
  spikes: number,
  turn: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.fillStyle = FUR.stoneLight;
  for (let one = 0; one < spikes; one += 1) {
    const angle = (one / spikes) * Math.PI * 2;
    const side = angle + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(
      Math.cos(angle) * (size + spike),
      Math.sin(angle) * (size + spike),
    );
    ctx.lineTo(
      Math.cos(angle) * size + Math.cos(side) * spike * LOOK.half,
      Math.sin(angle) * size + Math.sin(side) * spike * LOOK.half,
    );
    ctx.lineTo(
      Math.cos(angle) * size - Math.cos(side) * spike * LOOK.half,
      Math.sin(angle) * size - Math.sin(side) * spike * LOOK.half,
    );
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = FUR.stone;
  ctx.strokeStyle = FUR.ironDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
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
  share: number,
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
    ctx.arc(x, y, size * LOOK.shell, 0, Math.PI * 2 * Math.min(1, share));
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
 * derselbe Pfeil, den der Affe vorher in der Hand hatte, nur kleiner. Jeder
 * andere Turm schießt das, was er in der Hand hält oder womit er im Vorbild
 * schießt - Nägel, Bumerang, Kugeln, Granaten, Magie, Wurfsterne, Tränke,
 * Dornen. Nur Eis und Kleber bleiben farbige Kugeln; die unterscheidet die
 * Farbe.
 */
function flying(ctx: CanvasRenderingContext2D, shot: Shot): void {
  switch (shot.from) {
    case "dart":
      ctx.save();
      ctx.translate(shot.x, shot.y);
      ctx.rotate(Math.atan2(shot.vy, shot.vx));
      ctx.scale(LOOK.flyingDart, LOOK.flyingDart);
      dart(ctx, CELL * LOOK.tower);
      ctx.restore();
      break;
    case "tack":
      flyingNail(ctx, shot);
      break;
    case "boomerang":
      flyingBoomerang(ctx, shot);
      break;
    case "bomb":
      cannonball(ctx, shot);
      break;
    case "engineer":
      flyingNail(ctx, shot);
      break;
    case "sub":
    case "boat":
    case "heli":
    case "ace":
    case "super":
    case "dartling":
      bolt(ctx, shot);
      break;
    case "mortar":
      shell(ctx, shot);
      break;
    case "wizard":
      magic(ctx, shot);
      break;
    case "ninja":
      shurikenAt(
        ctx,
        shot.x,
        shot.y,
        CELL * MISSILE.shuriken,
        shot.age * MISSILE.spin * Math.PI * 2,
      );
      break;
    case "alchemist":
      flask(
        ctx,
        shot.x,
        shot.y,
        CELL * MISSILE.flask,
        shot.age * MISSILE.spin * Math.PI * 2,
      );
      break;
    case "druid":
      thorn(ctx, shot);
      break;
    case "spikeFactory":
      pile(ctx, shot);
      break;
    case "spiker":
      spikeBall(
        ctx,
        shot.x,
        shot.y,
        CELL * MISSILE.ball,
        CELL * MISSILE.ballSpike,
        MISSILE.ballSpikes,
        // Sie rollt, also dreht sie sich mit der Strecke, die sie zurücklegt.
        (shot.road ?? 0) / (CELL * MISSILE.ball),
      );
      break;
    default:
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

/**
 * Ein Bumerang im Flug.
 *
 * @remarks
 * Zwei Arme, die sich in einem Knick treffen - und er dreht sich um sich
 * selbst, unabhängig davon, wohin er gerade fliegt. Der Winkel kommt aus dem
 * Alter des Geschosses, damit jeder Bumerang für sich weiterdreht.
 */
function flyingBoomerang(ctx: CanvasRenderingContext2D, shot: Shot): void {
  const arm = CELL * BOOMERANG.arm;

  ctx.save();
  ctx.translate(shot.x, shot.y);
  ctx.rotate(shot.age * BOOMERANG.spin * Math.PI * 2);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(Math.cos(-BOOMERANG.bend) * arm, Math.sin(-BOOMERANG.bend) * arm);
  ctx.lineTo(0, 0);
  ctx.lineTo(Math.cos(BOOMERANG.bend) * arm, Math.sin(BOOMERANG.bend) * arm);
  // Erst ein dunkler Rand, dann die Farbe darauf - so hebt er sich vom Gras ab.
  ctx.strokeStyle = PAINT.shotLine;
  ctx.lineWidth = CELL * BOOMERANG.thick + 2;
  ctx.stroke();
  ctx.strokeStyle = FUR.cap;
  ctx.lineWidth = CELL * BOOMERANG.thick;
  ctx.stroke();
  ctx.restore();
}

/**
 * Ein kleines Geschoss in Flugrichtung: Pfeil, Laser oder Rakete.
 *
 * @remarks
 * Was ein Geschoss ist, steht in seiner Schadensart: Energie fliegt als
 * Laserstrahl, Sprengstoff als Rakete, alles andere als Pfeil. So sieht man
 * einem Super-Affen an, ob er schon den Laser hat.
 */
function bolt(ctx: CanvasRenderingContext2D, shot: Shot): void {
  ctx.save();
  ctx.translate(shot.x, shot.y);
  ctx.rotate(Math.atan2(shot.vy, shot.vx));
  switch (shot.harm) {
    case "energy":
      ctx.lineCap = "round";
      ctx.strokeStyle = PAINT.laser;
      ctx.lineWidth = CELL * MISSILE.laserThick * 2;
      ctx.beginPath();
      ctx.moveTo(-CELL * MISSILE.laser * LOOK.half, 0);
      ctx.lineTo(CELL * MISSILE.laser * LOOK.half, 0);
      ctx.stroke();
      ctx.strokeStyle = PAINT.laserCore;
      ctx.lineWidth = CELL * MISSILE.laserThick;
      ctx.stroke();
      ctx.lineCap = "butt";
      break;
    case "explosion":
      ctx.fillStyle = PAINT.flame;
      ctx.beginPath();
      ctx.moveTo(
        -CELL * MISSILE.rocket * LOOK.half,
        -CELL * MISSILE.rocketWide,
      );
      ctx.lineTo(-CELL * (MISSILE.rocket * LOOK.half + MISSILE.rocketFlame), 0);
      ctx.lineTo(-CELL * MISSILE.rocket * LOOK.half, CELL * MISSILE.rocketWide);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PAINT.rocket;
      ctx.fillRect(
        -CELL * MISSILE.rocket * LOOK.half,
        -CELL * MISSILE.rocketWide,
        CELL * MISSILE.rocket,
        CELL * MISSILE.rocketWide * 2,
      );
      break;
    default:
      ctx.scale(MISSILE.smallDart, MISSILE.smallDart);
      dart(ctx, CELL * LOOK.tower);
  }
  ctx.restore();
}

/**
 * Eine Mörsergranate im Bogen.
 *
 * @remarks
 * Die Engine kennt nur den Punkt am Boden, über dem sie gerade ist. Wie hoch
 * sie dabei fliegt, ergibt sich aus der Flugzeit: in der Mitte am höchsten und
 * am größten, an beiden Enden am Boden. Darunter liegt ihr Schatten - daran
 * sieht man, wo sie herunterkommt.
 */
function shell(ctx: CanvasRenderingContext2D, shot: Shot): void {
  const flight = shot.land?.at ?? shot.life;
  const share = flight <= 0 ? 1 : Math.min(1, shot.age / flight);
  const high = Math.sin(Math.PI * share);
  const size = CELL * MISSILE.shell * (1 + MISSILE.grow * high);

  ctx.fillStyle = PAINT.shade;
  ctx.beginPath();
  ctx.ellipse(
    shot.x,
    shot.y,
    CELL * MISSILE.shell,
    CELL * MISSILE.shell * LOOK.half,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = PAINT.cannonball;
  ctx.beginPath();
  ctx.arc(shot.x, shot.y - CELL * MISSILE.arc * high, size, 0, Math.PI * 2);
  ctx.fill();
}

/** Ein Zauber: eine lila Kugel mit Schein - oder ein Feuerball. */
function magic(ctx: CanvasRenderingContext2D, shot: Shot): void {
  const fire = shot.blast !== null;
  ctx.fillStyle = fire ? PAINT.flame : PAINT.magic;
  ctx.globalAlpha = LOOK.half;
  ctx.beginPath();
  ctx.arc(shot.x, shot.y, CELL * MISSILE.orbGlow, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = fire ? PAINT.flameCore : PAINT.magicCore;
  ctx.beginPath();
  ctx.arc(shot.x, shot.y, CELL * MISSILE.orb, 0, Math.PI * 2);
  ctx.fill();
}

/** Ein Dorn, die Spitze voran. */
function thorn(ctx: CanvasRenderingContext2D, shot: Shot): void {
  ctx.save();
  ctx.translate(shot.x, shot.y);
  ctx.rotate(Math.atan2(shot.vy, shot.vx));
  ctx.fillStyle = PAINT.thorn;
  ctx.beginPath();
  ctx.moveTo(CELL * MISSILE.thorn * LOOK.half, 0);
  ctx.lineTo(-CELL * MISSILE.thorn * LOOK.half, -CELL * MISSILE.thornWide);
  ctx.lineTo(-CELL * MISSILE.thorn * LOOK.half, CELL * MISSILE.thornWide);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Ein Nagelhaufen: unterwegs klein, auf der Straße in voller Größe.
 *
 * @remarks
 * Gegen Ende seiner Zeit verblasst er, damit er nicht von einem Bild aufs
 * nächste verschwindet.
 */
function pile(ctx: CanvasRenderingContext2D, shot: Shot): void {
  const landed = shot.land === null || shot.age >= shot.land.at;
  const share = shot.life <= 0 ? 1 : shot.age / shot.life;
  ctx.globalAlpha = share > MISSILE.fade ? (1 - share) / (1 - MISSILE.fade) : 1;
  star(
    ctx,
    shot.x,
    shot.y,
    CELL * (landed ? MISSILE.pile : MISSILE.pileFlying),
  );
  ctx.globalAlpha = 1;
}

/** Eine Kanonenkugel: schwarz, schwer, mit einem Glanzpunkt oben links. */
function cannonball(ctx: CanvasRenderingContext2D, shot: Shot): void {
  const size = CELL * CANNONBALL.size;

  ctx.fillStyle = PAINT.cannonball;
  ctx.strokeStyle = PAINT.shotLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(shot.x, shot.y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAINT.cannonballShine;
  ctx.beginPath();
  ctx.arc(
    shot.x - size * CANNONBALL.shineAt,
    shot.y - size * CANNONBALL.shineAt,
    size * CANNONBALL.shine,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

/** Ein Reißnagel im Flug: hinten der Kopf, vorne die Spitze. */
function flyingNail(ctx: CanvasRenderingContext2D, shot: Shot): void {
  const long = CELL * TACK.flyingLong;
  const thick = CELL * TACK.flyingThick;
  const tip = CELL * TACK.flyingTip;
  const back = -long * LOOK.half;

  ctx.save();
  ctx.translate(shot.x, shot.y);
  ctx.rotate(Math.atan2(shot.vy, shot.vx));
  ctx.strokeStyle = FUR.nail;
  ctx.lineWidth = 1;

  // Schaft mit Spitze.
  ctx.fillStyle = FUR.steel;
  ctx.beginPath();
  ctx.moveTo(back, -thick * LOOK.half);
  ctx.lineTo(back + long - tip, -thick * LOOK.half);
  ctx.lineTo(back + long, 0);
  ctx.lineTo(back + long - tip, thick * LOOK.half);
  ctx.lineTo(back, thick * LOOK.half);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Der flache Kopf steht quer zum Schaft.
  ctx.fillStyle = FUR.nail;
  ctx.beginPath();
  ctx.ellipse(back, 0, thick, CELL * TACK.flyingHead, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
