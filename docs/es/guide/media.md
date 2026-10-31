---
description: Guarde las fotos y los documentos escaneados junto a las personas a las que pertenecen – galería, visor, PDF, fotos de familia en varias personas y escaneos de fuentes.
---

# Fotos y documentos

Cada persona puede tener una **galería** de fotos y documentos escaneados: fotos de boda,
certificados, cartas, archivos PDF de un archivo histórico. Se guardan **dentro del archivo
`.finsight`**, de modo que el árbol sigue siendo un único archivo que puede copiar a cualquier
sitio, y una imagen usada para varias personas se guarda solo una vez.

## Añadir fotos y documentos

1. Seleccione la persona. Los detalles muestran **Fotos y documentos** debajo de las notas.
2. Haga clic en **Añadir…** (1) y elija uno o varios archivos, o arrástrelos desde su gestor de
   archivos a la sección.

<Screenshot name="media-gallery" alt="Los detalles de Jan Kowalski con la sección Fotos y documentos: Añadir… (1) y cuatro elementos – una foto de boda, la casa familiar, una carta y una partida de nacimiento en PDF –, cada uno con un menú ⋯ (2)" />

Se admiten archivos **JPG, PNG, WebP, GIF** y **PDF** de hasta **25 MB** cada uno. Family Insight
comprueba qué es realmente un archivo, no solo su nombre. Las imágenes reciben una pequeña vista
previa; los PDF muestran un icono de documento.

Cada elemento tiene un menú **⋯** (2):

| Opción del menú         | Qué hace                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **Editar detalles…**    | Título, fecha, lugar y descripción; vea más abajo.                                        |
| **Usar como retrato…**  | Abre el [recorte de la foto](./editing#photo); la imagen recortada pasa a ser el retrato. |
| **Mover antes/después** | Cambia el orden de la galería.                                                            |
| **Quitar de …**         | Saca el elemento de la galería de esta persona. Como cualquier cambio, se puede deshacer. |

## Ver una foto o un documento

Haga clic en un elemento para abrir el visor:

<Screenshot name="media-viewer" alt="El visor con la foto de boda de Jan y Anna, su título, 1 de 4, junio de 1950, Łódź, los controles de ampliación abajo y la descripción debajo" />

- **Amplíe** con la rueda del ratón, los botones **+**/**−** o con un doble clic; **arrastre** para
  desplazarse; el botón que hay junto a ellos vuelve a ajustar la imagen a la ventana.
- **←** y **→** (o las flechas de los lados) pasan al elemento anterior y siguiente de la galería.
- **Los documentos PDF** se abren en el visor de PDF integrado, donde puede desplazarse, ampliarlos y
  buscar en ellos.
- Los botones de la parte superior sirven para **editar los detalles**, **abrir el archivo en otra
  aplicación** (por ejemplo, su lector de PDF) y **guardar una copia** del archivo donde quiera.
- <kbd>Esc</kbd> cierra el visor.

## Describirlo y mostrarlo en varias personas

**Editar detalles…** (también en el visor) describe el elemento y decide **en qué galerías** aparece:

<Screenshot name="media-details" alt="La ventana Foto o documento de la foto de boda: título, fecha junio de 1950, lugar Łódź, descripción y Se muestra en: Jan Kowalski y Anna Kowalska, con Añadir persona… (1)" />

- **Título**, **fecha** (las fechas parciales y aproximadas funcionan como en todas partes:
  [Fechas](./editing#dates)), **lugar** y **descripción**: quién aparece en la imagen, qué dice el
  documento. El visor y la galería los muestran.
- **Se muestra en** enumera las personas en cuya galería está el elemento. Una foto de familia puede
  mostrarse en todas las personas que aparecen en ella: haga clic en **Añadir persona…** (1) y
  elíjalas. **×** vuelve a ocultarla de una persona.
- **Guardar una copia…** exporta el archivo original. **Eliminar del árbol** quita el elemento de
  todas las galerías, fuentes y citas (si se usa en algún sitio, se le pregunta antes).

## Escaneos de fuentes {#scans-of-sources}

El escaneo de una página de un registro o de un certificado pertenece a la [fuente](./sources) que
muestra. En **☰ → Fuentes…**, seleccione una fuente y use **Adjuntar…** en **Escaneos y fotos** (1);
en la [ventana de citas](./sources#cite) cada cita también puede tener sus propios escaneos.
Haga clic en un escaneo para abrirlo en el visor.

<Screenshot name="source-scans" alt="El gestor de fuentes con el libro parroquial seleccionado y un PDF adjunto en Escaneos y fotos (1)" />

::: info Guardado y tamaño del archivo
Las imágenes se conservan con su calidad original, así que un árbol con muchos escaneos crece en
proporción; unos cientos de megabytes no son ningún problema y el guardado sigue siendo rápido. Las
exportaciones a CSV no incluyen fotos ni documentos.
:::
