---
description: Pobieranie i instalacja Family Insight na Windows, macOS lub Linuksie, aktualizacja i odinstalowanie.
---

# Instalacja

Family Insight jest darmowy. Pobierz go ze
[strony wydań na GitHubie](https://github.com/K-u-r-c/family-insight/releases/latest) – w sekcji
**Assets** wybierz plik dla swojego systemu.

## Który plik pobrać? {#which-file}

| Twój komputer                              | Plik                                            |
| ------------------------------------------ | ----------------------------------------------- |
| Windows 10 lub 11                          | `family-insight-<wersja>-setup.exe` (zalecany)  |
| Windows, bez instalacji                    | `family-insight-<wersja>-portable.exe`          |
| Mac z procesorem Apple (M1, M2, M3, M4 …)  | `family-insight-<wersja>-mac-arm64.dmg`         |
| Mac z procesorem Intel                     | `family-insight-<wersja>-mac-x64.dmg`           |
| Linux (dowolna dystrybucja)                | `family-insight-<wersja>-linux-x86_64.AppImage` |
| Ubuntu, Debian, Linux Mint i inne z `.deb` | `family-insight-<wersja>-linux-amd64.deb`       |

::: tip Jaki mam komputer Mac?
Otwórz menu Apple → **Ten Mac** (lub **Ten Mac – informacje**). Jeśli widzisz **Czip: Apple M…**,
pobierz `mac-arm64`. Jeśli **Procesor: … Intel** – pobierz `mac-x64`.
:::

::: info Dlaczego system mnie ostrzega?
Family Insight nie jest jeszcze podpisany płatnym certyfikatem programisty, więc Windows i macOS
nie rozpoznają wydawcy i proszą o potwierdzenie pierwszego uruchomienia. Poniżej znajdziesz, jak to
zrobić. Sam program ma otwarty kod – każdy może sprawdzić, co robi.
:::

## Windows

### Instalator (zalecany)

1. Pobierz `family-insight-<wersja>-setup.exe` i otwórz go.
2. Jeśli pojawi się niebieskie okno **System Windows ochronił ten komputer** (SmartScreen),
   kliknij **Więcej informacji**, a potem **Uruchom mimo to**.
3. Wybierz język instalatora (Polski, English, Deutsch, Français, Español, Italiano, Português lub Русский) i przejdź przez kolejne kroki. Możesz zmienić
   folder instalacji. Uprawnienia administratora nie są potrzebne – program instaluje się dla
   Twojego konta.
4. Uruchom Family Insight z **menu Start** albo **skrótu na pulpicie**.

Po instalacji dwuklik na pliku `.finsight` otwiera go w Family Insight.

### Wersja przenośna

`family-insight-<wersja>-portable.exe` działa bez instalacji – np. z pendrive’a. Pobierz go
i kliknij dwukrotnie (potwierdź SmartScreen jak wyżej). Ustawienia i tak są zapisywane w Twoim
profilu użytkownika (zobacz [Odinstalowanie](#uninstalling)); wersja przenośna nie rejestruje
plików `.finsight`.

## macOS

1. Pobierz plik `.dmg` dla swojego Maca (zobacz tabelę wyżej) i otwórz go.
2. W oknie, które się pojawi, przeciągnij **Family Insight** na folder **Aplikacje**.
3. Otwórz **Aplikacje**, kliknij **Family Insight prawym przyciskiem** (lub z klawiszem Control)
   i wybierz **Otwórz**, a potem jeszcze raz **Otwórz** w oknie dialogowym. Wystarczy zrobić to
   za pierwszym razem.

::: warning Jeśli macOS nie pokazuje „Otwórz”
W nowszych wersjach macOS otwórz **Ustawienia systemowe → Prywatność i ochrona**, przewiń do
komunikatu o Family Insight i kliknij **Otwórz mimo to**.

Jeśli macOS twierdzi, że aplikacja **„jest uszkodzona i nie można jej otworzyć”**, otwórz
aplikację **Terminal**, wpisz raz poniższe polecenie i uruchom program ponownie:

```sh
xattr -cr "/Applications/Family Insight.app"
```

:::

## Linux

### AppImage (dowolna dystrybucja)

AppImage to jeden plik, który działa bez instalacji.

1. Pobierz `family-insight-<wersja>-linux-x86_64.AppImage`.
2. Nadaj mu prawo uruchamiania: w menedżerze plików otwórz **Właściwości → Uprawnienia** i zezwól
   na uruchamianie jako program albo w terminalu:

   ```sh
   chmod +x family-insight-*.AppImage
   ```

3. Kliknij plik dwukrotnie albo uruchom `./family-insight-<wersja>-linux-x86_64.AppImage`.

AppImage potrzebuje **FUSE 2**. Większość dystrybucji go ma; w Ubuntu 22.04 zainstalujesz go
poleceniem `sudo apt install libfuse2` (w Ubuntu 24.04 i nowszych: `sudo apt install libfuse2t64`).
Jeśli program się nie uruchamia, zajrzyj do [Rozwiązywania problemów](./troubleshooting#linux).

::: tip Skrót w menu dla AppImage
AppImage nie dodaje się sam do menu aplikacji. Mogą to zrobić narzędzia takie jak **Gear Lever**
lub **AppImageLauncher** – albo użyj pakietu `.deb` opisanego niżej.
:::

### Pakiet Debiana (Ubuntu, Debian, Linux Mint …)

```sh
sudo apt install ./family-insight-<wersja>-linux-amd64.deb
```

Pakiet dodaje **Family Insight** do menu aplikacji (kategoria Biuro) i otwiera pliki `.finsight`
dwuklikiem. Z terminala uruchomisz go poleceniem `family-insight`.

## Aktualizacja {#updating}

Family Insight nie aktualizuje się jeszcze sam. Aby mieć nową wersję, pobierz ją ze
[strony wydań](https://github.com/K-u-r-c/family-insight/releases/latest) i zainstaluj tak samo –
na starą (instalator Windows, `.deb`), zastępując aplikację w folderze Aplikacje (macOS) albo stary
plik AppImage. Twoje drzewa to osobne pliki i nic się z nimi nie dzieje; ustawienia zostają.

## Odinstalowanie {#uninstalling}

| System              | Jak                                                                                |
| ------------------- | ---------------------------------------------------------------------------------- |
| Windows             | **Ustawienia → Aplikacje → Zainstalowane aplikacje → Family Insight → Odinstaluj** |
| Windows (przenośna) | Usuń plik `.exe`                                                                   |
| macOS               | Przeciągnij **Family Insight** z folderu Aplikacje do Kosza                        |
| Linux (AppImage)    | Usuń plik `.AppImage`                                                              |
| Linux (`.deb`)      | `sudo apt remove family-insight`                                                   |

Odinstalowanie nigdy nie usuwa Twoich plików `.finsight`. Ustawienia, lista ostatnich plików
i kopie do odzyskiwania po awarii zostają w folderze w Twoim profilu; usuń go, jeśli chcesz
skasować wszystko:

| System  | Folder ustawień                                |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |
