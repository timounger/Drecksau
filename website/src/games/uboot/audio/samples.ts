/**
 * Die Tondateien - und was passiert, solange es noch keine gibt.
 *
 * @module
 * @remarks
 * Unter `public/uboot/` liegen leere Platzhalter. **Eine leere Datei ist kein
 * Fehler, sondern ein Zustand:** Sie lässt sich nicht abspielen, dieses Modul
 * merkt sich das, und {@link ../audio/sounds} nimmt dann den gerechneten Ton,
 * den es ohnehin schon kann. Legt jemand später eine echte MP3 mit demselben
 * Namen hin, läuft sie - ohne dass eine Zeile Code sich ändert.
 *
 * Deshalb sagt hier jede Funktion zurück, **ob sie übernommen hat**. Das ist
 * der ganze Trick an der Stelle: Der Aufrufer braucht keine Liste, welche
 * Dateien es gibt, er versucht es und hat einen Plan B.
 *
 * Geladen wird mit `Audio`-Elementen und nicht über den Web-Audio-Kontext:
 * Eine Schleife, die man an- und ausschaltet, und ein Schuss, der sich selbst
 * überlagern darf, sind genau das, wofür ein Element gedacht ist.
 */
"use client";

/** Ein Geräusch, das einmal passiert. */
export type Sample =
  | "shot"
  | "launch"
  | "lay"
  | "boom"
  | "hit"
  | "critter"
  | "air"
  | "win"
  | "lose";

/** Und eines, das läuft, solange etwas der Fall ist. */
export type Loop = "music" | "engine";

/** Der Unterpfad, unter dem die Seite liegt - auf Pages ist das nicht die Wurzel. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Welche Datei zu welchem Moment gehört. */
const FILES: Readonly<Record<Sample, string>> = {
  shot: "sounds/harpune.mp3",
  launch: "sounds/torpedo.mp3",
  lay: "sounds/seemine.mp3",
  boom: "sounds/knall.mp3",
  hit: "sounds/treffer.mp3",
  critter: "sounds/kreatur.mp3",
  air: "sounds/luft.mp3",
  win: "sounds/sieg.mp3",
  lose: "sounds/verloren.mp3",
};

/** Und welche zu welcher Schleife. */
const LOOP_FILES: Readonly<Record<Loop, string>> = {
  music: "musik/tiefe.mp3",
  engine: "sounds/antrieb.mp3",
};

/** Was schon einmal probiert wurde, und was davon wirklich klingt. */
const tried = new Set<string>();
const ready = new Set<string>();

/** Die laufenden Schleifen, eine je Art. */
const running = new Map<Loop, HTMLAudioElement>();

/** Die volle Adresse einer Datei. */
function urlOf(file: string): string {
  return `${BASE_PATH}/uboot/${file}`;
}

/**
 * Sieht nach, ob eine Datei etwas hergibt.
 *
 * @remarks
 * Einmal je Datei. Eine leere oder fehlende MP3 feuert `error` und landet nie
 * in `ready` - alles Weitere fragt nur noch diese Menge.
 */
function probe(file: string): void {
  if (!tried.has(file) && typeof Audio !== "undefined") {
    tried.add(file);
    try {
      const audio = new Audio(urlOf(file));
      audio.preload = "auto";
      audio.addEventListener("canplaythrough", () => ready.add(file), {
        once: true,
      });
      // Ein leerer Platzhalter feuert hier. Abgefangen wird er, damit die
      // Konsole sauber bleibt - gemerkt wird er gar nicht, denn alles, was
      // nicht in `ready` steht, gilt ohnehin als nicht vorhanden.
      audio.addEventListener("error", () => undefined, { once: true });
      audio.load();
    } catch {
      // Ein Browser ohne Audio ist still, und das ist in Ordnung.
    }
  }
}

/**
 * Lädt alles vor, was das Spiel gleich brauchen könnte.
 *
 * @remarks
 * Beim Öffnen des Spiels und nicht beim ersten Schuss: Sonst wäre der erste
 * Schuss gerechnet und der zweite geladen, und genau das hört man.
 */
export function warm(): void {
  for (const file of Object.values(FILES)) {
    probe(file);
  }
  for (const file of Object.values(LOOP_FILES)) {
    probe(file);
  }
}

/**
 * Spielt ein Geräusch, wenn es die Datei dazu gibt.
 *
 * @param sample - welcher Moment
 * @param volume - wie laut, von null bis eins
 * @returns true, wenn eine Datei übernommen hat
 */
export function fire(sample: Sample, volume: number): boolean {
  const file = FILES[sample];
  probe(file);
  let played = false;

  if (ready.has(file) && volume > 0) {
    try {
      // Jedes Mal ein eigenes Element: Zwei Schüsse kurz hintereinander
      // sollen sich überlagern und nicht einander abschneiden.
      const audio = new Audio(urlOf(file));
      audio.volume = volume;
      void audio.play().catch(() => undefined);
      played = true;
    } catch {
      played = false;
    }
  }

  return played;
}

/**
 * Schaltet eine Schleife an oder aus, wenn es die Datei dazu gibt.
 *
 * @param loop - welche
 * @param on - ob sie laufen soll
 * @param volume - wie laut, von null bis eins
 * @returns true, wenn eine Datei übernommen hat
 */
export function keep(loop: Loop, on: boolean, volume: number): boolean {
  const file = LOOP_FILES[loop];
  probe(file);
  let held = false;

  if (ready.has(file)) {
    try {
      const audio = running.get(loop) ?? born(loop, file);
      audio.volume = volume;
      if (on && volume > 0) {
        void audio.play().catch(() => undefined);
      } else {
        audio.pause();
      }
      held = true;
    } catch {
      held = false;
    }
  }

  return held;
}

/**
 * Stellt die Lautstärke der laufenden Schleifen nach.
 *
 * @param music - wie laut die Musik ist
 * @param sound - und wie laut alles andere
 */
export function level(music: number, sound: number): void {
  for (const [loop, audio] of running) {
    try {
      audio.volume = loop === "music" ? music : sound;
      if (audio.volume <= 0) {
        audio.pause();
      }
    } catch {
      // Ein Regler, der nicht greift, hält das Spiel nicht auf.
    }
  }
}

/** Hält alles an - fürs Verlassen des Spiels. */
export function quiet(): void {
  for (const audio of running.values()) {
    try {
      audio.pause();
    } catch {
      // still
    }
  }
}

/** Das Element einer Schleife, beim ersten Mal gebaut. */
function born(loop: Loop, file: string): HTMLAudioElement {
  const audio = new Audio(urlOf(file));
  audio.loop = true;
  running.set(loop, audio);
  return audio;
}
