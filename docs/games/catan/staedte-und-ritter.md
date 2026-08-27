# CATAN - Städte & Ritter

Spezifikation der Erweiterung von **Klaus Teuber** (KOSMOS 1998/2025), gelesen
aus `game_instructions/catan_ritter.pdf` (16 Seiten, Fließtext vollständig
eingebettet).

**Stand: spielbar.** Regeln, Computergegner und Anzeige
sind fertig; der Modus steht in den Einstellungen unter **Spiel** zur Wahl. Das
gewöhnliche Catan ist unverändert (1206 Tests grün). Was noch fehlt, steht unten
unter [Was noch zu tun ist](#was-noch-zu-tun-ist). Was schon läuft, steht in
[game-rules.md](game-rules.md); dort ist auch die Übersicht aller neun
Anleitungen.

## Was diese Erweiterung mit dem Grundspiel macht

Sie ersetzt Teile davon, statt nur etwas danebenzulegen. Das ist der Grund,
warum sie kein Schalter neben den drei Varianten aus *Händler & Barbaren* sein
kann, sondern ein eigener Modus:

| Grundspiel                | Städte & Ritter                                   |
| ------------------------- | -------------------------------------------------- |
| Entwicklungskarten        | **entfallen** - stattdessen 54 Fortschrittskarten  |
| 2 Würfel                  | **3 Würfel** (Ereignis, rot, gelb)                 |
| Größte Rittermacht        | **entfällt** („lasst ihr in der Schachtel")        |
| 10 Siegpunkte             | **13 Siegpunkte**                                  |
| 2. Gründung: Siedlung     | **Stadt**                                          |
| Handkartengrenze 7        | 7 **+ 2 je Stadtmauer**                            |

Längste Handelsroute bleibt.

## Handelswaren

Drei neue Sorten, an die drei Landschaften gebunden, die sie erzeugen:

| Landschaft | Rohstoff | Handelsware |
| ---------- | -------- | ----------- |
| Wald       | Holz     | **Papier**  |
| Weideland  | Wolle    | **Tuch**    |
| Gebirge    | Erz      | **Münzen**  |

Eine **Stadt** an Wald, Weideland oder Gebirge bringt **1 Rohstoff + 1
Handelsware** statt 2 Rohstoffen. An Hügelland und Ackerland bleibt es bei 2
Rohstoffen. Auf eine der beiden Kartenarten zu verzichten, um zwei gleiche zu
nehmen, ist ausdrücklich verboten. Eine **Siedlung** bringt weiterhin nur
1 Rohstoff.

Handelswaren liegen auf der Hand und zählen bei einer 7 mit. Gehandelt werden
darf in jede Richtung; beim Handel mit Vorrat oder Hafen müssen die abgegebenen
Handelswaren **dieselbe** Sorte sein. Nur Fortschrittskarten sind nicht
handelbar.

## Die drei Würfel

- **Ereigniswürfel** - vier Symbole: Barbarenschiff, Wissenschaft, Handel,
  Politik.
- **roter Augenwürfel** - die Bedingung für eine Fortschrittskarte.
- **gelber Augenwürfel** - zusammen mit dem roten der Ertragswurf.

Abgehandelt wird **in dieser Reihenfolge**: erst das Ereignis, dann der Ertrag.

> **Offen:** Wie oft welches Symbol auf dem Ereigniswürfel steht, sagt der
> Fließtext nicht - die Abbildung auf Seite 6 zeigt die vier *verschiedenen*
> Seiten, nicht ihre Verteilung. Üblich ist 3x Barbarenschiff und je 1x
> Wissenschaft, Handel, Politik. Das muss vor der Umsetzung aus dem Material
> bestätigt werden; es ist die einzige Zahl dieser Spezifikation, die nicht
> abgelesen ist.

## Der Stadtausbau

Drei Bereiche mit je fünf Stufen, jeder mit seiner eigenen Handelsware:

| Bereich          | Ware    | Stufe 1  | 2       | 3 (Vorteil)   | 4 (Metropole)   | 5             |
| ---------------- | ------- | -------- | ------- | ------------- | --------------- | ------------- |
| **Wissenschaft** | Papier  | Schule   | Bibliothek | **Aquädukt** | Theater      | Universität   |
| **Handel**       | Tuch    | Markt    | Zunft   | **Gilde**     | Bank            | Handelszentrum |
| **Politik**      | Münzen  | Rathaus  | Botschaft | **Festung** | Gericht        | Rat Catans    |

**Kosten:** Stufe 1 kostet 1 Handelsware der Sorte, Stufe 2 zwei, Stufe 3 drei,
Stufe 4 vier, Stufe 5 fünf.

**Die drei Vorteile ab Stufe 3**, für den Rest des Spiels:

- **Aquädukt** - gehst du beim Ertragswurf leer aus, nimm dir einen beliebigen
  Rohstoff. Gilt auch, wenn der Räuber schuld ist. **Nicht** bei einer 7.
- **Gilde** - Handelswaren im Verhältnis 2:1 tauschen (2 gleiche Handelswaren
  gegen 1 Rohstoff oder 1 Handelsware).
- **Festung** - erst ab hier dürfen Starke Ritter zu Mächtigen aufgewertet
  werden.

**Voraussetzung:** Ausbauen darf nur, wer mindestens eine Stadt hat. Wer alle
Städte verliert, behält die Ausbauten, kann aber keine neuen machen, bis wieder
eine Stadt steht.

### Metropolen

Wer als **Erste:r** Stufe 4 eines Bereichs baut, setzt einen Metropolenaufsatz
auf eine eigene Stadt. Eine Metropole zählt **4 Siegpunkte** (2 Stadt + 2
Metropole) und ist vor dem Barbarenüberfall immer geschützt.

Sie wechselt nur, wenn jemand anders **Stufe 5** desselben Bereichs erreicht.
Ab Stufe 5 ist sie sicher; andere dürfen Stufe 5 trotzdem noch bauen, um die
bessere Würfelzahl zu bekommen.

Eine Metropole braucht eine Stadt, auf die sie passt: Wer nur eine Stadt hat und
die schon Metropole ist, darf in den anderen Bereichen **nur bis Stufe 3**
ausbauen.

## Fortschrittskarten

54 Karten in drei Stapeln zu 18. Gezogen wird, wenn der Ereigniswürfel das
Symbol des Stapels zeigt **und** der rote Würfel die Bedingung der eigenen Stufe
erfüllt.

**Die Bedingung ist die Stufe plus eins**: Stufe 1 zieht bei einer 1-2, Stufe 2
bei 1-3, Stufe 3 bei 1-4, Stufe 4 bei 1-5, Stufe 5 bei 1-6. Wer in dem Bereich
noch auf „Stadt" steht, zieht nie. Beide Beispiele der Anleitung bestätigen das:
Stufe 1 = „Würfelzahlen 1 und 2", Stufe 3 = „+4" bei einer gewürfelten 3.

Erfüllen mehrere die Bedingung, ziehen alle - im Uhrzeigersinn, beginnend bei
der Person, die gewürfelt hat.

**Handgrenze:** höchstens 4 verdeckte Fortschrittskarten; Siegpunktkarten zählen
nicht mit. Kommt eine fünfte dazu, muss man sofort eine einsetzen (wenn man dran
ist) oder eine abgeben (wenn nicht). Ausgespielte Karten kommen verdeckt unter
ihren Stapel zurück. Fortschrittskarten zählen bei einer 7 **nicht** mit.

Gespielt wird **nach** dem Würfelwurf, beliebig viele pro Zug. Einzige Ausnahme:
**Alchemie**.

### Wissenschaft (18)

| Karte | Anzahl | Wirkung |
| ----- | ------ | ------- |
| Alchemie | 2 | Vor dem Wurf: beide Augenwürfel selbst bestimmen. Ereigniswürfel wird danach normal gewürfelt und **zuerst** ausgeführt. |
| Baukran | 2 | Ein Stadtausbau kostet diese Runde 1 Handelsware weniger. Gilt einmal. |
| Bergbau | 2 | Je Gebirgsfeld mit eigener Siedlung **oder** Stadt: 2 Erz. |
| Bewässerung | 2 | Je Ackerland mit eigener Siedlung **oder** Stadt: 2 Getreide. |
| Buchdruck | 1 | Siegpunkt, wird sofort offen ausgelegt. |
| Erfindung | 2 | Zwei Zahlenchips tauschen - nie 2, 12, 6 oder 8. |
| Ingenieurwesen | 1 | 1 Stadtmauer gratis. |
| Medizin | 2 | Stadt für 2 Erz + 1 Getreide statt 3 Erz + 2 Getreide. Nicht kombinierbar. |
| Schmiedekunst | 2 | 2 Ritter je 1 Stufe gratis aufwerten (Festung-Bedingung gilt). |
| Straßenbau | 2 | 2 Straßen gratis. |

### Handel (18)

| Karte | Anzahl | Wirkung |
| ----- | ------ | ------- |
| Der Händler | 6 | Händler auf ein Landschaftsfeld neben eigener Siedlung/Stadt. Dessen Rohstoff 2:1 tauschen, solange er dort steht. **Zählt 1 Siegpunkt.** Nur durch eine neue Händler-Karte versetzbar. |
| Handelshafen | 2 | Jeder anderen Person einmal 1 Rohstoff anbieten; sie muss dafür eine beliebige Handelsware geben, falls sie eine hat. Sie wählt aus. |
| Handelsflotte | 2 | Bis Zugende 1 gewählte Sorte beliebig oft 2:1 tauschen. |
| Abgaben | 2 | Von einer Person mit **mehr** Siegpunkten 2 Handkarten aussuchen und behalten. |
| Handelswaren-Monopol | 2 | Eine Handelsware bestimmen; alle geben 1 davon ab. |
| Rohstoff-Monopol | 4 | Eine Rohstoffsorte bestimmen; alle geben 2 davon ab (auch wer nur 1 hat, gibt die eine). |

### Politik (18)

| Karte | Anzahl | Wirkung |
| ----- | ------ | ------- |
| Steuern | 2 | Räuber versetzen; von **jeder** Person mit Siedlung/Stadt am neuen Feld 1 Handkarte ziehen (höchstens 1 je Person). |
| Diplomatie | 2 | Eine **offene** fremde Straße entfernen (ohne Abschluss durch gleichfarbige Straße/Figur). Eigene darf man sofort neu setzen. |
| Motivation | 2 | Alle eigenen Ritter sofort kostenlos aktivieren. |
| Hochzeit | 2 | Jede Person mit mehr Siegpunkten schenkt dir 2 Karten ihrer Wahl. |
| Intrige | 2 | Einen fremden Ritter von einer Kreuzung vertreiben, die man mit eigener Straße erreicht. |
| Sabotage | 2 | Alle mit gleich vielen oder mehr Siegpunkten verlieren die Hälfte ihrer Handkarten. |
| Spionage | 3 | Fortschrittskarten einer Person ansehen und 1 davon nehmen. |
| Verrat | 2 | Eine Person nimmt einen eigenen Ritter vom Feld; du stellst einen eigenen derselben Stufe und desselben Status auf. |
| Verfassung | 1 | Siegpunkt, wird sofort offen ausgelegt. |

## Ritter

Drei Stufen, je **2 pro Person**: Einfacher (1 Stärke), Starker (2), Mächtiger
(3). Wer beide einer Stufe im Feld hat, muss erst einen aufwerten, um wieder
einen dieser Stufe zu bauen.

| Aktion | Kosten | Regel |
| ------ | ------ | ----- |
| **Bauen** | 1 Wolle + 1 Erz | Freie Kreuzung im eigenen Straßennetz. **Keine Abstandsregel.** Unterbricht fremde Straßen und damit auch die Längste Handelsroute. |
| **Aktivieren** | 1 Getreide | Helm aufsetzen. Frühestens im **nächsten** Zug einsetzbar. |
| **Aufwerten** | 1 Wolle + 1 Erz | Aktiv wie passiv. Zustand bleibt. Pro Zug nur 1 Stufe je Ritter. Stufe 2 → 3 erst mit **Festung**. |

**Aktionen** - je aktivem Ritter eine pro Zug, danach wird er deaktiviert. Für
1 Getreide darf er im selben Zug wieder aktiviert werden, aber nichts mehr tun.

- **Versetzen** - auf eine freie Kreuzung, die über **eigene Straßen**
  verbunden ist. An fremden Rittern vorbei geht nicht. Eine Kreuzung trägt nur
  einen Ritter.
- **Vertreiben** - auf eine Kreuzung mit einem **schwächeren** fremden Ritter.
  Der Vertriebene muss auf eine freie Kreuzung derselben eigenen Handelsroute
  ausweichen, ohne fremde Ritter zu überspringen; geht das nicht, kommt er vom
  Feld. Eigene Ritter darf man nicht vertreiben.
- **Räuber vertreiben** - steht der Räuber auf einem der drei Nachbarfelder:
  wie eine Ritterkarte im Grundspiel (versetzen und 1 Karte ziehen).

Wer auf einer Kreuzung mit eigenem Ritter eine Siedlung bauen will, muss den
Ritter erst versetzen; geht das nicht, darf dort nicht gebaut werden.

## Stadtmauern

**2 Lehm**, höchstens 3, nur unter eine Stadt ohne Mauer. Jede erhöht die
Handkartengrenze bei einer 7 um **2**. Verliert man die Stadt, ist die Mauer
weg.

## Die Barbaren

Das Barbarenschiff startet auf dem entferntesten Feld der Fahrstrecke und rückt
bei jedem Barbarenschiff-Symbol ein Feld vor. Auf dem letzten Feld landet das
Heer.

- **Stärke der Barbaren** = Anzahl **aller** Städte und Metropolen auf Catan
  (aller Personen zusammen).
- **Stärke der Ritter** = Summe der Fähnchenspitzen aller **aktivierten**
  Ritter.
- Die Ritter gewinnen bei **gleich stark oder stärker**.

**Ritter gewinnen:** Wer allein die meisten Spitzen beigesteuert hat, bekommt
1 Siegpunkt-Chip. Bei Gleichstand ziehen alle Beteiligten stattdessen eine
Fortschrittskarte ihrer Wahl - keine Chips.

**Barbaren gewinnen:** Es trifft die Person(en) mit den **wenigsten** Spitzen -
aber nur, wer eine Stadt besitzt. Eine Stadt wird zur Siedlung (Mauer weg).
Metropolen sind geschützt. Kann die Ärmste nichts verlieren, trifft es die
Zweitärmste, und so weiter. Im Extremfall verlieren alle eine Stadt.

Wer schon alle 5 Siedlungen verbaut hat, legt die verlorene Stadt **auf die
Seite**: sie gilt als Siedlung und muss zum vollen Stadtpreis zurückgebaut
werden. Mit nur einer solchen Stadt sind keine Stadtausbauten möglich.

Danach werden **alle** Ritter deaktiviert und das Schiff auf sein Startfeld
zurückgesetzt.

### Der Räuber ist anfangs festgesetzt

Er steht auf der Steinhalbinsel und darf **nicht versetzt werden**, bis die
Barbaren zum ersten Mal gelandet sind - auch nicht durch Ritter oder
Fortschrittskarten. Bei einer 7 wird bis dahin nur abgeworfen, niemand zieht
eine Karte. Danach kommt er in die Wüste und darf normal versetzt werden.

Ausnahme: Fällt in der Runde, in der die Barbaren landen, eine 7, darf er schon
versetzt werden - der Überfall wird ja vor dem Ertrag abgehandelt.

## Variante mit mehr Taktik

Nach der Landung entscheidet reihum ab der aktiven Person, **wie viele Ritter**
jede:r einsetzt. Nur die eingesetzten werden danach deaktiviert. Man darf
absichtlich nicht verteidigen, um anderen zu schaden.

## Was die Umsetzung noch entscheiden muss

Vier Stellen, die eine Anleitung einem Tisch überlässt und ein Bildschirm nicht:

1. **Die Verteilung des Ereigniswürfels** (siehe oben) - muss belegt werden.
2. **Reihenfolge beim gemeinsamen Ziehen.** Mehrere ziehen im Uhrzeigersinn ab
   der würfelnden Person; am Bildschirm wird das eine Warteschlange wie beim
   Abwerfen nach einer 7.
3. **Wen die Barbaren treffen, wenn es mehrere gleich trifft.** Die Regel ist
   eindeutig, aber die Auswahl *welche* Stadt jemand verliert, ist es nicht -
   das muss die betroffene Person wählen dürfen, nicht der Schiedsrichter.
4. **Die Zielkreuzung eines vertriebenen Ritters** wählt dessen Besitzer:in,
   nicht die angreifende Person - also eine weitere Unterbrechung wie das
   Abwerfen.

## Was noch zu tun ist

Fertig und gegen die Anleitung geprüft:

- `engine/knights.ts` - Handelswaren und welche Landschaft sie macht, die drei
  Leisten mit allen fünfzehn Gebäudenamen, Ausbaukosten, die Würfelbedingung,
  Ritterstufen, Barbarenstrecke, Stadtmauern, 13 Siegpunkte.
- `engine/progress.ts` - alle **54 Karten**, 18 je Stapel nachgezählt, mit Text
  und Rückgabe-Stapel.
- Der Zustand: `mode`, Handelswaren als zweite Hand, Tableau, Mauern,
  Fortschrittskarten, Ritter auf eigenem Kreuzungs-Brett, Barbarenstand,
  Metropolen, Händler.
- Alte Spielstände laden weiter; die neuen Felder werden beim Laden aufgefüllt.

Geprüft wurden dabei beide Rechenbeispiele der Anleitung: Stufe 1 zieht bei
Würfel 1-2, Stufe 3 bei „+4" und damit auch bei einer gewürfelten 3.

Dazu fertig:

- **Der Schiedsrichter** (`engine/ritter.ts` und `engine/moves.ts`): drei Würfel
  in der Reihenfolge Ereignis-vor-Ertrag; Städte, die Rohstoff *und*
  Handelsware bringen; Stadtausbau samt Metropolen und den drei Vorteilen;
  Stadtmauern, die die Handkartengrenze heben; Ritter bauen, aktivieren,
  aufwerten, versetzen, vertreiben, Räuber verjagen; der Barbarenzug mit
  Auswertung, Belohnung und Überfall; der bis zur ersten Landung festgesetzte
  Räuber; 13 Siegpunkte; Stadt statt zweiter Siedlung.
- **Alle 22 Kartenwirkungen**, mit einer einzigen Phase statt zwölf: Die Karte
  auf dem Tisch sagt selbst, was sie fragt - genau wie bei den Ereigniskarten.
- **Der Computergegner** für all das.

Im Selbstspiel über zehn Partien (108 bis 216 Züge, alle beendet) wurden **21
der 23 spielbaren Karten** tatsächlich gespielt, ohne eine einzige Blockade.
Die zwei fehlenden spielt der Computer bewusst nicht: **Alchemie** (die eigenen
Würfel gut zu bestimmen braucht einen Plan für den Zug, und geraten ist sie
schlechter als würfeln) und **Erfindung** (zwei Zahlenchips zu tauschen ist eine
offene Wahl, bei der Raten schadet). Beide sind im Schiedsrichter da und für
Menschen spielbar.

Zwei Fehler hat das Selbstspiel gefunden: ein **Zwangshandel zwischen den zwei
Würfen** von CATAN für Zwei kehrte in die falsche Phase zurück, und der
Computer spielte **Medizin** ohne die Rohstoffe dafür und blieb dann in der
Kartenphase stehen. Seither prüft er eine Karte, indem er ihre Antwort
durchrechnet, statt nur zu fragen, ob eine existiert.

Dazu die Anzeige:

- **Fortschritt-Tableau** - drei Spalten, fünf Stufen, alle fünfzehn
  Gebäudenamen; ★ auf der Vorteilsstufe, ♛ auf der Metropolenstufe, darunter
  die Würfelzahl, bei der man zieht, und der Preis auf dem Knopf.
- **Barbarenleiste** mit dem Stärkevergleich **vor** der Landung. Genau das ist
  ja die Frage, die die Erweiterung jede Runde stellt: Lohnt sich ein Getreide,
  um noch einen Ritter zu wecken? Eine Zahl, die man erst sieht, wenn es zu
  spät ist, kann niemand nutzen.
- **Ritter auf dem Brett** als Schild: gefüllt = wach, hohl = passiv, Punkte =
  Stärke, dickere Kontur = die eigenen. Was sich jede Runde ändert und über den
  Überfall entscheidet, ist damit die Form selbst.
- **Handelswaren** in derselben Zeile wie die Rohstoffe, nur umrandet statt
  gefüllt. Sie liegen auf der Hand, werden wie Rohstoffe gehandelt und zählen
  bei der 7 mit - ein eigener Kasten würde behaupten, sie wären etwas anderes.
- **Kartenaufforderungen** in einer Anzeige für alle sechzehn, so wie der
  Schiedsrichter eine Phase für alle hat.
- **Online** sind Handelswaren und Fortschrittskarten geschwärzt; nur die
  beiden Siegpunktkarten bleiben offen, weil die Anleitung sie offen auslegt.

Offen bleibt eine Kleinigkeit: Online setzt der Gastgeber bisher **überhaupt
keine** Optionen - auch die Varianten nicht -, also gibt es dort noch keine
Modusauswahl. Der Adapter nimmt sie entgegen; es fehlt die Bedienung dafür.
