/**
 * Tests what the online adapter lets through and what it hides.
 *
 * @module
 * @remarks
 * The point of the suite is the line between the two. Hiding too little leaks
 * the game; hiding too much leaves the guests looking at zeros, which is what
 * happened to the drawn card.
 *
 * Zero is also the value a blanked card is published as, so every test here
 * first makes sure the card it looks at is **not** a zero by chance - otherwise
 * a missing blank and a present one look exactly alike.
 */
import { describe, expect, it } from "vitest";
import { skyjoAdapter, type SkyjoVault } from "./adapter";
import { applyMove } from "@/games/skyjo/engine/moves";
import { createGame } from "@/games/skyjo/engine/setup";
import { OPENING_FLIPS, type SkyjoGame } from "@/games/skyjo/engine/state";

/** The seed the plain scenarios are dealt from, so the cards never move. */
const SEED = 4711;

/** How many seeds a search tries before giving up. */
const SEED_TRIES = 200;

/** A fresh two-handed table from a given seed. */
function table(seed: number): SkyjoGame {
  return createGame(
    [
      { name: "Anna", isBot: false },
      { name: "Bert", isBot: false },
    ],
    seed,
  );
}

/**
 * Plays the opening flips for everyone, leaving a game ready for a turn.
 *
 * @param seed - which deal to use
 * @returns the game with the opening over
 */
function afterOpening(seed = SEED): SkyjoGame {
  let game = table(seed);
  // Whoever is on turn flips their first face-down cards, until the opening is
  // over - the engine decides the order, this just follows it.
  while (game.phase === "flip") {
    const seat = game.turn;
    const index = game.players[seat].grid.findIndex(
      (slot) => slot.state === "down",
    );
    const next = applyMove(game, seat, { kind: "flip", index });
    expect(next, "the opening flip was refused").not.toBeNull();
    game = next as SkyjoGame;
  }
  return game;
}

/**
 * A game where somebody has drawn a card that is **not** a zero.
 *
 * @returns that game
 * @remarks
 * Deals from one seed after another until the top of the deck is a telling
 * value. Roughly nine deals in ten qualify, so the search all but always ends
 * on the first try - it is only here so the test can never pass by accident.
 */
function afterDrawingSomethingVisible(): SkyjoGame {
  let found: SkyjoGame | null = null;
  for (let seed = 1; seed <= SEED_TRIES && found === null; seed++) {
    const opened = afterOpening(seed);
    const next = applyMove(opened, opened.turn, { kind: "draw" });
    if (next !== null && next.drawn !== null && next.drawn !== 0) {
      found = next;
    }
  }
  expect(found, "no deal put a non-zero card on top").not.toBeNull();
  return found as SkyjoGame;
}

describe("what redact hides", () => {
  it("blanks the face-down cards", () => {
    const game = afterOpening();
    const real = game.players.flatMap((player) =>
      player.grid.filter((slot) => slot.state === "down"),
    );
    // Some of them must really differ from the blank, or this proves nothing.
    expect(real.some((slot) => slot.value !== 0)).toBe(true);

    const hidden = skyjoAdapter.redact(game);
    const down = hidden.players.flatMap((player) =>
      player.grid.filter((slot) => slot.state === "down"),
    );
    expect(down.every((slot) => slot.value === 0)).toBe(true);
  });

  it("blanks the draw pile", () => {
    const game = afterOpening();
    expect(game.deck.some((card) => card !== 0)).toBe(true);

    const hidden = skyjoAdapter.redact(game);
    expect(hidden.deck.every((card) => card === 0)).toBe(true);
  });

  it("leaves the face-up cards alone", () => {
    const game = afterOpening();
    const hidden = skyjoAdapter.redact(game);
    let seen = 0;
    game.players.forEach((player, seat) => {
      player.grid.forEach((slot, index) => {
        if (slot.state === "up") {
          seen++;
          expect(hidden.players[seat].grid[index].value).toBe(slot.value);
        }
      });
    });
    expect(seen).toBe(game.players.length * OPENING_FLIPS);
  });
});

describe("the drawn card", () => {
  it("stays visible to everyone", () => {
    // Drawing puts the card face up on the discard pile, so it is public. A
    // guest that sees 0 here cannot tell whether the card is worth taking.
    const game = afterDrawingSomethingVisible();
    const hidden = skyjoAdapter.redact(game);
    expect(hidden.drawn).toBe(game.drawn);
  });

  it("is still nothing while nobody has drawn", () => {
    const hidden = skyjoAdapter.redact(afterOpening());
    expect(hidden.drawn).toBeNull();
  });
});

describe("the host vault", () => {
  it("brings the real values back for a taking-over host", () => {
    const game = afterDrawingSomethingVisible();
    const vault = skyjoAdapter.vault?.(game) as SkyjoVault;
    // What a promoted host starts from: the published, blanked state.
    const restored = skyjoAdapter.applyVault?.(
      skyjoAdapter.redact(game),
      vault,
    );
    expect(restored).toEqual(game);
  });

  it("refuses a vault that does not fit the table", () => {
    const game = afterOpening();
    const restored = skyjoAdapter.applyVault?.(skyjoAdapter.redact(game), {
      values: [[1, 2, 3]],
      deck: [],
      drawn: null,
    });
    // Rather the blanked state than one built from a mismatched vault.
    expect(restored).toEqual(skyjoAdapter.redact(game));
  });
});
