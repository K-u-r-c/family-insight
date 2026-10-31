---
description: Registra genitori adottivi, acquisiti e affidatari, matrimoni e unioni con le date, divorzi, secondi matrimoni e fratellastri.
---

# Relazioni

Una famiglia non è fatta solo di padre, madre e figli. Family Insight registra **come** le persone
sono imparentate e disegna con chiarezza secondi matrimoni, fratellastri e adozioni.

## Genitori: biologici, adottivi, acquisiti o affidatari

Ogni legame con un genitore ha un tipo. Apri il menu **⋯** accanto a un genitore (nel pannello del
figlio) o accanto a un figlio (nel pannello del genitore) e scegli:

- **Biologico** – il valore predefinito. Una persona può avere al massimo due genitori biologici.
- **Adottivo**, **Acquisito** o **Affidatario** – quanti ne servono.

<Screenshot name="parent-kind" alt="Il menu delle opzioni accanto al genitore Jan Kowalski con i tipi Biologico, Adottivo, Acquisito e Affidatario e Rimuovi relazione" />

I legami con genitori non biologici sono disegnati nell'albero con una **linea tratteggiata** e il
tipo compare accanto al nome negli elenchi della famiglia (ad esempio “Adottivo”).

::: tip Ci sono già due genitori biologici?
In questo caso **+ Genitore** aggiunge il nuovo genitore come **genitore acquisito**. Se è davvero
il genitore biologico, cambia prima uno dei genitori esistenti in adottivo, acquisito o
affidatario.
:::

## Partner e matrimoni {#partners}

Una persona può avere un numero qualsiasi di partner. Per aggiungere i dettagli di una relazione,
apri il menu **⋯** accanto al partner e scegli **Modifica unione**:

<Screenshot name="partnership-dialog" alt="La finestra Modifica unione con tipo, data di inizio, luogo, data di fine e come è terminata" />

- **Tipo** – Sposati, Partner, Fidanzati o Insieme.
- **Data di inizio** e **Luogo** – ad esempio la data delle nozze e la chiesa o la città. Le date
  funzionano come ovunque: `1978`, `06/1978` o `~1978` ([di più sulle date](./editing#dates)).
- **Data di fine** e **Come è terminata** – Divorzio, Separazione, Morte di un partner o Altro.
  Lascia **Non terminata** per le relazioni che continuano.

L'elenco della famiglia mostra poi, ad esempio, “Sposati 12 giugno 1978, fino al 3 marzo 1990”.
Le unioni terminate sono disegnate nell'albero con una linea tratteggiata.

## Secondi matrimoni e fratellastri

Quando una persona ha avuto più partner, Family Insight la colloca al centro con i partner ai lati,
in ordine di inizio della relazione, e disegna i figli di ogni coppia sotto la coppia giusta:

<Screenshot name="remarriage" alt="Piotr Kowalski tra le sue due mogli, Magdalena Nowicka e Katarzyna Kowalska, con il figlio del primo matrimonio sotto la prima coppia e due figli del secondo sotto la seconda coppia" />

I fratelli che hanno in comune un solo genitore sono indicati come **fratellastro/sorellastra**
nell'elenco della famiglia. Quando aggiungi un figlio a una persona con più partner, Family Insight
ti chiede chi è l'altro genitore ([Aggiungere persone](./people)).

## Rimuovere una relazione

Apri il menu **⋯** accanto al parente e scegli **Rimuovi relazione**:

<Screenshot name="relation-options" alt="Il menu delle opzioni accanto alla partner Magdalena Nowicka con Modifica unione e Rimuovi relazione" />

Viene rimosso solo il collegamento: entrambe le persone restano nell'albero. Per qualche secondo
compare un messaggio con **Annulla**; puoi anche annullare più tardi con
<kbd>Ctrl</kbd>+<kbd>Z</kbd>.

## Relazioni impossibili

Family Insight blocca i collegamenti che non possono essere corretti e ti spiega perché, ad
esempio:

- _Una persona non può essere in relazione con sé stessa._
- _Queste persone sono già collegate in questo modo._
- _Così qualcuno diventerebbe antenato di sé stesso._
- _Una persona può avere al massimo due genitori biologici. Indica invece uno dei due come
  adottivo, acquisito o affidatario._

Quando succede, nell'albero non cambia nulla.
