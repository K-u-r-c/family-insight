---
description: Exporte su árbol genealógico a una hoja de cálculo CSV que se abre correctamente en Excel, LibreOffice Calc y Google Sheets.
---

# Exportar a CSV

Elija **☰ → Exportar CSV…** (o **Archivo → Exportar → CSV…** en la barra de menús):

<Screenshot name="csv-export" alt="El diálogo Exportar a CSV con el separador de columnas (coma o punto y coma) y los nombres de las columnas (English, Polski, Deutsch, Français, Español, Italiano, Português o Русский)" />

1. **Separador de columnas**: **Coma** para la mayoría de los programas; **Punto y coma** para
   Excel con una configuración regional que usa la coma decimal (la de muchos países de habla
   hispana, pero también la polaca, alemana, francesa, italiana, portuguesa, rusa…), que de lo
   contrario pone todo en una sola columna. El valor predeterminado depende del idioma del
   programa (en español, punto y coma), y Family Insight recuerda su elección.
2. **Nombres de las columnas**: en uno de los idiomas del programa: español (`nombres`,
   `apellidos` …), inglés (`given_names`, `surname` …), polaco (`imiona`, `nazwisko` …), etc. Los
   valores siguen a los nombres de las columnas (`mujer`, `sí` / `no` en español; `female`,
   `true` / `false` en inglés).
3. Haga clic en **Exportar…** y elija dónde guardar el archivo. Cuando termine, aparecerá un
   mensaje con **Mostrar en la carpeta**.

El archivo usa UTF-8 con marca de orden de bytes, de modo que las letras con tilde y la eñe (á, é,
í, ó, ú, ü, ñ …) se ven correctamente al abrirlo con doble clic en Excel.

## Qué se exporta

Una fila por persona, ordenadas por fecha de nacimiento, con estas columnas: id, nombres,
apellidos, apellidos de nacimiento, sexo, fecha y lugar de nacimiento, fecha y lugar de defunción,
si vive, padre y madre (por id), parejas (id separados por `|`) y notas. Las personas reciben id
cortos, `p1`, `p2` …, para que el archivo sea fácil de leer y editar.

**No se exportan:** las fotos, las fechas y los lugares de las relaciones de pareja, los vínculos
adoptivos, por afinidad y de acogida, la persona principal ni la vista. Conserve el archivo
`.finsight` como copia principal: CSV sirve para trabajar con hojas de cálculo.

Puede editar el archivo y [volver a importarlo](./csv-import). El formato exacto se describe en la
[referencia del formato CSV](/developer/reference/csv-format).

## Abrir el archivo en una hoja de cálculo

| Programa         | Consejo                                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Microsoft Excel  | Haga doble clic en el archivo. Si todos los datos están en la columna A, vuelva a exportar con el otro separador (**punto y coma** o **coma**). |
| LibreOffice Calc | Abra el archivo; en la ventana de importación, elija **UTF-8** y el separador con el que exportó.                                               |
| Google Sheets    | **Archivo → Importar → Subir**; el separador se detecta automáticamente.                                                                        |
