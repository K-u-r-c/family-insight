---
description: Import drzewa z Excela, LibreOffice lub Arkuszy Google – przygotowanie arkusza, podgląd i poprawianie typowych błędów.
---

# Import z CSV

Masz już rodzinę w arkuszu kalkulacyjnym? Family Insight wczyta ją z pliku **CSV** – formatu,
który zapisze każdy program do arkuszy.

## 1. Przygotuj arkusz

Użyj **jednego wiersza na osobę** i poniższych kolumn (w dowolnej kolejności, z nazwami polskimi
lub angielskimi):

| Kolumna                                | Nazwa angielska              | Co wpisać                                                            |
| -------------------------------------- | ---------------------------- | -------------------------------------------------------------------- |
| `id` **(wymagana)**                    | `id`                         | dowolna krótka, niepowtarzalna etykieta osoby, np. `p1`, `p2` …      |
| `imiona`                               | `given_names`                | imiona                                                               |
| `nazwisko`                             | `surname`                    | nazwisko                                                             |
| `nazwisko_rodowe`                      | `birth_surname`              | nazwisko rodowe (panieńskie)                                         |
| `plec`                                 | `sex`                        | `kobieta` / `mężczyzna` (albo `K`, `M`, `female`, `male`)            |
| `data_urodzenia`, `data_smierci`       | `birth_date`, `death_date`   | `1890`, `05.1890`, `12.05.1890`, `~1890` … ([daty](./editing#dates)) |
| `miejsce_urodzenia`, `miejsce_smierci` | `birth_place`, `death_place` | miejscowość                                                          |
| `zyje`                                 | `living`                     | `tak` / `nie` (albo `yes` / `no`)                                    |
| `ojciec_id`, `matka_id`                | `father_id`, `mother_id`     | **id** ojca i matki                                                  |
| `partnerzy_id`                         | `partner_ids`                | **id** partnerów rozdzielone `\|` – np. `p2\|p5`                     |
| `notatki`                              | `notes`                      | wszystko inne                                                        |

Każda osoba potrzebuje **id** i co najmniej imienia lub nazwiska; pozostałe kolumny są
opcjonalne. Krewni są łączeni przez id – np. `p3` z `ojciec_id` `p1` i `matka_id` `p2` to dziecko
`p1` i `p2`. Związek wystarczy wpisać po jednej stronie.

::: tip Zacznij od przykładu
Pobierz przykład z 25 osobami – [z polskimi nazwami kolumn](/samples/example-pl.csv) albo
[z angielskimi](/samples/example-en.csv) – lub pusty szablon z Family Insight:
**Pomoc → Pobierz szablon CSV…**. Pełna specyfikacja jest w
[opisie formatu CSV](/developer/reference/csv-format) (po angielsku).
:::

## 2. Zapisz jako CSV

| Program          | Jak                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------- |
| Microsoft Excel  | **Plik → Zapisz jako**, typ **CSV UTF-8 (rozdzielany przecinkami) (\*.csv)**        |
| LibreOffice Calc | **Plik → Zapisz jako**, typ **Tekst CSV (.csv)**, zestaw znaków **Unicode (UTF-8)** |
| Arkusze Google   | **Plik → Pobierz → Wartości rozdzielone przecinkami (.csv)**                        |

Działają separatory: przecinek, średnik i tabulator, a także pliki ze starszych polskich wersji
Excela (kodowanie Windows-1250) – Family Insight sam to rozpozna.

## 3. Importuj

Na ekranie powitalnym kliknij **Importuj z CSV…**, a gdy drzewo jest otwarte – **☰ → Importuj
CSV…**. Możesz też przeciągnąć plik `.csv` na okno. Zanim cokolwiek się zmieni, zobaczysz podgląd:

<Screenshot name="csv-import" alt="Podgląd importu: wykryty separator i kodowanie, kolumny z przypisaniem, podgląd pierwszych wierszy i przycisk Importuj" />

- Na górze: wykryty **separator i kodowanie** tekstu.
- **Kolumny** – jak zostanie użyta każda kolumna pliku. Jeśli kolumna nie została rozpoznana
  (np. bo nazywa się „Imię”), wybierz właściwe znaczenie z listy albo **Nie importuj**, aby ją
  pominąć.
- **Podgląd** – pierwsze wiersze tak, jak zrozumiał je Family Insight.
- Na dole: ile osób i relacji zostanie zaimportowanych.

<Screenshot name="csv-import-columns" alt="Tabela Kolumny: kolumna w pliku, importuj jako (lista) i wartość z pierwszego wiersza" />

Gdy drzewo jest już otwarte, wybierz, czy importować do **Nowego drzewa**, czy do **Bieżącego
drzewa**. Import do bieżącego drzewa dodaje wszystkie osoby z pliku jako nowe (nie są łączone
z osobami, które już są w drzewie) – to jeden krok, który można [cofnąć](./undo).

Kliknij **Importuj**. Nowe drzewo z pliku CSV nie ma jeszcze pliku – [zapisz je](./files), aby je
zachować.

## Problemy i ostrzeżenia {#problems}

**Problemy** (czerwone) trzeba poprawić przed importem – popraw je w arkuszu (albo zmień
przypisanie kolumn) i zaimportuj ponownie. **Ostrzeżenia** (żółte) wyjaśniają, co się stanie;
możesz mimo to zaimportować. Każdy komunikat podaje numer wiersza.

<Screenshot name="csv-import-errors" alt="Podgląd importu z 2 problemami: Wiersz 4 – identyfikator p2 występuje więcej niż raz; Wiersz 5 – odwołanie do p9, ale nie ma wiersza z takim id" />

### Problemy, które blokują import

| Komunikat                                                                  | Jak poprawić                                                                    |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| _Plik jest pusty._                                                         | Wybierz właściwy plik albo sprawdź, czy arkusz zapisał się z danymi.            |
| _W pliku brakuje kolumny „id”…_                                            | Dodaj kolumnę `id` z niepowtarzalną etykietą dla każdej osoby.                  |
| _W pliku brakuje kolumn z imieniem lub nazwiskiem („imiona”, „nazwisko”)._ | Dodaj kolumnę `imiona` lub `nazwisko` albo przypisz do niej istniejącą kolumnę. |
| _W tym wierszu brakuje id._                                                | Uzupełnij id w tym wierszu.                                                     |
| _Identyfikator „p2” występuje więcej niż raz._                             | Nadaj każdej osobie inne id.                                                    |
| _Osoba „p7” nie ma ani imion, ani nazwiska._                               | Wpisz co najmniej jedno z nich (albo usuń pusty wiersz).                        |
| _Odwołanie do „p9”, ale nie ma wiersza z takim id._                        | Popraw id w `ojciec_id`, `matka_id` lub `partnerzy_id` albo dodaj tę osobę.     |
| _Osoba odwołuje się do samej siebie („p3”)._                               | Osoba nie może być swoim rodzicem ani partnerem – popraw id.                    |
| _Ojciec i matka to ta sama osoba („p1”)._                                  | Popraw `ojciec_id` lub `matka_id`.                                              |
| _… byłby swoim własnym przodkiem._                                         | Gdzieś dziecko jest wpisane jako rodzic własnego przodka – sprawdź id.          |

### Ostrzeżenia

| Komunikat                                                                                | Co się stanie                                                               |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| _Kolumna „…” nie została rozpoznana i zostanie pominięta._                               | Kolumna zostanie pominięta – przypisz ją do pola, jeśli jej potrzebujesz.   |
| _„…” to nie jest rozpoznawalna data; dodano ją do notatek._                              | Tekst trafia do notatek osoby, więc nic nie ginie.                          |
| _„…” to nie jest znana płeć; zaimportowano jako nieznaną._                               | Użyj `kobieta`, `mężczyzna`, `inna` lub `nieznana` (albo słów angielskich). |
| _„…” to nie jest tak/nie; status życia pozostaje nieznany._                              | Użyj `tak`/`nie`, `yes`/`no`, `true`/`false` lub `1`/`0`.                   |
| Ostrzeżenia o datach (śmierć przed urodzeniem, ponad 120 lat, rodzic młodszy od dziecka) | Zaimportowane tak, jak wpisano – zobacz [Ostrzeżenia](./editing#warnings).  |

## Czego CSV nie przeniesie

CSV zachowuje imiona, nazwiska, daty, miejsca, status życia, rodziców biologicznych, partnerów
i notatki. **Zdjęcia, daty i miejsca związków, rodzice adopcyjni, przybrani i zastępczy, osoba
główna i widok** są tylko w plikach `.finsight` – używaj ich, aby zachować wszystko.
