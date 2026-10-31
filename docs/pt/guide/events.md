---
description: Registre eventos de vida – batismo, escolas, empregos, mudanças, serviço militar, sepultamento e eventos próprios – com datas, períodos e locais.
---

# Eventos de vida

Além do nascimento e do falecimento, uma vida é cheia de outros momentos que vale a pena
registrar: um batismo, a escola e a faculdade, empregos, a mudança para outra cidade ou outro
país, o serviço militar, um sepultamento. O Family Insight os chama de **eventos de vida**.

## Adicionar um evento

1. Selecione a pessoa e clique em **Editar**.
2. Role até **Eventos de vida** e clique em **Adicionar evento**.
3. Escolha o tipo de evento. Eles estão agrupados em eventos religiosos; trabalho, estudos e
   serviço; mudanças e residência; e outros:

<Screenshot name="events-menu" alt="O menu Adicionar evento com os tipos de evento agrupados em Religiosos, Trabalho, estudos e serviço, Mudanças e residência e Outros" />

O novo evento se abre na hora, com o cursor no campo da data.

## Preencher os detalhes

<Screenshot name="events-editor" alt="Eventos de vida no editor: Batismo e Serviço militar; o serviço militar está aberto com tipo, data de início, data de fim (3) e local; botões para editar (1) e mover para cima (2)" />

- **Tipo** – mude o tipo de evento a qualquer momento. Em **Outro evento**, digite um nome próprio
  (por exemplo, _Peregrinação_).
- **Data (ou início)** e **Data de fim (opcional)** – uma única data ou um período, como o serviço
  militar de 1914 a 1918. As datas funcionam como em todo o programa: `1914`, `05/1914`, `~1914`
  ([mais sobre datas](./editing#dates)).
- **Local** – as sugestões vêm dos locais já usados na árvore.
- **Descrição** – um detalhe curto: a profissão, a escola, o regimento, o navio.
- **Notas** – qualquer outra coisa.

Cada campo é salvo quando você sai dele. Clique no título de um evento ou no lápis (1) para
abri-lo ou fechá-lo.

## Ordenar e excluir

- As setas (2) movem um evento para cima ou para baixo. A ordem que você escolher é mantida; na
  linha do tempo da pessoa, os eventos são ordenados por data de qualquer forma.
- A lixeira remove um evento. Aparece uma mensagem com **Desfazer** – e, como qualquer alteração,
  ela também pode ser desfeita com <kbd>Ctrl</kbd>+<kbd>Z</kbd>.

## Onde os eventos aparecem

- **Detalhes e linha do tempo** – a lista **Vida** da pessoa mostra os eventos com o ícone, a data
  ou o período e o local, entre o nascimento e o falecimento. Sepultamento e cremação vêm depois do
  falecimento.

  <Screenshot name="events-details" alt="A linha do tempo da vida de Jan Kowalski: nascimento, batismo, serviço militar 1944–1945, formação 1946–1951 e profissão 1951–1990" />

- **Pesquisa** – os locais e as descrições dos eventos podem ser pesquisados: pesquise _Hamburg_
  para encontrar todas as pessoas que emigraram por Hamburgo.
- **Estatísticas** – os eventos de vida e os locais de eventos mais comuns, e quantas pessoas
  ainda não têm eventos ([Estatísticas](./statistics)).

## Avisos

Como as outras datas, os eventos recebem avisos discretos quando algo parece errado – eles nunca
bloqueiam você:

- _Um evento de … tem data anterior ao nascimento._
- _Um evento de … tem data posterior ao falecimento._ (Sepultamento e cremação não geram aviso.)
- _Este evento termina antes de começar._

::: info CSV e versões anteriores
Os eventos de vida são salvos no arquivo `.finsight`. As exportações CSV têm uma linha por pessoa e
não incluem eventos. Desde a versão 1.1, as árvores são salvas em um formato de arquivo mais novo,
com espaço para eventos: o Family Insight 1.0 não consegue abri-las e pede que você atualize o
programa.

:::
