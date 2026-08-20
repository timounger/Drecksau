# Kuhle Kühe - Spielregeln

Umsetzung des Kartenspiels von David Yakos (Gamewright / Game Factory, deutsche
Ausgabe 2019). Die Regeln stammen aus der beigelegten Anleitung
(`kuhle_kühe.pdf`) und sind vollständig daraus übernommen.

2 bis 5 Spieler, ab 9 Jahren, etwa 20 Minuten.

## Spielziel

Eine große Herde mit möglichst langen Kühen vor sich auslegen. Am Spielende
gibt es Punkte für die eigene Herde; wer die meisten hat, gewinnt.

## Material (90 Karten)

- **56 Kuhkarten:** 17 Köpfe, 22 Mittelteile, 17 Hinterteile
- **7 Kälber**
- **27 Aktionskarten**
- 3 Auszeichnungen (Erste Kuh, Größte Herde, Längste Kuh), 1 Muhdose

## Spielvorbereitung

Alle Karten mischen, **6 Handkarten** an jeden Spieler. Der Rest ist der
verdeckte Nachziehstapel.

## Ein Zug

### Phase 1: Neue Karten erhalten - genau eine der drei Aktionen

1. **Zwei Karten** vom Nachziehstapel ziehen.
2. **Eine Kuhkarte** (Kopf, Mitte oder Hinterteil) vom offenen Ablagestapel
   nehmen. Der Stapel darf durchsucht werden. Kälber und Aktionskarten dürfen
   **nicht** vom Ablagestapel genommen werden.
3. **Kuhhandel auslösen:** Jeder Spieler gibt seinem linken Nachbarn zwei
   beliebige Handkarten. Wer weniger als zwei Karten hat, zieht vorher auf.
   In der allerletzten Spielrunde ist der Kuhhandel nicht erlaubt.

### Phase 2: Karten ausspielen

Beliebig viele Kuh- und Aktionskarten, in beliebiger Reihenfolge. Auch mehrere
Kühe verschiedener Rassen. **Jede ausgespielte Kuh muss mindestens aus einem
Kopf und einem Hinterteil bestehen.**

### Zugende

Höchstens **8 Handkarten**. Überzählige kommen auf den offenen Ablagestapel.

## Die Karten

### Kühe

Drei Rassen: **Longhorn, Holstein, Hochland**. Eine Kuh wird aus passenden
Teilen **einer** Rasse ausgelegt. Reinrassige Kühe sind am Spielende **2 Punkte
je Karte** wert.

### Joker

Joker-Kuhteile passen zu jeder Rasse; es gibt Köpfe, Mittelteile und
Hinterteile. Sie dürfen beim Auslegen verwendet oder als Mittelteil in eine
bereits ausliegende Kuh eingebaut werden - **ohne Futterkarte**. Sie gehören zu
keiner Rasse: Eine Kuh mit mindestens einem Joker zählt nur **1 Punkt je
Karte**.

### Kälber

Ein Kalb wird als einzelne Karte ausgespielt, aber **erst, wenn schon eine
erwachsene Kuh ausliegt**. Es ist 1 Punkt wert und zählt als 1 Kuh für die
Auszeichnung „Die Größte Herde".

### Rassen-Kreuzung

Erlaubt ausnahmsweise eine Kuh aus verschiedenen Rassen. **Kuhliebe:** zwei
Rassen. **Verrückter Professor** und **Franken-Kuh:** bis zu drei. Joker zählen
dabei nicht als weitere Rasse. Die Karte wird beim Auslegen vorgezeigt und
abgelegt. Nachträglich kreuzen ist **nicht** möglich.

### Futter

Futterkarte (Heu, Wasser, Mais …) ablegen und dafür **ein passendes Mittelteil**
aus der Hand in eine eigene ausliegende Kuh einfügen.

### Angriff

Angriffskarten treffen die Herden der Mitspieler: eine ganze Kuh, ein oder
mehrere Mittelteile, oder ein Kalb. Benutzte Angriffskarten kommen zusammen mit
den entfernten Kuhkarten auf den Ablagestapel. **Ausnahme Viehdieb:** die
Angriffskarte wird abgelegt, die gestohlene Kuh aber vor dem neuen Besitzer
ausgelegt.

### Verteidigung

Der **Herdenhund** wird sofort gespielt, wenn man angegriffen wird. Bei Erfolg
kommen Verteidigungs- und Angriffskarte auf den Ablagestapel.

### Schutz

**Brandeisen** und **Stall** legt man im eigenen Zug zu einer eigenen Kuh; sie
schützen sie dauerhaft vor Angriffen. Eine Schutzkarte kann nur durch die
jeweils andere entfernt werden.

### Spezial

Etwa **Lasso** („Stiehl 1 beliebige Handkarte von einem Mitspieler") oder „Du
bist noch mal dran". Nach dem Ausführen abgelegt.
**Spezialkarten sind immun gegen Verteidigungskarten.**

## Auszeichnungen

Sie werden während des Spiels vergeben und wechseln den Besitzer:

| Auszeichnung          | Punkte | Bedingung                                          |
| --------------------- | -----: | -------------------------------------------------- |
| **Die Erste Kuh**     |      1 | Wer als Erster eine Kuh auslegt. Behält sie bis zum Spielende. |
| **Die Größte Herde**  |      2 | Meiste Kühe, mindestens 3. Kälber zählen mit.      |
| **Die Längste Kuh**   |      3 | Längste Kuh, mindestens 5 Karten.                  |

Größte Herde und Längste Kuh wandern erst, wenn jemand **echt mehr** hat.

## Spielende und Wertung

Das Spiel endet, sobald ein Spieler die **letzte Karte vom Nachziehstapel**
nimmt. Die anderen sind dann noch **jeweils einmal** am Zug.

| Was                      | Punkte        |
| ------------------------ | ------------- |
| Reinrassige Kühe         | 2 je Karte    |
| Gemischte/gekreuzte Kühe | 1 je Karte    |
| Kälber                   | 1 je Karte    |
| Auszeichnungen           | 1 bis 3       |

Handkarten zählen nichts. Die höchste Gesamtpunktzahl gewinnt.

## Was die Anleitung offen lässt

Die genaue Aufteilung der Karten steht laut Anleitung **auf dem Schachtelboden**,
der nicht vorlag. Festgelegt sind daher hier:

1. **Aufteilung der 56 Kuhkarten** auf Rassen und Joker.
2. **Aufteilung der 27 Aktionskarten** auf die Sorten.

Beides steht an einer Stelle in
[engine/cards.ts](../../../website/src/games/kuhle-kuehe/engine/cards.ts) und ist
in einer Zeile zu ändern. Die Gesamtzahlen (17/22/17, 7, 27, zusammen 90) sind
belegt.
