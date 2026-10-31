---
description: 'Échangez des arbres généalogiques entre Family Insight et d’autres logiciels de généalogie grâce au GEDCOM : import depuis Gramps, MyHeritage, Ancestry ou FamilySearch, export en GEDCOM 5.5.1 ou 7.0.'
---

# GEDCOM

**GEDCOM** est le format de fichier que les logiciels de généalogie utilisent pour échanger des
arbres généalogiques. Family Insight lit les fichiers GEDCOM 5.5, 5.5.1 et 7.0 (`.ged`, et `.gdz`
avec les photos incluses) et écrit en 5.5.1 ou 7.0.

## Importer un fichier GEDCOM

Choisissez **☰ → Importer un GEDCOM…** (ou **Fichier → Importer → GEDCOM…**, ou
**Importer depuis un GEDCOM…** sur l’écran d’accueil), ou déposez simplement un fichier `.ged` sur
la fenêtre. Un aperçu s’ouvre :

<Screenshot name="gedcom-import" alt="La fenêtre Importer un GEDCOM : GEDCOM 5.5.1 provenant de MyHeritage, le jeu de caractères UTF-8 (détecté), un avertissement concernant une date approximative, les balises non importées et le résumé avec les personnes, familles, événements, sources et fichiers multimédias" />

- La fenêtre indique la **version** et le **logiciel** qui a écrit le fichier, ainsi que le nombre
  de personnes, de familles, d’événements, de sources et de photos qu’il contient.
- **Jeu de caractères** – détecté automatiquement (UTF-8, UTF-16, ANSEL, ANSI, Windows-1250, Windows-1251). Si des
  lettres comme _é_, _è_, _ç_ ou _œ_ s’affichent mal dans le résultat, choisissez-en un autre.
- Les **avertissements** expliquent ce qui n’a pas pu être repris exactement – par exemple une date
  comme _BET 1850 AND 1855_ ou une date du calendrier julien. Le texte d’origine est conservé dans
  les notes de la personne : rien n’est perdu.
- La section **… informations non importées** liste les détails propres à d’autres logiciels qui n’ont pas d’équivalent dans
  Family Insight (numéros d’enregistrement, identifiants internes …), regroupés par balise.
- Si un arbre est ouvert, vous pouvez importer dans **Un nouvel arbre** ou dans
  **L’arbre actuel**. L’ajout à l’arbre ouvert est une seule étape que vous pouvez annuler.

Les photos et les documents mentionnés dans le fichier sont chargés depuis l’emplacement indiqué
par le fichier – ou, si le fichier vient d’un autre ordinateur, depuis le dossier du fichier `.ged`
et son dossier `media`. Un fichier `.gdz` les contient directement.

### Ce qui est conservé

Les noms (y compris les noms de naissance et d’épouse), le sexe, la naissance et le décès, les
événements (baptême, inhumation, émigration, profession, service militaire …, et événements
personnalisés), les notes, les sources et les dépôts d’archives avec leurs citations (page,
fiabilité, transcription), les photos et les documents, les mariages, les fiançailles et les
divorces, les parents adoptifs, d’accueil et par alliance, et les coordonnées des lieux.

### Venir d’un autre logiciel

| Logiciel                                  | Comment exporter un fichier GEDCOM                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gramps**                                | **Arbres familiaux → Exporter…**, choisissez _GEDCOM_.                                                                                                                    |
| **MyHeritage**                            | Family Tree Builder : **Fichier → Exporter vers GEDCOM** ; sur le site : **Arbre généalogique → Gérer les arbres → Exporter vers GEDCOM**.                                |
| **Ancestry**                              | **Arbres → (votre arbre) → Paramètres de l’arbre → Exporter l’arbre**.                                                                                                    |
| **FamilySearch**                          | FamilySearch n’exporte pas l’arbre partagé dans son ensemble ; exportez vos propres arbres avec des logiciels partenaires, ou partez d’un GEDCOM que quelqu’un a partagé. |
| **Legacy, RootsMagic, Family Tree Maker** | **File → Export → GEDCOM**.                                                                                                                                               |

## Exporter un fichier GEDCOM

Choisissez **☰ → Exporter en GEDCOM…** (ou **Fichier → Exporter → GEDCOM…**) :

<Screenshot name="gedcom-export" alt="La fenêtre Exporter en GEDCOM avec la version GEDCOM 5.5.1 ou 7.0, Inclure les photos et documents, Masquer les personnes vivantes et Inclure les notes" />

- **Version** – la **5.5.1** est lue par presque tous les logiciels de généalogie ; la **7.0** est
  la version la plus récente.
- **Inclure … photos et documents** – en 5.5.1, ils sont enregistrés dans un dossier `media` à côté
  du fichier GEDCOM ; en 7.0, tout est regroupé dans un seul fichier `.gdz`.
- **Masquer les personnes vivantes** – remplace le nom des personnes qui sont peut-être en vie par
  « Vivant » et omet leurs détails. Utilisez cette option quand vous partagez votre arbre.
- **Inclure les notes** – laissez cette option décochée pour ne partager que les faits.

::: info Ce que le GEDCOM ne peut pas contenir
Le fait qu’une personne soit en vie (seul le décès est enregistré), l’adresse web d’une source (elle
devient une ligne dans les notes de la source) et les réglages d’affichage de votre arbre. Tout le
reste revient quand vous importez de nouveau le fichier dans Family Insight.

:::
