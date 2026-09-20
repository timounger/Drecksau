/**
 * Who walks the streets, and what each of them is like.
 *
 * @module
 * @remarks
 * Six sorts of person, one row each: how fast they walk, how much they take
 * before they go down, whether they carry anything, and whose side they are on.
 * The engine reads the row; only two questions are asked about the kind itself,
 * and both are about gangs.
 *
 * The two gangs are the reason people have a side at all. Green shirts are
 * yours and go for orange; orange shirts go for you and for green. Everybody
 * else keeps walking and, when it gets loud, runs.
 */

import { inTheGame, type WeaponKind } from "./weapons";

/** What sort of person somebody is. */
export type PersonKind =
  "bum" | "plain" | "posh" | "night" | "mine" | "rival" | "convict" | "robber";

/**
 * What one of them has in his pocket, in euros.
 *
 * @remarks
 * Whoever goes down leaves it lying there. It is not a reward for killing -
 * the police come either way and the money is small - it is what makes a body
 * a thing that happened rather than a thing that vanished. The beggar has
 * nothing, which is what makes him a beggar, and policemen are not in this
 * table at all: they carry a warrant card and a radio.
 */
export const PURSE: Readonly<Record<PersonKind, number>> = {
  bum: 0,
  plain: 60,
  night: 120,
  posh: 260,
  mine: 90,
  rival: 110,
  robber: 180,
  convict: 40,
};

/** Whose side somebody is on, if anybody's. */
export type Side = "none" | "mine" | "rival";

/** One sort of person, as numbers. */
export type Kind = {
  readonly kind: PersonKind;
  /** What they are called, for the log. */
  readonly name: string;
  /** How fast they stroll, in pixels a second. */
  readonly walk: number;
  /** How much they take before they go down. */
  readonly health: number;
  /** Whether they carry a gun and use it. */
  readonly armed: boolean;
  /** Whose side they are on. */
  readonly side: Side;
  /**
   * Whether one of them may be sitting cross-legged against a wall.
   *
   * @remarks
   * They used to lie asleep in the middle of the pavement, which read as a
   * corpse rather than as a man having a bad year. Sitting against a wall is
   * what one actually sees, and it puts them where they belong: at the edge,
   * out of the way of everybody who is going somewhere.
   */
  readonly sits: boolean;
  /** Whether one of them may have a dog with them. */
  readonly walksDogs: boolean;
};

/** Everybody there is. */
export const KINDS: Readonly<Record<PersonKind, Kind>> = {
  bum: {
    kind: "bum",
    name: "Penner",
    // Half the pace of anybody with somewhere to be. It is the one thing that
    // tells them apart from a passer-by at a glance, from any distance, without
    // looking at the coat.
    walk: 14,
    health: 10,
    armed: false,
    side: "none",
    sits: true,
    walksDogs: true,
  },
  plain: {
    kind: "plain",
    name: "Passant",
    walk: 42,
    health: 10,
    armed: false,
    side: "none",
    sits: false,
    walksDogs: true,
  },
  posh: {
    kind: "posh",
    name: "feiner Herr",
    walk: 46,
    health: 10,
    armed: false,
    side: "none",
    sits: false,
    walksDogs: true,
  },
  night: {
    kind: "night",
    name: "Nachtschwärmerin",
    walk: 38,
    health: 10,
    armed: false,
    side: "none",
    sits: false,
    walksDogs: false,
  },
  mine: {
    kind: "mine",
    name: "Bandenmitglied",
    walk: 48,
    health: 40,
    armed: true,
    side: "mine",
    sits: false,
    walksDogs: false,
  },
  rival: {
    kind: "rival",
    name: "gegnerische Bande",
    walk: 48,
    health: 40,
    armed: true,
    side: "rival",
    sits: false,
    walksDogs: false,
  },
  robber: {
    kind: "robber",
    name: "Maskierter",
    // The same pace as the men who came over a prison wall, and for the same
    // reason: whoever has just come up out of a tunnel is not strolling.
    walk: 54,
    health: 40,
    // They went in armed and they came out armed - but what they are doing is
    // running, and a robber who stopped to fight would not be running.
    armed: false,
    side: "none",
    sits: false,
    walksDogs: false,
  },
  convict: {
    kind: "convict",
    name: "Ausbrecher",
    // The fastest walk in the city, because nobody in it has a better reason
    // to be somewhere else. They are not in IN_THE_STREET: an escaped man is
    // not a sort of passer-by the city deals out, he is what comes out of a
    // hole in a prison wall.
    walk: 62,
    health: 20,
    armed: false,
    side: "none",
    sits: false,
    walksDogs: false,
  },
};

/**
 * Who is out there, and in what proportion.
 *
 * @remarks
 * Drawn from evenly, so the list itself is the mix: mostly ordinary people,
 * a fair few of both gangs so that a street corner can turn into a fight
 * without the player, and a handful of everybody else.
 */
export const IN_THE_STREET: readonly PersonKind[] = [
  "plain",
  "plain",
  "plain",
  "plain",
  "plain",
  "bum",
  "posh",
  "posh",
  "posh",
  "night",
];

/**
 * How many corners each gang holds.
 *
 * @remarks
 * A handful, and no more. Gang members used to be drawn from the same bag as
 * everybody else, which put a pair of armed men on every second pavement -
 * that is not a gang, that is a uniform. Now each side holds a few corners,
 * stands about them in groups, and the rest of the city belongs to people who
 * are simply out.
 */
export const GANG_CORNERS = 3;

/** How many stand about one corner. */
export const GANG_CREW = 4;

/** How far from their corner they drift before heading back, in pixels. */
export const GANG_ROAM = 70;

/**
 * How many of the night crowd stand outside each night club.
 *
 * @remarks
 * They have a corner in the same way the gangs do - the club door - and drift
 * about it rather than wandering off. A night club with nobody in front of it
 * is a purple roof with a sign on it.
 */
export const CLUB_CROWD = 5;

/** How far from the club door they drift, in pixels. */
export const CLUB_ROAM = 55;

/**
 * How many of the down-and-outs hang about outside each supermarket.
 *
 * @remarks
 * The same idea as the club door and the gang corner: somewhere to be, rather
 * than an even sprinkling over the whole city. A supermarket is where the
 * empties and the small change are, so that is where they gather - and it
 * gives the block a character that a row of shop windows never would.
 *
 * The street mix carries fewer of them now to pay for it. Otherwise every
 * pavement in town would still have one and the shop door would mean nothing.
 */
export const MARKET_CROWD = 5;

/** How far from the shop door they drift, in pixels. */
export const MARKET_ROAM = 60;

/**
 * How many of the shop crowd are sitting against the wall rather than walking.
 *
 * @remarks
 * Most of them. A row of men sitting along the front of a supermarket is the
 * picture; two of them shuffling about the door is what keeps it from being a
 * row of statues.
 */
export const SITTING_SHOP = 0.7;

/**
 * And how many of the down-and-outs anywhere else are.
 *
 * @remarks
 * Few. Somebody sitting against a wall three streets from any shop is a
 * detail; one on every pavement would take the meaning out of the shop front.
 */
export const SITTING_STREET = 0.12;

/** How far a gang member starts caring about somebody, in pixels. */
export const GANG_RANGE = 240;

/** How near a gang member likes to stand while shooting. */
export const GANG_HOLD = 120;

/** Seconds between two shots from a gang member. */
export const GANG_RELOAD = 1.4;

/** How fast a gang bullet travels. */
export const GANG_SPEED = 600;

/** How many stars shooting at your own gang's enemies is worth: none. */
export const GANG_FREE = 0;

/**
 * What a policeman may be carrying, drawn from evenly.
 *
 * @remarks
 * Mostly a pistol, sometimes a baton, now and then the machine gun - and
 * whichever it is falls out of his hand when he goes down. That is where most
 * of the heavy weaponry in this city comes from now that so little of it lies
 * about: you take it off somebody.
 */
export const COP_ARMS: readonly WeaponKind[] = (
  ["baton", "pistol", "pistol", "pistol", "mg"] as const
).filter(inTheGame);

/**
 * And a gang member: the knuckleduster instead of the baton.
 *
 * @remarks
 * Both lists are sieved through {@link inTheGame}, so a weapon that has been
 * taken out of the city is not quietly carried back into it by the people who
 * live there - and putting it back in is still one word in one place.
 */
export const GANG_ARMS: readonly WeaponKind[] = (
  ["knuckles", "pistol", "pistol", "pistol", "mg"] as const
).filter(inTheGame);

/**
 * How much faster than their own stroll a frightened person moves.
 *
 * @remarks
 * A share of their walk rather than one speed for everybody: the down-and-out
 * who shuffles at half pace shuffles away at half pace too. One flat running
 * speed had him sprinting like an athlete the moment a shot went off, which
 * undid the whole point of giving him a slow walk.
 */
export const PANIC = 2.6;
