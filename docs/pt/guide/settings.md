---
description: Mude o idioma, o tema, o tamanho dos cartões e o salvamento automático do Family Insight, e saiba onde ficam as configurações e como redefini-las.
---

# Configurações

Clique no botão **Configurações** (⚙) à direita da barra de ferramentas:

<Screenshot name="settings-menu" alt="O menu de configurações com Tema (Sistema, Claro, Escuro), Estilo (Moderno, Tapeçaria), Idioma (English, Polski, Deutsch, Français, Español, Italiano, Português, Русский), Cartões (Confortável, Compacto) e Salvar automaticamente" />

| Configuração                               | Opções                                                                    | O que faz                                                                                                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tema**                                   | Sistema, Claro, Escuro                                                    | As cores do programa. **Sistema** acompanha o modo claro ou escuro do seu computador.                                                                                                                                                           |
| **Estilo**                                 | Moderno, Tapeçaria                                                        | A aparência do programa inteiro. **Tapeçaria** lembra uma antiga tapeçaria de família: pergaminho e tinta no tema claro, verde-escuro e dourado no escuro.                                                                                      |
| **Idioma**                                 | English, Polski, Deutsch, Français, Español, Italiano, Português, Русский | O idioma do programa inteiro, incluindo a barra de menus e as caixas de diálogo. Muda na hora.                                                                                                                                                  |
| **Cartões**                                | Confortável, Compacto                                                     | O tamanho dos cartões na árvore. Os cartões compactos cabem mais pessoas na tela e no papel.                                                                                                                                                    |
| **Salvar automaticamente**                 | ativado (padrão) / desativado                                             | [Salvamento automático](./files#autosave) das árvores que já têm um arquivo.                                                                                                                                                                    |
| **Verificar atualizações automaticamente** | ativado (padrão) / desativado                                             | Uma verificação diária de novas versões ([Atualizações](./updates)); **Verificar agora…** verifica na hora.                                                                                                                                     |
| **Carregar mapas da internet**             | desativado (padrão) / ativado                                             | Baixa o fundo do mapa do OpenStreetMap enquanto você usa o [mapa](./map#online).                                                                                                                                                                |
| **Pesquisar locais na internet**           | desativado (padrão) / ativado                                             | Permite que **Pesquisar na internet** envie o nome de um local ao OpenStreetMap para encontrar as coordenadas dele ([Locais](./places#lookup)).                                                                                                 |
| **Mostrar dicas**                          | ativado (padrão) / desativado                                             | Uma dica curta na primeira vez que você abre uma função (o mapa, a calculadora de parentesco, as fontes, as estatísticas…). **Redefinir dicas e visitas guiadas** mostra de novo todas as dicas e a [visita guiada](./main-window#guided-tour). |

O estilo também pode ser mudado na barra de menus: **Exibir → Estilo**. No estilo Tapeçaria, as pessoas da árvore são medalhões emoldurados com o retrato acima do nome, os parceiros são unidos por um pequeno nó e as linhas parecem fios de ouro.

<Screenshot name="tapestry-tree" alt="A família de exemplo no estilo Tapeçaria: o sobrenome num título emoldurado acima da árvore, as pessoas como medalhões emoldurados unidos por fios de ouro" />

O tema e o idioma também podem ser mudados na tela de boas-vindas (canto superior direito) e no
menu **Exibir** da barra de menus. O menu **Exibir** também mostra ou oculta a lista de pessoas e o
mapa geral.

O Family Insight lembra mais coisas para você: o tamanho e a posição da janela, a largura dos
painéis, o separador CSV que você usou por último e os [arquivos recentes](./files#opening).

::: tip O separador CSV acompanha o idioma
Quando você muda o idioma no menu **Exibir**, o separador CSV padrão muda junto – ponto e vírgula
para português (e para os outros idiomas com vírgula decimal), vírgula para inglês. Você sempre
pode escolher outro ao [exportar](./csv-export).

:::

## Onde as configurações ficam guardadas

As configurações são salvas em um pequeno arquivo, `settings.json`, no seu perfil de usuário –
separado das suas árvores:

| Sistema | Pasta                                          |
| ------- | ---------------------------------------------- |
| Windows | `%APPDATA%\Family Insight`                     |
| macOS   | `~/Library/Application Support/Family Insight` |
| Linux   | `~/.config/Family Insight`                     |

## Redefinir as configurações

Feche o Family Insight e exclua o `settings.json` dessa pasta. Na próxima vez que você abrir o
programa, ele usará as configurações padrão (e o idioma do seu sistema). As suas árvores não são
afetadas.
