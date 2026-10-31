---
description: Edite uma pessoa – prenomes e sobrenome de nascimento, datas incompletas e aproximadas, locais, situação de vida, foto e notas.
---

# Editar uma pessoa

Selecione uma pessoa e clique em **Editar** no painel de detalhes – ou dê um clique duplo no
cartão dela, ou selecione-o e pressione <kbd>Enter</kbd>. O painel passa a mostrar o editor:

<Screenshot name="person-editor" alt="O editor de Piotr Kowalski com a foto, os nomes, o sexo e a data de nascimento" />

Cada campo é salvo assim que você sai dele (<kbd>Tab</kbd> ou um clique em outro lugar);
<kbd>Esc</kbd> desfaz o que você digitou no campo atual. Clique em **Concluído** para voltar aos
detalhes.

## Nomes

- **Prenomes** – todos os prenomes, por exemplo `Ana Maria`.
- **Sobrenome** – o sobrenome atual.
- **Sobrenome de nascimento** – o sobrenome ao nascer (nome de solteira). Clique em
  **Adicionar sobrenome de nascimento** para mostrar o campo. Na árvore e nas listas, ele aparece
  como “nasc. Wiśniewska”.
- **Sexo** – feminino, masculino, outro ou desconhecido. Define a cor do cartão e ajuda ao
  adicionar parentes.

::: tip Nomes de outros países {#name-conventions}

- **Brasileiros e portugueses**: todos os sobrenomes vão no campo do sobrenome –
  `Santos Silva`, `Pereira da Costa`.
- **Espanhóis**: os dois sobrenomes também vão no campo do sobrenome – `García Márquez`.
- **Russos, ucranianos, bielorrussos**: escreva o patronímico junto com os prenomes – prenomes
  `Иван Петрович`, sobrenome `Иванов`.
- **Partículas** como de, da, do, dos, das, von, van ou di fazem parte do sobrenome
  (`da Silva`, `van der Berg`); na ordenação, a lista as ignora.

:::

## Datas {#dates}

Os registros antigos raramente são precisos, por isso as datas podem ser incompletas ou
aproximadas. Digite a data no campo; a linha abaixo dele mostra como o Family Insight a entendeu.

<Screenshot name="date-field" alt="O campo da data de nascimento com o texto ~1955 (1) e a lista de precisão (2)" />

| Você digita                                   | Significado  | Mostrado em português | Mostrado em inglês |
| --------------------------------------------- | ------------ | --------------------- | ------------------ |
| `1890`                                        | só o ano     | 1890                  | 1890               |
| `05/1890` ou `1890-05`                        | mês e ano    | maio de 1890          | May 1890           |
| `12/05/1890` ou `1890-05-12`                  | um dia exato | 12 de maio de 1890    | 12 May 1890        |
| `12.05.1890`                                  | um dia exato | 12 de maio de 1890    | 12 May 1890        |
| `maio de 1890`, `maio 1890`, `May 1890`       | mês e ano    | maio de 1890          | May 1890           |
| `12 de maio de 1890`, `12 maio 1890`          | um dia exato | 12 de maio de 1890    | 12 May 1890        |
| `~1890`, `por volta de 1890`, `cerca de 1890` | aproximada   | por volta de 1890     | about 1890         |
| `<1890`, `antes de 1890`                      | antes        | antes de 1890         | before 1890        |
| `>1890`, `depois de 1890`, `após 1890`        | depois       | depois de 1890        | after 1890         |

Os nomes dos meses e palavras como _cerca de_ e _antes de_ podem ser digitados em qualquer um dos
idiomas do programa e em qualquer forma (`12 May 1890`, `12. Mai 1890`, `1er mai 1890`,
`12 de mayo de 1890`, `около 1890`), também abreviados (`set. 1890`).

Bom saber:

- Com pontos e barras, o dia vem primeiro: `05/06/1890` é **5 de junho** de 1890.
- A **lista de precisão** ao lado do campo (**Exatamente**, **Cerca de**, **Antes de**,
  **Depois de**) faz o mesmo que digitar `~`, `<` ou `>`.
- `abt`, `bef`, `aft`, `circa`, `c.` e `ca.` – as abreviações usadas em genealogia – também
  funcionam.
- Uma data que não pode ser entendida aparece em vermelho com um exemplo do que funciona; ela não
  é salva até ser corrigida.
- As idades são calculadas a partir das datas. Quando uma data é incompleta ou aproximada, a idade
  aparece como “cerca de …”.

## Locais

Digite a cidade ou o povoado de nascimento e de falecimento. Os locais que você já usou na árvore
são sugeridos enquanto você digita, para que o mesmo local seja sempre escrito da mesma forma – o
que também torna as [estatísticas](./statistics) e a [pesquisa](./search) mais úteis.

## Situação de vida {#life-status}

Escolha **Vivo(a)**, **Falecido(a)** ou **Não se sabe**. Para pessoas vivas, a data e o local de
falecimento ficam ocultos. Se você digitar uma data ou um local de falecimento com a situação
desconhecida, a pessoa é considerada falecida.

## Foto {#photo}

Clique em **Adicionar foto…** e escolha uma imagem, ou arraste um arquivo de imagem para o círculo.
Os formatos compatíveis são **JPG, PNG e WebP** até 20 MB (fotos HEIC de iPhone precisam ser
convertidas antes). Abre-se uma janela de recorte: arraste a imagem para posicionar o rosto,
amplie com a barra e clique em **Usar foto**.

<Screenshot name="photo-crop" alt="A caixa de diálogo Recortar a foto com uma moldura redonda, uma barra de zoom e o botão Usar foto" />

A foto é guardada **dentro do arquivo `.finsight`** (redimensionada para 512 × 512 pixels), então a
árvore continua sendo um único arquivo que você pode copiar para qualquer lugar. Use **Alterar…**
ou **Remover** embaixo da foto para substituí-la ou excluí-la. Uma imagem da galeria da pessoa
também pode virar o retrato (**⋯ → Usar como retrato…**, veja [Fotos e documentos](./media)).

## Eventos de vida

Batismo, escolas, empregos, mudanças, serviço militar, sepultamento … são registrados na seção
**Eventos de vida** do editor. Veja [Eventos de vida](./events).

## Fontes

O pequeno botão de fontes ao lado de **Nome**, **Nascimento**, **Vida** e de cada evento de vida
registra de onde vem uma informação. Veja [Fontes](./sources).

## Notas

Tudo o que vale a pena lembrar – profissão, histórias, onde um documento está guardado. As notas
aparecem no painel de detalhes e são incluídas nas [exportações CSV](./csv-export).

## Avisos {#warnings}

O Family Insight avisa sobre dados que provavelmente são um erro – mas nunca impede que você os
salve:

| Aviso                                                    | Quando                                               |
| -------------------------------------------------------- | ---------------------------------------------------- |
| _A data de falecimento é anterior à data de nascimento._ | a data de falecimento é anterior à de nascimento     |
| _Assim, … teria … anos. A data está correta?_            | a pessoa teria mais de 120 anos                      |
| _… nasceu depois de …, mas consta como pai ou mãe._      | um pai ou mãe biológico não é mais velho que o filho |
