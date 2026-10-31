---
description: Stammbäume mit GEDCOM zwischen Family Insight und anderen Genealogieprogrammen austauschen – Import aus Gramps, MyHeritage, Ancestry oder FamilySearch, Export als GEDCOM 5.5.1 oder 7.0.
---

# GEDCOM

**GEDCOM** ist das Dateiformat, mit dem Genealogieprogramme Stammbäume austauschen. Family Insight
liest Dateien in GEDCOM 5.5, 5.5.1 und 7.0 (`.ged` und `.gdz` mit enthaltenen Fotos) und schreibt
5.5.1 oder 7.0.

## Eine GEDCOM-Datei importieren

Wählen Sie **☰ → GEDCOM importieren…** (oder **Datei → Importieren → GEDCOM…** oder auf dem
Startbildschirm **Aus GEDCOM importieren…**), oder ziehen Sie einfach eine `.ged`-Datei auf das
Fenster. Eine Vorschau öffnet sich:

<Screenshot name="gedcom-import" alt="Das Fenster GEDCOM importieren: GEDCOM 5.5.1 aus MyHeritage, Zeichensatz UTF-8 (erkannt), eine Warnung zu einem ungefähren Datum, die nicht importierten Tags und die Zusammenfassung mit Personen, Familien, Ereignissen, Quellen und Medien" />

- Das Fenster zeigt die **Version** und das **Programm**, das die Datei geschrieben hat, und wie
  viele Personen, Familien, Ereignisse, Quellen und Fotos sie enthält.
- **Zeichensatz** – wird automatisch erkannt (UTF-8, UTF-16, ANSEL, ANSI, Windows-1250, Windows-1251). Sehen
  Buchstaben wie _ä_, _ö_, _ß_ oder _ł_ im Ergebnis falsch aus, wählen Sie einen anderen.
- **Warnungen** erklären, was nicht exakt übernommen werden konnte – zum Beispiel ein Datum wie
  _BET 1850 AND 1855_ oder ein Datum im julianischen Kalender. Der Originaltext bleibt in den
  Notizen der Person erhalten, damit nichts verloren geht.
- **Nicht importiert** listet programmspezifische Angaben auf, für die Family Insight keinen Platz
  hat (Datensatznummern, interne IDs …), gruppiert nach Tag.
- Bei geöffnetem Stammbaum können Sie in **Einen neuen Stammbaum** oder in
  **Den aktuellen Stammbaum** importieren. Das Hinzufügen ist ein Schritt, den Sie rückgängig machen
  können.

Fotos und Dokumente, auf die die Datei verweist, werden von dort geladen, wo die Datei sie angibt
– oder, wenn die Datei von einem anderen Computer stammt, aus dem Ordner der `.ged`-Datei und ihrem
Ordner `media`. Eine `.gdz`-Datei enthält sie bereits.

### Was übernommen wird

Namen (einschließlich Geburts- und Ehenamen), Geschlecht, Geburt und Tod, Lebensereignisse (Taufe,
Beerdigung, Auswanderung, Beruf, Militärdienst … und eigene Ereignisse), Notizen, Quellen und
Archive mit Belegen (Seite, Zuverlässigkeit, Abschrift), Fotos und Dokumente, Ehen, Verlobungen und
Scheidungen, Adoptiv-, Pflege- und Stiefeltern sowie Koordinaten von Orten.

### Aus einem anderen Programm kommen

| Programm                                  | So exportieren Sie eine GEDCOM-Datei                                                                                                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gramps**                                | **Stammbäume → Exportieren…**, wählen Sie _GEDCOM_.                                                                                                                                                       |
| **MyHeritage**                            | Family Tree Builder: **Datei → GEDCOM exportieren**; auf der Website: **Stammbaum → Stammbäume verwalten → Nach GEDCOM exportieren**.                                                                     |
| **Ancestry**                              | **Stammbäume → (Ihr Stammbaum) → Stammbaumeinstellungen → Stammbaum exportieren**.                                                                                                                        |
| **FamilySearch**                          | FamilySearch exportiert nicht den ganzen gemeinsamen Stammbaum; exportieren Sie Ihre eigenen Stammbäume mit Partnerprogrammen oder beginnen Sie mit einer GEDCOM-Datei, die jemand mit Ihnen geteilt hat. |
| **Legacy, RootsMagic, Family Tree Maker** | **File → Export → GEDCOM** (in deutschen Versionen **Datei → Exportieren → GEDCOM**).                                                                                                                     |

## Eine GEDCOM-Datei exportieren

Wählen Sie **☰ → GEDCOM exportieren…** (oder **Datei → Exportieren → GEDCOM…**):

<Screenshot name="gedcom-export" alt="Das Fenster GEDCOM exportieren mit der Version GEDCOM 5.5.1 oder 7.0, Fotos und Dokumente einschließen, Lebende Personen ausblenden und Notizen einschließen" />

- **Version** – **5.5.1** wird von fast allen Genealogieprogrammen gelesen; **7.0** ist die
  neueste Version.
- **Fotos und Dokumente einschließen** – bei 5.5.1 werden sie in einem Ordner `media` neben der
  GEDCOM-Datei gespeichert; bei 7.0 wird alles in eine einzige `.gdz`-Datei gepackt.
- **Lebende Personen ausblenden** – ersetzt die Namen von Personen, die noch leben könnten, durch
  „Lebend“ und lässt ihre Details weg. Verwenden Sie diese Option, wenn Sie Ihren Stammbaum an
  andere weitergeben.
- **Notizen einschließen** – lassen Sie die Option aus, um nur die Fakten weiterzugeben.

::: info Was GEDCOM nicht transportieren kann
Ob jemand lebt (festgehalten wird nur der Tod), die Webadresse einer Quelle (sie wird zu einer
Zeile in den Notizen der Quelle) und die Anzeigeeinstellungen Ihres Stammbaums. Alles andere ist
wieder da, wenn Sie die Datei erneut in Family Insight importieren.
:::
