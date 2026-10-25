const assert=require('node:assert/strict');
const engine=require('./engine.js');
const codes=['pt','es','en'];
const order=(a,b)=>a.key<b.key?-1:a.key>b.key?1:a.word<b.word?-1:a.word>b.word?1:a.code<b.code?-1:a.code>b.code?1:0;
function reference(data,prefix,suffix,enabled,used){
  const p=engine.normalize(prefix),s=engine.normalize(suffix);
  if((!p&&!s)||(p&&!/^[\p{L}]+$/u.test(p))||(s&&!/^[\p{L}]+$/u.test(s)))return [];
  return enabled.flatMap(code=>(data[code]||[]).map(word=>({word,key:engine.normalize(word),code}))).filter(row=>row.key.startsWith(p)&&row.key.endsWith(s)&&!used.has(row.key)).sort(order);
}
(async()=>{
  const fixture={pt:['café','casa','casas','casamente','cade','camarade','aba','ababa','a'],es:['cafe','casa','casas','amable','ababa'],en:['actually','apply','ade','absolutely','box']};
  const small=engine.createIndex(fixture);
  for(const prefix of ['','a','ca','CAFÉ','ababa','x','a1'])for(const suffix of ['','a','as','ade','ly','fé','ababa','x1'])for(const enabled of [codes,['pt'],['en'],[]]){
    const used=new Set(['casa','cafe']);
    const expected=reference(fixture,prefix,suffix,enabled,used);
    const result=engine.search(small,prefix,enabled,used,3,suffix);
    assert.equal(result.total,expected.length,`${prefix}/${suffix}: contagem`);
    assert.deepEqual(result.rows,expected.slice(0,3),`${prefix}/${suffix}: ordem e paginação`);
  }
  console.log('224 combinações de começo/final/idiomas: contagem, acentos, sobreposição, exclusão e paginação aprovadas.');
  const data=await require('./load-data.cjs')();
  assert.deepEqual(Object.keys(data).sort(),['en','es','pt']);
  const index=engine.createIndex(data);
  const cases=[['a',''],['de',''],['os',''],['','ly'],['a','ly'],['c','ade'],['ostent','as'],['','x'],['c','fé'],['zzzz','ade']];
  const used=new Set(['casa','ostentas','actually']);
  for(const [prefix,suffix] of cases){
    const start=performance.now();
    const result=engine.search(index,prefix,codes,used,120,suffix);
    const elapsed=performance.now()-start;
    const p=engine.normalize(prefix),s=engine.normalize(suffix);
    let expected=0;
    for(const code of codes)for(const key of index[code].keys)if(key.startsWith(p)&&key.endsWith(s)&&!used.has(key))expected++;
    assert.equal(result.total,expected,`${prefix}/${suffix}`);
    assert.equal(result.rows.length,Math.min(expected,120));
    assert(result.rows.every(row=>row.key.startsWith(p)&&row.key.endsWith(s)&&!used.has(row.key)));
    assert(result.rows.every((row,i)=>!i||order(result.rows[i-1],row)<=0));
    const shorter=engine.search(index,prefix,codes,used,60,suffix);
    assert.deepEqual(shorter.rows,result.rows.slice(0,60));
    console.log(`${prefix||'∅'} / ${suffix||'∅'}: ${result.total} resultados; busca ${elapsed.toFixed(2)} ms`);
  }
  for(const [code,words] of Object.entries({pt:['ostentas','ostentava','ostentávamos','casas','ações'],es:['hablamos','hablaban','casas'],en:['plays','played','playing','cats','actually']})){
    for(const word of words){
      assert(data[code].includes(word),`Falta ${word}`);
      assert(engine.search(index,engine.normalize(word),[code],new Set(),1000).rows.some(row=>row.word===word));
    }
  }
  const ostent=engine.search(index,'ostent',['pt'],new Set(['ostentar']),10000,'as');
  assert(ostent.rows.some(row=>row.word==='ostentas'));
  assert(!ostent.rows.some(row=>row.word==='ostentar'));
  console.log('Aprovado: três idiomas, flexões preservadas, filtros combinados e memória de palavras usadas.');
  console.log('Entradas:',Object.values(data).reduce((sum,words)=>sum+words.length,0));
})().catch(error=>{console.error(error);process.exitCode=1;});
