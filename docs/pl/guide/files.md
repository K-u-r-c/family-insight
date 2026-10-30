---
description: Zapisywanie i otwieranie drzew, autozapis, odzyskiwanie po awarii, kopie zapasowe, ostatnie pliki i przenoszenie drzewa na inny komputer.
---

# Zapisywanie i otwieranie

## Plik `.finsight`

Każde drzewo to jeden plik z rozszerzeniem **`.finsight`** – w środku jest wszystko: osoby,
relacje, zdjęcia i sposób wyświetlania drzewa. To Ty decydujesz, gdzie leży; możesz go kopiować,
archiwizować i wysyłać e-mailem jak każdy dokument.

## Zapisywanie

| Aby                    | Zrób tak                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| zapisać                | <kbd>Ctrl</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>S</kbd>) albo **☰ → Zapisz**                                     |
| zapisać pod inną nazwą | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>S</kbd>) albo **☰ → Zapisz jako…** |

<Screenshot name="file-menu" alt="Menu pliku z poleceniami Nowe drzewo, Otwórz, Zapisz, Zapisz jako, Importuj CSV, Eksportuj CSV, Eksportuj obraz i Drukuj" />

Przy pierwszym zapisie nowego drzewa wskaż folder i nazwę (program podpowiada folder Dokumenty
i nazwę drzewa). Pasek stanu na dole zawsze pokazuje, czy wszystko jest zapisane:

<Screenshot name="unsaved-status" alt="Pasek stanu z napisem Niezapisane zmiany (1)" />

Jeśli zamykasz okno, otwierasz inne drzewo albo kończysz pracę, a są niezapisane zmiany, Family
Insight zapyta: **Zapisz**, **Nie zapisuj** czy **Anuluj**.

## Autozapis {#autosave}

Gdy drzewo ma już plik, Family Insight zapisuje je automatycznie **2 sekundy po każdej zmianie**.
Możesz to wyłączyć w [ustawieniach](./settings) (⚙ → **Zapisuj automatycznie**); wtedy zapisuj
skrótem <kbd>Ctrl</kbd>+<kbd>S</kbd>.

Zupełnie nowe drzewo, którego jeszcze nie zapisano, nie jest zapisywane automatycznie – zapisz je
raz, aby miało plik.

## Odzyskiwanie po awarii {#crash-recovery}

Gdy drzewo ma niezapisane zmiany (np. nowe drzewo albo przy wyłączonym autozapisie), Family
Insight trzyma ukrytą kopię do odzyskania, aktualizowaną 2 sekundy po każdej zmianie. Jeśli program
lub komputer się zawiesi, przy następnym uruchomieniu zaproponuje przywrócenie tej pracy:

<Screenshot name="recovery" alt="Okno Przywrócić niezapisaną pracę? z drzewem Kowalscy, nigdy nie zapisanym, i przyciskami Przywróć oraz Odrzuć wszystkie" />

Kliknij **Przywróć**, aby otworzyć drzewo w takim stanie, w jakim było, a potem je zapisz.
**Odrzuć wszystkie** usuwa kopie. Kopie do odzyskiwania znikają, gdy tylko drzewo zostanie zapisane
lub normalnie zamknięte.

## Kopie zapasowe {#backups}

Za każdym razem, gdy zapisujesz **ręcznie** (<kbd>Ctrl</kbd>+<kbd>S</kbd> lub **Zapisz**), poprzednia
wersja pliku zostaje obok jako `nazwa.finsight.bak1`. Starsze wersje przesuwają się do `.bak2` …
`.bak5`, więc pięć ostatnich ręcznych zapisów jest zawsze pod ręką. Autozapis nie tworzy kopii.

Aby wrócić do starszej wersji:

1. Zamknij drzewo w Family Insight.
2. W menedżerze plików znajdź folder z drzewem i zrób kopię wybranej kopii zapasowej, np.
   `Kowalscy.finsight.bak2`.
3. Zmień nazwę tej kopii tak, aby kończyła się na `.finsight`, np. `Kowalscy (starsze).finsight`
   (system może zapytać, czy na pewno zmienić rozszerzenie – potwierdź).
4. Otwórz ją w Family Insight.

::: tip Nie widzisz rozszerzeń?
Windows i macOS domyślnie ukrywają rozszerzenia plików. W Windows w Eksploratorze plików wybierz
**Widok → Pokaż → Rozszerzenia nazw plików**; na macOS w Finderze **Finder → Ustawienia →
Zaawansowane → Pokazuj wszystkie rozszerzenia nazw plików**.
:::

## Otwieranie drzewa {#opening}

- **☰ → Otwórz…** lub <kbd>Ctrl</kbd>+<kbd>O</kbd> (<kbd>⌘</kbd>+<kbd>O</kbd>) albo **Otwórz
  drzewo…** na ekranie powitalnym;
- **dwuklik** na pliku `.finsight` (po instalacji instalatorem Windows, aplikacją macOS lub
  pakietem `.deb`);
- **przeciągnij** plik `.finsight` na okno Family Insight – przeciągnięcie pliku `.csv` rozpoczyna
  [import CSV](./csv-import);
- **Plik → Otwórz ostatnie** w pasku menu albo lista **Ostatnie** na ekranie powitalnym.

<Screenshot name="welcome-recent" alt="Ekran powitalny z listą Ostatnie: jedno drzewo otwarte 2 godziny temu i jedno przekreślone jako Nie znaleziono pliku" />

Pliki przeniesione lub usunięte są na liście ostatnich przekreślone; usuń je przyciskiem **×**.

Jeśli pliku nie da się otworzyć, Family Insight powie dlaczego – np. że zapisano go w nowszej
wersji (zaktualizuj program, zobacz [Instalacja](./install#updating)) albo że jest uszkodzony
(spróbuj [kopii zapasowej](#backups)).

## Przenoszenie drzewa na inny komputer

Skopiuj plik `.finsight` – na pendrive, e-mailem albo przez folder w chmurze – i otwórz go
w Family Insight na drugim komputerze. Zdjęcia są w pliku, więc nic więcej nie trzeba.

::: warning Praca nad tym samym drzewem w dwóch miejscach
Family Insight nie scala zmian. Jeśli trzymasz drzewo we wspólnym lub synchronizowanym folderze,
miej je otwarte tylko na jednym komputerze naraz.
:::
