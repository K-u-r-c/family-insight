---
description: Download and install Family Insight on Windows, macOS or Linux, update it and uninstall it.
---

# Installation

Family Insight is free. Download it from the
[releases page on GitHub](https://github.com/K-u-r-c/family-insight/releases/latest) – under
**Assets**, pick the file for your system.

## Which file do I download? {#which-file}

| Your computer                               | File                                               |
| ------------------------------------------- | -------------------------------------------------- |
| Windows 10 or 11                            | `family-insight-<version>-setup.exe` (recommended) |
| Windows, without installing                 | `family-insight-<version>-portable.exe`            |
| Mac with Apple Silicon (M1, M2, M3, M4 …)   | `family-insight-<version>-mac-arm64.dmg`           |
| Mac with an Intel processor                 | `family-insight-<version>-mac-x64.dmg`             |
| Linux (any distribution)                    | `family-insight-<version>-linux-x86_64.AppImage`   |
| Ubuntu, Debian, Linux Mint and other `.deb` | `family-insight-<version>-linux-amd64.deb`         |

::: tip Which Mac do I have?
Open the Apple menu → **About This Mac**. If it says **Chip: Apple M…**, take `mac-arm64`. If it
says **Processor: … Intel**, take `mac-x64`.
:::

::: info Why does my system warn me?
Family Insight is not yet signed with a paid developer certificate, so Windows and macOS don't
recognise the publisher and ask you to confirm the first start. The steps below show how. The
program itself is open source – anyone can check what it does.
:::

## Windows

### Installer (recommended)

1. Download `family-insight-<version>-setup.exe` and open it.
2. If a blue **Windows protected your PC** window (SmartScreen) appears, click **More info** and
   then **Run anyway**.
3. Choose the installer language (English, Polski, Deutsch, Français, Español, Italiano or Português) and follow the steps. You can change the
   installation folder. No administrator rights are needed – the program is installed for your
   user account.
4. Start Family Insight from the **Start menu** or the **desktop shortcut**.

After installation, double-clicking a `.finsight` file opens it in Family Insight.

### Portable version

`family-insight-<version>-portable.exe` runs without installation – for example from a USB stick.
Download it and double-click it (confirm SmartScreen as above). Settings are still stored in your
user profile (see [Uninstalling](#uninstalling)); the portable version doesn't register the
`.finsight` file type.

## macOS

1. Download the `.dmg` file for your Mac (see the table above) and open it.
2. Drag **Family Insight** onto the **Applications** folder in the window that opens.
3. Open **Applications**, **right-click** (or Control-click) **Family Insight** and choose
   **Open**, then **Open** again in the dialog. You only need to do this the first time.

::: warning If macOS doesn't offer “Open”
On recent macOS versions, open **System Settings → Privacy & Security**, scroll down to the
message about Family Insight and click **Open Anyway**.

If macOS says the app **“is damaged and can't be opened”**, open the **Terminal** app and run
this once, then start the program again:

```sh
xattr -cr "/Applications/Family Insight.app"
```

:::

## Linux

### AppImage (any distribution)

The AppImage is a single file that runs without installation.

1. Download `family-insight-<version>-linux-x86_64.AppImage`.
2. Make it executable: in your file manager open **Properties → Permissions** and allow running
   it as a program, or in a terminal:

   ```sh
   chmod +x family-insight-*.AppImage
   ```

3. Double-click the file or run `./family-insight-<version>-linux-x86_64.AppImage`.

AppImages need **FUSE 2**. Most distributions include it; on Ubuntu 22.04 install it with
`sudo apt install libfuse2` (on Ubuntu 24.04 and newer: `sudo apt install libfuse2t64`). If the
program doesn't start, see [Troubleshooting](./troubleshooting#linux).

::: tip A menu entry for the AppImage
An AppImage doesn't add itself to the applications menu. Tools such as **Gear Lever** or
**AppImageLauncher** can do that for you, or use the `.deb` package below.
:::

### Debian package (Ubuntu, Debian, Linux Mint …)

```sh
sudo apt install ./family-insight-<version>-linux-amd64.deb
```

The package adds **Family Insight** to the applications menu (category Office) and opens
`.finsight` files on double-click. From a terminal, start it with `family-insight`.

## Updating {#updating}

Family Insight doesn't update itself yet. To get a new version, download it from the
[releases page](https://github.com/K-u-r-c/family-insight/releases/latest) and install it the same
way – over the old one (Windows installer, `.deb`), by replacing the app in Applications (macOS) or
the old AppImage file. Your trees are separate files and are not touched; your settings are kept.

## Uninstalling {#uninstalling}

| System             | How                                                               |
| ------------------ | ----------------------------------------------------------------- |
| Windows            | **Settings → Apps → Installed apps → Family Insight → Uninstall** |
| Windows (portable) | Delete the `.exe` file                                            |
| macOS              | Drag **Family Insight** from Applications to the Trash            |
| Linux (AppImage)   | Delete the `.AppImage` file                                       |
| Linux (`.deb`)     | `sudo apt remove family-insight`                                  |

Uninstalling never deletes your `.finsight` files. Settings, the list of recent files and crash
recovery copies stay in a folder in your user profile; delete it too if you want to remove
everything:

| System  | Settings folder                                |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |
