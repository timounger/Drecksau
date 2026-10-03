/**
 * Was am Meeresgrund steht und nur dort steht.
 *
 * @module
 * @remarks
 * Hier stehen die **Häuser**; wer in ihnen wohnt, steht in {@link ./dwellers}.
 * Zusammengeführt werden beide in {@link ./landmark-art}.
 *
 * Kein Hindernis, sondern eine **Landmarke**: Das Haus steht im Hafenbecken
 * auf dem Grund, man fährt daran vorbei, und es tut einem nichts. Genau
 * deshalb gehört es nicht zum Fels, sondern zu derselben Sorte Feld wie der
 * Tang - etwas, das man sieht und nicht anfasst.
 *
 * Eine Landmarke macht aus einem Kurs einen Ort. Wer das Hafenbecken zum
 * dritten Mal fährt, erkennt es nicht an seinen Felsen wieder, sondern daran,
 * dass hier jemand wohnt.
 */
import { CELL } from "@/games/uboot/engine/types";

/** Die Farben des Ananashauses. */
const PAINT = {
  skin: "#f2a33c",
  skinLight: "#ffc45e",
  skinDark: "#c97c1d",
  seam: "rgba(150,80,10,0.55)",
  leaf: "#4f9b2f",
  leafDark: "#36721e",
  door: "#8f7bc4",
  doorDark: "#5f4e92",
  frame: "#6b5aa0",
  glass: "#7fc7ea",
  glassDark: "#3f7fa0",
  pipe: "#b9c7e8",
  pipeDark: "#6f7fa8",
  shine: "rgba(255,255,255,0.65)",
  line: "rgba(60,30,0,0.75)",
} as const;

/** Die Maße, in Vielfachen einer Kursfeldbreite. */
const HOUSE = {
  /** Wie breit und wie hoch die Frucht ist. */
  wide: 1.2,
  high: 1.8,
  /** Wie weit über dem Boden ihr Mittelpunkt liegt. */
  up: 1.68,
  /** Das Rautenmuster: wie viele Linien je Richtung. */
  seams: 5,
  seamLine: 1.5,
  /** Die Blätter oben. */
  leaves: 9,
  leafLong: 1.6,
  leafWide: 0.13,
  leafFan: 1.5,
  /** Die Tür: Breite, Höhe und wie hoch ihr Rundbogen ansetzt. */
  doorWide: 0.3,
  doorHigh: 0.62,
  doorFrame: 0.05,
  knob: 0.07,
  /** Das runde Fenster oben links und das kleine unten rechts. */
  roundX: -0.4,
  roundY: -0.45,
  roundR: 0.26,
  smallX: 0.42,
  smallY: 0.3,
  smallR: 0.17,
  /** Und die Glanzlichter darauf. */
  shineOff: 0.35,
  shineR: 0.3,
  /** Der Kamin rechts: wo er steht, wie schmal und wie hoch er ist. */
  pipeX: 1.22,
  pipeTop: -0.62,
  pipeWide: 0.11,
  pipeHigh: 0.52,
  /** Die Krempe obendrauf und der dunkle Ring darunter. */
  pipeLip: 1.45,
  pipeLipHigh: 0.06,
  pipeBand: 0.1,
  pipeBandHigh: 0.07,
} as const;

/** Die Farben des Steinhauses. */
const STONE = {
  light: "#7a4b43",
  body: "#5e3630",
  dark: "#43241f",
  speck: "rgba(30,14,10,0.35)",
  shine: "rgba(255,200,180,0.18)",
  mast: "#2b2b33",
  aerial: "#f2d23c",
} as const;

/** Die Maße des Steinhauses, in Vielfachen einer Kursfeldbreite. */
const ROCK = {
  /** Wie breit die Kuppel ist und wie hoch. */
  wide: 1.5,
  high: 1.15,
  /** Die Flecken darauf: wie viele und wie groß. */
  specks: 7,
  speck: 0.17,
  /** Wie weit der Sand an ihr hochkriecht. */
  foot: 0.1,
  /** Die Antenne: Masthöhe, Dicke und wo die Querstäbe sitzen. */
  mast: 0.95,
  mastThick: 2,
  bars: 2,
  barFrom: 0.45,
  barStep: 0.28,
  barWide: 0.78,
  barLift: 0.14,
  /** Und die Fähnchen an ihren Enden. */
  flag: 0.07,
  flagLong: 0.17,
} as const;

/** Die Farben des Eimers. */
const BUCKET = {
  tin: "#8fa2ad",
  tinLight: "#b6c6cf",
  tinDark: "#5d6e78",
  band: "#c9d6dd",
  letters: "#b8323c",
  sack: "#6f86a8",
  sackLight: "#9fb3cc",
  door: "#caa15c",
  doorDark: "#8a6b35",
  glass: "#cfe8f2",
  line: "rgba(30,45,55,0.75)",
} as const;

/** Die Maße des Eimers, in Vielfachen einer Kursfeldbreite. */
const PAIL = {
  /** Oben breiter als unten - sonst ist es kein Eimer. */
  top: 1.05,
  foot: 0.74,
  high: 1.5,
  /** Der Reifen oben und der Boden unten. */
  rim: 0.14,
  base: 0.1,
  /** Das Schriftband quer darüber. */
  bandY: 0.46,
  bandHigh: 0.26,
  lines: 2,
  lineWide: 0.62,
  lineThick: 0.07,
  lineStep: 0.3,
  /** Die Tür unten in der Mitte. */
  doorWide: 0.26,
  doorHigh: 0.34,
  knob: 0.04,
  /** Die zwei kleinen Fenster daneben. */
  paneX: 0.42,
  paneY: 0.22,
  pane: 0.08,
  /** Der Henkel: wie weit er aufschwingt. */
  handleUp: 0.52,
  handleThick: 0.08,
  /** Und der Sack obendrauf. */
  sackWide: 0.46,
  sackHigh: 0.42,
  sackUp: 0.3,
  knot: 0.18,
  knotHigh: 0.14,
} as const;

/**
 * Zeichnet den Eimer mit dem Schriftzug auf den Meeresgrund.
 *
 * @param ctx - die Zeichenfläche
 * @param x - die linke Kante seines Feldes im Bild
 * @param y - und dessen obere Kante
 * @remarks
 * Ein Blecheimer, oben breiter als unten, mit Henkel, einem Sack darauf und
 * einem roten Schriftband quer über dem Bauch. Gelesen wird das bei dieser
 * Größe nicht - erkannt schon, und das ist bei einem Schild der Sinn.
 */
export function drawAbfalleimer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  const foot = y + CELL;
  const middle = x + CELL / 2;
  const top = CELL * PAIL.top;
  const base = CELL * PAIL.foot;
  const high = CELL * PAIL.high;
  const lid = foot - high;

  sack(ctx, middle, lid);
  handle(ctx, middle, lid, top);

  // Der Bauch: ein Trapez, oben weit, unten eng.
  const tin = ctx.createLinearGradient(middle - top, 0, middle + top, 0);
  tin.addColorStop(0, BUCKET.tinDark);
  tin.addColorStop(HALF, BUCKET.tin);
  tin.addColorStop(1, BUCKET.tinDark);
  ctx.fillStyle = tin;
  ctx.beginPath();
  ctx.moveTo(middle - top, lid);
  ctx.lineTo(middle + top, lid);
  ctx.lineTo(middle + base, foot);
  ctx.lineTo(middle - base, foot);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = BUCKET.line;
  ctx.lineWidth = HOUSE.seamLine;
  ctx.stroke();

  // Reifen oben, Boden unten.
  ctx.fillStyle = BUCKET.tinLight;
  ctx.fillRect(middle - top, lid, top * 2, high * PAIL.rim * HALF);
  ctx.fillStyle = BUCKET.tinDark;
  ctx.fillRect(
    middle - base,
    foot - high * PAIL.base * HALF,
    base * 2,
    high * PAIL.base * HALF,
  );

  // Das Schriftband.
  const bandY = foot - high * PAIL.bandY;
  const bandHigh = high * PAIL.bandHigh;
  const bandWide = top * (1 - PAIL.bandY * HALF);
  ctx.fillStyle = BUCKET.band;
  ctx.fillRect(
    middle - bandWide,
    bandY - bandHigh * HALF,
    bandWide * 2,
    bandHigh,
  );
  ctx.strokeStyle = BUCKET.letters;
  ctx.lineWidth = CELL * PAIL.lineThick;
  for (let line = 0; line < PAIL.lines; line += 1) {
    const at = bandY + (line - HALF) * bandHigh * PAIL.lineStep * 2;
    const half =
      bandWide * PAIL.lineWide * (line === 0 ? 1 : HALF + HALF * HALF);
    ctx.beginPath();
    ctx.moveTo(middle - half, at);
    ctx.lineTo(middle + half, at);
    ctx.stroke();
  }

  // Tür und Fenster.
  const doorHigh = high * PAIL.doorHigh;
  const doorHalf = base * PAIL.doorWide;
  ctx.fillStyle = BUCKET.door;
  ctx.beginPath();
  ctx.moveTo(middle - doorHalf, foot);
  ctx.lineTo(middle - doorHalf, foot - doorHigh + doorHalf);
  ctx.arc(middle, foot - doorHigh + doorHalf, doorHalf, Math.PI, 0);
  ctx.lineTo(middle + doorHalf, foot);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = BUCKET.doorDark;
  ctx.stroke();
  ctx.fillStyle = BUCKET.doorDark;
  ctx.beginPath();
  ctx.arc(
    middle + doorHalf * HALF,
    foot - doorHigh * HALF,
    CELL * PAIL.knob,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.fillStyle = BUCKET.glass;
  for (const side of WAYS) {
    ctx.beginPath();
    ctx.arc(
      middle + side * base * PAIL.paneX,
      foot - high * PAIL.paneY,
      CELL * PAIL.pane,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/** Der Henkel über dem Eimer. */
function handle(
  ctx: CanvasRenderingContext2D,
  middle: number,
  lid: number,
  top: number,
): void {
  ctx.strokeStyle = BUCKET.tinDark;
  ctx.lineWidth = CELL * PAIL.handleThick;
  ctx.beginPath();
  ctx.moveTo(middle - top, lid);
  ctx.quadraticCurveTo(
    middle,
    lid - CELL * PAIL.handleUp * 2,
    middle + top,
    lid,
  );
  ctx.stroke();
}

/** Der Sack, der oben auf dem Henkel hängt. */
function sack(
  ctx: CanvasRenderingContext2D,
  middle: number,
  lid: number,
): void {
  const wide = CELL * PAIL.sackWide;
  const high = CELL * PAIL.sackHigh;
  const heart = lid - CELL * PAIL.sackUp - high * HALF;

  ctx.fillStyle = BUCKET.sack;
  ctx.beginPath();
  ctx.ellipse(middle, heart, wide, high, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BUCKET.sackLight;
  ctx.beginPath();
  ctx.ellipse(
    middle - wide * HALF,
    heart - high * HALF,
    wide * HALF,
    high * HALF,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Der zugebundene Zipfel obendrauf.
  ctx.fillStyle = BUCKET.sack;
  ctx.beginPath();
  ctx.rect(
    middle - CELL * PAIL.knot * HALF,
    heart - high - CELL * PAIL.knotHigh * HALF,
    CELL * PAIL.knot,
    CELL * PAIL.knotHigh * 2,
  );
  ctx.fill();
}

/** Die Farben des Steinkopfes. */
const MOAI = {
  stone: "#6f84a8",
  stoneLight: "#93a8c6",
  stoneDark: "#4a5c7c",
  speck: "rgba(25,35,55,0.3)",
  glass: "#8fc7e0",
  frame: "#3c4c6a",
  door: "#c08b3e",
  doorDark: "#7d5721",
  step: "#5a6b84",
  line: "rgba(20,30,50,0.8)",
} as const;

/** Die Maße des Steinkopfes, in Vielfachen einer Kursfeldbreite. */
const HEAD = {
  /** Oben schmal, unten breit - der ganze Kopf ist ein Trapez. */
  top: 0.55,
  foot: 0.95,
  high: 2.3,
  /** Die Krempe quer über dem oberen Drittel. */
  brimY: 0.66,
  brimWide: 1.75,
  brimHigh: 0.14,
  /** Die beiden Ohren an den Seiten. */
  earY: 0.5,
  earFrom: 0.68,
  earOut: 1.08,
  earHigh: 0.3,
  /** Die Augen darunter. */
  eyeY: 0.56,
  eyeOut: 0.42,
  eye: 0.13,
  /** Die lange Nase dazwischen. */
  noseTop: 0.54,
  noseLow: 0.22,
  noseWide: 0.1,
  noseFoot: 0.2,
  /** Die Tür unten. */
  doorWide: 0.3,
  doorHigh: 0.3,
  knob: 0.035,
  /** Die Sprenkel im Stein. */
  specks: 6,
  speck: 0.1,
  /** Und die Stufen davor. */
  steps: 3,
  stepWide: 0.5,
  stepHigh: 0.05,
  stepOut: 0.45,
} as const;

/**
 * Zeichnet den Steinkopf auf den Meeresgrund.
 *
 * @param ctx - die Zeichenfläche
 * @param x - die linke Kante seines Feldes im Bild
 * @param y - und dessen obere Kante
 * @remarks
 * Ein Kopf aus Stein: schmal oben, breit unten, mit einer Krempe über den
 * Augen, zwei Ohren an den Seiten, einer langen Nase und einer Tür darunter.
 * Die Augen sind Fenster - daran erkennt man, dass es ein Haus ist und kein
 * Felsen.
 */
export function drawThaddaeus(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  const foot = y + CELL;
  const middle = x + CELL / 2;
  const top = CELL * HEAD.top;
  const base = CELL * HEAD.foot;
  const high = CELL * HEAD.high;
  const crown = foot - high;

  steps(ctx, middle, foot, base);

  // Die Ohren, hinter dem Kopf.
  ctx.fillStyle = MOAI.stoneDark;
  for (const side of WAYS) {
    const from = middle + side * base * HEAD.earFrom;
    const to = middle + side * base * HEAD.earOut;
    ctx.fillRect(
      Math.min(from, to),
      foot - high * HEAD.earY - high * HEAD.earHigh * HALF,
      Math.abs(to - from),
      high * HEAD.earHigh,
    );
  }

  // Der Kopf.
  const stone = ctx.createLinearGradient(middle - base, 0, middle + base, 0);
  stone.addColorStop(0, MOAI.stoneLight);
  stone.addColorStop(HALF, MOAI.stone);
  stone.addColorStop(1, MOAI.stoneDark);
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.moveTo(middle - top, crown);
  ctx.lineTo(middle + top, crown);
  ctx.lineTo(middle + base, foot);
  ctx.lineTo(middle - base, foot);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = MOAI.line;
  ctx.lineWidth = HOUSE.seamLine;
  ctx.stroke();

  // Sprenkel, damit der Stein kein Karton ist.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(middle - top, crown);
  ctx.lineTo(middle + top, crown);
  ctx.lineTo(middle + base, foot);
  ctx.lineTo(middle - base, foot);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = MOAI.speck;
  for (let speck = 0; speck < HEAD.specks; speck += 1) {
    const along = (speck / HEAD.specks) * 2 - 1;
    ctx.beginPath();
    ctx.ellipse(
      middle + along * base * HALF,
      foot - high * ((speck % HEAD.steps) / HEAD.steps + HALF * HALF),
      base * HEAD.speck,
      high * HEAD.speck * HALF,
      along,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();

  // Die Krempe über den Augen.
  ctx.fillStyle = MOAI.stoneDark;
  ctx.fillRect(
    middle - base * HEAD.brimWide * HALF,
    foot - high * HEAD.brimY,
    base * HEAD.brimWide,
    high * HEAD.brimHigh,
  );

  // Die Augen: zwei Fenster.
  for (const side of WAYS) {
    const at = middle + side * base * HEAD.eyeOut;
    const eye = foot - high * HEAD.eyeY;
    ctx.fillStyle = MOAI.frame;
    ctx.beginPath();
    ctx.arc(at, eye, base * HEAD.eye, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = MOAI.glass;
    ctx.beginPath();
    ctx.arc(
      at,
      eye,
      base * HEAD.eye * (1 - HOUSE.doorFrame * 2),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Die Nase: heller als der Kopf, damit sie vorsteht.
  ctx.fillStyle = MOAI.stoneLight;
  ctx.beginPath();
  ctx.moveTo(middle - base * HEAD.noseWide, foot - high * HEAD.noseTop);
  ctx.lineTo(middle + base * HEAD.noseWide, foot - high * HEAD.noseTop);
  ctx.lineTo(middle + base * HEAD.noseFoot, foot - high * HEAD.noseLow);
  ctx.lineTo(middle - base * HEAD.noseFoot, foot - high * HEAD.noseLow);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = MOAI.line;
  ctx.lineWidth = HOUSE.seamLine;
  ctx.stroke();

  // Und die Tür.
  const doorHalf = base * HEAD.doorWide * HALF;
  const doorHigh = high * HEAD.doorHigh;
  ctx.fillStyle = MOAI.door;
  ctx.beginPath();
  ctx.moveTo(middle - doorHalf, foot);
  ctx.lineTo(middle - doorHalf, foot - doorHigh + doorHalf);
  ctx.arc(middle, foot - doorHigh + doorHalf, doorHalf, Math.PI, 0);
  ctx.lineTo(middle + doorHalf, foot);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = MOAI.doorDark;
  ctx.stroke();
  ctx.fillStyle = MOAI.doorDark;
  ctx.beginPath();
  ctx.arc(
    middle + doorHalf * HALF,
    foot - doorHigh * HALF,
    base * HEAD.knob,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

/** Die Stufen, die zur Tür führen. */
function steps(
  ctx: CanvasRenderingContext2D,
  middle: number,
  foot: number,
  base: number,
): void {
  ctx.fillStyle = MOAI.step;
  for (let step = 0; step < HEAD.steps; step += 1) {
    const out = base * HEAD.stepOut * (step + 1);
    ctx.fillRect(
      middle + out - base * HEAD.stepWide * HALF,
      foot - CELL * HEAD.stepHigh,
      base * HEAD.stepWide,
      CELL * HEAD.stepHigh,
    );
  }
}

/** Die Farben der Glaskuppel mit dem Baum. */
const DOME_HOUSE = {
  glass: "rgba(190,232,245,0.32)",
  glassEdge: "rgba(225,248,255,0.85)",
  shine: "rgba(255,255,255,0.5)",
  grass: "#5fae4a",
  grassDark: "#3f8433",
  trunk: "#7a5230",
  trunkDark: "#59391d",
  crown: "#3f8f3a",
  crownLight: "#6cbd57",
  crownDark: "#27602a",
  crownTop: "#8ed16a",
  hatch: "#9fb4c2",
  hatchDark: "#64798a",
  hatchGlass: "#cfe8f2",
  hatchRoof: "#7e93a4",
  line: "rgba(30,60,70,0.6)",
} as const;

/** Die Maße der Glaskuppel, in Vielfachen einer Kursfeldbreite. */
const TREEDOME = {
  /** Wie breit die Kuppel ist und wie hoch. */
  wide: 1.6,
  high: 1.5,
  /** Der Grasstreifen darin. */
  grass: 0.12,
  /** Der Stamm: wie hoch, wie dick unten und wie dick oben. */
  trunk: 0.5,
  trunkFoot: 0.16,
  trunkTop: 0.08,
  /** Die beiden Äste: wo sie abgehen, wie weit und wie steil. */
  branchAt: 0.62,
  branchOut: 0.3,
  branchUp: 0.22,
  branchThick: 0.05,
  /** Die Krone: wie groß, wie hoch sie sitzt und aus wie vielen Büscheln. */
  crown: 0.58,
  crownUp: 0.78,
  puffs: 7,
  puffSpread: 0.5,
  puffLift: 0.3,
  puffSize: 0.42,
  puffVary: 0.18,
  /** Wie viel höher der dunkle Grund der Krone ist als halb so hoch. */
  backHigh: 1.2,
  /** Die helleren Büschel obendrauf. */
  tops: 3,
  topSize: 0.3,
  topUp: 0.2,
  /** Wie stark die Krone dabei atmet. */
  breathe: 0.03,
  /**
   * Der Glanzbogen auf dem Glas, als Teiler von Pi.
   *
   * @remarks
   * Der kleinere Teiler ist der **spätere** Winkel: Ein Bogen, dessen Anfang
   * hinter seinem Ende liegt, läuft in Canvas einmal fast ganz herum - und
   * genau das stand hier eine Weile als Strich quer durch den Meeresgrund.
   */
  shineFrom: 2.5,
  shineTo: 3.9,
  shineIn: 0.84,
  shineThick: 0.07,
  /** Die Schleuse rechts: wie weit außen, wie breit und wie hoch. */
  lockX: 0.92,
  lockWide: 0.56,
  lockHigh: 0.5,
  /** Ihr Dach: wie weit es übersteht und wie dick es ist. */
  roofOut: 0.08,
  roofThick: 0.09,
  /** Und die beiden Luken darin. */
  hatchWide: 0.19,
  hatchHigh: 0.34,
  hatchApart: 0.23,
  wheel: 0.05,
} as const;

/**
 * Zeichnet die Glaskuppel mit dem Baum auf den Meeresgrund.
 *
 * @param ctx - die Zeichenfläche
 * @param x - die linke Kante ihres Feldes im Bild
 * @param y - und dessen obere Kante
 * @param time - die Uhr des Tauchgangs, damit die Krone atmet
 * @remarks
 * Das einzige Haus, in das man hineinsieht: ein Stück Land unter einer
 * Glocke, mit Gras, einem Baum und einer Schleuse an der Seite. Draußen
 * Wasser, drinnen Luft - und man sieht beides gleichzeitig.
 */
export function drawSandy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const foot = y + CELL;
  const middle = x + CELL / 2;
  const wide = CELL * TREEDOME.wide;
  const high = CELL * TREEDOME.high;

  airlock(ctx, middle + wide * TREEDOME.lockX, foot, wide, high);

  // Erst der Inhalt, dann das Glas darüber - sonst läge die Kuppel hinter
  // ihrem eigenen Baum.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(middle, foot, wide, high, 0, Math.PI, 0);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = DOME_HOUSE.grass;
  ctx.beginPath();
  ctx.ellipse(middle, foot, wide, high * TREEDOME.grass, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  tree(ctx, middle, foot, wide, high, time);
  ctx.restore();

  // Das Glas: ein Hauch Blau, ein Bogen Glanz und ein heller Rand.
  ctx.fillStyle = DOME_HOUSE.glass;
  ctx.beginPath();
  ctx.ellipse(middle, foot, wide, high, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = DOME_HOUSE.glassEdge;
  ctx.lineWidth = HOUSE.seamLine;
  ctx.stroke();

  ctx.strokeStyle = DOME_HOUSE.shine;
  ctx.lineWidth = high * TREEDOME.shineThick;
  ctx.beginPath();
  ctx.ellipse(
    middle,
    foot,
    wide * TREEDOME.shineIn,
    high * TREEDOME.shineIn,
    0,
    Math.PI + Math.PI / TREEDOME.shineTo,
    Math.PI + Math.PI / TREEDOME.shineFrom,
  );
  ctx.stroke();
}

/**
 * Der Baum unter der Glocke.
 *
 * @remarks
 * Ein Stamm, der sich nach oben verjüngt, zwei Äste und eine Krone aus
 * Büscheln in drei Grüntönen - dunkel von unten, hell von oben. Ein grüner
 * Kreis auf einem Strich wäre ein Lutscher; was man wiedererkennt, sind die
 * Lücken dazwischen.
 */
function tree(
  ctx: CanvasRenderingContext2D,
  middle: number,
  foot: number,
  wide: number,
  high: number,
  time: number,
): void {
  const trunkHigh = high * TREEDOME.trunk;
  const top = foot - trunkHigh;

  // Der Stamm, unten breiter als oben.
  ctx.fillStyle = DOME_HOUSE.trunk;
  ctx.beginPath();
  ctx.moveTo(middle - wide * TREEDOME.trunkFoot * HALF, foot);
  ctx.lineTo(middle - wide * TREEDOME.trunkTop * HALF, top);
  ctx.lineTo(middle + wide * TREEDOME.trunkTop * HALF, top);
  ctx.lineTo(middle + wide * TREEDOME.trunkFoot * HALF, foot);
  ctx.closePath();
  ctx.fill();
  // Die Schattenseite.
  ctx.fillStyle = DOME_HOUSE.trunkDark;
  ctx.beginPath();
  ctx.moveTo(middle - wide * TREEDOME.trunkFoot * HALF, foot);
  ctx.lineTo(middle - wide * TREEDOME.trunkTop * HALF, top);
  ctx.lineTo(middle, top);
  ctx.lineTo(middle, foot);
  ctx.closePath();
  ctx.fill();

  // Zwei Äste, die in die Krone laufen.
  ctx.strokeStyle = DOME_HOUSE.trunk;
  ctx.lineWidth = wide * TREEDOME.branchThick;
  ctx.lineCap = "round";
  const fork = foot - trunkHigh * TREEDOME.branchAt;
  for (const side of WAYS) {
    ctx.beginPath();
    ctx.moveTo(middle, fork);
    ctx.lineTo(
      middle + side * wide * TREEDOME.branchOut,
      fork - high * TREEDOME.branchUp,
    );
    ctx.stroke();
  }
  ctx.lineCap = "butt";

  // Die Krone: erst der dunkle Grund, dann die Büschel, dann die Lichter.
  const crown = wide * TREEDOME.crown;
  const heart = foot - high * TREEDOME.crownUp;
  ctx.fillStyle = DOME_HOUSE.crownDark;
  ctx.beginPath();
  ctx.ellipse(
    middle,
    heart,
    crown,
    crown * HALF * TREEDOME.backHigh,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  for (let puff = 0; puff < TREEDOME.puffs; puff += 1) {
    const along = puff / (TREEDOME.puffs - 1) - HALF;
    const breath = 1 + Math.sin(time + puff) * TREEDOME.breathe;
    const size =
      crown * TREEDOME.puffSize * (1 - Math.abs(along) * TREEDOME.puffVary);
    ctx.fillStyle = puff % 2 === 0 ? DOME_HOUSE.crown : DOME_HOUSE.crownLight;
    ctx.beginPath();
    ctx.arc(
      middle + along * crown * 2 * TREEDOME.puffSpread,
      heart + Math.abs(along) * high * TREEDOME.puffLift * HALF,
      size * breath,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.fillStyle = DOME_HOUSE.crownTop;
  for (let top_ = 0; top_ < TREEDOME.tops; top_ += 1) {
    const along = top_ / (TREEDOME.tops - 1) - HALF;
    ctx.beginPath();
    ctx.arc(
      middle + along * crown,
      heart - high * TREEDOME.topUp * (1 - Math.abs(along)),
      crown * TREEDOME.topSize,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/**
 * Die Schleuse an der Seite.
 *
 * @remarks
 * **Überdacht**, denn sie ist kein Türpaar, sondern ein Raum: Man geht durch
 * die äußere Luke hinein, das Wasser läuft ab, und erst dann geht die innere
 * auf. Ohne Dach sähen die beiden Luken aus, als klebten sie von außen an der
 * Kuppel - mit Dach sieht man den Zwischenraum, um den es geht.
 */
function airlock(
  ctx: CanvasRenderingContext2D,
  at: number,
  foot: number,
  wide: number,
  high: number,
): void {
  const half = wide * TREEDOME.lockWide * HALF;
  const tall = high * TREEDOME.lockHigh;
  const roof = foot - tall;

  // Der Raum: ein Kasten mit rundem Dach.
  ctx.fillStyle = DOME_HOUSE.hatch;
  ctx.beginPath();
  ctx.moveTo(at - half, foot);
  ctx.lineTo(at - half, roof + half * HALF);
  ctx.quadraticCurveTo(at, roof - half * HALF, at + half, roof + half * HALF);
  ctx.lineTo(at + half, foot);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = DOME_HOUSE.line;
  ctx.lineWidth = HOUSE.seamLine;
  ctx.stroke();

  // Das Dach darüber, ein Stück breiter als der Raum.
  const out = half + wide * TREEDOME.roofOut;
  ctx.strokeStyle = DOME_HOUSE.hatchRoof;
  ctx.lineWidth = high * TREEDOME.roofThick;
  ctx.beginPath();
  ctx.moveTo(at - out, roof + half * HALF);
  ctx.quadraticCurveTo(at, roof - half, at + out, roof + half * HALF);
  ctx.stroke();

  // Die beiden Luken darin - die äußere und die innere.
  const hatchHalf = wide * TREEDOME.hatchWide * HALF;
  const hatchHigh = high * TREEDOME.hatchHigh;
  for (const side of WAYS) {
    const mid = at + side * wide * TREEDOME.hatchApart * HALF;
    ctx.fillStyle = DOME_HOUSE.hatchDark;
    ctx.beginPath();
    ctx.moveTo(mid - hatchHalf, foot);
    ctx.lineTo(mid - hatchHalf, foot - hatchHigh + hatchHalf);
    ctx.arc(mid, foot - hatchHigh + hatchHalf, hatchHalf, Math.PI, 0);
    ctx.lineTo(mid + hatchHalf, foot);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = DOME_HOUSE.hatchGlass;
    ctx.beginPath();
    ctx.arc(
      mid,
      foot - hatchHigh + hatchHalf,
      hatchHalf * HALF,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Das Rad, mit dem man sie dichtmacht.
    ctx.strokeStyle = DOME_HOUSE.hatchRoof;
    ctx.lineWidth = HOUSE.seamLine;
    ctx.beginPath();
    ctx.arc(
      mid,
      foot - hatchHigh * HALF * HALF,
      wide * TREEDOME.wheel,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
}

/** Die Farben der Bude mit dem Schild. */
const SHACK = {
  wood: "#8a6232",
  woodDark: "#5e4120",
  woodLight: "#ab7f46",
  roof: "#6f4e27",
  door: "#cfe3ea",
  doorEdge: "#7f99a6",
  glass: "#9fd4e8",
  sign: "#f3e3e6",
  signEdge: "#c9a9b0",
  letters: "#c02a3a",
  post: "#8a6232",
  line: "rgba(40,22,6,0.8)",
} as const;

/** Die Maße der Bude, in Vielfachen einer Kursfeldbreite. */
const SHED = {
  /** Wie breit das Haus ist und wie hoch, mit seinem runden Dach. */
  wide: 2,
  high: 1.75,
  roof: 0.7,
  /** Die dicken Pfosten an beiden Enden. */
  post: 0.22,
  /** Die Planken dazwischen: wie viele. */
  planks: 5,
  /** Die beiden Türen in der Mitte. */
  doorWide: 0.22,
  doorHigh: 0.52,
  doorEye: 0.07,
  doorEyeUp: 0.34,
  /** Die Fenster links und rechts davon. */
  paneX: 0.55,
  paneY: 0.36,
  paneWide: 0.24,
  paneHigh: 0.16,
  /** Die Wimpelkette davor. */
  flags: 7,
  flag: 0.12,
  flagHang: 0.1,
  flagUp: 0.62,
  /** Und der Schornstein oben. */
  stackX: 0.1,
  stackWide: 0.13,
  stackHigh: 0.28,
  /** Das Schild links: Masthöhe, Dicke und die Platte darauf. */
  signX: -1.22,
  mast: 2.9,
  mastThick: 0.1,
  signR: 0.62,
  signSquash: 0.82,
  lines: 3,
  lineWide: 0.42,
  lineThick: 0.08,
  lineStep: 0.3,
} as const;

/**
 * Zeichnet die Bude mit dem Schild auf den Meeresgrund.
 *
 * @param ctx - die Zeichenfläche
 * @param x - die linke Kante ihres Feldes im Bild
 * @param y - und dessen obere Kante
 * @param time - die Uhr des Tauchgangs, für die Wimpel
 * @remarks
 * Ein Bretterbau wie eine umgedrehte Reuse, davor eine Wimpelkette - und
 * **links daneben das Schild**, an dem man sie erkennt: eine Tafel auf einem
 * Mast, zu weit weg, um sie zu lesen, und nah genug, um zu wissen, was hier
 * verkauft wird.
 */
export function drawKrosseKrabbe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const foot = y + CELL;
  const middle = x + CELL / 2;
  const wide = CELL * SHED.wide;
  const high = CELL * SHED.high;
  const top = foot - high;

  sign(ctx, middle + wide * SHED.signX, foot);

  // Das Dach: ein Bogen von Pfosten zu Pfosten.
  ctx.fillStyle = SHACK.roof;
  ctx.beginPath();
  ctx.moveTo(middle - wide, foot);
  ctx.lineTo(middle - wide, top + high * SHED.roof);
  ctx.quadraticCurveTo(
    middle,
    top - high * SHED.roof,
    middle + wide,
    top + high * SHED.roof,
  );
  ctx.lineTo(middle + wide, foot);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = SHACK.line;
  ctx.lineWidth = HOUSE.seamLine;
  ctx.stroke();

  // Die Planken, die daraus Bretter machen.
  ctx.strokeStyle = SHACK.woodDark;
  for (let plank = 1; plank < SHED.planks; plank += 1) {
    const at = foot - (high * plank) / SHED.planks;
    ctx.beginPath();
    ctx.moveTo(middle - wide, at);
    ctx.lineTo(middle + wide, at);
    ctx.stroke();
  }

  // Die dicken Pfosten an beiden Enden.
  ctx.fillStyle = SHACK.wood;
  for (const side of WAYS) {
    ctx.beginPath();
    ctx.rect(
      middle + side * wide - wide * SHED.post * HALF,
      top + high * SHED.roof * HALF,
      wide * SHED.post,
      high,
    );
    ctx.fill();
    ctx.stroke();
  }

  front(ctx, middle, foot, wide, high);
  bunting(ctx, middle, foot, wide, high, time);

  // Der Schornstein auf dem Dach.
  ctx.fillStyle = SHACK.woodLight;
  ctx.beginPath();
  ctx.rect(
    middle + wide * SHED.stackX,
    top - high * SHED.stackHigh * HALF,
    wide * SHED.stackWide,
    high * SHED.stackHigh,
  );
  ctx.fill();
  ctx.stroke();
}

/** Türen und Fenster an der Front. */
function front(
  ctx: CanvasRenderingContext2D,
  middle: number,
  foot: number,
  wide: number,
  high: number,
): void {
  const doorHigh = high * SHED.doorHigh;
  for (const side of WAYS) {
    const at = middle + side * wide * SHED.doorWide * HALF;
    ctx.fillStyle = SHACK.door;
    ctx.beginPath();
    ctx.rect(
      at - wide * SHED.doorWide * HALF,
      foot - doorHigh,
      wide * SHED.doorWide,
      doorHigh,
    );
    ctx.fill();
    ctx.strokeStyle = SHACK.doorEdge;
    ctx.stroke();
    ctx.fillStyle = SHACK.glass;
    ctx.beginPath();
    ctx.arc(
      at,
      foot - doorHigh * (1 - SHED.doorEyeUp),
      wide * SHED.doorEye,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Und je ein Fenster daneben.
    ctx.fillStyle = SHACK.glass;
    ctx.beginPath();
    ctx.rect(
      middle + side * wide * SHED.paneX - wide * SHED.paneWide * HALF,
      foot - high * SHED.paneY,
      wide * SHED.paneWide,
      high * SHED.paneHigh,
    );
    ctx.fill();
    ctx.strokeStyle = SHACK.line;
    ctx.stroke();
  }
}

/** Die Wimpelkette vor der Front. */
function bunting(
  ctx: CanvasRenderingContext2D,
  middle: number,
  foot: number,
  wide: number,
  high: number,
  time: number,
): void {
  const at = foot - high * SHED.flagUp;
  ctx.strokeStyle = SHACK.woodDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(middle - wide, at);
  ctx.quadraticCurveTo(middle, at + high * SHED.flagHang, middle + wide, at);
  ctx.stroke();

  for (let flag = 0; flag < SHED.flags; flag += 1) {
    const along = (flag + 1) / (SHED.flags + 1);
    const fx = middle - wide + along * wide * 2;
    const hang =
      at +
      high * SHED.flagHang * Math.sin(along * Math.PI) +
      Math.sin(time + flag) * HALF;
    ctx.fillStyle = FLAG_COLOURS[flag % FLAG_COLOURS.length];
    ctx.beginPath();
    ctx.moveTo(fx - wide * SHED.flag * HALF, hang);
    ctx.lineTo(fx + wide * SHED.flag * HALF, hang);
    ctx.lineTo(fx, hang + high * SHED.flag);
    ctx.closePath();
    ctx.fill();
  }
}

/** Die Farben der Wimpel, der Reihe nach. */
const FLAG_COLOURS: readonly string[] = [
  "#e4572e",
  "#f3c53c",
  "#3fa7d6",
  "#5ac18e",
];

/** Das Schild auf seinem Mast. */
function sign(ctx: CanvasRenderingContext2D, at: number, foot: number): void {
  const high = CELL * SHED.mast;
  ctx.fillStyle = SHACK.post;
  ctx.strokeStyle = SHACK.line;
  ctx.lineWidth = HOUSE.seamLine;
  ctx.beginPath();
  ctx.rect(
    at - CELL * SHED.mastThick * HALF,
    foot - high,
    CELL * SHED.mastThick,
    high,
  );
  ctx.fill();
  ctx.stroke();

  const r = CELL * SHED.signR;
  const top = foot - high;
  ctx.fillStyle = SHACK.sign;
  ctx.beginPath();
  ctx.ellipse(at, top, r, r * SHED.signSquash, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = SHACK.signEdge;
  ctx.stroke();

  // Drei rote Striche als Schrift: Lesen soll man das nicht, erkennen schon.
  ctx.strokeStyle = SHACK.letters;
  ctx.lineWidth = CELL * SHED.lineThick;
  for (let line = 0; line < SHED.lines; line += 1) {
    const y = top + (line - 1) * r * SHED.lineStep;
    const half = r * SHED.lineWide * (line === 1 ? 1 : HALF + HALF * HALF);
    ctx.beginPath();
    ctx.moveTo(at - half, y);
    ctx.lineTo(at + half, y);
    ctx.stroke();
  }
}

/**
 * Zeichnet das Steinhaus auf den Meeresgrund.
 *
 * @param ctx - die Zeichenfläche
 * @param x - die linke Kante seines Feldes im Bild
 * @param y - und dessen obere Kante
 * @param time - die Uhr des Tauchgangs, damit die Antenne wackelt
 * @remarks
 * Eine Kuppel aus Stein mit einer Fernsehantenne obendrauf - das ganze Haus
 * ist ein Felsbrocken, und das Einzige, was verrät, dass jemand darunter
 * wohnt, steht oben drauf und ist gelb.
 */
export function drawPatrick(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const foot = y + CELL;
  const middle = x + CELL / 2;
  const wide = CELL * ROCK.wide;
  const high = CELL * ROCK.high;

  aerial(ctx, middle, foot - high, time);

  // Die Kuppel: eine halbe Ellipse, von links oben beleuchtet.
  const stone = ctx.createLinearGradient(
    middle - wide,
    foot - high,
    middle + wide,
    foot,
  );
  stone.addColorStop(0, STONE.light);
  stone.addColorStop(HALF, STONE.body);
  stone.addColorStop(1, STONE.dark);
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.ellipse(middle, foot, wide, high, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  // Die Sprenkel, die aus einer Kuppel einen Stein machen.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(middle, foot, wide, high, 0, Math.PI, 0);
  ctx.clip();
  for (let speck = 0; speck < ROCK.specks; speck += 1) {
    const along = (speck / ROCK.specks) * 2 - 1;
    const deep = ((speck * SPECK_STEP) % 1) * HALF;
    ctx.fillStyle = speck % 2 === 0 ? STONE.speck : STONE.shine;
    ctx.beginPath();
    ctx.ellipse(
      middle + along * wide * SPECK_SPREAD,
      foot - high * (HALF + deep),
      wide * ROCK.speck,
      high * ROCK.speck,
      along,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();

  // Und der Sand, der sich an sie legt.
  ctx.fillStyle = STONE.dark;
  ctx.beginPath();
  ctx.ellipse(middle, foot, wide, high * ROCK.foot, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
}

/** Wie weit die Sprenkel streuen, und wie weit sie je Schritt wandern. */
const SPECK_SPREAD = 0.62;
const SPECK_STEP = 0.37;

/** Die Fernsehantenne obendrauf. */
function aerial(
  ctx: CanvasRenderingContext2D,
  middle: number,
  top: number,
  time: number,
): void {
  const high = CELL * ROCK.mast;
  const sway = Math.sin(time) * CELL * ROCK.barLift * HALF;

  ctx.strokeStyle = STONE.mast;
  ctx.lineWidth = ROCK.mastThick;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(middle, top);
  ctx.lineTo(middle + sway, top - high);
  ctx.stroke();

  // Zwei Querstäbe mit Fähnchen - die Form, an der man eine Antenne erkennt.
  ctx.strokeStyle = STONE.aerial;
  for (let bar = 0; bar < ROCK.bars; bar += 1) {
    const at = top - high * (ROCK.barFrom + bar * ROCK.barStep);
    const arm = CELL * ROCK.barWide * (1 - bar * HALF * HALF);
    const lift = CELL * ROCK.barLift;
    ctx.beginPath();
    ctx.moveTo(middle + sway - arm, at + lift);
    ctx.lineTo(middle + sway, at);
    ctx.lineTo(middle + sway + arm, at + lift);
    ctx.stroke();
    ctx.fillStyle = STONE.aerial;
    for (const side of WAYS) {
      ctx.beginPath();
      ctx.ellipse(
        middle + sway + side * arm,
        at + lift,
        CELL * ROCK.flagLong,
        CELL * ROCK.flag,
        side * ROCK.barLift,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.lineCap = "butt";
}

/**
 * Zeichnet das Haus auf den Meeresgrund.
 *
 * @param ctx - die Zeichenfläche
 * @param x - die linke Kante seines Feldes im Bild
 * @param y - und dessen obere Kante
 * @param time - die Uhr des Tauchgangs, damit die Blätter wehen
 * @remarks
 * Es steht auf der **Unterkante** seines Feldes und wächst von dort nach oben
 * - so, wie alles steht, was auf einem Grund steht. Wo sein Feld liegt, sagt
 * der Kursplan; wie hoch es wird, sagt diese Datei.
 */
export function drawSpongebob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const foot = y + CELL;
  const middle = x + CELL / 2;
  const wide = CELL * HOUSE.wide;
  const high = CELL * HOUSE.high;
  const heart = foot - CELL * HOUSE.up;

  leaves(ctx, middle, heart - high, time);
  chimney(ctx, middle, heart, wide, high);

  // Die Frucht selbst, von oben beleuchtet.
  const skin = ctx.createLinearGradient(middle - wide, 0, middle + wide, 0);
  skin.addColorStop(0, PAINT.skinDark);
  skin.addColorStop(HALF, PAINT.skin);
  skin.addColorStop(1, PAINT.skinDark);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(middle, heart, wide, high, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PAINT.line;
  ctx.lineWidth = HOUSE.seamLine;
  ctx.stroke();

  diamonds(ctx, middle, heart, wide, high);
  door(ctx, middle, foot, wide, high);
  windows(ctx, middle, heart, wide, high);
}

/** Die Hälfte, für die Mitte eines Verlaufs. */
export const HALF = 0.5;

/** Das Rautenmuster auf der Schale. */
function diamonds(
  ctx: CanvasRenderingContext2D,
  middle: number,
  heart: number,
  wide: number,
  high: number,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(middle, heart, wide, high, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = PAINT.seam;
  ctx.lineWidth = HOUSE.seamLine;
  for (let line = -HOUSE.seams; line <= HOUSE.seams; line += 1) {
    const at = (line / HOUSE.seams) * high * 2;
    for (const way of WAYS) {
      ctx.beginPath();
      ctx.moveTo(middle - wide, heart + at - way * wide);
      ctx.lineTo(middle + wide, heart + at + way * wide);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Hin und her: die beiden Richtungen des Musters. */
export const WAYS: readonly number[] = [-1, 1];

/**
 * Der Kamin an ihrer rechten Flanke.
 *
 * @remarks
 * Steht frei neben der Frucht und wird **vor** ihr gezeichnet: Was sich dabei
 * überschneidet, verschwindet hinter der Schale, und das ist genau die
 * Reihenfolge, in der ein Rohr an einem Haus hängt.
 */
function chimney(
  ctx: CanvasRenderingContext2D,
  middle: number,
  heart: number,
  wide: number,
  high: number,
): void {
  const half = wide * HOUSE.pipeWide;
  const top = heart + high * HOUSE.pipeTop;
  const tall = high * HOUSE.pipeHigh;
  const at = middle + wide * HOUSE.pipeX;

  ctx.fillStyle = PAINT.pipe;
  ctx.strokeStyle = PAINT.line;
  ctx.lineWidth = HOUSE.seamLine;
  ctx.beginPath();
  ctx.rect(at - half, top, half * 2, tall);
  ctx.fill();
  ctx.stroke();

  // Die Krempe oben - daran erkennt man ein Rohr und nicht einen Pfosten.
  const lip = half * HOUSE.pipeLip;
  const lipHigh = high * HOUSE.pipeLipHigh;
  ctx.beginPath();
  ctx.rect(at - lip, top - lipHigh, lip * 2, lipHigh * 2);
  ctx.fill();
  ctx.stroke();

  // Und der dunkle Ring darunter.
  ctx.fillStyle = PAINT.pipeDark;
  ctx.fillRect(
    at - half,
    top + high * HOUSE.pipeBand,
    half * 2,
    high * HOUSE.pipeBandHigh,
  );
}

/** Die Blätter, die oben aus ihr herauswachsen. */
function leaves(
  ctx: CanvasRenderingContext2D,
  middle: number,
  top: number,
  time: number,
): void {
  for (let leaf = 0; leaf < HOUSE.leaves; leaf += 1) {
    const along = leaf / (HOUSE.leaves - 1) - HALF;
    const lean = along * HOUSE.leafFan;
    const sway = Math.sin(time + leaf) * HOUSE.leafWide;
    const long = CELL * HOUSE.leafLong * (1 - Math.abs(along));
    ctx.fillStyle = leaf % 2 === 0 ? PAINT.leaf : PAINT.leafDark;
    ctx.beginPath();
    ctx.moveTo(middle - CELL * HOUSE.leafWide, top);
    ctx.quadraticCurveTo(
      middle + lean * CELL,
      top - long * HALF,
      middle + (lean + sway) * CELL,
      top - long,
    );
    ctx.quadraticCurveTo(
      middle + lean * CELL * HALF,
      top - long * HALF,
      middle + CELL * HOUSE.leafWide,
      top,
    );
    ctx.closePath();
    ctx.fill();
  }
}

/** Die Tür mit ihrem Rundbogen. */
function door(
  ctx: CanvasRenderingContext2D,
  middle: number,
  foot: number,
  wide: number,
  high: number,
): void {
  const half = wide * HOUSE.doorWide;
  const tall = high * HOUSE.doorHigh;
  const top = foot - tall;

  ctx.fillStyle = PAINT.frame;
  ctx.beginPath();
  ctx.moveTo(middle - half, foot);
  ctx.lineTo(middle - half, top);
  ctx.arc(middle, top, half, Math.PI, 0);
  ctx.lineTo(middle + half, foot);
  ctx.closePath();
  ctx.fill();

  const inner = half * (1 - HOUSE.doorFrame * 2);
  const inTop = top + wide * HOUSE.doorFrame;
  ctx.fillStyle = PAINT.door;
  ctx.beginPath();
  ctx.moveTo(middle - inner, foot);
  ctx.lineTo(middle - inner, inTop);
  ctx.arc(middle, inTop, inner, Math.PI, 0);
  ctx.lineTo(middle + inner, foot);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PAINT.doorDark;
  ctx.beginPath();
  ctx.arc(middle, top + tall * HALF, wide * HOUSE.knob, 0, Math.PI * 2);
  ctx.fill();
}

/** Das runde Fenster oben und das kleine daneben. */
function windows(
  ctx: CanvasRenderingContext2D,
  middle: number,
  heart: number,
  wide: number,
  high: number,
): void {
  const panes = [
    { x: HOUSE.roundX, y: HOUSE.roundY, r: HOUSE.roundR },
    { x: HOUSE.smallX, y: HOUSE.smallY, r: HOUSE.smallR },
  ];
  for (const pane of panes) {
    const px = middle + wide * pane.x;
    const py = heart + high * pane.y;
    const r = wide * pane.r;
    ctx.fillStyle = PAINT.frame;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAINT.glassDark;
    ctx.beginPath();
    ctx.arc(px, py, r * (1 - HOUSE.doorFrame * 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAINT.glass;
    ctx.beginPath();
    ctx.arc(px, py, r * (1 - HOUSE.shineOff), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAINT.shine;
    ctx.beginPath();
    ctx.arc(
      px - r * HOUSE.shineOff,
      py - r * HOUSE.shineOff,
      r * HOUSE.shineR,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}
