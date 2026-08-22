# Sky Team - Spezifikation

Kooperatives Würfelspiel von Luc Rémond, Le Scorpion Masqué / KOSMOS 2023/2024.
**Spiel des Jahres 2024.** Genau zwei Personen.

Quelle: die offizielle deutsche Anleitung, Art.-Nr. 684044
([kosmos.de](https://cms.kosmos.de/Downloads/4002051684044%20_Sky%20Team_Manual_01_DE_web.pdf)).
Alle Zahlen unten stammen daraus oder aus den Abbildungen darin; wo etwas
gelesen statt gefunden werden musste, steht es unter
[Was die Anleitung offen lässt](#was-die-anleitung-offen-lässt).

Umgesetzt ist das **erste Szenario, YUL Montréal-Trudeau**. Das Flug-Logbuch mit
den weiteren Flughäfen ist nicht Teil dieser Umsetzung.

## Der Kern

Zwei Personen fliegen ein Passagierflugzeug: die **Pilotin** (blau) und der
**Co-Pilot** (orange). Jede Person würfelt vier Würfel **hinter einem
Sichtschirm** und setzt sie abwechselnd auf Felder im Cockpit.

Und das ist das Spiel: **Ab dem Wurf herrscht Schweigen.** Abgesprochen wird
nur vor dem Würfeln, und über die eigenen Würfel darf dabei nie geredet werden.
Alles, was danach mitgeteilt wird, wird durch das Platzieren selbst mitgeteilt.

Eine Partie dauert **7 Runden**. Jede Runde:

1. **Absprache und Würfel werfen** - reden, dann je 4 Würfel verdeckt werfen.
2. **Würfel platzieren** - abwechselnd je 1 Würfel, bis alle 8 liegen.
3. **Rundenende** - 1000 Fuß sinken, Würfel zurücknehmen.

## Felder im Cockpit

| Feld              | Wer      | Anzahl | Zahlvorgabe        | Pflicht |
| ----------------- | -------- | ------ | ------------------ | ------- |
| **Ruder**         | beide    | 1 + 1  | beliebig           | ja      |
| **Triebwerke**    | beide    | 1 + 1  | beliebig           | ja      |
| **Fahrwerk**      | Pilotin  | 3      | 1/2, 3/4, 5/6      | nein    |
| **Landeklappen**  | Co-Pilot | 4      | 1/2, 2/3, 4/5, 5/6 | nein    |
| **Bremsen**       | Pilotin  | 3      | 2, 4, 6            | nein    |
| **Funk**          | beide    | 1 + 2  | beliebig           | nein    |
| **Konzentration** | beide    | 3      | beliebig           | nein    |

Liegt am Rundenende nicht je ein Würfel beider Farben auf **Ruder** und
**Triebwerken**, ist die Partie sofort verloren.

### Ruder

Sobald der zweite Würfel liegt, wird verglichen. Gleich? Nichts passiert.
Verschieden? Der Fluglage-Anzeiger dreht sich um die **Differenz** in Richtung
der Person mit dem höheren Würfel. Er wird am Rundenende **nicht**
zurückgesetzt.

Die Skala hat je Seite zwei sichere Schritte und dann ein **rotes ✕**. Erreicht
oder überschreitet der Anzeiger ein ✕ - also Position ±3 -, gerät das Flugzeug
ins Trudeln: **sofort verloren.**

Am Ende muss der Anzeiger genau auf **0** stehen.

### Triebwerke

Sobald der zweite Würfel liegt, ist die **Geschwindigkeit** die Summe beider.
Verglichen wird mit den zwei Aerodynamik-Markern:

| Geschwindigkeit                | Entfernungsleiste |
| ------------------------------ | ----------------- |
| ≤ blauer Marker                | 0 Felder          |
| zwischen blauem und orangem    | 1 Feld            |
| > oranger Marker               | 2 Felder          |

Blau startet bei **4**, Orange bei **8**. Jedes ausgefahrene Fahrwerksteil
schiebt Blau um 1 nach rechts (alle drei → 7), jede Landeklappe schiebt Orange
um 1 (alle vier → 12).

**Kollision:** Müsst ihr weiterfliegen, während auf der Aktuellen Position noch
Flugzeuge stehen - verloren.
**Über das Ziel hinaus:** Müsst ihr weiterfliegen, während der Flughafen auf der
Aktuellen Position ist - verloren.

### Funk

Ein Würfel mit Wert _n_ entfernt ein Flugzeug vom _n_-ten Feld von unten,
gezählt ab der Aktuellen Position. Eine **1** trifft also die Aktuelle Position.
Ist dort kein Flugzeug oder liegt das Feld hinter dem Flughafen, hat der Würfel
keine Wirkung.

### Fahrwerk, Landeklappen, Bremsen

Das **Fahrwerk** darf in beliebiger Reihenfolge ausgefahren werden, die
**Landeklappen** nur von oben nach unten, die **Bremsen** nur von links nach
rechts (erst 2, dann 4, dann 6).

Fahrwerk und Landeklappen müssen am Ende **vollständig** ausgefahren sein.
Bremsen nicht - aber die Bremsstärke entscheidet die Landung.

### Konzentration

Ein beliebiger Würfel auf einem freien Konzentrationsfeld nimmt **eine
Kaffeetasse** in den Vorrat, höchstens drei. Beim Platzieren eines Würfels darf
jede Person beliebig viele Tassen ausgeben, um den Wert je Tasse um 1 zu ändern
- nie aus dem Bereich 1 bis 6 heraus. Nicht ausgegebene Tassen bleiben über die
Runde hinaus liegen.

### Neuwurf

Auf der Höhenleiste liegen bei **6000** und **2000** Fuß Neuwurf-Plättchen.
Erreicht ihr diese Höhe, wandert das Plättchen in euren Vorrat. Ausgegeben
werden darf es jederzeit; dann werfen **beide** noch nicht platzierte Würfel neu.

## Der Anflug auf Montreal

Die Entfernungsleiste von der Startposition (Wolke) bis zum Flughafen, mit den
Flugzeugen, die dort zu Beginn liegen - abgezählt aus der Abbildung im
Aufbaukapitel der Anleitung:

| Feld    | 0 (Start) | 1 | 2 | 3 | 4 | 5 | 6 (Flughafen) |
| ------- | --------- | - | - | - | - | - | ------------- |
| Flugzeuge | 0       | 0 | 1 | 2 | 1 | 3 | 2             |

Zusammen **9 Flugzeuge**, genau wie die Anleitung sagt („9 auf der Leiste, 3
bleiben übrig").

Die Höhenleiste hat 7 Felder: 6000, 5000, 4000, 3000, 2000, 1000 und das
Flugzeug-Bild. Das Flugzeug-Bild ist die **letzte Runde**.

## Die letzte Runde

Sie beginnt, wenn der Flughafen auf der Aktuellen Position **und** das
Flugzeug-Bild auf der Aktuellen Höhe steht. Dann gilt bei den Triebwerken die
**Bremsstärke** statt der Aerodynamik-Marker.

**Gewonnen**, wenn alles davon zutrifft:

- kein Flugzeug mehr auf der Entfernungsleiste,
- alle Fahrwerksteile und alle Landeklappen ausgefahren,
- der Fluglage-Anzeiger genau waagerecht,
- die Geschwindigkeit nicht größer als die Bremsstärke.

**Verloren** vorher schon bei: Trudeln, Kollision, Überschießen, einer
vergessenen Pflichtbelegung, oder wenn die Höhe aufgebraucht ist, ohne dass der
Flughafen erreicht wurde („zu früh aufgesetzt").

## Was die Anleitung offen lässt

**1. Die Bremsstärke ist der höchste aktivierte Wert.** Die Anleitung sagt
„eure Geschwindigkeit muss kleiner sein als die Stärke eurer Bremsen" und zeigt
im selben Atemzug ein Beispiel, in dem Geschwindigkeit 4 mit den Bremsen 2 und 4
**gelingt**. Das „kleiner" bezieht sich also auf die Lage links vom Marker, und
der Marker steht rechts neben der zuletzt aktivierten Zahl. Umgesetzt als:
`Geschwindigkeit ≤ höchste aktivierte Bremse`. Ohne jede Bremse ist die Stärke
0 und die Landung damit unmöglich - was die Anleitung ausdrücklich bestätigt
(„der Marker darf nicht vor der 2 bleiben").

**2. Wer eine Runde beginnt.** Auf der echten Höhenleiste steht in jedem Feld
ein Pfeil, der die Startperson angibt; die Anleitung nennt nur „in der ersten
Runde die Pilotin". Hier beginnt die Pilotin und danach wechselt es rundenweise.

**3. Der Neuwurf wirft alles neu.** Am Tisch darf jede Person selbst wählen,
welche ihrer Würfel sie neu wirft. Auf zwei Bildschirmen wäre das eine eigene
Zwischenphase, in der beide gleichzeitig handeln müssten - und geschwiegen wird
ja auch noch. Umgesetzt: Ein ausgegebenes Plättchen wirft **alle noch nicht
platzierten Würfel beider Personen** neu. Der Zweck bleibt derselbe: aus einem
schlechten Wurf herauszukommen.

**4. Zu früh am Flughafen.** Die Anleitung lässt euch Warteschleifen fliegen.
Das ergibt sich hier von selbst: Der Flughafen ist erreicht, weiterfliegen wäre
Überschießen, also müsst ihr die Geschwindigkeit unten halten, bis die Höhe
aufgebraucht ist. Es braucht dafür keine eigene Regel.

**5. Das Schweigen.** Am Tisch ist es eine Abmachung unter Ehrenleuten. Hier
wird es zur Bauweise: Online sieht niemand die Würfel des anderen, und der
Textchat bleibt offen - wer schummeln will, kann es, genau wie am Tisch. Gegen
den Computer sieht der Computer deine Würfel **nie**; er entscheidet allein aus
dem, was im Cockpit offen liegt.
