# Skyjo

Das Kartenspiel von Magilano. Vor dir liegen 12 Karten verdeckt in drei Reihen
zu vier Spalten. Im Zug nimmst du die offene Karte vom Ablagestapel oder ziehst
verdeckt und tauschst sie gegen eine deiner Karten - oder wirfst die gezogene
weg und deckst dafür eine eigene auf.

**Wenig ist gut:** Am Rundenende zählt die Summe deiner Karten gegen dich. Ab
100 Punkten ist Schluss, gewonnen hat, wer die wenigsten hat.

Zwei Dinge machen das Spiel aus:

- **Drei gleiche Karten in einer Spalte** fliegen sofort raus und zählen nichts
  mehr. Eine Spalte aus drei Zwölfen ist 36 Punkte, die auf einen Schlag weg
  sind.
- **Wer die Runde beendet**, geht eine Wette ein: Er muss allein am niedrigsten
  sein, sonst zählen seine Punkte doppelt.

## Spielen

`/skyjo` teilt sofort ein Spiel gegen den Computer aus - es gibt keine
Startseite davor. Alles Weitere hängt in der Kopfzeile:

| Seite                  | Was dort passiert                       |
| ---------------------- | --------------------------------------- |
| `/skyjo`               | Spiel gegen den Computer                |
| `/skyjo/einstellungen` | Spielerzahl (2 bis 8) und Schwierigkeit |
| `/skyjo/online`        | privater Raum mit Code, 2 bis 8 Spieler |
| `/skyjo/statistik`     | gespielte Partien und Erfolge           |

Einstellungen gelten ab dem **nächsten** Spiel - Tisch und Gegner stehen beim
Austeilen fest.

## Aufbau des Spielmoduls

```text
games/skyjo/
  engine/       Deck, Regeln, Wertung, Computergegner - ohne DOM
  components/   Tisch, Karten, Ergebnistafel, Einstellungen, Online-Bildschirm
  hooks/        das Spiel gegen den Computer (Spielstand, Statistik)
  multiplayer/  der Adapter fuer die geteilte Online-Schicht
  settings/     Spielerzahl und Schwierigkeit im Browser
  i18n/         deutsche Texte
  assets/       das Cover-Logo
```

Die Engine ist rein: [engine/moves.ts](engine/moves.ts) ist der einzige
Schiedsrichter und gibt bei einem unerlaubten Zug `null` zurück - der Online-Host
kann den Zug eines Gastes also ungeprüft hineinreichen.

## Der Computergegner

Eine lesbare Heuristik statt einer Suche: Spalte vollmachen, sonst die
schlechteste sichtbare Karte tauschen, sonst eine Karte aufdecken. Drei Stufen
(**leicht / mittel / schwer**) drehen dieselbe Heuristik auf und zu.

Der Computer liest **nie** einen verdeckten Wert, auch keinen eigenen - dafür
gibt es einen Test.

## Was online geheim bleibt

Skyjo versteckt anders als übliche Kartenspiele: Die verdeckten Werte sind
**auch vor ihrem Besitzer** geheim. Es gibt darum keine private Hand - die Werte
werden für jeden Client geschwärzt und liegen nur beim Host. Damit ein
Host-Wechsel das Geheimnis nicht mitnimmt, reisen sie im Host-Vault mit
([multiplayer/adapter.ts](multiplayer/adapter.ts)).

## Regeln im Detail

Die verbindliche Spezifikation samt aller bewussten Festlegungen steht in
[docs/games/skyjo/game-rules.md](../../../../docs/games/skyjo/game-rules.md).

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - aktuell ein Platzhalter,
den man durch echte WebP-Grafik ersetzen kann.
