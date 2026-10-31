---
description: Domande frequenti su Family Insight – privacy, uso offline, dimensione dei file, GEDCOM, condivisione e stampa.
---

# Domande frequenti

## Family Insight è gratuito?

Sì. È gratuito e open source (licenza MIT), senza pubblicità, account o abbonamenti.

## Dove sono i miei dati? Finiscono su Internet?

Il tuo albero si trova nel file `.finsight` che hai salvato, e da nessun'altra parte. Family
Insight funziona completamente **offline** e non invia mai i tuoi dati da nessuna parte. Una volta
al giorno chiede a GitHub se è disponibile una nuova versione ([aggiornamenti](./updates), si può
disattivare). Per il resto va online solo quando glielo chiedi tu: un collegamento come
**Aiuto → Guida utente** apre il tuo browser web e, se consenti la
[ricerca dei luoghi online](./places#lookup), **Cerca online** invia a OpenStreetMap il nome di quel
solo luogo, e nient'altro; se consenti le [mappe online](./map#online), la mappa scarica il suo
sfondo (solo l'area della mappa, mai i tuoi dati).

## Come faccio il backup del mio albero?

Copia il file `.finsight` su una chiavetta USB, un disco esterno o una cartella cloud di cui ti
fidi. Inoltre Family Insight conserva automaticamente le ultime cinque versioni accanto al file
([copie di backup](./files#backups)).

## Quanto può essere grande un albero? Le foto lo rendono enorme?

Gli alberi con mille persone e oltre funzionano senza problemi. I ritratti vengono ridotti a
512 × 512 pixel quando li aggiungi, quindi ognuno occupa solo qualche decina di kilobyte: un albero
con qualche centinaio di ritratti resta di pochi megabyte ed è facile da inviare per e-mail. Le
immagini vengono conservate nel file una sola volta, per quante volte siano usate, e il salvataggio
resta rapido anche quando il file arriva a centinaia di megabyte.

## Posso aprire un albero di un altro programma di genealogia (GEDCOM)?

Sì. Esporta un file GEDCOM dall'altro programma (Gramps, MyHeritage, Ancestry, Legacy …) e usa
**☰ → Importa GEDCOM…**: vedi [GEDCOM](./gedcom). Allo stesso modo puoi esportare il tuo albero per
altri programmi. I dati che si trovano in fogli di calcolo possono entrare tramite
[CSV](./csv-import).

## Come posso condividere l'albero con la mia famiglia?

- Invia il file `.finsight`: con Family Insight potranno aprirlo, esplorarlo e completarlo.
- Invia un **PDF o un'immagine** dell'albero a chi non ha il programma
  ([Immagini, PDF e stampa](./export-print)).
- Invia un file **CSV** a chi vuole usare un foglio di calcolo ([Esportare in CSV](./csv-export)).

Family Insight non unisce le modifiche, quindi mettetevi d'accordo su chi tiene la copia principale.

## Più persone possono modificare lo stesso albero contemporaneamente?

No. Tieni una sola copia principale e passatevela, oppure raccogli le aggiunte in un foglio di
calcolo e importale nell'albero corrente.

## Come stampo un albero grande?

Stampalo a parti (antenati o discendenti di una persona, poche generazioni), usa carta A3, oppure
esporta un PNG o un SVG grande per una copisteria. Vedi
[Suggerimenti per gli alberi grandi](./export-print#large-trees).

## Posso registrare adozioni, famiglie ricomposte e divorzi?

Sì: vedi [Relazioni](./relationships).

## Esiste una versione per smartphone?

No, Family Insight è un programma desktop per Windows, macOS e Linux.

## Posso aggiungere un'altra lingua?

Il programma è predisposto per altre lingue e i traduttori sono benvenuti: vedi
[Add a language](/developer/howto/language) nella documentazione per sviluppatori (in inglese).
