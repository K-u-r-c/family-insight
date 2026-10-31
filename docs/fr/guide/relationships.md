---
description: 'Notez les parents adoptifs, par alliance et d’accueil, les mariages et unions avec leurs dates, les divorces, les remariages et les demi-frères et sœurs.'
---

# Relations

Une famille, c’est plus qu’un père, une mère et des enfants. Family Insight note **comment** les
personnes sont liées, et dessine clairement les remariages, les demi-frères et sœurs et les
adoptions.

## Parents : biologiques, adoptifs, par alliance ou d’accueil

Chaque lien de parenté a un type. Ouvrez le menu **⋯** à côté d’un parent (dans le panneau de
l’enfant) ou à côté d’un enfant (dans le panneau du parent) et choisissez :

- **Biologique** – le type par défaut. Une personne peut avoir au plus deux parents biologiques.
- **Adoptif**, **Par alliance** ou **D’accueil** – autant que nécessaire.

<Screenshot name="parent-kind" alt="Le menu d’options à côté du parent Jan Kowalski avec les types Biologique, Adoptif, Par alliance et D’accueil et Retirer la relation" />

Les liens de parenté non biologiques sont dessinés en **pointillés** dans l’arbre, et le type est
indiqué à côté du nom dans les listes de la famille (par exemple « Adoptif »).

::: tip Deux parents biologiques sont déjà là ?
**+ Parent** ajoute alors le nouveau parent comme **beau-parent**. S’il s’agit vraiment du parent
biologique, changez d’abord l’un des parents existants en adoptif, par alliance ou d’accueil.

:::

## Conjoints et mariages {#partners}

Une personne peut avoir autant de conjoints que nécessaire. Pour ajouter les détails d’une union,
ouvrez le menu **⋯** à côté du conjoint et choisissez **Modifier l’union** :

<Screenshot name="partnership-dialog" alt="La boîte de dialogue Modifier l’union avec le type, la date de début, le lieu, la date de fin et la façon dont elle a pris fin" />

- **Type** – Mariage, Union libre, Fiançailles ou Vie commune.
- **Date de début** et **Lieu** – par exemple la date du mariage et l’église ou la commune. Les
  dates fonctionnent comme partout ailleurs : `1978`, `06/1978` ou `~1978`
  ([en savoir plus sur les dates](./editing#dates)).
- **Date de fin** et **Comment elle a pris fin** – Divorce, Séparation, Décès d’un conjoint ou
  Autre. Laissez **Pas terminée** pour les unions qui durent.

La liste de la famille affiche alors, par exemple, « Mariage 12 juin 1978, jusqu’au 3 mars 1990 ».
Les unions terminées sont dessinées en pointillés dans l’arbre.

## Remariages et demi-frères et sœurs

Quand une personne a eu plusieurs conjoints, Family Insight la place au milieu, avec ses conjoints
de part et d’autre, dans l’ordre du début des unions, et dessine les enfants de chaque couple sous
le bon couple :

<Screenshot name="remarriage" alt="Piotr Kowalski entre ses deux épouses, Magdalena Nowicka et Katarzyna Kowalska, avec le fils du premier mariage sous le premier couple et les deux enfants du second sous le second couple" />

Les frères et sœurs qui n’ont qu’un parent en commun sont marqués **demi-frère/sœur** dans la liste
de la famille. Quand vous ajoutez un enfant à une personne qui a plusieurs conjoints,
Family Insight vous demande qui est l’autre parent ([Ajouter des personnes](./people)).

## Retirer une relation

Ouvrez le menu **⋯** à côté du proche et choisissez **Retirer la relation** :

<Screenshot name="relation-options" alt="Le menu d’options à côté de la conjointe Magdalena Nowicka avec Modifier l’union et Retirer la relation" />

Seul le lien est retiré – les deux personnes restent dans l’arbre. Un message avec **Annuler**
apparaît pendant quelques secondes ; vous pouvez aussi annuler plus tard avec
<kbd>Ctrl</kbd>+<kbd>Z</kbd>.

## Relations impossibles

Family Insight bloque les liens qui ne peuvent pas être corrects et vous explique pourquoi, par
exemple :

- _Une personne ne peut pas être liée à elle-même._
- _Ces personnes sont déjà liées de cette façon._
- _Quelqu’un deviendrait ainsi son propre ancêtre._
- _Une personne peut avoir au plus deux parents biologiques. Indiquez plutôt l’un d’eux comme
  adoptif, par alliance ou d’accueil._

Dans ce cas, rien ne change dans l’arbre.
