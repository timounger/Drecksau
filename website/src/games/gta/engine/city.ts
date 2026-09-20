/**
 * Laying out Los Santos: streets, blocks, the beach and the four districts.
 *
 * @module
 * @remarks
 * A grid city, because a grid is what a top-down car game needs: every corner
 * is a decision, and a chase has somewhere to go. The blocks between the
 * streets are buildings with a pavement around them, so a person on foot always
 * has a way past and a car always has a kerb to mount.
 *
 * **Three cities, not one.** They stand in the sea with water between them and
 * are joined by three bridges; a railway runs a great rectangle through all
 * three, over the water on its own crossings. Motorways are the same streets as
 * the others, three lanes wide instead of one - every fourth line of the grid.
 * All of it comes out of the coordinates: there is no map file, and the same
 * square is the same thing for ever.
 *
 * The city is the same every time. A city that reshuffled itself would take
 * away the one thing that makes an open world an open world - that after an
 * hour you know where you are.
 */
import {
  AIRPORT,
  AIRPORT_GATE,
  BARN_HIGH,
  BASE,
  BASE_GATE,
  CHANNEL,
  CHANNEL_FLARE,
  CHANNEL_NORTH,
  BASE_HUTS,
  FARMS,
  HOUSE_HIGH,
  HOUSE_LOW,
  HUT_HIGH,
  FIELDS,
  MOUNTAIN,
  BLOCK_TILES,
  DESERT,
  HARBOUR,
  ISLANDS,
  LAND,
  LIGHT_AMBER,
  LIGHT_PHASE,
  PIERS,
  RUNWAY,
  CITY_TILES,
  TILE,
  type Cell,
  type District,
  type Island,
  type Vec,
} from "./types";
import {
  BUILDINGS,
  THE_BLOCKS,
  wallHeight,
  type Building,
  type BuildingKind,
} from "./buildings";

/** How many cells of a block are pavement on each side. */
const WALK_RING = 1;

/** The middle square of a block, for asking what stands on it. */
const BLOCK_MIDDLE = BLOCK_TILES / 2;

/** Where the door of a block is, across it: the middle of its houses. */
const DOOR_ACROSS = 4.5;

/** And down: the pavement south of the front wall. */
const DOOR_DOWN = 6.5;

/** And for a prison, whose wall reaches the kerb: the street outside it. */
const PRISON_KERB = 0.5;

/**
 * Builds the city floor.
 *
 * @returns one cell per grid square, row by row
 */
export function createCity(): readonly Cell[] {
  const cells: Cell[] = [];
  for (let row = 0; row < CITY_TILES; row += 1) {
    for (let col = 0; col < CITY_TILES; col += 1) {
      cells.push(cellAt(col, row));
    }
  }
  return cells;
}

/**
 * What one square of San Andreas is.
 *
 * @remarks
 * The order of the questions is the order the map was drawn in. The railway
 * goes down first because it crosses everything; then the country roads, which
 * are bridges wherever they leave the land; then the airport and the piers,
 * the beach, and the built-up grid of a city. Only what is left over is
 * landscape - sea, desert, woodland, meadow.
 */
function cellAt(col: number, row: number): Cell {
  let cell: Cell;
  // **Ueber Wasser ist alles, was hinueberfuehrt, eine Bruecke.** Die beiden
  // Fragen darunter werden zuerst gestellt, weil Bahn und Strassen zuerst
  // gezeichnet werden, und ueber Wasser ist die Antwort auf beide dasselbe
  // Feld: ein Deck mit See darunter - siehe das `"bridge"`-Feld.
  //
  // Frueher galt das nur in der Meerenge. Damit waren die drei aelteren
  // Querungen im Westen weiter massiver Asphalt auf dem Meer: kein Gelaender,
  // kein Traeger, und mit dem Boot kam man nicht darunter durch. Es ist
  // dieselbe Sache, also ist es dieselbe Regel.
  const spanning = !onLand(col, row);
  if (onRail(col, row)) {
    cell = spanning ? "bridge" : "rail";
  } else if (onFence(col, row)) {
    cell = "fence";
  } else if (BASE_HUTS.some((hut) => inBox(hut, col, row))) {
    cell = "building";
  } else if (inBox(BASE, col, row)) {
    // **The base is asked before the roads are.** Inside the wire, the gate
    // included: concrete, and one drives straight in. What stops anybody is
    // not the ground, it is the ten men on it.
    //
    // It used to be asked afterwards, and a road whose last point stopped a
    // row short of the fence still laid two and a half squares of tarmac past
    // it, because a road five squares wide reaches that far either side of its
    // line. So a slip road ran in through the gate and up to the barracks -
    // and no road runs onto a military base. The roads now stop at the wire
    // whatever their width does, and the nearest one goes **past** the place
    // rather than into it.
    cell = "dock";
  } else if (onRoute(col, row)) {
    cell = spanning ? "bridge" : "road";
  } else if (onTrack(col, row)) {
    cell = "dirt";
  } else if (FARMS.some((farm) => inBox(farm, col, row))) {
    cell = "building";
  } else if (inBox(AIRPORT, col, row)) {
    // **The wire first, the field after it.** An airfield with a road running
    // onto it at every corner is a car park with a runway in it; this one has
    // a fence round the whole of it and one gate, on the street side. The
    // same square that stops a car is the one the picture draws the wire on.
    cell = onAirportFence(col, row)
      ? "fence"
      : inBox(RUNWAY, col, row)
        ? "runway"
        : "dock";
  } else if (onPier(col, row)) {
    cell = "dock";
  } else if (inBox(HARBOUR, col, row) && onLand(col, row)) {
    // Before the beach: the docks are a tongue of land with water on three
    // sides, and asked in the other order the whole quay would be sand.
    cell = "dock";
  } else if (onShore(col, row)) {
    cell = "sand";
  } else if (inCity(col, row)) {
    cell = inTown(col, row);
  } else if (!onLand(col, row)) {
    cell = "water";
  } else if (inBox(DESERT, col, row)) {
    cell = "sand";
  } else if (onMountain(col, row)) {
    cell = "rock";
  } else if (FIELDS.some((field) => inBox(field, col, row))) {
    cell = "field";
  } else {
    cell = wooded(col, row) ? "forest" : "park";
  }
  return cell;
}

/** The built-up part: streets, pavements, parks and blocks. */
function inTown(col: number, row: number): Cell {
  let cell: Cell;
  const gaol = prisonUnder(col, row);
  if (gaol !== null) {
    // **Before the streets, not after them.** A prison stands on four blocks
    // and the street that used to run between them is inside it: asked in the
    // old order that street won and the yard had a road through the middle of
    // it. The streets round the outside are untouched, because the footprint
    // stops at them.
    cell = prisonCell(gaol, col, row);
  } else if (villaCell(col, row) !== null) {
    // **The villa has grounds, and the floor knows it.** Asked before the
    // streets, not after them, for the same reason the prison is: the property
    // is two blocks wide and the street that used to run between them is
    // inside it. Asked in the other order that street won and there was a
    // road through the middle of somebody's garden.
    cell = villaCell(col, row) ?? "walk";
  } else if (hallCell(col, row) !== null) {
    // **And the town hall's ground, also before the streets.** One of those
    // streets is the drive it swallowed - see HALL_BLOCK - and asked in the
    // other order the drive would win and run through the building.
    cell = hallCell(col, row) ?? "walk";
  } else if (isRoad(col, true) || isRoad(row, false)) {
    cell = "road";
  } else if (onCarPark(col, row)) {
    // The tarmac round the supermarket, which is where its own pavement would
    // otherwise be. Concrete rather than road: it is not part of the street
    // grid, so the traffic never turns on to it and nobody on foot treats
    // crossing it as crossing a road.
    cell = "dock";
  } else if (nextToRoad(col, true) || nextToRoad(row, false)) {
    // **Unless the house is standing on it.** The ring is a square wide on
    // every side that has tarmac beyond it, and a block whose front is a
    // motorway gives its back strip to the building instead - see
    // {@link builtSpan}. That square is drawn as wall, so it has to *be* wall:
    // left as pavement it was a strip of floor inside somebody's shop, and the
    // city dutifully parked a car and stood three people in it.
    cell = builtOver(col, row) ? "building" : "walk";
  } else if (
    !builtBlock(Math.floor(col / BLOCK_TILES), Math.floor(row / BLOCK_TILES))
  ) {
    // A block with nothing on it is open ground, and the floor has to say so.
    // The plan decides what is built - parks, the blocks the railway curves
    // through, the half blocks along the shore - and if the floor disagreed
    // one would walk into a wall that is not drawn anywhere.
    cell = "park";
  } else {
    cell = "building";
  }
  return cell;
}

/**
 * What one square of the town hall's ground is.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns the floor there, or null for a square that is not its business
 * @remarks
 * Three answers over one rectangle: the building itself, a square of pavement
 * all the way round it, and meadow for the rest - which is the ground the hall
 * used to stand on and the drive that used to run beside it. See
 * {@link HALL_BLOCK}.
 */
function hallCell(col: number, row: number): Cell | null {
  if (!theHall(HALL_BLOCK.x, HALL_BLOCK.y)) {
    return null;
  }
  const plot = builtPlot(HALL_BLOCK.x, HALL_BLOCK.y);
  const ground = {
    left: plot.left - 1,
    top: plot.top - 1,
    right: HALL_STREET.to + 2,
    bottom: plot.bottom + HALL_UP,
  };
  if (
    col < ground.left ||
    col >= ground.right ||
    row < ground.top ||
    row >= ground.bottom
  ) {
    return null;
  }
  const built =
    col >= plot.left &&
    col < plot.right &&
    row >= plot.top &&
    row < plot.bottom;
  const street = col >= HALL_STREET.from && col <= HALL_STREET.to;
  const ring =
    col >= plot.left - 1 &&
    col < plot.right + 1 &&
    row >= plot.top - 1 &&
    row < plot.bottom + 1;
  // The footway between the new street and the airport fence: a fence with no
  // path along it is a fence one cannot walk past.
  const fence = col === ground.right - 1;
  if (built) {
    return "building";
  }
  return street ? "road" : ring || fence ? "walk" : "park";
}

/**
 * Whether a square of a block's pavement ring has the building on it.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true where {@link builtPlot} reaches over the ring
 * @remarks
 * Asked only of the ring, because everything inside it is building anyway and
 * everything outside is tarmac. One question, asked of the same function the
 * picture draws from, so that the wall one can see is the wall one walks into.
 */
function builtOver(col: number, row: number): boolean {
  const blockX = Math.floor(col / BLOCK_TILES);
  const blockY = Math.floor(row / BLOCK_TILES);
  let over = false;
  if (builtBlock(blockX, blockY)) {
    const plot = builtPlot(blockX, blockY);
    over =
      col >= plot.left &&
      col < plot.right &&
      row >= plot.top &&
      row < plot.bottom;
  }
  return over;
}

/**
 * Which prison a square belongs to, if any.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns the top left block of the prison over it, or null
 * @remarks
 * **A prison is four blocks, not one.** It is anchored on the block the plan
 * drew it on and reaches {@link PRISON_BLOCKS} blocks east and south of it, so
 * a square belongs to it if any of the blocks up and to the left of that
 * square is the anchor. Four candidates, checked nearest first, which is what
 * makes two prisons that happened to land beside each other come out as one
 * larger one rather than as two overlapping ones.
 *
 * It answers with the anchor rather than with yes or no, because everything
 * else about a prison - where its wall is, where its yard is - is measured
 * from there.
 */
export function prisonUnder(col: number, row: number): Vec | null {
  const blockX = Math.floor(col / BLOCK_TILES);
  const blockY = Math.floor(row / BLOCK_TILES);
  let found: Vec | null = null;
  for (let back = 0; back < PRISON_BLOCKS && found === null; back += 1) {
    for (let up = 0; up < PRISON_BLOCKS && found === null; up += 1) {
      const at = { x: blockX - back, y: blockY - up };
      if (isPrisonBlock(at.x, at.y)) {
        const plot = prisonPlot(at.x, at.y);
        const inside =
          col >= plot.left &&
          col < plot.right &&
          row >= plot.top &&
          row < plot.bottom;
        found = inside ? at : null;
      }
    }
  }
  return found;
}

/** Whether the plan anchors a prison on this block. */
export function isPrisonBlock(blockX: number, blockY: number): boolean {
  return (
    builtBlock(blockX, blockY) && buildingAt(blockX, blockY).kind === "prison"
  );
}

/**
 * What one square of a prison block is.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns wall, yard, or the hut in the middle of the yard
 * @remarks
 * **A square of building the whole way round, and a yard inside it.** The ring
 * is one square thick and runs from kerb to kerb with no way through it - not
 * a gate, not a gap - which is the point of the shape: what one can see of the
 * inside of a prison from the street is nothing at all.
 *
 * The yard is open ground, and it is open ground one cannot walk to. The only
 * way in is over the wall, which means the jetpack, and the only way out again
 * is the same way - so a yard that nothing can reach is not a mistake, it is
 * the one place in the city one has to fly to.
 *
 * And a small block in the middle of it, which is what stands in the middle of
 * a prison yard.
 */
function prisonCell(anchor: Vec, col: number, row: number): Cell {
  const plot = prisonPlot(anchor.x, anchor.y);
  // **The wire, right at the edge.** Round the whole of it, a square out from
  // the building: the strip between the two is the sterile ground every prison
  // keeps clear, and it is what makes the fence read as a fence rather than as
  // a pattern painted along the bottom of the wall.
  const wired =
    col < plot.left + PRISON_FENCE ||
    col >= plot.right - PRISON_FENCE ||
    row < plot.top + PRISON_FENCE ||
    row >= plot.bottom - PRISON_FENCE;
  if (wired) {
    return "fence";
  }
  const inset = PRISON_FENCE + PRISON_WING;
  const ring =
    col < plot.left + inset ||
    col >= plot.right - inset ||
    row < plot.top + inset ||
    row >= plot.bottom - inset;
  const hut = prisonHut(plot);
  const shed =
    col >= hut.x &&
    col < hut.x + PRISON_SHED &&
    row >= hut.y &&
    row < hut.y + PRISON_SHED;
  // **The yard is grass**, not concrete: a prison yard is a field with a court
  // worn into it, and the floor says so as plainly as the picture does.
  return ring || shed ? "building" : "park";
}

/**
 * Which square of the yard the hut stands on.
 *
 * @param plot - the prison's footprint, in squares
 * @returns that square
 * @remarks
 * Its own function because two things have to agree about it to the square:
 * the floor, which makes it solid, and the picture, which draws it.
 *
 * **Up in the corner, and standing clear of the walls.** A shed in the middle
 * of the yard is a shed in the middle of everything - it stood in the
 * basketball court, the men walking their circuits walked through it, and
 * there was nowhere left to put anything else. Up at the top left it is a
 * building at the edge of a yard, which is where the workshop of one of these
 * is; a square in from the ranges, so one can walk round it, which is what
 * makes it a building in a yard rather than a lump on the wall.
 */
export function prisonHut(plot: {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}): Vec {
  return {
    x: plot.left + PRISON_FENCE + PRISON_WING + SHED_IN,
    y: plot.top + PRISON_FENCE + PRISON_WING + SHED_IN,
  };
}

/**
 * Which square of the wire the way in is at.
 *
 * @param plot - the prison's footprint, in squares
 * @returns that square
 * @remarks
 * The middle of the south side, which is where the gate of the building is -
 * the two have to line up, or one drives up to a barrier and finds the wall
 * behind it. Both the picture of the fence and the picture of the range take
 * the answer from here.
 */
export function prisonGate(plot: {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}): Vec {
  return {
    x: Math.floor((plot.left + plot.right) / 2),
    y: plot.bottom - 1,
  };
}

/**
 * Where the four watchtowers of a prison stand.
 *
 * @param plot - its footprint, in squares
 * @returns the middle of each corner square of the range, in pixels
 * @remarks
 * One answer for two questions that must not disagree: where the picture puts
 * the towers, and where the engine puts the men who shoot out of them. A
 * searchlight that swings from one corner while the shot comes from another is
 * two prisons on the same block.
 */
export function prisonTowers(plot: {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}): readonly Vec[] {
  const left = (plot.left + PRISON_FENCE) * TILE + TILE / 2;
  const right = (plot.right - PRISON_FENCE) * TILE - TILE / 2;
  const top = (plot.top + PRISON_FENCE) * TILE + TILE / 2;
  const down = (plot.bottom - PRISON_FENCE) * TILE - TILE / 2;
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: left, y: down },
    { x: right, y: down },
  ];
}

/**
 * Where the warders of a prison stand.
 *
 * @param plot - its footprint, in squares
 * @returns one spot a man, in pixels
 * @remarks
 * **On the grass, where one can shoot back at them.** The yard used to be
 * held by nobody at all: four rounds a second came out of the corners of the
 * building from nothing that was drawn and nothing that could be hit, so
 * standing in the yard was standing in a room that took health off you. That
 * is not a guard, it is a hazard - and the difference matters, because a
 * hazard has no answer and a guard has six.
 *
 * So the men are real: ordinary policemen with a post, the same sort as the
 * ten on the military base. Four of them stand under the four towers, one by
 * one with the searchlights above them, and two more walk the middle of the
 * yard. Shoot all six and the place has nobody left in it, which is the whole
 * point of counting them.
 *
 * They stand **a square inside the ranges**, not in the corners of the
 * building itself: a man drawn inside a wall is a man whose own wall stops
 * every bullet fired at him, and a guard one cannot hit is the hazard again
 * with a hat on.
 */
export function warderPosts(plot: {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}): readonly Vec[] {
  const inset = PRISON_FENCE + PRISON_WING + WARDER_IN;
  const left = (plot.left + inset) * TILE;
  const right = (plot.right - inset) * TILE;
  const top = (plot.top + inset) * TILE;
  const down = (plot.bottom - inset) * TILE;
  const middle = { x: (left + right) / 2, y: (top + down) / 2 };
  // **And none of them inside the workshop.** The hut stands a square in from
  // the ranges in one corner of the yard, which is exactly where the man under
  // that tower would otherwise be put - and a warder inside a building is the
  // thing this whole arrangement exists to avoid. Whoever lands on it is moved
  // clear of it, along the top of the yard, which is still under his tower.
  const hut = prisonHut(plot);
  const shed = {
    left: hut.x * TILE,
    top: hut.y * TILE,
    right: (hut.x + PRISON_SHED) * TILE,
    bottom: (hut.y + PRISON_SHED) * TILE,
  };
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: left, y: down },
    { x: right, y: down },
    { x: middle.x - WARDER_APART * TILE, y: middle.y },
    { x: middle.x + WARDER_APART * TILE, y: middle.y },
  ].map((spot) =>
    spot.x >= shed.left &&
    spot.x < shed.right &&
    spot.y >= shed.top &&
    spot.y < shed.bottom
      ? { x: spot.x + PRISON_SHED * TILE, y: spot.y }
      : spot,
  );
}

/**
 * How far inside the ranges a warder stands, in squares.
 *
 * @remarks
 * A whole one, so that he is on the grass with room round him rather than
 * pressed against his own wall - and **not** in the tower above him, which was
 * the first idea and is impossible. A bullet stops at anything solid and a
 * watchtower stands on a square of building, so every round fired at a man up
 * there died in the wall below him: measured, twelve seconds of machine-gun
 * fire from ten yards away took nothing off him at all. A guard one cannot hit
 * is the thing this whole arrangement exists to get rid of.
 */
const WARDER_IN = 1;

/** And how far either side of the middle the two in the yard stand. */
const WARDER_APART = 2;

/**
 * Every prison the plan drew.
 *
 * @returns the anchor block of each, worked out once
 * @remarks
 * There is one, and the code says "every" anyway: whoever has to staff them
 * should not have to know how many the plan happened to leave standing after
 * the motorways had taken their share.
 */
export function prisonAnchors(): readonly Vec[] {
  if (GAOLS !== null) {
    return GAOLS;
  }
  const blocks = CITY_TILES / BLOCK_TILES;
  const found: Vec[] = [];
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      if (isPrisonBlock(blockX, blockY)) {
        found.push({ x: blockX, y: blockY });
      }
    }
  }
  GAOLS = found;
  return found;
}

/** The answer to {@link prisonAnchors}, worked out once. */
let GAOLS: readonly Vec[] | null = null;

/**
 * The prison, opened.
 *
 * @param cells - the city floor
 * @param anchor - the block the prison is anchored on
 * @returns the floor with a way through the gate
 * @remarks
 * Two squares: the doorway through the range and the square of wire in front
 * of it, both on the line {@link prisonGate} puts the gate on. That is the
 * whole of it - a corridor one square wide from the street into the yard,
 * which is what a prison gate is when it is open.
 *
 * The floor and the picture change in the same breath, the way the garage door
 * does: what one can see and what one can walk through must never disagree.
 */
export function openGaol(cells: readonly Cell[], anchor: Vec): readonly Cell[] {
  const plot = prisonPlot(anchor.x, anchor.y);
  const gate = prisonGate(plot);
  let floor = cells;
  for (let row = gate.y; row > gate.y - PRISON_FENCE - PRISON_WING; row -= 1) {
    floor = cellSet(
      floor,
      { x: gate.x * TILE + TILE / 2, y: row * TILE + TILE / 2 },
      "park",
    );
  }
  return floor;
}

/**
 * The prison, shut again.
 *
 * @param cells - the city floor
 * @param anchor - the block the prison is anchored on
 * @returns the floor with the gate closed
 * @remarks
 * The other half of {@link openGaol}, and it does not remember what it
 * replaced: it asks the **plan** what belongs on those two squares and puts
 * that back. A door that restored whatever happened to be underneath it would
 * be a door that has to be told what it was covering, which is one more thing
 * to get wrong.
 */
export function closeGaol(
  cells: readonly Cell[],
  anchor: Vec,
): readonly Cell[] {
  const plot = prisonPlot(anchor.x, anchor.y);
  const gate = prisonGate(plot);
  let floor = cells;
  for (let row = gate.y; row > gate.y - PRISON_FENCE - PRISON_WING; row -= 1) {
    floor = cellSet(
      floor,
      { x: gate.x * TILE + TILE / 2, y: row * TILE + TILE / 2 },
      cellAt(gate.x, row),
    );
  }
  return floor;
}

/** How many squares across the workshop in the yard is. */
export const PRISON_SHED = 2;

/** And how far it stands clear of the ranges, in squares. */
const SHED_IN = 1;

/**
 * Which squares of one block line are not street.
 *
 * @param block - the block, along one axis
 * @returns the first and the last square of it that a prison may stand on
 * @remarks
 * **The whole block bar the tarmac**, which is a square more on each side than
 * {@link builtSpan} leaves an ordinary house: a prison is built over its own
 * pavement, and the wall goes to the kerb.
 *
 * Measured rather than assumed, because a motorway takes a lane out of the
 * blocks either side of it - so beside one the span is a square narrower, and
 * the prison there is simply a little smaller. A fixed span would have run the
 * wall through the outside lane of the motorway; picking another block for the
 * prison instead would have been worse still, since there are only a handful
 * in the city and three quarters of the blocks are within a lane of a
 * motorway one way or the other.
 */
function openSpan(
  block: number,
  across: boolean,
): { from: number; to: number } {
  let from = BLOCK_TILES;
  let to = -1;
  for (let into = 0; into < BLOCK_TILES; into += 1) {
    if (!isRoad(block * BLOCK_TILES + into, across)) {
      from = Math.min(from, into);
      to = Math.max(to, into);
    }
  }
  return { from, to };
}

/**
 * Whether this line of the grid is a street.
 *
 * @remarks
 * Every sixth line, as before - and every fourth of **those** is a motorway,
 * which is the same street with a lane either side of it. That is all a
 * motorway is here: three squares of tarmac instead of one, so it reads as a
 * fast road from two blocks away and a chase down one has room to overtake.
 */
function isRoad(at: number, across: boolean): boolean {
  const into = ((at % BLOCK_TILES) + BLOCK_TILES) % BLOCK_TILES;
  const block = Math.floor(at / BLOCK_TILES);
  let road: boolean;
  if (into <= ROAD_HALF) {
    road =
      street(block, across) && !(into === ROAD_HALF && handsBack(block, 1));
  } else if (into >= BLOCK_TILES - ROAD_HALF) {
    road =
      street(block + 1, across) &&
      !(into === BLOCK_TILES - ROAD_HALF && handsBack(block, 0));
  } else {
    road = false;
  }
  return road || motorwayNear(at);
}

/**
 * Whether the street at one end of a block hands its outer square back.
 *
 * @param block - the block, in blocks
 * @param side - 0 for the street at its far end, 1 for the one at its near end
 * @returns true where this block is squeezed by a motorway at the other end
 * @remarks
 * **Every block is three squares, always.** A street is three squares wide and
 * takes two of them out of the block on one side and one out of the block on
 * the other, which leaves eight less two less one less two of pavement: three
 * to build on. A motorway is five, so it takes one more square than a street
 * does out of each of its neighbours - and those two blocks came out at two
 * squares instead of three. Against a motorway that is bad luck; with a
 * pavement now standing between the wall and the outside lane it was a shop
 * two squares wide with its name written across the whole front.
 *
 * So the square is taken off the **other** end, where an ordinary street can
 * spare it: the street on the far side of a squeezed block gives up its outer
 * square and is two squares wide instead of three along that block. Which
 * streets those are follows from the plan rather than from the block - a
 * motorway every {@link MOTORWAY_EVERY} lines means the street either side of
 * one, all the way along it - so the carriageway never jogs: it is narrow for
 * its whole length or wide for its whole length.
 */
function handsBack(block: number, side: number): boolean {
  return isMotorway((block + side) * BLOCK_TILES);
}

/**
 * Whether the plan actually puts a street on this line between two blocks.
 *
 * @param line - which boundary, counted in blocks
 * @param across - true for a street running up and down, false for one along
 * @returns true where there is tarmac, false where the two blocks run together
 * @remarks
 * **A city is not graph paper.** Every eighth line was a street in both
 * directions, without exception, which gives a grid of identical squares with
 * an identical gap round every one of them - and the thing one never sees in a
 * real town, which is two buildings standing side by side. Every house in Los
 * Santos was an island.
 *
 * So a quarter of the boundaries are simply not built: where one is left out,
 * the two blocks either side of it run together into one long plot, and the
 * houses on it end up against each other. Asked **per axis**, so a stretch can
 * have its up-and-down streets and none of its across ones - which is the
 * shape of half the streets anybody has ever lived on.
 *
 * Two rules keep it a city rather than a field:
 *
 * - **A motorway is never left out.** It is the one road one drives the length
 *   of, and a gap in it is a gap in the map.
 * - **Two blocks may run together; three may not.** A boundary that wants to
 *   go checks whether the one before it went, and stays if it did. Without
 *   that, a run of unlucky rolls gives a block a quarter of a mile long with
 *   nothing to turn off into.
 */
function street(line: number, across: boolean): boolean {
  let built: boolean;
  if (isMotorway(line * BLOCK_TILES)) {
    built = true;
  } else if (hash(line, across ? STREET_ACROSS : STREET_DOWN) >= STREET_SKIP) {
    built = true;
  } else {
    built = hash(line - 1, across ? STREET_ACROSS : STREET_DOWN) < STREET_SKIP;
  }
  return built;
}

/**
 * How many of the boundaries between blocks carry no street.
 *
 * @remarks
 * A quarter. Enough that one meets a pair of joined blocks every street or
 * two - which is what makes a walk through the city read as a place somebody
 * laid out rather than as a sheet of graph paper - and few enough that one is
 * never far from a turning.
 */
const STREET_SKIP = 0.25;

/** What the dice are asked with for the streets that run up and down. */
const STREET_ACROSS = 613;

/** And for the ones that run along. */
const STREET_DOWN = 947;

/**
 * How many squares of tarmac lie either side of an ordinary street line.
 *
 * @remarks
 * One, so a street is three squares - a lane and a half each way. At one
 * square the whole carriageway was two car widths and nothing could pass
 * anything. A motorway is still wider: see {@link MOTORWAY_HALF}.
 */
const ROAD_HALF = 1;

/** Whether a line is one of the wide ones. */
function isMotorway(at: number): boolean {
  return at % (BLOCK_TILES * MOTORWAY_EVERY) === 0;
}

/**
 * Which motorway lines of the grid fall between two squares.
 *
 * @param from - the first square, across or down
 * @param to - the last one
 * @returns the lines themselves, in squares
 * @remarks
 * For the picture: a motorway is painted with lanes, and the painter has to
 * know where the motorways are without knowing how the grid is put together.
 * The middle of the band is the middle of the square on the line - see
 * {@link MOTORWAY_HALF} for how far it reaches either side.
 */
export function motorwaysBetween(from: number, to: number): readonly number[] {
  const step = BLOCK_TILES * MOTORWAY_EVERY;
  const lines: number[] = [];
  for (let at = Math.ceil(from / step) * step; at <= to; at += step) {
    lines.push(at);
  }
  return lines;
}

/** Whether this square is one of the extra lanes of a motorway. */
function motorwayNear(at: number): boolean {
  const step = BLOCK_TILES * MOTORWAY_EVERY;
  const into = ((at % step) + step) % step;
  return into <= MOTORWAY_HALF || into >= step - MOTORWAY_HALF;
}

/**
 * Whether this line is the pavement beside a street.
 *
 * @param at - the line, in squares
 * @param across - true for one running up and down, false for one along
 * @returns true where somebody on foot belongs
 * @remarks
 * **A motorway has a kerb too.** The ring was measured from the middle of an
 * ordinary street - one square of tarmac each way, then the pavement - and a
 * motorway is three each way, so its outer lanes ran straight over the squares
 * the pavement would have been on. The building then started where the fast
 * lane stopped: one stepped out of a shop door into the outside lane, and
 * every block along a motorway had its front wall in the traffic.
 *
 * So the ring is asked of the tarmac rather than of the line: whatever is one
 * square outside the road, however wide the road is, is pavement. See
 * {@link besideMotorway}.
 */
function nextToRoad(at: number, across: boolean): boolean {
  let near = false;
  for (let step = 1; step <= WALK_RING && !near; step += 1) {
    near = isRoad(at - step, across) || isRoad(at + step, across);
  }
  return near && !isRoad(at, across);
}

/** Whether this square is the one just outside a motorway's outside lane. */
function besideMotorway(at: number): boolean {
  const step = BLOCK_TILES * MOTORWAY_EVERY;
  const into = ((at % step) + step) % step;
  return into === MOTORWAY_HALF + 1 || into === step - MOTORWAY_HALF - 1;
}

/**
 * Whether a square is in the strait.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true in the water that cuts the map in two
 * @remarks
 * A box that opens out as it runs east - see {@link CHANNEL_NORTH}. The south
 * bank is a straight line because Los Santos starts on the row under it; the
 * north bank is the one that gives way, and it gives way over
 * {@link CHANNEL_FLARE} squares so that the coast reads as a funnel rather
 * than as a step.
 */
function inChannel(col: number, row: number): boolean {
  if (col < CHANNEL.left || col > CHANNEL.right || row > CHANNEL.bottom) {
    return false;
  }
  const along = Math.min(1, (col - CHANNEL.left) / CHANNEL_FLARE);
  return row >= CHANNEL.top - Math.round(along * CHANNEL_NORTH);
}

/** Whether a square is inside a rectangle of the map. */
function inBox(box: Island, col: number, row: number): boolean {
  return (
    col >= box.left && col <= box.right && row >= box.top && row <= box.bottom
  );
}

/**
 * Whether a square is dry land.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true anywhere in the landmass, false out at sea
 * @remarks
 * The rectangles of {@link LAND} with a wandering edge on top of them: each
 * side of each one is pushed in or out by a couple of squares, by where one is
 * looking rather than at random, so a coast has bays and headlands and is
 * still the same coast every time. Only the wild stretches wander - a city
 * with a chewed edge would put somebody's front room in the sea.
 */
function onLand(col: number, row: number): boolean {
  const span = CITY_TILES + LAND_PAD * 2;
  const spare =
    col >= -LAND_PAD &&
    row >= -LAND_PAD &&
    col < CITY_TILES + LAND_PAD &&
    row < CITY_TILES + LAND_PAD;
  const at = (row + LAND_PAD) * span + (col + LAND_PAD);
  const known = spare ? (LAND_MEMO[at] ?? UNKNOWN) : UNKNOWN;
  let dry: boolean;
  if (known === UNKNOWN) {
    dry = dryAt(col, row);
    if (spare) {
      LAND_MEMO[at] = dry ? 1 : 0;
    }
  } else {
    dry = known === 1;
  }
  return dry;
}

/** The same question, actually asked. */
function dryAt(col: number, row: number): boolean {
  // **The strait is cut first.** It is dug rather than eroded - see
  // {@link CHANNEL} - so it wins over whichever rectangles of land it crosses,
  // and the beach rule that follows gives it sandy banks for nothing.
  if (inChannel(col, row)) {
    return false;
  }
  const built = ISLANDS.some((city) => inBox(city, col, row));
  return LAND.some((box, at) => {
    const give = built ? 0 : SHORE_WANDER;
    return (
      col >= box.left - shoreShift(at, row, WEST) * give &&
      col <= box.right + shoreShift(at, row, EAST) * give &&
      row >= box.top - shoreShift(at, col, NORTH) * give &&
      row <= box.bottom + shoreShift(at, col, SOUTH) * give
    );
  });
}

/**
 * How far one side of one rectangle has wandered here.
 *
 * @param box - which rectangle
 * @param along - the square along that side
 * @param side - which of the four sides
 * @returns a share of {@link SHORE_WANDER}, from nothing to all of it
 */
function shoreShift(box: number, along: number, side: number): number {
  return hash(box * SIDES + side, Math.floor(along / SHORE_STEP));
}

/** Whether a square is beach: land, with the sea a step or two away. */
function onShore(col: number, row: number): boolean {
  let sand = false;
  if (onLand(col, row)) {
    for (let down = -SAND_RING; down <= SAND_RING && !sand; down += 1) {
      for (let across = -SAND_RING; across <= SAND_RING && !sand; across += 1) {
        sand = !onLand(col + across, row + down);
      }
    }
  }
  return sand;
}

/**
 * Whether a square is part of the fence round the military base.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true on the wire, false in the gateway and everywhere else
 */
function onFence(col: number, row: number): boolean {
  const edge =
    col === BASE.left ||
    col === BASE.right ||
    row === BASE.top ||
    row === BASE.bottom;
  const gate =
    row === BASE.bottom && col >= BASE_GATE.left && col <= BASE_GATE.right;
  return inBox(BASE, col, row) && edge && !gate;
}

/**
 * Whether a square is part of the fence round the airport.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true on the wire, false in the gateway and everywhere else
 * @remarks
 * The same shape as {@link onFence} round the military base, with the one
 * gateway on the **west** edge: the field runs from the prison out to the
 * sea, so the town end is the only end anybody arrives at.
 */
function onAirportFence(col: number, row: number): boolean {
  const edge =
    col === AIRPORT.left ||
    col === AIRPORT.right ||
    row === AIRPORT.top ||
    row === AIRPORT.bottom;
  const gate =
    col === AIRPORT.left &&
    row >= AIRPORT_GATE.top &&
    row <= AIRPORT_GATE.bottom;
  return edge && !gate;
}

/**
 * Whether a square is on the mountain in the south-west.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true anywhere on the stone
 * @remarks
 * A circle with a wandering edge, by the same hash the coast uses: a mountain
 * with a compass-drawn foot would look like a roundabout.
 */
function onMountain(col: number, row: number): boolean {
  const out = Math.hypot(col - MOUNTAIN.x, row - MOUNTAIN.y);
  const ragged =
    hash(Math.round(col / MOUNTAIN_PATCH), Math.round(row / MOUNTAIN_PATCH)) *
    MOUNTAIN_EDGE;
  return out < MOUNTAIN.radius - ragged;
}

/** How far the foot of the mountain wanders in and out, in squares. */
const MOUNTAIN_EDGE = 3;

/** And over how many squares it wanders by the same amount. */
const MOUNTAIN_PATCH = 3;

/**
 * A number between 0 and 1 that is always the same for the same block.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns that block's own private dice roll
 */
export function scatter(blockX: number, blockY: number): number {
  const spun = Math.sin(blockX * SCATTER_A + blockY * SCATTER_B) * SCATTER_C;
  return spun - Math.floor(spun);
}

/** The three numbers that turn a pair of block coordinates into a dice roll. */
const SCATTER_A = 12.9898;

/** The second of them. */
const SCATTER_B = 78.233;

/** And the third, which is what makes the result spread evenly. */
const SCATTER_C = 43758.5453;

/**
 * How tall the houses of a block are, in pixels.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @param look - that block's dice roll
 * @returns the height
 * @remarks
 * Tall in the middle of town, low towards the edges and the sea - that is what
 * makes a skyline read as a city rather than as a warehouse estate. The dice
 * roll only decides how far towards the local maximum a block goes.
 */
export function houseHeight(
  blockX: number,
  blockY: number,
  look: number,
): number {
  const blocks = CITY_TILES / BLOCK_TILES;
  const away = Math.hypot(
    blockX + HALF - blocks / 2,
    blockY + HALF - blocks / 2,
  );
  const downtown = Math.max(0, 1 - away / (blocks / 2));
  const block = villaBlock();
  // **The villa stands taller than its street.** Two proper storeys with a
  // tiled roof over them, against the bungalow the dice would otherwise have
  // rolled for this corner. Done here rather than in the picture so that the
  // roof one lands a jetpack on is the roof one can see - `roofAt` reads the
  // same number.
  const mine =
    block !== null && block.x === blockX && block.y === blockY ? VILLA_RISE : 1;
  return (
    mine *
    (HOUSE_LOW +
      (HOUSE_HIGH - HOUSE_LOW) * downtown * (TOWN_FLOOR + TOWN_SPREAD * look))
  );
}

/** How much taller the villa is than the block it stands on would be. */
const VILLA_RISE = 1.6;

/** How much of its local maximum the shortest block on a street reaches. */
const TOWN_FLOOR = 0.35;

/** And how much of it the dice roll decides. */
const TOWN_SPREAD = 0.65;

/**
 * How high the roof is over a point, in pixels.
 *
 * @param cells - the city floor
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns the height of whatever stands there, or nought in the open
 * @remarks
 * **What one lands on.** The picture has always known how tall each block is;
 * it had to, to draw it. Nothing else did - so a man on a jetpack who let go
 * of the button over the middle of a block sank straight through the roof, the
 * flat and the shop below it and stood in the street. Now the floor under him
 * is whatever is under him, and coming down on a roof is landing on it.
 *
 * The three sorts of building are asked in the order they are built in
 * {@link createCity}: a barn, a shed on the base, and otherwise a block of the
 * city, whose height is its own formula times whatever the table says that
 * kind of building rises to.
 */
export function roofAt(cells: readonly Cell[], x: number, y: number): number {
  if (cellUnder(cells, x, y) !== "building") {
    return 0;
  }
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  let high: number;
  if (FARMS.some((farm) => inBox(farm, col, row))) {
    high = BARN_HIGH;
  } else if (BASE_HUTS.some((hut) => inBox(hut, col, row))) {
    high = HUT_HIGH;
  } else {
    // **A prison is one building over four blocks**, so its roof is one
    // height: the anchor block's. Asked per block, the four quarters of the
    // ring would each answer with their own, and a man who landed on the far
    // side of the roof would stand a few pixels inside it or a few above it.
    const gaol = prisonUnder(col, row);
    const blockX = gaol?.x ?? Math.floor(col / BLOCK_TILES);
    const blockY = gaol?.y ?? Math.floor(row / BLOCK_TILES);
    high = wallHeight(
      buildingAt(blockX, blockY),
      houseHeight(blockX, blockY, scatter(blockX, blockY)),
    );
  }
  return high;
}

/** Whether a square is one of the piers out into the water. */
function onPier(col: number, row: number): boolean {
  return PIERS.some((pier) => inBox(pier, col, row));
}

/** Whether woodland rather than meadow stands here. */
function wooded(col: number, row: number): boolean {
  return (
    hash(Math.floor(col / WOOD_PATCH), Math.floor(row / WOOD_PATCH)) >
    WOOD_SHARE
  );
}

/**
 * A number between nothing and one, the same for the same two numbers.
 *
 * @param across - anything
 * @param down - anything else
 * @returns their hash, spread evenly over nought to one
 * @remarks
 * The landscape has to be irregular, and it has to be the same irregular every
 * time the game is opened - which is exactly what a hash of the coordinates
 * is. There is no seed here: the map is not generated, it is a formula.
 */
function hash(across: number, down: number): number {
  const mixed = Math.sin(across * HASH_A + down * HASH_B) * HASH_C;
  return mixed - Math.floor(mixed);
}

/** Whether a square is part of a country road. */
function onRoute(col: number, row: number): boolean {
  return ROADS.some((road) =>
    road.points.some((point, at) => {
      const next = road.points[at + 1];
      return (
        next !== undefined &&
        awayFromLeg(col + HALF, row + HALF, point, next) <= road.wide / 2
      );
    }),
  );
}

/**
 * How far a point is from one leg of a road.
 *
 * @param x - the point, in squares
 * @param y - the point, in squares
 * @param from - one end of the leg
 * @param to - the other
 * @returns the distance, in squares
 */
function awayFromLeg(x: number, y: number, from: Vec, to: Vec): number {
  const runX = to.x - from.x;
  const runY = to.y - from.y;
  const length = runX * runX + runY * runY;
  const raw =
    length === 0 ? 0 : ((x - from.x) * runX + (y - from.y) * runY) / length;
  const along = Math.max(0, Math.min(1, raw));
  return Math.hypot(x - (from.x + runX * along), y - (from.y + runY * along));
}

/**
 * Which way the country road runs at a point, if one runs there at all.
 *
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns the heading of the nearest stretch of road, or null off the roads
 * @remarks
 * Out of town the roads sweep, and a driver who only knows north, south, east
 * and west drives a curve as a zigzag - two seconds one way, two seconds the
 * other, all the way along it. The road itself knows which way it goes at
 * every point: it is the same polyline the tarmac was laid from, and the
 * nearest leg of it is the answer.
 */
export function routeHeading(x: number, y: number): number | null {
  const col = x / TILE;
  const row = y / TILE;
  let best: number | null = null;
  let bestAway = Number.POSITIVE_INFINITY;
  for (const road of ROADS) {
    road.points.forEach((point, at) => {
      const next = road.points[at + 1];
      if (next !== undefined) {
        const away = awayFromLeg(col, row, point, next);
        if (away < bestAway && away <= road.wide / 2) {
          best = Math.atan2(next.y - point.y, next.x - point.x);
          bestAway = away;
        }
      }
    });
  }
  return best;
}

/**
 * A line through a handful of points, bent into a curve.
 *
 * @param points - the corners the road is meant to pass
 * @returns many more points, on a smooth line through all of them
 * @remarks
 * Catmull-Rom: every leg is drawn with an eye on the point before it and the
 * point after it, which is what turns five corners into a road that sweeps.
 * Outside the cities nothing is straight, and this is why.
 */
function bend(points: readonly Vec[]): readonly Vec[] {
  const many: Vec[] = [];
  for (let at = 0; at < points.length - 1; at += 1) {
    const before = points[Math.max(0, at - 1)];
    const from = points[at];
    const to = points[at + 1];
    const after = points[Math.min(points.length - 1, at + 2)];
    const whole =
      before !== undefined &&
      from !== undefined &&
      to !== undefined &&
      after !== undefined;
    for (let part = 0; whole && part < BEND_PARTS; part += 1) {
      many.push(spline(before, from, to, after, part / BEND_PARTS));
    }
  }
  const last = points[points.length - 1];
  return last === undefined ? many : [...many, last];
}

/** One point of that curve. */
function spline(before: Vec, from: Vec, to: Vec, after: Vec, at: number): Vec {
  const square = at * at;
  const cube = square * at;
  /* eslint-disable @typescript-eslint/no-magic-numbers -- the weights of a
     Catmull-Rom spline. They are the formula; naming them would name nothing. */
  const pull = (a: number, b: number, c: number, d: number) =>
    HALF *
    (2 * b +
      (c - a) * at +
      (2 * a - 5 * b + 4 * c - d) * square +
      (3 * b - a - 3 * c + d) * cube);
  /* eslint-enable @typescript-eslint/no-magic-numbers */
  return {
    x: pull(before.x, from.x, to.x, after.x),
    y: pull(before.y, from.y, to.y, after.y),
  };
}

/** Whether a square is part of the railway. */
export function onRail(col: number, row: number): boolean {
  return railCells().has(cellKey(col, row));
}

/** How many squares of sand lie inside each shore. */
const SAND_RING = 2;

/** How far beyond the map the coast is remembered, in squares. */
const LAND_PAD = 4;

/** What stands in the memory for a square nobody has asked about. */
const UNKNOWN = -1;
/**
 * What is known about each square: sea, land, or not asked yet.
 *
 * @remarks
 * The beach looks two squares in every direction for water, so without this
 * every square of San Andreas would have its coastline worked out
 * twenty-five times over - and the coastline is the most expensive question on
 * the map. The answer never changes, so it is kept.
 */
const LAND_MEMO = new Int8Array((CITY_TILES + LAND_PAD * 2) ** 2).fill(UNKNOWN);

/** How far a wild coast may wander in or out, in squares. */
const SHORE_WANDER = 3;

/** And how long a stretch of it wanders by the same amount. */
const SHORE_STEP = 5;

/** A rectangle has four of them. */
const SIDES = 4;

/** The left one. */
const WEST = 0;

/** The right one. */
const EAST = 1;

/** The top one. */
const NORTH = 2;

/** And the bottom one. */
const SOUTH = 3;

/** How big a patch of one sort of green is, in squares. */
const WOOD_PATCH = 7;

/** How much of the countryside is wood rather than meadow. */
const WOOD_SHARE = 0.45;

/** The first of the three numbers the hash is stirred with. */
const HASH_A = 12.9898;

/** The second of them. */
const HASH_B = 78.233;

/** And the third, which is only large. */
const HASH_C = 43758.5453;

/** The middle of a square. */
const HALF = 0.5;

/** How many pieces each leg of a country road is bent into. */
const BEND_PARTS = 6;

/** Every fourth street is a motorway. */
const MOTORWAY_EVERY = 4;

/**
 * How many lanes a motorway has either side of its middle.
 *
 * @remarks
 * Two, so a motorway is five squares of tarmac across - wide enough that two
 * cars side by side still leave room for a third to come past, and wide enough
 * to read as a motorway from the far side of a block.
 */
export const MOTORWAY_HALF = 2;

/** One country road: the corners it passes and how wide it is, in squares. */
type Route = {
  readonly wide: number;
  readonly points: readonly Vec[];
};

/** Whether a square is on the track up the mountain. */
function onTrack(col: number, row: number): boolean {
  return TRACKS.some((track) =>
    track.points.some((point, at) => {
      const next = track.points[at + 1];
      return (
        next !== undefined &&
        awayFromLeg(col + HALF, row + HALF, point, next) <= track.wide / 2
      );
    }),
  );
}

/**
 * The tracks: dirt rather than tarmac.
 *
 * @remarks
 * One of them, and it is the only way up the mountain - it starts on the road
 * along the south coast and winds anticlockwise to the top, which is what a
 * road up a hill does when it cannot go straight up.
 */
const TRACK_LINES: readonly Route[] = [
  {
    wide: 3,
    points: [
      { x: 22, y: 152 },
      { x: 12, y: 146 },
      { x: 9, y: 136 },
      { x: 14, y: 126 },
      { x: 26, y: 122 },
      { x: 36, y: 128 },
      { x: 36, y: 138 },
      { x: 28, y: 144 },
      { x: 20, y: 140 },
      { x: 19, y: 132 },
      { x: 24, y: 134 },
    ],
  },
];

/** The same, bent into curves once. */
const TRACKS: readonly Route[] = TRACK_LINES.map((track) => ({
  wide: track.wide,
  points: bend(track.points),
}));

/**
 * The roads between the cities.
 *
 * @remarks
 * Nothing here is straight and nothing here is on the grid: these are the lines
 * on the map that sweep round a hill, cut the desert on the diagonal and cross
 * the bay on a bridge. The grid belongs to the cities and stops at the last
 * street sign.
 *
 * Where one of them leaves the land it does not stop - a road over water is a
 * bridge, and that is how every crossing in San Andreas is made.
 */
const ROUTES: readonly Route[] = [
  // Die Kuestenstrasse im Nordwesten: von San Fierro hinauf in den Wald.
  {
    wide: 5,
    points: [
      { x: 20, y: 39 },
      { x: 12, y: 32 },
      { x: 18, y: 16 },
      { x: 38, y: 10 },
      { x: 58, y: 14 },
    ],
  },
  // Quer durch die Wueste nach Las Venturas.
  {
    wide: 5,
    points: [
      { x: 58, y: 14 },
      { x: 76, y: 18 },
      { x: 92, y: 28 },
      { x: 100, y: 30 },
      { x: 105, y: 30 },
    ],
  },
  // Von San Fierro schraeg durch die Wueste nach Las Venturas.
  {
    wide: 5,
    points: [
      { x: 50, y: 60 },
      { x: 62, y: 56 },
      { x: 78, y: 48 },
      { x: 94, y: 44 },
      { x: 105, y: 42 },
    ],
  },
  // **Die Landstrasse am Hafen gibt es nicht mehr.** Sie lief fuenf Felder
  // breit am Ostufer der Bucht entlang, zwischen den Stegen und dem offenen
  // Wasser - und damit lag um die Boote herum eine Mauer aus Asphalt. Der
  // Hafen haengt trotzdem am Netz: Die Kaimauer stoesst im Westen an die
  // Stadt, und ueber den Beton faehrt man wie ueber jede andere Flaeche.
  // **Von Las Venturas herunter, und oben im Wald ist Schluss.**
  // Hier lief bis vor Kurzem die dritte Bruecke ueber die Meerenge, und drei
  // Bruecken ueber dasselbe Wasser sind zwei zu viel - die Stelle ist die
  // breiteste des ganzen Kanals. Eine Faehrflaeche mit Stegen stand danach
  // auch kurz hier; die war zwei Streifen Asphalt im Nirgendwo. Jetzt hoert
  // die Strasse im Wald auf, und wer hinueber will, nimmt eines der Boote,
  // die unten am Ufer liegen - siehe {@link MOORINGS}.
  {
    wide: 5,
    points: [
      { x: 138, y: 69 },
      { x: 142, y: 74 },
    ],
  },
  // **Die Bruecke von San Fierro nach Sueden - und zwar senkrecht.**
  // Sie lief mit drei Punkten schraeg ueber das Wasser und verzog sich dabei
  // um eine Spalte; ein Deck, das wandert, laesst sich nicht mit geraden
  // Traegern einfassen. Jetzt liegt der ganze Weg ueber dem Wasser auf
  // Spalte 21,5 - also der *Mitte* einer Spalte, damit eine fuenf Felder
  // breite Strasse fuenf Spalten ganz deckt (19 bis 23) statt sechs zur
  // Haelfte. Die Bahn faehrt gleich daneben auf Spalte 24 ueber dasselbe
  // Wasser, und beide zusammen tragen ein Bauwerk - siehe das Tragwerk im
  // Bild.
  {
    wide: 5,
    points: [
      { x: 21.5, y: 96.5 },
      { x: 21.5, y: 101 },
      { x: 21.5, y: 107 },
      { x: 21.5, y: 113 },
    ],
  },
  // Die Runde um den Berg im Suedwesten - und zwar wirklich um ihn herum.
  // Sie fuehrte quer ueber den Fels; eine Landstrasse klettert aber nicht auf
  // einen Berg, dafuer ist die Piste da.
  {
    wide: 3,
    points: [
      { x: 21.5, y: 113 },
      { x: 9, y: 122 },
      { x: 9, y: 146 },
      { x: 28, y: 157 },
      { x: 52, y: 153 },
      { x: 68, y: 142 },
      { x: 80, y: 134 },
      { x: 87, y: 129 },
    ],
  },
  // Und die Strasse durch die Wueste nach Sueden - ueber die Meerenge und
  // weiter bis an die erste Querstrasse von Los Santos. Sie endete frueher
  // auf Reihe 105, und das war, bevor dort Wasser war: Seit der Kanal liegt,
  // hoerte sie mitten auf der Bruecke auf. Eine Bruecke, der das letzte Stueck
  // fehlt, ist keine.
  {
    wide: 5,
    points: [
      { x: 80, y: 30 },
      { x: 86, y: 52 },
      { x: 90, y: 62 },
      // **Und ab hier schnurgerade nach Sueden.** Vier Punkte auf derselben
      // Spalte, weil die Kurve, die `bend` aus drei Punkten macht, sonst noch
      // in die Bruecke hineinlaeuft: Ein Deck, das sich um ein Feld
      // verschiebt, laesst sich nicht mit geraden Traegern einfassen, und
      // genau die machen die Haengebruecke aus. Der Bogen liegt jetzt
      // vollstaendig noerdlich des Wassers.
      { x: 95.5, y: 72 },
      { x: 95.5, y: 84 },
      { x: 95.5, y: 96 },
      { x: 95.5, y: 108 },
      { x: 95.5, y: 118 },
    ],
  },
];

/** The same roads, bent into curves once and for all. */
const ROADS: readonly Route[] = ROUTES.map((route) => ({
  wide: route.wide,
  points: bend(route.points),
}));

/**
 * The squares of a block that are actually built on.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns its built rectangle in squares, the far edges exclusive
 * @remarks
 * Used to be three squares in the middle of every six, and that was true for
 * as long as every street was one square wide. A motorway is five, and it
 * takes its extra lanes out of the blocks either side of it - so a house drawn
 * to the old rule stood in the outside lane.
 *
 * Now the picture asks the same two questions the floor asks - is this line a
 * street, is it a pavement - and builds on what is left. A block beside a
 * motorway simply gets a narrower house, which is what happens when a motorway
 * is put through a neighbourhood - and it keeps its **depth**, because the
 * pavement the motorway forces in front of it is taken off the back instead.
 * See {@link builtSpan}.
 */
export function builtPlot(
  blockX: number,
  blockY: number,
): { left: number; top: number; right: number; bottom: number } {
  const across = builtSpan(blockX, true);
  const down = builtSpan(blockY, false);
  const plot = {
    left: blockX * BLOCK_TILES + across.from,
    top: blockY * BLOCK_TILES + down.from,
    right: blockX * BLOCK_TILES + across.to + 1,
    bottom: blockY * BLOCK_TILES + down.to + 1,
  };
  // **Except the town hall, which has moved and grown.** See HALL_BLOCK: the
  // answer comes from here rather than from a second rule beside it, so that
  // everything which asks where that building stands - the floor, the picture,
  // the door, the parking - is told the same rectangle.
  return theHall(blockX, blockY)
    ? {
        left: HALL_WEST,
        top: plot.top - HALL_UP,
        right: HALL_EAST,
        bottom: plot.bottom - HALL_UP,
      }
    : plot;
}

/**
 * Whether this block is the town hall that was moved.
 *
 * @param blockX - the block, across
 * @param blockY - the same, down
 * @returns true for that one block, and only while it still holds a hall
 * @remarks
 * Reads the **plan** (`rawKindAt`) rather than {@link buildingAt}: this is
 * asked from inside {@link builtPlot}, and `buildingAt` is one of the things
 * that asks `builtPlot`. A ring between the two runs the stack out, which in
 * this file has happened three times.
 */
function theHall(blockX: number, blockY: number): boolean {
  return (
    blockX === HALL_BLOCK.x &&
    blockY === HALL_BLOCK.y &&
    rawKindAt(blockX, blockY) === "hall"
  );
}

/**
 * The town hall of East Beach, which stands where the meadow was.
 *
 * @remarks
 * **Asked for, and worth the exception.** It stood in the last row of blocks
 * before the beach with a meadow behind it and a street beside it that went
 * nowhere: in from the main road, down the outside of the airport fence, and
 * over at the sand. A street that serves one building and then stops is not a
 * street, it is a drive.
 *
 * So the hall moved back into the meadow, the meadow came forward to where the
 * hall was - the two swapped, which costs the quarter nothing - and the drive
 * was given to the building, which is why it is now five squares across
 * instead of three. {@link HALL_EAST} is where it stops: the square beside the
 * airport fence stays pavement, because a fence with no footway along it is a
 * fence one cannot walk past.
 */
const HALL_BLOCK = { x: 12, y: 19 };

/** How far back the hall moved, in squares: the depth of its own footprint. */
const HALL_UP = 5;

/**
 * Where it stands across, in squares, the far edge exclusive.
 *
 * @remarks
 * **The hall and the street changed places as well.** It stood between the
 * motorway and the airport fence; now it stands *on* the last stretch of that
 * motorway - which ran south past it and stopped dead at the sand - and the
 * road runs where the hall was, from the junction down to the beach. The same
 * two strips, the other way round, and the motorway simply ends a junction
 * earlier than it did.
 *
 * Nothing about the road **grid** changes for this. The traffic reads the
 * floor and not the formula (`isRoadAt`), and a driver who finds no road ahead
 * turns into whatever is open - which is what every car already did where this
 * stretch used to stop at the shore.
 */
const HALL_WEST = 94;

/** And where it ends, the far edge exclusive. */
const HALL_EAST = 99;

/** The street that took its place, in squares, both edges inclusive. */
const HALL_STREET = { from: 100, to: 104 };

/**
 * The rectangle a prison stands on, in squares, the far edges exclusive.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns its footprint, which is the whole block bar the street
 * @remarks
 * Bigger than {@link builtPlot} by a square on every side, because a prison is
 * built over the pavement as well: five squares by five against an ordinary
 * house's three by three, which is two and three quarter times the ground. The
 * picture and the floor take their shape from this one function, so what one
 * walks into is what one can see.
 */
export function prisonPlot(
  blockX: number,
  blockY: number,
): { left: number; top: number; right: number; bottom: number } {
  const last = PRISON_BLOCKS - 1;
  const across = openSpan(blockX, true);
  const down = openSpan(blockY, false);
  const right = openSpan(blockX + last, true);
  const under = openSpan(blockY + last, false);
  return {
    left: blockX * BLOCK_TILES + across.from,
    top: blockY * BLOCK_TILES + down.from,
    right: (blockX + last) * BLOCK_TILES + right.to + 1,
    bottom: (blockY + last) * BLOCK_TILES + under.to + 1,
  };
}

/**
 * How many city blocks across a prison stands.
 *
 * @remarks
 * **The next size the grid allows.** A prison over one block came out at five
 * squares by five, which next to a yard with a basketball court in it and men
 * walking about is a shed. The block grid does not offer anything between one
 * block and two - everything in between is street - so two it is: thirteen
 * squares by thirteen, with the street that used to run between the four
 * blocks swallowed by the yard.
 *
 * What it does **not** swallow is the streets round the outside, which is why
 * the footprint stops at them: the prison closes one crossing, not four
 * streets.
 */
const PRISON_BLOCKS = 2;

/**
 * How many squares thick the ring of building round the yard is.
 *
 * @remarks
 * One, since the fence went up. The footprint is what the street grid leaves
 * and not a square more, so the wire had to come out of it - and it came out
 * of the building rather than out of the yard: a range half as deep still
 * reads as a range, because what one sees of it is the height of its wall,
 * while a yard two squares smaller each way has no room left for a court.
 */
export const PRISON_WING = 1;

/** And how many the wire round the outside of it takes. */
export const PRISON_FENCE = 1;

/** Which squares of one block, along one axis, are neither road nor pavement. */
function builtSpan(
  block: number,
  across: boolean,
): { from: number; to: number } {
  let from = BLOCK_TILES;
  let to = -1;
  for (let into = 0; into < BLOCK_TILES; into += 1) {
    const at = block * BLOCK_TILES + into;
    if (!isRoad(at, across) && !nextToRoad(at, across)) {
      from = Math.min(from, into);
      to = Math.max(to, into);
    }
  }
  // **What the motorway takes off the front, the back gives back.** The
  // pavement a motorway forces in front of a building (see {@link nextToRoad})
  // comes out of the building, and a shop three squares deep that loses one of
  // them to a kerb is two squares deep with its name written across the whole
  // of it. So it is taken off the other end instead: the house grows back into
  // the strip of pavement behind it, which is the side nobody walks on - the
  // way in, the sign and the windows are all on the front.
  //
  // Only down the page, and only where the back is pavement rather than
  // tarmac. Across, the building simply comes out narrower: a pavement on both
  // sides is what a building between two streets has.
  const front = block * BLOCK_TILES + to + 1;
  const back = block * BLOCK_TILES + from - 1;
  //
  // And never past the top of the block: where two blocks run together with no
  // street between them, the square behind belongs to the neighbour, and a
  // house that grew into it would stand inside the one next door.
  const took = !across && to >= 0 && from > 0 && besideMotorway(front);
  return took && !isRoad(back, across) ? { from: from - 1, to } : { from, to };
}

/**
 * The country roads, as the smooth lines they were bent from.
 *
 * @returns each road with its width in squares and its points, in squares
 * @remarks
 * The floor answers *where one may drive* in squares of forty-eight pixels,
 * and a curve laid into squares that size is a staircase. So the picture does
 * not use the floor for these: it strokes **this**, the same curve, as one
 * smooth line. Squares decide, the line is what one sees - and because the
 * line is drawn a shade wider than the squares it covers, the staircase
 * disappears under it.
 *
 * The dirt tracks come back as well, so the renderer can tell tarmac from
 * gravel without a second table.
 */
export function roadLines(): readonly {
  readonly wide: number;
  readonly dirt: boolean;
  readonly points: readonly Vec[];
}[] {
  return [
    ...ROADS.map((road) => ({ ...road, dirt: false })),
    ...TRACKS.map((track) => ({ ...track, dirt: true })),
  ];
}

/**
 * The railway: one great loop through all three cities.
 *
 * @remarks
 * Four straights on street lines, so the track runs down the middle of a road
 * instead of through somebody's front room - and where it leaves the land it
 * simply carries on over the water on its own bridge.
 *
 * Its bottom used to run along row 138, which took it straight over Mount
 * Chiliad. A railway does not climb a mountain; it goes round the foot of one
 * or through it in a tunnel, and there is no tunnel here. Row 114 clears the
 * rock by twenty squares and still crosses Los Santos.
 */
const RAIL = { left: 24, right: 136, top: 24, bottom: 112 };

/**
 * How wide the curve at each corner is, in squares.
 *
 * @remarks
 * Eighteen squares is the better part of nine hundred pixels - a radius a
 * train at this scale can take without the carriages folding up. Rail does not
 * do right angles: a ninety degree corner is a derailment, and drawn from
 * above it is the one thing that says this line was laid by a program.
 */
const RAIL_BEND = 18;

/**
 * And how wide the one corner is that has to be tighter than that.
 *
 * @remarks
 * The two southern ones, because everything else about them is decided by the
 * sea: the line has to cross the water **square to the bank**, or the bridge
 * over it is a staircase of squares running diagonally across it. So each
 * straight runs on to the far shore and the corner is taken in six squares
 * instead of eighteen - tight for a railway, and still not a right angle.
 */
const RAIL_TIGHT = 6;

/** How finely the loop is walked when it is turned into squares, in squares. */
const RAIL_STEP = 0.2;

/**
 * The middle of the track, all the way round, in squares.
 *
 * @returns the points of the loop, clockwise from the top left corner, each one
 *   a fifth of a square from the next
 * @remarks
 * Straight, curve, straight, curve: the same shape one would draw with a ruler
 * and a pair of compasses. Everything else about the railway is read off this
 * one line - which squares are track, which way the sleepers lie on each of
 * them, where the train is after so many pixels, and where the platforms are.
 */
export function railLine(): readonly Vec[] {
  if (RAIL_LINE.length === 0) {
    const left = RAIL.left + HALF;
    const right = RAIL.right + HALF;
    const top = RAIL.top + HALF;
    const bottom = RAIL.bottom + HALF;
    const bend = RAIL_BEND;
    runStraight(
      RAIL_LINE,
      { x: left + bend, y: top },
      { x: right - bend, y: top },
    );
    runCurve(RAIL_LINE, { x: right - bend, y: top + bend }, -QUARTER, 0);
    // **Senkrecht ueber das Wasser, und die Kurve erst dahinter.** Die
    // Ostseite laeuft geradeaus bis unter das Suedufer der Meerenge; die
    // Suedostecke ist dafuer enger als die anderen drei ({@link RAIL_TIGHT}).
    // Vorher fing sie auf Reihe 94 an, also mitten im Wasser, und die Bruecke
    // war eine Treppe aus Feldern, die schraeg ueber den Kanal lief.
    runStraight(
      RAIL_LINE,
      { x: right, y: top + bend },
      { x: right, y: bottom - RAIL_TIGHT },
    );
    runCurve(
      RAIL_LINE,
      { x: right - RAIL_TIGHT, y: bottom - RAIL_TIGHT },
      0,
      QUARTER,
      RAIL_TIGHT,
    );
    // **Und im Suedwesten dasselbe.** Dort quert die Bahn das Wasser vor San
    // Fierro, gleich neben der Strassenbruecke: Mit dem weiten Bogen fing die
    // Kurve auf Reihe 94,5 an, also weit vor dem Ufer, und die Querung lief
    // als Treppe schraeg ueber die Bucht. Jetzt laeuft die Westgerade bis
    // Reihe 106,5 durch - senkrecht ueber das Wasser - und die Kurve liegt
    // vollstaendig an Land.
    runStraight(
      RAIL_LINE,
      { x: right - RAIL_TIGHT, y: bottom },
      { x: left + RAIL_TIGHT, y: bottom },
    );
    runCurve(
      RAIL_LINE,
      { x: left + RAIL_TIGHT, y: bottom - RAIL_TIGHT },
      QUARTER,
      HALF_TURN,
      RAIL_TIGHT,
    );
    runStraight(
      RAIL_LINE,
      { x: left, y: bottom - RAIL_TIGHT },
      { x: left, y: top + bend },
    );
    runCurve(
      RAIL_LINE,
      { x: left + bend, y: top + bend },
      HALF_TURN,
      THREE_QUARTERS,
    );
  }
  return RAIL_LINE;
}

/** The loop, worked out once. */
const RAIL_LINE: Vec[] = [];

/** A quarter of a circle, which a corner of the loop is. */
const QUARTER = Math.PI / 2;

/** A half of one, and three quarters: the headings the four corners end on. */
const HALF_TURN = Math.PI;

/** The last corner, which comes back round to where the loop began. */
const THREE_QUARTERS = HALF_TURN + QUARTER;

/** One straight length of it, stepped out. */
function runStraight(into: Vec[], from: Vec, to: Vec): void {
  const long = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.round(long / RAIL_STEP));
  for (let step = 0; step < steps; step += 1) {
    const along = step / steps;
    into.push({
      x: from.x + (to.x - from.x) * along,
      y: from.y + (to.y - from.y) * along,
    });
  }
}

/** And one corner of it, at whatever radius that corner has. */
function runCurve(
  into: Vec[],
  middle: Vec,
  from: number,
  to: number,
  round = RAIL_BEND,
): void {
  const steps = Math.max(
    1,
    Math.round((Math.abs(to - from) * round) / RAIL_STEP),
  );
  for (let step = 0; step < steps; step += 1) {
    const turn = from + ((to - from) * step) / steps;
    into.push({
      x: middle.x + Math.cos(turn) * round,
      y: middle.y + Math.sin(turn) * round,
    });
  }
}

/**
 * Which squares the track lies on, and which way it runs on each.
 *
 * @returns the squares, by {@link cellKey}, against the heading of the rail
 * @remarks
 * Walked once and remembered. The floor asks it of every square in San
 * Andreas, and the picture asks it again for every square on the screen, so
 * the one thing it must not be is a loop over nine hundred points.
 */
function railCells(): ReadonlyMap<number, number> {
  if (RAIL_CELLS.size === 0) {
    const line = railLine();
    line.forEach((point, at) => {
      const next = line[(at + 1) % line.length] ?? point;
      const col = Math.floor(point.x);
      const row = Math.floor(point.y);
      if (col >= 0 && row >= 0 && col < CITY_TILES && row < CITY_TILES) {
        RAIL_CELLS.set(
          cellKey(col, row),
          Math.atan2(next.y - point.y, next.x - point.x),
        );
      }
    });
  }
  return RAIL_CELLS;
}

/** The answer to that, once. */
const RAIL_CELLS = new Map<number, number>();

/** One square of the map, as a single number. */
function cellKey(col: number, row: number): number {
  return row * CITY_TILES + col;
}

/**
 * Which way the track runs across one square.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns the heading in radians, or zero where there is no track
 * @remarks
 * The picture needs it: sleepers lie across the rails, and on a curve that is
 * not one of four directions.
 */
export function railAngle(col: number, row: number): number {
  return railCells().get(cellKey(col, row)) ?? 0;
}

/**
 * Where a point so far along the loop is, and which way the track runs there.
 *
 * @param along - the distance from the top left corner, clockwise, in pixels
 * @returns the point in city pixels and the heading in radians
 */
export function railAt(along: number): { at: Vec; angle: number } {
  const line = railLine();
  const step = RAIL_STEP * TILE;
  const round = railLength();
  const gone = ((along % round) + round) % round;
  const at = Math.floor(gone / step) % line.length;
  const point = line[at] ?? ORIGIN;
  const next = line[(at + 1) % line.length] ?? point;
  const into = (gone - at * step) / step;
  return {
    at: {
      x: (point.x + (next.x - point.x) * into) * TILE,
      y: (point.y + (next.y - point.y) * into) * TILE,
    },
    angle: Math.atan2(next.y - point.y, next.x - point.x),
  };
}

/** What a point off the end of the loop would be, which cannot happen. */
const ORIGIN: Vec = { x: 0, y: 0 };

/**
 * How long one lap is, in pixels.
 *
 * @returns the way round the loop
 * @remarks
 * Every point is one step from the next by construction, so the lap is the
 * number of steps - there is nothing to add up.
 */
export function railLength(): number {
  return railLine().length * RAIL_STEP * TILE;
}

/**
 * How far round the loop a station sits.
 *
 * @param stop - the station
 * @returns its distance from the top left corner, clockwise, in pixels
 */
export function stationAlong(stop: Station): number {
  const line = railLine();
  let best = 0;
  let bestAway = Number.POSITIVE_INFINITY;
  line.forEach((point, at) => {
    const away = Math.hypot(
      point.x - (stop.col + HALF),
      point.y - (stop.row + HALF),
    );
    if (away < bestAway) {
      best = at;
      bestAway = away;
    }
  });
  return best * RAIL_STEP * TILE;
}

/** One stop on the line: where the train waits and one can get on. */
export type Station = {
  readonly name: string;
  /** Where the platform is, in squares. */
  readonly col: number;
  readonly row: number;
};

/**
 * The three of them, one to a city.
 *
 * @remarks
 * Each sits on the loop itself, which is what lets the train work out where to
 * stop from the same two numbers the platform is drawn from.
 */
export const STATIONS: readonly Station[] = [
  { name: "San Fierro", col: 24, row: 64 },
  { name: "Las Venturas", col: 112, row: 24 },
  { name: "Los Santos", col: 112, row: 112 },
];

/**
 * The cell at a point in the city.
 *
 * @param cells - the city floor
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns what is under it; outside the city counts as water
 */
export function cellUnder(cells: readonly Cell[], x: number, y: number): Cell {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  const inside = col >= 0 && row >= 0 && col < CITY_TILES && row < CITY_TILES;
  return inside ? cells[row * CITY_TILES + col] : "water";
}

/**
 * Whether a point can be stood on at all.
 *
 * @param cells - the city floor
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns true for anything but a building or the sea
 */
export function isOpen(cells: readonly Cell[], x: number, y: number): boolean {
  const cell = cellUnder(cells, x, y);
  // Wire is a wall. One can see the tank through it, which is the whole point
  // of a fence rather than a hoarding - but nobody drives through it.
  return cell !== "building" && cell !== "water" && cell !== "fence";
}

/**
 * Whether a point is on the tarmac.
 *
 * @param cells - the city floor
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns true on a street
 */
export function isRoadAt(
  cells: readonly Cell[],
  x: number,
  y: number,
): boolean {
  const cell = cellUnder(cells, x, y);
  // A bridge is a road with a view: the traffic drives over it, keeps to its
  // lanes on it and turns at the junction on the far side of it.
  return cell === "road" || cell === "bridge";
}

/**
 * The middle of the nearest street crossing.
 *
 * @param x - a point in the city, in pixels
 * @param y - a point in the city, in pixels
 * @returns the crossing a car would aim for
 */
export function nearestCrossing(x: number, y: number): Vec {
  const step = BLOCK_TILES * TILE;
  return {
    x: Math.round(x / step) * step + TILE / 2,
    y: Math.round(y / step) * step + TILE / 2,
  };
}

/**
 * The pavement in front of every building of one sort.
 *
 * @param kind - the sort of building to look for
 * @returns one point per block, on the street side of its door
 * @remarks
 * The city plan is the same every time, so this is a fixed list rather than a
 * search that has to be repeated: whoever wants to stand outside the night club
 * asks once at the start and remembers the answer.
 *
 * Only blocks that are actually built on count. The plan deals a sort to every
 * square of the grid, the parks and the beach included, and a door in front of
 * a lawn is a shop that cannot be seen and a hospital one wakes up beside
 * rather than in.
 */
export function doorsOf(kind: BuildingKind): readonly Vec[] {
  const blocks = CITY_TILES / BLOCK_TILES;
  const doors: Vec[] = [];
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      // **A block a prison stands on has no door on the street.** Three of its
      // four blocks keep whatever the plan drew there - a house, a club, a gun
      // shop - and none of them is a building any more: the floor under them
      // is prison. A door left there would be a shop nobody can walk into, and
      // in this city it was the player's own garage, cut as a hole through the
      // prison wall.
      const over = prisonUnder(
        blockX * BLOCK_TILES + BLOCK_MIDDLE,
        blockY * BLOCK_TILES + BLOCK_MIDDLE,
      );
      const swallowed =
        over !== null && (over.x !== blockX || over.y !== blockY);
      if (
        buildingAt(blockX, blockY).kind === kind &&
        builtBlock(blockX, blockY) &&
        !swallowed
      ) {
        // The middle of the block, one cell south of its front wall: the
        // pavement people would actually stand on.
        //
        // **A prison has no pavement to stand on**: its wall is built over it
        // and runs to the kerb. So its gate opens straight onto the street,
        // which is where one is put out after a stretch and is also what a
        // prison gate does.
        if (kind === "prison") {
          // **South of the whole of it**, which is four blocks away rather
          // than one: the gate of a prison opens onto the street that runs
          // along the front of it, and the front of this one is not where the
          // front of a house on the same block would be.
          const plot = prisonPlot(blockX, blockY);
          doors.push({
            x: ((plot.left + plot.right) / 2) * TILE,
            y: (plot.bottom + PRISON_KERB) * TILE,
          });
        } else if (theHall(blockX, blockY)) {
          // **And the town hall's door is where its front wall now is.** The
          // ordinary door is a fixed offset inside the block, which is right
          // for a building that stands where its block says; this one has
          // moved back five squares (see {@link HALL_BLOCK}), and the offset
          // would leave its door out on the sand.
          const plot = builtPlot(blockX, blockY);
          doors.push({
            x: ((plot.left + plot.right) / 2) * TILE,
            y: plot.bottom * TILE,
          });
        } else {
          doors.push({
            x: (blockX * BLOCK_TILES + DOOR_ACROSS) * TILE,
            y: (blockY * BLOCK_TILES + DOOR_DOWN) * TILE,
          });
        }
      }
    }
  }
  return doors;
}

/**
 * The three bays of a fire station: where an engine stands and drives out.
 *
 * @param plot - the ground the station stands on, in squares
 * @returns one rectangle per bay, in squares, the far edges exclusive
 * @remarks
 * **The doors never shut**, so this is not a door at all: it is a piece of the
 * building that is simply not there. Each bay is one square across and two
 * deep - a van is sixty-two pixels long and a square is forty-eight, so one
 * square deep would leave the back of every engine hanging out in the street -
 * and the three of them take the whole width of the front, which is what a
 * fire station looks like from the road.
 *
 * Read by the floor, which cuts them out, and by the picture, which draws the
 * openings; neither of them measures anything of its own.
 */
export function fireBays(plot: {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}): readonly { left: number; top: number; right: number; bottom: number }[] {
  const deep = Math.min(BAY_DEEP, plot.bottom - plot.top - 1);
  const bays: { left: number; top: number; right: number; bottom: number }[] =
    [];
  for (let at = plot.left; at < plot.right; at += 1) {
    bays.push({
      left: at,
      top: plot.bottom - deep,
      right: at + 1,
      bottom: plot.bottom,
    });
  }
  return bays;
}

/** How many squares deep a bay is cut into the building. */
const BAY_DEEP = 2;

/**
 * The ground every building of one sort stands on.
 *
 * @param kind - the sort to look for
 * @returns one rectangle per block, in squares, the far edges exclusive
 * @remarks
 * The same walk as {@link doorsOf} and for the same reason: the plan is the
 * same every time, so whoever wants to put an engine in a fire station or a
 * helicopter on a hospital asks once and remembers. What comes back is the
 * **built plot** rather than the block, because that is the rectangle the
 * picture draws the building on.
 */
export function plotsOf(
  kind: BuildingKind,
): readonly { left: number; top: number; right: number; bottom: number }[] {
  const blocks = CITY_TILES / BLOCK_TILES;
  const plots: { left: number; top: number; right: number; bottom: number }[] =
    [];
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      if (
        buildingAt(blockX, blockY).kind === kind &&
        builtBlock(blockX, blockY)
      ) {
        plots.push(builtPlot(blockX, blockY));
      }
    }
  }
  return plots;
}

/**
 * The landing pad on the roof of every hospital.
 *
 * @returns the middle of each hospital block, where the H is painted
 * @remarks
 * The middle of the plot, which is where the picture puts the circle - the two
 * read the same rectangle, so the machine stands on the paint rather than
 * beside it. How high that is, is {@link roofAt}: whoever wants to put
 * something down there asks the floor, the same way the jetpack does.
 */
export function padsOf(): readonly Vec[] {
  return plotsOf("hospital").map((plot) => ({
    x: ((plot.left + plot.right) / 2) * TILE,
    y: ((plot.top + plot.bottom) / 2) * TILE,
  }));
}

/**
 * The garage: the square a car comes to rest in, two deep into the house.
 *
 * @param garage - the pavement outside the door, as the game stores it
 * @returns the middle of the far square of the bay
 * @remarks
 * Two squares deep, because the door has to have something to shut **behind**.
 * With a one-square garage a car parked in the doorway could always drive
 * straight back out of the shut door - whatever is already inside a wall is
 * allowed to move out of it, and that rule is what keeps anybody from being
 * stuck in scenery for good.
 */
export function garageBay(garage: Vec): Vec {
  return { x: garage.x, y: garage.y - TILE * 2 };
}

/**
 * The square under the door itself.
 *
 * @param garage - the pavement outside the door
 * @returns the middle of the doorway square
 * @remarks
 * Open while the door is up, part of the house while it is down.
 */
export function garageMouth(garage: Vec): Vec {
  return { x: garage.x, y: garage.y - TILE };
}

/**
 * The city floor with the garage hollowed out of the house.
 *
 * @param cells - the floor as the plan laid it out
 * @param garage - the pavement outside the door
 * @returns the same floor with the far square of the bay open
 * @remarks
 * Done once, when the game is made. The square under the door is left to
 * {@link setGarage}, which opens and shuts it with the door.
 */
export function openBay(cells: readonly Cell[], garage: Vec): readonly Cell[] {
  return cellSet(cells, garageBay(garage), "walk");
}

/**
 * The city floor with the engine bays cut out of every fire station.
 *
 * @param cells - the floor as the plan laid it out
 * @returns the same floor with three squares of each station open
 * @remarks
 * Done once, when the game is made, and never undone: the doors of a fire
 * station stand open. What is cut is what {@link fireBays} says, so the floor
 * one drives on and the openings one can see are the same three rectangles.
 *
 * Open as **road** rather than as pavement: an engine drives out of one, and
 * the traffic behind it treats the mouth of the bay as a turning rather than
 * as something to steer round.
 */
export function openStations(cells: readonly Cell[]): readonly Cell[] {
  let floor = cells;
  for (const plot of plotsOf("fire")) {
    for (const bay of fireBays(plot)) {
      for (let row = bay.top; row < bay.bottom; row += 1) {
        for (let col = bay.left; col < bay.right; col += 1) {
          floor = cellSet(
            floor,
            { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 },
            "road",
          );
        }
      }
    }
  }
  return floor;
}

/**
 * The city floor with the garage door open or shut.
 *
 * @param cells - the floor as it stands
 * @param garage - the pavement outside the door
 * @param open - whether the door is up
 * @returns a floor in which the doorway is a way in or a wall again
 * @remarks
 * The door is not painted on: while it is down, the square under it **is**
 * part of the house, and everything that asks the floor whether it may go
 * somewhere gets the same answer as the eye. That is what makes being shut in
 * for the length of a respray a fact rather than a picture.
 */
export function setGarage(
  cells: readonly Cell[],
  garage: Vec,
  open: boolean,
): readonly Cell[] {
  return cellSet(cells, garageMouth(garage), open ? "walk" : "building");
}

/** One square of the floor, changed. */
function cellSet(cells: readonly Cell[], at: Vec, cell: Cell): readonly Cell[] {
  const floor = [...cells];
  floor[Math.floor(at.y / TILE) * CITY_TILES + Math.floor(at.x / TILE)] = cell;
  return floor;
}

/**
 * One house of your own in every city.
 *
 * @param start - where the day begins, which decides nothing but the order
 * @returns the pavement outside each of the three garages
 * @remarks
 * Three cities, three front doors. Whichever one is nearest is the one the
 * door opens for - see `homeOf` in ./engine - so a chase in Las Venturas can
 * end in a garage in Las Venturas rather than in a ferry queue.
 */
export function myHouses(): readonly Vec[] {
  return homeDoors().map((best) => {
    // **The villa's door is not in the middle of its front.** Its garage is in
    // the carport, three columns in from the left-hand end of the house -
    // which is where a carport is on the photograph this house is drawn from.
    // Worked out from the same four numbers {@link villaPlot} uses, so the
    // hole in the wall and the hole in the floor cannot end up in different
    // places.
    const span = BLOCK_TILES * TILE;
    const blockX = Math.floor(best.x / span);
    return districtAt(best.x, best.y) === "vagos"
      ? {
          x:
            (blockX * BLOCK_TILES +
              openSpan(blockX, true).from +
              VILLA_KERB +
              VILLA_LAWN +
              VILLA_BAY_IN +
              HALF) *
            TILE,
          y: best.y,
        }
      : best;
  });
}

/**
 * The three front doors, before the villa's is moved along its own front.
 *
 * @returns one door an island: the house nearest the middle of it
 * @remarks
 * Its own function because {@link villaBlock} has to ask which block the villa
 * is on, and it cannot ask {@link myHouses}: that one moves the villa's door
 * to the garage column, which on a property two blocks wide can land in the
 * **other** block - whereupon the villa would decide it was standing next
 * door to itself, and the whole property would walk sideways a block at a
 * time.
 */
function homeDoors(): readonly Vec[] {
  // The prison swallowed three blocks, and a door on one of them is a door
  // into a wall - see doorsOf, which now leaves those blocks out. The three
  // homes are picked from what is left.
  const doors = doorsOf("house");
  return ISLANDS.map((isle) => {
    const middle = {
      x: ((isle.left + isle.right) / 2) * TILE,
      y: ((isle.top + isle.bottom) / 2) * TILE,
    };
    // **The villa has an address, and it keeps it.** See VILLA_BLOCK.
    const home = doors.find(
      (door) =>
        Math.floor(door.x / (BLOCK_TILES * TILE)) === VILLA_BLOCK.x &&
        Math.floor(door.y / (BLOCK_TILES * TILE)) === VILLA_BLOCK.y &&
        onIsle(door, isle),
    );
    if (home !== undefined) {
      return home;
    }
    let best = doors[0] ?? middle;
    let bestAway = Number.POSITIVE_INFINITY;
    for (const door of doors) {
      const away = Math.hypot(door.x - middle.x, door.y - middle.y);
      if (onIsle(door, isle) && away < bestAway) {
        best = door;
        bestAway = away;
      }
    }
    return best;
  });
}

/** Whether a door stands on one of the three islands. */
function onIsle(door: Vec, isle: Island): boolean {
  return (
    door.x > isle.left * TILE &&
    door.x < isle.right * TILE &&
    door.y > isle.top * TILE &&
    door.y < isle.bottom * TILE
  );
}

/**
 * Where the villa stands, written down rather than worked out.
 *
 * @remarks
 * **The one address in this city that is not a formula.** Everything else here
 * is: ask the plan what is on a block and it answers the same thing every
 * time, and that is what keeps the city the same city without a single saved
 * byte. The villa was the same - *the house nearest the middle of the
 * south-eastern island* - and that was wrong, because the answer depends on
 * which blocks are houses at all.
 *
 * It was found out when the airfield grew: the field runs the length of the
 * map now, blocks that were houses before are runway, and the nearest house to
 * the middle of the island became a **different** house. The villa moved
 * house. Somebody's front door is not a thing that may move because an airport
 * two miles away got longer.
 *
 * So it is named here: block sixteen across, fourteen down - where it stood
 * before the field was lengthened, a two-block property with the carport on
 * the left, and where it stands now. Should that block ever stop being a plain
 * house, there is no door there to find, and the old rule takes over rather
 * than leaving the player without a home.
 */
const VILLA_BLOCK = { x: 16, y: 14 };

/**
 * Which block the villa stands on.
 *
 * @returns it, or null before there is a city at all
 * @remarks
 * The house in the south-east quarter - see `drawVilla` in the renderer. Worked
 * out once and remembered, because the floor asks it of every square it lays.
 */
export function villaBlock(): Vec | null {
  if (VILLA_AT === undefined) {
    const span = BLOCK_TILES * TILE;
    const home = homeDoors().find(
      (house) => districtAt(house.x, house.y) === "vagos",
    );
    VILLA_AT =
      home === undefined
        ? null
        : { x: Math.floor(home.x / span), y: Math.floor(home.y / span) };
  }
  return VILLA_AT;
}

/** The answer to {@link villaBlock}, worked out once. */
let VILLA_AT: Vec | null | undefined = undefined;

/**
 * Whether the villa has swallowed the block next door.
 *
 * @returns true where the property runs over two blocks
 * @remarks
 * **The house next door comes down.** The property is two blocks across, which
 * means the street between them is inside it - the same thing a prison does to
 * the crossing in its middle, and the same rule applies: an ordinary street
 * may be swallowed, a **motorway** may not. A motorway is the one road one
 * drives the length of, and a garden across it is a hole in the map.
 *
 * Only a plain house is taken. A bank, a hospital or a night club is one of a
 * kind and worth more where it stands than as somebody's lawn.
 */
export function villaWide(): boolean {
  const block = villaBlock();
  if (block === null) {
    return false;
  }
  if (VILLA_TWO === undefined) {
    const next = { x: block.x + 1, y: block.y };
    const street = next.x * BLOCK_TILES;
    VILLA_TWO =
      builtBlock(next.x, next.y) &&
      PLAIN_BLOCKS.includes(buildingAt(next.x, next.y).kind) &&
      !gaoled(next.x, next.y) &&
      !isMotorway(street);
  }
  return VILLA_TWO;
}

/** The answer to {@link villaWide}, worked out once. */
let VILLA_TWO: boolean | undefined = undefined;

/**
 * Whether a block has been swallowed by the villa next door.
 *
 * @param blockX - the block, across
 * @param blockY - the same, down
 * @returns true for the block whose house came down
 */
export function villaTook(blockX: number, blockY: number): boolean {
  const block = villaBlock();
  return (
    block !== null &&
    villaWide() &&
    blockX === block.x + 1 &&
    blockY === block.y
  );
}

/**
 * The ground the villa itself stands on.
 *
 * @param blockX - its block, across
 * @param blockY - the same, down
 * @returns the footprint, in squares
 * @remarks
 * **Wider than an ordinary house, and no deeper.** Across, it takes the whole
 * of the block that is not tarmac - which is the pavement down its two sides
 * as well, the way a house with grounds does. Down, it keeps to what every
 * other house gets, so that the strip in front of it and the strip behind it
 * are left over for the garden.
 */
export function villaPlot(
  blockX: number,
  blockY: number,
): { left: number; top: number; right: number; bottom: number } {
  const grounds = villaGrounds(blockX, blockY);
  const down = builtSpan(blockY, false);
  const left = grounds.left + VILLA_KERB + VILLA_LAWN;
  return {
    left,
    top: blockY * BLOCK_TILES + down.from,
    right: left + VILLA_ROOMS,
    bottom: blockY * BLOCK_TILES + down.to + 1,
  };
}

/**
 * How the property is laid out across, in squares.
 *
 * @remarks
 * Left to right, and every number here is one strip of it: pavement, lawn with
 * the hedge along its outer edge, the house, lawn, the paved yard, and
 * pavement again. **The house does not stand on the boundary**, which is the
 * whole difference between a villa in its grounds and a terrace with a big
 * garden - one walks round a villa.
 *
 * Read by {@link villaPlot}, {@link villaYard} and by `myHouses`, which cuts
 * the garage out of the house. All three from the same numbers, so the hole in
 * the wall, the hole in the floor and the tarmac outside it cannot drift
 * apart.
 */
export const VILLA_KERB = 1;

/** How wide the strip of lawn inside the hedge is. */
const VILLA_LAWN = 1;

/** How many squares the house itself takes. */
const VILLA_ROOMS = 5;

/** Of those, how many are the two-storey block rather than the wing. */
export const VILLA_MAIN = 2;

/** And which column of the house the garage is cut out of. */
export const VILLA_BAY_IN = 3;

/**
 * The ground round it: lawn in front of the house and behind it.
 *
 * @param blockX - its block, across
 * @param blockY - the same, down
 * @returns the whole property, in squares
 */
export function villaGrounds(
  blockX: number,
  blockY: number,
): { left: number; top: number; right: number; bottom: number } {
  const across = openSpan(blockX, true);
  const down = openSpan(blockY, false);
  const over = villaWide() ? 1 : 0;
  const far = openSpan(blockX + over, true);
  return {
    left: blockX * BLOCK_TILES + across.from,
    top: blockY * BLOCK_TILES + down.from,
    right: (blockX + over) * BLOCK_TILES + far.to + 1,
    bottom: blockY * BLOCK_TILES + down.to + 1,
  };
}

/**
 * The car park to the right of the house.
 *
 * @param blockX - the villa's block, across
 * @param blockY - the same, down
 * @returns the hard standing, in squares
 * @remarks
 * Everything between the end of the house and the far edge of the property,
 * and it runs **down to the kerb**: a car park one cannot drive into off the
 * street is a yard. Concrete rather than road, the same as the one behind the
 * supermarket - the traffic never turns on to it of its own accord, and
 * nobody on foot treats crossing it as crossing a road.
 */
export function villaYard(
  blockX: number,
  blockY: number,
): { left: number; top: number; right: number; bottom: number } {
  const grounds = villaGrounds(blockX, blockY);
  const house = villaPlot(blockX, blockY);
  // **Straight off the end of the house**, with the lawn on the far side of
  // it rather than between the two: one walks out of the carport on to the
  // stones, not across a strip of grass to get to them.
  return {
    left: house.right,
    top: house.top,
    right: grounds.right - VILLA_KERB - VILLA_LAWN,
    bottom: grounds.bottom,
  };
}

/**
 * What one square of the villa's property is.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns the floor there, or null for a square that is not its business
 * @remarks
 * Two answers and nothing else: the house is building, and everything else
 * inside the property is **grass**. That is what turns the strip in front of
 * it from public pavement into a front lawn, and it costs nothing - both are
 * ground one can walk on, so nothing that moves has to know about it.
 */
export function villaCell(col: number, row: number): Cell | null {
  const block = villaBlock();
  const near =
    block !== null &&
    Math.floor(row / BLOCK_TILES) === block.y &&
    (Math.floor(col / BLOCK_TILES) === block.x ||
      villaTook(Math.floor(col / BLOCK_TILES), block.y));
  if (block === null || !near) {
    return null;
  }
  const grounds = villaGrounds(block.x, block.y);
  const inside =
    col >= grounds.left &&
    col < grounds.right &&
    row >= grounds.top &&
    row < grounds.bottom;
  if (!inside) {
    return null;
  }
  // The pavement down either side of the property, which is what one walks
  // past it on: the hedge stands inside that, and the lawn inside the hedge.
  if (col < grounds.left + VILLA_KERB || col >= grounds.right - VILLA_KERB) {
    return "walk";
  }
  const house = villaPlot(block.x, block.y);
  const built =
    col >= house.left &&
    col < house.right &&
    row >= house.top &&
    row < house.bottom;
  if (built) {
    return "building";
  }
  const yard = villaYard(block.x, block.y);
  const parked =
    col >= yard.left &&
    col < yard.right &&
    row >= yard.top &&
    row < yard.bottom;
  return parked ? "dock" : "park";
}

/**
 * Whether a square is a crossing of two streets.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true where a line of the grid meets another one
 */
export function atCrossing(col: number, row: number): boolean {
  return inCity(col, row) && isRoad(col, true) && isRoad(row, false);
}

/**
 * Whether a crossing has traffic lights.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true where one motorway crosses another
 * @remarks
 * Only where two big roads meet. A light at every corner of a grid city means
 * a driver spends the whole game waiting at one - the traffic crawls, and so
 * does anybody trying to get across town in it. The junctions that are worth
 * stopping at are the handful where the wide roads cross each other.
 */
export function lightAt(col: number, row: number): boolean {
  return atCrossing(col, row) && motorwayNear(col) && motorwayNear(row);
}

/** What a traffic light is showing. */
export type LightColour = "green" | "amber" | "red";

/**
 * What the lights are showing one way at this moment.
 *
 * @param time - the clock, in seconds
 * @param upright - true for traffic going north or south
 * @returns green, amber or red
 * @remarks
 * One clock for the whole city: every light on one axis is green together and
 * then every light on the other is. A green wave, free of charge - and what it
 * buys is that the traffic moves in blocks, the way traffic does.
 *
 * Three colours rather than two, because two is not a traffic light. Each way
 * gets its green, then its amber, and is red for exactly as long as the other
 * way has both - so the two sides can never be anything but opposite, and
 * there is no moment when both are green.
 */
export function lightColour(time: number, upright: boolean): LightColour {
  const span = LIGHT_PHASE + LIGHT_AMBER;
  const round = span * 2;
  const into = ((time % round) + round) % round;
  const mine = upright ? into : (into + span) % round;
  let colour: LightColour;
  if (mine < LIGHT_PHASE) {
    colour = "green";
  } else if (mine < span) {
    colour = "amber";
  } else {
    colour = "red";
  }
  return colour;
}

/**
 * Which squares of the grid make up the street on this line.
 *
 * @param at - a column or a row
 * @returns the first and last square of that street, in squares
 * @remarks
 * Read off the plan rather than measured off the floor, because at a crossing
 * the floor gives the wrong answer: tarmac runs seven squares in both
 * directions there, and a car working out its lane from that puts itself in
 * the middle of the junction and stays there. The plan knows that a street is
 * one square wide and a motorway is five, wherever one happens to be standing.
 */
export function streetRun(at: number): {
  readonly from: number;
  readonly to: number;
} {
  const step = BLOCK_TILES * MOTORWAY_EVERY;
  const into = ((at % step) + step) % step;
  let run: { from: number; to: number };
  if (into <= MOTORWAY_HALF || into >= step - MOTORWAY_HALF) {
    const middle = Math.round(at / step) * step;
    run = { from: middle - MOTORWAY_HALF, to: middle + MOTORWAY_HALF };
  } else {
    // The same sum the floor does, so a car's lane is on the tarmac it is
    // actually driving on: a street beside a motorway is two squares wide
    // rather than three, because it handed one back. See {@link handsBack}.
    const line = Math.round(at / BLOCK_TILES);
    const middle = line * BLOCK_TILES;
    run = {
      from: middle - ROAD_HALF + (handsBack(line - 1, 0) ? 1 : 0),
      to: middle + ROAD_HALF - (handsBack(line, 1) ? 1 : 0),
    };
  }
  return run;
}

/**
 * How wide the run of tarmac here is, across one axis.
 *
 * @param cells - the city floor
 * @param col - the square, across
 * @param row - the square, down
 * @param upright - true to measure up and down, false to measure left to right
 * @returns the first and last square of the run, in squares
 * @remarks
 * An ordinary street is one square wide and a motorway is five, and a car has
 * to know which it is on to know where its lane is. Measured rather than
 * looked up, because a junction is wide in both directions and the answer
 * there is whatever is actually under the wheels.
 */
export function roadRun(
  cells: readonly Cell[],
  col: number,
  row: number,
  upright: boolean,
): { readonly from: number; readonly to: number } {
  const at = upright ? row : col;
  let from = at;
  let to = at;
  while (
    to - from < ROAD_RUN_MAX &&
    onTarmac(cells, col, row, upright, from - 1)
  ) {
    from -= 1;
  }
  while (
    to - from < ROAD_RUN_MAX &&
    onTarmac(cells, col, row, upright, to + 1)
  ) {
    to += 1;
  }
  return { from, to };
}

/** How wide a run of tarmac may be counted, in squares. */
const ROAD_RUN_MAX = 6;

/** Whether one square of that run is tarmac. */
function onTarmac(
  cells: readonly Cell[],
  col: number,
  row: number,
  upright: boolean,
  at: number,
): boolean {
  const x = (upright ? col : at) * TILE + TILE * HALF;
  const y = (upright ? at : row) * TILE + TILE * HALF;
  const cell = cellUnder(cells, x, y);
  // A bridge deck is tarmac like any other: it is how wide the road is that
  // decides how many lanes there are, and a deck that did not count came out
  // as a one-lane lane in the middle of a five-lane bridge.
  return cell === "road" || cell === "bridge";
}

/**
 * Whether a square is part of a motorway.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true anywhere on the wide tarmac, middle line and lanes alike
 * @remarks
 * The map in the corner asks: three lanes of grey among a grid of grey streets
 * is not a motorway, it is a slightly wider street. Drawn black it is the one
 * line on the map one can follow across a city at a glance.
 */
export function onMotorway(col: number, row: number): boolean {
  return inCity(col, row) && (motorwayNear(col) || motorwayNear(row));
}

/**
 * Whether a line of the grid is one of the wide roads.
 *
 * @param at - a column or a row
 * @returns true on the middle line of a motorway
 * @remarks
 * The picture asks: a motorway gets the dashes down the middle and the others
 * do not, which is the only thing that tells them apart from three ordinary
 * streets side by side.
 */
export function motorwayLine(at: number): boolean {
  return isMotorway(at);
}

/**
 * Which district a point belongs to.
 *
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns the quarter of town it lies in
 * @remarks
 * Four quarters, cut down the middle of the map: the beach along the south
 * belongs to whichever half it lies under, because a strip of sand is not a
 * neighbourhood anybody fights over.
 */
export function districtAt(x: number, y: number): District {
  const half = (CITY_TILES * TILE) / 2;
  let district: District;
  if (y > half) {
    district = x < half ? "beach" : "vagos";
  } else {
    district = x < half ? "grove" : "ballas";
  }
  return district;
}

/**
 * A point somewhere in the middle of a district.
 *
 * @param district - which quarter
 * @returns a point a marker can be put near
 */
export function districtCentre(district: District): Vec {
  const half = (CITY_TILES * TILE) / 2;
  const quarter = half / 2;
  const spots: Readonly<Record<District, Vec>> = {
    grove: { x: quarter, y: quarter },
    ballas: { x: half + quarter, y: quarter },
    beach: { x: quarter, y: half + quarter },
    vagos: { x: half + quarter, y: half + quarter },
  };
  return spots[district];
}

/* ------------------------------------------------- what stands on a block */

/**
 * Which sort of building fills a given block.
 *
 * @param roll - that block's own dice roll, between zero and one
 * @returns the sort it holds, the same one every time
 */
function blockAt(roll: number): Building {
  const at = Math.min(
    THE_BLOCKS.length - 1,
    Math.floor(roll * THE_BLOCKS.length),
  );
  return BUILDINGS[THE_BLOCKS[at] ?? "house"];
}

/**
 * What stands in the block at these block coordinates.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns the sort of building, the same one every time
 * @remarks
 * Both the renderer and the city need this: one to paint the roof and the sign,
 * the other to know where the night club is so that somebody can stand outside
 * it. It lives here, in the table, so that the two can never disagree about
 * what is on a corner.
 */
export function buildingAt(blockX: number, blockY: number): Building {
  // **Two blocks have traded places** - see TRADED. Everything below is asked
  // about the block one has swapped with, so the two exchange the whole
  // building and not just the sign over its door: the walls, the height, the
  // colour of the roof, and with them the door the robbery is at.
  const at = traded(blockX, blockY);
  const drawn = rawKindAt(at.x, at.y);
  const spare =
    (ONE_ONLY.includes(drawn) && !isTheOne(drawn, at.x, at.y)) ||
    (ONE_PER_QUARTER.includes(drawn) && !isTheLocalOne(drawn, at.x, at.y)) ||
    (drawn === "prison" && !roomForPrison(at.x, at.y)) ||
    (drawn === "police" && !isTheStation(at.x, at.y));
  // **The station comes last, and it can overrule a house.** Every other
  // landmark can only ever be thinned out - where the plan drew a second bank,
  // a house goes up instead - which is fine for a bank and wrong for this one:
  // a quarter of town with no police station in it is a quarter with nowhere
  // for the patrol cars to come from. So the quarter that the dice gave none
  // gets one anyway, in the plainest block nearest its middle.
  const posted = isTheStation(at.x, at.y);
  // **And so can the hospital and the fire station**, for the same reason and
  // one step behind it: thinning alone can only ever take landmarks away, so a
  // quarter whose dice never rolled one would have none at all - and these are
  // the buildings one is let out of after every death and the ones the engines
  // come from. See {@link ONE_EACH}. The police station is asked first and
  // keeps its block; these were steered clear of it.
  const filled = posted
    ? undefined
    : ONE_EACH.find((kind) => isTheLocalOne(kind, at.x, at.y));
  return BUILDINGS[posted ? "police" : (filled ?? (spare ? "house" : drawn))];
}

/**
 * Which block's building stands here.
 *
 * @param blockX - the block, across
 * @param blockY - the same, down
 * @returns itself, or the block it has traded with
 * @remarks
 * **The bank and the casino have swapped corners.** Both stand on the row the
 * villa stands on, in the south-eastern quarter, three blocks apart: the bank
 * was the near one and the casino the far one, and now it is the other way
 * round. Asked for, and a swap is the honest way to do it - moving a landmark
 * by hand would mean two of one sort and none of the other, because both are
 * picked by the plan and not by a list.
 *
 * It only holds while the two really are the bank and the casino. Should the
 * plan ever put something else on either block, the pair is not a pair any
 * more and each block keeps what it drew, rather than two unrelated buildings
 * quietly changing places.
 */
function traded(blockX: number, blockY: number): Vec {
  const here = { x: blockX, y: blockY };
  const at = TRADED.findIndex((one) => one.x === blockX && one.y === blockY);
  if (at < 0 || !tradeOn()) {
    return here;
  }
  return TRADED[TRADED.length - 1 - at] ?? here;
}

/** The two blocks that have swapped, near side first - see {@link traded}. */
const TRADED: readonly Vec[] = [
  { x: 15, y: 14 },
  { x: 12, y: 14 },
];

/** And what has to stand on them for the swap to mean anything. */
const TRADE_KINDS: readonly BuildingKind[] = ["bank", "casino"];

/**
 * Whether the pair is still the pair.
 *
 * @returns true while the two blocks hold the two sorts named
 * @remarks
 * Asked lazily and remembered, like every other answer about this city: at the
 * moment this file is read, half the tables it would need are still being
 * built - and the plan does not change afterwards, so once is enough.
 */
function tradeOn(): boolean {
  if (TRADE_PAIR === undefined) {
    TRADE_PAIR = TRADED.every(
      (one, at) =>
        rawKindAt(one.x, one.y) === TRADE_KINDS[at] && builtBlock(one.x, one.y),
    );
  }
  return TRADE_PAIR;
}

/** The answer to {@link tradeOn}, worked out once. */
let TRADE_PAIR: boolean | undefined = undefined;

/**
 * Whether this block holds the police station of its quarter.
 *
 * @param blockX - the block, across
 * @param blockY - the same, down
 * @returns true for the one block a quarter, and only that one
 */
function isTheStation(blockX: number, blockY: number): boolean {
  const one = stationIn(quarterOf(blockX, blockY));
  return one !== null && one.x === blockX && one.y === blockY;
}

/**
 * Where the police station of a quarter stands.
 *
 * @param district - which quarter of town
 * @returns the block, or null for a quarter with nothing built in it
 * @remarks
 * **One a quarter, and always one.** The plan used to scatter them like any
 * other sign - three in the city, two of them within four blocks of each other
 * in the same corner, and two whole quarters with none. A police station is
 * not a barber: it is the building one is looking for when something has gone
 * wrong, and one looks for it in the part of town one is standing in.
 *
 * Asked in two passes, so that the answer is a station somewhere sensible
 * rather than wherever the dice happened to fall:
 *
 * 1. **The one the plan drew**, nearest the middle of the quarter. Where the
 *    dice already put a station in this quarter, that one keeps the job.
 * 2. **Otherwise the plainest block nearest the middle.** Only an ordinary
 *    house is taken over - never a bank, a hospital or a night club, because
 *    those are one of a kind too, and trading a landmark for a landmark leaves
 *    the city no better off.
 *
 * Worked out once a quarter and remembered: it is the same city every time,
 * and both the plan and the map ask on every frame.
 */
function stationIn(district: District): Vec | null {
  const known = STATION_BLOCKS.get(district);
  if (known !== undefined) {
    return known;
  }
  const blocks = CITY_TILES / BLOCK_TILES;
  const span = BLOCK_TILES * TILE;
  const middle = districtCentre(district);
  let drawn: Vec | null = null;
  let drawnAway = Number.POSITIVE_INFINITY;
  let plain: Vec | null = null;
  let plainAway = Number.POSITIVE_INFINITY;
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      if (
        !builtBlock(blockX, blockY) ||
        quarterOf(blockX, blockY) !== district ||
        gaoled(blockX, blockY)
      ) {
        continue;
      }
      const away = Math.hypot(
        (blockX + HALF) * span - middle.x,
        (blockY + HALF) * span - middle.y,
      );
      const kind = rawKindAt(blockX, blockY);
      if (kind === "police" && away < drawnAway) {
        drawn = { x: blockX, y: blockY };
        drawnAway = away;
      }
      if (PLAIN_BLOCKS.includes(kind) && away < plainAway) {
        plain = { x: blockX, y: blockY };
        plainAway = away;
      }
    }
  }
  const best = drawn ?? plain;
  STATION_BLOCKS.set(district, best);
  return best;
}

/**
 * Whether a prison stands on this block, anchor or swallowed neighbour.
 *
 * @param blockX - the block, across
 * @param blockY - the same, down
 * @returns true where the wire already has this ground
 * @remarks
 * Asked of the **plan**, not of {@link buildingAt}, and that is the whole
 * reason it exists: `buildingAt` now asks where the station of this quarter is,
 * so anything the station hunt asks back of `buildingAt` closes a ring and the
 * stack runs out. Everything here reads `rawKindAt` and the prison's own
 * footprint test instead, neither of which asks anybody anything.
 */
function gaoled(blockX: number, blockY: number): boolean {
  let under = false;
  for (let down = 0; down < PRISON_BLOCKS; down += 1) {
    for (let across = 0; across < PRISON_BLOCKS; across += 1) {
      const anchorX = blockX - across;
      const anchorY = blockY - down;
      if (
        rawKindAt(anchorX, anchorY) === "prison" &&
        roomForPrison(anchorX, anchorY)
      ) {
        under = true;
      }
    }
  }
  return under;
}

/** Which sorts a station may be built over, having no sign of their own. */
const PLAIN_BLOCKS: readonly BuildingKind[] = [
  "house",
  "double",
  "terrace",
  "tower",
];

/** Where each quarter keeps its station, worked out once. */
const STATION_BLOCKS = new Map<District, Vec | null>();

/** The four quarters, in the order a listing of the stations comes out in. */
const DISTRICTS: readonly District[] = ["grove", "ballas", "beach", "vagos"];

/**
 * The four police stations, and the pavement round each one.
 *
 * @returns one entry a station: where it stands, and where there is room
 *   outside it, in pixels
 * @remarks
 * For whoever has to put something outside one - the patrol cars at the kerb
 * and the men walking about between them. The list is the plan's, not a second
 * copy of it, so a station can never be built in one place and staffed in
 * another.
 *
 * **The ring comes back as candidates, not as places.** This module knows
 * where the plot is and nothing about what is actually on the ground at any
 * one square: a station on the corner of a motorway has no pavement on two of
 * its sides, and a square with a lamp post or somebody's car already on it is
 * no use either. So the ring is offered **south first**, then north, then the
 * two ends - the front of a building being the side one sees - and whoever
 * asks takes the first few that are any good.
 */
export function stations(): readonly CopShop[] {
  const found: CopShop[] = [];
  for (const district of DISTRICTS) {
    const block = stationIn(district);
    if (block === null) {
      continue;
    }
    const plot = builtPlot(block.x, block.y);
    const ring: Vec[] = [];
    for (const row of [plot.bottom + HALF, plot.top - HALF]) {
      for (
        let col = plot.left - YARD_OUT;
        col <= plot.right + YARD_OUT;
        col += YARD_APART
      ) {
        ring.push({ x: col * TILE, y: row * TILE });
      }
    }
    for (const col of [plot.right + HALF, plot.left - HALF]) {
      for (
        let row = plot.top - YARD_OUT;
        row <= plot.bottom + YARD_OUT;
        row += YARD_APART
      ) {
        ring.push({ x: col * TILE, y: row * TILE });
      }
    }
    found.push({
      at: {
        x: ((plot.left + plot.right) / 2) * TILE,
        y: ((plot.top + plot.bottom) / 2) * TILE,
      },
      ring,
    });
  }
  return found;
}

/** A police station: where it stands, and the pavement round it. */
export type CopShop = {
  /** The middle of the building, in pixels. */
  readonly at: Vec;
  /** Spots on the ring outside it, the likeliest first. */
  readonly ring: readonly Vec[];
};

/**
 * How far past the corner of the plot the ring reaches, in squares.
 *
 * @remarks
 * Half a square each way, so that a station whose only kerb is down one side
 * still has somewhere to put four cars and four men. What falls on a road or
 * in a wall is thrown away by whoever asks, so reaching too far costs nothing
 * and reaching too short costs a station its cars.
 */
const YARD_OUT = 0.5;

/** And how far apart two spots on it are. */
const YARD_APART = 0.8;

/**
 * Whether four blocks here can be given over to a prison.
 *
 * @param blockX - the top left block of it, across
 * @param blockY - the same, down
 * @returns true where nothing important runs through the footprint
 * @remarks
 * **A motorway may not end at a prison wall.** A prison stands on four blocks
 * and swallows the street crossing between them, which is fine for an ordinary
 * street - the traffic turns at the wall the way it turns at any dead end -
 * and not fine at all for a motorway, which is the one road in the city one
 * drives the length of. Where the footprint would cover one, an ordinary house
 * goes up instead, the same way a second bank does.
 *
 * It costs prisons: of the three the plan draws, two sit across a motorway and
 * become houses. One is the right number for a landmark anyway - it is the
 * building one is let out of, and always being let out at the same gate is
 * better than being let out at whichever of three happened to be nearest.
 */
function roomForPrison(blockX: number, blockY: number): boolean {
  const plot = prisonPlot(blockX, blockY);
  let room = true;
  for (let col = plot.left; col < plot.right && room; col += 1) {
    room = !motorwayNear(col);
  }
  for (let row = plot.top; row < plot.bottom && room; row += 1) {
    room = !motorwayNear(row);
  }
  return room;
}

/**
 * The sorts there is one of in each quarter rather than one in the city.
 *
 * @remarks
 * A night club and a hospital. Four of each in Los Santos, one to a district,
 * is a night out and somewhere to wake up; one on every other corner is a
 * shopping centre, and nobody arranges to meet anybody at the third club on
 * the left. It is the same thinning as {@link ONE_ONLY}, counted per quarter
 * instead of per city - the four districts are what the gangs are fought over,
 * so they are the size of thing a place of one's own belongs to.
 *
 * **A hospital is a landmark, not a chain.** It is the building one is let out
 * of after a death, so one ends up looking at it more often than at anything
 * else in town - and a dozen of them meant the one that took you in was
 * whichever happened to be nearest, which is to say a different one every
 * time and none of them ever learnt. Four, one to a quarter, is the same
 * arrangement the police stations have.
 */
const ONE_PER_QUARTER: readonly BuildingKind[] = ["club", "hospital", "fire"];

/** Whether this block is the one of its sort in its own quarter. */
function isTheLocalOne(
  kind: BuildingKind,
  blockX: number,
  blockY: number,
): boolean {
  const one = theOneIn(kind, quarterOf(blockX, blockY));
  return one !== null && one.x === blockX && one.y === blockY;
}

/** Which quarter of town a block stands in. */
function quarterOf(blockX: number, blockY: number): District {
  const span = BLOCK_TILES * TILE;
  return districtAt((blockX + HALF) * span, (blockY + HALF) * span);
}

/**
 * Which block of a quarter keeps it: the one nearest the middle of that
 * quarter.
 *
 * @param kind - one of {@link ONE_PER_QUARTER}
 * @param district - which quarter of town
 * @returns the block, or null where the plan drew none in it at all
 */
function theOneIn(kind: BuildingKind, district: District): Vec | null {
  const key = `${kind}|${district}`;
  const known = QUARTER_BLOCKS.get(key);
  if (known !== undefined) {
    return known;
  }
  const blocks = CITY_TILES / BLOCK_TILES;
  const span = BLOCK_TILES * TILE;
  const middle = districtCentre(district);
  let best: Vec | null = null;
  let bestAway = Number.POSITIVE_INFINITY;
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      const away = Math.hypot(
        (blockX + HALF) * span - middle.x,
        (blockY + HALF) * span - middle.y,
      );
      if (
        rawKindAt(blockX, blockY) === kind &&
        quarterOf(blockX, blockY) === district &&
        builtBlock(blockX, blockY) &&
        away < bestAway
      ) {
        best = { x: blockX, y: blockY };
        bestAway = away;
      }
    }
  }
  // **And a quarter that the dice gave none of still gets one**, if it is the
  // sort of building a quarter cannot do without: the plainest block nearest
  // its middle, exactly as the police station is placed. A district with no
  // hospital in it is a district one is carried out of into somebody else's.
  //
  // Never the station's own block - that one is claimed last in
  // {@link buildingAt} and would simply overrule this - and never a block the
  // dice gave a name to, because thinning is allowed to take a landmark away
  // and is not allowed to invent one on top of another.
  //
  // **And never on top of the one before it.** The sorts in {@link ONE_EACH}
  // are asked one after the other, and every one of them the dice skipped
  // falls back to the plainest block nearest the middle - which is the *same*
  // block for all of them. The beach quarter had a hospital and no fire
  // station at all: both had claimed block four-eleven, and `buildingAt`
  // takes the first sort that claims one. So each fills in around the ones
  // asked before it.
  const posted = stationIn(district);
  const wanted = ONE_EACH.indexOf(kind);
  const already =
    wanted < 0
      ? []
      : ONE_EACH.slice(0, wanted).map((one) => theOneIn(one, district));
  const filled =
    best ?? (wanted < 0 ? null : plainestIn(district, [posted, ...already]));
  QUARTER_BLOCKS.set(key, filled);
  return filled;
}

/**
 * Whether the plan ends up putting ordinary housing on this block.
 *
 * @param blockX - the block, across
 * @param blockY - the same, down
 * @returns true where a house goes up, drawn as one or thinned into one
 * @remarks
 * **Not the same question as "did the dice say house".** Most of the plain
 * blocks in this city were never drawn plain: they are the second bank, the
 * fourth night club, the police station of a quarter that already has one -
 * landmarks that {@link buildingAt} thins back into housing. Asked the narrow
 * way, the beach quarter looked as though it had nowhere to put a hospital,
 * when what it has is three blocks and one of them is a house.
 *
 * It is the thinning test out of `buildingAt`, with the sorts in
 * {@link ONE_EACH} left out. Those are what ask this, through
 * {@link theOneIn}, and a ring between the two runs the stack out.
 */
function housing(blockX: number, blockY: number): boolean {
  const drawn = rawKindAt(blockX, blockY);
  return (
    PLAIN_BLOCKS.includes(drawn) ||
    (ONE_ONLY.includes(drawn) && !isTheOne(drawn, blockX, blockY)) ||
    (ONE_PER_QUARTER.includes(drawn) &&
      !ONE_EACH.includes(drawn) &&
      !isTheLocalOne(drawn, blockX, blockY)) ||
    (drawn === "prison" && !roomForPrison(blockX, blockY)) ||
    (drawn === "police" && !isTheStation(blockX, blockY))
  );
}

/**
 * The sorts every quarter has one of, whatever its own dice said.
 *
 * @remarks
 * A club a quarter may do without - one walks to the next one. The hospital is
 * the building one is let out of after a death, so a quarter without one hands
 * its dead to the neighbours.
 */
const ONE_EACH: readonly BuildingKind[] = ["hospital", "fire"];

/**
 * The plainest block nearest the middle of a quarter.
 *
 * @param district - which quarter of town
 * @param taken - blocks already spoken for; nulls in it are ignored
 * @returns a block of ordinary housing, or null if the quarter has none
 * @remarks
 * Reads the **plan** and nothing else - `rawKindAt`, `builtBlock`, the
 * prison's own footprint - so that nothing here ever asks `buildingAt` what
 * is on a block. `buildingAt` is what asks this, and a ring between the two
 * runs the stack out; it has done twice before.
 */
function plainestIn(
  district: District,
  taken: readonly (Vec | null)[],
): Vec | null {
  const blocks = CITY_TILES / BLOCK_TILES;
  const span = BLOCK_TILES * TILE;
  const middle = districtCentre(district);
  let plain: Vec | null = null;
  let plainAway = Number.POSITIVE_INFINITY;
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      const away = Math.hypot(
        (blockX + HALF) * span - middle.x,
        (blockY + HALF) * span - middle.y,
      );
      const free = !taken.some(
        (one) => one !== null && one.x === blockX && one.y === blockY,
      );
      if (
        free &&
        builtBlock(blockX, blockY) &&
        !gaoled(blockX, blockY) &&
        quarterOf(blockX, blockY) === district &&
        housing(blockX, blockY) &&
        away < plainAway
      ) {
        plain = { x: blockX, y: blockY };
        plainAway = away;
      }
    }
  }
  return plain;
}

/** The answers to {@link theOneIn}, once each. */
const QUARTER_BLOCKS = new Map<string, Vec | null>();

/**
 * The two there is exactly one of in Los Santos.
 *
 * @remarks
 * A bank on every third corner is a cash machine; one bank is a place. The same
 * goes double for the printing works, which is the biggest job in the city and
 * has to be a landmark rather than a chain. Wherever else the plan would have
 * put one, an ordinary house goes up instead - so the city keeps its shape and
 * only the sign over one door is different.
 *
 * Both are marked on the map, because a single building in four thousand blocks
 * that one has to stumble over is a building nobody ever finds.
 */
const ONE_ONLY: readonly BuildingKind[] = ["bank", "mint"];

/**
 * Whether a block is a green one rather than houses.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns true where a park goes
 * @remarks
 * Every third block on a rhythm, so that the city has lungs without anybody
 * having to place them. It lives here rather than in ./city because it answers
 * the same question the table above does - what is in this block - and the two
 * must not be able to disagree. The floor asks it to lay out grass; the sign
 * over the door asks it because a name on an empty lawn is a name on nothing.
 */
export function greenBlock(blockX: number, blockY: number): boolean {
  return (
    (blockX + blockY * 2) % PARK_EVERY === 0 && (blockX + blockY) % 2 === 0
  );
}

/** Every third block is a park rather than houses, on this rhythm. */
const PARK_EVERY = 3;

/**
 * Whether a square is on land at all.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true inside one of the three cities
 * @remarks
 * The floor asks it to decide between tarmac and sea; the table above asks it
 * because a block in the water holds nothing - and a night club out there
 * would put its whole queue in the sea.
 */
export function inCity(col: number, row: number): boolean {
  // The airfield is inside Los Santos and is not part of it: a terminal with
  // a row of terraced houses down the middle of the runway is not an airport.
  const flying =
    col >= AIRPORT.left &&
    col <= AIRPORT.right &&
    row >= AIRPORT.top &&
    row <= AIRPORT.bottom;
  return (
    !flying &&
    ISLANDS.some(
      (isle) =>
        col >= isle.left &&
        col <= isle.right &&
        row >= isle.top &&
        row <= isle.bottom,
    )
  );
}

/**
 * Whether anything is built on a block at all.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns false for the parks and for the sand and water along the south edge
 * @remarks
 * The plan deals a sort of building to every block in the grid, including the
 * ones that turn out to be a lawn or a beach. Whoever wants a door has to ask
 * this first: a quarter of the addresses in town are otherwise a name on a
 * piece of grass, and standing in front of one used to open a gun shop.
 */
export function builtBlock(blockX: number, blockY: number): boolean {
  // The plot, not the whole block. A block is ten squares across and the town
  // it belongs to does not end on a multiple of ten - so asking about the
  // corners of the block threw away every block along the edge of every city,
  // which with blocks this size was most of them.
  const plot = builtPlot(blockX, blockY);
  const dry =
    inCity(plot.left, plot.top) && inCity(plot.right - 1, plot.bottom - 1);
  return !greenBlock(blockX, blockY) && dry && !crossed(blockX, blockY);
}

/**
 * Whether anything runs through a block.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns true where the railway, a country road or a platform takes a bite
 *   out of the plot
 * @remarks
 * **Nothing in this city is cut in half.** A house is drawn as a box over the
 * whole plot, whatever the floor underneath it happens to say - so where a
 * railway curve or a trunk road crossed a plot, the tarmac was drawn and then a
 * front room was drawn on top of it. That reads exactly as what it is: a
 * building sawn through.
 *
 * The answer is the one a planning office gives. Land something runs through is
 * not built on; it stays open, and the city keeps its shape around it. The
 * curves of the railway leave a green swathe through the corner of two
 * districts, which is what a railway leaves in a real one.
 *
 * Remembered per block, because the picture asks it of every block on the
 * screen on every frame and the country roads are a thousand points.
 */
function crossed(blockX: number, blockY: number): boolean {
  const key = cellKey(blockX, blockY);
  const known = CROSSED.get(key);
  let cut: boolean;
  if (known === undefined) {
    cut = anythingThrough(blockX, blockY);
    CROSSED.set(key, cut);
  } else {
    cut = known;
  }
  return cut;
}

/** The answers to that, one per block. */
const CROSSED = new Map<number, boolean>();

/** How far outside the plot something still counts as going through it. */
const PLOT_EDGE = 1;

/** The same question, actually asked. */
function anythingThrough(blockX: number, blockY: number): boolean {
  const box = builtPlot(blockX, blockY);
  let hit = false;
  // A square wider than the plot on every side. What is drawn is wider than
  // what is laid: a country road is painted as a smooth line a little broader
  // than its own band of squares, so that the staircase underneath disappears -
  // and a road that only clips the pavement is still painted up against the
  // front wall of the house. This margin is that difference.
  for (
    let row = box.top - PLOT_EDGE;
    row < box.bottom + PLOT_EDGE && !hit;
    row += 1
  ) {
    for (
      let col = box.left - PLOT_EDGE;
      col < box.right + PLOT_EDGE && !hit;
      col += 1
    ) {
      // The street grid does not count - every plot in town has a road on two
      // sides of it, and that is what a street is. Only the things that cut
      // across the grid do.
      hit =
        onRail(col, row) ||
        onRoute(col, row) ||
        onTrack(col, row) ||
        onPlatform(col, row);
    }
  }
  return hit;
}

/**
 * Whether a square is part of a supermarket car park.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true on the tarmac
 */
function onCarPark(col: number, row: number): boolean {
  const blockX = Math.floor(col / BLOCK_TILES);
  const blockY = Math.floor(row / BLOCK_TILES);
  const lot = carPark(blockX, blockY);
  let tarmac = false;
  if (lot !== null) {
    const plot = builtPlot(blockX, blockY);
    const inside =
      col >= plot.left &&
      col < plot.right &&
      row >= plot.top &&
      row < plot.bottom;
    tarmac =
      !inside &&
      col >= lot.left &&
      col < lot.right &&
      row >= lot.top &&
      row < lot.bottom;
  }
  return tarmac;
}

/**
 * The car park of the supermarket on a block, in squares.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns the tarmac, or null where the block holds anything else
 * @remarks
 * **A supermarket is a shed with a car park round it.** Nobody walks to one.
 * So the ring of pavement every other block has becomes tarmac here, all the
 * way round the shop: room for a dozen cars nose in to the wall, and the one
 * place in this city where a person on foot and a parked car have anything to
 * do with each other. The shop itself keeps its whole plot - a supermarket cut
 * in half to make room for the cars is a corner shop.
 */
export function carPark(
  blockX: number,
  blockY: number,
): {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
} | null {
  let lot = null;
  if (builtBlock(blockX, blockY) && marketBlock(blockX, blockY)) {
    // Everything of the block that is not tarmac: the pavement ring and what
    // would have been built on it. Asked of the plan rather than counted off
    // the edge of the block, because not every block gives the same number of
    // squares to the streets round it - see {@link handsBack}.
    const across = openSpan(blockX, true);
    const down = openSpan(blockY, false);
    lot = {
      left: blockX * BLOCK_TILES + across.from,
      top: blockY * BLOCK_TILES + down.from,
      right: blockX * BLOCK_TILES + across.to + 1,
      bottom: blockY * BLOCK_TILES + down.to + 1,
    };
  }
  return lot;
}

/** Whether the block holds a supermarket. */
function marketBlock(blockX: number, blockY: number): boolean {
  return buildingAt(blockX, blockY).kind === "market";
}

/**
 * Every parking bay of every supermarket in the city.
 *
 * @returns where each bay is, in pixels, and which way a car in it points
 * @remarks
 * Asked once when the city is set up: some of the bays get a car, and the
 * shoppers are put on the rest of them.
 */
export function carParks(): readonly {
  readonly at: Vec;
  readonly angle: number;
}[] {
  const blocks = CITY_TILES / BLOCK_TILES;
  const found: { at: Vec; angle: number }[] = [];
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      const lot = carPark(blockX, blockY);
      if (lot !== null) {
        const plot = builtPlot(blockX, blockY);
        for (let row = lot.top; row < lot.bottom; row += 1) {
          for (let col = lot.left; col < lot.right; col += 1) {
            const inside =
              col >= plot.left &&
              col < plot.right &&
              row >= plot.top &&
              row < plot.bottom;
            if (!inside) {
              // Nose in to the wall, square to it. Pointing at the middle of
              // the shop instead would stand the four corner bays at
              // forty five degrees, and a car park where the corners are
              // parked askew looks like a car park after an earthquake.
              const above = row < plot.top;
              const below = row >= plot.bottom;
              const left = col < plot.left;
              found.push({
                at: { x: (col + HALF) * TILE, y: (row + HALF) * TILE },
                angle: above
                  ? QUARTER
                  : below
                    ? -QUARTER
                    : left
                      ? 0
                      : HALF_TURN,
              });
            }
          }
        }
      }
    }
  }
  return found;
}

/**
 * Whether a square is part of a station forecourt.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true on the concrete
 * @remarks
 * A platform is drawn flat on the floor beside the track, and it is seven
 * squares long - long enough to reach into the plot next door. Counting it as
 * something that runs through a block is what keeps the station from being
 * built into somebody front room, which is exactly where one of them was.
 */
function onPlatform(col: number, row: number): boolean {
  return STATIONS.some((stop) => {
    const box = platformBox(stop);
    return (
      col + HALF >= box.left &&
      col + HALF <= box.right &&
      row + HALF >= box.top &&
      row + HALF <= box.bottom
    );
  });
}

/**
 * Where the concrete of one platform lies, in squares.
 *
 * @param stop - the station
 * @returns its four sides
 * @remarks
 * Beside the track rather than on it, and along it: which way along comes from
 * the rail itself, so a platform on a curve still lies the right way round.
 * The picture draws this rectangle and the plan keeps it clear of houses, so
 * the two can never disagree about how much room a station takes.
 */
export function platformBox(stop: Station): {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
} {
  const flat = Math.abs(Math.cos(railAngle(stop.col, stop.row))) > HALF;
  const x = stop.col + HALF;
  const y = stop.row + HALF;
  const long = flat ? PLATFORM_LONG : PLATFORM_WIDE * 2;
  const deep = flat ? PLATFORM_WIDE * 2 : PLATFORM_LONG;
  const middleX = x + (flat ? 0 : PLATFORM_WIDE);
  const middleY = y + (flat ? PLATFORM_WIDE : 0);
  return {
    left: middleX - long / 2,
    right: middleX + long / 2,
    top: middleY - deep / 2,
    bottom: middleY + deep / 2,
  };
}

/** How long a platform is, in squares. */
const PLATFORM_LONG = 7;

/** And how far it stands off the middle of the track. */
const PLATFORM_WIDE = 1.6;

/** What the plan would put on a block, before the two rare ones are thinned. */
function rawKindAt(blockX: number, blockY: number): BuildingKind {
  return blockAt(roll(blockY + SHIFT_DOWN, blockX - SHIFT_ACROSS)).kind;
}

/** Whether this block is the one that keeps its sign. */
function isTheOne(kind: BuildingKind, blockX: number, blockY: number): boolean {
  const one = theOne(kind);
  return one !== null && one.x === blockX && one.y === blockY;
}

/**
 * Which block keeps it: the one nearest the middle of town.
 *
 * @param kind - one of {@link ONE_ONLY}
 * @returns the block, or null if the plan drew none at all
 * @remarks
 * Nearest the middle rather than first in reading order, so that the one bank
 * in the city is somewhere one passes anyway - and only where there is anything
 * built at all: the plan draws blocks for the parks and the beach as well, and
 * a sign over a door needs a door under it. Worked out once and remembered; it
 * is the same city every time, and the map asks on every frame.
 */
function theOne(kind: BuildingKind): Vec | null {
  const known = ONLY_BLOCKS.get(kind);
  if (known !== undefined) {
    return known;
  }
  const blocks = CITY_TILES / BLOCK_TILES;
  const middle = blocks / 2;
  let best: Vec | null = null;
  let bestAway = Number.POSITIVE_INFINITY;
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      const away = Math.hypot(blockX - middle, blockY - middle);
      if (
        rawKindAt(blockX, blockY) === kind &&
        builtBlock(blockX, blockY) &&
        away < bestAway
      ) {
        best = { x: blockX, y: blockY };
        bestAway = away;
      }
    }
  }
  ONLY_BLOCKS.set(kind, best);
  return best;
}

/** The answers to {@link theOne}, once each. */
const ONLY_BLOCKS = new Map<BuildingKind, Vec | null>();

/* The block is asked twice about itself - once for what it is, once for how
   tall it builds - and the two answers must not be the same draw. Shifting the
   coordinates before the hash is what pulls them apart. */

/** How far the row is shifted before it is hashed. */
const SHIFT_DOWN = 41;

/** And the column. */
const SHIFT_ACROSS = 17;

/**
 * A number between 0 and 1 that is always the same for the same pair.
 *
 * @param one - any number
 * @param two - any other
 * @returns that pair's own private dice roll
 */
function roll(one: number, two: number): number {
  const spun = Math.sin(one * SPIN_ONE + two * SPIN_TWO) * SPIN_WIDE;
  return spun - Math.floor(spun);
}

/* The three numbers of the usual one-line hash: two to mix the coordinates
   with, one to blow the result up before the fractional part is taken. They
   mean nothing on their own - only that the same pair always lands in the same
   place. */

/** How much the first coordinate is turned by. */
const SPIN_ONE = 12.9898;

/** And the second. */
const SPIN_TWO = 78.233;

/** How far the sine is stretched before the decimals are kept. */
const SPIN_WIDE = 43758.5453;
