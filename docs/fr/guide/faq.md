---
description: 'Questions fréquentes sur Family Insight : confidentialité, utilisation hors ligne, taille des fichiers, GEDCOM, partage et impression.'
---

# Questions fréquentes

## Family Insight est-il gratuit ?

Oui. Il est gratuit et open source (licence MIT), sans publicité, sans compte ni abonnement.

## Où sont mes données ? Partent-elles sur Internet ?

Votre arbre se trouve dans le fichier `.finsight` que vous avez enregistré – nulle part ailleurs.
Family Insight fonctionne entièrement **hors ligne** et n’envoie jamais vos données nulle part. Une
fois par jour, il demande à GitHub si une nouvelle version est disponible
([mises à jour](./updates), désactivable). Sinon, il ne se connecte que lorsque vous le lui
demandez : un lien comme **Aide → Guide d’utilisation** ouvre votre navigateur web, et si vous
autorisez la [recherche de lieux en ligne](./places#lookup), **Rechercher en ligne** envoie le nom
de ce seul lieu – et rien d’autre – à OpenStreetMap ; si vous autorisez les
[cartes en ligne](./map#online), la carte télécharge son fond (uniquement la zone de la carte,
jamais vos données).

## Comment sauvegarder mon arbre ?

Copiez le fichier `.finsight` sur une clé USB, un disque externe ou un dossier dans un cloud en
lequel vous avez confiance. Family Insight conserve aussi automatiquement les cinq dernières
versions à côté du fichier ([copies de sauvegarde](./files#backups)).

## Quelle taille un arbre peut-il atteindre ? Les photos le rendent-elles énorme ?

Les arbres d’un millier de personnes et plus fonctionnent sans problème. Les portraits sont réduits
à 512 × 512 pixels quand vous les ajoutez : chacun n’ajoute donc que quelques dizaines de
kilo-octets – un arbre avec quelques centaines de portraits ne pèse que quelques mégaoctets et
s’envoie facilement par e-mail. Les images ne sont enregistrées qu’une fois dans le fichier, quel
que soit le nombre de fois où elles sont utilisées, et l’enregistrement reste rapide même quand le
fichier atteint des centaines de mégaoctets.

## Puis-je ouvrir un arbre venant d’un autre logiciel de généalogie (GEDCOM) ?

Oui. Exportez un fichier GEDCOM depuis l’autre logiciel (Gramps, MyHeritage, Ancestry, Legacy …) et
utilisez **☰ → Importer un GEDCOM…** – voir [GEDCOM](./gedcom). De la même façon, vous pouvez
exporter votre arbre pour d’autres logiciels. Les données d’un tableur peuvent être importées via
le [CSV](./csv-import).

## Comment partager l’arbre avec ma famille ?

- Envoyez-leur le fichier `.finsight` – avec Family Insight, ils pourront l’ouvrir, l’explorer et le
  compléter.
- Envoyez un **PDF ou une image** de l’arbre aux personnes qui n’ont pas le logiciel
  ([Images, PDF et impression](./export-print)).
- Envoyez un fichier **CSV** s’ils veulent utiliser un tableur ([Exporter en CSV](./csv-export)).

Family Insight ne fusionne pas les modifications : mettez-vous d’accord sur la personne qui garde la
copie principale.

## Plusieurs personnes peuvent-elles modifier un arbre en même temps ?

Non. Gardez une copie principale et transmettez-la, ou rassemblez les ajouts dans un tableur et
importez-les dans l’arbre actuel.

## Comment imprimer un grand arbre ?

Imprimez-le par parties (ascendance ou descendance d’une personne, quelques générations), utilisez
du papier A3, ou exportez un grand PNG ou SVG pour un imprimeur. Voir
[Conseils pour les grands arbres](./export-print#large-trees).

## Puis-je noter des adoptions, des familles recomposées et des divorces ?

Oui – voir [Relations](./relationships).

## Existe-t-il une version pour téléphone ?

Non, Family Insight est un logiciel de bureau pour Windows, macOS et Linux.

## Puis-je ajouter une autre langue ?

Le logiciel est prêt à accueillir d’autres langues ; les traducteurs sont les bienvenus – voir
[Add a language](/developer/howto/language) dans la documentation pour les développeurs (en
anglais).
