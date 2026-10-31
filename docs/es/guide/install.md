---
description: Descargue e instale Family Insight en Windows, macOS o Linux, actualícelo y desinstálelo.
---

# Instalación

Family Insight es gratuito. Descárguelo de la
[página de versiones en GitHub](https://github.com/K-u-r-c/family-insight/releases/latest): en
**Assets**, elija el archivo para su sistema.

## ¿Qué archivo descargo? {#which-file}

| Su ordenador                                  | Archivo                                            |
| --------------------------------------------- | -------------------------------------------------- |
| Windows 10 u 11                               | `family-insight-<version>-setup.exe` (recomendado) |
| Windows, sin instalar                         | `family-insight-<version>-portable.exe`            |
| Mac con Apple Silicon (M1, M2, M3, M4…)       | `family-insight-<version>-mac-arm64.dmg`           |
| Mac con procesador Intel                      | `family-insight-<version>-mac-x64.dmg`             |
| Linux (cualquier distribución)                | `family-insight-<version>-linux-x86_64.AppImage`   |
| Ubuntu, Debian, Linux Mint y otras con `.deb` | `family-insight-<version>-linux-amd64.deb`         |

::: tip ¿Qué Mac tengo?
Abra el menú Apple → **Acerca de este Mac**. Si aparece **Chip: Apple M…**, elija `mac-arm64`. Si
aparece **Procesador: … Intel**, elija `mac-x64`.
:::

::: info ¿Por qué me avisa el sistema?
Family Insight todavía no está firmado con un certificado de desarrollador de pago, por lo que
Windows y macOS no reconocen al editor y le piden que confirme el primer inicio. Los pasos
siguientes explican cómo hacerlo. El programa es de código abierto: cualquiera puede comprobar lo
que hace.
:::

## Windows {#windows}

### Instalador (recomendado)

1. Descargue `family-insight-<version>-setup.exe` y ábralo.
2. Si aparece una ventana azul **Windows protegió su PC** (SmartScreen), haga clic en **Más
   información** y después en **Ejecutar de todas formas**.
3. Elija el idioma del instalador (English, Polski, Deutsch, Français, Español, Italiano, Português o
   Русский) y siga los pasos. Puede cambiar la carpeta de instalación. No hacen falta permisos
   de administrador: el programa se instala para su cuenta de usuario.
4. Inicie Family Insight desde el **menú Inicio** o el **acceso directo del escritorio**.

Después de la instalación, al hacer doble clic en un archivo `.finsight` se abre en Family Insight.

### Versión portátil

`family-insight-<version>-portable.exe` funciona sin instalación, por ejemplo desde una memoria
USB. Descárguelo y haga doble clic en él (confirme SmartScreen como se explica arriba). La
configuración se sigue guardando en su perfil de usuario (consulte [Desinstalar](#uninstalling));
la versión portátil no registra el tipo de archivo `.finsight`.

## macOS

1. Descargue el archivo `.dmg` para su Mac (consulte la tabla de arriba) y ábralo.
2. En la ventana que se abre, arrastre **Family Insight** a la carpeta **Aplicaciones**.
3. Abra **Aplicaciones**, haga **clic derecho** (o Control + clic) en **Family Insight**, elija
   **Abrir** y, en el cuadro de diálogo, de nuevo **Abrir**. Solo tiene que hacerlo la primera
   vez.

::: warning Si macOS no ofrece «Abrir»
En las versiones recientes de macOS, abra **Ajustes del Sistema → Privacidad y seguridad**,
desplácese hasta el mensaje sobre Family Insight y haga clic en **Abrir igualmente**.

Si macOS indica que la aplicación **«está dañada y no puede abrirse»**, abra la aplicación
**Terminal**, ejecute esto una vez y vuelva a iniciar el programa:

```sh
xattr -cr "/Applications/Family Insight.app"
```

:::

## Linux

### AppImage (cualquier distribución)

El AppImage es un único archivo que funciona sin instalación.

1. Descargue `family-insight-<version>-linux-x86_64.AppImage`.
2. Hágalo ejecutable: en su gestor de archivos, abra **Propiedades → Permisos** y permita
   ejecutarlo como programa, o bien en una terminal:

   ```sh
   chmod +x family-insight-*.AppImage
   ```

3. Haga doble clic en el archivo o ejecute `./family-insight-<version>-linux-x86_64.AppImage`.

Los AppImage necesitan **FUSE 2**. La mayoría de las distribuciones lo incluyen; en Ubuntu 22.04
instálelo con `sudo apt install libfuse2` (en Ubuntu 24.04 y posteriores:
`sudo apt install libfuse2t64`). Si el programa no se inicia, consulte
[Solución de problemas](./troubleshooting#linux).

::: tip Una entrada de menú para el AppImage
Un AppImage no se añade por sí solo al menú de aplicaciones. Herramientas como **Gear Lever** o
**AppImageLauncher** pueden hacerlo por usted; también puede usar el paquete `.deb` que se
describe a continuación.
:::

### Paquete Debian (Ubuntu, Debian, Linux Mint…)

```sh
sudo apt install ./family-insight-<version>-linux-amd64.deb
```

El paquete añade **Family Insight** al menú de aplicaciones (categoría Oficina) y abre los
archivos `.finsight` con doble clic. Desde una terminal, inícielo con `family-insight`.

## Actualizar {#updating}

Family Insight todavía no se actualiza solo. Para obtener una versión nueva, descárguela de la
[página de versiones](https://github.com/K-u-r-c/family-insight/releases/latest) e instálela de la
misma forma: encima de la anterior (instalador de Windows, `.deb`), sustituyendo la aplicación en
Aplicaciones (macOS) o el archivo AppImage anterior. Sus árboles son archivos independientes y no
se modifican; su configuración se conserva.

## Desinstalar {#uninstalling}

| Sistema            | Cómo                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Windows            | **Configuración → Aplicaciones → Aplicaciones instaladas → Family Insight → Desinstalar** |
| Windows (portátil) | Elimine el archivo `.exe`                                                                 |
| macOS              | Arrastre **Family Insight** desde Aplicaciones a la Papelera                              |
| Linux (AppImage)   | Elimine el archivo `.AppImage`                                                            |
| Linux (`.deb`)     | `sudo apt remove family-insight`                                                          |

Desinstalar nunca elimina sus archivos `.finsight`. La configuración, la lista de archivos
recientes y las copias de recuperación tras un cierre inesperado se quedan en una carpeta de su
perfil de usuario; elimínela también si quiere borrarlo todo:

| Sistema | Carpeta de configuración                       |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |
