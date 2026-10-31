---
description: 'Changer la langue, le thème, la taille des cartes et l’enregistrement automatique de Family Insight, et trouver ou réinitialiser les paramètres.'
---

# Paramètres

Cliquez sur le bouton **Paramètres** (⚙) à droite de la barre d’outils :

<Screenshot name="settings-menu" alt="Le menu des paramètres avec Thème (Système, Clair, Sombre), Style (Moderne, Tapisserie), Langue (English, Polski, Deutsch, Français, Español, Italiano, Português, Русский), Cartes (Confortables, Compactes) et Enregistrer automatiquement" />

| Paramètre                                       | Choix                                                                     | Effet                                                                                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Thème**                                       | Système, Clair, Sombre                                                    | Les couleurs du logiciel. **Système** suit le mode clair ou sombre de votre ordinateur.                                                                             |
| **Style**                                       | Moderne, Tapisserie                                                       | L’apparence de tout le logiciel. **Tapisserie** rappelle une ancienne tapisserie de famille : parchemin et encre en thème clair, vert sombre et or en thème sombre. |
| **Langue**                                      | English, Polski, Deutsch, Français, Español, Italiano, Português, Русский | La langue de tout le logiciel, y compris la barre de menus et les boîtes de dialogue. Le changement est immédiat.                                                   |
| **Cartes**                                      | Confortables, Compactes                                                   | La taille des fiches dans l’arbre. Les fiches compactes font tenir plus de personnes à l’écran et sur papier.                                                       |
| **Enregistrer automatiquement**                 | activé (par défaut) / désactivé                                           | L’[enregistrement automatique](./files#autosave) des arbres qui ont déjà un fichier.                                                                                |
| **Rechercher automatiquement les mises à jour** | activé (par défaut) / désactivé                                           | Une vérification quotidienne des nouvelles versions ([Mises à jour](./updates)) ; **Rechercher maintenant…** vérifie tout de suite.                                 |
| **Charger les cartes en ligne**                 | désactivé (par défaut) / activé                                           | Télécharge le fond de carte depuis OpenStreetMap pendant que vous utilisez la [carte](./map#online).                                                                |
| **Rechercher les lieux en ligne**               | désactivé (par défaut) / activé                                           | Permet à **Rechercher en ligne** d’envoyer un nom de lieu à OpenStreetMap pour trouver ses coordonnées ([Lieux](./places#lookup)).                                  |

Le style se change aussi dans la barre de menus : **Affichage → Style**.

Le thème et la langue peuvent aussi être changés sur l’écran d’accueil (coin supérieur droit) et
dans le menu **Affichage** de la barre de menus. Le menu **Affichage** permet aussi d’afficher ou de
masquer la liste des personnes et la carte d’ensemble.

Family Insight mémorise d’autres choses pour vous : la taille et la position de la fenêtre, la
largeur des panneaux, le séparateur CSV utilisé en dernier et les
[fichiers récents](./files#opening).

::: tip Le séparateur CSV suit la langue
Quand vous changez de langue dans le menu **Affichage**, le séparateur CSV par défaut change avec
elle – un point-virgule pour le français, une virgule pour l’anglais. Vous pouvez toujours en
choisir un autre lors de l’[export](./csv-export).

:::

## Où sont enregistrés les paramètres

Les paramètres sont enregistrés dans un petit fichier, `settings.json`, dans votre profil
utilisateur – séparément de vos arbres :

| Système | Dossier                                        |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |

## Réinitialiser les paramètres

Fermez Family Insight et supprimez `settings.json` de ce dossier. Au lancement suivant, les
paramètres par défaut sont utilisés (ainsi que la langue de votre système). Vos arbres ne sont pas
concernés.
