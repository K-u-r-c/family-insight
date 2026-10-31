---
description: Perguntas frequentes sobre o Family Insight – privacidade, uso sem internet, tamanho dos arquivos, GEDCOM, compartilhamento e impressão.
---

# Perguntas frequentes

## O Family Insight é gratuito?

Sim. É gratuito e de código aberto (licença MIT), sem anúncios, contas ou assinaturas.

## Onde ficam os meus dados? Eles vão para a internet?

A sua árvore está no arquivo `.finsight` que você salvou – em nenhum outro lugar. O Family Insight
funciona totalmente **sem internet** e nunca envia os seus dados para lugar nenhum. Uma vez por
dia, ele pergunta ao GitHub se há uma nova versão disponível ([atualizações](./updates), pode ser
desativado). Fora isso, ele só se conecta quando você pede: um link como
**Ajuda → Guia do usuário** abre o seu navegador e, se você permitir a
[pesquisa de locais na internet](./places#lookup), **Pesquisar na internet** envia o nome daquele
único local – e nada mais – ao OpenStreetMap; com os [mapas da internet](./map#online) permitidos,
o mapa baixa o fundo (só a área do mapa, nunca os seus dados).

## Como faço uma cópia de segurança da minha árvore?

Copie o arquivo `.finsight` para um pen drive, um HD externo ou uma pasta na nuvem em que você
confie. O Family Insight também guarda automaticamente as últimas cinco versões ao lado do arquivo
([cópias de segurança](./files#backups)).

## Qual pode ser o tamanho de uma árvore? As fotos a deixam enorme?

Árvores com mil pessoas ou mais funcionam sem problemas. Os retratos são reduzidos para 512 × 512
pixels quando você os adiciona, então cada um ocupa só algumas dezenas de kilobytes – uma árvore
com algumas centenas de retratos fica com poucos megabytes e é fácil de enviar por e-mail. As
imagens são guardadas uma só vez dentro do arquivo, não importa quantas vezes sejam usadas, e
salvar continua rápido mesmo quando o arquivo chega a centenas de megabytes.

## Posso abrir uma árvore de outro programa de genealogia (GEDCOM)?

Sim. Exporte um arquivo GEDCOM do outro programa (Gramps, MyHeritage, Ancestry, Legacy …) e use
**☰ → Importar GEDCOM…** – veja [GEDCOM](./gedcom). Da mesma forma, você pode exportar a sua árvore
para outros programas. Dados em planilhas podem entrar por [CSV](./csv-import).

## Como posso compartilhar a árvore com a minha família?

- Envie o arquivo `.finsight` – com o Family Insight, as pessoas podem abri-lo, explorá-lo e
  completá-lo.
- Envie um **PDF ou uma imagem** da árvore para quem não tem o programa
  ([Imagens, PDF e impressão](./export-print)).
- Envie um arquivo **CSV** se quiserem usar uma planilha ([Exportar para CSV](./csv-export)).

O Family Insight não mescla alterações, então combinem quem fica com a cópia principal.

## Várias pessoas podem editar uma árvore ao mesmo tempo?

Não. Mantenha uma cópia principal e passe-a adiante, ou reúna as novidades em uma planilha e
importe-as para a árvore atual.

## Como imprimo uma árvore grande?

Imprima-a em partes (ascendentes ou descendentes de uma pessoa, poucas gerações), use papel A3 ou
exporte um PNG ou SVG grande para uma gráfica. Veja
[Dicas para árvores grandes](./export-print#large-trees).

## Posso registrar adoções, famílias recompostas e divórcios?

Sim – veja [Relações](./relationships).

## Existe uma versão para celular?

Não, o Family Insight é um programa para computador, para Windows, macOS e Linux.

## Posso adicionar outro idioma?

O programa está preparado para mais idiomas, e tradutores são bem-vindos – veja
[Add a language](/developer/howto/language) na documentação para desenvolvedores (em inglês).
