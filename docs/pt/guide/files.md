---
description: Salve e abra árvores genealógicas, salvamento automático, recuperação após falhas, cópias de segurança, arquivos recentes e como levar uma árvore para outro computador.
---

# Salvar e abrir

## O arquivo `.finsight`

Cada árvore genealógica é um único arquivo com a extensão **`.finsight`** – tudo está dentro dele:
pessoas, relações, fontes, fotos e a forma como a árvore estava sendo exibida. Você decide onde ele
fica e pode copiá-lo, fazer cópias de segurança ou enviá-lo por e-mail como qualquer outro
documento.

::: info Versões anteriores
Desde a versão 1.1, um arquivo `.finsight` é um pacote compactado (como um arquivo zip), para que
fotos e documentos digitalizados caibam de forma eficiente: cada imagem é guardada uma só vez,
não importa quantas vezes seja usada. O Family Insight 1.1 abre árvores da versão 1.0 e as salva
no novo formato; **a versão 1.0 não consegue abrir árvores salvas pela 1.1** – atualize o programa
em todos os computadores que você usa (veja [Instalação](./install#updating)).

:::

## Salvar

| Para                  | Faça                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| salvar                | <kbd>Ctrl</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>S</kbd>) ou **☰ → Salvar**                                     |
| salvar com outro nome | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>S</kbd>) ou **☰ → Salvar como…** |

<Screenshot name="file-menu" alt="O menu Arquivo com Nova árvore, Abrir, Salvar, Salvar como, Importar CSV, Importar GEDCOM, Exportar CSV, Exportar GEDCOM, Exportar imagem, Fontes, Locais e Imprimir" />

Na primeira vez que você salva uma árvore nova, escolha uma pasta e um nome (o programa sugere a
pasta Documentos e o nome da árvore). A barra de status na parte de baixo sempre informa se tudo
está salvo:

<Screenshot name="unsaved-status" alt="A barra de status mostrando Alterações não salvas (1)" />

Se você fechar a janela, abrir outra árvore ou sair do programa com alterações não salvas, o
Family Insight pergunta se deve **Salvar**, **Não salvar** ou **Cancelar**.

## Salvamento automático {#autosave}

Depois que uma árvore foi salva em um arquivo, o Family Insight a salva automaticamente
**2 segundos após cada alteração**. Você pode desativar isso nas [configurações](./settings)
(⚙ → **Salvar automaticamente**); nesse caso, salve você mesmo com <kbd>Ctrl</kbd>+<kbd>S</kbd>.

Uma árvore novinha que nunca foi salva não é salva automaticamente – salve-a uma vez para que ela
tenha um arquivo.

## Recuperação após falhas {#crash-recovery}

Enquanto uma árvore tem alterações não salvas (por exemplo, uma árvore nova ou com o salvamento
automático desativado), o Family Insight mantém uma cópia de recuperação oculta, atualizada
2 segundos após cada alteração. Se o programa ou o computador travar, na próxima vez que você
abrir o programa ele oferece restaurar esse trabalho:

<Screenshot name="recovery" alt="A janela Restaurar o trabalho não salvo? listando a árvore Kowalscy, nunca salva, com os botões Restaurar e Descartar tudo" />

Clique em **Restaurar** para abrir a árvore como estava e depois salve-a. **Descartar tudo** joga
as cópias fora. As cópias de recuperação são excluídas assim que a árvore é salva ou fechada
normalmente.

## Cópias de segurança {#backups}

Sempre que você salva **manualmente** (<kbd>Ctrl</kbd>+<kbd>S</kbd> ou **Salvar**), a versão
anterior do arquivo é guardada ao lado dele como `nome.finsight.bak1`. As versões mais antigas
passam para `.bak2` … `.bak5`, então os últimos cinco salvamentos manuais estão sempre lá. O
salvamento automático não cria cópias de segurança.

Para voltar a uma versão mais antiga:

1. Feche a árvore no Family Insight.
2. No gerenciador de arquivos, encontre a pasta com a árvore e faça uma cópia da cópia de segurança
   desejada, por exemplo `Kowalscy.finsight.bak2`.
3. Renomeie a cópia para que termine em `.finsight`, por exemplo `Kowalscy (antiga).finsight` (o
   sistema pode perguntar se você quer mesmo mudar a extensão – confirme).
4. Abra-a no Family Insight.

::: tip Não está vendo as extensões?
O Windows e o macOS ocultam as extensões de arquivo por padrão. No Windows, no Explorador de
Arquivos, escolha **Exibir → Mostrar → Extensões de nomes de arquivos**; no macOS, no Finder,
escolha **Finder → Ajustes → Avançado → Mostrar todas as extensões de nome de arquivo**.

:::

## Abrir uma árvore {#opening}

- **☰ → Abrir…** ou <kbd>Ctrl</kbd>+<kbd>O</kbd> (<kbd>⌘</kbd>+<kbd>O</kbd>), ou **Abrir árvore…**
  na tela de boas-vindas;
- **clique duplo** em um arquivo `.finsight` (depois de instalar com o instalador do Windows, o app
  do macOS ou o pacote `.deb`);
- **arraste** um arquivo `.finsight` para a janela do Family Insight – arrastar um arquivo `.csv`
  inicia uma [importação de CSV](./csv-import);
- **Arquivo → Abrir recente** na barra de menus, ou a lista **Recentes** na tela de boas-vindas.

<Screenshot name="welcome-recent" alt="A tela de boas-vindas com a lista Recentes: uma árvore aberta há 2 horas e outra riscada como Arquivo não encontrado" />

Os arquivos que foram movidos ou excluídos aparecem riscados na lista de recentes; remova-os com
**×**.

Se um arquivo não puder ser aberto, o Family Insight explica o motivo – por exemplo, que ele foi
salvo por uma versão mais recente (atualize o programa, veja [Instalação](./install#updating)) ou
que está danificado (experimente uma [cópia de segurança](#backups)).

## Levar uma árvore para outro computador

Copie o arquivo `.finsight` – em um pen drive, por e-mail ou por uma pasta na nuvem – e abra-o com
o Family Insight no outro computador. As fotos estão dentro do arquivo, então não é preciso mais
nada.

::: warning Trabalhar na mesma árvore em dois lugares
O Family Insight não mescla alterações. Se você guarda a árvore em uma pasta compartilhada ou
sincronizada, mantenha-a aberta em um computador de cada vez.

:::
