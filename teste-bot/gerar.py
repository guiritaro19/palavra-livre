import json,random,re,sys
random.seed(7)
def load(l): return json.load(open(f'data/{l}.json',encoding='utf-8'))
def pick(pool,n,minlen=4):
    pool=[w for w in pool if len(w)>=minlen]
    return random.sample(pool,min(n,len(pool)))
out=[]
def sec(title,words):
    out.append((title,words))
pt=load('pt'); S=set(pt)
common=['casa','amor','tempo','mulher','trabalho','escola','cachorro','bonito','computador','felicidade']
sec('PT-A Controle (palavras comuns: devem ser aceitas)',common)
sec('PT-B Conjugações do condicional/futuro (-ria, -ríamos, -ríeis)',pick([w for w in pt if re.search(r'(aria|eria|iria|aríamos|eríamos|iríamos|aríeis|eríeis|iríeis)$',w)],8))
sec('PT-C Futuro do subjuntivo e mais-que-perfeito (-ássemos, -ávamos, -êssemos)',pick([w for w in pt if re.search(r'(ássemos|êssemos|íssemos|áramos|êramos|íramos)$',w)],6))
sec('PT-D Superlativos -íssimo / -érrimo e diminutivos raros',pick([w for w in pt if re.search(r'(íssimo|íssima|érrimo|zinhos|zitos)$',w)],6))
sec('PT-E Substantivos e adjetivos raros terminados em -lo/-la',pick([w for w in pt if re.search(r'(lo|la|los|las)$',w) and len(w)>9],5))
sec('PT-F Palavras longas (>=18 letras)',pick([w for w in pt if len(w)>=18],6))
sec('PT-G Nomes próprios e topônimos escritos em minúscula',['brasil','saopaulo','riodejaneiro','saojosedoscampos','portugal','amazonas'])
sec('PT-H Expressões coladas (sem espaço/hífen)',['acucardebeterraba','açúcardebeterraba','guardachuva','arcoiris','paraquedas','bemvindo'])
sec('PT-I Palavras raras do dicionário ortográfico (stems incomuns)',pick([w for w in pt if len(w)>=7 and not re.search(r'(r|s|m|va|ia)$',w)],6))
sec('PT-J Pares com e sem acento (o bot parece exigir o acento correto)',['ostentaríeis','ostentarieis','edificaríeis','edificarieis','você','voce'])
es=load('es')
sec('ES-A Controle (comuns)',['casa','amor','tiempo','mujer','trabajo','escuela','perro','bonito'])
sec('ES-B Condicional/imperfecto subjuntivo raros',pick([w for w in es if re.search(r'(aríais|eríais|iríais|ásemos|ésemos|iésemos|árais|érais)$',w)],6))
sec('ES-C Formas con enclíticos (verbo+pronombre, sin guion)',pick([w for w in es if re.search(r'(melo|noslo|selo|tela|telo)$',w) and len(w)>8],5))
sec('ES-D Palabras largas (>=16)',pick([w for w in es if len(w)>=16],5))
sec('ES-E Raras del diccionario ortográfico',pick([w for w in es if len(w)>=7 and not re.search(r'(r|s|n|a|o)$',w)],5))
with open('teste-bot/probes.md','w',encoding='utf-8') as f:
    f.write('# Teste do Word Bot (/lookup)\n\nPara cada palavra, rode `/lookup word:<palavra>` e marque: `S` se aceitou, `N` se rejeitou ("Not found in any language"), ou anote o idioma que ele mostrar.\n\nEscreva exatamente como está (com acentos).\n\n')
    n=0
    for t,ws in out:
        f.write(f'## {t}\n\n| # | Palavra | Resposta (S/N/idioma) |\n|---|---|---|\n')
        for w in ws:
            n+=1; f.write(f'| {n} | {w} |  |\n')
        f.write('\n')
print(n,'palavras')
