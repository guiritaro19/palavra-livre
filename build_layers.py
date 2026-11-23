"""Gera a base em duas camadas para o Palavra Livre.

Camada básica (data/words.js): carregada sempre. Em português só entram formas
frequentes em legendas (OpenSubtitles, via FrequencyWords) ou famílias de raízes
muito frequentes, mais as palavras confirmadas manualmente.
Camada rara (data/extras-pt.js): o restante da expansão Hunspell do português,
carregado apenas quando a pessoa ativa "palavras raras".

Uso: python build_layers.py          (precisa de .vendor/spylls e data/sources/*)
A lista de frequência é baixada para data/sources/pt_br_full.txt se faltar.
"""
import sys, json, pathlib, unicodedata, urllib.request, importlib.util, subprocess

ROOT = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / '.vendor'))
SRC = ROOT / 'data' / 'sources'
FREQ_URL = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt_br/pt_br_full.txt'
FORM_MIN = 1      # forma aparece ao menos 1 vez nas legendas
STEM_MIN = 100    # ou a raiz aparece ao menos 100 vezes ...
DIFF_MAX = 3      # ... e a forma difere da raiz em até 3 letras, sem prefixo
ACCENTS = dict.fromkeys(range(0x300, 0x370))
sort_key = lambda w: (unicodedata.normalize('NFD', w).translate(ACCENTS).lower(), w)


def load_download_module():
    spec = importlib.util.spec_from_file_location('dl', ROOT / 'download.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def expand_portuguese():
    """Retorna {forma: (raiz, nº de prefixos, nº de sufixos)} para o português."""
    from spylls.hunspell import Dictionary
    from spylls.hunspell.algo.lookup import AffixForm
    dl = load_download_module()
    d = Dictionary.from_files(str(SRC / 'pt'))
    forbidden = {w.stem for w in d.dic.words if d.aff.FORBIDDENWORD in w.flags}
    forms = {}
    for entry in d.dic.words:
        if not dl.is_word(entry.stem) or entry.stem in forbidden:
            continue
        for form, pre, suf in dl.candidates(entry, d.aff):
            form = unicodedata.normalize('NFC', form)
            if not dl.is_word(form) or form in forbidden or form in forms:
                continue
            parsed = AffixForm(form, entry.stem,
                               prefix=pre[0] if pre else None, prefix2=pre[1] if len(pre) > 1 else None,
                               suffix=suf[0] if suf else None, suffix2=suf[1] if len(suf) > 1 else None,
                               in_dictionary=entry)
            ok = d.lookuper.is_good_form(parsed, None, entry.captype)
            if ok and pre and suf:
                canonical = entry.stem
                for rule in suf:
                    canonical = dl.apply_rule(canonical, rule) if canonical is not None else None
                for rule in pre:
                    canonical = dl.apply_rule(canonical, rule, True) if canonical is not None else None
                ok = canonical == form
            if ok:
                forms[form] = (entry.stem, len(pre), len(suf))
    return forms


def load_frequency():
    path = SRC / 'pt_br_full.txt'
    if not path.exists():
        print('Baixando lista de frequencia (10 MB)', flush=True)
        path.write_bytes(urllib.request.urlopen(FREQ_URL, timeout=120).read())
    freq = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        parts = line.split()
        if len(parts) == 2 and parts[1].isdigit():
            freq[parts[0]] = int(parts[1])
    return freq


def read_list(name):
    path = SRC / name
    return [w for w in path.read_text(encoding='utf-8').splitlines() if w and not w.startswith('#')]


def is_basic(word, info, freq):
    if freq.get(word, 0) >= FORM_MIN:
        return True
    stem, prefixes, _ = info
    return (prefixes == 0 and freq.get(stem, 0) >= STEM_MIN
            and abs(len(word) - len(stem)) <= DIFF_MAX)


def main():
    freq = load_frequency()
    forms = expand_portuguese()
    confirmed = {w for w in read_list('pt-confirmed.txt') if w.isalpha() and w == w.lower()}
    rejected = set(read_list('pt-rejected.txt'))
    pt_all = (set(forms) | confirmed) - rejected
    core = {w for w, info in forms.items() if w in pt_all and is_basic(w, info, freq)} | (confirmed - rejected)
    extra = pt_all - core

    result = {}
    for code in ('es', 'id'):
        result[code] = json.loads((ROOT / 'data' / f'{code}.json').read_text(encoding='utf-8'))
    en = set(json.loads((ROOT / 'data' / 'en.json').read_text(encoding='utf-8')))
    en |= {w for w in read_list('en-solver.txt') if w.isalpha() and w == w.lower()}
    result['en'] = sorted(en, key=sort_key)
    result['pt'] = sorted(core, key=sort_key)
    result = {code: result[code] for code in ('pt', 'es', 'en', 'id')}

    (ROOT / 'data' / 'words.js').write_text(
        'window.DICTIONARIES = ' + json.dumps(result, ensure_ascii=False, separators=(',', ':')) + ';', encoding='utf-8')
    (ROOT / 'data' / 'extras-pt.js').write_text(
        'window.EXTRAS = ' + json.dumps({'pt': sorted(extra, key=sort_key)}, ensure_ascii=False, separators=(',', ':')) + ';',
        encoding='utf-8')
    subprocess.run(['node', str(ROOT / 'pack-data.cjs')], check=True)
    report = {'ptBasic': len(core), 'ptRare': len(extra), 'rules': {'formMin': FORM_MIN, 'stemMin': STEM_MIN, 'diffMax': DIFF_MAX},
              'es': len(result['es']), 'en': len(result['en']), 'id': len(result['id'])}
    (ROOT / 'data' / 'layers-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(report)


if __name__ == '__main__':
    main()
