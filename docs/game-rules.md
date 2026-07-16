# Drecksau - Spielregeln als Spezifikation

Grundlage der Implementierung. Quelle: offizielle Kosmos-Anleitung
(Art.-Nr. 740276, Frank Bebenroth). Diese Datei ist die verbindliche
Referenz fuer die Engine in `website/src/game/`.

## Ziel

Wer zuerst nur noch Drecksaeue und kein sauberes Schwein mehr vor sich liegen
hat, gewinnt sofort.

## Spielmaterial (66 Karten)

12 doppelseitige Schweinekarten (Sauberschwein / Drecksau) und 54 Aktionskarten:

| Karte                  | Anzahl | Engine-Typ     |
| ---------------------- | ------ | -------------- |
| Matsch                 | 21     | `mud`          |
| Regen                  | 4      | `rain`         |
| Stall                  | 9      | `barn`         |
| Blitz                  | 4      | `lightning`    |
| Blitzableiter          | 4      | `lightningRod` |
| Bauer-schrubbt-die-Sau | 8      | `farmerScrubs` |
| Bauer-aergere-dich     | 4      | `barnDoor`     |

Summe der Aktionskarten: 54.

## Aufbau

- Schweine pro Spieler: **2 Spieler -> 5**, **3 Spieler -> 4**, **4 Spieler -> 3**.
  Uebrige Schweinekarten werden nicht benoetigt.
- Alle Schweine starten sauber.
- Jeder Spieler zieht **3 Handkarten**.

## Zugablauf

Reihum genau eine der folgenden Aktionen:

1. Eine Karte **ausspielen** (Wirkung siehe unten), oder
2. eine Karte **ungenutzt ablegen**, oder
3. wenn **keine** der 3 Handkarten spielbar ist: alle Handkarten offen zeigen,
   ablegen und **3 neue** Karten ziehen (Blockade-Regel).

Danach wird auf 3 Handkarten nachgezogen. Ist der Nachziehstapel leer, wird der
Ablagestapel gemischt und als neuer Nachziehstapel bereitgelegt.

## Kartenwirkungen

Angelegt werden an eigene Schweine: Stall, Blitzableiter, Bauer-aergere-dich.
Auf den Ablagestapel gehen: Matsch, Regen, Blitz, Bauer-schrubbt-die-Sau.

| Karte                  | Ziel                                      | Wirkung                                                                              |
| ---------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Matsch                 | eigenes **sauberes** Schwein              | wird zur Drecksau                                                                     |
| Regen                  | kein Ziel                                 | **alle** Drecksaeue ohne Stall werden sauber - auch die eigenen                       |
| Stall                  | **eigenes** Schwein (sauber oder dreckig) | schuetzt vor Regen; schuetzt **nicht** vor Bauer-schrubbt-die-Sau                     |
| Blitz                  | Stall eines **Mitspielers**               | Stall brennt ab; Stall, Blitzableiter und Bauer-aergere-dich kommen auf den Ablagestapel |
| Blitzableiter          | **eigener** Stall                         | dieser Stall kann nie mehr abbrennen                                                  |
| Bauer-schrubbt-die-Sau | **fremde** Drecksau                       | wird sauber; wirkt auch im Stall                                                      |
| Bauer-aergere-dich     | **eigener** Stall, in dem eine **Drecksau** steht | verhindert jede Bauer-schrubbt-die-Sau-Aktion an diesem Schwein                |

Ein Blitz entfernt Stall **und** eine daran liegende Bauer-aergere-dich-Karte auf
einmal. Ein Stall mit Blitzableiter ist gegen Blitz immun.

**Die gluecklichste Drecksau:** Stall + Blitzableiter + Bauer-aergere-dich an
einer Drecksau ergibt ein fuer den Rest des Spiels unangreifbares Schwein.

## Bewusste Festlegungen (in der Anleitung nicht geregelt)

Diese Punkte laesst die Original-Anleitung offen. Die Engine legt fest:

1. **Hoechstens ein** Stall, ein Blitzableiter und eine Bauer-aergere-dich-Karte
   pro Schwein. Ein zweiter Stall haette ohnehin keine Wirkung, da der
   Regenschutz binaer ist.
2. Ein Schwein **im Stall darf beschmutzt** werden. Der Regeltext erlaubt den
   Stall ausdruecklich auch an Sauberschweinen und schraenkt Matsch nicht ein.
   Das ist eine Kernstrategie: Stall an sauberes Schwein, spaeter Matsch - die
   Drecksau ist sofort regensicher.

## Erweiterung: Sauschön

Optional, in den Einstellungen zuschaltbar (Standard: aus). Quelle: offizielle
Kosmos-Anleitung (Art.-Nr. 740375, 2016).

> **Namenshinweis:** Die Erweiterung heisst **Sauschön**. Ein Kosmos-Produkt
> namens "Schau-schön" gibt es nicht.

### Material (32 Karten)

| Karte           | Anzahl | Engine-Typ  |
| --------------- | ------ | ----------- |
| Schönsau        | 16     | `beauty`    |
| Aus-dem-Staub   | 12     | `dustOff`   |
| Glücksvogel     | 4      | `luckyBird` |

Die Turnier-Marker (3 Pokale, 3 Matscheimer) sind nicht implementiert - sie
gehoeren zu einer optionalen Turnierwertung ueber mehrere Runden.

### Geaenderter Aufbau

- **Jeder Spieler erhaelt 3 Schweine** - unabhaengig von der Spielerzahl. Das
  weicht vom Grundspiel (5/4/3) ab und wird leicht uebersehen.
- Grundspiel- und Erweiterungskarten werden zusammen gemischt: 54 + 32 = 86.
- Handkarten bleiben 3, Spielerzahl bleibt 2-4.

### Geaenderte Siegbedingung

Es gewinnt, wer zuerst **entweder** nur noch Drecksaeue **oder** nur noch
Schönsaeue vor sich liegen hat. Eine Mischung gewinnt **nicht**. Man darf das
Ziel waehrend des Spiels wechseln.

### Kartenwirkungen

| Karte         | Ziel                                        | Wirkung                                                       |
| ------------- | ------------------------------------------- | ------------------------------------------------------------- |
| Schönsau      | **jedes** Schwein, eigenes oder fremdes     | wird auf die Schweinekarte **gelegt**; darunter bleibt der bisherige Zustand |
| Aus-dem-Staub | **jede** ausliegende Schönsau, eigene oder fremde | entfernt die Schönsau; darunter kommt wieder Sauberschwein oder Drecksau zum Vorschein |
| Glücksvogel   | kein Ziel                                   | der Spieler darf **beide** anderen Handkarten sofort ausspielen, danach zieht er 3 neue |

Weitere Glücksvoegel auf der Hand werden dabei ungenutzt mit abgelegt.

### Zusammenspiel mit dem Grundspiel

- **Regen:** Die Schönsau hat einen Schirm - sie bleibt bei Regen sauschön.
- **Nur Aus-dem-Staub entfernt eine Schönsau.** Matsch, Regen und
  Bauer-schrubbt-die-Sau koennen das **nicht**.
- **Bauer-aergere-dich** kann **nicht** an einen Stall angelegt werden, in dem
  eine Schönsau steht.
- Auf eine **Drecksau im vernagelten Stall** kann **keine** Schönsau gelegt
  werden.
- Folge daraus: Die "gluecklichste Drecksau" (Stall + Blitzableiter +
  Bauer-aergere-dich) kann nie mehr sauschön werden. Wer eine hat, **muss** das
  Spiel ueber Drecksaeue gewinnen.

### Bewusste Festlegung zur Schönsau (in der Anleitung nicht geregelt)

Die Anleitung sagt nur, dass Matsch, Regen und Bauer eine Schönsau nicht
**entfernen** koennen. Ob man das **verdeckte** Schwein darunter noch
veraendern darf, laesst sie offen. Die Engine legt fest: **Eine Schönsau
schirmt das Schwein vollstaendig ab** - Matsch, Regen und Bauer koennen ein
Schwein mit Schönsau nicht als Ziel waehlen. Das ist die naheliegende Lesart
und haelt den Zustand unter der Schönsau stabil.

## Abgrenzung: englische Ausgabe

Die englische Ausgabe ("Dirty Pig") ist erweitert (2-6 Spieler, 12 Staelle,
18 Schweine). Diese Implementierung folgt der **deutschen 66-Karten-Ausgabe**.

## Quellen

- [Kosmos-Anleitung 2023 (Art.-Nr. 740276)](https://cms.kosmos.de/game-instructions/4002051740276_Drecksau_Manual_2023_web.pdf)
- [Kosmos-Anleitung 03-0113](https://www.brettspielversand.de/mediafiles/spieleanleitungen/kosmos/03-0113_drecksau_anleitung.pdf)
- [Drecksau (Spiel) - Wikipedia](https://de.wikipedia.org/wiki/Drecksau_(Spiel))
