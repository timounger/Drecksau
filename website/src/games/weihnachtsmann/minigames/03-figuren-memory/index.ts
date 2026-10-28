/**
 * Türchen 3 - Figuren-Memory: twelve cards on the workshop table, six pairs
 * of the cast; turn two at a time and find every pair before time is up.
 *
 * @module
 * @remarks
 * At the start all cards show their faces for {@link PEEK} seconds. A pair
 * stays open; two different cards turn back after a short look.
 */
import {
  CHARACTER_IDS,
  type CharacterId,
} from "@/games/weihnachtsmann/engine/types";
import { CHARACTER_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import {
  drawFigure,
  drawGlow,
  drawHud,
  drawSprite,
  inside,
  loadSheet,
  type Box,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom } from "../kit/random";
import {
  MINI_W,
  type MiniDraw,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES } from "./sprites";

/** Pairs on the table. */
const PAIRS = 6;

/** Cards per row (three rows of four). */
const COLUMNS = 4;

/** A found pair glows: pulse speed (radians per second) and strength range. */
const GLOW_PULSE = 4;
const GLOW_LOW = 0.1;
const GLOW_HIGH = 0.3;

/** Size of a card and the gap between two, logical px. */
const CARD_W = 40;
const CARD_H = 48;
const GAP = 6;

/** Top of the grid, logical px. */
const TOP = 20;

/** Seconds on the clock. */
const TIME = 75;

/** Seconds all faces show at the start. */
const PEEK = 2.2;

/** Seconds two different cards stay open. */
const LOOK = 0.8;

/** Turning speed: whole turns per second. */
const TURN = 5;

/** Where the figure's feet stand on a card, from its top, logical px. */
const FEET = 36;

/** Size of the name under the figure, logical px. */
const NAME_SIZE = 5;

/** Names longer than this get smaller letters, so they fit the card. */
const LONG_NAME = 11;
const NAME_SMALL = 3.8;

/** Where the name sits on a card, from its top, logical px. */
const NAME_Y = 43;

/** Pops of a found pair. */
const PAIR_BURST = 18;

/** One card. */
type Card = {
  readonly who: CharacterId;
  readonly box: Box;
  /** Whether it should show its face. */
  up: boolean;
  /** How far it is turned, 0 (back) to 1 (face). */
  turn: number;
  matched: boolean;
};

/** The minigame behind gate 3. */
export const GAME: MiniGame = {
  number: 3,
  id: "figuren-memory",
  title: "Figuren-Memory",
  instructions: [
    "Auf dem Tisch liegen zwölf Karten - immer zwei zeigen dieselbe Figur.",
    `Dreh zwei Karten um. Passen sie, bleiben sie offen. Finde alle ${String(PAIRS)} Paare, bevor die Zeit abläuft.`,
    "Am Anfang darfst du kurz schummeln: Alle Karten liegen offen.",
  ],
  controls:
    "Karte anklicken oder antippen - oder mit den Pfeilen wählen und Leertaste.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const cast = random.shuffle(CHARACTER_IDS).slice(0, PAIRS);
  const width = COLUMNS * CARD_W + (COLUMNS - 1) * GAP;
  const left = (MINI_W - width) / 2;
  const cards: Card[] = random
    .shuffle([...cast, ...cast])
    .map((who, index) => ({
      who,
      box: {
        x: left + (index % COLUMNS) * (CARD_W + GAP),
        y: TOP + Math.floor(index / COLUMNS) * (CARD_H + GAP),
        w: CARD_W,
        h: CARD_H,
      },
      up: true,
      turn: 1,
      matched: false,
    }));
  let cursor = 0;
  let clock = 0;
  let lookLeft = 0;
  let timeLeft = TIME;
  let moves = 0;
  let status: MiniStatus = "running";

  const open = () => cards.filter((card) => card.up && !card.matched);

  const flip = (card: Card) => {
    if (!card.up && !card.matched && open().length < 2 && lookLeft <= 0) {
      card.up = true;
      sound("click");
      const pair = open();
      if (pair.length === 2) {
        moves += 1;
        if (pair[0].who === pair[1].who) {
          for (const found of pair) {
            found.matched = true;
            effects.burst(found.box.x + CARD_W / 2, found.box.y + CARD_H / 2, {
              count: PAIR_BURST,
            });
          }
          sound("coin");
          effects.float("Paar!", card.box.x + CARD_W / 2, card.box.y);
        } else {
          lookLeft = LOOK;
        }
      }
    }
  };

  const choose = (input: MiniInput) => {
    if (input.pressed.has("left")) {
      cursor = (cursor + cards.length - 1) % cards.length;
    }
    if (input.pressed.has("right")) {
      cursor = (cursor + 1) % cards.length;
    }
    if (input.pressed.has("up")) {
      cursor = (cursor + cards.length - COLUMNS) % cards.length;
    }
    if (input.pressed.has("down")) {
      cursor = (cursor + COLUMNS) % cards.length;
    }
    if (input.pressed.has("action")) {
      flip(cards[cursor]);
    }
    for (const tap of input.taps) {
      const hit = cards.findIndex((card) => inside(card.box, tap.x, tap.y));
      if (hit >= 0) {
        cursor = hit;
        flip(cards[hit]);
      }
    }
  };

  return {
    step(input, dt) {
      clock += dt;
      if (status === "running") {
        if (clock < PEEK) {
          // Everybody may look for a moment.
        } else if (clock - dt < PEEK) {
          for (const card of cards) {
            card.up = false;
          }
          sound("whoosh");
        } else {
          timeLeft -= dt;
          if (lookLeft > 0) {
            lookLeft -= dt;
            if (lookLeft <= 0) {
              for (const card of open()) {
                card.up = false;
              }
              sound("miss");
            }
          }
          choose(input);
        }
        if (cards.every((card) => card.matched)) {
          status = "won";
        } else if (timeLeft <= 0) {
          status = "lost";
        }
      }
      for (const card of cards) {
        const goal = card.up || card.matched ? 1 : 0;
        card.turn +=
          Math.sign(goal - card.turn) *
          Math.min(Math.abs(goal - card.turn), TURN * dt);
      }
      effects.update(dt);
      return status;
    },
    draw(g) {
      drawSprite(g.ctx, sheet, SPRITES.backdrop, 0, 0);
      cards.forEach((card, index) => {
        drawCard(g, sheet, card, index === cursor && clock >= PEEK);
      });
      effects.draw(g);
      drawHud(g, {
        score: cards.filter((card) => card.matched).length / 2,
        goal: PAIRS,
        scoreLabel: "Paare",
        time: timeLeft,
      });
    },
    summary() {
      const found = cards.filter((card) => card.matched).length / 2;
      return `${String(found)} von ${String(PAIRS)} Paaren in ${String(moves)} Zügen.`;
    },
  };
}

/** One card, turned as far as it is; with the cursor round it. */
function drawCard(
  g: MiniDraw,
  sheet: HTMLImageElement,
  card: Card,
  focused: boolean,
): void {
  const ctx = g.ctx;
  const { x, y } = card.box;
  const middle = x + CARD_W / 2;
  const squeeze = Math.abs(Math.cos(card.turn * Math.PI));
  const face = card.turn > 1 / 2;
  if (card.matched) {
    drawGlow(
      ctx,
      middle,
      y + CARD_H / 2,
      CARD_W,
      "255, 220, 90",
      GLOW_LOW +
        ((Math.sin(g.time * GLOW_PULSE) + 1) / 2) * (GLOW_HIGH - GLOW_LOW),
    );
  }
  ctx.save();
  ctx.translate(middle, 0);
  ctx.scale(Math.max(squeeze, 1 / CARD_W), 1);
  ctx.translate(-middle, 0);
  drawSprite(ctx, sheet, face ? SPRITES.cardFront : SPRITES.cardBack, x, y);
  if (face) {
    drawFigure(
      ctx,
      g.art,
      card.who,
      middle,
      y + FEET,
      "idle",
      "down",
      g.time * 2,
    );
  }
  ctx.restore();
  if (face && squeeze > 1 / 2) {
    const name = CHARACTER_TEXTS[card.who].name;
    g.text(name, middle, y + NAME_Y, {
      size: name.length > LONG_NAME ? NAME_SMALL : NAME_SIZE,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#5a2a1a",
    });
  }
  if (focused) {
    const frame = SPRITES.cursor;
    drawSprite(
      ctx,
      sheet,
      frame,
      middle - frame[2] / 2,
      y + CARD_H / 2 - frame[3] / 2,
    );
  }
}
