import sys, pathlib, unicodedata, json, time, concurrent.futures, urllib.request, subprocess
ROOT = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / '.vendor'))
from spylls.hunspell import Dictionary
from spylls.hunspell.algo.lookup import AffixForm
CODES = ['pt','es','en']
ACCENTS=dict.fromkeys(range(0x300,0x370))

def is_word(word):
    return len(word) >= 2 and word.isalpha() and word == word.lower()

def apply_rule(text, rule, prefix=False):
    if not rule.cond_regexp.search(text): return None
    if rule.strip:
        if prefix:
            if not text.startswith(rule.strip): return None
        elif not text.endswith(rule.strip): return None
        if len(rule.strip) == len(text): return None
    if prefix: return rule.add + text[len(rule.strip):]
    return (text[:-len(rule.strip)] if rule.strip else text) + rule.add

def candidates(entry, aff):
    # Hunspell permits up to two suffixes and one prefix, or the reverse
    # when COMPLEXPREFIXES is declared. Continuation flags control chains.
    max_p, max_s = (2,1) if aff.COMPLEXPREFIXES else (1,2)
    queue=[(entry.stem, entry.flags, (), (), True)]
    visited=set()
    while queue:
        text, flags, prefixes, suffixes, cross = queue.pop()
        p,s=len(prefixes),len(suffixes)
        state=(text, frozenset(flags), tuple(id(a) for a in prefixes), tuple(id(a) for a in suffixes), cross)
        if state in visited: continue
        visited.add(state)
        yield text, prefixes, suffixes
        for prefix, table, count, maximum, opposite in [(False,aff.SFX,s,max_s,p),(True,aff.PFX,p,max_p,s)]:
            if count >= maximum: continue
            for flag in sorted(flags):
                for rule in table.get(flag,[]):
                    previous=prefixes if prefix else suffixes
                    if previous and rule.flag not in previous[-1].flags: continue
                    if opposite and not (cross and rule.crossproduct): continue
                    result=apply_rule(text,rule,prefix)
                    if result is None or not result.isalpha() or result != result.lower(): continue
                    # Applied flags are consumed; opposite-side root flags are retained.
                    opposite_flags={f for f in entry.flags if f in (aff.SFX if prefix else aff.PFX)}
                    next_flags=set(rule.flags)|opposite_flags
                    queue.append((result,next_flags,prefixes+(rule,) if prefix else prefixes,suffixes if prefix else suffixes+(rule,),cross and rule.crossproduct))

def load(code):
    start=time.monotonic()
    cache=ROOT/'data'/'sources'; cache.mkdir(exist_ok=True)
    base=f'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/{code}/' if code!='id' else 'https://raw.githubusercontent.com/shuLhan/hunspell-id/main/'
    for ext in ['dic','aff']:
        path=cache/f'{code}.{ext}'
        if not path.exists():
            name=f'index.{ext}' if code!='id' else f'id_ID.{ext}'
            path.write_bytes(urllib.request.urlopen(base+name,timeout=60).read())
    dictionary=Dictionary.from_files(str(cache/code))
    words=set(); total_candidates=0
    forbidden={w.stem for w in dictionary.dic.words if dictionary.aff.FORBIDDENWORD in w.flags}
    for n,entry in enumerate(dictionary.dic.words):
        if not is_word(entry.stem) or entry.stem in forbidden: continue
        for form,prefixes,suffixes in candidates(entry,dictionary.aff):
            form=unicodedata.normalize('NFC',form)
            if not is_word(form) or form in forbidden or form in words: continue
            total_candidates+=1
            parsed=AffixForm(form,entry.stem,
                prefix=prefixes[0] if prefixes else None,
                prefix2=prefixes[1] if len(prefixes)>1 else None,
                suffix=suffixes[0] if suffixes else None,
                suffix2=suffixes[1] if len(suffixes)>1 else None,
                in_dictionary=entry)
            valid=dictionary.lookuper.is_good_form(parsed,None,entry.captype)
            if valid and prefixes and suffixes:
                # Verify this exact legal decomposition instead of searching all
                # 25,000+ suffix rules again for every Portuguese word.
                canonical=entry.stem
                for rule in suffixes:
                    canonical=apply_rule(canonical,rule) if canonical is not None else None
                for rule in prefixes:
                    canonical=apply_rule(canonical,rule,True) if canonical is not None else None
                valid=canonical == form
            if valid: words.add(form)
        if n and n%10000==0:
            print(f'{code}: {n} stems; {len(words)} valid forms; {time.monotonic()-start:.1f}s',flush=True)
    target=ROOT/'data'/f'{code}.json'
    target.write_text(json.dumps(sorted(words,key=lambda w:(unicodedata.normalize('NFD',w).translate(ACCENTS).lower(),w)),ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    report={'words':len(words),'candidates':total_candidates,'seconds':round(time.monotonic()-start,1)}
    print(f'{code}: {report}',flush=True)
    return code, report

if __name__=='__main__':
    selected=sys.argv[1:] or CODES
    with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:
        reports=dict(pool.map(load,selected))
    if all((ROOT/'data'/f'{code}.json').exists() for code in CODES):
        result={code:json.loads((ROOT/'data'/f'{code}.json').read_text(encoding='utf-8')) for code in CODES}
        target=ROOT/'data'/'words.js'
        temporary=target.with_suffix('.tmp')
        temporary.write_text('window.DICTIONARIES = '+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';',encoding='utf-8')
        temporary.replace(target)
        subprocess.run(['node', str(ROOT/'pack-data.cjs')],check=True)
    (ROOT/'data'/'expansion-report.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')
