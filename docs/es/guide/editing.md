---
description: Edite una persona – nombres y apellidos de nacimiento, fechas incompletas y aproximadas, lugares, estado vital, foto y notas.
---

# Editar una persona

Seleccione una persona y haga clic en **Editar** en el panel de detalles, o haga doble clic en su
tarjeta, o selecciónela y pulse <kbd>Enter</kbd>. El panel pasa a mostrar el editor:

<Screenshot name="person-editor" alt="El editor de Piotr Kowalski con la foto, los nombres, el sexo y la fecha de nacimiento" />

Cada campo se guarda en cuanto sale de él (con <kbd>Tab</kbd> o haciendo clic en otro sitio);
<kbd>Esc</kbd> deshace lo que ha escrito en el campo actual. Haga clic en **Listo** para volver a
los detalles.

## Nombres

- **Nombres**: todos los nombres de pila, por ejemplo `Anna Maria`.
- **Apellidos**: los apellidos actuales.
- **Apellidos de nacimiento**: los apellidos al nacer (de soltera). Haga clic en **Añadir apellidos
  de nacimiento** para mostrar el campo. En el árbol aparecen como «nac. Wiśniewska».
- **Sexo**: mujer, hombre, otro o desconocido. Determina el color de la tarjeta y ayuda al añadir
  familiares.

::: tip Nombres de otros países {#name-conventions}

- **Español y portugués**: los dos apellidos van en el campo de apellidos: `García Márquez`,
  `Santos Silva`.
- **Ruso, ucraniano, bielorruso**: escriba el patronímico con los nombres: nombres
  `Иван Петрович`, apellidos `Иванов`.
- **Partículas** como von, van, de, da, dos o di forman parte de los apellidos (`van der Berg`);
  al ordenar, la lista las omite.

:::

## Fechas {#dates}

Los registros antiguos rara vez son precisos, así que las fechas pueden ser incompletas o
aproximadas. Escriba la fecha en el campo; la línea de debajo muestra cómo la ha interpretado
Family Insight.

<Screenshot name="date-field" alt="El campo de la fecha de nacimiento con el texto ~1955 (1) y la lista de precisión (2)" />

| Lo que escribe                           | Significado   | Se muestra en español | Se muestra en inglés |
| ---------------------------------------- | ------------- | --------------------- | -------------------- |
| `1890`                                   | solo el año   | 1890                  | 1890                 |
| `05/1890` o `1890-05`                    | mes y año     | mayo de 1890          | May 1890             |
| `12/05/1890` o `1890-05-12`              | un día exacto | 12 de mayo de 1890    | 12 May 1890          |
| `12.05.1890`                             | un día exacto | 12 de mayo de 1890    | 12 May 1890          |
| `mayo de 1890`, `mayo 1890`, `May 1890`  | mes y año     | mayo de 1890          | May 1890             |
| `12 de mayo de 1890`, `12 May 1890`      | un día exacto | 12 de mayo de 1890    | 12 May 1890          |
| `~1890`, `hacia 1890`, `about 1890`      | aproximada    | hacia 1890            | about 1890           |
| `<1890`, `antes de 1890`, `before 1890`  | antes de      | antes de 1890         | before 1890          |
| `>1890`, `después de 1890`, `after 1890` | después de    | después de 1890       | after 1890           |

Los nombres de los meses y palabras como _hacia_ o _antes de_ pueden escribirse en cualquiera de
los idiomas del programa y en sus distintas formas (`12 maja 1890`, `12. Mai 1890`,
`1er mai 1890`, `12 May 1890`, `около 1890`), también abreviados (`sept. 1890`). También se
aceptan `cerca de 1890`, `alrededor de 1890` y `h. 1890`.

Conviene saber:

- Con puntos y barras, el día va primero: `05/06/1890` es el **5 de junio** de 1890. (Solo con el
  programa en inglés se lee `05/23/1890` como 23 de mayo, porque no puede ser una fecha con el día
  primero).
- La **lista de precisión** junto al campo (**Exactamente**, **Hacia**, **Antes de**,
  **Después de**) hace lo mismo que escribir `~`, `<` o `>`.
- También funcionan `abt`, `bef`, `aft`, `circa` y `ca.`, las abreviaturas habituales en
  genealogía.
- Una fecha que no se puede interpretar se muestra en rojo con un ejemplo de lo que funciona; no se
  guarda hasta que se corrige.
- Las edades se calculan a partir de las fechas. Si una fecha es incompleta o aproximada, la edad
  se muestra como «aprox. …».

## Lugares

Escriba la ciudad o el pueblo de nacimiento y de defunción. Mientras escribe, se sugieren los
lugares que ya ha usado en el árbol, para que el mismo lugar se escriba siempre igual; así también
son más útiles las [estadísticas](./statistics) y la [búsqueda](./search).

## Estado vital {#life-status}

Elija **Vive**, **Ha fallecido** o **Se desconoce**. Para las personas vivas se ocultan la fecha y
el lugar de defunción. Si introduce una fecha o un lugar de defunción mientras el estado es
desconocido, la persona se considera fallecida.

## Foto {#photo}

Haga clic en **Añadir foto…** y elija una imagen, o suelte un archivo de imagen sobre el círculo
reservado para la foto. Los formatos admitidos son **JPG, PNG y WebP** de hasta 20 MB (las fotos
HEIC de iPhone deben convertirse antes). Se abre una ventana de recorte: arrastre la imagen para
colocar la cara, amplíe con el control deslizante y haga clic en **Usar foto**.

<Screenshot name="photo-crop" alt="El cuadro de diálogo Recortar la foto con un marco redondo, un control deslizante de ampliación y el botón Usar foto" />

La foto se guarda **dentro del archivo `.finsight`** (reducida a 512 × 512 píxeles), de modo que
el árbol sigue siendo un único archivo que puede copiar a cualquier sitio. Use **Cambiar…** o
**Quitar** debajo de la foto para sustituirla o eliminarla. Una imagen de la galería de la persona
también puede convertirse en su retrato (**⋯ → Usar como retrato…**; consulte
[Fotos y documentos](./media)).

## Eventos vitales

El bautismo, los estudios, los trabajos, las mudanzas, el servicio militar, el entierro… se
registran en la sección **Eventos vitales** del editor. Consulte [Eventos vitales](./events).

## Fuentes

El pequeño botón de fuente junto a **Nombre**, **Nacimiento**, **Vida** y cada evento vital
registra de dónde procede un dato. Consulte [Fuentes](./sources).

## Notas

Todo lo que merezca la pena recordar: la profesión, historias, dónde se guarda un documento. Las
notas se muestran en el panel de detalles y se incluyen en las
[exportaciones CSV](./csv-export).

## Advertencias {#warnings}

Family Insight avisa de los datos que probablemente sean un error, pero nunca le impide
guardarlos:

| Advertencia                                              | Cuándo                                               |
| -------------------------------------------------------- | ---------------------------------------------------- |
| _La fecha de defunción es anterior a la de nacimiento._  | la fecha de defunción es anterior a la de nacimiento |
| _Según esto, … tendría … años. ¿Es correcta la fecha?_   | la persona tendría más de 120 años                   |
| _… nació después que …, pero figura como su progenitor._ | un progenitor biológico no es mayor que el hijo      |
