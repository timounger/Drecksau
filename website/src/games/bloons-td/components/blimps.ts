/**
 * Was größer ist als ein Ballon: Zeppeline und Bosse - und was man einem
 * Ballon ansieht, der mehr kann als platzen.
 *
 * @module
 * @remarks
 * Ein Zeppelin fliegt mit dem Bug voran, also wird er in Wegrichtung gedreht;
 * ein Boss ist rund und schaut den Betrachter an. Beide bekommen einen
 * Lebensbalken, denn bei zweihundert oder viertausend Treffern Hülle sieht
 * man sonst nicht, ob man überhaupt etwas ausrichtet.
 *
 * Die Eigenschaften sind Zeichen auf dem Ballon, keine neuen Farben: Ein
 * getarnter roter Ballon ist ein roter Ballon mit Tarnflecken und halb
 * durchsichtig, ein verstärkter trägt Metallbänder, ein nachwachsender ein
 * grünes Plus, ein geschützter einen blauen Ring. So bleibt die Farbe, was sie
 * immer war - die Sorte.
 */
import type { BloonKind } from "@/games/bloons-td/engine/bloons";

/** Die Farben dieser Datei. */
const TINT = {
  outline: "rgba(15,23,42,0.6)",
  stripe: "rgba(255,255,255,0.28)",
  window: "#fef3c7",
  fin: "rgba(0,0,0,0.25)",
  barBack: "rgba(15,23,42,0.75)",
  barFull: "#22c55e",
  barLow: "#ef4444",
  barShield: "#38bdf8",
  name: "#ffffff",
  camo: "rgba(34,60,30,0.55)",
  metal: "#9ca3af",
  metalDark: "#4b5563",
  regrow: "#22c55e",
  regrowLine: "#ffffff",
  shield: "rgba(56,189,248,0.85)",
  shieldGlow: "rgba(56,189,248,0.25)",
  star: "#fde047",
  starLine: "#a16207",
  eye: "#fef08a",
  eyeDark: "#111827",
  skull: "#a3e635",
  crown: "#fbbf24",
  lava: "#fde047",
  spot: "rgba(255,255,255,0.35)",
  swirl: "rgba(255,255,255,0.7)",
  crack: "rgba(0,0,0,0.55)",
} as const;

/** Ein halbes. */
const HALF = 0.5;

/** Der Zeppelin, in Teilen seiner Größe. */
const BLIMP = {
  long: 1.2,
  wide: 0.55,
  fin: 0.5,
  finWide: 0.45,
  stripe: 0.18,
  window: 0.08,
  windows: 3,
  windowGap: 0.3,
  edge: 2,
} as const;

/** Der Lebensbalken, in Teilen der Größe dessen, über dem er hängt. */
const BAR = {
  wide: 1.8,
  high: 0.16,
  up: 1.35,
  /** Ab wie viel Rest er rot wird. */
  low: 0.3,
  font: 0.32,
  nameUp: 0.25,
} as const;

/** Die Bosse, in Teilen ihrer Größe. */
const BOSS = {
  edge: 2.5,
  swirls: 3,
  swirlSpin: 1.5,
  swirlFrom: 0.25,
  swirlTo: 0.85,
  spots: [
    { x: -0.4, y: -0.3, r: 0.18 },
    { x: 0.35, y: -0.45, r: 0.12 },
    { x: 0.45, y: 0.25, r: 0.2 },
    { x: -0.25, y: 0.45, r: 0.13 },
  ],
  mouthUp: 0.25,
  mouth: 0.35,
  cracks: [
    [
      { x: -0.6, y: -0.2 },
      { x: -0.1, y: 0.1 },
      { x: 0.1, y: 0.6 },
    ],
    [
      { x: 0.2, y: -0.75 },
      { x: 0.35, y: -0.2 },
      { x: 0.7, y: 0 },
    ],
  ],
  eyeApart: 0.32,
  eyeUp: 0.15,
  eye: 0.17,
  pupil: 0.08,
  crownUp: 0.95,
  crownWide: 0.5,
  crownHigh: 0.3,
  crownPoints: 3,
  bigEye: 0.38,
  bigPupil: 0.16,
  core: 0.45,
  glow: 4,
} as const;

/** Die Zeichen der Eigenschaften, in Teilen der Ballongröße. */
const MARK = {
  camoSpots: [
    { x: -0.35, y: -0.2, r: 0.28 },
    { x: 0.3, y: 0.15, r: 0.32 },
    { x: -0.05, y: 0.55, r: 0.22 },
  ],
  camoAlpha: 0.6,
  bandUp: 0.35,
  band: 0.14,
  badge: 0.32,
  badgeX: 0.7,
  badgeY: -0.75,
  plus: 0.18,
  shield: 1.4,
  shieldLine: 2.5,
  phased: 0.3,
} as const;

/** Die Sterne über einem betäubten Turm. */
const DIZZY = {
  stars: 3,
  up: 1.6,
  wide: 0.55,
  high: 0.18,
  size: 0.18,
  spin: 2,
  points: 5,
} as const;

/**
 * Ein Zeppelin, mit dem Bug in Wegrichtung.
 *
 * @param ctx - die Zeichenfläche, schon auf seine Mitte gesetzt
 * @param size - wie groß er ist, als Halbmesser in Bildpunkten
 * @param heading - wohin er fliegt
 * @param paint - seine Farbe
 * @param line - die Farbe seines Randes
 */
export function drawBlimp(
  ctx: CanvasRenderingContext2D,
  size: number,
  heading: number,
  paint: string,
  line: string,
): void {
  ctx.save();
  ctx.rotate(heading);
  const back = -size * BLIMP.long;

  // Die Leitwerke hinten, kreuzförmig - von oben sieht man zwei.
  ctx.fillStyle = line;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(back + size * BLIMP.fin, 0);
    ctx.lineTo(back - size * BLIMP.fin * HALF, side * size * BLIMP.finWide * 2);
    ctx.lineTo(back - size * BLIMP.fin * HALF, side * size * BLIMP.finWide);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = paint;
  ctx.strokeStyle = line;
  ctx.lineWidth = BLIMP.edge;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * BLIMP.long, size * BLIMP.wide, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = TINT.stripe;
  ctx.fillRect(
    -size * BLIMP.long * HALF,
    -size * BLIMP.stripe * HALF,
    size * BLIMP.long,
    size * BLIMP.stripe,
  );
  ctx.fillStyle = TINT.window;
  for (let one = 0; one < BLIMP.windows; one += 1) {
    ctx.beginPath();
    ctx.arc(
      (one - (BLIMP.windows - 1) / 2) * size * BLIMP.windowGap,
      size * BLIMP.wide * HALF,
      size * BLIMP.window,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Ein Boss.
 *
 * @param ctx - die Zeichenfläche, schon auf seine Mitte gesetzt
 * @param kind - welcher
 * @param size - sein Halbmesser in Bildpunkten
 * @param paint - seine Farbe
 * @param line - die Farbe seines Randes
 * @param clock - die Uhr der Runde, für den Wirbel des Vortex
 * @remarks
 * Jeder hat sein Erkennungszeichen: Vortex einen Wirbel, Bloonarius
 * Schleimflecken und ein Maul, Dreadbloon Risse im Stein, Lych einen
 * Totenkopf mit Krone, Phayze ein einziges großes Auge, Blastapopoulos einen
 * glühenden Kern mit Lavarissen.
 */
export function drawBoss(
  ctx: CanvasRenderingContext2D,
  kind: BloonKind,
  size: number,
  paint: string,
  line: string,
  clock: number,
): void {
  ctx.fillStyle = paint;
  ctx.strokeStyle = line;
  ctx.lineWidth = BOSS.edge;
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  switch (kind) {
    case "vortex":
      ctx.strokeStyle = TINT.swirl;
      ctx.lineWidth = BOSS.edge;
      for (let one = 0; one < BOSS.swirls; one += 1) {
        const turn =
          clock * BOSS.swirlSpin * Math.PI * 2 +
          (one / BOSS.swirls) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(
          0,
          0,
          size * mix(BOSS.swirlFrom, BOSS.swirlTo, one / BOSS.swirls),
          turn,
          turn + Math.PI,
        );
        ctx.stroke();
      }
      break;
    case "bloonarius":
      ctx.fillStyle = TINT.spot;
      for (const spot of BOSS.spots) {
        ctx.beginPath();
        ctx.arc(spot.x * size, spot.y * size, spot.r * size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = line;
      ctx.beginPath();
      ctx.arc(0, size * BOSS.mouthUp, size * BOSS.mouth, 0, Math.PI);
      ctx.fill();
      break;
    case "dreadbloon":
      ctx.strokeStyle = TINT.crack;
      ctx.lineWidth = BOSS.edge;
      cracks(ctx, size);
      eyes(ctx, size, TINT.eye);
      break;
    case "lych":
      eyes(ctx, size, TINT.skull);
      ctx.fillStyle = TINT.crown;
      ctx.beginPath();
      ctx.moveTo(
        -size * BOSS.crownWide,
        -size * BOSS.crownUp + size * BOSS.crownHigh,
      );
      for (let point = 0; point <= BOSS.crownPoints * 2; point += 1) {
        const x =
          -size * BOSS.crownWide +
          (point / (BOSS.crownPoints * 2)) * size * BOSS.crownWide * 2;
        const y =
          point % 2 === 0
            ? -size * BOSS.crownUp
            : -size * BOSS.crownUp + size * BOSS.crownHigh * HALF;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(
        size * BOSS.crownWide,
        -size * BOSS.crownUp + size * BOSS.crownHigh,
      );
      ctx.closePath();
      ctx.fill();
      break;
    case "phayze":
      ctx.fillStyle = TINT.eye;
      ctx.beginPath();
      ctx.arc(0, -size * BOSS.eyeUp, size * BOSS.bigEye, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = TINT.eyeDark;
      ctx.beginPath();
      ctx.arc(0, -size * BOSS.eyeUp, size * BOSS.bigPupil, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "blastapopoulos":
      ctx.shadowColor = TINT.lava;
      ctx.shadowBlur = BOSS.glow * 2;
      ctx.fillStyle = TINT.lava;
      ctx.beginPath();
      ctx.arc(0, 0, size * BOSS.core, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = TINT.lava;
      ctx.lineWidth = BOSS.edge;
      cracks(ctx, size);
      break;
    default:
      break;
  }
}

/**
 * Ein Lebensbalken über einem Zeppelin oder Boss.
 *
 * @param ctx - die Zeichenfläche, schon auf seine Mitte gesetzt
 * @param size - wie groß er ist
 * @param share - wie viel Hülle noch übrig ist, null bis eins
 * @param shield - wie viel Schild er noch hat, als Anteil seiner vollen Hülle
 * @param name - sein Name, oder null - nur Bosse tragen ihn über dem Balken
 */
export function drawBar(
  ctx: CanvasRenderingContext2D,
  size: number,
  share: number,
  shield: number,
  name: string | null,
): void {
  const wide = size * BAR.wide;
  const high = Math.max(2, size * BAR.high);
  const y = -size * BAR.up;
  const left = Math.max(0, Math.min(1, share));

  ctx.fillStyle = TINT.barBack;
  ctx.fillRect(-wide * HALF - 1, y - 1, wide + 2, high + 2);
  ctx.fillStyle = left < BAR.low ? TINT.barLow : TINT.barFull;
  ctx.fillRect(-wide * HALF, y, wide * left, high);
  if (shield > 0) {
    ctx.fillStyle = TINT.barShield;
    ctx.fillRect(-wide * HALF, y, wide * Math.min(1, shield), high * HALF);
  }
  if (name !== null) {
    ctx.fillStyle = TINT.name;
    ctx.strokeStyle = TINT.barBack;
    ctx.lineWidth = 2;
    ctx.font = `bold ${Math.round(size * BAR.font)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.strokeText(name, 0, y - size * BAR.nameUp * HALF);
    ctx.fillText(name, 0, y - size * BAR.nameUp * HALF);
  }
}

/** Was einem Ballon außer seiner Sorte anzusehen ist. */
export type Marks = {
  readonly camo: boolean;
  readonly regrow: boolean;
  readonly fortified: boolean;
  readonly shield: boolean;
};

/**
 * Die Zeichen der Eigenschaften über einem gewöhnlichen Ballon.
 *
 * @param ctx - die Zeichenfläche, schon auf seine Mitte gesetzt
 * @param size - wie groß er ist
 * @param marks - was er mitbringt
 * @remarks
 * Die Tarnflecken liegen auf dem Ballon, die anderen Zeichen daneben - so
 * sieht man auch einem getarnten, verstärkten, nachwachsenden Ballon mit
 * Schild noch an, welche Sorte er ist.
 */
export function drawMarks(
  ctx: CanvasRenderingContext2D,
  size: number,
  marks: Marks,
): void {
  if (marks.camo) {
    ctx.fillStyle = TINT.camo;
    for (const spot of MARK.camoSpots) {
      ctx.beginPath();
      ctx.arc(spot.x * size, spot.y * size, spot.r * size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (marks.fortified) {
    ctx.strokeStyle = TINT.metal;
    ctx.lineWidth = size * MARK.band;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-size, side * size * MARK.bandUp);
      ctx.lineTo(size, side * size * MARK.bandUp);
      ctx.stroke();
    }
  }
  if (marks.regrow) {
    const x = size * MARK.badgeX;
    const y = size * MARK.badgeY;
    ctx.fillStyle = TINT.regrow;
    ctx.beginPath();
    ctx.arc(x, y, size * MARK.badge, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = TINT.regrowLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size * MARK.plus, y);
    ctx.lineTo(x + size * MARK.plus, y);
    ctx.moveTo(x, y - size * MARK.plus);
    ctx.lineTo(x, y + size * MARK.plus);
    ctx.stroke();
  }
  if (marks.shield) {
    drawShield(ctx, size * MARK.shield);
  }
}

/** Ein blauer Schildring um etwas herum. */
export function drawShield(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = TINT.shieldGlow;
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = TINT.shield;
  ctx.lineWidth = MARK.shieldLine;
  ctx.stroke();
}

/** Wie durchsichtig etwas Verschobenes oder Getarntes gezeichnet wird. */
export const SEE_THROUGH = {
  phased: MARK.phased,
  camo: MARK.camoAlpha,
} as const;

/**
 * Drei Sterne, die über einem betäubten Turm kreisen.
 *
 * @param ctx - die Zeichenfläche, schon auf die Mitte des Turms gesetzt
 * @param size - wie groß der Turm ist
 * @param clock - die Uhr der Runde, damit sie kreisen
 */
export function drawDizzy(
  ctx: CanvasRenderingContext2D,
  size: number,
  clock: number,
): void {
  ctx.fillStyle = TINT.star;
  ctx.strokeStyle = TINT.starLine;
  ctx.lineWidth = 1;
  for (let one = 0; one < DIZZY.stars; one += 1) {
    const turn =
      clock * DIZZY.spin * Math.PI * 2 + (one / DIZZY.stars) * Math.PI * 2;
    const x = Math.cos(turn) * size * DIZZY.wide;
    const y = -size * DIZZY.up + Math.sin(turn) * size * DIZZY.high;
    ctx.beginPath();
    for (let tip = 0; tip < DIZZY.points * 2; tip += 1) {
      const angle = (tip / (DIZZY.points * 2)) * Math.PI * 2 - Math.PI / 2;
      const out = tip % 2 === 0 ? size * DIZZY.size : size * DIZZY.size * HALF;
      const px = x + Math.cos(angle) * out;
      const py = y + Math.sin(angle) * out;
      if (tip === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** Die Risse im Stein oder in der Lava. */
function cracks(ctx: CanvasRenderingContext2D, size: number): void {
  for (const crack of BOSS.cracks) {
    ctx.beginPath();
    for (const [at, point] of crack.entries()) {
      if (at === 0) {
        ctx.moveTo(point.x * size, point.y * size);
      } else {
        ctx.lineTo(point.x * size, point.y * size);
      }
    }
    ctx.stroke();
  }
}

/** Zwei leuchtende Augen. */
function eyes(ctx: CanvasRenderingContext2D, size: number, glow: string): void {
  for (const side of [-1, 1]) {
    ctx.fillStyle = TINT.eyeDark;
    ctx.beginPath();
    ctx.arc(
      side * size * BOSS.eyeApart,
      -size * BOSS.eyeUp,
      size * BOSS.eye,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(
      side * size * BOSS.eyeApart,
      -size * BOSS.eyeUp,
      size * BOSS.pupil,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/** Zwischen zwei Zahlen mischen. */
function mix(from: number, to: number, share: number): number {
  return from + (to - from) * share;
}
