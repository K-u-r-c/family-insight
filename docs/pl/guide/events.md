---
description: Zapisuj wydarzenia z życia – chrzest, szkoły, pracę, przeprowadzki, służbę wojskową, pogrzeb i własne wydarzenia – z datami, okresami i miejscami.
---

# Wydarzenia

Poza urodzeniem i śmiercią w życiu jest wiele innych chwil wartych zapisania: chrzest, szkoła
i studia, praca, przeprowadzka do innego miasta lub kraju, służba wojskowa, pogrzeb. Family Insight
nazywa je **wydarzeniami**.

## Dodaj wydarzenie

1. Wybierz osobę i kliknij **Edytuj**.
2. Przewiń do sekcji **Wydarzenia** i kliknij **Dodaj wydarzenie**.
3. Wybierz rodzaj wydarzenia. Są pogrupowane na religijne; pracę, naukę i służbę; przeprowadzki
   i zamieszkanie oraz inne:

<Screenshot name="events-menu" alt="Menu Dodaj wydarzenie z rodzajami pogrupowanymi jako Religijne, Praca, nauka i służba, Przeprowadzki i zamieszkanie oraz Inne" />

Nowe wydarzenie od razu się otwiera, a kursor czeka w polu daty.

## Uzupełnij szczegóły

<Screenshot name="events-editor" alt="Wydarzenia w edycji: Chrzest i Służba wojskowa; służba jest otwarta z rodzajem, datą początku, datą zakończenia (3) i miejscem; przyciski edycji (1) i przesunięcia w górę (2)" />

- **Rodzaj** – możesz go zmienić w każdej chwili. Dla **Inne wydarzenie** wpisz własną nazwę (np.
  _Pielgrzymka_).
- **Data (lub początek)** i **Data zakończenia (opcjonalnie)** – jedna data albo okres, np. służba
  wojskowa od 1914 do 1918. Daty działają jak wszędzie: `1914`, `05.1914`, `~1914`
  ([więcej o datach](./editing#dates)).
- **Miejsce** – podpowiedzi pochodzą z miejsc użytych już w drzewie.
- **Opis** – krótki szczegół: zawód, szkoła, pułk, statek.
- **Notatki** – wszystko inne.

Każde pole zapisuje się, gdy je opuścisz. Kliknij tytuł wydarzenia albo ołówek (1), aby je otworzyć
lub zamknąć.

## Kolejność i usuwanie

- Strzałki (2) przesuwają wydarzenie w górę lub w dół. Wybrana kolejność zostaje zapamiętana; na osi
  życia wydarzenia i tak są ułożone według dat.
- Kosz usuwa wydarzenie. Pojawi się komunikat z przyciskiem **Cofnij** – a jak każdą zmianę, możesz to
  też cofnąć skrótem <kbd>Ctrl</kbd>+<kbd>Z</kbd>.

## Gdzie widać wydarzenia

- **Szczegóły i oś życia** – lista **Życie** pokazuje wydarzenia z ikoną, datą lub okresem i miejscem,
  między urodzeniem a śmiercią. Pogrzeb i kremacja są po śmierci.

  <Screenshot name="events-details" alt="Oś życia Jana Kowalskiego: urodzenie, chrzest, służba wojskowa 1944–1945, edukacja 1946–1951 i zawód 1951–1990" />

- **Wyszukiwanie** – miejsca i opisy wydarzeń są przeszukiwane: wpisz _Hamburg_, aby znaleźć
  wszystkich, którzy emigrowali przez Hamburg.
- **Statystyki** – najczęstsze wydarzenia i ich miejsca oraz liczba osób bez wydarzeń
  ([Statystyki](./statistics)).

## Ostrzeżenia

Jak inne daty, wydarzenia dostają łagodne ostrzeżenia, gdy coś wygląda na pomyłkę – nigdy niczego
nie blokują:

- _Wydarzenie osoby … ma datę wcześniejszą niż urodzenie._
- _Wydarzenie osoby … ma datę późniejszą niż śmierć._ (Pogrzeb i kremacja są w porządku.)
- _To wydarzenie kończy się przed rozpoczęciem._

::: info CSV i starsze wersje
Wydarzenia są zapisywane w pliku `.finsight`. Eksport CSV zawiera jeden wiersz na osobę i nie
obejmuje wydarzeń. Od wersji 1.1 drzewa są zapisywane w nowszym formacie pliku, który mieści
wydarzenia: Family Insight 1.0 ich nie otworzy i poprosi o aktualizację.
:::
