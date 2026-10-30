---
description: Edit a person – names and birth surname, partial and approximate dates, places, life status, photo and notes.
---

# Editing a person

Select a person and click **Edit** in the details panel – or double-click their card, or select it
and press <kbd>Enter</kbd>. The panel switches to the editor:

<Screenshot name="person-editor" alt="The editor of Piotr Kowalski with the photo, names, sex and date of birth" />

Each field is saved as soon as you leave it (<kbd>Tab</kbd> or a click elsewhere); <kbd>Esc</kbd>
undoes what you typed in the current field. Click **Done** to go back to the details.

## Names

- **Given names** – all given names, for example `Anna Maria`.
- **Surname** – the current surname.
- **Birth surname** – the surname at birth (maiden name). Click **Add birth surname** to show the
  field. In the tree and the lists it appears as “née Wiśniewska” (in Polish “z d. Wiśniewska”).
- **Sex** – female, male, other or unknown. It sets the colour of the card and helps when adding
  relatives.

::: tip Names from other countries {#name-conventions}

- **Russian, Ukrainian, Belarusian**: write the patronymic with the given names – given names
  `Иван Петрович`, surname `Иванов`.
- **Spanish and Portuguese**: both surnames go into the surname field – `García Márquez`,
  `Santos Silva`.
- **Particles** such as von, van, de, da, dos or di belong to the surname (`van der Berg`); for
  sorting, the list skips them.
  :::

## Dates {#dates}

Old records are rarely precise, so dates can be partial or approximate. Type the date in the field;
the line below it shows how Family Insight understood it.

<Screenshot name="date-field" alt="The date of birth field with the text ~1955 (1) and the precision list (2)" />

| You type                             | Meaning        | Shown in English | Shown in Polish |
| ------------------------------------ | -------------- | ---------------- | --------------- |
| `1890`                               | the year only  | 1890             | 1890            |
| `05.1890` or `1890-05`               | month and year | May 1890         | maj 1890        |
| `12.05.1890` or `1890-05-12`         | an exact day   | 12 May 1890      | 12 maja 1890    |
| `12/05/1890`                         | an exact day   | 12 May 1890      | 12 maja 1890    |
| `~1890`, `about 1890`, `ok. 1890`    | about          | about 1890       | ok. 1890        |
| `<1890`, `before 1890`, `przed 1890` | before         | before 1890      | przed 1890      |
| `>1890`, `after 1890`, `po 1890`     | after          | after 1890       | po 1890         |

Good to know:

- Day-first order is used for dots and slashes: `05.06.1890` is **5 June** 1890.
- The **precision list** next to the field (**Exactly**, **About**, **Before**, **After**) does the
  same as typing `~`, `<` or `>`.
- `abt`, `bef`, `aft`, `circa` and `ca.` – the abbreviations used in genealogy – work too.
- A date that can't be understood is shown in red with an example of what works; it isn't saved
  until it's fixed.
- Ages are calculated from the dates. When a date is partial or approximate, the age is shown as
  “about …”.

## Places

Type the town or village of birth and death. Places you already used in the tree are suggested as
you type, so the same place is always written the same way – which also makes
[statistics](./statistics) and [search](./search) more useful.

## Life status {#life-status}

Choose **Living**, **Deceased** or **Unknown**. For living people the date and place of death are
hidden. If you enter a date or place of death while the status is unknown, the person is treated
as deceased.

## Photo {#photo}

Click **Add photo…** and choose a picture, or drop an image file onto the round placeholder.
Supported formats are **JPG, PNG and WebP** up to 20 MB (HEIC photos from iPhones need to be converted
first). A cropping window opens: drag the picture to position the face, zoom with the slider and
click **Use photo**.

<Screenshot name="photo-crop" alt="The Crop the photo dialog with a round frame, a zoom slider and the Use photo button" />

The photo is stored **inside the `.finsight` file** (scaled to 512 × 512 pixels), so the tree stays
one file you can copy anywhere. Use **Change…** or **Remove** under the photo to replace or delete it.
A picture from the person's gallery can become the portrait too (**⋯ → Use as portrait…**, see
[Photos and documents](./media)).

## Life events

Baptism, schools, jobs, moves, military service, burial … are recorded in the **Life events**
section of the editor. See [Life events](./events).

## Sources

The small source button next to **Name**, **Birth**, **Life** and each life event records where a
fact comes from. See [Sources](./sources).

## Notes

Anything worth remembering – occupation, stories, where a document is kept. Notes are shown in the
details panel and included in [CSV exports](./csv-export).

## Warnings {#warnings}

Family Insight warns about data that is probably a mistake – but never stops you from saving it:

| Warning                                           | When                                            |
| ------------------------------------------------- | ----------------------------------------------- |
| _The date of death is before the date of birth._  | the death date is earlier than the birth date   |
| _That would make … years old. Is the date right?_ | the person would be older than 120 years        |
| _… was born after …, but is listed as a parent._  | a biological parent is not older than the child |
