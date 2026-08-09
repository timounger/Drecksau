/**
 * Tests for the one line beside the fuel gauge.
 *
 * @module
 * @remarks
 * It used to say what to do next, and it said it constantly: "go and find the
 * hammer", "put the rope on that tree", "get out and walk over". Every section
 * came with its own solution written out beside the fuel gauge, and there was
 * nothing left in the game to work out. What a section is about is on the
 * board standing at the start of it now.
 *
 * So the line speaks only while something is **running** - a job with a key
 * held down, the brake, the mud, the bear, the count in the fog - and the
 * substance worth testing is which of those wins when two of them are true at
 * once, which is exactly what a canvas test cannot see.
 */
import { describe, expect, it } from "vitest";
import {
  ControlsHint,
  Doing,
  GearStick,
  Pedal,
  doingText,
  pedalNow,
} from "./board";
import type { ReactElement } from "react";
import { hudOf } from "@/games/rv-there-yet/hooks/hud";
import { startAt } from "@/games/rv-there-yet/engine/setup";
import type { Hud } from "@/games/rv-there-yet/hooks/hud";
import { RV_TEXTS } from "@/games/rv-there-yet/i18n/texts";

/** Half done, as the screen keeps it: nought to one. */
const HALF = 0.5;

/** The same, as the line writes it. */
const FIFTY = 50;

/** The heads-up facts of a fresh drive, with anything overridden. */
function hud(over: Partial<Hud> = {}): Hud {
  const base = hudOf(startAt(0), {
    ready: -1,
    candidate: -1,
    running: true,
    me: 0,
  });
  return { ...base, ...over };
}

/** A bear at a given remove from this player. */
function bear(
  over: Partial<NonNullable<Hud["bear"]>>,
): NonNullable<Hud["bear"]> {
  return {
    coming: false,
    canSpray: false,
    armed: false,
    inBag: false,
    sprayed: 0,
    danger: 0,
    ...over,
  };
}

describe("the line beside the fuel gauge", () => {
  it("says nothing at all while nothing is going on", () => {
    // Behind the wheel with the road ahead, or out on the verge: the game is
    // not waiting for anything in particular, so neither is the screen.
    expect(doingText(hud({ inside: true }))).toBe("");
    expect(doingText(hud({ inside: false }))).toBe("");
  });

  it("puts nothing on the screen at all when it has nothing to say", () => {
    // Not an empty box with a border round it: that is a hole where a sentence
    // used to be, and it draws the eye to exactly nothing.
    expect(Doing({ hud: hud({ inside: true }) })).toBeNull();
    expect(Doing({ hud: hud({ inside: true, brake: true }) })).not.toBeNull();
  });

  it("tells nobody what to do", () => {
    // The whole point of the change. Each of these used to be a sentence
    // spelling out the answer to the section it belongs to.
    const quiet: readonly Partial<Hud>[] = [
      { inside: false, damaged: true },
      { inside: false, damaged: true, carrying: ["hammer"], canMend: true },
      { inside: false, pickUp: "hammer" },
      { inside: false, pickUp: "axe" },
      { inside: false, carrying: ["tyres"], holding: "tyres" },
      { inside: false, carrying: ["can"], holding: "can" },
      { inside: false, atDoor: true },
      { inside: false, candidate: true },
      { inside: false, ready: true },
      { inside: true, hooked: true },
      { inside: true, bridge: true, aboard: 2 },
      { inside: true, chasm: true },
      { inside: false, chasm: true, ladder: true },
      { inside: false, chasm: true, roof: true },
      { inside: false, chasm: true, carrying: ["axe"] },
      { inside: true, chasm: true, felled: true },
      { inside: false, bear: bear({ coming: true }) },
      { inside: false, bear: bear({ canSpray: true, armed: true }) },
      { inside: true, job: "fuel" },
      { inside: false, job: "fit" },
    ];
    for (const facts of quiet) {
      expect(doingText(hud(facts))).toBe("");
    }
  });
});

describe("the line while a job is being done", () => {
  it("names the job the world is doing, not the one you could start", () => {
    // The bug: standing at the tree with the axe, the count read "Repariert".
    // The line asked where **this** player stood instead of asking what was
    // going on, and where they stood said nothing about a tree.
    expect(doingText(hud({ inside: false, doing: "fell", repair: HALF }))).toBe(
      RV_TEXTS.felling(FIFTY),
    );
    expect(
      doingText(
        hud({ inside: false, job: "mend", doing: "fell", repair: HALF }),
      ),
    ).toBe(RV_TEXTS.felling(FIFTY));
  });

  it("counts out the hammering, the fitting, the fuelling and the felling", () => {
    // A job is a key held down, and letting go loses what has been done: the
    // count is the reason anybody keeps holding it.
    const at = (job: Hud["doing"]): string =>
      doingText(hud({ inside: false, doing: job, repair: HALF }));
    expect(at("mend")).toBe(RV_TEXTS.mending(FIFTY));
    expect(at("fit")).toBe(RV_TEXTS.fitting(FIFTY));
    expect(at("fuel")).toBe(RV_TEXTS.fuelling(FIFTY));
    expect(at("fell")).toBe(RV_TEXTS.felling(FIFTY));
  });

  it("moves as the job does", () => {
    // A number that never moves reads as scenery.
    const early = doingText(hud({ inside: false, doing: "mend", repair: 0.2 }));
    expect(early).not.toBe(doingText(hud({ doing: "mend", repair: HALF })));
  });

  it("keeps quiet before the job is started", () => {
    expect(doingText(hud({ inside: false, doing: "mend", repair: 0 }))).toBe(
      "",
    );
    // And a count with nothing behind it says nothing either: in co-op the
    // one who is **not** working sees the same count as the one who is.
    expect(doingText(hud({ inside: false, doing: null, repair: HALF }))).toBe(
      "",
    );
  });
});

describe("the line while the bear has hold of somebody", () => {
  it("puts the spraying ahead of the mauling", () => {
    // It reaches you **while** you spray - that is the nerve of the thing -
    // and the number worth reading then is the one that says "keep holding".
    const both = hud({
      inside: false,
      bear: bear({ canSpray: true, armed: true, sprayed: HALF, danger: 0.3 }),
    });
    expect(doingText(both)).toBe(RV_TEXTS.bearSpraying(FIFTY));
  });

  it("says nothing at all while it has hold of you", () => {
    // A percentage counting up while a bear mauls you turns a fright into a
    // progress bar. The picture says it: claws, and a line going red.
    const held = hud({ inside: false, bear: bear({ danger: HALF }) });
    expect(doingText(held)).toBe("");
  });
});

describe("the line while you stand about in the fog", () => {
  it("says nothing while you keep moving", () => {
    expect(doingText(hud({ still: 0 }))).toBe("");
  });

  it("says nothing while the count runs either", () => {
    // The shape coming out of the grey is the warning. A percentage beside
    // the fuel gauge is a countdown, and a countdown is not frightening.
    expect(doingText(hud({ still: HALF }))).toBe("");
    expect(doingText(hud({ still: 1 }))).toBe("");
  });

  it("gets on with the job that is being done instead", () => {
    const busy = hud({
      still: HALF,
      inside: false,
      doing: "mend",
      repair: 0.9,
    });
    expect(doingText(busy)).toBe(RV_TEXTS.mending(90));
  });
});

describe("the line about the controls", () => {
  it("says the handbrake is held, because a held brake looks like a fault", () => {
    const held = doingText(hud({ inside: true, brake: true }));
    expect(held).toBe(RV_TEXTS.parked);
    expect(doingText(hud({ inside: true, brake: false }))).toBe("");
  });

  it("keeps quiet about the brake out of the cab", () => {
    // Out there the bar is a jump, and the vehicle is parked anyway.
    expect(doingText(hud({ inside: false, brake: true }))).toBe("");
  });

  it("says the mud is the mud", () => {
    // Throttle down and going nowhere is the moment somebody starts wondering
    // whether the game is broken. It says what is happening, not what to do.
    expect(doingText(hud({ inside: true, mud: true }))).toBe(RV_TEXTS.mud);
    expect(doingText(hud({ inside: false, mud: true }))).toBe("");
  });

  it("tells a passenger that the pedals are not theirs", () => {
    // Not a hint but a fact about the controls: pressing them and seeing
    // nothing happen has no other explanation on the screen.
    expect(doingText(hud({ inside: true, passenger: true }))).toBe(
      RV_TEXTS.passenger,
    );
  });

  it("puts anything actually happening ahead of the passenger note", () => {
    const busy = hud({ inside: true, passenger: true, brake: true });
    expect(doingText(busy)).toBe(RV_TEXTS.parked);
  });
});

describe("the buttons under the picture", () => {
  it("writes the key on every one of them", () => {
    // The row is a keyboard lesson as much as it is a control: whoever finds
    // the button once should not have to go looking for it again.
    const buttons = [
      "forward",
      "back",
      "sprint",
      "door",
      "take",
      "use",
      "jump",
      "wind",
      "windOut",
    ] as const;
    for (const button of buttons) {
      expect(pedalNow(hud(), button).keys).not.toBe("");
    }
  });

  it("swaps the pedal keys for the walking keys when you get out", () => {
    // The same two buttons mean the pedals in the cab and your feet outside,
    // which is exactly what W and D do on the keyboard.
    expect(pedalNow(hud({ inside: true }), "forward").keys).toBe("W");
    expect(pedalNow(hud({ inside: false }), "forward").keys).toBe("D");
    expect(pedalNow(hud({ inside: true }), "back").keys).toBe("S");
    expect(pedalNow(hud({ inside: false }), "back").keys).toBe("A");
  });

  it("kills the buttons that would do nothing where you are", () => {
    // Nine buttons of which four do something is a row that has to be read.
    const inCab = (button: Parameters<typeof pedalNow>[1]) =>
      pedalNow(hud({ inside: true, driving: true }), button).on;
    expect(inCab("sprint")).toBe(false);
    expect(inCab("take")).toBe(false);
    expect(inCab("use")).toBe(false);
    expect(inCab("wind")).toBe(false);
    expect(inCab("windOut")).toBe(false);
    expect(inCab("forward")).toBe(true);
  });

  it("lets nobody pick up what is not lying there", () => {
    expect(pedalNow(hud({ inside: false }), "take").on).toBe(false);
    expect(pedalNow(hud({ inside: false, pickUp: "hammer" }), "take").on).toBe(
      true,
    );
  });

  it("offers the working key only where there is work", () => {
    const on = (over: Partial<Hud>) =>
      pedalNow(hud({ inside: false, ...over }), "use").on;
    expect(on({})).toBe(false);
    expect(on({ ready: true })).toBe(true);
    expect(on({ hooked: true })).toBe(true);
    expect(on({ job: "mend" })).toBe(true);
    expect(on({ bear: bear({ canSpray: true, inBag: true }) })).toBe(true);
    // The spray has to be **in the bag** for the key to do anything with it.
    expect(on({ bear: bear({ canSpray: true }) })).toBe(false);
  });

  it("winds the rope only while it is on something and you are out there", () => {
    expect(pedalNow(hud({ inside: false, hooked: true }), "wind").on).toBe(
      true,
    );
    expect(pedalNow(hud({ inside: false, hooked: false }), "wind").on).toBe(
      false,
    );
    expect(pedalNow(hud({ inside: true, hooked: true }), "wind").on).toBe(
      false,
    );
  });

  it("opens the door only at the door, and only once it has stopped", () => {
    expect(pedalNow(hud({ inside: false, atDoor: true }), "door").on).toBe(
      true,
    );
    expect(pedalNow(hud({ inside: false, atDoor: false }), "door").on).toBe(
      false,
    );
    expect(pedalNow(hud({ inside: true, speed: 0 }), "door").on).toBe(true);
    expect(pedalNow(hud({ inside: true, speed: 8 }), "door").on).toBe(false);
  });

  it("gives the handbrake to whoever is steering", () => {
    // Out there the same button is a jump, and jumping is always allowed.
    expect(pedalNow(hud({ inside: false }), "jump").on).toBe(true);
    expect(pedalNow(hud({ inside: true, driving: true }), "jump").on).toBe(
      true,
    );
    expect(
      pedalNow(hud({ inside: true, driving: false, passenger: true }), "jump")
        .on,
    ).toBe(false);
  });

  it("leaves the pedals to the driver", () => {
    const rider = hud({ inside: true, driving: false, passenger: true });
    expect(pedalNow(rider, "forward").on).toBe(false);
    expect(pedalNow(rider, "back").on).toBe(false);
  });
});

describe("the buttons as they come out on the screen", () => {
  /** Every `button` element in a tree, however deep. */
  function buttonsIn(
    node: unknown,
  ): { readonly props: Record<string, unknown> }[] {
    if (Array.isArray(node)) {
      return node.flatMap((each) => buttonsIn(each));
    }
    if (node === null || typeof node !== "object") {
      return [];
    }
    const element = node as ReactElement<Record<string, unknown>>;
    const props = element.props ?? {};
    const inside = buttonsIn(props.children);
    return element.type === "button" ? [{ props }, ...inside] : inside;
  }

  /** What one pedal came out as. */
  function pedal(button: Parameters<typeof pedalNow>[1], over: Partial<Hud>) {
    const element = Pedal({
      onPress: () => undefined,
      button,
      hud: hud(over),
      children: "x",
    });
    return buttonsIn(element)[0];
  }

  it("really does turn the dead ones off", () => {
    // The rule is only worth anything if the button cannot be clicked: a grey
    // button that still fires is a button that lies.
    expect(pedal("sprint", { inside: true }).props.disabled).toBe(true);
    expect(pedal("sprint", { inside: false }).props.disabled).toBe(false);
  });

  it("carries the key in its label", () => {
    const written = JSON.stringify(pedal("door", { inside: false }));
    expect(written).toContain("(");
    expect(written).toContain("E");
  });

  it("turns the gears off for anybody not at the wheel", () => {
    const off = buttonsIn(
      GearStick({ gear: 1, onShift: () => undefined, driving: false }),
    );
    const on = buttonsIn(
      GearStick({ gear: 1, onShift: () => undefined, driving: true }),
    );
    expect(off.length).toBeGreaterThan(2);
    expect(off.every((each) => each.props.disabled === true)).toBe(true);
    expect(on.every((each) => each.props.disabled === false)).toBe(true);
  });
});

describe("the row of keys under the picture", () => {
  /** Everything that row says, as one string. */
  function said(inside: boolean): string {
    return JSON.stringify(ControlsHint({ inside }));
  }

  it("says only what the seat one is in is about", () => {
    // Ten lines of which half belonged to the other seat is a wall of text
    // under the picture, and a wall of text is not read by anybody - least of
    // all by the person driving.
    expect(said(true)).toContain("Gänge");
    expect(said(true)).not.toContain("Rennen");
    expect(said(false)).toContain("Rennen");
    expect(said(false)).not.toContain("Gänge");
  });

  it("keeps it short in both seats", () => {
    for (const inside of [true, false]) {
      const keys = inside ? RV_TEXTS.drivingKeys : RV_TEXTS.walkingKeys;
      expect(keys.length).toBeLessThan(7);
      for (const line of keys) {
        expect(line.length).toBeLessThan(35);
      }
    }
  });

  it("names the keys that do the work in that seat", () => {
    // Whatever else it leaves out, the way out of the seat has to be on it.
    expect(said(true)).toContain("Aussteigen");
    expect(said(false)).toContain("Einsteigen");
    expect(said(false)).toContain("F");
  });
});
