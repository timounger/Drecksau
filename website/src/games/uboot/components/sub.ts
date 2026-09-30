/**
 * The boat itself: yellow hull, glass dome, and the monkey behind it.
 *
 * @module
 * @remarks
 * Drawn rather than pasted in as a picture, for the same reason the sea is:
 * the propeller has to turn, the glass has to sit over whatever is behind it,
 * and the monkey has to look out of the window at the rock the player is about
 * to hit. A sprite can do none of that, and at this size nobody would be able
 * to tell it was one anyway.
 *
 * Every measurement in here is in pixels from the middle of the hull, with the
 * boat pointing right. The caller places it and tips it; nothing below knows
 * where on the screen it ended up.
 */

/** The hull, and where the parts sit on it. */
const HULL = {
  long: 76,
  high: 34,
  /** Where the dome sits and how big it is. */
  domeX: 20,
  domeR: 15,
  /** The conning tower: how far back, how wide and how high. */
  towerX: -6,
  towerW: 22,
  towerH: 13,
  /** How much the tower narrows towards the top. */
  towerTaper: 4,
  /** How far it is sunk into the hull. */
  towerSunk: 2,
  /** The periscope over it, and the reach of its elbow. */
  scopeH: 16,
  scopeOut: 10,
  scopeLens: 3,
  /** The drill under the nose. */
  drillX: 22,
  drillW: 6,
  drillLong: 16,
  drillLift: 4,
  drillTip: 2,
} as const;

/** The propeller. */
const SCREW = {
  /** How far back the shaft reaches from the middle of the hull. */
  shaft: 46,
  /** How long a blade is and how wide. */
  blade: 13,
  half: 4,
  /** How thin a blade gets when it is edge on - never quite nothing. */
  thinnest: 0.15,
  /** How many there are. */
  blades: 3,
  /** Wie deutlich sich die Blätter unter Schub zur Scheibe verwischen. */
  blur: 0.45,
} as const;

/** The tail fins. */
const FIN = {
  /** How far forward of the tail they start. */
  from: 8,
  /** Where they meet the hull, and how far out and back they reach. */
  root: 3,
  back: 7,
  out: 5,
  tip: 3,
} as const;

/** Where the plate seams run, from the tail forward. */
const SEAM_AT = { aft: -18, middle: -4, fore: 10 } as const;

/** The plating: seams, and the porthole along the side. */
const SKIN = {
  seams: [SEAM_AT.aft, SEAM_AT.middle, SEAM_AT.fore],
  seamWide: 4,
  seamInset: 2,
  portX: -14,
  portY: -2,
  portR: 6,
  glassR: 4,
  /** Where the light on the hull turns over. */
  litTo: 0.55,
} as const;

/** The dome, and the shine on it. */
const GLASS = {
  /** How much of what is behind the glass is washed out by it. */
  haze: 0.16,
  /** The highlight: where it sits, how big and how far round it is turned. */
  shineX: -4,
  shineY: -7,
  shineW: 6,
  shineH: 3,
  shineTurn: -0.63,
  rim: 3,
} as const;

/** The monkey. */
const APE = {
  /** Where he sits in the dome. */
  x: 2,
  y: 1,
  head: 9.5,
  ear: 4,
  earOut: 8.5,
  earUp: -1,
  /** The pale face, low in the head. */
  faceW: 5.5,
  faceH: 5,
  faceDown: 2.5,
  /** The eyes and what is in them. */
  eyeOut: 3.2,
  eyeUp: -1,
  eyeW: 2.6,
  eyeH: 2.8,
  pupilOut: 3.4,
  pupil: 1.5,
  /** The mouth: a flat line, because he is not enjoying this. */
  mouthHalf: 2.5,
  mouthDown: 5.5,
  mouthLine: 1.3,
  /** And the brows, angled in. */
  browOut: 6.5,
  browUp: -5.5,
  browIn: 1.2,
  browDown: -3.5,
  browLine: 2.2,
} as const;

/** How thick the lines are. */
const LINE = {
  hair: 1,
  hull: 2,
  shaft: 4,
  spike: 3,
  scope: 5,
} as const;

/** Its colours. */
const PAINT = {
  hullLight: "#ffd94a",
  hull: "#f2b90c",
  hullDark: "#b8860a",
  line: "#6b4e05",
  metal: "#5c6570",
  metalDark: "#2b3138",
  glass: "#bfeaff",
  glassEdge: "#7fc7ea",
  inside: "#0d3a55",
  shine: "rgba(255,255,255,0.75)",
  fur: "#8a5a2b",
  furDark: "#6b431d",
  face: "#d9a066",
  eye: "#ffffff",
  pupil: "#1b1b1b",
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
  fins(ctx);
  tower(ctx);
  body(ctx);
  drill(ctx);
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
    // Seen from the side a blade is an ellipse that narrows as it turns away,
    // which is the whole of why a turning propeller reads as turning.
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

  ctx.beginPath();
  ctx.arc(0, 0, SCREW.half, 0, Math.PI * 2);
  ctx.fillStyle = PAINT.metal;
  ctx.fill();
  ctx.restore();
}

/** The tail fins, top and bottom. */
function fins(ctx: CanvasRenderingContext2D): void {
  const back = -HULL.long / 2 + FIN.from;
  const half = HULL.high / 2;
  ctx.fillStyle = PAINT.hullDark;
  for (const way of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(back, way * FIN.root);
    ctx.lineTo(back - FIN.back, way * (half + FIN.out));
    ctx.lineTo(back + FIN.back, way * (half - FIN.tip));
    ctx.closePath();
    ctx.fill();
  }
}

/** The conning tower and the periscope over it. */
function tower(ctx: CanvasRenderingContext2D): void {
  const top = -HULL.high / 2;
  const half = HULL.towerW / 2;
  ctx.fillStyle = PAINT.hull;
  ctx.strokeStyle = PAINT.line;
  ctx.lineWidth = LINE.hull;
  ctx.beginPath();
  ctx.moveTo(HULL.towerX - half, top + HULL.towerSunk);
  ctx.lineTo(HULL.towerX - half + HULL.towerTaper, top - HULL.towerH);
  ctx.lineTo(HULL.towerX + half - HULL.towerTaper, top - HULL.towerH);
  ctx.lineTo(HULL.towerX + half, top + HULL.towerSunk);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // The periscope: up, then a bend forward with the lens on the end - the one
  // silhouette everybody recognises a submarine by.
  const scope = top - HULL.towerH;
  ctx.strokeStyle = PAINT.hullDark;
  ctx.lineWidth = LINE.scope;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(HULL.towerX, scope);
  ctx.lineTo(HULL.towerX, scope - HULL.scopeH);
  ctx.lineTo(HULL.towerX + HULL.scopeOut, scope - HULL.scopeH);
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.arc(
    HULL.towerX + HULL.scopeOut,
    scope - HULL.scopeH,
    HULL.scopeLens,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = PAINT.glass;
  ctx.fill();
}

/** The hull, lit from above. */
function body(ctx: CanvasRenderingContext2D): void {
  const rx = HULL.long / 2;
  const ry = HULL.high / 2;
  const paint = ctx.createLinearGradient(0, -ry, 0, ry);
  paint.addColorStop(0, PAINT.hullLight);
  paint.addColorStop(SKIN.litTo, PAINT.hull);
  paint.addColorStop(1, PAINT.hullDark);

  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = paint;
  ctx.fill();
  ctx.strokeStyle = PAINT.line;
  ctx.lineWidth = LINE.hull;
  ctx.stroke();

  // Plate seams: the detail that makes the hull read as metal rather than as
  // a yellow pill.
  ctx.strokeStyle = PAINT.hullDark;
  ctx.lineWidth = LINE.hair;
  for (const at of SKIN.seams) {
    ctx.beginPath();
    ctx.ellipse(
      at,
      0,
      SKIN.seamWide,
      ry - SKIN.seamInset,
      0,
      -Math.PI / 2,
      Math.PI / 2,
    );
    ctx.stroke();
  }

  // One porthole back along the hull, lit from inside.
  ctx.beginPath();
  ctx.arc(SKIN.portX, SKIN.portY, SKIN.portR, 0, Math.PI * 2);
  ctx.fillStyle = PAINT.metalDark;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(SKIN.portX, SKIN.portY, SKIN.glassR, 0, Math.PI * 2);
  ctx.fillStyle = PAINT.glassEdge;
  ctx.fill();
}

/** The drill under the nose - it came with the boat. */
function drill(ctx: CanvasRenderingContext2D): void {
  const base = HULL.high / 2 - HULL.drillLift;
  ctx.fillStyle = PAINT.metal;
  ctx.beginPath();
  ctx.moveTo(HULL.drillX - HULL.drillW, base);
  ctx.lineTo(HULL.drillX + HULL.drillW, base);
  ctx.lineTo(HULL.drillX + HULL.drillTip, base + HULL.drillLong);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PAINT.metalDark;
  ctx.lineWidth = LINE.hair;
  ctx.stroke();
}

/** The glass dome at the front, with the crew behind it. */
function dome(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(HULL.domeX, 0, HULL.domeR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = PAINT.inside;
  ctx.fill();
  monkey(ctx, HULL.domeX + APE.x, APE.y);
  ctx.restore();

  // The glass over the top of him: a wash of blue and one hard highlight,
  // which is all a curved window ever is.
  ctx.save();
  ctx.globalAlpha = GLASS.haze;
  ctx.beginPath();
  ctx.arc(HULL.domeX, 0, HULL.domeR, 0, Math.PI * 2);
  ctx.fillStyle = PAINT.glass;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(
    HULL.domeX + GLASS.shineX,
    GLASS.shineY,
    GLASS.shineW,
    GLASS.shineH,
    GLASS.shineTurn,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = PAINT.shine;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(HULL.domeX, 0, HULL.domeR, 0, Math.PI * 2);
  ctx.strokeStyle = PAINT.hullDark;
  ctx.lineWidth = GLASS.rim;
  ctx.stroke();
}

/**
 * The monkey, cross about something as usual.
 *
 * @remarks
 * Facing out of the dome rather than along the boat: the whole point of a
 * window in the nose is that somebody is looking through it at you, and a
 * profile at this size is two brown lumps and a nose.
 */
function monkey(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // Ears first, so the head sits over them.
  ctx.fillStyle = PAINT.furDark;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * APE.earOut, y + APE.earUp, APE.ear, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(x, y, APE.head, 0, Math.PI * 2);
  ctx.fillStyle = PAINT.fur;
  ctx.fill();

  // The pale face, low in the head: any higher and it takes the whole of him,
  // and he stops being a monkey and becomes an egg.
  ctx.beginPath();
  ctx.ellipse(x, y + APE.faceDown, APE.faceW, APE.faceH, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAINT.face;
  ctx.fill();

  ctx.fillStyle = PAINT.eye;
  for (const side of [-1, 1]) {
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
  }
  ctx.fillStyle = PAINT.pupil;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * APE.pupilOut, y + APE.eyeUp, APE.pupil, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = PAINT.furDark;
  ctx.lineWidth = APE.mouthLine;
  ctx.beginPath();
  ctx.moveTo(x - APE.mouthHalf, y + APE.mouthDown);
  ctx.lineTo(x + APE.mouthHalf, y + APE.mouthDown);
  ctx.stroke();

  // The brows. Angled in, because he has seen the rock too.
  ctx.lineWidth = APE.browLine;
  ctx.lineCap = "round";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + side * APE.browOut, y + APE.browUp);
    ctx.lineTo(x + side * APE.browIn, y + APE.browDown);
    ctx.stroke();
  }
  ctx.lineCap = "butt";
}
