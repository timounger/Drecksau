/**
 * Was man sich erspielen kann: die fünf Ausbaustufen des Bootes.
 *
 * @module
 * @remarks
 * Two things live here and nothing else. **The table** - what there is, what a
 * step costs and what it says on the tin - and **the sum**: the handful of
 * numbers the engine actually dives with ({@link Gear}).
 *
 * The engine knows nothing about experience points, and the upgrade screen
 * knows nothing about thrust: everything between the two passes through
 * {@link gearFrom}. That is what makes a sixth track, or a rebalanced cost, a
 * change to this file alone.
 */

/** One of the five things that can be improved. */
export type UpgradeId =
  "oxygen" | "armour" | "weapon" | "light" | "dive" | "engine";

/** Was im Wasser unterwegs sein kann. */
export type WeaponKind = "harpoon" | "torpedo" | "mine";

/** Und was davon aus dem Rohr kommt. */
export type Gun = "harpoon" | "torpedo";

/** One step of one track. */
export type Step = {
  /** What it costs in experience points to take this step. */
  readonly cost: number;
  /** What the boat can do once it is taken - German, it is read by players. */
  readonly label: string;
  /** One sentence for the plate beside the board, when it is picked. */
  readonly note: string;
};

/** One upgrade track. */
export type Upgrade = {
  readonly id: UpgradeId;
  readonly name: string;
  /** Derselbe Name in kurz, für die Kategoriezeile unter dem Baum. */
  readonly short: string;
  /** One line on what it is good for. */
  readonly hint: string;
  /** What the boat has before anything is bought. */
  readonly base: string;
  /** The steps, in order. The last one is as far as it goes. */
  readonly steps: readonly Step[];
};

/** What the engine dives with, once the upgrades are added up. */
export type Gear = {
  /** How long the air lasts, in seconds. */
  readonly air: number;
  /** How many hits the hull takes before it is over. */
  readonly hull: number;
  /**
   * Was im Bug steckt, oder null für ein Boot ohne alles.
   *
   * @remarks
   * **Der Torpedo ersetzt die Harpune**, er kommt nicht dazu: Es ist dasselbe
   * Rohr, nur besser bestückt. Wer beides gleichzeitig hätte, müsste sich im
   * Gefecht zwischen zwei Knöpfen entscheiden, und das ist keine Entscheidung,
   * sondern ein Handgriff.
   */
  readonly gun: Gun | null;
  /**
   * Ob Seeminen an Bord sind.
   *
   * @remarks
   * Die sind **zusätzlich** und ersetzen nichts - sie werden nicht geschossen,
   * sondern gelegt, und dafür gibt es eine eigene Taste.
   */
  readonly mines: boolean;
  /** How far it sees: 0 nothing but the lamp-less dark, 1 a lamp, 2 sonar. */
  readonly light: number;
  /** How much faster than standard it goes up and down. */
  readonly dive: number;
  /**
   * And how much harder the propeller pushes, ahead and astern.
   *
   * @remarks
   * One number for both, because it is one propeller. What differs is the
   * share of it that goes backwards, and that is the engine's business rather
   * than the workshop's - see {@link ./engine ASTERN}.
   */
  readonly push: number;
};

/** Ab welcher Stufe der Bewaffnung es was gibt. */
const ARMED = { torpedo: 2, mines: 3 } as const;

/** The boat as it comes: air for a short course, one hull, nothing else. */
const STOCK = {
  air: 70,
  hull: 1,
  light: 0,
  dive: 1,
  push: 1,
} as const;

/** How much air one step of the tank adds, in seconds. */
const AIR_STEP = 20;

/** What each step of the dive planes is worth, as a multiplier. */
const PLANES = { quick: 1.25, quicker: 1.5, quickest: 1.8 } as const;

/** The same, in the order they are bought. */
const DIVE_RATE: readonly number[] = [
  PLANES.quick,
  PLANES.quicker,
  PLANES.quickest,
];

/** What each step of the propeller is worth, as a multiplier. */
const SCREW = { strong: 1.2, stronger: 1.4, strongest: 1.6 } as const;

/** The same, in the order they are bought. */
const PUSH_RATE: readonly number[] = [
  SCREW.strong,
  SCREW.stronger,
  SCREW.strongest,
];

/**
 * Every track, in the order the upgrade screen shows them.
 *
 * @remarks
 * The costs climb faster than the courses pay out, and on purpose: with
 * everything finished once there is not nearly enough for all five tracks, so
 * the first question a player has is **which** boat they want. A boat that can
 * take four hits and one that can see in the dark are different boats.
 */
export const UPGRADES: readonly Upgrade[] = [
  {
    id: "oxygen",
    name: "Sauerstoffkapazität",
    short: "Sauerstoff",
    hint: "Je größer der Tank, desto länger reicht die Luft unter Wasser.",
    base: "70 s Luft",
    steps: [
      {
        cost: 20,
        label: "90 s Luft",
        note: "Ein zweiter Drucktank: zwanzig Sekunden mehr Luft, und aus knapp wird machbar.",
      },
      {
        cost: 35,
        label: "110 s Luft",
        note: "Noch ein Tank. Wer lange vor einer engen Stelle wartet, kann sich das jetzt leisten.",
      },
      {
        cost: 55,
        label: "130 s Luft",
        note: "Genug Luft, um auch den Graben in Ruhe zu tauchen statt ihn zu hetzen.",
      },
      {
        cost: 80,
        label: "150 s Luft",
        note: "Der volle Ausbau: zweieinhalb Minuten. Die Luft ist damit kein Gegner mehr.",
      },
    ],
  },
  {
    id: "armour",
    name: "Rüstung",
    short: "Rüstung",
    hint: "Jede Stufe ist ein Treffer mehr, den die Hülle aushält.",
    base: "1 Treffer - und es ist vorbei",
    steps: [
      {
        cost: 25,
        label: "2 Treffer",
        note: "Eine zweite Haut um die Hülle. Der erste Fels ist ab hier ein Schreck und kein Ende.",
      },
      {
        cost: 45,
        label: "3 Treffer",
        note: "Drei Treffer. Genug, um eine Mine zu übersehen und trotzdem anzukommen.",
      },
      {
        cost: 70,
        label: "4 Treffer",
        note: "Vier Treffer - mehr Panzerung, als in ein Boot dieser Größe gehört.",
      },
    ],
  },
  {
    id: "weapon",
    name: "Bewaffnung",
    short: "Waffen",
    hint: "Ab hier wird zurückgeschossen - Linksklick zielt, Rechtsklick legt Minen.",
    base: "unbewaffnet",
    steps: [
      {
        cost: 30,
        label: "Harpune - trifft, aber selten sofort",
        note: "Eine Harpune im Bug, gerichtet auf den Punkt, den du anklickst. Eine Mine hält drei davon aus - dafür kommt sie schnell hintereinander.",
      },
      {
        cost: 60,
        label: "Torpedo - ein Treffer genügt",
        note: "Ersetzt die Harpune im selben Rohr: langsamer, seltener - aber was er trifft, ist weg, und den Fels nimmt er gleich mit.",
      },
      {
        cost: 100,
        label: "Seemine - gelegt, nicht geschossen",
        note: "Kommt zusätzlich zum Rohr und liegt auf der rechten Maustaste. Eine gelegte Mine bleibt, wo sie ist, und geht nach ein paar Sekunden hoch - mit allem in ihrem Umkreis.",
      },
    ],
  },
  {
    id: "light",
    name: "Beleuchtung",
    short: "Licht",
    hint: "In der Tiefe sieht man ohne Licht wenig und ohne Sonar nichts.",
    base: "nur das, was ohnehin leuchtet",
    steps: [
      {
        cost: 40,
        label: "Scheinwerfer - ein Kegel nach vorn",
        note: "Ein Scheinwerfer im Bug. In dunklem Wasser sieht man damit, was kommt, statt es zu ahnen.",
      },
      {
        cost: 80,
        label: "Sonar - Umrisse weit vor dem Licht",
        note: "Sonar zeichnet Fels und Minen als Umrisse, lange bevor das Licht sie erreicht. Der Unterschied zwischen Sehen und Wissen.",
      },
    ],
  },
  {
    id: "dive",
    name: "Tauchgeschwindigkeit",
    short: "Tiefenruder",
    hint: "Schneller auf und ab - der Unterschied zwischen Lücke und Fels.",
    base: "Normale Tiefenruder",
    steps: [
      {
        cost: 20,
        label: "25 % schneller",
        note: "Größere Tiefenruder. Ein Viertel schneller auf und ab - oft genau die Lücke.",
      },
      {
        cost: 40,
        label: "50 % schneller",
        note: "Die Hälfte schneller. Ausweichen wird von einer Entscheidung zu einer Bewegung.",
      },
      {
        cost: 70,
        label: "80 % schneller",
        note: "Fast doppelt so flink senkrecht wie ab Werk. Damit fällt man durch Lücken, die vorhin keine waren.",
      },
    ],
  },
  {
    id: "engine",
    name: "Antriebsgeschwindigkeit",
    short: "Antrieb",
    hint: "Mehr Schub: schneller vorwärts - und rückwärts bleibt es gemächlich.",
    base: "Standardschraube",
    steps: [
      {
        cost: 20,
        label: "20 % mehr Schub",
        note: "Eine größere Schraube. Zwanzig Prozent mehr Fahrt, und das Fenster bleibt öfter hinter dir.",
      },
      {
        cost: 40,
        label: "40 % mehr Schub",
        note: "Noch mehr Schub. Vorsprung vor einer engen Stelle kauft man sich damit deutlich billiger.",
      },
      {
        cost: 70,
        label: "60 % mehr Schub",
        note: "Die stärkste Maschine, die das Boot verträgt. Rückwärts bleibt es trotzdem beim gemütlichen Tempo.",
      },
    ],
  },
];

/** Nothing bought yet - one level per track, all of them nought. */
export const NO_UPGRADES: Readonly<Record<UpgradeId, number>> = {
  oxygen: 0,
  armour: 0,
  weapon: 0,
  light: 0,
  dive: 0,
  engine: 0,
};

/**
 * The track with that name.
 *
 * @param id - which one
 * @returns the track
 */
export function upgradeOf(id: UpgradeId): Upgrade {
  return UPGRADES.find((one) => one.id === id) ?? UPGRADES[0];
}

/**
 * How far a track can be taken.
 *
 * @param id - which one
 * @returns the highest level it has
 */
export function topLevel(id: UpgradeId): number {
  return upgradeOf(id).steps.length;
}

/**
 * What the next step of a track costs.
 *
 * @param id - which track
 * @param level - the level it is at now
 * @returns the price, or null when it is already at the top
 */
export function nextCost(id: UpgradeId, level: number): number | null {
  const step = upgradeOf(id).steps[level];
  return step === undefined ? null : step.cost;
}

/**
 * What everything bought so far cost, all together.
 *
 * @param levels - the level of each track
 * @returns the points that are tied up in the boat
 * @remarks
 * Worked out from the table rather than counted along the way, which is what
 * makes putting everything back a one-liner: hand out
 * {@link NO_UPGRADES} and every point is free again, whatever was bought when
 * and in which order.
 */
export function spentOn(levels: Readonly<Record<UpgradeId, number>>): number {
  let spent = 0;
  for (const track of UPGRADES) {
    const level = levels[track.id] ?? 0;
    for (let step = 0; step < level && step < track.steps.length; step += 1) {
      spent += track.steps[step].cost;
    }
  }
  return spent;
}

/**
 * What the boat is, once the upgrades are added up.
 *
 * @param levels - the level of each track
 * @returns the numbers the engine dives with
 */
export function gearFrom(levels: Readonly<Record<UpgradeId, number>>): Gear {
  const held = (id: UpgradeId) =>
    Math.max(0, Math.min(topLevel(id), Math.floor(levels[id] ?? 0)));
  const gun = held("weapon");
  const planes = held("dive");
  const screw = held("engine");
  return {
    air: STOCK.air + held("oxygen") * AIR_STEP,
    hull: STOCK.hull + held("armour"),
    gun: gun === 0 ? null : gun === 1 ? "harpoon" : "torpedo",
    mines: gun >= ARMED.mines,
    light: held("light"),
    dive: planes > 0 ? DIVE_RATE[planes - 1] : STOCK.dive,
    push: screw > 0 ? PUSH_RATE[screw - 1] : STOCK.push,
  };
}

/** The boat with nothing bought, for the first dive and for the tests. */
export const STOCK_GEAR: Gear = gearFrom(NO_UPGRADES);
