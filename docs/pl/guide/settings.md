---
description: Zmiana języka, motywu, wielkości kart i autozapisu Family Insight oraz miejsce i resetowanie ustawień.
---

# Ustawienia

Kliknij przycisk **Ustawienia** (⚙) po prawej stronie paska narzędzi:

<Screenshot name="settings-menu" alt="Menu ustawień z sekcjami Motyw (Systemowy, Jasny, Ciemny), Styl (Nowoczesny, Gobelin), Język (English, Polski, Deutsch, Français, Español, Italiano, Português, Русский), Karty (Wygodne, Kompaktowe) i Zapisuj automatycznie" />

| Ustawienie                               | Opcje                                                                     | Co robi                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Motyw**                                | Systemowy, Jasny, Ciemny                                                  | Kolory programu. **Systemowy** podąża za jasnym lub ciemnym trybem komputera.                                                               |
| **Styl**                                 | Nowoczesny, Gobelin                                                       | Wygląd całego programu. **Gobelin** przypomina stary rodowy gobelin: pergamin i atrament w jasnym motywie, ciemna zieleń i złoto w ciemnym. |
| **Język**                                | English, Polski, Deutsch, Français, Español, Italiano, Português, Русский | Język całego programu, także paska menu i okien dialogowych. Zmienia się od razu.                                                           |
| **Karty**                                | Wygodne, Kompaktowe                                                       | Wielkość kart w drzewie. Kompaktowe mieszczą więcej osób na ekranie i na papierze.                                                          |
| **Zapisuj automatycznie**                | włączone (domyślnie) / wyłączone                                          | [Autozapis](./files#autosave) drzew, które mają już plik.                                                                                   |
| **Sprawdzaj aktualizacje automatycznie** | włączone (domyślnie) / wyłączone                                          | Codzienne sprawdzanie nowych wersji ([Aktualizacje](./updates)); **Sprawdź teraz…** sprawdza od razu.                                       |
| **Wczytuj mapy online**                  | wyłączone (domyślnie) / włączone                                          | Pobiera tło mapy z OpenStreetMap, gdy korzystasz z [mapy](./map#online).                                                                    |
| **Wyszukuj miejsca online**              | wyłączone (domyślnie) / włączone                                          | Pozwala przyciskowi **Wyszukaj online** wysłać nazwę miejsca do OpenStreetMap, aby znaleźć współrzędne ([Miejsca](./places#lookup)).        |

Styl można też zmienić na pasku menu: **Widok → Styl**. W stylu Gobelin osoby na drzewie są oprawionymi medalionami z portretem nad imieniem, partnerów łączy mały węzeł, a linie wyglądają jak złota nić.

<Screenshot name="tapestry-tree" alt="Przykładowa rodzina w stylu Gobelin: nazwisko rodu w ozdobnej ramce nad drzewem, osoby jako oprawione medaliony połączone złotą nicią" />

Motyw i język zmienisz też na ekranie powitalnym (prawy górny róg) i w menu **Widok** na pasku
menu. Menu **Widok** pozwala też pokazać lub ukryć listę osób i mapę przeglądową.

Family Insight zapamiętuje dla Ciebie więcej rzeczy: rozmiar i położenie okna, szerokość paneli,
ostatnio użyty separator CSV i [ostatnie pliki](./files#opening).

::: tip Separator CSV podąża za językiem
Gdy zmieniasz język w menu **Widok**, domyślny separator CSV zmienia się razem z nim – średnik dla
polskiego, przecinek dla angielskiego. Przy [eksporcie](./csv-export) zawsze możesz wybrać inny.
:::

## Gdzie są ustawienia

Ustawienia są zapisane w małym pliku `settings.json` w Twoim profilu użytkownika – osobno od
drzew:

| System  | Folder                                         |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |

## Przywracanie ustawień domyślnych

Zamknij Family Insight i usuń plik `settings.json` z tego folderu. Przy następnym uruchomieniu
program użyje ustawień domyślnych (i języka systemu). Twoje drzewa pozostaną nietknięte.
