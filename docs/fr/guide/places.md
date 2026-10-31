---
description: 'Donnez une position aux lieux de votre arbre – recherche en ligne (facultative) ou saisie des coordonnées – et fusionnez les différentes graphies d’un même lieu.'
---

# Lieux

Les lieux se saisissent sous forme de texte partout où vous les indiquez – naissance, décès,
événements, mariages, photos. **☰ → Lieux…** (ou **Édition → Lieux…**) les rassemble dans une
seule liste : vous pouvez ainsi donner à chaque lieu une **position** pour la [carte](./map) et
harmoniser les graphies.

<Screenshot name="places-manager" alt="La fenêtre Lieux : à gauche une liste de lieux avec leur nombre d’utilisations, à droite Łódź sélectionné avec ses coordonnées, les champs latitude et longitude, Enregistrer la position, Rechercher en ligne (1) et Fusionner avec un autre lieu" />

La liste affiche chaque lieu avec son nombre d’utilisations et indique s’il a une position. Les
lieux qui ne diffèrent que par les majuscules, les espaces ou les accents (_Besançon_,
_Besancon_, _ besançon _) comptent comme un seul lieu ; la graphie la plus fréquente est affichée
et les autres sont indiquées sous **Aussi écrit**.

## Rechercher une position en ligne {#lookup}

Cliquez sur **Rechercher en ligne** (1). La première fois, Family Insight vous demande s’il peut le
faire :

<Screenshot name="places-consent" alt="La question Rechercher les lieux en ligne ? qui explique que seul le nom du lieu est envoyé à OpenStreetMap Nominatim, avec Autoriser et Annuler" />

- Seul le **nom du lieu** est envoyé – aucun nom de personne, aucune date, rien d’autre – à
  [OpenStreetMap Nominatim](https://nominatim.org), un service gratuit.
- Choisissez la bonne correspondance dans les résultats ; ses coordonnées sont enregistrées avec
  l’arbre.
- Les réponses sont mémorisées sur votre ordinateur : le même lieu n’est pas demandé deux fois.
- Vous pouvez désactiver cette fonction dans les paramètres
  (**⚙ → Rechercher les lieux en ligne**). Sans elle – ou sans connexion Internet – tout le reste
  fonctionne comme avant.

## Saisir les coordonnées vous-même

Tapez la **latitude** et la **longitude** (par exemple _50,0619_ et _19,9369_ pour Cracovie – le
point fonctionne aussi comme séparateur décimal) et cliquez sur **Enregistrer la position**. Vous
pouvez les copier depuis n’importe quel site de cartographie. **Retirer la position** les efface.

## Fusionner des graphies

Le même village est souvent écrit de plusieurs façons – _Cracovie_, _Krakau_, _Kraków_.
Sélectionnez l’une d’elles, choisissez le lieu dans lequel **fusionner** et cliquez sur
**Fusionner** : chaque naissance, décès, événement, mariage et photo reçoit la graphie choisie, et
le lieu garde une seule position. Comme toute modification, une fusion peut être annulée avec
<kbd>Ctrl</kbd>+<kbd>Z</kbd>.

::: info
Les positions sont enregistrées dans le fichier `.finsight`. Vos lieux eux-mêmes ne changent pas –
un lieu sans position n’apparaît simplement pas sur la carte.

:::
