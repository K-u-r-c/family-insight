---
description: Traslade árboles genealógicos entre Family Insight y otros programas de genealogía con GEDCOM; importe desde Gramps, MyHeritage, Ancestry o FamilySearch y exporte como GEDCOM 5.5.1 o 7.0.
---

# GEDCOM

**GEDCOM** es el formato de archivo que usan los programas de genealogía para intercambiar árboles
genealógicos. Family Insight lee archivos GEDCOM 5.5, 5.5.1 y 7.0 (`.ged`, y `.gdz` con las fotos
incluidas) y escribe 5.5.1 o 7.0.

## Importar un archivo GEDCOM

Elija **☰ → Importar GEDCOM…** (o **Archivo → Importar → GEDCOM…**, o **Importar desde GEDCOM…**
en la pantalla de bienvenida), o simplemente suelte un archivo `.ged` sobre la ventana. Se abre una
vista previa:

<Screenshot name="gedcom-import" alt="La ventana Importar GEDCOM: GEDCOM 5.5.1 de MyHeritage, el juego de caracteres UTF-8 (detectado), una advertencia sobre una fecha aproximada, las etiquetas que no se han importado y el resumen con personas, familias, eventos, fuentes y archivos multimedia" />

- La ventana muestra la **versión** y el **programa** que escribió el archivo, y cuántas personas,
  familias, eventos, fuentes y fotos contiene.
- **Juego de caracteres**: se detecta automáticamente (UTF-8, UTF-16, ANSEL, ANSI,
  Windows-1250, Windows-1251). Si letras como _ñ_, _á_, _ö_ o _ß_ se ven mal en el resultado, elija otro.
- Las **advertencias** explican lo que no se ha podido trasladar con exactitud, por ejemplo una
  fecha como _BET 1850 AND 1855_ o una fecha del calendario juliano. El texto original se conserva
  en las notas de la persona, para no perder nada.
- **No importado** enumera los detalles propios de otros programas para los que Family Insight no
  tiene cabida (números de registro, identificadores internos…), agrupados por etiqueta.
- Con un árbol abierto, puede importar en un **árbol nuevo** o **añadir al árbol abierto**. Añadir
  es un único paso que se puede deshacer.

Las fotos y los documentos a los que hace referencia el archivo se cargan desde donde indica el
archivo o, si el archivo procede de otro ordenador, desde la carpeta del archivo `.ged` y su
carpeta `media`. Un archivo `.gdz` los lleva dentro.

### Qué se conserva

Los nombres (incluidos los apellidos de nacimiento y de casada), el sexo, el nacimiento y la
defunción, los eventos vitales (bautismo, entierro, emigración, profesión, servicio militar…, y
eventos personalizados), las notas, las fuentes y los repositorios con sus citas (página,
fiabilidad, transcripción), las fotos y los documentos, los matrimonios, compromisos y divorcios,
los progenitores adoptivos, de acogida y por afinidad, y las coordenadas de los lugares.

### Si viene de otro programa

| Programa                                  | Cómo exportar un archivo GEDCOM                                                                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gramps**                                | **Árboles genealógicos → Exportar…**, elija _GEDCOM_.                                                                                                      |
| **MyHeritage**                            | Family Tree Builder: **Archivo → Exportar a GEDCOM**; en el sitio web: **Árbol genealógico → Administrar árboles → Exportar a GEDCOM**.                    |
| **Ancestry**                              | **Trees → (su árbol) → Tree settings → Export tree**.                                                                                                      |
| **FamilySearch**                          | FamilySearch no exporta todo el árbol compartido; exporte sus propios árboles con programas asociados o empiece con un GEDCOM que alguien haya compartido. |
| **Legacy, RootsMagic, Family Tree Maker** | **File → Export → GEDCOM**.                                                                                                                                |

## Exportar un archivo GEDCOM

Elija **☰ → Exportar GEDCOM…** (o **Archivo → Exportar → GEDCOM…**):

<Screenshot name="gedcom-export" alt="La ventana Exportar GEDCOM con la versión GEDCOM 5.5.1 o 7.0, Incluir fotos y documentos, Ocultar a las personas vivas e Incluir notas" />

- **Versión**: **5.5.1** lo leen casi todos los programas de genealogía; **7.0** es la versión más
  reciente.
- **Incluir fotos y documentos**: con 5.5.1 se guardan en una carpeta `media` junto al archivo
  GEDCOM; con 7.0 todo se empaqueta en un único archivo `.gdz`.
- **Ocultar a las personas vivas**: sustituye los nombres de las personas que pueden estar vivas
  por «Con vida» y omite sus datos. Úselo cuando comparta su árbol con otras personas.
- **Incluir notas**: déjelo desactivado para compartir solo los datos.

::: info Lo que GEDCOM no puede guardar
Si alguien vive (solo se registra la defunción), la dirección web de una fuente (pasa a ser una
línea en las notas de la fuente) y la configuración de la vista de su árbol. Todo lo demás se
recupera al volver a importar el archivo en Family Insight.
:::
