# TypeScript - Anleitung

Eine kompakte Einführung in die Programmiersprache TypeScript, mit Fokus auf das
Typsystem. Beispiele beziehen sich wo möglich auf dieses Projekt.

## Inhalt

- [Was ist TypeScript?](#was-ist-typescript)
- [Verhältnis zu JavaScript](#verhältnis-zu-javascript)
- [.ts vs .tsx](#ts-vs-tsx)
- [Variablen und Typ-Annotationen](#variablen-und-typ-annotationen)
- [Die Typen im Überblick](#die-typen-im-überblick)
- [Eigene Typen: type vs interface](#eigene-typen-type-vs-interface)
- [Generics](#generics)
- [Utility-Typen](#utility-typen)
- [Warum eigene Typen?](#warum-eigene-typen)
- [Compiler und Konfiguration](#compiler-und-konfiguration)

## Was ist TypeScript?

TypeScript ist eine von Microsoft entwickelte Programmiersprache, die auf
JavaScript aufbaut und es um ein **statisches Typsystem** erweitert. Code wird zu
normalem JavaScript kompiliert (transpiliert) und läuft danach überall, wo auch
JavaScript läuft - im Browser, in Node.js usw.

Der Hauptnutzen: Fehler werden bereits **beim Schreiben/Kompilieren** gefunden,
nicht erst zur Laufzeit. Der Editor kann zudem viel bessere Autovervollständigung
und Refactorings anbieten.

## Verhältnis zu JavaScript

- Jedes gültige JavaScript ist auch gültiges TypeScript.
- TypeScript fügt nur Typ-Informationen hinzu. Beim Kompilieren werden diese
  **entfernt** (Type Erasure) - zur Laufzeit existieren keine Typen mehr.
- Die Typen sind also reine Entwicklungshilfe, kein Laufzeit-Feature.

```ts
// TypeScript
function add(a: number, b: number): number {
  return a + b;
}

// kompiliert zu (JavaScript):
function add(a, b) {
  return a + b;
}
```

## .ts vs .tsx

- **`.ts`** = reines TypeScript (nur Logik, Typen, Daten).
- **`.tsx`** = TypeScript **mit JSX** (React-Markup wie `<div>...</div>`).

Die Sprache ist in beiden identisch - `.tsx` schaltet nur zusätzlich JSX frei.
Faustregel: Datei mit Komponenten/JSX -> `.tsx`, sonst -> `.ts`.

Stolperstein: In `.tsx` braucht ein generischer Pfeilausdruck ein Komma, damit er
nicht mit JSX verwechselt wird:

```tsx
const f = <T,>(x: T) => x; // in .tsx nötig
const f = <T>(x: T) => x;  // nur in .ts möglich
```

## Variablen und Typ-Annotationen

```ts
let name: string = "Timo"; // explizite Annotation
let age = 42;              // Typ wird abgeleitet (inferred) -> number
const aktiv = true;        // const -> Literal-Typ true
```

Oft muss man Typen gar nicht hinschreiben: TypeScript leitet sie aus dem Wert ab
("Type Inference"). Annotationen lohnen sich bei Funktionsparametern, Rückgaben
und öffentlichen Schnittstellen.

## Die Typen im Überblick

### 1. Primitive Typen

```ts
let a: string;    // Text:    "Hallo"
let b: number;    // Zahl:    42, 3.14 (Integer und Float zusammen)
let c: boolean;   // true / false
let d: bigint;    // sehr große Ganzzahlen: 9007199254740991n
let e: symbol;    // eindeutige Kennung: Symbol("id")
let f: null;      // bewusst "kein Wert"
let g: undefined; // "nicht gesetzt"
```

### 2. Spezial-Typen

| Typ       | Bedeutung                                                       |
| --------- | -------------------------------------------------------------- |
| `any`     | alles erlaubt, Typprüfung aus (möglichst vermeiden)            |
| `unknown` | "irgendwas", aber sicher - muss vor Nutzung geprüft werden     |
| `void`    | Rückgabewert "nichts" (typisch bei Funktionen ohne return)     |
| `never`   | "kommt nie vor" (Funktion wirft immer Fehler / Endlosschleife) |

### 3. Objekt- und Struktur-Typen

```ts
let arr: number[]; // Array (auch: Array<number>)
let tup: [string, number]; // Tupel - feste Länge und Reihenfolge
let obj: { name: string; age: number }; // Objekt-Form
let fn: (x: number) => string; // Funktionstyp
let map: Record<string, number>; // Objekt mit dynamischen Keys
```

### 4. Literal-Typen (genau dieser Wert)

```ts
let dir: "links" | "rechts"; // nur diese zwei Strings erlaubt
let bit: 0 | 1;
type Lang = "Deutsch" | "English"; // so in types.ts dieses Projekts
```

### 5. Zusammengesetzte Typen

```ts
type U = A | B; // Union:        A ODER B
type I = A & B; // Intersection: A UND B kombiniert
```

## Eigene Typen: type vs interface

```ts
// type-Alias: flexibel (auch Unions, Primitive, Tupel, Funktionen)
type OrderLine = { name: string; price: number; qty: number; taxGroup: number };

// interface: nur Objekte/Klassen, von außen erweiterbar
interface BonPrinterAppProps {
  articles: ArticleGrid;
  onContext?: (ctx: PosContext) => void;
}
```

**Faustregel:**

- `interface` für öffentliche Objekt-/Props-Strukturen (erweiterbar, klarere
  Fehlermeldungen).
- `type` für alles andere - Unions (`"a" | "b"`), Primitive-Aliase, Tupel,
  Funktionssignaturen.

## Generics

Generics sind "Typ-Platzhalter", die erst bei der Verwendung festgelegt werden.
So bleibt Code wiederverwendbar und trotzdem typsicher.

```ts
function first<T>(arr: T[]): T {
  return arr[0];
}

first([1, 2, 3]); // T = number  -> Rückgabe: number
first(["a", "b"]); // T = string  -> Rückgabe: string
```

## Utility-Typen

Eingebaute Helfer, die aus bestehenden Typen neue ableiten:

```ts
Partial<T>; // alle Felder optional
Required<T>; // alle Felder pflicht
Readonly<T>; // alle Felder unveränderbar
Pick<T, K>; // nur bestimmte Felder behalten
Omit<T, K>; // bestimmte Felder weglassen
Record<K, V>; // Objekt mit Keys K und Werten V
```

## Warum eigene Typen?

- **Single Source of Truth:** Ein Typ wie `Article` einmal definiert, überall
  identisch genutzt (Loader, Komponente, Sortierung).
- **Refactoring-Sicherheit:** Ergänzt man ein Feld (z. B. `taxGroup`), zeigt der
  Compiler sofort jede Stelle, die noch fehlt.
- **Lesbarkeit:** `OrderLine` sagt mehr als ein überall hinkopiertes
  `{ name: string; price: number; qty: number; taxGroup: number }`.

Eigene Typen sind also kein "schlechter Stil", sondern der eigentliche Zweck von
TypeScript. In diesem Projekt sieht man das in `features/pos-demo/types.ts`.

## Compiler und Konfiguration

- Geprüft/kompiliert wird mit `tsc` (TypeScript-Compiler).
- Einstellungen stehen in `tsconfig.json` (z. B. `strict`-Modus für strenge
  Prüfung).
- Nur Typen prüfen, ohne Dateien zu erzeugen:

```bash
npx tsc --noEmit
```

In diesem Projekt übernimmt Next.js das Kompilieren beim Build; die
Typprüfung läuft dabei automatisch mit.
