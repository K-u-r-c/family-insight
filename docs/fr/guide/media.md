---
description: 'Gardez les photos et les documents numérisés avec les personnes concernées : galerie, visionneuse, PDF, photos de famille affichées pour plusieurs personnes et numérisations de sources.'
---

# Photos et documents

Chaque personne peut avoir une **galerie** de photos et de documents numérisés : photos de mariage,
actes, lettres, PDF provenant d’archives. Ils sont enregistrés **dans le fichier `.finsight`** :
l’arbre reste ainsi un seul fichier que vous pouvez copier n’importe où – et une image utilisée pour
plusieurs personnes n’est enregistrée qu’une fois.

## Ajouter des photos et des documents

1. Sélectionnez la personne. Les détails affichent **Photos et documents** sous les notes.
2. Cliquez sur **Ajouter…** (1) et choisissez un ou plusieurs fichiers – ou faites-les glisser
   depuis votre gestionnaire de fichiers sur la section.

<Screenshot name="media-gallery" alt="Les détails de Jan Kowalski avec la section Photos et documents : Ajouter… (1) et quatre éléments – une photo de mariage, la maison familiale, une lettre et un acte de naissance en PDF –, chacun avec un menu ⋯ (2)" />

Les fichiers **JPG, PNG, WebP, GIF** et **PDF** sont pris en charge, jusqu’à **25 Mo** chacun.
Family Insight vérifie ce qu’est vraiment un fichier, et pas seulement son nom. Les images ont un
petit aperçu ; les PDF affichent une icône de document.

Chaque élément a un menu **⋯** (2) :

| Élément du menu              | Ce qu’il fait                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| **Modifier les détails…**    | Titre, date, lieu et description – voir ci-dessous.                                                |
| **Utiliser comme portrait…** | Ouvre l’[outil de recadrage](./editing#photo) ; l’image recadrée devient le portrait.              |
| **Déplacer avant/après**     | Change l’ordre de la galerie.                                                                      |
| **Retirer de …**             | Retire l’élément de la galerie de cette personne. Comme toute modification, cela peut être annulé. |

## Regarder une photo ou un document

Cliquez sur un élément pour ouvrir la visionneuse :

<Screenshot name="media-viewer" alt="La visionneuse affichant la photo de mariage de Jan et Anna avec son titre, 1 sur 4, juin 1950, Łódź, les commandes de zoom en bas et la description en dessous" />

- **Zoomez** avec la molette de la souris, les boutons **+**/**−** ou un double-clic ; **faites
  glisser** pour vous déplacer ; le bouton à côté ajuste de nouveau l’image à la fenêtre.
- **←** et **→** (ou les flèches sur les côtés) passent à l’élément précédent ou suivant de la
  galerie.
- Les **documents PDF** s’ouvrent dans la visionneuse PDF intégrée, où vous pouvez les faire
  défiler, zoomer et y faire des recherches.
- Les boutons en haut permettent de **modifier les détails**, d’**ouvrir le fichier dans une autre
  application** (par exemple votre lecteur PDF) et d’**enregistrer une copie** du fichier où vous
  voulez.
- <kbd>Esc</kbd> ferme la visionneuse.

## Le décrire et l’afficher pour plusieurs personnes

**Modifier les détails…** (aussi dans la visionneuse) décrit l’élément et détermine **dans quelles
galeries** il apparaît :

<Screenshot name="media-details" alt="La fenêtre Photo ou document pour la photo de mariage : titre, date juin 1950, lieu Łódź, description, et Affiché pour : Jan Kowalski et Anna Kowalska avec Ajouter une personne… (1)" />

- **Titre**, **date** (les dates partielles et approximatives fonctionnent comme partout –
  [Dates](./editing#dates)), **lieu** et **description** – qui figure sur la photo, ce que dit le
  document. La visionneuse et la galerie les affichent.
- **Affiché pour** liste les personnes dont la galerie contient l’élément. Une photo de famille
  peut être affichée pour toutes les personnes qui y figurent : cliquez sur
  **Ajouter une personne…** (1) et choisissez-les. **×** la masque de nouveau pour une personne.
- **Enregistrer une copie…** exporte le fichier d’origine. **Supprimer de l’arbre** retire
  l’élément de toutes les galeries, sources et citations (on vous le demande d’abord s’il est
  utilisé quelque part).

## Numérisations de sources {#scans-of-sources}

La numérisation d’une page de registre ou d’un acte appartient à la [source](./sources) qu’elle
montre. Dans **☰ → Sources…**, sélectionnez une source et utilisez **Joindre…** sous
**Numérisations et photos** (1) ; dans la [fenêtre des citations](./sources#cite), chaque citation
peut aussi avoir ses propres numérisations. Cliquez sur une numérisation pour l’ouvrir dans la
visionneuse.

<Screenshot name="source-scans" alt="Le gestionnaire de sources avec le registre paroissial sélectionné et un PDF joint sous Numérisations et photos (1)" />

::: info Enregistrement et taille du fichier
Les images sont conservées dans leur qualité d’origine : un arbre contenant beaucoup de
numérisations grossit donc en conséquence – quelques centaines de mégaoctets ne posent aucun
problème et l’enregistrement reste rapide. Les exports CSV n’incluent pas les photos et les
documents.

:::
