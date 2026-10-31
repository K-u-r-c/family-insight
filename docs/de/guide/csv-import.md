---
description: Einen Stammbaum aus Excel, LibreOffice oder Google Tabellen importieren – Tabelle vorbereiten, Vorschau prüfen und häufige Fehler beheben.
---

# Import aus CSV

Ihre Familie steht schon in einer Tabelle? Family Insight kann sie aus einer **CSV**-Datei lesen –
dem Format, das jedes Tabellenprogramm speichern kann.

## 1. Die Tabelle vorbereiten

Verwenden Sie **eine Zeile pro Person** und diese Spalten (in beliebiger Reihenfolge, mit
englischen oder deutschen Namen):

| Spalte                       | Deutscher Name                | Was hineingehört                                                               |
| ---------------------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `id` **(Pflicht)**           | `id`                          | eine beliebige kurze, eindeutige Kennung der Person, zum Beispiel `p1`, `p2` … |
| `given_names`                | `vornamen`                    | Vornamen                                                                       |
| `surname`                    | `nachname`                    | Nachname                                                                       |
| `birth_surname`              | `geburtsname`                 | Geburtsname (Mädchenname)                                                      |
| `sex`                        | `geschlecht`                  | `weiblich` / `männlich` (oder `w`, `m`, `female`, `male`)                      |
| `birth_date`, `death_date`   | `geburtsdatum`, `sterbedatum` | `1890`, `05.1890`, `12.05.1890`, `~1890` … ([Daten](./editing#dates))          |
| `birth_place`, `death_place` | `geburtsort`, `sterbeort`     | die Stadt oder das Dorf                                                        |
| `living`                     | `lebend`                      | `ja` / `nein` (oder `yes` / `no`)                                              |
| `father_id`, `mother_id`     | `vater_id`, `mutter_id`       | die **id** von Vater und Mutter                                                |
| `partner_ids`                | `partner_ids`                 | die **ids** der Partner, getrennt durch `\|` – zum Beispiel `p2\|p5`           |
| `notes`                      | `notizen`                     | alles andere                                                                   |

Spaltennamen und Werte auf **Polnisch, Französisch, Spanisch, Italienisch, Portugiesisch und
Russisch** funktionieren ebenfalls (zum Beispiel `imiona`, `nom`, `fecha_de_nacimiento`, `фамилия`;
`mężczyzna`, `oui`, `да`) – alle Namen stehen in der
[Referenz zum CSV-Format](/developer/reference/csv-format#columns) (auf Englisch). Zu Vatersnamen
und Doppelnamen siehe [Namen aus anderen Ländern](./editing#name-conventions).

Jede Person braucht eine **id** und mindestens einen Vornamen oder einen Nachnamen; alle anderen
Spalten sind optional. Verwandte werden über die ids verbunden – zum Beispiel ist `p3` mit
`father_id` `p1` und `mother_id` `p2` das Kind von `p1` und `p2`. Eine Partnerschaft muss nur bei
einer der beiden Personen eingetragen sein.

::: tip Mit einem Beispiel beginnen
Laden Sie ein Beispiel mit 25 Personen herunter – [mit englischen Spaltennamen](/samples/example-en.csv)
oder [mit polnischen Spaltennamen](/samples/example-pl.csv) – oder eine leere Vorlage aus Family
Insight: **Hilfe → CSV-Vorlage herunterladen…**. Die vollständige Spezifikation steht in der
[Referenz zum CSV-Format](/developer/reference/csv-format) (auf Englisch).
:::

## 2. Als CSV speichern

| Programm         | So geht's                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Microsoft Excel  | **Datei → Speichern unter**, Dateityp **CSV UTF-8 (durch Trennzeichen getrennt) (\*.csv)**  |
| LibreOffice Calc | **Datei → Speichern unter…**, Dateityp **Text CSV (.csv)**, Zeichensatz **Unicode (UTF-8)** |
| Google Tabellen  | **Datei → Herunterladen → Kommagetrennte Werte (.csv)**                                     |

Kommas, Semikolons und Tabulatoren als Trennzeichen funktionieren alle. Auch Dateien, die nicht als
UTF-8 gespeichert sind (der einfache Typ **CSV (Trennzeichen-getrennt)** älterer Excel-Versionen),
funktionieren: Family Insight erkennt westeuropäischen (Windows-1252), mitteleuropäischen
(Windows-1250) und kyrillischen (Windows-1251) Text an seinen Buchstaben – Umlaute und ß aus
deutschen Excel-Dateien kommen also richtig an.

## 3. Importieren

Klicken Sie auf dem Startbildschirm auf **Aus CSV importieren…** oder wählen Sie bei geöffnetem
Stammbaum **☰ → CSV importieren…**. Sie können die `.csv`-Datei auch auf das Fenster ziehen. Bevor
sich etwas ändert, sehen Sie eine Vorschau:

<Screenshot name="csv-import" alt="Die Importvorschau: erkanntes Trennzeichen und erkannte Kodierung, die Spalten mit ihrer Zuordnung, eine Vorschau der ersten Zeilen und die Schaltfläche Importieren" />

- Oben: das erkannte **Trennzeichen und die Kodierung** des Textes.
- **Zeichensatz** – sehen Buchstaben wie ä, ö, é oder ж in der Vorschau falsch aus, wählen Sie hier
  einen anderen (erscheint bei Dateien, die von der Festplatte gelesen werden; der erkannte ist
  markiert).
- **Spalten** – wie jede Spalte Ihrer Datei verwendet wird. Wurde eine Spalte nicht erkannt (zum
  Beispiel, weil sie „Rufname“ heißt), wählen Sie in der Liste die richtige Bedeutung oder
  **Nicht importieren**, um sie zu überspringen.
- **Vorschau** – die ersten Zeilen so, wie Family Insight sie verstanden hat.
- Unten: wie viele Personen und Beziehungen importiert werden.

<Screenshot name="csv-import-columns" alt="Die Tabelle Spalten: Spalte in der Datei, Importiert als (eine Auswahlliste) und der Wert in der ersten Zeile" />

Ist bereits ein Stammbaum geöffnet, wählen Sie, ob Sie in **Einen neuen Stammbaum** oder in
**Den aktuellen Stammbaum** importieren. Beim Import in den aktuellen Stammbaum werden alle Personen
aus der Datei als neue Personen hinzugefügt (sie werden nicht mit vorhandenen Personen abgeglichen)
– in einem Schritt, den Sie [rückgängig machen](./undo) können.

Klicken Sie auf **Importieren**. Ein neuer Stammbaum aus einer CSV-Datei hat noch keine Datei –
[speichern Sie ihn](./files), um ihn zu behalten.

## Probleme und Warnungen {#problems}

**Probleme** (rot) müssen vor dem Import behoben werden – korrigieren Sie sie in Ihrer Tabelle
(oder ändern Sie die Spaltenzuordnung) und importieren Sie erneut. **Warnungen** (gelb) erklären,
was passieren wird; Sie können trotzdem importieren. Jede Meldung nennt die betroffene Zeile.

<Screenshot name="csv-import-errors" alt="Die Importvorschau mit 2 Problemen: Zeile 4 – die ID p2 wird mehrfach verwendet; Zeile 5 – verweist auf p9, aber es gibt keine Zeile mit dieser ID" />

### Probleme, die den Import verhindern

| Meldung                                                             | So beheben Sie es                                                                                                                          |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| _Die Datei ist leer._                                               | Wählen Sie die richtige Datei, oder prüfen Sie, ob die Tabelle mit Daten gespeichert wurde.                                                |
| _Die Datei hat keine Spalte „id“…_                                  | Fügen Sie eine Spalte `id` mit einer eindeutigen Kennung für jede Person hinzu.                                                            |
| _Die Datei hat keine Namensspalten („given_names“ oder „surname“)._ | Fügen Sie eine Spalte `given_names` oder `surname` (bzw. `vornamen` oder `nachname`) hinzu, oder ordnen Sie ihr eine vorhandene Spalte zu. |
| _Diese Zeile hat keine ID._                                         | Tragen Sie in dieser Zeile die id ein.                                                                                                     |
| _Die ID „p2“ wird mehrfach verwendet._                              | Geben Sie jeder Person eine andere id.                                                                                                     |
| _Die Person „p7“ hat weder Vornamen noch Nachnamen._                | Tragen Sie mindestens einen Namen ein (oder entfernen Sie die leere Zeile).                                                                |
| _Verweist auf „p9“, aber es gibt keine Zeile mit dieser ID._        | Korrigieren Sie die id in `father_id`, `mother_id` oder `partner_ids`, oder fügen Sie diese Person hinzu.                                  |
| _Die Person verweist auf sich selbst („p3“)._                       | Eine Person kann nicht ihr eigener Elternteil oder Partner sein – korrigieren Sie die id.                                                  |
| _Vater und Mutter sind dieselbe Person („p1“)._                     | Korrigieren Sie `father_id` oder `mother_id`.                                                                                              |
| _… wäre Vorfahre von sich selbst._                                  | Irgendwo ist ein Kind als Elternteil seines eigenen Vorfahren eingetragen – prüfen Sie die ids.                                            |

### Warnungen

| Meldung                                                                     | Was passiert                                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| _Die Spalte „…“ wird nicht erkannt und ignoriert._                          | Die Spalte wird übersprungen – ordnen Sie sie einem Feld zu, wenn Sie sie brauchen.           |
| _„…“ ist kein verständliches Datum; es wurde in die Notizen übernommen._    | Der Text bleibt in den Notizen der Person erhalten, damit nichts verloren geht.               |
| _„…“ ist kein bekanntes Geschlecht; als unbekannt importiert._              | Verwenden Sie `weiblich`, `männlich`, `divers` oder `unbekannt` (oder die englischen Wörter). |
| _„…“ ist weder ja noch nein; ob die Person lebt, bleibt unbekannt._         | Verwenden Sie `ja`/`nein`, `yes`/`no`, `true`/`false` oder `1`/`0`.                           |
| Datumswarnungen (Tod vor Geburt, älter als 120, Elternteil jünger als Kind) | Importiert wie geschrieben – siehe [Warnungen](./editing#warnings).                           |

## Was CSV nicht transportieren kann

CSV enthält Namen, Daten, Orte, Lebensstatus, leibliche Eltern, Partner und Notizen. **Fotos,
Datum und Ort von Partnerschaften, Adoptiv-, Stief- und Pflegeverhältnisse, die Hauptperson und die
Ansicht** gibt es nur in `.finsight`-Dateien – verwenden Sie diese, um alles zu behalten.
