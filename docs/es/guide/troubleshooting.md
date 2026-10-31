---
description: Soluciones a problemas habituales (el programa no se inicia, tildes y eñes mal en Excel, errores al importar CSV, archivos que no se abren) y cómo informar de un error.
---

# Solución de problemas

## El programa no se inicia

### Windows

| Síntoma                                       | Causa y solución                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Una ventana azul **«Windows protegió su PC»** | SmartScreen todavía no conoce al editor. Haga clic en **Más información → Ejecutar de todas formas** (consulte [Instalación](./install#windows)).            |
| El antivirus bloquea o elimina el archivo     | Vuelva a descargar el archivo desde la [página oficial de versiones](https://github.com/K-u-r-c/family-insight/releases/latest) y permítalo en el antivirus. |

### macOS

| Síntoma                                                                 | Causa y solución                                                                                                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **No se puede abrir «Family Insight» porque Apple no puede comprobar…** | La aplicación aún no está notarizada. Haga clic con el botón derecho en ella en Aplicaciones → **Abrir**, o use **Ajustes del Sistema → Privacidad y seguridad → Abrir igualmente**. |
| **«Family Insight» está dañado y no se puede abrir**                    | Es la cuarentena de macOS. Ejecute una vez `xattr -cr "/Applications/Family Insight.app"` en Terminal.                                                                               |
| La aplicación no se inicia en un Mac con Apple Silicon                  | Puede que tenga la versión para Intel: descargue `mac-arm64.dmg` (consulte [¿Qué archivo descargo?](./install#which-file)).                                                          |

### Linux {#linux}

| Síntoma                                                                      | Causa y solución                                                                                                                                                                            |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No pasa nada al hacer doble clic en el AppImage                              | El archivo no es ejecutable: `chmod +x family-insight-*.AppImage`.                                                                                                                          |
| `dlopen(): error loading libfuse.so.2` / _AppImages require FUSE to run_     | Falta FUSE 2: `sudo apt install libfuse2` (Ubuntu 24.04 y posteriores: `libfuse2t64`), o el paquete `fuse2` / `fuse-libs` en otras distribuciones.                                          |
| _The SUID sandbox helper binary was found, but is not configured correctly…_ | Algunas distribuciones (por ejemplo, Ubuntu 24.04) restringen el entorno aislado (sandbox) que usa Electron. Instale en su lugar el paquete `.deb` o inicie el AppImage con `--no-sandbox`. |
| La ventana se ve borrosa o parpadea en Wayland                               | Inícielo con `--ozone-platform=x11` para usar XWayland.                                                                                                                                     |

Para ver qué ocurre, inicie el programa desde una terminal: cualquier mensaje de error aparecerá
allí.

## Las tildes y la eñe se ven mal en Excel, o todo está en una sola columna

Vuelva a exportar el CSV y elija el otro separador: Excel con la configuración regional de muchos
países de habla hispana espera un **punto y coma**, mientras que en otros (por ejemplo, México) se
usa la **coma**. El archivo siempre contiene una marca UTF-8, así que letras como á, é o ñ se ven
correctamente. Consulte [Exportar a CSV](./csv-export).

## La importación CSV muestra problemas

Cada problema indica la fila y lo que hay que cambiar. La lista completa con las soluciones está
en [Importar desde CSV → Problemas y advertencias](./csv-import#problems).

## Un archivo no se abre

| Mensaje                                                                                        | Qué hacer                                                                                            |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| _El archivo ya no existe. Es posible que se haya movido o eliminado._                          | Busque el archivo y ábralo con **Abrir…**; quite la entrada antigua de la lista de recientes.        |
| _No tiene permiso para acceder a este archivo._                                                | Copie el archivo en una carpeta propia (por ejemplo, Documentos) y abra la copia.                    |
| _Este árbol se guardó con una versión más reciente de Family Insight…_                         | [Actualice Family Insight](./install#updating).                                                      |
| _El archivo está dañado o no es un árbol de Family Insight._                                   | Abra una de las [copias de seguridad](./files#backups) (`.bak1` … `.bak5`) que hay junto al archivo. |
| _Este no es un archivo de árbol de Family Insight._ / _Este tipo de archivo no es compatible._ | Elija un archivo `.finsight`; las hojas de cálculo se abren con [Importar desde CSV](./csv-import).  |
| _El archivo contiene datos no válidos y no se puede abrir de forma segura._                    | Pruebe con una copia de seguridad; si no sirve, [informe del problema](#report-a-problem).           |

Si el programa se cerró de forma inesperada, vuelva a iniciarlo: le ofrecerá
[recuperar el trabajo sin guardar](./files#crash-recovery).

## Informar de un problema {#report-a-problem}

Elija **Ayuda → Informar de un problema…**: se abre la página de incidencias en GitHub (necesita
una cuenta gratuita de GitHub). Incluya, por favor:

- qué hizo, qué esperaba y qué ocurrió en su lugar;
- la versión (**Ayuda → Acerca de Family Insight**) y su sistema (por ejemplo, Windows 11,
  macOS 15, Ubuntu 24.04);
- una captura de pantalla del mensaje y la salida de la terminal, si inició el programa desde una.

No adjunte su árbol genealógico públicamente: contiene datos personales. Si hace falta un archivo,
indíquelo en el informe y acordaremos una forma privada de enviarlo.
