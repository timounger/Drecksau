/**
 * Every German text of the Weihnachtsmann game: the screen, the names and
 * abilities of the characters and animals, and what they say.
 *
 * @module
 */
import type {
  AchievementId,
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
  achievements: "Erfolge",
  achievementsTitle: "Erfolge",
  achievementsOpen: "Erfolge anzeigen",
  achievementsIntro:
    "Jede Figur kann mit ihrer Fähigkeit etwas Besonderes schaffen - und es gibt noch mehr. Alles, was du in der Welt veränderst, stellt sich nach einer Weile von selbst wieder her.",
  achievementsClose: "Schließen",
  achievementUnlocked: "Erfolg freigeschaltet!",
  achievementOn: "freigeschaltet am",
  achievementFor: "Figur:",
  achievementAnybody: "jede Figur",
  achievementSecret: "???",
  achievementSecretHint: "Ein geheimer Erfolg - probier einfach Dinge aus.",
} as const;

/** Title, what was done, and the hint while locked, for one achievement. */
export type AchievementTexts = {
  readonly title: string;
  /** What was achieved, shown once unlocked. */
  readonly done: string;
  /** How to get there, shown while locked (not for secret ones). */
  readonly hint: string;
};

/** The texts of every achievement. */
export const ACHIEVEMENT_TEXTS: Readonly<
  Record<AchievementId, AchievementTexts>
> = {
  fish: {
    title: "Petri Heil",
    done: "Als Pinguin im Teich einen Fisch gefangen.",
    hint: "Jordi als Pinguin: Schwimm im offenen Wasser des Teichs zu dem Fisch, der dort ab und zu springt.",
  },
  roofGift: {
    title: "Paket von oben",
    done: "Mit Trixi das verlorene Geschenk von der Glaskuppel geholt.",
    hint: "Oben auf der Werkstattkuppel liegt ein Geschenk. Nur Trixi kommt fliegend hin.",
  },
  rudolfLap: {
    title: "Ehrenrunde",
    done: "Mit Rudolf in einem Flug alle vier Ecken der Karte besucht.",
    hint: "Flieg mit Rudolf ohne zu landen in alle vier Ecken der Karte.",
  },
  wishesAll: {
    title: "Wunschzettel komplett",
    done: "Die Wünsche aller sieben anderen Figuren gelesen.",
    hint: "Weihnachtsmann: Lies nach und nach die Wünsche aller anderen - wer dabei im Bild ist, zählt.",
  },
  machineBroken: {
    title: "Sabotage!",
    done: "Mit Grantelbart die Spielzeugmaschine kaputt gemacht.",
    hint: "Grantelbart in der Werkstatt: Benutze die Spielzeugmaschine oder spiel direkt daneben E-Gitarre.",
  },
  machineFixed: {
    title: "Meisterhaft repariert",
    done: "Als Elfe die kaputte Spielzeugmaschine repariert.",
    hint: "Ist die Maschine kaputt, kann eine Elfe (Jordi, Trixi, Gilfi) sie benutzen und reparieren - bevor sie es selbst tut.",
  },
  grantelConcert: {
    title: "Ohrenbetäubend",
    done: "Mit einem Gitarrenriff drei Zuhörer auf einmal erschreckt.",
    hint: "Grantelbart: Spiel E-Gitarre, wenn mindestens drei andere ganz nah dabeistehen.",
  },
  spyWorkshop: {
    title: "Werkstattspion",
    done: "Mit Gugor den Weihnachtsmann in der Werkstatt beobachtet.",
    hint: "Gugor: Schau durchs Fernrohr, während der Weihnachtsmann in der Werkstatt ist.",
  },
  spySleigh: {
    title: "Erwischt, Angeber!",
    done: "Mit Gugor den Weihnachtsmann beim Schlittenflug beobachtet.",
    hint: "Gugor: Schau durchs Fernrohr, während der Weihnachtsmann Schlitten fliegt.",
  },
  levitateSnowman: {
    title: "Schwebender Schneemann",
    done: "Mit Gilfi einen Schneemann schweben lassen.",
    hint: "Gilfi: Zaubere draußen neben einem Schneemann.",
  },
  balboIce: {
    title: "Bauchklatscher",
    done: "Mit Balbo auf dem Eis hingefallen - und gerutscht.",
    hint: "Balbo: Fall auf dem gefrorenen Teich hin.",
  },
  balboTen: {
    title: "Stehaufmännchen",
    done: "Mit Balbo zehnmal hingefallen.",
    hint: "Lass Balbo zehnmal hinfallen.",
  },
  balboSnowman: {
    title: "Volltreffer",
    done: "Balbo ist kopfüber in einen Schneemann gefallen.",
    hint: "Balbo: Fall direkt vor einem Schneemann hin.",
  },
  mouseFence: {
    title: "Durchgeschlüpft",
    done: "Als Maus durch einen Zaun geschlüpft.",
    hint: "Jordi als Maus: Lauf mitten durch einen Zaun.",
  },
  bearDrift: {
    title: "Schneepflug",
    done: "Als Bär eine Schneewehe plattgewalzt.",
    hint: "Jordi als Bär: Lauf durch eine Schneewehe.",
  },
  birdChimney: {
    title: "Warme Füße",
    done: "Als Vogel auf Grantelbarts Schornstein gelandet.",
    hint: "Jordi als Vogel: Flieg zu Grantelbarts rauchendem Schornstein.",
  },
  hareRace: {
    title: "Turbohase",
    done: "Als Hase in unter 8 Sekunden von der Werkstatt zu Grantelbarts Tür gerannt.",
    hint: "Jordi als Hase: Lauf von der Werkstatttür zu Grantelbarts Haustür - in unter 8 Sekunden.",
  },
  foxDig: {
    title: "Spürnase",
    done: "Als Fuchs ein goldenes Glöckchen beim schiefen Schild ausgebuddelt.",
    hint: "Jordi als Fuchs: Beim schiefen Schild riecht es komisch ...",
  },
  sleighRide: {
    title: "Hü, Rudolf!",
    done: "Mit dem Weihnachtsmann und Rudolf eine Schlittenrunde geflogen.",
    hint: "Weihnachtsmann: Benutze den Schlitten am Tannenbaum, während Rudolf draußen ist.",
  },
  lampFirst: {
    title: "Licht aus",
    done: "Eine Laterne ausgeknipst.",
    hint: "Stell dich vor eine Laterne und benutze sie.",
  },
  lampsAll: {
    title: "Stromausfall",
    done: "Alle 35 Laternen der Karte gleichzeitig ausgemacht.",
    hint: "Mach alle Laternen aus. Eine Minute nach der letzten gehen sie nacheinander wieder an.",
  },
  snowmanDown: {
    title: "Umgeschubst",
    done: "Einen Schneemann umgeschubst.",
    hint: "Stell dich vor einen Schneemann und benutze ihn.",
  },
  snowmanBuilt: {
    title: "Schneemann-Baumeister",
    done: "Einen umgefallenen Schneemann wieder aufgebaut.",
    hint: "Bau einen umgefallenen Schneemann wieder auf, bevor er es selbst tut.",
  },
  instruments: {
    title: "Ein-Troll-Band",
    done: "Orgel, Gitarre, Verstärker und Schlagzeug bei Grantelbart gespielt.",
    hint: "Spiel in Grantelbarts Haus jedes Instrument einmal.",
  },
  toys10: {
    title: "Fließbandarbeit",
    done: "Zehn Spielzeuge mit der Maschine gebaut.",
    hint: "Bau mit der Spielzeugmaschine in der Werkstatt zehn Spielzeuge.",
  },
  grantelVisit: {
    title: "Hausbesuch",
    done: "Mit dem Weihnachtsmann Grantelbarts Haus betreten.",
    hint: "Geh mit dem Weihnachtsmann zu Grantelbart ins Haus.",
  },
  allInWorkshop: {
    title: "Betriebsversammlung",
    done: "Alle acht Figuren auf einmal in der Werkstatt versammelt.",
    hint: "Bring alle acht Figuren gleichzeitig in die Werkstatt.",
  },
  firstGate: {
    title: "Das erste Türchen",
    done: "Das erste Minispiel im Adventskalender gewonnen.",
    hint: "Gewinne ein Minispiel hinter einem Türchen.",
  },
  allGates: {
    title: "Frohe Weihnachten!",
    done: "Alle 26 Türchen des Adventskalenders geschafft.",
    hint: "Schaffe alle 26 Türchen des Adventskalenders.",
  },
};

/** A character's name and what it can do, for the selection bar. */
export type CharacterTexts = {
  readonly name: string;
  readonly ability: string;
  /** What it says on the talk key. */
  readonly lines: readonly string[];
};

/** Names, abilities and lines of the eight characters. */
export const CHARACTER_TEXTS: Readonly<Record<CharacterId, CharacterTexts>> = {
  santa: {
    name: "Weihnachtsmann",
    ability: "erkennt Wünsche",
    lines: [
      "Ho ho ho!",
      "Nur noch ein paar Tage bis Weihnachten!",
      "Wo ist nur meine Brille?",
      "Hat jemand Rudolf gesehen?",
    ],
  },
  balbo: {
    name: "Balbo",
    ability: "fällt tollpatschig hin",
    lines: [
      "Brrr - herrlich kalt heute!",
      "Hat jemand Fisch?",
      "Mein Schal sitzt!",
    ],
  },
  jordi: {
    name: "Jordi",
    ability: "verwandelt sich in Tiere",
    lines: [
      "Wo ist meine Fernbedienung?",
      "Ich hab da eine Erfindung ...",
      "Wollen wir was ausprobieren?",
    ],
  },
  trixi: {
    name: "Trixi",
    ability: "kann fliegen",
    lines: [
      "Wer fliegt mit?",
      "Juhu, Schnee!",
      "Ich bin schneller als Rudolf!",
    ],
  },
  gilfi: {
    name: "Gilfi",
    ability: "lässt Dinge schweben",
    lines: ["*gähn*", "Ist schon Feierabend?", "Ich ruh mich nur kurz aus ..."],
  },
  grantelbart: {
    name: "Grantelbart",
    ability: "spielt E-Gitarre",
    lines: [
      "Grmpf!",
      "Weihnachten - pah!",
      "Aus dem Weg!",
      "Wer war an meiner Gitarre?",
    ],
  },
  gugor: {
    name: "Gugor",
    ability: "schaut durchs Fernrohr",
    lines: ["Alles doof.", "Ich will nicht.", "Lasst mich in Ruhe."],
  },
  rudolf: {
    name: "Rudolf",
    ability: "kann fliegen",
    lines: ["Meine Nase leuchtet!", "Bereit für den Schlitten!", "Hü!"],
  },
};

/**
 * What everybody secretly wishes for, as Santa sees it in a thought bubble;
 * he himself only reads the wishes.
 */
export const WISH_TEXTS: Readonly<
  Record<Exclude<CharacterId, "santa">, string>
> = {
  balbo: "Ein dicker Fisch",
  jordi: "Eine Eisenbahn",
  trixi: "Ein Kuschelteddy",
  gilfi: "Ein Kissen - zum Ausschlafen",
  grantelbart: "Eine neue E-Gitarre",
  gugor: "Psst ... ein Ball",
  rudolf: "Eine Möhre",
};

/** The caption while Gugor looks through his telescope. */
export const SPY_CAPTION = "Gugor beobachtet den Weihnachtsmann ...";

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
  wishesStart: [
    "Ho ho ho - was wünscht ihr euch denn?",
    "Mal sehen, was ihr euch wünscht ...",
    "Ich sehe Wünsche!",
  ],
  wishesEnd: ["Alles notiert!", "Ho ho ho - wird gemacht!", "Interessant ..."],
  guitarStart: ["Rock'n'Roll!", "Jetzt wird's laut!", "Grrr - YEAH!"],
  guitarTooLoud: ["Zu laut!", "Meine Ohren!", "Aufhören!", "Huch!"],
  guitarFan: "Endlich mal gute Musik.",
  levitateStart: ["Schwebe!", "Hokuspokus - äh, Elfenzauber!", "Auf mit euch!"],
  levitateEnd: ["Puh ... genug gezaubert.", "Anstrengend!", "*gähn*"],
  fallOuch: ["Uff!", "Autsch!", "Plumps!"],
  fallUp: ["Nichts passiert!", "Wer hat da Eis hingelegt?", "War Absicht!"],
  spyIdle: [
    "Er steht nur rum. Langweilig.",
    "Er hat schon wieder seine Brille verlegt.",
  ],
  spyWalking: ["Er läuft herum. Spannend ...", "Wo will der denn hin?"],
  spyWorkshop: [
    "Er isst in der Werkstatt Plätzchen. Ohne mich.",
    "Er baut Spielzeug. Pah.",
  ],
  spyGrantel: ["Er ist bei uns im Haus?!", "Was will der bei Grantelbart?"],
  spySleigh: ["Er fliegt Schlitten. Angeber.", "Da oben! Der Angeber!"],
  spyWishes: ["Er liest Wünsche. Meinen auch?!", "Er guckt so komisch."],
  lampOff: ["Licht aus!", "Klick - dunkel.", "Gute Nacht, Laterne!"],
  lampOn: "Und wieder an!",
  snowmanDown: ["Hoppla - umgefallen!", "Plumps, Schneemann!", "Huch!"],
  snowmanBuilt: ["Steht wieder!", "Schön gebaut!", "Schneemann, auf!"],
  fallSnowman: "Uff - mitten in den Schneemann!",
  fishCaught: ["Hab ihn!", "Ein Fisch! Lecker!", "Fang!"],
  giftTaken: [
    "Ein Geschenk auf dem Dach!",
    "Hab es!",
    "Wer verliert denn so was?",
  ],
  bearPlough: "Brumm - platt!",
  foxDig: "Schnüffel ... ein goldenes Glöckchen!",
  machineCrash: ["Hehehe - kaputt!", "Ups. Grmpf!", "Das war die Maschine!"],
  machineBroken: "Kaputt! Das kann nur eine Elfe reparieren.",
  machineGloat: "Hehe - die bleibt kaputt!",
  machineBusy: "Moment, hier wird repariert!",
  machineRepairing: [
    "Hämmern, schrauben ...",
    "Das haben wir gleich!",
    "Einmal ölen ...",
  ],
  machineFixed: ["Repariert!", "Läuft wieder!", "Wie neu!"],
  animalLines: {
    hase: ["Hopp hopp!"],
    vogel: ["Piep!"],
    pinguin: ["Wuuusch!"],
    fuchs: ["Schnüffel ..."],
    maus: ["Piiiep!"],
    baer: ["Brummm!"],
  } satisfies Readonly<Record<AnimalId, readonly string[]>>,
} as const;
