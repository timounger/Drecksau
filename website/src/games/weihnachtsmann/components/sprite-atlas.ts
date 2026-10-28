/**
 * Where each picture sits on the generated sheets.
 *
 * @module
 * @remarks
 * Written by the art generator together with `assets/figures-2x.png`,
 * `assets/world-2x.png` and `assets/portraits-2x.png` - every picture on them
 * is original pixel art drawn for this game. Rectangles are in logical pixels;
 * the sheets hold {@link SHEET_DENSITY} art pixels per logical pixel.
 * Regenerate all of them together; editing one by hand puts the others out of
 * step.
 */

/** A rectangle on a sheet: x, y, width and height in logical pixels. */
export type SpriteRect = readonly [number, number, number, number];

/** Which way a figure is drawn; left is the side view mirrored. */
export type Facing = "down" | "up" | "side";

/** The frames of one facing, by pose. */
export type PoseFrames = {
  readonly idle: readonly SpriteRect[];
  readonly walk: readonly SpriteRect[];
  /** Flying: Trixi, Rudolf and the bird. */
  readonly fly?: readonly SpriteRect[];
  /** Sliding on the belly: the penguin on ice. */
  readonly slide?: readonly SpriteRect[];
};

/** Everything drawn of one figure. */
export type FigureArt = {
  /** Where the feet are inside each frame, logical px from its top left. */
  readonly anchor: readonly [number, number];
  readonly down: PoseFrames;
  readonly up: PoseFrames;
  readonly side: PoseFrames;
};

/** Art pixels per logical pixel on every sheet. */
export const SHEET_DENSITY = 2;

/* eslint-disable @typescript-eslint/no-magic-numbers -- generated coordinates on the sheets */
/** The characters and Jordi's animals, on the figures sheet. */
export const FIGURES = {
  santa: {
    anchor: [20, 38],
    down: {
      idle: [
        [0, 0, 40, 40],
        [41, 0, 40, 40],
      ],
      walk: [
        [82, 0, 40, 40],
        [123, 0, 40, 40],
        [164, 0, 40, 40],
        [205, 0, 40, 40],
      ],
    },
    up: {
      idle: [
        [246, 0, 40, 40],
        [287, 0, 40, 40],
      ],
      walk: [
        [328, 0, 40, 40],
        [369, 0, 40, 40],
        [410, 0, 40, 40],
        [451, 0, 40, 40],
      ],
    },
    side: {
      idle: [
        [0, 41, 40, 40],
        [41, 41, 40, 40],
      ],
      walk: [
        [82, 41, 40, 40],
        [123, 41, 40, 40],
        [164, 41, 40, 40],
        [205, 41, 40, 40],
      ],
    },
  },
  balbo: {
    anchor: [20, 38],
    down: {
      idle: [
        [246, 41, 40, 40],
        [287, 41, 40, 40],
      ],
      walk: [
        [328, 41, 40, 40],
        [369, 41, 40, 40],
        [410, 41, 40, 40],
        [451, 41, 40, 40],
      ],
    },
    up: {
      idle: [
        [0, 82, 40, 40],
        [41, 82, 40, 40],
      ],
      walk: [
        [82, 82, 40, 40],
        [123, 82, 40, 40],
        [164, 82, 40, 40],
        [205, 82, 40, 40],
      ],
    },
    side: {
      idle: [
        [246, 82, 40, 40],
        [287, 82, 40, 40],
      ],
      walk: [
        [328, 82, 40, 40],
        [369, 82, 40, 40],
        [410, 82, 40, 40],
        [451, 82, 40, 40],
      ],
    },
  },
  jordi: {
    anchor: [20, 38],
    down: {
      idle: [
        [0, 123, 40, 40],
        [41, 123, 40, 40],
      ],
      walk: [
        [82, 123, 40, 40],
        [123, 123, 40, 40],
        [164, 123, 40, 40],
        [205, 123, 40, 40],
      ],
    },
    up: {
      idle: [
        [246, 123, 40, 40],
        [287, 123, 40, 40],
      ],
      walk: [
        [328, 123, 40, 40],
        [369, 123, 40, 40],
        [410, 123, 40, 40],
        [451, 123, 40, 40],
      ],
    },
    side: {
      idle: [
        [0, 164, 40, 40],
        [41, 164, 40, 40],
      ],
      walk: [
        [82, 164, 40, 40],
        [123, 164, 40, 40],
        [164, 164, 40, 40],
        [205, 164, 40, 40],
      ],
    },
  },
  trixi: {
    anchor: [20, 38],
    down: {
      idle: [
        [246, 164, 40, 40],
        [287, 164, 40, 40],
      ],
      walk: [
        [328, 164, 40, 40],
        [369, 164, 40, 40],
        [410, 164, 40, 40],
        [451, 164, 40, 40],
      ],
      fly: [
        [0, 205, 40, 40],
        [41, 205, 40, 40],
      ],
    },
    up: {
      idle: [
        [82, 205, 40, 40],
        [123, 205, 40, 40],
      ],
      walk: [
        [164, 205, 40, 40],
        [205, 205, 40, 40],
        [246, 205, 40, 40],
        [287, 205, 40, 40],
      ],
      fly: [
        [328, 205, 40, 40],
        [369, 205, 40, 40],
      ],
    },
    side: {
      idle: [
        [410, 205, 40, 40],
        [451, 205, 40, 40],
      ],
      walk: [
        [0, 246, 40, 40],
        [41, 246, 40, 40],
        [82, 246, 40, 40],
        [123, 246, 40, 40],
      ],
      fly: [
        [164, 246, 40, 40],
        [205, 246, 40, 40],
      ],
    },
  },
  gilfi: {
    anchor: [20, 38],
    down: {
      idle: [
        [246, 246, 40, 40],
        [287, 246, 40, 40],
      ],
      walk: [
        [328, 246, 40, 40],
        [369, 246, 40, 40],
        [410, 246, 40, 40],
        [451, 246, 40, 40],
      ],
    },
    up: {
      idle: [
        [0, 287, 40, 40],
        [41, 287, 40, 40],
      ],
      walk: [
        [82, 287, 40, 40],
        [123, 287, 40, 40],
        [164, 287, 40, 40],
        [205, 287, 40, 40],
      ],
    },
    side: {
      idle: [
        [246, 287, 40, 40],
        [287, 287, 40, 40],
      ],
      walk: [
        [328, 287, 40, 40],
        [369, 287, 40, 40],
        [410, 287, 40, 40],
        [451, 287, 40, 40],
      ],
    },
  },
  grantelbart: {
    anchor: [20, 38],
    down: {
      idle: [
        [0, 328, 40, 40],
        [41, 328, 40, 40],
      ],
      walk: [
        [82, 328, 40, 40],
        [123, 328, 40, 40],
        [164, 328, 40, 40],
        [205, 328, 40, 40],
      ],
    },
    up: {
      idle: [
        [246, 328, 40, 40],
        [287, 328, 40, 40],
      ],
      walk: [
        [328, 328, 40, 40],
        [369, 328, 40, 40],
        [410, 328, 40, 40],
        [451, 328, 40, 40],
      ],
    },
    side: {
      idle: [
        [0, 369, 40, 40],
        [41, 369, 40, 40],
      ],
      walk: [
        [82, 369, 40, 40],
        [123, 369, 40, 40],
        [164, 369, 40, 40],
        [205, 369, 40, 40],
      ],
    },
  },
  gugor: {
    anchor: [20, 38],
    down: {
      idle: [
        [246, 369, 40, 40],
        [287, 369, 40, 40],
      ],
      walk: [
        [328, 369, 40, 40],
        [369, 369, 40, 40],
        [410, 369, 40, 40],
        [451, 369, 40, 40],
      ],
    },
    up: {
      idle: [
        [0, 410, 40, 40],
        [41, 410, 40, 40],
      ],
      walk: [
        [82, 410, 40, 40],
        [123, 410, 40, 40],
        [164, 410, 40, 40],
        [205, 410, 40, 40],
      ],
    },
    side: {
      idle: [
        [246, 410, 40, 40],
        [287, 410, 40, 40],
      ],
      walk: [
        [328, 410, 40, 40],
        [369, 410, 40, 40],
        [410, 410, 40, 40],
        [451, 410, 40, 40],
      ],
    },
  },
  rudolf: {
    anchor: [20, 38],
    down: {
      idle: [
        [0, 451, 40, 40],
        [41, 451, 40, 40],
      ],
      walk: [
        [82, 451, 40, 40],
        [123, 451, 40, 40],
        [164, 451, 40, 40],
        [205, 451, 40, 40],
      ],
      fly: [
        [246, 451, 40, 40],
        [287, 451, 40, 40],
      ],
    },
    up: {
      idle: [
        [328, 451, 40, 40],
        [369, 451, 40, 40],
      ],
      walk: [
        [410, 451, 40, 40],
        [451, 451, 40, 40],
        [0, 492, 40, 40],
        [41, 492, 40, 40],
      ],
      fly: [
        [82, 492, 40, 40],
        [123, 492, 40, 40],
      ],
    },
    side: {
      idle: [
        [164, 492, 40, 40],
        [205, 492, 40, 40],
      ],
      walk: [
        [246, 492, 40, 40],
        [287, 492, 40, 40],
        [328, 492, 40, 40],
        [369, 492, 40, 40],
      ],
      fly: [
        [410, 492, 40, 40],
        [451, 492, 40, 40],
      ],
    },
  },
  hase: {
    anchor: [12, 22],
    down: {
      idle: [
        [0, 533, 24, 24],
        [25, 533, 24, 24],
      ],
      walk: [
        [50, 533, 24, 24],
        [75, 533, 24, 24],
        [100, 533, 24, 24],
        [125, 533, 24, 24],
      ],
    },
    up: {
      idle: [
        [150, 533, 24, 24],
        [175, 533, 24, 24],
      ],
      walk: [
        [200, 533, 24, 24],
        [225, 533, 24, 24],
        [250, 533, 24, 24],
        [275, 533, 24, 24],
      ],
    },
    side: {
      idle: [
        [300, 533, 24, 24],
        [325, 533, 24, 24],
      ],
      walk: [
        [350, 533, 24, 24],
        [375, 533, 24, 24],
        [400, 533, 24, 24],
        [425, 533, 24, 24],
      ],
    },
  },
  vogel: {
    anchor: [12, 22],
    down: {
      idle: [
        [450, 533, 24, 24],
        [475, 533, 24, 24],
      ],
      walk: [
        [0, 558, 24, 24],
        [25, 558, 24, 24],
        [50, 558, 24, 24],
        [75, 558, 24, 24],
      ],
      fly: [
        [100, 558, 24, 24],
        [125, 558, 24, 24],
      ],
    },
    up: {
      idle: [
        [150, 558, 24, 24],
        [175, 558, 24, 24],
      ],
      walk: [
        [200, 558, 24, 24],
        [225, 558, 24, 24],
        [250, 558, 24, 24],
        [275, 558, 24, 24],
      ],
      fly: [
        [300, 558, 24, 24],
        [325, 558, 24, 24],
      ],
    },
    side: {
      idle: [
        [350, 558, 24, 24],
        [375, 558, 24, 24],
      ],
      walk: [
        [400, 558, 24, 24],
        [425, 558, 24, 24],
        [450, 558, 24, 24],
        [475, 558, 24, 24],
      ],
      fly: [
        [0, 583, 24, 24],
        [25, 583, 24, 24],
      ],
    },
  },
  pinguin: {
    anchor: [12, 22],
    down: {
      idle: [
        [50, 583, 24, 24],
        [75, 583, 24, 24],
      ],
      walk: [
        [100, 583, 24, 24],
        [125, 583, 24, 24],
        [150, 583, 24, 24],
        [175, 583, 24, 24],
      ],
      slide: [[200, 583, 24, 24]],
    },
    up: {
      idle: [
        [225, 583, 24, 24],
        [250, 583, 24, 24],
      ],
      walk: [
        [275, 583, 24, 24],
        [300, 583, 24, 24],
        [325, 583, 24, 24],
        [350, 583, 24, 24],
      ],
      slide: [[375, 583, 24, 24]],
    },
    side: {
      idle: [
        [400, 583, 24, 24],
        [425, 583, 24, 24],
      ],
      walk: [
        [450, 583, 24, 24],
        [475, 583, 24, 24],
        [0, 608, 24, 24],
        [25, 608, 24, 24],
      ],
      slide: [[50, 608, 24, 24]],
    },
  },
  fuchs: {
    anchor: [12, 22],
    down: {
      idle: [
        [75, 608, 24, 24],
        [100, 608, 24, 24],
      ],
      walk: [
        [125, 608, 24, 24],
        [150, 608, 24, 24],
        [175, 608, 24, 24],
        [200, 608, 24, 24],
      ],
    },
    up: {
      idle: [
        [225, 608, 24, 24],
        [250, 608, 24, 24],
      ],
      walk: [
        [275, 608, 24, 24],
        [300, 608, 24, 24],
        [325, 608, 24, 24],
        [350, 608, 24, 24],
      ],
    },
    side: {
      idle: [
        [375, 608, 24, 24],
        [400, 608, 24, 24],
      ],
      walk: [
        [425, 608, 24, 24],
        [450, 608, 24, 24],
        [475, 608, 24, 24],
        [0, 633, 24, 24],
      ],
    },
  },
  maus: {
    anchor: [12, 22],
    down: {
      idle: [
        [25, 633, 24, 24],
        [50, 633, 24, 24],
      ],
      walk: [
        [75, 633, 24, 24],
        [100, 633, 24, 24],
        [125, 633, 24, 24],
        [150, 633, 24, 24],
      ],
    },
    up: {
      idle: [
        [175, 633, 24, 24],
        [200, 633, 24, 24],
      ],
      walk: [
        [225, 633, 24, 24],
        [250, 633, 24, 24],
        [275, 633, 24, 24],
        [300, 633, 24, 24],
      ],
    },
    side: {
      idle: [
        [325, 633, 24, 24],
        [350, 633, 24, 24],
      ],
      walk: [
        [375, 633, 24, 24],
        [400, 633, 24, 24],
        [425, 633, 24, 24],
        [450, 633, 24, 24],
      ],
    },
  },
  baer: {
    anchor: [12, 22],
    down: {
      idle: [
        [475, 633, 24, 24],
        [0, 658, 24, 24],
      ],
      walk: [
        [25, 658, 24, 24],
        [50, 658, 24, 24],
        [75, 658, 24, 24],
        [100, 658, 24, 24],
      ],
    },
    up: {
      idle: [
        [125, 658, 24, 24],
        [150, 658, 24, 24],
      ],
      walk: [
        [175, 658, 24, 24],
        [200, 658, 24, 24],
        [225, 658, 24, 24],
        [250, 658, 24, 24],
      ],
    },
    side: {
      idle: [
        [275, 658, 24, 24],
        [300, 658, 24, 24],
      ],
      walk: [
        [325, 658, 24, 24],
        [350, 658, 24, 24],
        [375, 658, 24, 24],
        [400, 658, 24, 24],
      ],
    },
  },
} as const satisfies Record<string, FigureArt>;

/** Markers, puffs and sparkles, on the figures sheet. */
export const EFFECTS = {
  marker0: [425, 658, 8, 7],
  marker1: [434, 658, 8, 7],
  poof0: [443, 658, 20, 20],
  poof1: [464, 658, 20, 20],
  poof2: [485, 658, 20, 20],
  note0: [0, 683, 7, 8],
  note1: [8, 683, 7, 8],
  sparkleYellow0: [16, 683, 5, 5],
  sparkleYellow1: [22, 683, 5, 5],
  sparklePink0: [28, 683, 5, 5],
  sparklePink1: [34, 683, 5, 5],
  sparkleCyan0: [40, 683, 5, 5],
  sparkleCyan1: [46, 683, 5, 5],
  sparkleWhite0: [52, 683, 5, 5],
  sparkleWhite1: [58, 683, 5, 5],
} as const satisfies Record<string, SpriteRect>;

/** Plain snow, four variants, on the world sheet. */
export const SNOW_TILES: readonly SpriteRect[] = [
  [0, 0, 16, 16],
  [17, 0, 16, 16],
  [34, 0, 16, 16],
  [51, 0, 16, 16],
];

/**
 * Trodden path as dual grid tiles, indexed by the corners that carry it:
 * 1 top left, 2 top right, 4 bottom left, 8 bottom right.
 */
export const PATH_TILES: readonly SpriteRect[] = [
  [68, 0, 16, 16],
  [85, 0, 16, 16],
  [102, 0, 16, 16],
  [119, 0, 16, 16],
  [136, 0, 16, 16],
  [153, 0, 16, 16],
  [170, 0, 16, 16],
  [187, 0, 16, 16],
  [204, 0, 16, 16],
  [221, 0, 16, 16],
  [238, 0, 16, 16],
  [255, 0, 16, 16],
  [272, 0, 16, 16],
  [289, 0, 16, 16],
  [306, 0, 16, 16],
  [323, 0, 16, 16],
];

/**
 * Ice as dual grid tiles, indexed by the corners that carry it:
 * 1 top left, 2 top right, 4 bottom left, 8 bottom right.
 */
export const ICE_TILES: readonly SpriteRect[] = [
  [340, 0, 16, 16],
  [357, 0, 16, 16],
  [374, 0, 16, 16],
  [391, 0, 16, 16],
  [408, 0, 16, 16],
  [425, 0, 16, 16],
  [442, 0, 16, 16],
  [459, 0, 16, 16],
  [476, 0, 16, 16],
  [493, 0, 16, 16],
  [0, 17, 16, 16],
  [17, 17, 16, 16],
  [34, 17, 16, 16],
  [51, 17, 16, 16],
  [68, 17, 16, 16],
  [85, 17, 16, 16],
];

/**
 * Open water as dual grid tiles, indexed by the corners that carry it:
 * 1 top left, 2 top right, 4 bottom left, 8 bottom right.
 */
export const WATER_TILES: readonly SpriteRect[] = [
  [102, 17, 16, 16],
  [119, 17, 16, 16],
  [136, 17, 16, 16],
  [153, 17, 16, 16],
  [170, 17, 16, 16],
  [187, 17, 16, 16],
  [204, 17, 16, 16],
  [221, 17, 16, 16],
  [238, 17, 16, 16],
  [255, 17, 16, 16],
  [272, 17, 16, 16],
  [289, 17, 16, 16],
  [306, 17, 16, 16],
  [323, 17, 16, 16],
  [340, 17, 16, 16],
  [357, 17, 16, 16],
];

/**
 * Fence pieces by the neighbours they join: 1 up, 2 right, 4 down, 8 left.
 * Each is a tile wide and stands six logical pixels below its tile's top.
 */
export const FENCE_TILES: readonly SpriteRect[] = [
  [374, 17, 16, 22],
  [391, 17, 16, 22],
  [408, 17, 16, 22],
  [425, 17, 16, 22],
  [442, 17, 16, 22],
  [459, 17, 16, 22],
  [476, 17, 16, 22],
  [493, 17, 16, 22],
  [0, 40, 16, 22],
  [17, 40, 16, 22],
  [34, 40, 16, 22],
  [51, 40, 16, 22],
  [68, 40, 16, 22],
  [85, 40, 16, 22],
  [102, 40, 16, 22],
  [119, 40, 16, 22],
];

/** The bigger things standing on the map, on the world sheet. */
export const OBJECTS = {
  tree: [136, 40, 32, 48],
  smallTree: [169, 40, 24, 34],
  rock: [194, 40, 16, 16],
  drift: [211, 40, 16, 16],
  snowman: [228, 40, 16, 28],
  lamp: [245, 40, 16, 40],
  gifts: [262, 40, 20, 18],
  sleigh: [283, 40, 36, 26],
  deadBush: [320, 40, 16, 16],
  crookedSign: [337, 40, 16, 24],
  dome: [0, 89, 160, 142],
  paintedTree: [161, 89, 128, 160],
  grantelMain: [290, 89, 80, 164],
  grantelWing: [371, 89, 48, 180],
  toyMachine: [0, 270, 128, 105],
  workbench: [129, 270, 48, 30],
  toyShelf: [178, 270, 48, 65],
  toyShelfLadder: [227, 270, 56, 65],
  armchair: [284, 270, 36, 35],
  creepyChair: [321, 270, 36, 48],
  fireplace: [358, 270, 48, 48],
  wishBoard: [407, 270, 36, 46],
  ampStack: [444, 270, 32, 62],
  drumKit: [0, 376, 52, 42],
  guitarStand: [53, 376, 16, 46],
  organ: [70, 376, 64, 76],
  candelabra: [135, 376, 16, 42],
  gearBig0: [152, 376, 18, 18],
  gearSmall0: [171, 376, 12, 12],
  gearBig1: [184, 376, 18, 18],
  gearSmall1: [203, 376, 12, 12],
  gearBig2: [216, 376, 18, 18],
  gearSmall2: [235, 376, 12, 12],
  gearBig3: [248, 376, 18, 18],
  gearSmall3: [267, 376, 12, 12],
  flame0: [280, 376, 20, 15],
  flame1: [301, 376, 20, 15],
  flame2: [322, 376, 20, 15],
  toyTeddy: [343, 376, 10, 10],
  toyTrain: [354, 376, 10, 10],
  toyDoll: [365, 376, 10, 10],
  toyBall: [376, 376, 10, 10],
  toyPresent: [387, 376, 10, 10],
  gateArchShut: [398, 376, 56, 68],
  gateArchOpen: [455, 376, 56, 68],
  gateHutShut: [0, 453, 56, 68],
  gateHutOpen: [57, 453, 56, 68],
  gateSnowWallShut: [114, 453, 56, 68],
  gateSnowWallOpen: [171, 453, 56, 68],
  gateGiftBoxShut: [228, 453, 56, 68],
  gateGiftBoxOpen: [285, 453, 56, 68],
  digit0: [342, 453, 6, 8],
  digit1: [349, 453, 6, 8],
  digit2: [356, 453, 6, 8],
  digit3: [363, 453, 6, 8],
  digit4: [370, 453, 6, 8],
  digit5: [377, 453, 6, 8],
  digit6: [384, 453, 6, 8],
  digit7: [391, 453, 6, 8],
  digit8: [398, 453, 6, 8],
  digit9: [405, 453, 6, 8],
  gateStar: [412, 453, 10, 10],
  workshopRoom: [0, 522, 384, 240],
  grantelRoom: [0, 763, 320, 208],
} as const satisfies Record<string, SpriteRect>;

/** Size of one portrait on the portrait strip, in its own pixels. */
export const PORTRAIT_SIZE = 44;

/** Which slot of the portrait strip shows whom, from the left. */
export const PORTRAIT_SLOTS = {
  santa: 0,
  balbo: 1,
  jordi: 2,
  trixi: 3,
  gilfi: 4,
  grantelbart: 5,
  gugor: 6,
  rudolf: 7,
  hase: 8,
  vogel: 9,
  pinguin: 10,
  fuchs: 11,
  maus: 12,
  baer: 13,
} as const;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One figure that can be drawn. */
export type FigureId = keyof typeof FIGURES;

/** One effect sprite. */
export type EffectName = keyof typeof EFFECTS;

/** One map object sprite. */
export type ObjectName = keyof typeof OBJECTS;
