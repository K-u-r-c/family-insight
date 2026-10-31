---
description: 'Télécharger et installer Family Insight sous Windows, macOS ou Linux, le mettre à jour et le désinstaller.'
---

# Installation

Family Insight est gratuit. Téléchargez-le depuis la
[page des versions sur GitHub](https://github.com/K-u-r-c/family-insight/releases/latest) : sous
**Assets**, choisissez le fichier correspondant à votre système.

## Quel fichier télécharger ? {#which-file}

| Votre ordinateur                               | Fichier                                           |
| ---------------------------------------------- | ------------------------------------------------- |
| Windows 10 ou 11                               | `family-insight-<version>-setup.exe` (recommandé) |
| Windows, sans installation                     | `family-insight-<version>-portable.exe`           |
| Mac avec puce Apple Silicon (M1, M2, M3, M4 …) | `family-insight-<version>-mac-arm64.dmg`          |
| Mac avec processeur Intel                      | `family-insight-<version>-mac-x64.dmg`            |
| Linux (toute distribution)                     | `family-insight-<version>-linux-x86_64.AppImage`  |
| Ubuntu, Debian, Linux Mint et autres `.deb`    | `family-insight-<version>-linux-amd64.deb`        |

::: tip Quel Mac ai-je ?
Ouvrez le menu Pomme → **À propos de ce Mac**. S’il est écrit **Puce : Apple M…**, prenez
`mac-arm64`. S’il est écrit **Processeur : … Intel**, prenez `mac-x64`.

:::

::: info Pourquoi mon système affiche-t-il un avertissement ?
Family Insight n’est pas encore signé avec un certificat de développeur payant : Windows et macOS
ne reconnaissent donc pas l’éditeur et vous demandent de confirmer le premier lancement. Les étapes
ci-dessous expliquent comment faire. Le logiciel lui-même est open source – chacun peut vérifier ce
qu’il fait.

:::

## Windows

### Programme d’installation (recommandé)

1. Téléchargez `family-insight-<version>-setup.exe` et ouvrez-le.
2. Si une fenêtre bleue **Windows a protégé votre ordinateur** (SmartScreen) apparaît, cliquez sur
   **Informations complémentaires**, puis sur **Exécuter quand même**.
3. Choisissez la langue de l’installation (English, Polski, Deutsch, Français, Español, Italiano, Português ou
   Русский) et suivez les étapes. Vous pouvez changer le dossier d’installation. Aucun droit
   d’administrateur n’est nécessaire : le logiciel est installé pour votre compte utilisateur.
4. Lancez Family Insight depuis le **menu Démarrer** ou le **raccourci sur le bureau**.

Une fois l’installation faite, un double-clic sur un fichier `.finsight` l’ouvre dans
Family Insight.

### Version portable

`family-insight-<version>-portable.exe` fonctionne sans installation – par exemple depuis une clé
USB. Téléchargez-le et double-cliquez dessus (confirmez SmartScreen comme ci-dessus). Les paramètres
sont tout de même enregistrés dans votre profil utilisateur (voir
[Désinstallation](#uninstalling)) ; la version portable n’associe pas le type de fichier
`.finsight`.

## macOS

1. Téléchargez le fichier `.dmg` correspondant à votre Mac (voir le tableau ci-dessus) et
   ouvrez-le.
2. Dans la fenêtre qui s’ouvre, faites glisser **Family Insight** sur le dossier **Applications**.
3. Ouvrez **Applications**, faites un **clic droit** (ou Contrôle-clic) sur **Family Insight** et
   choisissez **Ouvrir**, puis à nouveau **Ouvrir** dans la boîte de dialogue. Cela n’est
   nécessaire que la première fois.

::: warning Si macOS ne propose pas « Ouvrir »
Sur les versions récentes de macOS, ouvrez **Réglages Système → Confidentialité et sécurité**,
faites défiler jusqu’au message concernant Family Insight et cliquez sur **Ouvrir quand même**.

Si macOS indique **« Family Insight » est endommagé et ne peut pas être ouvert**, ouvrez
l’application **Terminal** et exécutez une fois cette commande, puis relancez le logiciel :

```sh
xattr -cr "/Applications/Family Insight.app"
```

:::

## Linux

### AppImage (toute distribution)

L’AppImage est un fichier unique qui fonctionne sans installation.

1. Téléchargez `family-insight-<version>-linux-x86_64.AppImage`.
2. Rendez-le exécutable : dans votre gestionnaire de fichiers, ouvrez **Propriétés → Permissions**
   et autorisez son exécution comme programme, ou dans un terminal :

   ```sh
   chmod +x family-insight-*.AppImage
   ```

3. Double-cliquez sur le fichier ou lancez `./family-insight-<version>-linux-x86_64.AppImage`.

Les AppImage ont besoin de **FUSE 2**. La plupart des distributions l’incluent ; sous Ubuntu 22.04,
installez-le avec `sudo apt install libfuse2` (sous Ubuntu 24.04 et versions ultérieures :
`sudo apt install libfuse2t64`). Si le logiciel ne démarre pas, voir
[Résolution des problèmes](./troubleshooting#linux).

::: tip Une entrée de menu pour l’AppImage
Une AppImage ne s’ajoute pas d’elle-même au menu des applications. Des outils comme **Gear Lever**
ou **AppImageLauncher** peuvent le faire pour vous ; vous pouvez aussi utiliser le paquet `.deb`
ci-dessous.

:::

### Paquet Debian (Ubuntu, Debian, Linux Mint …)

```sh
sudo apt install ./family-insight-<version>-linux-amd64.deb
```

Le paquet ajoute **Family Insight** au menu des applications (catégorie Bureautique) et ouvre les
fichiers `.finsight` d’un double-clic. Depuis un terminal, lancez-le avec `family-insight`.

## Mise à jour {#updating}

Family Insight ne se met pas encore à jour tout seul. Pour obtenir une nouvelle version,
téléchargez-la depuis la
[page des versions](https://github.com/K-u-r-c/family-insight/releases/latest) et installez-la de
la même façon – par-dessus l’ancienne (programme d’installation Windows, `.deb`), en remplaçant
l’application dans Applications (macOS) ou en remplaçant l’ancien fichier AppImage. Vos arbres sont
des fichiers séparés et ne sont pas modifiés ; vos paramètres sont conservés.

## Désinstallation {#uninstalling}

| Système            | Comment                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- |
| Windows            | **Paramètres → Applications → Applications installées → Family Insight → Désinstaller** |
| Windows (portable) | Supprimez le fichier `.exe`                                                             |
| macOS              | Faites glisser **Family Insight** d’Applications vers la Corbeille                      |
| Linux (AppImage)   | Supprimez le fichier `.AppImage`                                                        |
| Linux (`.deb`)     | `sudo apt remove family-insight`                                                        |

La désinstallation ne supprime jamais vos fichiers `.finsight`. Les paramètres, la liste des
fichiers récents et les copies de récupération restent dans un dossier de votre profil
utilisateur ; supprimez-le aussi si vous voulez tout effacer :

| Système | Dossier des paramètres                         |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |
