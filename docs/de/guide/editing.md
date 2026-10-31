---
description: Eine Person bearbeiten – Namen und Geburtsname, unvollständige und ungefähre Daten, Orte, Lebensstatus, Foto und Notizen.
---

# Person bearbeiten

Wählen Sie eine Person aus und klicken Sie im Detailbereich auf **Bearbeiten** – oder doppelklicken
Sie auf ihre Karte bzw. wählen Sie sie aus und drücken Sie <kbd>Enter</kbd>. Der Bereich wechselt
zum Editor:

<Screenshot name="person-editor" alt="Der Editor von Piotr Kowalski mit Foto, Namen, Geschlecht und Geburtsdatum" />

Jedes Feld wird gespeichert, sobald Sie es verlassen (<kbd>Tab</kbd> oder ein Klick woandershin);
<kbd>Esc</kbd> macht die Eingabe im aktuellen Feld rückgängig. Klicken Sie auf **Fertig**, um zu
den Details zurückzukehren.

## Namen

- **Vornamen** – alle Vornamen, zum Beispiel `Anna Maria`.
- **Nachname** – der aktuelle Nachname.
- **Geburtsname** – der Nachname bei der Geburt (Mädchenname). Klicken Sie auf
  **Geburtsname hinzufügen**, um das Feld einzublenden. Im Stammbaum und in den Listen erscheint er
  als „geb. Wiśniewska“.
- **Geschlecht** – weiblich, männlich, anderes oder unbekannt. Es bestimmt die Farbe der Karte und
  hilft beim Hinzufügen von Verwandten.

::: tip Namen aus anderen Ländern {#name-conventions}

- **Russisch, Ukrainisch, Belarussisch**: Schreiben Sie den Vatersnamen zu den Vornamen – Vornamen
  `Иван Петрович`, Nachname `Иванов`.
- **Spanisch und Portugiesisch**: Beide Nachnamen gehören in das Feld Nachname – `García Márquez`,
  `Santos Silva`.
- **Namenszusätze** wie von, van, de, da, dos oder di gehören zum Nachnamen (`van der Berg`); beim
  Sortieren überspringt die Liste sie.

:::

## Daten {#dates}

Alte Aufzeichnungen sind selten genau, deshalb dürfen Daten unvollständig oder ungefähr sein.
Tippen Sie das Datum in das Feld; die Zeile darunter zeigt, wie Family Insight es verstanden hat.

<Screenshot name="date-field" alt="Das Feld Geburtsdatum mit dem Text ~1955 (1) und der Liste für die Genauigkeit (2)" />

| Sie tippen                      | Bedeutung       | Anzeige auf Deutsch  | Anzeige auf Englisch |
| ------------------------------- | --------------- | -------------------- | -------------------- |
| `1890`                          | nur das Jahr    | 1890                 | 1890                 |
| `05.1890` oder `1890-05`        | Monat und Jahr  | Mai 1890             | May 1890             |
| `12.05.1890` oder `1890-05-12`  | ein genauer Tag | 12. Mai 1890         | 12 May 1890          |
| `12/05/1890`                    | ein genauer Tag | 12. Mai 1890         | 12 May 1890          |
| `Mai 1890`, `May 1890`          | Monat und Jahr  | Mai 1890             | May 1890             |
| `12. Mai 1890`, `12 Mai 1890`   | ein genauer Tag | 12. Mai 1890         | 12 May 1890          |
| `~1890`, `um 1890`, `ca. 1890`  | etwa            | um 1890              | about 1890           |
| `~05.1890`, `ca. Mai 1890`      | etwa            | ca. Mai 1890         | about May 1890       |
| `<1890`, `vor 1890`             | vor             | vor 1890             | before 1890          |
| `<12.05.1890`, `vor 12.05.1890` | vor             | vor dem 12. Mai 1890 | before 12 May 1890   |
| `>1890`, `nach 1890`            | nach            | nach 1890            | after 1890           |

Monatsnamen und Wörter wie _etwa_ oder _vor_ können Sie in jeder Sprache des Programms und in jeder
Form eingeben (`12 May 1890`, `12 maja 1890`, `1er mai 1890`, `12 de mayo de 1890`, `около 1890`),
auch abgekürzt (`Sept. 1890`) und mit österreichischen Monatsnamen (`Jänner 1890`). Nur wenn das
Programm auf Englisch eingestellt ist, wird `05/23/1890` als 23. Mai gelesen, sofern es kein Datum
mit dem Tag zuerst sein kann.

Gut zu wissen:

- Bei Punkten und Schrägstrichen steht der Tag vorn: `05.06.1890` ist der **5. Juni** 1890.
- Die **Liste für die Genauigkeit** neben dem Feld (**Genau**, **Etwa**, **Vor**, **Nach**) bewirkt
  dasselbe wie die Eingabe von `~`, `<` oder `>`.
- Auch die in der Genealogie üblichen englischen Abkürzungen `abt`, `bef`, `aft`, `circa` und `ca.`
  funktionieren.
- Ein Datum, das nicht verstanden wird, erscheint rot mit einem Beispiel für eine gültige Eingabe;
  es wird erst gespeichert, wenn es korrigiert ist.
- Das Alter wird aus den Daten berechnet. Ist ein Datum unvollständig oder ungefähr, wird das Alter
  als „etwa …“ angezeigt.

## Orte

Tragen Sie den Geburts- und Sterbeort ein (Stadt oder Dorf). Orte, die Sie im Stammbaum schon
verwendet haben, werden beim Tippen vorgeschlagen, sodass derselbe Ort immer gleich geschrieben
wird – das macht auch die [Statistik](./statistics) und die [Suche](./search) nützlicher.

## Lebensstatus {#life-status}

Wählen Sie **Lebend**, **Verstorben** oder **Unbekannt**. Bei lebenden Personen sind Sterbedatum
und Sterbeort ausgeblendet. Tragen Sie ein Sterbedatum oder einen Sterbeort ein, während der Status
unbekannt ist, gilt die Person als verstorben.

## Foto {#photo}

Klicken Sie auf **Foto hinzufügen…** und wählen Sie ein Bild, oder ziehen Sie eine Bilddatei auf
den runden Platzhalter. Unterstützt werden **JPG, PNG und WebP** bis 20 MB (HEIC-Fotos vom iPhone
müssen zuerst umgewandelt werden). Ein Fenster zum Zuschneiden öffnet sich: Ziehen Sie das Bild, um
das Gesicht zu positionieren, zoomen Sie mit dem Schieberegler und klicken Sie auf
**Foto verwenden**.

<Screenshot name="photo-crop" alt="Der Dialog Foto zuschneiden mit einem runden Rahmen, einem Zoom-Schieberegler und der Schaltfläche Foto verwenden" />

Das Foto wird **in der `.finsight`-Datei** gespeichert (verkleinert auf 512 × 512 Pixel), sodass
der Stammbaum eine einzige Datei bleibt, die Sie überallhin kopieren können. Mit **Ändern…** oder
**Entfernen** unter dem Foto ersetzen oder löschen Sie es. Auch ein Bild aus der Galerie der Person
kann zum Porträt werden (**⋯ → Als Porträt verwenden…**, siehe [Fotos und Dokumente](./media)).

## Lebensereignisse

Taufe, Schulen, Berufe, Umzüge, Militärdienst, Beerdigung … halten Sie im Abschnitt
**Lebensereignisse** des Editors fest. Siehe [Lebensereignisse](./events).

## Quellen

Die kleine Quellen-Schaltfläche neben **Name**, **Geburt**, **Leben** und jedem Lebensereignis hält
fest, woher eine Angabe stammt. Siehe [Quellen](./sources).

## Notizen

Alles, was erinnernswert ist – Beruf, Geschichten, wo ein Dokument aufbewahrt wird. Notizen
erscheinen im Detailbereich und werden in [CSV-Exporte](./csv-export) übernommen.

## Warnungen {#warnings}

Family Insight warnt vor Angaben, die wahrscheinlich ein Fehler sind – hindert Sie aber nie am
Speichern:

| Warnung                                                        | Wann                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------ |
| _Das Sterbedatum liegt vor dem Geburtsdatum._                  | das Sterbedatum ist früher als das Geburtsdatum        |
| _Damit wäre … Jahre alt. Stimmt das Datum?_                    | die Person wäre älter als 120 Jahre                    |
| _… wurde nach … geboren, ist aber als Elternteil eingetragen._ | ein leiblicher Elternteil ist nicht älter als das Kind |
