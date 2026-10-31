---
description: Trasferisci alberi genealogici tra Family Insight e altri programmi di genealogia con GEDCOM – importa da Gramps, MyHeritage, Ancestry o FamilySearch, esporta in GEDCOM 5.5.1 o 7.0.
---

# GEDCOM

**GEDCOM** è il formato di file che i programmi di genealogia usano per scambiarsi gli alberi
genealogici. Family Insight legge i file GEDCOM 5.5, 5.5.1 e 7.0 (`.ged`, e `.gdz` con le foto
all'interno) e scrive in 5.5.1 o 7.0.

## Importare un file GEDCOM

Scegli **☰ → Importa GEDCOM…** (o **File → Importa → GEDCOM…**, oppure **Importa da GEDCOM…** nella
schermata di benvenuto), o semplicemente trascina un file `.ged` sulla finestra. Si apre
un'anteprima:

<Screenshot name="gedcom-import" alt="La finestra Importa GEDCOM: GEDCOM 5.5.1 da MyHeritage, il set di caratteri UTF-8 (rilevato), un avviso su una data approssimata, i tag non importati e il riepilogo con persone, famiglie, eventi, fonti e media" />

- La finestra mostra la **versione** e il **programma** che ha scritto il file, e quante persone,
  famiglie, eventi, fonti e foto contiene.
- **Set di caratteri** – rilevato automaticamente (UTF-8, UTF-16, ANSEL, ANSI, Windows-1250, Windows-1251). Se
  nel risultato lettere come _à_, _ł_, _ö_ o _ß_ appaiono sbagliate, scegline un altro.
- Gli **avvisi** spiegano che cosa non è stato possibile riprendere esattamente, ad esempio una data
  come _BET 1850 AND 1855_ o una data del calendario giuliano. Il testo originale viene conservato
  nelle note della persona, così non si perde nulla.
- **Informazioni non importate** elenca i dettagli specifici di altri programmi per cui Family
  Insight non ha posto (numeri di record, ID interni …), raggruppati per tag.
- Con un albero aperto puoi importare in **Un nuovo albero** oppure aggiungere a
  **L'albero corrente**. L'aggiunta è un unico passaggio che puoi annullare.

Le foto e i documenti indicati nel file vengono caricati dal percorso indicato nel file oppure, se il
file proviene da un altro computer, dalla cartella del file `.ged` e dalla sua cartella `media`. Un
file `.gdz` li contiene al suo interno.

### Che cosa viene conservato

Nomi (compresi cognomi di nascita e da sposati), sesso, nascita e morte, eventi (battesimo,
sepoltura, emigrazione, professione, servizio militare … ed eventi personalizzati), note, fonti e
archivi con le citazioni (pagina, affidabilità, trascrizione), foto e documenti, matrimoni,
fidanzamenti e divorzi, genitori adottivi, affidatari e acquisiti, e coordinate dei luoghi.

### Se arrivi da un altro programma

| Programma                                 | Come esportare un file GEDCOM                                                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gramps**                                | **Alberi genealogici → Esporta…**, scegli _GEDCOM_.                                                                                                 |
| **MyHeritage**                            | Family Tree Builder: **File → Esporta in GEDCOM**; sul sito: **Albero genealogico → Gestisci alberi → Esporta in GEDCOM**.                          |
| **Ancestry**                              | **Trees → (il tuo albero) → Tree settings → Export tree**.                                                                                          |
| **FamilySearch**                          | FamilySearch non esporta l'intero albero condiviso; esporta i tuoi alberi con i programmi partner, oppure parti da un GEDCOM condiviso da qualcuno. |
| **Legacy, RootsMagic, Family Tree Maker** | **File → Export → GEDCOM**.                                                                                                                         |

## Esportare un file GEDCOM

Scegli **☰ → Esporta GEDCOM…** (o **File → Esporta → GEDCOM…**):

<Screenshot name="gedcom-export" alt="La finestra Esporta GEDCOM con la versione GEDCOM 5.5.1 o 7.0, Includi foto e documenti, Nascondi le persone viventi e Includi le note" />

- **Versione** – la **5.5.1** è letta da quasi tutti i programmi di genealogia; la **7.0** è la
  versione più recente.
- **Includi foto e documenti** – con la 5.5.1 vengono salvati in una cartella `media` accanto al
  file GEDCOM; con la 7.0 tutto viene raccolto in un unico file `.gdz`.
- **Nascondi le persone viventi** – sostituisce con “Vivente” i nomi delle persone che potrebbero
  essere in vita ed esclude i loro dettagli. Usalo quando condividi il tuo albero con altri.
- **Includi le note** – lascialo disattivato per condividere solo i fatti.

::: info Che cosa non può contenere un GEDCOM
Se una persona è viva (viene registrata solo la morte), l'indirizzo web di una fonte (diventa una
riga nelle note della fonte) e le impostazioni di visualizzazione del tuo albero. Tutto il resto
torna quando importi di nuovo il file in Family Insight.
:::
