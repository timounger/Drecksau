/**
 * The island, drawn and tapped.
 *
 * @module
 * @remarks
 * **The board is the controller.** There is no "build a road" mode to switch
 * into first: whatever you are allowed to build right now is lit up, and what
 * you tap says which it is. A path can only ever be a road, an empty crossing
 * can only ever be a settlement, one of your own settlements can only ever
 * become a city, and a landscape is only ever tappable while the robber is in
 * your hand. The four never overlap, so there is nothing to disambiguate and
 * nothing to choose beforehand.
 *
 * Everything lit is asked of the referee - the same {@link roadSpots},
 * {@link townSpots} and {@link citySpots} the computer plays off - rather than
 * worked out again here, so the board can never offer what the rules refuse.
 *
 * Your own colour is marked twice over: a white-then-dark double ring around
 * your pieces, and a ring in your colour around every landscape you touch. Both
 * are outlines rather than fills, on purpose - a wash over a landscape would
 * take its colour with it, and on this board the colour of a landscape *is*
 * what it produces. The double ring is belt and braces for the white figures,
 * which are nearly the colour of the board and would lose a single outline.
 */
"use client";

import type { ReactElement } from "react";
import {
  islandOf,
  pointOf,
  type Island,
  type Point,
} from "@/games/catan/engine/board";
import { EVENT_ASK } from "@/games/catan/engine/events";
import {
  citySpots,
  neutralSpots,
  bridgeSpots,
  postSpots,
  putSpots as barbPutSpots,
  roadSpots,
  takeSpots,
  townSpots,
} from "@/games/catan/engine/moves";
import { LAKE_NUMBERS, type Ground } from "@/games/catan/engine/fischer";
import { BRIDGE_PRICE, rivers } from "@/games/catan/engine/fluesse";
import {
  KNIGHT_STEPS,
  EXTRA_STEPS,
  conquered,
  overrun,
  rideSpots,
} from "@/games/catan/engine/barbaren";
import {
  BOAT_COST,
  CAMP_UNITS,
  PORT_COST,
  SCOUT_COST,
  UNIT_COST,
  campAt,
  camping,
  campsFrom,
  catchSpots,
  councilDocks,
  villageSpots,
  type Spice,
  landings,
  shoalAt,
  pirateSeas,
  boatSpots,
  finding,
  landingSpots,
  lanesFrom,
  portShore,
  portsOf,
} from "@/games/catan/engine/entdecker";
import { wagonSpots } from "@/games/catan/engine/karawane";
import {
  SHIP_COST,
  corsairs,
  fleetRing,
  looseShips,
  pirateSpots,
  sailing,
  seaPath,
  shipSpots,
} from "@/games/catan/engine/seefahrer";
import {
  TARGET_NAMES,
  TARGET_SHORT,
  driveSpots,
  facingRaiders,
  hauling,
  raiderSpots,
} from "@/games/catan/engine/handel";
import {
  KNIGHT_COST,
  canKnight,
  marchSpots,
  retreatSpots,
} from "@/games/catan/engine/ritter";
import { robberSpots } from "@/games/catan/engine/variants";
import { COLOUR_INK } from "@/games/catan/engine/setup";
import {
  CITY_COST,
  ROAD_COST,
  TOWN_COST,
  actingSeat,
  covers,
  playingRitter,
  type CatanGame,
  type CatanMove,
  type Land,
  type Gift,
} from "@/games/catan/engine/state";
import { LAND_NAMES, SORT_NAMES } from "@/games/catan/i18n/texts";

/* eslint-disable @typescript-eslint/no-magic-numbers */

/** Radius of one landscape, in drawing units. */
const SIZE = 40;

/**
 * Room around the island for the harbours.
 *
 * @remarks
 * Wider than tall, because a harbour label reads sideways: "2:1 Getreide" is
 * over sixty units long and only sixteen high, and the widest one sticks
 * straight out of the east coast.
 */
const SIDE_MARGIN = 66;

/** Room above and below the island. */
const TOP_MARGIN = 46;

/** What each landscape is painted. */
const LAND_INK: Readonly<Record<Land, string>> = {
  lehm: "#c2703f",
  holz: "#2f6b39",
  wolle: "#86c14b",
  getreide: "#e6c34a",
  erz: "#8d97a3",
  // The lake of Fischfang auf Catan. Painted as water, so it reads as
  // something nobody builds on rather than as a sixth landscape.
  see: "#3b82c4",
  // The marsh at a river's source: wet ground, not water.
  sumpf: "#6d7a4a",
  // The watering hole the nomads camp at: sand with water in it.
  wasserstelle: "#c8b47a",
  // The castle the knights are trained in.
  burg: "#6b6f76",
  // The three sites of Händler & Barbaren.
  ziel: "#b48a5a",
  // Open water, the same blue the frame is painted.
  meer: "#3f86bd",
  // A Goldfluss: sand with gold in it.
  gold: "#c9962b",
  // A Fischfeld: darker water, so it stands out from the open sea around it.
  fisch: "#2b6f9a",
  // A Gewürzfeld: an island of its own, greener than the start island.
  gewuerz: "#7a5a86",
  // Face down: the back of a tile, not a landscape.
  unbekannt: "#4a5a6b",
  wueste: "#e2d3a6",
};

/** The two numbers the rulebook prints in red, because they come up most. */
const HOT_CHIPS: readonly number[] = [6, 8];

/**
 * How big the invisible circle is that catches a tap on a piece.
 *
 * @remarks
 * A piece draws itself with `pointer-events: none` so it never swallows a tap
 * meant for the board underneath - and a `<g>` has no area of its own, so a
 * clickable wrapper round such a piece catches nothing at all. This circle is
 * the area. Without it the knights, the ships and the Trosswagen all looked
 * pickable and were not.
 */
const TAP_AREA = 12;

/** The taps that name a field rather than a crossing or an edge. */
const HEX_SPOTS: readonly Spot["kind"][] = [
  "robber",
  "barb",
  "pirateAt",
  "stormAt",
  "corsairAt",
  "catchAt",
  "dropAt",
];

/** How a fortress and the pirate fleet are drawn. */
const FORT_WIDE = 20;
const FORT_DROP = 9;
const FORT_STEP = 4;
const ARMADA_SIZE = 12;

/** How big a village chip is. */
const VILLAGE_CHIP = 12;

/** How big a gift marker is. */
const GIFT_SIZE = 9;

/** What each village advantage is called on the board. */
const SPICE_LABELS: Readonly<Record<Spice, string>> = {
  fahrt: "+1 Fahrt",
  pirat4: "Pirat 4",
  pirat5: "Pirat 5",
  gold: "Gold",
};

/** How a village is drawn. */
const VILLAGE_WIDE = 40;
const VILLAGE_HIGH = 22;
const VILLAGE_DOT = 3;

/** How a fish field, a shoal and the Catanischer Rat are drawn. */
const FISH_DIE = 17;
const FISH_LIFT = 13;
const COUNCIL_SIZE = 15;
const ANCHOR_SIZE = 7;

/** How a pirate camp and a pirate ship are drawn. */
const CAMP_WIDE = 26;
const CAMP_HIGH = 9;
const CAMP_DROP = 15;
const CAMP_DOT = 3;
const CORSAIR_SIZE = 11;
// Clear of the die number of a Fischfeld, which a pirate ship may sit on.
const CORSAIR_DROP = 8;

/** How an Entdecker ship and its cargo are drawn. */
const BOAT_HULL = 10;
const BOAT_SAIL = 9;
const HOLD_DOT = 3;

/** How a ship and the Seeräuber are drawn. */
const SHIP_HULL = 9;
const SHIP_MAST = 8;
const PIRATE_SIZE = 13;

/** How a site, a left-over barbarian and a Trosswagen are drawn. */
const SITE_MARK = 15;
const RAIDER_SIZE = 6;
const HAULER_SIZE = 0.85;

/** How a barbarian and a knight are drawn. */
const BARB_HIGH = 18;
const BARB_WIDE = 10;
const BARB_GAP = 12;
const BARB_DROP = 20;
const GUARD_SIZE = 8;

/** How a wagon and the arrows out of the watering hole are drawn. */
const WAGON_LONG = 22;
const WAGON_HIGH = 11;
const WAGON_WHEEL = 3.2;
const WAGON_LIFT = 3.4;
const ARROW_OUT = 0.45;
const ARROW_WIDE = 8;

/** How the water and a bridge are drawn. */
const RIVER_WIDE = 9;
const RIVER_THIN = 4.5;
const BRIDGE_DECK = 13;
const BRIDGE_RAIL = 7;
const BRIDGE_STUD = 2.5;

/** How far out of the coast a harbour's jetty reaches. */
const JETTY = 30;

/** Room either side of a harbour's label. */
const LABEL_PAD = 10;

/** About how wide one letter of a harbour label is. */
const LETTER_WIDTH = 4.4;

/** How thick the ring around a landscape you build on is. */
const MINE_RING = 5;

/** How strongly that ring takes your colour. */
const MINE_INK = 0.85;

/** A place on the board that can be tapped. */
type Spot = {
  readonly kind:
    | "town"
    | "road"
    | "city"
    | "robber"
    | "breakRoad"
    /** *CATAN für Zwei*: the free piece, in the colour {@link Spot.seat} names. */
    | "neutralTown"
    | "neutralRoad"
    /** *Städte & Ritter*: put a knight here, or march the picked one here. */
    | "knight"
    | "march"
    /** *Die Flüsse von Catan*: a bridge across the water. */
    | "bridge"
    /** *Der Handelstross*: a position to put one's votes on. */
    | "voteAt"
    /** *Der Handelstross*: where the wagon actually goes. */
    | "wagon"
    /** *Der Barbarenüberfall*: a path for a knight a card has handed over. */
    | "post"
    /** *Der Barbarenüberfall*: a coast field a card takes or gives a barbarian. */
    | "barb"
    /** *Der Barbarenüberfall*: where the picked knight rides to. */
    | "ride"
    /** *Händler & Barbaren*: the next crossing the Trosswagen drives to. */
    | "drive"
    /** *Händler & Barbaren*: where the lifted barbarian goes. */
    | "shift"
    | "shoveAt"
    /** *Seefahrer*: a water path for a new ship. */
    | "ship"
    /** *Seefahrer*: where the picked ship is put down again. */
    | "sail"
    /** *Seefahrer*: a sea field for the Seeräuber. */
    | "pirateAt"
    /** *Entdecker & Piraten*: a sea path for a new ship. */
    | "boatAt"
    /** *Entdecker & Piraten*: where an explorer goes. */
    | "scoutAt"
    /** *Entdecker & Piraten*: a settlement to grow into a Hafensiedlung. */
    | "portAt"
    /** *Entdecker & Piraten*: the next sea path of the ship at the helm. */
    | "sailTo"
    /** *Entdecker & Piraten*: where an explorer ship founds a settlement. */
    | "landAt"
    /** *Entdecker & Piraten*: a harbour basin to load from or into. */
    | "loadAt"
    /** *Die Piratenlager*: a harbour basin for a new unit. */
    | "unitAt"
    /** *Die Piratenlager*: a camp to set units down on. */
    | "stormAt"
    /** *Die Piratenlager*: a sea field for one's own pirate ship. */
    | "corsairAt"
    /** *Fische für Catan*: a shoal to take aboard. */
    | "catchAt"
    /** *Fische für Catan*: a harbour of the Catanischer Rat to unload at. */
    | "deliverAt"
    /** *Gewürze für Catan*: a village to set a unit down on. */
    | "dropAt";
  readonly at: number;
  /**
   * Whose piece, where that is not simply the reader's own.
   *
   * @remarks
   * For a `march` this carries the **crossing the knight starts on** instead.
   * Both are one number naming the other end of the move, and a second field
   * used by one kind would be empty on every other.
   */
  readonly seat?: number;
  /** *Der Barbarenüberfall*: whether this ride costs a Getreide. */
  readonly far?: boolean;
};

/** Where a lattice point lands on the drawing. */
function at(x: number, y: number): Point {
  return pointOf(x, y, SIZE);
}

/** The middle of a landscape. */
function hexPoint(board: Island, hex: number): Point {
  return at(board.hexes[hex].x, board.hexes[hex].y);
}

/** The middle of a crossing. */
function crossPoint(board: Island, id: number): Point {
  return at(board.crossings[id].x, board.crossings[id].y);
}

/** The six corners of a landscape, as an SVG points list. */
function hexOutline(board: Island, hex: number): string {
  return board.hexes[hex].corners
    .map((corner) => {
      const { px, py } = crossPoint(board, corner);
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");
}

/** How often a chip comes up, as pips under the number. */
function pips(chip: number): number {
  return chip === 0 ? 0 : 6 - Math.abs(7 - chip);
}

/**
 * Everything this seat may tap right now.
 *
 * @remarks
 * Asked of the referee rather than reasoned about: the same three predicates
 * the rules run on decide what the board lights.
 */
export function tappable(
  game: CatanGame,
  seat: number | null,
  neutralColour: number | null = null,
  marching: number | null = null,
  riding: number | null = null,
  sailingShip: number | null = null,
): readonly Spot[] {
  const board = islandOf(game.land.length);
  const spots: Spot[] = [];
  const mine = seat !== null && seat === actingSeat(game);
  const hand = seat === null ? null : game.players[seat].hand;
  if (mine && game.phase === "founding" && game.founding?.placing === "town") {
    townSpots(game, seat, true).forEach((id) =>
      spots.push({ kind: "town", at: id }),
    );
  } else if (
    mine &&
    game.phase === "founding" &&
    game.founding?.placing === "boat"
  ) {
    boatSpots(game, seat).forEach((at) => spots.push({ kind: "boatAt", at }));
  } else if (mine && game.phase === "founding" && game.founding !== null) {
    const from = game.founding.lastTown;
    board.paths.forEach((path) => {
      if (
        from !== null &&
        path.ends.includes(from) &&
        game.roads[path.id] === null &&
        game.ships[path.id] === null
      ) {
        // "Wer in der Gründungsphase eine Siedlung an die Küste setzt, darf
        // statt einer Straße auch ein Schiff an diese Siedlung setzen."
        spots.push(
          seaPath(game, path.id)
            ? { kind: "ship", at: path.id }
            : { kind: "road", at: path.id },
        );
      }
    });
  } else if (mine && game.phase === "pirate") {
    // "Eine der beiden Figuren muss versetzt werden" - so both are on offer.
    pirateSpots(game).forEach((hex) =>
      spots.push({ kind: "pirateAt", at: hex }),
    );
    robberSpots(game, game.robber).forEach((hex) =>
      spots.push({ kind: "robber", at: hex }),
    );
  } else if (mine && game.phase === "corsair") {
    pirateSeas(game).forEach((hex) =>
      spots.push({ kind: "corsairAt", at: hex }),
    );
  } else if (mine && game.phase === "sailing") {
    const boat = game.sailing === null ? undefined : game.boats[game.sailing];
    if (boat !== undefined && boat.owner === seat) {
      lanesFrom(game, boat).forEach((at) => spots.push({ kind: "sailTo", at }));
      if (boat.hold.includes("entdecker")) {
        landingSpots(game, seat, boat.at).forEach((at) =>
          spots.push({ kind: "landAt", at }),
        );
      }
      board.paths[boat.at].ends
        .filter((end) => portsOf(game, seat).includes(end))
        .forEach((at) => spots.push({ kind: "loadAt", at }));
      if (boat.hold.includes("einheit")) {
        campsFrom(game, boat.at).forEach((at) =>
          spots.push({ kind: "stormAt", at }),
        );
      }
      catchSpots(game, seat)
        .filter((each) => each.boat === game.sailing)
        .forEach((each) => spots.push({ kind: "catchAt", at: each.hex }));
      villageSpots(game, seat)
        .filter((each) => each.boat === game.sailing)
        .forEach((each) => spots.push({ kind: "dropAt", at: each.hex }));
      landings(game, seat)
        .filter((each) => each.boat === game.sailing)
        .forEach((each) => spots.push({ kind: "deliverAt", at: each.at }));
    }
  } else if (mine && game.phase === "driving") {
    driveSpots(game, seat).forEach((at) => spots.push({ kind: "drive", at }));
    // "Steht ein Barbar auf einem Weg, den du befahren willst, darfst du gegen
    // ihn würfeln": the barbarians in front of the wagon are tapped like
    // anything else on a path.
    facingRaiders(game, seat).forEach((at) =>
      spots.push({ kind: "shoveAt", at }),
    );
  } else if (mine && game.phase === "shifting") {
    raiderSpots(game).forEach((at) => spots.push({ kind: "shift", at }));
  } else if (mine && game.phase === "posting" && game.posting !== null) {
    postSpots(game, game.posting).forEach((at) =>
      spots.push({ kind: "post", at }),
    );
  } else if (mine && game.phase === "barbarians") {
    // Taking first, then putting back down: the card says which, and the
    // referee's own lists say where.
    (game.barbTake > 0 ? takeSpots(game) : barbPutSpots(game)).forEach((hex) =>
      spots.push({ kind: "barb", at: hex }),
    );
  } else if (mine && game.phase === "knights" && riding !== null) {
    // The knight is picked on the board and then sent; the far ride is offered
    // wherever the near one cannot reach, so the Getreide is only spent when it
    // buys something.
    const near = rideSpots(game, riding, KNIGHT_STEPS);
    near.forEach((at) => spots.push({ kind: "ride", at, seat: riding }));
    if (game.players[seat ?? 0].hand.getreide > 0) {
      rideSpots(game, riding, KNIGHT_STEPS + EXTRA_STEPS)
        .filter((at) => !near.includes(at))
        .forEach((at) =>
          spots.push({ kind: "ride", at, seat: riding, far: true }),
        );
    }
  } else if (
    seat !== null &&
    game.phase === "vote" &&
    game.vote !== null &&
    game.vote.stage !== "lay"
  ) {
    // Both halves of the round point at the same places on the board: where the
    // wagon could go. What a tap means is what the round is waiting for - a
    // vote for that position, or the wagon itself.
    const asking =
      game.vote.stage === "place"
        ? game.vote.decider
        : (game.vote.order[game.vote.step] ?? null);
    if (asking === seat) {
      wagonSpots(game).forEach((path) =>
        spots.push({
          kind: game.vote?.stage === "place" ? "wagon" : "voteAt",
          at: path,
        }),
      );
    }
  } else if (
    seat !== null &&
    game.phase === "event" &&
    asksForRoad(game, seat)
  ) {
    // An Erdbeben: the tap picks one of your own roads to lie down, so what
    // lights up is your network rather than the empty paths.
    game.roads.forEach((owner, path) => {
      if (owner === seat) {
        spots.push({ kind: "breakRoad", at: path });
      }
    });
  } else if (mine && game.phase === "neutral" && neutralColour !== null) {
    // One colour at a time. Every free crossing obeys the distance rule for
    // *both* neutral colours, so lighting both at once would make each tap
    // ambiguous - the colour is picked first, beside the board.
    neutralSpots(game, game.neutralBuild ?? "town")
      .filter((spot) => spot.seat === neutralColour)
      .forEach((spot) =>
        spots.push({
          kind: game.neutralBuild === "road" ? "neutralRoad" : "neutralTown",
          at: spot.at,
          seat: spot.seat,
        }),
      );
  } else if (game.phase === "displaced" && game.displaced !== null) {
    // The knight that was driven off, walking out from where it was pushed.
    // Its owner answers, and that is not the acting seat.
    const owner = game.garrison[game.displaced]?.owner ?? null;
    if (owner !== null && owner === seat) {
      retreatSpots(game, game.displaced, owner).forEach((to) =>
        spots.push({ kind: "march", at: to, seat: game.displaced ?? 0 }),
      );
    }
  } else if (mine && marching !== null && game.phase === "trade") {
    // A knight has been picked beside the board and the board now shows where
    // it could go. Picked first, moved second - for the same reason the neutral
    // colours are picked first: a tap on a crossing cannot say which knight.
    marchSpots(game, marching).forEach((to) =>
      spots.push({ kind: "march", at: to, seat: marching }),
    );
  } else if (mine && game.phase === "robber") {
    // Not simply "any other landscape": the friendly robber rules out the ones
    // beside a player who is still being spared, and the referee is the one
    // that knows which those are.
    robberSpots(game, game.robber).forEach((hex) =>
      spots.push({ kind: "robber", at: hex }),
    );
  } else if (mine && game.phase === "trade" && hand !== null) {
    if (covers(hand, CITY_COST)) {
      citySpots(game, seat).forEach((id) =>
        spots.push({ kind: "city", at: id }),
      );
    }
    if (covers(hand, TOWN_COST)) {
      townSpots(game, seat).forEach((id) =>
        spots.push({ kind: "town", at: id }),
      );
    }
    if (game.freeRoads > 0 || covers(hand, ROAD_COST)) {
      roadSpots(game, seat).forEach((id) =>
        spots.push({ kind: "road", at: id }),
      );
    }
    if (finding(game)) {
      if (covers(hand, BOAT_COST)) {
        boatSpots(game, seat).forEach((at) =>
          spots.push({ kind: "boatAt", at }),
        );
      }
      if (covers(hand, PORT_COST) && game.players[seat].portsLeft > 0) {
        game.towns.forEach((town, at) => {
          if (
            town !== null &&
            town.owner === seat &&
            town.port !== true &&
            portShore(game, at)
          ) {
            spots.push({ kind: "portAt", at });
          }
        });
      }
      if (
        camping(game) &&
        covers(hand, UNIT_COST) &&
        game.players[seat].unitsLeft > 0
      ) {
        portsOf(game, seat)
          .filter((at) => (game.docks[at] ?? []).length < 2)
          .forEach((at) => spots.push({ kind: "unitAt", at }));
      }
      if (covers(hand, SCOUT_COST) && game.players[seat].scoutsLeft > 0) {
        portsOf(game, seat)
          .filter((at) => (game.docks[at] ?? []).length === 0)
          .forEach((at) => spots.push({ kind: "scoutAt", at }));
      }
    }
    if (sailing(game) && (game.freeRoads > 0 || covers(hand, SHIP_COST))) {
      shipSpots(game, seat).forEach((id) =>
        spots.push({ kind: "ship", at: id }),
      );
    }
    if (sailing(game) && sailingShip !== null) {
      // A ship has been picked beside the board; now it says where it goes.
      shipSpots(
        {
          ...game,
          ships: game.ships.map((owner, path) =>
            path === sailingShip ? null : owner,
          ),
        },
        seat,
      ).forEach((id) =>
        spots.push({ kind: "sail", at: id, seat: sailingShip }),
      );
    }
    if (rivers(game) && covers(hand, BRIDGE_PRICE)) {
      bridgeSpots(game, seat).forEach((id) =>
        spots.push({ kind: "bridge", at: id }),
      );
    }
    if (playingRitter(game) && covers(hand, KNIGHT_COST)) {
      board.crossings.forEach((crossing) => {
        if (canKnight(game, seat, crossing.id)) {
          spots.push({ kind: "knight", at: crossing.id });
        }
      });
    }
  }
  return spots;
}

/** Whether the card on the table is asking this seat for one of their roads. */
function asksForRoad(game: CatanGame, seat: number): boolean {
  const kind = game.drawn?.kind;
  return (
    kind !== undefined && EVENT_ASK[kind] === "road" && game.owed[0] === seat
  );
}

/** What one tap turns into. */
function moveFor(spot: Spot): CatanMove {
  const moves: Readonly<Record<Spot["kind"], CatanMove>> = {
    town: { kind: "town", at: spot.at },
    road: { kind: "road", at: spot.at },
    bridge: { kind: "bridge", at: spot.at },
    voteAt: { kind: "vote", at: spot.at },
    post: { kind: "post", at: spot.at },
    barb: { kind: "barb", at: spot.at },
    // The knight riding travels in `seat`, the same way a march does.
    ride: { kind: "ride", from: spot.seat ?? 0, to: spot.at, far: spot.far },
    drive: { kind: "drive", at: spot.at },
    shift: { kind: "shift", at: spot.at },
    shoveAt: { kind: "shove", at: spot.at },
    ship: { kind: "ship", at: spot.at },
    // The ship being moved travels in `seat`, the way a march and a ride do.
    sail: { kind: "sail", from: spot.seat ?? 0, to: spot.at },
    pirateAt: { kind: "pirate", at: spot.at },
    boatAt: { kind: "boat", at: spot.at },
    scoutAt: { kind: "scout", at: spot.at },
    portAt: { kind: "port", at: spot.at },
    sailTo: { kind: "sail2", at: spot.at },
    landAt: { kind: "landfall", at: spot.at },
    loadAt: { kind: "load", at: spot.at },
    unitAt: { kind: "unit", at: spot.at },
    stormAt: { kind: "storm", at: spot.at },
    corsairAt: { kind: "corsair", at: spot.at },
    catchAt: { kind: "catch", at: spot.at },
    deliverAt: { kind: "deliver", at: spot.at },
    dropAt: { kind: "drop", at: spot.at },
    wagon: { kind: "wagon", at: spot.at },
    city: { kind: "city", at: spot.at },
    robber: { kind: "robber", at: spot.at },
    breakRoad: { kind: "event", at: spot.at },
    neutralTown: { kind: "neutral", seat: spot.seat ?? 0, at: spot.at },
    neutralRoad: { kind: "neutral", seat: spot.seat ?? 0, at: spot.at },
    knight: { kind: "knight", at: spot.at },
    // For a march the picked knight travels in `seat`, which is the only Spot
    // that means a crossing rather than a colour - the comment is on the field.
    march: { kind: "march", from: spot.seat ?? 0, to: spot.at },
  };
  return moves[spot.kind];
}

/**
 * A fishing ground: its number, out at sea beside the crossings it feeds.
 *
 * @param props - the game and the ground
 * @returns the marker
 * @remarks
 * Drawn **outside** the coast, in the water, because that is where it is on the
 * printed frame - and because the three crossings it feeds already have
 * buildings on them soon enough. The dots under the number are the ones every
 * other number on this board carries, so it reads as a number chip and not as
 * decoration.
 */
function Fishery({
  game,
  ground,
}: {
  readonly game: CatanGame;
  readonly ground: Ground;
}): ReactElement {
  const board = islandOf(game.land.length);
  const spots = ground.crossings.map((at) => crossPoint(board, at));
  const middleX = spots.reduce((sum, spot) => sum + spot.px, 0) / spots.length;
  const middleY = spots.reduce((sum, spot) => sum + spot.py, 0) / spots.length;
  // Pushed away from the island's centre, which is what puts it out to sea.
  const away = 20;
  const centre = hexPoint(board, Math.floor(board.hexes.length / 2));
  const dx = middleX - centre.px;
  const dy = middleY - centre.py;
  const len = Math.hypot(dx, dy) || 1;
  const px = middleX + (dx / len) * away;
  const py = middleY + (dy / len) * away;
  return (
    <g data-testid={`ct-fishery-${ground.number}`} pointerEvents="none">
      <title>{`Fischgrund ${ground.number}`}</title>
      {ground.crossings.map((at) => {
        const spot = crossPoint(board, at);
        return (
          <line
            key={at}
            x1={px}
            y1={py}
            x2={spot.px}
            y2={spot.py}
            stroke="#0f4c75"
            strokeWidth={1.2}
            opacity={0.5}
          />
        );
      })}
      <circle
        cx={px}
        cy={py}
        r={11}
        fill="#0f4c75"
        stroke="#f4ecd6"
        strokeWidth={1.5}
      />
      <text
        x={px}
        y={py + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={700}
        fill="#eaf4ff"
      >
        {ground.number}
      </text>
    </g>
  );
}

/**
 * A knight standing on a crossing.
 *
 * @param props - the game, the crossing and who is looking
 * @returns the piece
 * @remarks
 * A shield with as many notches as the knight has strength, which is how the
 * printed piece says it too - "die Stärke eines Ritters wird durch die Anzahl
 * der Spitzen an der Fahne dargestellt". Counting notches beats reading a
 * number on a board this size.
 *
 * An **awake** knight is drawn filled and a passive one hollow. That is the one
 * thing about a knight that changes every turn and decides whether it counts in
 * the raid, so it is the one thing the shape says at a glance.
 */
function KnightPiece({
  game,
  crossing,
  mySeat,
}: {
  readonly game: CatanGame;
  readonly crossing: number;
  readonly mySeat: number | null;
}): ReactElement {
  const knight = game.garrison[crossing];
  const { px, py } = crossPoint(islandOf(game.land.length), crossing);
  const owner = knight?.owner ?? 0;
  const ink = COLOUR_INK[game.players[owner].colour];
  const awake = knight?.active === true;
  const shield = `M ${px - 7} ${py - 7} L ${px + 7} ${py - 7} L ${px + 7} ${py + 1} L ${px} ${py + 8} L ${px - 7} ${py + 1} Z`;
  return (
    <g data-testid={`ct-knight-${crossing}`} pointerEvents="none">
      <path
        d={shield}
        fill={awake ? ink : "#ffffff"}
        stroke={owner === mySeat ? "#111827" : "#374151"}
        strokeWidth={owner === mySeat ? 2.5 : 1.5}
        strokeLinejoin="round"
      />
      {Array.from({ length: knight?.level ?? 1 }, (unused, notch) => (
        <circle
          key={notch}
          cx={px - 4 + notch * 4}
          cy={py - 3}
          r={1.4}
          fill={awake ? "#ffffff" : ink}
        />
      ))}
    </g>
  );
}

/** Which landscapes this seat has a building on. */
function myLands(game: CatanGame, seat: number | null): ReadonlySet<number> {
  const lands = new Set<number>();
  if (seat !== null) {
    islandOf(game.land.length).crossings.forEach((crossing) => {
      if (game.towns[crossing.id]?.owner === seat) {
        crossing.hexes.forEach((hex: number) => lands.add(hex));
      }
    });
  }
  return lands;
}

/** One landscape, with its chip and whatever stands on it. */
function Landscape({
  game,
  hex,
  lit,
  onTap,
}: {
  readonly game: CatanGame;
  readonly hex: number;
  readonly lit: boolean;
  readonly onTap: (() => void) | null;
}): ReactElement {
  const board = islandOf(game.land.length);
  const { px, py } = hexPoint(board, hex);
  const chip = game.chips[hex];
  const hot = HOT_CHIPS.includes(chip);
  const name =
    game.land[hex] === "see"
      ? `${LAND_NAMES.see} ${LAKE_NUMBERS.join(", ")}`
      : `${LAND_NAMES[game.land[hex]]}${chip === 0 ? "" : ` ${chip}`}`;
  return (
    <g
      data-testid={`ct-hex-${hex}`}
      onClick={onTap ?? undefined}
      className={onTap === null ? undefined : "cursor-pointer"}
    >
      <title>{name}</title>
      <polygon
        points={hexOutline(board, hex)}
        fill={LAND_INK[game.land[hex]]}
        stroke="#f4ecd6"
        strokeWidth={2}
      />
      {/* The water goes on the landscape and under its number chip: a river
          runs through the field, it does not cover up what the field pays. */}
      {game.rivers.hexes.includes(hex) && <River game={game} hex={hex} />}
      {(game.barbarians[hex] ?? 0) > 0 && <Barbarians game={game} hex={hex} />}
      {game.land[hex] === "ziel" && <Site game={game} hex={hex} />}
      {/* A Goldfluss looks a lot like a wheat field at a glance, and it pays
          something else entirely - so it says so. */}
      {campAt(game, hex) !== null && <PirateCamp game={game} hex={hex} />}
      {game.land[hex] === "fisch" && <FishGround game={game} hex={hex} />}
      {game.land[hex] === "gewuerz" && <Village game={game} hex={hex} />}
      {hex === game.council && <Council game={game} hex={hex} />}
      {game.land[hex] === "gold" && (
        <text
          x={px}
          y={py - 20}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fontWeight={700}
          fill="#4a3a12"
        >
          Goldfluss
        </text>
      )}
      {/* The lake carries four numbers rather than one chip, so it is drawn as
          four small ones in a square - which is how the tile is printed. */}
      {game.land[hex] === "see" && (
        <g>
          {LAKE_NUMBERS.map((number, at) => (
            <g key={number}>
              <circle
                cx={px + (at % 2 === 0 ? -9 : 9)}
                cy={py + (at < 2 ? -9 : 9)}
                r={8}
                fill="#f6eed6"
                stroke="#00000033"
              />
              <text
                x={px + (at % 2 === 0 ? -9 : 9)}
                y={py + (at < 2 ? -8 : 10)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontWeight={700}
                fill="#3d3325"
              >
                {number}
              </text>
            </g>
          ))}
        </g>
      )}
      {/* A conquered coast field has its chip turned over: "es gibt nun keine
          Erträge mehr für diese Landschaft". The blank back is the whole
          message, so the number goes away rather than being crossed out. */}
      {chip > 0 && conquered(game, hex) && (
        <g>
          <circle cx={px} cy={py} r={13} fill="#8d8378" stroke="#00000044" />
          <path
            d={`M ${px - 6} ${py - 6} L ${px + 6} ${py + 6} M ${px + 6} ${py - 6} L ${px - 6} ${py + 6}`}
            stroke="#3d3325"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      )}
      {chip > 0 && !conquered(game, hex) && (
        <g>
          <circle cx={px} cy={py} r={13} fill="#f6eed6" stroke="#00000033" />
          <text
            x={px}
            y={py + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={13}
            fontWeight={700}
            fill={hot ? "#b3261e" : "#3d3325"}
          >
            {chip}
          </text>
          <g fill={hot ? "#b3261e" : "#3d3325"}>
            {Array.from({ length: pips(chip) }, (unused, i) => (
              <circle
                key={i}
                cx={px + (i - (pips(chip) - 1) / 2) * 3}
                cy={py + 9}
                r={0.9}
              />
            ))}
          </g>
        </g>
      )}
      {lit && (
        <polygon
          points={hexOutline(board, hex)}
          fill="#ffffff"
          opacity={0.35}
          stroke="#111827"
          strokeWidth={2.5}
          strokeDasharray="5 4"
        />
      )}
      {game.robber === hex && <Robber x={px} y={py - (chip > 0 ? 22 : 0)} />}
    </g>
  );
}

/** The robber. */
function Robber({
  x,
  y,
}: {
  readonly x: number;
  readonly y: number;
}): ReactElement {
  return (
    <g data-testid="ct-robber" pointerEvents="none">
      <ellipse cx={x} cy={y + 6} rx={7} ry={3} fill="#00000055" />
      <path
        d={`M ${x - 6} ${y + 6} L ${x - 4} ${y - 4} A 4 4 0 0 1 ${x + 4} ${y - 4} L ${x + 6} ${y + 6} Z`}
        fill="#2b2b2b"
        stroke="#f4ecd6"
        strokeWidth={1.2}
      />
    </g>
  );
}

/** A harbour, drawn out on the water. */
function Dock({
  game,
  harbour,
}: {
  readonly game: CatanGame;
  readonly harbour: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const dock = game.harbours[harbour];
  const path = board.paths[dock.path];
  const a = crossPoint(board, path.ends[0]);
  const b = crossPoint(board, path.ends[1]);
  const mid = { px: (a.px + b.px) / 2, py: (a.py + b.py) / 2 };
  const from = hexPoint(board, path.hexes[0]);
  const away = Math.hypot(mid.px - from.px, mid.py - from.py) || 1;
  const out = {
    px: mid.px + ((mid.px - from.px) / away) * JETTY,
    py: mid.py + ((mid.py - from.py) / away) * JETTY,
  };
  const label = dock.want === null ? "3:1" : `2:1 ${SORT_NAMES[dock.want]}`;
  // The box grows with its text: "2:1 Getreide" is three times "3:1", and a
  // fixed box would either crop that or leave the short one swimming.
  const wide = LABEL_PAD + label.length * LETTER_WIDTH;
  return (
    <g data-testid={`ct-harbour-${harbour}`} pointerEvents="none">
      <line
        x1={a.px}
        y1={a.py}
        x2={out.px}
        y2={out.py}
        stroke="#a9803f"
        strokeWidth={2}
      />
      <line
        x1={b.px}
        y1={b.py}
        x2={out.px}
        y2={out.py}
        stroke="#a9803f"
        strokeWidth={2}
      />
      <rect
        x={out.px - wide / 2}
        y={out.py - 8}
        width={wide}
        height={16}
        rx={5}
        fill="#f6eed6"
        stroke="#a9803f"
      />
      <text
        x={out.px}
        y={out.py + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={8.5}
        fontWeight={700}
        fill="#5b4423"
      >
        {label}
      </text>
    </g>
  );
}

/** One road. */
function Road({
  game,
  path,
  mySeat,
}: {
  readonly game: CatanGame;
  readonly path: number;
  readonly mySeat: number | null;
}): ReactElement {
  const board = islandOf(game.land.length);
  const owner = game.roads[path] as number;
  const a = crossPoint(board, board.paths[path].ends[0]);
  const b = crossPoint(board, board.paths[path].ends[1]);
  const mine = owner === mySeat;
  return (
    <g data-testid={`ct-road-${path}`} pointerEvents="none">
      {mine && (
        <line
          x1={a.px}
          y1={a.py}
          x2={b.px}
          y2={b.py}
          stroke="#ffffff"
          strokeWidth={11}
          strokeLinecap="round"
        />
      )}
      <line
        x1={a.px}
        y1={a.py}
        x2={b.px}
        y2={b.py}
        stroke={COLOUR_INK[game.players[owner].colour]}
        strokeWidth={mine ? 7 : 6.5}
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * The water running through one river landscape.
 *
 * @param props - the game and the landscape
 * @returns the band of water
 * @remarks
 * A pointy-top hex has vertical left and right edges, and the river runs
 * straight through the middle from one to the other - so the band reaches from
 * the leftmost corner to the rightmost one, and the bands of two neighbouring
 * landscapes meet exactly on the edge they share. A **marsh** is the source, so
 * its water starts in the middle of the field rather than at its left edge:
 * drawing it right across would promise a crossing that is not there.
 */
function River({
  game,
  hex,
}: {
  readonly game: CatanGame;
  readonly hex: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const { px, py } = hexPoint(board, hex);
  const xs = board.hexes[hex].corners.map(
    (corner) => crossPoint(board, corner).px,
  );
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const source = game.rivers.marshes.includes(hex);
  return (
    <g pointerEvents="none" data-testid={`ct-river-${hex}`}>
      <line
        x1={source ? px : left}
        y1={py}
        x2={right}
        y2={py}
        stroke="#2f7fbf"
        strokeWidth={RIVER_WIDE}
        strokeLinecap="round"
      />
      <line
        x1={source ? px : left}
        y1={py}
        x2={right}
        y2={py}
        stroke="#7cc4ec"
        strokeWidth={RIVER_THIN}
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * One bridge.
 *
 * @param props - the game and the path
 * @returns the bridge
 * @remarks
 * Drawn as a deck with two planks rather than as a road in another colour,
 * because it is worth three gold and one of only three a player ever gets -
 * that should be visible at a glance from across the board.
 */
function Bridge({
  game,
  path,
}: {
  readonly game: CatanGame;
  readonly path: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const owner = game.bridges[path] as number;
  const a = crossPoint(board, board.paths[path].ends[0]);
  const b = crossPoint(board, board.paths[path].ends[1]);
  const mid = { px: (a.px + b.px) / 2, py: (a.py + b.py) / 2 };
  return (
    <g data-testid={`ct-bridge-${path}`} pointerEvents="none">
      <title>Brücke</title>
      <line
        x1={a.px}
        y1={a.py}
        x2={b.px}
        y2={b.py}
        stroke="#8b5a2b"
        strokeWidth={BRIDGE_DECK}
        strokeLinecap="butt"
      />
      <line
        x1={a.px}
        y1={a.py}
        x2={b.px}
        y2={b.py}
        stroke={COLOUR_INK[game.players[owner].colour]}
        strokeWidth={BRIDGE_RAIL}
        strokeLinecap="butt"
      />
      <circle cx={mid.px} cy={mid.py} r={BRIDGE_STUD} fill="#f4ecd6" />
    </g>
  );
}

/**
 * One wagon of a caravan.
 *
 * @param props - the game and the path it stands on
 * @returns the wagon
 * @remarks
 * Drawn across the middle of the path rather than along it, because that is
 * where it stands at a table: beside the road if there is one - "wird der
 * Trosswagen neben die Straße gestellt" - and never instead of it. A road and a
 * wagon share a path here as they share one on the board.
 */
function Wagon({
  game,
  path,
}: {
  readonly game: CatanGame;
  readonly path: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const a = crossPoint(board, board.paths[path].ends[0]);
  const b = crossPoint(board, board.paths[path].ends[1]);
  const px = (a.px + b.px) / 2;
  const py = (a.py + b.py) / 2;
  const turn = (Math.atan2(b.py - a.py, b.px - a.px) * 180) / Math.PI;
  return (
    <g
      data-testid={`ct-wagon-${path}`}
      pointerEvents="none"
      transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${turn.toFixed(1)})`}
    >
      <title>Trosswagen</title>
      {/* The canopy: a half-ellipse over a chassis, which is what a covered
          wagon looks like from the side and what the printed piece shows. */}
      <path
        d={`M ${-WAGON_LONG / 2} ${-WAGON_LIFT} a ${WAGON_LONG / 2} ${WAGON_HIGH} 0 0 0 ${WAGON_LONG} 0 z`}
        fill="#f8f1de"
        stroke="#4a3a22"
        strokeWidth={1.6}
      />
      <rect
        x={-WAGON_LONG / 2}
        y={-WAGON_LIFT}
        width={WAGON_LONG}
        height={WAGON_LIFT}
        fill="#8b5a2b"
        stroke="#4a3a22"
        strokeWidth={1.2}
      />
      <circle
        cx={-WAGON_LONG / 3}
        cy={0}
        r={WAGON_WHEEL}
        fill="#4a3a22"
        stroke="#f8f1de"
        strokeWidth={1}
      />
      <circle
        cx={WAGON_LONG / 3}
        cy={0}
        r={WAGON_WHEEL}
        fill="#4a3a22"
        stroke="#f8f1de"
        strokeWidth={1}
      />
    </g>
  );
}

/**
 * The three arrows the caravans set out along.
 *
 * @param props - the game
 * @returns the arrows still waiting for their first wagon
 * @remarks
 * "Der erste Trosswagen eines Handelstrosses muss auf einen Weg gestellt
 * werden, auf den ein Pfeil der Wasserstelle in gerader Linie zeigt." An arrow
 * that has been used is gone: the caravan has set out and grows at its head
 * from then on, so drawing it would point at a rule that no longer applies.
 */
function Arrows({ game }: { readonly game: CatanGame }): ReactElement {
  return (
    <g pointerEvents="none">
      {game.trail.arrows.map((path, which) =>
        game.caravans[which]?.paths.length !== 0 ? null : (
          <Arrow
            key={path}
            game={game}
            gate={game.trail.gates[which]}
            path={path}
          />
        ),
      )}
    </g>
  );
}

/** One arrow, from a corner of the watering hole out along its path. */
function Arrow({
  game,
  gate,
  path,
}: {
  readonly game: CatanGame;
  readonly gate: number;
  readonly path: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const from = crossPoint(board, gate);
  const ends = board.paths[path].ends;
  const to = crossPoint(board, ends[0] === gate ? ends[1] : ends[0]);
  const turn = (Math.atan2(to.py - from.py, to.px - from.px) * 180) / Math.PI;
  const px = from.px + (to.px - from.px) * ARROW_OUT;
  const py = from.py + (to.py - from.py) * ARROW_OUT;
  return (
    <g
      data-testid={`ct-arrow-${path}`}
      transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${turn.toFixed(1)})`}
    >
      <title>Hier setzt ein Handelstross an</title>
      <polygon
        points={`${ARROW_WIDE},0 ${-ARROW_WIDE / 2},${ARROW_WIDE * 0.7} ${-ARROW_WIDE / 2},${-ARROW_WIDE * 0.7}`}
        fill="#f8f1de"
        stroke="#4a3a22"
        strokeWidth={1.4}
      />
    </g>
  );
}

/**
 * The barbarians standing on one landscape.
 *
 * @param props - the game and the landscape
 * @returns up to three of them in a row
 * @remarks
 * Drawn below the number chip rather than over it, because the chip is what
 * says whether the field still pays - and on a field with three of them the
 * chip is turned over, which is the whole point of the third one.
 */
function Barbarians({
  game,
  hex,
}: {
  readonly game: CatanGame;
  readonly hex: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const { px, py } = hexPoint(board, hex);
  const count = game.barbarians[hex] ?? 0;
  return (
    <g pointerEvents="none" data-testid={`ct-barb-${hex}`}>
      <title>{`${count} Barbar(en)`}</title>
      {Array.from({ length: count }, (unused, at) => (
        <g
          key={at}
          transform={`translate(${(px + (at - (count - 1) / 2) * BARB_GAP).toFixed(1)} ${(py + BARB_DROP).toFixed(1)})`}
        >
          <path
            d={`M ${-BARB_WIDE / 2} 0 L ${-BARB_WIDE / 2} ${-BARB_HIGH * 0.55} A ${BARB_WIDE / 2} ${BARB_WIDE / 2} 0 0 1 ${BARB_WIDE / 2} ${-BARB_HIGH * 0.55} L ${BARB_WIDE / 2} 0 z`}
            fill="#3b2b20"
            stroke="#f4ecd6"
            strokeWidth={1.1}
          />
          <circle
            cx={0}
            cy={-BARB_HIGH * 0.72}
            r={BARB_WIDE / 2.4}
            fill="#3b2b20"
            stroke="#f4ecd6"
            strokeWidth={1.1}
          />
        </g>
      ))}
    </g>
  );
}

/**
 * One knight, on the path it stands on.
 *
 * @param props - the game, the path, and whether it is picked to ride
 * @returns a shield in its owner's colour
 * @remarks
 * A shield rather than the crossing-piece Städte & Ritter uses, because these
 * knights stand on **paths**: two different expansions, two different pieces,
 * and nothing on the board should have to be read twice.
 */
function Guard({
  game,
  path,
  picked,
}: {
  readonly game: CatanGame;
  readonly path: number;
  readonly picked: boolean;
}): ReactElement {
  const board = islandOf(game.land.length);
  const owner = game.guards[path] as number;
  const a = crossPoint(board, board.paths[path].ends[0]);
  const b = crossPoint(board, board.paths[path].ends[1]);
  const px = (a.px + b.px) / 2;
  const py = (a.py + b.py) / 2;
  return (
    <g
      data-testid={`ct-guard-${path}`}
      pointerEvents="none"
      transform={`translate(${px.toFixed(1)} ${py.toFixed(1)})`}
    >
      <title>Ritter</title>
      <path
        d={`M ${-GUARD_SIZE} ${-GUARD_SIZE} L ${GUARD_SIZE} ${-GUARD_SIZE} L ${GUARD_SIZE} ${GUARD_SIZE * 0.2} Q 0 ${GUARD_SIZE * 1.4} ${-GUARD_SIZE} ${GUARD_SIZE * 0.2} z`}
        fill={COLOUR_INK[game.players[owner].colour]}
        stroke={picked ? "#ffffff" : "#1f2937"}
        strokeWidth={picked ? 3 : 1.6}
      />
    </g>
  );
}

/**
 * One of the three sites, and the crossing its building stands on.
 *
 * @param props - the game and the site
 * @returns the name on the field and the marker on its gate
 * @remarks
 * The name is written on the field because a load says where it has to go by
 * naming a site, and a player should not have to remember which brown hex was
 * the glassworks. The marker sits on the gate, which is the crossing a wagon
 * has to reach and nobody may build on.
 */
function Site({
  game,
  hex,
}: {
  readonly game: CatanGame;
  readonly hex: number;
}): ReactElement | null {
  const board = islandOf(game.land.length);
  const depot = game.depots.find((each) => each.hex === hex);
  const { px, py } = hexPoint(board, hex);
  const gate = depot === undefined ? null : crossPoint(board, depot.gate);
  return depot === undefined ? null : (
    <g pointerEvents="none" data-testid={`ct-site-${depot.target}`}>
      <title>{TARGET_NAMES[depot.target]}</title>
      <text
        x={px}
        y={py}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={700}
        fill="#3d2b16"
      >
        {TARGET_SHORT[depot.target]}
      </text>
      <text
        x={px}
        y={py + 14}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={9}
        fill="#3d2b16"
      >
        {depot.stack.length}
      </text>
      {gate !== null && (
        <g>
          {/* The building on the site's own crossing: a roof over a house, so
              it reads as a place a wagon delivers to and not as a piece. */}
          <rect
            x={gate.px - SITE_MARK / 2}
            y={gate.py - SITE_MARK / 4}
            width={SITE_MARK}
            height={SITE_MARK * 0.75}
            rx={1.5}
            fill="#f4ecd6"
            stroke="#3d2b16"
            strokeWidth={2}
          />
          <path
            d={`M ${gate.px - SITE_MARK * 0.65} ${gate.py - SITE_MARK / 4} L ${gate.px} ${gate.py - SITE_MARK * 0.85} L ${gate.px + SITE_MARK * 0.65} ${gate.py - SITE_MARK / 4} z`}
            fill="#3d2b16"
            stroke="#f4ecd6"
            strokeWidth={1.5}
          />
        </g>
      )}
    </g>
  );
}

/** One of the three barbarians left over, sitting on a path. */
function Raider({
  game,
  path,
}: {
  readonly game: CatanGame;
  readonly path: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const a = crossPoint(board, board.paths[path].ends[0]);
  const b = crossPoint(board, board.paths[path].ends[1]);
  return (
    <g pointerEvents="none" data-testid={`ct-raider-${path}`}>
      <title>Barbar</title>
      <circle
        cx={(a.px + b.px) / 2}
        cy={(a.py + b.py) / 2}
        r={RAIDER_SIZE}
        fill="#3b2b20"
        stroke="#f4ecd6"
        strokeWidth={2}
      />
    </g>
  );
}

/**
 * One Trosswagen, on the crossing it stands on.
 *
 * @remarks
 * The same covered wagon the caravans use, drawn smaller and tinted in its
 * owner's colour - one wagon, two scenarios, and a player who has seen the one
 * knows the other at a glance.
 */
function Hauler({
  game,
  seat,
}: {
  readonly game: CatanGame;
  readonly seat: number;
}): ReactElement | null {
  const board = islandOf(game.land.length);
  const at = game.players[seat].wagon;
  const spot = at === null ? null : crossPoint(board, at);
  return spot === null ? null : (
    <g
      pointerEvents="none"
      data-testid={`ct-hauler-${seat}`}
      transform={`translate(${spot.px.toFixed(1)} ${(spot.py - WAGON_HIGH).toFixed(1)}) scale(${HAULER_SIZE})`}
    >
      <title>{`Trosswagen ${game.players[seat].name}`}</title>
      {/* A white halo, so a wagon standing on a settlement is still one
          shape and not two overlapping ones. */}
      <path
        d={`M ${-WAGON_LONG / 2} ${-WAGON_LIFT} a ${WAGON_LONG / 2} ${WAGON_HIGH} 0 0 0 ${WAGON_LONG} 0 z`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={5}
      />
      <path
        d={`M ${-WAGON_LONG / 2} ${-WAGON_LIFT} a ${WAGON_LONG / 2} ${WAGON_HIGH} 0 0 0 ${WAGON_LONG} 0 z`}
        fill="#f8f1de"
        stroke="#4a3a22"
        strokeWidth={2}
      />
      <rect
        x={-WAGON_LONG / 2}
        y={-WAGON_LIFT}
        width={WAGON_LONG}
        height={WAGON_LIFT}
        fill={COLOUR_INK[game.players[seat].colour]}
        stroke="#4a3a22"
        strokeWidth={1.4}
      />
      <circle cx={-WAGON_LONG / 3} cy={0} r={WAGON_WHEEL} fill="#4a3a22" />
      <circle cx={WAGON_LONG / 3} cy={0} r={WAGON_WHEEL} fill="#4a3a22" />
    </g>
  );
}

/**
 * One ship, on the water path it lies on.
 *
 * @param props - the game, the path, and whether it is picked to be moved
 * @returns a hull with a sail
 * @remarks
 * Drawn across the path rather than along it, because that is how a ship sits
 * at a table - and because a road and a ship must never be mistaken for one
 * another when they meet at the same settlement.
 */
function Ship({
  game,
  path,
  mySeat,
  picked,
}: {
  readonly game: CatanGame;
  readonly path: number;
  readonly mySeat: number | null;
  readonly picked: boolean;
}): ReactElement {
  const board = islandOf(game.land.length);
  const owner = game.ships[path] as number;
  const a = crossPoint(board, board.paths[path].ends[0]);
  const b = crossPoint(board, board.paths[path].ends[1]);
  const px = (a.px + b.px) / 2;
  const py = (a.py + b.py) / 2;
  const turn = (Math.atan2(b.py - a.py, b.px - a.px) * 180) / Math.PI;
  const ink = COLOUR_INK[game.players[owner].colour];
  return (
    <g
      data-testid={`ct-ship-${path}`}
      pointerEvents="none"
      transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${turn.toFixed(1)})`}
    >
      <title>{`Schiff ${game.players[owner].name}`}</title>
      {/* The hull, along the path; the sail across it. */}
      <path
        d={`M ${-SHIP_HULL} -2 L ${SHIP_HULL} -2 L ${SHIP_HULL * 0.6} 4 L ${-SHIP_HULL * 0.6} 4 z`}
        fill={ink}
        stroke={picked || owner === mySeat ? "#ffffff" : "#1f2937"}
        strokeWidth={picked ? 3 : 1.6}
      />
      <path
        d={`M 0 -2 L 0 ${-SHIP_MAST} L ${SHIP_MAST * 0.75} ${-SHIP_MAST * 0.45} z`}
        fill="#f8f1de"
        stroke="#1f2937"
        strokeWidth={1.4}
      />
    </g>
  );
}

/** The Seeräuber, on the sea field it is sitting on. */
function Pirate({
  game,
  hex,
}: {
  readonly game: CatanGame;
  readonly hex: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const { px, py } = hexPoint(board, hex);
  return (
    <g pointerEvents="none" data-testid="ct-pirate">
      <title>Seeräuber</title>
      <circle
        cx={px}
        cy={py}
        r={PIRATE_SIZE / 2}
        fill="#1f2937"
        stroke="#f4ecd6"
        strokeWidth={2}
      />
      <path
        d={`M ${px - 4} ${py - 1} l 8 0 M ${px} ${py - 5} l 0 8`}
        stroke="#f4ecd6"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * One ship of *Entdecker & Piraten*, on the sea path it lies on.
 *
 * @param props - the game, the ship, and whether it is the one at the helm
 * @returns a hull with a sail, and a dot for what it is carrying
 * @remarks
 * Drawn along the path rather than across it, because a ship here **points**:
 * its bow and its stern are what decide what it can turn over and where it can
 * put an explorer ashore. Two may share a path, so the second is nudged aside.
 */
function Explorer({
  game,
  which,
  picked,
}: {
  readonly game: CatanGame;
  readonly which: number;
  readonly picked: boolean;
}): ReactElement {
  const board = islandOf(game.land.length);
  const boat = game.boats[which];
  const a = crossPoint(board, board.paths[boat.at].ends[0]);
  const b = crossPoint(board, board.paths[boat.at].ends[1]);
  const same = game.boats.filter((each) => each.at === boat.at);
  const slot = same.indexOf(boat);
  const turn = (Math.atan2(b.py - a.py, b.px - a.px) * 180) / Math.PI;
  const px = (a.px + b.px) / 2;
  const py = (a.py + b.py) / 2 + (slot === 0 ? 0 : BOAT_HULL * 0.7);
  const ink = COLOUR_INK[game.players[boat.owner].colour];
  return (
    <g
      data-testid={`ct-boat-${which}`}
      pointerEvents="none"
      transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${turn.toFixed(1)})`}
    >
      <title>{`Schiff ${game.players[boat.owner].name}`}</title>
      <path
        d={`M ${-BOAT_HULL} -1 L ${BOAT_HULL} -1 L ${BOAT_HULL * 0.55} 5 L ${-BOAT_HULL * 0.55} 5 z`}
        fill={ink}
        stroke={picked ? "#ffffff" : "#1f2937"}
        strokeWidth={picked ? 3 : 1.5}
      />
      <path
        d={`M 0 -1 L 0 ${-BOAT_SAIL} L ${BOAT_SAIL * 0.7} ${-BOAT_SAIL * 0.4} z`}
        fill="#f8f1de"
        stroke="#1f2937"
        strokeWidth={1.3}
      />
      {boat.hold.length > 0 && (
        <circle
          cx={-BOAT_HULL * 0.5}
          cy={2}
          r={HOLD_DOT}
          // A shoal fills the whole hold, so it is worth seeing which cargo a
          // ship is carrying without counting anything.
          fill={boat.hold.includes("fisch") ? "#8ecae6" : "#f8f1de"}
          stroke="#1f2937"
          strokeWidth={1.2}
        />
      )}
    </g>
  );
}

/** The invisible circle that makes a piece tappable - see {@link TAP_AREA}. */
function TapSpot({
  game,
  path,
}: {
  readonly game: CatanGame;
  readonly path: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const a = crossPoint(board, board.paths[path].ends[0]);
  const b = crossPoint(board, board.paths[path].ends[1]);
  return (
    <circle
      cx={(a.px + b.px) / 2}
      cy={(a.py + b.py) / 2}
      r={TAP_AREA}
      fill="transparent"
    />
  );
}

/**
 * One pirate camp, on the Goldflussfeld it sits on.
 *
 * @param props - the game and the field
 * @returns the camp, with a mark for every unit standing on it
 * @remarks
 * Drawn below the number chip so it never hides what the field pays, and it
 * stays on the board once taken: a flipped camp is what says the field is open
 * again, and where the mission's points came from.
 */
function PirateCamp({
  game,
  hex,
}: {
  readonly game: CatanGame;
  readonly hex: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const { px, py } = hexPoint(board, hex);
  const camp = campAt(game, hex);
  const held = camp?.taken === true;
  return (
    <g pointerEvents="none" data-testid={`ct-camp-${hex}`}>
      <title>{held ? "Erobertes Piratenlager" : "Piratenlager"}</title>
      <rect
        x={px - CAMP_WIDE / 2}
        y={py + CAMP_DROP}
        width={CAMP_WIDE}
        height={CAMP_HIGH}
        rx={2}
        fill={held ? "#8d8378" : "#3b2b20"}
        stroke="#f4ecd6"
        strokeWidth={1.6}
      />
      {Array.from({ length: camp?.units.length ?? 0 }, (unused, at) => (
        <circle
          key={at}
          cx={px + (at - (CAMP_UNITS - 1) / 2) * CAMP_DOT * 2.4}
          cy={py + CAMP_DROP + CAMP_HIGH / 2}
          r={CAMP_DOT}
          fill={COLOUR_INK[game.players[camp?.units[at] ?? 0].colour]}
          stroke="#f4ecd6"
          strokeWidth={1}
        />
      ))}
    </g>
  );
}

/** The one pirate ship, on the sea field it is blockading. */
function Corsair({ game }: { readonly game: CatanGame }): ReactElement | null {
  const board = islandOf(game.land.length);
  const ship = game.pirateShip;
  const spot = ship === null ? null : hexPoint(board, ship.hex);
  return ship === null || spot === null ? null : (
    <g pointerEvents="none" data-testid="ct-corsair">
      <title>{`Piratenschiff ${game.players[ship.owner].name}`}</title>
      <circle
        cx={spot.px}
        cy={spot.py + CORSAIR_DROP}
        r={CORSAIR_SIZE}
        fill="#1f2937"
        stroke={COLOUR_INK[game.players[ship.owner].colour]}
        strokeWidth={3}
      />
      <path
        d={`M ${spot.px - 5} ${spot.py + 3 + CORSAIR_DROP} l 10 0 M ${spot.px} ${spot.py - 6 + CORSAIR_DROP} l 0 9`}
        stroke="#f8f1de"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * A Fischfeld: the die number it answers to, and the shoal lying on it.
 *
 * @param props - the game and the field
 * @returns the number and, when one is there, the shoal
 * @remarks
 * The number is drawn as a die pip square rather than as a chip, because that
 * is what it is: one die of 1 to 6 called in the movement phase, not one of the
 * two that pay resources. Confusing the two would be the whole misunderstanding
 * of this mission.
 */
function FishGround({
  game,
  hex,
}: {
  readonly game: CatanGame;
  readonly hex: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const { px, py } = hexPoint(board, hex);
  const number = game.fish[hex] ?? 0;
  return (
    <g pointerEvents="none" data-testid={`ct-fish-${hex}`}>
      <title>{`Fischfeld ${number}`}</title>
      <rect
        x={px - FISH_DIE / 2}
        y={py - FISH_DIE / 2 - FISH_LIFT}
        width={FISH_DIE}
        height={FISH_DIE}
        rx={4}
        fill="#f8f1de"
        stroke="#1f2937"
        strokeWidth={1.4}
      />
      <text
        x={px}
        y={py - FISH_LIFT}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={700}
        fill="#1f2937"
      >
        {number}
      </text>
      {shoalAt(game, hex) && <Shoal px={px} py={py + FISH_LIFT} />}
    </g>
  );
}

/** One shoal of fish, on the water or in a hold. */
function Shoal({
  px,
  py,
}: {
  readonly px: number;
  readonly py: number;
}): ReactElement {
  return (
    <g pointerEvents="none">
      <path
        d={`M ${px - 9} ${py} q 9 -7 18 0 q -9 7 -18 0 Z`}
        fill="#e8f4ff"
        stroke="#123a52"
        strokeWidth={1.4}
      />
      <path
        d={`M ${px + 9} ${py} l 5 -4 l 0 8 Z`}
        fill="#e8f4ff"
        stroke="#123a52"
        strokeWidth={1.2}
      />
    </g>
  );
}

/**
 * The Catanischer Rat, with an anchor at each of its two harbours.
 *
 * @param props - the game and the field
 * @returns the base and its two anchors
 */
function Council({
  game,
  hex,
}: {
  readonly game: CatanGame;
  readonly hex: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const { px, py } = hexPoint(board, hex);
  return (
    <g pointerEvents="none" data-testid={`ct-council-${hex}`}>
      <title>Catanischer Rat</title>
      <circle
        cx={px}
        cy={py}
        r={COUNCIL_SIZE}
        fill="#cbb994"
        stroke="#f4ecd6"
        strokeWidth={2}
      />
      <text
        x={px}
        y={py}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={8}
        fontWeight={700}
        fill="#3b2b20"
      >
        Rat
      </text>
      {councilDocks(game).map((corner) => {
        const spot = crossPoint(board, corner);
        return (
          <g key={corner}>
            <circle
              cx={spot.px}
              cy={spot.py}
              r={ANCHOR_SIZE}
              fill="#f8f1de"
              stroke="#123a52"
              strokeWidth={1.6}
            />
            <path
              d={`M ${spot.px} ${spot.py - 4} l 0 7 M ${spot.px - 3} ${spot.py + 1} l 6 0 M ${spot.px - 3} ${spot.py + 3} q 3 3 6 0`}
              stroke="#123a52"
              strokeWidth={1.3}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
}

/**
 * A Gewürzfeld: its village, the sacks still lying there, and what it gives.
 *
 * @param props - the game and the field
 * @returns the village, its stock and the units standing on it
 * @remarks
 * The advantage is written out rather than drawn as the printed symbol: three
 * of them and two of each, and a player has to be able to tell at a glance
 * which island is worth the voyage.
 */
function Village({
  game,
  hex,
}: {
  readonly game: CatanGame;
  readonly hex: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const { px, py } = hexPoint(board, hex);
  const gift = game.spice[hex];
  const left = game.sacks[hex] ?? 0;
  const here = game.villages[hex] ?? [];
  return (
    <g pointerEvents="none" data-testid={`ct-village-${hex}`}>
      <title>{`Gewürzfeld - ${gift === undefined ? "Dorf" : SPICE_LABELS[gift]}`}</title>
      <rect
        x={px - VILLAGE_WIDE / 2}
        y={py - VILLAGE_HIGH / 2}
        width={VILLAGE_WIDE}
        height={VILLAGE_HIGH}
        rx={3}
        fill="#f4ecd6"
        stroke="#3b2b20"
        strokeWidth={1.6}
      />
      <text
        x={px}
        y={py - 4}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={8}
        fontWeight={700}
        fill="#3b2b20"
      >
        {gift === undefined ? "Dorf" : SPICE_LABELS[gift]}
      </text>
      <text
        x={px}
        y={py + 6}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={8}
        fill="#3b2b20"
      >
        {`${left} Sack`}
      </text>
      {here.map((seat, at) => (
        <circle
          key={`${seat}-${at}`}
          cx={px - VILLAGE_WIDE / 2 + 5 + at * VILLAGE_DOT * 2.4}
          cy={py + VILLAGE_HIGH / 2 + VILLAGE_DOT + 1}
          r={VILLAGE_DOT}
          fill={COLOUR_INK[game.players[seat].colour]}
          stroke="#f4ecd6"
          strokeWidth={1}
        />
      ))}
    </g>
  );
}

/**
 * A gift of the forgotten tribe, on the coastline it lies on.
 *
 * @param props - the game, the sea path and what lies there
 * @returns the marker, with a letter for what it is
 * @remarks
 * Drawn on the path rather than beside it, because that is where it is taken
 * from: a ship built or moved onto this very edge picks it up.
 */
function Present({
  game,
  path,
  gift,
}: {
  readonly game: CatanGame;
  readonly path: number;
  readonly gift: Gift;
}): ReactElement {
  const board = islandOf(game.land.length);
  const a = crossPoint(board, board.paths[path].ends[0]);
  const b = crossPoint(board, board.paths[path].ends[1]);
  const px = (a.px + b.px) / 2;
  const py = (a.py + b.py) / 2;
  const name =
    gift.kind === "chip"
      ? "Siegpunkt-Chip"
      : gift.kind === "card"
        ? "Entwicklungskarte"
        : `Hafen ${gift.want === null ? "3:1" : `2:1 ${SORT_NAMES[gift.want]}`}`;
  return (
    <g pointerEvents="none" data-testid={`ct-gift-${path}`}>
      <title>{`Geschenk: ${name}`}</title>
      <circle
        cx={px}
        cy={py}
        r={GIFT_SIZE}
        fill="#f8f1de"
        stroke="#7a5a86"
        strokeWidth={2}
      />
      <text
        x={px}
        y={py}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={9}
        fontWeight={700}
        fill="#4a2f57"
      >
        {gift.kind === "chip" ? "SP" : gift.kind === "card" ? "EK" : "H"}
      </text>
    </g>
  );
}

/**
 * A village of the forgotten tribe, on the crossing it stands on.
 *
 * @param props - the game, the crossing and the village
 * @returns its number and how much cloth is left there
 * @remarks
 * "Auf die 4 kleinen Inseln legt ihr je 2 Zahlenchips, genau auf die Kreuzung
 * (jeder Zahlenchip stellt ein Dorf dar)" - so it is drawn as a chip on a
 * crossing, with the bales counted beneath it. An empty village keeps its
 * number and pays nobody, which is why the count is worth seeing.
 */
function ClothVillage({
  game,
  at,
  village,
}: {
  readonly game: CatanGame;
  readonly at: number;
  readonly village: { readonly number: number; readonly bales: number };
}): ReactElement {
  const board = islandOf(game.land.length);
  const { px, py } = crossPoint(board, at);
  return (
    <g pointerEvents="none" data-testid={`ct-village-${at}`}>
      <title>{`Dorf ${village.number} - ${village.bales} Stoffballen`}</title>
      <circle
        cx={px}
        cy={py}
        r={VILLAGE_CHIP}
        fill="#f4ecd6"
        stroke="#7a5a86"
        strokeWidth={2}
      />
      <text
        x={px}
        y={py - 3}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight={700}
        fill="#3b2b20"
      >
        {village.number}
      </text>
      <text
        x={px}
        y={py + 6}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={7}
        fill={village.bales === 0 ? "#a13c3c" : "#4a2f57"}
      >
        {village.bales}
      </text>
    </g>
  );
}

/**
 * A pirate fortress, with the chips it still stands on.
 *
 * @param props - the game, the crossing and the fortress
 * @returns the marker, or nothing once the fortress has fallen
 */
function Fortress({
  game,
  at,
  fort,
}: {
  readonly game: CatanGame;
  readonly at: number;
  readonly fort: { readonly owner: number; readonly chips: number };
}): ReactElement | null {
  const board = islandOf(game.land.length);
  const { px, py } = crossPoint(board, at);
  return fort.chips === 0 ? null : (
    <g pointerEvents="none" data-testid={`ct-fort-${at}`}>
      <title>{`Piratenfestung ${game.players[fort.owner].name} - ${fort.chips} Chips`}</title>
      {Array.from({ length: fort.chips }, (unused, step) => (
        <rect
          key={step}
          x={px - FORT_WIDE / 2}
          y={py + FORT_DROP + step * FORT_STEP}
          width={FORT_WIDE}
          height={FORT_STEP - 1}
          rx={1}
          fill={COLOUR_INK[game.players[fort.owner].colour]}
          stroke="#1f2937"
          strokeWidth={1}
        />
      ))}
    </g>
  );
}

/** The pirate fleet, on the sea field of its circuit it has reached. */
function Armada({ game }: { readonly game: CatanGame }): ReactElement | null {
  const board = islandOf(game.land.length);
  const ring = fleetRing(board);
  const hex = ring[game.armada % ring.length];
  if (hex === undefined) {
    return null;
  }
  const { px, py } = hexPoint(board, hex);
  return (
    <g pointerEvents="none" data-testid="ct-armada">
      <title>Piratenflotte</title>
      <circle
        cx={px}
        cy={py}
        r={ARMADA_SIZE}
        fill="#1f2937"
        stroke="#f8f1de"
        strokeWidth={2}
      />
      <path
        d={`M ${px - 6} ${py + 3} l 12 0 M ${px} ${py - 7} l 0 10`}
        stroke="#f8f1de"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </g>
  );
}

/** One settlement or city. */
function Building({
  game,
  crossing,
  mySeat,
}: {
  readonly game: CatanGame;
  readonly crossing: number;
  readonly mySeat: number | null;
}): ReactElement {
  const town = game.towns[crossing];
  const { px, py } = crossPoint(islandOf(game.land.length), crossing);
  const owner = town?.owner ?? 0;
  const mine = owner === mySeat;
  const ink = COLOUR_INK[game.players[owner].colour];
  const big = town?.city === true;
  const shape = big
    ? `M ${px - 11} ${py + 7} L ${px - 11} ${py - 2} L ${px - 4} ${py - 8} L ${px + 3} ${py - 2} L ${px + 3} ${py - 6} L ${px + 11} ${py - 6} L ${px + 11} ${py + 7} Z`
    : `M ${px - 7} ${py + 6} L ${px - 7} ${py - 1} L ${px} ${py - 8} L ${px + 7} ${py - 1} L ${px + 7} ${py + 6} Z`;
  // "Als Zeichen, dass eine Siedlung bzw. Stadt erobert wurde, legst du sie auf
  // der Kreuzung auf die Seite." A piece on its side is what the table does,
  // and it says at a glance which buildings have stopped counting.
  const toppled = overrun(game, crossing);
  return (
    <g
      data-testid={`ct-town-${crossing}`}
      pointerEvents="none"
      opacity={toppled ? 0.75 : 1}
      transform={
        toppled ? `rotate(90 ${px.toFixed(1)} ${py.toFixed(1)})` : undefined
      }
    >
      {mine && (
        <path
          d={shape}
          fill="none"
          stroke="#ffffff"
          strokeWidth={5}
          strokeLinejoin="round"
        />
      )}
      {mine && (
        <path
          d={shape}
          fill="none"
          stroke="#111827"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}
      <path
        d={shape}
        fill={ink}
        stroke="#1f2937"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </g>
  );
}

/**
 * The island.
 *
 * @param props - the game, which seat is looking, and where moves go
 * @returns the board
 */
export function CatanBoard({
  game,
  mySeat,
  onMove,
  neutralColour = null,
  marching = null,
  riding = null,
  onRide,
  sailingShip = null,
  onSail,
}: {
  readonly game: CatanGame;
  readonly mySeat: number | null;
  readonly onMove: (move: CatanMove) => void;
  /** *CATAN für Zwei*: which neutral colour the free piece is going in. */
  readonly neutralColour?: number | null;
  /** *Städte & Ritter*: the crossing of the knight picked to be marched. */
  readonly marching?: number | null;
  /** *Der Barbarenüberfall*: the path of the knight picked to ride. */
  readonly riding?: number | null;
  /** Picking that knight, by tapping it on the board. */
  readonly onRide?: (at: number | null) => void;
  /** *Seefahrer*: the path of the ship picked to be moved. */
  readonly sailingShip?: number | null;
  /** Picking that ship, by tapping it on the board. */
  readonly onSail?: (at: number | null) => void;
}): ReactElement {
  const spots = tappable(
    game,
    mySeat,
    neutralColour,
    marching,
    riding,
    sailingShip,
  );
  const loose = mySeat === null ? [] : looseShips(game, mySeat);
  // Everything that is answered by tapping a **field** rather than a crossing
  // or an edge - and through moveFor, like the other two, so a new one is
  // taught in one place. Storming a camp and setting a pirate ship down were
  // added without this and lit nothing at all.
  const litFields = spots.filter((s) => HEX_SPOTS.includes(s.kind));
  const litHex = new Map(litFields.map((s) => [s.at, s]));
  const litPaths = spots.filter(
    (s) =>
      s.kind === "road" ||
      s.kind === "breakRoad" ||
      s.kind === "neutralRoad" ||
      s.kind === "bridge" ||
      s.kind === "voteAt" ||
      s.kind === "wagon" ||
      s.kind === "post" ||
      s.kind === "ride" ||
      s.kind === "shift" ||
      s.kind === "shoveAt" ||
      s.kind === "ship" ||
      s.kind === "sail" ||
      s.kind === "boatAt" ||
      s.kind === "sailTo",
  );
  const litCross = spots.filter(
    (s) =>
      s.kind === "town" ||
      s.kind === "city" ||
      s.kind === "neutralTown" ||
      s.kind === "drive" ||
      s.kind === "scoutAt" ||
      s.kind === "unitAt" ||
      s.kind === "deliverAt" ||
      s.kind === "portAt" ||
      s.kind === "landAt" ||
      s.kind === "loadAt",
  );
  const tinted = myLands(game, mySeat);
  const board = islandOf(game.land.length);
  // The crossings reach five half-widths across and eight half-heights down,
  // and the harbours sit a jetty further out again.
  // Measured off the board rather than assumed, because the six-handed island
  // is two rows taller and one column wider than the printed one.
  const reachX = Math.max(...board.crossings.map((c) => Math.abs(c.x)));
  const reachY = Math.max(...board.crossings.map((c) => Math.abs(c.y)));
  const width = reachX * (Math.sqrt(3) / 2) * SIZE + SIDE_MARGIN;
  const height = (reachY * SIZE) / 2 + TOP_MARGIN;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-[#3f86bd] p-2 dark:border-zinc-800">
      <svg
        data-testid="ct-board"
        viewBox={`${-width} ${-height} ${width * 2} ${height * 2}`}
        className="h-auto w-full"
        role="img"
        aria-label="Spielfeld"
      >
        {board.hexes.map((hex) => (
          <Landscape
            key={hex.id}
            game={game}
            hex={hex.id}
            lit={litHex.has(hex.id)}
            onTap={
              litHex.has(hex.id)
                ? () => onMove(moveFor(litHex.get(hex.id) as Spot))
                : null
            }
          />
        ))}
        {mySeat !== null && (
          <g pointerEvents="none" fill="none">
            {[...tinted].map((hex) => (
              <polygon
                key={hex}
                points={hexOutline(board, hex)}
                stroke={COLOUR_INK[game.players[mySeat].colour]}
                strokeWidth={MINE_RING}
                opacity={MINE_INK}
                strokeLinejoin="round"
              />
            ))}
          </g>
        )}
        {/* Through moveFor like the crossings, rather than rebuilding the move
            here: two places deciding what a tap means is two places to teach
            every time a new one is added. */}
        {litPaths.map((spot) => {
          const a = crossPoint(board, board.paths[spot.at].ends[0]);
          const b = crossPoint(board, board.paths[spot.at].ends[1]);
          return (
            <line
              key={`lit-${spot.at}`}
              data-testid={`ct-path-${spot.at}`}
              x1={a.px}
              y1={a.py}
              x2={b.px}
              y2={b.py}
              stroke="#ffffff"
              strokeWidth={9}
              strokeLinecap="round"
              opacity={0.75}
              className="cursor-pointer"
              onClick={() => onMove(moveFor(spot))}
            />
          );
        })}
        {board.paths.map((path) =>
          game.roads[path.id] === null ? null : game.bridges[path.id] ===
            null ? (
            <Road key={path.id} game={game} path={path.id} mySeat={mySeat} />
          ) : (
            <Bridge key={path.id} game={game} path={path.id} />
          ),
        )}
        {/* The caravans, over the roads: a wagon stands beside a road, and a
            road underneath it is the thing the wagon makes count double. */}
        {game.wagons.map((which, path) =>
          which === null ? null : (
            <Wagon key={`w-${path}`} game={game} path={path} />
          ),
        )}
        <Arrows game={game} />
        {game.raiders.map((held, path) =>
          !held ? null : <Raider key={`r-${path}`} game={game} path={path} />,
        )}
        {game.ships.map((owner, path) => {
          const pickable =
            owner !== null &&
            owner === mySeat &&
            game.phase === "trade" &&
            !game.shipMoved &&
            loose.includes(path);
          return owner === null ? null : (
            <g
              key={`s-${path}`}
              data-testid={pickable ? `ct-pickship-${path}` : undefined}
              className={pickable ? "cursor-pointer" : undefined}
              pointerEvents={pickable ? "auto" : "none"}
              onClick={
                pickable
                  ? () => onSail?.(sailingShip === path ? null : path)
                  : undefined
              }
            >
              {pickable && <TapSpot game={game} path={path} />}
              <Ship
                game={game}
                path={path}
                mySeat={mySeat}
                picked={sailingShip === path}
              />
            </g>
          );
        })}
        {finding(game) &&
          game.boats.map((boat, which) => {
            // Only a ship that could still do something is worth tapping: one
            // out of movement points is not a choice.
            const ready =
              game.phase === "sailing" &&
              boat.owner === mySeat &&
              game.sailing !== which &&
              (lanesFrom(game, boat).length > 0 ||
                (boat.hold.includes("entdecker") &&
                  landingSpots(game, mySeat, boat.at).length > 0));
            return (
              <g
                key={`b-${which}`}
                data-testid={ready ? `ct-helm-${which}` : undefined}
                className={ready ? "cursor-pointer" : undefined}
                pointerEvents={ready ? "auto" : "none"}
                onClick={
                  ready
                    ? () => onMove({ kind: "helm", boat: which })
                    : undefined
                }
              >
                {ready && <TapSpot game={game} path={boat.at} />}
                <Explorer
                  game={game}
                  which={which}
                  picked={game.sailing === which}
                />
              </g>
            );
          })}
        {Object.entries(game.forts).map(([at, fort]) => (
          <Fortress
            key={`fort-${at}`}
            game={game}
            at={Number(at)}
            fort={fort}
          />
        ))}
        {corsairs(game) && <Armada game={game} />}
        {Object.entries(game.villagesOf).map(([at, village]) => (
          <ClothVillage
            key={`village-${at}`}
            game={game}
            at={Number(at)}
            village={village}
          />
        ))}
        {Object.entries(game.presents).map(([path, gift]) => (
          <Present
            key={`gift-${path}`}
            game={game}
            path={Number(path)}
            gift={gift}
          />
        ))}
        {camping(game) && <Corsair game={game} />}
        {sailing(game) && game.pirate >= 0 && (
          <Pirate game={game} hex={game.pirate} />
        )}
        {/* The knights, over the roads they ride across. */}
        {game.guards.map((owner, path) =>
          owner === null ? null : (
            <g
              key={`g-${path}`}
              data-testid={
                game.phase === "knights" && owner === mySeat
                  ? `ct-pick-${path}`
                  : undefined
              }
              className={
                game.phase === "knights" && owner === mySeat
                  ? "cursor-pointer"
                  : undefined
              }
              pointerEvents={
                game.phase === "knights" && owner === mySeat ? "auto" : "none"
              }
              onClick={
                game.phase === "knights" && owner === mySeat
                  ? () => onRide?.(riding === path ? null : path)
                  : undefined
              }
            >
              {game.phase === "knights" && owner === mySeat && (
                <TapSpot game={game} path={path} />
              )}
              <Guard game={game} path={path} picked={riding === path} />
            </g>
          ),
        )}
        {litCross.map((spot) => {
          const { px, py } = crossPoint(board, spot.at);
          return (
            <circle
              key={`lit-${spot.kind}-${spot.at}`}
              data-testid={`ct-cross-${spot.at}`}
              cx={px}
              cy={py}
              r={10}
              fill="#ffffff"
              opacity={0.8}
              stroke="#111827"
              strokeWidth={1.5}
              className="cursor-pointer"
              onClick={() => onMove(moveFor(spot))}
            />
          );
        })}
        {board.crossings.map((crossing) =>
          game.towns[crossing.id] === null ? null : (
            <Building
              key={crossing.id}
              game={game}
              crossing={crossing.id}
              mySeat={mySeat}
            />
          ),
        )}
        {/* After the buildings, so a knight is never hidden behind one - the
            two never share a crossing, but they do share the drawing order. */}
        {board.crossings.map((crossing) =>
          game.garrison[crossing.id] === null ? null : (
            <KnightPiece
              key={`k-${crossing.id}`}
              game={game}
              crossing={crossing.id}
              mySeat={mySeat}
            />
          ),
        )}
        {/* Last, over everything. A harbour is furniture rather than a piece,
            so it would normally go underneath - but its label sits a short way
            off the coast, close enough that a settlement on the crossing beside
            it can cover a character. A piece half behind a label is still a
            piece you can read; "2:1 Getreide" with the 2 missing is not. */}
        {/* The wagons last of all: they move every turn, and a piece that
            moves has to be the one you can always see. */}
        {hauling(game) &&
          game.players.map((unused, seat) => (
            <Hauler key={`h-${seat}`} game={game} seat={seat} />
          ))}
        {game.harbours.map((unused, index) => (
          <Dock key={index} game={game} harbour={index} />
        ))}
        {/* The fishing grounds, on top like the harbours and for the same
            reason: they say what a crossing is worth, and a piece standing on
            that crossing must not hide it. */}
        {game.grounds.map((ground, index) => (
          <Fishery key={index} game={game} ground={ground} />
        ))}
      </svg>
    </div>
  );
}
