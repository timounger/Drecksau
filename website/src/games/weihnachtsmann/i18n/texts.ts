/**
 * Every German text of the Weihnachtsmann game: the screen, the names and
 * abilities of the characters and animals, and what they say.
 *
 * @module
 */
import type { PlaceName } from "@/games/weihnachtsmann/engine/east-data";
import type { TaskKind } from "@/games/weihnachtsmann/engine/daily";
import type {
  ExtraSignId,
  PhotoId,
} from "@/games/weihnachtsmann/engine/extras-data";
import type {
  PlaceSignId,
  StationId,
} from "@/games/weihnachtsmann/engine/places-data";
import type {
  AchievementId,
  AnimalId,
  AreaId,
  CharacterId,
  CritterKind,
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
  controlsTalk: "Sprechen / Benutzen: R",
  controlsDoor: "Tür: hineinlaufen",
  useKey: "R",
  controlsTouch: "Handy: Stick und Knöpfe, Figur antippen",
  touchHelp:
    "Links ziehen: laufen - Fähigkeit, Benutzen/Sprechen, Nächste: Knöpfe - Figur unten oder im Bild antippen - Hinein: an Tür, Türchen und Kino",
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
  controlsCinema: "Kino: hineinlaufen oder R an der Tür",
  cinemaLabel: "Kino",
  cinemaEnter: "Pfeil hoch: hinein",
  cinemaTitle: "Kino",
  cinemaSubtitle: "Alle 26 Folgen von Weihnachtsmann & Co. KG",
  cinemaLeave: "Kino verlassen",
  cinemaLeaveHint: "Leertaste: Pause - Pfeile: 10 s spulen - Esc: raus",
  cinemaPrivacy:
    "Beim Abspielen werden die Folgen vom offiziellen TOGGO-Kanal geladen.",
  cinemaPick:
    "Such dir eine Folge aus - der Film startet, sobald du sie antippst.",
  cinemaEpisode: "Folge",
  cinemaSeen: "gesehen",
  cinemaResume: "Weiterschauen",
  cinemaFrom: "ab",
  cinemaComing: "Gleich geht's weiter:",
  cinemaPlayNow: "Jetzt abspielen",
  cinemaCancel: "Abbrechen",
  cinemaBroken: "Diese Folge ist gerade nicht verfügbar.",
  cinemaLoading: "Der Vorhang geht gleich auf ...",
  cinemaPaused: "Pause - antippen oder Leertaste, dann geht es weiter",
  cinemaEnd: "Ende",
  cinemaNext: "Nächste Folge",
  cinemaAgain: "Nochmal ansehen",
  cinemaPlay: "Abspielen",
  cinemaPause: "Pause",
  cinemaMute: "Ton aus",
  cinemaUnmute: "Ton an",
  cinemaVolume: "Lautstärke",
  cinemaSeek: "Zeitleiste",
  cinemaFull: "Vollbild",
  cinemaFullExit: "Vollbild beenden",
  cinemaList: "Folgen",
  cinemaPlayer: "Folge abspielen",
} as const;

/** Title, what was done, and the hint while locked, for one achievement. */
export type AchievementTexts = {
  readonly title: string;
  /** What was achieved, shown once unlocked. */
  readonly done: string;
  /** How to get there, shown while locked. */
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
    done: "Als Hase in unter 7 Sekunden von der Werkstatt zu Grantelbarts Tür gerannt.",
    hint: "Jordi als Hase: Lauf von der Werkstatttür zu Grantelbarts Haustür - in unter 7 Sekunden.",
  },
  foxDig: {
    title: "Spürnase",
    done: "Als Fuchs ein goldenes Glöckchen beim schiefen Schild ausgebuddelt.",
    hint: "Jordi als Fuchs: Grab mit R gleich östlich vom schiefen Schild.",
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
    hint: "Mach alle 35 Laternen aus. Du musst nicht alle in einer Minute schaffen: Jede ausgemachte Laterne startet die Minute neu - erst wenn du eine Minute lang keine ausmachst, gehen sie nacheinander wieder an.",
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
  movieNight: {
    title: "Filmabend",
    done: "Im Kino eine Folge von Weihnachtsmann & Co. KG gestartet.",
    hint: "Geh ins Kino nördlich der Hauptstraße und starte eine Folge.",
  },
  stableFed: {
    title: "Satte Rentiere",
    done: "Alle vier Rentiere im Stall gleichzeitig satt gefüttert.",
    hint: "Hol im Rentierstall (unter dem Gehege) Möhren aus der Kiste und füttere Komet, Donner, Blitz und Tänzer - alle vier, bevor der erste wieder Hunger hat.",
  },
  rudolfNap: {
    title: "Rudolfs Nickerchen",
    done: "Mit Rudolf im Stroh des Rentierstalls geschlafen.",
    hint: "Rudolf: Leg dich im Rentierstall mit R ins Stroh.",
  },
  letters10: {
    title: "Postmeister",
    done: "Zehn Wunschzettel ins richtige Fach sortiert.",
    hint: "Nimm in der Poststube einen Brief vom Berg und bring ihn ins Fach mit seiner Farbe - zehnmal.",
  },
  santaLetter: {
    title: "Lieber Weihnachtsmann ...",
    done: "Mit dem Weihnachtsmann einen Wunschzettel gelesen.",
    hint: "Weihnachtsmann: Nimm in der Poststube einen Brief vom Berg - er liest ihn sofort.",
  },
  firstTray: {
    title: "Erstes Blech",
    done: "Ein Blech goldbrauner Plätzchen aus dem Ofen geholt.",
    hint: "Backstube: Teig aus der Schüssel, am Blechtisch ausstechen, in den Ofen, warten - und rechtzeitig wieder herausholen.",
  },
  balboFlour: {
    title: "Mehlstaub",
    done: "Mit Balbo in der Backstube hingefallen - die Plätzchen flogen.",
    hint: "Balbo: Fall in der Elfen-Backstube hin.",
  },
  gilfiTrays: {
    title: "Fliegende Bleche",
    done: "Mit Gilfi in der Backstube die Bleche schweben lassen.",
    hint: "Gilfi: Zaubere in der Elfen-Backstube.",
  },
  overview: {
    title: "Überblick",
    done: "Durch das große Fernrohr der Sternwarte über die ganze Karte geschaut.",
    hint: "Geh in Gugors Sternwarte (nördlich von Grantelbarts Haus) und benutze das große Fernrohr.",
  },
  gugorEagle: {
    title: "Adlerauge",
    done: "Mit Gugor von der Sternwarte aus das verlorene Geschenk entdeckt.",
    hint: "Gugor: Schau in seiner Sternwarte durchs Fernrohr, während das Geschenk im Lager versteckt ist.",
  },
  giftFound: {
    title: "Geschenk gerettet",
    done: "Das verlorene Geschenk im Lager gefunden und in die Werkstatt gebracht.",
    hint: "Im Geschenkelager im Osten liegt ein Geschenk versteckt. Such es im Labyrinth der Pakete (R) und trag es in die Werkstatt.",
  },
  marketStalls: {
    title: "Bummel über den Markt",
    done: "An allen drei Buden des Weihnachtsmarkts gewesen.",
    hint: "Weihnachtsmarkt im Nordosten: Drück R an der Punsch-, der Lebkuchen- und der Maronenbude.",
  },
  carousel: {
    title: "Rundherum",
    done: "Eine Runde Karussell gefahren.",
    hint: "Stell dich vor das Karussell auf dem Weihnachtsmarkt und drück R - dann fährst du mit.",
  },
  iceCave: {
    title: "Hinter dem Eis",
    done: "Die Eishöhle hinter dem gefrorenen Wasserfall betreten.",
    hint: "Der Eisvorhang am Wasserfall (östlich der Schneeballwiese) ist zu dick. Jordi als Bär bricht ihn mit R auf - oder der Fuchs wittert links daneben ein Schlupfloch.",
  },
  aurora: {
    title: "Himmelsleuchten",
    done: "Mit Gugors Fernrohr die Polarlichter angeschaut.",
    hint: "Nachts leuchten manchmal Polarlichter am Himmel. Dann draußen als Gugor das Fernrohr nehmen (Leertaste).",
  },
  sledFast: {
    title: "Rodelblitz",
    done: "Den Rodelhang in unter 7 Sekunden hinuntergesaust.",
    hint: "Am Rodelhang (unter dem Markt) R an den Schlitten oben: lenk mit links/rechts um Fahnen und Steine und komm in unter 7 Sekunden ins Ziel.",
  },
  snowballs: {
    title: "Treffsicher",
    done: "15 Treffer auf der Schneeballwiese.",
    hint: "Auf der Schneeballwiese wirft R einen Schneeball in Blickrichtung. Triff Zielscheiben und Schneemänner - 15 Mal.",
  },
  skater: {
    title: "Eiskunstläufer",
    done: "Drei Runden um die Insel im zugefrorenen See gedreht.",
    hint: "Lauf auf dem Eis des Sees im Südosten dreimal um die kleine Insel, ohne das Eis zu verlassen.",
  },
  firTree: {
    title: "O Tannenbaum",
    done: "Eine Tanne gefällt und in der Werkstatt aufgestellt.",
    hint: "Weihnachtsmann oder eine Elfe: In der Tannenschonung mit R eine kleine Tanne fällen, in die Werkstatt tragen und dort mit R in den Ständer stellen.",
  },
  bellsAll: {
    title: "Alle Glöckchen",
    done: "Alle 12 goldenen Glöckchen gefunden.",
    hint: "Auf der ganzen Karte sind 12 goldene Glöckchen versteckt - manche nur fliegend, als Maus, Bär, Pinguin oder Fuchs, mit Gilfis Zauber, nachts, im Karussell oder in einem Schneemann zu finden.",
  },
  animalTalk: {
    title: "Tiergespräche",
    done: "Mit Schneehase, Pinguin und Eule geplaudert.",
    hint: "Jordi verwandelt sich: als Hase zu einem Schneehasen, als Pinguin zu einem Pinguin, als Vogel zu einer Eule - jeweils R drücken, wenn das Tier nah ist.",
  },
  errands5: {
    title: "Fleißiger Bote",
    done: "Fünf Aufträge aus dem Briefkasten erledigt.",
    hint: "Ist die Fahne am Briefkasten neben der Werkstatt oben, liegt ein Brief darin: R lesen, Auftrag erledigen (der Pfeil zeigt den Weg) - fünf Mal.",
  },
  stormWalk: {
    title: "Sturmerprobt",
    done: "20 Sekunden durch einen Schneesturm gestapft.",
    hint: "Ab und zu zieht ein Schneesturm auf. Dann draußen 20 Sekunden lang unterwegs sein.",
  },
  fullThrottle: {
    title: "Vollgas",
    done: "Mit dem Jetski in einem Rutsch quer über die ganze Karte gebraust.",
    hint: "Steig auf einen Jetski und fahr ohne abzusteigen vom Westrand der Karte (beim Teich) bis ganz in den Osten (Markt oder See) - oder andersherum.",
  },
  mouseGap: {
    title: "Mäuseweg",
    done: "Als Maus durch ein Mauseloch im Geschenkelager geschlüpft.",
    hint: "Jordi als Maus: Schlüpf im Geschenkelager durch ein Loch unten in einem Paketstapel.",
  },
  hockeyWin: {
    title: "Eishockey-Held",
    done: "Ein Eishockeyspiel bis drei Tore gewonnen.",
    hint: "Auf dem Eisplatz im Südland: R an der Bank startet ein Spiel gegen zwei andere. Puck mitnehmen, mit R aufs rechte Tor schießen - wer zuerst drei Tore hat, gewinnt.",
  },
  snowCastle: {
    title: "Burgherr",
    done: "Eine ganze Schneeburg gebaut und die Fahne gehisst.",
    hint: "Auf der Baustelle im Südland: Schneeblöcke vom Haufen holen (R) und auf die Baustelle setzen (R) - Mauer, zwei Türme, zum Schluss mit leeren Händen die Fahne.",
  },
  balloonRide: {
    title: "Über den Wolken",
    done: "Mit dem Heißluftballon hoch über die Karte geschwebt.",
    hint: "Am Ballonplatz im Südland R am Korb: einsteigen und eine Weile hoch oben über die Karte schweben.",
  },
  roofSecret: {
    title: "Dachgeheimnis",
    done: "Vom Ballon aus das Zeichen auf dem Dach des Geschenkelagers entdeckt.",
    hint: "Manches sieht man nur von oben: Schweb mit dem Ballon über das Geschenkelager.",
  },
  summit: {
    title: "Gipfelstürmer",
    done: "Mit der Seilbahn auf den Berggipfel gefahren.",
    hint: "Die Talstation der Seilbahn steht im Südland: R vor der Station, und die Gondel fährt hinauf.",
  },
  skiRun: {
    title: "Abfahrt",
    done: "Auf Skiern vom Gipfel bis ins Tal gesaust.",
    hint: "Oben auf dem Gipfel R am Skiständer: Pfeil links und rechts lenken, hoch bremst - bis durchs Ziel unten.",
  },
  lighthouse: {
    title: "Leuchtfeuer",
    done: "Nachts das Licht des Leuchtturms angeschaltet.",
    hint: "Der Leuchtturm steht am Südufer des Sees. Komm nachts hin und schalte mit R an der Tür das Licht an.",
  },
  trainStops: {
    title: "Alle Halte",
    done: "Mit der Schmalspurbahn an allen fünf Haltestellen gewesen.",
    hint: "R am Bahnsteig, wenn der Zug dort hält: einsteigen. An jeder Haltestelle zählt es, wenn du im Zug ankommst.",
  },
  trainLoop: {
    title: "Einmal rundherum",
    done: "Eine ganze Runde mit der Schmalspurbahn gefahren.",
    hint: "Steig in den Zug und bleib sitzen, bis er einmal die ganze Strecke gefahren ist.",
  },
  stageRock: {
    title: "Rockkonzert",
    done: "Grantelbart hat auf der Bühne gespielt - und alle haben getanzt!",
    hint: "Als Grantelbart auf die Bühne im Südland (zwischen Ballon und Seilbahn) und dort die Gitarre spielen (Fähigkeit) - bis zum Applaus.",
  },
  magicSchool: {
    title: "Zauberlehrling",
    done: "Fünf Treffer in einer Runde der Zauberschule.",
    hint: "Als Gilfi am Schild der Zauberschule vor dem Berg R drücken, mit der Fähigkeit werfen und mit dem Stick in die Körbe lenken - 5 Treffer in einer Runde.",
  },
  airMail: {
    title: "Luftpost",
    done: "Alle drei Pakete auf die richtigen Dächer geflogen.",
    hint: "Als Trixi an der Tafel neben der Poststube einen Auftrag holen und fliegend über die golden markierten Dächer.",
  },
  angelStar: {
    title: "Engelsstern",
    done: "Sechs Schneeengel ergeben einen leuchtenden Stern!",
    hint: "Als Balbo auf dem Engelfeld im Südland auf jeden der sechs Pflöcke fallen (Fähigkeit) - bevor die ersten verwehen.",
  },
  nightStars: {
    title: "Nachtsterne",
    done: "Rudolfs Nase hat alle acht Nachtsterne gefunden.",
    hint: "Nachts als Rudolf in die dunklen Ecken der Karte - nur in seinem roten Licht sieht man die Nachtsterne.",
  },
  happyKids: {
    title: "Kinderaugen",
    done: "Fünf Kinder haben ihr Wunschspielzeug bekommen.",
    hint: "Kinder an der Hauptstraße wünschen sich etwas: die Fähigkeit des Weihnachtsmanns zeigt den Wunsch, das Spielzeug kommt aus der Maschine in der Werkstatt.",
  },
  snowmanJury: {
    title: "Fünf Sterne",
    done: "Die Pinguin-Jury gibt deinem Schneemann fünf Sterne!",
    hint: "Beim Schneemann-Wettbewerb im Südwesten drei Kugeln, Nase, Hut und Schal aufs Feld tragen, dann R bei der Jury.",
  },
  photoAlbum: {
    title: "Fotoalbum",
    done: "Von allen zehn Fotopunkten ein Bild im Album.",
    hint: "An den Pfosten mit Kamera R drücken - zehn schöne Stellen, eine davon auf dem Gipfel.",
  },
  shootingStar: {
    title: "Sternschnuppe",
    done: "Bei einer Sternschnuppe etwas gewünscht.",
    hint: "Nachts draußen zum Himmel schauen: fliegt eine Sternschnuppe, schnell R oder die Fähigkeit drücken.",
  },
  fireworks: {
    title: "Prosit Neujahr!",
    done: "Das Silvester-Feuerwerk gesehen.",
    hint: "Am 31. Dezember nachts (oder am 1. Januar ganz früh) draußen sein - dann gibt es Feuerwerk.",
  },
  dailyTasks: {
    title: "Jeden Tag ein bisschen",
    done: "An drei Tagen alle Tagesaufgaben geschafft.",
    hint: "Im Notizbuch stehen jeden Tag drei kleine Aufgaben - schaffe sie an drei verschiedenen Tagen.",
  },
  bestFriends: {
    title: "Beste Freunde",
    done: "Zwei Figuren sind jetzt beste Freunde.",
    hint: "Mit R vor einer anderen Figur plaudern - immer wieder, bis alle vier Herzen voll sind.",
  },
  giftPile: {
    title: "Geschenkeberg",
    done: "Zehn eingepackte Geschenke liegen unter dem Baum.",
    hint: "Spielzeug aus der Maschine am Packtisch in der Werkstatt einpacken und unter den Geschenkebaum südlich des Teichs legen.",
  },
  christmasEve: {
    title: "Bescherung",
    done: "Heiligabend: alle am Baum, und jeder hat ein Geschenk bekommen.",
    hint: "Am 24. Dezember abends R am Geschenkebaum südlich des Teichs - dann beginnt die Bescherung.",
  },
};

/**
 * The German titles of the 26 episodes, episode 1 first, as on the official
 * TOGGO channel.
 */
export const EPISODE_TITLES: readonly string[] = [
  "Die magische Perle",
  "Die Weihnachtsmann-Prüfung",
  "Zwei kleine Genies",
  "Rudolph ist verschwunden",
  "Mission im Weltraum",
  "Leons Weihnachten",
  "Ein Geschenk für zwei",
  "Das Super-Kaninchen",
  "Der Glücksbringer",
  "Der fliegende Teppich",
  "Das Zauberschwert",
  "Strafe muss sein",
  "Ein gefährlicher Wunsch",
  "Ein neues Kostüm für den Weihnachtsmann",
  "Fliegen müsste man können",
  "Trolle in 3D",
  "Gugors Doppelgänger",
  "Zurück aus der Zukunft",
  "Der Wachstumstrank",
  "Ein Bär für Julio",
  "Weihnachtspost auf Abwegen",
  "Knecht Ruprechts Zauberpuder",
  "Die Flaschenpost",
  "Sebastian weiß nicht, was er will",
  "Der längste Tag",
  "Der Weihnachtsmann und sein Geheimnis",
];

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
  stable: "im Rentierstall",
  postOffice: "in der Poststube",
  bakery: "in der Backstube",
  observatory: "in der Sternwarte",
  giftStore: "im Geschenkelager",
  iceCave: "in der Eishöhle",
  summit: "auf dem Gipfel",
};

/** The name of every building one can enter, for the sign at its door. */
export const BUILDING_NAMES: Readonly<
  Record<Exclude<AreaId, "outdoors">, string>
> = {
  workshop: "Weihnachtswerkstatt",
  grantelHouse: "Grantelbarts Haus",
  stable: "Rentierstall",
  postOffice: "Poststube",
  bakery: "Elfen-Backstube",
  observatory: "Gugors Sternwarte",
  giftStore: "Geschenkelager",
  iceCave: "Eishöhle",
  summit: "Berggipfel",
};

/** The short names of the buildings on the view from the observatory. */
export const MAP_NAMES: Readonly<Record<Exclude<AreaId, "outdoors">, string>> =
  {
    workshop: "Werkstatt",
    grantelHouse: "Grantelbart",
    stable: "Stall",
    postOffice: "Post",
    bakery: "Backstube",
    observatory: "Sternwarte",
    giftStore: "Lager",
    iceCave: "Eishöhle",
    summit: "Gipfel",
  };

/** What is said and shown in the five buildings of the village. */
export const TOWN_TEXTS = {
  enter: "Pfeil hoch: hinein",
  handsFull: "Die Hände sind voll!",
  carrotTaken: ["Eine Möhre!", "Knackig!", "Für die Rentiere!"],
  carrotHave: "Ich hab doch schon eine Möhre.",
  reindeerNames: ["Komet", "Donner", "Blitz", "Tänzer"],
  reindeerFed: ["mampft zufrieden.", "kaut glücklich.", "sagt danke!"],
  reindeerFull: "ist noch satt.",
  reindeerHungry: "hat Hunger - hol eine Möhre aus der Kiste!",
  strawRudolf: ["Gähn ... nur ein Nickerchen.", "Ab ins Stroh!"],
  strawOthers: "Das ist Rudolfs Schlafplatz im Stroh.",
  napEnd: ["Ausgeschlafen!", "Wo war ich?", "Hü - wieder fit!"],
  pileEmpty: "Alle Briefe sortiert - der Berg wächst gleich wieder.",
  letterFrom: "Ein Brief aus",
  continents: ["Europa", "Amerika", "Afrika", "Asien", "Australien"],
  letterRight: ["Richtig einsortiert!", "Passt!", "Ab ins Fach!"],
  letterWrong: "Falsches Fach - der kommt aus",
  letterNone: "Erst einen Brief vom Berg nehmen!",
  letterRead: ["Ho ho ho - wird gemacht!", "Wird notiert!"],
  letterSenders: [
    "Mia",
    "Ben",
    "Lea",
    "Noah",
    "Emma",
    "Paul",
    "Sofia",
    "Jonas",
  ],
  letterWishes: [
    "einen Teddy",
    "eine Eisenbahn",
    "einen Ball",
    "einen Goldfisch",
    "ein Kuschelkissen",
    "eine Gitarre",
    "Möhren fürs Pony",
  ],
  letterWish: "wünscht sich",
  doughTaken: "Ein Klumpen Teig!",
  doughNeed: "Erst Teig aus der Schüssel holen!",
  traysCut: ["Sterne und Herzen ausstechen!", "Aufs Blech damit!"],
  ovenIn: "Ab in den Ofen!",
  ovenBusy: "Noch ein bisschen Geduld ...",
  ovenEmpty: "Der Ofen ist leer - erst ein Blech mit Teig.",
  ovenDone: ["Duftet herrlich!", "Goldbraun!", "Fertig!"],
  ovenBurnt: "Oje - verbrannt!",
  rackPut: "Zum Abkühlen aufs Gitter.",
  rackFull: "Das Gitter ist voll.",
  rackBurnt: "Die verbrannten wirft man lieber weg ...",
  rackNibble: ["Mmh, ein Plätzchen!", "Lecker!"],
  rackEmpty: "Noch keine Plätzchen zum Abkühlen.",
  balboFlour: "Uff - alles voller Mehl!",
  gugorLook: [
    "Ich seh alles. Alles doof.",
    "Pah - ich weiß, wo das Geschenk ist.",
  ],
  overviewTitle: "Rundblick von der Sternwarte",
  overviewSummit: "Rundblick vom Gipfel",
  overviewHint: "R, Leertaste oder Esc: zurück",
  overviewEagle: "Gugor sieht auch, was versteckt ist",
  overviewStore: "Lager von innen",
  overviewPresent: "Geschenk",
  overviewSecret: "?",
  overviewYou: "du",
  presentFound: "Gefunden! Schnell in die Werkstatt damit!",
  presentHome: "Abgeliefert - ho ho ho!",
} as const;

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

/** The names of the places of the east land on the view from the observatory. */
export const PLACE_NAMES: Readonly<Record<PlaceName, string>> = {
  market: "Weihnachtsmarkt",
  slope: "Rodelhang",
  meadow: "Schneeballwiese",
  lake: "See",
  plantation: "Tannenschonung",
  mailbox: "Briefkasten",
  hockey: "Eishockey",
  castle: "Schneeburg",
  balloon: "Ballonplatz",
  cableCar: "Seilbahn",
  mountain: "Berg",
  lighthouse: "Leuchtturm",
  station: "Werkstatt-Bahnhof",
};

/** What is said and shown in the east land, at the mailbox and in the sky. */
export const EAST_TEXTS = {
  stallLines: [
    ["Mmh, heißer Kinderpunsch!", "Der wärmt die Pfoten!"],
    ["Ein Lebkuchenherz - lecker!", "Da steht drauf: Ich mag dich!"],
    ["Heiße Maronen!", "Uff, heiß - aber gut!"],
  ],
  stallNames: ["Punschbude", "Lebkuchenbude", "Maronenbude"],
  carouselOn: ["Juhuu - rundherum!", "Festhalten!", "Hü, Holzpferdchen!"],
  carouselOff: ["Mir ist schwindelig ...", "Nochmal!", "Das war schön!"],
  carouselFull: "Alle Pferdchen sind besetzt.",
  carouselNo: "Fliegend aufs Karussell? Lieber nicht.",
  sledGo: ["Achtung, fertig, los!", "Huiii!", "Platz da!"],
  sledCrash: [
    "Autsch!",
    "Plumps - weiter geht's!",
    "Wer stellt hier Fahnen hin?",
  ],
  sledFinish: "Ziel! Zeit:",
  sledBest: "Neue Bestzeit!",
  sledNo: "Damit kann ich nicht rodeln.",
  sledTime: "Rodeln",
  sledRecord: "Bestzeit",
  seconds: "s",
  throwLines: ["Hepp!", "Und ... Wurf!", "Schneeball!"],
  hitLines: ["Treffer!", "Volltreffer!", "Bumm!"],
  hitMe: ["Hey!", "Na warte!", "Kalt!"],
  curtainThick: "Ein dicker Eisvorhang - dahinter klingt es hohl.",
  curtainBreak: "BRUMM! Krach - der Vorhang ist offen!",
  curtainOpen: "Der Vorhang ist offen - hinein!",
  holeSniff: "Schnüffel ... hier zieht kalte Luft heraus!",
  holeDug: "Ein Schlupfloch - in die Höhle!",
  fellOk: ["Tock, tock - Baum fällt!", "Die nehm ich mit!"],
  fellNo: "Fällen können nur der Weihnachtsmann und die Elfen.",
  standEmpty:
    "Der Christbaumständer ist leer - hol eine Tanne aus der Schonung!",
  standBusy: "Hier steht schon ein Baum.",
  standDone: ["Und jetzt schmücken - fertig!", "O Tannenbaum!"],
  bellFound: "Ein goldenes Glöckchen!",
  mailboxEmpty: "Der Briefkasten ist leer - bald kommt neue Post.",
  mailboxBusy: "Erst den Auftrag erledigen!",
  errand: "Auftrag",
  errandDone: ["Erledigt - danke!", "Ho ho ho - gut gemacht!"],
  errandThanks: ["Oh, danke!", "Wie lieb!", "Da ist es ja!"],
  errandVisit: ["Schön, dass du vorbeikommst!", "Hallo! Was gibt's?"],
  itemNames: ["den Fäustling", "den Schal", "die Brille"],
  itemFound: "Gefunden!",
  errandDeliver: "Bring {item} zu {who}",
  errandVisitText: "Besuch {who}",
  errandFetch: "Hol etwas von der {stall} und bring es zum Briefkasten",
  treatTaken: "Eingepackt - ab zum Briefkasten!",
  stormStart: "Brr - ein Schneesturm!",
  critterLines: {
    hare: [
      "Hast du eine Möhre? Nein? Schade.",
      "Wer zuerst am Baum ist!",
      "Psst - ich bin weiß, mich sieht keiner.",
    ],
    penguin: [
      "Bauchrutschen ist das Größte!",
      "Fisch? Hast du Fisch?",
      "Wir sind eigentlich vom Südpol. Pssst.",
    ],
    owl: [
      "Huhu! Ich seh alles. Auch nachts.",
      "Gugor ist ein komischer Kauz. Huhu.",
      "Wer? Wer? Ach, du.",
    ],
  } satisfies Readonly<Record<CritterKind, readonly string[]>>,
  bellsHeader: "Goldene Glöckchen",
  sledHeader: "Rodel-Bestzeit",
  noTime: "noch keine",
} as const;

/** What is said and shown at the snow jetskis. */
export const JETSKI_TEXTS = {
  name: "Jetski",
  board: "R: einsteigen",
  go: ["Brumm brumm - los geht's!", "Festhalten!", "Vollgas!"],
  off: ["Schöne Fahrt!", "Puh, das war schnell!", "Hier bleib ich stehen."],
  animal: "Als Tier komm ich nicht an den Lenker.",
  flying: "Erst landen, dann einsteigen!",
  taken: "Da sitzt schon jemand drauf.",
  water: "Mitten im Wasser? Erst ans Ufer fahren!",
  noRoom: "Hier ist kein Platz zum Absteigen.",
  door: "Mit dem Jetski geht's nicht hinein - erst aussteigen (R).",
  horn: ["Tuut tuut!", "Platz da!", "Määp määp!"],
  hornGrantel: ["Rock 'n' Roll!", "Jetzt wird's laut!"],
  crash: ["Uff!", "Hoppla!", "Bremsen, bremsen!"],
  snowman: "Ups - der Schneemann!",
} as const;

/** What is said and shown at the places of the south land, the lighthouse and the railway. */
export const PLACES_TEXTS = {
  hockeyBusy: "Das Spiel läuft doch schon!",
  hockeyAnimal: "Als Tier kann ich keinen Schläger halten.",
  hockeyNobody: "Keiner hat gerade Zeit für ein Spiel ...",
  hockeyStart: ["Anpfiff - bis drei Tore!", "Auf geht's!", "Puck frei!"],
  hockeyGoalie: ["Ich steh im Tor!", "An mir kommt keiner vorbei!"],
  hockeyGoal: ["Tor!", "TOOOR!", "Drin ist er!"],
  hockeyWon: "Gewonnen! Drei Tore - Pokal!",
  hockeyLost: "Verloren ... Revanche?",
  hockeyOff: "Abgepfiffen!",
  hockeyScore: "Eishockey: Du {a} : {b} Gegner - R schießt",
  blockAnimal: "Mit Pfoten? Lieber nicht.",
  blockHave: "Ich hab doch schon einen Block!",
  blockTaken: ["Ein Schneeblock!", "Schwer - aber geht!", "Ab zur Baustelle!"],
  blockSet: ["Passt!", "Noch einer drauf!", "Sitzt fest!"],
  wallDone: "Die Mauer steht! Jetzt die Türme.",
  towersDone: "Türme fertig! Fehlt nur noch die Fahne.",
  flagUp: ["Fahne hoch - die Burg ist fertig!", "Meine Schneeburg!"],
  castleDone: "Eine prächtige Burg!",
  castleNeedBlock: "Hol einen Schneeblock vom Haufen!",
  castleMelting: "Oje, sie schmilzt ... gleich kann man neu bauen.",
  castleCount: "Schneeburg: {n} von 8 Blöcken",
  balloonFlying: "Erst landen, dann einsteigen!",
  balloonAnimal: "Als Tier in den Korb? Lieber nicht.",
  balloonTaken: "Der Ballon ist gerade unterwegs.",
  balloonUp: ["Leinen los!", "Auf in die Lüfte!", "Huiii - wir steigen!"],
  balloonDown: ["Wir landen!", "Sanft runter ..."],
  balloonNoLand: "Hier kann der Ballon nicht landen.",
  balloonNoRoom: "Kein Platz zum Aussteigen - weiter!",
  balloonLanded: ["Gelandet!", "Das war schön!", "Wieder auf dem Boden."],
  balloonLine: "Ballon - lenken, R/Benutzen: landen, Fähigkeit: Brenner",
  burner: ["Fauch!", "Mehr heiße Luft!"],
  roofSecret:
    "Da steht was auf dem Dach: ein goldener Pfeil nach Osten - ein Glöckchen im Ostwald!",
  cableFlying: "Erst landen, dann einsteigen!",
  cableAnimal: "Tiere dürfen leider nicht in die Gondel.",
  cableBusy: "Die Gondel ist gerade unterwegs.",
  cableUp: ["Ab auf den Gipfel!", "Gondel, los!", "Hoch hinaus!"],
  cableTop: ["Was für eine Aussicht!", "Ganz oben!", "Hier oben ist es kalt!"],
  cableDown: ["Wieder im Tal.", "Schöne Fahrt!"],
  skiNo: "So kann ich nicht Ski fahren.",
  skiGo: ["Ski heil!", "Abfahrt!", "Huiii!"],
  skiCrash: ["Autsch!", "Plumps - weiter!", "Wer hat den Baum da hingestellt?"],
  skiFinish: "Im Tal! Zeit:",
  skiBest: "Neue Bestzeit!",
  skiTime: "Abfahrt",
  skiRecord: "Bestzeit",
  seconds: "s",
  lighthouseNight: [
    "Klick - das Leuchtfeuer brennt!",
    "Licht für alle Schiffe!",
  ],
  lighthouseDay: "Das Licht dreht sich - nachts sieht man es richtig.",
  lighthouseOff: "Licht aus im Leuchtturm.",
  trainFlying: "Erst landen, dann einsteigen!",
  trainAnimal: "Tiere fahren hier nicht mit.",
  trainComing: "Der Zug kommt in etwa {s} Sekunden.",
  trainFull: "Der Zug ist voll.",
  trainOn: ["Einsteigen, bitte!", "Ich fahr mit!", "Tschu-tschu!"],
  trainOff: ["Aussteigen!", "Danke fürs Mitnehmen!", "Schöne Fahrt!"],
  trainNoRoom: "Hier ist kein Platz zum Aussteigen.",
  trainAlight: "Nächster Halt {name} - da steige ich aus!",
  trainStayOn: "Doch nicht - ich fahre weiter.",
  trainGettingOff: "du steigst aus",
  trainArrive: "Halt: {name}",
  trainSqueeze: "Hilfe, kein Platz!",
  trainNext: "Zug - nächster Halt: {name} (R: dort aussteigen)",
  trainWaiting: "Zug hält: {name} - R: aussteigen",
  whistle: ["Tuuut!", "Tschu-tschu!"],
  stationNames: {
    workshop: "Werkstatt-Bahnhof",
    observatory: "Sternwarte",
    market: "Weihnachtsmarkt",
    lighthouse: "Leuchtturm",
    south: "Südland",
  } satisfies Readonly<Record<StationId, string>>,
  platformHint: "R: einsteigen, wenn der Zug hält",
  signs: {
    hockey: ["Eishockey", "R: Anpfiff (bis 3 Tore)"],
    castle: ["Schneeburg-Baustelle", "R: Block setzen"],
    blocks: ["Schneeblöcke", "R: einen nehmen"],
    cableCar: ["Seilbahn - Talstation", "R: hinauf zum Gipfel"],
    lighthouse: ["Leuchtturm", "R: Licht an/aus"],
    summitStation: ["Seilbahn - Bergstation", "R: hinab ins Tal"],
    skis: ["Skiständer", "R: Abfahrt ins Tal"],
    panorama: ["Fernrohr", "R: Rundblick"],
  } satisfies Readonly<Record<PlaceSignId, readonly [string, string]>>,
  balloonName: "Heißluftballon",
  balloonBoard: "R: einsteigen",
} as const;

/** What is said and shown at the activities of part B. */
export const EXTRA_TEXTS = {
  toyWords: [
    "einen Teddy",
    "eine Eisenbahn",
    "eine Puppe",
    "einen Ball",
    "ein Geschenk",
  ],
  dailyDone: "Alle Tagesaufgaben geschafft!",
  concertStart: [
    "Ruhe da unten - jetzt wird gerockt!",
    "Eins, zwei, drei, vier!",
    "Bühne frei für Grantelbart!",
  ],
  concertCheer: ["Zugabe!", "Juhuu!", "Super!", "Nochmal!"],
  concertThanks: "Danke, danke ... grmpf. Gern geschehen.",
  concertLine: "Konzert! Alle tanzen - Grantelbart rockt",
  schoolOnlyGilfi: "Das ist Gilfis Zauberschule - nur er kann hier zaubern.",
  schoolRunning: "Die Stunde läuft doch schon!",
  schoolStart: "Zauberstunde! Fähigkeit: werfen, Stick: lenken.",
  schoolEnd: "Ende der Stunde: {n} Treffer!",
  schoolBest: "Neuer Rekord!",
  schoolAbort: ["Stunde abgebrochen.", "Zauberschule ist aus."],
  schoolLine:
    "Zauberschule: {n} Treffer - noch {s} s - Fähigkeit: werfen, Stick: lenken",
  mailOnlyTrixi: "Luftpost fliegt nur Trixi.",
  mailRunning: "Ich hab doch schon einen Auftrag!",
  mailHandsFull: "Erst die Hände frei machen!",
  mailStart: "Drei Pakete - ab auf die goldenen Dächer!",
  mailAbort: ["Auftrag abgebrochen.", "Oje, die Post bleibt liegen."],
  mailDropped: "Paket {n} von {of} abgeliefert!",
  mailDone: "Alle Pakete da! Zeit:",
  mailBest: "neue Bestzeit!",
  mailLine:
    "Luftpost: {n} von {of} Paketen - {t} - fliegend über die goldenen Ringe",
  angelsComplete: "Der Engelsstern leuchtet!",
  angelsMissing:
    "Engelfeld: Balbo fällt auf die Pflöcke - noch {n} Schneeengel fehlen.",
  angelMade: "Ein Schneeengel!",
  angelStar: "Ein Stern aus Schneeengeln!",
  nightStar: "Ein Nachtstern! ({n} von {of})",
  kidSad: "Schade ... dann geh ich wieder heim.",
  kidThanks: "Danke! Genau das hab ich mir gewünscht!",
  kidGiven: "Frohe Weihnachten!",
  kidWrong: "Hm, das wünsch ich mir aber nicht ...",
  kidWish: "Ich wünsche mir {toy}!",
  kidSecret: "Was ich mir wünsche? Das weiß nur der Weihnachtsmann!",
  partNames: [
    "Eine Schneekugel!",
    "Eine Möhre für die Nase!",
    "Ein Zylinder!",
    "Ein Eimer als Hut!",
    "Ein roter Schal!",
    "Ein grüner Schal!",
  ],
  contestJudged:
    "Die Jury hat schon gewertet - bald schmilzt er, dann geht's von vorn los.",
  contestEnoughBalls: "Drei Kugeln reichen!",
  contestBallsFirst: "Erst drei Kugeln aufeinander!",
  contestNeedBall: "Hol eine Schneekugel vom Haufen!",
  contestNeedParts: "Nase, Hut und Schal liegen an den Ständen.",
  contestPlaced: ["Passt!", "Schick!", "Schon besser!"],
  contestLine:
    "Schneemann: {balls} von 3 Kugeln - Nase {nose} - Hut {hat} - Schal {scarf}",
  contestYes: "ja",
  contestNo: "nein",
  juryWaiting: "Die Jury wartet auf einen Schneemann mit drei Kugeln.",
  juryVerdicts: [
    "",
    "",
    "Zwei Sterne - ganz schön kahl!",
    "Drei Sterne - nicht schlecht!",
    "Vier Sterne - fast perfekt!",
    "Fünf Sterne - ein Meisterwerk!",
  ],
  photoNew: "Klick! Foto {n} von {of} im Album.",
  photoAgain: "Klick! Noch ein schönes Foto.",
  starHint: "Eine Sternschnuppe! Schnell R oder Fähigkeit - wünsch dir was!",
  starWishGift: [
    "Ich wünsche mir ... oh, ein Geschenk!",
    "Mein Wunsch ist wahr geworden!",
  ],
  starWish: ["Ich hab mir was gewünscht!", "Psst - wird nicht verraten!"],
  wrapStart: "Papier, Schleife ...",
  wrapAlready: "Schon eingepackt - ab unter den Baum!",
  wrapNeedToy: "Erst ein Spielzeug aus der Maschine holen!",
  wrapDone: "Ich habe {toy} eingepackt!",
  treeLaid: [
    "Unter den Baum damit!",
    "Noch ein Geschenk!",
    "Der Stapel wächst!",
  ],
  treeHint:
    "Am Heiligabend ist hier Bescherung. Bis dahin: Geschenke darunter legen!",
  eveRunning: "Die Bescherung läuft!",
  eveOver: "Die Bescherung war wunderschön.",
  eveStart: "Ho ho ho! Kommt alle her - Bescherung!",
  eveCall: "Bescherung! Alle zum Baum!",
  eveThanks: [
    "Danke, Weihnachtsmann!",
    "Oh, wie schön!",
    "Für mich?",
    "Frohe Weihnachten!",
  ],
  eveEnd: "Frohe Weihnachten, ihr alle!",
  eveLine: "Heiligabend - Bescherung am Geschenkebaum",
  pileCount: "{n} Geschenke unter dem Baum",
  signs: {
    stage: ["Bühne", "Grantelbart: Gitarre spielen"],
    school: ["Gilfis Zauberschule", "R: Zauberstunde (nur Gilfi)"],
    airMail: ["Luftpost", "R: Auftrag (nur Trixi)"],
    angels: ["Engelfeld", "Balbo: auf die Pflöcke fallen"],
    contest: ["Schneemann-Wettbewerb", "Teile holen, aufs Feld, R: Jury"],
    packTable: ["Packtisch", "R: Spielzeug einpacken"],
    giftTree: ["Geschenkebaum", "R: Geschenk darunter legen"],
  } satisfies Readonly<Record<ExtraSignId, readonly [string, string]>>,
  labels: {
    stage: "Bühne",
    school: "Zauberschule",
    angels: "Engelfeld",
    contest: "Schneemann",
    giftTree: "Geschenkebaum",
  } as Readonly<Record<string, string>>,
  photoNames: {
    workshop: "Die Werkstatt",
    grantel: "Grantelbarts Haus",
    market: "Weihnachtsmarkt",
    slope: "Rodelhang",
    waterfall: "Am Wasserfall",
    lake: "See und Leuchtturm",
    stage: "Die Bühne",
    castle: "Eishockey und Burg",
    angels: "Engelfeld",
    summit: "Auf dem Gipfel",
  } satisfies Readonly<Record<PhotoId, string>>,
  tasks: {
    feed: "Füttere {n} Rentiere im Stall",
    snowball: "Wirf {n} Schneebälle",
    toy: "Bau {n} Spielzeuge an der Maschine",
    letter: "Sortiere {n} Briefe in der Poststube",
    carousel: "Fahr Karussell",
    train: "Fahr mit dem Zug bis zu einem Halt",
    sled: "Rodel einmal den Hang hinunter",
    lamp: "Knips {n} Laternen aus",
    photo: "Mach ein Foto an einem Fotopunkt",
    kid: "Erfülle einem Kind seinen Wunsch",
    wrap: "Pack {n} Geschenke ein",
    chat: "Plaudere {n}-mal mit anderen Figuren",
  } satisfies Readonly<Record<TaskKind, string>>,
  notebook: "Notizbuch",
  notebookOpen: "Notizbuch öffnen: Tagesaufgaben, Freunde, Fotoalbum",
  notebookTitle: "Notizbuch",
  notebookClose: "Schließen",
  dailyTitle: "Tagesaufgaben",
  dailyIntro:
    "Jeden Tag drei neue kleine Aufgaben - es zählt, was die gesteuerte Figur tut.",
  dailyNone: "Gleich da ...",
  dailyAll: "Heute alles geschafft!",
  dailyDays: "Tage mit allen Aufgaben:",
  friendsTitle: "Freundschaften",
  friendsIntro:
    "R vor einer anderen Figur: plaudern. Jedes Herz bringt neue Sprüche.",
  albumTitle: "Fotoalbum",
  albumIntro: "Fotos von den zehn Fotopunkten (Pfosten mit Kamera, R).",
  albumMissing: "noch kein Foto",
  bestsTitle: "Bestwerte und Sammlungen",
  bestPost: "Luftpost",
  bestSchool: "Zauberschule",
  bestSnowman: "Schneemann",
  bestPile: "Geschenke unter dem Baum",
  bestKids: "Glückliche Kinder",
  bestWishes: "Sternschnuppen-Wünsche",
  bestStars: "Nachtsterne",
  noTime: "noch keine",
  hits: "Treffer",
  stars: "Sterne",
} as const;

/** What friends say to each other, step by step. */
export const FRIEND_TEXTS: {
  /** What the character steered says, by step of friendship; {name} is the other. */
  readonly greetings: readonly (readonly string[])[];
  /** What the other answers, by character and step. */
  readonly replies: Readonly<
    Record<CharacterId, readonly (readonly string[])[]>
  >;
  /** The names of the steps. */
  readonly steps: readonly string[];
} = {
  greetings: [
    ["Hallo, {name}!", "Na, {name}?"],
    ["Hallo, {name}! Schön dich zu sehen.", "Wie geht's, {name}?"],
    ["{name}! Da bist du ja!", "Hey, {name}, was machst du so?"],
    ["{name}, mein Freund!", "Schön, dass es dich gibt, {name}!"],
    [
      "Mein bester Freund {name}!",
      "{name}! Ohne dich wär's nur halb so schön.",
    ],
  ],
  replies: {
    santa: [
      ["Ho ho - hallo!", "Grüß dich!"],
      ["Schön, dass du vorbeischaust!", "Hast du schon deinen Wunschzettel?"],
      ["Du hilfst mir sehr in der Werkstatt!", "Ein Plätzchen gefällig?"],
      ["Auf dich kann ich mich verlassen!", "Komm, wir trinken einen Punsch."],
      [
        "Mein liebster Helfer! Ho ho ho!",
        "Für dich hab ich ein ganz besonderes Geschenk.",
      ],
    ],
    balbo: [
      ["Brrr - hallo.", "Hast du Fisch?"],
      ["Schön kalt heute, was?", "Ich bin heute erst dreimal hingefallen!"],
      ["Willst du mit mir Schneeengel machen?", "Du bist nett!"],
      ["Mit dir macht sogar Hinfallen Spaß!", "Ich teil meinen Fisch mit dir!"],
      [
        "Bester Freund - für immer!",
        "Komm, ich drück dich - pass auf, ich fall gleich um!",
      ],
    ],
    jordi: [
      ["Oh, hallo!", "Hast du meine Fernbedienung gesehen?"],
      ["Ich hab eine neue Erfindung!", "Willst du ein Tier sehen?"],
      ["Du darfst meine Erfindung ausprobieren!", "Wir sind ein gutes Team!"],
      [
        "Für dich verwandle ich mich in jedes Tier!",
        "Mit dir ist alles ein Abenteuer!",
      ],
      [
        "Bester Freund! Ich erfinde dir was ganz Tolles!",
        "Wir zwei - unschlagbar!",
      ],
    ],
    trixi: [
      ["Hi!", "Wer fliegt mit?"],
      ["Wollen wir ein Wettfliegen machen?", "Juhu, Besuch!"],
      [
        "Du bist fast so schnell wie ich!",
        "Ich zeig dir meinen Lieblingsplatz!",
      ],
      ["Mit dir flieg ich überall hin!", "Du bist super!"],
      [
        "Allerbeste Freunde - für immer und ewig!",
        "Ich hab dir Glitzer mitgebracht!",
      ],
    ],
    gilfi: [
      ["*gähn* ... hallo.", "Hm?"],
      ["Na gut, ich bin wach.", "Willst du was schweben sehen?"],
      [
        "Für dich zaubere ich sogar vor dem Mittagsschlaf.",
        "Du bist gemütlich!",
      ],
      [
        "Mit dir ist es sogar wach schön.",
        "Ich lass dir einen Teddy schweben!",
      ],
      [
        "Bester Freund! Du darfst mein Kissen haben.",
        "Für dich steh ich sogar früh auf!",
      ],
    ],
    grantelbart: [
      ["Grmpf. Was willst du?", "Aus dem Weg!"],
      ["Na gut, du darfst kurz bleiben.", "Pah. Hallo."],
      ["Du bist ... gar nicht so schlimm.", "Willst du mein neues Riff hören?"],
      [
        "Grmpf ... ich mag dich. Sag's keinem!",
        "Du darfst mal an meine Gitarre.",
      ],
      [
        "Bester Freund? ... Na gut. Ja. Bester Freund!",
        "Für dich spiel ich sogar ein Weihnachtslied. Leise.",
      ],
    ],
    gugor: [
      ["Alles doof.", "Was willst du?"],
      ["Na gut. Hallo.", "Ich hab dich durchs Fernrohr gesehen."],
      [
        "Du bist weniger doof als die anderen.",
        "Willst du durchs Fernrohr gucken?",
      ],
      ["Psst ... du bist eigentlich ganz toll.", "Ich zeig dir meinen Ball."],
      [
        "Bester Freund. Nicht weitersagen!",
        "Wir zwei beobachten zusammen die Sterne!",
      ],
    ],
    rudolf: [
      ["Hallo!", "Meine Nase leuchtet!"],
      ["Willst du meine Nase blinken sehen?", "Hast du eine Möhre?"],
      ["Mit dir fliege ich gern eine Runde!", "Du bist nett!"],
      [
        "Für dich leuchte ich in jede dunkle Ecke!",
        "Wir sind ein tolles Gespann!",
      ],
      [
        "Bester Freund! Meine Nase leuchtet nur für dich!",
        "Zusammen ziehen wir jeden Schlitten!",
      ],
    ],
  },
  steps: ["Fremde", "Bekannte", "Kumpel", "Freunde", "Beste Freunde"],
};
