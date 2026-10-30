---
description: Change the language, theme, card size and autosave of Family Insight, and find or reset the settings.
---

# Settings

Click the **Settings** button (⚙) on the right of the toolbar:

<Screenshot name="settings-menu" alt="The settings menu with Theme (System, Light, Dark), Language (English, Polski), Cards (Comfortable, Compact) and Save automatically" />

| Setting                   | Choices              | What it does                                                                                                    |
| ------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Theme**                 | System, Light, Dark  | The colours of the program. **System** follows the light or dark mode of your computer.                         |
| **Language**              | English, Polski      | The language of the whole program, including the menu bar and dialogs. It changes immediately.                  |
| **Cards**                 | Comfortable, Compact | The size of the cards in the tree. Compact cards fit more people on the screen and on paper.                    |
| **Save automatically**    | on (default) / off   | [Autosave](./files#autosave) of trees that already have a file.                                                 |
| **Load maps online**      | off (default) / on   | Downloads the map background from OpenStreetMap while you use the [map](./map#online).                          |
| **Look up places online** | off (default) / on   | Lets **Look up online** send a place name to OpenStreetMap to find its coordinates ([Places](./places#lookup)). |

The theme and the language can also be changed on the welcome screen (top-right corner) and in the
**View** menu of the menu bar. The **View** menu also shows or hides the list of people and the
overview map.

Family Insight remembers more things for you: the window size and position, the width of the
panels, the CSV separator you used last and the [recent files](./files#opening).

::: tip The CSV separator follows the language
When you switch the language in the **View** menu, the default CSV separator changes with it – a
semicolon for Polish, a comma for English. You can always choose another one when
[exporting](./csv-export).
:::

## Where settings are stored

Settings are saved in a small file, `settings.json`, in your user profile – separately from your
trees:

| System  | Folder                                         |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |

## Resetting the settings

Close Family Insight and delete `settings.json` from that folder. The next start uses the default
settings (and the language of your system). Your trees are not affected.
