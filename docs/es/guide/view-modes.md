---
description: Muestre a toda la familia o céntrese en los ascendientes, los descendientes o ambos de una persona, con un límite de generaciones.
---

# Modos de vista

Los botones de **modo de vista** de la barra de herramientas deciden a quién se muestra en el árbol:

<Screenshot name="view-controls" alt="Los cuatro botones de modo de vista: 1 Familia, 2 Ascendientes, 3 Descendientes, 4 Reloj de arena" />

1. **Familia**: todas las personas del árbol.
2. **Ascendientes**: una persona, sus padres, sus abuelos, etc.
3. **Descendientes**: una persona, sus hijos, sus nietos, etc. (con sus parejas).
4. **Reloj de arena**: los ascendientes y los descendientes de una persona a la vez.

(Si la ventana es ancha, los botones también muestran su nombre). Las mismas opciones están en el
menú **Ver** de la barra de menús.

## ¿Los ascendientes de quién? {#root-person}

Las vistas de ascendientes, descendientes y reloj de arena parten de la **persona principal**,
marcada con una casita (🏠) en su tarjeta. Si el árbol no tiene persona principal, parten de la
persona **seleccionada**.

Para convertir a alguien en la persona principal, haga clic con el botón derecho en su tarjeta y
elija **Establecer como persona principal**. El mismo menú ofrece **Quitar como persona principal**.
En la [familia de ejemplo](./sample-family), la persona principal es Jan Kowalski.

### Ascendientes

<Screenshot name="view-ancestors" alt="La vista de ascendientes de Lena Kowalska: sus padres, abuelos y bisabuelos encima de ella" />

### Descendientes

<Screenshot name="view-descendants" alt="La vista de descendientes de Jan Kowalski con sus hijos, nietos y bisnietos" />

### Reloj de arena

<Screenshot name="view-hourglass" alt="La vista de reloj de arena de Jakub Kowalski con sus ascendientes arriba y su hija abajo" />

## ¿Cuántas generaciones? {#generations}

En las vistas de ascendientes, descendientes y reloj de arena, una lista junto a los botones indica
cuántas generaciones se muestran: desde **1 generación** hasta **Todas las generaciones**. Con menos
generaciones, los árboles grandes son más fáciles de leer e imprimir.

## Se guarda con el archivo

El modo de vista, el número de generaciones y las [ramas contraídas](./navigation#collapse) se
guardan en el archivo `.finsight` y se restauran la próxima vez que lo abra. Cambiar la vista no es
una edición, así que no aparece en [deshacer](./undo).
