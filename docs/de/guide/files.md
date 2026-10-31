---
description: Stammbäume speichern und öffnen, automatisches Speichern, Wiederherstellung nach Abstürzen, Sicherungskopien, zuletzt geöffnete Dateien und einen Stammbaum auf einen anderen Computer bringen.
---

# Speichern und Öffnen

## Die `.finsight`-Datei

Jeder Stammbaum ist eine Datei mit der Endung **`.finsight`** – alles steckt darin: Personen,
Beziehungen, Quellen, Fotos und wie der Stammbaum angezeigt wurde. Sie entscheiden, wo sie liegt,
und können sie wie jedes andere Dokument kopieren, sichern oder per E-Mail verschicken.

::: info Ältere Versionen
Seit Version 1.1 ist eine `.finsight`-Datei ein komprimiertes Paket (wie eine ZIP-Datei), damit
Fotos und gescannte Dokumente platzsparend hineinpassen: Jedes Bild wird nur einmal gespeichert,
egal wie oft es verwendet wird. Family Insight 1.1 öffnet Stammbäume aus 1.0 und speichert sie in
der neuen Form; **1.0 kann mit 1.1 gespeicherte Stammbäume nicht öffnen** – aktualisieren Sie das
Programm auf jedem Computer, den Sie verwenden (siehe [Installation](./install#updating)).
:::

## Speichern

| Um                               | So geht's                                                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| zu speichern                     | <kbd>Ctrl</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>S</kbd>) oder **☰ → Speichern**                                      |
| unter anderem Namen zu speichern | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>S</kbd>) oder **☰ → Speichern unter…** |

<Screenshot name="file-menu" alt="Das Dateimenü mit Neuer Stammbaum, Öffnen, Speichern, Speichern unter, CSV importieren, GEDCOM importieren, CSV exportieren, GEDCOM exportieren, Bild exportieren, Quellen, Orte und Drucken" />

Wenn Sie einen neuen Stammbaum zum ersten Mal speichern, wählen Sie einen Ordner und einen Namen
(vorgeschlagen werden der Ordner „Dokumente“ und der Name des Stammbaums). Die Statusleiste unten
zeigt jederzeit, ob alles gespeichert ist:

<Screenshot name="unsaved-status" alt="Die Statusleiste mit Ungespeicherte Änderungen (1)" />

Schließen Sie das Fenster, öffnen Sie einen anderen Stammbaum oder beenden Sie das Programm,
während es ungespeicherte Änderungen gibt, fragt Family Insight, ob Sie **Speichern**,
**Nicht speichern** oder **Abbrechen** möchten.

## Automatisches Speichern {#autosave}

Sobald ein Stammbaum in einer Datei gespeichert ist, speichert Family Insight ihn automatisch
**2 Sekunden nach jeder Änderung**. In den [Einstellungen](./settings) können Sie das ausschalten
(⚙ → **Automatisch speichern**); dann speichern Sie selbst mit <kbd>Ctrl</kbd>+<kbd>S</kbd>.

Ein brandneuer Stammbaum, der noch nie gespeichert wurde, wird nicht automatisch gespeichert –
speichern Sie ihn einmal, damit er eine Datei bekommt.

## Wiederherstellung nach Abstürzen {#crash-recovery}

Solange ein Stammbaum ungespeicherte Änderungen hat (zum Beispiel ein neuer Stammbaum oder bei
ausgeschaltetem automatischem Speichern), führt Family Insight eine versteckte
Wiederherstellungskopie, die 2 Sekunden nach jeder Änderung aktualisiert wird. Stürzt das Programm
oder der Computer ab, bietet der nächste Start an, diese Arbeit wiederherzustellen:

<Screenshot name="recovery" alt="Das Fenster Ungespeicherte Arbeit wiederherstellen? mit dem Stammbaum Kowalscy, nie gespeichert, und den Schaltflächen Wiederherstellen und Alle verwerfen" />

Klicken Sie auf **Wiederherstellen**, um den Stammbaum so zu öffnen, wie er war, und speichern Sie
ihn dann. **Alle verwerfen** löscht die Kopien. Wiederherstellungskopien werden gelöscht, sobald
der Stammbaum gespeichert oder normal geschlossen wird.

## Sicherungskopien {#backups}

Jedes Mal, wenn Sie **von Hand** speichern (<kbd>Ctrl</kbd>+<kbd>S</kbd> oder **Speichern**), wird
die vorherige Version der Datei daneben als `name.finsight.bak1` aufbewahrt. Ältere Versionen
rücken nach `.bak2` … `.bak5` auf, sodass die letzten fünf manuellen Speicherstände immer
vorhanden sind. Das automatische Speichern legt keine Sicherungskopien an.

So kehren Sie zu einer älteren Version zurück:

1. Schließen Sie den Stammbaum in Family Insight.
2. Suchen Sie im Dateimanager den Ordner mit dem Stammbaum und erstellen Sie eine Kopie der
   gewünschten Sicherung, zum Beispiel `Kowalscy.finsight.bak2`.
3. Benennen Sie die Kopie so um, dass sie auf `.finsight` endet, zum Beispiel
   `Kowalscy (älter).finsight` (Ihr System fragt möglicherweise, ob Sie die Endung wirklich ändern
   möchten – bestätigen Sie).
4. Öffnen Sie sie in Family Insight.

::: tip Sie sehen keine Dateiendungen?
Windows und macOS blenden Dateiendungen standardmäßig aus. Unter Windows wählen Sie im Explorer
**Ansicht → Anzeigen → Dateinamenerweiterungen**; unter macOS im Finder **Finder → Einstellungen →
Erweitert → Alle Dateinamensuffixe einblenden**.
:::

## Einen Stammbaum öffnen {#opening}

- **☰ → Öffnen…** oder <kbd>Ctrl</kbd>+<kbd>O</kbd> (<kbd>⌘</kbd>+<kbd>O</kbd>) oder
  **Stammbaum öffnen…** auf dem Startbildschirm;
- **Doppelklick** auf eine `.finsight`-Datei (nach der Installation mit dem
  Windows-Installationsprogramm, der macOS-App oder dem `.deb`-Paket);
- eine `.finsight`-Datei auf das Fenster von Family Insight **ziehen** – eine `.csv`-Datei startet
  dabei einen [CSV-Import](./csv-import);
- **Datei → Zuletzt geöffnet** in der Menüleiste oder die Liste **Zuletzt geöffnet** auf dem
  Startbildschirm.

<Screenshot name="welcome-recent" alt="Der Startbildschirm mit der Liste Zuletzt geöffnet: ein Stammbaum, vor 2 Stunden geöffnet, und einer durchgestrichen mit Datei nicht gefunden" />

Verschobene oder gelöschte Dateien sind in der Liste durchgestrichen; entfernen Sie sie mit **×**.

Lässt sich eine Datei nicht öffnen, sagt Family Insight Ihnen den Grund – zum Beispiel, dass sie
mit einer neueren Version gespeichert wurde (aktualisieren Sie das Programm, siehe
[Installation](./install#updating)) oder dass sie beschädigt ist (versuchen Sie eine
[Sicherungskopie](#backups)).

## Einen Stammbaum auf einen anderen Computer bringen

Kopieren Sie die `.finsight`-Datei – per USB-Stick, E-Mail oder über einen Cloud-Ordner – und
öffnen Sie sie auf dem anderen Computer mit Family Insight. Die Fotos stecken in der Datei, mehr
ist nicht nötig.

::: warning Am selben Stammbaum an zwei Orten arbeiten
Family Insight führt keine Änderungen zusammen. Liegt der Stammbaum in einem geteilten oder
synchronisierten Ordner, öffnen Sie ihn immer nur auf einem Computer gleichzeitig.
:::
