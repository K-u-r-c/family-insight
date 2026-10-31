---
description: 'Importer un arbre généalogique depuis Excel, LibreOffice ou Google Sheets : préparer la feuille, vérifier l’aperçu et corriger les erreurs courantes.'
---

# Importer depuis un CSV

Votre famille est déjà dans un tableur ? Family Insight peut la lire depuis un fichier **CSV** – le
format que tous les tableurs savent enregistrer.

## 1. Préparer la feuille de calcul

Utilisez **une ligne par personne** et les colonnes suivantes (dans n’importe quel ordre, avec les
noms anglais ou français) :

| Colonne                      | Nom français                         | Ce qu’il faut écrire                                                  |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| `id` **(obligatoire)**       | `id`                                 | un libellé court et unique pour la personne, par exemple `p1`, `p2` … |
| `given_names`                | `prenoms`                            | les prénoms                                                           |
| `surname`                    | `nom`                                | le nom                                                                |
| `birth_surname`              | `nom_de_naissance`                   | le nom de naissance (de jeune fille)                                  |
| `sex`                        | `sexe`                               | `femme` / `homme` (ou `F`, `H`, `M`, `female`, `male`)                |
| `birth_date`, `death_date`   | `date_de_naissance`, `date_de_deces` | `1890`, `05/1890`, `12/05/1890`, `~1890` … ([dates](./editing#dates)) |
| `birth_place`, `death_place` | `lieu_de_naissance`, `lieu_de_deces` | la ville ou le village                                                |
| `living`                     | `vivant`                             | `oui` / `non` (ou `yes` / `no`)                                       |
| `father_id`, `mother_id`     | `pere_id`, `mere_id`                 | l’**id** du père et de la mère                                        |
| `partner_ids`                | `partenaires_id`                     | les **id** des conjoints, séparés par `\|` – par exemple `p2\|p5`     |
| `notes`                      | `notes`                              | tout le reste                                                         |

Les noms de colonnes et les valeurs en **polonais, allemand, espagnol, italien, portugais et russe**
fonctionnent aussi (par exemple `imiona`, `vornamen`, `fecha_de_nacimiento`, `фамилия` ;
`mężczyzna`, `männlich`, `да`) – tous les noms sont listés dans la
[référence du format CSV](/developer/reference/csv-format#columns) (en anglais). Pour les patronymes
et les doubles noms, voir [Noms d’autres pays](./editing#name-conventions).

Chaque personne a besoin d’un **id** et d’au moins un prénom ou un nom ; toutes les autres colonnes
sont facultatives. Les proches sont reliés par leurs id – par exemple `p3` avec `father_id` `p1` et
`mother_id` `p2` est l’enfant de `p1` et `p2`. Une union n’a besoin d’être indiquée que d’un seul
côté.

::: tip Partir d’un exemple
Téléchargez un exemple de 25 personnes – avec des
[noms de colonnes anglais](/samples/example-en.csv) ou
[polonais](/samples/example-pl.csv) – ou un modèle vide avec des noms de colonnes français depuis
Family Insight : **Aide → Télécharger le modèle CSV…**. La spécification complète se trouve dans la
[référence du format CSV](/developer/reference/csv-format) (en anglais).

:::

## 2. L’enregistrer au format CSV

| Logiciel         | Comment                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Microsoft Excel  | **Fichier → Enregistrer sous**, type **CSV UTF-8 (délimité par des virgules) (\*.csv)**          |
| LibreOffice Calc | **Fichier → Enregistrer sous**, type **Texte CSV (.csv)**, jeu de caractères **Unicode (UTF-8)** |
| Google Sheets    | **Fichier → Télécharger → Valeurs séparées par des virgules (.csv)**                             |

Les virgules, les points-virgules et les tabulations fonctionnent tous comme séparateurs. Les
fichiers qui ne sont pas enregistrés en UTF-8 (le type **CSV** simple des anciennes versions
d’Excel) fonctionnent aussi : d’après leurs lettres, Family Insight reconnaît les textes d’Europe
occidentale (Windows-1252), d’Europe centrale (Windows-1250) et en cyrillique (Windows-1251).

## 3. Importer

Sur l’écran d’accueil, cliquez sur **Importer depuis un CSV…**, ou, si un arbre est ouvert,
choisissez **☰ → Importer un CSV…**. Vous pouvez aussi faire glisser le fichier `.csv` sur la
fenêtre. Avant que quoi que ce soit ne change, un aperçu s’affiche :

<Screenshot name="csv-import" alt="L’aperçu de l’importation : le séparateur et l’encodage détectés, les colonnes avec la façon dont chacune est importée, un aperçu des premières lignes et le bouton Importer" />

- En haut : le **séparateur et l’encodage du texte** détectés.
- **Jeu de caractères** – si des lettres comme é, ç, ö ou ж s’affichent mal dans l’aperçu,
  choisissez-en un autre ici (affiché pour les fichiers lus sur le disque ; celui qui a été
  détecté est signalé).
- **Colonnes** – comment chaque colonne de votre fichier sera utilisée. Si une colonne n’a pas été
  reconnue (par exemple parce qu’elle s’appelle « Prénom usuel »), choisissez la bonne
  signification dans la liste, ou **Ne pas importer** pour l’ignorer.
- **Aperçu** – les premières lignes telles que Family Insight les a comprises.
- En bas : le nombre de personnes et de relations qui seront importées.

<Screenshot name="csv-import-columns" alt="Le tableau Colonnes : colonne du fichier, importée comme (une liste) et la valeur de la première ligne" />

Si un arbre est déjà ouvert, choisissez d’importer dans **Un nouvel arbre** ou dans
**L’arbre actuel**. L’importation dans l’arbre actuel ajoute toutes les personnes du fichier comme
nouvelles personnes (elles ne sont pas rapprochées des personnes déjà présentes) – en une seule
étape que vous pouvez [annuler](./undo).

Cliquez sur **Importer**. Un nouvel arbre créé à partir d’un fichier CSV n’a pas encore de fichier –
[enregistrez-le](./files) pour le conserver.

## Problèmes et avertissements {#problems}

Les **problèmes** (en rouge) doivent être corrigés avant l’importation – corrigez-les dans votre
tableur (ou modifiez la correspondance des colonnes) et importez à nouveau. Les **avertissements**
(en jaune) expliquent ce qui va se passer ; vous pouvez importer quand même. Chaque message indique
la ligne concernée.

<Screenshot name="csv-import-errors" alt="L’aperçu de l’importation avec 2 problèmes : Ligne 4 – l’identifiant p2 est utilisé plusieurs fois ; Ligne 5 – fait référence à p9, mais aucune ligne n’a cet identifiant" />

### Problèmes qui bloquent l’importation

| Message                                                                  | Comment corriger                                                                                |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| _Le fichier est vide._                                                   | Choisissez le bon fichier, ou vérifiez que la feuille a été enregistrée avec des données.       |
| _Le fichier n’a pas de colonne « id »…_                                  | Ajoutez une colonne `id` avec un libellé unique pour chaque personne.                           |
| _Le fichier n’a pas de colonne de nom (« given_names » ou « surname »)._ | Ajoutez une colonne `given_names` ou `surname`, ou faites-y correspondre une colonne existante. |
| _Cette ligne n’a pas d’identifiant._                                     | Remplissez l’id dans cette ligne.                                                               |
| _L’identifiant « p2 » est utilisé plusieurs fois._                       | Donnez un id différent à chaque personne.                                                       |
| _La personne « p7 » n’a ni prénom ni nom._                               | Remplissez au moins un nom (ou supprimez la ligne vide).                                        |
| _Fait référence à « p9 », mais aucune ligne n’a cet identifiant._        | Corrigez l’id dans `father_id`, `mother_id` ou `partner_ids`, ou ajoutez cette personne.        |
| _La personne fait référence à elle-même (« p3 »)._                       | Une personne ne peut pas être son propre parent ou conjoint – corrigez l’id.                    |
| _Le père et la mère sont la même personne (« p1 »)._                     | Corrigez `father_id` ou `mother_id`.                                                            |
| _… deviendrait son propre ancêtre._                                      | Quelque part, un enfant figure comme parent de son propre ancêtre – vérifiez les id.            |

### Avertissements

| Message                                                                                            | Ce qui se passe                                                         |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| _La colonne « … » n’est pas reconnue et sera ignorée._                                             | La colonne est ignorée – faites-la correspondre à un champ si besoin.   |
| _« … » n’est pas une date reconnue ; elle a été ajoutée aux notes._                                | Le texte est conservé dans les notes de la personne : rien n’est perdu. |
| _« … » n’est pas un sexe connu ; importé comme inconnu._                                           | Utilisez `femme`, `homme`, `autre` ou `inconnu` (ou les mots anglais).  |
| _« … » n’est ni yes ni no ; le statut (en vie ou non) reste inconnu._                              | Utilisez `oui`/`non`, `yes`/`no`, `true`/`false` ou `1`/`0`.            |
| Avertissements de date (décès avant la naissance, plus de 120 ans, parent plus jeune que l’enfant) | Importé tel quel – voir [Avertissements](./editing#warnings).           |

## Ce que le CSV ne peut pas contenir

Le CSV conserve les noms, les dates, les lieux, le statut vital, les parents biologiques, les
conjoints et les notes. **Les photos, les dates et lieux des unions, les liens adoptifs, par
alliance ou d’accueil, la personne de référence et l’affichage** n’existent que dans les fichiers
`.finsight` – utilisez-les pour tout conserver.
