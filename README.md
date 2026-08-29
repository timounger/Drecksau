# Spielesammlung

Eine kleine Sammlung von Browser-Spielen, komplett clientseitig und als
statische Seite auf GitHub Pages gehostet. Die Startseite ist die Uebersicht;
jedes Spiel hat seine eigene Seite.

## Spiele

| Spiel                                                              | Beschreibung                                                                                             | Modus                |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | -------------------- |
| [Bohnanza](website/src/games/bohnanza/README.md)                   | Anbauen, handeln, ernten - wer die meisten Bohnentaler hat, gewinnt.                                     | Computer + Online    |
| [Binokel](website/src/games/binokel/README.md)                     | Schwaebisches Stichspiel - Reizen, Melden, Stechen.                                                      | Computer + Online    |
| [Camel Up](website/src/games/camel-up/README.md)                   | Fuenf Kamele, ein Stapel - wer getragen wird, liegt vorn.                                                | Computer + Online    |
| [Codenames](website/src/games/codenames/README.md)                 | Ein Wort, eine Zahl - und der Attentaeter wartet.                                                        | Computer + Online    |
| [Das politische Talent](website/src/games/politik/README.md)       | Wahlkampf, Koalitionen, Wahlversprechen - wer regiert und liefert, gewinnt.                              | Computer + Online    |
| [Drecksau](website/src/games/drecksau/README.md)                   | Kosmos-Kartenspiel: wer zuerst nur noch Drecksaeue hat, gewinnt.                                         | Computer + Online    |
| [Jammerlappen](website/src/games/jammerlappen/README.md)           | Werd alle Karten los - wer als Letzter drauf sitzt, ist der Jammerlappen.                                | Computer + Online    |
| [Exploding Kittens](website/src/games/exploding-kittens/README.md) | Zieh keine Bombe - wer als Letzter uebrig ist, gewinnt.                                                  | Computer + Online    |
| [Flip 7](website/src/games/flip-7/README.md)                       | Sieben verschiedene Zahlen - oder eine zu viel.                                                          | Computer + Online    |
| [Sky Team](website/src/games/sky-team/README.md)                   | Landet das Flugzeug zu zweit - und schweigt dabei.                                                       | Computer + Online    |
| [Flash Point](website/src/games/flash-point/README.md)             | Rettet die Opfer, bevor das Haus einstuerzt.                                                             | Computer + Online    |
| [The Game](website/src/games/the-game/README.md)                   | 98 Karten auf vier Reihen - und keiner darf Zahlen nennen.                                               | Computer + Online    |
| [Risiko](website/src/games/risiko/README.md)                       | Gebiet fuer Gebiet die Welt erobern.                                                                     | Computer + Online    |
| [Monopoly](website/src/games/monopoly/README.md)                   | Kaufen, bauen, kassieren - bis nur noch einer zahlen kann.                                               | Computer + Online    |
| [CATAN](website/src/games/catan/README.md)                         | Siedeln, handeln, bauen - und die Insel unter euch aufteilen.                                            | Computer + Online    |
| [Heckmeck am Bratwurmeck](website/src/games/heckmeck/README.md)    | Acht Wuerfel, sechzehn Chips - ohne Wurm zaehlt nichts.                                                  | Computer + Online    |
| [Kniffel](website/src/games/kniffel/README.md)                     | Fuenf Wuerfel, drei Wuerfe, dreizehn Felder - jedes nur einmal.                                          | Computer + Online    |
| [Kuhle Kuehe](website/src/games/kuhle-kuehe/README.md)             | Baut aus Koepfen, Mittelteilen und Hinterteilen die laengsten Kuehe und die groesste Herde.              | Computer + Online    |
| [Krakel Orakel](website/src/games/krakel/README.md)                | Kooperativ: alle malen gleichzeitig, dann streicht ihr gemeinsam die Woerter weg, die keiner gemalt hat. | Nur Online           |
| [Panzerkiste](website/src/games/panzerkiste/README.md)             | Top-Down-Panzergefecht - alle feindlichen Panzer zerstoeren (WASD, Maus, Minen).                         | Allein + Koop-Online |
| [Qwixx](website/src/games/qwixx/README.md)                         | Wuerfeln und ankreuzen - was du ueberspringst, ist weg.                                                  | Computer + Online    |
| [RV There Yet?](website/src/games/rv-there-yet/README.md)          | Seitenansicht: das Wohnmobil ueber den Berg bringen - notfalls mit der Seilwinde.                        | Allein + Koop-Online |
| [Skyjo](website/src/games/skyjo/README.md)                         | Karten tauschen und Spalten abraeumen - die wenigsten Punkte gewinnen.                                   | Computer + Online    |
| [The Mind](website/src/games/the-mind/README.md)                   | Kooperativ: gemeinsam aufsteigend ablegen - ohne ein Wort.                                               | Nur Online           |

Weitere Spiele docken ueber die Registry an (siehe
[Ein weiteres Spiel hinzufuegen](#ein-weiteres-spiel-hinzufuegen)).

## Starten

```bat
install.bat    :: einmalig - installiert die Dependencies
start.bat      :: startet den Dev-Server und oeffnet den Browser
```

Oder direkt:

```bash
cd website
npm install
npm run dev     # http://localhost:3000
```

## Skripte (im Ordner website/)

| Befehl              | Zweck                                 |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Dev-Server                            |
| `npm run build`     | Produktions-Build                     |
| `npm test`          | Unit-Tests (Vitest)                   |
| `npm run lint`      | ESLint                                |
| `npm run format`    | Prettier                              |
| `npm run typecheck` | TypeScript ohne Emit                  |
| `npm run docs`      | API-Doku via TypeDoc nach `docs/api/` |

## Aufbau

Jedes Spiel ist ein eigenes Modul unter `games/`; darum herum liegt nur
gemeinsame Infrastruktur (Speicherung, Statistik, Uebersicht). So aendert ein
neues Spiel nichts an den geteilten Schichten.

```text
website/src/
  app/            Routen (Uebersicht /, je Spiel /<spiel> mit /einstellungen, /statistik, /online)
  games/
    registry.ts     Liste aller Spiele - hier docken weitere an
    game-logos.ts   das Cover-Bild je Spiel
    drecksau/       Kartenspiel gegen Computer oder online
    binokel/        Stichspiel gegen Computer oder online
    panzerkiste/    Panzer-Actionspiel, allein oder zu zweit im Koop
    krakel/         kooperatives Malspiel (nur online)
    skyjo/          Kartenspiel gegen Computer oder online
    rv-there-yet/   Fahrspiel in der Seitenansicht, allein
    politik/        Das politische Talent - Brettspiel gegen Computer oder online
    camel-up/       Camel Up - Kamelrennen gegen Computer oder online
    kuhle-kuehe/    Kuhle Kuehe - Kuehe aus Kartenteilen bauen
    the-mind/       The Mind - kooperativ gegen die Reihenfolge (nur online)
    qwixx/          Qwixx - Wuerfelspiel gegen Computer oder online
    heckmeck/       Heckmeck am Bratwurmeck - Wuerfelspiel gegen Computer oder online
    kniffel/        Kniffel - der Wuerfelklassiker, auch allein
    jammerlappen/   Jammerlappen - Kartenspiel gegen Computer oder online
    exploding-kittens/ Exploding Kittens - Kartenspiel gegen Computer oder online
    codenames/      Codenames - Wortspiel gegen Computer oder online
    flip-7/         Flip 7 - Push-your-luck-Kartenspiel gegen Computer oder online
    sky-team/       Sky Team - kooperatives Wuerfelspiel zu zweit, Spiel des Jahres 2024
    flash-point/    Flash Point: Fire Rescue - kooperativer Feuerwehreinsatz
    the-game/       The Game - kooperatives Kartenspiel, ohne ueber Zahlen zu reden
    risiko/         Risiko - 42 Gebiete, drei Varianten aus der Schachtel
    monopoly/       Monopoly Klassik - deutscher Spielplan, Auktionen und Handel
    bohnanza/       Bohnanza - Bohnen anbauen, handeln und ernten
    catan/          CATAN - 19 Landschaftsfelder, variabler Aufbau, Haefen und Raeuber
                    (jedes Spiel mit eigener README im Ordner)
  online/         geteilte Online-Schicht (host-autoritativ, Firebase) fuer alle Spiele
  components/     geteilte UI (Uebersicht, Statistik)
  lib/
    storage/        Generisch: localStorage mit Namensraum und Versionierung
    stats/          Generisch: Statistik-Modell, Speicherung, React-Store
  i18n/           geteilte Texte (Sammlung, Statistik) und Formatierung
```

Die Spiellogik eines Spiels ist von der Oberflaeche getrennt und rein
funktional: jeder Zug erzeugt einen neuen Zustand, testbar ohne Browser.

## Hell und Dunkel

Unten rechts steht auf **jeder** Seite ein Schalter mit drei Zuständen: **hell**,
**wie das System**, **dunkel**
([components/theme-toggle.tsx](website/src/components/theme-toggle.tsx)).

Drei und nicht zwei. Ein einfacher Umschalter kann immer nur „das Gegenteil von
jetzt" bedeuten und wirft dabei die Antwort weg, die die meisten eigentlich
wollen: dass die Seite mitmacht, was das Telefon abends ohnehin tut. „System"
ist deshalb der Zustand, den niemand wählen muss - und der, zu dem man
zurückkommt.

Der Schalter hängt im Grundgerüst, nicht in den Kopfzeilen. Es gibt rund fünfzig
Bildschirme und fast ebenso viele Kopfzeilen, einige davon von einem Spiel
selbst geschrieben; ein Schalter, an den man in jeder einzelnen denken müsste,
fehlt auf der nächsten neuen Seite.

### Warum es kein Aufblitzen gibt

Die Seite ist eine statische Datei und weiß beim Ausliefern nichts von der
Wahl. Würde React sie treffen, wäre erst die falsche Farbe zu sehen und einen
Wimpernschlag später die richtige. Stattdessen setzt ein winziges Skript im
`<head>` das Attribut, während der Browser noch den Kopf liest - vor dem ersten
Zeichnen ([lib/theme/theme-boot.ts](website/src/lib/theme/theme-boot.ts), nach
der Anleitung des Frameworks unter
`node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`).

Drei Zustände, drei Selektoren, und welcher gewinnt, entscheidet alles:

| Am `<html>`          | Was gilt                        |
| -------------------- | ------------------------------- |
| `data-theme="dark"`  | dunkel, gewählt                 |
| `data-theme="light"` | hell, gewählt                   |
| gar kein Attribut    | was `prefers-color-scheme` sagt |

Der dritte Fall ist der wichtige: „System" **entfernt** das Attribut, statt
„hell" hineinzuschreiben. Damit entscheidet wieder das Stylesheet - dieselbe
Stelle, die auch für jemanden entscheidet, bei dem gar kein JavaScript läuft.
Der bekommt so weiterhin die Farben seines Systems statt der, mit denen die
Datei zufällig exportiert wurde.

Deshalb ist „dunkel" in [globals.css](website/src/app/globals.css) **nie nur**
in der Media-Query und **nie nur** am Attribut definiert, sondern an beidem -
sonst geht einer der drei Zustände schief. Dasselbe gilt für Tailwinds
`dark:`-Variante, die dort neu definiert wird und danach für alle rund 650
Regeln im Projekt gleichzeitig gilt.

## Die Startseite: Regale statt Liste

Siebzehn Karten alphabetisch untereinander sind ein Katalog, und ein Katalog
beantwortet keine Frage, mit der jemand ankommt. Die Sammlung liegt deshalb in
**Regalen** ([components/game-collection.tsx](website/src/components/game-collection.tsx)):

- **Beliebt** - die Spiele, mit denen in den letzten **7 Tagen** am längsten
  gespielt wurde, von allen zusammen.
- **Neu** - was zuletzt dazugekommen ist.
- danach nach Art des Abends: **Kartenspiele**, **Würfelspiele**, **Gemeinsam
  gegen das Spiel**, **Wort und Party**, **Action und Taktik**.

Jedes Spiel steht in **genau einem** Kategorie-Regal. Zwei Regale für ein Spiel
hieße, an derselben Karte zweimal vorbeizuscrollen und sich zu fragen, ob man
etwas übersehen hat. „Beliebt" und „Neu" sind dagegen keine Ablage, sondern die
Antwort auf eine Frage - dass ein Spiel dort **und** unten in seiner Kategorie
auftaucht, ist der Zweck.

Wer sucht, bekommt eine flache Trefferliste ohne Regale. Wer einen Namen tippt,
weiß, was er sucht; ihn dann noch durch Abschnitte jagen zu lassen, hilft
niemandem.

### Wie „beliebt" gerechnet wird

Gezählt wird **Spielzeit**, nicht wie oft ein Spiel gestartet wurde. Ein Start
heißt, dass jemand einmal geklickt hat - ein Regal darauf zu bauen belohnt den
neugierigen Klick gegenüber dem Abend, den jemand wirklich dabei geblieben ist.

Die Zeit ist die einzige Zahl auf der Startseite, die **nicht** aus dem eigenen
Browser kommt: Sie liegt als eine laufende Summe pro Spiel und UTC-Tag unter
`rooms/__played/<spiel-id>/<JJJJ-MM-TT>` in derselben Firebase-Datenbank wie die
Online-Räume ([online/popularity.ts](website/src/online/popularity.ts)).
Addiert wird atomar, damit zwei Leute, die gleichzeitig aufhören, sich nicht
gegenseitig überschreiben.

Tage statt einer Gesamtsumme, weil eine Gesamtsumme nie vergessen könnte - ein
Spiel, das im Frühjahr beliebt war, stünde für immer oben. Und Tage statt einer
Liste einzelner Sitzungen, weil die endlos wachsen und zum Summieren ganz
gelesen werden müsste.

Übertragen wird nur die Spanne selbst, gebündelt etwa alle 30 Sekunden statt
nach jedem Zug. Der Knoten enthält eine Zahl pro Spiel und Tag und keine Spur
davon, wer sie dazugezählt hat. Die eigentliche Statistik bleibt im Browser,
wie es die Statistikseite verspricht.

## Online-Spielername

Der Name, unter dem du online spielst, gilt **fuer alle Spiele der Sammlung**.
Er wird beim Tippen gespeichert, und jedes Online-Startfenster fuellt sein Feld
damit vor - egal, in welchem Spiel du ihn zuletzt eingegeben hast.

Frueher hatte jedes Spiel seinen eigenen: Der Name fuer Binokel war fuer Skyjo
unbekannt, und der bei Drecksau eingetippte wurde gar nicht erst gespeichert.
Niemand haelt sich pro Spiel fuer jemand anderen - der Name gehoert zum
Spieler, nicht zum Tisch, an dem er gerade sitzt
([online/player-name.ts](website/src/online/player-name.ts)).

Wer vorher schon einen Namen in einem Spiel hinterlegt hatte, verliert ihn
nicht: Beim ersten Mal wird der aelteste noch vorhandene uebernommen, danach
gibt es nur noch den einen Schluessel.

## Einladungslink

Ein privater Raum hat einen **Code** aus vier Zeichen - kurz genug, um ihn am
Telefon vorzulesen. Für den umgekehrten Weg gibt es den **Link**: In der Lobby
steht neben dem Code „Link kopieren", und der Link trägt den Code mit
(`…/qwixx/online/?raum=DE83`). Verschickt wird er da, wo ihr euch ohnehin
schreibt.

Der Link **füllt das Feld aus, er tritt nicht bei.** Beitreten braucht einen
Namen, und wer aus einer Chatnachricht kommt, wurde noch nicht nach seinem
gefragt. Also öffnet sich der Einstiegsbildschirm mit dem Code schon drin, grün
umrandet und mit einem Satz dazu - ein Knopf bleibt zu drücken. Das ist auch der
Moment, in dem man sieht, zu welchem Spiel man eingeladen wurde, bevor man
zusagt.

Der Code reist als Query-Parameter und nicht als Pfadsegment, weil die Seite
statisch exportiert wird: `?raum=DE83` braucht keine eigene Route, `/raum/DE83`
bräuchte eine Seite pro Code.

Alles davon liegt in
[online/room-invite.tsx](website/src/online/room-invite.tsx) und gilt für alle
Online-Spiele gleich.

## Konto: Name und Gesicht

Oben rechts auf der Startseite steht ein Knopf mit **deinem eigenen Gesicht und
deinem Namen** ([components/account-button.tsx](website/src/components/account-button.tsx)).
Dahinter liegt das Einzige, was hier so etwas wie ein Konto ist: die beiden
Dinge, die deine Mitspieler online sehen. Angemeldet wird sich nirgends, nichts
verlässt den Browser.

Ein Knopf mit dem eigenen Gesicht statt eines allgemeinen Personensymbols: Ein
Symbol sagt „hier ist ein Konto", das Gesicht sagt „so sehen dich die anderen" -
und mehr steckt ohnehin nicht dahinter.

**Gewählt wird beides nur hier.** Vorher wurde das Gesicht auf demjenigen
Online-Bildschirm gewählt, den man gerade offen hatte - dieselbe Entscheidung an
siebzehn Stellen und an keiner davon zu Hause. Die Online-Bildschirme **zeigen**
es jetzt nur noch, neben dem Namensfeld: sichtbar, weil man sonst nie erführe,
dass man eins hat, aber nicht änderbar.

## Avatare

Achtzehn Gesichter stehen zur Wahl - kurze Haare und lange, Zöpfe und Bärte,
junge Gesichter und graue, und Hauttöne von hell bis dunkel
([online/avatar.tsx](website/src/online/avatar.tsx)).

Die Gesichter sind **gezeichnet, nicht aus dem Emoji-Zeichensatz genommen** -
aus demselben Grund wie das Mikrofonsymbol: Ein Emoji sieht auf jedem
Betriebssystem nach einer anderen Person aus, und ein Gesicht, das jemand als
sich selbst gewählt hat, darf auf dem Handy seines Freundes nicht jemand anders
sein.

Die Beschriftungen sagen, was zu sehen ist („Zopf", „Grauer Bart") - nicht, für
wen es gedacht ist. Die Auswahl ist das Verlangte; jemandem zu sagen, welches
davon er ist, ist nicht Aufgabe der Software.

Gespeichert wird die Wahl wie der Name: **ein Schlüssel für alle Spiele**, im
Browser - und gelesen über einen Store mit eigenem Server-Schnappschuss
([lib/storage/stored-value.ts](website/src/lib/storage/stored-value.ts)). Das
ist kein Umweg: Die Seiten werden statisch exportiert, das ausgelieferte HTML
kennt den Speicher nicht, und wer ihn beim Rendern liest, produziert einen
ersten Durchlauf, der dem HTML widerspricht - React wirft dann den ganzen
Teilbaum weg und baut ihn neu. Auf die Reise geht sie am **Sitzplatz** - der wird im Raum genau einmal
gebaut ([use-online-room.ts](website/src/online/use-online-room.ts)), also
erreicht das Gesicht jeden Bildschirm, der ohnehin schon einen Namen zeigt, ohne
dass ein einziges Spiel es weiterreichen müsste.

Zu sehen ist es in der **Lobby**, in der **Warteliste** des automatischen
Matchings und im **Sprachchat**. Die Spieltische selbst zeigen weiterhin nur
Namen - dort ist der Platz knapp und jedes Spiel baut ihn anders.

Eine Avatar-Kennung reist über die Leitung und liegt im Speicher, deshalb wird
**keine je wiederverwendet**: Eine Kennung, die ihre Bedeutung ändert, macht aus
einem alten Mitspieler einen Fremden. Hinzufügen ist gefahrlos, Umnummerieren
nicht.

## Sprachchat

Alle Online-Spiele haben einen **Sprachchat**. Der Ton geht **direkt von
Gerät zu Gerät** (WebRTC) und nicht über einen Server - was auch der einzige
Weg ist, denn hinter dieser Seite steht keiner. Der Raum, den ihr ohnehin
teilt, dient nur dazu, dass sich die Browser finden.

**Stumm ist der Anfangszustand**, und das Mikrofon wird gar nicht erst
angefragt, bis jemand zum ersten Mal auf „Mikro an" drückt. Wer nie sprechen
will, bekommt nie einen Berechtigungsdialog. Zuhören läuft von selbst.

Der Sprachchat steht **schon in der Lobby** - das Warten darauf, dass der Raum
voll wird, ist ja genau der Moment, in dem es etwas zu besprechen gibt. Und er
bleibt, wenn ihr **nochmal spielt**: Der Weg vom Tisch zurück in die Lobby und
wieder an den Tisch legt keine Leitung. Wer sein Mikro an hatte, hat es danach
immer noch an.

Beim Wechsel in einen **anderen** Raum fängt es dagegen stumm an. Das ist
Absicht: An einen fremden Tisch zu kommen ist nicht dasselbe wie an den eigenen
zurück, und niemand soll sich zu hören wiederfinden, wo er gerade erst
hereingekommen ist.

Ob dein Mikrofon offen ist, zeigt ein **Mikrofonsymbol**: **rot**, solange du zu
hören bist, und **grau durchgestrichen**, solange nicht. Nicht nur die Farbe
entscheidet - der Strich sagt dasselbe noch einmal, für alle, die Rot und Grau
schlecht auseinanderhalten. Rot ist bewusst der laute Zustand: Es ist die Farbe,
die überall sonst „nimmt gerade auf" bedeutet.

Dasselbe Symbol steht **neben jedem Mitspieler**. Damit beantwortet ein Blick
die Frage, die im Sprachchat sonst ständig gestellt wird: Wer hört mich
gerade, und wer redet in ein totes Mikrofon? Es kommt aus dem, was jeder über
sich selbst meldet, nicht aus dem ankommenden Ton - Stille ist nicht dasselbe
wie stumm, und wer nur gerade nichts sagt, soll nicht abgeschaltet aussehen.

Wie **laut** die anderen sind, stellt ein Regler unter dem Mikrofonknopf ein -
von voll bis stumm. Die Einstellung gilt für alle Online-Spiele und hält bis zum
nächsten Mal. Sie betrifft nur, was bei dir ankommt: Wer dich hört, hört dich
unverändert, egal wie leise du ihn gedreht hast.

Der Regler ist von der Lautstärke der **Spielgeräusche** getrennt (die hat
Panzerkiste über dem Feld). Man kann also stumm gestellte Panzer mit lautem
Gespräch haben oder umgekehrt - genau deshalb sind es zwei Regler und nicht
einer.

Neben jedem Mitspieler steht, ob die Leitung steht. Das ist kein Schmuck: Bei
manchen Netzen kommen zwei Geräte nicht direkt zueinander, und dann braucht es
einen **Relais-Server (TURN)** - das einzige Stück, das eine statisch gehostete
Seite nicht selbst mitbringen kann. Ohne einen solchen Server bleibt es für
diese wenigen still, und dann soll wenigstens dastehen, warum.

Ein Relais wird über Umgebungsvariablen eingehängt, falls du eins hast:

```bash
NEXT_PUBLIC_TURN_URL=turns:beispiel.de:5349
NEXT_PUBLIC_TURN_USER=benutzer
NEXT_PUBLIC_TURN_PASSWORD=geheim
```

Ohne diese Angaben läuft alles Übrige unverändert weiter.

## Speicherung und Statistik

Spielstaende und Statistik liegen im **localStorage**, nicht in Cookies: Ein
Spielstand ist schnell groesser als das ~4-KB-Cookie-Limit - und auf GitHub
Pages gibt es ohnehin keinen Server, der Cookies lesen wuerde.

Alle Schluessel liegen unter dem Praefix `drecksau-app/<spiel-id>/...`. Das ist
kein Schmuck: Alle GitHub-Pages-Projektseiten eines Kontos teilen sich **eine**
Origin (`<konto>.github.io`), und der localStorage gilt pro Origin - ohne
Praefix wuerde diese App die Daten anderer Projekte lesen und ueberschreiben.

Gespeicherte Daten tragen eine Schema-Version. Passt sie nicht, oder ist ein
Eintrag beschaedigt, wird er verworfen und das Spiel startet frisch, statt mit
einem kaputten Zustand abzustuerzen.

Eine Ausnahme gibt es: Die **Bestenliste von RV There Yet?** ist global und
liegt deshalb in der Firebase-Datenbank, die auch die Online-Raeume traegt
(unter `rooms/rv-there-yet-__best`, weil die Sicherheitsregeln nur `rooms/`
abdecken). Wer eine Fahrt von Abschnitt 1 bis ans Ziel schafft, darf sich mit
Namen und Zeit eintragen - offline gefahren genauso wie online. Alles Weitere
steht im [Spiel-README](website/src/games/rv-there-yet/README.md#bestenliste).

### Ein weiteres Spiel hinzufuegen

Die Speicher- und Statistik-Schicht ist bewusst spielunabhaengig. Fuer ein neues
Spiel reicht:

1. In [registry.ts](website/src/games/registry.ts) eine `GameId` und einen
   Eintrag (Name, Tagline, Emoji, `href`, `category`, `addedOn`) **hinten
   anhaengen** - die Uebersicht sortiert selbst nach Namen, die Reihenfolge im
   Code ist egal. `addedOn` ist der Tag im Format `JJJJ-MM-TT`; davon lebt das
   Regal „Neu", und ausgeschrieben werden muss er, weil die Reihenfolge im Code
   nur _fast_ die Reihenfolge des Hinzufuegens ist.
2. Ein eigenes Modul `website/src/games/<spiel>/` anlegen (Engine, Komponenten,
   Texte) samt einer `isGameState`-Pruefung fuer gespeicherte Staende.
3. Eine Route `website/src/app/<spiel>/page.tsx` erstellen, die die
   Spielkomponente rendert.
4. Ein Cover-Bild als `assets/logo.webp` ablegen und in
   [game-logos.ts](website/src/games/game-logos.ts) eintragen.

Uebersicht, Statistik-Seite, Zuruecksetzen und Versionierung funktionieren dann
ohne weitere Aenderung - sie iterieren ueber die Registry.

## Favicon

Das Icon liegt in [website/src/app/favicon.ico](website/src/app/favicon.ico) und
wird von Next.js automatisch verlinkt - im `layout.tsx` ist dafuer nichts
einzutragen. Zum Aendern einfach die Datei ersetzen.

**Achtung:** Next erkennt in `src/app/` auch `icon.svg`, `icon.png` und
`apple-icon.png`. Liegt eine davon daneben, wird sie **zusaetzlich** verlinkt,
und moderne Browser bevorzugen dann das SVG - das `favicon.ico` erscheint nicht
mehr. Also entweder `favicon.ico` **oder** die `icon.*`-Variante verwenden.

## Selbstspiel ueber die ganze Sammlung

Jedes Spiel haengt ueber denselben Adapter am Online-Layer, und der Adapter
kann alles, was eine Probe braucht: ein Spiel aufbauen, sagen wer am Zug ist,
einen Computerzug holen, ihn anwenden und melden, ob Schluss ist. Damit laesst
sich **jedes** Spiel gleich pruefen - zwanzig Spiele an jeder Tischgroesse mit
je drei Startaufstellungen, 273 Partien.

Geprueft wird fuenferlei, und alles davon sind Fehler, die man im Spiel selbst
kaum bemerkt:

1. **Endet die Partie?** Eine Partie, die nie endet, ist der schlimmste Fehler
   dieser Sammlung - niemand verliert, niemand gewinnt, und der Bildschirm sieht
   normal aus.
2. **Kommt jeder Zug durch die Online-Pruefung?** Was ein Gast schickt, wird
   beim Ankommen geprueft. Ein Zug, den die eigene Pruefung ablehnt, ist ein Zug,
   den es online nicht gibt.
3. **Kommt jeder Spielstand durch?** Derselbe Test fuer den Stand, hin und
   zurueck durch JSON - genau der Weg, den er zwischen Host und Gast nimmt.
4. **Kommt zweimal dasselbe heraus?** Gleicher Seed, gleiche Zugfolge, gleicher
   Stand - und kein Zug veraendert den Stand, aus dem er gerechnet wurde. Beides
   muss stimmen, sonst laufen Host und Gast auseinander.
5. **Bleibt geheim, was geheim ist?** Eine Hand wird umsortiert und der geteilte
   Schnappschuss noch einmal gebildet: Sieht er anders aus, steckt in ihm etwas,
   das niemand sehen darf.

Fuenf Sachen kamen dabei heraus:

- **CATAN liess online nur das Grundspiel zu.** Die Liste der erlaubten
  Zugarten nannte zwanzig Zuege und keinen aus einer Erweiterung. Sie steht
  jetzt als `Record<CatanMove["kind"], true>` neben den Zuegen selbst, also
  meldet der Compiler den naechsten vergessenen Zug.
- **Binokel hatte keine Ziellinie im Regelwerk.** Die 1000 Punkte standen in
  zwei Bildschirmen und nirgends in der Engine; ohne sie spielte eine Partie
  ewig weiter (drei Farben bei 72250, 68460 und 68020 Punkten nach dreissigtausend
  Zuegen). Jetzt steht die Zahl in der Engine und gilt als Vorgabe.
- **Drecksau baute ohne Erweiterungs-Schalter einen Stand, den seine eigene
  Pruefung ablehnt.** Der Schalter hat jetzt eine Vorgabe, wie der daneben.
- **Drecksau und Binokel verrieten online jede Handkarte.** Beide ersetzen die
  Karten der anderen im geteilten Schnappschuss durch Attrappen - Binokel durch
  eine Eichel-Sieben, Drecksau durch eine Schlammkarte -, liessen dabei aber die
  **Id** der echten Karte stehen. Die Id ist der Name: `herz-zehn-1`,
  `farmerScrubs-1`. Wer den Schnappschuss lesen konnte, konnte jede Hand lesen.
  Jetzt tragen verdeckte Karten eine Id, die nur ihren Platz nennt
  (`verdeckt-hand-0-3`) - eindeutig genug fuer eine Liste, stumm genug fuer den
  Rest. Die eigene Hand kommt weiterhin echt ueber den privaten Kanal.
- **Determinismus und Unveraenderlichkeit stimmen ueberall**: kein Spiel wuerfelt
  ausserhalb seines Seeds, und kein Zug fasst den Stand an, aus dem er gerechnet
  wurde.

## Deployment (GitHub Pages)

Ein Push auf `main` baut und veroeffentlicht die Seite automatisch
([.github/workflows/github-ci.yml](.github/workflows/github-ci.yml)).

Die Seite laeuft komplett im Browser, deshalb wird sie als **statischer Export**
gebaut (`output: "export"` in [website/next.config.ts](website/next.config.ts))
und landet in `website/out/`.

**Einmalig noetig:** in den Repo-Einstellungen unter _Settings -> Pages_ als
Source **"GitHub Actions"** auswaehlen. Ohne das schlaegt der Workflow-Schritt
`configure-pages` fehl.

Die Seite liegt dann unter einem Unterpfad (`/Drecksau`). Den setzt die CI
automatisch per `NEXT_PUBLIC_BASE_PATH`, damit alle Asset-Pfade stimmen - lokal
ist die Variable leer und die Seite laeuft unter `/`. Einen Pages-Build lokal
nachstellen:

```powershell
$env:NEXT_PUBLIC_BASE_PATH="/Drecksau"; npm run build
```

## Dokumentation

- Coding-Regeln: [docs/coding-rules.md](docs/coding-rules.md),
  TypeScript-Leitfaden: [docs/typescript-guide.md](docs/typescript-guide.md)
- Pro Spiel: eigene README im Spielordner und Spezifikation unter
  `docs/games/<spiel>/`:
  [Drecksau](docs/games/drecksau/game-rules.md) ·
  [Binokel](docs/games/binokel/game-rules.md) ·
  [Panzerkiste](docs/games/panzerkiste/levels.md) ·
  [Krakel Orakel](docs/games/krakel/game-rules.md) ·
  [Skyjo](docs/games/skyjo/game-rules.md) ·
  [RV There Yet?](docs/games/rv-there-yet/route-map.md) ·
  [Das politische Talent](docs/games/politik/game-rules.md) ·
  [Camel Up](docs/games/camel-up/game-rules.md) ·
  [The Mind](docs/games/the-mind/game-rules.md) ·
  [Qwixx](docs/games/qwixx/game-rules.md) ·
  [Heckmeck](docs/games/heckmeck/game-rules.md) ·
  [Kniffel](docs/games/kniffel/game-rules.md) ·
  [Jammerlappen](docs/games/jammerlappen/game-rules.md) ·
  [Exploding Kittens](docs/games/exploding-kittens/game-rules.md) ·
  [Codenames](docs/games/codenames/game-rules.md) ·
  [Flip 7](docs/games/flip-7/game-rules.md) ·
  [Sky Team](docs/games/sky-team/game-rules.md) ·
  [Flash Point](docs/games/flash-point/game-rules.md) ·
  [The Game](docs/games/the-game/game-rules.md) ·
  [Risiko](docs/games/risiko/game-rules.md) ·
  [Monopoly](docs/games/monopoly/game-rules.md) ·
  [CATAN](docs/games/catan/game-rules.md) ·
  [Bohnanza](docs/games/bohnanza/game-rules.md)
