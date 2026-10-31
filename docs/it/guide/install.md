---
description: Scaricare e installare Family Insight su Windows, macOS o Linux, aggiornarlo e disinstallarlo.
---

# Installazione

Family Insight è gratuito. Scaricalo dalla
[pagina delle versioni su GitHub](https://github.com/K-u-r-c/family-insight/releases/latest): sotto
**Assets** scegli il file per il tuo sistema.

## Quale file devo scaricare? {#which-file}

| Il tuo computer                               | File                                               |
| --------------------------------------------- | -------------------------------------------------- |
| Windows 10 o 11                               | `family-insight-<version>-setup.exe` (consigliato) |
| Windows, senza installazione                  | `family-insight-<version>-portable.exe`            |
| Mac con Apple Silicon (M1, M2, M3, M4 …)      | `family-insight-<version>-mac-arm64.dmg`           |
| Mac con processore Intel                      | `family-insight-<version>-mac-x64.dmg`             |
| Linux (qualsiasi distribuzione)               | `family-insight-<version>-linux-x86_64.AppImage`   |
| Ubuntu, Debian, Linux Mint e altre con `.deb` | `family-insight-<version>-linux-amd64.deb`         |

::: tip Che Mac ho?
Apri il menu Apple → **Informazioni su questo Mac**. Se c'è scritto **Chip: Apple M…**, scegli
`mac-arm64`. Se c'è scritto **Processore: … Intel**, scegli `mac-x64`.
:::

::: info Perché il sistema mi mostra un avviso?
Family Insight non è ancora firmato con un certificato da sviluppatore a pagamento, quindi Windows
e macOS non riconoscono l'editore e ti chiedono di confermare il primo avvio. I passaggi qui sotto
mostrano come fare. Il programma è open source: chiunque può verificare che cosa fa.
:::

## Windows

### Programma di installazione (consigliato)

1. Scarica `family-insight-<version>-setup.exe` e aprilo.
2. Se compare una finestra blu **PC protetto da Windows** (SmartScreen), fai clic su **Ulteriori informazioni**
   e poi su **Esegui comunque**.
3. Scegli la lingua dell'installazione (English, Polski, Deutsch, Français, Español, Italiano, Português o
   Русский) e segui i passaggi. Puoi cambiare la cartella di installazione. Non servono diritti
   di amministratore: il programma viene installato per il tuo account utente.
4. Avvia Family Insight dal **menu Start** o dal **collegamento sul desktop**.

Dopo l'installazione, facendo doppio clic su un file `.finsight` lo apri in Family Insight.

### Versione portatile

`family-insight-<version>-portable.exe` funziona senza installazione, ad esempio da una chiavetta
USB. Scaricalo e fai doppio clic (conferma SmartScreen come sopra). Le impostazioni vengono
comunque salvate nel tuo profilo utente (vedi [Disinstallare](#uninstalling)); la versione
portatile non registra il tipo di file `.finsight`.

## macOS

1. Scarica il file `.dmg` per il tuo Mac (vedi la tabella sopra) e aprilo.
2. Nella finestra che si apre, trascina **Family Insight** sulla cartella **Applicazioni**.
3. Apri **Applicazioni**, fai **clic destro** (o Ctrl-clic) su **Family Insight** e scegli
   **Apri**, poi di nuovo **Apri** nella finestra di dialogo. Serve solo la prima volta.

::: warning Se macOS non offre “Apri”
Nelle versioni recenti di macOS apri **Impostazioni di Sistema → Privacy e sicurezza**, scorri
fino al messaggio su Family Insight e fai clic su **Apri comunque**.

Se macOS dice che l'app **“è danneggiata e non può essere aperta”**, apri l'app **Terminale**,
esegui una volta questo comando e poi avvia di nuovo il programma:

```sh
xattr -cr "/Applications/Family Insight.app"
```

:::

## Linux

### AppImage (qualsiasi distribuzione)

L'AppImage è un unico file che funziona senza installazione.

1. Scarica `family-insight-<version>-linux-x86_64.AppImage`.
2. Rendilo eseguibile: nel gestore dei file apri **Proprietà → Permessi** e consenti di eseguirlo
   come programma, oppure in un terminale:

   ```sh
   chmod +x family-insight-*.AppImage
   ```

3. Fai doppio clic sul file oppure esegui `./family-insight-<version>-linux-x86_64.AppImage`.

Le AppImage richiedono **FUSE 2**. La maggior parte delle distribuzioni lo include; su Ubuntu
22.04 installalo con `sudo apt install libfuse2` (su Ubuntu 24.04 e successive:
`sudo apt install libfuse2t64`). Se il programma non si avvia, vedi
[Risoluzione dei problemi](./troubleshooting#linux).

::: tip Una voce di menu per l'AppImage
Un'AppImage non si aggiunge da sola al menu delle applicazioni. Strumenti come **Gear Lever** o
**AppImageLauncher** possono farlo per te, oppure usa il pacchetto `.deb` qui sotto.
:::

### Pacchetto Debian (Ubuntu, Debian, Linux Mint …)

```sh
sudo apt install ./family-insight-<version>-linux-amd64.deb
```

Il pacchetto aggiunge **Family Insight** al menu delle applicazioni (categoria Ufficio) e apre i
file `.finsight` con un doppio clic. Da un terminale lo avvii con `family-insight`.

## Aggiornare {#updating}

Family Insight non si aggiorna ancora da solo. Per avere una nuova versione, scaricala dalla
[pagina delle versioni](https://github.com/K-u-r-c/family-insight/releases/latest) e installala
nello stesso modo: sopra la vecchia (programma di installazione per Windows, `.deb`), sostituendo
l'app in Applicazioni (macOS) o il vecchio file AppImage. I tuoi alberi sono file separati e non
vengono toccati; le impostazioni restano.

## Disinstallare {#uninstalling}

| Sistema             | Come                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| Windows             | **Impostazioni → App → App installate → Family Insight → Disinstalla** |
| Windows (portatile) | Elimina il file `.exe`                                                 |
| macOS               | Trascina **Family Insight** da Applicazioni al Cestino                 |
| Linux (AppImage)    | Elimina il file `.AppImage`                                            |
| Linux (`.deb`)      | `sudo apt remove family-insight`                                       |

La disinstallazione non elimina mai i tuoi file `.finsight`. Le impostazioni, l'elenco dei file
recenti e le copie per il ripristino dopo un arresto anomalo restano in una cartella del tuo
profilo utente; eliminala se vuoi rimuovere tutto:

| Sistema | Cartella delle impostazioni                    |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |
