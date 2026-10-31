---
description: 'Enregistrer et ouvrir des arbres, enregistrement automatique, récupération après un plantage, copies de sauvegarde, fichiers récents et transfert d’un arbre vers un autre ordinateur.'
---

# Enregistrer et ouvrir

## Le fichier `.finsight`

Chaque arbre généalogique est un seul fichier portant l’extension **`.finsight`** – tout est
dedans : personnes, relations, sources, photos et la façon dont l’arbre était affiché. Vous décidez
où il se trouve, et vous pouvez le copier, le sauvegarder ou l’envoyer par e-mail comme n’importe
quel autre document.

::: info Anciennes versions
Depuis la version 1.1, un fichier `.finsight` est une archive compressée (comme un fichier zip) pour
que les photos et les documents numérisés y tiennent efficacement : chaque image n’est enregistrée
qu’une fois, quel que soit le nombre de fois où elle est utilisée. Family Insight 1.1 ouvre les
arbres de la version 1.0 et les enregistre sous la nouvelle forme ; **la version 1.0 ne peut pas
ouvrir les arbres enregistrés par la 1.1** – mettez le logiciel à jour sur chaque ordinateur que
vous utilisez (voir [Installation](./install#updating)).

:::

## Enregistrer

| Pour                          | Faites                                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| enregistrer                   | <kbd>Ctrl</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>S</kbd>), ou **☰ → Enregistrer**                                     |
| enregistrer sous un autre nom | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>S</kbd>), ou **☰ → Enregistrer sous…** |

<Screenshot name="file-menu" alt="Le menu Fichier avec Nouvel arbre, Ouvrir, Enregistrer, Enregistrer sous, Importer un CSV, Importer un GEDCOM, Exporter en CSV, Exporter en GEDCOM, Exporter une image, Sources, Lieux et Imprimer" />

La première fois que vous enregistrez un nouvel arbre, choisissez un dossier et un nom (le dossier
Documents et le nom de l’arbre sont proposés). La barre d’état en bas indique toujours si tout est
enregistré :

<Screenshot name="unsaved-status" alt="La barre d’état affichant Modifications non enregistrées (1)" />

Si vous fermez la fenêtre, ouvrez un autre arbre ou quittez le logiciel alors qu’il reste des
modifications non enregistrées, Family Insight vous demande s’il faut **Enregistrer**,
**Ne pas enregistrer** ou **Annuler**.

## Enregistrement automatique {#autosave}

Dès qu’un arbre a été enregistré dans un fichier, Family Insight l’enregistre automatiquement
**2 secondes après chaque modification**. Vous pouvez désactiver cette fonction dans les
[paramètres](./settings) (⚙ → **Enregistrer automatiquement**) ; enregistrez alors vous-même avec
<kbd>Ctrl</kbd>+<kbd>S</kbd>.

Un tout nouvel arbre qui n’a jamais été enregistré n’est pas enregistré automatiquement –
enregistrez-le une première fois pour lui donner un fichier.

## Récupération après un plantage {#crash-recovery}

Tant qu’un arbre a des modifications non enregistrées (par exemple un nouvel arbre, ou si
l’enregistrement automatique est désactivé), Family Insight conserve une copie de récupération
cachée, mise à jour 2 secondes après chaque modification. Si le logiciel ou l’ordinateur plante, le
lancement suivant propose de restaurer ce travail :

<Screenshot name="recovery" alt="La fenêtre Restaurer le travail non enregistré ? qui liste l’arbre Kowalscy, jamais enregistré, avec les boutons Restaurer et Tout abandonner" />

Cliquez sur **Restaurer** pour ouvrir l’arbre tel qu’il était, puis enregistrez-le.
**Tout abandonner** supprime les copies. Les copies de récupération sont supprimées dès que l’arbre
est enregistré ou fermé normalement.

## Copies de sauvegarde {#backups}

Chaque fois que vous enregistrez **manuellement** (<kbd>Ctrl</kbd>+<kbd>S</kbd> ou
**Enregistrer**), la version précédente du fichier est conservée à côté sous le nom
`nom.finsight.bak1`. Les versions plus anciennes passent à `.bak2` … `.bak5` : les cinq derniers
enregistrements manuels sont donc toujours là. L’enregistrement automatique ne crée pas de copies
de sauvegarde.

Pour revenir à une version plus ancienne :

1. Fermez l’arbre dans Family Insight.
2. Dans votre gestionnaire de fichiers, trouvez le dossier de l’arbre et faites une copie de la
   sauvegarde voulue, par exemple `Kowalscy.finsight.bak2`.
3. Renommez la copie pour qu’elle se termine par `.finsight`, par exemple
   `Kowalscy (ancienne).finsight` (votre système peut vous demander si vous voulez vraiment changer
   l’extension – confirmez).
4. Ouvrez-la dans Family Insight.

::: tip Vous ne voyez pas les extensions ?
Windows et macOS masquent les extensions de fichiers par défaut. Sous Windows, dans l’Explorateur de
fichiers, choisissez **Affichage → Afficher → Extensions de noms de fichiers** ; sous macOS, dans le
Finder, choisissez **Finder → Réglages → Avancés → Afficher toutes les extensions de fichiers**.

:::

## Ouvrir un arbre {#opening}

- **☰ → Ouvrir…** ou <kbd>Ctrl</kbd>+<kbd>O</kbd> (<kbd>⌘</kbd>+<kbd>O</kbd>), ou
  **Ouvrir un arbre…** sur l’écran d’accueil ;
- **double-cliquez** sur un fichier `.finsight` (après une installation avec le programme
  d’installation Windows, l’application macOS ou le paquet `.deb`) ;
- **faites glisser** un fichier `.finsight` sur la fenêtre de Family Insight – faire glisser un
  fichier `.csv` lance une [importation CSV](./csv-import) ;
- **Fichier → Ouvrir un fichier récent** dans la barre de menus, ou la liste **Récents** de l’écran
  d’accueil.

<Screenshot name="welcome-recent" alt="L’écran d’accueil avec la liste Récents : un arbre ouvert il y a 2 heures et un autre barré avec la mention Fichier introuvable" />

Les fichiers déplacés ou supprimés sont barrés dans la liste des fichiers récents ; retirez-les avec
**×**.

Si un fichier ne peut pas être ouvert, Family Insight vous explique pourquoi – par exemple qu’il a
été enregistré par une version plus récente (mettez le logiciel à jour, voir
[Installation](./install#updating)) ou qu’il est endommagé (essayez une
[copie de sauvegarde](#backups)).

## Transférer un arbre vers un autre ordinateur

Copiez le fichier `.finsight` – sur une clé USB, par e-mail ou via un dossier dans le cloud – et
ouvrez-le avec Family Insight sur l’autre ordinateur. Les photos sont dans le fichier : rien d’autre
n’est nécessaire.

::: warning Travailler sur le même arbre à deux endroits
Family Insight ne fusionne pas les modifications. Si vous gardez l’arbre dans un dossier partagé ou
synchronisé, ne l’ouvrez que sur un seul ordinateur à la fois.

:::
