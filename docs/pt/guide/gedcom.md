---
description: Leve árvores genealógicas entre o Family Insight e outros programas de genealogia com GEDCOM – importe do Gramps, MyHeritage, Ancestry ou FamilySearch, exporte como GEDCOM 5.5.1 ou 7.0.
---

# GEDCOM

**GEDCOM** é o formato de arquivo que os programas de genealogia usam para trocar árvores
genealógicas. O Family Insight lê arquivos GEDCOM 5.5, 5.5.1 e 7.0 (`.ged`, e `.gdz` com as fotos
dentro) e grava nas versões 5.5.1 ou 7.0.

## Importar um arquivo GEDCOM

Escolha **☰ → Importar GEDCOM…** (ou **Arquivo → Importar → GEDCOM…**, ou **Importar de GEDCOM…**
na tela de boas-vindas), ou simplesmente arraste um arquivo `.ged` para a janela. Abre-se uma
pré-visualização:

<Screenshot name="gedcom-import" alt="A janela Importar GEDCOM: GEDCOM 5.5.1 de MyHeritage, o conjunto de caracteres UTF-8 (detectado), um aviso sobre uma data aproximada, as tags que não foram importadas e o resumo com pessoas, famílias, eventos, fontes e mídia" />

- A janela mostra a **versão** e o **programa** que gravou o arquivo, e quantas pessoas, famílias,
  eventos, fontes e fotos ele contém.
- **Conjunto de caracteres** – detectado automaticamente (UTF-8, UTF-16, ANSEL, ANSI,
  Windows-1250, Windows-1251). Se letras como _ã_, _ç_, _ö_ ou _ß_ aparecerem erradas no resultado, escolha
  outro.
- Os **avisos** explicam o que não pôde ser transferido com exatidão – por exemplo, uma data como
  _BET 1850 AND 1855_ ou uma data no calendário juliano. O texto original é guardado nas notas da
  pessoa, então nada se perde.
- **Informações não importadas** lista os detalhes específicos de outros programas para os quais
  o Family Insight não tem lugar (números de registro, IDs internos …), agrupados por tag.
- Com uma árvore aberta, você pode importar para **Uma árvore nova** ou para **A árvore atual**.
  Adicionar à árvore atual é um único passo que pode ser desfeito.

As fotos e os documentos referenciados pelo arquivo são carregados do lugar indicado no arquivo –
ou, se o arquivo vier de outro computador, da pasta do arquivo `.ged` e da pasta `media` dele. Um
arquivo `.gdz` já os traz dentro.

### O que é mantido

Nomes (incluindo sobrenomes de nascimento e de casada), sexo, nascimento e falecimento, eventos de
vida (batismo, sepultamento, emigração, profissão, serviço militar … e eventos personalizados),
notas, fontes e acervos com citações (página, confiabilidade, transcrição), fotos e documentos,
casamentos, noivados e divórcios, pais por adoção, de acolhimento e por afinidade, e as coordenadas
dos locais.

### Vindo de outro programa

| Programa                                  | Como exportar um arquivo GEDCOM                                                                                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gramps**                                | **Árvores genealógicas → Exportar…**, escolha _GEDCOM_.                                                                                                              |
| **MyHeritage**                            | Family Tree Builder: **Arquivo → Exportar para GEDCOM**; no site: **Árvore genealógica → Gerenciar árvores → Exportar para GEDCOM**.                                 |
| **Ancestry**                              | **Trees → (a sua árvore) → Tree settings → Export tree** (o site é em inglês).                                                                                       |
| **FamilySearch**                          | O FamilySearch não exporta a árvore compartilhada inteira; exporte as suas próprias árvores com programas parceiros ou comece por um GEDCOM que alguém compartilhou. |
| **Legacy, RootsMagic, Family Tree Maker** | **File → Export → GEDCOM** (programas em inglês).                                                                                                                    |

## Exportar um arquivo GEDCOM

Escolha **☰ → Exportar GEDCOM…** (ou **Arquivo → Exportar → GEDCOM…**):

<Screenshot name="gedcom-export" alt="A janela Exportar GEDCOM com a versão GEDCOM 5.5.1 ou 7.0, Incluir fotos e documentos, Ocultar pessoas vivas e Incluir notas" />

- **Versão** – a **5.5.1** é lida por quase todos os programas de genealogia; a **7.0** é a versão
  mais recente.
- **Incluir fotos e documentos** – com a 5.5.1, eles são salvos em uma pasta `media` ao lado do
  arquivo GEDCOM; com a 7.0, tudo é compactado em um único arquivo `.gdz`.
- **Ocultar pessoas vivas** – substitui os nomes das pessoas que podem estar vivas por “Pessoa
  viva” e omite os detalhes delas. Use essa opção quando compartilhar a sua árvore com outras
  pessoas.
- **Incluir notas** – deixe desmarcado para compartilhar só as informações.

::: info O que o GEDCOM não consegue guardar
Se alguém está vivo (só o falecimento é registrado), o endereço na web de uma fonte (ele vira uma
linha nas notas da fonte) e as configurações de visualização da sua árvore. Todo o resto volta
quando você importa o arquivo no Family Insight de novo.

:::
