---
description: Lösungen für häufige Probleme – das Programm startet nicht, Umlaute in Excel, Fehler beim CSV-Import, Dateien, die sich nicht öffnen lassen – und wie Sie einen Fehler melden.
---

# Problemlösung

## Das Programm startet nicht

### Windows

| Symptom                                                             | Ursache und Lösung                                                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ein blaues Fenster **„Der Computer wurde durch Windows geschützt“** | SmartScreen kennt den Herausgeber noch nicht. Klicken Sie auf **Weitere Informationen → Trotzdem ausführen** (siehe [Installation](./install#windows)).                        |
| Das Antivirenprogramm blockiert oder löscht die Datei               | Laden Sie die Datei erneut von der offiziellen [Release-Seite](https://github.com/K-u-r-c/family-insight/releases/latest) herunter und lassen Sie sie im Antivirenprogramm zu. |

### macOS

| Symptom                                                                                                | Ursache und Lösung                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **„Family Insight“ kann nicht geöffnet werden, da Apple darin nicht nach Schadsoftware suchen kann …** | Die App ist noch nicht notariell beglaubigt. Klicken Sie im Ordner „Programme“ mit der rechten Maustaste darauf → **Öffnen**, oder **Systemeinstellungen → Datenschutz & Sicherheit → Dennoch öffnen**. |
| **„Family Insight“ ist beschädigt und kann nicht geöffnet werden**                                     | Die Quarantäne von macOS. Führen Sie einmal `xattr -cr "/Applications/Family Insight.app"` im Terminal aus.                                                                                             |
| Die App startet auf einem Mac mit Apple Silicon nicht                                                  | Vielleicht haben Sie die Intel-Version – laden Sie `mac-arm64.dmg` herunter (siehe [Welche Datei lade ich herunter?](./install#which-file)).                                                            |

### Linux {#linux}

| Symptom                                                                      | Ursache und Lösung                                                                                                                                                                                   |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beim Doppelklick auf das AppImage passiert nichts                            | Die Datei ist nicht ausführbar: `chmod +x family-insight-*.AppImage`.                                                                                                                                |
| `dlopen(): error loading libfuse.so.2` / _AppImages require FUSE to run_     | FUSE 2 fehlt: `sudo apt install libfuse2` (Ubuntu 24.04 und neuer: `libfuse2t64`) bzw. das Paket `fuse2` / `fuse-libs` in anderen Distributionen.                                                    |
| _The SUID sandbox helper binary was found, but is not configured correctly…_ | Manche Distributionen (zum Beispiel Ubuntu 24.04) schränken die Sandbox ein, die Electron verwendet. Installieren Sie stattdessen das `.deb`-Paket oder starten Sie das AppImage mit `--no-sandbox`. |
| Das Fenster ist unter Wayland unscharf oder flackert                         | Starten Sie es mit `--ozone-platform=x11`, um XWayland zu verwenden.                                                                                                                                 |

Um zu sehen, was vor sich geht, starten Sie das Programm aus einem Terminal – Fehlermeldungen
erscheinen dort.

## Umlaute sehen in Excel falsch aus, oder alles steht in einer Spalte

Exportieren Sie die CSV-Datei erneut und wählen Sie das Trennzeichen **Semikolon** – Excel mit
deutschen Regionaleinstellungen erwartet es. Die Datei enthält immer eine UTF-8-Kennung, sodass
Buchstaben wie ä, ö, ü und ß richtig erscheinen. Siehe [Export als CSV](./csv-export).

## Der CSV-Import zeigt Probleme

Jedes Problem nennt die Zeile und was zu ändern ist. Die vollständige Liste mit Lösungen steht unter
[Import aus CSV → Probleme und Warnungen](./csv-import#problems).

## Eine Datei lässt sich nicht öffnen

| Meldung                                                                                         | Was zu tun ist                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| _Die Datei existiert nicht mehr. Möglicherweise wurde sie verschoben oder gelöscht._            | Suchen Sie die Datei und öffnen Sie sie mit **Öffnen…**; entfernen Sie den alten Eintrag aus der Liste der zuletzt geöffneten Dateien. |
| _Sie haben keine Berechtigung, auf diese Datei zuzugreifen._                                    | Kopieren Sie die Datei in einen eigenen Ordner (zum Beispiel „Dokumente“) und öffnen Sie die Kopie.                                    |
| _Dieser Stammbaum wurde mit einer neueren Version von Family Insight gespeichert…_              | [Aktualisieren Sie Family Insight](./install#updating).                                                                                |
| _Die Datei ist beschädigt oder kein Stammbaum von Family Insight._                              | Öffnen Sie eine der [Sicherungskopien](./files#backups) (`.bak1` … `.bak5`) neben der Datei.                                           |
| _Dies ist keine Stammbaumdatei von Family Insight._ / _Dieser Dateityp wird nicht unterstützt._ | Wählen Sie eine `.finsight`-Datei; Tabellen öffnen Sie mit [Import aus CSV](./csv-import).                                             |
| _Die Datei enthält ungültige Daten und kann nicht sicher geöffnet werden._                      | Versuchen Sie eine Sicherungskopie; hilft das nicht, [melden Sie das Problem](#report-a-problem).                                      |

Wurde das Programm unerwartet beendet, starten Sie es erneut – es bietet an,
[ungespeicherte Arbeit wiederherzustellen](./files#crash-recovery).

## Ein Problem melden {#report-a-problem}

Wählen Sie **Hilfe → Problem melden…** – das öffnet die Seite für Fehlermeldungen auf GitHub (Sie
brauchen ein kostenloses GitHub-Konto). Bitte geben Sie an:

- was Sie getan haben, was Sie erwartet haben und was stattdessen passiert ist;
- die Version (**Hilfe → Über Family Insight**) und Ihr System (zum Beispiel Windows 11, macOS 15,
  Ubuntu 24.04);
- einen Screenshot der Meldung und die Ausgabe im Terminal, falls Sie das Programm aus einem
  Terminal gestartet haben.

Hängen Sie Ihren Stammbaum nicht öffentlich an – er enthält persönliche Daten. Wird eine Datei
benötigt, schreiben Sie das in die Meldung, und wir vereinbaren einen privaten Weg.
