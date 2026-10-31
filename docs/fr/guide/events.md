---
description: 'Notez les événements d’une vie – baptême, études, emplois, déménagements, service militaire, inhumation et vos propres événements – avec dates, périodes et lieux.'
---

# Événements

Outre la naissance et le décès, une vie est faite de bien d’autres moments à retenir : un baptême,
l’école et l’université, des emplois, un déménagement dans une autre ville ou un autre pays, le
service militaire, une inhumation. Family Insight les appelle des **événements**.

## Ajouter un événement

1. Sélectionnez la personne et cliquez sur **Modifier**.
2. Faites défiler jusqu’à **Événements** et cliquez sur **Ajouter un événement**.
3. Choisissez le type d’événement. Ils sont regroupés en événements religieux ; travail, études et
   service ; déménagements et résidence ; et autres :

<Screenshot name="events-menu" alt="Le menu Ajouter un événement avec les types d’événements regroupés en Religion, Travail, études et service, Déménagements et résidence et Autres" />

Le nouvel événement s’ouvre aussitôt, avec le curseur dans le champ de la date.

## Remplir les détails

<Screenshot name="events-editor" alt="Les événements dans l’éditeur : Baptême et Service militaire ; le service militaire est ouvert avec le type, la date de début, la date de fin (3) et le lieu ; les boutons pour modifier (1) et monter (2)" />

- **Type** – changez le type d’événement à tout moment. Pour **Autre événement**, tapez votre
  propre nom (par exemple _Pèlerinage_).
- **Date (ou début)** et **Date de fin (facultative)** – une date unique, ou une période comme le
  service militaire de 1914 à 1918. Les dates fonctionnent comme partout ailleurs : `1914`,
  `05/1914`, `~1914` ([en savoir plus sur les dates](./editing#dates)).
- **Lieu** – les suggestions viennent des lieux déjà utilisés dans l’arbre.
- **Description** – un court détail : la profession, l’école, le régiment, le navire.
- **Notes** – tout le reste.

Chaque champ est enregistré quand vous le quittez. Cliquez sur le titre d’un événement ou sur le
crayon (1) pour l’ouvrir ou le refermer.

## Ordre et suppression

- Les flèches (2) déplacent un événement vers le haut ou vers le bas. L’ordre choisi est conservé ;
  dans la chronologie de la personne, les événements sont de toute façon triés par date.
- La corbeille retire un événement. Un message avec **Annuler** apparaît – et comme toute
  modification, la suppression peut aussi être annulée avec <kbd>Ctrl</kbd>+<kbd>Z</kbd>.

## Où apparaissent les événements

- **Détails et chronologie** – la liste **Vie** de la personne affiche les événements avec leur
  icône, leur date ou leur période et leur lieu, entre la naissance et le décès. L’inhumation et
  la crémation viennent après le décès.

  <Screenshot name="events-details" alt="La chronologie de la vie de Jan Kowalski : naissance, baptême, service militaire 1944–1945, études 1946–1951 et profession 1951–1990" />

- **Recherche** – les lieux et les descriptions des événements sont pris en compte : recherchez
  _Hamburg_ pour trouver toutes les personnes qui ont émigré par ce port.
- **Statistiques** – les événements et les lieux d’événements les plus fréquents, et le nombre de
  personnes qui n’ont encore aucun événement ([Statistiques](./statistics)).

## Avertissements

Comme pour les autres dates, les événements donnent lieu à des avertissements discrets quand
quelque chose semble incorrect – ils ne vous bloquent jamais :

- _Un événement de … est daté d’avant sa naissance._
- _Un événement de … est daté d’après son décès._ (L’inhumation et la crémation sont acceptées.)
- _Cet événement se termine avant d’avoir commencé._

::: info CSV et anciennes versions
Les événements sont enregistrés dans le fichier `.finsight`. Les exports CSV contiennent une ligne
par personne et n’incluent pas les événements. Depuis la version 1.1, les arbres sont enregistrés
dans un format de fichier plus récent qui a de la place pour les événements : Family Insight 1.0
ne peut pas les ouvrir et vous demande de faire la mise à jour.

:::
