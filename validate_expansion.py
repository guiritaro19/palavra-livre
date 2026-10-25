import sys, json, random, pathlib, time
ROOT=pathlib.Path(__file__).parent
sys.path.insert(0,str(ROOT/'.vendor'))
from spylls.hunspell import Dictionary
codes=sys.argv[1:] or ['pt','es','en']
for code in codes:
    start=time.monotonic()
    words=json.loads((ROOT/'data'/f'{code}.json').read_text(encoding='utf-8'))
    dictionary=Dictionary.from_files(str(ROOT/'data'/'sources'/code))
    sample=random.Random(42).sample(words,min(1500,len(words)))
    invalid=[word for word in sample if next(dictionary.lookuper.good_forms(word,capitalization=False,compound_forms=False),None) is None]
    assert not invalid, f'{code}: formas rejeitadas pelo validador completo: {invalid[:30]}'
    print(f'{code}: {len(sample)} formas conferidas pelo validador completo ({time.monotonic()-start:.1f}s)',flush=True)
print('Amostras dos dicionários aprovadas.')
