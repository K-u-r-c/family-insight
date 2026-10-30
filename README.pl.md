<div align="center">

# 🌳 Family Insight

**Piękny i prosty program do tworzenia drzewa genealogicznego na Windows, macOS i Linux.**

[English](README.md) · Polski

</div>

Family Insight pomaga zbudować drzewo rodzinne, wygodnie je przeglądać i aktualizować.
Dane zostają na Twoim komputerze w jednym pliku `.finsight`. Import i eksport CSV pozwala pracować
z Excelem, LibreOffice lub Arkuszami Google.

> 🚧 **Status:** wczesna faza rozwoju. Postęp prac:
> [Issues](https://github.com/K-u-r-c/family-insight/issues) i
> [Milestones](https://github.com/K-u-r-c/family-insight/milestones).

## Funkcje (planowane w 1.0)

- Interaktywny widok drzewa z przybliżaniem, przesuwaniem i skupieniem na wybranej osobie
- Dodawanie i edycja osób, rodziców, dzieci, partnerów (kolejne małżeństwa, przyrodnie rodzeństwo, adopcja)
- Niepełne daty (`ok. 1890`, `przed 1900`), miejsca, notatki i zdjęcia
- Szybkie wyszukiwanie ignorujące polskie znaki (`lodz` znajdzie `Łódź`)
- Cofnij/ponów, autozapis i ostatnio otwierane pliki
- **Import i eksport CSV**, przyjazny dla Excela, po polsku i po angielsku
- Interfejs po polsku i angielsku, jasny i ciemny motyw

## Pobieranie

Najnowszy instalator znajdziesz w [Releases](https://github.com/K-u-r-c/family-insight/releases/latest):

| System  | Plik                                                                             |
| ------- | -------------------------------------------------------------------------------- |
| Windows | `family-insight-<wersja>-setup.exe` lub `-portable.exe`                          |
| macOS   | `family-insight-<wersja>-mac-arm64.dmg` (Apple Silicon) / `-mac-x64.dmg` (Intel) |
| Linux   | `.AppImage` lub `.deb`                                                           |

Wersje nie są jeszcze podpisane cyfrowo:

- **Windows:** jeśli pojawi się SmartScreen, kliknij _Więcej informacji → Uruchom mimo to_.
- **macOS:** kliknij aplikację prawym przyciskiem → _Otwórz_ lub uruchom `xattr -cr "/Applications/Family Insight.app"`.
- **Linux:** pakiet `.deb` (`sudo apt install ./family-insight-*.deb`) dodaje skrót w menu i otwiera
  pliki `.finsight` dwuklikiem. AppImage działa wszędzie: `chmod +x family-insight-*.AppImage` i uruchom.

## Rozwój

Wymagania: Node.js 24+ i npm.

```bash
npm install
npm run dev        # uruchom aplikację z hot reload
npm run check      # typecheck + lint + testy
npm run dist       # zbuduj instalatory dla bieżącego systemu do dist/
```

Wydania dla wszystkich trzech systemów buduje GitHub Actions po wypchnięciu tagu `v*`.

## Dokumentacja

- [Architektura](docs/ARCHITECTURE.md) (EN)
- [Format CSV](docs/CSV_FORMAT.md) (EN)
- [Format pliku `.finsight`](docs/FILE_FORMAT.md) (EN)
- [Tłumaczenia](docs/I18N.md) (EN)
- [Jak współtworzyć](CONTRIBUTING.md) (EN)

## Licencja

[MIT](LICENSE)
