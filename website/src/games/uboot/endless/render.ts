/**
 * Der Endlosmodus, gezeichnet: eine Kamera, die mitschwimmt.
 *
 * @module
 * @remarks
 * **Der Unterschied zur Kampagne steht in zwei Zeilen Mathematik.** Dort ist
 * der Bildausschnitt das Fenster, und das Boot darf darin herumfahren; hier
 * hängt der Ausschnitt am Boot und die Karte zieht darunter weg - in beide
 * Richtungen, denn hier geht es auch nach unten.
 *
 * Gezeichnet wird mit demselben Strich wie überall im Spiel: dasselbe Boot
 * ({@link ../components/sub}), dieselben Bewohner
 * ({@link ../components/creatures}). Ein Endlosmodus, der aussieht wie ein
 * anderes Spiel, wäre einer.
 */
import {
  drawBeast,
  glowBeast,
  shines,
} from "@/games/uboot/components/creatures";
import { drawSub } from "@/games/uboot/components/sub";
import { BREEDS } from "@/games/uboot/engine/beasts";
import { CELL, VIEW_H, VIEW_W } from "@/games/uboot/engine/types";
import { DEEP_GEAR, depthShare } from "@/games/uboot/endless/engine";
import {
  DEEP_H,
  DEEP_W,
  WATER_LINE,
  type DeepState,
  type Diver,
  type DiverId,
  type Drop,
} from "@/games/uboot/endless/types";
import { isRock, type DeepWorld } from "@/games/uboot/endless/world";
import type { PadView } from "@/games/uboot/hooks/touch-controls";

/** Wie breit und wie hoch das Bild ist - dasselbe Fenster wie die Kampagne. */
export const DEEP_VIEW_W = VIEW_W;
export const DEEP_VIEW_H = VIEW_H;

/** Die Farben des Wassers, von oben nach unten. */
const SEA = {
  sky: "#9fd8f2",
  cloud: "rgba(255,255,255,0.45)",
  foam: "#e8f8ff",
  top: "#1d6ea8",
  mid: "#0d3d68",
  deep: "#04172b",
  rock: "#3b4a57",
  rockLit: "#56697a",
  rockDark: "#232e38",
  rockEdge: "rgba(12,20,28,0.55)",
  grit: "rgba(255,255,255,0.05)",
  shot: "#ffe3a2",
  mine: "#2f3a46",
  mineLamp: "#ff6a4d",
  veil: "rgba(2,8,16,0.97)",
  lamp: "rgba(255,236,180,0.3)",
  arrow: "rgba(255,225,140,0.8)",
  pad: "rgba(255,255,255,0.3)",
  padTip: "rgba(255,255,255,0.65)",
  mark: "rgba(255,255,255,0.75)",
  shield: "rgba(120,220,255,0.75)",
  partner: "rgba(255,255,255,0.6)",
} as const;

/** Die Farben der Gegenstände - eine je Sorte. */
const BOONS: Readonly<
  Record<Drop["kind"], { readonly paint: string; readonly sign: string }>
> = {
  shield: { paint: "#49b6ff", sign: "\u{1F6E1}" },
  rapid: { paint: "#ffc43d", sign: "\u{26A1}" },
  scatter: { paint: "#ff7a59", sign: "\u{2733}" },
  revive: { paint: "#57d98a", sign: "\u{2795}" },
};

/** Die Maße der Zeichnung. */
const LOOK = {
  /** Wie viele Felder über den Rand hinaus gezeichnet werden. */
  edge: 2,
  /** Wie tief es ganz dunkel ist, als Anteil der Tiefe, und ab wo es anfängt. */
  darkFrom: 0.16,
  darkFull: 0.72,
  /** Wie weit der Scheinwerfer leuchtet, in Pixeln. */
  lampNear: 120,
  lampFar: 320,
  lampWide: 0.5,
  /**
   * Das Sonar: wie weit es malt, wie schnell sein Ring läuft, wie breit er ist.
   *
   * @remarks
   * Dieselben Zahlen wie in der Kampagne, denn es ist dasselbe Gerät.
   */
  sonar: 540,
  ping: 260,
  ringWide: 70,
  /** Wie hell eine Umrisslinie zwischen zwei Durchläufen steht, und im Ring. */
  sonarBase: 0.16,
  sonarSweep: 0.55,
  /**
   * Wie stark es im Hellen noch zu sehen ist.
   *
   * @remarks
   * **Von der ersten Sekunde an und nicht erst unten.** Der Schlund fährt mit
   * dem Vollausbau, also ist das Sonar von Anfang an an Bord - und ein Gerät,
   * das erst in der Tiefe angeht, sieht aus wie ein Fehler und nicht wie
   * Ausrüstung. Im Dunkeln wird es von allein kräftiger, weil die Helligkeit
   * an der Tiefe hängt.
   */
  sonarShallow: 0.55,
  /** Wie groß ein Gegenstand ist und wie weit er auf und ab wippt. */
  drop: 11,
  bob: 3,
  /** Wie dick der Schildring um ein Boot liegt. */
  shield: 30,
  /** Die Strichstärken. */
  line: 2,
  thin: 1,
  /** Wie stark ein Feld gegenüber seinem Nachbarn aufhellt oder abdunkelt. */
  grain: 14,
  /** Und wie viele Körner darauf liegen. */
  grits: 3,
  /** Wie lange ein Knall zu sehen ist, in Sekunden. */
  bangLife: 0.55,
  /** Wie lang ein Schuss gezeichnet wird, als Vielfaches der Strichstärke. */
  shotLong: 4,
  /** Ab wie vielen übrigen Bewohnern der Wegweiser erscheint, und wie groß. */
  guideFrom: 4,
  guide: 9,
  guideEdge: 26,
  /** Das Steuerkreuz: wie groß der Ring ist und wie dick der Daumen. */
  padRing: 34,
  padTip: 15,
  /** Und das Zielkreuz. */
  mark: 10,
} as const;

/** Eine Farbe aus ihren drei Zahlen: wo sie stehen und wie weit sie reichen. */
const HEX = { base: 16, most: 0xff, red: 1, green: 3, blue: 5 } as const;

/** Was der Zeichner außer dem Zustand noch wissen muss. */
export type DeepScene = {
  /** Wessen Bild das ist - diesem Boot folgt die Kamera. */
  readonly me: DiverId;
  /** Wohin gerade gezielt wird, in Bildpunkten, oder null. */
  readonly aim: { readonly x: number; readonly y: number } | null;
  /** Das Steuerkreuz unter dem Daumen, oder null. */
  readonly pad?: PadView | null;
};

/**
 * Wo der Bildausschnitt liegt.
 *
 * @param state - die Welt
 * @param me - wessen Boot im Mittelpunkt steht
 * @returns die linke obere Ecke des Ausschnitts, in Weltpixeln
 * @remarks
 * Am Rand der Karte hört der Ausschnitt auf zu folgen: Ein Bild, das zur
 * Hälfte aus dem Nichts hinter der Karte besteht, verrät nur, dass die Karte
 * aufhört.
 */
export function deepCamera(
  state: DeepState,
  me: DiverId,
): { x: number; y: number } {
  const mine = state.divers.find((one) => one.id === me) ?? state.divers[0];
  const x = (mine?.x ?? 0) - DEEP_VIEW_W / 2;
  const y = (mine?.y ?? 0) - DEEP_VIEW_H / 2;
  return {
    x: Math.max(0, Math.min(DEEP_W - DEEP_VIEW_W, x)),
    y: Math.max(0, Math.min(DEEP_H - DEEP_VIEW_H, y)),
  };
}

/**
 * Zeichnet ein Bild des Endlosmodus.
 *
 * @param ctx - die Zeichenfläche
 * @param state - die Welt
 * @param world - die Karte der jetzigen Stufe
 * @param scene - wessen Bild es ist
 */
export function drawDeep(
  ctx: CanvasRenderingContext2D,
  state: DeepState,
  world: DeepWorld,
  scene: DeepScene,
): void {
  const camera = deepCamera(state, scene.me);
  const mine =
    state.divers.find((one) => one.id === scene.me) ?? state.divers[0];
  const dark = darkAt(mine?.y ?? WATER_LINE);
  const gone = new Set(state.gone);

  water(ctx, camera);
  terrain(ctx, world, gone, camera);
  loot(ctx, state, camera);
  critters(ctx, state, camera);
  shots(ctx, state, camera);
  boats(ctx, state, camera, scene.me);
  bangs(ctx, state, camera);
  night(ctx, dark);
  if (mine !== undefined) {
    lamp(ctx, mine, camera, dark);
    beacons(ctx, state, camera, dark);
    sonar(ctx, state, world, gone, mine, camera, dark);
    guide(ctx, state, mine, camera);
  }
  // Über allem, was im Wasser liegt: Was man selbst bedient, darf der
  // Schleier nicht fressen.
  cross(ctx, scene.pad ?? null);
  mark(ctx, scene.aim ?? null);
}

/** Das Steuerkreuz unter dem Daumen, wie in der Kampagne. */
function cross(ctx: CanvasRenderingContext2D, pad: PadView | null): void {
  if (pad !== null) {
    ctx.strokeStyle = SEA.pad;
    ctx.lineWidth = LOOK.line;
    ctx.beginPath();
    ctx.arc(pad.baseX, pad.baseY, LOOK.padRing, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = SEA.padTip;
    ctx.beginPath();
    ctx.arc(pad.tipX, pad.tipY, LOOK.padTip, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Und das Zielkreuz dort, wo der Zeiger steht. */
function mark(
  ctx: CanvasRenderingContext2D,
  aim: { readonly x: number; readonly y: number } | null,
): void {
  if (aim !== null) {
    ctx.strokeStyle = SEA.mark;
    ctx.lineWidth = LOOK.thin;
    ctx.beginPath();
    ctx.moveTo(aim.x - LOOK.mark, aim.y);
    ctx.lineTo(aim.x + LOOK.mark, aim.y);
    ctx.moveTo(aim.x, aim.y - LOOK.mark);
    ctx.lineTo(aim.x, aim.y + LOOK.mark);
    ctx.stroke();
  }
}

/** Wie dunkel es in dieser Tiefe ist. */
function darkAt(y: number): number {
  const share = depthShare(y);
  const into = (share - LOOK.darkFrom) / (LOOK.darkFull - LOOK.darkFrom);
  return Math.max(0, Math.min(1, into));
}

/** Das Wasser selbst, nach unten hin schwärzer - und darüber der Himmel. */
function water(
  ctx: CanvasRenderingContext2D,
  camera: { x: number; y: number },
): void {
  const sea = ctx.createLinearGradient(0, -camera.y, 0, DEEP_H - camera.y);
  sea.addColorStop(0, SEA.top);
  sea.addColorStop(LOOK.darkFrom, SEA.mid);
  sea.addColorStop(1, SEA.deep);
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, DEEP_VIEW_W, DEEP_VIEW_H);

  const line = WATER_LINE - camera.y;
  if (line > 0) {
    ctx.fillStyle = SEA.sky;
    ctx.fillRect(0, 0, DEEP_VIEW_W, line);
    ctx.fillStyle = SEA.foam;
    ctx.fillRect(0, line - LOOK.line, DEEP_VIEW_W, LOOK.line * 2);
  }
}

/** Der Fels, Feld für Feld. */
function terrain(
  ctx: CanvasRenderingContext2D,
  world: DeepWorld,
  gone: ReadonlySet<number>,
  camera: { x: number; y: number },
): void {
  const fromCol = Math.floor(camera.x / CELL) - LOOK.edge;
  const toCol = Math.ceil((camera.x + DEEP_VIEW_W) / CELL) + LOOK.edge;
  const fromRow = Math.floor(camera.y / CELL) - LOOK.edge;
  const toRow = Math.ceil((camera.y + DEEP_VIEW_H) / CELL) + LOOK.edge;

  for (let col = fromCol; col <= toCol; col += 1) {
    for (let row = fromRow; row <= toRow; row += 1) {
      const solid =
        isRock(world, col, row) && !gone.has(row * world.cols + col);
      if (solid) {
        stone(ctx, world, gone, col, row, camera);
      }
    }
  }
}

/**
 * Ein Feld Fels.
 *
 * @remarks
 * **Jedes ein bisschen anders.** Die Abweichung kommt aus seiner eigenen
 * Nummer und nicht aus dem Zufall - sie bleibt also über alle Bilder dieselbe,
 * und eine Wand flimmert nicht. Ohne sie ist eine Felswand eine graue Fläche,
 * und eine graue Fläche sieht aus wie ein Fehler im Bild.
 */
function stone(
  ctx: CanvasRenderingContext2D,
  world: DeepWorld,
  gone: ReadonlySet<number>,
  col: number,
  row: number,
  camera: { x: number; y: number },
): void {
  const x = col * CELL - camera.x;
  const y = row * CELL - camera.y;
  const here = (c: number, r: number) =>
    isRock(world, c, r) && !gone.has(r * world.cols + c);
  const shade = ((col * CELL + row * LOOK.grain) % LOOK.grain) - LOOK.grain / 2;

  ctx.fillStyle = mixed(SEA.rock, shade);
  ctx.fillRect(x, y, CELL + 1, CELL + 1);
  ctx.fillStyle = SEA.rockDark;
  ctx.fillRect(
    x,
    y + CELL * (1 - LOOK.darkFrom * 2),
    CELL + 1,
    CELL * LOOK.darkFrom * 2 + 1,
  );

  // Ein paar Körner, damit die Fläche nicht glatt ist.
  ctx.fillStyle = SEA.grit;
  for (let grit = 0; grit < LOOK.grits; grit += 1) {
    const at = (col * LOOK.grain + row * LOOK.grits + grit * CELL) % CELL;
    const down = (row * LOOK.grain + grit * LOOK.grits) % CELL;
    ctx.fillRect(x + at, y + down, LOOK.line, LOOK.line);
  }

  // Die Kanten: hell nach oben, dunkel zu den Seiten - daran sieht man, wo
  // Boden ist und wo eine Wand.
  if (!here(col, row - 1)) {
    ctx.fillStyle = SEA.rockLit;
    ctx.fillRect(x, y, CELL + 1, LOOK.line + 1);
  }
  ctx.fillStyle = SEA.rockEdge;
  if (!here(col - 1, row)) {
    ctx.fillRect(x, y, LOOK.thin + 1, CELL + 1);
  }
  if (!here(col + 1, row)) {
    ctx.fillRect(x + CELL - LOOK.thin, y, LOOK.thin + 1, CELL + 1);
  }
}

/** Eine Farbe, um ein paar Stufen heller oder dunkler. */
function mixed(paint: string, by: number): string {
  const channel = (at: number) => {
    const value = Number.parseInt(paint.slice(at, at + 2), HEX.base) + by;
    return Math.max(0, Math.min(HEX.most, Math.round(value)))
      .toString(HEX.base)
      .padStart(2, "0");
  };
  return `#${channel(HEX.red)}${channel(HEX.green)}${channel(HEX.blue)}`;
}

/** Die Bewohner. */
function critters(
  ctx: CanvasRenderingContext2D,
  state: DeepState,
  camera: { x: number; y: number },
): void {
  for (const beast of state.beasts) {
    const x = beast.x - camera.x;
    const y = beast.y - camera.y;
    if (onScreen(x, y)) {
      drawBeast(ctx, beast, x, y, state.time);
    }
  }
}

/** Und die, die auch im Schwarzen leuchten, noch einmal darüber. */
function beacons(
  ctx: CanvasRenderingContext2D,
  state: DeepState,
  camera: { x: number; y: number },
  dark: number,
): void {
  if (dark > 0) {
    for (const beast of state.beasts) {
      const x = beast.x - camera.x;
      const y = beast.y - camera.y;
      if (shines(beast.kind) && onScreen(x, y)) {
        glowBeast(ctx, beast, x, y, dark);
        drawBeast(ctx, beast, x, y, state.time);
      }
    }
  }
}

/** Was im Wasser liegt und auf jemanden wartet. */
function loot(
  ctx: CanvasRenderingContext2D,
  state: DeepState,
  camera: { x: number; y: number },
): void {
  for (const drop of state.drops) {
    const x = drop.x - camera.x;
    const y = drop.y - camera.y + Math.sin(state.time * 2 + drop.id) * LOOK.bob;
    if (onScreen(x, y)) {
      const look = BOONS[drop.kind];
      ctx.fillStyle = look.paint;
      ctx.beginPath();
      ctx.arc(x, y, LOOK.drop, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = LOOK.line;
      ctx.stroke();
      ctx.fillStyle = "#06202f";
      ctx.font = `${LOOK.drop}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(look.sign, x, y + 1);
    }
  }
}

/** Was unterwegs ist. */
function shots(
  ctx: CanvasRenderingContext2D,
  state: DeepState,
  camera: { x: number; y: number },
): void {
  for (const shot of state.shots) {
    const x = shot.x - camera.x;
    const y = shot.y - camera.y;
    if (onScreen(x, y)) {
      if (shot.kind === "mine") {
        ctx.fillStyle = SEA.mine;
        ctx.beginPath();
        ctx.arc(x, y, LOOK.drop, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = SEA.mineLamp;
        ctx.beginPath();
        ctx.arc(x, y - LOOK.drop, LOOK.ping, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.atan2(shot.vy, shot.vx));
        ctx.fillStyle = SEA.shot;
        ctx.fillRect(
          -LOOK.drop,
          -LOOK.thin * 2,
          LOOK.drop * 2,
          LOOK.thin * LOOK.shotLong,
        );
        ctx.restore();
      }
    }
  }
}

/** Die Boote - das eigene und, im Koop, das andere. */
function boats(
  ctx: CanvasRenderingContext2D,
  state: DeepState,
  camera: { x: number; y: number },
  me: DiverId,
): void {
  for (const diver of state.divers) {
    const x = diver.x - camera.x;
    const y = diver.y - camera.y;
    if (!diver.down && onScreen(x, y)) {
      ctx.save();
      ctx.translate(x, y);
      // **Nach links fährt es gespiegelt.** Gedreht sähe es aus, als läge es
      // auf dem Rücken; gespiegelt sieht es aus, als wäre es umgekehrt.
      ctx.scale(diver.facing < 0 ? -1 : 1, 1);
      drawSub(ctx, {
        x: 0,
        y: 0,
        // Es neigt sich nicht: Das ist in diesem Spiel so beschlossen.
        tilt: 0,
        turns: diver.spin,
        thrust: diver.wash,
      });
      ctx.restore();
      if (state.time < diver.shieldUntil) {
        ctx.strokeStyle = SEA.shield;
        ctx.lineWidth = LOOK.line;
        ctx.beginPath();
        ctx.arc(x, y, LOOK.shield, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (diver.id !== me) {
        // Der Mitfahrer bekommt einen Ring, damit man ihn im Dunkeln findet.
        ctx.strokeStyle = SEA.partner;
        ctx.lineWidth = LOOK.thin;
        ctx.setLineDash([LOOK.drop, LOOK.drop]);
        ctx.beginPath();
        ctx.arc(x, y, LOOK.shield + LOOK.drop, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }
}

/** Die Knalle. */
function bangs(
  ctx: CanvasRenderingContext2D,
  state: DeepState,
  camera: { x: number; y: number },
): void {
  for (const blast of state.blasts) {
    const x = blast.x - camera.x;
    const y = blast.y - camera.y;
    const share = blast.age / LOOK.bangLife;
    if (onScreen(x, y) && share < 1) {
      ctx.strokeStyle = `rgba(255,214,150,${1 - share})`;
      ctx.lineWidth = LOOK.line * 2;
      ctx.beginPath();
      ctx.arc(x, y, (blast.reach + CELL) * share, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

/** Die Dunkelheit, die mit der Tiefe kommt. */
function night(ctx: CanvasRenderingContext2D, dark: number): void {
  if (dark > 0) {
    const veil = ctx.createRadialGradient(
      DEEP_VIEW_W / 2,
      DEEP_VIEW_H / 2,
      LOOK.lampNear * (1 - dark) + LOOK.sonar * (1 - dark),
      DEEP_VIEW_W / 2,
      DEEP_VIEW_H / 2,
      DEEP_VIEW_W,
    );
    veil.addColorStop(0, "rgba(2,8,16,0)");
    veil.addColorStop(1, SEA.veil);
    ctx.fillStyle = veil;
    ctx.globalAlpha = dark;
    ctx.fillRect(0, 0, DEEP_VIEW_W, DEEP_VIEW_H);
    ctx.globalAlpha = 1;
  }
}

/** Der Scheinwerfer, der dorthin leuchtet, wo die Nase hinzeigt. */
function lamp(
  ctx: CanvasRenderingContext2D,
  diver: Diver,
  camera: { x: number; y: number },
  dark: number,
): void {
  if (dark > 0 && DEEP_GEAR.light > 0) {
    const x = diver.x - camera.x;
    const y = diver.y - camera.y;
    const turn = diver.facing < 0 ? Math.PI : 0;
    const cone = ctx.createRadialGradient(x, y, 0, x, y, LOOK.lampFar);
    cone.addColorStop(0, SEA.lamp);
    cone.addColorStop(1, "rgba(255,236,180,0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, LOOK.lampFar, turn - LOOK.lampWide, turn + LOOK.lampWide);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Das Sonar: was da draußen steht, als Umrisse.
 *
 * @remarks
 * **Dasselbe Gerät wie in der Kampagne, also auch derselbe Strich:** gelbe
 * Umrisse, kein zweiter Scheinwerfer. Es sagt, **wo** etwas ist, und nichts
 * darüber, wie es aussieht - das ist der Unterschied zwischen Sehen und
 * Wissen. Am hellsten dort, wo der Ring gerade vorbeiläuft; dazwischen bleibt
 * ein Rest stehen, denn ein Sonar, das zwischen zwei Durchläufen nichts zeigt,
 * kann man nicht fahren.
 *
 * Und es ist von Anfang an da: Hier unten fährt man den Vollausbau, nicht ein
 * Boot, das sich erst etwas verdienen muss.
 */
function sonar(
  ctx: CanvasRenderingContext2D,
  state: DeepState,
  world: DeepWorld,
  gone: ReadonlySet<number>,
  diver: Diver,
  camera: { x: number; y: number },
  dark: number,
): void {
  if (DEEP_GEAR.light > 1) {
    const ring = (state.time * LOOK.ping) % LOOK.sonar;
    const seen = Math.max(LOOK.sonarShallow, dark);
    const fromCol = Math.floor((diver.x - LOOK.sonar) / CELL);
    const toCol = Math.ceil((diver.x + LOOK.sonar) / CELL);
    const fromRow = Math.floor((diver.y - LOOK.sonar) / CELL);
    const toRow = Math.ceil((diver.y + LOOK.sonar) / CELL);
    ctx.lineWidth = LOOK.line;

    // **Was lebt, steht auch auf dem Sonar.** Ein Gerät, das Fels meldet und
    // den Anglerfisch verschweigt, wäre keine Auskunft, sondern eine Falle.
    for (const beast of state.beasts) {
      const x = beast.x - camera.x;
      const y = beast.y - camera.y;
      const away = Math.hypot(beast.x - diver.x, beast.y - diver.y);
      if (away <= LOOK.sonar) {
        ctx.strokeStyle = lit(away, ring, seen);
        ctx.beginPath();
        ctx.arc(x, y, BREEDS[beast.kind].size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    for (let col = fromCol; col <= toCol; col += 1) {
      for (let row = fromRow; row <= toRow; row += 1) {
        const solid =
          isRock(world, col, row) && !gone.has(row * world.cols + col);
        const at = { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
        const away = Math.hypot(at.x - diver.x, at.y - diver.y);
        if (solid && away <= LOOK.sonar) {
          ctx.strokeStyle = lit(away, ring, seen);
          ctx.strokeRect(
            col * CELL - camera.x + 1,
            row * CELL - camera.y + 1,
            CELL - 2,
            CELL - 2,
          );
        }
      }
    }
  }
}

/**
 * Wie hell eine Umrisslinie gerade steht.
 *
 * @param away - wie weit das Ding vom Boot weg ist, in Pixeln
 * @param ring - wo der laufende Ring gerade steht
 * @param seen - wie stark das Sonar hier überhaupt spricht
 * @returns die Farbe der Linie
 * @remarks
 * Gelb, und nicht die Farbe des Wassers: Was das Sonar zeigt, ist kein Licht,
 * sondern eine Auskunft - und die muss sich von allem unterscheiden, was man
 * wirklich sieht.
 */
function lit(away: number, ring: number, seen: number): string {
  const swept = Math.max(0, 1 - Math.abs(away - ring) / LOOK.ringWide);
  return `rgba(255,214,90,${(LOOK.sonarBase + LOOK.sonarSweep * swept) * seen})`;
}

/**
 * Ein Pfeil am Bildrand, wenn nur noch wenige übrig sind.
 *
 * @remarks
 * Die Karte ist groß, und die letzten zwei Bewohner einer Stufe in einer
 * finsteren Ecke zu suchen, ist keine Spannung, sondern Arbeit. Also zeigt das
 * Bild ab vier Übriggebliebenen, wo der nächste steckt - vorher nicht, sonst
 * führte es einen die ganze Stufe an der Hand.
 */
function guide(
  ctx: CanvasRenderingContext2D,
  state: DeepState,
  mine: Diver,
  camera: { x: number; y: number },
): void {
  const few = state.beasts.length > 0 && state.beasts.length <= LOOK.guideFrom;
  if (few) {
    let near = state.beasts[0];
    for (const beast of state.beasts) {
      const closer =
        Math.hypot(beast.x - mine.x, beast.y - mine.y) <
        Math.hypot((near?.x ?? 0) - mine.x, (near?.y ?? 0) - mine.y);
      if (closer) {
        near = beast;
      }
    }
    const x = (near?.x ?? 0) - camera.x;
    const y = (near?.y ?? 0) - camera.y;
    if (near !== undefined && !onScreen(x, y)) {
      const turn = Math.atan2(y - DEEP_VIEW_H / 2, x - DEEP_VIEW_W / 2);
      const at = {
        x:
          DEEP_VIEW_W / 2 + Math.cos(turn) * (DEEP_VIEW_W / 2 - LOOK.guideEdge),
        y:
          DEEP_VIEW_H / 2 + Math.sin(turn) * (DEEP_VIEW_H / 2 - LOOK.guideEdge),
      };
      ctx.save();
      ctx.translate(at.x, at.y);
      ctx.rotate(turn);
      ctx.fillStyle = SEA.arrow;
      ctx.beginPath();
      ctx.moveTo(LOOK.guide, 0);
      ctx.lineTo(-LOOK.guide, -LOOK.guide * HALF_WIDE);
      ctx.lineTo(-LOOK.guide, LOOK.guide * HALF_WIDE);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

/** Wie breit der Pfeil im Verhältnis zu seiner Länge ist. */
const HALF_WIDE = 0.6;

/** Ob ein Punkt überhaupt im Bild liegt. */
function onScreen(x: number, y: number): boolean {
  const room = CELL * LOOK.edge;
  return (
    x > -room && x < DEEP_VIEW_W + room && y > -room && y < DEEP_VIEW_H + room
  );
}
