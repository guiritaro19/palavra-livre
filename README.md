# Palavra Livre

Ferramenta local para encontrar palavras pelo início e pelo final em português, espanhol e inglês.

## Abrir

Clique duas vezes em `index.html`. Não precisa instalar nada nem ter internet. Mantenha as pastas `data` e `flags` junto dos arquivos.

Também é possível abrir com `iniciar.cmd`, que usa Node.js para servir em http://127.0.0.1:4177.

## Jogar

- Preencha “Começa com…” ou “Termina com...”. Se preencher ambos, a palavra precisa atender aos dois filtros. Qualquer sequência de letras é aceita. A busca ignora maiúsculas e acentos, mas mantém a grafia original.
- Clique numa palavra para marcá-la como usada. A mesma grafia normalizada sai de todos os idiomas (por exemplo, selecionar `café` também oculta `cafe`).
- Palavras usadas permanecem na sessão desta aba, inclusive após atualizar. As letras pesquisadas não excluem palavras: só o clique faz isso.
- Use os botões de idiomas para filtrar, “Desfazer última” para corrigir um clique e “Nova sessão” para zerar.
- Resultados dos três idiomas aparecem juntos em ordem alfabética. “Mostrar mais” revela os próximos.

## Dicionários e limites

A base inclui entradas e flexões (plurais, conjugações e outras formas) obtidas pelas regras de prefixos, sufixos e continuação dos dicionários Hunspell. Cada forma é conferida pelo validador Spylls antes de entrar na busca, sem geração por IA. São excluídos nomes próprios iniciados em maiúscula, entradas com números/pontuação/espaços e formas proibidas ou válidas apenas dentro de compostos. Não enumeramos compostos arbitrários; a cobertura depende das regras de cada dicionário. Dicionários ortográficos podem conter regionalismos, termos raros e imprecisões; estar na base não garante aceitação pelas regras de qualquer jogo. Não há definições ou revisão editorial individual de cada entrada.

As bandeiras representam o idioma (Brasil, Espanha e Reino Unido), não a etimologia ou exclusividade geográfica da palavra.

Fontes baixadas em 19/10/2026:

- PT, ES, EN: https://github.com/wooorm/dictionaries — `dictionaries/{idioma}/index.dic` e `index.aff`.
- Bandeiras: https://github.com/lipis/flag-icons — `flags/4x3`.

Licenças originais em `licenses/`. O script `download.py` expande as flexões com Python e Spylls 0.1.7 (`python -m pip install --target .vendor spylls==0.1.7`). Os originais ficam em `data/sources`, permitindo reconstruir a base offline depois do primeiro download. `finish-assets.py` atualiza as bandeiras; a aplicação pronta não precisa desse acesso. As bases upstream podem mudar em atualizações.

## Verificação

`node test.cjs` verifica busca, acentos, três idiomas e filtros combinados, exclusão global, paginação e tempo de resposta nas bases reais.

`python validate_expansion.py` confere uma amostra determinística de 1.500 formas por idioma com o analisador completo, independentemente da expansão direta.

## Publicação

Criado por [Leo Yanaguihara](https://github.com/guiritaro19). Projeto estático pronto para Vercel, com nome `palavra-livre`.

A base completa é compactada com gzip e embutida em `data/words.js`; o navegador a descompacta localmente. Use um navegador atual com suporte a DecompressionStream (Chrome, Edge, Firefox ou Safari). Não há backend nem envio das palavras pesquisadas. `node pack-data.cjs` compacta uma base bruta; `download.py` já executa esse passo ao reconstruir.

Licenças dos dicionários e das bandeiras estão em `licenses/`; os fontes originais dos dicionários ficam em `data/sources/`. As licenças próprias desses dados devem ser preservadas ao redistribuir.
