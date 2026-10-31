---
description: Assegna una posizione ai luoghi del tuo albero – cercala online (facoltativo) o inserisci le coordinate – e unisci grafie diverse dello stesso luogo.
---

# Luoghi

I luoghi si scrivono come testo ovunque li inserisci: nascita, morte, eventi, matrimoni, foto.
**☰ → Luoghi…** (o **Modifica → Luoghi…**) li raccoglie in un unico elenco, così puoi assegnare a
ogni luogo una **posizione** per la [mappa](./map) e mettere ordine nelle grafie.

<Screenshot name="places-manager" alt="La finestra Luoghi: a sinistra un elenco di luoghi con quante volte sono usati, a destra Łódź selezionata con le sue coordinate, i campi latitudine e longitudine, Salva posizione, Cerca online (1) e Unisci a un altro luogo" />

L'elenco mostra ogni luogo con quante volte è usato e se ha una posizione. I luoghi che differiscono
solo per maiuscole, spazi o accenti (_Forlì_, _Forli_, _ forlì _) contano come un unico luogo;
viene mostrata la grafia più comune e le altre sono elencate come **Scritto anche come**.

## Cercare una posizione online {#lookup}

Fai clic su **Cerca online** (1). La prima volta Family Insight ti chiede se può farlo:

<Screenshot name="places-consent" alt="La domanda Cercare i luoghi online? che spiega che a OpenStreetMap Nominatim viene inviato solo il nome del luogo, con Consenti e Annulla" />

- Viene inviato solo il **nome del luogo** – nessun nome di persona, nessuna data, nient'altro – a
  [OpenStreetMap Nominatim](https://nominatim.org), un servizio gratuito.
- Scegli tra i risultati quello giusto; le sue coordinate vengono salvate con l'albero.
- Le risposte vengono ricordate sul tuo computer, così lo stesso luogo non viene chiesto due volte.
- Puoi disattivare di nuovo la funzione nelle impostazioni (**⚙ → Cerca i luoghi online**). Senza
  di essa, o senza connessione a Internet, tutto il resto funziona come prima.

## Inserire le coordinate a mano

Scrivi la **latitudine** e la **longitudine** (ad esempio _50,0619_ e _19,9369_ per Cracovia; come
separatore decimale vanno bene sia la virgola sia il punto) e fai clic su **Salva posizione**. Puoi
copiarle da qualsiasi sito di mappe. **Rimuovi posizione** le cancella di nuovo.

## Unire le grafie

Lo stesso paese viene spesso scritto in più modi: _Cracovia_, _Krakau_, _Kraków_. Selezionane uno,
scegli il luogo in cui **unirlo** (**Unisci in**) e fai clic su **Unisci**: ogni nascita, morte,
evento, matrimonio e foto riceve la grafia scelta e il luogo mantiene un'unica posizione. Come ogni
modifica, l'unione si può annullare con <kbd>Ctrl</kbd>+<kbd>Z</kbd>.

::: info
Le posizioni vengono salvate nel file `.finsight`. I luoghi in sé non cambiano: un luogo senza
posizione semplicemente non compare sulla mappa.
:::
