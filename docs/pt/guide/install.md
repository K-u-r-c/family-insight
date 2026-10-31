---
description: Baixe e instale o Family Insight no Windows, macOS ou Linux, atualize-o e desinstale-o.
---

# Instalação

O Family Insight é gratuito. Baixe-o na
[página de versões no GitHub](https://github.com/K-u-r-c/family-insight/releases/latest) – em
**Assets**, escolha o arquivo para o seu sistema.

## Qual arquivo devo baixar? {#which-file}

| O seu computador                               | Arquivo                                            |
| ---------------------------------------------- | -------------------------------------------------- |
| Windows 10 ou 11                               | `family-insight-<version>-setup.exe` (recomendado) |
| Windows, sem instalar                          | `family-insight-<version>-portable.exe`            |
| Mac com Apple Silicon (M1, M2, M3, M4 …)       | `family-insight-<version>-mac-arm64.dmg`           |
| Mac com processador Intel                      | `family-insight-<version>-mac-x64.dmg`             |
| Linux (qualquer distribuição)                  | `family-insight-<version>-linux-x86_64.AppImage`   |
| Ubuntu, Debian, Linux Mint e outras com `.deb` | `family-insight-<version>-linux-amd64.deb`         |

::: tip Qual Mac eu tenho?
Abra o menu Apple → **Sobre Este Mac**. Se aparecer **Chip: Apple M…**, use `mac-arm64`. Se
aparecer **Processador: … Intel**, use `mac-x64`.

:::

::: info Por que o meu sistema mostra um aviso?
O Family Insight ainda não é assinado com um certificado de desenvolvedor pago, por isso o Windows
e o macOS não reconhecem o editor e pedem que você confirme a primeira execução. Os passos abaixo
mostram como fazer isso. O programa em si é de código aberto – qualquer pessoa pode verificar o
que ele faz.

:::

## Windows

### Instalador (recomendado)

1. Baixe `family-insight-<version>-setup.exe` e abra-o.
2. Se aparecer uma janela azul **O Windows protegeu o computador** (SmartScreen), clique em
   **Mais informações** e depois em **Executar assim mesmo**.
3. Escolha o idioma do instalador (English, Polski, Deutsch, Français, Español, Italiano, Português ou
   Русский) e siga os passos. Você pode alterar a pasta de instalação. Não são necessários
   direitos de administrador – o programa é instalado para a sua conta de usuário.
4. Inicie o Family Insight pelo **menu Iniciar** ou pelo **atalho na área de trabalho**.

Depois da instalação, um clique duplo em um arquivo `.finsight` abre-o no Family Insight.

### Versão portátil

`family-insight-<version>-portable.exe` funciona sem instalação – por exemplo, a partir de um pen
drive. Baixe-o e dê um clique duplo nele (confirme o SmartScreen como acima). As configurações
continuam guardadas no seu perfil de usuário (veja [Desinstalar](#uninstalling)); a versão
portátil não registra o tipo de arquivo `.finsight`.

## macOS

1. Baixe o arquivo `.dmg` para o seu Mac (veja a tabela acima) e abra-o.
2. Na janela que se abre, arraste o **Family Insight** para a pasta **Aplicativos**.
3. Abra **Aplicativos**, clique com o **botão direito** (ou Control-clique) em **Family Insight**,
   escolha **Abrir** e depois **Abrir** de novo na caixa de diálogo. Isso só é necessário na
   primeira vez.

::: warning Se o macOS não oferecer “Abrir”
Nas versões recentes do macOS, abra **Ajustes do Sistema → Privacidade e Segurança**, role até a
mensagem sobre o Family Insight e clique em **Abrir Mesmo Assim**.

Se o macOS disser que o app **“está danificado e não pode ser aberto”**, abra o app **Terminal**,
execute este comando uma vez e inicie o programa de novo:

```sh
xattr -cr "/Applications/Family Insight.app"
```

:::

## Linux

### AppImage (qualquer distribuição)

O AppImage é um único arquivo que funciona sem instalação.

1. Baixe `family-insight-<version>-linux-x86_64.AppImage`.
2. Torne-o executável: no gerenciador de arquivos, abra **Propriedades → Permissões** e permita
   executá-lo como programa, ou, em um terminal:

   ```sh
   chmod +x family-insight-*.AppImage
   ```

3. Dê um clique duplo no arquivo ou execute `./family-insight-<version>-linux-x86_64.AppImage`.

Os AppImages precisam do **FUSE 2**. A maioria das distribuições já o inclui; no Ubuntu 22.04,
instale-o com `sudo apt install libfuse2` (no Ubuntu 24.04 e mais recentes:
`sudo apt install libfuse2t64`). Se o programa não iniciar, veja
[Solução de problemas](./troubleshooting#linux).

::: tip Um item de menu para o AppImage
Um AppImage não se adiciona sozinho ao menu de aplicativos. Ferramentas como **Gear Lever** ou
**AppImageLauncher** podem fazer isso por você – ou use o pacote `.deb` abaixo.

:::

### Pacote Debian (Ubuntu, Debian, Linux Mint …)

```sh
sudo apt install ./family-insight-<version>-linux-amd64.deb
```

O pacote adiciona o **Family Insight** ao menu de aplicativos (categoria Escritório) e abre
arquivos `.finsight` com um clique duplo. Em um terminal, inicie-o com `family-insight`.

## Atualizar {#updating}

O Family Insight ainda não se atualiza sozinho. Para obter uma nova versão, baixe-a na
[página de versões](https://github.com/K-u-r-c/family-insight/releases/latest) e instale-a da
mesma forma – por cima da antiga (instalador do Windows, `.deb`), substituindo o app em
Aplicativos (macOS) ou o arquivo AppImage antigo. As suas árvores são arquivos separados e não
são afetadas; as suas configurações são mantidas.

## Desinstalar {#uninstalling}

| Sistema            | Como                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------- |
| Windows            | **Configurações → Aplicativos → Aplicativos instalados → Family Insight → Desinstalar** |
| Windows (portátil) | Exclua o arquivo `.exe`                                                                 |
| macOS              | Arraste o **Family Insight** de Aplicativos para o Lixo                                 |
| Linux (AppImage)   | Exclua o arquivo `.AppImage`                                                            |
| Linux (`.deb`)     | `sudo apt remove family-insight`                                                        |

Desinstalar nunca exclui os seus arquivos `.finsight`. As configurações, a lista de arquivos
recentes e as cópias de recuperação após falhas ficam em uma pasta do seu perfil de usuário;
exclua-a também se quiser remover tudo:

| Sistema | Pasta de configurações                         |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |
