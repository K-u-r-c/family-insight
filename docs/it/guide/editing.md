---
description: Modificare una persona – nomi e cognome di nascita, date parziali e approssimative, luoghi, stato in vita, foto e note.
---

# Modificare una persona

Seleziona una persona e fai clic su **Modifica** nel pannello dei dettagli, oppure fai doppio clic
sulla sua scheda, o selezionala e premi <kbd>Enter</kbd>. Il pannello passa alla modifica:

<Screenshot name="person-editor" alt="La modifica di Piotr Kowalski con la foto, i nomi, il sesso e la data di nascita" />

Ogni campo viene salvato non appena lo lasci (<kbd>Tab</kbd> o un clic altrove); <kbd>Esc</kbd>
annulla ciò che hai scritto nel campo corrente. Fai clic su **Fatto** per tornare ai dettagli.

## Nomi

- **Nomi** – tutti i nomi di battesimo, ad esempio `Anna Maria`.
- **Cognome** – il cognome attuale.
- **Cognome di nascita** – il cognome alla nascita (da nubile). Fai clic su **Aggiungi cognome di nascita**
  per mostrare il campo. Nell'albero e negli elenchi compare come “nata Wiśniewska”.
- **Sesso** – femmina, maschio, altro o sconosciuto. Determina il colore della scheda e aiuta
  quando aggiungi i parenti.

::: tip Nomi di altri paesi {#name-conventions}

- **Russi, ucraini, bielorussi**: scrivi il patronimico insieme ai nomi – nomi `Иван Петрович`,
  cognome `Иванов`.
- **Spagnoli e portoghesi**: entrambi i cognomi vanno nel campo del cognome – `García Márquez`,
  `Santos Silva`.
- **Particelle** come von, van, de, da, di, del o della fanno parte del cognome (`van der Berg`,
  `Della Rovere`); nell'ordinamento l'elenco le salta.

:::

## Date {#dates}

I documenti antichi raramente sono precisi, quindi le date possono essere parziali o
approssimative. Scrivi la data nel campo; la riga sotto mostra come Family Insight l'ha capita.

<Screenshot name="date-field" alt="Il campo Data di nascita con il testo ~1955 (1) e l'elenco della precisione (2)" />

| Scrivi                            | Significato   | In italiano    | In inglese  |
| --------------------------------- | ------------- | -------------- | ----------- |
| `1890`                            | solo l'anno   | 1890           | 1890        |
| `05/1890` o `1890-05`             | mese e anno   | maggio 1890    | May 1890    |
| `12/05/1890` o `1890-05-12`       | giorno esatto | 12 maggio 1890 | 12 May 1890 |
| `12.05.1890`                      | giorno esatto | 12 maggio 1890 | 12 May 1890 |
| `maggio 1890`, `mag. 1890`        | mese e anno   | maggio 1890    | May 1890    |
| `12 maggio 1890`, `12 mag 1890`   | giorno esatto | 12 maggio 1890 | 12 May 1890 |
| `~1890`, `circa 1890`, `ca. 1890` | circa         | circa 1890     | about 1890  |
| `<1890`, `prima del 1890`         | prima         | prima del 1890 | before 1890 |
| `>1890`, `dopo il 1890`           | dopo          | dopo il 1890   | after 1890  |

I nomi dei mesi e parole come _circa_ e _prima_ si possono scrivere in qualsiasi lingua del
programma e in qualsiasi forma (`1º marzo 1890`, `verso il 1890`, `12 May 1890`, `12. Mai 1890`,
`1er mai 1890`, `около 1890`), anche abbreviati (`sett. 1890`). Il primo giorno del mese viene
mostrato come `1º`.

Buono a sapersi:

- Con punti e barre il giorno viene prima: `05/06/1890` è il **5 giugno** 1890.
- L'**elenco della precisione** accanto al campo (**Esatta**, **Circa**, **Prima**, **Dopo**) fa
  la stessa cosa che scrivere `~`, `<` o `>`.
- Funzionano anche le abbreviazioni usate in genealogia nei documenti inglesi: `abt`, `bef`,
  `aft`, `circa` e `ca.`.
- Una data che non si riesce a capire viene mostrata in rosso con un esempio di ciò che funziona;
  non viene salvata finché non la correggi.
- L'età viene calcolata dalle date. Quando una data è parziale o approssimativa, l'età viene
  mostrata come “circa …”.

## Luoghi

Scrivi la città o il paese di nascita e di morte. I luoghi che hai già usato nell'albero vengono
suggeriti mentre scrivi, così lo stesso luogo è sempre scritto allo stesso modo – e anche le
[statistiche](./statistics) e la [ricerca](./search) diventano più utili.

## Stato in vita {#life-status}

Scegli **Vivente**, **Deceduto/a** o **Sconosciuto**. Per le persone viventi la data e il luogo
di morte sono nascosti. Se inserisci una data o un luogo di morte mentre lo stato è sconosciuto,
la persona viene considerata deceduta.

## Foto {#photo}

Fai clic su **Aggiungi foto…** e scegli un'immagine, oppure trascina un file di immagine sul
cerchio. Sono supportati i formati **JPG, PNG e WebP** fino a 20 MB (le foto HEIC degli iPhone
vanno prima convertite). Si apre una finestra di ritaglio: trascina l'immagine per posizionare il
viso, usa il cursore per lo zoom e fai clic su **Usa foto**.

<Screenshot name="photo-crop" alt="La finestra Ritaglia la foto con una cornice rotonda, un cursore per lo zoom e il pulsante Usa foto" />

La foto viene conservata **all'interno del file `.finsight`** (ridimensionata a 512 × 512 pixel),
così l'albero resta un unico file che puoi copiare ovunque. Usa **Cambia…** o **Rimuovi** sotto la
foto per sostituirla o eliminarla. Anche un'immagine della galleria della persona può diventare il
ritratto (**⋯ → Usa come ritratto…**, vedi [Foto e documenti](./media)).

## Eventi

Battesimo, scuole, lavori, traslochi, servizio militare, sepoltura … si registrano nella sezione
**Eventi** della modifica. Vedi [Eventi](./events).

## Fonti

Il piccolo pulsante delle fonti accanto a **Nome**, **Nascita**, **Vita** e a ogni evento registra
da dove proviene un dato. Vedi [Fonti](./sources).

## Note

Tutto ciò che vale la pena ricordare: professione, storie, dove è conservato un documento. Le note
compaiono nel pannello dei dettagli e sono incluse nelle [esportazioni CSV](./csv-export).

## Avvisi {#warnings}

Family Insight segnala i dati che probabilmente sono un errore, ma non ti impedisce mai di
salvarli:

| Avviso                                                     | Quando                                             |
| ---------------------------------------------------------- | -------------------------------------------------- |
| _La data di morte è precedente alla data di nascita._      | la data di morte è anteriore a quella di nascita   |
| _Così … avrebbe … anni. La data è corretta?_               | la persona avrebbe più di 120 anni                 |
| _… risulta genitore di …, ma la sua nascita è successiva._ | un genitore biologico non è più anziano del figlio |
