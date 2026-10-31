---
description: Sprache, Design, Kartengröße und automatisches Speichern von Family Insight ändern sowie die Einstellungen finden oder zurücksetzen.
---

# Einstellungen

Klicken Sie rechts in der Symbolleiste auf die Schaltfläche **Einstellungen** (⚙):

<Screenshot name="settings-menu" alt="Das Einstellungsmenü mit Design (System, Hell, Dunkel), Stil (Modern, Gobelin), Sprache (English, Polski, Deutsch, Français, Español, Italiano, Português, Русский), Karten (Großzügig, Kompakt) und Automatisch speichern" />

| Einstellung                         | Auswahl                                                                   | Was sie bewirkt                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Design**                          | System, Hell, Dunkel                                                      | Die Farben des Programms. **System** folgt dem hellen oder dunklen Modus Ihres Computers.                                                                           |
| **Stil**                            | Modern, Gobelin                                                           | Das Aussehen des ganzen Programms. **Gobelin** erinnert an einen alten Familienwandteppich: Pergament und Tinte im hellen Design, dunkles Grün und Gold im dunklen. |
| **Sprache**                         | English, Polski, Deutsch, Français, Español, Italiano, Português, Русский | Die Sprache des ganzen Programms, einschließlich Menüleiste und Dialogen. Sie ändert sich sofort.                                                                   |
| **Karten**                          | Großzügig, Kompakt                                                        | Die Größe der Karten im Stammbaum. Kompakte Karten bringen mehr Personen auf den Bildschirm und aufs Papier.                                                        |
| **Automatisch speichern**           | ein (Standard) / aus                                                      | [Automatisches Speichern](./files#autosave) von Stammbäumen, die bereits eine Datei haben.                                                                          |
| **Automatisch nach Updates suchen** | ein (Standard) / aus                                                      | Eine tägliche Suche nach neuen Versionen ([Updates](./updates)); **Jetzt suchen…** sucht sofort.                                                                    |
| **Karten online laden**             | aus (Standard) / ein                                                      | Lädt den Kartenhintergrund von OpenStreetMap, während Sie die [Karte](./map#online) verwenden.                                                                      |
| **Orte online suchen**              | aus (Standard) / ein                                                      | Erlaubt **Online suchen**, einen Ortsnamen an OpenStreetMap zu senden, um seine Koordinaten zu finden ([Orte](./places#lookup)).                                    |

Den Stil können Sie auch in der Menüleiste ändern: **Ansicht → Stil**. Im Stil Gobelin erscheinen die Personen im Stammbaum als gerahmte Medaillons mit dem Porträt über dem Namen, Partner sind durch einen kleinen Knoten verbunden und die Linien sehen aus wie Goldfaden.

<Screenshot name="tapestry-tree" alt="Die Beispielfamilie im Stil Gobelin: der Familienname in einem gerahmten Titel über dem Stammbaum, die Personen als gerahmte Medaillons, verbunden durch Goldfaden" />

Design und Sprache lassen sich auch auf dem Startbildschirm (rechte obere Ecke) und in der
Menüleiste im Menü **Ansicht** ändern. Im Menü **Ansicht** blenden Sie außerdem die Personenliste
und die Übersichtskarte ein oder aus.

Family Insight merkt sich noch mehr für Sie: Größe und Position des Fensters, die Breite der
Bereiche, das zuletzt verwendete CSV-Trennzeichen und die [zuletzt geöffneten Dateien](./files#opening).

::: tip Das CSV-Trennzeichen folgt der Sprache
Wenn Sie die Sprache im Menü **Ansicht** umstellen, ändert sich das voreingestellte
CSV-Trennzeichen mit – ein Semikolon für Deutsch (und Polnisch, Französisch …), ein Komma für
Englisch. Beim [Exportieren](./csv-export) können Sie immer ein anderes wählen.
:::

## Wo die Einstellungen gespeichert werden

Die Einstellungen werden in einer kleinen Datei, `settings.json`, in Ihrem Benutzerprofil
gespeichert – getrennt von Ihren Stammbäumen:

| System  | Ordner                                         |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |

## Einstellungen zurücksetzen

Schließen Sie Family Insight und löschen Sie `settings.json` aus diesem Ordner. Beim nächsten
Start gelten die Standardeinstellungen (und die Sprache Ihres Systems). Ihre Stammbäume sind davon
nicht betroffen.
