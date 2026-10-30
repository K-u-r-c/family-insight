---
description: Rozwiązania typowych problemów – program się nie uruchamia, polskie znaki w Excelu, błędy importu CSV, pliki, które się nie otwierają – i jak zgłosić błąd.
---

# Rozwiązywanie problemów

## Program się nie uruchamia

### Windows

| Objaw                                                      | Przyczyna i rozwiązanie                                                                                                                       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Niebieskie okno **„System Windows ochronił ten komputer”** | SmartScreen nie zna jeszcze wydawcy. Kliknij **Więcej informacji → Uruchom mimo to** (zobacz [Instalacja](./install#windows)).                |
| Program antywirusowy blokuje lub usuwa plik                | Pobierz plik ponownie z oficjalnej [strony wydań](https://github.com/K-u-r-c/family-insight/releases/latest) i zezwól na niego w antywirusie. |

### macOS

| Objaw                                                                       | Przyczyna i rozwiązanie                                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nie można otworzyć „Family Insight”, ponieważ Apple nie może sprawdzić…** | Aplikacja nie jest jeszcze notaryzowana. Kliknij ją w Aplikacjach prawym przyciskiem → **Otwórz** albo **Ustawienia systemowe → Prywatność i ochrona → Otwórz mimo to**. |
| **„Family Insight” jest uszkodzona i nie można jej otworzyć**               | Kwarantanna macOS. Uruchom raz w Terminalu `xattr -cr "/Applications/Family Insight.app"`.                                                                               |
| Aplikacja nie startuje na Macu z procesorem Apple                           | Możesz mieć wersję dla Intela – pobierz `mac-arm64.dmg` (zobacz [Który plik pobrać?](./install#which-file)).                                                             |

### Linux {#linux}

| Objaw                                                                        | Przyczyna i rozwiązanie                                                                                                                           |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Po dwukliku na AppImage nic się nie dzieje                                   | Plik nie ma prawa uruchamiania: `chmod +x family-insight-*.AppImage`.                                                                             |
| `dlopen(): error loading libfuse.so.2` / _AppImages require FUSE to run_     | Brakuje FUSE 2: `sudo apt install libfuse2` (Ubuntu 24.04 i nowsze: `libfuse2t64`) albo pakiet `fuse2` / `fuse-libs` w innych dystrybucjach.      |
| _The SUID sandbox helper binary was found, but is not configured correctly…_ | Niektóre dystrybucje (np. Ubuntu 24.04) ograniczają piaskownicę Electrona. Zainstaluj pakiet `.deb` albo uruchom AppImage z opcją `--no-sandbox`. |
| Okno jest rozmyte lub migocze pod Waylandem                                  | Uruchom program z opcją `--ozone-platform=x11`, aby użyć XWayland.                                                                                |

Aby zobaczyć, co się dzieje, uruchom program z terminala – ewentualne błędy pojawią się właśnie tam.

## Polskie znaki w Excelu wyglądają źle albo wszystko jest w jednej kolumnie

Wyeksportuj CSV ponownie i wybierz separator **średnik** – tego oczekuje Excel z polskimi
ustawieniami regionalnymi. Plik zawsze ma znacznik UTF-8, więc litery takie jak ą, ę i ł są
poprawne. Zobacz [Eksport do CSV](./csv-export).

## Import CSV pokazuje problemy

Każdy problem podaje wiersz i to, co trzeba zmienić. Pełna lista z rozwiązaniami jest w
[Import z CSV → Problemy i ostrzeżenia](./csv-import#problems).

## Plik się nie otwiera

| Komunikat                                                                         | Co zrobić                                                                          |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| _Plik już nie istnieje. Mógł zostać przeniesiony lub usunięty._                   | Znajdź plik i otwórz go przez **Otwórz…**; usuń stary wpis z listy ostatnich.      |
| _Nie masz uprawnień do tego pliku._                                               | Skopiuj plik do własnego folderu (np. Dokumenty) i otwórz kopię.                   |
| _To drzewo zapisano w nowszej wersji Family Insight…_                             | [Zaktualizuj Family Insight](./install#updating).                                  |
| _Plik jest uszkodzony albo nie jest drzewem Family Insight._                      | Otwórz jedną z [kopii zapasowych](./files#backups) (`.bak1` … `.bak5`) obok pliku. |
| _To nie jest plik drzewa Family Insight._ / _Ten typ pliku nie jest obsługiwany._ | Wybierz plik `.finsight`; arkusze otwiera się przez [Import z CSV](./csv-import).  |
| _Plik zawiera nieprawidłowe dane i nie można go bezpiecznie otworzyć._            | Spróbuj kopii zapasowej; jeśli to nie pomoże, [zgłoś problem](#report-a-problem).  |

Jeśli program nieoczekiwanie się zamknął, uruchom go ponownie – zaproponuje
[przywrócenie niezapisanej pracy](./files#crash-recovery).

## Zgłoś problem {#report-a-problem}

Wybierz **Pomoc → Zgłoś problem…** – otworzy się strona zgłoszeń na GitHubie (potrzebne jest
darmowe konto GitHub). Napisz:

- co zrobiono, czego oczekiwano i co się stało zamiast tego;
- wersję programu (**Pomoc → O programie Family Insight**) i system (np. Windows 11, macOS 15,
  Ubuntu 24.04);
- zrzut ekranu z komunikatem i to, co pokazał terminal, jeśli program był z niego uruchomiony.

Nie dołączaj publicznie swojego drzewa – zawiera dane osobowe. Jeśli plik będzie potrzebny, napisz
o tym w zgłoszeniu, a ustalimy prywatny sposób przekazania.
