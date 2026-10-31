---
description: Defina a localização dos locais da sua árvore – pesquise na internet (opcional) ou insira as coordenadas – e mescle grafias diferentes do mesmo local.
---

# Locais

Os locais são digitados como texto onde quer que você os insira – nascimento, falecimento, eventos
de vida, casamentos, fotos. **☰ → Locais…** (ou **Editar → Locais…**) reúne todos em uma lista,
para que você possa dar a cada local uma **localização** para o [mapa](./map) e organizar as
grafias.

<Screenshot name="places-manager" alt="A janela Locais: à esquerda, uma lista de locais com a frequência de uso; à direita, Łódź selecionado com as coordenadas, os campos de latitude e longitude, Salvar localização, Pesquisar na internet (1) e Mesclar com outro local" />

A lista mostra cada local com a frequência com que é usado e se tem localização. Locais que só se
diferenciam por maiúsculas, espaços ou acentos (_Kraków_, _Krakow_, _ kraków _ – ou _São Paulo_ e
_Sao Paulo_) contam como um só local; a grafia mais comum é mostrada, e as outras aparecem em
**Também escrito como**.

## Pesquisar uma localização na internet {#lookup}

Clique em **Pesquisar na internet** (1). Na primeira vez, o Family Insight pergunta se pode fazer
isso:

<Screenshot name="places-consent" alt="A pergunta Pesquisar locais na internet?, explicando que só o nome do local é enviado ao OpenStreetMap Nominatim, com Permitir e Cancelar" />

- Só o **nome do local** é enviado – nenhum nome de pessoa, nenhuma data, nada mais – ao
  [OpenStreetMap Nominatim](https://nominatim.org), um serviço gratuito.
- Escolha o resultado certo; as coordenadas dele são salvas com a árvore.
- As respostas ficam guardadas no seu computador, então o mesmo local não é pesquisado duas vezes.
- Você pode desativar isso de novo nas configurações (**⚙ → Pesquisar locais na internet**). Sem
  essa função – ou sem conexão com a internet – todo o resto continua funcionando como antes.

## Inserir as coordenadas você mesmo

Digite a **latitude** e a **longitude** (por exemplo, _50.0619_ e _19.9369_ para Cracóvia – a
vírgula também funciona como separador decimal) e clique em **Salvar localização**. Você pode
copiá-las de qualquer site de mapas. **Remover localização** volta a apagá-las.

## Mesclar grafias

O mesmo povoado muitas vezes é escrito de várias formas – _Cracóvia_, _Krakau_, _Kraków_.
Selecione uma delas, escolha o local em que deve ser mesclada (**Mesclar em**) e clique em
**Mesclar**: todos os nascimentos, falecimentos, eventos, casamentos e fotos passam a usar a
grafia escolhida, e o local fica com uma única localização. Como qualquer alteração, a mesclagem
pode ser desfeita com <kbd>Ctrl</kbd>+<kbd>Z</kbd>.

::: info
As localizações são salvas no arquivo `.finsight`. Os locais em si não mudam – um local sem
localização simplesmente não aparece no mapa.

:::
