/**
 * Tests for the controls: what a key means depends on where you are sitting.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { createControls, type KeyTarget } from "./controls";

/** A stand-in for the window that lets a test fire key events by hand. */
function fakeWindow(): KeyTarget & {
  down: (key: string) => boolean;
  up: (key: string) => void;
  blur: () => void;
} {
  const handlers = new Map<string, (event: Event) => void>();
  return {
    addEventListener: (type, handler) => void handlers.set(type, handler),
    removeEventListener: (type) => void handlers.delete(type),
    down: (key: string) => {
      let prevented = false;
      handlers.get("keydown")?.({
        key,
        preventDefault: () => {
          prevented = true;
        },
      } as unknown as Event);
      return prevented;
    },
    up: (key: string) => handlers.get("keyup")?.({ key } as unknown as Event),
    blur: () => handlers.get("blur")?.({} as Event),
  };
}

describe("the pedals and the feet", () => {
  it("drives with W while in the cab and walks with D while out", () => {
    const controls = createControls();
    const win = fakeWindow();
    controls.listen(win);

    win.down("w");
    expect(controls.read(true).drive).toBe(1);
    expect(controls.read(false).drive).toBe(0);

    win.up("w");
    win.down("d");
    expect(controls.read(false).drive).toBe(1);
    expect(controls.read(true).drive).toBe(0);
  });

  it("works the winch with W only while out of the cab", () => {
    const controls = createControls();
    const win = fakeWindow();
    controls.listen(win);

    win.down("w");
    expect(controls.read(false).wind).toBe(1);
    expect(controls.read(true).wind).toBe(0);

    win.up("w");
    win.down("s");
    expect(controls.read(false).wind).toBe(-1);
  });

  it("reels in rather than out when both are pressed", () => {
    const controls = createControls();
    const win = fakeWindow();
    controls.listen(win);
    win.down("w");
    win.down("s");
    expect(controls.read(false).wind).toBe(1);
  });
});

describe("a press rather than a hold", () => {
  it("puts a gear in once per press", () => {
    const controls = createControls();
    const win = fakeWindow();
    controls.listen(win);

    win.down("3");
    expect(controls.read(true).shift).toBe(3);
    // Still held down, but the gear is in: it must not be shifted again.
    expect(controls.read(true).shift).toBe(null);
  });

  it("knows reverse and neutral by their own keys", () => {
    const controls = createControls();
    const win = fakeWindow();
    controls.listen(win);
    win.down("r");
    expect(controls.read(true).shift).toBe(-1);
    win.down("n");
    expect(controls.read(true).shift).toBe(0);
  });

  it("opens the door once per press of E", () => {
    const controls = createControls();
    const win = fakeWindow();
    controls.listen(win);
    win.down("e");
    expect(controls.read(false).door).toBe(true);
    expect(controls.read(false).door).toBe(false);
  });

  it("ties the rope once but keeps hammering while space is held", () => {
    const controls = createControls();
    const win = fakeWindow();
    controls.listen(win);
    win.down(" ");
    const first = controls.read(false);
    expect(first.hook).toBe(true);
    expect(first.work).toBe(true);
    const second = controls.read(false);
    expect(second.hook).toBe(false);
    expect(second.work).toBe(true);
  });

  it("keeps space from scrolling the page away", () => {
    const controls = createControls();
    const win = fakeWindow();
    controls.listen(win);
    expect(win.down(" ")).toBe(true);
    expect(win.down("q")).toBe(false);
  });

  it("throws a pending press away when the loop is not running", () => {
    const controls = createControls();
    const win = fakeWindow();
    controls.listen(win);
    win.down("e");
    controls.forget();
    expect(controls.read(false).door).toBe(false);
  });
});

describe("the on-screen buttons", () => {
  it("drives and walks like the keys do", () => {
    const controls = createControls();
    controls.press("forward", true);
    expect(controls.read(true).drive).toBe(1);
    controls.press("back", true);
    // Both down at once cancel out, exactly as two keys would.
    expect(controls.read(true).drive).toBe(0);
    controls.press("forward", false);
    expect(controls.read(true).drive).toBe(-1);
  });

  it("ties the rope on a tap and hammers on a hold", () => {
    const controls = createControls();
    controls.press("hook", true);
    const first = controls.read(false);
    expect(first.hook).toBe(true);
    expect(first.work).toBe(true);
    expect(controls.read(false).hook).toBe(false);
    expect(controls.read(false).work).toBe(true);
    controls.press("hook", false);
    expect(controls.read(false).work).toBe(false);
  });

  it("shifts from the gear buttons", () => {
    const controls = createControls();
    controls.shift(2);
    expect(controls.read(true).shift).toBe(2);
    expect(controls.read(true).shift).toBe(null);
  });

  it("runs on the sprint button", () => {
    const controls = createControls();
    expect(controls.read(false).sprint).toBe(false);
    controls.press("sprint", true);
    expect(controls.read(false).sprint).toBe(true);
  });
});

describe("letting go of everything", () => {
  it("lifts every key when the window loses focus", () => {
    const controls = createControls();
    const win = fakeWindow();
    controls.listen(win);
    win.down("w");
    expect(controls.read(true).drive).toBe(1);
    win.blur();
    expect(controls.read(true).drive).toBe(0);
  });

  it("stops listening once told to", () => {
    const controls = createControls();
    const win = fakeWindow();
    const stop = controls.listen(win);
    stop();
    win.down("w");
    expect(controls.read(true).drive).toBe(0);
  });
});
