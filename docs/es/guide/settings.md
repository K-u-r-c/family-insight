---
description: Cambie el idioma, el tema, el tamaño de las tarjetas y el guardado automático de Family Insight, y averigüe dónde se guarda la configuración o cómo restablecerla.
---

# Configuración

Haga clic en el botón **Configuración** (⚙), a la derecha de la barra de herramientas:

<Screenshot name="settings-menu" alt="El menú de configuración con Tema (Sistema, Claro, Oscuro), Estilo (Moderno, Tapiz), Idioma (English, Polski, Deutsch, Français, Español, Italiano, Português, Русский), Tarjetas (Amplias, Compactas) y Guardar automáticamente" />

| Opción                                     | Valores                                                                   | Qué hace                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tema**                                   | Sistema, Claro, Oscuro                                                    | Los colores del programa. **Sistema** sigue el modo claro u oscuro de su ordenador.                                                                  |
| **Estilo**                                 | Moderno, Tapiz                                                            | El aspecto de todo el programa. **Tapiz** recuerda a un antiguo tapiz familiar: pergamino y tinta en el tema claro, verde oscuro y oro en el oscuro. |
| **Idioma**                                 | English, Polski, Deutsch, Français, Español, Italiano, Português, Русский | El idioma de todo el programa, incluidos la barra de menús y los diálogos. Cambia de inmediato.                                                      |
| **Tarjetas**                               | Amplias, Compactas                                                        | El tamaño de las tarjetas del árbol. Con las tarjetas compactas caben más personas en la pantalla y en el papel.                                     |
| **Guardar automáticamente**                | activado (predeterminado) / desactivado                                   | [Guardado automático](./files#autosave) de los árboles que ya tienen un archivo.                                                                     |
| **Buscar actualizaciones automáticamente** | activado (predeterminado) / desactivado                                   | Una comprobación diaria de nuevas versiones ([Actualizaciones](./updates)); **Buscar ahora…** comprueba al momento.                                  |
| **Cargar mapas de internet**               | desactivado (predeterminado) / activado                                   | Descarga el fondo del mapa de OpenStreetMap mientras usa el [mapa](./map#online).                                                                    |
| **Buscar lugares en internet**             | desactivado (predeterminado) / activado                                   | Permite que **Buscar en internet** envíe el nombre de un lugar a OpenStreetMap para encontrar sus coordenadas ([Lugares](./places#lookup)).          |

El estilo también se puede cambiar en la barra de menús: **Ver → Estilo**.

El tema y el idioma también se pueden cambiar en la pantalla de bienvenida (esquina superior
derecha) y en el menú **Ver** de la barra de menús. El menú **Ver** también muestra u oculta la
lista de personas y el mapa general.

Family Insight recuerda más cosas por usted: el tamaño y la posición de la ventana, el ancho de los
paneles, el separador CSV que usó la última vez y los [archivos recientes](./files#opening).

::: tip El separador CSV depende del idioma
Al cambiar el idioma en el menú **Ver**, el separador CSV predeterminado cambia con él: punto y
coma para el español (y los demás idiomas salvo el inglés), coma para el inglés. Siempre puede
elegir otro al [exportar](./csv-export).
:::

## Dónde se guarda la configuración

La configuración se guarda en un pequeño archivo, `settings.json`, en su perfil de usuario,
separado de sus árboles:

| Sistema | Carpeta                                        |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |

## Restablecer la configuración

Cierre Family Insight y elimine `settings.json` de esa carpeta. En el siguiente inicio se usará la
configuración predeterminada (y el idioma de su sistema). Sus árboles no se verán afectados.
