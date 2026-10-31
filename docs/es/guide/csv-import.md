---
description: 'Importe un árbol genealógico desde Excel, LibreOffice o Google Sheets: prepare la hoja, revise la vista previa y corrija los errores habituales.'
---

# Importar desde CSV

¿Ya tiene a su familia en una hoja de cálculo? Family Insight puede leerla desde un archivo
**CSV**, el formato que cualquier programa de hojas de cálculo sabe guardar.

## 1. Prepare la hoja de cálculo

Use **una fila por persona** y estas columnas (en cualquier orden, con nombres en inglés o en
español):

| Columna                      | Nombre en español                           | Qué escribir                                                               |
| ---------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `id` **(obligatoria)**       | `id`                                        | cualquier etiqueta breve y única para la persona, por ejemplo `p1`, `p2` … |
| `given_names`                | `nombres`                                   | nombres                                                                    |
| `surname`                    | `apellidos`                                 | apellidos                                                                  |
| `birth_surname`              | `apellidos_de_nacimiento`                   | apellidos de nacimiento (de soltera)                                       |
| `sex`                        | `sexo`                                      | `mujer` / `hombre` (o `F`, `M`, `female`, `male`)                          |
| `birth_date`, `death_date`   | `fecha_de_nacimiento`, `fecha_de_defuncion` | `1890`, `05/1890`, `12/05/1890`, `~1890` … ([fechas](./editing#dates))     |
| `birth_place`, `death_place` | `lugar_de_nacimiento`, `lugar_de_defuncion` | la ciudad o el pueblo                                                      |
| `living`                     | `vivo`                                      | `sí` / `no` (o `yes` / `no`)                                               |
| `father_id`, `mother_id`     | `padre_id`, `madre_id`                      | el **id** del padre y de la madre                                          |
| `partner_ids`                | `parejas_id`                                | los **id** de las parejas, separados por `\|`, por ejemplo `p2\|p5`        |
| `notes`                      | `notas`                                     | cualquier otra cosa                                                        |

También funcionan los nombres de columna y los valores en **polaco, alemán, francés, italiano,
portugués y ruso** (por ejemplo `imiona`, `vornamen`, `nom`, `фамилия`; `kobieta`, `männlich`,
`oui`, `да`): todos los nombres figuran en la [referencia del formato CSV](/developer/reference/csv-format#columns).
Para patronímicos y apellidos compuestos, consulte [nombres de otros países](./editing#name-conventions).

Cada persona necesita un **id** y al menos un nombre o unos apellidos; las demás columnas son
opcionales. Los familiares se conectan mediante los id: por ejemplo, `p3` con `padre_id` `p1` y
`madre_id` `p2` es hijo o hija de `p1` y `p2`. Basta con indicar una relación de pareja en una
de las dos personas.

::: tip Empiece con un ejemplo
Descargue un ejemplo con 25 personas, [con nombres de columna en inglés](/samples/example-en.csv) o
[con nombres de columna en polaco](/samples/example-pl.csv), o bien una plantilla vacía desde
Family Insight: **Ayuda → Descargar plantilla CSV…**. La especificación completa está en la
[referencia del formato CSV](/developer/reference/csv-format).
:::

## 2. Guárdela como CSV

| Programa         | Cómo                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Microsoft Excel  | **Archivo → Guardar como**, tipo **CSV UTF-8 (delimitado por comas) (\*.csv)**                 |
| LibreOffice Calc | **Archivo → Guardar como**, tipo **Texto CSV (.csv)**, juego de caracteres **Unicode (UTF-8)** |
| Google Sheets    | **Archivo → Descargar → Valores separados por comas (.csv)**                                   |

Funcionan como separadores las comas, los puntos y coma y los tabuladores. También funcionan los
archivos que no se guardaron en UTF-8 (el tipo **CSV** simple de las versiones antiguas de Excel):
Family Insight reconoce por sus letras el texto de Europa occidental (Windows-1252), que es el
habitual en español, el de Europa central (Windows-1250) y el cirílico (Windows-1251).

## 3. Importe

En la pantalla de bienvenida, haga clic en **Importar desde CSV…** o, con un árbol abierto, elija
**☰ → Importar CSV…**. También puede arrastrar el archivo `.csv` a la ventana. Antes de que cambie
nada, verá una vista previa:

<Screenshot name="csv-import" alt="La vista previa de la importación: el separador y la codificación detectados, las columnas con la forma en que se importa cada una, una vista previa de las primeras filas y el botón Importar" />

- Arriba: el **separador y la codificación del texto** que se han detectado.
- **Juego de caracteres**: si letras como ñ, á, ö o ж se ven mal en la vista previa, elija otro
  aquí (se muestra para los archivos leídos del disco; el detectado aparece marcado).
- **Columnas**: cómo se usará cada columna de su archivo. Si no se ha reconocido una columna (por
  ejemplo, porque se llama «Nombre de pila»), elija el significado correcto en la lista, o
  **No importar** para omitirla.
- **Vista previa**: las primeras filas tal como las ha entendido Family Insight.
- Abajo: cuántas personas y relaciones se importarán.

<Screenshot name="csv-import-columns" alt="La tabla Columnas: columna del archivo, se importa como (una lista) y el valor de la primera fila" />

Si ya hay un árbol abierto, elija si quiere importar en **Un árbol nuevo** o en **El árbol actual**.
Al importar en el árbol actual se añaden todas las personas del archivo como personas nuevas (no se
emparejan con las que ya están en el árbol), en un único paso que puede [deshacer](./undo).

Haga clic en **Importar**. Un árbol nuevo creado a partir de un CSV aún no tiene archivo:
[guárdelo](./files) para conservarlo.

## Problemas y advertencias {#problems}

Los **problemas** (en rojo) deben corregirse antes de importar: corríjalos en su hoja de cálculo
(o cambie la asignación de columnas) y vuelva a importar. Las **advertencias** (en amarillo)
explican lo que va a pasar; puede importar de todos modos. Cada mensaje indica a qué fila se
refiere.

<Screenshot name="csv-import-errors" alt="La vista previa de la importación con 2 problemas: Fila 4: el id p2 se usa más de una vez; Fila 5: hace referencia a p9, pero no hay ninguna fila con ese id" />

### Problemas que impiden la importación

| Mensaje                                                               | Cómo corregirlo                                                                                           |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| _El archivo está vacío._                                              | Elija el archivo correcto o compruebe que la hoja se guardó con datos.                                    |
| _El archivo no tiene la columna «id»…_                                | Añada una columna `id` con una etiqueta única para cada persona.                                          |
| _El archivo no tiene columnas de nombre («given_names» o «surname»)._ | Añada una columna `given_names` o `surname` (o `nombres`, `apellidos`), o asígnele una columna existente. |
| _Esta fila no tiene id._                                              | Rellene el id en esa fila.                                                                                |
| _El id «p2» se usa más de una vez._                                   | Dé a cada persona un id distinto.                                                                         |
| _La persona «p7» no tiene ni nombre ni apellidos._                    | Rellene al menos un nombre (o elimine la fila vacía).                                                     |
| _Hace referencia a «p9», pero no hay ninguna fila con ese id._        | Corrija el id en `padre_id`, `madre_id` o `parejas_id`, o añada a esa persona.                            |
| _La persona hace referencia a sí misma («p3»)._                       | Una persona no puede ser su propio progenitor ni su propia pareja: corrija el id.                         |
| _El padre y la madre son la misma persona («p1»)._                    | Corrija `padre_id` o `madre_id`.                                                                          |
| _… sería su propio ascendiente._                                      | En algún lugar figura un hijo como progenitor de su propio ascendiente: revise los id.                    |

### Advertencias

| Mensaje                                                                                                    | Qué ocurre                                                                        |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| _No se reconoce la columna «…»; se ignorará._                                                              | Se omite la columna: asígnela a un campo si la necesita.                          |
| _«…» no es una fecha que podamos interpretar; se ha añadido a las notas._                                  | El texto se conserva en las notas de la persona, para no perder nada.             |
| _«…» no es un sexo conocido; se ha importado como desconocido._                                            | Use `mujer`, `hombre`, `otro` o `desconocido` (o las palabras en inglés).         |
| _«…» no es sí/no; no se indica si la persona vive._                                                        | Use `sí`/`no`, `yes`/`no`, `true`/`false` o `1`/`0`.                              |
| Advertencias de fechas (defunción antes del nacimiento, más de 120 años, progenitor más joven que su hijo) | Se importan tal como están escritas: consulte [Advertencias](./editing#warnings). |

## Lo que CSV no puede guardar

CSV conserva nombres, fechas, lugares, si la persona vive, progenitores biológicos, parejas y
notas. **Las fotos, las fechas y los lugares de las relaciones de pareja, los vínculos adoptivos,
por afinidad y de acogida, la persona principal y la vista** solo existen en los archivos
`.finsight`: úselos para conservarlo todo.
