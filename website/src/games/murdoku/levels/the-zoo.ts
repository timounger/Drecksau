/**
 * The Zoo: seven habitats, visitors and zookeepers, and a murdered keeper.
 *
 * @module
 * @remarks
 * After the expert case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Expert/TheZoo.png`, solution beside it).
 * Vlad is the victim; whoever was alone with him killed him. Visitors may
 * not enter a habitat, and every habitat holds at least one zookeeper.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data:
   rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  column,
  inArea,
  not,
  on,
  onGround,
  own,
  victim,
} from "../engine/clues";
import type { ClueParts } from "../engine/clues";
import { isStandable, verdictOf } from "../engine/rules";
import type { Cell, Context, Level, Suspect } from "../engine/types";

/** Which area each field belongs to. */
const AREAS: readonly string[] = [
  "LLLLLLPPPPPPBBBB",
  "LLLLLLPPPPPBBBBB",
  "LLLLLLMPPPPBBBBB",
  "LLLLLLMPPPBBBBBB",
  "LLLLLMMMMMBBBBBB",
  "MMMMMMMMMMMBBBBB",
  "CCCCCCMEEMMMBBBB",
  "CCCCCCMEEMMMMKKK",
  "CCCCCCMEEEMMMKKK",
  "CCCCCCMEEEEEMKKK",
  "CCCDDCMEEEEEMKKK",
  "DDDDDMMEEEEEMNNN",
  "SSSSDDMEEEEEMNNN",
  "SSSSSDMEEEEEMNNN",
  "SSSSSDMMMMMMMNNN",
  "SSSDDDDMMMMMMNNN",
];

/** The habitats: only zookeepers may be in them. */
const HABITATS: readonly string[] = ["L", "P", "B", "C", "E", "S"];

/** The fields of each habitat. */
const HABITAT_FIELDS: ReadonlyMap<string, readonly Cell[]> = new Map(
  HABITATS.map((area) => [area, areaFields(area, 0, 15)]),
);

/** The fields of the concessions. */
const CONCESSIONS: readonly Cell[] = areaFields("K", 0, 15);

/** Whether the suspect stands exactly one row north of somebody. */
function oneRowNorth(c: Context, of: string): boolean {
  const there = c.cellOf(of);
  return there !== undefined && c.cell.row === there.row - 1;
}

/**
 * Alone in one's area - checked as soon as the suspect stands, since a
 * second person in the area breaks it for good, and checked again once
 * everybody stands.
 */
function alone(): ClueParts {
  return about([], (c) => c.peopleIn(c.areaOf(c.cell) ?? "").length === 1);
}

/** Whether a field could still take somebody: standable, row and column free. */
function freeField(c: Context, cell: Cell): boolean {
  return (
    c.standable(cell) &&
    c.people().every((id) => {
      const there = c.cellOf(id);
      return (
        there === undefined ||
        (there.row !== cell.row && there.col !== cell.col)
      );
    })
  );
}

/** Whether somebody with a trait is still to be placed. */
function stillToPlace(c: Context, trait: string): boolean {
  const placed = c.people();
  return c.level.suspects.some(
    (one) => !placed.includes(one.id) && c.has(one.id, trait),
  );
}

/** The verdicts of {@link stillSolvable}, once per placement. */
const SOLVABLE = new WeakMap<object, boolean>();

/** Set while {@link stillSolvable} tries fields, so it does not recurse. */
const LOOKING = { now: false };

/** The fields each suspect's own clue and the rules allow, once worked out. */
const DOMAINS = new Map<string, readonly Cell[]>();

/** The fields a suspect's own clue and the rules allow on an empty map. */
function domainOf(level: Level, suspect: Suspect): readonly Cell[] {
  const known = DOMAINS.get(suspect.id);
  const cells =
    known ??
    AREAS.flatMap((line, row) =>
      [...line].flatMap((_, col) => {
        const cell = { row, col };
        return isStandable(level, cell) &&
          verdictOf(level, suspect, { [suspect.id]: cell }) !== "broken"
          ? [cell]
          : [];
      }),
    );
  DOMAINS.set(suspect.id, cells);
  return cells;
}

/**
 * Whether the placement so far can still become a solution: the habitats
 * still without a zookeeper can all get one (enough zookeepers left, a free
 * field in each), and everybody still to be placed has a free field where
 * their clue and the rules can hold. Only prunes the solver's search - what
 * a solution must meet stays in the checks.
 */
function stillSolvable(c: Context): boolean {
  const known = LOOKING.now ? true : SOLVABLE.get(c.placement);
  const verdict =
    known ??
    (() => {
      LOOKING.now = true;
      const placed = c.people();
      const left = c.level.suspects.filter((one) => !placed.includes(one.id));
      const keepersLeft = left.filter((one) =>
        c.has(one.id, "zookeeper"),
      ).length;
      const empty = HABITATS.filter(
        (area) => !c.peopleIn(area).some((one) => c.has(one, "zookeeper")),
      );
      const ok =
        empty.length <= keepersLeft &&
        empty.every((area) =>
          (HABITAT_FIELDS.get(area) ?? []).some((cell) => freeField(c, cell)),
        ) &&
        left.every((one) =>
          domainOf(c.level, one).some(
            (cell) =>
              freeField(c, cell) &&
              verdictOf(c.level, one, { ...c.placement, [one.id]: cell }) !==
                "broken",
          ),
        );
      LOOKING.now = false;
      return ok;
    })();
  SOLVABLE.set(c.placement, verdict);
  return verdict;
}

/** The fields of an area in some columns, counted from 0. */
function areaFields(area: string, from: number, to: number): readonly Cell[] {
  const found: Cell[] = [];
  AREAS.forEach((line, row) => {
    for (let col = from; col <= to; col += 1) {
      if (line[col] === area) {
        found.push({ row, col });
      }
    }
  });
  return found;
}

/** The fields of a column, counted from 0, but one. */
function columnBut(col: number, keep: Cell): readonly Cell[] {
  return AREAS.map((_, row) => ({ row, col })).filter(
    (cell) => cell.row !== keep.row,
  );
}

/** The case. */
export const THE_ZOO: Level = {
  id: "the-zoo",
  name: "Der Zoo",
  difficulty: "expert",
  story:
    "Vlad wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "L",
      name: "Löwengehege",
      at: "im Löwengehege",
      ground: "sand",
      tint: "#f3dca6",
      label: { row: 4, col: 0 },
    },
    {
      key: "P",
      name: "Pinguingehege",
      at: "im Pinguingehege",
      ground: "snow",
      tint: "#dcf0fa",
      label: { row: 3, col: 7 },
    },
    {
      key: "B",
      name: "Bärengehege",
      at: "im Bärengehege",
      ground: "stone",
      tint: "#c9b2a6",
      label: { row: 6, col: 12 },
    },
    {
      key: "M",
      name: "Hauptbereich",
      at: "im Hauptbereich",
      ground: "path",
      tint: "#f2c9b0",
      label: { row: 15, col: 9 },
    },
    {
      key: "C",
      name: "Krokodilgehege",
      at: "im Krokodilgehege",
      ground: "grass",
      tint: "#7fb3aa",
      label: { row: 10, col: 0 },
    },
    {
      key: "E",
      name: "Elefantengehege",
      at: "im Elefantengehege",
      ground: "grass",
      tint: "#cfe8a0",
      label: { row: 13, col: 7 },
    },
    {
      key: "K",
      name: "Imbiss",
      at: "im Imbiss",
      ground: "carpet",
      tint: "#f7c9c4",
      label: { row: 10, col: 13 },
    },
    {
      key: "D",
      name: "Steg",
      at: "auf dem Steg",
      ground: "floor",
      tint: "#b9a6cc",
      label: { row: 15, col: 3 },
    },
    {
      key: "S",
      name: "Haifischbecken",
      at: "im Haifischbecken",
      ground: "water",
      label: { row: 15, col: 0 },
    },
    {
      key: "N",
      name: "Eingang",
      at: "im Eingang",
      ground: "floor",
      tint: "#f3e3b8",
      label: { row: 15, col: 13 },
    },
  ],
  areaMap: AREAS,
  groundMap: [
    "ssssssiwwwiitttt",
    "ssssssiiwiittttt",
    "sssssspiiiittttw",
    "sssssspiiittttww",
    "ssssspppppttttww",
    "pppppppppppttttw",
    "wwggggpggppptttt",
    "wwggggpggppppccc",
    "wgggggpgggpppccc",
    "ggggggpwggggpccc",
    "gggffgpwwgggpccc",
    "fffffppwggggpfff",
    "wwwwffpgggggpfff",
    "wwwwwfpgggggpfff",
    "wwwwwfpppppppfff",
    "wwwffffppppppfff",
  ],
  grounds: {
    s: "sand",
    i: "snow",
    w: "water",
    t: "stone",
    p: "path",
    g: "grass",
    c: "carpet",
    f: "floor",
  },
  thingMap: [
    "...s..q...o...t.",
    "s.l..s...q.b.o.o",
    "....l..qo.....b.",
    ".s..............",
    "....s..c....bt..",
    "T.............t.",
    "...pk....c......",
    "...o....sTc..cTc",
    ".kp.o........Tc.",
    "ko......sEE...Tc",
    ".........EE..cTT",
    "c.......s..s.cT.",
    "..ho...s..EE.TT.",
    ".o..h.....EE....",
    "..h..........TT.",
    "h......Tc....cT.",
  ],
  things: {
    s: "shrub",
    l: "lion",
    q: "penguin",
    o: "boulder",
    b: "bear",
    t: "tree",
    p: "palm",
    k: "crocodile",
    c: "chair",
    T: "table",
    E: "elephant",
    h: "shark",
  },
  suspects: [
    {
      id: "A",
      name: "Alfred",
      pronoun: "er",
      traits: ["visitor"],
      clue: {
        text: "Er war genau eine Reihe nördlich von Ivan.",
        ...about(["I"], (c) => oneRowNorth(c, "I")),
      },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "B",
      name: "Barry",
      pronoun: "er",
      traits: ["visitor"],
      clue: {
        text: "Er war im Imbiss, allein mit einem Besucher.",
        ...all(
          inArea("K"),
          about([], (c) => {
            const there = c.peopleIn("K");
            return (
              there.length <= 2 &&
              there.every((one) => c.has(one, "visitor")) &&
              (there.length === 2 ||
                (stillToPlace(c, "visitor") &&
                  CONCESSIONS.some((cell) => freeField(c, cell))))
            );
          }),
        ),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Carolyn",
      pronoun: "sie",
      traits: ["visitor"],
      clue: {
        text: "Sie war genau eine Reihe nördlich von Deborah.",
        ...about(["D"], (c) => oneRowNorth(c, "D")),
      },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Deborah",
      pronoun: "sie",
      traits: ["visitor"],
      clue: { text: "Sie war im Hauptbereich.", ...inArea("M") },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Eloise",
      pronoun: "sie",
      traits: ["visitor"],
      clue: {
        text: "Sie war neben einem Tisch. Sie saß nicht.",
        ...all(beside("table"), not(on("seat"))),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Flavia",
      pronoun: "sie",
      traits: ["visitor"],
      clue: { text: "Sie war neben einem Stuhl.", ...beside("chair") },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
    {
      id: "G",
      name: "Gordon",
      pronoun: "er",
      traits: ["visitor"],
      clue: {
        text: "Er saß auf einem Stuhl. Er war allein.",
        ...all(on("seat"), alone()),
      },
      colour: "#ea580c",
      face: "\u{1F474}",
    },
    {
      id: "H",
      name: "Henry",
      pronoun: "er",
      traits: ["visitor"],
      clue: {
        text: "Er war allein.",
        ...alone(),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "I",
      name: "Ivan",
      pronoun: "er",
      traits: ["zookeeper"],
      clue: { text: "Er war neben einem Tier.", ...beside("animal") },
      colour: "#0f766e",
      face: "\u{1F468}",
    },
    {
      id: "J",
      name: "Jim",
      pronoun: "er",
      traits: ["zookeeper"],
      clue: {
        text: "Er war nicht im Wasser. Er war neben Wasser.",
        ...all(
          not(onGround("water")),
          own((c) => c.besideGround(c.cell, "water")),
        ),
      },
      colour: "#a16207",
      face: "\u{1F468}",
    },
    {
      id: "K",
      name: "Kaiden",
      pronoun: "sie",
      traits: ["zookeeper"],
      clue: {
        text: "Sie war allein mit Mara.",
        ...about(["M"], (c) => {
          const there = c.cellOf("M");
          return (
            there !== undefined &&
            c.areaOf(there) === c.areaOf(c.cell) &&
            c.peopleIn(c.areaOf(c.cell) ?? "").length === 2
          );
        }),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "L",
      name: "Langston",
      pronoun: "er",
      traits: ["zookeeper"],
      clue: {
        text: "Er war im Wasser. Er war nicht neben einem Tier.",
        ...all(onGround("water"), not(beside("animal"))),
      },
      colour: "#1d4ed8",
      face: "\u{1F468}",
    },
    {
      id: "M",
      name: "Mara",
      pronoun: "sie",
      traits: ["zookeeper"],
      clue: { text: "Sie war in der zweiten Spalte.", ...column(2) },
      colour: "#65a30d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "N",
      name: "Nancy",
      pronoun: "sie",
      traits: ["zookeeper"],
      clue: { text: "Sie war neben einem Baum.", ...beside("tree") },
      colour: "#c2410c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "O",
      name: "Oliver",
      pronoun: "er",
      traits: ["zookeeper"],
      clue: { text: "Er war neben einem Felsen.", ...beside("boulder") },
      colour: "#7e22ce",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "V",
      name: "Vlad",
      pronoun: "er",
      traits: ["zookeeper"],
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F474}",
    },
  ],
  rules: [
    {
      text: "Alle von Ivan bis Vlad waren Tierpfleger. Nur Tierpfleger durften in Gehegen sein.",
      unary: (suspect, c) =>
        (suspect.traits ?? []).includes("zookeeper") ||
        !HABITATS.includes(c.areaOf(c.cell) ?? ""),
      check: (c) =>
        c
          .people()
          .every(
            (one) =>
              c.has(one, "zookeeper") ||
              !HABITATS.includes(c.areaOf(c.cellOf(one) ?? c.cell) ?? ""),
          ),
    },
    {
      text: "In jedem Gehege war mindestens ein Tierpfleger.",
      prune: (c) => stillSolvable(c),
      check: (c) =>
        HABITATS.every((area) =>
          c.peopleIn(area).some((one) => c.has(one, "zookeeper")),
        ),
    },
  ],
  hints: [
    {
      text: "Deborah ist im Hauptbereich und Barry im Imbiss. Kein Besucher darf in ein Gehege (allgemeiner Hinweis), also können Gordon und Henry nur allein auf dem Steg und im Eingang sein, in beliebiger Reihenfolge. Außerdem sind Barry und noch jemand im Imbiss, und Gordon oder Henry ist allein im Eingang. Niemand kann also im Bärengehege in den Spalten 14, 15 und 16 stehen - streiche diese Felder. Nancy kann nur neben einem Baum im Krokodilgehege stehen.",
      cross: areaFields("B", 13, 15),
    },
    {
      text: "Kein Gehege ist leer, und es bleiben fünf Gehege. Nur Mara und Kaiden sowie Vlad und der Mörder sind zusammen, die anderen Tierpfleger müssen allein in einem Gehege sein. Jim kann also nicht bei Nancy sein. Damit steht Jim in Spalte 8, entweder im Pinguin- oder im Elefantengehege. Streiche den Rest von Spalte 8.",
      cross: columnBut(7, { row: 8, col: 7 }),
    },
    {
      text: "Wo kann Eloise sein? Spalte 2 ist schon von Mara besetzt. Gordon oder Henry ist allein im Eingang. Eloise kann nur neben einem Tisch in Reihe 10, Spalte 14 stehen.",
      place: { E: { row: 9, col: 13 } },
    },
    {
      text: "Damit bleibt für Gordon nur ein Stuhl, allein auf dem Steg. Streiche den Rest des Stegs.",
      place: { G: { row: 11, col: 0 } },
    },
    {
      text: "Langston kann nicht bei Nancy sein (siehe Schritt 2). Damit bleibt ihm nur das letzte Wasserfeld, das nicht neben einem Tier liegt.",
      place: { L: { row: 0, col: 8 } },
    },
    {
      text: "Damit steht Jim im Elefantengehege, dann Barry, dann Nancy und Henry.",
      place: {
        J: { row: 8, col: 7 },
        B: { row: 7, col: 15 },
        N: { row: 6, col: 2 },
        H: { row: 13, col: 14 },
      },
    },
    {
      text: "Damit bleibt für Oliver nur das letzte freie Feld neben einem Felsen.",
      place: { O: { row: 1, col: 12 } },
    },
    {
      text: "Ivan kann nicht bei Langston, Nancy, Jim oder Oliver sein (siehe Schritt 2). Nach dem allgemeinen Hinweis ist Alfred im Hauptbereich, und er ist genau eine Reihe nördlich von Ivan. Ivan kann also nur neben dem Löwen in Reihe 4, Spalte 5 stehen, mit Alfred in Reihe 3, Spalte 7.",
      place: { I: { row: 3, col: 4 }, A: { row: 2, col: 6 } },
    },
    {
      text: "Damit bleibt für Kaiden nur noch ein Feld.",
      place: { K: { row: 14, col: 3 } },
    },
    {
      text: "Carolyn ist Besucherin und darf in kein Gehege; sie steht genau eine Reihe nördlich von Deborah im Hauptbereich.",
    },
    {
      text: "Carolyn und Deborah müssen in Reihe 5 und 6 stehen. Damit bleibt für Flavia nur der Platz neben dem letzten Stuhl, dann für Mara (bei Kaiden), Carolyn und Deborah.",
      place: {
        F: { row: 15, col: 9 },
        M: { row: 12, col: 1 },
        C: { row: 4, col: 5 },
        D: { row: 5, col: 10 },
      },
    },
    {
      text: "Für Vlad bleibt das letzte Feld, allein mit Jim im Elefantengehege. Jim ist der Mörder!",
      place: { V: { row: 10, col: 11 } },
    },
  ],
  solution: {
    A: { row: 2, col: 6 },
    B: { row: 7, col: 15 },
    C: { row: 4, col: 5 },
    D: { row: 5, col: 10 },
    E: { row: 9, col: 13 },
    F: { row: 15, col: 9 },
    G: { row: 11, col: 0 },
    H: { row: 13, col: 14 },
    I: { row: 3, col: 4 },
    J: { row: 8, col: 7 },
    K: { row: 14, col: 3 },
    L: { row: 0, col: 8 },
    M: { row: 12, col: 1 },
    N: { row: 6, col: 2 },
    O: { row: 1, col: 12 },
    V: { row: 10, col: 11 },
  },
};
