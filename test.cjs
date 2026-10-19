(async()=>{
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const engine=require('./engine.js');
const dataLoaded=await require('./load-data.cjs')();
const data=dataLoaded,index=engine.createIndex(data),codes=['pt','es','en','id','fr','it'];
for(const code of codes){assert(data[code].length>10000);for(const word of data[code])assert(/^[\p{L}]+$/u.test(word)&&word===word.toLowerCase());}
for(const prefix of ['a','de','os','ka','ade','café','zzzzzzzz']){const start=performance.now();const got=engine.search(index,prefix,codes,new Set(),60);const key=engine.normalize(prefix);const expected=codes.reduce((n,c)=>n+data[c].filter(w=>engine.normalize(w).startsWith(key)).length,0);assert.equal(got.total,expected);assert(got.rows.every(w=>w.key.startsWith(key)));console.log(prefix,got.total,'results',Math.round(performance.now()-start)+'ms including brute-force verification');}
const result=engine.search(index,'a',codes,new Set(),60);assert.equal(result.rows.length,60);assert.equal(new Set(result.rows.slice(0,6).map(r=>r.code)).size,6);
const chosen=result.rows[0],used=new Set([chosen.key]),after=engine.search(index,'a',codes,used,60);assert(after.rows.every(r=>r.key!==chosen.key));assert(after.total<result.total);
assert.equal(engine.search(index,'a',[],used).total,0);assert.equal(engine.search(index,'',codes,used).total,0);assert.equal(engine.search(index,'a1',codes,used).total,0);
const fixture=engine.createIndex({pt:['café','casa'],en:['cafe']});assert.equal(engine.search(fixture,'ca',['pt','en'],new Set(['cafe'])).total,1);
assert.equal(engine.search(index,'a',codes,new Set(),120).rows.length,120);
const start=performance.now();for(let i=0;i<100;i++)engine.search(index,['a','de','os','ka','ade'][i%5],codes,used);console.log('Average search:',((performance.now()-start)/100).toFixed(2)+'ms');
console.log('All checks passed. Entries:',Object.values(data).reduce((n,w)=>n+w.length,0));

const inflections={pt:['ostentas','ostentava','ostentávamos','casas','ações'],es:['hablamos','hablaban','casas'],en:['plays','played','playing','cats'],fr:['parlons','parlaient','chats'],it:['parliamo','parlavano','gatti'],id:['bukuku','berbuku']};
for(const [code,words] of Object.entries(inflections)){
  for(const word of words){
    assert(data[code].includes(word),`${code}: falta a flexão ${word}`);
    const prefix=engine.normalize(word);
    const result=engine.search(index,prefix,[code],new Set(),1000);
    assert(result.rows.some(row=>row.word===word),`${word} não encontrada sem acentos`);
    const excluded=engine.search(index,prefix,codes,new Set([prefix]),1000);
    assert(excluded.rows.every(row=>row.key!==prefix),`${word} reapareceu depois de usada`);
  }
}
console.log('Flexões dos seis idiomas: busca e exclusão passaram.');

for(const word of ['dehydrateses','reclassifiesed','recurrentlyly','reconsideringing','procreationen'])assert(!data.en.includes(word),`Combinação inválida de afixos: ${word}`);
const manyUsed=new Set(engine.search(index,'a',codes,new Set(),200).rows.map(row=>row.key));
const filtered=engine.search(index,'a',codes,manyUsed,120);
const brute=codes.reduce((sum,code)=>sum+data[code].filter(word=>engine.normalize(word).startsWith('a')&&!manyUsed.has(engine.normalize(word))).length,0);
assert.equal(filtered.total,brute);
console.log('Contagem com múltiplas palavras usadas e rejeição de afixos inválidos passaram.');

const ostent=engine.search(index,'ostent',['pt'],new Set(['ostentar']),10000);
for(const word of ['ostentas','ostentava','ostentávamos'])assert(ostent.rows.some(row=>row.word===word),`Usar o infinitivo deve preservar ${word}`);
assert(!ostent.rows.some(row=>row.word==='ostentar'));
console.log('Selecionar o infinitivo preserva as outras flexões.');

})().catch(error=>{console.error(error);process.exitCode=1;});
