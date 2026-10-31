---
description: Salvare e aprire gli alberi genealogici, salvataggio automatico, ripristino dopo un arresto anomalo, copie di backup, file recenti e trasferimento di un albero su un altro computer.
---

# Salvare e aprire

## Il file `.finsight`

Ogni albero genealogico è un unico file con l'estensione **`.finsight`** che contiene tutto:
persone, relazioni, fonti, foto e il modo in cui l'albero veniva visualizzato. Decidi tu dove
tenerlo, e puoi copiarlo, farne un backup o inviarlo per e-mail come qualsiasi altro documento.

::: info Versioni precedenti
Dalla versione 1.1 un file `.finsight` è un pacchetto compresso (come un file zip), in modo che
foto e documenti scansionati vi trovino posto in modo efficiente: ogni immagine viene conservata
una sola volta, per quante volte sia usata. Family Insight 1.1 apre gli alberi della 1.0 e li salva
nel nuovo formato; **la 1.0 non riesce ad aprire gli alberi salvati con la 1.1**: aggiorna il
programma su tutti i computer che usi (vedi [Installazione](./install#updating)).
:::

## Salvare

| Per                       | Fai così                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| salvare                   | <kbd>Ctrl</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>S</kbd>), oppure **☰ → Salva**                                         |
| salvare con un altro nome | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>S</kbd>), oppure **☰ → Salva con nome…** |

<Screenshot name="file-menu" alt="Il menu File con Nuovo albero, Apri, Salva, Salva con nome, Importa CSV, Importa GEDCOM, Esporta CSV, Esporta GEDCOM, Esporta immagine, Fonti, Luoghi e Stampa" />

La prima volta che salvi un nuovo albero, scegli una cartella e un nome (vengono proposti la
cartella Documenti e il nome dell'albero). La barra di stato in basso ti dice sempre se è tutto
salvato:

<Screenshot name="unsaved-status" alt="La barra di stato che mostra Modifiche non salvate (1)" />

Se chiudi la finestra, apri un altro albero o esci mentre ci sono modifiche non salvate, Family
Insight ti chiede se vuoi **Salva**, **Non salvare** o **Annulla**.

## Salvataggio automatico {#autosave}

Una volta che un albero è stato salvato in un file, Family Insight lo salva automaticamente **2
secondi dopo ogni modifica**. Puoi disattivare questa funzione nelle [impostazioni](./settings)
(⚙ → **Salva automaticamente**); in quel caso salva tu con <kbd>Ctrl</kbd>+<kbd>S</kbd>.

Un albero nuovo che non è mai stato salvato non viene salvato automaticamente: salvalo una volta per
dargli un file.

## Ripristino dopo un arresto anomalo {#crash-recovery}

Finché un albero ha modifiche non salvate (ad esempio un albero nuovo, o con il salvataggio
automatico disattivato), Family Insight tiene una copia di ripristino nascosta, aggiornata 2 secondi
dopo ogni modifica. Se il programma o il computer si blocca, all'avvio successivo ti viene proposto
di ripristinare quel lavoro:

<Screenshot name="recovery" alt="La finestra Ripristinare il lavoro non salvato? con l'albero Kowalscy, mai salvato, e i pulsanti Ripristina e Scarta tutto" />

Fai clic su **Ripristina** per aprire l'albero com'era, poi salvalo. **Scarta tutto** elimina le
copie. Le copie di ripristino vengono cancellate non appena l'albero viene salvato o chiuso
normalmente.

## Copie di backup {#backups}

Ogni volta che salvi **manualmente** (<kbd>Ctrl</kbd>+<kbd>S</kbd> o **Salva**), la versione
precedente del file viene conservata accanto come `nome.finsight.bak1`. Le versioni più vecchie
passano a `.bak2` … `.bak5`, così gli ultimi cinque salvataggi manuali sono sempre disponibili. Il
salvataggio automatico non crea copie di backup.

Per tornare a una versione precedente:

1. Chiudi l'albero in Family Insight.
2. Nel gestore dei file, trova la cartella con l'albero e fai una copia del backup che ti serve, ad
   esempio `Kowalscy.finsight.bak2`.
3. Rinomina la copia in modo che termini con `.finsight`, ad esempio
   `Kowalscy (precedente).finsight` (il sistema potrebbe chiederti se vuoi davvero cambiare
   l'estensione: conferma).
4. Aprila in Family Insight.

::: tip Non vedi le estensioni?
Windows e macOS nascondono le estensioni dei file per impostazione predefinita. Su Windows, in
Esplora file scegli **Visualizza → Mostra → Estensioni nomi file**; su macOS, nel Finder scegli
**Finder → Impostazioni → Avanzate → Mostra tutte le estensioni dei nomi di file**.
:::

## Aprire un albero {#opening}

- **☰ → Apri…** o <kbd>Ctrl</kbd>+<kbd>O</kbd> (<kbd>⌘</kbd>+<kbd>O</kbd>), oppure **Apri albero…**
  nella schermata di benvenuto;
- **doppio clic** su un file `.finsight` (dopo l'installazione con il programma di installazione per
  Windows, l'app per macOS o il pacchetto `.deb`);
- **trascina** un file `.finsight` sulla finestra di Family Insight; se trascini un file `.csv`
  parte un'[importazione CSV](./csv-import);
- **File → Apri recenti** nella barra dei menu, oppure l'elenco **Recenti** nella schermata di
  benvenuto.

<Screenshot name="welcome-recent" alt="La schermata di benvenuto con l'elenco Recenti: un albero aperto 2 ore fa e uno barrato come File non trovato" />

I file spostati o eliminati sono barrati nell'elenco dei recenti; rimuovili con **×**.

Se un file non si apre, Family Insight ti dice perché: ad esempio che è stato salvato con una
versione più recente (aggiorna il programma, vedi [Installazione](./install#updating)) o che è
danneggiato (prova una [copia di backup](#backups)).

## Trasferire un albero su un altro computer

Copia il file `.finsight` – su una chiavetta USB, per e-mail o tramite una cartella cloud – e aprilo
con Family Insight sull'altro computer. Le foto sono all'interno del file, quindi non serve
nient'altro.

::: warning Lavorare sullo stesso albero in due posti
Family Insight non unisce le modifiche. Se tieni l'albero in una cartella condivisa o
sincronizzata, aprilo su un solo computer alla volta.
:::
