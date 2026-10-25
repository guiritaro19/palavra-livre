const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const data={pt:['casa','casas','ade','café'],es:['amable','casa'],en:['actually','apply','gently','box']};
async function launch(storage=new Map()){
  let document;
  class Element{
    constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.events={};this.value='';this.disabled=true;this.hidden=false;this._text='';}
    append(...items){for(const item of items)this.children.push(...(item.tagName==='FRAGMENT'?item.children:[item]));}
    replaceChildren(...items){this.children=[];this._text='';this.append(...items);}
    set textContent(value){this._text=String(value);this.children=[];}
    get textContent(){return this._text+this.children.map(item=>item.textContent).join('');}
    setAttribute(key,value){this.attributes[key]=value;}
    addEventListener(key,fn){this.events[key]=fn;}
    focus(){document.activeElement=this;}
    click(){(this.onclick||this.events.click)?.();}
  }
  const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(match=>[match[1],new Element(['prefix','suffix'].includes(match[1])?'input':'div')]));
  document={activeElement:new Element(),getElementById:id=>{assert(elements[id],`Falta #${id}`);return elements[id];},createElement:tag=>new Element(tag),createTextNode:text=>{const node=new Element('text');node.textContent=text;return node;},createDocumentFragment:()=>new Element('fragment'),addEventListener(){}};
  const timers=[];
  const context={document,window:{DICTIONARIES:data},WordEngine:require('./engine.js'),sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},confirm:()=>true};
  vm.runInNewContext(fs.readFileSync(__dirname+'/app.js','utf8'),context);await timers.shift()();
  return {elements,storage,type:(id,value)=>{elements[id].value=value;elements[id].events.input();},words:()=>elements.results.children.filter(node=>node.className==='word').map(node=>node.attributes['aria-label'])};
}
(async()=>{
  const ui=await launch();const e=ui.elements;
  assert(!e.prefix.disabled&&!e.suffix.disabled);
  assert.equal(e.languages.children.length,3);assert(!e.languages.textContent.includes('Francês'));
  ui.type('suffix','ly');assert.deepEqual(ui.words(),['Usar actually, Inglês','Usar apply, Inglês','Usar gently, Inglês']);
  ui.type('prefix','a');assert.deepEqual(ui.words(),['Usar actually, Inglês','Usar apply, Inglês']);
  e.results.children[0].click();assert.equal(e['used-count'].textContent,'1');assert.deepEqual(ui.words(),['Usar apply, Inglês']);
  const reloaded=await launch(ui.storage);reloaded.type('prefix','a');reloaded.type('suffix','ly');assert.deepEqual(reloaded.words(),['Usar apply, Inglês']);
  e.undo.click();assert.deepEqual(ui.words(),['Usar actually, Inglês','Usar apply, Inglês']);
  e['clear-suffix'].click();assert.equal(e.suffix.value,'');assert.equal(e.prefix.value,'a');assert(ui.words().some(word=>word.includes('amable')));
  ui.type('suffix','a1');assert(e.results.textContent.includes('Use apenas letras'));
  e.reset.click();assert.equal(e.prefix.value,'');assert.equal(e.suffix.value,'');assert.equal(e['used-count'].textContent,'0');
  console.log('Controles aprovados: três idiomas, final sozinho, filtros combinados, clique, recarga, desfazer, limpar final e nova sessão.');
})().catch(error=>{console.error(error);process.exitCode=1;});
