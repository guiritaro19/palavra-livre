(function(root){
  const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const compare=(a,b)=>a<b?-1:a>b?1:0;
  function createIndex(data){
    return Object.fromEntries(Object.entries(data).map(([code,words])=>{
      const keys=words.map(normalize);
      let sorted=true;for(let i=1;i<keys.length;i++){if(keys[i-1]>keys[i]){sorted=false;break;}}
      if(sorted)return [code,{words,keys}];
      const order=Uint32Array.from({length:words.length},(_,i)=>i);
      order.sort((a,b)=>compare(keys[a],keys[b])||compare(words[a],words[b]));
      return [code,{words:Array.from(order,i=>words[i]),keys:Array.from(order,i=>keys[i])}];
    }));
  }
  function lowerBound(keys,key){let lo=0,hi=keys.length;while(lo<hi){const mid=(lo+hi)>>>1;if(keys[mid]<key)lo=mid+1;else hi=mid;}return lo;}
  function upperBound(keys,key){let lo=0,hi=keys.length;while(lo<hi){const mid=(lo+hi)>>>1;if(keys[mid]<=key)lo=mid+1;else hi=mid;}return lo;}
  function search(index,prefix,enabled,used,limit=60){
    const key=normalize(prefix);if(!key||!/^[\p{L}]+$/u.test(key))return {rows:[],total:0};
    const groups=[];let total=0;
    const blocked=[...used].filter(word=>word.startsWith(key));
    for(const code of enabled){
      const bucket=index[code];if(!bucket)continue;
      const {words,keys}=bucket,start=lowerBound(keys,key),end=lowerBound(keys,key+'\uffff');
      total+=end-start;
      for(const word of blocked)total-=upperBound(keys,word)-lowerBound(keys,word);
      const matches=[];
      for(let i=start;i<end&&matches.length<limit;i++)if(!used.has(keys[i]))matches.push({word:words[i],key:keys[i],code});
      groups.push(matches);
    }
    const rows=[];
    for(let i=0;rows.length<limit;i++){let found=false;for(const group of groups){if(group[i]){found=true;rows.push(group[i]);if(rows.length===limit)break;}}if(!found)break;}
    return {rows,total};
  }
  const api={normalize,createIndex,search};if(typeof module!=='undefined')module.exports=api;else root.WordEngine=api;
})(typeof window!=='undefined'?window:globalThis);
