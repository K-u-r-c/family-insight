---
description: 'Afficher toute la famille ou se concentrer sur l’ascendance, la descendance ou les deux d’une personne, avec une limite de générations.'
---

# Modes d’affichage

Les boutons de **mode d’affichage** de la barre d’outils déterminent qui est affiché dans l’arbre :

<Screenshot name="view-controls" alt="Les quatre boutons de mode d’affichage : 1 Famille, 2 Ascendance, 3 Descendance, 4 Sablier" />

1. **Famille** – toutes les personnes de l’arbre.
2. **Ascendance** – une personne, ses parents, ses grands-parents et ainsi de suite.
3. **Descendance** – une personne, ses enfants, ses petits-enfants et ainsi de suite (avec leurs
   conjoints).
4. **Sablier** – l’ascendance et la descendance d’une personne réunies.

(Dans une fenêtre large, les boutons affichent aussi leur nom.) Les mêmes choix se trouvent dans le
menu **Affichage** de la barre de menus.

## L’ascendance de qui ? {#root-person}

Les vues Ascendance, Descendance et Sablier partent de la **personne de référence** – marquée d’une
petite maison (🏠) sur sa fiche. Si l’arbre n’a pas de personne de référence, elles partent de la
personne **sélectionnée**.

Pour faire de quelqu’un la personne de référence, faites un clic droit sur sa fiche et choisissez
**Définir comme personne de référence**. Le même menu propose
**Retirer la personne de référence**. Dans la [famille d’exemple](./sample-family), la personne de
référence est Jan Kowalski.

### Ascendance

<Screenshot name="view-ancestors" alt="La vue Ascendance de Lena Kowalska : ses parents, grands-parents et arrière-grands-parents au-dessus d’elle" />

### Descendance

<Screenshot name="view-descendants" alt="La vue Descendance de Jan Kowalski avec ses enfants, petits-enfants et arrière-petits-enfants" />

### Sablier

<Screenshot name="view-hourglass" alt="La vue Sablier de Jakub Kowalski avec son ascendance au-dessus et sa fille en dessous" />

## Combien de générations ? {#generations}

Dans les vues Ascendance, Descendance et Sablier, une liste à côté des boutons indique combien de
générations afficher – de **1 génération** à **Toutes les générations**. Moins de générations
rendent les grands arbres plus faciles à lire et à imprimer.

## Enregistré avec le fichier

Le mode d’affichage, le nombre de générations et les [branches repliées](./navigation#collapse)
sont enregistrés dans le fichier `.finsight` et rétablis à la prochaine ouverture. Changer
d’affichage n’est pas une modification : cela n’apparaît donc pas dans l’[annulation](./undo).
