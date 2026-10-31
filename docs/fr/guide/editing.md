---
description: 'Modifier une personne : prénoms et nom de naissance, dates partielles et approximatives, lieux, statut vital, photo et notes.'
---

# Modifier une personne

Sélectionnez une personne et cliquez sur **Modifier** dans le panneau de détails – ou
double-cliquez sur sa fiche, ou sélectionnez-la et appuyez sur <kbd>Enter</kbd>. Le panneau passe
en mode édition :

<Screenshot name="person-editor" alt="L’éditeur de Piotr Kowalski avec la photo, les noms, le sexe et la date de naissance" />

Chaque champ est enregistré dès que vous le quittez (<kbd>Tab</kbd> ou un clic ailleurs) ;
<kbd>Esc</kbd> annule ce que vous avez tapé dans le champ en cours. Cliquez sur **Terminé** pour
revenir aux détails.

## Noms

- **Prénoms** – tous les prénoms, par exemple `Anne Marie`.
- **Nom** – le nom actuel.
- **Nom de naissance** – le nom à la naissance (nom de jeune fille). Cliquez sur
  **Ajouter le nom de naissance** pour afficher le champ. Dans l’arbre et les listes, il apparaît
  sous la forme « née Wiśniewska ».
- **Sexe** – femme, homme, autre ou inconnu. Il détermine la couleur de la fiche et aide lors de
  l’ajout de proches.

::: tip Noms d’autres pays {#name-conventions}

- **Russe, ukrainien, biélorusse** : écrivez le patronyme avec les prénoms – prénoms
  `Иван Петрович`, nom `Иванов`.
- **Espagnol et portugais** : les deux noms vont dans le champ du nom – `García Márquez`,
  `Santos Silva`.
- **Les particules** comme de, du, le, von, van, da, dos ou di font partie du nom
  (`de La Fontaine`, `van der Berg`) ; pour le tri, la liste n’en tient pas compte.

:::

## Dates {#dates}

Les actes anciens sont rarement précis : les dates peuvent donc être partielles ou approximatives.
Tapez la date dans le champ ; la ligne en dessous montre comment Family Insight l’a comprise.

<Screenshot name="date-field" alt="Le champ Date de naissance avec le texte ~1955 (1) et la liste de précision (2)" />

| Vous tapez                           | Signification  | Affiché en français | Affiché en anglais |
| ------------------------------------ | -------------- | ------------------- | ------------------ |
| `1890`                               | l’année seule  | 1890                | 1890               |
| `05/1890` ou `1890-05`               | mois et année  | mai 1890            | May 1890           |
| `12/05/1890` ou `1890-05-12`         | un jour précis | 12 mai 1890         | 12 May 1890        |
| `12.05.1890`                         | un jour précis | 12 mai 1890         | 12 May 1890        |
| `mai 1890`, `May 1890`, `maj 1890`   | mois et année  | mai 1890            | May 1890           |
| `1er mai 1890`, `May 1, 1890`        | un jour précis | 1er mai 1890        | 1 May 1890         |
| `~1890`, `vers 1890`, `env. 1890`    | environ        | vers 1890           | about 1890         |
| `<1890`, `avant 1890`, `before 1890` | avant          | avant 1890          | before 1890        |
| `>1890`, `après 1890`, `after 1890`  | après          | après 1890          | after 1890         |

Avec un jour précis, la formulation change légèrement : `~12/05/1890` s’affiche « vers le 12 mai 1890 »,
`<12/05/1890` « avant le 12 mai 1890 ».

Les noms de mois et les mots comme _vers_ ou _avant_ peuvent être tapés dans toutes les langues du
logiciel et sous toutes leurs formes (`12 maja 1890`, `12. Mai 1890`, `12 May 1890`,
`12 de mayo de 1890`, `около 1890`), et aussi en abrégé (`sept. 1890`). Avec le logiciel en anglais,
`05/23/1890` est lu comme le 23 mai quand il ne peut pas s’agir d’une date commençant par le jour.

Bon à savoir :

- Avec des points et des barres obliques, le jour vient en premier : `05/06/1890` est le
  **5 juin** 1890.
- La **liste de précision** à côté du champ (**Exactement**, **Vers**, **Avant**, **Après**) fait la
  même chose que taper `~`, `<` ou `>`.
- `abt`, `bef`, `aft`, `circa` et `ca.` – les abréviations utilisées en généalogie – fonctionnent
  aussi.
- Une date incompréhensible s’affiche en rouge avec un exemple de ce qui fonctionne ; elle n’est pas
  enregistrée tant qu’elle n’est pas corrigée.
- Les âges sont calculés à partir des dates. Quand une date est partielle ou approximative, l’âge
  est affiché sous la forme « environ … ».

## Lieux

Tapez la ville ou le village de naissance et de décès. Les lieux déjà utilisés dans l’arbre sont
proposés pendant la saisie : le même lieu est ainsi toujours écrit de la même façon – ce qui rend
aussi les [statistiques](./statistics) et la [recherche](./search) plus utiles.

## Statut vital {#life-status}

Choisissez **En vie**, **Décédé(e)** ou **Inconnu**. Pour les personnes en vie, la date et le lieu
de décès sont masqués. Si vous saisissez une date ou un lieu de décès alors que le statut est
inconnu, la personne est considérée comme décédée.

## Photo {#photo}

Cliquez sur **Ajouter une photo…** et choisissez une image, ou déposez un fichier image sur
l’emplacement rond. Les formats pris en charge sont **JPG, PNG et WebP** jusqu’à 20 Mo (les photos
HEIC des iPhone doivent d’abord être converties). Une fenêtre de recadrage s’ouvre : faites glisser
l’image pour placer le visage, zoomez avec le curseur et cliquez sur **Utiliser la photo**.

<Screenshot name="photo-crop" alt="La boîte de dialogue Recadrer la photo avec un cadre rond, un curseur de zoom et le bouton Utiliser la photo" />

La photo est enregistrée **dans le fichier `.finsight`** (réduite à 512 × 512 pixels) : l’arbre
reste ainsi un seul fichier que vous pouvez copier n’importe où. Utilisez **Changer…** ou
**Retirer** sous la photo pour la remplacer ou la supprimer. Une image de la galerie de la personne
peut aussi devenir le portrait (**⋯ → Utiliser comme portrait…**, voir
[Photos et documents](./media)).

## Événements

Baptême, écoles, emplois, déménagements, service militaire, inhumation … se notent dans la section
**Événements** de l’éditeur. Voir [Événements](./events).

## Sources

Le petit bouton de source à côté de **Nom**, **Naissance**, **Vie** et de chaque événement indique
d’où vient une information. Voir [Sources](./sources).

## Notes

Tout ce qui mérite d’être retenu – profession, anecdotes, lieu où un document est conservé. Les
notes s’affichent dans le panneau de détails et sont incluses dans les
[exports CSV](./csv-export).

## Avertissements {#warnings}

Family Insight signale les données qui sont probablement une erreur – mais ne vous empêche jamais
de les enregistrer :

| Avertissement                                             | Quand                                                  |
| --------------------------------------------------------- | ------------------------------------------------------ |
| _La date de décès est antérieure à la date de naissance._ | la date de décès est antérieure à la date de naissance |
| _… aurait alors … ans. La date est-elle correcte ?_       | la personne aurait plus de 120 ans                     |
| _… est né(e) après …, mais figure comme parent._          | un parent biologique n’est pas plus âgé que l’enfant   |
