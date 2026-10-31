---
description: 'Trouvez rapidement des personnes : recherche par prénom, nom de naissance, lieu ou année, sans tenir compte des majuscules ni des accents.'
---

# Rechercher des personnes

Cliquez dans le champ de recherche de la barre d’outils ou appuyez sur <kbd>Ctrl</kbd>+<kbd>F</kbd>
(sur Mac <kbd>⌘</kbd>+<kbd>F</kbd>) et commencez à taper. La liste des personnes n’affiche plus que
les résultats, et dans l’arbre les fiches correspondantes sont mises en évidence tandis que les
autres s’estompent :

<Screenshot name="search" alt="Une recherche de lodz : la liste affiche 9 personnes sur 25 et les fiches correspondantes sont mises en évidence dans l’arbre" />

## Ce que vous pouvez rechercher

La recherche porte sur les **prénoms, noms, noms de naissance, lieux de naissance et de décès,
années de naissance et de décès, les lieux, descriptions et noms des [événements](./events), et les
titres des [sources](./sources)** :

| Vous tapez    | Trouve                                              |
| ------------- | --------------------------------------------------- |
| `kowal`       | Kowalski, Kowalska, Kowalczyk …                     |
| `lodz`        | toutes les personnes nées ou décédées à Łódź        |
| `francois`    | François                                            |
| `1925`        | les personnes nées ou décédées en 1925              |
| `anna krakow` | les personnes prénommées Anna **et** liées à Kraków |

- **Les majuscules et les accents ne comptent pas** : `etienne`, `Etienne` et `Étienne` donnent
  les mêmes résultats, tout comme `lodz` et `Łódź`.
- Les graphies allemandes fonctionnent dans les deux sens : `mueller` et `muller` trouvent Müller,
  `strasse` trouve Straße.
- Les noms russes (et autres noms en cyrillique) peuvent être tapés en lettres latines : `ivanov`
  trouve Иванов, et `ё` compte comme `е`.
- Avec **plusieurs mots**, une personne doit correspondre à tous.
- Les parties de mots fonctionnent : `wiśn` trouve Wiśniewski.

## Parcourir les résultats

- Appuyez sur <kbd>↓</kbd> ou <kbd>Enter</kbd> dans le champ de recherche pour passer au premier
  résultat de la liste. Parcourir la liste avec <kbd>↑</kbd> et <kbd>↓</kbd> sélectionne chaque
  personne tour à tour ; <kbd>↑</kbd> sur le premier résultat vous ramène au champ de recherche.
- Appuyez sur <kbd>Esc</kbd> dans le champ de recherche (ou cliquez sur **×**) pour effacer la
  recherche.

## Trier la liste

Le bouton **Trier** en haut de la liste des personnes la classe **par nom**, **par prénom** ou
**par date de naissance** :

<Screenshot name="people-sort" alt="Le menu de tri de la liste des personnes avec Par nom, Par prénom et Par date de naissance" />

Les noms sont triés selon les règles de la langue du logiciel (en français, les lettres accentuées
sont classées avec les lettres simples : Élise vient avec les E). Les particules ne comptent pas
pour le tri : **de La Fontaine** est classé à F, **van der Berg** à B et **von Goethe** à G – mais
ils restent affichés en entier.
