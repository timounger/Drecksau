/**
 * The buttons along the bottom of the picture: everything one can do standing
 * still.
 *
 * @module
 * @remarks
 * One module for both halves of a button, because a button is only a button
 * when the place it is drawn and the place it is pressed are the same place.
 * {@link actionsFor} works out the row; the renderer paints it and the hook
 * asks it what a click landed on.
 *
 * They live in the picture rather than on the page under it for three reasons:
 * in fullscreen there is no page, on a phone there is no room for one, and a
 * shop one has to look away from the street to use is a shop that gets one
 * shot. The city is the screen.
 */
import {
  canBoard,
  onThePad,
  padKind,
  towable,
  towing,
  counterAt,
  crewHere,
  hirePrice,
  hireable,
  type Counter,
} from "@/games/gta/engine/engine";
import { lit } from "@/games/gta/engine/mint";
import {
  JET_PRICE,
  MINT_CREW,
  PLAYER_HEALTH,
  flyerName,
  type GameState,
  type Order,
} from "@/games/gta/engine/types";
import {
  PRICES,
  WEAPONS,
  carried,
  forSale,
  refillPrice,
} from "@/games/gta/engine/weapons";

/** What a button is for, which decides what colour it is. */
export type Tone = "buy" | "raid" | "act" | "crew";

/** Where a button sits, in view pixels. */
export type Box = {
  readonly x: number;
  readonly y: number;
  readonly wide: number;
  readonly high: number;
};

/** One thing the player can do from where he is standing. */
export type Action = {
  /** What pressing it sends to the engine. */
  readonly order: Order;
  /** What it says. */
  readonly label: string;
  /** Whether it can be pressed at all. */
  readonly on: boolean;
  readonly tone: Tone;
  readonly box: Box;
};

/**
 * Every button that belongs on screen right now.
 *
 * @param state - the game as it stands
 * @param width - the picture, in view pixels
 * @param height - the same
 * @returns the buttons, already laid out
 */
export function actionsFor(
  state: GameState,
  width: number,
  height: number,
): readonly Action[] {
  return lay(listOf(state), width, height);
}

/**
 * Which button a point landed on.
 *
 * @param state - the game as it stands
 * @param width - the picture, in view pixels
 * @param height - the same
 * @param at - where the finger or the mouse went down, in view pixels
 * @returns what to order, or null when the press was on the city
 */
export function actionAt(
  state: GameState,
  width: number,
  height: number,
  at: { readonly x: number; readonly y: number },
): Order | null {
  const hit = actionsFor(state, width, height).find(
    (button) =>
      button.on &&
      at.x >= button.box.x &&
      at.x <= button.box.x + button.box.wide &&
      at.y >= button.box.y &&
      at.y <= button.box.y + button.box.high,
  );
  return hit?.order ?? null;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the numbers below are
   the look of a button row: how tall a pill is, how much air is between two of
   them, where the row sits over the bottom edge. They are a layout, not
   arithmetic. */

/** What each button says, before it is given a place to stand. */
type Wanted = Omit<Action, "box">;

/** Everything on offer where the player is standing. */
function listOf(state: GameState): readonly Wanted[] {
  let list: readonly Wanted[] = [];
  if (state.mint !== null) {
    list = insideWorks(state);
  } else if (state.phase === "playing") {
    list = [
      ...atCounter(state, counterAt(state)),
      ...onTheCorner(state),
      ...onThePlatform(state),
      ...onTheTowBar(state),
    ];
  }
  return list;
}

/** The wall of the gun shop, the counter of the bank, the door of the works. */
function atCounter(state: GameState, where: Counter): readonly Wanted[] {
  let list: readonly Wanted[] = [];
  switch (where) {
    case "guns":
      list = shopWares(state);
      break;
    case "bank":
      list = [holdUpButton(state)];
      break;
    case "mint":
      list = [mintButton(state)];
      break;
    default:
      list = [];
  }
  return list;
}

/** Everything on the wall, and rounds for whatever is in the hand. */
function shopWares(state: GameState): readonly Wanted[] {
  const player = state.player;
  const wares = forSale().map((kind) => ({
    order: { kind: "buy", what: kind } as const,
    label: `${WEAPONS[kind].name} ${PRICES[kind]} €`,
    on: player.money >= PRICES[kind],
    tone: "buy" as const,
  }));
  const vest = {
    order: { kind: "buy", what: "armour" } as const,
    label: `Rüstung ${PRICES.armour} €`,
    on: player.money >= PRICES.armour && player.armour < PLAYER_HEALTH,
    tone: "buy" as const,
  };
  // The jetpack is not a weapon and never in the hand: it is a thing one owns,
  // so it is on the wall exactly until it is bought and then it is gone.
  const pack = player.jetpack
    ? []
    : [
        {
          order: { kind: "buy", what: "jetpack" } as const,
          label: `Jetpack ${JET_PRICE} €`,
          on: player.money >= JET_PRICE,
          tone: "buy" as const,
        },
      ];
  const hand = player.weapon;
  const refill = refillPrice(hand);
  const rounds =
    hand === "fist" || !carried(player.ammo, hand)
      ? []
      : [
          {
            order: { kind: "refill", what: hand } as const,
            label: `+Muni ${refill} €`,
            on: player.money >= refill,
            tone: "buy" as const,
          },
        ];
  return [...wares, vest, ...pack, ...rounds];
}

/** The one button a bank has before anybody has decided anything. */
function holdUpButton(state: GameState): Wanted {
  const armed =
    state.player.weapon !== "fist" &&
    carried(state.player.ammo, state.player.weapon);
  return {
    order: { kind: "rob" },
    label: armed ? "Überfall" : "Überfall (Waffe fehlt)",
    on: armed,
    tone: "raid",
  };
}

/** And the one the printing works has. */
function mintButton(state: GameState): Wanted {
  const here = crewHere(state);
  const armed =
    state.player.weapon !== "fist" &&
    carried(state.player.ammo, state.player.weapon);
  return {
    order: { kind: "raid" },
    label: here >= MINT_CREW ? "Rein da" : `Crew ${here}/${MINT_CREW}`,
    on: here >= MINT_CREW && armed,
    tone: "raid",
  };
}

/** Somebody on the pavement who would come along. */
function onTheCorner(state: GameState): readonly Wanted[] {
  const man = hireable(state);
  const price = man === null ? 0 : hirePrice(man);
  return man === null
    ? []
    : [
        {
          order: { kind: "hire" },
          label: price === 0 ? "Mitnehmen" : `Anheuern ${price} €`,
          on: state.player.money >= price,
          tone: "crew",
        },
      ];
}

/** The tow bar on the back of a tractor, and what is on it. */
function onTheTowBar(state: GameState): readonly Wanted[] {
  const load = towable(state);
  let list: readonly Wanted[] = [];
  if (towing(state)) {
    list = [
      { order: { kind: "hitch" }, label: "Abkuppeln", on: true, tone: "act" },
    ];
  } else if (load !== null) {
    list = [
      { order: { kind: "hitch" }, label: "Anhängen", on: true, tone: "act" },
    ];
  }
  return list;
}

/** The train, while it is standing there with its doors open. */
function onThePlatform(state: GameState): readonly Wanted[] {
  let list: readonly Wanted[] = [];
  if (state.player.flying) {
    list = [
      { order: { kind: "board" }, label: "Landen", on: true, tone: "act" },
    ];
  } else if (onThePad(state)) {
    // What it says is what one is about to climb into: "Hubschrauber" over an
    // aeroplane is a button that lies about the machine in front of one.
    const kind = padKind(state);
    list = [
      {
        order: { kind: "board" },
        label: kind === null ? "Einsteigen" : flyerName(kind),
        on: true,
        tone: "act",
      },
    ];
  } else if (state.player.aboard) {
    list = [
      { order: { kind: "board" }, label: "Aussteigen", on: true, tone: "act" },
    ];
  } else if (canBoard(state)) {
    list = [
      { order: { kind: "board" }, label: "Einsteigen", on: true, tone: "act" },
    ];
  }
  return list;
}

/** And inside the printing works: the two things that buy time. */
function insideWorks(state: GameState): readonly Wanted[] {
  const works = state.mint;
  const hostages =
    works === null ? 0 : works.staff.filter((one) => one.taken).length;
  return [
    {
      order: { kind: "release" },
      label: "Geisel freilassen",
      on: hostages > 0,
      tone: "act",
    },
    {
      order: { kind: "power" },
      label: works !== null && !lit(works) ? "Alles dunkel" : "Strom kappen",
      on: works !== null && !works.cut,
      tone: "act",
    },
  ];
}

/* ------------------------------------------------------------- the layout */

/**
 * Puts the buttons along the bottom of the picture.
 *
 * @remarks
 * Filled from the right and stacked upwards, so that the first button of a row
 * is always in the same place and a shop with eleven things on the wall does
 * not push the one button of a bank somewhere else. The left end stops short
 * of the map in the corner.
 */
function lay(
  wanted: readonly Wanted[],
  width: number,
  height: number,
): readonly Action[] {
  const out: Action[] = [];
  const left = MAP_ROOM;
  const room = width - left - EDGE;
  let x = left;
  let row = 0;
  for (const button of wanted) {
    const wide = widthOf(button.label);
    if (x + wide > left + room) {
      x = left;
      row += 1;
    }
    out.push({
      ...button,
      box: {
        x,
        wide,
        high: BUTTON_HIGH,
        y: height - EDGE - BUTTON_HIGH - row * (BUTTON_HIGH + GAP),
      },
    });
    x += wide + GAP;
  }
  // Rows are built downwards and drawn upwards, so the last row would sit on
  // the bottom edge. Lifting the whole lot by the rows that were added keeps
  // the first row where it always is.
  return out.map((button) => ({
    ...button,
    box: { ...button.box, y: button.box.y - row * (BUTTON_HIGH + GAP) },
  }));
}

/** How wide a pill with this label is, in view pixels. */
function widthOf(label: string): number {
  return Math.max(74, label.length * 6.4 + 20);
}

/** How tall every button is. */
const BUTTON_HIGH = 26;

/** How much air between two of them. */
const GAP = 6;

/** How far the row keeps from the bottom and the right edge. */
const EDGE = 14;

/** Where it starts on the left: clear of the map in the corner. */
const MAP_ROOM = 200;

/* -------------------------------------------------------------- the paint */

/** What each sort of button is painted in: face, edge, text. */
const TONES: Readonly<Record<Tone, readonly [string, string, string]>> = {
  buy: ["rgba(120,53,15,0.9)", "#f59e0b", "#fef3c7"],
  raid: ["rgba(76,5,25,0.9)", "#fb7185", "#ffe4e6"],
  act: ["rgba(15,23,42,0.9)", "#94a3b8", "#e2e8f0"],
  crew: ["rgba(20,83,45,0.9)", "#4ade80", "#dcfce7"],
};

/**
 * Paints the row.
 *
 * @param ctx - what to paint on
 * @param state - the game as it stands
 * @param width - the picture, in view pixels
 * @param height - the same
 */
export function drawActions(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
): void {
  const buttons = actionsFor(state, width, height);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 12px system-ui, sans-serif";
  for (const button of buttons) {
    const [face, edge, ink] = TONES[button.tone];
    ctx.globalAlpha = button.on ? 1 : 0.42;
    const pill = new Path2D();
    pill.roundRect(
      button.box.x,
      button.box.y,
      button.box.wide,
      button.box.high,
      8,
    );
    ctx.fillStyle = face;
    ctx.fill(pill);
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.5;
    ctx.stroke(pill);
    ctx.fillStyle = ink;
    ctx.fillText(
      button.label,
      button.box.x + button.box.wide / 2,
      button.box.y + button.box.high / 2 + 0.5,
    );
  }
  ctx.restore();
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
