---
description: Registre eventos vitales – bautismo, estudios, trabajos, mudanzas, servicio militar, entierro y sus propios eventos – con fechas, períodos y lugares.
---

# Eventos vitales

Además del nacimiento y la defunción, una vida está llena de otros momentos que merece la pena
registrar: un bautismo, el colegio y la universidad, los trabajos, la mudanza a otra ciudad u otro
país, el servicio militar, un entierro. Family Insight los llama **eventos vitales**.

## Añadir un evento

1. Seleccione la persona y haga clic en **Editar**.
2. Desplácese hasta **Eventos vitales** y haga clic en **Añadir evento**.
3. Elija el tipo de evento. Están agrupados en religiosos; trabajo, estudios y servicio; mudanzas y
   residencia; y otros:

<Screenshot name="events-menu" alt="El menú Añadir evento con los tipos de evento agrupados en Religiosos, Trabajo, estudios y servicio, Mudanzas y residencia y Otros" />

El evento nuevo se abre al instante, con el cursor en el campo de la fecha.

## Rellenar los detalles

<Screenshot name="events-editor" alt="Los eventos vitales en el editor: Bautismo y Servicio militar; el servicio militar está abierto con el tipo, la fecha de inicio, la fecha de fin (3) y el lugar; botones para editar (1) y subir (2)" />

- **Tipo**: cambie el tipo de evento cuando quiera. Para **Otro evento**, escriba su propio nombre
  (por ejemplo, _Peregrinación_).
- **Fecha (o inicio)** y **Fecha de fin (opcional)**: una sola fecha o un período, como el
  servicio militar de 1914 a 1918. Las fechas funcionan igual que en el resto del programa:
  `1914`, `05/1914`, `~1914` ([más sobre las fechas](./editing#dates)).
- **Lugar**: las sugerencias proceden de los lugares que ya se usan en el árbol.
- **Descripción**: un dato breve, como la profesión, el colegio, el regimiento o el barco.
- **Notas**: cualquier otra cosa.

Cada campo se guarda al salir de él. Haga clic en el título de un evento o en el lápiz (1) para
abrirlo o cerrarlo.

## Ordenar y eliminar

- Las flechas (2) suben o bajan un evento. Se conserva el orden que elija; en la cronología de la
  persona, los eventos se ordenan por fecha de todos modos.
- La papelera quita un evento. Aparece un mensaje con **Deshacer** y, como cualquier cambio,
  también puede deshacerse con <kbd>Ctrl</kbd>+<kbd>Z</kbd>.

## Dónde aparecen los eventos

- **Detalles y cronología**: la lista **Vida** de la persona muestra los eventos con su icono, su
  fecha o período y su lugar, entre el nacimiento y la defunción. El entierro y la cremación van
  después de la defunción.

  <Screenshot name="events-details" alt="La cronología de la vida de Jan Kowalski: nacimiento, bautismo, servicio militar 1944–1945, estudios 1946–1951 y profesión 1951–1990" />

- **Búsqueda**: se puede buscar por los lugares y las descripciones de los eventos; busque
  _Hamburgo_ para encontrar a todas las personas que emigraron a través de Hamburgo.
- **Estadísticas**: los eventos vitales y los lugares de eventos más frecuentes, y cuántas personas
  aún no tienen eventos ([Estadísticas](./statistics)).

## Advertencias

Como las demás fechas, los eventos reciben avisos discretos cuando algo parece incorrecto; nunca le
bloquean:

- _Un evento de … tiene una fecha anterior a su nacimiento._
- _Un evento de … tiene una fecha posterior a su defunción._ (El entierro y la cremación no
  cuentan).
- _Este evento termina antes de empezar._

::: info CSV y versiones anteriores
Los eventos vitales se guardan en el archivo `.finsight`. Las exportaciones CSV contienen una fila
por persona y no incluyen los eventos. Desde la versión 1.1, los árboles se guardan en un formato
de archivo más reciente que tiene sitio para los eventos: Family Insight 1.0 no puede abrirlos y le
pide que actualice el programa.
:::
