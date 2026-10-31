---
description: Registra gli eventi della vita – battesimo, scuole, lavori, traslochi, servizio militare, sepoltura ed eventi personalizzati – con date, periodi e luoghi.
---

# Eventi

Oltre alla nascita e alla morte, una vita è piena di altri momenti che vale la pena registrare: un
battesimo, la scuola e l'università, i lavori, il trasferimento in un'altra città o in un altro
paese, il servizio militare, una sepoltura. Family Insight li chiama **eventi**.

## Aggiungere un evento

1. Seleziona la persona e fai clic su **Modifica**.
2. Scorri fino a **Eventi** e fai clic su **Aggiungi evento**.
3. Scegli il tipo di evento. Gli eventi sono raggruppati in religiosi; lavoro, scuola e servizio;
   traslochi e residenza; e altri:

<Screenshot name="events-menu" alt="Il menu Aggiungi evento con i tipi di evento raggruppati in Religiosi, Lavoro, scuola e servizio, Traslochi e residenza e Altro" />

Il nuovo evento si apre subito, con il cursore nel campo della data.

## Compilare i dettagli

<Screenshot name="events-editor" alt="Gli eventi nella modifica: Battesimo e Servizio militare; il servizio militare è aperto con tipo, data di inizio, data di fine (3) e luogo; i pulsanti per modificare (1) e spostare su (2)" />

- **Tipo** – puoi cambiare il tipo di evento in qualsiasi momento. Per **Altro evento** scrivi un
  nome tuo (ad esempio _Pellegrinaggio_).
- **Data (o inizio)** e **Data di fine (facoltativa)** – una sola data, oppure un periodo come il
  servizio militare dal 1914 al 1918. Le date funzionano come ovunque: `1914`, `05/1914`, `~1914`
  ([di più sulle date](./editing#dates)).
- **Luogo** – i suggerimenti vengono dai luoghi già usati nell'albero.
- **Descrizione** – un breve dettaglio: la professione, la scuola, il reggimento, la nave.
- **Note** – tutto il resto.

Ogni campo viene salvato quando lo lasci. Fai clic sul titolo di un evento o sulla matita (1) per
aprirlo o chiuderlo.

## Ordinare ed eliminare

- Le frecce (2) spostano un evento su o giù. L'ordine che scegli viene mantenuto; nella cronologia
  della persona gli eventi sono comunque ordinati per data.
- Il cestino rimuove un evento. Compare un messaggio con **Annulla** e, come ogni modifica, puoi
  annullarla anche con <kbd>Ctrl</kbd>+<kbd>Z</kbd>.

## Dove compaiono gli eventi

- **Dettagli e cronologia** – l'elenco **Vita** della persona mostra gli eventi con la loro icona,
  la data o il periodo e il luogo, tra la nascita e la morte. Sepoltura e cremazione vengono dopo la
  morte.

  <Screenshot name="events-details" alt="La cronologia della vita di Jan Kowalski: nascita, battesimo, servizio militare 1944–1945, istruzione 1946–1951 e professione 1951–1990" />

- **Ricerca** – i luoghi e le descrizioni degli eventi si possono cercare: cerca _Amburgo_ per
  trovare tutti quelli che sono emigrati passando per Amburgo.
- **Statistiche** – gli eventi e i luoghi degli eventi più comuni, e quante persone non hanno
  ancora eventi ([Statistiche](./statistics)).

## Avvisi

Come le altre date, anche gli eventi ricevono avvisi discreti quando qualcosa sembra sbagliato, ma
non ti bloccano mai:

- _Un evento di … è datato prima della nascita._
- _Un evento di … è datato dopo la morte._ (Sepoltura e cremazione vanno bene.)
- _Questo evento finisce prima di iniziare._

::: info CSV e versioni precedenti
Gli eventi vengono salvati nel file `.finsight`. Le esportazioni CSV contengono una riga per
persona e non includono gli eventi. Dalla versione 1.1 gli alberi vengono salvati in un formato di
file più recente, che ha spazio per gli eventi: Family Insight 1.0 non riesce ad aprirli e chiede
di aggiornare.
:::
