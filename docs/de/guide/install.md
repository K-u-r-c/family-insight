---
description: Family Insight unter Windows, macOS oder Linux herunterladen, installieren, aktualisieren und deinstallieren.
---

# Installation

Family Insight ist kostenlos. Laden Sie es von der
[Release-Seite auf GitHub](https://github.com/K-u-r-c/family-insight/releases/latest) herunter –
wählen Sie unter **Assets** die Datei für Ihr System.

## Welche Datei lade ich herunter? {#which-file}

| Ihr Computer                                     | Datei                                            |
| ------------------------------------------------ | ------------------------------------------------ |
| Windows 10 oder 11                               | `family-insight-<version>-setup.exe` (empfohlen) |
| Windows, ohne Installation                       | `family-insight-<version>-portable.exe`          |
| Mac mit Apple Silicon (M1, M2, M3, M4 …)         | `family-insight-<version>-mac-arm64.dmg`         |
| Mac mit Intel-Prozessor                          | `family-insight-<version>-mac-x64.dmg`           |
| Linux (jede Distribution)                        | `family-insight-<version>-linux-x86_64.AppImage` |
| Ubuntu, Debian, Linux Mint und andere mit `.deb` | `family-insight-<version>-linux-amd64.deb`       |

::: tip Welchen Mac habe ich?
Öffnen Sie das Apple-Menü → **Über diesen Mac**. Steht dort **Chip: Apple M…**, nehmen Sie
`mac-arm64`. Steht dort **Prozessor: … Intel**, nehmen Sie `mac-x64`.
:::

::: info Warum warnt mein System?
Family Insight ist noch nicht mit einem kostenpflichtigen Entwicklerzertifikat signiert. Deshalb
kennen Windows und macOS den Herausgeber nicht und bitten Sie, den ersten Start zu bestätigen. Wie
das geht, zeigen die Schritte unten. Das Programm selbst ist quelloffen – jeder kann nachprüfen,
was es tut.
:::

## Windows

### Installationsprogramm (empfohlen)

1. Laden Sie `family-insight-<version>-setup.exe` herunter und öffnen Sie die Datei.
2. Erscheint ein blaues Fenster **Der Computer wurde durch Windows geschützt** (SmartScreen),
   klicken Sie auf **Weitere Informationen** und dann auf **Trotzdem ausführen**.
3. Wählen Sie die Sprache des Installationsprogramms (English, Polski, Deutsch, Français, Español,
   Italiano, Português oder Русский) und folgen Sie den Schritten. Den Installationsordner können Sie
   ändern. Administratorrechte sind nicht nötig – das Programm wird für Ihr Benutzerkonto
   installiert.
4. Starten Sie Family Insight über das **Startmenü** oder die **Desktopverknüpfung**.

Nach der Installation öffnet ein Doppelklick auf eine `.finsight`-Datei diese in Family Insight.

### Portable Version

`family-insight-<version>-portable.exe` läuft ohne Installation – zum Beispiel von einem
USB-Stick. Laden Sie die Datei herunter und doppelklicken Sie darauf (SmartScreen wie oben
bestätigen). Die Einstellungen werden trotzdem in Ihrem Benutzerprofil gespeichert (siehe
[Deinstallieren](#uninstalling)); die portable Version registriert den Dateityp `.finsight` nicht.

## macOS

1. Laden Sie die `.dmg`-Datei für Ihren Mac herunter (siehe Tabelle oben) und öffnen Sie sie.
2. Ziehen Sie **Family Insight** im geöffneten Fenster auf den Ordner **Programme**.
3. Öffnen Sie **Programme**, klicken Sie **mit der rechten Maustaste** (oder mit gedrückter
   Control-Taste) auf **Family Insight**, wählen Sie **Öffnen** und im Dialog noch einmal
   **Öffnen**. Das ist nur beim ersten Mal nötig.

::: warning Wenn macOS kein „Öffnen“ anbietet
Öffnen Sie bei neueren macOS-Versionen **Systemeinstellungen → Datenschutz & Sicherheit**, scrollen
Sie zur Meldung über Family Insight und klicken Sie auf **Dennoch öffnen**.

Meldet macOS, die App **„ist beschädigt und kann nicht geöffnet werden“**, öffnen Sie die App
**Terminal**, führen Sie einmal diesen Befehl aus und starten Sie das Programm erneut:

```sh
xattr -cr "/Applications/Family Insight.app"
```

:::

## Linux

### AppImage (jede Distribution)

Das AppImage ist eine einzelne Datei, die ohne Installation läuft.

1. Laden Sie `family-insight-<version>-linux-x86_64.AppImage` herunter.
2. Machen Sie die Datei ausführbar: Öffnen Sie im Dateimanager **Eigenschaften → Zugriffsrechte**
   und erlauben Sie, sie als Programm auszuführen, oder im Terminal:

   ```sh
   chmod +x family-insight-*.AppImage
   ```

3. Doppelklicken Sie auf die Datei oder führen Sie `./family-insight-<version>-linux-x86_64.AppImage` aus.

AppImages benötigen **FUSE 2**. Die meisten Distributionen bringen es mit; unter Ubuntu 22.04
installieren Sie es mit `sudo apt install libfuse2` (unter Ubuntu 24.04 und neuer:
`sudo apt install libfuse2t64`). Startet das Programm nicht, siehe
[Problemlösung](./troubleshooting#linux).

::: tip Ein Menüeintrag für das AppImage
Ein AppImage trägt sich nicht selbst ins Anwendungsmenü ein. Werkzeuge wie **Gear Lever** oder
**AppImageLauncher** erledigen das für Sie – oder Sie verwenden das `.deb`-Paket unten.
:::

### Debian-Paket (Ubuntu, Debian, Linux Mint …)

```sh
sudo apt install ./family-insight-<version>-linux-amd64.deb
```

Das Paket fügt **Family Insight** dem Anwendungsmenü hinzu (Kategorie Büro) und öffnet
`.finsight`-Dateien per Doppelklick. Im Terminal starten Sie es mit `family-insight`.

## Aktualisieren {#updating}

Family Insight aktualisiert sich noch nicht selbst. Laden Sie eine neue Version von der
[Release-Seite](https://github.com/K-u-r-c/family-insight/releases/latest) herunter und
installieren Sie sie auf dieselbe Weise – über die alte (Windows-Installationsprogramm, `.deb`),
indem Sie die App im Ordner „Programme“ ersetzen (macOS) oder die alte AppImage-Datei. Ihre
Stammbäume sind eigene Dateien und bleiben unberührt; Ihre Einstellungen bleiben erhalten.

## Deinstallieren {#uninstalling}

| System             | So geht's                                                                      |
| ------------------ | ------------------------------------------------------------------------------ |
| Windows            | **Einstellungen → Apps → Installierte Apps → Family Insight → Deinstallieren** |
| Windows (portable) | Löschen Sie die `.exe`-Datei                                                   |
| macOS              | Ziehen Sie **Family Insight** aus „Programme“ in den Papierkorb                |
| Linux (AppImage)   | Löschen Sie die `.AppImage`-Datei                                              |
| Linux (`.deb`)     | `sudo apt remove family-insight`                                               |

Beim Deinstallieren werden Ihre `.finsight`-Dateien nie gelöscht. Einstellungen, die Liste der
zuletzt geöffneten Dateien und Wiederherstellungskopien bleiben in einem Ordner in Ihrem
Benutzerprofil; löschen Sie auch diesen, wenn Sie alles entfernen möchten:

| System  | Einstellungsordner                             |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |
