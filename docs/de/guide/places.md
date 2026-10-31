---
description: Den Orten in Ihrem Stammbaum einen Standort geben – online suchen (optional) oder Koordinaten eingeben – und verschiedene Schreibweisen desselben Ortes zusammenführen.
---

# Orte

Orte werden überall als Text eingegeben – bei Geburt, Tod, Lebensereignissen, Ehen und Fotos.
**☰ → Orte…** (oder **Bearbeiten → Orte…**) sammelt sie in einer Liste, damit Sie jedem Ort einen
**Standort** für die [Karte](./map) geben und Schreibweisen vereinheitlichen können.

<Screenshot name="places-manager" alt="Das Fenster Orte: links eine Liste der Orte mit ihrer Häufigkeit, rechts das ausgewählte Łódź mit seinen Koordinaten, den Feldern Breitengrad und Längengrad, Standort speichern, Online suchen (1) und Mit einem anderen Ort zusammenführen" />

Die Liste zeigt jeden Ort mit seiner Häufigkeit und ob er einen Standort hat. Orte, die sich nur in
Groß- und Kleinschreibung, Leerzeichen, Umlauten oder Akzenten unterscheiden (_Köln_, _Koln_,
_ köln _ oder _Kraków_, _Krakow_), zählen als ein Ort; die häufigste Schreibweise wird angezeigt,
die anderen stehen unter **Auch geschrieben als**.

## Einen Standort online suchen {#lookup}

Klicken Sie auf **Online suchen** (1). Beim ersten Mal fragt Family Insight, ob es das darf:

<Screenshot name="places-consent" alt="Die Frage Orte online suchen? mit der Erklärung, dass nur der Ortsname an OpenStreetMap Nominatim gesendet wird, und den Schaltflächen Erlauben und Abbrechen" />

- Gesendet wird nur der **Name des Ortes** – keine Namen von Personen, keine Daten, sonst nichts –
  an [OpenStreetMap Nominatim](https://nominatim.org), einen kostenlosen Dienst.
- Wählen Sie den passenden Treffer aus den Ergebnissen; seine Koordinaten werden mit dem Stammbaum
  gespeichert.
- Antworten werden auf Ihrem Computer gespeichert, sodass derselbe Ort nicht zweimal angefragt
  wird.
- In den Einstellungen können Sie das wieder ausschalten (**⚙ → Orte online suchen**). Ohne diese
  Funktion – oder ohne Internetverbindung – funktioniert alles andere wie bisher.

## Koordinaten selbst eingeben

Tippen Sie **Breitengrad** und **Längengrad** ein (zum Beispiel _50,0619_ und _19,9369_ für Kraków
– als Dezimaltrennzeichen funktionieren Komma und Punkt) und klicken Sie auf
**Standort speichern**. Sie können die Werte von jeder Kartenwebsite kopieren.
**Standort entfernen** löscht sie wieder.

## Schreibweisen zusammenführen

Dasselbe Dorf wird oft auf mehrere Arten geschrieben – _Cracow_, _Krakau_, _Kraków_. Wählen Sie
eine davon aus, wählen Sie unter **Zusammenführen mit** den Zielort und klicken Sie auf
**Zusammenführen**: Jede Geburt, jeder Tod, jedes Ereignis, jede Ehe und jedes Foto erhält die
gewählte Schreibweise, und der Ort behält einen gemeinsamen Standort. Wie jede Änderung lässt sich
das Zusammenführen mit <kbd>Ctrl</kbd>+<kbd>Z</kbd> rückgängig machen.

::: info
Standorte werden in der `.finsight`-Datei gespeichert. Ihre Orte selbst ändern sich nicht – ein Ort
ohne Standort erscheint einfach nicht auf der Karte.
:::
