/**
 * Der Ton des Spiels - gerechnet, bis es Dateien dafür gibt.
 *
 * @module
 * @remarks
 * **Zwei Wege, ein Aufruf.** Unter `public/uboot/` liegen Tondateien; wenn
 * eine davon klingt, wird sie gespielt ({@link ../audio/samples}), und sonst
 * übernimmt der gerechnete Ton, der hier unten steht. Für den Rest des Spiels
 * ändert sich dadurch nichts: Es sagt weiter nur, **was** passiert ist.
 *
 * Solange die Dateien leer sind, hört man also genau das, was man schon immer
 * gehört hat - und in dem Moment, in dem jemand eine echte MP3 hineinlegt,
 * hört man die.
 *
 * Was hier gerechnet wird, sind ein paar Oszillatoren
 * und ein kurzes Rauschen: ein Blip für die Harpune, ein dumpfer Schlag für
 * einen Treffer, ein Knall für eine Explosion, drei Töne fürs Ankommen. Dazu
 * ein tiefes Brummen, das läuft, solange man unten ist. Für ein Spiel, das
 * seine ganze Welt zeichnet statt sie zu laden, ist das die passende Antwort -
 * und es kostet keine hundert Kilobyte Audio.
 *
 * **Alles hier ist optional.** Ein Browser ohne Web Audio, ein Kontext, der
 * nicht starten darf, eine Stummschaltung durch das Betriebssystem - nichts
 * davon darf das Spiel stören. Deshalb ist jede Berührung mit der Audio-Welt
 * eingepackt, und wenn sie schiefgeht, ist das Spiel eben still.
 *
 * Der Kontext entsteht erst beim ersten Ton, also nach einem Klick. Browser
 * lassen Ton ohne Zutun des Spielers nicht zu, und das ist auch richtig so.
 */
"use client";

import {
  fire,
  keep,
  level,
  quiet as stopFiles,
  settled,
  warm,
} from "@/games/uboot/audio/samples";

export { settled, warm };

/** Was das Spiel von sich geben kann. */
export type Noise =
  | "shot"
  | "launch"
  | "lay"
  | "boom"
  | "hit"
  | "critter"
  | "air"
  | "win"
  | "lose";

/** Wie die einzelnen Geräusche klingen. */
const VOICE = {
  /** Die Harpune: kurz, hell, mit einem Abwärtsrutscher. */
  shot: { from: 880, to: 220, life: 0.12, kind: "square", gain: 0.18 },
  /** Der Torpedo: tiefer, länger, mit Druck dahinter. */
  launch: { from: 300, to: 120, life: 0.3, kind: "sawtooth", gain: 0.22 },
  /** Und die gelegte Seemine: ein dumpfes Klacken, mehr nicht. */
  lay: { from: 160, to: 120, life: 0.1, kind: "triangle", gain: 0.3 },
  /** Ein Treffer an der Hülle: tief und kurz. */
  hit: { from: 180, to: 60, life: 0.22, kind: "square", gain: 0.35 },
  /** Ein zerschossener Bewohner: ein kurzes, nasses Platschen. */
  critter: { from: 520, to: 90, life: 0.18, kind: "triangle", gain: 0.3 },
  /** Die Warnung, wenn die Luft knapp wird. */
  air: { from: 1200, to: 1200, life: 0.09, kind: "sine", gain: 0.22 },
} as const;

/** Die vier Töne fürs Ankommen, in Hertz - ein Dur-Dreiklang mit Oktave. */
const NOTES = { root: 523, third: 659, fifth: 784, high: 1047 } as const;

/** Dieselben, in der Reihenfolge, in der sie kommen. */
const FANFARE: readonly number[] = [
  NOTES.root,
  NOTES.third,
  NOTES.fifth,
  NOTES.high,
];

/** Wie die Fanfare gespielt wird. */
const CHEER = { apart: 0.11, gain: 0.25, life: 0.3 } as const;

/**
 * Wie leise "aus" ist.
 *
 * @remarks
 * Nicht null: Ein exponentieller Verlauf kann die Null nicht erreichen, und
 * ein Versuch daran bringt manche Browser dazu, den Ton stehen zu lassen.
 */
const HUSH = 0.001;

/** Und ein Wimpernschlag Luft hinter jedem Ton, damit nichts abgehackt endet. */
const NUDGE = 0.01;

/** Und der Absturz, wenn es vorbei ist. */
const FALL = { from: 420, to: 70, life: 0.9, gain: 0.3 } as const;

/** Der Knall: Rauschen durch einen Filter, der schnell zufällt. */
const BOOM = {
  life: 0.45,
  gain: 0.5,
  from: 1400,
  to: 120,
} as const;

/** Das Brummen der Tiefe. */
const DRONE = {
  /** Zwei Töne, ein paar Hertz auseinander - das gibt die Schwebung. */
  low: 54,
  beat: 1.6,
  /** Wie weit der Filter offen ist, und wie langsam er atmet. */
  open: 320,
  breath: 0.07,
  sway: 90,
  gain: 0.5,
  /** Wie lange es zum Ein- und Ausblenden braucht, in Sekunden. */
  fade: 0.8,
} as const;

/** Wie lange ein Ton zum Ausklingen hat, als Anteil seiner Länge. */
const TAIL = 0.9;

/** Wie laut es insgesamt ist - zwei Regler, zwei Summen. */
let levels = { music: 0, sound: 0 };

/** Der Kontext und alles, was dauerhaft daran hängt. */
type Rig = {
  readonly ctx: AudioContext;
  readonly sound: GainNode;
  readonly music: GainNode;
  readonly noise: AudioBuffer;
  drone: { readonly stop: () => void } | null;
};

/** Erst beim ersten Ton gebaut, danach wiederverwendet. */
let rig: Rig | null = null;

/**
 * Stellt beide Lautstärken ein.
 *
 * @param music - wie laut das Brummen ist, von null bis eins
 * @param sound - und wie laut die Geräusche sind
 */
export function setLevels(music: number, sound: number): void {
  levels = { music, sound };
  level(music, sound);
  if (rig !== null) {
    try {
      rig.music.gain.value = music;
      rig.sound.gain.value = sound;
    } catch {
      // Ein Regler, der nicht greift, ist kein Grund, das Spiel anzuhalten.
    }
  }
}

/**
 * Spielt ein Geräusch.
 *
 * @param noise - welches
 */
export function play(noise: Noise): void {
  // Erst die Datei: Gibt es eine, die klingt, ist hier Schluss.
  if (levels.sound <= 0 || fire(noise, levels.sound)) {
    return;
  }
  const here = wake();
  if (here === null) {
    return;
  }
  try {
    switch (noise) {
      case "boom":
        knock(here);
        break;
      case "win":
        fanfare(here);
        break;
      case "lose":
        sink(here);
        break;
      default:
        blip(here, VOICE[noise]);
    }
  } catch {
    // still
  }
}

/**
 * Schaltet die Musik an oder aus - oder das Brummen, solange es keine gibt.
 *
 * @param on - ob getaucht wird
 */
export function hum(on: boolean): void {
  if (keep("music", on, levels.music)) {
    return;
  }
  const here = wake();
  if (here === null) {
    return;
  }
  try {
    if (on && here.drone === null) {
      here.drone = drone(here);
    }
    if (!on && here.drone !== null) {
      here.drone.stop();
      here.drone = null;
    }
  } catch {
    // still
  }
}

/**
 * Die Musik der Seekarte.
 *
 * @param on - ob die Karte zu sehen ist
 * @remarks
 * Ein eigenes Stück, nicht dasselbe wie unten: Über Wasser schaut man auf eine
 * Karte und sucht sich etwas aus, unten taucht man. Nur als Datei und ohne
 * gerechnete Ersatzstimme - ein Dauerton auf einer Übersichtsseite ist das
 * Erste, was man abschaltet.
 */
export function chart(on: boolean): void {
  keep("chart", on, levels.music);
}

/**
 * Das Fahrgeräusch, solange Schub anliegt.
 *
 * @param on - ob gerade vorwärts gefahren wird
 * @remarks
 * Nur als Datei und ohne gerechnete Ersatzstimme: Ein dauerhafter Ton, den
 * niemand bestellt hat, ist das Erste, was man abschaltet. Liegt irgendwann
 * eine echte Aufnahme dort, läuft sie von selbst mit.
 */
export function engine(on: boolean): void {
  keep("engine", on, levels.sound);
}

/**
 * Macht alles still - Dateien **und** gerechneten Ton.
 *
 * @remarks
 * Für den Moment, in dem das Spiel verlassen wird. Dass der Dauerton dabei mit
 * aufhört, ist der ganze Grund für diese Funktion: Wer auf "Zurück zur
 * Spielesammlung" klickt, hat das Spiel verlassen - und ein Brummen, das ihm
 * dorthin folgt, sucht er auf der nächsten Seite vergeblich.
 *
 * Still ist hier endgültig und nicht pausiert: Der nächste Tauchgang schaltet
 * mit {@link hum} von selbst wieder ein.
 */
export function quiet(): void {
  stopFiles();
  hum(false);
  engine(false);
}

/** Der Kontext, gebaut beim ersten Mal. */
function wake(): Rig | null {
  if (rig === null) {
    try {
      const ctx = new AudioContext();
      const sound = ctx.createGain();
      const music = ctx.createGain();
      sound.gain.value = levels.sound;
      music.gain.value = levels.music;
      sound.connect(ctx.destination);
      music.connect(ctx.destination);
      rig = { ctx, sound, music, noise: hiss(ctx), drone: null };
    } catch {
      rig = null;
    }
  }
  // Nach einem Tabwechsel schläft er; ein Weckruf schadet nie.
  if (rig !== null && rig.ctx.state === "suspended") {
    void rig.ctx.resume().catch(() => undefined);
  }
  return rig;
}

/** Eine Sekunde Rauschen, einmal gewürfelt und dann immer dasselbe. */
function hiss(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let at = 0; at < data.length; at += 1) {
    data[at] = Math.random() * 2 - 1;
  }
  return buffer;
}

/** Ein einzelner Ton mit Rutscher. */
function blip(
  here: Rig,
  voice: { from: number; to: number; life: number; kind: string; gain: number },
): void {
  const now = here.ctx.currentTime;
  const tone = here.ctx.createOscillator();
  const level = here.ctx.createGain();
  tone.type = voice.kind as OscillatorType;
  tone.frequency.setValueAtTime(voice.from, now);
  tone.frequency.exponentialRampToValueAtTime(voice.to, now + voice.life);
  level.gain.setValueAtTime(voice.gain, now);
  level.gain.exponentialRampToValueAtTime(
    HUSH,
    now + voice.life * TAIL + NUDGE,
  );
  tone.connect(level);
  level.connect(here.sound);
  tone.start(now);
  tone.stop(now + voice.life);
}

/** Ein Knall: Rauschen durch einen zufallenden Filter. */
function knock(here: Rig): void {
  const now = here.ctx.currentTime;
  const source = here.ctx.createBufferSource();
  const filter = here.ctx.createBiquadFilter();
  const level = here.ctx.createGain();
  source.buffer = here.noise;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(BOOM.from, now);
  filter.frequency.exponentialRampToValueAtTime(BOOM.to, now + BOOM.life);
  level.gain.setValueAtTime(BOOM.gain, now);
  level.gain.exponentialRampToValueAtTime(HUSH, now + BOOM.life);
  source.connect(filter);
  filter.connect(level);
  level.connect(here.sound);
  source.start(now);
  source.stop(now + BOOM.life);
}

/** Vier Töne aufwärts - angekommen. */
function fanfare(here: Rig): void {
  FANFARE.forEach((note, step) => {
    const now = here.ctx.currentTime + step * CHEER.apart;
    const tone = here.ctx.createOscillator();
    const level = here.ctx.createGain();
    tone.type = "triangle";
    tone.frequency.setValueAtTime(note, now);
    level.gain.setValueAtTime(CHEER.gain, now);
    level.gain.exponentialRampToValueAtTime(HUSH, now + CHEER.life);
    tone.connect(level);
    level.connect(here.sound);
    tone.start(now);
    tone.stop(now + CHEER.life);
  });
}

/** Und einer abwärts - vorbei. */
function sink(here: Rig): void {
  const now = here.ctx.currentTime;
  const tone = here.ctx.createOscillator();
  const level = here.ctx.createGain();
  tone.type = "sawtooth";
  tone.frequency.setValueAtTime(FALL.from, now);
  tone.frequency.exponentialRampToValueAtTime(FALL.to, now + FALL.life);
  level.gain.setValueAtTime(FALL.gain, now);
  level.gain.exponentialRampToValueAtTime(HUSH, now + FALL.life);
  tone.connect(level);
  level.connect(here.sound);
  tone.start(now);
  tone.stop(now + FALL.life);
}

/**
 * Das Brummen: zwei tiefe Töne dicht nebeneinander, hinter einem Filter, der
 * langsam atmet.
 *
 * @remarks
 * Die paar Hertz Abstand sind das ganze Rezept - daraus entsteht die
 * Schwebung, die es nach Wasser und Maschine klingen lässt statt nach Sirene.
 */
function drone(here: Rig): { readonly stop: () => void } {
  const now = here.ctx.currentTime;
  const level = here.ctx.createGain();
  const filter = here.ctx.createBiquadFilter();
  const breath = here.ctx.createOscillator();
  const depth = here.ctx.createGain();
  const low = here.ctx.createOscillator();
  const beat = here.ctx.createOscillator();

  filter.type = "lowpass";
  filter.frequency.value = DRONE.open;
  breath.frequency.value = DRONE.breath;
  depth.gain.value = DRONE.sway;
  breath.connect(depth);
  depth.connect(filter.frequency);

  low.type = "sine";
  beat.type = "triangle";
  low.frequency.value = DRONE.low;
  beat.frequency.value = DRONE.low + DRONE.beat;
  low.connect(filter);
  beat.connect(filter);
  filter.connect(level);
  level.connect(here.music);

  level.gain.setValueAtTime(0, now);
  level.gain.linearRampToValueAtTime(DRONE.gain, now + DRONE.fade);

  low.start(now);
  beat.start(now);
  breath.start(now);

  return {
    stop: () => {
      const end = here.ctx.currentTime;
      try {
        level.gain.cancelScheduledValues(end);
        level.gain.setValueAtTime(level.gain.value, end);
        level.gain.linearRampToValueAtTime(0, end + DRONE.fade);
        low.stop(end + DRONE.fade);
        beat.stop(end + DRONE.fade);
        breath.stop(end + DRONE.fade);
      } catch {
        // still
      }
    },
  };
}
