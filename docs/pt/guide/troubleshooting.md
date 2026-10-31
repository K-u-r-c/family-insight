---
description: Soluções para problemas comuns – o programa não inicia, acentos errados no Excel, erros na importação de CSV, arquivos que não abrem – e como relatar um erro.
---

# Solução de problemas

## O programa não inicia

### Windows

| Sintoma                                               | Causa e solução                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Uma janela azul **“O Windows protegeu o computador”** | O SmartScreen ainda não conhece o editor. Clique em **Mais informações → Executar assim mesmo** (veja [Instalação](./install#windows)).    |
| O antivírus bloqueia ou exclui o arquivo              | Baixe o arquivo de novo na [página oficial de versões](https://github.com/K-u-r-c/family-insight/releases/latest) e libere-o no antivírus. |

### macOS

| Sintoma                                                                        | Causa e solução                                                                                                                                                                    |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Não é possível abrir “Family Insight” porque a Apple não pode verificá-lo…** | O app ainda não é autenticado pela Apple. Clique com o botão direito nele em Aplicativos → **Abrir**, ou use **Ajustes do Sistema → Privacidade e Segurança → Abrir Mesmo Assim**. |
| **“Family Insight” está danificado e não pode ser aberto**                     | Quarentena do macOS. Execute `xattr -cr "/Applications/Family Insight.app"` no Terminal uma vez.                                                                                   |
| O app não inicia em um Mac com Apple Silicon                                   | Talvez você tenha a versão para Intel – baixe `mac-arm64.dmg` (veja [Qual arquivo devo baixar?](./install#which-file)).                                                            |

### Linux {#linux}

| Sintoma                                                                      | Causa e solução                                                                                                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nada acontece quando você dá um clique duplo no AppImage                     | O arquivo não é executável: `chmod +x family-insight-*.AppImage`.                                                                                             |
| `dlopen(): error loading libfuse.so.2` / _AppImages require FUSE to run_     | Falta o FUSE 2: `sudo apt install libfuse2` (Ubuntu 24.04 e mais recentes: `libfuse2t64`), ou o pacote `fuse2` / `fuse-libs` em outras distribuições.         |
| _The SUID sandbox helper binary was found, but is not configured correctly…_ | Algumas distribuições (por exemplo, o Ubuntu 24.04) restringem a sandbox que o Electron usa. Instale o pacote `.deb` ou inicie o AppImage com `--no-sandbox`. |
| A janela fica borrada ou piscando no Wayland                                 | Inicie-o com `--ozone-platform=x11` para usar o XWayland.                                                                                                     |

Para ver o que está acontecendo, inicie o programa a partir de um terminal – qualquer mensagem de
erro aparece ali.

## Os acentos aparecem errados no Excel, ou tudo fica em uma coluna

Exporte o CSV de novo e escolha o separador **ponto e vírgula** – o Excel com as configurações
regionais do Brasil ou de Portugal espera esse separador. O arquivo sempre contém uma marca UTF-8,
então letras como ã, ç e é ficam corretas. Veja [Exportar para CSV](./csv-export).

## A importação de CSV mostra problemas

Cada problema informa a linha e o que mudar. A lista completa com as soluções está em
[Importar de CSV → Problemas e avisos](./csv-import#problems).

## Um arquivo não abre

| Mensagem                                                                                        | O que fazer                                                                                 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| _O arquivo não existe mais. Talvez tenha sido movido ou excluído._                              | Encontre o arquivo e abra-o com **Abrir…**; remova a entrada antiga da lista de recentes.   |
| _Não há permissão para acessar este arquivo._                                                   | Copie o arquivo para uma pasta sua (por exemplo, Documentos) e abra a cópia.                |
| _Esta árvore foi salva por uma versão mais recente do Family Insight…_                          | [Atualize o Family Insight](./install#updating).                                            |
| _O arquivo está danificado ou não é uma árvore do Family Insight._                              | Abra uma das [cópias de segurança](./files#backups) (`.bak1` … `.bak5`) ao lado do arquivo. |
| _Este não é um arquivo de árvore do Family Insight._ / _Este tipo de arquivo não é compatível._ | Escolha um arquivo `.finsight`; planilhas são abertas com [Importar de CSV](./csv-import).  |
| _O arquivo contém dados inválidos e não pode ser aberto com segurança._                         | Experimente uma cópia de segurança; se não ajudar, [relate o problema](#report-a-problem).  |

Se o programa fechou inesperadamente, inicie-o de novo – ele oferece
[restaurar o trabalho não salvo](./files#crash-recovery).

## Relatar um problema {#report-a-problem}

Escolha **Ajuda → Relatar um problema…** – isso abre a página de relatos no GitHub (é preciso uma
conta gratuita no GitHub). Inclua, por favor:

- o que você fez, o que esperava e o que aconteceu no lugar;
- a versão (**Ajuda → Sobre o Family Insight**) e o seu sistema (por exemplo, Windows 11,
  macOS 15, Ubuntu 24.04);
- uma captura de tela da mensagem e a saída do terminal, se você iniciou o programa por ele.

Não anexe a sua árvore genealógica publicamente – ela contém dados pessoais. Se for preciso um
arquivo, diga isso no relato e combinaremos uma forma privada de enviá-lo.
