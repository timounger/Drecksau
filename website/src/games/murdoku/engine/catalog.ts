/**
 * Everything that can stand on a field, and everything a field can be.
 *
 * @module
 * @remarks
 * One catalog for all cases, so a chair looks and behaves the same in the
 * art school as in the zoo. A case names the things it uses by id in its
 * legend; one it needs that is not here, it brings itself (`extraThings`).
 *
 * The kinds are what the clues ask about: "beside an animal" is any thing
 * with the kind "animal", "sitting" is standing on a "seat".
 */
import type { GroundDef, ThingDef } from "./types";

/** The things, by id. */
export const THINGS: Readonly<Record<string, ThingDef>> = {
  // Can be stood on.
  house: { name: "Haus", emoji: "\u{1F3E0}", standable: true },
  boat: { name: "Boot", emoji: "\u{1F6F6}", standable: true },
  car: { name: "Auto", emoji: "\u{1F697}", standable: true },
  oilSlick: { name: "Ölfleck", emoji: "\u{26AB}", standable: true },
  chair: {
    name: "Stuhl",
    emoji: "\u{1FA91}",
    standable: true,
    kinds: ["seat"],
  },
  bed: { name: "Bett", emoji: "\u{1F6CF}️", standable: true },
  mud: { name: "Schlammpfütze", emoji: "\u{1F7E4}", standable: true },
  painting: { name: "Gerahmtes Bild", emoji: "\u{1F5BC}️", standable: true },
  bench: { name: "Bank", emoji: "\u{1FA91}", standable: true, kinds: ["seat"] },
  sofa: { name: "Sofa", emoji: "\u{1F6CB}️", standable: true, kinds: ["seat"] },
  rug: { name: "Teppich", emoji: "\u{1F7E8}", standable: true },
  // Plants.
  tree: {
    name: "Baum",
    emoji: "\u{1F332}",
    standable: false,
    kinds: ["plant", "tree"],
  },
  palm: {
    name: "Palme",
    emoji: "\u{1F334}",
    standable: false,
    kinds: ["plant", "tree"],
  },
  shrub: {
    name: "Strauch",
    emoji: "\u{1F33F}",
    standable: false,
    kinds: ["plant"],
  },
  cactus: {
    name: "Kaktus",
    emoji: "\u{1F335}",
    standable: false,
    kinds: ["plant"],
  },
  plant: {
    name: "Pflanze",
    emoji: "\u{1FAB4}",
    standable: false,
    kinds: ["plant"],
  },
  flowers: {
    name: "Blumen",
    emoji: "\u{1F337}",
    standable: false,
    kinds: ["plant"],
  },
  // Animals.
  shark: {
    name: "Hai",
    emoji: "\u{1F988}",
    standable: false,
    kinds: ["animal"],
  },
  boar: {
    name: "Wildschwein",
    emoji: "\u{1F417}",
    standable: false,
    kinds: ["animal"],
  },
  bear: {
    name: "Bär",
    emoji: "\u{1F43B}",
    standable: false,
    kinds: ["animal"],
  },
  lion: {
    name: "Löwe",
    emoji: "\u{1F981}",
    standable: false,
    kinds: ["animal"],
  },
  penguin: {
    name: "Pinguin",
    emoji: "\u{1F427}",
    standable: false,
    kinds: ["animal"],
  },
  crocodile: {
    name: "Krokodil",
    emoji: "\u{1F40A}",
    standable: false,
    kinds: ["animal"],
  },
  elephant: {
    name: "Elefant",
    emoji: "\u{1F418}",
    standable: false,
    kinds: ["animal"],
  },
  dog: {
    name: "Hund",
    emoji: "\u{1F415}",
    standable: false,
    kinds: ["animal"],
  },
  cat: {
    name: "Katze",
    emoji: "\u{1F408}",
    standable: false,
    kinds: ["animal"],
  },
  fish: {
    name: "Fisch",
    emoji: "\u{1F41F}",
    standable: false,
    kinds: ["animal"],
  },
  // Rocks and the like.
  boulder: { name: "Felsen", emoji: "\u{1FAA8}", standable: false },
  rubble: { name: "Schutt", emoji: "\u{1F9F1}", standable: false },
  // Furniture and objects.
  table: {
    name: "Tisch",
    emoji: "\u{1F7EB}",
    standable: false,
    kinds: ["furniture"],
  },
  shelf: {
    name: "Regal",
    emoji: "\u{1F4DA}",
    standable: false,
    kinds: ["furniture"],
  },
  tv: { name: "Fernseher", emoji: "\u{1F4FA}", standable: false },
  box: { name: "Karton", emoji: "\u{1F4E6}", standable: false },
  crate: { name: "Kiste", emoji: "\u{1F5C3}️", standable: false },
  barrel: { name: "Fass", emoji: "\u{1F6E2}️", standable: false },
  camera: { name: "Kamera", emoji: "\u{1F3A5}", standable: false },
  catapult: { name: "Katapult", emoji: "\u{1F3F9}", standable: false },
  easel: { name: "Staffelei", emoji: "\u{1F3A8}", standable: false },
  statue: { name: "Statue", emoji: "\u{1F5FF}", standable: false },
};

/** The grounds, by id. */
export const GROUNDS: Readonly<Record<string, GroundDef>> = {
  grass: { name: "Wiese", colour: "#bfe8a6", pattern: "grass" },
  water: { name: "Wasser", colour: "#a7d3f2", pattern: "waves" },
  sand: { name: "Sand", colour: "#f6edc8", pattern: "sand" },
  floor: { name: "Boden", colour: "#e7e5e4", pattern: "floor" },
  carpet: { name: "Teppich", colour: "#f5deb3", pattern: "none" },
  path: { name: "Weg", colour: "#e8d2b0", pattern: "sand" },
  stone: { name: "Stein", colour: "#d6d3d1", pattern: "floor" },
  snow: { name: "Schnee", colour: "#f1f5f9", pattern: "none" },
  pond: {
    name: "Teich",
    colour: "#7fbfe8",
    pattern: "waves",
    standable: false,
  },
};
