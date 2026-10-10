/**
 * Checks Murdoku cases: the data is sound, there is exactly one solution, and
 * it is the one on the solution sheet.
 *
 * @module
 * @remarks
 * Run with `npm run murdoku` for every case, or with a file to check one that
 * is not registered yet:
 * `npx tsx --tsconfig tsconfig.json scripts/murdoku-check.ts src/games/murdoku/levels/car-repair.ts`.
 * Exits with 1 when anything is wrong.
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { LEVELS } from "../src/games/murdoku/engine/levels";
import {
  areaAt,
  checked,
  culpritOf,
  isStandable,
  sizeOf,
  solve,
  thingAt,
  thingDef,
} from "../src/games/murdoku/engine/rules";
import { GROUNDS } from "../src/games/murdoku/engine/catalog";
import type { Level, Placement } from "../src/games/murdoku/engine/types";

/** The problems found in a case's data. */
function problemsOf(level: Level): readonly string[] {
  const problems: string[] = [];
  const { rows, cols } = sizeOf(level);
  const sameWidth = (name: string, map: readonly string[] | undefined) => {
    if (map !== undefined) {
      if (map.length !== rows) {
        problems.push(`${name} has ${map.length} rows, the area map ${rows}`);
      }
      map.forEach((line, at) => {
        if (line.length !== cols) {
          problems.push(
            `${name} row ${at + 1} has ${line.length} fields, not ${cols}`,
          );
        }
      });
    }
  };
  sameWidth("areaMap", level.areaMap);
  sameWidth("thingMap", level.thingMap);
  sameWidth("groundMap", level.groundMap);
  const keys = new Set(level.areas.map((area) => area.key));
  level.areaMap.forEach((line, row) => {
    [...line].forEach((key, col) => {
      if (key !== "." && !keys.has(key)) {
        problems.push(
          `area key "${key}" at R${row + 1}C${col + 1} has no area`,
        );
      }
      try {
        const thing = thingAt(level, { row, col });
        if (thing !== null) {
          thingDef(level, thing);
        }
      } catch (error) {
        problems.push(String(error));
      }
      const thingKey = level.thingMap[row]?.[col] ?? ".";
      if (thingKey !== "." && level.things[thingKey] === undefined) {
        problems.push(
          `thing key "${thingKey}" at R${row + 1}C${col + 1} is not in "things"`,
        );
      }
      const groundKey = level.groundMap?.[row]?.[col];
      if (groundKey !== undefined && level.grounds?.[groundKey] === undefined) {
        problems.push(
          `ground key "${groundKey}" at R${row + 1}C${col + 1} is not in "grounds"`,
        );
      }
    });
  });
  for (const ground of Object.values(level.grounds ?? {})) {
    if (GROUNDS[ground] === undefined) {
      problems.push(`unknown ground "${ground}"`);
    }
  }
  for (const area of level.areas) {
    if (!keys.has(area.key) || areaAt(level, area.label)?.key !== area.key) {
      problems.push(
        `label of area ${area.key} (${area.name}) is not inside it`,
      );
    }
  }
  for (const suspect of level.suspects) {
    const cell = level.solution[suspect.id];
    if (cell === undefined) {
      problems.push(`solution has no place for ${suspect.id}`);
    } else if (!isStandable(level, cell)) {
      problems.push(
        `solution puts ${suspect.id} on R${cell.row + 1}C${cell.col + 1}, where nobody can stand`,
      );
    }
  }
  return problems;
}

/** A placement as text: one line per suspect. */
function show(placement: Placement): string {
  return Object.entries(placement)
    .map(([id, cell]) => `${id}=R${cell.row + 1}C${cell.col + 1}`)
    .join(" ");
}

/** Checks one case; true when it is sound. */
function check(level: Level): boolean {
  console.log(`\n== ${level.id} (${level.name}, ${level.difficulty})`);
  const problems = problemsOf(level);
  problems.forEach((one) => console.log(`  PROBLEM: ${one}`));
  let ok = problems.length === 0;
  if (ok) {
    const began = Date.now();
    const found = solve(level);
    console.log(
      `  solutions found: ${found.length} in ${Date.now() - began} ms`,
    );
    found.forEach((one, at) =>
      console.log(`  solution ${at + 1}: ${show(one)}`),
    );
    console.log(`  solution sheet: ${show(level.solution)}`);
    const first = found[0];
    const matches =
      found.length === 1 &&
      first !== undefined &&
      Object.values(checked(level, first)).every(Boolean);
    if (!matches) {
      const wrong = level.suspects
        .filter((one) => first !== undefined && !checked(level, first)[one.id])
        .map((one) => one.id);
      console.log(
        `  MISMATCH${wrong.length > 0 ? `: ${wrong.join(", ")} differ` : ""}`,
      );
    }
    console.log(
      `  culprit on the sheet: ${culpritOf(level, level.solution) ?? "NONE - the victim is not alone with exactly one"}`,
    );
    ok = matches && culpritOf(level, level.solution) !== null;
  }
  console.log(ok ? "  OK" : "  FAILED");
  return ok;
}

/** Checks the cases named on the command line, or all registered ones. */
async function main(): Promise<void> {
  const files = process.argv.slice(2);
  const levels: Level[] = [];
  if (files.length === 0) {
    levels.push(...LEVELS);
  } else {
    for (const file of files) {
      const loaded = (await import(
        pathToFileURL(resolve(file)).href
      )) as Record<string, unknown>;
      levels.push(
        ...(Object.values(loaded).filter(
          (one) => typeof one === "object" && one !== null && "areaMap" in one,
        ) as Level[]),
      );
    }
  }
  const results = levels.map(check);
  process.exit(results.every(Boolean) ? 0 : 1);
}

void main();
