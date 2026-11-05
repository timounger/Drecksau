/**
 * Drawing part B: the magic school's field, the toy Gilfi throws, the snow
 * angels and their star, the visiting children with their wishes, the
 * contest snowman and the jury's card, the pile of presents and the presents
 * flying on Christmas Eve, the air mail's golden roofs, the concert's
 * lights, Rudolf's nose in the dark with the night stars, shooting stars,
 * fireworks and the camera's flash - and the signs and lines in sharp text.
 *
 * @module
 * @remarks
 * Things on the ground go into the depth-sorted list like the rest of the
 * map; marks on the snow are drawn right after the ground; the lights come
 * after the night's tint; the sky (shooting stars, fireworks) and the flash
 * are drawn in view pixels over everything. All of it is plain shapes or
 * pictures of `extras-2x.png` - cheap enough for every frame.
 */
import { vehicleOf } from "@/games/weihnachtsmann/engine/aboard";
import { mailTenths } from "@/games/weihnachtsmann/engine/airmail";
import { ANGEL_FADE, starShines } from "@/games/weihnachtsmann/engine/angels";
import { CONCERT_SECONDS } from "@/games/weihnachtsmann/engine/concert";
import {
  MAX_STARS,
  PART_BUCKET,
  PART_GREEN_SCARF,
  PART_TOP_HAT,
  SNOWMAN_BALLS,
} from "@/games/weihnachtsmann/engine/contest";
import {
  ANGEL_POINTS,
  BASKETS,
  CONTEST_OBJECTS,
  EXTRA_LABELS,
  EXTRA_SIGNS,
  NIGHT_STARS,
  PILE_SPOTS,
  ROOFS,
  SCHOOL_FIELD,
  STAGE,
  TREE_FOOT,
} from "@/games/weihnachtsmann/engine/extras-data";
import { KID_HEAD } from "@/games/weihnachtsmann/engine/kids";
import { TILE } from "@/games/weihnachtsmann/engine/map";
import {
  FIREWORK_TINTS,
  SPARK_LIFE,
  STAR_SECONDS,
} from "@/games/weihnachtsmann/engine/night-sky";
import {
  NOSE_DARK,
  NOSE_REACH,
  noseLight,
} from "@/games/weihnachtsmann/engine/nightstars";
import { FLASH_SECONDS } from "@/games/weihnachtsmann/engine/photos";
import { GIFT_FLIGHT } from "@/games/weihnachtsmann/engine/presents";
import { TOY_HEIGHT } from "@/games/weihnachtsmann/engine/school";
import { darkness, openAir } from "@/games/weihnachtsmann/engine/sky";
import {
  TOY_KINDS,
  type BigObjectKind,
  type CarryKind,
  type GameMap,
  type GameState,
} from "@/games/weihnachtsmann/engine/types";
import { EXTRA_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { EXTRA_ART, type ExtraArtName } from "./extras-atlas";
import type { GlowFn } from "./render-props";
import { sign } from "./render-town";
import { EFFECTS, OBJECTS, type SpriteRect } from "./sprite-atlas";
import { blit, snap, type Art } from "./sprites";

/** Something to draw, at the depth of its foot line. */
type Drawable = { readonly depth: number; readonly draw: () => void };

/** Draws a speech bubble with sharp text, at canvas px. */
type BubbleFn = (text: string, x: number, y: number) => void;

/** A sheet and a picture on it, for things carried. */
export type CarriedArt = {
  readonly sheet: "world" | "extras";
  readonly rect: SpriteRect;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- sizes, colours,
   offsets and speeds of the drawings, picked by eye */
/** The toys on the world sheet, in the order of the toy kinds. */
const TOY_ART: readonly SpriteRect[] = [
  OBJECTS.toyTeddy,
  OBJECTS.toyTrain,
  OBJECTS.toyDoll,
  OBJECTS.toyBall,
  OBJECTS.toyPresent,
];

/** The wrapped presents by paper. */
const WRAPPED: readonly ExtraArtName[] = [
  "wrapped0",
  "wrapped1",
  "wrapped2",
  "wrapped3",
];

/** The contest's parts as carried, by part number. */
const PART_ART: readonly ExtraArtName[] = [
  "partBallCarry",
  "partNose",
  "partHatTop",
  "partHatBucket",
  "partScarfRed",
  "partScarfGreen",
];

/** The children's pictures by look: front, front step, side, side step. */
const KID_FRAMES: readonly (readonly ExtraArtName[])[] = [0, 1, 2, 3].map(
  (look) =>
    (["Front", "FrontStep", "Side", "SideStep"] as const).map(
      (frame) => `kid${String(look)}${frame}` as ExtraArtName,
    ),
);

/** The colours of the concert's lights. */
const STAGE_LIGHTS: readonly string[] = [
  "255, 90, 90",
  "90, 210, 255",
  "255, 224, 90",
  "192, 112, 255",
  "90, 255, 138",
];

/** The colours of the fireworks. */
const FIREWORK_RGB: readonly string[] = [
  "255, 90, 90",
  "255, 216, 74",
  "90, 210, 255",
  "200, 120, 255",
  "120, 255, 150",
];

/** The order in which the points of the angel star are joined. */
const STAR_ORDER: readonly number[] = [0, 2, 4, 1, 3, 0];

/** How far round the view something may stand and still be drawn, map px. */
const VIEW_SLACK = 48;

/**
 * Marks on the snow, under everything: the magic school's field, the
 * angels with their pegs and the star.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param map - the place on screen
 * @param art - the sheets
 */
export function drawExtrasGround(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  art: Art,
): void {
  if (map.area === "outdoors") {
    if (
      near(state, SCHOOL_FIELD.tx * TILE + 80, SCHOOL_FIELD.ty * TILE + 72, 160)
    ) {
      drawSchoolField(ctx, state);
    }
    if (near(state, 53 * TILE, 85 * TILE, 140)) {
      drawAngels(ctx, state, art);
    }
  }
}

/**
 * Adds the things of part B standing on the ground to what is drawn in depth
 * order: children, presents under the tree, the toy over Gilfi's hand.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param map - the place on screen
 * @param art - the sheets
 * @param items - what is drawn, sorted later
 */
export function collectExtras(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  art: Art,
  items: Drawable[],
): void {
  if (map.area === "outdoors") {
    const extras = state.world.extras;
    for (const kid of extras.kids) {
      items.push({
        depth: kid.y,
        draw: () => {
          drawKid(ctx, state, art, kid);
        },
      });
    }
    const pile = Math.min(state.counts.wrapped, PILE_SPOTS.length);
    for (let k = 0; k < pile; k += 1) {
      const [dx, dy] = PILE_SPOTS[k];
      const x = TREE_FOOT.x * TILE + dx;
      const y = TREE_FOOT.y * TILE + dy + 6;
      items.push({
        depth: y,
        draw: () => {
          const rect = EXTRA_ART[WRAPPED[k % WRAPPED.length]];
          blit(ctx, art.extras, rect, x - rect[2] / 2, y - rect[3]);
        },
      });
    }
    const school = extras.school;
    if (school !== null && school.flight === null) {
      const gilfi = state.chars[school.who];
      items.push({
        depth: gilfi.y + 1,
        draw: () => {
          const side = gilfi.dir === "left" ? -1 : 1;
          const bob = Math.sin(state.time * 4) * 1.5;
          drawToy(
            ctx,
            art,
            school.item,
            gilfi.x + side * 11,
            gilfi.y - 28 + bob,
            state.time,
          );
        },
      });
    }
  }
}

/**
 * What moves on a big picture of part B: the contest snowman on its plot.
 *
 * @param ctx - the buffer, in map px
 * @param art - the sheets
 * @param state - the game
 * @param kind - which picture
 * @param left - its left edge, map px
 * @param bottom - its bottom edge, map px
 */
export function drawExtraProp(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
  kind: BigObjectKind,
  left: number,
  bottom: number,
): void {
  if (kind === "snowmanPlot") {
    drawSnowman(ctx, art, state, left + EXTRA_ART.plot[2] / 2, bottom - 5);
  }
}

/**
 * What hangs over everything: the thrown toy, the children's wishes, the
 * jury's card, presents flying on Christmas Eve and the air mail's roofs.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param art - the sheets
 */
export function drawExtrasAbove(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
): void {
  if (state.viewArea === "outdoors") {
    const extras = state.world.extras;
    const flight = extras.school?.flight ?? null;
    if (flight !== null && extras.school !== null) {
      ctx.fillStyle = "rgba(70, 90, 140, 0.24)";
      ctx.beginPath();
      ctx.ellipse(snap(flight.x), snap(flight.y), 4, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
      drawToy(
        ctx,
        art,
        extras.school.item,
        flight.x,
        flight.y - TOY_HEIGHT,
        state.time,
      );
    }
    for (const kid of extras.kids) {
      if (kid.mode === "wait") {
        drawWish(
          ctx,
          state,
          art,
          kid.x,
          kid.y - KID_HEAD - 4,
          kid.known ? kid.wish : -1,
        );
      }
    }
    drawJuryCard(ctx, state);
    drawEveGifts(ctx, state, art);
    drawRoofs(ctx, state);
  }
}

/**
 * The lights of part B after the night's tint: the concert's beams, the dark
 * corners and Rudolf's nose with the night stars it shows.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 */
export function drawExtrasNight(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  if (state.viewArea === "outdoors") {
    drawConcertLights(ctx, state);
    const dark = darkness(state);
    if (dark >= NOSE_DARK) {
      drawDarkCorners(ctx, state, dark);
    }
  }
}

/**
 * Soft lights of part B at night: the stage's lamps and the gift tree.
 *
 * @param glow - draws one soft light
 * @param state - the game
 */
export function extrasLights(glow: GlowFn, state: GameState): void {
  if (state.viewArea === "outdoors") {
    const stageX = STAGE.tx * TILE;
    const stageY = STAGE.ty * TILE - 16;
    STAGE_LIGHTS.forEach((rgb, k) => {
      glow(stageX + 22 + k * 18, stageY + 14, 12, rgb, 0.35);
    });
    const twinkle = 0.35 + Math.sin(state.time * 3) * 0.1;
    glow(
      TREE_FOOT.x * TILE,
      TREE_FOOT.y * TILE - 70,
      18,
      "255, 230, 120",
      twinkle,
    );
    glow(
      TREE_FOOT.x * TILE,
      TREE_FOOT.y * TILE - 30,
      30,
      "255, 190, 100",
      0.35,
    );
  } else if (
    state.viewArea === "workshop" &&
    state.world.extras.wrapping !== null
  ) {
    glow(15 * TILE, 11 * TILE, 16, "255, 220, 150", 0.4);
  }
}

/**
 * The sky of part B, in view px over everything: a shooting star, the
 * fireworks, and the camera's flash.
 *
 * @param ctx - the buffer, in view px
 * @param state - the game
 */
export function drawExtrasSky(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  const extras = state.world.extras;
  if (openAir(state.viewArea)) {
    const star = extras.shooting;
    if (star !== null && star.time < STAR_SECONDS) {
      drawShootingStar(ctx, star.x, star.y, star.dx, star.dy, star.time);
    }
    drawFireworks(ctx, state);
  }
  if (extras.flash > 0 && extras.shot === null) {
    ctx.fillStyle = `rgba(255, 255, 255, ${String((extras.flash / FLASH_SECONDS) * 0.75)})`;
    ctx.fillRect(0, 0, state.view.w, state.view.h);
  }
}

/**
 * The signs of part B and the children's words, in sharp text.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param scale - canvas pixels per map px
 * @param cx - left of the view, map px
 * @param cy - top of the view, map px
 * @param bubble - draws a speech bubble
 */
export function drawExtrasTexts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
  cx: number,
  cy: number,
  bubble: BubbleFn,
): void {
  const char = state.chars[state.active];
  if (state.fade === null && state.overview === null) {
    if (state.viewArea === "outdoors") {
      for (const kid of state.world.extras.kids) {
        if (kid.say !== null && kid.sayLeft > 0) {
          bubble(
            kid.say,
            (kid.x - cx) * scale,
            (kid.y - KID_HEAD - 30 - cy) * scale,
          );
        }
      }
    }
    const show =
      state.world.extras.concert === null &&
      state.world.extras.eve === null &&
      char.area === state.viewArea &&
      char.altitude < 1 &&
      char.bubble === null &&
      vehicleOf(state, char) === null;
    for (const place of show ? EXTRA_SIGNS : []) {
      const x = place.x * TILE;
      const y = place.y * TILE;
      if (
        place.area === char.area &&
        Math.hypot(char.x - x, char.y - y) < place.near * TILE
      ) {
        const [name, hint] = EXTRA_TEXTS.signs[place.id];
        sign(ctx, name, hint, (x - cx) * scale, (y + 4 - cy) * scale, scale);
      }
    }
  }
}

/**
 * The lines of text at the top for part B: the magic school, the air mail,
 * the contest, the concert, a shooting star, Christmas Eve.
 *
 * @param state - the game
 * @returns the lines, perhaps none
 */
export function extraLines(state: GameState): string[] {
  const lines: string[] = [];
  const extras = state.world.extras;
  const char = state.chars[state.active];
  const school = extras.school;
  if (school !== null) {
    lines.push(
      EXTRA_TEXTS.schoolLine
        .replace("{n}", String(school.hits))
        .replace("{s}", String(Math.max(0, Math.ceil(school.left)))),
    );
  }
  const mail = extras.airMail;
  const tenths = mailTenths(state);
  if (mail !== null && tenths !== null) {
    lines.push(
      EXTRA_TEXTS.mailLine
        .replace("{n}", String(mail.done.size))
        .replace("{of}", String(mail.roofs.length))
        .replace("{t}", `${(tenths / 10).toFixed(1)} s`),
    );
  }
  const snowman = extras.snowman;
  const nearPlot =
    char.area === "outdoors" &&
    Math.hypot(char.x - 17.5 * TILE, char.y - 86 * TILE) < 6 * TILE;
  if (
    nearPlot &&
    snowman.stars === 0 &&
    (snowman.balls > 0 || char.carry?.kind === "snowPart")
  ) {
    const yes = EXTRA_TEXTS.contestYes;
    const no = EXTRA_TEXTS.contestNo;
    lines.push(
      EXTRA_TEXTS.contestLine
        .replace("{balls}", String(snowman.balls))
        .replace("{nose}", snowman.nose ? yes : no)
        .replace("{hat}", snowman.hat > 0 ? yes : no)
        .replace("{scarf}", snowman.scarf > 0 ? yes : no),
    );
  }
  if (extras.concert !== null && state.viewArea === "outdoors") {
    lines.push(EXTRA_TEXTS.concertLine);
  }
  const star = extras.shooting;
  if (star !== null && !star.wished && openAir(state.viewArea)) {
    lines.push(EXTRA_TEXTS.starHint);
  }
  if (extras.eve !== null) {
    lines.push(EXTRA_TEXTS.eveLine);
  }
  return lines;
}

/**
 * The picture of something of part B carried over the head.
 *
 * @param kind - what is carried
 * @param tint - which toy, paper or part
 * @returns the picture, or null for anything else
 */
export function extraCarried(kind: CarryKind, tint: number): CarriedArt | null {
  let result: CarriedArt | null = null;
  switch (kind) {
    case "toy":
      result = { sheet: "world", rect: TOY_ART[tint % TOY_ART.length] };
      break;
    case "wrapped":
      result = {
        sheet: "extras",
        rect: EXTRA_ART[WRAPPED[tint % WRAPPED.length]],
      };
      break;
    case "parcel":
      result = { sheet: "extras", rect: EXTRA_ART.parcel };
      break;
    case "snowPart":
      result = {
        sheet: "extras",
        rect: EXTRA_ART[PART_ART[tint % PART_ART.length]],
      };
      break;
    default:
      result = null;
  }
  return result;
}

/**
 * The angel star and the names of part B on the view from the observatory.
 *
 * @param ctx - the buffer, in view px
 * @param state - the game
 * @param x - left of the map, view px
 * @param y - top of the map, view px
 * @param cell - view px per cell
 */
export function drawOverviewExtras(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  x: number,
  y: number,
  cell: number,
): void {
  const angels = state.world.extras.angels;
  ctx.fillStyle = "#ffffff";
  ANGEL_POINTS.forEach(([px, py], index) => {
    if (angels[index] > 0) {
      ctx.fillRect(x + px * cell - 1, y + py * cell - 1, 2, 2);
    }
  });
  if (starShines(state)) {
    ctx.strokeStyle = "rgba(255, 216, 74, 0.95)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    STAR_ORDER.forEach((index, k) => {
      const [px, py] = ANGEL_POINTS[index];
      if (k === 0) {
        ctx.moveTo(x + px * cell, y + py * cell);
      } else {
        ctx.lineTo(x + px * cell, y + py * cell);
      }
    });
    ctx.stroke();
  }
}

/**
 * The names of part B's places for the view from the observatory.
 *
 * @returns name and cell of each
 */
export function extraLabels(): { name: string; x: number; y: number }[] {
  return EXTRA_LABELS.map((label) => ({
    name: EXTRA_TEXTS.labels[label.id] ?? label.id,
    x: label.x,
    y: label.y,
  }));
}

/** Whether a point is near the view. */
function near(state: GameState, x: number, y: number, reach: number): boolean {
  const { x: cx, y: cy } = state.camera;
  return (
    x > cx - reach - VIEW_SLACK &&
    x < cx + state.view.w + reach + VIEW_SLACK &&
    y > cy - reach - VIEW_SLACK &&
    y < cy + state.view.h + reach + VIEW_SLACK
  );
}

/** The magic school's field: a chalk ring under each basket and the throwing line. */
function drawSchoolField(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(140, 110, 220, 0.45)";
  ctx.lineWidth = 1;
  const school = state.world.extras.school;
  BASKETS.forEach((basket, index) => {
    const x = (basket.tx + 0.5) * TILE;
    const y = (basket.ty + 1) * TILE - 2;
    const lit =
      school !== null && school.flash > 0 && school.flashBasket === index;
    ctx.strokeStyle = lit
      ? "rgba(255, 216, 74, 0.9)"
      : "rgba(140, 110, 220, 0.45)";
    ctx.beginPath();
    ctx.ellipse(x, y, 13, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = "rgba(140, 110, 220, 0.5)";
  ctx.beginPath();
  ctx.moveTo((SCHOOL_FIELD.tx + 0.5) * TILE, 84.6 * TILE);
  ctx.lineTo((SCHOOL_FIELD.tx + SCHOOL_FIELD.w - 1.5) * TILE, 84.6 * TILE);
  ctx.stroke();
  ctx.restore();
}

/** The angels in the snow, the pegs where one is missing, and the star. */
function drawAngels(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
): void {
  const angels = state.world.extras.angels;
  const shines = starShines(state);
  if (shines) {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 216, 74, ${String(0.55 + Math.sin(state.time * 3) * 0.2)})`;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    STAR_ORDER.forEach((index, k) => {
      const [px, py] = ANGEL_POINTS[index];
      if (k === 0) {
        ctx.moveTo(px * TILE, py * TILE);
      } else {
        ctx.lineTo(px * TILE, py * TILE);
      }
    });
    ctx.stroke();
    ctx.restore();
  }
  ANGEL_POINTS.forEach(([px, py], index) => {
    const x = px * TILE;
    const y = py * TILE;
    const left = angels[index];
    if (left > 0) {
      const rect = EXTRA_ART.angelPrint;
      ctx.save();
      ctx.globalAlpha = Math.min(1, left / ANGEL_FADE);
      blit(ctx, art.extras, rect, x - rect[2] / 2, y - rect[3] / 2);
      ctx.restore();
    } else {
      ctx.strokeStyle = "rgba(90, 120, 200, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y, 9, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      const peg = EXTRA_ART.angelPeg;
      blit(ctx, art.extras, peg, x - peg[2] / 2, y - peg[3] + 2);
    }
  });
}

/** A visiting child: waiting, hopping for joy, or walking off. */
function drawKid(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  kid: GameState["world"]["extras"]["kids"][number],
): void {
  const frames = KID_FRAMES[kid.look % KID_FRAMES.length];
  let frame = frames[0];
  let lift = 0;
  if (kid.mode === "leave") {
    frame = frames[Math.floor(state.time * 7) % 2 === 0 ? 2 : 3];
  } else if (kid.mode === "happy") {
    lift = Math.abs(Math.sin(kid.time * 9)) * 4;
  } else if (Math.floor(state.time * 1.5 + kid.spot) % 4 === 0) {
    frame = frames[1];
  }
  const rect = EXTRA_ART[frame];
  ctx.fillStyle = "rgba(70, 90, 140, 0.22)";
  ctx.beginPath();
  ctx.ellipse(snap(kid.x), snap(kid.y - 1), 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  if (kid.mode === "leave" && kid.time > 1.6) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - (kid.time - 1.6) / 0.8);
  }
  blit(
    ctx,
    art.extras,
    rect,
    kid.x - rect[2] / 2,
    kid.y - rect[3] - lift,
    kid.mode === "leave" && kid.dir === "left",
  );
  if (kid.mode === "leave" && kid.time > 1.6) {
    ctx.restore();
  }
}

/** A thought cloud over a child: the toy it wishes for, or a question mark. */
function drawWish(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  x: number,
  y: number,
  wish: number,
): void {
  const cloud = EFFECTS.thought;
  const bob = Math.sin(state.time * 2 + x) * 1;
  const left = x - cloud[2] / 2 + 6;
  const top = y - cloud[3] + bob;
  blit(ctx, art.figures, cloud, left, top);
  if (wish >= 0) {
    const toy = TOY_ART[wish % TOY_ART.length];
    blit(ctx, art.world, toy, left + (cloud[2] - toy[2]) / 2, top + 3);
  } else {
    // A pixel question mark.
    ctx.fillStyle = "#6a4ad8";
    const qx = snap(left + cloud[2] / 2 - 2);
    const qy = snap(top + 3);
    for (const [px, py, w, h] of [
      [1, 0, 3, 1],
      [0, 1, 1, 1],
      [4, 1, 1, 2],
      [3, 3, 1, 1],
      [2, 4, 1, 2],
      [2, 7, 1, 1],
    ] as const) {
      ctx.fillRect(qx + px, qy + py, w, h);
    }
  }
}

/** One of the toys, floating, with a few magic sparks round it. */
function drawToy(
  ctx: CanvasRenderingContext2D,
  art: Art,
  item: number,
  x: number,
  y: number,
  time: number,
): void {
  const rect = TOY_ART[item % TOY_KINDS.length];
  blit(ctx, art.world, rect, x - rect[2] / 2, y - rect[3] / 2);
  ctx.fillStyle = "rgba(220, 180, 255, 0.9)";
  for (let k = 0; k < 3; k += 1) {
    const angle = time * 5 + (k * Math.PI * 2) / 3;
    ctx.fillRect(
      snap(x + Math.cos(angle) * 8),
      snap(y + Math.sin(angle) * 4),
      1,
      1,
    );
  }
}

/** The contest snowman: balls, scarf, nose and hat, as far as built. */
function drawSnowman(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
  x: number,
  base: number,
): void {
  const snowman = state.world.extras.snowman;
  const balls: readonly ExtraArtName[] = [
    "partBallBig",
    "partBallMid",
    "partBallHead",
  ];
  let top = base;
  const tops: number[] = [];
  for (let k = 0; k < Math.min(snowman.balls, SNOWMAN_BALLS); k += 1) {
    const rect = EXTRA_ART[balls[k]];
    const y = top - rect[3] + (k === 0 ? 2 : 4);
    blit(ctx, art.extras, rect, x - rect[2] / 2, y);
    tops.push(y);
    top = y;
  }
  if (snowman.balls >= SNOWMAN_BALLS) {
    const head = tops[2];
    const headRect = EXTRA_ART.partBallHead;
    if (snowman.scarf > 0) {
      const rect =
        EXTRA_ART[
          snowman.scarf === PART_GREEN_SCARF ? "partScarfGreen" : "partScarfRed"
        ];
      blit(ctx, art.extras, rect, x - rect[2] / 2 + 2, head + headRect[3] - 4);
    }
    ctx.fillStyle = "#2a1a24";
    ctx.fillRect(snap(x - 2.5), snap(head + 3), 1, 1);
    ctx.fillRect(snap(x + 1.5), snap(head + 3), 1, 1);
    if (snowman.nose) {
      const rect = EXTRA_ART.partNose;
      blit(ctx, art.extras, rect, x - 0.5, head + 4);
    }
    if (snowman.hat === PART_TOP_HAT || snowman.hat === PART_BUCKET) {
      const rect =
        EXTRA_ART[
          snowman.hat === PART_TOP_HAT ? "partHatTop" : "partHatBucket"
        ];
      blit(ctx, art.extras, rect, x - rect[2] / 2, head - rect[3] + 3);
    }
    // Buttons on the middle ball.
    ctx.fillStyle = "#2a1a24";
    for (let k = 0; k < 3; k += 1) {
      ctx.fillRect(snap(x - 0.5), snap(tops[1] + 4 + k * 3), 1, 1);
    }
  }
}

/** The jury's card with its stars, held up after judging. */
function drawJuryCard(ctx: CanvasRenderingContext2D, state: GameState): void {
  const snowman = state.world.extras.snowman;
  const jury = CONTEST_OBJECTS.find((object) => object.kind === "jury");
  if (snowman.card > 0 && snowman.stars > 0 && jury !== undefined) {
    const x = (jury.tx + 1) * TILE;
    const y = (jury.ty + 1) * TILE - 50 - Math.min(1, snowman.card) * 4;
    const w = MAX_STARS * 8 + 4;
    ctx.fillStyle = "#f8f6f0";
    ctx.fillRect(snap(x - w / 2), snap(y), w, 11);
    ctx.fillStyle = "#2a1a24";
    ctx.fillRect(snap(x - w / 2), snap(y + 11), w, 1);
    for (let k = 0; k < MAX_STARS; k += 1) {
      drawStar(
        ctx,
        x - w / 2 + 6 + k * 8,
        y + 5.5,
        3.5,
        k < snowman.stars ? "#f0b020" : "#c8c0d0",
      );
    }
  }
}

/** A small five-pointed star. */
function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let k = 0; k < 10; k += 1) {
    const radius = k % 2 === 0 ? r : r * 0.45;
    const angle = -Math.PI / 2 + (k * Math.PI) / 5;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (k === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

/** Presents flying from the pile to their owners on Christmas Eve. */
function drawEveGifts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
): void {
  const eve = state.world.extras.eve;
  if (eve !== null) {
    for (const gift of eve.gifts) {
      const to = state.chars[gift.to];
      const t = Math.min(1, gift.age / GIFT_FLIGHT);
      const fromX = TREE_FOOT.x * TILE;
      const fromY = TREE_FOOT.y * TILE;
      const x = fromX + (to.x - fromX) * t;
      const y = fromY + (to.y - 20 - fromY) * t - Math.sin(Math.PI * t) * 30;
      const rect = EXTRA_ART[WRAPPED[gift.paper % WRAPPED.length]];
      blit(ctx, art.extras, rect, x - rect[2] / 2, y - rect[3] / 2);
    }
  }
}

/** The roofs still waiting for air mail: a golden ring and a bobbing parcel. */
function drawRoofs(ctx: CanvasRenderingContext2D, state: GameState): void {
  const mail = state.world.extras.airMail;
  if (mail !== null) {
    const bob = Math.sin(state.time * 4) * 3;
    for (const index of mail.roofs) {
      if (!mail.done.has(index)) {
        const roof = ROOFS[index];
        const x = (roof.tx + roof.w / 2) * TILE;
        const y = (roof.ty + roof.h / 2) * TILE;
        ctx.strokeStyle = `rgba(255, 216, 74, ${String(0.7 + Math.sin(state.time * 6) * 0.2)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(
          x,
          y,
          (roof.w * TILE) / 2 + 4,
          (roof.h * TILE) / 2 + 3,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.fillStyle = "#ffd84a";
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 30 + bob);
        ctx.lineTo(x + 5, y - 30 + bob);
        ctx.lineTo(x, y - 22 + bob);
        ctx.closePath();
        ctx.fill();
        edgeArrow(ctx, state, x, y);
      }
    }
  }
}

/** A golden arrow at the edge of the view pointing to a place out of sight. */
function edgeArrow(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  x: number,
  y: number,
): void {
  const { x: cx, y: cy } = state.camera;
  const { w, h } = state.view;
  const inside = x > cx && x < cx + w && y > cy && y < cy + h;
  if (!inside) {
    const mx = cx + w / 2;
    const my = cy + h / 2;
    const angle = Math.atan2(y - my, x - mx);
    const reach = Math.min(
      Math.abs((w / 2 - 12) / (Math.cos(angle) || 1e-6)),
      Math.abs((h / 2 - 12) / (Math.sin(angle) || 1e-6)),
    );
    const ax = mx + Math.cos(angle) * reach;
    const ay = my + Math.sin(angle) * reach;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(255, 216, 74, 0.9)";
    ctx.strokeStyle = "rgba(90, 60, 10, 0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-4, -5);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

/** The stage's coloured beams sweeping over the crowd while the concert runs. */
function drawConcertLights(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  const concert = state.world.extras.concert;
  if (concert !== null) {
    const fade = Math.min(
      1,
      concert.elapsed,
      CONCERT_SECONDS - concert.elapsed,
    );
    const strength = (0.1 + darkness(state) * 0.12) * fade;
    const left = STAGE.tx * TILE;
    const top = STAGE.ty * TILE - 16;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    STAGE_LIGHTS.forEach((rgb, k) => {
      const x = left + 22 + k * 18;
      const y = top + 14;
      const swing = Math.sin(state.time * (1.6 + k * 0.3) + k * 1.7) * 50;
      const tx = x + swing;
      const ty = y + 90;
      const gradient = ctx.createLinearGradient(x, y, tx, ty);
      gradient.addColorStop(0, `rgba(${rgb}, ${String(strength * 1.6)})`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x - 1.5, y);
      ctx.lineTo(x + 1.5, y);
      ctx.lineTo(tx + 16, ty);
      ctx.lineTo(tx - 16, ty);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }
}

/**
 * The dark corners at night, Rudolf's red light pushing them back, and the
 * night stars only his light shows.
 */
function drawDarkCorners(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  dark: number,
): void {
  const nose = noseLight(state);
  for (const star of NIGHT_STARS) {
    const x = star.x * TILE;
    const y = star.y * TILE;
    if (near(state, x, y, 60)) {
      const lit =
        nose === null
          ? 0
          : Math.max(0, 1 - Math.hypot(nose.x - x, nose.y - y) / NOSE_REACH);
      const shade = ctx.createRadialGradient(x, y, 0, x, y, 56);
      shade.addColorStop(
        0,
        `rgba(4, 6, 24, ${String(0.55 * dark * (1 - lit))})`,
      );
      shade.addColorStop(1, "rgba(4, 6, 24, 0)");
      ctx.fillStyle = shade;
      ctx.fillRect(x - 56, y - 56, 112, 112);
      if (lit > 0 && !state.progress.nightStars.has(star.id)) {
        const twinkle = 0.75 + Math.sin(state.time * 5 + x) * 0.25;
        ctx.save();
        ctx.globalAlpha = Math.min(1, lit * 1.8) * twinkle;
        const halo = ctx.createRadialGradient(x, y - 4, 0, x, y - 4, 10);
        halo.addColorStop(0, "rgba(255, 244, 170, 0.8)");
        halo.addColorStop(1, "rgba(255, 244, 170, 0)");
        ctx.fillStyle = halo;
        ctx.fillRect(x - 10, y - 14, 20, 20);
        drawStar(ctx, x, y - 4 + Math.sin(state.time * 2) * 1, 4, "#fff2a0");
        ctx.restore();
      }
    }
  }
  if (nose !== null) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const light = ctx.createRadialGradient(
      nose.x,
      nose.y,
      0,
      nose.x,
      nose.y,
      NOSE_REACH,
    );
    light.addColorStop(0, `rgba(255, 90, 70, ${String(0.42 * dark)})`);
    light.addColorStop(0.35, `rgba(255, 120, 90, ${String(0.2 * dark)})`);
    light.addColorStop(1, "rgba(255, 120, 90, 0)");
    ctx.fillStyle = light;
    ctx.fillRect(
      nose.x - NOSE_REACH,
      nose.y - NOSE_REACH,
      NOSE_REACH * 2,
      NOSE_REACH * 2,
    );
    ctx.restore();
  }
}

/** A shooting star: a bright head and a fading tail. */
function drawShootingStar(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  dx: number,
  dy: number,
  time: number,
): void {
  const x = x0 + dx * time;
  const y = y0 + dy * time;
  const length = Math.hypot(dx, dy);
  const tail = 48;
  const tx = x - (dx / length) * tail;
  const ty = y - (dy / length) * tail;
  const fade = Math.min(1, time * 4, (STAR_SECONDS - time) * 3);
  const gradient = ctx.createLinearGradient(x, y, tx, ty);
  gradient.addColorStop(0, `rgba(255, 250, 220, ${String(fade)})`);
  gradient.addColorStop(1, "rgba(160, 190, 255, 0)");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 7);
  glow.addColorStop(0, `rgba(255, 250, 220, ${String(fade * 0.8)})`);
  glow.addColorStop(1, "rgba(255, 250, 220, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - 7, y - 7, 14, 14);
  ctx.fillStyle = `rgba(255, 255, 240, ${String(fade)})`;
  ctx.fillRect(x - 1, y - 1, 2, 2);
}

/** Rockets and sparks over the land. */
function drawFireworks(ctx: CanvasRenderingContext2D, state: GameState): void {
  const fireworks = state.world.extras.fireworks;
  if (fireworks.rockets.length > 0 || fireworks.sparks.length > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const rocket of fireworks.rockets) {
      ctx.fillStyle = "rgba(255, 230, 180, 0.9)";
      ctx.fillRect(rocket.x - 0.5, rocket.y, 1, 2);
      ctx.fillStyle = "rgba(255, 160, 80, 0.4)";
      ctx.fillRect(rocket.x - 0.5, rocket.y + 2, 1, 5);
    }
    ctx.lineWidth = 1;
    for (const spark of fireworks.sparks) {
      const life = 1 - spark.age / SPARK_LIFE;
      const rgb = FIREWORK_RGB[spark.tint % FIREWORK_TINTS];
      ctx.strokeStyle = `rgba(${rgb}, ${String(life * 0.6)})`;
      ctx.beginPath();
      ctx.moveTo(spark.x, spark.y);
      ctx.lineTo(spark.x - spark.vx * 0.12, spark.y - spark.vy * 0.12);
      ctx.stroke();
      const size = spark.age < 0.5 ? 2 : 1.5;
      ctx.fillStyle = `rgba(${rgb}, ${String(life)})`;
      ctx.fillRect(spark.x - size / 2, spark.y - size / 2, size, size);
      if (spark.age < 0.15) {
        // The flash of the burst, from its first sparks.
        ctx.fillStyle = `rgba(255, 250, 230, ${String(0.12 * (1 - spark.age / 0.15))})`;
        ctx.fillRect(spark.x - 3, spark.y - 3, 6, 6);
      }
    }
    ctx.restore();
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
