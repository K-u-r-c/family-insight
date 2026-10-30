---
description: Edycja osoby – imiona i nazwisko rodowe, niepełne i przybliżone daty, miejsca, status życia, zdjęcie i notatki.
---

# Edycja osoby

Wybierz osobę i kliknij **Edytuj** w panelu szczegółów – albo kliknij dwukrotnie jej kartę, albo
zaznacz ją i naciśnij <kbd>Enter</kbd>. Panel przełączy się na edycję:

<Screenshot name="person-editor" alt="Edycja Piotra Kowalskiego ze zdjęciem, imionami, płcią i datą urodzenia" />

Każde pole zapisuje się, gdy je opuścisz (<kbd>Tab</kbd> albo kliknięcie gdzie indziej);
<kbd>Esc</kbd> cofa to, co wpisano w bieżącym polu. Kliknij **Gotowe**, aby wrócić do szczegółów.

## Imiona i nazwisko

- **Imiona** – wszystkie imiona, np. `Anna Maria`.
- **Nazwisko** – obecne nazwisko.
- **Nazwisko rodowe** – nazwisko przy urodzeniu (panieńskie). Kliknij **Dodaj nazwisko rodowe**,
  aby pokazać to pole. W drzewie i na listach pojawia się jako „z d. Wiśniewska”.
- **Płeć** – kobieta, mężczyzna, inna lub nieznana. Ustala kolor karty i pomaga przy dodawaniu
  krewnych.

::: tip Imiona i nazwiska z innych krajów {#name-conventions}

- **Rosyjskie, ukraińskie, białoruskie**: imię odojcowskie wpisz razem z imionami – imiona
  `Иван Петрович`, nazwisko `Иванов`.
- **Hiszpańskie i portugalskie**: oba nazwiska wpisz w pole nazwiska – `García Márquez`,
  `Santos Silva`.
- **Przedrostki** takie jak von, van, de, da, dos czy di są częścią nazwiska (`van der Berg`);
  przy sortowaniu lista je pomija.
  :::

## Daty {#dates}

Stare zapisy rzadko są dokładne, dlatego daty mogą być niepełne lub przybliżone. Wpisz datę
w polu; wiersz pod nim pokazuje, jak Family Insight ją zrozumiał.

<Screenshot name="date-field" alt="Pole daty urodzenia z tekstem ~1955 (1) i listą dokładności (2)" />

| Wpisujesz                         | Znaczenie      | Po polsku    | Po angielsku |
| --------------------------------- | -------------- | ------------ | ------------ |
| `1890`                            | sam rok        | 1890         | 1890         |
| `05.1890` lub `1890-05`           | miesiąc i rok  | maj 1890     | May 1890     |
| `12.05.1890` lub `1890-05-12`     | dokładny dzień | 12 maja 1890 | 12 May 1890  |
| `12/05/1890`                      | dokładny dzień | 12 maja 1890 | 12 May 1890  |
| `~1890`, `ok. 1890`, `około 1890` | około          | ok. 1890     | about 1890   |
| `<1890`, `przed 1890`             | przed          | przed 1890   | before 1890  |
| `>1890`, `po 1890`                | po             | po 1890      | after 1890   |

Warto wiedzieć:

- Przy kropkach i ukośnikach dzień jest pierwszy: `05.06.1890` to **5 czerwca** 1890.
- **Lista dokładności** obok pola (**Dokładnie**, **Około**, **Przed**, **Po**) działa tak samo
  jak wpisanie `~`, `<` lub `>`.
- Działają też skróty z angielskich dokumentów genealogicznych: `abt`, `bef`, `aft`, `circa`, `ca.`.
- Data, której nie da się zrozumieć, jest oznaczona na czerwono z przykładem poprawnego zapisu;
  nie zostanie zapisana, dopóki jej nie poprawisz.
- Wiek jest liczony z dat. Gdy data jest niepełna lub przybliżona, wiek ma dopisek „ok.”.

## Miejsca

Wpisz miejscowość urodzenia i śmierci. Miejsca użyte już w drzewie są podpowiadane w trakcie
pisania, więc ta sama miejscowość jest zawsze zapisana tak samo – dzięki temu
[statystyki](./statistics) i [wyszukiwanie](./search) działają lepiej.

## Status życia {#life-status}

Wybierz **Żyje**, **Nie żyje** albo **Nie wiadomo**. Dla osób żyjących data i miejsce śmierci są
ukryte. Jeśli wpiszesz datę lub miejsce śmierci przy nieznanym statusie, osoba jest traktowana jako
zmarła.

## Zdjęcie {#photo}

Kliknij **Dodaj zdjęcie…** i wskaż obraz albo upuść plik na okrągłe miejsce na zdjęcie.
Obsługiwane formaty to **JPG, PNG i WebP** do 20 MB (zdjęcia HEIC z iPhone’a trzeba najpierw
przekonwertować). Otworzy się okno przycinania: przeciągnij obraz, aby ustawić twarz, przybliż
suwakiem i kliknij **Użyj zdjęcia**.

<Screenshot name="photo-crop" alt="Okno Przytnij zdjęcie z okrągłą ramką, suwakiem przybliżenia i przyciskiem Użyj zdjęcia" />

Zdjęcie jest zapisywane **w pliku `.finsight`** (w rozmiarze 512 × 512 pikseli), więc drzewo
pozostaje jednym plikiem, który skopiujesz gdziekolwiek. Przyciski **Zmień…** i **Usuń** pod
zdjęciem pozwalają je wymienić lub skasować. Portretem może też zostać obraz z galerii osoby
(**⋯ → Ustaw jako portret…**, zobacz [Zdjęcia i dokumenty](./media)).

## Wydarzenia

Chrzest, szkoły, praca, przeprowadzki, służba wojskowa, pogrzeb … zapisuje się w sekcji
**Wydarzenia** w edycji. Zobacz [Wydarzenia](./events).

## Źródła

Mały przycisk źródeł obok **Imię i nazwisko**, **Urodzenie**, **Życie** i przy każdym wydarzeniu
zapisuje, skąd pochodzi fakt. Zobacz [Źródła](./sources).

## Notatki

Wszystko, co warto zapamiętać – zawód, historie, gdzie leży dokument. Notatki widać w panelu
szczegółów i trafiają do [eksportu CSV](./csv-export).

## Ostrzeżenia {#warnings}

Family Insight ostrzega o danych, które są prawdopodobnie pomyłką – ale nigdy nie blokuje
zapisu:

| Ostrzeżenie                                              | Kiedy                                          |
| -------------------------------------------------------- | ---------------------------------------------- |
| _Data śmierci jest wcześniejsza niż data urodzenia._     | data śmierci jest wcześniejsza niż urodzenia   |
| _Oznaczałoby to, że … ma … lat. Czy data jest poprawna?_ | osoba miałaby ponad 120 lat                    |
| _… urodził(a) się po …, a jest wpisany(-a) jako rodzic._ | rodzic biologiczny nie jest starszy od dziecka |
