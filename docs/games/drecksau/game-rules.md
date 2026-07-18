# Drecksau - Spielregeln als Spezifikation

Grundlage der Implementierung. Quelle: offizielle Kosmos-Anleitung
(Art.-Nr. 740276, Frank Bebenroth). Diese Datei ist die verbindliche
Referenz fuer die Engine in `website/src/games/drecksau/engine/`.

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

| Karte                  | Ziel                                              | Wirkung                                                                                  |
| ---------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Matsch                 | eigenes **sauberes** Schwein                      | wird zur Drecksau                                                                        |
| Regen                  | kein Ziel                                         | **alle** Drecksaeue ohne Stall werden sauber - auch die eigenen                          |
| Stall                  | **eigenes** Schwein (sauber oder dreckig)         | schuetzt vor Regen; schuetzt **nicht** vor Bauer-schrubbt-die-Sau                        |
| Blitz                  | Stall eines **Mitspielers**                       | Stall brennt ab; Stall, Blitzableiter und Bauer-aergere-dich kommen auf den Ablagestapel |
| Blitzableiter          | **eigener** Stall                                 | dieser Stall kann nie mehr abbrennen                                                     |
| Bauer-schrubbt-die-Sau | **fremde** Drecksau                               | wird sauber; wirkt auch im Stall                                                         |
| Bauer-aergere-dich     | **eigener** Stall, in dem eine **Drecksau** steht | verhindert jede Bauer-schrubbt-die-Sau-Aktion an diesem Schwein                          |

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

| Karte         | Anzahl | Engine-Typ  |
| ------------- | ------ | ----------- |
| Schönsau      | 16     | `beauty`    |
| Aus-dem-Staub | 12     | `dustOff`   |
| Glücksvogel   | 4      | `luckyBird` |

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

| Karte         | Ziel                                              | Wirkung                                                                                 |
| ------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Schönsau      | **jedes** Schwein, eigenes oder fremdes           | wird auf die Schweinekarte **gelegt**; darunter bleibt der bisherige Zustand            |
| Aus-dem-Staub | **jede** ausliegende Schönsau, eigene oder fremde | entfernt die Schönsau; darunter kommt wieder Sauberschwein oder Drecksau zum Vorschein  |
| Glücksvogel   | kein Ziel                                         | der Spieler darf **beide** anderen Handkarten sofort ausspielen, danach zieht er 3 neue |

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

## Zusatzkarten: Extra-Matsch und Lippenstift (Drecksau total)

Optional, eigene Einstellung, Standard: aus. Diese beiden Karten gibt es nur in
der Ausgabe **Drecksau total** (Art.-Nr. 682675, 2016/2022). Quelle: offizielle
Kosmos-Anleitung.

Beides sind **Verteidigungskarten** - keine Angriffe. Der Name taeuscht:
"Extra-Matsch" ist kein staerkerer Matsch, "Lippenstift" macht kein Schwein
schoen.

### Material

| Karte        | Anzahl | Engine-Typ | Gehoert zu  |
| ------------ | ------ | ---------- | ----------- |
| Extra-Matsch | 2      | `extraMud` | Grundspiel  |
| Lippenstift  | 2      | `lipstick` | Erweiterung |

Extra-Matsch verteidigt eine Drecksau, Lippenstift eine Schönsau. Lippenstift
kommt darum nur ins Spiel, wenn auch die Erweiterung Sauschön an ist - ohne
Schönsäue haette er nichts zu schuetzen.

### Wirkung

Beide Karten werden **nicht aktiv im eigenen Zug gespielt**. Sie liegen auf der
Hand und **loesen automatisch aus**, sobald ein passender Angriff eine eigene
Sau treffen wuerde. Die Karte wird dann verbraucht (Ablagestapel), der Angriff
laeuft ins Leere.

| Karte        | Schuetzt        | Gegen                                |
| ------------ | --------------- | ------------------------------------ |
| Extra-Matsch | eigene Drecksau | Bauer-schrubbt-die-Sau **und** Regen |
| Lippenstift  | eigene Schönsau | Aus-dem-Staub eines **Mitspielers**  |

- **Eine Karte rettet eine Sau.** Wuerde Regen mehrere eigene Drecksaeue
  waschen, schuetzt jede Extra-Matsch-Karte genau eine davon.
- **Lippenstift nur gegen fremdes Aus-dem-Staub.** Nimmt man die eigene Schönsau
  selbst mit Aus-dem-Staub ab, greift der Lippenstift nicht.
- Extra-Matsch schuetzt eine Drecksau auch vor dem **eigenen** Regen - man kann
  Regen spielen, um Gegner zu treffen, und die eigene Drecksau retten.

### Bewusste Festlegungen (automatische Variante)

Die Original-Anleitung laesst den Spieler die Karte im richtigen Moment
ausrufen. Diese Umsetzung spielt gegen den Computer, darum loest die
Verteidigung **automatisch** aus:

1. Haelt der Besitzer der angegriffenen Sau die passende Karte, wird sie
   eingesetzt - ohne Nachfrage. Man kann sie nicht fuer spaeter aufsparen.
2. Angreifbare Sauen bleiben **gueltige Ziele**, auch wenn ihr Besitzer sich
   verteidigen kann. Alles andere wuerde verraten, welche verdeckten Karten ein
   Mitspieler hat. Der Angriff wird also gespielt und dann abgewehrt - die
   Verteidigungskarte des Gegners ist danach verbraucht.
3. Verteidigungskarten sind **nicht aktiv spielbar**. Auf der eigenen Hand
   koennen sie nur abgelegt werden; ihren Nutzen entfalten sie von selbst.

## Abgrenzung: englische Ausgabe

Die englische Ausgabe ("Dirty Pig") ist erweitert (2-6 Spieler, 12 Staelle,
18 Schweine). Diese Implementierung folgt der **deutschen 66-Karten-Ausgabe**.

## Quellen

- Grundspiel: [offizielle Kosmos-Anleitung 2023 (Art.-Nr. 740276)](https://cms.kosmos.de/game-instructions/4002051740276_Drecksau_Manual_2023_web.pdf)
- Erweiterung: [Sauschön-Anleitung (Art.-Nr. 740375)](https://gesellschaftsspiele.spielen.de/uploads/files/2669/5718aca153430.pdf)
- [Drecksau (Spiel) - Wikipedia](<https://de.wikipedia.org/wiki/Drecksau_(Spiel)>)
