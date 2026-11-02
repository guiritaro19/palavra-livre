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
  function search(index,prefix,enabled,used,limit=60,suffix='',sort='alphabetical'){
    const key=normalize(prefix),ending=normalize(suffix);
    if((!key&&!ending)||(key&&!/^[\p{L}]+$/u.test(key))||(ending&&!/^[\p{L}]+$/u.test(ending)))return {rows:[],total:0};
    const lengthDirection=sort==='length-asc'?1:sort==='length-desc'?-1:0;
    const letterCount=key=>Array.from(key).length;
    const groups=[];let total=0;
    const blocked=[...used].filter(word=>word.startsWith(key));
    for(const code of enabled){
      const bucket=index[code];if(!bucket)continue;
      const {words,keys}=bucket,start=key?lowerBound(keys,key):0,end=key?lowerBound(keys,key+'\uffff'):keys.length;
      const matches=[];
      if(lengthDirection){
        // Keep the first page per length, then order before paginating.
        const lengths=new Map();
        for(let i=start;i<end;i++)if((!ending||keys[i].endsWith(ending))&&!used.has(keys[i])){
          total++;
          const length=letterCount(keys[i]);
          if(!lengths.has(length))lengths.set(length,[]);
          const bucket=lengths.get(length);
          if(bucket.length<limit)bucket.push({word:words[i],key:keys[i],code});
        }
        for(const length of [...lengths.keys()].sort((a,b)=>lengthDirection*(a-b))){
          for(const row of lengths.get(length)){
            if(matches.length>=limit)break;
            matches.push(row);
          }
          if(matches.length>=limit)break;
        }
      }else if(!ending){
        total+=end-start;
        for(const word of blocked)total-=upperBound(keys,word)-lowerBound(keys,word);
        for(let i=start;i<end&&matches.length<limit;i++)if(!used.has(keys[i]))matches.push({word:words[i],key:keys[i],code});
      }else{
        for(let i=start;i<end;i++)if(keys[i].endsWith(ending)&&!used.has(keys[i])){
          total++;if(matches.length<limit)matches.push({word:words[i],key:keys[i],code});
        }
      }
      groups.push({matches,position:0});
    }
    const rows=[];
    // Merge language lists in the selected order before applying the page limit.
    while(rows.length<limit){
      let selected=null;
      for(const group of groups){
        const row=group.matches[group.position];if(!row)continue;
        const best=selected?.matches[selected.position];
        const difference=best?(lengthDirection*(letterCount(row.key)-letterCount(best.key))||compare(row.key,best.key)||compare(row.word,best.word)||compare(row.code,best.code)):-1;
        if(difference<0)selected=group;
      }
      if(!selected)break;rows.push(selected.matches[selected.position++]);
    }
    return {rows,total};
  }
  const api={normalize,createIndex,search};if(typeof module!=='undefined')module.exports=api;else root.WordEngine=api;
})(typeof window!=='undefined'?window:globalThis);
