---
description: Guardar y abrir árboles genealógicos, guardado automático, recuperación tras un cierre inesperado, copias de seguridad, archivos recientes y cómo llevar un árbol a otro ordenador.
---

# Guardar y abrir

## El archivo `.finsight`

Cada árbol genealógico es un único archivo con la extensión **`.finsight`**, que lo contiene todo:
personas, relaciones, fuentes, fotos y cómo se veía el árbol. Usted decide dónde se guarda, y puede
copiarlo, hacer una copia de seguridad o enviarlo por correo electrónico como cualquier otro
documento.

::: info Versiones anteriores
Desde la versión 1.1, un archivo `.finsight` es un paquete comprimido (como un archivo zip) para que
las fotos y los documentos escaneados quepan de forma eficiente: cada imagen se guarda una sola vez,
la use las veces que la use. Family Insight 1.1 abre los árboles de la 1.0 y los guarda en el nuevo
formato; **la 1.0 no puede abrir árboles guardados con la 1.1**, así que actualice el programa en
todos los ordenadores que utilice (consulte [Instalación](./install#updating)).
:::

## Guardar

| Para                    | Haga esto                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| guardar                 | <kbd>Ctrl</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>S</kbd>) o **☰ → Guardar**                                     |
| guardar con otro nombre | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>S</kbd>) o **☰ → Guardar como…** |

<Screenshot name="file-menu" alt="El menú de archivo con Nuevo árbol, Abrir, Guardar, Guardar como, Importar CSV, Importar GEDCOM, Exportar CSV, Exportar GEDCOM, Exportar imagen, Fuentes, Lugares e Imprimir" />

La primera vez que guarde un árbol nuevo, elija una carpeta y un nombre (se proponen la carpeta
Documentos y el nombre del árbol). La barra de estado de la parte inferior siempre le indica si todo
está guardado:

<Screenshot name="unsaved-status" alt="La barra de estado con el aviso Cambios sin guardar (1)" />

Si cierra la ventana, abre otro árbol o sale del programa con cambios sin guardar, Family Insight le
pregunta si desea **Guardar**, **No guardar** o **Cancelar**.

## Guardado automático {#autosave}

Una vez que un árbol se ha guardado en un archivo, Family Insight lo guarda automáticamente **2
segundos después de cada cambio**. Puede desactivarlo en la [configuración](./settings)
(⚙ → **Guardar automáticamente**); en ese caso, guarde usted mismo con <kbd>Ctrl</kbd>+<kbd>S</kbd>.

Un árbol nuevo que nunca se ha guardado no se guarda automáticamente: guárdelo una vez para asignarle
un archivo.

## Recuperación tras un cierre inesperado {#crash-recovery}

Mientras un árbol tenga cambios sin guardar (por ejemplo, un árbol nuevo o con el guardado automático
desactivado), Family Insight mantiene una copia de recuperación oculta, que se actualiza 2 segundos
después de cada cambio. Si el programa o el ordenador se bloquean, la próxima vez que lo inicie le
ofrecerá recuperar ese trabajo:

<Screenshot name="recovery" alt="La ventana ¿Recuperar el trabajo sin guardar? con el árbol Kowalscy, nunca guardado, y los botones Recuperar y Descartar todo" />

Haga clic en **Recuperar** para abrir el árbol tal como estaba y después guárdelo. **Descartar todo**
elimina las copias. Las copias de recuperación se borran en cuanto el árbol se guarda o se cierra
con normalidad.

## Copias de seguridad {#backups}

Cada vez que guarda **manualmente** (<kbd>Ctrl</kbd>+<kbd>S</kbd> o **Guardar**), la versión anterior
del archivo se conserva a su lado como `nombre.finsight.bak1`. Las versiones más antiguas pasan a
`.bak2` … `.bak5`, de modo que siempre están ahí los últimos cinco guardados manuales. El guardado
automático no crea copias de seguridad.

Para volver a una versión anterior:

1. Cierre el árbol en Family Insight.
2. En su gestor de archivos, busque la carpeta del árbol y haga una copia de la copia de seguridad
   que quiera, por ejemplo `Kowalscy.finsight.bak2`.
3. Cambie el nombre de la copia para que termine en `.finsight`, por ejemplo
   `Kowalscy (anterior).finsight` (es posible que el sistema le pregunte si de verdad quiere cambiar
   la extensión; confírmelo).
4. Ábrala en Family Insight.

::: tip ¿No ve las extensiones?
Windows y macOS ocultan las extensiones de archivo de forma predeterminada. En Windows, en el
Explorador de archivos, elija **Vista → Mostrar → Extensiones de nombre de archivo**; en macOS, en el
Finder, elija **Finder → Ajustes → Avanzado → Mostrar todas las extensiones de nombre de archivo**.
:::

## Abrir un árbol {#opening}

- **☰ → Abrir…** o <kbd>Ctrl</kbd>+<kbd>O</kbd> (<kbd>⌘</kbd>+<kbd>O</kbd>), o **Abrir árbol…** en
  la pantalla de bienvenida;
- **doble clic** en un archivo `.finsight` (después de instalar con el instalador de Windows, la
  aplicación de macOS o el paquete `.deb`);
- **arrastrar** un archivo `.finsight` a la ventana de Family Insight; si arrastra un archivo `.csv`,
  se inicia una [importación desde CSV](./csv-import);
- **Archivo → Abrir reciente** en la barra de menús, o la lista **Recientes** de la pantalla de
  bienvenida.

<Screenshot name="welcome-recent" alt="La pantalla de bienvenida con la lista Recientes: un árbol abierto hace 2 horas y otro tachado con Archivo no encontrado" />

Los archivos que se han movido o eliminado aparecen tachados en la lista de recientes; quítelos con
**×**.

Si un archivo no se puede abrir, Family Insight le explica por qué: por ejemplo, que se guardó con una
versión más reciente (actualice el programa; consulte [Instalación](./install#updating)) o que está
dañado (pruebe con una [copia de seguridad](#backups)).

## Llevar un árbol a otro ordenador

Copie el archivo `.finsight` (en una memoria USB, por correo electrónico o mediante una carpeta en la
nube) y ábralo con Family Insight en el otro ordenador. Las fotos están dentro del archivo, así que no
hace falta nada más.

::: warning Trabajar con el mismo árbol en dos sitios
Family Insight no combina cambios. Si guarda el árbol en una carpeta compartida o sincronizada,
téngalo abierto en un solo ordenador a la vez.
:::
