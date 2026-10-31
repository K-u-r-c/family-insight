---
description: 'Exporter votre arbre généalogique dans un fichier CSV qui s’ouvre correctement dans Excel, LibreOffice Calc et Google Sheets.'
---

# Exporter en CSV

Choisissez **☰ → Exporter en CSV…** (ou **Fichier → Exporter → CSV…** dans la barre de menus) :

<Screenshot name="csv-export" alt="La boîte de dialogue Exporter en CSV avec le séparateur de colonnes (virgule ou point-virgule) et les noms des colonnes (English, Polski, Deutsch, Français, Español, Italiano, Português ou Русский)" />

1. **Séparateur de colonnes** – **Point-virgule** pour Excel avec des paramètres régionaux qui
   utilisent la virgule décimale (français, allemand, polonais, espagnol, italien, portugais,
   russe …), sinon tout se retrouve dans une seule colonne ; **Virgule** pour la plupart des autres
   logiciels. La valeur par défaut suit la langue du logiciel (le point-virgule en français), et
   Family Insight mémorise votre choix.
2. **Noms des colonnes** – dans l’une des langues du logiciel : français (`prenoms`, `nom` …),
   anglais (`given_names`, `surname` …), allemand (`vornamen`, `nachname` …) et ainsi de suite. Les
   valeurs suivent les noms des colonnes (`femme`, `oui` / `non` en français ; `female`,
   `true` / `false` en anglais).
3. Cliquez sur **Exporter…** et choisissez où enregistrer le fichier. Un message avec
   **Afficher dans le dossier** apparaît une fois l’export terminé.

Le fichier est encodé en UTF-8 avec une marque d’ordre des octets (BOM) : les lettres accentuées
(é, è, ç, ô, œ …) s’affichent donc correctement quand vous l’ouvrez d’un double-clic dans Excel.

## Ce qui est exporté

Une ligne par personne, triée par date de naissance, avec les colonnes suivantes : id, prénoms, nom,
nom de naissance, sexe, date et lieu de naissance, date et lieu de décès, en vie, père et mère (par
id), conjoints (id séparés par `|`) et notes. Les personnes reçoivent des id courts `p1`, `p2` … pour
que le fichier soit facile à lire et à modifier.

**Non exportés :** les photos, les dates et lieux des unions, les liens adoptifs, par alliance et
d’accueil, la personne de référence et l’affichage. Gardez le fichier `.finsight` comme copie
principale – le CSV sert à travailler avec des tableurs.

Vous pouvez modifier le fichier et le [réimporter](./csv-import). Le format exact est décrit dans la
[référence du format CSV](/developer/reference/csv-format) (en anglais).

## Ouvrir le fichier dans un tableur

| Logiciel         | Conseil                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Microsoft Excel  | Double-cliquez sur le fichier. Si toutes les données sont dans la colonne A, exportez à nouveau avec le séparateur **point-virgule**. |
| LibreOffice Calc | Ouvrez le fichier ; dans la fenêtre d’importation, choisissez **UTF-8** et le séparateur utilisé à l’export.                          |
| Google Sheets    | **Fichier → Importer → Importer** ; le séparateur est détecté automatiquement.                                                        |
