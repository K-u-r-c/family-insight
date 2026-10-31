---
description: Esporta il tuo albero genealogico in un foglio di calcolo CSV che si apre correttamente in Excel, LibreOffice Calc e Fogli Google.
---

# Esportare in CSV

Scegli **☰ → Esporta CSV…** (o **File → Esporta → CSV…** nella barra dei menu):

<Screenshot name="csv-export" alt="La finestra Esporta in CSV con il separatore di colonna (virgola o punto e virgola) e i nomi delle colonne (English, Polski, Deutsch, Français, Español, Italiano, Português o Русский)" />

1. **Separatore di colonna** – **Virgola** per la maggior parte dei programmi; **Punto e virgola**
   per Excel con impostazioni internazionali che usano la virgola come separatore decimale
   (italiano, polacco, tedesco, francese, spagnolo, portoghese, russo …), che altrimenti mette tutto
   in un'unica colonna. Il valore predefinito segue la lingua del programma (in italiano il punto e
   virgola) e Family Insight ricorda la tua scelta.
2. **Nomi delle colonne** – in una delle lingue del programma: italiano (`nomi`, `cognome` …),
   inglese (`given_names`, `surname` …), polacco (`imiona`, `nazwisko` …) e così via. I valori
   seguono i nomi delle colonne (`donna`, `sì` / `no` in italiano; `female`, `true` / `false` in
   inglese).
3. Fai clic su **Esporta…** e scegli dove salvare il file. Al termine compare un messaggio con
   **Mostra nella cartella**.

Il file usa la codifica UTF-8 con un indicatore dell'ordine dei byte (BOM), così le lettere
accentate (à, è, é, ì, ò, ù …) vengono mostrate correttamente quando lo apri in Excel con un doppio
clic.

## Che cosa viene esportato

Una riga per persona, in ordine di data di nascita, con queste colonne: id, nomi, cognome, cognome
di nascita, sesso, data e luogo di nascita, data e luogo di morte, vivente, padre e madre (tramite
id), partner (id separati da `|`) e note. Le persone ricevono id brevi `p1`, `p2` …, così il file è
facile da leggere e da modificare.

**Non vengono esportati:** foto, date e luoghi delle unioni, legami adottivi, acquisiti e di affido,
la persona principale e la vista. Tieni il file `.finsight` come copia principale: il CSV serve per
lavorare con i fogli di calcolo.

Puoi modificare il file e [importarlo di nuovo](./csv-import). Il formato esatto è descritto nella
[descrizione del formato CSV](/developer/reference/csv-format).

## Aprire il file in un foglio di calcolo

| Programma        | Suggerimento                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Microsoft Excel  | Fai doppio clic sul file. Se tutti i dati sono nella colonna A, esporta di nuovo con il separatore **punto e virgola**. |
| LibreOffice Calc | Apri il file; nella finestra di importazione scegli **UTF-8** e il separatore che hai usato per l'esportazione.         |
| Fogli Google     | **File → Importa → Carica**; il separatore viene rilevato automaticamente.                                              |
