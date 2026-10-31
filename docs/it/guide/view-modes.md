---
description: Mostra tutta la famiglia o concentrati sugli antenati, sui discendenti o su entrambi di una persona, con un limite di generazioni.
---

# Modalità di vista

I pulsanti delle **modalità di vista** nella barra degli strumenti decidono chi viene mostrato
nell'albero:

<Screenshot name="view-controls" alt="I quattro pulsanti delle modalità di vista: 1 Famiglia, 2 Antenati, 3 Discendenti, 4 Clessidra" />

1. **Famiglia** – tutte le persone dell'albero.
2. **Antenati** – una persona, i suoi genitori, i nonni e così via.
3. **Discendenti** – una persona, i suoi figli, i nipoti e così via (con i loro partner).
4. **Clessidra** – antenati e discendenti di una persona insieme.

(Se la finestra è larga, i pulsanti mostrano anche il loro nome.) Le stesse scelte si trovano nel
menu **Visualizza** della barra dei menu.

## Gli antenati di chi? {#root-person}

Le viste Antenati, Discendenti e Clessidra partono dalla **persona principale**, indicata da una
piccola casa (🏠) sulla sua scheda. Se l'albero non ha una persona principale, partono dalla
persona **selezionata**.

Per rendere qualcuno la persona principale, fai clic destro sulla sua scheda e scegli
**Imposta come persona principale**. Lo stesso menu offre **Rimuovi persona principale**. Nella
[famiglia di esempio](./sample-family) la persona principale è Jan Kowalski.

### Antenati

<Screenshot name="view-ancestors" alt="La vista Antenati di Lena Kowalska: sopra di lei i genitori, i nonni e i bisnonni" />

### Discendenti

<Screenshot name="view-descendants" alt="La vista Discendenti di Jan Kowalski con i figli, i nipoti e i pronipoti" />

### Clessidra

<Screenshot name="view-hourglass" alt="La vista Clessidra di Jakub Kowalski con gli antenati sopra e la figlia sotto" />

## Quante generazioni? {#generations}

Nelle viste Antenati, Discendenti e Clessidra un elenco accanto ai pulsanti stabilisce quante
generazioni mostrare, da **1 generazione** a **Tutte le generazioni**. Con meno generazioni gli
alberi grandi sono più facili da leggere e da stampare.

## Salvata con il file

La modalità di vista, il numero di generazioni e i [rami compressi](./navigation#collapse) vengono
salvati nel file `.finsight` e ripristinati la volta successiva che lo apri. Cambiare la vista non è
una modifica, quindi non compare tra le azioni da [annullare](./undo).
