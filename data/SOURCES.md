# Proveniência do vocabulário

Atualizado em 31/10/2026.

- PT, ES e EN originais: wooorm/dictionaries; regras e fontes Hunspell preservadas em sources/.
- ID: https://github.com/shuLhan/hunspell-id; fontes id.dic e id.aff já existentes no repositório, expandidas pelo download.py e conferidas com Spylls 0.1.7. Cabeçalhos SPDX indicam LGPL-3.0-only. A referência anteriormente guardada em licenses/id.txt é o README; o texto da licença é preservado separadamente.
- EN complementar: https://ancestrychanged.com/scripts/ftw_words.txt, obtido em 31/10/2026, 138602 linhas únicas, SHA256 DDA1E6335E689972FD55173FE6D264311D62CD4DFD0733101B50DC940AAFA3FB. A whitelist do mesmo solver estava byte a byte idêntica. A licença e a origem editorial desta lista não foram identificadas; acesso público não comprova licença aberta. Inclusão solicitada pelo proprietário do Palavra Livre. A lista não comprova aceitação de cada entrada no jogo.
- PT complementar: saojosedoscampos aceito no /lookup do Word Bot e açúcardebeterraba exibido no /prefix, conforme evidências fornecidas pelo usuário. A busca existente já ignora acentos. Não foi importado um dicionário externo inteiro com base em suposição de origem.
- PT rejeições: grafias exatas inconstitucionalissimamente e edificarieis, rejeitadas pelo /lookup nos registros fornecidos. A grafia acentuada edificaríeis não foi removida sem teste específico.

## Pistas sobre o português do bot

São José dos Campos consta no Wikcionário: https://pt.wiktionary.org/wiki/São_José_dos_Campos . Açúcar de beterraba pode ser uma expressão concatenada; o Glosbe atribui a forma açúcardebeterraba ao FreeDict: https://pt.glosbe.com/en/pt/beetroot%20sugar . São pistas de listas derivadas de dicionários com remoção de espaços/hífens, não identificação confirmada da fonte do bot.

Contagens maiores ou validação ortográfica não garantem compatibilidade com o jogo. Apenas rejeições documentadas devem ser removidas; plurais/conjugações adicionais não são todos necessariamente aceitos pelo bot.
