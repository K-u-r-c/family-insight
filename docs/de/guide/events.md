---
description: Lebensereignisse festhalten – Taufe, Schulen, Berufe, Umzüge, Militärdienst, Beerdigung und eigene Ereignisse – mit Datum, Zeitraum und Ort.
---

# Lebensereignisse

Neben Geburt und Tod ist ein Leben voller weiterer Momente, die festgehalten werden sollten: eine
Taufe, Schule und Studium, Berufe, ein Umzug in eine andere Stadt oder ein anderes Land, der
Militärdienst, eine Beerdigung. Family Insight nennt sie **Lebensereignisse**.

## Ein Ereignis hinzufügen

1. Wählen Sie die Person aus und klicken Sie auf **Bearbeiten**.
2. Scrollen Sie zu **Lebensereignisse** und klicken Sie auf **Ereignis hinzufügen**.
3. Wählen Sie die Art des Ereignisses. Die Arten sind gruppiert in religiöse Ereignisse; Arbeit,
   Schule und Dienst; Umzüge und Wohnorte; und Sonstiges:

<Screenshot name="events-menu" alt="Das Menü Ereignis hinzufügen mit den Ereignisarten in den Gruppen Religiös, Arbeit, Schule und Dienst, Umzüge und Wohnorte und Sonstiges" />

Das neue Ereignis öffnet sich sofort, mit dem Cursor im Datumsfeld.

## Details ausfüllen

<Screenshot name="events-editor" alt="Lebensereignisse im Editor: Taufe und Militärdienst; der Militärdienst ist aufgeklappt mit Art, Beginn, Ende (3) und Ort; Schaltflächen zum Bearbeiten (1) und Nach-oben-Verschieben (2)" />

- **Art** – die Art des Ereignisses können Sie jederzeit ändern. Bei **Anderes Ereignis** tippen
  Sie einen eigenen Namen ein (zum Beispiel _Wallfahrt_).
- **Datum (oder Beginn)** und **Ende (optional)** – ein einzelnes Datum oder ein Zeitraum, etwa
  der Militärdienst von 1914 bis 1918. Daten funktionieren wie überall: `1914`, `05.1914`, `~1914`
  ([mehr über Daten](./editing#dates)).
- **Ort** – Vorschläge kommen aus den Orten, die im Stammbaum schon verwendet werden.
- **Beschreibung** – eine kurze Angabe: der Beruf, die Schule, das Regiment, das Schiff.
- **Notizen** – alles andere.

Jedes Feld wird gespeichert, wenn Sie es verlassen. Klicken Sie auf den Titel eines Ereignisses
oder auf den Stift (1), um es auf- oder zuzuklappen.

## Reihenfolge und Löschen

- Die Pfeile (2) verschieben ein Ereignis nach oben oder unten. Die gewählte Reihenfolge bleibt
  erhalten; in der Zeitleiste der Person werden Ereignisse ohnehin nach Datum sortiert.
- Der Papierkorb entfernt ein Ereignis. Es erscheint eine Meldung mit **Rückgängig** – und wie jede
  Änderung lässt sich auch diese mit <kbd>Ctrl</kbd>+<kbd>Z</kbd> rückgängig machen.

## Wo Ereignisse erscheinen

- **Details und Zeitleiste** – die Liste **Leben** der Person zeigt Ereignisse mit Symbol, Datum
  oder Zeitraum und Ort zwischen Geburt und Tod. Beerdigung und Einäscherung kommen nach dem Tod.

  <Screenshot name="events-details" alt="Die Zeitleiste von Jan Kowalski: geboren, Taufe, Militärdienst 1944–1945, Ausbildung 1946–1951 und Beruf 1951–1990" />

- **Suche** – Orte und Beschreibungen von Ereignissen sind durchsuchbar: Suchen Sie nach _Hamburg_,
  um alle zu finden, die über Hamburg ausgewandert sind.
- **Statistik** – die häufigsten Lebensereignisse und Ereignisorte und wie viele Personen noch
  keine Ereignisse haben ([Statistik](./statistics)).

## Warnungen

Wie bei anderen Daten gibt es auch bei Ereignissen behutsame Warnungen, wenn etwas nicht stimmt –
sie blockieren Sie nie:

- _Ein Ereignis von … liegt vor der Geburt._
- _Ein Ereignis von … liegt nach dem Tod._ (Beerdigung und Einäscherung sind in Ordnung.)
- _Dieses Ereignis endet, bevor es beginnt._

::: info CSV und ältere Versionen
Lebensereignisse werden in der `.finsight`-Datei gespeichert. CSV-Exporte enthalten eine Zeile pro
Person und keine Ereignisse. Seit Version 1.1 werden Stammbäume in einem neueren Dateiformat
gespeichert, das Platz für Ereignisse bietet: Family Insight 1.0 kann sie nicht öffnen und bittet
Sie, das Programm zu aktualisieren.
:::
