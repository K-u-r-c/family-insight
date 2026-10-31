---
description: Exporte a sua árvore genealógica para uma planilha CSV que abre corretamente no Excel, LibreOffice Calc e Google Sheets.
---

# Exportar para CSV

Escolha **☰ → Exportar CSV…** (ou **Arquivo → Exportar → CSV…** na barra de menus):

<Screenshot name="csv-export" alt="A caixa de diálogo Exportar para CSV com o separador de colunas (vírgula ou ponto e vírgula) e os nomes das colunas (English, Polski, Deutsch, Français, Español, Italiano, Português ou Русский)" />

1. **Separador de colunas** – **Vírgula** para a maioria dos programas; **Ponto e vírgula** para o
   Excel com configurações regionais que usam vírgula decimal (Brasil, Portugal e também Polônia,
   Alemanha, França, Espanha, Itália, Rússia …), que, caso contrário, coloca tudo em uma única
   coluna. O padrão acompanha o idioma do programa – em português, ponto e vírgula –, e o Family
   Insight lembra a sua escolha.
2. **Nomes das colunas** – em um dos idiomas do programa: português (`nomes`, `sobrenome` …),
   inglês (`given_names`, `surname` …), polonês (`imiona`, `nazwisko` …) e assim por diante. Os
   valores acompanham os nomes das colunas (`mulher`, `sim` / `não` em português; `female`,
   `true` / `false` em inglês).
3. Clique em **Exportar…** e escolha onde salvar o arquivo. Quando terminar, aparece uma mensagem
   com **Mostrar na pasta**.

O arquivo usa UTF-8 com marca de ordem de bytes (BOM), então as letras acentuadas (á, ã, ç, é, õ …)
aparecem corretamente quando você dá um clique duplo nele no Excel.

## O que é exportado

Uma linha por pessoa, ordenada por data de nascimento, com estas colunas: id, prenomes, sobrenome,
sobrenome de nascimento, sexo, data e local de nascimento, data e local de falecimento, vivo, pai e
mãe (pelo id), parceiros (ids separados por `|`) e notas. As pessoas recebem ids curtos `p1`,
`p2` …, para que o arquivo seja fácil de ler e editar.

**Não são exportados:** fotos, datas e locais de uniões, vínculos por adoção, por afinidade ou de
acolhimento, a pessoa principal e a visualização. Mantenha o arquivo `.finsight` como a sua cópia
principal – o CSV serve para trabalhar com planilhas.

Você pode editar o arquivo e [importá-lo de volta](./csv-import). O formato exato está descrito na
[referência do formato CSV](/developer/reference/csv-format).

## Abrir o arquivo em uma planilha

| Programa         | Dica                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Microsoft Excel  | Dê um clique duplo no arquivo. Se todos os dados estiverem na coluna A, exporte de novo com o separador **ponto e vírgula**. |
| LibreOffice Calc | Abra o arquivo; na janela de importação, escolha **UTF-8** e o separador com que você exportou.                              |
| Google Sheets    | **Arquivo → Importar → Fazer upload**; o separador é detectado automaticamente.                                              |
