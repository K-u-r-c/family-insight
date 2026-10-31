---
description: Importa un albero genealogico da Excel, LibreOffice o Fogli Google – prepara il foglio, controlla l'anteprima e correggi gli errori più comuni.
---

# Importare da CSV

La tua famiglia è già in un foglio di calcolo? Family Insight può leggerla da un file **CSV**, il
formato che ogni programma per fogli di calcolo sa salvare.

## 1. Preparare il foglio di calcolo

Usa **una riga per persona** e queste colonne (in qualsiasi ordine, con i nomi in italiano o in
inglese):

| Colonna                              | Nome inglese                 | Che cosa scrivere                                                          |
| ------------------------------------ | ---------------------------- | -------------------------------------------------------------------------- |
| `id` **(obbligatoria)**              | `id`                         | un'etichetta breve e univoca per la persona, ad esempio `p1`, `p2` …       |
| `nomi`                               | `given_names`                | i nomi                                                                     |
| `cognome`                            | `surname`                    | il cognome                                                                 |
| `cognome_di_nascita`                 | `birth_surname`              | il cognome di nascita (da nubile)                                          |
| `sesso`                              | `sex`                        | `donna` / `uomo` (oppure `F`, `M`, `femmina`, `maschio`, `female`, `male`) |
| `data_di_nascita`, `data_di_morte`   | `birth_date`, `death_date`   | `1890`, `05/1890`, `12/05/1890`, `~1890` … ([date](./editing#dates))       |
| `luogo_di_nascita`, `luogo_di_morte` | `birth_place`, `death_place` | la città o il paese                                                        |
| `vivente`                            | `living`                     | `sì` / `no` (oppure `yes` / `no`)                                          |
| `padre_id`, `madre_id`               | `father_id`, `mother_id`     | l'**id** del padre e della madre                                           |
| `partner_id`                         | `partner_ids`                | gli **id** dei partner, separati da `\|`, ad esempio `p2\|p5`              |
| `note`                               | `notes`                      | tutto il resto                                                             |

Funzionano anche i nomi delle colonne e i valori in **polacco, tedesco, francese, spagnolo,
portoghese e russo** (ad esempio `imiona`, `vornamen`, `nom`, `fecha_de_nacimiento`, `фамилия`;
`mężczyzna`, `männlich`, `oui`, `да`): tutti i nomi sono elencati nella
[descrizione del formato CSV](/developer/reference/csv-format#columns). Per patronimici e doppi
cognomi, vedi [nomi di altri paesi](./editing#name-conventions).

Ogni persona ha bisogno di un **id** e almeno di un nome o di un cognome; tutte le altre colonne sono
facoltative. I parenti vengono collegati tramite gli id: ad esempio `p3` con `padre_id` `p1` e
`madre_id` `p2` è figlio di `p1` e `p2`. Un'unione basta indicarla da una sola parte.

::: tip Parti da un esempio
Scarica un esempio con 25 persone – [con i nomi delle colonne in inglese](/samples/example-en.csv) o
[in polacco](/samples/example-pl.csv) – oppure un modello vuoto con i nomi in italiano da Family
Insight: **Aiuto → Scarica modello CSV…**. La specifica completa si trova nella
[descrizione del formato CSV](/developer/reference/csv-format).
:::

## 2. Salvarlo come CSV

| Programma        | Come                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Microsoft Excel  | **File → Salva con nome**, tipo **CSV UTF-8 (delimitato da virgole) (\*.csv)**             |
| LibreOffice Calc | **File → Salva con nome**, tipo **Testo CSV (.csv)**, set di caratteri **Unicode (UTF-8)** |
| Fogli Google     | **File → Scarica → Valori separati da virgola (.csv)**                                     |

Come separatori funzionano virgole, punti e virgola e tabulazioni (l'Excel italiano usa il punto e
virgola). Funzionano anche i file non salvati in UTF-8 (il semplice tipo **CSV** delle versioni
meno recenti di Excel): Family Insight riconosce dalle lettere il testo dell'Europa occidentale
(Windows-1252), dell'Europa centrale (Windows-1250) e in cirillico (Windows-1251).

## 3. Importare

Nella schermata di benvenuto fai clic su **Importa da CSV…** oppure, con un albero aperto, scegli
**☰ → Importa CSV…**. Puoi anche trascinare il file `.csv` sulla finestra. Prima che cambi qualcosa,
vedi un'anteprima:

<Screenshot name="csv-import" alt="L'anteprima dell'importazione: separatore e codifica rilevati, le colonne con il modo in cui ciascuna viene importata, un'anteprima delle prime righe e il pulsante Importa" />

- In alto: il **separatore e la codifica del testo** rilevati.
- **Set di caratteri** – se nell'anteprima lettere come à, è, ö o ж appaiono errate, scegline un
  altro qui (compare per i file letti dal disco; quello rilevato è indicato).
- **Colonne** – come verrà usata ogni colonna del tuo file. Se una colonna non è stata riconosciuta
  (ad esempio perché si chiama “Primo nome”), scegli il significato giusto nell'elenco, oppure
  **Non importare** per saltarla.
- **Anteprima** – le prime righe così come le ha capite Family Insight.
- In basso: quante persone e relazioni verranno importate.

<Screenshot name="csv-import-columns" alt="La tabella Colonne: colonna nel file, importata come (un elenco) e il valore nella prima riga" />

Quando un albero è già aperto, scegli se importare in **Un nuovo albero** o in
**L'albero corrente**. L'importazione nell'albero corrente aggiunge tutte le persone del file come
persone nuove (non vengono abbinate a quelle già presenti nell'albero), in un unico passaggio che puoi
[annullare](./undo).

Fai clic su **Importa**. Un nuovo albero creato da un file CSV non ha ancora un file:
[salvalo](./files) per conservarlo.

## Problemi e avvisi {#problems}

I **problemi** (in rosso) vanno corretti prima dell'importazione: correggili nel foglio di calcolo
(o cambia l'associazione delle colonne) e importa di nuovo. Gli **avvisi** (in giallo) spiegano che
cosa succederà; puoi importare comunque. Ogni messaggio indica a quale riga si riferisce.

<Screenshot name="csv-import-errors" alt="L'anteprima dell'importazione con 2 problemi: Riga 4 – l'id p2 è usato più di una volta; Riga 5 – fa riferimento a p9, ma non esiste nessuna riga con quell'id" />

### Problemi che bloccano l'importazione

| Messaggio                                                         | Come correggerlo                                                                          |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| _Il file è vuoto._                                                | Scegli il file giusto, o controlla che il foglio sia stato salvato con i dati.            |
| _Il file non ha una colonna “id”…_                                | Aggiungi una colonna `id` con un'etichetta univoca per ogni persona.                      |
| _Il file non ha colonne per il nome (“given_names” o “surname”)._ | Aggiungi una colonna `nomi` o `cognome`, o associa a essa una colonna esistente.          |
| _Questa riga non ha un id._                                       | Inserisci l'id in quella riga.                                                            |
| _L'id “p2” è usato più di una volta._                             | Dai a ogni persona un id diverso.                                                         |
| _La persona “p7” non ha né nomi né cognome._                      | Inserisci almeno un nome (o elimina la riga vuota).                                       |
| _Fa riferimento a “p9”, ma non esiste nessuna riga con quell'id._ | Correggi l'id in `padre_id`, `madre_id` o `partner_id`, oppure aggiungi quella persona.   |
| _La persona fa riferimento a sé stessa (“p3”)._                   | Una persona non può essere genitore o partner di sé stessa: correggi l'id.                |
| _Padre e madre sono la stessa persona (“p1”)._                    | Correggi `padre_id` o `madre_id`.                                                         |
| _… sarebbe tra i propri antenati._                                | Da qualche parte un figlio è indicato come genitore di un suo antenato: controlla gli id. |

### Avvisi

| Messaggio                                                                                       | Che cosa succede                                                             |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| _La colonna “…” non è riconosciuta e verrà ignorata._                                           | La colonna viene saltata: associala a un campo se ti serve.                  |
| _“…” non è una data comprensibile; è stata aggiunta alle note._                                 | Il testo viene conservato nelle note della persona, così non si perde nulla. |
| _“…” non è un sesso riconosciuto; importato come sconosciuto._                                  | Usa `donna`, `uomo`, `altro` o `sconosciuto` (o le parole inglesi).          |
| _“…” non è sì/no; lo stato in vita resta sconosciuto._                                          | Usa `sì`/`no`, `yes`/`no`, `true`/`false` o `1`/`0`.                         |
| Avvisi sulle date (morte prima della nascita, più di 120 anni, genitore più giovane del figlio) | Importate così come sono scritte: vedi [Avvisi](./editing#warnings).         |

## Che cosa non può contenere un CSV

Un CSV conserva nomi, date, luoghi, stato in vita, genitori biologici, partner e note. **Foto, date
e luoghi delle unioni, legami adottivi, acquisiti e di affido, la persona principale e la vista**
esistono solo nei file `.finsight`: usa questi per conservare tutto.
