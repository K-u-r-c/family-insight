# Family Insight – podręcznik użytkownika

[English](user-guide.en.md) · Polski

## 1. Pierwsze kroki

Po uruchomieniu Family Insight zobaczysz ekran powitalny:

- **Nowe drzewo rodzinne** – nadaj drzewu nazwę, a od razu otworzy się edycja pierwszej osoby.
  Zacznij od siebie albo od najstarszego znanego przodka.
- **Otwórz drzewo…** – otwiera plik `.finsight`. Możesz też kliknąć dwukrotnie plik `.finsight`
  albo upuścić go na okno.
- **Importuj z CSV…** – zacznij od arkusza (zob. [CSV](#7-import-i-eksport-csv)).
- **Wypróbuj przykładową rodzinę** – drzewo 25 osób do obejrzenia.
- **Ostatnie** – ostatnio otwierane drzewa. Przeniesione lub usunięte pliki są przekreślone;
  usuń je z listy przyciskiem ×.

Język (English/Polski) i motyw (systemowy, jasny, ciemny) zmienisz w prawym górnym rogu ekranu
powitalnego, a później w menu ustawień (⚙) i w menu _Widok_.

## 2. Dodawanie osób i krewnych

- **Dodaj osobę** na pasku narzędzi (lub `Ctrl+Shift+N` / `⌘⇧N`) tworzy osobę i otwiera edycję.
- W panelu osoby sekcja **Rodzina** pokazuje rodziców, partnerów, dzieci i rodzeństwo. Przyciski
  **+ Ojciec**, **+ Matka**, **+ Partner**, **+ Dziecko** i **+ Rodzeństwo** tworzą krewnego jednym
  kliknięciem — nowa osoba jest połączona i wybrana, więc od razu wpisujesz imię.
  - Nowy ojciec dostaje automatycznie nazwisko rodowe.
  - Jeśli osoba ma już jednego rodzica, nowy rodzic zostaje jego partnerem.
  - Gdy osoba ma kilku partnerów, przy dodawaniu dziecka zapytamy, kto jest drugim rodzicem.
- Ikona łańcucha przy każdej grupie łączy osobę, która **już jest w drzewie**.
- Te same akcje znajdziesz w menu pod prawym przyciskiem myszy na karcie w drzewie.

## 3. Edycja osoby

Kliknij osobę, aby zobaczyć szczegóły; kliknij **Edytuj** (albo kliknij kartę dwukrotnie lub
naciśnij `Enter`), aby je zmienić. Zmiany zapisują się po wyjściu z pola; `Esc` anuluje bieżące pole.

- **Imiona i nazwisko** – imiona, nazwisko i w razie potrzeby **nazwisko rodowe** (panieńskie).
- **Daty** – wpisz rok (`1890`), miesiąc (`05.1890` lub `1890-05`) albo pełną datę (`12.05.1890`
  lub `1890-05-12`). Nie masz pewności? Dodaj `~` (około), `<` (przed) albo `>` (po) — lub wybierz
  dokładność z listy. Podgląd pokazuje, jak data będzie wyświetlana.
- **Miejsca** – podpowiedzi pochodzą z miejsc użytych już w drzewie.
- **Życie** – żyje, nie żyje albo nie wiadomo.
- **Zdjęcie** – _Dodaj zdjęcie…_ albo upuść obraz na kółko, a potem je przytnij. Zdjęcia są
  zapisywane w pliku `.finsight` (zmniejszone do 512 px).
- **Notatki** – wszystko, co warto zapamiętać.

Przy mało prawdopodobnych danych (śmierć przed urodzeniem, rodzic młodszy od dziecka, wiek ponad
120 lat) pojawią się łagodne ostrzeżenia — nigdy niczego nie blokują.

Aby zmienić relację, otwórz menu **⋯** obok krewnego: oznacz rodzica jako adopcyjnego, przybranego
lub zastępczego, edytuj związek (rodzaj, daty rozpoczęcia i zakończenia, sposób zakończenia) albo
usuń relację. **Usuń osobę** (🗑 w panelu lub klawisz `Delete`) prosi o potwierdzenie. Wszystko
cofniesz skrótem `Ctrl+Z` / `⌘Z`.

## 4. Przeglądanie drzewa

- **Przesuwaj** przeciągając tło, **przybliżaj** kółkiem myszy lub przyciskami w prawym dolnym
  rogu, **dopasuj** całe drzewo przyciskiem ⛶ lub klawiszem `F`.
- **Minimapa** (lewy dolny róg) pokazuje, gdzie jesteś; kliknij lub przeciągnij w niej, aby się
  przenieść.
- **Klawiatura:** kliknij drzewo (lub użyj odnośnika _Przejdź do drzewa_) i używaj strzałek:
  ↑ rodzic, ↓ dziecko, ←/→ partner lub rodzeństwo. `Enter` – edycja, `+`/`−` – powiększenie,
  `0` – 100%.
- **Tryby widoku** na pasku narzędzi: _Rodzina_ (wszyscy), _Przodkowie_, _Potomkowie_
  i _Klepsydra_ (jedno i drugie) **osoby głównej** (🏠, ustawianej z menu karty) lub wybranej
  osoby, z liczbą pokoleń.
- Najedź na kartę i użyj −/+ pod nią, aby zwinąć lub rozwinąć gałąź.
- Widok (tryb, pokolenia, zwinięte gałęzie) zapisuje się razem z plikiem.

## 5. Wyszukiwanie

Naciśnij `Ctrl+F` / `⌘F` lub kliknij pole wyszukiwania. Wyszukiwanie ignoruje wielkość liter
i polskie znaki: `lodz` znajdzie _Łódź_, `zolkiewski` znajdzie _Żółkiewski_. Szukaj po imionach,
nazwiskach rodowych, miejscach i latach. Wyniki są wyróżnione na liście i w drzewie; `↓` przechodzi
do wyników, `Esc` czyści pole. Sortowanie listy (⇅): według nazwiska, imienia lub daty urodzenia.

## 6. Zapisywanie, autozapis i kopie

- `Ctrl+S` / `⌘S` zapisuje, `Ctrl+Shift+S` / `⌘⇧S` zapisuje pod nową nazwą.
- **Autozapis** (domyślnie włączony, menu ustawień ⚙) zapisuje drzewo, które ma już plik,
  2 sekundy po każdej zmianie.
- Jeśli aplikacja lub komputer się zawiesi, przy następnym uruchomieniu zaproponujemy
  **przywrócenie niezapisanej pracy**.
- Każdy ręczny zapis zostawia obok pliku pięć poprzednich wersji: `nazwa.finsight.bak1` … `.bak5`
  (zmień nazwę na `.finsight`, aby otworzyć kopię).

## 7. Import i eksport CSV

**Eksport:** _Plik → Eksportuj → CSV…_. Wybierz separator kolumn — **średnik** dla Excela
z polskimi ustawieniami regionalnymi, **przecinek** w pozostałych przypadkach — oraz polskie lub
angielskie nazwy kolumn. Plik otworzy się poprawnie w Excelu, LibreOffice Calc i Arkuszach Google.

**Import:** _Plik → Importuj → CSV…_ (lub upuść plik `.csv` na okno). Zanim cokolwiek się zmieni,
podgląd pokaże:

- wykryty separator i kodowanie (UTF-8 lub Windows-1250),
- jak zostanie użyta każda kolumna — zmień przypisanie, jeśli kolumna nie została rozpoznana,
- pierwsze wiersze, problemy do poprawienia (z numerami wierszy) i ostrzeżenia, które możesz
  zaakceptować.

Importuj do **nowego drzewa** albo **dodaj do bieżącego** (jeden krok, który można cofnąć).

Wskazówki dla arkuszy:

- Jeden wiersz to jedna osoba. Każdy wiersz potrzebuje `id` (dowolny tekst, np. `p1`) i imienia
  lub nazwiska.
- Rodzice trafiają do `ojciec_id` / `matka_id`, partnerzy do `partnerzy_id` rozdzieleni `|`
  (`p2|p5`).
- Nazwy kolumn mogą być polskie lub angielskie (`imiona`, `nazwisko`, `data_urodzenia`, …).
- _Pomoc → Pobierz szablon CSV…_ daje pusty arkusz; pełny opis w [formacie CSV](CSV_FORMAT.md).

CSV zachowuje imiona, nazwiska, daty, miejsca, status życia, rodziców biologicznych, partnerów
i notatki. Zdjęcia, daty związków i adopcje zostają tylko w plikach `.finsight`.

## 8. Druk i obrazy

_Plik → Eksportuj → Obraz…_ zapisuje całe drzewo lub widoczny fragment jako **PNG** (1×–3×),
**SVG** lub **PDF** (A4, A3 lub Letter, dopasowany do jednej strony), opcjonalnie z nazwą drzewa
i datą. _Plik → Drukuj…_ (`Ctrl+P` / `⌘P`) drukuje drzewo. Eksport zawsze używa jasnych kolorów.

## 9. Statystyki

Przycisk 📊 pokazuje liczbę osób, pokoleń, średnią długość życia, najczęstsze imiona, nazwiska
i miejsca urodzenia (kliknij jedno, aby wyróżnić te osoby) oraz listę osób bez dat lub rodziców.

## 10. Skróty klawiszowe

Naciśnij `?` lub `F1`, aby zobaczyć pełną listę.

| Akcja                  | Windows / Linux           | macOS        |
| ---------------------- | ------------------------- | ------------ |
| Nowe drzewo            | `Ctrl+N`                  | `⌘N`         |
| Otwórz                 | `Ctrl+O`                  | `⌘O`         |
| Zapisz / Zapisz jako   | `Ctrl+S` / `Ctrl+Shift+S` | `⌘S` / `⌘⇧S` |
| Dodaj osobę            | `Ctrl+Shift+N`            | `⌘⇧N`        |
| Cofnij / Ponów         | `Ctrl+Z` / `Ctrl+Y`       | `⌘Z` / `⌘⇧Z` |
| Szukaj                 | `Ctrl+F`                  | `⌘F`         |
| Drukuj                 | `Ctrl+P`                  | `⌘P`         |
| Edytuj wybraną osobę   | `Enter`                   | `Enter`      |
| Usuń wybraną osobę     | `Delete`                  | `⌫`          |
| Poruszanie po drzewie  | strzałki                  | strzałki     |
| Dopasuj / powiększenie | `F`, `+`, `−`, `0`        | tak samo     |
