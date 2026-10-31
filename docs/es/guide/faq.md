---
description: 'Preguntas frecuentes sobre Family Insight: privacidad, uso sin conexión, tamaño de los archivos, GEDCOM, compartir e imprimir.'
---

# Preguntas frecuentes

## ¿Family Insight es gratuito?

Sí. Es gratuito y de código abierto (licencia MIT), sin anuncios, cuentas ni suscripciones.

## ¿Dónde están mis datos? ¿Se envían a internet?

Su árbol está en el archivo `.finsight` que ha guardado y en ningún otro sitio. Family Insight
funciona completamente **sin conexión** y nunca envía sus datos a ninguna parte. Una vez al día
pregunta a GitHub si hay una nueva versión disponible ([actualizaciones](./updates); se puede
desactivar). Por lo demás, solo se conecta a internet cuando usted se lo pide: un enlace como
**Ayuda → Guía del usuario** abre su navegador web y, si permite la
[búsqueda de lugares en internet](./places#lookup), **Buscar en internet** envía el nombre de ese
lugar (y nada más) a OpenStreetMap; si permite los [mapas de internet](./map#online), el mapa
descarga su fondo (solo la zona del mapa, nunca sus datos).

## ¿Cómo hago una copia de seguridad de mi árbol?

Copie el archivo `.finsight` en una memoria USB, un disco externo o una carpeta en la nube de su
confianza. Además, Family Insight guarda automáticamente las cinco últimas versiones junto al
archivo ([copias de seguridad](./files#backups)).

## ¿Qué tamaño puede tener un árbol? ¿Las fotos lo hacen enorme?

Los árboles con mil personas o más funcionan con fluidez. Los retratos se reducen a 512 × 512
píxeles al añadirlos, así que cada uno ocupa solo unas decenas de kilobytes: un árbol con unos
cientos de retratos se queda en unos pocos megabytes y se puede enviar fácilmente por correo
electrónico. Las imágenes se guardan una sola vez dentro del archivo, por muchas veces que se usen,
y el guardado sigue siendo rápido aunque el archivo crezca hasta cientos de megabytes.

## ¿Puedo abrir un árbol de otro programa de genealogía (GEDCOM)?

Sí. Exporte un archivo GEDCOM desde el otro programa (Gramps, MyHeritage, Ancestry, Legacy…) y use
**☰ → Importar GEDCOM…**; consulte [GEDCOM](./gedcom). Del mismo modo puede exportar su árbol para
otros programas. Los datos de hojas de cálculo pueden entrar mediante [CSV](./csv-import).

## ¿Cómo puedo compartir el árbol con mi familia?

- Envíeles el archivo `.finsight`: con Family Insight pueden abrirlo, explorarlo y ampliarlo.
- Envíe un **PDF o una imagen** del árbol a quienes no tengan el programa
  ([Imágenes, PDF e impresión](./export-print)).
- Envíe un archivo **CSV** si quieren usar una hoja de cálculo ([Exportar a CSV](./csv-export)).

Family Insight no combina cambios, así que acuerden quién guarda la copia principal.

## ¿Pueden varias personas editar un árbol a la vez?

No. Mantenga una copia principal y vaya pasándola, o reúna las novedades en una hoja de cálculo e
impórtelas en el árbol actual.

## ¿Cómo imprimo un árbol grande?

Imprímalo por partes (ascendientes o descendientes de una persona, pocas generaciones), use papel
A3 o exporte un PNG o SVG grande para una imprenta. Consulte
[Consejos para árboles grandes](./export-print#large-trees).

## ¿Puedo registrar adopciones, familias reconstituidas y divorcios?

Sí; consulte [Relaciones](./relationships).

## ¿Hay una versión para móviles?

No, Family Insight es un programa de escritorio para Windows, macOS y Linux.

## ¿Puedo añadir otro idioma?

El programa está preparado para más idiomas y los traductores son bienvenidos; consulte
[Add a language](/developer/howto/language) en la documentación para desarrolladores (en inglés).
