# Murdle - Spezifikation

Logikrätsel-Krimis aus **Murdle: Volume 1** von G. T. Karber. Quelle: die
Leseprobe `game_instructions/Murdle/Murdle Vol 1_9781250892317_BLAD.pdf`
("How to Solve", Fälle 1, 2, 36, 51, 76, Tipps 1-15, Lösungen 1-6).

## Der Kern

Ein Mord. Drei oder vier Verdächtige, ebenso viele Waffen, Orte und - ab
"Hartgesotten" - Motive. Jede Person hatte **genau eine** Waffe, war an
**genau einem** Ort und hatte **genau ein** Motiv; nichts teilen sich zwei.
Gesucht: **Wer? Womit? Wo? (Warum?)**

## Hinweise

- Jeder Hinweis ist wahr.
- Was ein Hinweis meint, steht oft in den Beschreibungen der Karten
  ("Logikbücher" -> schwerer Rucksack, "rote Samtsitze" -> Vorführraum) oder
  in den Attributen (Größe, Händigkeit, Augen, Haare, Sternzeichen, Gewicht,
  Material, drinnen/draußen).
- Beweisstücke (A: Logicos Detektivkoffer, B: astrologische Fibel) gehören zu
  den Hinweisen, die auf sie verweisen.
- Der letzte, fett gedruckte Hinweis sagt, wo die Leiche gefunden wurde. Wer
  dort war, ist der Mörder.

## Aussagen (ab "Okkultes Medium")

- **Der Mörder lügt, alle anderen sagen die Wahrheit.**
- Fehlt der Leichenfund, ist der einzige Lügner der Mörder.

## Schwierigkeiten

| Teil im Buch  | Hier            | Lupen | Neu                       |
| ------------- | --------------- | ----- | ------------------------- |
| How to Solve  | Einführung      | 0     | Übungsfall mit Lösungsweg |
| Elementary    | Elementar       | 1     | -                         |
| Occult Medium | Okkultes Medium | 2     | Aussagen                  |
| Hard Boiled   | Hartgesotten    | 3     | vier Verdächtige, Motive  |
| Impossible    | Unmöglich       | 4     | Motive und Aussagen       |

## Fallauswahl

- Chips für die Bücher (bisher "Murdle: Band 1", beim ersten Besuch gewählt;
  kein "Alle"), darunter Chips für die Schwierigkeiten des gewählten Buchs
  samt "Alle", jeweils mit Zahl.
- Suche über alle Bücher, Treffer alphabetisch; × oder Esc leert sie, ein
  Klick auf ein Buch beendet sie. "Gelöste ausblenden" blendet gelöste Fälle
  aus. Die Auswahl bleibt gespeichert.
- Online wählt der Host mit denselben Filtern.

## Das Deduktionsraster

- Oben: Verdächtige, (Motive), Orte. Links: Waffen, Orte, (Motive). Jede
  Blockreihe ist einen Block kürzer, so trifft jedes Paar von Kategorien
  genau einmal aufeinander.
- Feld antippen: leer -> Kreuz -> Haken -> leer.
- Ein Haken kreuzt die übrigen Felder seiner Zeile und Spalte im selben Block
  aus (abschaltbar).

## Anklage und Wertung

- Alle Felder der Anklage müssen gewählt sein.
- Richtig: Fall gelöst, Zeit gespeichert (Bestzeit, letzte Zeit, Gesamtzeit).
- Falsch: nur "falsch"; die falschen Anklagen werden gezählt, der Fall bleibt
  offen.
- Tipps: Buch-Tipp (nur Fälle 1 und 2), dann der Lösungsweg Schritt für
  Schritt.
- "Tipp" eine Sekunde halten: alle Tipps auf einmal, das ganze Raster
  richtig ausgefüllt und die Anklage eingetragen, in einem Zug (allein mit
  Rückgängig, online für alle). Anklagen muss man selbst.
- Schließt ein Tipp auf bestimmte Paare, lässt er sich ausführen ("▶
  Ausführen"): genau diese Haken und Kreuze, ein Zug. Alle Tipps nacheinander
  ausgeführt lösen das Raster vollständig.
  Der Fall zählt danach weiter als gelöst, wenn richtig angeklagt wird.
- "Lösung zeigen": danach zählt der Fall nicht mehr als gelöst.

## Gemeinsam online

- 2 bis 6 Ermittler in einem privaten Raum; der Host wählt den Fall und
  öffnet ihn.
- Alle schreiben gleichzeitig im selben Raster und füllen dieselbe Anklage
  aus; Tipps und die Lösung gelten für alle. "Automatisch ausstreichen" stellt
  jede:r für sich ein.
- Anklagen kann jede:r; eine richtige Anklage löst den Fall für alle, danach
  öffnet der Host den nächsten. Die Uhr läuft ab dem Öffnen durch den Host.
- Kein Rückgängig, kein "Nochmal lösen". Online-Fälle zählen nicht in die
  Statistik des Browsers.

## Was die Leseprobe nicht hergibt

- Für die Fälle 36, 51 und 76 druckt sie weder Tipp noch Lösung. Die Lösungen
  hat der Löser (`npm run murdle`) als jeweils einzige gefunden; die Tipps
  sind selbst geschrieben.
- Beweisstück B hat zusätzlich eine Tabelle alchemistischer Symbole; kein
  gebauter Fall braucht sie, sie fehlt hier. Beweisstück C (Labyrinth) und D
  (Karte der Midnight Movie Studios) braucht ebenfalls keiner der gebauten
  Fälle.
- In Fall 1 sind das riesige Badezimmer und der Vorführraum als "Outdoors"
  gedruckt; so ist es übernommen (kein Hinweis hängt daran).
