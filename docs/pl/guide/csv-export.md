---
description: Eksport drzewa do arkusza CSV, który poprawnie otworzy się w Excelu, LibreOffice Calc i Arkuszach Google.
---

# Eksport do CSV

Wybierz **☰ → Eksportuj CSV…** (albo **Plik → Eksportuj → CSV…** w pasku menu):

<Screenshot name="csv-export" alt="Okno Eksport do CSV z separatorem kolumn (przecinek lub średnik) i nazwami kolumn (English, Polski lub Deutsch)" />

1. **Separator kolumn** – **Średnik** dla Excela z ustawieniami regionalnymi, w których przecinek
   jest separatorem dziesiętnym (polskimi, niemieckimi, francuskimi, hiszpańskimi, włoskimi,
   portugalskimi, rosyjskimi …) – inaczej wszystko trafi do jednej kolumny; **Przecinek** dla
   większości innych programów. Domyślny wybór zależy od języka programu, a Family Insight
   zapamięta Twój wybór.
2. **Nazwy kolumn** – w jednym z języków programu: polskie (`imiona`, `nazwisko` …), angielskie
   (`given_names`, `surname` …), niemieckie (`vornamen`, `nachname` …) i tak dalej. Wartości są w
   tym samym języku co nazwy kolumn (`kobieta`, `tak` / `nie` po polsku; `weiblich`, `ja` / `nein`
   po niemiecku).
3. Kliknij **Eksportuj…** i wskaż miejsce zapisu. Po zakończeniu pojawi się komunikat z przyciskiem
   **Pokaż w folderze**.

Plik jest zapisany w UTF-8 ze znacznikiem BOM, więc polskie litery (ą, ę, ł, ó, ż …) wyświetlają
się poprawnie po dwukliku w Excelu.

## Co jest eksportowane

Jeden wiersz na osobę, w kolejności dat urodzenia, z kolumnami: id, imiona, nazwisko, nazwisko
rodowe, płeć, data i miejsce urodzenia, data i miejsce śmierci, czy żyje, ojciec i matka (przez
id), partnerzy (id rozdzielone `|`) i notatki. Osoby dostają krótkie id `p1`, `p2` …, więc plik
łatwo czytać i edytować.

**Nie są eksportowane:** zdjęcia, daty i miejsca związków, rodzice adopcyjni, przybrani
i zastępczy, osoba główna i widok. Traktuj plik `.finsight` jako główną kopię – CSV służy do pracy
z arkuszami.

Możesz edytować plik i [zaimportować go z powrotem](./csv-import). Dokładny format opisuje
[specyfikacja CSV](/developer/reference/csv-format) (po angielsku).

## Otwieranie pliku w arkuszu

| Program          | Wskazówka                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Microsoft Excel  | Kliknij plik dwukrotnie. Jeśli wszystkie dane są w kolumnie A, wyeksportuj ponownie ze **średnikiem**. |
| LibreOffice Calc | Otwórz plik; w oknie importu wybierz **UTF-8** i separator użyty przy eksporcie.                       |
| Arkusze Google   | **Plik → Importuj → Prześlij**; separator zostanie wykryty automatycznie.                              |
