/**
 * Die Belagerung der Burg: a castle behind its moat, with a field, a forest
 * and two army tents around it, in the middle of a siege - and a murdered
 * knight.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/15.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Volkrich is the victim; whoever was alone with him killed him.
 *
 * The book's estates: nobles (purple cards: Alburg, Bertwald) only in the
 * crowned areas - the barracks, the king's garden, the supply tent and the
 * command tent - villagers (wooden cards: Catherine, Dulcibel, Gervais,
 * Herzog) only in the others, knights (grey shields: Edward, Ferald, Ivan,
 * Joshua, Kenric, Volkrich) anywhere. Bearded, as the portraits show, are
 * Alburg, Bertwald, Edward, Gervais, Herzog, Ivan and Joshua.
 *
 * "Beside" a thing means next to it in the same area, as everywhere; Joshua
 * is beside the moat when a field next to his belongs to it. "South of",
 * "east of" and "south-west of" mean any field further that way. Houses can
 * be stood on (the legend says so); catapults cannot (so does the legend),
 * nor can cows, trees, bushes, rubble, the statue, weapon racks and
 * crates.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  not,
  own,
  ranks,
  victim,
} from "../engine/clues";
import { contextOf } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** The crowned areas: barracks, king's garden, supply tent, command tent. */
const CROWNED: readonly string[] = ["R", "G", "S", "T"];

/** The knights, whom Alburg was south of. */
const KNIGHTS: readonly string[] = ["E", "F", "I", "J", "K", "V"];

/** Everybody Alburg was south of: the knights and the other noble. */
const NORTH_OF_ALBURG: readonly string[] = [...KNIGHTS, "B"];

/** The villagers - the commoners of Catherine's clue. */
const VILLAGERS: readonly string[] = ["C", "D", "G", "H"];

/** The women. */
const WOMEN: readonly string[] = ["C", "D"];

/** The statue, counted from nought. */
const STATUE: Cell = { row: 3, col: 7 };

/** The moat. */
const MOAT = "F";

/** How many catapults had exactly one person beside them. */
const WATCHED_CATAPULTS = 3;

/** How many rows north of Herzog Dulcibel stood. */
const ROWS_NORTH_OF_HERZOG = 8;

/** How many people stand in an area where one is alone with one other. */
const PAIR = 2;

/** A field somebody not yet placed could still take. */
type Option = { readonly id: string; readonly cell: Cell };

/** The fields each suspect's own clue and the rules allow, worked out once. */
const domains = new Map<string, readonly Cell[]>();

/** Whether a column, counted from nought, has a catapult in it. */
function catapultColumn(c: Context, col: number): boolean {
  return Array.from({ length: c.rows }, (_, row) => ({ row, col })).some(
    (cell) => c.is(cell, "catapult"),
  );
}

/** Whether a row, counted from nought, has a house in it. */
function houseRow(c: Context, row: number): boolean {
  return Array.from({ length: c.cols }, (_, col) => ({ row, col })).some(
    (cell) => c.is(cell, "house"),
  );
}

/** Whether a row, counted from nought, has a catapult in it. */
function catapultRow(c: Context, row: number): boolean {
  return Array.from({ length: c.cols }, (_, col) => ({ row, col })).some(
    (cell) => c.is(cell, "catapult"),
  );
}

/** How many people stand next to a field, in its area. */
function peopleBeside(c: Context, cell: Cell): number {
  return c.neighbours(cell).filter((one) => c.personAt(one) !== null).length;
}

/**
 * Whether three catapults had exactly one person beside them and nobody
 * stood beside the other two.
 *
 * @param c - the context, with everybody placed
 * @returns whether the catapults are watched as the case says
 */
function catapultsWatched(c: Context): boolean {
  const counts = catapultCounts(c);
  return (
    counts.filter((count) => count === 1).length === WATCHED_CATAPULTS &&
    counts.every((count) => count <= 1)
  );
}

/**
 * For the solver: whether the people placed so far still leave room for a
 * solution - everybody left still has a free field, the free rows and
 * columns can be shared out, and the clues about others can still hold.
 *
 * @param c - the context, with some people placed
 * @returns whether a solution may still follow
 */
function stillPossible(c: Context): boolean {
  const placed = c.people();
  const taken = placed.map((id) => c.cellOf(id) ?? { row: -1, col: -1 });
  const rowTaken = new Set(taken.map((at) => at.row));
  const colTaken = new Set(taken.map((at) => at.col));
  const waiting = c.level.suspects
    .map((one) => one.id)
    .filter((id) => !placed.includes(id));
  const free = waiting.map((id) =>
    domainOf(c, id).filter(
      (cell) => !rowTaken.has(cell.row) && !colTaken.has(cell.col),
    ),
  );
  const options: readonly Option[] = waiting.flatMap((id, index) =>
    (free[index] ?? []).map((cell) => ({ id, cell })),
  );
  return (
    free.every((cells) => cells.length > 0) &&
    linesShareOut(
      free.map((cells) => [...new Set(cells.map((at) => at.row))]),
    ) &&
    linesShareOut(
      free.map((cells) => [...new Set(cells.map((at) => at.col))]),
    ) &&
    cluesStillOpen(c, options)
  );
}

/** The fields a suspect's own clue and the rules allow. */
function domainOf(c: Context, id: string): readonly Cell[] {
  const known = domains.get(id);
  const suspect = c.level.suspects.find((one) => one.id === id);
  const cells: Cell[] = [];
  if (known === undefined && suspect !== undefined) {
    for (let row = 0; row < c.rows; row += 1) {
      for (let col = 0; col < c.cols; col += 1) {
        const cell = { row, col };
        const alone = contextOf(c.level, { [id]: cell }, id);
        const unary = suspect.clue.unary;
        if (
          c.standable(cell) &&
          (unary === undefined || unary(alone)) &&
          (c.level.rules ?? []).every(
            (rule) => rule.unary === undefined || rule.unary(suspect, alone),
          )
        ) {
          cells.push(cell);
        }
      }
    }
    domains.set(id, cells);
  }
  return known ?? cells;
}

/** Whether these people can each get a line of their own (rows or columns). */
function linesShareOut(lists: readonly (readonly number[])[]): boolean {
  const owner = new Map<number, number>();
  const take = (who: number, seen: Set<number>): boolean =>
    (lists[who] ?? []).some((line) => {
      const holder = owner.get(line);
      const fits =
        !seen.has(line) &&
        (seen.add(line), holder === undefined || take(holder, seen));
      if (fits) {
        owner.set(line, who);
      }
      return fits;
    });
  return lists.every((_, who) => take(who, new Set<number>()));
}

/** The partial checks of the rules and of the clues about others. */
function cluesStillOpen(c: Context, options: readonly Option[]): boolean {
  const counts = catapultCounts(c);
  const open = catapultCells(c).filter(
    (cell, index) =>
      counts[index] === 0 &&
      options.some((option) =>
        c
          .neighbours(cell)
          .some(
            (one) => one.row === option.cell.row && one.col === option.cell.col,
          ),
      ),
  ).length;
  const watched = counts.filter((count) => count === 1).length;
  const herzog = c.cellOf("H");
  const alburg = c.cellOf("A");
  const victimAt = c.cellOf("V");
  return (
    watched <= WATCHED_CATAPULTS &&
    watched + open >= WATCHED_CATAPULTS &&
    counts.every((count) => count <= 1) &&
    VILLAGERS.every((id) => {
      const there = c.cellOf(id);
      return id === "C" || there === undefined || !catapultColumn(c, there.col);
    }) &&
    (herzog === undefined ||
      c.peopleIn(c.areaOf(herzog) ?? "").every((id) => c.has(id, "beard"))) &&
    (alburg === undefined ||
      NORTH_OF_ALBURG.every((id) => {
        const there = c.cellOf(id);
        return there === undefined
          ? options.some(
              (option) => option.id === id && option.cell.row < alburg.row,
            )
          : there.row < alburg.row;
      })) &&
    (victimAt === undefined ||
      c.peopleIn(c.areaOf(victimAt) ?? "").length <= PAIR) &&
    c.level.areas.every(
      (area) =>
        area.key === MOAT ||
        c.peopleIn(area.key).length > 0 ||
        options.some((option) => c.areaOf(option.cell) === area.key),
    )
  );
}

/** Every catapult's field. */
function catapultCells(c: Context): readonly Cell[] {
  const cells: Cell[] = [];
  for (let row = 0; row < c.rows; row += 1) {
    for (let col = 0; col < c.cols; col += 1) {
      const cell = { row, col };
      if (c.is(cell, "catapult")) {
        cells.push(cell);
      }
    }
  }
  return cells;
}

/** How many people stand beside each catapult. */
function catapultCounts(c: Context): readonly number[] {
  return catapultCells(c).map((cell) => peopleBeside(c, cell));
}

/** Whether nobody stood in the moat and somebody in every other area. */
function onlyMoatEmpty(c: Context): boolean {
  return c.level.areas.every(
    (area) => (c.peopleIn(area.key).length === 0) === (area.key === MOAT),
  );
}

/** Whether a field has a field of the moat next to it. */
function besideMoat(c: Context, cell: Cell): boolean {
  return [
    { row: cell.row - 1, col: cell.col },
    { row: cell.row + 1, col: cell.col },
    { row: cell.row, col: cell.col - 1 },
    { row: cell.row, col: cell.col + 1 },
  ].some((one) => c.areaOf(one) === MOAT);
}

/** The case. */
export const THE_CASTLE_SIEGE: Level = {
  id: "the-castle-siege",
  name: "Die Belagerung der Burg",
  series: { book: "timeTravel", number: 15 },
  story:
    "Es gibt keinen besseren Schauplatz für einen Mord als ein Schlachtfeld mitten im Gefecht.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Feld",
      at: "auf dem Feld",
      ground: "sand",
      tint: "#f0d27a",
      label: { row: 4, col: 1 },
    },
    {
      key: "F",
      name: "Burggraben",
      at: "im Burggraben",
      ground: "water",
      tint: "#8f98c8",
      label: { row: 6, col: 9 },
    },
    {
      key: "R",
      name: "Kaserne",
      at: "in der Kaserne",
      ground: "floor",
      tint: "#d8b8dc",
      label: { row: 4, col: 4 },
    },
    {
      key: "P",
      name: "Burghof",
      at: "im Burghof",
      ground: "stone",
      tint: "#e6cdb4",
      label: { row: 5, col: 7 },
    },
    {
      key: "G",
      name: "Königsgarten",
      at: "im Königsgarten",
      ground: "floor",
      tint: "#d9c8ea",
      label: { row: 2, col: 8 },
    },
    {
      key: "B",
      name: "Brücke",
      at: "auf der Brücke",
      ground: "floor",
      tint: "#d8b48c",
      label: { row: 7, col: 6 },
    },
    {
      key: "W",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#a9c39a",
      label: { row: 11, col: 6 },
    },
    {
      key: "S",
      name: "Vorratszelt",
      at: "im Vorratszelt",
      ground: "floor",
      tint: "#cdb8d8",
      label: { row: 10, col: 2 },
      labelOverhang: true,
    },
    {
      key: "T",
      name: "Kommandozelt",
      at: "im Kommandozelt",
      ground: "floor",
      tint: "#cdb8d8",
      label: { row: 11, col: 9 },
      labelOverhang: true,
    },
  ],
  areaMap: [
    "KKKFFFFFFFFF",
    "KKKFPPGGGGGF",
    "KKKFPPPGGGPF",
    "KKKFRPPPPPPF",
    "WKKFRRPPPPFF",
    "WWWFFFPPPPFW",
    "WWWWWFBBFFFW",
    "WWWWWWBBFWWW",
    "WWSWWWWWWWWW",
    "WWSSWWWWWWWW",
    "WWSSSWWWWTTW",
    "WWWWWWWWWTTW",
  ],
  thingMap: [
    "..k.........",
    ".h..h.......",
    "......r..w..",
    "k....h.s.rr.",
    "........h...",
    "......r..r..",
    "uc.........c",
    "...yc..w....",
    ".h.......cy.",
    "......c.r...",
    "..x.x.u..w..",
    ".y.....y...u",
  ],
  things: {
    c: "catapult",
    h: "house",
    k: "cow",
    r: "rubble",
    s: "statue",
    u: "bush",
    w: "weaponRack",
    x: "woodCrate",
    y: "tree",
  },
  extraThings: {
    bush: {
      name: "Busch",
      emoji: "\u{1F33F}",
      standable: false,
      kinds: ["plant"],
    },
  },
  suspects: [
    {
      id: "A",
      name: "Alburg",
      pronoun: "er",
      traits: ["noble", "beard"],
      clue: {
        text: "Er war südlich aller Ritter und der übrigen Adligen.",
        ...all(
          // Seven people stood north of him: not in the top seven rows.
          own((c) => c.cell.row >= NORTH_OF_ALBURG.length),
          about(NORTH_OF_ALBURG, (c) =>
            NORTH_OF_ALBURG.every((id) => {
              const there = c.cellOf(id);
              return there !== undefined && c.cell.row > there.row;
            }),
          ),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Bertwald",
      pronoun: "er",
      traits: ["noble", "beard"],
      clue: {
        text: "Er war östlich der Statue.",
        ...own((c) => c.cell.col > STATUE.col),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Catherine",
      pronoun: "sie",
      traits: ["villager"],
      clue: {
        text: "Sie war die einzige Dorfbewohnerin in einer Spalte mit einem Katapult.",
        ...all(
          own((c) => catapultColumn(c, c.cell.col)),
          counting((c) =>
            VILLAGERS.every((id) => {
              const there = c.cellOf(id);
              return (
                id === c.self ||
                there === undefined ||
                !catapultColumn(c, there.col)
              );
            }),
          ),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Dulcibel",
      pronoun: "sie",
      traits: ["villager"],
      clue: {
        text: "Sie war genau acht Reihen nördlich von Herzog.",
        ...all(
          own((c) => c.cell.row + ROWS_NORTH_OF_HERZOG < c.rows),
          about(["H"], (c) => {
            const herzog = c.cellOf("H");
            return (
              herzog !== undefined &&
              c.cell.row === herzog.row - ROWS_NORTH_OF_HERZOG
            );
          }),
        ),
      },
      colour: "#ca8a04",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "E",
      name: "Edward",
      pronoun: "er",
      traits: ["knight", "beard"],
      clue: {
        text: "In seiner Reihe stand ein Katapult. Er war nicht neben ihm.",
        ...all(
          own((c) => catapultRow(c, c.cell.row)),
          not(beside("catapult")),
        ),
      },
      colour: "#57534e",
      face: "\u{1F482}",
    },
    {
      id: "F",
      name: "Ferald",
      pronoun: "er",
      traits: ["knight"],
      clue: {
        text: "Genau eine Reihe nördlich von ihm war eine Frau in einem Haus.",
        ...all(
          own((c) => houseRow(c, c.cell.row - 1)),
          about(WOMEN, (c) =>
            WOMEN.some((id) => {
              const there = c.cellOf(id);
              return (
                there !== undefined &&
                there.row === c.cell.row - 1 &&
                c.is(there, "house")
              );
            }),
          ),
        ),
      },
      colour: "#be185d",
      face: "\u{1F482}‍♂️",
    },
    {
      id: "G",
      name: "Gervais",
      pronoun: "er",
      traits: ["villager", "beard"],
      clue: {
        text: "Er war südwestlich der Statue.",
        ...own((c) => c.cell.row > STATUE.row && c.cell.col < STATUE.col),
      },
      colour: "#15803d",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "H",
      name: "Herzog",
      pronoun: "er",
      traits: ["villager", "beard"],
      clue: {
        text: "Alle in seinem Bereich trugen einen Bart.",
        ...all(
          // Dulcibel stood eight rows north of him.
          own((c) => c.cell.row >= ROWS_NORTH_OF_HERZOG),
          counting((c) =>
            c
              .peopleIn(c.areaOf(c.cell) ?? "")
              .every((id) => c.has(id, "beard")),
          ),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "I",
      name: "Ivan",
      pronoun: "er",
      traits: ["knight", "beard"],
      clue: { text: "Er war neben Schutt.", ...beside("rubble") },
      colour: "#6366f1",
      face: "\u{1F474}",
    },
    {
      id: "J",
      name: "Joshua",
      pronoun: "er",
      traits: ["knight", "beard"],
      clue: {
        text: "Er war im Wald, neben dem Burggraben.",
        ...all(
          inArea("W"),
          own((c) => besideMoat(c, c.cell)),
        ),
      },
      colour: "#0f766e",
      face: "\u{1F9D4}",
    },
    {
      id: "K",
      name: "Kenric",
      pronoun: "er",
      traits: ["knight"],
      clue: {
        text: "Er war in der siebten oder achten Spalte.",
        ...own((c) => c.cell.col === 6 || c.cell.col === 7),
      },
      colour: "#a16207",
      face: "\u{1F468}",
    },
    {
      id: "V",
      name: "Volkrich",
      pronoun: "er",
      traits: ["knight"],
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#78716c",
      face: "\u{1F471}‍♂️",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur in Kaserne, Königsgarten, Vorratszelt und Kommandozelt, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      CROWNED,
    ),
    {
      text: "Der Burggraben war der einzige leere Bereich.",
      unary: (_suspect, c) => c.areaOf(c.cell) !== MOAT,
      check: onlyMoatEmpty,
    },
    {
      text: "Neben drei Katapulten stand genau eine Person. Neben den anderen beiden Katapulten stand niemand.",
      check: catapultsWatched,
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "In der Kaserne muss jemand sein. Dorfbewohner dürfen nicht hinein; Alburg ist südlich von sieben Personen, also frühestens in R8; Bertwald ist östlich der Statue; Edward steht in einer Reihe mit Katapult (R7 bis R10), Ivan neben Schutt, Joshua im Wald, Kenric in C7 oder C8. Bleiben Ferald und Volkrich - und wäre Volkrich dort, müsste sein Mörder bei ihm sein, wieder nur Ferald. Ferald ist also in der Kaserne. In R3 steht kein Haus, also ist er in R5, und die Frau im Haus eine Reihe nördlich steht in R4 C6: Catherine braucht eine Spalte mit Katapult, also ist es Dulcibel. Ferald steht in R5 C5.",
      place: { D: { row: 3, col: 5 }, F: { row: 4, col: 4 } },
    },
    {
      text: "Herzog ist acht Reihen südlich von Dulcibel, in R12. Im Kommandozelt liegen R12 C10 und R12 C11 in seiner Zeile - jemand steht in R11 C11. Bertwald nicht, denn Alburg muss südlich von ihm sein; Volkrich nicht, denn sein Mörder fände im Zelt keinen Platz mehr. Alburg steht in R11 C11, und Bertwald ist im Königsgarten.",
      place: { A: { row: 10, col: 10 } },
    },
    {
      text: "Im Vorratszelt kann nur Edward oder Volkrich stehen - und Volkrich nur mit seinem Mörder, wieder Edward. Edward ist also im Vorratszelt. Genauso auf dem Feld: Dort passen nur Catherine (in C2, der Spalte mit Katapult) und Volkrich, Gervais nur in Feralds Zeile - und Volkrich nur mit seinem Mörder, wieder Catherine. Catherine steht auf dem Feld in C2.",
    },
    {
      text: "In C12 gibt es nur Waldfelder. Edward ist im Zelt, Herzog in R12, Gervais westlich der Statue - nur Joshua passt, neben dem Burggraben in R6 C12. Herzogs Bereich ist der Wald, und dort sind alle bärtig: Neben den Katapulten (alle im Wald) können nur Gervais, Herzog, Ivan und Joshua stehen, Edward ja nicht neben einem. Herzog in R12 steht neben keinem, Joshua bewacht das Katapult in R7 C12 - also stehen Gervais und Ivan neben je einem anderen Katapult. Für Gervais bleiben R7 C3 und R9 C7, für Ivan R9 C9, R10 C8 und R10 C10.",
      place: { J: { row: 5, col: 11 } },
    },
    {
      text: "Auf der Brücke muss jemand sein: Catherine ist auf dem Feld, Edward im Zelt, Gervais an einem Katapult. Bleiben Kenric und Volkrich, und Volkrich nur mit seinem Mörder - wieder Kenric. Kenric ist auf der Brücke, in R7 oder R8. Edward und Ivan teilen sich R9 und R10, also steht Gervais in R7 C3 und Kenric in R8 C7. Edward steht in R10 C4 (C3 ist Gervais' Spalte), Ivan in R9 C9.",
      place: {
        G: { row: 6, col: 2 },
        K: { row: 7, col: 6 },
        E: { row: 9, col: 3 },
        I: { row: 8, col: 8 },
      },
    },
    {
      text: "Frei sind noch R1 bis R3, Herzogs R12 und die Spalten C1, C2, C8 und C10. Herzog steht in R12 C1, Bertwald im Königsgarten in R2 C10. Volkrich bleibt C8 in R1 bis R3 - nur R3 C8 im Königsgarten. Catherine steht in R1 C2. Volkrich ist allein mit Bertwald. Bertwald ist der Mörder!",
      place: {
        H: { row: 11, col: 0 },
        B: { row: 1, col: 9 },
        V: { row: 2, col: 7 },
        C: { row: 0, col: 1 },
      },
    },
  ],
  solution: {
    A: { row: 10, col: 10 },
    B: { row: 1, col: 9 },
    C: { row: 0, col: 1 },
    D: { row: 3, col: 5 },
    E: { row: 9, col: 3 },
    F: { row: 4, col: 4 },
    G: { row: 6, col: 2 },
    H: { row: 11, col: 0 },
    I: { row: 8, col: 8 },
    J: { row: 5, col: 11 },
    K: { row: 7, col: 6 },
    V: { row: 2, col: 7 },
  },
};
