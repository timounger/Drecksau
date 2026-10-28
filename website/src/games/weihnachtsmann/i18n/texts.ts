/**
 * Every German text of the Weihnachtsmann game: the screen, the names and
 * abilities of the characters and animals, and what they say.
 *
 * @module
 */
import type {
  AnimalId,
  AreaId,
  CharacterId,
  ToyKind,
} from "@/games/weihnachtsmann/engine/types";

/** Texts of the game screen. */
export const WM_TEXTS = {
  // The soft hyphen lets the long word break on a phone instead of running
  // under the buttons beside it.
  title: "Weihnachts­mann & Co. KG",
  subtitle:
    "Lauf mit Weihnachtsmann, Elfen, Balbo und Rudolf durch den Schnee.",
  fullscreen: "Vollbild",
  fullscreenExit: "Vollbild beenden",
  leaveGate: "Minispiel verlassen",
  leaveGateHint: "oder Esc - zurück zur Karte, jederzeit",
  statistics: "Statistik",
  reset: "Neu aufstellen",
  resetTitle: "Alle zurück an ihren Startplatz",
  barLabel: "Figur wählen",
  barHint: "Taste",
  flying: "fliegt",
  animalTitle: "In welches Tier soll Jordi sich verwandeln?",
  animalHint: "1-6, Pfeile + Leertaste, Klick - Esc bricht ab",
  animalCancel: "Abbrechen",
  asAnimal: "als",
  controlsTitle: "Steuerung",
  controlsMove: "Laufen: Pfeiltasten / W A S D",
  controlsSwitch: "Figur: 1-8, Tab, Q / E oder Klick",
  controlsAbility: "Fähigkeit: Leertaste / F",
  controlsTransform: "Jordi verwandeln: T",
  controlsTalk: "Sprechen / Benutzen: R",
  controlsDoor: "Tür: hineinlaufen",
  useKey: "R",
  controlsTouch: "Handy: Stick und Knöpfe, Figur antippen",
  touchHelp:
    "Links ziehen: laufen - Fähigkeit, Benutzen/Sprechen, Nächste: Knöpfe - Figur unten oder im Bild antippen - Hinein: an Tür und Türchen",
  touchStick: "Laufen",
  touchEnter: "Hinein",
  touchUse: "Benutzen",
  touchRotate: "Tipp: Handy quer halten - dann wird das Bild größer.",
  animalHintTouch: "Tier antippen",
  touchAbility: "Fähigkeit",
  touchTalk: "Sprechen",
  touchNext: "Nächste",
  touchAction: "Aktion",
  touchAlt: "Taste 2",
  touchLeave: "Zurück",
  controlsGate: "Türchen: hineinlaufen (Pfeil hoch)",
  gateLabel: "Türchen",
  gateEnter: "Pfeil hoch: hinein",
  gateDone: "Geschafft! Nochmal spielen?",
  gateLockedFrom: "öffnet erst am",
  december: "Dezember",
  gateLockedHint: "Noch verschlossen - öffnet am",
  progressLocked: "Ab 1. Dezember öffnet jeden Tag ein Türchen",
  progressToday: "Heute offen bis Türchen",
  progressLabel: "Adventskalender",
  progressCount: "Türchen",
  progressNext: "Als Nächstes: Türchen",
  progressAll: "Alle Türchen geschafft - frohe Weihnachten!",
} as const;

/** A character's name and what it can do, for the selection bar. */
export type CharacterTexts = {
  readonly name: string;
  readonly ability: string;
  /** What it says on the talk key. */
  readonly lines: readonly string[];
  /** What it says on the ability key when it has none. */
  readonly noAbility: readonly string[];
};

/** Names, abilities and lines of the eight characters. */
export const CHARACTER_TEXTS: Readonly<Record<CharacterId, CharacterTexts>> = {
  santa: {
    name: "Weihnachtsmann",
    ability: "fliegt den Schlitten",
    lines: [
      "Ho ho ho!",
      "Nur noch ein paar Tage bis Weihnachten!",
      "Wo ist nur meine Brille?",
      "Hat jemand Rudolf gesehen?",
    ],
    noAbility: [
      "Ho ho ho!",
      "Erst mal einen Kakao.",
      "Die Wunschzettel warten!",
    ],
  },
  balbo: {
    name: "Balbo",
    ability: "noch keine Fähigkeit",
    lines: [
      "Brrr - herrlich kalt heute!",
      "Hat jemand Fisch?",
      "Mein Schal sitzt!",
    ],
    noAbility: ["Ich bin ein Eisbär - reicht das nicht?", "*brumm*"],
  },
  jordi: {
    name: "Jordi",
    ability: "verwandelt sich in Tiere",
    lines: [
      "Wo ist meine Fernbedienung?",
      "Ich hab da eine Erfindung ...",
      "Wollen wir was ausprobieren?",
    ],
    noAbility: [],
  },
  trixi: {
    name: "Trixi",
    ability: "kann fliegen",
    lines: [
      "Wer fliegt mit?",
      "Juhu, Schnee!",
      "Ich bin schneller als Rudolf!",
    ],
    noAbility: [],
  },
  gilfi: {
    name: "Gilfi",
    ability: "keine Fähigkeit",
    lines: ["*gähn*", "Ist schon Feierabend?", "Ich ruh mich nur kurz aus ..."],
    noAbility: [
      "Fähigkeit? Hab ich keine ... *seufz*",
      "Zu anstrengend.",
      "Morgen vielleicht.",
    ],
  },
  grantelbart: {
    name: "Grantelbart",
    ability: "noch keine Fähigkeit",
    lines: [
      "Grmpf!",
      "Weihnachten - pah!",
      "Aus dem Weg!",
      "Wer war an meiner Gitarre?",
    ],
    noAbility: ["Grrr!", "Ich brauche keine Fähigkeit!"],
  },
  gugor: {
    name: "Gugor",
    ability: "kann nichts",
    lines: ["Alles doof.", "Ich will nicht.", "Lasst mich in Ruhe."],
    noAbility: ["Ich kann nichts. Wie immer.", "*seufz*", "Na toll."],
  },
  rudolf: {
    name: "Rudolf",
    ability: "kann fliegen",
    lines: ["Meine Nase leuchtet!", "Bereit für den Schlitten!", "Hü!"],
    noAbility: [],
  },
};

/** An animal's name and what makes it special. */
export type AnimalTexts = {
  readonly name: string;
  readonly trait: string;
};

/** Jordi's animals. */
export const ANIMAL_TEXTS: Readonly<Record<AnimalId, AnimalTexts>> = {
  hase: { name: "Hase", trait: "sehr schnell" },
  vogel: { name: "Vogel", trait: "fliegt über alles" },
  pinguin: { name: "Pinguin", trait: "rutscht flott übers Eis, schwimmt" },
  fuchs: { name: "Fuchs", trait: "rutscht nicht auf Eis" },
  maus: { name: "Maus", trait: "winzig, flink, schlüpft durch Zäune" },
  baer: { name: "Bär", trait: "langsam, stark, pflügt durch Schneewehen" },
};

/** Where somebody is, for the selection bar; nothing for outside. */
export const PLACE_TEXTS: Readonly<Record<AreaId, string | null>> = {
  outdoors: null,
  workshop: "in der Werkstatt",
  grantelHouse: "bei Grantelbart",
};

/** What the toy machine says it made. */
export const TOY_NAMES: Readonly<Record<ToyKind, string>> = {
  teddy: "Ein Teddy!",
  train: "Eine Eisenbahn!",
  doll: "Eine Puppe!",
  ball: "Ein Ball!",
  present: "Ein Geschenk!",
};

/** What the characters say when an ability does not work here, and at things. */
export const BUBBLE_TEXTS = {
  cannotLand: "Hier kann ich nicht landen!",
  cannotChange: "Hier geht das nicht!",
  cannotFlyInside: "Drinnen wird nicht geflogen!",
  sleighOnlySanta: "Den Schlitten fliegt nur der Weihnachtsmann!",
  sleighRudolf: "Ich ziehe nur, wenn der Weihnachtsmann drinsitzt!",
  sleighGo: ["Hü, Rudolf!", "Ho ho ho - los geht's!", "Eine Proberunde!"],
  sleighAlone: "Dann eben ohne Rudolf - ho ho ho!",
  sleighLanded: "Ho ho ho - sauber gelandet!",
  wishes: [
    "Lieber Weihnachtsmann, ich wünsche mir ein Pony!",
    "Bitte eine Eisenbahn mit ganz vielen Schienen!",
    "Ich wünsche mir Schnee. Viel Schnee!",
    "Einen Teddy, der brummen kann!",
    "Ich war auch fast immer brav!",
  ],
  armchairSanta: "Ah, mein Sessel ... nur fünf Minuten.",
  armchairOthers: "Das ist der Sessel vom Weihnachtsmann!",
  musicGrantelbart: ["Rock'n'Roll! Grrr!", "Endlich Musik!", "LAUTER!"],
  musicOthers: ["Huch, ist das laut!", "Ganz schön schaurig ...", "Rock!"],
  portrait: "Die Augen ... sie folgen mir!",
  animalLines: {
    hase: ["Hopp hopp!"],
    vogel: ["Piep!"],
    pinguin: ["Wuuusch!"],
    fuchs: ["Schnüffel ..."],
    maus: ["Piiiep!"],
    baer: ["Brummm!"],
  } satisfies Readonly<Record<AnimalId, readonly string[]>>,
} as const;
