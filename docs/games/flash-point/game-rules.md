# Flash Point: Fire Rescue - Spezifikation

Kooperatives Brettspiel von Kevin Lanzing. Quelle: die deutsche Anleitung als
Bild-PDF (`flash-point-fire-rescue.pdf`, 10 Seiten, kein eingebetteter Text) -
Seite für Seite gerendert und gelesen.

**Stand:** vollständig - Regeln und [Grundriss](#der-grundriss). Die einzige
Stelle, die eine Lesart ist und keine Tatsache, sind drei der elf Türen, die der
Scan zeigt und die Anleitung nicht zählt; sie stehen dort als offene Durchgänge.

Umgesetzt werden sollen die **Regeln für Anfänger** (Seite 2 bis 6). Auf Seite 6
steht ausdrücklich „Hier hören die Regeln für Anfänger auf"; alles danach -
Experten, Fahrzeuge, Gefahrstoffe, Brandherde, Heilung - bleibt draußen, genau
wie die Anleitung es selbst trennt.

## Ziel

Alle gewinnen oder verlieren zusammen. Gewonnen ist, wenn **7 Opfer** aus dem
brennenden Gebäude gerettet sind. Verloren, wenn **3 Opfer sterben** oder das
Gebäude einstürzt.

## Das Spielfeld

Ein Gitter von **6 Zeilen mal 8 Spalten**. Jedes Feld trägt seine Koordinate
unten rechts: der **rote Würfel** ist die Zeile (1-6), der **schwarze** die
Spalte (1-8). Außerhalb des Gebäudes liegt ein Ring aus Feldern, der ebenfalls
bespielt wird.

**Angrenzend** sind nur Felder direkt darüber, darunter, links und rechts -
niemals diagonal. Wände und geschlossene Türen trennen; ein Wandabschnitt mit
**zwei** Schadenszählern gilt als zerstört und trennt nicht mehr.

## Aufbau (Anfänger)

Aus dem Aufbaubild auf Seite 3 abgezählt und mit der Koordinatenliste auf
Seite 2 abgeglichen:

| Was                    | Wo                                                          |
| ---------------------- | ----------------------------------------------------------- |
| 10 Feuersymbole        | (2,2) (2,3) (3,2) (3,3) (3,4) (3,5) (4,4) (5,6) (5,7) (6,6) |
| 3 Einsatzsymbole (`?`) | (2,4) (5,1) (5,8)                                           |
| 8 Türsymbole           | geschlossen, in jeden der acht Eingänge                     |
| Feuerwehrleute         | jede:r auf ein beliebiges Feld **außerhalb** des Gebäudes   |

Einsatzsymbole: 12 Opfer und 6 Fehlalarme sind im Spiel, davon wandern 2 Opfer
und 1 Fehlalarm zurück in die Schachtel. Es bleiben **10 Opfer und 5
Fehlalarme**, alle verdeckt.

Nicht im Anfängerspiel: Heilung, Gefahrstoffe, Brandherde, Experten- und
Fahrzeugkarten.

## Ein Spielzug

1. **Aktionen ausführen** - 4 Aktionspunkte (AP)
2. **Das Feuer ausbreiten** - würfeln
3. **Einsatzsymbole auffüllen**

Nicht ausgegebene AP dürfen aufgespart werden, aber nie mehr als **4** insgesamt.

### Aktionen

| Aktion                                                 | Kosten |
| ------------------------------------------------------ | ------ |
| Bewegen auf ein Feld ohne Feuer oder mit Rauch         | 1 AP   |
| Bewegen auf ein Feld mit Feuer                         | 2 AP   |
| Ein Opfer tragen (nur auf Felder ohne Feuer)           | 2 AP   |
| Tür öffnen oder schließen                              | 1 AP   |
| Rauchsymbol entfernen (eigenes oder angrenzendes Feld) | 1 AP   |
| Feuersymbol auf Rauch umdrehen                         | 1 AP   |
| Feuersymbol entfernen                                  | 2 AP   |
| Wand einschlagen (Schadenszähler auf eigenes Feld)     | 2 AP   |
| Einsatzsymbol aufdecken (beim Betreten)                | 0 AP   |

Zwei harte Regeln: **Ein Opfer darf nie auf ein Feld mit Feuer getragen
werden**, und **der Zug darf nicht auf einem Feld mit Feuer enden.**

Ein Opfer aus dem Gebäude getragen = gerettet. Ein aufgedeckter Fehlalarm
kommt sofort weg.

### Das Feuer ausbreiten

Würfeln, Rauch auf das gewürfelte Feld legen. Dann:

- **Rauch auf Rauch** → eines auf Feuer umdrehen, das andere entfernen.
- **Rauch neben Feuer** → sofort auf Feuer umdrehen.
- **Rauch auf Feuer** → **Explosion**.

**Explosion:** In alle vier Richtungen vom Explosionsfeld aus:

- angrenzendes freies Feld → Feuer; angrenzender Rauch → wird Feuer;
- jede angrenzende Wand bekommt einen Schadenszähler;
- jedes angrenzende Türsymbol wird entfernt;
- liegt in einer Richtung bereits Feuer, entsteht eine **Druckwelle**, die in
  diese Richtung weiterläuft, bis sie trifft auf:
  - **freies Feld** → Feuer (auch außerhalb des Gebäudes),
  - **Feld mit Rauch** → wird Feuer,
  - **Wand** → Schadenszähler (eine zerstörte Wand hält nichts auf),
  - **geschlossene Tür** → Tür wird entfernt, der Eingang gilt danach als
    zerstörte Wand.

Druckwellen laufen durch zerstörte Wände und **offene** Türen - eine offene Tür,
durch die eine Druckwelle läuft, gilt danach als zerstört.

### Danach

- **Funkenschlag:** Jeder Rauch, der an Feuer grenzt, wird Feuer. So oft
  wiederholen, bis kein Rauch mehr an Feuer grenzt.
- Alle Feuerwehrleute auf einem Feld mit Feuer werden **zu Boden geworfen**:
  auf das nächstgelegene der vier Rettungswagenfelder außerhalb des Gebäudes;
  bei Gleichstand darf gewählt werden. Das Feuer bleibt liegen. Ein getragenes
  Opfer **stirbt**.
- Jedes Opfer und jedes Einsatzsymbol auf einem Feld mit Feuer kommt auf den
  Friedhof (unbekannte werden vorher umgedreht).
- Alle Feuersymbole **außerhalb** des Gebäudes werden entfernt.

### Einsatzsymbole auffüllen

Nach jedem Spielzug müssen **3 Einsatzsymbole** auf dem Plan liegen. Sind es
weniger, würfeln und ein zufälliges verdeckt auf das Feld legen. Feuer oder
Rauch dort wird vorher entfernt. Steht ein Feuerwehrmann darauf, sofort
aufdecken; ein Fehlalarm kommt sofort weg. Liegt dort schon ein Einsatzsymbol,
neu würfeln.

## Spielende

- **Sieg:** 7 Opfer gerettet. (Weiterspielen bis 10 ist erlaubt.)
- **Niederlage:** 3 Opfer getötet.
- **Einsturz:** Sind alle **24 Schadenszähler** verbaut, stürzt das Gebäude
  sofort ein. Alle verbliebenen Opfer kommen auf den Friedhof.

## Der Grundriss

Aus dem Scan des Spielplans übernommen sind die **Raumformen** - sie sind an den
Bodenfarben eindeutig:

| Raum         | Zeilen | Spalten |
| ------------ | ------ | ------- |
| Wohnzimmer   | 1-2    | 1-3     |
| Wohnzimmer   | 3-4    | 1-2     |
| Bad          | 1-2    | 4-5     |
| Schlafzimmer | 1-2    | 6-8     |
| Küche        | 3-4    | 3-6     |
| Spielzimmer  | 3-4    | 7-8     |
| Esszimmer    | 5-6    | 1-4     |
| Kinderzimmer | 5-6    | 5-7     |
| Gäste-WC     | 5-6    | 8       |

Der Wohnbereich ist ein L: zwei Rechtecke unter einem Namen, ohne Wand in der
Ecke.

**Die Türen sind eine Lesart.** Der Scan zeigt elf Stellen, die wie Türen
aussehen; die Anleitung nennt acht Türsymbole. Umgesetzt sind acht Türen und
drei offene Durchgänge:

- Türen nach draußen: (1,6) oben, (6,3) unten, (3,1) links, (4,8) rechts
- Türen innen: (1,3)|(1,4), (2,5)|(2,6), (4,6)|(4,7), (6,4)|(6,5)
- offene Durchgänge: (3,2)|(3,3), (2,8)|(3,8), (4,4)|(5,4), (6,7)|(6,8)

Geprüft wird, dass **mit allen Türen geschlossen** jedes der neun Zimmer
erreichbar bleibt.
