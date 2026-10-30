---
description: Give the places in your tree a location – look them up online (optional) or enter coordinates – and merge different spellings of the same place.
---

# Places

Places are typed as text wherever you enter them – birth, death, life events, marriages, photos.
**☰ → Places…** (or **Edit → Places…**) collects them in one list, so you can give each place a
**location** for the [map](./map) and tidy up spellings.

<Screenshot name="places-manager" alt="The Places window: a list of places with how often they are used on the left, and Łódź selected on the right with its coordinates, latitude and longitude fields, Save location, Look up online (1) and Merge with another place" />

The list shows every place with how often it is used and whether it has a location. Places that
differ only in capitals, spaces or Polish letters (_Kraków_, _Krakow_, _ kraków _) count as one
place; the most common spelling is shown and the others are listed as **Also written as**.

## Look up a location online {#lookup}

Click **Look up online** (1). The first time, Family Insight asks whether it may do so:

<Screenshot name="places-consent" alt="The question Look up places online? explaining that only the place name is sent to OpenStreetMap Nominatim, with Allow and Cancel" />

- Only the **name of the place** is sent – no names of people, no dates, nothing else – to
  [OpenStreetMap Nominatim](https://nominatim.org), a free service.
- Pick the right match from the results; its coordinates are saved with the tree.
- Answers are remembered on your computer, so the same place isn't asked for twice.
- You can switch it off again in the settings (**⚙ → Look up places online**). Without it – or
  without an internet connection – everything else works as before.

## Enter coordinates yourself

Type the **latitude** and **longitude** (for example _50.0619_ and _19.9369_ for Kraków – a
comma works as the decimal separator too) and click **Save location**. You can copy them from any
map website. **Remove location** clears them again.

## Merge spellings

The same village is often written in several ways – _Cracow_, _Krakau_, _Kraków_. Select one of
them, choose the place to **merge into** and click **Merge**: every birth, death, event, marriage
and photo gets the chosen spelling, and the place keeps one location. Like every change, merging
can be undone with <kbd>Ctrl</kbd>+<kbd>Z</kbd>.

::: info
Locations are saved in the `.finsight` file. Your places themselves don't change – a place without a
location is simply not on the map.
:::
