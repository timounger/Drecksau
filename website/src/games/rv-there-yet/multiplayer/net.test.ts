/**
 * Tests for the wire model: what is allowed in from the network, and what is
 * not.
 *
 * @module
 * @remarks
 * The guards are the only thing between another browser's data and the game
 * loop. A guard that waves everything through is worse than no guard at all,
 * so each one is tried with a value that is wrong in exactly one way.
 */
import { describe, expect, it } from "vitest";
import { startAt } from "@/games/rv-there-yet/engine/setup";
import { IDLE_INPUT } from "@/games/rv-there-yet/engine/types";
import {
  COOP_PLAYERS,
  fromSnapshot,
  hasPress,
  makeSeat,
  RV_GUARDS,
  toSnapshot,
  withoutPresses,
} from "./net";

/** A room as the host publishes it. */
function room(game: unknown) {
  return {
    code: "ABCD",
    hostId: "host",
    seats: [makeSeat("host", "Wirt", true)],
    phase: "playing",
    game,
    version: 3,
  };
}

describe("a state over the wire", () => {
  it("comes back as the same world it went in as", () => {
    const state = startAt(2, COOP_PLAYERS);
    const there = JSON.parse(JSON.stringify(toSnapshot(state))) as ReturnType<
      typeof toSnapshot
    >;
    const back = fromSnapshot(there);
    expect(back.rv).toEqual(state.rv);
    expect(back.people).toEqual(state.people);
    expect(back.section).toBe(state.section);
    expect(back.driver).toBe(state.driver);
  });
});

describe("what the guards let in", () => {
  it("accepts a room the host really published", () => {
    const published = JSON.parse(
      JSON.stringify(room(toSnapshot(startAt(0, COOP_PLAYERS)))),
    ) as unknown;
    expect(RV_GUARDS.isRoomState(published)).toBe(true);
  });

  it("accepts a lobby with no game yet", () => {
    expect(RV_GUARDS.isRoomState(room(null))).toBe(true);
  });

  it("turns away a room whose world is junk", () => {
    expect(RV_GUARDS.isRoomState(room({ rv: "kaputt" }))).toBe(false);
    expect(RV_GUARDS.isRoomState(room(42))).toBe(false);
  });

  it("turns away a world with a person who is not one", () => {
    const state = toSnapshot(startAt(0, COOP_PLAYERS));
    const broken = { ...state, people: [state.people[0], { at: "weit weg" }] };
    expect(RV_GUARDS.isRoomState(room(broken))).toBe(false);
  });

  it("turns away a room that is missing its bookkeeping", () => {
    const good = room(null);
    expect(RV_GUARDS.isRoomState({ ...good, version: "3" })).toBe(false);
    expect(RV_GUARDS.isRoomState({ ...good, seats: "keine" })).toBe(false);
    expect(RV_GUARDS.isRoomState(null)).toBe(false);
  });

  it("accepts a guest's input and refuses a half-built one", () => {
    expect(RV_GUARDS.isMoveIntent({ seatId: "guest", move: IDLE_INPUT })).toBe(
      true,
    );
    expect(
      RV_GUARDS.isMoveIntent({
        seatId: "guest",
        move: { ...IDLE_INPUT, drive: "vorwaerts" },
      }),
    ).toBe(false);
    expect(RV_GUARDS.isMoveIntent({ move: IDLE_INPUT })).toBe(false);
    expect(RV_GUARDS.isMoveIntent(null)).toBe(false);
  });

  it("takes a gear or no gear at all, and nothing else", () => {
    const gear = (shift: unknown) =>
      RV_GUARDS.isMoveIntent({ seatId: "g", move: { ...IDLE_INPUT, shift } });
    expect(gear(3)).toBe(true);
    expect(gear(null)).toBe(true);
    expect(gear("3")).toBe(false);
  });

  it("allows no private hand at all", () => {
    expect(RV_GUARDS.isHand(null)).toBe(true);
    expect(RV_GUARDS.isHand({})).toBe(false);
  });
});

describe("a press that crossed the wire", () => {
  it("is still there the first time it is looked at", () => {
    const pressed = {
      ...IDLE_INPUT,
      door: true,
      hook: true,
      take: true,
      shift: 3,
    };
    expect(hasPress(pressed)).toBe(true);
    expect(hasPress({ ...IDLE_INPUT, take: true })).toBe(true);
  });

  it("is gone once it has been used up", () => {
    const pressed = {
      ...IDLE_INPUT,
      door: true,
      hook: true,
      take: true,
      shift: 3,
    };
    const spent = withoutPresses(pressed);
    expect(spent.door).toBe(false);
    expect(spent.hook).toBe(false);
    // Left in, one tap on F would pick a thing up two or three frames running.
    expect(spent.take).toBe(false);
    expect(spent.shift).toBe(null);
    expect(hasPress(spent)).toBe(false);
  });

  it("leaves the held controls alone", () => {
    // The pedal is still down, the winch still running, the player still
    // sprinting - only the presses are spent.
    const held = {
      ...IDLE_INPUT,
      drive: 1,
      wind: -1,
      sprint: true,
      work: true,
      door: true,
    };
    const spent = withoutPresses(held);
    expect(spent.drive).toBe(1);
    expect(spent.wind).toBe(-1);
    expect(spent.sprint).toBe(true);
    expect(spent.work).toBe(true);
  });

  it("sees no press in an input that has none", () => {
    expect(hasPress(IDLE_INPUT)).toBe(false);
    expect(hasPress({ ...IDLE_INPUT, drive: 1, work: true })).toBe(false);
    // Neutral is a gear like any other: shifting to it is a press.
    expect(hasPress({ ...IDLE_INPUT, shift: 0 })).toBe(true);
  });
});
