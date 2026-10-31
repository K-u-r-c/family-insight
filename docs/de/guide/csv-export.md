---
description: Ihren Stammbaum als CSV-Tabelle exportieren, die sich in Excel, LibreOffice Calc und Google Tabellen richtig öffnet.
---

# Export als CSV

Wählen Sie **☰ → CSV exportieren…** (oder in der Menüleiste **Datei → Exportieren → CSV…**):

<Screenshot name="csv-export" alt="Der Dialog Als CSV exportieren mit dem Spaltentrennzeichen (Komma oder Semikolon) und den Spaltennamen (English, Polski, Deutsch, Français, Español, Italiano, Português oder Русский)" />

1. **Spaltentrennzeichen** – **Semikolon** für Excel mit Regionaleinstellungen, die ein Komma als
   Dezimaltrennzeichen verwenden (Deutsch, Polnisch, Französisch, Spanisch, Italienisch,
   Portugiesisch, Russisch …) – sonst landet alles in einer Spalte; **Komma** für die meisten
   anderen Programme. Die Voreinstellung richtet sich nach der Sprache des Programms (auf Deutsch
   das Semikolon), und Family Insight merkt sich Ihre Wahl.
2. **Spaltennamen** – in einer der Sprachen des Programms: Deutsch (`vornamen`, `nachname` …),
   Englisch (`given_names`, `surname` …), Polnisch (`imiona`, `nazwisko` …) und so weiter. Die
   Werte folgen der Sprache der Spaltennamen (`weiblich`, `ja` / `nein` auf Deutsch; `female`,
   `true` / `false` auf Englisch).
3. Klicken Sie auf **Exportieren…** und wählen Sie, wo die Datei gespeichert werden soll. Ist der
   Export fertig, erscheint eine Meldung mit **Im Ordner anzeigen**.

Die Datei verwendet UTF-8 mit Byte-Order-Mark, sodass Umlaute und ß (ä, ö, ü, ß …) und auch andere
Buchstaben wie ą, ł oder é richtig angezeigt werden, wenn Sie die Datei in Excel doppelklicken.

## Was exportiert wird

Eine Zeile pro Person, sortiert nach Geburtsdatum, mit diesen Spalten: id, Vornamen, Nachname,
Geburtsname, Geschlecht, Geburtsdatum und -ort, Sterbedatum und -ort, lebend, Vater und Mutter (per
id), Partner (ids getrennt durch `|`) und Notizen. Die Personen erhalten kurze ids `p1`, `p2` …,
damit die Datei leicht zu lesen und zu bearbeiten ist.

**Nicht exportiert werden:** Fotos, Datum und Ort von Partnerschaften, Adoptiv-, Stief- und
Pflegeverhältnisse, die Hauptperson und die Ansicht. Behalten Sie die `.finsight`-Datei als
Hauptkopie – CSV ist für die Arbeit mit Tabellen gedacht.

Sie können die Datei bearbeiten und [wieder importieren](./csv-import). Das genaue Format
beschreibt die [Referenz zum CSV-Format](/developer/reference/csv-format) (auf Englisch).

## Die Datei in einem Tabellenprogramm öffnen

| Programm         | Tipp                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Microsoft Excel  | Doppelklicken Sie auf die Datei. Steht alles in Spalte A, exportieren Sie erneut mit dem Trennzeichen **Semikolon**. |
| LibreOffice Calc | Öffnen Sie die Datei; wählen Sie im Importfenster **UTF-8** und das Trennzeichen, mit dem Sie exportiert haben.      |
| Google Tabellen  | **Datei → Importieren → Hochladen**; das Trennzeichen wird automatisch erkannt.                                      |
