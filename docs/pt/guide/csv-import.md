---
description: Importe uma árvore genealógica do Excel, LibreOffice ou Google Sheets – prepare a planilha, confira a pré-visualização e corrija os erros mais comuns.
---

# Importar de CSV

A sua família já está em uma planilha? O Family Insight consegue lê-la a partir de um arquivo
**CSV** – o formato que qualquer programa de planilhas consegue salvar.

## 1. Prepare a planilha

Use **uma linha por pessoa** e estas colunas (em qualquer ordem, com os nomes em inglês ou em
português):

| Coluna                       | Nome em português                             | O que escrever                                                              |
| ---------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| `id` **(obrigatória)**       | `id`                                          | qualquer rótulo curto e único para a pessoa, por exemplo `p1`, `p2` …       |
| `given_names`                | `nomes`                                       | prenomes                                                                    |
| `surname`                    | `sobrenome`                                   | sobrenome                                                                   |
| `birth_surname`              | `sobrenome_de_nascimento`                     | sobrenome de nascimento (de solteira)                                       |
| `sex`                        | `sexo`                                        | `mulher` / `homem` (ou `F`, `M`, `feminino`, `masculino`, `female`, `male`) |
| `birth_date`, `death_date`   | `data_de_nascimento`, `data_de_falecimento`   | `1890`, `05/1890`, `12/05/1890`, `~1890` … ([datas](./editing#dates))       |
| `birth_place`, `death_place` | `local_de_nascimento`, `local_de_falecimento` | a cidade ou o povoado                                                       |
| `living`                     | `vivo`                                        | `sim` / `não` (ou `yes` / `no`)                                             |
| `father_id`, `mother_id`     | `pai_id`, `mae_id`                            | o **id** do pai e da mãe                                                    |
| `partner_ids`                | `parceiros_id`                                | os **ids** dos parceiros, separados por `\|` – por exemplo `p2\|p5`         |
| `notes`                      | `notas`                                       | qualquer outra coisa                                                        |

Os nomes de colunas e os valores em **polonês, alemão, francês, espanhol, italiano e russo**
também funcionam (por exemplo `imiona`, `vornamen`, `nom`, `fecha_de_nacimiento`, `фамилия`;
`kobieta`, `männlich`, `oui`, `да`) – todos os nomes estão listados na
[referência do formato CSV](/developer/reference/csv-format#columns). Para patronímicos e
sobrenomes duplos, veja [nomes de outros países](./editing#name-conventions).

Cada pessoa precisa de um **id** e de pelo menos um prenome ou um sobrenome; todas as outras
colunas são opcionais. Os parentes são ligados pelos ids – por exemplo, `p3` com `father_id` `p1`
e `mother_id` `p2` é filho ou filha de `p1` e `p2`. Uma união só precisa ser indicada de um dos
lados.

::: tip Comece por um exemplo
Baixe um exemplo com 25 pessoas – [nomes de colunas em inglês](/samples/example-en.csv) ou
[nomes de colunas em polonês](/samples/example-pl.csv) – ou um modelo vazio do Family Insight:
**Ajuda → Salvar modelo CSV…** (com os nomes das colunas em português). A especificação completa
está na [referência do formato CSV](/developer/reference/csv-format).

:::

## 2. Salve como CSV

| Programa         | Como                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Microsoft Excel  | **Arquivo → Salvar como**, tipo **CSV UTF-8 (Delimitado por vírgulas) (\*.csv)**                 |
| LibreOffice Calc | **Arquivo → Salvar como**, tipo **Texto CSV (.csv)**, conjunto de caracteres **Unicode (UTF-8)** |
| Google Sheets    | **Arquivo → Fazer download → Valores separados por vírgula (.csv)**                              |

Vírgulas, pontos e vírgulas e tabulações funcionam como separadores. Arquivos que não foram salvos
em UTF-8 (o tipo **CSV** simples das versões mais antigas do Excel) também funcionam: o Family
Insight reconhece pelas letras o texto da Europa Ocidental (Windows-1252, o usado pelo Excel em
português), da Europa Central (Windows-1250) e cirílico (Windows-1251).

## 3. Importe

Na tela de boas-vindas, clique em **Importar de CSV…** ou, com uma árvore aberta, escolha
**☰ → Importar CSV…**. Você também pode arrastar o arquivo `.csv` para a janela. Antes de qualquer
alteração, você vê uma pré-visualização:

<Screenshot name="csv-import" alt="A pré-visualização da importação: o separador e a codificação detectados, as colunas com a forma como cada uma é importada, uma pré-visualização das primeiras linhas e o botão Importar" />

- No topo: o **separador e a codificação do texto** que foram detectados.
- **Conjunto de caracteres** – se letras como ç, ã, ö ou ж aparecerem erradas na
  pré-visualização, escolha outro aqui (aparece para arquivos lidos do disco; o detectado vem
  marcado).
- **Colunas** – como cada coluna do seu arquivo será usada. Se uma coluna não foi reconhecida (por
  exemplo, porque se chama “Primeiro nome”), escolha o significado certo na lista, ou
  **Não importar** para ignorá-la.
- **Pré-visualização** – as primeiras linhas como o Family Insight as entendeu.
- Na parte de baixo: quantas pessoas e relações serão importadas.

<Screenshot name="csv-import-columns" alt="A tabela Colunas: coluna no arquivo, importada como (uma lista) e o valor da primeira linha" />

Quando já há uma árvore aberta, escolha se quer importar para **Uma árvore nova** ou para
**A árvore atual**. Importar para a árvore atual adiciona todas as pessoas do arquivo como pessoas
novas (elas não são comparadas com as pessoas que já estão na árvore) – um único passo que você
pode [desfazer](./undo).

Clique em **Importar**. Uma árvore nova criada a partir de um arquivo CSV ainda não tem arquivo
próprio – [salve-a](./files) para guardá-la.

## Problemas e avisos {#problems}

Os **problemas** (em vermelho) precisam ser corrigidos antes de importar – corrija-os na planilha
(ou altere o mapeamento das colunas) e importe novamente. Os **avisos** (em amarelo) explicam o que
vai acontecer; você pode importar mesmo assim. Cada mensagem informa a linha a que se refere.

<Screenshot name="csv-import-errors" alt="A pré-visualização da importação com 2 problemas: Linha 4 – o id p2 é usado mais de uma vez; Linha 5 – faz referência a p9, mas não há nenhuma linha com esse id" />

### Problemas que bloqueiam a importação

| Mensagem                                                          | Como corrigir                                                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| _O arquivo está vazio._                                           | Escolha o arquivo certo ou verifique se a planilha foi salva com dados.                                         |
| _O arquivo não tem a coluna “id”…_                                | Adicione uma coluna `id` com um rótulo único para cada pessoa.                                                  |
| _O arquivo não tem colunas de nome (“given_names” ou “surname”)._ | Adicione uma coluna `given_names` ou `surname` (ou `nomes`, `sobrenome`) ou associe uma coluna existente a ela. |
| _Esta linha não tem id._                                          | Preencha o id nessa linha.                                                                                      |
| _O id “p2” é usado mais de uma vez._                              | Dê a cada pessoa um id diferente.                                                                               |
| _A pessoa “p7” não tem prenomes nem sobrenome._                   | Preencha pelo menos um nome (ou remova a linha vazia).                                                          |
| _Faz referência a “p9”, mas não há nenhuma linha com esse id._    | Corrija o id em `father_id`, `mother_id` ou `partner_ids` ou adicione essa pessoa.                              |
| _A pessoa faz referência a si mesma (“p3”)._                      | Uma pessoa não pode ser pai, mãe ou parceira de si mesma – corrija o id.                                        |
| _Pai e mãe são a mesma pessoa (“p1”)._                            | Corrija `father_id` ou `mother_id`.                                                                             |
| _… seria o seu próprio ascendente._                               | Em algum lugar, um filho aparece como pai ou mãe do próprio ascendente – confira os ids.                        |

### Avisos

| Mensagem                                                                                             | O que acontece                                                                                                    |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| _A coluna “…” não é reconhecida e será ignorada._                                                    | A coluna é ignorada – associe-a a um campo se precisar dela.                                                      |
| _“…” não é uma data reconhecida; o valor foi adicionado às notas._                                   | O texto é guardado nas notas da pessoa, para que nada se perca.                                                   |
| _“…” não é um sexo conhecido; importado como desconhecido._                                          | Use `mulher`, `homem`, `outro` ou `desconhecido` (ou as palavras em inglês `female`, `male`, `other`, `unknown`). |
| _“…” não é sim/não; não se sabe se a pessoa está viva._                                              | Use `sim`/`não`, `yes`/`no`, `true`/`false` ou `1`/`0`.                                                           |
| Avisos de data (falecimento antes do nascimento, mais de 120 anos, pai ou mãe mais novo que o filho) | Importado como está escrito – veja [Avisos](./editing#warnings).                                                  |

## O que o CSV não consegue guardar

O CSV guarda nomes, datas, locais, situação de vida, pais biológicos, parceiros e notas. **Fotos,
datas e locais de uniões, vínculos por adoção, por afinidade ou de acolhimento, a pessoa principal
e a visualização** só existem em arquivos `.finsight` – use-os para guardar tudo.
