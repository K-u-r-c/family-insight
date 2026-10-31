---
description: Asigne una ubicación a los lugares de su árbol – búsquela en internet (opcional) o introduzca las coordenadas – y combine distintas grafías del mismo lugar.
---

# Lugares

Los lugares se escriben como texto allí donde los introduce: nacimiento, defunción, eventos vitales,
matrimonios, fotos. **☰ → Lugares…** (o **Edición → Lugares…**) los reúne en una lista para que
pueda asignar a cada lugar una **ubicación** para el [mapa](./map) y ordenar las grafías.

<Screenshot name="places-manager" alt="La ventana Lugares: a la izquierda, una lista de lugares con las veces que se usan; a la derecha, Łódź seleccionado con sus coordenadas, los campos Latitud y Longitud, Guardar ubicación, Buscar en internet (1) y Combinar con otro lugar" />

La lista muestra cada lugar con las veces que se usa y si tiene ubicación. Los lugares que solo se
diferencian en mayúsculas, espacios o tildes y otros signos diacríticos (_Málaga_, _Malaga_,
_ málaga _) cuentan como un solo lugar; se muestra la grafía más frecuente y las demás aparecen en
**También escrito como**.

## Buscar una ubicación en internet {#lookup}

Haga clic en **Buscar en internet** (1). La primera vez, Family Insight le pregunta si puede hacerlo:

<Screenshot name="places-consent" alt="La pregunta ¿Buscar lugares en internet?, que explica que solo se envía el nombre del lugar a OpenStreetMap Nominatim, con Permitir y Cancelar" />

- Solo se envía el **nombre del lugar** (ni nombres de personas, ni fechas, ni nada más) a
  [OpenStreetMap Nominatim](https://nominatim.org), un servicio gratuito.
- Elija la coincidencia correcta entre los resultados; sus coordenadas se guardan con el árbol.
- Las respuestas se recuerdan en su ordenador, así que no se pregunta dos veces por el mismo lugar.
- Puede volver a desactivarlo en la configuración (**⚙ → Buscar lugares en internet**). Sin esta
  función, o sin conexión a internet, todo lo demás funciona como siempre.

## Introducir las coordenadas usted mismo

Escriba la **latitud** y la **longitud** (por ejemplo, _50.0619_ y _19.9369_ para Kraków; también se
admite la coma como separador decimal) y haga clic en **Guardar ubicación**. Puede copiarlas de
cualquier sitio web de mapas. **Quitar ubicación** vuelve a borrarlas.

## Combinar grafías

El mismo pueblo suele escribirse de varias formas: _Cracovia_, _Krakau_, _Kraków_. Seleccione una de
ellas, elija el lugar en **Combinar en** y haga clic en **Combinar**: todos los nacimientos,
defunciones, eventos, matrimonios y fotos reciben la grafía elegida, y el lugar conserva una sola
ubicación. Como cualquier cambio, la combinación se puede deshacer con <kbd>Ctrl</kbd>+<kbd>Z</kbd>.

::: info
Las ubicaciones se guardan en el archivo `.finsight`. Los lugares en sí no cambian: un lugar sin
ubicación simplemente no aparece en el mapa.
:::
