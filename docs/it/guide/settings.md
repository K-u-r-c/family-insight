---
description: Cambia la lingua, il tema, la dimensione delle schede e il salvataggio automatico di Family Insight, e scopri dove si trovano le impostazioni e come ripristinarle.
---

# Impostazioni

Fai clic sul pulsante **Impostazioni** (⚙) a destra nella barra degli strumenti:

<Screenshot name="settings-menu" alt="Il menu delle impostazioni con Tema (Sistema, Chiaro, Scuro), Lingua (English, Polski, Deutsch, Français, Español, Italiano, Português, Русский), Schede (Spaziose, Compatte) e Salva automaticamente" />

| Impostazione                                   | Scelte                                                                    | Che cosa fa                                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Tema**                                       | Sistema, Chiaro, Scuro                                                    | I colori del programma. **Sistema** segue la modalità chiara o scura del tuo computer.                                             |
| **Lingua**                                     | English, Polski, Deutsch, Français, Español, Italiano, Português, Русский | La lingua di tutto il programma, compresi la barra dei menu e le finestre di dialogo. Cambia immediatamente.                       |
| **Schede**                                     | Spaziose, Compatte                                                        | La dimensione delle schede nell'albero. Le schede compatte fanno stare più persone sullo schermo e sulla carta.                    |
| **Salva automaticamente**                      | attivo (predefinito) / disattivato                                        | [Salvataggio automatico](./files#autosave) degli alberi che hanno già un file.                                                     |
| **Verifica automaticamente gli aggiornamenti** | attivo (predefinito) / disattivato                                        | Un controllo giornaliero delle nuove versioni ([Aggiornamenti](./updates)); **Verifica ora…** controlla subito.                    |
| **Carica le mappe online**                     | disattivato (predefinito) / attivo                                        | Scarica lo sfondo della mappa da OpenStreetMap mentre usi la [mappa](./map#online).                                                |
| **Cerca i luoghi online**                      | disattivato (predefinito) / attivo                                        | Permette a **Cerca online** di inviare il nome di un luogo a OpenStreetMap per trovarne le coordinate ([Luoghi](./places#lookup)). |

Il tema e la lingua si possono cambiare anche nella schermata di benvenuto (angolo in alto a destra)
e nel menu **Visualizza** della barra dei menu. Il menu **Visualizza** mostra o nasconde anche
l'elenco delle persone e la mappa d'insieme.

Family Insight ricorda per te anche altre cose: la dimensione e la posizione della finestra, la
larghezza dei pannelli, l'ultimo separatore CSV usato e i [file recenti](./files#opening).

::: tip Il separatore CSV segue la lingua
Quando cambi la lingua nel menu **Visualizza**, cambia con essa anche il separatore CSV
predefinito: un punto e virgola per l'italiano, una virgola per l'inglese. Puoi sempre sceglierne un
altro quando [esporti](./csv-export).
:::

## Dove sono salvate le impostazioni

Le impostazioni vengono salvate in un piccolo file, `settings.json`, nel tuo profilo utente,
separatamente dai tuoi alberi:

| Sistema | Cartella                                       |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |

## Ripristinare le impostazioni

Chiudi Family Insight ed elimina `settings.json` da quella cartella. All'avvio successivo verranno
usate le impostazioni predefinite (e la lingua del tuo sistema). I tuoi alberi non vengono toccati.
