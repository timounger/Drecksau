/**
 * Die Türme, die keine Affen sind: Fahrzeuge, Flieger und Gebäude.
 *
 * @module
 * @remarks
 * Gezeichnet wird wie in {@link ./render}: Die Zeichenfläche steht schon auf
 * der Mitte des Turms, `size` ist seine Größe, und alles Weitere ist ein Teil
 * davon. Was zielt, zeigt bei Drehung null nach rechts (+x).
 *
 * Bewegung kommt nur aus dem Spielzustand: `faced` für die Richtung, `kick`
 * für den Schuss, `clock` für Rotor und Propeller. Zwischen den Runden steht
 * die Uhr - dann stehen auch die Rotoren, und das ist richtig: Es fliegt ja
 * niemand.
 */

/** Wie eine Maschine gerade dasteht. */
export type MachinePose = {
  /** Wohin sie zeigt, in Bogenmaß. */
  readonly faced: number;
  /** Wie frisch der letzte Schuss ist, 1 bis 0. */
  readonly kick: number;
  /** Die Uhr der Runde, für alles, was sich dreht. */
  readonly clock: number;
};

/** Die Farben der Maschinen. */
const TINT = {
  outline: "rgba(15,23,42,0.55)",
  sub: "#facc15",
  subDark: "#a16207",
  subLight: "#fde68a",
  glass: "#7dd3fc",
  glassDark: "#0369a1",
  ripple: "rgba(255,255,255,0.45)",
  hull: "#8a5a2b",
  hullDark: "#5c3a1a",
  deck: "#c08a52",
  sail: "#f8fafc",
  sailLine: "#cbd5e1",
  mast: "#4a2f14",
  iron: "#374151",
  ironDark: "#111827",
  heli: "#4f7f3a",
  heliDark: "#2f4f22",
  rotor: "#1f2937",
  blur: "rgba(31,41,55,0.18)",
  pad: "#6b7280",
  padLine: "#f8fafc",
  ace: "#b91c1c",
  aceDark: "#7f1d1d",
  aceLight: "#ef4444",
  prop: "#e5e7eb",
  sand: "#d6c08a",
  sandDark: "#a68f55",
  tube: "#4b5a3a",
  tubeDark: "#232b1b",
  smoke: "rgba(229,231,235,0.8)",
  soil: "#7a4f2a",
  soilDark: "#5a3818",
  trunk: "#7c5a2e",
  leaf: "#3f9a3a",
  leafDark: "#256b22",
  banana: "#facc15",
  bananaDark: "#a16207",
  straw: "#d9b45a",
  strawDark: "#9c7a2a",
  wall: "#a16207",
  door: "#4a2f14",
  flag: "#dc2626",
  shed: "#78716c",
  shedDark: "#44403c",
  roof: "#a8a29e",
  belt: "#292524",
  spike: "#cbd5e1",
  spikeDark: "#475569",
  glow: "#f97316",
} as const;

/** Wie dick ein Umriss ist. */
const EDGE = 1.5;

/** Ein halbes - für Mitten und halbe Breiten. */
const HALF = 0.5;

/** Das U-Boot, von oben, in Teilen der Turmgröße. */
const SUB = {
  ripple: 1.25,
  rippleHigh: 0.7,
  long: 1.15,
  wide: 0.42,
  sailAt: -0.1,
  sailLong: 0.38,
  sailWide: 0.22,
  scope: 0.08,
  scopeAt: 0.12,
  fin: 0.3,
  finWide: 0.32,
  tube: 0.12,
  bubbleOut: 1.25,
  bubble: 0.1,
} as const;

/** Das Boot, von oben. */
const BOAT = {
  long: 1.2,
  wide: 0.55,
  bow: 0.55,
  rim: 0.12,
  mast: 0.11,
  sailWide: 0.85,
  sailDeep: 0.22,
  gunAt: 0.55,
  gunLong: 0.35,
  gunWide: 0.14,
  recoil: 0.2,
} as const;

/** Der Hubschrauber, von oben. */
const HELI = {
  body: 0.62,
  bodyWide: 0.4,
  glassAt: 0.3,
  glass: 0.24,
  boom: 1.25,
  boomWide: 0.1,
  fin: 0.28,
  tailRotor: 0.22,
  rotor: 1.35,
  blade: 0.1,
  /** Umdrehungen je Sekunde. */
  spin: 6,
  hub: 0.12,
  skid: 0.5,
  skidOut: 0.45,
} as const;

/** Das Flugzeug, von oben. */
const ACE = {
  body: 0.95,
  bodyWide: 0.2,
  wing: 1.1,
  wingDeep: 0.32,
  wingAt: 0.05,
  tail: 0.42,
  tailDeep: 0.18,
  tailAt: -0.75,
  glass: 0.18,
  glassAt: 0.35,
  prop: 0.45,
  propThick: 0.07,
  /** Umdrehungen je Sekunde. */
  spin: 9,
  roundel: 0.12,
  roundelAt: 0.62,
} as const;

/** Die Landeplätze von Hubschrauber und Flugzeug, in Teilen der Turmgröße. */
const PAD = {
  size: 0.85,
  letter: 0.4,
  letterThick: 0.12,
  strip: 1.3,
  stripWide: 0.38,
  dash: 0.2,
  dashes: 3,
} as const;

/** Der Mörser, von oben. */
const MORTAR = {
  bags: 8,
  bagOut: 0.88,
  bagLong: 0.32,
  bagWide: 0.2,
  plate: 0.7,
  tube: 0.32,
  tubeLong: 0.35,
  bore: 0.2,
  puff: 0.35,
  puffUp: 0.8,
} as const;

/** Die Bananenplantage, von oben. */
const FARM = {
  patch: 1.25,
  corner: 0.25,
  rows: 3,
  furrow: 0.08,
  trees: [
    { x: -0.55, y: -0.4 },
    { x: 0.55, y: -0.35 },
    { x: 0, y: 0.45 },
  ],
  leaf: 0.38,
  leaves: 5,
  leafWide: 0.16,
  bunch: 0.22,
} as const;

/** Eine Bananenstaude, in Teilen ihrer Größe. */
const BUNCH = {
  bananas: 3,
  arc: 0.9,
  thick: 0.32,
  spread: 0.5,
  stem: 0.2,
} as const;

/** Das Affendorf, von oben. */
const HUT = {
  wall: 1.05,
  roof: 0.95,
  straws: 12,
  peak: 0.18,
  door: 0.28,
  doorAt: 0.8,
  pole: 0.06,
  poleUp: 1.35,
  flag: 0.4,
  flagHigh: 0.24,
} as const;

/** Die Nagelfabrik, von oben. */
const FACTORY = {
  wide: 1.15,
  high: 0.85,
  roofIn: 0.12,
  stack: 0.22,
  stackAt: 0.55,
  belt: 0.25,
  beltAt: 0.65,
  spikes: 4,
  spike: 0.12,
  puff: 0.3,
  puffUp: 0.6,
} as const;

/**
 * Das Affen-U-Boot, aufgetaucht im Teich.
 *
 * @remarks
 * Ein gelber Rumpf mit Turm in der Mitte, der sich zum Ziel dreht - und um ihn
 * herum ein Kräuseln, damit man sieht, dass es im Wasser liegt und nicht auf
 * blauer Wiese. Beim Schuss steigen vorne Blasen auf.
 */
export function drawSub(
  ctx: CanvasRenderingContext2D,
  size: number,
  pose: MachinePose,
): void {
  ctx.strokeStyle = TINT.ripple;
  ctx.lineWidth = EDGE;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    size * SUB.ripple,
    size * SUB.ripple * SUB.rippleHigh,
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();

  ctx.save();
  ctx.rotate(pose.faced);
  // Die Heckflossen zuerst, der Rumpf liegt darauf.
  ctx.fillStyle = TINT.subDark;
  ctx.beginPath();
  ctx.moveTo(-size * SUB.long * (1 - SUB.fin), 0);
  ctx.lineTo(-size * SUB.long - size * SUB.fin, -size * SUB.finWide);
  ctx.lineTo(-size * SUB.long - size * SUB.fin, size * SUB.finWide);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = TINT.sub;
  ctx.strokeStyle = TINT.subDark;
  ctx.lineWidth = EDGE;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * SUB.long, size * SUB.wide, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = TINT.subLight;
  ctx.beginPath();
  ctx.ellipse(
    size * SUB.sailAt,
    0,
    size * SUB.sailLong,
    size * SUB.sailWide,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = TINT.ironDark;
  ctx.beginPath();
  ctx.arc(size * SUB.scopeAt, 0, size * SUB.scope, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = TINT.iron;
  ctx.beginPath();
  ctx.arc(size * SUB.long, 0, size * SUB.tube, 0, Math.PI * 2);
  ctx.fill();

  if (pose.kick > 0) {
    ctx.globalAlpha = pose.kick;
    ctx.fillStyle = TINT.ripple;
    for (const side of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.arc(
        size * SUB.bubbleOut + size * SUB.bubble * (1 - pose.kick) * 2,
        side * size * SUB.bubble * 2,
        size * SUB.bubble,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/**
 * Das Boot im Teich.
 *
 * @remarks
 * Ein Holzrumpf mit Spitze voran, quer darüber das Segel - und vorne die
 * Kanone, die beim Schuss zurückfährt. Das ganze Boot dreht sich zum Ziel;
 * ein Schiff, das nur seine Kanone schwenkt, liegt quer zum Geschehen.
 */
export function drawBoat(
  ctx: CanvasRenderingContext2D,
  size: number,
  pose: MachinePose,
): void {
  ctx.save();
  ctx.rotate(pose.faced);

  const back = -size * BOAT.long;
  const front = size * BOAT.long;
  const wide = size * BOAT.wide;
  ctx.fillStyle = TINT.hull;
  ctx.strokeStyle = TINT.hullDark;
  ctx.lineWidth = EDGE;
  ctx.beginPath();
  ctx.moveTo(back, -wide);
  ctx.lineTo(front - size * BOAT.bow, -wide);
  ctx.quadraticCurveTo(front, -wide * HALF, front, 0);
  ctx.quadraticCurveTo(front, wide * HALF, front - size * BOAT.bow, wide);
  ctx.lineTo(back, wide);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const rim = size * BOAT.rim;
  ctx.fillStyle = TINT.deck;
  ctx.beginPath();
  ctx.moveTo(back + rim, -wide + rim);
  ctx.lineTo(front - size * BOAT.bow, -wide + rim);
  ctx.quadraticCurveTo(front - rim, -wide * HALF, front - rim * 2, 0);
  ctx.quadraticCurveTo(
    front - rim,
    wide * HALF,
    front - size * BOAT.bow,
    wide - rim,
  );
  ctx.lineTo(back + rim, wide - rim);
  ctx.closePath();
  ctx.fill();

  // Die Kanone vorn, die beim Schuss zurückfährt.
  ctx.fillStyle = TINT.iron;
  ctx.fillRect(
    size * BOAT.gunAt - size * BOAT.recoil * pose.kick,
    -size * BOAT.gunWide * HALF,
    size * BOAT.gunLong,
    size * BOAT.gunWide,
  );

  // Das Segel, quer zum Rumpf und vom Wind gebläht.
  ctx.fillStyle = TINT.sail;
  ctx.strokeStyle = TINT.sailLine;
  ctx.beginPath();
  ctx.moveTo(0, -size * BOAT.sailWide);
  ctx.quadraticCurveTo(size * BOAT.sailDeep * 2, 0, 0, size * BOAT.sailWide);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = TINT.mast;
  ctx.beginPath();
  ctx.arc(0, 0, size * BOAT.mast, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Der Landeplatz eines Fliegers: ein H für den Hubschrauber, eine Piste für
 * das Flugzeug.
 *
 * @remarks
 * Er bleibt auf dem Feld, wenn der Flieger unterwegs ist - sonst sieht man
 * nicht, wem dieses Feld gehört, und baut aus Versehen daneben.
 */
export function drawPad(
  ctx: CanvasRenderingContext2D,
  size: number,
  strip: boolean,
): void {
  ctx.fillStyle = TINT.pad;
  ctx.strokeStyle = TINT.padLine;
  ctx.lineWidth = size * PAD.letterThick;
  if (strip) {
    ctx.fillRect(
      -size * PAD.strip,
      -size * PAD.stripWide,
      size * PAD.strip * 2,
      size * PAD.stripWide * 2,
    );
    for (let dash = 0; dash < PAD.dashes; dash += 1) {
      const x =
        -size * PAD.strip + ((dash + HALF) / PAD.dashes) * size * PAD.strip * 2;
      ctx.beginPath();
      ctx.moveTo(x - size * PAD.dash, 0);
      ctx.lineTo(x + size * PAD.dash, 0);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, size * PAD.size, 0, Math.PI * 2);
    ctx.fill();
    const letter = size * PAD.letter;
    ctx.beginPath();
    ctx.moveTo(-letter * HALF, -letter);
    ctx.lineTo(-letter * HALF, letter);
    ctx.moveTo(letter * HALF, -letter);
    ctx.lineTo(letter * HALF, letter);
    ctx.moveTo(-letter * HALF, 0);
    ctx.lineTo(letter * HALF, 0);
    ctx.stroke();
  }
}

/**
 * Der Hubschrauber, von oben.
 *
 * @remarks
 * Rumpf, Kanzel, Heckausleger - und darüber der Rotor, dessen zwei Blätter sich
 * mit der Uhr der Runde drehen. Ein durchsichtiger Kreis zeigt, wo sie
 * gerade nicht sind; ohne ihn sähe ein schneller Rotor aus wie ein stehendes
 * Kreuz.
 */
export function drawHeli(
  ctx: CanvasRenderingContext2D,
  size: number,
  pose: MachinePose,
): void {
  ctx.save();
  ctx.rotate(pose.faced);

  ctx.strokeStyle = TINT.rotor;
  ctx.lineWidth = EDGE;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-size * HELI.skid, side * size * HELI.skidOut);
    ctx.lineTo(size * HELI.skid, side * size * HELI.skidOut);
    ctx.stroke();
  }

  ctx.fillStyle = TINT.heliDark;
  ctx.fillRect(
    -size * HELI.boom,
    -size * HELI.boomWide * HALF,
    size * HELI.boom,
    size * HELI.boomWide,
  );
  ctx.beginPath();
  ctx.moveTo(-size * HELI.boom, 0);
  ctx.lineTo(-size * HELI.boom - size * HELI.fin, -size * HELI.fin);
  ctx.lineTo(-size * HELI.boom - size * HELI.fin, size * HELI.fin);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = TINT.heli;
  ctx.strokeStyle = TINT.heliDark;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * HELI.body, size * HELI.bodyWide, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = TINT.glass;
  ctx.beginPath();
  ctx.ellipse(
    size * HELI.glassAt,
    0,
    size * HELI.glass,
    size * HELI.glass * HALF * 2,
    0,
    -Math.PI / 2,
    Math.PI / 2,
  );
  ctx.fill();

  const turn = pose.clock * HELI.spin * Math.PI * 2;
  // Der kleine Heckrotor dreht sich quer, man sieht nur seinen Strich.
  ctx.strokeStyle = TINT.rotor;
  ctx.lineWidth = EDGE;
  ctx.beginPath();
  const tail = Math.sin(turn) * size * HELI.tailRotor;
  ctx.moveTo(-size * HELI.boom, -tail);
  ctx.lineTo(-size * HELI.boom, tail);
  ctx.stroke();

  ctx.fillStyle = TINT.blur;
  ctx.beginPath();
  ctx.arc(0, 0, size * HELI.rotor, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.rotate(turn);
  ctx.fillStyle = TINT.rotor;
  ctx.fillRect(
    -size * HELI.rotor,
    -size * HELI.blade * HALF,
    size * HELI.rotor * 2,
    size * HELI.blade,
  );
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, 0, size * HELI.hub, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Das Flugzeug, von oben.
 *
 * @remarks
 * Ein roter Doppeldecker in Flugrichtung, mit Kokarden auf den Flügeln und
 * einem Propeller, der sich mit der Uhr der Runde dreht.
 */
export function drawAce(
  ctx: CanvasRenderingContext2D,
  size: number,
  pose: MachinePose,
): void {
  ctx.save();
  ctx.rotate(pose.faced);
  ctx.lineWidth = EDGE;

  // Erst das Leitwerk, dann die Flügel, dann der Rumpf obendrauf.
  ctx.fillStyle = TINT.aceDark;
  ctx.fillRect(
    size * ACE.tailAt - size * ACE.tailDeep * HALF,
    -size * ACE.tail,
    size * ACE.tailDeep,
    size * ACE.tail * 2,
  );
  ctx.fillStyle = TINT.ace;
  ctx.strokeStyle = TINT.aceDark;
  ctx.beginPath();
  ctx.rect(
    size * ACE.wingAt - size * ACE.wingDeep * HALF,
    -size * ACE.wing,
    size * ACE.wingDeep,
    size * ACE.wing * 2,
  );
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = TINT.sail;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      size * ACE.wingAt,
      side * size * ACE.wing * ACE.roundelAt,
      size * ACE.roundel,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.fillStyle = TINT.aceLight;
  ctx.strokeStyle = TINT.aceDark;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * ACE.body, size * ACE.bodyWide, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = TINT.glassDark;
  ctx.beginPath();
  ctx.arc(-size * ACE.glassAt, 0, size * ACE.glass, 0, Math.PI * 2);
  ctx.fill();

  const turn = pose.clock * ACE.spin * Math.PI * 2;
  const blade = Math.cos(turn) * size * ACE.prop;
  ctx.fillStyle = TINT.prop;
  ctx.fillRect(
    size * ACE.body,
    -Math.abs(blade),
    size * ACE.propThick,
    Math.abs(blade) * 2,
  );
  ctx.restore();
}

/**
 * Der Mörser hinter Sandsäcken.
 *
 * @remarks
 * Von oben sieht man vom steil stehenden Rohr nur die Mündung und ein kurzes
 * Stück Rohr, das zum Ziel hin kippt. Beim Abschuss steigt eine Rauchwolke
 * auf - der Knall kommt erst, wenn die Granate landet.
 */
export function drawMortar(
  ctx: CanvasRenderingContext2D,
  size: number,
  pose: MachinePose,
): void {
  ctx.lineWidth = EDGE;
  for (let bag = 0; bag < MORTAR.bags; bag += 1) {
    const turn = (bag / MORTAR.bags) * Math.PI * 2;
    ctx.save();
    ctx.rotate(turn);
    ctx.fillStyle = TINT.sand;
    ctx.strokeStyle = TINT.sandDark;
    ctx.beginPath();
    ctx.ellipse(
      size * MORTAR.bagOut,
      0,
      size * MORTAR.bagWide,
      size * MORTAR.bagLong,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = TINT.iron;
  ctx.beginPath();
  ctx.arc(0, 0, size * MORTAR.plate, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(pose.faced);
  ctx.fillStyle = TINT.tube;
  ctx.strokeStyle = TINT.tubeDark;
  ctx.beginPath();
  ctx.rect(
    0,
    -size * MORTAR.tube,
    size * MORTAR.tubeLong,
    size * MORTAR.tube * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * MORTAR.tubeLong, 0, size * MORTAR.tube, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = TINT.tubeDark;
  ctx.beginPath();
  ctx.arc(size * MORTAR.tubeLong, 0, size * MORTAR.bore, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  puff(ctx, size, pose.kick, MORTAR.puff, MORTAR.puffUp);
}

/**
 * Die Bananenplantage.
 *
 * @remarks
 * Ein Acker mit Furchen und drei Stauden, an denen gelbe Bananen hängen.
 * Sie schießt nicht und dreht sich nicht - sie wächst.
 */
export function drawFarm(ctx: CanvasRenderingContext2D, size: number): void {
  const patch = size * FARM.patch;
  ctx.fillStyle = TINT.soil;
  ctx.strokeStyle = TINT.soilDark;
  ctx.lineWidth = EDGE;
  ctx.beginPath();
  ctx.roundRect(-patch, -patch, patch * 2, patch * 2, size * FARM.corner);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = size * FARM.furrow;
  for (let row = 1; row <= FARM.rows; row += 1) {
    const y = -patch + (row / (FARM.rows + 1)) * patch * 2;
    ctx.beginPath();
    ctx.moveTo(-patch * (1 - FARM.corner), y);
    ctx.lineTo(patch * (1 - FARM.corner), y);
    ctx.stroke();
  }

  for (const tree of FARM.trees) {
    const x = tree.x * size;
    const y = tree.y * size;
    ctx.fillStyle = TINT.leaf;
    ctx.strokeStyle = TINT.leafDark;
    ctx.lineWidth = 1;
    for (let leaf = 0; leaf < FARM.leaves; leaf += 1) {
      const turn = (leaf / FARM.leaves) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        x + Math.cos(turn) * size * FARM.leaf * HALF,
        y + Math.sin(turn) * size * FARM.leaf * HALF,
        size * FARM.leaf * HALF,
        size * FARM.leafWide,
        turn,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.stroke();
    }
    drawBananas(ctx, x, y, size * FARM.bunch);
  }
}

/**
 * Eine Bananenstaude - auf der Plantage und als Geld, das am Rundenende
 * darüber aufsteigt.
 *
 * @param ctx - die Zeichenfläche
 * @param x - wo sie hängt
 * @param y - wo sie hängt
 * @param size - wie groß sie ist
 */
export function drawBananas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  ctx.lineCap = "round";
  for (let one = 0; one < BUNCH.bananas; one += 1) {
    const tilt = (one - (BUNCH.bananas - 1) / 2) * BUNCH.spread;
    ctx.strokeStyle = TINT.bananaDark;
    ctx.lineWidth = size * BUNCH.thick + 2;
    ctx.beginPath();
    ctx.arc(
      x,
      y - size,
      size * 2,
      Math.PI / 2 + tilt - BUNCH.arc * HALF,
      Math.PI / 2 + tilt + BUNCH.arc * HALF,
    );
    ctx.stroke();
    ctx.strokeStyle = TINT.banana;
    ctx.lineWidth = size * BUNCH.thick;
    ctx.stroke();
  }
  ctx.strokeStyle = TINT.trunk;
  ctx.lineWidth = size * BUNCH.stem;
  ctx.beginPath();
  ctx.moveTo(x, y + size * HALF);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.lineCap = "butt";
}

/**
 * Das Affendorf: eine Rundhütte mit Strohdach und Fahne.
 *
 * @remarks
 * Von oben sieht man vom Dorf vor allem das Dach - ein Kreis aus Strohhalmen,
 * die zur Spitze laufen - und die Tür, die zum Betrachter schaut.
 */
export function drawVillage(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.lineWidth = EDGE;
  ctx.fillStyle = TINT.wall;
  ctx.strokeStyle = TINT.hullDark;
  ctx.beginPath();
  ctx.arc(0, 0, size * HUT.wall, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = TINT.door;
  ctx.beginPath();
  ctx.arc(0, size * HUT.doorAt, size * HUT.door, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = TINT.straw;
  ctx.strokeStyle = TINT.strawDark;
  ctx.beginPath();
  ctx.arc(0, 0, size * HUT.roof, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1;
  for (let straw = 0; straw < HUT.straws; straw += 1) {
    const turn = (straw / HUT.straws) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(
      Math.cos(turn) * size * HUT.peak,
      Math.sin(turn) * size * HUT.peak,
    );
    ctx.lineTo(
      Math.cos(turn) * size * HUT.roof,
      Math.sin(turn) * size * HUT.roof,
    );
    ctx.stroke();
  }
  ctx.fillStyle = TINT.strawDark;
  ctx.beginPath();
  ctx.arc(0, 0, size * HUT.peak, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = TINT.mast;
  ctx.lineWidth = size * HUT.pole;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -size * HUT.poleUp);
  ctx.stroke();
  ctx.fillStyle = TINT.flag;
  ctx.beginPath();
  ctx.moveTo(0, -size * HUT.poleUp);
  ctx.lineTo(size * HUT.flag, -size * HUT.poleUp + size * HUT.flagHigh * HALF);
  ctx.lineTo(0, -size * HUT.poleUp + size * HUT.flagHigh);
  ctx.closePath();
  ctx.fill();
}

/**
 * Die Nagelfabrik: ein Schuppen mit Schornstein und Förderband.
 *
 * @remarks
 * Auf dem Band liegen die Nägel, die gleich auf die Straße fliegen; beim
 * Auswurf raucht der Schornstein.
 */
export function drawSpikeFactory(
  ctx: CanvasRenderingContext2D,
  size: number,
  pose: MachinePose,
): void {
  const wide = size * FACTORY.wide;
  const high = size * FACTORY.high;
  ctx.lineWidth = EDGE;
  ctx.fillStyle = TINT.belt;
  ctx.fillRect(-wide, size * FACTORY.beltAt, wide * 2, size * FACTORY.belt);
  ctx.fillStyle = TINT.spike;
  for (let spike = 0; spike < FACTORY.spikes; spike += 1) {
    const x = -wide + ((spike + HALF) / FACTORY.spikes) * wide * 2;
    star(
      ctx,
      x,
      size * FACTORY.beltAt + size * FACTORY.belt * HALF,
      size * FACTORY.spike,
    );
  }

  ctx.fillStyle = TINT.shed;
  ctx.strokeStyle = TINT.shedDark;
  ctx.beginPath();
  ctx.rect(-wide, -high, wide * 2, high * 2 - size * FACTORY.belt);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = TINT.roof;
  ctx.fillRect(
    -wide + size * FACTORY.roofIn,
    -high + size * FACTORY.roofIn,
    wide * 2 - size * FACTORY.roofIn * 2,
    high - size * FACTORY.roofIn,
  );

  ctx.fillStyle = TINT.shedDark;
  ctx.beginPath();
  ctx.arc(
    size * FACTORY.stackAt,
    -size * FACTORY.stackAt,
    size * FACTORY.stack,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = TINT.glow;
  ctx.beginPath();
  ctx.arc(
    size * FACTORY.stackAt,
    -size * FACTORY.stackAt,
    size * FACTORY.stack * HALF,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.save();
  ctx.translate(size * FACTORY.stackAt, -size * FACTORY.stackAt);
  puff(ctx, size, pose.kick, FACTORY.puff, FACTORY.puffUp);
  ctx.restore();
}

/**
 * Ein Nagelstern: vier gekreuzte Nägel, wie sie auf der Straße liegen.
 *
 * @param ctx - die Zeichenfläche
 * @param x - wo er liegt
 * @param y - wo er liegt
 * @param size - wie weit die Spitzen reichen
 */
export function star(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = TINT.spikeDark;
  ctx.lineWidth = 1;
  ctx.fillStyle = TINT.spike;
  const points = 8;
  ctx.beginPath();
  for (let tip = 0; tip < points * 2; tip += 1) {
    const turn = (tip / (points * 2)) * Math.PI * 2;
    const out = tip % 2 === 0 ? size : size * HALF * HALF;
    if (tip === 0) {
      ctx.moveTo(Math.cos(turn) * out, Math.sin(turn) * out);
    } else {
      ctx.lineTo(Math.cos(turn) * out, Math.sin(turn) * out);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Eine Rauchwolke, die nach einem Schuss aufsteigt und verblasst. */
function puff(
  ctx: CanvasRenderingContext2D,
  size: number,
  kick: number,
  big: number,
  rise: number,
): void {
  if (kick > 0) {
    ctx.globalAlpha = kick;
    ctx.fillStyle = TINT.smoke;
    ctx.beginPath();
    ctx.arc(
      0,
      -size * rise * (1 - kick),
      size * big * (2 - kick),
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
