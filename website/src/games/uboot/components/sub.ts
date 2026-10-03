/**
 * Das Boot: gelber Rumpf, Glaskuppel, und der Affe mit dem Laptop darin.
 *
 * @module
 * @remarks
 * Gezeichnet statt als Bild eingesetzt, aus demselben Grund wie das Meer: Die
 * Schraube muss sich drehen, das Glas muss über dem liegen, was dahinter ist,
 * und der Affe muss aus dem Fenster auf den Felsen schauen, den der Spieler
 * gleich rammt. Ein fertiges Bild kann nichts davon, und bei dieser Größe
 * würde ohnehin niemand merken, dass es eines war.
 *
 * **Die Form stammt aus der Vorlage** (`game_instructions/UBoot/uboot.png`):
 * ein Tropfen, der nach hinten spitz zuläuft und vorn in einer großen
 * Glaskuppel endet, mit Turm und Periskop darüber, einem Bullauge an der
 * Seite, Nietenreihen auf den Platten und zwei Kufen unter dem Bauch.
 *
 * Alle Maße stehen in Pixeln vom Mittelpunkt des Rumpfes aus, das Boot zeigt
 * nach rechts. Wer es aufruft, setzt und kippt es; hier unten weiß niemand,
 * wo auf dem Bildschirm es gelandet ist.
 */

/** Die Maße des Rumpfes. */
const HULL = {
  long: 76,
  high: 34,
} as const;

/**
 * Die Form des Rumpfes, in Anteilen seiner halben Länge und Höhe.
 *
 * @remarks
 * Anteile und keine Pixel: Ein Boot, das größer wird, soll dieselbe Form
 * behalten und nicht an zwanzig Stellen nachgerechnet werden müssen. Die Namen
 * sind die der Vorlage - Rücken, Schulter, Kinn.
 */
const SHELL = {
  /** Wie der Rücken vom Heck nach vorn läuft. */
  backBow: 0.88,
  backRise: 0.72,
  backLong: 0.35,
  crown: 0.08,
  /** Die Schulter, an der die Kuppel ansetzt. */
  shoulderX: 0.46,
  shoulderInX: 0.64,
  shoulderInY: 0.84,
  ringX: 0.68,
  ringY: 0.6,
  /** Das Kinn, das unter der Kuppel nach vorn steht. */
  chinX: 0.8,
  chinY: 0.36,
  chinOutX: 0.96,
  chinOutY: 0.82,
  chinBackX: 0.58,
  chinBackY: 1.02,
  bellyX: 0.08,
  bellyY: 1,
  /** Und wie der Bauch zum Heck zurückläuft. */
  tailInX: 0.42,
  tailInY: 0.96,
  tailOutX: 0.9,
  tailOutY: 0.74,
} as const;

/** Die Glaskuppel vorn. */
const DOME = {
  x: 23,
  y: -1,
  r: 16,
  /** Wie viel vom Dahinterliegenden das Glas wegwäscht. */
  haze: 0.16,
  /** Der Glanzfleck: wo er sitzt, wie groß und wie weit gedreht. */
  shineX: 6,
  shineY: -9,
  shineW: 7,
  shineH: 3.5,
  shineTurn: -0.63,
  /** Der Ring, in dem die Kuppel sitzt. */
  rim: 3,
  collar: 4,
} as const;

/** Die Schraube. */
const SCREW = {
  /** Wie weit die Welle vom Mittelpunkt nach hinten reicht. */
  shaft: 45,
  /** Wie lang ein Blatt ist und wie breit. */
  blade: 14,
  half: 4.5,
  /** Wie dünn ein Blatt wird, wenn es hochkant steht - nie ganz nichts. */
  thinnest: 0.15,
  blades: 3,
  /** Wie deutlich sich die Blätter unter Schub zur Scheibe verwischen. */
  blur: 0.45,
  /** Die Nabe davor. */
  hub: 4,
  hubLong: 4,
} as const;

/** Der Turm und das Periskop darauf. */
const TOWER = {
  x: -4,
  wide: 20,
  high: 11,
  taper: 2,
  sunk: 2,
  /** Der Kragen obendrauf. */
  collarWide: 24,
  collarHigh: 4,
  /** Das Periskop: wie hoch, wie weit nach vorn, wie dick das Glas. */
  scopeUp: 17,
  scopeOut: 13,
  scopeThick: 5,
  lens: 4.5,
  lensGlass: 2.6,
} as const;

/** Das Bullauge an der Seite. */
const PORT = {
  x: -13,
  y: -1,
  r: 7,
  glass: 5,
  shine: 1.8,
  shineUp: 1.6,
} as const;

/** Die Platten: Nähte und Nieten. */
const SKIN = {
  /** Wo die Nähte stehen, in Anteilen der halben Länge. */
  seams: 3,
  seamFrom: -0.62,
  seamStep: 0.4,
  seamWide: 4,
  seamInset: 3,
  /** Die Nieten auf jeder Naht. */
  rivets: 4,
  rivet: 0.9,
  rivetInset: 4,
  /** Wo das Licht auf dem Rumpf umschlägt. */
  litTo: 0.55,
} as const;

/** Die beiden Kufen unter dem Bauch. */
const SKID = {
  from: 2,
  apart: 13,
  wide: 7,
  high: 4,
  down: 2,
} as const;

/** Der Affe. */
const APE = {
  /** Wo er in der Kuppel sitzt. */
  x: -4,
  y: 1,
  head: 9.5,
  ear: 3.4,
  earOut: 8,
  earUp: -1,
  /** Der Schopf, der ihn vom Fell abhebt. */
  tuftUp: 8.5,
  tuft: 3,
  /** Das helle Gesicht, tief im Kopf. */
  faceW: 6,
  faceH: 5.2,
  faceDown: 2.2,
  /** Die Augen und was darin steht. */
  eyeOut: 3,
  eyeUp: -1.4,
  eyeW: 2.5,
  eyeH: 2.8,
  pupilOut: 3.2,
  pupilUp: -1,
  pupil: 1.4,
  /** Der Mund: eine kurze Linie, denn er sagt ja nichts. */
  mouthHalf: 2,
  mouthDown: 5,
  mouthLine: 1.2,
  /** Die Brauen, hochgezogen - er wundert sich, er ärgert sich nicht. */
  browOut: 6,
  browUp: -6,
  browIn: 1.5,
  browDown: -4.6,
  browLine: 1.6,
  /** Die Hand am Kinn und der Arm dazu. */
  handX: 3,
  handY: 6,
  hand: 2.6,
  armX: 7,
  armY: 9,
  armThick: 3,
} as const;

/** Der Laptop vor ihm. */
const LAPTOP = {
  /** Wo er steht, wie breit das Unterteil ist und wie hoch der Deckel. */
  x: 6,
  y: 9,
  deck: 8,
  deckHigh: 2,
  lidHigh: 7,
  lidLean: 2,
  /** Das Zeichen auf dem Deckel. */
  mark: 1.2,
  markUp: 3.6,
} as const;

/** Wie dick die Linien sind. */
const LINE = {
  hair: 1,
  hull: 2,
  shaft: 4,
  scope: 5,
} as const;

/** Die Farben. */
const PAINT = {
  hullLight: "#ffdf5a",
  hull: "#f5c211",
  hullDark: "#b8860a",
  line: "#5a4205",
  rivet: "#c9971a",
  metal: "#5c6570",
  metalDark: "#2b3138",
  glass: "#bfeaff",
  glassEdge: "#7fc7ea",
  inside: "#0d3a55",
  shine: "rgba(255,255,255,0.8)",
  fur: "#8a5a2b",
  furDark: "#6b431d",
  face: "#d9a066",
  eye: "#ffffff",
  pupil: "#1b1b1b",
  screen: "#566273",
  screenLit: "#cfe0f0",
  deck: "#7d8899",
} as const;

/** How the boat is drawn this frame. */
export type SubLook = {
  /** Where the middle of the hull is, on the canvas. */
  readonly x: number;
  readonly y: number;
  /** How far the nose is tipped, in radians - down is positive. */
  readonly tilt: number;
  /**
   * Wie weit die Schraube gedreht hat, in Umdrehungen.
   *
   * @remarks
   * Fertig aufsummiert aus der Engine und nicht hier aus der Zeit gerechnet:
   * Eine Drehung, deren Tempo sich ändert, springt sonst bei jeder Änderung.
   */
  readonly turns: number;
  /** How hard it is being driven, from nought to one. */
  readonly thrust: number;
};

/**
 * Draws the boat.
 *
 * @param ctx - the canvas to draw on
 * @param look - where it is, how it lies and how hard it is working
 */
export function drawSub(ctx: CanvasRenderingContext2D, look: SubLook): void {
  ctx.save();
  ctx.translate(look.x, look.y);
  ctx.rotate(look.tilt);

  propeller(ctx, look.turns, look.thrust);
  tower(ctx);
  body(ctx);
  skids(ctx);
  dome(ctx);

  ctx.restore();
}

/**
 * The propeller on its shaft, turned to wherever it is in its turn.
 *
 * @param ctx - die Zeichenfläche
 * @param turns - wie weit sie gedreht hat, in Umdrehungen
 * @param thrust - wie hart gefahren wird, von null bis eins
 * @remarks
 * Unter Schub legt sich eine schwache Scheibe über die Blätter: Ab einem
 * gewissen Tempo sieht man von einer Schraube keine Blätter mehr, sondern
 * einen Kreis - und genau daran erkennt man, dass sie schnell dreht.
 */
function propeller(
  ctx: CanvasRenderingContext2D,
  turns: number,
  thrust: number,
): void {
  const back = -HULL.long / 2;
  ctx.strokeStyle = PAINT.metalDark;
  ctx.lineWidth = LINE.shaft;
  ctx.beginPath();
  ctx.moveTo(back, 0);
  ctx.lineTo(-SCREW.shaft, 0);
  ctx.stroke();

  ctx.save();
  ctx.translate(-SCREW.shaft, 0);
  ctx.fillStyle = PAINT.metalDark;
  for (let blade = 0; blade < SCREW.blades; blade += 1) {
    const turn = turns * Math.PI * 2 + (blade * Math.PI * 2) / SCREW.blades;
    // Von der Seite ist ein Blatt eine Ellipse, die schmaler wird, je weiter
    // sie sich wegdreht - und genau deshalb liest sich die Schraube als
    // drehend.
    ctx.save();
    ctx.scale(1, Math.max(SCREW.thinnest, Math.abs(Math.cos(turn))));
    ctx.beginPath();
    ctx.ellipse(0, 0, SCREW.half, SCREW.blade, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (thrust > 0) {
    ctx.globalAlpha = SCREW.blur * thrust;
    ctx.beginPath();
    ctx.ellipse(0, 0, SCREW.half, SCREW.blade, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Die Nabe: der Übergang von der Welle zu den Blättern.
  ctx.beginPath();
  ctx.ellipse(
    SCREW.hubLong / 2,
    0,
    SCREW.hubLong,
    SCREW.hub,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = PAINT.metal;
  ctx.fill();
  ctx.restore();
}

/** Der Turm und das Periskop darauf. */
function tower(ctx: CanvasRenderingContext2D): void {
  const top = -HULL.high / 2;
  const half = TOWER.wide / 2;
  const roof = top - TOWER.high;

  ctx.fillStyle = PAINT.hull;
  ctx.strokeStyle = PAINT.line;
  ctx.lineWidth = LINE.hull;
  ctx.beginPath();
  ctx.moveTo(TOWER.x - half, top + TOWER.sunk);
  ctx.lineTo(TOWER.x - half + TOWER.taper, roof);
  ctx.lineTo(TOWER.x + half - TOWER.taper, roof);
  ctx.lineTo(TOWER.x + half, top + TOWER.sunk);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Der Kragen: die Kante, auf der in der Vorlage das Periskop sitzt.
  ctx.beginPath();
  ctx.rect(
    TOWER.x - TOWER.collarWide / 2,
    roof - TOWER.collarHigh,
    TOWER.collarWide,
    TOWER.collarHigh,
  );
  ctx.fillStyle = PAINT.hullLight;
  ctx.fill();
  ctx.stroke();

  // Das Periskop: hoch, dann ein Knick nach vorn mit dem Glas am Ende - der
  // eine Umriss, an dem jeder ein U-Boot erkennt.
  const scope = roof - TOWER.collarHigh;
  ctx.strokeStyle = PAINT.hull;
  ctx.lineWidth = LINE.scope;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(TOWER.x, scope);
  ctx.lineTo(TOWER.x, scope - TOWER.scopeUp);
  ctx.lineTo(TOWER.x + TOWER.scopeOut, scope - TOWER.scopeUp);
  ctx.stroke();
  ctx.lineWidth = LINE.hair;
  ctx.strokeStyle = PAINT.line;
  ctx.stroke();
  ctx.lineCap = "butt";

  ctx.beginPath();
  ctx.arc(
    TOWER.x + TOWER.scopeOut,
    scope - TOWER.scopeUp,
    TOWER.lens,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = PAINT.hullLight;
  ctx.fill();
  ctx.strokeStyle = PAINT.line;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(
    TOWER.x + TOWER.scopeOut,
    scope - TOWER.scopeUp,
    TOWER.lensGlass,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = PAINT.glassEdge;
  ctx.fill();
}

/**
 * Der Rumpf, von oben beleuchtet.
 *
 * @remarks
 * Ein Tropfen und keine Ellipse: Hinten läuft er spitz zu, vorn trägt er die
 * Kuppel, und unter ihr steht das Kinn hervor. Genau das macht in der Vorlage
 * aus einer gelben Pille ein Boot.
 */
function body(ctx: CanvasRenderingContext2D): void {
  const len = HULL.long / 2;
  const high = HULL.high / 2;

  ctx.beginPath();
  ctx.moveTo(-len, 0);
  ctx.bezierCurveTo(
    -len * SHELL.backBow,
    -high * SHELL.backRise,
    -len * SHELL.backLong,
    -high,
    len * SHELL.crown,
    -high,
  );
  ctx.bezierCurveTo(
    len * SHELL.shoulderX,
    -high,
    len * SHELL.shoulderInX,
    -high * SHELL.shoulderInY,
    len * SHELL.ringX,
    -high * SHELL.ringY,
  );
  ctx.lineTo(len * SHELL.chinX, high * SHELL.chinY);
  ctx.bezierCurveTo(
    len * SHELL.chinOutX,
    high * SHELL.chinOutY,
    len * SHELL.chinBackX,
    high * SHELL.chinBackY,
    len * SHELL.bellyX,
    high * SHELL.bellyY,
  );
  ctx.bezierCurveTo(
    -len * SHELL.tailInX,
    high * SHELL.tailInY,
    -len * SHELL.tailOutX,
    high * SHELL.tailOutY,
    -len,
    0,
  );
  ctx.closePath();

  const paint = ctx.createLinearGradient(0, -high, 0, high);
  paint.addColorStop(0, PAINT.hullLight);
  paint.addColorStop(SKIN.litTo, PAINT.hull);
  paint.addColorStop(1, PAINT.hullDark);
  ctx.fillStyle = paint;
  ctx.fill();
  ctx.strokeStyle = PAINT.line;
  ctx.lineWidth = LINE.hull;
  ctx.stroke();

  plates(ctx, len, high);
  porthole(ctx);
}

/** Die Plattennähte mit ihren Nieten. */
function plates(
  ctx: CanvasRenderingContext2D,
  len: number,
  high: number,
): void {
  for (let seam = 0; seam < SKIN.seams; seam += 1) {
    const at = len * (SKIN.seamFrom + seam * SKIN.seamStep);
    ctx.strokeStyle = PAINT.hullDark;
    ctx.lineWidth = LINE.hair;
    ctx.beginPath();
    ctx.ellipse(
      at,
      0,
      SKIN.seamWide,
      high - SKIN.seamInset,
      0,
      -Math.PI / 2,
      Math.PI / 2,
    );
    ctx.stroke();

    // Die Nieten: das, was aus einer Linie eine Naht macht.
    ctx.fillStyle = PAINT.rivet;
    for (let rivet = 0; rivet < SKIN.rivets; rivet += 1) {
      const along = (rivet + 1) / (SKIN.rivets + 1);
      const y = (along * 2 - 1) * (high - SKIN.rivetInset);
      ctx.beginPath();
      ctx.arc(at + SKIN.seamWide, y, SKIN.rivet, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Das Bullauge an der Seite, von innen beleuchtet. */
function porthole(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.arc(PORT.x, PORT.y, PORT.r, 0, Math.PI * 2);
  ctx.fillStyle = PAINT.metalDark;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(PORT.x, PORT.y, PORT.glass, 0, Math.PI * 2);
  ctx.fillStyle = PAINT.glassEdge;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    PORT.x - PORT.shineUp,
    PORT.y - PORT.shineUp,
    PORT.shine,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = PAINT.shine;
  ctx.fill();
}

/** Die beiden Kufen unter dem Bauch. */
function skids(ctx: CanvasRenderingContext2D): void {
  const base = HULL.high / 2 - SKID.down;
  ctx.fillStyle = PAINT.hull;
  ctx.strokeStyle = PAINT.line;
  ctx.lineWidth = LINE.hair;
  for (const side of SIDES) {
    ctx.beginPath();
    ctx.ellipse(
      SKID.from + side * SKID.apart,
      base,
      SKID.wide,
      SKID.high,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
  }
}

/** Links und rechts, oben und unten - für alles, was zweimal da ist. */
const SIDES: readonly number[] = [-1, 1];

/** Die Glaskuppel vorn, mit der Besatzung dahinter. */
function dome(ctx: CanvasRenderingContext2D): void {
  // Der Ring, in dem sie sitzt - gelb, also unter dem Glas und über dem Rumpf.
  ctx.beginPath();
  ctx.arc(DOME.x, DOME.y, DOME.r + DOME.collar, 0, Math.PI * 2);
  ctx.fillStyle = PAINT.hull;
  ctx.fill();
  ctx.strokeStyle = PAINT.line;
  ctx.lineWidth = LINE.hull;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(DOME.x, DOME.y, DOME.r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = PAINT.inside;
  ctx.fill();
  monkey(ctx, DOME.x + APE.x, DOME.y + APE.y);
  laptop(ctx, DOME.x + LAPTOP.x, DOME.y + LAPTOP.y);
  ctx.restore();

  // Das Glas darüber: ein Hauch Blau und ein harter Glanzfleck, mehr ist ein
  // gewölbtes Fenster nie.
  ctx.save();
  ctx.globalAlpha = DOME.haze;
  ctx.beginPath();
  ctx.arc(DOME.x, DOME.y, DOME.r, 0, Math.PI * 2);
  ctx.fillStyle = PAINT.glass;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(
    DOME.x + DOME.shineX,
    DOME.y + DOME.shineY,
    DOME.shineW,
    DOME.shineH,
    DOME.shineTurn,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = PAINT.shine;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(DOME.x, DOME.y, DOME.r, 0, Math.PI * 2);
  ctx.strokeStyle = PAINT.hullDark;
  ctx.lineWidth = DOME.rim;
  ctx.stroke();
}

/**
 * Der Affe, wie in der Vorlage: Hand am Kinn, Laptop davor.
 *
 * @remarks
 * Er schaut aus der Kuppel heraus und nicht am Boot entlang: Der ganze Sinn
 * eines Fensters in der Nase ist, dass jemand dahinter sitzt und einen ansieht
 * - ein Profil wären bei dieser Größe zwei braune Klumpen und eine Nase.
 */
function monkey(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // Der Arm, der auf dem Laptop liegt - zuerst, damit der Körper darüber kommt.
  ctx.strokeStyle = PAINT.fur;
  ctx.lineWidth = APE.armThick;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y + APE.armY);
  ctx.lineTo(x + APE.armX, y + APE.armY);
  ctx.stroke();
  ctx.lineCap = "butt";

  // Ohren, dann der Kopf darüber.
  ctx.fillStyle = PAINT.furDark;
  for (const side of SIDES) {
    ctx.beginPath();
    ctx.arc(x + side * APE.earOut, y + APE.earUp, APE.ear, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = PAINT.fur;
  ctx.beginPath();
  ctx.arc(x, y, APE.head, 0, Math.PI * 2);
  ctx.fill();

  // Der Schopf: drei Büschel, die ihn vom runden Fellball unterscheiden.
  ctx.beginPath();
  for (const side of SIDES) {
    ctx.arc(x + side * APE.tuft, y - APE.tuftUp, APE.tuft, 0, Math.PI * 2);
  }
  ctx.arc(x, y - APE.tuftUp - APE.tuft / 2, APE.tuft, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PAINT.face;
  ctx.beginPath();
  ctx.ellipse(x, y + APE.faceDown, APE.faceW, APE.faceH, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const side of SIDES) {
    ctx.fillStyle = PAINT.eye;
    ctx.beginPath();
    ctx.ellipse(
      x + side * APE.eyeOut,
      y + APE.eyeUp,
      APE.eyeW,
      APE.eyeH,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = PAINT.pupil;
    ctx.beginPath();
    ctx.arc(
      x + side * APE.pupilOut,
      y + APE.pupilUp,
      APE.pupil,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Die Brauen, hochgezogen: Er wundert sich über das, was er da liest.
  ctx.strokeStyle = PAINT.furDark;
  ctx.lineWidth = APE.browLine;
  for (const side of SIDES) {
    ctx.beginPath();
    ctx.moveTo(x + side * APE.browOut, y + APE.browUp);
    ctx.lineTo(x + side * APE.browIn, y + APE.browDown);
    ctx.stroke();
  }

  ctx.strokeStyle = PAINT.furDark;
  ctx.lineWidth = APE.mouthLine;
  ctx.beginPath();
  ctx.moveTo(x - APE.mouthHalf, y + APE.mouthDown);
  ctx.lineTo(x + APE.mouthHalf, y + APE.mouthDown);
  ctx.stroke();

  // Und die Hand am Kinn - die Haltung, in der man eine Änderung ansieht, die
  // einen nichts angeht.
  ctx.fillStyle = PAINT.fur;
  ctx.beginPath();
  ctx.arc(x + APE.handX, y + APE.handY, APE.hand, 0, Math.PI * 2);
  ctx.fill();
}

/** Der Laptop, auf den er schaut. */
function laptop(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // Das Unterteil, leicht in die Tiefe gekippt.
  ctx.fillStyle = PAINT.deck;
  ctx.beginPath();
  ctx.moveTo(x - LAPTOP.deck, y);
  ctx.lineTo(x + LAPTOP.deck, y);
  ctx.lineTo(x + LAPTOP.deck - LAPTOP.deckHigh, y + LAPTOP.deckHigh);
  ctx.lineTo(x - LAPTOP.deck + LAPTOP.deckHigh, y + LAPTOP.deckHigh);
  ctx.closePath();
  ctx.fill();

  // Der Deckel, nach hinten geneigt, mit dem Zeichen darauf.
  ctx.fillStyle = PAINT.screen;
  ctx.beginPath();
  ctx.moveTo(x + LAPTOP.deck * SCREEN.from, y);
  ctx.lineTo(x + LAPTOP.deck, y - LAPTOP.lidHigh);
  ctx.lineTo(x + LAPTOP.deck + LAPTOP.lidLean, y - LAPTOP.lidHigh);
  ctx.lineTo(x + LAPTOP.deck * SCREEN.to, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAINT.screenLit;
  ctx.beginPath();
  ctx.arc(
    x + LAPTOP.deck * SCREEN.markAt,
    y - LAPTOP.markUp,
    LAPTOP.mark,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

/** Wo der Deckel am Unterteil ansetzt und aufhört, als Anteil seiner Breite. */
const SCREEN = { from: 0.45, to: 1, markAt: 0.8 } as const;
