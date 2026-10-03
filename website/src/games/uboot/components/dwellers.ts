/**
 * Wer in den tiefen Gewässern unterwegs ist.
 *
 * @module
 * @remarks
 * Dieselbe Sorte Feld wie die Häuser in {@link ./landmarks} - nur dass hier
 * niemand wohnt, sondern jemand schwimmt, sitzt oder schwebt. Für den Kurs
 * ist beides Zierde: Man fährt hindurch, und es tut einem nichts.
 *
 * In diesen vier Gewässern ist es dunkel. Was man dort unten sieht, leuchtet
 * selbst - darum bekommt jeder Bewohner in {@link ./landmark-art} eine eigene
 * Farbe für den Schein, mit dem er durch den Schleier dringt.
 */
import { HALF, WAYS } from "@/games/uboot/components/landmarks";
import { CELL } from "@/games/uboot/engine/types";

/** Die Farben der beiden Fische. */
const FISH = {
  clown: "#f4661d",
  band: "#fdf4e8",
  ink: "#15161c",
  tang: "#1f5ad2",
  tangLight: "#5a93f2",
  tangDark: "#101f46",
  tail: "#f7c92b",
  white: "#ffffff",
  pupil: "#171a22",
} as const;

/** Wie die beiden zueinander stehen, in Vielfachen einer Kursfeldbreite. */
const SHOAL = {
  /** Wie weit sie auseinander schweben und wie hoch über der Feldmitte. */
  apart: 1.55,
  up: 0.1,
  /** Wie weit sie dabei auf und ab gehen und wie schnell. */
  bob: 0.09,
  pace: 1.3,
  /** Nemo: halbe Länge, halbe Höhe. */
  clownLong: 0.5,
  clownHigh: 0.26,
  /** Dorie ist die größere von beiden. */
  tangLong: 0.62,
  tangHigh: 0.4,
} as const;

/** Die Maße des Clownfischs, in Teilen seiner eigenen halben Länge. */
const CLOWN = {
  ink: 0.07,
  /** Der Schwanz: wo er ansetzt, wie weit hinaus, wie tief die Kerbe. */
  tailFrom: 0.62,
  tailOut: 1.32,
  tailHigh: 1.3,
  tailWaist: 0.88,
  /** Rücken- und Bauchflosse. */
  finFrom: 0.86,
  finTo: 0.5,
  finAt: 0.62,
  finOut: 1.45,
  /** Die drei Binden: Abstand, Versatz, Breite und Neigung. */
  bandApart: 0.6,
  bandShift: 0.08,
  bandWide: 0.17,
  bandLean: 0.2,
  /** Die Brustflosse an der Seite. */
  sideAt: 0.02,
  sideDown: 0.68,
  sideLong: 0.22,
  sideHigh: 0.26,
  sideTilt: 0.55,
  /** Auge und Maul. */
  eyeAt: 0.55,
  eyeUp: 0.3,
  eye: 0.3,
  mouthAt: 0.9,
  mouthDown: 0.3,
  mouthLong: 0.16,
} as const;

/** Die Maße des Doktorfischs, in Teilen seiner eigenen halben Länge. */
const TANG = {
  ink: 0.05,
  /** Wie weit die Schnauze vorsteht und wie sie geschnitten ist. */
  snout: 1.15,
  snoutUp: 0.2,
  snoutDown: 0.5,
  /** Der gelbe Schwanz. */
  tailFrom: 0.72,
  tailOut: 1.5,
  tailHigh: 0.95,
  tailWaist: 1.08,
  /** Rücken- und Bauchsaum. */
  seam: 0.78,
  seamOut: 1.15,
  seamFrom: 0.72,
  seamTo: 0.5,
  /** Das schwarze Zeichen, das wie eine Sechs auf der Seite liegt. */
  markWide: 0.2,
  markFrom: 0.22,
  markUp: 0.58,
  markBack: 0.68,
  markDown: 0.1,
  markTo: 0.05,
  /** Auge und Lächeln. */
  eyeAt: 0.5,
  eyeUp: 0.3,
  eye: 0.3,
  smileAt: 0.72,
  smileDown: 0.52,
  smileOut: 0.3,
} as const;

/**
 * Zeichnet die beiden Fische, die einander im Dunkeln anschauen.
 *
 * @param ctx - die Zeichenfläche
 * @param x - die linke Kante ihres Feldes im Bild
 * @param y - und dessen obere Kante
 * @param time - die Uhr des Tauchgangs, damit sie im Wasser stehen
 * @remarks
 * Zwei und nicht einer: Ein einzelner Fisch ist ein Fisch; zwei, die
 * voreinander stehen, sind eine Begegnung - und das ist der Grund, warum man
 * sich beim nächsten Mal an die Stelle erinnert.
 */
export function drawNemo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const middle = x + CELL * HALF;
  const line = y + CELL * HALF - CELL * SHOAL.up;
  const swing = Math.sin(time * SHOAL.pace) * CELL * SHOAL.bob;
  const apart = CELL * SHOAL.apart * HALF;

  clownfish(
    ctx,
    middle - apart,
    line + swing,
    CELL * SHOAL.clownLong,
    CELL * SHOAL.clownHigh,
  );
  tang(
    ctx,
    middle + apart,
    line - swing,
    CELL * SHOAL.tangLong,
    CELL * SHOAL.tangHigh,
  );
}

/** Ein Auge mit Rand, Pupille und einem Lichtpunkt darin. */
function eye(
  ctx: CanvasRenderingContext2D,
  at: number,
  up: number,
  size: number,
): void {
  ctx.fillStyle = FISH.white;
  ctx.beginPath();
  ctx.arc(at, up, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = FISH.ink;
  ctx.lineWidth = size * CLOWN.ink * 2;
  ctx.stroke();
  ctx.fillStyle = FISH.pupil;
  ctx.beginPath();
  ctx.arc(at + size * HALF * HALF, up, size * HALF, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = FISH.white;
  ctx.beginPath();
  ctx.arc(
    at + size * HALF * HALF,
    up - size * HALF * HALF,
    size * CLOWN.ink * 2,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

/** Der Clownfisch: orange, drei weiße Binden, alles dunkel umrandet. */
function clownfish(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  long: number,
  high: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = FISH.clown;
  ctx.strokeStyle = FISH.ink;
  ctx.lineWidth = long * CLOWN.ink;

  // Der Schwanz mit der Kerbe.
  ctx.beginPath();
  ctx.moveTo(-long * CLOWN.tailFrom, 0);
  ctx.lineTo(-long * CLOWN.tailOut, -high * CLOWN.tailHigh);
  ctx.quadraticCurveTo(
    -long * CLOWN.tailWaist,
    0,
    -long * CLOWN.tailOut,
    high * CLOWN.tailHigh,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Rücken- und Bauchflosse, beide gleich geschwungen.
  for (const way of WAYS) {
    ctx.beginPath();
    ctx.moveTo(-long * CLOWN.finFrom, way * high * CLOWN.finAt);
    ctx.quadraticCurveTo(
      0,
      way * high * CLOWN.finOut,
      long * CLOWN.finTo,
      way * high * CLOWN.finAt,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Der Körper.
  ctx.beginPath();
  ctx.ellipse(0, 0, long, high, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Die drei Binden, am Körper abgeschnitten: ein weißer Strich auf einem
  // dickeren dunklen gibt den Rand, den sie im Bild haben.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, long, high, 0, 0, Math.PI * 2);
  ctx.clip();
  for (let band = -1; band <= 1; band += 1) {
    const at = band * long * CLOWN.bandApart + long * CLOWN.bandShift;
    ctx.beginPath();
    ctx.moveTo(at + long * CLOWN.bandLean, -high * 2);
    ctx.quadraticCurveTo(at, 0, at - long * CLOWN.bandLean, high * 2);
    ctx.strokeStyle = FISH.ink;
    ctx.lineWidth = long * (CLOWN.bandWide + CLOWN.ink * 2);
    ctx.stroke();
    ctx.strokeStyle = FISH.band;
    ctx.lineWidth = long * CLOWN.bandWide;
    ctx.stroke();
  }
  ctx.restore();

  // Die Brustflosse liegt über den Binden.
  ctx.fillStyle = FISH.clown;
  ctx.strokeStyle = FISH.ink;
  ctx.lineWidth = long * CLOWN.ink;
  ctx.beginPath();
  ctx.ellipse(
    long * CLOWN.sideAt,
    high * CLOWN.sideDown,
    long * CLOWN.sideLong,
    high * CLOWN.sideHigh,
    CLOWN.sideTilt,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.stroke();

  // Maul und Auge.
  ctx.beginPath();
  ctx.moveTo(long * CLOWN.mouthAt, high * CLOWN.mouthDown);
  ctx.lineTo(long * (CLOWN.mouthAt - CLOWN.mouthLong), high * CLOWN.mouthDown);
  ctx.stroke();
  eye(ctx, long * CLOWN.eyeAt, -high * CLOWN.eyeUp, long * CLOWN.eye);
  ctx.restore();
}

/** Der Doktorfisch: blau, gelber Schwanz, das schwarze Zeichen am Rücken. */
function tang(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  long: number,
  high: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  // Sie schaut den anderen an, also nach links.
  ctx.scale(-1, 1);
  ctx.strokeStyle = FISH.tangDark;
  ctx.lineWidth = long * TANG.ink;

  // Der gelbe Schwanz.
  ctx.fillStyle = FISH.tail;
  ctx.beginPath();
  ctx.moveTo(-long * TANG.tailFrom, 0);
  ctx.lineTo(-long * TANG.tailOut, -high * TANG.tailHigh);
  ctx.quadraticCurveTo(
    -long * TANG.tailWaist,
    0,
    -long * TANG.tailOut,
    high * TANG.tailHigh,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Rücken- und Bauchsaum.
  ctx.fillStyle = FISH.tangDark;
  for (const way of WAYS) {
    ctx.beginPath();
    ctx.moveTo(-long * TANG.seamFrom, way * high * TANG.seam);
    ctx.quadraticCurveTo(
      0,
      way * high * TANG.seamOut,
      long * TANG.seamTo,
      way * high * TANG.seam,
    );
    ctx.closePath();
    ctx.fill();
  }

  // Der Körper und davor die Schnauze.
  ctx.fillStyle = FISH.tang;
  ctx.beginPath();
  ctx.ellipse(0, 0, long, high, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(long * TANG.snout, -high * TANG.snoutUp);
  ctx.quadraticCurveTo(long, high * TANG.snoutDown, long * HALF, high * HALF);
  ctx.lineTo(long * HALF, -high * HALF);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Das Zeichen: vom Kopf über den Rücken nach hinten und wieder vor.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, long, high, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = FISH.tangDark;
  ctx.lineWidth = high * TANG.markWide;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(long * TANG.markFrom, -high * TANG.markUp);
  ctx.quadraticCurveTo(
    -long * TANG.markBack,
    -high * TANG.markUp,
    -long * TANG.markBack,
    high * TANG.markDown,
  );
  ctx.quadraticCurveTo(
    -long * TANG.markFrom,
    high * TANG.markUp,
    long * TANG.markTo,
    high * TANG.markDown,
  );
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.restore();

  // Ein hellerer Fleck am Bauch, dann Lächeln und Auge.
  ctx.fillStyle = FISH.tangLight;
  ctx.beginPath();
  ctx.ellipse(
    long * TANG.eyeAt * HALF,
    high * TANG.seam * HALF,
    long * HALF,
    high * TANG.markWide,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.strokeStyle = FISH.tangDark;
  ctx.lineWidth = long * TANG.ink;
  ctx.beginPath();
  ctx.moveTo(long * TANG.snout, high * TANG.markDown);
  ctx.quadraticCurveTo(
    long * TANG.smileAt,
    high * TANG.smileDown,
    long * (TANG.smileAt - TANG.smileOut),
    high * TANG.markDown,
  );
  ctx.stroke();
  eye(ctx, long * TANG.eyeAt, -high * TANG.eyeUp, long * TANG.eye);
  ctx.restore();
}

/** Die Farben des Delfins und seines Reiters. */
const DOLPHIN = {
  back: "#8ec9e9",
  backDark: "#5a9ec9",
  belly: "#eaf7fd",
  line: "rgba(22,58,86,0.7)",
  mouth: "#2b5e80",
  gum: "#f07a97",
  skin: "#f0b98a",
  skinDark: "#cf9263",
  hair: "#7c4a21",
  hairDark: "#5a3415",
  shorts: "#e2453c",
  shortsDark: "#ad2f28",
} as const;

/** Die Maße des Delfins, in Vielfachen einer Kursfeldbreite. */
const FLIP = {
  /** Halbe Länge, halbe Höhe und wie hoch über der Feldmitte er schwimmt. */
  long: 1.1,
  high: 0.42,
  up: 0.15,
  /** Wie weit er dabei steigt und fällt und wie schnell. */
  bob: 0.08,
  pace: 1.1,
  line: 0.035,
} as const;

/** Sein Umriss, in Teilen seiner eigenen halben Länge und Höhe. */
const BODY = {
  /** Die Schnauze steht als eigener Keil vor dem Kopf. */
  beak: 1.18,
  beakDown: 0.2,
  beakFrom: 0.68,
  beakUp: 0.08,
  beakTo: 0.72,
  beakLow: 0.44,
  beakRound: 1.02,
  /** Wo der Kopf selbst aufhört. */
  jawAt: 0.76,
  jawDown: 0.46,
  /** Die Melone: wo die Stirn ansteigt und wo sie am höchsten ist. */
  browAt: 0.76,
  browUp: 0.12,
  meloneAt: 0.52,
  meloneUp: 0.66,
  /** Der Rücken bis zum Schwanzstiel. */
  backAt: 0.2,
  backUp: 1.08,
  backTo: 0.3,
  backHigh: 0.92,
  stemAt: 0.75,
  stemUp: 0.78,
  stem: 0.95,
  stemHigh: 0.18,
  /** Der Bauch zurück zum Kiefer. */
  bellyBack: 0.85,
  bellyDown: 0.3,
  bellyAt: 0.45,
  bellyLow: 0.55,
  bellyMid: 0.98,
  bellyTo: 0.58,
  bellyUp: 0.62,
  /** Der helle Bauchfleck. */
  patchAt: 0.05,
  patchDown: 0.62,
  patchLong: 0.66,
  patchHigh: 0.4,
  /** Die Rückenflosse sitzt vor dem Reiter, nach hinten gebogen. */
  finFrom: -0.2,
  finUp: 0.95,
  finTipAt: 0.26,
  finTipUp: 2.1,
  finBackAt: 0.12,
  finBackUp: 0.92,
  finBend: 0.02,
  finBendUp: 1.45,
  /** Die Brustflosse darunter. */
  armAt: 0.28,
  armDown: 0.5,
  armTip: 0.22,
  armTipDown: 1.55,
  armBack: 0.5,
  armLow: 1.0,
  /** Die Fluke hinten. */
  fluke: 0.9,
  flukeOut: 1.28,
  flukeHigh: 0.9,
  flukeIn: 1.34,
  flukeLow: 0.1,
  flukeBack: 0.68,
  flukeBow: 0.85,
  /** Auge, Lächeln und Atemloch. */
  eyeAt: 0.52,
  eyeUp: 0.42,
  eye: 0.05,
  mouthMid: 0.92,
  mouthTo: 0.6,
  mouthDown: 0.42,
  curlAt: 0.52,
  curlUp: 0.22,
  blow: 0.18,
  blowUp: 1.0,
} as const;

/** Und die Maße des Reiters, in Teilen seiner eigenen Höhe. */
const RIDER = {
  /** Wo er sitzt: wie weit hinter der Mitte und wie hoch er ist. */
  at: 0.3,
  up: 0.95,
  tall: 0.95,
  line: 0.05,
  /** Der Rumpf: wie breit, wie hoch und wie weit nach vorn geneigt. */
  bodyWide: 0.3,
  bodyHigh: 0.42,
  lean: 0.1,
  /** Die Hose. */
  shortsWide: 0.4,
  shortsHigh: 0.26,
  /** Das Bein, das man sieht: Knie und Fuß. */
  kneeAt: 0.34,
  kneeDown: 0.3,
  footAt: 0.44,
  footDown: 0.62,
  leg: 0.12,
  /** Der Arm am Hals und der, den er hochreißt. */
  holdAt: 0.42,
  holdDown: 0.18,
  wavesUp: 0.52,
  wavesOut: 0.46,
  arm: 0.1,
  hand: 0.09,
  /** Kopf und Haar. */
  head: 0.17,
  headUp: 0.62,
  hairUp: 0.14,
  hairWide: 1.25,
  mane: 0.5,
  maneBack: 0.5,
} as const;

/**
 * Zeichnet den Delfin mit dem Jungen auf dem Rücken.
 *
 * @param ctx - die Zeichenfläche
 * @param x - die linke Kante seines Feldes im Bild
 * @param y - und dessen obere Kante
 * @param time - die Uhr des Tauchgangs, damit er auf und ab schwimmt
 * @remarks
 * Der Reiter ist nicht Beiwerk: Ein Delfin allein ist ein Tier wie die
 * anderen im Spiel. Erst der Junge, der sich festhält und den freien Arm
 * hochreißt, macht daraus den, den man kennt.
 */
export function drawFlipper(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const middle = x + CELL * HALF;
  const line = y + CELL * HALF - CELL * FLIP.up;
  const swing = Math.sin(time * FLIP.pace) * CELL * FLIP.bob;
  const long = CELL * FLIP.long;
  const high = CELL * FLIP.high;

  dolphin(ctx, middle, line + swing, long, high);
  rider(
    ctx,
    middle - long * RIDER.at,
    line + swing - high * RIDER.up,
    CELL * RIDER.tall,
  );
}

/** Der Delfin selbst, von der Seite und nach rechts gewandt. */
function dolphin(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  long: number,
  high: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = DOLPHIN.line;
  ctx.lineWidth = long * FLIP.line;

  // Die Fluke hinten, hinter dem Körper.
  ctx.fillStyle = DOLPHIN.back;
  for (const way of WAYS) {
    ctx.beginPath();
    ctx.moveTo(-long * BODY.fluke, 0);
    ctx.quadraticCurveTo(
      -long * BODY.flukeIn,
      way * high * BODY.flukeLow,
      -long * BODY.flukeOut,
      way * high * BODY.flukeHigh,
    );
    ctx.quadraticCurveTo(
      -long * BODY.flukeBack,
      way * high * BODY.flukeBow,
      -long * BODY.fluke * HALF,
      0,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Die Brustflosse, ebenfalls hinter dem Körper.
  ctx.fillStyle = DOLPHIN.backDark;
  ctx.beginPath();
  ctx.moveTo(long * BODY.armAt, high * BODY.armDown);
  ctx.quadraticCurveTo(
    0,
    high * BODY.armLow,
    -long * BODY.armTip,
    high * BODY.armTipDown,
  );
  ctx.quadraticCurveTo(
    0,
    high * BODY.armLow * HALF,
    long * BODY.armBack,
    high * BODY.armDown,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Die Rückenflosse, nach hinten gebogen wie eine Sichel.
  ctx.fillStyle = DOLPHIN.back;
  ctx.beginPath();
  ctx.moveTo(-long * BODY.finFrom, -high * BODY.finUp);
  ctx.quadraticCurveTo(
    -long * BODY.finBend,
    -high * BODY.finTipUp,
    -long * BODY.finTipAt,
    -high * BODY.finTipUp,
  );
  ctx.quadraticCurveTo(
    -long * BODY.finBend,
    -high * BODY.finBendUp,
    -long * BODY.finBackAt,
    -high * BODY.finBackUp,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Der Körper: Schnauze, Melone, Rücken, Schwanzstiel, Bauch, Kiefer.
  ctx.beginPath();
  ctx.moveTo(long * BODY.jawAt, high * BODY.jawDown);
  ctx.quadraticCurveTo(
    long * BODY.browAt,
    -high * BODY.browUp,
    long * BODY.meloneAt,
    -high * BODY.meloneUp,
  );
  ctx.quadraticCurveTo(
    long * BODY.backAt,
    -high * BODY.backUp,
    -long * BODY.backTo,
    -high * BODY.backHigh,
  );
  ctx.quadraticCurveTo(
    -long * BODY.stemAt,
    -high * BODY.stemUp,
    -long * BODY.stem,
    -high * BODY.stemHigh,
  );
  ctx.quadraticCurveTo(
    -long * BODY.bellyBack,
    high * BODY.bellyDown,
    -long * BODY.bellyAt,
    high * BODY.bellyLow,
  );
  ctx.quadraticCurveTo(
    0,
    high * BODY.bellyMid,
    long * BODY.bellyTo,
    high * BODY.bellyUp,
  );
  ctx.quadraticCurveTo(
    long * BODY.bellyTo,
    high * BODY.jawDown,
    long * BODY.jawAt,
    high * BODY.jawDown,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Die Schnauze davor: schmal, mit abgerundeter Spitze.
  ctx.beginPath();
  ctx.moveTo(long * BODY.beakFrom, -high * BODY.beakUp);
  ctx.quadraticCurveTo(
    long * BODY.beakRound,
    -high * BODY.beakUp,
    long * BODY.beak,
    high * BODY.beakDown,
  );
  ctx.quadraticCurveTo(
    long * BODY.beakRound,
    high * BODY.beakLow,
    long * BODY.beakTo,
    high * BODY.beakLow,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Der helle Bauch, am Körper abgeschnitten.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = DOLPHIN.belly;
  ctx.beginPath();
  ctx.ellipse(
    long * BODY.patchAt,
    high * BODY.patchDown,
    long * BODY.patchLong,
    high * BODY.patchHigh,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();

  // Das Lächeln läuft von der Schnauzenspitze nach hinten und kringelt sich.
  ctx.strokeStyle = DOLPHIN.mouth;
  ctx.lineWidth = long * FLIP.line;
  ctx.beginPath();
  ctx.moveTo(long * BODY.beak, high * BODY.beakDown);
  ctx.quadraticCurveTo(
    long * BODY.mouthMid,
    high * BODY.mouthDown,
    long * BODY.mouthTo,
    high * BODY.mouthDown,
  );
  ctx.quadraticCurveTo(
    long * BODY.curlAt,
    high * BODY.mouthDown,
    long * BODY.curlAt,
    high * BODY.curlUp,
  );
  ctx.stroke();

  // Das Atemloch und das Auge.
  ctx.beginPath();
  ctx.moveTo(long * BODY.blow, -high * BODY.blowUp);
  ctx.lineTo(long * BODY.blow * HALF, -high * BODY.blowUp);
  ctx.stroke();
  ctx.fillStyle = DOLPHIN.line;
  ctx.beginPath();
  ctx.arc(
    long * BODY.eyeAt,
    -high * BODY.eyeUp,
    long * BODY.eye,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}

/** Der Junge darauf: ein Bein zu sehen, eine Hand am Hals, eine in der Höhe. */
function rider(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  tall: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = tall * RIDER.line;
  ctx.lineCap = "round";

  // Das Bein, vom Sitz über das Knie zum Fuß.
  ctx.strokeStyle = DOLPHIN.skin;
  ctx.lineWidth = tall * RIDER.leg;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(
    tall * RIDER.kneeAt,
    tall * RIDER.kneeDown,
    tall * RIDER.footAt,
    tall * RIDER.footDown,
  );
  ctx.stroke();

  // Die Hose.
  ctx.fillStyle = DOLPHIN.shorts;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    tall * RIDER.shortsWide * HALF,
    tall * RIDER.shortsHigh * HALF,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Der Rumpf, leicht nach vorn geneigt.
  const neck = -tall * RIDER.bodyHigh;
  ctx.fillStyle = DOLPHIN.skin;
  ctx.beginPath();
  ctx.moveTo(-tall * RIDER.bodyWide * HALF, 0);
  ctx.quadraticCurveTo(
    -tall * RIDER.bodyWide * HALF,
    neck,
    tall * RIDER.lean,
    neck,
  );
  ctx.lineTo(tall * (RIDER.lean + RIDER.bodyWide), neck);
  ctx.quadraticCurveTo(
    tall * RIDER.bodyWide,
    0,
    tall * RIDER.bodyWide * HALF,
    0,
  );
  ctx.closePath();
  ctx.fill();

  // Die Arme: einer hält sich am Hals fest, der andere geht hoch.
  ctx.strokeStyle = DOLPHIN.skinDark;
  ctx.lineWidth = tall * RIDER.arm;
  ctx.beginPath();
  ctx.moveTo(tall * RIDER.lean, neck);
  ctx.quadraticCurveTo(
    tall * RIDER.holdAt,
    neck,
    tall * RIDER.holdAt,
    tall * RIDER.holdDown,
  );
  ctx.stroke();

  ctx.strokeStyle = DOLPHIN.skin;
  ctx.beginPath();
  ctx.moveTo(0, neck);
  ctx.quadraticCurveTo(
    -tall * RIDER.wavesOut,
    neck,
    -tall * RIDER.wavesOut,
    neck - tall * RIDER.wavesUp,
  );
  ctx.stroke();
  ctx.fillStyle = DOLPHIN.skin;
  ctx.beginPath();
  ctx.arc(
    -tall * RIDER.wavesOut,
    neck - tall * RIDER.wavesUp,
    tall * RIDER.hand,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Kopf und Haar.
  const head = neck - tall * RIDER.headUp * HALF;
  ctx.beginPath();
  ctx.arc(tall * RIDER.lean, head, tall * RIDER.head, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = DOLPHIN.hair;
  ctx.beginPath();
  ctx.ellipse(
    tall * RIDER.lean,
    head - tall * RIDER.hairUp,
    tall * RIDER.head * RIDER.hairWide,
    tall * RIDER.head,
    0,
    Math.PI,
    0,
  );
  ctx.fill();
  ctx.fillStyle = DOLPHIN.hairDark;
  ctx.beginPath();
  ctx.moveTo(tall * (RIDER.lean - RIDER.head), head - tall * RIDER.hairUp);
  ctx.quadraticCurveTo(
    tall * (RIDER.lean - RIDER.head * RIDER.hairWide),
    head + tall * RIDER.mane,
    tall * (RIDER.lean - RIDER.head * RIDER.maneBack),
    head + tall * RIDER.mane,
  );
  ctx.quadraticCurveTo(
    tall * (RIDER.lean - RIDER.head * HALF),
    head,
    tall * RIDER.lean,
    head - tall * RIDER.hairUp,
  );
  ctx.closePath();
  ctx.fill();
  ctx.lineCap = "butt";
  ctx.restore();
}

/** Die Farben der Meerjungfrau und ihrer Muschel. */
const MERMAID = {
  shell: "#f6dbe6",
  shellDark: "#d3a8bf",
  shellRib: "rgba(120,70,100,0.35)",
  skin: "#f8cba4",
  skinDark: "#dba97f",
  hair: "#d83c16",
  hairLight: "#f36a3c",
  top: "#8d6fc1",
  topDark: "#5f4a8c",
  tail: "#55bb80",
  tailDark: "#2f8b58",
  fin: "#9adcc8",
  line: "rgba(28,52,60,0.55)",
} as const;

/** Die Maße der Muschel und ihrer Bewohnerin, in Kursfeldbreiten. */
const MAID = {
  /** Die Muschel dahinter: wie breit, wie hoch, aus wie vielen Rippen. */
  shellWide: 1.1,
  shellHigh: 0.95,
  ribs: 9,
  ribLine: 0.04,
  scallop: 0.07,
  /** Die Meerjungfrau davor. */
  tall: 1.7,
  /** Wie weit ihr Haar im Wasser weht und wie schnell. */
  sway: 0.05,
  pace: 0.9,
} as const;

/** Ihre eigenen Maße, in Teilen ihrer Höhe. */
const HER = {
  line: 0.025,
  /** Der Schwanz als Schlauch: wie dick und wohin er schwingt. */
  thick: 0.2,
  hip: 0.42,
  bendAt: 0.16,
  bendDown: 0.08,
  outAt: 0.42,
  outDown: 0.05,
  tipAt: 0.46,
  tipUp: 0.18,
  scales: 3,
  /** Die Flosse am Ende: wie weit sie ausschlägt. */
  finOut: 0.3,
  finUp: 0.42,
  finDown: 0.04,
  /** Der Rumpf von der Hüfte bis zu den Schultern. */
  waist: 0.46,
  waistWide: 0.09,
  chest: 0.64,
  chestWide: 0.075,
  /** Das Muscheloberteil. */
  cup: 0.055,
  cupApart: 0.055,
  cupAt: 0.57,
  /** Die Arme. */
  arm: 0.04,
  armOut: 0.17,
  armDown: 0.48,
  /** Kopf und Haar. */
  head: 0.095,
  headUp: 0.8,
  hairWide: 0.2,
  hairDown: 0.3,
  hairBack: 0.26,
  strandOut: 0.12,
  strandDown: 0.5,
} as const;

/**
 * Zeichnet die Meerjungfrau in ihrer Muschel.
 *
 * @param ctx - die Zeichenfläche
 * @param x - die linke Kante ihres Feldes im Bild
 * @param y - und dessen obere Kante
 * @param time - die Uhr des Tauchgangs, damit ihr Haar im Wasser steht
 * @remarks
 * Die Muschel steht hinter ihr wie eine Lehne - sie ist der Grund, warum die
 * Stelle schon von weitem ein Ort ist und nicht erst, wenn man nah genug für
 * ein Gesicht ist.
 */
export function drawArielle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const foot = y + CELL;
  const middle = x + CELL * HALF;

  shell(ctx, middle, foot, CELL * MAID.shellWide, CELL * MAID.shellHigh);
  mermaid(ctx, middle, foot, CELL * MAID.tall, time);
}

/** Die aufgeklappte Muschel hinter ihr. */
function shell(
  ctx: CanvasRenderingContext2D,
  middle: number,
  foot: number,
  wide: number,
  high: number,
): void {
  // Der Fächer, mit gewelltem Rand.
  ctx.fillStyle = MERMAID.shell;
  ctx.beginPath();
  ctx.moveTo(middle - wide, foot);
  for (let rib = 0; rib <= MAID.ribs; rib += 1) {
    const share = rib / MAID.ribs;
    const turn = Math.PI * (1 + share);
    const bulge = 1 + Math.sin(share * Math.PI * MAID.ribs) * MAID.scallop;
    ctx.lineTo(
      middle + Math.cos(turn) * wide * bulge,
      foot + Math.sin(turn) * high * bulge,
    );
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = MERMAID.shellDark;
  ctx.lineWidth = wide * MAID.ribLine;
  ctx.stroke();

  // Die Rippen, alle aus demselben Scharnier.
  ctx.strokeStyle = MERMAID.shellRib;
  for (let rib = 1; rib < MAID.ribs; rib += 1) {
    const turn = Math.PI * (1 + rib / MAID.ribs);
    ctx.beginPath();
    ctx.moveTo(middle, foot);
    ctx.lineTo(middle + Math.cos(turn) * wide, foot + Math.sin(turn) * high);
    ctx.stroke();
  }
}

/** Und sie selbst, davor. */
function mermaid(
  ctx: CanvasRenderingContext2D,
  middle: number,
  foot: number,
  tall: number,
  time: number,
): void {
  const sway = Math.sin(time * MAID.pace) * tall * MAID.sway;
  ctx.save();
  ctx.translate(middle, foot);

  tail(ctx, tall);
  // Das Haar liegt hinter ihr, sonst deckt es zu, was es umrahmen soll.
  mane(ctx, tall, sway);

  // Der Rumpf: von der Hüfte zur Taille und wieder auseinander.
  ctx.fillStyle = MERMAID.skin;
  ctx.beginPath();
  ctx.moveTo(-tall * HER.chestWide, -tall * HER.hip);
  ctx.quadraticCurveTo(
    -tall * HER.waistWide,
    -tall * HER.waist,
    -tall * HER.chestWide,
    -tall * HER.chest,
  );
  ctx.lineTo(tall * HER.chestWide, -tall * HER.chest);
  ctx.quadraticCurveTo(
    tall * HER.waistWide,
    -tall * HER.waist,
    tall * HER.chestWide,
    -tall * HER.hip,
  );
  ctx.closePath();
  ctx.fill();

  // Die Arme: einer hängt herab, einer liegt auf dem Schwanz.
  ctx.strokeStyle = MERMAID.skin;
  ctx.lineWidth = tall * HER.arm;
  ctx.lineCap = "round";
  for (const way of WAYS) {
    ctx.beginPath();
    ctx.moveTo(way * tall * HER.chestWide, -tall * HER.chest);
    ctx.quadraticCurveTo(
      way * tall * HER.armOut,
      -tall * HER.chest * HALF,
      way * tall * HER.armOut * HALF,
      -tall * HER.armDown,
    );
    ctx.stroke();
  }
  ctx.lineCap = "butt";

  // Das Muscheloberteil.
  ctx.fillStyle = MERMAID.top;
  for (const way of WAYS) {
    ctx.beginPath();
    ctx.arc(
      way * tall * HER.cupApart,
      -tall * HER.cupAt,
      tall * HER.cup,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  face(ctx, tall);
  ctx.restore();
}

/** Der Schwanz: ein Schlauch, der nach rechts ausschwingt, mit Flosse. */
function tail(ctx: CanvasRenderingContext2D, tall: number): void {
  ctx.strokeStyle = MERMAID.tail;
  ctx.lineWidth = tall * HER.thick;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -tall * HER.hip);
  ctx.quadraticCurveTo(
    -tall * HER.bendAt,
    -tall * HER.bendDown * 2,
    tall * HER.bendAt,
    -tall * HER.bendDown,
  );
  ctx.quadraticCurveTo(
    tall * HER.outAt,
    -tall * HER.outDown,
    tall * HER.tipAt,
    -tall * HER.tipUp,
  );
  ctx.stroke();
  ctx.lineCap = "butt";

  // Die Flosse am Ende, zwei Lappen übereinander.
  ctx.fillStyle = MERMAID.fin;
  ctx.strokeStyle = MERMAID.line;
  ctx.lineWidth = tall * HER.line;
  for (const way of WAYS) {
    ctx.beginPath();
    ctx.moveTo(tall * HER.tipAt, -tall * HER.tipUp);
    ctx.quadraticCurveTo(
      tall * (HER.tipAt + HER.finOut),
      -tall * (HER.tipUp + way * HER.finDown),
      tall * (HER.tipAt + HER.finOut),
      -tall * (HER.tipUp + way * HER.finUp),
    );
    ctx.quadraticCurveTo(
      tall * (HER.tipAt + HER.finOut * HALF),
      -tall * HER.tipUp,
      tall * HER.tipAt,
      -tall * HER.tipUp,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Ein paar Schuppenbögen auf dem Schlauch.
  ctx.strokeStyle = MERMAID.tailDark;
  for (let scale = 1; scale <= HER.scales; scale += 1) {
    const share = scale / (HER.scales + 1);
    ctx.beginPath();
    ctx.arc(
      tall * HER.bendAt * share,
      -tall * (HER.hip - share * (HER.hip - HER.bendDown)),
      tall * HER.thick * HALF,
      0,
      Math.PI,
    );
    ctx.stroke();
  }
}

/** Ihr Haar, hinter ihr: eine Masse, die im Wasser steht. */
function mane(ctx: CanvasRenderingContext2D, tall: number, sway: number): void {
  const head = -tall * HER.headUp;
  ctx.fillStyle = MERMAID.hair;
  ctx.beginPath();
  ctx.moveTo(-tall * HER.hairWide + sway, head);
  ctx.quadraticCurveTo(
    -tall * HER.hairBack + sway * 2,
    head + tall * HER.hairDown,
    -tall * HER.strandOut,
    head + tall * HER.strandDown,
  );
  ctx.quadraticCurveTo(
    tall * HER.strandOut,
    head + tall * HER.hairDown,
    tall * HER.hairWide - sway,
    head,
  );
  ctx.quadraticCurveTo(
    0,
    head - tall * HER.head * 2,
    -tall * HER.hairWide,
    head,
  );
  ctx.closePath();
  ctx.fill();
}

/** Und ihr Kopf davor, mit einer Strähne an der Schläfe. */
function face(ctx: CanvasRenderingContext2D, tall: number): void {
  const head = -tall * HER.headUp;
  const size = tall * HER.head;
  ctx.fillStyle = MERMAID.skin;
  ctx.beginPath();
  ctx.arc(0, head, size, 0, Math.PI * 2);
  ctx.fill();

  // Eine runde Kappe über der Stirn statt eines Vorhangs vor dem Gesicht.
  ctx.fillStyle = MERMAID.hairLight;
  ctx.beginPath();
  ctx.arc(0, head, size, Math.PI, 0);
  ctx.quadraticCurveTo(0, head + size * HALF, -size, head);
  ctx.closePath();
  ctx.fill();

  // Und eine Strähne, die an der Schläfe herunterfällt.
  ctx.beginPath();
  ctx.moveTo(-size, head - size * HALF);
  ctx.quadraticCurveTo(
    -size * 2,
    head + tall * HER.hairDown * HALF,
    -tall * HER.strandOut,
    head + tall * HER.hairDown,
  );
  ctx.quadraticCurveTo(-size * HALF, head + size, -size * HALF, head);
  ctx.closePath();
  ctx.fill();
}

/** Die Farben des Geistes - alles grün, alles leuchtet. */
const GHOST = {
  skin: "#3ad83a",
  skinDark: "#17901f",
  edge: "#c8ff7a",
  glow: "rgba(130,255,120,0.7)",
  sash: "#7df6e0",
  blade: "#e2ff96",
  grip: "#1c7a2a",
  eye: "#0c3d12",
  pupil: "#05230a",
  tooth: "#eaffc0",
} as const;

/** Seine Maße, in Vielfachen einer Kursfeldbreite. */
const DUTCH = {
  /** Wie groß er ist, wie weit er über dem Grund schwebt und wie er wabert. */
  tall: 2.0,
  over: 0.2,
  bob: 0.1,
  pace: 0.8,
  /** Wie weit der Schein um ihn herum reicht. */
  blur: 0.28,
  line: 0.02,
} as const;

/** Und seine Teile, in Teilen seiner Höhe. */
const SPOOK = {
  /** Der Schweif unten statt Beinen. */
  waist: 0.42,
  waistWide: 0.12,
  tailWide: 0.18,
  tailCurl: 0.14,
  /** Der Rumpf bis zu den Schultern. */
  shoulder: 0.6,
  shoulderWide: 0.15,
  /** Der Gürtel. */
  sashUp: 0.46,
  sashHigh: 0.05,
  /** Der Arm mit dem Säbel und die Klinge daran. */
  armUp: 0.72,
  handAt: 0.44,
  handUp: 0.92,
  arm: 0.055,
  bladeOut: 0.6,
  bladeUp: 1.16,
  bladeBack: 0.64,
  bladeMid: 1.0,
  bladeWide: 0.1,
  grip: 0.055,
  /** Der Arm mit der Klaue. */
  clawAt: 0.44,
  clawUp: 0.74,
  claw: 0.08,
  claws: 3,
  /** Der Kopf mit dem Bart. */
  head: 0.13,
  headUp: 0.74,
  beardWide: 0.26,
  beardDown: 0.52,
  beardTufts: 5,
  /** Augen, Nase und Mund. */
  eyeApart: 0.05,
  eyeUp: 0.78,
  eye: 0.025,
  browLong: 0.07,
  browUp: 0.82,
  noseDown: 0.72,
  mouthUp: 0.68,
  mouthWide: 0.11,
  mouthHigh: 0.05,
  teeth: 5,
  /** Der Schnurrbart, der zu beiden Seiten absteht. */
  whiskerUp: 0.7,
  whiskerOut: 0.24,
  whiskerWave: 0.05,
  /** Der Dreispitz. */
  hatUp: 0.88,
  hatWide: 0.4,
  hatHigh: 0.18,
  hatHump: 1.7,
  hatDip: 0.2,
  hatBrim: 0.9,
} as const;

/**
 * Zeichnet den grünen Geist, der vor dem Wächter wartet.
 *
 * @param ctx - die Zeichenfläche
 * @param x - die linke Kante seines Feldes im Bild
 * @param y - und dessen obere Kante
 * @param time - die Uhr des Tauchgangs, damit er im Wasser wabert
 * @remarks
 * Das einzige Wesen im Spiel, das selbst Licht macht und trotzdem nichts
 * tut. Genau darin liegt sein Sinn: Wer ihn im Schwarzen auftauchen sieht,
 * hält ihn für den Gegner - und merkt erst beim Vorbeifahren, dass der
 * eigentliche erst noch kommt.
 */
export function drawHollaender(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const middle = x + CELL * HALF;
  const tall = CELL * DUTCH.tall;
  const float = Math.sin(time * DUTCH.pace) * CELL * DUTCH.bob;
  const foot = y + CELL - CELL * DUTCH.over + float;

  ctx.save();
  ctx.translate(middle, foot);
  ctx.shadowColor = GHOST.glow;
  ctx.shadowBlur = CELL * DUTCH.blur;
  ctx.strokeStyle = GHOST.edge;
  ctx.lineWidth = tall * DUTCH.line;

  wisp(ctx, tall, time);
  arms(ctx, tall);
  skull(ctx, tall);
  tricorn(ctx, tall);
  ctx.restore();
}

/** Der Rumpf, der unten in zwei Zipfel ausläuft. */
function wisp(ctx: CanvasRenderingContext2D, tall: number, time: number): void {
  const curl = Math.sin(time * DUTCH.pace * 2) * tall * SPOOK.tailCurl * HALF;
  ctx.fillStyle = GHOST.skin;
  ctx.beginPath();
  ctx.moveTo(-tall * SPOOK.shoulderWide, -tall * SPOOK.shoulder);
  ctx.quadraticCurveTo(
    -tall * SPOOK.waistWide,
    -tall * SPOOK.waist,
    -tall * SPOOK.tailWide,
    -tall * SPOOK.tailCurl,
  );
  ctx.quadraticCurveTo(
    -tall * SPOOK.tailWide,
    curl,
    -tall * SPOOK.waistWide,
    0,
  );
  ctx.quadraticCurveTo(0, -tall * SPOOK.tailCurl, tall * SPOOK.waistWide, 0);
  ctx.quadraticCurveTo(
    tall * SPOOK.tailWide,
    curl,
    tall * SPOOK.tailWide,
    -tall * SPOOK.tailCurl,
  );
  ctx.quadraticCurveTo(
    tall * SPOOK.waistWide,
    -tall * SPOOK.waist,
    tall * SPOOK.shoulderWide,
    -tall * SPOOK.shoulder,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Der Gürtel quer darüber.
  ctx.fillStyle = GHOST.sash;
  ctx.fillRect(
    -tall * SPOOK.waistWide,
    -tall * (SPOOK.sashUp + SPOOK.sashHigh),
    tall * SPOOK.waistWide * 2,
    tall * SPOOK.sashHigh,
  );
}

/** Der eine Arm hält den Säbel, der andere endet in einer Klaue. */
function arms(ctx: CanvasRenderingContext2D, tall: number): void {
  ctx.strokeStyle = GHOST.skin;
  ctx.lineWidth = tall * SPOOK.arm;
  ctx.lineCap = "round";

  // Der Säbelarm, nach oben gerissen.
  ctx.beginPath();
  ctx.moveTo(tall * SPOOK.shoulderWide, -tall * SPOOK.armUp);
  ctx.quadraticCurveTo(
    tall * SPOOK.handAt,
    -tall * SPOOK.armUp,
    tall * SPOOK.handAt,
    -tall * SPOOK.handUp,
  );
  ctx.stroke();

  // Der Arm mit der Klaue.
  ctx.beginPath();
  ctx.moveTo(-tall * SPOOK.shoulderWide, -tall * SPOOK.armUp);
  ctx.quadraticCurveTo(
    -tall * SPOOK.clawAt,
    -tall * SPOOK.armUp,
    -tall * SPOOK.clawAt,
    -tall * SPOOK.clawUp,
  );
  ctx.stroke();

  // Die Klinge: breit am Griff, geschwungen zur Spitze.
  ctx.fillStyle = GHOST.blade;
  ctx.beginPath();
  ctx.moveTo(tall * SPOOK.handAt, -tall * SPOOK.handUp);
  ctx.quadraticCurveTo(
    tall * SPOOK.bladeBack,
    -tall * SPOOK.bladeMid,
    tall * SPOOK.bladeOut,
    -tall * SPOOK.bladeUp,
  );
  ctx.quadraticCurveTo(
    tall * (SPOOK.bladeBack - SPOOK.bladeWide),
    -tall * SPOOK.bladeMid,
    tall * (SPOOK.handAt - SPOOK.bladeWide),
    -tall * SPOOK.handUp,
  );
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = GHOST.edge;
  ctx.lineWidth = tall * DUTCH.line;
  ctx.stroke();

  ctx.fillStyle = GHOST.grip;
  ctx.beginPath();
  ctx.arc(
    tall * SPOOK.handAt,
    -tall * SPOOK.handUp,
    tall * SPOOK.grip,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Die Klaue: eine Faust mit drei kurzen Fingern daran.
  ctx.fillStyle = GHOST.skin;
  ctx.beginPath();
  ctx.arc(
    -tall * SPOOK.clawAt,
    -tall * SPOOK.clawUp,
    tall * SPOOK.claw * HALF,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.strokeStyle = GHOST.blade;
  ctx.lineWidth = tall * SPOOK.arm;
  for (let finger = 0; finger < SPOOK.claws; finger += 1) {
    const share = finger / (SPOOK.claws - 1) - HALF;
    ctx.beginPath();
    ctx.moveTo(-tall * SPOOK.clawAt, -tall * SPOOK.clawUp);
    ctx.quadraticCurveTo(
      -tall * (SPOOK.clawAt + SPOOK.claw * HALF),
      -tall * (SPOOK.clawUp + SPOOK.claw * HALF),
      -tall * (SPOOK.clawAt + SPOOK.claw * (1 - Math.abs(share))),
      -tall * (SPOOK.clawUp + SPOOK.claw + share * SPOOK.claw),
    );
    ctx.stroke();
  }
  ctx.lineCap = "butt";
}

/** Kopf, Bart, Schnurrbart und ein Mund voller Zähne. */
function skull(ctx: CanvasRenderingContext2D, tall: number): void {
  // Der Bart: ein Büschel neben dem anderen, unten spitz zulaufend.
  ctx.fillStyle = GHOST.skinDark;
  ctx.beginPath();
  ctx.moveTo(-tall * SPOOK.beardWide, -tall * SPOOK.headUp);
  for (let tuft = 0; tuft <= SPOOK.beardTufts; tuft += 1) {
    const share = tuft / SPOOK.beardTufts;
    const turn = Math.PI * share;
    ctx.quadraticCurveTo(
      -tall * SPOOK.beardWide * Math.cos(turn - Math.PI / SPOOK.beardTufts),
      -tall * (SPOOK.beardDown - SPOOK.eye * 2),
      -tall * SPOOK.beardWide * Math.cos(turn),
      -tall *
        (SPOOK.headUp - Math.sin(turn) * (SPOOK.headUp - SPOOK.beardDown)),
    );
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Der Kopf darüber, heller als der Bart, damit das Gesicht vorn liegt.
  ctx.fillStyle = GHOST.skin;
  ctx.beginPath();
  ctx.arc(0, -tall * SPOOK.headUp, tall * SPOOK.head, 0, Math.PI * 2);
  ctx.fill();

  // Zwei böse Augen mit Brauen darüber.
  ctx.strokeStyle = GHOST.eye;
  ctx.lineWidth = tall * SPOOK.eye;
  for (const way of WAYS) {
    ctx.fillStyle = GHOST.tooth;
    ctx.beginPath();
    ctx.arc(
      way * tall * SPOOK.eyeApart,
      -tall * SPOOK.eyeUp,
      tall * SPOOK.eye * 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = GHOST.pupil;
    ctx.beginPath();
    ctx.arc(
      way * tall * (SPOOK.eyeApart + SPOOK.eye),
      -tall * SPOOK.eyeUp,
      tall * SPOOK.eye,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(way * tall * SPOOK.eyeApart * HALF, -tall * SPOOK.browUp);
    ctx.lineTo(
      way * tall * (SPOOK.eyeApart + SPOOK.browLong),
      -tall * (SPOOK.browUp - SPOOK.eye * 2),
    );
    ctx.stroke();
  }

  // Die Nase zwischen ihnen.
  ctx.fillStyle = GHOST.skin;
  ctx.beginPath();
  ctx.moveTo(-tall * SPOOK.eye, -tall * SPOOK.eyeUp);
  ctx.lineTo(0, -tall * SPOOK.noseDown);
  ctx.lineTo(tall * SPOOK.eye, -tall * SPOOK.eyeUp);
  ctx.closePath();
  ctx.fill();

  // Der aufgerissene Mund mit den Zähnen.
  ctx.fillStyle = GHOST.eye;
  ctx.beginPath();
  ctx.ellipse(
    0,
    -tall * SPOOK.mouthUp,
    tall * SPOOK.mouthWide,
    tall * SPOOK.mouthHigh,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = GHOST.tooth;
  for (let tooth = 0; tooth < SPOOK.teeth; tooth += 1) {
    const share = tooth / (SPOOK.teeth - 1) - HALF;
    ctx.beginPath();
    ctx.moveTo(
      share * tall * SPOOK.mouthWide * 2,
      -tall * (SPOOK.mouthUp + SPOOK.mouthHigh * HALF),
    );
    ctx.lineTo(
      (share + SPOOK.eye) * tall * SPOOK.mouthWide * 2,
      -tall * (SPOOK.mouthUp + SPOOK.mouthHigh * HALF),
    );
    ctx.lineTo(share * tall * SPOOK.mouthWide * 2, -tall * SPOOK.mouthUp);
    ctx.closePath();
    ctx.fill();
  }

  // Der Schnurrbart, der zu beiden Seiten absteht.
  ctx.strokeStyle = GHOST.skinDark;
  ctx.lineWidth = tall * SPOOK.eye;
  ctx.lineCap = "round";
  for (const way of WAYS) {
    ctx.beginPath();
    ctx.moveTo(way * tall * SPOOK.eye, -tall * SPOOK.whiskerUp);
    ctx.quadraticCurveTo(
      way * tall * SPOOK.whiskerOut * HALF,
      -tall * (SPOOK.whiskerUp - SPOOK.whiskerWave * 2),
      way * tall * SPOOK.whiskerOut,
      -tall * (SPOOK.whiskerUp - SPOOK.whiskerWave),
    );
    ctx.quadraticCurveTo(
      way * tall * (SPOOK.whiskerOut + SPOOK.whiskerWave),
      -tall * SPOOK.whiskerUp,
      way * tall * SPOOK.whiskerOut,
      -tall * (SPOOK.whiskerUp + SPOOK.whiskerWave),
    );
    ctx.stroke();
  }
  ctx.lineCap = "butt";
}

/** Und der Dreispitz obendrauf: zwei Hügel mit einer Kerbe dazwischen. */
function tricorn(ctx: CanvasRenderingContext2D, tall: number): void {
  const brim = -tall * SPOOK.hatUp;
  const wide = tall * SPOOK.hatWide;
  const high = tall * SPOOK.hatHigh;

  ctx.fillStyle = GHOST.skinDark;
  ctx.beginPath();
  ctx.moveTo(-wide, brim);
  ctx.quadraticCurveTo(
    -wide * HALF,
    brim - high * SPOOK.hatHump,
    -wide * SPOOK.hatDip,
    brim - high * HALF,
  );
  ctx.quadraticCurveTo(0, brim, wide * SPOOK.hatDip, brim - high * HALF);
  ctx.quadraticCurveTo(wide * HALF, brim - high * SPOOK.hatHump, wide, brim);
  ctx.quadraticCurveTo(0, brim + high * SPOOK.hatBrim, -wide, brim);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = GHOST.edge;
  ctx.lineWidth = tall * DUTCH.line;
  ctx.stroke();
}
