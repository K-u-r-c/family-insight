---
description: 'Solutions aux problèmes courants – le logiciel ne démarre pas, accents illisibles dans Excel, erreurs d’importation CSV, fichiers qui ne s’ouvrent pas – et comment signaler un bogue.'
---

# Résolution des problèmes

## Le logiciel ne démarre pas

### Windows

| Symptôme                                                     | Cause et solution                                                                                                                                                       |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Une fenêtre bleue **« Windows a protégé votre ordinateur »** | SmartScreen ne connaît pas encore l’éditeur. Cliquez sur **Informations complémentaires → Exécuter quand même** (voir [Installation](./install#windows)).               |
| L’antivirus bloque ou supprime le fichier                    | Téléchargez de nouveau le fichier depuis la [page officielle des versions](https://github.com/K-u-r-c/family-insight/releases/latest) et autorisez-le dans l’antivirus. |

### macOS

| Symptôme                                                                   | Cause et solution                                                                                                                                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Impossible d’ouvrir « Family Insight » car Apple ne peut pas vérifier…** | L’application n’est pas encore notariée. Faites un clic droit dessus dans Applications → **Ouvrir**, ou **Réglages Système → Confidentialité et sécurité → Ouvrir quand même**. |
| **« Family Insight » est endommagé et ne peut pas être ouvert**            | Quarantaine de macOS. Exécutez une fois `xattr -cr "/Applications/Family Insight.app"` dans le Terminal.                                                                        |
| L’application ne démarre pas sur un Mac Apple Silicon                      | Vous avez peut-être la version Intel – téléchargez `mac-arm64.dmg` (voir [Quel fichier télécharger ?](./install#which-file)).                                                   |

### Linux {#linux}

| Symptôme                                                                     | Cause et solution                                                                                                                                                                |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rien ne se passe quand vous double-cliquez sur l’AppImage                    | Le fichier n’est pas exécutable : `chmod +x family-insight-*.AppImage`.                                                                                                          |
| `dlopen(): error loading libfuse.so.2` / _AppImages require FUSE to run_     | FUSE 2 manque : `sudo apt install libfuse2` (Ubuntu 24.04 et versions ultérieures : `libfuse2t64`), ou le paquet `fuse2` / `fuse-libs` sur les autres distributions.             |
| _The SUID sandbox helper binary was found, but is not configured correctly…_ | Certaines distributions (par exemple Ubuntu 24.04) restreignent le bac à sable qu’utilise Electron. Installez plutôt le paquet `.deb`, ou lancez l’AppImage avec `--no-sandbox`. |
| La fenêtre est floue ou scintille sous Wayland                               | Lancez le logiciel avec `--ozone-platform=x11` pour utiliser XWayland.                                                                                                           |

Pour voir ce qui se passe, lancez le logiciel depuis un terminal – les éventuels messages d’erreur
s’y affichent.

## Les accents s’affichent mal dans Excel, ou tout est dans une seule colonne

Exportez de nouveau le CSV en choisissant le séparateur **point-virgule** – c’est ce qu’attend
Excel avec des paramètres régionaux français. Le fichier contient toujours une marque UTF-8 : les
lettres comme é, è, ç et œ sont donc correctes. Voir [Exporter en CSV](./csv-export).

## L’importation CSV signale des problèmes

Chaque problème indique la ligne et ce qu’il faut changer. La liste complète avec les solutions se
trouve dans [Importer depuis un CSV → Problèmes et avertissements](./csv-import#problems).

## Un fichier ne s’ouvre pas

| Message                                                                                          | Que faire                                                                                                        |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| _Le fichier n’existe plus. Il a peut-être été déplacé ou supprimé._                              | Retrouvez le fichier et ouvrez-le avec **Ouvrir…** ; retirez l’ancienne entrée de la liste des fichiers récents. |
| _Vous n’avez pas l’autorisation d’accéder à ce fichier._                                         | Copiez le fichier dans l’un de vos dossiers (par exemple Documents) et ouvrez la copie.                          |
| _Cet arbre a été enregistré par une version plus récente de Family Insight…_                     | [Mettez Family Insight à jour](./install#updating).                                                              |
| _Le fichier est endommagé ou n’est pas un arbre Family Insight._                                 | Ouvrez l’une des [copies de sauvegarde](./files#backups) (`.bak1` … `.bak5`) situées à côté du fichier.          |
| _Ce fichier n’est pas un arbre Family Insight._ / _Ce type de fichier n’est pas pris en charge._ | Choisissez un fichier `.finsight` ; les tableurs s’ouvrent avec [Importer depuis un CSV](./csv-import).          |
| _Le fichier contient des données non valides et ne peut pas être ouvert en toute sécurité._      | Essayez une copie de sauvegarde ; si cela ne suffit pas, [signalez le problème](#report-a-problem).              |

Si le logiciel s’est fermé de façon inattendue, relancez-le – il propose de
[restaurer le travail non enregistré](./files#crash-recovery).

## Signaler un problème {#report-a-problem}

Choisissez **Aide → Signaler un problème…** – cela ouvre la page des tickets sur GitHub (il faut un
compte GitHub gratuit). Merci d’indiquer :

- ce que vous avez fait, ce que vous attendiez et ce qui s’est passé à la place ;
- la version (**Aide → À propos de Family Insight**) et votre système (par exemple Windows 11,
  macOS 15, Ubuntu 24.04) ;
- une capture d’écran du message, et la sortie du terminal si vous avez lancé le logiciel depuis
  un terminal.

Ne joignez pas publiquement votre arbre généalogique – il contient des données personnelles. Si un
fichier est nécessaire, indiquez-le dans le signalement et nous conviendrons d’un moyen privé de le
transmettre.
