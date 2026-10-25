const LANGUAGES = [{code:'pt',name:'Português',flag:'br'},{code:'es',name:'Espanhol',flag:'es'},{code:'en',name:'Inglês',flag:'gb'}];
const $ = id => document.getElementById(id);
const STORAGE='palavra-livre.session.v1';
const enabled=new Set(LANGUAGES.map(l=>l.code));
let history=[],index,limit=60,toastTimer;
try {const saved=JSON.parse(sessionStorage.getItem(STORAGE)||'[]');if(Array.isArray(saved))history=saved.filter(x=>x&&typeof x.word==='string'&&/^[\p{L}]+$/u.test(x.word)&&LANGUAGES.some(l=>l.code===x.code));}catch{}
const used=()=>new Set(history.map(x=>WordEngine.normalize(x.word)));
function save(){try{sessionStorage.setItem(STORAGE,JSON.stringify(history));}catch{notify('Memória da aba indisponível. A sessão será mantida até atualizar a página.');}}
function flag(language){const img=document.createElement('img');img.className='flag';img.src=`flags/${language.flag}.svg`;img.alt='';return img;}
function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2200);}
for(const language of LANGUAGES){const b=document.createElement('button');b.className='language';b.type='button';b.append(flag(language),document.createTextNode(language.name));b.setAttribute('aria-pressed','true');b.addEventListener('click',()=>{if(enabled.has(language.code))enabled.delete(language.code);else enabled.add(language.code);b.setAttribute('aria-pressed',String(enabled.has(language.code)));limit=60;render();});$('languages').append(b);}
function renderHistory(){
  $('used-count').textContent=history.length;$('undo').disabled=!history.length;$('used-empty').hidden=!!history.length;
  $('used-list').replaceChildren(...history.slice().reverse().map(row=>{const item=document.createElement('span');item.className='used-item';item.append(flag(LANGUAGES.find(l=>l.code===row.code)),document.createTextNode(row.word));return item;}));
}
function empty(title,description,examples=false){const box=document.createElement('div');box.className='empty';const strong=document.createElement('strong');strong.textContent=title;const p=document.createElement('p');p.textContent=description;box.append(strong,p);if(examples){const wrap=document.createElement('div');wrap.className='examples';for(const prefix of ['a','de','ka','ade']){const b=document.createElement('button');b.textContent=prefix;b.onclick=()=>{$('prefix').value=prefix;limit=60;render();$('prefix').focus();};wrap.append(b);}box.append(wrap);}return box;}
function render(){
  if(!index)return;
  const prefix=$('prefix').value.trim(),suffix=$('suffix').value.trim(),key=WordEngine.normalize(prefix),ending=WordEngine.normalize(suffix);$('clear').hidden=!prefix;$('clear-suffix').hidden=!suffix;$('more').hidden=true;
  if(!prefix&&!suffix){$('result-title').textContent='Sua próxima palavra';$('result-count').textContent='';$('results').replaceChildren(empty('Como é a sua palavra?','Digite o começo, o final ou os dois para encontrar sua próxima jogada.',true));return;}
  $('result-title').textContent=prefix&&suffix?`De “${prefix}” a “${suffix}”`:prefix?`Começando com “${prefix}”`:`Terminando com “${suffix}”`;
  const found=WordEngine.search(index,prefix,enabled,used(),limit,suffix);$('result-count').textContent=`${found.total.toLocaleString('pt-BR')} resultados`;
  if(!found.total){$('results').replaceChildren(empty(!enabled.size?'Escolha um idioma':'Nenhuma palavra disponível',!enabled.size?'Ative um dos idiomas acima para pesquisar.':((key&&!/^[\p{L}]+$/u.test(key))||(ending&&!/^[\p{L}]+$/u.test(ending)))?'Use apenas letras, sem espaços ou números.':'Tente outro começo ou final, ative mais idiomas ou desfaça uma palavra usada.'));return;}
  const fragment=document.createDocumentFragment();
  for(const row of found.rows){const language=LANGUAGES.find(l=>l.code===row.code),button=document.createElement('button');button.className='word';button.type='button';button.setAttribute('aria-label',`Usar ${row.word}, ${language.name}`);const main=document.createElement('span');main.className='word-main';const text=document.createElement('span');text.className='word-text';let start=0;while(start<row.word.length){const highlighted=position=>(key&&position<key.length)||(ending&&position>=row.word.length-ending.length);let end=start+1;while(end<row.word.length&&Boolean(highlighted(end))===Boolean(highlighted(start)))end++;const part=highlighted(start)?document.createElement('mark'):document.createElement('span');part.textContent=row.word.slice(start,end);text.append(part);start=end;}const name=document.createElement('span');name.className='word-language';name.textContent=language.name;main.append(text,name);const tail=document.createElement('span');tail.className='word-tail';const plus=document.createElement('span');plus.className='plus';plus.textContent='+';plus.setAttribute('aria-hidden','true');tail.append(flag(language),plus);button.append(main,tail);button.addEventListener('click',()=>{if(used().has(row.key))return;history.push({word:row.word,code:row.code});save();renderHistory();render();notify(`${row.word} foi jogada`);$('prefix').focus();});fragment.append(button);}
  $('results').replaceChildren(fragment);$('more').hidden=found.rows.length>=found.total;
}
for(const id of ['prefix','suffix'])$(id).addEventListener('input',()=>{limit=60;render();});
$('clear').onclick=()=>{$('prefix').value='';limit=60;render();$('prefix').focus();};
$('clear-suffix').onclick=()=>{$('suffix').value='';limit=60;render();$('suffix').focus();};
$('more').onclick=()=>{limit+=60;render();};
$('undo').onclick=()=>{const last=history.pop();if(!last)return;save();renderHistory();render();notify(`${last.word} voltou para a busca`);};
$('reset').onclick=()=>{if(history.length&&!confirm('Começar uma nova sessão e liberar todas as palavras usadas?'))return;history=[];save();$('prefix').value='';$('suffix').value='';limit=60;renderHistory();render();$('prefix').focus();};
document.addEventListener('keydown',event=>{if(event.key==='/'&&document.activeElement.tagName!=='INPUT'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();$('prefix').focus();}});
renderHistory();
setTimeout(async()=>{try{if(window.WORDS_READY)await window.WORDS_READY;if(!window.DICTIONARIES)throw Error('missing');index=WordEngine.createIndex(window.DICTIONARIES);const total=Object.values(window.DICTIONARIES).reduce((sum,words)=>sum+words.length,0);$('dictionary-count').textContent=`${total.toLocaleString('pt-BR')} entradas · 3 idiomas · busca local`;$('prefix').disabled=false;$('suffix').disabled=false;render();$('prefix').focus();}catch{$('result-count').textContent='Não foi possível carregar os dicionários.';$('results').replaceChildren(empty('Os dicionários não carregaram','Confira se a pasta data está junto do site e atualize a página.'));}},0);
