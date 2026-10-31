---
description: Soluzioni ai problemi più comuni – il programma non si avvia, lettere accentate in Excel, errori nell'importazione CSV, file che non si aprono – e come segnalare un errore.
---

# Risoluzione dei problemi

## Il programma non si avvia

### Windows

| Sintomo                                       | Causa e soluzione                                                                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Una finestra blu **“PC protetto da Windows”** | SmartScreen non conosce ancora l'editore. Fai clic su **Ulteriori informazioni → Esegui comunque** (vedi [Installazione](./install#windows)).            |
| L'antivirus blocca o elimina il file          | Scarica di nuovo il file dalla [pagina ufficiale delle versioni](https://github.com/K-u-r-c/family-insight/releases/latest) e consentilo nell'antivirus. |

### macOS

| Sintomo                                                                   | Causa e soluzione                                                                                                                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Impossibile aprire “Family Insight” perché Apple non può verificarlo…** | L'app non è ancora autenticata da Apple. Fai clic destro su di essa in Applicazioni → **Apri**, oppure **Impostazioni di Sistema → Privacy e sicurezza → Apri comunque**. |
| **“Family Insight” è danneggiata e non può essere aperta**                | La quarantena di macOS. Esegui una volta `xattr -cr "/Applications/Family Insight.app"` nel Terminale.                                                                    |
| L'app non si avvia su un Mac con Apple Silicon                            | Potresti avere la versione per Intel: scarica `mac-arm64.dmg` (vedi [Quale file devo scaricare?](./install#which-file)).                                                  |

### Linux {#linux}

| Sintomo                                                                      | Causa e soluzione                                                                                                                                                      |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Non succede nulla quando fai doppio clic sull'AppImage                       | Il file non è eseguibile: `chmod +x family-insight-*.AppImage`.                                                                                                        |
| `dlopen(): error loading libfuse.so.2` / _AppImages require FUSE to run_     | Manca FUSE 2: `sudo apt install libfuse2` (Ubuntu 24.04 e successive: `libfuse2t64`), oppure il pacchetto `fuse2` / `fuse-libs` in altre distribuzioni.                |
| _The SUID sandbox helper binary was found, but is not configured correctly…_ | Alcune distribuzioni (ad esempio Ubuntu 24.04) limitano la sandbox usata da Electron. Installa invece il pacchetto `.deb`, oppure avvia l'AppImage con `--no-sandbox`. |
| La finestra è sfocata o sfarfalla su Wayland                                 | Avvialo con `--ozone-platform=x11` per usare XWayland.                                                                                                                 |

Per capire che cosa succede, avvia il programma da un terminale: lì viene stampato qualsiasi
messaggio di errore.

## Le lettere accentate appaiono sbagliate in Excel, o tutto è in una colonna

Esporta di nuovo il CSV e scegli il separatore **punto e virgola**: è quello che si aspetta Excel
con le impostazioni internazionali italiane. Il file contiene sempre un indicatore UTF-8, quindi
lettere come à, è e ù sono corrette. Vedi [Esportare in CSV](./csv-export).

## L'importazione CSV mostra dei problemi

Ogni problema ti indica la riga e che cosa cambiare. L'elenco completo con le soluzioni si trova in
[Importare da CSV → Problemi e avvisi](./csv-import#problems).

## Un file non si apre

| Messaggio                                                                                  | Che cosa fare                                                                                  |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| _Il file non esiste più. Potrebbe essere stato spostato o eliminato._                      | Trova il file e aprilo con **Apri…**; rimuovi la vecchia voce dall'elenco dei recenti.         |
| _Non hai i permessi per accedere a questo file._                                           | Copia il file in una tua cartella (ad esempio Documenti) e apri la copia.                      |
| _Questo albero è stato salvato con una versione più recente di Family Insight…_            | [Aggiorna Family Insight](./install#updating).                                                 |
| _Il file è danneggiato oppure non è un albero Family Insight._                             | Apri una delle [copie di backup](./files#backups) (`.bak1` … `.bak5`) accanto al file.         |
| _Questo non è un file di albero Family Insight._ / _Questo tipo di file non è supportato._ | Scegli un file `.finsight`; i fogli di calcolo si aprono con [Importare da CSV](./csv-import). |
| _Il file contiene dati non validi e non può essere aperto in modo sicuro._                 | Prova una copia di backup; se non basta, [segnala il problema](#report-a-problem).             |

Se il programma si è chiuso inaspettatamente, avvialo di nuovo: ti proporrà di
[ripristinare il lavoro non salvato](./files#crash-recovery).

## Segnalare un problema {#report-a-problem}

Scegli **Aiuto → Segnala un problema…**: si apre la pagina delle segnalazioni su GitHub (serve un
account GitHub gratuito). Indica:

- che cosa hai fatto, che cosa ti aspettavi e che cosa è successo invece;
- la versione (**Aiuto → Informazioni su Family Insight**) e il tuo sistema (ad esempio Windows 11,
  macOS 15, Ubuntu 24.04);
- uno screenshot del messaggio e l'output del terminale, se hai avviato il programma da lì.

Non allegare pubblicamente il tuo albero genealogico: contiene dati personali. Se serve un file,
scrivilo nella segnalazione e ci accorderemo su un modo privato per inviarlo.
