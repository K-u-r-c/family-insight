---
description: Häufige Fragen zu Family Insight – Datenschutz, Offline-Nutzung, Dateigröße, GEDCOM, Teilen und Drucken.
---

# Häufige Fragen

## Ist Family Insight kostenlos?

Ja. Es ist kostenlos und quelloffen (MIT-Lizenz), ohne Werbung, Konten oder Abonnements.

## Wo sind meine Daten? Gehen sie ins Internet?

Ihr Stammbaum steckt in der `.finsight`-Datei, die Sie gespeichert haben – nirgendwo sonst. Family
Insight funktioniert vollständig **offline** und sendet Ihre Daten nirgendwohin. Einmal am Tag
fragt es bei GitHub nach, ob eine neue Version verfügbar ist ([Updates](./updates), lässt sich
ausschalten). Ansonsten geht es nur online, wenn Sie es darum bitten: Ein Link wie
**Hilfe → Benutzerhandbuch** öffnet Ihren Webbrowser, und wenn Sie die
[Online-Ortssuche](./places#lookup) erlauben, sendet **Online suchen** den Namen dieses einen Ortes
– und sonst nichts – an OpenStreetMap; sind [Online-Karten](./map#online) erlaubt, lädt die Karte
ihren Hintergrund herunter (nur den Kartenausschnitt, nie Ihre Daten).

## Wie sichere ich meinen Stammbaum?

Kopieren Sie die `.finsight`-Datei auf einen USB-Stick, eine externe Festplatte oder in einen
Cloud-Ordner, dem Sie vertrauen. Family Insight bewahrt außerdem automatisch die letzten fünf
Versionen neben der Datei auf ([Sicherungskopien](./files#backups)).

## Wie groß darf ein Stammbaum sein? Machen Fotos ihn riesig?

Stammbäume mit tausend Personen und mehr laufen flüssig. Porträts werden beim Hinzufügen auf
512 × 512 Pixel verkleinert, sodass jedes nur einige Dutzend Kilobyte belegt – ein Stammbaum mit
einigen hundert Porträts bleibt bei wenigen Megabyte und lässt sich leicht per E-Mail verschicken.
Bilder werden nur einmal in der Datei gespeichert, egal wie oft sie verwendet werden, und das
Speichern bleibt schnell, auch wenn die Datei auf Hunderte Megabyte anwächst.

## Kann ich einen Stammbaum aus einem anderen Genealogieprogramm öffnen (GEDCOM)?

Ja. Exportieren Sie im anderen Programm (Gramps, MyHeritage, Ancestry, Legacy …) eine GEDCOM-Datei
und verwenden Sie **☰ → GEDCOM importieren…** – siehe [GEDCOM](./gedcom). Auf dieselbe Weise können
Sie Ihren Stammbaum für andere Programme exportieren. Daten aus Tabellen kommen über
[CSV](./csv-import) herein.

## Wie kann ich den Stammbaum mit meiner Familie teilen?

- Schicken Sie ihnen die `.finsight`-Datei – mit Family Insight können sie sie öffnen, erkunden und
  ergänzen.
- Schicken Sie Personen ohne das Programm ein **PDF oder Bild** des Stammbaums
  ([Bilder, PDF und Drucken](./export-print)).
- Schicken Sie eine **CSV**-Datei, wenn jemand mit einer Tabelle arbeiten möchte
  ([Export als CSV](./csv-export)).

Family Insight führt keine Änderungen zusammen – vereinbaren Sie also, wer die Hauptkopie
verwaltet.

## Können mehrere Personen gleichzeitig an einem Stammbaum arbeiten?

Nein. Führen Sie eine Hauptkopie und geben Sie sie weiter, oder sammeln Sie Ergänzungen in einer
Tabelle und importieren Sie sie in den aktuellen Stammbaum.

## Wie drucke ich einen großen Stammbaum?

Drucken Sie ihn in Teilen (Vorfahren oder Nachkommen einer Person, wenige Generationen), verwenden
Sie A3-Papier oder exportieren Sie ein großes PNG oder SVG für eine Druckerei. Siehe
[Tipps für große Stammbäume](./export-print#large-trees).

## Kann ich Adoptionen, Patchworkfamilien und Scheidungen festhalten?

Ja – siehe [Beziehungen](./relationships).

## Gibt es eine Version fürs Smartphone?

Nein, Family Insight ist ein Desktop-Programm für Windows, macOS und Linux.

## Kann ich eine weitere Sprache hinzufügen?

Das Programm ist für weitere Sprachen vorbereitet; Übersetzerinnen und Übersetzer sind
willkommen – siehe [Add a language](/developer/howto/language) in der Entwicklerdokumentation (auf
Englisch).
