/**
 * Checks Murdle cases: the data is sound, there is exactly one solution, it
 * is the stored one, and where the sample prints a solution, it is that one.
 *
 * @module
 * @remarks
 * Run with `npm run murdle`. Exits with 1 when anything is wrong.
 */
import { CASES } from "../src/games/murdle/engine/cases";
import {
  NO_MARKS,
  cellKey,
  idsOf,
  solvedMarks,
  squareOf,
  stepped,
} from "../src/games/murdle/engine/grid";
import { sceneOf, solve } from "../src/games/murdle/engine/solver";
import type { Case, World } from "../src/games/murdle/engine/types";

/**
 * The solutions as the book prints them ("How to Solve" and the solutions of
 * cases 1 and 2), copied from the page independently of the case data: per
 * suspect, weapon and place.
 */
const PRINTED: Readonly<Record<string, World>> = {
  "deduction-college": {
    honey: { weapon: "cord", location: "old-main" },
    glaucous: { weapon: "backpack", location: "stadium" },
    tuscany: { weapon: "pencil", location: "bookstore" },
  },
  "murder-in-hollywood": {
    aureolin: { weapon: "candle", location: "bathroom" },
    midnight: { weapon: "pipe", location: "bedroom" },
    obsidian: { weapon: "fork", location: "screening-room" },
  },
  "and-then-there-was-another-one": {
    saffron: { weapon: "bear-trap", location: "ruins" },
    emerald: { weapon: "brick", location: "cliffs" },
    mango: { weapon: "harpoon", location: "docks" },
  },
};

/** The murderers the book names, where it prints a solution. */
const PRINTED_MURDERER: Readonly<Record<string, string>> = {
  "deduction-college": "honey",
  "murder-in-hollywood": "aureolin",
  "and-then-there-was-another-one": "mango",
};

/** Characters the coding rules forbid in any text: the en and em dash. */
const FORBIDDEN_DASHES = new RegExp("[\\u2013\\u2014]");

/** How much of a text a problem quotes. */
const QUOTE_LENGTH = 40;

let failed = false;
for (const kase of CASES) {
  const problems = problemsOf(kase);
  const solutions = solve(kase);
  if (solutions.length !== 1) {
    problems.push(`${String(solutions.length)} solutions instead of one`);
  } else {
    const [only] = solutions;
    if (!sameWorld(only.world, kase.solution)) {
      problems.push(`the solver's solution differs from the stored one`);
    }
    if (only.murderer !== kase.murderer) {
      problems.push(
        `the solver's murderer is ${only.murderer}, not ${kase.murderer}`,
      );
    }
  }
  const printed = PRINTED[kase.id];
  if (printed !== undefined && !sameWorld(printed, kase.solution)) {
    problems.push("the stored solution is not the printed one");
  }
  const printedMurderer = PRINTED_MURDERER[kase.id];
  if (printedMurderer !== undefined && printedMurderer !== kase.murderer) {
    problems.push(`the book names ${printedMurderer} as the murderer`);
  }
  const name =
    kase.number === null ? kase.title : `${String(kase.number)}. ${kase.title}`;
  if (problems.length === 0) {
    const murderer = kase.solution[kase.murderer];
    console.log(
      `ok    ${name}: ${kase.murderer} | ${murderer.weapon} | ${murderer.location}${
        murderer.motive === undefined ? "" : ` | ${murderer.motive}`
      }${printed === undefined ? "" : " (as printed)"}`,
    );
  } else {
    failed = true;
    console.log(`FAIL  ${name}`);
    for (const problem of problems) {
      console.log(`      - ${problem}`);
    }
  }
}
process.exit(failed ? 1 : 0);

/**
 * The problems in a case's data, before solving it.
 *
 * @param kase - the case
 * @returns what is wrong, empty when nothing is
 */
function problemsOf(kase: Case): string[] {
  const problems: string[] = [];
  const size = kase.suspects.length;
  const categories = [
    ["weapons", kase.weapons.length],
    ["locations", kase.locations.length],
    ...(kase.motives === undefined ? [] : [["motives", kase.motives.length]]),
  ] as const;
  for (const [category, count] of categories) {
    if (count !== size) {
      problems.push(
        `${String(count)} ${category} for ${String(size)} suspects`,
      );
    }
  }
  const ids = [
    ...idsOf(kase, "suspects"),
    ...idsOf(kase, "weapons"),
    ...idsOf(kase, "locations"),
    ...idsOf(kase, "motives"),
  ];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      problems.push(`id "${id}" is used twice`);
    }
    seen.add(id);
  }
  const scene = sceneOf(kase, kase.solution);
  kase.clues.forEach((clue, at) => {
    if (!clue.holds(scene)) {
      problems.push(`clue ${String(at + 1)} does not hold in the solution`);
    }
  });
  for (const statement of kase.statements ?? []) {
    if (statement.holds(scene) !== (statement.by !== kase.murderer)) {
      problems.push(`the statement of ${statement.by} breaks the rule`);
    }
  }
  const murder = kase.solution[kase.murderer];
  if (
    kase.body !== undefined &&
    ("location" in kase.body
      ? murder?.location !== kase.body.location
      : murder?.weapon !== kase.body.weapon)
  ) {
    problems.push("the murderer did not have what the body clue names");
  }
  if (kase.hints.length === 0) {
    problems.push("no hints");
  }
  problems.push(...hintMarkProblems(kase));
  const texts = [
    kase.title,
    kase.story,
    kase.outro ?? "",
    kase.body?.text ?? "",
    ...kase.clues.map((one) => one.text),
    ...(kase.statements ?? []).map((one) => one.text),
    ...kase.hints.map((one) => one.text),
    ...kase.suspects.flatMap((one) => [one.name, one.description]),
    ...kase.weapons.flatMap((one) => [one.name, one.description]),
    ...kase.locations.flatMap((one) => [one.name, one.description]),
    ...(kase.motives ?? []).map((one) => one.name),
  ];
  for (const text of texts) {
    if (FORBIDDEN_DASHES.test(text)) {
      problems.push(`a typographic dash in "${text.slice(0, QUOTE_LENGTH)}"`);
    }
  }
  return problems;
}

/**
 * The problems in the squares the hints conclude: each must name two items
 * that meet in the grid and agree with the solution, and all steps carried
 * out in order, with auto-cross, must fill the whole grid as solved.
 *
 * @param kase - the case
 * @returns what is wrong, empty when nothing is
 */
function hintMarkProblems(kase: Case): string[] {
  const problems: string[] = [];
  const solved = solvedMarks(kase, kase.solution);
  kase.hints.forEach((hint, at) => {
    for (const mark of hint.marks ?? []) {
      const square = squareOf(kase, mark.a, mark.b);
      const wanted = mark.value === "check" ? "check" : "x";
      if (square === null) {
        problems.push(
          `hint ${String(at + 1)}: ${mark.a}/${mark.b} is no square`,
        );
      } else if (solved[cellKey(square.row, square.col)] !== wanted) {
        problems.push(
          `hint ${String(at + 1)}: ${mark.a}/${mark.b} ${mark.value} is wrong`,
        );
      }
    }
  });
  const all = kase.hints.reduce(
    (marks, hint) => stepped(kase, marks, hint.marks ?? [], true),
    NO_MARKS,
  );
  const unsolved = Object.keys(solved).filter(
    (key) => all[key] !== solved[key],
  );
  if (unsolved.length > 0) {
    problems.push(
      `all hints carried out leave ${String(unsolved.length)} squares unsolved`,
    );
  }
  return problems;
}

/**
 * Whether two solutions hand out the same things.
 *
 * @param left - one solution
 * @param right - the other
 * @returns whether every suspect has the same weapon, place and motive
 */
function sameWorld(left: World, right: World): boolean {
  const ids = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...ids].every(
    (id) =>
      left[id]?.weapon === right[id]?.weapon &&
      left[id]?.location === right[id]?.location &&
      left[id]?.motive === right[id]?.motive,
  );
}
