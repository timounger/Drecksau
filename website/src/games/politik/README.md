# Das politische Talent

Das Brettspiel von Lukas Huemer
([daspolitischetalent.com](https://www.daspolitischetalent.com)). Jede Partei
stellt eine Kandidat:in auf, zieht in den Wahlkampf, schmiedet Koalitionen und
versucht, ihre Wahlversprechen durchs Parlament zu bringen.

**Siegpunkte gewinnen das Spiel** - und die gibt es aus zwei Quellen: dafür, in
der **Regierung** zu sitzen, und dafür, **Wahlversprechen** einzulösen.

Drei Dinge machen es aus:

- **Sitze sind Macht, nicht Punkte.** Sie entscheiden nur, wer regiert und wessen
  Abstimmung durchgeht. Erst am Schluss werden sie selbst zu Punkten.
- **Deine Ausrichtung wirkt zweimal.** Sie gibt dir im Wahlkampf 2 statt 1
  Würfel, wenn das aufgedeckte Thema dazugehört - und sie zahlt dir Siegpunkte
  für **fremde** Wahlversprechen deiner Themen, wenn du dafür stimmst. Darum ist
  eine Abstimmung selten eine reine Nettigkeit.
- **Opposition ist kein Trostpreis.** Die beiden verdeckten Opposition-Karten
  darf nur ausspielen, wer **keine** Regierung-Karte hält.

## Spielen

`/politik` teilt sofort ein Spiel gegen den Computer aus - es gibt keine
Startseite davor. Alles Weitere hängt in der Kopfzeile:

| Seite                    | Was dort passiert                     |
| ------------------------ | ------------------------------------- |
| `/politik`               | Spiel gegen den Computer              |
| `/politik/einstellungen` | Spielerzahl (3 bis 6)                 |
| `/politik/online`        | automatische Suche oder privater Raum |
| `/politik/statistik`     | gespielte Partien und Erfolge         |

Einstellungen gelten ab dem **nächsten** Spiel - der Tisch steht beim Austeilen
fest.

## Der Ablauf in einem Absatz

Drei Durchgänge aus **Wahlkampf → Regierungsbildung → 3 Spielrunden**, dann ein
letzter Wahlkampf. Im Wahlkampf duelliert sich jede Partei mit der linken
Nachbarpartei, und die Differenz wandert als Sitze. Danach muss eine Koalition
mit **31 von 60 Sitzen** stehen. In den Spielrunden hat jede Partei genau eine
Aktion: eine, die immer gelingt, eine Abstimmung oder eine Würfelprobe. Die
vollständigen Regeln stehen in
[docs/games/politik/game-rules.md](../../../../docs/games/politik/game-rules.md).

## Das Parlament

Die Sitze werden als Halbrund gezeichnet, in einem zusammenhängenden Block je
Partei - so, wie ein echter Sitzplan aussieht. Das ist keine Verzierung: Eine
Mehrheit ist etwas, das man **sehen** können soll, bevor man rechnet.

Weil im Halbrund immer 60 Sitze liegen, egal ob 3 oder 6 Parteien spielen, ist
die Mehrheit in jedem Spiel dieselbe Zahl.

## Online

Zwei Wege an einen Tisch: **automatische Suche** gegen Fremde oder ein
**privater Raum**, dessen vierstelligen Code man weitergibt.

Auch die **Abstimmungen laufen reihum**, nicht gleichzeitig - die geteilte
Online-Schicht hat immer genau eine Partei am Zug. Am Tisch ändert das wenig,
online macht es den Unterschied zwischen "es funktioniert" und "es funktioniert
manchmal".

Wer **45 Sekunden** nichts tut, für den zieht der Computer; in den
Regierungsverhandlungen sind es **90**, weil das der eine Bildschirm ist, an dem
man wirklich nachdenken muss. Verlässt jemand das Spiel, übernimmt der Computer
seinen Platz ganz - neben dem Namen steht dann **Computer**.

## Aufbau des Spielmoduls

```text
games/politik/
  engine/       Karten, Regeln, Wertung, Computergegner - ohne DOM
  components/   Parlament, Aktionsleiste, Ergebnistafel, Einstellungen, Online
  hooks/        das Spiel gegen den Computer (Spielstand, Statistik)
  multiplayer/  der Adapter fuer die geteilte Online-Schicht
  settings/     Spielerzahl im Browser
  i18n/         deutsche Texte
  assets/       das Cover-Logo
```

Die Engine ist rein: [engine/moves.ts](engine/moves.ts) ist der einzige
Schiedsrichter und gibt bei einem unerlaubten Zug `null` zurück - der Online-Host
kann den Zug eines Gastes also ungeprüft hineinreichen.

## Die Würfel liegen im Spielstand

Anders als bei den übrigen Spielen der Sammlung wird hier vom ersten Wahlkampf
bis zum letzten gewürfelt. Der Stand des Zufallsgenerators reist deshalb **im
Spielzustand** mit ([engine/random.ts](engine/random.ts)): eine einfache Zahl,
die einen Speicherstand und den Weg übers Netz übersteht.

Damit hat ein Zug aus einem gegebenen Zustand genau ein mögliches Ergebnis. Das
ist die Grundlage dafür, dass online ein Host für alle würfeln darf, ohne dass
ihm jemand vertrauen müsste - jeder Client könnte es nachrechnen.

## Der Computergegner

Eine lesbare, absichtsvolle Heuristik statt einer Suche: Er greift nach Ämtern,
nimmt sich beim Koalitionsbau die wenigsten nötigen Partner (und gibt jedem ein
Ministerium, weil ein leer ausgehender Partner ablehnt), spielt Wahlversprechen
nur aus, wenn er die Mehrheit dafür überschlagen kann, und stimmt für das, was
ihm selbst Punkte bringt.

Er ist wie das ganze Spiel eine **reine Funktion des Zustands** - ohne eigene
Zufälle. Genau deshalb kann der Online-Host einen verwaisten Platz übernehmen,
ohne dass sich für die anderen etwas ändert.

## Was online geheim bleibt

Drei Arten von Geheimnis, an drei verschiedenen Orten
([multiplayer/adapter.ts](multiplayer/adapter.ts)):

| Was                                                   | Wo                         |
| ----------------------------------------------------- | -------------------------- |
| Opposition-Karten, verdeckte Skandale, eigene Auswahl | privater Kanal des Platzes |
| Kandidat:innen- und Skandal-Stapel                    | Host-Vault                 |
| Sitze, Punkte, Ausrichtung, offene Skandale           | offen im Snapshot          |

Geschwärzte Karten behalten ihren Platz in der Liste - jeder soll sehen, **wie
viele** Karten eine Partei hat, nur nicht welche.

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - ein Sitzplan als
Platzhalter, den man durch echte WebP-Grafik ersetzen kann.
