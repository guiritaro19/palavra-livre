# Palavra Livre

## Platform
Web local. Ferramenta recreativa para auxiliar jogos de palavras.

## Escopo confirmado
Busca por começo e final em português, espanhol, inglês e indonésio. Os filtros são opcionais e se combinam quando preenchidos. Resultados em ordem alfabética, com paginação. Palavras de dicionário, identificação por bandeira e exclusão das palavras selecionadas ao longo da sessão.

## Decisões de implementação
HTML, CSS e JavaScript sem instalação. Dicionários incorporados para busca offline. Sessão por aba com sessionStorage. Filtro sem acentos e exclusão global pela grafia normalizada. Publicação no GitHub e Vercel.

## Flexões
A base inclui plurais e conjugações permitidos pelos arquivos .aff originais, com validação de cada forma pelo Spylls. Busca e memória continuam no navegador.

## Complementos de vocabulário
Inglês une Hunspell à lista pública do solver, sem remover entradas originais. Português inclui as duas adições observadas no Word Bot e rejeições exatas documentadas. Indonésio usa o Hunspell de shuLhan. Ver data/SOURCES.md. Não há garantia de equivalência com o dicionário do Roblox.
