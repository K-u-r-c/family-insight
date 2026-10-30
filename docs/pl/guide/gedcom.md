---
description: Przenoś drzewa między Family Insight a innymi programami genealogicznymi przez GEDCOM – import z Gramps, MyHeritage, Ancestry czy FamilySearch, eksport do GEDCOM 5.5.1 lub 7.0.
---

# GEDCOM

**GEDCOM** to format plików, którym programy genealogiczne wymieniają się drzewami. Family Insight
odczytuje pliki GEDCOM 5.5, 5.5.1 i 7.0 (`.ged` oraz `.gdz` ze zdjęciami w środku) i zapisuje 5.5.1
lub 7.0.

## Import pliku GEDCOM

Wybierz **☰ → Importuj GEDCOM…** (albo **Plik → Importuj → GEDCOM…**, albo **Importuj z GEDCOM…** na
ekranie powitalnym) lub po prostu upuść plik `.ged` na okno. Otworzy się podgląd:

<Screenshot name="gedcom-import" alt="Okno Import GEDCOM: GEDCOM 5.5.1 z programu MyHeritage, kodowanie UTF-8 (wykryte), ostrzeżenie o przybliżonej dacie, niezaimportowane znaczniki i podsumowanie z liczbą osób, rodzin, wydarzeń, źródeł i multimediów" />

- Okno pokazuje **wersję** i **program**, który zapisał plik, oraz ile zawiera osób, rodzin,
  wydarzeń, źródeł i zdjęć.
- **Kodowanie znaków** – wykrywane automatycznie (UTF-8, UTF-16, ANSEL, ANSI, Windows-1250). Jeśli
  litery takie jak _ą_, _ł_, _ö_ czy _ß_ wyglądają źle, wybierz inne.
- **Ostrzeżenia** wyjaśniają, czego nie dało się przenieść dokładnie – np. daty typu
  _BET 1850 AND 1855_ albo daty w kalendarzu juliańskim. Oryginalny zapis trafia do notatek osoby,
  więc nic nie ginie.
- **Niezaimportowane** wymienia szczegóły specyficzne dla innych programów, dla których w Family
  Insight nie ma miejsca (numery rekordów, wewnętrzne identyfikatory …), pogrupowane według
  znaczników.
- Gdy masz otwarte drzewo, możesz zaimportować do **nowego drzewa** albo **dodać do otwartego**.
  Dodanie to jeden krok, który można cofnąć.

Zdjęcia i dokumenty wskazane w pliku są wczytywane z miejsca, które podaje plik – a jeśli plik
pochodzi z innego komputera, z folderu pliku `.ged` i jego folderu `media`. Plik `.gdz` ma je
w środku.

### Co zostaje zachowane

Imiona i nazwiska (także rodowe i po ślubie), płeć, urodzenie i śmierć, wydarzenia (chrzest,
pogrzeb, emigracja, zawód, służba wojskowa … i własne wydarzenia), notatki, źródła i repozytoria
z cytowaniami (strona, wiarygodność, transkrypcja), zdjęcia i dokumenty, śluby, zaręczyny
i rozwody, rodzice adopcyjni, zastępczy i przybrani oraz współrzędne miejsc.

### Przenosiny z innego programu

| Program                                   | Jak wyeksportować plik GEDCOM                                                                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gramps**                                | **Drzewa genealogiczne → Eksportuj…**, wybierz _GEDCOM_.                                                                                                  |
| **MyHeritage**                            | Family Tree Builder: **Plik → Eksportuj do GEDCOM**; na stronie: **Drzewo genealogiczne → Zarządzaj drzewami → Eksportuj do GEDCOM**.                     |
| **Ancestry**                              | **Trees → (Twoje drzewo) → Tree settings → Export tree**.                                                                                                 |
| **FamilySearch**                          | FamilySearch nie eksportuje całego wspólnego drzewa; eksportuj własne drzewa programami partnerskimi albo zacznij od pliku GEDCOM, który ktoś udostępnił. |
| **Legacy, RootsMagic, Family Tree Maker** | **File → Export → GEDCOM**.                                                                                                                               |

## Eksport do pliku GEDCOM

Wybierz **☰ → Eksportuj GEDCOM…** (albo **Plik → Eksportuj → GEDCOM…**):

<Screenshot name="gedcom-export" alt="Okno Eksport GEDCOM z wersją GEDCOM 5.5.1 lub 7.0, opcjami Dołącz zdjęcia i dokumenty, Ukryj żyjące osoby i Dołącz notatki" />

- **Wersja** – **5.5.1** odczytuje niemal każdy program genealogiczny; **7.0** to najnowsza wersja.
- **Dołącz zdjęcia i dokumenty** – przy 5.5.1 trafiają do folderu `media` obok pliku GEDCOM; przy
  7.0 wszystko jest pakowane w jeden plik `.gdz`.
- **Ukryj żyjące osoby** – zastępuje imiona osób, które mogą żyć, słowem „Żyjący” i pomija ich
  szczegóły. Użyj tego, gdy udostępniasz drzewo innym.
- **Dołącz notatki** – wyłącz, aby udostępnić same fakty.

::: info Czego GEDCOM nie przeniesie
Tego, czy ktoś żyje (zapisuje się tylko śmierć), adresu internetowego źródła (staje się wierszem
w notatkach źródła) i ustawień widoku drzewa. Wszystko inne wróci, gdy zaimportujesz plik
z powrotem do Family Insight.
:::
